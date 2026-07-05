# Task Tracker — EventBus 兼容性断裂 + TopHUD z-index + StoryModal 冻结修复

- **Date**: 2026-07-05

## 任务背景

用户反馈三个关联问题：
1. 主页点击"开始新游戏"不弹出新手教程
2. 游戏页面点击"下一回合"没有反应
3. 状态栏（TopHUD）一直展示在所有页面顶部，覆盖封面和弹窗

经排查发现这三个问题的根因分别为：
- EventBus 重构（未提交的 212 行改动）中 `emitLegacy` 只派发新事件名，导致 App.tsx 的旧事件名监听器全部失效
- TopHUD 的 `z-[1010]` 过高，盖住所有弹窗
- 直接入队事件（外星发现/接触、深空遗迹）的 choice 没调 `applyEventEffect`，导致 StoryModal 关闭后卡死

## 任务清单

### 阶段一：StoryModal 冻结修复（SCEN-EVENT-FREEZE）
- [x] 诊断：确认 `enqueueAlienEvent` / `ruinsEvent` 的 choice 缺少 `applyEventEffect` 调用
- [x] 修复 A：为 `enqueueAlienEvent` 的 choice 补 `this.applyEventEffect(EventEffect.NONE)`
- [x] 修复 A：为 `ruinsEvent` 的两个 choice 各补 `this.applyEventEffect(EventEffect.NONE)`
- [x] 修复 B：App.tsx 的 `onClose` 末尾加 `setCurrentEvent(GameInstance.get().currentEvent)` 兜底同步 React 状态
- [x] 修复副作用：`runAIBrain` 中 `defaultChoice.action()` 执行后 `currentEvent` 被清空，需先保存 `eventTitle`
- [x] 创建场景测试 `EventFreeze.scenario.test.ts`（5 项）
- [x] 修复 `Game.bypassPrevention.test.ts` 回溯年份断言（精确值改范围检查）

### 阶段二：TopHUD z-index 修复（SCEN-TOPHUD-ZINDEX）
- [x] 诊断：确认 TopHUD `z-[1010]` 高于封面(z-150)、事件弹窗(z-100)、设置弹窗(z-200)
- [x] 修复：TopHUD.tsx 的 z-index 从 `z-[1010]` 降回 `z-50`
- [x] 验证：教程 SVG 镂空机制不依赖 z-index 提升

### 阶段三：EventBus 兼容性断裂修复（SCEN-EVENTBUS-COMPAT）
- [x] 诊断：`emitLegacy` 映射到新事件名后只向 bus 内部派发，不向 window 派发旧事件名
- [x] 诊断：`EarthCivilization.ts:645` 调 `emitToWindow()` 但该方法已被删除
- [x] 修复：`emitLegacy` 改为同时派发新旧事件名（先 emit 新事件名，再向 window 派发旧事件名）
- [x] 修复：EventBus 添加 `emitToWindow` 别名（指向 `emit`）
- [x] 修复：`EarthCivilization.ts` 改用 `emitLegacy('game:tech:completed', ...)` 并移除未使用的 `GameEvents` 导入
- [x] 修复：`EventBus.test.ts` 的 `emitToWindow` 测试适配新 API

### 阶段四：Registry 归档
- [x] 新增 SCEN-EVENT-FREEZE 条目（BugFix 类型）
- [x] 新增 SCEN-TOPHUD-ZINDEX 条目（BugFix 类型）
- [x] 新增 SCEN-EVENTBUS-COMPAT 条目（BugFix 类型）
- [x] 更新发布状态：0 RED / 19 总计
- [x] 添加变更日志条目

### 阶段五：测试验证
- [x] EventFreeze 场景测试 5/5 通过
- [x] EventBus 测试 12/12 通过
- [x] Autoplay500 E2E 测试 6/6 通过
- [x] 全量测试 48 文件 / 936 测试通过
