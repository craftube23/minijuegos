import sharp from 'sharp';

/**
 * Bilinear quad interpolation P(u,v) for corners [TL, TR, BR, BL]
 */
function quadPoint(quad, u, v) {
  const [tl, tr, br, bl] = quad;
  const x = (1 - u) * (1 - v) * tl[0] + u * (1 - v) * tr[0] + u * v * br[0] + (1 - u) * v * bl[0];
  const y = (1 - u) * (1 - v) * tl[1] + u * (1 - v) * tr[1] + u * v * br[1] + (1 - u) * v * bl[1];
  return [x, y];
}

/**
 * Invert bilinear quad: given (x, y) and quad [TL, TR, BR, BL], find (u, v) in [0,1]^2
 */
function invertQuad(quad, x, y) {
  let u = 0.5, v = 0.5;
  const [tl, tr, br, bl] = quad;
  for (let iter = 0; iter < 6; iter++) {
    const px = (1 - u) * (1 - v) * tl[0] + u * (1 - v) * tr[0] + u * v * br[0] + (1 - u) * v * bl[0] - x;
    const py = (1 - u) * (1 - v) * tl[1] + u * (1 - v) * tr[1] + u * v * br[1] + (1 - u) * v * bl[1] - y;
    if (Math.abs(px) < 1e-5 && Math.abs(py) < 1e-5) break;

    const dxdU = -(1 - v) * tl[0] + (1 - v) * tr[0] + v * br[0] - v * bl[0];
    const dxdV = -(1 - u) * tl[0] - u * tr[0] + u * br[0] + (1 - u) * bl[0];
    const dydU = -(1 - v) * tl[1] + (1 - v) * tr[1] + v * br[1] - v * bl[1];
    const dydV = -(1 - u) * tl[1] - u * tr[1] + u * br[1] + (1 - u) * bl[1];

    const det = dxdU * dydV - dxdV * dydU;
    if (Math.abs(det) < 1e-10) break;
    u -= (px * dydV - py * dxdV) / det;
    v -= (dxdU * py - dydU * px) / det;
  }
  return [u, v];
}

function getPixel(data, W, H, x, y) {
  const xi = Math.max(0, Math.min(W - 1, Math.round(x)));
  const yi = Math.max(0, Math.min(H - 1, Math.round(y)));
  const idx = (yi * W + xi) * 4;
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
}

function setPixelBlend(data, W, H, x, y, r, g, b, alpha) {
  if (x < 0 || x >= W || y < 0 || y >= H || alpha <= 0) return;
  const idx = (y * W + x) * 4;
  const a = Math.max(0, Math.min(1, alpha));
  data[idx] = Math.round(data[idx] * (1 - a) + r * a);
  data[idx + 1] = Math.round(data[idx + 1] * (1 - a) + g * a);
  data[idx + 2] = Math.round(data[idx + 2] * (1 - a) + b * a);
}

/**
 * Sample bilinear RGBA from a logo buffer
 */
function sampleLogoBilinear(logo, u, v) {
  if (u < 0 || u > 1 || v < 0 || v > 1) return [0, 0, 0, 0];
  const fx = u * (logo.width - 1);
  const fy = v * (logo.height - 1);
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const x1 = Math.min(logo.width - 1, x0 + 1);
  const y1 = Math.min(logo.height - 1, y0 + 1);
  const dx = fx - x0, dy = fy - y0;

  const w00 = (1 - dx) * (1 - dy);
  const w10 = dx * (1 - dy);
  const w01 = (1 - dx) * dy;
  const w11 = dx * dy;

  const i00 = (y0 * logo.width + x0) * 4;
  const i10 = (y0 * logo.width + x1) * 4;
  const i01 = (y1 * logo.width + x0) * 4;
  const i11 = (y1 * logo.width + x1) * 4;

  const a00 = (logo.data[i00 + 3] / 255) * w00;
  const a10 = (logo.data[i10 + 3] / 255) * w10;
  const a01 = (logo.data[i01 + 3] / 255) * w01;
  const a11 = (logo.data[i11 + 3] / 255) * w11;
  const aSum = a00 + a10 + a01 + a11;
  if (aSum <= 1e-5) return [0, 0, 0, 0];

  const r = (logo.data[i00] * a00 + logo.data[i10] * a10 + logo.data[i01] * a01 + logo.data[i11] * a11) / aSum;
  const g = (logo.data[i00 + 1] * a00 + logo.data[i10 + 1] * a10 + logo.data[i01 + 1] * a01 + logo.data[i11 + 1] * a11) / aSum;
  const b = (logo.data[i00 + 2] * a00 + logo.data[i10 + 2] * a10 + logo.data[i01 + 2] * a01 + logo.data[i11 + 2] * a11) / aSum;
  return [r, g, b, aSum];
}

