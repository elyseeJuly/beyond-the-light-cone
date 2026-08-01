# 审计报告：AP 指令点系统与回合阻断器失效

> **文档编号**: AUDIT_20260712_AP_SYSTEM_AND_TURN_BLOCKERS  
> **日期**: 2026-07-12  
> **审计范围**: AP（执政指令点）消耗/恢复链路、下一回合按钮阻断状态、AI 智脑托管与 AP 的耦合关系  
> **审计方法**: 静态代码走查 + 调用链追踪  
> **前置文档**: 
> - [SPEC_20260623_CORE_LOOP_ITERATION.md](./SPEC_20260623_CORE_LOOP_ITERATION.md)（设计规范）
> - [EXEC_20260623_AP_AI_BRAIN_IMPLEMENTATION.md](./EXEC_20260623_AP_AI_BRAIN_IMPLEMENTATION.md)（实施任务书）
> - [AUDIT_20260624_AP_AI_BRAIN_REPORT.md](./AUDIT_20260624_AP_AI_BRAIN_REPORT.md)（初版执行报告）

---

## 一、执行摘要

本次审计确认：**AP 指令点系统在当前生产代码中完全失效**——AP 既不会被消耗，也不会被玩家感知到恢复，与下一回合按钮、回合阻断器三者之间本应存在的闭环逻辑实际处于断裂状态。

核心根因是：**所有 UI 入口均绕过了 `EarthCivilization` 暴露的 AP 消耗方法（`adjustWorkerRatio` / `setResearchTarget` / `spendAP`），直接修改底层字段**，导致 AP 系统虽然存在于数据模型中，却从未真正参与游戏循环。

同时 `getTurnBlockers()` 当前实现比设计规范少了 2 项（科研停滞、部门首长空缺），且不检查 AP 状态，使得"手动模式"与"AI 智脑模式"在实际游玩体验上几乎无差异——这违背了 SPEC_20260623 第 2.1 节"既要 4X 微操感又要自动驾驶护肝"的设计目标。

---

## 二、问题清单

### P0-1：UI 调整工种比例绕过 AP 消耗

**现象**：玩家在右侧检视面板拖动采矿/工厂/文化比例滑块时，AP 数值不发生变化。

