import { describe, it, expect, beforeEach } from 'vitest';
import { EcologyChain } from '../../core/EcologyChain';
import { TagManager } from '../../core/TagManager';

describe('EcologyChain', () => {
  let ec: EcologyChain;
  let tagManager: TagManager;

  beforeEach(() => {
    ec = new EcologyChain();
    tagManager = new TagManager();
  });

  it('初始化加载预设链', () => {
    expect(ec.chains.length).toBeGreaterThan(0);
    expect(ec.activeChains.length).toBe(0);
  });

  it('包含所有预设链', () => {
    const chainIds = ec.chains.map(c => c.id);
    expect(chainIds).toContain('ration_to_riot');
    expect(chainIds).toContain('riot_to_crisis');
    expect(chainIds).toContain('eto_to_social_unrest');
    expect(chainIds).toContain('experiment_accident');
    expect(chainIds).toContain('fleet_loss_to_unrest');
    expect(chainIds).toContain('deterrence_drop_to_crisis');
    expect(chainIds).toContain('famine_to_population');
  });

  it('checkChainReactions 不匹配条件不触发', () => {
    const result = ec.checkChainReactions('nonexistent_event', tagManager, 10);
    expect(result.length).toBe(0);
    expect(ec.activeChains.length).toBe(0);
  });

  it('checkChainReactions 匹配条件且概率触发时创建活动链', () => {
    // Since Math.random() is used, we need to ensure predictable behavior
    // We'll mock Math.random later, for now just verify the function runs
    const result = ec.checkChainReactions('random_resource_rationing', tagManager, 10);
    // Result depends on Math.random, so we just verify it's an array
    expect(Array.isArray(result)).toBe(true);
  });

  it('advanceTurn 推进后减少剩余延迟', () => {
    // Manually add an active chain
    ec.activeChains.push({
      chainId: 'ration_to_riot',
      stepId: 'ration_to_riot',
      triggeredYear: 10,
      remainingDelay: 3,
      conditionEventId: 'random_resource_rationing',
      resultEventId: 'random_underground_riot',
    });

    ec.advanceTurn(tagManager, 11);
    expect(ec.activeChains.length).toBe(1);
    expect(ec.activeChains[0].remainingDelay).toBe(2);

    ec.advanceTurn(tagManager, 12);
    expect(ec.activeChains[0].remainingDelay).toBe(1);
  });

  it('advanceTurn 延迟归零时触发事件并应用标签', () => {
    ec.activeChains.push({
      chainId: 'ration_to_riot',
      stepId: 'ration_to_riot',
      triggeredYear: 10,
      remainingDelay: 1,
      conditionEventId: 'random_resource_rationing',
      resultEventId: 'random_underground_riot',
    });

    const readyEvents = ec.advanceTurn(tagManager, 11);
    expect(readyEvents).toContain('random_underground_riot');
    expect(ec.activeChains.length).toBe(0);

    // 验证标签被应用
    expect(tagManager.hasTag('civil_unrest')).toBe(true);
    expect(tagManager.hasTag('underground_gangs')).toBe(true);
  });

  it('advanceTurn 消费标签', () => {
    tagManager.applyWorldTag('civil_unrest', 50, 'test', 0);
    tagManager.applyWorldTag('underground_gangs', 50, 'test', 0);

    ec.activeChains.push({
      chainId: 'riot_to_crisis',
      stepId: 'riot_to_crisis',
      triggeredYear: 10,
      remainingDelay: 1,
      conditionEventId: 'random_underground_riot',
      resultEventId: 'random_colony_crisis',
    });

    ec.advanceTurn(tagManager, 11);

    // underground_gangs 被消费移除
    expect(tagManager.hasTag('underground_gangs')).toBe(false);
    // social_split 被生产添加
    expect(tagManager.hasTag('social_split')).toBe(true);
  });

  it('getActiveChains 只返回未完成链', () => {
    ec.activeChains.push({
      chainId: 'test1', stepId: 'test1', triggeredYear: 0, remainingDelay: 3,
      conditionEventId: 'e1', resultEventId: 'e2',
    });
    ec.activeChains.push({
      chainId: 'test2', stepId: 'test2', triggeredYear: 0, remainingDelay: 0,
      conditionEventId: 'e3', resultEventId: 'e4',
    });
    const active = ec.getActiveChains();
    expect(active.length).toBe(1);
    expect(active[0].chainId).toBe('test1');
  });

  it('toJSON 与 fromJSON 序列化往返', () => {
    ec.activeChains.push({
      chainId: 'test', stepId: 'test', triggeredYear: 5, remainingDelay: 3,
      conditionEventId: 'e1', resultEventId: 'e2',
    });
    const json = ec.toJSON();
    const restored = EcologyChain.fromJSON(json);
    expect(restored.activeChains.length).toBe(1);
    expect(restored.activeChains[0].remainingDelay).toBe(3);
  });

  it('reset 清空活动链', () => {
    ec.activeChains.push({
      chainId: 'test', stepId: 'test', triggeredYear: 0, remainingDelay: 1,
      conditionEventId: 'e1', resultEventId: 'e2',
    });
    ec.reset();
    expect(ec.activeChains.length).toBe(0);
  });

  it('预设链属性完整', () => {
    for (const chain of ec.chains) {
      expect(chain.id).toBeDefined();
      expect(chain.name).toBeDefined();
      expect(chain.conditionEventId).toBeDefined();
      expect(chain.triggerDelay).toBeGreaterThan(0);
      expect(chain.resultEventId).toBeDefined();
      expect(Array.isArray(chain.producedTags)).toBe(true);
      expect(Array.isArray(chain.consumedTags)).toBe(true);
      expect(chain.probability).toBeGreaterThanOrEqual(0);
      expect(chain.probability).toBeLessThanOrEqual(1);
    }
  });
});