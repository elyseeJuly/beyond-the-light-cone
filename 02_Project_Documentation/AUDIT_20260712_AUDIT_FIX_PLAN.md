# `AUDIT_FIX_PLAN`

> 来源：AUDIT_20260712_AUDIT_REPORT_危机纪元～星屑纪元（6 份）+ CROSS_EPOCH_AUDIT
> 原则：按根因合并，避免同一系统性问题在多个纪元重复修复
> 约束：本阶段不修改代码，仅制定计划，等待正式实施指令

---

## 修复任务总览

| 任务 ID | 优先级 | 类型 | 根因 | 关联问题数 |
|---|---|---|---|---|
| FIX-01 | P0 | 跨纪元系统性 | SYS-1 循环依赖 | 4（AR-1/10/20/21） |
| FIX-02 | P1 | 跨模块 | AR-28 黑域事件不可达 | 1 |
| FIX-03 | P1 | 跨模块 | AR-11 swordholder 路径分裂 | 1 |
| FIX-04 | P2 | 跨纪元系统性 | SYS-4 FLAG 永久累积 | 1（AR-5） |
| FIX-05 | P2 | 跨纪元系统性 | SYS-7 deterrenceEnduranceRounds 死累积 | 2（AR-26/31） |
| FIX-06 | P2 | 跨纪元系统性 | SYS-2 死 FLAG 群 | 9（AR-3/4/12/15/22/29/35/42/43） |
| FIX-07 | P2 | 跨纪元系统性 | SYS-3 filteredEvent 人物存活检查缺失 | 4（AR-8/27/34/40） |
| FIX-08 | P2 | 单点 | AR-2 year=1 时序倒置 | 1 |
| FIX-09 | P2 | 单点 | AR-6 epochDeathMap 注释冲突 | 1 |
| FIX-10 | P2 | 单点 | AR-18 刘慈欣无解锁路径 | 1 |
| FIX-11 | P2 | 跨模块 | AR-7 FlagManager 引用漂移 | 1 |
| FIX-12 | P2 | 跨纪元系统性 | SYS-5 dimensionStrikeTriggered 双系统 | 3（AR-33/37/45） |
| FIX-13 | P2 | 跨模块 | SYS-6 调用顺序 | 1（AR-16） |
| FIX-14 | P3 | 跨模块 | AR-9 判定与预报逻辑分裂 | 1 |
| FIX-15 | P3 | 文档同步 | FLAG 双写清理 | 3 处 |
| FIX-16 | P3 | 文档同步 | 历史文档不一致 | 3 项 |
| FIX-17 | — | 测试补充 | 全链路回归测试 | 覆盖全部修复 |
| — | — | 暂不修复 | UC-1~UC-18 未确认项 | 18 |

**合计**：16 项修复任务 + 1 项测试补充 + 18 项暂不修复。

---

## 优先级 1：P0 流程阻断和结局漏洞

---

### FIX-01：循环依赖修复（SYS-1）

