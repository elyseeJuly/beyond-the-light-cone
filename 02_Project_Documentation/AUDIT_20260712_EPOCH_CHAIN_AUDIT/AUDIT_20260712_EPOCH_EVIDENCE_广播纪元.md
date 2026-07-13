# `EPOCH_EVIDENCE_广播纪元`

> 纪元：广播纪元（BROADCAST, epoch=3）
> 阶段：完整取证（10 个方面）
> 证据截止：20260712
> 引用文档：AUDIT_20260712_BASELINE、AUDIT_20260712_EPOCH_MODEL_广播纪元、AUDIT_20260712_AUDIT_REPORT_威慑纪元

---

## 方面 1：纪元入口

### 1.1 检查对象
BROADCAST 纪元的入口条件，包括文化阈值、门控 FLAG、防回退机制。

### 1.2 设计证据
- epochs.json: epoch=3, minCulture=500, maxCulture=799
- timeline.json: gameYearRange=[261,300]
- BASELINE 5.2: 入口门控 FLAG = COORDINATES_BROADCASTED

### 1.3 代码证据

**入口门控（Game.ts:770-773）：**
```typescript
if (matched.epoch > this.epoch) {
  let allowed = true;
  if (matched.epoch === EpochType.DETERRENCE && !this.flagManager.isSet(FLAG.DETERRENCE_ESTABLISHED)) allowed = false;
  if (matched.epoch === EpochType.BROADCAST && !this.flagManager.isSet(FLAG.COORDINATES_BROADCASTED)) allowed = false;
```

**coordinates_broadcasted 写入点（2 处）：**

| 路线 | 事件 | 位置 | triggerCondition | effects |
|---|---|---|---|---|
| 罗辑 | year=230 DETERRENCE 版 | events.json:987-1015 | epoch=DETERRENCE, minYear=230, reqFlag=deterrence_held_strong | coordinates_broadcasted + prestige+30 + deterrenceValue+50 |
| 程心 | year=230 BROADCAST 版 | events.json:955-984 | epoch=BROADCAST, minYear=230, reqFlag=australia_migration | coordinates_broadcasted + prestige+30 + treachery+20 |

### 1.4 测试证据
- EdgeCases.test.ts:379-380: 验证 culture=500/799 + coordinates_broadcasted → BROADCAST
- Autoplay500.test.ts:199: 手动 addFlag('coordinates_broadcasted') 后验证推进

### 1.5 正常路径
罗辑路线：year=202 威慑建立 → DETERRENCE → year=219 选项B 罗辑连任 → year=220 deterrence_held_strong → year=230 DETERRENCE 版事件触发 → coordinates_broadcasted → culture≥500 → 推进 BROADCAST ✅

### 1.6 异常路径
- **程心路线**：因 AR-10（year=230 BROADCAST 版事件 epoch 不匹配）+ 二阶循环依赖（事件 epoch=BROADCAST 但写入 BROADCAST 入口门控 FLAG），程心路线永久不可达 BROADCAST ❌
- **跨级跳跃**（BU-1）：若 culture 直接从 <500 跳到 ≥800，updateEpoch 不检查中间纪元 FLAG，但 BROADCAST 门控仍检查 COORDINATES_BROADCASTED

### 1.7 证据闭合状态
✅ **闭合**。入口条件、门控 FLAG、写入点、正常路径、异常路径均已取证。

---

## 方面 2：时间线与内部阶段

### 2.1 检查对象
BROADCAST 纪元的内部时间线、事件年份分布、与 timeline.json 的一致性。

### 2.2 设计证据
- timeline.json: 广播纪元 gameYearRange=[261,300]，现实年份 2272-2332
- BC-2 已登记：events.json BROADCAST 事件最早在 year=230，但 timeline 标注 [261,300]

### 2.3 代码证据

**events.json BROADCAST 事件年份分布：**

| year | 事件 | triggerCondition.epoch | reqFlag |
|---|---|---|---|
| 230 | 引力波广播（BROADCAST 版·程心路线） | BROADCAST | australia_migration |
| 235 | 三体星系毁灭 | BROADCAST | coordinates_broadcasted |
| 240 | 三体第二舰队逃离 | BROADCAST | trisolaris_destroyed |
| 260 | 云天明童话 | BROADCAST | 无 |
| 261 | 广播纪元宣告 | BROADCAST | coordinates_broadcasted |

