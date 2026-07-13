# `AUDIT_REPORT_广播纪元`

> 纪元：广播纪元（BROADCAST, epoch=3）
> 阶段：正式审计报告
> 证据截止：20260712
> 引用文档：EPOCH_AUDIT_MODEL_广播纪元、EPOCH_EVIDENCE_广播纪元、EPOCH_CAUSAL_VALIDATION_广播纪元、AUDIT_20260712_BASELINE、AUDIT_20260712_AUDIT_REPORT_威慑纪元
> 约束：未修改代码，未输出可直接执行的修复方案

---

## 第一部分：完成门禁检查

| 门禁项 | 状态 | 说明 |
|---|---|---|
| 1. 所有事件已进入清单 | ✅ 满足 | 剧情事件 5 条（epoch=BROADCAST）+ 1 条跨纪元边界事件（year=230 DETERRENCE 版）+ 4 个 filteredEvent + 2 个 randomevent 全部入清单，effects 已逐一展开 |
| 2. 所有关键人物已有状态轨迹 | ✅ 满足 | 2 人死亡（希恩斯/庄颜）+ 7 人存活（罗辑/维德/程心/艾AA/云天明/智子/关一帆）均有完整轨迹；刘慈欣存活但不可解锁（AR-18 持续） |
| 3. 所有读取状态都有合法生产者 | ⚠️ 部分满足 | coordinates_broadcasted / trisolaris_destroyed / broadcast_dawn_seen 有合法生产者；**bunker_world_completed 无合法生产者（AR-20 循环依赖）** |
| 4. 所有关键写入都有消费者或明确终止意义 | ⚠️ 部分满足 | 4 个活 FLAG 有消费者；**7 个死 FLAG 无消费者**（trisolaris_fleet_escaped / broadcast_era_declared / escape_tech_focus / bunker_project_active / dual_strategy / tianming_fairy_tales / staircase_data） |
| 5. 所有关键数值都有来源、范围和消费位置 | ✅ 满足 | culture / treachery / deterrenceValue / population / prestige / military / economy 7 个数值字段均有公式、阈值、消费位置 |
| 6. 所有 Tag/Flag 生命周期已追踪 | ✅ 满足 | 11 个 FLAG（4 活 + 7 死）+ 1 个 Tag（broadcast_era）全量读写链已追踪 |
| 7. 所有科技条件存在合法路径 | ✅ 满足 | BROADCAST 事件无直接科技依赖；结局科技条件（黑域生成/数字方舟/新家园选址）均有合法前置链 |
| 8. 所有纪元出口已验证 | ⚠️ 部分满足 | 结局出口（broadcastTriggered/CONQUEST/DEFEAT×3）已验证；**正常推进出口（→BUNKER）断裂（AR-20）** |
| 9. 所有可能结局已检查竞争关系 | ✅ 满足 | broadcastTriggered 短路优先 + CONQUEST 胜利（allowedEras+FLAG互斥）+ DEFEAT_TREACHERY（优先于 EXTINCTION）+ DEFEAT_DIMENSION_STRIKE（超时） |
| 10. 正常路径和反例路径均已检查 | ✅ 满足 | 20 项反例全部验证（6 项成立含 2 项 P1，14 项不成立） |
| 11. 存档边界已检查 | ✅ 满足 | broadcastTriggered/broadcastSurvives/epoch/year/culture/treachery/swordholder/deterrenceEnduranceRounds/flags Set 均持久化 |
| 12. 未确认项已明确列出 | ✅ 满足 | 4 项未确认项已列出（U-B1~U-B4） |
| 13. 相邻纪元接口已登记待复核 | ✅ 满足 | 上游 DETERRENCE→BROADCAST 7 项已复核；下游 BROADCAST→BUNKER 接口已登记（见报告末尾） |

**门禁结论**：13 项中 10 项满足、3 项部分满足。部分满足项因"bunker_world_completed 循环依赖"和"7 个死 FLAG 无消费者"导致。**允许进入正式问题清单阶段**。

---

## 第二部分：正式问题清单

> 仅证据闭合的问题进入本清单。证据未完全闭合的风险项列入"未确认问题"。

---

### AR-20

