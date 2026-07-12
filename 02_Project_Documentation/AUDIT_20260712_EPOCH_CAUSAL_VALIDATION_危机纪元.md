# `EPOCH_CAUSAL_VALIDATION_危机纪元`

> 纪元：危机纪元（CRISIS, epoch=1）
> 阶段：反例审计 + 因果链闭合验证
> 证据截止：20260712
> 引用文档：EPOCH_EVIDENCE_危机纪元、AUDIT_20260712_BASELINE
> 验证方式：主审直接读取核心代码 + 子代理并行取证（filteredEvents FLAG 写入、历史审计文档对比）
> 约束：未修改代码，未输出修复方案

---

## 第一部分：反例审计（19 项）

---

### CV-1：未登场人物提前出现

```text
反例 ID：CV-1
构造条件：year < 10 时触发对话中包含罗辑/泰勒/雷迪亚兹/希恩斯的剧情事件
涉及事件或字段：events.json 中 year<10 的事件的 talk0_talker 字段；checkEvents 不调用 isEventCharactersUnlocked
预期行为：未通过 unlock_person 解锁的人物不应在事件对话中作为说话者出现
实际可达路径：checkEvents（GameEventManager.ts:913-935）仅检查 hasTriggered + triggerCondition，不检查人物是否已解锁 → 任何年份的事件对话中均可出现尚未解锁的人物
代码证据：
  - GameEventManager.ts:913-935 checkEvents 无 isEventCharactersUnlocked 调用
  - GameEventManager.ts:1035-1080 checkRandomEvents 第 1047 行调用了 isEventCharactersUnlocked（对比：剧情事件无此检查）
  - GameEventManager.ts:1001-1004 14 人核心故事人物锁定列表
测试证据：GameEventManager.test.ts 未覆盖"剧情事件中未解锁人物提前出现"场景
当前结论：确认存在设计差异。剧情事件不检查人物解锁状态，已死亡/未解锁人物可出现在对话中。这是设计层面的叙事一致性问题，非逻辑 Bug。
尚缺证据：events.json 中 year<10 的事件是否实际存在罗辑/泰勒等人物作为 talker（需逐一核验 talk0_talker 字段）
```

---

### CV-2：已死亡或离场人物继续参与

```text
反例 ID：CV-2
构造条件：杨冬在 year=0 被 kill_person 杀死后，后续事件对话中仍出现杨冬；或雷志成/杨卫宁在 CRISIS 死亡后仍出现
涉及事件或字段：events.json year=0 kill_person:杨冬；epochDeathMap 中 CRISIS 死亡人物（雷志成/杨卫宁/林云/泰勒/雷迪亚兹等）；后续事件的 talk0_talker
预期行为：已死亡人物不应在后续事件对话中作为说话者出现
实际可达路径：与 CV-1 相同，checkEvents 不检查 isPersonAliveInEpoch → 已死亡人物仍可出现在对话中
代码证据：
  - GameEventManager.ts:913-935 checkEvents 无人物存活检查
  - Game.ts:702-724 runARound 中的死亡判定仅修改 person.isAlive，不影响事件触发
测试证据：无测试覆盖"已死亡人物在后续事件中出现"场景
当前结论：确认存在设计差异。与 CV-1 同源。杨冬在 year=0 死亡后，若后续事件 talk0_talker 包含"杨冬"，将出现已死亡人物继续对话的叙事不一致。
尚缺证据：events.json 中 year>0 的事件是否实际存在杨冬/雷志成/杨卫宁作为 talker
```

---

### CV-3：事件重复触发

```text
反例 ID：CV-3
构造条件：存档加载后，已触发的事件再次触发
涉及事件或字段：GameEvent.hasTriggered 字段；GameSerializer 序列化/反序列化
预期行为：已触发的事件不再触发
实际可达路径：hasTriggered 随 events 数组持久化 → 加载后保持 true → checkEvents 的 `!e.hasTriggered` 检查阻止重复触发
代码证据：
  - GameEventManager.ts:913 `if (!e.hasTriggered && currentYear >= e.inYear)`
  - GameSerializer.ts:39-41 排除列表不包含 events 数组 → events 随 hasTriggered 持久化
  - GameSerializer.ts:72-100 restorePrototypes 重建 GameEventManager 原型链
测试证据：SaveLoad.test.ts 验证存档加载后事件状态
当前结论：闭合。剧情事件不会重复触发。eventQueue 被排除持久化（加载后为空），但不会导致重复触发（已触发事件被 hasTriggered 阻止）。
尚缺证据：无
```

---

### CV-4：必触发事件永久不可达

```text
反例 ID：CV-4
构造条件：新游戏中 eto_founded FLAG 永久不可达，导致 year=2 古筝行动事件永久跳过
涉及事件或字段：events.json year=-27（GOLDEN，写入 eto_founded）；events.json year=2（reqFlag=eto_founded）；Game.ts:53 初始 epoch=CRISIS
预期行为：新游戏应能触发古筝行动事件，解锁伊文斯/林云
实际可达路径：Game.ts:53 初始 epoch=CRISIS → 跳过黄金岁月 → year=-27 事件 triggerCondition.epoch="GOLDEN" 永远不匹配 → eto_founded 永不写入 → year=2 事件 reqFlag 失败 → 古筝行动永久跳过
代码证据：
  - Game.ts:53 `public epoch: EpochType = EpochType.CRISIS;`
  - events.json year=-27 triggerCondition.epoch="GOLDEN"
  - events.json year=2 triggerCondition.reqFlag="eto_founded"
  - 子代理确认：filteredEvents 中无 eto_founded 写入
  - 子代理确认：randomevents.json 中无 eto_founded 写入（待全量确认）
测试证据：无测试覆盖"新游戏中 eto_founded 是否可达"
当前结论：确认。eto_founded 在新游戏中永久不可达，导致 year=2 古筝行动事件及伊文斯/林云解锁路径阻塞。这是 CRISIS 纪元因果链的第一个断裂点。
尚缺证据：randomevents.json 是否有 eto_founded 写入（需全量扫描确认）
```

