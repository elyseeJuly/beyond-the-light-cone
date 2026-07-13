# `AUDIT_REPORT_星屑纪元`

> 纪元：星屑纪元（STARDUST, epoch=6）
> 阶段：正式审计报告
> 证据截止：20260712
> 引用文档：EPOCH_AUDIT_MODEL_星屑纪元、EPOCH_EVIDENCE_星屑纪元、EPOCH_CAUSAL_VALIDATION_星屑纪元、AUDIT_20260712_BASELINE、AUDIT_20260712_AUDIT_REPORT_银河纪元
> 约束：未修改代码，未输出可直接执行的修复方案

---

## 第一部分：完成门禁检查

| 门禁项 | 状态 | 说明 |
|---|---|---|
| 1. 所有事件已进入清单 | ✅ 满足 | STARDUST 纪元为终局纪元，0 条剧情事件（events.json epoch=STARDUST）+ 0 条 filteredEvent + 0 条随机事件（randomevents.json epoch 含 STARDUST）。清单为空但证据闭合 |
| 2. 所有关键人物已有状态轨迹 | ✅ 满足 | 5 人存活（程心/云天明/智子/艾AA/关一帆，继承 GALAXY）+ 33 人继承死亡（罗辑/刘慈欣在 GALAXY 死亡，其他在更早纪元死亡）。epochDeathMap 无任何人物含 "STARDUST"，无新增死亡。swordholder=null（罗辑路线，GALAXY 已清除） |
| 3. 所有读取状态都有合法生产者 | ✅ 满足 | 入口门控读取的 stardust_era_declared（GALAXY year=420 写入）、zero_homer_contacted（GALAXY year=400 写入）均有合法生产者；stardust_era_seen 无写入点（AR-43）但 OR 关系不影响入口；继承 FLAG（galaxy_exodus_seen/alien_alliance/mini_universe_built 等）均有 GALAXY 写入点 |
| 4. 所有关键写入都有消费者或明确终止意义 | ⚠️ 部分满足 | stardust_era_declared 有消费者（入口门控）；**stardust_era_active 无消费者**（AR-42，仅入口 CG 回调写入，0 读取点，死 FLAG）；stardust_era_seen 无写入点（AR-43，死 FLAG 但不影响入口） |
| 5. 所有关键数值都有来源、范围和消费位置 | ✅ 满足 | culture（入口 +300 + 每回合自然增长 `2+social×0.10`，HIDDEN 需≥1000 必然满足）/ treachery（继承 GALAXY，DEFEAT_TREACHERY 阈值≥100）/ population（继承 GALAXY，HIDDEN 需>0 / ETERNAL_EXILE 需≤5）/ deterrenceValue（继承 GALAXY，HIDDEN 需≥50 / COSMIC_SILENCE 需<20）均有公式、阈值、消费位置 |
| 6. 所有 Tag/Flag 生命周期已追踪 | ✅ 满足 | 3 个 STARDUST FLAG（stardust_era_declared 活 / stardust_era_seen 死 / stardust_era_active 死）+ 继承 FLAG（galaxy_exodus_seen/zero_homer_contacted/mini_universe_built/alien_alliance/wandering_completed/digital_ark_upgrade/dark_domain_decision/conquest_declared 均活）+ 1 个 Tag（stardust_era_deep, milestone=true 不衰减）全量读写链已追踪；FLAG_ALIAS_MAP（black_domain_decision→dark_domain_decision）仅读取侧应用已确认 |
| 7. 所有科技条件存在合法路径 | ✅ 满足 | STARDUST 无独有科技节点。结局科技条件均继承自更早纪元：黑域生成（INTERSTELLAR：宇宙社会学→安全声明理论→黑域生成）/ 数字方舟（INFORMATION：数字文明→数字生命研究→意识上传→数字方舟）/ 新家园选址（INTERSTELLAR：流浪地球计划→新家园选址）/ 行星发动机Ⅲ型（AEROSPACE：核聚变推进→重元素聚变→行星发动机Ⅰ型→Ⅱ型→Ⅲ型）前置链均存在；HIDDEN 所需 2 科技（黑域生成+数字方舟）也是 DEFEAT 逃生路径 |
| 8. 所有纪元出口已验证 | ✅ 满足 | STARDUST 是最后一个纪元（epoch=6），无下游纪元推进出口。11 种结局退出路径均已验证（5 胜利 + 2 中性 + 4 失败） |
| 9. 所有可能结局已检查竞争关系 | ✅ 满足 | 胜利结局数组顺序（HIDDEN→WANDERING→DIGITAL→DETERRENCE→CONQUEST→DARK_DOMAIN，DETERRENCE 被 allowedEras=[DETERRENCE] 过滤）+ 2 中性（ETERNAL_EXILE/COSMIC_SILENCE）+ 4 失败（TREACHERY→EXTINCTION→DIMENSION_STRIKE/HELIUM_FLASH）；ZERO_HOMER_CONTACTED 互斥锁确认（一旦设置，除 HIDDEN 外其他 4 条胜利路径全部被锁死） |
| 10. 正常路径和反例路径均已检查 | ✅ 满足 | 8 项反例全部验证（5 项不成立 + 1 项成立 + 2 项降级）+ 正向因果链验证 |
| 11. 存档边界已检查 | ✅ 满足 | epoch/year/culture/treachery/population/economy/military/prestige/deterrenceValue/swordholder/deterrenceEnduranceRounds/dimensionStrikeTriggered/broadcastTriggered/flags Set/triggeredFilteredIds/randomEventTriggerCounts 均持久化；SAVE_VERSION=4 迁移逻辑确认；dimensionStrikeTriggered 迁移补丁（SaveManager.ts:115）确认 |
| 12. 未确认项已明确列出 | ✅ 满足 | 2 项未确认项已列出（UC-17 culture 增长不足 / UC-18 treachery 跨纪元累积） |
| 13. 相邻纪元接口已登记待复核 | ✅ 满足 | 上游 GALAXY→STARDUST 10 项接口已全部复核（见报告末尾）；**STARDUST 是终局纪元，无下游接口需登记** |

