import { Page, expect } from '@playwright/test';

/**
 * E2E 测试公共辅助函数
 */

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

/** 从封面启动引导，并通过真实交互推进到 read-status 步骤 */
export async function startTutorialToReadStatus(page: Page): Promise<void> {
  const newGameBtn = page.locator('button:has-text("重新构想 (开启引导)")');
  await expect(newGameBtn).toBeVisible();
  await newGameBtn.click();

  const skipBtn = page.getByTestId('tutorial-skip-btn');
  await expect(skipBtn).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: '开始校准' }).click();
  await expect(page.locator('text=选中家园星系')).toBeVisible({ timeout: 10000 });

  const earthHotspot = page.getByRole('button', { name: '选中地球' });
  await expect(earthHotspot).toBeVisible();
  await earthHotspot.focus();
  await page.keyboard.press('Enter');

  await expect(page.locator('text=监控三维产出')).toBeVisible({ timeout: 5000 });
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
