import { VictoryType, DefeatType, EpochType } from "../types/enums";

/**
 * SaveManager - 独立存档管理器
 *
 * 职责：
 * - 序列化/反序列化游戏状态
 * - DJB2 哈希校验防篡改
 * - 版本兼容性管理
 * - 存档完整性验证
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

export class SaveManager {
  public static readonly STORAGE_KEY = 'LegendOfUni_Save';
  public static readonly ENDING_HISTORY_KEY = 'LegendOfUni_EndingHistory';
  public static readonly SAVE_VERSION = 3;

  /**
   * 保存游戏状态
   * @param serializeFn 序列化函数 (使用 Game.replacer)
   * @param getMetaFn 获取存档元数据函数
   */
  static save(serializeFn: () => string): void {
    try {
      const dataStr = serializeFn();
      const signature = SaveManager.computeHash(dataStr);

      const savePackage: SavePackage = {
        version: SaveManager.SAVE_VERSION,
        timestamp: Date.now(),
        signature,
        data: dataStr,
      };

      localStorage.setItem(SaveManager.STORAGE_KEY, JSON.stringify(savePackage));
    } catch (e) {
      console.error('SaveManager: Failed to save game:', e);
      throw new SaveDataCorruptedError('存档写入失败');
    }
  }

  /**
   * 读取游戏状态
   * @returns 序列化后的 JSON 字符串，或 null（无存档）
   */
  static load(): string | null {
    const raw = localStorage.getItem(SaveManager.STORAGE_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);

      // 版本兼容性检查
      if (parsed.version !== SaveManager.SAVE_VERSION) {
        throw new SaveDataCorruptedError(
          `存档版本不兼容：当前版本 v${SaveManager.SAVE_VERSION}，存档版本 v${parsed.version}`
        );
      }

      // 签名校验
      const dataStr = typeof parsed.data === 'string' ? parsed.data : JSON.stringify(parsed.data);
      const computedSignature = SaveManager.computeHash(dataStr);
      if (parsed.signature !== computedSignature) {
        throw new SaveDataCorruptedError('存档哈希校验失败，数据可能已被篡改！');
      }

      return dataStr;
    } catch (e) {
      if (e instanceof SaveDataCorruptedError) throw e;
      throw new SaveDataCorruptedError('存档解析失败：无效的 JSON 格式');
    }
  }

  /**
   * 获取存档元数据（无需加载完整存档）
   */
  static getMeta(): SaveMeta | null {
    try {
      const raw = localStorage.getItem(SaveManager.STORAGE_KEY);
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
      };
    } catch {
      return null;
    }
  }

  /** 删除存档 */
  static deleteSave(): void {
    localStorage.removeItem(SaveManager.STORAGE_KEY);
  }

  /** 检查存档是否存在 */
  static hasSave(): boolean {
    return localStorage.getItem(SaveManager.STORAGE_KEY) !== null;
  }

  /**
   * DJB2 哈希算法
   * 轻量级、确定性、适合存档校验用途（非加密）
   */
  private static computeHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return (hash >>> 0); // Ensure unsigned
  }

  public static recordEnding(record: EndingRecord): void {
    const history = this.getEndingHistory();
    history.push(record);
    if (history.length > 10) history.shift();
    localStorage.setItem(this.ENDING_HISTORY_KEY, JSON.stringify(history));
  }

  public static getEndingHistory(): EndingRecord[] {
    try {
      const data = localStorage.getItem(this.ENDING_HISTORY_KEY);
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

  public static saveRuinRecord(record: { year: number; culture: number; techCount: number }): void {
    try {
      const raw = localStorage.getItem('LegendOfUni_RuinHistory');
      const history = raw ? JSON.parse(raw) : [];
      history.push({ ...record, timestamp: Date.now() });
      if (history.length > 5) history.shift();
      localStorage.setItem('LegendOfUni_RuinHistory', JSON.stringify(history));
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
  }
}