**根因**：[RightInspector.tsx:209,231,250](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/RightInspector.tsx#L209) 直接修改 `earth.miningRatio` / `earth.factoryRatio` / `earth.cultureRatio` 字段，未调用 [`EarthCivilization.adjustWorkerRatio()`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L97-L129)。

**证据**：
```tsx
// RightInspector.tsx:207-211 — 直接赋值，未消耗 AP
value={earth.miningRatio} 
onChange={(ev) => {
  earth.miningRatio = parseInt(ev.target.value, 10);  // ← 绕过 adjustWorkerRatio()
  earth.allocateWorkers();
  forceUpdate(n => n + 1);
}}
```

对比核心层提供的 AP 消耗入口（[EarthCivilization.ts:97-98](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L97-L98)）：
```typescript
public adjustWorkerRatio(type: 'mining' | 'factory' | 'culture', delta: number): boolean {
  if (!this.spendAP(10)) return false;  // ← 本应消耗 10 AP
  ...
}
```

**影响范围**：3 处滑块（采矿/工厂/文化）全部失效。

---

### P0-2：UI 指派科研目标绕过 AP 消耗

**现象**：玩家在科技树视图点击节点开始研究时，AP 数值不发生变化。

**根因**：[TecTreeView.ts:74-83](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/TecTreeView.ts#L74-L83) 直接设置 `node.inResearch = true` 并扣除 `economy`，未调用 [`EarthCivilization.setResearchTarget()`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L87-L91)。

**证据**：
```typescript
// TecTreeView.ts:74-83 — 直接操作 node，未消耗 AP
if (!node.inResearch) {
  if (game.earthCivi.economy >= node.cost) {
    game.earthCivi.economy -= node.cost;
    node.inResearch = true;  // ← 绕过 setResearchTarget()
    this.render(this.container, type);
  } else {
    alert("经济不足！");
  }
}
```

对比核心层提供的 AP 消耗入口（[EarthCivilization.ts:87-91](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L87-L91)）：
```typescript
public setResearchTarget(treeType: TecTreeType, nodeName: string, costAP: boolean = true): boolean {
  if (costAP && !this.spendAP(20)) return false;  // ← 本应消耗 20 AP
  this.techResearchQueue.set(treeType, nodeName);
  return true;
}
```

**影响范围**：所有科技树的科研指派全部失效。

---

### P0-3：AP 恢复链路虽存在但因 AP 永不满扣而无实际意义

**现象**：AP 数值永远停留在 100/100，玩家无法感知"恢复"。

**根因**：[`EarthCivilization.recoverAP()`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L77-L85) 在 [`EarthCivilization.runARound():239`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L239) 中被正确调用，每回合恢复 `30 + 部门首长加成 + 文化加成`。

但由于 P0-1 和 P0-2 的存在，AP 从未被消耗，`recoverAP()` 的 `Math.min(this.apMax, ...)` 永远命中上限 100，玩家观察不到任何变化。

**证据**：
```typescript
// EarthCivilization.ts:77-85
public recoverAP(): void {
  const baseRecovery = 30;
  const departmentBonus = this.getDepartmentBonus();  // 每位首长 +5
  const cultureBonus = Math.floor(this.culture / 100);
  this.apCurrent = Math.min(this.apMax, this.apCurrent + baseRecovery + departmentBonus + cultureBonus);
  // ← 由于 apCurrent 永远=100，此处永远被 Math.min 钳制为 100
}
```

**影响范围**：整个 AP 恢复机制形同虚设。

---

### P1-1：`getTurnBlockers()` 实现不完整

**现象**：手动模式下"下一回合"按钮几乎不会显示"有阻断"状态。

**根因**：[`Game.getTurnBlockers()`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L301-L314) 当前只检查 2 项，而 [SPEC_20260623 第 2.1 节](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260623_CORE_LOOP_ITERATION.md) 规划了 4 项。

**对比表**：

| 设计规范要求的阻断项 | 当前实现状态 | 证据 |
|---|---|---|
| 资源崩盘预警（资源/经济濒临归零） | ✅ 已实现（阈值 ≤10） | [Game.ts:306-311](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L306-L311) |
| 未决事件（弹窗事件未处理） | ❌ 改由 `hasEvent` 分支处理 | [TopHUD.tsx:310](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx#L310) 显示"同步逻辑中" |
| 科研停滞（无研究项目） | ❌ **未实现** | `isResearchIdle()` 方法存在但未被阻断器调用 |
| 部门首长空缺 | ❌ **未实现** | `autoAssignMinisters()` 方法存在但未被阻断器调用 |

**影响范围**：手动模式下即使所有科技停滞、所有部门首长空缺，下一回合按钮仍可点击，违背"手动模式需处理紧急事务"的设计意图。

---

### P1-2：AP 状态未参与回合阻断逻辑

**现象**：AP=0 时仍可推进回合。

**根因**：[TopHUD.tsx:310](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx#L310) 的 `disabled` 条件和 [Game.ts:333-343](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L333-L343) 的阻断器检查均未包含 AP 相关条件。

**当前 `disabled` 表达式**：
```tsx
disabled={stats.hasEvent || stats.isGameOver || (!stats.isAiBrainEnabled && stats.turnBlockers.length > 0)}
```

缺少 `(!stats.isAiBrainEnabled && stats.apCurrent < AP_BLOCK_THRESHOLD)` 类条件。

**影响范围**：AP 系统与回合推进完全脱钩，玩家无法感知 AP 的战略价值。

---

### P1-3：AI 智脑模式绕过 `spendAP()` 半价折扣逻辑

**现象**：AI 智脑模式下的 AP 消耗未走统一的 `spendAP()` 路径。

**根因**：[`Game.runAIBrain()`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L224-L298) 中所有 AP 扣除都是直接赋值：

```typescript
// Game.ts:234, 246, 259, 271 — 直接赋值，绕过 spendAP()
civi.apCurrent = Math.max(0, civi.apCurrent - 10);  // 应为 spendAP(10)
civi.apCurrent = Math.max(0, civi.apCurrent - 5);   // 应为 spendAP(5)
```

而 [`EarthCivilization.spendAP()`](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L56-L74) 的设计是：
- 手动模式：扣全价
- AI 模式：扣半价（`Math.floor(cost * 0.5)`）

直接赋值导致 AI 模式扣的是**全价**而非半价，与 [SPEC_20260623](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260623_CORE_LOOP_ITERATION.md) 的设计不一致。

**影响范围**：AI 智脑的 AP 经济平衡错误，AI 可能比设计预期更快耗尽 AP。

---

### P2-1：`recoverAP()` 调用时机依赖阻断器未触发

**现象**：手动模式下如果触发阻断器，`recoverAP()` 不会被调用。

**根因**：调用链如下：

```
Game.runARound()                              [Game.ts:316]
  ├─ 阻断器检查 (line 333-343)  ← 有阻断则 return
  ├─ runAIBrain()               (line 345)    ← AI 模式专属
  └─ ...
     └─ earthCivi.runARound()   (line 360)    ← recoverAP() 在这里
        └─ recoverAP()          (line 239)
```

如果手动模式下 `getTurnBlockers()` 返回非空，[Game.ts:341](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L341) 直接 `return`，不会走到 `earthCivi.runARound()`，因此 `recoverAP()` 不被调用。

**影响范围**：玩家被阻断期间 AP 不会恢复，可能导致"阻断 → 无法操作 → 无法解除阻断"的死锁。不过由于当前 AP 根本不消耗（P0-1/P0-2），此问题暂时不会触发。

---

## 三、影响范围汇总

| 影响维度 | 严重程度 | 说明 |
|---|---|---|
| 玩法核心循环 | **致命** | AP 系统作为核心资源完全失效，"4X 微操感"设计目标落空 |
| 手动/AI 模式区分 | **严重** | 两者实际体验无差异，手动模式缺乏战略压力 |
| 阻断器有效性 | **严重** | 4 项阻断只留 2 项，手动模式几乎不阻断 |
| 经济平衡 | **中等** | AI 智脑消耗全价 AP 而非半价，长期可能影响 AI 决策能力 |
| 存档一致性 | **低** | AP 字段已正确持久化（SaveManager v4），数据层无问题 |
| 教程系统 | **低** | 教程文案正确描述了 AP 机制，但实际行为与文案不符 |

---

## 四、根因分析

### 4.1 架构层面：核心层与表现层边界未被强制

`EarthCivilization` 暴露了 `adjustWorkerRatio()` / `setResearchTarget()` / `spendAP()` 等 AP 感知方法，但未阻止外部直接修改 `miningRatio` / `factoryRatio` / `cultureRatio` / `techResearchQueue` 等底层字段。TypeScript 的 `public` 修饰符无法在编译期阻止绕过。

### 4.2 历史层面：AP 系统是后加的补丁

根据 [AUDIT_20260624_AP_AI_BRAIN_REPORT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_AP_AI_BRAIN_REPORT.md)，AP 系统于 2026-06-24 加入，但当时只修改了核心层（`EarthCivilization` / `Game`），未同步重构 UI 层（`RightInspector` / `TecTreeView`）的既有赋值代码。这是一个典型的"接口已提供但调用方未迁移"的集成遗漏。

### 4.3 测试层面：无 AP 专项测试

根据 [AUDIT_20260624_TEST_COVERAGE_AND_OPTIMIZATION.md 第 2.1 节](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260624_TEST_COVERAGE_AND_OPTIMIZATION.md)，AP/AI 智脑系统**无专门测试**，全量 grep `runAIBrain|getTurnBlockers|spendAP|recoverAP` 在 `src/test/` 中无命中。这导致 UI 绕过问题无法被自动化捕获。

---

## 五、修复建议优先级

| 优先级 | 问题 | 修复方向 | 涉及文件 |
|---|---|---|---|
| **P0** | UI 绕过 AP 消耗（P0-1, P0-2） | UI 层改调核心层 AP 方法 | `RightInspector.tsx`, `TecTreeView.ts` |
| **P0** | AP 不恢复的体感（P0-3） | 修复 P0-1/P0-2 后自动消除 | 无需额外改动 |
| **P1** | 阻断器不完整（P1-1） | 补回科研停滞、首长空缺两项 | `Game.ts` |
| **P1** | AP 不参与阻断（P1-2） | 增加 AP 低水位阻断条件 | `Game.ts`, `TopHUD.tsx` |
| **P1** | AI 绕过半价折扣（P1-3） | `runAIBrain()` 改调 `spendAP()` | `Game.ts` |
| **P2** | recoverAP 时机（P2-1） | 将 `recoverAP()` 提前到 `Game.runARound()` 入口 | `Game.ts`, `EarthCivilization.ts` |
| **P2** | 测试覆盖缺失 | 补 AP 消耗/恢复/阻断专项测试 | `src/test/` |

---

## 六、审计结论

AP 指令点系统当前处于**"已实现但未接线"**状态：核心数据模型与方法完备，但 UI 层未接入，导致整个系统在玩家视角下不存在。这与 [SPEC_20260623](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/SPEC_20260623_CORE_LOOP_ITERATION.md) 的设计目标严重背离。

建议在修复 P0 问题（UI 接入 AP 消耗）之前，**不要**先补阻断器或调整 AP 数值平衡，否则会出现"AP 消耗未生效 → 阻断器误判 → 玩家被卡死"的连锁问题。修复顺序应严格遵循 P0 → P1 → P2 的优先级。

---

## 七、附录：代码证据索引

| 证据 | 位置 |
|---|---|
| AP 字段定义 | [EarthCivilization.ts:25-30](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L25-L30) |
| `spendAP()` 实现 | [EarthCivilization.ts:56-74](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L56-L74) |
| `recoverAP()` 实现 | [EarthCivilization.ts:77-85](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L77-L85) |
| `adjustWorkerRatio()` 实现 | [EarthCivilization.ts:97-129](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L97-L129) |
| `setResearchTarget()` 实现 | [EarthCivilization.ts:87-91](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L87-L91) |
| UI 绕过点 1（工种比例） | [RightInspector.tsx:209,231,250](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/RightInspector.tsx#L209) |
| UI 绕过点 2（科研指派） | [TecTreeView.ts:74-83](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/TecTreeView.ts#L74-L83) |
| `getTurnBlockers()` 不完整 | [Game.ts:301-314](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L301-L314) |
| `runAIBrain()` 绕过 spendAP | [Game.ts:234,246,259,271](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L234) |
| 下一回合按钮 disabled 逻辑 | [TopHUD.tsx:310-320](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx#L310-L320) |
| AP 显示组件 | [TopHUD.tsx:280-288](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx#L280-L288) |

---

## 八、后续更新记录

### 8.1 2026-07-13：新手教程简化 — 阻断器宽限期

**关联文档**: [EXEC_20260713_TUTORIAL_SIMPLIFICATION_REPORT.md](./EXEC_20260713_TUTORIAL_SIMPLIFICATION_REPORT.md)

为配合新手教程简化，避免新玩家在前几回合因不熟悉机制而被反复阻断，新增**阻断器宽限期**机制：

**规则变更**:
- 新增 `Game.isInGracePeriod()`：`year < 3` 判定为宽限期
- `getTurnBlockers()` 在宽限期内排除"科研停滞"与"部门首长空缺"两项
- 新增 `Game.getTurnWarnings()`：返回宽限期内应提醒但不阻断的事项

**阻断器分级表（更新后）**:

| 阻断项 | 宽限期（year < 3） | 正常期（year ≥ 3） |
|--------|-------------------|-------------------|
| 资源崩盘（≤10） | 阻断 | 阻断 |
| 经济危机（≤10） | 阻断 | 阻断 |
| 科研停滞 | **警告（不阻断）** | 阻断 |
| 行政瘫痪（部门空缺） | **警告（不阻断）** | 阻断 |
| 教程模式 | 全部豁免 | 全部豁免 |
| AI 智脑模式 | 全部豁免 | 全部豁免 |

**UI 表现**:
- 宽限期内有警告时，下一回合按钮显示琥珀色呼吸动画
- 按钮 title 同步显示第一条警告信息
- 有阻断时按钮灰化显示"有阻断"，有警告时保持可点击但变色提醒

---

*本报告基于 2026-07-12 的代码状态生成，最后更新于 2026-07-13。*
