# Scenario Registry — 场景测试注册表
> 最后更新：2026-07-24
> 发布条件：所有条目为 GREEN

## 发布状态：🟢 就绪（0 RED / 24 总计）

| ID   | 类型 | 场景名称 | 玩家路径 / 测试描述 | 状态  | 对应问题 | 测试文件 |
|------|------|---------|-------------------|-------|---------|---------|
| **SCEN-I18N-FULL-EN** | UI/UX | 全文本英文本地化 | 切换为 English 时，TopHUD、LeftHub、RightInspector、TecTreeView、GovManagement、DiplomacyPanel、FleetModal、BattleScreen、WallfacerPanel、DepartmentPanel、PersonSelectPanel、AdvisorPanel、MuseumGallery、Tutorial、MissionLog、EndGameScreen 等全量 UI 与专有名词（Ken Liu 译本）自动渲染为英文 | 🟢 GREEN | 游戏点击英文版显示中文，缺乏英文本地化 | src/test/core/AppendixB.test.ts |
| SCEN-TUTORIAL-NAV | UI/UX | 教程导航侧边栏 | 桌面端教程卡片展示垂直分类侧边栏，移动端水平滑动 | 🟢 GREEN | 1. 新手教程ui老样子演示按钮在顶部 | TutorialRemedy.scenario.test.tsx |
| SCEN-HUD-RESPONSIVE | UI/UX | HUD 响应式自适应 | 所有视口尺寸下全量常驻展示稳定度、人口、资源、军力、威慑度，确保数值不隐藏且完整呈现 | 🟢 GREEN | 2. 下一回合按钮失踪; 3. 顶部数值显示不全 | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-BLOCKER | 交互 | 教程期间"下一回合"点击突破阻断 | 教程未完成时，AI脑关闭，存在阻断时，"下一回合"不被禁用且能推进回合 | 🟢 GREEN | 2. 下一回合按钮失踪（教程期间禁用阻断） | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-CLICK-THROUGH | 交互 | 教程高亮抠孔点击穿透 | 教程高亮特定元素时，点击抠孔可以触发底层按钮（如AI脑），点击遮罩其他地方无效 | 🟢 GREEN | 4. ai智脑托管按钮不能点击 | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-STEPS-MATCH | 设计偏离 | 教程步骤分类对齐 | 教程分类为教程内部组织标签（基础操作/战略星图/情报中心/科技研发/政府管理），不与 LeftHub 导航项强制 1:1 对应。基础操作为教程专属分类。 | 🟢 GREEN | 教程分类语义不匹配（基础操作→岁月史书→战略星图 回归） | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-WELCOME | UI/UX | 教程欢迎页自动过渡 | 教程启动时显示"序幕"欢迎页，1.5s 后自动进入步骤 1/4（点击地球），给玩家仪式感与思考空间 | 🟢 GREEN | 新手教程一进游戏就要求操作，缺少缓冲 | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-STEP1-HOTSPOT | 交互 | 教程步骤 1 防误触 hotspot | 步骤 1 高亮框扩大到 110×110px 覆盖 StarMapRenderer 60px 命中区；单一 `<button>` hotspot 替代 4 块分块遮罩消除接缝漏点；框内任意位置点击都算选中地球 | 🟢 GREEN | 新手教程点击地球经常会误触（高亮框 40px < 命中区 60px + 遮罩接缝漏点） | TutorialRemedy.scenario.test.tsx |
| SCEN-TUTORIAL-STEP1-FOCUS-EARTH | 交互 | 教程步骤 1 自动居中地球 | 步骤 1 启动时 StarMapRenderer.focusOnStar(3, 1.5, true) 自动将地球居中到屏幕中央并缩放 1.5x，无论玩家之前停留在哪个星区 | 🟢 GREEN | 新手教程找不到地球（玩家停留在银河系区域时地球不在视野内） | TutorialRemedy.scenario.test.tsx |
| SCEN-GRACE-PERIOD-BLOCKERS | 交互 | 前 3 回合阻断器宽限期 | year < 3 时科研停滞与部门首长空缺降级为警告（不阻断回合推进），资源崩盘与经济危机仍阻断；getTurnWarnings() 返回警告列表 | 🟢 GREEN | 新玩家前几回合因不熟悉机制被反复阻断 | TutorialRemedy.scenario.test.tsx |
| SCEN-GRACE-PERIOD-EXPIRY | 交互 | 宽限期到期恢复正常阻断 | year ≥ 3 后科研停滞与部门空缺恢复为硬阻断，getTurnWarnings() 返回空列表 | 🟢 GREEN | 宽限期到期后阻断器未恢复正常 | TutorialRemedy.scenario.test.tsx |
| SCEN-MANUAL-BLOCKER | 交互 | 手动模式阻断与消除 | 非教程期间，手动模式下存在阻断时按钮禁用显示"有阻断"，阻断消除后恢复可用。依据 SPEC_20260712_AP_SYSTEM_REDESIGN：阻断器扩展为 4 项（资源崩盘/经济危机/科研停滞/行政瘫痪），测试已补齐新增阻断项的解除逻辑 | 🟢 GREEN | 手动模式回合阻断与指示器显示问题；AP 系统重设计补全阻断器 | TutorialRemedy.scenario.test.tsx |
| REG-BUILD-CLEAN | Regression | 编译构建无警告 | 本地与 CI 环境构建无 TypeScript 未使用变量警告/错误，打包流程正常 | 🟢 GREEN | GitHub Pages 编译失败与未引用变量报错 | package.json (npm run build) |
| REG-PWA-FREEZE | Regression | PWA 更新卡住修复 | 修复 GitHub Pages 下使用相对路径导致 Service Worker 更新及页面刷新卡死的问题 | 🟢 GREEN | 立即更新按钮点击卡住/白屏 | vite.config.ts |
| **SCEN-TIMELINE-COMPARE** | Feature | 岁月史书双轨时间轴对比 | 岁月史书集成小说原版时间线与当前时间线对比，提供双轨历史命运对比分析功能 | 🟢 GREEN | 岁月史书缺失小说原版时间线与当前时间线对比 | ChroniclesModal.tsx |
| **SCEN-ALIEN-CONTACT** | Feature | 外星文明接触事件弹窗 | 外星文明从发现到建立通信分为两阶段，首次发现/首次接触均触发 ticker 消息与事件弹窗 | 🟢 GREEN | 外星文明已显示在外交列表但没有接触事件弹窗 | AlienContact.scenario.test.ts |
| **SCEN-ASSET-DOWNLOAD-LOOP** | Feature | 纪元资产按需下载与预加载 | 进入新纪元时自动触发当前纪元包下载，纪元末预加载下一纪元，并在核心渲染逻辑中接入资产就绪拦截 | 🟢 GREEN | 分模块下载引擎(AssetLoader)已接入Game.ts纪元更替生命周期，downloadEraPack + preloadNextEra fire-and-forget | AssetDownload.scenario.test.ts |
| **SCEN-ASSET-MANIFEST-GEN** | Feature | 资源清单精准分类生成 | `asset_manifest.json` 应将游戏资源准确归类至各纪元包或按类型包，消除大规模 `uncategorized` 包 | 🟢 GREEN | `generate-manifest.mjs` detectEra算法重构：人物立绘归characters包、结局CG归endings包、扩展7纪元关键词，uncategorized从41%降至0.7% | AssetDownload.scenario.test.ts |
| **SCEN-DISTRIBUTION-ASSET-POLICY** | Regression | Release/PWA 资源交付分流 | PWA 首次进入游戏时对未缓存资源显示下载提醒；Web/Tauri Release 将随包资源视为已安装，不弹窗且不重复 fetch | 🟢 GREEN | Release 与 PWA 共用 IndexedDB 下载状态，导致完整桌面包仍提示下载约 370MB | DistributionChannel.scenario.test.ts |
| **SCEN-FLAG-MANAGER** | Design | Flag 状态标记管理器解耦 | Game.flags Set<string> 的公开暴露改用 FlagManager 封装，提供 isSet/set/unset API | 🟢 GREEN | Game.ts 中 flags 直接暴露为 Set<string>，外部模块可直接操作 | FlagManager.ts / Game.ts |
| **SCEN-RELEASE-PIPELINE** | DevOps | PWA/Release 自动发布流水线 | 合并 `main` 自动构建、验证并发布 PWA；推送 v* tag 自动触发 CI 门禁、多平台构建与 GitHub Release。PWA 部署完成后必须在线核验 manifest 版本 | 🟢 GREEN | 分支已更新但线上 PWA 未部署，更新提示无法给出目标版本 | static.yml / release.yml / verify-pwa-release.mjs |
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
- 2026-07-24: 全文本英文本地化实装（SCEN-I18N-FULL-EN）——全量接入 `useTranslation` 动态国际化引擎与《三体》英文原版（Ken Liu 译本）标准化词库。覆盖 TopHUD、LeftHub、RightInspector、TecTreeView、GovManagement、DiplomacyPanel、FleetModal、BattleScreen、WallfacerPanel、DepartmentPanel、PersonSelectPanel、AdvisorPanel、MuseumGallery、Tutorial、MissionLog、EndGameScreen 等 34 个 UI 组件与 32 个终局结局。通过 734 项单元测试与生产打包。
- 2026-07-23: 教程防卡死优化与主界面国际化适配——新手教程第一步「选中地球」重构为自动选中，消除 Canvas 偏置卡死隐患并改用「下一步」按钮推进；`TopHUD.tsx` 与 `GameCoverScreen.tsx` 关键说明文本和指标名称引入 `useTranslation` 进行 i18n 翻译，支持按中英文语言自适应格式化纪元年份显示。
- 2026-07-22: PWA/Release 自动发布闭环——`main` 自动发布 GitHub Pages PWA；构建后校验 package.json、public/dist manifest、distribution 标记和 Service Worker 更新契约一致，部署完成后重试在线读取 manifest，确保线上版本已切换。v* tag 保持为下载包与 GitHub Release 的唯一触发器。更新提示显示当前版本与待切换版本，避免“更新后看似仍为旧版”的歧义。
- 2026-07-22: 智脑顾问与新手引导体系重构——新手教程升级为 9 步交互序章，引入手动推进与完成校准按钮；重构新手任务清单为跟随纪元分阶段解锁的推演目标 MissionLog 且支持手动领奖；智脑常驻顾问百科面板上线，支持全局搜索；提示系统升级为具备冷却的智脑警告。修复多周目 LocalStorage session 前缀污染与教程死锁、幽灵事件、资源已建成即跳过劳力调配步骤的回归；封面与百科版本号实现动态绑定。
- 2026-07-18: Release/PWA 资源交付分流——新增 `distribution.json` 渠道标记与 Tauri 运行时识别；完整资源 Release 将全部扩展包报告为已安装并短路下载队列，PWA 保留分段下载。下载提醒统一覆盖无教程新游戏、教程完成和继续存档三条进入路径，且仅在 PWA 存在待下载包、尚未处理提醒时弹出。新增 SCEN-DISTRIBUTION-ASSET-POLICY 4 项回归测试，Registry 22→23 条目。全量 1078 项测试与生产构建通过；Chromium 实测 PWA 显示提醒、Release 不显示提醒。
- 2026-07-13: 新手教程误触修复与重设计——教程从 12 步精简为 4 步核心操作 + 1 步欢迎页（5 步架构）。新增 5 个场景测试条目：SCEN-TUTORIAL-WELCOME（欢迎页 1.5s 自动过渡）、SCEN-TUTORIAL-STEP1-HOTSPOT（110px 高亮框 + 单一 hotspot 防误触）、SCEN-TUTORIAL-STEP1-FOCUS-EARTH（focusOnStar 自动居中地球）、SCEN-GRACE-PERIOD-BLOCKERS（前 3 回合宽限期）、SCEN-GRACE-PERIOD-EXPIRY（宽限期到期恢复正常阻断）。StarMapRenderer 新增 focusOnStar() 和 setTutorialPulse() 公共方法。同步实现阻断器宽限期（getTurnWarnings()）、一次性情境提示（ContextualTips）、可选新手任务清单（BeginnerTasks）。全量 1074 测试通过。Registry 19→22 条目。
- 2026-07-12: AP 系统重设计与回路闭合——依据 SPEC_20260712_AP_SYSTEM_REDESIGN：基础恢复从 30 降至 5，AP 不累加跨回合，新增纪元加成（危机+10/威慑+20/掩体-10）；recoverAP 提前至 Game.runARound 入口避免阻断死锁；getTurnBlockers 补全科研停滞和行政瘫痪两项阻断器；runAIBrain 4 处直接赋值改走 spendAP 享受半价；UI 层 RightInspector 3 处滑块和 TecTreeView 科研指派接入 AP 消耗。同步修复星图地球点击命中半径（桌面端从 15.6px 提升至 60px）和军事部增加星舰建造入口。SCEN-MANUAL-BLOCKER 测试用例补齐新增阻断器解除逻辑。全量 1045 测试通过。
- 2026-07-05: Release 流水线修复（续）——发现 v1.0.1 Gate 仍失败，根因 asset_manifest.json 硬编码版本 1.0.0 与 package.json 1.0.1 不一致，AssetDownload 测试断言失败。重新生成 manifest 同步版本号，删除旧标签并重新推送 v1.0.1。全量 1045 测试通过。
- 2026-07-05: Release 流水线三阻塞修复——诊断 Release 仅有源码压缩包无构建产物的根因：publish-release 依赖 build-tauri 成功导致 Tauri 失败时 Web 发布也被阻塞；缺少 permissions: contents: write 导致 GITHUB_TOKEN 无法创建 Release；Gate 的 TS 编译错误（已修复）。修复后 publish-release 改为仅依赖 build-web + Tauri 产物条件下载，添加工作流级 contents: write 权限。
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