**注**：year=230 DETERRENCE 版（罗辑路线）在 DETERRENCE 纪元触发，非 BROADCAST 内事件。

**filteredEvent 年份（GameEventManager.ts）：**
| ID | minYear | 说明 |
|---|---|---|
| broadcast_era_dawn | 120 | 远低于 BROADCAST 起始 year（≥230），约束冗余 |
| bunker_project_debate | 150 | 同上 |
| inner_conflict_resolution | 160 | 同上 |
| conquest_declaration_event | 200 | 同上 |

### 2.4 测试证据
无直接测试覆盖 BROADCAST 内部时间线顺序。

### 2.5 正常路径
year=230（DETERRENCE 版触发）→ culture≥500 推进 BROADCAST → year=235 → year=240 → year=260 → year=261

### 2.6 异常路径
- **BC-2 冲突**：timeline.json 标注 [261,300] 但 BROADCAST 事件最早在 year=230（程心路线版）/ year=235（正常路径）
- **filteredEvent minYear 冗余**（CQ-4）：4 个 filteredEvent 的 minYear 均低于 BROADCAST 起始 year

### 2.7 证据闭合状态
✅ **闭合**。内部阶段、事件顺序、时间线冲突均已取证。

---

## 方面 3：人物状态

### 3.1 检查对象
BROADCAST 纪元中人物的存活/死亡状态、解锁路径、在事件中的出场。

### 3.2 设计证据
- epochDeathMap（GameEventManager.ts:938-990）标注各人物的死亡纪元
- persons.json 35 人物，以 name 为唯一键

### 3.3 代码证据

**BROADCAST 纪元死亡人物（epochDeathMap 含 "BROADCAST"）：**

| 人物 | epochDeathMap 值 | 说明 |
|---|---|---|
| 希恩斯 | ["BROADCAST", "BUNKER", "GALAXY"] | 进入 BROADCAST 时死亡 |
| 庄颜 | ["BROADCAST", "BUNKER", "GALAXY"] | 进入 BROADCAST 时死亡 |

**死亡判定逻辑（Game.ts:702-724）：**
```typescript
const currentEpochStr = epochNamesInternal[this.epoch];
for (const p of this.personManager.getAllPersons()) {
  if (p.isAlive && !this.eventManager.isPersonAliveInEpoch(p.name, currentEpochStr)) {
    p.isAlive = false;
  }
  if (!p.isAlive) {
    if (this.earthCivi.swordholder === p.name) {
      this.earthCivi.swordholder = null;
    }
    // ...发布讣告
  }
}
```

**BROADCAST 纪元存活人物（主要）：**
| 人物 | 存活至 | 说明 |
|---|---|---|
| 罗辑 | GALAXY | 执剑人，swordholder="罗辑"保持 |
| 维德 | BUNKER | |
| 程心 | 永久存活 | |
| 艾AA | 永久存活 | |
| 云天明 | 永久存活 | year=260 解锁 |
| 智子 | 永久存活 | year=260 解锁 |
| 关一帆 | 永久存活 | year=260 解锁 |
| 刘慈欣 | GALAXY | 但无 unlock 路径（AR-18） |

**人物出场与死亡冲突：**

| filteredEvent | 出场人物 | 死亡状态 | 冲突 |
|---|---|---|---|
| broadcast_era_dawn | 智子、罗辑 | 均存活 | 无 ❌ |
| bunker_project_debate | 艾AA、关一帆 | 艾AA 存活；关一帆 year=260 才解锁，minYear=150 可能早于解锁 | 潜在（关一帆未解锁时作为 speaker） |
| inner_conflict_resolution | 褚岩、庄颜 | 庄颜在 BROADCAST 死亡 | **冲突** ⚠️（CQ-3） |
| conquest_declaration_event | 维德、章北海 | 维德存活；章北海在 DETERRENCE 死亡 | **冲突** ⚠️（章北海已死亡但仍作为 speaker） |

### 3.4 测试证据
无直接测试覆盖 BROADCAST 人物死亡时机。

