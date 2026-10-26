// Quita el fondo blanco (flood fill desde los bordes), recorta y redimensiona sprites nuevos.
import sharp from "sharp";
import path from "node:path";

const BRAIN = "C:/Users/ESSA7/.gemini/antigravity/brain/e3cc4166-162f-4663-a1d4-4ea77cfdc2be";
const OUT = path.resolve("public/assets/images");

const jobs = [
  { src: `${BRAIN}/garra_santa_icon_1792445913440.jpg`, out: "icon-garra-santa.png", width: 640 },
  { src: `${BRAIN}/cinta_taller_icon_1792445913442.jpg`, out: "icon-cinta-taller.png", width: 640 }
];

async function keyWhite({ src, out, width }) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const visited = new Uint8Array(w * h);
  const isBg = (i) => {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    return r > 236 && g > 236 && b > 236;
  };
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = y * w + x;
    if (visited[i] || !isBg(i)) return;
    visited[i] = 1;
    stack.push(i);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w, y = (i / w) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  for (let i = 0; i < w * h; i++) {
    if (visited[i]) data[i * 4 + 3] = 0;
  }
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (visited[i]) continue;
      if (visited[i - 1] || visited[i + 1] || visited[i - w] || visited[i + w]) {
        const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
        if (r > 200 && g > 200 && b > 200) data[i * 4 + 3] = 90;
      }
    }
  }
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT, out));
  const meta = await sharp(path.join(OUT, out)).metadata();
  console.log(out, meta.width, "x", meta.height);
}

for (const j of jobs) await keyWhite(j);
