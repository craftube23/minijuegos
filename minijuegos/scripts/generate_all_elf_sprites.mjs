import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s, l];
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function createMedallionSvg(borderColor = '#D97706') {
  return `
  <svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gold3d" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFF59D" />
        <stop offset="25%" stop-color="#FBC02D" />
        <stop offset="50%" stop-color="#D97706" />
        <stop offset="75%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#78350F" />
      </linearGradient>
      <radialGradient id="pearlBg" cx="45%" cy="40%" r="55%">
        <stop offset="0%" stop-color="#FFFFFF" />
        <stop offset="85%" stop-color="#F8FAFC" />
        <stop offset="100%" stop-color="#E2E8F0" />
      </radialGradient>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.45" />
      </filter>
    </defs>
    <g filter="url(#dropShadow)" transform="translate(250, 82)">
      <!-- 8-point gold star rays -->
      <path d="M 0 -42 L 8 -24 L 28 -28 L 20 -10 L 40 0 L 20 10 L 28 28 L 8 24 L 0 42 L -8 24 L -28 28 L -20 10 L -40 0 L -20 -10 L -28 -28 L -8 -24 Z"
            fill="url(#gold3d)" stroke="#FFF9C4" stroke-width="1.2" />
      <!-- Ornate Outer Ring -->
      <circle cx="0" cy="0" r="32" fill="url(#gold3d)" stroke="#FFF9C4" stroke-width="1.5" />
      <!-- Inner Pearl Disc -->
      <circle cx="0" cy="0" r="26" fill="url(#pearlBg)" stroke="${borderColor}" stroke-width="1.2" />
      <circle cx="0" cy="0" r="24" fill="none" stroke="#F59E0B" stroke-width="0.8" stroke-dasharray="2,1.5" />
    </g>
  </svg>
  `;
}

const SPONSORS_CONFIG = [
  {
    id: 'cajasan',
    name: 'Elfo Cajasan',
    logoFile: 'clean-cajasan.png',
    logoWidth: 46,
    primaryHue: 216,
    primarySat: 0.90,
    primaryLightMult: 1.0,
    primaryLightAdd: 0.0,
    secondaryHue: 196,
    secondarySat: 0.95,
    secondaryLightMult: 1.05,
    secondaryLightAdd: 0.0,
    shadowHue: 216,
    medallionBorder: '#0B4F9C'
  },
  {
    id: 'practi',
    name: 'Elfo Practi Arepa',
    logoFile: 'clean-practi-arepa.png',
    logoWidth: 48,
    primaryHue: 42,
    primarySat: 0.95,
    primaryLightMult: 1.0,
    primaryLightAdd: 0.16,
    secondaryHue: 356,
    secondarySat: 0.88,
    secondaryLightMult: 0.92,
    secondaryLightAdd: 0.0,
    shadowHue: 350,
    medallionBorder: '#D97706'
  },
  {
    id: 'mariposa',
    name: 'Elfo Dulces Mariposa',
    logoFile: 'clean-mariposa.png',
    logoWidth: 48,
    primaryHue: 46,
    primarySat: 0.95,
    primaryLightMult: 1.0,
    primaryLightAdd: 0.14,
    secondaryHue: 335,
    secondarySat: 0.85,
    secondaryLightMult: 0.95,
    secondaryLightAdd: 0.0,
    shadowHue: 335,
    medallionBorder: '#E11D48'
  },
  {
    id: 'angelus',
    name: 'Elfo Ángelus',
    logoFile: 'clean-angelus.png',
    logoWidth: 46,
    primaryHue: 210,
    primarySat: 0.14, // Metallic Silver
    primaryLightMult: 1.0,
    primaryLightAdd: 0.12,
    secondaryHue: 216,
    secondarySat: 0.90, // Sapphire Blue
    secondaryLightMult: 0.90,
    secondaryLightAdd: 0.0,
    shadowHue: 215,
    medallionBorder: '#1E3A8A'
  },
  {
    id: 'factor',
    name: 'Elfo Factor Humano',
    logoFile: 'clean-factor-humano.png',
    logoWidth: 46,
    primaryHue: 355,
    primarySat: 0.92, // Deep Ruby Red
    primaryLightMult: 0.95,
    primaryLightAdd: 0.0,
    secondaryHue: 210,
    secondarySat: 0.15, // Charcoal Platinum
    secondaryLightMult: 0.85,
    secondaryLightAdd: 0.0,
    shadowHue: 350,
    medallionBorder: '#B91C1C'
  },
  {
    id: 'fundalas',
    name: 'Elfo Fundalas',
    logoFile: 'clean-fundalas.png',
    logoWidth: 46,
    primaryHue: 218,
    primarySat: 0.90, // Deep Cobalt Marine
    primaryLightMult: 0.95,
    primaryLightAdd: 0.0,
    secondaryHue: 190,
    secondarySat: 0.95, // Caribbean Sky Cyan
    secondaryLightMult: 1.10,
    secondaryLightAdd: 0.0,
    shadowHue: 220,
    medallionBorder: '#0284C7'
  },
  {
    id: 'imebu',
    name: 'Elfo IMEBU',
    logoFile: 'clean-imebu.png',
    logoWidth: 48,
    primaryHue: 142,
    primarySat: 0.85, // Emerald Forest Green
    primaryLightMult: 0.95,
    primaryLightAdd: 0.0,
    secondaryHue: 46,
    secondarySat: 0.95, // Golden Sunshine
    secondaryLightMult: 1.0,
    secondaryLightAdd: 0.14,
    shadowHue: 145,
    medallionBorder: '#15803D'
  }
];

