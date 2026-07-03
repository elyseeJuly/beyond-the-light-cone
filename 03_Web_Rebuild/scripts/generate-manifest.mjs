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
const PACKAGE_JSON_PATH = join(__dirname, '..', 'package.json');

/** 从 package.json 读取游戏版本号，避免硬编码 */
function readGameVersion() {
  try {
    const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

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

/**
 * 按文件名推断纪元归属
 * 仅对事件 CG (cg_*) 进行纪元归类；
 * 人物立绘 (unified_*, npc_*) 与结局 CG (ending_*) 归入专门类型包，
 * 不强制按纪元分类，避免大量资源落入 uncategorized。
 */
function detectEra(filename) {
  const name = filename.toLowerCase();

  // 人物立绘与 NPC 立绘：跨纪元通用资源，归入 characters 类型包
  if (name.startsWith('unified_') || name.startsWith('npc_') || name.startsWith('character_default')) {
    return 'characters';
  }
  // 结局 CG：归入 endings 类型包，不按纪元分
  if (name.startsWith('ending_')) {
    return 'endings';
  }
  // 音频文件：归入 music 类型包
  if (name.endsWith('.mp3') || name.endsWith('.ogg') || name.endsWith('.wav') || name.endsWith('.m4a')) {
    return 'music';
  }

  // 事件 CG 按纪元关键词归类（覆盖全部剧情节点）
  // 危机纪元 (epoch 1)
  if (name.includes('crisis') || name.includes('red_shore') || name.includes('yewenjie') ||
      name.includes('trisolaris_reply') || name.includes('eto_') || name.includes('guzheng') ||
      name.includes('beihai') || name.includes('ghost') || name.includes('thought_seal') ||
      name.includes('moon_crisis') || name.includes('doomsday') || name.includes('dark_battle') ||
      name.includes('droplet') || name.includes('sophon_blockade') || name.includes('yangdong') ||
      name.includes('teardrop')) {
    return 'crisis_era';
  }
  // 威慑纪元 (epoch 2)
  if (name.includes('deterrence_established') || name.includes('swordholder') || name.includes('tyler') ||
      name.includes('reydiaz') || name.includes('wade_executed') || name.includes('tech_exchange') ||
      name.includes('tech_explosion') || name.includes('great_ravine') || name.includes('australia') ||
      name.includes('black_domain_debate') || name.includes('lightspeed_ship')) {
    return 'deterrence_era';
  }
  // 广播纪元 (epoch 3)
  if (name.includes('gravitational_broadcast') || name.includes('deterrence_broken') ||
      name.includes('trisolaris_destroyed') || name.includes('trisolaris_fleet') ||
      name.includes('wandering_earth') || name.includes('pluto') || name.includes('zeroer')) {
    return 'broadcast_era';
  }
  // 掩体纪元 (epoch 4)
  if (name.includes('bunker') || name.includes('solar_system') || name.includes('dimensional_warning')) {
    return 'bunker_era';
  }
  // 银河纪元 (epoch 5)
  if (name.includes('galaxy') || name.includes('dimensional_strike') ||
      name.includes('solar_system_flattened')) {
    return 'galaxy_era';
  }
  // 星屑纪元 (epoch 6)
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

  // 纪元/类型包中文名映射，提升玩家可见的包名友好度
  const PACK_NAMES = {
    characters: { name: '人物立绘包', desc: '全部角色与 NPC 立绘资源', priority: 1 },
    crisis_era: { name: '危机纪元包', desc: '危机纪元事件 CG 资源', priority: 2 },
    deterrence_era: { name: '威慑纪元包', desc: '威慑纪元事件 CG 资源', priority: 3 },
    broadcast_era: { name: '广播纪元包', desc: '广播纪元事件 CG 资源', priority: 4 },
    bunker_era: { name: '掩体纪元包', desc: '掩体纪元事件 CG 资源', priority: 5 },
    galaxy_era: { name: '银河纪元包', desc: '银河纪元事件 CG 资源', priority: 6 },
    stardust_era: { name: '星屑纪元包', desc: '星屑纪元事件 CG 资源', priority: 7 },
    music: { name: '原声音乐包', desc: '游戏 BGM 与音效资源', priority: 8 },
    endings: { name: '结局 CG 包', desc: '全部结局插画资源', priority: 9 },
    uncategorized: { name: '未分类资源包', desc: '未能自动归类的资源', priority: 99 },
  };

  // Build expansion packs by era/type classification
  const eraPacks = {};
  for (const asset of expansionAssets) {
    const packKey = asset.era || 'uncategorized';
    if (!eraPacks[packKey]) {
      const meta = PACK_NAMES[packKey] || { name: `${packKey} Pack`, desc: `${packKey} 资源包`, priority: 50 };
      // 判断包类型：纪元包为 era_pack，人物/结局/音乐为对应类型包
      const isEraPack = packKey.endsWith('_era');
      const packType = isEraPack ? 'era_pack'
        : packKey === 'characters' ? 'character_pack'
        : packKey === 'endings' ? 'cg_pack'
        : packKey === 'music' ? 'music_pack'
        : 'era_pack';
      eraPacks[packKey] = {
        packId: `pack_${packKey}`,
        name: meta.name,
        description: meta.desc,
        type: packType,
        totalSize: 0,
        assetIds: [],
        priority: meta.priority,
      };
    }
    eraPacks[packKey].assetIds.push(asset.id);
    eraPacks[packKey].totalSize += asset.size;
  }

  // Type-based packs removed: eraPacks 已通过 detectEra 将人物/结局/音乐资源
  // 归入专门类型包（pack_characters / pack_endings / pack_music），
  // 不再需要重复的 typePacks 聚合视图。

  const GAME_VERSION = readGameVersion();

  const manifest = {
    version: GAME_VERSION,
    gameVersion: GAME_VERSION,
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
      ],
    },
    patches: [],
    latestPatch: null,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

  const coreSize = manifest.core.reduce((s, a) => s + a.size, 0);
  const expSize = manifest.expansion.assets.reduce((s, a) => s + a.size, 0);
  const uncategorizedPack = manifest.expansion.packs.find(p => p.packId === 'pack_uncategorized');
  const uncategorizedSize = uncategorizedPack ? uncategorizedPack.totalSize : 0;
  const uncategorizedRatio = expSize > 0 ? (uncategorizedSize / expSize * 100).toFixed(1) : '0.0';

  console.log(`\n📦 Manifest generated: ${OUTPUT_PATH}`);
  console.log(`   Game version:     ${GAME_VERSION}`);
  console.log(`   Core assets:      ${manifest.core.length} items (${(coreSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`   Expansion assets: ${manifest.expansion.assets.length} items (${(expSize / 1024 / 1024).toFixed(1)} MB)`);
  console.log(`   Expansion packs:  ${manifest.expansion.packs.length} packs`);
  console.log(`   ── by era/type:   ${Object.keys(eraPacks).length} packs`);
  if (uncategorizedPack) {
    console.log(`   ⚠️  Uncategorized:  ${uncategorizedPack.assetIds.length} items (${(uncategorizedSize / 1024 / 1024).toFixed(1)} MB, ${uncategorizedRatio}%)`);
  } else {
    console.log(`   ✅ Uncategorized:  0 items (0%)`);
  }
  console.log('✅ Done.');
}

generate();