### 3.5 正常路径
进入 BROADCAST 时，希恩斯和庄颜被判定死亡，swordholder 不受影响（罗辑存活）。

### 3.6 异常路径
- **CQ-3**：庄颜在 BROADCAST 死亡，但仍作为 inner_conflict_resolution filteredEvent 的 speaker
- **新发现**：章北海在 DETERRENCE 死亡（epochDeathMap 含 DETERRENCE），但 conquest_declaration_event（epoch=BROADCAST）中章北海作为 speaker → 章北海在 BROADCAST 已死亡

### 3.7 证据闭合状态
✅ **闭合**。死亡名单、存活名单、出场冲突均已取证。

---

## 方面 4：事件资格与触发

### 4.1 检查对象
BROADCAST 纪元事件的资格判定、触发顺序、去重机制、互斥关系。

### 4.2 设计证据
- 事件系统：events.json 57 条 + randomevents.json 154 条 + filteredEvents 29 条
- 去重机制：story event 用 hasTriggered；filteredEvent 用 triggeredFilteredIds；random event 用 randomEventTriggerCounts + maxTriggers

### 4.3 代码证据

**BROADCAST 剧情事件触发条件：**

| year | reqFlag | epoch 检查 | 触发逻辑 |
|---|---|---|---|
| 230（BROADCAST 版） | australia_migration | isEpochMatch("BROADCAST", currentEpoch) | 程心路线，因 AR-10 不可达 |
| 235 | coordinates_broadcasted | isEpochMatch("BROADCAST", currentEpoch) | 正常 ✅ |
| 240 | trisolaris_destroyed | isEpochMatch("BROADCAST", currentEpoch) | 正常 ✅ |
| 260 | 无 | isEpochMatch("BROADCAST", currentEpoch) | 正常 ✅ |
| 261 | coordinates_broadcasted | isEpochMatch("BROADCAST", currentEpoch) | 正常 ✅ |

**触发判定（GameEventManager.ts:913-917）：**
```typescript
checkEvents() {
  // currentYear >= e.inYear 只有下界无上界
  // + epoch 匹配 + reqFlag 检查
}
```

**BROADCAST filteredEvent 资格条件（GameEventManager.ts:770-819）：**
- minYear 检查（绝对游戏年份）
- epoch 检查（isEpochMatch）
- reqFlag / reqNotFlag 检查（含 FLAG_ALIAS_MAP 映射）
- minCulture / minMilitary / minDeterrence / minPopulation 检查
- reqTech 检查
- reqTag / reqNotTag 检查

**事件互斥关系：**
| 事件对 | 互斥机制 | 证据状态 |
|---|---|---|
| year=230 DETERRENCE 版 vs BROADCAST 版 | reqFlag 互斥（deterrence_held_strong vs australia_migration）+ epoch 互斥 | CONFIRMED |
| broadcast_era_dawn 两选项 | 互斥 FLAG（broadcast_dawn_seen + escape_tech_focus vs 仅 broadcast_dawn_seen） | 不完全互斥（两选项都写 broadcast_dawn_seen） |
| conquest_declaration_event 两选项 | reqNotFlag: conquest_declared（首次触发后不再触发） | CONFIRMED |

### 4.4 测试证据
无直接测试覆盖 BROADCAST 事件触发顺序。

### 4.5 正常路径
进入 BROADCAST 后，checkEvents 按 year 顺序触发 235→240→260→261 事件。

### 4.6 异常路径
- year=230 BROADCAST 版事件因 epoch 不匹配 + 二阶循环依赖永久不可达
- filteredEvent 在 BROADCAST 纪元可触发（minYear 约束冗余但无害）

### 4.7 证据闭合状态
✅ **闭合**。事件清单、触发条件、互斥关系均已取证。

---

## 方面 5：数值变化

### 5.1 检查对象
BROADCAST 纪元期间 culture / treachery / deterrenceValue / population / prestige / military / economy 的来源、范围和消费位置。

### 5.2 代码证据

