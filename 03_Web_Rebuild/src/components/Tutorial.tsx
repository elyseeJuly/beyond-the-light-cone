import React, { useState, useCallback, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, X, Shield, Rocket, 
  Building2, Cpu, TrendingUp, 
  Star,
  BookOpen, Lightbulb, Trophy, AlertOctagon, Clock, Crosshair, Landmark, Lock, Flag
} from 'lucide-react';
import { ActiveViewType } from './LeftHub';

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
  tips?: string[];
  highlightArea?: 'top' | 'left' | 'center' | 'right' | 'none';
  activeView: ActiveViewType;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  // ===== 第一章：欢迎与世界观 =====
  {
    icon: <Lock size={32} />,
    title: '档案访问授权确认',
    category: '序章',
    description: '权限验证通过。欢迎您，文明执政官。\n\n公元 2XXX 年，三体文明发现了地球的存在。作为地球防卫理事会最高指挥官，你将在黑暗森林法则的阴影下，带领人类文明穿越六大纪元。\n在这座银河文明档案馆中，你的每一个决策都将书写人类文明的历史。',
    highlightArea: 'none',
    activeView: 'starmap',
  },
  {
    icon: <Clock size={32} />,
    title: '历史纪元演进',
    category: '序章',
    description: '文明档案记录了六个宏大纪元，每个纪元都有独特的挑战与危机：\n\n• 危机纪元（第1-200年）— 面临智子封锁与生存危机\n• 威慑纪元（第201-260年）— 执剑人建立黑暗森林威慑\n• 广播纪元（第261-300年）— 坐标暴露，应对黑暗森林打击\n• 掩体纪元（第301-350年）— 太阳系最后的防御建设窗口\n• 银河纪元（第351年起）— 逃亡星海，成为星舰文明\n• 星屑纪元（尾声）— 宇宙降维崩塌中的最后火种',
    highlightArea: 'top',
    activeView: 'starmap',
    tips: ['纪元会随文明发展进度与年份自动推进', '不同纪元会解锁不同的事件与科技路线'],
  },

  // ===== 第二章：战略星图与基础操作 =====
  {
    icon: <Star size={32} />,
    title: '战略星图观测仪',
    category: '战略指挥',
    description: '欢迎进入高维星图全息投影。这里展示了人类的势力范围与深空星天：\n\n• 🟡 发光天体 = 恒星（如太阳）\n• 🔵 蓝色光环 = 人类控制区/己方势力\n• 🔴 红色光环 = 异星文明占领区（如三体）\n• ⚪ 灰色光环 = 无主星系，可派遣舰队开发\n\n操作方式：使用鼠标滚轮缩放星图，长按左键拖拽调整视角。',
    highlightArea: 'center',
    activeView: 'starmap',
    tips: ['研究航天学相关科技可以扩大观测视野', '被占领星系的脉冲环颜色代表归属权'],
  },
  {
    icon: <TrendingUp size={32} />,
    title: '行星指令开发终端',
    category: '战略指挥',
    description: '【手把手指令 ①】：\n现在，请跟随指引点击星图中央的「地球」星球。\n\n右侧的战略开发面板将立即开启：\n• 查看资源储量、人口规模与设施\n• 下达具体的建设授权指令\n\n⚠️ 开局至关重要的一步：点击右侧的「采矿场」进行建设！有了矿产资源，后续才能建造工厂、积累经济。',
    highlightArea: 'right',
    activeView: 'starmap',
    tips: ['必须先点击星图中的某个恒星/行星，右侧才会出现开发面板', '右下角的「下一回合」按钮是推进年份的唯一方式'],
  },

  // ===== 第三章：内政管理与科学技术 =====
  {
    icon: <Landmark size={32} />,
    title: '内阁政府管理中枢',
    category: '内政管理',
    description: '【手把手指令 ②】：\n系统已为您自动打开「政府」管理界面。\n\n在这里，您可以行使最高统帅权：\n• 任命科学、国防、文化、社会部长以获取各种产出加成\n• 指派面壁者秘密策划，应对三体危机\n\n⚠️ 开局提示：在第一回合迅速指派各部门官员，可以让您的产出速度提升一倍以上！',
    highlightArea: 'center',
    activeView: 'government',
    tips: ['官员拥有不同的属性，Science 影响研发，Leadership 影响威慑与军事', '任命官员不会消耗本回合时间'],
  },
  {
    icon: <Cpu size={32} />,
    title: '科学技术解码中心',
    category: '内政管理',
    description: '【手把手指令 ③】：\n系统已为您切换至「科技研发」面板。\n\n物理学、航天学、信息学等五大科技树是文明的第二生命：\n• 🔬 基础科学（如量子计算、曲率驱动）决定文明上限\n• ⚔️ 战争科技（如恒星级战舰、黑暗森林打击）保障安全\n\n⚠️ 执政警告：智子对人类的基础物理进行了锁死！我们需要率先研发“550W量子计算机”等关键技术，降低智子的研究封锁惩罚。',
    highlightArea: 'center',
    activeView: 'techtree',
    tips: ['未任命科学部长时，科研效率将极其低下', '研发高级科技需要对应的前置物理学突破'],
  },
  {
    icon: <Shield size={32} />,
    title: '黑暗森林防备体系',
    category: '外御备战',
    description: '【手把手指令 ④】：\n系统再次将视角拉回「政府」中枢的防备区域。\n\n面对外星文明的生存挤压，您必须建立强大的防御与阻断体系：\n• 面壁者：每回合静默积攒威慑度与军备\n• 执剑人：握有核阻断剑柄的终极威慑者\n\n⚠️ 执政法则：高威慑值能逼退敌意文明的入侵。威慑的成败不仅取决于威慑度数值，更取决于执剑人的 Leadership 属性！一旦威慑失效，太阳系将面临灭顶之灾！',
    highlightArea: 'center',
    activeView: 'government',
    tips: ['威慑纪元来临时，必须慎重选择接任的执剑人', '一旦进入威慑，失去兽性将失去一切'],
  },
  {
    icon: <Crosshair size={32} />,
    title: '深空外交监测网络',
    category: '外御备战',
    description: '【手把手指令 ⑤】：\n系统已为您连接到「情报中心」的外星电波信道。\n\n在这里，宇宙的冷酷与利益交织展现：\n• 监测三体文明、歌者、归零者等宇宙文明的动态\n• 展开跨星际沟通：谈判（提升关系）、贸易（互换资源）或共同缔结结盟\n\n🎯 谈判技巧：当与其他文明的关系达到“亲密”时，可以尝试申请结盟。将全部存活文明消亡或全数纳为盟友，将达成伟大的“征服大同”胜利。',
    highlightArea: 'center',
    activeView: 'intelligence',
    tips: ['关系过于恶劣的外星文明将拒绝接受任何贸易提案', '在实力薄弱时，依靠结盟外交是求生的不二法门'],
  },
  {
    icon: <Building2 size={32} />,
    title: '文明稳定维系法则',
    category: '生存危机',
    description: '系统已将您的视角还原到主星图。请将视线移到顶部 HUD 指标区。\n\n🏛 文明稳定度是您执政的生命线：\n• 它由您的 经济能力、军事规模、科技研发度 以及 文化产出 四大维度加权决定\n• 🚨 惩罚因子：当文明内部积攒了过高的「逃亡倾向」时，社会秩序失控，稳定度会遭到沉重处罚！\n\n稳定度一旦降为 0%，您的本局游戏将立即宣告失败。请通过社会保障和文化建设，随时抚平社会的恐慌。',
    highlightArea: 'top',
    activeView: 'starmap',
    tips: ['经济崩溃或军事大败会直接腰斩文明稳定度', '社会与文化部长的 Art 属性可以用来平复逃亡倾向'],
  },
  {
    icon: <Rocket size={32} />,
    title: '授权通过：执政官生存法则',
    category: '最终指示',
    description: '手把手操作演示完毕，您的执政官权限已全面激活。在踏入黑暗森林之前，请牢记这十步生存守则：\n\n① 在地球建设「采矿场」积累原始矿产\n② 建设「工厂」将矿产转化为经济收入\n③ 在政府中任命四个部门的执掌官员\n④ 任命至少两名面壁者，积攒防御实力\n⑤ 任命一位高领导力的执剑人建立威慑盾牌\n⑥ 研发航天技术，向火星建立第二采矿基地\n⑦ 不要在无前置矿场时连续建造工厂，防止资源枯竭\n⑧ 随时关注稳定度跌幅，任命合适的官员疏导逃亡主义\n⑨ 太阳系打击降临时，依靠“掩体太空城”疏散人口\n⑩ 合理利用情报中心与异星斡旋。\n\n愿人类的荣光在黑暗森林中永不熄灭，执政官！',
    highlightArea: 'none',
    activeView: 'starmap',
  },
];



