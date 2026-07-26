/**
 * FlagManager - 游戏状态标记管理器
 *
 * 封装 flags Set<string> 的直接操作，提供类型安全的 API。
 * 替代 Game 类中直接暴露的 `public flags: Set<string>`。
 *
 * 所有游戏状态开关（纪元解锁条件、事件触发状态、剧情分支标记）
 * 统一通过此管理器读写，避免外部模块直接操作原始 Set。
 */

import { getEquivalentFlags } from './GameFlagAliases';
import { GameFlag, DynamicGameFlag } from './GameFlags';

export class FlagManager {
  private flags: Set<string>;

  /**
   * @param flags 可选，传入已有的 Set 实例以共享引用
   */
  constructor(flags?: Set<string>) {
    this.flags = flags || new Set();
  }

  /** 获取内部 Set 引用（用于存档迁移，不应在业务代码中使用） */
  getInternalSet(): Set<string> {
    return this.flags;
  }

  /**
   * 检查标记是否已设置。
   * 对历史版本中的同义 Flag 使用双向等价读取，避免旧存档与新代码断链。
   */
  isSet(flag: GameFlag | DynamicGameFlag | string): boolean {
    return getEquivalentFlags(flag).some((candidate) => this.flags.has(candidate));
  }

  /** 设置标记 */
  set(flag: GameFlag | DynamicGameFlag | string): void {
    this.flags.add(flag);
  }

  /** 移除标记 */
  unset(flag: GameFlag | DynamicGameFlag | string): void {
    this.flags.delete(flag);
  }

  /** 批量设置 */
  setAll(flags: string[]): void {
    for (const f of flags) {
      this.flags.add(f);
    }
  }

  /** 标记数量 */
  get size(): number {
    return this.flags.size;
  }

  /** 获取所有标记的快照 */
  getSnapshot(): string[] {
    return Array.from(this.flags);
  }

  /** 从快照恢复（用于存档加载） */
  restoreFromSnapshot(snapshot: string[]): void {
    this.flags = new Set(snapshot);
  }

  /** 清空所有标记 */
  reset(): void {
    this.flags.clear();
  }

  /**
   * 清理指定的临时 FLAG（用于纪元切换时清理上一纪元的临时标记）
   * 仅清理传入列表中的 FLAG，保留其他 FLAG
   * @param transientFlags 需要清理的临时 FLAG 名称列表
   */
  clearTransientFlags(transientFlags: string[]): void {
    for (const f of transientFlags) {
      this.flags.delete(f);
    }
  }

  /** 序列化（用于 JSON.stringify） */
  toJSON(): string[] {
    return this.getSnapshot();
  }
}
