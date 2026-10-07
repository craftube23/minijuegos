import sharp from 'sharp';
import path from 'path';

const publicImgDir = './public/assets/images';

async function cleanSprite(fileName) {
  const filePath = path.join(publicImgDir, fileName);
  await sharp(filePath)
    .trim({ threshold: 10 })
    .toFile(path.join(publicImgDir, 'trimmed_' + fileName));
  
  await sharp(path.join(publicImgDir, 'trimmed_' + fileName))
    .toFile(filePath);
  
  console.log(`Trimmed ${fileName}`);
}

async function main() {
  await cleanSprite('corredor-trineo-lateral.png');
  await cleanSprite('obstaculo-valla-lateral.png');
  await cleanSprite('obstaculo-carreta-lateral.png');
  await cleanSprite('obstaculo-hielo-lateral.png');
  await cleanSprite('obstaculo-buho-lateral.png');
}

main().catch(console.error);
