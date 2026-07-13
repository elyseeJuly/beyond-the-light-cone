# `EPOCH_EVIDENCE_银河纪元`

> 纪元：银河纪元（GALAXY, epoch=5）
> 阶段：完整取证（补齐证据，未输出最终报告，未修改代码）
> 证据截止：20260712
> 模型引用：EPOCH_AUDIT_MODEL_银河纪元

---

## 一、纪元入口证据

**检查对象**：GALAXY 纪元（epoch=5）入口门控条件、入口处理逻辑、入口可达性

**设计证据**：
- epochs.json 行 7：`{ epoch: 5, name: "银河纪元", minCulture: 1200, maxCulture: 2499 }`
- timeline.json 行 32-37：银河纪元/黑域纪元合并条目，gameYearRange [351,999]
- 基线 5.2：入口门控 FLAG 为 GALAXY_EXODUS_SEEN 或 DIMENSIONAL_STRIKE

**代码证据**：
- Game.ts:775：`if (matched.epoch === EpochType.GALAXY && (!this.flagManager.isSet(FLAG.GALAXY_EXODUS_SEEN) && !this.flagManager.isSet(FLAG.DIMENSIONAL_STRIKE))) allowed = false;`
- Game.ts:779-786：防回退 + 停滞警告（EPOCH_STALLED）
- Game.ts:789-915：入口处理 15 步（见基线 2.3），GALAXY 无独有回调（对比 STARDUST 在 CG 回调中 culture+300）
- Game.ts:798-810：资产包下载 `epochEraKeyMap[5]='galaxy_era'`，`downloadEraPack('galaxy_era')`
- Game.ts:826-847：设置 `galaxy_era_deep` Tag 强度 100，移除非当前纪元 Tag
- Game.ts:854-862：`epochCGMap[5]='event_galaxy_era'`，文案"太阳系终遭降维打击..."
- Game.ts:904：`if (this.epoch === 5) StatisticsManager.recordEventTrigger("event_galaxy_exodus")`

**入口 FLAG 写入点**：
- `galaxy_exodus_seen`：events.json:1475（BUNKER year=365 事件 effects）+ GameEventManager.ts:558-562（filteredEvent `galaxy_era_exodus` choice A/B）
- `dimensional_strike`：events.json:1373（BUNKER year=350 事件 effects）

**测试证据**：
- Game.victoryConditions.test.ts:132,290：`game.addFlag("galaxy_exodus_seen")` 用于 HIDDEN 结局测试
- Autoplay500.test.ts:205：`game.addFlag('galaxy_exodus_seen')` 用于自动化测试

**正常路径**：
```
BUNKER year=365 事件 → galaxy_exodus_seen 写入
→ culture≥1200（GALAXY minCulture）
→ Game.ts:775 门控通过（galaxy_exodus_seen 已设置）
→ 推进 GALAXY
```

**异常路径**：
1. **灾变旁路入口**：若 galaxy_exodus_seen 未设置但 dimensional_strike 已设置（BUNKER year=350 事件），仍可通过门控进入 GALAXY。但 year≥370 > 350 会触发 DEFEAT 兜底（除非有逃生科技/FLAG）
2. **停滞警告**：若 culture≥1200 但两个 FLAG 均未设置，设置 EPOCH_STALLED，不推进

**证据闭合性**：✅ 闭合。入口门控逻辑、FLAG 写入点、入口处理均已确认。

---

## 二、时间线与内部阶段证据

**检查对象**：GALAXY 纪元内部时间线、事件年份分布、阶段划分

**设计证据**：
- timeline.json 行 32-37：gameYearRange [351,999]，"银河纪元/黑域纪元"合并
- timeline.json 描述："程心与艾AA乘坐唯一的光速飞船星环号逃离二维化，到达冥王星外与关一帆相遇。误入黑域导致时间跨越一千八百九十万年，最终进入云天明留下的小宇宙。"

**代码证据**：
- events.json 中 5 条 epoch=GALAXY 事件，年份分布：

| 事件 | name(年份) | 行号 | talker | triggerCondition | effects |
|---|---|---|---|---|---|
| 银河纪元宣告 | 370 | 1611-1636 | 星环号舰长 | epoch:GALAXY, minYear:370, reqFlag:galaxy_exodus_seen | flag:galaxy_era_declared + culture+60 |
| 流浪地球计划 | 400 | 1493-1507 | 联合政府 | loreDomain:liu_cixin_crossover, epoch:BROADCAST,BUNKER,GALAXY, minYear:400 | eventeffect:7（无 effects 数组） |
| 归零者播报 | 400 | 1508-1532 | 归零者播报 | epoch:GALAXY, minYear:400 | flag:zero_homer_contacted + culture+100 |
| 小宇宙对接 | 405 | 1533-1563 | 星环号科学官 | epoch:GALAXY, minYear:405, reqFlag:galaxy_exodus_seen | flag:mini_universe_built + culture+80 + deterrenceValue+10 |
| 星屑纪元宣告 | 420 | 1637-1662 | 关一帆 | epoch:GALAXY, minYear:420, reqFlag:galaxy_exodus_seen | flag:stardust_era_declared + culture+100 |

