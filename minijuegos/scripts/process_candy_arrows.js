import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputImgPath = 'C:\\Users\\ESSA7\\.gemini\\antigravity\\brain\\e3cc4166-162f-4663-a1d4-4ea77cfdc2be\\flechas_bastones_caramelo_1791305046034.jpg';
const outputDir = path.join(__dirname, '../public/assets/images');

async function processArrows() {
  const metadata = await sharp(inputImgPath).metadata();
  const width = metadata.width;
  const height = metadata.height;
  console.log(`Input size: ${width}x${height}`);

  const regions = [
    { name: 'flecha-izq.png', left: Math.floor(width * 0.05), top: Math.floor(height * 0.12), width: Math.floor(width * 0.42), height: Math.floor(height * 0.32) },
    { name: 'flecha-abajo.png', left: Math.floor(width * 0.55), top: Math.floor(height * 0.08), width: Math.floor(width * 0.35), height: Math.floor(height * 0.42) },
    { name: 'flecha-arriba.png', left: Math.floor(width * 0.14), top: Math.floor(height * 0.48), width: Math.floor(width * 0.32), height: Math.floor(height * 0.44) },
    { name: 'flecha-der.png', left: Math.floor(width * 0.52), top: Math.floor(height * 0.52), width: Math.floor(width * 0.44), height: Math.floor(height * 0.34) },
  ];

  for (const reg of regions) {
    const cropped = sharp(inputImgPath).extract(reg);
    const { data, info } = await cropped.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const len = info.width * info.height * 4;
    for (let i = 0; i < len; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;

      if (brightness < 12) {
        data[i + 3] = 0;
      } else if (brightness < 50) {
        const factor = (brightness - 12) / (50 - 12);
        data[i + 3] = Math.round(data[i + 3] * factor);
      }
    }

    const outPath = path.join(outputDir, reg.name);
    await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .trim({ threshold: 10 })
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ quality: 90, compressionLevel: 8 })
    .toFile(outPath);

    console.log(`Saved ${reg.name} successfully.`);
  }
}

processArrows().catch(console.error);
