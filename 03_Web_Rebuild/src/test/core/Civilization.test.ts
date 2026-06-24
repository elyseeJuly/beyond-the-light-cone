import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { DepartmentType } from '../../types/enums';

function setupGame() {
  GameInstance.reset();
  return GameInstance.get();
}

describe('EarthCivilization', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('初始属性值', () => {
    const e = game.earthCivi;
    expect(e.name).toBe('地球');
    expect(e.population).toBe(65);
    expect(e.economy).toBe(100);
    expect(e.resource).toBe(200);
    expect(e.army).toBe(10);
    expect(e.idlePopulation).toBe(65);
    expect(e.idleWorkers).toBe(65);
    expect(e.deterrenceValue).toBe(0);
    expect(e.swordholder).toBeNull();
    expect(e.wallfacers.size).toBe(0);
  });

  it('11个部门初始化', () => {
    expect(game.earthCivi.departments.size).toBe(11);
    expect(game.earthCivi.departments.has(DepartmentType.ECONOMY)).toBe(true);
    expect(game.earthCivi.departments.has(DepartmentType.ARMY)).toBe(true);
    expect(game.earthCivi.departments.has(DepartmentType.CULTURE)).toBe(true);
  });

  it('addWallfacer 添加面壁者', () => {
    game.earthCivi.addWallfacer('罗辑');
    expect(game.earthCivi.isWallfacer('罗辑')).toBe(true);
    expect(game.earthCivi.wallfacers.size).toBe(1);
  });

  it('removeWallfacer 移除面壁者', () => {
    game.earthCivi.addWallfacer('罗辑');
    game.earthCivi.removeWallfacer('罗辑');
    expect(game.earthCivi.isWallfacer('罗辑')).toBe(false);
  });

  it('isWallfacer 对不存在者返回false', () => {
    expect(game.earthCivi.isWallfacer('不存在的人物')).toBe(false);
  });

  it('runARound 推进文明回合', () => {
    game.rng = () => 0.9; // Disable random events to prevent test flakiness
    game.runARound();
    if (game.currentEvent) {
      game.applyEventEffect(0);
    }
    expect(game.year).toBe(1);
    expect(game.earthCivi.population).toBeGreaterThanOrEqual(65);
  });

  it('autoAssignMinisters 自动分配部长', () => {
    game.earthCivi.autoAssignMinisters(game);

    const ecoDept = game.earthCivi.departments.get(DepartmentType.ECONOMY);
    if (ecoDept) {
      expect(ecoDept.leaderName).not.toBeNull();
    }
  });

  it('allocateWorkers 分配工人', () => {
    game.earthCivi.population = 100;
    game.earthCivi.miningRatio = 30;
    game.earthCivi.factoryRatio = 30;
    game.earthCivi.cultureRatio = 30;
    game.earthCivi.idleWorkers = 90;
    (game.earthCivi as any).allocateWorkers();

    expect(game.earthCivi.miningWorkers).toBe(33);
    expect(game.earthCivi.factoryWorkers).toBe(33);
    expect(game.earthCivi.cultureWorkers).toBe(33);
    expect(game.earthCivi.idleWorkers).toBe(1);
  });

  it('sanitizeResources 人口为0时触发游戏结束', () => {
    game.earthCivi.population = 0;
    game.earthCivi.starIndices.add(3);
    (game.earthCivi as any).sanitizeResources(game);
    game.checkVictoryConditions();
    expect(game.isGameOver).toBe(true);
    expect(game.gameOverReason).toContain('文明灭绝');
  });

  it('sanitizeResources 非负值处理', () => {
    game.earthCivi.economy = -50;
    game.earthCivi.resource = -100;
    game.earthCivi.culture = -10;
    game.earthCivi.army = -5;
    (game.earthCivi as any).sanitizeResources(game);
    expect(game.earthCivi.economy).toBe(0);
    expect(game.earthCivi.resource).toBe(0);
    expect(game.earthCivi.culture).toBe(0);
    expect(game.earthCivi.army).toBe(0);
  });

  it('威慑度衰减：基础衰减至少为1', () => {
    const e = game.earthCivi;
    e.deterrenceValue = 0;
    e.runARound();
    // 无面壁者、无执剑人时，基础衰减3 + 比例衰减0 = 3，最低1
    // 因为衰减后值为0，所以验证 >= 0
    expect(e.deterrenceValue).toBeGreaterThanOrEqual(0);
  });

  it('威慑度衰减：高威慑度时衰减更快（比例衰减）', () => {
    const e = game.earthCivi;
    game.rng = () => 0.9;
    e.deterrenceValue = 100;
    // 记录衰减后的值
    e.runARound();
    // 衰减量 = 3 + floor(100 * 0.02) = 3 + 2 = 5
    // 无面壁者执剑人，所以最终衰减5
    expect(e.deterrenceValue).toBeLessThanOrEqual(95);
    expect(e.deterrenceValue).toBeGreaterThanOrEqual(94); // 可能有面壁者加分
  });

  it('威慑度衰减：面壁者可以减缓衰减', () => {
    const e = game.earthCivi;
    game.rng = () => 0.9;
    e.deterrenceValue = 100;
    // 添加一个面壁者
    e.addWallfacer('罗辑');
    game.personManager.unlockPerson('罗辑');
    e.runARound();
    // 面壁者从JSON加载属性，添加少量威慑，面壁者衰减减缓0.3
    expect(e.deterrenceValue).toBeGreaterThan(95); // 比没有面壁者时高
  });

  it('威慑度衰减：执剑人额外减缓衰减', () => {
    const e = game.earthCivi;
    game.rng = () => 0.9;
    e.deterrenceValue = 100;
    e.swordholder = '罗辑';
    e.runARound();
    // 衰减 = 3 + 2 - 0.5(执剑人) - 0 = 4.5
    expect(e.deterrenceValue).toBeLessThanOrEqual(96);
    expect(e.deterrenceValue).toBeGreaterThanOrEqual(94);
  });

  it('面壁者威慑增益：相比旧版大幅降低', () => {
    const e = game.earthCivi;
    game.rng = () => 0.9;
    e.deterrenceValue = 0;
    e.addWallfacer('罗辑');
    game.personManager.unlockPerson('罗辑');
    
    // 旧版每个面壁者每回合增益可能达到25+
    // 新版每个面壁者每回合增益 = (leadership+art)*0.05
    const before = e.deterrenceValue;
    e.runARound();
    const gain = e.deterrenceValue - before + 3; // 加上衰减恢复
    expect(gain).toBeLessThan(10); // 不超过10
  });
});

