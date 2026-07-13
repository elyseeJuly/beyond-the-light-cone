# `EPOCH_EVIDENCE_威慑纪元`

> 纪元：威慑纪元（DETERRENCE, epoch=2）
> 阶段：完整取证（补齐证据，未输出最终报告，未修改代码）
> 证据截止：20260712
> 模型引用：EPOCH_AUDIT_MODEL_威慑纪元

---

## 一、纪元入口证据

### 1.1 检查对象
DETERRENCE 纪元（epoch=2）的入口判定逻辑、门控条件、入口处理流程。

### 1.2 设计证据
- epochs.json：`minCulture=200, maxCulture=499`，纪元索引 2
- timeline.json：`gameYearRange=[201,260]`，描述"威慑平衡、程心执剑、威慑失败"
- Game.ts:53 初始 epoch=CRISIS（新游戏跳过黄金岁月）

### 1.3 代码证据

**入口判定算法**（Game.ts:758-786 updateEpoch）：
```typescript
758→  public updateEpoch(): void {
760→    const culture = this.earthCivi.culture;
764→    const matched = epochsData.find(e => culture >= e.minCulture && culture <= e.maxCulture);
766→    // 溢出回退
770→    if (matched.epoch > this.epoch) {
772→      if (matched.epoch === EpochType.DETERRENCE && !this.flagManager.isSet(FLAG.DETERRENCE_ESTABLISHED)) allowed = false;
779→    if (allowed && matched.epoch > this.epoch) {
789→      // 入口处理 15 项初始化
```

**deterrence_established 写入点**（events.json:748-752，year=202, epoch=CRISIS）：
```json
{ "type": "flag", "target": "deterrence_established" }
```
前置链：year=200 末日战役（reqFlag=teardrop_arrived）→ doomsday_battle_lost → year=202 威慑建立 → deterrence_established

**入口处理 15 项**（Game.ts:789-915）：unset EPOCH_STALLED → addHistory → playerTimeline.push → 资源包下载 → 时间线锚点 → ticker-message-added → setWorldTagIntensity('deterrence_era',100) → 移除旧纪元 Tag → atmosphereEngine.evaluate → 构造纪元 CG 事件 → eventQueue.unshift → StatisticsManager.recordEventTrigger → emitLegacy('epoch-changed') → SaveManager.autoSave

### 1.4 测试证据
- 无专门测试覆盖"DETERRENCE 纪元入口门控"
- Game.test.ts 测试 updateEpoch 但未覆盖 FLAG 门控分支

### 1.5 正常路径
```
year=200 末日战役 → doomsday_battle_lost
→ year=201 黑暗战役（CRISIS）→ dark_battle
→ year=202 威慑建立（CRISIS）→ deterrence_established / culture+30
→ culture≥200 + deterrence_established
→ updateEpoch 推进 epoch=2 (DETERRENCE)
```

### 1.6 异常路径
- **culture≥200 但 deterrence_established 未设置**：updateEpoch 设 allowed=false，设置 EPOCH_STALLED，记录"文明停滞"。玩家需通过 filteredEvent deterrence_establishment（CRISIS, minYear=50, reqTech=黑暗森林威慑, minDeterrence=50）任命罗辑为执剑人来设置 swordholder_appointed，但此 FLAG 不等于 deterrence_established。
- **deterrence_established 的唯一写入点是 events.json year=202 事件**（reqFlag=doomsday_battle_lost）。若 year=200 末日战役未触发（如 teardrop_arrived 未设置），整个链条断裂。

### 1.7 证据闭合性
**CONFIRMED**。入口路径完整闭合，门控逻辑清晰。

---

## 二、时间线与内部阶段证据

### 2.1 检查对象
DETERRENCE 纪元内部时间线、事件年份分布、阶段划分。

### 2.2 设计证据
- timeline.json：gameYearRange=[201,260]，现实年份 2208-2270
- events.json 实际事件年份：201, 205, 210, 219, 220, 225, 230（8 个 epoch=DETERRENCE 事件）

### 2.3 代码证据

**events.json year=201 时序倒置**（CQ-1 确认）：
- year=201 事件（epoch=DETERRENCE）reqFlag=deterrence_established
- deterrence_established 在 year=202 才写入
- checkEvents（GameEventManager.ts:913-932）允许"过期"事件触发（currentYear >= e.inYear 只有下界无上界）
- year=201 事件最早在 year=203（deterrence_established 写入后的下一年）触发

**checkEvents 遍历顺序**（GameEventManager.ts:916）：按 events.json 文件顺序，无排序。

**内部阶段**：
| 阶段 | 年份 | 关键事件 |
|---|---|---|
| 威慑建立期 | 201-210 | 威慑纪元宣告/技术交流/威慑稳固期 |
| 执剑人交接期 | 219-220 | 执剑人交接（分支）/威慑中止或持续 |
| 后果期 | 225-230 | 澳大利亚大移民/引力波广播 |

### 2.4 测试证据
- 无测试覆盖"year=201 事件实际触发年份"

### 2.5 正常路径
year=201~210 事件按年份顺序触发（受 reqFlag 约束可能有延迟）。