---

### CV-5：后续事件早于前置事件

```text
反例 ID：CV-5
构造条件：year=1 倒计时事件 reqFlag=sophon_blockade_confirmed，但该 FLAG 在 year=5 才写入
涉及事件或字段：events.json year=1 reqFlag=sophon_blockade_confirmed；events.json year=5 effects.flag=sophon_blockade_confirmed
预期行为：year=1 事件应在 year=1 触发，不应依赖后续年份的 FLAG
实际可达路径：year=1 时 checkEvents 检查 reqFlag=sophon_blockade_confirmed → 未设置 → 跳过 → year=5 事件触发后 sophon_blockade_confirmed 写入 → year=6+ 时 year=1 事件才满足 reqFlag → 但 currentYear ≥ inYear(1) 仍成立 → 事件在 year=6+ 触发
代码证据：
  - events.json year=1 triggerCondition.reqFlag="sophon_blockade_confirmed"
  - events.json year=5 effects.flag=sophon_blockade_confirmed
  - GameEventManager.ts:913 `currentYear >= e.inYear`（不检查 inYear 是否已过）
  - 子代理确认：filteredEvents 中无 sophon_blockade_confirmed 直接写入（仅第 782 行别名映射）
测试证据：无测试覆盖"year=1 事件实际触发年份"
当前结论：确认。year=1 倒计时事件实际在 year=6+ 才触发（而非 year=1），汪淼延迟解锁。叙事时序错乱（倒计时出现在智子封锁确认之后）。
尚缺证据：randomevents.json 是否有 sophon_blockade_confirmed 写入
```

---

### CV-6：状态被读取但没有合法来源

```text
反例 ID：CV-6
构造条件：eto_founded FLAG 被 year=2 事件读取，但唯一写入点（year=-27 GOLDEN 事件）在新游戏中不可达
涉及事件或字段：events.json year=2 reqFlag=eto_founded；events.json year=-27 effects.flag=eto_founded（GOLDEN 纪元）
预期行为：所有被读取的 FLAG 都应有合法的写入路径
实际可达路径：与 CV-4 相同。eto_founded 永不写入 → year=2 事件 reqFlag 永远失败
代码证据：与 CV-4 相同
测试证据：无
当前结论：确认。eto_founded 是"被读取但无合法来源"的 FLAG。与 CV-4 同源。
尚缺证据：无

补充验证——deterrence_established（原 EVIDENCE CE-11 修正）：
  - events.json year=202 事件 effects.flag=deterrence_established（triggerCondition.epoch="CRISIS", reqFlag=doomsday_battle_lost）
  - events.json year=200 事件 effects.flag=doomsday_battle_lost（triggerCondition.epoch="CRISIS", reqFlag=teardrop_arrived）
  - events.json year=199 事件 effects.flag=teardrop_arrived（triggerCondition.epoch="CRISIS", 无 reqFlag）
  - 完整写入链：year=199 teardrop_arrived → year=200 doomsday_battle_lost → year=202 deterrence_established
  - Game.ts:772 出口门控读取 deterrence_established → 有合法来源
  - 结论：deterrence_established 因果链闭合。原 EVIDENCE CE-11 结论修正为"已闭合"。
```

---

### CV-7：状态写入后无人消费

```text
反例 ID：CV-7
构造条件：某些 FLAG 被 events.json 写入但无任何事件或代码读取
涉及事件或字段：events.json 中所有 effects.flag 写入的 FLAG；events.json/randomevents.json/filteredEvents 中所有 reqFlag 读取的 FLAG
预期行为：所有写入的 FLAG 都应有至少一个消费者
实际可达路径：需全量读写交叉比对
代码证据：
  - 子代理确认：dark_forest_deterrence 在 GameFlags.ts:49 定义但全文无写入无读取（完全缺失）
  - 子代理确认：doomsday_battle_lost 在 events.json year=200 写入，被 year=201（黑暗战役）和 year=202（威慑建立）的 reqFlag 读取 → 有消费者
  - 子代理确认：deterrence_era_declared 在 events.json year=201（DETERRENCE 纪元）写入，但未找到读取点 → 可能是死 FLAG
  - 子代理确认：sophon_broken（filteredEvent sophon_countermeasure 写入）被 sophon_blockade 的 reqNotFlag 读取 → 有消费者
测试证据：无全量 FLAG 读写交叉测试
当前结论：部分确认。
  - dark_forest_deterrence：GameFlags.ts 定义但完全缺失（无写入无读取）→ 死定义
  - deterrence_era_declared：写入但未找到读取点 → 疑似死 FLAG
  - 其余 FLAG 的读写交叉比对未完成
尚缺证据：events.json + randomevents.json + filteredEvents 中所有 FLAG 的全量读写交叉比对（EVIDENCE UF-1）
```

---

### CV-8：临时 Tag/Flag 污染下一纪元

