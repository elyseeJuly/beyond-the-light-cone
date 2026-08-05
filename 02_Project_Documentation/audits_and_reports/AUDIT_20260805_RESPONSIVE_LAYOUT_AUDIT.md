# 响应式布局尺寸自适应审计报告

**日期**：2026-08-05
**审计范围**：`03_Web_Rebuild` 全设备尺寸自适应实现与测试体系覆盖度
**方法**：以 `useBreakpoint.ts` / `App.tsx` / `index.css` / `responsive.spec.ts` / `playwright.config.ts` 为主要证据源，结合 [SPEC_20260621_RESPONSIVE_LAYOUT.md](../specs_and_architecture/SPEC_20260621_RESPONSIVE_LAYOUT.md) 规范与 [AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md](./AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md) 遗留风险，逐条核验代码与测试。最后实际运行扩充后的 Playwright 矩阵，以退出码与失败信息作为通过/不通过证据。

---

## 1. 审计结论

**总体判定**：✅ **通过**（A2 方案已落地并验证）。

响应式布局的"骨架"完整，A2 方案实施后移动端横屏有了独立的 Sidebar + Detail 布局，移除了有 bug 的缩放方案。当前 22 个用例全部通过。

历史缺陷与处置：

| 编号 | 原缺陷 | 处置 |
|---|---|---|
| 1 | 测试体系覆盖极薄 | ✅ 已扩充至 22 用例，含视口内可见性断言 |
| 2 | 断点阈值三处不一致 | ✅ `switchView` 已改为 768，并提取常量 |
| 3 | 移动端横屏缩放方案存在确定性 bug | ✅ 已移除 `mobile-landscape-scale`，改为 A2 独立布局 |

当前状态：22 个用例全部通过（chromium-desktop）。

---

## 2. 现有资产盘点

### 2.1 实现层资产

| 文件 | 职责 | 评价 |
|---|---|---|
| [useBreakpoint.ts](../../03_Web_Rebuild/src/hooks/useBreakpoint.ts) | 4 断点检测 Hook（mobile/tablet/desktop/wide） | 🟢 实现合理，含 resize/orientation 监听 + rAF 节流 |
| [App.tsx](../../03_Web_Rebuild/src/App.tsx) | `showDesktopLayout = !isMobile && !isMobileLandscape` | 🟢 A2 布局判定正确 |
| [MobileBottomNav.tsx](../../03_Web_Rebuild/src/components/MobileBottomNav.tsx) | 移动端底部 5 按钮 + safe-area 适配 | 🟢 实现 OK |
| [MobileLandscapeHub.tsx](../../03_Web_Rebuild/src/components/MobileLandscapeHub.tsx) | 移动端横屏左侧 56px 图标栏 | 🟢 A2 新增组件 |
| [OrientationPrompt.tsx](../../03_Web_Rebuild/src/components/OrientationPrompt.tsx) | 竖屏手机提示横屏 | 🟢 实现 OK |
| [index.css](../../03_Web_Rebuild/src/index.css) | 响应式工具类 + `clamp()` + `.mobile-landscape-hub*` | 🟢 缩放方案已移除 |
| [SPEC_20260621_RESPONSIVE_LAYOUT.md](../specs_and_architecture/SPEC_20260621_RESPONSIVE_LAYOUT.md) | 4 断点 + 各组件行为规范 | 🟢 规范完整 |

### 2.2 测试层资产（扩充前）

| 文件 | 用例数 | 评价 |
|---|---|---|
| [responsive.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/responsive.spec.ts) | 3 | 🔴 仅桌面 1280×800 + 移动端 390×844 + 切换；无"视口内可见性"断言 |
| [playwright.config.ts](../../03_Web_Rebuild/playwright.config.ts) | 5 个 project | 🟢 Chromium/Firefox/WebKit 桌面 + Pixel 5 + iPhone 12，设备矩阵尚可 |
| [helpers.ts](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts) | `waitForMainUI` / `switchView` | 🔴 `switchView` 用 `innerWidth < 640`，与 `useBreakpoint` 的 768 不一致 |
| [smoke.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/smoke.spec.ts) | 3 | 🟡 仅按 768 判定 isMobile，无横屏/极小屏覆盖 |
| [tutorial-coordinates.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/tutorial-coordinates.spec.ts) | 含 390×851 / 851×390 / 1440×900 三种 viewport | 🟢 教程坐标几何覆盖较好，但不验证布局自适配 |

