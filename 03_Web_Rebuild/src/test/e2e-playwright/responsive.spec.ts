import { test, expect } from '@playwright/test';
import { disableTutorial, skipTutorial, waitForMainUI } from './helpers';

test.describe('Responsive Layout', () => {
  test('桌面端显示 LeftHub 与 RightInspector', async ({ page }) => {
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

  test('移动端隐藏侧边栏并显示底部导航', async ({ page }) => {
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

  test('窗口尺寸切换时布局正确响应', async ({ page }) => {
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
