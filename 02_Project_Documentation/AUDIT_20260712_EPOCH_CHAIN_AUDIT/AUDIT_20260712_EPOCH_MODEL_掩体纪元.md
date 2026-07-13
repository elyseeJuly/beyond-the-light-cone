# `EPOCH_AUDIT_MODEL_掩体纪元`

> 纪元：掩体纪元（BUNKER, epoch=4）
> 阶段：纪元审计模型建立（未输出正式缺陷结论，未修改代码）
> 证据截止：20260712
> 基线引用：AUDIT_20260712_BASELINE.md
> 上游报告：AUDIT_20260712_AUDIT_REPORT_广播纪元.md（含 9 项 BROADCAST→BUNKER 接口复核项）

---

## 一、纪元状态卡

### 1.1 基础信息

| 属性 | 值 | 证据状态 |
|---|---|---|
| 纪元索引 | 4 | CONFIRMED（epochs.json） |
| 纪元名称 | 掩体纪元 / BUNKER | CONFIRMED |
| 文化阈值 | minCulture=800, maxCulture=1199 | CONFIRMED（epochs.json） |
| 入口门控 FLAG | BUNKER_WORLD_COMPLETED（`bunker_world_completed`） | CONFIRMED（Game.ts:774） |
| timeline.json gameYearRange | [301,350] | CONFIRMED（timeline.json） |
| events.json 实际年份范围 | year 280~400（含跨纪元事件） | CONFIRMED（events.json:1170~1504） |
| 代码侧纪元名 | "BUNKER"（索引 4） | CONFIRMED（GameEventManager.ts:750） |

### 1.2 入口条件

**门控逻辑**（Game.ts:770-776）：
```
if (matched.epoch > this.epoch) {
  let allowed = true;
  if (matched.epoch === EpochType.BUNKER && !flagManager.isSet(FLAG.BUNKER_WORLD_COMPLETED)) allowed = false;
  ...
}
```

**进入条件**：
1. `earthCivi.culture ≥ 800`（epochs.json minCulture）
2. `earthCivi.culture ≤ 1199`（epochs.json maxCulture）
3. `FLAG.BUNKER_WORLD_COMPLETED` 已设置（Game.ts:774）
4. `matched.epoch > this.epoch`（防回退，Game.ts:770）

**入口 FLAG 写入点（关键）**：
| 写入点 | 位置 | epoch | year | 证据状态 |
|---|---|---|---|---|
| events.json:1150 | 掩体世界落成事件 | **BUNKER** | 280 | CONFIRMED |

**入口循环依赖风险（继承 AR-20）**：
- `bunker_world_completed` 唯一写入点为 events.json:1150（year=280, epoch=**BUNKER**）
- BROADCAST 纪元无法触发该事件（isEpochMatch("BUNKER","BROADCAST")=false）
- **AR-20 未修复时，BUNKER 纪元在正常路径下永久不可达**
- 本审计基于静态代码分析，假设 AR-20 修复后验证 BUNKER 内部因果链

### 1.3 上一纪元输出状态（BROADCAST→BUNKER 接口复核）

**广播纪元报告末尾列出的 9 项接口复核项**：

| # | 复核项 | 上游状态 | 本模型初步结论 |
|---|---|---|---|
| 1 | 纪元出口条件 | ❌ 断裂（AR-20） | AR-20 未修复，BUNKER 不可达；修复后需验证 |
| 2 | 状态传递（FLAG 累积） | ⚠️ 待复核 | broadcast_dawn_seen/bunker_project_active/dual_strategy/escape_tech_focus/conquest_declared 等 FLAG 累积进入 BUNKER，待 EVIDENCE 阶段逐条核验 |
| 3 | 人物死亡 | ⚠️ 待复核 | 维德进入 BUNKER 时死亡（epochDeathMap 含 BUNKER），但 year=300/310 事件中维德作为 speaker — 候选问题 |
| 4 | bunker_world_completed | ❌ 不可达（AR-20） | 唯一写入点 epoch=BUNKER，循环依赖 |
| 5 | broadcast_era_declared | ⚠️ 死 FLAG（AR-22） | 进入 BUNKER 后仍无消费者 |
| 6 | trisolaris_fleet_escaped | ⚠️ 死 FLAG（AR-22） | 进入 BUNKER 后仍无消费者 |
| 7 | swordholder 字段 | ⚠️ 待复核 | 罗辑路线 swordholder="罗辑"进入 BUNKER；deterrenceEnduranceRounds 持续累积（AR-26 同类） |
| 8 | broadcastTriggered | ⚠️ 待复核 | 若进入 BUNKER 则 broadcastTriggered=false（否则游戏已结束），无残留风险 |
| 9 | conquest_declared | ⚠️ 待复核 | CONQUEST 胜利 allowedEras 含 BUNKER，若 BROADCAST 已 conquest_declared 则 BUNKER 中可竞争 |

