# `CROSS_EPOCH_AUDIT`

> 范围：全7纪元（黄金岁月跳过 → 危机纪元 → 威慑纪元 → 广播纪元 → 掩体纪元 → 银河纪元 → 星屑纪元）
> 阶段：跨纪元总审计
> 证据截止：20260712
> 引用文档：AUDIT_20260712_BASELINE、AUDIT_20260712_AUDIT_REPORT_危机纪元～星屑纪元（6 份）
> 约束：不重新逐文件复述已有报告，仅检查单纪元审计无法发现的全局问题

---

## 一、跨纪元状态流图

```
                     ┌──────────────────────────────────────────────────────────────────────┐
                     │                    全局结局判定层（每回合执行）                           │
                     │  checkVictoryConditions: HIDDEN → WANDERING → DIGITAL → DETERRENCE   │
                     │  → CONQUEST → DARK_DOMAIN → ETERNAL_EXILE → COSMIC_SILENCE            │
                     │  → DEFEAT_TREACHERY → DEFEAT_EXTINCTION → DEFEAT_DIMENSION_STRIKE     │
                     │  → DEFEAT_HELIUM_FLASH                                                   │
                     └──────────────────────────────────────────────────────────────────────┘
                                              ↑
                                              │ 每回合判定
                                              │
  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ 黄金岁月 │   │ 危机纪元 │   │ 威慑纪元 │   │ 广播纪元 │   │ 掩体纪元 │   │ 银河纪元 │   ┌──────────┐
  │ GOLDEN   │ → │ CRISIS   │ → │DETERRENCE│ → │BROADCAST │ → │ BUNKER   │ → │ GALAXY   │ → │ 星屑纪元 │
  │ epoch=0  │   │ epoch=1  │   │ epoch=2  │   │ epoch=3  │   │ epoch=4  │   │ epoch=5  │   │STARDUST  │
  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   │ epoch=6  │
       ↑              │              │              │              │              │          └──────────┘
       │              │              │              │              │              │               │
    跳过           culture≥0    culture≥200    culture≥500    culture≥800    culture≥1200   culture≥2500
 （Game.ts:53   +DETERRENCE_  +COORDINATES_  +BUNKER_      +GALAXY_       +STARDUST_     终局纪元
 初始epoch=1）   ESTABLISHED   BROADCASTED   WORLD_         EXODUS_SEEN    ERA_DECLARED   无下游推进
                (year=202)    (year=230)     COMPLETED      (year=365)     (year=420)
                                            ❌ 断裂(AR-20)  ❌ 继承断裂    ❌ 继承断裂     ❌ 继承断裂
                                              cycle=          cycle=          cycle=          cycle=
                                              BUNKER          BUNKER          BUNKER          BUNKER
                                              epoch=          epoch=          epoch=          epoch=
                                              BROADCAST       BROADCAST       BROADCAST       BROADCAST
                                              BUNKER          BUNKER          BUNKER          BUNKER
                                              无法触发         无法触发         无法触发         无法触发
                                              无法触发         无法触发         无法触发         无法触发
```

**状态流说明**：
- 实线箭头 = 正常路径可达（静态代码分析验证闭合）
- 虚线箭头 = 断裂（AR-20 循环依赖，BUNKER 及之后纪元在正常路径下不可达）
- 黄金岁月被跳过（Game.ts:53 初始 epoch=CRISIS），非 Bug
- 全局结局判定层每回合在所有纪元执行，纪元门控通过 allowedEras 实现

---

## 二、人物全生命周期表

> 来源：6 份 EPOCH_EVIDENCE 文档的人物状态轨迹 + 6 份 AUDIT_REPORT 的死亡/解锁修正

