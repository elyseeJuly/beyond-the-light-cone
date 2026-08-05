import { Page, expect } from '@playwright/test';
import { t } from "../../utils/i18n";

/**
 * E2E 测试公共辅助函数
 */

/**
 * 身份断言：确保 Playwright 真在测试本应用，而非复用了其他项目占用 4173 端口的 preview。
 * 每个 spec 的 beforeEach 都应调用。检查页面 title 与 application-name meta。
 */
export async function assertIsThisApp(page: Page): Promise<void> {
  await expect(page).toHaveTitle(/光锥之外|Beyond[- ]?the[- ]?Light[- ]?Cone/i);
  const appName = await page.evaluate(() =>
    document.querySelector('meta[name="application-name"]')?.getAttribute('content') || ''
  );
  expect(appName).toContain('光锥之外');
}

/** 通过 localStorage 禁用教程弹窗（写入与当前版本号匹配的完成记录） */
export async function disableTutorial(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('game-tutorial-progress', JSON.stringify({
      version: '2026-07-24-v1',
      completedAt: Date.now(),
    }));
    localStorage.setItem('skip_cover', 'true');
  });
}

/** 跳过首次教程弹窗（兼容 localStorage 未生效时兜底） */
export async function skipTutorial(page: Page): Promise<void> {
  const skipBtn = page.locator(t("button:has-text(\"跳过教程\")"));
  try {
    await expect(skipBtn).toBeVisible({ timeout: 5000 });
    await skipBtn.click();
    await expect(skipBtn).not.toBeVisible();
  } catch {
    // 教程已通过 localStorage 禁用或不可见
  }
}

/** 等待主界面关键元素就绪 */
export async function waitForMainUI(page: Page): Promise<void> {
  await expect(page.locator('header')).toBeVisible();

  const viewport = page.viewportSize();
  const isTouch = await page.evaluate(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });
  // 与 useBreakpoint.ts 对齐：mobile 包含 touch + landscape + height<=500 的情况
  const isMobile = viewport
    ? viewport.width < BREAKPOINT_MOBILE ||
      (isTouch && viewport.width > viewport.height && viewport.height <= 500)
    : false;
  if (!isMobile) {
    await expect(page.locator('text=LOG TELEMETRY')).toBeVisible();
  }

  // 主星图包含两个 canvas（star-canvas-main 与 star-canvas-react）
  await expect(page.locator('canvas#star-canvas-main')).toBeAttached();
  await expect(page.locator('canvas#star-canvas-react')).toBeAttached();
}

/** 关闭移动端横屏提示弹窗 */
export async function dismissOrientationPrompt(page: Page): Promise<void> {
  const okBtn = page.locator(t("button:has-text(\"我知道了\")"));
  try {
    await expect(okBtn).toBeVisible({ timeout: 3000 });
    await okBtn.click();
    await expect(okBtn).not.toBeVisible();
  } catch {
    // 弹窗未出现（桌面端或已被关闭）
  }
}

/** 从封面启动引导，并通过真实交互推进到 read-status 步骤 */
export async function startTutorialToReadStatus(page: Page): Promise<void> {
  const newGameBtn = page.locator(t("button:has-text(\"重新构想 (开启引导)\")"));
  await expect(newGameBtn).toBeVisible();
  await newGameBtn.click();

  const skipBtn = page.getByTestId('tutorial-skip-btn');
  await expect(skipBtn).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: t("开始校准") }).click();
  await expect(page.locator(t("text=选中家园星系"))).toBeVisible({ timeout: 10000 });

  const earthHotspot = page.getByRole('button', { name: t("选中地球") });
  await expect(earthHotspot).toBeVisible();
  await earthHotspot.focus();
  await page.keyboard.press('Enter');

  await expect(page.locator(t("text=监控三维产出"))).toBeVisible({ timeout: 5000 });
}

/** 点击下一回合（优先使用键盘空格，兼容按钮点击） */
export async function clickNextTurn(page: Page): Promise<void> {
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
}

