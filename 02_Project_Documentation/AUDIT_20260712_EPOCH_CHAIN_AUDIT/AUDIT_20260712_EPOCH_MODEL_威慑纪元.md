# `EPOCH_AUDIT_MODEL_威慑纪元`

> 纪元：威慑纪元（DETERRENCE, epoch=2）
> 阶段：纪元审计模型建立（未输出正式缺陷结论，未修改代码）
> 证据截止：20260712
> 基线引用：AUDIT_20260712_BASELINE.md
> 上游报告：AUDIT_20260712_AUDIT_REPORT_危机纪元.md（含 6 项接口复核项）

---

## 〇、上游接口复核（CRISIS → DETERRENCE）

> 来源：危机纪元报告末尾"相邻纪元仍需复核的接口"6 项。

| 复核项 | 上游状态 | 本纪元取证结论 | 证据状态 |
|---|---|---|---|
| 1. 纪元出口条件 | ✅ 已验证 | culture≥200 + deterrence_established（year=202 事件写入，epoch=CRISIS）→ updateEpoch(Game.ts:772) 读取 FLAG 放行 | CONFIRMED |
| 2. 状态传递（FLAG 累积） | ⚠️ 待复核 | CRISIS 全部 FLAG 永久累积进入 DETERRENCE（Game.ts:789-915 仅 unset EPOCH_STALLED）。关键累积 FLAG：deterrence_established / doomsday_battle_lost / dark_battle / sophon_blockade_confirmed / yangdong_suicide / ghost_countdown_started 等 | CONFIRMED（累积事实）/ 待评估（污染影响） |
| 3. 人物死亡 | ⚠️ 待复核 | 进入 DETERRENCE 时因 epochDeathMap 死亡 **12 人**：伊文斯/章北海/丁仪/叶文洁/汪淼/大史/常伟思/东方延绪/杨冬/华华/滑膛/朱汉扬。**修正上游报告**：庄颜(BROADCAST 死)、维德(BUNKER 死)在 DETERRENCE 期间存活；上游漏列东方延绪 | CONFIRMED（修正名单） |
| 4. year=201 事件触发顺序 | ⚠️ 待复核 | events.json year=201 有两个事件：A=epoch=CRISIS 黑暗战役(reqFlag=doomsday_battle_lost)；B=epoch=DETERRENCE 威慑纪元宣告(reqFlag=deterrence_established)。因 year=202 才写入 deterrence_established，B 事件最早在 year=202+ 触发（时序倒置，与 AR-2 同类） | CONFIRMED（时序倒置） |
| 5. deterrence_era_declared | ⚠️ 待复核 | 死 FLAG（AR-4 上游已登记）。1 写入点(events.json:689) / 0 读取点。未在 GameFlags.ts 中定义为常量 | CONFIRMED（死 FLAG） |
| 6. treachery 跨纪元 | ⚠️ 待复核 | treachery 值跨纪元保留无清理。DETERRENCE 纪元程心路线累计 +75（219:+10 / 220:+40 / 225:+25），叠加 CRISIS 累积值极易触达 100 阈值 → DEFEAT_TREACHERY | CONFIRMED（高风险） |

**接口复核小结**：6 项中 1 项已验证、5 项已取证。其中第 3 项修正上游名单错误（庄颜/维德/东方延绪），第 4 项确认存在与 AR-2 同类的时序倒置。

---

## 一、纪元状态卡

### 1.1 基础信息

| 属性 | 值 | 证据状态 |
|---|---|---|
| 纪元索引 | 2 | CONFIRMED（epochs.json） |
| 纪元名称 | 威慑纪元 / DETERRENCE | CONFIRMED |
| 文化阈值 | minCulture=200, maxCulture=499 | CONFIRMED |
| 入口门控 FLAG | DETERRENCE_ESTABLISHED | CONFIRMED（Game.ts:772） |
| timeline.json gameYearRange | [201,260] | CONFIRMED（timeline.json） |
| events.json 实际年份范围 | year 201~230（8 个 epoch=DETERRENCE 事件） | CONFIRMED |
| 纪元名称数组索引 | `"DETERRENCE"` (索引 2) | CONFIRMED（GameEventManager.ts:750,771） |
| 纪元中文显示名 | `"威慑纪元"` | CONFIRMED（Game.ts:791 epochNames） |
| 资源包 eraKey | `'deterrence_era'` | CONFIRMED（Game.ts:799 epochEraKeyMap） |
| 纪元 Tag | `'deterrence_era'`（milestone，不衰减） | CONFIRMED（Game.ts:826-834 / TagManager.ts:74） |
| 纪元 CG | `'event_deterrence_established'` | CONFIRMED（Game.ts:854-862 epochCGMap） |
| 纪元旁白 | `"威慑平衡正式建立，人类世界进入威慑纪元。在执剑人的威慑威压下，三体文明被迫停止了向太阳系的扩张，进入脆弱而短暂的和平冷战期。"` | CONFIRMED（Game.ts:867 epochContents） |