**门禁结论**：13 项中 12 项满足、1 项部分满足。部分满足项因"stardust_era_active 死 FLAG 无消费者（AR-42）"导致。STARDUST 作为终局纪元，无事件、无新增死亡、无下游纪元，因果链结构简单。**允许进入正式问题清单阶段**。

---

## 第二部分：正式问题清单

> 仅证据闭合的问题进入本清单。证据未完全闭合的风险项列入"未确认问题"。

---

### AR-42

```text
问题 ID：AR-42
等级：P3
问题类型：Tag/Flag 异常 / 死 FLAG（与 AR-15/AR-22/AR-29/AR-35 同类）
涉及纪元：星屑纪元（STARDUST）
现象：STARDUST_ERA_ACTIVE FLAG 仅在入口 CG 回调中写入（Game.ts:907），全代码库无任何读取点，是死 FLAG
前置条件：进入 STARDUST 纪元
完整因果链：
  1. Game.ts:906-910 STARDUST 入口 CG 回调：
     ```ts
     if (this.epoch === EpochType.STARDUST) {
       this.addFlag(FLAG.STARDUST_ERA_ACTIVE);
       this.earthCivi.culture += 300;
       this.addHistory("【星屑遗泽】...");
     }
     ```
  2. GameFlags.ts:18：`STARDUST_ERA_ACTIVE: 'stardust_era_active'`（定义）
  3. 全量 Grep `stardust_era_active|STARDUST_ERA_ACTIVE`：
     - GameFlags.ts:18（定义）
     - Game.ts:907（写入）
  4. 0 读取点
预期行为：写入的 FLAG 应有至少一个消费者，或用于纪元内状态判定（如事件 reqFlag/reqNotFlag）
实际行为：STARDUST_ERA_ACTIVE 无消费者，是死 FLAG
代码证据：
  - GameFlags.ts:18 STARDUST_ERA_ACTIVE = 'stardust_era_active'
  - Game.ts:907 this.addFlag(FLAG.STARDUST_ERA_ACTIVE)
  - 全量 Grep 确认 0 读取点
设计证据：无
测试证据：无
影响范围：
  - 无功能影响
  - 增加维护成本（死 FLAG 累积）
  - 可能暗示遗漏的功能点（如 STARDUST 纪元内事件本应读取此 FLAG 但未实现）
是否稳定可复现：是
尚缺证据：无
建议修复方向：
  1. 移除死 FLAG 写入（Game.ts:907）
  2. 或补充消费者（如 STARDUST 纪元内事件 reqFlag:stardust_era_active，但 STARDUST 无事件）
  3. 或将其用于 UI 层显示 STARDUST 纪元激活状态
建议回归测试：验证死 FLAG 被移除或有完整读写链
```

