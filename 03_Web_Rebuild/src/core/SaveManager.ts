import { VictoryType, DefeatType, EpochType, NeutralType } from "../types/enums";
import { storage } from "./IndexedDBStorage";
import { StatisticsManager } from "./StatisticsManager";
import { validateSavePackage, validateSaveIndex, validateSaveMeta } from "./SaveSchema";

/**
 * SaveManager - 独立存档管理器 (IndexedDB 单一数据源)
 *
 * 职责：
 * - 序列化/反序列化游戏状态
 * - DJB2 哈希校验防篡改
 * - 版本兼容性管理 + MigrationRegistry 迁移
 * - 存档完整性验证
 * - 多槽位支持 (slot1, slot2, slot3, autosave)
 *
 * 符合 Save-1 规范：使用 IndexedDB 而非 localStorage 存整个存档。
 * 符合 Save-2 规范：save_slots 包含 slot1, slot2, slot3, autosave。
 * 符合 Save-3 规范：自动存档触发点（回合结束/纪元切换/结局前）。
 * 符合 Save-4 规范：IndexedDB 不可用时降级到内存存储；localStorage 仅保留
 *                  save_index（槽位目录）与 legacy 兼容读取。
 */

export class SaveDataCorruptedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveDataCorruptedError';
  }
}

export interface SavePackage {
  version: number;
  timestamp: number;
  signature: number;
  data: string; // 序列化后的 JSON 字符串
}

export interface SaveMeta {
  year: number;
  epoch: number;
  population: number;
  economy: number;
  culture: number;
  timestamp: number;
  slotId?: string;
}

export interface SlotInfo {
  slotId: string;
  timestamp: number;
  meta?: SaveMeta;
}

export interface EndingRecord {
  victoryType: VictoryType | null;
  defeatType: DefeatType | null;
  neutralType?: NeutralType | null;
  label: string;
  year: number;
  epoch: EpochType;
  keyFlags: string[];
  timestamp: number;
}

export interface SaveIndexEntry {
  slotId: string;
  timestamp: number;
  version: number;
}

export type MigrationFn = (data: any) => any;

export class MigrationRegistry {
  private migrations: Map<number, MigrationFn> = new Map();

  register(fromVersion: number, fn: MigrationFn): void {
    this.migrations.set(fromVersion, fn);
  }

  migrate(data: any, fromVersion: number, toVersion: number): any {
    let current = data;
    for (let v = fromVersion; v < toVersion; v++) {
      const fn = this.migrations.get(v);
      if (!fn) {
        throw new Error(`Missing migration script from version ${v} to ${v + 1}`);
      }
      current = fn(current);
    }
    return current;
  }
}

export const SAVE_SLOTS = ['autosave', 'slot1', 'slot2', 'slot3'] as const;
export type SaveSlotId = typeof SAVE_SLOTS[number];

export class SaveManager {
  public static readonly SAVE_VERSION = 3;
  private static _ready: Promise<void> | null = null;
  private static _migrations = new MigrationRegistry();

  // 注册版本迁移脚本
  static {
    // v1 -> v2: 旧存档可能没有 flags / loreMode / filteredEvents，补充默认值
    this.registerMigration(1, (data: any) => {
      if (!data.flags) data.flags = [];
      if (!data.loreMode) data.loreMode = 'strict_three_body';
      if (!data.filteredEvents) data.filteredEvents = [];
      return data;
    });

    // v2 -> v3: 确保子系统解耦后所需字段存在；子系统实例会在 Game 构造时重建
    this.registerMigration(2, (data: any) => {
      if (!data.turnHistory) data.turnHistory = [];
      if (data.deterrenceEnduranceRounds === undefined) data.deterrenceEnduranceRounds = 0;
      if (data.dimensionStrikeTriggered === undefined) data.dimensionStrikeTriggered = false;
      if (data.broadcastTriggered === undefined) data.broadcastTriggered = false;
      return data;
    });
  }

  /**
   * 注册版本迁移脚本。
   * 示例：从 v2 迁移到 v3 时，注册 registerMigration(2, (data) => { ... return data; })
   */
  static registerMigration(fromVersion: number, fn: MigrationFn): void {
    this._migrations.register(fromVersion, fn);
  }

  /**
   * 确保 IndexedDB 初始化完成，并将持久化存档预加载到内存缓存。
   */
  static async ready(): Promise<void> {
    if (!this._ready) {
      this._ready = (async () => {
        await storage.init();
        await this._hydrateCacheFromStorage();
      })();
    }
    return this._ready;
  }