**进入 BUNKER 时继承的状态**：
- `this.epoch` = 4（BUNKER）
- `this.year` 不变（BROADCAST 末年）
- `earthCivi.culture` ≥ 800
- `earthCivi.swordholder`（罗辑路线="罗辑"）
- `earthCivi.deterrenceValue` / `treachery` / `population` 等
- 所有已设置 FLAG（永久累积，AR-5 持续追踪）
- `deterrenceEnduranceRounds`（若 swordholder≠null 则持续累积）

### 1.4 内部阶段

基于 events.json BUNKER 事件年份分布：

| 阶段 | year 范围 | 关键事件 | FLAG 写入 |
|---|---|---|---|
| 掩体落成 | 280~281 | 掩体世界落成 / 掩体纪元宣告 | bunker_world_completed / bunker_era_declared |
| 黑域与光速 | 290~295 | 黑域宣言 / 光速飞船测试 | black_domain_decision / lightspeed_ship_tested |
| 维德政变 | 300~310 | 维德政变选择 / 维德被处决或光速飞船量产 | supported_wade\|wade_opposed / wade_executed\|wade_succeeded |
| 降维打击 | 340~365 | 二向箔警报 / 二向箔打击 / 冥王星博物馆 / 太阳系二维化 / 银河出逃 | dimensional_alert_seen / dimensional_strike / pluto_museum / solar_system_flattened / galaxy_exodus_seen |
| 跨纪元 | 400 | 流浪地球（loreDomain: liu_cixin_crossover, epoch: BROADCAST,BUNKER,GALAXY） | — |

### 1.5 出口条件

**正常推进出口（BUNKER→GALAXY）**：

**门控逻辑**（Game.ts:775）：
```
if (matched.epoch === EpochType.GALAXY && (!flagManager.isSet(FLAG.GALAXY_EXODUS_SEEN) && !flagManager.isSet(FLAG.DIMENSIONAL_STRIKE))) allowed = false;
```

**GALAXY 入口 FLAG 写入点**：
| FLAG | 写入点 | epoch | year | 可达性 |
|---|---|---|---|---|
| galaxy_exodus_seen | events.json:1475 | **BUNKER** | 365 | ✅ BUNKER 纪元可触发 |
| galaxy_exodus_seen | GameEventManager.ts:560 | GALAXY | 220 | ❌ 循环依赖（需 GALAXY 才能触发） |
| dimensional_strike | events.json:1373 | **BUNKER** | 350 | ✅ BUNKER 纪元可触发 |

**出口结论**：BUNKER→GALAXY 正常推进出口**可闭合**（与 AR-20 不同）。galaxy_exodus_seen 和 dimensional_strike 均可在 BUNKER 纪元内由 events.json 事件写入，满足 Game.ts:775 门控条件。

**结局退出出口**：见 1.7 节。

### 1.6 下一纪元输入状态（BUNKER→GALAXY 接口预登记）

| 传递项 | 内容 | 待复核 |
|---|---|---|
| epoch | 5（GALAXY） | — |
| year | 不变（BUNKER 末年） | — |
| culture | ≥1200（推进入 GALAXY 所需） | — |
| FLAG 累积 | galaxy_exodus_seen / dimensional_strike / dimensional_alert_seen / dark_domain_decision / digital_ark_upgrade / wade_* / pluto_museum / solar_system_flattened 等 | 待 GALAXY 纪元审计复核 |
| swordholder | 罗辑路线="罗辑"（罗辑在 GALAXY 死亡） | 待复核 |
| dimensionStrikeTriggered | 若 AlienCivilization 降维打击触发则为 true | 待复核 |

### 1.7 可能触发的结局

**胜利结局**（allowedEras 含 BUNKER）：

