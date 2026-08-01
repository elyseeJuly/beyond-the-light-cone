# Beyond the Light Cone 测试体系完整审计

**日期**：2026-08-01  
**范围**：`03_Web_Rebuild` 的 Vitest、模拟测试、Playwright、CI/Release 门禁、PWA 与 Tauri 验证链。  
**方法**：以当前配置、测试文件、工作流、最近测试产物和实际命令行为为准；历史测试数量与 GREEN 标记仅作线索，不作为本次通过证据。

---

## 1. 结论

**总体判定：🟡 有条件通过。**

项目并不缺少测试资产：核心逻辑、场景回归、确定性模拟、教程交互、响应式和多浏览器 Playwright 均已有覆盖，CI 也配置了覆盖率、构建、PWA 契约与 Release 门禁。

但当前不能把“测试很多”等同于“测试体系可作为发布依据”。主要风险集中在三处：

1. **本地 Vitest 门禁曾错误扫描 Remotion 的嵌套第三方测试；本次已隔离，但完整游戏测试在隔离后出现无输出挂起，尚无完成结果。**
2. **本地 Playwright 会复用固定端口上的已有服务；最近一次报告实际打开了另一个项目页面，106 项失败不能解释为本项目回归。**
3. **新近英文剧情本地化、PWA 生命周期、真实存档链和桌面端运行时缺少用户路径级验证。**

在下列 P0/P1 问题关闭前，建议将当前测试状态视为“代码与部分目标用例已验证，完整发布验证未完成”。

---

## 2. 测试资产现状

| 层级 | 现有内容 | 当前评价 |
|---|---|---|
| Vitest 单元/集成/场景 | 核心、数据、组件、存档、事件链、教程、分发策略、回归场景等测试文件 | 🟢 覆盖面广 |
| 确定性模拟 | smoke、replay、regression、flag、balance、reachability、soak | 🟢 分层合理 |
| Playwright | smoke、核心流程、响应式、教程黄金路径、教程鲁棒性、坐标几何；5 个浏览器/设备项目 | 🟡 用例有价值，执行可信度不足 |
| 覆盖率 | V8 覆盖率门槛：statements 70%、branches 60%、functions 70%、lines 70% | 🟢 已有硬门槛 |
| CI | PR：类型检查、模拟 smoke/短矩阵、coverage、构建、PWA 契约、Chromium；main：完整浏览器矩阵 | 🟡 门禁存在但有遗漏 |
| Release | 版本一致性、Vitest、coverage、构建、PWA 契约、完整 Playwright、Tauri 构建与产物检查 | 🟡 标签阶段覆盖充分，但发现太晚 |

最近遗留 coverage 产物显示：lines 78.26%、statements 76.20%、functions 75.40%、branches 69.46%。该产物高于配置阈值，但不是本次未提交改动后的新基线，不能代替当前全量结果。

---

## 3. 本次验证记录

| 检查 | 结果 | 边界 |
|---|---|---|
| 英文剧情数据测试 `NarrativeLocalization.test.ts` | ✅ 3 项通过 | 仅验证数据映射和一个 `localizeNarrative` 示例，不验证组件与真实用户交互。 |
| 原默认 `npm test` | ❌ 门禁失真 | 扫描了 `video-output/remotion/node_modules` 的 fast-uri/Zod 第三方测试，至少两项失败。 |
| 视频子项目隔离 | ✅ 已修复 | `vite.config.ts` 已排除 `**/node_modules/**` 与 `video-output/**`；录制代码和成品未修改。 |
| 隔离后的完整 Vitest | ⚠️ 未完成 | 运行超过两分钟且无用例级输出；已停止本次审计启动的进程，不能报告通过或失败。 |
| 现存 Playwright 报告 | ❌ 不可作产品结论 | 最后一次为 2026-07-28，状态 `failed`、106 项失败；烟雾测试记录的页面标题属于另一个本地项目。 |

---

## 4. 发现与处置优先级

### P0：修复本地 Playwright 的目标站点可信度

**证据**：`playwright.config.ts` 固定使用 `http://localhost:4173/`，且非 CI 环境设置 `reuseExistingServer: true`。现存失败产物显示页面标题为“偶成 Ou Cheng”，不是本项目。

**影响**：测试可能对错误应用执行，产生大量无效失败、超时或错误通过；当前 106 项失败不可用于判断游戏质量。

**最小修复方向**：

- 为本项目使用专属端口并以严格端口启动 preview；默认不复用已有服务。
- 若允许显式复用，必须由环境变量开启，并在所有 E2E 开始前断言标题、`application-name`、根节点和 base URL 均匹配本项目。
- 重新执行 Chromium 核心路径后，才处理仍然存在的真实失败。

**验收**：故意占用该端口时测试明确失败；在正确 preview 上 smoke 检查首先通过；报告记录实际 URL 和提交 SHA。

