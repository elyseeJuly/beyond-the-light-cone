// Generate PWA icons
// Run: node scripts/generate-icons.mjs
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '../public/icons');
const cover11Path = resolve(__dirname, '../public/images/cover_1_1.png');
mkdirSync(iconsDir, { recursive: true });

function createMinimalPNG(size) {
  const width = size;
  const height = size;
  
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // IDAT chunk - create raw image data
  const rawData = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = size * 0.35;
  
  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        const t = dist / radius;
        const r = Math.round(10 + 20 * (1 - t));
        const g = Math.round(16 + 42 * (1 - t));
        const b = Math.round(32 + 74 * (1 - t));
        rawData.push(Math.min(r, 255), Math.min(g, 255), Math.min(b, 255));
      } else {
        rawData.push(11, 16, 32);
      }
    }
  }
  
  const compressed = deflateSync(Buffer.from(rawData));
  const idatChunk = createChunk('IDAT', compressed);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function fallbackToMinimal() {
  const icon192 = createMinimalPNG(192);
  writeFileSync(resolve(iconsDir, 'icon-192x192.png'), icon192);
  console.log('  ✓ icon-192x192.png (minimal fallback)');

  const icon512 = createMinimalPNG(512);
  writeFileSync(resolve(iconsDir, 'icon-512x512.png'), icon512);
  console.log('  ✓ icon-512x512.png (minimal fallback)');
  console.log('Done!');
}

// Generate icons
console.log('Generating PWA icons...');

if (existsSync(cover11Path)) {
  console.log('Found cover_1_1.png, generating high-quality icons using sips...');
  try {
    const icon192Path = resolve(iconsDir, 'icon-192x192.png');
    const icon512Path = resolve(iconsDir, 'icon-512x512.png');
    
    execSync(`sips -z 192 192 "${cover11Path}" --out "${icon192Path}"`, { stdio: 'inherit' });
    console.log('  ✓ icon-192x192.png');
    
    execSync(`sips -z 512 512 "${cover11Path}" --out "${icon512Path}"`, { stdio: 'inherit' });
    console.log('  ✓ icon-512x512.png');
    
    console.log('Done generating high-quality icons!');
  } catch (error) {
    console.error('Failed to resize using sips, falling back to minimal PNG generator:', error);
    fallbackToMinimal();
  }
} else {
  fallbackToMinimal();
}