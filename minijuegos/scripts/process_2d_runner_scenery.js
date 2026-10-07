import sharp from 'sharp';
import path from 'path';

const brainDir = 'C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be';
const publicImgDir = './public/assets/images';

async function removeTopWhite(inputPath, outputPath, threshold = 238) {
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
      if (minVal > 248) {
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
  // 1. Sky & Mountains (Layer 1)
  await sharp(path.join(brainDir, 'carrera_2d_fondo_cielo_1791407589544.jpg'))
    .resize(1920, 1080, { fit: 'fill' })
    .jpeg({ quality: 90 })
    .toFile(path.join(publicImgDir, 'runner-2d-cielo.jpg'));
  console.log('Saved runner-2d-cielo.jpg');

  // 2. Village Cottages (Layer 2)
  await removeTopWhite(
    path.join(brainDir, 'carrera_2d_capa_villa_1791407618175.jpg'),
    path.join(publicImgDir, 'runner-2d-villa.png'),
    235
  );

  // 3. Ground Track (Layer 3) - Crop top half tile
  const groundCropped = await sharp(path.join(brainDir, 'carrera_2d_suelo_pista_1791407648653.jpg'))
    .extract({ left: 0, top: 0, width: 1024, height: 512 })
    .toBuffer();

  const tempGroundPath = path.join(publicImgDir, 'temp_ground.jpg');
  await sharp(groundCropped).jpeg().toFile(tempGroundPath);

  await removeTopWhite(
    tempGroundPath,
    path.join(publicImgDir, 'runner-2d-suelo.png'),
    235
  );

  console.log('All 2D scenery assets processed successfully!');
}

main().catch(console.error);
