import { test, expect } from '@playwright/test';
import { dismissOrientationPrompt } from './helpers';
import { t } from "../../utils/i18n";

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
 *
 * 注意：地球初始已有 hasStope=true（StarManager.ts:52），教程 build-stope 步骤
 * 的 checkCondition 立即返回 true 并自动跳过。测试需适配此真实游戏状态。
 * 初始 miningRatio=30，需改为不同值才能通过 resource-production 步骤。
 */

test.describe(t("Guided Tutorial E2E - 真实用户交互黄金路径"), () => {
  test(t("完整教程黄金路径：真实点击推进全流程"), async ({ page }) => {
    test.setTimeout(120000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    // ===== 封面：点击「重新构想 (开启引导)」 =====
    const newGameBtn = page.locator(t("button:has-text(\"重新构想 (开启引导)\")"));
    await expect(newGameBtn).toBeVisible();
    await newGameBtn.click();

    // App 立即挂载教程；使用稳定的语义标识，不依赖 Tailwind 类名。
    const tutorialSkipButton = page.getByTestId('tutorial-skip-btn');
    await expect(tutorialSkipButton).toBeVisible({ timeout: 10000 });

    // ===== 欢迎页 → 步骤 1：选中家园星系（click-earth） =====
    await expect(page.locator(t("text=智脑辅助校准"))).toBeVisible();
    await page.getByRole('button', { name: t("开始校准") }).click();
    await expect(page.locator(t("text=选中家园星系"))).toBeVisible({ timeout: 10000 });
    await expect(page.locator(t("text=步骤 1 / 8"))).toBeVisible();

    // 地球会随星图持续运动；通过可访问按钮获得焦点并按 Enter，
    // 验证动态目标也能由真实键盘交互完成，而不依赖旁路事件。
    const earthHotspot = page.getByRole('button', { name: t("选中地球") });
    await expect(earthHotspot).toBeVisible();
    await earthHotspot.focus();
    await page.keyboard.press('Enter');

    // ===== 步骤 2：监控三维产出（read-status） =====
    await expect(page.locator(t("text=监控三维产出"))).toBeVisible({ timeout: 5000 });
    await expect(page.locator(t("text=步骤 2 / 8"))).toBeVisible();
    await expect(page.locator('[data-tutorial-id="right-inspector"]')).toContainText(t("地球"), { timeout: 5000 });

    // 点击「下一步」（requiresManualAdvance = true）
    await page.locator(t("button:has-text(\"下一步\")")).click();

    // ===== 步骤 3：建设矿业基础（build-stope） =====
    await expect(page.locator(t("text=建设矿业基础"))).toBeVisible({ timeout: 5000 });
    await expect(page.locator(t("text=步骤 3 / 8"))).toBeVisible();
    const buildStopeBtn = page.locator('[data-tutorial-id="btn-build-stope"]');
    if (await buildStopeBtn.isVisible().catch(() => false)) {
      await buildStopeBtn.click();
      // 验证建设已真实启动
      await expect.poll(async () => {
        return await page.evaluate(() => {
          const game = (window as any).GameInstance?.get?.();
          const star = game?.starManager?.getStar(3);
          return !!star?.buildingProgress?.stope;
        });
      }, { timeout: 5000, message: t("采矿场建设应已启动") }).toBe(true);
    }
    await expect(page.locator(t("button:has-text(\"下一步\")"))).toBeEnabled({ timeout: 5000 });
    await page.locator(t("button:has-text(\"下一步\")")).click();

    // ===== 步骤 4：调配劳力分配（resource-production） =====
    await expect(page.locator(t("text=调配劳力分配"))).toBeVisible({ timeout: 8000 });
    await expect(page.locator(t("text=步骤 4 / 8"))).toBeVisible();

    // 真实拖动采矿比例滑块；业务提交发生在 mouseup，不能只改 DOM value。
    const miningSlider = page.locator('[data-tutorial-id="mining-ratio-section"] input[type="range"]');
    await expect(miningSlider).toBeVisible({ timeout: 5000 });
    const initialMiningRatio = Number(await miningSlider.inputValue());
    await miningSlider.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await miningSlider.dispatchEvent('mouseup');
    await miningSlider.dispatchEvent('touchend');
    const committedMiningRatio = Number(await miningSlider.inputValue());
    expect(committedMiningRatio).not.toBe(initialMiningRatio);

    // 验证真实游戏状态与滑块提交值一致（只读断言）
    await expect.poll(async () => {
      return await page.evaluate(() => {
        const game = (window as any).GameInstance?.get?.();
        return game?.earthCivi?.miningRatio ?? 0;
      });
    }, { timeout: 5000, message: t("采矿比例应写入真实游戏状态") }).toBe(committedMiningRatio);

    await expect(page.locator(t("button:has-text(\"下一步\")"))).toBeEnabled({ timeout: 5000 });
    await page.locator(t("button:has-text(\"下一步\")")).click();
    await expect(page.locator(t("text=启动科技演进"))).toBeVisible({ timeout: 5000 });

    // ===== 步骤 5：启动科技演进（start-research） =====
    await expect(page.locator(t("text=步骤 5 / 8"))).toBeVisible();

    // 教程自动切换到 techtree 视图（change-active-view 事件）
    // 真实点击「天文观测」科技节点
    const techNode = page.locator(t("[data-tutorial-id=\"tech-node-天文观测\"]"));
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
    }, { timeout: 5000, message: t("天文观测科研应已启动") }).toBe(true);

    await expect(page.locator(t("button:has-text(\"下一步\")"))).toBeEnabled({ timeout: 5000 });
    await page.locator(t("button:has-text(\"下一步\")")).click();
    await expect(page.locator(t("text=执行首回合决策"))).toBeVisible({ timeout: 5000 });

    // ===== 步骤 6：执行首回合决策（next-turn） =====
    await expect(page.locator(t("text=步骤 6 / 8"))).toBeVisible();

    // 教程自动切回 starmap 视图
    // 真实点击「下一回合」按钮（非 page.evaluate 派发 game-turn-complete）
    const nextTurnBtn = page.locator('[data-tutorial-id="btn-next-turn"]');
    await expect(nextTurnBtn).toBeVisible({ timeout: 5000 });

    // 等待按钮可点击（未被阻断器禁用）
    await expect(nextTurnBtn).toBeEnabled({ timeout: 8000 });
    await nextTurnBtn.click();

    // 点击「下一回合」后，游戏可能弹出背景故事事件（纪元大事记等）。
    // 交互事件会暂停回合推进（年份不变，game-turn-complete 不派发）。
    // 解决完所有事件后需要再次点击「下一回合」才能完成回合。
    // 循环：处理弹窗 → 无弹窗时再次点击「下一回合」 → 直到教程推进到步骤 7
    for (let attempt = 0; attempt < 40; attempt++) {
      // 教程已推进到步骤 7 → 回合已完成
      if (await page.locator(t("text=应对突发危机")).isVisible().catch(() => false)) break;

      // 检查是否有故事弹窗需要处理
      const storyDialog = page.locator('[role="dialog"][aria-modal="true"]');
      const hasDialog = await storyDialog.isVisible().catch(() => false);

      if (hasDialog) {
        // 处理故事选项按钮（.story-choice-btn）
        const choiceBtn = page.locator('.story-choice-btn').first();
        if (await choiceBtn.isVisible().catch(() => false)) {
          await choiceBtn.click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(400);
          continue;
        }

        // 处理「下一页/继续」按钮（.story-proceed-btn）
        const proceedBtn = page.locator('.story-proceed-btn').first();
        if (await proceedBtn.isVisible().catch(() => false)) {
          await proceedBtn.click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(400);
          continue;
        }

        // 处理「确认/知道了」按钮（.story-acknowledge-btn）
        const ackBtn = page.locator('.story-acknowledge-btn').first();
        if (await ackBtn.isVisible().catch(() => false)) {
          await ackBtn.click({ timeout: 2000 }).catch(() => {});
          await page.waitForTimeout(400);
          continue;
        }

        // 签名动画进行中，等待动画完成后再继续
        await page.waitForTimeout(400);
        continue;
      }

      // 无弹窗，但教程还没到步骤 7 → 回合被交互事件暂停，需再次点击「下一回合」
      const nextBtn = page.locator('[data-tutorial-id="btn-next-turn"]');
      if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
        await nextBtn.click().catch(() => {});
        await page.waitForTimeout(600);
        continue;
      }

      await page.waitForTimeout(400);
    }

    // 等待教程进入步骤 7（教程监听 game-turn-complete 事件后注入测试事件）
    await expect(page.locator(t("text=应对突发危机"))).toBeVisible({ timeout: 15000 });

    // ===== 步骤 7：应对突发危机（resolve-event） =====
    await expect(page.locator(t("text=步骤 7 / 8"))).toBeVisible();

    // 教程注入测试事件（event_tutorial_eto_test），等待 StoryModal 弹窗出现
    const storyDialog = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(storyDialog).toBeVisible({ timeout: 8000 });

    // 等待打字机结束、选项按钮出现（最多等 8 秒）
    // 选项按钮只在 showChoices=true 时渲染（打字机结束或点击「快速解密」后）
    const choiceBtn = page.locator('.story-choice-btn').first();
    await expect(choiceBtn).toBeVisible({ timeout: 8000 });
    await choiceBtn.click({ force: true });

    // 等待签名动画启动（signingChoice !== null 时渲染签名指示器）
    await expect(page.locator(t("text=正在执行电子指纹与意识授权签名"))).toBeVisible({ timeout: 3000 });

    // 签名动画（1200ms）→ choice.action() → onClose() → StoryModal 卸载
    await expect(storyDialog).toBeHidden({ timeout: 8000 });

    // 点击「下一步」（requiresManualAdvance = true）
    await expect(page.locator(t("button:has-text(\"下一步\")"))).toBeVisible({ timeout: 5000 });
    await page.locator(t("button:has-text(\"下一步\")")).click();
    await page.waitForTimeout(400);

    // ===== 步骤 8：智脑校准完毕（tutorial-end） =====
    await expect(page.locator(t("text=智脑校准完毕"))).toBeVisible();
    await expect(page.locator(t("text=步骤 8 / 8"))).toBeVisible();

    // 真实点击「完成校准」
    await page.locator(t("button:has-text(\"完成校准\")")).click();
    await page.waitForTimeout(600);

    // ===== 最终验证 =====
    // 教程卡片已关闭
    await expect(tutorialSkipButton).not.toBeVisible();

    // localStorage 已标记教程完成（版本化进度记录）
    const progress = await page.evaluate(() => {
      const raw = localStorage.getItem('game-tutorial-progress');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    });
    expect(progress).not.toBeNull();
    expect(progress.version).toBeTruthy();
    expect(progress.completedAt).toBeGreaterThan(0);
  });

  test(t("跳过教程功能正常"), async ({ page }) => {
    test.setTimeout(30000);

    await page.goto('/');
    await dismissOrientationPrompt(page);

    // 真实点击「重新构想 (开启引导)」
    const newGameBtn = page.locator(t("button:has-text(\"重新构想 (开启引导)\")"));
    await newGameBtn.click();

    // 真实点击跳过教程按钮
    const skipBtn = page.getByTestId('tutorial-skip-btn');
    await expect(skipBtn).toBeVisible();
    await skipBtn.click();

    // 教程已关闭
    await expect(skipBtn).not.toBeVisible();

    // localStorage 已标记（跳过也会写入进度记录）
    const progress = await page.evaluate(() => {
      const raw = localStorage.getItem('game-tutorial-progress');
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    });
    expect(progress).not.toBeNull();
    expect(progress.version).toBeTruthy();
  });
});
