/**
 * Confirms that the GitHub Pages deployment exposes the version just built.
 * Pages can take a short time to serve a new artifact, so retry before failing.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pageUrl = process.argv[2]?.replace(/\/$/, '');
if (!pageUrl) throw new Error('Usage: node scripts/verify-published-pwa.mjs <page-url>');

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(await readFile(join(webRoot, 'package.json'), 'utf8'));
const expectedVersion = packageJson.version;
const manifestUrl = `${pageUrl}/asset_manifest.json?build=${encodeURIComponent(process.env.GITHUB_SHA || expectedVersion)}`;
const attempts = 10;

for (let attempt = 1; attempt <= attempts; attempt += 1) {
  try {
    const response = await fetch(manifestUrl, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    const manifest = response.ok ? await response.json() : null;
    if (manifest?.version === expectedVersion && manifest?.gameVersion === expectedVersion) {
      console.log(`Published PWA verified at ${pageUrl}: v${expectedVersion}`);
      process.exit(0);
    }
    console.warn(`Published manifest attempt ${attempt}/${attempts} returned ${manifest?.version ?? response.status}, expected ${expectedVersion}`);
  } catch (error) {
    console.warn(`Published manifest attempt ${attempt}/${attempts} failed: ${String(error)}`);
  }
  await new Promise(resolve => setTimeout(resolve, 6_000));
}

throw new Error(`GitHub Pages did not publish v${expectedVersion} at ${manifestUrl}`);
