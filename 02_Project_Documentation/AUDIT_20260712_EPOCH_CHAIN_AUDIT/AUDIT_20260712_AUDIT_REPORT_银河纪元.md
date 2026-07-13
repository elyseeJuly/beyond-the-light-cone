# `AUDIT_REPORT_银河纪元`

> 纪元：银河纪元（GALAXY, epoch=5）
> 阶段：正式审计报告
> 证据截止：20260712
> 引用文档：EPOCH_AUDIT_MODEL_银河纪元、EPOCH_EVIDENCE_银河纪元、EPOCH_CAUSAL_VALIDATION_银河纪元、AUDIT_20260712_BASELINE、AUDIT_20260712_AUDIT_REPORT_掩体纪元
> 约束：未修改代码，未输出可直接执行的修复方案

---

## 第一部分：完成门禁检查

| 门禁项 | 状态 | 说明 |
|---|---|---|
| 1. 所有事件已进入清单 | ✅ 满足 | 剧情事件 5 条（epoch=GALAXY，year 370~420）+ 1 条跨纪元事件（year=400 流浪地球联动）+ 6 个 filteredEvent + 32 个随机事件（8 纯 GALAXY + 19 BUNKER,GALAXY + 5 BROADCAST,BUNKER,GALAXY）全部入清单，effects 已逐一展开 |
| 2. 所有关键人物已有状态轨迹 | ✅ 满足 | 2 人 GALAXY 新增死亡（罗辑/刘慈欣，epochDeathMap 仅含 GALAXY）+ 31 人继承死亡 + 5 人存活（程心/云天明/智子/艾AA/关一帆）均有完整轨迹 |
| 3. 所有读取状态都有合法生产者 | ⚠️ 部分满足 | galaxy_exodus_seen / zero_homer_contacted / mini_universe_built / alien_alliance / stardust_era_declared 等有合法生产者；**dimensional_strike 仅由 BUNKER year=350 事件写入**（继承 AR-33 双系统独立）；入口门控 GALAXY_EXODUS_SEEN 或 DIMENSIONAL_STRIKE 均可在 BUNKER 内写入 |
| 4. 所有关键写入都有消费者或明确终止意义 | ⚠️ 部分满足 | 6 个活 FLAG 有消费者；**5 个死 FLAG 无消费者**（galaxy_era_declared / return_to_home / cautious_return / great_filter_silence / great_filter_contact） |
| 5. 所有关键数值都有来源、范围和消费位置 | ⚠️ 部分满足 | culture / treachery / population / deterrenceValue 4 个数值字段均有公式、阈值、消费位置；**culture 每回合自然增长速率未确认（UC-15）**，可能不足以达到 STARDUST 阈值 2500；treachery 跨纪元累积风险持续（UC-16） |
| 6. 所有 Tag/Flag 生命周期已追踪 | ✅ 满足 | 11 个 FLAG（6 活 + 5 死）+ 1 个 Tag（galaxy_era_deep, milestone=true 不衰减）全量读写链已追踪；FLAG_ALIAS_MAP 应用范围（仅读取不写入）已确认；galaxy_exodus_successful→galaxy_exodus_seen 别名映射已确认 |
| 7. 所有科技条件存在合法路径 | ✅ 满足 | GALAXY filteredEvent 科技依赖（宇宙重启理论：归零者研究→宇宙重启理论，TecTreeManager.ts:157）+ 结局科技条件（黑域生成/数字方舟/行星发动机Ⅲ型/新家园选址）均有合法前置链；HIDDEN 所需 2 科技也是 DEFEAT 逃生路径 |
| 8. 所有纪元出口已验证 | ⚠️ 部分满足 | 正常推进出口（→STARDUST）FLAG 闭合：stardust_era_declared（year=420）和 zero_homer_contacted（year=400）均可在 GALAXY 内写入，满足 Game.ts:776 门控；**culture≥2500 可能不足（UC-15）**；结局退出路径（11 种结局）已验证 |
| 9. 所有可能结局已检查竞争关系 | ✅ 满足 | broadcastTriggered 分支 + 胜利结局数组顺序（HIDDEN→WANDERING→DIGITAL→DETERRENCE→CONQUEST→DARK_DOMAIN）+ NEUTRAL_ETERNAL_EXILE（GALAXY 专属）+ NEUTRAL_COSMIC_SILENCE + DEFEAT 优先级（TREACHERY→EXTINCTION→DIMENSION_STRIKE/HELIUM_FLASH）；ZERO_HOMER_CONTACTED 互斥锁确认 |
| 10. 正常路径和反例路径均已检查 | ✅ 满足 | 10 项反例全部验证（7 项不成立 + 2 项条件性成立 + 1 项降级）+ 正向因果链验证 |
| 11. 存档边界已检查 | ✅ 满足 | epoch/year/culture/treachery/population/economy/military/prestige/deterrenceValue/swordholder/deterrenceEnduranceRounds/dimensionStrikeTriggered/broadcastTriggered/flags Set/triggeredFilteredIds/randomEventTriggerCounts 均持久化；SAVE_VERSION=4 迁移逻辑确认 |
| 12. 未确认项已明确列出 | ✅ 满足 | 2 项未确认项已列出（UC-15 culture 增长不足 / UC-16 treachery 跨纪元累积） |
| 13. 相邻纪元接口已登记待复核 | ✅ 满足 | 上游 BUNKER→GALAXY 9 项接口已复核；下游 GALAXY→STARDUST 接口已登记（见报告末尾） |

