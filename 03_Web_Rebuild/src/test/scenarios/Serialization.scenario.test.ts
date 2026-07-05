import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { gameReplacer, restorePrototypes, reviver } from '../../core/GameSerializer';
import { FlagManager } from '../../core/FlagManager';

/**
 * SCEN-SERIALIZATION: 统一序列化路径
 *
 * 验证：
 * S01 - gameReplacer 排除的字段与旧 inline replacer 一致
 * S02 - gameReplacer 正确处理 Map 和 Set 序列化
 * S03 - turnHistory 快照使用 gameReplacer（而非 inline replacer）
 * S04 - restorePrototypes 正确恢复 Map 和 Set
 * S05 - restorePrototypes 处理 FlagManager 引用别名（重新连接 flagManager 到 this.flags）
 */
describe('SCEN-SERIALIZATION', () => {
  let game: Game;

  const EXCLUDED_KEYS = [
    'currentEvent', 'eventQueue', 'isProcessing', '_rngProvider',
    'turnHistory', 'eventSystem', 'economySystem', 'populationSystem',
    'game', '_hadRunError', '_yearJustAdvanced', 'flagManager',
  ];

  beforeEach(() => {
    GameInstance.reset();
    game = GameInstance.get();
  });

  describe('S01: gameReplacer 排除的字段与旧 inline replacer 一致', () => {
    it('序列化后的 JSON 中不包含任何被排除的键', () => {
      const json = JSON.stringify(game, gameReplacer);
      const parsed = JSON.parse(json);

      for (const key of EXCLUDED_KEYS) {
        expect(parsed).not.toHaveProperty(key);
      }
    });

    it('currentEvent 被排除但已确认存在', () => {
      // 确保 currentEvent 确实存在于 Game 实例上
      expect(game).toHaveProperty('currentEvent');
      const json = JSON.stringify(game, gameReplacer);
      const parsed = JSON.parse(json);
      expect(parsed).not.toHaveProperty('currentEvent');
    });

    it('eventQueue 被排除但已确认存在', () => {
      expect(game).toHaveProperty('eventQueue');
      const json = JSON.stringify(game, gameReplacer);
      const parsed = JSON.parse(json);
      expect(parsed).not.toHaveProperty('eventQueue');
    });

    it('isProcessing 被排除但已确认存在', () => {
      expect(game).toHaveProperty('isProcessing');
      const json = JSON.stringify(game, gameReplacer);
      const parsed = JSON.parse(json);
      expect(parsed).not.toHaveProperty('isProcessing');
    });

    it('turnHistory 被排除但已确认存在', () => {
      expect(game).toHaveProperty('turnHistory');
      const json = JSON.stringify(game, gameReplacer);
      const parsed = JSON.parse(json);
      expect(parsed).not.toHaveProperty('turnHistory');
    });

    it('子系统字段（eventSystem, economySystem, populationSystem）被排除', () => {
      const json = JSON.stringify(game, gameReplacer);
      const parsed = JSON.parse(json);
      expect(parsed).not.toHaveProperty('eventSystem');
      expect(parsed).not.toHaveProperty('economySystem');
      expect(parsed).not.toHaveProperty('populationSystem');
    });

    it('flagManager 被排除但 flags 保留', () => {
      game.addFlag('test_flag');
      const json = JSON.stringify(game, gameReplacer);
      const parsed = JSON.parse(json);
      expect(parsed).not.toHaveProperty('flagManager');
      expect(parsed.flags).toBeDefined();
      expect(parsed.flags.dataType).toBe('Set');
      expect(parsed.flags.value).toContain('test_flag');
    });

    it('year 和 epoch 等持久化字段仍然保留', () => {
      const json = JSON.stringify(game, gameReplacer);
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('year');
      expect(parsed).toHaveProperty('epoch');
      expect(parsed).toHaveProperty('earthCivi');
    });
  });

  describe('S02: gameReplacer 正确处理 Map 和 Set 序列化', () => {
    it('Map 序列化为 { dataType: "Map", value: [...] }', () => {
      const obj = {
        name: 'test',
        data: new Map([['a', 1], ['b', 2]]),
      };
      const json = JSON.stringify(obj, gameReplacer);
      const parsed = JSON.parse(json);

      expect(parsed.data).toEqual({
        dataType: 'Map',
        value: [['a', 1], ['b', 2]],
      });
    });

    it('Set 序列化为 { dataType: "Set", value: [...] }', () => {
      const obj = {
        name: 'test',
        tags: new Set(['alpha', 'beta', 'gamma']),
      };
      const json = JSON.stringify(obj, gameReplacer);
      const parsed = JSON.parse(json);

      expect(parsed.tags).toEqual({
        dataType: 'Set',
        value: ['alpha', 'beta', 'gamma'],
      });
    });

    it('嵌套的 Map 和 Set 也正确序列化', () => {
      const obj = {
        nested: {
          map: new Map([['key', new Set([1, 2, 3])]]),
        },
      };
      const json = JSON.stringify(obj, gameReplacer);
      const parsed = JSON.parse(json);

      expect(parsed.nested.map.dataType).toBe('Map');
      expect(parsed.nested.map.value[0][1].dataType).toBe('Set');
      expect(parsed.nested.map.value[0][1].value).toEqual([1, 2, 3]);
    });

    it('非 Map/Set 对象不受影响', () => {
      const obj = {
        plain: { a: 1, b: 2 },
        arr: [1, 2, 3],
        str: 'hello',
        num: 42,
      };
      const json = JSON.stringify(obj, gameReplacer);
      const parsed = JSON.parse(json);

      expect(parsed.plain).toEqual({ a: 1, b: 2 });
      expect(parsed.arr).toEqual([1, 2, 3]);
      expect(parsed.str).toBe('hello');
      expect(parsed.num).toBe(42);
    });

    it('空 Map 和空 Set 也正确序列化', () => {
      const obj = {
        emptyMap: new Map(),
        emptySet: new Set(),
      };
      const json = JSON.stringify(obj, gameReplacer);
      const parsed = JSON.parse(json);

      expect(parsed.emptyMap).toEqual({ dataType: 'Map', value: [] });
      expect(parsed.emptySet).toEqual({ dataType: 'Set', value: [] });
    });
  });

  describe('S03: turnHistory 快照使用 gameReplacer', () => {
    it('运行一个回合后 turnHistory 包含有效 JSON', () => {
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();

      expect(game.turnHistory.length).toBeGreaterThan(0);
      const snapshot = game.turnHistory[0];
      expect(() => JSON.parse(snapshot)).not.toThrow();
    });

    it('turnHistory 快照中不包含被排除的 transient 字段', () => {
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();

      const snapshot = JSON.parse(game.turnHistory[0]);
      for (const key of EXCLUDED_KEYS) {
        expect(snapshot).not.toHaveProperty(key);
      }
    });

    it('turnHistory 快照中保留核心游戏状态', () => {
      game.earthCivi.isAiBrainEnabled = true;
      game.runARound();

      const snapshot = JSON.parse(game.turnHistory[0]);
      expect(snapshot).toHaveProperty('year');
      expect(snapshot).toHaveProperty('epoch');
      expect(snapshot).toHaveProperty('earthCivi');
      expect(snapshot).toHaveProperty('flags');
    });

    it('多回合后 turnHistory 最多保留 10 条快照', () => {
      game.earthCivi.isAiBrainEnabled = true;
      for (let i = 0; i < 15; i++) {
        game.runARound();
      }
      expect(game.turnHistory.length).toBeLessThanOrEqual(10);
    });
  });

  describe('S04: restorePrototypes 正确恢复 Map 和 Set', () => {
    it('序列化再反序列化后 Map 恢复为真正的 Map 实例', () => {
      const original = new Game();
      original.flags = new Set(['flag_a', 'flag_b']);
      original.alienCiviManager.aliens = new Map();
      original.alienCiviManager.aliens.set('test_alien', { name: 'Test' } as any);

      const json = JSON.stringify(original, gameReplacer);
      const parsed = JSON.parse(json, reviver);

      const restored = new Game();
      Object.assign(restored, parsed);
      restorePrototypes(restored);

      expect(restored.alienCiviManager.aliens).toBeInstanceOf(Map);
      expect(restored.alienCiviManager.aliens.has('test_alien')).toBe(true);
    });

    it('序列化再反序列化后 Set 恢复为真正的 Set 实例', () => {
      const original = new Game();
      original.flags = new Set(['flag_x', 'flag_y']);

      const json = JSON.stringify(original, gameReplacer);
      const parsed = JSON.parse(json, reviver);

      const restored = new Game();
      Object.assign(restored, parsed);
      restorePrototypes(restored);

      expect(restored.flags).toBeInstanceOf(Set);
      expect(restored.flags.has('flag_x')).toBe(true);
      expect(restored.flags.has('flag_y')).toBe(true);
    });

    it('eventManager 中的 Map 字段被正确恢复', () => {
      const original = new Game();
      original.eventManager.lastLaneTriggeredYear = new Map([['military', 2020]] as any);

      const json = JSON.stringify(original, gameReplacer);
      const parsed = JSON.parse(json, reviver);

      const restored = new Game();
      Object.assign(restored, parsed);
      restorePrototypes(restored);

      expect(restored.eventManager.lastLaneTriggeredYear).toBeInstanceOf(Map);
      expect(restored.eventManager.lastLaneTriggeredYear.get('military')).toBe(2020);
    });

    it('eventManager 中的 Set 字段被正确恢复', () => {
      const original = new Game();
      original.eventManager.triggeredFilteredIds = new Set(['id1', 'id2']);

      const json = JSON.stringify(original, gameReplacer);
      const parsed = JSON.parse(json, reviver);

      const restored = new Game();
      Object.assign(restored, parsed);
      restorePrototypes(restored);

      expect(restored.eventManager.triggeredFilteredIds).toBeInstanceOf(Set);
      expect(restored.eventManager.triggeredFilteredIds.has('id1')).toBe(true);
      expect(restored.eventManager.triggeredFilteredIds.has('id2')).toBe(true);
    });

    it('digitalLife 中的 resurrectedPersons Set 被正确恢复', () => {
      const original = new Game();
      original.digitalLife.resurrectedPersons = new Set(['person_a', 'person_b']);

      const json = JSON.stringify(original, gameReplacer);
      const parsed = JSON.parse(json, reviver);

      const restored = new Game();
      Object.assign(restored, parsed);
      restorePrototypes(restored);

      expect(restored.digitalLife.resurrectedPersons).toBeInstanceOf(Set);
      expect(restored.digitalLife.resurrectedPersons.has('person_a')).toBe(true);
    });
  });

  describe('S05: restorePrototypes 处理 FlagManager 引用别名', () => {
    it('restorePrototypes 将 flagManager 重新连接到 this.flags', () => {
      const restored = new Game();

      // 模拟存档加载后的状态：flagManager 持有不同的内部 Set
      const newFlags = new Set(['saved_flag_1', 'saved_flag_2']);
      restored.flags = newFlags;
      restored.flagManager = new FlagManager(); // 空的内部 Set，与 flags 不同

      // 此时 flagManager 与 flags 的引用不同
      expect(restored.flagManager.getInternalSet()).not.toBe(restored.flags);

      restorePrototypes(restored);

      // 验证 flagManager 现在与 flags 共享引用
      expect(restored.flagManager.getInternalSet()).toBe(restored.flags);
      expect(restored.flagManager.isSet('saved_flag_1')).toBe(true);
      expect(restored.flagManager.isSet('saved_flag_2')).toBe(true);
    });

    it('通过 flagManager 设置的 flag 与 flags 同步', () => {
      const restored = new Game();
      restored.flags = new Set(['existing']);
      restored.flagManager = new FlagManager();

      restorePrototypes(restored);

      restored.flagManager.set('new_flag');
      expect(restored.flags.has('new_flag')).toBe(true);
      expect(restored.flagManager.isSet('new_flag')).toBe(true);
    });

    it('通过 flags 直接添加的 flag 与 flagManager 同步', () => {
      const restored = new Game();
      restored.flags = new Set(['existing']);
      restored.flagManager = new FlagManager();

      restorePrototypes(restored);

      restored.flags.add('direct_add');
      expect(restored.flagManager.isSet('direct_add')).toBe(true);
    });

    it('flagManager 已经是正确的 FlagManager 实例且引用一致时不重建', () => {
      const restored = new Game();
      restored.flags = new Set(['flag']);
      restored.flagManager = new FlagManager(restored.flags);
      const originalFlagManager = restored.flagManager;

      restorePrototypes(restored);

      // 不应重建，因为引用已经一致
      expect(restored.flagManager).toBe(originalFlagManager);
      expect(restored.flagManager.getInternalSet()).toBe(restored.flags);
    });
  });
});