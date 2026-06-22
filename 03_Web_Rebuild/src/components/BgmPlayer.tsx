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
import { GAMEPLAY_BGM_PATH, ERA_BGM_PATHS } from '../config/endingConfig';
import { getAssetUrl } from '../utils/assetUrl';

const SONG_NAME_MAP: Record<string, string> = {
  '/audio/era_years_base.mp3': '岁月底座',
  '/audio/era_crisis.mp3': '危机之潮',
  '/audio/era_deterrence.mp3': '执剑低吟',
  '/audio/era_broadcast.mp3': '广播回响',
  '/audio/era_bunker.mp3': '深空掩体',
  '/audio/era_galaxy.mp3': '银河孤舟',
  '/audio/era_stardust.mp3': '星屑余晖',
};

interface BgmPlayerProps {
  isGameOver: boolean;
  epoch: number;
}

export const BgmPlayer: React.FC<BgmPlayerProps> = ({ isGameOver, epoch }) => {
  const [isPlaying, setIsPlaying] = useState(() => {
    const savedMuted = localStorage.getItem('game-bgm-muted');
    return savedMuted !== 'true';
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('game-bgm-muted');
    return saved === 'true';
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('game-bgm-volume');
    return saved !== null ? parseFloat(saved) : 0.4;
  });
  const [customBgmPath, setCustomBgmPath] = useState<string | null>(() => {
    return localStorage.getItem('game-custom-bgm');
  });
  const [isAvailable, setIsAvailable] = useState(true);
  const [loadedPath, setLoadedPath] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and load audio
  useEffect(() => {
    const epochKeys = ['GOLDEN', 'CRISIS', 'DETERRENCE', 'BROADCAST', 'BUNKER', 'GALAXY', 'STARDUST'] as const;
    const epochKey = epochKeys[epoch] || 'GOLDEN';
    const specificPath = customBgmPath || ERA_BGM_PATHS[epochKey];
    let currentPath = specificPath;

    // Reuse or create audio element
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio();
      audioRef.current = audio;
    }
    audio.loop = true;
    audio.volume = isMuted ? 0 : volume;

    const tryLoadAudio = (path: string) => {
      currentPath = path;
      setLoadedPath(path);
      audio!.src = getAssetUrl(path);
      audio!.load();
      if (isPlaying && !isGameOver) {
        audio!.play().catch((err) => {
          console.log('[BgmPlayer] Autoplay blocked or failed for path:', path, err.message);
        });
      }
      setIsAvailable(true);
    };

    const handleError = () => {
      console.log('[BgmPlayer] Audio file not found at:', currentPath);
      if (currentPath === specificPath && specificPath !== GAMEPLAY_BGM_PATH) {
        console.log('[BgmPlayer] Gracefully falling back to default gameplay BGM:', GAMEPLAY_BGM_PATH);
        tryLoadAudio(GAMEPLAY_BGM_PATH);
      } else {
        console.log('[BgmPlayer] Both specific and default BGM not found, running in silent mode.');
        setIsAvailable(false);
      }
    };

    audio.addEventListener('error', handleError);

    tryLoadAudio(specificPath);

    return () => {
      audio!.removeEventListener('error', handleError);
      audio!.pause();
      audio!.src = '';
    };
  }, [epoch, customBgmPath]);

  // Update volume / mute settings
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    localStorage.setItem('game-bgm-muted', String(isMuted));
    localStorage.setItem('game-bgm-volume', String(volume));
  }, [volume, isMuted]);

  // Listen to external settings changes (e.g. from SystemMenuPanel or MuseumGallery)
  useEffect(() => {
    const handleExternalSettings = () => {
      const savedMuted = localStorage.getItem('game-bgm-muted') === 'true';
      const savedVolume = parseFloat(localStorage.getItem('game-bgm-volume') || '0.4');
      const savedCustomBgm = localStorage.getItem('game-custom-bgm');
      setIsMuted(savedMuted);
      setVolume(savedVolume);
      setCustomBgmPath(savedCustomBgm);
      
      if (!savedMuted && !isPlaying && !isGameOver) {
        setIsPlaying(true);
      }
    };
    window.addEventListener('bgm-settings-changed', handleExternalSettings);
    return () => window.removeEventListener('bgm-settings-changed', handleExternalSettings);
  }, [isPlaying, isGameOver]);

  // Listen to pause event from preview player
  useEffect(() => {
    const handlePauseMain = () => {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
    window.addEventListener('pause-main-bgm', handlePauseMain);
    return () => window.removeEventListener('pause-main-bgm', handlePauseMain);
  }, []);

  // Listen to ending started event to explicitly pause BGM
  useEffect(() => {
    const handleEndingStarted = () => {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
    window.addEventListener('game:ending:started', handleEndingStarted);
    return () => window.removeEventListener('game:ending:started', handleEndingStarted);
  }, []);

  // Listen to custom alert sound events
  useEffect(() => {
    const handleAlertSound = (e: Event) => {
      if (isMuted || !isPlaying || isGameOver || typeof window === 'undefined') return;
      try {
        const customEvent = e as CustomEvent;
        const type = customEvent.detail?.type || 'beep';
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (type === 'alert') {
          // Play a high-pitched siren beep
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(800, audioCtx.currentTime);
          osc1.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
          osc1.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.6);
          
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(400, audioCtx.currentTime);
          osc2.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.6);
          
          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
          
          osc1.start();
          osc2.start();
          osc1.stop(audioCtx.currentTime + 0.6);
          osc2.stop(audioCtx.currentTime + 0.6);
        } else if (type === 'milestone') {
          // Play a friendly victory chord
          const notes = [261.63, 329.63, 392.00, 523.25]; // C Major Chord
          notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.08);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.5);
            osc.start(audioCtx.currentTime + i * 0.08);
            osc.stop(audioCtx.currentTime + i * 0.08 + 0.5);
          });
        }
      } catch {
        // Fallback
      }
    };
    
    window.addEventListener('play-game-sound', handleAlertSound);
    return () => window.removeEventListener('play-game-sound', handleAlertSound);
  }, [isMuted, isPlaying, isGameOver]);

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

  // Listen for user interaction to resume play if blocked by autoplay policy
  useEffect(() => {
    // Only listen for interaction to play if we WANT it to play (isPlaying is true)
    if (!isPlaying || isMuted || !isAvailable || isGameOver) return;

    const resumeAudio = () => {
      if (audioRef.current && isPlaying && !isMuted && !isGameOver) {
        audioRef.current.play()
          .then(() => {
            cleanup();
          })
          .catch((err) => {
            console.log('[BgmPlayer] Interaction play failed:', err);
          });
      }
    };

    const cleanup = () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };

    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);

    return cleanup;
  }, [isPlaying, isMuted, isAvailable, isGameOver]);

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

  const epochNames = ["黄金岁月", "危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
  const currentEpochName = epochNames[epoch] || "主背景";

  if (!isAvailable) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[10px] text-white/30 tracking-widest uppercase">
        <VolumeX size={12} className="opacity-50" />
        <span>《{currentEpochName} BGM》待加入</span>
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
        {customBgmPath ? `《${SONG_NAME_MAP[customBgmPath] || '自定义背景'} (自定义)》` : (loadedPath === GAMEPLAY_BGM_PATH ? "《岁月底座》" : `《${currentEpochName}》`)}
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