**门禁结论**：13 项中 10 项满足、3 项部分满足。部分满足项因"5 个死 FLAG 无消费者"、"culture 增长速率未确认（UC-15）"和"dimensional_strike 继承 AR-33 双系统"导致。**允许进入正式问题清单阶段**。

---

## 第二部分：正式问题清单

> 仅证据闭合的问题进入本清单。证据未完全闭合的风险项列入"未确认问题"。

---

### AR-34

```text
问题 ID：AR-34
等级：P2
问题类型：叙事不一致 / 死亡人物发言（与 AR-23/AR-24/AR-27 同类）
涉及纪元：银河纪元（GALAXY）
现象：罗辑进入 GALAXY 时已被判定死亡（epochDeathMap["罗辑"]=["GALAXY"]），但仍作为 GALAXY filteredEvent great_filter_confrontation 的 speaker 发言
前置条件：进入 GALAXY 纪元
完整因果链：
  1. Game.ts:702-706 进入 GALAXY 时调用 isPersonAliveInEpoch
  2. 罗辑 epochDeathMap["罗辑"]=["GALAXY"] → 包含 "GALAXY" → isAlive=false
  3. Game.ts:710-712：若罗辑为 swordholder 则 swordholder=null（罗辑路线）
  4. filteredEvent great_filter_confrontation（GameEventManager.ts:607-619）条件：epoch:GALAXY, minYear:260, reqFlag:galaxy_exodus_seen, minDeterrence:70
  5. getFilteredEventsForTurn（GameEventManager.ts:723-742）分发 filteredEvent
  6. 不调用 isEventCharactersUnlocked —— filteredEvent 完全跳过人物存活检查
  7. great_filter_confrontation（GameEventManager.ts:612）dialogQueue 中 speaker="罗辑"
  8. 罗辑作为死亡人物发言
预期行为：死亡人物不应在事件中作为 speaker 出现
实际行为：罗辑在 GALAXY 死亡但仍作为 great_filter_confrontation 的 speaker
代码证据：
  - GameEventManager.ts:958 epochDeathMap 罗辑含 ["GALAXY"]
  - GameEventManager.ts:612 great_filter_confrontation speaker="罗辑"
  - GameEventManager.ts:723-742 getFilteredEventsForTurn 不调用 isEventCharactersUnlocked
  - GameEventManager.ts:994-1033 isEventCharactersUnlocked 检查 e.dialogNodes（filteredEvent 使用 dialogQueue，属性不匹配）
设计证据：罗辑在原著中于威慑纪元结束、掩体纪元初期死亡，GALAXY 不应出现
测试证据：无测试覆盖 GALAXY filteredEvent speaker 存活一致性
影响范围：
  - 叙事不一致（死亡人物发言）
  - 玩家可能看到罗辑在已死亡后继续参与大过滤器对抗事件
是否稳定可复现：是（每次进入 GALAXY 并触发 great_filter_confrontation 必现）
尚缺证据：无
建议修复方向：
  1. 将罗辑替换为其他存活人物（如关一帆/云天明/智子）
  2. 或调整 epochDeathMap 罗辑死亡纪元（需评估对原著叙事一致性影响）
  3. 配合 AR-40 修复：让 filteredEvent 也经过 isEventCharactersUnlocked 检查
建议回归测试：验证 GALAXY 纪元 filteredEvent 中无死亡人物作为 speaker
```

---

### AR-35

```text
问题 ID：AR-35
等级：P2
问题类型：Tag/Flag 异常 / 死 FLAG 群（与 AR-15/AR-22/AR-29 同类）
涉及纪元：银河纪元（GALAXY）
现象：GALAXY 纪元期间 5 个 FLAG 被写入但无任何消费者，是死 FLAG
前置条件：无
完整因果链：
  1. galaxy_era_declared：events.json:1623 写入（year=370），0 读取
  2. return_to_home：GameEventManager.ts:588 写入（filteredEvent reunion_homeworld choice A），0 读取
  3. cautious_return：GameEventManager.ts:589 写入（filteredEvent reunion_homeworld choice B），0 读取
  4. great_filter_silence：GameEventManager.ts:616 写入（filteredEvent great_filter_confrontation choice A），0 读取
  5. great_filter_contact：GameEventManager.ts:617 写入（filteredEvent great_filter_confrontation choice B），0 读取
预期行为：写入的 FLAG 应有至少一个消费者
实际行为：5 个 FLAG 无消费者，是死 FLAG
代码证据：
  - 全量 Grep 验证每个 FLAG 仅写入点匹配，无读取点
设计证据：无
测试证据：无
影响范围：无直接影响；增加维护成本，可能暗示遗漏的功能点（如重返家园分支、大过滤器结局判定）
是否稳定可复现：是
尚缺证据：无
建议修复方向：移除死 FLAG 写入，或补充消费者（如重返家园结局判定、大过滤器接触后续剧情）
建议回归测试：验证死 FLAG 被移除或有完整读写链
```

---

### AR-36