- **年份错位**（BC-2 同类）：timeline.json 起点 351 vs events.json 最早 370，gap 19 年无 GALAXY 剧情事件
- **年份顺序**：370→400→400→405→420，year=400 存在两条事件（流浪地球联动 + 归零者播报），但流浪地球事件需 loreDomain=liu_cixin_crossover

**内部阶段**：
| 阶段 | 年份 | 关键事件 |
|---|---|---|
| 银河启航 | 370~399 | 银河纪元宣告 + filteredEvent 群（galaxy_era_exodus/alien_civilization_diplomacy/great_filter_confrontation/reunion_homeworld） |
| 归零者接触 | 400~404 | 归零者播报 + filteredEvent zero_homer_contact_event |
| 小宇宙建造 | 405~419 | 小宇宙对接 + filteredEvent mini_universe_build_event |
| 星屑过渡 | 420+ | 星屑纪元宣告 → 推进 STARDUST |

**测试证据**：无专门测试覆盖 GALAXY 事件年份顺序

**异常路径**：
1. year=400 两条事件竞争（流浪地球联动需 loreDomain 配置）
2. filteredEvent minYear（200~350）远低于 GALAXY 起始 year（≥370），minYear 约束冗余

**证据闭合性**：✅ 闭合

---

## 三、人物状态证据

**检查对象**：GALAXY 纪元人物存活/死亡状态、死亡时机、speaker 一致性

**设计证据**：
- persons.json：35 人，仅含属性数值，无存活/死亡/纪元字段
- epochDeathMap（GameEventManager.ts:937-991）：硬编码死亡表

**代码证据**：
- Game.ts:699-706：每回合遍历人物，`!isPersonAliveInEpoch(p.name, currentEpochStr)` 时 `p.isAlive=false`
- Game.ts:708-712：死亡时清除 swordholder 和 wallfacers
- GameEventManager.ts:937-991：`isPersonAliveInEpoch` 查询 epochDeathMap

**GALAXY 死亡人物（33 人）**：

| 死亡时机 | 人物 | epochDeathMap |
|---|---|---|
| GALAXY 新增死亡（2人） | 罗辑、刘慈欣 | 仅含 ["GALAXY"] |
| 继承死亡（31人） | 维德、伊文斯、林云、泰勒、雷迪亚兹、希恩斯、章北海、丁仪、庄颜、叶文洁、汪淼、大史、常伟思、东方延绪、杨冬、雷志成、杨卫宁、山杉惠子、伊依、霍金、沈渊、水娃、严井、白冰、苗福全、华华、滑膛、朱汉扬 | 含 GALAXY 且更早纪元已死亡 |

**GALAXY 存活人物（5 人）**：程心、云天明、智子、艾AA、关一帆（epochDeathMap 为空数组 `[]`）

**speaker 一致性审计**：

| 事件 | speaker | GALAXY 存活？ | 问题 |
|---|---|---|---|
| events.json year=370 | 星环号舰长 | 非核心人物 | ✅ 无问题 |
| events.json year=400 归零者播报 | 归零者播报 | 非核心人物 | ✅ 无问题 |
| events.json year=400 流浪地球 | 联合政府 | 非核心人物 | ✅ 无问题 |
| events.json year=405 | 星环号科学官 | 非核心人物 | ✅ 无问题 |
| events.json year=420 | 关一帆 | ✅ 存活 | ✅ 无问题 |
| filteredEvent galaxy_era_exodus | 云天明、程心 | ✅ 均存活 | ✅ 无问题 |
| filteredEvent alien_civilization_diplomacy | 关一帆、云天明 | ✅ 均存活 | ✅ 无问题 |
| filteredEvent reunion_homeworld | 程心、云天明 | ✅ 均存活 | ✅ 无问题 |
| filteredEvent great_filter_confrontation | 智子、**罗辑** | ⚠️ 罗辑死亡 | **AR-27 同类问题** |
| filteredEvent zero_homer_contact_event | 关一帆、云天明 | ✅ 均存活 | ✅ 无问题 |
| filteredEvent mini_universe_build_event | 程心、云天明 | ✅ 均存活 | ✅ 无问题 |

