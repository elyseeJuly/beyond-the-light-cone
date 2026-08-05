# 移动端横屏 A2 方案执行报告

**日期**：2026-08-05
**方案文档**：[SPEC_20260805_MOBILE_LANDSCAPE_A2.md](../specs_and_architecture/SPEC_20260805_MOBILE_LANDSCAPE_A2.md)
**基线审计**：[AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md](./AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md)
**前置执行**：[EXEC_20260805_RESPONSIVE_TEST_EXPANSION.md](./EXEC_20260805_RESPONSIVE_TEST_EXPANSION.md)
**执行结论**：✅ **A2 方案已落地，responsive.spec.ts 22/22 通过**

---

## 1. 执行摘要

| 阶段 | 状态 | 关键结果 |
|---|---|---|
| 方案设计 | ✅ | 完成 SPEC_20260805_MOBILE_LANDSCAPE_A2.md |
| 预览图生成 | ✅ | A1/A2/B 三方案效果图已归档 |
| 代码实现 | ✅ | 新增 MobileLandscapeHub，修改 App.tsx / index.css / helpers.ts / responsive.spec.ts |
| 类型检查 | ✅ | `npx tsc --noEmit` 通过 |
| ESLint | ✅ | TSX/TS 文件无错误（CSS 文件被忽略，warning 不影响） |
| 生产构建 | ✅ | `npm run build` 成功，dist 18 entries |
| Playwright 测试 | ✅ | 22/22 通过（chromium-desktop，2.4m） |

---

## 2. 改动文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| [MobileLandscapeHub.tsx](../../03_Web_Rebuild/src/components/MobileLandscapeHub.tsx) | 新增 | 移动端横屏左侧 56px 垂直图标栏 |
| [App.tsx](../../03_Web_Rebuild/src/App.tsx) | 修改 | `showDesktopLayout = !isMobile && !isMobileLandscape`；渲染 MobileLandscapeHub；底部导航仅在竖屏移动显示 |
| [index.css](../../03_Web_Rebuild/src/index.css) | 修改 | 删除 `.mobile-landscape-scale`；新增 `.mobile-landscape-hub*` 样式 |
| [helpers.ts](../../03_Web_Rebuild/src/test/e2e-playwright/helpers.ts) | 修改 | `waitForMainUI` 支持 touch + landscape 的 mobile 判定；修复 `switchView` 断点；新增视口可见性工具 |
| [responsive.spec.ts](../../03_Web_Rebuild/src/test/e2e-playwright/responsive.spec.ts) | 修改 | 横屏用例改为验证 A2 布局；横竖屏切换用例注入 touch |

---

## 3. 关键代码变更

### 3.1 App.tsx 布局判定

**修改前**（[L95](../../03_Web_Rebuild/src/App.tsx#L95)）：
```ts
const showDesktopLayout = !isMobile || isMobileLandscape;
```

**修改后**：
```ts
// A2 方案：移动端横屏不再走桌面三栏布局，而是走独立的移动横屏布局
// 左侧 56px 图标栏 + 中央视口 + 右侧 Inspector 抽屉
const showDesktopLayout = !isMobile && !isMobileLandscape;
```

### 3.2 App.tsx 渲染结构

```tsx
<main className="flex-1 flex overflow-hidden">
  {showDesktopLayout && <LeftHub ... />}
  {isMobileLandscape && <MobileLandscapeHub ... />}
  <div className="flex-1 relative overflow-hidden ...">{renderCenterView()}</div>
  {showDesktopLayout ? <RightInspector /> : <MobileDrawer ... />}
</main>
```

### 3.3 删除缩放方案

[index.css](../../03_Web_Rebuild/src/index.css) 中移除：
```css
.mobile-landscape-scale {
  transform: scale(0.85);
  transform-origin: top center;
  width: 117.64% !important;
  height: 117.64% !important;
}
```

### 3.4 helpers.ts waitForMainUI 对齐 useBreakpoint

```ts
const isTouch = await page.evaluate(() => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
});
const isMobile = viewport
  ? viewport.width < BREAKPOINT_MOBILE ||
    (isTouch && viewport.width > viewport.height && viewport.height <= 500)
  : false;
```

---

## 4. 测试运行记录

**命令**：
```bash
export no_proxy='localhost,127.0.0.1,::1'
npx playwright test src/test/e2e-playwright/responsive.spec.ts \
  --project=chromium-desktop --reporter=list --workers=1
```

**结果**：
```
22 passed (2.4m)
```

**关键通过项**：
- `hasTouch + 横屏 844×390 显示 MobileLandscapeHub 与抽屉，无缩放`
- `横屏 1024×500（非触控）走桌面布局，无 mobile-landscape-scale`
- `竖屏 → 横屏(touch) → 竖屏：A2 布局元素正确响应且无溢出`
- 设备矩阵 8 个尺寸下核心元素视口内可见性全部通过

---

## 5. 修复过程中的关键问题

### 问题 1：waitForMainUI 误判 mobile-landscape

**现象**：`hasTouch + 横屏 844×390` 用例在 `waitForMainUI` 处失败，因为它只看 `width < 768`，844px 被判定为桌面，于是等待 `LOG TELEMETRY`（BottomEventBar），但 A2 横屏不走桌面布局。

**修复**：在 `waitForMainUI` 中增加 touch + landscape + height<=500 的判定，与 `useBreakpoint` 对齐。

### 问题 2：MobileLandscapeHub 中 GameInstance 未使用

**现象**：ESLint 报错 `GameInstance` 为未使用导入。

**修复**：移除该导入。

---

## 6. 视觉验证

三方案预览图已生成并归档：

| 方案 | 文件 | 说明 |
|---|---|---|
| A1 | [mobile-landscape-plan-a1.jpg](./assets/mobile-landscape-plan-a1.jpg) | 保守版：底部导航 + 全宽星图 |
| A2 | [mobile-landscape-plan-a2.jpg](./assets/mobile-landscape-plan-a2.jpg) | 推荐版：左侧图标栏 + 中央星图 + 右侧抽屉 |
| B | [mobile-landscape-plan-b.jpg](./assets/mobile-landscape-plan-b.jpg) | 备选版：三栏压缩 |

---

## 7. 待关闭事项

| 编号 | 事项 | 状态 |
|---|---|---|
| T1 | 修复 `mobile-landscape-scale` 显示不全 | ✅ 已完成（移除缩放，改为 A2 布局） |
| T2 | 22/22 测试通过 | ✅ 已完成 |
| T3 | 跨浏览器矩阵验证（WebKit/Firefox/mobile-safari） | 🟡 建议后续执行 |
| T4 | PR CI 接入 responsive.spec.ts | 🟡 建议后续执行 |
| T5 | 视觉基线建立 | 🟡 建议后续执行 |

---

## 8. 相关文档

- [SPEC_20260805_MOBILE_LANDSCAPE_A2.md](../specs_and_architecture/SPEC_20260805_MOBILE_LANDSCAPE_A2.md)
- [AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md](./AUDIT_20260805_RESPONSIVE_LAYOUT_AUDIT.md)
- [EXEC_20260805_RESPONSIVE_TEST_EXPANSION.md](./EXEC_20260805_RESPONSIVE_TEST_EXPANSION.md)
- [AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md](./AUDIT_20260801_TEST_SYSTEM_COMPREHENSIVE.md)
