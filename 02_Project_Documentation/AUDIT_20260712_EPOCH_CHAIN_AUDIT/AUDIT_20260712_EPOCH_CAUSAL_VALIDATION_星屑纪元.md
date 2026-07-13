# `EPOCH_CAUSAL_VALIDATION_星屑纪元`

> 纪元：星屑纪元（STARDUST, epoch=6）
> 阶段：反例审计 + 因果链闭合验证
> 证据截止：20260712
> 引用文档：EPOCH_AUDIT_MODEL_星屑纪元、EPOCH_EVIDENCE_星屑纪元

---

## 一、反例路径验证

### V-1：STARDUST_ERA_ACTIVE 是否真的无消费者？

**反例假设**：可能存在间接消费者（如 UI 组件、统计系统、SliceNarrativeEngine）。

**验证过程**：
1. 全量 Grep 搜索 `stardust_era_active|STARDUST_ERA_ACTIVE`：
   - GameFlags.ts:18：`STARDUST_ERA_ACTIVE: 'stardust_era_active'`（定义）
   - Game.ts:907：`this.addFlag(FLAG.STARDUST_ERA_ACTIVE)`（写入）
2. 无其他匹配 —— 0 读取点

**结论**：反例**不成立**。STARDUST_ERA_ACTIVE 确认为死 FLAG（仅写入无读取）。问题确认为 **AR-42**（AR-29/AR-35 同类）。

---

### V-2：STARDUST_ERA_SEEN 是否真的无写入点？

**反例假设**：可能存在间接写入点（如入口处理、CG 回调、事件）。

**验证过程**：
1. 全量 Grep 搜索 `stardust_era_seen|STARDUST_ERA_SEEN`：
   - GameFlags.ts:17：`STARDUST_ERA_SEEN: 'stardust_era_seen'`（定义）
   - Game.ts:792：`!this.flagManager.isSet(FLAG.STARDUST_ERA_SEEN)`（读取，门控）
2. 无其他匹配 —— 0 写入点
3. 入口 CG 回调（Game.ts:906-910）写入 STARDUST_ERA_ACTIVE，不写 STARDUST_ERA_SEEN
4. events.json 中无 stardust_era_seen 的 effects 写入

**结论**：反例**不成立**。STARDUST_ERA_SEEN 确认为死 FLAG（无写入，OR 关系不影响入口，因 stardust_era_declared 和 zero_homer_contacted 可用）。问题确认为 **AR-43**。

---

### V-3：timeline.json 是否真的无"星屑"条目？

**反例假设**：可能 timeline.json 中有包含"星屑"的条目但使用了不同的键名。

**验证过程**：
1. 全量读取 timeline.json：仅 6 个条目，最后一个为"银河纪元 / 黑域纪元"（gameYearRange [351, 999]）
2. Game.ts:831：`epochName === "星屑纪元" && t.epoch.includes("星屑")` 查找
3. timeline.json 中无任何条目的 epoch 字段包含"星屑"
4. 查找失败 → `timelineEntry` 为 undefined → 不推送 tickerMessage

**结论**：反例**不成立**。timeline.json 确认无"星屑"条目。问题确认为 **AR-44**（UI 缺失，STARDUST 纪元无 timeline 描述显示）。

---

### V-4：STARDUST 纪元是否真的无任何事件？

**反例假设**：可能存在跨纪元事件（如 epoch 字段含 "STARDUST"）或动态生成的事件。

**验证过程**：
1. events.json 全量 Grep `STARDUST`：0 匹配
2. GameEventManager.ts 全量 Grep `STARDUST`：仅 epochNames 数组（3 处），无 filteredEvent 定义
3. randomevents.json 全量 Grep `STARDUST`：0 匹配（所有随机事件 epoch 字段最多到 GALAXY）
4. checkEvents / getFilteredEventsForTurn / checkRandomEvents 在 STARDUST 纪元均返回空

**结论**：反例**不成立**。STARDUST 纪元确认无任何事件。降级为观察项（终局纪元设计合理，玩家通过结局退出）。

---

### V-5：STARDUST 纪元 DEFEAT 兜底是否真的持续生效？

**反例假设**：可能存在 STARDUST 纪元特有的 DEFEAT 豁免逻辑。

