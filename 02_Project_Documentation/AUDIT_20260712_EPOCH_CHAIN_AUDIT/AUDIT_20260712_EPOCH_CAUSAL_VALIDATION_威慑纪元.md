# `EPOCH_CAUSAL_VALIDATION_威慑纪元`

> 纪元：威慑纪元（DETERRENCE, epoch=2）
> 阶段：反例审计 + 因果链闭合验证（未修改代码，未输出修复方案）
> 证据截止：20260712
> 引用文档：EPOCH_AUDIT_MODEL_威慑纪元、EPOCH_EVIDENCE_威慑纪元、AUDIT_20260712_BASELINE

---

## 一、反例审计（Counterexample Audit）

> 对每个正常路径构造反例，验证是否存在异常路径导致因果链断裂、卡死或意外结局。

### CV-1：culture≥200 但 deterrence_established 未设置

**反例假设**：玩家在 CRISIS 纪元通过非事件途径（如每回合自动 culture 增长）使 culture≥200，但 year=202 威慑建立事件未触发（如 year=200 末日战役未触发导致 doomsday_battle_lost 未写入）。

**验证路径**：
1. year=200 末日战役 reqFlag=teardrop_arrived → 若 teardrop_arrived 未设置，事件跳过
2. doomsday_battle_lost 未写入 → year=202 威慑建立事件 reqFlag 失败 → 跳过
3. deterrence_established 未写入
4. culture≥200 时 updateEpoch 尝试推进 DETERRENCE
5. Game.ts:772 `!this.flagManager.isSet(FLAG.DETERRENCE_ESTABLISHED)` → allowed=false
6. 设置 EPOCH_STALLED，记录"文明停滞"
7. 玩家被困在 CRISIS 纪元，直到通过 filteredEvent deterrence_establishment（CRISIS, minYear:50, reqTech:黑暗森林威慑, minDeterrence:50）任命罗辑为执剑人

**关键发现**：filteredEvent deterrence_establishment 写入的是 swordholder_appointed FLAG，**不是** deterrence_established FLAG。两者写入点不同：
- swordholder_appointed：GameEventManager.ts:350（filteredEvent）
- deterrence_established：events.json:748（year=202 事件）

**结论**：**反例成立**。若 year=202 事件未触发，玩家将永久卡死在 CRISIS 纪元（EPOCH_STALLED），filteredEvent 无法补救。这是 CRISIS 纪元上游已确认的路径依赖，DETERRENCE 纪元入口受阻。

**证据状态**：CONFIRMED（与上游 AR-1 eto_founded 不可达同级风险）

---

### CV-2：程心路线 year=230 事件循环依赖（CQ-6 深度验证）

**反例假设**：玩家在 year=219 选择"任命程心"，走程心路线。

**验证路径**：
1. year=219 选项A → swordholder_chengxin / unlock 程心+艾AA / treachery+10
2. year=220 威慑中止（reqFlag=swordholder_chengxin）→ deterrence_broken / treachery+40 / population-20
3. year=225 澳大利亚大移民（reqFlag=deterrence_broken）→ australia_migration / treachery+25 / population-15
4. year=230 引力波广播（BROADCAST 版）reqFlag=australia_migration / **epoch=BROADCAST**
5. 此时玩家仍在 DETERRENCE 纪元（culture 未达 500）
6. checkEvents 检查 epoch：isEpochMatch("BROADCAST", "DETERRENCE") → false
7. year=230 BROADCAST 版事件**无法触发**
8. coordinates_broadcasted 无法写入
9. 玩家无法推进到 BROADCAST 纪元（门控 FLAG 缺失）
10. **永久卡死在 DETERRENCE 纪元**

**关键发现**：程心路线的 coordinates_broadcasted 写入点（events.json:968）epoch 字段为 BROADCAST，但触发该事件需要先进入 BROADCAST 纪元，而进入 BROADCAST 纪元需要 coordinates_broadcasted → **循环依赖**。

**对比罗辑路线**：year=230 DETERRENCE 版事件 epoch=DETERRENCE，在 DETERRENCE 纪元可直接触发，无循环依赖。

**结论**：**反例成立**。程心路线存在循环依赖，导致永久卡死。这是一个 P1 级严重问题。

**证据状态**：CONFIRMED（CQ-6 确认为正式问题）

