/**
 * tutorialGeometry — 教程坐标几何模块
 *
 * 抽自原 Tutorial.tsx，负责所有视口坐标计算：
 *  - 高亮框（来自 DOM 元素或星图屏幕坐标）
 *  - 4 块拼接遮罩（让出 hotspot 命中区）
 *  - 卡片定位（避免遮挡高亮目标，响应式适配横屏/移动端）
 *  - 指引箭头位置
 *
 * 设计原则：纯函数 + 不依赖 React 运行时副作用，便于单元测试与重用。
 */

import type { CSSProperties } from 'react';
import type { TutorialStep } from './tutorialSteps';

export interface HighlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ViewportSize {
  width: number;
  height: number;
}

/** 高亮框外扩视觉容差（px） */
export const HIGHLIGHT_PADDING_PX = 4;

/** 地球高亮框默认尺寸（覆盖 StarMapRenderer 60px 实际命中区 + 视觉容差） */
export const DEFAULT_EARTH_HIGHLIGHT_SIZE = 110;

/** 拼接遮罩内边收缩量（让 hotspot 独占点击无接缝） */
export const OVERLAY_BLOCK_SHRINK_PX = 2;

/** 顶部空间阈值（小于此值时箭头指向下方） */
export const ARROW_TOP_THRESHOLD_PX = 60;

/**
 * 根据 DOM 元素 rect 计算高亮框（保留外扩 4px 视觉容差）。
 * 元素 0×0 时返回 null（视为不可见）。
 */
export function computeHighlightRectFromElement(element: DOMRect): HighlightRect | null {
  if (element.width === 0 || element.height === 0) return null;
  return {
    top: Math.max(0, element.top - HIGHLIGHT_PADDING_PX),
    left: Math.max(0, element.left - HIGHLIGHT_PADDING_PX),
    width: element.width + HIGHLIGHT_PADDING_PX * 2,
    height: element.height + HIGHLIGHT_PADDING_PX * 2,
  };
}

/**
 * 根据星图屏幕坐标计算高亮框（用于地球等天体目标）。
 */
export function computeHighlightRectFromStar(
  coords: { x: number; y: number },
  size: number = DEFAULT_EARTH_HIGHLIGHT_SIZE,
): HighlightRect {
  return {
    top: coords.y - size / 2,
    left: coords.x - size / 2,
    width: size,
    height: size,
  };
}

/**
 * 计算 4 块拼接遮罩的内边与各块尺寸，让出 hotspot 命中区。
 * 返回顺序：[top, bottom, left, right] —— 与原实现一致以保留 testid 命名。
 */
export function computeOverlayBlocks(rect: HighlightRect, shrink: number = OVERLAY_BLOCK_SHRINK_PX) {
  const inner = {
    left: rect.left + shrink,
    top: rect.top + shrink,
    right: rect.left + rect.width - shrink,
    bottom: rect.top + rect.height - shrink,
  };
  return [
    { top: 0, left: 0, right: 0, height: Math.max(0, inner.top) },
    { top: inner.bottom, left: 0, right: 0, bottom: 0 },
    { top: inner.top, height: Math.max(0, inner.bottom - inner.top), left: 0, width: Math.max(0, inner.left) },
    { top: inner.top, height: Math.max(0, inner.bottom - inner.top), left: inner.right, right: 0 },
  ] as const;
}

/**
 * 计算指引箭头位置（指向高亮框中心）。
 * 当目标贴近顶部时箭头从下方指向上方，否则从上方指向下方。
 */
export function computeArrowPosition(rect: HighlightRect): {
  top: string;
  left: string;
  pointFromBelow: boolean;
} {
  const pointFromBelow = rect.top <= ARROW_TOP_THRESHOLD_PX;
  return {
    top: pointFromBelow ? `${rect.top + rect.height + 4}px` : `${rect.top - 20}px`,
    left: `${rect.left + rect.width / 2 - 10}px`,
    pointFromBelow,
  };
}

/**
 * 计算教程卡片定位样式（避免遮挡高亮目标）。
 *
 * 三种布局策略：
 *  1. 欢迎页：相对定位居中，限制宽度
 *  2. 无高亮目标：相对定位居中，限制宽度
 *  3. 有高亮目标：
 *     - 横屏（height<500）：左右对齐，纵向占满
 *     - 移动端（width<768）：上下对齐，横向占满
 *     - 桌面端：按 cardPosition 字段定位（left/right/top/bottom/center）
 */
export function computeCardStyle(
  highlightRect: HighlightRect | null,
  viewport: ViewportSize,
  step: TutorialStep,
  isWelcome: boolean,
): CSSProperties {
  if (isWelcome) {
    return {
      position: 'relative',
      maxWidth: '520px',
      width: viewport.width < 768 ? 'calc(100% - 24px)' : '100%',
    };
  }

  if (!highlightRect) {
    return {
      position: 'relative',
      maxWidth: '480px',
      width: viewport.width < 768 ? 'calc(100% - 24px)' : '100%',
    };
  }

  // 横屏布局：左右对齐
  if (viewport.height < 500) {
    const isTargetOnLeft = (highlightRect.left + highlightRect.width / 2) < viewport.width / 2;
    return {
      position: 'absolute',
      top: '12px',
      bottom: '12px',
      ...(isTargetOnLeft ? { right: '12px', left: 'auto' } : { left: '12px', right: 'auto' }),
      width: '300px',
      margin: 0,
      maxHeight: 'calc(100vh - 24px)',
      overflowY: 'auto',
    };
  }

  // 移动端布局：上下对齐
  if (viewport.width < 768) {
    const isUpperHalf = (highlightRect.top + highlightRect.height / 2) < viewport.height / 2;
    return {
      position: 'absolute',
      left: '12px',
      right: '12px',
      width: 'calc(100% - 24px)',
      margin: 0,
      maxWidth: 'none',
      ...(isUpperHalf
        ? { bottom: '12px', top: 'auto', transform: 'none' }
        : { top: '12px', bottom: 'auto', transform: 'none' }),
    };
  }

  // 桌面端：按 cardPosition 字段定位
  const pos = step.cardPosition || 'center';
  if (pos === 'left') {
    return { position: 'absolute', left: '40px', top: '50%', transform: 'translateY(-50%)', margin: 0, maxWidth: '480px' };
  }
  if (pos === 'right') {
    return { position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', margin: 0, maxWidth: '480px' };
  }
  if (pos === 'bottom') {
    return { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', margin: 0, maxWidth: '480px' };
  }
  if (pos === 'top') {
    return { position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', margin: 0, maxWidth: '480px' };
  }
  return { position: 'relative', maxWidth: '480px' };
}
