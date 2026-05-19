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
});