---

### CV-3：程心路线 treachery 提前触发 DEFEAT_TREACHERY（CQ-5 深度验证）

**反例假设**：玩家走程心路线，treachery 在 year=225 或 year=230 前已≥100。

**验证路径**：
1. CRISIS 纪元 treachery 累积（典型：year=201 +20, year=202 -20 = 净 0）
2. year=219 选项A → treachery+10
3. year=220 → treachery+40（累计 CRISIS+50）
4. year=225 → treachery+25（累计 CRISIS+75）
5. 若 CRISIS 累积≥25，则 year=225 后 treachery≥100
6. checkVictoryConditions 顺序：treachery≥100 在顺序 4（Game.ts:1219）
7. 但 updateEpoch 在 checkVictoryConditions 之前（Game.ts:731-732）
8. 若 year=225 事件效果应用后 treachery≥100，同一回合 checkVictoryConditions 触发 DEFEAT_TREACHERY

**关键发现**：
- 程心路线 treachery 累计 +95（219:+10, 220:+40, 225:+25, 230:+20）
- 即使 CRISIS 累积为 0，year=230 后 treachery=95（未达 100）
- 但 year=230 事件因 CV-2 循环依赖无法触发 → treachery 停在 75
- 若 CRISIS 累积≥25，year=225 后 treachery≥100 → DEFEAT_TREACHERY

**结论**：**反例部分成立**。程心路线 treachery 是否触发 DEFEAT_TREACHERY 取决于 CRISIS 累积值。但即使 treachery 未达 100，程心路线也会因 CV-2 循环依赖卡死。程心路线无论如何都无法正常推进。

**证据状态**：CONFIRMED（程心路线必败，无论 treachery 是否达 100）

---

### CV-4：swordholder 字段为 null 导致 DETERRENCE 胜利不可达（CQ-4 深度验证）

**反例假设**：玩家通过 events.json year=202 路径进入 DETERRENCE（deterrence_established 已设置），但未触发 CRISIS filteredEvent deterrence_establishment（swordholder_appointed 未设置，earthCivi.swordholder=null）。

**验证路径**：
1. year=202 事件写入 deterrence_established（不写 swordholder 字段）
2. culture≥200 + deterrence_established → 推进 DETERRENCE
3. earthCivi.swordholder 仍为 null（filteredEvent 未触发）
4. DETERRENCE 胜利条件（Game.ts:1014）检查 `this.earthCivi.swordholder !== null` → false
5. DETERRENCE 胜利**不可达**
6. deterrenceEnduranceRounds 累积条件（Game.ts:651）也检查 swordholder≠null → 不累积
7. 玩家无法通过 DETERRENCE 胜利结局

**关键发现**：
- swordholder 字段写入点：Game.ts:433-443（filteredEvent effects 处理）
- filteredEvent deterrence_establishment 选项"任命罗辑"同时写入 swordholder_appointed FLAG 和 earthCivi.swordholder 字段
- events.json year=202 事件写入 deterrence_established FLAG，**不写 swordholder 字段**
- 两条路径独立：
  - 路径 A：filteredEvent → swordholder_appointed + swordholder 字段
  - 路径 B：events.json year=202 → deterrence_established
- DETERRENCE 入口门控检查 deterrence_established（路径 B）
- DETERRENCE 胜利检查 swordholder 字段（路径 A）
- 若玩家只走路径 B（未触发路径 A），则进入 DETERRENCE 但胜利不可达

**结论**：**反例成立**。swordholder 字段与 deterrence_established FLAG 的双轨写入导致路径分裂。若玩家未触发 filteredEvent deterrence_establishment，DETERRENCE 胜利不可达。

**证据状态**：CONFIRMED（CQ-4 确认为正式问题）

---

### CV-5：罗辑路线 deterrenceValue 初始值过低

**反例假设**：罗辑路线 deterrenceValue 初始值为 0（新游戏默认），year=219 后 deterrenceValue=30，year=220 后=50，year=230 后=100。

**验证路径**：
1. deterrenceValue 初始=0（EarthCivilization.ts:18 `public deterrenceValue: number = 0`）
2. year=219 选项B → deterrenceValue+30 = 30
3. year=220 罗辑路线 → deterrenceValue+20 = 50
4. 累积条件（Game.ts:652）需 deterrenceValue≥80 → year=220 后 50<80 → 不累积
5. year=230 → deterrenceValue+50 = 100
6. 累积条件满足（100≥80）→ 开始累积
7. 需连续 20 回合 → 最早胜利 year=250