/**
 * Supersampled perspective logo projection onto a quad
 */
function projectLogoOnQuad(data, W, H, quad, logo, opts = {}) {
  const {
    uMin = 0.08, uMax = 0.92,
    vMin = 0.08, vMax = 0.92,
    warmTint = [1.0, 0.96, 0.90],
    opacity = 0.96,
    shadowOffset = null,
    clipFn = null
  } = opts;

  const xs = quad.map(p => p[0]);
  const ys = quad.map(p => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs)) - 2);
  const maxX = Math.min(W - 1, Math.ceil(Math.max(...xs)) + 2);
  const minY = Math.max(0, Math.floor(Math.min(...ys)) - 2);
  const maxY = Math.min(H - 1, Math.ceil(Math.max(...ys)) + 2);

  const N = 4;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (clipFn && !clipFn(x, y)) continue;

      if (shadowOffset) {
        const [sx, sy, sAlpha] = shadowOffset;
        const [su, sv] = invertQuad(quad, x - sx, y - sy);
        if (su >= uMin && su <= uMax && sv >= vMin && sv <= vMax) {
          const lu = (su - uMin) / (uMax - uMin);
          const lv = (sv - vMin) / (vMax - vMin);
          const [, , , sa] = sampleLogoBilinear(logo, lu, lv);
          if (sa > 0.05) {
            setPixelBlend(data, W, H, x, y, 25, 12, 5, sa * sAlpha);
          }
        }
      }

      let rAcc = 0, gAcc = 0, bAcc = 0, aAcc = 0;
      for (let sy = 0; sy < N; sy++) {
        for (let sx = 0; sx < N; sx++) {
          const px = x + (sx + 0.5) / N - 0.5;
          const py = y + (sy + 0.5) / N - 0.5;
          const [u, v] = invertQuad(quad, px, py);
          if (u >= uMin && u <= uMax && v >= vMin && v <= vMax) {
            const lu = (u - uMin) / (uMax - uMin);
            const lv = (v - vMin) / (vMax - vMin);
            const [lr, lg, lb, la] = sampleLogoBilinear(logo, lu, lv);
            if (la > 0) {
              rAcc += lr * la;
              gAcc += lg * la;
              bAcc += lb * la;
              aAcc += la;
            }
          }
        }
      }
      if (aAcc > 0) {
        const aAvg = (aAcc / (N * N)) * opacity;
        const rAvg = (rAcc / aAcc) * warmTint[0];
        const gAvg = (gAcc / aAcc) * warmTint[1];
        const bAvg = (bAcc / aAcc) * warmTint[2];
        setPixelBlend(data, W, H, x, y, rAvg, gAvg, bAvg, aAvg);
      }
    }
  }
}

/**
 * Clean a board in quad (u, v) space by sampling clean left & right strips for each v
 */
