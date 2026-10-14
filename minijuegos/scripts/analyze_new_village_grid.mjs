import sharp from 'sharp';

async function run() {
  const imgPath = 'C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be/feria_magica_del_juguete_background_1791991316029.jpg';
  
  const lines = [];
  for (let x = 0; x <= 1376; x += 50) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="768" stroke="#FF0000" stroke-width="1" opacity="0.6"/>`);
    lines.push(`<text x="${x + 2}" y="15" fill="#FF0000" font-size="11" font-weight="bold">${x}</text>`);
  }
  for (let y = 0; y <= 768; y += 50) {
    lines.push(`<line x1="0" y1="${y}" x2="1376" y2="${y}" stroke="#00FFFF" stroke-width="1" opacity="0.6"/>`);
    lines.push(`<text x="5" y="${y + 12}" fill="#00FFFF" font-size="11" font-weight="bold">${y}</text>`);
  }

  const svg = `<svg width="1376" height="768" xmlns="http://www.w3.org/2000/svg">${lines.join('')}</svg>`;
  
  await sharp(imgPath)
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .toFile('../scratch_new_village_grid.png');

  console.log('Saved scratch_new_village_grid.png');
}

run().catch(console.error);
