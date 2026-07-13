# `AUDIT_REPORT_掩体纪元`

> 纪元：掩体纪元（BUNKER, epoch=4）
> 阶段：正式审计报告
> 证据截止：20260712
> 引用文档：EPOCH_AUDIT_MODEL_掩体纪元、EPOCH_EVIDENCE_掩体纪元、EPOCH_CAUSAL_VALIDATION_掩体纪元、AUDIT_20260712_BASELINE、AUDIT_20260712_AUDIT_REPORT_广播纪元
> 约束：未修改代码，未输出可直接执行的修复方案

---

## 第一部分：完成门禁检查

| 门禁项 | 状态 | 说明 |
|---|---|---|
| 1. 所有事件已进入清单 | ✅ 满足 | 剧情事件 13 条（epoch=BUNKER，year 280~365）+ 1 条跨纪元事件（year=400 流浪地球）+ 5 个 filteredEvent + 6 个纯 BUNKER 随机事件全部入清单，effects 已逐一展开 |
| 2. 所有关键人物已有状态轨迹 | ✅ 满足 | 3 人 BUNKER 期间死亡发言（维德/林云/丁仪，epochDeathMap 含 BUNKER）+ 7 人存活（罗辑/程心/云天明/智子/艾AA/关一帆/刘慈欣）均有完整轨迹 |
| 3. 所有读取状态都有合法生产者 | ⚠️ 部分满足 | galaxy_exodus_seen / dimensional_strike / lightspeed_ship_tested 等有合法生产者；**bunker_world_completed 唯一写入点 epoch=BUNKER（继承 AR-20 循环依赖）**，BROADCAST 纪元无法触发 |
| 4. 所有关键写入都有消费者或明确终止意义 | ⚠️ 部分满足 | 12 个活 FLAG 有消费者；**6 个死 FLAG 无消费者**（bunker_era_declared / wade_coup / wade_executed / wade_succeeded / pluto_museum / solar_system_flattened） |
| 5. 所有关键数值都有来源、范围和消费位置 | ✅ 满足 | culture / treachery / population / economy / military / prestige 6 个数值字段均有公式、阈值、消费位置；treachery year=340 +50 高风险已量化 |
| 6. 所有 Tag/Flag 生命周期已追踪 | ✅ 满足 | 18 个 FLAG（12 活 + 6 死）+ 1 个 Tag（bunker_era）全量读写链已追踪；FLAG_ALIAS_MAP 应用范围（仅读取不写入）已确认 |
| 7. 所有科技条件存在合法路径 | ✅ 满足 | BUNKER filteredEvent 科技依赖（数字方舟/黑域生成/空间曲率理论）+ 结局科技条件（行星发动机Ⅲ型/新家园选址/数字方舟/黑域生成/防御科技）均有合法前置链 |
| 8. 所有纪元出口已验证 | ✅ 满足 | 正常推进出口（→GALAXY）闭合：galaxy_exodus_seen（year=365）和 dimensional_strike（year=350）均可在 BUNKER 内写入，满足 Game.ts:775 门控；结局退出路径（9 种结局）已验证 |
| 9. 所有可能结局已检查竞争关系 | ✅ 满足 | broadcastTriggered 短路优先（BUNKER 中为 false）+ 胜利结局数组顺序（HIDDEN→WANDERING→DIGITAL→DETERRENCE→CONQUEST→DARK_DOMAIN）+ NEUTRAL_COSMIC_SILENCE + DEFEAT 优先级（TREACHERY→EXTINCTION→DIMENSION_STRIKE/HELIUM_FLASH） |
| 10. 正常路径和反例路径均已检查 | ✅ 满足 | 9 项反例全部验证（6 项成立含 3 项 P2 + 3 项 P3，1 项条件性成立，1 项部分成立，1 项不成立）+ 正向因果链验证 |
| 11. 存档边界已检查 | ✅ 满足 | epoch/year/culture/treachery/population/economy/military/prestige/swordholder/deterrenceEnduranceRounds/dimensionStrikeTriggered/broadcastTriggered/flags Set 均持久化 |
| 12. 未确认项已明确列出 | ✅ 满足 | 1 项未确认项已列出（UC-14 treachery +50 是否触达 100） |
| 13. 相邻纪元接口已登记待复核 | ✅ 满足 | 上游 BROADCAST→BUNKER 9 项接口已复核；下游 BUNKER→GALAXY 接口已登记（见报告末尾） |

**门禁结论**：13 项中 11 项满足、2 项部分满足。部分满足项因"bunker_world_completed 循环依赖（继承 AR-20）"和"6 个死 FLAG 无消费者"导致。**允许进入正式问题清单阶段**。

---

## 第二部分：正式问题清单

> 仅证据闭合的问题进入本清单。证据未完全闭合的风险项列入"未确认问题"。

