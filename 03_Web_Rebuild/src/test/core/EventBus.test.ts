import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus, GameEvents } from '../../core/EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('初始状态无监听器', () => {
    expect(bus.listenerCount('any_event')).toBe(0);
  });

  it('on 注册监听器后 listenerCount 增加', () => {
    const handler = () => {};
    bus.on('test:event', handler);
    expect(bus.listenerCount('test:event')).toBe(1);
  });

  it('emit 触发注册的监听器', () => {
    const handler = vi.fn();
    bus.on('test:event', handler);
    bus.emit('test:event', 'arg1', 42);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith('arg1', 42);
  });

  it('多个监听器按注册顺序触发', () => {
    const order: number[] = [];
    bus.on('test:event', () => order.push(1));
    bus.on('test:event', () => order.push(2));
    bus.emit('test:event');
    expect(order).toEqual([1, 2]);
  });

  it('off 取消监听后不再触发', () => {
    const handler = vi.fn();
    bus.on('test:event', handler);
    bus.off('test:event', handler);
    bus.emit('test:event');
    expect(handler).not.toHaveBeenCalled();
  });

  it('off 未注册的监听器不抛异常', () => {
    const handler = vi.fn();
    expect(() => bus.off('nonexistent', handler)).not.toThrow();
  });

  it('emit 不存在的监听器不抛异常', () => {
    expect(() => bus.emit('nonexistent')).not.toThrow();
  });

  it('clear 清空所有监听器', () => {
    bus.on('event1', () => {});
    bus.on('event2', () => {});
    bus.clear();
    expect(bus.listenerCount('event1')).toBe(0);
    expect(bus.listenerCount('event2')).toBe(0);
  });

  it('emitToWindow 同时触发 window 事件和内部监听', () => {
    const windowHandler = vi.fn();
    const busHandler = vi.fn();
    window.addEventListener('game:custom', windowHandler);
    bus.on('game:custom', busHandler);

    bus.emitToWindow('game:custom', { key: 'value' });

    expect(windowHandler).toHaveBeenCalledTimes(1);
    expect(busHandler).toHaveBeenCalledTimes(1);
    expect(busHandler).toHaveBeenCalledWith({ key: 'value' });
  });

  it('监听器异常不传播', () => {
    const throwingHandler = vi.fn(() => { throw new Error('handler error'); });
    const normalHandler = vi.fn();
    bus.on('test:event', throwingHandler);
    bus.on('test:event', normalHandler);

    expect(() => bus.emit('test:event')).not.toThrow();
    expect(normalHandler).toHaveBeenCalledTimes(1);
  });

  it('toJSON 返回正确的监听器数量信息', () => {
    bus.on('event:a', () => {});
    bus.on('event:b', () => {});
    bus.on('event:b', () => {});
    const json = bus.toJSON() as { listenerCounts: [string, number][] };
    expect(json.listenerCounts).toContainEqual(['event:a', 1]);
    expect(json.listenerCounts).toContainEqual(['event:b', 2]);
  });

  it('GameEvents 常量定义完整', () => {
    expect(GameEvents.TURN_START).toBe('game:turn:start');
    expect(GameEvents.TURN_COMPLETE).toBe('game:turn:complete');
    expect(GameEvents.EPOCH_CHANGED).toBe('game:epoch:changed');
    expect(GameEvents.EVENT_TRIGGERED).toBe('game:event:triggered');
    expect(GameEvents.GAME_OVER).toBe('game:over');
    expect(GameEvents.BATTLE_START).toBe('game:battle:start');
    expect(GameEvents.BATTLE_END).toBe('game:battle:end');
    expect(GameEvents.TECH_COMPLETED).toBe('game:tech:completed');
    expect(GameEvents.SAVE_COMPLETED).toBe('game:save:completed');
    expect(GameEvents.LOAD_COMPLETED).toBe('game:load:completed');
    expect(GameEvents.RESOURCE_CHANGED).toBe('game:resource:changed');
    expect(GameEvents.FLEET_MOVED).toBe('game:fleet:moved');
  });
});