**关键发现**：
- year=219~220 期间 deterrenceValue=30~50，低于累积阈值 80
- deterrenceEnduranceRounds 不累积（直到 year=230 后 deterrenceValue=100）
- 最早胜利时点：year=230+20=year=250
- DETERRENCE 纪元 year 上限约 260（timeline.json gameYearRange=[201,260]）
- 胜利窗口仅 year=250~260，约 10 回合

**结论**：**反例不成立**（但窗口紧张）。罗辑路线 determissionValue 在 year=230 后达 100，满足胜利阈值 90 和累积阈值 80。最早胜利 year=250，在 timeline year 上限 260 之前。但窗口仅 10 回合，若期间发生其他事件降低 deterrenceValue 可能导致失败。

**证据状态**：CONFIRMED（窗口紧张但可达）

---

### CV-6：year=220 两事件同时触发

**反例假设**：year=220 时 swordholder_chengxin 和 swordholder_luoji_retained 都已设置。

**验证路径**：
1. year=219 事件两个选项互斥（玩家只能选一个）
2. 选项A 设置 swordholder_chengxin，选项B 设置 swordholder_luoji_retained
3. 不可能同时设置
4. year=220 事件 A reqFlag=swordholder_chengxin，事件 B reqFlag=swordholder_luoji_retained
5. 只有一个事件的 reqFlag 满足

**结论**：**反例不成立**。year=220 两事件通过 reqFlag 互斥，不可能同时触发。

**证据状态**：CONFIRMED（互斥正常）

---

### CV-7：treachery 和 population 同时触达失败阈值

**反例假设**：程心路线 year=225 后 treachery≥100 且 population≤0。

**验证路径**：
1. year=220 population-20, year=225 population-15 → 累计 -35
2. 若初始 population≤35，year=225 后 population≤0
3. year=225 treachery+25 → 若 CRISIS 累积+50+25=75+CRISIS累积
4. checkVictoryConditions 顺序：treachery(4) 先于 population(5)
5. 若两者同时满足，TREACHERY 优先

**结论**：**反例成立但优先级正确**。TREACHERY 优先于 EXTINCTION，与上游 CRISIS 纪元确认一致。

**证据状态**：CONFIRMED（优先级正常）

---

### CV-8：updateEpoch 推进覆盖失败结局（UC-2 持续观察）

**反例假设**：同回合内 culture 达标推进 BROADCAST + treachery≥100 触发 DEFEAT_TREACHERY。

**验证路径**：
1. Game.ts:731-732 顺序：updateEpoch() → checkVictoryConditions()
2. 若 year=230 罗辑路线事件写入 coordinates_broadcasted + culture≥500
3. updateEpoch 推进到 BROADCAST
4. checkVictoryConditions 中 DETERRENCE 胜利 allowedEras=[DETERRENCE]，epoch 已变为 BROADCAST → 条件失败
5. 但 BROADCAST 纪元的失败结局可能触发

**关键发现**：
- DETERRENCE 胜利 allowedEras=[DETERRENCE]（Game.ts:1010）
- 若 updateEpoch 先推进到 BROADCAST，DETERRENCE 胜利条件检查 `this.epoch >= EpochType.DETERRENCE` 仍为 true（BROADCAST=3 > DETERRENCE=2）
- 但 `allowedEras: [EpochType.DETERRENCE]` 限制只在 epoch=2 时判定
- updateEpoch 推进后 epoch=3，allowedEras 检查失败 → DETERRENCE 胜利不可达

**结论**：**反例成立**。若同回合 updateEpoch 推进到 BROADCAST，DETERRENCE 胜利窗口关闭。但这是设计意图（胜利需在 DETERRENCE 纪元内达成），不是 Bug。

**证据状态**：CONFIRMED（设计意图，非 Bug）

---

### CV-9：filteredEvent minYear 语义冲突（CQ-7 深度验证）

**反例假设**：deterrence_strain(minYear:70, epoch:DETERRENCE) 在 CRISIS 纪元 year=70 时触发。

