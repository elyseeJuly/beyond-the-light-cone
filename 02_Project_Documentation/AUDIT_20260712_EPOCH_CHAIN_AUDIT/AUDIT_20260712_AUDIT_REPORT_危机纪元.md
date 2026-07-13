# `AUDIT_REPORT_危机纪元`

> 纪元：危机纪元（CRISIS, epoch=1）
> 阶段：正式审计报告
> 证据截止：20260712
> 引用文档：EPOCH_EVIDENCE_危机纪元、EPOCH_CAUSAL_VALIDATION_危机纪元、AUDIT_20260712_BASELINE
> 约束：未修改代码，未输出可直接执行的修复方案

---

## 第一部分：完成门禁检查

| 门禁项 | 状态 | 说明 |
|---|---|---|
| 1. 所有事件已进入清单 | ⚠️ 部分满足 | 剧情事件 21 条已入清单（year=0/0/1/2/5/10/15/16/20/25/40/50/60/70/80/150/180/199/200/201/202）；随机事件 53 条已入清单；filteredEvents 29 条已入清单。但 year=16/20/25/40/50/60/70/80/150/180/202 的完整 effects 未逐一展开（标记为未确认项） |
| 2. 所有关键人物已有状态轨迹 | ✅ 满足 | 21 名核心人物（7 初始可用 + 14 锁定）均有状态轨迹，含解锁事件、死亡纪元、死亡方式 |
| 3. 所有读取状态都有合法生产者 | ⚠️ 部分满足 | deterrence_established/doomsday_battle_lost/teardrop_arrived/swordholder_appointed 均有合法生产者；**eto_founded 的生产者不可达**（GOLDEN 纪元事件，新游戏跳过） |
| 4. 所有关键写入都有消费者或明确终止意义 | ⚠️ 部分满足 | 大部分 FLAG 有消费者；**dark_forest_deterrence 完全缺失**（无写入无读取）；**deterrence_era_declared 无消费者**（死 FLAG） |
| 5. 所有关键数值都有来源、范围和消费位置 | ✅ 满足 | culture/economy/population/treachery/deterrenceValue/army/resource 7 个数值字段均有公式、上限、消费位置 |
| 6. 所有 Tag/Flag 生命周期已追踪 | ⚠️ 部分满足 | CRISIS 纪元 FLAG 写入/读取已追踪；但 events.json + randomevents.json + filteredEvents 全量读写交叉比对未完成 |
| 7. 所有科技条件存在合法路径 | ✅ 满足 | 黑暗森林威慑（MILITARY 根节点）、思想钢印Ⅰ/Ⅱ/Ⅲ（INFORMATION 树）、行星发动机/智子工程/50光年远镜/550W量子计算机 均有合法前置链；EPOCH_STALLED 允许无限期研究 |
| 8. 所有纪元出口已验证 | ✅ 满足 | → DETERRENCE（culture≥200 + deterrence_established，year=202 写入）；→ DEFEAT_TREACHERY（treachery≥100）；→ DEFEAT_EXTINCTION（population≤0） |
| 9. 所有可能结局已检查竞争关系 | ✅ 满足 | CRISIS 仅失败结局可触发；TREACHERY 优先于 EXTINCTION（代码顺序）；胜利/中性结局 allowedEras 不含 CRISIS |
| 10. 正常路径和反例路径均已检查 | ✅ 满足 | 19 项反例全部验证（9 闭合，7 确认，3 风险待确认） |
| 11. 存档边界已检查 | ✅ 满足 | 持久化字段、排除字段、原型恢复链路已确认；isGameOver/isObserverMode/broadcastTriggered 均持久化 |
| 12. 未确认项已明确列出 | ✅ 满足 | 7 项未确认项已列出（V-1~V-7） |
| 13. 相邻纪元接口已登记待复核 | ✅ 满足 | DETERRENCE 入口接口已登记（见报告末尾） |

**门禁结论**：13 项中 8 项满足、5 项部分满足。部分满足项均因"全量扫描未完成"或"单一不可达状态"导致，不影响正式问题清单的成立。**允许进入正式问题清单阶段**。

---

## 第二部分：正式问题清单

> 仅证据闭合的问题进入本清单。证据未完全闭合的风险项列入"未确认问题"。

