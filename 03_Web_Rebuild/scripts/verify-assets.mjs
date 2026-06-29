#!/usr/bin/env node
/**
 * 美术资源验证脚本
 * 检查CG文件是否满足质量要求（分辨率、文件大小）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

// P0批次需要检查的CG文件
const P0_FILES = [
  'cg_yewenjie_signal.png',
  'cg_yangdong_suicide.png',
  'cg_ghost_countdown.png',
  'cg_beihai_assassination.png',
  'cg_tyler_breached.png',
  'cg_reydiaz_breached.png',
  'cg_thought_seal.png'
];

// P1批次
const P1_FILES = [
  'cg_red_shore_base.png',
  'cg_trisolaris_reply.png',
  'cg_eto_founded.png',
  'cg_great_ravine.png',
  'cg_great_ravine_ended.png',
  'cg_tech_explosion.png',
  'cg_doomsday_battle.png',
  'cg_dark_battle.png',
  'cg_teardrop_probe.png',
  'cg_sophon_blockade.png',
  'cg_black_domain_debate.png',
  'cg_lightspeed_ship.png',
  'cg_dimensional_warning.png',
  'cg_galaxy_exodus.png',
  'cg_zeroer_broadcast.png'
];

const MIN_SIZE_MB = 3; // 最小文件大小3MB
const MIN_WIDTH = 1792; // 最小宽度（21:9比例下）
const MIN_HEIGHT = 768; // 最小高度

function getImageDimensions(filepath) {
  try {
    const output = execSync(`sips -g pixelWidth -g pixelHeight "${filepath}"`, { encoding: 'utf8' });
    const widthMatch = output.match(/pixelWidth:\s*(\d+)/);
    const heightMatch = output.match(/pixelHeight:\s*(\d+)/);
    return {
      width: widthMatch ? parseInt(widthMatch[1]) : 0,
      height: heightMatch ? parseInt(heightMatch[1]) : 0
    };
  } catch {
    return { width: 0, height: 0 };
  }
}

function checkFile(filename, batchName) {
  const filepath = path.join(IMAGES_DIR, filename);
  const result = {
    filename,
    batch: batchName,
    exists: false,
    sizeMB: 0,
    width: 0,
    height: 0,
    ratio: 0,
    issues: [],
    pass: false
  };

  if (!fs.existsSync(filepath)) {
    result.issues.push('❌ 文件不存在');
    return result;
  }

  result.exists = true;
  const stats = fs.statSync(filepath);
  result.sizeMB = stats.size / 1024 / 1024;
  
  const dims = getImageDimensions(filepath);
  result.width = dims.width;
  result.height = dims.height;
  result.ratio = dims.width / dims.height;

  // 检查文件大小
  if (result.sizeMB < MIN_SIZE_MB) {
    result.issues.push(`⚠️ 文件过小: ${result.sizeMB.toFixed(2)}MB (需要>${MIN_SIZE_MB}MB)`);
  }

  // 检查分辨率
  if (result.width < MIN_WIDTH || result.height < MIN_HEIGHT) {
    result.issues.push(`⚠️ 分辨率不足: ${result.width}x${result.height} (需要>=${MIN_WIDTH}x${MIN_HEIGHT})`);
  }

  // 检查宽高比（21:9 = 2.333）
  const expectedRatio = 21 / 9;
  if (Math.abs(result.ratio - expectedRatio) > 0.3) {
    result.issues.push(`⚠️ 宽高比异常: ${result.ratio.toFixed(2)} (应为~2.33)`);
  }

  result.pass = result.issues.length === 0;
  return result;
}

function main() {
  console.log('🔍 CG美术资源质量验证');
  console.log('='.repeat(70));

  const allFiles = [...P0_FILES.map(f => ({ f, b: 'P0' })), ...P1_FILES.map(f => ({ f, b: 'P1' }))];
  const results = allFiles.map(({ f, b }) => checkFile(f, b));

  let passCount = 0;
  let failCount = 0;

  console.log(`\n📊 P0 批次 (${P0_FILES.length}张关键人物CG):\n`);
  results.filter(r => r.batch === 'P0').forEach(r => {
    const status = r.pass ? '✅' : '❌';
    console.log(`  ${status} ${r.filename}`);
    console.log(`     大小: ${r.sizeMB.toFixed(2)}MB | 分辨率: ${r.width}x${r.height} | 比例: ${r.ratio.toFixed(2)}`);
    r.issues.forEach(i => console.log(`     ${i}`));
    if (r.pass) passCount++; else failCount++;
  });

  console.log(`\n📊 P1 批次 (${P1_FILES.length}张场景CG):\n`);
  results.filter(r => r.batch === 'P1').forEach(r => {
    const status = r.pass ? '✅' : '❌';
    console.log(`  ${status} ${r.filename}`);
    console.log(`     大小: ${r.sizeMB.toFixed(2)}MB | 分辨率: ${r.width}x${r.height} | 比例: ${r.ratio.toFixed(2)}`);
    r.issues.forEach(i => console.log(`     ${i}`));
    if (r.pass) passCount++; else failCount++;
  });

  console.log('\n' + '='.repeat(70));
  console.log(`📈 总计: 通过 ${passCount} 张, 待重绘/有问题 ${failCount} 张`);
  
  if (failCount > 0) {
    console.log('\n💡 提示: ');
    console.log('   - 文件<3MB说明可能仍是低质量占位符，需要用Midjourney重绘');
    console.log('   - 参考 CG_REGEN_PROMPTS_20260629.md 中的提示词进行生成');
    console.log('   - 生成后请确保文件名为PNG格式并覆盖到 public/images/ 目录');
  } else {
    console.log('\n🎉 所有CG质量达标！可以构建部署。');
  }
}

main();