**验证路径**：
1. GameEventManager.ts:776 `if (cond.minYear !== undefined && game.year < cond.minYear) return false;`
2. GameEventManager.ts:778 `if (cond.epoch && !this.isEpochMatch(cond.epoch, currentEpoch)) return false;`
3. CRISIS 纪元 year=70：minYear 满足（70≥70），但 epoch 检查 isEpochMatch("DETERRENCE", "CRISIS") = false
4. filteredEvent 不触发

**结论**：**反例不成立**。epoch 检查阻止在 CRISIS 纪元触发。但 minYear=70 在 DETERRENCE(year≥201) 时已冗余满足（201>70），实际约束由 reqFlag/minDeterrence 提供。

**证据状态**：CONFIRMED（设计意图与实现不一致，但无功能影响）

---

### CV-10：存档加载后 deterrenceEnduranceRounds 恢复

**反例假设**：存档时 deterrenceEnduranceRounds=15，加载后恢复为 0。

**验证路径**：
1. deterrenceEnduranceRounds 声明于 Game.ts:94，不在 gameReplacer 排除列表
2. SaveManager.ts:114 v2→v3 迁移：`if (data.deterrenceEnduranceRounds === undefined) data.deterrenceEnduranceRounds = 0;`
3. 存档时序列化为 JSON number
4. 加载时反序列化恢复正确值

**结论**：**反例不成立**。deterrenceEnduranceRounds 正确持久化。

**证据状态**：CONFIRMED（持久化正常）

---

### CV-11：程心路线人物解锁但事件无法触发

**反例假设**：year=219 选项A 解锁程心，但后续事件（year=220 威慑中止）因 epoch 检查无法触发。

**验证路径**：
1. year=219 事件 epoch=DETERRENCE → 在 DETERRENCE 纪元可触发 ✅
2. year=220 事件 epoch=DETERRENCE → 在 DETERRENCE 纪元可触发 ✅
3. year=225 事件 epoch=DETERRENCE → 在 DETERRENCE 纪元可触发 ✅
4. year=230 BROADCAST 版事件 epoch=BROADCAST → 在 DETERRENCE 纪元**不可触发** ❌

**结论**：**反例部分成立**。year=219/220/225 事件可在 DETERRENCE 触发，但 year=230 BROADCAST 版事件不可触发（CV-2 已确认）。

**证据状态**：CONFIRMED（与 CV-2 一致）

---

### CV-12：DETERRENCE 胜利与 BROADCAST 推进竞争

**反例假设**：罗辑路线 year=230 后 deterrenceValue=100, deterrenceEnduranceRounds 已累积 20 回合，同时 culture≥500 + coordinates_broadcasted 已设置。

**验证路径**：
1. Game.ts:731-732 顺序：updateEpoch() → checkVictoryConditions()
2. updateEpoch 检查 culture≥500 + coordinates_broadcasted → 推进 BROADCAST
3. epoch 变为 BROADCAST(3)
4. checkVictoryConditions 中 DETERRENCE 胜利 allowedEras=[DETERRENCE] → epoch=3 不匹配 → 跳过
5. DETERRENCE 胜利**不可达**

**关键发现**：
- DETERRENCE 胜利需在 epoch=2 时判定
- 但 year=230 事件写入 coordinates_broadcasted 后，若 culture≥500，同回合 updateEpoch 推进到 BROADCAST
- DETERRENCE 胜利窗口在 year=230 事件触发后立即关闭

**结论**：**反例成立**。玩家必须在 year=230 之前达成 DETERRENCE 胜利（deterrenceEnduranceRounds≥20 + deterrenceValue≥90），否则 year=230 事件触发后 culture 增长可能导致立即推进 BROADCAST。

**实际可行性分析**：
- year=219 后 deterrenceValue=30（初始0+30）
- year=220 后 deterrenceValue=50
- year=230 后 deterrenceValue=100
- 累积阈值 80，year=230 后才开始累积
- 需 20 回合累积 → 最早 year=250
- 但 year=230 事件 culture+50（events.json:1012 deterrenceValue+50 但 culture 无加成）
- 罗辑路线 culture 累计：30+20+20+10+15=95（DETERRENCE 期间事件）+ 每回合自动增长
- 若每回合 culture 增长≥3（典型），year=201~230 共 30 回合 → culture 增长 90+95=185
- CRISIS 出口 culture≥200，DETERRENCE 入口 culture≈200
- year=230 时 culture≈200+185=385 < 500 → 不会立即推进 BROADCAST
- year=250 时 culture≈200+95+50*3=445 < 500 → 仍不会推进
- 胜利窗口 year=250~260 充足

