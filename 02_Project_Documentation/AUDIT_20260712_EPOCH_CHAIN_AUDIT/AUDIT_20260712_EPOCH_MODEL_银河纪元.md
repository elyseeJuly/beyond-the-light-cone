# `EPOCH_AUDIT_MODEL_银河纪元`

> 纪元：银河纪元（GALAXY, epoch=5）
> 阶段：纪元审计模型建立（未输出正式缺陷结论，未修改代码）
> 证据截止：20260712
> 基线引用：AUDIT_20260712_BASELINE.md
> 上游报告：AUDIT_20260712_AUDIT_REPORT_掩体纪元.md

---

## 一、纪元状态卡

### 1.1 基础信息

| 属性 | 值 | 证据状态 |
|---|---|---|
| 纪元索引 | 5 | CONFIRMED（epochs.json 行 7） |
| 纪元名称 | 银河纪元 / GALAXY | CONFIRMED |
| 文化阈值 | minCulture=1200, maxCulture=2499 | CONFIRMED（epochs.json 行 7） |
| 入口门控 FLAG | GALAXY_EXODUS_SEEN 或 DIMENSIONAL_STRIKE | CONFIRMED（Game.ts:775） |
| timeline.json gameYearRange | [351, 999] | CONFIRMED（timeline.json 行 32-37，"银河纪元/黑域纪元"合并条目） |
| events.json 实际年份范围 | year 370~420（5 条 epoch=GALAXY 事件） | CONFIRMED（events.json 行 1504/1529/1559/1632/1658） |
| timeline 与 events 年份错位 | timeline 起点 351 vs events 最早 370（gap 19 年无事件） | CONFIRMED（BC-2 同类冲突） |

### 1.2 入口条件

**门控逻辑**（Game.ts:775）：
```ts
if (matched.epoch === EpochType.GALAXY && (!this.flagManager.isSet(FLAG.GALAXY_EXODUS_SEEN) && !this.flagManager.isSet(FLAG.DIMENSIONAL_STRIKE))) allowed = false;
```

- **主通路**：`GALAXY_EXODUS_SEEN`（'galaxy_exodus_seen'）—— 由掩体纪元 year=365 事件（events.json:1475）和 filteredEvent `galaxy_era_exodus`（GameEventManager.ts:558-562）双写
- **旁路**：`DIMENSIONAL_STRIKE`（'dimensional_strike'）—— 由掩体纪元 year=350 事件（events.json:1373）写入，灾变驱动入口
- **入口处理**（Game.ts:789-915）：标准 15 步初始化，无 GALAXY 独有回调（对比 STARDUST 在 CG 回调中 culture+300）

### 1.3 上一纪元输出状态（BUNKER → GALAXY 接口复核，9 项）