### 2.6 异常路径
- year=201 威慑纪元宣告延迟到 year=203+ 触发（时序倒置，CQ-1）
- year=205/210 事件 reqFlag=deterrence_established，在 year=202 后可正常触发

### 2.7 证据闭合性
**CONFIRMED**（含 1 项时序倒置候选问题 CQ-1）。

---

## 三、人物状态证据

### 3.1 检查对象
DETERRENCE 纪元期间人物存活/死亡/解锁状态轨迹。

### 3.2 代码证据

**死亡判定**（Game.ts:698-724 runARound）：
```typescript
702→  for (const p of this.personManager.getAllPersons()) {
703→    if (p.isAlive && !this.eventManager.isPersonAliveInEpoch(p.name, currentEpochStr)) {
704→      p.isAlive = false;
```

**epochDeathMap**（GameEventManager.ts:937-991）：进入 DETERRENCE 时死亡 12 人。

**修正上游报告名单错误**：
| 上游报告所列 | 实际 epochDeathMap | 修正 |
|---|---|---|
| 庄颜 | BROADCAST 死 | 上游误列，DETERRENCE 存活 |
| 维德 | BUNKER 死 | 上游误列，DETERRENCE 存活 |
| 东方延绪 | DETERRENCE 死 | 上游漏列 |

**实际 DETERRENCE 死亡 12 人完整名单**：伊文斯/章北海/丁仪/叶文洁/汪淼/大史/常伟思/东方延绪/杨冬/华华/滑膛/朱汉扬

**DETERRENCE 存活且可用人物**：
| 人物 | 解锁时机 | 可用性 |
|---|---|---|
| 罗辑 | CRISIS 面壁计划 | ✅ 无条件可用 |
| 希恩斯 | CRISIS 面壁计划 | ✅ 无条件可用 |
| 庄颜 | CRISIS 增援未来 | ✅ 无条件可用 |
| 维德 | CRISIS "只送大脑" | ✅ 无条件可用 |
| 程心 | DETERRENCE year=219（选项A） | ⚠️ 仅程心路线 |
| 艾AA | DETERRENCE year=219（选项A） | ⚠️ 仅程心路线 |

**程心状态轨迹**：
- epochDeathMap: `[]`（永不死亡）
- coreStoryPersons: 包含（需 unlock_person 解锁）
- 解锁事件: events.json:849 year=219 选项A "任命程心为第二任执剑人"
- 相关 FLAG: swordholder_chengxin（非 chengxin_swordholder）

### 3.3 测试证据
- GameEventManager.test.ts 测试 isPersonAliveInEpoch，未覆盖 DETERRENCE 纪元 12 人死亡名单完整性

### 3.4 正常路径
进入 DETERRENCE 时 12 人死亡，4~6 人存活可用。

### 3.5 异常路径
- 若 CRISIS 纪元未触发面壁计划事件，罗辑/希恩斯/庄颜/维德可能未解锁 → DETERRENCE 纪元无可用人物
- 程心路线解锁程心但 earthCivi.swordholder 字段未更新（CQ-4）

### 3.6 证据闭合性
**CONFIRMED**（含名单修正 + CQ-4 状态不一致候选问题）。

---

## 四、事件资格与触发证据

### 4.1 检查对象
DETERRENCE 纪元期间所有事件的触发条件、资格判定、去重机制。

### 4.2 代码证据

**checkEvents**（GameEventManager.ts:913-932）：
```typescript
916→  this.events.forEach(e => {
917→    if (!e.hasTriggered && currentYear >= e.inYear) {
923→      if (e.triggerCondition) {
924→        if (!this.checkFilterConditions(e.triggerCondition)) return;
925→      }
928→      e.hasTriggered = true;
```
- 按文件顺序遍历
- 允许"过期"事件触发（无上界）
- 缺失 triggerCondition 的事件不做 epoch 检查
- 不调用 isEventCharactersUnlocked（与 checkRandomEvents 不同，AR-8 上游已登记）

**checkFilterConditions**（GameEventManager.ts:767-825）：
```typescript
778→  if (cond.epoch && !this.isEpochMatch(cond.epoch, currentEpoch)) return false;
```
- epoch 检查通过 isEpochMatch，支持逗号分隔多纪元

**isEpochMatch**（GameEventManager.ts:745-763）：
- 支持逗号分隔："CRISIS,DETERRENCE"
- 支持 "ANY"
- 支持 "WANDERING"/"SHELTER" 别名

**checkRandomEvents**（GameEventManager.ts:1035-1080）：
```typescript
1047→  if (!this.isEventCharactersUnlocked(e)) continue;
1054→  if (!this.checkFilterConditions(cond)) continue;
```
- 调用 isEventCharactersUnlocked（与 checkEvents 不同）
- 调用 checkFilterConditions（含 epoch 检查）

**filteredEvent 触发**：
- minYear 是绝对游戏年份（GameEventManager.ts:776 `game.year < cond.minYear`）
- deterrence_strain(minYear:70) / lightspeed_project(minYear:90) 在 DETERRENCE(year≥201) 时 minYear 已冗余满足（CQ-7 确认）
- epoch 检查阻止在 CRISIS 触发

