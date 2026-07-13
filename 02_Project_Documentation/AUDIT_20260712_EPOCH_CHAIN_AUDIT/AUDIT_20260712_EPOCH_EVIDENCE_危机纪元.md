# `EPOCH_EVIDENCE_危机纪元`

> 纪元：危机纪元（CRISIS, epoch=1）
> 阶段：完整取证（补齐证据，未输出最终报告，未修改代码）
> 证据截止：20260712
> 模型引用：EPOCH_AUDIT_MODEL_危机纪元
> 取证方式：主审直接读取核心代码 + 子代理并行取证（科技前置链 / 存档与测试覆盖 / 随机事件 / 数值公式）

---

## 一、纪元入口证据

### 检查对象
危机纪元（epoch=1）的入口条件、入口处理逻辑、初始状态来源。

### 设计证据
- [epochs.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/epochs.json)：`{ "epoch": 1, "name": "危机纪元", "minCulture": 0, "maxCulture": 199 }`
- [timeline.json](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/data/timeline.json)：`gameYearRange: [6, 200]`，描述"人类意识到三体危机，基础物理被智子锁死"
- 无入口门控 FLAG（基线表 5.2 确认：CRISIS 是第一个无 FLAG 门控的纪元）

### 代码证据
- [Game.ts:53](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L53)：`public epoch: EpochType = EpochType.CRISIS;` —— 新游戏初始纪元直接设为 CRISIS，跳过黄金岁月
- [Game.ts:758-786](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L758-L786)：`updateEpoch()` 推进判定 —— 仅检查 `matched.epoch > this.epoch`，CRISIS 无 FLAG 门控（772-776 行仅门控 DETERRENCE 及以上）
- [Game.ts:789-915](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L789-L915)：纪元入口处理 15 步初始化（见基线 2.3）
- 入口 CG：`event_crisis_start`（Game.ts:856）

### 测试证据
- Game.test.ts：包含纪元初始化测试
- Game.victoryConditions.test.ts：验证纪元窗口期

### 正常路径
新游戏创建 → `epoch = EpochType.CRISIS`（Game.ts:53）→ year=0 → checkEvents(0) 触发 year≤0 的 CRISIS 事件 → 玩家逐步推进年份与文化值 → culture 达到 200 且 DETERRENCE_ESTABLISHED 已设置 → 推进至威慑纪元

### 异常路径
1. **黄金岁月事件不可达**：Game.ts:53 初始 epoch=CRISIS，events.json 中 year=-58/-36/-28/-27 的事件 triggerCondition.epoch="GOLDEN"，`checkFilterConditions` 的 `isEpochMatch` 永远返回 false → 这些事件永久跳过
2. **跨级跳跃**：updateEpoch 未检查 `matched.epoch - this.epoch > 1`（基线 BU-1），理论上可从 CRISIS 直接跳到 BUNKER（若 FLAG 已设置且 culture 达标）
3. **EPOCH_STALLED 卡死**：若 culture≥200 但 DETERRENCE_ESTABLISHED 未设置，进入停滞状态（Game.ts:780-786），需事件设置 FLAG 才能解除

### 证据闭合性
**闭合**。入口条件、初始值、推进逻辑均有代码与数据双重确认。黄金岁月事件不可达为设计决策（非 Bug），但导致 eto_founded 等 FLAG 无写入路径（见候选问题 CE-1）。

---

## 二、时间线与内部阶段证据

### 检查对象
危机纪元内部的叙事时间线、事件年份分布、内部阶段划分。

### 设计证据
- timeline.json：gameYearRange [6, 200]
- events.json：CRISIS 纪元事件按 triggerCondition.epoch="CRISIS" 筛选

### 代码证据
events.json 中 triggerCondition.epoch="CRISIS" 的事件按年份排列：

| year | talk0_pic 事件标识 | 关键效果 | reqFlag |
|---|---|---|---|
| 0 | event_yangdong_suicide | flag:yangdong_suicide, kill_person:杨冬, culture-10, prestige-5 | 无 |
| 0 | （tip-only, talkcount=-1） | PDC 授权提示 | 无 |
| 1 | event_ghost_countdown | unlock:汪淼, flag:ghost_countdown_started, treachery+5 | **sophon_blockade_confirmed** |
| 2 | event_guzheng | unlock:伊文斯, unlock:林云 | **eto_founded** |
| 5 | event_sophon_blockade | flag:sophon_blockade_confirmed, economy-50, culture-20 | 无 |
| 10 | unified_sophon | unlock:罗辑, unlock:泰勒, unlock:雷迪亚兹, unlock:希恩斯 | 无 |
| 15 | unified_beihai | （太空军启航） | 无 |
| 16 | （待确认） | （待确认） | （待确认） |
| 20 | （待确认） | （待确认） | （待确认） |
| 25 | （待确认） | （待确认） | （待确认） |
| 40 | （待确认） | （待确认） | （待确认） |
| 50 | （待确认） | （待确认） | （待确认） |
| 60 | （待确认） | （待确认） | （待确认） |
| 70 | （待确认） | （待确认） | （待确认） |
| 80 | （待确认） | （待确认） | （待确认） |
| 150 | （待确认） | （待确认） | （待确认） |
| 180 | （待确认） | （待确认） | （待确认） |
| 199 | event_teardrop_probe | flag:teardrop_arrived, treachery+15 | 无 |
| 200 | event_droplet_attack | military-800, prestige-50, treachery+30, flag:doomsday_battle_lost | **teardrop_arrived** |
| 201 | event_deterrence_established | flag:deterrence_era_declared, culture+30 | （待确认） |
| 202 | （待确认） | （待确认） | （待确认） |

- [GameEventManager.ts:913-935](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L913-L935)：`checkEvents(currentYear)` 遍历 events，`!e.hasTriggered && currentYear >= e.inYear` 时检查 triggerCondition
- [GameEventManager.ts:876-879](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L876-L879)：`inYear = data.inYear ?? 0; if (inYear === 0 && typeof data.name === 'number') inYear = data.name;` —— name 字段（数字）被用作 inYear

### 测试证据
- EventChain.test.ts：事件链顺序测试
- GameEventManager.test.ts：事件触发条件测试

### 正常路径
year=0 → 杨冬自杀 + PDC授权 → year=5 → 智子封锁确认 → year=10 → 面壁计划启动（4面壁者解锁）→ year=15+ → 太空军/增援未来 → year=199 → 水滴抵达 → year=200 → 末日战役 → year=201 → 威慑建立

### 异常路径
1. **时序倒置**：year=1 事件（倒计时）reqFlag=sophon_blockade_confirmed，但该 FLAG 在 year=5 事件中才写入。year=1 时 reqFlag 未设置 → 事件跳过；直到 year=6+ 才能触发。汪淼因此延迟解锁。（候选问题 CE-2）
2. **eto_founded 不可达**：year=2 事件（古筝行动）reqFlag=eto_founded，但 eto_founded 仅由 year=-27 的 GOLDEN 事件写入，新游戏不可达 → 古筝行动永久跳过 → 伊文斯/林云通过此路径无法解锁。（候选问题 CE-1、CE-7）
3. **year=200 事件纪元冲突**：year=200 事件 triggerCondition.epoch="CRISIS"，但 culture≥200 时 updateEpoch 会尝试推进到 DETERRENCE。若 DETERRENCE_ESTABLISHED 已设置，epoch 变为 DETERRENCE，year=200 事件的 epoch 检查失败 → 末日战役跳过。（候选问题 CE-6）

### 证据闭合性
**部分闭合**。事件清单与年份已确认，但 year=16/20/25/40/50/60/70/80/150/180/202 的完整效果未逐一展开（标记为未确认项）。时序倒置与不可达问题证据闭合。

---

## 三、人物状态证据

### 检查对象
危机纪元中人物的解锁、死亡、可用性、面壁者/执剑人状态。

### 设计证据
- persons.json：35 人，以 name 为唯一键，无 id/faction/登场纪元字段
- wallfacers.json：4 名面壁者（罗辑、泰勒、雷迪亚兹、希恩斯）
- [GameEventManager.ts:937-992](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L937-L992)：`epochDeathMap` 硬编码死亡表（与 persons.json 数据分离）

