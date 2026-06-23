# Beyond-the-Light-Cone 完整 Bug 审计报告
**审计日期**: 2026-06-22  
**项目分支**: `03_Web_Rebuild`  
**审计人**: GLM-5.2 (Trae Assistant)

---

## 审计环境

| 检查项 | 结果 |
|--------|------|
| `npm run typecheck` | 0 错误 ✓ |
| `npm run lint` | 0 错误，12 警告 ✓ |
| `npm test` | 833/833 测试通过 ✓ |
| 检查文件数量 | ~50+ 核心文件 ✓ |

---

## 已识别 Bug 列表（按严重程度排序）

### 严重 (Critical)

| Bug ID | 位置 | 问题描述 | 修复状态 |
|--------|------|----------|----------|
| **BUG-01** | [Game.ts:206-235](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L206-L235) | `runARound()` 在早期返回检查之前就推入 `turnHistory` 快照。当玩家在有未处理事件时反复点击"下一回合"，会导致快照泄漏，填满 10 个快照槽位都是无效状态，使命运分歧回滚不可用。 | ✅ 已修复 |
| **BUG-02** | [AlienCivilization.ts:110-128](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AlienCivilization.ts#L110-L128) | `launchHandoverWaterdropAttack()` 不检查 `waterdropCount >= 3`，可能突破水滴上限，导致难度异常。 | ✅ 已修复 |
| **BUG-03** | [Game.ts:597-610](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L597-L610) | `finally` 块中无论是否发生错误都执行 `autoSave`，可能将不一致的游戏状态写入存档，导致存档损坏。 | ✅ 已修复 |

---

### 高 (High)

| Bug ID | 位置 | 问题描述 | 修复状态 |
|--------|------|----------|----------|
| **BUG-04** | [Game.ts:1254-1260](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1254-L1260) | `getEndingForecast()` 使用错误的 flag 名 (`dark_domain_declared`) 和年份阈值 (280)，实际事件触发使用 `dark_domain_decision` 和 250。结局预测进度不准确。 | ✅ 已修复 |
| **BUG-05** | [Game.ts:977-1001](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L977-L1001) | `HELIUM_FLASH` 结局中，当 `loreMode === 'strict_three_body'` 但 `dimensionStrikeTriggered === false` 时，`defeatType` 是 `HELIUM_FLASH` 但 `gameOverReason` 显示"二向箔打击"，类型与文本不匹配。修复后保留 `strict_three_body` 模式逻辑一致性：在严格三体设定模式下，默认超 350 年触发二向箔打击而不是氦闪。 | ✅ 已修复 |
| **BUG-06** | [EarthCivilization.ts:566-607](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L566-L607) | `processFleets()` 在舰队成功占领星系后不将舰队从 `fleets` 数组移除，舰队永久残留，影响后勤维修计算。 | ✅ 已修复 |
| **BUG-07** | [EarthCivilization.ts:322-382](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L322-L382) | 多个工厂循环消耗资源时，最后一个工厂可能使 `resource` 变为负数（当奇数值时）。虽然 `sanitizeResources` 后续会重置，但中间计算可能产生异常。 | ✅ 已修复 |
| **BUG-08** | [GameEventManager.ts:1005-1015](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L1005-L1015) | `checkRandomEvents()` 直接 `e.cadenceMeta!.probability = prob` 变异原始事件对象。虽然这里 `prob` 等于原值，但设计上不正确，若事件原本有动态概率会被覆盖。 | ✅ 已修复：删除了不必要的赋值行 |

---

### 中 (Medium)

| Bug ID | 位置 | 问题描述 | 修复状态 |
|--------|------|----------|----------|
| **BUG-09** | [EventSystem.ts:54-65](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts#L54-L65) + [Game.ts:586-600](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L586-L600) | 年份推进职责分散在 `Game.runARound` 和 `EventSystem.applyEventEffect`，容易导致双重推进。添加 `_yearJustAdvanced` 安全锁防止双重推进，且统一 `game-turn-complete` 事件分发。 | ✅ 已修复 |
| **BUG-10** | [TopHUD.tsx:113-116](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx#L113-L116) + [App.tsx:245-253](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx#L245-L253) | UI 组件手动分发 `game-turn-complete` 事件后，`Game`/`EventSystem` 又分发一次，导致双重分发，组件重复刷新。 | ✅ 已修复：删除 UI 手动分发，统一由核心系统分发 |

---

### 低 (Low) - 本报告未要求修复

| Bug ID | 位置 | 问题描述 |
|--------|------|----------|
| **BUG-11** | [PopulationSystem.ts:27-29](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/PopulationSystem.ts#L27-L29) | `getEarthPopulationCapacity()` 返回 300，但 `StarManager.init` 中地球的 `populationLimit` 是 1000。两个定义不一致。 |
| **BUG-12** | [EventSystem.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts) | `applyNewEffects()` 中 `clampEffectValue()` 已经截断，应用代码又 `Math.min(earthCivi.army * 0.5, Math.abs(val))` 二次截断，效果比设计偏小。 |
| **BUG-13** | [EarthCivilization.ts:476-477](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L476-L477) | `progress = 10 + scienceBonus` 后 `if (progress < 5)` 永远不可达，死代码。 |
| **BUG-14** | [AlienCivilization.ts:292-318](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AlienCivilization.ts#L292-L318) | 触发维度打击时历史消息写"5回合后"，实际 `dimensionStrikeWarningTurns = 5`，递减后第 5 次递减后变为 0 在同回合触发，需要 5 + 1 = 6 回合。 |
| **BUG-15** | 多个组件 | 12 个 Lint 警告，主要是 `react-hooks/exhaustive-deps` 依赖缺失。不影响功能但可能导致闭包陈旧。 |

---

## 下一回合推进流验证（移动端 + 网页端）

### 当前结构

| 入口 | 调用路径 | `game-turn-complete` 分发位置 |
|------|----------|-------------------------------|
| **网页端**: TopHUD "下一回合"按钮 | `TopHUD.handleNextTurn → game.runARound` | `Game.runARound` (无交互) / `EventSystem.applyEventEffect` (事件队列为空) |
| **网页端**: UIManager legacy button | `btnNext.click → game.runARound → this.updateUI` | 同上 |
| **键盘空格**: App.tsx 快捷键 | `keyup → game.runARound` | 同上 |
| **移动端**: MobileBottomNav 通过订阅事件刷新 | 订阅 `game-turn-complete` 事件 | 同上 |
| **底部事件栏**: BottomEventBar | 订阅 `game-turn-complete` 事件更新消息 | 同上 |

### 修复后流程

1. **无交互事件**: `Game.runARound` 内部推进年份，结束后分发 `game-turn-complete`
2. **有交互事件**: 交互处理完成后 `EventSystem.applyEventEffect` 在队列空时推进年份并分发
3. **安全机制**: `_yearJustAdvanced` 标志防止双重推进
4. **移动端和网页端共享同一个分发点**，双方刷新一致

**结论**: ✅ 移动端和网页端下一回合都能正常推进，事件分发一致。

---

## 修复总结

### 修改的文件列表

| 文件 | 修改内容 |
|------|----------|
| [core/Game.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts) | 1. 快照推入移到早期返回之后；2. 添加 `_hadRunError` 和 `_yearJustAdvanced` 字段；3. `finally` 块仅在无错时存档；4. `getEndingForecast` 修正 flag 和年份；5. 修复结局文本/类型一致性；6. 添加 `game-turn-complete` 分发；7. 排除 transient 字段序列化 |
| [core/AlienCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/AlienCivilization.ts) | `launchHandoverWaterdropAttack` 添加 `waterdropCount < 3` 检查 |
| [core/EarthCivilization.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts) | 1. 胜利占领后移除舰队；2. `resource = Math.max(0, ...)` 防止负数 |
| [core/GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts) | 删除不必要的 `cadenceMeta.probability` 赋值 |
| [core/subsystems/EventSystem.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/subsystems/EventSystem.ts) | 添加 `!this.game._yearJustAdvanced` 检查防止双重推进 |
| [components/TopHUD.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/TopHUD.tsx) | 删除手动 `dispatchEvent('game-turn-complete')` |
| [App.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/App.tsx) | 键盘空格处理删除手动 `dispatchEvent('game-turn-complete')` |
| [test/core/Game.defeatConditions.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/Game.defeatConditions.test.ts) | 添加 `game.loreMode = 'liu_cixin_mixed'` 使断言正确 |
| [test/core/Game.victoryConditions.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/Game.victoryConditions.test.ts) | 添加 `game.loreMode = 'liu_cixin_mixed'` 使断言正确 |

---

## 最终验证

```
npm run typecheck → 0 错误
npm run lint → 0 错误，12 警告（均为低优先级的 React Hooks 依赖警告）
npm test → 833/833 测试全部通过
```

**审计完成**。所有高优先级 bug 已修复，下一回合推进在网页端和移动端都能正常工作。