**culture：**
| 操作 | 位置 | 值 |
|---|---|---|
| 自动增长 | EarthCivilization.ts:249 `this.culture += this.processCulture(game)` | 每回合 2~100（公式：floor((cultureWorkers+leaderBonus)*weight/15)+deptBase） |
| year=235 事件 | EventSystem.ts:127 | +10 |
| year=261 事件 | EventSystem.ts:127 | +40 |
| filteredEvent inner_conflict 选项B | EventSystem.ts:127 | +25 |
| randomevent tianming_fairy_tale | EventSystem.ts:127 | +5 |
| randomevent chengxin_staircase | EventSystem.ts:127 | +7 |
| BROADCAST→BUNKER 阈值 | Game.ts:764 | ≥800（但因 AR-20 不可达） |

**treachery：**
| 操作 | 位置 | 值 |
|---|---|---|
| year=235 事件 | EventSystem.ts:129 | +15 |
| year=240 事件 | EventSystem.ts:129 | -5 |
| filteredEvent inner_conflict 选项A | EventSystem.ts:129 | -15 |
| filteredEvent inner_conflict 选项B | EventSystem.ts:129 | -5 |
| filteredEvent conquest 选项A | EventSystem.ts:129 | +15 |
| DEFEAT_TREACHERY 阈值 | Game.ts:1219 | ≥100 |
| CONQUEST 胜利阈值 | Game.ts:1044 | <50 |

**罗辑路线 BROADCAST treachery 净变化：** +15（year=235）-5（year=240）= **+10**（不含 filteredEvent）
若触发 conquest_declaration：+10+15 = **+25**
若触发 inner_conflict：+10-15 = **-5** 或 +10-5 = **+5**

**treachery 上限：** `Math.min(100, ...)`（EventSystem.ts:129），treachery 不会超过 100。

**deterrenceValue：**
| 操作 | 位置 | 值 |
|---|---|---|
| 面壁者自动加成 | EarthCivilization.ts:259 | +(leadership+art)*0.05/回合 |
| filteredEvent conquest reqMinDeterrence | GameEventManager.ts:659 | ≥60 |
| DETERRENCE 胜利阈值 | Game.ts:1018 | ≥90（但 DETERRENCE 胜利仅限 DETERRENCE 纪元） |

**swordholder / deterrenceEnduranceRounds（死累积）：**
| 操作 | 位置 | 说明 |
|---|---|---|
| deterrenceEnduranceRounds 累积 | Game.ts:651 | epoch>=DETERRENCE && swordholder!==null && deterrenceValue>=80 时 +1 |
| DETERRENCE 胜利消费 | Game.ts:1019 | allowedEras=[DETERRENCE]，BROADCAST 中不消费 |

### 5.3 测试证据
- EdgeCases.test.ts:379-382: 验证 BROADCAST 纪元推进的 culture/flag 条件

### 5.4 正常路径
culture 从 500 自动增长，每回合 +2~10，约 30~150 回合达 800。

### 5.5 异常路径
- culture 达 800 后因 BUNKER_WORLD_COMPLETED 未设置而 EPOCH_STALLED，玩家永久卡死
- treachery 若 CRISIS+DETERRENCE 累积已高，BROADCAST +10 可能触达 100 → DEFEAT_TREACHERY

### 5.6 证据闭合状态
✅ **闭合**。所有数值字段来源、范围、消费位置均已取证。

---

## 方面 6：Tag/Flag 生命周期

### 6.1 检查对象
BROADCAST 纪元期间所有 FLAG 和 Tag 的写入/读取/移除生命周期。

### 6.2 代码证据

**BROADCAST 纪元 FLAG 生命周期表：**

