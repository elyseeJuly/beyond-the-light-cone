/**
 * AssetLoader - 三层资源加载器
 *
 * 实现《光锥之外》资源分层架构：
 * - Layer 1 (Core):  预缓存，启动即用
 * - Layer 2 (Expansion): 按纪元/类型按需下载
 * - Layer 3 (Patch):  热更新补丁
 *
 * 核心策略：玩到哪，下到哪（不阻塞游戏进程）
 */

import type {
  AssetManifest,
  HotPatch,
  PackDownloadProgress,
  DownloadState,
  AssetRecord,
} from '../types/asset';
import { getAssetUrl } from '../utils/assetUrl';

const MANIFEST_URL = getAssetUrl('asset_manifest.json');

/** IndexedDB 中资产管理的 Store 名 */
const ASSET_DB_NAME = 'BeyondLightCone_Assets';
const ASSET_DB_VERSION = 1;

export class AssetLoader {
  private manifest: AssetManifest | null = null;
  private assetRecords: Map<string, AssetRecord> = new Map();
  private downloadQueue: string[] = [];
  private isDownloading = false;
  private db: IDBDatabase | null = null;
  private manifestPromise: Promise<AssetManifest> | null = null;
  private progressCallbacks: Map<string, (progress: PackDownloadProgress) => void> = new Map();

  // ==================== 生命周期 ====================

  /** 初始化 AssetLoader：加载清单 + 打开 IndexedDB */
  async init(): Promise<void> {
    try {
      // 并行加载清单和数据库
      const [manifest] = await Promise.all([
        this.loadManifest(),
        this.openDB().catch(err => {
          console.warn('AssetLoader: IndexedDB unavailable, using memory-only mode:', err);
          return null;
        }),
      ]);
      this.manifest = manifest;
      await this.loadAssetRecords();
      console.log(`[AssetLoader] 初始化完成：${manifest.core.length} 核心 + ${manifest.expansion.assets.length} 扩展 + ${(manifest.patches || []).length} 补丁`);
    } catch (err) {
      console.error('[AssetLoader] 初始化失败:', err);
      throw err;
    }
  }

  /** 检查核心资源是否就绪 */
  isCoreReady(): boolean {
    return this.manifest !== null;
  }

  /** 获取清单 */
  getManifest(): AssetManifest | null {
    return this.manifest;
  }

  // ==================== Layer 1: Core ====================

  /** 获取核心资源 URL */
  getCoreAssetUrl(assetId: string): string | null {
    if (!this.manifest) return null;
    const asset = this.manifest.core.find(a => a.id === assetId);
    return asset ? getAssetUrl(asset.path) : null;
  }

  // ==================== Layer 2: Expansion ====================

  /**
   * 下载指定扩展包
   * @param packId 包 ID
   * @param onProgress 进度回调
   */
  async downloadPack(
    packId: string,
    onProgress?: (progress: PackDownloadProgress) => void,
  ): Promise<void> {
    if (!this.manifest) throw new Error('[AssetLoader] Manifest not loaded');

    const pack = this.manifest.expansion.packs.find(p => p.packId === packId);
    if (!pack) throw new Error(`[AssetLoader] Pack not found: ${packId}`);

    if (onProgress) {
      this.progressCallbacks.set(packId, onProgress);
    }

    // 加入队列
    if (!this.downloadQueue.includes(packId)) {
      this.downloadQueue.push(packId);
    }

    await this.processQueue();
  }

  /**
   * 按纪元下载资源包
   * 这是最常见的调用方式：进入新纪元时自动触发
   */
  async downloadEraPack(eraKey: string): Promise<void> {
    const packId = `pack_${eraKey}`;
    await this.downloadPack(packId, (progress) => {
      if (progress.state === 'complete') {
        console.log(`[AssetLoader] 📦 ${eraKey} 资源包下载完成`);
      }
    });
  }

  /**
   * 预加载下一纪元资源
   * 在当前纪元末尾触发，提前下载 30%
   */
  async preloadNextEra(currentEra: string): Promise<void> {
    if (!this.manifest) return;

    const eraOrder = ['crisis_era', 'deterrence_era', 'broadcast_era', 'stardust_era'];
    const currentIdx = eraOrder.indexOf(currentEra);
    if (currentIdx < 0 || currentIdx >= eraOrder.length - 1) return;

    const nextEra = eraOrder[currentIdx + 1];
    const packId = `pack_${nextEra}`;
    const pack = this.manifest.expansion.packs.find(p => p.packId === packId);
    if (!pack) return;

    // 检查是否已下载
    const allComplete = pack.assetIds.every(id => {
      const record = this.assetRecords.get(id);
      return record?.state === 'complete';
    });
    if (allComplete) return;

    console.log(`[AssetLoader] 🔮 预加载下一纪元资源: ${nextEra}`);
    // 后台静默下载
    this.downloadPack(packId).catch(() => {
      // 预加载失败不阻塞游戏
    });
  }

