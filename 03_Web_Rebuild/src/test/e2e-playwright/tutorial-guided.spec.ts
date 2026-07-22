import { test, expect } from '@playwright/test';
import { dismissOrientationPrompt } from './helpers';

test.describe('Guided Tutorial E2E Flow (4-step simplified)', () => {
  test('正常完成四步强制教程', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    // 点击重新构想 (开启引导)
    const newGameBtn = page.locator('button:has-text("重新构想 (开启引导)")');
    await expect(newGameBtn).toBeVisible();
    await newGameBtn.click();
    await page.waitForTimeout(1800); // 等待欢迎页自动过渡 (1.5s)

    // 教程卡片出现
    const tutorialCard = page.locator('.relative.z-\\[1002\\]');
    await expect(tutorialCard).toBeVisible();

    // ===== 步骤 1：选中家园星系 =====
    await expect(page.locator('text=选中家园星系')).toBeVisible();
    await expect(page.locator('text=步骤 1 / 8')).toBeVisible();

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

    // ===== 步骤 2：监控三维产出 =====
    await expect(page.locator('text=监控三维产出')).toBeVisible();
    await expect(page.locator('text=步骤 2 / 8')).toBeVisible();
    await page.locator('button:has-text("下一步")').click();
    await page.waitForTimeout(300);

    // ===== 步骤 3：建设矿业基础 =====
    // 如果已经建好采矿场，可能会自动跳到步骤 4，此时不执行步骤 3 的操作与断言
    const isStep4 = await page.locator('text=步骤 4 / 8').isVisible().catch(() => false);
    if (!isStep4) {
      await expect(page.locator('text=建设矿业基础')).toBeVisible();
      await expect(page.locator('text=步骤 3 / 8')).toBeVisible();
      const buildStopeBtn = page.locator('[data-tutorial-id="btn-build-stope"]');
      if (await buildStopeBtn.isVisible()) {
        const stopeRect = await buildStopeBtn.boundingBox();
        if (stopeRect) {
          await page.mouse.click(stopeRect.x + stopeRect.width / 2, stopeRect.y + stopeRect.height / 2);
        }
      } else {
        await page.evaluate(() => {
          const game = (window as any).GameInstance?.get?.();
          if (game) {
            const star = game.starManager.getStar(3);
            if (star) star.hasStope = true;
            window.dispatchEvent(new CustomEvent('game-state-changed'));
          }
        });
      }
      await page.waitForTimeout(500);
    }

    // ===== 步骤 4：调配劳力分配 =====
    await expect(page.locator('text=调配劳力分配')).toBeVisible();
    await expect(page.locator('text=步骤 4 / 8')).toBeVisible();
    await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      if (game) {
        game.earthCivi.miningRatio = 40;
        window.dispatchEvent(new CustomEvent('game-state-changed'));
      }
    });
    await page.waitForTimeout(500);

    // ===== 步骤 5：启动科技演进 =====
    await expect(page.locator('text=启动科技演进')).toBeVisible();
    await expect(page.locator('text=步骤 5 / 8')).toBeVisible();
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

    // ===== 步骤 6：执行首回合决策 =====
    await expect(page.locator('text=执行首回合决策')).toBeVisible();
    await expect(page.locator('text=步骤 6 / 8')).toBeVisible();
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('game-turn-complete'));
    });
    await page.waitForTimeout(600);

    // ===== 步骤 7：应对突发危机 =====
    await expect(page.locator('text=应对突发危机')).toBeVisible();
    await expect(page.locator('text=步骤 7 / 8')).toBeVisible();
    
    // 弹窗可能处于打字机动画或有多页，循环点击“下一页”/“快速解密”直到出现并选择选项
    let choiceClicked = false;
    for (let attempt = 0; attempt < 15 && !choiceClicked; attempt++) {
      const choiceBtn = page.locator('.story-choice-btn').first();
      if (await choiceBtn.isVisible().catch(() => false)) {
        await choiceBtn.click({ force: true, timeout: 2000 }).catch(() => {});
        choiceClicked = true;
        break;
      }
      const proceedBtn = page.locator('.story-proceed-btn, .story-acknowledge-btn').first();
      if (await proceedBtn.isVisible().catch(() => false)) {
        await proceedBtn.click({ force: true, timeout: 2000 }).catch(() => {});
      }
      await page.waitForTimeout(400);
    }

    await page.waitForTimeout(1000);
    await page.locator('button:has-text("下一步")').click();
    await page.waitForTimeout(400);

    // ===== 步骤 8：智脑校准完毕 =====
    await expect(page.locator('text=智脑校准完毕')).toBeVisible();
    await expect(page.locator('text=步骤 8 / 8')).toBeVisible();
    await page.locator('button:has-text("完成校准")').click();
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

    const newGameBtn = page.locator('button:has-text("重新构想 (开启引导)")');
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
