import { describe, it, expect, beforeEach } from 'vitest';
import { RelationNetwork } from '../../core/RelationNetwork';
import { TagManager } from '../../core/TagManager';

describe('RelationNetwork', () => {
  let rn: RelationNetwork;
  let tagManager: TagManager;

  beforeEach(() => {
    rn = new RelationNetwork();
    tagManager = new TagManager();
  });

  it('初始无关系', () => {
    expect(rn.relations.length).toBe(0);
  });

  it('establishRelation 建立关系', () => {
    rn.establishRelation('罗辑', '史强', 'ALLY', 10, 'canon', 85);
    expect(rn.relations.length).toBe(1);
    const rel = rn.getRelation('罗辑', '史强');
    expect(rel).not.toBeNull();
    expect(rel!.relationType).toBe('ALLY');
    expect(rel!.intensity).toBe(85);
    expect(rel!.establishedYear).toBe(10);
    expect(rel!.source).toBe('canon');
  });

  it('establishRelation 替换相同关系', () => {
    rn.establishRelation('罗辑', '史强', 'ALLY', 10, 'canon', 85);
    rn.establishRelation('罗辑', '史强', 'ALLY', 20, 'updated', 95);
    expect(rn.relations.length).toBe(1);
    expect(rn.getRelation('罗辑', '史强')!.intensity).toBe(95);
  });

  it('getRelation 双向查询', () => {
    rn.establishRelation('A', 'B', 'ALLY', 0, 'test');
    expect(rn.getRelation('A', 'B')).not.toBeNull();
    expect(rn.getRelation('B', 'A')).not.toBeNull();
  });

  it('getRelation 不存在返回 null', () => {
    expect(rn.getRelation('不存在', '也不存在')).toBeNull();
  });

  it('getPersonRelations 获取角色所有关系', () => {
    rn.establishRelation('A', 'B', 'ALLY', 0, 'test');
    rn.establishRelation('A', 'C', 'RIVAL', 0, 'test');
    rn.establishRelation('B', 'C', 'NEUTRAL', 0, 'test');
    const relsA = rn.getPersonRelations('A');
    expect(relsA.length).toBe(2);
    const relsC = rn.getPersonRelations('C');
    expect(relsC.length).toBe(2);
  });

  it('modifyRelationByEvent 修改关系强度', () => {
    rn.establishRelation('A', 'B', 'ALLY', 0, 'test', 50);
    rn.modifyRelationByEvent('A', 'B', 30);
    expect(rn.getRelation('A', 'B')!.intensity).toBe(80);
    rn.modifyRelationByEvent('A', 'B', -200);
    expect(rn.getRelation('A', 'B')!.intensity).toBe(0);
  });

  it('modifyRelation 新建或修改关系', () => {
    rn.modifyRelation('A', 'B', 30);
    expect(rn.getRelation('A', 'B')).not.toBeNull();
    expect(rn.getRelation('A', 'B')!.relationType).toBe('ALLY');
    expect(rn.getRelation('A', 'B')!.intensity).toBe(80); // 50 + 30

    rn.modifyRelation('A', 'B', -20);
    expect(rn.getRelation('A', 'B')!.intensity).toBe(60);
  });

  it('modifyRelation 负值创建 RIVAL 关系', () => {
    rn.modifyRelation('A', 'B', -30);
    expect(rn.getRelation('A', 'B')!.relationType).toBe('RIVAL');
  });

  it('getRelationScore 计算平均强度', () => {
    rn.establishRelation('A', 'B', 'ALLY', 0, 'test', 80);
    rn.establishRelation('A', 'C', 'ALLY', 0, 'test', 60);
    expect(rn.getRelationScore({ personA: 'A' })).toBe(70);
    expect(rn.getRelationScore({ personA: 'A', type: 'ALLY' })).toBe(70);
    expect(rn.getRelationScore({ personA: 'A', type: 'RIVAL' })).toBe(0);
  });

  it('getRelationCount 统计关系类型数量', () => {
    rn.establishRelation('A', 'B', 'ALLY', 0, 'test');
    rn.establishRelation('C', 'D', 'ALLY', 0, 'test');
    rn.establishRelation('E', 'F', 'RIVAL', 0, 'test');
    expect(rn.getRelationCount('ALLY')).toBe(2);
    expect(rn.getRelationCount('RIVAL')).toBe(1);
    expect(rn.getRelationCount('NEUTRAL')).toBe(0);
  });

  it('updateRelations ALLY 自然衰减', () => {
    rn.establishRelation('A', 'B', 'ALLY', 0, 'test', 80);
    rn.updateRelations(tagManager);
    expect(rn.getRelation('A', 'B')!.intensity).toBe(79.5); // 80 - 0.5
  });

  it('updateRelations diplomatic_warming 防止衰减', () => {
    tagManager.applyWorldTag('diplomatic_warming', 50, 'test', 0);
    rn.establishRelation('A', 'B', 'ALLY', 0, 'test', 80);
    rn.updateRelations(tagManager);
    expect(rn.getRelation('A', 'B')!.intensity).toBe(81); // 80 + 1 (因 diplomatic_warming 存在)
  });

  it('initCanonicalRelations 初始化预设关系', () => {
    rn.initCanonicalRelations(0);
    expect(rn.relations.length).toBeGreaterThan(0);
    expect(rn.getRelation('罗辑', '史强')).not.toBeNull();
    expect(rn.getRelation('程心', '云天明')).not.toBeNull();
    expect(rn.getRelation('泰勒', '破壁人1号')).not.toBeNull();
  });

  it('toJSON 与 fromJSON 序列化往返', () => {
    rn.establishRelation('A', 'B', 'ALLY', 10, 'test', 75);
    const json = rn.toJSON();
    const restored = RelationNetwork.fromJSON(json);
    expect(restored.getRelation('A', 'B')!.intensity).toBe(75);
  });

  it('reset 清空所有关系', () => {
    rn.establishRelation('A', 'B', 'ALLY', 0, 'test');
    rn.reset();
    expect(rn.relations.length).toBe(0);
  });

  it('fromJSON 空数据返回空网络', () => {
    const restored = RelationNetwork.fromJSON(null);
    expect(restored.relations.length).toBe(0);
  });
});