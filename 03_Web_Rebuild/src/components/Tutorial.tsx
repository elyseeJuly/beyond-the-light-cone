import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronRight, Flag } from 'lucide-react';
import { ActiveViewType } from './LeftHub';
import { GameInstance } from '../core/Game';
import { STAR_INDEX } from '../config/starIndices';

interface SimplifiedTutorialStep {
  id: string;
  title: string;
  description: string;
  highlightTarget?: string;
  activeView: ActiveViewType;
  inspectorTab?: 'overview' | 'build' | 'fleet' | 'history';
  cardPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center';
}

/**
 * 简化后的强制教程：四步，每步文案 ≤ 25 汉字。
 * 步骤 1（资源生产）根据开局是否已有采矿场动态切换文案与高亮目标。
 */
function buildSteps(hasStope: boolean): SimplifiedTutorialStep[] {
  return [
    {
      id: 'click-earth',
      title: '选中家园',
      description: '点击地球，选中你的家园。',
      highlightTarget: 'earth-star',
      activeView: 'starmap',
      cardPosition: 'left',
    },
    {
      id: 'resource-production',
      title: '资源生产',
      description: hasStope
        ? '拖动采矿滑块，调整一次劳动力分配。'
        : '点击建造采矿场，开始生产矿产。',
      highlightTarget: hasStope ? 'mining-ratio-section' : 'btn-build-stope',
      activeView: 'starmap',
      inspectorTab: hasStope ? 'overview' : 'build',
      cardPosition: 'left',
    },
    {
      id: 'start-research',
      title: '启动科研',
      description: '启动一项科研，让文明继续进步。',
      highlightTarget: 'tech-node-天文观测',
      activeView: 'techtree',
      cardPosition: 'right',
    },
    {
      id: 'next-turn',
      title: '推进回合',
      description: '点击下一回合，看看发生了什么。',
      highlightTarget: 'btn-next-turn',
      activeView: 'starmap',
      cardPosition: 'bottom',
    },
  ];
}

/** 保留导出以兼容旧测试引用，默认走"无采矿场"路径 */
export const TUTORIAL_STEPS: SimplifiedTutorialStep[] = buildSteps(false);

