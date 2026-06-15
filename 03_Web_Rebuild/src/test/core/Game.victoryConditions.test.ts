import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { EpochType, TecTreeType, VictoryType } from '../../types/enums';

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

describe('Game Victory Conditions', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('WANDERING 流浪胜利：正常触发', () => {
    game.year = 300;
    setupTech(game, TecTreeType.AEROSPACE, "行星发动机Ⅲ型");
    setupTech(game, TecTreeType.INTERSTELLAR, "新家园选址");
    game.addFlag("wandering_completed");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.WANDERING);
  });

  it('WANDERING 流浪胜利：年份不足不应触发', () => {
    game.year = 200;
    setupTech(game, TecTreeType.AEROSPACE, "行星发动机Ⅲ型");
    setupTech(game, TecTreeType.INTERSTELLAR, "新家园选址");
    game.addFlag("wandering_completed");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });

  it('WANDERING 流浪胜利：与数字飞升互斥，若有数字飞升标志则不触发', () => {
    game.year = 300;
    setupTech(game, TecTreeType.AEROSPACE, "行星发动机Ⅲ型");
    setupTech(game, TecTreeType.INTERSTELLAR, "新家园选址");
    game.addFlag("wandering_completed");
    game.addFlag("digital_ark_upgrade"); // 互斥标志
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });

  it('DIGITAL 数字永生：正常触发', () => {
    game.year = 250;
    setupTech(game, TecTreeType.INFORMATION, "数字方舟");
    game.addFlag("digital_ark_upgrade");
    game.earthCivi.population = 80;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.DIGITAL);
  });

  it('DIGITAL 数字永生：人口不足不应触发', () => {
    game.year = 250;
    setupTech(game, TecTreeType.INFORMATION, "数字方舟");
    game.addFlag("digital_ark_upgrade");
    game.earthCivi.population = 30; // 小于 50
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });

  it('DETERRENCE 威慑胜利：正常触发', () => {
    game.epoch = EpochType.DETERRENCE;
    game.earthCivi.swordholder = { name: "罗辑", deterrence: 90 } as any;
    game.earthCivi.deterrenceValue = 95;
    game.deterrenceEnduranceRounds = 25;
    game.alienCiviManager.hasAnyAtWar = () => false;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.DETERRENCE);
  });

  it('DETERRENCE 威慑胜利：有外交战争时不应触发', () => {
    game.epoch = EpochType.DETERRENCE;
    game.earthCivi.swordholder = { name: "罗辑", deterrence: 90 } as any;
    game.earthCivi.deterrenceValue = 95;
    game.deterrenceEnduranceRounds = 25;
    game.alienCiviManager.hasAnyAtWar = () => true; // 处于战争状态
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });

  it('DARK_DOMAIN 黑域胜利：正常触发', () => {
    game.year = 260;
    setupTech(game, TecTreeType.PHYSICS, "黑域生成");
    game.addFlag("dark_domain_decision");
    game.earthCivi.treachery = 20;
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.DARK_DOMAIN);
  });

  it('DARK_DOMAIN 黑域胜利：逃亡度过高时不应触发', () => {
    game.year = 260;
    setupTech(game, TecTreeType.PHYSICS, "黑域生成");
    game.addFlag("dark_domain_decision");
    game.earthCivi.treachery = 90; // 大于 80
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);
  });

  it('HIDDEN 死神永生胜利：所有前置达成时正常触发', () => {
    game.year = 400;
    game.epoch = EpochType.GALAXY;
    game.earthCivi.culture = 1200;
    game.earthCivi.population = 80;
    game.earthCivi.deterrenceValue = 60;
    game.addFlag("galaxy_exodus_seen");
    game.addFlag("alien_alliance");
    game.addFlag("zero_homer_contacted");
    game.addFlag("mini_universe_built");
    setupTech(game, TecTreeType.PHYSICS, "黑域生成");
    setupTech(game, TecTreeType.INFORMATION, "数字方舟");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.HIDDEN);
  });

  it('威慑胜利与征服胜利互斥：当二者基本条件同时满足时，由标志位实现互斥', () => {
    // 准备威慑胜利的基本条件
    game.epoch = EpochType.DETERRENCE;
    game.earthCivi.swordholder = { name: "罗辑", deterrence: 90 } as any;
    game.earthCivi.deterrenceValue = 95;
    game.deterrenceEnduranceRounds = 25;
    game.alienCiviManager.hasAnyAtWar = () => false;
    game.addFlag("swordholder_appointed");

    // 准备征服胜利的基本条件
    game.year = 220;
    game.earthCivi.population = 50;
    game.earthCivi.treachery = 10;
    game.alienCiviManager.isAllCiviConquered = () => true;
    game.addFlag("conquest_declared");

    // 1. 如果同时拥有 swordholder_appointed 和 conquest_declared，两者均不应触发（互斥）
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(false);

    // 2. 清除 swordholder_appointed 标志，征服胜利可以触发
    game.removeFlag("swordholder_appointed");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.CONQUEST);

    // 重置并验证威慑
    game.isGameOver = false;
    game.victoryType = null;
    game.addFlag("swordholder_appointed");
    game.removeFlag("conquest_declared");
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.victoryType).toBe(VictoryType.DETERRENCE);
  });
});
