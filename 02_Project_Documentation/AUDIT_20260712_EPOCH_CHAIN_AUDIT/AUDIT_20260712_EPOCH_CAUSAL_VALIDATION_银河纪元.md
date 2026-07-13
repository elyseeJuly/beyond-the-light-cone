# `EPOCH_CAUSAL_VALIDATION_银河纪元`

> 纪元：银河纪元（GALAXY, epoch=5）
> 阶段：反例审计 + 因果链闭合验证
> 证据截止：20260712
> 引用文档：EPOCH_AUDIT_MODEL_银河纪元、EPOCH_EVIDENCE_银河纪元

---

## 一、反例路径验证

### V-1：filteredEvent great_filter_confrontation 是否因罗辑死亡而无法触发？

**反例假设**：罗辑在 GALAXY 死亡，`isEventCharactersUnlocked` 会阻止该事件触发。

**验证过程**：
1. `isEventCharactersUnlocked`（GameEventManager.ts:994-1033）检查 `e.dialogNodes`
2. filteredEvent 使用 `dialogQueue` 属性（GameEventManager.ts:610），不是 `dialogNodes`
3. `getFilteredEventsForTurn`（GameEventManager.ts:723-742）不调用 `isEventCharactersUnlocked`
4. 即使调用，`e.dialogNodes` 为 undefined → 跳过检查

**结论**：反例**不成立**。`great_filter_confrontation` 会正常触发，罗辑作为死亡人物发言。问题确认为 **AR-34**（AR-27 同类）。

---

### V-2：5 个死 FLAG 是否真的无消费者？

**反例假设**：可能存在间接消费者（如图片映射、UI 组件、统计系统）。

**验证过程**：
1. 全量 Grep 搜索 `galaxy_era_declared`：仅 events.json:1623（写入），0 读取
2. 全量 Grep 搜索 `return_to_home`：仅 GameEventManager.ts:588（写入），0 读取
3. 全量 Grep 搜索 `cautious_return`：仅 GameEventManager.ts:589（写入），0 读取
4. 全量 Grep 搜索 `great_filter_silence`：仅 GameEventManager.ts:616（写入），0 读取
5. 全量 Grep 搜索 `great_filter_contact`：仅 GameEventManager.ts:617（写入），0 读取

**结论**：反例**不成立**。5 个 FLAG 确认为死 FLAG。问题确认为 **AR-35**（AR-29 同类）。

---

### V-3：zero_homer_contacted 双写是否导致功能异常？

**反例假设**：events.json year=400 和 filteredEvent zero_homer_contact_event 同时写入可能导致重复触发或数据不一致。

**验证过程**：
1. events.json year=400 事件（行 1520）写入 `zero_homer_contacted`
2. filteredEvent `zero_homer_contact_event`（GameEventManager.ts:674）也写入 `zero_homer_contacted`
3. filteredEvent 条件 `reqNotFlag: zero_homer_contacted`（行 673）—— 若 events.json 先写入，filteredEvent 不再触发
4. FlagManager.set 已存在时不产生副作用（Set.add 幂等）
5. 两条路径功能等价（都设置同一 FLAG），无数据不一致

**结论**：反例**不成立**（不导致功能异常）。但双写增加维护成本，确认为 **AR-36**（AR-32 同类）。

---

### V-4：HIDDEN 结局是否因 year>350 DEFEAT 兜底而不可达？

**反例假设**：HIDDEN 需 year≥350，DEFEAT 兜底 year>350，HIDDEN 窗口极窄或不可达。

**验证过程**：
1. checkVictoryConditions 判定顺序（Game.ts:1089-1310）：
   - 步骤 2（行 1149-1179）：遍历 getVictoryConditions()，HIDDEN 排第 1
   - 步骤 7（行 1265-1309）：DEFEAT_DIMENSION_STRIKE / HELIUM_FLASH