```text
修复任务 ID：FIX-01
关联问题：AR-1（eto_founded 不可达）、AR-10（coordinates_broadcasted 程心路线不可达）、AR-20（bunker_world_completed 循环依赖）、AR-21（程心路线二阶循环）
根因：事件 triggerCondition.epoch 标注为"目标纪元"（FLAG 应生效的纪元），但事件本身写入的 FLAG 是该纪元的入口门控。当前纪元无法触发该事件 → FLAG 永不写入 → 下一纪元无法进入。4 个问题共享同一根因：
  - AR-1: eto_founded 由 GOLDEN 纪元 year=-27 事件写入，CRISIS 纪元 year=2 事件 reqFlag 读取
  - AR-10: coordinates_broadcasted 由 BROADCAST 纪元事件写入，DETERRENCE 纪元门控读取
  - AR-20: bunker_world_completed 由 BUNKER 纪元事件写入，BROADCAST 纪元门控读取
  - AR-21: 程心路线 coordinates_broadcasted 写入事件 epoch=BROADCAST，但进入 BROADCAST 需该 FLAG
涉及文件：
  - src/data/events.json（4 个事件的 triggerCondition.epoch）
  - src/core/Game.ts:772-776（FLAG 门控逻辑，确认不改）
涉及函数或字段：
  - events.json 中 4 个事件的 triggerCondition.epoch 字段
  - Game.ts updateEpoch() 的 FLAG 门控（只读，不改）
修改边界：
  - 将 4 个事件的 triggerCondition.epoch 改为"当前纪元"（FLAG 写入时所在的纪元）
  - AR-1: year=-27 事件 epoch 改为 CRISIS（或新增 year=0 CRISIS 事件写入 eto_founded）
  - AR-10: coordinates_broadcasted 写入事件 epoch 改为 DETERRENCE
  - AR-20: bunker_world_completed 写入事件 epoch 改为 BROADCAST
  - AR-21: 程心路线 coordinates_broadcasted 写入事件 epoch 改为 DETERRENCE（与 AR-10 合并）
禁止修改范围：
  - 不修改 updateEpoch() 的 FLAG 门控逻辑
  - 不修改 epochs.json 的文化阈值
  - 不修改事件的 effects/reqFlag/reqTech 字段
  - 不修改年份（inYear）
预期行为：
  - 新游戏中 eto_founded 在 CRISIS 纪元写入，year=2 古筝行动可触发
  - 罗辑路线 coordinates_broadcasted 在 DETERRENCE 纪元写入，可进入 BROADCAST
  - 程心路线 coordinates_broadcasted 在 DETERRENCE 纪元写入，可进入 BROADCAST
  - bunker_world_completed 在 BROADCAST 纪元写入，可进入 BUNKER
  - 全链路 GOLDEN→CRISIS→DETERRENCE→BROADCAST→BUNKER→GALAXY→STARDUST 闭合
潜在副作用：
  - 事件触发时机变化（如 eto_founded 从 year=-27 改到 year=0+），需验证叙事时序
  - 程心路线与罗辑路线可能写入同一 FLAG，需确认互斥关系
  - BUNKER 纪元事件改为 BROADCAST 纪元后，BUNKER 纪元可能事件减少
需要新增或修改的测试：
  - 新增：新游戏中 eto_founded 可达性测试
  - 新增：全链路推进测试（CRISIS→DETERRENCE→BROADCAST→BUNKER→GALAXY→STARDUST）
  - 新增：罗辑路线与程心路线的 FLAG 互斥测试
  - 修改：现有纪元推进测试（更新预期事件触发年份）
回归范围：全链路纪元推进、所有结局可达性、所有事件触发时序
完成标准：
  - Autoplay500 可推进到 STARDUST 纪元
  - 所有 11 种结局在正常路径下可达
  - 无事件重复触发或永久跳过
```

---

## 优先级 2：P1 主线、纪元推进和关键状态问题

---

### FIX-02：黑域事件不可达修复（AR-28）

```text
修复任务 ID：FIX-02
关联问题：AR-28（黑域决策事件 events.json 路径不可达，仅 filteredEvent 路径可触发）
根因：events.json 中黑域决策事件的 triggerCondition 无法满足（具体原因待确认：可能是 reqFlag/epoch/year 冲突）
涉及文件：
  - src/data/events.json（黑域决策事件）
涉及函数或字段：
  - 事件的 triggerCondition（reqFlag/epoch/inYear）
修改边界：
  - 修正 triggerCondition 使事件可达
  - 或移除不可达的 events.json 事件（若 filteredEvent 路径已覆盖功能）
禁止修改范围：
  - 不修改 filteredEvent 的黑域决策逻辑
  - 不修改 DARK_DOMAIN 胜利判定逻辑
预期行为：黑域决策事件通过 events.json 或 filteredEvent 至少一条路径可达
潜在副作用：黑域决策触发时机可能变化
需要新增或修改的测试：黑域结局可达性测试
回归范围：DARK_DOMAIN 胜利路径、BUNKER 纪元事件触发
完成标准：黑域决策事件可触发，DARK_DOMAIN 胜利可达
```

---

### FIX-03：swordholder 路径分裂修复（AR-11）