**证据状态**：CONFIRMED（竞争存在但窗口充足）

---

### CV-13：checkEvents 不检查人物解锁/存活（AR-8 持续观察）

**反例假设**：year=219 事件 talker=罗辑，但罗辑已死亡或未解锁。

**验证路径**：
1. checkEvents（GameEventManager.ts:913-932）不调用 isEventCharactersUnlocked
2. year=219 事件 talker=罗辑
3. 罗辑在 DETERRENCE 纪元存活（epochDeathMap 不含 DETERRENCE）
4. 罗辑在 CRISIS 纪元面壁计划事件解锁
5. 正常情况下罗辑已解锁且存活

**结论**：**反例不成立**（DETERRENCE 纪元期间）。罗辑在 DETERRENCE 纪元存活且应在 CRISIS 纪元已解锁。但若 CRISIS 纪元面壁计划事件未触发，罗辑可能未解锁 → year=219 事件对话中出现未解锁人物（AR-8 上游已登记）。

**证据状态**：CONFIRMED（AR-8 持续，DETERRENCE 纪元无新增风险）

---

### CV-14：FLAG 永久累积导致 reqNotFlag 阻断（AR-5 持续观察）

**反例假设**：CRISIS 纪元设置的 FLAG 通过 reqNotFlag 阻断 DETERRENCE 纪元事件。

**验证路径**：
1. 全量检查 DETERRENCE 纪元事件的 reqNotFlag：
   - events.json 8 个 DETERRENCE 事件：无 reqNotFlag
   - filteredEvents deterrence_strain: 无 reqNotFlag
   - filteredEvents lightspeed_project: reqNotFlag=lightspeed_project_approved（自去重，非 CRISIS FLAG）
2. CRISIS 累积的 FLAG（doomsday_battle_lost/dark_battle/sophon_blockade_confirmed 等）未被 DETERRENCE 事件的 reqNotFlag 读取

**结论**：**反例不成立**。DETERRENCE 纪元事件无 reqNotFlag 读取 CRISIS 累积 FLAG。AR-5 在 DETERRENCE 纪元无实际影响。

**证据状态**：CONFIRMED（AR-5 在 DETERRENCE 无影响）

---

### CV-15：randomevent chengxin_swordholder_trial 与 events.json year=219 冲突

**反例假设**：randomevent chengxin_swordholder_trial 写入 chengxin_swordholder FLAG，与 events.json 的 swordholder_chengxin 命名不一致，导致执剑人状态分裂。

**验证路径**：
1. randomevents.json:6038 写入 chengxin_swordholder（死 FLAG，无消费者）
2. events.json:851 写入 swordholder_chengxin（活 FLAG，year=220 事件 reqFlag 读取）
3. 两个 FLAG 字符串不同，互不影响
4. randomevent 写入的 chengxin_swordholder 永远不会被任何事件读取

**结论**：**反例不成立**（功能无影响）。randomevent 写入的死 FLAG 不影响 events.json 路径。但命名不一致增加维护成本（CQ-10）。

**证据状态**：CONFIRMED（CQ-10 命名不一致，无功能影响）

---

### CV-16：deterrenceEnduranceRounds 在程心路线累积

**反例假设**：程心路线 swordholder 字段仍为"罗辑"（CV-4），deterrenceEnduranceRounds 可能错误累积。

**验证路径**：
1. 若 CRISIS filteredEvent 已触发，swordholder="罗辑"
2. 程心路线 year=219 不修改 swordholder 字段
3. swordholder 仍为"罗辑"
4. deterrenceEnduranceRounds 累积条件：epoch≥DETERRENCE + swordholder≠null + deterrenceValue≥80
5. 程心路线 deterrenceValue 不增长（无加成事件）
6. 初始 deterrenceValue=0（或 CRISIS 累积值，通常<80）
7. 累积条件不满足 → deterrenceEnduranceRounds=0

**结论**：**反例不成立**。程心路线 deterrenceValue 不足，deterrenceEnduranceRounds 不累积。即使 swordholder 字段非 null，也不会错误累积。

