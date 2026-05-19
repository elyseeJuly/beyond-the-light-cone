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

import React, { useState, useCallback } from 'react';
import { GameInstance } from '../core/Game';
import { ENDING_CONFIGS, resolveEndingKey } from '../config/endingConfig';
import { EndingDeclaration } from './ending/EndingDeclaration';
import { EndingCinematic } from './ending/EndingCinematic';
import { TimelineRetrospective } from './ending/TimelineRetrospective';
import { CreditsRoll } from './ending/CreditsRoll';

type Phase = 'declaration' | 'cinematic' | 'retrospective' | 'credits';

export const EndGameScreen: React.FC = () => {
  const game = GameInstance.get();
  const [phase, setPhase] = useState<Phase>('declaration');

  // Resolve which ending config to use
  const endingKey = resolveEndingKey(game.victoryType, game.defeatType);
  const config = ENDING_CONFIGS[endingKey];

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
        />
      )}
    </>
  );
};
