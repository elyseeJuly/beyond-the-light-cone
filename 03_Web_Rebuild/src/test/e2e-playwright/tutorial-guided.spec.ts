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

    // 教程卡片出现
    const tutorialCard = page.locator('.relative.z-\[1002\]');
    await expect(tutorialCard).toBeVisible();

    // ===== 步骤 1：点击地球 =====
    await expect(page.getByText('选中家园', { exact: true })).toBeVisible();
    await expect(page.getByText('步骤 1 / 4', { exact: true })).toBeVisible();

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

    // 应自动进入步骤 2
    await expect(page.getByText('步骤 2 / 4', { exact: true })).toBeVisible();
    await expect(page.getByText('资源生产', { exact: true })).toBeVisible();

    // ===== 步骤 2：调整采矿劳动力比例 =====
    // 当前新游戏已经拥有采矿场，生产教程走 mining-ratio-section 路径，
    // 旧 E2E 寻找 btn-build-stope 已与实际教程条件分支不一致。
    const miningSection = page.locator('[data-tutorial-id="mining-ratio-section"]');
    await expect(miningSection).toBeVisible();
    const miningSlider = miningSection.locator('input[type="range"]');
    await expect(miningSlider).toBeVisible();
    const currentMiningRatio = Number(await miningSlider.inputValue());
    const nextMiningRatio = currentMiningRatio >= 100
      ? Math.max(0, currentMiningRatio - 1)
      : currentMiningRatio + 1;
    await miningSlider.fill(String(nextMiningRatio));

    // 应自动进入步骤 3
    await expect(page.getByText('步骤 3 / 4', { exact: true })).toBeVisible();
    await expect(page.getByText('启动科研', { exact: true })).toBeVisible();

    // ===== 步骤 3：启动科研 =====
    // 设置真实游戏状态；Tutorial 每 300ms 轮询 node.inResearch。
    await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      if (game) {
        const earth = game.earthCivi;
        outer: for (const tree of earth.tecTreeManager.trees.values()) {
          for (const node of tree.nodes.values()) {
            if (!node.finished) {
              node.inResearch = true;
              break outer;
            }
          }
        }
      }
    });

    // 应自动进入步骤 4
    await expect(page.getByText('步骤 4 / 4', { exact: true })).toBeVisible();
    await expect(page.getByText('推进回合', { exact: true })).toBeVisible();

    // ===== 步骤 4：推进下一回合 =====
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('game-turn-complete'));
    });

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

    const tutorialCard = page.locator('.relative.z-\[1002\]');
    await expect(tutorialCard).toBeVisible();

    // 点击跳过教程按钮
    const skipBtn = page.locator('[data-testid="tutorial-skip-btn"]');
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();

    // 教程卡片已关闭
    await expect(tutorialCard).not.toBeVisible();
    const tutorialSeen = await page.evaluate(() => localStorage.getItem('game-tutorial-seen'));
    expect(tutorialSeen).toBe('true');
  });
});