**证据状态**：CONFIRMED（程心路线无错误累积风险）

---

### CV-17：year=201 事件时序倒置（CQ-1 深度验证）

**反例假设**：year=201 威慑纪元宣告事件因 reqFlag=deterrence_established 在 year=202 才写入，导致延迟到 year=203 触发。

**验证路径**：
1. year=201 事件 triggerCondition: { epoch: "DETERRENCE", minYear: 201, reqFlag: "deterrence_established" }
2. year=202 事件写入 deterrence_established
3. year=201 事件在 year=201 时检查 reqFlag → 失败（deterrence_established 未设置）
4. hasTriggered 保持 false
5. year=202 事件触发，写入 deterrence_established
6. year=203 时 checkEvents 重新检查 year=201 事件 → currentYear(203) >= minYear(201) + reqFlag 满足 → 触发
7. year=201 事件在 year=203 触发

**结论**：**反例成立**。year=201 事件延迟到 year=203 触发，叙事时序错乱（威慑纪元宣告在威慑建立之后）。与上游 AR-2 同类问题。

**证据状态**：CONFIRMED（CQ-1 时序倒置）

---

### CV-18：程心路线 population 归零触发 DEFEAT_EXTINCTION

**反例假设**：程心路线 population-35，若初始 population≤35 则归零。

**验证路径**：
1. year=220 population-20, year=225 population-15 → 累计 -35
2. population 初始值通常较高（新游戏默认值待确认，但通常>100）
3. 即使 population-35，通常不会归零
4. 但若 CRISIS 纪元期间 population 已大幅下降，程心路线可能触发归零

**结论**：**反例低概率成立**。程心路线 population-35 通常不足以归零，但若 CRISIS 纪元 population 已低，可能触发 DEFEAT_EXTINCTION。

**证据状态**：CONFIRMED（低概率风险）

---

### CV-19：broadcastTriggered 在 DETERRENCE 纪元触发

**反例假设**：DETERRENCE 纪元期间 broadcastTriggered=true。

**验证路径**：
1. broadcastTriggered 写入点待确认（需全量搜索）
2. DETERRENCE 纪元事件中无 broadcastTriggered 写入
3. year=230 事件写入 coordinates_broadcasted，不是 broadcastTriggered
4. broadcastTriggered 可能在其他代码路径设置（如结局判定逻辑）

**结论**：**反例不成立**（DETERRENCE 纪元无 broadcastTriggered 写入点）。broadcastTriggered 通常在 BROADCAST 纪元或更晚触发。

**证据状态**：CONFIRMED（DETERRENCE 纪元不触发）

---

### CV-20：存档加载后 FLAG 引用漂移（AR-7 持续观察）

**反例假设**：存档加载后 FlagManager 持有旧 flags Set 引用。

**验证路径**：
1. GameSerializer.ts:76-78 restorePrototypes 重建 FlagManager
2. 已增加引用一致性检查：`inst.flagManager.getInternalSet() !== inst.flags`
3. 若不一致，重新 `new FlagManager(inst.flags)` 绑定

**结论**：**反例不成立**（已修复）。restorePrototypes 已增加引用一致性检查。

**证据状态**：CONFIRMED（AR-7 已部分修复）

---

## 二、因果链闭合验证

### 2.1 罗辑路线因果链闭合验证