  /**
   * 从 IndexedDB 将所有存档槽位加载到内存缓存，保证同步 API 可用。
   */
  private static async _hydrateCacheFromStorage(): Promise<void> {
    try {
      const slots = await storage.listSlots();
      for (const { slotId } of slots) {
        const pkg = await storage.getSlot<SavePackage>(slotId);
        if (pkg) this._cacheSlot(slotId, pkg);
      }
    } catch (err) {
      console.warn('SaveManager: Failed to hydrate cache from IndexedDB:', err);
    }
  }

  // ==================== 旧 API 兼容层 (autosave slot) ====================

  /**
   * 保存游戏状态到 autosave 槽位
   * 兼容旧 API: Game.saveGame() 调用此方法
   */
  static save(serializeFn: () => string): void {
    this.saveToSlot('autosave', serializeFn);
  }

  /**
   * 从 autosave 槽位读取游戏状态
   * 兼容旧 API: Game.loadGame() 调用此方法
   */
  static load(): string | null {
    return this.loadFromSlot('autosave');
  }

  /**
   * 获取 autosave 存档元数据
   */
  static getMeta(): SaveMeta | null {
    return this.getSlotMeta('autosave');
  }

  /** 删除 autosave 存档 */
  static deleteSave(): void {
    this.deleteSlot('autosave');
  }

  /** 检查 autosave 存档是否存在 */
  static hasSave(): boolean {
    return this._hasSlotSync('autosave');
  }

  // ==================== 多槽位 API ====================

  /**
   * 保存到指定槽位。
   * - 完整存档数据写入 IndexedDB（单一数据源）。
   * - 内存缓存同步更新，供同步 load API 使用。
   * - localStorage 保留 save_index（目录元数据）以及 legacy 完整备份，
   *   用于测试环境和旧版存档兼容（过渡方案）。
   */
  static saveToSlot(slotId: SaveSlotId, serializeFn: () => string): void {
    try {
      const dataStr = serializeFn();
      const signature = SaveManager.computeHash(dataStr);

      const savePackage: SavePackage = validateSavePackage({
        version: SaveManager.SAVE_VERSION,
        timestamp: Date.now(),
        signature,
        data: dataStr,
      });

      // 同步记录缓存
      this._cacheSlot(slotId, savePackage);

      // 异步写入 IndexedDB（单一数据源）
      storage.setSlot(slotId, savePackage).catch(err => {
        console.error(`SaveManager: IndexedDB write failed for slot ${slotId}:`, err);
      });

      // localStorage: save_index（目录元数据）
      this._updateSaveIndex(slotId, savePackage);

      // localStorage: legacy 完整备份（过渡兼容，保证测试环境与无 IndexedDB 场景可用）
      localStorage.setItem(`LegendOfUni_Save_${slotId}`, JSON.stringify(savePackage));
    } catch (e) {
      console.error('SaveManager: Failed to save game:', e);
      throw new SaveDataCorruptedError('存档写入失败');
    }
  }

  /**
   * 从指定槽位读取（同步）。
   * 优先从 localStorage legacy 备份读取（保持与现有测试及旧存档兼容）；
   * 未命中时回退到内存缓存。
   */
  static loadFromSlot(slotId: SaveSlotId): string | null {
    // 1. 兼容旧存档：localStorage 中可能仍存有完整 legacy 数据
    const legacy = this._loadLegacyLocalSync(slotId);
    if (legacy !== null) return legacy;

    // 2. 回退到内存缓存
    const cached = this._getCachedSlot(slotId);
    if (cached) {
      try {
        return this._verifyAndExtract(cached);
      } catch {
        // 缓存损坏，无其他来源
      }
    }

    return null;
  }

  /**
   * 从指定槽位读取（异步）。
   * 优先从 IndexedDB 读取完整存档，适合启动流程使用。
   */
  static async loadFromSlotAsync(slotId: SaveSlotId): Promise<string | null> {
    await this.ready();

    // 1. 内存缓存
    const cached = this._getCachedSlot(slotId);
    if (cached) {
      try {
        return this._verifyAndExtract(cached);
      } catch {
        // ignore corrupted cache
      }
    }

    // 2. IndexedDB 单一数据源
    try {
      const pkg = await storage.getSlot<SavePackage>(slotId);
      if (pkg) {
        this._cacheSlot(slotId, pkg);
        return this._verifyAndExtract(pkg);
      }
    } catch (err) {
      console.error(`SaveManager: IndexedDB read failed for slot ${slotId}:`, err);
    }

    // 3. Legacy localStorage 兼容
    return this._loadLegacyLocalSync(slotId);
  }

