# 《光锥之外》Phase 1–5 最终系统审计报告

**审计日期**：2026-08-24
**审计对象**：`elyseeJuly/beyond-the-light-cone` 当前 `main`
**审计基线**：`7c3a3e1f4a20a9da2c6418bd1c8e7990ac66c2f0`
**范围**：文档权威性、设计—代码—测试对账、测试可信度、真实缺口、核心跨系统因果链
**本轮原则**：只审计，不修改游戏代码；历史 GREEN、文件存在和测试数量不单独视为实现证明。

---

## 1. 执行摘要

当前项目已经具备较完整的系统骨架、数据配置和测试基础设施，但尚不能证明“纪元—Flag—事件—人物—科技—数值—存档—回溯—结局”形成了可供玩家稳定完成的闭环。

最重要的结论有四项：

1. **首个纪元跃迁存在真实阻断**：威慑建立事件依赖罗辑作为事件人物，但罗辑不在初始可用人物名单中，也没有发现有效的生产解锁路径；`updateEpoch()` 又要求 `deterrence_established` Flag 才允许进入威慑纪元。这会导致玩家长期停留在危机纪元。
2. **存档/回溯后的对象图不完整**：反序列化只恢复原型，没有重新注入带 JS 私有字段的 `Game` 引用，也没有调用部分子系统的 `fromJSON()`；读取后继续回合存在结构性失败风险。
3. **人物死亡没有闭合到事件池**：丁仪、杨冬等人物死亡后，事件人物过滤器不一定检查其存活状态；部分死亡叙事本身也没有写入人物死亡状态，因此会继续出现“死者事件”。
4. **测试体系擅长证明局部函数和静态存在性，但不能证明真实玩家路径**：关键测试大量直接注入 Flag、文化值、科技完成状态或手动调用子系统；reachability 不要求正面结局，Playwright 真实剧情路径仍存在骨架、skip 或覆盖不足。

因此，本项目当前不应将核心玩法闭环判定为 VERIFIED。最合理的总体状态是：

> **核心系统：PARTIAL；真实主线闭环：MISSING；测试证据：MEDIUM 以下；发布风险：P0。**

---

## 2. 审计方法与证据等级

### 2.1 证据优先级

本报告按以下顺序判断事实：

1. 当前 `main` 生产代码和运行时调用关系；
2. 当前数据文件与事件配置；
3. 权威 SPEC 对设计约束的明确声明；
4. 测试是否真正经过生产入口并验证玩家可观察结果；
5. Registry、旧审计和执行记录仅作为索引或待核对线索。

### 2.2 测试结论限制

本轮没有把历史“全量通过”重新当作证明。前四轮主要核对了测试代码、运行入口、断言内容和 CI 条件；本地依赖安装未形成可重复的完整重放环境，因此本报告不宣称本轮重新跑通全部测试。

特别注意：

- 单元测试能通过，不等于生产调用链能完成；
- 事件对象能被创建，不等于事件能被玩家触发；
- Flag 能被手动设置，不等于真实事件会写入 Flag；
- `check()` 为真时 `progress()` 为 100，不等于 100% 一定能触发结局；
- simulation 没有失败，不等于正面结局可达；
- Playwright 文件可发现，不等于真实玩家路径已经验证。

---

## 3. Phase 1：文档权威性清洗结果

### 3.1 当前权威依据

| 分类 | 文档/来源 | 结论 |
|---|---|---|
| AUTHORITATIVE | `SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE.md` | 纪元数量、文化阈值、年份推进、Flag 门控、事件阻塞和核心实现基线的唯一设计依据 |
| AUTHORITATIVE | `SPEC_20260702_DOCUMENT_PREFIX_STANDARDS.md` | 文档分类、生命周期和审计文档命名依据 |
| ACTIVE | 当前 `main` 生产代码 | 最终实现事实；若与旧文档冲突，以当前代码事实为待审计对象，再与权威 SPEC 对照 |
| ACTIVE | `03_Web_Rebuild/src/test/scenarios/_registry.md` | 测试场景索引和历史声称状态，不是事实证明本身 |
| ACTIVE | `03_Web_Rebuild/src/test/scenarios/_health.md` | 技术债、架构风险和历史修复记录的活文档 |
| ACTIVE-REFERENCE | 当前事件、人物、科技、纪元 JSON | 内容和数据来源；必须结合生产解析器与生命周期逻辑读取 |

