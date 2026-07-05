# Scenario Registry — 场景测试注册表
> 最后更新：2026-07-05
> 发布条件：所有条目为 GREEN

## 发布状态：🟢 就绪（0 RED / 19 总计）

| ID   | 类型 | 场景名称 | 玩家路径 / 测试描述 | 状态  | 对应问题 | 测试文件 |
|------|------|---------|-------------------|-------|---------|---------|
| SCEN-TUTORIAL-NAV | UI/UX | 教程导航侧边栏 | 桌面端教程卡片展示垂直分类侧边栏，移动端水平滑动 | 🟢 GREEN | 1. 新手教程ui老样子演示按钮在顶部 | TutorialRemedy.scenario.test.tsx |
| SCEN-HUD-RESPONSIVE | UI/UX | HUD 响应式自适应 | 所有视口尺寸下全量常驻展示稳定度、人口、资源、军力、威慑度，确保数值不隐藏且完整呈现 | 🟢 GREEN | 2. 下一回合按钮失踪; 3. 顶部数值显示不全 | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-BLOCKER | 交互 | 教程期间"下一回合"点击突破阻断 | 教程未完成时，AI脑关闭，存在阻断时，"下一回合"不被禁用且能推进回合 | 🟢 GREEN | 2. 下一回合按钮失踪（教程期间禁用阻断） | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-CLICK-THROUGH | 交互 | 教程高亮抠孔点击穿透 | 教程高亮特定元素时，点击抠孔可以触发底层按钮（如AI脑），点击遮罩其他地方无效 | 🟢 GREEN | 4. ai智脑托管按钮不能点击 | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-STEPS-MATCH | 设计偏离 | 教程步骤分类对齐 | 教程分类为教程内部组织标签（基础操作/战略星图/情报中心/科技研发/政府管理），不与 LeftHub 导航项强制 1:1 对应。基础操作为教程专属分类。 | 🟢 GREEN | 教程分类语义不匹配（基础操作→岁月史书→战略星图 回归） | TutorialRemedy.scenario.test.tsx |
| SCEN-MANUAL-BLOCKER | 交互 | 手动模式阻断与消除 | 非教程期间，手动模式下存在阻断时按钮禁用显示"有阻断"，阻断消除后恢复可用 | 🟢 GREEN | 手动模式回合阻断与指示器显示问题 | TutorialRemedy.scenario.test.tsx |
| REG-BUILD-CLEAN | Regression | 编译构建无警告 | 本地与 CI 环境构建无 TypeScript 未使用变量警告/错误，打包流程正常 | 🟢 GREEN | GitHub Pages 编译失败与未引用变量报错 | package.json (npm run build) |
| REG-PWA-FREEZE | Regression | PWA 更新卡住修复 | 修复 GitHub Pages 下使用相对路径导致 Service Worker 更新及页面刷新卡死的问题 | 🟢 GREEN | 立即更新按钮点击卡住/白屏 | vite.config.ts |
| **SCEN-TIMELINE-COMPARE** | Feature | 岁月史书双轨时间轴对比 | 岁月史书集成小说原版时间线与当前时间线对比，提供双轨历史命运对比分析功能 | 🟢 GREEN | 岁月史书缺失小说原版时间线与当前时间线对比 | ChroniclesModal.tsx |
| **SCEN-ALIEN-CONTACT** | Feature | 外星文明接触事件弹窗 | 外星文明从发现到建立通信分为两阶段，首次发现/首次接触均触发 ticker 消息与事件弹窗 | 🟢 GREEN | 外星文明已显示在外交列表但没有接触事件弹窗 | AlienContact.scenario.test.ts |
| **SCEN-ASSET-DOWNLOAD-LOOP** | Feature | 纪元资产按需下载与预加载 | 进入新纪元时自动触发当前纪元包下载，纪元末预加载下一纪元，并在核心渲染逻辑中接入资产就绪拦截 | 🟢 GREEN | 分模块下载引擎(AssetLoader)已接入Game.ts纪元更替生命周期，downloadEraPack + preloadNextEra fire-and-forget | AssetDownload.scenario.test.ts |
| **SCEN-ASSET-MANIFEST-GEN** | Feature | 资源清单精准分类生成 | `asset_manifest.json` 应将游戏资源准确归类至各纪元包或按类型包，消除大规模 `uncategorized` 包 | 🟢 GREEN | `generate-manifest.mjs` detectEra算法重构：人物立绘归characters包、结局CG归endings包、扩展7纪元关键词，uncategorized从41%降至0.7% | AssetDownload.scenario.test.ts |
| **SCEN-FLAG-MANAGER** | Design | Flag 状态标记管理器解耦 | Game.flags Set<string> 的公开暴露改用 FlagManager 封装，提供 isSet/set/unset API | 🟢 GREEN | Game.ts 中 flags 直接暴露为 Set<string>，外部模块可直接操作 | FlagManager.ts / Game.ts |
| **SCEN-RELEASE-PIPELINE** | DevOps | Tag-Driven Release 自动化流水线 | 推送 v* tag 自动触发 CI 门禁 + 多平台构建 + GitHub Release 发布 | 🟢 GREEN | 0 自动化，发版完全手动 | .github/workflows/release.yml |
| **SCEN-DESIGN-DRIFT** | Design | 设计偏离修复验证 | 验证 7 大设计决策与 SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE.md 一致：7纪元系统、文化公式、年份递增、纪元溢出保护、AI智脑默认关闭、地球初始建筑、思想钢印权重 | 🟢 GREEN | 原始 SPEC 与实际代码存在 3 处设计偏离 (D01-D03)，已创建权威 SPEC 并编写验证测试 | DesignDrift.scenario.test.ts |
| **SCEN-STRICT-MODE** | Infrastructure | 严格模式禁止吞异常 | Game.strictMode 静态开关：开启时子系统异常（7 个 catch 块 + 外层核心崩溃）直接向上抛出，测试中不再被静默吞没；关闭时按原有逻辑记录为 [警告] 历史日志 | 🟢 GREEN | 异常被系统性吞掉导致 Autoplay500 测试全绿但 bug 存在；测试无法发现真实运行时错误 | StrictMode.scenario.test.ts |
| **SCEN-FLAG-TYPED** | Infrastructure | Flag 类型化消灭魔法字符串 | 创建 FLAG 常量对象（40+ 个已知 flag）、GameFlag 联合类型；GameEvent 新增 grantsFlags 字段替代文案字符串匹配；纪元推进/结局判定/外星接触等所有 flag 字符串字面量替换为 FLAG.* 常量 | 🟢 GREEN | 用显示文本的字符串匹配驱动游戏逻辑（文案修改静默改变解锁链）；Flag 拼写错误无编译期检查 | FlagTyped.scenario.test.ts |
| **SCEN-EVENTBUS-MIGRATION** | Infrastructure | 事件总线迁移 | EventBus 类型化重建（37 个事件类型）、emitLegacy 桥接层（37 个旧事件名映射）、核心文件全部迁移（Game.ts/EventSystem/EarthCivilization 等 9 个文件）、UI 组件保持 window 监听兼容 | 🟢 GREEN | EventBus 是摆设，真实事件流走裸 window.dispatchEvent；两套平行词汇表（game-turn-complete vs game:turn:complete） | EventBusMigration.scenario.test.ts |
| **SCEN-SERIALIZATION** | Infrastructure | 序列化路径统一 | 内联 replacer 统一为 gameReplacer（消除两套排除列表漂移风险）；Map/Set 序列化格式验证；restorePrototypes 往返测试；FlagManager 引用别名修复验证 | 🟢 GREEN | 回溯快照和自动存档使用两套不同的 exclude 列表，注定漂移；FlagManager 在反序列化后攥着旧 Set 引用 | Serialization.scenario.test.ts |
| **SCEN-ENDING-CONDITIONS** | Infrastructure | 结局条件数据化 | getVictoryConditions() 单一数据源（check+progress 同源）；getEndingForecast 从 conditions 派生进度；VictoryCondition 新增 progress/isThreat 字段；消除判定与预报的重复逻辑 | 🟢 GREEN | 结局判定与预报是两套手写逻辑（黑域判定看黑域生成，预报看光速飞船推进器）；进度条 100% 但不触发结局 | EndingConditions.scenario.test.ts |
| **SCEN-EVENT-FREEZE** | BugFix | 直接入队事件关闭后 StoryModal 卡死修复 | enqueueAlienEvent / ruinsEvent 的 choice 补 applyEventEffect(NONE)，App.tsx onClose 末尾同步 React 状态，确保直接入队事件作为最后一个事件时 StoryModal 正确关闭 | 🟢 GREEN | 外星发现/接触事件弹窗关闭后 StoryModal 不消失导致画面冻结（间歇性 bug） | EventFreeze.scenario.test.ts |
| **SCEN-TOPHUD-ZINDEX** | BugFix | TopHUD z-index 过高覆盖所有弹窗 | TopHUD z-index 从 z-[1010] 降回 z-50，不再覆盖封面(z-150)、事件弹窗(z-100)、设置弹窗(z-200)；教程 SVG 镂空机制不依赖 z-index 提升 | 🟢 GREEN | 状态栏一直展示在游戏页面顶部，盖住封面和所有弹窗 | TopHUD.tsx |
| **SCEN-EVENTBUS-COMPAT** | BugFix | EventBus 重构兼容性断裂修复 | emitLegacy 同时派发新旧事件名保证向后兼容；添加 emitToWindow 别名；修复 EarthCivilization.ts emitToWindow 调用；修复 runAIBrain 中 currentEvent null 访问 | 🟢 GREEN | 开始新游戏不弹教程、下一回合无反应、科技研发异常（EventBus 重构未派发旧事件名导致 App.tsx 监听器全部失效） | EventBus.ts / EarthCivilization.ts / Game.ts |