```text
反例 ID：CV-8
构造条件：CRISIS 纪元设置的 FLAG 在进入 DETERRENCE 后仍保留，影响后续事件触发
涉及事件或字段：所有 CRISIS 期间设置的 FLAG（yangdong_suicide, ghost_countdown_started, sophon_blockade_confirmed, doomsday_battle_lost, deterrence_established 等）；Game.ts 纪元切换逻辑
预期行为：仅当前纪元相关的 FLAG 应生效，跨纪元 FLAG 应清理或失效
实际可达路径：Game.ts:789-915 纪元切换时不清理任何 FLAG → 所有 FLAG 永久累积 → 后续纪元的事件可通过 reqNotFlag 检查被 CRISIS 的 FLAG 阻断
代码证据：
  - Game.ts:789-915 纪元入口处理无 FLAG 清理逻辑
  - Game.ts:790 仅 unset EPOCH_STALLED
  - FlagManager 无 clearAll 或 clearEpoch 方法
  - events.json 中存在 reqNotFlag 检查（如 filteredEvent sophon_blockade 的 reqNotFlag="sophon_broken"）
测试证据：无测试覆盖"跨纪元 FLAG 污染"
当前结论：确认存在风险。FLAG 永久累积是设计决策（部分 FLAG 需要跨纪元保留，如 deterrence_established 是 DETERRENCE 的入口门控）。但也可能导致 CRISIS 的临时 FLAG 意外阻断 DETERRENCE 事件。具体影响需逐一核验每个 reqNotFlag 检查。
尚缺证据：CRISIS 纪元设置的 FLAG 中是否有任何 FLAG 通过 reqNotFlag 阻断了 DETERRENCE 纪元事件
```

---

### CV-9：科技提前解锁

```text
反例 ID：CV-9
构造条件：未完成前置科技时直接解锁后续科技
涉及事件或字段：TecTreeManager.addProgress；rush_tech 效果
预期行为：科技必须按前置链顺序解锁
实际可达路径：addProgress 严格检查 parentName 前置完成 → 不会提前解锁
代码证据：
  - TecTreeManager.ts:179-200 addProgress：
    - 第 183 行：`if (!node || node.finished) return false;` — 已完成的不重复
    - 第 185 行：`const parentFinished = !node.parentName || tree.isFinished(node.parentName);` — 检查前置
    - 第 186 行：`if (!parentFinished) return false;` — 前置未完成则拒绝
测试证据：TecTreeManager.test.ts（若存在）
当前结论：闭合。科技不会提前解锁。rush_tech 效果（EventSystem.ts:104-227 applyNewEffects）也通过 addProgress 推进，同样受前置检查约束。
尚缺证据：rush_tech 是否有绕过 addProgress 的路径（待确认 applyNewEffects 中的 rush_tech 实现）
```

---

### CV-10：科技永久错过

```text
反例 ID：CV-10
构造条件：CRISIS 纪元期间某些科技因时间不足或资源不足而永久错过
涉及事件或字段：科技工作量、研究速率、CRISIS 纪元年限（0-199+）
预期行为：CRISIS 纪元应有足够时间研究关键科技（黑暗森林威慑、思想钢印等）
实际可达路径：CRISIS 纪元无硬性结束年份（culture 达到 200 才推进，可通过控制文化工人延缓），理论上可无限期停留 → 不会永久错过
代码证据：
  - Game.ts:770-786 culture≥200 但 deterrence_established 未设置时 EPOCH_STALLED → 纪元不推进
  - 玩家可通过减少文化工人分配来延缓 culture 增长
  - 所有科技树在 CRISIS 纪元均可研究（无纪元限制）
测试证据：Autoplay500.test.ts 500 回合自动播放
当前结论：闭合。CRISIS 纪元无 missable 科技。EPOCH_STALLED 机制允许玩家无限期停留以完成科技研究。
尚缺证据：无
```

---

### CV-11：数值增长跳过事件窗口

```text
反例 ID：CV-11
构造条件：culture 增长过快导致 year<200 时 culture 已达到 200，但 year=200 末日战役事件尚未触发
涉及事件或字段：EarthCivilization.ts:538-559 processCulture；events.json year=200 triggerCondition.epoch="CRISIS"
预期行为：year=200 末日战役事件应在 CRISIS 纪元触发
实际可达路径：
  - culture 增长到 200 时 updateEpoch 检查：matched=DETERRENCE，但 deterrence_established 未设置（year=202 才写入）→ EPOCH_STALLED → epoch 保持 CRISIS
  - year=200 事件 triggerCondition.epoch="CRISIS" → 匹配 → 正常触发
  - 结论：culture 增长不会跳过 year=200 事件窗口
代码证据：
  - Game.ts:764-786 updateEpoch 逻辑
  - Game.ts:772 DETERRENCE 门控检查 deterrence_established
  - events.json year=202 才写入 deterrence_established（晚于 year=200）
测试证据：DesignDrift.scenario.test.ts 数值漂移测试
当前结论：闭合。deterrence_established 在 year=202 才写入，保证 year=200 时仍在 CRISIS 纪元。原 EVIDENCE CE-6 风险降级为"已闭合"。

补充验证——treachery 增长跳过事件窗口：
  - year≥100 后 earlyGameFactor=1.0，treachery 每回合最大增长 3
  - 若 treachery 达到 100 → DEFEAT_TREACHERY 触发 → 游戏结束
  - 这不是"跳过事件窗口"而是"提前触发失败结局"，归入 CV-15
尚缺证据：无
```

---

### CV-12：纪元提前推进

