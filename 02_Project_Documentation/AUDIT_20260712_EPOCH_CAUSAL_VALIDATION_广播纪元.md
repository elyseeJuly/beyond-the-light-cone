# `EPOCH_CAUSAL_VALIDATION_广播纪元`

> 纪元：广播纪元（BROADCAST, epoch=3）
> 阶段：反例审计 + 因果链闭合验证
> 证据截止：20260712
> 引用文档：AUDIT_20260712_EPOCH_MODEL_广播纪元、AUDIT_20260712_EPOCH_EVIDENCE_广播纪元

---

## 一、反例审计（20 项）

### CV-1：玩家未触发 year=230 DETERRENCE 版事件即进入 BROADCAST

**假设**：玩家在 DETERRENCE 纪元未触发 year=230 DETERRENCE 版事件（reqFlag=deterrence_held_strong 未满足），但 culture 达 500。

**验证**：
- coordinates_broadcasted 唯一可达写入点为 year=230 DETERRENCE 版事件
- 若未触发 → coordinates_broadcasted 未设置 → Game.ts:773 门控 → allowed=false → 玩家卡在 DETERRENCE
- 结论：**不成立**。玩家无法绕过 year=230 DETERRENCE 版事件进入 BROADCAST。

### CV-2：玩家通过 year=230 BROADCAST 版事件进入 BROADCAST

**假设**：程心路线触发 year=230 BROADCAST 版事件写入 coordinates_broadcasted。

**验证**：
- year=230 BROADCAST 版事件 epoch=BROADCAST
- 要触发该事件，玩家必须已在 BROADCAST 纪元
- 要进入 BROADCAST，需要 coordinates_broadcasted 已设置
- 循环依赖：事件需要 BROADCAST 纪元 → BROADCAST 纪元需要 coordinates_broadcasted → coordinates_broadcasted 需要该事件触发
- 结论：**成立（P1，CQ-5）**。程心路线存在二阶循环依赖，即使修复 AR-10 仍不可达。

### CV-3：culture 在 BROADCAST 纪元达到 800 但 bunker_world_completed 未设置

**假设**：玩家在 BROADCAST 纪元 culture 达 800，尝试推进 BUNKER。

**验证**：
- Game.ts:764 匹配 BUNKER 纪元（minCulture=800, maxCulture=1199）
- Game.ts:774 检查 BUNKER_WORLD_COMPLETED → 未设置 → allowed=false
- Game.ts:780 设置 EPOCH_STALLED FLAG
- bunker_world_completed 唯一写入点为 events.json:1150（year=280, epoch=BUNKER）→ BROADCAST 纪元无法触发
- 玩家永久卡在 BROADCAST，culture 继续增长但纪元不推进
- 结论：**成立（P1，CQ-1/AR-20）**。BROADCAST→BUNKER 正常推进永久不可达。

### CV-4：玩家通过 broadcastTriggered 按钮在 BROADCAST 退出

**假设**：玩家点击 WallfacerPanel 广播按钮，触发 broadcastTriggered=true。

**验证**：
- WallfacerPanel.ts:171-172 设置 broadcastTriggered=true + broadcastSurvives
- Game.ts:1096 `if (this.broadcastTriggered)` → 短路优先
- broadcastSurvives=true（黑域生成/数字方舟/新家园选址/galaxy_exodus_seen/wandering_completed 任一完成）→ HIDDEN 胜利
- broadcastSurvives=false → EXTINCTION 失败
- 结论：**不成立（正常路径）**。broadcastTriggered 是 BROADCAST 的合法退出路径。

### CV-5：treachery 在 BROADCAST 累积达 100

**假设**：罗辑路线进入 BROADCAST 时 treachery 已高（如 90），BROADCAST 事件 +10 达 100。

**验证**：
- BROADCAST treachery 变化：year=235 +15, year=240 -5 = 净 +10
- 若进入 BROADCAST 时 treachery=90 → 90+15=100（year=235）→ DEFEAT_TREACHERY 触发
- EventSystem.ts:129 `Math.min(100, ...)` 确保 treachery 不超 100
- 结论：**成立（风险项）**。若 CRISIS+DETERRENCE treachery 累积≥90，BROADCAST year=235 事件将触发 DEFEAT_TREACHERY。但这是合理的失败退出，非 Bug。