function cleanBoardQuad(data, W, H, quad, opts = {}) {
  const {
    leftStrip = [0.02, 0.06],
    rightStrip = [0.94, 0.98],
    uCleanRange = [0.02, 0.98],
    vCleanRange = [0.02, 0.98],
    featherU = 0.02,
    featherV = 0.02,
    skipFn = null,
    isCleanWoodPixel = null
  } = opts;

  const orig = Buffer.from(data);
  const STEPS_V = 240;
  const leftColors = new Array(STEPS_V);
  const rightColors = new Array(STEPS_V);

  for (let iv = 0; iv < STEPS_V; iv++) {
    const v = iv / (STEPS_V - 1);
    let lr = 0, lg = 0, lb = 0, lc = 0;
    for (let s = 0; s <= 10; s++) {
      const u = leftStrip[0] + (leftStrip[1] - leftStrip[0]) * (s / 10);
      const [px, py] = quadPoint(quad, u, v);
      const [r, g, b] = getPixel(orig, W, H, px, py);
      if (!isCleanWoodPixel || isCleanWoodPixel(r, g, b, px, py)) {
        lr += r; lg += g; lb += b; lc++;
      }
    }
    leftColors[iv] = lc > 0 ? [lr / lc, lg / lc, lb / lc] : null;

    let rr = 0, rg = 0, rb = 0, rc = 0;
    for (let s = 0; s <= 10; s++) {
      const u = rightStrip[0] + (rightStrip[1] - rightStrip[0]) * (s / 10);
      const [px, py] = quadPoint(quad, u, v);
      const [r, g, b] = getPixel(orig, W, H, px, py);
      if (!isCleanWoodPixel || isCleanWoodPixel(r, g, b, px, py)) {
        rr += r; rg += g; rb += b; rc++;
      }
    }
    rightColors[iv] = rc > 0 ? [rr / rc, rg / rc, rb / rc] : null;
  }

  function fillNulls(arr) {
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i]) {
        let prev = i - 1, next = i + 1;
        while (prev >= 0 && !arr[prev]) prev--;
        while (next < arr.length && !arr[next]) next++;
        if (prev >= 0 && next < arr.length) {
          const t = (i - prev) / (next - prev);
          arr[i] = [
            arr[prev][0] * (1 - t) + arr[next][0] * t,
            arr[prev][1] * (1 - t) + arr[next][1] * t,
            arr[prev][2] * (1 - t) + arr[next][2] * t
          ];
        } else if (prev >= 0) {
          arr[i] = [...arr[prev]];
        } else if (next < arr.length) {
          arr[i] = [...arr[next]];
        } else {
          arr[i] = [210, 168, 120];
        }
      }
    }
  }
  fillNulls(leftColors);
  fillNulls(rightColors);

  const xs = quad.map(p => p[0]);
  const ys = quad.map(p => p[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs)) - 1);
  const maxX = Math.min(W - 1, Math.ceil(Math.max(...xs)) + 1);
  const minY = Math.max(0, Math.floor(Math.min(...ys)) - 1);
  const maxY = Math.min(H - 1, Math.ceil(Math.max(...ys)) + 1);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (skipFn && skipFn(x, y)) continue;
      const [u, v] = invertQuad(quad, x, y);
      if (u < uCleanRange[0] || u > uCleanRange[1] || v < vCleanRange[0] || v > vCleanRange[1]) continue;

      let au = 1, av = 1;
      if (featherU > 0) {
        au = Math.min(1, (u - uCleanRange[0]) / featherU, (uCleanRange[1] - u) / featherU);
      }
      if (featherV > 0) {
        av = Math.min(1, (v - vCleanRange[0]) / featherV, (vCleanRange[1] - v) / featherV);
      }
      const alpha = Math.max(0, Math.min(1, Math.min(au, av)));

      const fv = Math.max(0, Math.min(1, v)) * (STEPS_V - 1);
      const iv0 = Math.floor(fv), iv1 = Math.min(STEPS_V - 1, iv0 + 1);
      const dv = fv - iv0;

      const lCol = [
        leftColors[iv0][0] * (1 - dv) + leftColors[iv1][0] * dv,
        leftColors[iv0][1] * (1 - dv) + leftColors[iv1][1] * dv,
        leftColors[iv0][2] * (1 - dv) + leftColors[iv1][2] * dv
      ];
      const rCol = [
        rightColors[iv0][0] * (1 - dv) + rightColors[iv1][0] * dv,
        rightColors[iv0][1] * (1 - dv) + rightColors[iv1][1] * dv,
        rightColors[iv0][2] * (1 - dv) + rightColors[iv1][2] * dv
      ];

      const t = Math.max(0, Math.min(1, (u - leftStrip[1]) / (rightStrip[0] - leftStrip[1])));
      const cr = lCol[0] * (1 - t) + rCol[0] * t;
      const cg = lCol[1] * (1 - t) + rCol[1] * t;
      const cb = lCol[2] * (1 - t) + rCol[2] * t;

      setPixelBlend(data, W, H, x, y, cr, cg, cb, alpha);
    }
  }
}

