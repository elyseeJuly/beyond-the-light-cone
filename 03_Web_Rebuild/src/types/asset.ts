/**
 * 资源清单类型定义
 *
 * 定义三层资源架构的数据类型：
 * - Layer 1 (Core): 核心包，必须预缓存
 * - Layer 2 (Expansion): 扩展包，按需下载
 * - Layer 3 (Patch): 热更新包，自动覆盖
 */

// ==================== Layer 1: Core ====================

/** 核心资源条目 */
export interface CoreAsset {
  /** 资源 ID */
  id: string;
  /** 资源路径（相对于 public/） */
  path: string;
  /** 资源类型 */
  type: 'json' | 'icon' | 'font' | 'ui' | 'config';
  /** 文件大小 (bytes) */
  size: number;
  /** 哈希值用于完整性校验 */
  hash?: string;
}

// ==================== Layer 2: Expansion ====================

/** 资源解锁条件 */
export interface UnlockCondition {
  type: 'event' | 'epoch' | 'ending' | 'default';
  /** 条件值, e.g. "event_12", "crisis_era", "ending_hidden" */
  value: string;
}

/** 扩展资源条目 */
export interface ExpansionAsset {
  /** 资源 ID */
  id: string;
  /** 资源路径（相对于 public/） */
  path: string;
  /** 资源类型 */
  type: 'cg' | 'character' | 'npc' | 'ending' | 'music' | 'voice' | 'sound_effect' | 'ui_skin';
  /** 标签用于分类过滤 */
  tags: string[];
  /** 所属纪元 */
  era?: string;
  /** 文件大小 (bytes) */
  size: number;
  /** 显示名称 */
  displayName?: string;
  /** 解锁条件 */
  unlock?: UnlockCondition;
  /** 哈希值 */
  hash?: string;
  /** 是否为默认/占位资源 */
  isDefault?: boolean;
}

/** 扩展资源包 */
export interface ExpansionPack {
  /** 包 ID */
  packId: string;
  /** 包名 */
  name: string;
  /** 包描述 */
  description: string;
  /** 类型 */
  type: 'era_pack' | 'cg_pack' | 'music_pack' | 'character_pack' | 'skin_pack';
  /** 总大小 (bytes) */
  totalSize: number;
  /** 包含的资源 ID 列表 */
  assetIds: string[];
  /** 推荐优先级（数字越小越优先下载） */
  priority: number;
  /** 依赖的包 ID */
  dependencies?: string[];
}

// ==================== Layer 3: Patch ====================

/** 热更补丁类型 */
export type PatchType = 'balance' | 'bugfix' | 'text' | 'ui' | 'event' | 'system';

/** 单条变更 */
export interface PatchChange {
  /** 变更位置 */
  target: string;
  /** 变更描述 */
  description: string;
  /** 旧值 */
  oldValue?: unknown;
  /** 新值 */
  newValue?: unknown;
}

/** 热更补丁 */
export interface HotPatch {
  /** 补丁版本 */
  version: string;
  /** 补丁类型 */
  type: PatchType;
  /** 补丁描述 */
  description: string;
  /** 最低兼容版本 */
  minCompatibleVersion: string;
  /** 变更列表 */
  changes: PatchChange[];
  /** 补丁发布日的时间戳 */
  timestamp: number;
  /** 补丁文件大小 (bytes) */
  size: number;
}

// ==================== Complete Manifest ====================

/** 完整资源清单 */
export interface AssetManifest {
  /** 清单版本 */
  version: string;
  /** 游戏版本 */
  gameVersion: string;
  /** 生成时间戳 */
  generatedAt: number;
  /** Layer 1: 核心资源 */
  core: CoreAsset[];
  /** Layer 2: 扩展资源 */
  expansion: {
    assets: ExpansionAsset[];
    packs: ExpansionPack[];
  };
  /** Layer 3: 历史补丁记录 */
  patches: HotPatch[];
  /** 最新补丁索引 */
  latestPatch?: string;
}

// ==================== Resource Download State ====================

/** 资源下载状态 */
export type DownloadState = 'none' | 'queued' | 'downloading' | 'complete' | 'error';

/** 资源包下载进度 */
export interface PackDownloadProgress {
  /** 包 ID */
  packId: string;
  /** 状态 */
  state: DownloadState;
  /** 已下载字节数 */
  downloadedBytes: number;
  /** 总字节数 */
  totalBytes: number;
  /** 下载进度 (0-1) */
  progress: number;
  /** 错误信息 */
  error?: string;
}

/** IndexedDB 中存储的资产记录 */
export interface AssetRecord {
  /** 资源 ID */
  assetId: string;
  /** 下载状态 */
  state: DownloadState;
  /** 下载完成的时间戳 */
  downloadedAt?: number;
  /** 缓存版本 */
  cacheVersion: string;
}