import React, { useState, useCallback, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, X, Shield, Rocket, 
  Building2, Cpu, TrendingUp, 
  Star,
  BookOpen, Lightbulb, Trophy, AlertOctagon, Clock, Crosshair, Landmark, Lock, Flag
} from 'lucide-react';

interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
  tips?: string[];
  highlightArea?: 'top' | 'left' | 'center' | 'right' | 'none';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  // ===== 第一章：欢迎与世界观 =====
  {
    icon: <Lock size={32} />,
    title: '档案访问授权确认',
    category: '序章',
    description: '权限验证通过。欢迎您，文明执政官。\n\n公元 2XXX 年，三体文明发现了地球的存在。作为地球防卫理事会最高指挥官，你将在黑暗森林法则的阴影下，带领人类文明穿越六大纪元。\n在这座银河文明档案馆中，你的每一个决策都将书写人类文明的历史。',
    highlightArea: 'none',
  },
  {
    icon: <Clock size={32} />,
    title: '历史纪元演进',
    category: '序章',
    description: '文明档案记录了六个宏大纪元，每个纪元都有独特的挑战与危机：\n\n• 危机纪元（第1-200年）— 面临智子封锁与生存危机\n• 威慑纪元（第201-260年）— 执剑人建立黑暗森林威慑\n• 广播纪元（第261-300年）— 坐标暴露，应对黑暗森林打击\n• 掩体纪元（第301-350年）— 太阳系最后的防御建设窗口\n• 银河纪元（第351年起）— 逃亡星海，成为星舰文明\n• 星屑纪元（尾声）— 宇宙降维崩塌中的最后火种',
    highlightArea: 'top',
    tips: ['纪元会随文明发展进度与年份自动推进', '不同纪元会解锁不同的事件与科技路线'],
  },

  // ===== 第二章：界面导览 =====
  {
    icon: <Landmark size={32} />,
    title: '顶部统御中枢',
    category: '档案馆导览',
    description: '屏幕顶部是你的核心指挥枢纽，实时显示文明的生存状态：\n\n🏛 文明稳定度 — 最核心指标，综合考量了经济、文化、科技与军力。稳定度若降为零，文明将直接崩溃！\n👥 人口 — 工人来源，影响所有产出\n💎 资源 — 原材料，开采自星球矿场\n🛡 军力 — 防御与进攻的基础力量\n⚠️ 威慑度 — 震慑外星文明的核心指标\n\n点击“稳定度”面板可查看经济、文化、科技研发度与逃亡主义的具体指数。',
    highlightArea: 'top',
    tips: ['逃亡系数过高会严重拖累文明稳定度', '每回合各类数值变化会以浮动数字提示'],
  },
  {
    icon: <BookOpen size={32} />,
    title: '左侧档案索引',
    category: '档案馆导览',
    description: '左侧面板是文明档案馆的核心索引，包含六个关键系统：\n\n🗺 战略星图 — 俯瞰已知宇宙与殖民情况\n📡 情报中心 — 监测外星文明动向与外交状态\n🖥 科技研发 — 解锁五大科技树的未来技术\n🏛 政府枢纽 — 任命面壁者与各部门部长\n📜 岁月史书 — 查阅当前运行周期的详细事件编年史\n🏛 博物馆 — 检阅平行宇宙中已达成的结局与成就',
    highlightArea: 'left',
    tips: ['不同界面的切换不会消耗回合数', '在“政府”中任命部长能大幅提升对应领域的产出率'],
  },
  {
    icon: <Star size={32} />,
    title: '战略星图观测仪',
    category: '档案馆导览',
    description: '中央区域是高维星图全息投影，展示太阳系及深空天体：\n\n• 🟡 发光大球 = 恒星（如太阳）\n• 🔵 蓝色光环 = 地球文明控制区\n• 🔴 红色光环 = 异星文明占领区\n• ⚪ 灰色光环 = 探测到的无主星球\n\n操作方式：\n• 鼠标悬停 — 显示星球名称与简报\n• 点击星球 — 在右侧终端查看详细开发指令\n• 滚轮缩放 — 调整星图投影焦距',
    highlightArea: 'center',
    tips: ['研发航天学“远镜望远”相关科技可扩展探测视野', '殖民地会产生动态归属标识'],
  },
  {
    icon: <TrendingUp size={32} />,
    title: '详细指令终端',
    category: '档案馆导览',
    description: '右侧终端用于下达具体的行星开发指令：\n\n📋 状态简报 — 点击星球后显示其资源储量、人口规模与设施状况\n🏗 建设授权 — 在己方领土可建造采矿场、工厂或太空城\n📜 历史日志 — 实时滚动的重大战略记录与警报\n\n右下角的「下一回合」按钮是推进历史时间线的唯一途径。',
    highlightArea: 'right',
    tips: ['所有建设工程均需消耗经济点，并耗费数年完工', '日志中的红色高亮条目通常代表严重危机'],
  },

  // ===== 第三章：核心玩法 =====
  {
    icon: <Building2 size={32} />,
    title: '基础维系原理',
    category: '执政法则',
    description: '维持高「文明稳定度」的关键在于三大工种的协同：\n\n⛏ 矿工 — 从星球深处开采原始资源\n🏭 工人 — 在工厂将资源转化为经济\n🎨 文化工 — 提升文化底蕴，维系社会凝聚力\n\n系统会自动按比例分配人口（默认各三分之一）。\n\n⚠️ 执政警告：工厂生产必须消耗资源，一旦资源枯竭，经济链将瞬间断裂！请务必先建设「采矿场」，再建设「工厂」。',
    highlightArea: 'none',
    tips: ['星球开发顺序：采矿场 ➔ 工厂 ➔ 太空城市', '太空城市用于突破自然环境的人口上限瓶颈'],
  },
  {
    icon: <Cpu size={32} />,
    title: '科技树解析',
    category: '执政法则',
    description: '文明的跃迁依赖五大科研领域的突破：\n\n🔬 物理学 — 智子工程、维度打击等基础真理\n🚀 航天学 — 行星发动机、曲率驱动\n⚔️ 军事学 — 恒星级战舰、黑暗森林打击系统\n💻 信息学 — 数字生命、思想钢印、量子计算\n🌌 星际学 — 宇宙社会学、掩体工程、黑域生成\n\n研发速度由相关部门长官的 Science 属性决定。科技进度在稳定度中占有重要权重。',
    highlightArea: 'none',
    tips: ['智子封锁期间，基础物理研究效率将惨遭腰斩', '率先研发“550W量子计算机”可一定程度抵消智子的干扰'],
  },
  {
    icon: <Shield size={32} />,
    title: '黑暗森林威慑',
    category: '执政法则',
    description: '为了在冷酷的黑暗森林中幸存，必须建立威慑系统：\n\n🧑‍💼 统御面壁者\n面壁者在暗中策划，每回合自动积攒威慑度与军备。\n\n⚔️ 执剑人（剑柄持有者）\n执剑人的 Leadership 属性直接决定威慑生效的概率。高威慑度将迫使带有敌意的异星文明暂停攻击步伐。\n\n⚠️ 如果只攒威慑度而没有强大的执剑人，或者威慑度归零，文明将毫无防护！',
    highlightArea: 'left',
    tips: ['挑选高 Leadership 和 Art 的领袖担任面壁者与执剑人', '一旦进入威慑纪元，执剑人的职责将重于泰山'],
  },
  {
    icon: <Crosshair size={32} />,
    title: '异星接触法则',
    category: '执政法则',
    description: '宇宙中潜伏着多个异星文明（如三体、歌者等），它们遵循不同的 AI 逻辑：\n\n🎯 猎手型 — 极具侵略性，需高威慑力震慑\n🧹 清理者型 — 攻击频率低但手段具有毁灭性（如光粒）\n📡 机会主义型 — 欺软怕硬，伺机而动\n🌍 扩张主义型 — 热衷于抢占无主星系\n\n通过「情报中心」可进行跨星际沟通：谈判（提升关系）、贸易（资源互换）或缔结同盟。',
    highlightArea: 'none',
    tips: ['结盟需关系达到“亲密”', '所有文明消亡或全数结盟即可达成大一统胜利'],
  },

  // ===== 第四章：胜利条件 =====
  {
    icon: <Trophy size={32} />,
    title: '文明命运分歧点',
    category: '文明归宿',
    description: '历史档案记录了六种人类文明的终极归宿：\n\n🏆 征服大同 — 肃清或结盟所有已知外星文明\n🛡 威慑堡垒 — 稳居威慑纪元，维持平衡\n💾 数字方舟 — 抛弃肉体，实现全人类意识上传\n🌑 绝对安全 — 降低光速，将太阳系化为黑域\n🌌 星舰流亡 — 乘曲率飞船逃离太阳系，散布星海\n⚡ 死神永生 — 响应归零者号召，归还小宇宙质量',
    highlightArea: 'none',
    tips: ['每种结局需要解锁特定的深层科技链（如黑域需曲率驱动前置）', '博物馆画廊中可以查阅已收集的终点记忆'],
  },

  // ===== 第五章：新手生存指南 =====
  {
    icon: <Lightbulb size={32} />,
    title: '执政官生存法则',
    category: '最终指示',
    description: '在黑暗森林中起步的 10 个战略步骤：\n\n① 纪元 1：在地球建设「采矿场」\n② 纪元 5：矿场完工后立刻建设「工厂」\n③ 纪元 10：在「政府」指派各部核心长官\n④ 纪元 15：任命至少 2 名面壁者\n⑤ 纪元 20：指派执剑人，完善威慑链\n⑥ 纪元 25：向火星进发，建立外星矿区\n⑦ 纪元 30：密切关注科技树中的解锁项\n⑧ 纪元 40：组建第一支星际舰队\n⑨ 纪元 50：利用情报中心展开外交斡旋\n⑩ 时刻监视文明稳定度，防止内部逃亡主义撕裂社会！',
    highlightArea: 'none',
  },
  {
    icon: <AlertOctagon size={32} />,
    title: '历史的教训',
    category: '最终指示',
    description: '翻阅档案，无数前任执政官因为以下失误导致文明覆灭：\n\n❌ 盲目造厂 → 资源枯竭 → 经济崩盘 → 稳定度归零\n❌ 忽视防卫 → 威慑度极低 → 外星舰队如入无人之境\n❌ 放任民心 → 逃亡系数失控 → 社会发生暴乱\n❌ 科技停滞 → 固步自封 → 错失抵御大灾变的窗口期\n\n⚠️ 如果遭遇维度打击或光粒攻击，请及时利用掩体世界或太空城疏散人口。',
    highlightArea: 'none',
    tips: ['不要忘记经常点击系统设置中的存档按钮', '遭遇打击不要轻言放弃，星火可以燎原'],
  },
  {
    icon: <Rocket size={32} />,
    title: '授权通过',
    category: '最终指示',
    description: '档案阅览完毕，您的指挥官权限已全面激活。\n\n历史的笔柄现在交到了你的手上。\n• 维持稳定 — 协调发展\n• 保持震慑 — 捍卫尊严\n• 攀登科技 — 突破封锁\n\n愿人类的荣光在黑暗森林中永不熄灭，执政官。',
    highlightArea: 'none',
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
    setTimeout(onComplete, 400);
  }, [onComplete]);

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