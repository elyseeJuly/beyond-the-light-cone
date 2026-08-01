# 变更日志 (CHANGELOG)

本项目遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/) 规范。
关于版本发布流程及变更日志的书写标准，请参考：[GitHub Release 及版本控制计划规范](02_Project_Documentation/SPEC_20260702_GITHUB_RELEASE_PLAN.md)。

> ⚠️ **注意**: 每次更新版本都**必须**在此文档中按照格式添加相应的发布更新说明。

## [Unreleased]

### 新增 (Added)

- **人种与立绘一致性审计及修复**：新增 `AUDIT_20260801_CG_CHARACTER_RACE_AUDIT.md` 规范人种重绘，实装全新东亚华人罗辑威慑对峙 CG (`cg_deterrence_established.png`)，重组备份原版偏离设定 CG。
- **二向箔结局 CG 升级**：新增二维化死静余波结局图 (`ending_defeat_dimension_strike.png`)，提供新规格书 `ASSET_20260801_NEW_DEFEAT_ENDING_CG.md`。
- **测试体系审计**：新增 `AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md`，对 Vitest 嵌套依赖扫描、Playwright 端口冲突等隐患进行了全面评估。
- **Remotion 宣传视频生成**：新增 React 代码控制的 90 秒电影级预告片，输出复盘规格书 `EXEC_20260801_PROMO_VIDEO_CREATION_JOURNEY.md`。
- **英文剧情本地化测试**：新增 `NarrativeLocalization.test.ts` 以验证英文文本映射。

### 变更 (Changed)

- **文档库分类整理**：将 238 份项目文档从 `02_Project_Documentation` 根目录下批量整理移至 `specs_and_architecture`、`plans_and_execution` 等五大分类目录下，保持完整 Git 历史。
- **Vitest 测试配置隔离**：在 `vite.config.ts` 中排除 `video-output/**` 和 `**/node_modules/**`，解决 Vitest 对嵌套 Remotion 依赖项的误扫描问题。

### 移除 (Removed)

- **冗余图标清理**：删除了 Tauri 构建时冗余生成的 `ios` AppIcon 冗余后缀副本 (`-1.png` 系列文件)。
- **空目录清理**：移除了无用空目录 `deliverables/gstack` 及其父级。

## [v1.0.7] - 2026-07-28

本次版本为 v1.0.6 之后的热修复，聚焦解决智脑托管模式下回合推进卡死与角色死亡对账缺失。

### 修复 (Fixed)

- **智脑托管导致"下一回合"按钮永久卡死**：`Game.runAIBrain` 处理 `currentEvent` 后未清理 `this.currentEvent = null`，filteredEvent 的 `action()` 不调用 `applyEventEffect` 导致 `currentEvent` 残留，`TopHUD.hasEvent` 永真使"下一回合"按钮永久 disabled。修复为处理完事件后立即清理 `currentEvent`，并在 `runAIBrain` 末尾兜底再清一次。
- **教程期间智脑按钮可被误触开启**：`TopHUD` 的智脑切换按钮缺少 `isTutorialActive` 守卫，教程启动时虽关闭智脑但玩家可中途重开，导致智脑与教程状态机争夺回合推进控制权。修复为教程期间按钮 `disabled` 并显示"教程中"占位。
- **角色死亡对账方法缺失与讣告登场门控**：修复 `reconcilePersonDeaths` 调用缺失导致角色寿命未正确同步，并增加讣告仅对本局已登场角色触发的门控逻辑。

### 优化 (Optimized)

- **生产构建关闭 sourcemap**：`vite.config.ts` 的 `build.sourcemap` 从 `true` 改为 `false`，避免生产产物暴露源码映射文件。
- **遥测版本号同步**：`StatisticsManager` 的遥测 payload 版本号从陈旧的 `0.9.0-beta` 更新为 `1.0.7`。
- **runAIBrain 回归测试补充**：新增 `AIBrainEventCleanup.scenario.test.ts`，覆盖事件 action 不调用 `applyEventEffect` 时 `currentEvent` 仍被正确清理的回归断言。

## [v1.0.6] - 2026-07-26

本次版本合并主线模拟审计能力与最新教程、移动端交互迭代，并修复 PWA/桌面 Release 的版本漂移和发布门禁缺口。

### 新增 (Added)

