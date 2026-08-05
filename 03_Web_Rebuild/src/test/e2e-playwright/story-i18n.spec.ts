import { test, expect } from '@playwright/test';
import { disableTutorial, skipTutorial, waitForMainUI } from './helpers';

/**
 * 多语言用户路径 E2E 骨架（审计 P1：英文剧情用户路径缺失）
 *
 * 覆盖目标：
 *   1. 预置 localStorage 为 en → 首屏渲染英文
 *   2. 通过 SettingsModal 切换 zh → 首屏渲染中文
 *   3. 在英文态触发随机剧情 → 验证英文标题/台词/选项
 *   4. 点击选项 → 原 action 仍执行
 *
 * 本骨架标记 .skip，待方案 A（i18n 守卫）落地后由后续迭代取消 skip 并补全断言。
 * 定位策略：使用 data-testid 与语义 selector，不依赖单一中文 copy。
 */

test.describe.skip('Story i18n User Path', () => {
  test.beforeEach(async ({ page }) => {
    await disableTutorial(page);
    await page.goto('/');
    await skipTutorial(page);
    await waitForMainUI(page);
  });

  test('英文态首屏渲染英文 UI 文案', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('game-lang', 'en');
    });
    await page.reload();
    await waitForMainUI(page);
    // 骨架断言：至少一处英文文案可见（具体 data-testid 待补全）
    await expect(page.locator('header')).toBeVisible();
  });

  test('通过 SettingsModal 切换到中文并验证文案变化', async ({ page }) => {
    // 打开设置（快捷键或按钮，具体待补全）
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    // 点击"中文简体 (Chinese)"按钮（文本是语言切换按钮的稳定锚点，中英态均包含此文案）
    const zhBtn = page.locator('button:has-text("中文简体")');
    await expect(zhBtn).toBeVisible({ timeout: 5000 });
    await zhBtn.click();
    await page.waitForTimeout(500);
    // 骨架断言：切换后页面仍可交互
    await expect(page.locator('header')).toBeVisible();
  });

  test('英文态触发随机剧情验证英文文案', async ({ page }) => {
    // 骨架：推进回合直至剧情弹出（具体回合数与 data-testid 待补全）
    test.skip(true, '骨架：待补全剧情触发与英文文案断言');
  });
});
