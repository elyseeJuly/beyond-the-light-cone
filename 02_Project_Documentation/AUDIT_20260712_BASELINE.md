# 《AUDIT_BASELINE》— 光锥之外：纪元往事 纪元级审计全局基线

> 阶段：第一阶段·全局审计基线（未正式审计任何纪元，未输出缺陷结论）
> 证据截止：2026-07-12
> 主审：首席审计负责人
> 取证方式：主审直接读取核心数据 + 4 个子代理并行取证（纪元推进逻辑 / 事件系统 / 人物系统 / Tag·Flag·科技·结局·存档）

---

## 一、官方时间线与纪元列表

### 1.1 纪元定义双源（证据冲突，待纪元审计核验）

| 源文件 | 路径 | 纪元数 | 说明 |
|---|---|---|---|
| epochs.json | epochs.json | **7** | 代码运行时实际使用的文化阈值表，被 `Game.ts:764` 引用 |
| timeline.json | timeline.json | **6** | 玩家可见的叙事时间线文档，最后一条合并为"银河纪元 / 黑域纪元" |

### 1.2 epochs.json 纪元阈值表（运行时权威源）

| epoch | 名称 | minCulture | maxCulture | 对应 FLAG 门控 |
|---|---|---|---|---|
| 0 | 黄金岁月 | -100 | -1 | 无 |
| 1 | 危机纪元 | 0 | 199 | 无 |
| 2 | 威慑纪元 | 200 | 499 | DETERRENCE_ESTABLISHED |
| 3 | 广播纪元 | 500 | 799 | COORDINATES_BROADCASTED |
| 4 | 掩体纪元 | 800 | 1199 | BUNKER_WORLD_COMPLETED |
| 5 | 银河纪元 | 1200 | 2499 | GALAXY_EXODUS_SEEN 或 DIMENSIONAL_STRIKE |
| 6 | 星屑纪元 | 2500 | 999999 | STARDUST_ERA_DECLARED / STARDUST_ERA_SEEN / ZERO_HOMER_CONTACTED |

### 1.3 timeline.json 叙事时间线（玩家可见源）

| 纪元 | 现实年份 | gameYearRange | 描述摘要 |
|---|---|---|---|
| 黄金岁月 | 1947-2007 | [0,5] | 红岸基地、叶文洁、ETO |
| 危机纪元 | 200X-2208 | [6,200] | 智子封锁、面壁计划、末日战役 |
| 威慑纪元 | 2208-2270 | [201,260] | 威慑平衡、程心执剑、威慑失败 |
| 广播纪元 | 2272-2332 | [261,300] | 引力波广播、三体毁灭、三个童话 |
| 掩体纪元 | 2333-2400 | [301,350] | 掩体世界、维德政变、二向箔 |
| 银河纪元/黑域纪元 | 2401-万年后 | [351,999] | 星环号出逃、小宇宙 |

### 1.4 代码侧纪元名称数组（GameEventManager.ts:750,771）

`["GOLDEN", "CRISIS", "DETERRENCE", "BROADCAST", "BUNKER", "GALAXY", "STARDUST"]`（索引 0-6，与 epochs.json 一致）

### 1.5 基线级证据冲突（仅登记，不判定）

| 编号 | 冲突 | 证据 |
|---|---|---|
| BC-1 | timeline.json 6 条目 vs epochs.json 7 纪元（银河/星屑在 timeline 合并） | 两文件对比 |
| BC-2 | timeline.json gameYearRange 与 events.json 实际事件年份错位（例：广播纪元事件最早在 year 225，但 timeline 标注 [261,300]；掩体纪元事件最早在 year 280，但 timeline 标注 [301,350]） | events.json 事件表 vs timeline.json |
| BC-3 | epochs.json 以 culture 值划分纪元，timeline.json 以 gameYear 划分，两套坐标系并存且未显式换算 | 数据结构对比 |

---

## 二、纪元入口、出口与推进逻辑所在位置

### 2.1 核心推进函数

| 函数 | 位置 | 签名 | 调用方 |
|---|---|---|---|
| `updateEpoch()` | Game.ts:758-916 | `public updateEpoch(): void` | `runARound`(Game.ts:731)、`EventSystem.applyEventEffect`(EventSystem.ts:64) |

