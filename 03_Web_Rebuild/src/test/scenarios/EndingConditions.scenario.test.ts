import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { TecTreeType } from '../../types/enums';
import { FLAG } from '../../core/GameFlags';

/**
 * SCEN-ENDING-CONDITIONS: 结局条件数据化，判定/预报同源
 *
 * 验证：
 * V01 - getVictoryConditions() 返回 6 个条件
 * V02 - 每个条件都有 check() 和 progress() 函数
 * V03 - check() 与 progress() 一致性：check() 为 true 时 progress() 必定为 100
 * V04 - getEndingForecast() 从 getVictoryConditions() 统一数据源派生进度
 * V05 - DARK_DOMAIN 进度使用"黑域生成"技术（不是"光速飞船推进器"旧 bug）
 * V06 - getEndingForecast 返回 6 个胜利条件 + 2 个威胁
 * V07 - 修改 getVictoryConditions() 中的条件自动影响 getEndingForecast()
 */
describe('SCEN-ENDING-CONDITIONS', () => {
  beforeEach(() => {
    GameInstance.reset();
  });

  afterEach(() => {
    Game.strictMode = false;
  });

  // ── V01: getVictoryConditions() 返回 6 个条件 ──
  describe('V01: getVictoryConditions() 返回 6 个条件', () => {
    it('应返回 HIDDEN, WANDERING, DIGITAL, DETERRENCE, CONQUEST, DARK_DOMAIN 共 6 种', () => {
      const game = GameInstance.get();
      const conditions = (game as any).getVictoryConditions();

      expect(conditions).toHaveLength(6);

      const types = conditions.map((c: any) => c.type);
      expect(types).toContain('HIDDEN');
      expect(types).toContain('WANDERING');
      expect(types).toContain('DIGITAL');
      expect(types).toContain('DETERRENCE');
      expect(types).toContain('CONQUEST');
      expect(types).toContain('DARK_DOMAIN');
    });

    it('每个条件类型唯一，无重复', () => {
      const game = GameInstance.get();
      const conditions = (game as any).getVictoryConditions();
      const types = conditions.map((c: any) => c.type);
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    });
  });

  // ── V02: 每个条件都有 check() 和 progress() 函数 ──
  describe('V02: 每个条件都有 check() 和 progress() 函数', () => {
    it('所有 6 个条件均有 check() 方法', () => {
      const game = GameInstance.get();
      const conditions = (game as any).getVictoryConditions();

      for (const cond of conditions) {
        expect(cond.check).toBeDefined();
        expect(typeof cond.check).toBe('function');
        expect(cond.check()).toBe(false); // 初始状态下所有条件均为 false
      }
    });

    it('所有 6 个条件均有 progress() 方法', () => {
      const game = GameInstance.get();
      const conditions = (game as any).getVictoryConditions();

      for (const cond of conditions) {
        expect(cond.progress).toBeDefined();
        expect(typeof cond.progress).toBe('function');
        const p = cond.progress();
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(100);
      }
    });
  });

  // ── V03: check() 与 progress() 一致性 ──
  describe('V03: check() 与 progress() 一致性 — check() 为 true 时 progress() 必定为 100', () => {
    it('WANDERING 条件满足时，check() 返回 true 且 progress() 返回 100', () => {
      const game = GameInstance.get();

      // 设置 WANDERING 条件所需的所有状态
      game.year = 260;
      game.earthCivi.population = 100;

      // 直接完成行星发动机Ⅲ型技术
      const aeroTree = game.earthCivi.tecTreeManager.trees.get(TecTreeType.AEROSPACE);
      const engine3Node = aeroTree?.nodes.get('行星发动机Ⅲ型');
      if (engine3Node) engine3Node.finished = true;

      // 直接完成新家园选址技术
      const interTree = game.earthCivi.tecTreeManager.trees.get(TecTreeType.INTERSTELLAR);
      const homeNode = interTree?.nodes.get('新家园选址');
      if (homeNode) homeNode.finished = true;

      // 添加流浪完成标志
      game.addFlag(FLAG.WANDERING_COMPLETED);

      // 确保互斥 flag 均未设置
      expect(game.hasFlag(FLAG.DIGITAL_ARK_UPGRADE)).toBe(false);
      expect(game.hasFlag(FLAG.DARK_DOMAIN_DECISION)).toBe(false);
      expect(game.hasFlag(FLAG.CONQUEST_DECLARED)).toBe(false);
      expect(game.hasFlag(FLAG.SWORDHOLDER_APPOINTED)).toBe(false);
      expect(game.hasFlag(FLAG.ZERO_HOMER_CONTACTED)).toBe(false);

      const conditions = (game as any).getVictoryConditions();
      const wandering = conditions.find((c: any) => c.type === 'WANDERING');

      expect(wandering).toBeDefined();
      expect(wandering.check()).toBe(true);
      expect(wandering.progress()).toBe(100);
    });

    it('不满足 WANDERING 条件时，check() 返回 false', () => {
      const game = GameInstance.get();
      const conditions = (game as any).getVictoryConditions();
      const wandering = conditions.find((c: any) => c.type === 'WANDERING');

      expect(wandering).toBeDefined();
      expect(wandering.check()).toBe(false);
    });
  });

  // ── V04: getEndingForecast() 从 getVictoryConditions() 统一数据源派生 ──
  describe('V04: getEndingForecast() 派生自 getVictoryConditions()（不重复逻辑）', () => {
    it('getEndingForecast 的胜利条件进度与 getVictoryConditions 一致', () => {
      const game = GameInstance.get();
      const conditions = (game as any).getVictoryConditions();
      const forecast = game.getEndingForecast();

      const displayNames: Record<string, string> = {
        WANDERING: '流浪胜利',
        DIGITAL: '数字飞升',
        DETERRENCE: '黑暗森林威慑',
        DARK_DOMAIN: '黑域安全声明',
        CONQUEST: '星系征服',
        HIDDEN: '死神永生',
      };

      for (const cond of conditions) {
        const expectedProgress = cond.progress();
        const name = displayNames[cond.type] || cond.label;
        const forecastEntry = forecast.find(
          (f: { name: string; progress: number; isThreat: boolean }) =>
            f.name === name && !f.isThreat
        );
        expect(forecastEntry).toBeDefined();
        expect(forecastEntry!.progress).toBe(expectedProgress);
      }
    });

    it('改变游戏状态后，getEndingForecast 自动反映最新进度', () => {
      const game = GameInstance.get();
      const forecastBefore = game.getEndingForecast();
      const wanderingBefore = forecastBefore.find(
        (f) => f.name === '流浪胜利'
      );
      expect(wanderingBefore).toBeDefined();

      const progressBefore = wanderingBefore!.progress;

      // 添加 WANDERING_COMPLETED flag，应该影响进度
      game.addFlag(FLAG.WANDERING_COMPLETED);

      const forecastAfter = game.getEndingForecast();
      const wanderingAfter = forecastAfter.find(
        (f) => f.name === '流浪胜利'
      );
      expect(wanderingAfter).toBeDefined();

      // 进度应该增加（因为 WANDERING_COMPLETED 贡献了 25 分）
      expect(wanderingAfter!.progress).toBeGreaterThan(progressBefore);
    });
  });

  // ── V05: DARK_DOMAIN 进度使用"黑域生成"技术 ──
  describe('V05: DARK_DOMAIN 进度使用"黑域生成"技术（不是"光速飞船推进器"）', () => {
    it('DARK_DOMAIN 条件描述中提及黑域生成', () => {
      const game = GameInstance.get();
      const conditions = (game as any).getVictoryConditions();
      const darkDomain = conditions.find((c: any) => c.type === 'DARK_DOMAIN');

      expect(darkDomain).toBeDefined();
      expect(darkDomain.description).toContain('黑域生成');
      expect(darkDomain.description).not.toContain('光速飞船推进器');
    });

    it('完成"黑域生成"技术后 DARK_DOMAIN 进度增加', () => {
      const game = GameInstance.get();
      const conditions = (game as any).getVictoryConditions();
      const darkDomain = conditions.find((c: any) => c.type === 'DARK_DOMAIN');

      const progressBefore = darkDomain.progress();

      // 直接完成"黑域生成"技术
      const interTree = game.earthCivi.tecTreeManager.trees.get(TecTreeType.INTERSTELLAR);
      const blackDomainNode = interTree?.nodes.get('黑域生成');
      if (blackDomainNode) blackDomainNode.finished = true;

      const progressAfter = darkDomain.progress();

      // 黑域生成技术贡献 40 分
      expect(progressAfter).toBe(progressBefore + 40);
    });

    it('"光速飞船推进器"技术不存在于科技树中（确保旧 bug 不会复现）', () => {
      const game = GameInstance.get();
      const tm = game.earthCivi.tecTreeManager;

      // isTecFinishedAnywhere 对不存在的技术返回 false
      expect(tm.isTecFinishedAnywhere('光速飞船推进器')).toBe(false);
    });
  });

  // ── V06: getEndingForecast 返回 6 个胜利条件 + 2 个威胁 ──
  describe('V06: getEndingForecast 返回 6 个胜利条件 + 2 个威胁', () => {
    it('getEndingForecast 总共返回 8 个条目', () => {
      const game = GameInstance.get();
      const forecast = game.getEndingForecast();
      expect(forecast).toHaveLength(8);
    });

    it('其中 6 个是胜利条件（isThreat=false），2 个是威胁（isThreat=true）', () => {
      const game = GameInstance.get();
      const forecast = game.getEndingForecast();

      const victoryEntries = forecast.filter((f) => !f.isThreat);
      const threatEntries = forecast.filter((f) => f.isThreat);

      expect(victoryEntries).toHaveLength(6);
      expect(threatEntries).toHaveLength(2);
    });

    it('威胁条目包含"氦闪危机"和"逃亡崩溃"', () => {
      const game = GameInstance.get();
      const forecast = game.getEndingForecast();
      const threatEntries = forecast.filter((f) => f.isThreat);

      const threatNames = threatEntries.map((f) => f.name);
      expect(threatNames).toContain('氦闪危机');
      expect(threatNames).toContain('逃亡崩溃');
    });

    it('胜利条件条目包含全部 6 种结局名称', () => {
      const game = GameInstance.get();
      const forecast = game.getEndingForecast();
      const victoryNames = forecast
        .filter((f) => !f.isThreat)
        .map((f) => f.name);

      expect(victoryNames).toContain('流浪胜利');
      expect(victoryNames).toContain('数字飞升');
      expect(victoryNames).toContain('黑暗森林威慑');
      expect(victoryNames).toContain('黑域安全声明');
      expect(victoryNames).toContain('星系征服');
      expect(victoryNames).toContain('死神永生');
    });
  });

  // ── V07: 修改 getVictoryConditions() 中的条件自动影响 getEndingForecast() ──
  describe('V07: 修改 getVictoryConditions() 中的条件自动影响 getEndingForecast()', () => {
    it('getEndingForecast() 调用 getVictoryConditions() 同一数据源', () => {
      const game = GameInstance.get();

      // 取得初始的 conditions 和 forecast
      const conditions = (game as any).getVictoryConditions();
      const forecast = game.getEndingForecast();

      const displayNames: Record<string, string> = {
        WANDERING: '流浪胜利',
        DIGITAL: '数字飞升',
        DETERRENCE: '黑暗森林威慑',
        DARK_DOMAIN: '黑域安全声明',
        CONQUEST: '星系征服',
        HIDDEN: '死神永生',
      };

      // 验证 forecast 中每个胜利条件的进度完全等于 conditions 的 progress()
      for (const cond of conditions) {
        const name = displayNames[cond.type] || cond.label;
        const forecastEntry = forecast.find(
          (f: { name: string; progress: number; isThreat: boolean }) =>
            f.name === name && !f.isThreat
        );
        expect(forecastEntry).toBeDefined();
        expect(forecastEntry!.progress).toBe(cond.progress());
      }
    });

    it('多次调用 getEndingForecast 始终反映最新 condition 状态', () => {
      const game = GameInstance.get();

      // 第一次调用
      const forecast1 = game.getEndingForecast();

      // 修改游戏状态
      game.year = 300;
      game.addFlag(FLAG.DARK_DOMAIN_DECISION);

      // 第二次调用
      const forecast2 = game.getEndingForecast();

      // 黑域安全声明进度应该发生变化
      const darkDomain1 = forecast1.find((f) => f.name === '黑域安全声明');
      const darkDomain2 = forecast2.find((f) => f.name === '黑域安全声明');

      expect(darkDomain1).toBeDefined();
      expect(darkDomain2).toBeDefined();
      expect(darkDomain2!.progress).not.toBe(darkDomain1!.progress);
    });

    it('getEndingForecast 不包含独立的胜利条件逻辑，全部由 getVictoryConditions 驱动', () => {
      const game = GameInstance.get();

      // 间谍：通过直接调用 getVictoryConditions 来验证 forecast 的一致性
      const conditions = (game as any).getVictoryConditions();
      const forecast = game.getEndingForecast();

      // 胜利条件数量一致（6 个在 conditions，6 个在 forecast 中 isThreat=false）
      const victoryInForecast = forecast.filter((f) => !f.isThreat);
      expect(victoryInForecast.length).toBe(conditions.length);

      // 每个 condition 的 progress 与 forecast 中对应条目一致
      const displayNames: Record<string, string> = {
        WANDERING: '流浪胜利',
        DIGITAL: '数字飞升',
        DETERRENCE: '黑暗森林威慑',
        DARK_DOMAIN: '黑域安全声明',
        CONQUEST: '星系征服',
        HIDDEN: '死神永生',
      };

      for (const cond of conditions) {
        const name = displayNames[cond.type] || cond.label;
        const match = forecast.find((f) => f.name === name && !f.isThreat);
        expect(match).toBeDefined();
        expect(match!.progress).toBe(cond.progress());
      }
    });
  });
});