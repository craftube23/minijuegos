import sharp from 'sharp';

let signId = 0;

/**
 * Creates an authentic artisan wooden shop sign that looks like a native 2D game asset:
 * - Handcrafted beveled dark cedar/mahogany frame
 * - Warm ambient inner gold filigree
 * - Enameled ivory plate (#FFFFFF to #FBF6EC) for perfect logo clarity
 * - Real snow drift on top matching the game's snow style
 * - Optional iron hanging chains
 */
async function makeArtisanSign({
  logoPath,
  width,
  height,
  woodBorder = 3,
  cornerRadius = 6,
  snowAmount = 1.0,
  hasChains = false,
  chainHeight = 12,
  padXPercent = 0.12,
  padYPercent = 0.14
}) {
  const sId = ++signId;
  const totalH = height + (hasChains ? chainHeight : 0);
  const signY = hasChains ? chainHeight : 0;

  const svg = `
    <svg width="${width}" height="${totalH}" viewBox="0 0 ${width} ${totalH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="artWood_${sId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3A1C0C"/>
          <stop offset="45%" stop-color="#261107"/>
          <stop offset="100%" stop-color="#140803"/>
        </linearGradient>
        <linearGradient id="artGold_${sId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF59D"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#8D6E18"/>
        </linearGradient>
        <filter id="artShadow_${sId}">
          <feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#000" flood-opacity="0.65"/>
        </filter>
      </defs>

      ${hasChains ? `
      <!-- Left iron chain -->
      <line x1="${width * 0.25}" y1="0" x2="${width * 0.25}" y2="${chainHeight + 2}" stroke="#1F1610" stroke-width="2.2"/>
      <line x1="${width * 0.25}" y1="0" x2="${width * 0.25}" y2="${chainHeight + 2}" stroke="#6E5848" stroke-width="0.8"/>
      <circle cx="${width * 0.25}" cy="${chainHeight + 3}" r="2" fill="#D4AF37"/>

      <!-- Right iron chain -->
      <line x1="${width * 0.75}" y1="0" x2="${width * 0.75}" y2="${chainHeight + 2}" stroke="#1F1610" stroke-width="2.2"/>
      <line x1="${width * 0.75}" y1="0" x2="${width * 0.75}" y2="${chainHeight + 2}" stroke="#6E5848" stroke-width="0.8"/>
      <circle cx="${width * 0.75}" cy="${chainHeight + 3}" r="2" fill="#D4AF37"/>
      ` : ''}

      <!-- Outer dark wood frame with shadow -->
      <rect x="1.5" y="${signY + 1.5}" width="${width - 3}" height="${height - 3}" rx="${cornerRadius}" fill="url(#artWood_${sId})" stroke="#0B0401" stroke-width="1.5" filter="url(#artShadow_${sId})"/>
      
      <!-- Inner gold trim -->
      <rect x="${woodBorder}" y="${signY + woodBorder}" width="${width - woodBorder * 2}" height="${height - woodBorder * 2}" rx="${Math.max(2, cornerRadius - 2)}" fill="none" stroke="url(#artGold_${sId})" stroke-width="1.2" opacity="0.9"/>

      <!-- Ivory enameled display face -->
      <rect x="${woodBorder + 1.5}" y="${signY + woodBorder + 1.5}" width="${width - (woodBorder + 1.5) * 2}" height="${height - (woodBorder + 1.5) * 2}" rx="${Math.max(1, cornerRadius - 3)}" fill="#FFFFFF"/>

      <!-- Corner brass rivets for larger signs -->
      ${width >= 70 ? `
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
 * Creates the big triangular gable sign for Campuslands
 */
async function makeCampuslandsGableSign() {
  const width = 346;
  const height = 196;
  const id = ++signId;

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
  console.log('Building V3: Every Casita Has Its Own Authentic Artisan Sign...');

  // 1. Campuslands -> Gran Cabaña Derecha (Gable)
  const signCampus = await makeCampuslandsGableSign();

  // 2. Cajasan -> Tienda de Juguetes / Alero Cabaña Derecha (Hanging with chains)
  const signCajasan = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-cajasan.png',
    width: 145,
    height: 48,
    woodBorder: 2.5,
    cornerRadius: 6,
    hasChains: true,
    chainHeight: 10,
    snowAmount: 0.8,
    padXPercent: 0.1,
    padYPercent: 0.14
  });

  // 3. Dulces Mariposa -> Cabaña de Medias Navideñas & Repostería
  // Situated on its triangular wooden gable: x: 645, y: 405
  const signMariposa = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-mariposa.png',
    width: 96,
    height: 56,
    woodBorder: 2.5,
    cornerRadius: 6,
    snowAmount: 1.0,
    padXPercent: 0.1,
    padYPercent: 0.14
  });

  // 4. Practi Arepa -> Puesto Callejón 1 (Primer Puesto de Comida, Izquierda)
  // Perfectly centered on the wooden roof peak: x: 366, y: 370
  const signPracti = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-practi-arepa.png',
    width: 68,
    height: 46,
    woodBorder: 2,
    cornerRadius: 5,
    snowAmount: 1.0,
    padXPercent: 0.08,
    padYPercent: 0.12
  });

  // 5. Ángelus Seguridad -> Puesto Callejón 2 (Segundo Puesto)
  // Situated on its triangular roof peak: x: 442, y: 412
  const signAngelus = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-angelus.png',
    width: 52,
    height: 38,
    woodBorder: 1.8,
    cornerRadius: 4,
    snowAmount: 0.9,
    padXPercent: 0.08,
    padYPercent: 0.12
  });

  // 6. Factor Humano -> Puesto Callejón 3 (Tercer Puesto al Fondo)
  // Situated on its roof peak: x: 494, y: 442
  const signFactor = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-factor-humano.png',
    width: 48,
    height: 34,
    woodBorder: 1.6,
    cornerRadius: 3.5,
    snowAmount: 0.8,
    padXPercent: 0.08,
    padYPercent: 0.12
  });

  // 7. IMEBU & Alcaldía de Bucaramanga -> Gran Cabaña Izquierda (Placa Cívica Principal)
  const signImebu = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-imebu.png',
    width: 140,
    height: 75,
    woodBorder: 2.5,
    cornerRadius: 7,
    snowAmount: 0.9,
    padXPercent: 0.08,
    padYPercent: 0.14
  });

  // 8. Fundalas -> Gran Cabaña Izquierda (Placa de la Fundación Aliada)
  const signFundalas = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-fundalas.png',
    width: 90,
    height: 75,
    woodBorder: 2.5,
    cornerRadius: 7,
    snowAmount: 0.9,
    padXPercent: 0.08,
    padYPercent: 0.14
  });

  // Exact composite positioning
  const compositePlan = [
    // 1. Right Cabin Big Gable (Campuslands)
    { input: signCampus, left: 902, top: 148 },

    // 2. Right Cabin Candy Valance with Hanging Chains (Cajasan)
    { input: signCajasan, left: 840, top: 432 },

    // 3. Mid-Right Cabin Gable (Dulces Mariposa)
    { input: signMariposa, left: 648, top: 405 },

    // 4. Street Stall 1 Roof Peak (Practi Arepa)
    { input: signPracti, left: 368, top: 372 },

    // 5. Street Stall 2 Roof Peak (Ángelus Seguridad)
    { input: signAngelus, left: 444, top: 414 },

    // 6. Street Stall 3 Roof Peak (Factor Humano)
    { input: signFactor, left: 495, top: 444 },

    // 7. Left Cabin Civic Plaque (IMEBU)
    { input: signImebu, left: 65, top: 555 },

    // 8. Left Cabin Foundation Plaque (Fundalas)
    { input: signFundalas, left: 215, top: 555 },
  ];

  await sharp('public/assets/images/fondo-empresas.backup.webp')
    .composite(compositePlan)
    .webp({ quality: 92 })
    .toFile('../scratch_fondo_casitas_v3.webp');

  console.log('Saved scratch_fondo_casitas_v3.webp');

  // Diagnostics crops
  await sharp('../scratch_fondo_casitas_v3.webp')
    .extract({ left: 340, top: 350, width: 230, height: 160 })
    .toFile('../scratch_v3_stalls.png');

  await sharp('../scratch_fondo_casitas_v3.webp')
    .extract({ left: 40, top: 520, width: 290, height: 130 })
    .toFile('../scratch_v3_left_chalet.png');

  await sharp('../scratch_fondo_casitas_v3.webp')
    .extract({ left: 620, top: 380, width: 480, height: 160 })
    .toFile('../scratch_v3_mid_and_candy.png');
}

run().catch(console.error);
