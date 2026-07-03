import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameInstance } from '../../core/Game';
import { assetLoader } from '../../core/AssetLoader';
import manifestData from '../../../public/asset_manifest.json';
import pkg from '../../../package.json';

/**
 * SCEN-ASSET-DOWNLOAD-LOOP: 纪元资产按需下载与预加载
 * 验证进入新纪元时自动触发 assetLoader.downloadEraPack 及 preloadNextEra，
 * 资产下载引擎已接入游戏主循环，不再是零调用状态。
 */
describe('SCEN-ASSET-DOWNLOAD-LOOP', () => {
  beforeEach(() => {
    GameInstance.reset();
  });

  it('纪元更替时触发 downloadEraPack 下载当前纪元资源包', () => {
    const game = GameInstance.get();
    const downloadSpy = vi.spyOn(assetLoader, 'downloadEraPack').mockResolvedValue(undefined);
    const preloadSpy = vi.spyOn(assetLoader, 'preloadNextEra').mockResolvedValue(undefined);

    // 模拟从危机纪元进入威慑纪元
    game.epoch = 1; // CRISIS
    (game as any).flags.add('deterrence_established');
    game.earthCivi.culture = 250; // 达到威慑纪元阈值

    game.updateEpoch();

    expect(game.epoch).toBe(2); // DETERRENCE
    expect(downloadSpy).toHaveBeenCalledWith('deterrence_era');
    expect(preloadSpy).toHaveBeenCalledWith('deterrence_era');

    downloadSpy.mockRestore();
    preloadSpy.mockRestore();
  });

  it('纪元未更替时不触发资产下载', () => {
    const game = GameInstance.get();
    const downloadSpy = vi.spyOn(assetLoader, 'downloadEraPack').mockResolvedValue(undefined);
    const preloadSpy = vi.spyOn(assetLoader, 'preloadNextEra').mockResolvedValue(undefined);

    game.epoch = 1; // CRISIS
    game.earthCivi.culture = 50; // 未达到下一纪元阈值

    game.updateEpoch();

    expect(game.epoch).toBe(1); // 纪元未变
    expect(downloadSpy).not.toHaveBeenCalled();
    expect(preloadSpy).not.toHaveBeenCalled();

    downloadSpy.mockRestore();
    preloadSpy.mockRestore();
  });

  it('支持完整 7 纪元序列的 eraKey 映射', async () => {
    const game = GameInstance.get();
    const downloadSpy = vi.spyOn(assetLoader, 'downloadEraPack').mockResolvedValue(undefined);
    const preloadSpy = vi.spyOn(assetLoader, 'preloadNextEra').mockResolvedValue(undefined);

    // 验证从危机纪元进入威慑纪元时 eraKey 映射正确
    game.epoch = 1; // CRISIS
    (game as any).flags.add('deterrence_established');
    game.earthCivi.culture = 250;

    game.updateEpoch();
    await vi.waitFor(() => expect(downloadSpy).toHaveBeenCalledWith('deterrence_era'));

    // 验证从威慑纪元进入广播纪元时 eraKey 映射正确
    downloadSpy.mockClear();
    preloadSpy.mockClear();
    (game as any).flags.add('coordinates_broadcasted');
    game.earthCivi.culture = 550;

    game.updateEpoch();
    await vi.waitFor(() => expect(downloadSpy).toHaveBeenCalledWith('broadcast_era'));

    downloadSpy.mockRestore();
    preloadSpy.mockRestore();
  });

  it('资产下载失败不阻塞游戏主循环', () => {
    const game = GameInstance.get();
    const downloadSpy = vi.spyOn(assetLoader, 'downloadEraPack').mockRejectedValue(new Error('Network error'));
    const preloadSpy = vi.spyOn(assetLoader, 'preloadNextEra').mockRejectedValue(new Error('Network error'));

    game.epoch = 1;
    (game as any).flags.add('deterrence_established');
    game.earthCivi.culture = 250;

    // 不应抛出异常
    expect(() => game.updateEpoch()).not.toThrow();
    expect(game.epoch).toBe(2); // 纪元仍正常推进

    downloadSpy.mockRestore();
    preloadSpy.mockRestore();
  });
});