2. HIDDEN 在 DEFEAT 之前判定，若 HIDDEN 条件满足会先 return
3. HIDDEN 需要黑域生成 + 数字方舟两个科技（Game.ts:939-940）
4. DEFEAT 兜底逃生路径包含黑域生成 + 数字方舟（Game.ts:1267-1268）
5. 走 HIDDEN 路线的玩家，科技完成后 DEFEAT 兜底条件不满足（!isTecFinishedAnywhere("黑域生成") 为 false）

**结论**：反例**不成立**。HIDDEN 在判定顺序上优先于 DEFEAT，且 HIDDEN 所需科技也是 DEFEAT 逃生路径。HIDDEN 可达。C-4 降级为观察项。

---

### V-5：dimensional_strike 旁路入口是否导致立即 DEFEAT？

**反例假设**：通过 dimensional_strike FLAG 进入 GALAXY（year≥370），DEFEAT 条件 year>350 必然满足，导致立即 DEFEAT。

**验证过程**：
1. GALAXY 入口门控（Game.ts:775）：`galaxy_exodus_seen || dimensional_strike`
2. 若玩家仅有 dimensional_strike（无 galaxy_exodus_seen），说明 BUNKER year=350 二向箔打击事件触发
3. 进入 GALAXY 时 year≥370 > 350 → DEFEAT 条件 `year>350` 满足
4. DEFEAT 兜底检查逃生路径（Game.ts:1265-1270）：
   - 黑域生成完成？数字方舟完成？DIMENSIONAL_DEFENSE？DIMENSIONAL_DEFENSE_COMPLETED？WANDERING_COMPLETED？
5. 若玩家无任何逃生科技/FLAG → DEFEAT_DIMENSION_STRIKE 触发
6. 若玩家有逃生科技/FLAG → DEFEAT 不触发，可继续游戏

**结论**：反例**条件性成立**。仅在玩家无逃生科技/FLAG 时触发 DEFEAT。确认为 **AR-37**（P3，条件性风险）。

---

### V-6：刘慈欣是否真的在 GALAXY 死亡？

**反例假设**：BUNKER 报告列刘慈欣为存活，可能 epochDeathMap 数据有误。

**验证过程**：
1. GameEventManager.ts:989：`"刘慈欣": ["GALAXY"]`
2. 注释（行 985）："刘慈欣宇宙联动人物，默认活到较后"
3. BUNKER 报告第七节列"刘慈欣存活"
4. `isPersonAliveInEpoch("刘慈欣", "GALAXY")` → `["GALAXY"].includes("GALAXY")` → true → 返回 false（死亡）

**结论**：反例**不成立**（epochDeathMap 数据正确）。刘慈欣确实在 GALAXY 死亡。BUNKER 报告描述有误。确认为 **AR-38**（文档修正）。

---

### V-7：filteredEvent minYear 是否真的冗余？

**反例假设**：minYear 可能在更早纪元有意义（如 BUNKER 末尾 year<370 时）。

**验证过程**：
1. GALAXY 起始 year≥370（从 BUNKER 推进，BUNKER year≥280 + culture 增长至 1200）
2. 6 个 filteredEvent minYear：200/220/260/280/300/350
3. 所有 minYear < 370 → 在 GALAXY 纪元内 year 永远 > minYear
4. minYear 约束由 epoch:"GALAXY" + minCulture/reqFlag/minDeterrence 实际提供

**结论**：反例**不成立**。minYear 在 GALAXY 纪元内冗余。确认为 **AR-39**（AR-30 同类）。

---

### V-8：dialogQueue vs dialogNodes 不匹配是否影响所有 filteredEvent？

**反例假设**：可能 FilteredEventPayload 类型将 dialogQueue 映射到 dialogNodes。

