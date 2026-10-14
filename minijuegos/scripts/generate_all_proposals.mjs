import sharp from 'sharp';
import fs from 'fs';

// Helper to create a stylized holiday plaque with wooden frame, gold trim, rivets and snow
let plaqueCounter = 0;
async function makePlaque({ logoPath, width, height, isWood = false, snow = true, cornerRadius = 10, borderColor = '#D4AF37' }) {
  const pId = ++plaqueCounter;
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad_${pId}" x1="0" y1="0" x2="0" y2="1">
          ${isWood 
            ? '<stop offset="0%" stop-color="#4A2511"/><stop offset="50%" stop-color="#38190B"/><stop offset="100%" stop-color="#240E06"/>'
            : '<stop offset="0%" stop-color="#FFFFFF"/><stop offset="60%" stop-color="#FAF5E8"/><stop offset="100%" stop-color="#F2E4C4"/>'
          }
        </linearGradient>
        <linearGradient id="goldBorder_${pId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF385"/>
          <stop offset="50%" stop-color="${borderColor}"/>
          <stop offset="100%" stop-color="#996515"/>
        </linearGradient>
      </defs>

      <!-- Drop shadow & outer dark wood rim -->
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="${cornerRadius}" fill="#1A0D06" stroke="#0D0502" stroke-width="2"/>
      
      <!-- Inner gold rim & face -->
      <rect x="4.5" y="4.5" width="${width - 9}" height="${height - 9}" rx="${Math.max(4, cornerRadius - 2)}" fill="url(#bgGrad_${pId})" stroke="url(#goldBorder_${pId})" stroke-width="2"/>

      <!-- Corner rivets -->
      <circle cx="7" cy="7" r="1.8" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>
      <circle cx="${width - 7}" cy="7" r="1.8" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>
      <circle cx="7" cy="${height - 7}" r="1.8" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>
      <circle cx="${width - 7}" cy="${height - 7}" r="1.8" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>

      <!-- Snow cap on top -->
      ${snow ? `
      <path d="M 3,5 Q ${width * 0.25},1 ${width * 0.5},4 Q ${width * 0.75},1 ${width - 3},5 Q ${width * 0.85},8 ${width * 0.7},6.5 Q ${width * 0.5},9 ${width * 0.3},6 Q ${width * 0.15},8 3,5 Z" fill="#FFFFFF" opacity="0.95"/>
      <path d="M 5,5 Q ${width * 0.5},6.5 ${width - 5},5" stroke="#CBE4FF" stroke-width="0.7" fill="none" opacity="0.75"/>
      ` : ''}
    </svg>
  `;

  const frameBuffer = Buffer.from(svg);
  const padX = Math.max(5, Math.round(width * 0.1));
  const padY = Math.max(4, Math.round(height * 0.12));
  const maxW = width - (padX * 2);
  const maxH = height - (padY * 2);

  const logoBuf = await sharp(logoPath)
    .resize(maxW, maxH, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round((height - logoMeta.height) / 2) + (snow ? 1 : 0);

  return await sharp(frameBuffer)
    .composite([{ input: logoBuf, left, top }])
    .png()
    .toBuffer();
}

// Helper to create a grand wooden holiday marquee containing multiple logos
async function makeGrandMarquee({ title, plaques, width, height }) {
  // SVG background for a majestic wooden pavilion board
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="boardWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3A1C0E"/>
          <stop offset="40%" stop-color="#281208"/>
          <stop offset="100%" stop-color="#190A04"/>
        </linearGradient>
        <linearGradient id="headerGold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#FFF385"/>
          <stop offset="50%" stop-color="#FFD700"/>
          <stop offset="100%" stop-color="#E5A910"/>
        </linearGradient>
        <filter id="shadowMarquee">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.7"/>
        </filter>
      </defs>

      <!-- Frame shadow & wooden backing -->
      <rect x="3" y="3" width="${width - 6}" height="${height - 6}" rx="14" fill="url(#boardWood)" stroke="#0E0502" stroke-width="3" filter="url(#shadowMarquee)"/>
      <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="11" fill="none" stroke="#D4AF37" stroke-width="1.8" opacity="0.85"/>

      <!-- Header ribbon/plate -->
      <rect x="18" y="10" width="${width - 36}" height="24" rx="6" fill="#6A0C1A" stroke="#FFD700" stroke-width="1.2"/>
      <text x="${width / 2}" y="26" font-family="'Titan One', 'Fredoka', 'Arial Black', sans-serif" font-size="11" font-weight="900" fill="#FFF9C4" text-anchor="middle" letter-spacing="1.2">${title}</text>

      <!-- Snow on the top roof of the board -->
      <path d="M 6,8 Q ${width * 0.25},1 ${width * 0.5},6 Q ${width * 0.75},1 ${width - 6},8 Q ${width * 0.85},13 ${width * 0.7},10 Q ${width * 0.5},14 ${width * 0.3},9 Q ${width * 0.15},13 6,8 Z" fill="#FFFFFF" opacity="0.95"/>
    </svg>
  `;

  let base = sharp(Buffer.from(svg));
  return await base.composite(plaques).png().toBuffer();
}