---

### AR-27

```text
问题 ID：AR-27
等级：P2
问题类型：叙事不一致 / 死亡人物发言 + unlock 死亡人物（与 AR-23/AR-24 同类）
涉及纪元：掩体纪元（BUNKER）
现象：维德/林云/丁仪进入 BUNKER 时已被判定死亡（epochDeathMap 含 BUNKER），但仍作为 BUNKER 事件 speaker 发言；且 year=300 事件含 unlock_person:维德 对死亡人物生效
前置条件：进入 BUNKER 纪元
完整因果链：
  1. Game.ts:702-724 进入 BUNKER 时调用 isPersonAliveInEpoch
  2. 维德 epochDeathMap["维德"]=["BUNKER","GALAXY"] → 包含 "BUNKER" → isAlive=false
  3. 林云 epochDeathMap 含 BUNKER → isAlive=false
  4. 丁仪 epochDeathMap 含 BUNKER → isAlive=false
  5. year=300 维德政变事件触发（epoch=BUNKER, minYear=300, reqFlag=lightspeed_ship_tested）
  6. events.json:1262 talk0_talker="维德" → 维德作为 speaker 发言（死亡人物发言）
  7. year=300 选择A effects 含 { "type": "unlock_person", "target": "维德" }
  8. EventSystem.applyUnlockPerson（EventSystem.ts:247-271）→ PersonManager.unlockPerson("维德")
  9. PersonManager.unlockPerson（PersonManager.ts:32-37）仅检查 persons.has && !availablePersons.has → 不检查 isAlive → unlock 成功
 10. 维德被加入 availablePersons 但 isAlive=false
 11. 林云在 filteredEvent dimensional_threat_alert（:541）作为 speaker → 死亡发言
 12. 丁仪在 filteredEvent dimensional_defense_research_event（:699）作为 speaker → 死亡发言
预期行为：死亡人物不应在事件中作为 speaker 出现；unlock_person 不应对死亡人物生效
实际行为：维德/林云/丁仪在 BUNKER 死亡但仍作为 speaker；unlock_person 不检查 isAlive 对死亡人物生效
代码证据：
  - GameEventManager.ts:958 epochDeathMap 维德含 ["BUNKER","GALAXY"]
  - GameEventManager.ts:937-991 林云/丁仪 epochDeathMap 含 BUNKER
  - events.json:1262/1300/1321 维德作为 talker（year=300/310）
  - GameEventManager.ts:541 林云作为 dimensional_threat_alert speaker
  - GameEventManager.ts:699 丁仪作为 dimensional_defense_research_event speaker
  - PersonManager.ts:32-37 unlockPerson 不检查 isAlive
  - EventSystem.ts:247-271 applyUnlockPerson 不检查 isAlive
设计证据：维德在原著中于掩体纪元初期政变失败被处决；林云/丁仪早在危机纪元已死亡
测试证据：无测试覆盖 BUNKER 事件 speaker 存活一致性；无测试覆盖 unlock_person 对死亡人物的效果
影响范围：
  - 叙事不一致（3 个人物死亡后发言）
  - unlock_person 对死亡人物生效，可能导致 UI 显示死亡人物为可用状态
是否稳定可复现：是（每次进入 BUNKER 必现）
尚缺证据：无
建议修复方向：
  1. 将维德/林云/丁仪替换为其他存活人物（如科学执政官/关一帆/罗辑）
  2. 或调整 epochDeathMap 死亡纪元（如维德改为 ["GALAXY"]，但需评估对原著叙事一致性影响）
  3. PersonManager.unlockPerson 增加 isAlive 检查
建议回归测试：验证 BUNKER 纪元事件中无死亡人物作为 speaker；unlock_person 对死亡人物不生效
```

---

### AR-28