**验证过程**：
1. DEFEAT 兜底条件（Game.ts:1281）：`(this.year > 350 || this.dimensionStrikeTriggered)`
2. STARDUST year≥420 > 350 → 条件必然满足
3. 检查逃生路径（Game.ts:1282-1286）：
   - 黑域生成完成 → 豁免
   - 数字方舟完成 → 豁免
   - DIMENSIONAL_DEFENSE FLAG → 豁免
   - DIMENSIONAL_DEFENSE_COMPLETED FLAG → 豁免
   - WANDERING_COMPLETED FLAG → 豁免
4. 无 STARDUST 纪元特有的 DEFEAT 豁免逻辑
5. 若玩家无任何逃生科技/FLAG → DEFEAT_DIMENSION_STRIKE 触发

**结论**：反例**成立**。STARDUST 纪元 DEFEAT 兜底确认为持续生效。问题确认为 **AR-45**（AR-37 同类条件性风险）。

---

### V-6：HIDDEN 结局在 STARDUST 是否可达？

**反例假设**：HIDDEN 结局可能因某些条件在 STARDUST 不可达。

**验证过程**：
1. HIDDEN 结局 allowedEras=[GALAXY, STARDUST]（Game.ts:945）→ STARDUST 允许
2. HIDDEN 条件（Game.ts:946-956）：
   - year≥350：STARDUST year≥420 > 350 ✅
   - epoch≥GALAXY：STARDUST=6 > GALAXY=5 ✅
   - culture≥1000：STARDUST 入口 culture≥2500 > 1000 ✅
   - galaxy_exodus_seen：继承 GALAXY ✅（若走正常路径）
   - alien_alliance：继承 GALAXY filteredEvent choice A ✅（若选择 A）
   - zero_homer_contacted：继承 GALAXY year=400 ✅
   - mini_universe_built：继承 GALAXY year=405 ✅
   - population>0：需运行时确认
   - deterrenceValue≥50：需运行时确认（GALAXY year=405 +10）
   - 黑域生成 + 数字方舟：需玩家完成科技研究
3. HIDDEN 在判定顺序中排第 1（胜利结局中最先）
4. DEFEAT 兜底在 HIDDEN 之后判定，若 HIDDEN 条件满足会先 return
5. HIDDEN 所需的 2 科技（黑域生成+数字方舟）也是 DEFEAT 逃生路径

**结论**：反例**不成立**。HIDDEN 在 STARDUST 中可达性更高（culture/year 条件自动满足）。只要玩家完成了所需科技并选择了正确的 FLAG 路径，HIDDEN 可触发。

---

### V-7：STARDUST 入口 culture+300 是否在门控之后执行？

**反例假设**：可能 culture+300 在门控之前执行，能帮助玩家达到 2500 门槛。

**验证过程**：
1. Game.ts:760-792：updateEpoch 函数先检查 culture 阈值和 FLAG 门控
2. Game.ts:794：`if (allowed)` → 仅在门控通过后执行入口处理
3. Game.ts:906-910：入口 CG 回调在入口处理中执行
4. 执行顺序：门控检查（792）→ allowed=true（794）→ 入口处理（798-915）→ CG 回调（906-910）
5. culture+300 在门控通过后执行，不参与门控判定

**结论**：反例**不成立**。culture+300 确认在门控之后执行。降级为观察项（设计合理，+300 用于纪元内文化加成而非入口门槛）。

---

### V-8：STARDUST 纪元是否有新增死亡？

**反例假设**：可能 epochDeathMap 中有包含 "STARDUST" 的人物但遗漏了。

**验证过程**：
1. 全量检查 epochDeathMap（GameEventManager.ts:937-991）所有人物的死亡数组
2. 所有人物死亡数组最大到 "GALAXY"，无任何数组包含 "STARDUST"
3. isPersonAliveInEpoch("任何人物", "STARDUST") → 检查死亡数组是否含 "STARDUST" → 全部返回 true（存活）
4. 但继承死亡的人物（如罗辑，死亡数组含 "GALAXY"）在 STARDUST 仍死亡（因为在 GALAXY 已设置 isAlive=false，STARDUST 中不会复活）

**结论**：反例**不成立**。STARDUST 纪元确认无新增死亡。降级为观察项（终局纪元设计合理）。

---

## 二、因果链闭合验证

### 正向因果链验证