### 3.2 已实现历史、被取代与未来文档

| 分类 | 文档族 | 审计处理 |
|---|---|---|
| IMPLEMENTED-HISTORY | GitHub Release、HUD Freeze 等 `PLAN_` / `EXEC_` | 记录过去的计划和修复，不直接证明当前核心闭环完整 |
| SUPERSEDED | 旧版五纪元定义及其引用 | 被 `SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE.md` 的七纪元定义取代 |
| ARCHIVE | 早期全面审计、旧架构重构和历史问题报告 | 只用于提取“曾经声称未实现”的线索，必须重新对照当前 `main` |
| FUTURE-ROADMAP | Steam API、部分桌面扩展、多槽位 UI、英文剧情完整化等 | 不应当被误报为当前已实现核心功能 |
| UNCERTAIN | 仅有 Registry GREEN 或执行记录声称完成、缺乏真实路径证据的条目 | 在本报告中降级为 CLAIMED-BUT-UNVERIFIED 或 TEST-GAP |

### 3.3 后续审计核心文档集合

后续只需优先读取以下集合，不必重新逐篇展开全部 EXEC 和资产文档：

- `SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE.md`
- `SPEC_20260702_DOCUMENT_PREFIX_STANDARDS.md`
- `03_Web_Rebuild/src/test/scenarios/_registry.md`
- `03_Web_Rebuild/src/test/scenarios/_health.md`
- `03_Web_Rebuild/src/core/Game.ts`
- `03_Web_Rebuild/src/core/GameSerializer.ts`
- `03_Web_Rebuild/src/core/GameEventManager.ts`
- `03_Web_Rebuild/src/core/PersonManager.ts`
- `03_Web_Rebuild/src/core/SaveManager.ts`
- `03_Web_Rebuild/src/core/FlagManager.ts`、`GameFlags.ts`
- `03_Web_Rebuild/src/data/epochs.json`、`events.json`、`randomevents.json`、`persons.json`
- `03_Web_Rebuild/src/test/core/`、`integration/`、`scenarios/`、`simulation/`、`e2e-playwright/`

---

## 4. Phase 2：设计—代码—测试对账表

状态定义：`VERIFIED` 必须同时具备设计要求、生产代码和有效测试证据；仅具备其中一部分时不得使用 VERIFIED。

