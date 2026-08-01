# Walkthrough — EventBus 兼容性断裂 + TopHUD z-index + StoryModal 冻结修复

- **Date**: 2026-07-05
- **Related Task**: [EXEC_20260705_EVENTBUS_TOPHUD_FREEZE_FIX_TASK.md](./EXEC_20260705_EVENTBUS_TOPHUD_FREEZE_FIX_TASK.md)
- **Related Registry Entries**: SCEN-EVENT-FREEZE, SCEN-TOPHUD-ZINDEX, SCEN-EVENTBUS-COMPAT

## 概述

本次修复解决了三个相互关联的 UI 冻结/无响应问题。根因涉及三个独立层面：事件收尾链路断裂（Game.ts）、CSS 层叠上下文错误（TopHUD.tsx）、EventBus 重构兼容性断裂（EventBus.ts）。三个 bug 共同导致了"游戏页面完全不可玩"的表象。

## 修复一：StoryModal 冻结（SCEN-EVENT-FREEZE）

### 根因

直接入队的事件（`enqueueAlienEvent` / `ruinsEvent`）的 choice 没有调用 `applyEventEffect`，导致事件收尾链路断裂。`applyEventEffect` 是负责"清 currentEvent → 推进年份 → 派发 `game-turn-complete`"的收尾逻辑，直接入队的事件绕过了它。

### 修改文件

- **[Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts)**
  - `enqueueAlienEvent`（L1572-1578）：choice 的 action 末尾补 `this.applyEventEffect(EventEffect.NONE)`
  - `ruinsEvent`（L691-705）：两个 choice 的 action 各补 `this.applyEventEffect(EventEffect.NONE)`
  - `runAIBrain`（L275-282）：先保存 `eventTitle` 再执行 `defaultChoice.action()`，避免 `applyEventEffect` 清空 `currentEvent` 后访问 null
- **[App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx)**
  - `onClose`（L451-455）：末尾加 `setCurrentEvent(GameInstance.get().currentEvent)` 兜底同步 React 状态
- **[EventFreeze.scenario.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/scenarios/EventFreeze.scenario.test.ts)**
  - 新增 5 项场景测试（E01-E05）
- **[Game.bypassPrevention.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/Game.bypassPrevention.test.ts)**
  - 回溯年份断言从精确值改为范围检查（适配外星事件新增的年份推进）

### 修复链路

```
choice.action() 
  → applyEventEffect(NONE) 
    → currentEvent = null 
    → processNextEvent() 
    → year++ / game-turn-complete 派发
App.tsx onClose 
  → setCurrentEvent(game.currentEvent) 同步 React 状态
```

## 修复二：TopHUD z-index 过高（SCEN-TOPHUD-ZINDEX）

### 根因

6/29 为了让教程期间 TopHUD 不被遮罩盖住，把 z-index 从 `z-50` 提到了 `z-[1010]`。但教程的 SVG 遮罩本身有镂空机制，TopHUD 不需要提到那么高。提到 z-1010 后反而让 TopHUD 盖住了封面、事件弹窗、设置弹窗等所有覆盖层。

### 修改文件

- **[TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx)**
  - L165：z-index 从 `z-[1010]` 降回 `z-50`

### z-index 层级表（修复后）

| 组件 | z-index | 说明 |
|---|---|---|
| TopHUD | z-50 | 不再覆盖任何弹窗 |
| StoryModal | z-[100] | 事件弹窗 |
| GameCoverScreen | z-[150] | 封面 |
| SettingsModal | z-[200] | 设置 |
| Tutorial 遮罩 | z-[1000] | 教程（SVG 镂空机制不依赖 z-index） |

## 修复三：EventBus 兼容性断裂（SCEN-EVENTBUS-COMPAT）

### 根因

EventBus 重构（未提交的 212 行改动）引入了类型化事件系统，但 `emitLegacy` 方法的行为发生了破坏性变更：

