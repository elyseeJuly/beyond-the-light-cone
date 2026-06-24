# 测试系统与端到端实现审计报告

> **审计日期**: 2026-06-24
> **审计范围**: `03_Web_Rebuild/src/test/` 全量 + Playwright 配置 + CI 配置
> **审计方法**: 目录结构分析 + 测试文件精读 + 实跑验证 + CI 配置核对

---

## 一、测试系统总体架构

### 1.1 测试分层

| 层级 | 目录 | 文件数 | 总行数 | 测试框架 |
|------|------|--------|--------|---------|
| 单元测试 | `src/test/core/` | 30 | ~8500 | Vitest + jsdom |
| 组件测试 | `src/test/components/` | 2 | 409 | Vitest + Testing Library |
| 集成测试 | `src/test/integration/` | 4 | 910 | Vitest |
| 配置测试 | `src/test/config/` | 1 | 21 | Vitest |
| 数据测试 | `src/test/data/` | 1 | 343 | Vitest |
| 工具测试 | `src/test/utils/` | 1 | 138 | Vitest |
| **E2E（Vitest）** | `src/test/e2e/` | 1 | 178 | Vitest（无浏览器） |
| **E2E（Playwright）** | `src/test/e2e-playwright/` | 4 spec + 1 helpers | 378 | Playwright |
| **合计** | — | **45** | **~10,900** | — |

### 1.2 实跑验证结果

| 命令 | 结果 |
|------|------|
| `npx vitest run` | **833/833 通过**（40 个测试文件） |
| `npx playwright test` | **未能实跑**（环境代理拦截 localhost，webServer 超时 120s） |

---

## 二、端到端测试（E2E）实现情况

### 2.1 两套 E2E 体系

项目存在**两套 E2E 测试**，技术路线不同：

#### 体系 A：Vitest E2E（无浏览器，纯逻辑模拟）

- **文件**: [Autoplay500.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e/Autoplay500.test.ts)（178 行）
- **机制**: 直接调用 `GameInstance.get()` + `game.runARound()`，用确定性 RNG（`random: () => 0.9`）模拟 500 回合
- **覆盖**: 长局稳定性、回合推进、事件自动处理
- **特点**: 无真实浏览器，本质是"长链路集成测试"而非真正 E2E

#### 体系 B：Playwright E2E（真实浏览器）

- **文件**: 4 个 spec + 1 个 helpers
- **配置**: [playwright.config.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/playwright.config.ts)
- **浏览器矩阵**: chromium-desktop / firefox-desktop / webkit-desktop / mobile-chrome (Pixel 5) / mobile-safari (iPhone 12)
- **机制**: 启动 `npm run preview` → 真实浏览器访问 → UI 交互验证

### 2.2 Playwright E2E 覆盖详情

#### [smoke.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/smoke.spec.ts)（59 行，3 个测试）

| 测试 | 覆盖点 |
|------|--------|
| 页面标题与核心布局元素存在 | title 匹配、header、LOG TELEMETRY、双 canvas（star-canvas-main/react） |
| 代码分割 chunk 按需加载 | 监听网络请求，验证 vendor-react/game-core/vendor-icons 等 chunk 按需加载 |
| 全局错误监控无未捕获异常 | 捕获 pageerror，过滤已知非阻塞错误（getThemeColors/Audio/autoplay） |

#### [core-flow.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts)（142 行，4 个测试）

| 测试 | 覆盖点 |
|------|--------|
| 新游戏 → 跳过教程 → 主星图可见 | 双 canvas 挂载 |
| 切换各中心视图 | 科技/情报/政府/档案/星图 5 个视图切换 + heading 验证 |
| 按空格推进回合且资源非负 | 通过 `window.GameInstance` 读取年份与资源，验证非负 |
| 事件弹窗出现后可选择选项 | 20 回合内触发事件，force click 选项按钮，处理打字机动画 |

#### [responsive.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/responsive.spec.ts)（45 行，3 个测试）

| 测试 | 覆盖点 |
|------|--------|
| 桌面端显示 LeftHub 与 RightInspector | 1280×800，aside 数量=2，无 mobile-bottom-nav |
| 移动端隐藏侧边栏并显示底部导航 | 390×844，mobile-bottom-nav 可见，aside:visible=0 |
| 窗口尺寸切换时布局正确响应 | 1280→390 切换，验证响应式 |