### 1.2 入口条件

```text
入口判定算法（Game.ts:758-786 updateEpoch）：
  1. earthCivi.culture ≥ 200（epochs.json minCulture）
  2. matched.epoch(2) > this.epoch(1)（防回退）
  3. FLAG.DETERRENCE_ESTABLISHED 已设置（Game.ts:772）
     → 未设置则 allowed=false，设置 EPOCH_STALLED，记录"文明停滞"
  4. 通过后执行纪元入口处理（Game.ts:789-915，15 项初始化）

deterrence_established 写入点：
  - events.json:748-752 year=202 事件（epoch=CRISIS, reqFlag=doomsday_battle_lost）
  - effects: flag→deterrence_established / prestige+80 / treachery-20 / culture+30
```

**状态**：CONFIRMED。入口路径正常闭合：year=200 末日战役 → year=201 黑暗战役 → year=202 威慑建立（写入 deterrence_established）→ culture≥200 + FLAG → 推进到 DETERRENCE。

### 1.3 上一纪元输出状态

| 状态字段 | CRISIS 出口值 | 传递方式 | DETERRENCE 入口可见性 |
|---|---|---|---|
| this.epoch | CRISIS(1) | 直接更新为 DETERRENCE(2) | ✅ |
| this.year | 202（典型） | 不变 | ✅ |
| earthCivi.culture | ≥200 | 不变 | ✅ |
| earthCivi.population | CRISIS 末值 | 不变 | ✅ |
| earthCivi.treachery | CRISIS 累积值（含 year=201 +20, year=202 -20） | **不变（无清理）** | ⚠️ 跨纪元累积 |
| earthCivi.deterrenceValue | CRISIS 累积值 | 不变 | ✅ |
| earthCivi.swordholder | "罗辑"（若 filteredEvent deterrence_establishment 触发） | 不变 | ✅ |
| flagManager.flags | 全部 CRISIS FLAG | **不变（无清理）** | ⚠️ 跨纪元累积 |
| personManager 所有人物 | isAlive/deathYear 按 epochDeathMap 更新 | 不变 | ✅ |
| deterrenceEnduranceRounds | 0（CRISIS 期间不累积） | 不变 | ✅ |

**关键累积 FLAG（CRISIS → DETERRENCE）**：
- deterrence_established（DETERRENCE 入口门控，必须保留）
- doomsday_battle_lost（year=200 写入，DETERRENCE 期间无读取）
- dark_battle（year=201 写入，DETERRENCE 期间无读取）
- sophon_blockade_confirmed（year=5 写入，DETERRENCE 期间无读取）
- yangdong_suicide / ghost_countdown_started 等（CRISIS 剧情标记，DETERRENCE 期间无读取）
- swordholder_appointed（filteredEvent 写入，DETERRENCE 期间被 deterrence_strain 读取）

### 1.4 内部阶段

基于 events.json 剧情事件年份划分：

| 阶段 | 年份范围 | 关键事件 | 主线状态 |
|---|---|---|---|
| **威慑建立期** | 201-210 | year=201 威慑纪元宣告 / year=205 技术交流 / year=210 威慑稳固期 | deterrence_established 已设置，威慑平衡运行 |
| **执剑人交接期** | 219-220 | year=219 执剑人交接（分支选择） / year=220 威慑中止或持续 | **关键分叉点**：程心路线 vs 罗辑路线 |
| **后果期** | 225-230 | year=225 澳大利亚大移民（程心路线）/ year=230 引力波广播 | 两条路线分别推进到坐标广播 |

**分支结构**：
```
year=219 执剑人交接
├── 选项 A：任命程心 → swordholder_chengxin
│   └── year=220 威慑中止 → deterrence_broken（treachery+40）
│       └── year=225 澳大利亚大移民 → australia_migration（treachery+25）
│           └── year=230 引力波广播(BROADCAST 版) → coordinates_broadcasted
└── 选项 B：罗辑连任 → swordholder_luoji_retained
    └── year=220 威慑持续 → deterrence_held_strong（deterrenceValue+20）
        └── year=230 引力波广播(DETERRENCE 版) → coordinates_broadcasted（deterrenceValue+50）
```

### 1.5 出口条件

