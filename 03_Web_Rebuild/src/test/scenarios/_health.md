# Project Health Dashboard — 项目健康仪表盘
> 最后审视：2026-07-27
> 审视周期：每周一次 或 里程碑节点

## 总体健康：🟢（0 🔴 / 1 🟡 / 10 🟢）

| 维度 | 指标 | 状态 | 具体数据 | 建议行动 |
|------|------|------|---------|---------|
| 架构 | 单文件最大行数 | 🟡 | Game.ts 约1740行（+GameSerializer.ts 268行） | AP 系统改动小幅增加行数，后续可继续拆分子系统 |
| 架构 | Flag 系统耦合度 | 🟢 | FlagManager 封装 | FlagManager 包装 flags Set，提供 isSet/set/unset API，与原始 Set 共享引用，100% 存档兼容 |
| 架构 | AP 系统回路闭合 | 🟢 | 已修复 | 依据 SPEC_20260712_AP_SYSTEM_REDESIGN：UI 接入 AP 消耗、阻断器补全 4 项、AI 走 spendAP 半价、recoverAP 提前至回合入口；8 场景建模无死锁 |
| 架构 | EventBus 兼容性 | 🟢 | 旧事件名兼容 | emitLegacy 同时派发新旧事件名，保证迁移过渡期 React 组件旧监听器不失效；emitToWindow 别名保留向后兼容 |
| 架构 | 智脑托管回合推进 | 🟢 | 已修复 | runAIBrain 处理 currentEvent 后强制清理 this.currentEvent=null 并末尾兜底清理，避免 filteredEvent 的 action() 不调用 applyEventEffect 导致 currentEvent 残留、TopHUD.hasEvent 永真使"下一回合"按钮永久 disabled；教程期间智脑按钮 disabled 避免与教程状态机冲突 |
| 性能 | 1000事件压力测试 | 🟢 | 通过 | 持续关注长局内存与性能表现 |
| 内容 | 设计文档 vs 代码一致性 | 🟢 | 已解决 | 原 3 处偏离 (D01-D03) 已通过 SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE.md 确认为权威设计，并编写 SCEN-DESIGN-DRIFT 17 项验证测试 |
| DevOps | PWA/Release发布流水线 | 🟢 | v1.0.6 已正式发布，4 产物全量上线 | static.yml 构建并校验 PWA bundle、部署后在线核验 manifest；release.yml 在 ZIP、MSI、EXE、DMG 全部成功后才发布稳定版。v1.0.6 Release 已发布：Web ZIP 353.7MB / Windows MSI 348.2MB / Windows EXE 349.5MB / macOS DMG 355.5MB |
| 架构 | 资产按需下载功能 | 🟢 | 已接入主循环 | AssetLoader.downloadEraPack + preloadNextEra 已接入 Game.ts 纪元更替生命周期；manifest 分类覆盖率 99.3%（uncategorized 从 41% 降至 0.7%） |
| 架构 | 发行渠道资源策略 | 🟢 | Release/PWA 已分流 | Web Release 由 distribution.json 标记、Tauri 由运行时识别；Release随包资源直接可用，PWA 保留进入提醒与分段缓存 |
| UI | 弹窗层叠秩序 | 🟢 | z-index 规范化 | TopHUD z-50 / StoryModal z-100 / 封面 z-150 / 设置 z-200 / 教程 z-1000，不再有越权覆盖 |
| UI | 新手教程与智脑顾问 | 🟢 | 序幕 + 8 步真实交互 + 任务链 + 战术百科 | 欢迎页手动启程；选中地球、建造、劳力调配、研发与回合推进均由真实玩家交互驱动；常驻 AdvisorPanel 支持搜索，MissionLog 支持分阶段解锁与手动领奖。教程期间智脑按钮禁用避免冲突。 |