---

### AR-43

```text
问题 ID：AR-43
等级：P3
问题类型：Tag/Flag 异常 / 死 FLAG（无写入点）
涉及纪元：星屑纪元（STARDUST）
现象：STARDUST_ERA_SEEN FLAG 仅在入口门控中被读取（Game.ts:792），但全代码库无任何写入点，是死 FLAG
前置条件：无
完整因果链：
  1. GameFlags.ts:17：`STARDUST_ERA_SEEN: 'stardust_era_seen'`（定义）
  2. Game.ts:792：`!this.flagManager.isSet(FLAG.STARDUST_ERA_SEEN)`（读取，门控 OR 条件之一）
  3. 全量 Grep `stardust_era_seen|STARDUST_ERA_SEEN`：
     - GameFlags.ts:17（定义）
     - Game.ts:792（读取）
  4. 0 写入点
  5. 入口门控为 OR 关系：stardust_era_declared || stardust_era_seen || zero_homer_contacted
  6. stardust_era_declared（GALAXY year=420 写入）和 zero_homer_contacted（GALAXY year=400 写入）均可用
  7. stardust_era_seen 永远为 false → !isSet(STARDUST_ERA_SEEN) 永远为 true → 不影响门控通过
预期行为：门控读取的 FLAG 应有至少一个写入点
实际行为：STARDUST_ERA_SEEN 无写入点，是死 FLAG，但因 OR 关系不影响入口门控
代码证据：
  - GameFlags.ts:17 STARDUST_ERA_SEEN = 'stardust_era_seen'
  - Game.ts:792 !this.flagManager.isSet(FLAG.STARDUST_ERA_SEEN)
  - 全量 Grep 确认 0 写入点
  - events.json 中无 stardust_era_seen 的 effects 写入
  - 入口 CG 回调（Game.ts:906-910）写入 STARDUST_ERA_ACTIVE，不写 STARDUST_ERA_SEEN
设计证据：无
测试证据：无
影响范围：
  - 无功能影响（OR 关系，其他两个 FLAG 可用）
  - 增加维护成本
  - 可能暗示遗漏的功能点（如 STARDUST 纪元进入时的 "seen" 标记本应写入但未实现）
是否稳定可复现：是
尚缺证据：无
建议修复方向：
  1. 移除死 FLAG 读取（从 Game.ts:792 门控条件中移除 STARDUST_ERA_SEEN）
  2. 或补充写入点（如在入口 CG 回调中 addFlag(STARDUST_ERA_SEEN)）
建议回归测试：验证 STARDUST 入口门控逻辑在移除 STARDUST_ERA_SEEN 后仍正常工作
```

---

### AR-44

```text
问题 ID：AR-44
等级：P3
问题类型：UI 缺失 / timeline.json 无"星屑"条目
涉及纪元：星屑纪元（STARDUST）
现象：timeline.json 无任何包含"星屑"的条目，导致 Game.ts:831 查找失败，STARDUST 纪元无 timeline 描述显示
前置条件：进入 STARDUST 纪元
完整因果链：
  1. timeline.json 全量读取：仅 6 个条目
     - 条目 1-5：黄金岁月/危机纪元/威慑纪元/广播纪元/掩体纪元
     - 条目 6："银河纪元 / 黑域纪元"（gameYearRange [351, 999]）
  2. 无任何条目的 epoch 字段包含"星屑"
  3. Game.ts:826-847 入口处理中查找 timeline 条目：
     ```ts
     const epochName = epochNames[matched.epoch];
     const timelineEntry = timelineData.find(t => t.epoch.includes(epochName));
     if (timelineEntry) {
       this.tickerMessages.push(`【时间线】${timelineEntry.title}...`);
     }
     ```
  4. epochName="星屑纪元"，查找 `t.epoch.includes("星屑")` → 失败
  5. timelineEntry 为 undefined → 不推送 tickerMessage
  6. STARDUST 纪元无 timeline 描述显示
预期行为：每个纪元应有对应的 timeline 条目，在入口时显示时间线描述
实际行为：STARDUST 纪元无 timeline 描述，UI 缺失
代码证据：
  - timeline.json：无"星屑"条目（最后一个条目为"银河纪元 / 黑域纪元"合并条目）
  - Game.ts:831 t.epoch.includes(epochName) 查找失败
设计证据：timeline.json 的"银河纪元 / 黑域纪元"合并条目 gameYearRange [351, 999] 覆盖了 STARDUST 年份范围（≥420），但 epoch 字段不含"星屑"字样
测试证据：无测试覆盖 STARDUST 纪元 timeline 显示
影响范围：
  - UI 缺失：STARDUST 纪元入口无时间线描述
  - 不影响游戏逻辑
是否稳定可复现：是
尚缺证据：无
建议修复方向：
  1. 在 timeline.json 中新增"星屑纪元"条目（epoch 字段含"星屑"，gameYearRange [420, 999]）
  2. 或调整"银河纪元 / 黑域纪元"合并条目的 epoch 字段为"银河纪元 / 黑域纪元 / 星屑纪元"
建议回归测试：验证 STARDUST 纪元入口时 timeline 描述正常显示
```

