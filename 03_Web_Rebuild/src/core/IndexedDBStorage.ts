/**
 * IndexedDBStorage - IndexedDB 存储引擎（带内存降级）
 *
 * 用于替代 localStorage 存储游戏存档、结局记录等数据。
 * 符合 Save-1 规范：使用 IndexedDB 而非 localStorage 存整个存档。
 * 符合 Save-4 规范：当 IndexedDB 不可用时自动降级到内存存储，保证测试/隐私模式可用。
 *
 * 数据库结构：
 * - DB Name: BeyondLightCone
 * - Version: 1
 * - Object Stores:
 *   - save_slots: 存档槽位 (slot1, slot2, slot3, autosave)
 *   - meta: 元数据 (endings, settings, ruins, etc.)
 */

const DB_NAME = 'BeyondLightCone';
const DB_VERSION = 1;

export class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase | null> | null = null;
  private memorySlots = new Map<string, { data: any; timestamp: number }>();
  private memoryMeta = new Map<string, { value: any; timestamp: number }>();
  private available: boolean | null = null;

  /**
   * 检测当前环境是否支持 IndexedDB
   */
  isAvailable(): boolean {
    if (this.available !== null) return this.available;
    try {
      this.available = typeof indexedDB !== 'undefined' && indexedDB !== null;
    } catch {
      this.available = false;
    }
    return this.available;
  }

  async init(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    if (!this.isAvailable()) {
      this.initPromise = Promise.resolve(null);
      return null;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // save_slots: 存档槽位
        if (!db.objectStoreNames.contains('save_slots')) {
          db.createObjectStore('save_slots', { keyPath: 'slotId' });
        }

        // meta: 元数据存储
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db!);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.initPromise;
  }

  async getSlot<T>(slotId: string): Promise<T | null> {
    const db = await this.init();
    if (!db) {
      const record = this.memorySlots.get(slotId);
      return record ? (record.data as T) : null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('save_slots', 'readonly');
      const store = tx.objectStore('save_slots');
      const request = store.get(slotId);

      request.onsuccess = () => {
        resolve(request.result?.data ?? null);
      };

      request.onerror = () => {
        console.error(`IndexedDB getSlot(${slotId}) error:`, request.error);
        reject(request.error);
      };
    });
  }

  async setSlot<T>(slotId: string, data: T): Promise<void> {
    const db = await this.init();
    if (!db) {
      this.memorySlots.set(slotId, { data, timestamp: Date.now() });
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('save_slots', 'readwrite');
      const store = tx.objectStore('save_slots');
      const record = { slotId, data, timestamp: Date.now() };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`IndexedDB setSlot(${slotId}) error:`, request.error);
        reject(request.error);
      };
    });
  }

  async deleteSlot(slotId: string): Promise<void> {
    const db = await this.init();
    this.memorySlots.delete(slotId);
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('save_slots', 'readwrite');
      const store = tx.objectStore('save_slots');
      const request = store.delete(slotId);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`IndexedDB deleteSlot(${slotId}) error:`, request.error);
        reject(request.error);
      };
    });
  }

  async listSlots(): Promise<Array<{ slotId: string; timestamp: number }>> {
    const db = await this.init();
    if (!db) {
      return Array.from(this.memorySlots.entries()).map(([slotId, record]) => ({
        slotId,
        timestamp: record.timestamp,
      }));
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('save_slots', 'readonly');
      const store = tx.objectStore('save_slots');
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result || [];
        resolve(records.map((r: any) => ({ slotId: r.slotId, timestamp: r.timestamp })));
      };

      request.onerror = () => {
        console.error('IndexedDB listSlots error:', request.error);
        reject(request.error);
      };
    });
  }

  async getMeta<T>(key: string): Promise<T | null> {
    const db = await this.init();
    if (!db) {
      const record = this.memoryMeta.get(key);
      return record ? (record.value as T) : null;
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readonly');
      const store = tx.objectStore('meta');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value ?? null);
      };

      request.onerror = () => {
        console.error(`IndexedDB getMeta(${key}) error:`, request.error);
        reject(request.error);
      };
    });
  }

  async setMeta<T>(key: string, value: T): Promise<void> {
    const db = await this.init();
    this.memoryMeta.set(key, { value, timestamp: Date.now() });
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      const record = { key, value, timestamp: Date.now() };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`IndexedDB setMeta(${key}) error:`, request.error);
        reject(request.error);
      };
    });
  }

  async deleteMeta(key: string): Promise<void> {
    const db = await this.init();
    this.memoryMeta.delete(key);
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction('meta', 'readwrite');
      const store = tx.objectStore('meta');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`IndexedDB deleteMeta(${key}) error:`, request.error);
        reject(request.error);
      };
    });
  }

  async clearAll(): Promise<void> {
    this.memorySlots.clear();
    this.memoryMeta.clear();
    const db = await this.init();
    if (!db) return;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['save_slots', 'meta'], 'readwrite');
      tx.objectStore('save_slots').clear();
      tx.objectStore('meta').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** 测试/重置用：清空内存缓存 */
  resetMemory(): void {
    this.memorySlots.clear();
    this.memoryMeta.clear();
  }
}

// Singleton instance
export const storage = new IndexedDBStorage();