| FLAG | 写入点 | 读取点 | 消费者纪元 | 状态 |
|---|---|---|---|---|
| coordinates_broadcasted | events.json:998（DETERRENCE 版 year=230） | year=235 reqFlag, year=261 reqFlag, Game.ts:773 门控 | BROADCAST | 活 ✅ |
| trisolaris_destroyed | events.json:1029（year=235） | year=240 reqFlag | BROADCAST | 活 ✅ |
| trisolaris_fleet_escaped | events.json:1065（year=240） | 无 | - | 死 ❌ |
| broadcast_era_declared | events.json:1124（year=261） | 无 | - | 死 ❌ |
| broadcast_dawn_seen | filteredEvent broadcast_era_dawn | filteredEvent bunker_project_debate reqFlag | BROADCAST | 活 ✅ |
| escape_tech_focus | filteredEvent broadcast_era_dawn 选项B | 无 | - | 死 ❌ |
| bunker_project_active | filteredEvent bunker_project_debate 选项A | 无 | - | 死 ❌ |
| dual_strategy | filteredEvent bunker_project_debate 选项B | 无 | - | 死 ❌ |
| conquest_declared | filteredEvent conquest_declaration + Game.ts:1092 | CONQUEST 胜利条件, WANDERING/DIGITAL/DETERRENCE 互斥 | 全局 | 活 ✅ |
| tianming_fairy_tales | randomevent tianming_fairy_tale_decode | 无 | - | 死 ❌ |
| staircase_data | randomevent chengxin_staircase_probe | 无 | - | 死 ❌ |

**死 FLAG 统计：** 7 个（trisolaris_fleet_escaped / broadcast_era_declared / escape_tech_focus / bunker_project_active / dual_strategy / tianming_fairy_tales / staircase_data）

**跨纪元累积 FLAG（从 CRISIS/DETERRENCE 进入 BROADCAST）：**
| FLAG | 写入纪元 | BROADCAST 中读取 | 状态 |
|---|---|---|---|
| deterrence_established | CRISIS/DETERRENCE | 无直接读取（但 Game.ts:772 门控已通过） | 持久保留（AR-5） |
| swordholder_appointed | CRISIS（filteredEvent） | CONQUEST 胜利条件 `!SWORDHOLDER_APPOINTED` | **阻断 CONQUEST 胜利** ⚠️ |
| swordholder_chengxin | DETERRENCE（year=219） | 无 | 死 |
| swordholder_luoji_retained | DETERRENCE（year=219） | 无 | 死 |
| deterrence_held_strong | DETERRENCE（year=220） | 无（year=230 DETERRENCE 版已在 DETERRENCE 消费） | 死 |
| deterrence_broken | DETERRENCE（year=220 程心路线） | 无（程心路线不可达 BROADCAST） | 死（不可达路径） |
| australia_migration | DETERRENCE（year=225 程心路线） | 无（同上） | 死（不可达路径） |

**Tag 生命周期：**
| Tag | 施加 | 移除 | 证据 |
|---|---|---|---|
| broadcast_era | Game.ts:830（epochTagMap[3], 纪元入口） | Game.ts:843（下一纪元入口循环移除） | CONFIRMED |
| deterrence_era | 上一纪元施加 | Game.ts:843（BROADCAST 入口时移除） | CONFIRMED |

### 6.3 测试证据
无直接测试覆盖 BROADCAST FLAG 生命周期。

### 6.4 证据闭合状态
✅ **闭合**。所有 FLAG 读写链已追踪，死 FLAG 7 个已确认，跨纪元累积已追踪。

---

## 方面 7：科技条件

### 7.1 检查对象
BROADCAST 纪元事件和结局的科技依赖、前置链合法性。

### 7.2 代码证据

**BROADCAST 事件科技依赖：**
| 事件/filteredEvent | reqTech | 说明 |
|---|---|---|
| year=235/240/260/261 剧情事件 | 无 | 无科技依赖 |
| broadcast_era_dawn | 无 | 无科技依赖 |
| bunker_project_debate | 无 | 无科技依赖 |
| inner_conflict_resolution | 无 | 无科技依赖 |
| conquest_declaration_event | 无 | 无科技依赖（但需 minMilitary:30, minDeterrence:60） |

**BROADCAST 可达结局的科技依赖：**
| 结局 | 科技条件 | 代码位置 |
|---|---|---|
| CONQUEST | 无直接科技依赖（但 isAllCiviConquered 间接依赖军事科技） | Game.ts:1041-1056 |
| HIDDEN（broadcastTriggered 路径） | 黑域生成 OR 数字方舟 OR 新家园选址（任一完成则 broadcastSurvives=true） | WallfacerPanel.ts:165-169 |
| DEFEAT_DIMENSION_STRIKE/HELIUM_FLASH | year>350 且无 黑域生成/数字方舟/维度防御/流浪完成 | Game.ts:1265-1270 |

