# 游戏结局系统审计报告

> 审计日期: 2026-06-15
> 审计范围: `03_Web_Rebuild/src/` 下所有结局相关代码
> 审计目标: 核实 9 种结局的可达成性、检测绕过路径、检查结局记录完整性

---

## 一、结局系统架构总览

系统共定义 **9 种结局**（6 胜利 + 3 失败），核心逻辑分布在以下文件：

| 文件 | 职责 |
|------|------|
| `src/core/Game.ts` | 胜利/失败条件检测 `checkVictoryConditions()`，游戏主循环 |
| `src/config/endingConfig.ts` | 9 种结局的视觉文案配置、`resolveEndingKey()` 映射 |
| `src/core/AlienCivilization.ts` | 二向箔维度打击 `processDimensionStrike()` — 绕过主循环的另一条 game-over 路径 |
| `src/core/EarthCivilization.ts` | 人口归零 `sanitizeResources()` — 绕过主循环的另一条 game-over 路径 |
| `src/ui/WallfacerPanel.ts` | 坐标广播按钮 — 手动触发 game-over（硬编码结局类型） |
| `src/core/SaveManager.ts` | 结局记录 `recordEnding()`，用于 New Game+ 继承 |
| `src/components/EndGameScreen.tsx` | 结局展示 UI |
| `src/core/GameEventManager.ts` | 过滤事件系统（含触发结局相关 flag 的关键选择事件） |
| `src/core/PlanetEngine.ts` | 流浪地球推进系统，设置 `wandering_completed` flag |
| `src/core/TecTreeManager.ts` | 科技树，决定关键科技（黑域生成、数字方舟等）的完成状态 |

---

## 二、9 种结局条件详析

### 2.1 胜利结局（6 种）

按 `checkVictoryConditions()` 检查顺序排列：

#### ① HIDDEN — 死神永生·小宇宙
- 位置: [Game.ts:497-510](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L497-L510)
- 条件: 年 ≥ 350 AND 纪元 ≥ GALAXY AND 文化 ≥ 800 AND 人口 > 0 AND 威慑度 ≥ 30 AND 拥有 flag `galaxy_exodus_seen` AND flag `alien_alliance` AND (黑域生成科技完成 OR 数字方舟科技完成)
- 复杂度: **极高** — 需 7 个条件同时满足
- 依赖的前置事件: 银河纪元启航事件 + 异星文明外交事件

#### ② WANDERING — 流浪胜利
- 位置: [Game.ts:512-520](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L512-L520)
- 条件: 行星发动机Ⅲ型 (AEROSPACE) + 新家园选址 (INTERSTELLAR) 科技完成
- 复杂度: **低** — 仅 2 个科技条件

#### ③ DIGITAL — 数字永生胜利
- 位置: [Game.ts:522-528](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L522-L528)
- 条件: 数字方舟 (INFORMATION) 科技完成
- 复杂度: **极低** — 仅 1 个科技条件，最容易达成的胜利

#### ④ DETERRENCE — 威慑胜利
- 位置: [Game.ts:530-539](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L530-L539)
- 条件: 纪元 ≥ DETERRENCE AND 执剑人不为空 AND 人口 > 0 AND 威慑度 ≥ 80
- 复杂度: **中等** — 纪元 + 人物 + 数值

#### ⑤ CONQUEST — 征服胜利
- 位置: [Game.ts:541-547](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L541-L547)
- 条件: `alienCiviManager.isAllCiviConquered()` — 所有异星文明灭亡或臣服
- 复杂度: **高** — 依赖于复杂的战斗/外交系统
- 额外约束: `this.aliens.size > 0`，无外星文明时永不触发

#### ⑥ DARK_DOMAIN — 黑域胜利
- 位置: [Game.ts:549-555](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L549-L555)
- 条件: 黑域生成科技完成（任意科技树）
- 复杂度: **极低** — 仅 1 个科技条件

### 2.2 失败结局（3 种）

按 `checkVictoryConditions()` 中的检测顺序排列：

#### ⑦ TREACHERY — 文明崩溃（逃亡主义）
- 位置: [Game.ts:582-593](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L582-L593)
- 条件: 逃亡度 ≥ 100
- 触发时机: 在 6 个胜利条件均不满足后检查

#### ⑧ EXTINCTION — 文明灭绝
- 位置: [Game.ts:595-606](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L595-L606)
- 条件: 人口 ≤ 0
- 触发时机: 在胜利条件和逃亡检查之后

