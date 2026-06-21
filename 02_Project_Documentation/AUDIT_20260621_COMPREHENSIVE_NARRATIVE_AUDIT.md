# Comprehensive Narrative, Timeline & Ending Audit

> **Category:** `AUDIT_` — Diagnostic review of narrative systems  
> **Date:** 2026-06-21  
> **Target Version:** `legend-of-uni-web@0.9.0-beta` (commit `963c98a`)  
> **Scope:** Fixed story events, random/filtered events, epoch transitions, CG assets, alien-civilization unlocks, character entry/exit logic, and all ending trigger paths in `/workspace/03_Web_Rebuild`.

---

## 1. Executive Summary

The Web rebuild contains a **structurally complete** narrative/event system: 38 fixed canon events, 154 random events, 21 filtered conditional events, 7 playable epochs, 9 alien civilizations, 35 characters, and 10 ending configurations are all defined in data/config files. Most canon milestones from the *Three-Body* trilogy are represented, and every major fixed event has a runtime CG mapping.

However, several **critical gaps prevent key content from actually firing** in normal play:

1. **Five of the six victory endings are unreachable in production** because the flags that unlock them (`digital_ark_upgrade`, `dark_domain_decision`, `conquest_declared`, `zero_homer_contacted`, `mini_universe_built`) are never set by any game code outside of unit tests.
2. **Epoch transitions are driven by culture thresholds**, not by the canonical timeline. Major fixed events also require the matching culture epoch, so a player can out-level or under-level the intended year and skip/stall canon events.
3. **Several alien civilizations exist in data but can never be unlocked** (`碳基联邦`, `硅基帝国`, `上帝文明`, `量子态文明`).
4. **Character exit logic is absent**: there is no event-based removal or death handling; only a hard-coded epoch death map blocks random-event dialogue.

The full details, tables, and code references are below.

---

## 2. Methodology

- **Static analysis** of TypeScript source and JSON data files in `03_Web_Rebuild/src`.
- **Automated extraction** of event metadata, CG file existence, and character portraits via a Node script.
- **Attempted test execution**: `npm run test:core` could not run because `node_modules` is not installed in the sandbox; all findings are therefore code-level.
- **Cross-reference** with the *Three-Body* official timeline, prior audits (`AUDIT_20260608_EVENT_TIMELINE_AUDIT.md`, `AUDIT_20260615_ENDING_SYSTEM_AUDIT.md`, `AUDIT_20260616_TIMELINE_CIVILIZATION_AUDIT.md`), and the project documentation standard `SPEC_20260519_DOCUMENTATION_STANDARDS.md`.

---

## 3. Era System & Timeline Coverage

### 3.1 Culture-Driven Epochs