  /**
   * 获取扩展资源 URL
   * 如果已缓存，返回本地 URL；否则返回在线 URL 并触发后台下载
   */
  async getExpansionUrl(assetId: string): Promise<string | null> {
    if (!this.manifest) return null;

    const asset = this.manifest.expansion.assets.find(a => a.id === assetId);
    if (!asset) return null;

    const base = '/beyond-the-light-cone';
    const url = `${base}/${asset.path}`;

    // 检查是否已缓存
    const record = this.assetRecords.get(assetId);
    if (record?.state === 'complete') {
      return url;
    }

    // 如果没有缓存标记但文件可能存在，仍然返回 URL
    // 浏览器的 HTTP 缓存会处理后续请求
    return url;
  }

  /** 获取已下载的包列表 */
  getCompletedPacks(): string[] {
    const completed: string[] = [];
    if (!this.manifest) return completed;

    for (const pack of this.manifest.expansion.packs) {
      const allDone = pack.assetIds.every(id => {
        return this.assetRecords.get(id)?.state === 'complete';
      });
      if (allDone) completed.push(pack.packId);
    }
    return completed;
  }

  /** 获取资源缓存及下载状态的统计数据 */
  getStats() {
    if (!this.manifest) {
      return {
        loadedSize: 0,
        totalSize: 0,
        downloadedPacks: [] as string[],
        pendingPacks: [] as string[],
        packsDetail: [] as any[],
      };
    }

    const completedPacks = this.getCompletedPacks();
    const downloadStatus = this.getDownloadStatus();
    
    // Calculate total size of all expansion packages + core package
    const coreSize = this.manifest.core.reduce((sum, a) => sum + (a.size || 0), 0);
    const expansionSize = this.manifest.expansion.assets.reduce((sum, a) => sum + (a.size || 0), 0);
    const totalSize = coreSize + expansionSize;

    // Calculate loaded size (core is always loaded + completed expansion assets)
    let loadedSize = coreSize;
    this.manifest.expansion.assets.forEach(asset => {
      if (this.assetRecords.get(asset.id)?.state === 'complete') {
        loadedSize += (asset.size || 0);
      }
    });

    const packsDetail = this.manifest.expansion.packs.map(pack => {
      const state = downloadStatus[pack.packId] ?? 'none';
      return {
        packId: pack.packId,
        name: pack.name,
        description: pack.description,
        totalSize: pack.totalSize,
        type: pack.type,
        state,
      };
    });

    const pendingPacks = this.manifest.expansion.packs
      .filter(p => !completedPacks.includes(p.packId))
      .map(p => p.packId);

    return {
      loadedSize,
      totalSize,
      downloadedPacks: completedPacks,
      pendingPacks,
      packsDetail,
    };
  }

  /** 检查某资源是否已离线可用 */
  isAssetAvailable(assetId: string): boolean {
    return this.assetRecords.get(assetId)?.state === 'complete';
  }

  /** 获取所有包的下载状态 */
  getDownloadStatus(): Record<string, DownloadState> {
    const status: Record<string, DownloadState> = {};
    if (!this.manifest) return status;

    for (const pack of this.manifest.expansion.packs) {
      const states = pack.assetIds.map(id => this.assetRecords.get(id)?.state ?? 'none');
      if (states.every(s => s === 'complete')) {
        status[pack.packId] = 'complete';
      } else if (states.some(s => s === 'downloading')) {
        status[pack.packId] = 'downloading';
      } else if (states.some(s => s === 'error')) {
        status[pack.packId] = 'error';
      } else {
        status[pack.packId] = 'none';
      }
    }
    return status;
  }

  /** 按纪元获取下载状态 */
  getEraStatus(eraKey: string): DownloadState {
    const packId = `pack_${eraKey}`;
    return this.getDownloadStatus()[packId] ?? 'none';
  }

  // ==================== Layer 3: Patch ====================

  /** 获取最新补丁信息 */
  getLatestPatch(): HotPatch | null {
    if (!this.manifest || !this.manifest.latestPatch) return null;
    return this.manifest.patches.find(p => p.version === this.manifest!.latestPatch) ?? null;
  }