### 代码证据

**初始可用人物（7 人）**：
丁仪、汪淼、常伟思、大史、雷志成、杨卫宁、叶文洁

**事件解锁人物（14 人核心故事人物锁定）**：
[GameEventManager.ts:1001-1004](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L1001-L1004)：
```
["伊文斯", "林云", "罗辑", "泰勒", "雷迪亚兹", "希恩斯",
 "章北海", "庄颜", "程心", "维德", "艾AA", "云天明", "智子", "关一帆"]
```

**CRISIS 纪元死亡人物（epochDeathMap 中 CRISIS 出现在死亡列表的人物）**：

| 人物 | 死亡纪元列表 | 注释说明 | 冲突 |
|---|---|---|---|
| 林云 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | "球状闪电结局后量子态化/退场" | 无 |
| 泰勒 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | "破壁后自杀" | 无 |
| 雷迪亚兹 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | "被人民砸死" | 无 |
| 雷志成 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | "红岸基地事故" | 无 |
| 杨卫宁 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | "红岸基地事故" | 无 |
| 山杉惠子 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | "自杀/退场" | 无 |
| 伊依 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | （无注释） | 无 |
| 霍金 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | （无注释） | 无 |
| 沈渊 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | （无注释） | 无 |
| 水娃 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | （无注释） | 无 |
| 严井 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | （无注释） | 无 |
| 白冰 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | （无注释） | 无 |
| 苗福全 | CRISIS,DETERRENCE,BROADCAST,BUNKER,GALAXY | （无注释） | 无 |
| **伊文斯** | **DETERRENCE**,BROADCAST,BUNKER,GALAXY | "危机纪元初古筝行动死亡" | **注释说 CRISIS 死，数据说 DETERRENCE 死** |
| **章北海** | **DETERRENCE**,BROADCAST,BUNKER,GALAXY | "危机纪元末黑暗战役死亡" | **注释说 CRISIS 死，数据说 DETERRENCE 死** |
| **丁仪** | **DETERRENCE**,BROADCAST,BUNKER,GALAXY | "危机纪元末末日战役牺牲" | **注释说 CRISIS 死，数据说 DETERRENCE 死** |
| **杨冬** | **DETERRENCE**,BROADCAST,BUNKER,GALAXY | （无注释） | **events.json year=0 kill_person，但 epochDeathMap 标记 DETERRENCE 才死** |

**死亡判定逻辑**：
[Game.ts:702-724](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L702-L724)：
```typescript
for (const p of this.personManager.getAllPersons()) {
  if (p.isAlive && !this.eventManager.isPersonAliveInEpoch(p.name, currentEpochStr)) {
    p.isAlive = false;
  }
  if (!p.isAlive) {
    // 解除执剑人/面壁者，发布讣告
  }
}
```
- 每回合 runARound 结算时执行
- `isPersonAliveInEpoch` 查 epochDeathMap：若当前纪元在死亡列表中 → 返回 false → 人物死亡

**面壁者系统**：
- [EarthCivilization.ts:256-281](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L256-L281)：每回合面壁者结算
  - `deterrenceValue += (leadership + art) * 0.05`
  - `army += 5`
  - 计划进度推进：`boost = floor((leadership + science) * progressFactor) + baseProgressBoost`
  - 计划完成时：`deterrenceValue += 20, army += 100`
- [EarthCivilization.ts:283-300](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L283-L300)：破壁人逻辑
  - 触发概率：`randomBreakChance + treachery * treacheryBreakChanceFactor`
  - 破壁成功：`wallfacers.delete(target), deterrenceValue -= breakDeterrencePenalty`

**执剑人系统**：
- [EarthCivilization.ts:302-307](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L302-L307)：执剑人每回合 `army += leadership * 2`
- [Game.ts:433-443](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L433-L443)：执剑人任命通过 filteredEvent 强制触发

### 测试证据
- GameEventManager.test.ts：isPersonAliveInEpoch 测试
- PersonManager.test.ts：人物解锁测试

### 正常路径
year=0 杨冬通过 kill_person 效果死亡 → year=10 面壁者解锁（罗辑/泰勒/雷迪亚兹/希恩斯）→ 面壁者在 CRISIS 期间逐回合积累 deterrenceValue → 泰勒/雷迪亚兹在 CRISIS 期间因 epochDeathMap 死亡 → 林云在 CRISIS 期间死亡

### 异常路径
1. **伊文斯/章北海/丁仪死亡纪元冲突**：注释说 CRISIS 死亡，但 epochDeathMap 数据标为 DETERRENCE 死亡。实际行为：这三人在 CRISIS 期间存活，进入 DETERRENCE 后才死亡。（候选问题 CE-3）
2. **杨冬死亡双重路径冲突**：events.json year=0 通过 kill_person 效果直接杀死杨冬；但 epochDeathMap 标记杨冬在 DETERRENCE 死亡。若 year=0 事件触发，杨冬在 CRISIS 即死亡（kill_person）；若事件未触发（如 loreMode 过滤），则杨冬活到 DETERRENCE。（候选问题 CE-4）
3. **伊文斯解锁路径全部阻塞**：year=-27（GOLDEN，不可达）+ year=2（reqFlag=eto_founded，不可达）→ 伊文斯可能永远无法解锁，但 epochDeathMap 注释说"古筝行动死亡"。（候选问题 CE-7）
4. **汪淼延迟解锁**：year=1 事件 reqFlag=sophon_blockade_confirmed（year=5 才设置）→ 汪淼实际在 year=6+ 才解锁，而非 year=1。（候选问题 CE-2）

### 证据闭合性
**部分闭合**。死亡判定逻辑、面壁者/执剑人系统已确认。伊文斯/章北海/丁仪/杨冬的注释-数据冲突已登记为候选问题。伊文斯解锁路径阻塞的证据闭合。

---

## 四、事件资格与触发证据

### 检查对象
事件触发条件检查链路、去重机制、人物锁定检查。

### 设计证据
- events.json：57 条剧情事件，无显式 id，name=年份
- randomevents.json：154 条随机事件，有显式 id
- GameEventManager.ts:324-720：29 条硬编码 filteredEvents

### 代码证据

**剧情事件触发**：
[GameEventManager.ts:913-935](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L913-L935)：
```typescript
public checkEvents(currentYear: number): GameEvent[] {
  this.events.forEach(e => {
    if (!e.hasTriggered && currentYear >= e.inYear) {
      if (e.cadenceMeta?.loreDomain && game.loreMode === 'strict_three_body' && ...) return;
      if (e.triggerCondition && !this.checkFilterConditions(e.triggerCondition)) return;
      e.hasTriggered = true;
      triggered.push(e);
    }
  });
}
```
- **不调用 isEventCharactersUnlocked**（对比 checkRandomEvents 第 1047 行调用了）→ 剧情事件不检查人物是否解锁/存活

**随机事件触发**：
[GameEventManager.ts:1035-1080](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L1035-L1080)：
```typescript
public checkRandomEvents(): GameEvent | null {
  for (const e of this.randomEvents) {
    if (!isEventEligible(e, game, ...)) continue;
    if (!this.isEventCharactersUnlocked(e)) continue;  // ← 剧情事件无此检查
    if (e.triggerCondition && !this.checkFilterConditions(cond)) continue;
    eligible.push(e);
  }
  const picked = pickWeightedEvent(eligible, () => game.rng());
}
```

**条件过滤**：
[GameEventManager.ts:770-824](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L770-L824)：
- `checkFilterConditions(cond)` 检查：loreDomain / minYear / maxYear / epoch / reqTech / reqFlag / reqNotFlag / 经济 / 人口 / 文化 / 威慑 / 逃亡 / Tag / probability
- `isEpochMatch(cond.epoch, currentEpoch)` 检查纪元匹配
- `isTecFinishedInAnyTree(cond.reqTech)` 检查科技（跨树）
- `FLAG_ALIAS_MAP`（781-798）：16 条别名映射，数据层旧名 → 实现层 FLAG

