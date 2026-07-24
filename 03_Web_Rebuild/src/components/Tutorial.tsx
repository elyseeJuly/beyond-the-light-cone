import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X, ChevronRight, Flag, Sparkles } from 'lucide-react';
import { ActiveViewType } from './LeftHub';
import { GameInstance } from '../core/Game';
import { STAR_INDEX } from '../config/starIndices';
import { t } from '../utils/i18n';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlightTarget?: string;
  activeView: ActiveViewType;
  inspectorTab?: 'overview' | 'build' | 'fleet' | 'history';
  cardPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center';
  /** 是否为教程聚焦星（启用 StarMapRenderer.pulse + 强制居中） */
  focusStar?: number;
  /** 自定义高亮框尺寸（覆盖默认），用于不规则命中区 */
  highlightSize?: number;
  /** 是否允许"宽容点击"：高亮框内任意点击都算完成本步（不依赖真实命中） */
  forgivingClick?: boolean;
  /** 是否需要手动点击「下一步」推进（纯阅读或阶段谢幕步骤） */
  requiresManualAdvance?: boolean;
}

/**
 * 重设计后的新手教程：9 步（欢迎、核心操作与智脑校准收尾）。
 * 核心修复：
 *  - 步骤 1 启动时自动将地球居中并放大（focusOnStar），杜绝"找不到地球"
 *  - 步骤 1 高亮框扩大到 110×110px，覆盖 StarMapRenderer 60px 实际命中区
 *  - 步骤 1 启用 forgivingClick + StarMapRenderer pulse 环，引导玩家视线
 *  - 用单一可点击 hotspot 替换 4 块分块遮罩，消除接缝漏点
 *  - 增加欢迎页（1.5s 自动过渡或点击"开始"），给玩家仪式感与思考空间
 */
function buildSteps(hasStope: boolean): TutorialStep[] {
  return [
    {
      id: 'welcome',
      title: t('智脑辅助校准'),
      description: t('公元 2009 年，三体舰队启航。智脑战略系统初始化完成，即将开始校准。'),
      activeView: 'starmap',
      cardPosition: 'center',
    },
    {
      id: 'click-earth',
      title: t('选中家园星系'),
      description: t('已为您自动定位并选中地球坐标。这是我们在这片暗黑森林中唯一的基石。'),
      activeView: 'starmap',
      cardPosition: 'left',
      focusStar: STAR_INDEX.EARTH,
      requiresManualAdvance: true,
    },
    {
      id: 'read-status',
      title: t('监控三维产出'),
      description: t('查看右侧面板。矿产维持工业、经济驱动发展、文化决定科研速率。'),
      highlightTarget: 'right-inspector-panel',
      activeView: 'starmap',
      inspectorTab: 'overview',
      cardPosition: 'left',
      requiresManualAdvance: true,
    },
    {
      id: 'build-stope',
      title: t('建设矿业基础'),
      description: hasStope
        ? t('检查建好的采矿场。工业与太空防线的建立离不开资源供应。')
        : t('切换至建造面板，在地球轨道新建一座采矿场，奠定工业基础。'),
      highlightTarget: hasStope ? 'btn-inspect-stope' : 'btn-build-stope',
      activeView: 'starmap',
      inspectorTab: hasStope ? 'overview' : 'build',
      cardPosition: 'left',
    },
    {
      id: 'resource-production',
      title: t('调配劳力分配'),
      description: t('拖动采矿比例滑块。劳动资源有限，需根据战略重心合理取舍。'),
      highlightTarget: 'mining-ratio-section',
      activeView: 'starmap',
      inspectorTab: 'overview',
      cardPosition: 'left',
    },
    {
      id: 'start-research',
      title: t('启动科技演进'),
      description: t('进入科技树面板，点击选择「天文观测」节点启动首项研究。'),
      highlightTarget: 'tech-node-天文观测',
      activeView: 'techtree',
      cardPosition: 'right',
    },
    {
      id: 'next-turn',
      title: '执行首回合决策',
      description: '点击「下一回合」。时间将向前推移，智脑将演算各部门运转效果。',
      highlightTarget: 'btn-next-turn',
      activeView: 'starmap',
      cardPosition: 'bottom',
    },
    {
      id: 'resolve-event',
      title: '应对突发危机',
      description: '智脑推演到危机事件。每一个抉择都将深刻书写文明的生存命运。',
      activeView: 'starmap',
      cardPosition: 'center',
      requiresManualAdvance: true,
    },
    {
      id: 'tutorial-end',
      title: '智脑校准完毕',
      description: '校准完成！局势目标面板与智脑战术顾问已解锁，愿文明薪火永存。',
      activeView: 'starmap',
      cardPosition: 'center',
    },
  ];
}

