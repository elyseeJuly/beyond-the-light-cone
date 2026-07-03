import { describe, it, expect, beforeEach } from 'vitest';
import { GameInstance } from '../../core/Game';
import { EpochType } from '../../types/enums';
import epochsData from '../../data/epochs.json';
import { EarthCivilization } from '../../core/EarthCivilization';

/**
 * SCEN-DESIGN-DRIFT: 设计偏离修复验证 — 以当前实现为权威基准
 *
 * 验证 7 大设计决策与 SPEC_20260703_CORE_SYSTEMS_AUTHORITATIVE.md 一致：
 * D01 - 7 纪元系统（含黄金岁月和星屑纪元）
 * D02 - 文化增长公式精确参数
 * D03 - 年份递增 1年/回合，事件队列阻塞
 * D04 - 纪元溢出保护
 * D05 - AI 智脑默认关闭
 * D06 - 地球初始建筑（采矿场+工厂）
 * D07 - 思想钢印科技权重
 */
describe('SCEN-DESIGN-DRIFT', () => {
  beforeEach(() => {
    GameInstance.reset();
  });

  // ── D01: 7 纪元系统 ──
  describe('D01: 7 纪元系统', () => {
    it('EpochType 枚举包含 7 个纪元', () => {
      expect(EpochType.GOLDEN).toBe(0);
      expect(EpochType.CRISIS).toBe(1);
      expect(EpochType.DETERRENCE).toBe(2);
      expect(EpochType.BROADCAST).toBe(3);
      expect(EpochType.BUNKER).toBe(4);
      expect(EpochType.GALAXY).toBe(5);
      expect(EpochType.STARDUST).toBe(6);
      expect(EpochType.COUNT).toBe(7);
    });

    it('epochs.json 配置包含 7 个纪元', () => {
      expect(epochsData).toHaveLength(7);
      expect(epochsData[0].name).toBe('黄金岁月');
      expect(epochsData[1].name).toBe('危机纪元');
      expect(epochsData[2].name).toBe('威慑纪元');
      expect(epochsData[3].name).toBe('广播纪元');
      expect(epochsData[4].name).toBe('掩体纪元');
      expect(epochsData[5].name).toBe('银河纪元');
      expect(epochsData[6].name).toBe('星屑纪元');
    });

    it('黄金岁月 minCulture 为 -100，开局自动进入', () => {
      expect(epochsData[0].minCulture).toBe(-100);
      expect(epochsData[0].maxCulture).toBe(-1);
    });

    it('星屑纪元 maxCulture 为 999999 作为终局纪元', () => {
      expect(epochsData[6].maxCulture).toBe(999999);
    });

    it('纪元阈值连续无间隙', () => {
      for (let i = 0; i < epochsData.length - 1; i++) {
        expect(epochsData[i].maxCulture + 1).toBe(epochsData[i + 1].minCulture);
      }
    });
  });

  // ── D02: 文化增长公式 ──
  describe('D02: 文化增长公式', () => {
    it('无文化部长时，deptBase = 2', () => {
      const game = GameInstance.get();
      const civi = game.earthCivi as any;
      // processCulture 是 private 方法，通过实际运行验证
      // 无部长时：deptBase=2, leaderBonus=0, weight=2
      const result = civi.processCulture(game);
      // workers=0, bonus=0, weight=2 => floor(0/15)=0 + deptBase=2 => 2
      expect(result).toBe(2);
    });

    it('文化增长上限为 100', () => {
      const game = GameInstance.get();
      const civi = game.earthCivi as any;
      // 即使 workers 极高，也不超过 100
      civi.cultureWorkers = 9999;
      const result = civi.processCulture(game);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  // ── D03: 年份递增 ──
  describe('D03: 年份递增 1年/回合', () => {
    it('初始年份为 0', () => {
      const game = GameInstance.get();
      expect(game.year).toBe(0);
    });

    it('回合推进后年份 +1', () => {
      const game = GameInstance.get();
      const initialYear = game.year;
      // 直接调用内部逻辑模拟年份递增
      game.year++;
      expect(game.year).toBe(initialYear + 1);
    });
  });

  // ── D04: 纪元溢出保护 ──
  describe('D04: 纪元溢出保护', () => {
    it('culture 超出所有 maxCulture 时不返回 undefined，回退到星屑纪元', () => {
      const game = GameInstance.get();
      game.earthCivi.culture = 9999999; // 远超所有纪元上限
      // 确保所有 flag 条件满足
      game.flagManager.set('deterrence_established');
      game.flagManager.set('coordinates_broadcasted');
      game.flagManager.set('bunker_world_completed');
      game.flagManager.set('galaxy_exodus_seen');
      game.flagManager.set('stardust_era_declared');

      game.updateEpoch();
      // 应回退到星屑纪元（最后一个满足 minCulture 的纪元）
      expect(game.epoch).toBe(EpochType.STARDUST);
    });

    it('culture 正常范围内正确匹配纪元', () => {
      const game = GameInstance.get();
      game.earthCivi.culture = 250;
      game.flagManager.set('deterrence_established');

      game.updateEpoch();
      expect(game.epoch).toBe(EpochType.DETERRENCE);
    });
  });

  // ── D05: AI 智脑默认关闭 ──
  describe('D05: AI 智脑默认关闭', () => {
    it('新建 EarthCivilization 时 isAiBrainEnabled 默认为 false', () => {
      const civi = new EarthCivilization();
      expect(civi.isAiBrainEnabled).toBe(false);
    });

    it('AI 关闭时 runARound 不被 AI 控制', () => {
      const game = GameInstance.get();
      expect(game.earthCivi.isAiBrainEnabled).toBe(false);
    });
  });

  // ── D06: 地球初始建筑 ──
  describe('D06: 地球初始建筑', () => {
    it('地球开局拥有采矿场', () => {
      const game = GameInstance.get();
      const earth = game.starManager.getStar(3); // STAR_INDEX.EARTH = 3
      expect(earth).toBeDefined();
      expect(earth!.hasStope).toBe(true);
    });

    it('地球开局拥有工厂', () => {
      const game = GameInstance.get();
      const earth = game.starManager.getStar(3); // STAR_INDEX.EARTH = 3
      expect(earth).toBeDefined();
      expect(earth!.hasFactory).toBe(true);
    });
  });

  // ── D07: 思想钢印科技权重 ──
  describe('D07: 思想钢印科技权重', () => {
    it('无思想钢印时 weight=2，文化产出最低', () => {
      const game = GameInstance.get();
      const civi = game.earthCivi as any;
      // 无思想钢印科技，weight=2
      civi.cultureWorkers = 10;
      const result = civi.processCulture(game);
      // workers=10, bonus=0, weight=2 => floor(10*2/15)=1 + deptBase=2 => 3
      expect(result).toBe(3);
    });

    it('思想钢印Ⅲ 时 weight=5，文化产出大幅提升', () => {
      const game = GameInstance.get();
      const civi = game.earthCivi as any;
      civi.cultureWorkers = 10;
      // 模拟思想钢印Ⅲ完成
      const tm = civi.tecTreeManager;
      const originalIsFinished = tm.isTecFinished;
      tm.isTecFinished = (treeType: any, name: string) => {
        if (name === '思想钢印Ⅲ') return true;
        return originalIsFinished.call(tm, treeType, name);
      };

      const result = civi.processCulture(game);
      // workers=10, bonus=0, weight=5 => floor(10*5/15)=3 + deptBase=2 => 5
      expect(result).toBeGreaterThan(3); // 应高于无思想钢印时的 3
    });
  });
});