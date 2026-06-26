/**
 * useBreakpoint - 响应式断点 Hook
 *
 * 提供当前视口断点信息，用于条件渲染不同布局。
 * 断点与 Tailwind v4 默认断点对齐：
 *   sm: 640px
 *   md: 768px
 *   lg: 1024px
 *   xl: 1280px
 *   2xl: 1536px
 */

import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

interface BreakpointInfo {
  /** 当前断点名称 */
  breakpoint: Breakpoint;
  /** 是否为移动端 (< 768px) */
  isMobile: boolean;
  /** 是否为平板 (768-1023px) */
  isTablet: boolean;
  /** 是否为桌面 (1024px+) */
  isDesktop: boolean;
  /** 视口宽度 */
  width: number;
  /** 视口高度 */
  height: number;
  /** 是否为横屏 */
  isLandscape: boolean;
  /** 是否支持触摸 */
  isTouchDevice: boolean;
  /** 是否为竖屏手机（用于 OrientationPrompt） */
  isPortraitMobile: boolean;
  /** 是否为横屏手机 */
  isMobileLandscape: boolean;
}

function getBreakpointInfo(width: number, height: number): BreakpointInfo {
  const isLandscape = width > height;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Mobile landscape can have width > 768, so we need to rely on touch/height heuristics
  const isMobileDevice = (isTouchDevice && width < 768) || (isTouchDevice && isLandscape && height <= 500);

  let breakpoint: Breakpoint;
  if (isMobileDevice) breakpoint = 'mobile';
  else if (width < 1024) breakpoint = 'tablet';
  else if (width < 1536) breakpoint = 'desktop';
  else breakpoint = 'wide';

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop' || breakpoint === 'wide',
    width,
    height,
    isLandscape,
    isTouchDevice,
    isPortraitMobile: breakpoint === 'mobile' && !isLandscape,
    isMobileLandscape: breakpoint === 'mobile' && isLandscape,
  };
}

export function useBreakpoint(): BreakpointInfo {
  const [info, setInfo] = useState<BreakpointInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        breakpoint: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1440,
        height: 900,
        isLandscape: true,
        isTouchDevice: false,
        isPortraitMobile: false,
        isMobileLandscape: false,
      };
    }
    return getBreakpointInfo(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    let ticking = false;

    const handleResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setInfo(getBreakpointInfo(window.innerWidth, window.innerHeight));
          ticking = false;
        });
        ticking = true;
      }
    };

    // Also listen for orientation change
    const handleOrientation = () => {
      setInfo(getBreakpointInfo(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    screen.orientation?.addEventListener('change', handleOrientation);

    return () => {
      window.removeEventListener('resize', handleResize);
      screen.orientation?.removeEventListener('change', handleOrientation);
    };
  }, []);

  return info;
}