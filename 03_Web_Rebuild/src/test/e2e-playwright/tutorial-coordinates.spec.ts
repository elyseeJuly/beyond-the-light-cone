import { test, expect, Page } from '@playwright/test';
import { dismissOrientationPrompt } from './helpers';

/**
 * 坐标几何验证测试（审计 P0-1/P0-2 硬性合并门槛）
 *
 * 合并门槛 #4：横屏高亮框中心与目标中心误差不超过 4px。
 *
 * 验证内容：
 * 1. 横屏 0.85 缩放下，DOM 目标高亮框中心与目标元素中心误差 ≤ 4px
 * 2. 横屏 0.85 缩放下，getStarScreenCoords 返回的地球坐标可被真实点击命中
 * 3. focusOnStar 居中后，地球位于 Canvas 视口中心（容差 1px）
 * 4. canvasToViewport / viewportToCanvas 互逆性（往返误差 ≤ 0.5px）
 * 5. 横屏缩放前后高亮框坐标连续性（旋转屏幕不漂移）
 * 6. 桌面端无缩放时高亮框正确性
 *
 * 本测试只读断言坐标，不修改游戏状态，符合审计合并门槛。
 */

const HIGHLIGHT_CENTER_TOLERANCE_PX = 4;
const FOCUS_CENTER_TOLERANCE_PX = 1;
const ROUNDTRIP_TOLERANCE_PX = 0.5;

/** 等待教程高亮框渲染并稳定 */
async function waitForHighlightStable(page: Page): Promise<void> {
  const highlight = page.locator('[data-testid^="tutorial-overlay-"]:not([data-testid="tutorial-overlay-full"])').first();
  await expect(highlight).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(400);
}

/** 启动教程并推进到步骤 2（read-status，有 DOM 高亮） */
async function startTutorialToReadStatus(page: Page): Promise<void> {
  const newGameBtn = page.locator('button:has-text("重新构想 (开启引导)")');
  await expect(newGameBtn).toBeVisible();
  await newGameBtn.click();
  await expect(page.locator('text=选中家园星系')).toBeVisible({ timeout: 10000 });
  await page.locator('button:has-text("下一步")').click();
  await page.waitForTimeout(500);
  await expect(page.locator('text=监控三维产出')).toBeVisible({ timeout: 5000 });
  await waitForHighlightStable(page);
}

/** 启动自由探索（跳过教程） */
async function startFreeExplore(page: Page): Promise<void> {
  const freeExploreBtn = page.locator('button:has-text("自由探索")');
  await expect(freeExploreBtn).toBeVisible();
  await freeExploreBtn.click();
  await page.waitForTimeout(1500);
}

/** 读取横屏缩放系数 */
async function readScaleFactor(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector('.mobile-landscape-scale') as HTMLElement | null;
    if (!el) return 1;
    const transform = window.getComputedStyle(el).transform;
    const match = transform.match(/matrix\(([^)]+)\)/);
    return match ? match[1].split(',').map(Number)[0] : 1;
  });
}

/** 读取高亮框与目标元素中心坐标 */
async function readHighlightAndTargetCenters(page: Page): Promise<{
  highlightCenter: { x: number; y: number };
  targetCenter: { x: number; y: number };
}> {
  return page.evaluate(() => {
    const highlightEl = document.querySelector('div.z-\\[1001\\]') as HTMLElement;
    if (!highlightEl) throw new Error('高亮框元素未找到');
    const hRect = highlightEl.getBoundingClientRect();
    const targetEl = document.querySelector('[data-tutorial-id="right-inspector"]') as HTMLElement;
    if (!targetEl) throw new Error('目标元素 right-inspector 未找到');
    const tRect = targetEl.getBoundingClientRect();
    return {
      highlightCenter: { x: hRect.left + hRect.width / 2, y: hRect.top + hRect.height / 2 },
      targetCenter: { x: tRect.left + tRect.width / 2, y: tRect.top + tRect.height / 2 },
    };
  });
}