- **Headless Game Simulation Harness**：新增确定性 seed、策略接口、运行时不变量、失败轨迹、精确重放、回归种子库与多 seed 平衡矩阵。
- **可达性与 Flag 因果审计**：记录实际触发的事件、Flag、纪元和结局，识别 producer-only、consumer-only 与 orphan 状态。
- **长周期 Soak**：新增 500 回合级多策略稳定性矩阵，检测异常、事件死锁与回合尝试上限。
- **移动端快捷控制**：底部导航加入紧凑 BGM 播放控制与系统设置入口。

### 优化 (Optimized)

- 教程在新游戏开始后立即挂载，不再让玩家短暂进入无引导界面。
- 地球选择改为玩家点击高亮热点后触发，避免移动端信息抽屉提前弹出。
- 教程黄金路径 E2E 与当前 8 步手动推进流程同步，使用稳定语义标识。
- PR CI 使用 Chromium 核心门禁，`main` 保留完整浏览器矩阵；Nightly 分层运行 balance、reachability 和 soak。

### 修复 (Fixed)

- 修复事件效果只限制单次变化、未限制最终值，可能把军力与威慑度扣成负数的问题。
- 修复新手教程采矿比例基线随重渲染变化，导致资源生产步骤无法完成的问题。
- Web、PWA 资源清单、Cargo 与 Tauri 版本统一为 `1.0.6`，PWA 缓存前缀改为跟随包版本。
- Release 版本门禁扩展为校验标签、package、lockfile、资源清单、Cargo 与 Tauri 配置。
- 稳定版 Release 仅在 Web、Windows 和 macOS 产物全部成功后发布，并强制检查 ZIP、MSI、EXE、DMG。
- GitHub Actions 统一升级到 Node.js 22，满足当前 Wrangler/Miniflare 依赖要求。
- 修复 WebKit/mobile-safari 上教程步骤切换时高亮框滞留旧坐标导致的 E2E 假阳性偏差，新增 `waitForHighlightAligned` 轮询直到高亮框中心与目标中心对齐。
- 修复 Windows Tauri 构建因 `resolveJsonModule` 将异构 `expansion.assets` 数组推断为 `never[]` 而报 TS2339（`packId`/`id` 属性不存在），将 `asset_manifest.json` 导入显式断言为 `AssetManifest` 类型。

## [v1.0.5] - 2026-07-24

本次更新按 AUDIT_20260721 审计推荐顺序完成新手教程三阶段重构，系统性解决坐标系统不统一、教程通过旁路事件绕过真实交互、测试同样绕过真实交互、启动/提示/任务清单依赖共享布尔状态和延迟副作用、目标丢失时缺少恢复路径五大架构问题。

### 新增 (Added)

- **教程坐标几何模块 (tutorialGeometry.ts)**：抽出纯函数几何计算（高亮框、4块拼接遮罩、卡片定位、指引箭头），统一 DOM 与 Canvas 坐标转换，修复移动端横屏 0.85 缩放下双重错位。
- **教程步骤配置模块 (tutorialSteps.ts)**：引入 `SemanticTutorialEvent` 枚举（8 类语义事件）替代字符串 stepId 分支，声明每个步骤的完成事件类型与可选即时校验函数。
- **教程状态机模块 (tutorialMachine.ts)**：轻量状态机类封装 step 索引、语义事件派发、目标缺失超时恢复（3s + Toast），welcome 1.5s 自动过渡定时器由状态机内部管理避免 React effect 重跑重入。
- **教程进度版本化模块 (tutorialProgress.ts)**：`game-tutorial-seen` 布尔值升级为 `{version, completedAt}` 结构，教程内容重大改版时递增 `TUTORIAL_PROGRESS_VERSION` 即可让老玩家自动重新触发新版教程，旧版记录自动迁移为 legacy。
- **横屏坐标验证 E2E 测试 (tutorial-coordinates.spec.ts)**：6 用例覆盖横屏 DOM 高亮误差 ≤4px、地球点击命中、focusOnStar 居中、坐标互逆性、桌面端无缩放、旋转屏幕连续性。
- **教程鲁棒性 E2E 测试 (tutorial-robustness.spec.ts)**：4 用例覆盖目标缺失时遮罩切换、UI 可点击性、教程卡片交互性、目标延迟挂载恢复。
- **步骤成本提示 (costHint)**：build-stope / resource-production / start-research 步骤描述下方显示资源/AP 消耗（30 经济 / 10 AP / 20 AP），与核心层成本值一致。

### 优化 (Optimized)

- **教程真实用户交互 E2E**：重写 tutorial-guided.spec.ts 为真实点击/拖动操作，替换 `page.evaluate` 旁路修改状态，覆盖 click-earth 宽容点击、build-stope 真实建造、resolve-event StoryModal 真实选项。
- **Tutorial.tsx 状态机驱动重写**：移除全部 `stepId === 'xxx'` 字符串分支与 300ms 轮询，改用状态机 `subscribe()` 驱动 React 重渲染，行数从 680 精简至 580。

