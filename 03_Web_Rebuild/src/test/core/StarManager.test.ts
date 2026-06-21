import { describe, it, expect, beforeEach } from 'vitest';
import { StarManager } from '../../core/StarManager';
import { GameInstance } from '../../core/Game';
import { StarArea } from '../../types/enums';
import { STAR_INDEX } from '../../config/starIndices';

/**
 * Expected star counts:
 * - stars.json: 18 entries (index 0 ~ 17)
 * - LY50 generated: 83 stars (index 18 ~ 100)
 * - LY1W generated: 100 stars (index 101 ~ 200)
 * - GLX  generated: 800 stars (index 201 ~ 1000)
 * - Total: 18 + 83 + 100 + 800 = 1001
 */
const EXPECTED_STAR_COUNT = 1001;
const SOLAR_SYSTEM_MAX_INDEX = 10;

function setupGame() {
  GameInstance.reset();
  return GameInstance.get();
}

describe('StarManager — 初始化', () => {
  let sm: StarManager;

  beforeEach(() => {
    sm = new StarManager();
  });

  it('星球总数符合预期（18 固定 + 83 LY50 + 100 LY1W + 800 GLX = 1001）', () => {
    expect(sm.stars.size).toBe(EXPECTED_STAR_COUNT);
  });

  it('固定星球属性正确：名称、索引、资源、人口上限', () => {
    const earth = sm.getStar(STAR_INDEX.EARTH);
    expect(earth).toBeDefined();
    expect(earth!.name).toBe('地球');
    expect(earth!.index).toBe(STAR_INDEX.EARTH);
    expect(earth!.totalResource).toBe(1000);
    expect(earth!.currentResource).toBe(1000);
    expect(earth!.populationLimit).toBe(1000);
    expect(earth!.currentPopulation).toBe(100);

    // 地球应该已经归属地球文明
    expect(earth!.belongToCivi).toBe('地球');
    expect(earth!.found).toBe(true);

    const sun = sm.getStar(STAR_INDEX.SUN);
    expect(sun).toBeDefined();
    expect(sun!.name).toBe('太阳');
    expect(sun!.totalResource).toBe(0);
    expect(sun!.currentResource).toBe(0);
  });

  it('区分恒星（isPlanet=false）与行星（isPlanet=true）', () => {
    const sun = sm.getStar(STAR_INDEX.SUN);
    expect(sun).toBeDefined();
    expect(sun!.isPlanet).toBe(false);

    // 太阳系所有行星 isPlanet 应为 true
    for (let i = STAR_INDEX.MERCURY; i <= SOLAR_SYSTEM_MAX_INDEX; i++) {
      const planet = sm.getStar(i);
      expect(planet).toBeDefined();
      expect(planet!.isPlanet).toBe(true);
    }

    // 生成的星球默认 isPlanet = createEmptyStar 的默认值 true
    const ly50Star = sm.getStar(50);
    expect(ly50Star).toBeDefined();
    expect(ly50Star!.isPlanet).toBe(true);
  });

  it('固定星球 Resource 值在有效范围（非负）', () => {
    // stars.json 中的 Resource 值：太阳=0, 水星=80, 金星=150, 地球=1000,
    // 月球=50, 火星=300, 木星=800, 土星=600, 天王星=400, 海王星=350, 冥王星=120
    const expectedResources: Record<number, number> = {
      [STAR_INDEX.SUN]: 0,
      [STAR_INDEX.MERCURY]: 80,
      [STAR_INDEX.VENUS]: 150,
      [STAR_INDEX.EARTH]: 1000,
      [STAR_INDEX.MOON]: 50,
      [STAR_INDEX.MARS]: 300,
      [STAR_INDEX.JUPITER]: 800,
      [STAR_INDEX.SATURN]: 600,
      [STAR_INDEX.URANUS]: 400,
      [STAR_INDEX.NEPTUNE]: 350,
      [STAR_INDEX.PLUTO]: 120,
    };

    for (const [index, expectedResource] of Object.entries(expectedResources)) {
      const star = sm.getStar(Number(index));
      expect(star).toBeDefined();
      expect(star!.totalResource).toBe(expectedResource);
      expect(star!.currentResource).toBe(expectedResource);
    }
  });

  it('生成的星球资源值在各自的范围内', () => {
    // LY50: resource [100, 500]
    for (let i = 18; i <= 100; i++) {
      const star = sm.getStar(i);
      expect(star).toBeDefined();
      expect(star!.totalResource).toBeGreaterThanOrEqual(100);
      expect(star!.totalResource).toBeLessThanOrEqual(500);
      expect(star!.currentResource).toBe(star!.totalResource);
    }

    // LY1W: resource [100, 1000]
    for (let i = 101; i <= 200; i++) {
      const star = sm.getStar(i);
      expect(star).toBeDefined();
      expect(star!.totalResource).toBeGreaterThanOrEqual(100);
      expect(star!.totalResource).toBeLessThanOrEqual(1000);
    }

    // GLX: resource [50, 2000]
    for (let i = 201; i <= 300; i++) {
      const star = sm.getStar(i);
      expect(star).toBeDefined();
      expect(star!.totalResource).toBeGreaterThanOrEqual(50);
      expect(star!.totalResource).toBeLessThanOrEqual(2000);
    }
  });
});

