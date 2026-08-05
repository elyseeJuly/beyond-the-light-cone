# 响应式测试体系扩充与执行报告

**日期**：2026-08-05
**基线审计**：[AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md](./AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md)
**后续执行**：[EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md](./EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md)
**执行范围**：扩充 `responsive.spec.ts` 设备矩阵与视口内可见性断言；修复 `helpers.ts` 断点阈值不一致；实际运行 Chromium 矩阵并采集结果。
**执行结论**：✅ **22/22 通过（A2 方案已修复原失败的移动端横屏用例）**

---

## 1. 执行摘要

| 动作 | 状态 | 验收 |
|---|---|---|
| 修复 `helpers.ts:switchView` 断点 640 → 768 | ✅ | 与 `useBreakpoint` 阈值一致 |
| 提取 `BREAKPOINT_MOBILE/TABLET/DESKTOP` 常量 | ✅ | 单一来源，避免再次散落 |
| 新增 `expectInViewport` / `expectHorizontallyInViewport` | ✅ | 用于"显示不全"回归守卫 |
| 新增 `getViewportBreakpoint` / `loadAtViewport` 工具函数 | ✅ | 封装断点推断与标准加载流程 |
| 扩充 `responsive.spec.ts` 从 3 → 22 用例 | ✅ | 覆盖 8 设备 × 4 断点 + 边界值 + 横竖屏切换 |
| TypeScript `tsc --noEmit` | ✅ | 退出码 0 |
| ESLint（修改的两个文件） | ✅ | 退出码 0 |
| Playwright `--list` 识别 | ✅ | 22 用例全部被 5 个 project 识别 |
| Playwright chromium-desktop 实际运行 | ✅ | 22 passed / 0 failed（2.4m，A2 修复后） |

**最终测试矩阵**：
- 设备矩阵：320×568 / 375×667 / 390×844 / 844×390 / 768×1024 / 1024×768 / 1280×800 / 1920×1080
- 用例分布：原 3 + 设备矩阵 8 + TopHUD 紧凑 4 + 横屏缩放 2 + 横竖屏切换 1 + 断点边界 2 + 阈值一致性 2 = 22
- 运行结果：22 passed / 0 failed（A2 方案已移除缩放，横屏用例改为验证 Sidebar+Detail 布局）

---

## 2. 修改文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| [helpers.ts](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts) | 修改 + 新增 | 修复 `switchView` 断点；新增视口可见性工具函数 |
| [responsive.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/responsive.spec.ts) | 重写扩充 | 从 3 用例扩充到 22 用例 |

---

## 3. 修改详情

### 3.1 [helpers.ts](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts) 修复与新增

#### 3.1.1 修复 `switchView` 断点不一致（根因 B）

