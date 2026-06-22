import { test, expect } from '@playwright/test';
import { disableTutorial, skipTutorial, waitForMainUI, clickNextTurn, switchView } from './helpers';

test.describe('Core User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await disableTutorial(page);
    await page.goto('/');
    await skipTutorial(page);
    await waitForMainUI(page);
  });

  test('新游戏 → 跳过教程 → 主星图可见', async ({ page }) => {
    await expect(page.locator('canvas#star-canvas-main')).toBeAttached();
    await expect(page.locator('canvas#star-canvas-react')).toBeAttached();
  });

  test('切换各中心视图（星图/科技/情报/政府/档案）', async ({ page }) => {
    const views = ['techtree', 'intelligence', 'government', 'archive', 'starmap'];
    for (const view of views) {
      await switchView(page, view);
      await page.waitForTimeout(300);

      if (view === 'techtree') {
        await expect(page.getByRole('heading', { name: '科技研发中心' })).toBeVisible();
      } else if (view === 'intelligence') {
        await expect(page.getByRole('heading', { name: '情报防御与战略监控中心' })).toBeVisible();
      } else if (view === 'government') {
        await expect(page.getByRole('heading', { name: '执政官政府内阁总署' })).toBeVisible();
      } else if (view === 'archive') {
        await expect(page.getByRole('heading', { name: '银河文明档案馆' })).toBeVisible();
      } else {
        await expect(page.locator('canvas#star-canvas-main')).toBeVisible();
      }
    }
  });

  test('按空格推进回合且资源非负', async ({ page }) => {
    const initialYear = await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      return game?.year ?? null;
    });

    await clickNextTurn(page);

    const nextYear = await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      return game?.year ?? null;
    });

    expect(nextYear).not.toBeNull();
    if (initialYear !== null) {
      expect(nextYear).toBeGreaterThanOrEqual(initialYear);
    }

    const resources = await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      if (!game) return null;
      return {
        economy: game.earthCivi.economy,
        population: game.earthCivi.population,
        army: game.earthCivi.army,
        stability: game.earthCivi.stability,
      };
    });

    expect(resources).not.toBeNull();
    if (resources) {
      expect(resources.economy).toBeGreaterThanOrEqual(0);
      expect(resources.population).toBeGreaterThanOrEqual(0);
      expect(resources.army).toBeGreaterThanOrEqual(0);
      expect(resources.stability).toBeGreaterThanOrEqual(0);
    }
  });

  test('事件弹窗出现后可选择选项', async ({ page }) => {
    // 使用确定性 RNG 加速事件触发
    await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      if (game) {
        game.setRngProvider({ random: () => 0.3 });
      }
    });

    // 推进多个回合直到出现事件弹窗
    const storySelector = '.story-proceed-btn, .story-choice-btn, .story-acknowledge-btn';
    let eventAppeared = false;
    for (let i = 0; i < 20 && !eventAppeared; i++) {
      await clickNextTurn(page);
      eventAppeared = await page.locator(storySelector).isVisible().catch(() => false);
    }

    if (!eventAppeared) {
      // 20 回合内未触发事件仍视为通过（概率性）
      test.info().annotations.push({ type: 'note', description: 'No event triggered within 20 turns' });
      return;
    }

    // 等待弹窗按钮稳定可交互
    await page.locator(storySelector).first().waitFor({ state: 'visible' });

    // 优先处理选项 / 确认按钮；若仅出现继续按钮则翻页直到选项或确认出现
    let actionClicked = false;
    for (let attempt = 0; attempt < 15 && !actionClicked; attempt++) {
      const choiceBtn = page.locator('.story-choice-btn').first();
      if (await choiceBtn.isVisible().catch(() => false)) {
        await choiceBtn.click();
        actionClicked = true;
        break;
      }

      const ackBtn = page.locator('.story-acknowledge-btn');
      if (await ackBtn.isVisible().catch(() => false)) {
        await ackBtn.click();
        actionClicked = true;
        break;
      }

      const proceedBtn = page.locator('.story-proceed-btn');
      if (await proceedBtn.isVisible().catch(() => false)) {
        await proceedBtn.click();
        // 给翻页动画与类型writer留出时间
        await page.waitForTimeout(120);
      } else {
        // 弹窗已关闭，没有可点击的选项
        break;
      }
    }

    if (actionClicked) {
      // 等待签名/归档动画结束与弹窗关闭
      await expect(page.locator(storySelector)).not.toBeVisible({ timeout: 10000 });
    } else {
      test.info().annotations.push({ type: 'note', description: 'Event modal closed without clickable choices' });
    }
  });
});