| 人物 | 初始 | 解锁 | 死亡 | 阵营 | 跨纪元问题 |
|---|---|---|---|---|---|
| 丁仪 | ✅ 可用 | - | DETERRENCE | 地球 | AR-6: epochDeathMap 注释冲突（注释说 CRISIS 死，数据 DETERRENCE 死）; AR-27: BUNKER 中死亡后发言 |
| 汪淼 | ✅ 可用 | - | DETERRENCE | 地球 | AR-2: 延迟解锁（year=6+ 而非 year=1） |
| 常伟思 | ✅ 可用 | - | DETERRENCE | 地球 | 无 |
| 大史 | ✅ 可用 | - | DETERRENCE | 地球 | 无 |
| 雷志成 | ✅ 可用 | - | CRISIS | 地球 | 无 |
| 杨卫宁 | ✅ 可用 | - | CRISIS | 地球 | 无 |
| 叶文洁 | ✅ 可用 | - | DETERRENCE | 地球 | 无 |
| 杨冬 | ✅ 可用 | - | **kill_person year=0 + epochDeathMap DETERRENCE** | 地球 | AR-1(CV-4): 死亡双重路径冲突 |
| 伊文斯 | ❌ 锁定 | ❌ 不可达（AR-1） | DETERRENCE | ETO | AR-1: 解锁路径全部阻塞; AR-6: 注释冲突 |
| 林云 | ❌ 锁定 | ❌ 不可达（AR-1 级联） | CRISIS | 军方 | AR-1: 解锁路径阻塞; AR-27: BUNKER 中死亡后发言 |
| 罗辑 | ❌ 锁定 | ✅ year=10 | GALAXY | 面壁者/执剑人 | AR-11: swordholder 路径分裂; AR-34: GALAXY 中死亡后发言 |
| 泰勒 | ❌ 锁定 | ✅ year=10 | CRISIS | 面壁者 | 无 |
| 雷迪亚兹 | ❌ 锁定 | ✅ year=10 | CRISIS | 面壁者 | 无 |
| 希恩斯 | ❌ 锁定 | ✅ year=10 | BROADCAST | 面壁者 | 无 |
| 章北海 | ❌ 锁定 | ❌ 不可达（AR-1 级联） | DETERRENCE | 太空军 | AR-1: 解锁路径阻塞; AR-6: 注释冲突 |
| 庄颜 | ❌ 锁定 | 待确认 | BROADCAST | 地球 | 无 |
| 程心 | ❌ 锁定 | 待确认 | 不死 | 地球 | AR-10: 程心路线卡死 |
| 维德 | ❌ 锁定 | 待确认 | BUNKER | 地球 | AR-27: BUNKER 中死亡后发言 |
| 艾AA | ❌ 锁定 | 待确认 | 不死 | 地球 | 无 |
| 云天明 | ❌ 锁定 | 待确认 | 不死 | 地球 | 无 |
| 智子 | ❌ 锁定 | 待确认 | 不死 | 三体 | 无 |
| 关一帆 | ❌ 锁定 | 待确认 | 不死 | 地球 | 无 |
| 刘慈欣 | ✅ 可用 | ❌ 无解锁路径 | GALAXY | 地球 | AR-18: 永远不可用; AR-38: 死亡时机与报告不符 |

**跨纪元人物问题总结**：
- **AR-1 级联影响**：伊文斯/林云/章北海 3 人解锁路径阻塞（eto_founded 不可达）
- **AR-6 注释冲突**：伊文斯/章北海/丁仪 3 人注释说 CRISIS 死但数据说 DETERRENCE 死
- **死亡后发言**：至少 4 人（丁仪/林云/罗辑/维德）在死亡后作为 filteredEvent speaker
- **刘慈欣永远不可用**：无 unlock_person 事件（AR-18）

---

## 三、全局 Tag/Flag 生命周期

### 3.1 死 FLAG 汇总（跨纪元消费为零）