---

### AR-45

```text
问题 ID：AR-45
等级：P3
问题类型：结局竞争 / DEFEAT 兜底持续生效（与 AR-37 同类条件性风险）
涉及纪元：星屑纪元（STARDUST）
现象：STARDUST year≥420>350，DEFEAT 兜底条件 `(year>350 || dimensionStrikeTriggered)` 必然满足，若无逃生科技/FLAG 会触发 DEFEAT_DIMENSION_STRIKE
前置条件：进入 STARDUST 纪元，且无逃生科技/FLAG（黑域生成/数字方舟/dimensional_defense/dimensional_defense_completed/wandering_completed）
完整因果链：
  1. 进入 STARDUST 纪元，year≥420（继承 GALAXY year=420 推进）
  2. checkVictoryConditions（Game.ts:1281）：`(this.year > 350 || this.dimensionStrikeTriggered)`
  3. year≥420 > 350 → 条件必然满足
  4. 检查逃生路径（Game.ts:1282-1286）：
     - !isTecFinishedAnywhere("黑域生成") → 若未完成 → 继续
     - !isTecFinishedAnywhere("数字方舟") → 若未完成 → 继续
     - !hasFlag(DIMENSIONAL_DEFENSE) → 若未设置 → 继续
     - !hasFlag(DIMENSIONAL_DEFENSE_COMPLETED) → 若未设置 → 继续
     - !hasFlag(WANDERING_COMPLETED) → 若未设置 → 继续
  5. 所有逃生路径均不满足 → DEFEAT_DIMENSION_STRIKE 触发
  6. 玩家在进入 STARDUST 后立即失败
预期行为：进入终局纪元的玩家应有合理的生存路径，或在入口时给予明确警告
实际行为：无逃生科技/FLAG 的玩家进入 STARDUST 后立即 DEFEAT
代码证据：
  - Game.ts:792 STARDUST 入口门控（FLAG 条件）
  - Game.ts:1281-1286 DEFEAT_DIMENSION_STRIKE 兜底条件
  - STARDUST year≥420 > 350 → year>350 条件必然满足
设计证据：STARDUST 作为终局纪元，设计预期玩家已具备逃生能力或走 HIDDEN 路线
测试证据：Game.defeatConditions.test.ts:77,171 测试 DEFEAT_DIMENSION_STRIKE
影响范围：
  - 走 HIDDEN 路线的玩家（需黑域生成+数字方舟）自然豁免 DEFEAT 兜底
  - 走非 HIDDEN 路线的玩家若无逃生科技/FLAG，进入 STARDUST 后立即 DEFEAT
  - 与 AR-37 同类条件性风险（GALAXY 中 year≥370>350 同样风险）
是否稳定可复现：条件性（仅在无逃生科技/FLAG 时触发）
尚缺证据：无
建议修复方向：
  1. 在 GALAXY year=420 事件中增加逃生科技检查，若无逃生科技则引导玩家选择其他路径
  2. 或在 STARDUST 入口处理中增加 DEFEAT 预警
  3. 或将 DEFEAT 兜底条件从 year>350 改为 year>450（给 STARDUST 玩家缓冲时间）
  4. 或增加 STARDUST 纪元特有的 DEFEAT 豁免逻辑（如 stardust_era_active FLAG 豁免，配合 AR-42 修复）
建议回归测试：验证进入 STARDUST 的玩家不会立即 DEFEAT（若有合理逃生路径）
```

---

## 第三部分：未确认问题