```text
反例 ID：CV-12
构造条件：culture 增长到 200 以上时，updateEpoch 跨级跳跃到 BROADCAST 或更高纪元
涉及事件或字段：Game.ts:764-768 matched 查找逻辑；epochs.json 纪元阈值
预期行为：纪元应按顺序逐级推进，不应跨级跳跃
实际可达路径：
  - Game.ts:764: `matched = epochsData.find(e => culture >= e.minCulture && culture <= e.maxCulture);`
  - epochs.json 按顺序排列，find 返回第一个匹配
  - 若 culture=500（BROADCAST 范围），matched=BROADCAST(3)
  - Game.ts:770: `if (matched.epoch > this.epoch)` — 当前 CRISIS(1)，3>1 成立
  - Game.ts:773: BROADCAST 门控检查 COORDINATES_BROADCASTED → 未设置 → allowed=false → EPOCH_STALLED
  - 结论：不会跨级跳跃（每个高级纪元都有 FLAG 门控）
代码证据：
  - Game.ts:772-776 五个高级纪元（DETERRENCE/BROADCAST/BUNKER/GALAXY/STARDUST）均有 FLAG 门控
  - Game.ts:780-786 门控失败时 EPOCH_STALLED
测试证据：EdgeCases.test.ts:377-378 验证 epoch 推进
当前结论：闭合。跨级跳跃被 FLAG 门控阻止。EPOCH_STALLED 机制确保纪元按顺序推进。
尚缺证据：无
```

---

### CV-13：纪元永久卡死

```text
反例 ID：CV-13
构造条件：culture≥200 但 deterrence_established 永远不设置，导致 EPOCH_STALLED 永久卡死
涉及事件或字段：Game.ts:772 DETERRENCE 门控；events.json year=202 deterrence_established 写入
预期行为：玩家应能通过正常游戏路径设置 deterrence_established 并推进到 DETERRENCE
实际可达路径：
  - 正常路径：year=199 teardrop_arrived → year=200 doomsday_battle_lost → year=202 deterrence_established → 推进
  - 异常路径：若 year=199 事件未触发（loreMode 过滤）→ teardrop_arrived 不写入 → year=200 reqFlag 失败 → doomsday_battle_lost 不写入 → year=202 reqFlag 失败 → deterrence_established 不写入 → 永久卡死
代码证据：
  - events.json year=199 triggerCondition 无 reqFlag → 正常路径下必触发
  - GameEventManager.ts:913-917 loreMode 过滤可能跳过事件
  - Game.ts:782-784 EPOCH_STALLED 提示
测试证据：Autoplay500.test.ts 验证 500 回合后游戏状态
当前结论：正常路径下不卡死（year=199 事件无 reqFlag，必触发）。异常路径下（loreMode=strict_three_body 过滤）可能卡死，需确认 year=199 事件是否有 loreDomain 限制。
尚缺证据：events.json year=199 事件是否有 cadenceMeta.loreDomain 字段
```

---

### CV-14：多个结局同时满足

```text
反例 ID：CV-14
构造条件：treachery≥100 且 population≤0 同时满足
涉及事件或字段：Game.ts:1219-1260 DEFEAT_TREACHERY 和 DEFEAT_EXTINCTION
预期行为：仅一个结局应触发
实际可达路径：checkVictoryConditions 按代码顺序检查 → TREACHERY（1219 行）先于 EXTINCTION（1235 行）→ TREACHERY 触发后 isGameOver=true → return 退出 → EXTINCTION 不会触发
代码证据：
  - Game.ts:1219-1223 `if (this.earthCivi.treachery >= 100) { this.isGameOver = true; ... return; }`
  - Game.ts:1235-1237 `if (this.earthCivi.population <= 0) { this.isGameOver = true; ... return; }`
  - 第 1262 行 `return;` 确保后续结局不触发
测试证据：Game.defeatConditions.test.ts
当前结论：闭合。多个结局同时满足时按代码顺序优先级处理，不会同时触发。CRISIS 纪元仅失败结局可触发，无胜利/中性结局竞争。
尚缺证据：无
```

---

### CV-15：错误结局抢占

```text
反例 ID：CV-15
构造条件：CRISIS 纪元期间 treachery 达到 100，提前触发 DEFEAT_TREACHERY，阻断正常纪元推进
涉及事件或字段：EarthCivilization.ts:698-708 processTreachery；Game.ts:1219-1223 DEFEAT_TREACHERY
预期行为：CRISIS 纪元期间不应过早触发失败结局
实际可达路径：
  - year≥100 后 earlyGameFactor=1.0，每回合最大增长 3
  - 若文化值<100，cultureSuppression=0，不抑制增长
  - 事件效果叠加：year=1 ghost_countdown treachery+5（延迟触发）、year=199 teardrop treachery+15、year=200 doomsday treachery+30、year=201 dark_battle treachery+20
  - 累积：若 year=100 时 treachery=0，到 year=200 共 100 回合，理论最大累积 300（钳制到 100）
  - 实际风险：year=200 事件 treachery+30 可能使 treachery 突破 100 → 在 year=200 结算时触发 DEFEAT_TREACHERY
代码证据：
  - EarthCivilization.ts:698-708 processTreachery 公式
  - Game.ts:1219-1223 `if (this.earthCivi.treachery >= 100) { this.isGameOver = true; }`
  - events.json year=200 effects treachery+30
测试证据：Autoplay500.test.ts 可观察 treachery 曲线
当前结论：确认存在风险。CRISIS 后期事件效果（+30 treachery）叠加每回合增长可能导致 treachery 达到 100，提前触发失败结局。这是"错误结局抢占"的反例。
尚缺证据：实际游戏中 treachery 在 year=200 时的典型值（需运行 Autoplay500 观察）
```