### 修复 (Fixed)

- **P0-1 移动端横屏坐标双重错位**：建立唯一坐标转换层 `canvasToViewport` / `viewportToCanvas`，统一 DOM 元素与 Canvas 星球坐标计算，纳入 `transform: scale(0.85)` 缩放系数。
- **P0-2 focusOnStar 居中公式不正确**：修正公式，地球缩放后正确居中到视口中央。
- **P0-3 星图命中区域异常巨大**：重设计命中算法为 `Math.max(visualRadius * 4 + 100, 44)`，地球给 60px 命中区。
- **P0-4 E2E 测试绕过真实交互**：重写测试为真实用户点击，替换 `page.evaluate` 旁路。
- **目标缺失锁屏**：步骤配置 highlightTarget 但目标元素未渲染时，渲染 `tutorial-overlay-missing`（pointer-events-none）而非全屏拦截遮罩，玩家仍可操作游戏 UI。
- **StoryModal 关闭后重新弹出的根因**：App.tsx 传递内联 `onComplete` 导致 Tutorial 组件 `completeStep` 依赖变化、`useEffect` 反复重跑重新注入测试事件；修复为用 `useCallback` 稳定回调 + ref 标记事件注入状态。

## [v1.0.4] - 2026-07-22

本次更新对新手教程进行了全面重构，将其转型为“不太聪明但有用”的「智脑顾问」引导体系，保留游戏内的自动托管代打，同时彻底移除了主菜单上的托管开关。此外，也并入了 PWA 资源策略分流及跨周目状态清理的修复。

### 新增 (Added)

- **智脑战术数据百科 (AdvisorPanel)**：新增常驻战术数据百科面板（包含基础产出、战略与行政、终局胜利路线等模块），支持全局模糊搜索。可在主菜单及游戏内随时呼出。
- **纪元推演任务链 (MissionLog)**：重构新手任务清单为跟随危机、威慑、广播/掩体纪元渐进解锁的任务日志系统，提供针对性推演建议并可点击领取资源奖励。
- **新手教程 9 步交互序章**：将静态教程重构为 9 步智脑开机校准流程，引导完成选中地球、监控三维产出、建设采矿场、调配劳力比例、启动天文观测、应对突发危机。
- **智脑警告与情境提示**：重写 ContextualTips，针对矿产下降、稳定度低、威慑度危急等风险引入冷却机制，发出标准格式的智脑报警 Toast。

### 优化 (Optimized)

- **PWA 进入游戏下载提醒**：新游戏跳过教程、完成教程或继续存档进入游戏时，若仍有未缓存扩展包且玩家尚未处理提醒，则显示资源下载选择弹窗。
- **教程三态推进判定**：为纯阅读步骤、危机处理及谢幕步骤设计三态推进逻辑，支持手动的「下一步」与「完成校准」按钮，代替自动等待。

### 修复 (Fixed)

- **LocalStorage 跨周目污染**：统一引入 `session:` 命名前缀规范并支持正则遍历批量清除，彻底解决新开局时老周目任务和警告冷却残留的问题。
- **教程流程卡死与幽灵事件**：补全 `build-stope` 与 `resolve-event` 的校验分支；在教程步骤 8 中增加专属测试事件的检测与防重复注入逻辑，防止玩家卡死。
- **Release/PWA 资源策略分流**：Web Release 与 Tauri 桌面版将随包扩展资源直接识别为已安装，不再显示约 370MB 的伪下载提示，也不再重复读取资源建立下载状态。
- **Tauri 桌面版本同步**：同步更新 `src-tauri/Cargo.toml` 与 `Cargo.lock` 中的 Tauri 后端包版本至 `1.0.4`（之前滞留在 `1.0.2`）。
- **发行渠道识别稳定性**：Release 流水线为 Web 压缩包写入发行渠道标记；PWA Service Worker 不缓存该标记，避免 Release 被旧缓存误识别为 PWA。

## [v1.0.3] - 2026-07-13

新手教程全面重设计，解决玩家反馈的"教程点击地球经常误触"问题。同步优化回合阻断器对新玩家的友好度。

### 新增 (Added)