**关键发现**：
1. `great_filter_confrontation`（GameEventManager.ts:612）以罗辑为 speaker，但罗辑在 GALAXY 死亡
2. filteredEvent 通过 `getFilteredEventsForTurn()`（GameEventManager.ts:723-742）分发，**不经过** `isEventCharactersUnlocked` 检查
3. `isEventCharactersUnlocked`（GameEventManager.ts:994-1033）检查 `e.dialogNodes`，但 filteredEvent 使用 `dialogQueue`（不同属性），即使调用也跳过检查
4. **刘慈欣在 GALAXY 死亡**（epochDeathMap["刘慈欣"]=["GALAXY"]），与 BUNKER 报告"存活"描述不符（BUNKER 报告第七节列"刘慈欣存活"）

**swordholder 清除逻辑**：
- Game.ts:710-712：`if (this.earthCivi.swordholder === p.name) { this.earthCivi.swordholder = null; }`
- 罗辑路线 swordholder="罗辑"进入 GALAXY → 罗辑死亡 → swordholder=null
- swordholder=null 后 deterrenceEnduranceRounds 不再累积（Game.ts:651 else 分支 reset 为 0）
- **AR-31 死累积问题在 GALAXY 自然消解**

**测试证据**：无测试覆盖 GALAXY 纪元 speaker 存活一致性

**证据闭合性**：✅ 闭合

---

## 四、事件资格与触发证据

**检查对象**：GALAXY 纪元事件触发条件、去重机制、分发链路

**设计证据**：
- events.json：剧情事件用 `hasTriggered` 布尔去重
- GameEventManager.ts:324-720：filteredEvent 用 `triggeredFilteredIds: Set` 去重
- randomevents.json：随机事件用 `randomEventTriggerCounts` + `maxTriggers` 去重

**代码证据**：

### 4.1 剧情事件分发（checkEvents, GameEventManager.ts:913-935）
- 遍历 `this.events`，检查 `!hasTriggered && currentYear >= e.inYear`
- 检查 `triggerCondition`（通过 `checkFilterConditions`）
- **不调用 `isEventCharactersUnlocked`** —— 剧情事件不检查 speaker 存活

### 4.2 过滤事件分发（getFilteredEventsForTurn, GameEventManager.ts:723-742）
- 遍历 `this.filteredEvents`，检查 `triggeredFilteredIds`（含冷却）
- 检查 `condition`（通过 `checkFilterConditions`）
- **不调用 `isEventCharactersUnlocked`** —— 过滤事件不检查 speaker 存活

### 4.3 随机事件分发（checkRandomEvents, GameEventManager.ts:1035-1080）
- 遍历 `this.randomEvents`，检查 `isEventEligible`
- **调用 `isEventCharactersUnlocked`**（行 1047）—— 随机事件检查 speaker 存活
- 检查 `triggerCondition`（通过 `checkFilterConditions`）

### 4.4 GALAXY filteredEvent 触发条件详表

| id | minYear | epoch | reqFlag | reqNotFlag | minCulture | minDeterrence | reqTech |
|---|---|---|---|---|---|---|---|
| galaxy_era_exodus | 220 | GALAXY | - | galaxy_exodus_seen | - | - | - |
| alien_civilization_diplomacy | 200 | GALAXY | - | alien_diplomacy_seen | 60 | - | - |
| reunion_homeworld | 280 | GALAXY | galaxy_exodus_seen | - | 80 | - | - |
| great_filter_confrontation | 260 | GALAXY | galaxy_exodus_seen | - | - | 70 | - |
| zero_homer_contact_event | 300 | GALAXY | - | zero_homer_contacted | 80 | 50 | - |
| mini_universe_build_event | 350 | GALAXY | zero_homer_contacted | mini_universe_built | 90 | - | 宇宙重启理论 |

### 4.5 触发顺序分析
- GALAXY 起始 year≥370（从 BUNKER 推进）
- filteredEvent minYear（200~350）均 < 370，约束冗余（AR-30 同类）
- **filteredEvent 之间无显式顺序约束**，同回合多个 filteredEvent 可同时满足条件
- events.json 事件按 year 严格排序（370→400→405→420）

### 4.6 双写路径分析

| FLAG | events.json 写入 | filteredEvent 写入 | 冲突风险 |
|---|---|---|---|
| galaxy_exodus_seen | BUNKER year=365 | galaxy_era_exodus | 低（BUNKER 事件先触发，filteredEvent reqNotFlag 自锁） |
| zero_homer_contacted | GALAXY year=400 | zero_homer_contact_event | 低（events.json 按 year 触发，filteredEvent reqNotFlag 自锁） |
| mini_universe_built | GALAXY year=405 | mini_universe_build_event | 低（同上） |

**测试证据**：无测试覆盖 GALAXY filteredEvent 触发条件

**异常路径**：
1. filteredEvent `great_filter_confrontation` 需 minDeterrence=70，若玩家 deterrenceValue<70 则永不触发
2. filteredEvent `mini_universe_build_event` 需 reqTech="宇宙重启理论"，若科技未完成则永不触发
3. events.json year=400 流浪地球事件需 loreDomain=liu_cixin_crossover，若 loreMode=strict_three_body 则不触发

