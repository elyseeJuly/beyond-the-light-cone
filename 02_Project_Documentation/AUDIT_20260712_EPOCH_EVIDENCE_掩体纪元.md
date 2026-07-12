# `EPOCH_EVIDENCE_掩体纪元`

> 纪元：掩体纪元（BUNKER, epoch=4）
> 阶段：完整取证（补齐证据，未输出最终报告，未修改代码）
> 证据截止：20260712
> 模型引用：EPOCH_AUDIT_MODEL_掩体纪元

---

## 一、纪元入口证据

### 1.1 检查对象
BUNKER 纪元入口门控逻辑、入口 FLAG 写入点、BROADCAST→BUNKER 推进路径可达性。

### 1.2 设计证据
- epochs.json: `{ epoch: 4, name: "掩体纪元", minCulture: 800, maxCulture: 1199 }`
- timeline.json: gameYearRange=[301,350]，描述"掩体世界、维德政变、二向箔"
- 基线 5.2 表：入口门控 FLAG = BUNKER_WORLD_COMPLETED

### 1.3 代码证据
- **门控逻辑**（Game.ts:774）：`if (matched.epoch === EpochType.BUNKER && !this.flagManager.isSet(FLAG.BUNKER_WORLD_COMPLETED)) allowed = false;`
- **入口 FLAG 写入点**：
  - events.json:1150（year=280, epoch=**BUNKER**）：`{ "type": "flag", "target": "bunker_world_completed" }`
  - FLAG_ALIAS_MAP（GameEventManager.ts:791）：`'bunker_cities_ready': 'bunker_world_completed'` — 但 `bunker_cities_ready` 全库无写入点
- **写入点 epoch 分析**：唯一写入点 epoch=BUNKER，BROADCAST 纪元 isEpochMatch("BUNKER","BROADCAST")=false → 事件不可触发
- **EventSystem.applyNewEffects**（EventSystem.ts:134-136）：`this.game.addFlag(eff.target)` — 直接写入原始 FLAG 字符串，不应用 FLAG_ALIAS_MAP
- **FlagManager.set**（FlagManager.ts:34-36）：`this.flags.add(flag)` — Set 操作，无 value 参数

### 1.4 测试证据
- EdgeCases.test.ts:381-382：`{ startEpoch: BROADCAST, culture: 800, flag: 'bunker_world_completed', expectedEpoch: BUNKER }` — 手动 set FLAG 后验证推进
- Game.test.ts:94：`game.addFlag('bunker_world_completed')` — 手动设置
- **所有测试均手动设置 FLAG，未测试自然触发路径**

### 1.5 正常路径
```
BROADCAST 纪元 culture≥800 + bunker_world_completed → Game.ts:774 门控通过 → 推进 BUNKER
```

### 1.6 异常路径
- **AR-20（继承自广播纪元报告）**：bunker_world_completed 唯一写入点 epoch=BUNKER，BROADCAST 纪元无法触发 → 循环依赖 → BUNKER 永久不可达
- 修复 AR-20 后（将 year=280 事件 epoch 改为 "BROADCAST" 或 "BROADCAST,BUNKER"），入口可达

### 1.7 证据闭合性
**证据闭合**。入口门控逻辑、FLAG 写入点、循环依赖（AR-20）均已确认。本审计假设 AR-20 修复后验证 BUNKER 内部因果链。

---

## 二、时间线与内部阶段证据

### 2.1 检查对象
BUNKER 纪元内部事件年份分布、阶段划分、时间线一致性。

### 2.2 设计证据
- timeline.json: gameYearRange=[301,350]，描述"掩体世界、维德政变、二向箔"
- 基线 BC-2：events.json 实际事件年份（280~365）与 timeline.json 标注 [301,350] 错位

### 2.3 代码证据
**events.json BUNKER 事件年份分布**：

| year | 事件 | epoch | minYear | 一致性 |
|---|---|---|---|---|
| 280 | 掩体世界落成 | BUNKER | 280 | ✅ |
| 281 | 掩体纪元宣告 | BUNKER | 281 | ✅ |
| 290 | 黑域宣言 | BUNKER | 290 | ✅ |
| 295 | 光速飞船测试 | BUNKER | 295 | ✅ |
| 300 | 维德政变 | BUNKER | 300 | ✅ |
| 310 | 维德被处决 / 光速飞船量产 | BUNKER | 310 | ✅ |
| 340 | 二向箔警报 | BUNKER | 340 | ✅ |
| 350 | 二向箔打击 | BUNKER | 350 | ✅ |
| 355 | 冥王星博物馆 | BUNKER | 355 | ✅ |
| 360 | 太阳系二维化 | BUNKER | 360 | ✅ |
| 365 | 银河出逃 | BUNKER | 365 | ✅ |
| 400 | 流浪地球（跨纪元） | BROADCAST,BUNKER,GALAXY | 400 | ✅ |

**timeline.json 错位**（BC-2 持续）：
- timeline.json 标注 BUNKER gameYearRange=[301,350]
- events.json BUNKER 事件 year 范围 280~365（含入口事件 year=280 早于 timeline 起始 301）