/** 保留导出以兼容旧测试引用，默认走"无采矿场"路径 */
export const TUTORIAL_STEPS: TutorialStep[] = buildSteps(false);

/** 欢迎页自动过渡时长（毫秒） */
const WELCOME_AUTO_ADVANCE_MS = 1500;

export const Tutorial: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const game = GameInstance.get();
  const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
  const initialHasStope = useRef(!!earthStar?.hasStope || !!earthStar?.buildingProgress?.stope).current;
  const initialMiningRatio = useRef(game.earthCivi.miningRatio).current;

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
      // 退出教程时清除星图上的 pulse
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

    const updateRect = () => {
      if (!active) return;

      if (targetId === 'earth-star') {
        const renderer = (window as any).activeStarMapRenderer;
        if (renderer) {
          const coords = renderer.getStarScreenCoords(STAR_INDEX.EARTH);
          if (coords) {
            const size = current.highlightSize || 110;
            setHighlightRect({
              top: coords.y - size / 2,
              left: coords.x - size / 2,
              width: size,
              height: size,
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
        // getBoundingClientRect() 已返回视口坐标，Tutorial 为 fixed 定位也在视口空间，无需再除缩放系数
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          setHighlightRect(null);
        } else {
          setHighlightRect({
            top: Math.max(0, rect.top - 4),
            left: Math.max(0, rect.left - 4),
            width: rect.width + 8,
            height: rect.height + 8,
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

  // ── 视图/Tab 同步 + 教程聚焦星（核心：自动居中地球） ──
  useEffect(() => {
    if (!current) return;
    if (current.activeView) {
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: current.activeView }));
    }
    if (current.id === 'click-earth') {
      try {
        const g = GameInstance.get();
        const earth = g.starManager.getStar(STAR_INDEX.EARTH);
        if (earth) {
          window.dispatchEvent(new CustomEvent('star-selected', { detail: earth }));
        }
      } catch (e) {
        console.error("Failed to auto-select Earth in tutorial:", e);
      }
    }
    if (current.inspectorTab) {
      window.dispatchEvent(new CustomEvent('tutorial:set-tab', { detail: current.inspectorTab }));
    } else if (current.id !== 'click-earth') {
      window.dispatchEvent(new CustomEvent('tutorial:close-drawer'));
    }
    try {
      const modal = document.getElementById('modal-container');
      if (modal) modal.classList.add('hidden');
    } catch (e) { /* ignore */ }

    // 教程聚焦星：自动居中 + 开启 pulse
    if (current.focusStar !== undefined) {
      // 等待一帧让 StarMap 完成 render；极端情况下 renderer 还没挂载则轮询等待
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
      // 退出时清掉 pulse
      try {
        const renderer = (window as any).activeStarMapRenderer;
        if (renderer && typeof renderer.setTutorialPulse === 'function') {
          renderer.setTutorialPulse(null);
        }
      } catch (_) { /* ignore */ }
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'starmap' }));
      setTimeout(onComplete, 400);
      return s;
    });
  }, [steps.length, onComplete]);

  // ── 欢迎页：1.5s 自动过渡 ──
  useEffect(() => {
    if (current?.id !== 'welcome') return;
    stepCompletedRef.current = false;
    const timer = setTimeout(() => {
      completeStep();
    }, WELCOME_AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
    // completeStep 已用 ref 化的 stepCompletedRef 防止重入
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // ── 步骤 1 高亮框点击 = 选中地球（宽容点击，杜绝"明明在框内却没反应"） ──
  // ── 每步验证逻辑 ──
  useEffect(() => {
    stepCompletedRef.current = false;
    if (!current) return;
    const stepId = current.id;

    // 欢迎页不需验证
    if (stepId === 'welcome') return;

    // 步骤 next-turn：监听 game-turn-complete 事件
    if (stepId === 'next-turn') {
      const handler = () => {
        turnCompleteRef.current = true;
        completeStep();
      };
      window.addEventListener('game-turn-complete', handler);
      return () => window.removeEventListener('game-turn-complete', handler);
    }

    // 步骤 resolve-event：注入并监听危机事件
    if (stepId === 'resolve-event') {
      const g = GameInstance.get();
      const TUTORIAL_EVENT_ID = 'event_tutorial_eto_test';
      const isAlreadyInjected = g.currentEvent?.id === TUTORIAL_EVENT_ID || g.eventQueue.some(e => e.id === TUTORIAL_EVENT_ID);
      if (!isAlreadyInjected) {
        // 强制清除推进回合产生的随机事件，防止教程死锁
        g.currentEvent = null;
        g.eventQueue = [];
        g.eventQueue.push({
          id: TUTORIAL_EVENT_ID,
          title: '【智脑测试】拦截 ETO 异常信号',
          dialogQueue: [
            {
              speakerName: '智脑系统',
              content: '监测到加密通信片段，疑为 ETO 秘密节点。请指示对策。'
            }
          ],
          choices: [
            { label: '发布戒严警告（社会稳定 -5）', action: () => {} },
            { label: '暗中排查跟踪（积累情报）', action: () => {} }
          ]
        });
        g.processNextEvent();
        window.dispatchEvent(new CustomEvent('game-state-changed'));
      }
    }

    // 轮询验证逻辑
    const checkCondition = (): boolean => {
      const g = GameInstance.get();
      switch (stepId) {
        case 'build-stope': {
          const star = g.starManager.getStar(STAR_INDEX.EARTH);
          return !!star?.hasStope || !!star?.buildingProgress?.stope;
        }
        case 'resource-production': {
          return g.earthCivi.miningRatio !== initialMiningRatio;
        }
        case 'start-research': {
          for (const tree of g.earthCivi.tecTreeManager.trees.values()) {
            for (const node of tree.nodes.values()) {
              if (node.inResearch && !node.finished) return true;
            }
          }
          return false;
        }
        case 'welcome':
        case 'click-earth':
        case 'read-status':
        case 'next-turn':
        case 'resolve-event':
        case 'tutorial-end':
          return false; // 由定时器、特定事件监听或手动「下一步」按钮驱动
        default:
          console.error(`[Tutorial] 警告：步骤 "${stepId}" 未配置 checkCondition 验证规则，可能导致死锁。`);
          return false;
      }
    };

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
    try {
      const renderer = (window as any).activeStarMapRenderer;
      if (renderer && typeof renderer.setTutorialPulse === 'function') {
        renderer.setTutorialPulse(null);
      }
    } catch (_) { /* ignore */ }
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
  const isWelcome = current?.id === 'welcome';

  // ── 卡片定位（避免遮挡高亮目标） ──
  const getCardStyle = (): React.CSSProperties => {
    if (isWelcome) {
      return { position: 'relative', maxWidth: '520px', width: windowWidth < 768 ? 'calc(100% - 24px)' : '100%' };
    }
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
      {/* 欢迎页：全屏遮罩（暗化但不阻塞鼠标） */}
      {isWelcome ? (
        <div data-testid="tutorial-overlay-full" className="absolute inset-0 bg-[#050810]/80 pointer-events-auto z-[1000]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      ) : showHighlight && highlightRect ? (
        <>
          {/* 全屏暗化层（不接收事件，避免吞掉 hotspot 外的合法点击） */}
          <div className="absolute inset-0 bg-[#050810]/65 pointer-events-none z-[1000]" />
          {/* 高亮遮罩：4 块拼接以提供"高亮区通透 + 其他区域接收事件"的视觉感受。
              分块 div 接收事件的目的：阻止玩家误触其他 UI 元素。
              注意：分块 div 的内边正好与 highlightRect 接缝对齐为 hotspot，让 hotspot 独占点击。 */}
          {(() => {
            // 把分块内边各让出 2px（向 highlight 中心收缩），让 hotspot 区域独占点击无接缝
            const r = highlightRect;
            const shrink = 2;
            const inner = {
              left: r.left + shrink,
              top: r.top + shrink,
              right: r.left + r.width - shrink,
              bottom: r.top + r.height - shrink,
            };
            const blocks: React.CSSProperties[] = [
              { top: 0, left: 0, right: 0, height: `${Math.max(0, inner.top)}px` },
              { top: `${inner.bottom}px`, left: 0, right: 0, bottom: 0 },
              { top: `${inner.top}px`, height: `${Math.max(0, inner.bottom - inner.top)}px`, left: 0, width: `${Math.max(0, inner.left)}px` },
              { top: `${inner.top}px`, height: `${Math.max(0, inner.bottom - inner.top)}px`, left: `${inner.right}px`, right: 0 },
            ];
            return blocks.map((style, i) => (
              <div key={i} data-testid={`tutorial-overlay-${['top', 'bottom', 'left', 'right'][i]}`}
                className="absolute bg-transparent pointer-events-auto transition-all duration-300"
                style={style}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
            ));
          })()}
        </>
      ) : (
        <div data-testid="tutorial-overlay-full" className="absolute inset-0 bg-[#050810]/85 pointer-events-auto z-[1000]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
      )}

      {/* 高亮边框 */}
      {showHighlight && highlightRect && (
        <div className="absolute border-2 border-[var(--color-primary)] z-[1001] pointer-events-none rounded-lg"
          style={{
            top: `${highlightRect.top}px`, left: `${highlightRect.left}px`,
            width: `${highlightRect.width}px`, height: `${highlightRect.height}px`,
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            boxShadow: '0 0 15px rgba(0,229,255,0.4), inset 0 0 15px rgba(0,229,255,0.15)',
            animation: 'border-pulse 2s infinite alternate',
          }} />
      )}



      {/* 指引箭头 */}
      {showHighlight && highlightRect && (() => {
        const pointFromBelow = highlightRect.top <= 60;
        return (
          <div className="absolute z-[1002] pointer-events-none transition-all duration-300 animate-bounce"
            style={{
              top: pointFromBelow ? `${highlightRect.top + highlightRect.height + 4}px` : `${highlightRect.top - 20}px`,
              left: `${highlightRect.left + highlightRect.width / 2 - 10}px`,
              width: 0, height: 0,
              borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
              ...(pointFromBelow ? { borderBottom: '10px solid var(--color-primary)' } : { borderTop: '10px solid var(--color-primary)' }),
              filter: 'drop-shadow(0 2px 5px rgba(0,229,255,0.5))',
              transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            }} />
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
              {isWelcome ? <Sparkles className="w-3 h-3 text-[var(--color-primary)]/60" /> : <Flag className="w-3 h-3 text-[var(--color-primary)]/60" />}
              <div className="text-[9px] font-mono font-bold text-[var(--color-primary)]/80 uppercase tracking-[0.2em]">
                {isWelcome ? '序幕' : `步骤 ${step} / ${steps.length - 1}`}
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
            {!isWelcome && !current.requiresManualAdvance && (
              <div className="flex items-center gap-2 text-[10px] text-amber-500/70">
                <ChevronRight size={12} className="animate-pulse" />
                <span>完成操作后自动进入下一步</span>
              </div>
            )}
            {isWelcome && (
              <div className="flex items-center gap-2 text-[10px] text-[var(--color-primary)]/70">
                <ChevronRight size={12} className="animate-pulse" />
                <span>{Math.ceil(WELCOME_AUTO_ADVANCE_MS / 1000)} 秒后自动开始</span>
              </div>
            )}
          </div>

          {/* 底部控制栏：统一三态按钮逻辑 */}
          <div className="flex items-center justify-between pt-3 border-t border-[#243245]/40 z-10">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer text-[var(--text-secondary)] hover:text-white"
            >
              跳过教程
            </button>

            {step === steps.length - 1 ? (
              <button
                onClick={completeStep}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 rounded text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all cursor-pointer animate-pulse"
              >
                完成校准 <ChevronRight size={14} />
              </button>
            ) : current?.requiresManualAdvance ? (
              <button
                onClick={completeStep}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 border border-[var(--color-primary)]/60 rounded text-cyan-200 shadow-[0_0_12px_rgba(0,184,255,0.2)] transition-all cursor-pointer"
              >
                下一步 <ChevronRight size={14} />
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