export const Tutorial: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [, setSlideDir] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);

  const current = TUTORIAL_STEPS[step];
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

  // Synchronize dynamic view switching with tutorial step
  useEffect(() => {
    if (current && current.activeView) {
      window.dispatchEvent(new CustomEvent('change-active-view', { detail: current.activeView }));
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

  // Group steps by category for the chapter nav
  const categories = TUTORIAL_STEPS.reduce<{name: string; startIdx: number; count: number}[]>((acc, s, i) => {
    if (acc.length === 0 || acc[acc.length - 1].name !== s.category) {
      acc.push({ name: s.category, startIdx: i, count: 1 });
    } else {
      acc[acc.length - 1].count++;
    }
    return acc;
  }, []);

  // Highlight overlay
  const highlightStyle = current.highlightArea && current.highlightArea !== 'none' ? {
    top: current.highlightArea === 'top' ? 'inset-x-0 top-0 h-[72px]' : undefined,
    left: current.highlightArea === 'left' ? 'left-0 top-[72px] bottom-0 w-[240px]' : undefined,
    center: current.highlightArea === 'center' ? 'left-[240px] top-[72px] bottom-0 right-[320px]' : undefined,
    right: current.highlightArea === 'right' ? 'right-0 top-[72px] bottom-0 w-[320px]' : undefined,
  } : null;
  const activeHighlight = highlightStyle ? highlightStyle[current.highlightArea as keyof typeof highlightStyle] : null;

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center transition-all duration-400 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Darkened background with highlight cutout */}
      {!activeHighlight && <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />}
      
      {/* Highlight glow */}
      {activeHighlight && (
        <div 
          className={`absolute ${activeHighlight} border-2 border-[var(--color-primary)] z-[1001] pointer-events-none transition-all duration-500`}
          style={{
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.85), 0 0 30px rgba(0,229,255,0.3), inset 0 0 30px rgba(0,229,255,0.1)',
          }}
        />
      )}

      {/* Main tutorial card */}
      <div className={`relative z-[1002] w-full max-w-2xl mx-4 flex flex-col transition-all duration-300 ${exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-[#243245]/40 rounded-t overflow-hidden">
          <div 
            className="h-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content card */}
        <div className="relative bg-[#070B14]/90 backdrop-blur-md border border-[var(--color-primary)]/30 rounded-b p-8 flex flex-col gap-6 overflow-hidden shadow-[0_0_40px_rgba(0,184,255,0.15)]">
          
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

          {/* Chapter navigation */}
          <div className="flex flex-wrap items-center gap-2 select-none relative z-10 border-b border-[#243245]/40 pb-4">
            {categories.map((cat, ci) => {
              const isActive = step >= cat.startIdx && step < cat.startIdx + cat.count;
              return (
                <button 
                  key={ci}
                  onClick={() => handleGoTo(cat.startIdx)}
                  className={`text-[10px] font-title font-bold uppercase tracking-widest px-3 py-1.5 border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] shadow-[inset_0_0_10px_rgba(0,184,255,0.2)]' 
                      : 'border-transparent text-[var(--text-secondary)]/60 hover:text-white bg-white/5'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
            <div className="flex-1" />
            <span className="text-[10px] text-[var(--color-primary)]/60 font-mono font-bold tracking-wider">
              {step + 1} / {TUTORIAL_STEPS.length}
            </span>
          </div>

          {/* Icon + Title */}
          <div className={`flex items-center gap-5 transition-all duration-300 z-10 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
            <div className="w-14 h-14 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30 flex items-center justify-center text-[var(--color-primary)] shrink-0 shadow-[0_0_15px_rgba(0,184,255,0.1)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-primary)]/10 to-transparent opacity-50" />
              {current.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flag className="w-3 h-3 text-[var(--color-primary)]/60" />
                <div className="text-[10px] font-mono font-bold text-[var(--color-primary)]/80 uppercase tracking-[0.2em]">{current.category}</div>
              </div>
              <h2 className="text-xl font-title font-black text-white tracking-widest leading-none drop-shadow-md">{current.title}</h2>
            </div>
          </div>

          {/* Description */}
          <div className={`transition-all duration-300 delay-75 z-10 ${isAnimating ? 'opacity-0' : 'opacity-100'} font-sans text-sm bg-black/20 p-5 border-l-2 border-[var(--color-primary)]/40`}>
            <p className="text-[var(--text-secondary)] leading-[1.8] whitespace-pre-line">
              {current.description}
            </p>
          </div>

          {/* Tips */}
          {current.tips && current.tips.length > 0 && (
            <div className={`bg-[#070B14]/60 border border-amber-500/20 p-4 transition-all duration-300 delay-150 z-10 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center gap-2 text-[10px] font-title font-bold text-amber-500/90 uppercase tracking-widest mb-2.5">
                <Lightbulb size={12} className="shrink-0" />
                系统提示分析
              </div>
              <ul className="space-y-1.5">
                {current.tips.map((tip, idx) => (
                  <li key={idx} className="text-xs text-amber-500/70 flex items-start gap-2">
                    <span className="text-[10px] opacity-50 font-mono select-none relative top-[1px]">{'>'}</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Controls */}
          <div className={`flex items-center justify-between mt-2 pt-5 border-t border-[#243245]/40 transition-opacity duration-300 z-10 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrev}
                disabled={step === 0}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${step === 0 ? 'opacity-30 cursor-not-allowed text-[var(--text-secondary)]' : 'text-white hover:text-[var(--color-primary)]'}`}
              >
                <ChevronLeft size={16} /> 上一步
              </button>
              
              <button 
                onClick={handleSkip}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-[var(--text-secondary)] hover:text-white"
              >
                跳过教程
              </button>
            </div>

            <button 
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 border border-[var(--color-primary)]/50 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(0,184,255,0.15)] hover:shadow-[0_0_20px_rgba(0,184,255,0.3)]"
            >
              {step === TUTORIAL_STEPS.length - 1 ? '确认授权并开始' : '下一步'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};