# `EPOCH_CAUSAL_VALIDATION_掩体纪元`

> 纪元：掩体纪元（BUNKER, epoch=4）
> 阶段：反例审计 + 因果链闭合验证（未修改代码，未输出修复方案）
> 证据截止：20260712
> 引用文档：EPOCH_AUDIT_MODEL_掩体纪元、EPOCH_EVIDENCE_掩体纪元

---

## 一、反例审计方法论

对 EVIDENCE 阶段确认的 9 项候选问题（C-1~C-9），逐项设计反例验证：
- **反例假设**：假设问题成立，推演因果链
- **反例验证**：追踪代码证据，确认假设是否成立
- **结论**：成立（问题确认）/ 不成立（正常行为）/ 部分成立

同时对正常路径设计正向验证，确认因果链闭合。

---

## 二、反例验证

### 反例 V-1（验证 C-1：维德死亡人物发言 + unlock 死亡人物）

**假设**：维德进入 BUNKER 时被判定死亡，但 year=300/310 事件中维德作为 speaker，且 year=300 事件 unlock_person:维德 对死亡人物生效。

**反例推演**：
1. 进入 BUNKER → Game.ts:702-724 调用 `isPersonAliveInEpoch("维德", "BUNKER")`
2. epochDeathMap["维德"] = ["BUNKER","GALAXY"] → 包含 "BUNKER" → 返回 false → isAlive=false
3. year=300 事件触发（epoch=BUNKER, minYear=300, reqFlag=lightspeed_ship_tested）
4. events.json:1262 talk0_talker="维德" → 维德作为 speaker 发言
5. filteredEvent 触发时不检查 speaker 是否存活（基线 3.1 确认 checkEvents 不校验 speaker）
6. year=300 选择A effects 含 `{ "type": "unlock_person", "target": "维德" }`
7. EventSystem.applyUnlockPerson → PersonManager.unlockPerson("维德")
8. PersonManager.unlockPerson 仅检查 `persons.has("维德") && !availablePersons.has("维德")` → 不检查 isAlive → unlock 成功
9. 维德被加入 availablePersons，但 isAlive=false

**同类验证**：
- 林云：epochDeathMap 含 BUNKER → dimensional_threat_alert（:541）speaker="林云" → 死亡发言
- 丁仪：epochDeathMap 含 BUNKER → dimensional_defense_research_event（:699）speaker="丁仪" → 死亡发言

**结论**：**反例成立**。维德/林云/丁仪在 BUNKER 纪元死亡但仍作为 speaker，unlock_person 不检查 isAlive。与 AR-23（庄颜）/AR-24（章北海）同类。

---

### 反例 V-2（验证 C-2：black_domain_decision 命名分歧导致 DARK_DOMAIN 胜利不可达）

**假设**：玩家通过 events.json year=290 事件写入 black_domain_decision，但 DARK_DOMAIN 胜利仅检查 dark_domain_decision，导致经 events.json 路径无法达成 DARK_DOMAIN 胜利。

**反例推演**：
1. 玩家进入 BUNKER，year=290 触发黑域宣言事件
2. events.json:1217 effects 写入 `{ "target": "black_domain_decision" }`
3. EventSystem.applyNewEffects（:134-136）：`this.game.addFlag("black_domain_decision")` — 直接写入，不应用 alias
4. FlagManager.set("black_domain_decision") → flags.add("black_domain_decision")
5. 玩家完成黑域生成科技，year≥250，pop>0，treachery<80，无互斥 FLAG
6. checkVictoryConditions → DARK_DOMAIN 条件（Game.ts:1070）：`this.hasFlag(FLAG.DARK_DOMAIN_DECISION)`
7. FLAG.DARK_DOMAIN_DECISION = 'dark_domain_decision'（GameFlags.ts:34）
8. flagManager.isSet('dark_domain_decision') → flags.has('dark_domain_decision') → **false**（仅 has 'black_domain_decision'）
9. DARK_DOMAIN 胜利条件不满足

**对比验证**：
- 若玩家触发 filteredEvent `dark_domain_decision_event`（:647）→ 写入 `dark_domain_decision` → DARK_DOMAIN 胜利可达
- FLAG_ALIAS_MAP（:797）`black_domain_decision → dark_domain_decision` 仅用于 reqFlag/reqNotFlag 判定（:799-801），不用于写入

**结论**：**反例成立**。events.json year=290 写入 black_domain_decision 无法触发 DARK_DOMAIN 胜利。仅 filteredEvent 路径可触发。