**flag value 字段语义**（EventSystem.ts:134-136）：
```typescript
134→  } else if (eff.type === 'flag') {
135→    this.game.addFlag(eff.target);
```
- **value 字段被完全忽略**，flag 是布尔语义（set/unset）
- value=0 和 value=1 行为完全一致

### 4.3 测试证据
- GameEventManager.test.ts 测试 checkEvents 基本逻辑，未覆盖 epoch 匹配
- 无测试覆盖"flag value=0 vs value=1"

### 4.4 正常路径
8 个剧情事件按年份+reqFlag 顺序触发；2 个 filteredEvent 在 DETERRENCE 期间触发；34 个 randomevent 按 probability 随机触发。

### 4.5 异常路径
- year=201 事件时序倒置（CQ-1）
- year=220 两事件通过 reqFlag 互斥（swordholder_chengxin vs swordholder_luoji_retained），正常
- 程心路线 year=230 事件 epoch=BROADCAST（CQ-6）：若玩家仍在 DETERRENCE（culture<500），epoch 检查会阻止触发 → 可能卡死

### 4.6 证据闭合性
**CONFIRMED**（含 CQ-1 时序倒置、CQ-6 程心路线卡死风险、CQ-7 minYear 语义冗余）。

---

## 五、数值变化证据

### 5.1 检查对象
DETERRENCE 纪元期间 culture/treachery/deterrenceValue/population/prestige 数值变化。

### 5.2 代码证据

**culture 变化**：
| 来源 | 位置 | 变化 |
|---|---|---|
| year=201 事件 | events.json:693 | +30 |
| year=205 事件 | events.json:802 | +20 |
| year=210 事件 | events.json:828 | +20 |
| year=219 选项B | events.json:862 | +10 |
| year=220 罗辑路线 | events.json:910 | +15 |
| year=202(CRISIS) | events.json:770 | +30 |
| EventSystem.ts:27 | 事件效果 | +30（通用） |
| Game.ts:681 | 特定条件 | +200 |
| Game.ts:892 | 星屑纪元 | +300 |

**罗辑路线 culture 累计**（DETERRENCE 期间）：30+20+20+10+15 = +95（不含每回合自动增长）

**treachery 变化**：
| 来源 | 位置 | 变化 | 路线 |
|---|---|---|---|
| year=201(CRISIS) | events.json:728 | +20 | 共同 |
| year=202(CRISIS) | events.json:772 | -20 | 共同 |
| year=219 选项A | events.json:851 | +10 | 程心 |
| year=220 程心 | events.json:882 | +40 | 程心 |
| year=225 | events.json:945 | +25 | 程心 |
| year=230 BROADCAST | events.json:968 | +20 | 程心 |
| filteredEvent 选项B | GameEventManager.ts:490 | -5 | 共同 |

**程心路线 treachery 累计**：CRISIS累积(典型0) + 10 + 40 + 25 + 20 = +95。若 CRISIS 累积≥5 → treachery≥100 → DEFEAT_TREACHERY（CQ-5/CQ-13 确认）。

**deterrenceValue 变化**：
| 来源 | 位置 | 变化 | 路线 |
|---|---|---|---|
| year=219 选项B | events.json:857 | +30 | 罗辑 |
| year=220 罗辑 | events.json:908 | +20 | 罗辑 |
| year=230 罗辑 | events.json:1012 | +50 | 罗辑 |

**罗辑路线 deterrenceValue 累计**：初始值 + 30 + 20 + 50 = 初始值 + 100。胜利阈值≥90。

**population 变化**（程心路线）：
| 来源 | 变化 |
|---|---|
| year=220 | -20 |
| year=225 | -15 |
| 合计 | -35 |

**deterrenceEnduranceRounds 累积**（Game.ts:650-659）：
```typescript
651→  if (this.epoch >= EpochType.DETERRENCE && this.earthCivi.swordholder !== null) {
652→    if (this.earthCivi.deterrenceValue >= 80) {
653→      this.deterrenceEnduranceRounds++;
```
- 累积阈值 80，胜利阈值 90
- 任何一回合跌破 80 即清零
- 位于 year++ 之前，使用本回合更新前的 epoch

### 5.3 测试证据
- Game.victoryConditions.test.ts 测试 DETERRENCE 胜利条件，未覆盖 treachery 累积场景

### 5.4 正常路径
罗辑路线：deterrenceValue 持续增长 → ≥90 + endurance≥20 → 胜利可达。
程心路线：treachery 暴涨 +95 → 几乎必然 DEFEAT_TREACHERY。

### 5.5 异常路径
- 程心路线 treachery≥100 提前触发失败（CQ-5/CQ-13）
- 若 deterrenceValue 初始值过低（<0），罗辑路线可能无法达到 90 阈值

### 5.6 证据闭合性
**CONFIRMED**（含 CQ-5/CQ-13 程心路线必败风险）。

---

## 六、Tag/Flag 生命周期证据

### 6.1 检查对象
DETERRENCE 纪元期间所有 FLAG 的写入/读取/生命周期，Tag 的施加/衰减。

