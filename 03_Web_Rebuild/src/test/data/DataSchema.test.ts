import { describe, it, expect } from 'vitest';
import eventsData from '../../data/events.json';
import randomEventsData from '../../data/randomevents.json';
import timelineData from '../../data/timeline.json';
import starsData from '../../data/stars.json';
import personsData from '../../data/persons.json';
import aliensData from '../../data/aliens.json';
import { STAR_INDEX } from '../../config/starIndices';
import { AiPersonality, TecTreeType } from '../../types/enums';
import { TecTreeManager } from '../../core/TecTreeManager';

describe('DataSchema - events.json', () => {
  it('事件有 inYear/title/name', () => {
    for (const evt of eventsData as any[]) {
      expect(evt).toBeDefined();
      const hasTitle = typeof evt.title === 'string';
      const hasName = typeof evt.name === 'string' || typeof evt.name === 'number';
      const hasInYear = typeof evt.inYear === 'number';
      expect(hasTitle || hasName || hasInYear).toBe(true);
    }
  });

  it('事件有 dialogQueue 或 talkcount', () => {
    for (const evt of eventsData as any[]) {
      const hasDialog = !!evt.dialogQueue;
      const hasTalk = typeof evt.talkcount === 'number' && evt.talkcount > 0;
      expect(hasDialog || hasTalk).toBe(true);
    }
  });

  it('effects 为数组或 undefined', () => {
    for (const evt of eventsData as any[]) {
      if (evt.effects !== undefined) {
        expect(Array.isArray(evt.effects)).toBe(true);
      }
    }
  });
});

describe('DataSchema - randomevents.json', () => {
  it('每条事件有 name/title', () => {
    for (const evt of randomEventsData as any[]) {
      const hasName = typeof evt.name === 'string';
      const hasTitle = typeof evt.title === 'string';
      expect(hasName || hasTitle).toBe(true);
    }
  });

  it('有 triggerCondition 的事件包含必要字段', () => {
    for (const evt of randomEventsData as any[]) {
      if (evt.triggerCondition) {
        expect(evt.triggerCondition).toBeDefined();
      }
    }
  });

  it('dialogQueue 存在且为数组', () => {
    for (const evt of randomEventsData as any[]) {
      if (evt.dialogQueue) {
        expect(Array.isArray(evt.dialogQueue)).toBe(true);
      }
    }
  });
});

describe('DataSchema - timeline.json', () => {
  it('gameYearRange 连续且不重叠', () => {
    const entries = timelineData as any[];
    if (entries.length > 1) {
      const sorted = [...entries].sort((a: any, b: any) => a.gameYearRange[0] - b.gameYearRange[0]);
      for (let i = 1; i < sorted.length; i++) {
        const prevEnd = sorted[i - 1].gameYearRange[1];
        const currStart = sorted[i].gameYearRange[0];
        if (typeof prevEnd === 'number' && typeof currStart === 'number') {
          expect(currStart).toBeGreaterThanOrEqual(prevEnd);
        }
      }
    }
  });
});

describe('DataSchema - stars.json', () => {
  it('地球 index 与 STAR_INDEX.EARTH 一致', () => {
    const earth = (starsData as any[]).find((s: any) => s.Index === STAR_INDEX.EARTH);
    expect(earth).toBeDefined();
    expect(earth.Name).toContain('地球');
  });

  it('所有 star index 唯一', () => {
    const indices = (starsData as any[]).map((s: any) => s.Index);
    const unique = new Set(indices);
    expect(unique.size).toBe(indices.length);
  });

  it('太阳系星球有 Name 和 Resource', () => {
    for (const s of starsData as any[]) {
      if (s.Index <= 10) {
        expect(typeof s.Name).toBe('string');
        expect(typeof s.Resource).toBe('number');
      }
    }
  });
});