#### [tutorial-guided.spec.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/tutorial-guided.spec.ts)（132 行，1 个测试）

完整的新手教程 11 步引导流程：
1. 档案访问授权确认
2. 历史纪元演进
3. 战略星图观测仪
4. 行星观测与选择（点击地球恒星，含 canvas 物理坐标 + 事件兜底）
5. 采矿场建设（点击 build-stope 按钮）
6. 内阁政府管理中枢
7. 科学技术解码中心
8. 黑暗森林防备体系
9. 深空外交监测网络
10. 文明稳定维系法则
11. 授权通过：执政官生存法则 → 确认授权并开始

### 2.3 E2E helpers 工具函数

[helpers.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/helpers.ts)（80 行）提供 6 个公共函数：
- `disableTutorial`：localStorage 注入跳过教程
- `skipTutorial`：按钮兜底跳过
- `waitForMainUI`：等待 header/canvas 就绪
- `dismissOrientationPrompt`：关闭移动端横屏提示
- `clickNextTurn`：空格键推进回合
- `switchView`：桌面/移动端双路径视图切换

---

## 三、关键问题

### 3.1 CI 不跑 Playwright E2E（最严重）

**核实**: [.github/workflows/ci.yml](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/.github/workflows/ci.yml) 的 CI 流程为：

```
checkout → setup-node 20 → npm ci → tsc --noEmit → vitest run → vitest run --coverage → npm run build → upload coverage
```

**CI 只跑 Vitest，不跑 Playwright。** 这意味着：
- 4 个 Playwright spec 文件（11 个测试）**从未在 CI 中执行**
- E2E 测试只能本地手动跑，无强制门禁
- 833 个 Vitest 测试通过 ≠ E2E 通过
- UI 回归（如移动端布局、教程流程、视图切换）无自动化保障

**风险**: 任何 UI 改动都可能破坏 E2E 路径但 CI 不会报警。这正是昨日报告"测试通过 ≠ 功能正确"的结构性原因。

### 3.2 E2E 本地无法实跑（环境问题）

**核实**: 本审计尝试实跑 Playwright，遇到：
- `npm run preview` 启动后 curl 返回 502（环境代理拦截 localhost）
- Playwright webServer 检测 URL `http://localhost:4173/beyond-the-light-cone/` 超时 120s
- dev server 同样 502

**根因**: Trae IDE 环境对 localhost 有代理拦截，导致本地无法验证 E2E 实际通过率。

**风险**: E2E 测试的"通过"状态无法独立验证，只能信任测试代码本身的质量。

### 3.3 baseURL 路径配置可疑

