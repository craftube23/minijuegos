import sharp from 'sharp';

async function measure() {
  const imgPath = 'C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be/feria_magica_del_juguete_background_1791991316029.jpg';

  // Let's test exact inner bounding boxes:
  const boxes = [
    // 1. Left Chalet Grand Signboard
    { id: 1, name: 'Left Chalet', left: 110, top: 405, width: 115, height: 75 },

    // 2. Stall 2 (Left-Mid)
    { id: 2, name: 'Stall 2', left: 318, top: 452, width: 64, height: 44 },

    // 3. Stall 3 (Center-Left)
    { id: 3, name: 'Stall 3', left: 428, top: 472, width: 44, height: 32 },

    // 4. Stall 4 (Center)
    { id: 4, name: 'Stall 4', left: 512, top: 480, width: 40, height: 28 },

    // 5. Stall 5 (Center-Right near tree)
    { id: 5, name: 'Stall 5', left: 692, top: 494, width: 48, height: 34 },

    // 6. Stall 6 (Right-Mid Chalet)
    { id: 6, name: 'Stall 6', left: 946, top: 460, width: 95, height: 50 },

    // 7. Right Chalet Grand Signboard
    { id: 7, name: 'Right Chalet', left: 1130, top: 380, width: 135, height: 78 },
  ];

  // Draw red borders around these candidate boxes
  const svg = `<svg width="1376" height="768" xmlns="http://www.w3.org/2000/svg">
    ${boxes.map(b => `
      <rect x="${b.left}" y="${b.top}" width="${b.width}" height="${b.height}" fill="rgba(0, 255, 0, 0.3)" stroke="#FF0000" stroke-width="2"/>
      <text x="${b.left + 2}" y="${b.top + 12}" fill="#FFF" font-size="10" font-weight="bold">${b.id}. ${b.name}</text>
    `).join('')}
  </svg>`;

  await sharp(imgPath)
    .composite([{ input: Buffer.from(svg), left: 0, top: 0 }])
    .webp({ quality: 90 })
    .toFile('../scratch_test_signboards_fit.webp');

  console.log('Saved scratch_test_signboards_fit.webp');
}

measure().catch(console.error);
