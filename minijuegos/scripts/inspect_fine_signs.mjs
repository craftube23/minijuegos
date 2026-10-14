import sharp from 'sharp';

const regions = [
  { name: 'fundalas', x: 0, y: 840, w: 210, h: 310 },
  { name: 'feria', x: 200, y: 820, w: 360, h: 350 },
  { name: 'factor', x: 570, y: 920, w: 180, h: 280 },
  { name: 'mariposa', x: 720, y: 1150, w: 180, h: 130 },
  { name: 'cajasan', x: 990, y: 1180, w: 180, h: 90 },
  { name: 'alcaldia_banner', x: 1080, y: 1280, w: 160, h: 250 },
  { name: 'angelus', x: 1230, y: 980, w: 150, h: 270 },
  { name: 'campuslands', x: 1410, y: 960, w: 230, h: 260 },
  { name: 'practi', x: 1640, y: 880, w: 184, h: 320 },
  { name: 'imebu', x: 780, y: 1610, w: 360, h: 230 }
];

async function main() {
  const src = 'public/assets/images/fondo-empresas.original-vertical.webp';
  for (const r of regions) {
    let svgLines = '';
    for (let dx = 0; dx < r.w; dx += 10) {
      const gx = r.x + dx;
      const isMajor = gx % 50 === 0;
      const color = isMajor ? 'rgba(255,0,0,0.8)' : 'rgba(255,255,0,0.35)';
      const sw = isMajor ? 1.5 : 0.7;
      svgLines += `<line x1="${dx}" y1="0" x2="${dx}" y2="${r.h}" stroke="${color}" stroke-width="${sw}"/>`;
      if (gx % 50 === 0) {
        svgLines += `<text x="${dx + 2}" y="14" fill="red" font-size="11" font-weight="bold" stroke="white" stroke-width="0.4">${gx}</text>`;
        svgLines += `<text x="${dx + 2}" y="${r.h - 4}" fill="red" font-size="11" font-weight="bold" stroke="white" stroke-width="0.4">${gx}</text>`;
      }
    }
    for (let dy = 0; dy < r.h; dy += 10) {
      const gy = r.y + dy;
      const isMajor = gy % 50 === 0;
      const color = isMajor ? 'rgba(0,255,255,0.8)' : 'rgba(255,255,0,0.35)';
      const sw = isMajor ? 1.5 : 0.7;
      svgLines += `<line x1="0" y1="${dy}" x2="${r.w}" y2="${dy}" stroke="${color}" stroke-width="${sw}"/>`;
      if (gy % 50 === 0) {
        svgLines += `<text x="2" y="${dy - 2}" fill="cyan" font-size="11" font-weight="bold" stroke="black" stroke-width="0.4">${gy}</text>`;
      }
    }
    const svg = `<svg width="${r.w}" height="${r.h}">${svgLines}</svg>`;
    const buf = await sharp(src).extract({ left: r.x, top: r.y, width: r.w, height: r.h }).toBuffer();
    await sharp(buf)
      .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
      .png()
      .toFile(`scratch/fine_${r.name}.png`);
  }
  console.log('Generated all 10 fine grid crops.');
}
main().catch(console.error);