```text
问题 ID：AR-36
等级：P3
问题类型：可维护性 / FLAG 双写（与 AR-32 同类）
涉及纪元：银河纪元（GALAXY）
现象：zero_homer_contacted 和 mini_universe_built 被 events.json 和 filteredEvent 双路径写入同一 FLAG，可能导致维护困惑
前置条件：进入 GALAXY 纪元
完整因果链：
  1. zero_homer_contacted：
     - events.json:1520（year=400 归零者播报）写入
     - GameEventManager.ts:674（filteredEvent zero_homer_contact_event）写入
     - filteredEvent 条件 reqNotFlag:zero_homer_contacted（自锁）
  2. mini_universe_built：
     - events.json:1545（year=405 小宇宙对接）写入
     - GameEventManager.ts:691（filteredEvent mini_universe_build_event）写入
     - filteredEvent 条件 reqNotFlag:mini_universe_built（自锁）
  3. events.json 按 year 触发（400/405），filteredEvent 按 condition 触发
  4. 若 events.json 先触发 → FLAG 设置 → filteredEvent reqNotFlag 自锁不再触发
  5. 若 filteredEvent 先触发 → FLAG 设置 → events.json 仍触发（无 reqNotFlag）→ FlagManager.set 幂等无副作用
预期行为：同一 FLAG 应有单一写入点，或双写应有明确语义
实际行为：双写不导致功能异常，但增加维护成本
代码证据：
  - events.json:1520/1545 写入 zero_homer_contacted / mini_universe_built
  - GameEventManager.ts:674/691 filteredEvent 写入同一 FLAG
  - GameEventManager.ts:673/687 filteredEvent reqNotFlag 自锁
设计证据：无
测试证据：无
影响范围：无功能影响；可维护性成本
是否稳定可复现：是
尚缺证据：无
建议修复方向：统一为单一写入点（建议保留 events.json，移除 filteredEvent 写入，或反之并调整 reqNotFlag 逻辑）
建议回归测试：验证 zero_homer_contacted / mini_universe_built 读写链单一清晰
```

---

### AR-37

```text
问题 ID：AR-37
等级：P3
问题类型：结局竞争 / 入口旁路与 DEFEAT 兜底竞态（条件性）
涉及纪元：银河纪元（GALAXY）
现象：通过 dimensional_strike FLAG 旁路进入 GALAXY 的玩家，因 year≥370>350 必然满足 DEFEAT 兜底条件，若无逃生科技/FLAG 会立即触发 DEFEAT_DIMENSION_STRIKE
前置条件：通过 dimensional_strike FLAG（无 galaxy_exodus_seen）进入 GALAXY，且无逃生科技/FLAG
完整因果链：
  1. BUNKER year=350 二向箔打击事件触发 → events.json:1373 写入 dimensional_strike FLAG
  2. 若玩家未触发 year=365 银河出逃事件（未写 galaxy_exodus_seen）
  3. culture≥1200 → Game.ts:775 门控通过（dimensional_strike 满足 OR 条件）
  4. 推进 GALAXY，year≥370
  5. checkVictoryConditions（Game.ts:1265）：(year>350 || dimensionStrikeTriggered) → year≥370>350 → 条件满足
  6. 检查逃生路径（Game.ts:1267-1270）：
     - !isTecFinishedAnywhere("黑域生成") → 若未完成 → 继续
     - !isTecFinishedAnywhere("数字方舟") → 若未完成 → 继续
     - !hasFlag(DIMENSIONAL_DEFENSE) → 若未设置 → 继续
     - !hasFlag(DIMENSIONAL_DEFENSE_COMPLETED) → 若未设置 → 继续
     - !hasFlag(WANDERING_COMPLETED) → 若未设置 → 继续
  7. 所有逃生路径均不满足 → DEFEAT_DIMENSION_STRIKE 触发
  8. 玩家在进入 GALAXY 后立即失败
预期行为：通过灾变旁路进入 GALAXY 的玩家应有合理的生存路径，或在入口时给予明确警告
实际行为：无逃生科技/FLAG 的玩家进入 GALAXY 后立即 DEFEAT
代码证据：
  - Game.ts:775 GALAXY 门控：galaxy_exodus_seen || dimensional_strike
  - Game.ts:1265-1270 DEFEAT_DIMENSION_STRIKE 兜底条件
  - events.json:1373 BUNKER year=350 写入 dimensional_strike
设计证据：dimensional_strike 旁路设计为灾变入口，玩家应已具备逃生能力
测试证据：Game.defeatConditions.test.ts:77,171 测试 DEFEAT_DIMENSION_STRIKE
影响范围：
  - 走灾变旁路的玩家若未准备逃生科技，进入 GALAXY 后立即失败
  - 走 HIDDEN 路线的玩家（需黑域生成+数字方舟）自然豁免
  - 走 ETERNAL_EXILE 中性结局的玩家若无逃生科技会被截断
是否稳定可复现：条件性（仅在无逃生科技/FLAG 时触发）
尚缺证据：无
建议修复方向：
  1. 在 BUNKER year=350 事件中增加逃生科技检查，若无逃生科技则引导玩家选择其他路径
  2. 或在 GALAXY 入口处理中增加 DEFEAT 预警
  3. 或将 DEFEAT 兜底条件从 year>350 改为 year>420（GALAXY 末年），给玩家缓冲时间
建议回归测试：验证通过 dimensional_strike 旁路进入 GALAXY 的玩家不会立即 DEFEAT（若有合理逃生路径）
```

---

### AR-38