```text
问题 ID：AR-20
等级：P1
问题类型：主线卡死 / 循环依赖（与 AR-10 同类）
涉及纪元：广播纪元（BROADCAST）→ 掩体纪元（BUNKER）
现象：year=280 掩体世界落成事件 epoch="BUNKER" 但写入 bunker_world_completed（BUNKER 入口门控 FLAG），BROADCAST 纪元无法触发该事件，导致 bunker_world_completed 永不写入，玩家永久卡死在 BROADCAST 纪元
前置条件：正常进入 BROADCAST 纪元（罗辑路线）
完整因果链：
  1. 罗辑路线 year=230 DETERRENCE 版事件 → coordinates_broadcasted → 推进 BROADCAST
  2. BROADCAST 纪元 culture 持续增长
  3. culture≥800 → updateEpoch 匹配 BUNKER 纪元
  4. Game.ts:774 检查 BUNKER_WORLD_COMPLETED → 未设置 → allowed=false
  5. EPOCH_STALLED 设置，纪元不推进
  6. bunker_world_completed 唯一写入点：events.json:1150（year=280, epoch=BUNKER）
  7. BROADCAST 纪元 isEpochMatch("BUNKER", "BROADCAST") → false → 事件不触发
  8. bunker_world_completed 永不写入
  9. 玩家永久卡死在 BROADCAST 纪元
预期行为：BROADCAST 纪元应能通过某事件写入 bunker_world_completed，推进到 BUNKER
实际行为：year=280 事件 epoch=BUNKER，BROADCAST 纪元无法触发，形成循环依赖
代码证据：
  - events.json:1170 triggerCondition.epoch="BUNKER"（year=280 掩体世界落成事件）
  - events.json:1150 effects 写入 bunker_world_completed
  - Game.ts:774 updateEpoch 门控 BUNKER_WORLD_COMPLETED
  - FLAG_ALIAS_MAP: 'bunker_cities_ready' → 'bunker_world_completed'（GameEventManager.ts:791）但 bunker_cities_ready 全库无写入
设计证据：timeline.json gameYearRange=[261,300] 表明 BROADCAST 纪元 year 上限 300，掩体世界应在 BROADCAST 末期或 BUNKER 初期落成
测试证据：EdgeCases.test.ts:381-382 验证 BROADCAST→BUNKER 推进，但手动 set bunker_world_completed，未测试自然触发路径
影响范围：
  - BROADCAST→BUNKER 正常推进永久不可达
  - 后续 BUNKER/GALAXY/STARDUST 纪元在正常路径下永久不可达
  - 玩家只能通过结局退出 BROADCAST（broadcastTriggered / CONQUEST / DEFEAT）
  - BROADCAST 成为游戏推进链的终点纪元
是否稳定可复现：是（每次正常进入 BROADCAST 后必现）
尚缺证据：无
建议修复方向：将 events.json:1170 year=280 事件的 epoch 改为 "BROADCAST"（或 "BROADCAST,BUNKER"），使其在 BROADCAST 纪元可触发
建议回归测试：验证 BROADCAST 纪元 year=280 事件可触发；bunker_world_completed 可写入；可推进到 BUNKER
```

---

### AR-21