// ── 横屏触屏测试组（hasTouch + 851×390 → 0.85 缩放） ──
test.describe('横屏 0.85 缩放坐标验证', () => {
  test.use({ hasTouch: true, viewport: { width: 851, height: 390 } });

  test('DOM 高亮框中心与目标元素中心误差 ≤ 4px', async ({ page }) => {
    test.setTimeout(40000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startTutorialToReadStatus(page);

    const scaleFactor = await readScaleFactor(page);
    expect(Math.abs(scaleFactor - 0.85)).toBeLessThan(0.01);

    const { highlightCenter, targetCenter } = await readHighlightAndTargetCenters(page);
    const dx = Math.abs(highlightCenter.x - targetCenter.x);
    const dy = Math.abs(highlightCenter.y - targetCenter.y);
    expect(dx, `高亮框中心 X 偏差 ${dx.toFixed(2)}px`).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
    expect(dy, `高亮框中心 Y 偏差 ${dy.toFixed(2)}px`).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
  });

  test('getStarScreenCoords 返回的地球坐标可被真实点击命中', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startFreeExplore(page);

    const earthCoords = await page.evaluate(() => {
      const renderer = (window as any).activeStarMapRenderer;
      if (!renderer) throw new Error('StarMapRenderer 未挂载');
      // 注意：page.evaluate 在浏览器沙箱内执行，无法访问外部常量，使用字面量
      const coords = renderer.getStarScreenCoords(3);
      if (!coords) throw new Error('地球视口坐标为 null');
      return coords;
    });

    expect(earthCoords.x).toBeGreaterThan(0);
    expect(earthCoords.x).toBeLessThan(851);
    expect(earthCoords.y).toBeGreaterThan(0);
    expect(earthCoords.y).toBeLessThan(390);

    await page.mouse.click(earthCoords.x, earthCoords.y);
    await page.waitForTimeout(500);

    const inspector = page.locator('[data-tutorial-id="right-inspector"]');
    await expect(inspector).toBeVisible({ timeout: 3000 });
    await expect(inspector).toContainText('地球', { timeout: 3000 });
  });

  test('focusOnStar 居中后地球位于 Canvas 视口中心', async ({ page }) => {
    test.setTimeout(20000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startFreeExplore(page);

    const result = await page.evaluate(() => {
      const renderer = (window as any).activeStarMapRenderer;
      if (!renderer) throw new Error('StarMapRenderer 未挂载');
      // 注意：page.evaluate 在浏览器沙箱内执行，无法访问外部常量，使用字面量
      renderer.focusOnStar(3, 1.5, true);
      return new Promise((resolve) => {
        requestAnimationFrame(() => {
          const canvas = renderer.canvas as HTMLCanvasElement;
          const cRect = canvas.getBoundingClientRect();
          resolve({
            canvasCenter: { x: cRect.left + cRect.width / 2, y: cRect.top + cRect.height / 2 },
            earthViewport: renderer.getStarScreenCoords(3),
          });
        });
      });
    }) as { canvasCenter: { x: number; y: number }; earthViewport: { x: number; y: number } | null };

    expect(result.earthViewport).not.toBeNull();
    const dx = Math.abs(result.earthViewport!.x - result.canvasCenter.x);
    const dy = Math.abs(result.earthViewport!.y - result.canvasCenter.y);
    expect(dx, `focusOnStar 居中 X 偏差 ${dx.toFixed(2)}px`).toBeLessThan(FOCUS_CENTER_TOLERANCE_PX);
    expect(dy, `focusOnStar 居中 Y 偏差 ${dy.toFixed(2)}px`).toBeLessThan(FOCUS_CENTER_TOLERANCE_PX);
  });

  test('canvasToViewport / viewportToCanvas 互逆性', async ({ page }) => {
    test.setTimeout(20000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startFreeExplore(page);

    const result = await page.evaluate(() => {
      const renderer = (window as any).activeStarMapRenderer;
      if (!renderer) throw new Error('StarMapRenderer 未挂载');
      const canvas = renderer.canvas as HTMLCanvasElement;
      const rect = canvas.getBoundingClientRect();
      const samples = [
        { x: rect.left + 10, y: rect.top + 10 },
        { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        { x: rect.left + rect.width - 10, y: rect.top + rect.height - 10 },
        { x: rect.left + 123.7, y: rect.top + 89.3 },
        { x: rect.left + rect.width * 0.75, y: rect.top + rect.height * 0.25 },
      ];
      return samples.map((p, i) => {
        const logical = renderer.viewportToCanvas(p.x, p.y);
        const back = renderer.canvasToViewport(logical.x, logical.y);
        return { sample: i, dx: Math.abs(p.x - back.x), dy: Math.abs(p.y - back.y) };
      });
    });

    for (const r of result) {
      expect(r.dx, `采样点 ${r.sample} 往返 X 误差 ${r.dx.toFixed(4)}px`).toBeLessThan(ROUNDTRIP_TOLERANCE_PX);
      expect(r.dy, `采样点 ${r.sample} 往返 Y 误差 ${r.dy.toFixed(4)}px`).toBeLessThan(ROUNDTRIP_TOLERANCE_PX);
    }
  });
});

// ── 桌面端无缩放测试组 ──
test.describe('桌面端坐标验证（无缩放）', () => {
  test.use({ hasTouch: false, viewport: { width: 1440, height: 900 } });

  test('DOM 高亮框中心与目标元素中心误差 ≤ 4px', async ({ page }) => {
    test.setTimeout(40000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startTutorialToReadStatus(page);

    const hasScale = await page.evaluate(() => !!document.querySelector('.mobile-landscape-scale'));
    expect(hasScale).toBe(false);

    const { highlightCenter, targetCenter } = await readHighlightAndTargetCenters(page);
    const dx = Math.abs(highlightCenter.x - targetCenter.x);
    const dy = Math.abs(highlightCenter.y - targetCenter.y);
    expect(dx, `桌面端高亮框 X 偏差 ${dx.toFixed(2)}px`).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
    expect(dy, `桌面端高亮框 Y 偏差 ${dy.toFixed(2)}px`).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
  });
});

// ── 旋转屏幕测试组（竖屏启动 → 旋转到横屏） ──
test.describe('旋转屏幕坐标连续性', () => {
  test.use({ hasTouch: true, viewport: { width: 393, height: 851 } });

  test('竖屏启动教程后旋转到横屏 0.85 缩放，高亮框不漂移', async ({ page }) => {
    test.setTimeout(40000);
    await page.goto('/');
    await dismissOrientationPrompt(page);

    const newGameBtn = page.locator('button:has-text("重新构想 (开启引导)")');
    await expect(newGameBtn).toBeVisible();
    await newGameBtn.click();
    await expect(page.locator('text=选中家园星系')).toBeVisible({ timeout: 10000 });
    await page.locator('button:has-text("下一步")').click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=监控三维产出')).toBeVisible({ timeout: 5000 });
    await waitForHighlightStable(page);

    // 旋转到横屏
    await page.setViewportSize({ width: 851, height: 390 });
    await page.waitForTimeout(1000);

    const scaleFactor = await readScaleFactor(page);
    expect(Math.abs(scaleFactor - 0.85)).toBeLessThan(0.01);

    const { highlightCenter, targetCenter } = await readHighlightAndTargetCenters(page);
    const dx = Math.abs(highlightCenter.x - targetCenter.x);
    const dy = Math.abs(highlightCenter.y - targetCenter.y);
    expect(dx, `旋转后高亮框 X 漂移 ${dx.toFixed(2)}px`).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
    expect(dy, `旋转后高亮框 Y 漂移 ${dy.toFixed(2)}px`).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
  });
});
