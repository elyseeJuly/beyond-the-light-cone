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
  const isMobile = viewport ? viewport.width < 768 : false;
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

  const isMobile = await page.evaluate(() => window.innerWidth < 640);
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
