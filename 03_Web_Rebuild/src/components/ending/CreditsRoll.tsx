/**
 * CreditsRoll.tsx — Phase 4: 主题曲 + 制作人员名单
 *
 * 播放主题曲（预留接口，路径 public/audio/theme_song.mp3）。
 * 制作人员名单以缓慢上滚形式呈现。
 * 音乐文件不存在时静默降级，不阻塞流程。
 */

import React, { useState, useEffect, useRef } from 'react';
import { EndingConfig, CREDITS_LIST } from '../../config/endingConfig';
import { 
  RefreshCw, RotateCcw, Eye,
  Swords, ShieldAlert, EyeOff, Globe, Dna, Sparkles, Flame, Skull, Sun, Layers 
} from 'lucide-react';
import { KeyDecisionRetrospective } from './KeyDecisionRetrospective';
import { GameInstance } from '../../core/Game';

interface Props {
  config: EndingConfig;
  onRestart: () => void;
  onRollback: () => void;
  onObserverMode: () => void;
  musicPlaying: boolean;
  musicAvailable: boolean;
}

export const CreditsRoll: React.FC<Props> = ({ 
  config, 
  onRestart, 
  onRollback, 
  onObserverMode, 
  musicPlaying, 
  musicAvailable 
}) => {
  const [showButtons, setShowButtons] = useState(false);
  const creditsRef = useRef<HTMLDivElement>(null);

  // Show restart buttons after credits scroll completes
  useEffect(() => {
    const t = setTimeout(() => setShowButtons(true), 25000); // Show after 25s
    return () => clearTimeout(t);
  }, []);

  const IconComponent = () => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      Swords,
      ShieldAlert,
      EyeOff,
      Globe,
      Dna,
      Sparkles,
      Flame,
      Skull,
      Sun,
      Layers
    };
    const Icon = iconMap[config.iconSymbol];
    if (!Icon) return null;
    return <Icon className="inline-block mr-2 align-text-bottom" size={24} style={{ color: config.accentColor }} />;
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(180deg, #050A1F 0%, ${config.gradientFrom}40 50%, #050A1F 100%)`,
      }}
    >
      {/* Music indicator */}
      {musicAvailable && (
        <div className="absolute top-6 right-6 z-20">
          <div className="flex items-center gap-2 text-white/20 text-xs">
            <div className={`flex gap-0.5 items-end h-4 ${musicPlaying ? '' : 'opacity-30'}`}>
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-1 bg-white/40 rounded-full"
                  style={{
                    height: `${8 + Math.random() * 12}px`,
                    animation: musicPlaying ? `equalizer-bar 0.${3 + i}s ease-in-out infinite alternate` : 'none',
                  }}
                />
              ))}
            </div>
            <span className="tracking-widest uppercase text-white/50">主题曲：《Stardust Exodus》</span>
          </div>
        </div>
      )}

      {!musicAvailable && (
        <div className="absolute top-6 right-6 z-20">
          <p className="text-white/15 text-[10px] tracking-widest uppercase">
            🎵 主题曲：《Stardust Exodus》 待添加 → public/audio/ending_stardust_exodus.mp3
          </p>
        </div>
      )}

      {/* Credits scroll container */}
      <div className="relative w-full max-w-2xl h-full overflow-hidden">
        {/* Top / bottom fade masks */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050A1F] to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050A1F] to-transparent z-10 pointer-events-none" />

        {/* Scrolling content */}
        <div
          ref={creditsRef}
          className="absolute inset-0 flex flex-col items-center"
          style={{
            animation: 'credits-scroll 60s linear forwards',
          }}
        >
          {/* Spacer to start from bottom */}
          <div className="h-screen" />

          {/* Game title */}
          <div className="text-center mb-20 animate-pulse">
            <p className="text-white/20 text-xs tracking-[0.5em] uppercase mb-4">— A Three-Body Universe Simulation —</p>
            <h1
              className="text-4xl font-black tracking-tight mb-3"
              style={{ color: config.accentColor }}
            >
              光锥之外：纪元往事
            </h1>
            <p className="text-lg text-white/50 italic tracking-wider">Beyond the Light Cone: Epoch Chronicles</p>
            <p className="text-[10px] text-white/30 tracking-[0.25em] uppercase mt-2">— 宇宙群英传重构计划 / Legend of Uni Rebuild —</p>
          </div>

          {/* Ending achieved */}
          <div className="text-center mb-20 animate-pulse">
            <p className="text-white/30 text-xs tracking-[0.4em] uppercase mb-3">You Achieved</p>
            <p
              className="text-2xl font-bold tracking-wider flex items-center justify-center gap-1"
              style={{ color: config.accentColor }}
            >
              <IconComponent /> {config.title}
            </p>
            <p className="text-white/30 mt-2 italic">{config.subtitle}</p>
          </div>

          {/* Credits entries */}
          {CREDITS_LIST.map((credit, idx) => (
            <div key={idx} className="text-center mb-14">
              <p className="text-white/25 text-xs tracking-[0.3em] uppercase mb-2">
                {credit.role}
              </p>
              <p className="text-white/70 text-lg tracking-wider">
                {credit.name}
              </p>
            </div>
          ))}

          {/* Final quote */}
          <div className="text-center mt-16 mb-8">
            <div
              className="w-12 h-px mx-auto mb-8"
              style={{ backgroundColor: config.accentColor + '44' }}
            />
            <p className="text-white/40 text-lg italic max-w-md leading-relaxed">
              "给岁月以文明，而不是给文明以岁月。"
            </p>
            <p className="text-white/20 text-xs mt-4 tracking-widest">— 大低谷纪念碑铭文</p>
          </div>

          {/* Thank you */}
          <div className="text-center mt-24 mb-4">
            <p
              className="text-3xl font-black tracking-wider"
              style={{ color: config.accentColor + 'AA' }}
            >
              感谢您的游玩
            </p>
            <p className="text-white/20 text-sm mt-4 tracking-widest uppercase">
              Thank You For Playing
            </p>
          </div>

          {/* Spacer */}
          <div className="h-64" />
        </div>
      </div>

      {/* Restart / buttons & Retrospective (appear after credits) */}
      {showButtons && (
        <div
          className="absolute inset-0 z-40 flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-8 animate-in fade-in zoom-in-95 duration-700"
          style={{
            background: 'rgba(5, 10, 31, 0.92)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Left: Key Decisions */}
          <div className="w-full md:w-1/2 max-w-md max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar pointer-events-auto">
            <KeyDecisionRetrospective accentColor={config.accentColor} />
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-4 w-full md:w-auto max-w-xs shrink-0 pointer-events-auto">
            <h4 className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-white/45 text-center md:text-left mb-2">
              Timeline Command // 时间线指令
            </h4>
            
            {/* 1. 重新启航 */}
            <button
              onClick={onRestart}
              className="group flex items-center justify-center gap-3 px-8 py-4 border text-sm font-bold uppercase tracking-widest transition-all rounded bg-white/[0.03] hover:bg-white/[0.08] cursor-pointer"
              style={{
                borderColor: config.accentColor + '40',
                color: '#FFFFFF',
              }}
            >
              <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700 text-yellow-400" />
              重新启航 (新周目)
            </button>

            {/* 2. 时间回溯 */}
            <button
              onClick={onRollback}
              disabled={!GameInstance.get().turnHistory || GameInstance.get().turnHistory.length === 0}
              className="group flex items-center justify-center gap-3 px-8 py-4 border text-sm font-bold uppercase tracking-widest transition-all rounded bg-white/[0.03] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              style={{
                borderColor: config.accentColor + '40',
                color: '#FFFFFF',
              }}
            >
              <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform duration-700 text-cyan-400" />
              时间回溯 (穿梭)
            </button>

            {/* 3. 观察者模式 */}
            <button
              onClick={onObserverMode}
              className="group flex items-center justify-center gap-3 px-8 py-4 border text-sm font-bold uppercase tracking-widest transition-all rounded bg-white/[0.03] hover:bg-white/[0.08] cursor-pointer"
              style={{
                borderColor: config.accentColor + '40',
                color: '#FFFFFF',
              }}
            >
              <Eye size={16} className="group-hover:scale-110 transition-transform duration-300 text-purple-400" />
              宇宙观察者模式
            </button>
          </div>
        </div>
      )}

      {/* Skip */}
      {!showButtons && (
        <button
          onClick={() => setShowButtons(true)}
          className="absolute bottom-8 right-8 text-white/20 hover:text-white/50 text-xs tracking-widest uppercase transition-colors z-20 pointer-events-auto cursor-pointer"
        >
          Skip →
        </button>
      )}

      {/* Credits scroll keyframe style */}
      <style>{`
        @keyframes credits-scroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
        @keyframes equalizer-bar {
          0% { height: 4px; }
          100% { height: 16px; }
        }
      `}</style>
    </div>
  );
};
