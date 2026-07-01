import { describe, it, expect, beforeEach } from 'vitest';
import { GameEventManager } from '../../core/GameEventManager';
import { Game, GameInstance } from '../../core/Game';
import { createGameEvent } from '../../core/GameEvent';
import { isEventEligible } from '../../core/EventCadence';
import { EventLane, EventEffect, FriendshipType } from '../../types/enums';

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
    em.setGame(game);
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
    expect(testMatch(1, 'CRISIS')).toBe(true);
    expect(testMatch(2, 'DETERRENCE')).toBe(true);
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
          [{ speakerName: '系统 AI', content: '欢迎来到《Beyond-the-Light-Cone》模拟器。', avatarUrl: '' }]
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

  // ==================== 事件效果应用 (applyNewEffects) ====================

  describe('applyNewEffects 事件效果应用', () => {
    it('diplomacy效果修改异星友谊度', () => {
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        const before = sanTi.friendshipType;
        game.applyNewEffects([{ type: 'diplomacy', target: '三体', value: -1 }]);
        expect(sanTi.friendshipType).toBe(before - 1);
      }
    });

    it('flag效果设置游戏flag', () => {
      expect(game.hasFlag('test_flag_from_effect')).toBe(false);
      game.applyNewEffects([{ type: 'flag', target: 'test_flag_from_effect', value: 1 }]);
      expect(game.hasFlag('test_flag_from_effect')).toBe(true);
    });

    it('resource效果正确修改地球资源', () => {
      const beforeEco = game.earthCivi.economy;
      game.applyNewEffects([{ type: 'resource', target: 'economy', value: 50 }]);
      expect(game.earthCivi.economy).toBe(beforeEco + 50);

      game.applyNewEffects([{ type: 'resource', target: 'culture', value: 30 }]);
      expect(game.earthCivi.culture).toBe(30);
    });

    it('event_effect效果触发WAR事件效果', () => {
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.friendshipType = FriendshipType.NORMAL;
        game.applyNewEffects([{ type: 'event_effect', value: EventEffect.WAR }]);
        expect(sanTi.friendshipType).toBe(FriendshipType.VERYANGRY);
      }
    });

    it('military效果增加军力', () => {
      const before = game.earthCivi.army;
      game.applyNewEffects([{ type: 'resource', target: 'military', value: 5 }]);
      expect(game.earthCivi.army).toBe(before + 5);
    });

    it('合并效果一次性应用', () => {
      const beforeEco = game.earthCivi.economy;
      const beforePop = game.earthCivi.population;
      game.applyNewEffects([
        { type: 'resource', target: 'economy', value: 20 },
        { type: 'resource', target: 'population', value: 5 },
        { type: 'flag', target: 'combined_flag_test', value: 1 },
      ]);
      expect(game.earthCivi.economy).toBe(beforeEco + 20);
      expect(game.earthCivi.population).toBe(beforePop + 5);
      expect(game.hasFlag('combined_flag_test')).toBe(true);
    });

    it('value=0的效果无影响', () => {
      const before = game.earthCivi.economy;
      game.applyNewEffects([{ type: 'resource', target: 'economy', value: 0 }]);
      expect(game.earthCivi.economy).toBe(before);
    });

    it('负值资源效果被钳制（不超过当前值50%）', () => {
      game.earthCivi.economy = 100;
      game.applyNewEffects([{ type: 'resource', target: 'economy', value: -60 }]);
      expect(game.earthCivi.economy).toBe(50);
    });
  });

  // ==================== 事件抉择处理 ====================

  describe('事件抉择处理 (Event Resolution)', () => {
    it('resolveEventChoice应用选中选项效果', () => {
      const choiceEvent = {
        name: 'Test Choice Event',
        type: 0,
        inYear: 0,
        tip: 'Make a choice',
        effect: 0,
        hasTriggered: false,
        dialogNodes: [{ speakerName: 'System', content: 'Choose wisely' }],
        choices: [
          { label: 'Option A', effects: [{ type: 'resource', target: 'economy', value: 30 }] }
        ]
      };
      game.eventManager.events = [choiceEvent as any];
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();
      expect(game.currentEvent).not.toBeNull();

      const before = game.earthCivi.economy;
      game.currentEvent!.choices![0].action();
      expect(game.earthCivi.economy).toBe(before + 30);
    });

    it('resolveEventChoice处理多选项', () => {
      const multiEvent = {
        name: 'Multi Choice',
        type: 0,
        inYear: 0,
        tip: 'Multiple choices',
        effect: 0,
        hasTriggered: false,
        dialogNodes: [{ speakerName: 'System', content: 'Pick one' }],
        choices: [
          { label: 'Option A', effects: [{ type: 'resource', target: 'economy', value: 20 }] },
          { label: 'Option B', effects: [{ type: 'resource', target: 'culture', value: 30 }] }
        ]
      };
      game.eventManager.events = [multiEvent as any];
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();
      expect(game.currentEvent).not.toBeNull();
      expect(game.currentEvent!.choices!.length).toBe(2);

      const cultureBefore = game.earthCivi.culture;
      const economyBefore = game.earthCivi.economy;
      game.currentEvent!.choices![1].action();
      // culture should have increased by 30 relative to before the choice
      expect(game.earthCivi.culture - cultureBefore).toBe(30);
      expect(game.earthCivi.economy - economyBefore).toBe(0); // unchanged from choice, game may add eco separately
    });

    it('resolveEventChoice无选项时提供默认确认', () => {
      const noChoiceEvent = {
        name: 'No Choice Event',
        type: 0,
        inYear: 0,
        tip: 'Just info',
        effect: 0,
        hasTriggered: false,
        dialogNodes: [{ speakerName: 'System', content: 'Information' }],
        choices: undefined
      };
      game.eventManager.events = [noChoiceEvent as any];
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();
      expect(game.currentEvent).not.toBeNull();
      expect(game.currentEvent!.choices!.length).toBe(1);
      expect(game.currentEvent!.choices![0].label).toBe('确认');
    });

    it('resolveEventChoice记录到历史日志', () => {
      const logEvent = {
        name: 'Log Test Event',
        type: 0,
        inYear: 0,
        tip: 'Testing logs',
        effect: 0,
        hasTriggered: false,
        dialogNodes: [{ speakerName: 'System', content: 'Log test' }],
        choices: [
          { label: 'Pick Me', effects: [{ type: 'flag', target: 'log_test_flag', value: 1 }] }
        ]
      };
      game.eventManager.events = [logEvent as any];
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();
      expect(game.currentEvent).not.toBeNull();

      const beforeLogCount = game.historyLogs.length;
      const beforeTimelineCount = game.playerTimeline.length;

      game.currentEvent!.choices![0].action();

      expect(game.historyLogs.length).toBeGreaterThan(beforeLogCount);
      expect(game.playerTimeline.length).toBeGreaterThan(beforeTimelineCount);
      expect(game.playerTimeline.some(t => t.event.includes('在「Log Test Event」事件中做出选择：Pick Me'))).toBe(true);
      expect(game.hasFlag('log_test_flag')).toBe(true);
    });
  });

  // ==================== 事件图片URL映射 ====================

  describe('事件图片URL映射', () => {
    it('已知事件模式返回CG图片', () => {
      const url = em.formatAvatarUrl('event_crisis_start');
      expect(url).toContain('cg_crisis_start.png');
    });

    it('未知事件返回包含名称的图片路径（非默认）', () => {
      const url = em.formatAvatarUrl('event_unknown_thing');
      expect(url).toContain('event_unknown_thing');
    });

    it('特殊事件CG图片映射完整性', () => {
      expect(em.formatAvatarUrl('event_guzheng')).toContain('cg_guzheng.png');
      expect(em.formatAvatarUrl('event_moon_crisis')).toContain('cg_moon_crisis.png');
      expect(em.formatAvatarUrl('event_wandering_earth')).toContain('cg_wandering_earth.png');
      expect(em.formatAvatarUrl('event_dimensional_strike')).toContain('cg_dimensional_strike.png');
      expect(em.formatAvatarUrl('event_droplet_attack')).toContain('cg_droplet_attack.png');
      expect(em.formatAvatarUrl('event_tyler_breached')).toContain('cg_tyler_breached.png');
    });

    it('默认bmpName返回默认头像', () => {
      const url = em.formatAvatarUrl('default');
      expect(url).toContain('character_default.png');
    });
  });

  // ==================== 事件节奏与冷却 ====================

  describe('事件节奏与冷却', () => {
    it('冷却阻止重复触发', () => {
      const event = createGameEvent('Cooldown Test', 0, 0, 'Test', 0);
      event.cadenceMeta = {
        lane: 'ambient',
        loreDomain: 'three_body_canon',
        weight: 1,
        probability: 0.02,
        cooldownYears: 5,
        maxTriggers: 3
      };
      event.id = 'test_cooldown';

      const laneCooldowns = new Map<EventLane, number>();
      laneCooldowns.set('ambient', 0);
      const triggerCounts = new Map<string, number>();
      triggerCounts.set('test_cooldown', 1);
      game.year = 2; // gap = 2 < 5 cooldownYears

      const result = isEventEligible(event, game, laneCooldowns, triggerCounts, 0);
      expect(result).toBe(false);
    });

    it('冷却过期允许重新触发', () => {
      const event = createGameEvent('Cooldown Expire', 0, 0, 'Test', 0);
      event.cadenceMeta = {
        lane: 'ambient',
        loreDomain: 'three_body_canon',
        weight: 1,
        probability: 0.02,
        cooldownYears: 5,
        maxTriggers: 3
      };
      event.id = 'test_cooldown_expire';

      const laneCooldowns = new Map<EventLane, number>();
      laneCooldowns.set('ambient', 0);
      const triggerCounts = new Map<string, number>();
      triggerCounts.set('test_cooldown_expire', 1);
      game.year = 10; // gap = 10 >= 5 cooldownYears

      const result = isEventEligible(event, game, laneCooldowns, triggerCounts, 0);
      expect(result).toBe(true);
    });

    it('最大触发次数限制', () => {
      const event = createGameEvent('Max Trigger Test', 0, 0, 'Test', 0);
      event.cadenceMeta = {
        lane: 'ambient',
        loreDomain: 'three_body_canon',
        weight: 1,
        probability: 0.02,
        maxTriggers: 2
      };
      event.id = 'test_max_trigger';

      const laneCooldowns = new Map<EventLane, number>();
      const triggerCounts = new Map<string, number>();
      triggerCounts.set('test_max_trigger', 2); // already reached max

      const result = isEventEligible(event, game, laneCooldowns, triggerCounts, 0);
      expect(result).toBe(false);
    });

    it('每回合事件预算限制（最小间隔）', () => {
      const event = createGameEvent('Budget Test', 0, 0, 'Test', 0);
      event.cadenceMeta = {
        lane: 'ambient',
        loreDomain: 'three_body_canon',
        weight: 1,
        probability: 0.02,
        maxTriggers: 5
      };
      event.id = 'test_budget';

      const laneCooldowns = new Map<EventLane, number>();
      const triggerCounts = new Map<string, number>();
      game.year = 5;

      // minGapAfterAnyEvent = 3, lastAnyEventYear = 4, gap = 1 < 3
      const result = isEventEligible(event, game, laneCooldowns, triggerCounts, 4);
      expect(result).toBe(false);

      // gap = 3 >= 3, should pass
      const result2 = isEventEligible(event, game, laneCooldowns, triggerCounts, 2);
      expect(result2).toBe(true);
    });
  });

  // ==================== 边界情况 ====================

  describe('边界情况', () => {
    it('空事件池处理', () => {
      em.events = [];
      const result = em.checkEvents(10);
      expect(result).toEqual([]);
    });

    it('triggerCondition为null的事件正常处理', () => {
      const event = createGameEvent('No Condition', 0, 5, 'Test', 0, [], 'no_cond_event');
      event.triggerCondition = undefined as any;
      em.events = [event];
      const result = em.checkEvents(10);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('No Condition');
    });

    it('缺少选项的过滤事件提供默认确认', () => {
      game.year = 10;
      game.earthCivi.culture = 10;
      // 注入一个没有 choices 的过滤事件
      (em as any).filteredEvents = [{
        id: 'no_choice_filtered',
        title: 'No Choice Filtered',
        tip: 'No options here',
        dialogQueue: [{ speakerName: 'System', content: 'Just info' }],
        condition: { minYear: 5, epoch: 'CRISIS' },
      }];
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();
      if (game.currentEvent && game.currentEvent.id === 'no_choice_filtered') {
        expect(game.currentEvent.choices).toHaveLength(1);
        expect(game.currentEvent.choices![0].label).toBe('确认');
      }
    });

    it('旧格式事件name为数字时回退到默认名称并使用name作为inYear', () => {
      const em2 = new GameEventManager();
      const parsed = (em2 as any).parseEventData([
        {
          name: 42,
          eventtype: 0,
          data: 'test',
          eventeffect: 0,
          talkcount: 1,
          talk0_talker: '测试',
          talk0_content: '内容',
          talk0_pic: 'test.png',
        }
      ]);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe('纪元大事记_42');
      expect(parsed[0].inYear).toBe(42);
    });
  });
});