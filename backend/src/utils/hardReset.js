import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

// 1. Borrar TODOS los partidos eliminatorios
const r1 = await db.collection('matches').deleteMany({ phase: { $ne: 'groups' } });
console.log('🗑️  Eliminatorios borrados:', r1.deletedCount);

// 2. Resetear partidos de grupos
const r2 = await db.collection('matches').updateMany(
  { phase: 'groups' },
  { $set: { homeScore: null, awayScore: null, winner: null, status: 'scheduled', minute: null } }
);
console.log('🔄 Grupos reseteados:', r2.modifiedCount);

// 3. Borrar y recrear TournamentState LIMPIO
await db.collection('tournamentstates').deleteMany({});
await db.collection('tournamentstates').insertOne({
  _id: 'singleton',
  currentPhase: 'pre',
  groupPredictionsLocked: false,
  thirdPlaceLocked: false,
  specialsLocked: false,
  round16Locked: false,
  quarterfinalsLocked: false,
  semiFinalsLocked: false,
  finalLocked: false,
  bracketGenerated: false,      // <-- ESTO ES LO IMPORTANTE
  bracketGeneratedAt: null,
  groupsLockedAt: null,
  round16LockedAt: null,
  qfLockedAt: null,
  sfLockedAt: null,
  finalLockedAt: null,
  totalGroupMatchesFinished: 0,
  totalGroupMatches: 72,
  createdAt: new Date(),
  updatedAt: new Date(),
});
console.log('✅ TournamentState reseteado a PRE-MUNDIAL');

// 4. Resetear predicciones y puntos
for (const col of ['grouppredictions','predictions','specialpredictions',
                    'thirdplacepicks','groupresults','groupstandings']) {
  const r = await db.collection(col).deleteMany({});
  if (r.deletedCount > 0) console.log('🗑️ ', col, ':', r.deletedCount);
}
await db.collection('users').updateMany({ role: 'user' }, { $set: {
  totalPoints:0, groupPoints:0, knockoutPoints:0, exactScorePoints:0,
  specialPoints:0, totalCorrect:0, totalPredictions:0, correctPredictions:0,
  accuracy:0, rank:0,
}});
console.log('✅ Usuarios reseteados');

// 5. Verificar resultado final
const groups = await db.collection('matches').countDocuments({ phase: 'groups' });
const r16 = await db.collection('matches').countDocuments({ phase: 'round16' });
const state = await db.collection('tournamentstates').findOne({ _id: 'singleton' });
console.log('\n📊 Estado final:');
console.log('  Partidos de grupos:', groups);
console.log('  Partidos round16:', r16, '(debe ser 0)');
console.log('  bracketGenerated:', state.bracketGenerated, '(debe ser false)');
console.log('  currentPhase:', state.currentPhase, '(debe ser pre)');
console.log('\n✅ Hard reset completo. Ya puedes usar la app.');
process.exit(0);
