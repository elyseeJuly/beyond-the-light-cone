import { describe, it, expect, beforeEach } from 'vitest';
import { TecTreeManager } from '../../core/TecTreeManager';
import { TecTreeType } from '../../types/enums';

describe('TecTreeManager', () => {
  let tm: TecTreeManager;

  beforeEach(() => {
    tm = new TecTreeManager();
  });

  it('初始化5棵科技树', () => {
    expect(tm.trees.size).toBe(5);
    expect(tm.trees.has(TecTreeType.PHYSICS)).toBe(true);
    expect(tm.trees.has(TecTreeType.AEROSPACE)).toBe(true);
    expect(tm.trees.has(TecTreeType.MILITARY)).toBe(true);
    expect(tm.trees.has(TecTreeType.INFORMATION)).toBe(true);
    expect(tm.trees.has(TecTreeType.INTERSTELLAR)).toBe(true);
  });

  it('isTecFinished 正确检测单树完成', () => {
    expect(tm.isTecFinished(TecTreeType.PHYSICS, '天文观测')).toBe(false);
    const physicsTree = tm.trees.get(TecTreeType.PHYSICS);
    const node = physicsTree?.getNode('天文观测');
    if (node) node.finished = true;
    expect(tm.isTecFinished(TecTreeType.PHYSICS, '天文观测')).toBe(true);
  });

  it('isTecFinished 不存在类型返回false', () => {
    expect(tm.isTecFinished(999 as TecTreeType, '不存在')).toBe(false);
  });

  it('isTecFinishedAnywhere 跨树查找', () => {
    expect(tm.isTecFinishedAnywhere('黑域生成')).toBe(false);
    const interTree = tm.trees.get(TecTreeType.INTERSTELLAR);
    const node = interTree?.getNode('黑域生成');
    if (node) node.finished = true;
    expect(tm.isTecFinishedAnywhere('黑域生成')).toBe(true);
  });

  it('isTecFinishedAnywhere 只存在于一棵树', () => {
    expect(tm.isTecFinishedAnywhere('行星发动机Ⅲ型')).toBe(false);
    const aeroTree = tm.trees.get(TecTreeType.AEROSPACE);
    const node = aeroTree?.getNode('行星发动机Ⅲ型');
    if (node) node.finished = true;
    expect(tm.isTecFinishedAnywhere('行星发动机Ⅲ型')).toBe(true);
  });

  it('isTecFinishedAnywhere 不存在返回false', () => {
    expect(tm.isTecFinishedAnywhere('不存在的科技')).toBe(false);
  });

  it('PHYSICS 树包含关键科技', () => {
    const tree = tm.trees.get(TecTreeType.PHYSICS)!;
    expect(tree.getNode('天文观测')).toBeDefined();
    expect(tree.getNode('50光年远镜')).toBeDefined();
    expect(tree.getNode('维度物理')).toBeDefined();
    expect(tree.getNode('曲率驱动理论')).toBeDefined();
    expect(tree.getNode('光速飞船原型')).toBeDefined();
    expect(tree.getNode('黑域生成')).toBeDefined();
    expect(tree.getNode('智子工程')).toBeDefined();
  });

  it('AEROSPACE 树包含关键科技', () => {
    const tree = tm.trees.get(TecTreeType.AEROSPACE)!;
    expect(tree.getNode('行星发动机Ⅰ型')).toBeDefined();
    expect(tree.getNode('行星发动机Ⅱ型')).toBeDefined();
    expect(tree.getNode('行星发动机Ⅲ型')).toBeDefined();
    expect(tree.getNode('星矿Ⅰ')).toBeDefined();
    expect(tree.getNode('星矿Ⅱ')).toBeDefined();
    expect(tree.getNode('星矿Ⅲ')).toBeDefined();
    expect(tree.getNode('殖民城Ⅲ')).toBeDefined();
    expect(tree.getNode('10%光速飞船')).toBeDefined();
  });

  it('MILITARY 树包含关键科技', () => {
    const tree = tm.trees.get(TecTreeType.MILITARY)!;
    expect(tree.getNode('黑暗森林威慑')).toBeDefined();
    expect(tree.getNode('引力波广播系统')).toBeDefined();
    expect(tree.getNode('降维打击')).toBeDefined();
    expect(tree.getNode('二向箔武器化')).toBeDefined();
  });

  it('INFORMATION 树包含关键科技', () => {
    const tree = tm.trees.get(TecTreeType.INFORMATION)!;
    expect(tree.getNode('550W量子计算机')).toBeDefined();
    expect(tree.getNode('数字方舟')).toBeDefined();
    expect(tree.getNode('数字生命研究')).toBeDefined();
    expect(tree.getNode('面壁者心理学')).toBeDefined();
  });

  it('INTERSTELLAR 树包含关键科技', () => {
    const tree = tm.trees.get(TecTreeType.INTERSTELLAR)!;
    expect(tree.getNode('宇宙社会学')).toBeDefined();
    expect(tree.getNode('黑域生成')).toBeDefined();
    expect(tree.getNode('新家园选址')).toBeDefined();
    expect(tree.getNode('流浪地球计划')).toBeDefined();
    expect(tree.getNode('归零者研究')).toBeDefined();
  });

  // === 扩展测试：科技研究进度追踪 ===

  it('追踪科技研究进度', () => {
    const node = tm.trees.get(TecTreeType.PHYSICS)!.getNode('天文观测')!;
    expect(node.currentWorkload).toBe(0);
    expect(node.totalWorkload).toBe(60);
    node.inResearch = true;
    node.currentWorkload = 30;
    expect(node.inResearch).toBe(true);
    expect(node.currentWorkload).toBe(30);
    // 累积至完成
    node.currentWorkload = node.totalWorkload;
    node.finished = true;
    expect(tm.isTecFinished(TecTreeType.PHYSICS, '天文观测')).toBe(true);
  });

  it('多棵科技树可同时进行研究', () => {
    const physicsNode = tm.trees.get(TecTreeType.PHYSICS)!.getNode('粒子对撞实验')!;
    const aeroNode = tm.trees.get(TecTreeType.AEROSPACE)!.getNode('核聚变推进')!;
    const militaryNode = tm.trees.get(TecTreeType.MILITARY)!.getNode('黑暗森林威慑')!;
    const infoNode = tm.trees.get(TecTreeType.INFORMATION)!.getNode('数字文明')!;
    const interNode = tm.trees.get(TecTreeType.INTERSTELLAR)!.getNode('宇宙社会学')!;

    physicsNode.inResearch = true;
    aeroNode.inResearch = true;
    militaryNode.inResearch = true;
    infoNode.inResearch = true;
    interNode.inResearch = true;

    expect(physicsNode.inResearch).toBe(true);
    expect(aeroNode.inResearch).toBe(true);
    expect(militaryNode.inResearch).toBe(true);
    expect(infoNode.inResearch).toBe(true);
    expect(interNode.inResearch).toBe(true);

    // 每个节点独立追踪进度
    physicsNode.currentWorkload = 40;
    aeroNode.currentWorkload = 60;
    expect(physicsNode.currentWorkload).toBe(40);
    expect(aeroNode.currentWorkload).toBe(60);
  });

  it('科技完成后 isTecFinished 跨标记检测', () => {
    const node = tm.trees.get(TecTreeType.MILITARY)!.getNode('二向箔武器化')!;
    expect(tm.isTecFinished(TecTreeType.MILITARY, '二向箔武器化')).toBe(false);
    node.finished = true;
    expect(tm.isTecFinished(TecTreeType.MILITARY, '二向箔武器化')).toBe(true);
    // otherFinished 状态不受影响
    expect(tm.isTecFinished(TecTreeType.MILITARY, '降维打击')).toBe(false);
  });

  it('科技前置条件链验证 - 父子关系正确', () => {
    const tree = tm.trees.get(TecTreeType.PHYSICS)!;
    const child = tree.getNode('50光年远镜')!;
    expect(child.parentName).toBe('天文观测');
    const parent = tree.getNode(child.parentName!)!;
    expect(parent).toBeDefined();
    expect(parent.childrenNames).toContain('50光年远镜');

    // 长链路验证：天文观测 → 50光年远镜 → 1万光年远镜 → 银河系远镜
    const chain = ['天文观测', '50光年远镜', '1万光年远镜', '银河系远镜'];
    for (let i = 1; i < chain.length; i++) {
      const c = tree.getNode(chain[i])!;
      expect(c.parentName).toBe(chain[i - 1]);
    }
  });

  it('每棵科技树至少有1个无前置的初始科技（根节点）', () => {
    const types = [TecTreeType.PHYSICS, TecTreeType.AEROSPACE, TecTreeType.MILITARY,
                   TecTreeType.INFORMATION, TecTreeType.INTERSTELLAR];
    for (const type of types) {
      const tree = tm.trees.get(type)!;
      const rootNodes = Array.from(tree.nodes.values())
        .filter(n => n.parentName === null || n.parentName === '');
      expect(rootNodes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('科技消耗（cost）数值正确', () => {
    expect(tm.trees.get(TecTreeType.PHYSICS)!.getNode('天文观测')!.cost).toBe(10);
    expect(tm.trees.get(TecTreeType.PHYSICS)!.getNode('黑域生成')!.cost).toBe(500);
    expect(tm.trees.get(TecTreeType.INFORMATION)!.getNode('数字方舟')!.cost).toBe(350);
    expect(tm.trees.get(TecTreeType.AEROSPACE)!.getNode('行星发动机Ⅲ型')!.cost).toBe(300);
    expect(tm.trees.get(TecTreeType.MILITARY)!.getNode('二向箔武器化')!.cost).toBe(500);
    expect(tm.trees.get(TecTreeType.INTERSTELLAR)!.getNode('宇宙重启理论')!.cost).toBe(400);
  });

  it('isTecFinishedAnywhere 跨树验证 - 同名科技（黑域生成）', () => {
    // 黑域生成 同时存在于 PHYSICS 和 INTERSTELLAR
    expect(tm.isTecFinishedAnywhere('黑域生成')).toBe(false);

    // 完成 PHYSICS 树中的 黑域生成
    const physicsNode = tm.trees.get(TecTreeType.PHYSICS)!.getNode('黑域生成')!;
    physicsNode.finished = true;
    expect(tm.isTecFinishedAnywhere('黑域生成')).toBe(true);
    physicsNode.finished = false;
    expect(tm.isTecFinishedAnywhere('黑域生成')).toBe(false);

    // 完成 INTERSTELLAR 树中的 黑域生成
    const interNode = tm.trees.get(TecTreeType.INTERSTELLAR)!.getNode('黑域生成')!;
    interNode.finished = true;
    expect(tm.isTecFinishedAnywhere('黑域生成')).toBe(true);
    interNode.finished = false;
    expect(tm.isTecFinishedAnywhere('黑域生成')).toBe(false);
  });

  it('科技描述（tip）和工作量信息完整', () => {
    const node = tm.trees.get(TecTreeType.PHYSICS)!.getNode('黑域生成')!;
    expect(node.tip).toContain('宇宙安全声明');
    expect(node.totalWorkload).toBe(500);
    expect(node.currentWorkload).toBe(0);

    const aeroNode = tm.trees.get(TecTreeType.AEROSPACE)!.getNode('行星发动机Ⅲ型')!;
    expect(aeroNode.tip).toContain('流浪条件');
    expect(aeroNode.totalWorkload).toBe(400);
  });

  it('所有科技节点结构完整性验证', () => {
    for (const tree of tm.trees.values()) {
      for (const node of tree.nodes.values()) {
        expect(node).toHaveProperty('name');
        expect(node).toHaveProperty('finished', false);
        expect(node).toHaveProperty('inResearch', false);
        expect(node).toHaveProperty('totalWorkload');
        expect(node).toHaveProperty('currentWorkload', 0);
        expect(node).toHaveProperty('cost');
        expect(node).toHaveProperty('parentName');
        expect(node).toHaveProperty('childrenNames');
        expect(typeof node.name).toBe('string');
        expect(typeof node.totalWorkload).toBe('number');
        expect(typeof node.cost).toBe('number');
        expect(Array.isArray(node.childrenNames)).toBe(true);
      }
    }
  });

  it('工作量累积不超过上限', () => {
    const node = tm.trees.get(TecTreeType.AEROSPACE)!.getNode('化学推进')!;
    // 模拟部分研究进度
    node.inResearch = true;
    node.currentWorkload = 30;
    expect(node.currentWorkload).toBeLessThanOrEqual(node.totalWorkload);
    expect(node.finished).toBe(false);

    // 累积至完成
    node.currentWorkload = node.totalWorkload;
    node.finished = true;
    expect(node.finished).toBe(true);
    expect(tm.isTecFinished(TecTreeType.AEROSPACE, '化学推进')).toBe(true);
  });
});