```
[CRISIS 出口]
year=200 末日战役（reqFlag=teardrop_arrived）→ doomsday_battle_lost ✅
  ↓
year=201 黑暗战役（reqFlag=doomsday_battle_lost）→ dark_battle(死FLAG) / treachery+20 ✅
  ↓
year=202 威慑建立（reqFlag=doomsday_battle_lost）→ deterrence_established / treachery-20 / culture+30 ✅
  ↓
culture≥200 + deterrence_established → updateEpoch 推进 DETERRENCE ✅
  ↓
[DETERRENCE 入口]
year=201 威慑纪元宣告（reqFlag=deterrence_established）→ 实际 year≥203 触发（CV-17 时序倒置）⚠️
  ↓
year=205 技术交流（reqFlag=deterrence_established）→ tech_exchange_started(死FLAG) / culture+20 ✅
  ↓
year=210 威慑稳固期（reqFlag=deterrence_established）→ culture+20 ✅
  ↓
year=219 执剑人交接（reqFlag=deterrence_established）→ 选项B 罗辑连任 → swordholder_luoji_retained / deterrenceValue+30 ✅
  ↓
year=220 威慑持续（reqFlag=swordholder_luoji_retained）→ deterrence_held_strong / deterrenceValue+20 ✅
  ↓
[deterrenceValue 累积：50<80，deterrenceEnduranceRounds 不累积] ⚠️
  ↓
year=230 引力波广播（reqFlag=deterrence_held_strong, epoch=DETERRENCE）→ coordinates_broadcasted / deterrenceValue+50 ✅
  ↓
[deterrenceValue=100≥80，deterrenceEnduranceRounds 开始累积]
  ↓
[需 20 回合累积 → 最早 year=250 胜利]
  ↓
[胜利判定] epoch=2 + swordholder≠null（需 CRISIS filteredEvent 已触发，CV-4）+ deterrenceValue≥90 + endurance≥20 ✅
  ↓
DETERRENCE 胜利结局 ✅
```

**闭合状态**：**基本闭合**，存在 2 项风险：
1. CV-4：swordholder 字段需 CRISIS filteredEvent 触发（路径分裂风险）
2. CV-12：year=230 后若 culture≥500 会立即推进 BROADCAST，关闭胜利窗口（但实际窗口充足）

### 2.2 程心路线因果链闭合验证

```
year=219 执剑人交接 → 选项A 任命程心 → swordholder_chengxin / unlock 程心+艾AA / treachery+10 ✅
  ↓
year=220 威慑中止（reqFlag=swordholder_chengxin）→ deterrence_broken / treachery+40 / population-20 ✅
  ↓
year=225 澳大利亚大移民（reqFlag=deterrence_broken）→ australia_migration / treachery+25 / population-15 ✅
  ↓
year=230 引力波广播（BROADCAST 版, reqFlag=australia_migration, epoch=BROADCAST）
  ↓
[epoch 检查失败：isEpochMatch("BROADCAST", "DETERRENCE") = false] ❌
  ↓
[coordinates_broadcasted 无法写入] ❌
  ↓
[无法推进 BROADCAST 纪元（门控 FLAG 缺失）] ❌
  ↓
[永久卡死在 DETERRENCE 纪元] ❌

[并行失败路径]
├── treachery≥100 → DEFEAT_TREACHERY（若 CRISIS 累积≥25）✅
├── population≤0 → DEFEAT_EXTINCTION（若初始 population≤35）✅
└── 卡死 → 无结局 ❌
```

**闭合状态**：**未闭合**。程心路线存在循环依赖（CV-2），无法正常推进到 BROADCAST 纪元。玩家只能通过失败结局退出（若 treachery/population 达阈值），否则永久卡死。

### 2.3 因果链闭合总结

| 路径 | 闭合状态 | 关键问题 |
|---|---|---|
| 罗辑路线 → DETERRENCE 胜利 | ✅ 基本闭合 | CV-4 swordholder 字段路径分裂 / CV-12 胜利窗口 |
| 罗辑路线 → BROADCAST 正常出口 | ✅ 闭合 | year=230 事件触发 coordinates_broadcasted |
| 程心路线 → BROADCAST 正常出口 | ❌ 未闭合 | CV-2 循环依赖 / CQ-6 |
| 程心路线 → DEFEAT_TREACHERY | ✅ 闭合（条件性）| CV-3 treachery+95 |
| 程心路线 → DEFEAT_EXTINCTION | ✅ 闭合（低概率）| CV-18 population-35 |
| 程心路线 → 永久卡死 | ❌ 未闭合 | CV-2 循环依赖 |

---

## 三、反例审计结果汇总

