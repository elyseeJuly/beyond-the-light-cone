# TASK-AP: 执政指令点 (AP) 与 AI 智脑托管系统

> **优先级**: P1（核心玩法迭代）  
> **依赖**: 无（独立子系统，但建议在 TASK-P0 完成后进行）  
> **来源**: [SPEC_20260623_CORE_LOOP_ITERATION.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260623_CORE_LOOP_ITERATION.md)  
> **预估影响范围**: 8 文件，约 600 行新增 + 300 行修改  
> **AI 接手指引**: 本任务分为 4 个阶段，每个阶段可独立实现和验证。

---

## 概述

当前游戏所有操作无成本，玩家可随意调整人口分配、切换科研目标，"过回合"无任何有意义决策。本任务引入两个核心机制：

1. **AP（执政指令点）**：所有微操消耗 AP，模拟政治/行政资源
2. **AI 智脑托管**：将旧版自动分配逻辑包装为世界观契合的辅助系统，给玩家"微操"与"挂机"的双重自由

---

## 阶段 1：数据模型与持久化

### 1.1 修改 `EarthCivilization.ts`

在 [EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L15) 的 `EarthCivilization` 类中新增字段：

```typescript
/** 执政指令点上限 */
public apMax: number = 100;
/** 当前可用指令点 */
public apCurrent: number = 100;
/** AI 智脑是否开启（true = 自动驾驶，false = 手动模式） */
public isAiBrainEnabled: boolean = true;
```

### 1.2 修改 `SaveSchema.ts`

在 [SaveSchema.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SaveSchema.ts) 中确认 `saveMetaSchema` 不需要修改（AP 是游戏状态字段，随 `data` JSON 序列化）。但需在 `savePackageSchema` 或 `saveMetaSchema` 中增加版本号识别，以便后续 AP 系统变更时可做存档迁移。

### 1.3 修改 `SaveManager.ts`

在 [SaveManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SaveManager.ts) 的 `saveMetaSchema` 中新增字段：

```typescript
apCurrent: z.number().default(100),
apMax: z.number().default(100),
isAiBrainEnabled: z.boolean().default(true),
```

### 验证

- 新游戏初始 AP = 100/100
- 存档 → 读档后 AP 值不变
- `isAiBrainEnabled` 状态正确持久化

---

## 阶段 2：AP 消耗与恢复逻辑

### 2.1 每回合恢复 AP

在 `EarthCivilization.runARound()` 中，回合开始时恢复 AP：

```typescript
// 回合恢复 AP
const baseRecovery = 30;
const departmentBonus = this.getDepartmentBonus(); // 部门首长加成
const cultureBonus = Math.floor(this.culture / 100); // 每 100 文化 +1 AP
this.apCurrent = Math.min(this.apMax, this.apCurrent + baseRecovery + departmentBonus + cultureBonus);
```

`getDepartmentBonus()` 实现：遍历 `departments` Map，如果部门有首长，每个 +5 AP。

### 2.2 操作消耗 AP

在以下操作点增加 AP 消耗检查：

| 操作 | 消耗 AP | 代码位置 |
|------|---------|---------|
| 调整人口分配（采矿/工厂/文化） | 10 | `EarthCivilization.allocateWorkers()` |
| 指派科研目标 | 20 | `EarthCivilization.setResearchTarget()` |
| 加速星系建设 | 30 | `StarManager` 或建设相关方法 |
| 强硬外交选项 | 视事件定义 | `GameEventManager` 或 `StoryModal` |

每个操作点增加前置检查：

```typescript
if (this.apCurrent < cost) {
  // 如果 AI 智脑开启，不阻断；否则通知 UI
  if (!this.isAiBrainEnabled) {
    window.dispatchEvent(new CustomEvent('ap-insufficient', { 
      detail: { required: cost, current: this.apCurrent } 
    }));
  }
  return; // 操作不执行
}
this.apCurrent -= cost;
```

### 2.3 事件选项中的 AP 消耗

修改 `EventEffect` 接口（在 `types/enums.ts` 或 `narrative.ts` 中），增加 `apCost` 字段：

```typescript
// 事件选项增加 AP 消耗
choices: [
  { label: "强硬镇压", effects: [...], apCost: 30 },
  { label: "外交斡旋", effects: [...], apCost: 10 },
  { label: "不予理会", effects: [...], apCost: 0 },
]
```

在 `Game.applyEventEffect()` 中处理 AP 消耗。

### 验证

- 手动操作后 AP 正确减少
- AP 不足时操作被阻止（手动模式）或跳过（AI 模式）
- 下一回合 AP 正确恢复

---

## 阶段 3：AI 智脑托管系统

### 3.1 在 `Game.ts` 中新增 `runAIBrain()` 方法

