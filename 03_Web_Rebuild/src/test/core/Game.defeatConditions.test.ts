import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { TecTreeType, DefeatType } from '../../types/enums';

function setupGame() {
  GameInstance.reset();
  const game = GameInstance.get();
  game.year = 1;
  game.earthCivi.population = 100;
  game.earthCivi.culture = 500;
  game.earthCivi.deterrenceValue = 50;
  game.earthCivi.treachery = 0;
  return game;
}

function setupTech(game: Game, type: TecTreeType, name: string) {
  const tree = game.earthCivi.tecTreeManager.trees.get(type);
  const node = tree?.getNode(name);
  if (node) {
    node.finished = true;
  }
}

describe('Game Defeat Conditions', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('TREACHERY 文明崩溃：逃亡度达 100 触发', () => {
    game.earthCivi.treachery = 100;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.TREACHERY);
  });

  it('EXTINCTION 文明灭绝：人口归零触发', () => {
    game.earthCivi.population = 0;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.EXTINCTION);
  });

  it('HELIUM_FLASH 太阳氦闪：年数超 350 且无逃逸手段触发', () => {
    game.year = 360;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.HELIUM_FLASH);
  });

  it('HELIUM_FLASH 太阳氦闪：如果仅有 wandering_chosen 标志仍会触发（修复绕过漏洞）', () => {
    game.year = 360;
    game.addFlag("wandering_chosen");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.HELIUM_FLASH);
  });

  it('HELIUM_FLASH 太阳氦闪：若有黑域生成科技，不应触发失败', () => {
    game.year = 360;
    setupTech(game, TecTreeType.PHYSICS, "黑域生成");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });

  it('HELIUM_FLASH 太阳氦闪：若流浪地球计划已完成，不应触发失败', () => {
    game.year = 360;
    game.addFlag("wandering_completed");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });

  it('DIMENSION_STRIKE 二向箔打击：二向箔击中且无逃生手段时触发', () => {
    game.dimensionStrikeTriggered = true;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.DIMENSION_STRIKE);
  });
});
