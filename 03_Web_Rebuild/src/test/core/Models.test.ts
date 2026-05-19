import { describe, it, expect, beforeEach } from 'vitest';
import { TecTree, createTecTreeNode } from '../../core/TecTree';
import { TecTreeType } from '../../types/enums';
import { createDepartment, calculateDepartmentEfficiency } from '../../core/Department';
import { DepartmentType } from '../../types/enums';
import { createBarback, isBarbackCompleted, runBarbackRound } from '../../core/Barback';
import { createBuilding, isBuildingCompleted, runBuildingRound, BuildingType } from '../../core/Building';
import { isWeaponFinished, runWeaponRound } from '../../core/Weapon';
import { WeaponPrototype, WeaponInstance } from '../../core/Weapon';
import { createFleet } from '../../core/Fleet';
import { createGameEvent } from '../../core/GameEvent';
import { EventType, EventEffect } from '../../types/enums';
import { createEmptyStar } from '../../core/Star';
import { generateStars } from '../../core/StarGenerator';
import { Civilization } from '../../core/Civilization';

describe('TecTreeNode', () => {
  it('创建节点默认未完成且未研究中', () => {
    const node = createTecTreeNode('测试科技', 100, 50, '测试描述');
    expect(node.name).toBe('测试科技');
    expect(node.finished).toBe(false);
    expect(node.inResearch).toBe(false);
    expect(node.totalWorkload).toBe(100);
    expect(node.currentWorkload).toBe(0);
    expect(node.cost).toBe(50);
    expect(node.tip).toBe('测试描述');
    expect(node.parentName).toBeNull();
    expect(node.childrenNames).toEqual([]);
  });

  it('创建节点可指定父节点', () => {
    const node = createTecTreeNode('子科技', 200, 80, '子描述', '父科技');
    expect(node.parentName).toBe('父科技');
  });
});

describe('TecTree', () => {
  let tree: TecTree;

  beforeEach(() => {
    tree = new TecTree(TecTreeType.PHYSICS);
  });

  it('创建空树', () => {
    expect(tree.type).toBe(TecTreeType.PHYSICS);
    expect(tree.nodes.size).toBe(0);
    expect(tree.rootNodeName).toBeNull();
  });

  it('添加根节点', () => {
    tree.addNode(null, '根科技', false, 100, 50, '根描述');
    expect(tree.nodes.size).toBe(1);
    expect(tree.rootNodeName).toBe('根科技');
    expect(tree.getNode('根科技')?.name).toBe('根科技');
  });

  it('添加子节点建立父子关系', () => {
    tree.addNode(null, '根科技', false, 100, 50, '根描述');
    tree.addNode('根科技', '子科技', false, 200, 80, '子描述');
    const parent = tree.getNode('根科技');
    expect(parent?.childrenNames).toContain('子科技');
    const child = tree.getNode('子科技');
    expect(child?.parentName).toBe('根科技');
  });

  it('添加空字符串父节点视为根节点', () => {
    tree.addNode('', '根科技2', false, 100, 50, '描述');
    expect(tree.rootNodeName).toBe('根科技2');
  });

  it('isFinished 检测完成状态', () => {
    tree.addNode(null, '已结束', true, 100, 50, '');
    tree.addNode(null, '未结束', false, 100, 50, '');
    expect(tree.isFinished('已结束')).toBe(true);
    expect(tree.isFinished('未结束')).toBe(false);
    expect(tree.isFinished('不存在')).toBe(false);
  });

  it('多级科技树结构', () => {
    tree.addNode(null, 'L1', false, 100, 10, '');
    tree.addNode('L1', 'L2-A', false, 150, 20, '');
    tree.addNode('L1', 'L2-B', false, 150, 20, '');
    tree.addNode('L2-A', 'L3', false, 200, 30, '');
    expect(tree.nodes.size).toBe(4);
    expect(tree.getNode('L1')?.childrenNames).toEqual(['L2-A', 'L2-B']);
  });
});

describe('Department', () => {
  it('createDepartment 创建部门', () => {
    const dept = createDepartment(DepartmentType.ECONOMY, '经济部');
    expect(dept.type).toBe(DepartmentType.ECONOMY);
    expect(dept.name).toBe('经济部');
    expect(dept.leaderName).toBeNull();
    expect(dept.workEfficiency).toBe(0);
  });

  it('calculateDepartmentEfficiency 计算效率', () => {
    expect(calculateDepartmentEfficiency(50, 30)).toBe(40);
    expect(calculateDepartmentEfficiency(0, 0)).toBe(0);
    expect(calculateDepartmentEfficiency(100, 100)).toBe(100);
  });
});