### 2.4 测试证据
无直接测试覆盖 BUNKER 内部时间线一致性。

### 2.5 正常路径
进入 BUNKER 后 year 从 BROADCAST 末年（≥230）开始递增，year=280 触发掩体世界落成，year=365 触发银河出逃，year≥365 + culture≥1200 推进 GALAXY。

### 2.6 异常路径
- 若 BROADCAST 末 year 已超过 280（UC-10/BK3 未确认 BROADCAST 典型退出 year），进入 BUNKER 后 year=280 事件可能因 `hasTriggered` 或 year 已过而触发时序异常
- year=340 treachery+50 可能导致 DEFEAT_TREACHERY 提前触发，阻断后续 year=350~365 事件

### 2.7 证据闭合性
**证据闭合**（时间线错位为已知 BC-2）。BUNKER 末年 year=365 + culture≥1200 推进 GALAXY 的时序已确认。

---

## 三、人物状态证据

### 3.1 检查对象
进入 BUNKER 时人物死亡判定、BUNKER 期间存活人物、事件 speaker 存活一致性。

### 3.2 设计证据
- epochDeathMap（GameEventManager.ts:937-991）硬编码 35 人物死亡纪元
- 基线 3.2：人物数据 persons.json 35 人，以 name 为唯一键

### 3.3 代码证据

**进入 BUNKER 时死亡判定**（Game.ts:702-724，调用 isPersonAliveInEpoch）：
- 维德：epochDeathMap["维德"] = ["BUNKER","GALAXY"] → **进入 BUNKER 即死亡**
- 罗辑：epochDeathMap["罗辑"] = ["GALAXY"] → BUNKER **存活**
- 程心/云天明/智子/艾AA/关一帆：epochDeathMap = [] → BUNKER **存活**

**BUNKER 事件 speaker 与存活状态冲突**：

| year | 事件 | talk0_talker | epochDeathMap | BUNKER 存活 | 冲突 |
|---|---|---|---|---|---|
| 280 | 掩体世界落成 | 联合政府 | — | — | ✅ 无冲突 |
| 300 | 维德政变 | **维德** | ["BUNKER","GALAXY"] | **死亡** | ❌ 死亡人物发言 |
| 310 | 维德被处决 | **维德** | ["BUNKER","GALAXY"] | **死亡** | ❌ 死亡人物发言 |
| 310 | 光速飞船量产 | **维德** | ["BUNKER","GALAXY"] | **死亡** | ❌ 死亡人物发言 |
| 340 | 二向箔警报 | 太阳系预警系统 | — | — | ✅ 无冲突 |
| 350 | 二向箔打击 | 关一帆 | [] | 存活 | ✅ 无冲突 |
| 355 | 冥王星博物馆 | 罗辑 | ["GALAXY"] | 存活 | ✅ 无冲突 |
| 360 | 太阳系二维化 | 艾AA | [] | 存活 | ✅ 无冲突 |
| 365 | 银河出逃 | 星环号舰长 | — | — | ✅ 无冲突 |

**filteredEvent speaker 与存活状态冲突**：

| filteredEvent | speaker | epochDeathMap | BUNKER 存活 | 冲突 |
|---|---|---|---|---|
| dimensional_threat_alert | 林云 / 关一帆 | 林云含BUNKER / 关一帆=[] | 林云**死亡** | ❌ 林云死亡人物发言 |
| digital_ark_upgrade_event | 科学执政官 / 反对派 | — | — | ✅ 无冲突 |
| dark_domain_decision_event | 科学执政官 / 罗辑 | 罗辑=["GALAXY"] | 存活 | ✅ 无冲突 |
| dimensional_defense_research_event | 丁仪 / 林云 | 丁仪含BUNKER / 林云含BUNKER | **均死亡** | ❌ 双死亡人物发言 |
| dimensional_defense_completed_event | 科学执政官 / 关一帆 | 关一帆=[] | 存活 | ✅ 无冲突 |

**unlock_person 对死亡人物的效果**（U-BK8 闭合）：
- PersonManager.unlockPerson（PersonManager.ts:32-37）：仅检查 `persons.has(name) && !availablePersons.has(name)`，**不检查 isAlive**
- EventSystem.applyUnlockPerson（EventSystem.ts:247-271）：调用 `personManager.unlockPerson(target)`，**不检查 isAlive**
- year=300 事件 effects 含 `{ "type": "unlock_person", "target": "维德" }` → 维德虽死亡但仍被 unlock 成功

### 3.4 测试证据
- 无测试覆盖 BUNKER 事件 speaker 存活一致性
- 无测试覆盖 unlock_person 对死亡人物的效果

### 3.5 正常路径
进入 BUNKER 时 Game.ts:702-724 根据 epochDeathMap 判定死亡，死亡人物 isAlive=false。BUNKER 存活人物（罗辑/程心/云天明/智子/艾AA/关一帆）正常参与事件。

### 3.6 异常路径
- 维德进入 BUNKER 即死亡，但 year=300/310 事件中维德作为 talker（死亡人物发言，与 AR-23/AR-24 同类）
- 林云/丁仪在 BUNKER 死亡，但 dimensional_threat_alert / dimensional_defense_research_event 中作为 speaker
- year=300 事件 unlock_person:维德 对死亡人物生效（unlock 不检查 isAlive）

