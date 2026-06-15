import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StarMapRenderer } from '../ui/StarMapRenderer';
import { GameInstance } from '../core/Game';
import { CrisisWarningPanel } from './CrisisWarningPanel';
import { StarArea } from '../types/enums';

export const StarMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<StarMapRenderer | null>(null);
  const [activeArea, setActiveArea] = useState<StarArea>(StarArea.SOLARSYSTEM);

  useEffect(() => {
    if (canvasRef.current) {
      const canvasId = "star-canvas-main";
      canvasRef.current.id = canvasId;
      
      try {
        const renderer = new StarMapRenderer(canvasId);
        rendererRef.current = renderer;
        
        const game = GameInstance.get();
        renderer.initStars(game.starManager.getAllStars());
        renderer.setActiveArea(activeArea);
        
        renderer.start();
        
        return () => {
          renderer.stop();
        };
      } catch (err) {
        console.error("StarMapRenderer failed to init:", err);
      }
    }
  }, []);

  // Update active area in renderer when state changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setActiveArea(activeArea);
    }
  }, [activeArea]);

  const handleZoomIn = useCallback(() => rendererRef.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => rendererRef.current?.zoomOut(), []);
  const handleResetView = useCallback(() => rendererRef.current?.resetView(), []);

  return (
    <div className="w-full h-full relative group">
      <CrisisWarningPanel />
      
      {/* 4-Area Tactical holographic tabs selector */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-1 py-1 glass-archive border border-[#243245]/50 z-20 rounded select-none shadow-lg">
        {[
          { key: StarArea.SOLARSYSTEM, label: "太阳系" },
          { key: StarArea.LIGHTYEAR_50, label: "50光年" },
          { key: StarArea.LIGHTYEAR_1W, label: "1万光年" },
          { key: StarArea.GALAXY, label: "银河系" }
        ].map(item => (
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

      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-crosshair transition-opacity duration-700"
      />
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-2 glass-panel rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] whitespace-nowrap">
          Star Map Controls
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="flex gap-4">
            <button onClick={handleZoomIn} className="text-[10px] hover:text-[var(--color-primary)] transition-colors uppercase font-bold cursor-pointer">Zoom In</button>
            <button onClick={handleZoomOut} className="text-[10px] hover:text-[var(--color-primary)] transition-colors uppercase font-bold cursor-pointer">Zoom Out</button>
            <button onClick={handleResetView} className="text-[10px] hover:text-[var(--color-primary)] transition-colors uppercase font-bold cursor-pointer">Reset View</button>
        </div>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/10 pointer-events-none" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/10 pointer-events-none" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/10 pointer-events-none" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/10 pointer-events-none" />
    </div>
  );
};