| FLAG | 写入纪元 | 写入位置 | 出现报告 | 类型 |
|---|---|---|---|---|
| dark_forest_deterrence | 无 | 无写入无读取 | AR-3 | 死定义（GameFlags.ts 定义但完全缺失） |
| deterrence_era_declared | DETERRENCE | events.json year=201 | AR-4, AR-15 | 死 FLAG（写入无消费者） |
| swordholder_handover | DETERRENCE | events.json | AR-12 | 死 FLAG |
| tech_exchange_started | DETERRENCE | events.json | AR-12 | 死 FLAG |
| chengxin_swordholder | DETERRENCE | events.json | AR-12 | 死 FLAG |
| deterrence_reinforced | DETERRENCE | events.json | AR-12 | 死 FLAG |
| lightspeed_rejected | DETERRENCE | events.json | AR-12 | 死 FLAG |
| dark_battle | DETERRENCE | events.json | AR-12 | 死 FLAG（在 DETERRENCE 写入但无消费者） |
| trisolaris_fleet_escaped | BROADCAST | events.json | AR-22 | 死 FLAG |
| broadcast_era_declared | BROADCAST | events.json | AR-22 | 死 FLAG |
| escape_tech_focus | BROADCAST | filteredEvent | AR-22 | 死 FLAG |
| bunker_project_active | BROADCAST | filteredEvent | AR-22 | 死 FLAG |
| dual_strategy | BROADCAST | filteredEvent | AR-22 | 死 FLAG |
| tianming_fairy_tales | BROADCAST | events.json | AR-22 | 死 FLAG |
| staircase_data | BROADCAST | events.json | AR-22 | 死 FLAG |
| bunker_era_declared | BUNKER | events.json | AR-29 | 死 FLAG |
| pluto_museum | BUNKER | events.json | AR-29 | 死 FLAG |
| solar_system_flattened | BUNKER | events.json | AR-29 | 死 FLAG |
| wade_coup | BUNKER | events.json | AR-29 | 死 FLAG |
| wade_executed | BUNKER | events.json | AR-29 | 死 FLAG |
| wade_succeeded | BUNKER | events.json | AR-29 | 死 FLAG |
| galaxy_era_declared | GALAXY | events.json | AR-35 | 死 FLAG |
| return_to_home | GALAXY | filteredEvent | AR-35 | 死 FLAG |
| cautious_return | GALAXY | filteredEvent | AR-35 | 死 FLAG |
| great_filter_silence | GALAXY | filteredEvent | AR-35 | 死 FLAG |
| great_filter_contact | GALAXY | filteredEvent | AR-35 | 死 FLAG |
| stardust_era_active | STARDUST | 入口 CG 回调 | AR-42 | 死 FLAG |
| stardust_era_seen | 无 | 无写入点 | AR-43 | 死 FLAG（无写入，仅入口门控 OR 关系） |

**死 FLAG 总计：28 个**（1 死定义 + 27 死 FLAG），分布在 6 个纪元。

### 3.2 FLAG 跨纪元污染

FLAG 永久累积，无清理机制（AR-5）。所有纪元写入的 FLAG 全部进入后续纪元。风险：
- CRISIS FLAG（7+）→ DETERRENCE 纪元：无 reqNotFlag 阻断，风险低
- DETERRENCE FLAG（16）→ BROADCAST 纪元：无 reqNotFlag 阻断，风险低
- BROADCAST FLAG（11）→ BUNKER 纪元：conquest_declared 参与 CONQUEST 胜利竞争
- BUNKER FLAG（18，6 死）→ GALAXY 纪元：无 reqNotFlag 阻断推进
- GALAXY FLAG（11，5 死）→ STARDUST 纪元：zero_homer_contacted 互斥锁阻断所有非 HIDDEN 胜利

### 3.3 FLAG 双写

| FLAG | 写入 1 | 写入 2 | 出现报告 |
|---|---|---|---|
| zero_homer_contacted | events.json year=400 | filteredEvent | AR-36 |
| mini_universe_built | events.json year=405 | filteredEvent | AR-36 |
| dimensional_alert_seen | events.json year=340 | filteredEvent | AR-32 |

双写本身不导致功能问题（写入幂等），但增加维护成本。

---

## 四、科技跨纪元依赖