### 2.3 与历史审计的关系

| 来源 | 相关结论 | 本次核对 |
|---|---|---|
| [AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md](./AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md) §4 P0 | Playwright 端口可信度 | ✅ 已在 [EXEC_20260804_TEST_FIX_EXECUTION.md](./EXEC_20260804_TEST_FIX_EXECUTION.md) 修复（`--strictPort` + `reuseExistingServer: false` + globalSetup），本次运行直接受益 |
| 同上 §4 P2 | 视觉基线缺失 | 🟡 本次未建立视觉基线，但新增 `expectInViewport` 系列作为几何基线的替代 |
| 同上 §4 P2 | 跨浏览器风险提前到合并前 | 🟡 本次仅跑 Chromium，跨浏览器矩阵保留给 main/nightly |

---

## 3. 根因分析

### 3.1 根因 A：`mobile-landscape-scale` 缩放方案有确定性 bug（✅ 已修复）

**历史证据**：[index.css:295-301](../../03_Web_Rebuild/src/index.css#L295-L301)（已删除）

```css
@media (max-height: 500px) and (orientation: landscape) {
  .mobile-landscape-scale {
    transform: scale(0.85);
    transform-origin: top center;
    width: 117.64% !important;   /* 100 / 0.85 */
    height: 117.64% !important;
  }
}
```

**问题**：`transform: scale` 不会改变元素的布局盒尺寸。`width: 117.64%` 让子元素在布局上撑出父容器，`transform-origin: top center` 让缩放后内容居中向上贴齐——左右两侧各溢出 `(117.64% - 100%) / 2 = 8.82%` 的父容器宽度。

**历史数值验证**（视口 844×390）：
- 子元素布局宽度：`844 × 1.1764 ≈ 993px`
- 缩放后视觉宽度：`993 × 0.85 ≈ 844px` ✅ 视觉上填满视口
- 但 `getBoundingClientRect()` 返回的是缩放后的视觉 box：`844px`
- 实测 TopHUD boundingBox 右侧超出视口 **74.41px**（3 次重试完全一致，确定性失败）

**修复方式**：
- 删除 `.mobile-landscape-scale` 全部样式
- 将移动端横屏布局改为 A2 方案：左侧 56px 图标栏 + 中央视口 + 右侧 Inspector 抽屉
- 修改 `showDesktopLayout = !isMobile && !isMobileLandscape`，使移动端横屏不再走桌面三栏布局

### 3.2 根因 B：断点阈值三处不一致（✅ 已修复）

| 位置 | 阈值 | 用途 |
|---|---|---|
| [useBreakpoint.ts:45](../../03_Web_Rebuild/src/hooks/useBreakpoint.ts#L45) | `width < 768` | 主断点判定 |
| [OrientationPrompt.tsx:17](../../03_Web_Rebuild/src/components/OrientationPrompt.tsx#L17) | `max-width: 768px` | 是否提示横屏 |
| [helpers.ts:48](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts#L48) `waitForMainUI` | `width < 768` | 测试中判定是否检查 `LOG TELEMETRY` |
| [helpers.ts:104](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts#L104) `switchView` | `innerWidth < 640` ❌ | 测试中判定走 mobile-nav 还是 desktop-nav |

**影响**：`switchView` 在 640–767px 区间会错误走桌面分支，但此区间在 [SPEC_20260621_RESPONSIVE_LAYOUT.md](../specs_and_architecture/SPEC_20260621_RESPONSIVE_LAYOUT.md) 中属于 `mobile` 断点。测试可能与实际行为相反。

### 3.3 根因 C：测试体系无"视口内可见性"断言（🟡 中优先级）

**证据**：原 [responsive.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/responsive.spec.ts) 仅 3 用例，断言形式：

```ts
await expect(page.locator('nav.mobile-bottom-nav')).toBeVisible();
```

`toBeVisible()` 只检查元素可见，不检查是否在视口内。元素可能 `visible` 但右侧被 `overflow-hidden` 裁掉——这正是"显示不全"的本质。

### 3.4 根因 D：测试设备矩阵覆盖不足（🟡 低优先级）

**原覆盖**：390×844（iPhone 12 竖屏）一个移动尺寸 + 1280×800 桌面。

**缺失**：
- 320×568（极小屏，老 iPhone SE）
- 375×667（老 iPhone）
- 844×390（手机横屏，触发 `mobile-landscape-scale`）
- 768×1024 / 1024×768（iPad 竖/横）
- 1920×1080（wide 断点）
- 767/768/1023/1024 断点边界值

---

## 4. 处置优先级

| 优先级 | 问题 | 处置 | 状态 |
|---|---|---|---|
| P0 | 根因 A：`mobile-landscape-scale` 溢出 74.41px | 删除缩放方案，改为 A2 独立布局 | ✅ 已修复（见 [EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md](./EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md)） |
| P0 | 根因 B：`switchView` 断点 640 vs 768 | 改为 768，并提取 `BREAKPOINT_MOBILE` 常量 | ✅ 已修复 |
| P1 | 根因 C：无视口内可见性断言 | 新增 `expectInViewport` / `expectHorizontallyInViewport` | ✅ 已修复 |
| P1 | 根因 D：设备矩阵不足 | 扩充至 8 个设备 + 边界值 + 横竖屏切换 | ✅ 已修复 |
| P2 | 视觉基线缺失（AUDIT_20260801 P2） | 建立少量稳定截图基线 | 🟡 暂缓，几何断言已能兜住主要回归 |

---

## 5. 建议的后续动作

1. ✅ **根因 A 已修复**：改为 A2 独立布局，不再使用缩放方案。详见 [EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md](./EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md)。
2. **跨浏览器验证**：本次仅跑 Chromium，建议在 CI nightly 中跑完整 5 project 矩阵（Chromium/Firefox/WebKit/Pixel 5/iPhone 12）。
3. **建立视觉基线**：为封面、主界面、教程横竖屏、关键结局建立 4–6 张稳定截图基线（呼应 [AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md](./AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md) P2）。
4. **CI 接入**：把扩充后的 `responsive.spec.ts` 加入 PR CI 的 Chromium 子集，确保响应式改动合并前有几何守卫。

---

## 6. 相关文档

- [SPEC_20260805_MOBILE_LANDSCAPE_A2.md](../specs_and_architecture/SPEC_20260805_MOBILE_LANDSCAPE_A2.md) — A2 方案设计文档
- [EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md](./EXEC_20260805_MOBILE_LANDSCAPE_A2_IMPLEMENTATION.md) — A2 方案执行报告
- [EXEC_20260805_RESPONSIVE_TEST_EXPANSION.md](./EXEC_20260805_RESPONSIVE_TEST_EXPANSION.md) — 测试体系扩充执行报告
- [SPEC_20260621_RESPONSIVE_LAYOUT.md](../specs_and_architecture/SPEC_20260621_RESPONSIVE_LAYOUT.md) — 响应式布局规范
- [EXEC_20260622_STARMAP_MOBILE_FIX.md](../plans_and_execution/EXEC_20260622_STARMAP_MOBILE_FIX.md) — 星图移动端显示修复（历史）
- [AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md](./AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md) — 测试体系综合审计（基线）
- [AUDIT_20260804_TEST_REPLAY_AND_FINDINGS.md](./AUDIT_20260804_TEST_REPLAY_AND_FINDINGS.md) — 测试回放与新发现
- [EXEC_20260804_TEST_FIX_EXECUTION.md](./EXEC_20260804_TEST_FIX_EXECUTION.md) — 测试系统修复执行（端口隔离/globalSetup 已落地，本次运行受益）