describe('Barback', () => {
  it('createBarback 创建军营', () => {
    const bb = createBarback('test-barback', 3);
    expect(bb.id).toBe('test-barback');
    expect(bb.planetIndex).toBe(3);
    expect(bb.soldierCount).toBe(0);
    expect(bb.weapons).toEqual([]);
    expect(bb.totalBuild).toBe(100);
    expect(bb.currentBuild).toBe(0);
    expect(bb.buildPerRound).toBe(10);
    expect(bb.isFriend).toBe(false);
  });

  it('isBarbackCompleted 检测完成状态', () => {
    const bb = createBarback('test', 1);
    expect(isBarbackCompleted(bb)).toBe(false);
    bb.currentBuild = 100;
    expect(isBarbackCompleted(bb)).toBe(true);
    bb.currentBuild = 200;
    expect(isBarbackCompleted(bb)).toBe(true);
  });

  it('runBarbackRound 推进建设进度', () => {
    const bb = createBarback('test', 1);
    runBarbackRound(bb);
    expect(bb.currentBuild).toBe(10);
    runBarbackRound(bb);
    expect(bb.currentBuild).toBe(20);
  });

  it('runBarbackRound 完成后不溢出', () => {
    const bb = createBarback('test', 1);
    bb.currentBuild = 95;
    runBarbackRound(bb);
    expect(bb.currentBuild).toBe(100);
  });

  it('runBarbackRound 完成后不再增长', () => {
    const bb = createBarback('test', 1);
    bb.currentBuild = 100;
    runBarbackRound(bb);
    expect(bb.currentBuild).toBe(100);
  });
});

describe('Building', () => {
  it('createBuilding 创建采矿场', () => {
    const b = createBuilding(BuildingType.STOPE);
    expect(b.type).toBe('stope');
    expect(b.totalBuild).toBe(100);
    expect(b.currentBuild).toBe(0);
  });

  it('createBuilding 创建加工厂需要200工作量', () => {
    const b = createBuilding(BuildingType.FACTORY);
    expect(b.totalBuild).toBe(200);
  });

  it('createBuilding 创建太空城市', () => {
    const b = createBuilding(BuildingType.CITY);
    expect(b.totalBuild).toBe(100);
  });

  it('isBuildingCompleted 检测完成状态', () => {
    const b = createBuilding(BuildingType.STOPE);
    expect(isBuildingCompleted(b)).toBe(false);
    b.currentBuild = 100;
    expect(isBuildingCompleted(b)).toBe(true);
  });

  it('runBuildingRound 推进建设进度', () => {
    const b = createBuilding(BuildingType.STOPE);
    runBuildingRound(b);
    expect(b.currentBuild).toBe(10);
  });

  it('runBuildingRound 不溢出', () => {
    const b = createBuilding(BuildingType.STOPE);
    b.currentBuild = 95;
    runBuildingRound(b);
    expect(b.currentBuild).toBe(100);
  });
});

describe('Weapon', () => {
  const proto: WeaponPrototype = {
    name: '恒星级战舰',
    type: 0,
    dependTecType: TecTreeType.MILITARY,
    dependTecName: '小行星级氢弹',
    attack: 50,
    hp: 200,
    totalBuild: 100,
    buildPerRound: 10,
    cost: 30,
    priority: 1,
    needCiviLevel: 0,
  };

  it('isWeaponFinished 检测完成', () => {
    const inst: WeaponInstance = { weaponName: '恒星级战舰', currentBuild: 50 };
    expect(isWeaponFinished(inst, proto)).toBe(false);
    inst.currentBuild = 100;
    expect(isWeaponFinished(inst, proto)).toBe(true);
  });

  it('runWeaponRound 推进建造', () => {
    const inst: WeaponInstance = { weaponName: '恒星级战舰', currentBuild: 30 };
    runWeaponRound(inst, proto);
    expect(inst.currentBuild).toBe(40);
  });

  it('runWeaponRound 完成后不溢出', () => {
    const inst: WeaponInstance = { weaponName: '恒星级战舰', currentBuild: 95 };
    runWeaponRound(inst, proto);
    expect(inst.currentBuild).toBe(100);
  });
});

describe('Fleet', () => {
  it('createFleet 创建舰队', () => {
    const fleet = createFleet('远征军', '地球', 3, 101, 5);
    expect(fleet.name).toBe('远征军');
    expect(fleet.belongToCivi).toBe('地球');
    expect(fleet.sourceStarIndex).toBe(3);
    expect(fleet.targetStarIndex).toBe(101);
    expect(fleet.totalEta).toBe(5);
    expect(fleet.eta).toBe(5);
    expect(fleet.leaderName).toBeNull();
    expect(fleet.weapons).toEqual([]);
    expect(fleet.id).toContain('fleet_');
  });
});

