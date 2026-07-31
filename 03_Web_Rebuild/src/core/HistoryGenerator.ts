import { t } from "../utils/i18n";

/**
 * HistoryGenerator - 动态编年史生成器 (UEE Layer 8)
 *
 * 自动记录游戏历史事件，生成可展示的动态编年史。
 * 与 timeline.json 融合，同时记录玩家实际历史与原著参考线。
 *
 * 入口类型：
 * - MILESTONE: 里程碑事件
 * - EVENT: 普通事件
 * - TAG_APPLIED: Tag 应用
 * - TAG_REMOVED: Tag 移除
 * - CRISIS: 危机事件
 * - VICTORY: 胜利/结局
 * - SYSTEM: 系统事件
 */

export type TimelineEntryType =
  | 'MILESTONE'
  | 'EVENT'
  | 'TAG_APPLIED'
  | 'TAG_REMOVED'
  | 'CRISIS'
  | 'VICTORY'
  | 'SYSTEM';

export interface TimelineEntry {
  year: number;
  epochName: string;
  entryType: TimelineEntryType;
  title: string;
  description: string;
  relatedTags: string[];
  relatedPersons: string[];
  turnNumber: number;
}

const EPOCH_NAMES = [t("危机纪元"), t("威慑纪元"), t("广播纪元"), t("掩体纪元"), t("银河纪元")];

export class HistoryGenerator {
  public entries: TimelineEntry[] = [];
  private turnCounter: number = 0;

  incTurn(): void {
    this.turnCounter++;
  }

  /** 记录里程碑事件 */
  recordMilestone(
    year: number,
    epoch: number,
    title: string,
    description: string,
    relatedTags: string[] = [],
    relatedPersons: string[] = [],
  ): void {
    this.entries.push({
      year,
      epochName: EPOCH_NAMES[epoch] ?? t("纪元{param0}", { param0: epoch }),
      entryType: 'MILESTONE',
      title,
      description,
      relatedTags,
      relatedPersons,
      turnNumber: this.turnCounter,
    });
  }

  /** 记录事件 */
  recordEvent(
    year: number,
    epoch: number,
    title: string,
    description: string,
    relatedTags: string[] = [],
    relatedPersons: string[] = [],
  ): void {
    this.entries.push({
      year,
      epochName: EPOCH_NAMES[epoch] ?? t("纪元{param0}", { param0: epoch }),
      entryType: 'EVENT',
      title,
      description,
      relatedTags,
      relatedPersons,
      turnNumber: this.turnCounter,
    });
  }

  /** 记录 Tag 变化 */
  recordTagChange(
    year: number,
    epoch: number,
    tagId: string,
    tagName: string,
    applied: boolean,
  ): void {
    this.entries.push({
      year,
      epochName: EPOCH_NAMES[epoch] ?? t("纪元{param0}", { param0: epoch }),
      entryType: applied ? 'TAG_APPLIED' : 'TAG_REMOVED',
      title: applied ? t("世界状态变化：{param0}", { param0: tagName }) : t("世界状态消失：{param0}", { param0: tagName }),
      description: applied
        ? t("\"{param0}\" 状态开始在世界上产生影响。", { param0: tagName })
        : t("\"{param0}\" 状态已消散。", { param0: tagName }),
      relatedTags: [tagId],
      relatedPersons: [],
      turnNumber: this.turnCounter,
    });
  }

  /** 记录危机 */
  recordCrisis(
    year: number,
    epoch: number,
    title: string,
    description: string,
  ): void {
    this.entries.push({
      year,
      epochName: EPOCH_NAMES[epoch] ?? t("纪元{param0}", { param0: epoch }),
      entryType: 'CRISIS',
      title,
      description,
      relatedTags: [],
      relatedPersons: [],
      turnNumber: this.turnCounter,
    });
  }

  /** 记录胜利/结局 */
  recordVictory(
    year: number,
    epoch: number,
    title: string,
    description: string,
  ): void {
    this.entries.push({
      year,
      epochName: EPOCH_NAMES[epoch] ?? t("纪元{param0}", { param0: epoch }),
      entryType: 'VICTORY',
      title,
      description,
      relatedTags: [],
      relatedPersons: [],
      turnNumber: this.turnCounter,
    });
  }

  /** 生成编年史文本 */
  generateChronicle(): string {
    if (this.entries.length === 0) return t("暂无历史记录。");

    return this.entries
      .map(e => {
        const prefix = t("[{param0} 第{param1}年] ", { param0: e.epochName, param1: e.year });
        const tagInfo = e.relatedTags.length > 0 ? ` (${e.relatedTags.join(', ')})` : '';
        const personInfo = e.relatedPersons.length > 0 ? ` [${e.relatedPersons.join(', ')}]` : '';
        return `${prefix}${e.title}：${e.description}${tagInfo}${personInfo}`;
      })
      .join('\n');
  }

  /** 获取指定纪元的条目 */
  getEntriesByEpoch(epoch: number): TimelineEntry[] {
    const name = EPOCH_NAMES[epoch];
    return this.entries.filter(e => e.epochName === name);
  }

  /** 获取指定类型的条目 */
  getEntriesByType(type: TimelineEntryType): TimelineEntry[] {
    return this.entries.filter(e => e.entryType === type);
  }

  /** 最近 N 条记录 */
  getRecentEntries(count: number = 10): TimelineEntry[] {
    return this.entries.slice(-count).reverse();
  }

  /** 导出为 timeline.json 兼容格式 */
  exportToTimeline(): object[] {
    return this.entries.map(e => ({
      year: e.year,
      epoch: e.epochName,
      title: e.title,
      description: e.description,
      type: e.entryType,
    }));
  }

  /** 修剪过旧的历史记录（保存最近 500 条） */
  prune(maxEntries: number = 500): void {
    if (this.entries.length > maxEntries) {
      this.entries = this.entries.slice(-maxEntries);
    }
  }

  toJSON(): object {
    return {
      entries: this.entries,
      turnCounter: this.turnCounter,
    };
  }

  static fromJSON(data: any): HistoryGenerator {
    const hg = new HistoryGenerator();
    if (data?.entries) hg.entries = data.entries;
    if (data?.turnCounter) hg.turnCounter = data.turnCounter;
    return hg;
  }

  reset(): void {
    this.entries = [];
    this.turnCounter = 0;
  }
}