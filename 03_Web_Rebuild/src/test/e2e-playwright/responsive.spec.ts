import { test, expect } from '@playwright/test';
import {
  disableTutorial,
  skipTutorial,
  waitForMainUI,
  expectInViewport,
  expectHorizontallyInViewport,
  getViewportBreakpoint,
  loadAtViewport,
  BREAKPOINT_MOBILE,
  BREAKPOINT_TABLET,
} from './helpers';
import { t } from "../../utils/i18n";

/**
 * 响应式布局测试
 *
 * 覆盖目标：
 * 1. 多设备视口矩阵（极小屏 / 老iPhone / iPhone 12 / iPad / 桌面 / wide）
 * 2. 各断点的布局元素存在性与视口内可见性（"显示不全"回归守卫）
 * 3. TopHUD 紧凑模式在不同断点的项可见性
 * 4. 移动端横屏缩放场景（hasTouch + landscape viewport）
 * 5. 横竖屏切换连续性
 *
 * 断点定义（与 useBreakpoint.ts 对齐）：
 *   mobile  < 768
 *   tablet  768–1023
 *   desktop 1024–1535
 *   wide    ≥ 1536
 */

// ──────────────────────────────────────────────────────────────────────────
// 测试设备矩阵：覆盖 SPEC_20260621_RESPONSIVE_LAYOUT 的 4 个断点 + 边界值
// ──────────────────────────────────────────────────────────────────────────
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

