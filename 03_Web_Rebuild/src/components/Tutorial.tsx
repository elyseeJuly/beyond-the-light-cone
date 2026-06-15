import React, { useState, useCallback, useEffect } from 'react';
import { 
  ChevronRight, ChevronLeft, X, Globe, Shield, Rocket, 
  Map, Building2, Cpu, TrendingUp, 
  Star,
  BookOpen, Lightbulb, Trophy, AlertOctagon, Clock, Crosshair
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
    icon: <Globe size={32} />,
    title: '欢迎来到宇宙群英传',
    category: '序章',
    description: '公元 2XXX 年，三体文明发现了地球的存在。\n作为地球防卫理事会最高指挥官，你将在黑暗森林法则的阴影下，带领人类文明穿越五大纪元——从危机纪元的绝望，到银河纪元的星辰大海。\n\n你的每一个决策都将决定人类的命运。',
    highlightArea: 'none',
  },
  {
    icon: <Clock size={32} />,
    title: '五大纪元',
    category: '序章',
    description: '游戏横跨五个宏大纪元，每个纪元都有独特的挑战与机遇：\n\n• 危机纪元（第1-200年）— 建设发展期，面临智子封锁\n• 威慑纪元（第201-260年）— 需要执剑人建立黑暗森林威慑\n• 广播纪元（第261-300年）— 坐标暴露，全宇宙皆知\n• 掩体纪元（第301-350年）— 最后的防御建设窗口\n• 银河纪元（第351年起）— 自由探索无尽星海',
    highlightArea: 'top',
    tips: ['纪元会随年份自动推进', '不同纪元会解锁不同的事件与科技路线'],
  },

  // ===== 第二章：界面导览 =====
  {
    icon: <TrendingUp size={32} />,
    title: '顶部资源面板',
    category: '界面导览',
    description: '屏幕顶部是你的核心资源仪表盘，实时显示文明的生存状况：\n\n👥 人口 — 工人来源，影响所有产出\n📈 经济 — 建设与贸易的货币\n🏛 文化 — 社会凝聚力与科技加成\n🛡 军力 — 防御与进攻的基础力量\n💎 资源 — 原材料，开采自星球矿场\n💀 逃亡主义 — 超过100则文明崩溃！\n⚠️ 威慑度 — 震慑外星文明的核心指标',
    highlightArea: 'top',
    tips: ['每回合资源变化会以浮动数字显示增减', '逃亡主义超过80会触发危机事件链，务必留意'],
  },
  {
    icon: <Map size={32} />,
    title: '左侧导航 — 全局视图',
    category: '界面导览',
    description: '左侧面板分为两个区域：\n\n上半部分是全局视图切换：\n🗺 战略星图 — 查看太阳系与深空天体\n🖥 科技研发 — 查看五大科技树的研发进度\n\n下半部分是政府部门列表：\n点击任意部门可以查看详情并任命部长。部长的个人能力会直接加成该部门的产出。',
    highlightArea: 'left',
    tips: ['「宇宙社会学」部门点击后进入面壁者面板', '每个部门最多任命一位部长'],
  },
  {
    icon: <Star size={32} />,
    title: '中央星图',
    category: '界面导览',
    description: '中央区域是战略星图，以太阳为中心展示已知宇宙：\n\n• 🟡 金色大球 = 太阳\n• 🔵 蓝色光点 = 地球领地\n• 🔴 红色光点 = 外星文明占领\n• ⚪ 灰色光点 = 已发现但未殖民\n\n操作方式：\n• 鼠标悬停 — 显示星球名称\n• 点击星球 — 在右侧面板查看详情\n• 滚轮缩放 — 放大/缩小星图视野',
    highlightArea: 'center',
    tips: ['解锁远镜科技后可以发现更远处的星球', '舰队航行时会显示虚线航行轨迹和光点位置'],
  },
  {
    icon: <BookOpen size={32} />,
    title: '右侧信息面板',
    category: '界面导览',
    description: '右侧面板包含三个关键信息区：\n\n📋 星球详情 — 点击星球后显示其资源、人口、设施状态\n🏗 建设选项 — 可在己方星球上建造采矿场、工厂、太空城市\n📜 历史日志 — 实时滚动的游戏事件记录\n\n右下角的「下一回合」按钮是推进时间的唯一途径。',
    highlightArea: 'right',
    tips: ['建设需要消耗经济，完工需要数个回合', '历史日志中的红色条目通常表示紧急警告'],
  },

  // ===== 第三章：核心玩法 =====
  {
    icon: <Building2 size={32} />,
    title: '经济运转原理',
    category: '核心玩法',
    description: '地球文明的经济基于三大工人分配：\n\n⛏ 矿工 — 从星球开采原始资源\n🏭 工人 — 在工厂将资源转化为经济\n🎨 文化工 — 提升文化值与社会凝聚力\n\n工人按照比例自动分配（默认各占1/3）。\n\n⚠️ 关键提示：工厂每生产1点经济需消耗资源。若资源耗尽，工厂会停转！因此要先建采矿场，再建工厂。',
    highlightArea: 'none',
    tips: ['在星球上先建「采矿场」确保资源供应', '然后建「工厂」将资源转化为经济', '最后建「太空城市」提升人口上限'],
  },
  {
    icon: <Cpu size={32} />,
    title: '科技研发体系',
    category: '核心玩法',
    description: '科技分为五大研究树：\n\n🔬 物理学 — 维度打击、曲率驱动等基础物理\n🚀 航天学 — 行星发动机、远镜望远科技\n⚔️ 军事学 — 舰队武器、黑暗森林打击\n💻 信息学 — 数字文明、思想钢印、量子计算\n🌌 星际学 — 宇宙社会学、黑域生成\n\n每条科技树由对应部门的部长推动研发。部长的science属性越高，研发速度越快。',
    highlightArea: 'none',
    tips: ['系统会自动选择最低成本的可用科技开始研究', '智子封锁期间研发速度会大幅降低，但不会完全停止', '研发「550W量子计算机」可以降低智子封锁惩罚'],
  },
  {
    icon: <Shield size={32} />,
    title: '面壁计划与威慑体系',
    category: '核心玩法',
    description: '在左侧「宇宙社会学」部门中，你可以：\n\n🧑‍💼 任命面壁者（最多4位）\n面壁者每回合自动增加威慑值和军力，是防御体系的基石。\n\n⚔️ 设立执剑人（1位）\n执剑人的leadership属性直接影响对外星文明的震慑力。当威慑值足够高时，外星文明会减少攻击频率。\n\n⚠️ 面壁者积累的威慑值 + 执剑人的领导力 = 实际对异星 AI 的震慑效果。两者缺一不可！',
    highlightArea: 'left',
    tips: ['优先挑选 leadership 和 art 属性高的人物担任面壁者', '执剑人选择 leadership 最高的人物效果最好'],
  },
  {
    icon: <Crosshair size={32} />,
    title: '外交与军事',
    category: '核心玩法',
    description: '游戏中有5个外星文明（三体、歌者等），它们各有不同的 AI 性格：\n\n🎯 猎手型 — 主动进攻，需高威慑值压制\n🧹 清理者型 — 低频攻击但破坏力巨大\n📡 机会主义型 — 威慑低时趁虚而入\n🌍 扩张主义型 — 占领无主星球\n\n在右侧面板可以对外星文明执行外交行动：\n• 谈判 — 提升友好度\n• 贸易 — 用经济换资源\n• 结盟 — 友好度足够时可结为同盟',
    highlightArea: 'right',
    tips: ['结盟需要友好度达到「挚友」级别', '征服胜利需要所有5个文明灭亡或结盟'],
  },

  // ===== 第四章：胜利条件 =====
  {
    icon: <Trophy size={32} />,
    title: '六大胜利路径',
    category: '胜利之路',
    description: '人类文明可以通过以下任一方式赢得最终胜利：\n\n🏆 征服胜利 — 所有外星文明灭亡或与你结盟\n🛡 威慑胜利 — 进入威慑纪元且有执剑人\n💾 数字永生 — 完成「数字方舟」科技\n🌑 黑域胜利 — 完成「黑域生成」科技\n🌌 星舰文明 — 完成曲率驱动与星际航行\n⚡ 死神永生 — 达成隐藏条件，归还宇宙质量',
    highlightArea: 'none',
    tips: ['数字永生需先研究：数字文明→数字生命→意识上传→数字方舟', '黑域胜利需完成曲率驱动和黑域生成两条科技路线', '不同胜利路径适合不同的游戏风格'],
  },

  // ===== 第五章：新手生存指南 =====
  {
    icon: <Lightbulb size={32} />,
    title: '新手10步生存指南',
    category: '生存指南',
    description: '按以下顺序操作可确保前50回合平稳发展：\n\n① 第1回合：在地球建造「采矿场」\n② 第5回合：采矿场完工后建造「工厂」\n③ 第10回合：任命各部门部长\n④ 第15回合：任命2-3位面壁者\n⑤ 第20回合：设立执剑人\n⑥ 第25回合：在火星建造采矿场扩张\n⑦ 第30回合：关注智子解锁进度\n⑧ 第40回合：建立第一支舰队\n⑨ 第50回合：开始外交谈判\n⑩ 持续关注逃亡主义，不要超过80！',
    highlightArea: 'none',
    tips: ['不要一开始就花经济建舰队，先稳经济', '逃亡主义每回合自然增长，没有主动降低手段，依靠事件选项控制'],
  },
  {
    icon: <AlertOctagon size={32} />,
    title: '常见失败原因',
    category: '生存指南',
    description: '以下是新手最容易犯的致命错误：\n\n❌ 不建采矿场 → 资源耗尽 → 工厂停工 → 经济崩溃\n❌ 不任命面壁者 → 威慑为零 → 外星频繁入侵\n❌ 忽视逃亡主义 → 超过100 → 文明直接灭亡\n❌ 不设执剑人 → 进入威慑纪元后毫无防护\n❌ 只研究一条科技树 → 错过关键科技窗口\n\n⚠️ 如果遭遇入侵且防御力不足，人口会骤降至30%。\n早期务必在建设和防御之间取得平衡！',
    highlightArea: 'none',
    tips: ['遭遇攻击后不要放弃，积极恢复经济', '存档是你的好朋友，定期点击右上角保存按钮'],
  },
  {
    icon: <Rocket size={32} />,
    title: '准备就绪，指挥官',
    category: '出发',
    description: '你已经掌握了在黑暗森林中生存所需的一切基础知识。\n\n记住：\n• 📊 经济是基础 — 先建矿场和工厂\n• 🛡 威慑是生命线 — 任命面壁者和执剑人\n• 🔬 科技是未来 — 合理分配研究方向\n• 🤝 外交是策略 — 敌友关系可以改变\n\n宇宙很大，生活更大。\n祝你好运，指挥官。黑暗森林中，愿人类之光永不熄灭。',
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') handleSkip();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

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
    top: current.highlightArea === 'top' ? 'inset-x-0 top-0 h-16' : undefined,
    left: current.highlightArea === 'left' ? 'left-0 top-16 bottom-0 w-64' : undefined,
    center: current.highlightArea === 'center' ? 'left-64 top-16 bottom-0 right-80' : undefined,
    right: current.highlightArea === 'right' ? 'right-0 top-16 bottom-0 w-80' : undefined,
  } : null;
  const activeHighlight = highlightStyle ? highlightStyle[current.highlightArea as keyof typeof highlightStyle] : null;

  return (
    <div className={`fixed inset-0 z-[500] flex items-center justify-center transition-all duration-400 ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Darkened background with highlight cutout */}
      {!activeHighlight && <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />}
      
      {/* Highlight glow */}
      {activeHighlight && (
        <div 
          className={`absolute ${activeHighlight} border-2 border-[var(--color-primary)] rounded-lg z-[501] pointer-events-none transition-all duration-500`}
          style={{
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.85), 0 0 30px rgba(0,229,255,0.3), inset 0 0 30px rgba(0,229,255,0.1)',
          }}
        />
      )}

      {/* Main tutorial card */}
      <div className={`relative z-[502] w-full max-w-2xl mx-4 flex flex-col transition-all duration-300 ${exiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        
        {/* Progress bar */}
        <div className="w-full h-1 bg-white/10 rounded mb-4 overflow-hidden">
          <div 
            className="h-full bg-[var(--color-primary)] rounded transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Chapter navigation */}
        <div className="flex items-center gap-2 mb-3 select-none">
          {categories.map((cat, ci) => {
            const isActive = step >= cat.startIdx && step < cat.startIdx + cat.count;
            return (
              <button 
                key={ci}
                onClick={() => handleGoTo(cat.startIdx)}
                className={`text-[10px] font-title font-bold uppercase tracking-wider px-3 py-1 rounded border transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[rgba(var(--color-primary-rgb),0.1)] border-[var(--color-primary)] text-[var(--color-primary)] shadow-[0_0_8px_rgba(0,184,255,0.25)]' 
                    : 'border-[#243245]/60 text-[var(--text-secondary)]/50 hover:text-white hover:border-white/30 bg-[#070B14]/40'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-[10px] text-[var(--text-secondary)]/30 font-mono">{step + 1}/{TUTORIAL_STEPS.length}</span>
        </div>

        {/* Content card */}
        <div className="relative glass-archive border border-[#243245]/60 rounded p-8 flex flex-col gap-5 overflow-hidden">
          {/* Glow corner decorations */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-primary)]/40 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-primary)]/40 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-primary)]/40 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-primary)]/40 pointer-events-none" />

          {/* Skip button */}
          <button onClick={handleSkip} className="tutorial-modal-close-btn absolute top-5 right-5 text-[var(--text-secondary)] hover:text-white transition-colors z-10 cursor-pointer">
            <X size={16} />
          </button>

          {/* Icon + Title */}
          <div className={`flex items-center gap-4 transition-all duration-200 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
            <div className="w-12 h-12 rounded bg-white/5 border border-[#243245]/40 flex items-center justify-center text-[var(--color-primary)] shrink-0">
              {current.icon}
            </div>
            <div>
              <div className="text-[9px] font-mono font-bold text-[var(--text-secondary)]/45 uppercase tracking-[0.15em] mb-0.5">{current.category}</div>
              <h2 className="text-lg font-title font-extrabold text-white tracking-widest">{current.title}</h2>
            </div>
          </div>

          {/* Description */}
          <div className={`transition-all duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'} font-sans text-xs`}>
            <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
              {current.description}
            </p>
          </div>

          {/* Tips */}
          {current.tips && current.tips.length > 0 && (
            <div className={`bg-[#070B14]/40 border border-[#243245]/40 rounded p-4 transition-all duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center gap-2 text-[9px] font-title font-bold text-amber-400 uppercase tracking-wider mb-2">
                <Lightbulb size={11} />
                <span>小贴士 / Strategic Tips</span>
              </div>
              <ul className="space-y-1.5 font-mono text-[11px]">
                {current.tips.map((tip, i) => (
                  <li key={i} className="text-[var(--text-secondary)]/75 flex items-start gap-2">
                    <span className="text-amber-400/60 mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between mt-4 select-none">
          <button 
            onClick={handlePrev} 
            disabled={step === 0}
            className={`flex items-center gap-1 px-4 py-2 rounded text-xs font-bold transition-all ${
              step === 0 ? 'opacity-0 cursor-default' : 'text-[var(--text-secondary)]/50 hover:text-white hover:bg-white/5 cursor-pointer'
            }`}
          >
            <ChevronLeft size={14} />
            上一步
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5">
            {TUTORIAL_STEPS.map((_, i) => (
              <button 
                key={i} 
                onClick={() => handleGoTo(i)}
                className={`w-1.5 h-1.5 rounded transition-all cursor-pointer ${
                  i === step 
                    ? 'bg-[var(--color-primary)] scale-125' 
                    : i < step 
                      ? 'bg-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/60' 
                      : 'bg-white/15 hover:bg-white/30'
                }`} 
              />
            ))}
          </div>

          <button 
            onClick={handleNext} 
            className="flex items-center gap-1.5 px-5 py-2 bg-[var(--color-primary)] hover:brightness-110 text-black font-extrabold rounded text-xs cursor-pointer shadow-[0_0_12px_rgba(0,184,255,0.4)] transition-all"
          >
            {step < TUTORIAL_STEPS.length - 1 ? (
              <>下一步 <ChevronRight size={14} /></>
            ) : (
              '🚀 开始游戏'
            )}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-[10px] text-white/20">← → 方向键翻页 · Enter 下一步 · Esc 跳过</span>
        </div>
      </div>
    </div>
  );
};