import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function optimizeAssets() {
  console.log('🚀 Iniciando optimización masiva de assets...');

  // 1. Fondos WebP pesados
  const backgrounds = [
    { file: 'public/assets/images/fondo-nieve.webp', maxW: 1080, maxH: 1920, q: 80 },
    { file: 'public/assets/images/fondo-empresas.webp', maxW: 1280, maxH: 720, q: 80 },
    { file: 'public/assets/images/fondo con logos  de empresas.webp', maxW: 1280, maxH: 720, q: 80 },
    { file: 'public/assets/images/fondo-habitacion.webp', maxW: 1280, maxH: 720, q: 80 },
  ];

  for (const bg of backgrounds) {
    if (fs.existsSync(bg.file)) {
      const beforeSize = fs.statSync(bg.file).size;
      const tempOut = bg.file + '.tmp.webp';
      await sharp(bg.file)
        .resize({ width: bg.maxW, height: bg.maxH, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: bg.q, effort: 6 })
        .toFile(tempOut);
      fs.renameSync(tempOut, bg.file);
      const afterSize = fs.statSync(bg.file).size;
      console.log(`✅ ${path.basename(bg.file)}: ${(beforeSize/1024).toFixed(1)} KB -> ${(afterSize/1024).toFixed(1)} KB (-${((1 - afterSize/beforeSize)*100).toFixed(0)}%)`);
    }
  }

  // 2. Sprites PNG de personajes y objetos
  const pngSprites = [
    'public/assets/images/casa-roja.png',
    'public/assets/images/regalo-rojo2.png',
    'public/assets/images/elfo-planeador.png',
    'public/assets/images/bolsa de regalos.png',
    'public/assets/images/arbol.png',
    'public/assets/images/estrella con logo.png',
    'public/assets/images/osito.png',
    'public/assets/images/robot.png',
    'public/assets/images/regalo-rojo.png',
    'public/assets/images/regalo-verde.png',
    'public/assets/images/carbon.png',
    'public/assets/images/hielo.png',
    'public/assets/images/marco-juego-rojo.png',
    'public/assets/images/marco-juego-azul.png',
    'public/assets/images/marco-juego-verde.png',
    'public/assets/images/marco-juego-morado.png',
    'public/assets/images/icon-regalos-magicos.png',
    'public/assets/logos/Feria-magica-del-jugete-sin-fondo.png',
    'public/assets/logos/Campuslands-sin-fondo.png'
  ];

  for (const sp of pngSprites) {
    if (fs.existsSync(sp)) {
      const beforeSize = fs.statSync(sp).size;
      const tempOut = sp + '.tmp.png';
      await sharp(sp)
        .resize({ width: 600, height: 600, fit: 'inside', withoutEnlargement: true })
        .png({ quality: 85, compressionLevel: 9, effort: 7 })
        .toFile(tempOut);
      fs.renameSync(tempOut, sp);
      const afterSize = fs.statSync(sp).size;
      console.log(`✅ ${path.basename(sp)}: ${(beforeSize/1024).toFixed(1)} KB -> ${(afterSize/1024).toFixed(1)} KB (-${((1 - afterSize/beforeSize)*100).toFixed(0)}%)`);
    }
  }

  console.log('✨ Optimización de imágenes finalizada.');
}

optimizeAssets().catch(console.error);