---

### CV-16：纪元推进覆盖结局

```text
反例 ID：CV-16
构造条件：updateEpoch 在 checkVictoryConditions 之前调用，纪元推进可能覆盖应触发的结局
涉及事件或字段：Game.ts:731 updateEpoch()；Game.ts:732 checkVictoryConditions()
预期行为：结局判定应优先于纪元推进
实际可达路径：runARound 中 updateEpoch 先执行 → 若纪元推进触发入口处理（CG 事件/Tag 切换）→ 随后 checkVictoryConditions 执行 → 若同时满足失败条件 → isGameOver=true
  - 问题：纪元推进已执行（epoch 已变更），但随后触发失败结局 → 玩家看到的结局与当前纪元不匹配
代码证据：
  - Game.ts:731 `this.updateEpoch();`
  - Game.ts:732 `this.checkVictoryConditions();`
  - 顺序：updateEpoch 先于 checkVictoryConditions
测试证据：无测试覆盖"纪元推进与结局同时触发"场景
当前结论：确认存在顺序风险。若 culture≥200 + deterrence_established 已设置，且 treachery≥100 同时满足：
  1. updateEpoch 推进到 DETERRENCE（epoch 变更、Tag 切换、入口处理）
  2. checkVictoryConditions 触发 DEFEAT_TREACHERY
  → 玩家看到"进入威慑纪元"后立即"失败结局"，体验割裂
  但注意：deterrence_established 在 year=202 写入时 treachery-20（events.json year=202 effects），可能降低 treachery 值。需确认是否能在同回合同时满足两个条件。
尚缺证据：是否存在同回合 updateEpoch 推进 + checkVictoryConditions 失败的实际场景
```

---

### CV-17：读档导致事件重复

```text
反例 ID：CV-17
构造条件：存档加载后，已触发的事件再次入队并触发
涉及事件或字段：GameEvent.hasTriggered；eventQueue；GameSerializer 排除列表
预期行为：加载后不会重复触发已触发的事件
实际可达路径：
  - hasTriggered 随 events 数组持久化 → 加载后保持 true
  - eventQueue 被排除持久化 → 加载后为空
  - checkEvents 检查 `!e.hasTriggered` → 已触发的事件被跳过
  - 结论：不会重复触发
代码证据：
  - GameSerializer.ts:39-41 排除列表包含 eventQueue
  - GameEventManager.ts:913 `if (!e.hasTriggered && currentYear >= e.inYear)`
  - GameSerializer.ts:72-100 restorePrototypes 重建原型链
测试证据：SaveLoad.test.ts、Serialization.scenario.test.ts
当前结论：闭合。读档不会导致事件重复触发。
尚缺证据：无
```

---

### CV-18：读档绕过结局

```text
反例 ID：CV-18
构造条件：存档加载后，isGameOver 状态丢失，玩家可继续游戏绕过结局
涉及事件或字段：Game.isGameOver 字段；GameSerializer 持久化
预期行为：加载后 isGameOver 保持 true，runARound 不再执行
实际可达路径：
  - isGameOver 是 Game 类公共字段（Game.ts:85），不在排除列表中 → 被持久化
  - 加载后 isGameOver=true → runARound 第 317 行 `if (this.isGameOver && !this.isObserverMode) return;` → 直接返回
  - 结论：不会绕过结局
代码证据：
  - Game.ts:85 `public isGameOver: boolean = false;`
  - Game.ts:317 `if (this.isGameOver && !this.isObserverMode) return;`
  - GameSerializer.ts:39-41 排除列表不包含 isGameOver
  - Game.ts:97 broadcastTriggered 也被持久化
  - Game.ts:94 deterrenceEnduranceRounds 也被持久化
测试证据：SaveLoad.test.ts
当前结论：闭合。读档不会绕过结局。isGameOver/broadcastTriggered/deterrenceEnduranceRounds 均被持久化。

补充验证——isObserverMode 绕过：
  - Game.ts:99 `public isObserverMode: boolean = false;` 也被持久化
  - Game.ts:317 `if (this.isGameOver && !this.isObserverMode) return;`
  - 若加载后 isObserverMode=true → isGameOver 检查被绕过 → 可继续游戏
  - 但 isObserverMode 正常游戏中不会设置为 true（需确认设置点）
尚缺证据：isObserverMode 的设置点（是否可能被意外激活）
```

---

### CV-19：历史文档声明已修复，但当前代码仍不一致

