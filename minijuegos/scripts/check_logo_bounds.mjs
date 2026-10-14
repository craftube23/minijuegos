import sharp from 'sharp';

async function findBounds(path, threshold = 245) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a > 20 && (r < threshold || g < threshold || b < threshold)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(path, `Bounds: x=${minX}..${maxX} (w=${maxX-minX+1}), y=${minY}..${maxY} (h=${maxY-minY+1}) out of ${info.width}x${info.height}`);
}

async function main() {
  await findBounds('public/assets/logos/logo-imebu.jpg');
  await findBounds('public/assets/logos/logo-actor-humano.png');
  await findBounds('public/assets/logos/horiz-factor-humano.png');
}
main().catch(console.error);
