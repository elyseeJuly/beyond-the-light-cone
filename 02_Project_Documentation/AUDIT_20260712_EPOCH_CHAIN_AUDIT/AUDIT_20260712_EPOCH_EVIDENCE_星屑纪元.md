# `EPOCH_EVIDENCE_星屑纪元`

> 纪元：星屑纪元（STARDUST, epoch=6）
> 阶段：完整取证（补齐证据，未输出最终报告，未修改代码）
> 证据截止：20260712
> 模型引用：EPOCH_AUDIT_MODEL_星屑纪元

---

## 一、纪元入口证据

**检查对象**：STARDUST 纪元（epoch=6）入口门控条件、入口处理逻辑、入口可达性

**设计证据**：
- epochs.json 行 8：`{ epoch: 6, name: "星屑纪元", minCulture: 2500, maxCulture: 999999 }`
- timeline.json：**无独立"星屑"条目**（仅有"银河纪元 / 黑域纪元"合并条目 [351,999]）
- 基线 5.2：入口门控 FLAG 为 STARDUST_ERA_DECLARED 或 STARDUST_ERA_SEEN 或 ZERO_HOMER_CONTACTED

**代码证据**：
- Game.ts:792：`if (matched.epoch === EpochType.STARDUST && !this.flagManager.isSet(FLAG.STARDUST_ERA_DECLARED) && !this.flagManager.isSet(FLAG.STARDUST_ERA_SEEN) && !this.flagManager.isSet(FLAG.ZERO_HOMER_CONTACTED)) allowed = false;`
- Game.ts:779-786：防回退 + 停滞警告（EPOCH_STALLED）
- Game.ts:789-915：入口处理 15 步（见基线 2.3），STARDUST 有独有 CG 回调
- Game.ts:816：资产包下载 `epochEraKeyMap[6]='stardust_era'`，`downloadEraPack('stardust_era')`
- Game.ts:826-847：设置 `stardust_era_deep` Tag 强度 100，移除非当前纪元 Tag
- Game.ts:877：`epochCGMap[6]='event_stardust_era'`，文案"大宇宙的结构在战争中进一步降维碎裂..."
- Game.ts:906-910：STARDUST 独有 CG 回调：
  ```ts
  if (this.epoch === EpochType.STARDUST) {
    this.addFlag(FLAG.STARDUST_ERA_ACTIVE);
    this.earthCivi.culture += 300;
    this.addHistory("【星屑遗泽】...");
  }
  ```

**入口 FLAG 写入点**：
- `stardust_era_declared`：events.json:1649（GALAXY year=420 事件 effects）
- `zero_homer_contacted`：events.json:1520（GALAXY year=400 事件 effects）+ GameEventManager.ts:674（filteredEvent 双写）
- `stardust_era_seen`：**无写入点**（全量 Grep 确认 0 写入）

**测试证据**：
- DesignDrift.scenario.test.ts:112：`game.flagManager.set('stardust_era_declared')` 用于设计漂移测试
- AssetDownload.scenario.test.ts:179：`'pack_stardust_era'` 资源包下载测试

**正常路径**：
```
GALAXY year=420 事件 → stardust_era_declared 写入
→ culture≥2500（STARDUST minCulture）
→ Game.ts:792 门控通过（stardust_era_declared 已设置）
→ 推进 STARDUST
→ 入口 CG 回调：STARDUST_ERA_ACTIVE + culture+300 + addHistory("【星屑遗泽】")
```

**异常路径**：
1. **culture 不足**：若 culture<2500 但 FLAG 已设置，设 EPOCH_STALLED 停滞，不推进（UC-15 继承）
2. **stardust_era_seen 旁路不可用**：stardust_era_seen 无写入点，实际仅 stardust_era_declared 和 zero_homer_contacted 可用
3. **入口 culture+300 不能帮助达到门槛**：culture+300 在门控通过后执行，不参与门控判定

**证据闭合性**：✅ 闭合。入口门控逻辑、FLAG 写入点、入口处理均已确认。

---

## 二、时间线与内部阶段证据

**检查对象**：STARDUST 纪元内部时间线、事件年份分布、阶段划分

