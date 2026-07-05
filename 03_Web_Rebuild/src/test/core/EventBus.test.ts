import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus, GameEvents } from '../../core/EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
    bus.setWindowBridge(false); // 测试中关闭 window 桥接，避免干扰
  });

  it('初始状态无监听器', () => {
    expect(bus.listenerCount('game:turn:complete')).toBe(0);
  });

  it('on 注册监听器后 listenerCount 增加', () => {
    const handler = () => {};
    bus.on('game:turn:complete', handler);
    expect(bus.listenerCount('game:turn:complete')).toBe(1);
  });

  it('emit 触发注册的监听器并传递 payload', () => {
    const handler = vi.fn();
    bus.on('game:turn:complete', handler);
    bus.emit('game:turn:complete');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('emit 传递 payload 对象', () => {
    const handler = vi.fn();
    bus.on('game:epoch:changed', handler);
    bus.emit('game:epoch:changed', { epoch: 2, name: '威慑' });
    expect(handler).toHaveBeenCalledWith({ epoch: 2, name: '威慑' });
  });

  it('多个监听器按注册顺序触发', () => {
    const order: number[] = [];
    bus.on('game:turn:complete', () => order.push(1));
    bus.on('game:turn:complete', () => order.push(2));
    bus.emit('game:turn:complete');
    expect(order).toEqual([1, 2]);
  });

  it('off 取消监听后不再触发', () => {
    const handler = vi.fn();
    bus.on('game:turn:complete', handler);
    bus.off('game:turn:complete', handler);
    bus.emit('game:turn:complete');
    expect(handler).not.toHaveBeenCalled();
  });

  it('off 未注册的监听器不抛异常', () => {
    const handler = vi.fn();
    expect(() => bus.off('game:turn:complete', handler)).not.toThrow();
  });

  it('emit 不存在的监听器不抛异常', () => {
    expect(() => bus.emit('game:turn:complete')).not.toThrow();
  });

  it('clear 清空所有监听器', () => {
    bus.on('game:turn:complete', () => {});
    bus.on('game:epoch:changed', () => {});
    bus.clear();
    expect(bus.listenerCount('game:turn:complete')).toBe(0);
    expect(bus.listenerCount('game:epoch:changed')).toBe(0);
  });

  it('emit 同时向 window 派发事件（桥接开启时）', () => {
    bus.setWindowBridge(true);
    const windowHandler = vi.fn();
    const busHandler = vi.fn();
    window.addEventListener('game:turn:complete', windowHandler);
    bus.on('game:turn:complete', busHandler);

    bus.emit('game:turn:complete');

    expect(windowHandler).toHaveBeenCalledTimes(1);
    expect(busHandler).toHaveBeenCalledTimes(1);
    bus.setWindowBridge(false);
  });

  it('emitLegacy 用旧事件名向 window 派发，用新事件名触发内部订阅', () => {
    bus.setWindowBridge(true);
    const windowHandler = vi.fn();
    const busHandler = vi.fn();
    window.addEventListener('game-turn-complete', windowHandler);
    bus.on('game:turn:complete', busHandler);

    bus.emitLegacy('game-turn-complete');

    expect(windowHandler).toHaveBeenCalledTimes(1);
    expect(busHandler).toHaveBeenCalledTimes(1);
    bus.setWindowBridge(false);
  });

  it('emitLegacy 未映射的事件直接走 window 派发', () => {
    bus.setWindowBridge(true);
    const windowHandler = vi.fn();
    window.addEventListener('unmapped-event', windowHandler);

    bus.emitLegacy('unmapped-event', { data: 'test' });

    expect(windowHandler).toHaveBeenCalledTimes(1);
    bus.setWindowBridge(false);
  });

  it('监听器异常不传播', () => {
    const throwingHandler = vi.fn(() => { throw new Error('handler error'); });
    const normalHandler = vi.fn();
    bus.on('game:turn:complete', throwingHandler);
    bus.on('game:turn:complete', normalHandler);

    expect(() => bus.emit('game:turn:complete')).not.toThrow();
    expect(normalHandler).toHaveBeenCalledTimes(1);
  });

  it('toJSON 返回正确的监听器数量信息', () => {
    bus.on('game:turn:complete', () => {});
    bus.on('game:epoch:changed', () => {});
    bus.on('game:epoch:changed', () => {});
    const json = bus.toJSON() as { listenerCounts: [string, number][] };
    expect(json.listenerCounts).toContainEqual(['game:turn:complete', 1]);
    expect(json.listenerCounts).toContainEqual(['game:epoch:changed', 2]);
  });

  it('GameEvents 常量定义完整（新格式）', () => {
    expect(GameEvents['game:turn:start']).toBe('game:turn:start');
    expect(GameEvents['game:turn:complete']).toBe('game:turn:complete');
    expect(GameEvents['game:epoch:changed']).toBe('game:epoch:changed');
    expect(GameEvents['game:event:triggered']).toBe('game:event:triggered');
    expect(GameEvents['game:over']).toBe('game:over');
    expect(GameEvents['game:state:changed']).toBe('game:state:changed');
    expect(GameEvents['game:loaded']).toBe('game:loaded');
    expect(GameEvents['ticker:message:added']).toBe('ticker:message:added');
    expect(GameEvents['turn:blocked']).toBe('turn:blocked');
    expect(GameEvents['audio:play']).toBe('audio:play');
  });
});