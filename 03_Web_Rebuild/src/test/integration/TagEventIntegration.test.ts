import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../../core/Game';
import { FilteredEventCondition, FilteredEventPayload } from '../../types/narrative';

/**
 * TagManager → Event 集成测试
 *
 * 覆盖 FilteredEventCondition 中 tag 相关字段：
 * - reqTag: 必须存在指定世界 tag
 * - reqNotTag: 必须不存在指定世界 tag
 * - minTagIntensity: 指定 tag 强度阈值
 *
 * 同时验证 tag 与 flag/tech/资源条件组合过滤。
 */

describe('TagManager → Event Integration', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
    // 确保 GameEventManager 已注入 game 实例
    game.eventManager.setGame(game);
  });

  const createFilteredEvent = (
    id: string,
    condition: FilteredEventCondition
  ): FilteredEventPayload => ({
    id,
    title: `测试事件: ${id}`,
    dialogQueue: [],
    choices: [],
    condition,
    tip: '测试用事件',
  });

  it('reqTag: 仅当指定世界 tag 存在时事件才符合条件', () => {
    const fev = createFilteredEvent('req_tag_event', {
      minYear: 0,
      reqTag: 'tech_boom',
    });
    game.eventManager.filteredEvents = [fev];

    // 初始无 tag，不应命中
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(0);

    // 应用 tech_boom tag 后命中
    game.tagManager.applyWorldTag('tech_boom', 50, 'test', game.year);
    const matched = game.eventManager.getFilteredEventsForTurn();
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe('req_tag_event');
  });

  it('reqNotTag: 当指定世界 tag 存在时事件被排除', () => {
    const fev = createFilteredEvent('req_not_tag_event', {
      minYear: 0,
      reqNotTag: 'civil_unrest',
    });
    game.eventManager.filteredEvents = [fev];

    // 初始无 tag，应命中
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(1);

    // 应用 civil_unrest tag 后被排除
    game.tagManager.applyWorldTag('civil_unrest', 30, 'test', game.year);
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(0);
  });

  it('minTagIntensity: tag 强度低于阈值时不命中', () => {
    const fev = createFilteredEvent('min_intensity_event', {
      minYear: 0,
      reqTag: 'tech_boom',
      minTagIntensity: 60,
    });
    game.eventManager.filteredEvents = [fev];

    // 强度 40 不足
    game.tagManager.applyWorldTag('tech_boom', 40, 'test', game.year);
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(0);

    // 追加到 70 后满足
    game.tagManager.applyWorldTag('tech_boom', 30, 'test', game.year);
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(1);
  });

  it('reqTag 与 reqFlag 组合条件需同时满足', () => {
    const fev = createFilteredEvent('tag_and_flag_event', {
      minYear: 0,
      reqTag: 'space_force_built',
      reqFlag: 'deterrence_established',
    });
    game.eventManager.filteredEvents = [fev];

    // 仅满足 tag
    game.tagManager.applyWorldTag('space_force_built', 100, 'test', game.year);
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(0);

    // 同时满足 flag
    game.addFlag('deterrence_established');
    const matched = game.eventManager.getFilteredEventsForTurn();
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe('tag_and_flag_event');
  });

  it('reqNotTag 与 reqNotFlag 组合：任一存在即排除', () => {
    const fev = createFilteredEvent('exclude_tag_or_flag_event', {
      minYear: 0,
      reqNotTag: 'resource_depleted',
      reqNotFlag: 'game_over',
    });
    game.eventManager.filteredEvents = [fev];

    // 初始状态应命中
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(1);

    // 存在排除 tag 即被排除
    game.tagManager.applyWorldTag('resource_depleted', 20, 'test', game.year);
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(0);

    // 移除 tag 后恢复
    game.tagManager.removeWorldTag('resource_depleted');
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(1);

    // 存在排除 flag 即被排除
    game.addFlag('game_over');
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(0);
  });

  it('tag 条件与 epoch/year 组合过滤', () => {
    const fev = createFilteredEvent('epoch_tag_event', {
      minYear: 10,
      epoch: 'CRISIS',
      reqTag: 'crisis_era_deep',
    });
    game.eventManager.filteredEvents = [fev];

    // 年份与 tag 满足，但纪元不对（初始为 CRISIS，先切换到 GOLDEN）
    game.year = 20;
    game.epoch = 0; // GOLDEN
    game.tagManager.applyWorldTag('crisis_era_deep', 100, 'test', game.year);
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(0);

    // 切换到危机纪元
    game.epoch = 1; // CRISIS
    const matched = game.eventManager.getFilteredEventsForTurn();
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe('epoch_tag_event');
  });

  it('多个 tag 条件同时作用于不同事件', () => {
    const eventA = createFilteredEvent('event_a', { minYear: 0, reqTag: 'tech_boom' });
    const eventB = createFilteredEvent('event_b', { minYear: 0, reqTag: 'civil_unrest' });
    const eventC = createFilteredEvent('event_c', { minYear: 0, reqNotTag: 'civil_unrest' });
    game.eventManager.filteredEvents = [eventA, eventB, eventC];

    // 只应用 tech_boom：A、C 命中
    game.tagManager.applyWorldTag('tech_boom', 50, 'test', game.year);
    let matched = game.eventManager.getFilteredEventsForTurn();
    expect(matched.map(e => e.id).sort()).toEqual(['event_a', 'event_c']);

    // 再应用 civil_unrest：A、B 命中，C 被排除
    game.tagManager.applyWorldTag('civil_unrest', 30, 'test', game.year);
    matched = game.eventManager.getFilteredEventsForTurn();
    expect(matched.map(e => e.id).sort()).toEqual(['event_a', 'event_b']);
  });

  it('tag 衰减后事件过滤条件动态变化', () => {
    const fev = createFilteredEvent('decay_tag_event', {
      minYear: 0,
      reqTag: 'civil_unrest',
    });
    game.eventManager.filteredEvents = [fev];

    game.tagManager.applyWorldTag('civil_unrest', 6, 'test', game.year);
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(1);

    // 衰减到 0 以下后 tag 被移除
    game.tagManager.decayTags(game.year + 5);
    expect(game.eventManager.getFilteredEventsForTurn()).toHaveLength(0);
  });
});
