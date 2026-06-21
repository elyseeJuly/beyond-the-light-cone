import { describe, it, expect, beforeEach } from 'vitest';
import { SliceNarrativeEngine, SliceNarrative } from '../../core/SliceNarrativeEngine';
import { TagManager } from '../../core/TagManager';

describe('SliceNarrativeEngine', () => {
  let sne: SliceNarrativeEngine;
  let tagManager: TagManager;

  beforeEach(() => {
    sne = new SliceNarrativeEngine();
    tagManager = new TagManager();
  });

  it('初始无切片', () => {
    expect(sne.hasSlices('any_event')).toBe(false);
  });

  it('registerSlice 注册单个切片', () => {
    const slice: SliceNarrative = {
      eventId: 'event_001',
      characterName: '张伟',
      characterRole: '地下城配给管理员',
      scene: '在昏暗的走廊里忙碌着',
      innerMonologue: '「配给又减少了」',
      impact: '工作压力增大',
    };
    sne.registerSlice('event_001', slice);
    expect(sne.hasSlices('event_001')).toBe(true);
    const slices = sne.getSlices('event_001');
    expect(slices.length).toBe(1);
    expect(slices[0].characterName).toBe('张伟');
  });

  it('registerSlices 批量注册切片', () => {
    const slices: SliceNarrative[] = [
      { eventId: 'event_002', characterName: '王芳', characterRole: '工程师', scene: '场景1', innerMonologue: '独白1', impact: '影响1' },
      { eventId: 'event_002', characterName: '李强', characterRole: '技术员', scene: '场景2', innerMonologue: '独白2', impact: '影响2' },
    ];
    sne.registerSlices('event_002', slices);
    expect(sne.getSlices('event_002').length).toBe(2);
  });

  it('getSlices 不存在的事件返回空数组', () => {
    expect(sne.getSlices('nonexistent')).toEqual([]);
  });

  it('generateSlice 生成切片包含所有必要字段', () => {
    const slice = sne.generateSlice('test_event', '测试事件', tagManager);
    expect(slice.eventId).toBe('test_event');
    expect(slice.characterName).toBeDefined();
    expect(slice.characterRole).toBeDefined();
    expect(slice.scene).toBeDefined();
    expect(slice.innerMonologue).toBeDefined();
    expect(slice.impact).toBeDefined();
  });

  it('generateSlice 使用活跃标签匹配叙事', () => {
    tagManager.applyWorldTag('population_crisis', 50, 'test', 0);
    const slice = sne.generateSlice('pop_event', '人口危机', tagManager);
    expect(slice.eventId).toBe('pop_event');
    expect(slice.innerMonologue).toContain('「');
  });

  it('generateSlice 不使用标签时使用通用叙事', () => {
    // No tags applied - should use GENERAL_NARRATIVES
    const slice = sne.generateSlice('year_progress', '年份推进', tagManager);
    expect(slice.eventId).toBe('year_progress');
    expect(slice.characterName).toBeDefined();
  });

  it('generateSlice 生成不同角色名字', () => {
    const names = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const slice = sne.generateSlice(`event_${i}`, '测试', tagManager);
      names.add(slice.characterName);
    }
    // Should produce multiple different names
    expect(names.size).toBeGreaterThan(1);
  });

  it('registerSlice 后 generateSlice 追加不覆盖', () => {
    const manual: SliceNarrative = {
      eventId: 'multi', characterName: '手动', characterRole: '测试',
      scene: '手动场景', innerMonologue: '手动独白', impact: '手动影响',
    };
    sne.registerSlice('multi', manual);
    sne.generateSlice('multi', '自动生成', tagManager);
    expect(sne.getSlices('multi').length).toBe(2);
  });

  it('toJSON 与 fromJSON 序列化往返', () => {
    const slice: SliceNarrative = {
      eventId: 'evt', characterName: '张三', characterRole: '技工',
      scene: '场景', innerMonologue: '独白', impact: '影响',
    };
    sne.registerSlice('evt', slice);
    const json = sne.toJSON();
    const restored = SliceNarrativeEngine.fromJSON(json);
    expect(restored.hasSlices('evt')).toBe(true);
    expect(restored.getSlices('evt')[0].characterName).toBe('张三');
  });

  it('reset 清空所有切片', () => {
    const slice: SliceNarrative = {
      eventId: 'evt', characterName: '测试', characterRole: '测试',
      scene: '', innerMonologue: '', impact: '',
    };
    sne.registerSlice('evt', slice);
    sne.reset();
    expect(sne.hasSlices('evt')).toBe(false);
  });
});