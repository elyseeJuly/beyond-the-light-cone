/**
 * Verifies that the generated PWA bundle carries one coherent version and
 * includes the files required for an interactive Service Worker update.
 */
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const assertFile = async (path, label) => {
  try {
    await access(path, constants.R_OK);
  } catch {
    throw new Error(`${label} is missing: ${path}`);
  }
};

const packageJson = await readJson(join(webRoot, 'package.json'));
const expectedVersion = packageJson.version;
const publicManifest = await readJson(join(webRoot, 'public', 'asset_manifest.json'));
const distManifestPath = join(webRoot, 'dist', 'asset_manifest.json');
const distDistributionPath = join(webRoot, 'dist', 'distribution.json');
const swPath = join(webRoot, 'dist', 'sw.js');

await Promise.all([
  assertFile(distManifestPath, 'Generated asset manifest'),
  assertFile(distDistributionPath, 'Generated distribution marker'),
  assertFile(swPath, 'Generated Service Worker'),
]);

const [distManifest, distribution, serviceWorker] = await Promise.all([
  readJson(distManifestPath),
  readJson(distDistributionPath),
  readFile(swPath, 'utf8'),
]);

const problems = [];
if (publicManifest.version !== expectedVersion || publicManifest.gameVersion !== expectedVersion) {
  problems.push(`public asset manifest is ${publicManifest.version}/${publicManifest.gameVersion}, expected ${expectedVersion}`);
}
if (distManifest.version !== expectedVersion || distManifest.gameVersion !== expectedVersion) {
  problems.push(`dist asset manifest is ${distManifest.version}/${distManifest.gameVersion}, expected ${expectedVersion}`);
}
if (distribution.channel !== 'pwa') {
  problems.push(`dist distribution channel is ${String(distribution.channel)}, expected pwa`);
}
if (!serviceWorker.includes('asset_manifest.json') || !serviceWorker.includes('SKIP_WAITING')) {
  problems.push('generated Service Worker does not contain the manifest precache and update activation contract');
}

if (problems.length > 0) {
  throw new Error(`PWA release verification failed:\n- ${problems.join('\n- ')}`);
}

console.log(`PWA release bundle verified for v${expectedVersion}`);