| 系统 | 设计—代码—测试结论 | 状态 |
|---|---|---|
| 七纪元枚举与文化阈值 | `epochs.json`、`updateEpoch()` 和直接阈值测试存在；真实事件门控链未证明，且首个跃迁当前被人物解锁链阻断 | DESIGN-DRIFT / TEST-GAP |
| 年份推进与事件队列阻塞 | `runARound()`、`processNextEvent()` 存在，部分测试覆盖；保存、重载和多事件真实路径未闭合 | PARTIAL |
| FlagManager 与类型化 Flag | 常量、别名和管理器存在；大量生产 Flag 仍通过事件 effects 或 legacy 文案逻辑写入，生命周期测试不足 | PARTIAL |
| 固定事件 | 数据加载和 `hasTriggered` 机制存在；关键入口事件的人物可用性、Flag 生产和纪元门控未形成真实路径证明 | PARTIAL / MISSING |
| filtered / random 事件 | 过滤器、概率、冷却和人物检查框架存在；部分人物不在检查名单，死者事件可泄漏 | DESIGN-DRIFT |
| 人物解锁与死亡 | `PersonManager`、`epochDeathMap`、讣告逻辑存在；死亡叙事没有统一写回人物状态，事件池也未统一检查 `isAlive` | PARTIAL / TEST-GAP |
| 科技树 | 科技树、依赖和研究队列存在；测试常直接将节点设为 finished，未证明科技—事件—结局的真实链路 | PARTIAL / CLAIMED-BUT-UNVERIFIED |
| 数值系统 | 文化、人口、经济、威慑等计算代码和局部测试存在；真实长局平衡、阻断和结局可达性证据不足 | PARTIAL |
| 存档与读取 | 版本、哈希、Map/Set 处理测试存在；私有引用、子系统 `fromJSON()`、继续回合未证明，且存在结构性缺陷 | DESIGN-DRIFT / TEST-GAP |
| 回溯 | 能返回旧快照并恢复部分标量状态；回溯后对象图和继续运行未证明 | PARTIAL / TEST-GAP |
| 结局判定 | `getVictoryConditions()`、互斥 Flag 和 neutralType 代码存在；正面结局真实玩家路径缺失，结局 UI 对 neutralType 有遗漏 | PARTIAL |
| UEE Tag / Atmosphere / Ecology | Tag 与氛围部分接入；生态链激活函数没有从真实事件流调用，结果事件也未按指定 ID 分发 | MISSING |
| Playwright 玩家路径 | 有测试文件和若干 UI 场景；英文剧情为 skip，核心长局、存档续玩和正面结局没有有效证明 | SKELETON / NO-COVERAGE |

**Phase 2 总结**：截至当前 `main`，没有任何一个核心“跨系统闭环”同时满足设计、生产代码和有效测试三项条件，因此不能列出 VERIFIED 核心系统。

---

## 5. Phase 3：测试可信度核验

| 测试套件 | 实际证明内容 | 可信度 |
|---|---|---|
| 核心单元测试 | 证明局部函数、Map/Set、阈值、别名和简单边界行为 | MEDIUM |
| `SaveLoad.test.ts` | 证明存档写入、版本号、哈希和损坏数据拒绝；没有证明读取后继续回合 | WEAK |
| `Serialization.scenario.test.ts` | 证明部分原型、Map/Set 和 FlagManager 别名；明确把待处理事件排除，却没有验证恢复语义 | WEAK / FALSE-POSITIVE RISK |
| `Game.bypassPrevention.test.ts` | 证明回溯返回旧年份且解锁部分标量状态；没有验证回溯后继续运行 | WEAK |
| `EndingConditions.scenario.test.ts` | 证明手动构造满足条件时 `check()` 和部分 `progress()` 结果；没有证明玩家路径或反向一致性 | WEAK |
| Simulation smoke | 证明有限回合内不崩溃、数值未明显越界 | MEDIUM for stability / WEAK for gameplay |
| Reachability simulation | 生成事件、Flag、纪元报告；只断言运行失败数为零，不要求观察到任何结局 | WEAK |
| FlagReachability | 静态扫描生产者/消费者关系；严格模式通过环境变量开启，CI 不默认开启 | WEAK |
| UEE / Ecology integration | 手动调用 `checkChainReactions()`、`advanceTurn()` 验证子系统本身；没有证明 Game 真实事件会触发它 | SKELETON |
| Playwright | 教程、响应式等局部 UI 有覆盖；核心跨年长局、真实存档、正面结局和英文剧情没有完整验证 | SKELETON / NO-COVERAGE |
| Registry GREEN | 证明条目被标记为 GREEN，不证明设计链路已闭合 | WEAK as release evidence |

### 5.1 高价值测试缺口

- 新局从开局到危机—威慑的真实事件路径；
- 事件选择弹出时自动存档、退出、读取和继续选择；
- 读取和回溯后连续运行至少三回合；
- 纪元门控 Flag 的真实生产者—消费者链；
- 人物死亡后所有固定、filtered、random 事件池的排除逻辑；
- 科技完成→事件条件→Flag→结局的真实链；
- 至少一条正面结局和一条隐藏结局的无状态注入路径；
- neutral ending 的核心判定到 `EndGameScreen` 展示路径；
- UEE 事件→生态链→结果事件→Tag→历史记录的真实闭环。

