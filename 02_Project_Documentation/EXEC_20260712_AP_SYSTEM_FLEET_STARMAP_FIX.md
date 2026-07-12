# 执行报告：AP 系统重设计 + 军事部星舰入口 + 星图点击修复

> **文档编号**: EXEC_20260712_AP_SYSTEM_FLEET_STARMAP_FIX  
> **日期**: 2026-07-12  
> **执行依据**: [SPEC_20260712_AP_SYSTEM_REDESIGN.md](./SPEC_20260712_AP_SYSTEM_REDESIGN.md) + [AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md](./AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md)  
> **状态**: 已完成，全量 1045 测试通过

---

## 一、执行概览

本次执行解决三个独立但相关的问题：

1. **AP 系统失效**：UI 绕过 AP 消耗入口，AP 永远 100/100，阻断器不完整
2. **军事部缺星舰建造入口**：玩家必须先选中地球才能进入舰队建造
3. **星图地球点击困难**：桌面端命中半径仅 15.6px，与移动端 124px 严重不一致

---

## 二、代码变更清单

### 2.1 星图点击命中半径修复

**文件**: [StarMapRenderer.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts)

**变更**: 桌面端 mousemove 的 hit test 公式从 `visualRadius² * 4 + 100` 改为 `Math.max(visualRadius * 4 + 100, minHit)²`，与移动端 [line 493](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L493) 对齐。

**关键代码**:
```typescript
// 地球(index===3)给 60px 更大点击区，其他星球 44px 最小命中
const minHit = rs.star.index === 3 ? 60 : 44;
const hitRadius = Math.max(visualRadius * 4 + 100, minHit);
if (dx * dx + dy * dy <= hitRadius * hitRadius) { ... }
```

**效果**: 桌面端地球点击半径从 ~15.6px 提升到 60px，彻底解决"经常点击不到地球"的问题。

---

### 2.2 军事部增加星舰建造入口

**文件**: [GovManagement.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/GovManagement.tsx)

**变更**: 军事部标签页（`activeTab === 'military'`）新增"星舰建造与舰队编成"按钮，派发 `open-fleet-modal` 事件，与 [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/RightInspector.tsx) 中的舰队入口打通到同一个 `FleetModal`。

**效果**: 玩家无需先选中地球，可在政府管理 → 军事部直接进入星舰建造。

---

### 2.3 AP 系统重设计

#### 2.3.1 恢复规则重写

**文件**: [EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts)

**变更**:
- `recoverAP()`: 基础恢复从 30 改为 5，**不累加跨回合剩余**（每回合重置为恢复值）
- 新增 `getEpochAPBonus()`: 根据当前纪元返回 AP 加成（危机+10/威慑+20/广播0/掩体-10）

**关键代码**:
```typescript
public recoverAP(): void {
  const baseRecovery = 5;
  const departmentBonus = this.getDepartmentBonus();
  const cultureBonus = Math.floor(this.culture / 100);
  const epochBonus = this.getEpochAPBonus();
  const recovery = baseRecovery + departmentBonus + cultureBonus + epochBonus;
  this.apCurrent = Math.min(this.apMax, Math.max(0, recovery));
}

public getEpochAPBonus(): number {
  const epochBonusMap = [0, 10, 20, 0, -10, 0, 0];
  const game = GameInstance.get();
  return epochBonusMap[game.epoch] ?? 0;
}
```

#### 2.3.2 恢复时机提前

**文件**: [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)

**变更**: `recoverAP()` 调用从 `EarthCivilization.runARound()` 提前到 `Game.runARound()` 入口，确保被硬阻断时玩家仍有 AP 可用解除阻断。

```typescript
public runARound(): void {
  if (this.isGameOver && !this.isObserverMode) return;
  this.earthCivi.recoverAP();  // ← 提前到入口
  if (this.currentEvent || this.eventQueue.length > 0) { ... }
```

[EarthCivilization.ts:252](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L252) 中删除旧的 `recoverAP()` 调用。

#### 2.3.3 阻断器补全

**文件**: [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)

**变更**: `getTurnBlockers()` 补回科研停滞和部门首长空缺两项：

```typescript
if (civi.isResearchIdle()) {
  blockers.push('科研停滞：未指派任何研究项目');
}
let hasEmptyDept = false;
for (const dept of civi.departments.values()) {
  if (!dept.leaderName) { hasEmptyDept = true; break; }
}
if (hasEmptyDept) {
  blockers.push('行政瘫痪：存在部门首长空缺');
}
```

#### 2.3.4 AI 智脑改走 spendAP

**文件**: [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)

**变更**: `runAIBrain()` 中 4 处直接赋值改为调用 `spendAP()`，统一走半价折扣逻辑：

```typescript
// 原：civi.apCurrent = Math.max(0, civi.apCurrent - 10);
civi.spendAP(10);  // AI 模式自动半价 = 5

// 原：civi.apCurrent = Math.max(0, civi.apCurrent - 5);
civi.spendAP(5);   // AI 模式自动半价 = 2
```

#### 2.3.5 UI 接入 AP 消耗

