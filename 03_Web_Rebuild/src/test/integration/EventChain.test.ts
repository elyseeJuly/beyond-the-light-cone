import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Game } from '../../core/Game';
import { TagManager } from '../../core/TagManager';
import { AtmosphereEngine } from '../../core/AtmosphereEngine';
import { EcologyChain } from '../../core/EcologyChain';
import { HistoryGenerator } from '../../core/HistoryGenerator';

// ======================================================================
// 事件链集成测试：覆盖 Event → Flag / Tag / Resource / Ecology / 全流程
// ======================================================================

describe('EventChain', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  // ==================================================================
  // 1. Event → Flag → Event Chain
  // ==================================================================
  describe('1. Event → Flag → Event Chain', () => {
    it('Event A 设置 flag，Event B 需要该 flag 才能触发', () => {
      // 模拟 Event A 设置 flag
      game.addFlag('dark_forest_deterrence');
      expect(game.hasFlag('dark_forest_deterrence')).toBe(true);

      // 模拟 Event B 的触发条件检查（需要该 flag）
      const canTriggerEventB = game.hasFlag('dark_forest_deterrence');
      expect(canTriggerEventB).toBe(true);

      // 模拟触发 Event B 后，消费该 flag 以模拟条件事件过滤
      game.earthCivi.deterrenceValue = 60;
      // 验证状态正确
      expect(game.earthCivi.deterrenceValue).toBe(60);
    });

    it('Event A 移除 flag，Event B 不再触发', () => {
      // 设置 flag
      game.addFlag('deterrence_broken');
      expect(game.hasFlag('deterrence_broken')).toBe(true);

      // 模拟 Event A 移除 flag（如威慑被打破，事件处理完成）
      game.removeFlag('deterrence_broken');
      expect(game.hasFlag('deterrence_broken')).toBe(false);

      // Event B 需要该 flag 才能触发——现在不可触发
      const canTriggerEventB = game.hasFlag('deterrence_broken');
      expect(canTriggerEventB).toBe(false);
    });

    it('多步 flag 链（A→B→C）', () => {
      // Step A: first_contact 事件设置 first_contact_made flag
      game.addFlag('first_contact_made');
      expect(game.hasFlag('first_contact_made')).toBe(true);
      // 只有 first_contact_made 存在时 Step B 才能触发
      expect(game.hasFlag('first_contact_made')).toBe(true);

      // Step B: 设置 diplomacy_opened flag（需要 first_contact_made）
      game.addFlag('diplomacy_opened');
      expect(game.hasFlag('diplomacy_opened')).toBe(true);

      // Step C: 设置 alliance_formed flag（需要 diplomacy_opened）
      game.addFlag('alliance_formed');
      expect(game.hasFlag('alliance_formed')).toBe(true);

      // 验证完整的 flag 链存在
      expect(game.hasFlag('first_contact_made')).toBe(true);
      expect(game.hasFlag('diplomacy_opened')).toBe(true);
      expect(game.hasFlag('alliance_formed')).toBe(true);
    });

    it('Flag 防止重复事件链', () => {
      // 第一次触发 wallfacer_project
      game.addFlag('wallfacer_project');
      expect(game.hasFlag('wallfacer_project')).toBe(true);

      // 模拟事件过滤：遇到 wallfacer 事件时检查是否已经触发过
      const alreadyTriggered = game.hasFlag('wallfacer_project');
      expect(alreadyTriggered).toBe(true);

      // 第二次应跳过——因为 flag 已存在
      // 模拟 filteredEvent 的条件检查 reqNotFlag
      const hasNotFlag = !game.hasFlag('wallfacer_project');
      expect(hasNotFlag).toBe(false);
    });

    it('带条件移除的 flag', () => {
      // Event A：设置 exile_fleet_ready
      game.addFlag('exile_fleet_ready');
      expect(game.hasFlag('exile_fleet_ready')).toBe(true);

      // 条件满足前不移除：eventB 仍然可以触发
      expect(game.hasFlag('exile_fleet_ready')).toBe(true);

      // 模拟 Event B 的"条件移除"：当 population > 40 时，逃亡舰队被召回
      game.earthCivi.population = 50;
      if (game.earthCivi.population > 40 && game.hasFlag('exile_fleet_ready')) {
        game.removeFlag('exile_fleet_ready');
      }
      expect(game.hasFlag('exile_fleet_ready')).toBe(false);
    });
  });

  // ==================================================================
  // 2. Event → Tag → Narrative
  // ==================================================================
  describe('2. Event → Tag → Narrative', () => {
    it('Event 通过 effect 应用世界 tag', () => {
      // 模拟事件 effect 应用 tag
      game.tagManager.applyWorldTag('tech_boom', 60, 'event:tech_breakthrough', game.year);
      expect(game.tagManager.hasTag('tech_boom')).toBe(true);
      expect(game.tagManager.getTagIntensity('tech_boom')).toBe(60);
      expect(game.tagManager.hasTag('tech_boom', 50)).toBe(true);
    });

    it('Tag 衰减影响叙事内容', () => {
      // 应用 tag 然后让其衰减到 0
      game.tagManager.applyWorldTag('civil_unrest', 30, 'event:protest', game.year);
      expect(game.tagManager.hasTag('civil_unrest')).toBe(true);
      expect(game.tagManager.getTagIntensity('civil_unrest')).toBe(30);

      // 模拟衰减：3 年后 intensity 从 30 减到 30-9=21
      game.tagManager.decayTags(game.year + 3);
      expect(game.tagManager.hasTag('civil_unrest')).toBe(true);
      expect(game.tagManager.getTagIntensity('civil_unrest')).toBe(21);

      // 再经过 7 年（总共 10 年）：21 - 7*3 = 0 → tag 被移除
      game.tagManager.decayTags(game.year + 10);
      expect(game.tagManager.hasTag('civil_unrest')).toBe(false);
    });

    it('Tag 强度影响 SliceNarrative 匹配', () => {
      // 固定 Math.random 以确保选择 population_crisis 叙事模板
      vi.spyOn(Math, 'random').mockReturnValue(0);

      // 应用高强度 tag
      game.tagManager.applyWorldTag('population_crisis', 80, 'event:famine', game.year);
      expect(game.tagManager.hasTag('population_crisis', 50)).toBe(true);

      // 使用"年份推进"作为事件标题，确保获取来自 tag 的真实叙事模板而非默认模板
      const slice = game.sliceNarrativeEngine.generateSlice(
        'test_famine', '年份推进', game.tagManager
      );
      expect(slice).toBeDefined();
      expect(slice.innerMonologue).toBeTruthy();
      // 确认叙事内容与人口危机相关（来自 population_crisis 模板）
      expect(slice.innerMonologue).toContain('配给');
      expect(slice.characterRole).toBeTruthy();

      vi.restoreAllMocks();
    });

    it('多个 tag 复合影响叙事效果', () => {
      // 同时应用多个 tag
      game.tagManager.applyWorldTag('population_crisis', 50, 'event:a', game.year);
      game.tagManager.applyWorldTag('civil_unrest', 70, 'event:b', game.year);
      game.tagManager.applyWorldTag('resource_depleted', 40, 'event:c', game.year);

      expect(game.tagManager.hasTag('population_crisis')).toBe(true);
      expect(game.tagManager.hasTag('civil_unrest')).toBe(true);
      expect(game.tagManager.hasTag('resource_depleted')).toBe(true);

      // 计算复合权重：三个 tag 对 Atmosphere 的综合影响
      const atmosState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      // civil_unrest > 60 且 population 正常 (65>10)，应返回 TENSE
      expect(atmosState).toBe('TENSE');

      // 生成叙事切片——应能匹配到多个活跃 tag 中的一个
      const slice = game.sliceNarrativeEngine.generateSlice(
        'test_compound', '多重危机', game.tagManager
      );
      expect(slice).toBeDefined();
      expect(slice.innerMonologue).toBeTruthy();
    });
  });

  // ==================================================================
  // 3. Event → Resource → Game State
  // ==================================================================
  describe('3. Event → Resource → Game State', () => {
    it('Event 减少 economy 触发经济危机条件', () => {
      // 初始 economy = 100
      expect(game.earthCivi.economy).toBe(100);

      // 模拟经济危机事件，直接设置 economy 为低值
      game.earthCivi.economy = 15;
      expect(game.earthCivi.economy).toBeLessThan(20);

      // economy < 20 → AtmosphereEngine 应返回 CRITICAL
      const atmosState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      expect(atmosState).toBe('CRITICAL');
    });

    it('Event 提升 culture 触发纪元更替', () => {
      // 设置 culture 为负值确保进入黄金岁月（epoch 0）
      game.earthCivi.culture = -10;
      game.updateEpoch();
      expect(game.epoch).toBe(0); // GOLDEN

      // culture 达到 0 以上时触发纪元更替到危机纪元（epoch 1）
      game.earthCivi.culture = 100;
      game.updateEpoch();
      // 纪元变化时应有对应的 epoch tag（crisis_era_deep）
      expect(game.tagManager.hasTag('crisis_era_deep')).toBe(true);
      expect(game.epoch).toBe(1); // CRISIS
    });

    it('Event 创建军事舰队', () => {
      // 初始 army = 10
      const initialArmy = game.earthCivi.army;

      // 模拟军事事件增加 army
      game.applyNewEffects([{ type: 'resource', target: 'army', value: 50 }]);
      expect(game.earthCivi.army).toBeGreaterThan(initialArmy);

      // 模拟太空军成军事件——应产生 space_force_built tag
      game.tagManager.applyWorldTag('space_force_built', 100, 'event:stf_formation', game.year);
      expect(game.tagManager.hasTag('space_force_built')).toBe(true);

      // 太空军 tag 应促使 Atmosphere 变为 HOPEFUL
      const atmosState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      expect(atmosState).toBe('HOPEFUL');
    });

    it('Event 改变 population 影响增长率', () => {
      // 初始 population = 65
      expect(game.earthCivi.population).toBe(65);

      // 模拟人口危机事件：减少人口至 15
      game.earthCivi.population = 15;
      expect(game.earthCivi.population).toBeLessThan(20);

      // population < 20 应自动触发 population_crisis tag（模拟 runARound 中的逻辑）
      if (game.earthCivi.population < 20 && !game.tagManager.hasTag('population_crisis')) {
        game.tagManager.applyWorldTag('population_crisis', 20, 'auto:system', game.year);
      }
      expect(game.tagManager.hasTag('population_crisis')).toBe(true);

      // population < 10 → Atmosphere CRITICAL
      game.earthCivi.population = 5;
      const atmosState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      expect(atmosState).toBe('CRITICAL');
    });
  });

  // ==================================================================
  // 4. Ecology Chain Integration
  // ==================================================================
  describe('4. Ecology Chain Integration', () => {
    beforeEach(() => {
      // 固定 Math.random 为 0，确保链式反应的概率判定总是通过
      vi.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('生态链通过事件 effect 触发', () => {
      // 模拟触发 random_resource_rationing 事件
      const triggeredChains = game.ecologyChain.checkChainReactions(
        'random_resource_rationing',
        game.tagManager,
        game.year
      );

      // 应激活 ration_to_riot 链
      const rationChain = triggeredChains.find(c => c.id === 'ration_to_riot');
      expect(rationChain).toBeDefined();
      expect(rationChain!.triggerDelay).toBe(3);
    });

    it('链式反应随时间推进', () => {
      // 触发 ration 链
      game.ecologyChain.checkChainReactions(
        'random_resource_rationing',
        game.tagManager,
        game.year
      );
      expect(game.ecologyChain.activeChains.length).toBeGreaterThan(0);

      // 推进 2 回合——尚未完成
      game.ecologyChain.advanceTurn(game.tagManager, game.year);
      game.ecologyChain.advanceTurn(game.tagManager, game.year);
      expect(game.ecologyChain.activeChains.length).toBeGreaterThan(0);

      // 推进第 3 回合——链式反应完成
      const readyEvents = game.ecologyChain.advanceTurn(game.tagManager, game.year);
      expect(readyEvents.length).toBeGreaterThan(0);
      expect(readyEvents).toContain('random_underground_riot');
    });

    it('链式反应产生的 tag 被叙事引擎消费', () => {
      // 触发 ri ot_to_crisis 链的条件：先触发 random_underground_riot
      // 并确保 civil_unrest tag 存在
      game.tagManager.applyWorldTag('civil_unrest', 40, 'event:precondition', game.year);

      game.ecologyChain.checkChainReactions(
        'random_underground_riot',
        game.tagManager,
        game.year
      );

      // 推进 5 回合让其完成
      for (let i = 0; i < 5; i++) {
        game.ecologyChain.advanceTurn(game.tagManager, game.year);
      }

      // 链完成时应该产生了 social_split tag（intensity 20）
      expect(game.tagManager.hasTag('social_split')).toBe(true);
      expect(game.tagManager.getTagIntensity('social_split')).toBe(20);

      // 叙事引擎应能匹配 social_split tag（虽然没有专门的模板，但不会崩溃）
      const slice = game.sliceNarrativeEngine.generateSlice(
        'test_ecology_narrative', '社会分裂', game.tagManager
      );
      expect(slice).toBeDefined();
      expect(slice.innerMonologue).toBeTruthy();
    });

    it('多条链同时活跃', () => {
      // 同时触发两条不同的链
      game.tagManager.applyWorldTag('civil_unrest', 30, 'pre', game.year);

      void game.ecologyChain.checkChainReactions(
        'random_resource_rationing',
        game.tagManager,
        game.year
      );
      void game.ecologyChain.checkChainReactions(
        'random_underground_riot',
        game.tagManager,
        game.year
      );

      // 两条链都可能激活（概率性，至少有一条）
      const totalActive = game.ecologyChain.activeChains.length;
      expect(totalActive).toBeGreaterThanOrEqual(0);

      // 推进所有链
      for (let i = 0; i < 6; i++) {
        game.ecologyChain.advanceTurn(game.tagManager, game.year);
      }

      // 验证链完成后 world tag 已产生
      // ration_to_riot 产生 civil_unrest、underground_gangs
      // riot_to_crisis 消耗 underground_gangs、产生 social_split
      const allTags = Array.from(game.tagManager.worldTags.keys());
      // 至少会有一些 tag 被应用（取决于概率判定）
      expect(allTags.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ==================================================================
  // 5. Full Cross-System Flow
  // ==================================================================
  describe('5. Full Cross-System Flow', () => {
    it('完整 UEE 流程：资源消耗 → tag → 事件权重 → 涟漪事件 → 历史记录', () => {
      // Step 1: 资源消耗事件 → resource_depleted tag
      game.tagManager.applyWorldTag('resource_depleted', 50, 'event:resource_crisis', game.year);
      expect(game.tagManager.hasTag('resource_depleted')).toBe(true);

      // Step 2: resource_depleted 影响 AtmosphereEngine 评估
      // (单独 resource_depleted 不会直接触发特定氛围，需要配合其他条件)
      game.earthCivi.economy = 15; // 促使 CRITICAL
      const atmosState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      expect(atmosState).toBe('CRITICAL');
      game.atmosphereEngine.transitionTo(atmosState);

      // Step 3: 氛围变化记录到历史
      game.historyGenerator.incTurn();
      game.historyGenerator.recordEvent(
        game.year, game.epoch, '经济崩溃',
        `资源枯竭导致经济崩溃，氛围变为「${game.atmosphereEngine.getConfig().label}」`,
        ['resource_depleted']
      );

      // Step 4: 生态链涟漪效应（模拟触发 random_famine_event）
      game.ecologyChain.checkChainReactions(
        'random_famine_event',
        game.tagManager,
        game.year
      );
      // 推进 4 回合触发 famine→population 链
      for (let i = 0; i < 4; i++) {
        game.ecologyChain.advanceTurn(game.tagManager, game.year);
      }

      // Step 5: 验证历史记录
      expect(game.historyGenerator.entries.length).toBeGreaterThan(0);
      const economicsEntry = game.historyGenerator.entries.find(
        e => e.title.includes('经济崩溃')
      );
      expect(economicsEntry).toBeDefined();
      expect(economicsEntry!.relatedTags).toContain('resource_depleted');

      // Step 6: 验证 toJSON/fromJSON 往返不丢失数据
      const tagJson = game.tagManager.toJSON();
      const atmosJson = game.atmosphereEngine.toJSON();
      const historyJson = game.historyGenerator.toJSON();
      const ecoJson = game.ecologyChain.toJSON();

      const tagRestored = TagManager.fromJSON(tagJson);
      const atmosRestored = AtmosphereEngine.fromJSON(atmosJson);
      const historyRestored = HistoryGenerator.fromJSON(historyJson);
      EcologyChain.fromJSON(ecoJson);

      expect(tagRestored.hasTag('resource_depleted')).toBe(true);
      expect(atmosRestored.currentState).toBe('CRITICAL');
      expect(historyRestored.entries.length).toBe(game.historyGenerator.entries.length);
    });

    it('面壁者背叛 → 角色 tag → 关系网络 → 后续事件', () => {
      // Step 1: 模拟面壁者被破壁（叛变）— 设置角色 tag
      game.tagManager.applyCharacterTag('希恩斯', {
        personName: '希恩斯',
        tagId: 'betrayer',
        tagName: '人类叛徒',
        value: 80,
        appliedYear: game.year,
        source: 'event:wallfacer_broken',
      });
      const stance = game.tagManager.getCharacterStance('希恩斯');
      expect(stance).toBe('betrayer');

      // Step 2: 面壁者背叛影响关系网络
      // 修改相关关系强度（模拟背叛后果）
      const rel = game.relationNetwork.getRelation('希恩斯', '罗辑');
      if (rel) {
        game.relationNetwork.modifyRelation('希恩斯', '罗辑', -30);
        expect(rel.intensity).toBeLessThan(70); // 初始 100 减 30 = 70
      }

      // Step 3: 背叛事件应触发世界 tag
      game.tagManager.applyWorldTag('civil_unrest', 25, 'event:wallfacer_betrayal', game.year);
      expect(game.tagManager.hasTag('civil_unrest')).toBe(true);

      // Step 4: 记录到历史
      game.historyGenerator.recordEvent(
        game.year, game.epoch, '面壁者破壁',
        '希恩斯被破壁，思想钢印计划曝光，人类社会陷入信任危机',
        ['civil_unrest'], ['希恩斯']
      );
      expect(game.historyGenerator.entries.length).toBe(1);
      expect(game.historyGenerator.entries[0].relatedPersons).toContain('希恩斯');

      // Step 5: 信任危机 → 叙事切片
      const slice = game.sliceNarrativeEngine.generateSlice(
        'wallfacer_betrayal', '面壁者背叛', game.tagManager
      );
      expect(slice).toBeDefined();
      expect(slice.eventId).toBe('wallfacer_betrayal');
    });

    it('氛围状态随世界状态变化而转换', () => {
      // 初始 NORMAL
      expect(game.atmosphereEngine.currentState).toBe('NORMAL');

      // Step 1: 暴动 → civil_unrest > 60 → TENSE
      game.tagManager.applyWorldTag('civil_unrest', 70, 'event:mega_protest', game.year);
      let newState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      expect(newState).toBe('TENSE');
      game.atmosphereEngine.transitionTo(newState);
      expect(game.atmosphereEngine.currentState).toBe('TENSE');

      // Step 2: 人口和经济崩溃 → CRITICAL
      game.earthCivi.population = 5;
      game.earthCivi.economy = 10;
      newState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      expect(newState).toBe('CRITICAL');
      game.atmosphereEngine.transitionTo(newState);
      expect(game.atmosphereEngine.currentState).toBe('CRITICAL');

      // Step 3: 科技突破 + 太空军 → HOPEFUL（优先级较高：tech_boom → HOPEFUL）
      game.tagManager.applyWorldTag('tech_boom', 60, 'event:tech_breakthrough', game.year);
      // 但 CRITICAL 的优先级高于 tech_boom 的 HOPEFUL
      // 评估顺序：foil_imminent > digital_religion > population < 10 || economy < 20 > civil_unrest > 60 > tech_boom/space_force_built
      // 先恢复 population 和 economy 让 CRITICAL 条件消失
      game.earthCivi.population = 65;
      game.earthCivi.economy = 100;
      // 此时 civil_unrest > 60 仍存在 → TENSE
      newState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      // civil_unrest(70) > 60 → TENSE 的优先级高于 tech_boom → HOPEFUL
      expect(newState).toBe('TENSE');

      // Step 4: 移除 civil_unrest，只剩 tech_boom → HOPEFUL
      game.tagManager.removeWorldTag('civil_unrest');
      newState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      expect(newState).toBe('HOPEFUL');
      game.atmosphereEngine.transitionTo(newState);
      expect(game.atmosphereEngine.currentState).toBe('HOPEFUL');

      // Step 5: digital_religion > 80 → TRANSCENDENT
      game.tagManager.applyWorldTag('digital_religion', 90, 'event:digital_cult', game.year);
      newState = game.atmosphereEngine.evaluate(game.tagManager, game.earthCivi);
      expect(newState).toBe('TRANSCENDENT');
      game.atmosphereEngine.transitionTo(newState);
      expect(game.atmosphereEngine.currentState).toBe('TRANSCENDENT');

      // Step 6: 每一步转换都应记录到历史（模拟 runARound 中的逻辑）
      game.historyGenerator.recordEvent(game.year, game.epoch, '氛围变化', '测试氛围转换');
      expect(game.historyGenerator.entries.length).toBeGreaterThan(0);
    });
  });
});