**证据闭合性**：✅ 闭合

---

## 五、数值变化证据

**检查对象**：GALAXY 纪元期间 culture/treachery/population/economy/military/prestige/deterrenceValue 变化

**代码证据**：

### 5.1 culture 变化

| 来源 | 变化量 | 触发条件 |
|---|---|---|
| events.json year=370 | +60 | galaxy_exodus_seen |
| events.json year=400 归零者播报 | +100 | epoch=GALAXY, minYear=400 |
| events.json year=405 小宇宙对接 | +80 | galaxy_exodus_seen |
| events.json year=420 星屑纪元宣告 | +100 | galaxy_exodus_seen |
| filteredEvent galaxy_era_exodus choice A | +30 | - |
| filteredEvent alien_civilization_diplomacy choice A | +40 | minCulture=60 |
| filteredEvent reunion_homeworld choice A | +50 | - |
| filteredEvent zero_homer_contact_event choice A | +100 | - |
| filteredEvent mini_universe_build_event choice A | +150 | - |
| 每回合自然增长 | 公式待确认 | 基线:2 + social×0.10（project_memory 调整后） |

**GALAXY 期间 culture 总增长估算**（仅事件）：
- 最低（仅 events.json）：+60+100+80+100 = +340
- 最高（events.json + filteredEvent choice A）：+340+30+40+50+100+150 = +710
- GALAXY 需从 1200 增长到 2500（差 1300），仅靠事件不够，需依赖每回合自然增长

### 5.2 treachery 变化
- GALAXY 事件无显式 treachery 变化
- 继承 BUNKER year=340 +50 风险（UC-14）
- DEFEAT_TREACHERY 阈值 treachery≥100

### 5.3 deterrenceValue 变化
- events.json year=405：+10
- filteredEvent great_filter_confrontation 需 minDeterrence=70 才能触发
- HIDDEN 结局需 deterrenceValue≥50

### 5.4 population 变化
- GALAXY 事件无显式 population 变化
- ETERNAL_EXILE 需 0<pop≤5
- EXTINCTION 需 pop≤0
- HIDDEN 需 pop>0

### 5.5 economy/military/prestige 变化
- filteredEvent 各 choice 有 economy/military/prestige 增减
- 无 GALAXY 独有的数值阈值

**测试证据**：无测试覆盖 GALAXY 数值变化

**异常路径**：
1. culture 增长不足以达到 STARDUST 阈值 2500（U-G3 待运行时验证）
2. treachery 跨纪元累积可能触发 DEFEAT_TREACHERY（UC-14 继承）

**证据闭合性**：⚠️ 部分闭合。culture 每回合自然增长速率未确认（U-G3）

---

## 六、Tag/Flag 生命周期证据

**检查对象**：GALAXY 纪元期间 FLAG 写入/读取/清除、Tag 设置/移除

**代码证据**：

### 6.1 FLAG 生命周期

| FLAG | 写入点 | 读取点 | 死/活 |
|---|---|---|---|
| galaxy_exodus_seen | events.json:1475 + GameEventManager.ts:558 | Game.ts:775/933/1183; events.json:1561/1634/1660; GameEventManager.ts:586/614 | 活 |
| dimensional_strike | events.json:1373 | Game.ts:775 | 活（仅门控） |
| zero_homer_contacted | events.json:1520 + GameEventManager.ts:674 | Game.ts:776/937; GameEventManager.ts:686 | 活 |
| mini_universe_built | events.json:1545 + GameEventManager.ts:691 | Game.ts:938; GameEventManager.ts:687 | 活 |
| alien_alliance | GameEventManager.ts:574 | Game.ts:935 | 活（唯一写入点） |
| stardust_era_declared | events.json:1649 | Game.ts:776 | 活 |
| alien_diplomacy_seen | GameEventManager.ts:574/575 | GameEventManager.ts:572（自锁） | 活（自锁去重） |
| **galaxy_era_declared** | events.json:1623 | **无** | **死FLAG** |
| **return_to_home** | GameEventManager.ts:588 | **无** | **死FLAG** |
| **cautious_return** | GameEventManager.ts:589 | **无** | **死FLAG** |
| **great_filter_silence** | GameEventManager.ts:616 | **无** | **死FLAG** |
| **great_filter_contact** | GameEventManager.ts:617 | **无** | **死FLAG** |

**死 FLAG 统计**：5 个（galaxy_era_declared / return_to_home / cautious_return / great_filter_silence / great_filter_contact）

### 6.2 FLAG_ALIAS_MAP（GameEventManager.ts:781-798）
- `galaxy_exodus_successful` → `galaxy_exodus_seen`（行 795）
- `dimensional_strike_imminent` → `dimensional_alert_seen`（行 793，注意：指向 dimensional_alert_seen 而非 dimensional_strike）
- **仅用于读取侧**（reqFlag/reqNotFlag），不用于写入侧（EventSystem.applyNewEffects 不应用 alias）