```text
问题 ID：AR-38
等级：P3
问题类型：文档不一致 / 人物死亡状态描述错误
涉及纪元：银河纪元（GALAXY）
现象：BUNKER 报告第七节列"刘慈欣存活"，但 epochDeathMap["刘慈欣"]=["GALAXY"]，刘慈欣在 GALAXY 纪元死亡，与 BUNKER 报告描述不符
前置条件：无
完整因果链：
  1. BUNKER 报告（AUDIT_20260712_AUDIT_REPORT_掩体纪元.md）第七节列"刘慈欣存活"
  2. GameEventManager.ts:989：`"刘慈欣": ["GALAXY"]`
  3. GameEventManager.ts:985 注释："刘慈欣宇宙联动人物，默认活到较后"
  4. isPersonAliveInEpoch("刘慈欣", "GALAXY") → ["GALAXY"].includes("GALAXY") → true → 返回 false（死亡）
  5. 进入 GALAXY 时 Game.ts:702-706 判定刘慈欣死亡
预期行为：BUNKER 报告应描述刘慈欣在 BUNKER 存活但在 GALAXY 死亡
实际行为：BUNKER 报告仅说"存活"，未说明死亡纪元
代码证据：
  - GameEventManager.ts:989 epochDeathMap["刘慈欣"]=["GALAXY"]
  - GameEventManager.ts:985 注释"默认活到较后"
设计证据：刘慈欣为宇宙联动人物，设计为活到较后纪元
测试证据：无
影响范围：文档不一致；不影响代码运行
是否稳定可复现：是
尚缺证据：无
建议修复方向：修正 BUNKER 报告描述为"刘慈欣在 BUNKER 存活，在 GALAXY 死亡"
建议回归测试：无
```

---

### AR-39

```text
问题 ID：AR-39
等级：P3
问题类型：可维护性 / minYear 语义冗余（与 AR-19/AR-25/AR-30 同类）
涉及纪元：银河纪元（GALAXY）
现象：6 个 GALAXY filteredEvent 的 minYear（200/220/260/280/300/350）远低于 GALAXY 起始 year（≥370），约束冗余
前置条件：进入 GALAXY 纪元
完整因果链：
  1. GALAXY 纪元 year≥370（从 BUNKER 推进，BUNKER year≥280 + culture 增长至 1200）
  2. GameEventManager.ts:776：if (cond.minYear !== undefined && game.year < cond.minYear) return false
  3. minYear=200/220/260/280/300/350 在 year≥370 时已满足（370>350>300>280>260>220>200）
  4. minYear 约束冗余，实际约束由 reqTech/reqFlag/minCulture/minDeterrence 提供
预期行为：minYear 应反映设计意图（纪元内偏移或合理绝对年份）
实际行为：minYear 语义为绝对年份，但值远低于纪元起始 year
代码证据：
  - GameEventManager.ts:558 galaxy_era_exodus minYear:220
  - GameEventManager.ts:565 alien_civilization_diplomacy minYear:200
  - GameEventManager.ts:579 reunion_homeworld minYear:280
  - GameEventManager.ts:607 great_filter_confrontation minYear:260
  - GameEventManager.ts:666 zero_homer_contact_event minYear:300
  - GameEventManager.ts:680 mini_universe_build_event minYear:350
  - GameEventManager.ts:776 game.year < cond.minYear 使用绝对年份
设计证据：minYear 可能原设计为"纪元内偏移"
测试证据：无
影响范围：无功能影响；语义不一致增加维护成本
是否稳定可复现：是
尚缺证据：无
建议修复方向：调整 minYear 为合理值（如 375/380/390/400/410/420 表示 GALAXY 内偏移），或在注释中说明语义
建议回归测试：验证 filteredEvent 触发时点符合设计意图
```

---

### AR-40

```text
问题 ID：AR-40
等级：P2
问题类型：架构缺陷 / filteredEvent 完全跳过人物存活检查（系统性问题）
涉及纪元：银河纪元（GALAXY）（影响所有纪元的 filteredEvent）
现象：filteredEvent 使用 dialogQueue 属性，但 isEventCharactersUnlocked 检查 e.dialogNodes 属性，属性不匹配导致 filteredEvent 永远跳过人物存活检查；且 getFilteredEventsForTurn 根本不调用 isEventCharactersUnlocked
前置条件：无
完整因果链：
  1. GameEvent.ts:34：GameEvent 接口定义 dialogNodes: DialogNode[]
  2. FilteredEventPayload 使用 dialogQueue 属性（GameEventManager.ts:610）
  3. isEventCharactersUnlocked（GameEventManager.ts:994-1033）：`if (e.dialogNodes)` 检查的是 dialogNodes
  4. FilteredEventPayload 无 dialogNodes 属性 → e.dialogNodes 为 undefined → 跳过整个 for 循环
  5. getFilteredEventsForTurn（GameEventManager.ts:723-742）不调用 isEventCharactersUnlocked
  6. 即使调用，dialogNodes 为 undefined 也会跳过检查
  7. 影响范围：所有 filteredEvent（29 条）都不经过 speaker 存活检查
  8. 剧情事件 checkEvents（GameEventManager.ts:913-935）也不调用 isEventCharactersUnlocked
  9. 仅随机事件 checkRandomEvents（GameEventManager.ts:1035-1080）调用 isEventCharactersUnlocked
预期行为：所有事件类型（剧情/过滤/随机）都应检查 speaker 存活状态
实际行为：仅随机事件检查 speaker 存活，filteredEvent 和剧情事件完全跳过
代码证据：
  - GameEvent.ts:34 dialogNodes 属性定义
  - GameEventManager.ts:610 FilteredEventPayload 使用 dialogQueue
  - GameEventManager.ts:1009 isEventCharactersUnlocked 检查 e.dialogNodes
  - GameEventManager.ts:723-742 getFilteredEventsForTurn 不调用 isEventCharactersUnlocked
  - GameEventManager.ts:913-935 checkEvents 不调用 isEventCharactersUnlocked
  - GameEventManager.ts:1047 checkRandomEvents 调用 isEventCharactersUnlocked
设计证据：无
测试证据：无测试覆盖 filteredEvent/剧情事件 speaker 存活检查
影响范围：
  - 所有 filteredEvent（29 条）的 speaker 死亡后仍可发言（AR-27/AR-34 的根因）
  - 所有剧情事件的 speaker 死亡后仍可发言
  - 系统性架构缺陷，影响所有纪元
是否稳定可复现：是
尚缺证据：无
建议修复方向：
  1. 在 getFilteredEventsForTurn 中增加 isEventCharactersUnlocked 调用
  2. 修改 isEventCharactersUnlocked 兼容 dialogQueue 属性（或统一属性名）
  3. 在 checkEvents 中也增加 isEventCharactersUnlocked 调用
建议回归测试：验证 filteredEvent 和剧情事件中死亡人物不作为 speaker
```