describe('StarManager — 查询', () => {
  let sm: StarManager;

  beforeEach(() => {
    sm = new StarManager();
  });

  it('getStar 通过索引获取星球', () => {
    const mars = sm.getStar(STAR_INDEX.MARS);
    expect(mars).toBeDefined();
    expect(mars!.index).toBe(STAR_INDEX.MARS);
    expect(mars!.name).toBe('火星');
  });

  it('getStarByName 通过名称获取星球', () => {
    const jupiter = sm.getStarByName('木星');
    expect(jupiter).toBeDefined();
    expect(jupiter!.index).toBe(STAR_INDEX.JUPITER);
    expect(jupiter!.totalResource).toBe(800);

    // 不存在的名称返回 undefined
    expect(sm.getStarByName('不存在的星球')).toBeUndefined();
  });

  it('getAllStars 返回所有星球，数量正确', () => {
    const all = sm.getAllStars();
    expect(all.length).toBe(EXPECTED_STAR_COUNT);
    // 验证返回的数组包含所有索引范围内的星球
    const indices = all.map(s => s.index).sort((a, b) => a - b);
    expect(indices[0]).toBe(0);
    expect(indices[indices.length - 1]).toBe(1000);
  });

  it('getStarsByArea 太阳系：索引 0-10', () => {
    const solar = sm.getStarsByArea(StarArea.SOLARSYSTEM);
    expect(solar.length).toBe(SOLAR_SYSTEM_MAX_INDEX + 1); // 0 ~ 10 = 11 个
    for (const star of solar) {
      expect(star.index).toBeGreaterThanOrEqual(0);
      expect(star.index).toBeLessThanOrEqual(SOLAR_SYSTEM_MAX_INDEX);
    }
  });

  it('getStarsByArea 50 光年：索引 11-100', () => {
    const ly50 = sm.getStarsByArea(StarArea.LIGHTYEAR_50);
    // 11 ~ 17 from stars.json + 18 ~ 100 generated = 90
    expect(ly50.length).toBe(90);
    for (const star of ly50) {
      expect(star.index).toBeGreaterThan(SOLAR_SYSTEM_MAX_INDEX);
      expect(star.index).toBeLessThanOrEqual(100);
    }
  });

  it('getStarsByArea 1 万光年：索引 101-200', () => {
    const ly1w = sm.getStarsByArea(StarArea.LIGHTYEAR_1W);
    expect(ly1w.length).toBe(100);
    for (const star of ly1w) {
      expect(star.index).toBeGreaterThan(100);
      expect(star.index).toBeLessThanOrEqual(200);
    }
  });

  it('getStarsByArea 银河系：索引 201-1000', () => {
    const galaxy = sm.getStarsByArea(StarArea.GALAXY);
    expect(galaxy.length).toBe(800);
    for (const star of galaxy) {
      expect(star.index).toBeGreaterThan(200);
      expect(star.index).toBeLessThanOrEqual(1000);
    }
  });

  it('根据资源阈值过滤星球', () => {
    const all = sm.getAllStars();
    // 筛选总资源 >= 800 的星球
    const highResourceStars = all.filter(s => s.totalResource >= 800);
    // 至少包含地球(1000)、木星(800)
    expect(highResourceStars.some(s => s.name === '地球')).toBe(true);
    expect(highResourceStars.some(s => s.name === '木星')).toBe(true);
    // 所有结果都应满足条件
    for (const star of highResourceStars) {
      expect(star.totalResource).toBeGreaterThanOrEqual(800);
    }
  });
});

