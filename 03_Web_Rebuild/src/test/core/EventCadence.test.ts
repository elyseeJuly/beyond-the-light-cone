import { describe, it, expect, vi } from 'vitest';
import {
  normalizeEventMeta,
  isEventEligible,
  pickWeightedEvent,
  DEFAULT_AMBIENT_META,
  EVENT_BUDGET
} from '../../core/EventCadence';
import { createGameEvent } from '../../core/GameEvent';
import { EventType, EventLane } from '../../types/enums';

function createMockGame() {
  return {
    year: 0,
    loreMode: 'strict_three_body' as const,
    rng: vi.fn(() => Math.random())
  };
}

describe('EventCadence - normalizeEventMeta', () => {
  it('为无 triggerCondition 的事件赋予默认 ambient meta', () => {
    const evt = createGameEvent('测试事件', EventType.RANDOM, 0, 'tips', 0);
    const normalized = normalizeEventMeta(evt);
    expect(normalized.cadenceMeta).toBeDefined();
    expect(normalized.cadenceMeta!.lane).toBe('ambient');
    expect(normalized.cadenceMeta!.loreDomain).toBe('three_body_canon');
    expect(normalized.cadenceMeta!.probability).toBe(0.02);
    expect(normalized.cadenceMeta!.maxTriggers).toBe(1);
  });

  it('有 triggerCondition 的事件继承其元数据', () => {
    const evt = createGameEvent('测试', EventType.RANDOM, 0, 'tips', 0, [], 'test-id', {
      probability: 0.05,
      lane: 'ambient',
      loreDomain: 'three_body_canon',
      weight: 2,
      maxTriggers: 1
    });
    const normalized = normalizeEventMeta(evt);
    expect(normalized.cadenceMeta!.probability).toBe(0.05);
    expect(normalized.cadenceMeta!.weight).toBe(2);
  });

  it('milestone 事件强制 probability = 1.0', () => {
    const evt = createGameEvent('主线事件', EventType.INYEAR, 10, 'tips', 0, [], 'milestone-1', {
      lane: 'milestone'
    });
    const normalized = normalizeEventMeta(evt);
    expect(normalized.cadenceMeta!.lane).toBe('milestone');
    expect(normalized.cadenceMeta!.probability).toBe(1.0);
  });
});

describe('EventCadence - isEventEligible', () => {
  it('达到 maxTriggers 限制后不可再触发', () => {
    const game = createMockGame();
    game.year = 10;
    const evt = createGameEvent('test', EventType.RANDOM, 0, '', 0);
    evt.cadenceMeta = { ...DEFAULT_AMBIENT_META, maxTriggers: 1 };
    const laneCooldowns: Map<EventLane, number> = new Map();
    const triggerCounts = new Map<string, number>([['test', 1]]);
    expect(isEventEligible(evt, game as any, laneCooldowns, triggerCounts, 0)).toBe(false);
  });

  it('冷却期内事件不可触发', () => {
    const game = createMockGame();
    game.year = 6;
    const evt = createGameEvent('test', EventType.RANDOM, 0, '', 0);
    evt.cadenceMeta = { ...DEFAULT_AMBIENT_META, cooldownYears: 4 };
    const laneCooldowns: Map<EventLane, number> = new Map([['ambient', 3]]);
    const triggerCounts = new Map<string, number>();
    expect(isEventEligible(evt, game as any, laneCooldowns, triggerCounts, 0)).toBe(false);
  });

  it('strict_three_body 模式过滤 crossover 事件', () => {
    const game = createMockGame();
    game.year = 10;
    const evt = createGameEvent('流浪地球事件', EventType.RANDOM, 0, '', 0);
    evt.cadenceMeta = { ...DEFAULT_AMBIENT_META, loreDomain: 'liu_cixin_crossover' };
    const laneCooldowns: Map<EventLane, number> = new Map();
    const triggerCounts = new Map<string, number>();
    expect(isEventEligible(evt, game as any, laneCooldowns, triggerCounts, 0)).toBe(false);
  });

  it('liu_cixin_mixed 模式不过滤 crossover 事件', () => {
    const game = createMockGame();
    (game as any).loreMode = 'liu_cixin_mixed';
    game.year = 10;
    const evt = createGameEvent('流浪地球事件', EventType.RANDOM, 0, '', 0);
    evt.cadenceMeta = { ...DEFAULT_AMBIENT_META, loreDomain: 'liu_cixin_crossover' };
    const laneCooldowns: Map<EventLane, number> = new Map();
    const triggerCounts = new Map<string, number>();
    expect(isEventEligible(evt, game as any, laneCooldowns, triggerCounts, 0)).toBe(true);
  });

  it('全局最小间隔生效', () => {
    const game = createMockGame();
    game.year = 2;
    const evt = createGameEvent('test', EventType.RANDOM, 0, '', 0);
    evt.cadenceMeta = { ...DEFAULT_AMBIENT_META };
    const laneCooldowns: Map<EventLane, number> = new Map();
    const triggerCounts = new Map<string, number>();
    expect(isEventEligible(evt, game as any, laneCooldowns, triggerCounts, 1)).toBe(false);
  });

  it('超过间隔后事件可触发', () => {
    const game = createMockGame();
    game.year = 5;
    const evt = createGameEvent('test', EventType.RANDOM, 0, '', 0);
    evt.cadenceMeta = { ...DEFAULT_AMBIENT_META };
    const laneCooldowns: Map<EventLane, number> = new Map();
    const triggerCounts = new Map<string, number>();
    expect(isEventEligible(evt, game as any, laneCooldowns, triggerCounts, 2)).toBe(true);
  });
});

describe('EventCadence - pickWeightedEvent', () => {
  it('空列表返回 null', () => {
    expect(pickWeightedEvent([], Math.random)).toBeNull();
  });

  it('单个候选按概率判定', () => {
    const evt = createGameEvent('test', EventType.RANDOM, 0, '', 0);
    evt.cadenceMeta = { ...DEFAULT_AMBIENT_META, weight: 10 };

    const rng = vi.fn().mockReturnValue(0.001);
    const picked = pickWeightedEvent([evt], rng);
    expect(picked).toBe(evt);
  });

  it('高权重事件优先被选中', () => {
    const lowWeight = createGameEvent('low', EventType.RANDOM, 0, '', 0);
    lowWeight.cadenceMeta = { ...DEFAULT_AMBIENT_META, weight: 1, probability: 1 };
    const highWeight = createGameEvent('high', EventType.RANDOM, 0, '', 0);
    highWeight.cadenceMeta = { ...DEFAULT_AMBIENT_META, weight: 100, probability: 1 };

    const rng = vi.fn().mockReturnValue(0.01);
    const picked = pickWeightedEvent([lowWeight, highWeight], rng);
    expect(picked).toBe(highWeight);
  });
});

describe('EventCadence - 事件预算常量', () => {
  it('每回合最多 1 个事件', () => {
    expect(EVENT_BUDGET.maxEventsPerTurn).toBe(1);
  });

  it('任意事件后间隔 2 回合', () => {
    expect(EVENT_BUDGET.minGapAfterAnyEvent).toBe(2);
  });

  it('ambient 全局冷却 4 回合', () => {
    expect(EVENT_BUDGET.ambientGlobalCooldown).toBe(4);
  });
});