```text
问题 ID：AR-28
等级：P2
问题类型：结局不可达 / FLAG 命名分歧（与 AR-7 Flag 引用漂移同类）
涉及纪元：掩体纪元（BUNKER）
现象：events.json year=290 黑域宣言事件写入 black_domain_decision，但 DARK_DOMAIN 胜利仅检查 dark_domain_decision；FLAG_ALIAS_MAP 仅用于读取判定不用于写入，导致经 events.json 路径无法触发 DARK_DOMAIN 胜利
前置条件：进入 BUNKER 纪元，玩家通过 year=290 事件选择黑域宣言
完整因果链：
  1. 玩家进入 BUNKER，year=290 触发黑域宣言事件
  2. events.json:1217 effects 写入 { "target": "black_domain_decision" }
  3. EventSystem.applyNewEffects（EventSystem.ts:134-136）：this.game.addFlag("black_domain_decision") — 直接写入原始字符串，不应用 FLAG_ALIAS_MAP
  4. FlagManager.set("black_domain_decision") → flags.add("black_domain_decision")
  5. 玩家完成黑域生成科技，year≥250，pop>0，treachery<80，无互斥 FLAG
  6. checkVictoryConditions → DARK_DOMAIN 条件（Game.ts:1070）：this.hasFlag(FLAG.DARK_DOMAIN_DECISION)
  7. FLAG.DARK_DOMAIN_DECISION = 'dark_domain_decision'（GameFlags.ts）
  8. flagManager.isSet('dark_domain_decision') → flags.has('dark_domain_decision') → false（仅 has 'black_domain_decision'）
  9. DARK_DOMAIN 胜利条件不满足
预期行为：year=290 事件写入的 FLAG 应能触发 DARK_DOMAIN 胜利
实际行为：events.json 写入 black_domain_decision 无法触发 DARK_DOMAIN 胜利，仅 filteredEvent dark_domain_decision_event 路径可触发
代码证据：
  - events.json:1217 写入 black_domain_decision
  - Game.ts:1070 DARK_DOMAIN 胜利仅检查 FLAG.DARK_DOMAIN_DECISION（= dark_domain_decision）
  - GameEventManager.ts:797 FLAG_ALIAS_MAP: 'black_domain_decision' → 'dark_domain_decision'
  - GameEventManager.ts:799-801 alias 仅用于 reqFlag/reqNotFlag 判定（isEventEligible）
  - EventSystem.ts:134-136 applyNewEffects 不应用 alias
  - GameEventManager.ts:647 filteredEvent dark_domain_decision_event 写入 dark_domain_decision（唯一可触发 DARK_DOMAIN 的路径）
设计证据：FLAG_ALIAS_MAP 存在表明设计者意识到命名分歧，但仅在读取层修补，未覆盖写入层
测试证据：无测试覆盖 events.json black_domain_decision 与 DARK_DOMAIN 胜利的关系
影响范围：
  - 玩家通过 year=290 事件选择黑域宣言后，无法达成 DARK_DOMAIN 胜利
  - DARK_DOMAIN 胜利仅能通过 filteredEvent dark_domain_decision_event 触发（需黑域生成科技 + minCulture=50 + reqNotFlag=dark_domain_decision）
  - black_domain_decision 仅被 NEUTRAL_COSMIC_SILENCE（Game.ts:1202，dark|black 二选一）读取
是否稳定可复现：是（每次 year=290 事件选择后必现）
尚缺证据：无
建议修复方向：
  1. 将 events.json:1217 写入的 black_domain_decision 改为 dark_domain_decision（统一命名）
  2. 或在 EventSystem.applyNewEffects 中应用 FLAG_ALIAS_MAP（但影响范围大，需评估副作用）
  3. 或在 DARK_DOMAIN 胜利条件中同时检查 black_domain_decision 和 dark_domain_decision
建议回归测试：验证 year=290 事件写入后可触发 DARK_DOMAIN 胜利
```

---

### AR-29

```text
问题 ID：AR-29
等级：P2
问题类型：Tag/Flag 异常 / 死 FLAG 群（与 AR-15/AR-22 同类）
涉及纪元：掩体纪元（BUNKER）
现象：BUNKER 纪元期间 6 个 FLAG 被写入但无任何消费者，是死 FLAG
前置条件：无
完整因果链：
  1. bunker_era_declared：events.json:1186 写入（year=281），0 读取
  2. wade_coup：events.json:1269/1280 写入（year=300 两选择），0 读取（仅图片映射引用）
  3. wade_executed：events.json:1303 写入（year=310 维德处决），0 读取（仅图片映射引用）
  4. wade_succeeded：events.json:1324 写入（year=310 光速量产），0 读取
  5. pluto_museum：events.json:1413 写入（year=355），0 读取（MuseumGallery 使用事件 id 非 FLAG；alias human_heritage_archived 无写入）
  6. solar_system_flattened：events.json:1444 写入（year=360），0 读取（仅图片映射引用）
预期行为：写入的 FLAG 应有至少一个消费者
实际行为：6 个 FLAG 无消费者，是死 FLAG
代码证据：
  - 全量 Grep 验证每个 FLAG 仅写入点匹配，无读取点
  - 部分 FLAG 有图片映射引用（wade_coup/wade_executed/solar_system_flattened）但非逻辑消费者
设计证据：无
测试证据：无
影响范围：无直接影响；增加维护成本，可能暗示遗漏的功能点（如维德路线结局分支、冥王星博物馆彩蛋）
是否稳定可复现：是
尚缺证据：无
建议修复方向：移除死 FLAG 写入，或补充消费者（如维德路线结局判定、博物馆参观机制）
建议回归测试：验证死 FLAG 被移除或有完整读写链
```

---