### 4.1 关键科技纪元可用性

| 科技 | 树 | CRISIS | DETERRENCE | BROADCAST | BUNKER | GALAXY | STARDUST | 依赖结局 |
|---|---|---|---|---|---|---|---|---|
| 黑暗森林威慑 | MILITARY | ✅ 根 | ✅ | ✅ | ✅ | ✅ | ✅ | DETERRENCE 胜利 |
| 思想钢印Ⅰ/Ⅱ/Ⅲ | INFORMATION | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | culture 权重 |
| 行星发动机基础/Ⅰ/Ⅱ/Ⅲ | AEROSPACE | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | WANDERING 胜利 |
| 智子工程 | PHYSICS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 智子封锁解除 |
| 黑域生成 | PHYSICS | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | DARK_DOMAIN 胜利 + HIDDEN 胜利 |
| 数字方舟 | INFORMATION | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | DIGITAL 胜利 + HIDDEN 胜利 |
| 曲率驱动理论 | PHYSICS | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | 光速飞船 |
| 宇宙重启理论 | INTERSTELLAR | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | HIDDEN 胜利 |
| 新家园选址 | AEROSPACE | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | WANDERING 胜利 |
| 50光年远镜 | PHYSICS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 事件 reqTech |
| 550W量子计算机 | INFORMATION | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 事件 reqTech |

### 4.2 科技检查函数差异

| 调用方 | 函数 | 行为 | 位置 |
|---|---|---|---|
| filteredEvent reqTech | isTecFinishedInAnyTree | 跨树搜索 | GameEventManager.ts:827-831 |
| 数值权重 | isTecFinished | 指定树 | EarthCivilization.ts:552-554 |
| 智子封锁 | isTecFinished | 指定树 | Game.ts:211-212 |

**风险**：若同名科技存在于多棵树中，跨树与指定树检查结果不一致（AR-9 同源，但无已知同名节点冲突）。

### 4.3 科技提前解锁 / 永久错过

- **提前解锁**：不成立。addProgress 严格检查 parentName 前置
- **永久错过**：不成立。EPOCH_STALLED 允许无限期停留研究科技
- **rush_tech 绕过**：待确认（UC-5），但 addProgress 前置检查应能阻止

---

## 五、结局竞争矩阵

### 5.1 结局允许纪元

| 结局 | 类型 | GOLDEN | CRISIS | DETERRENCE | BROADCAST | BUNKER | GALAXY | STARDUST |
|---|---|---|---|---|---|---|---|---|
| HIDDEN | 胜利 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| WANDERING | 胜利 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| DIGITAL | 胜利 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| DETERRENCE | 胜利 | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| CONQUEST | 胜利 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| DARK_DOMAIN | 胜利 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| ETERNAL_EXILE | 中性 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| COSMIC_SILENCE | 中性 | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| DEFEAT_TREACHERY | 失败 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DEFEAT_EXTINCTION | 失败 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DEFEAT_DIMENSION_STRIKE | 失败 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DEFEAT_HELIUM_FLASH | 失败 | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 5.2 判定顺序

```
broadcastTriggered 短路（GameEventManager 按钮触发）
  → HIDDEN 胜利（胜出则 isGameOver=true, return）
  → WANDERING 胜利（胜出则 isGameOver=true, return）
  → DIGITAL 胜利（胜出则 isGameOver=true, return）
  → DETERRENCE 胜利（胜出则 isGameOver=true, return）
  → CONQUEST 胜利（胜出则 isGameOver=true, return）
  → DARK_DOMAIN 胜利（胜出则 isGameOver=true, return）
  → ETERNAL_EXILE 中性（胜出则 isGameOver=true, return）
  → COSMIC_SILENCE 中性（胜出则 isGameOver=true, return）
  → DEFEAT_TREACHERY（胜出则 isGameOver=true, return）
  → DEFEAT_EXTINCTION（胜出则 isGameOver=true, return）
  → DEFEAT_DIMENSION_STRIKE（胜出则 isGameOver=true, return）
  → DEFEAT_HELIUM_FLASH（胜出则 isGameOver=true, return）
```

