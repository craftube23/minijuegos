import sharp from 'sharp';
import fs from 'fs';

let plaqueCounter = 0;

/**
 * Creates an authentic wooden Christmas market stall sign with:
 * - Handcrafted dark mahogany/cedar wooden board
 * - Golden or warm beveled border
 * - Top snow drifts / ice frost matching the village roofs
 * - Pure ivory / enamel background plate for optimal logo contrast and zero distortion
 * - Official logo fitted perfectly inside with clean padding
 */
async function makeStallSign({
  logoPath,
  width,
  height,
  woodBorder = 3,
  hasSnow = true,
  hasChains = false,
  boardStyle = 'wood', // 'wood' or 'crest'
  cornerRadius = 6,
  snowAmount = 1.0,
}) {
  const sId = ++plaqueCounter;
  const innerW = width - (woodBorder * 2);
  const innerH = height - (woodBorder * 2);

  // SVG frame definition
  let frameSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="signWood_${sId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3A1C0E"/>
          <stop offset="50%" stop-color="#261208"/>
          <stop offset="100%" stop-color="#140803"/>
        </linearGradient>
        <linearGradient id="signGold_${sId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF59D"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#8D6E18"/>
        </linearGradient>
        <linearGradient id="signIvory_${sId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="60%" stop-color="#FDFBF5"/>
          <stop offset="100%" stop-color="#F5EBD7"/>
        </linearGradient>
        <filter id="shadow_${sId}">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.6"/>
        </filter>
      </defs>

      <!-- Outer wooden board with subtle shadow -->
      <rect x="${woodBorder/2}" y="${woodBorder/2}" width="${width - woodBorder}" height="${height - woodBorder}" rx="${cornerRadius}" fill="url(#signWood_${sId})" stroke="#0B0401" stroke-width="1.2" filter="url(#shadow_${sId})"/>
      
      <!-- Inner gold trim -->
      <rect x="${woodBorder + 1}" y="${woodBorder + 1}" width="${innerW - 2}" height="${innerH - 2}" rx="${Math.max(2, cornerRadius - 2)}" fill="none" stroke="url(#signGold_${sId})" stroke-width="1.2" opacity="0.85"/>

      <!-- Ivory enameled face for high-contrast logo display -->
      <rect x="${woodBorder + 2.5}" y="${woodBorder + 2.5}" width="${innerW - 5}" height="${innerH - 5}" rx="${Math.max(2, cornerRadius - 3)}" fill="url(#signIvory_${sId})"/>

      <!-- Corner brass rivets -->
      ${width > 60 ? `
      <circle cx="${woodBorder + 5}" cy="${woodBorder + 5}" r="1.5" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      <circle cx="${width - woodBorder - 5}" cy="${woodBorder + 5}" r="1.5" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      <circle cx="${woodBorder + 5}" cy="${height - woodBorder - 5}" r="1.5" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      <circle cx="${width - woodBorder - 5}" cy="${height - woodBorder - 5}" r="1.5" fill="#FFD700" stroke="#5D3A0A" stroke-width="0.3"/>
      ` : ''}

      <!-- Top snow drift -->
      ${hasSnow ? `
      <path d="M ${woodBorder},${woodBorder + 2} 
               Q ${width * 0.25},${woodBorder - 3 * snowAmount} ${width * 0.5},${woodBorder + 1} 
               Q ${width * 0.75},${woodBorder - 3 * snowAmount} ${width - woodBorder},${woodBorder + 2} 
               Q ${width * 0.85},${woodBorder + 5 * snowAmount} ${width * 0.7},${woodBorder + 3 * snowAmount} 
               Q ${width * 0.5},${woodBorder + 6 * snowAmount} ${width * 0.3},${woodBorder + 3 * snowAmount} 
               Q ${width * 0.15},${woodBorder + 5 * snowAmount} ${woodBorder},${woodBorder + 2} Z" 
            fill="#FFFFFF" opacity="0.96"/>
      <path d="M ${woodBorder + 2},${woodBorder + 2} Q ${width * 0.5},${woodBorder + 3} ${width - woodBorder - 2},${woodBorder + 2}" stroke="#D0E8FF" stroke-width="0.8" fill="none" opacity="0.8"/>
      ` : ''}
    </svg>
  `;

  // Logo sizing: generous padding so the logo breathes
  const padX = Math.max(4, Math.round(width * 0.1));
  const padY = Math.max(3, Math.round(height * 0.14));
  const maxW = width - (padX * 2);
  const maxH = height - (padY * 2) - (hasSnow ? 2 : 0);

  const logoBuf = await sharp(logoPath)
    .resize(maxW, maxH, { fit: 'inside' })
    .toBuffer();

  const logoMeta = await sharp(logoBuf).metadata();
  const left = Math.round((width - logoMeta.width) / 2);
  const top = Math.round((height - logoMeta.height) / 2) + (hasSnow ? 1 : 0);

  return await sharp(Buffer.from(frameSvg))
    .composite([{ input: logoBuf, left, top }])
    .png()
    .toBuffer();
}

/**
 * Creates the big triangular gable marquee for the main right cabin
 */
async function makeRightCabinGableSign({ width = 310, height = 175, logoPath }) {
  const gId = ++plaqueCounter;
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gableWood_${gId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#42200E"/>
          <stop offset="40%" stop-color="#2D1508"/>
          <stop offset="100%" stop-color="#160803"/>
        </linearGradient>
        <linearGradient id="gableGold_${gId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF9A6"/>
          <stop offset="50%" stop-color="#FFD700"/>
          <stop offset="100%" stop-color="#C68A12"/>
        </linearGradient>
        <linearGradient id="gableIvory_${gId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="65%" stop-color="#FAF5E8"/>
          <stop offset="100%" stop-color="#F2E6CD"/>
        </linearGradient>
        <filter id="gableShadow_${gId}">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.7"/>
        </filter>
      </defs>

      <!-- Main wooden plaque -->
      <rect x="3" y="3" width="${width - 6}" height="${height - 6}" rx="14" fill="url(#gableWood_${gId})" stroke="#0B0401" stroke-width="2.5" filter="url(#gableShadow_${gId})"/>
      
      <!-- Inner gold filigree border -->
      <rect x="7" y="7" width="${width - 14}" height="${height - 14}" rx="10" fill="none" stroke="url(#gableGold_${gId})" stroke-width="1.8"/>

      <!-- Premium Ivory display face -->
      <rect x="11" y="11" width="${width - 22}" height="${height - 22}" rx="8" fill="url(#gableIvory_${gId})"/>

      <!-- Decorative corner rosettes -->
      <circle cx="18" cy="18" r="3.5" fill="#FFD700" stroke="#713F12" stroke-width="0.8"/>
      <circle cx="${width - 18}" cy="18" r="3.5" fill="#FFD700" stroke="#713F12" stroke-width="0.8"/>
      <circle cx="18" cy="${height - 18}" r="3.5" fill="#FFD700" stroke="#713F12" stroke-width="0.8"/>
      <circle cx="${width - 18}" cy="${height - 18}" r="3.5" fill="#FFD700" stroke="#713F12" stroke-width="0.8"/>

      <!-- Festive snow along top edge -->
      <path d="M 4,6 
               Q ${width * 0.2},0 ${width * 0.35},5 
               Q ${width * 0.55},-1 ${width * 0.7},6 
               Q ${width * 0.85},0 ${width - 4},6 
               Q ${width * 0.9},11 ${width * 0.75},8 
               Q ${width * 0.6},12 ${width * 0.45},8 
               Q ${width * 0.25},12 ${width * 0.12},7 Q 8,11 4,6 Z" 
            fill="#FFFFFF" opacity="0.96"/>
      <path d="M 6,5.5 Q ${width * 0.5},7 ${width - 6},5.5" stroke="#CBE4FF" stroke-width="1" fill="none" opacity="0.75"/>
    </svg>
  `;

  const padX = 28;
  const padY = 24;
  const maxW = width - (padX * 2);
  const maxH = height - (padY * 2);

  const logoBuf = await sharp(logoPath)
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
 * Creates the Civic Institutional Plaque for the Left Cabin (IMEBU & Alcaldía)
 */
async function makeLeftCabinCivicPlaque({ width = 230, height = 100, logoPath }) {
  const cId = ++plaqueCounter;
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="civicWood_${cId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3B1C0B"/>
          <stop offset="50%" stop-color="#271106"/>
          <stop offset="100%" stop-color="#150803"/>
        </linearGradient>
        <linearGradient id="civicGold_${cId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF385"/>
          <stop offset="50%" stop-color="#D4AF37"/>
          <stop offset="100%" stop-color="#996515"/>
        </linearGradient>
        <linearGradient id="civicIvory_${cId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="60%" stop-color="#FAF5E8"/>
          <stop offset="100%" stop-color="#F2E4C4"/>
        </linearGradient>
      </defs>

      <!-- Outer wooden board with carved beveled edge -->
      <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="10" fill="url(#civicWood_${cId})" stroke="#0B0401" stroke-width="2"/>
      
      <!-- Inner gold trim -->
      <rect x="5.5" y="5.5" width="${width - 11}" height="${height - 11}" rx="7" fill="none" stroke="url(#civicGold_${cId})" stroke-width="1.6"/>

      <!-- Ivory face -->
      <rect x="8" y="8" width="${width - 16}" height="${height - 16}" rx="5.5" fill="url(#civicIvory_${cId})"/>

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

  const logoBuf = await sharp(logoPath)
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

async function run() {
  console.log('Generating Authentic Individual Casita Signs...');

  // 1. Right Cabin Big Gable (Campuslands)
  const signCampuslands = await makeRightCabinGableSign({
    width: 320,
    height: 180,
    logoPath: 'public/assets/logos/clean-campuslands.png'
  });

  // 2. Left Cabin Main Wooden Facade (IMEBU & Alcaldía de Bucaramanga)
  const signImebu = await makeLeftCabinCivicPlaque({
    width: 230,
    height: 96,
    logoPath: 'public/assets/logos/clean-imebu.png'
  });

  // 3. Mid-Right Cabin with Stockings & Pastries (Dulces Mariposa)
  // Situated on its triangular gable above the stockings: x: 645, y: 395
  const signMariposa = await makeStallSign({
    logoPath: 'public/assets/logos/clean-mariposa.png',
    width: 106,
    height: 62,
    woodBorder: 3,
    cornerRadius: 7,
    hasSnow: true,
    snowAmount: 1.0
  });

  // 4. Right Cabin Candy Counter Awning (Cajasan)
  // Situated on the front awning beam above the candy/teddy bear shelf: x: 830, y: 442
  const signCajasan = await makeStallSign({
    logoPath: 'public/assets/logos/clean-cajasan.png',
    width: 160,
    height: 52,
    woodBorder: 3,
    cornerRadius: 6,
    hasSnow: true,
    snowAmount: 0.9
  });

  // 5. Street Stall 1 - Left foreground street booth (Practi Arepa)
  // Situated on its front roof/awning: x: 350, y: 405
  const signPracti = await makeStallSign({
    logoPath: 'public/assets/logos/clean-practi-arepa.png',
    width: 84,
    height: 54,
    woodBorder: 2.5,
    cornerRadius: 6,
    hasSnow: true,
    snowAmount: 1.0
  });

  // 6. Street Stall 2 - Mid-left street booth (Angelus Seguridad)
  // Situated on its triangular gable: x: 440, y: 440
  const signAngelus = await makeStallSign({
    logoPath: 'public/assets/logos/clean-angelus.png',
    width: 68,
    height: 48,
    woodBorder: 2.5,
    cornerRadius: 5,
    hasSnow: true,
    snowAmount: 0.9
  });

  // 7. Street Stall 3 - Background street booth (Factor Humano)
  // Situated on its roof peak: x: 495, y: 478
  const signFactor = await makeStallSign({
    logoPath: 'public/assets/logos/clean-factor-humano.png',
    width: 58,
    height: 40,
    woodBorder: 2,
    cornerRadius: 4,
    hasSnow: true,
    snowAmount: 0.8
  });

  // 8. Street Stall 4 - Center-right background booth (Fundalas)
  // Situated on the right background stall gable: x: 560, y: 470
  const signFundalas = await makeStallSign({
    logoPath: 'public/assets/logos/clean-fundalas.png',
    width: 62,
    height: 42,
    woodBorder: 2,
    cornerRadius: 4,
    hasSnow: true,
    snowAmount: 0.8
  });

  // Composite all 8 signs onto their respective casitas!
  const compositePlan = [
    // 1. Right Cabin Big Gable (Campuslands)
    { input: signCampuslands, left: 915, top: 156 },

    // 2. Left Cabin Main Facade (IMEBU)
    { input: signImebu, left: 60, top: 540 },

    // 3. Mid-Right Cabin Gable (Dulces Mariposa)
    { input: signMariposa, left: 645, top: 395 },

    // 4. Right Cabin Candy Awning (Cajasan)
    { input: signCajasan, left: 830, top: 438 },

    // 5. Street Stall 1 (Practi Arepa)
    { input: signPracti, left: 350, top: 405 },

    // 6. Street Stall 2 (Angelus Seguridad)
    { input: signAngelus, left: 440, top: 440 },

    // 7. Street Stall 3 (Factor Humano)
    { input: signFactor, left: 495, top: 478 },

    // 8. Street Stall 4 (Fundalas)
    { input: signFundalas, left: 560, top: 470 },
  ];

  await sharp('public/assets/images/fondo-empresas.backup.webp')
    .composite(compositePlan)
    .webp({ quality: 92 })
    .toFile('../scratch_fondo_casitas_individuales.webp');

  console.log('Saved scratch_fondo_casitas_individuales.webp');
}

run().catch(console.error);