| 结局 | allowedEras | 关键条件 | BUNKER 可达性 |
|---|---|---|---|
| WANDERING（流浪） | [BUNKER, GALAXY, STARDUST] | WANDERING_COMPLETED + 行星发动机Ⅲ型 + 新家园选址 + 无互斥 FLAG | ✅ 条件性可达 |
| DIGITAL（数字永生） | [BUNKER, GALAXY, STARDUST] | DIGITAL_ARK_UPGRADE + 数字方舟 + 无互斥 FLAG | ✅ 条件性可达 |
| DARK_DOMAIN（黑域） | [BUNKER, GALAXY, STARDUST] | DARK_DOMAIN_DECISION + 黑域生成 + 无互斥 FLAG | ⚠️ 候选问题（black_domain_decision 命名分歧） |
| CONQUEST（征服） | [BROADCAST, BUNKER, GALAXY, STARDUST] | CONQUEST_DECLARED + isAllCiviConquered + 无互斥 FLAG | ✅ 条件性可达 |

**中性结局**：

| 结局 | 条件 | BUNKER 可达性 |
|---|---|---|
| NEUTRAL_COSMIC_SILENCE | epoch≥BUNKER + (DARK_DOMAIN_DECISION \| BLACK_DOMAIN_DECISION) + pop 1~10 + deterrence<20 | ✅ 可达 |

**失败结局**：

| 结局 | 条件 | BUNKER 可达性 |
|---|---|---|
| DEFEAT_TREACHERY | treachery≥100 | ✅ 高风险（year=340 +50, year=300 +30） |
| DEFEAT_EXTINCTION | population≤0 | ✅ 可达（year=350 pop-40, year=365 pop-80） |
| DEFEAT_DIMENSION_STRIKE | (year>350 \| dimensionStrikeTriggered) + 无防御科技 | ✅ 可达（year=350 事件触发后） |
| DEFEAT_HELIUM_FLASH | year>350 + 无防御科技 + loreMode≠strict_three_body | ✅ 可达 |

**结局竞争顺序**（Game.ts:1089-1310）：
1. broadcastTriggered 短路（BUNKER 中应为 false）
2. HIDDEN → WANDERING → DIGITAL → DETERRENCE → CONQUEST → DARK_DOMAIN（数组顺序）
3. NEUTRAL_ETERNAL_EXILE（epoch≥GALAXY，BUNKER 不触发）
4. NEUTRAL_COSMIC_SILENCE（epoch≥BUNKER）
5. DEFEAT_TREACHERY
6. DEFEAT_EXTINCTION
7. DEFEAT_DIMENSION_STRIKE / DEFEAT_HELIUM_FLASH

---

## 二、核心实体清单

### 2.1 剧情事件（events.json, epoch=BUNKER）

| # | year | 事件摘要 | effects（FLAG） | triggerCondition | 证据状态 |
|---|---|---|---|---|---|
| 1 | 280 | 掩体世界落成 | bunker_world_completed + economy+200 + pop+15 | epoch=BUNKER, minYear=280 | CONFIRMED |
| 2 | 281 | 掩体纪元宣告 | bunker_era_declared + culture+40 + prestige+20 | epoch=BUNKER, minYear=281, reqFlag=bunker_world_completed | CONFIRMED |
| 3 | 290 | 黑域宣言 | **black_domain_decision** + prestige-30 | epoch=BUNKER, minYear=290 | CONFIRMED |
| 4 | 295 | 光速飞船测试 | lightspeed_ship_tested + culture+50 | epoch=BUNKER, minYear=295 | CONFIRMED |
| 5 | 300 | 维德政变（选择） | 选择A: supported_wade+wade_coup+mil+50+treachery+30+unlock维德 / 选择B: wade_opposed+wade_coup+mil-100+treachery+10 | epoch=BUNKER, minYear=300, reqFlag=lightspeed_ship_tested | CONFIRMED |
| 6 | 310 | 维德被处决 | wade_executed + prestige-15 + treachery+5 + culture+5 | epoch=BUNKER, minYear=310, reqFlag=wade_opposed | CONFIRMED |
| 7 | 310 | 光速飞船量产 | wade_succeeded + mil+100 + economy-200 + culture+30 + prestige+20 | epoch=BUNKER, minYear=310, reqFlag=supported_wade | CONFIRMED |
| 8 | 340 | 二向箔警报 | dimensional_alert_seen + **treachery+50** | epoch=BUNKER, minYear=340 | CONFIRMED |
| 9 | 350 | 二向箔打击 | **dimensional_strike** + pop-40 + mil-500 + economy-300 + prestige-50 | epoch=BUNKER, minYear=350 | CONFIRMED |
| 10 | 355 | 冥王星博物馆 | pluto_museum + culture+50 + prestige+30 | epoch=BUNKER, minYear=355, reqFlag=dimensional_strike | CONFIRMED |
| 11 | 360 | 太阳系二维化 | solar_system_flattened + culture+20 + prestige+10 | epoch=BUNKER, minYear=360, reqFlag=dimensional_strike | CONFIRMED |
| 12 | 365 | 银河出逃 | **galaxy_exodus_seen** + pop-80 + economy-400 | epoch=BUNKER, minYear=365 | CONFIRMED |
| 13 | 400 | 流浪地球（跨纪元） | —（eventeffect=7 WANDERING_EARTH） | loreDomain=liu_cixin_crossover, epoch=BROADCAST,BUNKER,GALAXY, minYear=400 | CONFIRMED |