**全局一致性**：判定顺序在各纪元一致，无跨纪元差异。updateEpoch 先于 checkVictoryConditions（AR-16 顺序风险）。

### 5.3 互斥 FLAG 竞争

| 互斥 FLAG | 阻断的胜利 | 自身可达性 |
|---|---|---|
| ZERO_HOMER_CONTACTED | WANDERING + DIGITAL + CONQUEST + DARK_DOMAIN（reqNotFlag） | ✅ GALAXY year=400 写入 |
| wandering_completed | DIGITAL + DARK_DOMAIN（reqNotFlag） | ✅ CRISIS 纪元写入 |
| digital_ark_upgrade | WANDERING + DARK_DOMAIN（reqNotFlag） | ✅ BUNKER filteredEvent 写入 |
| dark_domain_decision / black_domain_decision | WANDERING + DIGITAL（reqNotFlag） | ✅ BUNKER filteredEvent 写入（events.json 路径不可达 AR-28） |
| conquest_declared | 无（CONQUEST 自身需求） | ✅ BROADCAST filteredEvent 写入 |
| swordholder_appointed | CONQUEST（reqNotFlag） | ✅ CRISIS filteredEvent 写入 |

**跨纪元竞争一致性**：互斥 FLAG 的 reqNotFlag 检查在所有允许纪元一致，无跨纪元差异。

---

## 六、历史修复回归结果

> 来源：5 份历史审计文档 vs 当前代码

### 6.1 已确认修复项

| 历史 Bug ID | 问题描述 | 原声明 | 当前代码 | 验证 |
|---|---|---|---|---|
| BUG-01 | runARound 快照泄漏 | ✅ 已修复 | 快照推入在早期返回之后 | ✅ 仍有效 |
| BUG-02 | waterdropCount 上限 | ✅ 已修复 | launchHandoverWaterdropAttack 检查 ≥3 | ✅ 仍有效 |
| BUG-03 | finally 块 autoSave | ✅ 已修复 | autoSave 移至 try 块 | ✅ 仍有效 |
| BUG-04 | getEndingForecast flag 名错误 | ✅ 已修复 | dark_domain_decision 替换 dark_domain_declared | ✅ 仍有效 |
| BUG-05 | HELIUM_FLASH 类型不匹配 | ✅ 已修复 | 类型已修正 | ✅ 仍有效 |
| BUG-06 | 舰队不移除 | ✅ 已修复 | 胜利后 fleets 移除 | ✅ 仍有效 |
| BUG-07 | resource 负数 | ✅ 已修复 | 循环消耗前检查 resource≥0 | ✅ 仍有效 |
| BUG-08 | 变异 cadenceMeta.probability | ✅ 已修复 | 深拷贝 probability | ✅ 仍有效 |
| BUG-09 | 年份双重推进 | ✅ 已修复 | _yearJustAdvanced 安全锁 | ⚠️ 文档 4 定性为"症状补丁" |
| 硬编码武器回退 | calculateFleetPower 赠送武器 | ✅ 已修复 | 无武器舰队返回 0 | ✅ 仍有效 |
| SAVE_VERSION | 从 3 升级至 4 | ✅ 已修复 | 当前版本 4 | ✅ 仍有效 |

### 6.2 声明已修复但当前代码仍不一致

| 问题 | 历史声明 | 当前代码状态 | 证据 |
|---|---|---|---|
| epochDeathMap 注释/数据冲突 | 文档 5 声明 "8 core character death times per original novel" PASS | 伊文斯/章北海/丁仪注释说 CRISIS 死，数据说 DETERRENCE 死 | AR-6 |
| FlagManager 引用漂移 | 文档 4 指出但未修复 | 当前 GameSerializer.ts:76-78 仍存在潜在漂移 | AR-7 |
| checkVictoryConditions vs getEndingForecast 逻辑分裂 | 文档 4 指出但未修复 | 仍为两套手写逻辑 | AR-9 |
| "Crisis Era circular dependency fixed" | 文档 5 声明 PASS | year=200 事件纪元冲突已闭合（CV-11 验证），但 eto_founded 不可达（AR-1）仍未修复 | AR-1 级联 |