**设计证据**：
- timeline.json：**无独立"星屑"条目**。仅有"银河纪元 / 黑域纪元"合并条目（gameYearRange [351, 999]），描述为"程心与艾AA乘坐唯一的光速飞船星环号逃离二维化..."
- Game.ts:831：`epochName === "星屑纪元" && t.epoch.includes("星屑")` 查找 timeline 条目 → **查找失败**（timeline.json 无"星屑"字样）

**代码证据**：
- events.json 中 epoch=STARDUST 事件：**0 条**
- GameEventManager.ts 中 epoch=STARDUST filteredEvent：**0 条**
- randomevents.json 中 epoch 含 STARDUST 事件：**0 条**

**内部阶段**：
| 阶段 | 年份 | 关键事件 |
|---|---|---|
| （无） | year≥420（继承 GALAXY） | 无事件 |

**STARDUST 纪元实际行为**：
1. 入口 CG 回调：culture+300 + STARDUST_ERA_ACTIVE FLAG
2. 每回合标准逻辑：资源/人口增长、异星文明威胁、事件检查（无事件可触发）
3. 每回合 checkVictoryConditions：检查 11 种结局
4. 结局触发后游戏结束

**测试证据**：无专门测试覆盖 STARDUST 纪元内部时间线

**异常路径**：
1. timeline.json 查找失败导致 STARDUST 无 timeline 描述显示（C-3）
2. 无事件导致玩家进入后无内容（C-4 设计观察）

**证据闭合性**：✅ 闭合（STARDUST 纪元确认为终局纪元，无内部事件）

---

## 三、人物状态证据

**检查对象**：STARDUST 纪元人物存活/死亡状态、死亡时机

**设计证据**：
- persons.json：35 人，仅含属性数值，无存活/死亡/纪元字段
- epochDeathMap（GameEventManager.ts:937-991）：硬编码死亡表

**代码证据**：
- Game.ts:699-706：每回合遍历人物，`!isPersonAliveInEpoch(p.name, currentEpochStr)` 时 `p.isAlive=false`
- GameEventManager.ts:937-991：`isPersonAliveInEpoch` 查询 epochDeathMap
- epochNames 数组（GameEventManager.ts:1006）：`["GOLDEN", "CRISIS", "DETERRENCE", "BROADCAST", "BUNKER", "GALAXY", "STARDUST"]`

**STARDUST 死亡人物**：
- **新增死亡：0 人**。epochDeathMap 中所有人物的死亡数组都不含 "STARDUST"。
- **继承死亡：33 人**。罗辑、刘慈欣、维德、伊文斯、林云、泰勒、雷迪亚兹、希恩斯、章北海、丁仪、庄颜、叶文洁、汪淼、大史、常伟思、东方延绪、杨冬、雷志成、杨卫宁、山杉惠子、伊依、霍金、沈渊、水娃、严井、白冰、苗福全、华华、滑膛、朱汉扬等。

**STARDUST 存活人物（5 人）**：程心、云天明、智子、艾AA、关一帆（epochDeathMap 为空数组 `[]`，继承 GALAXY）

**swordholder 状态**：
- 罗辑路线 swordholder 在 GALAXY 已被清除为 null（Game.ts:711，罗辑死亡时清除）
- STARDUST 中 swordholder=null → deterrenceEnduranceRounds 不再累积（Game.ts:667 else 分支 reset 为 0）
- AR-31 死累积问题在 STARDUST 自然消解（继承 GALAXY）

**speaker 一致性审计**：
- STARDUST 纪元无事件 → 无 speaker → 无 speaker 一致性问题

**测试证据**：无测试覆盖 STARDUST 纪元人物状态

**证据闭合性**：✅ 闭合

---

## 四、事件资格与触发证据

**检查对象**：STARDUST 纪元事件触发条件、去重机制、分发链路

**设计证据**：
- events.json：0 条 epoch=STARDUST 事件
- GameEventManager.ts：0 条 epoch=STARDUST filteredEvent
- randomevents.json：0 条 epoch 含 STARDUST 事件

**代码证据**：

### 4.1 剧情事件分发（checkEvents, GameEventManager.ts:913-935）
- 遍历 `this.events`，检查 `!hasTriggered && currentYear >= e.inYear`
- STARDUST 纪元无剧情事件 → 返回空

### 4.2 过滤事件分发（getFilteredEventsForTurn, GameEventManager.ts:723-742）
- 遍历 `this.filteredEvents`，检查 `triggeredFilteredIds`
- STARDUST 纪元无 filteredEvent → 返回空

