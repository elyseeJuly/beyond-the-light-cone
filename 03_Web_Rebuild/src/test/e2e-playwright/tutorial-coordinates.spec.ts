import { test, expect, Page } from '@playwright/test';
import { dismissOrientationPrompt, startTutorialToReadStatus } from './helpers';
import { t } from "../../utils/i18n";

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

/**
 * 等待高亮框中心与目标元素中心对齐（差值 < tolerance）。
 *
 * CI 上 WebKit/mobile-safari 在教程步骤切换或屏幕旋转后，highlightRect
 * 可能滞留旧坐标（如 click-earth 的地球框 110×110），需要若干 rAF 帧
 * 后 Tutorial 的 updateRect 循环才会将其更新为当前目标的坐标。
 * 此函数轮询直到两者中心对齐，消除时序导致的假阳性偏差。
 */
async function waitForHighlightAligned(page: Page, tolerance = 4, maxRounds = 30): Promise<void> {
  for (let i = 0; i < maxRounds; i++) {
    const { highlightCenter, targetCenter } = await readHighlightAndTargetCenters(page);
    const dx = Math.abs(highlightCenter.x - targetCenter.x);
    const dy = Math.abs(highlightCenter.y - targetCenter.y);
    if (dx < tolerance && dy < tolerance) return;
    await page.waitForTimeout(100);
  }
}

