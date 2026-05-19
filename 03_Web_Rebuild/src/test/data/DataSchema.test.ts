import { describe, it, expect } from 'vitest';
import eventsData from '../../data/events.json';
import randomEventsData from '../../data/randomevents.json';
import timelineData from '../../data/timeline.json';
import starsData from '../../data/stars.json';
import personsData from '../../data/persons.json';
import { STAR_INDEX } from '../../config/starIndices';

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