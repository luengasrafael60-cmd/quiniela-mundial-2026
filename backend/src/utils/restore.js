/**
 * RESTORE — Restaura la base de datos desde un archivo de backup
 * Uso: node src/utils/restore.js backup_2026-06-11_10-00.json
 * ⚠️  BORRA todos los datos actuales antes de restaurar
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

async function restore() {
  const filename = process.argv[2];
  if (!filename) {
    console.error('❌ Debes especificar el archivo: node src/utils/restore.js backup_FECHA.json');
    process.exit(1);
  }

  const filepath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);
  if (!fs.existsSync(filepath)) {
    console.error('❌ Archivo no encontrado: ' + filepath);
    process.exit(1);
  }

  console.log('\n♻️  QUINIELA MUNDIAL 2026 — RESTORE\n');
  console.log('⚠️  ADVERTENCIA: Esto borrará TODOS los datos actuales.');
  console.log('📂 Archivo: ' + filename);

  // Simple confirmation via environment variable
  if (process.env.CONFIRM_RESTORE !== 'YES') {
    console.log('\nPara confirmar, corre el comando con CONFIRM_RESTORE=YES:');
    console.log('  CONFIRM_RESTORE=YES node src/utils/restore.js ' + filename);
    console.log('\nEn Windows PowerShell:');
    console.log('  $env:CONFIRM_RESTORE="YES"; node src/utils/restore.js ' + filename + '; Remove-Item Env:CONFIRM_RESTORE');
    process.exit(0);
  }

  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  console.log('\n📅 Backup del: ' + data.createdAt);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a Atlas\n');

  const db = mongoose.connection.db;

  for (const [col, docs] of Object.entries(data.collections || {})) {
    if (!docs || docs.length === 0) { console.log('  ⏭️  ' + col + ': vacío, omitido'); continue; }

    // Don't restore hashed password markers
    const cleanDocs = col === 'users'
      ? docs.filter(d => d.password !== '[HASHED]')
      : docs;

    if (cleanDocs.length === 0) { console.log('  ⚠️  ' + col + ': usuarios omitidos (sin contraseña en backup)'); continue; }

    await db.collection(col).deleteMany({});
    await db.collection(col).insertMany(cleanDocs);
    console.log('  ✅ ' + col + ': ' + cleanDocs.length + ' documentos restaurados');
  }

  console.log('\n✅ Restore completado exitosamente.\n');
  console.log('💡 Si los usuarios no funcionan, corre seed.js para recrear el admin.\n');
  process.exit(0);
}

restore().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