| # | 复核项 | 上游状态 | 本纪元结论 |
|---|---|---|---|
| 1 | 纪元出口条件 | ✅ 闭合 | **已复核**：culture≥1200 + galaxy_exodus_seen（或 dimensional_strike）→ Game.ts:775 门控通过。galaxy_exodus_seen 由 year=365 BUNKER 事件写入；dimensional_strike 由 year=350 BUNKER 事件写入。出口闭合 |
| 2 | 状态传递（FLAG 累积） | ⚠️ 待复核 | **已复核**：galaxy_exodus_seen 被 GALAXY 事件读取（events.json year=370/405/420 reqFlag + filteredEvent reunion_homeworld/great_filter_confrontation reqFlag）；dimensional_strike 被 Game.ts:775 入口门控读取；dark_domain_decision/digital_ark_upgrade/wandering_completed 被胜利条件读取；6 个死 FLAG（pluto_museum/solar_system_flattened/wade_coup/wade_executed/wade_succeeded + AR-29 继承）无 GALAXY 消费者 |
| 3 | 人物死亡 | ⚠️ 待复核 | **已复核**：罗辑在 GALAXY 死亡（epochDeathMap["罗辑"]=["GALAXY"]），但 filteredEvent `great_filter_confrontation`（GameEventManager.ts:612）仍以罗辑为 speaker → 死亡发言问题（AR-27 同类）；刘慈欣也在 GALAXY 死亡（epochDeathMap["刘慈欣"]=["GALAXY"]），与 BUNKER 报告"存活"描述不符；维德仍死亡（继承）；程心/云天明/智子/艾AA/关一帆存活 |
| 4 | galaxy_exodus_seen / dimensional_strike FLAG | ⚠️ 待复核 | **已复核**：galaxy_exodus_seen 被 GALAXY 事件广泛读取（reqFlag）；dimensional_strike 仅被入口门控读取，GALAXY 事件不读取 dimensional_strike 作为 reqFlag/reqNotFlag |
| 5 | dimensionStrikeTriggered 字段 | ⚠️ 待复核 | **已复核**：AR-33 双系统独立持续。events.json year=350 仅写 dimensional_strike FLAG 不写 dimensionStrikeTriggered 字段。GALAXY 中 DEFEAT 条件 (year>350 \|\| dimensionStrikeTriggered) 因 year≥370 必然满足 year>350 → DEFEAT 兜底生效（除非有逃生科技/FLAG） |
| 6 | swordholder 字段 | ⚠️ 待复核 | **已复核**：罗辑路线 swordholder="罗辑"进入 GALAXY。Game.ts:704-712 罗辑死亡时 swordholder 被清除为 null。swordholder=null 后 deterrenceEnduranceRounds 不再累积（Game.ts:651 else 分支 reset 为 0）。AR-31 死累积问题在 GALAXY 自然消解（罗辑死亡清空 swordholder） |
| 7 | conquest_declared FLAG | ⚠️ 待复核 | **已复核**：CONQUEST 胜利 allowedEras=[BROADCAST,BUNKER,GALAXY,STARDUST]。若玩家在 BROADCAST/BUNKER 触发 conquest_declared，进入 GALAXY 后 CONQUEST 胜利条件仍可竞争（需 isAllCiviConquered 满足） |
| 8 | culture 值 | ⚠️ 待复核 | **已复核**：GALAXY minCulture=1200, maxCulture=2499（epochs.json）。STARDUST 需 2500。GALAXY 事件不使用 minCulture 作为触发条件（filteredEvent minCulture 上限 90） |
| 9 | treachery 跨纪元 | ⚠️ 待复核 | **已复核**：DEFEAT_TREACHERY（treachery≥100）在 GALAXY 全程生效，无纪元门控。若 BUNKER year=340 +50 未触发 DEFEAT（UC-14），进入 GALAXY 后 treachery 仍可能≥100 |

### 1.4 内部阶段

| 阶段 | 年份范围 | 关键事件 | 核心FLAG |
|---|---|---|---|
| 银河启航 | 370~399 | year=370 银河纪元宣告；filteredEvent galaxy_era_exodus / alien_civilization_diplomacy / great_filter_confrontation | galaxy_era_declared（死FLAG）, alien_alliance, alien_diplomacy_seen |
| 归零者接触 | 400~404 | year=400 归零者播报；filteredEvent zero_homer_contact_event | zero_homer_contacted |
| 小宇宙建造 | 405~419 | year=405 小宇宙对接；filteredEvent mini_universe_build_event | mini_universe_built |
| 星屑过渡 | 420+ | year=420 星屑纪元宣告 | stardust_era_declared → 推进 STARDUST |

### 1.5 出口条件

**正常推进出口**（→STARDUST, epoch=6）：
- Game.ts:776 门控：`STARDUST_ERA_DECLARED` 或 `STARDUST_ERA_SEEN` 或 `ZERO_HOMER_CONTACTED`（OR 关系）
- culture≥2500（epochs.json STARDUST minCulture=2500）
- `stardust_era_declared` 由 year=420 GALAXY 事件写入（events.json:1649）
- `zero_homer_contacted` 由 year=400 GALAXY 事件写入（events.json:1520）
- STARDUST 入口特殊处理：CG 回调内 addFlag(STARDUST_ERA_ACTIVE) + culture+=300 + addHistory("【星屑遗泽】")

**结局退出路径**：9 种结局（见 1.7）

### 1.6 下一纪元输入状态

