# Task Tracker — 三项修复核实与 Release 流水线修复

- **Date**: 2026-07-05
- **Related Walkthrough**: [EXEC_20260705_RELEASE_FIX_AND_VERIFICATION_WALKTHROUGH.md](./EXEC_20260705_RELEASE_FIX_AND_VERIFICATION_WALKTHROUGH.md)
- **Related Registry Entries**: SCEN-EVENT-FREEZE, SCEN-TOPHUD-ZINDEX, SCEN-EVENTBUS-COMPAT

## 任务背景

用户要求核实其他 AI 在今天的变更日志中填入的三项修复（SCEN-EVENT-FREEZE、SCEN-TOPHUD-ZINDEX、SCEN-EVENTBUS-COMPAT），确认修复情况并按本地归档要求归档总结。同时要求修复 Release 流水线失败问题并同步 GitHub。

经排查发现 Release 流水线阻塞原因：`npx tsc --noEmit` 有 9 个 TypeScript 编译错误 + `npx vitest` 有 3 个运行时错误。

## 任务清单

### 阶段一：核实三项修复
- [x] 核实 SCEN-EVENT-FREEZE：enqueueAlienEvent / ruinsEvent 的 choice 补 applyEventEffect(NONE) ✅
- [x] 核实 SCEN-EVENT-FREEZE：App.tsx onClose 末尾同步 React 状态 ✅
- [x] 验证 EventFreeze 场景测试 5/5 通过 ✅
- [x] 核实 SCEN-TOPHUD-ZINDEX：TopHUD.tsx z-index 从 z-[1010] 降回 z-50 ✅
- [x] 核实 SCEN-EVENTBUS-COMPAT：emitLegacy 同时派发新旧事件名 ✅
- [x] 核实 SCEN-EVENTBUS-COMPAT：emitToWindow 别名存在 ✅
- [x] 核实 SCEN-EVENTBUS-COMPAT：EarthCivilization.ts 使用 emitLegacy ✅
- [x] 核实 SCEN-EVENTBUS-COMPAT：runAIBrain 有 currentEvent null 守卫 ✅
- [x] 验证 EventBusMigration 场景测试 65/65 通过 ✅
- [x] 确认三项修复与 5 项审计修复无冲突，互为补充 ✅

### 阶段二：修复 TypeScript 编译错误（9 个）
- [x] EndingConditions.scenario.test.ts：移除未使用的 EpochType 导入
- [x] EventBusMigration.scenario.test.ts：移除未使用的 Game 导入
- [x] EventBusMigration.scenario.test.ts：移除未使用的 dispatchesFromGame 变量
- [x] EventFreeze.scenario.test.ts：修复 flagManager.set 参数数量（set→unset）
- [x] FlagTyped.scenario.test.ts：移除未使用的 GameFlag 导入
- [x] Serialization.scenario.test.ts：修复 EventLane 类型（'military' as any）
- [x] StrictMode.scenario.test.ts：移除未使用的 beforeEach 导入
- [x] StrictMode.scenario.test.ts：移除未使用的 game1/game2 变量
- [x] 验证 npx tsc --noEmit 零错误通过 ✅

### 阶段三：修复测试运行时错误（3 个）
- [x] 诊断：EventBus.emit 中 this.handlers 为 undefined（反序列化后 handlers 丢失）
- [x] 修复：EventBus.emit 添加防御性初始化（if (!this.handlers) this.handlers = new Map()）
- [x] 诊断：GameInstance.reset() 的 setTimeout 回调中 this.instance 可能为 null
- [x] 修复：setTimeout 回调添加 this.instance 空值守卫
- [x] 验证全量测试 1045/1045 通过，0 错误 ✅

### 阶段四：Registry 归档
- [x] 更新 _registry.md 变更日志（新增核实与修复条目）
- [x] 更新 _health.md 审视日志（新增审视条目）
- [x] 创建 EXEC_ 三位一体归档文档（TASK + WALKTHROUGH）
- [x] 更新 CHANGELOG.md Unreleased 条目

### 阶段五：Git 同步
- [x] 提交 commit 959cf0d
- [x] 推送至 GitHub main 分支