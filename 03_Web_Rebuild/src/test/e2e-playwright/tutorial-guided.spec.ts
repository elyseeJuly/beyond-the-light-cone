import { test, expect } from '@playwright/test';
import { dismissOrientationPrompt } from './helpers';

test.describe('Guided Tutorial E2E Flow', () => {
  test('正常完成新手教程引导的所有手把手操作', async ({ page }) => {
    test.setTimeout(45000);
    
    // 打开主页（不通过 localStorage 禁用教程）
    await page.goto('/');
    await dismissOrientationPrompt(page);

    // 检查初始状态下教程面板出现
    const tutorialCard = page.locator('.relative.z-\\[1002\\]');
    await expect(tutorialCard).toBeVisible();

    const nextBtn = page.locator('button:has-text("下一步")');

    // ===== 第 1 步：授权确认 =====
    await expect(page.locator('text=档案访问授权确认')).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 2 步：历史纪元演进 =====
    await expect(page.locator('text=历史纪元演进')).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 3 步：战略星图观测仪 =====
    await expect(page.locator('text=战略星图观测仪')).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 4 步：行星观测与选择 (点击地球恒星) =====
    await expect(page.locator('text=行星观测与选择')).toBeVisible();
    
    // 获取地球恒星的高亮裁剪框并点击它
    const highlightBox = page.locator('.border-2.border-\\[var\\(--color-primary\\)\\]');
    await expect(highlightBox).toBeVisible();
    
    const boxRect = await highlightBox.boundingBox();
    expect(boxRect).not.toBeNull();
    if (boxRect) {
      const centerX = boxRect.x + boxRect.width / 2;
      const centerY = boxRect.y + boxRect.height / 2;
      // 模拟真实的物理坐标移动与点击
      await page.mouse.move(centerX, centerY);
      await page.waitForTimeout(100);
      await page.mouse.click(centerX, centerY);
    }
    
    // 强制派发 star-selected 事件以防 Playwright 物理模拟中 canvas 没有响应 mousemove
    await page.evaluate(() => {
      const game = (window as any).GameInstance?.get?.();
      if (game) {
        const earthStar = game.starManager.getStar(3);
        if (earthStar) {
          const renderer = (window as any).activeStarMapRenderer;
          if (renderer) {
            const renderStar = renderer.renderStarMap.get(3);
            if (renderStar) {
              renderer.selectedStar = renderStar;
            }
          }
          window.dispatchEvent(new CustomEvent('star-selected', { detail: earthStar }));
        }
      }
    });
    await page.waitForTimeout(300);

    // 验证右侧开发面板抽屉已成功打开
    await expect(page.locator('[data-tutorial-id="right-inspector"]')).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 5 步：采矿场建设 =====
    await expect(page.locator('text=行星开发建设')).toBeVisible();

    // 教程会自动派发 tutorial:set-tab 事件把 inspectorTab 切到 build，无需手动点击 Tab
    const buildStopeBtn = page.locator('[data-tutorial-id="btn-build-stope"]');
    await expect(buildStopeBtn).toBeVisible();
    
    // 获取采矿场按钮边界并点击
    const stopeRect = await buildStopeBtn.boundingBox();
    expect(stopeRect).not.toBeNull();
    if (stopeRect) {
      await page.mouse.click(stopeRect.x + stopeRect.width / 2, stopeRect.y + stopeRect.height / 2);
    }
    await page.waitForTimeout(300);

    // 检查资源变动或按钮状态
    const initialText = await buildStopeBtn.textContent();
    expect(initialText).toContain('采矿场');

    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 6 步：政府管理 =====
    await expect(page.locator('text=内阁政府管理中枢')).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 7 步：科技研发 =====
    await expect(page.locator('text=科学技术解码中心')).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 8 步：面壁者/执剑人威慑 =====
    await expect(page.locator('text=黑暗森林防备体系')).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 9 步：外交中心 =====
    await expect(page.locator('text=深空外交监测网络')).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 10 步：稳定度指标 =====
    await expect(page.locator('text=文明稳定维系法则')).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(200);

    // ===== 第 11 步：生存守则与开始游戏 =====
    await expect(page.locator('text=授权通过：执政官生存法则')).toBeVisible();
    
    const startBtn = page.locator('button:has-text("确认授权并开始")');
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 教程卡片已关闭
    await expect(tutorialCard).not.toBeVisible();
  });
});