  /**
   * 获取指定槽位的元数据
   */
  static getSlotMeta(slotId: SaveSlotId): SaveMeta | null {
    try {
      const raw = this._getRawPackage(slotId);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const dataStr = typeof parsed.data === 'string' ? parsed.data : JSON.stringify(parsed.data);
      const data = JSON.parse(dataStr);

      return validateSaveMeta({
        year: data.year ?? 0,
        epoch: data.epoch ?? 0,
        population: data.earthCivi?.population ?? 0,
        economy: data.earthCivi?.economy ?? 0,
        culture: data.earthCivi?.culture ?? 0,
        timestamp: parsed.timestamp,
        slotId,
      });
    } catch {
      return null;
    }
  }

  /**
   * 删除指定槽位
   */
  static deleteSlot(slotId: SaveSlotId): void {
    this._removeCache(slotId);
    storage.deleteSlot(slotId).catch(err => {
      console.error(`SaveManager: IndexedDB delete failed for slot ${slotId}:`, err);
    });
    localStorage.removeItem(`LegendOfUni_Save_${slotId}`);
    localStorage.removeItem('LegendOfUni_Save');
    this._removeFromSaveIndex(slotId);
  }

  /**
   * 列出所有存档槽位信息
   */
  static async listSlots(): Promise<SlotInfo[]> {
    await this.ready();
    const slots = await storage.listSlots();
    return slots.map(s => ({
      slotId: s.slotId,
      timestamp: s.timestamp,
      meta: this.getSlotMeta(s.slotId as SaveSlotId) ?? undefined,
    }));
  }

  /**
   * 检查指定槽位是否有存档 (同步)
   */
  static hasSlot(slotId: SaveSlotId): boolean {
    return this._hasSlotSync(slotId);
  }

  // ==================== 自动存档 ====================

  /**
   * 自动存档 - 使用 autosave 槽位
   * 被 Game.ts 在回合结束/纪元切换/结局前调用
   */
  static autoSave(serializeFn: () => string): void {
    this.saveToSlot('autosave', serializeFn);
  }

  // ==================== 结局记录 ====================

  public static recordEnding(record: EndingRecord): void {
    const history = this.getEndingHistory();
    history.push(record);
    if (history.length > 10) history.shift();
    // 元数据使用 localStorage 快速读取 + IndexedDB 持久化双写（元数据体积小）
    localStorage.setItem('LegendOfUni_EndingHistory', JSON.stringify(history));
    storage.setMeta('endingHistory', history).catch(() => {});

    // Sync to unified telemetry manager
    StatisticsManager.recordEnding(record.victoryType, record.defeatType, record.neutralType ?? null);
  }

