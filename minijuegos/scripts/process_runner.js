import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const brainDir = 'C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be';
const publicImgDir = './public/assets/images';
const publicLogosDir = './public/assets/logos';

async function removeWhiteBg(inputPath, outputPath, threshold = 240) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Check if pixel is close to pure white / background
    if (r > threshold && g > threshold && b > threshold) {
      const minVal = Math.min(r, g, b);
      if (minVal > 250) {
        data[i + 3] = 0; // Fully transparent
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
  if (!fs.existsSync(publicImgDir)) {
    fs.mkdirSync(publicImgDir, { recursive: true });
  }

  // 1. Process Obstacles
  await removeWhiteBg(
    path.join(brainDir, 'obstaculo_valla_madera_1791404765215.jpg'),
    path.join(publicImgDir, 'obstaculo-valla.png'),
    235
  );

  await removeWhiteBg(
    path.join(brainDir, 'obstaculo_arco_hielo_1791404780874.jpg'),
    path.join(publicImgDir, 'obstaculo-arco-hielo.png'),
    235
  );

  await removeWhiteBg(
    path.join(brainDir, 'obstaculo_carreta_1791404803505.jpg'),
    path.join(publicImgDir, 'obstaculo-carreta.png'),
    235
  );

  // 2. Process Runner Elf & Sled
  await removeWhiteBg(
    path.join(brainDir, 'runner_elfo_trineo_1791404750075.jpg'),
    path.join(publicImgDir, 'corredor-trineo.png'),
    238
  );

  // 3. Process Medallion & Composite Feria Logo
  const tempMedallion = './public/assets/images/temp_medallion.png';
  await removeWhiteBg(
    path.join(brainDir, 'medallon_feria_gold_1791404824610.jpg'),
    tempMedallion,
    235
  );

  const logoFeria = path.join(publicLogosDir, 'Feria-magica-del-jugete-sin-fondo.png');
  const logoResized = await sharp(logoFeria)
    .resize(320, 320, { fit: 'inside' })
    .toBuffer();

  await sharp(tempMedallion)
    .composite([
      {
        input: logoResized,
        gravity: 'centre'
      }
    ])
    .png()
    .toFile(path.join(publicImgDir, 'medallon-feria.png'));
  
  if (fs.existsSync(tempMedallion)) {
    fs.unlinkSync(tempMedallion);
  }
  console.log('Saved composite medallon-feria.png');

  // 4. Menu Icon
  await sharp(path.join(brainDir, 'icon_carrera_magica_1791404848934.jpg'))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicImgDir, 'icon-carrera-magica.png'));
  console.log('Saved icon-carrera-magica.png');

  // 5. Horizon Background
  await sharp(path.join(brainDir, 'fondo_carrera_horizonte_1791404876866.jpg'))
    .resize(1024, 1024)
    .jpeg({ quality: 90 })
    .toFile(path.join(publicImgDir, 'fondo-carrera-horizonte.jpg'));
  console.log('Saved fondo-carrera-horizonte.jpg');

  console.log('All runner assets processed successfully!');
}

main().catch(console.error);