async function generateAllElves() {
  const baseImgPath = 'public/assets/images/elfo-volador-campus.png';
  const { data: baseRaw, info } = await sharp(baseImgPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  console.log(`Starting generation of ${SPONSORS_CONFIG.length} sponsor elves...`);

  for (const sp of SPONSORS_CONFIG) {
    const out = Buffer.from(baseRaw);

    // 1. Clear astronaut helmet in the flap center (smooth starry gradient)
    for (let y = 52; y <= 110; y++) {
      for (let x = 215; x <= 285; x++) {
        const d = Math.hypot(x - 250, (y - 82) * 1.15);
        if (d < 30) {
          const idx = (y * w + x) * 4;
          const progY = (y - 52) / 58;
          out[idx] = Math.round(20 - progY * 5);
          out[idx+1] = Math.round(35 - progY * 10);
          out[idx+2] = Math.round(105 - progY * 20);
        }
      }
    }

    // 2. Pixel classification and recoloring
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const alpha = out[idx + 3];
        if (alpha < 15) continue;

        const r = out[idx], g = out[idx+1], b = out[idx+2];
        const [hue, sat, light] = rgbToHsl(r, g, b);

        // Keep gold stitches, bells, buckles: Hue 35 - 58
        if (hue >= 35 && hue <= 58 && sat > 0.25) continue;
        // Keep skin tones: Hue 15 - 35, high lightness
        if (hue >= 15 && hue <= 35 && light > 0.50) continue;
        // Keep red scarf & lips: Hue > 340 or Hue < 15
        if ((hue > 340 || hue < 15) && sat > 0.25) continue;
        // Keep brown leather boots and hair: Hue 18 - 35, low lightness
        if (hue >= 18 && hue <= 35 && sat < 0.55 && light < 0.50 && y > 210) continue;

        // Check Cyan areas (Hue 165 - 200) -> Secondary Color
        if (hue >= 165 && hue <= 200 && sat > 0.18) {
          const newLight = Math.max(0.05, Math.min(0.95, light * sp.secondaryLightMult + sp.secondaryLightAdd));
          const [nr, ng, nb] = hslToRgb(sp.secondaryHue, sp.secondarySat, newLight);
          out[idx] = nr; out[idx+1] = ng; out[idx+2] = nb;
        }
        // Check Deep Blue panels, hat, tunic (Hue 201 - 250) -> Primary Color
        else if (hue > 200 && hue <= 250 && sat > 0.12) {
          const newLight = Math.max(0.05, Math.min(0.95, light * sp.primaryLightMult + sp.primaryLightAdd));
          const [nr, ng, nb] = hslToRgb(sp.primaryHue, sp.primarySat, newLight);
          out[idx] = nr; out[idx+1] = ng; out[idx+2] = nb;
        }
        // Check underside purple/indigo shadow (Hue 251 - 285) in parachute (y < 210)
        else if (hue > 250 && hue <= 285 && y < 210 && sat > 0.12) {
          const [nr, ng, nb] = hslToRgb(sp.shadowHue, Math.min(0.65, sat), light * 0.9);
          out[idx] = nr; out[idx+1] = ng; out[idx+2] = nb;
        }
      }
    }

    // 3. Create Medallion & Composite Official Clean Logo
    const medallionSvg = createMedallionSvg(sp.medallionBorder);
    const medallionBuf = await sharp(Buffer.from(medallionSvg)).png().toBuffer();

    const logoPath = path.join('public/assets/logos', sp.logoFile);
    const logoBuf = await sharp(logoPath)
      .resize(sp.logoWidth, null, { fit: 'inside' })
      .toBuffer();
    const logoMeta = await sharp(logoBuf).metadata();

    const finalElfBuf = await sharp(out, { raw: { width: w, height: h, channels: 4 } })
      .composite([
        { input: medallionBuf, left: 0, top: 0 },
        {
          input: logoBuf,
          left: Math.round(250 - logoMeta.width / 2),
          top: Math.round(82 - logoMeta.height / 2)
        }
      ])
      .png()
      .toBuffer();

    // 4. Save Main Elf Sprite: elfo-volador-<id>.png
    const elfOutFile = `public/assets/images/elfo-volador-${sp.id}.png`;
    await sharp(finalElfBuf).toFile(elfOutFile);

    // 5. Generate Matching Icon: icon-elfo-<id>.png (256x216)
    const iconOutFile = `public/assets/images/icon-elfo-${sp.id}.png`;
    await sharp(finalElfBuf)
      .extract({ left: 70, top: 195, width: 360, height: 304 })
      .resize(256, 216)
      .toFile(iconOutFile);

    console.log(`✓ Generated: ${elfOutFile} and ${iconOutFile}`);
  }

  // 6. Generate a 3x3 Showcase Collage of ALL 9 Elves for review!
  console.log('Generating 9-Elf showcase grid...');
  const all9 = [
    { id: 'feria', name: 'Feria Mágica', file: 'public/assets/images/elfo-volador.png' },
    { id: 'campus', name: 'Campuslands', file: 'public/assets/images/elfo-volador-campus.png' },
    { id: 'cajasan', name: 'Cajasan', file: 'public/assets/images/elfo-volador-cajasan.png' },
    { id: 'practi', name: 'Practi Arepa', file: 'public/assets/images/elfo-volador-practi.png' },
    { id: 'mariposa', name: 'Dulces Mariposa', file: 'public/assets/images/elfo-volador-mariposa.png' },
    { id: 'angelus', name: 'Ángelus Seguridad', file: 'public/assets/images/elfo-volador-angelus.png' },
    { id: 'factor', name: 'Factor Humano', file: 'public/assets/images/elfo-volador-factor.png' },
    { id: 'fundalas', name: 'Fundalas', file: 'public/assets/images/elfo-volador-fundalas.png' },
    { id: 'imebu', name: 'IMEBU', file: 'public/assets/images/elfo-volador-imebu.png' },
  ];

  const cellW = 320, cellH = 340;
  const gridW = cellW * 3, gridH = cellH * 3;
  const composites = [];

  for (let i = 0; i < all9.length; i++) {
    const item = all9[i];
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = col * cellW;
    const y = row * cellH;

    const resizedElf = await sharp(item.file)
      .resize(cellW - 20, cellH - 50, { fit: 'inside' })
      .toBuffer();
    const meta = await sharp(resizedElf).metadata();

    // Text card overlay SVG
    const cardSvg = `
    <svg width="${cellW}" height="${cellH}" viewBox="0 0 ${cellW} ${cellH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="100%" stop-color="#020617" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="${cellW - 12}" height="${cellH - 12}" rx="16" fill="url(#bgGrad)" stroke="#334155" stroke-width="2" />
      <rect x="20" y="${cellH - 42}" width="${cellW - 40}" height="28" rx="8" fill="#1E293B" stroke="#F59E0B" stroke-width="1.5" />
      <text x="${cellW / 2}" y="${cellH - 24}" fill="#FDE047" font-family="'Outfit', sans-serif" font-size="14" font-weight="bold" text-anchor="middle">${item.name}</text>
    </svg>
    `;
    const cardBuf = await sharp(Buffer.from(cardSvg)).png().toBuffer();

    composites.push({ input: cardBuf, left: x, top: y });
    composites.push({
      input: resizedElf,
      left: Math.round(x + (cellW - meta.width) / 2),
      top: Math.round(y + 12 + (cellH - 50 - meta.height) / 2)
    });
  }

  const gridImage = await sharp({
    create: {
      width: gridW,
      height: gridH,
      channels: 4,
      background: { r: 10, g: 15, b: 30, alpha: 1 }
    }
  })
  .composite(composites)
  .png()
  .toBuffer();

  const showcasePath = 'public/assets/images/showcase_9_elfos.png';
  await sharp(gridImage).toFile(showcasePath);
  console.log(`✓ Showcase grid saved to: ${showcasePath}`);
}

generateAllElves().catch(err => {
  console.error('Error generating elves:', err);
  process.exit(1);
});
