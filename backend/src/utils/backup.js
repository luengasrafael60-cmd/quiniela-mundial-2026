/**
 * BACKUP — Exporta toda la base de datos a un archivo JSON
 * Uso: node src/utils/backup.js
 * Genera: backup_YYYY-MM-DD_HH-MM.json
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

async function backup() {
  console.log('\n📦 QUINIELA MUNDIAL 2026 — BACKUP\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a Atlas');

  const db = mongoose.connection.db;
  const collections = [
    'users','matches','grouppredictions','thirdplacepicks',
    'predictions','specialpredictions','groupresults','groupstandings',
    'tournamentstates','quinielagroups',
  ];

  const backup = {
    createdAt: new Date().toISOString(),
    version: '1.0',
    collections: {},
  };

  for (const col of collections) {
    try {
      const docs = await db.collection(col).find({}).toArray();
      backup.collections[col] = docs;
      console.log('  ✅ ' + col + ': ' + docs.length + ' documentos');
    } catch {
      backup.collections[col] = [];
      console.log('  ⚠️  ' + col + ': vacía o no existe');
    }
  }

  // Sanitize: remove passwords from users
  backup.collections.users = backup.collections.users.map(u => ({ ...u, password: '[HASHED]' }));

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const filename = 'backup_' + timestamp + '.json';
  const filepath = path.join(process.cwd(), filename);

  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

  const sizeKB = Math.round(fs.statSync(filepath).size / 1024);
  console.log('\n✅ Backup guardado: ' + filename + ' (' + sizeKB + ' KB)');
  console.log('📍 Ubicación: ' + filepath);
  console.log('\n💡 Guarda este archivo en un lugar seguro antes del Mundial.\n');
  process.exit(0);
}

backup().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
