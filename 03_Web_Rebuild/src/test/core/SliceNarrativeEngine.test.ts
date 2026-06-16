import { describe, it, expect, beforeEach } from 'vitest';
import { SliceNarrativeEngine } from '../../core/SliceNarrativeEngine';
import { TagManager } from '../../core/TagManager';

describe('SliceNarrativeEngine', () => {
  let sne: SliceNarrativeEngine;
  let tagManager: TagManager;

  beforeEach(() => {
    sne = new SliceNarrativeEngine();
    tagManager = new TagManager();
  });

  it('初始 slices 为空', () => {
    expect(sne.getSlices('any_event')).toEqual([]);
    expect(sne.hasSlices('any_event')).toBe(false);
  });

  it('registerSlice 存储切片', () => {
    sne.registerSlice('event_001', {
      eventId: 'event_001',
      characterName: '张伟',
      characterRole: '地下城配给管理员',
      scene: '地下城A-7区的昏暗走廊里',
      innerMonologue: '「资源配给又减少了……」',
      impact: '张伟的工作量因为资源短缺而增加。',
    });
    const slices = sne.getSlices('event_001');
    expect(slices.length).toBe(1);
    expect(slices[0].characterName).toBe('张伟');
    expect(slices[0].characterRole).toBe('地下城配给管理员');
  });

  it('registerSlices 批量注册多个切片', () => {
    sne.registerSlices('event_002', [
      {
        eventId: 'event_002', characterName: '张伟',
        characterRole: '地下城配给管理员', scene: '场景1',
        innerMonologue: '独白1', impact: '影响1',
      },
      {
        eventId: 'event_002', characterName: '王芳',
        characterRole: '星舰维修工程师', scene: '场景2',
        innerMonologue: '独白2', impact: '影响2',
      },
    ]);
    expect(sne.getSlices('event_002').length).toBe(2);
  });

  it('registerSlices 追加到已有切片', () => {
    sne.registerSlice('event_001', {
      eventId: 'event_001', characterName: '张伟',
      characterRole: '管理员', scene: '场景', innerMonologue: '独白', impact: '影响',
    });
    sne.registerSlices('event_001', [
      {
        eventId: 'event_001', characterName: '李强',
        characterRole: '工程师', scene: '场景2', innerMonologue: '独白2', impact: '影响2',
      },
    ]);
    expect(sne.getSlices('event_001').length).toBe(2);
  });

  it('getSlices 返回注册的切片', () => {
    sne.registerSlice('event_001', {
      eventId: 'event_001', characterName: '赵丽',
      characterRole: '生态循环站技术员', scene: '测试场景',
      innerMonologue: '测试独白', impact: '测试影响',
    });
    const slices = sne.getSlices('event_001');
    expect(slices.length).toBe(1);
    expect(slices[0].characterName).toBe('赵丽');
  });

  it('getSlices 不存在的ID返回空数组', () => {
    expect(sne.getSlices('nonexistent')).toEqual([]);
  });

  it('generateSlice 创建自动切片', () => {
    const slice = sne.generateSlice('event_003', '科技突破', tagManager);
    expect(slice.eventId).toBe('event_003');
    expect(slice.characterName).toBeTruthy();
    expect(slice.characterRole).toBeTruthy();
    expect(slice.scene).toBeTruthy();
    expect(slice.innerMonologue).toBeTruthy();
    expect(slice.impact).toBeTruthy();
    expect(slice.innerMonologue).toContain('科技突破');
  });

  it('generateSlice 自动注册切片', () => {
    sne.generateSlice('event_004', '人口危机', tagManager);
    expect(sne.hasSlices('event_004')).toBe(true);
    expect(sne.getSlices('event_004').length).toBe(1);
  });

  it('hasSlices 返回正确布尔值', () => {
    expect(sne.hasSlices('event_001')).toBe(false);
    sne.registerSlice('event_001', {
      eventId: 'event_001', characterName: '陈明',
      characterRole: '信息监测站观察员', scene: '场景',
      innerMonologue: '独白', impact: '影响',
    });
    expect(sne.hasSlices('event_001')).toBe(true);
  });

  it('toJSON/fromJSON 序列化往返', () => {
    sne.registerSlice('event_001', {
      eventId: 'event_001', characterName: '张伟',
      characterRole: '管理员', scene: '场景', innerMonologue: '独白', impact: '影响',
    });
    sne.registerSlice('event_002', {
      eventId: 'event_002', characterName: '王芳',
      characterRole: '工程师', scene: '场景2', innerMonologue: '独白2', impact: '影响2',
    });
    sne.generateSlice('event_003', '科技突破', tagManager);

    const json = sne.toJSON();
    const restored = SliceNarrativeEngine.fromJSON(json);

    expect(restored.getSlices('event_001').length).toBe(1);
    expect(restored.getSlices('event_002').length).toBe(1);
    expect(restored.getSlices('event_003').length).toBe(1);
    expect(restored.getSlices('event_001')[0].characterName).toBe('张伟');
  });

  it('fromJSON 空数据不报错', () => {
    const sne2 = SliceNarrativeEngine.fromJSON(null);
    expect(sne2.getSlices('any')).toEqual([]);
    const sne3 = SliceNarrativeEngine.fromJSON({});
    expect(sne3.getSlices('any')).toEqual([]);
  });

  it('reset 清除所有切片', () => {
    sne.registerSlice('event_001', {
      eventId: 'event_001', characterName: '张伟',
      characterRole: '管理员', scene: '场景', innerMonologue: '独白', impact: '影响',
    });
    sne.generateSlice('event_002', '科技突破', tagManager);
    sne.reset();
    expect(sne.getSlices('event_001')).toEqual([]);
    expect(sne.getSlices('event_002')).toEqual([]);
    expect(sne.hasSlices('event_001')).toBe(false);
  });

  it('generateSlice 使用不同的角色和场景', () => {
    const slice1 = sne.generateSlice('event_a', '事件A', tagManager);
    const slice2 = sne.generateSlice('event_b', '事件B', tagManager);
    expect(slice1.characterName).toBeTruthy();
    expect(slice2.characterName).toBeTruthy();
    expect(slice1.characterRole).toBeTruthy();
    expect(slice2.characterRole).toBeTruthy();
  });

  it('generateSlice 优先选择活跃的世界标签叙事 (例如：人口危机)', () => {
    tagManager.applyWorldTag('population_crisis', 100, 'test_source', 2050);
    const slice = sne.generateSlice('event_pop_crisis', '年份推进', tagManager);
    expect(slice.innerMonologue).toMatch(/配给大厅|空房间|人口危机/);
    expect(slice.scene).toBeTruthy();
  });

  it('generateSlice 选择活跃的纪元标签叙事 (例如：威慑纪元)', () => {
    tagManager.applyWorldTag('deterrence_era', 100, 'test_source', 2050);
    const slice = sne.generateSlice('event_deterrence', '年份推进', tagManager);
    expect(slice.innerMonologue).toMatch(/三体人|执剑者|罗辑|和平/);
  });
});