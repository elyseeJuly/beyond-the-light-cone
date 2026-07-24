/**
 * tutorialProgress — 教程进度持久化模块
 *
 * 替代原 `game-tutorial-seen: 'true'` 单一布尔值，引入版本号机制：
 *  - 教程内容重大改版时递增 TUTORIAL_PROGRESS_VERSION
 *  - 版本不匹配时视为未完成，老玩家会重新触发新版教程
 *  - 兼容旧记录自动迁移（version='legacy'）
 *
 * 数据结构（localStorage）：
 *   key: 'game-tutorial-progress'
 *   value: { version: string, completedAt: number, skippedAt?: number }
 */

/** 教程进度版本号。教程内容重大改版时递增（如步骤数/顺序/核心机制变化）。 */
export const TUTORIAL_PROGRESS_VERSION = '2026-07-24-v1';

/** 旧版兼容 key */
const LEGACY_KEY = 'game-tutorial-seen';

/** 新版 key */
const PROGRESS_KEY = 'game-tutorial-progress';

export interface TutorialProgress {
  /** 完成时的教程版本号 */
  version: string;
  /** 完成时间戳（ms） */
  completedAt: number;
  /** 跳过时间戳（ms，仅跳过时存在） */
  skippedAt?: number;
}

/**
 * 读取完整进度记录。自动迁移旧版 `game-tutorial-seen: 'true'`。
 */
export function getTutorialProgress(): TutorialProgress | null {
  if (typeof window === 'undefined') return null;

  // 优先读取新格式
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TutorialProgress;
      if (parsed && typeof parsed.version === 'string' && typeof parsed.completedAt === 'number') {
        return parsed;
      }
    }
  } catch (_) { /* 损坏数据，回退到旧格式检测 */ }

  // 旧格式迁移：game-tutorial-seen === 'true'
  if (localStorage.getItem(LEGACY_KEY) === 'true') {
    return { version: 'legacy', completedAt: Date.now() };
  }

  return null;
}

/**
 * 检查教程是否已完成（版本号必须匹配当前版本）。
 * 旧版记录（version='legacy'）视为未完成，会触发新版教程。
 */
export function isTutorialCompleted(): boolean {
  const progress = getTutorialProgress();
  if (!progress) return false;
  return progress.version === TUTORIAL_PROGRESS_VERSION;
}

/**
 * 检查是否曾经完成过教程（不论版本）。
 * 用于 SettingsModal 显示"教程已更新"提示。
 */
export function wasTutorialCompletedBefore(): boolean {
  return getTutorialProgress() !== null;
}

/** 标记教程已完成（写入当前版本号） */
export function markTutorialCompleted(): void {
  if (typeof window === 'undefined') return;
  const progress: TutorialProgress = {
    version: TUTORIAL_PROGRESS_VERSION,
    completedAt: Date.now(),
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  localStorage.removeItem(LEGACY_KEY);
}

/** 标记教程已跳过（保留版本号用于版本检测，但记录 skippedAt） */
export function markTutorialSkipped(): void {
  if (typeof window === 'undefined') return;
  const progress: TutorialProgress = {
    version: TUTORIAL_PROGRESS_VERSION,
    completedAt: Date.now(),
    skippedAt: Date.now(),
  };
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  localStorage.removeItem(LEGACY_KEY);
}

/** 重置教程进度（用于 SettingsModal 重置或 Game.reset） */
export function resetTutorialProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(LEGACY_KEY);
}