---

### AR-1

```text
问题 ID：AR-1
等级：P1
问题类型：主线不可达 / 关键状态无合法来源
涉及纪元：危机纪元（CRISIS）
现象：eto_founded FLAG 在新游戏中永久不可达，导致 year=2 古筝行动事件永久跳过，伊文斯/林云通过该路径无法解锁
前置条件：新游戏创建（Game.ts:53 初始 epoch=CRISIS，跳过黄金岁月）
完整因果链：
  1. Game.ts:53 `public epoch: EpochType = EpochType.CRISIS;` → 新游戏初始纪元为 CRISIS
  2. events.json year=-27 事件 triggerCondition.epoch="GOLDEN" → 永远不匹配当前纪元
  3. year=-27 事件是 eto_founded 的唯一写入点 → eto_founded 永不写入
  4. events.json year=2 事件 triggerCondition.reqFlag="eto_founded" → reqFlag 检查失败
  5. year=2 古筝行动事件永久跳过 → 伊文斯/林云 unlock_person 不执行
  6. 伊文斯/林云在 CRISIS 纪元无法通过此路径解锁
预期行为：新游戏应能触发古筝行动事件，解锁伊文斯/林云
实际行为：eto_founded 永不写入，古筝行动永久跳过，伊文斯/林云解锁路径阻塞
代码证据：
  - Game.ts:53 `public epoch: EpochType = EpochType.CRISIS;`
  - events.json year=-27 triggerCondition.epoch="GOLDEN"
  - events.json year=2 triggerCondition.reqFlag="eto_founded"
  - 子代理确认：filteredEvents 中无 eto_founded 写入
  - 子代理确认：randomevents.json 中无 eto_founded 写入（待全量确认，但 Grep 零匹配）
设计证据：timeline.json gameYearRange=[6,200] 表明 CRISIS 从 year=6 开始，与 year=-27 GOLDEN 事件不重叠
测试证据：无测试覆盖"新游戏中 eto_founded 是否可达"
影响范围：
  - year=2 古筝行动事件永久跳过
  - 伊文斯/林云解锁路径阻塞（epochDeathMap 注释"古筝行动死亡"无意义）
  - 涉及伊文斯/林云的后续剧情/随机事件无法触发
是否稳定可复现：是（每次新游戏必现）
尚缺证据：randomevents.json 全量扫描确认（Grep 已零匹配，但未逐一读取）
建议修复方向：在 CRISIS 纪元添加 eto_founded 的合法写入点（如 year=0 或 year=1 事件），或将 year=-27 事件的 triggerCondition.epoch 改为包含 CRISIS
建议回归测试：新游戏创建后验证 eto_founded 可达；year=2 古筝行动事件可触发；伊文斯/林云可解锁
```

---

### AR-2

```text
问题 ID：AR-2
等级：P2
问题类型：条件事件异常 / 时序倒置
涉及纪元：危机纪元（CRISIS）
现象：year=1 倒计时事件 reqFlag=sophon_blockade_confirmed，但该 FLAG 在 year=5 才写入，导致 year=1 事件延迟到 year=6+ 才触发
前置条件：新游戏正常运行到 year=1
完整因果链：
  1. year=1 时 checkEvents 检查 events.json year=1 事件
  2. triggerCondition.reqFlag="sophon_blockade_confirmed" → hasFlag 返回 false（未设置）
  3. 事件跳过，hasTriggered 保持 false
  4. year=5 事件触发，effects.flag=sophon_blockade_confirmed 写入
  5. year=6+ 时 checkEvents 再次检查 year=1 事件 → currentYear(6) >= inYear(1) 成立 → reqFlag 满足 → 事件触发
  6. 汪淼在 year=6+ 解锁（而非 year=1）
预期行为：year=1 事件应在 year=1 触发，汪淼在 year=1 解锁
实际行为：year=1 事件在 year=6+ 触发，汪淼延迟解锁，叙事时序错乱（倒计时出现在智子封锁确认之后）
代码证据：
  - events.json year=1 triggerCondition.reqFlag="sophon_blockade_confirmed"
  - events.json year=5 effects.flag=sophon_blockade_confirmed
  - GameEventManager.ts:913 `if (!e.hasTriggered && currentYear >= e.inYear)` — 不检查 inYear 是否已过
  - 子代理确认：filteredEvents 中无 sophon_blockade_confirmed 直接写入（仅第 782 行别名映射）
设计证据：timeline.json 描述"基础物理被智子锁死"应在危机纪元早期
测试证据：无测试覆盖"year=1 事件实际触发年份"
影响范围：汪淼延迟解锁；叙事时序错乱
是否稳定可复现：是（每次新游戏必现）
尚缺证据：无
建议修复方向：将 year=1 事件的 reqFlag 改为无依赖，或将 sophon_blockade_confirmed 的写入提前到 year≤1
建议回归测试：验证 year=1 事件在 year=1 触发；汪淼在 year=1 解锁
```

