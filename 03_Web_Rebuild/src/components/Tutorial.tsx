import React, { useState, useCallback, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, X, Shield, Rocket, 
  Building2, Cpu, TrendingUp, 
  Star,
  Lightbulb, Clock, Crosshair, Landmark, Lock, Flag
} from 'lucide-react';
import { ActiveViewType } from './LeftHub';
import { GameInstance } from '../core/Game';

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
  tips?: string[];
  highlightArea?: 'top' | 'left' | 'center' | 'right' | 'none';
  highlightTarget?: string;
  activeView: ActiveViewType;
  inspectorTab?: 'overview' | 'build' | 'fleet' | 'history';
  govTab?: 'finance' | 'military' | 'tech' | 'social' | 'security' | 'diplomacy';
  cardPosition?: 'left' | 'right' | 'top' | 'bottom' | 'center';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  // ===== 第一章：欢迎与世界观 =====
  {
    icon: <Lock size={32} />,
    title: '档案访问授权确认',
    category: '序章',
    description: '权限验证通过。欢迎您，文明执政官。\n\n公元 2XXX 年，三体文明发现了地球的存在。作为地球防卫理事会最高指挥官，你将在黑暗森林法则的阴影下，带领人类文明穿越六大纪元。\n在这座银河文明档案馆中，你的每一个决策都将书写人类文明的历史。',
    highlightTarget: 'none',
    activeView: 'starmap',
    cardPosition: 'center',
  },
  {
    icon: <Clock size={32} />,
    title: '历史纪元演进',
    category: '序章',
    description: '文明档案记录了六个宏大纪元，每个纪元都有独特的挑战与危机：\n\n• 危机纪元（第1-200年）— 面临智子封锁与生存危机\n• 威慑纪元（第201-260年）— 执剑人建立黑暗森林威慑\n• 广播纪元（第261-300年）— 坐标暴露，应对黑暗森林打击\n• 掩体纪元（第301-350年）— 太阳系最后的防御建设窗口\n• 银河纪元（第351年起）— 逃亡星海，成为星舰文明\n• 星屑纪元（尾声）— 宇宙降维崩塌中的最后火种',
    highlightTarget: 'top-hud-epoch',
    activeView: 'starmap',
    tips: ['纪元会随文明发展进度与年份自动推进', '不同纪元会解锁不同的事件与科技路线'],
    cardPosition: 'bottom',
  },
  {
    icon: <Cpu size={32} />,
    title: '执政指令点与 AI 智脑',
    category: '序章',
    description: '关注顶部 HUD 指标区的紫色「AP」与「智脑托管」按钮：\n\n• ⚡ AP (执政指令点) = 文明每回合的决策行动力上限。建造（10 AP）、研发科研（20 AP）都会消耗可用指令值。\n• 🤖 AI 智脑托管 = 协助决策系统（默认开启，开启时AI决策消耗AP减半）。智脑在每回合开始前，会自动任命空缺首长、选择成本最低科研并应急调配工种。\n\n⚠️ 手动模式阻断器：若关闭智脑托管，存在科技停滞、首长空缺或经济崩盘时，将无法推进「下一回合」。系统已临时将您的智脑切换至「手动」，便于您手动完成基础授权。',
    highlightTarget: 'btn-ai-brain',
    activeView: 'starmap',
    tips: ['智脑托管在前期可极大地减少繁琐操作，但在战略决战时推荐切换手动', '首长任命可获得 AP 回合恢复力加成'],
    cardPosition: 'bottom',
  },

  // ===== 第二章：战略星图与基础操作 =====
  {
    icon: <Star size={32} />,
    title: '战略星图观测仪',
    category: '战略指挥',
    description: '欢迎进入高维星图全息投影。这里展示了人类的势力范围与深空星天：\n\n• 🟡 发光天体 = 恒星（如太阳）\n• 🔵 蓝色光环 = 人类控制区/己方势力\n• 🔴 红色光环 = 异星文明占领区（如三体）\n• ⚪ 灰色光环 = 无主星系，可派遣舰队开发\n\n操作方式：使用鼠标滚轮缩放星图，长按左键拖拽调整视角。',
    highlightTarget: 'starmap-viewport',
    activeView: 'starmap',
    tips: ['研究航天学相关科技可以扩大观测视野', '被占领星系的脉冲环颜色代表归属权'],
    cardPosition: 'left',
  },
  {
    icon: <Star size={32} />,
    title: '行星观测与选择',
    category: '战略指挥',
    description: '【手把手指令 ①】：\n现在，请点击星图中央的「地球」星球。\n\n这将激活右侧的行星指令开发终端，以便进行具体的建设与资源调配。',
    highlightTarget: 'earth-star',
    activeView: 'starmap',
    tips: ['双击星球可以快速聚焦视角', '必须先选中行星，右侧才会出现具体的开发面板'],
    cardPosition: 'left',
  },
  {
    icon: <TrendingUp size={32} />,
    title: '行星开发建设',
    category: '战略指挥',
    description: '【手把手指令 ②】：\n系统已为您自动选择「地球」并打开右侧开发面板（在移动端已自动拉起抽屉）。\n\n⚠️ 开局至关重要的一步：点击右侧开发面板中的「采矿场」进行建设！有了矿产资源，每回合才能产出基础矿物。',
    highlightTarget: 'btn-build-stope',
    activeView: 'starmap',
    inspectorTab: 'build',
    tips: ['有了采矿场后，建造加工厂可以进一步加工矿产为经济收入', '右上角的「下一回合」按钮是推进年份的唯一方式'],
    cardPosition: 'left',
  },

  // ===== 第三章：内政管理与科学技术 =====
  {
    icon: <Landmark size={32} />,
    title: '内阁政府管理中枢',
    category: '内政管理',
    description: '【手把手指令 ③】：\n系统已为您自动打开「政府」管理界面。\n\n在这里，您可以行使最高统帅权：\n• 任命经济、军事、科研与文化部的负责人以获取各种产出加成\n• 指派面壁者秘密策划，应对三体危机\n\n⚠️ 开局提示：点击下方的「进入中央计划局 (分配与扩产)」指派负责人，可以让您的产出速度提升一倍以上！',
    highlightTarget: 'btn-gov-finance-dept',
    activeView: 'government',
    govTab: 'finance',
    tips: ['官员拥有不同的属性，Science 影响研发，Leadership 影响威慑与军事', '任命官员不会消耗本回合时间'],
    cardPosition: 'left',
  },
  {
    icon: <Cpu size={32} />,
    title: '科学技术解码中心',
    category: '内政管理',
    description: '【手把手指令 ④】：\n系统已为您切换至「科技研发」面板。\n\n物理学、航天学、信息学等五大科技树是文明的第二生命：\n• 🔬 基础科学（如量子计算、曲率驱动）决定文明上限\n• ⚔️ 战争科技（如恒星级战舰、黑暗森林打击）保障安全\n\n⚠️ 执政警告：智子对人类的基础物理进行了锁死！在此以物理学分类下的「天文观测」为例，点击该节点即可消耗资源并启动研发。我们需要逐步积累研发度，直至攻克“550W量子计算机”等核心技术以对抗智子封锁。',
    highlightTarget: 'tech-node-天文观测',
    activeView: 'techtree',
    tips: ['未任命科学部长时，科研效率将极其低下', '研发高级科技需要对应的前置物理学突破'],
    cardPosition: 'right',
  },
  {
    icon: <Shield size={32} />,
    title: '黑暗森林防备体系',
    category: '外御备战',
    description: '【手把手指令 ⑤】：\n系统再次将视角拉回「政府」中枢的防备区域。\n\n面对外星文明的生存挤压，您必须建立强大的防御与阻断体系：\n• 面壁者：每回合静默积攒威慑度与军备\n• 执剑人：握有核阻断剑柄的终极威慑者\n\n⚠️ 执政法则：高威慑值能逼退敌意文明 of 入侵。威慑的成败不仅取决于威慑度数值，更取决于执剑人的 Leadership 属性！一旦威慑失效，太阳系将面临灭顶之灾！\n\n🎯 执政指令：点击下方的「召开面壁计划战略听证会」可以进入面壁者与执剑人的管理终端。',
    highlightTarget: 'btn-open-wallfacer-hearings',
    activeView: 'government',
    govTab: 'security',
    tips: ['威慑纪元来临时，必须慎重选择接任的执剑人', '一旦进入威慑，失去兽性将失去一切'],
    cardPosition: 'left',
  },
  {
    icon: <Crosshair size={32} />,
    title: '深空外交监测网络',
    category: '外御备战',
    description: '【手把手指令 ⑥】：\n系统已为您连接到「情报中心」的外星电波与系统广播信道。\n\n在这里，宇宙的冷酷与动态变化尽收眼底：\n• 危机报告 🚨 — 记录三体探测器接近、水滴入侵等宇宙危机\n• 外交互动 🌐 — 记录与其他宇宙文明（三体、歌者、归零者）的往来动态\n• 科研、军事与民生 — 全方位监测地球内部的建设与社会秩序\n\n🎯 执政提醒：当有新消息未读时，左侧侧边栏或底部导航栏的情报中心图标上会出现红色呼吸提示气泡，请随时点击查看最新局势。实际的外交谈判与交易，需在「政府管理」的「外交委员会」中进行。',
    highlightTarget: 'intel-sidebar',
    activeView: 'intelligence',
    tips: ['关系过于恶劣的外星文明将拒绝接受任何贸易提案', '在实力薄弱时，依靠结盟外交是求生的不二法门'],
    cardPosition: 'right',
  },
  {
    icon: <Building2 size={32} />,
    title: '文明稳定维系法则',
    category: '生存危机',
    description: '系统已将您的视角还原到主星图。请将视线移到顶部 HUD 指标区。\n\n🏛 文明稳定度是您执政的生命线：\n• 它由您的 经济能力、军事规模、科技研发度 以及 文化产出 四大维度加权决定\n• 🚨 惩罚因子：当文明内部积攒了过高的「逃亡倾向」时，社会秩序失控，稳定度会遭到沉重处罚！\n\n稳定度一旦降为 0%，您的本局游戏将立即宣告失败。请通过社会保障 and 文化建设，随时抚平社会的恐慌。',
    highlightTarget: 'top-hud-stability',
    activeView: 'starmap',
    tips: ['经济崩溃或军事大败会直接腰斩文明稳定度', '社会 & 文化部长的 Art 属性可以用来平复逃亡倾向'],
    cardPosition: 'bottom',
  },
  {
    icon: <Rocket size={32} />,
    title: '授权通过：执政官生存法则',
    category: '最终指示',
    description: '手把手操作演示完毕，您的执政官权限已全面激活。在踏入黑暗森林之前，请牢记这十步生存守则：\n\n① 在地球建设「资源采矿场」积累原始矿产\n② 建设「工业加工厂」将矿产转化为经济收入\n③ 在政府管理中指派各部门负责人\n④ 任命至少两名面壁者，积攒防御实力\n⑤ 任命一位高领导力 (Leadership) 的执剑人建立威慑盾牌\n⑥ 研发航天与宇宙科学，扩张星图开发区\n⑦ 不不要在没有采矿场的情况下连续建造加工厂，防止资源枯竭\n⑧ 随时关注稳定度跌幅，任命合适的部委负责人疏导逃亡倾向\n⑨ 太阳系打击降临时，依靠“太空城市”或“掩体太空城”疏散人口\n⑩ 合理利用情报中心监测动态与异星外交谈判。\n\n愿人类的荣光在黑暗森林中永不熄灭，执政官！',
    highlightTarget: 'btn-next-turn',
    activeView: 'starmap',
    cardPosition: 'left',
  },
];