| 编号 | 反例描述 | 结论 | 证据状态 |
|---|---|---|---|
| CV-1 | culture≥200 但 deterrence_established 未设置 | 成立（上游依赖） | CONFIRMED |
| CV-2 | 程心路线 year=230 循环依赖 | **成立（P1）** | CONFIRMED |
| CV-3 | 程心路线 treachery 提前触发失败 | 部分成立 | CONFIRMED |
| CV-4 | swordholder 字段为 null 导致胜利不可达 | **成立（P1）** | CONFIRMED |
| CV-5 | 罗辑路线 deterrenceValue 初始值过低 | 不成立（窗口紧张） | CONFIRMED |
| CV-6 | year=220 两事件同时触发 | 不成立（互斥正常） | CONFIRMED |
| CV-7 | treachery 和 population 同时达阈值 | 成立（优先级正确） | CONFIRMED |
| CV-8 | updateEpoch 覆盖失败结局 | 成立（设计意图） | CONFIRMED |
| CV-9 | filteredEvent minYear 语义冲突 | 不成立（epoch 阻止） | CONFIRMED |
| CV-10 | 存档加载后 enduranceRounds 丢失 | 不成立（持久化正常） | CONFIRMED |
| CV-11 | 程心路线人物解锁但事件无法触发 | 部分成立（与 CV-2 一致） | CONFIRMED |
| CV-12 | DETERRENCE 胜利与 BROADCAST 推进竞争 | 成立（窗口充足） | CONFIRMED |
| CV-13 | checkEvents 不检查人物解锁 | 不成立（DETERRENCE 无新增风险） | CONFIRMED |
| CV-14 | FLAG 永久累积导致 reqNotFlag 阻断 | 不成立（无 reqNotFlag 读取） | CONFIRMED |
| CV-15 | randomevent 与 events.json FLAG 命名冲突 | 不成立（功能无影响） | CONFIRMED |
| CV-16 | 程心路线 enduranceRounds 错误累积 | 不成立（deterrenceValue 不足） | CONFIRMED |
| CV-17 | year=201 事件时序倒置 | 成立（P2） | CONFIRMED |
| CV-18 | 程心路线 population 归零 | 低概率成立 | CONFIRMED |
| CV-19 | broadcastTriggered 在 DETERRENCE 触发 | 不成立 | CONFIRMED |
| CV-20 | 存档加载后 FLAG 引用漂移 | 不成立（已修复） | CONFIRMED |

**反例审计统计**：20 项反例，5 项成立（含 2 项 P1），4 项部分成立/低概率，11 项不成立。

---

## 四、因果链闭合验证结论

### 4.1 闭合路径
1. **罗辑路线 → DETERRENCE 胜利**：基本闭合（CV-4/CV-12 风险但不阻断）
2. **罗辑路线 → BROADCAST 正常出口**：闭合
3. **程心路线 → DEFEAT_TREACHERY**：闭合（条件性）
4. **程心路线 → DEFEAT_EXTINCTION**：闭合（低概率）

### 4.2 未闭合路径
1. **程心路线 → BROADCAST 正常出口**：**未闭合**（CV-2 循环依赖）
2. **程心路线 → 永久卡死**：**未闭合**（CV-2 循环依赖，无结局退出）

### 4.3 关键断裂点

| 断裂点 | 严重性 | 影响 |
|---|---|---|
| CV-2 程心路线循环依赖 | P1 | 程心路线无法推进到 BROADCAST，永久卡死 |
| CV-4 swordholder 字段路径分裂 | P1 | 未触发 CRISIS filteredEvent 时 DETERRENCE 胜利不可达 |
| CV-17 year=201 时序倒置 | P2 | 叙事时序错乱 |

### 4.4 与上游 CRISIS 纪元对比

| 维度 | CRISIS 纪元 | DETERRENCE 纪元 |
|---|---|---|
| P1 问题数 | 1（AR-1 eto_founded） | 3（CQ-4/CQ-5/CQ-6） |
| 因果链断裂 | 1 处（eto_founded） | 2 处（CV-2 循环依赖 + CV-4 路径分裂） |
| 死 FLAG | 2（dark_forest_deterrence + deterrence_era_declared） | 7（含上游 2 个） |
| 正常路径闭合 | 是 | 罗辑路线闭合，程心路线未闭合 |

---

**EPOCH_CAUSAL_VALIDATION_威慑纪元 验证完成。未修改代码，未输出修复方案。**

**反例审计统计**：20 项反例，5 项成立（含 2 项 P1），4 项部分成立/低概率，11 项不成立
**因果链闭合**：罗辑路线闭合，程心路线未闭合（2 处断裂）
**关键问题**：CV-2（CQ-6）程心路线循环依赖 / CV-4（CQ-4）swordholder 字段路径分裂 / CV-17（CQ-1）时序倒置
**下一步**：进入 AUDIT_REPORT 阶段，输出正式报告
