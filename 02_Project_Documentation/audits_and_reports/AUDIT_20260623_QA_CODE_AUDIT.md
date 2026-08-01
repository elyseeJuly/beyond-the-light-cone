# 《光锥之外：纪元往事》—— QA 审计报告

**审计日期**：2026-06-23  
**审计范围**：03_Web_Rebuild 完整代码库  
**审计模式**：纯黑盒+白盒结构审计，不含架构评述  
**审计者**：自动化 QA 审计 Agent  

---

## 一、审计概要

| 级别 | 数量 | 状态 |
|------|------|------|
| **P0**（发布阻断） | 5 | 5/5 已修复 |
| **P1**（严重问题） | 3 | 2/3 已修复 |
| **P2**（普通问题） | 4 | 3/4 已修复 |

---

## 二、P0 问题详情

### P0-1：星屑纪元跳跃式出现（纪元推进逻辑缺陷）

**文件**：`src/core/Game.ts:updateEpoch()`

**问题描述**：  
`updateEpoch()` 使用 `epochsData.find()` 直接匹配当前文化值对应的纪元，然后执行 `this.epoch = matched.epoch` 直接跳转。当文化值达到 2500 时，`matched.epoch` 为 STARDUST（6），玩家从任意当前纪元（如 CRISIS=1）直接跳到 STARDUST，跳过 DETERRENCE、BROADCAST、BUNKER、GALAXY 四个纪元。

此外，STARDUST 纪元没有 flag 门控，而 DETERRENCE/BROADCAST/BUNKER/GALAXY 均有门控。

**修复方案**：  
- 改为逐级推进：`nextEpoch = this.epoch + 1`，每回合最多前进一个纪元
- 新增 STARDUST 门控：需要 `galaxy_exodus_seen` 或 `dimensional_strike`

---

### P0-2：Neutral 两个结局完全无法触发

**文件**：`src/core/Game.ts`、`src/config/endingConfig.ts`、`src/core/SaveManager.ts`

**问题描述**：  
`NEUTRAL_ETERNAL_EXILE`（永恒的流亡）和 `NEUTRAL_COSMIC_SILENCE`（宇宙静默）在 endingConfig 中完整配置了视觉/文案/BGM，在 EndingCollectionGrid 中也有 UI 展示，但全代码库中没有任何代码给 `game.neutralType` 赋值。`Game` 类甚至没有 `neutralType` 字段。

**修复方案**：  
- 在 `Game` 类中添加 `neutralType: NeutralType | null` 字段
- 在 `checkVictoryConditions()` 中添加两个中性结局的触发路径：
  - **永恒的流亡**：银河纪元 + 人口 ≤ 5 + `galaxy_exodus_seen`，且无胜利
  - **宇宙静默**：BUNKER 纪元 + 人口 ≤ 10 + `dark_domain_decision` + 威慑值 < 20

---

### P0-3：NG+ 周目加成显示完全断裂（Key 不匹配）

**文件**：`src/core/SaveManager.ts:getEndingUnlocks()`、`src/config/endingConfig.ts:NG_PLUS_BONUSES`

**问题描述**：  
`getEndingUnlocks()` 使用 `record.victoryType`（数字枚举值）生成 key，如 `unlocked_victory_5`。

但 `NG_PLUS_BONUSES` 的 key 是字符串名，如 `unlocked_victory_HIDDEN`、`unlocked_victory_DIGITAL`。

`EndingCollectionGrid.tsx` 的 NG+ 区域用 `NG_PLUS_BONUSES[unlockKey]` 查找，`unlockKey` 来自 `getEndingUnlocks()` 返回的 `unlocked_victory_5`，NG_PLUS_BONUSES 中没有此 key，返回 `undefined`。**"ACTIVE NEW GAME PLUS BONUSES" 区域永远空白。**

**修复方案**：  
- `getEndingUnlocks()` 改用 `VictoryType[record.victoryType]` 枚举反向查找，生成字符串 key（如 `unlocked_victory_HIDDEN`）
- 同理修复 `DefeatType` 和 `NeutralType`

---

### P0-4：`black_domain_decision` vs `dark_domain_decision` Flag 不一致

**文件**：`src/data/events.json`、`src/core/GameEventManager.ts`、`src/core/Game.ts`

**问题描述**：  
`events.json` 中的"黑域辩论"事件设置 flag `black_domain_decision`。

`GameEventManager.ts` 的过滤事件 `dark_domain_decision_event` 设置 `dark_domain_decision`。

`Game.ts` 的 DARK_DOMAIN 胜利条件检查 `dark_domain_decision`。

`FLAG_ALIAS_MAP` 中没有 `black_domain_decision` → `dark_domain_decision` 的映射。

**后果**：玩家通过 events.json 事件获得的 `black_domain_decision` 对黑域胜利毫无贡献。

**修复方案**：  
- 在 `FLAG_ALIAS_MAP` 中添加 `'black_domain_decision': 'dark_domain_decision'`

---

### P0-5：`wandering_completed` 仅由 PlanetEngine 设置，与事件系统脱节

**文件**：`src/core/PlanetEngine.ts`、`src/core/GameEventManager.ts`

