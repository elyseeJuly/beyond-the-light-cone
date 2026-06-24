import React, { useState, useEffect } from 'react';
import { Play, SkipForward, Landmark, Shield, Cpu, Info } from 'lucide-react';
import { getImageUrl } from '../utils/assetUrl';

interface GameCoverScreenProps {
  hasSave: boolean;
  onStartNewGame: (withTutorial: boolean) => void;
  onContinueGame: () => void;
  onOpenArchive: () => void;
}

type MenuOption = 'continue' | 'new_tutorial' | 'new_free' | 'archive' | null;

export const GameCoverScreen: React.FC<GameCoverScreenProps> = ({
  hasSave,
  onStartNewGame,
  onContinueGame,
  onOpenArchive,
}) => {
  const [bgImage, setBgImage] = useState(() => getImageUrl('cover.png'));
  const [hoveredOption, setHoveredOption] = useState<MenuOption>(null);
  const [rendered, setRendered] = useState(false);

  // Handle responsive background image
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setBgImage(getImageUrl('cover_1_1.png'));
      } else {
        setBgImage(getImageUrl('cover.png'));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    setRendered(true);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getOptionDescription = (opt: MenuOption) => {
    switch (opt) {
      case 'continue':
        return '读取最近的历史节点，继续您的文明演进与黑暗森林法则对抗之旅。';
      case 'new_tutorial':
        return '重构文明时间线。推荐新手玩家使用，本引导包含手把手战略和内政基础操作指南。';
      case 'new_free':
        return '跳过初级引导系统，直接以最高统帅身份跨入冷酷的宇宙博弈。';
      case 'archive':
        return '访问银河深空数据库，查阅已解锁的文明终局与地球六大纪元里程碑。';
      default:
        return '请选择操作指令。作为执政官，您在黑暗森林法则下的每一个决策都将书写人类文明的历史。';
    }
  };

  if (!rendered) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex flex-col justify-between overflow-hidden bg-black text-[#DDEEFF] font-mono select-none"
      style={{
        backgroundImage: `radial-gradient(circle at center, rgba(7, 11, 20, 0.4) 0%, #070B14 100%), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'background-image 0.5s ease-in-out',
      }}
    >
      {/* Sci-fi scanning lines overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,184,255,0.02)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,184,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,184,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        <div className="absolute inset-x-0 h-[2px] bg-[var(--color-primary)]/10 shadow-[0_0_15px_var(--color-primary)] opacity-40 animate-[menu-scan_6s_linear_infinite]" />
      </div>

      {/* Top Header info */}
      <header className="relative z-20 flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent border-b border-[var(--color-primary)]/10 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="text-[10px] sm:text-xs tracking-[0.25em] text-[var(--color-primary)] font-bold font-title">
            GALACTIC ARCHIVE SYSTEM // CONNECTED
          </span>
        </div>
        <div className="text-[10px] text-right text-[var(--text-secondary)]/60 font-mono">
          SYSTEM VERSION: V0.9.0-BETA // SECURE
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-20 flex-1 flex flex-col md:flex-row items-center md:items-stretch justify-center md:justify-between px-6 md:px-16 py-8 gap-8 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Left Side: Title and Logo */}
        <div className="flex-1 flex flex-col justify-center text-center md:text-left">
          <div className="inline-flex items-center justify-center md:justify-start gap-2 text-[var(--color-primary)] mb-2 tracking-[0.3em] text-xs font-bold">
            <Shield size={14} className="animate-pulse" />
            地球防卫理事会最高指挥中心
          </div>
          <h1 
            className="text-4xl sm:text-6xl font-black font-title tracking-[0.2em] text-white leading-tight drop-shadow-[0_0_20px_rgba(0,184,255,0.5)] uppercase"
            style={{ textShadow: '0 0 15px rgba(0, 184, 255, 0.4)' }}
          >
            光锥之外
          </h1>
          <h2 className="text-xl sm:text-2xl font-light text-[var(--color-primary)] tracking-[0.4em] mt-1 uppercase">
            纪元往事
          </h2>
          <div className="mt-6 text-xs text-[var(--text-secondary)]/80 leading-relaxed max-w-md hidden md:block">
            在冷酷黑暗的宇宙森林深处，地球文明的坐标已经暴露，智子封锁着科学的边界。你将扮演人类最高执政官，引领文明跨越危机、威慑、广播、掩体及逃亡纪元，在毁灭与永恒的交织中为文明寻找一线生路。
          </div>
        </div>

        {/* Right Side: Options and HUD */}
        <div className="w-full md:w-[420px] flex flex-col justify-center gap-6">
          {/* Action Menu */}
          <div className="flex flex-col gap-3.5 bg-black/60 border border-[var(--color-primary)]/20 p-6 rounded backdrop-blur-md shadow-[0_0_30px_rgba(0,184,255,0.08)]">
            <div className="text-[10px] tracking-[0.2em] text-[var(--color-primary)] font-bold mb-1 border-b border-[var(--color-primary)]/10 pb-2">
              SELECT COMMAND OR PROTOCOL
            </div>

            {/* Option 1: Continue Game */}
            <button
              onClick={onContinueGame}
              disabled={!hasSave}
              onMouseEnter={() => setHoveredOption('continue')}
              onMouseLeave={() => setHoveredOption(null)}
              className={`w-full group flex items-center gap-4 px-4 py-3.5 border transition-all duration-300 relative overflow-hidden text-left cursor-pointer ${
                hasSave
                  ? 'border-[var(--color-primary)]/40 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:shadow-[0_0_15px_rgba(0,184,255,0.2)] text-white'
                  : 'border-[#243245]/40 text-slate-500 opacity-50 cursor-not-allowed'
              }`}
            >
              {hasSave && (
                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
              )}
              <Play size={16} className={hasSave ? 'text-[var(--color-primary)]' : 'text-slate-500'} />
              <div className="flex-grow">
                <div className="text-sm font-bold tracking-widest font-title">继续我的文明</div>
                <div className="text-[9px] opacity-60 mt-0.5 font-mono">CONTINUE EXISTENTIAL LOG</div>
              </div>
            </button>

            {/* Option 2: New Game with Tutorial */}
            <button
              onClick={() => onStartNewGame(true)}
              onMouseEnter={() => setHoveredOption('new_tutorial')}
              onMouseLeave={() => setHoveredOption(null)}
              className="w-full group flex items-center gap-4 px-4 py-3.5 border border-[var(--color-primary)]/40 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:shadow-[0_0_15px_rgba(0,184,255,0.2)] text-white transition-all duration-300 relative overflow-hidden text-left cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
              <Cpu size={16} className="text-[var(--color-primary)]" />
              <div className="flex-grow">
                <div className="text-sm font-bold tracking-widest font-title">开始新游戏 (启用引导)</div>
                <div className="text-[9px] opacity-60 mt-0.5 font-mono">NEW GAME WITH TUTORIAL</div>
              </div>
            </button>

            {/* Option 3: New Game Free Exploration */}
            <button
              onClick={() => onStartNewGame(false)}
              onMouseEnter={() => setHoveredOption('new_free')}
              onMouseLeave={() => setHoveredOption(null)}
              className="w-full group flex items-center gap-4 px-4 py-3.5 border border-[var(--color-primary)]/40 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:shadow-[0_0_15px_rgba(0,184,255,0.2)] text-white transition-all duration-300 relative overflow-hidden text-left cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
              <SkipForward size={16} className="text-[var(--color-primary)]" />
              <div className="flex-grow">
                <div className="text-sm font-bold tracking-widest font-title">自由探索 (跳过引导)</div>
                <div className="text-[9px] opacity-60 mt-0.5 font-mono">FREE EXPLORATION MODE</div>
              </div>
            </button>

            {/* Option 4: View Archive */}
            <button
              onClick={onOpenArchive}
              onMouseEnter={() => setHoveredOption('archive')}
              onMouseLeave={() => setHoveredOption(null)}
              className="w-full group flex items-center gap-4 px-4 py-3.5 border border-[var(--color-primary)]/40 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 hover:shadow-[0_0_15px_rgba(0,184,255,0.2)] text-white transition-all duration-300 relative overflow-hidden text-left cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)] transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
              <Landmark size={16} className="text-[var(--color-primary)]" />
              <div className="flex-grow">
                <div className="text-sm font-bold tracking-widest font-title">文明档案馆</div>
                <div className="text-[9px] opacity-60 mt-0.5 font-mono">CIVILIZATION ARCHIVES</div>
              </div>
            </button>
          </div>

          {/* Description HUD */}
          <div className="bg-[#070B14]/80 border border-slate-800 p-4 min-h-[90px] rounded flex gap-3 text-xs leading-relaxed text-[var(--text-secondary)]">
            <Info size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">指令说明 / DECISION DESCRIPTION</div>
              <p className="transition-all duration-300">{getOptionDescription(hoveredOption)}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer credits */}
      <footer className="relative z-20 p-5 bg-black/60 border-t border-[var(--color-primary)]/10 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between text-[10px] text-[var(--text-secondary)]/50 gap-2 shrink-0">
        <div>© 2026 EMBEROIS GAME STUDIO. ALL RIGHTS RESERVED.</div>
        <div className="flex items-center gap-4">
          <span>美术：银河全息美术馆</span>
          <span>系统重构：Google DeepMind - Antigravity</span>
        </div>
      </footer>

      {/* Custom keyframe styles for scanning */}
      <style>{`
        @keyframes menu-scan {
          0% { top: -5%; }
          100% { top: 105%; }
        }
      `}</style>
    </div>
  );
};