```text
反例 ID：CV-19
构造条件：历史审计文档声明某些问题已修复，但当前代码仍存在不一致
涉及事件或字段：5 份历史审计文档 vs 当前代码
预期行为：已声明修复的问题应在当前代码中完全消除
实际可达路径：子代理对比 5 份历史审计文档，交叉核验 9 个目标问题
代码证据：
  - 文档 2（AUDIT_20260622）BUG-09 声明 `_yearJustAdvanced` 安全锁"已修复"
  - 文档 4（AUDIT_20260705）明确将 `_yearJustAdvanced` 定性为"症状补丁"，否定文档 2 的修复声明
  - 文档 5（AUDIT_20260626）声明 "Crisis Era circular dependency fixed" PASS、"19 characters now have epochDeathMap" PASS、"Yang Dong suicide" PASS
  - 文档 3（AUDIT_20260624_P0）声明 `swordholder_appointed` "无需修复（误判）"，但未提及 `deterrence_established`

  当前代码不一致项：
  1. epochDeathMap 注释与数据冲突（伊文斯/章北海/丁仪）：文档 5 声明"8 core character death times per original novel" PASS，但当前代码中这三人注释说 CRISIS 死、数据说 DETERRENCE 死 → 仍未修复
  2. year=200 事件纪元冲突：文档 5 声明 "Crisis Era circular dependency fixed" PASS，但当前代码 year=200 事件 triggerCondition.epoch="CRISIS"（经 CV-11 验证，这实际上不是问题，因为 deterrence_established 在 year=202 才写入）→ 修复声明与实际行为一致，但验证维度不同
  3. Flag 漂移：文档 4 指出 `flagManager = new FlagManager(this.flags)` 反序列化后引用不一致 → 当前代码 GameSerializer.ts:76-78 `new FlagManager(inst.flags)` 仍存在此模式 → 未修复
  4. checkVictoryConditions vs getEndingForecast 逻辑分裂：文档 4 指出两者对科技要求不一致 → 当前代码仍为两套手写逻辑 → 未修复
测试证据：无测试覆盖"历史修复声明与当前代码一致性"
当前结论：确认存在 3 项不一致：
  - epochDeathMap 注释与数据冲突：文档声明 PASS 但代码仍不一致（CV-19a）
  - Flag 漂移：文档 4 指出但未修复（CV-19b）
  - 结局判定/预报逻辑分裂：文档 4 指出但未修复（CV-19c）
尚缺证据：文档 5 "Crisis Era circular dependency fixed" 的具体修复内容（是否指 year=200 事件纪元冲突）
```

---

## 第二部分：因果链闭合验证

### 完整因果链追踪

```
入口状态
  → Game.ts:53 epoch=CRISIS, year=0
  → culture=0, economy=初始值, population=初始值, treachery=0
  → 无 FLAG 设置
  → 7 人物可用（丁仪/汪淼/常伟思/大史/雷志成/杨卫宁/叶文洁）
  → 14 人物锁定（伊文斯/林云/罗辑/泰勒/雷迪亚兹/希恩斯/章北海/庄颜/程心/维德/艾AA/云天明/智子/关一帆）

→ 人物状态
  → year=0: 杨冬通过 kill_person 死亡（events.json year=0 effects）
  → year=5: 智子封锁确认 → 解锁路径无（仅 FLAG 写入）
  → year=6+（延迟自 year=1）: 汪淼通过 unlock_person 解锁
  → year=10: 罗辑/泰勒/雷迪亚兹/希恩斯通过 unlock_person 解锁
  → year=10+: filteredEvent wallfacer_election 可触发（minYear=10, epoch=CRISIS, minCulture=10）
  → year=50+: filteredEvent deterrence_establishment 可触发（minYear=50, epoch=CRISIS, reqTech=黑暗森林威慑, minDeterrence=50）
  → 进入 DETERRENCE 后：伊文斯/章北海/丁仪/叶文洁/汪淼/大史/常伟思等 12 人因 epochDeathMap 死亡

→ 事件资格
  → checkEvents: hasTriggered + triggerCondition（epoch/minYear/reqFlag/reqTech）
  → checkRandomEvents: + isEventCharactersUnlocked + isEventEligible
  → filteredEvents: triggeredFilteredIds 去重 + checkFilterConditions

→ 事件触发（正常路径）
  year=0:  杨冬自杀 → flag:yangdong_suicide, kill_person:杨冬
  year=5:  智子封锁 → flag:sophon_blockade_confirmed
  year=6+: 倒计时（延迟） → unlock:汪淼, flag:ghost_countdown_started
  year=10: 面壁者选拔 → unlock:罗辑/泰勒/雷迪亚兹/希恩斯
  year=15: 太空军启航
  year=50+: filteredEvent 建立威慑体系 → flag:swordholder_appointed（可选）
  year=199: 水滴抵达 → flag:teardrop_arrived
  year=200: 末日战役 → flag:doomsday_battle_lost（reqFlag=teardrop_arrived ✓）
  year=201: 黑暗战役 → flag:dark_battle（reqFlag=doomsday_battle_lost ✓, epoch=CRISIS ✓）
  year=202: 威慑建立 → flag:deterrence_established（reqFlag=doomsday_battle_lost ✓, epoch=CRISIS ✓）

→ 选择或自动结果
  → year=0~199 的剧情事件无 choices（自动效果）
  → filteredEvent wallfacer_election: 2 choices（全力支持/暂缓）
  → filteredEvent deterrence_establishment: 2 choices（任命罗辑/暂缓）

→ 数值/Tag/科技/人物变化
  → culture: 每回合 floor((cultureWorkers + leaderBonus) * weight / 15) + deptBase
  → economy: 每回合工厂产出
  → population: 每回合增长
  → treachery: year<100 减半增长，year≥100 正常增长
  → deterrenceValue: 面壁者每回合 +(leadership+art)*0.05，衰减 3+floor(value*0.02)
  → FLAG: yangdong_suicide, sophon_blockade_confirmed, ghost_countdown_started, teardrop_arrived, doomsday_battle_lost, dark_battle, deterrence_established
  → 科技: 黑暗森林威慑（MILITARY 根节点）、思想钢印Ⅰ/Ⅱ/Ⅲ（INFORMATION）

→ 后续事件
  → year=202 写入 deterrence_established 后
  → 下一次 updateEpoch: culture≥200 + deterrence_established → 推进到 DETERRENCE
  → DETERRENCE 纪元事件：year=201（epoch=DETERRENCE）威慑纪元宣告 → flag:deterrence_era_declared

→ 纪元出口或结局
  → 正常出口: culture≥200 + deterrence_established → DETERRENCE
  → 失败出口: treachery≥100 → DEFEAT_TREACHERY
  → 失败出口: population≤0 → DEFEAT_EXTINCTION
```

