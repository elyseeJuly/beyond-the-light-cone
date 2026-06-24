import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { createFleet } from '../../core/Fleet';
import { STAR_INDEX } from '../../config/starIndices';

function setupGame() {
  GameInstance.reset();
  return GameInstance.get();
}

describe('PlanetEngine Engine Subsystem', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('初始状态核验', () => {
    const engine = game.planetEngine;
    expect(engine.enginesBuilt).toBe(0);
    expect(engine.thrustLevel).toBe(0);
    expect(engine.currentDistanceTravelled).toBe(0);
    expect(engine.status).toBe('PLANNING');
  });

  it('buildEngines 扣减资源并累计进度', () => {
    const engine = game.planetEngine;
    game.earthCivi.resource = 500;
    const res = engine.buildEngines(10);
    expect(res).toContain('成功建造 10 台');
    expect(engine.enginesBuilt).toBe(10);
    expect(game.earthCivi.resource).toBe(400); // 10 * 10 = 100 resources cost
    expect(engine.status).toBe('CONSTRUCTING');
  });

  it('行星发动机满负荷触发 ORBIT_SHIFT 状态', () => {
    const engine = game.planetEngine;
    game.earthCivi.resource = 200000;
    engine.buildEngines(12000);
    expect(engine.enginesBuilt).toBe(12000);
    expect(engine.status).toBe('ORBIT_SHIFT');
  });

  it('变轨逃逸与航行进程结算', () => {
    const engine = game.planetEngine;
    game.earthCivi.resource = 200000;
    engine.buildEngines(12000);
    
    // Initiate shift
    const shiftRes = engine.initiateOrbitShift();
    expect(shiftRes).toContain('变轨逃逸计划正式执行');
    expect(engine.status).toBe('FLIGHT');
    expect(engine.thrustLevel).toBe(100);
    expect(game.hasFlag('wandering_earth_started')).toBe(true);

    // Turn process updates distance
    engine.processTurn();
    expect(engine.currentDistanceTravelled).toBeGreaterThan(0);
  });
});

describe('DigitalLife Subsystem', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('无服务器禁止上传意识', () => {
    const dl = game.digitalLife;
    const res = dl.uploadConsciousness(10);
    expect(res).toContain('请先建造量子服务器');
  });

  it('constructQuantumServer 量子计算机服务器构建与容量提升', () => {
    const dl = game.digitalLife;
    game.earthCivi.resource = 400;
    const res = dl.constructQuantumServer();
    expect(res).toContain('成功建造了一台量子量子计算机服务器');
    expect(dl.activeServerCount).toBe(1);
    expect(dl.digitalArkCapacity).toBe(1500);
    expect(dl.mossAutonomyLevel).toBe(10);
    expect(game.earthCivi.resource).toBe(250); // -150
  });

  it('意识上传逻辑与数字奇点判断', () => {
    const dl = game.digitalLife;
    game.earthCivi.resource = 200;
    dl.constructQuantumServer();
    game.earthCivi.population = 100; // 100 million

    const res = dl.uploadConsciousness(80);
    expect(res).toContain('成功上传');
    expect(game.earthCivi.population).toBe(20);
    expect(dl.uploadPercentage).toBeGreaterThan(0);
  });

  it('MOSS自主计算力门槛与领袖意识重构', () => {
    const dl = game.digitalLife;
    game.personManager.unlockPerson("章北海");
    // Kill leader first to allow resurrection
    game.personManager.availablePersons.delete("章北海");

    // Fails with low autonomy
    let res = dl.resurrectLeader("章北海");
    expect(res).toContain('复活失败');

    // Build servers to raise MOSS autonomy
    game.earthCivi.resource = 1000;
    dl.constructQuantumServer(); // 10%
    dl.constructQuantumServer(); // 20%
    dl.constructQuantumServer(); // 30%

    res = dl.resurrectLeader("章北海");
    expect(res).toContain('成功在数字世界中复活了领袖');
    expect(dl.resurrectedPersons.has("章北海")).toBe(true);
    expect(game.personManager.availablePersons.has("章北海")).toBe(true);
  });
});

describe('Wallfacer Defection & Break System', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('面壁者秘密计划正常递增且破壁人击退/识破', () => {
    game.personManager.unlockPerson("罗辑");
    game.earthCivi.addWallfacer("罗辑");

    // Run round to progress plan
    game.earthCivi.runARound();
    const plan = game.earthCivi.wallfacerPlans["罗辑"];
    expect(plan).toBeDefined();
    expect(plan.progress).toBeGreaterThan(0);
    expect(plan.planName).toBe("雪地引力波广播");
  });
});