### 4.3 随机事件分发（checkRandomEvents, GameEventManager.ts:1035-1080）
- 遍历 `this.randomEvents`，检查 `isEventEligible`
- randomevents.json 中无 epoch 含 STARDUST 的事件 → `isEpochMatch` 返回 false → 返回空

**结论**：STARDUST 纪元每回合 checkEvents / getFilteredEventsForTurn / checkRandomEvents 均返回空。玩家进入后无事件可触发，仅靠结局判定驱动游戏结束。

**测试证据**：无测试覆盖 STARDUST 纪元事件触发

**证据闭合性**：✅ 闭合（STARDUST 纪元确认为终局纪元，无事件）

---

## 五、数值变化证据

**检查对象**：STARDUST 纪元期间 culture/treachery/population/economy/military/prestige/deterrenceValue 变化

**代码证据**：

### 5.1 culture 变化

| 来源 | 变化量 | 触发条件 |
|---|---|---|
| 入口 CG 回调 | +300 | 进入 STARDUST 纪元（Game.ts:908） |
| 每回合自然增长 | 公式：`2 + social×0.10`（project_memory 调整后） | 标准回合逻辑 |

**STARDUST 期间 culture 变化**：
- 入口一次性 +300
- 每回合自然增长（无事件 culture 加成）
- STARDUST minCulture=2500, maxCulture=999999（无上限）
- HIDDEN 结局需 culture≥1000（STARDUST 入口已 ≥2500，必然满足）

### 5.2 treachery 变化
- STARDUST 事件无显式 treachery 变化（无事件）
- 继承 GALAXY 末 treachery 值
- DEFEAT_TREACHERY 阈值 treachery≥100（UC-16 继承）

### 5.3 deterrenceValue 变化
- STARDUST 事件无显式 deterrenceValue 变化（无事件）
- HIDDEN 结局需 deterrenceValue≥50
- COSMIC_SILENCE 需 deterrenceValue<20

### 5.4 population 变化
- STARDUST 事件无显式 population 变化（无事件）
- ETERNAL_EXILE 需 0<pop≤5
- EXTINCTION 需 pop≤0
- HIDDEN 需 pop>0
- 每回合自然人口增长/衰减（EarthCivilization.runARound）

### 5.5 economy/military/prestige 变化
- STARDUST 事件无显式变化（无事件）
- 每回合标准经济/军事/声望结算

**测试证据**：无测试覆盖 STARDUST 数值变化

**证据闭合性**：✅ 闭合

---

## 六、Tag/Flag 生命周期证据

**检查对象**：STARDUST 纪元期间 FLAG 写入/读取/清除、Tag 设置/移除

**代码证据**：

### 6.1 FLAG 生命周期

| FLAG | 写入点 | 读取点 | 死/活 |
|---|---|---|---|
| stardust_era_declared | events.json:1649（GALAXY year=420） | Game.ts:792（入口门控） | 活（仅门控读取） |
| stardust_era_seen | **无写入点** | Game.ts:792（入口门控） | **死FLAG**（无写入，OR 关系不影响入口） |
| stardust_era_active | Game.ts:907（入口 CG 回调） | **无读取点** | **死FLAG**（仅写入无读取） |
| galaxy_exodus_seen | 继承 GALAXY | Game.ts:949（HIDDEN）, 1199（ETERNAL_EXILE） | 活 |
| zero_homer_contacted | 继承 GALAXY | Game.ts:951（HIDDEN）, 792（门控） | 活 |
| mini_universe_built | 继承 GALAXY | Game.ts:952（HIDDEN） | 活 |
| alien_alliance | 继承 GALAXY | Game.ts:950（HIDDEN） | 活 |
| wandering_completed | 继承更早纪元 | Game.ts:984（WANDERING）, 1201（ETERNAL_EXILE 互斥）, 1286（DEFEAT 豁免） | 活 |
| digital_ark_upgrade | 继承更早纪元 | Game.ts:985（WANDERING 互斥）, 1201（ETERNAL_EXILE 互斥） | 活 |
| dark_domain_decision | 继承更早纪元 | Game.ts:1082（DARK_DOMAIN）, 1218（COSMIC_SILENCE） | 活 |
| conquest_declared | 继承更早纪元 | Game.ts:1056（CONQUEST allowedEras） | 活 |

