// Generate the favicon and the Open Graph card.
// Run with: node scripts/make-assets.mjs
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const LOGO = 'src/assets/logo.png';
const WALLPAPER = 'src/assets/wallpaper.webp';
await mkdir('public', { recursive: true });

// 64x64 favicon: the neon orbit mark on the site background.
await sharp(LOGO)
  .resize(64, 64, { fit: 'contain', background: { r: 11, g: 11, b: 16, alpha: 1 } })
  .png()
  .toFile('public/favicon.png');

// 1200x630 Open Graph card: the brand wallpaper, center-cropped.
await sharp(WALLPAPER)
  .resize(1200, 630, { fit: 'cover', position: 'center' })
  .png()
  .toFile('public/og.png');

console.log('wrote public/favicon.png and public/og.png');
