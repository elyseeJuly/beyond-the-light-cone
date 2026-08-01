# 全面代码审计与隐藏 Bug 定位报告

> **审计日期**: 2026-06-24
> **审计触发**: 用户报告 3 个运行时 Bug + 要求全面审计对照文档核实代码完成情况
> **审计方法**: 代码路径追踪 + 子代理并行搜索 + 文档对照核实
> **基准文档**: [EXEC_20260624_PROJECT_STATUS_BOARD.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/EXEC_20260624_PROJECT_STATUS_BOARD.md)

---

## 一、用户报告的 3 个 Bug 根因分析

### Bug 1: 纪元卡死 0 年不推进 — ❌ 死锁

**根因链**（3 个代码点交叉导致）：

**根因 A：旧存档迁移默认强制开启 AI 托管**

[SaveManager.ts:124](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/SaveManager.ts#L124)：
```typescript
if (data.earthCivi.isAiBrainEnabled === undefined) data.earthCivi.isAiBrainEnabled = true;
```
旧存档（v3 及以前无此字段）加载后 `isAiBrainEnabled = true`，而 [EarthCivilization.ts:30](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L30) 源码默认 `false`，[GameCoverScreen.tsx:23](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/GameCoverScreen.tsx#L23) 新游戏也默认 `false`。**矛盾：新游戏手动，旧存档强制 AI 托管。**

**根因 B：有交互事件时不推进年份**

[Game.ts:592](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L592)：
```typescript
if (interactiveEvents.length === 0) {
  // ... 推进年份（第 700 行 this.year++）
} else {
  this.processNextEvent();  // 不推进年份
  this.addHistory("已触发交互事件，年份推进暂缓");
}
```

**根因 C：事件队列不空时阻断回合**

[Game.ts:305-308](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L305-L308)：
```typescript
if (this.currentEvent || this.eventQueue.length > 0) {
  this.addHistory("提示：请先处理当前的剧情事件。");
  return;  // 直接返回，不推进
}
```

**根因 D：AI 托管不处理交互事件**

[Game.ts:217-274](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L217-L274) `runAIBrain()` 只处理 AP 消耗（科研/采矿/工厂/部长任命），**不自动处理交互事件的选择**。

**死锁形成**：
1. 旧存档加载 → AI 托管开启
2. 点"下一回合" → 触发交互事件 → eventQueue 不空 → 走 else 分支 → 年份不推进
3. 事件弹窗需要玩家手动选择 → 但 AI 托管模式下玩家可能不知道需要手动操作（无提示）
4. 事件未处理 → eventQueue 持续不空
5. 再次点"下一回合" → 第 305 行 return → **永远卡死**

**修复建议**：
- SaveManager.ts:124 改为 `isAiBrainEnabled = false`（与源码默认一致）
- 或：AI 托管时自动选择事件默认选项
- 或：事件弹窗显示明确提示"AI 托管不处理剧情事件，请手动选择"

---

### Bug 2: AI 直接托管无法取消、操作无提示 — ❌ 双重问题

**问题 A：旧存档强制 AI 托管（与 Bug 1 根因 A 相同）**

玩家加载旧存档后 `isAiBrainEnabled = true`，不知道为什么被强制开启。

**问题 B：切换按钮存在但反馈不足**

[TopHUD.tsx:242-261](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx#L242-L261) 有 AI 切换按钮：
```typescript
onClick={() => {
  game.earthCivi.isAiBrainEnabled = !game.earthCivi.isAiBrainEnabled;
  window.dispatchEvent(new CustomEvent('ai-brain-toggled'));
  window.dispatchEvent(new CustomEvent('game-state-changed'));
}}
```

按钮存在且可切换，但：
- 移动端仅显示图标无文字（第 258 行 `hidden sm:inline`），玩家可能不知道是什么
- 切换后只有 `ai-brain-toggled` 事件，无 Toast/弹窗确认
- 玩家不知道 AI 托管和手动模式的区别

**问题 C：AI 托管时操作无提示**

AI 托管开启时，玩家想手动操作（调工种比例/任命部长/选科技），但：
- [EarthCivilization.ts:65](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L65)：`spendAP` 在 AI 模式下 `canSpendAP` 始终返回 true，玩家不知道操作是否消耗 AP
- 无 UI 提示"当前 AI 托管，手动操作可能被 AI 覆盖"
- 事件弹窗无提示"请手动处理，AI 托管不覆盖剧情选择"

**修复建议**：
- SaveManager.ts:124 改为 `false`
- 切换 AI 托管时显示 Toast 确认
- AI 托管时事件弹窗显示"需要手动选择"提示

---

### Bug 3: 人物登场退场信息栏不刷新 — ❌ 缺少事件派发

**根因：EventSystem 人物解锁不 dispatch 任何 UI 刷新事件**

[EventSystem.ts:241-269](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L241-L269) `applyUnlockPerson()`：
```typescript
private applyUnlockPerson(target: string): void {
  this.game.personManager.unlockPerson(target);
  this.game.addHistory(`【人员加入】${target} 加入了您的阵营！`);
  this.game.playerTimeline.push({ year: this.game.year, event: `...` });
  this.game.tickerMessages.push(`👥 [战略人事公报] ...`);
  // ❌ 没有 window.dispatchEvent(new CustomEvent('game-state-changed'))
  // ❌ 没有 window.dispatchEvent(new CustomEvent('person-change'))
}
```

**对比**：`runAIBrain()` 第 272 行 dispatch `ticker-message-added`，回合完成第 706 行 dispatch `game-turn-complete`，但人物变化不 dispatch 任何事件。

**UI 刷新机制**：React 组件（LeftHub、DiplomacyPanel、CivilizationArchive 等）监听 `game-turn-complete` 刷新。但：
- 人物登场/退场可能发生在事件处理中（不走 year++ 分支），`game-turn-complete` 不触发
- 即使走 year++ 分支，`game-turn-complete` 是回合级刷新，不是人物级刷新

**人物退场同样不 dispatch 事件**：

[Game.ts:676-697](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L676-L697) 角色生命检查：
```typescript
if (p.isAlive && !this.eventManager.isPersonAliveInEpoch(p.name, currentEpochStr)) {
  p.isAlive = false;  // 人物退场
  // ... 解除执剑人/面壁者
  // ... addHistory + tickerMessages
  // ❌ 没有 dispatch 事件
}
```

**"之前修复过的问题还保留着"**：说明之前在某处加了 dispatch，但 EventSystem 的人物解锁路径和 Game.ts 的人物退场路径都没有 dispatch，修复回归了。

**修复建议**：在 `applyUnlockPerson` 末尾和 Game.ts:679 人物退场处添加：
```typescript
window.dispatchEvent(new CustomEvent('game-state-changed'));
```

---

## 二、子代理发现的隐藏 Bug

### 2.1 严重级 Bug

#### Bug 4: star.status 状态标记永不清除

**位置**：
- 设置：[EventSystem.ts:172](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L172)（设置 `'rebellion'`）、[EventSystem.ts:204](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L204)（设置 `'building'`）
- 清除：[StarManager.ts:85-87](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/StarManager.ts#L85-L87) 支持 `null` 参数清除，但**生产代码从不传 null**

**现象**：
- `spawn_barback` 触发后，星系标记 `'rebellion'` **永久保留**，UI 的 "⚠ 叛乱" 永不消失
- `build_infrastructure` 触发后，星系标记 `'building'` **永久保留**，UI 的 "🔨 建设" 永不消失（即便建筑已完成）

**影响**：UI 状态指示器粘性，长期显示过期信息误导玩家。

#### Bug 5: 结局动画 setTimeout 未清理

**位置**：
- [EndingCinematic.tsx:50](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/ending/EndingCinematic.tsx#L50)：`setTimeout(onComplete, 3000)` 嵌套在 setInterval 内，返回值未保存，cleanup 只 clearInterval
- [EndingDeclaration.tsx:43](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/ending/EndingDeclaration.tsx#L43)：同样问题

**影响**：组件在 3000ms 内卸载会调用 `onComplete` 对已卸载组件更新，导致 React 警告或状态错误。

#### Bug 6: 事件监听器泄漏（class 类 UI 层）

**位置**：
- [StarMapRenderer.ts:341,362,374,386,412,454,475](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/StarMapRenderer.ts#L341)：7 处匿名 addEventListener
- [UIManager.ts:28,35,48,66,71,160,163,166,171,181](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/UIManager.ts#L28)：10 处匿名 addEventListener
- [WallfacerPanel.ts:124,135,147,161](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/WallfacerPanel.ts#L124)：4 处
- [PersonSelectPanel.ts:138,146,150](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/PersonSelectPanel.ts#L138)：3 处
- [TecTreeView.ts:50](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/TecTreeView.ts#L50)
- [DepartmentPanel.ts:116](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/DepartmentPanel.ts#L116)

**影响**：class 类 UI 管理器使用匿名函数注册监听器，无法 removeEventListener。canvas 重建或实例替换时旧监听器泄漏，造成内存增长与重复触发。

### 2.2 中等级 Bug

#### Bug 7: switch 缺少 default 分支

| 位置 | switch 对象 | 风险 |
|------|-----------|------|
| [AlienCivilization.ts:156-172](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AlienCivilization.ts#L156-L172) | `this.personality`（5 种 AiPersonality） | 新增性格静默跳过 |
| [EventSystem.ts:25-54](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L25-L54) | `effect`（6 种 EventEffect） | 新增效果静默忽略 |
| [EventSystem.ts:109-117](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L109-L117) | `canonicalTarget`（7 种目标） | 新增资源类型静默失败 |
| [EventSystem.ts:119-127](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L119-L127) | `canonicalTarget`（7 种目标） | 同上 |

#### Bug 8: floating promise（未 await 也未 .catch）

[StatisticsManager.ts:39,44,108](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/StatisticsManager.ts#L39)：`this.uploadStats()` 是 async 函数，被调用时未 await 也未 .catch()。

#### Bug 9: 字符串首字符越界

| 位置 | 表达式 | 风险 |
|------|--------|------|
| [WallfacerPanel.ts:31](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/WallfacerPanel.ts#L31) | `p.name[0]` | 空字符串显示 undefined |
| [WallfacerPanel.ts:60](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/WallfacerPanel.ts#L60) | `earth.swordholder[0]` | 同上 |
| [PersonSelectPanel.ts:104](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/PersonSelectPanel.ts#L104) | `p.name[0]` | 同上 |
| [DepartmentPanel.ts:61](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/ui/DepartmentPanel.ts#L61) | `dept.leaderName[0]` | 同上 |

#### Bug 10: FloatingText 组件 setTimeout 未清理

[FloatingText.tsx:17-19](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/FloatingText.tsx#L17-L19)：`setTimeout` 未保存返回值，useCallback 无 cleanup，组件卸载后仍调用 setFloaters。

### 2.3 低严重级 Bug

#### Bug 11: spawn_barback 无游戏数据接入

[EventSystem.ts:146-173](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L146-L173) 的 `spawn_barback` 效果已完整实现且有单元测试，但 `events.json` 和 `randomevents.json` 中**均无事件使用该效果**。功能永远不会被触发。

#### Bug 12: 可选链使用不一致

[Game.ts:1581-1583](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1581-L1583)：`safeSP(inst.earthCivi, ...)` 直接访问，下一行 `safeSP(inst.earthCivi?.tecTreeManager, ...)` 用可选链，风格不一致。

---

## 三、对照文档的代码完成情况核实

### 3.1 STATUS.md 任务完成度核实

| 任务 | 看板状态 | 实际核实 | 一致性 |
|------|---------|---------|--------|
| TASK-P0: Beta 红线修复 | `[ ]` 未完成 | 硬编码✅存档bug✅结局Flag✅，但**新引入3个严重bug** | 不一致（红线解除但新bug） |
| TASK-AP: AP/AI智脑 | `[ ]` 未完成 | 代码已实现但**SaveManager迁移默认值错误** | 不一致（代码完成但看板未更新） |
| TASK-EVENT: 事件实体化 | `[x]` 已完成 | 4种效果已实现，但**star.status永不清除** + **spawn_barback无数据** | 部分不一致 |
| TASK-ARCH: 架构债务清理 | `[ ]` 未完成 | Game.ts 1700行+，未拆分 | 一致 |
| TASK-HYGIENE: 项目卫生清理 | `[ ]` 未完成 | 遗留UI层/console残留/监听器泄漏均未清理 | 一致 |

### 3.2 TASK-EVENT 深度核实

子代理核实 TASK-EVENT 的 4 种新效果：

| 效果 | 代码实现 | 数据接入 | 测试 | 隐藏问题 |
|------|---------|---------|------|---------|
| `spawn_barback` | ✅ 完整 | ❌ **无数据** | ✅ 有测试 | star.status 永不清除 |
| `lock_ratio` | ✅ 完整 | ✅ events.json:928 | ✅ 有测试 | 无 |
| `rush_tech` | ✅ 完整 | ✅ events.json:589 | ✅ 有测试 | 无 |
| `build_infrastructure` | ✅ 完整 | ✅ events.json:1153 | ✅ 有测试 | star.status 永不清除 |

**结论**：TASK-EVENT 代码实现真实完整，但 `spawn_barback` 无数据接入 + `star.status` 永不清除是两个隐藏问题。

---

## 四、Bug 严重度汇总

### 4.1 致命级（直接卡死游戏）

| Bug | 根因 | 修复方案 |
|-----|------|---------|
| **Bug 1: 纪元卡死0年** | SaveManager.ts:124 默认 true + 交互事件死锁 | 改为 false + AI自动处理事件或提示 |

### 4.2 严重级（影响核心体验）

| Bug | 根因 | 修复方案 |
|-----|------|---------|
| **Bug 2: AI托管无法取消/无提示** | 旧存档默认 true + 切换无反馈 | 改为 false + Toast 确认 + 事件提示 |
| **Bug 3: 人物登场退场不刷新** | EventSystem 不 dispatch 事件 | 添加 dispatchEvent('game-state-changed') |
| **Bug 4: star.status 永不清除** | 生产代码不传 null 清除 | 建筑完成/叛乱结算后 markStarStatus(null) |
| **Bug 5: 结局动画 setTimeout 未清理** | setTimeout 返回值未保存 | 保存 id + cleanup 中 clearTimeout |
| **Bug 6: 事件监听器泄漏** | class 类匿名监听器 | 改用具名函数 + destroy() 方法 |

### 4.3 中等级（影响代码质量）

| Bug | 根因 | 修复方案 |
|-----|------|---------|
| **Bug 7: switch 缺 default** | 4 处 switch 无 default | 添加 default 分支 |
| **Bug 8: floating promise** | StatisticsManager 3 处 | 添加 .catch() |
| **Bug 9: 字符串首字符越界** | 4 处 [0] 未检查 | 改为 (str[0] || '?') |
| **Bug 10: FloatingText setTimeout** | 未保存返回值 | 保存 id + cleanup |

### 4.4 低严重级

| Bug | 根因 |
|-----|------|
| **Bug 11: spawn_barback 无数据** | events.json 未使用该效果 |
| **Bug 12: 可选链不一致** | Game.ts:1581-1583 |

---

## 五、修复优先级建议

### P0（立即修复，阻断游戏）

1. **Bug 1**: SaveManager.ts:124 改 `isAiBrainEnabled = false`
2. **Bug 1 补充**: AI 托管时事件弹窗显示"请手动选择"提示
3. **Bug 3**: EventSystem.ts:269 和 Game.ts:697 添加 `window.dispatchEvent(new CustomEvent('game-state-changed'))`

### P1（本轮修复，影响体验）

4. **Bug 2**: AI 切换时显示 Toast 确认
5. **Bug 4**: EventSystem.ts:172/204 在叛乱结算后和建筑完成后 `markStarStatus(star, null)`
6. **Bug 5**: EndingCinematic.tsx:50 和 EndingDeclaration.tsx:43 保存 setTimeout id

### P2（下轮修复，代码质量）

7. **Bug 6**: class 类 UI 添加 destroy() 方法
8. **Bug 7**: 4 处 switch 添加 default
9. **Bug 8**: StatisticsManager floating promise 添加 .catch()
10. **Bug 9/10**: 字符串越界 + FloatingText setTimeout

### P3（内容补充）

11. **Bug 11**: events.json 补充 spawn_barback 事件数据

---

## 六、审计核实记录

### 6.1 本次亲自核实项

| 核实项 | 方法 | 结果 |
|--------|------|------|
| Bug 1 根因链 | 读 Game.ts:302-724 + SaveManager.ts:124 | 死锁确认 |
| Bug 2 根因 | 读 TopHUD.tsx:242-261 + SaveManager.ts:124 | 默认值错误确认 |
| Bug 3 根因 | 读 EventSystem.ts:241-269 + grep dispatchEvent | 无事件派发确认 |
| STATUS.md 对照 | 子代理核实 TASK-EVENT | 2 个隐藏问题 |
| 隐藏 bug 搜索 | 子代理 10 类模式扫描 | 12 个 bug |

### 6.2 子代理核实范围

- STATUS.md 已完成任务真实性（TASK-EVENT 4 种效果逐项核实）
- 10 类隐藏 bug 模式全量扫描（src/core/ + src/components/ + src/ui/）

---

**审计完成。**

核心结论：发现 12 个 bug，其中 1 个致命（纪元卡死死锁）、5 个严重（AI托管/人物刷新/star.status/结局动画/监听器泄漏）、4 个中等、2 个低。最紧急的修复是 SaveManager.ts:124 的默认值（1 行代码解决 Bug 1 和 Bug 2 的核心问题）。