### 2.2 推进判定算法（Game.ts:758-786）

1. 读取 `earthCivi.culture`（Game.ts:760）
2. 在 `epochsData` 中查找 `minCulture ≤ culture ≤ maxCulture`（Game.ts:764）
3. **溢出回退**：若 culture 超过最后纪元 maxCulture，回退到最大 minCulture 纪元（Game.ts:766-769，修复历史卡死）
4. **防回退**：仅当 `matched.epoch > this.epoch` 才推进（Game.ts:770）
5. **FLAG 门控**：五个高阶纪元各自要求对应 FLAG 已设置（Game.ts:771-776），否则 `allowed=false`
6. **停滞警告**：culture 达标但 FLAG 缺失时设 `EPOCH_STALLED` 并记录"文明停滞"（Game.ts:780-786）

### 2.3 纪元入口处理（Game.ts:789-915，共 15 项初始化）

| 步骤 | 位置 | 操作 |
|---|---|---|
| 1 | 790 | `unset(FLAG.EPOCH_STALLED)` |
| 2 | 793 | `addHistory("【纪元更替】")` |
| 3 | 794 | `playerTimeline.push(...)` |
| 4 | 804-809 | 资源包下载 + 预加载下一纪元 |
| 5 | 813-819 | 时间线锚点注入 `tickerMessages` |
| 6 | 821 | `emitLegacy('ticker-message-added')` |
| 7 | 837 | `setWorldTagIntensity(epochTag, 100, ...)` |
| 8 | 840-846 | 移除非当前纪元的 Tag（循环 epochTagMap） |
| 9 | 838,844 | `historyGenerator.recordTagChange(...)` ×2 |
| 10 | 850-851 | `atmosphereEngine.evaluate` + `transitionTo` |
| 11 | 878-897 | 构造纪元 CG 事件 `newEpochEvent` |
| 12 | 898 | `eventQueue.unshift(newEpochEvent)` |
| 13 | 902-905 | `StatisticsManager.recordEventTrigger(...)` |
| 14 | 909-910 | `emitLegacy('epoch-changed')` + `emitLegacy('play-game-sound')` |
| 15 | 914 | `SaveManager.autoSave(...)` |

星屑纪元特殊入口（Game.ts:889-895）：CG 选择回调内 `addFlag(STARDUST_ERA_ACTIVE)` + `culture += 300` + `addHistory("【星屑遗泽】")`

### 2.4 纪元出口处理

- **无显式出口钩子**。出口处理隐含在入口逻辑中：
  - 旧纪元 Tag 在入口处循环移除（Game.ts:840-846）
  - 旧纪元关键 FLAG（DETERRENCE_ESTABLISHED 等）**不清理**，永久保留
  - 传递给下一纪元：`this.epoch`（已更新）、`this.year`（不变）、`earthCivi.culture`（不变，除星屑 +300）、所有 `FLAG.*`（累积）

### 2.5 事件分发链路

| 节点 | 位置 | 说明 |
|---|---|---|
| 类型化事件定义 | EventBus.ts:18 | `'game:epoch:changed': { epoch: number; name: string }` |
| 旧名映射 | EventBus.ts:107 | `'epoch-changed' → 'game:epoch:changed'` |
| 触发点 | Game.ts:908-911 | `emitLegacy('epoch-changed')`（**未传 payload**） |
| 监听方 | TimelineViewer.tsx:19 | 仅生产监听者，监听旧 window 事件 |

### 2.6 推进逻辑基线级未确认项

| 编号 | 内容 |
|---|---|
| BU-1 | 跨级跳跃未防护：`updateEpoch` 未检查 `matched.epoch - this.epoch > 1`，门控只检查目标纪元自身 FLAG，不检查中间纪元 FLAG（Game.ts:771-776）。实际可达性待纪元审计验证 |
| BU-2 | `FLAG.STARDUST_ERA_ACTIVE` 写而不读（Game.ts:891 写，全库无读位置） |
| BU-3 | `emitLegacy('epoch-changed')` 未传 payload，类型化事件声明需 `{epoch, name}`（EventBus.ts:18） |
| BU-4 | `game:epoch:changed` 无内部订阅者（仅测试代码），设计意图未确认 |

---

## 三、核心信息源索引

### 3.1 事件系统

