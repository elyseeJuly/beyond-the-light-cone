/**
 * DIContainer - 轻量级依赖注入容器
 *
 * 用于替代 Game 单例全局访问模式，实现模块间松耦合。
 * 渐进式迁移：阶段一注册所有服务 → 阶段二 Game 通过容器获取依赖 → 阶段三所有组件通过容器访问。
 */

type Factory<T> = () => T;

export class DIContainer {
  private services: Map<string, any> = new Map();
  private factories: Map<string, Factory<any>> = new Map();
  private singletons: Set<string> = new Set();

  /** 注册已创建的实例 */
  register<T>(key: string, instance: T): void {
    this.services.set(key, instance);
    this.singletons.add(key);
  }

  /** 注册工厂（支持懒加载） */
  registerFactory<T>(key: string, factory: Factory<T>, singleton: boolean = true): void {
    this.factories.set(key, factory);
    if (singleton) this.singletons.add(key);
  }

  /** 解析服务 */
  resolve<T>(key: string): T {
    // 已存在的实例
    if (this.services.has(key)) return this.services.get(key);

    // 工厂模式创建
    if (this.factories.has(key)) {
      const instance = this.factories.get(key)!();
      if (this.singletons.has(key)) {
        this.services.set(key, instance);
      }
      return instance;
    }

    throw new Error(`DIContainer: Service "${key}" not registered.`);
  }

  /** 检查是否已注册 */
  has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key);
  }

  /** 移除服务 */
  remove(key: string): void {
    this.services.delete(key);
    this.factories.delete(key);
    this.singletons.delete(key);
  }

  /** 清空容器 */
  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }

  /** 获取所有已注册服务的键 */
  getRegisteredKeys(): string[] {
    return Array.from(new Set([...this.services.keys(), ...this.factories.keys()]));
  }
}

// 全局应用容器实例
export const AppContainer = new DIContainer();

// 标准服务键
export const ServiceKeys = {
  GAME: 'game',
  EVENT_MANAGER: 'eventManager',
  EVENT_BUS: 'eventBus',
  TAG_MANAGER: 'tagManager',
  ATMOSPHERE_ENGINE: 'atmosphereEngine',
  HISTORY_GENERATOR: 'historyGenerator',
  SAVE_MANAGER: 'saveManager',
  AUDIO_MANAGER: 'audioManager',
  COMBAT_ENGINE: 'combatEngine',
  ECOLOGY_CHAIN: 'ecologyChain',
  RELATION_NETWORK: 'relationNetwork',
  EVENT_SYSTEM: 'eventSystem',
  ECONOMY_SYSTEM: 'economySystem',
  POPULATION_SYSTEM: 'populationSystem',
} as const;