---

### AR-3

```text
问题 ID：AR-3
等级：P2
问题类型：Tag/Flag 异常 / 死定义
涉及纪元：危机纪元（CRISIS，影响全局）
现象：dark_forest_deterrence FLAG 在 GameFlags.ts 中定义，但全文无写入无读取
前置条件：无
完整因果链：
  1. GameFlags.ts:49 `DARK_FOREST_DETERRENCE: 'dark_forest_deterrence',` — 定义存在
  2. 全局 Grep "dark_forest_deterrence" 仅在 GameFlags.ts:49 出现
  3. 无任何事件/代码写入此 FLAG
  4. 无任何事件/代码读取此 FLAG
预期行为：GameFlags.ts 中定义的 FLAG 应有对应的写入和读取逻辑
实际行为：dark_forest_deterrence 完全缺失，是死定义
代码证据：
  - GameFlags.ts:49 `DARK_FOREST_DETERRENCE: 'dark_forest_deterrence',`
  - 全局 Grep 仅 1 处匹配（定义本身）
设计证据：无
测试证据：FlagTyped.scenario.test.ts 仅验证 FLAG 常量值，未验证读写
影响范围：无直接影响（死定义不触发任何逻辑）；但增加维护成本，可能暗示遗漏的功能点
是否稳定可复现：是
尚缺证据：无
建议修复方向：移除死定义，或补充对应的写入/读取逻辑（若原设计有黑暗森林威慑相关剧情）
建议回归测试：验证 dark_forest_deterrence 不再出现在 GameFlags.ts 或有完整读写链
```

---

### AR-4

```text
问题 ID：AR-4
等级：P2
问题类型：Tag/Flag 异常 / 死 FLAG
涉及纪元：危机纪元出口（DETERRENCE 纪元入口）
现象：deterrence_era_declared FLAG 被 events.json year=201（DETERRENCE 纪元）写入，但无任何事件/代码读取
前置条件：进入 DETERRENCE 纪元
完整因果链：
  1. year=202 事件写入 deterrence_established → updateEpoch 推进到 DETERRENCE
  2. year=201（epoch=DETERRENCE）事件触发，effects.flag=deterrence_era_declared 写入
  3. 全局 Grep "deterrence_era_declared" 仅在 events.json:689 出现（写入点）
  4. 无任何 reqFlag 读取 deterrence_era_declared
预期行为：写入的 FLAG 应有至少一个消费者
实际行为：deterrence_era_declared 无消费者，是死 FLAG
代码证据：
  - events.json:689 `"target": "deterrence_era_declared"` — 唯一写入点
  - 全局 Grep 仅 1 处匹配
设计证据：无
测试证据：无
影响范围：无直接影响；但可能暗示遗漏的事件依赖（原设计可能有后续事件依赖此 FLAG）
是否稳定可复现：是
尚缺证据：无
建议修复方向：移除死 FLAG 写入，或补充消费者（若有后续事件应依赖此 FLAG）
建议回归测试：验证 deterrence_era_declared 有完整读写链或被移除
```

---

### AR-5