```text
问题 ID：AR-21
等级：P1
问题类型：主线不可达 / 二阶循环依赖
涉及纪元：广播纪元（BROADCAST）— 程心路线
现象：year=230 BROADCAST 版事件（程心路线）epoch=BROADCAST 且写入 coordinates_broadcasted（BROADCAST 入口门控 FLAG），即使修复 AR-10 将 epoch 改为 BROADCAST 仍是循环依赖：事件需要 BROADCAST 纪元触发，但进入 BROADCAST 需要该事件写入的 FLAG
前置条件：程心路线（year=219 选择"任命程心"）
完整因果链：
  1. 程心路线：year=219 → swordholder_chengxin → year=220 deterrence_broken → year=225 australia_migration
  2. year=230 BROADCAST 版事件（epoch=BROADCAST, reqFlag=australia_migration）应写入 coordinates_broadcasted
  3. 但事件 epoch=BROADCAST → 需在 BROADCAST 纪元触发
  4. 进入 BROADCAST 纪元需 coordinates_broadcasted（Game.ts:773 门控）
  5. 循环依赖：事件触发需要 BROADCAST 纪元 → BROADCAST 纪元需要 coordinates_broadcasted → coordinates_broadcasted 需要该事件触发
  6. 程心路线永久不可达 BROADCAST
预期行为：程心路线应能通过 year=230 事件写入 coordinates_broadcasted，推进到 BROADCAST
实际行为：year=230 BROADCAST 版事件存在二阶循环依赖，即使修复 AR-10（将 epoch 改为 BROADCAST）仍不可达
代码证据：
  - events.json:981 triggerCondition.epoch="BROADCAST"（程心路线 year=230 事件）
  - events.json:967 effects 写入 coordinates_broadcasted
  - Game.ts:773 updateEpoch 门控 COORDINATES_BROADCASTED
设计证据：timeline.json 描述程心路线为"威慑失败"路线，但应能进入 BROADCAST 继续叙事
测试证据：无测试覆盖"程心路线 coordinates_broadcasted 触发路径"
影响范围：
  - 程心路线永久不可达 BROADCAST 纪元
  - 叠加 AR-10（epoch 不匹配）和 AR-12（treachery 必败），程心路线完全不可玩
是否稳定可复现：是（每次选择程心路线必现）
尚缺证据：无
建议修复方向：将 events.json:981 程心路线 year=230 事件的 epoch 改为 "DETERRENCE"（与罗辑路线 year=230 DETERRENCE 版一致），使其在 DETERRENCE 纪元可触发
建议回归测试：验证程心路线 year=230 事件在 DETERRENCE 纪元可触发；coordinates_broadcasted 可写入；可推进到 BROADCAST
```

---

### AR-22

```text
问题 ID：AR-22
等级：P2
问题类型：Tag/Flag 异常 / 死 FLAG 群（与 AR-15 同类）
涉及纪元：广播纪元（BROADCAST）
现象：BROADCAST 纪元期间 7 个 FLAG 被写入但无任何消费者，是死 FLAG
前置条件：无
完整因果链：
  1. trisolaris_fleet_escaped：events.json:1065 写入（year=240），0 读取
  2. broadcast_era_declared：events.json:1124 写入（year=261），0 读取（与 AR-15 deterrence_era_declared 同类）
  3. escape_tech_focus：filteredEvent broadcast_era_dawn 选项B 写入，0 读取
  4. bunker_project_active：filteredEvent bunker_project_debate 选项A 写入，0 读取
  5. dual_strategy：filteredEvent bunker_project_debate 选项B 写入，0 读取
  6. tianming_fairy_tales：randomevent tianming_fairy_tale_decode 写入，0 读取
  7. staircase_data：randomevent chengxin_staircase_probe 写入，0 读取
预期行为：写入的 FLAG 应有至少一个消费者
实际行为：7 个 FLAG 无消费者，是死 FLAG
代码证据：
  - 全量 Grep 验证每个 FLAG 仅写入点匹配，无读取点
设计证据：无
测试证据：无
影响范围：无直接影响；增加维护成本，可能暗示遗漏的功能点
是否稳定可复现：是
尚缺证据：无
建议修复方向：移除死 FLAG 写入，或补充消费者
建议回归测试：验证死 FLAG 被移除或有完整读写链
```

---

### AR-23

```text
问题 ID：AR-23
等级：P2
问题类型：叙事不一致 / 死亡人物发言
涉及纪元：广播纪元（BROADCAST）
现象：inner_conflict_resolution filteredEvent（epoch=BROADCAST）中庄颜作为 speaker，但 epochDeathMap 标注庄颜在 BROADCAST 死亡，进入 BROADCAST 时已被判定 isAlive=false
前置条件：进入 BROADCAST 纪元
完整因果链：
  1. Game.ts:704 进入 BROADCAST 时庄颜被判定死亡（epochDeathMap 含 BROADCAST）
  2. 庄颜 isAlive=false
  3. inner_conflict_resolution（GameEventManager.ts:598）dialogQueue 含庄颜作为 speaker
  4. filteredEvent 触发时不检查 speaker 是否存活
  5. 死亡的庄颜在事件中发言
预期行为：死亡人物不应在事件中作为 speaker 出现
实际行为：庄颜在 BROADCAST 纪元已死亡但仍作为 speaker
代码证据：
  - GameEventManager.ts:956 epochDeathMap 庄颜含 BROADCAST
  - GameEventManager.ts:598 dialogQueue 含庄颜
  - Game.ts:704 死亡判定逻辑
设计证据：庄颜在原著中于广播纪元隐退，"不再活跃"
测试证据：无
影响范围：叙事不一致（死亡人物发言）
是否稳定可复现：是
尚缺证据：无
建议修复方向：将庄颜替换为其他存活人物，或将 epochDeathMap 庄颜的死亡纪元改为 BUNKER
建议回归测试：验证 BROADCAST 纪元事件中无死亡人物作为 speaker
```