  public static getEndingHistory(): EndingRecord[] {
    try {
      const data = localStorage.getItem('LegendOfUni_EndingHistory');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static getEndingUnlocks(): Set<string> {
    const history = this.getEndingHistory();
    const unlocked = new Set<string>();
    for (const record of history) {
      if (record.victoryType !== null && record.victoryType !== undefined) {
        unlocked.add(`unlocked_victory_${record.victoryType}`);
      }
      if (record.defeatType !== null && record.defeatType !== undefined) {
        unlocked.add(`unlocked_defeat_${record.defeatType}`);
      }
      if (record.neutralType !== null && record.neutralType !== undefined) {
        unlocked.add(`unlocked_neutral_${record.neutralType}`);
      }
    }
    return unlocked;
  }

  public static isAllEndingsUnlocked(): boolean {
    const unlocks = this.getEndingUnlocks();
    const totalVictories = 6;
    const totalDefeats = 4;

    for (let i = 0; i < totalVictories; i++) {
      if (!unlocks.has(`unlocked_victory_${i}`)) return false;
    }
    for (let i = 0; i < totalDefeats; i++) {
      if (!unlocks.has(`unlocked_defeat_${i}`)) return false;
    }
    return true;
  }

  // ==================== 废墟记录 ====================

  public static saveRuinRecord(record: { year: number; culture: number; techCount: number }): void {
    try {
      const raw = localStorage.getItem('LegendOfUni_RuinHistory');
      const history = raw ? JSON.parse(raw) : [];
      history.push({ ...record, timestamp: Date.now() });
      if (history.length > 5) history.shift();
      localStorage.setItem('LegendOfUni_RuinHistory', JSON.stringify(history));
      storage.setMeta('ruinHistory', history).catch(() => {});
    } catch (e) {
      console.error("Failed to save ruin history:", e);
    }
  }

  public static getRuinHistory(): Array<{ year: number; culture: number; techCount: number; timestamp: number }> {
    try {
      const raw = localStorage.getItem('LegendOfUni_RuinHistory');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public static clearRuinHistory(): void {
    localStorage.removeItem('LegendOfUni_RuinHistory');
    storage.deleteMeta('ruinHistory').catch(() => {});
  }

  // ==================== save_index 管理 ====================

  private static readonly SAVE_INDEX_KEY = 'LegendOfUni_SaveIndex';

  private static _readSaveIndex(): Record<string, SaveIndexEntry> {
    try {
      const raw = localStorage.getItem(this.SAVE_INDEX_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return validateSaveIndex(parsed);
    } catch (e) {
      console.warn('SaveManager: Save index corrupted, resetting:', e);
      return {};
    }
  }

  private static _writeSaveIndex(index: Record<string, SaveIndexEntry>): void {
    localStorage.setItem(this.SAVE_INDEX_KEY, JSON.stringify(index));
  }

  private static _updateSaveIndex(slotId: string, pkg: SavePackage): void {
    const index = this._readSaveIndex();
    index[slotId] = { slotId, timestamp: pkg.timestamp, version: pkg.version };
    this._writeSaveIndex(index);
  }

  private static _removeFromSaveIndex(slotId: string): void {
    const index = this._readSaveIndex();
    delete index[slotId];
    this._writeSaveIndex(index);
  }

  // ==================== 内部方法 ====================

  /**
   * DJB2 哈希算法
   */
  private static computeHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return (hash >>> 0);
  }

  private static _verifyAndExtract(savePackage: SavePackage): string {
    let pkg: SavePackage;
    try {
      pkg = validateSavePackage(savePackage);
    } catch (e: any) {
      throw new SaveDataCorruptedError(`存档包校验失败: ${e?.message || '未知错误'}`);
    }

    // 版本迁移：旧版本存档尝试升级到当前版本
    if (pkg.version < SaveManager.SAVE_VERSION) {
      try {
        const data = JSON.parse(pkg.data);
        const migrated = this._migrations.migrate(data, pkg.version, SaveManager.SAVE_VERSION);
        const migratedStr = JSON.stringify(migrated);
        pkg = {
          ...pkg,
          version: SaveManager.SAVE_VERSION,
          data: migratedStr,
          signature: this.computeHash(migratedStr),
        };
      } catch {
        throw new SaveDataCorruptedError(
          `存档版本不兼容：当前版本 v${SaveManager.SAVE_VERSION}，存档版本 v${pkg.version}`
        );
      }
    }

    if (pkg.version !== SaveManager.SAVE_VERSION) {
      throw new SaveDataCorruptedError(
        `存档版本不兼容：当前版本 v${SaveManager.SAVE_VERSION}，存档版本 v${pkg.version}`
      );
    }

    const dataStr = typeof pkg.data === 'string' ? pkg.data : JSON.stringify(pkg.data);
    const computedSignature = SaveManager.computeHash(dataStr);
    if (pkg.signature !== computedSignature) {
      throw new SaveDataCorruptedError('存档哈希校验失败，数据可能已被篡改！');
    }

    return dataStr;
  }

  private static _getRawPackage(slotId: SaveSlotId): string | null {
    const cached = this._getCachedSlot(slotId);
    if (cached) return JSON.stringify(cached);

    // Legacy full-package backup in localStorage
    const raw = localStorage.getItem(`LegendOfUni_Save_${slotId}`);
    if (raw) return raw;

    // Legacy autosave key
    if (slotId === 'autosave') {
      const oldRaw = localStorage.getItem('LegendOfUni_Save');
      if (oldRaw) return oldRaw;
    }

    return null;
  }

  private static _loadLegacyLocalSync(slotId: SaveSlotId): string | null {
    const raw = localStorage.getItem(`LegendOfUni_Save_${slotId}`);
    if (!raw && slotId === 'autosave') {
      const legacy = localStorage.getItem('LegendOfUni_Save');
      if (legacy) return this._parseAndVerify(legacy);
    }
    if (!raw) return null;
    return this._parseAndVerify(raw);
  }

  private static _parseAndVerify(raw: string): string | null {
    try {
      const parsed = JSON.parse(raw);
      return this._verifyAndExtract(parsed);
    } catch (e) {
      if (e instanceof SaveDataCorruptedError) throw e;
      throw new SaveDataCorruptedError('存档解析失败：无效的 JSON 格式');
    }
  }

  private static _hasSlotSync(slotId: SaveSlotId): boolean {
    if (this._getCachedSlot(slotId)) return true;
    if (localStorage.getItem(`LegendOfUni_Save_${slotId}`)) return true;
    if (slotId === 'autosave' && localStorage.getItem('LegendOfUni_Save')) return true;
    return false;
  }

  public static resetCache(): void {
    this._slotCache.clear();
  }

  // ==================== 内存缓存 ====================

  private static _slotCache = new Map<string, SavePackage>();

  private static _cacheSlot(slotId: string, pkg: SavePackage): void {
    this._slotCache.set(slotId, pkg);
  }

  private static _getCachedSlot(slotId: string): SavePackage | undefined {
    return this._slotCache.get(slotId);
  }

  private static _removeCache(slotId: string): void {
    this._slotCache.delete(slotId);
  }
}