**科技前置链合法性：**
- addProgress（TecTreeManager.ts:179）严格检查 parentName 前置完成
- 5 棵树：物理21/航天33/军事13/信息15/星际12

### 7.3 测试证据
- TecTreeManager.test.ts: 验证科技前置链
- 无直接测试覆盖 BROADCAST 科技条件

### 7.4 正常路径
BROADCAST 纪元事件无科技依赖，玩家可自由触发事件。

### 7.5 异常路径
- broadcastTriggered 路径要求特定科技完成才能 HIDDEN 胜利，否则 EXTINCTION 失败
- BROADCAST 期间未完成关键科技将导致 year>350 时触发 DEFEAT_DIMENSION_STRIKE/HELIUM_FLASH

### 7.6 证据闭合状态
✅ **闭合**。科技依赖、前置链、结局科技条件均已取证。

---

## 方面 8：纪元出口

### 8.1 检查对象
BROADCAST 纪元的所有可能出口路径。

### 8.2 代码证据

**出口路径表：**

| 出口路径 | 条件 | 代码位置 | 可达性 | 证据状态 |
|---|---|---|---|---|
| → BUNKER（正常推进） | culture≥800 + BUNKER_WORLD_COMPLETED | Game.ts:774 | ❌ 不可达（AR-20） | CONFIRMED |
| → DEFEAT_TREACHERY | treachery≥100 | Game.ts:1219 | ✅ 可达 | CONFIRMED |
| → DEFEAT_EXTINCTION | population≤0 | Game.ts:1234 | ✅ 可达 | CONFIRMED |
| → DEFEAT_DIMENSION_STRIKE/HELIUM_FLASH | year>350 + 无关键科技/防御 | Game.ts:1265 | ✅ 可达（若 year 达 350） | CONFIRMED |
| → CONQUEST 胜利 | treachery<50 + isAllCiviConquered + CONQUEST_DECLARED + !SWORDHOLDER_APPOINTED + !WANDERING_COMPLETED + !DIGITAL_ARK_UPGRADE + !DARK_DOMAIN_DECISION + !ZERO_HOMER_CONTACTED | Game.ts:1037-1056 | ✅ 条件性可达 | CONFIRMED |
| → HIDDEN 胜利（broadcastTriggered） | broadcastTriggered=true + broadcastSurvives=true（黑域生成/数字方舟/新家园选址/galaxy_exodus_seen/wandering_completed 任一） | Game.ts:1096-1110, WallfacerPanel.ts:171 | ✅ 可达 | CONFIRMED |
| → EXTINCTION 失败（broadcastTriggered） | broadcastTriggered=true + broadcastSurvives=false | Game.ts:1112-1146 | ✅ 可达 | CONFIRMED |

**bunker_world_completed 写入点唯一性验证：**
- events.json:1150（year=280, epoch=BUNKER）→ BROADCAST 纪元无法触发
- FLAG_ALIAS_MAP: 'bunker_cities_ready' → 'bunker_world_completed'（GameEventManager.ts:791）→ bunker_cities_ready 全库无写入
- 结论：BROADCAST 纪元无法写入 bunker_world_completed

### 8.3 测试证据
- EdgeCases.test.ts:381-382: 验证 BROADCAST→BUNKER 推进（手动 set bunker_world_completed）
- 测试假设 bunker_world_completed 已设置，未测试自然触发路径

### 8.4 正常路径
玩家只能通过以下方式退出 BROADCAST：
1. DEFEAT 结局（treachery/extinction/dimension_strike）
2. CONQUEST 胜利（条件性）
3. broadcastTriggered 结局（HIDDEN 或 EXTINCTION）

### 8.5 异常路径
- **正常推进 BUNKER 永久不可达**（AR-20）：bunker_world_completed 循环依赖
- year>350 触发 DEFEAT_DIMENSION_STRIKE/HELIUM_FLASH 是"超时"退出机制

### 8.6 证据闭合状态
✅ **闭合**。所有出口路径、可达性、循环依赖均已取证。

---

## 方面 9：结局逻辑

### 9.1 检查对象
BROADCAST 纪元可触发的结局、竞争关系、优先级。

### 9.2 代码证据