---

### AR-24

```text
问题 ID：AR-24
等级：P2
问题类型：叙事不一致 / 死亡人物发言
涉及纪元：广播纪元（BROADCAST）
现象：conquest_declaration_event filteredEvent（epoch=BROADCAST）中章北海作为 speaker，但 epochDeathMap 标注章北海在 DETERRENCE 死亡，进入 BROADCAST 时早已被判定 isAlive=false
前置条件：进入 BROADCAST 纪元
完整因果链：
  1. Game.ts:704 进入 DETERRENCE 时章北海被判定死亡（epochDeathMap 含 DETERRENCE）
  2. 章北海 isAlive=false
  3. 进入 BROADCAST 后章北海仍为死亡状态
  4. conquest_declaration_event（GameEventManager.ts:657）dialogQueue 含章北海作为 speaker
  5. filteredEvent 触发时不检查 speaker 是否存活
  6. 已死亡的章北海在 BROADCAST 事件中发言
预期行为：死亡人物不应在事件中作为 speaker 出现
实际行为：章北海在 DETERRENCE 死亡但在 BROADCAST filteredEvent 中发言
代码证据：
  - GameEventManager.ts:952 epochDeathMap 章北海含 ["DETERRENCE", "BROADCAST", "BUNKER", "GALAXY"]
  - GameEventManager.ts:657 dialogQueue 含章北海
  - Game.ts:704 死亡判定逻辑
设计证据：章北海在原著中于危机纪元末黑暗战役死亡
测试证据：无
影响范围：叙事不一致（死亡人物发言）
是否稳定可复现：是
尚缺证据：无
建议修复方向：将章北海替换为其他存活人物（如维德，已在事件中），或调整 epochDeathMap
建议回归测试：验证 BROADCAST 纪元事件中无跨纪元死亡人物作为 speaker
```

---

### AR-25

```text
问题 ID：AR-25
等级：P3
问题类型：可维护性 / minYear 语义冗余（与 AR-19 同类）
涉及纪元：广播纪元（BROADCAST）
现象：4 个 BROADCAST filteredEvent 的 minYear（120/150/160/200）远低于 BROADCAST 起始 year（≥230），约束冗余
前置条件：进入 BROADCAST 纪元
完整因果链：
  1. BROADCAST 纪元 year≥230（year=230 DETERRENCE 版事件触发后 culture 达 500 推进）
  2. GameEventManager.ts:776 `if (cond.minYear !== undefined && game.year < cond.minYear) return false`
  3. minYear=120/150/160/200 在 year≥230 时已满足（230>200>160>150>120）
  4. minYear 约束冗余，实际约束由 reqFlag/reqTech/minCulture 提供
预期行为：minYear 应反映设计意图（纪元内偏移或合理绝对年份）
实际行为：minYear 语义为绝对年份，但值远低于纪元起始 year
代码证据：
  - GameEventManager.ts:515 broadcast_era_dawn minYear:120
  - GameEventManager.ts:529 bunker_project_debate minYear:150
  - GameEventManager.ts:600 inner_conflict_resolution minYear:160
  - GameEventManager.ts:659 conquest_declaration_event minYear:200
  - GameEventManager.ts:776 `game.year < cond.minYear` 使用绝对年份
设计证据：minYear 可能原设计为"纪元内偏移"
测试证据：无
影响范围：无功能影响；语义不一致增加维护成本
是否稳定可复现：是
尚缺证据：无
建议修复方向：调整 minYear 为合理值（如 270/290/300/320 表示 BROADCAST 内偏移），或在注释中说明语义
建议回归测试：验证 filteredEvent 触发时点符合设计意图
```

---

### AR-26

