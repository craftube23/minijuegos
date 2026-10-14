import sharp from 'sharp';
import fs from 'fs';

// Helper to create a stylized holiday plaque with wooden frame, gold trim, rivets and snow
async function makeHolidayPlaque({ logoPath, width, height, isWood = false, snowAmount = 'medium' }) {
  const svgFrame = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad_${width}_${height}" x1="0" y1="0" x2="0" y2="1">
          ${isWood 
            ? '<stop offset="0%" stop-color="#4A2511"/><stop offset="50%" stop-color="#38190B"/><stop offset="100%" stop-color="#240E06"/>'
            : '<stop offset="0%" stop-color="#FFFFFF"/><stop offset="60%" stop-color="#FAF5E8"/><stop offset="100%" stop-color="#F2E4C4"/>'
          }
        </linearGradient>
        <linearGradient id="goldBorder_${width}_${height}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF385"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#996515"/>
        </linearGradient>
        <filter id="plaqueGlow_${width}_${height}">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>

      <!-- Drop shadow & outer dark wood rim -->
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="${Math.round(height * 0.12)}" fill="#1E0E06" stroke="#0D0502" stroke-width="2" filter="url(#plaqueGlow_${width}_${height})"/>
      
      <!-- Inner gold rim & face -->
      <rect x="4.5" y="4.5" width="${width - 9}" height="${height - 9}" rx="${Math.round(height * 0.09)}" fill="url(#bgGrad_${width}_${height})" stroke="url(#goldBorder_${width}_${height})" stroke-width="2"/>

      <!-- Corner rivets -->
      <circle cx="8" cy="8" r="2" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>
      <circle cx="${width - 8}" cy="8" r="2" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>
      <circle cx="8" cy="${height - 8}" r="2" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>
      <circle cx="${width - 8}" cy="${height - 8}" r="2" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>

      <!-- Snow cap on top -->
      <path d="M 3,6 Q ${width * 0.25},1 ${width * 0.5},4.5 Q ${width * 0.75},1 ${width - 3},6 Q ${width * 0.85},9 ${width * 0.7},7.5 Q ${width * 0.5},10 ${width * 0.3},7 Q ${width * 0.15},9 3,6 Z" fill="#FFFFFF" opacity="0.95"/>
      <path d="M 5,6 Q ${width * 0.5},7.5 ${width - 5},6" stroke="#CBE4FF" stroke-width="0.8" fill="none" opacity="0.75"/>
    </svg>
  `;

  const frameBuffer = Buffer.from(svgFrame);
  
  const padX = Math.max(6, Math.round(width * 0.1));
  const padY = Math.max(4, Math.round(height * 0.12));
  const maxW = width - (padX * 2);
  const maxH = height - (padY * 2);

  const logoBuf = await sharp(logoPath)
    .resize(maxW, maxH, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round((height - logoMeta.height) / 2) + 1;

  return await sharp(frameBuffer)
    .composite([{ input: logoBuf, left, top }])
    .png()
    .toBuffer();
}

async function compositeAllSponsors() {
  const baseImg = sharp('public/assets/images/fondo-empresas.webp');

  // Let's create high-quality plaques for each sponsor:
  // 1. Right upper main sign: Campuslands & Cajasan (or replace the white sign with an integrated twin marquee)
  // Let's make a grand upper sign on the right cabin: (width: 200, height: 160)
  // Or:
  // Let's create plaques:
  // - Campuslands: 110 x 68
  // - Cajasan: 110 x 68
  // - IMEBU / Alcaldia: 130 x 65
  // - Practi Arepa: 110 x 65
  // - Dulces Mariposa: 115 x 65
  // - Angelus Seguridad: 95 x 65
  // - Factor Humano: 95 x 65
  // - Fundalas: 95 x 65

  const pCampus = await makeHolidayPlaque({ logoPath: 'public/assets/logos/clean-campuslands.png', width: 140, height: 80 });
  const pCajasan = await makeHolidayPlaque({ logoPath: 'public/assets/logos/clean-cajasan.png', width: 140, height: 80 });
  const pImebu = await makeHolidayPlaque({ logoPath: 'public/assets/logos/clean-imebu.png', width: 155, height: 75 });
  const pPracti = await makeHolidayPlaque({ logoPath: 'public/assets/logos/clean-practi-arepa.png', width: 110, height: 75 });
  const pMariposa = await makeHolidayPlaque({ logoPath: 'public/assets/logos/clean-mariposa.png', width: 130, height: 70 });
  const pAngelus = await makeHolidayPlaque({ logoPath: 'public/assets/logos/clean-angelus.png', width: 95, height: 75 });
  const pFactor = await makeHolidayPlaque({ logoPath: 'public/assets/logos/clean-factor-humano.png', width: 100, height: 75 });
  const pFundalas = await makeHolidayPlaque({ logoPath: 'public/assets/logos/clean-fundalas.png', width: 95, height: 75 });

  // Let's test a composite:
  // Right cabin upper:
  // Coordinates of the white sign on right cabin: x: 865..1045, y: 155..330.
  // We can place Campuslands & Cajasan nicely side-by-side or stacked on that gable!
  // Right cabin lower wooden counter: (x: 785..1040, y: 565..675)
  // Left cabin lower wooden counter: (x: 65..300, y: 550..670)
  // Middle stalls: x: 360, y: 405 (middle stall 1), x: 640, y: 405 (middle stall 3)

  const composites = [
    // Right cabin gable (replacing / upgrading the existing sign):
    { input: pCampus, left: 865, top: 160 },
    { input: pCajasan, left: 865, top: 248 },

    // Right cabin lower counter facade:
    { input: pPracti, left: 790, top: 580 },
    { input: pMariposa, left: 915, top: 582 },

    // Left cabin lower counter facade:
    { input: pImebu, left: 75, top: 575 },
    { input: pFundalas, left: 245, top: 575 },

    // Middle stalls (illuminated shop signs on the fair stalls):
    { input: pAngelus, left: 365, top: 402 },
    { input: pFactor, left: 638, top: 398 },
  ];

  await baseImg
    .composite(composites)
    .toFile('../scratch_composite_village.webp');

  console.log('Saved scratch_composite_village.webp');
}

compositeAllSponsors().catch(console.error);
