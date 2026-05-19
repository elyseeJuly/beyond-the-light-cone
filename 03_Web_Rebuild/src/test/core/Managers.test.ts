import { describe, it, expect, beforeEach } from 'vitest';
import { PersonManager } from '../../core/PersonManager';
import { StarManager } from '../../core/StarManager';
import { WeaponManager } from '../../core/WeaponManager';
import { StarArea } from '../../types/enums';

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