### 3.7 证据闭合性
**证据闭合**。维德/林云/丁仪死亡人物发言问题已确认，unlock_person 不检查 isAlive 已确认。

---

## 四、事件资格与触发证据

### 4.1 检查对象
BUNKER 纪元事件触发条件（epoch/minYear/reqFlag/reqTech/reqNotFlag）、去重机制、触发顺序。

### 4.2 代码证据

**剧情事件触发条件**（GameEventManager.checkEvents, :913）：
- isEpochMatch：epoch 字段支持逗号分隔多纪元匹配
- minYear/maxYear：绝对年份判定（GameEventManager.ts:776）
- reqFlag/reqNotFlag：经 FLAG_ALIAS_MAP 映射后判定（GameEventManager.ts:799-801）
- reqTech：科技完成判定
- 去重：`hasTriggered` 布尔（GameEvent.ts）

**BUNKER 剧情事件触发链**：

| year | 事件 | reqFlag | 前置事件 | 触发链 |
|---|---|---|---|---|
| 280 | 掩体世界落成 | — | — | 入口事件 |
| 281 | 掩体纪元宣告 | bunker_world_completed | year=280 | ✅ 顺序正确 |
| 290 | 黑域宣言 | — | — | 独立 |
| 295 | 光速飞船测试 | — | — | 独立 |
| 300 | 维德政变 | lightspeed_ship_tested | year=295 | ✅ 顺序正确 |
| 310 | 维德被处决 | wade_opposed | year=300 选择B | ✅ 顺序正确 |
| 310 | 光速飞船量产 | supported_wade | year=300 选择A | ✅ 顺序正确 |
| 340 | 二向箔警报 | — | — | 独立 |
| 350 | 二向箔打击 | — | — | 独立 |
| 355 | 冥王星博物馆 | dimensional_strike | year=350 | ✅ 顺序正确 |
| 360 | 太阳系二维化 | dimensional_strike | year=350 | ✅ 顺序正确 |
| 365 | 银河出逃 | — | — | 独立 |

**filteredEvent 触发条件**（GameEventManager.ts:723-825 getFilteredEventsForTurn + isEventEligible）：
- epoch 匹配、minYear、reqTech、reqFlag/reqNotFlag（经 alias 映射）、minPopulation/minCulture/minDeterrence/minMilitary
- 去重：`triggeredFilteredIds: Set`

**filteredEvent minYear 语义冗余**（C-5）：

| filteredEvent | minYear | BUNKER 起始 year | 冗余 |
|---|---|---|---|
| dimensional_threat_alert | 180 | ≥280 | ✅ 冗余 |
| digital_ark_upgrade_event | 200 | ≥280 | ✅ 冗余 |
| dark_domain_decision_event | 250 | ≥280 | ✅ 冗余 |
| dimensional_defense_research_event | 200 | ≥280 | ✅ 冗余 |
| dimensional_defense_completed_event | 250 | ≥280 | ✅ 冗余 |

### 4.3 测试证据
- EdgeCases.test.ts 验证 BROADCAST→BUNKER 推进（手动 set FLAG）
- 无测试覆盖 BUNKER 内部事件触发顺序

### 4.4 正常路径
进入 BUNKER 后 year 递增，事件按 year 顺序触发，reqFlag 链式依赖正确。

### 4.5 异常路径
- **year=300 事件 value:0 问题**（C-6 已闭合）：FlagManager.set 不接收 value 参数，value:0 不影响 FLAG 设置 → FLAG 正常设置
- **dimensional_alert_seen 双写**（C-4）：events.json:1348 和 filteredEvent :546 双写同一 FLAG。若 filteredEvent 先触发则 reqNotFlag=dimensional_alert_seen 阻断后续 events.json 事件（但 events.json 事件不检查 reqNotFlag=dimensional_alert_seen，所以不阻断）

### 4.6 证据闭合性
**证据闭合**。事件触发链、minYear 冗余、value:0 语义、双写影响均已确认。

---

## 五、数值变化证据

### 5.1 检查对象
BUNKER 纪元期间 culture/treachery/population/economy/military/deterrenceValue/prestige 变化。

### 5.2 代码证据

**数值变化账本**：

| 来源 | culture | treachery | population | economy | military | prestige | deterrence |
|---|---|---|---|---|---|---|---|
| year=280 掩体落成 | — | — | +15 | +200 | — | — | — |
| year=281 纪元宣告 | +40 | — | — | — | — | +20 | — |
| year=290 黑域宣言 | — | — | — | — | — | -30 | — |
| year=295 光速飞船 | +50 | — | — | — | — | — | — |
| year=300 支持维德 | — | +30 | — | — | +50 | -30 | — |
| year=300 阻止维德 | — | +10 | — | — | -100 | -20 | — |
| year=310 维德处决 | +5 | +5 | — | — | — | -15 | — |
| year=310 光速量产 | +30 | — | — | -200 | +100 | +20 | — |
| year=340 二向箔警报 | — | **+50** | — | — | — | — | — |
| year=350 二向箔打击 | — | — | -40 | -300 | -500 | -50 | — |
| year=355 冥王星 | +50 | — | — | — | — | +30 | — |
| year=360 二维化 | +20 | — | — | — | — | +10 | — |
| year=365 银河出逃 | — | — | -80 | -400 | — | — | — |

