/**
 * PatchManager - 热更新管理器 (Layer 3)
 *
 * 负责热更新补丁的加载、验证和应用。
 * 补丁体积极小（KB~MB），无需重新下载资源包。
 *
 * 补丁来源可以是：
 * 1. asset_manifest.json 中内置的补丁列表
 * 2. 远程补丁服务器（未来扩展）
 */

import type { HotPatch, PatchType, AssetManifest } from '../types/asset';

/** IndexedDB Store 名 */
const PATCH_DB_NAME = 'BeyondLightCone_Patches';
const PATCH_DB_VERSION = 1;

/** 应用历史记录 */
interface PatchHistoryEntry {
  version: string;
  appliedAt: number;
  type: PatchType;
  description: string;
}

export class PatchManager {
  private patches: HotPatch[] = [];
  private history: PatchHistoryEntry[] = [];
  private db: IDBDatabase | null = null;
  private currentGameVersion = '1.0.0';

  // ==================== 初始化 ====================

  async init(manifest: AssetManifest, gameVersion?: string): Promise<void> {
    this.patches = manifest.patches || [];
    this.currentGameVersion = gameVersion || manifest.gameVersion;

    try {
      await this.openDB();
      await this.loadHistory();
      console.log(`[PatchManager] 初始化完成：${this.patches.length} 个补丁可用，${this.history.length} 个已应用`);
    } catch (err) {
      console.warn('[PatchManager] IndexedDB 不可用，使用内存模式:', err);
    }
  }

  // ==================== 补丁查询 ====================

  /** 获取所有可用补丁 */
  getAvailablePatches(): HotPatch[] {
    return this.patches.filter(p => !this.isApplied(p.version));
  }

  /** 获取未应用的补丁（按版本排序） */
  getPendingPatches(): HotPatch[] {
    return this.getAvailablePatches()
      .filter(p => p.minCompatibleVersion <= this.currentGameVersion)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /** 获取已应用补丁历史 */
  getPatchHistory(): PatchHistoryEntry[] {
    return [...this.history].sort((a, b) => b.appliedAt - a.appliedAt);
  }

  /** 检查指定版本是否已应用 */
  isApplied(version: string): boolean {
    return this.history.some(h => h.version === version);
  }

  /** 获取最新的补丁版本号 */
  getLatestPatchVersion(): string | null {
    const applied = this.history.sort((a, b) => b.appliedAt - a.appliedAt);
    return applied.length > 0 ? applied[0].version : null;
  }

  // ==================== 补丁应用 ====================

  /**
   * 应用所有待处理的补丁
   * @returns 应用的补丁列表
   */
  async applyPendingPatches(): Promise<HotPatch[]> {
    const pending = this.getPendingPatches();
    const applied: HotPatch[] = [];

    for (const patch of pending) {
      try {
        await this.applySinglePatch(patch);
        applied.push(patch);
      } catch (err) {
        console.error(`[PatchManager] 补丁 ${patch.version} 应用失败:`, err);
      }
    }

    return applied;
  }

  /**
   * 应用特定补丁到数据对象
   * 可用于运行时修补事件配置、数值平衡等
   */
  applyPatchToData<T extends Record<string, any>>(baseData: T, patchVersion?: string): T {
    const targetVersion = patchVersion || this.getLatestPatchVersion();
    if (!targetVersion) return baseData;

    const relevantPatches = this.patches.filter(p => {
      const versionInRange = this.isApplied(p.version);
      return versionInRange && p.type !== 'system'; // system patches handled separately
    });

    const result = { ...baseData };

    for (const patch of relevantPatches) {
      for (const change of patch.changes) {
        const keys = change.target.split('.');
        let obj = result as any;

        // 导航到目标父对象
        let depth = 0;
        while (depth < keys.length - 1 && obj !== undefined) {
          // 如果是数组索引（纯数字 key）
          if (/^\d+$/.test(keys[depth]) && Array.isArray(obj)) {
            obj = obj[parseInt(keys[depth], 10)];
          } else {
            obj = obj[keys[depth]];
          }
          depth++;
        }

        if (obj !== undefined && obj[keys[depth]] !== undefined) {
          obj[keys[depth]] = change.newValue;
        }
      }
    }

    return result;
  }

  // ==================== 内部方法 ====================

  /** 打开 IndexedDB */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(PATCH_DB_NAME, PATCH_DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'version' });
        }
        if (!db.objectStoreNames.contains('patches')) {
          db.createObjectStore('patches', { keyPath: 'version' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db!);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  /** 加载历史记录 */
  private async loadHistory(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('history', 'readonly');
      const store = tx.objectStore('history');
      const request = store.getAll();

      request.onsuccess = () => {
        this.history = (request.result || []) as PatchHistoryEntry[];
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** 应用单个补丁 */
  private async applySinglePatch(patch: HotPatch): Promise<void> {
    // 验证兼容性
    if (patch.minCompatibleVersion > this.currentGameVersion) {
      throw new Error(`补丁 ${patch.version} 需要游戏版本 >= ${patch.minCompatibleVersion}`);
    }

    // 记录到历史
    const entry: PatchHistoryEntry = {
      version: patch.version,
      appliedAt: Date.now(),
      type: patch.type,
      description: patch.description,
    };

    this.history.push(entry);

    // 写入 IndexedDB
    if (this.db) {
      const tx = this.db.transaction('history', 'readwrite');
      tx.objectStore('history').put(entry);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }

    console.log(`[PatchManager] ✅ 补丁 ${patch.version} 已应用: ${patch.description}`);
  }

  /** 释放数据库连接 */
  destroy(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const patchManager = new PatchManager();