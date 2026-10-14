import sharp from 'sharp';

async function mapExactCabins() {
  const points = [
    // 1. Stall 1 Gable (with green wreath):
    { label: 'Stall 1 Gable', x: 485, y: 355, w: 46, h: 32 },

    // 2. Stall 2 Gable (with green wreath):
    { label: 'Stall 2 Gable', x: 585, y: 385, w: 40, h: 28 },

    // 3. Stall 3 Gable (distant stall):
    { label: 'Stall 3 Gable', x: 655, y: 415, w: 34, h: 24 },

    // 4. Stockings Cabin Gable:
    { label: 'Stockings Gable', x: 795, y: 385, w: 75, h: 50 },

    // 5. Right Cabin Upper Gable (Campuslands):
    { label: 'Campuslands Gable', x: 902, y: 148, w: 346, h: 196, isBox: true },

    // 6. Right Cabin Candy Counter Valance:
    { label: 'Candy Valance', x: 980, y: 440, w: 150, h: 45, isBox: true },

    // 7. Left Cabin Main Facade (IMEBU):
    { label: 'IMEBU', x: 60, y: 550, w: 135, h: 75, isBox: true },

    // 8. Left Cabin Side Facade (Fundalas):
    { label: 'Fundalas', x: 205, y: 550, w: 90, h: 75, isBox: true },
  ];

  const svgBoxes = points.map(p => {
    const rx = p.isBox ? p.x : p.x - Math.round(p.w / 2);
    const ry = p.isBox ? p.y : p.y - Math.round(p.h / 2);
    return `
      <rect x="${rx}" y="${ry}" width="${p.w}" height="${p.h}" fill="rgba(255, 215, 0, 0.4)" stroke="#FF0000" stroke-width="2"/>
      <text x="${rx + 4}" y="${ry + 14}" fill="#FFF" font-size="10" font-weight="bold">${p.label}</text>
    `;
  }).join('');

  const svg = `<svg width="1280" height="714" xmlns="http://www.w3.org/2000/svg">${svgBoxes}</svg>`;

  await sharp('public/assets/images/fondo-empresas.backup.webp')
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .webp({ quality: 90 })
    .toFile('../scratch_perfect_alignment_check.webp');

  console.log('Saved scratch_perfect_alignment_check.webp');
}

mapExactCabins().catch(console.error);