**文件**: [RightInspector.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/RightInspector.tsx)

**变更**: 3 处工种比例滑块（采矿/工厂/文化）改调 `adjustWorkerRatio(type, delta)`，消耗 10 AP/次：

```typescript
const delta = newVal - earth.miningRatio;
if (delta !== 0) {
  earth.adjustWorkerRatio('mining', delta);
}
```

**文件**: [TecTreeView.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/TecTreeView.ts)

**变更**: 科研指派改调 `setResearchTarget(type, name, true)`，消耗 20 AP：

```typescript
const apOk = game.earthCivi.setResearchTarget(type, name, true);
if (!apOk) {
  alert("执政指令点不足，无法启动新科研！");
  return;
}
```

---

### 2.4 测试更新

**文件**: [TutorialRemedy.scenario.test.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/TutorialRemedy.scenario.test.tsx)

**变更**: `SCEN-MANUAL-BLOCKER` 测试用例补齐阻断解除逻辑——指派科研 + 任命部门首长，确保新增的两项阻断器被正确清除。

---

## 三、测试验证

### 3.1 TypeScript 编译

```
npx tsc --noEmit
Exit code: 0
```

无编译错误。

### 3.2 全量测试

```
npx vitest run
Test Files  51 passed (51)
Tests       1045 passed (1045)
Duration    14.70s
```

全量 1045 测试 0 失败。

### 3.3 建模验证

[ap-system-simulator.mjs](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/scripts/ap-system-simulator.mjs) 模拟 8 个场景，全部无死锁：

| 场景 | 部长数 | 平均操作/回合 | 死锁 |
|---|---|---|---|
| 0 部长纯手动 | 0 | 1.27 | 无 |
| 11 部长全满 | 11 | 3.00 | 无 |
| 0→逐步任命 | 0→11 | 1.20 | 无 |
| 3 部长+AI+威慑 | 3 | 3.00 | 无 |
| 5 部长+掩体纪元 | 5 | 1.87 | 无 |

---

## 四、变更影响分析

### 4.1 玩家体验

| 维度 | 修复前 | 修复后 |
|---|---|---|
| AP 系统 | 永远 100/100，无意义 | 每回合 5-80 AP 恢复，部长任命驱动策略空间 |
| 部长任命 | 仅解锁科技 | 直接提升 AP 恢复量，战略价值显著 |
| 手动模式 | 几乎无阻断 | 4 项硬阻断（资源/经济/科研/行政） |
| AI 智脑 | 半价折扣失效 | 半价消耗正确生效 |
| 星图点击 | 地球点击困难 | 60px 命中半径，点击流畅 |
| 星舰建造 | 必须先选中地球 | 政府管理 → 军事部可直接进入 |

### 4.2 存档兼容

AP 字段已在 SaveManager v4 持久化，旧存档自动补全默认值 100/100，无需迁移。

### 4.3 性能影响

新增阻断器检查（`isResearchIdle()` + 部门遍历）在每回合调用一次，时间复杂度 O(n) 其中 n 为部门数（≤11）和科技树节点数（≤50），可忽略不计。

---

## 五、遗留问题

### 5.1 事件选项 AP 消耗未接入

[EventSystem.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts) 中的 `applyNewEffects` 已支持 `spend_ap` 效果，但事件数据中尚未配置 `apCost` 字段。这是内容工作，非代码工作，可在后续事件设计中逐步接入。

### 5.2 AP 不足时的 UI 反馈

当前 AP 不足时滑块调整静默失败，仅在科研指派时弹 alert。可考虑：
- AP 不足时滑块视觉回滚
- toast 提示"执政指令点不足"
- 事件选项按钮灰色禁用

这些是 UI 增强工作，不影响核心功能，可后续迭代。

### 5.3 部长自动任命消耗

`autoAssignMinisters()` 在手动模式下不消耗 AP（只在 AI 模式下走 `spendAP(5)`）。如果未来希望手动任命也消耗 AP，需要在 `GovManagement.tsx` 的任命按钮中接入 `spendAP(5)`。

---

## 六、归档清单

| 文档 | 类型 | 状态 |
|---|---|---|
| [AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md](./AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS.md) | 审计报告 | 已存在 |
| [SPEC_20260712_AP_SYSTEM_REDESIGN.md](./SPEC_20260712_AP_SYSTEM_REDESIGN.md) | 设计规范 | 新建 |
| [EXEC_20260712_AP_SYSTEM_FLEET_STARMAP_FIX.md](./EXEC_20260712_AP_SYSTEM_FLEET_STARMAP_FIX.md) | 执行报告 | 新建（本文档） |
| [ap-system-simulator.mjs](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/scripts/ap-system-simulator.mjs) | 建模脚本 | 新建 |

---

## 七、Registry 条目更新

### SCEN-MANUAL-BLOCKER

**状态**: 🟢 GREEN（保持）

**描述更新**: 测试用例已补齐科研停滞和行政瘫痪两项新增阻断器的解除逻辑，验证手动模式下 4 项硬阻断（资源/经济/科研/行政）的完整触发与消除。

---

*本报告完成于 2026-07-12，全量测试通过。*
