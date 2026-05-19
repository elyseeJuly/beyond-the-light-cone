/**
 * BgmPlayer.tsx — 游戏背景音乐播放器（“岁月底座”）
 *
 * 1. 自动循环播放游戏主 BGM “岁月底座”（路径：public/audio/years_base.mp3）。
 * 2. 支持静音、播放/暂停、音量调节。
 * 3. 自动在游戏结束（isGameOver）时静音/暂停，避免与大结局主题曲“星屑”冲突。
 * 4. 音乐文件不存在时静默降级，不抛出异常。
 */

import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';
import { GAMEPLAY_BGM_PATH } from '../config/endingConfig';

interface BgmPlayerProps {
  isGameOver: boolean;
}

export const BgmPlayer: React.FC<BgmPlayerProps> = ({ isGameOver }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('game-bgm-muted');
    return saved === 'true';
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('game-bgm-volume');
    return saved !== null ? parseFloat(saved) : 0.4;
  });
  const [isAvailable, setIsAvailable] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and load audio
  useEffect(() => {
    const audio = new Audio(GAMEPLAY_BGM_PATH);
    audioRef.current = audio;
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;

    audio.addEventListener('error', () => {
      console.log('[BgmPlayer] BGM "Base of Years" not found at', GAMEPLAY_BGM_PATH, '— running in silent mode');
      setIsAvailable(false);
    });

    audio.load();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Update volume / mute settings
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem('game-bgm-muted', String(isMuted));
    localStorage.setItem('game-bgm-volume', String(volume));
  }, [volume, isMuted]);

  // Listen to external settings changes (e.g. from SystemMenuPanel)
  useEffect(() => {
    const handleExternalSettings = () => {
      const savedMuted = localStorage.getItem('game-bgm-muted') === 'true';
      const savedVolume = parseFloat(localStorage.getItem('game-bgm-volume') || '0.4');
      setIsMuted(savedMuted);
      setVolume(savedVolume);
      
      if (!savedMuted && !isPlaying && !isGameOver) {
        setIsPlaying(true);
      }
    };
    window.addEventListener('bgm-settings-changed', handleExternalSettings);
    return () => window.removeEventListener('bgm-settings-changed', handleExternalSettings);
  }, [isPlaying, isGameOver]);

  // Handle Play / Pause trigger
  useEffect(() => {
    if (!audioRef.current || !isAvailable) return;

    if (isPlaying && !isGameOver) {
      audioRef.current.play().catch((err) => {
        console.log('[BgmPlayer] Autoplay blocked or failed:', err.message);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isGameOver, isAvailable]);

  // Handle game over auto-pause
  useEffect(() => {
    if (isGameOver && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isGameOver]);

  const togglePlay = () => {
    if (!isAvailable) return;
    setIsPlaying(prev => !prev);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (!isPlaying && !isMuted) {
      setIsPlaying(true);
    }
  };

  if (!isAvailable) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[10px] text-white/30 tracking-widest uppercase">
        <VolumeX size={12} className="opacity-50" />
        <span>岁月底座 BGM 待加入</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-sm backdrop-blur-md transition-all duration-300 hover:border-[var(--color-primary)]/40">
      <button 
        onClick={togglePlay}
        className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors p-1"
        title={isPlaying ? "暂停 BGM" : "播放 BGM"}
      >
        {isPlaying ? (
          <div className="flex gap-0.5 items-end h-3 w-3">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className="w-0.5 bg-[var(--color-primary)] rounded-full"
                style={{
                  height: '100%',
                  animation: `equalizer-bar 0.${4 + i}s ease-in-out infinite alternate`
                }}
              />
            ))}
          </div>
        ) : (
          <Play size={12} className="fill-current" />
        )}
      </button>

      <button 
        onClick={toggleMute}
        className="text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-colors p-1"
        title={isMuted ? "取消静音" : "静音"}
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

      <input 
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => {
          setVolume(parseFloat(e.target.value));
          if (isMuted) setIsMuted(false);
        }}
        className="w-16 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)] opacity-50 hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(to right, var(--color-primary) ${volume * 100}%, rgba(255,255,255,0.1) ${volume * 100}%)`
        }}
      />

      <span className="text-[10px] text-white/40 tracking-wider font-bold select-none hidden md:inline">
        《岁月底座》
      </span>

      <style>{`
        @keyframes equalizer-bar {
          0% { height: 2px; }
          100% { height: 12px; }
        }
      `}</style>
    </div>
  );
};