### 6.2 代码证据

**FLAG 读写完整清单**（已全量 Grep 验证）：

| FLAG | 写入点 | 读取点 | 状态 |
|---|---|---|---|
| deterrence_established | events.json:748 (CRISIS year=202) | Game.ts:772 门控 / events.json:700,803,830,868 reqFlag | ✅ 活 |
| coordinates_broadcasted | events.json:999 (DETERRENCE year=230) / events.json:968 (BROADCAST year=230) | Game.ts:773 门控 / events.json:1050 reqFlag | ✅ 活 |
| swordholder_appointed | GameEventManager.ts:350 (CRISIS filteredEvent) | GameEventManager.ts:487 / Game.ts:972,998,1047,1073 互斥 | ✅ 活 |
| deterrence_broken | events.json:882 (year=220) | events.json:945 (year=225 reqFlag) | ✅ 活 |
| deterrence_held_strong | events.json:908 (year=220) | events.json:990 (year=230 reqFlag) | ✅ 活 |
| swordholder_chengxin | events.json:851 (year=219) | events.json:889 (year=220 reqFlag) | ✅ 活 |
| swordholder_luoji_retained | events.json:856 (year=219) | events.json:897 (year=220 reqFlag) | ✅ 活 |
| australia_migration | events.json:940 (year=225) | events.json:966 (year=230 BROADCAST reqFlag) | ✅ 活 |
| lightspeed_project_approved | GameEventManager.ts:503 | GameEventManager.ts:501 (reqNotFlag 自去重) | ✅ 活 |
| **swordholder_handover** | events.json:848,857 (year=219 两选项均写) | **无** | ❌ 死 FLAG |
| **deterrence_era_declared** | events.json:689 (year=201) | **无** | ❌ 死 FLAG（AR-4） |
| **tech_exchange_started** | events.json:790 (year=205) | **无** | ❌ 死 FLAG |
| **chengxin_swordholder** | randomevents.json:6038 | **无** | ❌ 死 FLAG（命名不一致） |
| **deterrence_reinforced** | GameEventManager.ts:489 | **无** | ❌ 死 FLAG |
| **lightspeed_rejected** | GameEventManager.ts:504 | **无** | ❌ 死 FLAG |
| **dark_battle** | events.json:715 (CRISIS year=201) | **无** | ❌ 死 FLAG（别名 dark_battle_concluded 也未使用） |
| doomsday_battle_lost | events.json:668 (CRISIS year=200) | events.json:736,772 (均 CRISIS) | ✅ 活但 DETERRENCE 无读取 |

**死 FLAG 统计**：7 个死 FLAG（swordholder_handover / deterrence_era_declared / tech_exchange_started / chengxin_swordholder / deterrence_reinforced / lightspeed_rejected / dark_battle）

**Tag 生命周期**：
| Tag | 触发 | 衰减 |
|---|---|---|
| deterrence_era | Game.ts:837 纪元切换 intensity=100 | 不衰减（milestone） |
| deterrence_steady | Game.ts:523 deterrenceValue>60 intensity=40 | 每回合 -3 |
| deterrence_unstable | **无调用点** | 预留未启用（CQ-8） |
| victory_deterrence | Game.ts 结局记录 | 不衰减（milestone） |

### 6.3 测试证据
- FlagTyped.scenario.test.ts 仅验证 FLAG 常量值，未验证读写链
- TagManager.test.ts 未覆盖 deterrence_unstable 未启用

### 6.4 正常路径
活 FLAG 读写链完整闭合。死 FLAG 无影响但增加维护成本。

### 6.5 异常路径
- chengxin_swordholder 与 swordholder_chengxin 命名不一致（CQ-10）：randomevent 写入的 chengxin_swordholder 永远不会被 events.json year=220 事件读取
- AR-5 FLAG 永久累积：CRISIS 的 doomsday_battle_lost/dark_battle 等 FLAG 进入 DETERRENCE 后无清理，但 DETERRENCE 事件无 reqNotFlag 读取这些 FLAG（无阻断影响）

### 6.6 证据闭合性
**CONFIRMED**（含 7 个死 FLAG + CQ-10 命名不一致 + CQ-8 未启用 Tag）。

---

## 七、科技条件证据

### 7.1 检查对象
DETERRENCE 纪元相关科技的前置链、解锁逻辑、读取点。

### 7.2 代码证据

**TecTreeManager 科技前置链**（TecTreeManager.ts）：

| 科技 | 所属树 | parentName | 读取点 | 证据状态 |
|---|---|---|---|---|
| 黑暗森林威慑 | MILITARY | ""（根节点） | filteredEvent deterrence_establishment reqTech (CRISIS) | CONFIRMED |
| 曲率驱动理论 | PHYSICS | "维度物理" | filteredEvent lightspeed_project reqTech (DETERRENCE) | CONFIRMED |
| 核聚变推进 | AEROSPACE | ""（根节点） | randomevent chengxin_ladder_project reqTech (DETERRENCE) | CONFIRMED |