### 6.3 Tag 生命周期
- 入口设置：`galaxy_era_deep`（TagManager.ts:77，milestone=true 不衰减）
- 入口移除：循环 `epochTagMap` 移除非当前纪元 Tag（Game.ts:840-846）
- 每回合 `decayTags`（Game.ts:512）：milestone Tag 不衰减

### 6.4 FLAG 跨纪元行为
- 旧纪元 FLAG **不清理**，永久保留（基线 2.4）
- GALAXY 写入的 FLAG 全部累积进入 STARDUST
- **AR-5（FLAG 永久累积）持续**：GALAXY 写入 11 个 FLAG（5 死 + 6 活），累积持续增长

**测试证据**：无测试覆盖 GALAXY FLAG 生命周期

**证据闭合性**：✅ 闭合

---

## 七、科技条件证据

**检查对象**：GALAXY 纪元结局科技条件、前置链、科技树结构

**代码证据**：

### 7.1 GALAXY 结局科技条件

| 结局 | 科技要求 | 代码位置 |
|---|---|---|
| HIDDEN | 黑域生成 + 数字方舟 | Game.ts:939-940 |
| WANDERING | 行星发动机Ⅲ型 + 新家园选址 | Game.ts:966-967 |
| DIGITAL | 数字方舟 | Game.ts:993 |
| DARK_DOMAIN | 黑域生成 | Game.ts:1069 |
| mini_universe_build_event | 宇宙重启理论 | GameEventManager.ts:687 |

### 7.2 科技前置链

| 科技 | 树 | 完整前置链 | 行号 |
|---|---|---|---|
| 黑域生成 | INTERSTELLAR | 宇宙社会学→安全声明理论→黑域生成 | TecTreeManager.ts:149 |
| 数字方舟 | INFORMATION | 数字文明→数字生命研究→意识上传→数字方舟 | TecTreeManager.ts:131 |
| 新家园选址 | INTERSTELLAR | 流浪地球计划→新家园选址 | TecTreeManager.ts:154 |
| 行星发动机Ⅲ型 | AEROSPACE | 核聚变推进→重元素聚变→行星发动机Ⅰ型→Ⅱ型→Ⅲ型 | TecTreeManager.ts:66 |
| 曲率驱动理论 | PHYSICS | 维度物理→曲率驱动理论 | TecTreeManager.ts:42 |
| 宇宙重启理论 | INTERSTELLAR | 归零者研究→宇宙重启理论 | TecTreeManager.ts:157 |

### 7.3 科技树结构确认
- 5 棵树：物理21/航天33/军事13/信息15/星际12（基线 3.4）
- `addProgress`（TecTreeManager.ts:179）检查 `parentName` 前置完成
- **无 GALAXY 独有科技节点**（无 epoch/era 限制字段）
- 所有结局科技均可在更早纪元开始研究

### 7.4 DEFEAT 兜底逃生科技
- 黑域生成 完成 → 豁免
- 数字方舟 完成 → 豁免
- DIMENSIONAL_DEFENSE FLAG → 豁免
- DIMENSIONAL_DEFENSE_COMPLETED FLAG → 豁免
- WANDERING_COMPLETED FLAG → 豁免

**关键发现**：HIDDEN 结局需要黑域生成+数字方舟，这两个科技也是 DEFEAT 兜底逃生路径。因此走 HIDDEN 路线的玩家，科技完成后 DEFEAT 兜底不会触发。

**测试证据**：Game.victoryConditions.test.ts 测试覆盖 HIDDEN 结局科技条件

**证据闭合性**：✅ 闭合

---

## 八、纪元出口证据

**检查对象**：GALAXY→STARDUST 推进条件、出口处理、FLAG 传递

**代码证据**：

### 8.1 正常推进出口
- Game.ts:776：`if (matched.epoch === EpochType.STARDUST && !this.flagManager.isSet(FLAG.STARDUST_ERA_DECLARED) && !this.flagManager.isSet(FLAG.STARDUST_ERA_SEEN) && !this.flagManager.isSet(FLAG.ZERO_HOMER_CONTACTED)) allowed = false;`
- culture≥2500（epochs.json STARDUST minCulture=2500）
- 三个 FLAG（OR 关系）：STARDUST_ERA_DECLARED / STARDUST_ERA_SEEN / ZERO_HOMER_CONTACTED

### 8.2 出口 FLAG 写入点
- `stardust_era_declared`：events.json:1649（GALAXY year=420）
- `zero_homer_contacted`：events.json:1520（GALAXY year=400）+ GameEventManager.ts:674（filteredEvent）
- `stardust_era_seen`：**无写入点**（全量 Grep 未找到写入位置）