```text
问题 ID：AR-26
等级：P3
问题类型：可维护性 / 数值冗余
涉及纪元：广播纪元（BROADCAST）
现象：BROADCAST 中 swordholder="罗辑"导致 deterrenceEnduranceRounds 持续累积（Game.ts:651），但 DETERRENCE 胜利仅限 DETERRENCE 纪元（allowedEras=[DETERRENCE]），BROADCAST 中为死累积
前置条件：罗辑路线进入 BROADCAST（swordholder="罗辑"）
完整因果链：
  1. Game.ts:651 `if (this.epoch >= EpochType.DETERRENCE && this.earthCivi.swordholder !== null)`
  2. BROADCAST 纪元 epoch=3 >= DETERRENCE(2) && swordholder="罗辑" !== null → 条件满足
  3. deterrenceEnduranceRounds 持续累积
  4. DETERRENCE 胜利条件（Game.ts:1013）allowedEras=[DETERRENCE]
  5. BROADCAST 纪元 epoch=3 ≠ DETERRENCE(2) → allowedEras 检查失败
  6. deterrenceEnduranceRounds 累积值无消费者
预期行为：deterrenceEnduranceRounds 累积应仅在 DETERRENCE 纪元内有效
实际行为：BROADCAST 中持续累积但无消费者
代码证据：
  - Game.ts:651 累积条件 epoch>=DETERRENCE
  - Game.ts:1013 DETERRENCE 胜利 allowedEras=[DETERRENCE]
  - Game.ts:1019 deterrenceEnduranceRounds>=20 消费点（仅在 DETERRENCE 胜利条件内）
设计证据：无
测试证据：无
影响范围：无功能影响；数值冗余
是否稳定可复现：是
尚缺证据：无
建议修复方向：将 Game.ts:651 累积条件改为 `this.epoch === EpochType.DETERRENCE`，或在 DETERRENCE 纪元出口时冻结 deterrenceEnduranceRounds
建议回归测试：验证 DETERRENCE 纪元出口后 deterrenceEnduranceRounds 不再累积
```

---

## 第三部分：未确认问题

> 以下问题证据未完全闭合，不进入正式问题清单，待进一步验证。

| 编号 | 来源 | 问题描述 | 尚缺证据 |
|---|---|---|---|
| UC-10 | U-B1 | BROADCAST 典型进入 year 值，用于评估 culture 500→800 所需回合数 | 数值公式核验（culture 增长速率 ~2-10/回合，约 30-150 回合） |
| UC-11 | U-B2 | CRISIS+DETERRENCE 典型 treachery 累积值，评估 BROADCAST +10 是否触达 100 | Autoplay500 运行观察 CRISIS+DETERRENCE 末 treachery 典型值 |
| UC-12 | U-B3 | CONQUEST 胜利在 BROADCAST 的实际可达性，isAllCiviConquered 条件是否可在 BROADCAST 满足 | 运行时验证异星文明征服进度 |
| UC-13 | U-B4 | broadcastTriggered 按钮在 BROADCAST 的可用性，WallfacerPanel 是否在 BROADCAST 纪元渲染 | UI 层验证 WallfacerPanel 渲染条件 |

---

## 第四部分：报告结论

### 1. 本纪元是否形成完整因果链

**罗辑路线形成完整因果链，但正常推进出口断裂**。

正常路径（罗辑路线）入口+内部因果链完整闭合：
```
year=230 引力波广播（DETERRENCE 版）→ coordinates_broadcasted
→ culture≥500 + coordinates_broadcasted → 推进 BROADCAST
→ year=235 三体星系毁灭 → trisolaris_destroyed
→ year=240 三体第二舰队逃离 → trisolaris_fleet_escaped
→ year=260 云天明童话 → unlock 云天明/智子/关一帆
→ year=261 广播纪元宣告 → broadcast_era_declared
```

**断裂点**（AR-20）：BROADCAST→BUNKER 正常推进永久不可达。bunker_world_completed 仅由 year=280 事件（epoch=BUNKER）写入，BROADCAST 纪元无法触发。BROADCAST 成为游戏推进链的终点纪元，后续 BUNKER/GALAXY/STARDUST 纪元在正常路径下永久不可达。