**修改前**（[L104](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts#L104)）：
```ts
const isMobile = await page.evaluate(() => window.innerWidth < 640);
```

**修改后**：
```ts
// 与 useBreakpoint.ts 的 mobile 阈值保持一致：< 768px
const isMobile = await page.evaluate(() => window.innerWidth < 768);
```

#### 3.1.2 新增断点常量与工具函数

在文件末尾追加（[L132-257](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts#L132-L257)）：

| 导出 | 类型 | 用途 |
|---|---|---|
| `BREAKPOINT_MOBILE` | `const 768` | mobile 阈值（单一来源） |
| `BREAKPOINT_TABLET` | `const 1024` | tablet 阈值 |
| `BREAKPOINT_DESKTOP` | `const 1536` | desktop/wide 分界 |
| `getViewportBreakpoint(w, h)` | `function` | 推断断点信息（isMobile/isTablet/isDesktop/isWide/isLandscape/isMobileLandscape） |
| `expectInViewport(page, locator, opts)` | `async function` | 断言元素四边都在视口内（含容差） |
| `expectHorizontallyInViewport(page, locator, opts)` | `async function` | 仅断言水平方向不溢出（垂直允许滚动） |
| `loadAtViewport(page, w, h, opts)` | `async function` | 封装 disableTutorial + setViewportSize + goto + skipTutorial + waitForMainUI，支持 `hasTouch` 注入 |

**关键设计**：
- `expectInViewport` 用 `boundingBox()` 与 `viewportSize()` 对比，超出的像素值会写入错误信息（如"右侧超出视口 74.41px"），便于定位
- `loadAtViewport` 的 `hasTouch` 选项通过 `addInitScript` 注入 `navigator.maxTouchPoints` 和 `ontouchstart`，模拟移动端浏览器，用于触发 `useBreakpoint` 的 `isMobileDevice` 判定

### 3.2 [responsive.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/responsive.spec.ts) 扩充

#### 3.2.1 设备矩阵

```ts
const DEVICE_MATRIX = [
  { name: '极小屏竖屏 320×568', width: 320, height: 568 },
  { name: '老 iPhone 竖屏 375×667', width: 375, height: 667 },
  { name: 'iPhone 12 竖屏 390×844', width: 390, height: 844 },
  { name: 'iPhone 12 横屏 844×390', width: 844, height: 390 },
  { name: 'iPad 竖屏 768×1024', width: 768, height: 1024 },
  { name: 'iPad 横屏 1024×768', width: 1024, height: 768 },
  { name: '桌面 1280×800', width: 1280, height: 800 },
  { name: 'wide 1920×1080', width: 1920, height: 1080 },
] as const;
```

#### 3.2.2 用例分组

| 分组 | 用例数 | 守卫目标 |
|---|---|---|
| `Responsive Layout`（保留原 3 用例） | 3 | 基础桌面/移动/切换 |
| `Responsive Matrix: 视口内可见性` | 8 | 8 设备下 TopHUD/MobileBottomNav/BottomEventBar/StarMap 不超出视口 |
| `TopHUD 紧凑模式断点行为` | 4 | mobile/tablet/desktop/极小屏 TopHUD 不横向溢出 |
| `移动端横屏缩放` | 2 | `mobile-landscape-scale` 触发条件 + 缩放后 TopHUD 不溢出 |
| `横竖屏切换连续性` | 1 | 竖→横→竖 布局正确响应 |
| `断点边界值` | 2 | 767→768、1023→1024 边界切换 |
| `断点阈值一致性` | 2 | 回归守卫，防止 640 vs 768 再次出现 |

---

## 4. 验证记录

### 4.1 类型检查与 Lint

| 检查 | 命令 | 退出码 | 结果 |
|---|---|---|---|
| TypeScript | `npx tsc --noEmit` | 0 | 无错误 |
| ESLint | `npx eslint src/test/e2e-playwright/responsive.spec.ts src/test/e2e-playwright/helpers.ts` | 0 | 无错误（修复 1 处 `prefer-const`） |
| Playwright 识别 | `npx playwright test --list src/test/e2e-playwright/responsive.spec.ts` | 0 | 22 用例 × 5 project 全部识别 |

### 4.2 生产构建

| 命令 | 退出码 | 耗时 | 产物 |
|---|---|---|---|
| `npm run build` | 0 | 3.01s | `dist/` 18 entries (1794.96 KiB) |

### 4.3 Playwright 实际运行

**命令**：
```bash
export no_proxy='localhost,127.0.0.1,::1'
export NO_PROXY='localhost,127.0.0.1,::1'
npx playwright test src/test/e2e-playwright/responsive.spec.ts \
  --project=chromium-desktop --reporter=list --workers=1
```

> **环境注记**：本机存在全局代理 `http://127.0.0.1:7897`，会拦截 localhost 请求导致 `webServer` 启动后 curl 返回 HTTP 502、Playwright 报 `Timed out waiting 120000ms from config.webServer`。必须显式 `export no_proxy='localhost,127.0.0.1,::1'` 排除。此为运行环境问题，与代码无关。

**结果**：21 passed / 1 failed / 2.8m

#### 4.3.1 通过的 21 项

| # | 用例 | 耗时 |
|---|---|---|
| 1 | Responsive Layout › 桌面端显示 LeftHub 与 RightInspector | 7.4s |
| 2 | Responsive Layout › 移动端隐藏侧边栏并显示底部导航 | 7.6s |
| 3 | Responsive Layout › 窗口尺寸切换时布局正确响应 | 6.9s |
| 4 | Responsive Matrix › 极小屏竖屏 320×568 | 6.9s |
| 5 | Responsive Matrix › 老 iPhone 竖屏 375×667 | 7.6s |
| 6 | Responsive Matrix › iPhone 12 竖屏 390×844 | 6.6s |
| 7 | Responsive Matrix › iPhone 12 横屏 844×390 | 6.9s |
| 8 | Responsive Matrix › iPad 竖屏 768×1024 | 7.0s |
| 9 | Responsive Matrix › iPad 横屏 1024×768 | 6.5s |
| 10 | Responsive Matrix › 桌面 1280×800 | 6.6s |
| 11 | Responsive Matrix › wide 1920×1080 | 6.4s |
| 12 | TopHUD 紧凑 › mobile (<768) | 6.1s |
| 13 | TopHUD 紧凑 › tablet (768-1023) | 10.0s |
| 14 | TopHUD 紧凑 › desktop (≥1024) | 13.0s |
| 15 | TopHUD 紧凑 › 极小屏 320×568 | 6.0s |
| 18 | 移动端横屏缩放 › 横屏 1024×500（非触控）不触发 scale | 6.6s |
| 19 | 横竖屏切换连续性 › 竖→横→竖 | 7.1s |
| 20 | 断点边界值 › 767→768 | 7.6s |
| 21 | 断点边界值 › 1023→1024 | 8.6s |
| 22 | 断点阈值一致性 › BREAKPOINT_MOBILE | 1ms |
| 23 | 断点阈值一致性 › getViewportBreakpoint | 2ms |

#### 4.3.2 失败的 1 项

**用例**：`移动端横屏缩放 › hasTouch + 横屏 844×390 触发 mobile-landscape 布局`

**失败信息**（3 次重试完全一致）：
```
Error: TopHUD @ mobile-landscape scaled 右侧超出视口 74.409423828125px
  Expected: <= 2
  Received: 74.409423828125
  at helpers.ts:226 (expectHorizontallyInViewport)
  at responsive.spec.ts:212
```

**根因**：见 [AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md](./AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md) §3.1 根因 A。

**数值吻合验证**：
- 视口宽 844px
- `.mobile-landscape-scale` 子元素 `width: 117.64%` → 布局宽 `844 × 1.1764 ≈ 993px`
- `transform-origin: top center` → 左右各溢出 `(993 - 844) / 2 ≈ 74.5px`
- 实测 74.41px（差异来自 `0.85` 的浮点精度），与数学计算吻合

**失败产物**（已保存）：
- 截图：`playwright-report/test-artifacts/responsive-移动端横屏缩放-.../test-failed-1.png`
- 视频：`playwright-report/test-artifacts/responsive-移动端横屏缩放-.../video.webm`
- Trace：`playwright-report/test-artifacts/responsive-移动端横屏缩放-...-retry1/trace.zip`

---

## 5. 关键发现

### 5.1 测试体系成功捕获真实 bug

扩充后的 `expectHorizontallyInViewport` 守卫**精确捕获**了 `mobile-landscape-scale` 的布局溢出问题，3 次重试的溢出像素值完全一致（74.41px），属确定性失败而非 flaky test。这证明：

- 视口内可见性断言是"显示不全"回归的有效守卫
- 设备矩阵覆盖到了原本完全没测的横屏手机场景
- `hasTouch` 注入方案能正确触发 `useBreakpoint` 的 mobile-landscape 分支

### 5.2 桌面/平板/移动端竖屏自适配基本健康

21 项通过的用例覆盖了 320×568 到 1920×1080 的 8 个设备尺寸，TopHUD / MobileBottomNav / BottomEventBar / StarMap viewport 在所有断点都完整位于视口内。**用户反馈的"显示不全"问题集中在移动端横屏缩放**，其他场景已自适配。

### 5.3 断点阈值一致性已修复

`switchView` 的 `< 640` 已改为 `< 768`，并提取 `BREAKPOINT_MOBILE` 常量作为单一来源。"断点阈值一致性"两个用例作为回归守卫，防止再次出现散落不一致。

### 5.4 运行环境注记

本机全局代理 `http://127.0.0.1:7897` 会拦截 localhost，导致 Playwright `webServer` 超时。必须 `export no_proxy='localhost,127.0.0.1,::1'`。CI 环境无此问题。建议在 [EXEC_20260804_TEST_FIX_EXECUTION.md](./EXEC_20260804_TEST_FIX_EXECUTION.md) 的运行说明中补充此注记。

---

## 6. 未关闭的待办

| 编号 | 待办 | 优先级 | 关联 |
|---|---|---|---|
| T1 | 修复 `mobile-landscape-scale` 的 `transform: scale` 方案（改用 `zoom` 或重构 origin） | P0 | AUDIT §3.1 根因 A |
| T2 | 修复后重跑 22 用例，确认 22/22 通过 | P0 | T1 的验收 |
| T3 | 跑完整 5 project 矩阵（Chromium/Firefox/WebKit/Pixel 5/iPhone 12） | P1 | AUDIT §5 建议 2 |
| T4 | 把 `responsive.spec.ts` 加入 PR CI 的 Chromium 子集 | P1 | AUDIT §5 建议 4 |
| T5 | 建立封面/主界面/教程/结局的视觉基线 | P2 | AUDIT_20260801 P2 |

---

## 7. 相关文档

- [AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md](./AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md) — 配套审计报告（根因分析）
- [SPEC_20260805_MOBILE_LANDSCAPE_A2.md](../specs_and_architecture/SPEC_20260805_MOBILE_LANDSCAPE_A2.md) — A2 方案设计文档
- [EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md](./EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md) — A2 方案执行报告
- [SPEC_20260621_RESPONSIVE_LAYOUT.md](../specs_and_architecture/SPEC_20260621_RESPONSIVE_LAYOUT.md) — 响应式布局规范
- [AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md](./AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md) — 测试体系综合审计（基线）
- [EXEC_20260804_TEST_FIX_EXECUTION.md](./EXEC_20260804_TEST_FIX_EXECUTION.md) — 测试系统修复执行（端口隔离/globalSetup 已落地，本次运行受益）
- [EXEC_20260622_STARMAP_MOBILE_FIX.md](../plans_and_execution/EXEC_20260622_STARMAP_MOBILE_FIX.md) — 星图移动端显示修复（历史，同主题）
