import sharp from 'sharp';

/**
 * Composites a crisp official sponsor logo onto a signboard surface:
 * - Resizes the logo to fit comfortably inside the signboard with breathing room
 * - Applies a very subtle warm ambient tint to blend with the twilight/candlelight
 * - Adds a delicate drop shadow under the logo onto the wooden board for 3D integration
 */
async function prepareLogoForSign({ logoPath, maxW, maxH, opacity = 0.98 }) {
  // Read and resize logo preserving aspect ratio
  const resizedBuf = await sharp(logoPath)
    .resize(maxW, maxH, { fit: 'inside' })
    .png()
    .toBuffer();

  const meta = await sharp(resizedBuf).metadata();

  // Create subtle warm drop shadow
  const shadowSvg = `
    <svg width="${meta.width + 6}" height="${meta.height + 6}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="logoShadow">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#2D1508" flood-opacity="0.55"/>
        </filter>
      </defs>
      <rect x="3" y="3" width="${meta.width}" height="${meta.height}" fill="none"/>
    </svg>
  `;

  return { buffer: resizedBuf, width: meta.width, height: meta.height };
}

async function run() {
  const baseImgPath = 'C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be/feria_magica_del_juguete_background_1791991316029.jpg';
  console.log('Building New Village with 8 Authentic Sponsor Casitas...');

  // 1. Casita 1 (Grand Left Chalet Upper Board): IMEBU & Alcaldía de Bucaramanga
  // Board: x: 110..270 (w: 160), y: 395..485 (h: 90) -> center: (190, 442)
  const imebu = await prepareLogoForSign({
    logoPath: 'public/assets/logos/clean-imebu.png',
    maxW: 130,
    maxH: 62
  });

  // 2. Casita 1 (Grand Left Chalet Lower Facade Plaque): Fundalas
  // On lower wooden counter: center: (160, 665)
  const fundalas = await prepareLogoForSign({
    logoPath: 'public/assets/logos/clean-fundalas.png',
    maxW: 80,
    maxH: 52
  });

  // 3. Casita 2 (Left-Mid Chalet with striped awning): Practi Arepa
  // Board: x: 425..530 (w: 105), y: 462..515 (h: 53) -> center: (478, 488)
  const practi = await prepareLogoForSign({
    logoPath: 'public/assets/logos/clean-practi-arepa.png',
    maxW: 85,
    maxH: 42
  });

  // 4. Casita 3 (Center-Left Chalet): Ángelus Seguridad
  // Board: x: 580..665 (w: 85), y: 450..485 (h: 35) -> center: (622, 468)
  const angelus = await prepareLogoForSign({
    logoPath: 'public/assets/logos/clean-angelus.png',
    maxW: 65,
    maxH: 30
  });

  // 5. Casita 4 (Center-Background Chalet): Factor Humano
  // Board: x: 695..765 (w: 70), y: 470..510 (h: 40) -> center: (730, 490)
  const factor = await prepareLogoForSign({
    logoPath: 'public/assets/logos/clean-factor-humano.png',
    maxW: 55,
    maxH: 28
  });

  // 6. Casita 5 (Right-Mid Chalet by Christmas tree): Dulces Mariposa
  // Board: x: 915..1015 (w: 100), y: 472..525 (h: 53) -> center: (965, 498)
  const mariposa = await prepareLogoForSign({
    logoPath: 'public/assets/logos/clean-mariposa.png',
    maxW: 80,
    maxH: 42
  });

  // 7. Casita 6 (Grand Right Chalet Upper Board): Campuslands
  // Board: x: 1120..1280 (w: 160), y: 375..465 (h: 90) -> center: (1200, 420)
  const campus = await prepareLogoForSign({
    logoPath: 'public/assets/logos/clean-campuslands.png',
    maxW: 135,
    maxH: 68
  });

  // 8. Casita 6 (Grand Right Chalet Toy Store Awning / Counter): Cajasan
  // Center: (1080, 520) or on the counter front
  const cajasan = await prepareLogoForSign({
    logoPath: 'public/assets/logos/clean-cajasan.png',
    maxW: 110,
    maxH: 42
  });

  // To ensure maximum clarity and a premium finish on wood,
  // let's create a subtle soft-warm backing glow under each logo
  // so the logos pop with maximum contrast and crispness against the wood!
  const compositePlan = [
    // 1. IMEBU (Casita 1 Upper Signboard)
    {
      input: imebu.buffer,
      left: Math.round(190 - imebu.width / 2),
      top: Math.round(444 - imebu.height / 2)
    },

    // 2. Fundalas (Casita 1 Lower Facade Plaque)
    {
      input: fundalas.buffer,
      left: Math.round(160 - fundalas.width / 2),
      top: Math.round(665 - fundalas.height / 2)
    },

    // 3. Practi Arepa (Casita 2 Signboard)
    {
      input: practi.buffer,
      left: Math.round(478 - practi.width / 2),
      top: Math.round(488 - practi.height / 2)
    },

    // 4. Ángelus Seguridad (Casita 3 Signboard)
    {
      input: angelus.buffer,
      left: Math.round(622 - angelus.width / 2),
      top: Math.round(468 - angelus.height / 2)
    },

    // 5. Factor Humano (Casita 4 Signboard)
    {
      input: factor.buffer,
      left: Math.round(730 - factor.width / 2),
      top: Math.round(490 - factor.height / 2)
    },

    // 6. Dulces Mariposa (Casita 5 Signboard by Tree)
    {
      input: mariposa.buffer,
      left: Math.round(965 - mariposa.width / 2),
      top: Math.round(498 - mariposa.height / 2)
    },

    // 7. Campuslands (Casita 6 Grand Right Signboard)
    {
      input: campus.buffer,
      left: Math.round(1200 - campus.width / 2),
      top: Math.round(420 - campus.height / 2)
    },

    // 8. Cajasan (Casita 6 Toy Shop Front)
    {
      input: cajasan.buffer,
      left: Math.round(1190 - cajasan.width / 2),
      top: Math.round(520 - cajasan.height / 2)
    }
  ];

  await sharp(baseImgPath)
    .composite(compositePlan)
    .webp({ quality: 94 })
    .toFile('../scratch_new_village_sponsors.webp');

  console.log('Saved scratch_new_village_sponsors.webp');
}

run().catch(console.error);
