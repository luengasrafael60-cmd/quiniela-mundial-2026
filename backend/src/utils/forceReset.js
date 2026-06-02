import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function reset() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a Atlas');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const names = collections.map(c => c.name);
  console.log('Colecciones:', names.join(', '));

  // Borrar predicciones y resultados
  for (const name of ['grouppredictions','predictions','specialpredictions',
                       'thirdplacepicks','groupresults','groupstandings']) {
    if (names.includes(name)) {
      await db.collection(name).deleteMany({});
      console.log('🗑️  ' + name + ' borrado');
    }
  }

  // Borrar TODOS los partidos eliminatorios
  if (names.includes('matches')) {
    const r = await db.collection('matches').deleteMany({ phase: { $ne: 'groups' } });
    console.log('🗑️  ' + r.deletedCount + ' partidos eliminatorios borrados');

    // Resetear partidos de grupos
    const r2 = await db.collection('matches').updateMany(
      { phase: 'groups' },
      { $set: { homeScore: null, awayScore: null, winner: null, status: 'scheduled', minute: null } }
    );
    console.log('🔄 ' + r2.modifiedCount + ' partidos de grupos reseteados');
  }

  // Resetear puntos de usuarios
  if (names.includes('users')) {
    await db.collection('users').updateMany(
      { role: 'user' },
      { $set: { totalPoints:0, groupPoints:0, knockoutPoints:0, exactScorePoints:0,
                specialPoints:0, totalCorrect:0, totalPredictions:0,
                correctPredictions:0, accuracy:0, rank:0 } }
    );
    console.log('✅ Puntos de usuarios reseteados');
  }

  // Resetear TournamentState completamente
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
    bracketGenerated: false,
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

  console.log('\n✅ Reset completo.');
  console.log('👉 Siguiente paso: node src/utils/seed.js');
  process.exit(0);
}

reset().catch(err => { console.error('❌', err.message); process.exit(1); });
