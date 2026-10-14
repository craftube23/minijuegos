import sharp from 'sharp';

let count = 0;

/**
 * Creates an authentic carved wooden shop sign with:
 * - Handcrafted beveled dark wood
 * - Warm ambient glow
 * - Soft snow cap
 * - Crisp enameled ivory center plate
 */
async function makeArtisanSign({
  logoPath,
  width,
  height,
  woodBorder = 3,
  cornerRadius = 6,
  snowAmount = 1.0,
  isArch = false,
  isRound = false,
  padPercent = 0.12,
  padYPercent = 0.16
}) {
  const id = ++count;
  const rx = isRound ? Math.round(width / 2) : cornerRadius;
  
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="artWood_${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3A1C0C"/>
          <stop offset="45%" stop-color="#261107"/>
          <stop offset="100%" stop-color="#140803"/>
        </linearGradient>
        <linearGradient id="artGold_${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF59D"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#8D6E18"/>
        </linearGradient>
        <linearGradient id="artIvory_${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="60%" stop-color="#FCF9F2"/>
          <stop offset="100%" stop-color="#F5EBD7"/>
        </linearGradient>
        <filter id="artShadow_${id}">
          <feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#000" flood-opacity="0.65"/>
        </filter>
      </defs>

      <!-- Outer dark wood frame with shadow -->
      <rect x="1.5" y="1.5" width="${width - 3}" height="${height - 3}" rx="${rx}" fill="url(#artWood_${id})" stroke="#0B0401" stroke-width="1.5" filter="url(#artShadow_${id})"/>
      
      <!-- Inner gold trim -->
      <rect x="${woodBorder}" y="${woodBorder}" width="${width - woodBorder * 2}" height="${height - woodBorder * 2}" rx="${Math.max(2, rx - 2)}" fill="none" stroke="url(#artGold_${id})" stroke-width="1" opacity="0.9"/>

      <!-- Ivory enameled display face -->
      <rect x="${woodBorder + 1.5}" y="${woodBorder + 1.5}" width="${width - (woodBorder + 1.5) * 2}" height="${height - (woodBorder + 1.5) * 2}" rx="${Math.max(1, rx - 3)}" fill="url(#artIvory_${id})"/>

      <!-- Corner brass rivets for larger signs -->
      ${width >= 70 && !isRound ? `
      <circle cx="${woodBorder + 3.5}" cy="${woodBorder + 3.5}" r="1.2" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      <circle cx="${width - woodBorder - 3.5}" cy="${woodBorder + 3.5}" r="1.2" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      <circle cx="${woodBorder + 3.5}" cy="${height - woodBorder - 3.5}" r="1.2" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      <circle cx="${width - woodBorder - 3.5}" cy="${height - woodBorder - 3.5}" r="1.2" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      ` : ''}

      <!-- Soft snow cap on top of sign -->
      <path d="M 2,${woodBorder + 1} 
               Q ${width * 0.25},${woodBorder - 2.5 * snowAmount} ${width * 0.5},${woodBorder} 
               Q ${width * 0.75},${woodBorder - 2.5 * snowAmount} ${width - 2},${woodBorder + 1} 
               Q ${width * 0.85},${woodBorder + 4 * snowAmount} ${width * 0.7},${woodBorder + 2.5 * snowAmount} 
               Q ${width * 0.5},${woodBorder + 5 * snowAmount} ${width * 0.3},${woodBorder + 2.5 * snowAmount} 
               Q ${width * 0.15},${woodBorder + 4 * snowAmount} 2,${woodBorder + 1} Z" 
            fill="#FFFFFF" opacity="0.96"/>
      <path d="M 3,${woodBorder + 1} Q ${width * 0.5},${woodBorder + 2} ${width - 3},${woodBorder + 1}" stroke="#D0E8FF" stroke-width="0.6" fill="none" opacity="0.8"/>
    </svg>
  `;

  const padX = Math.max(3, Math.round(width * padPercent));
  const padY = Math.max(3, Math.round(height * padYPercent));
  const maxW = width - (padX * 2);
  const maxH = height - (padY * 2);

  const logoBuf = await sharp(logoPath)
    .resize(maxW, maxH, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round((height - logoMeta.height) / 2) + (snowAmount > 0 ? 1 : 0);

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
  const id = ++count;

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

/**
 * Creates the Grand Civic Institutional Plaque for the Left Cabin (IMEBU & Alcaldía)
 */
async function makeImebuCivicPlaque() {
  const width = 230;
  const height = 96;
  const id = ++count;

  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="iWood_${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3B1C0B"/>
          <stop offset="50%" stop-color="#271106"/>
          <stop offset="100%" stop-color="#150803"/>
        </linearGradient>
        <linearGradient id="iGold_${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF385"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#996515"/>
        </linearGradient>
        <filter id="iShadow_${id}">
          <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity="0.7"/>
        </filter>
      </defs>

      <!-- Outer wooden board with carved beveled edge -->
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="10" fill="url(#iWood_${id})" stroke="#0B0401" stroke-width="2" filter="url(#iShadow_${id})"/>
      
      <!-- Inner gold trim -->
      <rect x="5.5" y="5.5" width="${width - 11}" height="${height - 11}" rx="7" fill="none" stroke="url(#iGold_${id})" stroke-width="1.6"/>

      <!-- Ivory face -->
      <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="5.5" fill="#FFFFFF"/>

      <!-- Four corner golden rivets -->
      <circle cx="14" cy="14" r="2.5" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>
      <circle cx="${width - 14}" cy="14" r="2.5" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>
      <circle cx="14" cy="${height - 14}" r="2.5" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>
      <circle cx="${width - 14}" cy="${height - 14}" r="2.5" fill="#FFD700" stroke="#713F12" stroke-width="0.5"/>

      <!-- Festive snow along top -->
      <path d="M 3,4 Q ${width * 0.25},0 ${width * 0.5},3 Q ${width * 0.75},0 ${width - 3},4 Q ${width * 0.85},8 ${width * 0.7},6 Q ${width * 0.5},9 ${width * 0.3},6 Q ${width * 0.15},8 3,4 Z" fill="#FFFFFF" opacity="0.96"/>
      <path d="M 5,3.5 Q ${width * 0.5},5 ${width - 5},3.5" stroke="#CBE4FF" stroke-width="0.8" fill="none" opacity="0.75"/>
    </svg>
  `;

  const padX = 20;
  const padY = 16;
  const maxW = width - (padX * 2);
  const maxH = height - (padY * 2);

  const logoBuf = await sharp('public/assets/logos/clean-imebu.png')
    .resize(maxW, maxH, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round((height - logoMeta.height) / 2) + 1;

  return await sharp(Buffer.from(svg))
    .composite([{ input: logoBuf, left, top }])
    .png()
    .toBuffer();
}

/**
 * Creates a cozy wooden Christmas market booth for the background gap (Fundalas)
 */
async function makeBackgroundStall({ width = 76, height = 75, logoSign }) {
  const id = ++count;
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="stallWood_${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#4A2512"/>
          <stop offset="50%" stop-color="#30160A"/>
          <stop offset="100%" stop-color="#1A0A04"/>
        </linearGradient>
        <linearGradient id="warmLight_${id}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFF2A3"/>
          <stop offset="60%" stop-color="#FFD15C"/>
          <stop offset="100%" stop-color="#E69526"/>
        </linearGradient>
      </defs>

      <!-- Wooden Booth Body -->
      <polygon points="6,34 ${width - 6},34 ${width - 10},${height} 10,${height}" fill="url(#stallWood_${id})" stroke="#120602" stroke-width="1.2"/>

      <!-- Warm illuminated counter window -->
      <polygon points="12,38 ${width - 12},38 ${width - 14},${height - 18} 14,${height - 18}" fill="url(#warmLight_${id})"/>
      
      <!-- Counter silhouette silhouette of products/gifts -->
      <rect x="18" y="${height - 24}" width="14" height="7" rx="1.5" fill="#8B4513" opacity="0.8"/>
      <rect x="36" y="${height - 26}" width="16" height="9" rx="1.5" fill="#A0522D" opacity="0.8"/>
      <rect x="54" y="${height - 23}" width="10" height="6" rx="1" fill="#8B4513" opacity="0.8"/>

      <!-- Counter ledge / bar -->
      <rect x="9" y="${height - 19}" width="${width - 18}" height="4" rx="1" fill="#241006" stroke="#0E0502" stroke-width="0.8"/>

      <!-- Triangular Snowy Roof Gable -->
      <polygon points="${width / 2},4 3,36 ${width - 3},36" fill="url(#stallWood_${id})" stroke="#0F0502" stroke-width="1.2"/>
      
      <!-- Thick snow on roof -->
      <path d="M ${width / 2},1 
               Q ${width * 0.25},16 1,35 
               Q 6,38 12,36 
               Q ${width * 0.3},38 ${width * 0.5},35 
               Q ${width * 0.7},38 ${width - 12},36 
               Q ${width - 6},38 ${width - 1},35 
               Q ${width * 0.75},16 ${width / 2},1 Z" 
            fill="#FFFFFF"/>
      <path d="M 3,35 Q ${width * 0.5},36 ${width - 3},35" stroke="#C8E2FF" stroke-width="0.8" fill="none"/>

      <!-- Small hanging festive lantern -->
      <circle cx="${width / 2}" cy="37" r="2" fill="#FFEB3B"/>
    </svg>
  `;

  // Composite the sign onto the gable of this stall
  const signLeft = Math.round((width - 50) / 2);
  const signTop = 13;

  return await sharp(Buffer.from(svg))
    .composite([{ input: logoSign, left: signLeft, top: signTop }])
    .png()
    .toBuffer();
}

async function buildVillage() {
  console.log('Building authentic village with individual casitas...');

  // 1. Casita 1: Gran Cabaña Derecha (Campuslands)
  const campusSign = await makeCampuslandsGableSign();

  // 2. Casita 2: Gran Cabaña Izquierda (IMEBU & Alcaldía)
  const imebuSign = await makeImebuCivicPlaque();

  // 3. Casita 3: Cabaña Medias Navideñas & Repostería (Dulces Mariposa)
  const mariposaSign = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-mariposa.png',
    width: 95,
    height: 56,
    woodBorder: 2.5,
    cornerRadius: 6,
    snowAmount: 1.0,
    padPercent: 0.12,
    padYPercent: 0.14
  });

  // 4. Casita 4: Puesto de Juguetes / Alero Cabaña Derecha (Cajasan)
  const cajasanSign = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-cajasan.png',
    width: 150,
    height: 48,
    woodBorder: 2.5,
    cornerRadius: 6,
    snowAmount: 0.8,
    padPercent: 0.1,
    padYPercent: 0.14
  });

  // 5. Casita 5: Puesto Callejón 1 Izquierda (Practi Arepa)
  // Sits on roof peak of stall 1: x: 365, y: 372
  const practiSign = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-practi-arepa.png',
    width: 72,
    height: 48,
    woodBorder: 2,
    cornerRadius: 5,
    snowAmount: 1.0,
    padPercent: 0.1,
    padYPercent: 0.12
  });

  // 6. Casita 6: Puesto Callejón 2 Izquierda (Ángelus Seguridad)
  // Sits on roof peak of stall 2: x: 442, y: 412
  const angelusSign = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-angelus.png',
    width: 58,
    height: 42,
    woodBorder: 2,
    cornerRadius: 4,
    snowAmount: 0.9,
    padPercent: 0.1,
    padYPercent: 0.12
  });

  // 7. Casita 7: Puesto Callejón 3 Centro (Factor Humano)
  // Sits on roof peak of stall 3: x: 494, y: 442
  const factorSign = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-factor-humano.png',
    width: 52,
    height: 38,
    woodBorder: 1.8,
    cornerRadius: 4,
    snowAmount: 0.8,
    padPercent: 0.08,
    padYPercent: 0.12
  });

  // 8. Casita 8: Puesto Callejón 4 Centro-Derecha (Fundalas)
  const fundalasSmallSign = await makeArtisanSign({
    logoPath: 'public/assets/logos/clean-fundalas.png',
    width: 50,
    height: 34,
    woodBorder: 1.8,
    cornerRadius: 3.5,
    snowAmount: 0.7,
    padPercent: 0.08,
    padYPercent: 0.12
  });

  const stallFundalas = await makeBackgroundStall({
    width: 76,
    height: 75,
    logoSign: fundalasSmallSign
  });

  // Accurate pixel placement for each casita:
  const compositePlan = [
    // Casita 8: Background stall Fundalas (placed in the street gap x: 546, y: 450)
    { input: stallFundalas, left: 546, top: 450 },

    // Casita 7: Factor Humano on Roof of Stall 3
    { input: factorSign, left: 494, top: 440 },

    // Casita 6: Ángelus on Roof of Stall 2
    { input: angelusSign, left: 440, top: 410 },

    // Casita 5: Practi Arepa on Roof of Stall 1
    { input: practiSign, left: 366, top: 372 },

    // Casita 3: Dulces Mariposa on Gable of Mid-Right Cabin
    { input: mariposaSign, left: 648, top: 405 },

    // Casita 4: Cajasan on Upper Valance of Right Candy Stall
    { input: cajasanSign, left: 835, top: 436 },

    // Casita 1: Campuslands on Right Cabin Main Gable
    { input: campusSign, left: 902, top: 148 },

    // Casita 2: IMEBU on Left Cabin Front Facade
    { input: imebuSign, left: 62, top: 548 }
  ];

  await sharp('public/assets/images/fondo-empresas.backup.webp')
    .composite(compositePlan)
    .webp({ quality: 92 })
    .toFile('../scratch_fondo_casitas_v2.webp');

  console.log('Saved scratch_fondo_casitas_v2.webp');

  // Also generate detailed crops of each casita for inspection
  const crops = [
    { name: 'crop_casita_campuslands.png', left: 880, top: 130, width: 390, height: 240 },
    { name: 'crop_casita_imebu.png', left: 30, top: 510, width: 300, height: 180 },
    { name: 'crop_casita_mariposa.png', left: 610, top: 380, width: 170, height: 160 },
    { name: 'crop_casita_cajasan.png', left: 800, top: 410, width: 220, height: 120 },
    { name: 'crop_casitas_calle_stalls.png', left: 340, top: 360, width: 300, height: 180 },
  ];

  for (const c of crops) {
    await sharp('../scratch_fondo_casitas_v2.webp')
      .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
      .toFile(`../scratch_${c.name}`);
  }

  console.log('Saved all diagnostic crops');
}

buildVillage().catch(console.error);