[epochs.json](file:///workspace/03_Web_Rebuild/src/data/epochs.json) defines eras by culture ranges:

| Index | Era (EN) | Era (CN) | Culture Range |
|-------|----------|----------|---------------|
| 0 | `GOLDEN` | 黄金岁月 | `-100 .. -1` |
| 1 | `CRISIS` | 危机纪元 | `0 .. 199` |
| 2 | `DETERRENCE` | 威慑纪元 | `200 .. 499` |
| 3 | `BROADCAST` | 广播纪元 | `500 .. 799` |
| 4 | `BUNKER` | 掩体纪元 | `800 .. 1199` |
| 5 | `GALAXY` | 银河纪元 | `1200 .. 2499` |
| 6 | `STARDUST` | 星屑纪元 | `2500 .. 999999` |

The active epoch is updated in [Game.ts#L543-L638](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L543-L638) by calling `updateEpoch()`, which matches current `culture` against the table above. It is **not driven by in-game year**. When the epoch changes, the engine pushes a transition event whose CG mapping is hard-coded at [Game.ts#L586-L592](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L586-L592).

**Finding:** the transition CG map is off-by-one. For example, entering `GOLDEN` (index 0) displays `event_crisis_start`; entering `CRISIS` (index 1) displays `event_deterrence_established`. The content strings are similarly shifted.

### 3.2 Timeline-to-Canon Mapping

The 38 fixed events in [events.json](file:///workspace/03_Web_Rebuild/src/data/events.json) cover the following official *Three-Body* milestones:

| Period | Covered Canon Events |
|--------|----------------------|
| Golden Age (`-58 .. -27`) | Red Shore Base, first signal, Trisolaris reply, ETO founding |
| Crisis (`0 .. 200`) | Yang Dong suicide, ghost countdown, Guzheng action, Wallfacers, STF formation, Beihai assassination, mental seal, Great Ravine, Doomsday Battle, Dark Battle |
| Deterrence (`202 .. 225`) | Deterrence establishment, tech exchange, swordholder handover, deterrence broken, Australia migration |
| Broadcast (`230 .. 260`) | Gravitational broadcast, Trisolaris destroyed, fleet escaped, Galaxy-era characters unlocked |
| Bunker (`280 .. 360`) | Bunker world, Wade coup/execution, dimensional strike, Pluto museum, solar system flattened |

**Gaps / ordering issues:**
- **Sophon blockade** is only present as a filtered event ([GameEventManager.ts#L340-L352](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L340-L352)), not as a fixed milestone before the Wallfacer plan.
- **Staircase Project** is a fixed event at year 80 but is unlocked long after the Wallfacer plan (year 10) and before the Doomsday Battle; this is broadly consistent but relies on filtered events for the actual tech narrative.
- **Black-domain / light-speed ship / dark forest strike survival** are implemented as techs and random/filtered events, but no fixed milestone event marks the player’s choice.

---

## 4. Fixed Events Trigger & CG Audit

The full list of 38 fixed events is below. `CG Status` means:

- **Mapped** — the `event_*` filename is remapped by `mapAvatar()` to an existing `cg_*.png`.
- **Portrait** — the speaker avatar maps to an existing `unified_*.png` portrait.
- **Missing** — the raw filename does not exist and has no known runtime remap.

| Year | Title | Epoch | Trigger Conditions | Key Effects | CG Status |
|------|-------|-------|--------------------|-------------|-----------|
| `-58` | 红岸基地建立 | GOLDEN | `minYear=-58` | unlock 叶文洁, flag `red_shore_base_established` | Mapped → `cg_red_shore_base.png` |
| `-36` | 叶文洁发信号 | GOLDEN | `minYear=-36`, req `red_shore_base_established` | flag `signal_sent_to_trisolaris`, prestige +5 | Mapped → `cg_yewenjie_signal.png` |
| `-28` | 三体监听员回复 | GOLDEN | `minYear=-28`, req `signal_sent_to_trisolaris` | flag `trisolaris_reply_received`, treachery +5 | Mapped → `cg_trisolaris_reply.png` |
| `-27` | ETO成立 | GOLDEN | `minYear=-27`, req `trisolaris_reply_received` | unlock 伊文斯, flag `eto_founded`, treachery +10 | Mapped → `cg_eto_founded.png` |
| `0` | 杨冬自杀 | CRISIS | `minYear=0` | flag `yangdong_suicide`, culture -10, prestige -5 | Mapped → `cg_yangdong_suicide.png` |
| `0` | 危机纪元开始 | CRISIS | `minYear=0`, req `yangdong_suicide` | — | Mapped → `cg_crisis_start.png` |
| `1` | 幽灵倒计时 | CRISIS | `minYear=1` | unlock 汪淼, flag `ghost_countdown_started`, treachery +5 | Mapped → `cg_ghost_countdown.png` |
| `2` | 古筝行动 | CRISIS | `minYear=2` | unlock 伊文斯, 林云 | Mapped → `cg_guzheng.png` |
| `10` | 面壁计划 | CRISIS | `minYear=10` | unlock 罗辑, 泰勒, 雷迪亚兹, 希恩斯 | Portrait (`unified_sophon_...`) |
| `15` | 太空军成军 | CRISIS | `minYear=15` | unlock 章北海, 庄颜, flag `stf_formation` | Portrait (`unified_beihai_...`) |
| `16` | 章北海刺杀 | CRISIS | `minYear=16`, req `stf_formation` | flag `zhang_beihai_assassination`, military +10, prestige -5 | Mapped → `cg_beihai_assassination.png` |
| `20` | 思想钢印 | CRISIS | `minYear=20` | flag `thought_seal_created`, military +5, culture +5 | Mapped → `cg_thought_seal.png` |
| `40` | 大低谷开始 | CRISIS | `minYear=40` | flag `great_ravine_started`, population -30, economy -200, culture -50 | Mapped → `cg_great_ravine.png` |
| `50` | 月球危机 | CRISIS | `minYear=50` | — | Mapped → `cg_moon_crisis.png` |
| `60` | 泰勒破壁 | CRISIS | `minYear=60` | flag `tyler_breached`, prestige -10, treachery +5 | Mapped → `cg_tyler_breached.png` |
| `70` | 雷迪亚兹破壁 | CRISIS | `minYear=70` | flag `reydiaz_breached`, prestige -15, treachery +10 | Mapped → `cg_reydiaz_breached.png` |
| `80` | 阶梯计划 | CRISIS | `minYear=80` | unlock 维德, economy -100, prestige +10, flag `staircase_project_sent` | Portrait (`unified_wade_...`) |
| `150` | 大低谷结束 | CRISIS | `minYear=150`, req `great_ravine_started` | flag `great_ravine_ended`, population +20, economy +100, culture +30 | Mapped → `cg_great_ravine_ended.png` |
| `180` | 技术爆炸 | CRISIS | `minYear=180`, req `great_ravine_ended` | flag `technological_explosion`, culture +50, economy +150, military +50 | Mapped → `cg_tech_explosion.png` |
| `200` | 末日战役 | CRISIS | `minYear=200` | flag `doomsday_battle_lost`, military -800, prestige -50, treachery +30 | Mapped → `cg_doomsday_battle.png` |
| `201` | 黑暗战役 | CRISIS | `minYear=201`, req `doomsday_battle_lost` | flag `dark_battle`, military -200, population -10, treachery +20 | Mapped → `cg_dark_battle.png` |
| `202` | 威慑建立 | CRISIS | `minYear=202`, req `doomsday_battle_lost` | flag `deterrence_established`, prestige +80, treachery -20, culture +30 | Portrait (`unified_luoji_...`) |
| `205` | 技术交换 | DETERRENCE | `minYear=205`, req `deterrence_established` | flag `tech_exchange_started`, culture +20, economy +50 | Mapped → `cg_tech_exchange.png` |
| `210` | 威慑纪元日常 | DETERRENCE | `minYear=210`, req `deterrence_established` | culture +20, economy +50 | Mapped → `cg_deterrence_established.png` |
| `219` | 执剑人交接 | DETERRENCE | `minYear=219`, req `deterrence_established` | unlock 程心, 艾AA, flag `swordholder_handover`, prestige +20, treachery +10 | Mapped → `cg_swordholder_handover.png` |
| `220` | 威慑破裂 | DETERRENCE | `minYear=220`, req `swordholder_handover` | flag `deterrence_broken`, prestige -90, treachery +40, population -20 | Mapped → `cg_deterrence_broken.png` |
| `225` | 澳大利亚移民 | DETERRENCE | `minYear=225`, req `deterrence_broken` | flag `australia_migration`, population -15, prestige -30, treachery +25 | Mapped → `cg_australia_migration.png` |
| `230` | 坐标广播 | BROADCAST | `minYear=230` | flag `coordinates_broadcasted`, prestige +30, treachery +20 | Mapped → `cg_gravitational_broadcast.png` |
| `235` | 三体世界毁灭 | BROADCAST | `minYear=235`, req `coordinates_broadcasted` | flag `trisolaris_destroyed`, prestige -20, treachery +15, culture +10 | Mapped → `cg_trisolaris_destroyed.png` |
| `240` | 三体舰队逃逸 | BROADCAST | `minYear=240`, req `trisolaris_destroyed` | flag `trisolaris_fleet_escaped`, prestige +10, treachery -5 | Mapped → `cg_trisolaris_fleet_escaped.png` |
| `260` | 银河纪元人物登场 | BROADCAST | `minYear=260` | unlock 云天明, 智子, 关一帆 | Portrait (`unified_tianming_...`) |
| `280` | 掩体世界完成 | BUNKER | `minYear=280` | flag `bunker_world_completed`, economy +200, population +15 | Mapped → `cg_bunker_world.png` |
| `300` | 韦德政变 | BUNKER | `minYear=300` | flag `wade_coup`, military -100, prestige -20, treachery +10 | Mapped → `cg_wade_coup.png` |
| `310` | 韦德被处决 | BUNKER | `minYear=310`, req `wade_coup` | flag `wade_executed`, prestige -15, treachery +5, culture +5 | Mapped → `cg_wade_executed.png` |
| `350` | 二向箔打击 | BUNKER | `minYear=350` | flag `dimensional_strike`, population -40, military -500, economy -300, prestige -50 | Mapped → `cg_dimensional_strike.png` |
| `355` | 冥王星博物馆 | BUNKER | `minYear=355`, req `dimensional_strike` | flag `pluto_museum`, culture +50, prestige +30 | Mapped → `cg_pluto_museum.png` |
| `360` | 太阳系二维化 | BUNKER | `minYear=360`, req `dimensional_strike` | flag `solar_system_flattened`, culture +20, prestige +10 | Mapped → `cg_dimensional_strike.png` |
| `400` | 流浪地球决策 | BROADCAST/BUNKER/GALAXY | `minYear=400` | — | Mapped → `cg_wandering_earth.png` |

**Observations:**
- All 38 fixed events have a runtime CG/avatar mapping; no truly missing art asset is referenced.
- The speaker portraits used for years 10, 15, 80, 202, and 260 should arguably be event CGs, but they are functional.
- Triggers combine `minYear` and `epoch`, so **a fixed event will stall if the player has not accumulated enough culture** to enter the required epoch by that year.

---

## 5. Filtered Conditional Events

The 21 filtered events in [GameEventManager.ts#L310-L605](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L310-L605) are evaluated every turn after fixed/random events. They support player-stat thresholds and tech/flag requirements, making them the main vehicle for “player choice affects major events”.

| ID | Title | Conditions | Notable Choice Effects |
|----|-------|------------|------------------------|
| `wallfacer_election` | 面壁者选拔 | `minYear=10`, `epoch=CRISIS`, `minCulture=10` | flag `wallfacer_project` / `wallfacer_cautious` |
| `deterrence_establishment` | 建立威慑体系 | `minYear=50`, `epoch=CRISIS`, reqTech `黑暗森林威慑`, `minDeterrence=50` | flag `swordholder_appointed` or `deterrence_delayed` |
| `sophon_blockade` | 智子封锁生效 | `minYear=10`, `epoch=CRISIS`, not `sophon_broken` | economy/culture trade-off |
| `wandering_earth_decision` | 流浪地球大辩论 | `minYear=100`, `epoch=CRISIS`, reqTech `行星发动机基础`, `loreDomain=liu_cixin_crossover` | flags `wandering_chosen` / `digital_ark_chosen` |
| `alien_first_contact` | 地外文明初接触 | `minYear=80`, `epoch=CRISIS`, reqTech `50光年远镜` | flags `silent_contact` / `friendly_broadcast` |
| `rebellion_crisis` | 逃亡主义叛乱 | `minYear=60`, `epoch=CRISIS`, `maxTreachery=30` | military/treachery/culture effects |
| `sophon_countermeasure` | 智子反制突破 | `minYear=30`, reqTech `550W量子计算机` | flags `sophon_countermeasure_activated`, `sophon_broken` |
| `resource_crisis` | 全球资源危机 | `minYear=25`, `epoch=CRISIS`, `minEconomy=30` | asteroid mining vs rationing |
| `united_nations_assembly` | 联合国紧急大会 | `minYear=15`, `epoch=CRISIS`, `minPopulation=100` | military-first vs balanced |
| `technological_breakthrough` | 科学突破时刻 | `minYear=20`, `epoch=CRISIS`, `minCulture=40` | scientific push vs caution |
| `stf_formation` | 太空军正式成军 | `minYear=20`, `epoch=CRISIS`, `minEconomy=50` | flag `stf_established` |
| `deterrence_strain` | 威慑天平倾斜 | `minYear=70`, `epoch=DETERRENCE`, req `swordholder_appointed`, `minDeterrence=40` | deterrence reinforced vs diplomacy |
| `lightspeed_project` | 光速飞船提案 | `minYear=90`, `epoch=DETERRENCE`, reqTech `曲率驱动理论` | flag `lightspeed_project_approved` |
| `broadcast_era_dawn` | 广播纪元开幕 | `minYear=120`, `epoch=BROADCAST` | flags `broadcast_dawn_seen`, `escape_tech_focus` |
| `bunker_project_debate` | 掩体计划大辩论 | `minYear=150`, `epoch=BROADCAST`, req `broadcast_dawn_seen` | flags `bunker_project_active`, `dual_strategy` |
| `dimensional_threat_alert` | 维度打击警报 | `minYear=180`, `epoch=BUNKER` | flag `dimensional_alert_seen` |
| `galaxy_era_exodus` | 银河纪元启航 | `minYear=220`, `epoch=GALAXY` | flag `galaxy_exodus_seen` |
| `alien_civilization_diplomacy` | 异星文明外交 | `minYear=200`, `epoch=GALAXY`, `minCulture=60` | flags `alien_diplomacy_seen`, `alien_alliance` |
| `reunion_homeworld` | 故土重归 | `minYear=280`, `epoch=GALAXY`, req `galaxy_exodus_seen`, `minCulture=80` | flags `return_to_home`, `cautious_return` |
| `inner_conflict_resolution` | 文明内讧危机 | `minYear=160`, `epoch=BROADCAST`, `minCulture=40` | treachery/military/culture effects |
| `great_filter_confrontation` | 大过滤器降临 | `minYear=260`, `epoch=GALAXY`, req `galaxy_exodus_seen`, `minDeterrence=70` | flags `great_filter_silence`, `great_filter_contact` |

These events are the strongest implementation of player-driven narrative branching, but they are gated by **culture-driven epoch entry**. If the player never reaches `GALAXY` era, the late-game filtered events (and therefore `galaxy_exodus_seen`, `alien_alliance`, etc.) never appear.

---

## 6. Random Events

- **154 random events** in [randomevents.json](file:///workspace/03_Web_Rebuild/src/data/randomevents.json).
- Categories: `dark_forest_*`, `tech_*`, `dilemma_*`, `revolt_*`, and character-specific events.
- Trigger conditions support `epoch`, `min/maxEconomy`, `min/maxCulture`, `min/maxPopulation`, `min/maxTreachery`, `reqTech`, and `probability`.
- The eligibility check is implemented in [GameEventManager.ts#L834-L877](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L834-L877) and the condition parser in [GameEventManager.ts#L648-L676](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L648-L676).
- Most events include player choices with `effects` (resources/flags), so the random layer already realizes “数值影响事件”.

**Limitation:** random events only fire at 25% per turn when no milestone event is queued, and many have very low probabilities (`0.005`–`0.05`). Specific alien-contact events such as `galaxy_zeroer_broadcast` and `galaxy_micro_universe_door` are therefore easy to miss, which harms the intended “接触后才能认识外星文明” design.

---

## 7. CG / Art Asset Audit

### 7.1 Existing CG Assets

36 `cg_*.png` files exist in `public/images/` (see full glob result). All major fixed-event CGs are present.

### 7.2 Existing Ending Images

11 `ending_*.png` files exist, covering every configured ending:

`ending_conquest`, `ending_dark_domain`, `ending_defeat_dimension_strike`, `ending_defeat_extinction`, `ending_defeat_helium_flash`, `ending_defeat_treachery`, `ending_deterrence`, `ending_digital`, `ending_hidden`, `ending_wandering`.

`endingConfig.ts` maps one image per ending key; no missing ending art.

### 7.3 Character Portraits

35/35 portraits in [persons.json](file:///workspace/03_Web_Rebuild/src/data/persons.json) resolve to existing `unified_*.png` files.

### 7.4 Runtime CG Mapping

[GameEventManager.ts#L29-L75](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L29-L75) remaps legacy `event_*` filenames to the actual `cg_*.png` assets. Because the data files still contain placeholder/timestamped names (e.g. `event_droplet_attack_placeholder.png`), the runtime map is essential. No unmapped event filename was found, but the naming mismatch itself is technical debt.

---

## 8. Numeric Logic & Player Agency

### 8.1 Implemented Numeric Effects

[Game.ts#L1006-L1065](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L1006-L1065) handles:

- `resource` effects on `army`, `economy`, `population`, `culture`, `deterrenceValue`, `treachery`, `resource`.
- `flag` effects.
- `unlock_person` effects.

Negative resource effects are clamped to 50% of the current value, preventing instant wipeouts.

### 8.2 Player Influence on Major Events

- **Strong:** filtered events and random events use player stats/tech/flags; choices change flags and resources.
- **Weak:** fixed canon events are almost entirely deterministic (year + epoch). The only player lever is culture, which indirectly gates epoch entry.
- **Missing:** no fixed major event has alternative branches or failure states based on current stats (e.g., the Doomsday Battle outcome cannot be improved by high military).

---

## 9. Character Entry / Exit Logic

### 9.1 Entry

`unlock_person` effects in fixed/filtered events correctly call `personManager.unlockPerson()` ([Game.ts#L1037-L1065](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L1037-L1065)) and push a timeline entry. 14 core story characters are gated this way.

### 9.2 Exit

- There is **no event-driven character death/removal** logic.
- A static `epochDeathMap` in [GameEventManager.ts#L772-L791](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L772-L791) prevents random events from showing dialogue for characters who should already be dead (e.g., 泰勒 cannot speak in `BROADCAST` era).
- Fixed events ignore the death map, so a character can still be “unlocked” and appear in fixed events after their canonical death if the event year is earlier than the death epoch.
- The user’s requested “人物退场” mechanic is therefore **not implemented**.

---

## 10. Alien Civilization Events

### 10.1 Defined Civilizations

[aliens.json](file:///workspace/03_Web_Rebuild/src/data/aliens.json) defines 9 civilizations:

| Name | Personality | Star System | Planet? |
|------|-------------|-------------|---------|
| 三体 | — | 1 | yes |
| 歌者 | 1 | 3 | yes |
| 边缘世界 | 3 | 2 | yes |
| 魔戒 | 2 | 3 | yes |
| 归零者 | 2 | 3 | yes |
| 碳基联邦 | 3 | 3 | yes |
| 硅基帝国 | — | 3 | yes |
| 上帝文明 | 2 | 2 | yes |
| 量子态文明 | 2 | 1 | no |

### 10.2 Unlock Logic

Only 5 civilizations have unlock logic in [Game.ts#L1189-L1240](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L1189-L1240):

| Civilization | Unlock Condition |
|--------------|------------------|
| 三体 | always unlocked |
| 歌者 | tech `1万光年远镜` / `太阳波放大器50光年`, or year ≥150, or flag `singer_contact` |
| 魔戒 | tech `宇宙社会学` / `10%光速飞船`, or star index 10/11 owned, or flag `ring_contact` |
| 边缘世界 | tech `99%光速飞船` / `引力波广播系统`, or epoch ≥BROADCAST, or flag `fringe_contact` |
| 归零者 | tech `归零者研究`, or flag `zeroers_contact`, or year ≥280 |

`碳基联邦`, `硅基帝国`, `上帝文明`, and `量子态文明` are **never unlocked** in production code.

### 10.3 Contact Flags

After each turn, triggered event text is scanned for keywords (“歌者”, “魔戒”, “边缘世界”, “归零者”) and the corresponding flag is set ([Game.ts#L284-L306](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L284-L306)). This is fragile: a random event about a civilization will unlock it only if it uses the exact canonical keyword.

---

## 11. Ending Trigger Paths

All endings are configured in [endingConfig.ts](file:///workspace/03_Web_Rebuild/src/config/endingConfig.ts) and checked in [Game.ts#L640-L917](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L640-L917). Every game-over path calls `SaveManager.recordEnding()`.

| Ending Key | How It Triggers | Reachable in Normal Play? | Blockers / Notes |
|------------|-----------------|---------------------------|------------------|
| **HIDDEN** (死神永生·小宇宙) | Two paths: ① `broadcastTriggered && broadcastSurvives` → immediate HIDDEN. ② Year≥350, `epoch≥GALAXY`, culture≥1000, flags `galaxy_exodus_seen`, `alien_alliance`, `zero_homer_contacted`, `mini_universe_built`, techs `黑域生成`+`数字方舟`. | **Path ① reachable** via the Wallfacer broadcast button. **Path ② unreachable** because `zero_homer_contacted` and `mini_universe_built` are never set. | Broadcast button at [WallfacerPanel.ts#L159-L180](file:///workspace/03_Web_Rebuild/src/ui/WallfacerPanel.ts#L159-L180). |
| **WANDERING** | Year≥250, techs `行星发动机Ⅲ型` + `新家园选址`, flag `wandering_completed`, and not holding mutually-exclusive flags. | **Reachable** — `wandering_completed` is set by [PlanetEngine.ts#L64-L67](file:///workspace/03_Web_Rebuild/src/core/PlanetEngine.ts#L64-L67) after the Earth reaches its target distance. | Requires initiating orbit shift from the engine UI. |
| **DIGITAL** | Year≥200, population>50, tech `数字方舟`, flag `digital_ark_upgrade`. | **Unreachable** — `digital_ark_upgrade` is never set in production code (only in tests). | Should be set when finishing `数字方舟` or choosing the digital-ark path. |
| **DETERRENCE** | `epoch≥DETERRENCE`, `swordholder !== null`, `deterrenceValue≥90`, `deterrenceEnduranceRounds≥20`, no war, and no mutually-exclusive flags. | **Conditionally reachable** — requires manually appointing a swordholder via the UI. The filtered event `deterrence_establishment` sets `swordholder_appointed` but does **not** assign `earthCivi.swordholder`. | Counter increments at `deterrenceValue≥80` ([Game.ts#L477-L485](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L477-L485)) but victory requires `≥90`. |
| **CONQUEST** | Year≥200, population>10, `treachery<50`, `alienCiviManager.isAllCiviConquered()`, flag `conquest_declared`, no mutually-exclusive flags. | **Unreachable** — `conquest_declared` is never set in production code (only in tests). | Also requires conquering all aliens, which is not currently supported by a dedicated UI action. |
| **DARK_DOMAIN** | Year≥250, population>0, tech `黑域生成`, flag `dark_domain_decision`, `treachery<80`. | **Unreachable** — `dark_domain_decision` is never set in production code. | Inconsistent with `dark_domain_declared` used by the ending forecast ([Game.ts#L1294](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L1294)). |
| **DEFEAT_TREACHERY** | `earthCivi.treachery ≥ 100`. | Reachable. | — |
| **DEFEAT_EXTINCTION** | `earthCivi.population ≤ 0`. | Reachable. | — |
| **DEFEAT_DIMENSION_STRIKE** | An alien at `VERYANGRY` triggers `triggerDimensionStrike()` ([AlienCivilization.ts#L86-L91](file:///workspace/03_Web_Rebuild/src/core/AlienCivilization.ts#L86-L91)); after 5 turns, if the player has no `黑域生成` / `数字方舟` / `galaxy_exodus_seen` / `wandering_completed`, `dimensionStrikeTriggered` becomes true and the game ends. | Reachable. | Also triggers at year>350 if `dimensionStrikeTriggered` is true ([Game.ts#L873-L878](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L873-L878)). |
| **DEFEAT_HELIUM_FLASH** | Year>350 with no dimensional defense / digital ark / wandering completed. | Reachable. | Merged with the dimension-strike check; the label depends on `dimensionStrikeTriggered`. |

**Summary:** only **3 victory endings are reachable without console/test flags** — HIDDEN (by broadcast), WANDERING, and DETERRENCE (with UI swordholder). DIGITAL, CONQUEST, and DARK_DOMAIN are **implemented in config but cannot trigger**, and the non-broadcast HIDDEN path is also blocked.

---

## 12. Findings by Severity

### High Severity

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| H1 | `digital_ark_upgrade`, `dark_domain_decision`, `conquest_declared`, `zero_homer_contacted`, and `mini_universe_built` are never set in production code, making 4 victory endings unreachable. | [Game.ts#L695-L797](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L695-L797); Grep shows only test usages. | DIGITAL, DARK_DOMAIN, CONQUEST, and non-broadcast HIDDEN cannot be obtained. |
| H2 | Filtered event `deterrence_establishment` sets `swordholder_appointed` but never calls `earthCivi.setSwordholder()`, so the DETERRENCE victory condition `swordholder !== null` cannot be satisfied from the event alone. | [GameEventManager.ts#L335](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L335); [EarthCivilization.ts#L34-L38](file:///workspace/03_Web_Rebuild/src/core/EarthCivilization.ts#L34-L38) | Players must discover the Wallfacer UI button; the narrative event does not enforce the required state. |
| H3 | Four alien civilizations (`碳基联邦`, `硅基帝国`, `上帝文明`, `量子态文明`) are defined but have no unlock logic. | [aliens.json](file:///workspace/03_Web_Rebuild/src/data/aliens.json); [Game.ts#L1189-L1240](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L1189-L1240) | Content exists but is invisible to the player. |
| H4 | Fixed canon events require both year and culture epoch. Because epoch is culture-driven, events can be skipped or delayed if the player’s culture growth does not match the intended timeline. | [GameEventManager.ts#L748-L770](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L748-L770); [Game.ts#L543-L638](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L543-L638) | Breaks the “先触发重大事件，再预示新纪元” design. |

### Medium Severity

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| M1 | Epoch transition CG/content map is off-by-one (e.g., entering `GOLDEN` shows Crisis content). | [Game.ts#L586-L602](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L586-L602) | Wrong cinematic/text on the first and subsequent era transitions. |
| M2 | `dark_domain_declared` (used by ending forecast) is inconsistent with `dark_domain_decision` (used by victory check). | [Game.ts#L790](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L790); [Game.ts#L1294](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L1294) | Forecast progress may not reflect actual unlockability. |
| M3 | `黑域生成` is defined twice (Physics tree and Interstellar tree). | [TecTreeManager.ts#L45](file:///workspace/03_Web_Rebuild/src/core/TecTreeManager.ts#L45); [TecTreeManager.ts#L150](file:///workspace/03_Web_Rebuild/src/core/TecTreeManager.ts#L150) | Confusing for both players and ending-condition checks; may cause double counting. |
| M4 | Character exit/death logic is absent; only a static epoch block list prevents random-event appearances. | [GameEventManager.ts#L772-L791](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L772-L791) | Dead characters can still be unlocked or appear in fixed events; requested “退场” mechanic missing. |
| M5 | Random alien-contact events have very low probability and no guarantee of occurrence, making progressive civilization discovery unreliable. | [randomevents.json](file:///workspace/03_Web_Rebuild/src/data/randomevents.json) (e.g. `galaxy_zeroer_broadcast` prob 0.05) | Players may never meet required civilizations before the game ends. |

### Low Severity

| # | Finding | Location | Impact |
|---|---------|----------|--------|
| L1 | Event data still uses placeholder/timestamped filenames; runtime remapping is required for CGs to display. | [events.json](file:///workspace/03_Web_Rebuild/src/data/events.json); [GameEventManager.ts#L29-L75](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L29-L75) | Technical debt; asset renaming would simplify the pipeline. |
| L2 | `event_droplet_attack_placeholder.png` maps to `cg_doomsday_battle.png`; naming is misleading. | [GameEventManager.ts#L42](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts#L42) | Minor confusion for asset maintenance. |
| L3 | DETERRENCE victory requires `deterrenceValue≥90` but the endurance counter increments at `≥80`; values 80–89 accumulate rounds without triggering victory. | [Game.ts#L477-L485](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L477-L485); [Game.ts#L752-L763](file:///workspace/03_Web_Rebuild/src/core/Game.ts#L752-L763) | Slight mismatch in condition thresholds. |

---

## 13. Recommendations

1. **Implement the missing ending flags:**
   - `digital_ark_upgrade` → set when `数字方舟` is finished or when the player chooses the digital path in `wandering_earth_decision`.
   - `dark_domain_decision` → set when `黑域生成` is finished; unify with `dark_domain_declared`.
   - `conquest_declared` → set when the player declares a conquest policy, or remove the CONQUEST ending if not planned.
   - `zero_homer_contacted` / `mini_universe_built` → set by the `宇宙重启理论` tech or by the `galaxy_micro_universe_door` / `galaxy_zeroer_broadcast` random events.

2. **Bind epoch transitions to milestone events:** allow a key fixed event (e.g., `deterrence_established`, `coordinates_broadcasted`) to force the next epoch, instead of relying solely on culture thresholds. Culture can remain a secondary gate.

3. **Make the swordholder appointment automatic** in the filtered `deterrence_establishment` event choice so that the narrative and victory condition stay aligned.

4. **Add unlock logic for the four orphaned alien civilizations** and ensure their contact events can appear (or remove them from `aliens.json` if out of scope).

5. **Add character exit/death events** driven by fixed milestones (e.g., 泰勒/雷迪亚兹/希恩斯 death events) and enforce them in both fixed and random events.

6. **Normalize CG filenames** in `events.json` to match the actual `cg_*.png` assets and reduce reliance on the runtime remap table.

---

## 14. Appendix: File Inventory Referenced

- [events.json](file:///workspace/03_Web_Rebuild/src/data/events.json)
- [randomevents.json](file:///workspace/03_Web_Rebuild/src/data/randomevents.json)
- [epochs.json](file:///workspace/03_Web_Rebuild/src/data/epochs.json)
- [aliens.json](file:///workspace/03_Web_Rebuild/src/data/aliens.json)
- [persons.json](file:///workspace/03_Web_Rebuild/src/data/persons.json)
- [endingConfig.ts](file:///workspace/03_Web_Rebuild/src/config/endingConfig.ts)
- [Game.ts](file:///workspace/03_Web_Rebuild/src/core/Game.ts)
- [GameEventManager.ts](file:///workspace/03_Web_Rebuild/src/core/GameEventManager.ts)
- [AlienCivilization.ts](file:///workspace/03_Web_Rebuild/src/core/AlienCivilization.ts)
- [EarthCivilization.ts](file:///workspace/03_Web_Rebuild/src/core/EarthCivilization.ts)
- [PlanetEngine.ts](file:///workspace/03_Web_Rebuild/src/core/PlanetEngine.ts)
- [TecTreeManager.ts](file:///workspace/03_Web_Rebuild/src/core/TecTreeManager.ts)
- [WallfacerPanel.ts](file:///workspace/03_Web_Rebuild/src/ui/WallfacerPanel.ts)
- [SaveManager.ts](file:///workspace/03_Web_Rebuild/src/core/SaveManager.ts)

---

*Report generated in accordance with `SPEC_20260519_DOCUMENTATION_STANDARDS.md`.*