---

### 反例 V-3（验证 C-3：6 个死 FLAG）

**假设**：bunker_era_declared / wade_coup / wade_executed / wade_succeeded / pluto_museum / solar_system_flattened 被写入但无消费者。

**反例推演（逐个验证）**：

| FLAG | 写入点 | Grep 搜索消费者 | 结论 |
|---|---|---|---|
| bunker_era_declared | events.json:1186 | 全库仅 1 处匹配（写入点） | ✅ 死 FLAG |
| wade_coup | events.json:1269/1280 | 全库仅写入点 + 图片映射（:75）| ✅ 死 FLAG |
| wade_executed | events.json:1303 | 全库仅写入点 + 图片映射（:76）| ✅ 死 FLAG |
| wade_succeeded | events.json:1324 | 全库仅写入点 | ✅ 死 FLAG |
| pluto_museum | events.json:1413 | 全库仅写入点 + alias + MuseumGallery（用事件id非FLAG）| ✅ 死 FLAG |
| solar_system_flattened | events.json:1444 | 全库仅写入点 + 图片映射（:78）| ✅ 死 FLAG |

**结论**：**反例成立**。6 个 FLAG 确认为死 FLAG，与 AR-15（deterrence_era_declared）/AR-22（BROADCAST 7 个死 FLAG）同类。

---

### 反例 V-4（验证 C-4：dimensional_alert_seen 双写）

**假设**：events.json:1348（year=340）和 GameEventManager.ts:546（filteredEvent）双写 dimensional_alert_seen，可能导致 filteredEvent 被 reqNotFlag 阻断或行为异常。

**反例推演**：
1. 进入 BUNKER，filteredEvent `dimensional_threat_alert`（:544）条件：`reqNotFlag=dimensional_alert_seen`
2. 若 filteredEvent 先触发（minYear=180，BUNKER year≥280 满足）→ 写入 dimensional_alert_seen
3. 后续 year=340 events.json 事件触发：triggerCondition 无 reqNotFlag=dimensional_alert_seen → **不受影响，正常触发**
4. year=340 事件 effects 再次写入 dimensional_alert_seen → FlagManager.set 已存在，无副作用
5. 反向：若 year=340 事件先触发（不可能，filteredEvent minYear=180 < 340，且 filteredEvent 每回合检查）

**结论**：**反例不成立（无功能影响）**。双写不导致阻断或异常，但增加维护成本。登记为 P3 可维护性问题。

---

### 反例 V-5（验证 C-5：filteredEvent minYear 冗余）

**假设**：5 个 BUNKER filteredEvent minYear（180/200/200/250/250）远低于 BUNKER 起始 year（≥280），约束冗余。

**反例推演**：
1. BUNKER 纪元 year≥280（从 BROADCAST 推进，BROADCAST year≥230 + culture 增长）
2. GameEventManager.ts:776：`if (cond.minYear !== undefined && game.year < cond.minYear) return false`
3. minYear=180/200/250 在 year≥280 时已满足（280>250>200>180）
4. minYear 约束冗余，实际约束由 reqTech/reqFlag/minCulture 提供

**结论**：**反例成立（无功能影响）**。minYear 语义冗余，与 AR-19（DETERRENCE）/AR-25（BROADCAST）同类。登记为 P3 可维护性问题。

---

### 反例 V-6（验证 C-6：value:0 FLAG 写入语义）

**假设**：events.json year=300 事件 effects 含 `"value": 0`（supported_wade/wade_coup/wade_opposed），FLAG 值为 0 可能不被 FlagManager 视为"已设置"。

**反例推演**：
1. events.json:1268：`{ "type": "flag", "target": "supported_wade", "value": 0 }`
2. EventSystem.applyNewEffects（:134-136）：`else if (eff.type === 'flag') { this.game.addFlag(eff.target); }` — **不读取 eff.value**
3. FlagManager.set（:34-36）：`this.flags.add(flag)` — Set.add，无 value 参数
4. FLAG 被添加到 Set，value:0 被忽略

**结论**：**反例不成立（正常行为）**。value:0 不影响 FLAG 设置，FLAG 正常写入。C-6 关闭，不作为问题。

---

### 反例 V-7（验证 C-7：deterrenceEnduranceRounds 死累积）

**假设**：罗辑路线 swordholder="罗辑"进入 BUNKER 后 deterrenceEnduranceRounds 持续累积，但 DETERRENCE 胜利仅限 DETERRENCE 纪元，BUNKER 中为死累积。