### AR-30

```text
问题 ID：AR-30
等级：P3
问题类型：可维护性 / minYear 语义冗余（与 AR-19/AR-25 同类）
涉及纪元：掩体纪元（BUNKER）
现象：5 个 BUNKER filteredEvent 的 minYear（180/200/200/250/250）远低于 BUNKER 起始 year（≥280），约束冗余
前置条件：进入 BUNKER 纪元
完整因果链：
  1. BUNKER 纪元 year≥280（从 BROADCAST 推进，BROADCAST year≥230 + culture 增长至 800）
  2. GameEventManager.ts:776：if (cond.minYear !== undefined && game.year < cond.minYear) return false
  3. minYear=180/200/250 在 year≥280 时已满足（280>250>200>180）
  4. minYear 约束冗余，实际约束由 reqTech/reqFlag/minCulture/minPop 提供
预期行为：minYear 应反映设计意图（纪元内偏移或合理绝对年份）
实际行为：minYear 语义为绝对年份，但值远低于纪元起始 year
代码证据：
  - GameEventManager.ts:536 dimensional_threat_alert minYear:180
  - GameEventManager.ts:623 digital_ark_upgrade_event minYear:200
  - GameEventManager.ts:637 dark_domain_decision_event minYear:250
  - GameEventManager.ts:693 dimensional_defense_research_event minYear:200
  - GameEventManager.ts:707 dimensional_defense_completed_event minYear:250
  - GameEventManager.ts:776 game.year < cond.minYear 使用绝对年份
设计证据：minYear 可能原设计为"纪元内偏移"
测试证据：无
影响范围：无功能影响；语义不一致增加维护成本
是否稳定可复现：是
尚缺证据：无
建议修复方向：调整 minYear 为合理值（如 290/300/320 表示 BUNKER 内偏移），或在注释中说明语义
建议回归测试：验证 filteredEvent 触发时点符合设计意图
```

---

### AR-31

```text
问题 ID：AR-31
等级：P3
问题类型：可维护性 / 数值冗余（与 AR-26 同类）
涉及纪元：掩体纪元（BUNKER）
现象：罗辑路线 swordholder="罗辑"进入 BUNKER 后 deterrenceEnduranceRounds 持续累积（Game.ts:651），但 DETERRENCE 胜利仅限 DETERRENCE 纪元（allowedEras=[DETERRENCE]），BUNKER 中为死累积
前置条件：罗辑路线进入 BUNKER（swordholder="罗辑"）
完整因果链：
  1. Game.ts:651 if (this.epoch >= EpochType.DETERRENCE && this.earthCivi.swordholder !== null)
  2. BUNKER 纪元 epoch=4 >= DETERRENCE=2 && swordholder="罗辑" !== null → 条件满足
  3. deterrenceValue≥80 时 deterrenceEnduranceRounds++，否则 reset 为 0
  4. DETERRENCE 胜利条件（Game.ts:1013）allowedEras=[DETERRENCE]
  5. BUNKER 纪元 epoch=4 ≠ DETERRENCE=2 → allowedEras 检查失败（Game.ts:1153）
  6. deterrenceEnduranceRounds 累积值无消费者
预期行为：deterrenceEnduranceRounds 累积应仅在 DETERRENCE 纪元内有效
实际行为：BUNKER 中持续累积但无消费者
代码证据：
  - Game.ts:651 累积条件 epoch>=DETERRENCE
  - Game.ts:1013 DETERRENCE 胜利 allowedEras=[DETERRENCE]
  - Game.ts:1019 deterrenceEnduranceRounds>=20 消费点（仅在 DETERRENCE 胜利条件内）
设计证据：无
测试证据：无
影响范围：无功能影响；数值冗余
是否稳定可复现：是
尚缺证据：无
建议修复方向：将 Game.ts:651 累积条件改为 this.epoch === EpochType.DETERRENCE，或在 DETERRENCE 纪元出口时冻结 deterrenceEnduranceRounds
建议回归测试：验证 DETERRENCE 纪元出口后 deterrenceEnduranceRounds 不再累积
```

---

### AR-32

