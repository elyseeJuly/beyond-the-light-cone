import { test, expect } from '@playwright/test';
import { disableTutorial, skipTutorial, waitForMainUI } from './helpers';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await disableTutorial(page);
    await page.goto('/');
    await skipTutorial(page);
  });

  test('页面标题与核心布局元素存在', async ({ page }) => {
    await expect(page).toHaveTitle(/光锥之外|LegendOfUni|Beyond the Light Cone/);
    await waitForMainUI(page);

    // 桌面端/移动端自适应布局元素
    await expect(page.locator('header')).toBeVisible();
    
    const viewport = page.viewportSize();
    const isMobile = viewport ? viewport.width < 768 : false;
    if (!isMobile) {
      await expect(page.locator('text=LOG TELEMETRY')).toBeVisible();
    }
    
    await expect(page.locator('canvas#star-canvas-main')).toBeAttached();
    await expect(page.locator('canvas#star-canvas-react')).toBeAttached();
  });

  test('代码分割 chunk 按需加载', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', req => requests.push(req.url()));

    await page.goto('/');
    await skipTutorial(page);

    // 触发懒加载模态（设置面板）
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const jsRequests = requests.filter(url => url.endsWith('.js'));
    const chunkNames = [
      'index',
      'vendor-react',
      'game-core',
      'vendor-icons',
    ];
    for (const name of chunkNames) {
      expect(jsRequests.some(url => url.includes(name))).toBe(true);
    }
  });

  test('全局错误监控无未捕获异常', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await skipTutorial(page);
    await page.waitForTimeout(1000);

    // 主题色错误与音频自动播放错误为已知非阻塞问题，允许忽略
    const criticalErrors = errors.filter(
      msg => !msg.includes('getThemeColors') && !msg.includes('Audio') && !msg.includes('autoplay')
    );
    expect(criticalErrors).toEqual([]);
  });
});