**死 FLAG 统计**：2 个（stardust_era_seen 无写入 + stardust_era_active 无读取）

### 6.2 FLAG_ALIAS_MAP（GameEventManager.ts:781-798）
- `black_domain_decision` → `dark_domain_decision`（行 796）
- **仅用于读取侧**（reqFlag/reqNotFlag），不用于写入侧

### 6.3 Tag 生命周期
- 入口设置：`stardust_era_deep`（TagManager.ts:78，milestone=true 不衰减）
- 入口移除：循环 `epochTagMap` 移除非当前纪元 Tag（Game.ts:840-846）
- 每回合 `decayTags`（Game.ts:512）：milestone Tag 不衰减

### 6.4 FLAG 跨纪元行为
- 旧纪元 FLAG **不清理**，永久保留（基线 2.4）
- STARDUST 写入的 FLAG（stardust_era_active）累积保留至游戏结束
- **AR-5（FLAG 永久累积）持续**：STARDUST 新增 1 个死 FLAG（stardust_era_active）+ 1 个无写入 FLAG（stardust_era_seen）

**测试证据**：无测试覆盖 STARDUST FLAG 生命周期

**证据闭合性**：✅ 闭合

---

## 七、科技条件证据

**检查对象**：STARDUST 纪元结局科技条件、前置链

**代码证据**：

### 7.1 STARDUST 结局科技条件

| 结局 | 科技要求 | 代码位置 |
|---|---|---|
| HIDDEN | 黑域生成 + 数字方舟 | Game.ts:955-956 |
| WANDERING | 行星发动机Ⅲ型 + 新家园选址 | Game.ts:982-983 |
| DIGITAL | 数字方舟 | Game.ts:1010 |
| DARK_DOMAIN | 黑域生成 | Game.ts:1083 |
| DEFEAT 豁免 | 黑域生成 / 数字方舟 / dimensional_defense / dimensional_defense_completed / wandering_completed | Game.ts:1282-1286 |

### 7.2 科技前置链（继承自更早纪元）

| 科技 | 树 | 完整前置链 | 行号 |
|---|---|---|---|
| 黑域生成 | INTERSTELLAR | 宇宙社会学→安全声明理论→黑域生成 | TecTreeManager.ts:149 |
| 数字方舟 | INFORMATION | 数字文明→数字生命研究→意识上传→数字方舟 | TecTreeManager.ts:131 |
| 新家园选址 | INTERSTELLAR | 流浪地球计划→新家园选址 | TecTreeManager.ts:154 |
| 行星发动机Ⅲ型 | AEROSPACE | 核聚变推进→重元素聚变→行星发动机Ⅰ型→Ⅱ型→Ⅲ型 | TecTreeManager.ts:66 |

### 7.3 STARDUST 独有科技
- **无 STARDUST 独有科技节点**（无 epoch/era 限制字段）
- 所有结局科技均可在更早纪元开始研究

### 7.4 DEFEAT 兜底逃生科技
- 黑域生成 完成 → 豁免
- 数字方舟 完成 → 豁免
- DIMENSIONAL_DEFENSE FLAG → 豁免
- DIMENSIONAL_DEFENSE_COMPLETED FLAG → 豁免
- WANDERING_COMPLETED FLAG → 豁免

**关键发现**：HIDDEN 结局需要黑域生成+数字方舟，这两个科技也是 DEFEAT 兜底逃生路径。走 HIDDEN 路线的玩家，科技完成后 DEFEAT 兜底不会触发。

**测试证据**：Game.victoryConditions.test.ts 测试覆盖 HIDDEN 结局科技条件

**证据闭合性**：✅ 闭合

---

## 八、纪元出口证据

**检查对象**：STARDUST 纪元出口条件

**代码证据**：

### 8.1 无下游纪元推进出口
- STARDUST 是最后一个纪元（epoch=6）
- epochs.json 中无 epoch=7 条目
- Game.ts:760 updateEpoch 中无 epoch>6 的处理

### 8.2 结局退出路径
- 11 种结局均可触发（见第九节）
- checkVictoryConditions（Game.ts:1105-1320）每回合检查
- 结局触发后 isGameOver=true，游戏结束

**测试证据**：无测试覆盖 STARDUST 纪元出口