```text
问题 ID：AR-32
等级：P3
问题类型：可维护性 / FLAG 双写
涉及纪元：掩体纪元（BUNKER）
现象：dimensional_alert_seen 被 events.json:1348（year=340）和 GameEventManager.ts:546（filteredEvent dimensional_threat_alert）双写同一 FLAG，可能导致维护困惑
前置条件：进入 BUNKER 纪元
完整因果链：
  1. filteredEvent dimensional_threat_alert（:544）条件：reqNotFlag=dimensional_alert_seen
  2. filteredEvent 触发（minYear=180，BUNKER year≥280 满足）→ 写入 dimensional_alert_seen
  3. 后续 year=340 events.json 事件触发：triggerCondition 无 reqNotFlag=dimensional_alert_seen → 不受影响，正常触发
  4. year=340 事件 effects 再次写入 dimensional_alert_seen → FlagManager.set 已存在，无副作用
预期行为：同一 FLAG 应有单一写入点，或双写应有明确语义
实际行为：双写不导致功能异常，但增加维护成本
代码证据：
  - events.json:1348 year=340 事件写入 dimensional_alert_seen
  - GameEventManager.ts:546 filteredEvent dimensional_threat_alert 写入 dimensional_alert_seen
  - GameEventManager.ts:544 filteredEvent reqNotFlag=dimensional_alert_seen（自写入后不再触发）
设计证据：无
测试证据：无
影响范围：无功能影响；可维护性成本
是否稳定可复现：是
尚缺证据：无
建议修复方向：统一为单一写入点（建议保留 filteredEvent，移除 events.json 写入，或反之并调整 reqNotFlag 逻辑）
建议回归测试：验证 dimensional_alert_seen 读写链单一清晰
```

---

### AR-33

```text
问题 ID：AR-33
等级：P3
问题类型：架构观察 / 双系统独立
涉及纪元：掩体纪元（BUNKER）
现象：events.json:1373 写入 dimensional_strike FLAG 但不设置 dimensionStrikeTriggered 字段，两个系统独立可能导致逻辑不一致
前置条件：进入 BUNKER 纪元，year=350 事件触发
完整因果链：
  1. year=350 事件触发 → events.json:1373 写入 dimensional_strike FLAG
  2. EventSystem.applyNewEffects → addFlag("dimensional_strike") → FLAG 设置
  3. 不设置 dimensionStrikeTriggered 字段（EventSystem 不操作此字段）
  4. Game.ts:1265 DEFEAT 条件：(this.year > 350 || this.dimensionStrikeTriggered)
  5. year=350 事件后 year 继续递增，year>350 时 DEFEAT 条件满足（通过 year>350 而非 dimensionStrikeTriggered）
  6. Game.ts:775 GALAXY 门控：!GALAXY_EXODUS_SEEN && !DIMENSIONAL_STRIKE → dimensional_strike FLAG 设置 → 门控通过
  7. 两个系统独立但功能互补：FLAG 用于 GALAXY 门控，字段用于 DEFEAT 判定
反向验证：
  - AlienCivilization.ts:333 设置 dimensionStrikeTriggered=true（异星 AI 降维打击，无防御时）
  - 此时 dimensional_strike FLAG 未设置（AlienCivilization 不设置此 FLAG）
  - 但 year>350 仍可触发 DEFEAT，GALAXY 门控可能不通过（若 dimensional_strike FLAG 未设置且 galaxy_exodus_seen 也未设置）
预期行为：dimensional_strike FLAG 与 dimensionStrikeTriggered 字段应保持一致，或明确分工
实际行为：两个系统独立，功能互补但不一致
代码证据：
  - events.json:1373 写入 dimensional_strike FLAG
  - AlienCivilization.ts:333 设置 dimensionStrikeTriggered 字段（不设置 FLAG）
  - Game.ts:775 GALAXY 门控使用 dimensional_strike FLAG
  - Game.ts:1265 DEFEAT 条件使用 dimensionStrikeTriggered 字段（或 year>350）
设计证据：无
测试证据：Game.defeatConditions.test.ts:170 验证 dimensional_defense 阻止 DEFEAT_DIMENSION_STRIKE
影响范围：无阻断性影响；架构不一致增加维护成本
是否稳定可复现：是
尚缺证据：无
建议修复方向：
  1. 统一为单一系统（建议使用 FLAG，移除字段）
  2. 或在 events.json year=350 事件中同时设置 dimensionStrikeTriggered 字段
  3. 或在 AlienCivilization.ts:333 同时设置 dimensional_strike FLAG
建议回归测试：验证 dimensional_strike FLAG 与 dimensionStrikeTriggered 字段一致性
```

---

## 第三部分：未确认问题

> 以下问题证据未完全闭合，不进入正式问题清单，待进一步验证。

| 编号 | 来源 | 问题描述 | 尚缺证据 |
|---|---|---|---|
| UC-14 | C-8 / V-8 | year=340 二向箔警报 treachery+50 是否触达 100 导致 DEFEAT_TREACHERY 提前触发 | 依赖 UC-11（BROADCAST 末 treachery 典型值）；需 Autoplay500 运行观察 CRISIS+DETERRENCE+BROADCAST 末 treachery 累积值。风险评估：若 BROADCAST 末 treachery≥15（支持维德路线 +30+5=35 → 50+35=85 → +50=135→100），则 DEFEAT_TREACHERY 必然触发 |

---

## 第四部分：报告结论

