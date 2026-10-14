import sharp from 'sharp';

async function prepareLogo({ logoPath, maxW, maxH }) {
  const buf = await sharp(logoPath)
    .resize(maxW, maxH, { fit: 'inside' })
    .png()
    .toBuffer();
  const meta = await sharp(buf).metadata();
  return { buffer: buf, width: meta.width, height: meta.height };
}

async function run() {
  const baseImgPath = 'C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be/feria_magica_del_juguete_background_1791991316029.jpg';
  console.log('Compositing 8 official sponsors onto exact signboard centers...');

  // 1. IMEBU (Casita 1 Upper Signboard - center: 190, 444)
  const imebu = await prepareLogo({
    logoPath: 'public/assets/logos/clean-imebu.png',
    maxW: 135,
    maxH: 64
  });

  // 2. Fundalas (Casita 1 Lower Facade Plaque - center: 160, 665)
  const fundalas = await prepareLogo({
    logoPath: 'public/assets/logos/clean-fundalas.png',
    maxW: 80,
    maxH: 52
  });

  // 3. Practi Arepa (Casita 2 Arched Signboard - center: 490, 422)
  const practi = await prepareLogo({
    logoPath: 'public/assets/logos/clean-practi-arepa.png',
    maxW: 88,
    maxH: 40
  });

  // 4. Ángelus Seguridad (Casita 3 Rectangular Signboard - center: 640, 405)
  const angelus = await prepareLogo({
    logoPath: 'public/assets/logos/clean-angelus.png',
    maxW: 68,
    maxH: 28
  });

  // 5. Factor Humano (Casita 4 Background Signboard - center: 738, 412)
  const factor = await prepareLogo({
    logoPath: 'public/assets/logos/clean-factor-humano.png',
    maxW: 42,
    maxH: 22
  });

  // 6. Dulces Mariposa (Casita 5 Signboard by Tree - center: 992, 458)
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
      input: fundalas.buffer,
      left: Math.round(160 - fundalas.width / 2),
      top: Math.round(665 - fundalas.height / 2)
    },

    // 3. Practi Arepa (Casita 2 Arched Signboard)
    {
      input: practi.buffer,
      left: Math.round(490 - practi.width / 2),
      top: Math.round(485 - practi.height / 2)
    },

    // 4. Ángelus Seguridad (Casita 3 Rectangular Signboard)
    {
      input: angelus.buffer,
      left: Math.round(640 - angelus.width / 2),
      top: Math.round(465 - angelus.height / 2)
    },

    // 5. Factor Humano (Casita 4 Background Signboard)
    {
      input: factor.buffer,
      left: Math.round(738 - factor.width / 2),
      top: Math.round(475 - factor.height / 2)
    },

    // 6. Dulces Mariposa (Casita 5 Signboard by Tree)
    {
      input: mariposa.buffer,
      left: Math.round(992 - mariposa.width / 2),
      top: Math.round(508 - mariposa.height / 2)
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

  // Output as WebP
  await sharp(baseImgPath)
    .composite(compositePlan)
    .webp({ quality: 94 })
    .toFile('../scratch_new_village_exact_final.webp');

  console.log('Saved scratch_new_village_exact_final.webp');
}

run().catch(console.error);
