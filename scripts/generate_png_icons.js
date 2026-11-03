import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c >>> 0;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with warm ivory paper background (#FAF9F5 = 250, 249, 245)
  // and charcoal emblem (#1C1917 = 28, 25, 23)
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  const cx = width / 2;
  const cy = height / 2;
  const scale = width / 512;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      
      // Default paper color #FAF9F5
      let r = 250, g = 249, b = 245, a = 255;
      
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Draw subtle rounded outer card
      const maxR = width * 0.44;
      if (Math.abs(dx) < maxR && Math.abs(dy) < maxR) {
        // inner canvas
      }

      // Tuning fork prong lines
      // Stem: x in [-8*scale, 8*scale], y in [20*scale, 100*scale]
      if (Math.abs(dx) <= 8 * scale && dy >= 20 * scale && dy <= 100 * scale) {
        r = 28; g = 25; b = 23;
      }
      // Note dot: r <= 14*scale at dy = 115*scale
      const dotDist = Math.sqrt(dx * dx + (dy - 115 * scale) * (dy - 115 * scale));
      if (dotDist <= 14 * scale) {
        r = 28; g = 25; b = 23;
      }
      // Fork U shape:
      // Left tine: dx in [-46*scale, -34*scale], dy in [-60*scale, 0]
      if (Math.abs(dx - (-40 * scale)) <= 7 * scale && dy >= -60 * scale && dy <= 0) {
        r = 28; g = 25; b = 23;
      }
      // Right tine: dx in [34*scale, 46*scale], dy in [-60*scale, 0]
      if (Math.abs(dx - (40 * scale)) <= 7 * scale && dy >= -60 * scale && dy <= 0) {
        r = 28; g = 25; b = 23;
      }
      // Bottom arc of fork: dist from center (0,0) approx 40*scale for dy in [0, 40*scale]
      const arcDist = Math.sqrt(dx * dx + dy * dy);
      if (dy >= 0 && Math.abs(arcDist - 40 * scale) <= 7 * scale && dy <= 42 * scale) {
        r = 28; g = 25; b = 23;
      }

      // Soundwave lines:
      if (Math.abs(dy - (-40 * scale)) <= 4 * scale && Math.abs(dx) >= 65 * scale && Math.abs(dx) <= 95 * scale) {
        r = 120; g = 113; b = 108;
      }
      if (Math.abs(dy - (-10 * scale)) <= 4 * scale && Math.abs(dx) >= 65 * scale && Math.abs(dx) <= 105 * scale) {
        r = 120; g = 113; b = 108;
      }
      if (Math.abs(dy - (20 * scale)) <= 4 * scale && Math.abs(dx) >= 65 * scale && Math.abs(dx) <= 95 * scale) {
        r = 120; g = 113; b = 108;
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createPng(192, 192));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createPng(512, 512));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPng(180, 180));
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), createPng(48, 48));

console.log('Successfully generated PWA PNG icons in public/');