### 8.3 STARDUST 入口特殊处理（Game.ts:889-895）
```ts
if (this.epoch === EpochType.STARDUST) {
  this.addFlag(FLAG.STARDUST_ERA_ACTIVE);
  this.earthCivi.culture += 300;
  this.addHistory("【星屑遗泽】...");
}
```

### 8.4 出口传递状态
- epoch → 6（STARDUST）
- year → 不变
- culture → 不变（STARDUST CG 回调 +300）
- FLAG.* → 全量累积（不清理）
- Tag → galaxy_era_deep 移除，stardust_era_deep 设置

**异常路径**：
1. **culture 不足**：GALAXY 事件 culture 增长 +340~710，需从 1200 到 2500（差 1300），可能不足（U-G3）
2. **stardust_era_seen 无写入点**：STARDUST 门控三个 FLAG 中 stardust_era_seen 无写入位置，实际仅 stardust_era_declared 和 zero_homer_contacted 可用

**测试证据**：无测试覆盖 GALAXY→STARDUST 推进

**证据闭合性**：✅ 闭合（stardust_era_seen 无写入点不影响出口，因 zero_homer_contacted 在 year=400 必然写入）

---

## 九、结局逻辑证据

**检查对象**：GALAXY 纪元可触发结局、判定顺序、竞争关系

**代码证据**：

### 9.1 checkVictoryConditions 判定顺序（Game.ts:1089-1310）

| 顺序 | 行号 | 判定 | GALAXY 可触发 |
|---|---|---|---|
| 0 | 1091-1093 | 自动打 CONQUEST_DECLARED（若 isAllCiviConquered） | ✅ 前置打标 |
| 1 | 1096-1147 | broadcastTriggered 分支（HIDDEN/EXTINCTION） | ✅ |
| 2 | 1149-1179 | 遍历 getVictoryConditions()（HIDDEN→WANDERING→DIGITAL→DETERRENCE→CONQUEST→DARK_DOMAIN） | ✅（DETERRENCE 被 allowedEras 过滤） |
| 3 | 1183-1198 | ETERNAL_EXILE（中性，GALAXY 专属） | ✅ |
| 4 | 1201-1217 | COSMIC_SILENCE（中性） | ✅ |
| 5 | 1219-1232 | DEFEAT_TREACHERY | ✅ |
| 6 | 1234-1263 | DEFEAT_EXTINCTION | ✅ |
| 7 | 1265-1309 | DEFEAT_DIMENSION_STRIKE / HELIUM_FLASH | ✅ |

### 9.2 胜利结局竞争关系

| 结局 | 顺序 | 互斥 FLAG | 关键条件 |
|---|---|---|---|
| HIDDEN | 1 | 无互斥（要求 zero_homer_contacted） | 4 FLAG + 2 科技 + culture≥1000 + year≥350 + pop>0 + deterrence≥50 |
| WANDERING | 2 | !digital_ark_upgrade, !dark_domain_decision, !conquest_declared, !swordholder_appointed, !zero_homer_contacted | 行星发动机Ⅲ型 + 新家园选址 + wandering_completed |
| DIGITAL | 3 | !wandering_completed, !dark_domain_decision, !conquest_declared, !swordholder_appointed, !zero_homer_contacted | 数字方舟 + digital_ark_upgrade |
| CONQUEST | 5 | !swordholder_appointed, !wandering_completed, !digital_ark_upgrade, !dark_domain_decision, !zero_homer_contacted | conquest_declared + isAllCiviConquered |
| DARK_DOMAIN | 6 | !conquest_declared, !swordholder_appointed, !wandering_completed, !digital_ark_upgrade, !zero_homer_contacted | 黑域生成 + dark_domain_decision + treachery<80 |

**互斥关键**：`ZERO_HOMER_CONTACTED` 一旦设置，除 HIDDEN 外其他 4 条胜利路径全部被锁死。

### 9.3 中性结局

| 结局 | 条件 | 行号 |
|---|---|---|
| ETERNAL_EXILE | epoch≥GALAXY + galaxy_exodus_seen + 0<pop≤5 + !wandering_completed + !digital_ark_upgrade | 1183-1198 |
| COSMIC_SILENCE | epoch≥BUNKER + (dark_domain_decision 或 black_domain_decision) + 0<pop≤10 + deterrence<20 | 1201-1217 |

### 9.4 DEFEAT 兜底（Game.ts:1265-1270）
```ts
if ((this.year > 350 || this.dimensionStrikeTriggered) &&
    !isTecFinishedAnywhere("黑域生成") &&
    !isTecFinishedAnywhere("数字方舟") &&
    !hasFlag(DIMENSIONAL_DEFENSE) &&
    !hasFlag(DIMENSIONAL_DEFENSE_COMPLETED) &&
    !hasFlag(WANDERING_COMPLETED))
```