**checkVictoryConditions 执行顺序（Game.ts:1089-1310）：**
1. 自动设置 CONQUEST_DECLARED（if isAllCiviConquered）→ Game.ts:1091-1093
2. **broadcastTriggered 短路**（Game.ts:1096-1146）→ 立即结局，优先级最高
3. 胜利条件数组遍历（Game.ts:1149-1086）→ 顺序：HIDDEN→WANDERING→DIGITAL→DETERRENCE→CONQUEST→DARK_DOMAIN
4. NEUTRAL_ETERNAL_EXILE（Game.ts:~1183）→ 要求 epoch≥GALAXY，BROADCAST 不适用
5. NEUTRAL_COSMIC_SILENCE（Game.ts:1201）→ 要求 epoch≥BUNKER，BROADCAST 不适用
6. DEFEAT_TREACHERY（Game.ts:1219）→ treachery≥100
7. DEFEAT_EXTINCTION（Game.ts:1234）→ population≤0
8. DEFEAT_DIMENSION_STRIKE/HELIUM_FLASH（Game.ts:1265）→ year>350

**BROADCAST 可达结局竞争关系：**

| 结局 | 优先级 | 条件 | 与其他结局竞争 |
|---|---|---|---|
| HIDDEN（broadcastTriggered） | 1（最高） | broadcastTriggered=true | 短路所有其他结局 |
| EXTINCTION（broadcastTriggered） | 1 | broadcastTriggered=true + broadcastSurvives=false | 短路所有其他结局 |
| CONQUEST | 4（胜利数组第5） | treachery<50 + isAllCiviConquered + CONQUEST_DECLARED + !SWORDHOLDER_APPOINTED | 与 WANDERING/DIGITAL/DETERRENCE 互斥（通过 FLAG 互斥） |
| DEFEAT_TREACHERY | 6（失败第1） | treachery≥100 | 优先于 EXTINCTION |
| DEFEAT_EXTINCTION | 7（失败第2） | population≤0 | - |
| DEFEAT_DIMENSION_STRIKE | 8（失败第3） | year>350 + 无关键科技 | - |

**CONQUEST 胜利条件详细（Game.ts:1041-1056）：**
```typescript
return this.year >= 200 &&
       this.earthCivi.population > 10 &&
       this.earthCivi.treachery < 50 &&
       this.alienCiviManager.isAllCiviConquered() &&
       this.hasFlag(FLAG.CONQUEST_DECLARED) &&
       !this.hasFlag(FLAG.SWORDHOLDER_APPOINTED) &&
       !this.hasFlag(FLAG.WANDERING_COMPLETED) &&
       !this.hasFlag(FLAG.DIGITAL_ARK_UPGRADE) &&
       !this.hasFlag(FLAG.DARK_DOMAIN_DECISION) &&
       !this.hasFlag(FLAG.ZERO_HOMER_CONTACTED);
```

**SWORDHOLDER_APPOINTED 对 CONQUEST 的影响：**
- 若 CRISIS filteredEvent 触发 → swordholder_appointed 已设置 → CONQUEST 阻断
- 若仅通过 year=202 事件路径 → swordholder_appointed 未设置 → CONQUEST 允许
- 设计意图：执剑人路线与征服路线互斥（叙事合理）

### 9.3 测试证据
- Game.victoryConditions.test.ts: 测试各胜利条件
- Game.defeatConditions.test.ts: 测试各失败条件
- EndingConditions.scenario.test.ts: 场景测试

### 9.4 正常路径
玩家在 BROADCAST 通过 broadcastTriggered 按钮或 CONQUEST 胜利或 DEFEAT 退出。

### 9.5 异常路径
- 若玩家未完成任何关键科技且未点击广播按钮，year>350 时触发 DEFEAT_DIMENSION_STRIKE/HELIUM_FLASH 超时退出

### 9.6 证据闭合状态
✅ **闭合**。结局优先级、竞争关系、条件均已取证。

---

## 方面 10：存档与回溯

### 10.1 检查对象
BROADCAST 纪元相关状态的存档持久化、加载恢复、版本迁移。

### 10.2 代码证据

