# 关键架构问题审计报告

- **Date**: 2026-07-05
- **Author**: 用户深度代码审计
- **Related Fixes**: SCEN-STRICT-MODE, SCEN-FLAG-TYPED, SCEN-EVENTBUS-MIGRATION, SCEN-SERIALIZATION, SCEN-ENDING-CONDITIONS

## 概览

有——而且看完代码后我要推翻我上一轮的一个判断：EventBus 不是你的头号嫌疑犯，因为它基本是个摆设。真正的问题比我猜的更具体，我按严重程度排列。

## 发现一：你的架构文档和真实架构是两套东西

`EventBus` 被实例化了、`GameEvents` 常量定义得很规范——但通读整个 `Game.ts`，没有一处调用 `this.eventBus.emit(GameEvents.XXX)`。真实的事件流是散落各处的：

```ts
window.dispatchEvent(new CustomEvent('ticker-message-added'));
window.dispatchEvent(new CustomEvent('game-turn-complete'));
window.dispatchEvent(new CustomEvent('epoch-changed'));
window.dispatchEvent(new CustomEvent('turn-blocked', {...}));
window.dispatchEvent(new CustomEvent('game-over'));
```

裸字符串、无类型、直接挂 window——而且这些字符串和 `GameEvents` 里定义的名字（`'game:turn:complete'` vs `'game-turn-complete'`）根本对不上，是两套平行词汇表。

这解释了很多事：当你让 AI 修事件相关的 bug，它读到 README 和 `EventBus.ts`，以为事件走总线，去总线上找订阅关系——而真相在几十处 window 字符串字面量里。AI 修的是文档描述的系统，bug 活在真实的系统里。这就是"上下文不可达"的具体形态。

修法：二选一。要么全部收编进 EventBus（给它加类型：`emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K])`），要么删掉 EventBus 承认 window 事件。绝不能两套并存。

## 发现二：异常被系统性吞掉——这是"测试全绿但 bug 存在"的直接机制

```ts
try {
  this.earthCivi.runARound();
} catch (e: any) {
  this.addHistory(`[警告] 地球模拟出现异常: ${e.message}`);
}
```

整个回合结算里有七八处这种模式：子系统崩了 → 变成一条历史日志 → 游戏继续跑。这意味着：

- Autoplay500 永远不会失败——经济系统炸了 500 回合，测试照样绿，因为异常从不逃逸。
- 玩家看到的是"数值不对劲的诡异行为"，而不是崩溃——正是最难排查的那类 bug。
- AI 修复后跑测试确认"没问题"，其实是异常被静音了。

修法：加一个 `strictMode` 开关（测试和开发构建下开启），strict 下所有 catch rethrow。再让 Autoplay 在每回合结束后断言：`historyLogs` 中不含 `[警告]`/`[UEE警告]`。就这两行改动，你的 Autoplay500 会立刻从"仪式"变成"探雷器"，我预计第一次跑就能炸出一批存量 bug。

## 发现三：用显示文本的字符串匹配驱动游戏逻辑

```ts
if (fullText.includes("歌者") || fullText.includes("光粒")) {
  this.addFlag("singer_contact");
}
```

拿事件的标题+文案+对白做 `includes` 来触发解锁 flag。任何一次文案润色、错别字修正、i18n 翻译，都会静默改变游戏逻辑。AI 帮你改个措辞就可能弄断一条解锁链——而且没有任何测试能防住。修法：给事件 JSON 数据加显式的 `grantsFlags: ["singer_contact"]` 字段，逻辑读元数据而不是读文案。

## 发现四：两条序列化路径 + FlagManager 引用别名陷阱

- 回溯快照用的是 `runARound` 里手写的内联 replacer，自动存档用的是 `gameReplacer`——两套排除列表，注定漂移（`flags` 一个排除 `flagManager` 但保留 `flags`，另一个呢？）。
- 更隐蔽的：`flagManager = new FlagManager(this.flags)` 在字段声明时绑定。反序列化/回溯后如果 `this.flags` 被替换为新 Set，flagManager 还攥着旧 Set 的引用——之后 `addFlag` 写进旧 Set，`hasFlag` 读新 Set（或反过来）。如果你有"回溯/读档后 flag 行为诡异、结局触发不了"类的 bug，八成是它。
- 顺带的证据：结局判定里同时检查 `dark_domain_decision || black_domain_decision`——这就是魔法字符串 flag 已经漂移过的化石。把所有 flag 收进一个 `const` 联合类型，typo 直接变编译错误。

## 发现五：结局判定与预报是两套手写逻辑

`checkVictoryConditions` 里黑域要求 `黑域生成` 科技，`getEndingForecast` 里黑域进度却看 `光速飞船推进器`。玩家看着进度条 100% 却不触发结局——这类"永远修不完"的 bug 就是同一规则写了两遍的必然产物。修法：结局条件定义成单一数据结构（条件项数组），判定和预报都从它派生。

## 其他速记

- `runARound` 约 500 行，是模拟+UI+音频+资产下载+存档的上帝方法。上轮说的"核心/渲染分离"，具体切口就是它：把所有 `window.dispatchEvent`、`assetLoader`、`localStorage`（遗迹读取直接写在核心里！）抽成注入的 `IPresentationSink` 接口，无头环境给空实现。注意有几处 `window.dispatchEvent` 没有 `typeof window` 守卫（如 `game-turn-complete`、`game-over`），说明你的无头测试要么 polyfill 了 window（掩盖问题），要么这些路径根本没被跑到。
- `_yearJustAdvanced` 这个"防双重推进安全锁"是典型的症状补丁——EventSystem 和 runARound 争夺年份推进权，根因是推进权没有唯一归属。
- 确定性已经在漏：`rng()` 兜底 `Math.random()`（生产环境永远走这条，意味着你玩的版本和 Autoplay 跑的不是同一个概率宇宙）、`Date.now()`、`(window as any).isTutorialActive` 全局可变量影响核心逻辑。
- `GameInstance` 单例和 `AppContainer` DI 并存，两套服务定位——AI 会随机选一套用，加剧不一致。

## 优先级建议（按性价比）

1. strictMode + 禁止吞异常（半天，立刻让现有测试开始说真话）
2. flag 类型化 + 消灭文案字符串匹配（一天，消灭一整类静默逻辑 bug）
3. 统一事件通道（两三天，让 AI 能看见真实因果）
4. 统一序列化路径 + 存读档一致性测试（两天）
5. 结局条件数据化，判定/预报同源（两天）

做完 1 和 2，我预计你的 bug 复发率就会有肉眼可见的下降——因为它们分别堵住了"bug 不被发现"和"bug 被静默引入"两个口子。第 1 项今天就能做：全局搜 `catch (e`,加 rethrow 开关，跑一次 Autoplay500，把炸出来的东西列个清单——那份清单大概率就是你这两个月一直在追的那些幽灵的老巢。