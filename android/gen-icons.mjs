// Rasterize brand/logo.svg into Android launcher PNGs + web PNGs.
// Usage: node gen-icons.mjs <logo.svg> <outputRoot>
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [src, outRoot] = process.argv.slice(2);
if (!src || !outRoot) {
  console.error('usage: node gen-icons.mjs <logo.svg> <outputRoot>');
  process.exit(1);
}

const svg = fs.readFileSync(src);

const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

for (const [dpi, size] of Object.entries(densities)) {
  const dir = path.join(outRoot, 'res', `mipmap-${dpi}`);
  fs.mkdirSync(dir, { recursive: true });
  await sharp(svg).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(dir, 'ic_launcher.png'));
  console.log('wrote', path.join(dir, 'ic_launcher.png'), `${size}x${size}`);
}

const webDir = path.join(outRoot, 'web');
fs.mkdirSync(webDir, { recursive: true });
await sharp(svg).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(webDir, 'icon-512.png'));
await sharp(svg).resize(256, 256).png({ compressionLevel: 9 }).toFile(path.join(webDir, 'logo-256.png'));
console.log('wrote', path.join(webDir, 'icon-512.png'));
console.log('wrote', path.join(webDir, 'logo-256.png'));
console.log('ICONS DONE');