### 6.3 回归结论

- 11 项已修复声明中，10 项当前代码仍有效
- 1 项（BUG-09）被后续审计定性为"症状补丁"（根因未解决）
- 3 项声明为 PASS 但当前代码仍存在不一致
- 目标问题（eto_founded/汪淼解锁/epochDeathMap/末日战役/FLAG 写入点/科技检查/treachery/调用顺序）中，**没有任何一个被历史文档以完全匹配的方式声明为"已修复"**

---

## 七、系统性问题清单

> 跨多个纪元反复出现的根因模式

### SYS-1：事件纪元标注与入口门控 FLAG 的循环依赖

```text
根因：事件写入的 FLAG 是下一纪元的入口门控，但事件 triggerCondition.epoch 标注为下一纪元，当前纪元无法触发
出现位置：
  - AR-1: eto_founded 由 GOLDEN 纪元事件写入，CRISIS 纪元事件 reqFlag 读取（GOLDEN 跳过 → 不可达）
  - AR-10: coordinates_broadcasted 由 BROADCAST 纪元事件写入（程心路线），DETERRENCE 纪元门控读取（epoch 不匹配 → 不可达）
  - AR-20: bunker_world_completed 由 BUNKER 纪元事件写入，BROADCAST 纪元门控读取（epoch 不匹配 → 不可达）
  - AR-21: 程心路线 coordinates_broadcasted 二阶循环依赖（事件 epoch=BROADCAST，但进入 BROADCAST 需该 FLAG）
影响：3 个世纪的纪元推进被阻断（BROADCAST→BUNKER→GALAXY→STARDUST）
修复模式：将事件 epoch 改为当前纪元，或将 FLAG 写入点提前到当前纪元
```

### SYS-2：死 FLAG 群

```text
根因：events.json 事件写入 FLAG 后，无后续事件/代码读取该 FLAG。可能原因：
  - 原设计有后续事件但未实现
  - 后续事件被删除但 FLAG 写入未清理
  - FLAG 仅为叙事标记，无实际功能
出现位置：28 个死 FLAG（见 3.1），分布在 6 个纪元
影响：增加维护成本；FLAG 永久累积（AR-5）；可能掩盖遗漏的功能点
修复模式：移除死 FLAG 写入，或补充消费者
```

### SYS-3：filteredEvent 人物存活检查缺失

```text
根因：filteredEvent 的 getFilteredEventsForTurn 不调用 isEventCharactersUnlocked，
  且 isEventCharactersUnlocked 检查 dialogNodes 属性，但 filteredEvent 使用 dialogQueue 属性
出现位置：AR-40（系统性架构缺陷），所有纪元 filteredEvent
出现案例：AR-27（维德/林云/丁仪死亡发言）、AR-34（罗辑死亡发言）
影响：所有 29 个 filteredEvent 的 speaker 死亡后仍可发言
修复模式：在 getFilteredEventsForTurn 中增加人物存活检查，修改 isEventCharactersUnlocked 兼容 dialogQueue
```

### SYS-4：FLAG 永久累积无清理机制

```text
根因：纪元切换时（Game.ts:789-915）不清理任何 FLAG，仅 unset EPOCH_STALLED
出现位置：AR-5，所有纪元
影响：28 个死 FLAG 永远累积；跨纪元 reqNotFlag 可能意外阻断事件
修复模式：区分"纪元临时 FLAG"和"跨纪元持久 FLAG"，纪元切换时清理临时 FLAG
```

### SYS-5：dimensionStrikeTriggered 双系统独立