| 传递项 | 值 | 说明 |
|---|---|---|
| epoch | 6 (STARDUST) | 更新 |
| year | 不变 | 继承 GALAXY 末年 |
| earthCivi.culture | +300（STARDUST CG 回调） | 一次性奖励 |
| FLAG.* | 全量累积 | galaxy_exodus_seen / zero_homer_contacted / mini_universe_built / stardust_era_declared / alien_alliance 等全部保留 |
| Tag | galaxy_era_deep 移除，stardust_era_deep 设置 | Game.ts:837-846 |

### 1.7 可能触发的结局

| 结局 | 类型 | allowedEras | GALAXY 可触发 | 关键条件 |
|---|---|---|---|---|
| HIDDEN（小宇宙） | 胜利 | [GALAXY, STARDUST] | ✅ | galaxy_exodus_seen + alien_alliance + zero_homer_contacted + mini_universe_built + 黑域生成 + 数字方舟 + culture≥1000 + year≥350 + pop>0 + deterrence≥50 |
| WANDERING（流浪） | 胜利 | [BUNKER, GALAXY, STARDUST] | ✅ | 行星发动机Ⅲ型 + 新家园选址 + wandering_completed + 互斥FLAG |
| DIGITAL（数字永生） | 胜利 | [BUNKER, GALAXY, STARDUST] | ✅ | 数字方舟 + digital_ark_upgrade + 互斥FLAG |
| CONQUEST（征服） | 胜利 | [BROADCAST, BUNKER, GALAXY, STARDUST] | ✅ | conquest_declared + isAllCiviConquered + 互斥FLAG |
| DARK_DOMAIN（黑域） | 胜利 | [BUNKER, GALAXY, STARDUST] | ✅ | 黑域生成 + dark_domain_decision + 互斥FLAG |
| NEUTRAL_ETERNAL_EXILE | 中性 | ≥GALAXY | ✅ 专属 | galaxy_exodus_seen + 0<pop≤5 + !wandering_completed + !digital_ark_upgrade |
| NEUTRAL_COSMIC_SILENCE | 中性 | ≥BUNKER | ✅ | dark_domain_decision/black_domain_decision + 0<pop≤10 + deterrence<20 |
| DEFEAT_TREACHERY | 失败 | - | ✅ | treachery≥100 |
| DEFEAT_EXTINCTION | 失败 | - | ✅ | population≤0 |
| DEFEAT_DIMENSION_STRIKE | 失败 | - | ✅ | (year>350 \|\| dimensionStrikeTriggered) + 无逃生科技/FLAG |
| DEFEAT_HELIUM_FLASH | 失败 | - | ✅ | year>350 + 无逃生科技 + loreMode≠strict_three_body |

**互斥关键**：`ZERO_HOMER_CONTACTED` 一旦设置，除 HIDDEN 外其他 4 条胜利路径全部被锁死（reqNotFlag 互斥）。

---

## 二、核心实体清单

### 2.1 事件清单

| 类型 | 数量 | 来源 | 年份范围 |
|---|---|---|---|
| 剧情事件（events.json, epoch=GALAXY） | 5 | events.json:1493-1662 | year 370/400/400/405/420 |
| 硬编码过滤事件（filteredEvent, epoch=GALAXY） | 6 | GameEventManager.ts:551-692 | minYear 200~350 |
| 随机事件（纯 GALAXY） | 8 | randomevents.json | - |
| 随机事件（BUNKER,GALAXY） | 19 | randomevents.json | - |
| 随机事件（BROADCAST,BUNKER,GALAXY） | 5 | randomevents.json | - |

### 2.2 人物清单

| 类别 | 人物 | 证据 |
|---|---|---|
| GALAXY 存活（5人） | 程心、云天明、智子、艾AA、关一帆 | epochDeathMap 为空数组 |
| GALAXY 新增死亡（2人） | 罗辑、刘慈欣 | epochDeathMap 仅含 ["GALAXY"] |
| GALAXY 继承死亡（31人） | 维德、伊文斯、林云、泰勒、雷迪亚兹、希恩斯、章北海、丁仪、庄颜、叶文洁、汪淼、大史、常伟思、东方延绪、杨冬、雷志成、杨卫宁、山杉惠子、伊依、霍金、沈渊、水娃、严井、白冰、苗福全、华华、滑膛、朱汉扬 | epochDeathMap 含 GALAXY 且更早纪元已死亡 |

### 2.3 FLAG 清单

