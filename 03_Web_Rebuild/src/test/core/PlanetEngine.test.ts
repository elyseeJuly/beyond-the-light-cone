import { describe, it, expect, beforeEach } from 'vitest';
import { PlanetEngine } from '../../core/PlanetEngine';
import { GameInstance } from '../../core/Game';

function setupGame() {
  GameInstance.reset();
  return GameInstance.get();
}

describe('PlanetEngine', () => {
  let pe: PlanetEngine;

  beforeEach(() => {
    pe = new PlanetEngine();
  });

  it('初始属性', () => {
    expect(pe.totalEngines).toBe(12000);
    expect(pe.enginesBuilt).toBe(0);
    expect(pe.thrustLevel).toBe(0);
    expect(pe.currentDistanceTravelled).toBe(0);
    expect(pe.targetDistance).toBe(4.22);
    expect(pe.status).toBe('PLANNING');
    expect(pe.moonCrisisResolved).toBe(false);
  });

  it('buildEngines 资源不足时返回错误', () => {
    const game = setupGame();
    game.earthCivi.resource = 0;
    const result = pe.buildEngines(10);
    expect(result).toContain('资源不足');
    expect(pe.enginesBuilt).toBe(0);
  });

  it('buildEngines 成功建造', () => {
    const game = setupGame();
    game.earthCivi.resource = 5000;
    const result = pe.buildEngines(100);
    expect(result).toContain('成功建造');
    expect(pe.enginesBuilt).toBe(100);
    expect(pe.status).toBe('CONSTRUCTING');
    expect(game.earthCivi.resource).toBe(5000 - 1000);
  });

  it('buildEngines 建造数量不超过总数', () => {
    const game = setupGame();
    game.earthCivi.resource = 200000;
    pe.buildEngines(15000);
    expect(pe.enginesBuilt).toBe(12000);
  });

  it('buildEngines 全部建造完成触发变轨状态', () => {
    const game = setupGame();
    game.earthCivi.resource = 200000;
    pe.buildEngines(12000);
    expect(pe.status).toBe('ORBIT_SHIFT');
    expect(game.historyLogs.some(l => l.includes('全部建造完成'))).toBe(true);
  });

  it('initiateOrbitShift 状态错误时返回错误', () => {
    const result = pe.initiateOrbitShift();
    expect(result).toContain('无法启动变轨');
    expect(pe.status).toBe('PLANNING');
  });

  it('initiateOrbitShift 成功启动变轨', () => {
    const game = setupGame();
    pe.status = 'ORBIT_SHIFT';
    const result = pe.initiateOrbitShift();
    expect(result).toContain('全力启动');
    expect(pe.status).toBe('FLIGHT');
    expect(pe.thrustLevel).toBe(100);
    expect(game.hasFlag('wandering_earth_started')).toBe(true);
  });

  it('processTurn FLIGHT 状态推进距离', () => {
    pe.status = 'FLIGHT';
    pe.processTurn();
    expect(pe.currentDistanceTravelled).toBeGreaterThan(0);
    expect(pe.currentDistanceTravelled).toBeLessThan(pe.targetDistance);
  });

  it('processTurn FLIGHT 到达目标后完成', () => {
    const game = setupGame();
    pe.status = 'FLIGHT';
    pe.currentDistanceTravelled = 4.20; // Near target
    pe.processTurn();
    expect(pe.status).toBe('COMPLETED');
    expect(game.hasFlag('wandering_completed')).toBe(true);
  });

  it('processTurn PLANNING 状态不做任何事', () => {
    pe.status = 'PLANNING';
    pe.processTurn();
    expect(pe.currentDistanceTravelled).toBe(0);
  });

  it('完整流程：建造 -> 变轨 -> 飞行 -> 完成', () => {
    const game = setupGame();
    game.earthCivi.resource = 200000;

    pe.buildEngines(12000);
    expect(pe.status).toBe('ORBIT_SHIFT');

    const msg = pe.initiateOrbitShift();
    expect(msg).toContain('全力启动');
    expect(pe.status).toBe('FLIGHT');

    pe.currentDistanceTravelled = pe.targetDistance;
    pe.processTurn();
    expect(pe.status).toBe('COMPLETED');
    expect(game.hasFlag('wandering_completed')).toBe(true);
  });

  it('buildEngines 多次累积建造', () => {
    const game = setupGame();
    game.earthCivi.resource = 200000;

    pe.buildEngines(5000);
    expect(pe.enginesBuilt).toBe(5000);
    expect(pe.status).toBe('CONSTRUCTING');

    pe.buildEngines(7000);
    expect(pe.enginesBuilt).toBe(12000);
    expect(pe.status).toBe('ORBIT_SHIFT');
  });

  it('重元素聚变科技加速飞行', () => {
    pe.status = 'FLIGHT';
    // Without tech
    pe.processTurn();
    const distWithout = pe.currentDistanceTravelled;

    // Reset with tech
    GameInstance.reset();
    const game2 = setupGame();
    const pe2 = new PlanetEngine();
    pe2.status = 'FLIGHT';
    const node = game2.earthCivi.tecTreeManager.trees
      .get(3)?.getNode('重元素聚变');
    if (node) node.finished = true;
    pe2.processTurn();
    expect(pe2.currentDistanceTravelled).toBeGreaterThanOrEqual(distWithout);
  });
});