---

## 6. Phase 4：旧审计缺口重新核对

| 旧审计/设计声称 | 当前核对结果 | 分类 |
|---|---|---|
| 七纪元、文化阈值和基础年份递增已实现 | 局部实现，但真实威慑入口被人物解锁链阻断 | PARTIAL |
| Flag 类型化已经完成 | API 和常量完成；数据解析、生命周期和生产入口仍不完整 | PARTIAL |
| 事件 Flag 已由 `grantsFlags` 统一驱动 | 接口存在，JSON 解析没有完整传递；仍保留文案匹配 fallback | REAL-MISSING |
| 人物死亡会阻止后续人物事件 | 只对 `coreStoryPersons` 子集有效，丁仪、杨冬等会绕过 | REAL-MISSING |
| 存档序列化已统一且可恢复 | 序列化格式部分统一；恢复注入和继续运行缺失 | REAL-MISSING |
| 回溯已恢复命运分歧 | 能恢复部分快照标量；对象图和后续回合未证明 | PARTIAL |
| UEE 生态链已接入 Game | `advanceTurn()` 被调用，但 `checkChainReactions()` 生产调用缺失，结果事件被随机事件替代 | REAL-MISSING |
| 结局预报与结局判定同源 | 函数来源同源，但 progress 仍遗漏触发条件 | PARTIAL |
| 正面结局已实现 | 条件函数存在，真实玩家可达路径和测试缺失 | CLAIMED-BUT-UNVERIFIED |
| Playwright 已恢复 | 局部 UI 测试存在；英文剧情仍 skip，核心玩家闭环未覆盖 | TEST-GAP |
| 多槽位存档已完成 | SaveManager 有 API，玩家 UI 仍只有 autosave | REAL-MISSING |

明确淘汰的旧结论：旧审计中的“未实现”不直接视为当前事实；本报告只保留经过当前 `main` 重新核对后仍成立的项目。

---

## 7. Phase 5：最终系统深审

### P0-1：首个纪元跃迁存在循环门控，玩家可永久停留危机纪元

**分类**：REAL-MISSING / DESIGN-DRIFT / TEST-GAP
**玩家影响**：核心主线无法进入威慑纪元，后续广播、掩体、银河和结局路线全部失去真实入口。

**代码证据**：