> 以下问题证据未完全闭合，不进入正式问题清单，待进一步验证。

| 编号 | 来源 | 问题描述 | 尚缺证据 |
|---|---|---|---|
| UC-17 | UC-15 继承 | GALAXY 末 culture 是否足够达到 STARDUST 阈值 2500 | GALAXY 事件 culture 增长 +340~710，每回合自然增长公式 `2 + social×0.10`（project_memory 调整后）。假设 social=50、50 回合：+350。总增长 +690~1060，从 1200 增长至 1890~2260，可能不足 2500。STARDUST 入口 CG 回调 culture+300 在门控通过后执行，不能帮助达到门槛。需 Autoplay500 运行观察 GALAXY 末 culture 实际值。风险评估：若 culture 不足，设 EPOCH_STALLED 停滞，不推进但不阻断；STARDUST 入口 FLAG（zero_homer_contacted/stardust_era_declared）在 GALAXY 内必然设置 |
| UC-18 | UC-16 继承 | treachery 跨纪元累积是否在 STARDUST 触发 DEFEAT_TREACHERY | 依赖 UC-14/UC-16（GALAXY 末 treachery 值）。STARDUST 无新增 treachery 事件，但 DEFEAT_TREACHERY（treachery≥100）全程生效，无纪元门控。若 GALAXY 末 treachery 仍≥100，进入 STARDUST 后立即触发 DEFEAT_TREACHERY。需 Autoplay500 运行观察 |

---

## 第四部分：报告结论

### 1. 本纪元是否形成完整因果链

**STARDUST 内部因果链闭合，出口闭合（终局纪元），入口继承 AR-20 断裂**。

正常路径（假设 AR-20 修复后进入 GALAXY，再进入 STARDUST）入口+内部因果链完整闭合：
```
[GALAXY 末] culture≥2500 + stardust_era_declared（或 zero_homer_contacted）
  → Game.ts:792 门控通过 ✅
    ⚠️ stardust_era_seen 无写入点（AR-43），但 OR 关系不影响入口
    ⚠️ culture≥2500 可能不足（UC-17 继承）
  → 推进 STARDUST
  → Game.ts:702-706 无新增死亡（epochDeathMap 无 STARDUST）✅
  → Game.ts:816 下载 stardust_era 资源包 ✅
  → Game.ts:849 设置 stardust_era_deep Tag（milestone=true 不衰减）✅
  → Game.ts:877 CG 文案"大宇宙的结构在战争中进一步降维碎裂..." ✅
    ⚠️ timeline.json 无"星屑"条目（AR-44），无 timeline 描述显示
  → Game.ts:906-910 入口 CG 回调：
    - addFlag(STARDUST_ERA_ACTIVE)（死FLAG AR-42）✅
    - culture += 300 ✅（门控后执行，不参与入口判定）
    - addHistory("【星屑遗泽】") ✅
  → 每回合标准逻辑：
    - 资源/人口增长 ✅
    - 异星文明威胁 ✅
    - checkEvents / getFilteredEventsForTurn / checkRandomEvents → 均返回空（无事件）✅
    - checkVictoryConditions → 检查 11 种结局 ✅
      ⚠️ DEFEAT 兜底持续生效（AR-45），year≥420>350 必然满足
  → 结局触发 → 游戏结束 ✅（终局纪元，无下游推进）
```

**入口断裂**（继承 AR-20）：BROADCAST→BUNKER 正常推进永久不可达，导致 GALAXY 也无法通过正常路径到达，进而 STARDUST 也无法通过正常路径到达。本审计基于静态代码分析，假设 AR-20 修复后验证 STARDUST 内部因果链。STARDUST 入口门控（stardust_era_declared || stardust_era_seen || zero_homer_contacted）在 GALAXY 内可写入（stardust_era_declared 由 year=420 写入，zero_homer_contacted 由 year=400 写入），门控逻辑本身闭合。

**内部因果链闭合**：STARDUST 纪元无事件，无内部因果链需要验证。每回合仅执行标准逻辑 + 结局判定，无循环依赖、无事件竞争。

**出口闭合**（终局纪元）：STARDUST 是最后一个纪元（epoch=6），无下游推进出口。11 种结局均可触发，结局判定顺序明确，互斥逻辑完整。