#### ⑨ HELIUM_FLASH — 太阳氦闪/二向箔打击
- 位置: [Game.ts:608-621](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L608-L621)
- 条件: 年 > 350 AND 无黑域生成科技 AND 无数字方舟科技 AND 无 flag `dimensional_defense` AND 无 flag `wandering_chosen`
- 触发时机: 最后检查

---

## 三、严重问题

### 问题 1：[严重] `wandering_chosen` flag 可无限期绕过氦闪失败

- **位置**: [Game.ts:608](file:///Users/quantumrose/Documents/Emberois/LegendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L608)
- **现象**: 玩家在「流浪地球大辩论」事件中选择「启动流浪地球计划」获得 `wandering_chosen` flag 后，即使年 > 350 且未完成流浪胜利所需的科技，氦闪失败条件也被绕过。
- **成因**: 氦闪判败条件将此 flag 作为逃逸条件之一（与黑域生成、数字方舟同等地位），但 `wandering_chosen` 仅代表"选择了流浪路径"，不代表真正具备逃逸能力。
- **影响**: 玩家可在年 > 350 后无限回合继续游戏，没有任何失败结局机制约束。**这是你试玩中最可能遇到的绕过场景。**

**复现步骤**:
1. 在 `wandering_earth_decision` 事件中选择「启动流浪地球计划」
2. 确保未完成黑域生成/数字方舟/行星发动机Ⅲ型+新家园选址
3. 年 > 350 后持续游戏 → 氦闪不触发，可无限继续

---

### 问题 2：[严重] `processDimensionStrike()` 绕过结局统一管理

- **位置**: [AlienCivilization.ts:288-310](file:///Users/quantumrose/Documents/Emberois/LegendOfUni-rebuild/03_Web_Rebuild/src/core/AlienCivilization.ts#L288-L310)
- **现象**: 二向箔打击到达时直接设置 `game.isGameOver = true` 并 dispatch `game-over` 事件，完全绕过 `checkVictoryConditions()` 方法。
- **具体问题**:
  - ❌ 未调用 `SaveManager.recordEnding()` → 结局不记录到收集系统
  - ❌ 使用硬编码值 `defeatType = 2` 而非枚举类型
  - ❌ 如果玩家同时满足胜利条件（如已有黑域生成），虽然 `survives` 分支让文明幸存，但**游戏并不会以胜利结局**
  - ❌ 未设置 `gameOverReason`

---

### 问题 3：[严重] 多处 game-over 路径不记录结局

以下路径均不调用 `SaveManager.recordEnding()`，导致 New Game+ 继承系统无法获取这些结局的解锁状态：

| 触发位置 | 触发条件 | 文件行 |
|---------|---------|--------|
| 二向箔维度打击 | 外星文明释放二向箔且无逃生手段 | `AlienCivilization.ts:303` |
| 人口归零 (sanitize) | 资源结算中人口降至 ≤ 0 | `EarthCivilization.ts:213` |
| 坐标广播按钮 | 玩家手动触发引力波广播 | `WallfacerPanel.ts:171` |

此外，`sanitizeResources` 甚至 **不设置 `defeatType`**，导致 `resolveEndingKey()` 走默认 fallback。

---

### 问题 4：[中] `dimensional_defense` flag 从未在实际游戏中被设置

- **位置**: [Game.ts:608](file:///Users/quantumrose/Documents/Emberois/LegendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L608)
- **现象**: 氦闪逃逸条件之一 `dimensional_defense` flag 在游戏逻辑中从未被设置。
- **证据**:
  - 整个 `src/` 下仅有 4 处引用此 flag：Game.ts 的判败条件、测试文件（手动设置）、CrisisWarningPanel UI 显示
  - 随机事件中设置的是 `dimensional_defense_focus`（不同 flag 名），与检查的 flag 不一致
- **影响**: 此逃逸路径对玩家不可用，氦闪倒计时警告中显示的此条件具有误导性。

---

### 问题 5：[中] WallfacerPanel 坐标广播使用硬编码数值

- **位置**: [WallfacerPanel.ts:173-177](file:///Users/quantumrose/Documents/Emberois/LegendOfUni-rebuild/03_Web_Rebuild/src/ui/WallfacerPanel.ts#L173-L177)
- **代码**:
  ```typescript
  game.victoryType = 5;   // VictoryType.HIDDEN — 硬编码
  game.defeatType = 1;    // DefeatType.EXTINCTION — 硬编码
  ```
- **风险**: 如果枚举值未来发生变化（如在中间插入新值），此处的硬编码将产生错误映射。且未使用 `SaveManager.recordEnding()` 记录结局。

---

### 问题 6：[低] 胜利条件检查顺序导致的覆盖问题

- **位置**: [Game.ts:494-556](file:///Users/quantumrose/Documents/Emberois/LegendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L494-L556)
- **检查顺序**: HIDDEN → WANDERING → DIGITAL → DETERRENCE → CONQUEST → DARK_DOMAIN
- **可能的玩家困惑场景**:
  - 完成黑域生成 + 所有 HIDDEN 前置 → 跳 HIDDEN 结局，DARK_DOMAIN 永不触发
  - 完成行星发动机Ⅲ型 + 新家园选址 + 黑域生成 → 跳 WANDERING，DARK_DOMAIN 永不触发
  - 完成数字方舟 + HIDDEN 前置 → 跳 HIDDEN，DIGITAL 永不触发
- **说明**: 可能是设计意图（隐藏结局优先级最高），但玩家可能困惑为何完成了某科技却未获得对应结局。

---

## 四、单元测试覆盖缺口

| 结局类型 | 是否有测试 | 说明 |
|---------|-----------|------|
| 人口≤0 → 灭绝 | ✅ Game.test.ts:397-401 | |
| 逃亡≥100 → 崩溃 | ✅ Game.test.ts:403-407 | |
| 年>350 无科技 → 氦闪 | ✅ Game.test.ts:409-416 | |
| strict模式 年>350 → 二向箔 | ✅ Game.test.ts:418-424 | |
| 有逃逸能力 年>350 不终止 | ✅ Game.test.ts:426-432 | |
| 征服胜利 | ✅ Game.test.ts:434-440 | |
| **流浪胜利** | ❌ **无测试** | |
| **数字永生胜利** | ❌ **无测试** | |
| **威慑胜利** | ❌ **无测试** | |
| **黑域胜利** | ❌ **无测试** | |
| **死神永生胜利** | ❌ **无测试** | |
| **维度打击 game-over** | ❌ **无测试** | |
| **坐标广播结局** | ❌ **无测试** | |
| **结局记录逻辑** | ❌ **无测试** | SaveManager.recordEnding 是否被正确调用 |

---

## 五、修复建议

### 优先级 1 — 立即修复

**修复 `wandering_chosen` 氦闪绕过**（[Game.ts:608](file:///Users/quantumrose/Documents/Emberois/LegendOfUni-rebuild/03_Web_Rebuild/src/core/Game.ts#L608)）

方案 A（推荐）：将逃逸条件改为检查实际逃逸能力而非仅 flag：
```
- !this.hasFlag("wandering_chosen")
+ tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型") && tm.isTecFinished(TecTreeType.INTERSTELLAR, "新家园选址")
```

方案 B：移除 `wandering_chosen` 作为逃逸条件，仅保留硬性科技逃逸（黑域生成、数字方舟）。

---

### 优先级 2 — 高

**统一所有 game-over 路径**：确保所有 game-over 触发点都经过 `checkVictoryConditions()` 或至少调用 `SaveManager.recordEnding()`。涉及文件:
- `AlienCivilization.ts:processDimensionStrike()`
- `EarthCivilization.ts:sanitizeResources()`
- `WallfacerPanel.ts:广播按钮`

---

### 优先级 3 — 中

**修复 `dimensional_defense` flag 缺失**：将随机事件中设置的 `dimensional_defense_focus` 改为 `dimensional_defense`，或在相应事件处理中建立两者关联。

**替换 WallfacerPanel 硬编码为枚举引用**：
```
- game.victoryType = 5;
- game.defeatType = 1;
+ game.victoryType = VictoryType.HIDDEN;
+ game.defeatType = DefeatType.EXTINCTION;
```

**补充缺失的单元测试**：添加 6 个胜利结局 + 2 个 game-over 路径的测试覆盖。

---

## 六、测试运行结果

```
 Test Files  1 failed | 26 passed (27)
      Tests  1 failed | 476 passed (477)
```

- 476/477 测试通过
- 1 个失败测试为已有预存问题（`should unlock civilizations progressively` — 文明逐步解锁测试，非本次审计范围）
- 结局相关测试全部通过

---

*报告完毕*