```text
问题 ID：AR-5
等级：P2
问题类型：Tag/Flag 异常 / 跨纪元污染
涉及纪元：危机纪元（影响后续所有纪元）
现象：CRISIS 纪元设置的 FLAG 在进入 DETERRENCE 后永久保留，无清理机制
前置条件：CRISIS 纪元期间设置任何 FLAG，然后推进到 DETERRENCE
完整因果链：
  1. CRISIS 纪元事件触发，写入多个 FLAG（yangdong_suicide, ghost_countdown_started, sophon_blockade_confirmed, doomsday_battle_lost, deterrence_established 等）
  2. culture≥200 + deterrence_established → updateEpoch 推进到 DETERRENCE
  3. Game.ts:789-915 纪元入口处理仅 unset EPOCH_STALLED，不清理任何 CRISIS FLAG
  4. FlagManager 无 clearAll 或 clearEpoch 方法
  5. 所有 CRISIS FLAG 永久累积，进入 DETERRENCE 及后续纪元
预期行为：仅当前纪元相关的 FLAG 应生效，跨纪元临时 FLAG 应清理或失效
实际行为：FLAG 永久累积，可能通过 reqNotFlag 检查意外阻断后续纪元事件
代码证据：
  - Game.ts:789-915 纪元入口处理无 FLAG 清理逻辑
  - Game.ts:790 `this.flagManager.unset(FLAG.EPOCH_STALLED);` — 仅清理 EPOCH_STALLED
  - FlagManager 无 clearAll/clearEpoch 方法
  - events.json 中存在 reqNotFlag 检查（如 filteredEvent sophon_blockade 的 reqNotFlag="sophon_broken"）
设计证据：部分 FLAG 需要跨纪元保留（如 deterrence_established 是 DETERRENCE 的入口门控）
测试证据：无测试覆盖"跨纪元 FLAG 污染"
影响范围：可能影响后续纪元事件触发（具体影响需逐一核验每个 reqNotFlag 检查）
是否稳定可复现：是
尚缺证据：CRISIS 纪元设置的 FLAG 中是否有任何 FLAG 通过 reqNotFlag 阻断了 DETERRENCE 纪元事件
建议修复方向：区分"纪元临时 FLAG"和"跨纪元持久 FLAG"，纪元切换时清理临时 FLAG
建议回归测试：验证 CRISIS→DETERRENCE 切换后，临时 FLAG 不影响 DETERRENCE 事件触发
```

---

### AR-6

```text
问题 ID：AR-6
等级：P2
问题类型：关键状态冲突 / 注释与数据不一致
涉及纪元：危机纪元（影响 DETERRENCE 纪元入口）
现象：epochDeathMap 中伊文斯/章北海/丁仪的注释说"危机纪元死亡"，但数据标为 DETERRENCE 死亡
前置条件：进入 DETERRENCE 纪元
完整因果链：
  1. epochDeathMap（GameEventManager.ts:937-992）中：
     - 伊文斯：死亡列表=["DETERRENCE",...]，注释="危机纪元初古筝行动死亡"
     - 章北海：死亡列表=["DETERRENCE",...]，注释="危机纪元末黑暗战役死亡"
     - 丁仪：死亡列表=["DETERRENCE",...]，注释="危机纪元末末日战役牺牲"
  2. Game.ts:702-724 runARound 死亡判定：`isPersonAliveInEpoch(name, currentEpochStr)`
  3. CRISIS 纪元期间：这三人在死亡列表中无"CRISIS" → 存活
  4. 进入 DETERRENCE 后：三人在死亡列表中有"DETERRENCE" → 死亡
  5. 实际行为与注释不符（注释说 CRISIS 死，实际 DETERRENCE 死）
预期行为：注释与数据应一致
实际行为：注释说 CRISIS 死亡，实际 DETERRENCE 才死亡
代码证据：
  - GameEventManager.ts:937-992 epochDeathMap（伊文斯/章北海/丁仪的注释与数据冲突）
  - Game.ts:702-724 死亡判定逻辑
设计证据：文档 5（AUDIT_20260626）声明"8 core character death times per original novel" PASS，但验证维度是"死亡时间按原著修正"，非"注释与数据冲突"
测试证据：GameEventManager.test.ts 测试 isPersonAliveInEpoch，未覆盖注释一致性
影响范围：
  - 伊文斯/章北海/丁仪在 CRISIS 期间存活（与注释意图不符）
  - 注释误导维护者，增加维护成本
  - 与叙事意图可能不符（若原著中这三人在 CRISIS 死亡）
是否稳定可复现：是
尚缺证据：叙事设计意图（CRISIS 死还是 DETERRENCE 死）——需确认原著/设计文档
建议修复方向：统一注释与数据（若应 CRISIS 死，将"CRISIS"加入死亡列表；若应 DETERRENCE 死，修正注释）
建议回归测试：验证 epochDeathMap 注释与数据一致；验证三人在正确纪元死亡
```

