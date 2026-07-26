import { getAssetUrl } from '../utils/assetUrl';

export type DistributionChannel = 'pwa' | 'release';

interface DistributionManifest {
  channel?: string;
}

let currentChannel: DistributionChannel = hasTauriRuntime() ? 'release' : 'pwa';

export function hasTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function initializeDistributionChannel(): Promise<DistributionChannel> {
  if (hasTauriRuntime()) {
    currentChannel = 'release';
    return currentChannel;
  }

  currentChannel = 'pwa';
  try {
    const response = await fetch(getAssetUrl('distribution.json'), { cache: 'no-store' });
    if (!response.ok) return currentChannel;

    const manifest = await response.json() as DistributionManifest;
    currentChannel = manifest.channel === 'release' ? 'release' : 'pwa';
  } catch {
    // PWA 是安全默认值：渠道文件不可用时仍保留分段下载能力。
  }

  return currentChannel;
}

export function getDistributionChannel(): DistributionChannel {
  return currentChannel;
}

export function isPackagedRelease(): boolean {
  return currentChannel === 'release';
}

export function supportsSegmentedAssetDownloads(): boolean {
  return currentChannel === 'pwa';
}
