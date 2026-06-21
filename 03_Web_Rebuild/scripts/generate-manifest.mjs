/**
 * Asset Manifest Generator
 *
 * 扫描 public/ 目录，按纪元/类型归类资源，
 * 生成 asset_manifest.json 供 AssetLoader 使用。
 *
 * Usage: node scripts/generate-manifest.mjs
 */

import { readdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');
const OUTPUT_PATH = join(PUBLIC_DIR, 'asset_manifest.json');

// 文件哈希（简化版：生产环境可用 crypto）
function simpleHash(content) {
  let hash = 0;
  const str = typeof content === 'string' ? content : content.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

// ==================== 资源分类 ====================

/** 按文件名推断纪元归属 */
function detectEra(filename) {
  const name = filename.toLowerCase();
  if (name.includes('crisis') || name.includes('red_shore') || name.includes('yewenjie') ||
      name.includes('trisolaris_reply') || name.includes('eto_') || name.includes('guzheng') ||
      name.includes('beihai') || name.includes('ghost') || name.includes('thought_seal') ||
      name.includes('moon_crisis') || name.includes('doomsday') || name.includes('dark_battle') ||
      name.includes('droplet')) {
    return 'crisis_era';
  }
  if (name.includes('deterrence') || name.includes('swordholder') || name.includes('tyler') ||
      name.includes('reydiaz') || name.includes('wade_executed') || name.includes('tech_exchange') ||
      name.includes('tech_explosion') || name.includes('australia') || name.includes('bunker') ||
      name.includes('great_ravine')) {
    return 'deterrence_era';
  }
  if (name.includes('broadcast') || name.includes('galaxy') || name.includes('dimensional') ||
      name.includes('solar_system') || name.includes('trisolaris_destroyed') ||
      name.includes('trisolaris_fleet') || name.includes('wandering_earth') || name.includes('pluto')) {
    return 'broadcast_era';
  }
  if (name.includes('stardust') || name.includes('wade_coup')) {
    return 'stardust_era';
  }
  return 'unknown';
}

/** 按文件名推断资源类型 */
function detectType(filename, subdir) {
  const name = filename.toLowerCase();
  if (subdir === 'audio') {
    if (name.includes('voice') || name.includes('vo_')) return 'voice';
    return 'music';
  }
  if (name.startsWith('cg_')) return 'cg';
  if (name.startsWith('ending_')) return 'ending';
  if (name.startsWith('unified_')) return 'character';
  if (name.startsWith('npc_')) return 'npc';
  if (name.startsWith('character_default')) return 'character';
  if (name.startsWith('icon')) return 'icon';
  return 'ui';
}

// ==================== 扫描目录 ====================

function scanDirectory(dir, relativePath = '') {
  const items = [];
  const fullPath = join(PUBLIC_DIR, relativePath);

  try {
    const entries = readdirSync(fullPath);
    for (const entry of entries) {
      if (entry === '.DS_Store' || entry === 'asset_manifest.json') continue;
      const entryPath = join(fullPath, entry);
      const stat = statSync(entryPath);
      if (stat.isDirectory()) {
        items.push(...scanDirectory(dir, join(relativePath, entry)));
      } else {
        const filePath = join(relativePath, entry);
        items.push({ name: entry, path: filePath, size: stat.size });
      }
    }
  } catch (e) {
    // skip if directory doesn't exist
  }
  return items;
}

// ==================== 主逻辑 ====================

function generate() {
  console.log('🔍 Scanning public/ directory...');

  const allFiles = scanDirectory(PUBLIC_DIR);
  console.log(`   Found ${allFiles.length} files`);

  // Layer 1: Core (JSON data files, configs, small UI resources)
  const coreAssets = allFiles
    .filter(f => f.path.startsWith('images/') && (f.name.startsWith('icon') || f.name.startsWith('character_default')))
    .map(f => ({
      id: f.name.replace(/\.[^.]+$/, ''),
      path: f.path,
      type: f.path.endsWith('.json') ? 'json' : f.path.endsWith('.svg') ? 'icon' : 'ui',
      size: f.size,
      hash: simpleHash(f.name + f.size),
    }));

  // Layer 2: Expansion assets
  const expansionAssets = allFiles
    .filter(f => {
      // Exclude core assets already handled above
      if (f.path.startsWith('images/') && (f.name.startsWith('icon') || f.name.startsWith('character_default'))) return false;
      // Include images and audio
      return (f.path.startsWith('images/') || f.path.startsWith('audio/')) &&
             !f.name.startsWith('.');
    })
    .map(f => {
      const subdir = f.path.split('/')[0];
      const type = detectType(f.name, subdir);
      const era = detectEra(f.name);
      return {
        id: f.name.replace(/\.[^.]+$/, ''),
        path: f.path,
        type,
        tags: [type, era],
        era: era !== 'unknown' ? era : undefined,
        size: f.size,
        displayName: f.name.replace(/\.[^.]+$/, '').replace(/^cg_|^unified_|^npc_|^ending_/, ''),
        hash: simpleHash(f.name + f.size),
        isDefault: f.name === 'character_default.png',
      };
    });

  // Build expansion packs by era
  const eraPacks = {};
  for (const asset of expansionAssets) {
    const packKey = asset.era || 'uncategorized';
    if (!eraPacks[packKey]) {
      eraPacks[packKey] = {
        packId: `pack_${packKey}`,
        name: `${packKey.replace('_', ' ')} Pack`,
        description: `${packKey.replace('_', ' ')} 资源包`,
        type: 'era_pack',
        totalSize: 0,
        assetIds: [],
        priority: packKey === 'crisis_era' ? 1 : packKey === 'deterrence_era' ? 2 : packKey === 'broadcast_era' ? 3 : 4,
      };
    }
    eraPacks[packKey].assetIds.push(asset.id);
    eraPacks[packKey].totalSize += asset.size;
  }

  // Also create type-based packs
  const typePacks = {};
  const packTypes = ['cg', 'music', 'character'];
  for (const type of packTypes) {
    const typeAssets = expansionAssets.filter(a => a.type === type);
    if (typeAssets.length > 0) {
      typePacks[type] = {
        packId: `pack_${type}`,
        name: `${type} Pack`,
        description: `全部${type}资源`,
        type: `${type}_pack`,
        totalSize: typeAssets.reduce((sum, a) => sum + a.size, 0),
        assetIds: typeAssets.map(a => a.id),
        priority: 10,
      };
    }
  }

  const manifest = {
    version: '1.0.0',
    gameVersion: '1.0.0',
    generatedAt: Date.now(),
    core: [
      // JSON data files (precached via PWA already)
      ...allFiles
        .filter(f => f.path.endsWith('.json') && !f.path.startsWith('node_modules'))
        .map(f => ({
          id: f.name.replace(/\.[^.]+$/, ''),
          path: f.path,
          type: 'json',
          size: f.size,
        })),
      // Core UI assets
      ...coreAssets,
    ],
    expansion: {
      assets: expansionAssets,
      packs: [
        ...Object.values(eraPacks).sort((a, b) => a.priority - b.priority),
        ...Object.values(typePacks),
      ],
    },
    patches: [],
    latestPatch: null,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

  const coreSize = manifest.core.reduce((s, a) => s + a.size, 0);
  const expSize = manifest.expansion.assets.reduce((s, a) => s + a.size, 0);

  console.log(`\n📦 Manifest generated: ${OUTPUT_PATH}`);
  console.log(`   Core assets:     ${manifest.core.length} items (${(coreSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`   Expansion assets: ${manifest.expansion.assets.length} items (${(expSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`   Expansion packs:  ${manifest.expansion.packs.length} packs`);
  console.log(`   ── by era: ${Object.keys(eraPacks).length} era packs`);
  console.log(`   ── by type: ${Object.keys(typePacks).length} type packs`);
  console.log('✅ Done.');
}

generate();