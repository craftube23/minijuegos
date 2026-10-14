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
  console.log('Testing adjusted coordinates for signboards...');

  // 1. IMEBU (Left Grand Chalet Board):
  const imebu = await prepareLogo({
    logoPath: 'public/assets/logos/clean-imebu.png',
    maxW: 135,
    maxH: 64
  });

  // 2. Practi Arepa (Chalet 2 Arched Board):
  // Let's place it inside the arched board at x: 348, y: 442
  const practi = await prepareLogo({
    logoPath: 'public/assets/logos/clean-practi-arepa.png',
    maxW: 82,
    maxH: 42
  });

  // 3. Ángelus Seguridad (Chalet 3 Board):
  // Inside board at x: 605, y: 442
  const angelus = await prepareLogo({
    logoPath: 'public/assets/logos/clean-angelus.png',
    maxW: 60,
    maxH: 32
  });

  // 4. Factor Humano (Chalet 4 Board):
  // Inside board at x: 730, y: 452
  const factor = await prepareLogo({
    logoPath: 'public/assets/logos/clean-factor-humano.png',
    maxW: 52,
    maxH: 26
  });

  // 5. Dulces Mariposa (Chalet 5 Board by Tree):
  // Inside board at x: 965, y: 442
  const mariposa = await prepareLogo({
    logoPath: 'public/assets/logos/clean-mariposa.png',
    maxW: 82,
    maxH: 42
  });

  // 6. Campuslands (Right Grand Chalet Board):
  const campus = await prepareLogo({
    logoPath: 'public/assets/logos/clean-campuslands.png',
    maxW: 135,
    maxH: 68
  });

  // 7. Cajasan (Right Grand Chalet Shop Awning / Counter):
  const cajasan = await prepareLogo({
    logoPath: 'public/assets/logos/clean-cajasan.png',
    maxW: 115,
    maxH: 42
  });

  // 8. Fundalas (Left Grand Chalet Counter or Background Chalet):
  const fundalas = await prepareLogo({
    logoPath: 'public/assets/logos/clean-fundalas.png',
    maxW: 75,
    maxH: 48
  });

  const compositePlan = [
    // 1. IMEBU (Casita 1 Upper Signboard)
    {
      input: imebu.buffer,
      left: Math.round(190 - imebu.width / 2),
      top: Math.round(444 - imebu.height / 2)
    },

    // 2. Practi Arepa (Casita 2 Arched Signboard)
    {
      input: practi.buffer,
      left: Math.round(348 - practi.width / 2),
      top: Math.round(442 - practi.height / 2)
    },

    // 3. Ángelus Seguridad (Casita 3 Signboard)
    {
      input: angelus.buffer,
      left: Math.round(605 - angelus.width / 2),
      top: Math.round(442 - angelus.height / 2)
    },

    // 4. Factor Humano (Casita 4 Signboard)
    {
      input: factor.buffer,
      left: Math.round(730 - factor.width / 2),
      top: Math.round(452 - factor.height / 2)
    },

    // 5. Dulces Mariposa (Casita 5 Signboard by Tree)
    {
      input: mariposa.buffer,
      left: Math.round(965 - mariposa.width / 2),
      top: Math.round(442 - mariposa.height / 2)
    },

    // 6. Campuslands (Casita 6 Grand Right Signboard)
    {
      input: campus.buffer,
      left: Math.round(1200 - campus.width / 2),
      top: Math.round(420 - campus.height / 2)
    },

    // 7. Cajasan (Casita 6 Toy Shop Awning)
    {
      input: cajasan.buffer,
      left: Math.round(1190 - cajasan.width / 2),
      top: Math.round(520 - cajasan.height / 2)
    },

    // 8. Fundalas (Casita 1 Front Counter Plaque)
    {
      input: fundalas.buffer,
      left: Math.round(160 - fundalas.width / 2),
      top: Math.round(665 - fundalas.height / 2)
    }
  ];

  await sharp(baseImgPath)
    .composite(compositePlan)
    .webp({ quality: 94 })
    .toFile('../scratch_perfect_casitas_aligned.webp');

  console.log('Saved scratch_perfect_casitas_aligned.webp');
}

run().catch(console.error);