```text
根因：events.json year=350 事件写入 dimensional_strike FLAG（用于 GALAXY 门控），
  但不设置 dimensionStrikeTriggered 字段（用于 DEFEAT 判定）。
  AlienCivilization.ts:333 设置 dimensionStrikeTriggered 字段但不设置 FLAG。
出现位置：AR-33（BUNKER），跨纪元持续（AR-37 GALAXY，AR-45 STARDUST）
影响：两个系统功能互补但独立，维护成本高；DEFEAT 兜底 year>350 覆盖了字段未设置的情况
修复模式：统一为单一系统（建议使用 FLAG）
```

### SYS-6：updateEpoch 与 checkVictoryConditions 调用顺序

```text
根因：runARound 中 updateEpoch 先于 checkVictoryConditions 调用（Game.ts:731-732）
出现位置：所有纪元（AR-16 验证）
影响：纪元推进可能覆盖应触发的失败结局（同回合同时满足时体验割裂）
修复模式：将 checkVictoryConditions 移到 updateEpoch 之前，或在纪元推进前检查结局条件
```

### SYS-7：deterrenceEnduranceRounds 跨纪元死累积

```text
根因：Game.ts:651 累积条件 epoch>=DETERRENCE（而非 epoch==DETERRENCE），
  且 swordholder 字段在罗辑死亡前持续存在
出现位置：AR-26（BROADCAST 死累积）、AR-31（BUNKER/GALAXY 死累积）
  自然消解：GALAXY 中罗辑死亡（epochDeathMap["罗辑"]=["GALAXY"]），swordholder 被清除为 null
影响：DETERRENCE 之后纪元无消费者但持续累积，数值冗余
修复模式：改为 epoch===DETERRENCE，或在 DETERRENCE 出口时冻结
```

---

## 八、单纪元遗漏项

> 各纪元审计中发现的未覆盖范围

| 编号 | 纪元 | 遗漏项 | 影响 |
|---|---|---|---|
| SL-1 | CRISIS | year=16/20/25/40/50/60/70/80/150/180/202 事件完整 effects 未逐一展开 | 低：正常路径因果链已闭合，省略事件为中间叙事事件 |
| SL-2 | CRISIS | randomevents.json 53 条随机事件未逐一展开 effects | 低：随机事件不参与主线因果链 |
| SL-3 | 全纪元 | FLAG 全量读写交叉比对未完成 | 中：死 FLAG 已识别（28 个），但可能有遗漏 |
| SL-4 | 全纪元 | events.json + randomevents.json 中所有 talk0_talker 字段未逐一核验 | 低：AR-8/AR-27/AR-34 已通过已知案例确认 |
| SL-5 | 全纪元 | Autoplay500 运行时验证未执行 | 中：UC-1/UC-11/UC-14/UC-16/UC-18 treachery 曲线 + UC-10/UC-15/UC-17 culture 曲线未验证 |
| SL-6 | 全纪元 | CONQUEST 胜利 isAllCiviConquered 运行时可达性 | 中：UC-12 待运行时验证 |
| SL-7 | 全纪元 | 结局判定与预报的完整差异清单 | 低：AR-9 已确认逻辑分裂，但未逐一比对 |
| SL-8 | CRISIS | rush_tech 是否绕过 addProgress 前置检查 | 低：UC-5 待确认 |
| SL-9 | STARDUST | 无事件纪元，无遗漏 | 不适用 |

---

## 九、未覆盖范围

