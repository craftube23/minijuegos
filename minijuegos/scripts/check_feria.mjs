import sharp from 'sharp';

async function main() {
  const backupMeta = await sharp('public/assets/images/fondo-empresas.backup.webp').metadata();
  console.log('Backup dimensions:', backupMeta.width, 'x', backupMeta.height);

  // Extract Feria sign from backup
  await sharp('public/assets/images/fondo-empresas.backup.webp')
    .extract({ left: 100, top: 80, width: 300, height: 280 })
    .png()
    .toFile('scratch/backup_feria_crop.png');
}
main().catch(console.error);