**反例推演**：
1. 罗辑路线：swordholder="罗辑"，进入 BUNKER（epoch=4）
2. Game.ts:651：`if (this.epoch >= EpochType.DETERRENCE && this.earthCivi.swordholder !== null)`
3. BUNKER epoch=4 >= DETERRENCE=2 && swordholder="罗辑" !== null → 条件满足
4. deterrenceValue≥80 时 deterrenceEnduranceRounds++，否则 reset 为 0
5. DETERRENCE 胜利（Game.ts:1013）allowedEras=[DETERRENCE]
6. BUNKER epoch=4 ≠ DETERRENCE=2 → allowedEras 检查失败（Game.ts:1153）
7. deterrenceEnduranceRounds 累积值无消费者

**结论**：**反例成立**。deterrenceEnduranceRounds 在 BUNKER 中死累积，与 AR-26（BROADCAST 同类）一致。

---

### 反例 V-8（验证 C-8：treachery +50 高风险）

**假设**：year=340 二向箔警报 treachery+50，若 BROADCAST 末 treachery 已较高，可能触达 100 → DEFEAT_TREACHERY 提前触发，阻断后续事件。

**反例推演**：
1. 假设 BROADCAST 末 treachery=50（UC-11 未确认典型值）
2. 进入 BUNKER 后：
   - year=300 支持维德：treachery +30 → 80
   - year=310 维德处决：treachery +5 → 85
   - year=340 二向箔警报：treachery +50 → **135，但 Game.ts:129 上限 100** → treachery=100
3. checkVictoryConditions（Game.ts:1219）：`if (this.earthCivi.treachery >= 100)` → DEFEAT_TREACHERY 触发
4. 游戏结束，year=350~365 事件不再触发
5. BUNKER→GALAXY 推进链断裂（但通过 DEFEAT 退出，非"卡死"）

**风险评估**：
- 若 BROADCAST 末 treachery≥15（支持维德路线 +30+5=35 → 50+35=85 → +50=135→100），则 DEFEAT_TREACHERY 必然触发
- 若 BROADCAST 末 treachery<15，则 15+35+50=100，仍可能触发
- 实际风险取决于 BROADCAST 末 treachery 典型值（UC-11 未确认）

**结论**：**反例条件性成立**。treachery +50 高风险确认，但是否触达 100 取决于 BROADCAST 末 treachery 累积值（UC-11 未确认）。登记为未确认问题。

---

### 反例 V-9（验证 C-9：dimensionStrikeTriggered vs dimensional_strike 双系统）

**假设**：events.json:1373 写入 dimensional_strike FLAG 但不设置 dimensionStrikeTriggered 字段，两个系统独立可能导致逻辑不一致。

**反例推演**：
1. year=350 事件触发 → events.json:1373 写入 `dimensional_strike` FLAG
2. EventSystem.applyNewEffects → `addFlag("dimensional_strike")` → FLAG 设置
3. **不设置** `dimensionStrikeTriggered` 字段（EventSystem 不操作此字段）
4. Game.ts:1265 DEFEAT 条件：`(this.year > 350 || this.dimensionStrikeTriggered)` 
5. year=350 事件后 year 继续递增，year>350 时 DEFEAT 条件满足（通过 year>350 而非 dimensionStrikeTriggered）
6. Game.ts:775 GALAXY 门控：`!GALAXY_EXODUS_SEEN && !DIMENSIONAL_STRIKE` → dimensional_strike FLAG 设置 → 门控通过
7. 两个系统独立但功能互补：FLAG 用于 GALAXY 门控，字段用于 DEFEAT 判定

**反向验证**：
- AlienCivilization.ts:333 设置 dimensionStrikeTriggered=true（异星 AI 降维打击，无防御时）
- 此时 dimensional_strike FLAG 未设置（AlienCivilization 不设置此 FLAG）
- 但 year>350 仍可触发 DEFEAT，GALAXY 门控可能不通过（若 dimensional_strike FLAG 未设置且 galaxy_exodus_seen 也未设置）

**结论**：**反例部分成立**。两个系统独立确认，但 year>350 可独立触发 DEFEAT（无需 dimensionStrikeTriggered），且 events.json dimensional_strike FLAG 可独立满足 GALAXY 门控。功能上互补，不构成阻断性问题。登记为 P3 架构观察。

---

## 三、正向因果链验证

### 3.1 正常推进路径验证

**路径**：BROADCAST→BUNKER→GALAXY（假设 AR-20 修复后）

