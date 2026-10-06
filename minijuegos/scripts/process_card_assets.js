import sharp from 'sharp';
import fs from 'fs';

async function processImages() {
  const jfifPath = 'public/assets/images/targetas/icon regalos magicos.jfif';
  const marcoPath = 'public/assets/images/targetas/marco-juego-rojo.png';

  // 1. Convert JFIF to RGBA raw buffer to remove pure white background
  const { data, info } = await sharp(jfifPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`Processing icon: ${width}x${height}, channels: ${channels}`);

  // Color keying: Remove white/near-white background
  // White threshold: R, G, B all > 240
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const minVal = Math.min(r, g, b);
    if (minVal > 235) {
      const factor = (minVal - 235) / 20; // 0 to 1
      data[i + 3] = Math.max(0, Math.min(255, Math.round(255 * (1 - factor))));
    }
  }

  // Trim transparent edges
  await sharp(data, { raw: { width, height, channels } })
    .trim()
    .png({ quality: 95 })
    .toFile('public/assets/images/icon-regalos-magicos.png');

  console.log('Saved public/assets/images/icon-regalos-magicos.png');

  // Also optimize and copy marco-juego-rojo.png
  await sharp(marcoPath)
    .png({ quality: 95 })
    .toFile('public/assets/images/marco-juego-rojo.png');

  console.log('Saved public/assets/images/marco-juego-rojo.png');
}

processImages().catch(console.error);
