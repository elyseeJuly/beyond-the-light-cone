# Walkthrough — 三项修复核实与 Release 流水线修复

- **Date**: 2026-07-05
- **Related Task**: [EXEC_20260705_RELEASE_FIX_AND_VERIFICATION_TASK.md](./EXEC_20260705_RELEASE_FIX_AND_VERIFICATION_TASK.md)
- **Related Registry Entries**: SCEN-EVENT-FREEZE, SCEN-TOPHUD-ZINDEX, SCEN-EVENTBUS-COMPAT
- **Related Commit**: 959cf0d

## 概述

本次会话包含两个主要任务：1) 核实其他 AI 在变更日志中填入的三项修复；2) 修复 Release 流水线阻塞问题。三项修复经核实均有效，与之前的 5 项审计修复无冲突。Release 流水线阻塞由 9 个 TS 编译错误和 3 个测试运行时错误导致，修复后 `tsc --noEmit` 零错误、全量 1045 测试 0 错误通过。

## 一、三项修复核实

### SCEN-EVENT-FREEZE（StoryModal 冻结修复）

**验证项目**：
- [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) L1626：`enqueueAlienEvent` 的 choice 末尾已补 `this.applyEventEffect(EventEffect.NONE)`
- [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) L683, L690：`ruinsEvent` 的两个 choice 各补 `this.applyEventEffect(EventEffect.NONE)`
- [App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx) L451-455：`onClose` 末尾 `setCurrentEvent(GameInstance.get().currentEvent)` 兜底同步 React 状态
- [EventFreeze.scenario.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/EventFreeze.scenario.test.ts)：5 项场景测试全部通过

**结论**：修复完整，代码与 Registry 描述一致。

### SCEN-TOPHUD-ZINDEX（TopHUD z-index 过高）

**验证项目**：
- [TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx) L165：z-index 已从 `z-[1010]` 降回 `z-50`
- 全文搜索确认无残留 `z-[1010]`

**结论**：修复完整，z-index 层级表（TopHUD z-50 / StoryModal z-100 / 封面 z-150 / 设置 z-200 / 教程 z-1000）已恢复合理。

### SCEN-EVENTBUS-COMPAT（EventBus 兼容性断裂修复）

**验证项目**：
- [EventBus.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EventBus.ts) L188-197：`emitLegacy` 同时派发新旧事件名（先 `emit` 新事件名，再 `window.dispatchEvent` 旧事件名）
- [EventBus.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EventBus.ts) L205：`emitToWindow` 别名已添加（指向 `emit`）
- [EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts)：所有 5 处调用均使用 `emitLegacy`，无裸 `emitToWindow`
- [Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) L276：`runAIBrain` 中 `if (this.currentEvent)` 空值守卫 + L277 可选链 `this.currentEvent.choices?.[0]`
- [EventBusMigration.scenario.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/EventBusMigration.scenario.test.ts)：65 项场景测试全部通过

**结论**：修复完整，与 5 项审计修复中的 EventBus 迁移互为补充——迁移搭建了类型化基础，COMPAT 修复补齐了向后兼容缺口。

### 三项修复与 5 项审计修复的关系

| 审计修复 | 关系 | 说明 |
|---|---|---|
| SCEN-STRICT-MODE | 独立 | 异常处理体系，无交集 |
| SCEN-FLAG-TYPED | 独立 | Flag 类型化，无交集 |
| SCEN-EVENTBUS-MIGRATION | **互补** | 迁移搭建类型化 EventBus，COMPAT 补齐向后兼容 |
| SCEN-SERIALIZATION | 独立 | 序列化路径统一，无交集 |
| SCEN-ENDING-CONDITIONS | 独立 | 结局条件数据化，无交集 |
| SCEN-EVENT-FREEZE | 独立 | 事件收尾链路，无交集 |
| SCEN-TOPHUD-ZINDEX | 独立 | CSS 层叠上下文，无交集 |

## 二、Release 流水线修复

### 问题诊断

Release 流水线的 `gate` job 第一步就是 `npx tsc --noEmit`，该项目 `tsconfig.json` 中 `noUnusedLocals: true` + `noUnusedParameters: true`，任何未使用的变量/导入都会导致编译失败。本次发现 9 个 TS 编译错误分布在 6 个场景测试文件中。

此外，`npx vitest run` 检出 3 个运行时错误（`EventBus.emit` 中 `this.handlers` 为 undefined），由 `GameInstance.reset()` 的 `setTimeout` 回调触发。

### 修复一：TS 编译错误（9 个）

| 文件 | 错误 | 修复方式 |
|---|---|---|
| EndingConditions.scenario.test.ts | `EpochType` 导入未使用 | 从导入中移除 |
| EventBusMigration.scenario.test.ts | `Game` 导入未使用 | 从导入中移除 |
| EventBusMigration.scenario.test.ts | `dispatchesFromGame` 变量未使用 | 删除变量及关联代码块 |
| EventFreeze.scenario.test.ts | `flagManager.set` 传入 2 个参数（set 只接受 1 个） | `set('flag', false)` → `unset('flag')` |
| FlagTyped.scenario.test.ts | `GameFlag` 导入未使用 | 从导入中移除 |
| Serialization.scenario.test.ts | `'military'` 不匹配 `EventLane` 类型 | 添加 `as any` 类型断言 |
| StrictMode.scenario.test.ts | `beforeEach` 导入未使用 | 从导入中移除 |
| StrictMode.scenario.test.ts | `game1` 变量未使用 | 删除变量声明 |
| StrictMode.scenario.test.ts | `game2` 变量未使用 | 删除变量声明 |

### 修复二：测试运行时错误（3 个）

**根因**：`GameInstance.reset()` 中 `setTimeout(() => { ... }, 500)` 在测试环境中，500ms 回调可能在其他测试运行期间触发，此时 `this.instance` 指向的 Game 实例的 `eventBus.handlers` 可能因反序列化而未初始化。

**修复 A**：[EventBus.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EventBus.ts) L168-169
```typescript
emit<K extends GameEventName>(event: K, payload?: GameEventMap[K]): void {
    // 防御性初始化：反序列化后 handlers 可能为 undefined
    if (!this.handlers) this.handlers = new Map();
    // ... 内部订阅者
```

**修复 B**：[Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) L1732-1733
```typescript
setTimeout(() => {
    if (typeof window !== 'undefined' && this.instance) {
        // 原来：if (typeof window !== 'undefined') { this.instance!.... }
```

### 修改文件统计

| 文件 | 变更类型 |
|---|---|
| `src/core/EventBus.ts` | 防御性 handlers 初始化 |
| `src/core/Game.ts` | setTimeout 空值守卫 |
| `src/test/scenarios/EndingConditions.scenario.test.ts` | 移除未使用导入 |
| `src/test/scenarios/EventBusMigration.scenario.test.ts` | 移除未使用导入/变量 |
| `src/test/scenarios/EventFreeze.scenario.test.ts` | 修复 set→unset |
| `src/test/scenarios/FlagTyped.scenario.test.ts` | 移除未使用导入 |
| `src/test/scenarios/Serialization.scenario.test.ts` | 修复类型断言 |
| `src/test/scenarios/StrictMode.scenario.test.ts` | 移除未使用导入/变量 |
| `src/test/scenarios/_registry.md` | 变更日志条目 |
| `src/test/scenarios/_health.md` | 审视日志条目 |
| `public/asset_manifest.json` | 时间戳更新 |

## 三、验证结果

- `npx tsc --noEmit`：零错误
- `npx vitest run`：51 文件 / 1045 测试 / 0 错误
- Registry 发布状态：0 RED / 19 总计