**GALAXY 特殊风险**：
- GALAXY year≥370 > 350 → DEFEAT 条件 `year>350` 必然满足
- 除非有逃生科技/FLAG（黑域生成/数字方舟/dimensional_defense/dimensional_defense_completed/wandering_completed）
- 走 HIDDEN 路线的玩家（需黑域生成+数字方舟）自然豁免 DEFEAT 兜底
- **走非 HIDDEN 路线的玩家**（如 ETERNAL_EXILE）若无逃生科技，会被 DEFEAT 兜底截断

### 9.5 HIDDEN 结局可达性分析
- HIDDEN 在判定顺序中排第 1（胜利结局中最先）
- HIDDEN 条件：year≥350 + culture≥1000 + 4 FLAG + 2 科技 + pop>0 + deterrence≥50
- **DEFEAT 兜底在 HIDDEN 之后判定**，若 HIDDEN 条件满足会先 return
- HIDDEN 所需的 2 科技（黑域生成+数字方舟）也是 DEFEAT 逃生路径
- **结论**：HIDDEN 不可达的风险极低，只要条件满足即可触发，DEFEAT 不会抢先

**测试证据**：
- Game.victoryConditions.test.ts:280-300 测试 HIDDEN 结局
- Game.defeatConditions.test.ts:77,171 测试 DEFEAT_DIMENSION_STRIKE

**证据闭合性**：✅ 闭合

---

## 十、存档与回溯证据

**检查对象**：GALAXY 纪元状态持久化、存档/读档一致性

**代码证据**：

### 10.1 持久化字段
- epoch（number）：✅ 持久化
- year（number）：✅ 持久化
- earthCivi.culture：✅ 持久化
- earthCivi.population/economy/military/prestige/treachery/deterrenceValue/resource：✅ 持久化
- earthCivi.swordholder：✅ 持久化（罗辑死亡后为 null）
- deterrenceEnduranceRounds：✅ 持久化
- dimensionStrikeTriggered：✅ 持久化（SaveManager.ts:115 迁移补丁）
- broadcastTriggered：✅ 持久化
- flagManager（Set）：✅ 持久化（gameReplacer 序列化 + restorePrototypes 重建）
- hasTriggered（事件去重）：✅ 持久化
- triggeredFilteredIds（Set）：✅ 持久化
- randomEventTriggerCounts（Map）：✅ 持久化

### 10.2 排除持久化字段（GameSerializer.ts:39-41）
- currentEvent, eventQueue, isProcessing, _rngProvider, turnHistory, eventSystem, economySystem, populationSystem, game, _hadRunError, _yearJustAdvanced, flagManager

**注意**：flagManager 在排除列表中，但通过 gameReplacer 特殊序列化（GameSerializer.ts:76-78）

### 10.3 存档版本
- SAVE_VERSION=4（SaveManager.ts）
- v1→v4 迁移逻辑存在
- dimensionStrikeTriggered 迁移补丁（SaveManager.ts:115）

### 10.4 GALAXY 特有存档风险
- 无 GALAXY 独有的存档风险
- FLAG 累积（AR-5）导致存档体积增长，但无功能影响

**测试证据**：
- SaveManager.test.ts 测试存档/读档
- Serialization.scenario.test.ts 场景测试
- SaveLoad.test.ts 集成测试

**证据闭合性**：✅ 闭合

---

## 汇总

### 完整事件清单

**剧情事件（events.json, 5 条）**：

| # | name(年份) | 行号 | talker | triggerCondition | effects |
|---|---|---|---|---|---|
| G1 | 370 | 1611-1636 | 星环号舰长 | epoch:GALAXY, minYear:370, reqFlag:galaxy_exodus_seen | galaxy_era_declared(死) + culture+60 |
| G2 | 400 | 1493-1507 | 联合政府 | loreDomain:liu_cixin_crossover, epoch:BROADCAST,BUNKER,GALAXY, minYear:400 | eventeffect:7 |
| G3 | 400 | 1508-1532 | 归零者播报 | epoch:GALAXY, minYear:400 | zero_homer_contacted + culture+100 |
| G4 | 405 | 1533-1563 | 星环号科学官 | epoch:GALAXY, minYear:405, reqFlag:galaxy_exodus_seen | mini_universe_built + culture+80 + deterrenceValue+10 |
| G5 | 420 | 1637-1662 | 关一帆 | epoch:GALAXY, minYear:420, reqFlag:galaxy_exodus_seen | stardust_era_declared + culture+100 |

**过滤事件（filteredEvent, 6 条）**：

