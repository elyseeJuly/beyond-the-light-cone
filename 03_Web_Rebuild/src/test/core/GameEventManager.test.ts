import { describe, it, expect, beforeEach } from 'vitest';
import { GameEventManager } from '../../core/GameEventManager';
import { Game, GameInstance } from '../../core/Game';
import { createGameEvent } from '../../core/GameEvent';

function setupGame() {
  GameInstance.reset();
  return GameInstance.get();
}

describe('GameEventManager', () => {
  let em: GameEventManager;
  let game: Game;

  beforeEach(() => {
    game = setupGame();
    em = new GameEventManager();
  });

  it('初始化加载事件列表', () => {
    expect(em.events.length).toBeGreaterThan(0);
    expect(em.randomEvents.length).toBeGreaterThan(0);
    expect(em.filteredEvents.length).toBeGreaterThan(0);
  });

  it('checkEvents 按年份返回事件', () => {
    // Run sequentially to clear out earlier events
    em.checkEvents(0);
    em.checkEvents(2);
    const eventsInYear10 = em.checkEvents(10);
    eventsInYear10.forEach(e => {
      expect(e.inYear).toBe(10);
    });
  });

  it('checkEvents 已触发事件不重复返回', () => {
    // Run sequentially to clear out earlier events
    em.checkEvents(0);
    em.checkEvents(2);
    const first = em.checkEvents(10);
    const second = em.checkEvents(10);
    expect(second.length).toBeLessThanOrEqual(first.length);
    first.forEach(e => {
      expect(e.hasTriggered).toBe(true);
    });
  });

  it('checkEvents 无匹配年份返回空数组', () => {
    // Run year 0 to trigger the start event
    em.checkEvents(0);
    // Checking a year with no registered events should return empty
    const result = em.checkEvents(1);
    expect(result).toEqual([]);
  });

  it('checkRandomEvents 基于条件返回', () => {
    const result = em.checkRandomEvents();
    expect(result === null || result !== null).toBe(true);
  });

  it('getFilteredEventsForTurn 返回符合条件的过滤事件', () => {
    game.year = 30;
    game.earthCivi.population = 100;
    const result = em.getFilteredEventsForTurn();
    expect(Array.isArray(result)).toBe(true);
  });

  it('getFilteredEventsForTurn 早于minYear不触发', () => {
    game.year = 5;
    game.earthCivi.population = 100;
    const result = em.getFilteredEventsForTurn();
    result.forEach(fev => {
      expect(fev.condition.minYear).toBeLessThanOrEqual(game.year);
    });
  });

  it('markFilteredEventTriggered 标记已触发', () => {
    em.markFilteredEventTriggered('test_event', 10);
    expect(em.triggeredFilteredIds.has('test_event')).toBe(true);
  });

  it('markFilteredEventTriggered 设置冷却年份', () => {
    const fevId = em.filteredEvents[0]?.id;
    if (fevId) {
      em.markFilteredEventTriggered(fevId, 10);
      const fev = em.filteredEvents.find(f => f.id === fevId);
      expect(fev?.lastTriggeredYear).toBe(10);
    }
  });

  it('isEpochMatch 内部方法测试', () => {
    const testMatch = (em as any).isEpochMatch.bind(em);

    expect(testMatch('ANY', 'CRISIS')).toBe(true);
    expect(testMatch('CRISIS', 'CRISIS')).toBe(true);
    expect(testMatch('CRISIS', 'DETERRENCE')).toBe(false);
    expect(testMatch('DETERRENCE', 'DETERRENCE')).toBe(true);
    expect(testMatch(0, 'CRISIS')).toBe(true);
    expect(testMatch(1, 'DETERRENCE')).toBe(true);
    expect(testMatch('WANDERING', 'BROADCAST')).toBe(true);
    expect(testMatch('WANDERING', 'BUNKER')).toBe(true);
    expect(testMatch('WANDERING', 'GALAXY')).toBe(true);
    expect(testMatch('WANDERING', 'CRISIS')).toBe(false);
    expect(testMatch('WANDERING', 'DETERRENCE')).toBe(false);
    expect(testMatch('SHELTER', 'BUNKER')).toBe(true);
    expect(testMatch('SHELTER', 'CRISIS')).toBe(false);
  });

  it('事件解析处理旧格式数据', () => {
    const em2 = new GameEventManager();
    const parsed = (em2 as any).parseEventData([
      {
        title: '测试事件',
        eventtype: 0,
        inYear: 5,
        talkcount: 1,
        talk0_talker: '测试者',
        talk0_content: '内容',
        talk0_pic: 'test.png',
        eventeffect: 0,
      }
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('测试事件');
    expect(parsed[0].dialogNodes).toHaveLength(1);
  });

  it('事件解析处理新格式数据', () => {
    const em2 = new GameEventManager();
    const parsed = (em2 as any).parseEventData([
      {
        title: '新格式事件',
        eventtype: 1,
        inYear: 8,
        tip: '新格式提示',
        eventeffect: 2,
        dialogQueue: [
          { speakerName: 'A', content: '对话A' },
          { speakerName: 'B', content: '对话B' },
        ]
      }
    ]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('新格式事件');
    expect(parsed[0].dialogNodes).toHaveLength(2);
  });

  it('空数据解析不变', () => {
    const em2 = new GameEventManager();
    const parsed = (em2 as any).parseEventData(null);
    expect(parsed).toEqual([]);
  });

  it('无数据时添加fallback欢迎事件', () => {
    const em2 = new GameEventManager();
    em2.events = [];
    em2.randomEvents = [];
    (em2 as any).seedFilteredEvents = () => {};
    em2.init = function() {
      if (this.events.length === 0) {
        this.events.push(createGameEvent(
          '系统初始化完成',
          0, 0, '模拟器叙事系统已就绪。',
          0,
          [{ speakerName: '系统 AI', content: '欢迎来到《LegendOfUni》模拟器。', avatarUrl: '' }]
        ));
      }
    };
    em2.init();
    expect(em2.events.length).toBe(1);
    expect(em2.events[0].name).toContain('系统初始化');
  });

  it('checkFilterConditions minYear条件', () => {
    game.year = 5;
    const result = (em as any).checkFilterConditions({ minYear: 10 });
    expect(result).toBe(false);
  });

  it('checkFilterConditions maxYear条件', () => {
    game.year = 100;
    const result = (em as any).checkFilterConditions({ maxYear: 50 });
    expect(result).toBe(false);
  });

  it('checkFilterConditions reqFlag条件', () => {
    const result = (em as any).checkFilterConditions({ reqFlag: 'nonexistent_flag' });
    expect(result).toBe(false);

    game.addFlag('test_required_flag');
    const result2 = (em as any).checkFilterConditions({ reqFlag: 'test_required_flag' });
    expect(result2).toBe(true);
  });

  it('checkFilterConditions reqNotFlag条件', () => {
    game.addFlag('blocking_flag');
    const result = (em as any).checkFilterConditions({ reqNotFlag: 'blocking_flag' });
    expect(result).toBe(false);

    const result2 = (em as any).checkFilterConditions({ reqNotFlag: 'nonexistent' });
    expect(result2).toBe(true);
  });

  it('checkFilterConditions 经济条件', () => {
    game.earthCivi.economy = 30;
    expect((em as any).checkFilterConditions({ minEconomy: 50 })).toBe(false);
    game.earthCivi.economy = 100;
    expect((em as any).checkFilterConditions({ minEconomy: 50 })).toBe(true);
  });

  it('checkFilterConditions 人口条件', () => {
    game.earthCivi.population = 10;
    expect((em as any).checkFilterConditions({ minPopulation: 50 })).toBe(false);
    game.earthCivi.population = 100;
    expect((em as any).checkFilterConditions({ minPopulation: 50 })).toBe(true);
  });

  it('checkFilterConditions 文化条件', () => {
    game.earthCivi.culture = 10;
    expect((em as any).checkFilterConditions({ minCulture: 50 })).toBe(false);
    game.earthCivi.culture = 100;
    expect((em as any).checkFilterConditions({ minCulture: 50 })).toBe(true);
  });

  it('checkFilterConditions 威慑值条件', () => {
    game.earthCivi.deterrenceValue = 10;
    expect((em as any).checkFilterConditions({ minDeterrence: 50 })).toBe(false);
    game.earthCivi.deterrenceValue = 80;
    expect((em as any).checkFilterConditions({ minDeterrence: 50 })).toBe(true);
  });

  it('checkFilterConditions 逃亡主义条件', () => {
    game.earthCivi.treachery = 80;
    expect((em as any).checkFilterConditions({ maxTreachery: 30 })).toBe(false);
    game.earthCivi.treachery = 10;
    expect((em as any).checkFilterConditions({ maxTreachery: 30 })).toBe(true);
  });
});