```text
修复任务 ID：FIX-03
关联问题：AR-11（swordholder 任命存在两条路径：filteredEvent 强制 + events.json 可选，状态不一致）
根因：filteredEvent 在 Game.ts:433-443 强制任命 swordholder，events.json 也有 swordholder 任命事件，两条路径写入同一字段但时机/条件不同
涉及文件：
  - src/core/Game.ts:433-443（filteredEvent 强制任命）
  - src/data/events.json（swordholder 任命事件）
涉及函数或字段：
  - Game.ts appointmentSwordholder 相关逻辑
  - events.json swordholder_appointed FLAG 写入事件
修改边界：
  - 确认单一任命路径（建议保留 filteredEvent，移除 events.json 冗余任命）
  - 或将两条路径合并为条件互斥
禁止修改范围：
  - 不修改 SWORDHOLDER_APPOINTED FLAG 定义
  - 不修改 DETERRENCE 胜利判定逻辑
预期行为：swordholder 任命只有一条路径，状态一致
潜在副作用：swordholder 任命时机可能变化
需要新增或修改的测试：swordholder 任命测试
回归范围：DETERRENCE 胜利路径、swordholder 相关事件
完成标准：swordholder 任命路径唯一，无状态冲突
```

---

## 优先级 3：跨纪元共享字段与状态生命周期问题

---

### FIX-04：FLAG 清理机制（SYS-4 / AR-5）

```text
修复任务 ID：FIX-04
关联问题：AR-5（FLAG 永久累积无清理机制）
根因：纪元切换时（Game.ts:789-915）仅 unset EPOCH_STALLED，不清理任何其他 FLAG。FlagManager 无 clearAll/clearEpoch 方法
涉及文件：
  - src/core/Game.ts:789-915（updateEpoch 纪元入口处理）
  - src/core/FlagManager.ts（新增清理方法）
涉及函数或字段：
  - Game.ts updateEpoch() 纪元入口处理块
  - FlagManager 新增 clearEpochFlags(epoch) 方法
修改边界：
  - 在 FlagManager 中新增 clearEpochFlags(epoch) 方法，清理指定纪元的临时 FLAG
  - 在 updateEpoch() 纪元入口处理中调用 clearEpochFlags
  - 定义"纪元临时 FLAG"清单（如 sophon_blockade_confirmed 仅 CRISIS 有效）
  - 保留"跨纪元持久 FLAG"（如 deterrence_established 是 DETERRENCE 入口门控）
禁止修改范围：
  - 不修改 FLAG 常量定义
  - 不修改事件的 reqFlag/reqNotFlag 检查逻辑
  - 不清理入口门控 FLAG（deterrence_established/coordinates_broadcasted 等）
预期行为：纪元切换时清理临时 FLAG，避免跨纪元污染
潜在副作用：
  - 清理后若后续纪元事件依赖该 FLAG 的 reqNotFlag 检查，行为可能变化
  - 需要逐一核验每个 FLAG 的跨纪元依赖关系
需要新增或修改的测试：
  - 新增：纪元切换后临时 FLAG 清理测试
  - 新增：跨纪元持久 FLAG 保留测试
回归范围：所有纪元切换、所有 reqNotFlag 检查
完成标准：纪元切换后临时 FLAG 被清理，持久 FLAG 保留
```

---

### FIX-05：deterrenceEnduranceRounds 死累积修复（SYS-7）

```text
修复任务 ID：FIX-05
关联问题：AR-26（BROADCAST 死累积）、AR-31（BUNKER/GALAXY 死累积）
根因：Game.ts:651 累积条件 `epoch>=DETERRENCE` 而非 `epoch===DETERRENCE`，且 swordholder 字段在罗辑死亡前持续存在
涉及文件：
  - src/core/Game.ts:651（deterrenceEnduranceRounds 累积条件）
涉及函数或字段：
  - Game.ts deterrenceEnduranceRounds 累加逻辑
修改边界：
  - 将累积条件改为 `epoch===DETERRENCE`
  - 或在 DETERRENCE 出口时冻结 deterrenceEnduranceRounds
禁止修改范围：
  - 不修改 swordholder 字段的清除逻辑（罗辑死亡时清除）
  - 不修改 DEFEAT_DIMENSION_STRIKE 判定逻辑
预期行为：deterrenceEnduranceRounds 仅在 DETERRENCE 纪元累积，进入 BROADCAST 后冻结
潜在副作用：DEFEAT_DIMENSION_STRIKE 的兜底条件（year>350）可能需要调整
需要新增或修改的测试：deterrenceEnduranceRounds 跨纪元冻结测试
回归范围：DEFEAT_DIMENSION_STRIKE 判定、DETERRENCE 纪元数值
完成标准：deterrenceEnduranceRounds 不在 BROADCAST 及之后纪元累积
```

