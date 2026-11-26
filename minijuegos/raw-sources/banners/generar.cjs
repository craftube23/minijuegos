// Genera public/assets/banners/finales/<id>.webp (1620x482). Uso: node raw-sources/banners/generar.cjs
const path = require('path'), fs = require('fs'), os = require('os'), url = require('url'), cp = require('child_process');
const P = path.resolve(__dirname, '../..'), sharp = require(P + '/node_modules/sharp');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'banners-'));
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const href = f => url.pathToFileURL(f).href;

// Recorta el fondo blanco de cada foto (relleno desde los bordes)
async function cut(col, row, name, size) {
  const { data, info } = await sharp(__dirname + '/fotos-canva.png')
    .extract({ left: col * size, top: row * size, width: size, height: size }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info, seen = new Uint8Array(w * h), q = [];
  const min = i => Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  const push = i => { if (!seen[i] && min(i) > 240) { seen[i] = 1; q.push(i); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (q.length) {
    const i = q.pop(), x = i % w;
    if (x) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  const edge = [];
  for (let i = 0; i < w * h; i++) if (!seen[i] && (seen[i - 1] || seen[i + 1] || seen[i - w] || seen[i + w])) edge.push(i);
  for (let i = 0; i < w * h; i++) if (seen[i]) data[i * 4 + 3] = 0;
  for (const i of edge) { const m = min(i); if (m > 190) data[i * 4 + 3] = Math.round(255 * (255 - m) / 65); }
  await sharp(data, { raw: info }).resize(600).png().toFile(`${TMP}/${name}.png`);
}

// id, arte, foto ('' = sin foto), lado del logo cuando no hay foto, antetítulo, titular, detalle, botón
const S = [
  ['official-event-info', 8, 'toys', '', 'Bucaramanga, gran apertura navideña', 'Del <b>1 al 24</b> de diciembre<br>entrada <b>libre</b>', 'Centro Cultural del Oriente, todos los días', '10:00 AM a 9:00 PM'],
  ['hero-fundalas', 7, 'gift', '', 'Campaña Navidad con corazón', '¡Dibuja una <b>sonrisa</b><br>en un niño!', 'Comedores, juguetes y formación en Santander', 'Dona en la feria'],
  ['hero-factor-humano', 4, 'team', '', 'Potencia el crecimiento de tu negocio', '¡El mejor <b>equipo humano</b><br>para tu empresa!', 'Headhunting, selección y consultoría', 'Talento para 2027'],
  ['official-event-experience', 5, 'tree', '', 'La experiencia más mágica del año', '¡La Navidad más<br><b>mágica</b> de Santander!', 'Nevada artificial, túnel de luces y coros en vivo', 'Ven en familia'],
  ['hero-campuslands', 1, '', 'r', 'Revolución tech en Santander', '¡<b>Beca 100%</b> en<br>programación e IA!', 'Fórmate desde cero con empresas globales', 'Postúlate'],
  ['hero-angelus', 11, '', 'l', 'Tranquilidad en estas fiestas', '¡Seguridad de <b>élite</b><br>y monitoreo <b>24/7</b>!', 'Videovigilancia, alarmas y patrullaje motorizado', 'Protege tu hogar'],
  ['official-event-games', 6, 'toys', '', 'Zona gamer táctil', '¡<b>Juega gratis</b> en<br>pantallas gigantes!', '10 minijuegos navideños, récords y premios', 'Toca y juega'],
  ['hero-practi-arepa', 8, 'arepa', '', 'El auténtico sabor santandereano', '¡Calientitas, crujientes<br>y <b>100% puro maíz</b>!', 'Maíz seleccionado, queso fresco y asado al carbón', 'Pruébalas en la feria'],
  ['hero-mariposa', 3, 'obleas', '', 'Tradición dulce que enamora', '¡Obleas con <b>arequipe</b><br>artesanal!', 'Cortados de leche de cabra y dulces navideños', 'Endulza tu Navidad'],
  ['official-event-invite', 12, 'toys', '', 'Más de 50 fabricantes directos', '¡El gran mercado<br>del <b>juguete</b>!', 'Precios de fábrica: muñecas, drones y peluches', 'Visítanos'],
  ['hero-cajasan', 10, '', 'l', 'Experiencias inolvidables en familia', '¡<b>Vacaciones soñadas</b><br>y subsidios familiares!', 'Mundo Guarigua, turismo y recreación', 'Para afiliados'],
  ['hero-imebu', 2, '', 'l', 'Orgullo bumangués', '¡Juguetes hechos en<br><b>Bucaramanga</b>!', 'Más de 200 artesanos y empresarios locales', 'Apoya lo local'],
  ['hero-coca-cola', 3, '', 'l', 'La magia de compartir en familia', '¡Destapa la <b>magia</b><br>de la Navidad!', 'Momentos que unen a todas las familias', 'Disfrútala en la feria'],
  ['hero-maicito', 6, '', 'l', 'El sabor más crujiente de la feria', '¡Crujientes, deliciosos<br>y <b>santandereanos</b>!', 'Pasabocas de maíz hechos con orgullo local', 'Pruébalos'],
  ['hero-confort', 1, '', 'r', 'Transporte oficial de la feria', '¡<b>Comodidad y rapidez</b><br>en tu viaje!', 'Transporte líder en Santander', 'Viaja seguro'],
  ['official-event-photos', 13, 'tree', '', 'Set fotográfico Polo Norte', '¡Tu foto con <b>Papá Noel</b><br>en su trineo!', 'Buzón de duendes y árbol gigante de 15 metros', 'Tómate la foto'],
  ['official-event-nights', 14, 'tree', '', 'Festival artístico y música en vivo', '¡Noches de <b>villancicos</b><br>y alumbrado!', 'Corales, danza y luces desde las 5:00 PM', 'Todas las noches']
];

// arte: [color de marca, tinta, brillo, fondo oscuro]
const T = {
  1: ['#ffd45e', '#fff', '#ffd45e', 1], 2: ['#ffd45e', '#fff', '#ff9ec0', 1], 3: ['#a01c12', '#17452f', '#d9640a'],
  4: ['#9a1420', '#1f3d37', '#c8102e'], 5: ['#ffd45e', '#fff', '#ffd45e', 1], 6: ['#b3151b', '#14503a', '#1d9e8f'],
  7: ['#a11d3a', '#1f4d2b', '#e0a100'], 8: ['#9c1822', '#33200c', '#e8a200'], 10: ['#a82a17', '#17502f', '#e8702a'],
  11: ['#14603c', '#22352b', '#6f9f6f'], 12: ['#9e1b22', '#27432b', '#d33333'], 13: ['#0d5a44', '#16343f', '#c4314b'],
  14: ['#ffd45e', '#fff', '#ffd45e', 1]
};

const CSS = `*{margin:0;padding:0;box-sizing:border-box}body{width:1080px}
.b{position:relative;width:1080px;height:321.3333px;overflow:hidden;background-size:cover}
.glow{position:absolute;left:-40px;top:-30px;width:420px;height:380px;background:radial-gradient(closest-side,#fff 45%,var(--hi) 46%,transparent 100%);opacity:.36}
.pic{position:absolute;left:26px;top:14px;width:288px;height:288px;object-fit:contain;filter:drop-shadow(0 14px 12px rgba(60,30,0,.32))}
.t{position:absolute;left:334px;top:0;bottom:30px;width:500px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start}
.k{background:var(--c);color:#fff;font:800 15px Outfit;padding:6px 16px;border-radius:30px;box-shadow:0 3px 0 rgba(0,0,0,.14);white-space:nowrap}
h1{font:700 39px/1.08 Fredoka;color:var(--ink);margin:11px 0 8px;white-space:nowrap}h1 b{color:var(--c);font-size:1.14em}
p{font:500 17px/1.3 Outfit;color:var(--ink);white-space:nowrap}
.cta{margin-top:12px;font:800 16px Outfit;color:var(--c);border:2.5px solid var(--c);background:#fff;padding:7px 20px;border-radius:30px}
.dark .k{color:#14203a}.dark .cta{background:var(--c);color:#14203a}.dark .glow{opacity:.2}
.logo{position:absolute;right:38px;top:50px;width:200px;height:200px;border-radius:50%;background:#fff;border:6px solid var(--c);outline:3px solid var(--hi);outline-offset:5px;box-shadow:0 10px 24px rgba(50,20,0,.28);display:grid;grid-template:100%/100%;padding:24px}
.logo img{width:100%;height:100%;min-height:0;object-fit:contain}
.big .logo{width:250px;height:250px;top:22px;padding:28px}
.big.l .logo{left:42px;right:auto}.big.l .t{left:342px;width:690px}.big.l .glow{left:-45px}
.big.r .logo{right:34px}.big.r .t{left:262px;width:500px}.big.r .glow{left:auto;right:-50px}`;

// Reduce la letra hasta que cada línea quepa en su columna
const FIT = `document.fonts.ready.then(()=>{for(const t of document.querySelectorAll('.t'))for(const e of t.querySelectorAll('h1,p,.k')){let f=parseFloat(getComputedStyle(e).fontSize);while((e.scrollWidth>t.clientWidth+1||e.offsetWidth>t.clientWidth+1)&&f>11)e.style.fontSize=(--f)+'px'}})`;

(async () => {
  const { width } = await sharp(__dirname + '/fotos-canva.png').metadata(), size = width / 3;
  const cells = ['toys', 'arepa', 'obleas', 'gift', 'team', 'tree'];
  for (let i = 0; i < cells.length; i++) await cut(i % 3, Math.floor(i / 3), cells[i], size);

  const cfg = fs.readFileSync(P + '/src/config/banners.ts', 'utf8').split(/^ {6}id: "/m).slice(1);
  const logo = {};
  for (const c of cfg) logo[c.slice(0, c.indexOf('"'))] = c.match(/src: "\.\/([^"]+)"/)[1];

  const body = S.map(([id, art, pic, side, k, h, p, cta]) => {
    const [c, ink, hi, dark] = T[art];
    const narrow = art === 2 ? 'style="width:400px;left:322px"' : '';
    return `<div class="b ${pic ? '' : 'big ' + side} ${dark ? 'dark' : ''}" style="--c:${c};--ink:${ink};--hi:${hi};background-image:url('${href(`${P}/public/assets/banners/totem/${art}.webp`)}')"><div class="glow"></div>${pic ? `<img class="pic" src="${pic}.png">` : ''}<div class="t" ${narrow}><span class="k">${k}</span><h1>${h}</h1><p>${p}</p><span class="cta">${cta}</span></div><div class="logo"><img src="${href(`${P}/public/${logo[id]}`)}"></div></div>`;
  }).join('');

  fs.writeFileSync(TMP + '/m.html', `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Outfit:wght@500;700;800&display=block" rel="stylesheet"><style>${CSS}</style>${body}<script>${FIT}</script>`);
  cp.execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--user-data-dir=${TMP}/edge`,
    `--window-size=1080,${Math.ceil(S.length * 321.3333) + 2}`, '--force-device-scale-factor=1.5', '--virtual-time-budget=15000',
    `--screenshot=${TMP}/all.png`, href(TMP + '/m.html')], { stdio: 'ignore' });

  const out = P + '/public/assets/banners/finales', th = [];
  let total = 0;
  for (let i = 0; i < S.length; i++) {
    const b = await sharp(TMP + '/all.png').extract({ left: 0, top: i * 482, width: 1620, height: 482 }).png().toBuffer();
    total += (await sharp(b).webp({ quality: 93, smartSubsample: true }).toFile(`${out}/${S[i][0]}.webp`)).size;
    th.push({ input: await sharp(b).resize(540).png().toBuffer(), left: (i % 2) * 548, top: Math.floor(i / 2) * 168 });
  }
  // Argumento opcional: ruta para una hoja de revisión con los 17
  if (process.argv[2]) await sharp({ create: { width: 1088, height: 9 * 168, channels: 3, background: '#ff00ff' } }).composite(th).png().toFile(process.argv[2]);
  console.log('banners', S.length, 'KB', Math.round(total / 1024), 'celda', size);
})();