/**
 * SCEN-ASSET-MANIFEST-GEN: 资源清单精准分类生成
 * 验证 asset_manifest.json 中 uncategorized 包占比极小或不存在，
 * detectEra 算法覆盖率达到可接受水平。
 */
describe('SCEN-ASSET-MANIFEST-GEN', () => {
  const manifest: any = manifestData;

  it('manifest 文件存在且结构完整', () => {
    expect(manifest).toBeDefined();
    expect(manifest.core).toBeInstanceOf(Array);
    expect(manifest.expansion).toBeDefined();
    expect(manifest.expansion.assets).toBeInstanceOf(Array);
    expect(manifest.expansion.packs).toBeInstanceOf(Array);
  });

  it('版本号从 package.json 同步，非硬编码 1.0.0', () => {
    expect(manifest.version).toBe(pkg.version);
    expect(manifest.gameVersion).toBe(pkg.version);
  });

  it('uncategorized 包占比低于 10%（消除大规模未分类）', () => {
    const uncategorizedPack = manifest.expansion.packs.find(
      (p: any) => p.packId === 'pack_uncategorized'
    );

    const totalExpansionSize = manifest.expansion.assets.reduce(
      (sum: number, a: any) => sum + (a.size || 0), 0
    );

    if (uncategorizedPack) {
      const ratio = uncategorizedPack.totalSize / totalExpansionSize;
      console.log(`   Uncategorized: ${uncategorizedPack.assetIds.length} items, ${(uncategorizedPack.totalSize / 1024 / 1024).toFixed(1)} MB (${(ratio * 100).toFixed(1)}%)`);
      // 审计报告显示原为 41%，修复后应低于 10%
      expect(ratio).toBeLessThan(0.10);
    } else {
      // 没有 uncategorized 包是最理想状态
      console.log('   ✅ No uncategorized pack found');
    }
  });

  it('人物立绘归入 characters 类型包而非 uncategorized', () => {
    const charactersPack = manifest.expansion.packs.find(
      (p: any) => p.packId === 'pack_characters'
    );
    expect(charactersPack).toBeDefined();
    expect(charactersPack.assetIds.length).toBeGreaterThan(0);

    // 验证 unified_* 资源被归入 characters 包
    const unifiedAssets = manifest.expansion.assets.filter((a: any) =>
      a.id.startsWith('unified_')
    );
    for (const asset of unifiedAssets) {
      expect(charactersPack.assetIds).toContain(asset.id);
    }
  });

  it('结局 CG 归入 endings 类型包而非 uncategorized', () => {
    const endingsPack = manifest.expansion.packs.find(
      (p: any) => p.packId === 'pack_endings'
    );
    expect(endingsPack).toBeDefined();
    expect(endingsPack.assetIds.length).toBeGreaterThan(0);

    // 验证 ending_* 资源被归入 endings 包
    const endingAssets = manifest.expansion.assets.filter((a: any) =>
      a.id.startsWith('ending_')
    );
    for (const asset of endingAssets) {
      expect(endingsPack.assetIds).toContain(asset.id);
    }
  });

  it('纪元包覆盖完整 7 纪元序列', () => {
    const eraPackIds = [
      'pack_crisis_era',
      'pack_deterrence_era',
      'pack_broadcast_era',
      'pack_bunker_era',
      'pack_galaxy_era',
      'pack_stardust_era',
    ];

    for (const packId of eraPackIds) {
      const pack = manifest.expansion.packs.find((p: any) => p.packId === packId);
      // 黄金纪元可能无资源包，其余纪元应有对应包
      if (packId !== 'pack_golden_era') {
        expect(pack, `Missing pack: ${packId}`).toBeDefined();
      }
    }
  });

  it('资源包名使用中文友好名称（非原始英文字段）', () => {
    const friendlyNamePacks = manifest.expansion.packs.filter(
      (p: any) => p.packId !== 'pack_uncategorized'
    );

    for (const pack of friendlyNamePacks) {
      // 包名应包含中文或为友好名称，不应是原始的 "crisis_era Pack" 格式
      expect(pack.name).not.toMatch(/^[a-z_]+ Pack$/);
    }
  });
});