---

### FIX-06：死 FLAG 清理（SYS-2）

```text
修复任务 ID：FIX-06
关联问题：AR-3（dark_forest_deterrence 死定义）、AR-4、AR-12、AR-15、AR-22、AR-29、AR-35、AR-42、AR-43（共 28 个死 FLAG）
根因：events.json/filteredEvent 写入 FLAG 后无消费者；或 GameFlags.ts 定义但完全缺失
涉及文件：
  - src/data/events.json（移除死 FLAG 写入 effects）
  - src/data/randomevents.json（移除死 FLAG 写入 effects）
  - src/core/GameFlags.ts（移除死定义）
  - filteredEvents 相关代码（移除死 FLAG 写入）
涉及函数或字段：
  - events.json/filteredEvents 中的 effects.flag 写入
  - GameFlags.ts 中的 FLAG 常量定义
修改边界：
  - 移除 28 个死 FLAG 的写入点（events.json/filteredEvents）
  - 移除 GameFlags.ts 中的死定义（dark_forest_deterrence）
  - 保留有消费者的 FLAG（即使消费者在其他纪元）
禁止修改范围：
  - 不移除有消费者的 FLAG
  - 不修改 FLAG 常量值（仅移除定义）
  - 不修改 reqFlag/reqNotFlag 检查逻辑
预期行为：所有 FLAG 均有写入和读取，无死 FLAG
潜在副作用：
  - 移除写入后，若未来设计需要该 FLAG，需重新添加
  - 需确认每个死 FLAG 确实无消费者（全量扫描）
需要新增或修改的测试：
  - 新增：FLAG 全量读写交叉验证测试
  - 修改：FlagTyped.scenario.test.ts（移除死定义后更新）
回归范围：所有 FLAG 相关逻辑
完成标准：28 个死 FLAG 全部移除，无功能影响
```

---

## 优先级 4：人物、科技、数值和事件资格问题

---

### FIX-07：filteredEvent 人物存活检查（SYS-3）

```text
修复任务 ID：FIX-07
关联问题：AR-8（剧情事件不检查人物解锁）、AR-27（维德/林云/丁仪死亡后发言）、AR-34（罗辑死亡后发言）、AR-40（系统性架构缺陷）
根因：getFilteredEventsForTurn 不调用 isEventCharactersUnlocked；且 isEventCharactersUnlocked 检查 dialogNodes 属性，但 filteredEvent 使用 dialogQueue 属性
涉及文件：
  - src/core/GameEventManager.ts:1001-1004（isEventCharactersUnlocked）
  - src/core/GameEventManager.ts getFilteredEventsForTurn
涉及函数或字段：
  - isEventCharactersUnlocked 方法
  - getFilteredEventsForTurn 方法
修改边界：
  - 修改 isEventCharactersUnlocked 兼容 dialogQueue 属性
  - 在 getFilteredEventsForTurn 中增加 isEventCharactersUnlocked 检查
  - 在 checkEvents（剧情事件）中也增加 isEventCharactersUnlocked 检查（AR-8）
禁止修改范围：
  - 不修改 14 人核心故事人物锁定列表
  - 不修改 epochDeathMap
  - 不修改 filteredEvent 的其他触发条件
预期行为：未解锁/已死亡人物不作为 filteredEvent/剧情事件 speaker 出现
潜在副作用：
  - 部分 filteredEvent 可能因 speaker 死亡而无法触发，需确认是否有替代 speaker
  - 剧情事件可能因人物未解锁而延迟触发
需要新增或修改的测试：
  - 新增：filteredEvent speaker 存活检查测试
  - 新增：剧情事件人物解锁检查测试
  - 修改：现有 filteredEvent 触发测试
回归范围：所有 filteredEvent、所有剧情事件、所有纪元
完成标准：无死亡/未解锁人物作为 speaker 出现
```

---

### FIX-08：year=1 事件时序倒置修复（AR-2）

