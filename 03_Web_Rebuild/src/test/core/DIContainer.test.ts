import { describe, it, expect, beforeEach } from 'vitest';
import { DIContainer, AppContainer, ServiceKeys } from '../../core/DIContainer';

describe('DIContainer', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  it('register 注册实例后 resolve 可以获取', () => {
    container.register('test', { value: 42 });
    expect(container.resolve<{ value: number }>('test').value).toBe(42);
  });

  it('resolve 未注册的服务抛出错误', () => {
    expect(() => container.resolve('nonexistent')).toThrow('not registered');
  });

  it('registerFactory 懒加载工厂', () => {
    let createCount = 0;
    container.registerFactory('lazy', () => {
      createCount++;
      return { id: createCount };
    });

    const instance1 = container.resolve<{ id: number }>('lazy');
    const instance2 = container.resolve<{ id: number }>('lazy');
    expect(instance1.id).toBe(1);
    expect(instance2.id).toBe(1); // singleton 模式，同一实例
    expect(createCount).toBe(1);
  });

  it('registerFactory 非 singleton 模式每次创建新实例', () => {
    container.registerFactory('nonSingleton', () => ({ rand: Math.random() }), false);
    const a = container.resolve<{ rand: number }>('nonSingleton');
    const b = container.resolve<{ rand: number }>('nonSingleton');
    expect(a).not.toBe(b); // 不同实例
  });

  it('has 正确检测注册状态', () => {
    expect(container.has('test')).toBe(false);
    container.register('test', 123);
    expect(container.has('test')).toBe(true);
  });

  it('remove 移除服务后 has 返回 false', () => {
    container.register('test', 123);
    container.remove('test');
    expect(container.has('test')).toBe(false);
  });

  it('clear 清空所有服务', () => {
    container.register('a', 1);
    container.registerFactory('b', () => 2);
    container.clear();
    expect(container.has('a')).toBe(false);
    expect(container.has('b')).toBe(false);
    expect(container.getRegisteredKeys()).toEqual([]);
  });

  it('getRegisteredKeys 返回所有注册键', () => {
    container.register('a', 1);
    container.registerFactory('b', () => 2);
    const keys = container.getRegisteredKeys();
    expect(keys).toContain('a');
    expect(keys).toContain('b');
    expect(keys.length).toBe(2);
  });

  it('重复 register 覆盖旧实例', () => {
    container.register('key', 'old');
    container.register('key', 'new');
    expect(container.resolve<string>('key')).toBe('new');
  });

  it('AppContainer 是全局单例', () => {
    expect(AppContainer).toBeDefined();
    expect(AppContainer).toBeInstanceOf(DIContainer);
  });

  it('ServiceKeys 包含所有标准服务键', () => {
    expect(ServiceKeys.GAME).toBe('game');
    expect(ServiceKeys.EVENT_MANAGER).toBe('eventManager');
    expect(ServiceKeys.EVENT_BUS).toBe('eventBus');
    expect(ServiceKeys.TAG_MANAGER).toBe('tagManager');
    expect(ServiceKeys.ATMOSPHERE_ENGINE).toBe('atmosphereEngine');
    expect(ServiceKeys.HISTORY_GENERATOR).toBe('historyGenerator');
    expect(ServiceKeys.SAVE_MANAGER).toBe('saveManager');
    expect(ServiceKeys.COMBAT_ENGINE).toBe('combatEngine');
    expect(ServiceKeys.ECOLOGY_CHAIN).toBe('ecologyChain');
    expect(ServiceKeys.RELATION_NETWORK).toBe('relationNetwork');
  });
});