**核实**: [playwright.config.ts:22](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/playwright.config.ts#L22) 的 baseURL 为 `http://localhost:4173/beyond-the-light-cone/`，但 [vite.config.ts:153](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/vite.config.ts#L153) 的 `base` 为 `process.env.CF_PAGES === '1' ? '/' : './'`。

**问题**: 本地非 CF_PAGES 环境下 base 是 `./`（相对路径），preview server 根路径是 `/`，但 Playwright 访问 `/beyond-the-light-cone/`。**路径不匹配**，这可能是 webServer 超时的原因之一（即便没有代理问题）。

### 3.4 E2E 测试的脆弱性设计

**核实**: [core-flow.spec.ts:78-141](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts#L78-L141) 的事件弹窗测试存在多处脆弱性：
- 第 97-101 行：20 回合未触发事件即视为通过（`return`），**实际未验证任何东西**
- 第 109 行：15 次重试 force click，容错过高
- 第 138-140 行：无选项可点击也视为通过（annotation 而非 fail）

**风险**: 该测试几乎不会失败，无论事件系统是否正常工作。

### 3.5 Autoplay500 是伪 E2E

**核实**: [Autoplay500.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e/Autoplay500.test.ts) 虽在 `e2e/` 目录，但：
- 无浏览器、无 DOM、无 UI
- 直接调用 `game.runARound()` 纯逻辑
- 本质是"长链路集成测试"

**风险**: 目录命名误导，让人以为有 5 个 E2E 测试文件，实际真正 E2E 只有 4 个 Playwright spec。

---

## 四、测试覆盖盲区

### 4.1 E2E 未覆盖的关键路径

| 路径 | 重要性 | E2E 覆盖 |
|------|--------|---------|
| 新游戏 → 教程 → 首回合 | 高 | ✅ tutorial-guided |
| 视图切换 | 中 | ✅ core-flow |
| 移动端响应式 | 中 | ✅ responsive |
| 事件弹窗交互 | 高 | ⚠️ 脆弱（几乎不会失败） |
| **存档/读档** | **致命** | ❌ 无 |
| **结局触发** | **致命** | ❌ 无 |
| **科技树研发** | 高 | ❌ 无 |
| **战斗系统** | 高 | ❌ 无 |
| **外交系统** | 中 | ❌ 无 |
| **AP/AI智脑（新功能）** | 中 | ❌ 无 |
| **事件实体化（新功能）** | 中 | ❌ 无 |
| 长局 500 回合 | 中 | ⚠️ Autoplay500（伪 E2E） |

### 4.2 单元测试的覆盖盲区

虽然 833 测试通过，但昨日报告指出以下路径无单元测试：
- 6 胜利结局 + 2 game-over 路径（部分已在 [Game.victoryConditions.test.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/core/Game.victoryConditions.test.ts) 补充）
- 快照泄漏路径
- 存档损坏路径

---

## 五、测试系统健康度评估

### 5.1 优点

1. **分层完整**: 单元/组件/集成/E2E 四层齐全
2. **工具链现代**: Vitest 4 + Playwright 1.61 + Testing Library 16
3. **覆盖率配置**: 语句 70% / 分支 60% / 函数 70% / 行 70% 阈值
4. **helpers 抽象**: E2E 公共函数复用良好
5. **浏览器矩阵**: 5 种浏览器/设备配置
6. **确定性 RNG**: Autoplay500 用固定随机种子保证可复现

### 5.2 缺点

| 缺点 | 严重度 | 影响 |
|------|--------|------|
| **CI 不跑 Playwright** | 致命 | E2E 无门禁，UI 回归无保障 |
| **baseURL 路径不匹配** | 高 | E2E 可能从未在本地成功跑过 |
| **事件弹窗测试脆弱** | 高 | 几乎不会失败，无实际验证价值 |
| **存档/结局/战斗无 E2E** | 高 | 致命路径无 UI 层验证 |
| **Autoplay500 命名误导** | 中 | 高估 E2E 覆盖 |
| **本地环境无法实跑** | 中 | 无法独立验证 E2E 状态 |

---

## 六、结论与建议

### 6.1 当前测试系统真实状态

- **Vitest 层**: 833 测试通过，覆盖核心逻辑，但存在盲区
- **Playwright 层**: 4 spec 11 测试**代码完整**，但**从未在 CI 执行**，且**本地因路径/代理问题无法验证是否真能通过**
- **E2E 实际保障力**: 低。CI 门禁只靠 Vitest，UI 回归无自动化保障

### 6.2 紧急建议

1. **将 Playwright 纳入 CI**: 在 ci.yml 增加 `npx playwright install` + `npx playwright test` 步骤
2. **修复 baseURL**: 将 [playwright.config.ts:22](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/playwright.config.ts#L22) 的 baseURL 改为 `http://localhost:4173/`（与 preview 根路径一致）
3. **修复事件弹窗测试**: [core-flow.spec.ts:97-101](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/test/e2e-playwright/core-flow.spec.ts#L97-L101) 的"20 回合无事件即通过"应改为失败或用固定事件触发
4. **补充致命路径 E2E**: 存档/读档、结局触发、科技树研发

### 6.3 测试系统判定

**测试系统"看起来完整"但"实际保障力有限"**：
- 数量上 833+11=844 测试看似充足
- 但 E2E 11 个测试从未在 CI 执行，且本地无法验证
- 致命路径（存档/结局/战斗）无 E2E 覆盖
- 这是昨日报告"测试通过 ≠ 功能正确"的结构性根因

---

**审计完成。**

核心结论：E2E 测试代码完整但从未在 CI 执行，且本地因路径配置问题无法验证。测试系统的真实保障力低于表面数字所暗示的水平。
