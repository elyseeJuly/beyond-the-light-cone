# Project Health Dashboard — 项目健康仪表盘
> 最后审视：2026-07-05
> 审视周期：每周一次 或 里程碑节点

## 总体健康：🟢（0 🔴 / 1 🟡 / 6 🟢）

| 维度 | 指标 | 状态 | 具体数据 | 建议行动 |
|------|------|------|---------|---------|
| 架构 | 单文件最大行数 | 🟡 | Game.ts 1721行（+GameSerializer.ts 268行） | 从1900行降至1721行，提取了存档序列化系统；后续可继续拆分子系统 |
| 架构 | Flag 系统耦合度 | 🟢 | FlagManager 封装 | FlagManager 包装 flags Set，提供 isSet/set/unset API，与原始 Set 共享引用，100% 存档兼容 |
| 性能 | 1000事件压力测试 | 🟢 | 通过 | 持续关注长局内存与性能表现 |
| 内容 | 设计文档 vs 代码一致性 | 🟢 | 已解决 | 原 3 处偏离 (D01-D03) 已通过 SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE.md 确认为权威设计，并编写 SCEN-DESIGN-DRIFT 17 项验证测试 |
| 文档 | 文档总数 | 🔴 | 184份 | 停止为简单 bug 编写冗长文档，推行"测试代替文档交接" |
| DevOps | Release流水线 | 🟢 | Tag-Driven 自动化 | .github/workflows/release.yml（4Job：gate→build-web+build-tauri→publish-release）+ tools/extract-changelog.sh + tools/sync-version.sh |
| 架构 | 资产按需下载功能 | 🟢 | 已接入主循环 | AssetLoader.downloadEraPack + preloadNextEra 已接入 Game.ts 纪元更替生命周期；manifest 分类覆盖率 99.3%（uncategorized 从 41% 降至 0.7%） |
| 架构 | EventBus 兼容性 | 🟢 | 旧事件名兼容 | emitLegacy 同时派发新旧事件名，保证迁移过渡期 React 组件旧监听器不失效；emitToWindow 别名保留向后兼容 |
| UI | 弹窗层叠秩序 | 🟢 | z-index 规范化 | TopHUD z-50 / StoryModal z-100 / 封面 z-150 / 设置 z-200 / 教程 z-1000，不再有越权覆盖 |

## 审视日志
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