**注意**：
- 事件 #5（year=300）含 `unlock_person: 维德`，但维德进入 BUNKER 时已被判定死亡（epochDeathMap 含 BUNKER）
- 事件 #3 写入 `black_domain_decision`（非 `dark_domain_decision`），DARK_DOMAIN 胜利仅检查 `dark_domain_decision`
- 事件 #8 写入 `dimensional_alert_seen`，与 filteredEvent `dimensional_threat_alert` 双写同一 FLAG

### 2.2 过滤事件（filteredEvent, epoch=BUNKER, GameEventManager.ts:324-720）

| # | id | minYear | reqTech | reqFlag / reqNotFlag | effects（FLAG） | 证据状态 |
|---|---|---|---|---|---|---|
| 1 | dimensional_threat_alert | 180 | — | reqNotFlag=dimensional_alert_seen | dimensional_alert_seen | CONFIRMED（:536-549） |
| 2 | digital_ark_upgrade_event | 200 | 数字方舟 | minPop=50, minCulture=60 | digital_ark_upgrade | CONFIRMED（:623-636） |
| 3 | dark_domain_decision_event | 250 | 黑域生成 | reqNotFlag=dark_domain_decision, minCulture=50 | **dark_domain_decision** | CONFIRMED（:637-650） |
| 4 | dimensional_defense_research_event | 200 | 空间曲率理论 | reqNotFlag=dimensional_defense, minCulture=60 | dimensional_defense | CONFIRMED（:693-706） |
| 5 | dimensional_defense_completed_event | 250 | — | reqFlag=dimensional_defense, reqNotFlag=dimensional_defense_completed, minCulture=70 | dimensional_defense_completed | CONFIRMED（:707-719） |

**注意**：
- `bunker_project_debate`（:522-534）epoch=**BROADCAST**（非 BUNKER），属上一纪元
- #3 写入 `dark_domain_decision`（与 events.json #3 写入 `black_domain_decision` 命名不同）
- #1 与 events.json #8 双写 `dimensional_alert_seen`

### 2.3 随机事件（randomevents.json, epoch 含 BUNKER）

**纯 BUNKER 随机事件**（epoch="BUNKER"）：

| # | id | 证据状态 |
|---|---|---|
| 1 | bunker_jupiter_city_construction | CONFIRMED（:7957） |
| 2 | bunker_light_speed_research | CONFIRMED（:8009） |
| 3 | bunker_2d_foil_warning | CONFIRMED（:8067） |
| 4 | bunker_earth_remnant_preservation | CONFIRMED（:8119） |
| 5 | bunker_dome_leakage_crisis | CONFIRMED（:8182） |
| 6 | bunker_dark_forest_telemetry | CONFIRMED（:8240） |

**跨纪元随机事件**（epoch 含 BUNKER）：
- epoch="BUNKER,GALAXY"：约 20+ 条
- epoch="BROADCAST,BUNKER"：约 15+ 条
- epoch="BROADCAST,BUNKER,GALAXY"：约 5+ 条

> 随机事件完整字段待 EVIDENCE 阶段抽样核验。

### 2.4 人物状态（epochDeathMap, GameEventManager.ts:937-991）

**进入 BUNKER 时死亡的人物**（epochDeathMap 含 "BUNKER"）：