```typescript
/**
 * AI 智脑托管：自动消耗剩余 AP 维持国家运转
 * 在 runARound 起始阶段按需调用
 */
public runAIBrain(): void {
  if (!this.earthCivi.isAiBrainEnabled) return;
  
  const civi = this.earthCivi;
  const actions: string[] = [];
  
  // 1. 科研停滞 → 自动选科技
  if (civi.isResearchIdle() && civi.apCurrent >= 20) {
    const best = civi.pickBestResearch();
    if (best) {
      civi.setResearchTarget(best.tree, best.node);
      civi.apCurrent -= 20;
      actions.push(`[AI智脑] 已自动将科研重心转移至『${best.node}』`);
    }
  }
  
  // 2. 资源崩盘预警 → 自动调高采矿比例
  if (civi.miningRatio < 50 && civi.apCurrent >= 10) {
    const boost = Math.min(20, 100 - civi.miningRatio - civi.factoryRatio - civi.cultureRatio);
    if (boost > 0) {
      civi.miningRatio += boost;
      civi.cultureRatio = Math.max(0, civi.cultureRatio - boost);
      civi.apCurrent -= 10;
      actions.push(`[AI智脑] 资源紧张，已自动将采矿比例提升至 ${civi.miningRatio}%`);
    }
  }
  
  // 3. 部门首长空缺 → 自动指派（如有可用人选）
  // ... 
  
  // 4. 经济过低 → 自动调高工厂比例
  // ...
  
  // 将 AI 决策记录到 ticker 消息
  for (const action of actions) {
    this.tickerMessages.push(action);
  }
}
```

### 3.2 AI 智脑开关 UI

在 `TopHUD` 组件中增加 AI 智脑开关：

```tsx
// 伪代码
<button 
  className={`ai-brain-toggle ${civi.isAiBrainEnabled ? 'active' : ''}`}
  onClick={() => civi.isAiBrainEnabled = !civi.isAiBrainEnabled}
>
  {civi.isAiBrainEnabled ? '✅ 智脑运行中' : '⏸ 手动执政'}
</button>
```

开关切换时 dispatch 事件通知其他组件。

### 3.3 回合阻断器（手动模式）

在 `Game.runARound()` 中，如果 `isAiBrainEnabled === false`，检查是否有必须处理的事务：

```typescript
if (!this.earthCivi.isAiBrainEnabled) {
  const blockers = this.getTurnBlockers();
  if (blockers.length > 0) {
    window.dispatchEvent(new CustomEvent('turn-blocked', { 
      detail: { blockers } 
    }));
    return; // 不推进回合
  }
}
```

`getTurnBlockers()` 检查：
- 科研停滞（无研究项目）
- 部门首长空缺
- 资源崩盘预警（下回合经济或资源将归零）
- 未决事件（有弹窗事件未处理）

### 验证

- AI 智脑开启时，回合自动推进，AP 自动消耗
- AI 智脑关闭时，有未处理事务则回合被阻断
- Ticker 消息正确显示 AI 决策
- 开关状态正确持久化

---

## 阶段 4：UI 落地

### 4.1 TopHUD AP 进度条

在 [TopHUD 组件](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx) 中增加 AP 进度槽：

```tsx
<div className="ap-bar">
  <div className="ap-label">指令点</div>
  <div className="ap-track">
    <div 
      className="ap-fill" 
      style={{ width: `${(civi.apCurrent / civi.apMax) * 100}%` }}
    />
  </div>
  <div className="ap-text">{civi.apCurrent}/{civi.apMax}</div>
</div>
```

### 4.2 事件弹窗 AP 消耗显示

在 [StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StoryModal.tsx) 中，如果选项有 `apCost`，显示消耗：

```tsx
<button disabled={civi.apCurrent < choice.apCost}>
  {choice.label}
  {choice.apCost > 0 && <span className="ap-cost">-{choice.apCost} AP</span>}
</button>
```

### 4.3 回合阻断弹窗

当 `turn-blocked` 事件触发时，显示阻断弹窗，列出所有待处理事务，玩家可选择：
- "逐一处理"（关闭弹窗，让玩家手动处理）
- "开启 AI 智脑"（自动处理全部）

### 验证

- AP 进度条随操作实时更新
- AP 不足的选项按钮灰色不可点击
- 回合阻断弹窗正确显示待处理事务列表

---

## 完成标准

- [ ] `EarthCivilization` 新增 `apMax` / `apCurrent` / `isAiBrainEnabled` 字段
- [ ] 每回合 AP 恢复逻辑正确
- [ ] 人口分配 / 科研指派 / 建设加速消耗 AP
- [ ] 事件选项支持 `apCost` 字段
- [ ] `runAIBrain()` 自动决策功能完整
- [ ] TopHUD 显示 AP 进度条 + AI 智脑开关
- [ ] 手动模式下回合阻断器工作正常
- [ ] 存档/读档 AP 状态正确持久化
- [ ] `npx vitest run` 全部通过，无回归

---

*本任务书基于 [SPEC_20260623_CORE_LOOP_ITERATION.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260623_CORE_LOOP_ITERATION.md) 编写。*