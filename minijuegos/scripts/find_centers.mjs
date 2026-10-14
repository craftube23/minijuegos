import sharp from 'sharp';

async function run() {
  const imgPath = 'C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be/feria_magica_del_juguete_background_1791991316029.jpg';
  
  // Let's create a dense grid over the signboards zone (x: 200..1100, y: 550..650? No, y: 500..650)
  // Let's check y from 350 to 650 with labels every 25px
  const lines = [];
  for (let x = 200; x <= 1100; x += 25) {
    lines.push(`<line x1="${x}" y1="350" x2="${x}" y2="600" stroke="#FF0000" stroke-width="1" opacity="0.7"/>`);
    lines.push(`<text x="${x + 2}" y="365" fill="#FF0000" font-size="10" font-weight="bold">${x}</text>`);
  }
  for (let y = 350; y <= 600; y += 25) {
    lines.push(`<line x1="200" y1="${y}" x2="1100" y2="${y}" stroke="#00FFFF" stroke-width="1" opacity="0.7"/>`);
    lines.push(`<text x="205" y="${y + 12}" fill="#00FFFF" font-size="10" font-weight="bold">${y}</text>`);
  }

  const svg = `<svg width="1376" height="768" xmlns="http://www.w3.org/2000/svg">${lines.join('')}</svg>`;
  const buf = await sharp(imgPath)
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toBuffer();

  await sharp(buf)
    .extract({ left: 250, top: 380, width: 450, height: 200 })
    .toFile('../scratch_dense_grid_left_center.png');

  await sharp(buf)
    .extract({ left: 650, top: 380, width: 450, height: 200 })
    .toFile('../scratch_dense_grid_right_center.png');

  console.log('Saved dense grids');
}

run().catch(console.error);