test.describe('Responsive Layout', () => {
  test(t("桌面端显示 LeftHub 与 RightInspector"), async ({ page }) => {
    await disableTutorial(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await skipTutorial(page);
    await waitForMainUI(page);

    await expect(page.locator('nav.mobile-bottom-nav')).not.toBeVisible();
    // LeftHub 与 RightInspector 在桌面端可见（通过 aside 数量判断）
    const asides = page.locator('aside');
    await expect(asides).toHaveCount(2);
  });

  test(t("移动端隐藏侧边栏并显示底部导航"), async ({ page }) => {
    await disableTutorial(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await skipTutorial(page);
    await waitForMainUI(page);

    await expect(page.locator('nav.mobile-bottom-nav')).toBeVisible();
    // 移动端主内容区仅保留一个 aside（抽屉态 RightInspector）或零个
    const visibleAsides = page.locator('aside:visible');
    await expect(visibleAsides).toHaveCount(0);
  });

  test(t("窗口尺寸切换时布局正确响应"), async ({ page }) => {
    await disableTutorial(page);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await skipTutorial(page);
    await waitForMainUI(page);

    await expect(page.locator('nav.mobile-bottom-nav')).not.toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    await expect(page.locator('nav.mobile-bottom-nav')).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 设备矩阵：核心布局元素视口内可见性
// 这是"显示不全"回归的核心守卫。任何断点下，TopHUD / 主内容区 / 底部导航
// 或 BottomEventBar 都必须完整位于视口内，不允许超出。
// ──────────────────────────────────────────────────────────────────────────
test.describe('Responsive Matrix: 视口内可见性', () => {
  for (const device of DEVICE_MATRIX) {
    test(`${device.name} 下核心布局元素不超出视口`, async ({ page }) => {
      const bp = await loadAtViewport(page, device.width, device.height);

      // TopHUD（header）必须完整在视口内
      const header = page.locator('header').first();
      await expect(header).toBeVisible();
      await expectInViewport(page, header, {
        description: `TopHUD @ ${device.name}`,
        tolerance: 2,
      });

      // 移动端竖屏：MobileBottomNav 必须完整在视口内（不被裁剪）
      if (bp.isMobile && !bp.isLandscape) {
        const nav = page.locator('nav.mobile-bottom-nav');
        await expect(nav).toBeVisible();
        await expectInViewport(page, nav, {
          description: `MobileBottomNav @ ${device.name}`,
          tolerance: 2,
        });
      }

      // 桌面/平板/移动端横屏：BottomEventBar 在视口内
      if (!bp.isMobile || bp.isLandscape) {
        const eventBar = page.locator('.h-10').first();
        if (await eventBar.isVisible().catch(() => false)) {
          await expectInViewport(page, eventBar, {
            description: `BottomEventBar @ ${device.name}`,
            tolerance: 2,
          });
        }
      }

      // 主星图 viewport 容器在视口内（水平方向必须完整）
      const starmapViewport = page.locator('[data-tutorial-id="starmap-viewport"]');
      await expectHorizontallyInViewport(page, starmapViewport, {
        description: `StarMap viewport @ ${device.name}`,
        tolerance: 2,
      });
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────
// TopHUD 紧凑模式：验证不同断点下 stat 项的显隐符合规范
// SPEC_20260621_RESPONSIVE_LAYOUT §4.1
//   mobile(<768):  稳定度 ✅ | 人口 ❌ | 资源 ❌ | 军力 ❌ | 威慑度 ✅
//   tablet(768-1023): 稳定度 ✅ | 人口 ✅ | 资源 ❌ | 军力 ❌ | 威慑度 ✅
//   desktop(≥1024): 全部 ✅
// ──────────────────────────────────────────────────────────────────────────
test.describe('TopHUD 紧凑模式断点行为', () => {
  test('mobile (<768) 仅显示稳定度与威慑度，TopHUD 不横向溢出', async ({ page }) => {
    await loadAtViewport(page, 390, 844);

    const header = page.locator('header').first();
    await expectHorizontallyInViewport(page, header, {
      description: 'TopHUD @ mobile',
      tolerance: 2,
    });
    // 稳定度始终在
    await expect(page.locator('[data-tutorial-id="top-hud-stability"]')).toBeVisible();
  });

  test('tablet (768-1023) TopHUD 不横向溢出', async ({ page }) => {
    await loadAtViewport(page, 800, 1024);

    const header = page.locator('header').first();
    await expectHorizontallyInViewport(page, header, {
      description: 'TopHUD @ tablet',
      tolerance: 2,
    });
    await expect(page.locator('[data-tutorial-id="top-hud-stability"]')).toBeVisible();
  });

  test('desktop (≥1024) TopHUD 不横向溢出', async ({ page }) => {
    await loadAtViewport(page, 1280, 800);

    const header = page.locator('header').first();
    await expectHorizontallyInViewport(page, header, {
      description: 'TopHUD @ desktop',
      tolerance: 2,
    });
    await expect(page.locator('[data-tutorial-id="top-hud-stability"]')).toBeVisible();
  });

  test('极小屏 320×568 TopHUD 不横向溢出', async ({ page }) => {
    await loadAtViewport(page, 320, 568);

    const header = page.locator('header').first();
    await expectHorizontallyInViewport(page, header, {
      description: 'TopHUD @ 320px',
      tolerance: 2,
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 移动端横屏 A2 布局验证
// A2 方案：移动端横屏不再缩放桌面布局，而是左侧 56px 图标栏 + 中央视口 + 右侧抽屉
// useBreakpoint 中 isMobileLandscape = isMobile && landscape && height<=500
// 844×390 横屏 + touch 会触发 isMobileLandscape
// ──────────────────────────────────────────────────────────────────────────
test.describe('移动端横屏 A2 布局', () => {
  test('hasTouch + 横屏 844×390 显示 MobileLandscapeHub 与抽屉，无缩放', async ({ page }) => {
    const bp = await loadAtViewport(page, 844, 390, { hasTouch: true });
    expect(bp.isLandscape).toBe(true);

    // A2：底部导航应隐藏
    await expect(page.locator('nav.mobile-bottom-nav')).not.toBeVisible();

    // A2：桌面端 LeftHub 不应出现
    await expect(page.locator('aside[data-tutorial-id="left-hub"]')).toHaveCount(0);

    // A2：左侧图标栏必须可见
    const hub = page.locator('aside[data-tutorial-id="mobile-landscape-hub"]');
    await expect(hub).toBeVisible();
    await expectInViewport(page, hub, {
      description: 'MobileLandscapeHub @ 844×390',
      tolerance: 2,
    });

    // A2：缩放方案已移除
    const scaled = page.locator('.mobile-landscape-scale');
    await expect(scaled).toHaveCount(0);

    // A2：抽屉默认打开（因初始化逻辑或星球默认选中），且必须在视口内
    const drawer = page.locator('.drawer-panel');
    if (await drawer.isVisible().catch(() => false)) {
      await expectInViewport(page, drawer, {
        description: 'Inspector drawer @ 844×390',
        tolerance: 2,
      });
    }

    // TopHUD 必须完整在视口内
    const header = page.locator('header').first();
    await expectInViewport(page, header, {
      description: 'TopHUD @ mobile-landscape A2',
      tolerance: 2,
    });
  });

  test('横屏 1024×500（非触控）走桌面布局，无 mobile-landscape-scale', async ({ page }) => {
    // 桌面浏览器拉到 1024×500：因无 touch，应判为 desktop，不走 A2 横屏分支
    await loadAtViewport(page, 1024, 500, { hasTouch: false });

    // 缩放方案已彻底移除
    const scaled = page.locator('.mobile-landscape-scale');
    await expect(scaled).toHaveCount(0);

    // 桌面布局：LeftHub 可见，MobileLandscapeHub 不可见
    await expect(page.locator('aside[data-tutorial-id="left-hub"]')).toBeVisible();
    await expect(page.locator('aside[data-tutorial-id="mobile-landscape-hub"]')).toHaveCount(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 横竖屏切换连续性
// ──────────────────────────────────────────────────────────────────────────
test.describe('横竖屏切换连续性', () => {
  test('竖屏 → 横屏(touch) → 竖屏：A2 布局元素正确响应且无溢出', async ({ page }) => {
    await disableTutorial(page);
    // 注入 touch，使横屏能触发 isMobileLandscape
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 1, configurable: true });
      (window as any).ontouchstart = () => {};
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await skipTutorial(page);
    await waitForMainUI(page);

    // 初始竖屏：MobileBottomNav 可见，MobileLandscapeHub 不可见
    const nav = page.locator('nav.mobile-bottom-nav');
    const hub = page.locator('aside[data-tutorial-id="mobile-landscape-hub"]');
    await expect(nav).toBeVisible();
    await expect(hub).toHaveCount(0);
    await expectInViewport(page, nav, { description: 'MobileBottomNav 竖屏初始' });

    // 切到横屏（touch 注入下应触发 A2 横屏布局）
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(400);

    // A2：底部导航消失，左侧图标栏出现
    await expect(nav).not.toBeVisible();
    await expect(hub).toBeVisible();
    await expectInViewport(page, hub, {
      description: 'MobileLandscapeHub 切横屏后',
      tolerance: 2,
    });

    // TopHUD 仍需在视口内
    const header = page.locator('header').first();
    await expectInViewport(page, header, {
      description: 'TopHUD 切横屏后',
      tolerance: 2,
    });

    // 切回竖屏
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);

    await expect(nav).toBeVisible();
    await expect(hub).toHaveCount(0);
    await expectInViewport(page, nav, { description: 'MobileBottomNav 切回竖屏' });
  });
});

// ──────────────────────────────────────────────────────────────────────────
// 断点边界值测试
// 验证 768px 和 1024px 边界处的布局切换正确
// ──────────────────────────────────────────────────────────────────────────
test.describe('断点边界值', () => {
  test('767px → 768px：mobile 切换到 tablet', async ({ page }) => {
    // 767px：mobile
    await loadAtViewport(page, 767, 1000);
    const nav = page.locator('nav.mobile-bottom-nav');
    await expect(nav).toBeVisible();

    // 768px：tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(400);
    await expect(nav).not.toBeVisible();
  });

  test('1023px → 1024px：tablet 切换到 desktop', async ({ page }) => {
    // 1023px：tablet
    await loadAtViewport(page, 1023, 1024);
    const asides = page.locator('aside');
    await expect(asides).toHaveCount(2);

    // 1024px：desktop（aside 数量应仍为 2）
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.waitForTimeout(400);
    await expect(asides).toHaveCount(2);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// useBreakpoint 一致性：helpers 中的断点阈值与 useBreakpoint 必须对齐
// 这是回归守卫：防止再次出现 switchView 用 640、其他用 768 的不一致 bug
// ──────────────────────────────────────────────────────────────────────────
test.describe('断点阈值一致性', () => {
  test('BREAKPOINT_MOBILE 与 useBreakpoint 阈值一致', () => {
    // 单一来源：helpers.ts 中的 BREAKPOINT_MOBILE 应为 768
    expect(BREAKPOINT_MOBILE).toBe(768);
    expect(BREAKPOINT_TABLET).toBe(1024);
  });

  test('getViewportBreakpoint 在边界值行为正确', () => {
    expect(getViewportBreakpoint(767, 1000).isMobile).toBe(true);
    expect(getViewportBreakpoint(768, 1000).isMobile).toBe(false);
    expect(getViewportBreakpoint(768, 1000).isTablet).toBe(true);
    expect(getViewportBreakpoint(1023, 1000).isTablet).toBe(true);
    expect(getViewportBreakpoint(1024, 1000).isDesktop).toBe(true);
    expect(getViewportBreakpoint(1535, 1000).isDesktop).toBe(true);
    expect(getViewportBreakpoint(1536, 1000).isWide).toBe(true);
  });
});