export const Tutorial: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [, setSlideDir] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const [highlightRect, setHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const current = TUTORIAL_STEPS[step];

  // Track window resizing for responsive layouts
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Turn off AI brain to allow manual step-by-step guidance, and restore player's previous preference on unmount
  useEffect(() => {
    let previousAiState = false;
    (window as any).isTutorialActive = true;
    try {
      const game = GameInstance.get();
      previousAiState = game.earthCivi.isAiBrainEnabled;
      game.earthCivi.isAiBrainEnabled = false;
      window.dispatchEvent(new CustomEvent('ai-brain-toggled'));
      window.dispatchEvent(new CustomEvent('game-state-changed'));
    } catch (e) {
      console.error("Failed to disable AI brain on tutorial start:", e);
    }
    return () => {
      (window as any).isTutorialActive = false;
      try {
        const game = GameInstance.get();
        game.earthCivi.isAiBrainEnabled = previousAiState;
        window.dispatchEvent(new CustomEvent('ai-brain-toggled'));
        window.dispatchEvent(new CustomEvent('game-state-changed'));
      } catch (e) {
        console.error("Failed to restore AI brain on tutorial exit:", e);
      }
    };
  }, []);

  // Calculate dynamic highlight coordinates with requestAnimationFrame loop for tracking animations/transitions
  useEffect(() => {
    if (!current) return;
    const targetId = current.highlightTarget || (
      current.highlightArea === 'top' ? 'top-hud' :
      current.highlightArea === 'left' ? 'left-hub' :
      current.highlightArea === 'right' ? 'right-inspector' :
      current.highlightArea === 'center' ? 'starmap-viewport' :
      null
    );

    if (!targetId || targetId === 'none') {
      setHighlightRect(null);
      return;
    }

    let active = true;
    const stepStartTime = Date.now();

    // Detect mobile-landscape-scale CSS transform for coordinate correction
    const getScaleFactor = (): number => {
      try {
        const el = document.querySelector('.mobile-landscape-scale');
        if (el) {
          const style = window.getComputedStyle(el);
          const matrix = new DOMMatrixReadOnly(style.transform);
          if (matrix.a !== 1 || matrix.d !== 1) {
            return matrix.a; // scaleX (should equal scaleY for uniform scaling)
          }
        }
      } catch (_) { /* ignore */ }
      return 1;
    };
    const scaleFactor = getScaleFactor();

    const updateRect = () => {
      if (!active) return;

      // Handle Earth star special target coordinate tracking from the active StarMapRenderer
      if (targetId === 'earth-star') {
        const renderer = (window as any).activeStarMapRenderer;
        if (renderer) {
          const coords = renderer.getStarScreenCoords(3); // Earth's index is 3
          if (coords) {
            setHighlightRect({
              top: coords.y - 20,
              left: coords.x - 20,
              width: 40,
              height: 40,
            });
            return;
          }
        }
        setHighlightRect(null);
        return;
      }

      let element = document.querySelector(`[data-tutorial-id="${targetId}"]`);
      
      // Fallback for mobile if left sidebar is hidden
      if (!element && targetId === 'left-hub') {
        element = document.querySelector('[data-tutorial-id="mobile-bottom-nav"]');
      }
      // Fallback for mobile tabs in LeftHub
      if (!element && targetId.startsWith('nav-')) {
        const viewName = targetId.replace('nav-', '');
        element = document.querySelector(`[data-tutorial-id="mobile-nav-${viewName}"]`);
      }

      if (element) {
        // Scroll into view continuously for the first 1000ms of a new step
        // to handle slide-in drawer or tab transitions/animations
        if (Date.now() - stepStartTime < 1000) {
          element.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
        }

        const rect = element.getBoundingClientRect();
        
        // Apply scale correction for mobile-landscape-scale transform
        const correctedRect = scaleFactor !== 1 ? {
          top: rect.top / scaleFactor,
          left: rect.left / scaleFactor,
          width: rect.width / scaleFactor,
          height: rect.height / scaleFactor,
        } : rect;
        
        // If element is hidden or has 0 size, hide the highlight box
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

    // Use requestAnimationFrame loop to continuously recalculate coordinates
    // during layout transitions (like inspector drawer sliding or government tab changes)
    const renderLoop = () => {
      updateRect();
      if (active) {
        requestAnimationFrame(renderLoop);
      }
    };

    requestAnimationFrame(renderLoop);

    window.addEventListener('resize', updateRect);
    window.addEventListener('change-active-view', updateRect);
    window.addEventListener('tutorial:set-tab', updateRect);
    window.addEventListener('tutorial:set-gov-tab', updateRect);

    return () => {
      active = false;
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('change-active-view', updateRect);
      window.removeEventListener('tutorial:set-tab', updateRect);
      window.removeEventListener('tutorial:set-gov-tab', updateRect);
    };
  }, [step, current]);

  const progress = ((step + 1) / TUTORIAL_STEPS.length) * 100;

  const animateTransition = useCallback((dir: 'left' | 'right', cb: () => void) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSlideDir(dir);
    setTimeout(() => {
      cb();
      setIsAnimating(false);
    }, 200);
  }, [isAnimating]);

  const handleNext = useCallback(() => {
    if (step < TUTORIAL_STEPS.length - 1) {
      animateTransition('right', () => setStep(s => s + 1));
    } else {
      setExiting(true);
      localStorage.setItem('game-tutorial-seen', 'true');
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'starmap' }));
      setTimeout(onComplete, 400);
    }
  }, [step, onComplete, animateTransition]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      animateTransition('left', () => setStep(s => s - 1));
    }
  }, [step, animateTransition]);

  const handleSkip = useCallback(() => {
    setExiting(true);
    localStorage.setItem('game-tutorial-seen', 'true');
    window.dispatchEvent(new CustomEvent('change-active-view', { detail: 'starmap' }));
    setTimeout(onComplete, 400);
  }, [onComplete]);

  // Synchronize dynamic view and tab switching with tutorial step
  useEffect(() => {
    if (current) {
      if (current.activeView) {
        window.dispatchEvent(new CustomEvent('change-active-view', { detail: current.activeView }));
      }
      if (current.inspectorTab) {
        window.dispatchEvent(new CustomEvent('tutorial:set-tab', { detail: current.inspectorTab }));
      } else {
        window.dispatchEvent(new CustomEvent('tutorial:close-drawer'));
      }
      if (current.govTab) {
        window.dispatchEvent(new CustomEvent('tutorial:set-gov-tab', { detail: current.govTab }));
      }
      // Close legacy modal overlay to prevent blocking screen on step transitions
      try {
        const modal = document.getElementById('modal-container');
        if (modal) {
          modal.classList.add('hidden');
        }
      } catch (e) {
        console.error("Failed to dismiss legacy modal:", e);
      }
    }
  }, [current]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleSkip]);

  const handleGoTo = useCallback((index: number) => {
    if (index === step) return;
    animateTransition(index > step ? 'right' : 'left', () => setStep(index));
  }, [step, animateTransition]);

  const categories = TUTORIAL_STEPS.reduce<{name: string; startIdx: number; count: number}[]>((acc, s, i) => {
    if (acc.length === 0 || acc[acc.length - 1].name !== s.category) {
      acc.push({ name: s.category, startIdx: i, count: 1 });
    } else {
      acc[acc.length - 1].count++;
    }
    return acc;
  }, []);

  const showHighlight = highlightRect !== null;

  // Calculate dynamic card styling to avoid blocking the highlighted element
  const getCardStyle = (): React.CSSProperties => {
    if (!current || !showHighlight || !highlightRect) {
      return {
        position: 'relative',
        maxWidth: '640px',
        width: windowWidth < 768 ? 'calc(100% - 24px)' : '100%',
      };
    }

    // Landscape mobile phone/short viewport adjustment (height < 500px)
    if (windowHeight < 500) {
      let isTargetOnLeft = false;
      if (highlightRect) {
        const highlightCenterX = highlightRect.left + highlightRect.width / 2;
        isTargetOnLeft = highlightCenterX < windowWidth / 2;
      } else {
        isTargetOnLeft = true; // Default to right side if no highlight
      }

      return {
        position: 'absolute',
        top: '12px',
        bottom: '12px',
        ...(isTargetOnLeft 
          ? { right: '12px', left: 'auto' } 
          : { left: '12px', right: 'auto' }
        ),
        width: '320px',
        margin: 0,
        maxHeight: 'calc(100vh - 24px)',
        overflowY: 'auto'
      };
    }

    // Adapt layout for mobile/tablet screens (< 768px) to prevent blocking the highlighted button
    if (windowWidth < 768) {
      const highlightCenterY = highlightRect.top + highlightRect.height / 2;
      const isUpperHalf = highlightCenterY < windowHeight / 2;

      return {
        position: 'absolute',
        left: '12px',
        right: '12px',
        width: 'calc(100% - 24px)',
        margin: 0,
        maxWidth: 'none',
        // Place the card on the opposite half of the highlighted area to avoid overlap
        ...(isUpperHalf 
          ? { bottom: '12px', top: 'auto', transform: 'none' } 
          : { top: '12px', bottom: 'auto', transform: 'none' }
        )
      };
    }

    const pos = current.cardPosition || 'center';

    if (pos === 'left') {
      return {
        position: 'absolute',
        left: '40px',
        top: '50%',
        transform: 'translateY(-50%)',
        margin: 0,
        maxWidth: '640px',
      };
    }
    if (pos === 'right') {
      return {
        position: 'absolute',
        right: '40px',
        top: '50%',
        transform: 'translateY(-50%)',
        margin: 0,
        maxWidth: '640px',
      };
    }
    if (pos === 'bottom') {
      return {
        position: 'absolute',
        bottom: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        margin: 0,
        maxWidth: '640px',
      };
    }
    if (pos === 'top') {
      return {
        position: 'absolute',
        top: '40px',
        left: '50%',
        transform: 'translateX(-50%)',
        margin: 0,
        maxWidth: '640px',
      };
    }

    return {
      position: 'relative',
      maxWidth: '640px',
    };
  };

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none transition-all duration-400 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* SVG backdrop overlay replaced by 4 absolute-positioned divs to support click-through cutouts */}
      {showHighlight && highlightRect ? (
        <div className="absolute inset-0 pointer-events-none z-[1000]">
          {/* Top backdrop */}
          <div 
            data-testid="tutorial-overlay-top"
            className="absolute bg-[#050810]/65 pointer-events-auto transition-all duration-300"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: `${highlightRect.top}px`,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          {/* Bottom backdrop */}
          <div 
            data-testid="tutorial-overlay-bottom"
            className="absolute bg-[#050810]/65 pointer-events-auto transition-all duration-300"
            style={{
              top: `${highlightRect.top + highlightRect.height}px`,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          {/* Left backdrop */}
          <div 
            data-testid="tutorial-overlay-left"
            className="absolute bg-[#050810]/65 pointer-events-auto transition-all duration-300"
            style={{
              top: `${highlightRect.top}px`,
              height: `${highlightRect.height}px`,
              left: 0,
              width: `${highlightRect.left}px`,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          {/* Right backdrop */}
          <div 
            data-testid="tutorial-overlay-right"
            className="absolute bg-[#050810]/65 pointer-events-auto transition-all duration-300"
            style={{
              top: `${highlightRect.top}px`,
              height: `${highlightRect.height}px`,
              left: `${highlightRect.left + highlightRect.width}px`,
              right: 0,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        </div>
      ) : (
        /* Full-screen solid backdrop when no element is highlighted */
        !showHighlight && (
          <div 
            data-testid="tutorial-overlay-full"
            className="absolute inset-0 bg-[#050810]/85 pointer-events-auto z-[1000]"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        )
      )}

      {/* Highlight glow outline box */}
      {showHighlight && highlightRect && (
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

      {/* Pointer Arrow - points from below (pointing up) if the target is close to the top of the viewport */}
      {showHighlight && highlightRect && (() => {
        const pointFromBelow = highlightRect.top <= 60;
        return (
          <div 
            className="absolute z-[1002] pointer-events-none transition-all duration-300 animate-bounce"
            style={{
              top: pointFromBelow 
                ? `${highlightRect.top + highlightRect.height + 4}px` 
                : `${highlightRect.top - 20}px`,
              left: `${highlightRect.left + highlightRect.width / 2 - 10}px`,
              width: 0,
              height: 0,
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              ...(pointFromBelow 
                ? { borderBottom: '10px solid var(--color-primary)' } 
                : { borderTop: '10px solid var(--color-primary)' }
              ),
              filter: 'drop-shadow(0 2px 5px rgba(0,229,255,0.5))',
              transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          />
        );
      })()}

      {/* Main tutorial card */}
      <div 
        style={getCardStyle()} 
        className={`relative z-[1002] w-full mx-auto flex flex-col max-h-[58vh] md:max-h-none pointer-events-auto transition-all duration-300 ${exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
      >
        {/* Progress bar */}
        <div className="w-full h-1 bg-[#243245]/40 rounded-t overflow-hidden shrink-0">
          <div 
            className="h-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content card */}
        <div className="relative bg-[#070B14]/90 backdrop-blur-md border border-[var(--color-primary)]/30 rounded-b p-4 sm:p-8 flex flex-col gap-3 sm:gap-6 overflow-hidden flex-1 min-h-0 shadow-[0_0_40px_rgba(0,184,255,0.15)]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[var(--color-primary)]/10 border-x border-b border-[var(--color-primary)]/30 px-4 py-0.5 rounded-b text-[10px] text-[var(--color-primary)] font-bold tracking-[0.2em] uppercase shadow-[0_0_10px_rgba(0,184,255,0.2)]">
            光锥之外·纪元往事
          </div>

          {/* Holographic scanner grids */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary),transparent_1px),linear-gradient(to_bottom,var(--color-primary),transparent_1px)] bg-[size:24px_24px] opacity-[0.02]" />
            <div className="w-full h-[1px] bg-[var(--color-primary)]/20 shadow-[0_0_15px_var(--color-primary)] absolute top-0 animate-[portrait-scan_3s_linear_infinite]" />
          </div>

          {/* Glow corner decorations */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-primary)]/50 z-10" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-primary)]/50 z-10" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-primary)]/50 z-10" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-primary)]/50 z-10" />

          {/* Skip button */}
          <button onClick={handleSkip} className="tutorial-modal-close-btn absolute top-5 right-5 text-[var(--text-secondary)] hover:text-white transition-colors z-20 cursor-pointer p-1">
            <X size={16} />
          </button>

          {windowWidth >= 768 ? (
            /* DESKTOP SIDEBAR CHAPTER LAYOUT */
            <div className="flex flex-row gap-6 w-full h-full min-h-0 z-10" data-testid="tutorial-categories-vertical">
              {/* Left sidebar for chapters */}
              <div className="flex flex-col gap-2 overflow-y-auto scrollbar-none w-[140px] shrink-0 border-r border-[#243245]/30 pr-4 select-none">
                <div className="text-[9px] font-title font-bold text-[var(--color-primary)]/85 uppercase tracking-[0.2em] mb-2 px-1">章节目录</div>
                <div className="flex flex-col gap-1.5 overflow-y-auto scrollbar-none">
                  {categories.map((cat, ci) => {
                    const isActive = step >= cat.startIdx && step < cat.startIdx + cat.count;
                    return (
                      <button 
                        key={ci}
                        onClick={() => handleGoTo(cat.startIdx)}
                        className={`text-[10px] font-title font-bold uppercase tracking-widest px-2.5 py-2 border transition-all cursor-pointer text-left w-full ${
                          isActive 
                            ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] shadow-[inset_0_0_10px_rgba(0,184,255,0.2)]' 
                            : 'border-transparent text-[var(--text-secondary)]/60 hover:text-white bg-white/5'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right content column */}
              <div className="flex-1 flex flex-col gap-4 min-w-0 min-h-0 justify-between">
                {/* Header: Icon + Title + Counter */}
                <div className="flex items-center justify-between border-b border-[#243245]/40 pb-3 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30 flex items-center justify-center text-[var(--color-primary)] shrink-0 shadow-[0_0_15px_rgba(0,184,255,0.1)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)]/10 to-transparent opacity-50" />
                      {current.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Flag className="w-2.5 h-2.5 text-[var(--color-primary)]/60" />
                        <div className="text-[9px] font-mono font-bold text-[var(--color-primary)]/80 uppercase tracking-[0.2em]">{current.category}</div>
                      </div>
                      <h2 className="text-base font-title font-black text-white tracking-widest leading-none drop-shadow-md">{current.title}</h2>
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--color-primary)]/60 font-mono font-bold tracking-wider select-none">
                    {step + 1} / {TUTORIAL_STEPS.length}
                  </span>
                </div>

                {/* Content body */}
                <div className="flex-grow overflow-y-auto min-h-0 flex flex-col gap-3 pr-1 scrollbar-none">
                  <div className={`font-sans text-xs bg-black/20 p-4 border-l-2 border-[var(--color-primary)]/40 shrink-0`}>
                    <p className="text-[var(--text-secondary)] leading-[1.7] whitespace-pre-line">
                      {current.description}
                    </p>
                  </div>
                  {current.tips && current.tips.length > 0 && (
                    <div className="bg-[#070B14]/60 border border-amber-500/20 p-3.5 shrink-0">
                      <div className="flex items-center gap-2 text-[10px] font-title font-bold text-amber-500/90 uppercase tracking-widest mb-1.5">
                        <Lightbulb size={11} className="shrink-0" />
                        系统提示分析
                      </div>
                      <ul className="space-y-1">
                        {current.tips.map((tip, idx) => (
                          <li key={idx} className="text-xs text-amber-500/70 flex items-start gap-2">
                            <span className="text-[9px] opacity-50 font-mono select-none relative top-[1px]">{'>'}</span>
                            <span className="leading-relaxed">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-[#243245]/40 shrink-0">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handlePrev}
                      disabled={step === 0}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${step === 0 ? 'opacity-30 cursor-not-allowed text-[var(--text-secondary)]' : 'text-white hover:text-[var(--color-primary)]'}`}
                    >
                      <ChevronLeft size={14} /> 上一步
                    </button>
                    <button 
                      onClick={handleSkip}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer text-[var(--text-secondary)] hover:text-white"
                    >
                      跳过教程
                    </button>
                  </div>
                  <button 
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/50 text-[var(--color-primary)] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,184,255,0.15)] hover:shadow-[0_0_20px_rgba(0,184,255,0.3)]"
                  >
                    {step === TUTORIAL_STEPS.length - 1 ? '确认授权并开始' : '下一步'} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* MOBILE LAYOUT */
            <div className="flex flex-col gap-3 flex-grow min-h-0 z-10" data-testid="tutorial-categories-horizontal">
              {/* Chapter navigation */}
              <div className="flex items-center justify-between gap-3 select-none relative border-b border-[#243245]/40 pb-3 shrink-0">
                <div className="flex-grow flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
                  {categories.map((cat, ci) => {
                    const isActive = step >= cat.startIdx && step < cat.startIdx + cat.count;
                    return (
                      <button 
                        key={ci}
                        onClick={() => handleGoTo(cat.startIdx)}
                        className={`text-[10px] font-title font-bold uppercase tracking-widest px-2.5 py-1 border transition-all cursor-pointer shrink-0 ${
                          isActive 
                            ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] shadow-[inset_0_0_10px_rgba(0,184,255,0.2)]' 
                            : 'border-transparent text-[var(--text-secondary)]/60 hover:text-white bg-white/5'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-[var(--color-primary)]/60 font-mono font-bold tracking-wider shrink-0 select-none pb-1">
                  {step + 1} / {TUTORIAL_STEPS.length}
                </span>
              </div>

              {/* Icon + Title */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-12 h-12 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30 flex items-center justify-center text-[var(--color-primary)] shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)]/10 to-transparent opacity-50" />
                  {current.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Flag className="w-2.5 h-2.5 text-[var(--color-primary)]/60" />
                    <div className="text-[9px] font-mono font-bold text-[var(--color-primary)]/80 uppercase tracking-[0.2em]">{current.category}</div>
                  </div>
                  <h2 className="text-base font-title font-black text-white tracking-widest leading-none">{current.title}</h2>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-grow overflow-y-auto min-h-0 flex flex-col gap-3 pr-1 scrollbar-none">
                <div className="font-sans text-xs bg-black/20 p-3 border-l-2 border-[var(--color-primary)]/40 shrink-0">
                  <p className="text-[var(--text-secondary)] leading-[1.6] whitespace-pre-line">
                    {current.description}
                  </p>
                </div>
                {current.tips && current.tips.length > 0 && (
                  <div className="bg-[#070B14]/60 border border-amber-500/20 p-3 shrink-0">
                    <div className="flex items-center gap-2 text-[10px] font-title font-bold text-amber-500/90 uppercase tracking-widest mb-1.5">
                      <Lightbulb size={12} className="shrink-0" />
                      系统提示分析
                    </div>
                    <ul className="space-y-1">
                      {current.tips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-amber-500/70 flex items-start gap-2">
                          <span className="text-[10px] opacity-50 font-mono select-none">{'>'}</span>
                          <span className="leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-[#243245]/40 shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handlePrev}
                    disabled={step === 0}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${step === 0 ? 'opacity-30 cursor-not-allowed text-[var(--text-secondary)]' : 'text-white hover:text-[var(--color-primary)]'}`}
                  >
                    <ChevronLeft size={16} /> 上一步
                  </button>
                  <button 
                    onClick={handleSkip}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer text-[var(--text-secondary)] hover:text-white"
                  >
                    跳过
                  </button>
                </div>
                <button 
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/50 text-[var(--color-primary)] text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  {step === TUTORIAL_STEPS.length - 1 ? '开始' : '下一步'} <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes border-pulse {
          0% {
            border-color: rgba(0, 229, 255, 0.4);
            box-shadow: 0 0 8px rgba(0, 229, 255, 0.25), inset 0 0 6px rgba(0, 229, 255, 0.1);
          }
          100% {
            border-color: rgba(0, 229, 255, 1);
            box-shadow: 0 0 20px rgba(0, 229, 255, 0.65), inset 0 0 15px rgba(0, 229, 255, 0.3);
          }
        }
      `}</style>
    </div>
  );
};