**修复前**：
```typescript
emitLegacy(windowEventName: string, detail?: any): void {
  const mapped = WINDOW_TO_GAME_EVENT[windowEventName];
  if (mapped) {
    this.emit(mapped, detail);  // 只派发新事件名
  } else {
    window.dispatchEvent(...);  // 未映射的才走 window
  }
}
```

`emitLegacy('open-tutorial')` 映射到 `'tutorial:open'` 后只向 bus 内部派发，不向 window 派发 `'open-tutorial'`。但 App.tsx 监听的是 `'open-tutorial'` → 教程永远不弹。同理 `game-turn-complete`、`game-event-triggered` 等所有旧监听器全部失效。

### 修改文件

- **[EventBus.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EventBus.ts)**
  - `emitLegacy`（L188-197）：改为同时派发新旧事件名（先 `emit` 新事件名，再向 window `dispatchEvent` 旧事件名）
  - 新增 `emitToWindow` 别名（L204-207）：指向 `emit`，向后兼容旧 API
- **[EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts)**
  - L645：`emitToWindow(GameEvents.TECH_COMPLETED, ...)` 改为 `emitLegacy('game:tech:completed', ...)`
  - L11：移除未使用的 `GameEvents` 导入
- **[EventBus.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/EventBus.test.ts)**
  - `emitToWindow` 测试适配新 API（临时开启 window 桥接）

### 修复后的 emitLegacy 行为

```typescript
emitLegacy(windowEventName: string, detail?: any): void {
  const mapped = WINDOW_TO_GAME_EVENT[windowEventName];
  if (mapped) {
    this.emit(mapped, detail);  // 1. 派发新事件名（触发 bus 内部订阅）
  }
  // 2. 始终向 window 派发旧事件名（保证 React 组件旧监听器接收）
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(windowEventName, { detail }));
  }
}
```

## Registry 归档

### 新增条目

| ID | 类型 | 场景名称 | 状态 |
|---|---|---|---|
| SCEN-EVENT-FREEZE | BugFix | 直接入队事件关闭后 StoryModal 卡死修复 | GREEN |
| SCEN-TOPHUD-ZINDEX | BugFix | TopHUD z-index 过高覆盖所有弹窗 | GREEN |
| SCEN-EVENTBUS-COMPAT | BugFix | EventBus 重构兼容性断裂修复 | GREEN |

### 发布状态

- 总计：19 条目（+3 新增）
- 全部 GREEN
- 0 RED

## 验证结果

### 测试套件

```bash
npx vitest run
# Result: 48 test files passed, 936 tests passed
```

### 关键测试验证

| 测试文件 | 测试数 | 状态 |
|---|---|---|
| EventFreeze.scenario.test.ts | 5 | 通过 |
| EventBus.test.ts | 12 | 通过 |
| Autoplay500.test.ts | 6 | 通过 |
| Game.bypassPrevention.test.ts | 3 | 通过 |
| AlienContact.scenario.test.ts | 5 | 通过 |

## 经验教训

1. **EventBus 重构必须保留旧事件名派发**：迁移过渡期必须同时派发新旧事件名，否则所有旧监听器会静默失效。这类 bug 特别难排查因为没有任何错误抛出，只是 UI 不响应。

2. **z-index 修复不能只看单个组件**：6/29 把 TopHUD 的 z-index 提到 z-1010 是为了解决教程遮罩问题，但没有检查与其他弹窗的层叠关系。应建立全局 z-index 规范表。

3. **直接入队事件必须走完整收尾链路**：任何通过 `eventQueue.push` 入队的事件，其 choice 必须调用 `applyEventEffect`（即使是 `NONE`），否则 `currentEvent` 不会被清空、年份不会推进、`game-turn-complete` 不会派发。

4. **测试全绿不等于没有 bug**：936 个测试全绿，但用户依然遇到三个 bug。原因是测试覆盖的都是"正常路径"，而 bug 发生在"事件链断裂后的边缘场景"。SCEN-EVENT-FREEZE 的 5 项测试专门覆盖了这些边缘场景。
