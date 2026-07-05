/**
 * EventBus — 游戏核心事件总线（唯一权威通道）
 *
 * 所有游戏事件统一通过此总线收发，不再裸用 window.dispatchEvent。
 * emit() 同时向 bus 内部订阅者和 window 派发，确保 React 组件兼容。
 *
 * 使用方式：
 *   game.eventBus.emit(GameEvents.TURN_COMPLETE);
 *   game.eventBus.on(GameEvents.TURN_COMPLETE, () => { ... });
 */

export type EventHandler<T = any> = (payload: T) => void;

// ===== 类型化事件映射 =====
export interface GameEventMap {
  'game:turn:complete': void;
  'game:turn:start': void;
  'game:epoch:changed': { epoch: number; name: string };
  'game:event:triggered': { eventId: string };
  'game:tag:changed': { tag: string; action: 'applied' | 'removed' };
  'game:atmosphere:changed': { state: string };
  'game:over': { endingType: string; endingName: string };
  'game:state:changed': void;
  'game:loaded': void;
  'game:save:completed': void;
  'game:resource:changed': void;
  'ticker:message:added': void;
  'turn:blocked': { reason: string; blockerType: string };
  'audio:play': { type: string };
  'audio:stop': void;
  'ai:brain:toggled': void;
  'ap:changed': void;
  'ap:insufficient': { required: number; current: number };
  'battle:triggered': void;
  'star:selected': { star: any };
  'starmap:zoom:changed': { zoom: number };
  'fleet:modal:open': void;
  'settings:open': void;
  'museum:open': void;
  'cover:open': void;
  'tutorial:open': void;
  'new:game:plus:activated': { cycle: number };
  'language:changed': { lang: string };
  'bgm:settings:changed': void;
  'bgm:pause:main': void;
  'ending:started': void;
  'observer:mode:activated': void;
  'high:contrast:changed': { active: boolean };
  'particle:settings:changed': { level: string };
  'save:storage:warning': { used: number; quota: number };
  'toast:message': { message: string; type?: string };
  'view:changed': { view: string };
  'tutorial:set:tab': { inspectorTab?: string };
  'tutorial:close:drawer': void;
  'tutorial:set:gov:tab': { govTab?: string };
}

export type GameEventName = keyof GameEventMap;

// ===== 标准化事件名称常量 =====
export const GameEvents: { [K in GameEventName]: K } = {
  'game:turn:complete': 'game:turn:complete',
  'game:turn:start': 'game:turn:start',
  'game:epoch:changed': 'game:epoch:changed',
  'game:event:triggered': 'game:event:triggered',
  'game:tag:changed': 'game:tag:changed',
  'game:atmosphere:changed': 'game:atmosphere:changed',
  'game:over': 'game:over',
  'game:state:changed': 'game:state:changed',
  'game:loaded': 'game:loaded',
  'game:save:completed': 'game:save:completed',
  'game:resource:changed': 'game:resource:changed',
  'ticker:message:added': 'ticker:message:added',
  'turn:blocked': 'turn:blocked',
  'audio:play': 'audio:play',
  'audio:stop': 'audio:stop',
  'ai:brain:toggled': 'ai:brain:toggled',
  'ap:changed': 'ap:changed',
  'ap:insufficient': 'ap:insufficient',
  'battle:triggered': 'battle:triggered',
  'star:selected': 'star:selected',
  'starmap:zoom:changed': 'starmap:zoom:changed',
  'fleet:modal:open': 'fleet:modal:open',
  'settings:open': 'settings:open',
  'museum:open': 'museum:open',
  'cover:open': 'cover:open',
  'tutorial:open': 'tutorial:open',
  'new:game:plus:activated': 'new:game:plus:activated',
  'language:changed': 'language:changed',
  'bgm:settings:changed': 'bgm:settings:changed',
  'bgm:pause:main': 'bgm:pause:main',
  'ending:started': 'ending:started',
  'observer:mode:activated': 'observer:mode:activated',
  'high:contrast:changed': 'high:contrast:changed',
  'particle:settings:changed': 'particle:settings:changed',
  'save:storage:warning': 'save:storage:warning',
  'toast:message': 'toast:message',
  'view:changed': 'view:changed',
  'tutorial:set:tab': 'tutorial:set:tab',
  'tutorial:close:drawer': 'tutorial:close:drawer',
  'tutorial:set:gov:tab': 'tutorial:set:gov:tab',
};