### CV-6：CONQUEST 胜利在 BROADCAST 可达

**假设**：玩家在 BROADCAST 纪元满足 CONQUEST 所有条件。

**验证**：
- allowedEras 含 BROADCAST ✅
- treachery<50 ✅（若未触发高 treachery 事件）
- isAllCiviConquered() ✅（条件性，需征服所有异星文明）
- CONQUEST_DECLARED ✅（filteredEvent 或 Game.ts:1092 自动设置）
- !SWORDHOLDER_APPOINTED ⚠️（若 CRISIS filteredEvent 触发则阻断）
- !WANDERING_COMPLETED, !DIGITAL_ARK_UPGRADE, !DARK_DOMAIN_DECISION, !ZERO_HOMER_CONTACTED ✅
- 结论：**条件性成立**。CONQUEST 在 BROADCAST 可达，但 SWORDHOLDER_APPOINTED 可能阻断。

### CV-7：庄颜死亡后仍在事件中发言

**假设**：进入 BROADCAST 后庄颜被判定死亡，但 inner_conflict_resolution filteredEvent 仍以庄颜为 speaker。

**验证**：
- Game.ts:704 `if (p.isAlive && !this.eventManager.isPersonAliveInEpoch(p.name, currentEpochStr)) p.isAlive = false`
- epochDeathMap 庄颜含 BROADCAST → isPersonAliveInEpoch("庄颜", "BROADCAST") = false → p.isAlive=false
- inner_conflict_resolution（GameEventManager.ts:598）dialogQueue 含庄颜 → 事件触发时庄颜作为 speaker 出现
- filteredEvent 不检查 speaker 是否存活
- 结论：**成立（P2，CQ-3）**。死亡人物仍作为 speaker，叙事不一致。

### CV-8：章北海死亡后仍在事件中发言

**假设**：章北海在 DETERRENCE 死亡（epochDeathMap 含 DETERRENCE），但 conquest_declaration_event（epoch=BROADCAST）仍以章北海为 speaker。

**验证**：
- epochDeathMap 章北海含 ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"]
- 章北海在 DETERRENCE 纪元即被判定死亡
- conquest_declaration_event（GameEventManager.ts:657）dialogQueue 含章北海 → BROADCAST 纪元时章北海已死亡
- 结论：**成立（P2，CQ-7 新发现）**。章北海在 DETERRENCE 死亡但在 BROADCAST filteredEvent 中发言。

### CV-9：玩家从 BROADCAST 回退到 DETERRENCE

**假设**：culture 下降到 200 以下，纪元回退。

**验证**：
- Game.ts:770 `if (matched.epoch > this.epoch)` 防回退机制
- 仅当 matched.epoch > this.epoch 时推进，不回退
- 结论：**不成立**。纪元不可回退。

### CV-10：year 超过 350 在 BROADCAST 触发超时失败

**假设**：玩家卡在 BROADCAST，year 达 350+。

**验证**：
- Game.ts:1265 `if ((this.year > 350 || this.dimensionStrikeTriggered) && !黑域生成 && !数字方舟 && !DIMENSIONAL_DEFENSE && !DIMENSIONAL_DEFENSE_COMPLETED && !WANDERING_COMPLETED)`
- 若玩家未完成任何关键科技/防御 → DEFEAT_DIMENSION_STRIKE 或 DEFEAT_HELIUM_FLASH
- 结论：**成立（正常超时机制）**。这是 BROADCAST 卡死后的"超时"退出。

### CV-11：filteredEvent minYear 阻止 BROADCAST 事件触发

**假设**：broadcast_era_dawn minYear=120，若 BROADCAST 起始 year > 120 则不影响。

**验证**：
- BROADCAST 纪元 year ≥ 230（year=230 DETERRENCE 版事件触发后 culture 达 500）
- minYear=120/150/160/200 均低于 230
- 结论：**不成立（约束冗余但无害）**。minYear 不阻止任何 BROADCAST filteredEvent 触发。

