import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronRight, Flag, Sparkles, Zap } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { STAR_INDEX } from '../config/starIndices';
import { TutorialMachine, type TutorialMachineCallbacks } from './tutorial/tutorialMachine';
import { markTutorialCompleted } from './tutorial/tutorialProgress';
import {
  SemanticTutorialEvent,
  WELCOME_AUTO_ADVANCE_MS,
  buildSteps,
  TUTORIAL_STEPS,
} from './tutorial/tutorialSteps';
import {
  type HighlightRect,
  computeHighlightRectFromElement,
  computeHighlightRectFromStar,
  computeOverlayBlocks,
  computeArrowPosition,
  computeCardStyle,
} from './tutorial/tutorialGeometry';

// 兼容旧测试引用
export { TUTORIAL_STEPS };
export type { TutorialStep } from './tutorial/tutorialSteps';

/** resolve-event 步骤注入的测试事件 ID */
const TUTORIAL_EVENT_ID = 'event_tutorial_eto_test';

export const Tutorial: React.FC<{ onComplete: () => void }> = ({ onComplete: onCompleteProp }) => {
  const game = GameInstance.get();
  const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
  const initialHasStope = useRef(!!earthStar?.hasStope || !!earthStar?.buildingProgress?.stope).current;
  const initialMiningRatio = useRef(game.earthCivi.miningRatio).current;

  const steps = useRef(buildSteps(initialHasStope, initialMiningRatio)).current;

  // 稳定的 onComplete 引用：避免外部传入的内联函数导致依赖链断裂
  const onCompleteRef = useRef(onCompleteProp);
  onCompleteRef.current = onCompleteProp;

  // ── 创建状态机（仅一次） ──
  const machineRef = useRef<TutorialMachine | null>(null);
  if (!machineRef.current) {
    const callbacks: TutorialMachineCallbacks = {
      onStepEnter: () => {
        /* 副作用由下方 useEffect 监听 step 变化时执行 */
      },
      onStepExit: (step) => {
        // 离开聚焦星步骤时清掉 pulse
        if (step.focusStar !== undefined) {
          try {
            const renderer = (window as any).activeStarMapRenderer;
            if (renderer && typeof renderer.setTutorialPulse === 'function') {
              renderer.setTutorialPulse(null);
            }
          } catch (_) { /* ignore */ }
        }
      },
      onComplete: () => {
        markTutorialCompleted();
        try {
          const renderer = (window as any).activeStarMapRenderer;
          if (renderer && typeof renderer.setTutorialPulse === 'function') {
            renderer.setTutorialPulse(null);
          }
        } catch (_) { /* ignore */ }
        window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'starmap' }));
        setTimeout(() => onCompleteRef.current(), 400);
      },
      onTargetMissing: (step) => {
        // 目标缺失超时：派发 Toast 提示，并跳过当前步骤（不锁屏）
        console.warn(`[Tutorial] 步骤 "${step.id}" 目标元素缺失超时，已自动跳过`);
        window.dispatchEvent(new CustomEvent('game:toast:message', {
          detail: {
            text: `智脑无法定位目标元素，已自动跳过 "${step.title}" 步骤。请从主菜单重新启动教程或继续游戏。`,
            category: '【智脑警告】',
          },
        }));
        // 跳过当前步骤（无论是 AUTO_COMPLETE 还是 MANUAL_ADVANCE）
        machineRef.current?.dispatch(SemanticTutorialEvent.MANUAL_ADVANCE);
      },
    };
    machineRef.current = new TutorialMachine(steps, callbacks);
  }
  const machine = machineRef.current;

  // ── 订阅状态机变化，触发 React 重渲染 ──
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = machine.subscribe(() => forceUpdate((v) => v + 1));
    // 启动状态机（进入第一步）
    machine.start();
    return () => {
      unsubscribe();
      machine.dispose();
    };
  }, [machine]);

  const stepIndex = machine.currentIndex();
  const current = machine.currentStep();
  const isComplete = machine.isComplete();

  // ── 视图状态：用于卡片定位计算 ──
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const [exiting, setExiting] = useState(false);
  const [actionValidated, setActionValidated] = useState(false);

  // ── 防御：resolve-event 步骤的事件注入标记，避免 effect 重跑后反复注入 ──
  const resolveEventInjectedRef = useRef(false);

  // ── 窗口尺寸追踪 ──
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // ── 监听当前步骤验证条件 ──
  useEffect(() => {
    setActionValidated(false);
    if (!current) return;

    if (!current.validate) {
      setActionValidated(true);
      return;
    }

    const validate = current.validate;
    const checkAndSet = () => {
      try {
        const g = GameInstance.get();
        if (validate(g)) {
          setActionValidated(true);
        }
      } catch (e) { /* ignore */ }
    };
    checkAndSet();

    const handler = () => checkAndSet();
    window.addEventListener('game-state-changed', handler);
    window.addEventListener('ap-changed', handler);
    const interval = setInterval(checkAndSet, 300);

    return () => {
      window.removeEventListener('game-state-changed', handler);
      window.removeEventListener('ap-changed', handler);
      clearInterval(interval);
    };
  }, [current]);

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
      console.error('Failed to disable AI brain on tutorial start:', e);
    }
    return () => {
      (window as any).isTutorialActive = false;
      (window as any).currentTutorialStepId = undefined;
      try {
        const renderer = (window as any).activeStarMapRenderer;
        if (renderer && typeof renderer.setTutorialPulse === 'function') {
          renderer.setTutorialPulse(null);
        }
      } catch (_) { /* ignore */ }
      try {
        const g = GameInstance.get();
        g.earthCivi.isAiBrainEnabled = previousAiState;
        window.dispatchEvent(new CustomEvent('ai-brain-toggled'));
        window.dispatchEvent(new CustomEvent('game-state-changed'));
      } catch (e) {
        console.error('Failed to restore AI brain on tutorial exit:', e);
      }
    };
  }, []);

  // ── 完成时触发退出动画 ──
  useEffect(() => {
    if (isComplete) setExiting(true);
  }, [isComplete]);

  // ── 高亮坐标追踪（requestAnimationFrame 循环 + 目标缺失通知状态机） ──
  useEffect(() => {
    if (!current) return;
    (window as any).currentTutorialStepId = current.id;

    // 防御：启动科技演进时，如果 AP 不足则强制赠予至少 50 AP，确保绝对不会因 AP 不足卡死
    if (current.id === 'start-research') {
      try {
        const g = GameInstance.get();
        if (g.earthCivi.apCurrent < 20) {
          g.earthCivi.apCurrent = 50;
          window.dispatchEvent(new CustomEvent('ap-changed'));
        }
      } catch (_) { /* ignore */ }
    }

    const targetId = current.highlightTarget;
    if (!targetId) {
      setHighlightRect(null);
      machine.markTargetFound();
      return;
    }

    let active = true;

    const updateRect = () => {
      if (!active) return;

      if (targetId === 'earth-star') {
        const renderer = (window as any).activeStarMapRenderer;
        if (renderer) {
          const coords = renderer.getStarScreenCoords(STAR_INDEX.EARTH);
          if (coords) {
            const size = current.highlightSize || 110;
            setHighlightRect(computeHighlightRectFromStar(coords, size));
            machine.markTargetFound();
            return;
          }
        }
        setHighlightRect(null);
        machine.markTargetMissing();
        return;
      }

      let element = document.querySelector(`[data-tutorial-id="${targetId}"]`);
      if (!element && targetId === 'left-hub') {
        element = document.querySelector('[data-tutorial-id="mobile-bottom-nav"]');
      }

      if (element) {
        // getBoundingClientRect() 已返回视口坐标，Tutorial 为 fixed 定位也在视口空间，无需再除缩放系数
        const rect = element.getBoundingClientRect();
        const computed = computeHighlightRectFromElement(rect);
        if (computed) {
          setHighlightRect(computed);
          machine.markTargetFound();
        } else {
          setHighlightRect(null);
          machine.markTargetMissing();
        }
      } else {
        setHighlightRect(null);
        machine.markTargetMissing();
      }
    };

    const renderLoop = () => {
      updateRect();
      if (active) requestAnimationFrame(renderLoop);
    };
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
  }, [current, machine]);

  // ── 步骤切换副作用：视图/Tab 同步、教程聚焦星、resolve-event 事件注入 ──
  useEffect(() => {
    if (!current) return;

    // 1. 切换主视图
    if (current.activeView) {
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: current.activeView }));
    }

    // 2. click-earth 步骤：自动派发 star-selected 选中地球
    if (current.id === 'click-earth') {
      try {
        const g = GameInstance.get();
        const earth = g.starManager.getStar(STAR_INDEX.EARTH);
        if (earth) {
          window.dispatchEvent(new CustomEvent('star-selected', { detail: earth }));
        }
      } catch (e) {
        console.error('Failed to auto-select Earth in tutorial:', e);
      }
    }

    // 3. 同步 inspector tab
    if (current.inspectorTab) {
      window.dispatchEvent(new CustomEvent('tutorial:set-tab', { detail: current.inspectorTab }));
    } else if (current.id !== 'click-earth') {
      window.dispatchEvent(new CustomEvent('tutorial:close-drawer'));
    }

    // 4. 隐藏 modal-container（避免与教程步骤视觉冲突）
    try {
      const modal = document.getElementById('modal-container');
      if (modal) modal.classList.add('hidden');
    } catch (e) { /* ignore */ }

    // 5. 教程聚焦星：自动居中 + 开启 pulse
    if (current.focusStar !== undefined) {
      let attempts = 0;
      const tryFocus = () => {
        attempts++;
        try {
          const renderer = (window as any).activeStarMapRenderer;
          if (renderer) {
            renderer.focusOnStar(current.focusStar!, 1.5, true);
            renderer.setTutorialPulse(current.focusStar!);
            return;
          }
        } catch (e) { /* ignore */ }
        if (attempts < 20) requestAnimationFrame(tryFocus);
      };
      requestAnimationFrame(tryFocus);
    } else {
      // 非聚焦步骤关闭 pulse
      try {
        const renderer = (window as any).activeStarMapRenderer;
        if (renderer && typeof renderer.setTutorialPulse === 'function') {
          renderer.setTutorialPulse(null);
        }
      } catch (_) { /* ignore */ }
    }

    // 6. resolve-event 步骤：注入并监听危机事件
    if (current.id === 'resolve-event') {
      const g = GameInstance.get();
      const isAlreadyInjected = resolveEventInjectedRef.current
        || g.currentEvent?.id === TUTORIAL_EVENT_ID
        || g.eventQueue.some((e) => e.id === TUTORIAL_EVENT_ID);
      if (!isAlreadyInjected) {
        resolveEventInjectedRef.current = true;
        g.currentEvent = null;
        g.eventQueue = [];
        g.eventQueue.push({
          id: TUTORIAL_EVENT_ID,
          title: '【智脑测试】拦截 ETO 异常信号',
          dialogQueue: [
            {
              speakerName: '智脑系统',
              content: '监测到加密通信片段，疑为 ETO 秘密节点。请指示对策。',
            },
          ],
          choices: [
            { label: '发布戒严警告（社会稳定 -5）', action: () => {} },
            { label: '暗中排查跟踪（积累情报）', action: () => {} },
          ],
        });
        g.processNextEvent();
        window.dispatchEvent(new CustomEvent('game-state-changed'));
      }
    }
  }, [current]);

  // ── 步骤事件监听器：根据 completionEvent 注册对应 window 事件 ──
  useEffect(() => {
    if (!current) return;

    const completionEvent = current.completionEvent;

    // WELCOME_TIMEOUT 被移除，所有步骤现在直接监听对应推进事件

    // TURN_COMPLETE 步骤：监听 game-turn-complete
    if (completionEvent === SemanticTutorialEvent.TURN_COMPLETE) {
      const handler = () => machine.dispatch(SemanticTutorialEvent.TURN_COMPLETE);
      window.addEventListener('game-turn-complete', handler);
      return () => window.removeEventListener('game-turn-complete', handler);
    }

    // EVENT_RESOLVED 步骤：监听 StoryModal 关闭（currentEvent === null）
    if (completionEvent === SemanticTutorialEvent.EVENT_RESOLVED) {
      const handler = () => {
        try {
          const g = GameInstance.get();
          // currentEvent 已清空表示事件处理完毕
          if (!g.currentEvent) {
            machine.dispatch(SemanticTutorialEvent.EVENT_RESOLVED);
          }
        } catch (e) { /* ignore */ }
      };
      window.addEventListener('game-state-changed', handler);
      // 兜底：监听 game-turn-complete（StoryModal 选项触发的回合结算可能不派发 game-state-changed）
      window.addEventListener('game-turn-complete', handler);
      return () => {
        window.removeEventListener('game-state-changed', handler);
        window.removeEventListener('game-turn-complete', handler);
      };
    }

    // WELCOME_TIMEOUT / MANUAL_ADVANCE / FINISH 由状态机内部定时器或按钮点击驱动，无需注册 window 事件
    return;
  }, [current, machine]);

  // ── 跳过教程 ──
  const handleSkip = useCallback(() => {
    machine.skip();
  }, [machine]);

  // ── ESC 快捷键跳过 ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // ── 手动「下一步」按钮：派发 MANUAL_ADVANCE 或 FINISH ──
  const handleManualAdvance = useCallback(() => {
    if (!current) return;
    if (current.completionEvent === SemanticTutorialEvent.FINISH) {
      machine.dispatch(SemanticTutorialEvent.FINISH);
    } else {
      machine.dispatch(SemanticTutorialEvent.MANUAL_ADVANCE);
    }
  }, [current, machine]);

  // ── click-earth 步骤：高亮框点击 = 选中地球（宽容点击） ──
  const handleEarthHotspotClick = useCallback(() => {
    if (!current || current.id !== 'click-earth') return;
    // 派发 star-selected 让 App.tsx 打开 drawer（移动端）+ RightInspector 渲染
    try {
      const g = GameInstance.get();
      const earth = g.starManager.getStar(STAR_INDEX.EARTH);
      if (earth) {
        window.dispatchEvent(new CustomEvent('star-selected', { detail: earth }));
      }
    } catch (e) { /* ignore */ }
    // click-earth 是 requiresManualAdvance 步骤，点击 hotspot 即视为完成
    machine.dispatch(SemanticTutorialEvent.MANUAL_ADVANCE);
  }, [current, machine]);

  if (!current) return null;

  const progress = ((stepIndex + 1) / steps.length) * 100;
  const showHighlight = highlightRect !== null;
  const isWelcome = current.id === 'welcome';
  const isClickEarth = current.id === 'click-earth';

  const cardStyle = computeCardStyle(highlightRect, { width: windowWidth, height: windowHeight }, current, isWelcome);
  const arrowPos = showHighlight && highlightRect ? computeArrowPosition(highlightRect) : null;
  const overlayBlocks = showHighlight && highlightRect ? computeOverlayBlocks(highlightRect) : [];

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none transition-all duration-400 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* 欢迎页：全屏遮罩（暗化但不阻塞鼠标） */}
      {isWelcome ? (
        <div data-testid="tutorial-overlay-full" className="absolute inset-0 bg-[#050810]/30 pointer-events-auto z-[1000]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      ) : showHighlight && highlightRect ? (
        <>
          {/* 全屏暗化层（不接收事件，避免吞掉 hotspot 外的合法点击） */}
          <div className="absolute inset-0 bg-[#050810]/20 pointer-events-none z-[1000]" />
          {/* 高亮遮罩：4 块拼接以提供"高亮区通透 + 其他区域接收事件"的视觉感受。 */}
          {overlayBlocks.map((blockStyle, i) => (
            <div
              key={i}
              data-testid={`tutorial-overlay-${['top', 'bottom', 'left', 'right'][i]}`}
              className="absolute bg-transparent pointer-events-auto transition-all duration-300"
              style={blockStyle as React.CSSProperties}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            />
          ))}
          {/* click-earth 步骤：在 hotspot 区域放置可点击层（宽容点击） */}
          {isClickEarth && (
            <div
              data-testid="tutorial-earth-hotspot"
              className="absolute z-[1001] cursor-pointer"
              style={{
                top: `${highlightRect.top}px`,
                left: `${highlightRect.left}px`,
                width: `${highlightRect.width}px`,
                height: `${highlightRect.height}px`,
              }}
              onClick={handleEarthHotspotClick}
            />
          )}
        </>
      ) : current.highlightTarget ? (
        // 目标缺失：步骤配置了 highlightTarget 但元素未渲染（highlightRect=null）。
        // 审计 P0 流程问题 #2 修复：不渲染全屏拦截遮罩，改为不拦截点击的轻微暗化层，
        // 玩家仍可操作游戏 UI，教程卡片（z-[1002]）保持可交互。
        <div data-testid="tutorial-overlay-missing" className="absolute inset-0 bg-[#050810]/10 pointer-events-none z-[1000]" />
      ) : (
        // 无 highlightTarget 的纯展示步骤（如 resolve-event）：全屏聚焦遮罩
        <div data-testid="tutorial-overlay-full" className="absolute inset-0 bg-[#050810]/30 pointer-events-auto z-[1000]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      )}

      {/* 高亮边框 */}
      {showHighlight && highlightRect && !isClickEarth && (
        <div
          className="absolute border-2 border-[var(--color-primary)] z-[1001] pointer-events-none rounded-lg"
          style={{
            top: `${highlightRect.top}px`,
            left: `${highlightRect.left}px`,
            width: `${highlightRect.width}px`,
            height: `${highlightRect.height}px`,
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            boxShadow: '0 0 15px rgba(0,229,255,0.4), inset 0 0 15px rgba(0,229,255,0.15)',
            animation: 'border-pulse 2s infinite alternate',
          }}
        />
      )}

      {/* 指引箭头 */}
      {showHighlight && highlightRect && arrowPos && (
        <div
          className="absolute z-[1002] pointer-events-none transition-all duration-300 animate-bounce"
          style={{
            top: arrowPos.top,
            left: arrowPos.left,
            width: 0,
            height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            ...(arrowPos.pointFromBelow
              ? { borderBottom: '10px solid var(--color-primary)' }
              : { borderTop: '10px solid var(--color-primary)' }),
            filter: 'drop-shadow(0 2px 5px rgba(0,229,255,0.5))',
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        />
      )}

      {/* 教程卡片 */}
      <div style={cardStyle} className={`relative z-[1002] w-full mx-auto flex flex-col pointer-events-auto transition-all duration-300 ${exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
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
              {isWelcome ? <Sparkles className="w-3 h-3 text-[var(--color-primary)]/60" /> : <Flag className="w-3 h-3 text-[var(--color-primary)]/60" />}
              <div className="text-[9px] font-mono font-bold text-[var(--color-primary)]/80 uppercase tracking-[0.2em]">
                {isWelcome ? '序幕' : `步骤 ${stepIndex} / ${steps.length - 1}`}
              </div>
            </div>
            <h2 className="text-base font-title font-black text-white tracking-widest leading-none drop-shadow-md">
              {current.title}
            </h2>
            <div className="font-sans text-sm bg-black/20 p-3 border-l-2 border-[var(--color-primary)]/40">
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {current.description}
              </p>
              {current.costHint && (
                <p className="mt-2 pt-2 border-t border-[var(--color-primary)]/20 text-[11px] text-amber-400/80 font-mono flex items-center gap-1.5">
                  <Zap size={11} className="shrink-0" />
                  <span>{current.costHint}</span>
                </p>
              )}
            </div>
            {!isWelcome && current.validate && (
              <div className="flex items-center gap-2 text-[10px] transition-colors duration-300">
                {actionValidated ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    ✓ {t("已完成指引操作，可点击下一步")}
                  </span>
                ) : (
                  <span className="text-amber-500/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    {t("等待指引操作完成...")}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 底部控制栏：统一三态按钮逻辑 */}
          <div className="flex items-center justify-between pt-3 border-t border-[#243245]/40 z-10">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer text-[var(--text-secondary)] hover:text-white"
            >
              {t("跳过教程")}
            </button>

            {stepIndex === steps.length - 1 ? (
              <button
                onClick={handleManualAdvance}
                disabled={!actionValidated}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded transition-all ${
                  actionValidated
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer animate-pulse'
                    : 'bg-gray-800/20 border border-gray-700/40 text-gray-500 cursor-not-allowed opacity-50'
                }`}
              >
                {actionValidated ? t("完成校准") : t("请按指引操作")} <ChevronRight size={14} />
              </button>
            ) : current?.requiresManualAdvance ? (
              <button
                onClick={handleManualAdvance}
                disabled={!actionValidated}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded transition-all ${
                  actionValidated
                    ? 'bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 border border-[var(--color-primary)]/60 text-cyan-200 shadow-[0_0_12px_rgba(0,184,255,0.2)] cursor-pointer animate-pulse'
                    : 'bg-gray-800/20 border border-gray-700/40 text-gray-500 cursor-not-allowed opacity-50'
                }`}
              >
                {current.id === 'welcome' 
                  ? t("开始校准")
                  : (actionValidated ? t("下一步") : t("请按指引操作"))
                } <ChevronRight size={14} />
              </button>
            ) : null}
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