**验证过程**：
1. GameEvent.ts:34：`dialogNodes: DialogNode[]`（GameEvent 接口属性）
2. FilteredEventPayload 使用 `dialogQueue`（GameEventManager.ts:610）
3. `isEventCharactersUnlocked`（GameEventManager.ts:1009）：`if (e.dialogNodes)` —— 检查的是 dialogNodes
4. FilteredEventPayload 无 dialogNodes 属性 → `e.dialogNodes` 为 undefined → 跳过整个 for 循环
5. 影响范围：所有 filteredEvent（29 条）都不经过 speaker 存活检查

**结论**：反例**不成立**（不匹配确实影响所有 filteredEvent）。确认为 **AR-40**（架构问题）。

---

### V-9：ALIAN_ALLIANCE 拼写错误是否影响功能？

**反例假设**：基线文档的 ALIAN_ALLIANCE 拼写可能被代码引用，导致 HIDDEN 结局不可达。

**验证过程**：
1. 基线 AUDIT_20260712_BASELINE.md:297 使用 `ALIAN_ALLIANCE`（拼写错误）
2. 代码 GameFlags.ts:40：`ALIEN_ALLIANCE: 'alien_alliance'`（正确拼写）
3. Game.ts:935：`this.hasFlag(FLAG.ALIEN_ALLIANCE)` —— 使用常量，不受基线文档影响
4. GameEventManager.ts:574：`target: "alien_alliance"` —— 字符串匹配正确

**结论**：反例**不成立**（不影响功能）。拼写错误仅存在于审计文档中，不影响代码运行。确认为 **AR-41**（文档修正）。

---

### V-10：culture 增长是否足以达到 STARDUST 阈值 2500？

**反例假设**：GALAXY 事件 culture 增长 +340~710，从 1200 到 2500 差 1300，可能不足。

**验证过程**：
1. GALAXY 事件 culture 增长：+340（最低）~ +710（最高）
2. 每回合自然增长公式（project_memory）：`2 + social×0.10`（基础）
3. GALAXY year 范围 370~420（约 50 回合）
4. 假设 social=50（中等）：每回合 +7，50 回合 +350
5. 总增长估算：+340+350=690（最低）~ +710+350=1060（最高）
6. 从 1200 增长：1200+690=1890 ~ 1200+1060=2260
7. STARDUST 需 2500 —— **可能不足**

**结论**：反例**条件性成立**。若玩家 social 较低或事件选择不选 culture 加成选项，可能无法达到 2500。但 STARDUST 入口门控 FLAG（zero_homer_contacted）在 year=400 必然设置，culture 不足时设 EPOCH_STALLED 停滞，不推进。确认为 **UC-15**（需运行时验证）。

---

## 二、因果链闭合验证

### 正向因果链验证

```
[BUNKER 末] culture≥1200 + galaxy_exodus_seen（或 dimensional_strike）
  → Game.ts:775 门控通过 ✅
  → 推进 GALAXY
  → Game.ts:702-706 罗辑/刘慈欣死亡 ✅
  → Game.ts:710-712 swordholder=null（罗辑路线）✅
  → year=370 银河纪元宣告 → galaxy_era_declared（死FLAG）+ culture+60 ✅
  → filteredEvent galaxy_era_exodus → galaxy_exodus_seen（可能已在 BUNKER 写入）✅
  → filteredEvent alien_civilization_diplomacy → alien_diplomacy_seen + alien_alliance（choice A）✅
  → filteredEvent great_filter_confrontation → great_filter_silence/contact（死FLAG）
    ⚠️ 罗辑死亡发言（AR-34），但事件仍触发 ✅
  → filteredEvent reunion_homeworld → return_to_home/cautious_return（死FLAG）✅
  → year=400 归零者播报 → zero_homer_contacted + culture+100 ✅
  → year=405 小宇宙对接 → mini_universe_built + culture+80 + deterrenceValue+10 ✅
  → year=420 星屑纪元宣告 → stardust_era_declared + culture+100 ✅
  → culture≥2500 + stardust_era_declared（或 zero_homer_contacted）
    ⚠️ culture 可能不足（UC-15）
  → 推进 STARDUST ✅（条件性闭合）
```