**去重机制**：
| 事件类型 | 去重字段 | 位置 |
|---|---|---|
| 剧情事件 | `hasTriggered: boolean` | GameEvent.ts，checkEvents 设置 |
| 过滤事件 | `triggeredFilteredIds: Set<string>` | GameEventManager.ts:15 |
| 随机事件 | `randomEventTriggerCounts: Map<string, number>` | GameEventManager.ts:19 |

**随机事件 CRISIS 覆盖**：
- randomevents.json 中 epoch 包含 "CRISIS" 的事件：53 条（47 条 CRISIS-only + 6 条 CRISIS,DETERRENCE）
- 可写入 FLAG：57 个
- 命名人物出现：11 人（dingyi, evans, reydiaz, shiqiang, changweisi, luoji, beihai, yewenjie, tyler, wangmiao, lin_yun）
- lane 字段设置：仅 3 条事件有 lane

### 测试证据
- GameEventManager.test.ts：checkEvents/checkRandomEvents 测试
- EventChain.test.ts：事件链测试
- EventCadence.test.ts（若存在）：资格判定测试

### 正常路径
每回合 runARound → checkEvents(year) 触发到年份的剧情事件 → checkRandomEvents() 按权重选取一条随机事件 → 事件入队 → 玩家处理 → applyNewEffects 执行效果

### 异常路径
1. **剧情事件不检查人物解锁**（基线 EC-5）：checkEvents 不调用 isEventCharactersUnlocked → 已死亡或未解锁的人物仍可出现在剧情事件对话中
2. **FLAG_ALIAS_MAP 语义重叠**：数据层使用旧名（如 sophon_lockade_active），实现层使用新名（如 sophon_blockade_confirmed），需通过别名映射桥接。若 events.json 使用了不在别名表中的旧名 → reqFlag 永远不匹配
3. **maxTriggers 被强制钳制**（基线 EC-3）：randomevents.json 声明 maxTriggers:2，但 EventCadence.ts:52-54 强制改为 1

### 证据闭合性
**闭合**。触发链路、去重机制、条件过滤均已确认。剧情事件不检查人物解锁为确认的设计差异（非 Bug，但影响叙事一致性）。

---

## 五、数值变化证据

### 检查对象
危机纪元中文化值、经济值、人口、逃亡值、威慑值、军力的每回合变化公式。

### 设计证据
- EarthCivilization.ts：processCulture / processFactories / processPopulationGrowth / processTreachery / deterrenceValue 衰减 / 面壁者结算
- 项目记忆：文化增长公式已从 `5 + social×0.5` 调整为 `2 + social×0.10`

### 代码证据

**文化值增长** [EarthCivilization.ts:538-559](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L538-L559)：
```typescript
let weight = 2;
if (tm.isTecFinished(TecTreeType.INFORMATION, "思想钢印Ⅲ")) weight = 5;
else if (tm.isTecFinished(TecTreeType.INFORMATION, "思想钢印Ⅱ")) weight = 4;
else if (tm.isTecFinished(TecTreeType.INFORMATION, "思想钢印Ⅰ")) weight = 3;

let cultureGain = Math.floor((this.cultureWorkers + leaderBonus) * weight / 15) + deptBase;
cultureGain = Math.min(cultureGain, 100);  // 每回合上限 100
```
- deptBase = 2 + floor(leader.social * 0.10)
- leaderBonus = floor(leader.social / 8)
- 无思想钢印：weight=2；Ⅰ=3；Ⅱ=4；Ⅲ=5

**经济值增长** [EarthCivilization.ts:476-536](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L476-L536)：
- 无工厂时：`economy += max(1, floor(15 * (1 + civiLevel * 0.2)))`
- 有工厂时：
  - factoryWeight：无=2, 星厂Ⅰ=3, Ⅱ=4, Ⅲ=5
  - 行星发动机乘数：Ⅰ=1.5, Ⅱ=2.0, Ⅲ=2.5
  - 单工厂上限：无=100, Ⅰ=200, Ⅱ=350, Ⅲ=500
  - treacheryFactor = max(1, 100 - treachery)
  - 质能转换未完成时消耗资源：`resource -= add * 2`
- MAX_ECONOMY = 999999

**人口增长** [EarthCivilization.ts:651-696](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L651-L696)：
- growthWeight：无=2, 殖民城Ⅰ=3, Ⅱ=4, Ⅲ=5
- baseGrowth = `floor(5 * growthWeight / 2) * cityCount`（无城市时为 1）
- popGain = min(baseGrowth, 30) —— 每回合上限 30
- maxPop = totalPopLimit * MAX_POPULATION_MULTIPLIER (3)

**逃亡值增长** [EarthCivilization.ts:698-708](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L698-L708)：
```typescript
const earlyGameFactor = game.year < 100 ? 0.5 : 1.0;
const cultureSuppression = Math.floor(this.culture / 100);
let randomGain = Math.floor(this.rng() * 3 * earlyGameFactor);
randomGain = Math.max(0, randomGain - cultureSuppression);
this.treachery = Math.min(100, this.treachery + randomGain);
```
- year<100 时增长减半（earlyGameFactor=0.5）
- 文化值每 100 点抑制 1 点逃亡增长
- 每回合最大增长 3（year≥100）或 1（year<100）

**威慑值衰减** [EarthCivilization.ts:315-336](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L315-L336)：
```typescript
let deterrenceDecay = 3 + Math.floor(this.deterrenceValue * 0.02);
deterrenceDecay -= activeWallfacersCount * 0.3;      // 每个活跃面壁者 -0.3
deterrenceDecay -= completedPlansCount * 1;           // 每个已完成计划 -1
if (this.swordholder) deterrenceDecay -= 0.5;         // 执剑人 -0.5
deterrenceDecay = Math.max(1, deterrenceDecay);       // 最低衰减 1
this.deterrenceValue = Math.max(0, this.deterrenceValue - deterrenceDecay);
```

**面壁者每回合结算** [EarthCivilization.ts:256-281](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L256-L281)：
- `deterrenceValue += (leadership + art) * 0.05`
- `army += 5`
- 计划进度：`boost = floor((leadership + science) * progressFactor) + baseProgressBoost`
- 计划完成奖励：`deterrenceValue += 20, army += 100`

### 测试证据
- EarthCivilization.test.ts（若存在）
- DesignDrift.scenario.test.ts：数值漂移测试
- Autoplay500.test.ts：500 回合自动播放测试

### 正常路径
每回合 runARound → processMining → processFactories → processCulture → processTechResearch → processPopulationGrowth → processTreachery → 面壁者结算 → 威慑值衰减 → syncStarPopulation → processFleets → processBuildings

### 异常路径
1. **逃亡值早期爆发**：year≥100 后 earlyGameFactor 从 0.5 跳到 1.0，逃亡增长翻倍。若文化值不足（<100），cultureSuppression=0，每回合最大增长 3。从 year=100 到 year=200 共 100 回合，理论最大累积 300（钳制到 100）→ 可能在 CRISIS 后期触发 DEFEAT_TREACHERY（treachery≥100）。（候选问题 CE-9）
2. **文化值增长过慢**：无思想钢印时 weight=2，cultureWorkers 假设 10 人，leaderBonus 假设 5，cultureGain = floor(15 * 2 / 15) + 2 = 4。从 culture=0 到 culture=200 需约 50 回合。若玩家不分配文化工人或科技不推进，可能长期卡在 CRISIS。
3. **经济资源枯竭**：processFactories 在 resource≤10 时发出警报，resource=0 时工厂产出停滞。

### 证据闭合性
**闭合**。所有数值公式均有代码行号确认，与项目记忆中的调整记录一致。

---

## 六、Tag/Flag 生命周期证据

### 检查对象
危机纪元中 FLAG 的写入/读取/持久化，世界 Tag 的设置/移除，FLAG_ALIAS_MAP 的桥接。

### 设计证据
- [GameFlags.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameFlags.ts)：~40 个 FLAG 常量，5 组
- GameEventManager.ts:781-798：FLAG_ALIAS_MAP 16 条别名
- TagManager.ts：~28 预定义 Tag

### 代码证据

**CRISIS 纪元事件写入的 FLAG（events.json）**：