**结局退出路径闭合**：玩家可通过 11 种结局退出 STARDUST（HIDDEN/WANDERING/DIGITAL/CONQUEST/DARK_DOMAIN 胜利 + ETERNAL_EXILE/COSMIC_SILENCE 中性 + DEFEAT_TREACHERY/EXTINCTION/DIMENSION_STRIKE/HELIUM_FLASH 失败）。其中 HIDDEN 在判定顺序上优先于 DEFEAT 兜底，且 HIDDEN 所需科技（黑域生成+数字方舟）也是 DEFEAT 逃生路径，HIDDEN 可达。

### 2. 哪些路径已确认正常

- 纪元入口 FLAG：stardust_era_declared（GALAXY year=420）+ zero_homer_contacted（GALAXY year=400）→ Game.ts:792 门控通过 ✅
- 入口处理 15 步标准流程 ✅
- STARDUST 入口 CG 回调：addFlag(STARDUST_ERA_ACTIVE) + culture+300 + addHistory ✅
- 资产包下载：stardust_era（Game.ts:816, AssetLoader.ts:128）✅
- Tag 设置：stardust_era_deep（TagManager.ts:78, milestone=true 不衰减）✅
- CG 文案：epochCGMap[6]='event_stardust_era'（Game.ts:877）✅
- 人物状态：5 人存活（程心/云天明/智子/艾AA/关一帆）+ 33 人继承死亡，无新增死亡 ✅
- swordholder 状态：GALAXY 已清除为 null，deterrenceEnduranceRounds 不再累积（AR-31 自然消解）✅
- 事件分发：checkEvents / getFilteredEventsForTurn / checkRandomEvents 均返回空（无事件）✅
- HIDDEN 胜利路径：galaxy_exodus_seen + alien_alliance + zero_homer_contacted + mini_universe_built + 黑域生成 + 数字方舟 + culture≥1000（入口≥2500 必然满足）+ year≥350（入口≥420 必然满足）+ pop>0 + deterrence≥50 ✅（判定顺序优先于 DEFEAT，科技双重豁免）
- WANDERING 胜利路径：CRISIS 纪元 wandering_completed + 行星发动机Ⅲ型 + 新家园选址 + 互斥FLAG ✅
- DIGITAL 胜利路径：BUNKER 纪元 digital_ark_upgrade + 数字方舟科技 + 互斥FLAG ✅
- DARK_DOMAIN 胜利路径：BUNKER 纪元 dark_domain_decision + 黑域生成科技 + 互斥FLAG ✅
- CONQUEST 胜利路径：条件性可达（需更早纪元已 conquest_declared + isAllCiviConquered）✅
- ETERNAL_EXILE 中性路径：galaxy_exodus_seen + 0<pop≤5 + !wandering_completed + !digital_ark_upgrade ✅
- COSMIC_SILENCE 中性路径：(dark_domain_decision 或 black_domain_decision) + 0<pop≤10 + deterrence<20 ✅
- DEFEAT 结局路径：treachery≥100 / population≤0 / year>350+无防御科技 ✅
- ZERO_HOMER_CONTACTED 互斥锁：一旦设置，除 HIDDEN 外其他 4 条胜利路径全部被锁死 ✅
- 存档持久化：epoch/year/culture/treachery/population/economy/military/prestige/deterrenceValue/swordholder/deterrenceEnduranceRounds/dimensionStrikeTriggered/broadcastTriggered/flags Set/triggeredFilteredIds/randomEventTriggerCounts 均持久化 ✅
- AR-31 自然消解：swordholder=null → deterrenceEnduranceRounds 不再累积 ✅
- AR-40 不受影响：STARDUST 无 filteredEvent，filteredEvent 跳过人物存活检查的系统性缺陷在 STARDUST 无表现 ✅

### 3. 哪些问题已确认

| 问题 ID | 等级 | 问题 |
|---|---|---|
| AR-42 | P3 | STARDUST_ERA_ACTIVE 死 FLAG（仅写入无读取，AR-29/AR-35 同类） |
| AR-43 | P3 | STARDUST_ERA_SEEN 无写入点（死 FLAG，OR 关系不影响入口） |
| AR-44 | P3 | timeline.json 无"星屑"条目（UI 缺失，Game.ts:831 查找失败） |
| AR-45 | P3 | STARDUST DEFEAT 兜底持续生效（AR-37 同类条件性风险，year≥420>350） |

共 4 项正式问题：0 项 P1，0 项 P2，4 项 P3。

### 4. 哪些问题仍未确认