| 出口路径 | 触发条件 | 下一纪元 | 证据状态 |
|---|---|---|---|
| **正常出口 → BROADCAST** | culture≥500 + coordinates_broadcasted 已设置 | 广播纪元(3) | CONFIRMED |
| **失败出口 → DEFEAT_TREACHERY** | treachery≥100 | 游戏结束 | CONFIRMED |
| **失败出口 → DEFEAT_EXTINCTION** | population≤0 | 游戏结束 | CONFIRMED |
| **胜利出口 → DETERRENCE 胜利** | epoch=2 + swordholder≠null + deterrenceValue≥90 + deterrenceEnduranceRounds≥20 + 无交战 + 无互斥 FLAG | 游戏结束（胜利） | CONFIRMED |

**coordinates_broadcasted 写入点（2 处，对应两条分支）**：
- events.json:995-999 year=230 DETERRENCE 版（reqFlag=deterrence_held_strong）— 罗辑路线
- events.json:964-968 year=230 BROADCAST 版（reqFlag=australia_migration）— 程心路线

**出口门控读取点**：Game.ts:773 `if (matched.epoch === EpochType.BROADCAST && !this.flagManager.isSet(FLAG.COORDINATES_BROADCASTED)) allowed = false;`

### 1.6 下一纪元输入状态

| 状态字段 | DETERRENCE 出口值 | BROADCAST 入口依赖 |
|---|---|---|
| this.epoch | DETERRENCE(2) → BROADCAST(3) | ✅ |
| this.year | 230（典型） | ✅ |
| earthCivi.culture | ≥500（BROADCAST minCulture） | ✅ |
| earthCivi.treachery | **程心路线：CRISIS累积 + 75**（极高）/ **罗辑路线：CRISIS累积 - 20**（较低） | ⚠️ 跨纪元风险 |
| FLAG.COORDINATES_BROADCASTED | true | ✅ BROADCAST 入口门控 |
| FLAG.deterrence_broken / australia_migration | 程心路线 true / 罗辑路线 false | ⚠️ 可能影响 BROADCAST 事件 |
| FLAG.deterrence_held_strong | 罗辑路线 true / 程心路线 false | ⚠️ 可能影响 BROADCAST 事件 |
| 人物存活 | 罗辑/希恩斯/庄颜/维德/程心/艾AA（条件）存活 | ✅ |

### 1.7 可能触发的结局

| 结局 | 类型 | 触发条件 | DETERRENCE 可达性 |
|---|---|---|---|
| **DETERRENCE 胜利** | 胜利 | epoch=2 + swordholder + deterrenceValue≥90 + 维持≥20回合 + 无交战 + 无互斥 | ✅ 仅罗辑路线可达（程心路线 treachery 过高且 deterrenceValue 不足） |
| DEFEAT_TREACHERY | 失败 | treachery≥100 | ✅ 程心路线高风险（+75） |
| DEFEAT_EXTINCTION | 失败 | population≤0 | ✅ 程心路线 population -35（220:-20, 225:-15） |
| DEFEAT_DIMENSION_STRIKE | 失败 | year>350 且未完成防御 | ❌ DETERRENCE year 上限 260，不可达 |
| DEFEAT_HELIUM_FLASH | 失败 | 同上 | ❌ 不可达 |

**胜利结局互斥**：SWORDHOLDER_APPOINTED 是互斥锁（Game.ts:972/998/1047/1073），一旦设置则 WANDERING/DIGITAL/CONQUEST/DARK_DOMAIN 四条胜利线关闭。但 SWORDHOLDER_APPOINTED 在 CRISIS 纪元 filteredEvent 中写入（minYear=50），DETERRENCE 胜利判定不直接读取此 FLAG，而是读取 `earthCivi.swordholder !== null`。

---

## 二、核心实体清单

### 2.1 剧情事件（events.json, epoch=DETERRENCE, 8 个）

| year | 事件名 | talker | reqFlag | 关键 effects | 行号 |
|---|---|---|---|---|---|
| 201 | 威慑纪元宣告 | 联合国秘书长 | deterrence_established | flag:deterrence_era_declared / culture+30 | 677-702 |
| 205 | 技术交流 | 智子 | deterrence_established | flag:tech_exchange_started / culture+20 / economy+50 | 775-805 |
| 210 | 威慑稳固期 | 罗辑 | deterrence_established | culture+20 / economy+50 | 806-832 |
| 219 | 执剑人交接 | 罗辑 | deterrence_established | **分支**：程心(swordholder_chengxin/unlock 程心+艾AA/treachery+10) 或 罗辑连任(swordholder_luoji_retained/deterrenceValue+30) | 833-870 |
| 220 | 威慑中止 | 智子 | swordholder_chengxin | flag:deterrence_broken / prestige-90 / treachery+40 / population-20 | 871-891 |
| 220 | 威慑持续 | 罗辑 | swordholder_luoji_retained | flag:deterrence_held_strong / prestige+30 / deterrenceValue+20 / culture+15 | 892-912 |
| 225 | 澳大利亚大移民 | 智子 | deterrence_broken | flag:australia_migration / population-15 / prestige-30 / treachery+25 | 913-954 |
| 230 | 引力波广播(罗辑路线) | 万有引力号 | deterrence_held_strong | **flag:coordinates_broadcasted** / prestige+30 / deterrenceValue+50 | 986-1016 |

