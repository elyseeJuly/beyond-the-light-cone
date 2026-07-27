# FIX-20260727 智脑托管阻塞与教程节奏修复

> 日期：2026-07-27
> 版本：v1.0.7（v1.0.6 之后的热修复）
> 状态：✅ 已完成并通过全量验证
> 关联场景：SCEN-AIBRAIN-BLOCKER

## 一、问题背景

玩家在实际游玩中反馈三类问题：

1. **智脑托管卡死**（最严重）：过完新手教程进入正常游戏后，点击智脑按钮启用托管，此后无论怎么操作都无法进入下一回合，"下一回合"按钮永久 disabled。
2. **教程节奏问题**：新手教程每一步跳转过快，玩家反应不过来；教程与游戏初始操作撞在一起，玩家未了解游戏就进入非教程页面。
3. **移动端按钮消失**：智脑目标出现在游戏页面后，原来的音乐按钮和设置按钮都没有了。

## 二、根因分析

### 2.1 智脑托管卡死（核心阻塞）

**根因位置**：`src/core/Game.ts` 第 276-283 行 `runAIBrain` 方法

**缺陷链路**：
1. 智脑启用后点击"下一回合" → `runARound` → `runAIBrain` 处理 `currentEvent`
2. filteredEvent 的 `action()`（第 473-488 行）只执行 `applyNewEffects`，**不调用 `applyEventEffect`**
3. 只有 `applyEventEffect`（EventSystem.ts:58）会清理 `this.currentEvent = null`
4. `runAIBrain` 处理完事件后**也没有清理 `currentEvent`**
5. `currentEvent` 残留非 null → `TopHUD.tsx:133` `hasEvent = currentEvent !== null` = **true**
6. `TopHUD.tsx:322` `disabled={stats.hasEvent || ...}` → **"下一回合"按钮永久 disabled**

**关键代码**：
```typescript
// Game.ts:276-283 修复前
if (this.currentEvent) {
  const defaultChoice = this.currentEvent.choices?.[0];
  if (defaultChoice) {
    const eventTitle = this.currentEvent.title;
    defaultChoice.action();
    actions.push(`🤖 [AI智脑] 已自动处理剧情事件「${eventTitle}」`);
  }
  // ❌ 缺少 this.currentEvent = null
}
```

### 2.2 教程期间智脑按钮可被误触

**根因位置**：`src/components/TopHUD.tsx` 第 304 行

`TopHUD` 的智脑切换按钮缺少 `isTutorialActive` 守卫，`Tutorial.tsx:162` 教程启动时虽关闭智脑（`isAiBrainEnabled = false`），但玩家可中途重新开启，导致智脑与教程状态机争夺回合推进控制权。

### 2.3 教程步骤跳转过快

**根因位置**：`src/components/Tutorial.tsx` click-earth 步骤

进入 click-earth 步骤时自动派发 `star-selected` 事件，导致移动端 drawer 突然弹出，玩家还没看清教程卡片界面就变了。

### 2.4 教程与游戏初始操作冲突

**根因位置**：`src/App.tsx` `onStartNewGame`

教程启动有 500ms 延迟（等 `GameInstance.reset()` 内部定时器），封面消失后玩家短暂进入无引导界面。

### 2.5 移动端音乐/设置按钮消失

**根因位置**：`src/components/MobileBottomNav.tsx`

移动端底部导航栏缺少音乐和设置入口，桌面端的 BgmPlayer 和设置按钮在移动端无对应。

## 三、修复方案

### 3.1 P0 教程期间禁用智脑按钮

**文件**：`src/components/TopHUD.tsx` 第 303-319 行

智脑切换按钮加 `disabled={isTutorialActive}`，教程期间按钮置灰显示"教程中"，杜绝智脑与教程状态机冲突。

### 3.2 P1 runAIBrain 清理 currentEvent（真正解决用户卡死）

**文件**：`src/core/Game.ts` 第 275-297 行

```typescript
// 修复后
if (this.currentEvent) {
  const defaultChoice = this.currentEvent.choices?.[0];
  const eventTitle = this.currentEvent.title;
  if (defaultChoice) {
    defaultChoice.action();
    actions.push(`🤖 [AI智脑] 已自动处理剧情事件「${eventTitle}」`);
  }
  // 无论 action() 内部是否调用 applyEventEffect，都强制清理 currentEvent
  this.currentEvent = null;
}
while (this.eventQueue.length > 0) {
  const ev = this.eventQueue.shift()!;
  const defaultChoice = ev.choices?.[0];
  if (defaultChoice) {
    defaultChoice.action();
    actions.push(`🤖 [AI智脑] 已自动处理剧情事件「${ev.title}」`);
  }
}
// 兜底：确保 runAIBrain 返回时 currentEvent 已清理
this.currentEvent = null;
```

### 3.3 教程步骤跳转过快修复

**文件**：`src/components/Tutorial.tsx` + `src/components/tutorial/tutorialSteps.ts`

- 移除 click-earth 步骤自动派发 `star-selected`，改为玩家点击 hotspot 时才派发（`handleEarthHotspotClick`）
- 文案从"已为您自动定位并选中地球"改为"点击高亮的地球坐标"

### 3.4 教程与游戏初始操作冲突修复

**文件**：`src/App.tsx` `onStartNewGame`

移除 500ms 延迟，封面消失后立即 `setShowTutorial(true)`。

### 3.5 移动端按钮消失修复

**文件**：`src/components/BgmPlayer.tsx` + `src/components/MobileBottomNav.tsx`

- BgmPlayer 新增 `compact` 属性，仅显示播放/暂停按钮，适配移动端底部导航栏
- MobileBottomNav 集成紧凑音乐按钮和设置按钮，恢复移动端操作入口

## 四、验证结果

| 门禁 | 结果 |
|------|------|
| TypeScript 编译 | 0 错误 |
| 教程场景测试 | 6/6 通过 |
| 完整单元测试 | 59 文件 1089 用例通过（3 个 simulation 测试 skip） |
| 回归 | 无 |

## 五、关联文件

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/core/Game.ts` | 修复 | runAIBrain 清理 currentEvent |
| `src/components/TopHUD.tsx` | 修复 | 智脑按钮教程期间禁用 |
| `src/components/Tutorial.tsx` | 修复 | click-earth 改为玩家点击触发 |
| `src/components/tutorial/tutorialSteps.ts` | 修复 | 文案调整 |
| `src/App.tsx` | 修复 | 移除教程启动 500ms 延迟 |
| `src/components/BgmPlayer.tsx` | 新增 | compact 紧凑模式 |
| `src/components/MobileBottomNav.tsx` | 修复 | 集成音乐和设置按钮 |
| `src/test/scenarios/TutorialRemedy.scenario.test.tsx` | 修复 | 适配教程逻辑变更 |

## 六、经验教训

1. **AI 托管路径必须与手动路径状态清理对齐**：`applyEventEffect` 是手动模式的清理点，`runAIBrain` 是 AI 模式的处理点，两者必须保证 `currentEvent` 的清理语义一致。
2. **教程期间应禁用所有可能干扰教程状态机的控件**：智脑托管、自动回合等会争夺回合推进控制权的功能，在教程期间必须禁用。
3. **教程步骤的自动推进要谨慎**：自动派发事件（如 `star-selected`）会导致 UI 突变，玩家反应不过来；优先让玩家主动触发。
