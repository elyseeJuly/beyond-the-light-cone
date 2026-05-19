/**
 * CreditsRoll.tsx — Phase 4: 主题曲 + 制作人员名单
 *
 * 播放主题曲（预留接口，路径 public/audio/theme_song.mp3）。
 * 制作人员名单以缓慢上滚形式呈现。
 * 音乐文件不存在时静默降级，不阻塞流程。
 */

import React, { useState, useEffect, useRef } from 'react';
import { EndingConfig, FINALE_THEME_PATH, CREDITS_LIST } from '../../config/endingConfig';
import { RefreshCw } from 'lucide-react';

interface Props {
  config: EndingConfig;
  onRestart: () => void;
}

export const CreditsRoll: React.FC<Props> = ({ config, onRestart }) => {
  const [showButtons, setShowButtons] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicAvailable, setMusicAvailable] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const creditsRef = useRef<HTMLDivElement>(null);

  // Attempt to play theme song
  useEffect(() => {
    const audio = new Audio(FINALE_THEME_PATH);
    audioRef.current = audio;
    audio.volume = 0.6;
    audio.loop = false;

    audio.addEventListener('canplaythrough', () => {
      audio.play().then(() => setMusicPlaying(true)).catch(() => setMusicAvailable(false));
    });
    audio.addEventListener('error', () => {
      console.log('[CreditsRoll] Finale theme song not found at', FINALE_THEME_PATH, '— degrading gracefully');
      setMusicAvailable(false);
    });
    audio.addEventListener('ended', () => setMusicPlaying(false));

    // Force load attempt
    audio.load();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Show restart buttons after credits scroll completes
  useEffect(() => {
    const t = setTimeout(() => setShowButtons(true), 25000); // Show after 25s
    return () => clearTimeout(t);
  }, []);

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
            <span className="tracking-widest uppercase text-white/50">主题曲：《星屑》</span>
          </div>
        </div>
      )}

      {!musicAvailable && (
        <div className="absolute top-6 right-6 z-20">
          <p className="text-white/15 text-[10px] tracking-widest uppercase">
            🎵 主题曲：《星屑》 待添加 → public/audio/stardust.mp3
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
          <div className="text-center mb-20">
            <p className="text-white/20 text-xs tracking-[0.5em] uppercase mb-4">— A Three-Body Universe Simulation —</p>
            <h1
              className="text-5xl font-black tracking-tight mb-3"
              style={{ color: config.accentColor }}
            >
              宇宙群英传
            </h1>
            <p className="text-xl text-white/50 italic tracking-wider">Legend of Uni</p>
          </div>

          {/* Ending achieved */}
          <div className="text-center mb-20">
            <p className="text-white/30 text-xs tracking-[0.4em] uppercase mb-3">You Achieved</p>
            <p
              className="text-2xl font-bold tracking-wider"
              style={{ color: config.accentColor }}
            >
              {config.iconSymbol} {config.title}
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

      {/* Restart / buttons (appear after credits) */}
      <div
        className={`absolute bottom-12 z-20 flex gap-6 transition-all duration-1000 ${
          showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <button
          onClick={onRestart}
          className="group flex items-center gap-3 px-10 py-4 border text-sm font-bold uppercase tracking-widest transition-all rounded-sm"
          style={{
            backgroundColor: config.accentColor + '15',
            borderColor: config.accentColor + '50',
            color: config.accentColor,
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.backgroundColor = config.accentColor + '30';
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.backgroundColor = config.accentColor + '15';
          }}
        >
          <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
          重新启航
        </button>
      </div>

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