**跨纪元边界事件（year=201~230, 非 DETERRENCE）**：
| year | 事件名 | epoch | reqFlag | 关键 effects | 行号 |
|---|---|---|---|---|---|
| 201 | 黑暗战役 | CRISIS | doomsday_battle_lost | flag:dark_battle / military-200 / population-10 / treachery+20 | 703-738 |
| 202 | 威慑建立 | CRISIS | doomsday_battle_lost | **flag:deterrence_established** / prestige+80 / treachery-20 / culture+30 | 739-774 |
| 230 | 引力波广播(程心路线) | BROADCAST | australia_migration | **flag:coordinates_broadcasted** / prestige+30 / treachery+20 | 955-985 |

### 2.2 硬编码过滤事件（filteredEvents, epoch=DETERRENCE, 2 个）

| id | title | condition | choices 概要 | 行号 |
|---|---|---|---|---|
| deterrence_strain | 威慑天平倾斜 | minYear:70 / epoch:DETERRENCE / reqFlag:swordholder_appointed / minDeterrence:40 | A:flag:deterrence_reinforced / economy-30；B:culture+25 / treachery-5 | 479-492 |
| lightspeed_project | 光速飞船提案 | minYear:90 / epoch:DETERRENCE / reqTech:曲率驱动理论 / reqNotFlag:lightspeed_project_approved | A:flag:lightspeed_project_approved / economy-50 / prestige+30；B:prestige-15 / flag:lightspeed_rejected | 493-506 |

**主题相关 filteredEvent（epoch=CRISIS）**：
| id | title | condition | 关键 | 行号 |
|---|---|---|---|---|
| deterrence_establishment | 建立威慑体系 | minYear:50 / epoch:CRISIS / reqTech:黑暗森林威慑 / minDeterrence:50 | 选项"任命罗辑为执剑人"写入 **swordholder_appointed** + 强制 earthCivi.swordholder="罗辑" | 340-353 |

### 2.3 随机事件（randomevents.json, 涉及 DETERRENCE, 34 个）

| 范围 | 数量 | 代表 id |
|---|---|---|
| 纯 epoch=DETERRENCE | 25 | dark_forest_signal_detected / chengxin_swordholder_trial / chengxin_ladder_project / hines_mental_seal_weaponized / beihai_last_stand 等 |
| CRISIS,DETERRENCE 跨纪元 | 6 | revolt_water_sabotage_zone_5 / shiqiang_philosophy_talk / liucixin_devourer_approaching 等 |
| DETERRENCE,BROADCAST(,BUNKER) 跨纪元 | 3 | dark_forest_signal_harmonic_decay / liucixin_poetry_cloud_art / liucixin_cryogenic_art |

**注意**：randomevents 中无任何 DETERRENCE 纪元事件直接修改 treachery（11 处 treachery 效果均属 GALAXY/BUNKER 纪元）。

### 2.4 人物状态

**进入 DETERRENCE 时死亡（12 人，epochDeathMap 含 "DETERRENCE"）**：
伊文斯 / 章北海 / 丁仪 / 叶文洁 / 汪淼 / 大史 / 常伟思 / 东方延绪 / 杨冬 / 华华 / 滑膛 / 朱汉扬

**DETERRENCE 纪元存活人物（epochDeathMap 不含 "DETERRENCE"）**：

| 人物 | 死亡纪元 | 解锁时机 | DETERRENCE 可用性 |
|---|---|---|---|
| 罗辑 | GALAXY | CRISIS 面壁计划 | ✅ 可用（第一任执剑人） |
| 希恩斯 | BROADCAST | CRISIS 面壁计划 | ✅ 可用 |
| 庄颜 | BROADCAST | CRISIS 增援未来 | ✅ 可用 |
| 维德 | BUNKER | CRISIS "只送大脑" | ✅ 可用 |
| 程心 | 永不死亡 | DETERRENCE year=219（条件解锁） | ⚠️ 仅程心路线 |
| 艾AA | 永不死亡 | DETERRENCE year=219（条件解锁） | ⚠️ 仅程心路线 |
| 云天明 | 永不死亡 | BROADCAST year=260 | ❌ DETERRENCE 未解锁 |
| 智子 | 永不死亡 | BROADCAST year=260 | ❌ DETERRENCE 未解锁 |
| 关一帆 | 永不死亡 | BROADCAST year=260 | ❌ DETERRENCE 未解锁 |
| 刘慈欣 | GALAXY | **从未解锁** | ❌ 永远不可用 |

