import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { FLAG, GameFlag } from '../../core/GameFlags';
import { FlagManager } from '../../core/FlagManager';
import { EventEffect, EventType } from '../../types/enums';
import { createGameEvent } from '../../core/GameEvent';

/**
 * SCEN-FLAG-TYPED: Flag 类型化 + 消灭文案字符串匹配
 *
 * 验证：
 * F01 - FLAG 常量与字符串值一致性
 * F02 - addFlag/hasFlag/removeFlag 接受 FLAG 常量
 * F03 - FlagManager 接受 FLAG 常量
 * F04 - grantsFlags 字段正确授予 flag
 * F05 - 遗留文案匹配 fallback 仍然工作
 * F06 - GameFlag 类型覆盖所有已知 flag
 */
describe('SCEN-FLAG-TYPED', () => {
  let game: Game;

  beforeEach(() => {
    GameInstance.reset();
    game = GameInstance.get();
  });

  describe('F01: FLAG 常量与字符串值一致性', () => {
    it('FLAG.DETERRENCE_ESTABLISHED 值为 deterrence_established', () => {
      expect(FLAG.DETERRENCE_ESTABLISHED).toBe('deterrence_established');
    });

    it('FLAG.GALAXY_EXODUS_SEEN 值为 galaxy_exodus_seen', () => {
      expect(FLAG.GALAXY_EXODUS_SEEN).toBe('galaxy_exodus_seen');
    });

    it('FLAG.WANDERING_COMPLETED 值为 wandering_completed', () => {
      expect(FLAG.WANDERING_COMPLETED).toBe('wandering_completed');
    });

    it('FLAG.DARK_DOMAIN_DECISION 值为 dark_domain_decision', () => {
      expect(FLAG.DARK_DOMAIN_DECISION).toBe('dark_domain_decision');
    });

    it('FLAG.CONQUEST_DECLARED 值为 conquest_declared', () => {
      expect(FLAG.CONQUEST_DECLARED).toBe('conquest_declared');
    });

    it('所有 FLAG 值唯一无重复', () => {
      const values = Object.values(FLAG);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('F02: addFlag/hasFlag/removeFlag 接受 FLAG 常量', () => {
    it('addFlag + hasFlag 使用 FLAG 常量', () => {
      game.addFlag(FLAG.DETERRENCE_ESTABLISHED);
      expect(game.hasFlag(FLAG.DETERRENCE_ESTABLISHED)).toBe(true);
      expect(game.hasFlag('deterrence_established')).toBe(true);
    });

    it('removeFlag 使用 FLAG 常量', () => {
      game.addFlag(FLAG.DETERRENCE_ESTABLISHED);
      game.removeFlag(FLAG.DETERRENCE_ESTABLISHED);
      expect(game.hasFlag(FLAG.DETERRENCE_ESTABLISHED)).toBe(false);
    });

    it('多个 FLAG 常量互不干扰', () => {
      game.addFlag(FLAG.WANDERING_COMPLETED);
      game.addFlag(FLAG.DIGITAL_ARK_UPGRADE);
      expect(game.hasFlag(FLAG.WANDERING_COMPLETED)).toBe(true);
      expect(game.hasFlag(FLAG.DIGITAL_ARK_UPGRADE)).toBe(true);
      game.removeFlag(FLAG.WANDERING_COMPLETED);
      expect(game.hasFlag(FLAG.WANDERING_COMPLETED)).toBe(false);
      expect(game.hasFlag(FLAG.DIGITAL_ARK_UPGRADE)).toBe(true);
    });
  });

  describe('F03: FlagManager 接受 FLAG 常量', () => {
    it('FlagManager.set 使用 FLAG 常量', () => {
      const fm = new FlagManager();
      fm.set(FLAG.SWORDHOLDER_APPOINTED);
      expect(fm.isSet(FLAG.SWORDHOLDER_APPOINTED)).toBe(true);
    });

    it('FlagManager.unset 使用 FLAG 常量', () => {
      const fm = new FlagManager();
      fm.set(FLAG.EPOCH_STALLED);
      fm.unset(FLAG.EPOCH_STALLED);
      expect(fm.isSet(FLAG.EPOCH_STALLED)).toBe(false);
    });
  });

  describe('F04: grantsFlags 字段正确授予 flag', () => {
    it('带 grantsFlags 的事件触发时自动授予 flag', () => {
      const event = createGameEvent(
        '测试事件', EventType.RANDOM, 0, '测试tip',
        EventEffect.NONE, [], 'test_grant',
        undefined, [], []
      );
      event.grantsFlags = [FLAG.SINGER_CONTACT, FLAG.RING_CONTACT];

      // 手动注入事件，确保它会被触发
      game.eventManager.events = [event];
      game.earthCivi.isAiBrainEnabled = true;
      
      // 清理可能导致阻塞的事件
      game.eventManager.filteredEvents = [];
      game.eventManager.randomEvents = [];
      
      game.runARound();
      
      // 处理可能的事件队列
      while (game.currentEvent || game.eventQueue.length > 0) {
        if (game.currentEvent?.choices?.[0]) {
          game.currentEvent.choices[0].action();
        }
        game.applyEventEffect(EventEffect.NONE, true);
        if (game.eventQueue.length > 0) {
          game.processNextEvent();
        } else {
          break;
        }
      }
      
      // grantsFlags 应该在事件触发时被授予
      expect(game.hasFlag(FLAG.SINGER_CONTACT)).toBe(true);
      expect(game.hasFlag(FLAG.RING_CONTACT)).toBe(true);
    });

    it('无 grantsFlags 的事件不会错误授予 flag', () => {
      const event = createGameEvent(
        '普通事件', EventType.RANDOM, 0, '普通tip',
        EventEffect.NONE, [], 'test_no_grant',
        undefined, [], []
      );
      // 不设置 grantsFlags

      game.eventManager.events = [event];
      game.earthCivi.isAiBrainEnabled = true;
      game.eventManager.filteredEvents = [];
      game.eventManager.randomEvents = [];
      
      game.runARound();
      
      while (game.currentEvent || game.eventQueue.length > 0) {
        if (game.currentEvent?.choices?.[0]) {
          game.currentEvent.choices[0].action();
        }
        game.applyEventEffect(EventEffect.NONE, true);
        if (game.eventQueue.length > 0) {
          game.processNextEvent();
        } else {
          break;
        }
      }
      
      // 不应该意外授予任何外星接触 flag
      expect(game.hasFlag(FLAG.SINGER_CONTACT)).toBe(false);
    });
  });

  describe('F05: 遗留文案匹配 fallback 仍然工作', () => {
    it('事件文案包含"歌者"时自动授予 singer_contact', () => {
      const event = createGameEvent(
        '歌者文明', EventType.RANDOM, 0, '歌者正在清理宇宙',
        EventEffect.NONE, [{ speakerName: '观测员', content: '发现了歌者的踪迹' }],
        'test_singer_legacy', undefined, [], []
      );
      // 不设置 grantsFlags，走 legacy fallback

      game.eventManager.events = [event];
      game.earthCivi.isAiBrainEnabled = true;
      game.eventManager.filteredEvents = [];
      game.eventManager.randomEvents = [];
      
      game.runARound();
      
      while (game.currentEvent || game.eventQueue.length > 0) {
        if (game.currentEvent?.choices?.[0]) {
          game.currentEvent.choices[0].action();
        }
        game.applyEventEffect(EventEffect.NONE, true);
        if (game.eventQueue.length > 0) {
          game.processNextEvent();
        } else {
          break;
        }
      }
      
      expect(game.hasFlag(FLAG.SINGER_CONTACT)).toBe(true);
    });

    it('事件文案包含"归零者"时自动授予 zeroers_contact', () => {
      const event = createGameEvent(
        '归零者广播', EventType.RANDOM, 0, '归零者发出了全宇宙广播',
        EventEffect.NONE, [{ speakerName: '研究员', content: '归零者想要重启宇宙' }],
        'test_zeroers_legacy', undefined, [], []
      );

      game.eventManager.events = [event];
      game.earthCivi.isAiBrainEnabled = true;
      game.eventManager.filteredEvents = [];
      game.eventManager.randomEvents = [];
      
      game.runARound();
      
      while (game.currentEvent || game.eventQueue.length > 0) {
        if (game.currentEvent?.choices?.[0]) {
          game.currentEvent.choices[0].action();
        }
        game.applyEventEffect(EventEffect.NONE, true);
        if (game.eventQueue.length > 0) {
          game.processNextEvent();
        } else {
          break;
        }
      }
      
      expect(game.hasFlag(FLAG.ZEROERS_CONTACT)).toBe(true);
    });
  });

  describe('F06: 纪元推进 flag 在 updateEpoch 中正确检查', () => {
    it('没有 deterrence_established 时无法进入威慑纪元', () => {
      game.earthCivi.culture = 300;
      game.updateEpoch();
      // 没有 deterrence_established，不应该进入威慑纪元
      expect(game.epoch).not.toBe(2); // DETERRENCE
    });

    it('设置 deterrence_established 后可以进入威慑纪元', () => {
      game.earthCivi.culture = 300;
      game.addFlag(FLAG.DETERRENCE_ESTABLISHED);
      game.updateEpoch();
      expect(game.epoch).toBe(2); // DETERRENCE
    });
  });
});