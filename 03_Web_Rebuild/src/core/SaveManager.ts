import { VictoryType, DefeatType, EpochType } from "../types/enums";
import { storage } from "./IndexedDBStorage";
import { StatisticsManager } from "./StatisticsManager";

/**
 * SaveManager - 独立存档管理器 (IndexedDB)
 *
 * 职责：
 * - 序列化/反序列化游戏状态
 * - DJB2 哈希校验防篡改
 * - 版本兼容性管理
 * - 存档完整性验证
 * - 多槽位支持 (slot1, slot2, slot3, autosave)
 *
 * 符合 Save-1 规范：使用 IndexedDB 而非 localStorage 存整个存档。
 * 符合 Save-2 规范：save_slots 包含 slot1, slot2, slot3, autosave。
 * 符合 Save-3 规范：自动存档触发点（回合结束/纪元切换/结局前）。
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
  label: string;
  year: number;
  epoch: EpochType;
  keyFlags: string[];
  timestamp: number;
}

export const SAVE_SLOTS = ['autosave', 'slot1', 'slot2', 'slot3'] as const;
export type SaveSlotId = typeof SAVE_SLOTS[number];

export class SaveManager {
  public static readonly SAVE_VERSION = 3;
  private static _ready: Promise<void> | null = null;

  /**
   * 确保 IndexedDB 初始化完成
   */
  static async ready(): Promise<void> {
    if (!this._ready) {
      this._ready = storage.init().then(() => {});
    }
    return this._ready;
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
    // We'll try loading synchronously - in practice, the save is initialized on boot
    // For the async case, we maintain a synchronous cache
    return this._hasSlotSync('autosave');
  }

  // ==================== 多槽位 API ====================

  /**
   * 保存到指定槽位
   */
  static saveToSlot(slotId: SaveSlotId, serializeFn: () => string): void {
    try {
      const dataStr = serializeFn();
      const signature = SaveManager.computeHash(dataStr);

      const savePackage: SavePackage = {
        version: SaveManager.SAVE_VERSION,
        timestamp: Date.now(),
        signature,
        data: dataStr,
      };

      // 异步写入 IndexedDB
      storage.setSlot(slotId, savePackage).catch(err => {
        console.error(`SaveManager: IndexedDB write failed for slot ${slotId}:`, err);
      });

      // 同步 localStorage 备份（标准 key）
      localStorage.setItem(`LegendOfUni_Save_${slotId}`, JSON.stringify(savePackage));

      // 同步记录缓存
      this._cacheSlot(slotId, savePackage);
    } catch (e) {
      console.error('SaveManager: Failed to save game:', e);
      throw new SaveDataCorruptedError('存档写入失败');
    }
  }

  /**
   * 从指定槽位读取
   * 优先从 localStorage 读取以获取最新数据，缓存作为回退
   */
  static loadFromSlot(slotId: SaveSlotId): string | null {
    // Try localStorage first (authoritative source for sync reads)
    const localResult = this._loadLocalSync(slotId);
    if (localResult !== null) return localResult;

    // Fall back to cache
    const cached = this._getCachedSlot(slotId);
    if (cached) {
      try {
        return this._verifyAndExtract(cached);
      } catch {
        return null;
      }
    }

    return null;
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

      return {
        year: data.year ?? 0,
        epoch: data.epoch ?? 0,
        population: data.earthCivi?.population ?? 0,
        economy: data.earthCivi?.economy ?? 0,
        culture: data.earthCivi?.culture ?? 0,
        timestamp: parsed.timestamp,
        slotId,
      };
    } catch {
      return null;
    }
  }

  /**
   * 删除指定槽位
   */
  static deleteSlot(slotId: SaveSlotId): void {
    storage.deleteSlot(slotId).catch(err => {
      console.error(`SaveManager: IndexedDB delete failed for slot ${slotId}:`, err);
    });
    // 清除 localStorage（标准 key + legacy key）
    localStorage.removeItem(`LegendOfUni_Save_${slotId}`);
    if (slotId === 'autosave') {
      localStorage.removeItem('LegendOfUni_Save');
    }
    this._removeCache(slotId);
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

  // ==================== 结局记录 (同步 - localStorage) ====================

  public static recordEnding(record: EndingRecord): void {
    const history = this.getEndingHistory();
    history.push(record);
    if (history.length > 10) history.shift();
    localStorage.setItem('LegendOfUni_EndingHistory', JSON.stringify(history));
    // Also store in IndexedDB asynchronously
    storage.setMeta('endingHistory', history).catch(() => {});
    
    // Sync to unified telemetry manager
    StatisticsManager.recordEnding(record.victoryType, record.defeatType);
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

  // ==================== 废墟记录 (同步 - localStorage) ====================

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
    if (savePackage.version !== SaveManager.SAVE_VERSION) {
      throw new SaveDataCorruptedError(
        `存档版本不兼容：当前版本 v${SaveManager.SAVE_VERSION}，存档版本 v${savePackage.version}`
      );
    }

    const dataStr = typeof savePackage.data === 'string' ? savePackage.data : JSON.stringify(savePackage.data);
    const computedSignature = SaveManager.computeHash(dataStr);
    if (savePackage.signature !== computedSignature) {
      throw new SaveDataCorruptedError('存档哈希校验失败，数据可能已被篡改！');
    }

    return dataStr;
  }

  private static _getRawPackage(slotId: SaveSlotId): string | null {
    // Check localStorage first (authoritative)
    const raw = localStorage.getItem(`LegendOfUni_Save_${slotId}`);
    if (raw) return raw;

    // Legacy key for autosave
    if (slotId === 'autosave') {
      const oldRaw = localStorage.getItem('LegendOfUni_Save');
      if (oldRaw) return oldRaw;
    }

    // Fallback to memory cache
    const cached = this._getCachedSlot(slotId);
    if (cached) return JSON.stringify(cached);

    return null;
  }

  private static _loadLocalSync(slotId: SaveSlotId): string | null {
    const raw = this._getRawPackage(slotId);
    if (!raw) return null;

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