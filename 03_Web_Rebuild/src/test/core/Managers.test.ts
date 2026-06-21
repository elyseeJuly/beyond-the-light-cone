import { describe, it, expect, beforeEach } from 'vitest';
import { PersonManager } from '../../core/PersonManager';
import { StarManager } from '../../core/StarManager';
import { WeaponManager } from '../../core/WeaponManager';
import { StarArea } from '../../types/enums';
import { EarthCivilization } from '../../core/EarthCivilization';
import { Game } from '../../core/Game';

describe('PersonManager', () => {
  let pm: PersonManager;

  beforeEach(() => {
    pm = new PersonManager();
  });

  it('初始化加载人物数据', () => {
    expect(pm.persons.size).toBeGreaterThan(0);
  });

  it('初始白名单人物可用', () => {
    const whitelist = ['丁仪', '汪淼', '常伟思', '大史', '雷志成', '杨卫宁', '叶文洁'];
    for (const name of whitelist) {
      expect(pm.availablePersons.has(name)).toBe(true);
    }
  });

  it('getPerson 获取人物属性', () => {
    const p = pm.getPerson('丁仪');
    expect(p).toBeDefined();
    expect(p?.name).toBe('丁仪');
    expect(typeof p?.science).toBe('number');
    expect(typeof p?.leadership).toBe('number');
  });

  it('getPerson 不存在返回undefined', () => {
    expect(pm.getPerson('不存在的人物')).toBeUndefined();
  });

  it('getAllPersons 返回所有人物', () => {
    const all = pm.getAllPersons();
    expect(all.length).toBe(pm.persons.size);
  });

  it('unlockPerson 解锁新人物', () => {
    const name = '罗辑';
    expect(pm.availablePersons.has(name)).toBe(false);
    pm.unlockPerson(name);
    expect(pm.availablePersons.has(name)).toBe(true);
  });

  it('unlockPerson 重复解锁不出错', () => {
    pm.unlockPerson('丁仪');
    expect(pm.availablePersons.has('丁仪')).toBe(true);
  });

  it('unlockPerson 不存在的人物无效果', () => {
    expect(() => pm.unlockPerson('不存在')).not.toThrow();
    expect(pm.availablePersons.has('不存在')).toBe(false);
  });

  it('人物属性在合理范围内', () => {
    const all = pm.getAllPersons();
    for (const p of all) {
      expect(p.science).toBeGreaterThanOrEqual(0);
      expect(p.leadership).toBeGreaterThanOrEqual(0);
      expect(p.economy).toBeGreaterThanOrEqual(0);
      expect(p.army).toBeGreaterThanOrEqual(0);
      expect(p.social).toBeGreaterThanOrEqual(0);
      expect(p.art).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('StarManager', () => {
  let sm: StarManager;

  beforeEach(() => {
    sm = new StarManager();
  });

  it('初始化加载星球数据', () => {
    expect(sm.stars.size).toBeGreaterThan(0);
  });

  it('getStar 获取地球(Index 3)', () => {
    const earth = sm.getStar(3);
    expect(earth).toBeDefined();
    expect(earth?.name).toBe('地球');
    expect(earth?.belongToCivi).toBe('地球');
    expect(earth?.found).toBe(true);
    expect(earth?.populationLimit).toBe(1000);
  });

  it('getStar 不存在返回undefined', () => {
    expect(sm.getStar(999999)).toBeUndefined();
  });

  it('getAllStars 返回所有星球', () => {
    const all = sm.getAllStars();
    expect(all.length).toBeGreaterThanOrEqual(10);
  });

  it('getStarsByArea 太阳系(0-10)', () => {
    const solar = sm.getStarsByArea(StarArea.SOLARSYSTEM);
    for (const star of solar) {
      expect(star.index).toBeLessThanOrEqual(10);
    }
  });

  it('getStarsByArea 50光年(11-100)', () => {
    const ly50 = sm.getStarsByArea(StarArea.LIGHTYEAR_50);
    for (const star of ly50) {
      expect(star.index).toBeGreaterThan(10);
      expect(star.index).toBeLessThanOrEqual(100);
    }
  });

  it('getStarsByArea 1万光年(101-200)', () => {
    const ly1w = sm.getStarsByArea(StarArea.LIGHTYEAR_1W);
    for (const star of ly1w) {
      expect(star.index).toBeGreaterThan(100);
      expect(star.index).toBeLessThanOrEqual(200);
    }
  });

  it('getStarsByArea 银河系(201-1000)', () => {
    const galaxy = sm.getStarsByArea(StarArea.GALAXY);
    for (const star of galaxy) {
      expect(star.index).toBeGreaterThan(200);
      expect(star.index).toBeLessThanOrEqual(1000);
    }
  });

  it('随机生成的星球有合理资源值', () => {
    const galaxy = sm.getStarsByArea(StarArea.GALAXY);
    for (const star of galaxy) {
      expect(star.totalResource).toBeGreaterThanOrEqual(50);
      expect(star.currentResource).toBeGreaterThanOrEqual(50);
    }
  });
});

describe('WeaponManager', () => {
  let wm: WeaponManager;

  beforeEach(() => {
    wm = new WeaponManager();
  });

  it('初始化加载武器数据', () => {
    expect(wm.prototypes.size).toBeGreaterThan(0);
  });

  it('getPrototype 获取已存在的武器', () => {
    const proto = wm.getPrototype('恒星级战舰');
    expect(proto).toBeDefined();
    expect(proto?.type).toBeDefined();
    expect(proto?.attack).toBeGreaterThan(0);
  });

  it('getPrototype 不存在返回undefined', () => {
    expect(wm.getPrototype('不存在的武器')).toBeUndefined();
  });
});

// ==================== PersonManager 扩展测试 ====================

describe('PersonManager - 初始化', () => {
  let pm: PersonManager;

  beforeEach(() => {
    pm = new PersonManager();
  });

  it('加载人数与数据文件一致 (35 人)', () => {
    expect(pm.persons.size).toBe(35);
  });

  it('每个人物都有非空名称', () => {
    const all = pm.getAllPersons();
    for (const p of all) {
      expect(p.name).toBeTruthy();
      expect(typeof p.name).toBe('string');
    }
  });

  it('每个人物都有 faceFile 字段', () => {
    const all = pm.getAllPersons();
    for (const p of all) {
      expect(p.faceFile).toBeDefined();
      expect(typeof p.faceFile).toBe('string');
    }
  });

  it('所有 7 项属性值在 0-100 范围内', () => {
    const stats = ['treachery', 'science', 'art', 'economy', 'army', 'leadership', 'social'] as const;
    const all = pm.getAllPersons();
    for (const p of all) {
      for (const stat of stats) {
        const val = p[stat] as number;
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('PersonManager - 解锁/白名单', () => {
  let pm: PersonManager;

  beforeEach(() => {
    pm = new PersonManager();
  });

  it('非白名单人物初始为锁定状态', () => {
    const nonWhitelist = ['罗辑', '章北海', '程心', '维德', '云天明'];
    for (const name of nonWhitelist) {
      expect(pm.availablePersons.has(name)).toBe(false);
    }
  });

  it('unlockPerson 将锁定人物变为可用', () => {
    expect(pm.availablePersons.has('罗辑')).toBe(false);
    pm.unlockPerson('罗辑');
    expect(pm.availablePersons.has('罗辑')).toBe(true);
  });

  it('可以连续解锁多个人物', () => {
    const names = ['罗辑', '章北海', '程心'];
    for (const name of names) {
      pm.unlockPerson(name);
    }
    for (const name of names) {
      expect(pm.availablePersons.has(name)).toBe(true);
    }
  });

  it('解锁人物不影响白名单人物状态', () => {
    pm.unlockPerson('罗辑');
    expect(pm.availablePersons.has('罗辑')).toBe(true);
    expect(pm.availablePersons.has('丁仪')).toBe(true); // 白名单仍可用
    expect(pm.availablePersons.has('章北海')).toBe(false); // 其他非白名单仍锁定
  });
});

describe('PersonManager - 属性验证', () => {
  let pm: PersonManager;

  beforeEach(() => {
    pm = new PersonManager();
  });

  it('各人物属性值与数据文件一致', () => {
    const p1 = pm.getPerson('叶文洁')!;
    expect(p1.science).toBe(98);
    expect(p1.treachery).toBe(70);
    expect(p1.social).toBe(45);

    const p2 = pm.getPerson('大史')!;
    expect(p2.army).toBe(85);
    expect(p2.social).toBe(95);
    expect(p2.science).toBe(10);

    const p3 = pm.getPerson('霍金')!;
    expect(p3.science).toBe(99);
    expect(p3.army).toBe(5);
  });

  it('人物属性可直接修改', () => {
    const p = pm.getPerson('丁仪')!;
    expect(p.science).toBe(95);
    p.science = 100;
    expect(p.science).toBe(100);
  });

  it('存在某项属性为 0 的人物', () => {
    const all = pm.getAllPersons();
    const hasZeroTreachery = all.some(p => p.treachery === 0);
    expect(hasZeroTreachery).toBe(true);
  });

  it('每个人物都包含全部 7 项属性且为数字', () => {
    const statKeys = ['treachery', 'science', 'art', 'economy', 'army', 'leadership', 'social'];
    const all = pm.getAllPersons();
    for (const p of all) {
      for (const key of statKeys) {
        expect(p).toHaveProperty(key);
        expect(typeof (p as any)[key]).toBe('number');
      }
    }
  });
});

describe('PersonManager - 面壁者/执剑人集成', () => {
  let pm: PersonManager;

  beforeEach(() => {
    pm = new PersonManager();
  });

  it('可将人物设置为面壁者', () => {
    const earth = new EarthCivilization();
    earth.addWallfacer('罗辑');
    expect(earth.isWallfacer('罗辑')).toBe(true);
  });

  it('isWallfacer 对非面壁者返回 false', () => {
    const earth = new EarthCivilization();
    earth.addWallfacer('罗辑');
    expect(earth.isWallfacer('丁仪')).toBe(false);
    expect(earth.isWallfacer('不存在')).toBe(false);
  });

  it('可任命执剑人', () => {
    const earth = new EarthCivilization();
    earth.setSwordholder('罗辑');
    expect(earth.swordholder).toBe('罗辑');
    expect(earth.swordholderHandoverTurn).toBe(true);
  });

  it('执剑人可卸任（设为 null）', () => {
    const earth = new EarthCivilization();
    earth.setSwordholder('罗辑');
    expect(earth.swordholder).toBe('罗辑');
    earth.setSwordholder(null);
    expect(earth.swordholder).toBeNull();
  });

  it('PersonManager 与面壁者系统集成：解锁后可在面壁者系统中使用', () => {
    pm.unlockPerson('罗辑');
    expect(pm.availablePersons.has('罗辑')).toBe(true);
    expect(pm.getPerson('罗辑')).toBeDefined();

    const earth = new EarthCivilization();
    earth.addWallfacer('罗辑');
    expect(earth.isWallfacer('罗辑')).toBe(true);

    const person = pm.getPerson('罗辑');
    expect(person!.name).toBe('罗辑');
    expect(person!.leadership).toBe(85);
  });

  it('Game 集成：设置执剑人后 PersonManager 可查询到', () => {
    // 使用完整 Game 实例验证 PersonManager 与执剑人系统的关联
    const game = new Game();
    game.personManager.unlockPerson('罗辑');
    game.earthCivi.setSwordholder('罗辑');
    expect(game.earthCivi.swordholder).toBe('罗辑');
    const person = game.personManager.getPerson(game.earthCivi.swordholder!);
    expect(person).toBeDefined();
    expect(person!.name).toBe('罗辑');
  });
});

describe('PersonManager - 边界情况', () => {
  let pm: PersonManager;

  beforeEach(() => {
    pm = new PersonManager();
  });

  it('初始白名单恰好 7 人', () => {
    expect(pm.availablePersons.size).toBe(7);
  });

  it('所有人物 faceFile 非空字符串', () => {
    const all = pm.getAllPersons();
    for (const p of all) {
      expect(p.faceFile).toBeTruthy();
    }
  });

  it('不存在的人物返回 undefined', () => {
    expect(pm.getPerson('')).toBeUndefined();
    expect(pm.getPerson('张三')).toBeUndefined();
    expect(pm.getPerson('不存在的人物')).toBeUndefined();
  });

  it('getAllPersons 返回数组且修改不影响内部 Map', () => {
    const all = pm.getAllPersons();
    expect(Array.isArray(all)).toBe(true);
    const originalSize = all.length;
    all.pop();
    expect(pm.persons.size).toBe(originalSize);
  });
});