```text
修复任务 ID：FIX-08
关联问题：AR-2（year=1 倒计时事件 reqFlag=sophon_blockade_confirmed，但该 FLAG 在 year=5 才写入）
根因：events.json year=1 事件的 reqFlag 依赖 year=5 事件写入的 FLAG，导致 year=1 事件延迟到 year=6+ 触发
涉及文件：
  - src/data/events.json（year=1 事件和 year=5 事件）
涉及函数或字段：
  - year=1 事件 triggerCondition.reqFlag
  - year=5 事件 effects.flag
修改边界：
  - 方案 A：移除 year=1 事件的 reqFlag 依赖（使其在 year=1 无条件触发）
  - 方案 B：将 sophon_blockade_confirmed 的写入提前到 year≤1
禁止修改范围：
  - 不修改事件的 inYear
  - 不修改事件的 effects（除 FLAG 写入调整外）
  - 不修改 GameEventManager.ts 的 checkEvents 逻辑
预期行为：year=1 事件在 year=1 触发，汪淼在 year=1 解锁
潜在副作用：叙事时序变化（倒计时出现在智子封锁确认之前或同时）
需要新增或修改的测试：year=1 事件触发年份测试
回归范围：CRISIS 纪元早期事件触发、汪淼解锁
完成标准：year=1 事件在 year=1 触发
```

---

### FIX-09：epochDeathMap 注释冲突修复（AR-6）

```text
修复任务 ID：FIX-09
关联问题：AR-6（伊文斯/章北海/丁仪注释说 CRISIS 死，数据说 DETERRENCE 死）
根因：epochDeathMap 中注释与数据不一致
涉及文件：
  - src/core/GameEventManager.ts:937-992（epochDeathMap）
涉及函数或字段：
  - epochDeathMap 注释
  - epochDeathMap 死亡列表
修改边界：
  - 确认叙事设计意图（CRISIS 死还是 DETERRENCE 死）
  - 方案 A：若应 CRISIS 死，将"CRISIS"加入死亡列表，修正注释
  - 方案 B：若应 DETERRENCE 死，仅修正注释
禁止修改范围：
  - 不修改 isPersonAliveInEpoch 逻辑
  - 不修改其他人物的死亡列表
预期行为：注释与数据一致
潜在副作用：
  - 若改为 CRISIS 死，伊文斯/章北海/丁仪在 CRISIS 纪元不可用，可能影响事件
  - 需确认这三人在 CRISIS 纪元的事件依赖关系
需要新增或修改的测试：epochDeathMap 注释一致性测试
回归范围：伊文斯/章北海/丁仪的存活纪元、相关事件触发
完成标准：注释与数据一致，死亡时机符合叙事设计
```

---

### FIX-10：刘慈欣解锁路径补充（AR-18）

```text
修复任务 ID：FIX-10
关联问题：AR-18（刘慈欣在 PersonManager 中标记为可用，但无 unlock_person 事件，永远不可用）
根因：刘慈欣初始可用但被 14 人核心故事人物锁定列表阻止，且无 unlock_person 事件解除锁定
涉及文件：
  - src/data/events.json（新增 unlock_person 事件）
  - src/core/GameEventManager.ts:1001-1004（锁定列表，确认不改）
涉及函数或字段：
  - events.json 新增事件 effects.unlock_person
修改边界：
  - 在适当纪元（建议 GALAXY 或 STARDUST）新增刘慈欣 unlock_person 事件
  - 或将刘慈欣从 14 人锁定列表中移除
禁止修改范围：
  - 不修改 14 人核心故事人物锁定列表的结构
  - 不修改 PersonManager 的解锁逻辑
预期行为：刘慈欣在某个纪元可解锁
潜在副作用：刘慈欣解锁后可能参与事件，需确认是否有对应对话内容
需要新增或修改的测试：刘慈欣解锁测试
回归范围：GALAXY/STARDUST 纪元人物可用性
完成标准：刘慈欣可通过事件解锁
```

---

## 优先级 5：存档与回溯问题

---

### FIX-11：FlagManager 引用漂移修复（AR-7）