| 人物 | 死亡纪元列表 | BUNKER 状态 | 备注 |
|---|---|---|---|
| 维德 | ["BUNKER","GALAXY"] | **死亡** | 进入 BUNKER 即死亡 — 候选问题（year=300/310 事件 speaker） |
| 伊文斯 | [...,"BUNKER","GALAXY"] | 死亡 | CRISIS 起死亡 |
| 林云 | [...,"BUNKER","GALAXY"] | 死亡 | CRISIS 起死亡 |
| 泰勒 | [...,"BUNKER","GALAXY"] | 死亡 | CRISIS 起死亡 |
| 雷迪亚兹 | [...,"BUNKER","GALAXY"] | 死亡 | CRISIS 起死亡 |
| 希恩斯 | ["BROADCAST","BUNKER","GALAXY"] | 死亡 | BROADCAST 起死亡 |
| 章北海 | [...,"BUNKER","GALAXY"] | 死亡 | DETERRENCE 起死亡（AR-24 持续） |
| 丁仪 | [...,"BUNKER","GALAXY"] | 死亡 | DETERRENCE 起死亡 |
| 庄颜 | ["BROADCAST","BUNKER","GALAXY"] | 死亡 | BROADCAST 起死亡（AR-23 持续） |
| 叶文洁/汪淼/大史/常伟思/东方延绪/杨冬/雷志成/杨卫宁/山杉惠子/伊依/霍金/沈渊/水娃/严井/白冰/苗福全/华华/滑膛/朱汉扬 | 含 BUNKER | 死亡 | 各自起始纪元起死亡 |

**BUNKER 存活人物**：

| 人物 | 死亡纪元列表 | BUNKER 状态 |
|---|---|---|
| 罗辑 | ["GALAXY"] | **存活** |
| 程心 | [] | 存活 |
| 云天明 | [] | 存活 |
| 智子 | [] | 存活 |
| 艾AA | [] | 存活 |
| 关一帆 | [] | 存活 |
| 刘慈欣 | ["GALAXY"] | 存活 |

**关键观察**：维德进入 BUNKER 即死亡，但 year=300/310 事件中维德作为 talker 且 year=300 事件含 `unlock_person: 维德`。

### 2.5 FLAG 清单

**BUNKER 纪元写入的 FLAG**：

| FLAG | 写入点 | 读取点（消费者） | 状态 |
|---|---|---|---|
| bunker_world_completed | events.json:1150 | Game.ts:774（门控）; events.json:1202（reqFlag） | ✅ 活 |
| bunker_era_declared | events.json:1186 | **无** | ❌ 死 FLAG |
| black_domain_decision | events.json:1217 | Game.ts:1202（NEUTRAL_COSMIC_SILENCE） | ⚠️ 仅中性结局读取 |
| lightspeed_ship_tested | events.json:1242 | events.json:1290（reqFlag） | ✅ 活 |
| supported_wade | events.json:1268 | events.json:1333（reqFlag） | ✅ 活 |
| wade_opposed | events.json:1279 | events.json:1311（reqFlag） | ✅ 活 |
| wade_coup | events.json:1269/1280 | **无** | ❌ 死 FLAG |
| wade_executed | events.json:1303 | **无** | ❌ 死 FLAG |
| wade_succeeded | events.json:1324 | **无** | ❌ 死 FLAG |
| dimensional_alert_seen | events.json:1348; GameEventManager.ts:546 | GameEventManager.ts:544（reqNotFlag） | ✅ 活（双写） |
| dimensional_strike | events.json:1373 | Game.ts:775（GALAXY 门控）; events.json:1429/1460（reqFlag） | ✅ 活 |
| pluto_museum | events.json:1413 | **无**（MuseumGallery 使用事件 id 非 FLAG） | ❌ 死 FLAG |
| solar_system_flattened | events.json:1444 | **无** | ❌ 死 FLAG |
| galaxy_exodus_seen | events.json:1475 | Game.ts:775（GALAXY 门控）; Game.ts:933/946/1183 | ✅ 活 |
| dark_domain_decision | GameEventManager.ts:647 | Game.ts:1070（DARK_DOMAIN 胜利）; Game.ts:1202 | ✅ 活 |
| digital_ark_upgrade | GameEventManager.ts:633 | Game.ts:994（DIGITAL 胜利）; 多处 reqNotFlag | ✅ 活 |
| dimensional_defense | GameEventManager.ts:703 | GameEventManager.ts:715（reqFlag）; Game.ts:1268; UI 组件 | ✅ 活 |
| dimensional_defense_completed | GameEventManager.ts:717 | Game.ts:1269; UI 组件 | ✅ 活 |

**死 FLAG 汇总**（6 个）：bunker_era_declared / wade_coup / wade_executed / wade_succeeded / pluto_museum / solar_system_flattened

### 2.6 世界 Tag

| Tag | 设置点 | 证据状态 |
|---|---|---|
| bunker_era | Game.ts:837（纪元入口 setWorldTagIntensity(epochTag,100)） | CONFIRMED |
| 其他纪元 Tag | Game.ts:840-846（入口时移除非当前纪元 Tag） | CONFIRMED |