**DETERRENCE 实际可用人物**：4 人（罗辑/希恩斯/庄颜/维德）或 6 人（程心路线 +程心/艾AA）。

### 2.5 FLAG 读写清单

| FLAG 名称 | 定义于 GameFlags.ts | 写入点 | 读取点 | 生命周期 |
|---|---|---|---|---|
| deterrence_established | ✅ 第 11 行 | events.json:748 (year=202 CRISIS) | Game.ts:772 (门控) / events.json:700,803,830,868 (reqFlag) | 跨纪元持久 |
| coordinates_broadcasted | ✅ 第 12 行 | events.json:999 (year=230 DETERRENCE) / events.json:968 (year=230 BROADCAST) | Game.ts:773 (门控) / events.json:1050 (BROADCAST reqFlag) | 跨纪元持久 |
| swordholder_appointed | ✅ 第 38 行 | GameEventManager.ts:350 (filteredEvent CRISIS) | GameEventManager.ts:487 / Game.ts:972,998,1047,1073 (互斥) / CivilizationArchive.tsx:90 | 跨纪元持久 |
| deterrence_broken | ✅ 第 50 行 | events.json:882 (year=220) | events.json:945 (year=225 reqFlag) | DETERRENCE 内 |
| deterrence_held_strong | ❌ 动态字符串 | events.json:908 (year=220) | events.json:990 (year=230 reqFlag) | DETERRENCE 内 |
| swordholder_chengxin | ❌ 动态字符串 | events.json:851 (year=219) | events.json:876 (year=220 reqFlag) | DETERRENCE 内 |
| swordholder_luoji_retained | ❌ 动态字符串 | events.json:856 (year=219) | events.json:897 (year=220 reqFlag) | DETERRENCE 内 |
| swordholder_handover | ❌ 动态字符串 | events.json:848,853 (year=219) | **无读取** | ⚠️ 死 FLAG（候选问题） |
| deterrence_era_declared | ❌ 未定义常量 | events.json:689 (year=201) | **无读取** | ⚠️ 死 FLAG（AR-4 上游已登记） |
| tech_exchange_started | ❌ 动态字符串 | events.json:790 (year=205) | **待全量确认** | 待核验 |
| australia_migration | ❌ 动态字符串 | events.json:940 (year=225) | events.json:966 (year=230 BROADCAST reqFlag) | DETERRENCE→BROADCAST |
| chengxin_swordholder | ❌ 动态字符串 | randomevents.json:6008 | **待全量确认** | 待核验 |
| deterrence_reinforced | ❌ 动态字符串 | GameEventManager.ts:489 | **待全量确认** | 待核验 |
| lightspeed_project_approved | ❌ 动态字符串 | GameEventManager.ts:503 | **待全量确认** | 待核验 |
| lightspeed_rejected | ❌ 动态字符串 | GameEventManager.ts:505 | **待全量确认** | 待核验 |

### 2.6 科技条件

| 科技 | 树 | 前置 | 读取点 | 证据状态 |
|---|---|---|---|---|
| 黑暗森林威慑 | MILITARY 根节点 | 无 | filteredEvent deterrence_establishment reqTech (CRISIS) | CONFIRMED |
| 曲率驱动理论 | 待核验 | 待核验 | filteredEvent lightspeed_project reqTech (DETERRENCE) | 待核验 |
| 核聚变推进 | 待核验 | 待核验 | randomevent chengxin_ladder_project reqTech (DETERRENCE) | 待核验 |

### 2.7 世界 Tag

| Tag ID | name | category | isMilestone | 触发点 | 衰减 |
|---|---|---|---|---|---|
| deterrence_era | 威慑纪元 | epoch | true | Game.ts:837 纪元切换 | 不衰减 |
| deterrence_steady | 威慑稳固 | military | false | Game.ts:523 (deterrenceValue>60) | 每回合 -3 |
| deterrence_unstable | 威慑不稳 | military | false | **未找到调用点** | 预留未启用 |
| victory_deterrence | 威慑胜利 | state | true | Game.ts 结局记录 | 不衰减 |

---

## 三、初步因果链草图

### 3.1 主线因果链（罗辑路线 — 胜利路径）