```text
修复任务 ID：FIX-11
关联问题：AR-7（FlagManager 在反序列化后可能持有旧 flags Set 引用）
根因：GameSerializer.ts:76-78 `new FlagManager(inst.flags)` 重建 FlagManager，若 inst.flags 被替换为新 Set，FlagManager 可能仍持有旧 Set 引用
涉及文件：
  - src/core/GameSerializer.ts:76-78（restorePrototypes）
  - src/core/FlagManager.ts（构造函数）
涉及函数或字段：
  - GameSerializer restorePrototypes
  - FlagManager 构造函数
修改边界：
  - 确保 FlagManager 与 flags Set 始终共享引用
  - 或在反序列化后显式同步（this.flags = inst.flags）
禁止修改范围：
  - 不修改 gameReplacer 的排除字段列表
  - 不修改 SAVE_VERSION
预期行为：反序列化后 FlagManager.addFlag/hasFlag 行为一致
潜在副作用：无
需要新增或修改的测试：
  - 新增：反序列化后 FlagManager 引用一致性测试
  - 新增：存档加载后 addFlag/hasFlag 行为测试
回归范围：所有存档加载/回溯场景
完成标准：反序列化后 FlagManager 行为一致
```

---

## 优先级 6：P2 局部逻辑问题

---

### FIX-12：dimensionStrikeTriggered 双系统统一（SYS-5）

```text
修复任务 ID：FIX-12
关联问题：AR-33（BUNKER）、AR-37（GALAXY）、AR-45（STARDUST）
根因：events.json year=350 事件写入 dimensional_strike FLAG（用于 GALAXY 门控），但不设置 dimensionStrikeTriggered 字段（用于 DEFEAT 判定）。AlienCivilization.ts:333 设置 dimensionStrikeTriggered 字段但不设置 FLAG
涉及文件：
  - src/data/events.json（year=350 事件）
  - src/core/AlienCivilization.ts:333
  - src/core/Game.ts checkVictoryConditions（DEFEAT_DIMENSION_STRIKE 判定）
涉及函数或字段：
  - events.json year=350 effects.flag
  - AlienCivilization.ts dimensionStrikeTriggered 字段
  - Game.ts DEFEAT_DIMENSION_STRIKE 判定
修改边界：
  - 方案 A：统一为 FLAG（events.json 写入 dimensional_strike FLAG，DEFEAT 判定改为检查 FLAG）
  - 方案 B：统一为字段（events.json year=350 事件设置 dimensionStrikeTriggered 字段）
  - 建议方案 A（与 FLAG 系统一致）
禁止修改范围：
  - 不修改 DIMENSIONAL_STRIKE FLAG 定义
  - 不修改 GALAXY 纪元入口门控
预期行为：dimensional_strike FLAG 与 dimensionStrikeTriggered 字段同步
潜在副作用：DEFEAT_DIMENSION_STRIKE 触发时机可能变化
需要新增或修改的测试：dimensionStrike FLAG 与字段同步测试
回归范围：DEFEAT_DIMENSION_STRIKE 判定、GALAXY 纪元入口
完成标准：双系统统一为单一系统
```

---

### FIX-13：updateEpoch 与 checkVictoryConditions 调用顺序（SYS-6）

```text
修复任务 ID：FIX-13
关联问题：AR-16（updateEpoch 先于 checkVictoryConditions 调用，纪元推进可能覆盖失败结局）
根因：runARound 中 updateEpoch 先于 checkVictoryConditions 调用
涉及文件：
  - src/core/Game.ts:731-732（runARound 调用顺序）
涉及函数或字段：
  - Game.ts runARound
  - Game.ts updateEpoch
  - Game.ts checkVictoryConditions
修改边界：
  - 方案 A：将 checkVictoryConditions 移到 updateEpoch 之前
  - 方案 B：在 updateEpoch 纪元推进前检查结局条件
禁止修改范围：
  - 不修改 updateEpoch 的纪元推进逻辑
  - 不修改 checkVictoryConditions 的判定逻辑
预期行为：同回合同时满足结局条件和纪元推进时，结局优先
潜在副作用：纪元推进可能延迟一回合
需要新增或修改的测试：同回合结局与纪元推进竞争测试
回归范围：所有纪元推进、所有结局判定
完成标准：纪元推进不覆盖结局
```

---

### FIX-14：结局判定与预报逻辑统一（AR-9）