| 信息源 | 路径 | 规模 | 关键说明 |
|---|---|---|---|
| 剧情事件数据 | events.json | 57 条 | 无显式 id/title/forced/once 字段；`name` 字段为 number（年份）；id 由 `talk0_pic` 正则动态生成 |
| 随机事件数据 | randomevents.json | 154 条 | 有显式 id/title；`maxTriggers` 被 `normalizeEventMeta` 强制钳为 1 |
| 硬编码过滤事件 | GameEventManager.ts:324-720 | 29 条 | `seedFilteredEvents()` 内联 |
| 事件管理器 | GameEventManager.ts | 1132 行 | 触发主入口 `checkEvents`(913)、`checkRandomEvents`(1035) |
| 事件子系统 | subsystems/EventSystem.ts | 285 行 | 效果应用 `applyEventEffect`(24)、`applyNewEffects`(104) |
| 事件类型 | GameEvent.ts | 69 行 | `hasTriggered` 布尔去重 |
| 事件节律 | EventCadence.ts | 149 行 | 资格判定 `isEventEligible`(59)、冷却/权重 |
| 事件总线 | EventBus.ts | 220 行 | UI/系统级发布订阅，与剧情触发无直接关系 |

**去重机制**：story event 用 `hasTriggered`；filtered event 用 `triggeredFilteredIds: Set`；random event 用 `randomEventTriggerCounts` + `maxTriggers`；lane 冷却 + 全局冷却。

### 3.2 人物系统

| 信息源 | 路径 | 规模 | 关键说明 |
|---|---|---|---|
| 人物数据 | persons.json | 35 人 | 无 id/faction/登场纪元字段，以 `name` 为唯一键 |
| 面壁者配置 | wallfacers.json | 4 人 | 仅计划名+机制参数，人物数据来自 persons.json |
| 人物接口 | Person.ts | 37 行 | `isAlive/birthYear/deathYear/departmentId`；**无 faction/active/departure** |
| 人物管理器 | PersonManager.ts | 46 行 | `unlockPerson`(32)；**无 addPerson/removePerson/killPerson** |
| 关系网络 | RelationNetwork.ts | 161 行 | 5 种关系类型，9 条预设关系，每回合衰减 0.5 |
| 死亡判定 | Game.ts:702-724 | 内联 | 依据 `isPersonAliveInEpoch` 硬编码 epochDeathMap |
| 纪元存活表 | GameEventManager.ts:937-991 | 硬编码 | `epochDeathMap` 与 persons.json 数据分离 |

**初始可用**：丁仪、汪淼、常伟思、大史、雷志成、杨卫宁、叶文洁（7 人）
**事件解锁**：伊文斯、林云、罗辑、泰勒、雷迪亚兹、希恩斯、章北海、庄颜、程心、维德、艾AA、云天明、智子、关一帆（14 人）

### 3.3 Tag/Flag 系统

| 信息源 | 路径 | 规模 | 关键说明 |
|---|---|---|---|
| FLAG 常量表 | GameFlags.ts | ~40 个 | 5 组：纪元推进/外星接触/胜利结局/防御逃逸/剧情系统 |
| TagManager | TagManager.ts | ~28 预定义 Tag | 4 类：state/social/military/epoch + 6 角色立场 |
| FlagManager | FlagManager.ts | Set 封装 | 无衰减/无跨纪元清理 |
| FLAG 别名映射 | GameEventManager.ts:781-798 | FLAG_ALIAS_MAP | 数据层旧名 → 实现层 FLAG 常量 |

**Flag 持久化**：通过 `gameReplacer` 序列化 Set，加载时由 `restorePrototypes` 重建 FlagManager（GameSerializer.ts:76-78）
**Tag 跨纪元**：纪元切换时设新纪元 Tag + 移除旧纪元 Tag（Game.ts:837-846）；每回合 `decayTags`（Game.ts:512）

### 3.4 科技树

| 信息源 | 路径 | 规模 | 关键说明 |
|---|---|---|---|
| 科技数据 | TecTreeManager.ts 内嵌 | 94 节点 | **无独立 JSON 文件**，硬编码于 `build*Tree()` |
| 节点定义 | TecTree.ts | - | `parentName` 单父链；无 prereq/unlock/纪元限制字段 |
| 5 棵树分布 | - | 物理21/航天33/军事13/信息15/星际12 | 以中文名为键 |