### CV-12：FLAG_ALIAS_MAP 未映射导致 reqFlag 检查失败

**假设**：事件使用未映射的 FLAG 别名导致 reqFlag 检查失败。

**验证**：
- GameEventManager.ts:799 `const mapFlag = (f: string) => FLAG_ALIAS_MAP[f] || f`
- BROADCAST 事件 reqFlag：coordinates_broadcasted / trisolaris_destroyed / deterrence_held_strong / australia_migration
- 均在 FLAG_ALIAS_MAP 中无别名（使用原名）→ 直接使用原名检查
- 结论：**不成立**。BROADCAST 事件无 FLAG 别名映射问题。

### CV-13：randomevent 写入的 FLAG 被 events.json 读取

**假设**：tianming_fairy_tales / staircase_data 被 events.json 读取。

**验证**：
- 全量 Grep：tianming_fairy_tales 和 staircase_data 仅在 randomevents.json 写入点出现
- events.json 无 reqFlag 引用这两个 FLAG
- 结论：**成立（P2，CQ-2 部分）**。两个 randomevent FLAG 是死 FLAG。

### CV-14：swordholder 字段在 BROADCAST 被错误清除

**假设**：罗辑在 BROADCAST 死亡导致 swordholder 被清除。

**验证**：
- epochDeathMap 罗辑含 ["GALAXY"]，BROADCAST 中罗辑存活
- Game.ts:710-711 `if (this.earthCivi.swordholder === p.name && !p.isAlive) this.earthCivi.swordholder = null`
- 罗辑在 BROADCAST 中 isAlive=true → swordholder 不被清除
- 结论：**不成立**。swordholder 在 BROADCAST 保持 "罗辑"。

### CV-15：deterrenceEnduranceRounds 在 BROADCAST 达到 20 触发 DETERRENCE 胜利

**假设**：deterrenceEnduranceRounds 在 BROADCAST 累积达 20，触发 DETERRENCE 胜利。

**验证**：
- Game.ts:651 累积条件：epoch>=DETERRENCE && swordholder!==null && deterrenceValue>=80
- DETERRENCE 胜利条件（Game.ts:1013）allowedEras=[DETERRENCE]
- BROADCAST 纪元 epoch=3 ≠ DETERRENCE(2) → allowedEras 检查失败
- 结论：**不成立**。DETERRENCE 胜利仅在 DETERRENCE 纪元触发，BROADCAST 中 deterrenceEnduranceRounds 为死累积（CQ-6）。

### CV-16：跨级跳跃从 DETERRENCE 直接到 BUNKER

**假设**：culture 从 <500 跳到 ≥800，跳过 BROADCAST 直接进入 BUNKER。

**验证**：
- Game.ts:764 匹配 BUNKER（minCulture=800）
- Game.ts:770 检查 matched.epoch > this.epoch
- Game.ts:774 检查 BUNKER_WORLD_COMPLETED → 未设置 → allowed=false
- 结论：**不成立**。BUNKER 门控 FLAG 阻止跨级跳跃。

### CV-17：save/load 后 BROADCAST 状态丢失

**假设**：存档后读档，BROADCAST 关键状态丢失。

**验证**：
- broadcastTriggered/broadcastSurvives 不在排除列表 → 持久化 ✅
- epoch/year/culture/treachery/swordholder 不在排除列表 → 持久化 ✅
- flagManager 排除但 restorePrototypes 重建 → 持久化 ✅（AR-7 已部分修复）
- 结论：**不成立**。BROADCAST 关键状态存档/读档正常。

### CV-18：player 跳过 year=260 事件导致后续人物不可用

**假设**：year=260 云天明童话事件未触发（如被其他事件挤出队列），云天明/智子/关一帆不可解锁。

**验证**：
- year=260 事件 triggerCondition 无 reqFlag，仅 epoch=BROADCAST + minYear=260
- hasTriggered 去重确保事件只触发一次
- 但事件触发顺序由 checkEvents 按年份顺序检查，year=260 事件在 year≥260 时触发
- 若 year>260 时仍未触发（如被其他事件阻塞），后续年份仍会检查
- 结论：**不成立**。事件不会永久跳过，只是延迟触发。

