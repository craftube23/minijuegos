import sharp from 'sharp';

async function run() {
  const lines = [];
  for (let x = 300; x <= 1200; x += 50) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="714" stroke="#FF0000" stroke-width="1"/>`);
    lines.push(`<text x="${x + 2}" y="15" fill="#FF0000" font-size="12" font-weight="bold">${x}</text>`);
  }
  for (let y = 0; y <= 714; y += 50) {
    lines.push(`<line x1="0" y1="${y}" x2="1280" y2="${y}" stroke="#00FFFF" stroke-width="1"/>`);
    lines.push(`<text x="5" y="${y + 12}" fill="#00FFFF" font-size="12" font-weight="bold">${y}</text>`);
  }

  const svg = `<svg width="1280" height="714" xmlns="http://www.w3.org/2000/svg">${lines.join('')}</svg>`;
  
  const compositedBuf = await sharp('public/assets/images/fondo-empresas.backup.webp')
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toBuffer();

  await sharp(compositedBuf)
    .extract({ left: 350, top: 320, width: 320, height: 220 })
    .toFile('../scratch_measure_street.png');

  await sharp(compositedBuf)
    .extract({ left: 620, top: 350, width: 450, height: 250 })
    .toFile('../scratch_measure_right.png');

  console.log('Saved measurements');
}

run().catch(console.error);