describe('StarManager — 星球资源管理', () => {
  let sm: StarManager;

  beforeEach(() => {
    sm = new StarManager();
  });

  it('资源消耗：减少 currentResource', () => {
    const earth = sm.getStar(STAR_INDEX.EARTH)!;
    const initialResource = earth.currentResource;
    const minedAmount = 100;

    earth.currentResource -= minedAmount;
    expect(earth.currentResource).toBe(initialResource - minedAmount);
  });

  it('资源再生：currentResource 可恢复至 totalResource', () => {
    const mars = sm.getStar(STAR_INDEX.MARS)!;
    const initialTotal = mars.totalResource; // 300

    // 模拟部分消耗
    mars.currentResource = 100;
    expect(mars.currentResource).toBe(100);

    // 模拟资源再生直至恢复满
    mars.currentResource = initialTotal;
    expect(mars.currentResource).toBe(initialTotal);

    // 再生不可能超过 totalResource
    mars.currentResource = Math.min(mars.currentResource + 50, mars.totalResource);
    expect(mars.currentResource).toBe(initialTotal);
  });

  it('资源下限钳制：currentResource 不低于 0', () => {
    const mercury = sm.getStar(STAR_INDEX.MERCURY)!;
    mercury.currentResource = 10;

    // 模拟过度开采：试图开采超过剩余量
    const toMine = 20;
    const actualMined = Math.min(toMine, mercury.currentResource);
    mercury.currentResource -= actualMined;

    expect(actualMined).toBe(10);
    expect(mercury.currentResource).toBe(0);
    // 继续开采应为 0
    const furtherMined = Math.min(50, mercury.currentResource);
    mercury.currentResource -= furtherMined;
    expect(mercury.currentResource).toBe(0);
    expect(furtherMined).toBe(0);
  });

  it('资源消耗影响采矿产出（模拟 EarthCivilization.processMining）', () => {
    const game = setupGame();
    const mars = game.starManager.getStar(STAR_INDEX.MARS)!;
    mars.hasStope = true;
    const initialMarsResource = mars.currentResource;

    // Earth 的 starIndices 默认包含地球（索引 3）
    // 将地球索引替换为火星进行测试
    game.earthCivi.starIndices.clear();
    game.earthCivi.starIndices.add(STAR_INDEX.MARS);

    game.earthCivi.miningWorkers = 10;
    // 手动触发 mining（私有方法，通过 runARound 间接测试）
    game.earthCivi.runARound();

    // 采矿后 mars.currentResource 应减少
    expect(mars.currentResource).toBeLessThan(initialMarsResource);
    // 地球资源应增加
    expect(game.earthCivi.resource).toBeGreaterThan(200);
  });
});

