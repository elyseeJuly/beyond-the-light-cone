import React, { useState, useEffect } from 'react';

/**
 * OrientationPrompt - 横屏提示组件
 * 
 * 当用户在移动端竖屏模式下打开游戏时，提示建议横屏游玩。
 * 符合 UI-2 规范：策略游戏默认横屏优先。
 */
export const OrientationPrompt: React.FC = () => {
  const [isLandscape, setIsLandscape] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const mobile = window.matchMedia('(max-width: 768px)').matches ||
                     ('ontouchstart' in window);
      setIsMobile(mobile);

      if (screen.orientation) {
        const isLand = screen.orientation.type.includes('landscape');
        setIsLandscape(isLand);
      } else {
        // Fallback using window dimensions
        setIsLandscape(window.innerWidth > window.innerHeight);
      }
    };

    checkOrientation();

    const handleChange = () => checkOrientation();
    screen.orientation?.addEventListener('change', handleChange);
    window.addEventListener('resize', handleChange);

    return () => {
      screen.orientation?.removeEventListener('change', handleChange);
      window.removeEventListener('resize', handleChange);
    };
  }, []);

  // Don't show on desktop, landscape, or if dismissed
  if (!isMobile || isLandscape || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#0B1020] border border-[#1A3A6A]/50 rounded-xl p-8 max-w-sm mx-4 text-center">
        <div className="mb-4">
          <svg className="w-16 h-16 mx-auto text-[#4A9EFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-[#DDEEFF] mb-2">建议横屏游玩</h3>
        <p className="text-sm text-[#8899BB] mb-6">
          光锥之外是一款策略游戏，横屏模式能提供更好的游戏体验。
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="px-6 py-2 text-sm text-white bg-[#1A3A6A] hover:bg-[#2A4A8A] transition-colors rounded-lg font-medium"
        >
          我知道了
        </button>
      </div>
    </div>
  );
};