  /** 应用补丁到数据 */
  applyPatch<T>(baseData: T, patch: HotPatch): T {
    // 浅层补丁应用：直接替换指定字段
    const result = { ...baseData } as any;

    for (const change of patch.changes) {
      const keys = change.target.split('.');
      let obj = result;
      for (let i = 0; i < keys.length - 1; i++) {
        if (obj[keys[i]] === undefined) break;
        obj = obj[keys[i]];
      }
      if (obj[keys[keys.length - 1]] !== undefined) {
        obj[keys[keys.length - 1]] = change.newValue;
      }
    }

    return result;
  }

  // ==================== 内部方法 ====================

  /** 加载资源清单 */
  private async loadManifest(): Promise<AssetManifest> {
    if (this.manifestPromise) return this.manifestPromise;

    this.manifestPromise = fetch(MANIFEST_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
        return res.json();
      })
      .then(data => data as AssetManifest);

    return this.manifestPromise;
  }

  /** 打开 IndexedDB */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(ASSET_DB_NAME, ASSET_DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'assetId' });
        }
        if (!db.objectStoreNames.contains('packs')) {
          db.createObjectStore('packs', { keyPath: 'packId' });
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

  /** 从 IndexedDB 加载资产记录 */
  private async loadAssetRecords(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('assets', 'readonly');
      const store = tx.objectStore('assets');
      const request = store.getAll();

      request.onsuccess = () => {
        const records = (request.result || []) as AssetRecord[];
        for (const record of records) {
          this.assetRecords.set(record.assetId, record);
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /** 处理下载队列 */
  private async processQueue(): Promise<void> {
    if (this.isDownloading) return;
    this.isDownloading = true;

    while (this.downloadQueue.length > 0) {
      const packId = this.downloadQueue.shift()!;
      await this.downloadPackInternal(packId);
    }

    this.isDownloading = false;
  }

  /** 内部：下载单个包 */
  private async downloadPackInternal(packId: string): Promise<void> {
    if (!this.manifest || !this.db) return;

    const pack = this.manifest.expansion.packs.find(p => p.packId === packId);
    if (!pack) return;

    // 检查依赖
    if (pack.dependencies) {
      for (const depId of pack.dependencies) {
        const depPack = this.manifest.expansion.packs.find(p => p.packId === depId);
        if (depPack) {
          const allDepReady = depPack.assetIds.every(id =>
            this.assetRecords.get(id)?.state === 'complete'
          );
          if (!allDepReady) {
            await this.downloadPackInternal(depId);
          }
        }
      }
    }

    const callback = this.progressCallbacks.get(packId);
    const totalBytes = pack.totalSize;
    let downloadedBytes = 0;

    const emitProgress = (state: DownloadState, error?: string) => {
      callback?.({
        packId,
        state,
        downloadedBytes,
        totalBytes,
        progress: totalBytes > 0 ? downloadedBytes / totalBytes : 1,
        error,
      });
    };

    emitProgress('downloading');

    for (const assetId of pack.assetIds) {
      const asset = this.manifest.expansion.assets.find(a => a.id === assetId);
      if (!asset) continue;

      try {
        // 下载资源（通过 fetch 触发缓存）
        const url = getAssetUrl(asset.path);
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} for ${url}`);
        }

        // 获取实际大小（用于进度计算）
        const blob = await response.blob();
        downloadedBytes += blob.size;

        // 更新记录
        const record: AssetRecord = {
          assetId,
          state: 'complete',
          downloadedAt: Date.now(),
          cacheVersion: this.manifest.version,
        };
        this.assetRecords.set(assetId, record);

        // 写入 IndexedDB
        const tx = this.db.transaction('assets', 'readwrite');
        tx.objectStore('assets').put(record);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });

        emitProgress('downloading');
      } catch (err) {
        console.error(`[AssetLoader] 下载失败: ${asset.path}`, err);
        const record: AssetRecord = {
          assetId,
          state: 'error',
          cacheVersion: this.manifest.version,
        };
        this.assetRecords.set(assetId, record);
        emitProgress('error', String(err));
        return; // 包内某资源失败，整包标记失败
      }
    }

    // 记录包完成状态
    const packTx = this.db.transaction('packs', 'readwrite');
    packTx.objectStore('packs').put({
      packId,
      state: 'complete',
      downloadedAt: Date.now(),
      cacheVersion: this.manifest.version,
    });
    await new Promise<void>((resolve, reject) => {
      packTx.oncomplete = () => resolve();
      packTx.onerror = () => reject(packTx.error);
    });

    emitProgress('complete');
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
export const assetLoader = new AssetLoader();