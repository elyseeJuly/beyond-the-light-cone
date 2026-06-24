import { Page, expect } from '@playwright/test';

/**
 * E2E 测试公共辅助函数
 */

/** 通过 localStorage 禁用教程弹窗 */
export async function disableTutorial(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('game-tutorial-seen', 'true');
    localStorage.setItem('skip_cover', 'true');
  });
}

/** 跳过首次教程弹窗（兼容 localStorage 未生效时兜底） */
export async function skipTutorial(page: Page): Promise<void> {
  const skipBtn = page.locator('button:has-text("跳过教程")');
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
  const okBtn = page.locator('button:has-text("我知道了")');
  try {
    await expect(okBtn).toBeVisible({ timeout: 3000 });
    await okBtn.click();
    await expect(okBtn).not.toBeVisible();
  } catch {
    // 弹窗未出现（桌面端或已被关闭）
  }
}

/** 点击下一回合（优先使用键盘空格，兼容按钮点击） */
export async function clickNextTurn(page: Page): Promise<void> {
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
}

/** 打开指定侧边栏视图（桌面端用 LeftHub，移动端用底部导航） */
export async function switchView(page: Page, viewName: string): Promise<void> {
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