### P0：定位隔离后 Vitest 无输出挂起

**证据**：视频依赖扫描已被排除，但完整 `vitest run` 未在合理时间内输出结果或结束。

**影响**：主项目测试命令仍不能作为本地可靠门禁；CI 与本地可能因为依赖布局不同而出现行为分歧。

**最小修复方向**：

- 使用 JSON reporter、单线程/分目录运行定位首个未结束的测试文件和未关闭的 timer、server、worker 或 browser handle。
- 将“测试发现”与“测试执行”分开记录；不要以启动日志或旧测试数量报告通过。

**验收**：`npm test` 在干净依赖树和包含视频依赖树的环境中均可在预期时间内结束，并输出一致的项目测试清单与退出码。

### P1：补齐英文剧情的用户路径测试

**证据**：最新 `StoryModal.tsx` 改为通过 `localizeNarrative(event, lang)` 展示标题、台词和选项；当前新增测试只验证数据结构。所有 Playwright 用例仍依赖中文文案定位，未切换语言。

**缺失路径**：语言切换为英文 → 触发随机剧情 → 验证英文标题/台词/选项 → 点击选项 → 原 action 执行、弹窗关闭且游戏状态继续推进；中文和缺失翻译回退也应验证。

**验收**：用语义 selector/assertion 覆盖中英两种语言；不依赖中文 copy 作为唯一定位方式。

### P1：补齐真实存档、PWA 更新与离线链

**证据**：E2E 对 localStorage 的使用主要是跳过或完成教程；未覆盖 IndexedDB 存档恢复。`verify:pwa-release` 验证构建契约，而非浏览器内 Service Worker 生命周期。

**缺失路径**：

- 新局 → 手动/自动存档 → 刷新 → 继续存档 → 删除存档 → 损坏存档降级。
- 首次访问 → 安装提示/Service Worker 激活 → 离线 reload → 新版本缓存更新与恢复在线。
- Cloudflare/正式静态托管下的深链刷新与资源加载。

**验收**：Chromium 至少覆盖可自动化的 IndexedDB、离线和 Service Worker 场景；部署后冒烟验证作为独立发布证据记录。

### P1：让 CI 对全部应用代码执行 lint

**证据**：`.github/workflows/ci.yml` 运行 `npm run lint:simulation`，但不运行完整 `npm run lint`。

**影响**：组件、i18n、PWA 和普通工具代码只经 TypeScript 检查，不经 ESLint 门禁。

**验收**：PR CI 运行完整 lint；模拟专用 lint 可以保留为更聚焦的诊断步骤。

### P2：将跨浏览器风险提前到合并前

**证据**：PR 只运行 Chromium；Firefox、WebKit、mobile Chrome 和 mobile Safari 在 main push 后才运行。

**影响**：教程坐标、触摸与 iOS 相关问题可能在合并后才发现。

**建议**：保留 PR Chromium 核心门禁；对于教程、响应式、PWA 或触控相关改动，PR 增加 WebKit/mobile Safari 定向子集，完整矩阵仍可在 main/nightly 执行。

### P2：补足视觉与桌面运行时验收

**证据**：Playwright 仅在失败时保留截图，没有视觉基线；Tauri 构建在 Release 标签阶段执行，普通 PR 不验证桌面运行时。

**建议**：

- 为封面、主界面、教程横竖屏、英文剧情、关键结局建立少量稳定截图基线。
- 对 Tauri 至少增加 PR 级别的配置/资源路径检查；原生启动与平台安装包验证留在 Release 候选阶段。

---

## 5. 已确认的强项

- 核心模拟不只依赖单元断言：确定性 seed、重放、reachability、soak 和 balance 已形成由快到慢的分层。
- 教程覆盖了真实交互黄金路径、目标缺失不锁屏、横竖屏几何误差和旋转连续性，属于高价值 E2E。
- CI 与 Release 都包含类型检查、覆盖率阈值、生产构建和 PWA 产物契约，不是仅运行 `npm test`。
- 测试场景注册表能把历史回归与对应测试文件关联，便于追踪。

---

## 6. 建议的执行顺序

1. 先关闭两个 P0：Playwright 独占/身份校验、Vitest 挂起定位。
2. 添加英文 StoryModal 与真实存档恢复 E2E。
3. 把完整 lint 加入 PR CI，并为 PWA 增加离线/更新浏览器检查。
4. 为教程、响应式和 PWA 相关 PR 添加 WebKit/mobile Safari 定向验证。
5. 再建设最小视觉基线与 Tauri PR 级预检。

> 本报告没有修改游戏逻辑、视频录制内容、素材或现有测试用例；仅记录当前证据并完成 Vitest 对 `video-output` 的隔离配置。所有“通过”结论均受第 3 节所列执行边界约束。