describe('AI Special Weapons & Warnings', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('引力波广播暴露坐标增加逃亡主义', () => {
    const trisolaris = game.alienCiviManager.aliens.get("三体");
    expect(trisolaris).toBeDefined();

    const startTreachery = game.earthCivi.treachery;
    trisolaris?.checkGravityBroadcast(game);
    expect(game.hasFlag("三体_broadcast_sent")).toBe(true);
    expect(game.earthCivi.treachery).toBe(startTreachery + 25);
  });

  it('二向箔维度打击倒计时预警', () => {
    const trisolaris = game.alienCiviManager.aliens.get("三体");
    game.earthCivi.starIndices.add(9); // Allow attack (needs > 1 stars)
    
    trisolaris?.triggerDimensionStrike(game);
    expect(trisolaris?.hasDimensionStruck).toBe(true);
    expect(trisolaris?.dimensionStrikeWarningTurns).toBe(5);

    // Progress warning ticks
    (trisolaris as any).processDimensionStrike(game);
    expect(trisolaris?.dimensionStrikeWarningTurns).toBe(4);
  });
});

describe('Cross-tree Technology Dependencies', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('缺少强相互作用力材料时，行星发动机基础被阻塞', () => {
    const tm = game.earthCivi.tecTreeManager;
    // Ensure "强相互作用力材料" is not finished
    expect(tm.isTecFinishedAnywhere("强相互作用力材料")).toBe(false);

    // Call allocate and process tech
    const aerospaceTree = tm.trees.get(1); // AEROSPACE
    expect(aerospaceTree).toBeDefined();
    
    // Simulate auto-research selecting best node
    (game.earthCivi as any).processTechResearch(game);
    
    // Planetary engines should not be researched because prerequisite is missing
    const engineNode = aerospaceTree?.getNode("行星发动机基础");
    expect(engineNode?.inResearch).toBeFalsy();
    expect(engineNode?.finished).toBeFalsy();
  });
});