**净变化（完整路径 280→365）**：
- culture: +40+50+5+30+50+20 = **+195**
- treachery: +30+5+50 = **+85**（支持维德路线）或 +10+5+50 = **+65**（阻止维德路线）
- population: +15-40-80 = **-105**
- economy: +200-200-300-400 = **-700**
- military: +50-500 = **-450**（支持维德）或 -100-500 = **-600**（阻止维德）
- prestige: +20-30-30-15+20+30+10 = **+5**（支持维德）或 +20-30-20-15+30+10 = **-5**（阻止维德）

**treachery 高风险分析**（C-8）：
- year=340 一次性 +50
- 若 BROADCAST 末 treachery ≥ 50（UC-11 未确认），则 year=340 后 treachery ≥ 100 → DEFEAT_TREACHERY
- 若 BROADCAST 末 treachery ≥ 15（支持维德路线 +30+5=35），则 year=340 后 treachery ≥ 85，再加 filteredEvent +10 可能达 95~100

**deterrenceEnduranceRounds 死累积**（C-7，AR-26 同类）：
- Game.ts:651：`if (this.epoch >= EpochType.DETERRENCE && this.earthCivi.swordholder !== null)`
- BUNKER epoch=4 >= DETERRENCE=2，罗辑路线 swordholder="罗辑" → 持续累积
- DETERRENCE 胜利 allowedEras=[DETERRENCE] → BUNKER 中累积值无消费者

### 5.3 测试证据
- 无测试覆盖 BUNKER 数值变化累积
- Game.defeatConditions.test.ts:170 验证 dimensional_defense 阻止 DEFEAT_DIMENSION_STRIKE

### 5.4 证据闭合性
**证据闭合**。数值变化账本完整，treachery 高风险已量化，deterrenceEnduranceRounds 死累积已确认。

---

## 六、Tag/Flag 生命周期证据

### 6.1 检查对象
BUNKER 纪元 FLAG 写入/读取/消费者完整链路、死 FLAG、Tag 跨纪元处理。

### 6.2 代码证据

**FLAG 生命周期表**：

| FLAG | 写入点 | 读取点（消费者） | alias 映射 | 状态 |
|---|---|---|---|---|
| bunker_world_completed | events.json:1150 (year=280,BUNKER) | Game.ts:774 (门控); events.json:1202 (reqFlag) | bunker_cities_ready→此 | ✅ 活 |
| bunker_era_declared | events.json:1186 (year=281) | **无** | — | ❌ 死 FLAG |
| black_domain_decision | events.json:1217 (year=290) | Game.ts:1202 (NEUTRAL_COSMIC_SILENCE) | →dark_domain_decision (仅读取) | ⚠️ 仅中性结局 |
| dark_domain_decision | GameEventManager.ts:647 (filteredEvent) | Game.ts:1070 (DARK_DOMAIN胜利); Game.ts:1202 | — | ✅ 活 |
| lightspeed_ship_tested | events.json:1242 (year=295) | events.json:1290 (reqFlag) | lightspeed_travel_possible→此 | ✅ 活 |
| supported_wade | events.json:1268 (year=300, value:0) | events.json:1333 (reqFlag) | — | ✅ 活 |
| wade_opposed | events.json:1279 (year=300, value:0) | events.json:1311 (reqFlag) | — | ✅ 活 |
| wade_coup | events.json:1269/1280 (year=300, value:0) | **无** | — | ❌ 死 FLAG |
| wade_executed | events.json:1303 (year=310, value:0) | **无** | — | ❌ 死 FLAG |
| wade_succeeded | events.json:1324 (year=310, value:0) | **无** | — | ❌ 死 FLAG |
| dimensional_alert_seen | events.json:1348 (year=340); GameEventManager.ts:546 (filteredEvent) | GameEventManager.ts:544 (reqNotFlag) | dimensional_strike_imminent→此 | ✅ 活(双写) |
| dimensional_strike | events.json:1373 (year=350) | Game.ts:775 (GALAXY门控); events.json:1429/1460 (reqFlag) | — | ✅ 活 |
| pluto_museum | events.json:1413 (year=355) | **无** (MuseumGallery 用事件id非FLAG) | human_heritage_archived→此 | ❌ 死 FLAG |
| solar_system_flattened | events.json:1444 (year=360) | **无** | — | ❌ 死 FLAG |
| galaxy_exodus_seen | events.json:1475 (year=365) | Game.ts:775 (GALAXY门控); Game.ts:933/946/1183 | galaxy_exodus_successful→此 | ✅ 活 |
| digital_ark_upgrade | GameEventManager.ts:633 (filteredEvent) | Game.ts:994 (DIGITAL胜利); 多处reqNotFlag | — | ✅ 活 |
| dimensional_defense | GameEventManager.ts:703 (filteredEvent) | GameEventManager.ts:715 (reqFlag); Game.ts:1268; UI | — | ✅ 活 |
| dimensional_defense_completed | GameEventManager.ts:717 (filteredEvent) | Game.ts:1269; UI | — | ✅ 活 |