| FLAG | 值 | 写入点 | 读取点 | 状态 |
|---|---|---|---|---|
| GALAXY_EXODUS_SEEN | galaxy_exodus_seen | events.json:1475(BUNKER year=365) + GameEventManager.ts:558(filteredEvent) | Game.ts:775(门控),933(HIDDEN),1183(ETERNAL_EXILE); events.json:1561/1634/1660(reqFlag); GameEventManager.ts:586/614(reqFlag) | 活 |
| DIMENSIONAL_STRIKE | dimensional_strike | events.json:1373(BUNKER year=350) | Game.ts:775(门控) | 活（仅门控读取） |
| ZERO_HOMER_CONTACTED | zero_homer_contacted | events.json:1520(GALAXY year=400) + GameEventManager.ts:674(filteredEvent) | Game.ts:776(STARDUST门控),937(HIDDEN); GameEventManager.ts:686(reqFlag) | 活 |
| MINI_UNIVERSE_BUILT | mini_universe_built | events.json:1545(GALAXY year=405) + GameEventManager.ts:691(filteredEvent) | Game.ts:938(HIDDEN); GameEventManager.ts:687(reqNotFlag) | 活 |
| ALIEN_ALLIANCE | alien_alliance | GameEventManager.ts:574(filteredEvent choice A) | Game.ts:935(HIDDEN) | 活（唯一写入点） |
| STARDUST_ERA_DECLARED | stardust_era_declared | events.json:1649(GALAXY year=420) | Game.ts:776(STARDUST门控) | 活 |
| alien_diplomacy_seen | alien_diplomacy_seen | GameEventManager.ts:574/575(filteredEvent) | GameEventManager.ts:572(reqNotFlag 自锁) | 活（自锁去重） |
| galaxy_era_declared | galaxy_era_declared | events.json:1623(GALAXY year=370) | 无 | **死FLAG** |
| return_to_home | return_to_home | GameEventManager.ts:588(filteredEvent) | 无 | **死FLAG** |
| cautious_return | cautious_return | GameEventManager.ts:589(filteredEvent) | 无 | **死FLAG** |
| great_filter_silence | great_filter_silence | GameEventManager.ts:616(filteredEvent) | 无 | **死FLAG** |
| great_filter_contact | great_filter_contact | GameEventManager.ts:617(filteredEvent) | 无 | **死FLAG** |

### 2.4 科技清单

| 科技 | 树 | 前置链 | 关联结局 |
|---|---|---|---|
| 黑域生成 | INTERSTELLAR | 宇宙社会学→安全声明理论→黑域生成 | DARK_DOMAIN / HIDDEN |
| 数字方舟 | INFORMATION | 数字文明→数字生命研究→意识上传→数字方舟 | DIGITAL / HIDDEN |
| 新家园选址 | INTERSTELLAR | 流浪地球计划→新家园选址 | WANDERING |
| 行星发动机Ⅲ型 | AEROSPACE | 核聚变推进→重元素聚变→行星发动机Ⅰ型→Ⅱ型→Ⅲ型 | WANDERING |
| 曲率驱动理论 | PHYSICS | 维度物理→曲率驱动理论 | 光速飞船前置 |
| 宇宙重启理论 | INTERSTELLAR | （待确认完整链） | mini_universe_build_event reqTech |

### 2.5 Tag 清单

| Tag | id | 行号 | 类别 | milestone |
|---|---|---|---|---|
| 银河纪元特征 | galaxy_era_deep | TagManager.ts:77 | epoch | true（不衰减） |

---

## 三、初步因果链草图