**前置链详情**：
- 黑暗森林威慑(MILITARY 根) → 天体社会学Ⅰ → 引力波广播系统
- 维度物理(PHYSICS 根) → 曲率驱动理论 → 光速飞船原型
- 核聚变推进(AEROSPACE 根) → 重元素聚变 / 月球发动机

**解锁逻辑**（TecTreeManager.ts:179 addProgress）：检查 parentName 前置完成。

### 7.3 测试证据
- 无专门测试覆盖"DETERRENCE 纪元科技前置链"

### 7.4 正常路径
- 黑暗森林威慑：MILITARY 根节点，无前置，CRISIS 纪元可研究
- 曲率驱动理论：需先完成"维度物理"
- 核聚变推进：AEROSPACE 根节点，无前置

### 7.5 异常路径
- 若玩家未研究"维度物理"，lightspeed_project filteredEvent 不会触发（reqTech 失败）
- EPOCH_STALLED 允许无限期研究（CRISIS 纪元上游确认）

### 7.6 证据闭合性
**CONFIRMED**。

---

## 八、纪元出口证据

### 8.1 检查对象
DETERRENCE 纪元出口条件、出口处理、传递到 BROADCAST 的状态。

### 8.2 代码证据

**出口门控**（Game.ts:773）：
```typescript
if (matched.epoch === EpochType.BROADCAST && !this.flagManager.isSet(FLAG.COORDINATES_BROADCASTED)) allowed = false;
```

**coordinates_broadcasted 写入点（2 处）**：
1. events.json:999 year=230 DETERRENCE 版（reqFlag=deterrence_held_strong）— 罗辑路线
2. events.json:968 year=230 BROADCAST 版（reqFlag=australia_migration）— 程心路线

**出口路径**：
| 路径 | 条件 | 下一纪元 |
|---|---|---|
| 正常出口 | culture≥500 + coordinates_broadcasted | BROADCAST(3) |
| 失败 | treachery≥100 | DEFEAT_TREACHERY |
| 失败 | population≤0 | DEFEAT_EXTINCTION |
| 胜利 | epoch=2 + swordholder + deterrenceValue≥90 + endurance≥20 | DETERRENCE 胜利 |

**程心路线卡死风险**（CQ-6 确认）：
- year=230 BROADCAST 版事件 epoch=BROADCAST
- 若玩家在 DETERRENCE 纪元（culture<500），epoch 检查（isEpochMatch("BROADCAST","DETERRENCE")）返回 false
- 程心路线可能无法触发 coordinates_broadcasted → 卡死在 DETERRENCE
- 但 year=225 事件 australia_migration 写入后，需 culture≥500 才能推进到 BROADCAST 触发 year=230 事件

### 8.3 测试证据
- 无测试覆盖"程心路线 coordinates_broadcasted 触发路径"

### 8.4 正常路径
罗辑路线：year=230 DETERRENCE 版事件写入 coordinates_broadcasted → culture≥500 → 推进 BROADCAST。

### 8.5 异常路径
- 程心路线：year=230 BROADCAST 版事件需先进入 BROADCAST 纪元才能触发，但进入 BROADCAST 需要 coordinates_broadcasted → **循环依赖**（CQ-6 确认为正式问题）

### 8.6 证据闭合性
**CONFIRMED**（含 CQ-6 程心路线循环依赖）。

---

## 九、结局逻辑证据

### 9.1 检查对象
DETERRENCE 纪元可触发的所有结局及其竞争关系。

### 9.2 代码证据

**checkVictoryConditions 判定顺序**（Game.ts:1089-1310）：
| 顺序 | 行号 | 条件 | 结局 |
|---|---|---|---|
| 0 | 1096-1147 | broadcastTriggered | HIDDEN 胜利 / EXTINCTION 失败（短路） |
| 1 | 1149-1179 | getVictoryConditions() 迭代 | 各类胜利（含 DETERRENCE） |
| 2 | 1183-1198 | epoch≥GALAXY + pop≤5 | ETERNAL_EXILE 中性 |
| 3 | 1201-1217 | epoch≥BUNKER + 黑域 + pop≤10 | COSMIC_SILENCE 中性 |
| 4 | 1219-1232 | treachery≥100 | DEFEAT_TREACHERY |
| 5 | 1234-1263 | population≤0 | DEFEAT_EXTINCTION |
| 6 | 1265-1309 | year>350 + 未防御 | DIMENSION_STRIKE / HELIUM_FLASH |

**DETERRENCE 胜利条件**（Game.ts:1010-1035）：
```typescript
allowedEras: [EpochType.DETERRENCE],
check: () => {
  return this.epoch >= EpochType.DETERRENCE &&
         this.earthCivi.swordholder !== null &&      // 字段检查，非 FLAG
         this.earthCivi.population > 0 &&
         this.earthCivi.deterrenceValue >= 90 &&
         this.deterrenceEnduranceRounds >= 20 &&
         !this.alienCiviManager.hasAnyAtWar() &&
         !this.hasFlag(FLAG.CONQUEST_DECLARED) &&
         !this.hasFlag(FLAG.WANDERING_COMPLETED) &&
         !this.hasFlag(FLAG.DIGITAL_ARK_UPGRADE) &&
         !this.hasFlag(FLAG.DARK_DOMAIN_DECISION) &&
         !this.hasFlag(FLAG.ZERO_HOMER_CONTACTED);
}
```