describe('GameEvent', () => {
  it('createGameEvent 创建事件', () => {
    const event = createGameEvent(
      '测试事件', EventType.INYEAR, 10, '这是测试事件',
      EventEffect.ADDPOP, [], 'test_001'
    );
    expect(event.name).toBe('测试事件');
    expect(event.type).toBe(EventType.INYEAR);
    expect(event.inYear).toBe(10);
    expect(event.tip).toBe('这是测试事件');
    expect(event.effect).toBe(EventEffect.ADDPOP);
    expect(event.hasTriggered).toBe(false);
    expect(event.dialogNodes).toEqual([]);
    expect(event.id).toBe('test_001');
  });

  it('createGameEvent 带对话节点', () => {
    const event = createGameEvent(
      '对话事件', EventType.RANDOM, 5, '提示',
      EventEffect.NONE,
      [{ speakerName: '测试员', content: '你好' }]
    );
    expect(event.dialogNodes).toHaveLength(1);
    expect(event.dialogNodes[0].speakerName).toBe('测试员');
  });

  it('createGameEvent 带触发条件和选项', () => {
    const event = createGameEvent(
      '条件事件', EventType.RANDOM, 20, '条件事件',
      EventEffect.ADDECONEMY, [],
      'cond_001',
      { epoch: 'CRISIS', probability: 0.5 },
      [{ label: '选择A' }, { label: '选择B' }]
    );
    expect(event.triggerCondition?.epoch).toBe('CRISIS');
    expect(event.triggerCondition?.probability).toBe(0.5);
    expect(event.choices).toHaveLength(2);
  });
});

describe('Star', () => {
  it('createEmptyStar 创建空白星球', () => {
    const star = createEmptyStar(5);
    expect(star.index).toBe(5);
    expect(star.name).toBe('Star 5');
    expect(star.isPlanet).toBe(true);
    expect(star.exist).toBe(true);
    expect(star.belongToCivi).toBe('');
    expect(star.found).toBe(false);
    expect(star.hasStope).toBe(false);
    expect(star.hasFactory).toBe(false);
    expect(star.hasCity).toBe(false);
    expect(star.buildingProgress).toBeNull();
  });
});

describe('StarGenerator', () => {
  it('generateStars 生成指定数量的星球', () => {
    const stars = generateStars(12345, 1, 10, [100, 500], [50, 200], 'TEST');
    expect(stars).toHaveLength(10);
    expect(stars[0].index).toBe(1);
    expect(stars[9].index).toBe(10);
  });

  it('generateStars 命名规则', () => {
    const stars = generateStars(12345, 1, 5, [100, 500], [50, 200], 'TST');
    expect(stars[0].name).toMatch(/^TST-/);
  });

  it('generateStars 资源在范围内', () => {
    const stars = generateStars(99999, 1, 50, [100, 500], [50, 200], 'TST');
    stars.forEach(star => {
      expect(star.totalResource).toBeGreaterThanOrEqual(100);
      expect(star.totalResource).toBeLessThanOrEqual(500);
      expect(star.populationLimit).toBeGreaterThanOrEqual(50);
      expect(star.populationLimit).toBeLessThanOrEqual(200);
    });
  });

  it('generateStars 确定性（相同种子生成相同结果）', () => {
    const stars1 = generateStars(42, 1, 5, [100, 500], [50, 200], 'TST');
    const stars2 = generateStars(42, 1, 5, [100, 500], [50, 200], 'TST');
    expect(stars1[0].totalResource).toBe(stars2[0].totalResource);
    expect(stars1[0].populationLimit).toBe(stars2[0].populationLimit);
  });
});

describe('Civilization', () => {
  it('创建文明默认状态', () => {
    const civi = new Civilization('测试文明');
    expect(civi.name).toBe('测试文明');
    expect(civi.population).toBe(0);
    expect(civi.culture).toBe(0);
    expect(civi.economy).toBe(0);
    expect(civi.army).toBe(0);
    expect(civi.treachery).toBe(0);
    expect(civi.civiLevel).toBe(0);
  });

  it('isDieOut 当没有星球时返回true', () => {
    const civi = new Civilization('测试文明');
    expect(civi.isDieOut()).toBe(true);
  });

  it('isDieOut 当有星球时返回false', () => {
    const civi = new Civilization('测试文明');
    civi.starIndices.add(3);
    expect(civi.isDieOut()).toBe(false);
  });

  it('getCiviLevelLabel 根据等级返回标签', () => {
    const civi = new Civilization('测试文明');
    civi.civiLevel = 0;
    expect(civi.getCiviLevelLabel()).toBe('荒蛮');
    civi.civiLevel = 1;
    expect(civi.getCiviLevelLabel()).toBe('起源');
    civi.civiLevel = 2;
    expect(civi.getCiviLevelLabel()).toBe('风暴');
    civi.civiLevel = 3;
    expect(civi.getCiviLevelLabel()).toBe('逐鹿');
    civi.civiLevel = 4;
    expect(civi.getCiviLevelLabel()).toBe('霸王');
  });

  it('getCiviLevelLabel 越界安全处理', () => {
    const civi = new Civilization('测试文明');
    civi.civiLevel = 99;
    expect(civi.getCiviLevelLabel()).toBe('霸王');
  });
});