```
[BUNKER 末] culture≥1200 + galaxy_exodus_seen（或 dimensional_strike）
  → 推进 GALAXY（Game.ts:775 门控通过）
  → Game.ts:702-706 罗辑/刘慈欣死亡（epochDeathMap 含 GALAXY）
  → Game.ts:710-712 罗辑若为 swordholder 则 swordholder=null
  → year=370 银河纪元宣告 → galaxy_era_declared（死FLAG）+ culture+60
  → filteredEvent galaxy_era_exodus（若未触发）→ galaxy_exodus_seen（可能已在 BUNKER 写入）
  → filteredEvent alien_civilization_diplomacy → alien_diplomacy_seen + alien_alliance（choice A）
  → filteredEvent great_filter_confrontation → great_filter_silence/contact（死FLAG）
    ⚠️ 罗辑作为 speaker 但已死亡（AR-27 同类）
  → filteredEvent reunion_homeworld → return_to_home/cautious_return（死FLAG）
  → year=400 归零者播报 → zero_homer_contacted + culture+100
  → filteredEvent zero_homer_contact_event（若未由 events.json 触发）→ zero_homer_contacted 双写
  → year=405 小宇宙对接 → mini_universe_built + culture+80 + deterrenceValue+10
  → filteredEvent mini_universe_build_event（若未由 events.json 触发）→ mini_universe_built 双写
  → year=420 星屑纪元宣告 → stardust_era_declared + culture+100
  → culture≥2500 + stardust_era_declared（或 zero_homer_contacted）
  → 推进 STARDUST ✅ 出口闭合
```

**分支**：
- HIDDEN 胜利：galaxy_exodus_seen + alien_alliance + zero_homer_contacted + mini_universe_built + 黑域生成 + 数字方舟 + culture≥1000 + year≥350 + pop>0 + deterrence≥50
- ETERNAL_EXILE 中性：galaxy_exodus_seen + 0<pop≤5 + !wandering_completed + !digital_ark_upgrade
- DEFEAT 兜底：year>350 + 无黑域生成/数字方舟/dimensional_defense/wandering_completed → DEFEAT_DIMENSION_STRIKE

---

## 四、核心状态读写链

### 4.1 状态字段读写

| 字段 | 写位置（GALAXY 内） | 读位置 |
|---|---|---|
| epoch | Game.ts:779（推进时） | Game.ts:651,704,775,931,1183 等；GameEventManager.ts:772 |
| year | Game.ts:730（每回合+1） | 事件 minYear 判定；DEFEAT year>350 |
| culture | events.json year=370(+60)/400(+100)/405(+80)/420(+100); GameEventManager.ts filteredEvent(+30~+150) | Game.ts:760(updateEpoch); 结局判定 culture≥1000(HIDDEN) |
| population | 事件 effects | ETERNAL_EXILE pop≤5; EXTINCTION pop≤0; HIDDEN pop>0 |
| treachery | 事件 effects | DEFEAT_TREACHERY treachery≥100 |
| deterrenceValue | events.json year=405(+10); filteredEvent | HIDDEN deterrence≥50; great_filter minDeterrence:70 |
| swordholder | Game.ts:711（罗辑死亡时清 null） | Game.ts:651（deterrenceEnduranceRounds 累积条件） |
| dimensionStrikeTriggered | AlienCivilization.ts:333（异星 AI 降维打击） | Game.ts:1265(DEFEAT),1272,1286 |

### 4.2 FLAG 写读链

见 2.3 FLAG 清单。

---

## 五、待取证问题（候选问题）