---

### AR-41

```text
问题 ID：AR-41
等级：P3
问题类型：文档不一致 / 基线拼写错误
涉及纪元：银河纪元（GALAXY）
现象：基线文档 AUDIT_20260712_BASELINE.md:297 使用 ALIAN_ALLIANCE（拼写错误），代码中使用 ALIEN_ALLIANCE（正确拼写）
前置条件：无
完整因果链：
  1. 基线 AUDIT_20260712_BASELINE.md:297 使用 `ALIAN_ALLIANCE`（拼写错误，缺少 E）
  2. 代码 GameFlags.ts:40：`ALIEN_ALLIANCE: 'alien_alliance'`（正确拼写）
  3. Game.ts:935：`this.hasFlag(FLAG.ALIEN_ALLIANCE)` —— 使用常量
  4. GameEventManager.ts:574：`target: "alien_alliance"` —— 字符串匹配正确
  5. 代码运行不受文档拼写错误影响
预期行为：基线文档应使用正确的 FLAG 名称
实际行为：基线文档拼写错误，不影响代码运行
代码证据：
  - GameFlags.ts:40 ALIEN_ALLIANCE = 'alien_alliance'
  - Game.ts:935 使用 FLAG.ALIEN_ALLIANCE 常量
  - GameEventManager.ts:574 使用 'alien_alliance' 字符串
设计证据：无
测试证据：无
影响范围：仅文档不一致；不影响功能
是否稳定可复现：是
尚缺证据：无
建议修复方向：修正基线文档 AUDIT_20260712_BASELINE.md:297 的 ALIAN_ALLIANCE 为 ALIEN_ALLIANCE
建议回归测试：无
```

---

## 第三部分：未确认问题

> 以下问题证据未完全闭合，不进入正式问题清单，待进一步验证。

| 编号 | 来源 | 问题描述 | 尚缺证据 |
|---|---|---|---|
| UC-15 | C-4 / V-10 | GALAXY 期间 culture 增长是否足够达到 STARDUST 阈值 2500 | GALAXY 事件 culture 增长 +340~710，每回合自然增长公式 `2 + social×0.10`（project_memory 调整后）。假设 social=50、50 回合：+350。总增长 +690~1060，从 1200 增长至 1890~2260，可能不足 2500。需 Autoplay500 运行观察 GALAXY 期间 culture 实际增长。风险评估：若 culture 不足，设 EPOCH_STALLED 停滞，不推进但不阻断；STARDUST 入口 FLAG（zero_homer_contacted）在 year=400 必然设置 |
| UC-16 | UC-14 继承 | treachery 跨纪元累积是否在 GALAXY 触发 DEFEAT_TREACHERY | 依赖 UC-14（BUNKER 末 treachery 值）。BUNKER year=340 +50 高风险，若未触发 DEFEAT_TREACHERY 进入 GALAXY，treachery 仍可能≥100。GALAXY 无新增 treachery 事件，但 DEFEAT_TREACHERY 全程生效。需 Autoplay500 运行观察 |

---

## 第四部分：报告结论

### 1. 本纪元是否形成完整因果链

**GALAXY 内部因果链闭合，出口条件性闭合，入口继承 AR-20 断裂**。

正常路径（假设 AR-20 修复后进入 GALAXY）入口+内部因果链完整闭合：
```
[BUNKER 末] culture≥1200 + galaxy_exodus_seen（或 dimensional_strike）
  → 推进 GALAXY（Game.ts:775 门控通过）
  → Game.ts:702-706 罗辑/刘慈欣死亡（epochDeathMap 含 GALAXY）
  → Game.ts:710-712 swordholder=null（罗辑路线）
  → year=370 银河纪元宣告 → galaxy_era_declared（死FLAG AR-35）+ culture+60
  → filteredEvent galaxy_era_exodus → galaxy_exodus_seen（可能已在 BUNKER 写入）
  → filteredEvent alien_civilization_diplomacy → alien_diplomacy_seen + alien_alliance（choice A）
  → filteredEvent great_filter_confrontation → great_filter_silence/contact（死FLAG AR-35）
    ⚠️ 罗辑死亡发言（AR-34），但事件仍触发
  → filteredEvent reunion_homeworld → return_to_home/cautious_return（死FLAG AR-35）
  → year=400 归零者播报 → zero_homer_contacted + culture+100
    ⚠️ zero_homer_contacted 双写（AR-36）
  → year=405 小宇宙对接 → mini_universe_built + culture+80 + deterrenceValue+10
    ⚠️ mini_universe_built 双写（AR-36）
  → year=420 星屑纪元宣告 → stardust_era_declared + culture+100
  → culture≥2500 + stardust_era_declared（或 zero_homer_contacted）
    ⚠️ culture 可能不足（UC-15）
  → 推进 STARDUST ✅ 出口条件性闭合
```