### 2.7 科技条件

**BUNKER filteredEvent 科技依赖**：

| 科技 | filteredEvent | 科技树 | 证据状态 |
|---|---|---|---|
| 数字方舟 | digital_ark_upgrade_event | 信息树 | CONFIRMED |
| 黑域生成 | dark_domain_decision_event | 待核验 | CONFIRMED |
| 空间曲率理论 | dimensional_defense_research_event | 待核验 | CONFIRMED |

**BUNKER 结局科技条件**：

| 结局 | 科技条件 | 证据状态 |
|---|---|---|
| WANDERING | 行星发动机Ⅲ型（航天树）+ 新家园选址（星际树） | CONFIRMED（Game.ts:966-967） |
| DIGITAL | 数字方舟（信息树） | CONFIRMED（Game.ts:993） |
| DARK_DOMAIN | 黑域生成 | CONFIRMED（Game.ts:1069） |
| DEFEAT_DIMENSION_STRIKE 逃避 | 黑域生成 / 数字方舟 / dimensional_defense / dimensional_defense_completed / wandering_completed（任一即可逃避） | CONFIRMED（Game.ts:1265-1270） |

---

## 三、初步因果链草图

### 3.1 正常推进路径（假设 AR-20 修复后进入 BUNKER）

```
[BROADCAST 末] culture≥800 + bunker_world_completed(AR-20修复后)
  → 推进 BUNKER
  → year=280 掩体世界落成 → bunker_world_completed（入口FLAG，已设置）
  → year=281 掩体纪元宣告 → bunker_era_declared（死FLAG）
  → year=290 黑域宣言 → black_domain_decision（⚠️ 非 dark_domain_decision）
  → year=295 光速飞船测试 → lightspeed_ship_tested
  → year=300 维德政变 → supported_wade 或 wade_opposed
  → year=310 维德被处决(wade_opposed) 或 光速飞船量产(supported_wade)
  → year=340 二向箔警报 → dimensional_alert_seen + treachery+50
  → year=350 二向箔打击 → dimensional_strike + pop-40 + mil-500 + economy-300
  → year=355 冥王星博物馆 → pluto_museum（死FLAG）
  → year=360 太阳系二维化 → solar_system_flattened（死FLAG）
  → year=365 银河出逃 → galaxy_exodus_seen
  → culture≥1200 + galaxy_exodus_seen → 推进 GALAXY ✅ 出口可闭合
```

### 3.2 结局退出路径

```
BUNKER 内可能触发的结局：
  ├─ WANDERING（需 wandering_completed + 行星发动机Ⅲ型 + 新家园选址 + 无互斥FLAG）
  ├─ DIGITAL（需 digital_ark_upgrade + 数字方舟 + 无互斥FLAG）
  ├─ DARK_DOMAIN（需 dark_domain_decision + 黑域生成 + 无互斥FLAG）
  │   ⚠️ events.json:1217 写入 black_domain_decision，不触发 DARK_DOMAIN 胜利
  │   ⚠️ 仅 filteredEvent dark_domain_decision_event 写入 dark_domain_decision 可触发
  ├─ CONQUEST（需 conquest_declared + isAllCiviConquered + 无互斥FLAG）
  ├─ NEUTRAL_COSMIC_SILENCE（需 dark_domain_decision 或 black_domain_decision + pop 1~10 + deterrence<20）
  ├─ DEFEAT_TREACHERY（treachery≥100，year=340 +50 高风险）
  ├─ DEFEAT_EXTINCTION（pop≤0，year=350 -40 + year=365 -80 高风险）
  └─ DEFEAT_DIMENSION_STRIKE / HELIUM_FLASH（year>350 + 无防御科技）
```

### 3.3 关键分支

**维德路线分支**（year=300）：
- 选择A "支持维德" → supported_wade → year=310 光速飞船量产 → wade_succeeded（死FLAG）+ mil+100
- 选择B "阻止维德" → wade_opposed → year=310 维德被处决 → wade_executed（死FLAG）+ treachery+5

**黑域宣言双路径**：
- events.json year=290 → black_domain_decision（仅 NEUTRAL_COSMIC_SILENCE 读取）
- filteredEvent dark_domain_decision_event → dark_domain_decision（DARK_DOMAIN 胜利 + NEUTRAL_COSMIC_SILENCE 读取）

---