| 范围 | 说明 | 优先级 |
|---|---|---|
| 运行时验证 | 所有纪元审计基于静态代码分析，treachery/culture 曲线、CONQUEST 可达性、BROADCAST→BUNKER→GALAXY→STARDUST 全链路均未通过 Autoplay500 运行时验证 | 高 |
| 随机事件全量 | 154 个随机事件未逐一展开 effects，仅按纪元覆盖统计 | 中 |
| UI 层验证 | WallfacerPanel 渲染条件、结局 CG 展示、timeline 显示等 UI 层未验证 | 中 |
| 异星文明系统 | AlienCivilization 系统仅在需要时部分验证（dimensionStrikeTriggered 字段），完整 AI 行为未审计 | 中 |
| 音效/资源加载 | 资产包下载（epoch 切换时）、CG 图片映射、音频文件映射未审计 | 低 |
| 回溯系统 | rollbackToFateDivergence 完整功能未审计（turnHistory 不持久化，基线 U-3） | 低 |
| 黄金岁月 | 被跳过（Game.ts:53 初始 epoch=CRISIS），事件不可达，未审计 | 低 |
| 文档修复报告 | AUDIT_20260626_NARRATIVE_TIMELINE_FIX_REPORT.md 未找到，无法验证其修复内容 | 低 |

---

## 十、总览矩阵

| 纪元 | 时间线 | 人物 | 事件 | 数值 | Tag | 科技 | 推进 | 结局 | 存档 | 反例 | 状态 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 黄金岁月 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 |
| 危机纪元 | 完成 | 完成 | 部分完成 | 完成 | 部分完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 |
| 威慑纪元 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 |
| 广播纪元 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 阻塞 | 完成 | 完成 | 完成 | 阻塞 |
| 掩体纪元 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 阻塞 | 完成 | 完成 | 完成 | 阻塞 |
| 银河纪元 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 阻塞 | 完成 | 完成 | 完成 | 阻塞 |
| 星屑纪元 | 完成 | 完成 | 完成 | 完成 | 完成 | 完成 | 阻塞 | 完成 | 完成 | 完成 | 阻塞 |

**状态说明**：
- **完成**：所有门禁项满足，正常路径因果链闭合，证据闭合
- **部分完成**：有未确认项或未覆盖范围，但不影响正常路径闭合
- **阻塞**：纪元入口正常路径不可达（AR-20 循环依赖），但纪元内部因果链闭合（静态代码分析验证）
- **不适用**：黄金岁月被跳过，无需审计

---

## 十一、全链路推进状态

```
正常路径可达性（自上而下）：
  GOLDEN → CRISIS    ✅ 闭合（Game.ts:53 初始 epoch=CRISIS，设计决策）
  CRISIS → DETERRENCE ✅ 闭合（culture≥200 + deterrence_established，year=202 写入）
  DETERRENCE → BROADCAST ✅ 闭合（罗辑路线：culture≥500 + coordinates_broadcasted，year=230 写入）
                          ❌ 断裂（程心路线：AR-10 循环依赖 + AR-21 二阶循环依赖）
  BROADCAST → BUNKER   ❌ 断裂（AR-20 循环依赖：bunker_world_completed 由 BUNKER 纪元事件写入）
  BUNKER → GALAXY      ❌ 继承断裂（AR-20 未修复，BUNKER 正常路径不可达）
  GALAXY → STARDUST    ❌ 继承断裂（AR-20 未修复，GALAXY 正常路径不可达）
  STARDUST → 终局       ✅ 闭合（终局纪元，无下游推进，11 种结局可触发）

全链路断裂点：AR-20（bunker_world_completed 循环依赖）
影响范围：BROADCAST 之后的 3 个纪元（BUNKER/GALAXY/STARDUST）在正常路径下不可达
修复优先级：P1（阻断 3 个纪元正常推进，影响全链路可达性）
```

---

**CROSS_EPOCH_AUDIT 完成。未修改代码。**

**关键数据**：
- 正式问题：45 项（P1×5, P2×15, P3×25）
- 未确认问题：18 项（UC-1~UC-18）
- 死 FLAG：28 个（1 死定义 + 27 死 FLAG）
- 系统性问题：7 项（SYS-1~SYS-7）
- 全链路断裂点：1 处（AR-20，阻断 3 个纪元）
- 历史修复回归：10 项有效 + 1 项症状补丁 + 3 项不一致
- 单纪元遗漏：9 项（SL-1~SL-9）
- 未覆盖范围：8 项