/**
 * EndGameScreen.tsx — 大结局流程控制器
 *
 * 管理 4 阶段沉浸式大结局流程：
 * Phase 1: EndingDeclaration — 结局宣言
 * Phase 2: EndingCinematic   — 专属演绎（粒子特效 + 配图）
 * Phase 3: TimelineRetrospective — 时间线回顾
 * Phase 4: CreditsRoll — 主题曲 + 制作人员名单
 *
 * 根据 game.victoryType / game.defeatType 自动选择对应的 9 种结局配置之一。
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Game, GameInstance } from '../core/Game';
import { ENDING_CONFIGS, resolveEndingKey, FINALE_THEME_PATH, ENDING_BGM_PATHS } from '../config/endingConfig';
import { SaveManager } from '../core/SaveManager';
import { EndingDeclaration } from './ending/EndingDeclaration';
import { EndingCinematic } from './ending/EndingCinematic';
import { TimelineRetrospective } from './ending/TimelineRetrospective';
import { CreditsRoll } from './ending/CreditsRoll';
import { getAssetUrl } from '../utils/assetUrl';

type Phase = 'declaration' | 'cinematic' | 'retrospective' | 'credits';

export const EndGameScreen: React.FC = () => {
  const game = GameInstance.get();
  const [phase, setPhase] = useState<Phase>('declaration');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicAvailable, setMusicAvailable] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Resolve which ending config to use
  const endingKey = resolveEndingKey(game.victoryType, game.defeatType);
  const config = ENDING_CONFIGS[endingKey];

  // Play ending theme music starting from Phase 1
  useEffect(() => {
    // Dispatch custom event to notify BgmPlayer to pause
    window.dispatchEvent(new CustomEvent('game:ending:started'));

    // Fade out current game audio
    if (game && game.audioManager) {
      game.audioManager.init();
      game.audioManager.fadeOutAll(1500).catch(err => {
        console.warn('[EndGameScreen] AudioManager fadeOutAll failed:', err);
      });
    }

    const savedMuted = localStorage.getItem('game-bgm-muted') === 'true';
    const savedVolume = parseFloat(localStorage.getItem('game-bgm-volume') || '0.4');

    const specificPath = ENDING_BGM_PATHS[endingKey] || FINALE_THEME_PATH;
    let currentPath = specificPath;

    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = savedMuted ? 0 : savedVolume;
    audio.loop = true;

    const tryLoad = (path: string) => {
      currentPath = path;
      audio.src = getAssetUrl(path);
      audio.load();
    };

    audio.addEventListener('canplaythrough', () => {
      audio.play()
        .then(() => setMusicPlaying(true))
        .catch((err) => {
          console.log('[EndGameScreen] Autoplay blocked or failed:', err.message);
          setMusicPlaying(false);
        });
    });

    const handleError = () => {
      console.log('[EndGameScreen] Audio not found at', currentPath);
      if (currentPath === specificPath && specificPath !== FINALE_THEME_PATH) {
        console.log('[EndGameScreen] Falling back to default ending theme:', FINALE_THEME_PATH);
        tryLoad(FINALE_THEME_PATH);
      } else {
        console.log('[EndGameScreen] Running in silent mode');
        setMusicAvailable(false);
      }
    };

    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', () => setMusicPlaying(false));

    tryLoad(specificPath);

    return () => {
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
      if (game && game.audioManager) {
        game.audioManager.restoreVolumes();
      }
    };
  }, [endingKey, game]);

  // Switch to Platinum theme in Credits if all endings are unlocked
  useEffect(() => {
    if (phase === 'credits' && audioRef.current && SaveManager.isAllEndingsUnlocked()) {
      console.log('[EndGameScreen] Platinum collection achieved! Switching credits theme to "A Past Within the Light Cone"');
      const savedMuted = localStorage.getItem('game-bgm-muted') === 'true';
      const savedVolume = parseFloat(localStorage.getItem('game-bgm-volume') || '0.4');
      
      const handlePlatinumError = () => {
        console.log('[EndGameScreen] Platinum theme not found, falling back to default ending theme.');
        if (audioRef.current) {
          audioRef.current.src = getAssetUrl(FINALE_THEME_PATH);
          audioRef.current.loop = true;
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
        }
      };

      audioRef.current.pause();
      audioRef.current.src = getAssetUrl(ENDING_BGM_PATHS.CREDITS_PLATINUM);
      audioRef.current.volume = savedMuted ? 0 : savedVolume;
      audioRef.current.loop = false; // The spec says single play: loop = false
      audioRef.current.addEventListener('error', handlePlatinumError, { once: true });
      audioRef.current.load();
      audioRef.current.play()
        .then(() => setMusicPlaying(true))
        .catch(err => {
          console.log('[EndGameScreen] Platinum theme autoplay blocked:', err.message);
          setMusicPlaying(false);
        });
    }
  }, [phase]);

  // Listen for user interaction to resume play if blocked by autoplay policy
  useEffect(() => {
    if (musicPlaying || !musicAvailable) return;

    const resumeAudio = () => {
      if (audioRef.current && !musicPlaying) {
        const savedMuted = localStorage.getItem('game-bgm-muted') === 'true';
        const savedVolume = parseFloat(localStorage.getItem('game-bgm-volume') || '0.4');
        audioRef.current.volume = savedMuted ? 0 : savedVolume;

        audioRef.current.play()
          .then(() => {
            setMusicPlaying(true);
            cleanup();
          })
          .catch((err) => {
            console.log('[EndGameScreen] Interaction play failed:', err);
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
  }, [musicPlaying, musicAvailable]);

  const handleRestart = useCallback(() => {
    window.location.reload();
  }, []);

  const handleRollback = useCallback(() => {
    const success = Game.rollbackToFateDivergence();
    if (success) {
      window.dispatchEvent(new CustomEvent('observer-mode-activated'));
      window.location.reload();
    } else {
      alert("回溯失败，未找到有效的分歧点快照。");
    }
  }, []);

  const handleObserverMode = useCallback(() => {
    const game = GameInstance.get();
    game.isObserverMode = true;
    game.isGameOver = false;
    window.dispatchEvent(new CustomEvent('observer-mode-activated'));
    game.addHistory("【观察者模式】人类文明已静默，您当前以量子幽灵视点静观宇宙流转。");
  }, []);

  const advanceTo = useCallback((next: Phase) => {
    setPhase(next);
  }, []);

  return (
    <>
      {phase === 'declaration' && (
        <EndingDeclaration
          config={config}
          onComplete={() => advanceTo('cinematic')}
        />
      )}
      {phase === 'cinematic' && (
        <EndingCinematic
          config={config}
          onComplete={() => advanceTo('retrospective')}
        />
      )}
      {phase === 'retrospective' && (
        <TimelineRetrospective
          config={config}
          onComplete={() => advanceTo('credits')}
        />
      )}
      {phase === 'credits' && (
        <CreditsRoll
          config={config}
          onRestart={handleRestart}
          onRollback={handleRollback}
          onObserverMode={handleObserverMode}
          musicPlaying={musicPlaying}
          musicAvailable={musicAvailable}
        />
      )}
    </>
  );
};