---

### 闭合性验证清单

#### 1. 所有读取状态都有生产者

| 读取状态 | 读取位置 | 生产者 | 闭合？ |
|---|---|---|---|
| deterrence_established | Game.ts:772 出口门控 | events.json year=202 effects.flag | ✅ 闭合 |
| doomsday_battle_lost | events.json year=201/202 reqFlag | events.json year=200 effects.flag | ✅ 闭合 |
| teardrop_arrived | events.json year=200 reqFlag | events.json year=199 effects.flag | ✅ 闭合 |
| sophon_blockade_confirmed | events.json year=1 reqFlag | events.json year=5 effects.flag | ⚠️ 时序倒置（CV-5），但有生产者 |
| eto_founded | events.json year=2 reqFlag | events.json year=-27（GOLDEN 不可达） | ❌ 生产者不可达（CV-4/CV-6） |
| swordholder_appointed | filteredEvent deterrence_strain reqFlag | filteredEvent deterrence_establishment effects | ✅ 闭合 |
| 黑暗森林威慑（科技） | filteredEvent deterrence_establishment reqTech | TecTreeManager MILITARY 根节点 | ✅ 闭合 |
| 思想钢印Ⅰ/Ⅱ/Ⅲ（科技） | EarthCivilization.ts:552-554 culture weight | TecTreeManager INFORMATION 树 | ✅ 闭合 |

#### 2. 所有关键写入都有消费者

| 写入状态 | 写入位置 | 消费者 | 闭合？ |
|---|---|---|---|
| yangdong_suicide | events.json year=0 | （待确认） | ⚠️ 待确认（CV-7） |
| ghost_countdown_started | events.json year=1 | （待确认） | ⚠️ 待确认（CV-7） |
| sophon_blockade_confirmed | events.json year=5 | events.json year=1 reqFlag | ✅ 闭合 |
| teardrop_arrived | events.json year=199 | events.json year=200 reqFlag | ✅ 闭合 |
| doomsday_battle_lost | events.json year=200 | events.json year=201/202 reqFlag | ✅ 闭合 |
| deterrence_established | events.json year=202 | Game.ts:772 出口门控 | ✅ 闭合 |
| deterrence_era_declared | events.json year=201(DETERRENCE) | （未找到） | ❌ 疑似死 FLAG（CV-7） |
| dark_battle | events.json year=201 | （待确认） | ⚠️ 待确认（CV-7） |
| swordholder_appointed | filteredEvent deterrence_establishment | filteredEvent deterrence_strain reqFlag | ✅ 闭合 |
| wallfacer_project | filteredEvent wallfacer_election | （待确认） | ⚠️ 待确认（CV-7） |
| dark_forest_deterrence | （无写入点） | （无读取点） | ❌ 完全缺失（CV-7） |

#### 3. 所有强制事件都有稳定可达路径

| 强制事件 | 可达路径 | 闭合？ |
|---|---|---|
| year=0 杨冬自杀 | 无 reqFlag，year=0 必触发 | ✅ 闭合 |
| year=5 智子封锁 | 无 reqFlag，year=5 必触发 | ✅ 闭合 |
| year=199 水滴抵达 | 无 reqFlag，year=199 必触发 | ✅ 闭合 |
| year=200 末日战役 | reqFlag=teardrop_arrived（year=199 写入）| ✅ 闭合 |
| year=201 黑暗战役 | reqFlag=doomsday_battle_lost（year=200 写入）, epoch=CRISIS | ✅ 闭合 |
| year=202 威慑建立 | reqFlag=doomsday_battle_lost（year=200 写入）, epoch=CRISIS | ✅ 闭合 |
| year=1 倒计时 | reqFlag=sophon_blockade_confirmed（year=5 写入） | ⚠️ 延迟触发（CV-5） |
| year=2 古筝行动 | reqFlag=eto_founded（不可达） | ❌ 永久不可达（CV-4） |

#### 4. 所有纪元出口都可达

| 出口 | 条件 | 可达性 | 闭合？ |
|---|---|---|---|
| → DETERRENCE | culture≥200 + deterrence_established | year=202 写入 deterrence_established | ✅ 闭合 |
| → DEFEAT_TREACHERY | treachery≥100 | 事件效果叠加可达 | ✅ 闭合（但 CV-15 有提前触发风险） |
| → DEFEAT_EXTINCTION | population≤0 | 资源枯竭/事件效果可达 | ✅ 闭合 |

#### 5. 所有结局竞争关系明确

| 竞争场景 | 优先级 | 闭合？ |
|---|---|---|
| DEFEAT_TREACHERY vs DEFEAT_EXTINCTION | TREACHERY 优先（Game.ts:1219 先于 1235） | ✅ 闭合 |
| 胜利结局 vs 失败结局 | 胜利优先（Game.ts:1096-1147 先于 1219） | ✅ 闭合（CRISIS 无胜利结局可触发） |
| 纪元推进 vs 失败结局 | updateEpoch 先于 checkVictoryConditions（Game.ts:731-732） | ⚠️ 顺序风险（CV-16） |

#### 6. 不存在提前推进、跨级跳跃或永久卡死

