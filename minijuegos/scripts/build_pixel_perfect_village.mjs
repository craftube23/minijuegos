import sharp from 'sharp';

async function prepareLogo({ logoPath, maxW, maxH }) {
  const buf = await sharp(logoPath)
    .resize(maxW, maxH, { fit: 'inside' })
    .png()
    .toBuffer();
  const meta = await sharp(buf).metadata();
  return { buffer: buf, width: meta.width, height: meta.height };
}

async function makeFundalasPlaque() {
  const width = 85;
  const height = 55;
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3A1C0C"/>
          <stop offset="50%" stop-color="#261107"/>
          <stop offset="100%" stop-color="#140803"/>
        </linearGradient>
        <linearGradient id="fGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF59D"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#8D6E18"/>
        </linearGradient>
      </defs>
      <!-- Outer wooden board with carved edge -->
      <rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="6" fill="url(#fWood)" stroke="#0B0401" stroke-width="1.2"/>
      <!-- Inner gold rim -->
      <rect x="3.5" y="3.5" width="${width - 7}" height="${height - 7}" rx="4" fill="none" stroke="url(#fGold)" stroke-width="1"/>
      <!-- Ivory enamel face -->
      <rect x="5" y="5" width="${width - 10}" height="${height - 10}" rx="3" fill="#FFFFFF"/>
      <!-- Top snow cap -->
      <path d="M 2,5 Q ${width * 0.25},2 ${width * 0.5},4 Q ${width * 0.75},2 ${width - 2},5 Q ${width * 0.85},8 ${width * 0.7},6 Q ${width * 0.5},9 ${width * 0.3},6 Q ${width * 0.15},8 2,5 Z" fill="#FFFFFF" opacity="0.96"/>
    </svg>
  `;

  const logoBuf = await sharp('public/assets/logos/clean-fundalas.png')
    .resize(65, 40, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round((height - logoMeta.height) / 2) + 2;

  return await sharp(Buffer.from(svg))
    .composite([{ input: logoBuf, left, top }])
    .png()
    .toBuffer();
}

async function run() {
  const baseImgPath = 'C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be/feria_magica_del_juguete_background_1791991316029.jpg';
  console.log('Building Pixel-Perfect Casitas Village...');

  // 1. IMEBU (Casita 1 Upper Signboard - center: 190, 444)
  const imebu = await prepareLogo({
    logoPath: 'public/assets/logos/clean-imebu.png',
    maxW: 135,
    maxH: 64
  });

  // 2. Fundalas (Casita 1 Lower Facade Plaque - with wood & gold framing)
  const fundalasPlaque = await makeFundalasPlaque();

  // 3. Practi Arepa (Casita 2 Arched Signboard - center: 490, 452)
  const practi = await prepareLogo({
    logoPath: 'public/assets/logos/clean-practi-arepa.png',
    maxW: 88,
    maxH: 40
  });

  // 4. Ángelus Seguridad (Casita 3 Rectangular Signboard - center: 640, 480)
  const angelus = await prepareLogo({
    logoPath: 'public/assets/logos/clean-angelus.png',
    maxW: 68,
    maxH: 28
  });

  // 5. Factor Humano (Casita 4 Background Signboard - center: 738, 490)
  const factor = await prepareLogo({
    logoPath: 'public/assets/logos/clean-factor-humano.png',
    maxW: 42,
    maxH: 22
  });

  // 6. Dulces Mariposa (Casita 5 Signboard by Tree - center: 992, 465)
  const mariposa = await prepareLogo({
    logoPath: 'public/assets/logos/clean-mariposa.png',
    maxW: 90,
    maxH: 45
  });

  // 7. Campuslands (Casita 6 Grand Right Signboard - center: 1200, 420)
  const campus = await prepareLogo({
    logoPath: 'public/assets/logos/clean-campuslands.png',
    maxW: 135,
    maxH: 68
  });

  // 8. Cajasan (Casita 6 Toy Shop Awning - center: 1190, 520)
  const cajasan = await prepareLogo({
    logoPath: 'public/assets/logos/clean-cajasan.png',
    maxW: 115,
    maxH: 40
  });

  const compositePlan = [
    // 1. IMEBU (Casita 1 Upper Signboard)
    {
      input: imebu.buffer,
      left: Math.round(190 - imebu.width / 2),
      top: Math.round(444 - imebu.height / 2)
    },

    // 2. Fundalas (Casita 1 Lower Facade Plaque)
    {
      input: fundalasPlaque,
      left: 118,
      top: 652
    },

    // 3. Practi Arepa (Casita 2 Arched Signboard)
    {
      input: practi.buffer,
      left: Math.round(490 - practi.width / 2),
      top: Math.round(452 - practi.height / 2)
    },

    // 4. Ángelus Seguridad (Casita 3 Rectangular Signboard)
    {
      input: angelus.buffer,
      left: Math.round(640 - angelus.width / 2),
      top: Math.round(480 - angelus.height / 2)
    },

    // 5. Factor Humano (Casita 4 Background Signboard)
    {
      input: factor.buffer,
      left: Math.round(738 - factor.width / 2),
      top: Math.round(490 - factor.height / 2)
    },

    // 6. Dulces Mariposa (Casita 5 Signboard by Tree)
    {
      input: mariposa.buffer,
      left: Math.round(992 - mariposa.width / 2),
      top: Math.round(465 - mariposa.height / 2)
    },

    // 7. Campuslands (Casita 6 Grand Right Signboard)
    {
      input: campus.buffer,
      left: Math.round(1200 - campus.width / 2),
      top: Math.round(420 - campus.height / 2)
    },

    // 8. Cajasan (Casita 6 Toy Shop Awning)
    {
      input: cajasan.buffer,
      left: Math.round(1190 - cajasan.width / 2),
      top: Math.round(520 - cajasan.height / 2)
    }
  ];

  // Output 1: Full res 1376x768 WebP
  await sharp(baseImgPath)
    .composite(compositePlan)
    .webp({ quality: 94 })
    .toFile('../scratch_new_village_perfect.webp');

  // Output 2: Target 1280x714 WebP for fondo-empresas.webp
  await sharp(baseImgPath)
    .composite(compositePlan)
    .resize(1280, 714, { fit: 'cover' })
    .webp({ quality: 94 })
    .toFile('public/assets/images/fondo-empresas.webp');

  console.log('Saved scratch_new_village_perfect.webp & updated public/assets/images/fondo-empresas.webp');
}

run().catch(console.error);