- **教程欢迎页**：教程启动时显示"序幕"欢迎页（"文明的故事，从这里开始。"），1.5 秒后自动进入操作步骤，给玩家仪式感与思考空间。
- **教程地球呼吸光环**：星图引擎新增 `setTutorialPulse()` 接口，教程步骤 1 中地球周围显示青色呼吸光环（3 圈呼吸 + 1 圈虚线内环），在拥挤星海中明确指引目标。
- **教程自动居中地球**：星图引擎新增 `focusOnStar()` 接口，教程步骤 1 启动时自动将地球居中到屏幕中央并缩放 1.5x，无论玩家之前停留在哪个星区。
- **阻断器宽限期**：前 3 回合内"科研停滞"与"部门首长空缺"降级为警告（不阻断回合推进），资源崩盘与经济危机仍正常阻断。下一回合按钮在有警告时显示琥珀色呼吸动画。
- **一次性情境提示**：首次遇到 AP 不足、进入科技树、进入政府管理、回合被阻断、稳定度偏低、纪元切换等场景时，通过 Toast 显示简短提示，每设备仅出现一次。
- **可选新手任务清单**：教程完成后显示可折叠任务清单（完成第一项科技、任命部长、拥有采矿场、拥有加工厂、处理事件），点击任务可跳转对应界面，不阻断游戏。

### 优化 (Optimized)

- **教程精简**：强制教程从 12 步压缩为 4 步核心操作（选中家园 → 资源生产 → 启动科研 → 推进回合）+ 1 步欢迎页，每步文案不超过 25 个汉字。
- **教程操作验证**：移除"下一步"按钮，每步通过真实操作验证（事件监听 + 轮询）自动推进，仅保留"跳过教程"。

### 修复 (Fixed)

- **修复教程点击地球误触**（5 个根因）：
  - 教程高亮框从 40×40px 扩大到 110×110px，覆盖星图引擎 60px 实际命中区域。
  - 步骤 1 用单一 `<button>` hotspot 替代 4 块分块遮罩，彻底消除遮罩接缝处的点击漏点。
  - 步骤 1 启用"宽容点击"模式：高亮框内任意位置点击都算选中地球，不再依赖精确命中。
  - 修复移动端横屏缩放未纳入 hotspot 物理像素换算导致的位置错位。
  - 修复教程未预先定位地球导致玩家在银河系区域找不到地球的问题。

## [v1.0.2] - 2026-07-10

修复 E2E 测试与 Cloudflare 部署问题。

### 修复 (Fixed)

- 修复 E2E 测试断言：归档视图标题断言修正为"岁月史书"，移动端教程结束按钮文本断言修正为"开始"。
- 修复 `asset_manifest.json` 版本号与 `package.json` 不一致导致 CI 测试失败。
- 修复 Cloudflare Pages 纯静态资产托管模式下跳过构建的问题：引入最小 Worker 代理强制激活云端 Vite 编译。

## [v1.0.1] - 2026-07-05

修复 Release 流水线阻塞问题。

### 修复 (Fixed)

- 修复 Release 流水线阻塞：9 个 TypeScript 编译错误（未使用变量/类型不匹配）+ 3 个测试运行时错误（EventBus.emit 防御性 handlers 初始化、GameInstance.reset() setTimeout 空值守卫）
- 核实三项 Bug 修复（SCEN-EVENT-FREEZE / SCEN-TOPHUD-ZINDEX / SCEN-EVENTBUS-COMPAT）与 5 项审计修复无冲突
- 全量测试 1045 通过，0 错误

## [v1.0.0] - 2026-07-03

《光锥之外：纪元往事》正式版。自 Beta 以来历经大规模功能扩充、全面移动端适配与系统级深度打磨，正式达到 1.0 完整体验标准。

### 新增 (Added)

- **两条新中性结局**：新增「永恒的流亡」与「宇宙静默」，结局总数扩展至 **12 种**，覆盖胜利、失败与中性三大结局类型。
- **岁月史书 · 纪元浮光 CG 图鉴**：全新图鉴页签，收录 **23 个重大历史事件 CG**（含智子锁死、水滴到达、二向箔降临、银河远征等），可根据游玩记录自动解锁并支持全屏高清预览。
- **岁月史书 · 结局图鉴**：完整收录全部 12 种结局卡片，含达成判定与解锁状态展示。
- **星海留声机**：游戏内音乐播放器，玩家可自由选择背景音乐，含全部纪元 BGM 及结局专属音轨的解锁试听。
- **各结局专属独立 BGM**：征服、威慑、流浪、背叛失败、灭绝失败、氦闪失败、二向箔失败等结局均配置了独立专属音轨，不再复用。
- **新手引导教程**：全步骤可点击式引导教程，带史诗风格高亮遮罩（四切片方案），完整覆盖 PC 与移动端。
- **游戏开始封面主菜单**：新增封面启动页，包含开始游戏、设置、退出等完整路径。
- **外星文明两阶段接触系统**：文明发现与正式接触分为独立弹窗事件，防止剧情提前泄露。
- **Tauri 桌面客户端**：支持打包为 Windows x86_64 及 macOS Apple Silicon 原生应用。
- **Cloudflare Pages 部署支持**：新增 `wrangler.jsonc` 配置与 SPA 路由兼容。
- **全自动 Release 发布流水线**：新增 `release.yml`，推送 `v*` tag 即触发 CI 门禁 → 多平台构建 → GitHub Release 自动发布。
- **设置面板扩充**：新增问题反馈直达 GitHub Issues 按钮，以及本地存储空间与 CG 缓存监控面板。