- `updateEpoch()` 进入威慑纪元必须有 `deterrence_established`。[Game.ts](../../03_Web_Rebuild/src/core/Game.ts#L825)
- 该 Flag 由 202 年威慑建立事件写入。[events.json](../../03_Web_Rebuild/src/data/events.json#L731)
- 该事件的发言人是罗辑，事件检查会要求人物已解锁且在世。[GameEventManager.ts](../../03_Web_Rebuild/src/core/GameEventManager.ts#L926)
- 初始可用人物名单没有罗辑。[PersonManager.ts](../../03_Web_Rebuild/src/core/PersonManager.ts#L25)
- 人物过滤名单会阻止未解锁的罗辑事件。[GameEventManager.ts](../../03_Web_Rebuild/src/core/GameEventManager.ts#L1017)

形成的因果链是：

`罗辑未解锁 → 威慑建立事件无法触发 → Flag 不写入 → updateEpoch() 拒绝跃迁`。

事件文本即使写着“正式迈入威慑纪元”，也不会直接修改 `game.epoch`；状态栏读取的是核心状态值。[TopHUD.tsx](../../03_Web_Rebuild/src/components/TopHUD.tsx#L69)

**修复优先级**：第一优先级。
**最小回归范围**：新局真实推进至 199–202 年，验证罗辑可用、威慑建立事件触发、Flag 写入、`game.epoch` 变更、状态栏同步。

### P0-2：读取存档或回溯后，核心对象图可能无法继续运行

**分类**：REAL-MISSING / TEST-GAP
**玩家影响**：读取后下一回合可能报私有字段异常，Tag、生态链或事件管理器失效。

**代码证据**：

- 构造函数为 Earth、EventManager、AlienCiviManager 注入 `Game` 引用。[Game.ts](../../03_Web_Rebuild/src/core/Game.ts#L129)
- 加载流程只 `Object.assign()` 和恢复原型，没有重新调用 `setGame()`。[GameSerializer.ts](../../03_Web_Rebuild/src/core/GameSerializer.ts#L73)
- Earth、Alien、GameEventManager 均使用未被 JSON 序列化的私有 `#game` 字段。[EarthCivilization.ts](../../03_Web_Rebuild/src/core/EarthCivilization.ts#L33)、[AlienCivilization.ts](../../03_Web_Rebuild/src/core/AlienCivilization.ts#L38)、[GameEventManager.ts](../../03_Web_Rebuild/src/core/GameEventManager.ts#L23)
- `TagManager` 与 `EcologyChain` 有 `fromJSON()`，加载流程没有调用。[TagManager.ts](../../03_Web_Rebuild/src/core/TagManager.ts#L273)、[EcologyChain.ts](../../03_Web_Rebuild/src/core/EcologyChain.ts#L235)

**修复优先级**：与 P0-1 同批。
**最小回归范围**：中期局面保存→读取→连续三回合，覆盖事件、外星回合、Tag、活动生态链；回溯后重复同样验证。

### P0-3：待选择事件在自动存档后丢失

**分类**：REAL-MISSING / TEST-GAP
**玩家影响**：玩家退出或刷新后，关键选择消失，但触发记录可能已提交，造成 Flag、人物解锁和后续纪元入口永久丢失。

**代码证据**：

- 事件在选择前已经写入 `hasTriggered` 或 `triggeredFilteredIds`。[Game.ts](../../03_Web_Rebuild/src/core/Game.ts#L450)
- `currentEvent` 与 `eventQueue` 被 replacer 排除。[GameSerializer.ts](../../03_Web_Rebuild/src/core/GameSerializer.ts#L39)
- 每回合 `finally` 仍自动存档；加载时又强制清空事件队列。[Game.ts](../../03_Web_Rebuild/src/core/Game.ts#L777)、[GameSerializer.ts](../../03_Web_Rebuild/src/core/GameSerializer.ts#L200)

**修复优先级**：P0。
**最小回归范围**：固定事件和 filtered event 各一条，停在选择界面保存/重载，事件必须恢复且只能结算一次。

### P1-1：人物死亡状态没有闭合到事件资格系统

**分类**：REAL-MISSING / TEST-GAP
**玩家影响**：丁仪、杨冬等人物已经死亡后，仍可能在后续随机或条件事件中发言。

**代码证据**：

- 丁仪、杨冬在死亡表中从威慑纪元起被视为死亡。[GameEventManager.ts](../../03_Web_Rebuild/src/core/GameEventManager.ts#L969)
- `isEventCharactersUnlocked()` 的核心人物名单不包含丁仪、杨冬，因此不会检查其存活状态。[GameEventManager.ts](../../03_Web_Rebuild/src/core/GameEventManager.ts#L1017)
- “科学突破时刻”同时使用丁仪和杨冬，但仅检查危机纪元、年份和文化。[GameEventManager.ts](../../03_Web_Rebuild/src/core/GameEventManager.ts#L453)
- 杨冬固定死亡事件会写 `kill_person`，但后续事件没有统一读取 `person.isAlive`。[events.json](../../03_Web_Rebuild/src/data/events.json#L114)
- 丁仪自杀随机事件的文案描述死亡，但没有 `kill_person` 或丁仪死亡 Flag。[randomevents.json](../../03_Web_Rebuild/src/data/randomevents.json#L4093)

**修复优先级**：P0 主线修复后第一项。
**最小回归范围**：触发杨冬死亡、丁仪死亡叙事后，连续抽取 fixed/filtered/random 事件，确认不再出现当前人物事件；历史回放类文本仍可显示。

### P1-2：执剑人人物对象、交接 Flag 与结局互斥状态不一致

**分类**：REAL-MISSING / DESIGN-DRIFT
**玩家影响**：执剑人死亡或交接后，旧的 `swordholder_appointed` 仍可能永久阻断流浪、数字、征服和黑域结局。

**代码证据**：交接事件只写 `swordholder_chengxin` 或 `swordholder_luoji_retained`，没有同步 `earthCivi.swordholder`。[events.json](../../03_Web_Rebuild/src/data/events.json#L819)

死亡对账只清空人物对象，不清理 `swordholder_appointed`。[Game.ts](../../03_Web_Rebuild/src/core/Game.ts#L793)

### P1-3：黑域固定事件会覆盖玩家拒绝选择

**分类**：REAL-MISSING / DESIGN-DRIFT
**玩家影响**：玩家拒绝黑域后，290 年固定事件仍无条件写入 `dark_domain_decision`，排除其他结局路线；没有黑域科技时还可能进入无正面结局状态。

**代码证据**：条件事件有接受/拒绝选项。[GameEventManager.ts](../../03_Web_Rebuild/src/core/GameEventManager.ts#L642)

290 年事件没有 `reqTech`、`reqNotFlag` 或玩家选择。[events.json](../../03_Web_Rebuild/src/data/events.json#L1179)

### P1-4：中性结局核心判定正确，但结局页面显示错误

**分类**：DESIGN-DRIFT / TEST-GAP
**玩家影响**：永恒流亡、宇宙静默可能被展示成“灭绝结局”。

**代码证据**：核心写入 `neutralType`。[Game.ts](../../03_Web_Rebuild/src/core/Game.ts#L1260)

`EndGameScreen` 调用 `resolveEndingKey()` 时没有传入 `neutralType`。[EndGameScreen.tsx](../../03_Web_Rebuild/src/components/EndGameScreen.tsx#L33)

### P1-5：发布门禁没有证明真实正面结局

**分类**：TEST-GAP / CLAIMED-BUT-UNVERIFIED
**玩家影响**：核心因果链断裂时，CI 仍可能全绿并进入发布。

reachability 只要求无失败运行、观察到事件/Flag/纪元，不要求任何结局出现。[reachability.sim.test.ts](../../03_Web_Rebuild/src/test/simulation/reachability.sim.test.ts#L45)

PR 快速门禁仅为 4×40 回合。[ci.yml](../../.github/workflows/ci.yml#L64)

### P2-1：结局预报可达到 100%，但判定仍为 false

**分类**：REAL-MISSING / TEST-GAP
**玩家影响**：玩家看到 100% 进度后仍无法触发结局。

`progress()` 未包含人口、互斥 Flag、允许纪元、威慑持续回合和无战争等全部触发条件。[Game.ts](../../03_Web_Rebuild/src/core/Game.ts#L997)

现有测试只验证 `check() === true` 时 `progress() === 100`，没有反向测试。[EndingConditions.scenario.test.ts](../../03_Web_Rebuild/src/test/scenarios/EndingConditions.scenario.test.ts#L80)

### P2-2：UEE 生态链没有接入真实事件因果流

**分类**：REAL-MISSING / TEST-GAP
**玩家影响**：事件引发的生态后果不会按设计产生指定结果事件。

生产代码调用 `advanceTurn()`，但没有在真实事件结算后调用 `checkChainReactions()`；延迟完成后返回的结果 ID 又被随机事件替代。[EcologyChain.ts](../../03_Web_Rebuild/src/core/EcologyChain.ts#L151)、[Game.ts](../../03_Web_Rebuild/src/core/Game.ts#L594)

现有测试手动调用生态链 API，不能证明 Game 主循环闭环。

### P2-3：`grantsFlags` 仍不是完整的数据生产路径

**分类**：REAL-MISSING / CLAIMED-BUT-UNVERIFIED
**玩家影响**：外星接触等 Flag 仍可能依赖本地化文本匹配；文案调整会静默改变玩法。

接口存在，但 `createGameEvent()` 与 JSON 解析没有完整传递 `grantsFlags`。[GameEvent.ts](../../03_Web_Rebuild/src/core/GameEvent.ts#L35)、[GameEventManager.ts](../../03_Web_Rebuild/src/core/GameEventManager.ts#L890)

测试通过手动给事件对象赋值来证明该能力。[FlagTyped.scenario.test.ts](../../03_Web_Rebuild/src/test/scenarios/FlagTyped.scenario.test.ts#L94)

### P2-4：归零者/小宇宙固定里程碑与玩家选择语义冲突

**分类**：DESIGN-DRIFT / REAL-MISSING
**玩家影响**：早期“保持沉默”“拒绝建造”的选择，可能被 400/405 年固定事件覆盖，改变结局路线。

**代码证据**：[GameEventManager.ts](../../03_Web_Rebuild/src/core/GameEventManager.ts#L669)、[events.json](../../03_Web_Rebuild/src/data/events.json#L1471)

### P3-1：多槽位存档只有 API，没有玩家入口

**分类**：REAL-MISSING / FUTURE-ROADMAP
**玩家影响**：玩家无法选择、查看、覆盖或删除多个存档槽位。

`SaveManager` 有多槽 API，但设置界面仍只调用 autosave。[SaveManager.ts](../../03_Web_Rebuild/src/core/SaveManager.ts#L168)、[SettingsModal.tsx](../../03_Web_Rebuild/src/components/SettingsModal.tsx#L56)

---

## 8. 最小修复与回归顺序

### 阶段 0：先恢复主线可玩性

1. 修复罗辑解锁—威慑建立—纪元跃迁链；
2. 修复人物死亡状态到事件池的统一过滤；
3. 修复加载/回溯后的对象注入和子系统恢复；
4. 修复待选择事件的存档恢复。

### 阶段 1：建立核心闭环门禁

1. 新局真实完成危机→威慑→广播的事件链；
2. 真实完成至少一条正面结局路径；
3. 真实完成至少一条隐藏结局路径；
4. 中途保存、读取、继续并最终结局；
5. 人物死亡后事件池排除验证；
6. `progress=100 ⇒ check=true` 的结局一致性验证。

### 阶段 2：补齐跨系统反馈

1. 事件→Flag 元数据→纪元门控；
2. 事件→生态链→结果事件→Tag→历史；
3. 科技→事件条件→Flag→结局；
4. neutralType→结局 UI；
5. 多槽位存档玩家路径。

---

## 9. 最终状态判定

| 维度 | 当前判定 |
|---|---|
| 文档权威性 | 已完成初步收口；旧文档不能直接覆盖权威 SPEC 和当前代码 |
| 基础代码骨架 | 存在，且多数局部模块可运行 |
| 设计—代码一致性 | PARTIAL，存在多个跨系统 DESIGN-DRIFT |
| 真实主线 | P0 阻断，首个纪元跃迁未形成可靠闭环 |
| 人物—事件一致性 | PARTIAL，死亡人物事件泄漏 |
| 存档—回溯 | P0 风险，不能视为可验证完成 |
| 正面结局 | CLAIMED-BUT-UNVERIFIED |
| 测试可信度 | 局部 MEDIUM，核心玩家路径 WEAK/SKELETON |
| 发布准备度 | 不应以当前 GREEN 数量作为核心系统已完成证明 |

**最终结论**：项目不是“没有系统”，而是“系统很多，但关键因果边界没有闭合”。下一轮应优先修复 P0 主线跃迁、存档续玩和人物死亡事件过滤，再建立真实玩家路径回归；在此之前不宜继续用新增测试数量或 Registry GREEN 数量描述核心玩法已经完成。

---

## 10. 变更记录

| 日期 | 版本 | 内容 |
|---|---|---|
| 2026-08-24 | V1.0 | 汇总 Phase 1–5 文档权威性、设计—代码—测试对账、测试可信度、真实缺口和系统因果链审计；补充实机观察到的危机纪元卡死、丁仪/杨冬死亡后事件泄漏问题 |