## 变更日志
- 2026-07-05: 三项修复核实与 Release 流水线修复——核实 SCEN-EVENT-FREEZE（5/5 通过）、SCEN-TOPHUD-ZINDEX（z-50 确认）、SCEN-EVENTBUS-COMPAT（65/65 通过）三项由其他 AI 完成的修复，确认与 5 项审计修复无冲突、互为补充。修复 Release 流水线阻塞：9 个 TS 编译错误（未使用变量/类型不匹配）+ 3 个测试运行时错误（EventBus.emit 防御性 handlers 初始化 + GameInstance.reset() setTimeout 空值守卫）。全量 1045 测试 0 错误通过。
- 2026-07-05: 基础设施全面加固——完成 5 项审计修复：严格模式、Flag 类型化、EventBus 迁移、序列化统一、结局条件数据化。新增 3 个场景测试（EventBusMigration/Serialization/EndingConditions），Registry 16→19 条目。全量 1045 测试通过。
- 2026-07-05: EventBus 兼容性断裂修复——新增 SCEN-EVENTBUS-COMPAT：emitLegacy 修复为同时派发新旧事件名（旧监听器全部失效导致教程不弹、下一回合无反应）；添加 emitToWindow 别名；修复 EarthCivilization.ts emitToWindow 调用。同步修复 TopHUD z-index（新增 SCEN-TOPHUD-ZINDEX）：z-[1010] 降回 z-50，不再覆盖封面和弹窗。全量 936 测试通过。
- 2026-07-05: StoryModal 冻结修复——新增 SCEN-EVENT-FREEZE 场景测试（5 项）：enqueueAlienEvent / ruinsEvent 的 choice 补 applyEventEffect(NONE) 确保事件收尾链路完整；App.tsx onClose 末尾同步 React 状态作为兜底。修复外星发现/接触事件作为最后一个事件时 StoryModal 不消失导致画面冻结的间歇性 bug。
- 2026-07-05: 基础设施加固——新增 SCEN-STRICT-MODE 场景测试（8 项）：Game.strictMode 静态开关，替换 runARound 中 9 个 catch 块为 handleSubsystemError()，strict 模式下异常直接抛出。同步修复 getEndingForecast 黑域进度误查技术（光速飞船推进器→黑域生成）。Autoplay500 新增 assertNoWarnings() + 100 回合 strict mode 专用测试。
- 2026-07-05: Flag 类型化——新增 SCEN-FLAG-TYPED 场景测试（17 项）：创建 GameFlags.ts（FLAG 常量对象 40+ 个 flag、GameFlag 联合类型）；GameEvent 接口新增 grantsFlags 字段；文案匹配块改为 grantsFlags 优先 + 遗留 fallback；Game.ts/PlanetEngine.ts/DigitalLife.ts/AlienCivilization.ts 全部 flag 字符串字面量替换为 FLAG.* 常量。全量 928 测试通过。
- 2026-07-03: TopHUD 更新机制重构——用「500ms 轮询兜底 + 事件加速」双保险模式替换纯事件驱动的 forceUpdate 模式，彻底消除因 Game.ts 事件链中断导致状态栏"固定死"的系统性问题。同时修复 Game.ts runARound 的 JSON.stringify replacer 遗留 flagManager 字段的问题。
- 2026-07-03: 设计偏离修复验证——新增 SCEN-DESIGN-DRIFT 场景测试（17 项），验证 7 大设计决策与权威 SPEC 一致。同时创建 SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE.md 作为权威设计基准，取代原始 SPEC 中过时的 5 纪元枚举定义。全量测试通过。
- 2026-07-03: 遗留债务修复——Flag 系统解耦：新增 FlagManager 封装 Game.flags Set<string>，提供 isSet/set/unset 类型安全 API，与 flags Set 共享引用实现 100% 存档兼容。Release 流水线：新建 .github/workflows/release.yml（Tag-Driven 4 Job 流水线）、tools/extract-changelog.sh、tools/sync-version.sh。Game.ts 拆分：提取存档序列化系统至 GameSerializer.ts（268行），Game.ts 从 1900 行降至 1721 行。新增 SCEN-FLAG-MANAGER 和 SCEN-RELEASE-PIPELINE 条目均为 GREEN。全量 886 测试通过。
- 2026-07-03: SCEN-ASSET-DOWNLOAD-LOOP 从 RED 变 GREEN（Game.ts updateEpoch 接入 assetLoader.downloadEraPack + preloadNextEra，fire-and-forget 不阻塞主循环）+ SCEN-ASSET-MANIFEST-GEN 从 RED 变 GREEN（detectEra 算法重构：人物立绘归 characters 包、结局 CG 归 endings 包、扩展 7 纪元关键词覆盖，uncategorized 从 41% 降至 0.7%）。新增 AssetDownload.scenario.test.ts 11 项测试。版本号硬编码修复：SettingsModal.tsx + generate-manifest.mjs 统一从 package.json 读取。发布状态恢复就绪。
- 2026-07-03: 审核「分模块下载功能」状态，发现架构脱节。新增 SCEN-ASSET-DOWNLOAD-LOOP 和 SCEN-ASSET-MANIFEST-GEN 均设为 🔴 RED 状态。发布状态变为未就绪。
- 2026-06-29: 取消 TopHUD 核心指标的响应式隐藏，在所有分辨率下常驻显示稳定度、人口、资源、军力、威慑度；解耦文明博物馆与岁月史书，博物馆显示于主页封面，岁月史书与双轨时间线独立载入。
- 2026-06-29: 彻底隐藏文明等级，稳定度详情去重，新增威慑度详情展开（防卫军力与执剑人）；岁月史书新增双轨时间线对比页。
- 2026-06-29: 新增 SCEN-ALIEN-CONTACT 外星文明接触事件弹窗修复：区分 discovered/contacted 两阶段，首次发现/首次接触均触发 ticker 消息与 eventQueue 弹窗。
- 2026-06-29: 修复教程侧边栏重复类别按钮（reduce 去重：unique by name）+ TopHUD 恢复原始设计（CivLevel 添加回、h-[72px] 固定高度、z-50 恢复、popFactor 稳定度公式、6纪元恢复、人口基数下拉恢复）
- 2026-06-29: 按照 SPEC_20260621_RESPONSIVE_LAYOUT.md 规范重新实现 TopHUD 响应式：h-[56px] md:h-[72px]，移动端紧凑隐藏人口/资源/军力，平板可见人口，桌面全显示。符合共识。
- 2026-06-29: SCEN-TUTORIAL-STEPS-MATCH 修复回归（恢复 '基础操作' 为教程内部组织分类，非 LeftHub 导航项）+ TopHUD 移出 scaled container 以修复 z-index 跨层叠上下文丢失问题
- 2026-06-29: ~~SCEN-TUTORIAL-STEPS-MATCH 修复回归（步骤1-3,11,12 从 '岁月史书' → '战略星图'）~~ 产生重复分类，已回退
- 2026-06-29: ~~SCEN-TUTORIAL-STEPS-MATCH GREEN → RED（代码审计发现：教程 category "基础操作" 无 LeftHub 匹配项）~~ 审计错误，已回退
- 2026-06-29: SCEN-HUD-RESPONSIVE 从 RED 变 GREEN（TopHUD 增加 shrink-0 防缩水修复）
- 2026-06-29: ~~SCEN-TUTORIAL-STEPS-MATCH 从 RED 变 GREEN（重新排列引导步骤以完美匹配 LeftHub 目录顺序）~~ 已回退：代码审计发现分类未实际对齐
- 2026-06-29: 新增 REG-PWA-FREEZE 并直接设为 GREEN（已配置 CI 绝对路径以修复 SW 更新卡死）
- 2026-06-29: 新增 REG-BUILD-CLEAN 并直接设为 GREEN（已修复测试代码多余声明并验证打包无碍）
- 2026-06-29: 新增 SCEN-MANUAL-BLOCKER 并直接设为 GREEN（经验证功能完备并通过测试）
- 2026-06-26: 所有4个UI与教程交互场景测试全部通过 (GREEN)
- 2026-06-26: 注册四个UI与教程交互场景测试条目 (RED)
- 2026-06-26: 初始化场景注册表