**解锁逻辑**：`addProgress`(TecTreeManager.ts:179) 检查 `parentName` 前置完成
**读取点**：Game.ts 结局判定（黑域生成/数字方舟/行星发动机Ⅲ型/新家园选址等）、GameEventManager.ts:779 `reqTech`

### 3.5 结局系统

| 信息源 | 路径 | 规模 | 关键说明 |
|---|---|---|---|
| 结局配置 | endingConfig.ts | 12 种 | 6 胜利 + 4 失败 + 2 中性 |
| 触发判定 | Game.ts:1089-1310 | `checkVictoryConditions` | 无显式 priority，靠数组顺序 + 互斥 FLAG |
| 胜利条件 | Game.ts:923-1086 | `getVictoryConditions` | 6 条，顺序：HIDDEN→WANDERING→DIGITAL→DETERRENCE→CONQUEST→DARK_DOMAIN |
| 展示 | EndGameScreen.tsx | - | `resolveEndingKey(victoryType, defeatType)` |

**12 结局清单**：CONQUEST/DETERRENCE/DARK_DOMAIN/WANDERING/DIGITAL/HIDDEN（胜）+ DEFEAT_TREACHERY/EXTINCTION/HELIUM_FLASH/DIMENSION_STRIKE（败）+ NEUTRAL_ETERNAL_EXILE/NEUTRAL_COSMIC_SILENCE（中性）

### 3.6 存档系统

| 信息源 | 路径 | 关键说明 |
|---|---|---|
| 存档管理器 | SaveManager.ts | SAVE_VERSION=4；4 槽位；DJB2 哈希校验；v1→v4 迁移 |
| 序列化器 | GameSerializer.ts | `gameReplacer`/`reviver`/`restorePrototypes`/`loadAndDeserialize`(184) |
| 存档契约 | SaveSchema.ts | Zod schema |
| 存储引擎 | IndexedDBStorage.ts | IndexedDB + 内存降级 + localStorage legacy 备份 |

**排除持久化字段**（GameSerializer.ts:39-41）：`currentEvent, eventQueue, isProcessing, _rngProvider, turnHistory, eventSystem, economySystem, populationSystem, game, _hadRunError, _yearJustAdvanced, flagManager`

---

## 四、历史审计文档与测试文档索引

### 4.1 历史审计文档（52 份，按主题分类）

**纪元/时间线/因果链相关（重点）**：
- AUDIT_20260608_EVENT_TIMELINE_AUDIT.md
- AUDIT_20260612_CYCLE_AUDIT_V2.md
- AUDIT_20260616_TIMELINE_CIVILIZATION_AUDIT.md
- AUDIT_20260621_EVENT_CAUSALITY_AUDIT_REPORT.md
- AUDIT_20260622_EVENT_CAUSALITY_ANALYSIS.md
- AUDIT_20260624_FULL_NARRATIVE_TIMELINE_AUDIT.md
- AUDIT_20260624_NARRATIVE_TIMELINE_FIX_REPORT.md
- AUDIT_20260621_COMPREHENSIVE_NARRATIVE_AUDIT.md

**结局系统相关**：
- AUDIT_20260615_ENDING_SYSTEM_AUDIT.md
- AUDIT_20260623_FULL_PROJECT_FAILURE_PATH_AUDIT.md

**文档与代码差异**：
- AUDIT_20260602_FULL_DOC_VS_CODE_GAP_ANALYSIS.md
- AUDIT_20260626_DOC_VS_CODE_FULL_VERIFICATION.md
- AUDIT_20260616_FULL_PROJECT_REGRESSION_AUDIT.md

**数值/AI/标签**：
- AUDIT_20260624_NUMERIC_GROWTH_AND_AI_MODE.md
- AUDIT_20260624_AP_AI_BRAIN_REPORT.md
- AUDIT_20260616_TERMINOLOGY_AUDIT.md

**代码 Bug 综合**：
- AUDIT_20260624_FULL_CODE_BUG_AUDIT.md
- AUDIT_20260622_BUG_IDENTIFICATION_REPORT.md
- AUDIT_20260624_P0_REMEDIATION_AND_TERMINOLOGY_REPORT.md
- AUDIT_20260705_CRITICAL_ARCHITECTURE_ISSUES.md