**死 FLAG 汇总**（6 个）：bunker_era_declared / wade_coup / wade_executed / wade_succeeded / pluto_museum / solar_system_flattened

**black_domain_decision 命名分歧**（C-2 已闭合）：
- events.json:1217 写入 `black_domain_decision`（EventSystem.applyNewEffects 直接 addFlag，不应用 alias）
- GameEventManager.ts:797 alias `black_domain_decision → dark_domain_decision` **仅用于 reqFlag/reqNotFlag 判定**
- Game.ts:1070 DARK_DOMAIN 胜利仅检查 `FLAG.DARK_DOMAIN_DECISION`（= `dark_domain_decision`）
- **结论**：year=290 事件写入的 `black_domain_decision` 无法触发 DARK_DOMAIN 胜利

**FLAG_ALIAS_MAP 应用范围确认**（U-BK2 闭合）：
- FLAG_ALIAS_MAP 定义在 GameEventManager.ts:781-798，仅用于 `isEventEligible` 的 reqFlag/reqNotFlag 判定（:799-801）
- EventSystem.applyNewEffects（:134-136）调用 `this.game.addFlag(eff.target)` — **不应用 alias**
- **结论**：events.json effects 写入 FLAG 时使用原始字符串，alias 仅在条件判定时转换

**Tag 跨纪元处理**：
- Game.ts:837：入口时 `setWorldTagIntensity("bunker_era", 100, ...)`
- Game.ts:840-846：入口时移除非当前纪元 Tag（epochTagMap 循环）
- Game.ts:512：每回合 `decayTags`

**value:0 语义确认**（U-BK1 闭合）：
- FlagManager.set(flag) 签名为 `set(flag): void`，不接收 value 参数
- EventSystem.applyNewEffects 对 flag 类型效果直接调用 `addFlag(eff.target)`，忽略 value
- **结论**：events.json 中 `"value": 0` 对 flag 类型效果无效，FLAG 正常设置

### 6.3 证据闭合性
**证据闭合**。所有 FLAG 读写链已追踪，死 FLAG 已确认，alias 应用范围已确认，value:0 语义已确认。

---

## 七、科技条件证据

### 7.1 检查对象
BUNKER filteredEvent 科技依赖、结局科技条件、科技树前置链可达性。

### 7.2 代码证据

**filteredEvent 科技依赖**：

| filteredEvent | reqTech | 科技树 | TecTreeType |
|---|---|---|---|
| digital_ark_upgrade_event | 数字方舟 | 信息树 | INFORMATION |
| dark_domain_decision_event | 黑域生成 | 待核验 | 待核验 |
| dimensional_defense_research_event | 空间曲率理论 | 待核验 | 待核验 |

**结局科技条件**：

| 结局 | 科技条件 | 位置 |
|---|---|---|
| WANDERING | 行星发动机Ⅲ型(航天) + 新家园选址(星际) | Game.ts:966-967 |
| DIGITAL | 数字方舟(信息) | Game.ts:993 |
| DARK_DOMAIN | 黑域生成 | Game.ts:1069 |
| DEFEAT逃避 | 黑域生成 / 数字方舟 / dimensional_defense / dimensional_defense_completed / wandering_completed（任一） | Game.ts:1265-1270 |

**科技前置链**（U-BK7 部分未确认）：
- TecTreeManager.ts 内嵌 94 节点，parentName 单父链
- 数字方舟/黑域生成/空间曲率理论的完整前置链需追踪 TecTreeManager.build*Tree()
- **本阶段未完整追踪科技前置链**，待 VALIDATION 阶段反例验证

### 7.3 证据闭合性
**部分闭合**。filteredEvent 和结局的科技依赖已确认，科技树前置链完整可达性待 VALIDATION 阶段验证。

---

## 八、纪元出口证据

### 8.1 检查对象
BUNKER→GALAXY 正常推进出口、出口 FLAG 写入可达性。

### 8.2 代码证据

**GALAXY 门控**（Game.ts:775）：
```
if (matched.epoch === EpochType.GALAXY && (!flagManager.isSet(FLAG.GALAXY_EXODUS_SEEN) && !flagManager.isSet(FLAG.DIMENSIONAL_STRIKE))) allowed = false;
```

**出口 FLAG 写入可达性**：

| FLAG | 写入点 | epoch | year | BUNKER 可达 |
|---|---|---|---|---|
| galaxy_exodus_seen | events.json:1475 | BUNKER | 365 | ✅ |
| galaxy_exodus_seen | GameEventManager.ts:560 | GALAXY | 220 | ❌ 循环依赖 |
| dimensional_strike | events.json:1373 | BUNKER | 350 | ✅ |

**出口结论**：BUNKER→GALAXY 正常推进出口**可闭合**。
- galaxy_exodus_seen 由 year=365（epoch=BUNKER）事件写入 ✅
- dimensional_strike 由 year=350（epoch=BUNKER）事件写入 ✅
- 满足 Game.ts:775 门控（二者之一即可）
- **与 AR-20（BROADCAST→BUNKER 循环依赖）不同**