| # | id | 行号 | minYear | reqFlag | reqNotFlag | minCulture | minDeterrence | reqTech | speakers |
|---|---|---|---|---|---|---|---|---|---|
| F1 | galaxy_era_exodus | 551-563 | 220 | - | galaxy_exodus_seen | - | - | - | 云天明、程心 |
| F2 | alien_civilization_diplomacy | 565-577 | 200 | - | alien_diplomacy_seen | 60 | - | - | 关一帆、云天明 |
| F3 | reunion_homeworld | 579-591 | 280 | galaxy_exodus_seen | - | 80 | - | - | 程心、云天明 |
| F4 | great_filter_confrontation | 607-619 | 260 | galaxy_exodus_seen | - | - | 70 | - | 智子、**罗辑(死)** |
| F5 | zero_homer_contact_event | 666-678 | 300 | - | zero_homer_contacted | 80 | 50 | - | 关一帆、云天明 |
| F6 | mini_universe_build_event | 680-692 | 350 | zero_homer_contacted | mini_universe_built | 90 | - | 宇宙重启理论 | 程心、云天明 |

**随机事件（randomevents.json, 32 条覆盖 GALAXY）**：
- 纯 GALAXY：8 条
- BUNKER,GALAXY：19 条
- BROADCAST,BUNKER,GALAXY：5 条

### 人物状态轨迹

| 人物 | 进入 GALAXY 时 | GALAXY 内变化 | swordholder 影响 |
|---|---|---|---|
| 罗辑 | 死亡（epochDeathMap 含 GALAXY） | - | swordholder 清除为 null（Game.ts:711） |
| 刘慈欣 | 死亡（epochDeathMap 含 GALAXY） | - | - |
| 维德 | 死亡（继承 BUNKER） | - | - |
| 程心 | 存活 | - | - |
| 云天明 | 存活 | - | - |
| 智子 | 存活 | - | - |
| 艾AA | 存活 | - | - |
| 关一帆 | 存活 | - | - |

### 数值状态账本

| 数值 | GALAXY 入口值 | 事件变化 | 出口需求 | 风险 |
|---|---|---|---|---|
| culture | ≥1200 | +340~710（事件）+ 每回合自然增长 | ≥2500（STARDUST） | ⚠️ 可能不足（U-G3） |
| treachery | 继承 BUNKER | 无 GALAXY 事件变化 | <100（避免 DEFEAT） | ⚠️ UC-14 继承 |
| population | 继承 BUNKER | 无 GALAXY 事件变化 | >0（HIDDEN/ETERNAL_EXILE） | 低 |
| deterrenceValue | 继承 BUNKER | +10（year=405） | ≥50（HIDDEN）/ ≥70（great_filter） | 中 |

### Tag/Flag 生命周期表

见第六节 6.1 FLAG 生命周期表。

### 科技依赖表

见第七节 7.2 科技前置链。

### 入口与出口证据

见第一节（入口）和第八节（出口）。

### 结局条件与竞争关系

见第九节。

### 候选问题清单

| 候选 ID | 问题 | 证据闭合 | 升级为正式问题 |
|---|---|---|---|
| C-1 | 罗辑死亡发言（great_filter_confrontation） | ✅ | ✅ AR-34 |
| C-2 | 5 个死 FLAG | ✅ | ✅ AR-35 |
| C-3 | zero_homer_contacted / mini_universe_built 双写 | ✅ | ✅ AR-36 |
| C-4 | HIDDEN 结局窗口 | ✅（降级：判定顺序优先+科技双重豁免） | 降级为观察项 |
| C-5 | GALAXY 入口旁路与 DEFEAT 竞态 | ✅（条件性：无逃生科技时触发） | ✅ AR-37 |
| C-6 | 刘慈欣死亡与 BUNKER 报告不符 | ✅ | ✅ AR-38 |
| C-7 | filteredEvent minYear 语义冗余 | ✅ | ✅ AR-39 |
| C-8 | dialogQueue vs dialogNodes 不匹配 | ✅ | ✅ AR-40 |
| C-9 | ALIAN_ALLIANCE 基线拼写错误 | ✅ | ✅ AR-41 |
| C-10 | galaxy_exodus_seen 双写 | ✅ | ✅ AR-36（合并） |
| C-11 | dimensionStrikeTriggered 双系统独立（AR-33 继承） | ✅ | 观察项（AR-33 已登记） |
| C-12 | 宇宙重启理论科技前置链 | ✅（已确认存在） | 降级为已确认项 |

### 未确认项清单

| 编号 | 范围 | 尚缺证据 |
|---|---|---|
| UC-15 | GALAXY 期间 culture 增长是否足够达到 2500 | 需运行时验证每回合自然增长速率 |
| UC-16 | treachery 跨纪元累积是否在 GALAXY 触发 DEFEAT_TREACHERY | 依赖 UC-14（BUNKER 末 treachery 值），需 Autoplay500 运行观察 |

---

**EPOCH_EVIDENCE_银河纪元 取证完成。未修改代码，未输出修复方案。**

**候选问题**：12 项 → 9 项正式问题（AR-34~AR-41 + AR-37）+ 3 项降级/观察
**未确认项**：2 项（UC-15, UC-16）