## 审视日志
- 2026-07-27: v1.0.7 候选审视——修复智脑托管导致"下一回合"按钮永久卡死的严重 bug。根因：`Game.runAIBrain` 处理 `currentEvent` 后未清理 `this.currentEvent = null`，filteredEvent 的 `action()` 不调用 `applyEventEffect` 导致 `currentEvent` 残留，`TopHUD.hasEvent` 永真使按钮永久 disabled。修复为处理完事件后立即清理 + 末尾兜底清理。同步修复教程期间智脑按钮可被误触开启（加 `disabled={isTutorialActive}` 守卫）、教程步骤跳转过快（click-earth 改为玩家点击 hotspot 触发）、教程与游戏初始操作冲突（移除 500ms 延迟）、移动端音乐/设置按钮消失（新增 BgmPlayer 紧凑模式 + 设置按钮）。新增"智脑托管回合推进"维度为 🟢。全量 1089 项测试通过，TypeScript 0 报错。总体健康保持 🟢（0🔴/1🟡/10🟢）。
- 2026-07-27: v1.0.6 稳定版正式发布——修复 Windows Tauri 构建因 `resolveJsonModule` 将异构 `expansion.assets` 数组（约 100 项，shape 不一致）在 Windows MSVC 下推断为 `never[]` 而报 TS2339（`packId`/`id` 属性不存在），将 `DistributionChannel.scenario.test.ts` 中 `asset_manifest.json` 导入显式断言为 `AssetManifest` 类型（`as unknown as AssetManifest`，因 `latestPatch: null` 与 `string | undefined` 不兼容需经 `unknown` 中转）。v1.0.6 标签从 `ba0b5a9` 强制更新到 `9762a77` 重新触发 Release Pipeline #30232947054，全部 5 个 job 通过：CI Gate（TypeCheck + Test + Build + E2E）/ Build Web Archive / Build Tauri (windows-x64) / Build Tauri (macos-arm64) / Publish GitHub Release。GitHub Release 发布 4 个产物：Web ZIP 353.7MB、Windows MSI 348.2MB、Windows EXE 349.5MB、macOS DMG 355.5MB。同步追加 WebKit/mobile-safari 教程步骤切换时高亮框滞留旧坐标的 E2E 假阳性修复（`waitForHighlightAligned` 轮询对齐）。
- 2026-07-26: v1.0.6 发布审视——修复教程地球按钮因父级 `pointer-events-none` 无法真实点击、851×390 等短横屏下封面新教程按钮被页头覆盖、采矿劳力滑块测试只改 DOM 未提交游戏状态三项问题；版本号统一到 package、lockfile、Tauri、Cargo、资源清单与 Service Worker 缓存；稳定 Release 改为 Web ZIP、Windows MSI/EXE、macOS DMG 缺一不可。验证结果：1089 项单测通过、覆盖率门禁通过、生产构建与 PWA 契约通过、Cargo 检查通过、Chromium 22/22 及 Firefox/WebKit/mobile-safari 风险集 36/36 通过。
- 2026-07-24: 批量提取脚本与全量英文本地化闭环——使用 Node 批量脚本（`batch_localize.cjs`）扫描修补 `MuseumGallery.tsx`、`AssetDownloadPromptModal.tsx`、`AnnouncementBoard.tsx` 等遗留组件中的硬编码中文与未包 `t()` 的渲染字段；补充 `i18n.ts` 的 `enDictionary` 中的 CG 绝密事件、按钮与系统提示词条。全量 734 项单元测试与 TypeScript 0 报错验证通过。
- 2026-07-24: 教程体验深度优化与主页设置实装——①新增主菜单「游戏设置」入口，能够直接唤醒 `SettingsModal` 进行音频/教程重置；②优化新手教程遮罩透明度（bg-[#050810]/65 和 /80 -> /20 和 /30），降低暗度使游戏页面背景与功能更加清晰可见；③修复拖动滑块不断触发 AP 消耗（导致 100AP 瞬间归零）的严重 bug，重构 `RightInspector.tsx` 占比滑块为拖动时仅改变本地状态，鼠标释放时才单次触发 `adjustWorkerRatio` 并消耗 AP；④教程进程下 `canSpendAP` 始终返回 `true`，并在科技研发步骤启动时自动防御性为玩家补足 50 AP，且在非 `next-turn` 步骤锁定并禁用「下一回合」按钮，防止玩家误触导致 AP/数据状态跑偏。
- 2026-07-24: 全文本英文本地化全量完成——完成核心 UI 界面、科技树节点、部门政策、情报外交、星际遭遇战、面壁者/执剑人控制台、智脑百科、岁月史书、文明博物馆、8 步新手教程、任务日志、危机警报与 32 个终局结局的英文字典封装。所有专有名词及角色译名与刘宇昆（Ken Liu）翻译的《三体》英文版（The Three-Body Problem）保持完全一致。全量 734 项单元测试与 TypeScript 0 报错验证通过。
- 2026-07-23: 教程防卡死优化与主界面国际化适配——①新手教程第一步「选中地球」重构为自动选中机制，玩家进入时自动定位并程序化触发选中，消除 Canvas 偏置导致的“点不中”死锁，并增加手动「下一步」按钮平滑推进；②主界面国际化适配，引入 `useTranslation` 翻译包装了 `TopHUD.tsx` 与 `GameCoverScreen.tsx` 中的关键说明文本、指标名称以及指示说明，并支持按语言自适应格式化纪元年份（如危机纪元第X年 vs Crisis Era Year X）。单元测试与类型检查全部通过。
- 2026-07-22: PWA 发布闭环——定位到线上 GitHub Pages 仍停留 v1.0.3 的原因是 v1.0.4 尚在工作分支、Pages 仅监听 main。新增 PWA bundle 版本契约校验与部署后在线 manifest 核验，确保 main 合并后的 Pages 版本可证；更新提示展示当前/目标版本。下载版仍需显式 v* tag，避免普通 main 提交误发安装包。
- 2026-07-22: 智脑顾问与新手引导体系重构——主菜单移除托管开关并替换为「智脑顾问 (游戏百科)」面板入口，游戏内 HUD 智脑托管与百科入口双重保留；教程升级为 9 步开机校准流程，补齐判断逻辑并提供「下一步/完成校准」三态按钮；应对危机步骤在队列为空时自动注入专属测试事件；重构新手任务为随纪元渐进解锁并可手动领奖的任务日志 (`MissionLog.tsx`)；重构 tips 为具备冷却机制的智脑警告，以统一 `session:` 前缀规范清理跨周目 LocalStorage 污染。同步修复封面与百科面板的版本号为动态引用，以及采矿场完成后教程未等待实际劳力调配便跳过步骤的回归。全量 1069 项单元测试通过。
- 2026-07-18: Release/PWA 资源交付策略修复——完整资源 Web/Tauri Release 不再沿用 PWA 的 IndexedDB 下载判定，不显示约 370MB 伪下载提示，不重复 fetch 随包资源；PWA 在无教程新游戏、教程完成或继续存档进入时统一检查并提醒尚未缓存的扩展包。Service Worker 排除发行渠道标记缓存，防止 Release 被构建期默认值误判。Tauri 版本同步至 1.0.3。新增 SCEN-DISTRIBUTION-ASSET-POLICY 4 项回归测试；全量 1078 项测试、生产构建与 Chromium 双渠道实测通过。总体健康保持 🟢（0🔴/1🟡/9🟢）。
- 2026-07-13: 新手教程误触修复与重设计——教程从 12 步精简为 4 步核心操作 + 1 步欢迎页（5 步架构）。修复 5 个误触根因：①教程高亮框 40px 扩大到 110px 覆盖 StarMapRenderer 60px 命中区；②步骤 1 用单一 `<button>` hotspot 替代 4 块分块遮罩消除接缝漏点；③StarMapRenderer 新增 `focusOnStar()` 自动居中地球到屏幕中央并缩放 1.5x；④StarMapRenderer 新增 `setTutorialPulse()` 呼吸光环视觉引导；⑤移动端 landscape 缩放纳入 hotspot 物理像素换算。同步实现阻断器 3 回合宽限期（前 3 回合科研停滞与部门空缺降级为警告不阻断）、一次性情境提示（ContextualTips 组件）、可选新手任务清单（BeginnerTasks 组件）。新增 SCEN-TUTORIAL-WELCOME/SCEN-TUTORIAL-STEP1-HOTSPOT/SCEN-TUTORIAL-STEP1-FOCUS-EARTH 三个场景测试。全量 1074 测试通过。"新手教程可用性"维度新增为 🟢。总体健康 🟢（0🔴/1🟡/8🟢）。
- 2026-07-12: AP 系统回路闭合 + 星图点击 + 军事部星舰入口 —— 依据 SPEC_20260712_AP_SYSTEM_REDESIGN 完成 AP 系统重设计：基础恢复 30→5、AP 不累加跨回合、新增纪元加成（危机+10/威慑+20/掩体-10）；recoverAP 提前至 Game.runARound 入口避免阻断死锁；getTurnBlockers 补全科研停滞和行政瘫痪两项阻断器；runAIBrain 4 处直接赋值改走 spendAP 半价；UI 层 RightInspector 3 处滑块和 TecTreeView 科研指派接入 AP 消耗。同步修复星图地球点击命中半径（桌面端从 15.6px 提升至 60px，与移动端对齐）和军事部增加星舰建造入口（与地球 FleetModal 打通）。8 场景建模验证无死锁，全量 1045 测试通过。"AP 系统回路闭合"维度新增为 🟢。总体健康 🟢（0🔴/1🟡/7🟢）。
- 2026-07-10: 修复 E2E 测试与 Cloudflare 部署反复失败故障 —— ① E2E 测试修复：修正 `core-flow.spec.ts` 归档视图标题断言为 `"岁月史书"`；修正 `tutorial-guided.spec.ts` 移动端教程结束按钮文本断言为 `"开始"`（自适应屏幕尺寸）。② 修复 `AssetDownload.scenario.test.ts` 版本号一致性断言：因本地版本号升至 `1.0.2` 时未重新生成 `asset_manifest.json`，导致 CI 测试中发生版本号冲突失败，通过重新运行 `npm run generate-manifest` 刷新清单并提交解决。③ Cloudflare 部署修复：定位到纯静态 assets 托管模式下 Cloudflare Pages 跳过 `build.command` 的免构建陷阱，通过在根目录引入最小 Worker 代理 `src/worker.js` 并配置 `"main": "src/worker.js"` 强制激活云端 Vite 编译，打通 Cloudflare Pages/Workers CI/CD 流水线。
- 2026-07-05: Release 流水线修复（续）——v1.0.1 Gate 因 asset_manifest.json 硬编码版本 1.0.0 与 package.json 1.0.1 不一致而失败，AssetDownload 场景测试断言 manifest.version === pkg.version 未通过。重新生成 manifest 同步版本号，删除旧标签重新推送 v1.0.1。建议：版本号来源统一为 package.json，manifest 生成应纳入 CI 构建步骤。
- 2026-07-05: Release 流水线三阻塞修复——诊断 v1.0.0 Release 仅有源码压缩包的原因：① publish-release 依赖 build-tauri 成功 → Tauri 失败时 Web 发布被阻塞；② 缺少 permissions: contents: write → GITHUB_TOKEN 无法创建 Release；③ Gate 的 TS 编译错误（已修复）。修复后 publish-release 仅依赖 build-web，Tauri 产物条件下载，工作流级 contents: write 权限。Release 流水线从 🔴 转 🟢。
- 2026-07-05: 三项修复核实与 Release 流水线修复——核实 SCEN-EVENT-FREEZE、SCEN-TOPHUD-ZINDEX、SCEN-EVENTBUS-COMPAT 三项修复与 5 项审计修复无冲突、互为补充。修复 Release 流水线阻塞：9 个 TS 编译错误（未使用变量/类型不匹配）+ 3 个测试运行时错误（EventBus.emit 防御性 handlers 初始化 + GameInstance.reset() setTimeout 空值守卫）。全量 1045 测试 0 错误通过。
- 2026-07-05: EventBus 兼容性断裂修复——emitLegacy 改为同时派发新旧事件名，修复 App.tsx 所有旧监听器失效（教程不弹、下一回合无反应、科技研发异常）。新增 emitToWindow 别名。同步修复 TopHUD z-index（z-1010 降回 z-50）和 StoryModal 冻结（直接入队事件 choice 补 applyEventEffect）。新增 SCEN-EVENT-FREEZE、SCEN-TOPHUD-ZINDEX、SCEN-EVENTBUS-COMPAT 三个场景条目。"EventBus 兼容性"和"弹窗层叠秩序"维度新增为 🟢。全量 936 测试通过。
- 2026-07-03: 设计偏离修复——原 3 处偏离 (D01-D03: 文化公式、纪元扩展、年份递增) 已通过创建 SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE.md 确认为权威设计基准。新增 SCEN-DESIGN-DRIFT 场景测试（17 项）验证 7 大设计决策一致性。"设计文档 vs 代码一致性"从 🟡 转 🟢。总体健康 🟢（0🔴/1🟡/5🟢）。
- 2026-07-03: 三项遗留债务修复——①Flag 系统解耦（FlagManager 封装 flags Set，共享引用实现 100% 存档兼容）；②Release 流水线（.github/workflows/release.yml + tools/extract-changelog.sh + tools/sync-version.sh）；③Game.ts 拆分（提取 GameSerializer.ts 268行，Game.ts 从 1900→1721 行）。Flag 耦合和 Release 流水线从 🔴 转 🟢。总体健康 🔴→🟢（0🔴/2🟡/4🟢）。文档膨胀 🔴 仍为唯一遗留项（按用户指示不处理游戏文档）。
- 2026-07-03: 资产按需下载功能从 🔴 修复为 🟢。Game.ts updateEpoch 接入 assetLoader.downloadEraPack + preloadNextEra（fire-and-forget）；generate-manifest.mjs detectEra 算法重构，人物立绘归 characters 包、结局 CG 归 endings 包、扩展 7 纪元关键词覆盖，uncategorized 从 41% 降至 0.7%；版本号硬编码统一从 package.json 读取。新增 AssetDownload.scenario.test.ts 11 项测试，全量 886 项测试通过。总体健康从 🔴 转为 🟡。
- 2026-07-03: 新增两项重大技术债：1. 缺乏 GitHub Release 自动化部署流水线；2. 资产分模块下载系统处于骨架完备但零接入游戏循环的状态。总体健康转为 🔴。
- 2026-06-29: 取消 TopHUD 核心指标的响应式隐藏，在所有分辨率下常驻显示稳定度、人口、资源、军力、威慑度（解决部分面板显示空缺问题）。解耦文明博物馆与岁月史书，主页封面显示文明博物馆，游戏操作内独立渲染岁月史书双轨时间轴面板。通过全量 875 项自动化测试验证。
- 2026-06-29: 按照 SPEC_20260621_RESPONSIVE_LAYOUT.md 4.1 节规范重新实现 TopHUD 响应式布局：h-[56px] md:h-[72px]，Tailwind 断点控制（hidden md:block / hidden lg:block），移动端隐藏人口/资源/军力，平板显示人口，桌面全密度。SCEN-HUD-RESPONSIVE 测试更新为双断点（mobile 375px + desktop 1280px）验证。Registry 描述更新为与共识一致。
- 2026-06-29: 修复教程侧边栏重复类别按钮（v3）— 根本原因：reduce 按连续步骤分组，'基础操作' 在步骤0-2和10-11出现两次导致同名按钮。修复：改为按 unique name 去重（Set/find 模式）。同时恢复 TopHUD 原始设计：添加 CivLevel 显示、固定 h-[72px]、恢复 z-50、稳定度公式加入 popFactor、6纪元恢复、下拉菜单恢复人口基数。
- 2026-06-29: 修复教程分类语义对齐（步骤1-3,11,12 从 '岁月史书' → '战略星图'，与 activeView: 'starmap' 一致）+ TopHUD z-index 提升至 z-[1010] 确保教程期间可见。Registry 全绿。
- 2026-06-29: 发现教程覆盖层 z-[1000] 覆盖 TopHUD z-50 导致教程期间顶部按钮/信息被隐藏，已修复。
- 2026-06-29: 发现教程分类语义错误——"基础操作"步骤被强行归入"岁月史书"以匹配 LeftHub，但实际应归入"战略星图"（activeView: 'starmap'），已修复。
- 2026-06-26: 初始化项目健康仪表盘，填入首批系统治理评估指标。