async function buildAll() {
  console.log('Generating sponsor plaques...');

  // Individual plaques for Proposal B (Village Stalls & Facades)
  const pImebu = await makePlaque({ logoPath: 'public/assets/logos/clean-imebu.png', width: 140, height: 68 });
  const pCajasan = await makePlaque({ logoPath: 'public/assets/logos/clean-cajasan.png', width: 130, height: 68 });
  const pCampus = await makePlaque({ logoPath: 'public/assets/logos/clean-campuslands.png', width: 130, height: 68 });
  const pPracti = await makePlaque({ logoPath: 'public/assets/logos/clean-practi-arepa.png', width: 110, height: 68 });
  const pMariposa = await makePlaque({ logoPath: 'public/assets/logos/clean-mariposa.png', width: 120, height: 65 });
  const pAngelus = await makePlaque({ logoPath: 'public/assets/logos/clean-angelus.png', width: 95, height: 68 });
  const pFactor = await makePlaque({ logoPath: 'public/assets/logos/clean-factor-humano.png', width: 95, height: 68 });
  const pFundalas = await makePlaque({ logoPath: 'public/assets/logos/clean-fundalas.png', width: 90, height: 68 });

  // -------------------------------------------------------------
  // PROPOSAL B: "Aldea Navideña de Patrocinadores"
  // Distributed naturally onto the cabin gables and facades
  // -------------------------------------------------------------
  console.log('Building Proposal B (Aldea Navideña)...');
  const propB = await sharp('public/assets/images/fondo-empresas.webp')
    .composite([
      // Right Cabin Upper: Twin plaques Campuslands + Cajasan (covering old sign completely)
      { input: pCampus, left: 875, top: 170 },
      { input: pCajasan, left: 875, top: 250 },

      // Left Cabin Facade (y: 520..590 - safely above carousel):
      { input: pImebu, left: 65, top: 525 },
      { input: pFundalas, left: 220, top: 525 },

      // Right Cabin Facade (y: 520..590):
      { input: pPracti, left: 785, top: 525 },
      { input: pMariposa, left: 910, top: 527 },

      // Middle Village Stalls (hanging shop signs):
      { input: pAngelus, left: 362, top: 400 },
      { input: pFactor, left: 638, top: 395 },
    ])
    .webp({ quality: 90 })
    .toFile('../scratch_propuesta_B_aldea.webp');

  // -------------------------------------------------------------
  // PROPOSAL A: "Pabellón de Patrocinadores" (Grand 8-Sponsor Marquee on Right Cabin)
  // Perfectly covers the old sign (x: 850..1070, y: 145..365)
  // -------------------------------------------------------------
  console.log('Building Proposal A (Grand Sponsor Marquee on Right Cabin)...');
  const mCampus = await makePlaque({ logoPath: 'public/assets/logos/clean-campuslands.png', width: 92, height: 40, snow: false, cornerRadius: 6 });
  const mCajasan = await makePlaque({ logoPath: 'public/assets/logos/clean-cajasan.png', width: 92, height: 40, snow: false, cornerRadius: 6 });
  const mImebu = await makePlaque({ logoPath: 'public/assets/logos/clean-imebu.png', width: 92, height: 40, snow: false, cornerRadius: 6 });
  const mPracti = await makePlaque({ logoPath: 'public/assets/logos/clean-practi-arepa.png', width: 92, height: 40, snow: false, cornerRadius: 6 });
  const mMariposa = await makePlaque({ logoPath: 'public/assets/logos/clean-mariposa.png', width: 92, height: 40, snow: false, cornerRadius: 6 });
  const mAngelus = await makePlaque({ logoPath: 'public/assets/logos/clean-angelus.png', width: 92, height: 40, snow: false, cornerRadius: 6 });
  const mFactor = await makePlaque({ logoPath: 'public/assets/logos/clean-factor-humano.png', width: 92, height: 40, snow: false, cornerRadius: 6 });
  const mFundalas = await makePlaque({ logoPath: 'public/assets/logos/clean-fundalas.png', width: 92, height: 40, snow: false, cornerRadius: 6 });

  const marqueeWidth = 216;
  const marqueeHeight = 222;
  const marqueeBuffer = await makeGrandMarquee({
    title: 'PATROCINADORES OFICIALES',
    plaques: [
      { input: mImebu, left: 12, top: 40 },
      { input: mCajasan, left: 110, top: 40 },
      { input: mCampus, left: 12, top: 85 },
      { input: mPracti, left: 110, top: 85 },
      { input: mMariposa, left: 12, top: 130 },
      { input: mAngelus, left: 110, top: 130 },
      { input: mFactor, left: 12, top: 175 },
      { input: mFundalas, left: 110, top: 175 },
    ],
    width: marqueeWidth,
    height: marqueeHeight
  });

  const propA = await sharp('public/assets/images/fondo-empresas.webp')
    .composite([
      // Grand marquee replacing the old sign on the right cabin:
      { input: marqueeBuffer, left: 855, top: 145 },
    ])
    .webp({ quality: 90 })
    .toFile('../scratch_propuesta_A_marquesina.webp');

  // -------------------------------------------------------------
  // PROPOSAL C: "Pabellones Gemelos & Marquesina" (Grand Marquee + Left Civic Board)
  // Combines the Grand Marquee with individual decorative plaques
  // -------------------------------------------------------------
  console.log('Building Proposal C (Combined Masterpiece)...');
  const propC = await sharp('public/assets/images/fondo-empresas.webp')
    .composite([
      // Right Cabin: Grand Marquee of all 8 sponsors:
      { input: marqueeBuffer, left: 855, top: 145 },

      // Left Cabin lower facade: Alcaldía / IMEBU & Fundalas (Civic Patron Honors):
      { input: pImebu, left: 70, top: 525 },
      { input: pFundalas, left: 225, top: 525 },

      // Right Cabin lower facade: Practi Arepa & Dulces Mariposa:
      { input: pPracti, left: 785, top: 525 },
      { input: pMariposa, left: 910, top: 527 },
    ])
    .webp({ quality: 90 })
    .toFile('../scratch_propuesta_C_combinada.webp');

  console.log('All 3 proposals built successfully!');
}

buildAll().catch(console.error);
