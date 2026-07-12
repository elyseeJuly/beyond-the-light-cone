import { test, expect } from '@playwright/test';
import { dismissOrientationPrompt } from './helpers';

test.describe('Guided Tutorial E2E Flow (4-step simplified)', () => {
  test('正常完成四步强制教程', async ({ page }) => {
    test.setTimeout(45000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    // 点击开始新游戏 (启用引导)
    const newGameBtn = page.locator('button:has-text("开始新游戏 (启用引导)")');
    await expect(newGameBtn).toBeVisible();
    await newGameBtn.click();
    await page.waitForTimeout(400);

    // 教程卡片出现
    const tutorialCard = page.locator('.relative.z-\\[1002\\]');
    await expect(tutorialCard).toBeVisible();

    // ===== 步骤 1：点击地球 =====
    await expect(page.locator('text=选中家园')).toBeVisible();
    await expect(page.locator('text=步骤 1 / 4')).toBeVisible();

    // 模拟点击地球（派发 star-selected 事件）
    await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      if (game) {
        const earthStar = game.starManager.getStar(3);
        if (earthStar) {
          window.dispatchEvent(new CustomEvent('star-selected', { detail: earthStar }));
        }
      }
    });
    await page.waitForTimeout(300);

    // 应自动进入步骤 2
    await expect(page.locator('text=步骤 2 / 4')).toBeVisible();
    await expect(page.locator('text=资源生产')).toBeVisible();

    // ===== 步骤 2：建造采矿场 =====
    // 教程自动切换 inspectorTab 到 build
    await page.waitForTimeout(300);
    const buildStopeBtn = page.locator('[data-tutorial-id="btn-build-stope"]');
    if (await buildStopeBtn.isVisible()) {
      const stopeRect = await buildStopeBtn.boundingBox();
      if (stopeRect) {
        await page.mouse.click(stopeRect.x + stopeRect.width / 2, stopeRect.y + stopeRect.height / 2);
      }
    }
    await page.waitForTimeout(500);

    // 应自动进入步骤 3
    await expect(page.locator('text=步骤 3 / 4')).toBeVisible();
    await expect(page.locator('text=启动科研')).toBeVisible();

    // ===== 步骤 3：启动科研 =====
    // 模拟启动一项科研
    await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      if (game) {
        const earth = game.earthCivi;
        for (const tree of earth.tecTreeManager.trees.values()) {
          for (const node of tree.nodes.values()) {
            if (!node.finished) {
              node.inResearch = true;
              break;
            }
          }
          break;
        }
      }
    });
    await page.waitForTimeout(500);

    // 应自动进入步骤 4
    await expect(page.locator('text=步骤 4 / 4')).toBeVisible();
    await expect(page.locator('text=推进回合')).toBeVisible();

    // ===== 步骤 4：推进下一回合 =====
    // 模拟推进回合
    await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      if (game) {
        window.dispatchEvent(new CustomEvent('game-turn-complete'));
      }
    });
    await page.waitForTimeout(600);

    // 教程卡片已关闭
    await expect(tutorialCard).not.toBeVisible();

    // localStorage 已标记教程完成
    const tutorialSeen = await page.evaluate(() => localStorage.getItem('game-tutorial-seen'));
    expect(tutorialSeen).toBe('true');
  });

  test('跳过教程功能正常', async ({ page }) => {
    test.setTimeout(20000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    const newGameBtn = page.locator('button:has-text("开始新游戏 (启用引导)")');
    await newGameBtn.click();
    await page.waitForTimeout(400);

    const tutorialCard = page.locator('.relative.z-\\[1002\\]');
    await expect(tutorialCard).toBeVisible();

    // 点击跳过教程按钮
    const skipBtn = page.locator('[data-testid="tutorial-skip-btn"]');
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();
    await page.waitForTimeout(500);

    // 教程卡片已关闭
    await expect(tutorialCard).not.toBeVisible();
    const tutorialSeen = await page.evaluate(() => localStorage.getItem('game-tutorial-seen'));
    expect(tutorialSeen).toBe('true');
  });
});