### CV-19：broadcast_era_declared FLAG 有隐藏消费者

**假设**：broadcast_era_declared 在代码某处被读取。

**验证**：
- 全量 Grep：broadcast_era_declared 仅在 events.json:1124（写入点）出现
- 代码中无 hasFlag('broadcast_era_declared') 或 FLAG.BROADCAST_ERA_DECLARED
- 结论：**成立（P2，CQ-2 部分）**。broadcast_era_declared 是死 FLAG。

### CV-20：BROADCAST 纪元无正常推进路径到后续纪元

**假设**：BROADCAST 无法通过正常推进到达 BUNKER/GALAXY/STARDUST。

**验证**：
- BROADCAST→BUNKER：bunker_world_completed 循环依赖（AR-20）→ 不可达 ❌
- BROADCAST→GALAXY：需先到 BUNKER → 不可达 ❌
- BROADCAST→STARDUST：需先到 GALAXY → 不可达 ❌
- 玩家只能通过结局退出 BROADCAST（broadcastTriggered / CONQUEST / DEFEAT）
- 结论：**成立（P1）**。BROADCAST 是整个游戏推进链的终点纪元，后续纪元（BUNKER/GALAXY/STARDUST）在正常路径下永久不可达。

---

## 二、反例审计结果汇总

| 编号 | 结论 | 等级 | 对应候选问题 |
|---|---|---|---|
| CV-1 | 不成立 | - | - |
| CV-2 | **成立** | P1 | CQ-5（二阶循环依赖） |
| CV-3 | **成立** | P1 | CQ-1/AR-20（bunker_world_completed 循环依赖） |
| CV-4 | 不成立（正常路径） | - | - |
| CV-5 | 成立（正常失败机制） | - | 风险项（非 Bug） |
| CV-6 | 条件性成立 | - | CONQUEST 可达性（非 Bug） |
| CV-7 | **成立** | P2 | CQ-3（庄颜死后发言） |
| CV-8 | **成立** | P2 | CQ-7（章北海死后发言） |
| CV-9 | 不成立 | - | - |
| CV-10 | 成立（正常超时） | - | - |
| CV-11 | 不成立（冗余无害） | - | CQ-4（minYear 语义冗余） |
| CV-12 | 不成立 | - | - |
| CV-13 | **成立** | P2 | CQ-2（死 FLAG） |
| CV-14 | 不成立 | - | - |
| CV-15 | 不成立 | - | CQ-6（死累积） |
| CV-16 | 不成立 | - | - |
| CV-17 | 不成立 | - | - |
| CV-18 | 不成立 | - | - |
| CV-19 | **成立** | P2 | CQ-2（死 FLAG） |
| CV-20 | **成立** | P1 | CQ-1/AR-20（全链断裂） |

**成立项统计**：6 项成立（含 2 项 P1、2 项 P2、2 项正常机制），14 项不成立。

---

## 三、因果链闭合验证

### 3.1 入口因果链

```
DETERRENCE 纪元
  → year=219 选项B 罗辑连任 → swordholder_luoji_retained
  → year=220 威慑持续 → deterrence_held_strong
  → year=230 DETERRENCE 版事件触发（epoch=DETERRENCE, reqFlag=deterrence_held_strong）
  → coordinates_broadcasted 写入 ✅
  → culture≥500 + coordinates_broadcasted → 推进 BROADCAST ✅
```

**入口因果链闭合** ✅

### 3.2 内部因果链

```
BROADCAST 纪元
  → year=235 三体星系毁灭（reqFlag=coordinates_broadcasted）→ trisolaris_destroyed ✅
  → year=240 三体第二舰队逃离（reqFlag=trisolaris_destroyed）→ trisolaris_fleet_escaped ✅（死 FLAG）
  → year=260 云天明童话（无 reqFlag）→ unlock 云天明/智子/关一帆 ✅
  → year=261 广播纪元宣告（reqFlag=coordinates_broadcasted）→ broadcast_era_declared ✅（死 FLAG）
  → filteredEvent broadcast_era_dawn / bunker_project_debate / inner_conflict / conquest_declaration（条件触发）
```

**内部因果链闭合** ✅（事件链完整，死 FLAG 不影响闭合）

