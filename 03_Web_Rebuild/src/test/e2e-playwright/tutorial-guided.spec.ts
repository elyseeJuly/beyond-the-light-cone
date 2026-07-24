import { test, expect } from '@playwright/test';
import { dismissOrientationPrompt } from './helpers';

/**
 * 真实 E2E 黄金路径测试（重写）
 *
 * 审计结论 P0-4 修复：禁止通过 page.evaluate 修改游戏状态推进教程。
 * 所有步骤必须通过真实 DOM 点击/拖动完成，模拟真实玩家操作路径。
 *
 * 合并门槛：
 * 1. E2E 不直接派发教程完成事件（禁止 dispatchEvent('star-selected') 等）
 * 2. E2E 不直接修改游戏字段（禁止 game.earthCivi.miningRatio = 40 等）
 * 3. 所有步骤必须点击真实 UI 元素
 * 4. page.evaluate 仅允许用于只读断言（验证状态已变化），不得修改状态
 */

test.describe('Guided Tutorial E2E - 真实用户交互黄金路径', () => {
  test('完整教程黄金路径：真实点击推进全流程', async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    // ===== 封面：点击「重新构想 (开启引导)」 =====
    const newGameBtn = page.locator('button:has-text("重新构想 (开启引导)")');
    await expect(newGameBtn).toBeVisible();
    await newGameBtn.click();

    // GameInstance.reset() 内部 500ms 延迟后派发 open-tutorial，等待教程挂载
    // 欢迎页 1.5s 自动过渡，合计约 2s
    await page.waitForTimeout(2200);

    // 教程卡片渲染（welcome 步骤显示「序幕」）
    const tutorialCard = page.locator('.relative.z-\\[1002\\]');
    await expect(tutorialCard).toBeVisible();
    await expect(page.locator('text=序幕')).toBeVisible();

    // ===== 步骤 1：选中家园星系（click-earth） =====
    // 教程自动居中地球 + 自动派发 star-selected（教程内部行为，非测试旁路）
    await expect(page.locator('text=选中家园星系')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=步骤 1 / 8')).toBeVisible();

    // 验证右侧面板已显示地球信息（教程内部已派发 star-selected）
    await expect(page.locator('[data-tutorial-id="right-inspector"]')).toContainText('地球', { timeout: 5000 });

    // 点击「下一步」（requiresManualAdvance = true）
    await page.locator('button:has-text("下一步")').click();
    await page.waitForTimeout(400);

    // ===== 步骤 2：监控三维产出（read-status） =====
    await expect(page.locator('text=监控三维产出')).toBeVisible();
    await expect(page.locator('text=步骤 2 / 8')).toBeVisible();

    // 点击「下一步」（requiresManualAdvance = true）
    await page.locator('button:has-text("下一步")').click();
    await page.waitForTimeout(400);

    // ===== 步骤 3：建设矿业基础（build-stope） =====
    await expect(page.locator('text=建设矿业基础')).toBeVisible();
    await expect(page.locator('text=步骤 3 / 8')).toBeVisible();

    // 真实点击采矿场建造按钮（非 page.evaluate 修改 star.hasStope）
    const buildStopeBtn = page.locator('[data-tutorial-id="btn-build-stope"]');
    await expect(buildStopeBtn).toBeVisible({ timeout: 5000 });
    await buildStopeBtn.click();

    // 验证建设已真实启动（只读断言：buildingProgress.stope 已创建）
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const game = (window as any).GameInstance?.get?.();
        const star = game?.starManager?.getStar(3);
        return !!star?.buildingProgress?.stope;
      });
    }, { timeout: 5000, message: '采矿场建设应已启动' }).toBe(true);

    // 等待教程轮询（300ms）检测到状态变化并推进
    await expect(page.locator('text=调配劳力分配')).toBeVisible({ timeout: 5000 });

    // ===== 步骤 4：调配劳力分配（resource-production） =====
    await expect(page.locator('text=步骤 4 / 8')).toBeVisible();

    // 真实拖动采矿比例滑块（fill 触发真实 onChange → adjustWorkerRatio）
    const miningSlider = page.locator('[data-tutorial-id="mining-ratio-section"] input[type="range"]');
    await expect(miningSlider).toBeVisible({ timeout: 5000 });
    await miningSlider.fill('40');

    // 验证 miningRatio 已真实改变（只读断言）
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const game = (window as any).GameInstance?.get?.();
        return game?.earthCivi?.miningRatio ?? 0;
      });
    }, { timeout: 5000, message: '采矿比例应已调整为 40' }).toBe(40);

    // 等待教程轮询检测到 miningRatio 变化并推进
    await expect(page.locator('text=启动科技演进')).toBeVisible({ timeout: 5000 });

    // ===== 步骤 5：启动科技演进（start-research） =====
    await expect(page.locator('text=步骤 5 / 8')).toBeVisible();

    // 教程自动切换到 techtree 视图（change-active-view 事件）
    // 真实点击「天文观测」科技节点
    const techNode = page.locator('[data-tutorial-id="tech-node-天文观测"]');
    await expect(techNode).toBeVisible({ timeout: 8000 });
    await techNode.click();

    // 验证科研已真实启动（只读断言：某节点 inResearch = true）
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const game = (window as any).GameInstance?.get?.();
        if (!game?.earthCivi) return false;
        for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
          for (const node of tree.nodes.values()) {
            if (node.inResearch && !node.finished) return true;
          }
        }
        return false;
      });
    }, { timeout: 5000, message: '天文观测科研应已启动' }).toBe(true);

    // 等待教程轮询检测到 inResearch 并推进
    await expect(page.locator('text=执行首回合决策')).toBeVisible({ timeout: 5000 });

    // ===== 步骤 6：执行首回合决策（next-turn） =====
    await expect(page.locator('text=步骤 6 / 8')).toBeVisible();

    // 教程自动切回 starmap 视图
    // 真实点击「下一回合」按钮（非 page.evaluate 派发 game-turn-complete）
    const nextTurnBtn = page.locator('[data-tutorial-id="btn-next-turn"]');
    await expect(nextTurnBtn).toBeVisible({ timeout: 5000 });

    // 等待按钮可点击（未被阻断器禁用）
    await expect(nextTurnBtn).toBeEnabled({ timeout: 8000 });
    await nextTurnBtn.click();

    // 等待回合完成并进入下一步（教程监听 game-turn-complete 事件）
    await expect(page.locator('text=应对突发危机')).toBeVisible({ timeout: 10000 });

    // ===== 步骤 7：应对突发危机（resolve-event） =====
    await expect(page.locator('text=步骤 7 / 8')).toBeVisible();

    // 教程注入测试事件，等待 StoryModal 弹窗出现
    // 循环处理可能的多页对话 + 选项点击
    let choiceClicked = false;
    for (let attempt = 0; attempt < 20 && !choiceClicked; attempt++) {
      const choiceBtn = page.locator('.story-choice-btn').first();
      if (await choiceBtn.isVisible().catch(() => false)) {
        await choiceBtn.click({ timeout: 2000 }).catch(() => {});
        choiceClicked = true;
        break;
      }
      const proceedBtn = page.locator('.story-proceed-btn, .story-acknowledge-btn').first();
      if (await proceedBtn.isVisible().catch(() => false)) {
        await proceedBtn.click({ timeout: 2000 }).catch(() => {});
      }
      await page.waitForTimeout(400);
    }
    expect(choiceClicked).toBe(true);

    // 点击「下一步」（requiresManualAdvance = true）
    await expect(page.locator('button:has-text("下一步")')).toBeVisible({ timeout: 5000 });
    await page.locator('button:has-text("下一步")').click();
    await page.waitForTimeout(400);

    // ===== 步骤 8：智脑校准完毕（tutorial-end） =====
    await expect(page.locator('text=智脑校准完毕')).toBeVisible();
    await expect(page.locator('text=步骤 8 / 8')).toBeVisible();

    // 真实点击「完成校准」
    await page.locator('button:has-text("完成校准")').click();
    await page.waitForTimeout(600);

    // ===== 最终验证 =====
    // 教程卡片已关闭
    await expect(tutorialCard).not.toBeVisible();

    // localStorage 已标记教程完成（只读断言）
    const tutorialSeen = await page.evaluate(() => localStorage.getItem('game-tutorial-seen'));
    expect(tutorialSeen).toBe('true');
  });

  test('跳过教程功能正常', async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    // 真实点击「重新构想 (开启引导)」
    const newGameBtn = page.locator('button:has-text("重新构想 (开启引导)")');
    await newGameBtn.click();
    await page.waitForTimeout(2200);

    const tutorialCard = page.locator('.relative.z-\\[1002\\]');
    await expect(tutorialCard).toBeVisible();

    // 真实点击跳过教程按钮
    const skipBtn = page.locator('[data-testid="tutorial-skip-btn"]');
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();
    await page.waitForTimeout(600);

    // 教程卡片已关闭
    await expect(tutorialCard).not.toBeVisible();

    // localStorage 已标记（只读断言）
    const tutorialSeen = await page.evaluate(() => localStorage.getItem('game-tutorial-seen'));
    expect(tutorialSeen).toBe('true');
  });
});