| 编号 | 问题 | 尚缺证据 |
|---|---|---|
| UC-17 | GALAXY 末 culture 是否足够达到 STARDUST 阈值 2500 | 需 Autoplay500 运行观察 GALAXY 末 culture 实际值 |
| UC-18 | treachery 跨纪元累积是否在 STARDUST 触发 DEFEAT_TREACHERY | 依赖 UC-14/UC-16（GALAXY 末 treachery 值），需 Autoplay500 运行观察 |

### 5. 是否允许进入下一纪元审计

**STARDUST 是终局纪元（epoch=6），无下一纪元可审计**。全纪元审计链已完成：

```
黄金岁月（GOLDEN） ✅
  → 危机纪元（CRISIS） ✅
    → 威慑纪元（DETERRENCE） ✅
      → 广播纪元（BROADCAST） ✅
        → 掩体纪元（BUNKER） ✅
          → 银河纪元（GALAXY） ✅
            → 星屑纪元（STARDUST） ✅（本报告，终局纪元）
```

**全纪元审计链闭合**。后续工作建议：
- **AR-20（bunker_world_completed 循环依赖）是全纪元审计链的继承性断裂点**，导致 BUNKER 及之后所有纪元在正常路径下不可达。所有纪元审计基于静态代码分析，修复 AR-20 后需重新验证全链路可达性。
- **UC-15/UC-17（culture 增长不足）跨 GALAXY→STARDUST 持续**：需 Autoplay500 运行观察 GALAXY 末 culture 是否达到 2500。
- **UC-14/UC-16/UC-18（treachery 跨纪元累积）跨 BUNKER→GALAXY→STARDUST 持续**：需 Autoplay500 运行观察 treachery 是否在 STARDUST 触发 DEFEAT_TREACHERY。
- **AR-40（filteredEvent 跳过人物存活检查）是系统性架构缺陷**：影响所有纪元的 filteredEvent，STARDUST 无 filteredEvent 不受影响，但修复时应全局修复。
- **AR-5（FLAG 永久累积）持续**：STARDUST 新增 2 个死 FLAG（stardust_era_active + stardust_era_seen），累积持续增长至游戏结束。

### 6. 上游接口复核结论

**银河纪元报告末尾列出的 10 项 GALAXY→STARDUST 接口复核项**：