### 入口闭合性

**入口闭合** ✅：
- galaxy_exodus_seen 由 BUNKER year=365 事件写入
- dimensional_strike 由 BUNKER year=350 事件写入
- 两个 FLAG 满足其一即可通过 Game.ts:775 门控

### 内部因果链闭合性

**内部因果链闭合** ✅：
- events.json 事件按 year 顺序触发（370→400→405→420）
- filteredEvent 通过 reqFlag/reqNotFlag 形成依赖链
- galaxy_exodus_seen → reunion_homeworld/great_filter_confrontation（reqFlag）
- zero_homer_contacted → mini_universe_build_event（reqFlag）
- 无循环依赖

### 出口闭合性

**出口条件性闭合** ⚠️：
- STARDUST 门控 FLAG（stardust_era_declared / zero_homer_contacted）可由 GALAXY 事件写入 ✅
- culture≥2500 可能不足（UC-15）⚠️
- 若 culture 不足，设 EPOCH_STALLED 停滞，不推进但不阻断

### 结局退出路径闭合性

**结局退出路径闭合** ✅：
- 5 种胜利结局（HIDDEN/WANDERING/DIGITAL/CONQUEST/DARK_DOMAIN）均可触发
- 2 种中性结局（ETERNAL_EXILE/COSMIC_SILENCE）均可触发
- 4 种失败结局（TREACHERY/EXTINCTION/DIMENSION_STRIKE/HELIUM_FLASH）均可触发
- 判定顺序明确，互斥逻辑完整

---

## 三、反例验证汇总

| 反例 ID | 假设 | 结论 | 正式问题 |
|---|---|---|---|
| V-1 | great_filter 因罗辑死亡无法触发 | 不成立（事件触发，但死亡发言） | AR-34 |
| V-2 | 5 个死 FLAG 有间接消费者 | 不成立 | AR-35 |
| V-3 | 双写导致功能异常 | 不成立（但维护成本） | AR-36 |
| V-4 | HIDDEN 因 DEFEAT 不可达 | 不成立（判定顺序+科技双豁免） | 降级 |
| V-5 | dimensional_strike 入口导致立即 DEFEAT | 条件性成立（无逃生科技时） | AR-37 |
| V-6 | 刘慈欣死亡数据有误 | 不成立（数据正确，BUNKER 报告有误） | AR-38 |
| V-7 | minYear 有实际意义 | 不成立 | AR-39 |
| V-8 | dialogQueue/dialogNodes 有映射 | 不成立（影响所有 filteredEvent） | AR-40 |
| V-9 | ALIAN_ALLIANCE 影响功能 | 不成立（仅文档拼写错误） | AR-41 |
| V-10 | culture 不足达到 2500 | 条件性成立 | UC-15 |

---

## 四、因果链状态总结

| 维度 | 状态 | 说明 |
|---|---|---|
| 入口闭合 | ✅ | galaxy_exodus_seen / dimensional_strike 由 BUNKER 事件写入 |
| 内部因果链 | ✅ | 事件按 year 顺序 + reqFlag 依赖链完整 |
| 出口闭合 | ⚠️ 条件性 | FLAG 闭合，culture 可能不足（UC-15） |
| 结局退出 | ✅ | 11 种结局均可触发，判定顺序明确 |
| 继承断裂 | AR-20 继承 | BUNKER 入口继承 AR-20（正常路径不可达），本审计基于静态代码分析 |

---

**EPOCH_CAUSAL_VALIDATION_银河纪元 验证完成。未修改代码。**

**反例验证**：10 项（7 项不成立 + 2 项条件性成立 + 1 项降级）
**正式问题**：8 项（AR-34~AR-41）
**未确认项**：1 项（UC-15）
**因果链状态**：内部闭合 + 出口条件性闭合，入口继承 AR-20 断裂