## 四、核心状态读写链

### 4.1 BUNKER_WORLD_COMPLETED 读写链

| 操作 | 位置 | 说明 |
|---|---|---|
| 写入 | events.json:1150（year=280, epoch=BUNKER） | 唯一写入点 |
| 读取（门控） | Game.ts:774 | BUNKER 入口门控 |
| 读取（reqFlag） | events.json:1202 | year=281 事件前置条件 |
| 测试手动设置 | EdgeCases.test.ts:381-382; Game.test.ts:94 | 测试手动 set |

**循环依赖**（AR-20）：写入点 epoch=BUNKER，BROADCAST 纪元无法触发。

### 4.2 GALAXY_EXODUS_SEEN 读写链

| 操作 | 位置 | 说明 |
|---|---|---|
| 写入1 | events.json:1475（year=365, epoch=BUNKER） | ✅ BUNKER 可触发 |
| 写入2 | GameEventManager.ts:560（epoch=GALAXY） | ❌ 循环依赖 |
| 读取（门控） | Game.ts:775 | GALAXY 入口门控 |
| 读取（HIDDEN） | Game.ts:933/946 | HIDDEN 胜利条件 |
| 读取（NEUTRAL_EXILE） | Game.ts:1183 | 中性结局条件 |

### 4.3 DIMENSIONAL_STRIKE 读写链

| 操作 | 位置 | 说明 |
|---|---|---|
| 写入 | events.json:1373（year=350, epoch=BUNKER） | ✅ BUNKER 可触发 |
| 读取（门控） | Game.ts:775 | GALAXY 入口门控（与 galaxy_exodus_seen 二选一） |
| 读取（reqFlag） | events.json:1429/1460 | year=355/360 事件前置条件 |

### 4.4 dark_domain_decision / black_domain_decision 读写链

| 操作 | 位置 | FLAG | 说明 |
|---|---|---|---|
| 写入1 | events.json:1217（year=290） | **black_domain_decision** | events.json 写入 |
| 写入2 | GameEventManager.ts:647 | **dark_domain_decision** | filteredEvent 写入 |
| alias 映射 | GameEventManager.ts:797 | black→dark | **仅用于 reqFlag/reqNotFlag 判定，不用于写入** |
| 读取（DARK_DOMAIN 胜利） | Game.ts:1070 | **dark_domain_decision** | ⚠️ 不检查 black_domain_decision |
| 读取（NEUTRAL_COSMIC_SILENCE） | Game.ts:1202 | dark \| black | 两者皆可 |

### 4.5 treachery 数值变化

| 来源 | 变化 | 位置 |
|---|---|---|
| year=300 支持维德 | +30 | events.json:1272 |
| year=300 阻止维德 | +10 | events.json:1283 |
| year=310 维德被处决 | +5 | events.json:1305 |
| year=340 二向箔警报 | **+50** | events.json:1353 |
| dark_domain_decision_event 选项B | +10 | GameEventManager.ts:648 |
| dimensional_defense_research_event 选项B | +10 | GameEventManager.ts:704 |

**高风险**：year=340 +50 可能导致 treachery 达 100 → DEFEAT_TREACHERY。

---

## 五、待取证问题（候选问题）

> 以下为模型阶段发现的候选问题，待 EVIDENCE 阶段完整取证后确认是否进入正式问题清单。

