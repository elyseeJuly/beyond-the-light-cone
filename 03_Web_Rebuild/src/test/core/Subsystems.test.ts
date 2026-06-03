import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';

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