**证据闭合性**：✅ 闭合（STARDUST 确认为终局纪元，仅通过结局退出）

---

## 九、结局逻辑证据

**检查对象**：STARDUST 纪元可触发结局、判定顺序、竞争关系

**代码证据**：

### 9.1 checkVictoryConditions 判定顺序（Game.ts:1105-1320）

| 顺序 | 行号 | 判定 | STARDUST 可触发 |
|---|---|---|---|
| 0 | 1107-1109 | 自动打 CONQUEST_DECLARED（若 isAllCiviConquered） | ✅ 前置打标 |
| 1 | 1112-1163 | broadcastTriggered 分支（HIDDEN/EXTINCTION） | ✅（若 broadcastTriggered=true） |
| 2 | 1165-1194 | 遍历 getVictoryConditions()（HIDDEN→WANDERING→DIGITAL→DETERRENCE→CONQUEST→DARK_DOMAIN） | ✅（DETERRENCE 被 allowedEras 过滤：allowedEras=[DETERRENCE]） |
| 3 | 1199-1214 | ETERNAL_EXILE（中性，≥GALAXY） | ✅ |
| 4 | 1217-1233 | COSMIC_SILENCE（中性，≥BUNKER） | ✅ |
| 5 | 1235-1248 | DEFEAT_TREACHERY | ✅ |
| 6 | 1250-1279 | DEFEAT_EXTINCTION | ✅ |
| 7 | 1281-1320 | DEFEAT_DIMENSION_STRIKE / HELIUM_FLASH | ✅ |

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
| ETERNAL_EXILE | epoch≥GALAXY + galaxy_exodus_seen + 0<pop≤5 + !wandering_completed + !digital_ark_upgrade | 1199-1214 |
| COSMIC_SILENCE | epoch≥BUNKER + (dark_domain_decision 或 black_domain_decision) + 0<pop≤10 + deterrence<20 | 1217-1233 |

### 9.4 DEFEAT 兜底（Game.ts:1281-1286）
```ts
if ((this.year > 350 || this.dimensionStrikeTriggered) &&
    !isTecFinishedAnywhere("黑域生成") &&
    !isTecFinishedAnywhere("数字方舟") &&
    !hasFlag(DIMENSIONAL_DEFENSE) &&
    !hasFlag(DIMENSIONAL_DEFENSE_COMPLETED) &&
    !hasFlag(WANDERING_COMPLETED))
```

**STARDUST 特殊风险**：
- STARDUST year≥420>350 → DEFEAT 条件 `year>350` 必然满足
- 除非有逃生科技/FLAG（黑域生成/数字方舟/dimensional_defense/dimensional_defense_completed/wandering_completed）
- 走 HIDDEN 路线的玩家（需黑域生成+数字方舟）自然豁免 DEFEAT 兜底
- 走非 HIDDEN 路线的玩家若无逃生科技，会被 DEFEAT 兜底截断

### 9.5 HIDDEN 结局可达性分析
- HIDDEN 在判定顺序中排第 1（胜利结局中最先）
- HIDDEN 条件：year≥350 + culture≥1000 + 4 FLAG + 2 科技 + pop>0 + deterrence≥50
- STARDUST 入口 culture≥2500 > 1000 → culture 条件必然满足
- STARDUST year≥420 > 350 → year 条件必然满足
- **DEFEAT 兜底在 HIDDEN 之后判定**，若 HIDDEN 条件满足会先 return
- HIDDEN 所需的 2 科技（黑域生成+数字方舟）也是 DEFEAT 逃生路径
- **结论**：HIDDEN 在 STARDUST 中可达性更高（culture/year 条件自动满足）

**测试证据**：
- Game.victoryConditions.test.ts:280-300 测试 HIDDEN 结局
- Game.defeatConditions.test.ts:77,171 测试 DEFEAT_DIMENSION_STRIKE

**证据闭合性**：✅ 闭合

---

## 十、存档与回溯证据

**检查对象**：STARDUST 纪元状态持久化、存档/读档一致性

**代码证据**：

