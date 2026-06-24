import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StarMapRenderer } from '../ui/StarMapRenderer';
import { GameInstance } from '../core/Game';
import { CrisisWarningPanel } from './CrisisWarningPanel';
import { StarArea } from '../types/enums';
import { useBreakpoint } from '../hooks/useBreakpoint';

export const StarMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<StarMapRenderer | null>(null);
  const [activeArea, setActiveArea] = useState<StarArea>(StarArea.SOLARSYSTEM);
  const [zoomPercent, setZoomPercent] = useState(100);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const bp = useBreakpoint();
  const isMobile = bp.isMobile;

  useEffect(() => {
    if (canvasRef.current) {
      const canvasId = "star-canvas-main";
      canvasRef.current.id = canvasId;
      
      try {
        const renderer = new StarMapRenderer(canvasId);
        rendererRef.current = renderer;
        (window as any).activeStarMapRenderer = renderer;
        
        const game = GameInstance.get();
        renderer.initStars(game.starManager.getAllStars());
        renderer.setActiveArea(activeArea);
        
        renderer.start();
        
        // Listen for zoom changes from renderer (e.g., pinch zoom, scroll wheel)
        const handleZoomChanged = (e: Event) => {
          const detail = (e as CustomEvent).detail;
          setZoomPercent(Math.round(detail.zoom * 100));
        };
        window.addEventListener('starmap-zoom-changed', handleZoomChanged);
        
        return () => {
          renderer.stop();
          window.removeEventListener('starmap-zoom-changed', handleZoomChanged);
          (window as any).activeStarMapRenderer = null;
        };
      } catch (err) {
        console.error("StarMapRenderer failed to init:", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update active area in renderer when state changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setActiveArea(activeArea);
      setZoomPercent(rendererRef.current.getZoomPercent());
    }
  }, [activeArea]);

  const handleZoomIn = useCallback(() => {
    rendererRef.current?.zoomIn();
    setZoomPercent(rendererRef.current?.getZoomPercent() ?? 100);
  }, []);

  const handleZoomOut = useCallback(() => {
    rendererRef.current?.zoomOut();
    setZoomPercent(rendererRef.current?.getZoomPercent() ?? 100);
  }, []);

  const handleResetView = useCallback(() => {
    rendererRef.current?.resetView();
    setZoomPercent(100);
  }, []);

  const areas = [
    { key: StarArea.SOLARSYSTEM, label: "太阳系", shortLabel: "系内" },
    { key: StarArea.LIGHTYEAR_50, label: "50光年", shortLabel: "50LY" },
    { key: StarArea.LIGHTYEAR_1W, label: "1万光年", shortLabel: "1WLY" },
    { key: StarArea.GALAXY, label: "银河系", shortLabel: "银河" },
  ];

  return (
    <div className="w-full h-full relative group">
      <CrisisWarningPanel />
      
      {/* Area selector tabs — responsive: horizontal on desktop, dropdown on mobile */}
      {isMobile ? (
        <div className="absolute top-3 left-2 z-[60]">
          <button
            onClick={() => setShowAreaDropdown(!showAreaDropdown)}
            className="px-3 py-1.5 text-[10px] font-title uppercase tracking-wider rounded bg-[#070B14]/80 backdrop-blur-sm border border-[#243245]/50 text-white cursor-pointer"
          >
            {areas.find(a => a.key === activeArea)?.shortLabel || "星区"} ▾
          </button>
          {showAreaDropdown && (
            <div className="absolute top-9 left-0 bg-[#070B14]/95 border border-[#243245]/50 rounded shadow-xl z-[61] backdrop-blur-md">
              {areas.map(item => (
                <button
                  key={item.key}
                  onClick={() => { setActiveArea(item.key); setShowAreaDropdown(false); }}
                  className={`block w-full text-left px-4 py-2 text-[10px] font-title uppercase tracking-wider transition-colors cursor-pointer ${
                    activeArea === item.key
                      ? 'bg-[var(--color-primary)] text-black font-extrabold'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1 py-1 glass-archive border border-[#243245]/50 z-20 rounded select-none shadow-lg">
          {areas.map(item => (
            <button 
              key={item.key}
              onClick={() => setActiveArea(item.key)}
              className={`px-3.5 py-1.5 text-[10px] font-title uppercase tracking-widest rounded transition-all cursor-pointer ${
                activeArea === item.key 
                  ? 'bg-[var(--color-primary)] text-black font-extrabold shadow-[0_0_10px_rgba(0,184,255,0.4)]' 
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <canvas 
        ref={canvasRef} 
        className="w-full h-full block touch-none select-none"
        style={{ touchAction: 'none' }}
      />
      
      {/* Zoom controls — always visible on mobile, hover-to-show on desktop */}
      {/*
        On mobile: raised to bottom-[72px] to clear MobileBottomNav (56px) + safe area.
        On desktop: stays at bottom-6.
      */}
      <div className={`
        absolute left-1/2 -translate-x-1/2
        flex items-center gap-3 px-3 sm:px-6 py-2 glass-panel rounded-full border border-white/10
        z-20 transition-opacity duration-300 select-none
        ${isMobile ? 'opacity-100 bottom-[72px]' : 'opacity-0 group-hover:opacity-100 bottom-6'}
      `}>
        <button 
          onClick={handleZoomOut}
          className="text-[11px] sm:text-xs hover:text-[var(--color-primary)] transition-colors font-bold cursor-pointer px-2 select-none"
          title="缩小"
        >
          −
        </button>
        <span className="text-[10px] sm:text-xs font-mono text-[var(--text-secondary)] min-w-[36px] text-center select-none">
          {zoomPercent}%
        </span>
        <button 
          onClick={handleZoomIn}
          className="text-[11px] sm:text-xs hover:text-[var(--color-primary)] transition-colors font-bold cursor-pointer px-2 select-none"
          title="放大"
        >
          +
        </button>
        <span className="h-3 w-px bg-white/10 hidden sm:block" />
        <button 
          onClick={handleResetView}
          className="text-[9px] sm:text-[10px] hover:text-[var(--color-primary)] transition-colors font-bold uppercase cursor-pointer hidden sm:block select-none"
          title="重置视角"
        >
          Reset
        </button>
      </div>

      {/* Mobile touch hint (shown briefly on first load) */}
      {isMobile && (
        <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 text-[9px] text-[var(--text-secondary)] opacity-50 pointer-events-none select-none whitespace-nowrap z-10">
          单指拖动 · 双指缩放 · 点击星辰
        </div>
      )}

      {/* Decorative corners — smaller on mobile */}
      <div className={`absolute top-2 sm:top-4 left-2 sm:left-4 w-4 sm:w-8 h-4 sm:h-8 border-t border-l border-white/5 sm:border-t-2 sm:border-l-2 sm:border-white/10 pointer-events-none ${isMobile ? 'opacity-30' : ''}`} />
      <div className={`absolute top-2 sm:top-4 right-2 sm:right-4 w-4 sm:w-8 h-4 sm:h-8 border-t border-r border-white/5 sm:border-t-2 sm:border-r-2 sm:border-white/10 pointer-events-none ${isMobile ? 'opacity-30' : ''}`} />
      <div className={`absolute bottom-2 sm:bottom-4 left-2 sm:left-4 w-4 sm:w-8 h-4 sm:h-8 border-b border-l border-white/5 sm:border-b-2 sm:border-l-2 sm:border-white/10 pointer-events-none ${isMobile ? 'opacity-30' : ''}`} />
      <div className={`absolute bottom-2 sm:bottom-4 right-2 sm:right-4 w-4 sm:w-8 h-4 sm:h-8 border-b border-r border-white/5 sm:border-b-2 sm:border-r-2 sm:border-white/10 pointer-events-none ${isMobile ? 'opacity-30' : ''}`} />
    </div>
  );
};