### 1. 本纪元是否形成完整因果链

**BUNKER 内部因果链闭合，出口闭合，入口继承 AR-20 断裂**。

正常路径（假设 AR-20 修复后进入 BUNKER）入口+内部因果链完整闭合：
```
[BROADCAST 末] culture≥800 + bunker_world_completed(AR-20修复)
  → 推进 BUNKER
  → year=280 掩体世界落成 → bunker_world_completed
  → year=281 掩体纪元宣告 → bunker_era_declared（死FLAG）
  → year=290 黑域宣言 → black_domain_decision（⚠️ AR-28 不触发 DARK_DOMAIN 胜利）
  → year=295 光速飞船测试 → lightspeed_ship_tested
  → year=300 维德政变 → supported_wade 或 wade_opposed（⚠️ AR-27 维德死亡发言）
  → year=310 维德被处决 或 光速飞船量产
  → year=340 二向箔警报 → dimensional_alert_seen + treachery+50（⚠️ UC-14 可能触发 DEFEAT）
  → year=350 二向箔打击 → dimensional_strike
  → year=355 冥王星博物馆 → pluto_museum（死FLAG）
  → year=360 太阳系二维化 → solar_system_flattened（死FLAG）
  → year=365 银河出逃 → galaxy_exodus_seen
  → culture≥1200 + galaxy_exodus_seen → 推进 GALAXY ✅ 出口闭合
```

**入口断裂**（继承 AR-20）：BROADCAST→BUNKER 正常推进永久不可达。bunker_world_completed 仅由 year=280 事件（epoch=BUNKER）写入，BROADCAST 纪元无法触发。本审计基于静态代码分析，假设 AR-20 修复后验证 BUNKER 内部因果链。

**出口闭合**：BUNKER→GALAXY 正常推进出口可闭合。galaxy_exodus_seen（year=365）和 dimensional_strike（year=350）均可在 BUNKER 纪元内由 events.json 事件写入，满足 Game.ts:775 门控条件。

**结局退出路径**闭合：玩家可通过 9 种结局退出 BUNKER（WANDERING/DIGITAL/DARK_DOMAIN/CONQUEST 胜利 + NEUTRAL_COSMIC_SILENCE 中性 + DEFEAT_TREACHERY/EXTINCTION/DIMENSION_STRIKE/HELIUM_FLASH 失败）。其中 DARK_DOMAIN 仅 filteredEvent 路径可达（AR-28）。

### 2. 哪些路径已确认正常

- 纪元出口：culture≥1200 + galaxy_exodus_seen（或 dimensional_strike）→ Game.ts:775 门控 ✅
- 内部事件链：year=280→281→290→295→300→310→340→350→355→360→365 通过 reqFlag 顺序触发 ✅
- 人物死亡：进入 BUNKER 时维德/林云/丁仪等死亡（epochDeathMap 含 BUNKER）✅（但死亡人物发言问题见 AR-27）
- 事件去重：hasTriggered 持久化 ✅
- 存档持久化：epoch/year/culture/treachery/population/economy/military/prestige/swordholder/deterrenceEnduranceRounds/dimensionStrikeTriggered/broadcastTriggered/flags Set 均持久化 ✅
- WANDERING 胜利路径：CRISIS 纪元 wandering_completed + BUNKER 纪元行星发动机Ⅲ型 + 新家园选址 ✅
- DIGITAL 胜利路径：filteredEvent digital_ark_upgrade_event 写入 digital_ark_upgrade + 数字方舟科技 ✅
- DARK_DOMAIN 胜利路径：filteredEvent dark_domain_decision_event 写入 dark_domain_decision + 黑域生成科技 ✅（但 events.json year=290 路径不可达，AR-28）
- CONQUEST 胜利路径：条件性可达（需 BROADCAST 已 conquest_declared + isAllCiviConquered，UC-12 待运行时验证）✅
- NEUTRAL_COSMIC_SILENCE 路径：epoch≥BUNKER + (dark_domain_decision 或 black_domain_decision) + pop 1~10 + deterrence<20 ✅
- DEFEAT 结局路径：treachery≥100 / population≤0 / year>350+无防御科技 ✅
- FLAG 累积无阻断：BROADCAST FLAG 进入 BUNKER 后，除 conquest_declared 参与 CONQUEST 竞争外无 reqNotFlag 读取阻断推进（AR-5 在 BUNKER 无影响）✅
- FlagManager 引用漂移：restorePrototypes 已增加引用一致性检查（AR-7 已部分修复）✅
- value:0 语义：FlagManager.set 不接收 value 参数，value:0 不影响 FLAG 设置 ✅
- FLAG_ALIAS_MAP 应用范围：仅用于 isEventEligible 的 reqFlag/reqNotFlag 判定，不用于写入 ✅