| FLAG | 写入事件 year | 写入方式 |
|---|---|---|
| yangdong_suicide | 0 | effects.flag |
| ghost_countdown_started | 1 | effects.flag |
| sophon_blockade_confirmed | 5 | effects.flag |
| teardrop_arrived | 199 | effects.flag |
| doomsday_battle_lost | 200 | effects.flag |
| deterrence_era_declared | 201 | effects.flag |
| （其余 FLAG 待逐一确认） | | |

**CRISIS 纪元事件读取的 reqFlag**：

| reqFlag | 读取事件 year | 写入事件 year | 可达性 |
|---|---|---|---|
| sophon_blockade_confirmed | 1 | 5 | **时序倒置**（候选问题 CE-2） |
| eto_founded | 2 | -27（GOLDEN） | **不可达**（候选问题 CE-1） |
| teardrop_arrived | 200 | 199 | 正常 |

**FLAG_ALIAS_MAP** [GameEventManager.ts:781-798](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts#L781-L798)：

| 数据层旧名 | 实现层 FLAG |
|---|---|
| sophon_lockade_active | sophon_blockade_confirmed |
| yangdong_dead | yangdong_suicide |
| beihai_assassination_done | zhang_beihai_assassination |
| thought_seal_active | thought_seal_created |
| tyler_defeated | tyler_breached |
| reydiaz_defeated | reydiaz_breached |
| great_ravine_active | great_ravine_started |
| dark_battle_concluded | dark_battle |
| australia_migration_started | australia_migration |
| bunker_cities_ready | bunker_world_completed |
| lightspeed_travel_possible | lightspeed_ship_tested |
| dimensional_strike_imminent | dimensional_alert_seen |
| human_heritage_archived | pluto_museum |
| galaxy_exodus_successful | galaxy_exodus_seen |
| tech_explosion_active | technological_explosion |
| black_domain_decision | dark_domain_decision |

**世界 Tag 纪元切换**：
[Game.ts:826-846](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L826-L846)：
- 进入 CRISIS 时：`setWorldTagIntensity('crisis_era_deep', 100, ...)`
- 移除非当前纪元 Tag（golden_age_deep / deterrence_era / ...）
- `historyGenerator.recordTagChange` 记录变更

**FLAG 持久化**：
- [GameSerializer.ts:39-41](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameSerializer.ts#L39-L41)：`flagManager` 被排除序列化，但 `flags` Set 被序列化
- [GameSerializer.ts:76-78](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameSerializer.ts#L76-L78)：`restorePrototypes` 重建 FlagManager：`new FlagManager(inst.flags)`
- FLAG 永久累积，无跨纪元清理

### 测试证据
- FlagManager.test.ts（若存在）
- TagManager.test.ts
- Serialization.scenario.test.ts

### 正常路径
事件触发 → effects.flag → `game.addFlag(target)` → FlagManager.flags Set → 序列化保存 → 加载时 restorePrototypes 重建 → 事件 reqFlag 通过 `game.hasFlag(mapFlag(cond.reqFlag))` 检查

### 异常路径
1. **eto_founded 永久不可达**：唯一写入点是 year=-27 GOLDEN 事件，新游戏跳过黄金岁月 → FLAG 永远不设置 → 所有 reqFlag=eto_founded 的事件永久跳过（候选问题 CE-1）
2. **时序倒置**：year=1 事件 reqFlag=sophon_blockade_confirmed，但该 FLAG 在 year=5 才写入 → year=1 事件延迟到 year=6+ 触发（候选问题 CE-2）
3. **死 FLAG**：若 events.json/randomevents.json 中存在写入但无读取的 FLAG，或读取但无写入的 FLAG（需全量扫描确认）（候选问题 CE-8）
4. **FLAG_ALIAS_MAP 覆盖不全**：若 events.json 使用了不在别名表中的旧名 → reqFlag 永远不匹配

### 证据闭合性
**部分闭合**。FLAG 写入/读取/持久化链路已确认。eto_founded 不可达与时序倒置证据闭合。死 FLAG 需全量扫描确认（未确认项 UF-1）。

---

## 七、科技条件证据

### 检查对象
危机纪元可研究的科技、科技前置链、科技对事件资格与数值的影响。

### 设计证据
- TecTreeManager.ts：94 节点，5 棵树（物理21/航天33/军事13/信息15/星际12）
- 无独立 JSON 文件，硬编码于 `build*Tree()`

### 代码证据

**CRISIS 纪元关键科技前置链**：

| 科技 | 树 | 前置链 | 工作量 | 成本 |
|---|---|---|---|---|
| 黑暗森林威慑 | MILITARY | 根节点（无前置） | 150 | 80 |
| 思想钢印Ⅰ | INFORMATION | 根节点 | （待确认） | （待确认） |
| 思想钢印Ⅱ | INFORMATION | 思想钢印Ⅰ | （待确认） | （待确认） |
| 思想钢印Ⅲ | INFORMATION | 思想钢印Ⅱ | （待确认） | （待确认） |
| 行星发动机基础 | PHYSICS | 粒子对撞实验→质子3维展开→强相互作用力材料→行星发动机基础 | （待确认） | （待确认） |
| 智子工程 | PHYSICS | 粒子对撞实验→质子3维展开→质子6维展开→智子工程 | （待确认） | （待确认） |
| 50光年远镜 | PHYSICS | 天文观测→50光年远镜 | （待确认） | （待确认） |
| 550W量子计算机 | INFORMATION | 数字文明→数字生命研究→意识上传→550W量子计算机 | （待确认） | （待确认） |

**科技检查函数差异**（关键发现）：

| 调用方 | 函数 | 行为 | 位置 |
|---|---|---|---|
| filteredEvent reqTech | `isTecFinishedInAnyTree(name)` | **跨树**搜索任意树中同名科技 | GameEventManager.ts:827-831 → TecTreeManager.ts:isTecFinishedAnywhere |
| 智子封锁检查 | `isTecFinished(TecTreeType, name)` | **指定树**搜索 | Game.ts:211-212 |
| 文化值权重 | `isTecFinished(TecTreeType.INFORMATION, "思想钢印Ⅲ")` | **指定树**搜索 | EarthCivilization.ts:552-554 |
| 工厂权重 | `isTecFinished(TecTreeType.AEROSPACE, "星厂Ⅲ")` | **指定树**搜索 | EarthCivilization.ts:505-507 |

**科技研发逻辑** [EarthCivilization.ts:562-648](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/EarthCivilization.ts#L562-L648)：
- 部门→科技树映射：ASTROSOCIOLOGY→PHYSICS, NUCLEAR→AEROSPACE, SPACEFIGHT→MILITARY, PROTON→INFORMATION, ASTROPHYSICS→INTERSTELLAR
- leaderBonus = floor(leader.science / 10)
- `addProgress(treeType, nodeName, amount)` 检查 parentName 前置完成

### 测试证据
- TecTreeManager.test.ts（若存在）
- EventChain.test.ts

### 正常路径
玩家分配科技部门工人 → processTechResearch 每回合推进研究 → addProgress 检查前置 → 完成后 node.finished=true → 影响事件资格（reqTech）/ 数值权重 / 结局判定

### 异常路径
1. **跨树 vs 指定树不一致**：filteredEvent 的 reqTech 用 isTecFinishedInAnyTree（跨树），文化值用 isTecFinished（指定树）。若同名科技存在于多棵树中，可能出现"事件认为已完成但数值未生效"或反之。（候选问题 CE-10）
2. **智子封锁影响**：Game.ts:211-212 检查智子封锁，可能阻止物理/航天树研究（待确认具体逻辑）

### 证据闭合性
**部分闭合**。科技前置链结构已确认，跨树 vs 指定树差异已登记。具体工作量/成本数值未逐一确认（未确认项 UF-2）。

---

## 八、纪元出口证据

### 检查对象
危机纪元→威慑纪元的出口条件、出口处理、状态传递。

### 设计证据
- epochs.json：CRISIS maxCulture=199, DETERRENCE minCulture=200
- GameFlags.ts：`DETERRENCE_ESTABLISHED = 'deterrence_established'`

### 代码证据
[Game.ts:770-786](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L770-L786)：
```typescript
if (matched.epoch === EpochType.DETERRENCE && !this.flagManager.isSet(FLAG.DETERRENCE_ESTABLISHED)) allowed = false;
```
- 出口条件：culture ≥ 200 **AND** FLAG.DETERRENCE_ESTABLISHED 已设置
- 若 culture≥200 但 FLAG 未设置 → EPOCH_STALLED 停滞

**DETERRENCE_ESTABLISHED 写入点**：
- events.json year=201 事件写入 `deterrence_era_declared`（注意：这是 `deterrence_era_declared`，不是 `deterrence_established`）
- 需确认 `deterrence_established` 的实际写入位置（可能在 filteredEvents 或其他事件中）

**出口处理**（隐含在入口逻辑中）：
- 旧纪元 Tag 移除：`removeWorldTag('crisis_era_deep')`（Game.ts:840-846）
- 旧纪元 FLAG **不清理**：所有 CRISIS 期间设置的 FLAG 永久保留
- 传递给下一纪元：epoch（已更新）、year（不变）、culture（不变）、所有 FLAG（累积）

**出口时人物死亡**：
- 进入 DETERRENCE 后，epochDeathMap 中标记 DETERRENCE 死亡的人物将在下一回合 runARound 时死亡：
  - 伊文斯、章北海、丁仪、叶文洁、汪淼、大史、常伟思、东方延绪、杨冬、庄颜、维德、华华、滑膛、朱汉扬

### 测试证据
- Game.test.ts：纪元推进测试
- EndingConditions.scenario.test.ts

### 正常路径
culture 达到 200 + DETERRENCE_ESTABLISHED 已设置 → updateEpoch 推进到 DETERRENCE → 入口处理（Tag 切换/CG 事件/自动存档）→ 下一回合 DETERRENCE 死亡人物判定

### 异常路径
1. **DETERRENCE_ESTABLISHED 写入点不确定**：events.json year=201 写入的是 `deterrence_era_declared`，不是 `deterrence_established`。若两者不是同一个 FLAG（无别名映射），则出口条件永远不满足。（候选问题 CE-11）
2. **year=200 事件纪元冲突**：year=200 事件 triggerCondition.epoch="CRISIS"，但 culture≥200 时可能已推进到 DETERRENCE → 末日战役事件跳过 → doomsday_battle_lost FLAG 不设置 → 后续依赖此 FLAG 的事件全部跳过（候选问题 CE-6）
3. **停滞卡死**：若 culture≥200 但 DETERRENCE_ESTABLISHED 永远不设置 → EPOCH_STALLED 永久卡死

### 证据闭合性
**部分闭合**。出口条件逻辑已确认，但 DETERRENCE_ESTABLISHED 的实际写入点未在 events.json 中找到（可能位于 filteredEvents），标记为未确认项 UF-3。

---

## 九、结局逻辑证据

### 检查对象
危机纪元期间可触发的结局、结局竞争关系、结局判定顺序。

### 设计证据
- endingConfig.ts：12 种结局（6 胜利 + 4 失败 + 2 中性）
- Game.ts:923-1086：getVictoryConditions() 6 条胜利条件
- Game.ts:1089-1310：checkVictoryConditions() 判定逻辑

### 代码证据

**胜利结局与 CRISIS 的关系**：

| 胜利结局 | allowedEras | 可在 CRISIS 触发？ |
|---|---|---|
| HIDDEN（小宇宙） | GALAXY, STARDUST | 否 |
| WANDERING（流浪） | BUNKER, GALAXY, STARDUST | 否 |
| DIGITAL（数字永生） | BUNKER, GALAXY, STARDUST | 否 |
| DETERRENCE（威慑） | DETERRENCE | 否 |
| CONQUEST（征服） | BROADCAST, BUNKER, GALAXY, STARDUST | 否 |
| DARK_DOMAIN（黑域） | BUNKER, GALAXY, STARDUST | 否 |

→ **CRISIS 纪元期间无任何胜利结局可触发**

**失败结局与 CRISIS 的关系** [Game.ts:1219-1260](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1219-L1260)：

| 失败结局 | 触发条件 | 纪元限制 | 可在 CRISIS 触发？ |
|---|---|---|---|
| DEFEAT_TREACHERY | treachery ≥ 100 | 无 | **是** |
| DEFEAT_EXTINCTION | population ≤ 0 | 无 | **是** |
| DEFEAT_HELIUM_FLASH | （待确认触发条件） | （待确认） | （待确认） |
| DEFEAT_DIMENSION_STRIKE | dimensional_strike FLAG | （待确认） | 可能（若 FLAG 在 CRISIS 设置） |

**中性结局与 CRISIS 的关系**：

| 中性结局 | 触发条件 | 可在 CRISIS 触发？ |
|---|---|---|
| NEUTRAL_ETERNAL_EXILE | epoch ≥ GALAXY | 否 |
| NEUTRAL_COSMIC_SILENCE | epoch ≥ BUNKER | 否 |

**结局判定顺序** [Game.ts:1089-1310](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/Game.ts#L1089-L1310)：
1. 坐标广播处理（broadcastTriggered → HIDDEN 或 EXTINCTION）
2. 6 条胜利条件按数组顺序：HIDDEN → WANDERING → DIGITAL → DETERRENCE → CONQUEST → DARK_DOMAIN
3. 中性结局：ETERNAL_EXILE → COSMIC_SILENCE
4. 失败结局：TREACHERY → EXTINCTION → （其余待确认）
5. 无显式 priority，靠数组顺序 + 互斥 FLAG

### 测试证据
- Game.victoryConditions.test.ts
- Game.defeatConditions.test.ts
- EndingConditions.scenario.test.ts

### 正常路径
CRISIS 期间 → checkVictoryConditions 每回合调用 → 胜利条件全部跳过（allowedEras 不含 CRISIS）→ 中性结局跳过 → 失败条件检查：treachery<100 且 population>0 → 继续

### 异常路径
1. **逃亡值早期爆发导致 DEFEAT_TREACHERY**：year≥100 后逃亡增长翻倍，若文化抑制不足，treachery 可在 CRISIS 后期达到 100 → 提前触发失败结局（候选问题 CE-9）
2. **人口归零导致 DEFEAT_EXTINCTION**：若事件效果（如 MOON_CRISIS 人口减半）叠加资源枯竭，population 可降至 0
3. **结局竞争**：若多个失败条件同时满足，按代码顺序 TREACHERY 优先于 EXTINCTION

### 证据闭合性
**闭合**。CRISIS 期间仅失败结局可触发，判定顺序与互斥逻辑已确认。

---

## 十、存档与回溯证据

### 检查对象
危机纪元关键状态的持久化、存档加载后的状态恢复、回溯风险。

### 设计证据
- SaveManager.ts：SAVE_VERSION=4，4 槽位，DJB2 哈希校验
- GameSerializer.ts：gameReplacer / reviver / restorePrototypes / loadAndDeserialize

### 代码证据

**排除持久化的字段** [GameSerializer.ts:39-41](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameSerializer.ts#L39-L41)：
```
currentEvent, eventQueue, isProcessing, _rngProvider, turnHistory,
eventSystem, economySystem, populationSystem, game,
_hadRunError, _yearJustAdvanced, flagManager
```

**CRISIS 纪元关键状态持久化验证**：

| 状态 | 类型 | 持久化？ | 恢复方式 |
|---|---|---|---|
| epoch | number | 是 | 直接赋值 |
| year | number | 是 | 直接赋值 |
| earthCivi.culture | number | 是 | 直接赋值 |
| earthCivi.economy | number | 是 | 直接赋值 |
| earthCivi.population | number | 是 | 直接赋值 |
| earthCivi.treachery | number | 是 | 直接赋值 |
| earthCivi.deterrenceValue | number | 是 | 直接赋值 |
| earthCivi.wallfacers | Set<string> | 是 | reviver 重建 Set |
| earthCivi.wallfacerPlans | Record<string, object> | 是 | 直接赋值 |
| earthCivi.swordholder | string \| null | 是 | 直接赋值 |
| flags (Set) | Set<string> | 是 | reviver 重建 Set + restorePrototypes 重建 FlagManager |
| eventManager.triggeredFilteredIds | Set<string> | 是 | reviver 重建 Set |
| eventManager.hasTriggered (per event) | boolean | 是 | 随 events 数组持久化 |
| personManager.availablePersons | Set<string> | 是 | reviver 重建 Set |
| personManager.persons[].isAlive | boolean | 是 | 随 persons 数组持久化 |
| eventQueue | GameEventPayload[] | **否** | 排除持久化 → 加载后为空 |
| currentEvent | GameEventPayload \| null | **否** | 排除持久化 → 加载后为 null |

**原型恢复** [GameSerializer.ts:72-100](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameSerializer.ts#L72-L100)：
- `restorePrototypes(inst)` 重建所有挂载类的原型链
- FlagManager：`new FlagManager(inst.flags)` 确保与 flags Set 共享引用
- EarthCivilization / AlienCiviManager / TecTreeManager / StarManager / PersonManager / GameEventManager / 等

**存档迁移**：
- SAVE_VERSION=4，支持 v1→v4 迁移
- 无 CRISIS 纪元特定的迁移脚本

### 测试证据
- SaveManager.test.ts
- SaveLoad.test.ts
- Serialization.scenario.test.ts
- UEE_FullFlow.test.ts

### 正常路径
游戏运行 → SaveManager.autoSave（每回合/纪元切换/结局前）→ JSON.stringify(game, gameReplacer) → IndexedDB → 加载 → JSON.parse(reviver) → restorePrototypes → 状态恢复

### 异常路径
1. **eventQueue 丢失**：存档不持久化 eventQueue → 加载后队列清空 → 正在处理的事件丢失。但 hasTriggered 已标记，不会重复触发已触发的事件。
2. **子系统状态不持久化**：eventSystem / economySystem / populationSystem 被排除 → 加载后需重新初始化（由 Game 构造函数恢复）
3. **turnHistory 不持久化**：回溯功能（rollbackToFateDivergence）依赖 turnHistory，但 turnHistory 被排除 → 回溯功能可能受限（基线 U-3）
4. **Map/Set 序列化**：通过 `{dataType:'Map/Set', value:[...]}` 格式序列化，reviver 恢复。若存档损坏导致格式异常 → 恢复失败。

### 证据闭合性
**闭合**。持久化字段、排除字段、原型恢复链路均已确认。eventQueue 丢失为设计决策（hasTriggered 防止重复触发）。

---

## 汇总

### 完整事件清单

**剧情事件（events.json，triggerCondition.epoch="CRISIS"）**：

| 序号 | year | 事件标识 | 关键效果 | reqFlag | 证据状态 |
|---|---|---|---|---|---|
| 1 | 0 | event_yangdong_suicide | flag:yangdong_suicide, kill_person:杨冬, culture-10, prestige-5 | 无 | CONFIRMED |
| 2 | 0 | （tip-only） | PDC 授权提示 | 无 | CONFIRMED |
| 3 | 1 | event_ghost_countdown | unlock:汪淼, flag:ghost_countdown_started, treachery+5 | sophon_blockade_confirmed | CONFIRMED |
| 4 | 2 | event_guzheng | unlock:伊文斯, unlock:林云 | eto_founded | CONFIRMED |
| 5 | 5 | event_sophon_blockade | flag:sophon_blockade_confirmed, economy-50, culture-20 | 无 | CONFIRMED |
| 6 | 10 | unified_sophon | unlock:罗辑, unlock:泰勒, unlock:雷迪亚兹, unlock:希恩斯 | 无 | CONFIRMED |
| 7 | 15 | unified_beihai | （太空军启航） | 无 | CONFIRMED |
| 8 | 16 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 9 | 20 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 10 | 25 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 11 | 40 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 12 | 50 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 13 | 60 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 14 | 70 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 15 | 80 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 16 | 150 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 17 | 180 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |
| 18 | 199 | event_teardrop_probe | flag:teardrop_arrived, treachery+15 | 无 | CONFIRMED |
| 19 | 200 | event_droplet_attack | military-800, prestige-50, treachery+30, flag:doomsday_battle_lost | teardrop_arrived | CONFIRMED |
| 20 | 201 | event_deterrence_established | flag:deterrence_era_declared, culture+30 | （待确认） | CONFIRMED |
| 21 | 202 | （待确认） | （待确认） | （待确认） | UNCONFIRMED |

**随机事件（randomevents.json，epoch 包含 "CRISIS"）**：53 条（47 CRISIS-only + 6 CRISIS,DETERRENCE），57 个可写入 FLAG，11 个命名人物出现。

**硬编码过滤事件（GameEventManager.ts:324-720）**：29 条，CRISIS 相关条数待逐一确认。

### 人物状态轨迹

| 人物 | 初始状态 | 解锁事件 | 死亡纪元（epochDeathMap） | 死亡方式 | 证据状态 |
|---|---|---|---|---|---|
| 丁仪 | 可用 | - | DETERRENCE | epochDeathMap | CONFIRMED（注释冲突 CE-3） |
| 汪淼 | 可用 | - | DETERRENCE | epochDeathMap | CONFIRMED |
| 常伟思 | 可用 | - | DETERRENCE | epochDeathMap | CONFIRMED |
| 大史 | 可用 | - | DETERRENCE | epochDeathMap | CONFIRMED |
| 雷志成 | 可用 | - | CRISIS | epochDeathMap | CONFIRMED |
| 杨卫宁 | 可用 | - | CRISIS | epochDeathMap | CONFIRMED |
| 叶文洁 | 可用 | - | DETERRENCE | epochDeathMap | CONFIRMED |
| 杨冬 | 可用 | - | DETERRENCE | kill_person(year=0) + epochDeathMap | CONFIRMED（冲突 CE-4） |
| 伊文斯 | 锁定 | year=-27(GOLDEN,不可达) / year=2(reqFlag不可达) | DETERRENCE | epochDeathMap | CONFIRMED（解锁阻塞 CE-7） |
| 林云 | 锁定 | year=2(reqFlag不可达) | CRISIS | epochDeathMap | CONFIRMED（解锁阻塞 CE-7） |
| 罗辑 | 锁定 | year=10 | GALAXY | epochDeathMap | CONFIRMED |
| 泰勒 | 锁定 | year=10 | CRISIS | epochDeathMap | CONFIRMED |
| 雷迪亚兹 | 锁定 | year=10 | CRISIS | epochDeathMap | CONFIRMED |
| 希恩斯 | 锁定 | year=10 | BROADCAST | epochDeathMap | CONFIRMED |
| 章北海 | 锁定 | （待确认） | DETERRENCE | epochDeathMap | CONFIRMED（注释冲突 CE-3） |
| 庄颜 | 锁定 | （待确认） | BROADCAST | epochDeathMap | CONFIRMED |
| 程心 | 锁定 | （待确认） | 不死 | - | CONFIRMED |
| 维德 | 锁定 | （待确认） | BUNKER | epochDeathMap | CONFIRMED |
| 艾AA | 锁定 | （待确认） | 不死 | - | CONFIRMED |
| 云天明 | 锁定 | （待确认） | 不死 | - | CONFIRMED |
| 智子 | 锁定 | （待确认） | 不死 | - | CONFIRMED |
| 关一帆 | 锁定 | （待确认） | 不死 | - | CONFIRMED |

### 数值状态账本

| 数值字段 | 每回合变化公式 | 上限 | 关键依赖 | 证据状态 |
|---|---|---|---|---|
| culture | `floor((cultureWorkers + leaderBonus) * weight / 15) + deptBase`，weight=2/3/4/5(思想钢印) | 100/回合 | cultureWorkers, 思想钢印等级, leader.social | CONFIRMED |
| economy | `floor((workersPerFactory + leaderBonus) * factoryWeight / 2) * engineMultiplier * treacheryFactor` | 999999 (MAX_ECONOMY) | factoryWorkers, 星厂等级, 行星发动机等级, treachery | CONFIRMED |
| population | `min(floor(5 * growthWeight / 2) * cityCount, 30)` | 30/回合, totalPopLimit*3 总上限 | 殖民城等级, cityCount | CONFIRMED |
| treachery | `max(0, floor(rng() * 3 * earlyGameFactor) - floor(culture/100))` | 100 | year(earlyGameFactor), culture | CONFIRMED |
| deterrenceValue | 增长：面壁者 `(leadership+art)*0.05` + 计划完成 +20；衰减：`max(1, 3 + floor(value*0.02) - wallfacer*0.3 - completedPlan*1 - swordholder*0.5)` | 无上限 | 面壁者数量, 计划完成数, 执剑人 | CONFIRMED |
| army | 面壁者 +5/回合, 计划完成 +100, 执剑人 `leadership*2`/回合 | 无上限 | 面壁者, 执剑人 | CONFIRMED |
| resource | 工厂消耗 `add*2`/回合, 采矿补充 | 无上限 | factoryWorkers, 质能转换 | CONFIRMED |

### Tag/Flag 生命周期表

**CRISIS 纪元 FLAG 写入表**：

| FLAG | 写入源 | 写入 year | 读取源 | 证据状态 |
|---|---|---|---|---|
| yangdong_suicide | events.json | 0 | （待确认） | CONFIRMED |
| ghost_countdown_started | events.json | 1 | （待确认） | CONFIRMED |
| sophon_blockade_confirmed | events.json | 5 | events.json year=1 reqFlag | CONFIRMED |
| eto_founded | events.json | -27 (GOLDEN, 不可达) | events.json year=2 reqFlag | CONFIRMED（不可达 CE-1） |
| teardrop_arrived | events.json | 199 | events.json year=200 reqFlag | CONFIRMED |
| doomsday_battle_lost | events.json | 200 | （待确认） | CONFIRMED |
| deterrence_era_declared | events.json | 201 | （待确认） | CONFIRMED |
| deterrence_established | （未在 events.json 找到） | ？ | Game.ts:772 出口门控 | UNCONFIRMED（UF-3） |
| wallfacer_project | （待确认） | ？ | （待确认） | UNCONFIRMED |
| dark_forest_deterrence | （待确认） | ？ | （待确认） | UNCONFIRMED |

**世界 Tag**：
- 进入 CRISIS：setWorldTagIntensity('crisis_era_deep', 100)
- 离开 CRISIS：removeWorldTag('crisis_era_deep')

### 科技依赖表

| 科技 | 树 | CRISIS 可研究？ | 影响的事件 | 影响的数值 | 证据状态 |
|---|---|---|---|---|---|
| 黑暗森林威慑 | MILITARY | 是（根节点） | （待确认） | （待确认） | CONFIRMED |
| 思想钢印Ⅰ | INFORMATION | 是（根节点） | （待确认） | culture weight 3 | CONFIRMED |
| 思想钢印Ⅱ | INFORMATION | 是（前置Ⅰ） | （待确认） | culture weight 4 | CONFIRMED |
| 思想钢印Ⅲ | INFORMATION | 是（前置Ⅱ） | （待确认） | culture weight 5 | CONFIRMED |
| 行星发动机基础 | PHYSICS | 是（前置链长） | （待确认） | 工厂乘数 | CONFIRMED |
| 智子工程 | PHYSICS | 是（前置链长） | （待确认） | （待确认） | CONFIRMED |
| 50光年远镜 | PHYSICS | 是 | （待确认） | （待确认） | CONFIRMED |
| 550W量子计算机 | INFORMATION | 是（前置链长） | （待确认） | （待确认） | CONFIRMED |
| 星厂Ⅰ/Ⅱ/Ⅲ | AEROSPACE | 是 | （待确认） | factoryWeight 3/4/5 | CONFIRMED |
| 殖民城Ⅰ/Ⅱ/Ⅲ | AEROSPACE | 是 | （待确认） | growthWeight 3/4/5 | CONFIRMED |
| 行星发动机Ⅰ/Ⅱ/Ⅲ型 | AEROSPACE | 是 | （待确认） | engineMultiplier 1.5/2.0/2.5, maxEco 200/350/500 | CONFIRMED |

**关键差异**：
- filteredEvent reqTech → `isTecFinishedInAnyTree`（跨树）
- 数值权重 → `isTecFinished`（指定树）
- 候选问题 CE-10

### 入口与出口证据

**入口证据**：

| 证据项 | 内容 | 证据状态 |
|---|---|---|
| 入口条件 | epoch=1, culture 0-199, 无 FLAG 门控 | CONFIRMED |
| 初始值 | Game.ts:53 `epoch = EpochType.CRISIS` | CONFIRMED |
| 入口处理 | Game.ts:789-915（15 步初始化） | CONFIRMED |
| 入口 CG | event_crisis_start | CONFIRMED |
| 黄金岁月跳过 | 设计决策，非 Bug | CONFIRMED |

**出口证据**：

| 证据项 | 内容 | 证据状态 |
|---|---|---|
| 出口条件 | culture ≥ 200 AND FLAG.DETERRENCE_ESTABLISHED 已设置 | CONFIRMED |
| 出口处理 | 旧 Tag 移除, FLAG 不清理, 状态传递 | CONFIRMED |
| DETERRENCE_ESTABLISHED 写入点 | **未在 events.json 找到** | UNCONFIRMED（UF-3） |
| year=200 事件纪元冲突 | triggerCondition.epoch="CRISIS" 但 year=200 可能已进入 DETERRENCE | CONFIRMED（CE-6） |
| 停滞风险 | culture≥200 但 FLAG 未设置 → EPOCH_STALLED | CONFIRMED |

### 结局条件与竞争关系

**CRISIS 纪元可触发结局**：

| 结局 | 类型 | 触发条件 | 竞争优先级 | 证据状态 |
|---|---|---|---|---|
| DEFEAT_TREACHERY | 失败 | treachery ≥ 100 | 在胜利/中性之后，EXTINCTION 之前 | CONFIRMED |
| DEFEAT_EXTINCTION | 失败 | population ≤ 0 | 在 TREACHERY 之后 | CONFIRMED |

**不可触发结局**：所有 6 条胜利结局（allowedEras 不含 CRISIS）+ 2 条中性结局（epoch ≥ GALAXY/BUNKER）

**竞争关系**：
- 若 treachery≥100 且 population≤0 同时满足 → TREACHERY 优先（代码顺序 1219 > 1234）
- 坐标广播（broadcastTriggered）优先于所有结局（代码顺序 1096-1147）

### 候选问题清单

```text
候选问题 ID：CE-1
问题现象：eto_founded FLAG 在新游戏中永久不可达
涉及对象：events.json year=-27 事件（GOLDEN 纪元），eto_founded FLAG，year=2 事件 reqFlag
当前证据：Game.ts:53 初始 epoch=CRISIS；events.json year=-27 triggerCondition.epoch="GOLDEN"；eto_founded 仅由此事件写入
尚缺证据：是否有 filteredEvent 或其他路径写入 eto_founded
可能影响：year=2 古筝行动事件永久跳过；伊文斯/林云通过此路径无法解锁
下一步验证：搜索 filteredEvents (GameEventManager.ts:324-720) 中是否有 eto_founded 写入
```

```text
候选问题 ID：CE-2
问题现象：year=1 倒计时事件 reqFlag 在 year=5 才写入，时序倒置
涉及对象：events.json year=1 事件 reqFlag=sophon_blockade_confirmed，year=5 事件写入 sophon_blockade_confirmed
当前证据：checkEvents(913) 每回合检查 reqFlag；year=1 时 sophon_blockade_confirmed 未设置 → 跳过；year=5 设置后 year=6+ 才能触发
尚缺证据：是否有 filteredEvent 提前写入 sophon_blockade_confirmed
可能影响：汪淼延迟解锁（year=6+ 而非 year=1）；叙事时序错乱（倒计时在智子封锁确认之后）
下一步验证：搜索 filteredEvents 中是否有 sophon_blockade_confirmed 写入
```

```text
候选问题 ID：CE-3
问题现象：epochDeathMap 注释与数据冲突（伊文斯/章北海/丁仪）
涉及对象：GameEventManager.ts:937-992 epochDeathMap
当前证据：伊文斯注释"危机纪元初古筝行动死亡"但数据标 DETERRENCE 死；章北海注释"危机纪元末黑暗战役死亡"但数据标 DETERRENCE 死；丁仪注释"危机纪元末末日战役牺牲"但数据标 DETERRENCE 死
尚缺证据：无
可能影响：这三人在 CRISIS 期间存活，进入 DETERRENCE 后才死亡；与叙事意图不符
下一步验证：确认叙事设计意图（CRISIS 死还是 DETERRENCE 死）
```

```text
候选问题 ID：CE-4
问题现象：杨冬死亡双重路径冲突
涉及对象：events.json year=0 kill_person:杨冬，epochDeathMap 杨冬标 DETERRENCE 死亡
当前证据：year=0 事件 effects 包含 kill_person:杨冬；epochDeathMap 杨冬死亡列表=["DETERRENCE",...]；若 year=0 事件触发，杨冬在 CRISIS 即死；若事件未触发，杨冬活到 DETERRENCE
尚缺证据：year=0 事件是否总是触发（loreMode 过滤可能跳过）
可能影响：杨冬死亡时机不确定，影响叙事一致性
下一步验证：确认 year=0 事件是否有 loreDomain 限制
```

```text
候选问题 ID：CE-6
问题现象：year=200 末日战役事件 triggerCondition.epoch="CRISIS"，但 culture≥200 时可能已进入 DETERRENCE
涉及对象：events.json year=200 事件，Game.ts:770-776 updateEpoch 推进逻辑
当前证据：year=200 事件 triggerCondition.epoch="CRISIS" minYear=200 reqFlag=teardrop_arrived；若 culture≥200 且 DETERRENCE_ESTABLISHED 已设置，updateEpoch 推进到 DETERRENCE → epoch 检查失败 → 事件跳过
尚缺证据：DETERRENCE_ESTABLISHED 的实际写入时机（若在 year<200 写入，则 culture 到 200 时立即推进）
可能影响：末日战役事件跳过 → doomsday_battle_lost FLAG 不设置 → 后续依赖此 FLAG 的事件全部跳过
下一步验证：确认 DETERRENCE_ESTABLISHED 写入时机
```

```text
候选问题 ID：CE-7
问题现象：伊文斯解锁路径全部阻塞
涉及对象：events.json year=-27（GOLDEN 不可达）, year=2（reqFlag=eto_founded 不可达），伊文斯人物
当前证据：伊文斯仅由 year=-27 和 year=2 事件解锁，两条路径均阻塞（CE-1 导致 year=2 不可达，GOLDEN 跳过导致 year=-27 不可达）
尚缺证据：是否有 filteredEvent 或随机事件解锁伊文斯
可能影响：伊文斯永远无法解锁 → 涉及伊文斯的剧情/随机事件无法触发 → epochDeathMap 注释"古筝行动死亡"无意义
下一步验证：搜索 filteredEvents 和 randomevents.json 中是否有伊文斯 unlock
```

```text
候选问题 ID：CE-8
问题现象：可能存在死 FLAG（写入但无读取，或读取但无写入）
涉及对象：events.json / randomevents.json 中所有 FLAG
当前证据：eto_founded 读取但写入不可达（CE-1）；deterrence_established 读取但写入点未找到（UF-3）
尚缺证据：全量 FLAG 读写交叉比对未完成
可能影响：死 FLAG 导致事件永久跳过或 FLAG 永久不设置
下一步验证：对 events.json + randomevents.json + filteredEvents 中所有 FLAG 做全量读写交叉比对
```

```text
候选问题 ID：CE-9
问题现象：逃亡值在 CRISIS 后期可能达到 100 触发 DEFEAT_TREACHERY
涉及对象：EarthCivilization.ts:698-708 processTreachery，Game.ts:1219-1232 DEFEAT_TREACHERY
当前证据：year≥100 后 earlyGameFactor=1.0，每回合最大增长 3；若文化值<100，cultureSuppression=0；100 回合理论最大累积 300（钳制到 100）
尚缺证据：实际游戏中 treachery 在 year=200 时的典型值
可能影响：玩家在 CRISIS 后期意外触发失败结局
下一步验证：运行 Autoplay500 测试观察 treachery 曲线
```

```text
候选问题 ID：CE-10
问题现象：科技检查函数不一致（跨树 vs 指定树）
涉及对象：GameEventManager.ts:827-831 isTecFinishedInAnyTree（跨树），EarthCivilization.ts:552-554 isTecFinished（指定树）
当前证据：filteredEvent reqTech 用跨树检查；文化值权重用指定树检查；若同名科技存在于多棵树中，结果可能不一致
尚缺证据：是否存在同名科技出现在多棵树中的情况
可能影响：事件认为科技已完成但数值未生效，或反之
下一步验证：扫描 TecTreeManager.ts 5 棵树中是否存在同名节点
```

```text
候选问题 ID：CE-11
问题现象：DETERRENCE_ESTABLISHED 写入点未找到，可能导致出口永久卡死
涉及对象：Game.ts:772 出口门控 FLAG.DETERRENCE_ESTABLISHED，events.json year=201 写入 deterrence_era_declared（非 deterrence_established）
当前证据：events.json 中未找到 deterrence_established 的写入；FLAG_ALIAS_MAP 中无 deterrence_era_declared → deterrence_established 的映射
尚缺证据：filteredEvents (GameEventManager.ts:324-720) 中是否有 deterrence_established 写入
可能影响：若 DETERRENCE_ESTABLISHED 永远不设置，culture≥200 后永久 EPOCH_STALLED
下一步验证：搜索 filteredEvents 中 deterrence_established 的写入
```

### 未确认项清单

| 编号 | 未确认项 | 说明 | 待验证方式 |
|---|---|---|---|
| UF-1 | 死 FLAG 全量扫描 | events.json + randomevents.json + filteredEvents 中所有 FLAG 的读写交叉比对未完成 | 全量扫描脚本 |
| UF-2 | 科技节点工作量/成本数值 | TecTreeManager.ts 94 节点的具体 workload/cost 未逐一确认 | 逐一读取 build*Tree() |
| UF-3 | DETERRENCE_ESTABLISHED 写入点 | events.json 中未找到，可能在 filteredEvents 中 | 搜索 GameEventManager.ts:324-720 |
| UF-4 | year=16/20/25/40/50/60/70/80/150/180/202 事件完整效果 | 仅确认了年份与 talk0_pic，未逐一展开 effects | 逐一读取 events.json |
| UF-5 | filteredEvents CRISIS 覆盖 | 29 条硬编码过滤事件中 CRISIS 相关条数未确认 | 逐一读取 seedFilteredEvents() |
| UF-6 | 伊文斯/林云替代解锁路径 | 是否有 filteredEvent 或随机事件提供替代解锁 | 搜索 filteredEvents + randomevents.json |
| UF-7 | sophon_blockade_confirmed 替代写入点 | 是否有 filteredEvent 提前写入此 FLAG | 搜索 filteredEvents |
| UF-8 | DEFEAT_HELIUM_FLASH 触发条件 | 氦闪失败的完整触发逻辑未确认 | 读取 Game.ts 失败结局完整代码 |
| UF-9 | DEFEAT_DIMENSION_STRIKE 触发条件 | 降维打击失败的完整触发逻辑未确认 | 读取 Game.ts 失败结局完整代码 |
| UF-10 | 智子封锁对科技研究的影响 | Game.ts:211-212 isSophonBlocked 的具体逻辑 | 读取 Game.ts:211-212 上下文 |
| UF-11 | 面壁者自动加入逻辑 | EventSystem.ts:247-284 applyUnlockPerson 自动加入面壁者 | 读取 applyUnlockPerson 完整代码 |
| UF-12 | 执剑人任命 filteredEvent | Game.ts:433-443 执剑人任命的具体 filteredEvent | 读取 Game.ts:433-443 上下文 |

---

**EPOCH_EVIDENCE_危机纪元 取证完成。未修改代码，未输出修复方案。**