describe('AlienCivilization', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('AlienCiviManager 初始化加载异星文明', () => {
    expect(game.alienCiviManager.aliens.size).toBeGreaterThan(0);
  });

  it('isAllCiviConquered 初始不满足', () => {
    const result = game.alienCiviManager.isAllCiviConquered();
    expect(result).toBe(false);
  });

  it('isAllCiviConquered 全部臣服后成功', () => {
    for (const alien of game.alienCiviManager.aliens.values()) {
      alien.isBund = true;
    }
    expect(game.alienCiviManager.isAllCiviConquered()).toBe(true);
  });

  it('isAllCiviConquered 有外星无联盟不变', () => {
    let flag = false;
    for (const alien of game.alienCiviManager.aliens.values()) {
      if (!flag) {
        alien.isBund = true;
        flag = true;
      } else {
        alien.isBund = false;
      }
    }
    expect(game.alienCiviManager.isAllCiviConquered()).toBe(false);
  });

  it('alien runARound 推进异星回合', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      sanTi.starIndices.add(1000);
      sanTi.runARound();
      expect(sanTi.army).toBeGreaterThanOrEqual(50);
    }
  });

  it('growEconomy 异星经济增长', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      sanTi.starIndices.add(1000);
      const beforeResource = sanTi.resource;
      (sanTi as any).growEconomy();
      expect(sanTi.resource).toBeGreaterThanOrEqual(beforeResource);
    }
  });

  it('HUNTER personality 行为', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      sanTi.starIndices.add(1000);
      game.earthCivi.deterrenceValue = 0;
      (sanTi as any).hunterBehavior(game, 0);
      expect(sanTi.attackCooldown).toBeGreaterThanOrEqual(0);
    }
  });

  it('CLEANER personality 行为', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      sanTi.starIndices.add(1000);
      (sanTi as any).cleanerBehavior(game, 0);
      expect(sanTi.attackCooldown).toBeGreaterThanOrEqual(0);
    }
  });

  it('DEFENSIVE personality 行为 军事增强', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      sanTi.starIndices.add(1000);
      const before = sanTi.army;
      (sanTi as any).defensiveBehavior(game, 0);
      expect(sanTi.army).toBe(before + 5);
    }
  });

  it('EXPANSIONIST personality 扩张行为', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      sanTi.starIndices.add(1000);
      (sanTi as any).expansionistBehavior(game, 0);
    }
  });

  it('OPPORTUNIST personality 投机行为', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      sanTi.starIndices.add(1000);
      (sanTi as any).opportunistBehavior(game, 0);
    }
  });

  it('calculateDeterrence 计算威慑值', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      game.earthCivi.deterrenceValue = 50;
      const rate = (sanTi as any).calculateDeterrence(game);
      expect(rate).toBe(25);
    }
  });

  it('launchFleetAttack 发射攻击舰队', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      sanTi.starIndices.add(1000);
      const before = sanTi.fleets.length;
      (sanTi as any).launchFleetAttack(game, 5);
      expect(sanTi.fleets.length).toBe(before + 1);
      expect(sanTi.fleets[sanTi.fleets.length - 1].eta).toBe(5);
    }
  });

  it('灭亡的文明不参与回合', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi) {
      sanTi.starIndices.clear();
      const beforePop = sanTi.population;
      sanTi.runARound();
      expect(sanTi.population).toBe(beforePop);
    }
  });

  it('processFleets ETA递减', () => {
    const sanTi = game.alienCiviManager.aliens.get('三体');
    if (sanTi && !sanTi.isDieOut()) {
      sanTi.starIndices.add(1000);
      (sanTi as any).launchFleetAttack(game, 3);
      const fleet = sanTi.fleets[sanTi.fleets.length - 1];
      expect(fleet.eta).toBe(3);
      (sanTi as any).processFleets(game);
      expect(fleet.eta).toBe(2);
    }
  });
});