```
[GALAXY 末] culture≥2500 + stardust_era_declared（或 zero_homer_contacted）
  → Game.ts:792 门控通过 ✅
  → 推进 STARDUST
  → Game.ts:702-706 无新增死亡（epochDeathMap 无 STARDUST）✅
  → Game.ts:816 下载 stardust_era 资源包 ✅
  → Game.ts:849 设置 stardust_era_deep Tag ✅
  → Game.ts:877 CG 文案"大宇宙的结构在战争中进一步降维碎裂..." ✅
  → Game.ts:906-910 入口 CG 回调：
    - addFlag(STARDUST_ERA_ACTIVE)（死FLAG AR-42）✅
    - culture += 300 ✅
    - addHistory("【星屑遗泽】") ✅
  → 每回合标准逻辑：
    - 资源/人口增长 ✅
    - 异星文明威胁 ✅
    - checkEvents / getFilteredEventsForTurn / checkRandomEvents → 均返回空 ✅
    - checkVictoryConditions → 检查 11 种结局 ✅
  → 结局触发 → 游戏结束 ✅（终局纪元，无下游推进）
```

### 入口闭合性

**入口闭合** ✅：
- stardust_era_declared 由 GALAXY year=420 事件写入
- zero_homer_contacted 由 GALAXY year=400 事件写入
- 两个 FLAG 满足其一即可通过 Game.ts:792 门控
- culture≥2500 可能不足（UC-17 继承），但可停滞等待自然增长

### 内部因果链闭合性

**内部因果链闭合** ✅：
- STARDUST 纪元无事件，无内部因果链
- 每回合仅执行标准逻辑 + 结局判定
- 无循环依赖、无事件竞争

### 出口闭合性

**出口闭合** ✅：
- STARDUST 是最后一个纪元，无下游推进出口
- 11 种结局均可触发
- 结局判定顺序明确，互斥逻辑完整

### 结局退出路径闭合性

**结局退出路径闭合** ✅：
- 5 种胜利结局（HIDDEN/WANDERING/DIGITAL/CONQUEST/DARK_DOMAIN）均可触发
- 2 种中性结局（ETERNAL_EXILE/COSMIC_SILENCE）均可触发
- 4 种失败结局（TREACHERY/EXTINCTION/DIMENSION_STRIKE/HELIUM_FLASH）均可触发
- 判定顺序明确，互斥逻辑完整
- HIDDEN 在判定顺序上优先于 DEFEAT 兜底，且 HIDDEN 所需科技也是 DEFEAT 逃生路径

---

## 三、反例验证汇总

| 反例 ID | 假设 | 结论 | 正式问题 |
|---|---|---|---|
| V-1 | STARDUST_ERA_ACTIVE 有间接消费者 | 不成立 | AR-42 |
| V-2 | STARDUST_ERA_SEEN 有间接写入点 | 不成立 | AR-43 |
| V-3 | timeline.json 有"星屑"条目 | 不成立 | AR-44 |
| V-4 | STARDUST 有跨纪元事件 | 不成立 | 降级（设计观察） |
| V-5 | STARDUST 有 DEFEAT 豁免逻辑 | 成立（DEFEAT 持续生效） | AR-45 |
| V-6 | HIDDEN 在 STARDUST 不可达 | 不成立（可达性更高） | 降级 |
| V-7 | culture+300 在门控前执行 | 不成立 | 降级（设计合理） |
| V-8 | STARDUST 有新增死亡 | 不成立 | 降级（设计合理） |

---

## 四、因果链状态总结

| 维度 | 状态 | 说明 |
|---|---|---|
| 入口闭合 | ✅ | stardust_era_declared / zero_homer_contacted 由 GALAXY 事件写入 |
| 内部因果链 | ✅ | 无事件，无内部因果链需要验证 |
| 出口闭合 | ✅ | 终局纪元，11 种结局均可触发 |
| 结局退出 | ✅ | 判定顺序明确，互斥逻辑完整 |
| 继承断裂 | AR-20 继承 | GALAXY 入口继承 AR-20（正常路径不可达），本审计基于静态代码分析 |

---

**EPOCH_CAUSAL_VALIDATION_星屑纪元 验证完成。未修改代码。**

**反例验证**：8 项（5 项不成立 + 1 项成立 + 2 项降级）
**正式问题**：4 项（AR-42~AR-45）
**未确认项**：2 项（UC-17, UC-18）
**因果链状态**：入口闭合 + 内部闭合 + 出口闭合（终局纪元），入口继承 AR-20 断裂
