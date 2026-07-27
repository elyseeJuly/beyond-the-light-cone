import { beforeEach, describe, expect, it, vi } from 'vitest';
import manifestDataRaw from '../../../public/asset_manifest.json';
import type { AssetManifest } from '../../types/asset';
import { shouldPromptForAssetDownload } from '../../core/AssetDownloadPolicy';
import { AssetLoader } from '../../core/AssetLoader';
import {
  getDistributionChannel,
  initializeDistributionChannel,
  supportsSegmentedAssetDownloads,
} from '../../core/DistributionChannel';

/**
 * resolveJsonModule 对超大异构数组（expansion.assets 约 100 项，shape 不一致）
 * 在 Windows MSVC 下会推断为 never[]，导致 .packId / .id 访问报 TS2339。
 * 此处显式断言为 AssetManifest，与 AssetLoader 运行时使用的类型保持一致。
 */
const manifestData = manifestDataRaw as unknown as AssetManifest;

function mockDistribution(channel: 'pwa' | 'release') {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ channel }),
  }));
}

describe('SCEN-DISTRIBUTION-ASSET-POLICY', () => {
  beforeEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
    mockDistribution('pwa');
  });

  it('PWA 在存在待下载包且尚未提醒时显示进入游戏下载提醒', async () => {
    await initializeDistributionChannel();

    expect(getDistributionChannel()).toBe('pwa');
    expect(supportsSegmentedAssetDownloads()).toBe(true);
    expect(shouldPromptForAssetDownload(3, false)).toBe(true);
    expect(shouldPromptForAssetDownload(0, false)).toBe(false);
    expect(shouldPromptForAssetDownload(3, true)).toBe(false);
  });

  it('Web Release 渠道不显示下载提醒', async () => {
    mockDistribution('release');
    await initializeDistributionChannel();

    expect(getDistributionChannel()).toBe('release');
    expect(supportsSegmentedAssetDownloads()).toBe(false);
    expect(shouldPromptForAssetDownload(3, false)).toBe(false);
  });

  it('Tauri 运行时直接识别为完整资源 Release', async () => {
    (window as any).__TAURI_INTERNALS__ = {};
    const fetchMock = vi.mocked(fetch);

    await initializeDistributionChannel();

    expect(getDistributionChannel()).toBe('release');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Release 将随包扩展资源报告为已安装且不重复 fetch', async () => {
    mockDistribution('release');
    await initializeDistributionChannel();
    const loader = new AssetLoader();
    (loader as any).manifest = manifestData;
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockClear();
    const progress = vi.fn();

    await loader.downloadPack(manifestData.expansion.packs[0].packId, progress);
    const stats = loader.getStats();

    expect(stats.pendingPacks).toEqual([]);
    expect(stats.loadedSize).toBe(stats.totalSize);
    expect(stats.downloadedPacks).toHaveLength(manifestData.expansion.packs.length);
    expect(loader.isAssetAvailable(manifestData.expansion.assets[0].id)).toBe(true);
    expect(loader.isAssetAvailable('missing-asset')).toBe(false);
    expect(progress).toHaveBeenCalledWith(expect.objectContaining({ state: 'complete', progress: 1 }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