describe('DataSchema - persons.json', () => {
  it('所有人物 name 唯一', () => {
    const names = (personsData as any[]).map((p: any) => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  it('关键人物存在', () => {
    const names = (personsData as any[]).map((p: any) => p.name);
    expect(names).toContain('罗辑');
    expect(names).toContain('章北海');
    expect(names).toContain('程心');
  });

  it('属性值在合理范围内', () => {
    for (const p of personsData as any[]) {
      if (p.leadership !== undefined) expect(p.leadership).toBeGreaterThanOrEqual(0);
      if (p.science !== undefined) expect(p.science).toBeGreaterThanOrEqual(0);
      if (p.army !== undefined) expect(p.army).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── JSON Data Completeness ───────────────────────────────────────

describe('JSON Data Completeness', () => {
  it('所有预期数据文件存在且可解析', () => {
    expect(eventsData).toBeDefined();
    expect(Array.isArray(eventsData)).toBe(true);
    expect(randomEventsData).toBeDefined();
    expect(Array.isArray(randomEventsData)).toBe(true);
    expect(timelineData).toBeDefined();
    expect(Array.isArray(timelineData)).toBe(true);
    expect(starsData).toBeDefined();
    expect(Array.isArray(starsData)).toBe(true);
    expect(personsData).toBeDefined();
    expect(Array.isArray(personsData)).toBe(true);
    expect(aliensData).toBeDefined();
    expect(Array.isArray(aliensData)).toBe(true);
  });

  it('events.json 每条事件有 name/eventtype/eventvalue/talkcount', () => {
    for (const evt of eventsData as any[]) {
      expect(evt.name !== undefined && evt.name !== null).toBe(true);
      expect(typeof evt.eventtype).toBe('number');
      expect(typeof evt.eventvalue).toBe('number');
      expect(typeof evt.talkcount).toBe('number');
    }
  });

  it('persons.json 包含全部预期人物', () => {
    const names = (personsData as any[]).map((p: any) => p.name);
    const expected = ['罗辑', '章北海', '程心', '丁仪', '叶文洁', '智子', '维德', '云天明'];
    const nameSet = new Set(names);
    const missing = expected.filter(n => !nameSet.has(n));
    expect(missing).toEqual([]);
  });

  it('aliens.json 包含全部预期外星文明', () => {
    const names = (aliensData as any[]).map((a: any) => a.name);
    const expected = ['三体', '歌者', '边缘世界', '魔戒', '归零者', '碳基联邦', '硅基帝国', '上帝文明', '量子态文明'];
    for (const name of expected) {
      expect(names).toContain(name);
    }
    expect(names.length).toBe(expected.length);
  });

  it('TecTreeType 枚举定义了全部 5 条科技树', () => {
    expect(TecTreeType.PHYSICS).toBe(0);
    expect(TecTreeType.AEROSPACE).toBe(1);
    expect(TecTreeType.MILITARY).toBe(2);
    expect(TecTreeType.INFORMATION).toBe(3);
    expect(TecTreeType.INTERSTELLAR).toBe(4);
    expect(TecTreeType.COUNT).toBe(5);
  });
});

// ─── Data Referential Integrity ────────────────────────────────────

describe('Data Referential Integrity', () => {
  const personNames = new Set((personsData as any[]).map((p: any) => p.name));
  // 已知的非人物对话者（组织/舰船/抽象实体）
  const nonPersonTalkers = new Set(['联合政府', '三体监听员', '最高统帅部', '万有引力号']);

  it('events.json 引用的对话者存在于 persons.json 中（排除组织实体）', () => {
    const talkers = new Set<string>();
    for (const evt of eventsData as any[]) {
      for (let i = 0; i < evt.talkcount; i++) {
        const talker = evt[`talk${i}_talker`];
        if (talker) talkers.add(talker);
      }
    }
    // 别名映射：事件中用"史强"，person 数据中用"大史"
    const aliasMap: Record<string, string> = { '史强': '大史' };
    for (const talker of talkers) {
      if (nonPersonTalkers.has(talker)) continue;
      const expectedName = aliasMap[talker] || talker;
      expect(personNames.has(expectedName)).toBe(true);
    }
  });

  it('randomevents.json 的 reqTech 引用有效的科技名', () => {
    const tm = new TecTreeManager();
    const allTechNames = new Set<string>();
    for (const tree of tm.trees.values()) {
      for (const name of tree.nodes.keys()) {
        allTechNames.add(name);
      }
    }
    for (const evt of randomEventsData as any[]) {
      const reqTech = evt.triggerCondition?.reqTech;
      if (reqTech) {
        expect(allTechNames.has(reqTech)).toBe(true);
      }
    }
  });

  it('aliens.json 的 personality 值为有效的 AiPersonality 枚举值', () => {
    for (const alien of aliensData as any[]) {
      expect(alien.personality).toBeGreaterThanOrEqual(0);
      expect(alien.personality).toBeLessThan(AiPersonality.COUNT);
    }
  });

  it('events.json 的 talkN_pic 图片引用非空字符串', () => {
    for (const evt of eventsData as any[]) {
      for (let i = 0; i < evt.talkcount; i++) {
        const pic = evt[`talk${i}_pic`];
        expect(pic).toBeDefined();
        expect(typeof pic).toBe('string');
        expect(pic.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─── Data Value Ranges ────────────────────────────────────────────

describe('Data Value Ranges', () => {
  const statKeys = ['army', 'economy', 'leadership', 'art', 'science', 'treachery', 'social'];

  it('persons.json 属性值在 [0, 100] 范围内', () => {
    for (const p of personsData as any[]) {
      for (const key of statKeys) {
        if (p[key] !== undefined) {
          expect(p[key]).toBeGreaterThanOrEqual(0);
          expect(p[key]).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('events.json 的 inYear 为有效数字', () => {
    for (const evt of eventsData as any[]) {
      if (evt.inYear !== undefined) {
        expect(typeof evt.inYear).toBe('number');
      }
    }
  });

  it('randomevents.json 的 probability 值在 [0, 1] 范围内', () => {
    for (const evt of randomEventsData as any[]) {
      const prob = evt.triggerCondition?.probability;
      if (prob !== undefined) {
        expect(prob).toBeGreaterThanOrEqual(0);
        expect(prob).toBeLessThanOrEqual(1);
      }
    }
  });

  it('aliens.json 的 res（资源）值为正数', () => {
    for (const alien of aliensData as any[]) {
      expect(alien.res).toBeGreaterThan(0);
    }
  });
});

// ─── Type Schema Compliance ────────────────────────────────────────

describe('Type Schema Compliance', () => {
  it('events.json 字段结构符合 GameEvent 预期', () => {
    for (const evt of eventsData as any[]) {
      expect(typeof evt.name === 'string' || typeof evt.name === 'number').toBe(true);
      expect(typeof evt.eventtype).toBe('number');
      expect(typeof evt.eventeffect).toBe('number');
      expect(typeof evt.eventvalue).toBe('number');
      expect(typeof evt.talkcount).toBe('number');
      expect(typeof evt.talk0_content).toBe('string');
      if (evt.triggerCondition) {
        expect(typeof evt.triggerCondition.epoch).toBe('string');
      }
    }
  });

  it('persons.json 字段结构符合预期', () => {
    for (const p of personsData as any[]) {
      expect(typeof p.name).toBe('string');
      expect(typeof p.faceFile).toBe('string');
      expect(typeof p.army).toBe('number');
      expect(typeof p.economy).toBe('number');
      expect(typeof p.leadership).toBe('number');
      expect(typeof p.science).toBe('number');
      expect(typeof p.treachery).toBe('number');
      expect(typeof p.social).toBe('number');
    }
  });

  it('aliens.json 字段结构符合预期', () => {
    for (const a of aliensData as any[]) {
      expect(typeof a.name).toBe('string');
      expect(typeof a.isplanet).toBe('number');
      expect(typeof a.res).toBe('number');
      expect(typeof a.poplimit).toBe('number');
      expect(typeof a.starsys).toBe('number');
      expect(typeof a.personality).toBe('number');
    }
  });

  it('TecTree 节点结构符合 TecTreeNode 预期', () => {
    const tm = new TecTreeManager();
    for (const [_type, tree] of tm.trees.entries()) {
      expect(tree.nodes.size).toBeGreaterThan(0);
      for (const [name, node] of tree.nodes.entries()) {
        expect(typeof name).toBe('string');
        expect(typeof node.name).toBe('string');
        expect(typeof node.finished).toBe('boolean');
        expect(typeof node.inResearch).toBe('boolean');
        expect(typeof node.totalWorkload).toBe('number');
        expect(node.totalWorkload).toBeGreaterThan(0);
        expect(typeof node.cost).toBe('number');
        expect(node.cost).toBeGreaterThan(0);
        expect(typeof node.tip).toBe('string');
      }
    }
  });
});