### 3.3 出口因果链

```
BROADCAST 纪元出口
  ├── broadcastTriggered 路径（WallfacerPanel UI）→ HIDDEN 胜利 / EXTINCTION 失败 ✅
  ├── CONQUEST 胜利路径（条件性）→ CONQUEST 胜利 ✅
  ├── DEFEAT_TREACHERY 路径 → treachery≥100 ✅
  ├── DEFEAT_EXTINCTION 路径 → population≤0 ✅
  ├── DEFEAT_DIMENSION_STRIKE 路径 → year>350 + 无关键科技 ✅
  └── → BUNKER 正常推进路径 ❌（AR-20 循环依赖断裂）
```

**出口因果链断裂** ❌ — 正常推进路径（BROADCAST→BUNKER）因 bunker_world_completed 循环依赖永久不可达。

### 3.4 全链闭合判定

| 链段 | 状态 | 断裂点 |
|---|---|---|
| 入口链 | ✅ 闭合 | - |
| 内部链 | ✅ 闭合 | - |
| 出口链（结局路径） | ✅ 闭合 | - |
| 出口链（正常推进） | ❌ 断裂 | AR-20: bunker_world_completed 循环依赖 |
| **全链** | **部分闭合** | BROADCAST 是推进链终点，后续纪元不可达 |

---

## 四、跨纪元问题追踪

### AR-5（FLAG 永久累积）

**BROADCAST 观察**：
- CRISIS FLAGs（eto_founded 等）+ DETERRENCE FLAGs（deterrence_established / swordholder_appointed / deterrence_held_strong 等）全部累积进入 BROADCAST
- swordholder_appointed 被 CONQUEST 胜利条件读取（`!SWORDHOLDER_APPOINTED`）→ 阻断征服胜利
- 其他 FLAG 无 reqNotFlag 读取 → 无影响
- **结论**：AR-5 在 BROADCAST 中通过 swordholder_appointed 对 CONQUEST 胜利产生影响，但属设计意图（执剑人路线与征服路线互斥）

### AR-7（Flag 引用漂移）

**BROADCAST 观察**：
- FLAG_ALIAS_MAP 处理 legacy 名称（bunker_cities_ready → bunker_world_completed 等）
- BROADCAST 事件无 FLAG 别名问题
- **结论**：AR-7 在 BROADCAST 中无影响

### UC-1（treachery 爆发）

**BROADCAST 观察**：
- 罗辑路线 BROADCAST treachery 净 +10（不含 filteredEvent）
- 若 CRISIS+DETERRENCE treachery 累积≥90 → year=235 +15 即触达 100 → DEFEAT_TREACHERY
- **结论**：UC-1 在 BROADCAST 中风险中等，取决于上游累积值

### UC-2（顺序风险）

**BROADCAST 观察**：
- year=235→240→260→261 事件通过 reqFlag 形成顺序链
- year=235 reqFlag=coordinates_broadcasted（入口已设置）✅
- year=240 reqFlag=trisolaris_destroyed（year=235 写入）✅
- year=261 reqFlag=coordinates_broadcasted（入口已设置）✅
- **结论**：UC-2 在 BROADCAST 中无顺序风险

---

## 五、因果链验证总结

**BROADCAST 纪元因果链状态**：

1. **入口**：罗辑路线闭合 ✅（程心路线因 AR-10 + CQ-5 不可达）
2. **内部**：事件链闭合 ✅（死 FLAG 不影响功能）
3. **出口**：结局路径闭合 ✅，正常推进路径断裂 ❌（AR-20）
4. **全链判定**：BROADCAST 纪元形成完整因果链，但 BROADCAST→BUNKER 正常推进永久不可达

**断裂点**：1 处（AR-20: bunker_world_completed 循环依赖）

**BROADCAST 是游戏推进链的终点纪元**：后续 BUNKER/GALAXY/STARDUST 纪元在正常路径下永久不可达。玩家只能通过结局（broadcastTriggered / CONQUEST / DEFEAT）退出 BROADCAST。

---

**EPOCH_CAUSAL_VALIDATION_广播纪元 验证完成。未修改代码。**