async function loadRawLogo(path, cropBox = null) {
  let pipeline = sharp(path).ensureAlpha();
  if (cropBox) pipeline = pipeline.extract(cropBox);
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

async function loadWhiteBgLogoAsTransparent(path, cropBox = null) {
  let pipeline = sharp(path).ensureAlpha();
  if (cropBox) pipeline = pipeline.extract(cropBox);
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const minC = Math.min(r, g, b);
    const maxC = Math.max(r, g, b);
    const sat = maxC - minC;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 246 && sat < 12) {
      data[i + 3] = 0;
    } else if (lum > 215 && sat < 25) {
      const alpha = Math.max(0, Math.min(1, (248 - lum) / 33));
      data[i + 3] = Math.round(alpha * 255);
      if (alpha > 0.05) {
        data[i] = Math.max(0, Math.round((r - 255 * (1 - alpha)) / alpha));
        data[i + 1] = Math.max(0, Math.round((g - 255 * (1 - alpha)) / alpha));
        data[i + 2] = Math.max(0, Math.round((b - 255 * (1 - alpha)) / alpha));
      }
    }
  }
  return { data, width: info.width, height: info.height };
}

async function main() {
  const srcPath = 'public/assets/images/fondo-empresas.original-vertical.webp';
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  console.log(`Loaded original vertical image: ${W}x${H}`);

  const isWarmWood = (r, g, b) => (r > 135 && g > 95 && b > 60 && (r - b) > 35 && (r - g) > 12 && (r - g) < 68);
  const isCleanParchment = (r, g, b) => (r > 180 && g > 150 && b > 120 && Math.abs(r - g) < 45);

  // =========================================================================
  // 1. FUNDALAS (Front-left cabin, left hanging board)
  // =========================================================================
  const fundalasQuad = [
    [37, 888],   // TL (actual top-left inner corner above y=900!)
    [182, 934],  // TR (actual top-right inner corner)
    [182, 1119], // BR
    [37, 1091]   // BL
  ];
  cleanBoardQuad(data, W, H, fundalasQuad, {
    leftStrip: [0.01, 0.045],
    rightStrip: [0.96, 0.99],
    uCleanRange: [0.015, 0.985],
    vCleanRange: [0.02, 0.96],
    featherU: 0.015,
    featherV: 0.02,
    isCleanWoodPixel: isWarmWood,
    skipFn: (x, y) => (x < 50 && y > 1082) || (x > 165 && y > 1102)
  });
  const fundalasLogo = await loadRawLogo('public/assets/logos/clean-fundalas.png');
  projectLogoOnQuad(data, W, H, fundalasQuad, fundalasLogo, {
    uMin: 0.08, uMax: 0.92,
    vMin: 0.12, vMax: 0.91,
    warmTint: [1.0, 0.96, 0.90],
    opacity: 0.95
  });

  // =========================================================================
  // 2. FACTOR HUMANO (Front-left cabin, right hanging board)
  // =========================================================================
  const factorQuad = [
    [601, 956],  // TL
    [722, 987],  // TR
    [722, 1164], // BR
    [601, 1138]  // BL
  ];
  cleanBoardQuad(data, W, H, factorQuad, {
    leftStrip: [0.015, 0.08],
    rightStrip: [0.925, 0.985],
    uCleanRange: [0.02, 0.98],
    vCleanRange: [0.015, 0.97],
    featherU: 0.015,
    featherV: 0.02,
    isCleanWoodPixel: isWarmWood
  });
  const factorLogo = await loadRawLogo('public/assets/logos/horiz-factor-humano.png');
  for (let y = 0; y < 35; y++) {
    for (let x = 0; x < factorLogo.width; x++) {
      const idx = (y * factorLogo.width + x) * 4;
      const g = factorLogo.data[idx + 1], b = factorLogo.data[idx + 2], a = factorLogo.data[idx + 3];
      if (a > 0 && (g > 50 || b > 50 || x < 98)) {
        factorLogo.data[idx + 3] = 0;
      }
    }
  }
  projectLogoOnQuad(data, W, H, factorQuad, factorLogo, {
    uMin: 0.07, uMax: 0.93,
    vMin: 0.09, vMax: 0.91,
    warmTint: [1.0, 0.95, 0.88],
    opacity: 0.95
  });

  // =========================================================================
  // 3. DULCES MARIPOSA (Middle-left cabin board)
  // =========================================================================
  const mariposaQuad = [
    [736, 1163], // TL
    [882, 1196], // TR
    [882, 1267], // BR
    [736, 1244]  // BL
  ];
  cleanBoardQuad(data, W, H, mariposaQuad, {
    leftStrip: [0.01, 0.04],
    rightStrip: [0.93, 0.98],
    uCleanRange: [0.03, 0.96],
    vCleanRange: [0.06, 0.94],
    featherU: 0.02,
    featherV: 0.04
  });
  const mariposaLogo = await loadRawLogo('public/assets/logos/clean-mariposa.png');
  projectLogoOnQuad(data, W, H, mariposaQuad, mariposaLogo, {
    uMin: 0.05, uMax: 0.94,
    vMin: 0.16, vMax: 0.84,
    warmTint: [1.0, 0.96, 0.88],
    opacity: 0.96,
    shadowOffset: [1.2, 1.5, 0.30]
  });

  // =========================================================================
  // 4. CAJASAN (Center background cabin white signboard)
  // =========================================================================
  const cajasanQuad = [
    [999, 1190],  // TL
    [1156, 1190], // TR
    [1156, 1259], // BR
    [999, 1259]   // BL
  ];
  cleanBoardQuad(data, W, H, cajasanQuad, {
    leftStrip: [0.01, 0.035],
    rightStrip: [0.96, 0.985],
    uCleanRange: [0.02, 0.98],
    vCleanRange: [0.05, 0.95],
    featherU: 0.02,
    featherV: 0.04
  });
  const cajasanLogo = await loadRawLogo('public/assets/logos/clean-cajasan.png');
  projectLogoOnQuad(data, W, H, cajasanQuad, cajasanLogo, {
    uMin: 0.06, uMax: 0.94,
    vMin: 0.14, vMax: 0.86,
    warmTint: [0.98, 0.99, 1.0],
    opacity: 0.96
  });

  // =========================================================================
  // 5. ÁNGELUS SEGURIDAD (Middle-right cabin shield signboard)
  // =========================================================================
  const angelusWoodQuad = [
    [1250, 1068], // TL
    [1351, 1044], // TR
    [1351, 1212], // BR
    [1250, 1236]  // BL
  ];
  cleanBoardQuad(data, W, H, angelusWoodQuad, {
    leftStrip: [0.01, 0.05],
    rightStrip: [0.92, 0.97],
    uCleanRange: [0.04, 0.94],
    vCleanRange: [0.02, 0.98],
    featherU: 0.025,
    featherV: 0.025,
    isCleanWoodPixel: isWarmWood,
    skipFn: (x, y) => {
      const garlandBottomY = x < 1298
        ? 1080 - (x - 1255) * (26 / 43)
        : 1054;
      if (y < garlandBottomY) return true;
      if (x > 1332 && y > 1195) return true;
      return false;
    }
  });
  const angelusLogo = await loadRawLogo('public/assets/logos/clean-angelus.png');
  const angelusShieldQuad = [
    [1256, 1071], // TL
    [1343, 1050], // TR
    [1343, 1200], // BR
    [1256, 1221]  // BL
  ];
  projectLogoOnQuad(data, W, H, angelusShieldQuad, angelusLogo, {
    uMin: 0.0, uMax: 1.0,
    vMin: 0.0, vMax: 1.0,
    warmTint: [1.0, 0.97, 0.92],
    opacity: 0.97,
    shadowOffset: [2.0, 2.5, 0.32]
  });

  // =========================================================================
  // 6. CAMPUSLANDS (Front-right cabin gable white signboard)
  // =========================================================================
  for (let y = 965; y <= 1191; y++) {
    for (let x = 1425; x <= 1615; x++) {
      const topYLeft = 1029 + (x - 1425) * (965 - 1029) / (1582 - 1425);
      const topYRight = 965 + (x - 1582) * (1004 - 965) / (1615 - 1582);
      const minY = Math.max(topYLeft, topYRight) + 2;
      const maxY = 1190 + (x - 1425) * (1143 - 1190) / (1615 - 1425) - 2;
      if (y >= minY && y <= maxY && x >= 1427 && x <= 1613) {
        const dEdge = Math.min(y - minY, maxY - y, x - 1427, 1613 - x);
        const alpha = Math.min(1, dEdge / 2.5);
        const dist = Math.hypot((x - 1518) / 95, (y - 1078) / 95);
        const t = Math.min(1, dist * 0.85);
        const cr = 254 * (1 - t) + 190 * t;
        const cg = 252 * (1 - t) + 204 * t;
        const cb = 247 * (1 - t) + 221 * t;
        setPixelBlend(data, W, H, x, y, cr, cg, cb, alpha);
      }
    }
  }
  const campusLogo = await loadRawLogo('public/assets/logos/clean-campuslands.png');
  const campusQuad = [
    [1430, 1018], // TL
    [1608, 966],  // TR
    [1610, 1138], // BR
    [1430, 1184]  // BL
  ];
  projectLogoOnQuad(data, W, H, campusQuad, campusLogo, {
    uMin: 0.04, uMax: 0.96,
    vMin: 0.06, vMax: 0.94,
    warmTint: [0.99, 0.98, 0.96],
    opacity: 0.96
  });

  // =========================================================================
  // 7. PRACTI AREPA (Front-right cabin, far-right hanging board)
  // =========================================================================
  const practiQuad = [
    [1662, 976],  // TL
    [1817, 937],  // TR
    [1817, 1118], // BR
    [1662, 1158]  // BL
  ];
  cleanBoardQuad(data, W, H, practiQuad, {
    leftStrip: [0.008, 0.045],
    rightStrip: [0.955, 0.992],
    uCleanRange: [0.015, 0.988],
    vCleanRange: [0.005, 0.985],
    featherU: 0.015,
    featherV: 0.015,
    isCleanWoodPixel: isWarmWood,
    skipFn: (x, y) => {
      const [r, g, b] = getPixel(data, W, H, x, y);
      if (y < 986 && g >= r - 6) return true;
      if (x < 1688 && y > 1152) return true;
      if (x < 1688 && y > 1142 && (r - g) > 45 && r > 110) return true;
      if (x > 1790 && y > 1110) return true;
      return false;
    }
  });
  const practiLogo = await loadRawLogo('public/assets/logos/clean-practi-arepa.png');
  projectLogoOnQuad(data, W, H, practiQuad, practiLogo, {
    uMin: 0.05, uMax: 0.95,
    vMin: 0.07, vMax: 0.91,
    warmTint: [1.0, 0.96, 0.89],
    opacity: 0.97,
    shadowOffset: [1.5, 2.0, 0.25],
    clipFn: (x, y) => {
      if (x < 1686 && y > 1148) return false;
      if (x > 1792 && y > 1112) return false;
      return true;
    }
  });

  // =========================================================================
  // 8. IMEBU (Central foreground standing signboard in the snow)
  // =========================================================================
  const imebuQuad = [
    [806, 1626],  // TL
    [1104, 1623], // TR
    [1104, 1802], // BR
    [806, 1798]   // BL
  ];
  cleanBoardQuad(data, W, H, imebuQuad, {
    leftStrip: [0.02, 0.05],
    rightStrip: [0.955, 0.985],
    uCleanRange: [0.03, 0.985],
    vCleanRange: [0.08, 0.91],
    featherU: 0.015,
    featherV: 0.03,
    isCleanWoodPixel: isCleanParchment,
    skipFn: (x, y) => (y < 1640 || y > 1782) && (x < 822 || x > 1088)
  });
  const imebuHighRes = await loadWhiteBgLogoAsTransparent('public/assets/logos/logo-imebu.jpg', {
    left: 165, top: 440, width: 1175, height: 335
  });
  projectLogoOnQuad(data, W, H, imebuQuad, imebuHighRes, {
    uMin: 0.07, uMax: 0.93,
    vMin: 0.22, vMax: 0.79,
    warmTint: [0.96, 0.91, 0.84],
    opacity: 0.95
  });

  // =========================================================================
  // 9. ALCALDÍA DE BUCARAMANGA (Hanging vertical banner on post)
  // =========================================================================
  const bannerQuad = [
    [1103, 1302], // TL
    [1217, 1300], // TR
    [1217, 1450], // BR
    [1103, 1450]  // BL
  ];
  cleanBoardQuad(data, W, H, bannerQuad, {
    leftStrip: [0.005, 0.03],
    rightStrip: [0.97, 0.995],
    uCleanRange: [0.01, 0.99],
    vCleanRange: [0.12, 0.97],
    featherU: 0.01,
    featherV: 0.03,
    isCleanWoodPixel: isCleanParchment
  });
  const alcaldiaHighRes = await loadWhiteBgLogoAsTransparent('public/assets/logos/logo-imebu.jpg', {
    left: 165, top: 465, width: 235, height: 280
  });
  projectLogoOnQuad(data, W, H, bannerQuad, alcaldiaHighRes, {
    uMin: 0.14, uMax: 0.86,
    vMin: 0.14, vMax: 0.93,
    warmTint: [0.97, 0.92, 0.85],
    opacity: 0.95
  });

  // =========================================================================
  // 10. FERIA MÁGICA DEL JUGUETE (Fix "DONDE VIVE LA MAGIA" & "DEL" ribbons)
  // =========================================================================
  // 10a. Clean the gibberish inside the bottom green ribbon (x: 310..486, y: 1074..1122)
  for (let y = 1072; y <= 1122; y++) {
    for (let x = 310; x <= 486; x++) {
      const t = (x - 310) / (486 - 310);
      const topCurve = 1094 - 18 * t - 3.5 * Math.sin(Math.PI * t);
      const botCurve = 1118 - 17 * t - 3.5 * Math.sin(Math.PI * t);
      if (y >= topCurve && y <= botCurve) {
        const [r, g, b] = getPixel(data, W, H, x, y);
        if (r > 40 || g > 52) {
          setPixelBlend(data, W, H, x, y, 22, 39, 23, 0.95);
        }
      }
    }
  }

  // 10b. Extract ONLY the gold lettering of "✦ DONDE VIVE LA MAGIA ✦" from clean-feria-magica.png
  // In clean-feria-magica.png (482x472), the text is in x: 162..414, y: 365..434
  const feriaSubtitleOnly = await loadRawLogo('public/assets/logos/clean-feria-magica.png', {
    left: 162, top: 365, width: 252, height: 69
  });
  for (let y = 0; y < feriaSubtitleOnly.height; y++) {
    for (let x = 0; x < feriaSubtitleOnly.width; x++) {
      const idx = (y * feriaSubtitleOnly.width + x) * 4;
      const r = feriaSubtitleOnly.data[idx], g = feriaSubtitleOnly.data[idx + 1], b = feriaSubtitleOnly.data[idx + 2];
      // Keep only the bright warm gold letter pixels (exclude red JUGUETE above y < 22+... and dark green background)
      const isRedJug = (r - g) > 78;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // Gold border at top/bottom of ribbon vs inner text: inner text is within narrow vertical band around center line
      const t = x / feriaSubtitleOnly.width;
      const centerLineY = 48 - 32 * t; // goes from y=48 on left to y=16 on right
      const distY = Math.abs(y - centerLineY);
      if (isRedJug || distY > 13 || lum < 75) {
        feriaSubtitleOnly.data[idx + 3] = 0;
      } else {
        const a = Math.min(1, (lum - 70) / 55) * Math.min(1, (13.5 - distY) / 2.5);
        feriaSubtitleOnly.data[idx + 3] = Math.round(a * 255);
      }
    }
  }

  // Project the gold "✦ DONDE VIVE LA MAGIA ✦" text onto the cleaned green ribbon in the vertical image
  const subtitleQuad = [
    [313, 1081], // TL
    [483, 1079], // TR
    [483, 1122], // BR
    [313, 1124]  // BL
  ];
  projectLogoOnQuad(data, W, H, subtitleQuad, feriaSubtitleOnly, {
    uMin: 0.0, uMax: 1.0,
    vMin: 0.0, vMax: 1.0,
    warmTint: [1.0, 0.97, 0.90],
    opacity: 0.98,
    shadowOffset: [1.0, 1.2, 0.55]
  });

  // 10c. Project the "✦ DEL" ribbon from backup_feria_crop.png / clean-feria-magica.png
  const delRibbonLogo = await loadRawLogo('public/assets/logos/clean-feria-magica.png', {
    left: 405, top: 152, width: 74, height: 64
  });
  for (let y = 0; y < delRibbonLogo.height; y++) {
    for (let x = 0; x < delRibbonLogo.width; x++) {
      const idx = (y * delRibbonLogo.width + x) * 4;
      const r = delRibbonLogo.data[idx], g = delRibbonLogo.data[idx + 1];
      // Exclude red/cream edge of 'A' on the left (x < 9) or red of 'E' at bottom (y > 54)
      if ((x < 9 && r > 140) || (y > 52 && (r - g) > 65)) {
        delRibbonLogo.data[idx + 3] = 0;
      } else if (x < 6) {
        delRibbonLogo.data[idx + 3] = Math.round(delRibbonLogo.data[idx + 3] * (x / 6));
      }
    }
  }
  const delQuad = [
    [490, 938], // TL
    [542, 938], // TR
    [542, 983], // BR
    [490, 983]  // BL
  ];
  projectLogoOnQuad(data, W, H, delQuad, delRibbonLogo, {
    uMin: 0.0, uMax: 1.0,
    vMin: 0.0, vMax: 1.0,
    warmTint: [1.0, 0.95, 0.88],
    opacity: 0.96
  });

  // Save final high-res WebP to public/assets/images/fondo-empresas.webp
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 95 })
    .toFile('public/assets/images/fondo-empresas.webp');

  console.log('Successfully updated public/assets/images/fondo-empresas.webp!');

  // Save updated verification crops for the 4 refined regions
  const verifyRegions = [
    { name: 'fundalas', x: 0, y: 840, w: 210, h: 310 },
    { name: 'feria', x: 200, y: 820, w: 360, h: 350 },
    { name: 'alcaldia_banner', x: 1080, y: 1280, w: 160, h: 250 },
    { name: 'imebu', x: 780, y: 1610, w: 360, h: 230 }
  ];

  for (const r of verifyRegions) {
    await sharp(data, { raw: { width: W, height: H, channels: 4 } })
      .extract({ left: r.x, top: r.y, width: r.w, height: r.h })
      .png()
      .toFile(`scratch/verify_${r.name}.png`);
  }
  console.log('Saved refined verification crops.');
}

main().catch(console.error);