/** 启动自由探索（跳过教程） */
async function startFreeExplore(page: Page): Promise<void> {
  const freeExploreBtn = page.locator(t("button:has-text(\"自由探索\")"));
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

/** 读取高亮框与目标元素中心坐标（含诊断数据） */
async function readHighlightAndTargetCenters(page: Page): Promise<{
  highlightCenter: { x: number; y: number };
  targetCenter: { x: number; y: number };
  highlightRect: { left: number; top: number; width: number; height: number };
  targetRect: { left: number; top: number; width: number; height: number };
  scaledRect: { left: number; top: number; width: number; height: number } | null;
}> {
  return page.evaluate(() => {
    const highlightEl = document.querySelector('div.z-\\[1001\\]') as HTMLElement;
    if (!highlightEl) throw new Error(t("高亮框元素未找到"));
    const hRect = highlightEl.getBoundingClientRect();
    const targetEl = document.querySelector('[data-tutorial-id="right-inspector"]') as HTMLElement;
    if (!targetEl) throw new Error(t("目标元素 right-inspector 未找到"));
    const tRect = targetEl.getBoundingClientRect();
    const scaled = document.querySelector('.mobile-landscape-scale') as HTMLElement | null;
    const sRect = scaled ? scaled.getBoundingClientRect() : null;
    return {
      highlightCenter: { x: hRect.left + hRect.width / 2, y: hRect.top + hRect.height / 2 },
      targetCenter: { x: tRect.left + tRect.width / 2, y: tRect.top + tRect.height / 2 },
      highlightRect: { left: hRect.left, top: hRect.top, width: hRect.width, height: hRect.height },
      targetRect: { left: tRect.left, top: tRect.top, width: tRect.width, height: tRect.height },
      scaledRect: sRect ? { left: sRect.left, top: sRect.top, width: sRect.width, height: sRect.height } : null,
    };
  });
}

// ── 横屏触屏测试组（hasTouch + 851×390 → 0.85 缩放） ──
test.describe(t("横屏 0.85 缩放坐标验证"), () => {
  test.use({ hasTouch: true, viewport: { width: 851, height: 390 } });

  test(t("DOM 高亮框中心与目标元素中心误差 ≤ 4px"), async ({ page, browserName }) => {
    test.setTimeout(40000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startTutorialToReadStatus(page);
    await waitForHighlightStable(page);
    await waitForHighlightAligned(page);

    const scaleFactor = await readScaleFactor(page);
    expect(Math.abs(scaleFactor - 0.85)).toBeLessThan(0.01);

    const { highlightCenter, targetCenter, highlightRect, targetRect, scaledRect } = await readHighlightAndTargetCenters(page);
    const dx = Math.abs(highlightCenter.x - targetCenter.x);
    const dy = Math.abs(highlightCenter.y - targetCenter.y);
    if (dx >= HIGHLIGHT_CENTER_TOLERANCE_PX || dy >= HIGHLIGHT_CENTER_TOLERANCE_PX) {
      console.log(t("[{param0}] 坐标偏差 dx={param1} dy={param2} | scale={param3} | highlight={param4} | target={param5} | scaled={param6}", { param0: browserName, param1: dx.toFixed(2), param2: dy.toFixed(2), param3: scaleFactor, param4: JSON.stringify(highlightRect), param5: JSON.stringify(targetRect), param6: JSON.stringify(scaledRect) }));
    }
    expect(dx, t("高亮框中心 X 偏差 {param0}px", { param0: dx.toFixed(2) })).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
    expect(dy, t("高亮框中心 Y 偏差 {param0}px", { param0: dy.toFixed(2) })).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
  });

  test(t("getStarScreenCoords 返回的地球坐标可被真实点击命中"), async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startFreeExplore(page);

    const earthCoords = await page.evaluate(() => {
      const renderer = (window as any).activeStarMapRenderer;
      if (!renderer) throw new Error(t("StarMapRenderer 未挂载"));
      // 注意：page.evaluate 在浏览器沙箱内执行，无法访问外部常量，使用字面量
      const coords = renderer.getStarScreenCoords(3);
      if (!coords) throw new Error(t("地球视口坐标为 null"));
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
    await expect(inspector).toContainText(t("地球"), { timeout: 3000 });
  });

  test(t("focusOnStar 居中后地球位于 Canvas 视口中心"), async ({ page }) => {
    test.setTimeout(20000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startFreeExplore(page);

    const result = await page.evaluate(() => {
      const renderer = (window as any).activeStarMapRenderer;
      if (!renderer) throw new Error(t("StarMapRenderer 未挂载"));
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
    expect(dx, t("focusOnStar 居中 X 偏差 {param0}px", { param0: dx.toFixed(2) })).toBeLessThan(FOCUS_CENTER_TOLERANCE_PX);
    expect(dy, t("focusOnStar 居中 Y 偏差 {param0}px", { param0: dy.toFixed(2) })).toBeLessThan(FOCUS_CENTER_TOLERANCE_PX);
  });

  test(t("canvasToViewport / viewportToCanvas 互逆性"), async ({ page }) => {
    test.setTimeout(20000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startFreeExplore(page);

    const result = await page.evaluate(() => {
      const renderer = (window as any).activeStarMapRenderer;
      if (!renderer) throw new Error(t("StarMapRenderer 未挂载"));
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
      expect(r.dx, t("采样点 {param0} 往返 X 误差 {param1}px", { param0: r.sample, param1: r.dx.toFixed(4) })).toBeLessThan(ROUNDTRIP_TOLERANCE_PX);
      expect(r.dy, t("采样点 {param0} 往返 Y 误差 {param1}px", { param0: r.sample, param1: r.dy.toFixed(4) })).toBeLessThan(ROUNDTRIP_TOLERANCE_PX);
    }
  });
});

// ── 桌面端无缩放测试组 ──
test.describe(t("桌面端坐标验证（无缩放）"), () => {
  test.use({ hasTouch: false, viewport: { width: 1440, height: 900 } });

  test(t("DOM 高亮框中心与目标元素中心误差 ≤ 4px"), async ({ page, browserName }) => {
    test.setTimeout(40000);
    await page.goto('/');
    await dismissOrientationPrompt(page);
    await startTutorialToReadStatus(page);
    await waitForHighlightStable(page);
    await waitForHighlightAligned(page);

    const hasScale = await page.evaluate(() => !!document.querySelector('.mobile-landscape-scale'));
    expect(hasScale).toBe(false);

    const { highlightCenter, targetCenter, highlightRect, targetRect } = await readHighlightAndTargetCenters(page);
    const dx = Math.abs(highlightCenter.x - targetCenter.x);
    const dy = Math.abs(highlightCenter.y - targetCenter.y);
    if (dx >= HIGHLIGHT_CENTER_TOLERANCE_PX || dy >= HIGHLIGHT_CENTER_TOLERANCE_PX) {
      console.log(t("[{param0}] 桌面端坐标偏差 dx={param1} dy={param2} | highlight={param3} | target={param4}", { param0: browserName, param1: dx.toFixed(2), param2: dy.toFixed(2), param3: JSON.stringify(highlightRect), param4: JSON.stringify(targetRect) }));
    }
    expect(dx, t("桌面端高亮框 X 偏差 {param0}px", { param0: dx.toFixed(2) })).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
    expect(dy, t("桌面端高亮框 Y 偏差 {param0}px", { param0: dy.toFixed(2) })).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
  });
});

// ── 旋转屏幕测试组（竖屏启动 → 旋转到横屏） ──
test.describe(t("旋转屏幕坐标连续性"), () => {
  test.use({ hasTouch: true, viewport: { width: 393, height: 851 } });

  test(t("竖屏启动教程后旋转到横屏 0.85 缩放，高亮框不漂移"), async ({ page, browserName }) => {
    test.setTimeout(40000);
    await page.goto('/');
    await dismissOrientationPrompt(page);

    await startTutorialToReadStatus(page);
    await waitForHighlightStable(page);

    // 旋转到横屏
    await page.setViewportSize({ width: 851, height: 390 });
    await page.waitForTimeout(1000);
    await waitForHighlightAligned(page);

    const scaleFactor = await readScaleFactor(page);
    expect(Math.abs(scaleFactor - 0.85)).toBeLessThan(0.01);

    const { highlightCenter, targetCenter, highlightRect, targetRect, scaledRect } = await readHighlightAndTargetCenters(page);
    const dx = Math.abs(highlightCenter.x - targetCenter.x);
    const dy = Math.abs(highlightCenter.y - targetCenter.y);
    if (dx >= HIGHLIGHT_CENTER_TOLERANCE_PX || dy >= HIGHLIGHT_CENTER_TOLERANCE_PX) {
      console.log(t("[{param0}] 旋转后坐标偏差 dx={param1} dy={param2} | scale={param3} | highlight={param4} | target={param5} | scaled={param6}", { param0: browserName, param1: dx.toFixed(2), param2: dy.toFixed(2), param3: scaleFactor, param4: JSON.stringify(highlightRect), param5: JSON.stringify(targetRect), param6: JSON.stringify(scaledRect) }));
    }
    expect(dx, t("旋转后高亮框 X 漂移 {param0}px", { param0: dx.toFixed(2) })).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
    expect(dy, t("旋转后高亮框 Y 漂移 {param0}px", { param0: dy.toFixed(2) })).toBeLessThan(HIGHLIGHT_CENTER_TOLERANCE_PX);
  });
});