```
[CRISIS 出口]
year=200 末日战役 → doomsday_battle_lost
  ↓
year=201 黑暗战役（CRISIS）→ dark_battle / treachery+20
  ↓
year=202 威慑建立（CRISIS）→ deterrence_established / treachery-20 / culture+30
  ↓
culture≥200 + deterrence_established
  ↓
[DETERRENCE 入口] updateEpoch 推进 epoch=2
  ↓
year=201 威慑纪元宣告（时序倒置：实际 year≥203 触发）→ deterrence_era_declared(死FLAG) / culture+30
  ↓
year=205 技术交流 → tech_exchange_started / culture+20 / economy+50
  ↓
year=210 威慑稳固期 → culture+20 / economy+50
  ↓
year=219 执剑人交接 → 选项 B 罗辑连任 → swordholder_luoji_retained / deterrenceValue+30
  ↓
year=220 威慑持续 → deterrence_held_strong / deterrenceValue+20 / culture+15
  ↓
[deterrenceValue 累积 + 每回合 deterrenceEnduranceRounds++（需≥80）]
  ↓
year=230 引力波广播（DETERRENCE 版）→ coordinates_broadcasted / deterrenceValue+50
  ↓
[胜利判定] epoch=2 + swordholder≠null + deterrenceValue≥90 + endurance≥20 + 无互斥
  ↓
DETERRENCE 胜利结局
```

### 3.2 程心路线因果链（失败路径）

```
year=219 执剑人交接 → 选项 A 任命程心 → swordholder_chengxin / unlock 程心+艾AA / treachery+10
  ↓
year=220 威慑中止 → deterrence_broken / treachery+40 / population-20 / prestige-90
  ↓
year=225 澳大利亚大移民 → australia_migration / treachery+25 / population-15 / prestige-30
  ↓
year=230 引力波广播（BROADCAST 版，epoch=BROADCAST）→ coordinates_broadcasted / treachery+20
  ↓
[两条可能]
├── treachery≥100 → DEFEAT_TREACHERY 失败
├── population≤0 → DEFEAT_EXTINCTION 失败
└── 存活 → 推进到 BROADCAST 纪元
```

### 3.3 关键分叉点

**year=219 执剑人交接**是 DETERRENCE 纪元的唯一分叉点，决定胜利/失败走向：
- 罗辑路线：deterrenceValue 持续增长 → 胜利可达
- 程心路线：treachery 暴涨 +75 → 失败高风险

---

## 四、核心状态读写链

### 4.1 deterrenceValue（威慑值）读写

| 操作 | 位置 | 时机 | 变化 |
|---|---|---|---|
| 初始 | Game.ts 默认 | 新游戏 | 0（推断） |
| +30 | events.json:857 (year=219 选项B) | 罗辑连任 | +30 |
| +20 | events.json:908 (year=220 罗辑路线) | 威慑持续 | +20 |
| +50 | events.json:1012 (year=230 罗辑路线) | 引力波广播 | +50 |
| 读取(胜利) | Game.ts:1015 (checkVictoryConditions) | 结局判定 | ≥90 |
| 读取(累积) | Game.ts:651-659 (runARound) | 每回合 | ≥80 时 enduranceRounds++ |

**罗辑路线 deterrenceValue 累计**：初始值 + 30 + 20 + 50 = 初始值 + 100。若初始值≥0，则 year=230 后 deterrenceValue≥100，满足胜利阈值 90。

### 4.2 treachery（逃亡主义）读写

| 操作 | 位置 | 时机 | 变化 |
|---|---|---|---|
| CRISIS 累积 | year=201 +20 / year=202 -20 | CRISIS 末 | 净 0（典型） |
| +10 | events.json:851 (year=219 选项A) | 任命程心 | +10 |
| +40 | events.json:882 (year=220 程心路线) | 威慑中止 | +40 |
| +25 | events.json:945 (year=225) | 澳大利亚移民 | +25 |
| +20 | events.json:968 (year=230 BROADCAST 版) | 引力波广播 | +20 |
| -5 | GameEventManager.ts:490 (filteredEvent 选项B) | 和平共处外交 | -5 |
| 读取(失败) | Game.ts:1219 (checkVictoryConditions) | 结局判定 | ≥100 失败 |

**程心路线 treachery 累计**：CRISIS累积 + 10 + 40 + 25 + 20 = CRISIS累积 + 95。若 CRISIS 累积≥5，则 year=230 后 treachery≥100 → DEFEAT_TREACHERY。

### 4.3 earthCivi.swordholder（执剑人字段）读写

