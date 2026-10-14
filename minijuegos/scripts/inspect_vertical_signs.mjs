import sharp from 'sharp';

async function main() {
  const src = 'public/assets/images/fondo-empresas.original-vertical.webp';
  const W = 1824, H = 1150, Y0 = 750;
  let svgLines = '';
  for (let x = 0; x < W; x += 50) {
    const color = x % 200 === 0 ? 'rgba(255,0,0,0.85)' : 'rgba(255,255,0,0.45)';
    const sw = x % 200 === 0 ? 2 : 1;
    svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${color}" stroke-width="${sw}"/>`;
    if (x % 100 === 0) {
      for (let y = 50; y <= H - 50; y += 250) {
        svgLines += `<text x="${x + 3}" y="${y}" fill="red" font-size="16" font-weight="bold" stroke="white" stroke-width="0.5">${x}</text>`;
      }
    }
  }
  for (let y = 0; y < H; y += 50) {
    const origY = y + Y0;
    const color = origY % 200 === 0 ? 'rgba(0,255,255,0.85)' : 'rgba(255,255,0,0.45)';
    const sw = origY % 200 === 0 ? 2 : 1;
    svgLines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${color}" stroke-width="${sw}"/>`;
    if (origY % 100 === 0) {
      for (let x = 20; x <= 1750; x += 350) {
        svgLines += `<text x="${x}" y="${y - 4}" fill="cyan" font-size="16" font-weight="bold" stroke="black" stroke-width="0.5">${origY}</text>`;
      }
    }
  }
  const svg = `<svg width="${W}" height="${H}">${svgLines}</svg>`;
  const croppedBuf = await sharp(src)
    .extract({ left: 0, top: Y0, width: W, height: H })
    .toBuffer();

  await sharp(croppedBuf)
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toFile('scratch/grid_overview.png');
  console.log('Saved scratch/grid_overview.png');
}
main().catch(console.error);