**结局退出路径**闭合：玩家可通过 broadcastTriggered（HIDDEN/EXTINCTION）、CONQUEST 胜利、DEFEAT_TREACHERY、DEFEAT_EXTINCTION、DEFEAT_DIMENSION_STRIKE/HELIUM_FLASH 退出 BROADCAST。

### 2. 哪些路径已确认正常

- 纪元入口：culture≥500 + coordinates_broadcasted（罗辑路线 year=230 DETERRENCE 版写入）→ Game.ts:773 门控 ✅
- 内部事件链：year=235→240→260→261 通过 reqFlag 顺序触发 ✅
- 人物死亡：进入 BROADCAST 时希恩斯/庄颜死亡 ✅
- 事件去重：hasTriggered 持久化 ✅
- 存档持久化：broadcastTriggered/broadcastSurvives/epoch/year/culture/treachery/swordholder/flags Set 均持久化 ✅
- broadcastTriggered 结局路径：WallfacerPanel UI → HIDDEN 胜利或 EXTINCTION 失败 ✅
- CONQUEST 胜利路径：条件性可达（需 !SWORDHOLDER_APPOINTED）✅
- DEFEAT 结局路径：treachery≥100 / population≤0 / year>350+无关键科技 ✅
- FLAG 累积无阻断：CRISIS+DETERRENCE FLAG 进入 BROADCAST 后，除 swordholder_appointed 阻断 CONQUEST 外无 reqNotFlag 读取阻断推进（AR-5 在 BROADCAST 无影响）✅
- FlagManager 引用漂移：restorePrototypes 已增加引用一致性检查（AR-7 已部分修复）✅

### 3. 哪些问题已确认

| 问题 ID | 等级 | 问题 |
|---|---|---|
| AR-20 | P1 | bunker_world_completed 循环依赖，BROADCAST→BUNKER 永久不可达 |
| AR-21 | P1 | year=230 BROADCAST 版二阶循环依赖，程心路线即使修复 AR-10 仍不可达 |
| AR-22 | P2 | 7 个死 FLAG 群 |
| AR-23 | P2 | 庄颜死后仍作为 speaker（inner_conflict_resolution） |
| AR-24 | P2 | 章北海死后仍作为 speaker（conquest_declaration_event） |
| AR-25 | P3 | 4 个 filteredEvent minYear 语义冗余 |
| AR-26 | P3 | swordholder / deterrenceEnduranceRounds 死累积 |

共 7 项正式问题：2 项 P1，3 项 P2，2 项 P3。

### 4. 哪些问题仍未确认

| 编号 | 问题 | 尚缺证据 |
|---|---|---|
| UC-10 | BROADCAST 典型进入 year 值 | 数值公式核验 |
| UC-11 | CRISIS+DETERRENCE 典型 treachery 累积值 | Autoplay500 运行观察 |
| UC-12 | CONQUEST 胜利在 BROADCAST 的实际可达性 | 运行时验证 |
| UC-13 | broadcastTriggered 按钮在 BROADCAST 的可用性 | UI 层验证 |

### 5. 是否允许进入下一纪元审计

**允许**，但附带条件：

- **AR-20（bunker_world_completed 循环依赖）是 BROADCAST 纪元最严重的断裂点**，与 AR-10（DETERRENCE→BROADCAST 循环依赖）属同类问题。AR-20 导致 BROADCAST→BUNKER 正常推进永久不可达，后续 BUNKER/GALAXY/STARDUST 纪元在正常路径下永久不可达。
- **AR-21（程心路线二阶循环依赖）** 进一步确认程心路线完全不可玩（AR-10 + AR-12 + AR-21 三重阻断）。
- **后续纪元审计需注意**：由于 AR-20 导致 BUNKER 纪元在正常路径下不可达，BUNKER 纪元审计只能基于代码静态分析，无法通过运行时验证正常路径。
- UC-10/UC-11/UC-12/UC-13 应在下一纪元审计中持续观察。

### 6. 上游接口复核结论