### 3. 哪些问题已确认

| 问题 ID | 等级 | 问题 |
|---|---|---|
| AR-27 | P2 | 维德/林云/丁仪死亡人物发言 + unlock 死亡人物 |
| AR-28 | P2 | black_domain_decision 命名分歧，DARK_DOMAIN 胜利经 events.json 不可达 |
| AR-29 | P2 | 6 个死 FLAG 群 |
| AR-30 | P3 | 5 个 filteredEvent minYear 语义冗余 |
| AR-31 | P3 | swordholder / deterrenceEnduranceRounds 死累积（AR-26 同类） |
| AR-32 | P3 | dimensional_alert_seen 双写（可维护性） |
| AR-33 | P3 | dimensionStrikeTriggered vs dimensional_strike 双系统独立（架构观察） |

共 7 项正式问题：0 项 P1，3 项 P2，4 项 P3。

### 4. 哪些问题仍未确认

| 编号 | 问题 | 尚缺证据 |
|---|---|---|
| UC-14 | year=340 treachery+50 是否触达 100 导致 DEFEAT_TREACHERY 提前触发 | 依赖 UC-11（BROADCAST 末 treachery 典型值）；需 Autoplay500 运行观察 |

### 5. 是否允许进入下一纪元审计

**允许**，附带条件：

- **AR-20（bunker_world_completed 循环依赖）是 BUNKER 纪元入口的继承性断裂点**，导致 BUNKER 在正常路径下不可达。BUNKER 审计基于静态代码分析，无法通过运行时验证正常路径。修复 AR-20 后需重新验证 BUNKER 入口可达性。
- **BUNKER→GALAXY 出口闭合**，后续 GALAXY 纪元审计可基于正常路径验证（假设 AR-20 修复后能进入 BUNKER 并推进到 GALAXY）。
- **UC-14（treachery 风险）应在 GALAXY 纪元审计中持续观察**：若 BROADCAST 末 treachery 较高，BUNKER year=340 可能提前触发 DEFEAT_TREACHERY，导致无法推进 GALAXY。
- **AR-27（死亡人物发言）持续观察**：GALAXY 纪元中罗辑死亡（epochDeathMap 含 GALAXY），需复核罗辑是否在 GALAXY 事件中作为 speaker。
- **AR-28（DARK_DOMAIN 命名分歧）持续观察**：GALAXY 纪元 allowedEras 含 DARK_DOMAIN，需复核 GALAXY 中 dark_domain_decision / black_domain_decision 的读写链。
- **AR-31（deterrenceEnduranceRounds 死累积）持续观察**：GALAXY 纪元 epoch=5 >= DETERRENCE=2，若 swordholder≠null 仍持续累积。

### 6. 上游接口复核结论

**广播纪元报告末尾列出的 9 项 BROADCAST→BUNKER 接口复核项**：

| 复核项 | 上游状态 | 本纪元结论 |
|---|---|---|
| 1. 纪元出口条件 | ❌ 断裂（AR-20） | **已复核**：AR-20 未修复，BUNKER 正常路径不可达。本审计基于静态代码分析假设 AR-20 修复后验证。BUNKER 内部因果链闭合 |
| 2. 状态传递（FLAG 累积） | ⚠️ 待复核 | **已复核**：broadcast_dawn_seen/bunker_project_active/dual_strategy/escape_tech_focus 为死 FLAG（AR-22 确认）；coordinates_broadcasted 被 BUNKER 事件无读取（仅 BROADCAST 门控）；conquest_declared 进入 BUNKER 后参与 CONQUEST 胜利竞争（allowedEras 含 BUNKER）✅；swordholder_appointed 阻断 CONQUEST 胜利持续 |
| 3. 人物死亡 | ⚠️ 待复核 | **已复核**：维德进入 BUNKER 时死亡（epochDeathMap 含 BUNKER），但 year=300/310 事件中维德作为 speaker（AR-27）；林云/丁仪同样死亡发言（AR-27） |
| 4. bunker_world_completed | ❌ 不可达（AR-20） | **已复核**：AR-20 循环依赖确认。唯一写入点 events.json:1150（year=280, epoch=BUNKER），BROADCAST 纪元无法触发。修复后需验证写入路径 |
| 5. broadcast_era_declared | ⚠️ 死 FLAG（AR-22） | **已复核**：进入 BUNKER 后仍无消费者，确认为死 FLAG |
| 6. trisolaris_fleet_escaped | ⚠️ 死 FLAG（AR-22） | **已复核**：进入 BUNKER 后仍无消费者，确认为死 FLAG |
| 7. swordholder 字段 | ⚠️ 待复核 | **已复核**：罗辑路线 swordholder="罗辑"进入 BUNKER。deterrenceEnduranceRounds 持续累积但无消费者（AR-31 死累积）。维德在 BUNKER 死亡但非执剑人，不影响 swordholder 字段 |
| 8. broadcastTriggered | ⚠️ 待复核 | **已复核**：若进入 BUNKER 则 broadcastTriggered=false（否则游戏已结束），无残留风险。BUNKER 中 broadcastTriggered 短路检查不触发 |
| 9. conquest_declared | ⚠️ 待复核 | **已复核**：CONQUEST 胜利 allowedEras=[BROADCAST,BUNKER,GALAXY,STARDUST]，若 BROADCAST 已 conquest_declared 则 BUNKER 中可竞争。需 isAllCiviConquered 满足（UC-12 待运行时验证） |

