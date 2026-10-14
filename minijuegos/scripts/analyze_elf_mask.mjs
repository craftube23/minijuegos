import sharp from 'sharp';

async function run() {
  const d1 = await sharp('public/assets/images/elfo-volador.png').raw().toBuffer();
  const d2 = await sharp('public/assets/images/elfo-volador-campus.png').raw().toBuffer();
  
  // Output a mask of modified regions:
  // White where modified, black where untouched
  const mask = Buffer.alloc(500 * 500 * 4);
  for (let i = 0; i < d1.length; i += 4) {
    const dr = Math.abs(d1[i] - d2[i]);
    const dg = Math.abs(d1[i+1] - d2[i+1]);
    const db = Math.abs(d1[i+2] - d2[i+2]);
    const isDiff = (dr + dg + db > 35) && (d1[i+3] > 20 || d2[i+3] > 20);
    mask[i] = isDiff ? 255 : 0;
    mask[i+1] = isDiff ? 255 : 0;
    mask[i+2] = isDiff ? 255 : 0;
    mask[i+3] = 255;
  }

  await sharp(mask, { raw: { width: 500, height: 500, channels: 4 } })
    .png()
    .toFile('../scratch_elf_diff_mask.png');

  console.log('Saved scratch_elf_diff_mask.png');
}

run().catch(console.error);