| 操作 | 位置 | 时机 | 值 |
|---|---|---|---|
| 写入 | Game.ts:433-443 (filteredEvent effects 处理) | CRISIS filteredEvent deterrence_establishment 选项"任命罗辑" | "罗辑" |
| 读取(胜利) | Game.ts:1014 (checkVictoryConditions) | DETERRENCE 胜利判定 | !== null |
| 读取(累积) | Game.ts:651 (runARound) | 每回合 enduranceRounds 累积 | !== null |
| 清空 | Game.ts:702-724 (runARound 死亡判定) | 执剑人死亡 | null |

**注意**：events.json year=219 执剑人交接**不直接修改 earthCivi.swordholder 字段**，仅设置 FLAG（swordholder_chengxin / swordholder_luoji_retained）。程心路线解锁程心但未将她设为 swordholder 字段值——这是一个**状态不一致风险**（候选问题）。

### 4.4 deterrenceEnduranceRounds（威慑维持回合数）

| 操作 | 位置 | 条件 | 变化 |
|---|---|---|---|
| 累积 | Game.ts:651-659 | epoch≥DETERRENCE + swordholder≠null + deterrenceValue≥80 | ++ |
| 清零 | Game.ts:651-659 | 不满足上述任一 | =0 |
| 读取(胜利) | Game.ts:1016 | 结局判定 | ≥20 |

**胜利阈值分析**：需连续 20 回合 deterrenceValue≥80。罗辑路线 year=219 后 deterrenceValue 增长 30，若初始值≥50 则满足；year=220 后再 +20；year=230 后再 +50。最早胜利时点约为 year=219+20=year=239（若 deterrenceValue 始终≥80）。

---

## 五、待取证问题（候选问题登记）

> 以下为 MODEL 阶段初步识别的候选问题，需在 EVIDENCE 阶段完整取证后确认。

| 候选 ID | 现象 | 涉及对象 | 当前证据 | 尚缺证据 | 可能影响 |
|---|---|---|---|---|---|
| CQ-1 | year=201 威慑纪元宣告事件 reqFlag=deterrence_established，但该 FLAG 在 year=202 才写入，导致 year=201 事件延迟到 year=203+ 触发 | events.json:700, 748 | 与 AR-2 同类时序倒置 | 实际触发年份运行时验证 | 叙事时序错乱 |
| CQ-2 | swordholder_handover FLAG 被写入但无读取（死 FLAG） | events.json:848,853 | Grep 零读取匹配 | 全量 randomevents 确认 | 维护成本 |
| CQ-3 | deterrence_era_declared 死 FLAG（上游 AR-4 确认） | events.json:689 | 上游已确认 | — | 维护成本 |
| CQ-4 | events.json year=219 执剑人交接不修改 earthCivi.swordholder 字段，仅设 FLAG。程心路线解锁程心但 swordholder 仍为"罗辑" | events.json:851 / Game.ts:433-443 | swordholder 字段仅在 filteredEvent effects 处理时写入 | 运行时验证 swordholder 字段在 year=219 后的值 | DETERRENCE 胜利判定读取 swordholder≠null，若程心路线未更新此字段可能导致判定异常 |
| CQ-5 | 程心路线 treachery 累计 +95（含 CRISIS 累积），极易触达 100 阈值导致 DEFEAT_TREACHERY | events.json:851,882,945,968 | 数值已确认 | CRISIS 典型 treachery 累积值 | 程心路线几乎必然失败 |
| CQ-6 | 程心路线 year=230 引力波广播事件 epoch=BROADCAST，但触发时玩家可能在 DETERRENCE 纪元（culture 未达 500） | events.json:966 | epoch 字段为 BROADCAST 但 reqFlag=australia_migration 在 DETERRENCE 写入 | checkEvents 是否检查 epoch 匹配 | 程心路线可能无法触发坐标广播，导致卡死在 DETERRENCE |
| CQ-7 | DETERRENCE 纪元 filteredEvent minYear=70/90，但 DETERRENCE 纪元 year≥201，filteredEvent 的 minYear 语义可能为"绝对年份" | GameEventManager.ts:481,495 | minYear=70 < DETERRENCE 起始 year 201 | filteredEvent minYear 语义确认 | filteredEvent 可能在 CRISIS 期间触发（若 minYear 是绝对年份） |
| CQ-8 | deterrence_unstable Tag 已定义但无调用点 | TagManager.ts:66 | Grep 零调用 | — | 预留未启用 |
| CQ-9 | 刘慈欣人物在 epochDeathMap 中存活至 GALAXY，但 events.json 中无 unlock_person 解锁，永远不可用 | persons.json / events.json | 全量搜索无 unlock | — | 无直接影响，维护成本 |
| CQ-10 | randomevent chengxin_swordholder_trial 写入 chengxin_swordholder FLAG，与 events.json 的 swordholder_chengxin 命名不一致 | randomevents.json:6008 / events.json:851 | 字符串不匹配 | 两 FLAG 是否有消费者 | 可能导致执剑人状态分裂 |
| CQ-11 | AR-5 FLAG 永久累积在 DETERRENCE 持续：CRISIS 的 doomsday_battle_lost/dark_battle 等 FLAG 进入 DETERRENCE 后无清理 | Game.ts:789-915 | 上游已确认 | DETERRENCE 事件是否有 reqNotFlag 读取这些 FLAG | 可能通过 reqNotFlag 阻断 DETERRENCE 事件 |
| CQ-12 | AR-7 FlagManager 引用漂移风险在 DETERRENCE 持续 | GameSerializer.ts:76-78 | 上游已确认 | 运行时触发场景 | 读档后 FLAG 行为异常 |
| CQ-13 | UC-1 treachery 爆发在 DETERRENCE 持续：程心路线 +95 几乎必然触发 | events.json | 本纪元取证确认 | CRISIS 典型 treachery 累积值 | 程心路线必败 |
| CQ-14 | UC-2 updateEpoch/checkVictoryConditions 顺序风险在 DETERRENCE 持续 | Game.ts | 上游已确认 | 同回合同时满足的场景 | 纪元推进可能覆盖失败结局 |

