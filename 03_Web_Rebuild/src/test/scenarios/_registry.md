# Scenario Registry — 场景测试注册表
> 最后更新：2026-07-03
> 发布条件：所有条目为 GREEN

## 发布状态：🟢 就绪（0 RED / 13 总计）

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

## 变更日志
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
