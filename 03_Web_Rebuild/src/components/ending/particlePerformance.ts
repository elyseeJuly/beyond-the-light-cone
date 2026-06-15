/**
 * particlePerformance.ts
 *
 * 粒子性能自适应分级引擎
 * 测量实际绘制开销并动态降低粒子上限以避免卡顿。
 */

export type PerformanceTier = 'high' | 'medium' | 'low';

export interface PerformanceConfig {
  tier: PerformanceTier;
  maxParticles: number;
  enableBlur: boolean;
  enableGlow: boolean;
}

const DEFAULT_CONFIGS: Record<PerformanceTier, PerformanceConfig> = {
  high: { tier: 'high', maxParticles: 150, enableBlur: true, enableGlow: true },
  medium: { tier: 'medium', maxParticles: 80, enableBlur: true, enableGlow: false },
  low: { tier: 'low', maxParticles: 35, enableBlur: false, enableGlow: false },
};

let detectedTier: PerformanceTier | null = null;

/**
 * 评估系统性能等级。
 * 可传入自定义渲染时间来进行在线自适应调整，或者根据硬件基准（核心数、内存、DPR、屏幕大小）作离线评估。
 */
export function getPerformanceConfig(customFps?: number): PerformanceConfig {
  if (detectedTier && customFps === undefined) {
    return DEFAULT_CONFIGS[detectedTier];
  }

  // 离线评估：基于浏览器特征
  let tier: PerformanceTier = 'high';

  if (typeof navigator !== 'undefined') {
    const cores = navigator.hardwareConcurrency || 4;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    if (isMobile) {
      tier = cores >= 8 && dpr < 3 ? 'medium' : 'low';
    } else {
      if (cores < 4) {
        tier = 'low';
      } else if (cores < 8) {
        tier = 'medium';
      } else {
        tier = 'high';
      }
    }
  }

  // 如果提供了运行时的 FPS 检测结果
  if (customFps !== undefined) {
    if (customFps < 30) {
      tier = 'low';
    } else if (customFps < 50) {
      tier = 'medium';
    } else {
      tier = 'high';
    }
  }

  detectedTier = tier;
  return DEFAULT_CONFIGS[tier];
}

/**
 * 重置检测到的性能等级以允许重新评估
 */
export function resetPerformanceTier(): void {
  detectedTier = null;
}
