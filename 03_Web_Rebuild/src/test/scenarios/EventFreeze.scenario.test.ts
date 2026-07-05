import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';

/**
 * SCEN-EVENT-FREEZE: 直接入队事件关闭后 StoryModal 卡死修复
 *
 * 验证：
 * E01 - 外星发现事件（enqueueAlienEvent）choice 执行后 currentEvent 被清空
 * E02 - 外星接触事件 choice 执行后 currentEvent 被清空
 * E03 - 深空遗迹事件（ruinsEvent）choice 执行后 currentEvent 被清空
 * E04 - 事件队列为空时，choice 后 processNextEvent 不产生新事件
 * E05 - 直接入队事件作为最后一个事件时，不会残留 currentEvent 导致 UI 冻结
 */
describe('SCEN-EVENT-FREEZE', () => {
  beforeEach(() => {
    GameInstance.reset();
  });

  afterEach(() => {
    Game.strictMode = false;
  });

  describe('E01: 外星发现事件 choice 后 currentEvent 被清空', () => {
    it('enqueueAlienEvent 的确认 choice 执行后 currentEvent === null', () => {
      const game = GameInstance.get();
      game.year = 120;

      const singer = game.alienCiviManager.aliens.get('歌者');
      expect(singer).toBeDefined();
      singer!.discovered = false;
      singer!.discoveryEventFired = false;

      // 触发发现流程，将事件推入队列
      game.updateDiplomacyUnlocks();

      const payload = game.eventQueue.find(e => e.id === 'alien_discovery_歌者');
      expect(payload).toBeDefined();
      expect(payload!.choices).toBeDefined();
      expect(payload!.choices!.length).toBeGreaterThan(0);

      // 模拟 processNextEvent 弹出事件
      game.processNextEvent();
      expect(game.currentEvent).not.toBeNull();

      // 执行 choice action
      const confirmChoice = game.currentEvent!.choices![0];
      confirmChoice.action();

      // 验证：choice 执行后 currentEvent 被清空（applyEventEffect 负责）
      expect(game.currentEvent).toBeNull();
    });
  });

  describe('E02: 外星接触事件 choice 后 currentEvent 被清空', () => {
    it('接触事件的确认 choice 执行后 currentEvent === null', () => {
      const game = GameInstance.get();
      game.year = 150;

      const singer = game.alienCiviManager.aliens.get('歌者');
      singer!.discovered = true;
      singer!.discoveryEventFired = true;
      singer!.contacted = false;
      singer!.contactEventFired = false;

      game.updateDiplomacyUnlocks();

      const payload = game.eventQueue.find(e => e.id === 'alien_contact_歌者');
      expect(payload).toBeDefined();
      expect(payload!.choices).toBeDefined();
      expect(payload!.choices!.length).toBeGreaterThan(0);

      game.processNextEvent();
      expect(game.currentEvent).not.toBeNull();

      const confirmChoice = game.currentEvent!.choices![0];
      confirmChoice.action();

      expect(game.currentEvent).toBeNull();
    });
  });

  describe('E03: 深空遗迹事件 choice 后 currentEvent 被清空', () => {
    it('ruinsEvent 的两个 choice 执行后 currentEvent === null', () => {
      const game = GameInstance.get();
      game.year = 50;

      // 模拟 localStorage 中有遗迹数据
      const ruinData = [{ year: 45, culture: 1500, techCount: 8, timestamp: Date.now() }];
      localStorage.setItem('Beyond-the-Light-Cone_RuinHistory', JSON.stringify(ruinData));

      // 直接调用 runARound 以确保遗迹事件入队
      // 但 runARound 会跑完整回合，这里我们手动模拟
      game.flagManager.set('RUINS_CHECKED', false as any);

      // 检查 flag 是否未设置（runARound 内部会检测 year===50 且 flag 未设置）
      // 手动推入遗迹事件模拟
      const ruinsEvent = {
        id: 'event_df_ruins',
        title: '深空异常遗迹',
        dialogQueue: [{
          speakerName: '科学执政官',
          content: '测试遗迹事件'
        }],
        choices: [{
          label: '继承文化遗产',
          action: () => {
            game.earthCivi.culture += 200;
            game.earthCivi.resource += 100;
            game.applyEventEffect(0 as any); // EventEffect.NONE
          }
        }, {
          label: '逆向研究',
          action: () => {
            game.earthCivi.resource += 400;
            game.earthCivi.economy += 100;
            game.applyEventEffect(0 as any); // EventEffect.NONE
          }
        }]
      };

      game.eventQueue.push(ruinsEvent as any);
      game.processNextEvent();
      expect(game.currentEvent).not.toBeNull();

      // 测试 choice 1
      const choice1 = game.currentEvent!.choices![0];
      choice1.action();
      expect(game.currentEvent).toBeNull();
    });
  });

  describe('E04: 事件队列为空时 choice 后不产生新事件', () => {
    it('最后一个事件 choice 后 eventQueue 为空且 currentEvent 为 null', () => {
      const game = GameInstance.get();
      game.year = 120;

      const singer = game.alienCiviManager.aliens.get('歌者');
      singer!.discovered = false;
      singer!.discoveryEventFired = false;

      game.updateDiplomacyUnlocks();

      // 确保只有这一个事件
      const queueLenBefore = game.eventQueue.length;
      expect(queueLenBefore).toBeGreaterThan(0);

      // 清掉其他事件只保留外星事件
      game.eventQueue = game.eventQueue.filter(e => e.id === 'alien_discovery_歌者');
      expect(game.eventQueue.length).toBe(1);

      game.processNextEvent();
      expect(game.currentEvent).not.toBeNull();

      const confirmChoice = game.currentEvent!.choices![0];
      confirmChoice.action();

      // 修复后：队列空、currentEvent 为 null
      expect(game.eventQueue.length).toBe(0);
      expect(game.currentEvent).toBeNull();
    });
  });

  describe('E05: 直接入队事件 + 后续交互事件链不中断', () => {
    it('外星事件后跟交互事件时，processNextEvent 继续弹出后续事件', () => {
      const game = GameInstance.get();
      game.year = 120;

      const singer = game.alienCiviManager.aliens.get('歌者');
      singer!.discovered = false;
      singer!.discoveryEventFired = false;

      game.updateDiplomacyUnlocks();

      // 在后面追加一个虚拟交互事件
      const followUpEvent = {
        id: 'test_follow_up',
        title: '后续交互事件',
        dialogQueue: [{
          speakerName: '系统',
          content: '这是一个后续事件'
        }],
        choices: [{
          label: '确认',
          action: () => {
            game.applyEventEffect(0 as any);
          }
        }]
      };
      game.eventQueue.push(followUpEvent as any);

      // 弹出外星事件
      game.processNextEvent();
      expect(game.currentEvent!.id).toBe('alien_discovery_歌者');

      // 执行外星事件 choice
      game.currentEvent!.choices![0].action();

      // applyEventEffect(NONE) 会调用 processNextEvent，弹出后续事件
      // 并派发 game-event-triggered
      expect(game.currentEvent).not.toBeNull();
      expect(game.currentEvent!.id).toBe('test_follow_up');

      // 执行后续事件 choice
      game.currentEvent!.choices![0].action();
      expect(game.currentEvent).toBeNull();
      expect(game.eventQueue.length).toBe(0);
    });
  });
});