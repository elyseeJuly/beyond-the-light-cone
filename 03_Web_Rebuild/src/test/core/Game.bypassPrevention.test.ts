import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { DefeatType } from '../../types/enums';

function setupGame() {
  GameInstance.reset();
  const game = GameInstance.get();
  game.year = 1;
  game.earthCivi.population = 100;
  game.earthCivi.culture = 500;
  game.earthCivi.deterrenceValue = 50;
  game.earthCivi.treachery = 0;
  game.updateEpoch();
  game.eventQueue = [];
  game.currentEvent = null;
  return game;
}

describe('Game Bypass Prevention & Rollback Tests', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('防绕过：sanitizeResources 不直接触发 game-over，但后续 checkVictoryConditions 能捕获灭绝', () => {
    game.earthCivi.population = 0;
    // @ts-expect-error accessing private method for test
    game.earthCivi.sanitizeResources(game);
    expect(game.isGameOver).toBe(false); // 不应直接为真

    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.EXTINCTION);
  });

  it('防绕过：processDimensionStrike 不直接触发 game-over，仅设置触发标志', () => {
    const alien = game.alienCiviManager.aliens.get("三体");
    expect(alien).toBeDefined();

    if (alien) {
      alien.dimensionStrikeWarningTurns = 1;
      // @ts-expect-error accessing private method for test
      alien.processDimensionStrike(game);

      expect(game.isGameOver).toBe(false); // 不应直接为真
      expect(game.dimensionStrikeTriggered).toBe(true); // 应设置标识

      game.checkVictoryConditions();
      expect(game.isGameOver).toBe(true);
      expect(game.defeatType).toBe(DefeatType.DIMENSION_STRIKE);
    }
  });

  it('命运分歧点：回溯功能正常恢复 10 回合前状态', () => {
    // 清空事件，防止触发交互事件导致年份推进被暂缓
    game.eventManager.events = [];
    game.eventManager.randomEvents = [];
    game.eventManager.filteredEvents = [];

    // 模拟进行 12 个回合，积累 turnHistory 快照
    for (let i = 0; i < 12; i++) {
      const str = JSON.stringify(game, (GameInstance as any).replacer);
      console.log(`[Test Debug] Iteration ${i}, serialized length: ${str.length}, turnHistory: ${game.turnHistory?.length || 0}`);
      if (str.includes("turnHistory")) {
        console.log("WARNING: turnHistory is included in serialized string!");
      }
      const parsed = JSON.parse(str);
      const keysWithSize = Object.keys(parsed).map(k => ({ key: k, size: JSON.stringify(parsed[k]).length }));
      keysWithSize.sort((a,b) => b.size - a.size);
      console.log(`[Test Debug] Top keys:`, keysWithSize.slice(0, 5));
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();
    }
    const finalYear = game.year; // 应该是 13

    // 触发失败
    game.earthCivi.population = 0;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);

    // 触发回溯
    const success = Game.rollbackToFateDivergence();
    expect(success).toBe(true);

    const rolledBackGame = GameInstance.get();
    expect(rolledBackGame.isGameOver).toBe(false);
    expect(rolledBackGame.year).toBe(finalYear - 10); // 回溯了 10 回合
  });
});