**最新综合（距本次审计最近）**：
- AUDIT_20260626_DOC_VS_CODE_FULL_VERIFICATION.md（最新全量验证）
- AUDIT_20260629_ALIEN_CONTACT_EVENTS.md
- AUDIT_20260705_CRITICAL_ARCHITECTURE_ISSUES.md（最新架构问题）

> 其余 AUDIT 文档共 30 份，位于 02_Project_Documentation/，涵盖艺术资产、CG、术语、测试系统、策略曲线等。

### 4.2 测试文档索引（57 份）

| 类别 | 数量 | 代表文件 |
|---|---|---|
| core 单元测试 | 25 | Game.test.ts、Game.victoryConditions.test.ts、Game.defeatConditions.test.ts、GameEventManager.test.ts、TagManager.test.ts、SaveManager.test.ts |
| 场景测试 | 10 | EndingConditions.scenario.test.ts、Serialization.scenario.test.ts、EventBusMigration.scenario.test.ts、DesignDrift.scenario.test.ts |
| 集成测试 | 3 | EventChain.test.ts、SaveLoad.test.ts、UEE_FullFlow.test.ts |
| E2E Playwright | 4 | core-flow.spec.ts、smoke.spec.ts、responsive.spec.ts、tutorial-guided.spec.ts |
| E2E 其他 | 1 | Autoplay500.test.ts |
| 组件测试 | 2 | Tutorial.test.tsx、UIComponents.test.tsx |
| 数据契约 | 1 | DataSchema.test.ts |
| 其他 | 11 | AppendixB/EdgeCases/IssueResolutions/Managers/Models 等 |

### 4.3 术语与字典参考

- DICT_20260616_TERMINOLOGY_DICTIONARY.md
- DICT_20260626_PROMPT_DICTIONARY.md

---

## 五、全局核心实体清单

### 5.1 实体规模总览

| 实体类型 | 数量 | 数据源 | 标识键 |
|---|---|---|---|
| 纪元 | 7（代码）/ 6（文档） | epochs.json / timeline.json | epoch 索引 |
| 剧情事件 | 57 | events.json | 无显式 id（由 talk0_pic 动态生成） |
| 随机事件 | 154 | randomevents.json | id（字符串） |
| 硬编码过滤事件 | 29 | GameEventManager.ts:324-720 | id |
| 人物 | 35 | persons.json | name（中文名） |
| 面壁者 | 4 | wallfacers.json | name |
| 科技节点 | 94 | TecTreeManager.ts 内嵌 | name（中文） |
| 结局 | 12 | endingConfig.ts | EndingKey |
| FLAG 常量 | ~40 | GameFlags.ts | 字符串值 |
| 世界 Tag | ~28 | TagManager.ts | id |
| 角色立场 Tag | 6 | TagManager.ts:92-102 | tagId |
| 关系类型 | 5 | RelationNetwork.ts:17 | RelationType |

### 5.2 七纪元与门控 FLAG 对应表（纪元审计骨架）

| 纪元 | 索引 | 文化阈值 | 入口门控 FLAG | 出口清理 |
|---|---|---|---|---|
| 黄金岁月 | 0 | -100~-1 | 无 | 无显式 |
| 危机纪元 | 1 | 0~199 | 无 | 无显式 |
| 威慑纪元 | 2 | 200~499 | DETERRENCE_ESTABLISHED | 无显式 |
| 广播纪元 | 3 | 500~799 | COORDINATES_BROADCASTED | 无显式 |
| 掩体纪元 | 4 | 800~1199 | BUNKER_WORLD_COMPLETED | 无显式 |
| 银河纪元 | 5 | 1200~2499 | GALAXY_EXODUS_SEEN 或 DIMENSIONAL_STRIKE | 无显式 |
| 星屑纪元 | 6 | 2500~999999 | STARDUST_ERA_DECLARED / SEEN / ZERO_HOMER_CONTACTED | 无显式 |

### 5.3 12 结局与纪元窗口对应表

