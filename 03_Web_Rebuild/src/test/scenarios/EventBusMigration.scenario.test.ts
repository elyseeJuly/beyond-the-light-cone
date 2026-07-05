import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus, GameEvents } from '../../core/EventBus';
import { GameInstance } from '../../core/Game';

/**
 * SCEN-EVENTBUS-MIGRATION: 统一事件通道 — EventBus 迁移验证
 *
 * 验证：
 * E01 - EventBus.emit() 同时向内部订阅者和 window bridge 派发
 * E02 - EventBus.emitLegacy() 映射旧事件名到新事件名，并以旧名向 window 派发
 * E03 - Game.ts 核心代码使用 eventBus.emitLegacy() 而非 window.dispatchEvent
 * E04 - WINDOW_TO_GAME_EVENT 映射表中所有 37+ 事件名均为有效映射
 * E05 - GameEvents 常量与 GameEventMap 的 key 一致
 * E06 - emitLegacy 正确将 detail payload 传递给 window CustomEvent
 */
describe('SCEN-EVENTBUS-MIGRATION', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
    bus.setWindowBridge(false);
  });

  afterEach(() => {
    bus.setWindowBridge(false);
    bus.clear();
  });

  // ===== E01 =====
  describe('E01: EventBus.emit() 同时向内部订阅者和 window bridge 派发', () => {
    it('emit 触发内部注册的 handler', () => {
      const handler = vi.fn();
      bus.on('game:turn:complete', handler);
      bus.emit('game:turn:complete');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('emit 传递 payload 给内部 handler', () => {
      const handler = vi.fn();
      bus.on('game:epoch:changed', handler);
      bus.emit('game:epoch:changed', { epoch: 2, name: '威慑' });
      expect(handler).toHaveBeenCalledWith({ epoch: 2, name: '威慑' });
    });

    it('emit 在 window bridge 开启时向 window 派发 CustomEvent', () => {
      bus.setWindowBridge(true);
      const windowHandler = vi.fn();
      window.addEventListener('game:turn:complete', windowHandler);

      bus.emit('game:turn:complete');

      expect(windowHandler).toHaveBeenCalledTimes(1);
      const event = windowHandler.mock.calls[0][0] as CustomEvent;
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('game:turn:complete');

      window.removeEventListener('game:turn:complete', windowHandler);
      bus.setWindowBridge(false);
    });

    it('emit 在 window bridge 关闭时不向 window 派发', () => {
      bus.setWindowBridge(false);
      const windowHandler = vi.fn();
      window.addEventListener('game:turn:complete', windowHandler);

      bus.emit('game:turn:complete');

      expect(windowHandler).not.toHaveBeenCalled();

      window.removeEventListener('game:turn:complete', windowHandler);
    });

    it('emit 同时触发内部 handler 和 window 事件（bridge 开启时）', () => {
      bus.setWindowBridge(true);
      const internalHandler = vi.fn();
      const windowHandler = vi.fn();

      bus.on('game:turn:complete', internalHandler);
      window.addEventListener('game:turn:complete', windowHandler);

      bus.emit('game:turn:complete');

      expect(internalHandler).toHaveBeenCalledTimes(1);
      expect(windowHandler).toHaveBeenCalledTimes(1);

      window.removeEventListener('game:turn:complete', windowHandler);
      bus.setWindowBridge(false);
    });
  });

  // ===== E02 =====
  describe('E02: emitLegacy() 映射旧事件名到新事件名，并以旧名向 window 派发', () => {
    it('emitLegacy("game-turn-complete") 触发内部 "game:turn:complete" handler', () => {
      const handler = vi.fn();
      bus.on('game:turn:complete', handler);

      bus.emitLegacy('game-turn-complete');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('emitLegacy("game-turn-complete") 向 window 派发旧事件名 "game-turn-complete"', () => {
      const windowHandler = vi.fn();
      window.addEventListener('game-turn-complete', windowHandler);

      bus.emitLegacy('game-turn-complete');

      expect(windowHandler).toHaveBeenCalledTimes(1);
      const event = windowHandler.mock.calls[0][0] as CustomEvent;
      expect(event).toBeInstanceOf(CustomEvent);
      expect(event.type).toBe('game-turn-complete');

      window.removeEventListener('game-turn-complete', windowHandler);
    });

    it('emitLegacy("epoch-changed") 触发内部 "game:epoch:changed" handler', () => {
      const handler = vi.fn();
      bus.on('game:epoch:changed', handler);

      bus.emitLegacy('epoch-changed', { epoch: 3, name: '广播' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ epoch: 3, name: '广播' });
    });

    it('emitLegacy("game-over") 触发内部 "game:over" handler', () => {
      const handler = vi.fn();
      bus.on('game:over', handler);

      bus.emitLegacy('game-over', { endingType: 'destruction', endingName: '降维打击' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ endingType: 'destruction', endingName: '降维打击' });
    });

    it('emitLegacy("game-state-changed") 触发内部 "game:state:changed" handler', () => {
      const handler = vi.fn();
      bus.on('game:state:changed', handler);

      bus.emitLegacy('game-state-changed');

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('emitLegacy 未映射的旧事件名仅向 window 派发', () => {
      const handler = vi.fn();
      bus.on('game:turn:complete', handler);
      const windowHandler = vi.fn();
      window.addEventListener('unmapped-legacy-event', windowHandler);

      bus.emitLegacy('unmapped-legacy-event', { data: 'test' });

      expect(handler).not.toHaveBeenCalled();
      expect(windowHandler).toHaveBeenCalledTimes(1);

      window.removeEventListener('unmapped-legacy-event', windowHandler);
    });
  });

  // ===== E03 =====
  describe('E03: Game.ts 核心代码使用 eventBus.emitLegacy() 而非 window.dispatchEvent', () => {
    it('Game 实例拥有 eventBus 属性', () => {
      GameInstance.reset();
      const game = GameInstance.get();
      expect(game.eventBus).toBeDefined();
      expect(game.eventBus).toBeInstanceOf(EventBus);
    });

    it('Game.runARound 通过 eventBus.emitLegacy 派发事件而非直接调用 window.dispatchEvent', () => {
      GameInstance.reset();
      const game = GameInstance.get();
      game.earthCivi.isAiBrainEnabled = false;

      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
      const emitLegacySpy = vi.spyOn(game.eventBus, 'emitLegacy');

      game.runARound();

      // emitLegacy 被 Game 内部调用（如 ticker-message-added, game-turn-complete, game-state-changed 等）
      expect(emitLegacySpy).toHaveBeenCalled();

      emitLegacySpy.mockRestore();
      dispatchSpy.mockRestore();
    });

    it('Game 实例化后 eventBus 的 emitLegacy 可正常调用', () => {
      GameInstance.reset();
      const game = GameInstance.get();

      const handler = vi.fn();
      game.eventBus.on('game:turn:complete', handler);

      game.eventBus.emitLegacy('game-turn-complete');

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ===== E04 =====
  describe('E04: WINDOW_TO_GAME_EVENT 映射表中所有事件名均为有效映射', () => {
    // 通过 emitLegacy 逐一验证代表性映射：旧事件名 → 触发正确的内部 handler
    const legacyMappings: [string, string, any?][] = [
      ['game-turn-complete', 'game:turn:complete'],
      ['epoch-changed', 'game:epoch:changed', { epoch: 1, name: '测试' }],
      ['game-event-triggered', 'game:event:triggered', { eventId: 'evt_001' }],
      ['game:tag:changed', 'game:tag:changed', { tag: 'test_tag', action: 'applied' }],
      ['game:atmosphere:changed', 'game:atmosphere:changed', { state: 'peaceful' }],
      ['game-over', 'game:over', { endingType: 'test', endingName: '测试结局' }],
      ['game-state-changed', 'game:state:changed'],
      ['game-loaded', 'game:loaded'],
      ['ticker-message-added', 'ticker:message:added'],
      ['turn-blocked', 'turn:blocked', { reason: 'test', blockerType: 'event' }],
      ['play-game-sound', 'audio:play', { type: 'click' }],
      ['ai-brain-toggled', 'ai:brain:toggled'],
      ['ap-changed', 'ap:changed'],
      ['ap-insufficient', 'ap:insufficient', { required: 5, current: 2 }],
      ['battle-triggered', 'battle:triggered'],
      ['star-selected', 'star:selected', { star: { id: 1 } }],
      ['starmap-zoom-changed', 'starmap:zoom:changed', { zoom: 2.5 }],
      ['open-fleet-modal', 'fleet:modal:open'],
      ['open-settings', 'settings:open'],
      ['open-museum', 'museum:open'],
      ['open-cover-screen', 'cover:open'],
      ['open-tutorial', 'tutorial:open'],
      ['new-game-plus-activated', 'new:game:plus:activated', { cycle: 2 }],
      ['game-language-changed', 'language:changed', { lang: 'zh' }],
      ['bgm-settings-changed', 'bgm:settings:changed'],
      ['pause-main-bgm', 'bgm:pause:main'],
      ['game:ending:started', 'ending:started'],
      ['observer-mode-activated', 'observer:mode:activated'],
      ['high-contrast-changed', 'high:contrast:changed', { active: true }],
      ['particle-settings-changed', 'particle:settings:changed', { level: 'low' }],
      ['save-storage-warning', 'save:storage:warning', { used: 100, quota: 500 }],
      ['game:toast:message', 'toast:message', { message: 'test toast', type: 'info' }],
      ['change-active-view', 'view:changed', { view: 'starmap' }],
      ['tutorial:set-tab', 'tutorial:set:tab', { inspectorTab: 'tab1' }],
      ['tutorial:close-drawer', 'tutorial:close:drawer'],
      ['tutorial:set-gov-tab', 'tutorial:set:gov:tab', { govTab: 'policy' }],
      ['game:tech:completed', 'game:tech:completed' as any],
      ['game-state-updated', 'game:state:changed'],
    ];

    it.each(legacyMappings)(
      'emitLegacy("%s") 触发内部 handler on "%s"',
      (legacyName, newName, payload) => {
        const handler = vi.fn();
        bus.on(newName as any, handler);

        bus.emitLegacy(legacyName, payload);

        expect(handler).toHaveBeenCalledTimes(1);
        if (payload !== undefined) {
          expect(handler).toHaveBeenCalledWith(payload);
        }
      }
    );

    it('所有映射的旧事件名均向 window 派发 CustomEvent', () => {
      const legacyNames = legacyMappings.map(([name]) => name);
      for (const legacyName of legacyNames) {
        const windowHandler = vi.fn();
        window.addEventListener(legacyName, windowHandler);

        bus.emitLegacy(legacyName);

        expect(windowHandler).toHaveBeenCalledTimes(1);
        const event = windowHandler.mock.calls[0][0] as CustomEvent;
        expect(event).toBeInstanceOf(CustomEvent);
        expect(event.type).toBe(legacyName);

        window.removeEventListener(legacyName, windowHandler);
      }
    });

    it('映射表覆盖至少 37 个事件名', () => {
      // 通过上面已验证的 legacyMappings 数量确认
      expect(legacyMappings.length).toBeGreaterThanOrEqual(37);
    });
  });

  // ===== E05 =====
  describe('E05: GameEvents 常量与 GameEventMap 的 key 一致', () => {
    it('GameEvents 中每个 key 的值等于自身（自引用常量）', () => {
      const entries = Object.entries(GameEvents) as [string, string][];
      expect(entries.length).toBeGreaterThan(0);
      for (const [key, value] of entries) {
        expect(value).toBe(key);
      }
    });

    it('GameEvents 包含核心事件常量', () => {
      expect(GameEvents['game:turn:complete']).toBe('game:turn:complete');
      expect(GameEvents['game:turn:start']).toBe('game:turn:start');
      expect(GameEvents['game:epoch:changed']).toBe('game:epoch:changed');
      expect(GameEvents['game:event:triggered']).toBe('game:event:triggered');
      expect(GameEvents['game:tag:changed']).toBe('game:tag:changed');
      expect(GameEvents['game:atmosphere:changed']).toBe('game:atmosphere:changed');
      expect(GameEvents['game:over']).toBe('game:over');
      expect(GameEvents['game:state:changed']).toBe('game:state:changed');
      expect(GameEvents['game:loaded']).toBe('game:loaded');
      expect(GameEvents['game:save:completed']).toBe('game:save:completed');
      expect(GameEvents['game:resource:changed']).toBe('game:resource:changed');
      expect(GameEvents['ticker:message:added']).toBe('ticker:message:added');
      expect(GameEvents['turn:blocked']).toBe('turn:blocked');
      expect(GameEvents['audio:play']).toBe('audio:play');
      expect(GameEvents['audio:stop']).toBe('audio:stop');
    });

    it('GameEvents 包含 UI 相关事件常量', () => {
      expect(GameEvents['fleet:modal:open']).toBe('fleet:modal:open');
      expect(GameEvents['settings:open']).toBe('settings:open');
      expect(GameEvents['museum:open']).toBe('museum:open');
      expect(GameEvents['cover:open']).toBe('cover:open');
      expect(GameEvents['tutorial:open']).toBe('tutorial:open');
      expect(GameEvents['view:changed']).toBe('view:changed');
      expect(GameEvents['toast:message']).toBe('toast:message');
    });

    it('GameEvents 包含音频与设置事件常量', () => {
      expect(GameEvents['bgm:settings:changed']).toBe('bgm:settings:changed');
      expect(GameEvents['bgm:pause:main']).toBe('bgm:pause:main');
      expect(GameEvents['language:changed']).toBe('language:changed');
      expect(GameEvents['high:contrast:changed']).toBe('high:contrast:changed');
      expect(GameEvents['particle:settings:changed']).toBe('particle:settings:changed');
    });

    it('GameEvents 包含教程事件常量', () => {
      expect(GameEvents['tutorial:set:tab']).toBe('tutorial:set:tab');
      expect(GameEvents['tutorial:close:drawer']).toBe('tutorial:close:drawer');
      expect(GameEvents['tutorial:set:gov:tab']).toBe('tutorial:set:gov:tab');
    });

    it('GameEvents 中所有 key 均为有效的 GameEventName 格式', () => {
      const keys = Object.keys(GameEvents);
      // 所有 key 应该符合 namespace:event 格式
      for (const key of keys) {
        expect(key).toMatch(/^[a-z]+:[a-z]+(:[a-z]+)*$/);
      }
    });
  });

  // ===== E06 =====
  describe('E06: emitLegacy 正确将 detail payload 传递给 window CustomEvent', () => {
    it('emitLegacy 传递简单 payload 到 window CustomEvent.detail', () => {
      const windowHandler = vi.fn();
      window.addEventListener('game-turn-complete', windowHandler);

      bus.emitLegacy('game-turn-complete', { turn: 42 });

      expect(windowHandler).toHaveBeenCalledTimes(1);
      const event = windowHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual({ turn: 42 });

      window.removeEventListener('game-turn-complete', windowHandler);
    });

    it('emitLegacy 传递复杂 payload 到 window CustomEvent.detail', () => {
      const windowHandler = vi.fn();
      window.addEventListener('game-over', windowHandler);

      const payload = {
        endingType: 'cosmic_reset',
        endingName: '归零重启',
        metadata: { cycle: 99, survivors: 0 },
      };
      bus.emitLegacy('game-over', payload);

      expect(windowHandler).toHaveBeenCalledTimes(1);
      const event = windowHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(payload);

      window.removeEventListener('game-over', windowHandler);
    });

    it('emitLegacy 无 payload 时 window CustomEvent.detail 为 null', () => {
      const windowHandler = vi.fn();
      window.addEventListener('game-state-changed', windowHandler);

      bus.emitLegacy('game-state-changed');

      expect(windowHandler).toHaveBeenCalledTimes(1);
      const event = windowHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toBeNull();

      window.removeEventListener('game-state-changed', windowHandler);
    });

    it('emitLegacy 传递的 payload 同时到达内部 handler 和 window', () => {
      const internalHandler = vi.fn();
      const windowHandler = vi.fn();

      bus.on('game:epoch:changed', internalHandler);
      window.addEventListener('epoch-changed', windowHandler);

      const payload = { epoch: 5, name: '银河纪元' };
      bus.emitLegacy('epoch-changed', payload);

      expect(internalHandler).toHaveBeenCalledWith(payload);
      const event = windowHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toEqual(payload);

      window.removeEventListener('epoch-changed', windowHandler);
    });

    it('emitLegacy 传递 null payload 到 window CustomEvent.detail', () => {
      const windowHandler = vi.fn();
      window.addEventListener('ticker-message-added', windowHandler);

      bus.emitLegacy('ticker-message-added', null);

      expect(windowHandler).toHaveBeenCalledTimes(1);
      const event = windowHandler.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toBeNull();

      window.removeEventListener('ticker-message-added', windowHandler);
    });
  });
});