```
[BROADCAST] culture≥800 + bunker_world_completed(AR-20修复)
  → Game.ts:774 门控通过 → 推进 BUNKER ✅
  → year=280 掩体世界落成 → bunker_world_completed（已设置，无副作用）✅
  → year=281 掩体纪元宣告 → bunker_era_declared（死FLAG，无影响）✅
  → year=290 黑域宣言 → black_domain_decision（⚠️ 不触发DARK_DOMAIN胜利，但不阻断推进）✅
  → year=295 光速飞船测试 → lightspeed_ship_tested ✅
  → year=300 维德政变 → supported_wade 或 wade_opposed ✅
  → year=310 维德被处决 或 光速飞船量产 ✅
  → year=340 二向箔警报 → dimensional_alert_seen + treachery+50 ⚠️（可能触发DEFEAT）
  → year=350 二向箔打击 → dimensional_strike ✅
  → year=355 冥王星博物馆 → pluto_museum（死FLAG）✅
  → year=360 太阳系二维化 → solar_system_flattened（死FLAG）✅
  → year=365 银河出逃 → galaxy_exodus_seen ✅
  → culture≥1200 + galaxy_exodus_seen → Game.ts:775 门控通过 → 推进 GALAXY ✅
```

**结论**：正常推进路径因果链闭合（假设 AR-20 修复 + treachery 未触达 100）。

### 3.2 结局退出路径验证

**WANDERING 胜利**：
- CRISIS 纪元 wandering_earth_decision filteredEvent 写入 wandering_completed
- BUNKER 纪元 year≥250 + 行星发动机Ⅲ型 + 新家园选址 + wandering_completed + 无互斥 FLAG
- ✅ 可达（但需 CRISIS 纪元触发 filteredEvent + BUNKER 前完成科技）

**DIGITAL 胜利**：
- BUNKER filteredEvent digital_ark_upgrade_event 写入 digital_ark_upgrade
- year≥200 + pop>50 + 数字方舟 + digital_ark_upgrade + 无互斥 FLAG
- ✅ 可达

**DARK_DOMAIN 胜利**：
- ⚠️ events.json year=290 写入 black_domain_decision → **不触发** DARK_DOMAIN 胜利
- ✅ filteredEvent dark_domain_decision_event 写入 dark_domain_decision → 可触发
- 条件性可达（仅 filteredEvent 路径）

**CONQUEST 胜利**：
- 需 BROADCAST 已 conquest_declared + isAllCiviConquered
- UC-12/U-BK4 未确认 BUNKER 中 isAllCiviConquered 可达性
- 条件性可达

**NEUTRAL_COSMIC_SILENCE**：
- epoch≥BUNKER + (dark_domain_decision 或 black_domain_decision) + pop 1~10 + deterrence<20
- ✅ 可达（black_domain_decision 也可触发此中性结局）

**DEFEAT_TREACHERY**：
- treachery≥100，year=340 +50 高风险
- ⚠️ 条件性触发（取决于 BROADCAST 末 treachery）

**DEFEAT_EXTINCTION**：
- pop≤0，year=350 -40 + year=365 -80
- ⚠️ 条件性触发（取决于 BROADCAST 末 population）

**DEFEAT_DIMENSION_STRIKE / HELIUM_FLASH**：
- year>350 + 无防御科技
- ✅ 可达

### 3.3 入口/出口闭合验证

| 路径 | 闭合状态 | 条件 |
|---|---|---|
| 入口 BROADCAST→BUNKER | ❌ 不闭合 | AR-20 循环依赖（继承） |
| 出口 BUNKER→GALAXY | ✅ 闭合 | galaxy_exodus_seen / dimensional_strike 可在 BUNKER 内写入 |
| 结局退出 | ✅ 闭合 | 9 种结局可触发 |

---

## 四、因果链闭合验证总结

### 4.1 因果链状态

```
BROADCAST → [AR-20断裂] → BUNKER → [出口闭合] → GALAXY
                              ↓
                    9 种结局退出路径
```

**BUNKER 内部因果链**：闭合（假设能进入 BUNKER）
**BUNKER→GALAXY 出口**：闭合
**入口**：不闭合（AR-20 继承）

### 4.2 反例验证汇总