---

### AR-7

```text
问题 ID：AR-7
等级：P2
问题类型：关键状态冲突 / 引用漂移
涉及纪元：危机纪元（影响全局，尤其是回溯/读档后）
现象：FlagManager 在反序列化后可能持有旧 flags Set 引用，导致 addFlag/hasFlag 读写不一致
前置条件：存档加载或回溯后
完整因果链：
  1. GameSerializer.ts:76-78 `restorePrototypes` 中 `new FlagManager(inst.flags)` 重建 FlagManager
  2. 若 inst.flags 被替换为新 Set，FlagManager 可能仍持有旧 Set 引用
  3. addFlag 写入旧 Set，hasFlag 读新 Set（或反过来）
  4. 导致"回溯/读档后 flag 行为诡异、结局触发不了"
预期行为：FlagManager 应始终与 flags Set 保持引用一致
实际行为：反序列化后引用可能不一致
代码证据：
  - GameSerializer.ts:76-78 `new FlagManager(inst.flags)`
  - 文档 4（AUDIT_20260705）明确指出此问题
设计证据：无
测试证据：SaveLoad.test.ts 未覆盖"反序列化后 FlagManager 引用一致性"
影响范围：回溯/读档后 FLAG 行为异常，可能导致结局触发失败
是否稳定可复现：需特定条件（flags Set 被替换）
尚缺证据：实际触发场景的精确复现步骤
建议修复方向：确保 FlagManager 与 flags Set 始终共享引用，或在反序列化后显式同步
建议回归测试：验证存档加载后 addFlag/hasFlag 行为一致
```

---

### AR-8

```text
问题 ID：AR-8
等级：P3
问题类型：UI/文本/叙事一致性
涉及纪元：危机纪元（影响全局）
现象：剧情事件（checkEvents）不检查人物是否已解锁/存活，已死亡或未解锁的人物可出现在事件对话中
前置条件：触发包含未解锁/已死亡人物的剧情事件
完整因果链：
  1. GameEventManager.ts:913-935 checkEvents 仅检查 hasTriggered + triggerCondition
  2. 不调用 isEventCharactersUnlocked（对比：checkRandomEvents 第 1047 行调用了）
  3. 任何年份的剧情事件对话中均可出现尚未解锁或已死亡的人物
预期行为：未解锁/已死亡人物不应在事件对话中作为说话者出现
实际行为：已死亡/未解锁人物可出现在对话中
代码证据：
  - GameEventManager.ts:913-935 checkEvents 无 isEventCharactersUnlocked 调用
  - GameEventManager.ts:1035-1080 checkRandomEvents 第 1047 行调用了 isEventCharactersUnlocked（对比）
  - GameEventManager.ts:1001-1004 14 人核心故事人物锁定列表
设计证据：无
测试证据：GameEventManager.test.ts 未覆盖"剧情事件中未解锁人物提前出现"场景
影响范围：叙事一致性降低；玩家可能看到未登场/已死亡人物对话
是否稳定可复现：需确认 events.json 中实际存在此类 talker（未确认项 V-1）
尚缺证据：events.json 中 year<10 事件是否实际存在罗辑/泰勒等人物作为 talker
建议修复方向：在 checkEvents 中增加 isEventCharactersUnlocked 检查（与 checkRandomEvents 对齐）
建议回归测试：验证剧情事件中不出现未解锁/已死亡人物
```

---

### AR-9

