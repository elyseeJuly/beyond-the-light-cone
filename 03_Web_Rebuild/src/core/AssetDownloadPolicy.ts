import { supportsSegmentedAssetDownloads } from './DistributionChannel';

export function shouldPromptForAssetDownload(
  pendingPackCount: number,
  promptSeen: boolean,
): boolean {
  return supportsSegmentedAssetDownloads() && pendingPackCount > 0 && !promptSeen;
}