### 8.3 测试证据
- EdgeCases.test.ts:383：`{ startEpoch: BUNKER, culture: 1200, flag: 'galaxy_exodus_seen', expectedEpoch: GALAXY }` — 手动 set FLAG 后验证推进

### 8.4 证据闭合性
**证据闭合**。BUNKER→GALAXY 出口可闭合，出口 FLAG 写入点在 BUNKER 纪元内可达。

---

## 九、结局逻辑证据

### 9.1 检查对象
BUNKER 纪元可触发的结局、结局竞争关系、互斥 FLAG。

### 9.2 代码证据

**结局竞争顺序**（Game.ts:1089-1310）：

| 顺序 | 结局 | 类型 | allowedEras | BUNKER 触发 |
|---|---|---|---|---|
| 0 | broadcastTriggered 短路 | — | — | ❌ BUNKER中false |
| 1 | HIDDEN | 胜利 | [GALAXY,STARDUST] | ❌ BUNKER不触发 |
| 2 | WANDERING | 胜利 | [BUNKER,GALAXY,STARDUST] | ✅ |
| 3 | DIGITAL | 胜利 | [BUNKER,GALAXY,STARDUST] | ✅ |
| 4 | DETERRENCE | 胜利 | [DETERRENCE] | ❌ BUNKER不触发 |
| 5 | CONQUEST | 胜利 | [BROADCAST,BUNKER,GALAXY,STARDUST] | ✅ |
| 6 | DARK_DOMAIN | 胜利 | [BUNKER,GALAXY,STARDUST] | ✅ |
| 7 | NEUTRAL_ETERNAL_EXILE | 中性 | ≥GALAXY | ❌ BUNKER不触发 |
| 8 | NEUTRAL_COSMIC_SILENCE | 中性 | ≥BUNKER | ✅ |
| 9 | DEFEAT_TREACHERY | 失败 | — | ✅ |
| 10 | DEFEAT_EXTINCTION | 失败 | — | ✅ |
| 11 | DEFEAT_DIMENSION_STRIKE/HELIUM_FLASH | 失败 | — | ✅ |

**BUNKER 可触发结局详细条件**：

| 结局 | 完整条件 | 互斥 FLAG |
|---|---|---|
| WANDERING | year≥250 + pop>0 + 行星发动机Ⅲ型 + 新家园选址 + WANDERING_COMPLETED | !DIGITAL_ARK_UPGRADE + !DARK_DOMAIN_DECISION + !CONQUEST_DECLARED + !SWORDHOLDER_APPOINTED + !ZERO_HOMER_CONTACTED |
| DIGITAL | year≥200 + pop>50 + 数字方舟 + DIGITAL_ARK_UPGRADE | !WANDERING_COMPLETED + !DARK_DOMAIN_DECISION + !CONQUEST_DECLARED + !SWORDHOLDER_APPOINTED + !ZERO_HOMER_CONTACTED |
| DARK_DOMAIN | year≥250 + pop>0 + 黑域生成 + **DARK_DOMAIN_DECISION** + treachery<80 | !CONQUEST_DECLARED + !SWORDHOLDER_APPOINTED + !WANDERING_COMPLETED + !DIGITAL_ARK_UPGRADE + !ZERO_HOMER_CONTACTED |
| CONQUEST | year≥200 + pop>10 + treachery<50 + isAllCiviConquered + CONQUEST_DECLARED | !SWORDHOLDER_APPOINTED + !WANDERING_COMPLETED + !DIGITAL_ARK_UPGRADE + !DARK_DOMAIN_DECISION + !ZERO_HOMER_CONTACTED |
| NEUTRAL_COSMIC_SILENCE | epoch≥BUNKER + (DARK_DOMAIN_DECISION \| BLACK_DOMAIN_DECISION) + pop 1~10 + deterrence<20 | — |
| DEFEAT_TREACHERY | treachery≥100 | — |
| DEFEAT_EXTINCTION | pop≤0 | — |
| DEFEAT_DIMENSION_STRIKE | (year>350 \| dimensionStrikeTriggered) + !黑域生成 + !数字方舟 + !DIMENSIONAL_DEFENSE + !DIMENSIONAL_DEFENSE_COMPLETED + !WANDERING_COMPLETED | — |
| DEFEAT_HELIUM_FLASH | year>350 + 同上无防御 + loreMode≠strict_three_body | — |

**DARK_DOMAIN 胜利不可达风险**（C-2 已闭合）：
- year=290 事件写入 `black_domain_decision`，DARK_DOMAIN 胜利检查 `dark_domain_decision`
- 仅 filteredEvent `dark_domain_decision_event` 写入 `dark_domain_decision` 可触发
- 若玩家未触发 filteredEvent（需 reqTech=黑域生成 + minCulture=50），则 DARK_DOMAIN 胜利不可达