| 候选 ID | 问题现象 | 涉及对象 | 当前证据 | 尚缺证据 | 可能影响 |
|---|---|---|---|---|---|
| C-1 | 罗辑在 GALAXY 死亡但 filteredEvent great_filter_confrontation 仍以罗辑为 speaker | great_filter_confrontation (GameEventManager.ts:612) | filteredEvent 不经过 isEventCharactersUnlocked 检查；getFilteredEventsForTurn 仅检查 condition | 无 | 叙事不一致（AR-27 同类） |
| C-2 | 5 个死 FLAG 无消费者 | galaxy_era_declared / return_to_home / cautious_return / great_filter_silence / great_filter_contact | 全量 Grep 确认 0 读取 | 无 | 可维护性（AR-29 同类） |
| C-3 | zero_homer_contacted / mini_universe_built 双写 | events.json + filteredEvent 双路径写入同一 FLAG | events.json:1520/1545 + GameEventManager.ts:674/691 | 无 | 可维护性（AR-32 同类） |
| C-4 | HIDDEN 结局窗口极窄 | HIDDEN 需 year≥350，DEFEAT 兜底 year>350 | Game.ts:931 vs Game.ts:1265 | 需确认同年判定顺序 | HIDDEN 可能不可达 |
| C-5 | GALAXY 入口旁路与 DEFEAT 竞态 | dimensional_strike 入口 + year>350 DEFEAT 兜底 | Game.ts:775 vs Game.ts:1265 | 需确认同回合判定顺序 | 灾变入口可能立即 DEFEAT |
| C-6 | 刘慈欣在 GALAXY 死亡，与 BUNKER 报告"存活"描述不符 | epochDeathMap["刘慈欣"]=["GALAXY"] | GameEventManager.ts:989 | 无 | BUNKER 报告误差 |
| C-7 | filteredEvent minYear 远低于 GALAXY 起始 year | minYear 200~350 vs GALAXY year≥370 | GameEventManager.ts:558/572/586/614/673/687 | 无 | 语义冗余（AR-30 同类） |
| C-8 | filteredEvent 使用 dialogQueue 但 isEventCharactersUnlocked 检查 dialogNodes | 所有 filteredEvent | GameEventManager.ts:610 vs 1009 | 无 | filteredEvent 永远跳过人物存活检查 |
| C-9 | ALIAN_ALLIANCE 基线拼写错误 | 基线文档 vs 代码 alien_alliance | 基线:297 vs GameFlags.ts:40 | 无 | 文档不一致 |
| C-10 | galaxy_exodus_seen 双写（BUNKER year=365 + filteredEvent） | events.json:1475 + GameEventManager.ts:558 | 两处均写入 | 无 | 可维护性 |
| C-11 | dimensionStrikeTriggered 字段与 dimensional_strike FLAG 双系统独立（AR-33 继承） | events.json year=350 写 FLAG 不写字段 | AR-33 已确认 | 无 | DEFEAT 判定依赖 year>350 而非字段 |
| C-12 | 宇宙重启理论科技前置链未确认 | mini_universe_build_event reqTech | GameEventManager.ts:687 | 需确认 TecTreeManager 中该节点 | 小宇宙建造事件可能不可触发 |

---

## 六、当前未确认范围

| 编号 | 范围 | 说明 | 待核验方式 |
|---|---|---|---|
| U-G1 | HIDDEN 结局同年判定顺序 | year≥350(HIDDEN) vs year>350(DEFEAT) 是否在同一回合内先后判定 | 确认 checkVictoryConditions 内判定顺序 |
| U-G2 | 宇宙重启理论科技是否存在 | mini_universe_build_event reqTech="宇宙重启理论" | 全量搜索 TecTreeManager.ts |
| U-G3 | GALAXY 期间 culture 增长速率 | 是否能在 year 370~420 期间从 1200 增长到 2500 | 运行时验证 |
| U-G4 | treachery 跨纪元累积风险 | UC-14 继承，BUNKER year=340 +50 后进入 GALAXY 的 treachery 值 | Autoplay500 运行观察 |
| U-G5 | filteredEvent 与 events.json 同名 FLAG 双写触发顺序 | zero_homer_contacted 两条写入路径哪条先触发 | 运行时验证 |
| U-G6 | 上帝文明/量子态文明外交路径与 ALIEN_ALLIANCE 关系 | Game.ts:1557-1584 解锁两条外交线 | 确认是否影响 HIDDEN 结局 |

---

## 七、跨纪元问题持续追踪

| 编号 | 问题 | BUNKER 状态 | GALAXY 状态 |
|---|---|---|---|
| AR-5 | FLAG 永久累积 | BUNKER 写入 18 个 FLAG（6 死） | GALAXY 写入 11 个 FLAG（5 死），FLAG 累积持续增长 |
| AR-7 | Flag 引用漂移 | restorePrototypes 已修复 | 无新增漂移 |
| UC-1 | treachery 爆发 | BUNKER year=340 +50 高风险 | GALAXY 无新增 treachery 事件，但 UC-14 风险持续 |
| UC-2 | 顺序风险 | BUNKER 事件 year 顺序正确 | GALAXY 事件 year 顺序正确（370→400→405→420） |

---

**EPOCH_AUDIT_MODEL_银河纪元 建立完成。未输出正式缺陷结论，未修改代码。**

**候选问题**：12 项（C-1~C-12）
**未确认范围**：6 项（U-G1~U-G6）
**接口复核**：9 项全部完成（含 3 项新发现：C-1 罗辑死亡发言 + C-6 刘慈欣死亡描述不符 + C-8 dialogQueue/dialogNodes 不匹配）