**入口断裂**（继承 AR-20）：BROADCAST→BUNKER 正常推进永久不可达，导致 GALAXY 也无法通过正常路径到达。本审计基于静态代码分析，假设 AR-20 修复后验证 GALAXY 内部因果链。GALAXY 入口门控（galaxy_exodus_seen || dimensional_strike）在 BUNKER 内可写入，门控逻辑本身闭合。

**出口条件性闭合**：GALAXY→STARDUST 正常推进出口的 FLAG 条件闭合（stardust_era_declared / zero_homer_contacted 均可在 GALAXY 内写入），但 culture≥2500 可能不足（UC-15）。若 culture 不足，设 EPOCH_STALLED 停滞，不推进但不阻断。

**结局退出路径**闭合：玩家可通过 11 种结局退出 GALAXY（HIDDEN/WANDERING/DIGITAL/CONQUEST/DARK_DOMAIN 胜利 + ETERNAL_EXILE/COSMIC_SILENCE 中性 + DEFEAT_TREACHERY/EXTINCTION/DIMENSION_STRIKE/HELIUM_FLASH 失败）。其中 HIDDEN 在判定顺序上优先于 DEFEAT 兜底，且 HIDDEN 所需科技也是 DEFEAT 逃生路径，HIDDEN 可达。

### 2. 哪些路径已确认正常

- 纪元出口 FLAG：stardust_era_declared（year=420）+ zero_homer_contacted（year=400）→ Game.ts:776 门控 ✅
- 内部事件链：year=370→400→405→420 通过 reqFlag 顺序触发 ✅
- filteredEvent 依赖链：galaxy_exodus_seen → reunion_homeworld/great_filter_confrontation（reqFlag）；zero_homer_contacted → mini_universe_build_event（reqFlag）✅
- 人物死亡：进入 GALAXY 时罗辑/刘慈欣死亡（epochDeathMap 含 GALAXY）✅（但罗辑死亡发言问题见 AR-34）
- swordholder 清除：罗辑死亡时 swordholder=null，deterrenceEnduranceRounds 不再累积（AR-31 在 GALAXY 自然消解）✅
- 事件去重：hasTriggered + triggeredFilteredIds 持久化 ✅
- 存档持久化：epoch/year/culture/treachery/population/economy/military/prestige/deterrenceValue/swordholder/deterrenceEnduranceRounds/dimensionStrikeTriggered/broadcastTriggered/flags Set/triggeredFilteredIds/randomEventTriggerCounts 均持久化 ✅
- HIDDEN 胜利路径：galaxy_exodus_seen + alien_alliance + zero_homer_contacted + mini_universe_built + 黑域生成 + 数字方舟 + culture≥1000 + year≥350 + pop>0 + deterrence≥50 ✅（判定顺序优先于 DEFEAT，科技双重豁免）
- WANDERING 胜利路径：CRISIS 纪元 wandering_completed + GALAXY 纪元行星发动机Ⅲ型 + 新家园选址 ✅
- DIGITAL 胜利路径：BUNKER 纪元 digital_ark_upgrade + 数字方舟科技 ✅
- DARK_DOMAIN 胜利路径：BUNKER 纪元 dark_domain_decision + 黑域生成科技 ✅（但 events.json year=290 路径不可达，AR-28 继承）
- CONQUEST 胜利路径：条件性可达（需 BROADCAST 已 conquest_declared + isAllCiviConquered，UC-12 待运行时验证）✅
- ETERNAL_EXILE 中性路径：galaxy_exodus_seen + 0<pop≤5 + !wandering_completed + !digital_ark_upgrade ✅（GALAXY 专属结局）
- NEUTRAL_COSMIC_SILENCE 路径：epoch≥BUNKER + (dark_domain_decision 或 black_domain_decision) + 0<pop≤10 + deterrence<20 ✅
- DEFEAT 结局路径：treachery≥100 / population≤0 / year>350+无防御科技 ✅
- FLAG 累积无阻断：BUNKER FLAG 进入 GALAXY 后，除 conquest_declared 参与 CONQUEST 竞争外无 reqNotFlag 读取阻断推进（AR-5 在 GALAXY 无影响）✅
- ZERO_HOMER_CONTACTED 互斥锁：一旦设置，除 HIDDEN 外其他 4 条胜利路径全部被锁死 ✅
- 宇宙重启理论科技存在：TecTreeManager.ts:157 确认节点存在（归零者研究→宇宙重启理论）✅

### 3. 哪些问题已确认

| 问题 ID | 等级 | 问题 |
|---|---|---|
| AR-34 | P2 | 罗辑死亡发言（great_filter_confrontation filteredEvent） |
| AR-35 | P2 | 5 个死 FLAG 群（galaxy_era_declared / return_to_home / cautious_return / great_filter_silence / great_filter_contact） |
| AR-36 | P3 | zero_homer_contacted / mini_universe_built 双写（可维护性） |
| AR-37 | P3 | dimensional_strike 旁路入口 + DEFEAT 兜底竞态（条件性） |
| AR-38 | P3 | 刘慈欣死亡与 BUNKER 报告"存活"描述不符（文档修正） |
| AR-39 | P3 | 6 个 filteredEvent minYear 语义冗余 |
| AR-40 | P2 | dialogQueue vs dialogNodes 不匹配，filteredEvent 完全跳过人物存活检查（系统性架构缺陷） |
| AR-41 | P3 | ALIAN_ALLIANCE 基线拼写错误（文档修正） |

共 8 项正式问题：0 项 P1，3 项 P2，5 项 P3。

### 4. 哪些问题仍未确认