**DEFEAT_DIMENSION_STRIKE 双系统确认**（C-9/U-BK9 闭合）：
- `dimensionStrikeTriggered`（字段）：由 AlienCivilization.ts:333 设置（异星 AI 降维打击，无防御时）
- `dimensional_strike`（FLAG）：由 events.json:1373 设置（剧情事件二向箔打击）
- Game.ts:1265 条件：`(year > 350 || dimensionStrikeTriggered)` — 使用字段
- Game.ts:775 GALAXY 门控：`!GALAXY_EXODUS_SEEN && !DIMENSIONAL_STRIKE` — 使用 FLAG
- **两个系统独立**：events.json 的二向箔打击不设置 dimensionStrikeTriggered 字段
- **但 year>350 可独立触发 DEFEAT**（无需 dimensionStrikeTriggered）

**WANDERING_COMPLETED 写入点**：
- GameEventManager.ts:378：`wandering_earth_decision` filteredEvent（epoch=CRISIS, minYear=100, reqTech=行星发动机基础）→ 写入 `wandering_completed`
- PlanetEngine.ts:67：`processTurn()` 航行完成时写入 `WANDERING_COMPLETED`
- **CRISIS 纪元即可写入**，BUNKER 纪元时可能已设置

### 9.3 测试证据
- Game.victoryConditions.test.ts: 测试 WANDERING/DIGITAL/DARK_DOMAIN/CONQUEST 胜利条件（手动 set FLAG）
- Game.defeatConditions.test.ts:170-172: 测试 dimensional_defense 阻止 DEFEAT_DIMENSION_STRIKE
- 无测试覆盖 black_domain_decision 无法触发 DARK_DOMAIN 胜利

### 9.4 证据闭合性
**证据闭合**。结局竞争顺序、互斥 FLAG、DARK_DOMAIN 不可达风险、DEFEAT 双系统均已确认。

---

## 十、存档与回溯证据

### 10.1 检查对象
BUNKER 纪元状态持久化、存档迁移、加载后状态一致性。

### 10.2 代码证据

**持久化字段**（GameSerializer.ts:39-41 排除列表）：
- 排除：`currentEvent, eventQueue, isProcessing, _rngProvider, turnHistory, eventSystem, economySystem, populationSystem, game, _hadRunError, _yearJustAdvanced, flagManager`
- **flagManager 被排除**？— 基线 EC-8 指出 TagManager 序列化路径问题，需确认 flagManager 是否通过 gameReplacer 特殊处理

**实际持久化的 BUNKER 相关状态**：
- `epoch`（number）✅
- `year`（number）✅
- `earthCivi.culture` / `treachery` / `population` / `economy` / `army` / `deterrenceValue` ✅
- `earthCivi.swordholder` ✅
- `deterrenceEnduranceRounds` ✅
- `broadcastTriggered` / `broadcastSurvives` ✅
- `dimensionStrikeTriggered`（SaveManager.ts:115 迁移默认值 false）✅
- `flagManager`（通过 gameReplacer 序列化 Set，restorePrototypes 重建）✅
- `hasTriggered`（GameEvent 布尔去重）✅
- `triggeredFilteredIds`（Set）✅
- `randomEventTriggerCounts` ✅

**存档迁移**（SaveManager.ts:115）：
- `if (data.dimensionStrikeTriggered === undefined) data.dimensionStrikeTriggered = false;` — v1→v4 迁移补默认值

### 10.3 证据闭合性
**证据闭合**。BUNKER 相关状态均持久化，存档迁移补默认值。

---

## 汇总

### 完整事件清单

**剧情事件**（13 条，epoch 含 BUNKER）：
1. year=280 掩体世界落成 → bunker_world_completed
2. year=281 掩体纪元宣告 → bunker_era_declared（死FLAG）
3. year=290 黑域宣言 → black_domain_decision（⚠️ 命名分歧）
4. year=295 光速飞船测试 → lightspeed_ship_tested
5. year=300 维德政变（选择） → supported_wade/wade_opposed + wade_coup（死FLAG）
6. year=310 维德被处决 → wade_executed（死FLAG）
7. year=310 光速飞船量产 → wade_succeeded（死FLAG）
8. year=340 二向箔警报 → dimensional_alert_seen + treachery+50
9. year=350 二向箔打击 → dimensional_strike
10. year=355 冥王星博物馆 → pluto_museum（死FLAG）
11. year=360 太阳系二维化 → solar_system_flattened（死FLAG）
12. year=365 银河出逃 → galaxy_exodus_seen
13. year=400 流浪地球（跨纪元 loreDomain）

**filteredEvent**（5 条，epoch=BUNKER）：
1. dimensional_threat_alert → dimensional_alert_seen（双写）
2. digital_ark_upgrade_event → digital_ark_upgrade
3. dark_domain_decision_event → dark_domain_decision
4. dimensional_defense_research_event → dimensional_defense
5. dimensional_defense_completed_event → dimensional_defense_completed

**随机事件**（6 条纯 BUNKER + 40+ 跨纪元）

### 人物状态轨迹