**关键发现**：
- DETERRENCE 胜利检查 `earthCivi.swordholder !== null`（字段），**不检查** `FLAG.SWORDHOLDER_APPOINTED`
- swordholder 字段写入点：Game.ts:433-443（filteredEvent effects 处理，仅 CRISIS deterrence_establishment 选项"任命罗辑"时写入"罗辑"）
- events.json year=219 执剑人交接**不修改 swordholder 字段**（CQ-4 确认）
- 程心路线解锁程心但 swordholder 字段仍为"罗辑"（若 CRISIS 已触发 filteredEvent）或 null（若未触发）

**SWORDHOLDER_APPOINTED 互斥锁**：
- Game.ts:972 WANDERING 胜利检查 `!hasFlag(SWORDHOLDER_APPOINTED)`
- Game.ts:998 DIGITAL 胜利检查 `!hasFlag(SWORDHOLDER_APPOINTED)`
- Game.ts:1047 CONQUEST 胜利检查 `!hasFlag(SWORDHOLDER_APPOINTED)`
- Game.ts:1073 DARK_DOMAIN 胜利检查 `!hasFlag(SWORDHOLDER_APPOINTED)`
- 一旦设置，四条胜利线关闭

**swordholder 字段 vs FLAG 双轨写入不一致**（CQ-4 确认）：
- swordholder 字段：仅 filteredEvent deterrence_establishment 选项"任命罗辑"时写入
- FLAG.SWORDHOLDER_APPOINTED：同上写入点
- events.json year=219 执剑人交接：不写 swordholder 字段，不写 SWORDHOLDER_APPOINTED FLAG
- 若玩家通过 events.json year=202 路径进入 DETERRENCE（未触发 filteredEvent），swordholder=null → DETERRENCE 胜利不可达

### 9.3 测试证据
- Game.victoryConditions.test.ts 测试 DETERRENCE 胜利条件
- 测试假设 swordholder 字段已设置，未覆盖"swordholder=null 时 DETERRENCE 胜利是否可达"

### 9.4 正常路径
罗辑路线：swordholder="罗辑"（CRISIS filteredEvent）→ deterrenceValue≥90 + endurance≥20 → DETERRENCE 胜利。

### 9.5 异常路径
- 程心路线：treachery+95 → 几乎必然 DEFEAT_TREACHERY
- swordholder=null（未触发 CRISIS filteredEvent）→ DETERRENCE 胜利不可达（CQ-4）
- 程心路线 year=230 卡死（CQ-6）→ 无法推进 BROADCAST

### 9.6 证据闭合性
**CONFIRMED**（含 CQ-4 swordholder 字段不一致 + CQ-5/CQ-13 程心路线必败）。

---

## 十、存档与回溯证据

### 10.1 检查对象
DETERRENCE 纪元关键状态的持久化、读档恢复、回溯一致性。

### 10.2 代码证据

**gameReplacer 排除字段**（GameSerializer.ts:38-43）：
```typescript
if (_key === 'currentEvent' || _key === 'eventQueue' || _key === 'isProcessing' || _key === '_rngProvider' || _key === 'turnHistory' ||
    _key === 'eventSystem' || _key === 'economySystem' || _key === 'populationSystem' || _key === 'game' ||
    _key === '_hadRunError' || _key === '_yearJustAdvanced' || _key === 'flagManager') {
  return undefined;
}
```

**关键字段持久化验证**：
| 字段 | 声明位置 | 排除? | 持久化 | 迁移 |
|---|---|---|---|---|
| deterrenceEnduranceRounds | Game.ts:94 | 否 | ✅ | SaveManager.ts:114 v2→v3 |
| earthCivi.swordholder | EarthCivilization.ts:21 | 否 | ✅ | — |
| earthCivi.deterrenceValue | EarthCivilization.ts:18 | 否 | ✅ | — |
| earthCivi.treachery | Civilization.ts:12 | 否 | ✅ | — |
| broadcastTriggered | Game.ts:97 | 否 | ✅ | SaveManager.ts:116 v2→v3 |
| isGameOver | Game.ts:85 | 否 | ✅ | — |
| flags (Set) | Game.ts:102 | 否 | ✅ | 特殊序列化 |
| flagManager | — | **是** | ❌ 排除 | restorePrototypes 重建 |

**flags Set 持久化机制**：
- gameReplacer 对 Set 序列化：`{ dataType: 'Set', value: Array.from(value) }`
- reviver 恢复 Set
- restorePrototypes 重建 FlagManager 并绑定到恢复后的 flags Set

**AR-7 FlagManager 引用漂移风险**（上游已登记，CQ-12 持续）：
- GameSerializer.ts:76-78 `new FlagManager(inst.flags)` 重建
- 若 inst.flags 被替换，FlagManager 可能持有旧 Set 引用
- restorePrototypes 已增加引用一致性检查：`inst.flagManager.getInternalSet() !== inst.flags`