| 候选 ID | 现象 | 涉及对象 | 当前证据 | 尚缺证据 |
|---|---|---|---|---|
| C-1 | 维德进入 BUNKER 时死亡（epochDeathMap），但 year=300/310 事件中维德作为 speaker，且 year=300 含 unlock_person:维德 | 维德 / events.json:1262,1300,1321 / epochDeathMap:958 | epochDeathMap 含 BUNKER；events.json talk0_talker=维德 | 运行时验证 unlock_person 对死亡人物的效果 |
| C-2 | events.json:1217 写入 black_domain_decision，但 DARK_DOMAIN 胜利仅检查 dark_domain_decision；FLAG_ALIAS_MAP 仅用于读取不用于写入 | black_domain_decision / dark_domain_decision / Game.ts:1070 / events.json:1217 | FLAG 常量表双定义；alias map 不覆盖写入 | 确认 EventSystem.applyNewEffects 不应用 alias |
| C-3 | 6 个死 FLAG：bunker_era_declared / wade_coup / wade_executed / wade_succeeded / pluto_museum / solar_system_flattened | FLAG 系统 | 全库 Grep 仅写入无读取 | — |
| C-4 | dimensional_alert_seen 双写：events.json:1348(year=340) 和 GameEventManager.ts:546(filteredEvent) | dimensional_alert_seen | 两个写入点 | 确认双写是否导致 filteredEvent 被 reqNotFlag 阻断 |
| C-5 | 5 个 BUNKER filteredEvent minYear(180/200/200/250/250) 远低于 BUNKER 起始 year(≥280)，约束冗余 | filteredEvent minYear / GameEventManager.ts:776 | BUNKER year≥280 | 与 AR-19/AR-25 同类 |
| C-6 | year=300 事件 effects 含 `value:0`（supported_wade/wade_coup/wade_opposed），FLAG 值为 0 是否被 FlagManager 视为"已设置" | events.json:1268-1280 / FlagManager | events.json value=0 | 确认 FlagManager.set 语义 |
| C-7 | swordholder="罗辑"进入 BUNKER 后 deterrenceEnduranceRounds 持续累积（AR-26 同类） | Game.ts:651 / deterrenceEnduranceRounds | epoch>=DETERRENCE && swordholder≠null | 与 AR-26 同类 |
| C-8 | year=340 二向箔警报 treachery+50，若 BROADCAST 末 treachery≥50 则触达 100 → DEFEAT_TREACHERY | treachery / events.json:1353 | UC-11 待确认 BROADCAST 末 treachery 典型值 | Autoplay500 运行观察 |
| C-9 | DEFEAT_DIMENSION_STRIKE 条件含 `dimensionStrikeTriggered`，但 events.json:1373 写入的是 `dimensional_strike` FLAG 而非 `dimensionStrikeTriggered` 字段 | dimensionStrikeTriggered / dimensional_strike FLAG | AlienCivilization.ts:333 写入 dimensionStrikeTriggered；events.json 不写入 | 确认两个系统是否独立 |

---

## 六、当前未确认范围

| 编号 | 范围 | 说明 | 待 EVIDENCE 阶段处理 |
|---|---|---|---|
| U-BK1 | events.json value:0 的 FLAG 写入语义 | FlagManager 是否将 value:0 视为"已设置" | 读 FlagManager.set 实现 |
| U-BK2 | applyNewEffects 是否应用 FLAG_ALIAS_MAP | 确认 events.json 写入 black_domain_decision 时是否转为 dark_domain_decision | 读 EventSystem.applyNewEffects |
| U-BK3 | BUNKER 典型进入 year 值 | 评估 BUNKER 内事件触发时序 | 数值公式核验 |
| U-BK4 | CONQUEST 胜利在 BUNKER 的实际可达性 | isAllCiviConquered 条件是否可在 BUNKER 满足 | 运行时验证 |
| U-BK5 | 纯 BUNKER 随机事件完整字段 | 6 条纯 BUNKER 随机事件仅定位 id | 全量解析 |
| U-BK6 | 跨纪元随机事件（含 BUNKER）完整列表 | 约 40+ 条 | 抽样核验 |
| U-BK7 | 黑域生成 / 空间曲率理论 科技前置链 | 科技树可达性 | 追踪 TecTreeManager |
| U-BK8 | 维德 unlock_person 对死亡人物的效果 | unlockPerson 是否检查 isAlive | 读 PersonManager.unlockPerson |
| U-BK9 | dimensionStrikeTriggered 与 dimensional_strike FLAG 的关系 | 两个系统是否独立 | 追踪 AlienCivilization 降维打击逻辑 |
| U-BK10 | broadcastTriggered 在 BUNKER 的状态 | 确认进入 BUNKER 时 broadcastTriggered=false | 逻辑推断已闭合，待运行时确认 |

---

**EPOCH_AUDIT_MODEL_掩体纪元 建立完成。未输出正式缺陷结论，未修改代码。**

**候选问题统计**：9 项（C-1~C-9）
**未确认范围**：10 项（U-BK1~U-BK10）
**关键结论**：
1. BUNKER→GALAXY 正常推进出口可闭合（galaxy_exodus_seen / dimensional_strike 均可在 BUNKER 内写入）
2. 维德死亡时机与 year=300/310 事件冲突（C-1，与 AR-23/AR-24 同类）
3. black_domain_decision 命名分歧可能导致 DARK_DOMAIN 胜利不可达（C-2）
4. 6 个死 FLAG（C-3，与 AR-15/AR-22 同类）
5. treachery +50 高风险可能导致 DEFEAT_TREACHERY 提前触发（C-8）