| 复核项 | 上游状态 | 本纪元结论 |
|---|---|---|
| 1. 纪元出口条件 | ⚠️ 条件性闭合 | **已复核**：culture≥2500 + stardust_era_declared（或 zero_homer_contacted）→ Game.ts:792 门控通过。stardust_era_declared 由 GALAXY year=420 事件写入；zero_homer_contacted 由 GALAXY year=400 事件写入。FLAG 闭合，culture≥2500 可能不足（UC-17 继承） |
| 2. 状态传递（FLAG 累积） | ⚠️ 待复核 | **已复核**：galaxy_exodus_seen / zero_homer_contacted / mini_universe_built / stardust_era_declared / alien_alliance / alien_diplomacy_seen 等 FLAG 累积进入 STARDUST。galaxy_exodus_seen 被 HIDDEN/ETERNAL_EXILE 读取；zero_homer_contacted 被 HIDDEN 读取 + 互斥锁；mini_universe_built 被 HIDDEN 读取；alien_alliance 被 HIDDEN 读取；5 个死 FLAG（AR-35）仍无消费者；STARDUST 新增 2 个死 FLAG（AR-42 stardust_era_active + AR-43 stardust_era_seen） |
| 3. 人物死亡 | ⚠️ 待复核 | **已复核**：epochDeathMap 中无任何人物含 "STARDUST"。GALAXY 存活 5 人（程心/云天明/智子/艾AA/关一帆）在 STARDUST 仍存活。罗辑/刘慈欣在 GALAXY 已死亡，STARDUST 中仍死亡（继承）。无新增死亡。swordholder=null（罗辑路线，GALAXY 已清除） |
| 4. stardust_era_declared / zero_homer_contacted FLAG | ⚠️ 待复核 | **已复核**：stardust_era_declared 仅被入口门控读取（Game.ts:792），STARDUST 内无事件读取；zero_homer_contacted 被入口门控读取 + HIDDEN 结局读取 + 互斥锁（reqNotFlag）。STARDUST 内无事件读取这些 FLAG 作为 reqFlag/reqNotFlag |
| 5. dimensionStrikeTriggered 字段 | ⚠️ 待复核 | **已复核**：AR-33 双系统独立持续。STARDUST year≥420>350，DEFEAT 条件 (year>350 || dimensionStrikeTriggered) 因 year>350 必然满足 → DEFEAT 兜底生效（除非有逃生科技/FLAG，AR-45 条件性风险） |
| 6. swordholder 字段 | ⚠️ 待复核 | **已复核**：罗辑路线 swordholder 在 GALAXY 已被清除为 null。STARDUST 中 swordholder=null → deterrenceEnduranceRounds 不再累积（Game.ts:667 else 分支 reset 为 0）。AR-31 死累积问题在 STARDUST 自然消解（继承 GALAXY） |
| 7. conquest_declared FLAG | ⚠️ 待复核 | **已复核**：CONQUEST 胜利 allowedEras=[BROADCAST,BUNKER,GALAXY,STARDUST]。若玩家在更早纪元触发 conquest_declared，进入 STARDUST 后 CONQUEST 胜利条件仍可竞争（需 isAllCiviConquered 满足）。但 ZERO_HOMER_CONTACTED 互斥锁一旦设置，CONQUEST 被 reqNotFlag 阻断 |
| 8. culture 值 | ⚠️ 待复核 | **已复核**：STARDUST minCulture=2500, maxCulture=999999（无上限）。STARDUST 入口 CG 回调 culture+300（在门控通过后执行，不能帮助达到门槛）。GALAXY 末 culture 可能不足 2500（UC-17 继承）。HIDDEN 结局需 culture≥1000，STARDUST 入口≥2500 必然满足 |
| 9. treachery 跨纪元 | ⚠️ 待复核 | **已复核**：DEFEAT_TREACHERY（treachery≥100）在 STARDUST 全程生效，无纪元门控。若 GALAXY 末 treachery 仍≥100（UC-18 继承），进入 STARDUST 后立即触发 DEFEAT_TREACHERY。STARDUST 无新增 treachery 事件 |
| 10. STARDUST 入口特殊处理 | ⚠️ 待复核 | **已复核**：Game.ts:906-910 STARDUST 入口 CG 回调：addFlag(STARDUST_ERA_ACTIVE) + culture+=300 + addHistory("【星屑遗泽】")。STARDUST_ERA_ACTIVE 仅在此处写入，全代码库无读取点（死 FLAG，AR-42）。culture+300 不影响门控（门控已通过）。CG 文案 epochCGMap[6]='event_stardust_era'（Game.ts:877）。timeline.json 无"星屑"条目（AR-44），无 timeline 描述显示 |

### 7. 相邻纪元仍需复核的接口

**STARDUST 是终局纪元（epoch=6），无下游纪元，无下游接口需登记**。

---

**AUDIT_REPORT_星屑纪元 报告完成。未修改代码。**

**问题统计**：P1×0，P2×0，P3×4，未确认×2
**因果链状态**：内部闭合 + 出口闭合（终局纪元），入口继承 AR-20 断裂（基于静态代码分析验证）
**上游接口**：10 项全部复核（含 4 项正式问题：AR-42 STARDUST_ERA_ACTIVE 死 FLAG + AR-43 STARDUST_ERA_SEEN 无写入点 + AR-44 timeline.json 无"星屑"条目 + AR-45 DEFEAT 兜底持续生效）
**跨纪元问题持续追踪**：AR-5（FLAG 永久累积，STARDUST 新增 2 个死 FLAG）/ AR-7（Flag 引用漂移，无新增漂移）/ UC-1（treachery 爆发，STARDUST 无新增 treachery 事件，UC-18 风险持续）/ AR-20（bunker_world_completed 循环依赖，继承断裂）/ AR-31（deterrenceEnduranceRounds 死累积，STARDUST 自然消解）/ AR-33（dimensionStrikeTriggered 双系统，STARDUST 中 DEFEAT 因 year>350 触发）/ AR-37（dimensional_strike 旁路 DEFEAT 竞态，STARDUST 条件性风险持续，AR-45 同类）/ AR-40（filteredEvent 跳过人物存活检查，STARDUST 无 filteredEvent 不受影响）
**全纪元审计链**：7 个纪元全部完成（GOLDEN→CRISIS→DETERRENCE→BROADCAST→BUNKER→GALAXY→STARDUST），全链闭合
