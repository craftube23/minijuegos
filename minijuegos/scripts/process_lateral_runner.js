import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const brainDir = 'C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be';
const publicImgDir = './public/assets/images';
const publicLogosDir = './public/assets/logos';

async function removeWhiteBg(inputPath, outputPath, threshold = 238) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r > threshold && g > threshold && b > threshold) {
      const minVal = Math.min(r, g, b);
      if (minVal > 250) {
        data[i + 3] = 0;
      } else {
        const factor = (255 - minVal) / (255 - threshold);
        data[i + 3] = Math.round(factor * 255);
      }
    }
  }

  await sharp(data, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);
  console.log(`Saved transparent PNG: ${outputPath}`);
}

async function main() {
  // 1. Process Lateral Obstacles
  await removeWhiteBg(
    path.join(brainDir, 'obstaculo_valla_lateral_1791406811988.jpg'),
    path.join(publicImgDir, 'obstaculo-valla-lateral.png'),
    235
  );

  await removeWhiteBg(
    path.join(brainDir, 'obstaculo_carreta_lateral_1791406851650.jpg'),
    path.join(publicImgDir, 'obstaculo-carreta-lateral.png'),
    235
  );

  await removeWhiteBg(
    path.join(brainDir, 'obstaculo_hielo_lateral_1791406887326.jpg'),
    path.join(publicImgDir, 'obstaculo-hielo-lateral.png'),
    235
  );

  await removeWhiteBg(
    path.join(brainDir, 'obstaculo_buho_lateral_1791406921092.jpg'),
    path.join(publicImgDir, 'obstaculo-buho-lateral.png'),
    235
  );

  // 2. Process Lateral Sled & Composite Feria Logo on Sled Body
  const tempSled = path.join(publicImgDir, 'temp_sled.png');
  await removeWhiteBg(
    path.join(brainDir, 'runner_trineo_lateral_1791406595667.jpg'),
    tempSled,
    238
  );

  // Resize Feria logo to fit cleanly onto the wooden side flank
  const logoFeria = path.join(publicLogosDir, 'Feria-magica-del-jugete-sin-fondo.png');
  const logoResized = await sharp(logoFeria)
    .resize(190, 190, { fit: 'inside' })
    .toBuffer();

  // Position logo onto the wooden body of the sled (around x: 460, y: 640 on a 1024x1024 sprite)
  await sharp(tempSled)
    .composite([
      {
        input: logoResized,
        left: 460,
        top: 610
      }
    ])
    .png()
    .toFile(path.join(publicImgDir, 'corredor-trineo-lateral.png'));

  if (fs.existsSync(tempSled)) {
    fs.unlinkSync(tempSled);
  }
  console.log('Saved composite corredor-trineo-lateral.png with Feria logo badge!');

  console.log('All lateral assets processed successfully!');
}

main().catch(console.error);