// ===== window 事件名 → 类型化事件名 映射表（向后兼容） =====
const WINDOW_TO_GAME_EVENT: Record<string, GameEventName> = {
  'game-turn-complete': 'game:turn:complete',
  'epoch-changed': 'game:epoch:changed',
  'game-event-triggered': 'game:event:triggered',
  'game:tag:changed': 'game:tag:changed',
  'game:atmosphere:changed': 'game:atmosphere:changed',
  'game-over': 'game:over',
  'game-state-changed': 'game:state:changed',
  'game-loaded': 'game:loaded',
  'ticker-message-added': 'ticker:message:added',
  'turn-blocked': 'turn:blocked',
  'play-game-sound': 'audio:play',
  'ai-brain-toggled': 'ai:brain:toggled',
  'ap-changed': 'ap:changed',
  'ap-insufficient': 'ap:insufficient',
  'battle-triggered': 'battle:triggered',
  'star-selected': 'star:selected',
  'starmap-zoom-changed': 'starmap:zoom:changed',
  'open-fleet-modal': 'fleet:modal:open',
  'open-settings': 'settings:open',
  'open-museum': 'museum:open',
  'open-cover-screen': 'cover:open',
  'open-tutorial': 'tutorial:open',
  'new-game-plus-activated': 'new:game:plus:activated',
  'game-language-changed': 'language:changed',
  'bgm-settings-changed': 'bgm:settings:changed',
  'pause-main-bgm': 'bgm:pause:main',
  'game:ending:started': 'ending:started',
  'observer-mode-activated': 'observer:mode:activated',
  'high-contrast-changed': 'high:contrast:changed',
  'particle-settings-changed': 'particle:settings:changed',
  'save-storage-warning': 'save:storage:warning',
  'game:toast:message': 'toast:message',
  'change-active-view': 'view:changed',
  'tutorial:set-tab': 'tutorial:set:tab',
  'tutorial:close-drawer': 'tutorial:close:drawer',
  'tutorial:set-gov-tab': 'tutorial:set:gov:tab',
  'game:tech:completed': 'game:tech:completed' as GameEventName,
  'game-state-updated': 'game:state:changed',
};

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private _windowBridgeEnabled: boolean = true;

  /** 启用/禁用 window 桥接（测试环境可关闭） */
  setWindowBridge(enabled: boolean): void {
    this._windowBridgeEnabled = enabled;
  }

  /** 监听事件 */
  on<K extends GameEventName>(event: K, handler: EventHandler<GameEventMap[K]>): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  /** 取消监听 */
  off<K extends GameEventName>(event: K, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  /** 触发事件（同时向 bus 内部订阅者和 window 派发） */
  emit<K extends GameEventName>(event: K, payload?: GameEventMap[K]): void {
    // 防御性初始化：反序列化后 handlers 可能为 undefined
    if (!this.handlers) this.handlers = new Map();

    // 内部订阅者
    this.handlers.get(event)?.forEach(handler => {
      try {
        handler(payload as any);
      } catch (e) {
        console.error(`EventBus handler error for ${event}:`, e);
      }
    });

    // 桥接到 window（向后兼容 React 组件）
    if (this._windowBridgeEnabled && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(event, { detail: payload }));
    }
  }

  /**
   * 兼容旧 window 事件名：自动映射到类型化事件
   * 用于迁移过渡期，逐步替换所有 window.dispatchEvent 调用
   * 同时派发旧事件名，确保 React 组件的旧监听器仍能接收
   */
  emitLegacy(windowEventName: string, detail?: any): void {
    const mapped = WINDOW_TO_GAME_EVENT[windowEventName];
    if (mapped) {
      this.emit(mapped, detail);
    }
    // 始终向 window 派发旧事件名，保证向后兼容
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(windowEventName, { detail }));
    }
  }

  /** 清空所有监听 */
  clear(): void {
    this.handlers.clear();
  }

  /** emit 的别名，向后兼容旧 API */
  emitToWindow<K extends GameEventName>(event: K, payload?: GameEventMap[K]): void {
    this.emit(event, payload);
  }

  /** 获取指定事件的监听器数量 */
  listenerCount(event: string): number {
    return this.handlers.get(event)?.size || 0;
  }

  toJSON(): object {
    return { listenerCounts: Array.from(this.handlers.entries()).map(([k, v]) => [k, v.size]) };
  }
}