| 结局 | 类型 | allowedEras | 关键科技 | 关键 FLAG |
|---|---|---|---|---|
| HIDDEN（小宇宙） | 胜利 | GALAXY, STARDUST | 黑域生成+数字方舟 | GALAXY_EXODUS_SEEN+ALIAN_ALLIANCE+ZERO_HOMER_CONTACTED+MINI_UNIVERSE_BUILT |
| WANDERING（流浪） | 胜利 | BUNKER, GALAXY, STARDUST | 行星发动机Ⅲ型+新家园选址 | WANDERING_COMPLETED |
| DIGITAL（数字永生） | 胜利 | BUNKER, GALAXY, STARDUST | 数字方舟 | DIGITAL_ARK_UPGRADE |
| DETERRENCE（威慑） | 胜利 | DETERRENCE | - | SWORDHOLDER_APPOINTED |
| CONQUEST（征服） | 胜利 | BROADCAST, BUNKER, GALAXY, STARDUST | - | CONQUEST_DECLARED |
| DARK_DOMAIN（黑域） | 胜利 | BUNKER, GALAXY, STARDUST | 黑域生成 | DARK_DOMAIN_DECISION |
| DEFEAT_TREACHERY | 失败 | - | - | treachery≥100 |
| DEFEAT_EXTINCTION | 失败 | - | - | population≤0 |
| DEFEAT_HELIUM_FLASH | 失败 | - | - | (降维/氦闪分支) |
| DEFEAT_DIMENSION_STRIKE | 失败 | - | 无黑域/数字方舟/防御 | dimensional_strike |
| NEUTRAL_ETERNAL_EXILE | 中性 | ≥GALAXY | - | GALAXY_EXODUS_SEEN, 0<pop≤5 |
| NEUTRAL_COSMIC_SILENCE | 中性 | ≥BUNKER | - | DARK_DOMAIN/BLACK_DOMAIN, 0<pop≤10 |

### 5.4 Game.ts 核心字段读写位置索引（纪元审计锚点）

| 字段 | 类型 | 写位置 | 读位置 |
|---|---|---|---|
| `epoch` | EpochType | Game.ts:53(初值CRISIS),779 | Game.ts:651,770,789,890,904,905,931,1015,1029,1183,1201,1500,1506,1559,1565,1573,1579; GameEventManager.ts:772 |
| `earthCivi.culture` | number | Game.ts:681(+200),892(+300),1711(+200); EventSystem.ts:27(+30) | Game.ts:760,932,945 |
| `year` | number | Game.ts:730, EventSystem.ts:63 | 多处 |
| `flagManager` | FlagManager | restorePrototypes 重建 | 全局 |
| `tagManager` | TagManager | - | Game.ts:512,837,843 |

---

## 六、当前仍未找到或无法确认的范围

### 6.1 未确认项（UNCONFIRMED）

| 编号 | 范围 | 说明 | 待核验方式 |
|---|---|---|---|
| U-1 | TagManager 加载后 Map 完整性 | `toJSON()` 输出数组格式，但 `loadAndDeserialize` 未调用 `fromJSON`，`restorePrototypes` 仅恢复原型不重建 Map | 运行时断点验证 |
| U-2 | 中性结局 neutralType 传参 | `EndGameScreen.tsx:33` 未传第三参数 | 检查 UI 层补偿 |
| U-3 | turnHistory 回滚数据来源 | `gameReplacer` 排除 turnHistory | 确认回滚功能调用方 |
| U-4 | 子系统状态可重建性 | EventSystem 等被排除持久化 | 加载后验证 |
| U-5 | 跨级跳跃实际可达性 | `updateEpoch` 未检查跨级 | 逐纪元审计 FLAG 设置点 |
| U-6 | Person.birthYear 数据来源 | 默认 0，无赋值点 | 全局搜索 |
| U-7 | 数字复活后状态一致性 | resurrectLeader 未设 isAlive=true | 追踪调用链 |
| U-8 | availablePersons 跨纪元恢复 | 任命后删除，死亡后不恢复 | 搜索操作点 |
| U-9 | game:epoch:changed 设计意图 | 无内部订阅者 | 确认架构文档 |
| U-10 | randomevents.json 完整字段 | 仅读取前 150 行 | 全量解析 |
| U-11 | filteredEvents 与 events.json FLAG 语义重叠 | 命名不同 | 逐条比对 |
| U-12 | EcologyChain 触发事件关联 | 关联机制未确认 | 追踪 ecologyChain |