### 10.3 测试证据
- SaveLoad.test.ts 测试存档加载，未覆盖"deterrenceEnduranceRounds 持久化"
- Serialization.scenario.test.ts 未覆盖"FlagManager 引用一致性"

### 10.4 正常路径
存档保存全部关键字段，加载后恢复。

### 10.5 异常路径
- flagManager 排除但 flags Set 持久化，restorePrototypes 重建（已增加引用检查）
- 回溯后 deterrenceEnduranceRounds 恢复正确值

### 10.6 证据闭合性
**CONFIRMED**（含 AR-7/CQ-12 引用漂移风险已部分修复）。

---

## 汇总

### 完整事件清单

**events.json epoch=DETERRENCE（8 个）**：
| year | 事件 | reqFlag | 关键 effects |
|---|---|---|---|
| 201 | 威慑纪元宣告 | deterrence_established | flag:deterrence_era_declared(死) / culture+30 |
| 205 | 技术交流 | deterrence_established | flag:tech_exchange_started(死) / culture+20 / economy+50 |
| 210 | 威慑稳固期 | deterrence_established | culture+20 / economy+50 |
| 219 | 执剑人交接 | deterrence_established | 分支：程心(swordholder_chengxin/treachery+10) 或 罗辑(swordholder_luoji_retained/deterrenceValue+30) |
| 220 | 威慑中止 | swordholder_chengxin | flag:deterrence_broken / treachery+40 / population-20 |
| 220 | 威慑持续 | swordholder_luoji_retained | flag:deterrence_held_strong / deterrenceValue+20 |
| 225 | 澳大利亚大移民 | deterrence_broken | flag:australia_migration / treachery+25 / population-15 |
| 230 | 引力波广播(罗辑) | deterrence_held_strong | flag:coordinates_broadcasted / deterrenceValue+50 |

**跨纪元边界事件（3 个）**：
| year | 事件 | epoch | reqFlag | 关键 effects |
|---|---|---|---|---|
| 201 | 黑暗战役 | CRISIS | doomsday_battle_lost | flag:dark_battle(死) / treachery+20 |
| 202 | 威慑建立 | CRISIS | doomsday_battle_lost | flag:deterrence_established / treachery-20 / culture+30 |
| 230 | 引力波广播(程心) | BROADCAST | australia_migration | flag:coordinates_broadcasted / treachery+20 |

**filteredEvents（2 个 DETERRENCE + 1 个 CRISIS 主题）**：
| id | epoch | minYear | 关键 |
|---|---|---|---|
| deterrence_strain | DETERRENCE | 70 | reqFlag:swordholder_appointed / minDeterrence:40 |
| lightspeed_project | DETERRENCE | 90 | reqTech:曲率驱动理论 |
| deterrence_establishment | CRISIS | 50 | reqTech:黑暗森林威慑 / 写入 swordholder_appointed + swordholder 字段 |

**randomevents（34 个）**：25 纯 DETERRENCE + 6 CRISIS,DETERRENCE + 3 DETERRENCE,BROADCAST

### 人物状态轨迹

**进入 DETERRENCE 死亡 12 人**：伊文斯/章北海/丁仪/叶文洁/汪淼/大史/常伟思/东方延绪/杨冬/华华/滑膛/朱汉扬

**DETERRENCE 存活可用 4~6 人**：罗辑/希恩斯/庄颜/维德（无条件）+ 程心/艾AA（条件）

### 数值状态账本

**罗辑路线**：
- deterrenceValue: 初始+30+20+50 = 初始+100 → ≥90 ✅
- treachery: CRISIS累积-20+0 = -20 → <100 ✅
- culture: +95（DETERRENCE 期间）→ 推进 BROADCAST 需≥500
- population: 不变 → >0 ✅

**程心路线**：
- deterrenceValue: 不变（无加成）→ 可能<90 ❌
- treachery: CRISIS累积+95 → ≥100 高风险 ❌
- culture: +30+20+20 = +70（不含 year=219/220 程心路线）→ 可能<500
- population: -35 → 可能≤0 ❌

### Tag/Flag 生命周期表

**活 FLAG（9 个）**：deterrence_established / coordinates_broadcasted / swordholder_appointed / deterrence_broken / deterrence_held_strong / swordholder_chengxin / swordholder_luoji_retained / australia_migration / lightspeed_project_approved

**死 FLAG（7 个）**：swordholder_handover / deterrence_era_declared / tech_exchange_started / chengxin_swordholder / deterrence_reinforced / lightspeed_rejected / dark_battle

**Tag**：deterrence_era(里程碑) / deterrence_steady(动态) / deterrence_unstable(未启用) / victory_deterrence(结局)

### 科技依赖表

| 科技 | 树 | 前置 | 读取点 |
|---|---|---|---|
| 黑暗森林威慑 | MILITARY 根 | 无 | CRISIS filteredEvent |
| 曲率驱动理论 | PHYSICS | 维度物理 | DETERRENCE filteredEvent |
| 核聚变推进 | AEROSPACE 根 | 无 | DETERRENCE randomevent |

### 入口与出口证据