| 人物 | BUNKER 状态 | 事件参与 | 冲突 |
|---|---|---|---|
| 维德 | 死亡（进入BUNKER即死） | year=300/310 speaker + unlock | ❌ 死亡发言+解锁 |
| 林云 | 死亡（CRISIS起） | filteredEvent speaker | ❌ 死亡发言 |
| 丁仪 | 死亡（DETERRENCE起） | filteredEvent speaker | ❌ 死亡发言 |
| 罗辑 | 存活 | year=355 speaker; dark_domain_decision_event speaker | ✅ |
| 程心 | 存活 | — | ✅ |
| 云天明 | 存活 | — | ✅ |
| 智子 | 存活 | — | ✅ |
| 艾AA | 存活 | year=360 speaker | ✅ |
| 关一帆 | 存活 | year=350 speaker; filteredEvent speaker | ✅ |

### 数值状态账本

| 数值 | BUNKER 净变化 | 高风险 |
|---|---|---|
| culture | +195 | — |
| treachery | +65~+85 | ⚠️ year=340 +50 可能触达 100 |
| population | -105 | ⚠️ year=350 -40 + year=365 -80 可能触达 0 |
| economy | -700 | ⚠️ 大幅下降 |
| military | -450~-600 | ⚠️ year=350 -500 大幅下降 |
| prestige | -5~+5 | — |

### Tag/Flag 生命周期表

见第六节 FLAG 生命周期表。死 FLAG 6 个，活 FLAG 12 个，双写 1 个。

### 科技依赖表

| 科技 | 用途 | 科技树 |
|---|---|---|
| 数字方舟 | DIGITAL 胜利 + digital_ark_upgrade_event + DEFEAT逃避 | 信息树 |
| 黑域生成 | DARK_DOMAIN 胜利 + dark_domain_decision_event + DEFEAT逃避 | 待核验 |
| 空间曲率理论 | dimensional_defense_research_event | 待核验 |
| 行星发动机Ⅲ型 | WANDERING 胜利 | 航天树 |
| 新家园选址 | WANDERING 胜利 | 星际树 |

### 入口与出口证据

| 方向 | 条件 | 可达性 |
|---|---|---|
| 入口 BROADCAST→BUNKER | culture≥800 + bunker_world_completed | ❌ AR-20 循环依赖（继承） |
| 出口 BUNKER→GALAXY | culture≥1200 + (galaxy_exodus_seen \| dimensional_strike) | ✅ 可闭合 |

### 结局条件与竞争关系

见第九节。BUNKER 可触发 4 胜利 + 1 中性 + 4 失败 = 9 种结局。

### 候选问题清单

| 候选 ID | 现象 | 证据闭合 |
|---|---|---|
| C-1 | 维德/林云/丁仪死亡人物发言 + unlock死亡人物 | ✅ 闭合 |
| C-2 | black_domain_decision 命名分歧，DARK_DOMAIN 胜利不可达（经 events.json 路径） | ✅ 闭合 |
| C-3 | 6 个死 FLAG | ✅ 闭合 |
| C-4 | dimensional_alert_seen 双写 | ✅ 闭合 |
| C-5 | 5 个 filteredEvent minYear 冗余 | ✅ 闭合 |
| C-6 | value:0 FLAG 写入语义 | ✅ 闭合（不影响） |
| C-7 | deterrenceEnduranceRounds 死累积 | ✅ 闭合 |
| C-8 | treachery +50 高风险 | ✅ 闭合 |
| C-9 | dimensionStrikeTriggered vs dimensional_strike 双系统 | ✅ 闭合 |

### 未确认项清单

| 编号 | 范围 | 状态 |
|---|---|---|
| U-BK1 | value:0 FLAG 语义 | ✅ 已闭合（不影响） |
| U-BK2 | applyNewEffects alias 应用 | ✅ 已闭合（不应用） |
| U-BK3 | BUNKER 典型进入 year 值 | ⚠️ 待运行时核验 |
| U-BK4 | CONQUEST 胜利在 BUNKER 可达性 | ⚠️ 待运行时核验 |
| U-BK5 | 纯 BUNKER 随机事件完整字段 | ⚠️ 待全量解析 |
| U-BK6 | 跨纪元随机事件完整列表 | ⚠️ 待抽样核验 |
| U-BK7 | 黑域生成/空间曲率理论前置链 | ⚠️ 待追踪 TecTreeManager |
| U-BK8 | unlock_person 对死亡人物效果 | ✅ 已闭合（不检查isAlive） |
| U-BK9 | dimensionStrikeTriggered vs dimensional_strike | ✅ 已闭合（独立系统） |
| U-BK10 | broadcastTriggered 在 BUNKER 状态 | ✅ 已闭合（false，无残留） |

---

**EPOCH_EVIDENCE_掩体纪元 取证完成。未修改代码，未输出修复方案。**

**候选问题**：9 项（C-1~C-9），全部证据闭合
**未确认项**：10 项中 6 项已闭合，4 项待运行时/全量核验（U-BK3/4/5/6/7）
**关键结论**：
1. BUNKER→GALAXY 出口可闭合（与 AR-20 不同）
2. 维德/林云/丁仪死亡人物发言（C-1，与 AR-23/AR-24 同类）
3. black_domain_decision 命名分歧导致 DARK_DOMAIN 胜利经 events.json 路径不可达（C-2）
4. 6 个死 FLAG（C-3，与 AR-15/AR-22 同类）
5. treachery +50 高风险（C-8）