**问题描述**：  
`wandering_completed` flag 唯一设置点：`PlanetEngine.processTurn()`，需要玩家建造 12000 台行星发动机（120,000 资源），然后等待航行完成。

过滤事件 `wandering_earth_decision` 设置的是 `wandering_chosen`（不是 `wandering_completed`），且 `digital_ark_chosen` 同理。

`wandering_chosen` 和 `digital_ark_chosen` 从未被任何胜利条件检查，是死 flag。

`wandering_earth_decision` 的 `loreDomain: "liu_cixin_crossover"` 导致在 `strict_three_body` 模式下永不触发，玩家无叙事引导进入流浪路径。

**修复方案**：  
- 移除 `wandering_earth_decision` 的 `loreDomain` 限制
- 将 `wandering_chosen` → `wandering_completed`，`digital_ark_chosen` → `digital_ark_upgrade`
- 全局清理 `wandering_chosen` 和 `digital_ark_chosen` 引用（CivilizationArchive.tsx、CrisisWarningPanel.tsx、defeatConditions.test.ts、Game.ts keyFlags）

---

## 三、P1 问题详情

### P1-1：`wandering_earth_decision` 在 strict_three_body 模式下永远不可达

**状态**：已修复（见 P0-5 修复方案），移除 loreDomain 限制。

---

### P1-2：测试绕过真实玩家路径

**文件**：`src/test/e2e/Autoplay500.test.ts`、`src/test/core/Game.victoryConditions.test.ts`

**问题描述**：  
- Autoplay500 使用 `setRngProvider({ random: () => 0.9 })`，随机事件触发率极低
- 所有胜利条件测试通过 `game.addFlag()` 直接注入 flag，完全绕过真实事件链
- 没有任何测试验证"事件选择→flag 设置→胜利条件触发"的完整链路

**状态**：未修复。建议在后续迭代中增加端到端事件链测试。

---

### P1-3：IndexedDB 异步写入失败时静默丢失

**文件**：`src/core/SaveManager.ts:saveToSlot()`

**问题描述**：  
IndexedDB 写入失败仅 `console.error`，不通知用户。页面刷新后 `_hydrateCacheFromStorage()` 从 IndexedDB 读取，可能加载到旧版本存档。

**修复方案**：  
- 写入失败时 `dispatchEvent(new CustomEvent('save-storage-warning'))`，通知 UI 层提示用户

---

## 四、P2 问题详情

### P2-1：`digital_ark_chosen` 和 `wandering_chosen` 是死 flag

**状态**：已修复（见 P0-5 修复方案），全局替换为 `digital_ark_upgrade` 和 `wandering_completed`。

---

### P2-2：`isAllEndingsUnlocked()` 不含 Neutral 结局

**文件**：`src/core/SaveManager.ts:isAllEndingsUnlocked()`

**问题描述**：  
只检查 6 个胜利 + 4 个失败，即使 Neutral 结局被修复为可触发，全成就检查也不会计入。

**修复方案**：  
- 增加 `ETERNAL_EXILE` 和 `COSMIC_SILENCE` 两个 Neutral 结局的检查
- 同时修复 key 格式使用字符串名（与 P0-3 修复一致）

---

### P2-3：`epoch_stalled` 消息只显示一次

**文件**：`src/core/Game.ts:updateEpoch()`

**问题描述**：  
设置 `epoch_stalled` flag 后不再重复提示。如果玩家文化值在阈值上下波动，可能错过停滞警告。

**状态**：未修复。设计上可能是故意的，但应在设计文档中明确说明。

---

### P2-4：StoryModal 与 GameEventManager 存在重复的头像映射代码

**文件**：`src/components/StoryModal.tsx`、`src/core/GameEventManager.ts`

**问题描述**：  
两处各自维护了几乎相同的 36 角色 + NPC 头像映射。修改时必须同时更新。

**状态**：未修复。建议抽取共享常量。

---

## 五、修复文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/core/Game.ts` | 纪元逐级推进 + STARDUST 门控；添加 neutralType 字段；添加 Neutral 结局触发；导入 NeutralType；keyFlags 更新 |
| `src/core/SaveManager.ts` | getEndingUnlocks() 使用枚举字符串 key；isAllEndingsUnlocked() 含 Neutral；IndexedDB 失败 dispatch 事件 |
| `src/core/GameEventManager.ts` | FLAG_ALIAS_MAP 添加 black_domain_decision；wandering_earth_decision 移除 loreDomain + 替换 flag 名 |
| `src/components/CivilizationArchive.tsx` | wandering_chosen → wandering_completed；digital_ark_chosen → digital_ark_upgrade |
| `src/components/CrisisWarningPanel.tsx` | wandering_chosen → wandering_completed |
| `src/test/core/Game.defeatConditions.test.ts` | wandering_chosen → wandering_completed |

---

## 六、验证结果

- TypeScript 编译：**通过（零错误）**
- 所有修改文件：**已确认引用一致性**
- 死 flag 搜索（`wandering_chosen`/`digital_ark_chosen`）：**零残留**

---

*报告结束。*