/** 打开指定侧边栏视图（桌面端用 LeftHub，移动端用底部导航） */
export async function switchView(page: Page, viewName: string): Promise<void> {
  // If a full-screen overlay like MuseumGallery (archive) is open, close it first
  const closeBtn = page.locator('button:has(svg.lucide-x)');
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(300);
  }

  // 与 useBreakpoint.ts 的 mobile 阈值保持一致：< 768px
  const isMobile = await page.evaluate(() => window.innerWidth < 768);
  if (isMobile) {
    const navBtn = page.locator(`[data-tutorial-id="mobile-nav-${viewName}"]`);
    if (await navBtn.isVisible().catch(() => false)) {
      await navBtn.click();
      return;
    }
  }
  // 桌面端：点击 LeftHub 导航项
  const navBtn = page.locator(`[data-tutorial-id="nav-${viewName}"]`);
  if (await navBtn.isVisible().catch(() => false)) {
    await navBtn.click();
  } else {
    // 兜底：使用键盘快捷键
    const shortcutMap: Record<string, string> = {
      starmap: 'm',
      intelligence: 'i',
      techtree: 't',
      government: 'g',
      archive: 'a',
    };
    if (shortcutMap[viewName]) {
      await page.keyboard.press(shortcutMap[viewName]);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 尺寸自适应测试工具
// ──────────────────────────────────────────────────────────────────────────

/** 与 useBreakpoint.ts 对齐的断点阈值（单一来源，避免多处散落不一致） */
export const BREAKPOINT_MOBILE = 768;
export const BREAKPOINT_TABLET = 1024;
export const BREAKPOINT_DESKTOP = 1536;

/**
 * 在 Playwright 中推断当前视口对应的断点。
 * 注意：与 useBreakpoint 的 isMobileDevice 判定保持一致——
 * 横屏触控设备（height <= 500）也归入 mobile，但 Playwright 桌面浏览器
 * 没有 ontouchstart，所以这里只按 width 判断，mobile-landscape 场景
 * 由 hasTouch + 横屏 viewport 单独覆盖。
 */
export function getViewportBreakpoint(width: number, height: number): {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isLandscape: boolean;
  /** 横屏手机：宽 < 768 且 height <= 500（粗略对应 mobile-landscape-scale 触发条件） */
  isMobileLandscape: boolean;
} {
  return {
    isMobile: width < BREAKPOINT_MOBILE,
    isTablet: width >= BREAKPOINT_MOBILE && width < BREAKPOINT_TABLET,
    isDesktop: width >= BREAKPOINT_TABLET && width < BREAKPOINT_DESKTOP,
    isWide: width >= BREAKPOINT_DESKTOP,
    isLandscape: width > height,
    isMobileLandscape: width < BREAKPOINT_MOBILE && height <= 500,
  };
}

/**
 * 断言元素整体位于视口内（不超出、不被裁剪）。
 * 用于检测"显示不全"类回归。
 *
 * @param tolerance 允许的像素容差，默认 1px（应对 subpixel rendering）
 */
export async function expectInViewport(
  page: Page,
  locator: import('@playwright/test').Locator,
  options: { tolerance?: number; description?: string } = {}
): Promise<void> {
  const tolerance = options.tolerance ?? 1;
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error('expectInViewport 需要 page 设置 viewportSize');
  }
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(
      `expectInViewport: 元素无 boundingBox${options.description ? ` (${options.description})` : ''}`
    );
  }
  const overflowLeft = -box.x;
  const overflowTop = -box.y;
  const overflowRight = box.x + box.width - viewport.width;
  const overflowBottom = box.y + box.height - viewport.height;

  const desc = options.description ?? '元素';
  expect(overflowLeft, `${desc} 左侧超出视口 ${overflowLeft}px`).toBeLessThanOrEqual(tolerance);
  expect(overflowTop, `${desc} 顶部超出视口 ${overflowTop}px`).toBeLessThanOrEqual(tolerance);
  expect(overflowRight, `${desc} 右侧超出视口 ${overflowRight}px`).toBeLessThanOrEqual(tolerance);
  expect(overflowBottom, `${desc} 底部超出视口 ${overflowBottom}px`).toBeLessThanOrEqual(tolerance);
}

/**
 * 断言元素水平方向不超出视口（垂直方向允许滚动）。
 * 用于 TopHUD 这类固定高度但可能横向溢出的栏式布局。
 */
export async function expectHorizontallyInViewport(
  page: Page,
  locator: import('@playwright/test').Locator,
  options: { tolerance?: number; description?: string } = {}
): Promise<void> {
  const tolerance = options.tolerance ?? 1;
  const viewport = page.viewportSize();
  if (!viewport) {
    throw new Error('expectHorizontallyInViewport 需要 page 设置 viewportSize');
  }
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(
      `expectHorizontallyInViewport: 元素无 boundingBox${options.description ? ` (${options.description})` : ''}`
    );
  }
  const overflowLeft = -box.x;
  const overflowRight = box.x + box.width - viewport.width;

  const desc = options.description ?? '元素';
  expect(overflowLeft, `${desc} 左侧超出视口 ${overflowLeft}px`).toBeLessThanOrEqual(tolerance);
  expect(overflowRight, `${desc} 右侧超出视口 ${overflowRight}px`).toBeLessThanOrEqual(tolerance);
}

/**
 * 在指定视口尺寸下加载主界面并返回断点信息。
 * 封装了 disableTutorial + goto + skipTutorial + waitForMainUI 的标准流程。
 */
export async function loadAtViewport(
  page: Page,
  width: number,
  height: number,
  options: { hasTouch?: boolean } = {}
): Promise<ReturnType<typeof getViewportBreakpoint>> {
  await disableTutorial(page);
  await page.setViewportSize({ width, height });
  if (options.hasTouch !== undefined) {
    // 注入 touch 标记，模拟移动端浏览器
    await page.addInitScript((hasTouch: boolean) => {
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: hasTouch ? 1 : 0,
        configurable: true,
      });
      if (hasTouch) {
        (window as any).ontouchstart = () => {};
      }
    }, options.hasTouch);
  }
  await page.goto('/');
  await skipTutorial(page);
  await waitForMainUI(page);
  return getViewportBreakpoint(width, height);
}