export const Tutorial: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const game = GameInstance.get();
  const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
  const initialHasStope = !!earthStar?.hasStope || !!earthStar?.buildingProgress?.stope;
  const initialMiningRatio = game.earthCivi.miningRatio;

  const steps = useRef(buildSteps(initialHasStope)).current;
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [highlightRect, setHighlightRect] = useState<{
    top: number; left: number; width: number; height: number;
  } | null>(null);

  const current = steps[step];
  const stepCompletedRef = useRef(false);
  const earthSelectedRef = useRef(false);
  const turnCompleteRef = useRef(false);

  // ── 窗口尺寸追踪 ──
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── 教程启动时关闭 AI 智脑，退出时恢复 ──
  useEffect(() => {
    let previousAiState = false;
    (window as any).isTutorialActive = true;
    try {
      const g = GameInstance.get();
      previousAiState = g.earthCivi.isAiBrainEnabled;
      g.earthCivi.isAiBrainEnabled = false;
      window.dispatchEvent(new CustomEvent('ai-brain-toggled'));
      window.dispatchEvent(new CustomEvent('game-state-changed'));
    } catch (e) {
      console.error("Failed to disable AI brain on tutorial start:", e);
    }
    return () => {
      (window as any).isTutorialActive = false;
      try {
        const g = GameInstance.get();
        g.earthCivi.isAiBrainEnabled = previousAiState;
        window.dispatchEvent(new CustomEvent('ai-brain-toggled'));
        window.dispatchEvent(new CustomEvent('game-state-changed'));
      } catch (e) {
        console.error("Failed to restore AI brain on tutorial exit:", e);
      }
    };
  }, []);

  // ── 高亮坐标追踪（requestAnimationFrame 循环） ──
  useEffect(() => {
    if (!current) return;
    const targetId = current.highlightTarget;
    if (!targetId) { setHighlightRect(null); return; }

    let active = true;
    const stepStartTime = Date.now();

    const getScaleFactor = (): number => {
      try {
        const el = document.querySelector('.mobile-landscape-scale');
        if (el) {
          const style = window.getComputedStyle(el);
          const matrix = new DOMMatrixReadOnly(style.transform);
          if (matrix.a !== 1) return matrix.a;
        }
      } catch (_) { /* ignore */ }
      return 1;
    };

    const updateRect = () => {
      if (!active) return;

      if (targetId === 'earth-star') {
        const renderer = (window as any).activeStarMapRenderer;
        if (renderer) {
          const coords = renderer.getStarScreenCoords(STAR_INDEX.EARTH);
          if (coords) {
            setHighlightRect({
              top: coords.y - 20, left: coords.x - 20, width: 40, height: 40,
            });
            return;
          }
        }
        setHighlightRect(null);
        return;
      }

      let element = document.querySelector(`[data-tutorial-id="${targetId}"]`);
      if (!element && targetId === 'left-hub') {
        element = document.querySelector('[data-tutorial-id="mobile-bottom-nav"]');
      }

      if (element) {
        if (Date.now() - stepStartTime < 1000) {
          element.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
        }
        const rect = element.getBoundingClientRect();
        const scaleFactor = getScaleFactor();
        const correctedRect = scaleFactor !== 1 ? {
          top: rect.top / scaleFactor, left: rect.left / scaleFactor,
          width: rect.width / scaleFactor, height: rect.height / scaleFactor,
        } : rect;

        if (correctedRect.width === 0 || correctedRect.height === 0) {
          setHighlightRect(null);
        } else {
          setHighlightRect({
            top: Math.max(0, correctedRect.top - 4),
            left: Math.max(0, correctedRect.left - 4),
            width: correctedRect.width + 8,
            height: correctedRect.height + 8,
          });
        }
      } else {
        setHighlightRect(null);
      }
    };

    const renderLoop = () => { updateRect(); if (active) requestAnimationFrame(renderLoop); };
    requestAnimationFrame(renderLoop);

    window.addEventListener('resize', updateRect);
    window.addEventListener('change-active-view', updateRect);
    window.addEventListener('tutorial:set-tab', updateRect);
    return () => {
      active = false;
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('change-active-view', updateRect);
      window.removeEventListener('tutorial:set-tab', updateRect);
    };
  }, [step, current]);

  // ── 视图/Tab 同步 ──
  useEffect(() => {
    if (!current) return;
    if (current.activeView) {
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: current.activeView }));
    }
    if (current.inspectorTab) {
      window.dispatchEvent(new CustomEvent('tutorial:set-tab', { detail: current.inspectorTab }));
    } else {
      window.dispatchEvent(new CustomEvent('tutorial:close-drawer'));
    }
    try {
      const modal = document.getElementById('modal-container');
      if (modal) modal.classList.add('hidden');
    } catch (e) { /* ignore */ }
  }, [current]);

  // ── 完成当前步骤（防重复） ──
  const completeStep = useCallback(() => {
    if (stepCompletedRef.current) return;
    stepCompletedRef.current = true;
    setStep(s => {
      if (s < steps.length - 1) return s + 1;
      // 最后一步完成 → 结束教程
      setExiting(true);
      localStorage.setItem('game-tutorial-seen', 'true');
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'starmap' }));
      setTimeout(onComplete, 400);
      return s;
    });
  }, [steps.length, onComplete]);

  // ── 每步验证逻辑 ──
  useEffect(() => {
    stepCompletedRef.current = false;
    if (!current) return;
    const stepId = current.id;

    // 步骤 0：监听 star-selected 事件
    if (stepId === 'click-earth') {
      const handler = (e: Event) => {
        const star = (e as CustomEvent).detail;
        if (star && (star.index === STAR_INDEX.EARTH || star.name === '地球')) {
          earthSelectedRef.current = true;
          completeStep();
        }
      };
      window.addEventListener('star-selected', handler);
      return () => window.removeEventListener('star-selected', handler);
    }

    // 步骤 3：监听 game-turn-complete 事件
    if (stepId === 'next-turn') {
      const handler = () => {
        turnCompleteRef.current = true;
        completeStep();
      };
      window.addEventListener('game-turn-complete', handler);
      return () => window.removeEventListener('game-turn-complete', handler);
    }

    // 步骤 1 & 2：轮询验证
    const checkCondition = (): boolean => {
      const g = GameInstance.get();
      switch (stepId) {
        case 'resource-production': {
          const star = g.starManager.getStar(STAR_INDEX.EARTH);
          if (!star) return false;
          if (initialHasStope) {
            return g.earthCivi.miningRatio !== initialMiningRatio;
          }
          return !!star.buildingProgress?.stope || !!star.hasStope;
        }
        case 'start-research': {
          for (const tree of g.earthCivi.tecTreeManager.trees.values()) {
            for (const node of tree.nodes.values()) {
              if (node.inResearch && !node.finished) return true;
            }
          }
          return false;
        }
        default:
          return false;
      }
    };

    // 首次检查（可能进入步骤时条件已满足）
    if (checkCondition()) {
      completeStep();
      return;
    }

    const interval = setInterval(() => {
      if (checkCondition()) {
        clearInterval(interval);
        completeStep();
      }
    }, 300);
    return () => clearInterval(interval);
  }, [current, completeStep, initialHasStope, initialMiningRatio]);

  // ── 跳过教程 ──
  const handleSkip = useCallback(() => {
    setExiting(true);
    localStorage.setItem('game-tutorial-seen', 'true');
    window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'starmap' }));
    setTimeout(onComplete, 400);
  }, [onComplete]);

  // ── ESC 快捷键跳过 ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  const progress = ((step + 1) / steps.length) * 100;
  const showHighlight = highlightRect !== null;

  // ── 卡片定位（避免遮挡高亮目标） ──
  const getCardStyle = (): React.CSSProperties => {
    if (!showHighlight || !highlightRect) {
      return { position: 'relative', maxWidth: '480px', width: windowWidth < 768 ? 'calc(100% - 24px)' : '100%' };
    }

    if (windowHeight < 500) {
      const isTargetOnLeft = (highlightRect.left + highlightRect.width / 2) < windowWidth / 2;
      return {
        position: 'absolute', top: '12px', bottom: '12px',
        ...(isTargetOnLeft ? { right: '12px', left: 'auto' } : { left: '12px', right: 'auto' }),
        width: '300px', margin: 0, maxHeight: 'calc(100vh - 24px)', overflowY: 'auto',
      };
    }

    if (windowWidth < 768) {
      const isUpperHalf = (highlightRect.top + highlightRect.height / 2) < windowHeight / 2;
      return {
        position: 'absolute', left: '12px', right: '12px', width: 'calc(100% - 24px)',
        margin: 0, maxWidth: 'none',
        ...(isUpperHalf ? { bottom: '12px', top: 'auto', transform: 'none' } : { top: '12px', bottom: 'auto', transform: 'none' }),
      };
    }

    const pos = current?.cardPosition || 'center';
    if (pos === 'left') return { position: 'absolute', left: '40px', top: '50%', transform: 'translateY(-50%)', margin: 0, maxWidth: '480px' };
    if (pos === 'right') return { position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)', margin: 0, maxWidth: '480px' };
    if (pos === 'bottom') return { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', margin: 0, maxWidth: '480px' };
    if (pos === 'top') return { position: 'absolute', top: '40px', left: '50%', transform: 'translateX(-50%)', margin: 0, maxWidth: '480px' };
    return { position: 'relative', maxWidth: '480px' };
  };

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none transition-all duration-400 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* 高亮遮罩 */}
      {showHighlight && highlightRect ? (
        <div className="absolute inset-0 pointer-events-none z-[1000]">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-[999]">
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={highlightRect.left} y={highlightRect.top} width={highlightRect.width} height={highlightRect.height} rx="8" ry="8" fill="black" style={{ transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }} />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="#050810" fillOpacity="0.65" mask="url(#tutorial-mask)" />
          </svg>
          {(['top', 'bottom', 'left', 'right'] as const).map(side => {
            const styles: Record<string, React.CSSProperties> = {
              top: { top: 0, left: 0, right: 0, height: `${highlightRect.top}px` },
              bottom: { top: `${highlightRect.top + highlightRect.height}px`, left: 0, right: 0, bottom: 0 },
              left: { top: `${highlightRect.top}px`, height: `${highlightRect.height}px`, left: 0, width: `${highlightRect.left}px` },
              right: { top: `${highlightRect.top}px`, height: `${highlightRect.height}px`, left: `${highlightRect.left + highlightRect.width}px`, right: 0 },
            };
            return (
              <div key={side} data-testid={`tutorial-overlay-${side}`} className="absolute bg-transparent pointer-events-auto transition-all duration-300" style={styles[side]} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
            );
          })}
        </div>
      ) : (
        <div data-testid="tutorial-overlay-full" className="absolute inset-0 bg-[#050810]/85 pointer-events-auto z-[1000]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      )}

      {/* 高亮边框 */}
      {showHighlight && highlightRect && (
        <div className="absolute border-2 border-[var(--color-primary)] z-[1001] pointer-events-none rounded-lg"
          style={{ top: `${highlightRect.top}px`, left: `${highlightRect.left}px`, width: `${highlightRect.width}px`, height: `${highlightRect.height}px`, transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', boxShadow: '0 0 15px rgba(0,229,255,0.4), inset 0 0 15px rgba(0,229,255,0.15)', animation: 'border-pulse 2s infinite alternate' }} />
      )}

      {/* 指引箭头 */}
      {showHighlight && highlightRect && (() => {
        const pointFromBelow = highlightRect.top <= 60;
        return (
          <div className="absolute z-[1002] pointer-events-none transition-all duration-300 animate-bounce"
            style={{ top: pointFromBelow ? `${highlightRect.top + highlightRect.height + 4}px` : `${highlightRect.top - 20}px`, left: `${highlightRect.left + highlightRect.width / 2 - 10}px`, width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', ...(pointFromBelow ? { borderBottom: '10px solid var(--color-primary)' } : { borderTop: '10px solid var(--color-primary)' }), filter: 'drop-shadow(0 2px 5px rgba(0,229,255,0.5))', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)' }} />
        );
      })()}

      {/* 教程卡片 */}
      <div style={getCardStyle()} className={`relative z-[1002] w-full mx-auto flex flex-col pointer-events-auto transition-all duration-300 ${exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* 进度条 */}
        <div className="w-full h-1 bg-[#243245]/40 rounded-t overflow-hidden shrink-0">
          <div className="h-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {/* 内容卡片 */}
        <div className="relative bg-[#070B14]/90 backdrop-blur-md border border-[var(--color-primary)]/30 rounded-b p-4 sm:p-6 flex flex-col gap-4 overflow-hidden shadow-[0_0_40px_rgba(0,184,255,0.15)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[var(--color-primary)]/10 border-x border-b border-[var(--color-primary)]/30 px-4 py-0.5 rounded-b text-[10px] text-[var(--color-primary)] font-bold tracking-[0.2em] uppercase shadow-[0_0_10px_rgba(0,184,255,0.2)]">
            光锥之外·纪元往事
          </div>

          {/* 扫描线装饰 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary),transparent_1px),linear-gradient(to_bottom,var(--color-primary),transparent_1px)] bg-[size:24px_24px] opacity-[0.02]" />
            <div className="w-full h-[1px] bg-[var(--color-primary)]/20 shadow-[0_0_15px_var(--color-primary)] absolute top-0 animate-[portrait-scan_3s_linear_infinite]" />
          </div>

          {/* 角装饰 */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-primary)]/50 z-10" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-primary)]/50 z-10" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-primary)]/50 z-10" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-primary)]/50 z-10" />

          {/* 跳过按钮 */}
          <button onClick={handleSkip} className="absolute top-5 right-5 text-[var(--text-secondary)] hover:text-white transition-colors z-20 cursor-pointer p-1" data-testid="tutorial-skip-btn">
            <X size={16} />
          </button>

          {/* 步骤内容 */}
          <div className="flex flex-col gap-3 z-10 mt-4">
            <div className="flex items-center gap-2">
              <Flag className="w-3 h-3 text-[var(--color-primary)]/60" />
              <div className="text-[9px] font-mono font-bold text-[var(--color-primary)]/80 uppercase tracking-[0.2em]">
                步骤 {step + 1} / {steps.length}
              </div>
            </div>
            <h2 className="text-base font-title font-black text-white tracking-widest leading-none drop-shadow-md">
              {current.title}
            </h2>
            <div className="font-sans text-sm bg-black/20 p-3 border-l-2 border-[var(--color-primary)]/40">
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {current.description}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-amber-500/70">
              <ChevronRight size={12} className="animate-pulse" />
              <span>完成操作后自动进入下一步</span>
            </div>
          </div>

          {/* 底部控制栏：只有跳过教程 */}
          <div className="flex items-center justify-end pt-3 border-t border-[#243245]/40 z-10">
            <button onClick={handleSkip} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer text-[var(--text-secondary)] hover:text-white">
              跳过教程 <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes border-pulse {
          0% { border-color: rgba(0, 229, 255, 0.4); box-shadow: 0 0 8px rgba(0, 229, 255, 0.25), inset 0 0 6px rgba(0, 229, 255, 0.1); }
          100% { border-color: rgba(0, 229, 255, 1); box-shadow: 0 0 20px rgba(0, 229, 255, 0.65), inset 0 0 15px rgba(0, 229, 255, 0.3); }
        }
      `}</style>
    </div>
  );
};
