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
import { GameInstance } from '../core/Game';
import { ENDING_CONFIGS, resolveEndingKey, FINALE_THEME_PATH } from '../config/endingConfig';
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
    const savedMuted = localStorage.getItem('game-bgm-muted') === 'true';
    const savedVolume = parseFloat(localStorage.getItem('game-bgm-volume') || '0.4');

    const audio = new Audio(getAssetUrl(FINALE_THEME_PATH));
    audioRef.current = audio;
    audio.volume = savedMuted ? 0 : savedVolume;
    audio.loop = true;

    audio.addEventListener('canplaythrough', () => {
      audio.play()
        .then(() => setMusicPlaying(true))
        .catch((err) => {
          console.log('[EndGameScreen] Autoplay blocked or failed:', err.message);
          setMusicPlaying(false);
        });
    });

    audio.addEventListener('error', () => {
      console.log('[EndGameScreen] Finale theme song not found at', FINALE_THEME_PATH, '— degrading gracefully');
      setMusicAvailable(false);
    });

    audio.addEventListener('ended', () => setMusicPlaying(false));

    audio.load();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

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
          musicPlaying={musicPlaying}
          musicAvailable={musicAvailable}
        />
      )}
    </>
  );
};
