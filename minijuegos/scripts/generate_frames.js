import sharp from 'sharp';

async function generateVariants() {
  const baseFrame = 'public/assets/images/marco-juego-rojo.png';

  // 1. Blue Frame (Dispara-Regalos) - hue rotate ~ 200 deg
  await sharp(baseFrame)
    .modulate({
      hue: 200,
      saturation: 1.15
    })
    .png()
    .toFile('public/assets/images/marco-juego-azul.png');
  console.log('Created marco-juego-azul.png');

  // 2. Green Frame (Enciende el Árbol) - hue rotate ~ 100 deg
  await sharp(baseFrame)
    .modulate({
      hue: 100,
      saturation: 1.10
    })
    .png()
    .toFile('public/assets/images/marco-juego-verde.png');
  console.log('Created marco-juego-verde.png');

  // 3. Purple Frame (Parejas Mágicas) - hue rotate ~ 275 deg
  await sharp(baseFrame)
    .modulate({
      hue: 275,
      saturation: 1.20
    })
    .png()
    .toFile('public/assets/images/marco-juego-morado.png');
  console.log('Created marco-juego-morado.png');
}

generateVariants().catch(console.error);