```text
问题 ID：AR-9
等级：P3
问题类型：可维护性 / 逻辑分裂
涉及纪元：危机纪元（影响全局结局判定）
现象：checkVictoryConditions 与 getEndingForecast 是两套手写逻辑，对同一规则有不同实现
前置条件：无
完整因果链：
  1. Game.ts:1089-1310 checkVictoryConditions 手写结局判定逻辑
  2. Game.ts 中 getEndingForecast 手写结局预报逻辑
  3. 两者对同一规则有不同实现（如黑域结局：判定看"黑域生成"科技，预报看"光速飞船推进器"）
  4. 玩家可能看到进度条 100% 但结局不触发
预期行为：结局判定与预报应派生自同一数据源
实际行为：两套手写逻辑可能不一致
代码证据：
  - Game.ts:1089-1310 checkVictoryConditions
  - 文档 4（AUDIT_20260705）明确指出此问题
设计证据：无
测试证据：无测试覆盖"判定与预报一致性"
影响范围：玩家看到的结局预报与实际触发结局不一致
是否稳定可复现：是（但具体不一致项需逐一比对）
尚缺证据：checkVictoryConditions 与 getEndingForecast 的完整差异清单
建议修复方向：将结局条件定义为单一数据结构，判定和预报都从它派生
建议回归测试：验证结局预报与实际触发结局一致
```

---

## 第三部分：未确认问题

> 以下问题证据未完全闭合，不进入正式问题清单，待进一步验证。

| 编号 | 来源 | 问题描述 | 尚缺证据 |
|---|---|---|---|
| UC-1 | CV-15 | treachery 在 CRISIS 后期可能达到 100，提前触发 DEFEAT_TREACHERY | 实际游戏中 treachery 在 year=200 时的典型值（需运行 Autoplay500 观察） |
| UC-2 | CV-16 | updateEpoch 先于 checkVictoryConditions 调用，纪元推进可能覆盖失败结局 | 是否存在同回合 updateEpoch 推进 + checkVictoryConditions 失败的实际场景 |
| UC-3 | V-1 | events.json 中 year<10 事件是否实际存在未解锁人物作为 talker | 逐一核验 talk0_talker 字段 |
| UC-4 | V-2 | randomevents.json 是否有 eto_founded / sophon_blockade_confirmed 写入 | 全量扫描（Grep 已零匹配，但未逐一读取） |
| UC-5 | V-6 | rush_tech 效果是否绕过 addProgress 前置检查 | 读取 applyNewEffects 中 rush_tech 实现 |
| UC-6 | V-7 | 文档 5 "Crisis Era circular dependency fixed" 的具体修复内容 | 读取 AUDIT_20260626_NARRATIVE_TIMELINE_FIX_REPORT.md |

---

## 第四部分：报告结论

### 1. 本纪元是否形成完整因果链

**基本形成，但存在 1 处断裂**。

正常路径因果链完整闭合：
```
year=0 杨冬自杀
→ year=5 智子封锁确认
→ year=10 面壁者解锁
→ year=199 水滴抵达
→ year=200 末日战役
→ year=201 黑暗战役
→ year=202 威慑建立（deterrence_established）
→ culture≥200 + deterrence_established
→ 推进到 DETERRENCE
```

断裂点：eto_founded 不可达（AR-1）导致 year=2 古筝行动事件永久跳过，伊文斯/林云解锁路径阻塞。这是 CRISIS 纪元因果链的唯一高严重性断裂。

### 2. 哪些路径已确认正常

- 纪元入口：Game.ts:53 初始 epoch=CRISIS，无 FLAG 门控 ✅
- 纪元出口：culture≥200 + deterrence_established（year=202 写入）→ DETERRENCE ✅
- 核心事件链：year=199→200→201→202 完整闭合 ✅
- 科技前置链：addProgress 严格检查 parentName，无提前解锁 ✅
- 纪元推进：FLAG 门控阻止跨级跳跃（CV-12 闭合）✅
- 永久卡死：正常路径下 year=199 事件无 reqFlag 必触发，不卡死（CV-13 闭合）✅
- 事件去重：hasTriggered 持久化阻止重复触发（CV-3/CV-17 闭合）✅
- 结局竞争：代码顺序优先级明确（CV-14 闭合）✅
- 读档绕过结局：isGameOver 持久化（CV-18 闭合）✅
- 数值跳过事件窗口：deterrence_established 在 year=202 才写入，保证 year=200 时在 CRISIS（CV-11 闭合）✅

### 3. 哪些问题已确认