| 编号 | 问题 | 尚缺证据 |
|---|---|---|
| UC-15 | GALAXY 期间 culture 增长是否足够达到 2500 | 需 Autoplay500 运行观察 GALAXY 期间 culture 实际增长 |
| UC-16 | treachery 跨纪元累积是否在 GALAXY 触发 DEFEAT_TREACHERY | 依赖 UC-14（BUNKER 末 treachery 值），需 Autoplay500 运行观察 |

### 5. 是否允许进入下一纪元审计

**允许**，附带条件：

- **AR-20（bunker_world_completed 循环依赖）是 GALAXY 纪元入口的继承性断裂点**，导致 GALAXY 在正常路径下不可达。GALAXY 审计基于静态代码分析，无法通过运行时验证正常路径。修复 AR-20 后需重新验证 GALAXY 入口可达性。
- **GALAXY→STARDUST 出口条件性闭合**：FLAG 闭合，但 culture≥2500 可能不足（UC-15）。后续 STARDUST 纪元审计可基于条件性闭合验证（假设 AR-20 修复 + culture 增长足够后能进入 STARDUST）。
- **UC-15（culture 增长不足）应在 STARDUST 纪元审计中持续观察**：STARDUST 入口 CG 回调 culture+300，可能缓解 culture 不足问题，但需验证 STARDUST 内部 minCulture/maxCulture。
- **UC-16（treachery 跨纪元累积）应在 STARDUST 纪元审计中持续观察**：若 GALAXY 末 treachery 仍较高，STARDUST 中可能触发 DEFEAT_TREACHERY。
- **AR-34（罗辑死亡发言）已确认**：GALAXY 中罗辑死亡，great_filter_confrontation 仍以罗辑为 speaker。STARDUST 中罗辑仍死亡，需复核是否继续作为 speaker。
- **AR-40（filteredEvent 跳过人物存活检查）是系统性架构缺陷**：影响所有纪元的 filteredEvent，STARDUST 纪元审计中应继续观察。
- **AR-5（FLAG 永久累积）持续**：GALAXY 写入 11 个 FLAG（5 死 + 6 活），累积持续增长进入 STARDUST。

### 6. 上游接口复核结论

**掩体纪元报告末尾列出的 9 项 BUNKER→GALAXY 接口复核项**：

| 复核项 | 上游状态 | 本纪元结论 |
|---|---|---|
| 1. 纪元出口条件 | ✅ 闭合 | **已复核**：culture≥1200 + galaxy_exodus_seen（或 dimensional_strike）→ Game.ts:775 门控通过。galaxy_exodus_seen 由 year=365 BUNKER 事件写入；dimensional_strike 由 year=350 BUNKER 事件写入。出口闭合 |
| 2. 状态传递（FLAG 累积） | ⚠️ 待复核 | **已复核**：galaxy_exodus_seen 被 GALAXY 事件广泛读取（events.json year=370/405/420 reqFlag + filteredEvent reunion_homeworld/great_filter_confrontation reqFlag）；dimensional_strike 仅被入口门控读取；dark_domain_decision/digital_ark_upgrade/wandering_completed 被胜利条件读取；6 个死 FLAG（pluto_museum/solar_system_flattened/wade_coup/wade_executed/wade_succeeded + AR-29 继承）无 GALAXY 消费者 |
| 3. 人物死亡 | ⚠️ 待复核 | **已复核**：罗辑在 GALAXY 死亡（epochDeathMap["罗辑"]=["GALAXY"]），filteredEvent great_filter_confrontation 仍以罗辑为 speaker（AR-34）；刘慈欣也在 GALAXY 死亡（epochDeathMap["刘慈欣"]=["GALAXY"]），与 BUNKER 报告"存活"描述不符（AR-38）；维德仍死亡（继承）；程心/云天明/智子/艾AA/关一帆存活 |
| 4. galaxy_exodus_seen / dimensional_strike FLAG | ⚠️ 待复核 | **已复核**：galaxy_exodus_seen 被 GALAXY 事件广泛读取（reqFlag）；dimensional_strike 仅被入口门控读取，GALAXY 事件不读取 dimensional_strike 作为 reqFlag/reqNotFlag |
| 5. dimensionStrikeTriggered 字段 | ⚠️ 待复核 | **已复核**：AR-33 双系统独立持续。events.json year=350 仅写 dimensional_strike FLAG 不写 dimensionStrikeTriggered 字段。GALAXY 中 DEFEAT 条件 (year>350 || dimensionStrikeTriggered) 因 year≥370 必然满足 year>350 → DEFEAT 兜底生效（除非有逃生科技/FLAG，AR-37 条件性风险） |
| 6. swordholder 字段 | ⚠️ 待复核 | **已复核**：罗辑路线 swordholder="罗辑"进入 GALAXY。Game.ts:704-712 罗辑死亡时 swordholder 被清除为 null。swordholder=null 后 deterrenceEnduranceRounds 不再累积（Game.ts:651 else 分支 reset 为 0）。AR-31 死累积问题在 GALAXY 自然消解（罗辑死亡清空 swordholder） |
| 7. conquest_declared FLAG | ⚠️ 待复核 | **已复核**：CONQUEST 胜利 allowedEras=[BROADCAST,BUNKER,GALAXY,STARDUST]。若玩家在 BROADCAST/BUNKER 触发 conquest_declared，进入 GALAXY 后 CONQUEST 胜利条件仍可竞争（需 isAllCiviConquered 满足）。但 ZERO_HOMER_CONTACTED 互斥锁一旦设置，CONQUEST 被 reqNotFlag 阻断 |
| 8. culture 值 | ⚠️ 待复核 | **已复核**：GALAXY minCulture=1200, maxCulture=2499（epochs.json）。STARDUST 需 2500。GALAXY 事件 culture 增长 +340~710，可能不足以达到 2500（UC-15）。GALAXY filteredEvent minCulture 上限 90（相对值） |
| 9. treachery 跨纪元 | ⚠️ 待复核 | **已复核**：DEFEAT_TREACHERY（treachery≥100）在 GALAXY 全程生效，无纪元门控。若 BUNKER year=340 +50 未触发 DEFEAT（UC-14），进入 GALAXY 后 treachery 仍可能≥100（UC-16）。GALAXY 无新增 treachery 事件 |