### 优化 (Optimized)

- **移动端 UI 全面重构**：TopHUD、LeftHub、BottomEventBar 均针对竖屏与横屏进行了适配，解决标签截断、按钮裁剪、面板叠压等问题。
- **CG 美术资源统一适配**：全部 43 张 CG 图统一裁切为 21:9 宽屏比例，彻底消除拉伸与黑边。
- **美术风格统一**：事件 CG 统一为 Craig Mullins 史诗写实风格，NPC 角色立绘统一为工笔赛博朋克风格。
- **岁月史书与纪元志解耦**：两大模块拆分为独立入口与界面，逻辑互不干扰。
- **结局界面视觉升级**：去除全屏黑色遮罩，结局 CG 以最高清晰度全幅展示；出戏 Emoji 替换为 Lucide React 图标体系。
- **角色任命系统同步**：每回合自动检测角色寿命，逝世角色实时从政府阁员任命列表中剔除并触发讣告。
- **纪元背景音乐切换**：结局触发时纪元 BGM 自动淡出，彻底消除与结局专属音乐的冲突叠播。
- **PWA 稳定性**：修复 GitHub Pages 部署下 Service Worker 激活挂起问题，修复 iOS apple-touch-icon 适配。
- **测试体系扩容**：单元/集成测试从 514 个用例扩展至 **903 个，覆盖 45 个测试套件**，全部通过。
- **数值平衡**：修复资源增长速率异常，优化 AI 模式默认参数，调整地球初始建筑配置。

### 修复 (Fixed)

- 修复 CI 流水线 TypeScript 编译错误（未使用变量、React import 遗漏）。
- 修复 Playwright E2E baseURL 在 CI 环境下的错误路径问题。
- 修复外交面板在特定事件触发前提前暴露外星文明名称的问题。
- 修复教程高亮遮罩遮挡目标元素导致无法点击的问题。
- 修复故事弹窗的高 z-index 遮盖教程层的问题。
- 修复游戏内预览音乐时背景音乐未暂停、点击后自动恢复的问题。
- 修复 CG 资源加载失败时缺少 fallback 的问题。
- 修复部分结局 CG 图片路径解析错误的问题。
- 修复角色逝世状态未同步至核心引擎 `isAlive` 属性，导致已故角色仍可出现在任命列表的问题。

## [v0.9.0-beta] - 2026-06-21

这是《光锥之外：纪元往事》的首个 Beta 测试版本，主要目的是进行设备兼容性测试、PWA功能验证及收集核心玩家反馈。

### 新增 (Added)
- **部署配置**：新增 `gh-pages` 部署脚本，自动化发布到 GitHub Pages。
- **玩家反馈**：在游戏内的侧边栏增加了直达 GitHub Issues 的 Feedback 反馈通道。
- **埋点统计**：引入 `StatisticsManager` 统计玩家的游玩时间、不同结局达成次数、事件触发率以及科技研究进度（数据支持本地缓存并在具备服务条件时上传）。
- **版本控制体系**：新增版本声明与 CHANGELOG 变更日志记录规范。

### 优化 (Optimized)
- **PWA 功能**：优化 Web App Manifest 及更新提示（Update Prompt）、横屏提示（Orientation Prompt）。
- **术语字典与文档**：代码库与项目规范全面审计，修复了部分代码实体（如 `Science` 与 `Culture`）中的定义歧义。
- **类型安全**：重构并清理了 `PersonManager` 和 `GameEventManager` 中涉及联合类型或硬编码的隐患。

### 修复 (Fixed)
- 修复了 PWA 在离线状态下的缓存失效风险。
- 修复了测试框架中的冗余代码与测试报告归档错位问题。
