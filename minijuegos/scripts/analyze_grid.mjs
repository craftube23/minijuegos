import sharp from 'sharp';

async function run() {
  const lines = [];
  for (let x = 0; x <= 1280; x += 100) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="714" stroke="#FF3333" stroke-width="1" opacity="0.6"/>`);
    lines.push(`<text x="${x + 2}" y="20" fill="#FF3333" font-size="14" font-weight="bold">${x}</text>`);
  }
  for (let y = 0; y <= 714; y += 100) {
    lines.push(`<line x1="0" y1="${y}" x2="1280" y2="${y}" stroke="#00E5FF" stroke-width="1" opacity="0.6"/>`);
    lines.push(`<text x="5" y="${y + 16}" fill="#00E5FF" font-size="14" font-weight="bold">${y}</text>`);
  }

  const svg = `<svg width="1280" height="714" xmlns="http://www.w3.org/2000/svg">${lines.join('')}</svg>`;
  await sharp('public/assets/images/fondo-empresas.backup.webp')
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .toFile('../scratch_grid.png');

  console.log('Saved scratch_grid.png');
}

run().catch(console.error);