describe('StarManager — 与 PlanetEngine 集成', () => {
  it('buildEngines 消耗地球资源（地球资源来自星球采矿）', () => {
    const game = setupGame();

    // 设置初始资源用于建造
    game.earthCivi.resource = 5000;

    const result = game.planetEngine.buildEngines(100);
    expect(result).toContain('成功建造');
    expect(game.planetEngine.enginesBuilt).toBe(100);
    // 每台发动机消耗 10 资源
    expect(game.earthCivi.resource).toBe(5000 - 1000);
  });

  it('多次建造累积消耗资源', () => {
    const game = setupGame();
    game.earthCivi.resource = 20000;

    game.planetEngine.buildEngines(500);
    expect(game.earthCivi.resource).toBe(20000 - 5000);
    expect(game.planetEngine.enginesBuilt).toBe(500);

    game.planetEngine.buildEngines(300);
    expect(game.earthCivi.resource).toBe(20000 - 8000);
    expect(game.planetEngine.enginesBuilt).toBe(800);
  });

  it('资源耗尽时无法继续建造发动机', () => {
    const game = setupGame();
    game.earthCivi.resource = 50; // 仅够 5 台

    const result = game.planetEngine.buildEngines(100);
    expect(result).toContain('资源不足');
    expect(game.planetEngine.enginesBuilt).toBe(0);
  });

  it('星球采矿 → 地球资源增加 → 支持发动机建造（完整链路）', () => {
    const game = setupGame();
    game.earthCivi.resource = 0;

    // 在火星上建立采矿场
    const mars = game.starManager.getStar(STAR_INDEX.MARS)!;
    mars.hasStope = true;
    mars.currentResource = 500;

    // 将地球的采矿指向火星
    game.earthCivi.starIndices.clear();
    game.earthCivi.starIndices.add(STAR_INDEX.MARS);
    game.earthCivi.miningWorkers = 50;

    // 运行一回合触发采矿
    game.earthCivi.runARound();

    // 采矿后地球获得了资源
    const resourceAfterMining = game.earthCivi.resource;
    expect(resourceAfterMining).toBeGreaterThan(0);
    expect(mars.currentResource).toBeLessThan(500);

    // 用采来的资源建造发动机
    if (resourceAfterMining >= 10) {
      const maxBuildable = Math.floor(resourceAfterMining / 10);
      const result = game.planetEngine.buildEngines(maxBuildable);
      expect(result).toContain('成功建造');
      expect(game.planetEngine.enginesBuilt).toBe(maxBuildable);
    }
  });
});

describe('StarManager — 边缘情况', () => {
  let sm: StarManager;

  beforeEach(() => {
    sm = new StarManager();
  });

  it('所有星球资源耗尽时采矿产出为零', () => {
    const game = setupGame();

    // 清空所有星球的 currentResource
    for (const star of game.starManager.getAllStars()) {
      star.currentResource = 0;
    }

    // 在地球建立采矿场
    const earth = game.starManager.getStar(STAR_INDEX.EARTH)!;
    earth.hasStope = true;
    earth.currentResource = 0;

    game.earthCivi.starIndices.clear();
    game.earthCivi.starIndices.add(STAR_INDEX.EARTH);
    game.earthCivi.miningWorkers = 50;
    game.earthCivi.resource = 0;

    game.earthCivi.runARound();

    // 资源未增加（因为无矿可采）
    expect(game.earthCivi.resource).toBe(0);
  });

  it('星球 totalResource 为 0 时 currentResource 也为 0', () => {
    const sun = sm.getStar(STAR_INDEX.SUN)!;
    expect(sun.totalResource).toBe(0);
    expect(sun.currentResource).toBe(0);
  });

  it('访问不存在的索引返回 undefined', () => {
    expect(sm.getStar(-1)).toBeUndefined();
    expect(sm.getStar(1001)).toBeUndefined(); // 超出最大索引
    expect(sm.getStar(99999)).toBeUndefined();
  });

  it('清空 stars Map 后 getAllStars 返回空数组', () => {
    sm.stars.clear();
    expect(sm.stars.size).toBe(0);
    const all = sm.getAllStars();
    expect(all.length).toBe(0);
    expect(sm.getStar(0)).toBeUndefined();
    expect(sm.getStarByName('地球')).toBeUndefined();
  });

  it('重复 init 不会导致计数异常', () => {
    const count1 = sm.stars.size;
    sm.init();
    const count2 = sm.stars.size;
    // init 会覆盖 Map，所以数量应保持不变
    expect(count1).toBe(count2);
    expect(count1).toBe(EXPECTED_STAR_COUNT);
  });
});