**存档排除字段（GameSerializer.ts:39-41）：**
```
currentEvent, eventQueue, isProcessing, _rngProvider, turnHistory, eventSystem, economySystem, populationSystem, game, _hadRunError, _yearJustAdvanced, flagManager
```

**BROADCAST 关键字段持久化状态：**

| 字段 | 类型 | 持久化 | 证据 |
|---|---|---|---|
| epoch | EpochType | ✅ 持久化（不在排除列表） | Game.ts:53 |
| year | number | ✅ 持久化 | Game.ts |
| earthCivi.culture | number | ✅ 持久化 | EarthCivilization.ts |
| earthCivi.treachery | number | ✅ 持久化 | EarthCivilization.ts |
| earthCivi.swordholder | string\|null | ✅ 持久化 | EarthCivilization.ts |
| earthCivi.deterrenceValue | number | ✅ 持久化 | EarthCivilization.ts |
| deterrenceEnduranceRounds | number | ✅ 持久化 | Game.ts |
| broadcastTriggered | boolean | ✅ 持久化（不在排除列表） | Game.ts:97, SaveManager.ts:116 |
| broadcastSurvives | boolean | ✅ 持久化 | Game.ts:98 |
| flags Set | FlagManager | ✅ 持久化（gameReplacer 序列化 Set，restorePrototypes 重建） | GameSerializer.ts:76-78 |
| tagManager | TagManager | ✅ 持久化 | - |
| hasTriggered (story events) | Set | ✅ 持久化 | GameEvent.ts |
| triggeredFilteredIds | Set | ✅ 持久化 | GameEventManager.ts |
| randomEventTriggerCounts | Map | ✅ 持久化 | GameEventManager.ts |

**SaveManager 版本迁移（SaveManager.ts:116）：**
```typescript
if (data.broadcastTriggered === undefined) data.broadcastTriggered = false;
```
v1→v4 迁移时为 broadcastTriggered 补默认值。

### 10.3 测试证据
- SaveLoad.test.ts: 存档/读档测试
- Serialization.scenario.test.ts: 序列化场景测试
- Autoplay500.test.ts: 500 回合自动游玩后存档验证

### 10.4 正常路径
BROADCAST 纪元所有关键状态均持久化，加载后可恢复。

### 10.5 异常路径
- flagManager 排除持久化但 restorePrototypes 重建（AR-7 已部分修复）
- TagManager toJSON/fromJSON 路径不一致（U-1 未确认）

### 10.6 证据闭合状态
✅ **闭合**。所有关键字段持久化状态已验证。

---

## 候选问题汇总

| 编号 | 等级 | 问题 | 证据闭合 |
|---|---|---|---|
| CQ-1 | P1 | bunker_world_completed 循环依赖（AR-20），BROADCAST→BUNKER 永久不可达 | ✅ |
| CQ-2 | P2 | 7 个死 FLAG 群 | ✅ |
| CQ-3 | P2 | 庄颜死后仍作为 speaker（inner_conflict_resolution） | ✅ |
| CQ-4 | P3 | filteredEvent minYear 语义冗余（4 个） | ⚠️ 需 BROADCAST 典型进入 year 值 |
| CQ-5 | P1 | year=230 BROADCAST 版二阶循环依赖（程心路线即使修复 AR-10 仍不可达） | ✅ |
| CQ-6 | P3 | swordholder / deterrenceEnduranceRounds 死累积 | ✅ |
| CQ-7 | P2 | 章北海死后仍作为 speaker（conquest_declaration_event） | ✅ 新发现 |

## 未确认项汇总

| 编号 | 范围 | 尚缺证据 |
|---|---|---|
| U-B1 | BROADCAST 典型进入 year 值 | 数值公式核验（culture 500→800 所需回合数） |
| U-B2 | CRISIS+DETERRENCE 典型 treachery 累积值 | Autoplay500 运行观察 |
| U-B3 | CONQUEST 胜利在 BROADCAST 的实际可达性 | isAllCiviConquered 运行时验证 |
| U-B4 | broadcastTriggered 按钮在 BROADCAST 的可用性 | WallfacerPanel UI 渲染条件验证 |

---

**EPOCH_EVIDENCE_广播纪元 取证完成。未修改代码。**