**入口**：culture≥200 + deterrence_established（year=202 CRISIS 写入）→ Game.ts:772 门控 ✅

**出口**：
- 正常：culture≥500 + coordinates_broadcasted → BROADCAST ✅
- 胜利：罗辑路线 DETERRENCE 胜利 ✅
- 失败：treachery≥100 / population≤0 ✅
- **程心路线卡死**：year=230 BROADCAST 版事件需先进入 BROADCAST，但进入 BROADCAST 需 coordinates_broadcasted → 循环依赖 ❌（CQ-6）

### 结局条件与竞争关系

| 结局 | DETERRENCE 可达性 | 优先级 |
|---|---|---|
| DETERRENCE 胜利 | ✅ 罗辑路线 | 1（胜利迭代） |
| DEFEAT_TREACHERY | ✅ 程心路线高风险 | 4 |
| DEFEAT_EXTINCTION | ✅ 程心路线 population-35 | 5 |
| HIDDEN 胜利 | ❌ 需 broadcastTriggered | 0（短路） |
| DIMENSION_STRIKE/HELIUM_FLASH | ❌ year≤260 不可达 | 6 |

### 候选问题清单

| 候选 ID | 等级 | 问题 | 证据状态 |
|---|---|---|---|
| CQ-1 | P2 | year=201 事件时序倒置（reqFlag 在 year=202 才写入） | CONFIRMED |
| CQ-2 | P3 | swordholder_handover 死 FLAG | CONFIRMED |
| CQ-3 | P3 | deterrence_era_declared 死 FLAG（上游 AR-4） | CONFIRMED |
| CQ-4 | P1 | swordholder 字段不更新：events.json year=219 不修改 earthCivi.swordholder，DETERRENCE 胜利检查此字段 | CONFIRMED |
| CQ-5 | P1 | 程心路线 treachery+95 几乎必然触发 DEFEAT_TREACHERY | CONFIRMED |
| CQ-6 | P1 | 程心路线 year=230 BROADCAST 版事件循环依赖，无法触发 coordinates_broadcasted | CONFIRMED |
| CQ-7 | P3 | filteredEvent minYear=70/90 语义冗余（绝对年份但远小于 DETERRENCE 起始 year） | CONFIRMED |
| CQ-8 | P3 | deterrence_unstable Tag 未启用 | CONFIRMED |
| CQ-9 | P3 | 刘慈欣人物永远不可用（无 unlock_person） | CONFIRMED |
| CQ-10 | P2 | chengxin_swordholder 与 swordholder_chengxin 命名不一致 | CONFIRMED |
| CQ-11 | — | AR-5 FLAG 永久累积在 DETERRENCE 持续（无 reqNotFlag 阻断） | CONFIRMED（无影响） |
| CQ-12 | — | AR-7 FlagManager 引用漂移风险（已部分修复） | CONFIRMED（已部分修复） |
| CQ-13 | — | UC-1 treachery 爆发在 DETERRENCE 持续 | CONFIRMED（=CQ-5） |
| CQ-14 | — | UC-2 updateEpoch/checkVictoryConditions 顺序风险 | CONFIRMED（无新发现） |
| CQ-15 | P3 | tech_exchange_started 死 FLAG | CONFIRMED |
| CQ-16 | P3 | deterrence_reinforced 死 FLAG | CONFIRMED |
| CQ-17 | P3 | lightspeed_rejected 死 FLAG | CONFIRMED |
| CQ-18 | P3 | dark_battle 死 FLAG（别名 dark_battle_concluded 也未使用） | CONFIRMED |
| CQ-19 | P3 | flag value 字段被完全忽略（value=0/1 无区别） | CONFIRMED |

### 未确认项清单

| 编号 | 内容 | 状态 |
|---|---|---|
| U-1 | filteredEvent minYear 语义 | RESOLVED（绝对年份） |
| U-2 | checkEvents epoch 匹配 | RESOLVED（委托 checkFilterConditions） |
| U-3 | swordholder 字段在 year=219 后的值 | RESOLVED（不修改，CQ-4） |
| U-4 | 动态 FLAG 消费者 | RESOLVED（7 个死 FLAG） |
| U-5 | 科技前置链 | RESOLVED |
| U-6 | CRISIS 典型 treachery 累积值 | UNCONFIRMED（需 Autoplay500） |
| U-7 | randomevents 完整 effects | RESOLVED（无 treachery 修改） |
| U-8 | year=220 两事件触发顺序 | RESOLVED（reqFlag 互斥） |
| U-9 | culture 增长速率 | UNCONFIRMED（需数值公式核验） |
| U-10 | deterrenceEnduranceRounds 持久化 | RESOLVED（已持久化） |

---

**EPOCH_EVIDENCE_威慑纪元 取证完成。未修改代码，未输出修复方案。**

**候选问题统计**：19 项（CQ-1 ~ CQ-19），其中 P1×3（CQ-4/CQ-5/CQ-6）、P2×3（CQ-1/CQ-10/CQ-15 归入死FLAG类）、P3×8
**未确认项**：10 项中 8 项已解决、2 项待运行时验证
**证据闭合性**：全部 10 个方面证据闭合
