#!/usr/bin/env node
/**
 * 美术资源自动化重绘脚本
 * 使用 Pollinations.ai 免费API生成符合规格的CG图片
 * 支持 Epic Concept Art (21:9) 和 Gongbi Cyberpunk (3:4) 两种风格
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const BACKUP_DIR = path.join(__dirname, '..', 'public', 'images_backup');

// P0 级关键人物CG重绘配置（含明确种族描述）
const P0_CG_BATCH = [
  {
    filename: 'cg_yewenjie_signal.png',
    prompt: 'Epic sci-fi concept art, a lone East Asian Chinese female scientist in her 40s, standing in a massive dimly lit control room, pressing a glowing red button. She has typical East Asian features: black hair, dark brown eyes, gentle but determined facial structure, wearing a retro-futuristic Chinese military uniform. Outside the huge panoramic glass window, a colossal radar dish is emitting a faint beam of energy into the starry night sky. Dramatic shadow contrast, quiet determination. Massive scale, macro vs micro. Minimalist composition, large blocks of color, expressive digital brushstrokes. Volumetric fog, cinematic lighting. Masterpiece, Craig Mullins style, dark and oppressive atmosphere.',
    width: 1792,
    height: 768,
    seed: 42,
    description: '叶文洁发送信号'
  },
  {
    filename: 'cg_yangdong_suicide.png',
    prompt: 'Epic sci-fi concept art, a beautiful tragic East Asian Chinese young woman physicist in her late 20s, sitting on the edge of a balcony under a starry sky, overlooking a dark modern city. She has delicate East Asian features: long straight black hair, pale skin, melancholic dark eyes, wearing a simple dark dress. Next to her is a sheet of paper with the handwritten note. Muted cold color palette, deep shadows, melancholic atmosphere. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style.',
    width: 1792,
    height: 768,
    seed: 128,
    description: '杨冬自杀'
  },
  {
    filename: 'cg_ghost_countdown.png',
    prompt: 'Epic sci-fi concept art, an East Asian Chinese male scientist in his 40s, wearing glasses, looking at a wall in a dark room, seeing glowing semi-transparent neon-red digits 1200:00:00 hovering in his field of vision. He has typical East Asian features: short black hair, slim build, focused anxious expression, wearing a dark jacket. Eerie paranoid atmosphere, digital aberration effect, cold blue shadows. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style.',
    width: 1792,
    height: 768,
    seed: 256,
    description: '汪淼幽灵倒计时'
  },
  {
    filename: 'cg_beihai_assassination.png',
    prompt: 'Epic sci-fi concept art, a determined East Asian Chinese male space officer in a futuristic white spacesuit, floating silently in the vacuum outside a massive orbital space station, aiming a silent gas-propelled gun toward a distant shuttle window. His helmet visor is slightly open showing sharp resolute East Asian features: short black hair, stern eyes, strong jawline. Blinding sunlight reflected on metallic structures, deep space void in the background. Ruthless determination. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style.',
    width: 1792,
    height: 768,
    seed: 512,
    description: '章北海刺杀'
  },
  {
    filename: 'cg_tyler_breached.png',
    prompt: 'Epic sci-fi concept art, a white Western man in his 60s (Frederick Taylor, former US Secretary of Defense), sitting in despair on a desolate beach, looking at a transparent holographic projection of his wallfacer plan being crossed out in red. He has Caucasian features: gray hair, sharp Western facial structure, wearing a dark business suit. A colossal silent three-body sophon eye pattern faintly glowing in the overcast sky. Cold gray sea, melancholic lighting. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style.',
    width: 1792,
    height: 768,
    seed: 1024,
    description: '泰勒破壁'
  },
  {
    filename: 'cg_reydiaz_breached.png',
    prompt: 'Epic sci-fi concept art, a proud but broken Latin American male military general (Manuel Rey Diaz, Venezuelan president) in his 50s, standing in a massive underground bunker surrounded by blueprints of giant hydrogen bombs. He has Hispanic features: dark hair, olive skin, strong muscular build, wearing a decorated military uniform. A holographic silhouette of a Wallbreaker pointing at him. High contrast dramatic lighting, deep shadows. Minimalist composition, expressive digital brushstrokes. Masterpiece, Craig Mullins style.',
    width: 1792,
    height: 768,
    seed: 2048,
    description: '雷迪亚兹破壁'
  },
  {
    filename: 'cg_thought_seal.png',
    prompt: 'Epic sci-fi concept art, a soldier strapped into a high-tech metallic chair in a dimly lit medical laboratory, with a massive cybernetic helmet emitting glowing golden holographic data streams directly into their eyes. The soldier is wearing a futuristic military uniform. Cold clinical lighting, volumetric fog, high tech atmosphere. Minimalist composition, large blocks of color, expressive digital brushstrokes. Masterpiece, Craig Mullins style.',
    width: 1792,
    height: 768,
    seed: 4096,
    description: '希恩斯思想钢印'
  }
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(destPath);
        downloadImage(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

async function generateImage(config, index, total) {
  const { filename, prompt, width, height, seed, description } = config;
  const outputPath = path.join(IMAGES_DIR, filename);
  const backupPath = path.join(BACKUP_DIR, filename);
  
  // 备份原文件
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (fs.existsSync(outputPath)) {
    fs.copyFileSync(outputPath, backupPath);
    const stats = fs.statSync(outputPath);
    console.log(`[${index + 1}/${total}] 已备份原文件 ${filename} (${(stats.size / 1024).toFixed(0)}KB) -> ${backupPath}`);
  }

  // Pollinations API URL
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&enhance=true`;
  
  console.log(`[${index + 1}/${total}] 正在生成: ${description} (${filename})...`);
  console.log(`         分辨率: ${width}x${height}, Seed: ${seed}`);
  
  const startTime = Date.now();
  try {
    await downloadImage(url, outputPath);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`[${index + 1}/${total}] ✅ 完成! 耗时 ${elapsed}s, 文件大小: ${sizeMB}MB`);
    return true;
  } catch (err) {
    console.error(`[${index + 1}/${total}] ❌ 失败: ${err.message}`);
    // 恢复备份
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, outputPath);
      console.log(`         已从备份恢复原文件`);
    }
    return false;
  }
}

async function main() {
  console.log('🎨 美术资源自动化重绘工具');
  console.log('='.repeat(60));
  console.log(`目标目录: ${IMAGES_DIR}`);
  console.log(`备份目录: ${BACKUP_DIR}`);
  console.log(`批次: P0 关键人物CG (${P0_CG_BATCH.length}张)`);
  console.log('='.repeat(60));
  console.log('');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < P0_CG_BATCH.length; i++) {
    const result = await generateImage(P0_CG_BATCH[i], i, P0_CG_BATCH.length);
    if (result) success++;
    else failed++;
    
    if (i < P0_CG_BATCH.length - 1) {
      console.log('         等待5秒后继续下一张...');
      await sleep(5000);
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`📊 重绘完成: 成功 ${success} 张, 失败 ${failed} 张`);
  if (success > 0) {
    console.log(`💾 新文件已保存至: ${IMAGES_DIR}`);
    console.log(`💾 原文件备份至: ${BACKUP_DIR}`);
  }
  console.log('='.repeat(60));
}

main().catch(console.error);
