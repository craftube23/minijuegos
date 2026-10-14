import sharp from 'sharp';

async function main() {
  const src = 'public/assets/images/fondo-empresas.original-vertical.webp';
  const feriaLogo = 'public/assets/logos/clean-feria-magica.png';

  // Let's inspect clean-feria-magica.png with a fine grid to locate the exact "DEL" ribbon and "DONDE VIVE LA MAGIA" ribbon
  const meta = await sharp(feriaLogo).metadata();
  const W = meta.width, H = meta.height;
  let svgLines = '';
  for (let x = 0; x < W; x += 20) {
    const isMajor = x % 100 === 0;
    svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${isMajor ? 'red' : 'rgba(255,255,0,0.4)'}" stroke-width="${isMajor ? 1.5 : 0.7}"/>`;
    if (x % 50 === 0) svgLines += `<text x="${x+2}" y="15" fill="red" font-size="12" font-weight="bold">${x}</text>`;
  }
  for (let y = 0; y < H; y += 20) {
    const isMajor = y % 100 === 0;
    svgLines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${isMajor ? 'cyan' : 'rgba(255,255,0,0.4)'}" stroke-width="${isMajor ? 1.5 : 0.7}"/>`;
    if (y % 50 === 0) svgLines += `<text x="2" y="${y-2}" fill="cyan" font-size="12" font-weight="bold">${y}</text>`;
  }
  await sharp(feriaLogo)
    .composite([{ input: Buffer.from(`<svg width="${W}" height="${H}">${svgLines}</svg>`), left: 0, top: 0 }])
    .png()
    .toFile('scratch/grid_clean_feria.png');
  console.log('Saved scratch/grid_clean_feria.png', W, H);
}
main().catch(console.error);