| 复核项 | 上游状态 | 本纪元结论 |
|---|---|---|
| 1. 纪元出口条件 | ✅ 已验证 | 确认正常：culture≥500 + coordinates_broadcasted（罗辑路线 year=230 DETERRENCE 版写入） |
| 2. 状态传递（FLAG 累积） | ⚠️ 待复核 | **已复核**：coordinates_broadcasted 被 year=235/261 读取 ✅；deterrence_held_strong / swordholder_chengxin / swordholder_luoji_retained 为死 FLAG；swordholder_appointed 阻断 CONQUEST 胜利 |
| 3. 人物死亡 | ⚠️ 待复核 | **已复核**：希恩斯/庄颜在 BROADCAST 死亡。庄颜死后仍作为 speaker（AR-23）；章北海在 DETERRENCE 死亡但仍作为 BROADCAST 事件 speaker（AR-24） |
| 4. year=230 事件 | ⚠️ 待复核 | **已复核**：两版 year=230 事件分属 DETERRENCE（罗辑路线）/ BROADCAST（程心路线）。程心路线版存在二阶循环依赖（AR-21），即使修复 AR-10 仍不可达 |
| 5. coordinates_broadcasted | ✅ 已验证 | 罗辑路线写入点 events.json:998（DETERRENCE 版），BROADCAST 门控 Game.ts:773 |
| 6. treachery 跨纪元 | ⚠️ 待复核 | **已复核**：罗辑路线 BROADCAST treachery 净 +10，风险中等。若 CRISIS+DETERRENCE 累积≥90 → year=235 +15 触达 100 → DEFEAT_TREACHERY |
| 7. swordholder 字段 | ⚠️ 待复核 | **已复核**：罗辑路线进入 BROADCAST 时 swordholder="罗辑"。deterrenceEnduranceRounds 持续累积但无消费者（AR-26 死累积） |

### 7. 相邻纪元仍需复核的接口

**下游接口：BROADCAST → BUNKER**

| 复核项 | 当前状态 | 待验证内容 |
|---|---|---|
| 纪元出口条件 | ❌ 断裂 | AR-20: bunker_world_completed 循环依赖，BROADCAST→BUNKER 正常推进永久不可达。需修复 AR-20 后重新验证 |
| 状态传递 | ⚠️ 待复核 | broadcast_dawn_seen / bunker_project_active / dual_strategy / escape_tech_focus / conquest_declared 等 FLAG 累积进入 BUNKER，需复核哪些 FLAG 影响 BUNKER 事件（注：bunker_project_active / dual_strategy / escape_tech_focus 已确认为死 FLAG） |
| 人物死亡 | ⚠️ 待复核 | 进入 BUNKER 后维德死亡（epochDeathMap 含 BUNKER），需复核死亡时机是否与 BUNKER 事件冲突 |
| bunker_world_completed | ❌ 不可达 | AR-20: 唯一写入点 year=280 事件 epoch=BUNKER，BROADCAST 纪元无法触发。修复后需验证写入路径 |
| broadcast_era_declared | ⚠️ 待复核 | 死 FLAG（AR-22），进入 BUNKER 后无消费者 |
| trisolaris_fleet_escaped | ⚠️ 待复核 | 死 FLAG（AR-22），进入 BUNKER 后无消费者 |
| swordholder 字段 | ⚠️ 待复核 | 罗辑路线 swordholder="罗辑"进入 BUNKER；维德在 BUNKER 死亡时若为 swordholder 则清除（但维德非执剑人）。需复核 BUNKER 是否依赖此字段 |
| broadcastTriggered | ⚠️ 待复核 | 若玩家在 BROADCAST 触发 broadcastTriggered，游戏直接结束，不进入 BUNKER。需确认 broadcastTriggered 不在 BUNKER 中残留 |
| conquest_declared | ⚠️ 待复核 | 若玩家在 BROADCAST 触发 conquest_declared，进入 BUNKER 后 CONQUEST 胜利条件仍 allowedEras 含 BUNKER。需复核 BUNKER 中 CONQUEST 竞争关系 |

---

**AUDIT_REPORT_广播纪元 报告完成。未修改代码。**

**问题统计**：P1×2，P2×3，P3×2，未确认×4
**因果链状态**：罗辑路线入口+内部闭合，正常推进出口断裂（AR-20: bunker_world_completed 循环依赖）；结局退出路径闭合
**上游接口**：7 项全部复核（含 2 项新发现问题：AR-23 庄颜死后发言 + AR-24 章北海死后发言）
**下一纪元审计**：允许进入，附带 9 项接口复核（含 AR-20 断裂项）