| 反例 | 候选 ID | 结论 | 等级 |
|---|---|---|---|
| V-1 | C-1 | ✅ 成立：维德/林云/丁仪死亡发言 + unlock死亡人物 | P2 |
| V-2 | C-2 | ✅ 成立：black_domain_decision 命名分歧，DARK_DOMAIN 经events.json不可达 | P2 |
| V-3 | C-3 | ✅ 成立：6 个死 FLAG | P2 |
| V-4 | C-4 | ❌ 不成立（无功能影响）：双写不阻断 | P3（可维护性） |
| V-5 | C-5 | ✅ 成立（无功能影响）：minYear 冗余 | P3（可维护性） |
| V-6 | C-6 | ❌ 不成立：value:0 不影响 FLAG 设置 | 关闭 |
| V-7 | C-7 | ✅ 成立：deterrenceEnduranceRounds 死累积 | P3 |
| V-8 | C-8 | ⚠️ 条件性成立：treachery +50 高风险（依赖 UC-11） | 未确认 |
| V-9 | C-9 | ⚠️ 部分成立：双系统独立（功能互补，非阻断） | P3（架构观察） |

### 4.3 正式问题预判

**将进入正式问题清单的项**（证据闭合）：
- AR-27（C-1）：维德/林云/丁仪死亡人物发言 + unlock 死亡人物 — P2
- AR-28（C-2）：black_domain_decision 命名分歧，DARK_DOMAIN 胜利经 events.json 不可达 — P2
- AR-29（C-3）：6 个死 FLAG — P2
- AR-30（C-5）：5 个 filteredEvent minYear 冗余 — P3
- AR-31（C-7）：deterrenceEnduranceRounds 死累积（AR-26 同类） — P3
- AR-32（C-4）：dimensional_alert_seen 双写（可维护性） — P3
- AR-33（C-9）：dimensionStrikeTriggered vs dimensional_strike 双系统独立（架构观察） — P3

**将进入未确认问题的项**：
- UC-14（C-8）：treachery +50 是否触达 100（依赖 UC-11 BROADCAST 末 treachery 典型值）

**关闭的项**：
- C-6：value:0 不影响 FLAG 设置，不作为问题

### 4.4 跨纪元问题持续追踪

| 编号 | 问题 | BUNKER 观察 |
|---|---|---|
| AR-5 | FLAG 永久累积 | 持续观察：BUNKER 写入 18 个 FLAG，6 个死 FLAG，无跨纪元清理 |
| AR-7 | Flag 引用漂移 | 持续观察：restorePrototypes 已增加引用一致性检查 |
| UC-1 | treachery 爆发 | ⚠️ BUNKER year=340 +50 高风险（UC-14） |
| UC-2 | 顺序风险 | 持续观察：BUNKER 事件 year 顺序正确 |

---

## 五、因果链闭合结论

### 5.1 本纪元是否形成完整因果链

**BUNKER 内部因果链闭合，出口闭合，入口继承 AR-20 断裂**。

正常路径（假设 AR-20 修复后进入 BUNKER）：
```
year=280 → 281 → 290 → 295 → 300 → 310 → 340 → 350 → 355 → 360 → 365 → GALAXY
```
内部事件 reqFlag 链式依赖正确，出口 FLAG 可在 BUNKER 内写入。

**结局退出路径闭合**：9 种结局可触发（DARK_DOMAIN 仅 filteredEvent 路径可达）。

### 5.2 关键风险

- **treachery +50 高风险**（UC-14）：year=340 可能导致 DEFEAT_TREACHERY 提前触发，阻断后续事件
- **population 大幅下降**：year=350 -40 + year=365 -80，可能导致 DEFEAT_EXTINCTION
- **DARK_DOMAIN 胜利条件性可达**：仅 filteredEvent 路径可触发（AR-28）

### 5.3 是否允许进入下一纪元审计

**允许**，附带条件：
- AR-20（BROADCAST→BUNKER 循环依赖）导致 BUNKER 在正常路径下不可达，BUNKER 审计基于静态代码分析
- BUNKER→GALAXY 出口闭合，后续 GALAXY 纪元审计可基于正常路径验证
- UC-14（treachery 风险）应在 GALAXY 纪元审计中持续观察

---

**EPOCH_CAUSAL_VALIDATION_掩体纪元 验证完成。未修改代码，未输出修复方案。**

**反例验证**：9 项反例，6 项成立（含 2 项无功能影响），1 项条件性成立，1 项部分成立，1 项不成立
**正式问题预判**：7 项（AR-27~AR-33），含 P2×3、P3×4
**未确认问题**：1 项（UC-14）
**因果链状态**：内部闭合 + 出口闭合，入口继承 AR-20 断裂
