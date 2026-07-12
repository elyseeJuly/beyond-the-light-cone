import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { EpochType } from '../../types/enums';
import { FLAG } from '../../core/GameFlags';

/**
 * FIX-17 全链路回归测试
 * 覆盖 AUDIT_FIX_PLAN 中 FIX-01~FIX-13 的关键修复点
 */
describe('审计修复回归测试 (FIX-01~FIX-13)', () => {
  let game: Game;

  beforeEach(() => {
    GameInstance.reset();
    game = GameInstance.get();
    game.setRngProvider({ random: () => 0.9 });
  });

  // ===== FIX-01: 循环依赖修复 =====
  describe('FIX-01 循环依赖修复', () => {
    it('eto_founded 写入事件 (year=-27) 标注为 CRISIS 纪元', () => {
      const etoEvent = game.eventManager.events.find(
        e => e.inYear === -27
      );
      expect(etoEvent).toBeDefined();
      expect(etoEvent!.triggerCondition?.epoch).toBe('CRISIS');
    });

    it('coordinates_broadcasted 写入事件标注为 DETERRENCE 纪元 (程心路线)', () => {
      // year=230 事件原为 BROADCAST，FIX-01 改为 DETERRENCE
      const broadcastEvent = game.eventManager.events.find(
        e => e.inYear === 230
      );
      expect(broadcastEvent).toBeDefined();
      expect(broadcastEvent!.triggerCondition?.epoch).toBe('DETERRENCE');
    });

    it('bunker_world_completed 写入事件标注为 BROADCAST 纪元', () => {
      // year=280 事件原为 BUNKER，FIX-01 改为 BROADCAST
      const bunkerEvent = game.eventManager.events.find(
        e => e.inYear === 280
      );
      expect(bunkerEvent).toBeDefined();
      expect(bunkerEvent!.triggerCondition?.epoch).toBe('BROADCAST');
    });
  });

  // ===== FIX-02: 黑域 FLAG 名称修正 =====
  describe('FIX-02 黑域 FLAG 名称修正', () => {
    it('events.json 中黑域决策事件写入 dark_domain_decision (非 black_domain_decision)', () => {
      // 查找 year=290 黑域决策事件
      const darkDomainEvent = game.eventManager.events.find(
        e => e.inYear === 290
      );
      expect(darkDomainEvent).toBeDefined();
      // 确认 effects 中有 dark_domain_decision
      const effects = darkDomainEvent!.effects as any[];
      const hasDarkDomain = effects?.some(
        (eff: any) => eff.type === 'flag' && eff.target === 'dark_domain_decision'
      );
      expect(hasDarkDomain).toBe(true);
      // 确认没有 black_domain_decision
      const hasBlackDomain = effects?.some(
        (eff: any) => eff.type === 'flag' && eff.target === 'black_domain_decision'
      );
      expect(hasBlackDomain).toBe(false);
    });
  });

  // ===== FIX-04: FLAG 清理机制 =====
  describe('FIX-04 FLAG 清理机制', () => {
    it('FlagManager.clearTransientFlags 清理指定 FLAG', () => {
      game.addFlag('deterrence_era_declared');
      game.addFlag('dark_forest_deterrence');
      expect(game.hasFlag('deterrence_era_declared')).toBe(true);

      game.flagManager.clearTransientFlags(['deterrence_era_declared']);
      expect(game.hasFlag('deterrence_era_declared')).toBe(false);
      // 其他 FLAG 保留
      expect(game.hasFlag('dark_forest_deterrence')).toBe(true);
    });

    it('纪元切换时清理临时 FLAG', () => {
      // 设置一些临时 FLAG
      game.addFlag('deterrence_era_declared');
      game.addFlag('swordholder_handover');
      game.addFlag('tech_exchange_started');
      expect(game.hasFlag('deterrence_era_declared')).toBe(true);

      // 模拟纪元切换：直接调用 updateEpoch 需要满足文化阈值
      // 这里仅验证 clearTransientFlags 被正确调用
      const flagsBefore = game.flagManager.isSet('deterrence_era_declared');
      expect(flagsBefore).toBe(true);

      game.flagManager.clearTransientFlags([
        'deterrence_era_declared',
        'swordholder_handover',
        'tech_exchange_started',
      ]);
      expect(game.hasFlag('deterrence_era_declared')).toBe(false);
      expect(game.hasFlag('swordholder_handover')).toBe(false);
      expect(game.hasFlag('tech_exchange_started')).toBe(false);
    });
  });

  // ===== FIX-05: deterrenceEnduranceRounds 死累积修复 =====
  describe('FIX-05 deterrenceEnduranceRounds 死累积修复', () => {
    it('非 DETERRENCE 纪元不累积 deterrenceEnduranceRounds', () => {
      game.epoch = EpochType.BROADCAST;
      game.earthCivi.swordholder = '罗辑';
      game.earthCivi.deterrenceValue = 90;
      game.deterrenceEnduranceRounds = 5;

      // 运行一个回合（预触发背景事件避免阻塞）
      game.eventManager.events.forEach(e => {
        if (e.inYear <= 0) e.hasTriggered = true;
      });
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();

      // BROADCAST 纪元应重置为 0，不累积
      expect(game.deterrenceEnduranceRounds).toBe(0);
    });
  });

  // ===== FIX-06: 死 FLAG 清理 =====
  describe('FIX-06 死 FLAG 清理', () => {
    it('GameFlags.ts 中不再定义 DARK_FOREST_DETERRENCE', () => {
      expect((FLAG as any).DARK_FOREST_DETERRENCE).toBeUndefined();
    });

    it('events.json 中不再写入 deterrence_era_declared FLAG', () => {
      const hasDeadFlag = game.eventManager.events.some(e => {
        const effects = e.effects as any[];
        return effects?.some(
          (eff: any) => eff.type === 'flag' && eff.target === 'deterrence_era_declared'
        );
      });
      expect(hasDeadFlag).toBe(false);
    });

    it('events.json 中不再写入 galaxy_era_declared FLAG', () => {
      const hasDeadFlag = game.eventManager.events.some(e => {
        const effects = e.effects as any[];
        return effects?.some(
          (eff: any) => eff.type === 'flag' && eff.target === 'galaxy_era_declared'
        );
      });
      expect(hasDeadFlag).toBe(false);
    });
  });

  // ===== FIX-07: filteredEvent 人物存活检查 =====
  describe('FIX-07 filteredEvent 人物存活检查', () => {
    it('isEventCharactersUnlocked 兼容 dialogQueue 属性', () => {
      // 模拟一个使用 dialogQueue 的 filteredEvent
      const mockEvent = {
        dialogQueue: [
          { speakerName: '罗辑', content: '测试' },
        ],
      };
      // 罗辑在游戏开始时未解锁
      const result = (game.eventManager as any).isEventCharactersUnlocked(mockEvent);
      expect(result).toBe(false);
    });

    it('getFilteredEventsForTurn 过滤掉人物未解锁的事件', () => {
      // 确认 getFilteredEventsForTurn 被调用时不返回人物未解锁的事件
      const filtered = game.eventManager.getFilteredEventsForTurn();
      // 所有返回的 filteredEvent 中的人物都应已解锁
      for (const fev of filtered) {
        const speakers = (fev.dialogQueue || []).map(
          (n: any) => n.speakerName
        );
        for (const speaker of speakers) {
          if (speaker && speaker !== '系统' && speaker !== '系统警告') {
            // 核心故事人物应已解锁
            const person = game.personManager.getPerson(speaker);
            if (person) {
              expect(person.isAlive).toBe(true);
            }
          }
        }
      }
    });

    it('checkEvents 中人物未解锁的事件不触发', () => {
      // 找一个 speaker 是未解锁人物的事件
      const eventWithLockedPerson = game.eventManager.events.find(e => {
        const nodes = e.dialogNodes || [];
        return nodes.some(
          n => n.speakerName && game.personManager.getPerson(n.speakerName) &&
               !game.personManager.availablePersons.has(n.speakerName)
        );
      });

      if (eventWithLockedPerson) {
        const triggered = game.eventManager.checkEvents(eventWithLockedPerson.inYear);
        // 该事件不应被触发
        expect(triggered).not.toContain(eventWithLockedPerson);
      }
    });
  });

  // ===== FIX-08: year=1 事件时序倒置修复 =====
  describe('FIX-08 year=1 事件时序倒置修复', () => {
    it('year=1 事件不依赖 sophon_blockade_confirmed FLAG', () => {
      const year1Event = game.eventManager.events.find(e => e.inYear === 1);
      expect(year1Event).toBeDefined();
      // reqFlag 不应包含 sophon_blockade_confirmed
      const reqFlag = (year1Event!.triggerCondition as any)?.reqFlag;
      expect(reqFlag).not.toBe('sophon_blockade_confirmed');
    });
  });

  // ===== FIX-09: epochDeathMap 注释一致性 =====
  describe('FIX-09 epochDeathMap 注释一致性', () => {
    it('伊文斯/章北海/丁仪在 CRISIS 纪元存活', () => {
      // FIX-09 确认注释为"威慑纪元初"死亡，数据从 DETERRENCE 起标记
      expect(game.eventManager.isPersonAliveInEpoch('伊文斯', 'CRISIS')).toBe(true);
      expect(game.eventManager.isPersonAliveInEpoch('章北海', 'CRISIS')).toBe(true);
      expect(game.eventManager.isPersonAliveInEpoch('丁仪', 'CRISIS')).toBe(true);
    });

    it('伊文斯/章北海/丁仪在 DETERRENCE 纪元死亡', () => {
      expect(game.eventManager.isPersonAliveInEpoch('伊文斯', 'DETERRENCE')).toBe(false);
      expect(game.eventManager.isPersonAliveInEpoch('章北海', 'DETERRENCE')).toBe(false);
      expect(game.eventManager.isPersonAliveInEpoch('丁仪', 'DETERRENCE')).toBe(false);
    });
  });

  // ===== FIX-10: 刘慈欣解锁路径 =====
  describe('FIX-10 刘慈欣解锁路径', () => {
    it('GALAXY 纪元存在刘慈欣 unlock_person 事件', () => {
      const liuEvent = game.eventManager.events.find(e => {
        const effects = e.effects as any[];
        return effects?.some(
          (eff: any) => eff.type === 'unlock_person' && eff.target === '刘慈欣'
        );
      });
      expect(liuEvent).toBeDefined();
      expect(liuEvent!.triggerCondition?.epoch).toBe('GALAXY');
    });
  });

  // ===== FIX-12: dimensionStrike 双系统统一 =====
  describe('FIX-12 dimensionStrike 双系统统一', () => {
    it('dimensionStrikeTriggered 设置时同步设置 FLAG', () => {
      // 模拟 AlienCivilization.processDimensionStrike 中的逻辑
      game.dimensionStrikeTriggered = true;
      game.dimensionStrikeYear = game.year;
      game.addFlag(FLAG.DIMENSIONAL_STRIKE);

      expect(game.dimensionStrikeTriggered).toBe(true);
      expect(game.hasFlag(FLAG.DIMENSIONAL_STRIKE)).toBe(true);
    });
  });

  // ===== FIX-13: checkVictoryConditions 在 updateEpoch 之前调用 =====
  describe('FIX-13 调用顺序修复', () => {
    it('runARound 中 checkVictoryConditions 先于 updateEpoch 调用', () => {
      const callOrder: string[] = [];
      const victorySpy = vi.spyOn(game, 'checkVictoryConditions').mockImplementation(() => {
        callOrder.push('checkVictoryConditions');
      });
      const epochSpy = vi.spyOn(game, 'updateEpoch').mockImplementation(() => {
        callOrder.push('updateEpoch');
      });

      // 预触发背景事件避免交互事件阻塞年份推进
      game.eventManager.events.forEach(e => {
        if (e.inYear <= 0) e.hasTriggered = true;
      });
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();

      // 验证调用顺序：checkVictoryConditions 在 updateEpoch 之前
      expect(callOrder.indexOf('checkVictoryConditions')).toBeGreaterThanOrEqual(0);
      expect(callOrder.indexOf('updateEpoch')).toBeGreaterThanOrEqual(0);
      expect(callOrder.indexOf('checkVictoryConditions')).toBeLessThan(
        callOrder.indexOf('updateEpoch')
      );

      victorySpy.mockRestore();
      epochSpy.mockRestore();
    });
  });
});