```text
修复任务 ID：FIX-14
关联问题：AR-9（checkVictoryConditions 与 getEndingForecast 是两套手写逻辑）
根因：结局判定和预报分别手写，对同一规则有不同实现
涉及文件：
  - src/core/Game.ts:934-1103（胜利结局结构体）
  - src/core/Game.ts:1089-1310（checkVictoryConditions）
  - src/core/Game.ts getEndingForecast
涉及函数或字段：
  - 胜利结局结构体（type/label/check/progress）
  - checkVictoryConditions
  - getEndingForecast
修改边界：
  - 将结局条件定义为单一数据结构（胜利结局结构体已存在，需扩展到失败/中性结局）
  - checkVictoryConditions 和 getEndingForecast 都从该数据结构派生
禁止修改范围：
  - 不修改结局的 allowedEras
  - 不修改结局的优先级顺序
  - 不修改互斥 FLAG 检查
预期行为：结局判定与预报一致
潜在副作用：结局预报显示可能变化
需要新增或修改的测试：结局判定与预报一致性测试
回归范围：所有结局判定、结局预报
完成标准：判定与预报派生自同一数据源
```

---

## 优先级 7：P3 UI、文本、资源和维护性问题

---

### FIX-15：FLAG 双写清理

```text
修复任务 ID：FIX-15
关联问题：CROSS_EPOCH_AUDIT 3.3（zero_homer_contacted/mini_universe_built/dimensional_alert_seen 双写）
根因：events.json 和 filteredEvent 同时写入同一 FLAG
涉及文件：
  - src/data/events.json
  - filteredEvents 相关代码
涉及函数或字段：
  - events.json effects.flag
  - filteredEvent effects.flag
修改边界：
  - 确认双写是否为设计意图（幂等写入无功能问题）
  - 若非设计意图，移除冗余写入
  - 若为设计意图，添加注释说明
禁止修改范围：不修改 FLAG 定义和读取逻辑
预期行为：FLAG 写入点唯一或有注释说明
潜在副作用：无
需要新增或修改的测试：无
回归范围：相关 FLAG 的写入路径
完成标准：双写清理或注释说明
```

---

### FIX-16：历史文档同步

```text
修复任务 ID：FIX-16
关联问题：CROSS_EPOCH_AUDIT 6.2（3 项历史文档声明已修复但当前代码仍不一致）
根因：历史审计文档声明与当前代码状态不一致
涉及文件：
  - 02_Project_Documentation/AUDIT_20260626_DOC_VS_CODE_FULL_VERIFICATION.md（epochDeathMap PASS 声明）
  - 02_Project_Documentation/AUDIT_20260705_CRITICAL_ARCHITECTURE_ISSUES.md（FlagManager/判定预报分裂）
  - 02_Project_Documentation/AUDIT_20260626_NARRATIVE_TIMELINE_FIX_REPORT.md（未找到，需确认）
涉及函数或字段：无代码修改
修改边界：
  - 在历史文档中追加"20260712 跨纪元审计复核"注释
  - 记录当前代码状态与历史声明的差异
禁止修改范围：不修改历史文档原文（仅追加注释）
预期行为：历史文档与当前代码状态一致
潜在副作用：无
需要新增或修改的测试：无
回归范围：无
完成标准：历史文档追加复核注释
```

---

## 测试补充

---

### FIX-17：全链路回归测试

```text
修复任务 ID：FIX-17
关联问题：全部修复任务的回归测试
根因：现有测试未覆盖跨纪元推进、全结局可达性、FLAG 生命周期等场景
涉及文件：
  - 新增测试文件（建议 src/core/__tests__/CrossEpoch.test.ts）
  - 修改现有测试文件
涉及函数或字段：
  - Autoplay500 全链路推进测试
  - 全结局可达性测试
  - FLAG 生命周期测试
  - 人物全生命周期测试
修改边界：
  - 新增跨纪元推进测试（CRISIS→DETERRENCE→BROADCAST→BUNKER→GALAXY→STARDUST）
  - 新增全结局可达性测试（11 种结局）
  - 新增 FLAG 生命周期测试（写入→读取→清理）
  - 新增人物全生命周期测试（解锁→存活→死亡）
  - 新增存档加载后状态一致性测试
禁止修改范围：不修改现有测试的断言（除非修复改变了预期行为）
预期行为：所有修复后测试通过
潜在副作用：无
需要新增或修改的测试：本任务即为测试补充
回归范围：全部
完成标准：跨纪元测试覆盖全部修复点，Autoplay500 可推进到 STARDUST
```

