import sharp from 'sharp';
import fs from 'fs';

let idCount = 0;
async function makeIvoryPlaque({ logoPath, width, height, snow = true, cornerRadius = 8 }) {
  const pId = ++idCount;
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ivoryBg_${pId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="60%" stop-color="#FAF5E8"/>
          <stop offset="100%" stop-color="#F2E4C4"/>
        </linearGradient>
        <linearGradient id="goldRim_${pId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF385"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#996515"/>
        </linearGradient>
      </defs>

      <!-- Outer dark wood bevel -->
      <rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="${cornerRadius}" fill="#1A0D06" stroke="#0D0502" stroke-width="1.5"/>
      
      <!-- Inner gold rim & ivory face -->
      <rect x="3.5" y="3.5" width="${width - 7}" height="${height - 7}" rx="${Math.max(3, cornerRadius - 2)}" fill="url(#ivoryBg_${pId})" stroke="url(#goldRim_${pId})" stroke-width="1.8"/>

      <!-- Corner gold rivets -->
      <circle cx="6" cy="6" r="1.5" fill="#FFD700" stroke="#713F12" stroke-width="0.4"/>
      <circle cx="${width - 6}" cy="6" r="1.5" fill="#FFD700" stroke="#713F12" stroke-width="0.4"/>
      <circle cx="6" cy="${height - 6}" r="1.5" fill="#FFD700" stroke="#713F12" stroke-width="0.4"/>
      <circle cx="${width - 6}" cy="${height - 6}" r="1.5" fill="#FFD700" stroke="#713F12" stroke-width="0.4"/>

      <!-- Delicate snow cap -->
      ${snow ? `
      <path d="M 2.5,4.5 Q ${width * 0.25},1 ${width * 0.5},3.5 Q ${width * 0.75},1 ${width - 2.5},4.5 Q ${width * 0.85},7 ${width * 0.7},5.5 Q ${width * 0.5},8 ${width * 0.3},5 Q ${width * 0.15},7 2.5,4.5 Z" fill="#FFFFFF" opacity="0.95"/>
      <path d="M 4,4.5 Q ${width * 0.5},5.5 ${width - 4},4.5" stroke="#CBE4FF" stroke-width="0.6" fill="none" opacity="0.75"/>
      ` : ''}
    </svg>
  `;

  const padX = Math.max(5, Math.round(width * 0.08));
  const padY = Math.max(4, Math.round(height * 0.1));
  const maxW = width - (padX * 2);
  const maxH = height - (padY * 2);

  const logoBuf = await sharp(logoPath)
    .resize(maxW, maxH, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round((height - logoMeta.height) / 2) + (snow ? 1 : 0);

  return await sharp(Buffer.from(svg))
    .composite([{ input: logoBuf, left, top }])
    .png()
    .toBuffer();
}

async function makeGrand8Marquee({ width = 346, height = 196 }) {
  const mId = ++idCount;
  // SVG background for the grand marquee covering x: 902..1248, y: 148..344
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="marqueeWood_${mId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3D1E0E"/>
          <stop offset="35%" stop-color="#2A1408"/>
          <stop offset="100%" stop-color="#180A04"/>
        </linearGradient>
        <linearGradient id="goldTrim_${mId}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FFF385"/>
          <stop offset="50%" stop-color="#FFD700"/>
          <stop offset="100%" stop-color="#E5A910"/>
        </linearGradient>
        <filter id="marqueeGlow_${mId}">
          <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.75"/>
        </filter>
      </defs>

      <!-- Outer wooden board with shadow -->
      <rect x="3" y="3" width="${width - 6}" height="${height - 6}" rx="12" fill="url(#marqueeWood_${mId})" stroke="#0E0502" stroke-width="2.5" filter="url(#marqueeGlow_${mId})"/>
      
      <!-- Inner decorative gold outline -->
      <rect x="6.5" y="6.5" width="${width - 13}" height="${height - 13}" rx="9" fill="none" stroke="url(#goldTrim_${mId})" stroke-width="1.8" opacity="0.9"/>

      <!-- Festive header badge -->
      <rect x="24" y="9" width="${width - 48}" height="22" rx="6" fill="#781122" stroke="#FFD700" stroke-width="1.2"/>
      <circle cx="34" cy="20" r="2.5" fill="#FFD700"/>
      <circle cx="${width - 34}" cy="20" r="2.5" fill="#FFD700"/>
      
      <text x="${width / 2}" y="24" font-family="'Titan One', 'Fredoka', 'Arial Black', sans-serif" font-size="10" font-weight="900" fill="#FFF9C4" text-anchor="middle" letter-spacing="1.5">PATROCINADORES OFICIALES</text>

      <!-- Snow resting along the entire top of the marquee -->
      <path d="M 4,6 Q ${width * 0.15},1 ${width * 0.3},4.5 Q ${width * 0.45},1 ${width * 0.6},5 Q ${width * 0.8},1 ${width - 4},6 Q ${width * 0.9},10 ${width * 0.75},8 Q ${width * 0.6},11 ${width * 0.45},7 Q ${width * 0.3},11 ${width * 0.15},7 Q 8,10 4,6 Z" fill="#FFFFFF" opacity="0.95"/>
      <path d="M 6,5.5 Q ${width * 0.5},7.5 ${width - 6},5.5" stroke="#CBE4FF" stroke-width="0.8" fill="none" opacity="0.7"/>

      <!-- Small Christmas garland lights along bottom of header -->
      <circle cx="48" cy="33" r="2" fill="#FF5252" opacity="0.9"/>
      <circle cx="88" cy="33" r="2" fill="#FFEB3B" opacity="0.9"/>
      <circle cx="128" cy="33" r="2" fill="#4CAF50" opacity="0.9"/>
      <circle cx="168" cy="33" r="2" fill="#FF5252" opacity="0.9"/>
      <circle cx="208" cy="33" r="2" fill="#FFEB3B" opacity="0.9"/>
      <circle cx="248" cy="33" r="2" fill="#4CAF50" opacity="0.9"/>
      <circle cx="288" cy="33" r="2" fill="#FF5252" opacity="0.9"/>
    </svg>
  `;

  // We have 8 sponsors. Let's arrange them in a 4 columns x 2 rows grid:
  // Available width inside: ~324px -> 4 columns: ~76px each + 5px gap
  // Available height inside: y: 38 to 188 = 150px -> 2 rows: ~70px each + 6px gap
  const pW = 76;
  const pH = 68;

  const [pImebu, pCajasan, pCampus, pPracti, pMariposa, pAngelus, pFactor, pFundalas] = await Promise.all([
    makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-imebu.png', width: pW, height: pH, snow: true }),
    makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-cajasan.png', width: pW, height: pH, snow: true }),
    makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-campuslands.png', width: pW, height: pH, snow: true }),
    makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-practi-arepa.png', width: pW, height: pH, snow: true }),
    makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-mariposa.png', width: pW, height: pH, snow: true }),
    makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-angelus.png', width: pW, height: pH, snow: true }),
    makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-factor-humano.png', width: pW, height: pH, snow: true }),
    makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-fundalas.png', width: pW, height: pH, snow: true }),
  ]);

  // Coordinates:
  // Col 0: x: 12
  // Col 1: x: 92
  // Col 2: x: 172
  // Col 3: x: 252
  // Row 0: y: 40
  // Row 1: y: 114

  const compositeItems = [
    { input: pImebu, left: 12, top: 40 },
    { input: pCajasan, left: 93, top: 40 },
    { input: pCampus, left: 174, top: 40 },
    { input: pPracti, left: 255, top: 40 },

    { input: pMariposa, left: 12, top: 115 },
    { input: pAngelus, left: 93, top: 115 },
    { input: pFactor, left: 174, top: 115 },
    { input: pFundalas, left: 255, top: 115 },
  ];

  return await sharp(Buffer.from(svg))
    .composite(compositeItems)
    .png()
    .toBuffer();
}

async function run() {
  console.log('Generating Grand 8-Sponsor Marquee for Right Cabin...');
  const marquee = await makeGrand8Marquee({ width: 348, height: 196 });

  // Option 1: Clean Grand Marquee on the Right Cabin
  // Completely covers x: 902..1248, y: 148..344
  const op1 = await sharp('public/assets/images/fondo-empresas.webp')
    .composite([
      { input: marquee, left: 901, top: 148 }
    ])
    .webp({ quality: 92 })
    .toFile('../scratch_opcion_1_marquesina_completa.webp');

  console.log('Saved scratch_opcion_1_marquesina_completa.webp');

  // Option 2: Grand Marquee on Right Cabin + Left Cabin Civic Plaque
  const pImebuLarge = await makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-imebu.png', width: 155, height: 75, snow: true });
  const pFundalasLarge = await makeIvoryPlaque({ logoPath: 'public/assets/logos/clean-fundalas.png', width: 95, height: 75, snow: true });

  const op2 = await sharp('public/assets/images/fondo-empresas.webp')
    .composite([
      { input: marquee, left: 901, top: 148 },
      { input: pImebuLarge, left: 65, top: 520 },
      { input: pFundalasLarge, left: 228, top: 520 },
    ])
    .webp({ quality: 92 })
    .toFile('../scratch_opcion_2_marquesina_y_fachada.webp');

  console.log('Saved scratch_opcion_2_marquesina_y_fachada.webp');
}

run().catch(console.error);