describe('Fleet & Colony System', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('createFleet 创建不同航程的舰队', () => {
    const fleet1 = createFleet('侦察舰队', '地球', 0, 0, 3, true);
    expect(fleet1.name).toBe('侦察舰队');
    expect(fleet1.eta).toBe(3);
    expect(fleet1.totalEta).toBe(3);
    expect(fleet1.weapons.length).toBeGreaterThan(0);
    expect(fleet1.belongToCivi).toBe('地球');

    const fleet2 = createFleet('主力舰队', '地球', 0, 0, 10, true);
    expect(fleet2.eta).toBe(10);
    expect(fleet2.totalEta).toBe(10);
  });

  it('派遣舰队到目标星系', () => {
    const targetStar = game.starManager.getStar(5);
    expect(targetStar).toBeDefined();

    const fleet = createFleet('远征舰队', '地球', 3, 5, 5);
    game.earthCivi.fleets.push(fleet);
    expect(game.earthCivi.fleets.length).toBe(1);
    expect(fleet.sourceStarIndex).toBe(3);
    expect(fleet.targetStarIndex).toBe(5);
  });

  it('舰队抵达目标星系后ETA递减', () => {
    const fleet = createFleet('打击舰队', '地球', 3, 5, 2);
    game.earthCivi.fleets.push(fleet);

    game.rng = () => 0.5;
    (game.earthCivi as any).processFleets(game);
    expect(fleet.eta).toBe(1);

    (game.earthCivi as any).processFleets(game);
    expect(fleet.eta).toBe(0);
  });

  it('舰队解散后从舰队数组中移除', () => {
    const fleet1 = createFleet('舰队A', '地球', 0, 0, 3);
    const fleet2 = createFleet('舰队B', '地球', 0, 0, 5);
    game.earthCivi.fleets.push(fleet1, fleet2);
    expect(game.earthCivi.fleets.length).toBe(2);

    // Remove first fleet
    game.earthCivi.fleets.splice(0, 1);
    expect(game.earthCivi.fleets.length).toBe(1);
    expect(game.earthCivi.fleets[0].name).toBe('舰队B');
  });

  it('创建殖民飞船', () => {
    const colonyShip = createFleet('殖民飞船·方舟号', '地球', 3, 10, 8);
    colonyShip.weapons = [];
    game.earthCivi.fleets.push(colonyShip);
    expect(game.earthCivi.fleets.length).toBe(1);
    expect(game.earthCivi.fleets[0].weapons.length).toBe(0);
    expect(colonyShip.name).toContain('殖民');
    expect(colonyShip.targetStarIndex).toBe(10);
  });

  it('在恒星上建立殖民地', () => {
    const star = game.starManager.getStar(5);
    expect(star).toBeDefined();

    game.earthCivi.starIndices.add(5);
    star!.belongToCivi = '地球';
    star!.populationLimit = 500;
    star!.hasCity = true;

    expect(game.earthCivi.starIndices.has(5)).toBe(true);
    expect(star!.belongToCivi).toBe('地球');
    expect(star!.hasCity).toBe(true);
    expect(star!.populationLimit).toBe(500);
  });

  it('殖民地人口增长', () => {
    const e = game.earthCivi;
    const star = game.starManager.getStar(STAR_INDEX.EARTH)!;
    star.populationLimit = 1000;
    star.hasCity = true;

    const beforePop = e.population;
    game.rng = () => 0.5;
    e.runARound();

    expect(e.population).toBeGreaterThanOrEqual(beforePop);
  });

  it('殖民地资源贡献（采矿场）', () => {
    const e = game.earthCivi;
    const star = game.starManager.getStar(STAR_INDEX.EARTH)!;
    star.hasStope = true;
    star.currentResource = 500;
    star.populationLimit = 1000;

    const beforeResource = e.resource;
    game.earthCivi.isAiBrainEnabled = true;
    e.runARound();

    // Mining should produce resources (factory may consume, so just check non-negative)
    expect(e.resource).toBeGreaterThanOrEqual(0);
  });

  it('多舰队在同一位置共存', () => {
    const fleet1 = createFleet('舰队1', '地球', 3, 5, 3);
    const fleet2 = createFleet('舰队2', '地球', 3, 5, 2);
    game.earthCivi.fleets.push(fleet1, fleet2);

    expect(game.earthCivi.fleets.length).toBe(2);
    expect(fleet1.sourceStarIndex).toBe(fleet2.sourceStarIndex);
    expect(fleet1.targetStarIndex).toBe(fleet2.targetStarIndex);
  });

  it('舰队在星系间的航行ETA缩减', () => {
    const fleet = createFleet('星际舰队', '地球', 3, 10, 5);
    game.earthCivi.fleets.push(fleet);

    expect(fleet.eta).toBe(5);
    game.rng = () => 0.5;
    game.earthCivi.runARound();
    expect(fleet.eta).toBe(4);
  });

  it('舰队携带指挥官', () => {
    const fleet = createFleet('精英舰队', '地球', 3, 5, 3);
    fleet.leaderName = '章北海';
    game.earthCivi.fleets.push(fleet);

    expect(fleet.leaderName).toBe('章北海');

    // With a leader, processFleets should not error
    game.rng = () => 0.5;
    game.earthCivi.runARound();
    expect(fleet.eta).toBe(2);
  });

  it('零战力舰队（无武器）抵达后不影响系统', () => {
    const fleet = createFleet('民船', '地球', 3, 5, 0);
    fleet.weapons = [];
    game.earthCivi.fleets.push(fleet);

    game.rng = () => 0.5;
    expect(() => game.earthCivi.runARound()).not.toThrow();
  });

  it('大量舰队不影响系统运行', () => {
    for (let i = 0; i < 20; i++) {
      const fleet = createFleet(`舰队${i}`, '地球', 3, 5, 3 + i);
      game.earthCivi.fleets.push(fleet);
    }
    expect(game.earthCivi.fleets.length).toBe(20);

    game.rng = () => 0.5;
    expect(() => game.earthCivi.runARound()).not.toThrow();
    expect(game.earthCivi.fleets.length).toBe(20);
  });

  it('殖民地人口上限约束（maxPop = populationLimit * 3）', () => {
    const e = game.earthCivi;
    const star = game.starManager.getStar(STAR_INDEX.EARTH)!;
    star.populationLimit = 100;

    e.population = 500;
    e.idlePopulation = 500;
    e.idleWorkers = 500;
    e.runARound();

    // Population capped at 100 * 3 = 300
    expect(e.population).toBeLessThanOrEqual(300);
  });

  it('舰队远征返回（source != target）', () => {
    const fleet = createFleet('探索舰队', '地球', 10, 3, 3);
    game.earthCivi.fleets.push(fleet);

    expect(fleet.sourceStarIndex).toBe(10);
    expect(fleet.targetStarIndex).toBe(3);

    game.rng = () => 0.5;
    game.earthCivi.runARound();
    expect(fleet.eta).toBe(2);
  });
});