### 7. 相邻纪元仍需复核的接口

**下游接口：BUNKER → GALAXY**

| 复核项 | 当前状态 | 待验证内容 |
|---|---|---|
| 纪元出口条件 | ✅ 闭合 | culture≥1200 + galaxy_exodus_seen（或 dimensional_strike）→ Game.ts:775 门控通过。galaxy_exodus_seen 由 year=365 BUNKER 事件写入；dimensional_strike 由 year=350 BUNKER 事件写入。修复 AR-20 后需运行时验证 |
| 状态传递（FLAG 累积） | ⚠️ 待复核 | galaxy_exodus_seen / dimensional_strike / dimensional_alert_seen / dark_domain_decision / digital_ark_upgrade / wade_* / pluto_museum / solar_system_flattened 等 FLAG 累积进入 GALAXY，需复核哪些 FLAG 影响 GALAXY 事件（注：pluto_museum/solar_system_flattened/wade_coup/wade_executed/wade_succeeded 已确认为死 FLAG AR-29） |
| 人物死亡 | ⚠️ 待复核 | 进入 GALAXY 后罗辑死亡（epochDeathMap["罗辑"]=["GALAXY"]），需复核死亡时机是否与 GALAXY 事件冲突；维德在 GALAXY 仍死亡（epochDeathMap 含 GALAXY）；程心/云天明/智子/艾AA/关一帆/刘慈欣存活 |
| galaxy_exodus_seen / dimensional_strike FLAG | ⚠️ 待复核 | GALAXY 门控 FLAG，进入 GALAXY 时至少一个已设置。需复核 GALAXY 事件是否读取这些 FLAG 作为 reqFlag/reqNotFlag |
| dimensionStrikeTriggered 字段 | ⚠️ 待复核 | 若 BUNKER year=350 事件触发则 dimensional_strike FLAG 设置但 dimensionStrikeTriggered 字段未设置（AR-33 双系统独立）。需复核 GALAXY 是否依赖 dimensionStrikeTriggered 字段 |
| swordholder 字段 | ⚠️ 待复核 | 罗辑路线 swordholder="罗辑"进入 GALAXY；罗辑在 GALAXY 死亡时若为 swordholder 则清除。需复核 GALAXY 是否依赖此字段（如 deterrenceEnduranceRounds 累积 AR-31 同类） |
| conquest_declared FLAG | ⚠️ 待复核 | 若玩家在 BROADCAST/BUNKER 触发 conquest_declared，进入 GALAXY 后 CONQUEST 胜利条件仍 allowedEras 含 GALAXY。需复核 GALAXY 中 CONQUEST 竞争关系 |
| culture 值 | ⚠️ 待复核 | 进入 GALAXY 需 culture≥1200。需复核 GALAXY 纪元 minCulture/maxCulture 及 culture 增长速率 |
| treachery 跨纪元 | ⚠️ 待复核 | BUNKER year=340 +50 高风险（UC-14）。若未触发 DEFEAT_TREACHERY 进入 GALAXY，需复核 GALAXY 中 treachery 是否继续增长或触发 DEFEAT |

---

**AUDIT_REPORT_掩体纪元 报告完成。未修改代码。**

**问题统计**：P1×0，P2×3，P3×4，未确认×1
**因果链状态**：内部闭合 + 出口闭合，入口继承 AR-20 断裂（基于静态代码分析验证）
**上游接口**：9 项全部复核（含 3 项新发现问题：AR-27 维德/林云/丁仪死亡发言 + AR-28 black_domain_decision 命名分歧 + AR-31 deterrenceEnduranceRounds 死累积）
**跨纪元问题持续追踪**：AR-5（FLAG 永久累积，BUNKER 写入 18 个 FLAG 6 个死）/ AR-7（Flag 引用漂移，restorePrototypes 已修复）/ UC-1（treachery 爆发，BUNKER year=340 +50 高风险 UC-14）/ UC-2（顺序风险，BUNKER 事件 year 顺序正确）
**下一纪元审计**：允许进入银河纪元（GALAXY），附带 9 项接口复核