### 10.1 持久化字段
- epoch（number）：✅ 持久化
- year（number）：✅ 持久化
- earthCivi.culture：✅ 持久化（含 STARDUST 入口 +300）
- earthCivi.population/economy/military/prestige/treachery/deterrenceValue/resource：✅ 持久化
- earthCivi.swordholder：✅ 持久化（GALAXY 已清除为 null）
- deterrenceEnduranceRounds：✅ 持久化（STARDUST 中为 0）
- dimensionStrikeTriggered：✅ 持久化（SaveManager.ts:115 迁移补丁）
- broadcastTriggered：✅ 持久化
- flagManager（Set）：✅ 持久化（含 stardust_era_active）
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

### 10.4 STARDUST 特有存档风险
- 无 STARDUST 独有的存档风险
- stardust_era_active FLAG 持久化但无消费者（死 FLAG）
- FLAG 累积（AR-5）导致存档体积增长，但无功能影响

**测试证据**：
- SaveManager.test.ts 测试存档/读档
- Serialization.scenario.test.ts 场景测试
- SaveLoad.test.ts 集成测试

**证据闭合性**：✅ 闭合

---

## 汇总

### 完整事件清单

**STARDUST 纪元无任何事件**：
- 剧情事件（events.json, epoch=STARDUST）：0 条
- 过滤事件（filteredEvent, epoch=STARDUST）：0 条
- 随机事件（randomevents.json, epoch 含 STARDUST）：0 条

### 人物状态轨迹

| 人物 | 进入 STARDUST 时 | STARDUST 内变化 | swordholder 影响 |
|---|---|---|---|
| 程心 | 存活 | - | - |
| 云天明 | 存活 | - | - |
| 智子 | 存活 | - | - |
| 艾AA | 存活 | - | - |
| 关一帆 | 存活 | - | - |
| 罗辑 | 死亡（继承 GALAXY） | - | swordholder 已为 null |
| 刘慈欣 | 死亡（继承 GALAXY） | - | - |
| 其他 28 人 | 死亡（继承更早纪元） | - | - |

### 数值状态账本

| 数值 | STARDUST 入口值 | 事件变化 | 出口需求 | 风险 |
|---|---|---|---|---|
| culture | ≥2500 | +300（入口 CG）+ 每回合自然增长 | ≥1000（HIDDEN，必然满足） | 低 |
| treachery | 继承 GALAXY | 无 STARDUST 事件变化 | <100（避免 DEFEAT） | ⚠️ UC-16 继承 |
| population | 继承 GALAXY | 无 STARDUST 事件变化 | >0（HIDDEN/ETERNAL_EXILE） | 低 |
| deterrenceValue | 继承 GALAXY | 无 STARDUST 事件变化 | ≥50（HIDDEN）/ <20（COSMIC_SILENCE） | 中 |

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
| C-1 | STARDUST_ERA_ACTIVE 死 FLAG（仅写入无读取） | ✅ | ✅ AR-42 |
| C-2 | STARDUST_ERA_SEEN 无写入点（死 FLAG 但 OR 关系不影响入口） | ✅ | ✅ AR-43 |
| C-3 | timeline.json 无"星屑"条目（UI 缺失） | ✅ | ✅ AR-44 |
| C-4 | STARDUST 纪元无任何事件（设计观察） | ✅ | 降级为观察项（终局纪元设计合理） |
| C-5 | STARDUST 纪元 DEFEAT 兜底持续生效 | ✅ | ✅ AR-45（AR-37 同类） |
| C-6 | STARDUST 入口 culture+300 在门控之后执行 | ✅ | 降级为观察项（设计合理，+300 用于纪元内而非入口） |
| C-7 | STARDUST 纪元无新增死亡 | ✅ | 降级为观察项（终局纪元设计合理） |

### 未确认项清单

| 编号 | 范围 | 尚缺证据 |
|---|---|---|
| UC-17 | UC-15 继承：culture 是否足够达到 2500（STARDUST 入口门槛） | 需 Autoplay500 运行观察 GALAXY 末 culture 是否达到 2500 |
| UC-18 | UC-16 继承：treachery 跨纪元累积是否在 STARDUST 触发 DEFEAT_TREACHERY | 依赖 UC-14/UC-16（GALAXY 末 treachery 值），需 Autoplay500 运行观察 |

---

**EPOCH_EVIDENCE_星屑纪元 取证完成。未修改代码，未输出修复方案。**

**候选问题**：7 项 → 4 项正式问题（AR-42~AR-45）+ 3 项降级/观察
**未确认项**：2 项（UC-17, UC-18）
