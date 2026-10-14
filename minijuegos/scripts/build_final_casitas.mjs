import sharp from 'sharp';

let signCount = 0;

/**
 * Creates an authentic artisan wooden shop sign:
 * - High-grade carved dark cedar/mahogany board
 * - Warm ambient gold rim
 * - Pure ivory enameled face for 100% logo fidelity and contrast
 * - Game-styled fluffy snow drifts on top
 * - Optional hanging chains
 */
async function makeArtisanSign({
  logoPath,
  width,
  height,
  woodBorder = 2.5,
  cornerRadius = 6,
  snowAmount = 1.0,
  hasChains = false,
  chainHeight = 8,
  padXPercent = 0.08,
  padYPercent = 0.12
}) {
  const sId = ++signCount;
  const totalH = height + (hasChains ? chainHeight : 0);
  const signY = hasChains ? chainHeight : 0;

  const svg = `
    <svg width="${width}" height="${totalH}" viewBox="0 0 ${width} ${totalH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="finWood_${sId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3A1C0C"/>
          <stop offset="45%" stop-color="#261107"/>
          <stop offset="100%" stop-color="#140803"/>
        </linearGradient>
        <linearGradient id="finGold_${sId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF59D"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#8D6E18"/>
        </linearGradient>
        <filter id="finShadow_${sId}">
          <feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#000" flood-opacity="0.7"/>
        </filter>
      </defs>

      ${hasChains ? `
      <!-- Left iron hanging chain -->
      <line x1="${width * 0.22}" y1="0" x2="${width * 0.22}" y2="${chainHeight + 2}" stroke="#160E08" stroke-width="2.2"/>
      <line x1="${width * 0.22}" y1="0" x2="${width * 0.22}" y2="${chainHeight + 2}" stroke="#655243" stroke-width="0.8"/>
      <circle cx="${width * 0.22}" cy="${chainHeight + 2}" r="2" fill="#D4AF37"/>

      <!-- Right iron hanging chain -->
      <line x1="${width * 0.78}" y1="0" x2="${width * 0.78}" y2="${chainHeight + 2}" stroke="#160E08" stroke-width="2.2"/>
      <line x1="${width * 0.78}" y1="0" x2="${width * 0.78}" y2="${chainHeight + 2}" stroke="#655243" stroke-width="0.8"/>
      <circle cx="${width * 0.78}" cy="${chainHeight + 2}" r="2" fill="#D4AF37"/>
      ` : ''}

      <!-- Outer dark wood frame with shadow -->
      <rect x="1.5" y="${signY + 1.5}" width="${width - 3}" height="${height - 3}" rx="${cornerRadius}" fill="url(#finWood_${sId})" stroke="#0B0401" stroke-width="1.5" filter="url(#finShadow_${sId})"/>
      
      <!-- Inner gold trim -->
      <rect x="${woodBorder}" y="${signY + woodBorder}" width="${width - woodBorder * 2}" height="${height - woodBorder * 2}" rx="${Math.max(2, cornerRadius - 1.5)}" fill="none" stroke="url(#finGold_${sId})" stroke-width="1.2" opacity="0.9"/>

      <!-- Ivory enameled display face -->
      <rect x="${woodBorder + 1.5}" y="${signY + woodBorder + 1.5}" width="${width - (woodBorder + 1.5) * 2}" height="${height - (woodBorder + 1.5) * 2}" rx="${Math.max(1, cornerRadius - 2.5)}" fill="#FFFFFF"/>

      <!-- Brass corner rivets -->
      ${width >= 60 ? `
      <circle cx="${woodBorder + 3.5}" cy="${signY + woodBorder + 3.5}" r="1.3" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      <circle cx="${width - woodBorder - 3.5}" cy="${signY + woodBorder + 3.5}" r="1.3" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      <circle cx="${woodBorder + 3.5}" cy="${signY + height - woodBorder - 3.5}" r="1.3" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      <circle cx="${width - woodBorder - 3.5}" cy="${signY + height - woodBorder - 3.5}" r="1.3" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      ` : ''}

      <!-- Soft snow cap on top of sign -->
      ${snowAmount > 0 ? `
      <path d="M 2,${signY + woodBorder + 1} 
               Q ${width * 0.25},${signY + woodBorder - 2.5 * snowAmount} ${width * 0.5},${signY + woodBorder} 
               Q ${width * 0.75},${signY + woodBorder - 2.5 * snowAmount} ${width - 2},${signY + woodBorder + 1} 
               Q ${width * 0.85},${signY + woodBorder + 4 * snowAmount} ${width * 0.7},${signY + woodBorder + 2.5 * snowAmount} 
               Q ${width * 0.5},${signY + woodBorder + 5 * snowAmount} ${width * 0.3},${signY + woodBorder + 2.5 * snowAmount} 
               Q ${width * 0.15},${signY + woodBorder + 4 * snowAmount} 2,${signY + woodBorder + 1} Z" 
            fill="#FFFFFF" opacity="0.96"/>
      <path d="M 3,${signY + woodBorder + 1} Q ${width * 0.5},${signY + woodBorder + 2} ${width - 3},${signY + woodBorder + 1}" stroke="#D0E8FF" stroke-width="0.6" fill="none" opacity="0.8"/>
      ` : ''}
    </svg>
  `;

  const padX = Math.max(3, Math.round(width * padXPercent));
  const padY = Math.max(3, Math.round(height * padYPercent));
  const maxW = width - (padX * 2);
  const maxH = height - (padY * 2);

  const logoBuf = await sharp(logoPath)
    .resize(maxW, maxH, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = signY + Math.round((height - logoMeta.height) / 2) + (snowAmount > 0 ? 1 : 0);

  return await sharp(Buffer.from(svg))
    .composite([{ input: logoBuf, left, top }])
    .png()
    .toBuffer();
}

/**
 * Creates the large gable sign for Campuslands
 */
async function makeCampuslandsGableSign() {
  const width = 346;
  const height = 196;
  const id = ++signCount;

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cWood_${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3D1D0D"/>
          <stop offset="45%" stop-color="#271207"/>
          <stop offset="100%" stop-color="#140803"/>
        </linearGradient>
        <linearGradient id="cGold_${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF9A6"/>
          <stop offset="50%" stop-color="#FFD700"/>
          <stop offset="100%" stop-color="#C68A12"/>
        </linearGradient>
        <filter id="cShadow_${id}">
          <feDropShadow dx="0" dy="3.5" stdDeviation="5" flood-color="#000" flood-opacity="0.7"/>
        </filter>
      </defs>

      <!-- Main wooden plaque -->
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="12" fill="url(#cWood_${id})" stroke="#0B0401" stroke-width="2.5" filter="url(#cShadow_${id})"/>
      
      <!-- Inner gold rim -->
      <rect x="6" y="6" width="${width - 12}" height="${height - 12}" rx="9" fill="none" stroke="url(#cGold_${id})" stroke-width="1.8"/>

      <!-- Ivory face -->
      <rect x="9.5" y="9.5" width="${width - 19}" height="${height - 19}" rx="7" fill="#FFFFFF"/>

      <!-- Four corner brass rivets -->
      <circle cx="16" cy="16" r="3" fill="#FFD700" stroke="#713F12" stroke-width="0.6"/>
      <circle cx="${width - 16}" cy="16" r="3" fill="#FFD700" stroke="#713F12" stroke-width="0.6"/>
      <circle cx="16" cy="${height - 16}" r="3" fill="#FFD700" stroke="#713F12" stroke-width="0.6"/>
      <circle cx="${width - 16}" cy="${height - 16}" r="3" fill="#FFD700" stroke="#713F12" stroke-width="0.6"/>

      <!-- Snow drifts on top of plaque -->
      <path d="M 3,5 
               Q ${width * 0.2},-1 ${width * 0.35},4 
               Q ${width * 0.55},-2 ${width * 0.7},5 
               Q ${width * 0.85},-1 ${width - 3},5 
               Q ${width * 0.9},10 ${width * 0.75},7 
               Q ${width * 0.6},11 ${width * 0.45},7 
               Q ${width * 0.25},11 ${width * 0.12},6 Q 7,10 3,5 Z" 
            fill="#FFFFFF" opacity="0.96"/>
      <path d="M 5,4.5 Q ${width * 0.5},6.5 ${width - 5},4.5" stroke="#CBE4FF" stroke-width="0.9" fill="none" opacity="0.75"/>
    </svg>
  `;

  const padX = 35;
  const padY = 26;
  const maxW = width - (padX * 2);
  const maxH = height - (padY * 2);

  const logoBuf = await sharp('public/assets/logos/clean-campuslands.png')
    .resize(maxW, maxH, { fit: 'inside' })
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
  console.log('Generating Final Casitas Village...');

  // 1. Campuslands -> Gran Cabaña Derecha (Gable)
  const signCampus = await makeCampuslandsGableSign();

  // 2. Cajasan -> Tienda de Juguetes / Alero Cabaña Derecha (Hanging with chains)
  const signCajasan = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-cajasan.png',
    width: 155,
    height: 50,
    woodBorder: 2.5,
    cornerRadius: 6,
    hasChains: true,
    chainHeight: 8,
    snowAmount: 0.8,
    padXPercent: 0.08,
    padYPercent: 0.12
  });

  // 3. Dulces Mariposa -> Cabaña de Medias Navideñas & Repostería
  const signMariposa = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-mariposa.png',
    width: 88,
    height: 54,
    woodBorder: 2.2,
    cornerRadius: 6,
    snowAmount: 0.9,
    padXPercent: 0.08,
    padYPercent: 0.12
  });

  // 4. Practi Arepa -> Puesto Callejón 1 (Izquierda)
  const signPracti = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-practi-arepa.png',
    width: 78,
    height: 52,
    woodBorder: 2,
    cornerRadius: 5,
    snowAmount: 0.9,
    padXPercent: 0.06,
    padYPercent: 0.1
  });

  // 5. Ángelus Seguridad -> Puesto Callejón 2 (Izquierda-Centro)
  const signAngelus = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-angelus.png',
    width: 65,
    height: 46,
    woodBorder: 1.8,
    cornerRadius: 4.5,
    snowAmount: 0.8,
    padXPercent: 0.06,
    padYPercent: 0.1
  });

  // 6. Factor Humano -> Puesto Callejón 3 (Centro-Fondo)
  const signFactor = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-factor-humano.png',
    width: 58,
    height: 42,
    woodBorder: 1.6,
    cornerRadius: 4,
    snowAmount: 0.7,
    padXPercent: 0.06,
    padYPercent: 0.1
  });

  // 7. IMEBU & Alcaldía de Bucaramanga -> Gran Cabaña Izquierda (Placa Cívica Principal)
  const signImebu = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-imebu.png',
    width: 145,
    height: 78,
    woodBorder: 2.5,
    cornerRadius: 7,
    snowAmount: 0.9,
    padXPercent: 0.08,
    padYPercent: 0.12
  });

  // 8. Fundalas -> Gran Cabaña Izquierda (Placa Fundación Aliada)
  const signFundalas = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-fundalas.png',
    width: 95,
    height: 78,
    woodBorder: 2.5,
    cornerRadius: 7,
    snowAmount: 0.9,
    padXPercent: 0.08,
    padYPercent: 0.12
  });

  // Composite all 8 signs onto their respective casitas!
  const compositePlan = [
    // 1. Right Cabin Big Gable (Campuslands)
    { input: signCampus, left: 902, top: 148 },

    // 2. Right Cabin Candy Valance with Hanging Chains (Cajasan)
    { input: signCajasan, left: 835, top: 436 },

    // 3. Mid-Right Cabin Gable (Dulces Mariposa)
    { input: signMariposa, left: 635, top: 395 },

    // 4. Street Stall 1 Roof / Awning (Practi Arepa)
    { input: signPracti, left: 345, top: 395 },

    // 5. Street Stall 2 Roof / Awning (Ángelus Seguridad)
    { input: signAngelus, left: 430, top: 415 },

    // 6. Street Stall 3 Roof / Awning (Factor Humano)
    { input: signFactor, left: 505, top: 435 },

    // 7. Left Cabin Civic Plaque (IMEBU)
    { input: signImebu, left: 60, top: 550 },

    // 8. Left Cabin Foundation Plaque (Fundalas)
    { input: signFundalas, left: 215, top: 550 },
  ];

  await sharp('public/assets/images/fondo-empresas.backup.webp')
    .composite(compositePlan)
    .webp({ quality: 92 })
    .toFile('../scratch_fondo_casitas_final.webp');

  console.log('Saved scratch_fondo_casitas_final.webp');
}

run().catch(console.error);