---

## 六、当前未确认范围

| 编号 | 未确认范围 | 待核验方式 |
|---|---|---|
| U-1 | filteredEvent minYear 语义（绝对年份 vs 纪元内年份） | 读取 GameEventManager 触发逻辑 |
| U-2 | checkEvents 是否检查事件 epoch 字段与当前 epoch 匹配 | 读取 GameEventManager.ts:913 checkEvents 实现 |
| U-3 | earthCivi.swordholder 字段在 year=219 事件后的实际值 | 运行时断点 |
| U-4 | tech_exchange_started / chengxin_swordholder / deterrence_reinforced / lightspeed_project_approved / lightspeed_rejected 等 FLAG 是否有消费者 | 全量 Grep |
| U-5 | 曲率驱动理论 / 核聚变推进 科技前置链 | TecTreeManager.ts 核验 |
| U-6 | CRISIS 典型 treachery 累积值（用于评估程心路线风险） | Autoplay500 运行观察 |
| U-7 | randomevents.json 34 条 DETERRENCE 事件完整 effects | 逐条核验（重点 treachery/population 影响） |
| U-8 | events.json year=220 两个事件（reqFlag 不同）的触发顺序 | checkEvents 遍历顺序 |
| U-9 | DETERRENCE 纪元期间 culture 增长速率（是否能在 year=230 前达到 500 推进 BROADCAST） | 数值公式核验 |
| U-10 | 存档边界：deterrenceEnduranceRounds 是否持久化 | SaveSchema / GameSerializer 核验 |

---

## 七、审计范围与下游接口预告

### 7.1 本纪元审计范围
- DETERRENCE 纪元入口/出口/内部阶段因果链
- 8 个剧情事件 + 2 个 filteredEvent + 34 个 randomevent 触发逻辑
- 12 人死亡 + 4~6 人存活人物状态轨迹
- 15+ FLAG 读写链
- DETERRENCE 胜利结局判定 + 3 条失败结局竞争
- 存档/回溯边界

### 7.2 下游接口预告（DETERRENCE → BROADCAST）

| 复核项 | 预告内容 |
|---|---|
| 纪元出口条件 | culture≥500 + coordinates_broadcasted |
| 状态传递 | deterrence_broken / australia_migration / deterrence_held_strong / swordholder_chengxin / swordholder_luoji_retained 等 FLAG 累积进入 BROADCAST |
| 人物死亡 | 进入 BROADCAST 后庄颜/希恩斯死亡（epochDeathMap 含 BROADCAST） |
| treachery 跨纪元 | 程心路线 +95 累积进入 BROADCAST，可能立即触发 DEFEAT_TREACHERY |
| year=230 事件 | 两个 year=230 事件分属 DETERRENCE 和 BROADCAST，需复核触发顺序 |
| coordinates_broadcasted | 写入点 2 处（两路线各一），读取点在 BROADCAST 门控 |

---

**EPOCH_AUDIT_MODEL_威慑纪元 建立完成。未输出正式缺陷结论，未修改代码。**

**候选问题统计**：14 项（CQ-1 ~ CQ-14）
**未确认范围**：10 项（U-1 ~ U-10）
**接口复核**：6 项上游接口已全部取证（含 1 项名单修正）
**下一步**：进入 EPOCH_EVIDENCE 阶段，对 10 个方面完整取证。
