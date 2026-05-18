import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../../core/Game';
import { EpochType } from '../../types/enums';

describe('Game Core', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  it('初始化年份为0', () => {
    expect(game.year).toBe(0);
  });

  it('初始纪元为危机', () => {
    expect(game.epoch).toBe(EpochType.CRISIS);
  });

  it('地球人口初始65', () => {
    expect(game.earthCivi.population).toBe(65);
  });

  it('Flag系统工作正常', () => {
    game.addFlag('test_flag');
    expect(game.hasFlag('test_flag')).toBe(true);
    game.removeFlag('test_flag');
    expect(game.hasFlag('test_flag')).toBe(false);
  });

  it('Epoch匹配辅助函数(isEpochMatch)逻辑正确', () => {
    const em = game.eventManager as any;
    
    // ANY target epoch
    expect(em.isEpochMatch('ANY', 'CRISIS')).toBe(true);
    expect(em.isEpochMatch('ANY', 'BROADCAST')).toBe(true);

    // Exact matches
    expect(em.isEpochMatch('CRISIS', 'CRISIS')).toBe(true);
    expect(em.isEpochMatch('CRISIS', 'DETERRENCE')).toBe(false);
    expect(em.isEpochMatch('DETERRENCE', 'DETERRENCE')).toBe(true);

    // Number/Enum matches
    expect(em.isEpochMatch(0, 'CRISIS')).toBe(true);
    expect(em.isEpochMatch(0, 'DETERRENCE')).toBe(false);
    expect(em.isEpochMatch(1, 'DETERRENCE')).toBe(true);

    // WANDERING matches late game only
    expect(em.isEpochMatch('WANDERING', 'CRISIS')).toBe(false);
    expect(em.isEpochMatch('WANDERING', 'DETERRENCE')).toBe(false);
    expect(em.isEpochMatch('WANDERING', 'BROADCAST')).toBe(true);
    expect(em.isEpochMatch('WANDERING', 'BUNKER')).toBe(true);
    expect(em.isEpochMatch('WANDERING', 'GALAXY')).toBe(true);

    // SHELTER matches BUNKER only
    expect(em.isEpochMatch('SHELTER', 'CRISIS')).toBe(false);
    expect(em.isEpochMatch('SHELTER', 'BUNKER')).toBe(true);
    expect(em.isEpochMatch('SHELTER', 'GALAXY')).toBe(false);
  });
});
