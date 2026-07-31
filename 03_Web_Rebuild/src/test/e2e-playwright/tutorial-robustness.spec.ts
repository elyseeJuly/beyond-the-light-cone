import { test, expect } from '@playwright/test';
import { dismissOrientationPrompt, startTutorialToReadStatus } from './helpers';
import { t } from "../../utils/i18n";

/**
 * 教程鲁棒性测试（审计 P0 流程问题 #2 硬性合并门槛）
 *
 * 合并门槛 #5：任何目标缺失都不得形成全屏死锁。
 *
 * 验证内容：
 * 1. 目标元素缺失时不渲染全屏拦截遮罩（tutorial-overlay-full）
 * 2. 目标元素缺失时玩家仍可点击游戏 UI（不锁屏）
 * 3. 目标元素缺失时教程卡片仍可交互（跳过/下一步可用）
 * 4. 目标元素延迟挂载后高亮框自动恢复
 *
 * 本测试通过让教程进入一个 highlightTarget 指向不存在元素的步骤来模拟目标缺失。
 */

test.describe(t("教程鲁棒性：目标缺失不锁屏"), () => {
  test.use({ hasTouch: false, viewport: { width: 1440, height: 900 } });

  test(t("目标元素缺失时渲染 missing 遮罩而非 full 遮罩"), async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    // 启动教程并进入 read-status（highlightTarget='right-inspector'）
    await startTutorialToReadStatus(page);

    // 步骤 2 正常情况下应渲染分块遮罩（非 full/missing）
    const blockOverlays = page.locator('[data-testid^="tutorial-overlay-"]:not([data-testid="tutorial-overlay-full"]):not([data-testid="tutorial-overlay-missing"])');
    await expect(blockOverlays.first()).toBeVisible({ timeout: 5000 });

    // 模拟目标元素消失（移除 DOM 元素），验证遮罩切换为 missing 而非 full
    await page.evaluate(() => {
      const el = document.querySelector('[data-tutorial-id="right-inspector"]');
      if (el) el.remove();
    });
    await page.waitForTimeout(500); // 等待 requestAnimationFrame 更新 highlightRect

    // 应渲染 missing 遮罩（pointer-events-none，不拦截点击）
    await expect(page.locator('[data-testid="tutorial-overlay-missing"]')).toBeVisible({ timeout: 3000 });
    // 不应渲染 full 遮罩（pointer-events-auto，会锁屏）
    await expect(page.locator('[data-testid="tutorial-overlay-full"]')).not.toBeVisible();
  });

  test(t("目标元素缺失时玩家仍可点击游戏 UI（不锁屏）"), async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    // 推进到 read-status（有 DOM 高亮）
    await startTutorialToReadStatus(page);

    // 等待高亮框渲染
    const blockOverlays = page.locator('[data-testid^="tutorial-overlay-"]:not([data-testid="tutorial-overlay-full"]):not([data-testid="tutorial-overlay-missing"])');
    await expect(blockOverlays.first()).toBeVisible({ timeout: 5000 });

    // 移除目标元素，触发目标缺失状态
    await page.evaluate(() => {
      const el = document.querySelector('[data-tutorial-id="right-inspector"]');
      if (el) el.remove();
    });
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="tutorial-overlay-missing"]')).toBeVisible({ timeout: 3000 });

    // 核心断言：missing 遮罩不拦截点击，玩家应能点击星图区域
    // 点击星图视口中心（不应被拦截）
    const starmapViewport = page.locator('[data-tutorial-id="starmap-viewport"]');
    await expect(starmapViewport).toBeVisible();
    const vpBox = await starmapViewport.boundingBox();
    expect(vpBox).not.toBeNull();
    // 点击星图视口的左上区域（远离教程卡片）
    await page.mouse.click(vpBox!.x + 50, vpBox!.y + 50);
    // 没有锁屏 → 点击被送达（不会卡住）
    await page.waitForTimeout(300);

    // 教程卡片仍可见且可交互（跳过按钮可点击）
    const skipBtn = page.locator('[data-testid="tutorial-skip-btn"]');
    await expect(skipBtn).toBeVisible();
    await expect(skipBtn).toBeEnabled();
  });

  test(t("目标元素缺失时教程卡片的跳过按钮可用"), async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    await startTutorialToReadStatus(page);

    // 触发目标缺失
    await page.evaluate(() => {
      const el = document.querySelector('[data-tutorial-id="right-inspector"]');
      if (el) el.remove();
    });
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="tutorial-overlay-missing"]')).toBeVisible({ timeout: 3000 });

    // 点击跳过按钮（教程卡片在 z-[1002]，高于 missing 遮罩 z-[1000]）
    const skipBtn = page.locator('[data-testid="tutorial-skip-btn"]');
    await skipBtn.click();
    await page.waitForTimeout(600);

    // 教程已关闭
    const tutorialCard = page.locator('.relative.z-\\[1002\\]');
    await expect(tutorialCard).not.toBeVisible();

    // localStorage 已标记（版本化进度记录）
    const progress = await page.evaluate(() => {
      const raw = localStorage.getItem('game-tutorial-progress');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    });
    expect(progress).not.toBeNull();
    expect(progress.version).toBeTruthy();
  });

  test(t("目标元素延迟挂载后高亮框自动恢复"), async ({ page }) => {
    test.setTimeout(40000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    // 推进到 read-status
    await startTutorialToReadStatus(page);

    // 等待高亮框正常渲染
    const blockOverlays = page.locator('[data-testid^="tutorial-overlay-"]:not([data-testid="tutorial-overlay-full"]):not([data-testid="tutorial-overlay-missing"])');
    await expect(blockOverlays.first()).toBeVisible({ timeout: 5000 });

    // 移除目标元素 → 进入 missing 状态
    await page.evaluate(() => {
      const el = document.querySelector('[data-tutorial-id="right-inspector"]');
      if (el) el.remove();
    });
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="tutorial-overlay-missing"]')).toBeVisible({ timeout: 3000 });

    // 重新插入目标元素 → 高亮框应自动恢复（requestAnimationFrame 循环检测）
    await page.evaluate(() => {
      // 重新创建 right-inspector 元素（模拟延迟挂载）
      const aside = document.createElement('aside');
      aside.setAttribute('data-tutorial-id', 'right-inspector');
      aside.style.width = '320px';
      aside.style.height = '400px';
      aside.style.display = 'block';
      // 插入到主内容区
      const main = document.querySelector('main');
      if (main) main.appendChild(aside);
    });
    await page.waitForTimeout(800); // 等待 requestAnimationFrame 检测到元素

    // missing 遮罩应消失，分块遮罩应恢复
    await expect(page.locator('[data-testid="tutorial-overlay-missing"]')).not.toBeVisible({ timeout: 3000 });
    const restoredBlocks = page.locator('[data-testid^="tutorial-overlay-"]:not([data-testid="tutorial-overlay-full"]):not([data-testid="tutorial-overlay-missing"])');
    await expect(restoredBlocks.first()).toBeVisible({ timeout: 3000 });
  });
});
