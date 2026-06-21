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
    setupTech(game, TecTreeType.INTERSTELLAR, "黑域生成");
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

  // === 扩展测试 ===

  it('多重失败条件同时满足时，按优先级触发（逃亡度 > 灭绝 > 氦闪）', () => {
    // 同时满足逃亡度100（TREACHERY）、人口0（EXTINCTION）和年份超350（HELIUM_FLASH）
    game.earthCivi.treachery = 100;
    game.earthCivi.population = 0;
    game.year = 360;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.TREACHERY); // TREACHERY 优先级最高

    // 重置，清除逃亡度，仅保留人口0，应触发 EXTINCTION
    game.isGameOver = false;
    game.defeatType = null;
    game.earthCivi.treachery = 50;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.EXTINCTION);

    // 再次重置，仅保留超350年，应触发 HELIUM_FLASH
    game.isGameOver = false;
    game.defeatType = null;
    game.earthCivi.population = 100;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.HELIUM_FLASH);
  });

  it('失败恢复 - 条件修正后不再触发失败', () => {
    // 触发逃亡度失败
    game.earthCivi.treachery = 100;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.TREACHERY);

    // 手动重置，降低逃亡度后重新检查，不应再次触发失败
    game.isGameOver = false;
    game.defeatType = null;
    game.earthCivi.treachery = 50;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
    expect(game.defeatType).toBeNull();
  });

  it('精确阈值测试 - 边界值不触发失败', () => {
    // 逃亡度 99 不触发
    game.earthCivi.treachery = 99;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);

    // 逃亡度 100 触发
    game.earthCivi.treachery = 100;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.TREACHERY);

    // 重置，人口 1 不触发灭绝
    game.isGameOver = false;
    game.defeatType = null;
    game.earthCivi.treachery = 0;
    game.earthCivi.population = 1;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);

    // 人口 0 触发灭绝
    game.earthCivi.population = 0;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.EXTINCTION);

    // 重置，年份 350 不触发氦闪（条件为 year > 350）
    game.isGameOver = false;
    game.defeatType = null;
    game.earthCivi.population = 100;
    game.year = 350;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);

    // 年份 351 触发氦闪
    game.year = 351;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.defeatType).toBe(DefeatType.HELIUM_FLASH);
  });

  it('二向箔打击被 dimensional_defense 标志阻止', () => {
    game.dimensionStrikeTriggered = true;
    game.addFlag("dimensional_defense");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });
});