---

## 暂不修复但需要记录的问题

> 以下为未确认项（UC-1~UC-18），证据未完全闭合，不进入修复计划。待运行时验证后重新评估。

| 编号 | 问题 | 暂不修复原因 | 后续验证方式 |
|---|---|---|---|
| UC-1 | treachery 在 CRISIS 后期可能达到 100 | 需运行时验证 treachery 曲线 | Autoplay500 运行观察 |
| UC-2 | updateEpoch/checkVictoryConditions 顺序风险 | 需确认同回合同时满足的实际场景 | 运行时日志 |
| UC-3 | 剧情事件中未解锁人物提前出现的实际实例 | 需逐一核验 talk0_talker 字段 | 全量扫描 |
| UC-4 | randomevents.json 是否有 eto_founded 写入 | Grep 已零匹配，但未逐一读取 | 全量扫描 |
| UC-5 | rush_tech 是否绕过 addProgress 前置检查 | 需读取 applyNewEffects 实现 | 代码确认 |
| UC-6 | 文档 5 修复声明与当前代码一致性 | 需读取修复报告 | 文档确认 |
| UC-7~UC-10 | 程心路线/CONQUEST/culture 曲线等 | 需运行时验证 | Autoplay500 运行 |
| UC-11~UC-18 | 各纪元运行时行为 | 需运行时验证 | Autoplay500 运行 |

**建议**：在 FIX-01 完成后，运行 Autoplay500 全链路测试，收集运行时数据，重新评估 UC-1~UC-18。

---

## 修复依赖关系

```
FIX-01（循环依赖，P0）
  ↓ 解除全链路阻断
  ├→ FIX-17（全链路回归测试，依赖 FIX-01）
  ├→ FIX-02（黑域事件，可在 FIX-01 后修复）
  ├→ FIX-03（swordholder 路径，独立）
  ├→ FIX-04（FLAG 清理，独立但需在 FIX-06 前完成）
  ├→ FIX-05（deterrenceEnduranceRounds，独立）
  ├→ FIX-06（死 FLAG 清理，依赖 FIX-04 确认临时 FLAG 清单）
  ├→ FIX-07（filteredEvent 人物检查，独立）
  ├→ FIX-08（year=1 时序，独立）
  ├→ FIX-09（epochDeathMap 注释，独立）
  ├→ FIX-10（刘慈欣解锁，独立）
  ├→ FIX-11（FlagManager 漂移，独立）
  ├→ FIX-12（dimensionStrike 统一，独立）
  ├→ FIX-13（调用顺序，独立）
  ├→ FIX-14（判定预报统一，独立）
  ├→ FIX-15（FLAG 双写，独立）
  └→ FIX-16（文档同步，最后执行）
```

**并行修复建议**：
- FIX-01 完成后，FIX-02~FIX-14 可并行（除 FIX-06 依赖 FIX-04）
- FIX-17（测试）应在所有修复完成后执行
- FIX-16（文档同步）应在所有修复完成后执行

---

## 修复类型分类

### 跨纪元系统性修复（4 项）
- FIX-01：循环依赖（SYS-1）
- FIX-04：FLAG 清理（SYS-4）
- FIX-05：deterrenceEnduranceRounds（SYS-7）
- FIX-06：死 FLAG 清理（SYS-2）
- FIX-07：filteredEvent 人物检查（SYS-3）
- FIX-12：dimensionStrikeTriggered 统一（SYS-5）

### 跨模块修复（5 项）
- FIX-02：黑域事件不可达
- FIX-03：swordholder 路径分裂
- FIX-11：FlagManager 引用漂移
- FIX-13：调用顺序
- FIX-14：判定预报统一

### 单点修复（3 项）
- FIX-08：year=1 时序倒置
- FIX-09：epochDeathMap 注释冲突
- FIX-10：刘慈欣解锁路径

### 文档同步（2 项）
- FIX-15：FLAG 双写清理
- FIX-16：历史文档同步

### 测试补充（1 项）
- FIX-17：全链路回归测试

### 暂不修复（18 项）
- UC-1~UC-18（未确认项）

---

**AUDIT_FIX_PLAN 完成。未修改代码。等待正式实施指令。**