### 7. 相邻纪元仍需复核的接口

**下游接口：GALAXY → STARDUST**

| 复核项 | 当前状态 | 待验证内容 |
|---|---|---|
| 纪元出口条件 | ⚠️ 条件性闭合 | culture≥2500 + stardust_era_declared（或 zero_homer_contacted）→ Game.ts:776 门控通过。stardust_era_declared 由 year=420 GALAXY 事件写入；zero_homer_contacted 由 year=400 GALAXY 事件写入。FLAG 闭合，但 culture≥2500 可能不足（UC-15）。修复 AR-20 后需运行时验证 |
| 状态传递（FLAG 累积） | ⚠️ 待复核 | galaxy_exodus_seen / zero_homer_contacted / mini_universe_built / stardust_era_declared / alien_alliance / alien_diplomacy_seen 等 FLAG 累积进入 STARDUST，需复核哪些 FLAG 影响 STARDUST 事件（注：5 个死 FLAG galaxy_era_declared/return_to_home/cautious_return/great_filter_silence/great_filter_contact 已确认为死 FLAG AR-35） |
| 人物死亡 | ⚠️ 待复核 | 进入 STARDUST 后需复核 epochDeathMap 中哪些人物在 STARDUST 死亡。GALAXY 存活 5 人（程心/云天明/智子/艾AA/关一帆）在 STARDUST 的存活状态需确认。罗辑/刘慈欣在 GALAXY 已死亡，STARDUST 中仍死亡 |
| stardust_era_declared / zero_homer_contacted FLAG | ⚠️ 待复核 | STARDUST 门控 FLAG，进入 STARDUST 时至少一个已设置。需复核 STARDUST 事件是否读取这些 FLAG 作为 reqFlag/reqNotFlag。注意 STARDUST 入口 CG 回调 addFlag(STARDUST_ERA_ACTIVE) |
| dimensionStrikeTriggered 字段 | ⚠️ 待复核 | AR-33 双系统独立持续。GALAXY 中 DEFEAT 因 year>350 触发（非 dimensionStrikeTriggered 字段）。需复核 STARDUST 是否依赖 dimensionStrikeTriggered 字段。STARDUST year≥420>350，DEFEAT 兜底持续生效（除非有逃生科技/FLAG） |
| swordholder 字段 | ⚠️ 待复核 | 罗辑路线 swordholder 在 GALAXY 已被清除为 null。需复核 STARDUST 是否依赖 swordholder 字段。deterrenceEnduranceRounds 在 GALAXY 已 reset 为 0（AR-31 自然消解） |
| conquest_declared FLAG | ⚠️ 待复核 | 若玩家在 BROADCAST/BUNKER/GALAXY 触发 conquest_declared，进入 STARDUST 后 CONQUEST 胜利条件仍 allowedEras 含 STARDUST。需复核 STARDUST 中 CONQUEST 竞争关系。注意 ZERO_HOMER_CONTACTED 互斥锁可能已阻断 CONQUEST |
| culture 值 | ⚠️ 待复核 | 进入 STARDUST 需 culture≥2500（可能不足 UC-15）。STARDUST 入口 CG 回调 culture+300。需复核 STARDUST 纪元 minCulture/maxCulture 及 culture 增长速率 |
| treachery 跨纪元 | ⚠️ 待复核 | GALAXY 无新增 treachery 事件，但 UC-16 风险持续。若未触发 DEFEAT_TREACHERY 进入 STARDUST，需复核 STARDUST 中 treachery 是否继续增长或触发 DEFEAT |
| STARDUST 入口特殊处理 | ⚠️ 待复核 | Game.ts:889-895 STARDUST 入口 CG 回调：addFlag(STARDUST_ERA_ACTIVE) + culture+=300 + addHistory("【星屑遗泽】")。需复核此特殊处理是否影响 STARDUST 内部因果链 |

---

**AUDIT_REPORT_银河纪元 报告完成。未修改代码。**

**问题统计**：P1×0，P2×3，P3×5，未确认×2
**因果链状态**：内部闭合 + 出口条件性闭合，入口继承 AR-20 断裂（基于静态代码分析验证）
**上游接口**：9 项全部复核（含 3 项新发现问题：AR-34 罗辑死亡发言 + AR-37 dimensional_strike 旁路 DEFEAT 竞态 + AR-40 filteredEvent 跳过人物存活检查系统性缺陷）
**跨纪元问题持续追踪**：AR-5（FLAG 永久累积，GALAXY 写入 11 个 FLAG 5 死）/ AR-7（Flag 引用漂移，无新增漂移）/ UC-1（treachery 爆发，GALAXY 无新增 treachery 事件，UC-16 风险持续）/ UC-2（顺序风险，GALAXY 事件 year 顺序正确 370→400→405→420）
**下一纪元审计**：允许进入星屑纪元（STARDUST），附带 10 项接口复核