| 风险 | 验证结果 | 闭合？ |
|---|---|---|
| 提前推进 | deterrence_established 在 year=202 才写入，year<202 时不会推进 | ✅ 闭合 |
| 跨级跳跃 | 每个高级纪元有 FLAG 门控（Game.ts:772-776） | ✅ 闭合 |
| 永久卡死 | year=199 事件无 reqFlag，必触发 → year=200 必触发 → year=202 必触发 → deterrence_established 必写入 | ✅ 闭合（正常路径） |
| 永久卡死（异常） | loreMode=strict_three_body 可能过滤 year=199 事件 → 卡死 | ⚠️ 待确认（CV-13） |

---

## 第三部分：总结

### 反例审计结果汇总

| 反例 ID | 类型 | 结论 |
|---|---|---|
| CV-1 | 未登场人物提前出现 | 确认存在（设计差异，非逻辑 Bug） |
| CV-2 | 已死亡人物继续参与 | 确认存在（与 CV-1 同源） |
| CV-3 | 事件重复触发 | 闭合（hasTriggered 持久化阻止） |
| CV-4 | 必触发事件永久不可达 | 确认（eto_founded 不可达 → 古筝行动跳过） |
| CV-5 | 后续事件早于前置事件 | 确认（year=1 reqFlag year=5 才写入） |
| CV-6 | 状态被读取但无合法来源 | 确认（eto_founded）；deterrence_established 已闭合（修正 CE-11） |
| CV-7 | 状态写入后无人消费 | 部分确认（dark_forest_deterrence 完全缺失；deterrence_era_declared 疑似死 FLAG） |
| CV-8 | 临时 Tag/Flag 污染下一纪元 | 确认存在风险（FLAG 永久累积，无清理机制） |
| CV-9 | 科技提前解锁 | 闭合（addProgress 严格检查前置） |
| CV-10 | 科技永久错过 | 闭合（EPOCH_STALLED 允许无限期停留） |
| CV-11 | 数值增长跳过事件窗口 | 闭合（deterrence_established 在 year=202 才写入，保证 year=200 时在 CRISIS） |
| CV-12 | 纪元提前推进 | 闭合（FLAG 门控阻止跨级跳跃） |
| CV-13 | 纪元永久卡死 | 正常路径闭合；异常路径（loreMode 过滤）待确认 |
| CV-14 | 多个结局同时满足 | 闭合（代码顺序优先级明确） |
| CV-15 | 错误结局抢占 | 确认存在风险（treachery 爆发可能提前触发 DEFEAT_TREACHERY） |
| CV-16 | 纪元推进覆盖结局 | 确认存在顺序风险（updateEpoch 先于 checkVictoryConditions） |
| CV-17 | 读档导致事件重复 | 闭合（hasTriggered 持久化） |
| CV-18 | 读档绕过结局 | 闭合（isGameOver 持久化）；isObserverMode 绕过待确认 |
| CV-19 | 历史文档声明已修复但代码不一致 | 确认 3 项不一致（epochDeathMap 注释/Flag 漂移/结局逻辑分裂） |

### 因果链断裂点

| 断裂点 | 严重程度 | 影响 |
|---|---|---|
| eto_founded 不可达（CV-4/CV-6） | 高 | year=2 古筝行动永久跳过，伊文斯/林云解锁路径阻塞 |
| year=1 时序倒置（CV-5） | 中 | 汪淼延迟解锁，叙事时序错乱 |
| dark_forest_deterrence 完全缺失（CV-7） | 低 | GameFlags.ts 定义但无写入无读取，死定义 |
| deterrence_era_declared 无消费者（CV-7） | 低 | 写入但无读取，死 FLAG |
| treachery 爆发风险（CV-15） | 中 | CRISIS 后期可能提前触发失败结局 |
| updateEpoch/checkVictoryConditions 顺序（CV-16） | 中 | 纪元推进可能覆盖失败结局 |
| epochDeathMap 注释/数据冲突（CV-19a） | 中 | 伊文斯/章北海/丁仪死亡时机与注释不符 |
| FLAG 永久累积（CV-8） | 低 | 可能影响后续纪元事件触发 |

### EVIDENCE 文档修正

| 原候选问题 | 修正后结论 | 说明 |
|---|---|---|
| CE-6 (year=200 事件纪元冲突) | **已闭合** | deterrence_established 在 year=202 才写入，保证 year=200 时仍在 CRISIS |
| CE-11 (DETERRENCE_ESTABLISHED 写入点) | **已闭合** | 写入点是 events.json year=202 事件（reqFlag=doomsday_battle_lost） |

### 未确认项

| 编号 | 未确认项 | 待验证方式 |
|---|---|---|
| V-1 | events.json 中 year<10 事件是否实际存在未解锁人物作为 talker | 逐一核验 talk0_talker 字段 |
| V-2 | randomevents.json 是否有 eto_founded / sophon_blockade_confirmed 写入 | 全量扫描 |
| V-3 | events.json year=199 事件是否有 cadenceMeta.loreDomain 限制 | 读取 year=199 事件完整字段 |
| V-4 | isObserverMode 的设置点 | 搜索 isObserverMode 赋值 |
| V-5 | deterrence_era_declared 是否有消费者（全量搜索） | 全局 Grep |
| V-6 | rush_tech 是否绕过 addProgress 前置检查 | 读取 applyNewEffects rush_tech 实现 |
| V-7 | 文档 5 "Crisis Era circular dependency fixed" 的具体修复内容 | 读取 AUDIT_20260626_NARRATIVE_TIMELINE_FIX_REPORT.md |

---

**EPOCH_CAUSAL_VALIDATION_危机纪元 验证完成。未修改代码，未输出修复方案。**