### 6.2 基线级证据冲突（仅登记，待纪元审计判定）

| 编号 | 冲突 | 证据 A | 证据 B |
|---|---|---|---|
| EC-1 | 纪元数不一致 | epochs.json 7 纪元 | timeline.json 6 条目 |
| EC-2 | 纪元年份范围错位 | timeline.json gameYearRange | events.json 实际事件年份 |
| EC-3 | maxTriggers 被强制钳制 | randomevents.json 声明 maxTriggers:2 | EventCadence.ts:52-54 强制改为 1 |
| EC-4 | events.json name 字段语义歧义 | 字段名 name | 实际值为 number（年份），存在重复 |
| EC-5 | story event 不校验人物解锁 | checkEvents(913) 未调 | checkRandomEvents(1047) 调用了 |
| EC-6 | HIDDEN 结局双入口 | 坐标广播(1099)不检查 | 条件数组(925)检查 |
| EC-7 | emitLegacy payload 缺失 | Game.ts:909 未传 | EventBus.ts:18 需 payload |
| EC-8 | TagManager 序列化路径 | toJSON() 数组格式 | loadAndDeserialize 未调 fromJSON |
| EC-9 | localStorage 与 IndexedDB 双数据源 | saveToSlot 同时写入 | loadFromSlot 优先读 localStorage |
| EC-10 | endingConfig 注释与实际不符 | 行 4 注释"6胜+3败" | 实际 6+4+2=12 |
| EC-11 | FLAG_ALIAS_MAP 存在 | GameEventManager.ts:781-798 | 数据层与实现层命名不一致 |
| EC-12 | EventSystem.ts 路径 | 文档称 src/core/ | 实际 src/core/subsystems/ |

### 6.3 本阶段未覆盖范围

| 编号 | 未覆盖范围 | 原因 | 后续阶段处理 |
|---|---|---|---|
| NC-1 | 逐纪元因果链审计 | 本阶段仅建基线 | 第二阶段起逐纪元审计 |
| NC-2 | events.json 57 条逐条触发条件图谱 | 基线仅统计总数 | 纪元审计时按纪元分组核验 |
| NC-3 | randomevents.json 154 条完整字段 | 文件过大 | 纪元审计时抽样核验 |
| NC-4 | Game.ts 1700+ 行完整调用链 | 基线仅定位关键函数 | 纪元审计时按因果链追踪 |
| NC-5 | 外星文明系统与纪元的关系 | 未取证 | 银河/星屑纪元审计时核验 |
| NC-6 | diplomacy.json / aliens.json / stars.json / weapons.json | 未取证 | 相关纪元审计时核验 |
| NC-7 | 历史审计文档内容交叉核验 | 基线仅索引 | 纪元审计时逐条核验 |
| NC-8 | epochDeathMap 完整内容 | 仅报告存在 | 纪元审计时逐人物核验 |
| NC-9 | 硬编码 filteredEvents 29 条完整内容 | 仅统计数量 | 纪元审计时逐条核验 |
| NC-10 | 01_Windows_Source/ C++ 源码差异 | 审计范围为 Web 版 | 除非需追溯设计源头 |

---

## 七、审计方法论备忘

1. **审计单位**：单个纪元因果链
2. **证据等级**：已确认 / 有证据支持 / 推断 / 未确认 / 证据冲突
3. **相邻纪元交接**：由主审统一核对出口与入口
4. **子代理规则**：只取证不判定；任务具体可证伪；返回固定格式
5. **完成标准**：本基线已完成第一阶段全部 6 项要求

---

## 八、基线结论

《AUDIT_BASELINE》已建立完成，覆盖：
- 官方时间线与纪元列表（双源 + 冲突登记）
- 纪元入口/出口/推进逻辑代码位置（Game.ts:758-916 为核心）
- 事件/人物/数值/Tag·Flag/科技/结局/存档核心信息源索引（8 大系统）
- 历史审计文档 52 份 + 测试文档 57 份索引
- 全局核心实体清单（7 纪元 / 57+154+29 事件 / 35 人物 / 94 科技 / 12 结局 / 40 FLAG / 28 Tag）
- 未确认项 12 项 + 证据冲突 12 项 + 未覆盖范围 10 项

**第一阶段完成。未正式审计任何纪元，未输出缺陷结论。**
