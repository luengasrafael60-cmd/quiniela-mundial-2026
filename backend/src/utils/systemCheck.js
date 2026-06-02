/**
 * ╔══════════════════════════════════════════════════════╗
 * ║  QUINIELA MUNDIAL 2026 — System Check               ║
 * ║  Verifica que todo esté listo para el Mundial real  ║
 * ╚══════════════════════════════════════════════════════╝
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const OK  = (msg) => console.log('  ✅ ' + msg);
const ERR = (msg) => console.log('  ❌ ' + msg);
const WRN = (msg) => console.log('  ⚠️  ' + msg);
const HDR = (msg) => console.log('\n' + '─'.repeat(50) + '\n  ' + msg + '\n' + '─'.repeat(50));

let errors = 0;
let warnings = 0;

function check(condition, okMsg, errMsg, isWarning = false) {
  if (condition) { OK(okMsg); }
  else if (isWarning) { WRN(errMsg); warnings++; }
  else { ERR(errMsg); errors++; }
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   QUINIELA MUNDIAL 2026 — SYSTEM CHECK              ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // ── 1. MongoDB Connection ──────────────────────────────
  HDR('1. CONEXIÓN A MONGODB ATLAS');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    OK('MongoDB Atlas conectado correctamente');
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    const info = await adminDb.serverInfo();
    OK('Versión MongoDB: ' + info.version);
  } catch (err) {
    ERR('No se pudo conectar a MongoDB: ' + err.message);
    errors++;
    console.log('\n❌ Error crítico — sin conexión no se puede continuar.');
    process.exit(1);
  }

  const db = mongoose.connection.db;

  // ── 2. Collections ─────────────────────────────────────
  HDR('2. COLECCIONES');
  const required = ['users','matches','grouppredictions','thirdplacepicks',
    'predictions','specialpredictions','groupresults','tournamentstates','quinielagroups'];
  const existing = (await db.listCollections().toArray()).map(c => c.name);
  for (const col of required) {
    check(existing.includes(col), col + ' existe', col + ' NO existe');
  }

  // ── 3. Admin ───────────────────────────────────────────
  HDR('3. USUARIO ADMIN');
  const admin = await db.collection('users').findOne({ role: 'admin' });
  check(!!admin, 'Admin encontrado: ' + (admin?.email || ''), 'No hay usuario admin — corre seed.js');
  if (admin) {
    check(!!admin.password, 'Contraseña hasheada OK', 'Admin sin contraseña', true);
  }

  // ── 4. Partidos de grupos ──────────────────────────────
  HDR('4. PARTIDOS DE GRUPOS');
  const groupMatches = await db.collection('matches').countDocuments({ phase: 'groups' });
  check(groupMatches === 72, '72 partidos de grupos creados', 'Hay ' + groupMatches + '/72 partidos de grupos — corre seed.js');

  // Verificar no hay duplicados en matchNumber
  const dupes = await db.collection('matches').aggregate([
    { $group: { _id: '$matchNumber', count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } }
  ]).toArray();
  check(dupes.length === 0, 'Sin matchNumbers duplicados', dupes.length + ' matchNumbers duplicados: ' + dupes.map(d=>d._id).join(', '));

  // ── 5. TournamentState ─────────────────────────────────
  HDR('5. ESTADO DEL TORNEO');
  const state = await db.collection('tournamentstates').findOne({ _id: 'singleton' });
  check(!!state, 'TournamentState existe', 'TournamentState NO existe — reinicia el servidor');
  if (state) {
    OK('Fase actual: ' + state.currentPhase);
    OK('Grupos bloqueados: ' + (state.groupPredictionsLocked ? 'SÍ' : 'NO'));
    OK('Bracket generado: ' + (state.bracketGenerated ? 'SÍ' : 'NO (normal si aún no hay clasificados)'));
    check(!state.bracketGenerated || state.currentPhase !== 'pre',
      'Estado de fase consistente', 'bracketGenerated=true pero fase es pre', true);
  }

  // ── 6. Eliminatorias ───────────────────────────────────
  HDR('6. LLAVES ELIMINATORIAS');
  const phases = ['round16','quarterfinals','semifinals','semifinal','third_place','final'];
  const maxPerPhase = { round16:16, quarterfinals:8, semifinals:4, semifinal:2, third_place:1, final:1 };
  const phaseLabel = { round16:'Dieciseisavos', quarterfinals:'Octavos', semifinals:'Cuartos', semifinal:'Semifinales', third_place:'3er Lugar', final:'Final' };
  for (const ph of phases) {
    const cnt = await db.collection('matches').countDocuments({ phase: ph });
    const max = maxPerPhase[ph];
    if (cnt === 0) {
      OK(phaseLabel[ph] + ': sin partidos (pendiente)');
    } else if (cnt <= max) {
      OK(phaseLabel[ph] + ': ' + cnt + '/' + max + ' partidos');
      // Check for team duplicates within phase
      const phasematches = await db.collection('matches').find({ phase: ph }).toArray();
      const teams = phasematches.flatMap(m => [m.homeTeam?.name, m.awayTeam?.name]).filter(Boolean);
      const teamSet = new Set(teams);
      check(teams.length === teamSet.size,
        'Sin equipos duplicados en ' + phaseLabel[ph],
        'Equipos duplicados en ' + phaseLabel[ph] + ': ' + teams.filter((t,i) => teams.indexOf(t) !== i).join(', '));
    } else {
      ERR(phaseLabel[ph] + ': ' + cnt + ' partidos (máximo es ' + max + ')'); errors++;
    }
  }

  // ── 7. Clasificados ────────────────────────────────────
  HDR('7. CLASIFICADOS DE GRUPOS');
  const groupResults = await db.collection('groupresults').find({}).toArray();
  if (groupResults.length === 0) {
    WRN('Sin clasificados guardados aún (normal antes del Mundial)'); warnings++;
  } else {
    OK(groupResults.length + '/12 grupos con clasificados');
    // Check for duplicate first/second
    const allFirsts = groupResults.map(r => r.first).filter(Boolean);
    const allSeconds = groupResults.map(r => r.second).filter(Boolean);
    const allCombined = [...allFirsts, ...allSeconds];
    const uniqueCombined = new Set(allCombined);
    check(allCombined.length === uniqueCombined.size,
      'Sin equipos duplicados en clasificados',
      'Equipos duplicados en clasificados: ' + allCombined.filter((t,i)=>allCombined.indexOf(t)!==i).join(', '));
  }

  // ── 8. Jugadores y Picks ───────────────────────────────
  HDR('8. JUGADORES Y PICKS');
  const totalUsers = await db.collection('users').countDocuments({ role: 'user' });
  const totalGroupPreds = await db.collection('grouppredictions').countDocuments();
  const totalMatchPreds = await db.collection('predictions').countDocuments();
  const totalSpecials   = await db.collection('specialpredictions').countDocuments();
  const totalThirds     = await db.collection('thirdplacepicks').countDocuments();
  OK(totalUsers + ' jugadores registrados');
  if (totalUsers > 0) {
    OK(totalGroupPreds + ' picks de grupos (' + Math.round(totalGroupPreds/totalUsers*100/12) + '% completado)');
    OK(totalMatchPreds + ' picks de partidos eliminatorios');
    OK(totalSpecials   + ' picks especiales');
    OK(totalThirds     + ' picks de mejores terceros');
    // Verificar referencias rotas
    const orphanPreds = await db.collection('predictions').countDocuments({
      match: { $nin: (await db.collection('matches').distinct('_id')) }
    });
    check(orphanPreds === 0, 'Sin predicciones huérfanas', orphanPreds + ' predicciones con partido inexistente', true);
  }

  // ── 9. Grupos de Quiniela ──────────────────────────────
  HDR('9. GRUPOS DE QUINIELA');
  const qGroups = await db.collection('quinielagroups').countDocuments();
  OK(qGroups + ' grupos de quiniela creados');
  if (qGroups > 0) {
    // Check for groups with 0 members
    const emptyGroups = await db.collection('quinielagroups').countDocuments({ 'members.0': { $exists: false } });
    check(emptyGroups === 0, 'Todos los grupos tienen al menos 1 miembro', emptyGroups + ' grupos vacíos', true);
  }

  // ── 10. Rankings ───────────────────────────────────────
  HDR('10. RANKINGS');
  if (totalUsers > 0) {
    const usersWithRank = await db.collection('users').countDocuments({ role:'user', rank: { $gt: 0 } });
    check(usersWithRank > 0 || totalMatchPreds === 0,
      'Rankings calculados OK (' + usersWithRank + ' jugadores rankeados)',
      'Sin rankings calculados aunque hay predicciones', true);
  } else {
    WRN('Sin jugadores — los rankings se calcularán automáticamente'); warnings++;
  }

  // ── Resultado final ────────────────────────────────────
  console.log('\n' + '═'.repeat(52));
  console.log('  RESULTADO DEL SYSTEM CHECK');
  console.log('═'.repeat(52));
  if (errors === 0 && warnings === 0) {
    console.log('\n  ✅✅ TODO OK — Sistema listo para el Mundial 2026 ✅✅\n');
  } else {
    if (errors > 0)   console.log('  ❌ ' + errors   + ' error(es) encontrado(s) — deben resolverse antes');
    if (warnings > 0) console.log('  ⚠️  ' + warnings + ' advertencia(s) — revisar si aplica');
    if (errors === 0) console.log('\n  ✅ Sin errores críticos — listo para usar\n');
  }
  console.log('');
  process.exit(errors > 0 ? 1 : 0);
}

run().catch(err => { console.error('\n❌ Error inesperado:', err.message); process.exit(1); });