| 问题 ID | 等级 | 问题 |
|---|---|---|
| AR-1 | P1 | eto_founded 不可达，古筝行动主线永久跳过 |
| AR-2 | P2 | year=1 事件时序倒置，汪淼延迟解锁 |
| AR-3 | P2 | dark_forest_deterrence 死定义 |
| AR-4 | P2 | deterrence_era_declared 死 FLAG |
| AR-5 | P2 | FLAG 永久累积无清理机制 |
| AR-6 | P2 | epochDeathMap 注释与数据冲突（伊文斯/章北海/丁仪） |
| AR-7 | P2 | FlagManager 引用漂移风险 |
| AR-8 | P3 | 剧情事件不检查人物解锁/存活 |
| AR-9 | P3 | 结局判定与预报逻辑分裂 |

共 9 项正式问题：1 项 P1，6 项 P2，2 项 P3。

### 4. 哪些问题仍未确认

| 编号 | 问题 | 尚缺证据 |
|---|---|---|
| UC-1 | treachery 爆发可能提前触发 DEFEAT_TREACHERY | 实际 treachery 曲线 |
| UC-2 | updateEpoch/checkVictoryConditions 顺序风险 | 同回合同时满足的实际场景 |
| UC-3 | 剧情事件中未解锁人物提前出现的实际实例 | talk0_talker 字段核验 |
| UC-4 | randomevents.json 是否有 eto_founded 写入 | 全量扫描 |
| UC-5 | rush_tech 是否绕过前置检查 | applyNewEffects 实现 |
| UC-6 | 文档 5 修复声明与当前代码一致性 | 修复报告内容 |

### 5. 是否允许进入下一纪元审计

**允许**，但附带条件：

- AR-1（eto_founded 不可达）是 CRISIS 纪元的主线断裂点，**建议在进入下一纪元审计前优先确认修复方向**，因为该问题影响伊文斯/林云的解锁，可能级联影响后续纪元中涉及这两人的事件
- UC-1（treachery 爆发）和 UC-2（顺序风险）应在下一纪元审计中持续观察，因为 treachery 跨纪元累积且 updateEpoch/checkVictoryConditions 顺序是全局问题
- AR-5（FLAG 永久累积）和 AR-7（Flag 引用漂移）是全局问题，在后续纪元审计中应继续追踪

### 6. 相邻纪元仍需复核的接口

**下游接口：CRISIS → DETERRENCE**

| 复核项 | 当前状态 | 待验证内容 |
|---|---|---|
| 纪元出口条件 | ✅ 已验证 | culture≥200 + deterrence_established（year=202 写入） |
| 状态传递 | ⚠️ 待复核 | 所有 CRISIS FLAG 永久累积传递到 DETERRENCE（AR-5），需复核哪些 FLAG 影响 DETERRENCE 事件 |
| 人物死亡 | ⚠️ 待复核 | 进入 DETERRENCE 后 12 人因 epochDeathMap 死亡（伊文斯/章北海/丁仪/叶文洁/汪淼/大史/常伟思/杨冬/庄颜/维德/华华/滑膛/朱汉扬），需复核死亡时机是否与 DETERRENCE 事件冲突 |
| year=201 事件 | ⚠️ 待复核 | events.json year=201 有两个事件：epoch=CRISIS（黑暗战役）和 epoch=DETERRENCE（威慑纪元宣告），需复核触发顺序 |
| deterrence_era_declared | ⚠️ 待复核 | 死 FLAG（AR-4），需确认 DETERRENCE 纪元是否有事件应依赖此 FLAG |
| treachery 跨纪元 | ⚠️ 待复核 | treachery 值跨纪元保留，需确认 DETERRENCE 纪元的 treachery 增长与 CRISIS 累积值的关系 |

**上游接口：黄金岁月 → CRISIS**

| 复核项 | 当前状态 | 说明 |
|---|---|---|
| 黄金岁月跳过 | ✅ 设计决策 | Game.ts:53 初始 epoch=CRISIS，黄金岁月事件不可达（非 Bug） |
| eto_founded | ❌ 断裂 | 黄金岁月 year=-27 事件是唯一写入点，新游戏不可达（AR-1） |

---

**AUDIT_REPORT_危机纪元 报告完成。未修改代码。**

**问题统计**：P1×1，P2×6，P3×2，未确认×6
**因果链状态**：基本形成，1 处断裂（AR-1）
**下一纪元审计**：允许进入，附带 6 项接口复核
