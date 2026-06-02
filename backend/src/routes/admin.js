import express from 'express';
import Match from '../models/Match.js';
import Prediction from '../models/Prediction.js';
import { GroupPrediction, ThirdPlacePicks, SpecialPrediction } from '../models/GroupPrediction.js';
import User from '../models/User.js';
import GroupStanding from '../models/GroupStanding.js';
import QuinielaGroup from '../models/QuinielaGroup.js';
import TournamentState from '../models/TournamentState.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { calcGroupPoints, calcThirdPlacePoints, calcKnockoutPoints, calcSpecialPoints } from '../utils/points.js';
import { recalcGroupStanding, recalcAllStandings } from '../utils/standings.js';
import { getState } from '../utils/tournamentEngine.js';
import { WORLD_CUP_2026_GROUPS } from './groups.js';

const router = express.Router();
router.use(protect, adminOnly);

/* ── GET /api/admin/stats ── */
router.get('/stats', async (req, res) => {
  try {
    const [users, matches, predictions, finished, live, groups, state] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Match.countDocuments(),
      Prediction.countDocuments(),
      Match.countDocuments({ status: 'finished' }),
      Match.countDocuments({ status: 'live' }),
      QuinielaGroup.countDocuments(),
      getState(),
    ]);
    const correctPreds = await Prediction.countDocuments({ resultCorrectWinner: true });
    const totalPreds   = await Prediction.countDocuments({ resultCorrectWinner: { $ne: null } });
    const accuracy     = totalPreds ? Math.round((correctPreds / totalPreds) * 100) : 0;
    const topUser      = await User.findOne({ role: 'user' }).sort({ totalPoints: -1 }).select('name totalPoints');
    res.json({ users, matches, predictions, finished, live, groups, accuracy, totalPreds, topUser, tournamentState: state });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── GET /api/admin/users ── */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ totalPoints: -1 });
    const withStats = await Promise.all(users.map(async u => {
      const [groupPreds, matchPreds, groups] = await Promise.all([
        GroupPrediction.countDocuments({ user: u._id, first: { $ne: null } }),
        Prediction.countDocuments({ user: u._id }),
        QuinielaGroup.countDocuments({ 'members.user': u._id }),
      ]);
      return { ...u.toObject(), groupPredsCompleted: groupPreds, matchPredsCount: matchPreds, quinielaGroups: groups };
    }));
    res.json({ users: withStats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── GET /api/admin/quiniela-groups ── */
router.get('/quiniela-groups', async (req, res) => {
  try {
    const groups = await QuinielaGroup.find().populate('createdBy', 'name email').lean();
    res.json({ groups: groups.map(g => ({ ...g, memberCount: g.members?.length || 0 })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── GET/PUT /api/admin/tournament-state ── */
router.get('/tournament-state', async (req, res) => {
  try { res.json({ state: await getState() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/tournament-state', async (req, res) => {
  try {
    const state = await getState();
    const allowed = ['groupPredictionsLocked','thirdPlaceLocked','specialsLocked',
      'round16Locked','quarterfinalsLocked','semiFinalsLocked','semifinalLocked','finalLocked','currentPhase',
      'groupsLockedAt','round16LockedAt','qfLockedAt','sfLockedAt','thirdPlaceLockedAt','finalLockedAt'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) state[key] = req.body[key];
    }
    await state.save();
    res.json({ state });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── PUT /api/admin/match/:id/result ── */
router.put('/match/:id/result', async (req, res) => {
  try {
    const { homeScore, awayScore, status, minute } = req.body;
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });

    const isFinishing = status === 'finished';

    // Lock group predictions on first match going live
    if (status === 'live' && match.status === 'scheduled') {
      const state = await getState();
      if (!state.groupPredictionsLocked) {
        state.groupPredictionsLocked = true;
        state.groupsLockedAt = new Date();
        state.currentPhase = 'groups';
        await state.save();
        await GroupPrediction.updateMany({}, { isLocked: true });
        await ThirdPlacePicks.updateMany({}, { isLocked: true });
      }
    }

    if (homeScore != null) match.homeScore = parseInt(homeScore);
    if (awayScore != null) match.awayScore = parseInt(awayScore);
    if (minute    != null) match.minute    = parseInt(minute);
    match.status = status || match.status;

    if (isFinishing && match.homeScore != null && match.awayScore != null) {
      match.winner = match.homeScore > match.awayScore ? 'home'
        : match.awayScore > match.homeScore ? 'away' : 'draw';
    }
    await match.save();

    if (isFinishing) {
      await recalcMatchPredictions(match);
      if (match.phase === 'groups' && match.group) {
        await recalcGroupStanding(match.group);
      }
      await recalcAllUserTotals();
    }

    res.json({ match });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ════════════════════════════════════════════════════════════
   SISTEMA MANUAL DE CLASIFICADOS Y LLAVES
   ══════════════════════════════════════════════════════════ */

/* ── GET /api/admin/classified — obtener clasificados guardados ── */
router.get('/classified', async (req, res) => {
  try {
    const GroupResult = (await import('../models/GroupResult.js')).default;
    const results = await GroupResult.find().sort({ group: 1 });
    res.json({ results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/admin/classified — guardar clasificados de grupos ── */
router.post('/classified', async (req, res) => {
  try {
    const { classified, bestThirds } = req.body;
    // classified = { A: { first, second, third }, B: ... }
    // bestThirds = ['México', 'Brasil', ...] (8 nombres)

    const GroupResult = (await import('../models/GroupResult.js')).default;

    for (const [group, pos] of Object.entries(classified || {})) {
      await GroupResult.findOneAndUpdate(
        { group },
        { group, first: pos.first || null, second: pos.second || null, third: pos.third || null },
        { upsert: true, new: true }
      );
    }

    // Recalcular puntos de pronósticos de grupos
    for (const [group, pos] of Object.entries(classified || {})) {
      if (pos.first && pos.second) {
        await recalcGroupPredictions(group, pos.first, pos.second, bestThirds || []);
      }
    }

    // Guardar mejores terceros en el estado
    const state = await getState();
    state.bestThirds = bestThirds || [];
    state.thirdPlaceLocked = true;
    await state.save();

    await recalcAllUserTotals();
    res.json({ message: 'Clasificados guardados correctamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── GET /api/admin/available-teams/:phase — equipos disponibles para esa ronda ── */
router.get('/available-teams/:phase', async (req, res) => {
  try {
    const { phase } = req.params;
    const GroupResult = (await import('../models/GroupResult.js')).default;

    if (phase === 'round16') {
      // Todos los clasificados: 1ro + 2do de cada grupo + 8 mejores terceros
      const results = await GroupResult.find();
      const teams = [];
      for (const r of results) {
        if (r.first)  teams.push({ name: r.first,  source: `1° Grupo ${r.group}` });
        if (r.second) teams.push({ name: r.second, source: `2° Grupo ${r.group}` });
      }
      // Mejores terceros desde el estado
      const state = await getState();
      for (const name of (state.bestThirds || [])) {
        teams.push({ name, source: '3° mejor' });
      }
      return res.json({ teams });
    }

    // Para octavos en adelante: ganadores de la fase anterior
    const PREV_PHASE = {
      quarterfinals: 'round16',       // Octavos ← ganadores de Dieciseisavos
      semifinals:    'quarterfinals',  // Cuartos ← ganadores de Octavos
      semifinal:     'semifinals',     // Semifinales ← ganadores de Cuartos
      final:         'semifinal',      // Final ← ganadores de Semifinales
      third_place:   'semifinal',      // 3er Lugar ← perdedores de Semifinales
    };
    const prevPhase = PREV_PHASE[phase];
    if (!prevPhase) return res.json({ teams: [] });

    const prevMatches = await Match.find({ phase: prevPhase, status: 'finished', winner: { $ne: null } });

    // For third_place: use LOSERS of semifinals, not winners
    if (phase === 'third_place') {
      const teams = prevMatches.map(m => ({
        name:   m.winner === 'home' ? m.awayTeam.name : m.homeTeam.name,
        source: `Perdedor P${m.matchNumber}`,
      }));
      return res.json({ teams });
    }

    const teams = prevMatches.map(m => ({
      name:   m.winner === 'home' ? m.homeTeam.name : m.awayTeam.name,
      source: `Ganador P${m.matchNumber}`,
    }));
    res.json({ teams });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/admin/create-match — crear un partido de llave manualmente ── */
router.post('/create-match', async (req, res) => {
  try {
    const { phase, homeTeamName, awayTeamName, matchNumber } = req.body;
    if (!phase || !homeTeamName || !awayTeamName) {
      return res.status(400).json({ error: 'Faltan datos: phase, homeTeamName, awayTeamName' });
    }

    // Obtener datos del equipo (bandera, color)
    const allTeams = Object.values(WORLD_CUP_2026_GROUPS).flat()
      .reduce((acc, t) => { acc[t.name] = t; return acc; }, {});

    const ht = allTeams[homeTeamName] || { name: homeTeamName, flag: '🏳️', code: 'TBD', primary: '#475569', secondary: '#94a3b8' };
    const at = allTeams[awayTeamName] || { name: awayTeamName, flag: '🏳️', code: 'TBD', primary: '#475569', secondary: '#94a3b8' };

    // Calcular número de partido si no se provee
    let num = matchNumber;
    if (!num) {
      const START = { round16:73, quarterfinals:200, semifinals:300, semifinal:350, third_place:500, final:400 };
      const start = START[phase] || 73;
      const existing = await Match.find({ phase }).sort({ matchNumber: -1 }).limit(1);
      num = existing.length > 0 ? existing[0].matchNumber + 1 : start;
    }

    // Evitar duplicado
    const exists = await Match.findOne({ matchNumber: num });
    if (exists) return res.status(400).json({ error: `Ya existe el partido #${num}` });

    const match = await Match.create({
      matchNumber: num, phase,
      homeTeam: { name: ht.name, flag: ht.flag, code: ht.code, primary: ht.primary, secondary: ht.secondary },
      awayTeam: { name: at.name, flag: at.flag, code: at.code, primary: at.primary, secondary: at.secondary },
      status: 'scheduled',
    });

    // Actualizar fase en el estado
    const state = await getState();
    const PHASE_ORDER = ['pre','groups','round16','quarterfinals','semifinals','semifinal','final','finished'];
    if (PHASE_ORDER.indexOf(phase) > PHASE_ORDER.indexOf(state.currentPhase)) {
      state.currentPhase = phase;
      await state.save();
    }

    res.status(201).json({ match });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── DELETE /api/admin/match/:id — borrar un partido de llave ── */
router.delete('/match/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'No encontrado' });
    if (match.phase === 'groups') return res.status(400).json({ error: 'No puedes borrar partidos de grupos' });
    await Match.deleteOne({ _id: match._id });
    res.json({ message: 'Partido eliminado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/admin/recalculate-all ── */
router.post('/recalculate-all', async (req, res) => {
  try {
    await recalcAllStandings();
    const GroupResult = (await import('../models/GroupResult.js')).default;
    const allGR = await GroupResult.find();
    for (const r of allGR) await recalcGroupPredictions(r.group, r.first, r.second);
    const allMatches = await Match.find({ status: 'finished' });
    for (const m of allMatches) await recalcMatchPredictions(m);
    const state = await getState();
    if (state.bestThirds?.length) {
      // allGroupClassified = todos los que clasificaron como 1° o 2° de algún grupo
      const allGR2 = await GroupResult.find();
      const allGroupClassified = allGR2.flatMap(r => [r.first, r.second]).filter(Boolean);
      const allPicks = await ThirdPlacePicks.find();
      for (const tp of allPicks) {
        tp.pointsEarned = calcThirdPlacePoints(tp.picks || [], state.bestThirds || [], allGroupClassified).pts;
        await tp.save();
      }
    }
    await recalcAllSpecials();
    await recalcAllUserTotals();
    res.json({ message: 'Todo recalculado' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/admin/reset-tournament ── */
router.post('/reset-tournament', async (req, res) => {
  try {
    const { adminPassword } = req.body;
    const adminUser = await User.findById(req.user._id);
    const bcrypt = await import('bcryptjs');
    const valid = await bcrypt.default.compare(adminPassword || '', adminUser.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const GroupResult = (await import('../models/GroupResult.js')).default;
    await Promise.all([
      Match.deleteMany({ phase: { $ne: 'groups' } }),
      GroupResult.deleteMany({}),
      GroupStanding.deleteMany({}),
      Prediction.deleteMany({}),
      GroupPrediction.deleteMany({}),
      ThirdPlacePicks.deleteMany({}),
      SpecialPrediction.deleteMany({}),
    ]);
    await Match.updateMany({ phase: 'groups' }, {
      homeScore: null, awayScore: null, winner: null, status: 'scheduled', minute: null,
    });
    await User.updateMany({ role: 'user' }, {
      totalPoints:0, groupPoints:0, knockoutPoints:0, exactScorePoints:0,
      specialPoints:0, totalCorrect:0, totalPredictions:0, correctPredictions:0, accuracy:0, rank:0,
    });
    await TournamentState.findByIdAndUpdate('singleton', {
      currentPhase:'pre', groupPredictionsLocked:false, thirdPlaceLocked:false,
      specialsLocked:false, round16Locked:false, quarterfinalsLocked:false,
      semiFinalsLocked:false, finalLocked:false, bracketGenerated:false,
      bracketGeneratedAt:null, groupsLockedAt:null, round16LockedAt:null,
      qfLockedAt:null, sfLockedAt:null, finalLockedAt:null,
      totalGroupMatchesFinished:0, bestThirds:[],
    }, { upsert: true });

    res.json({ message: '✅ Torneo reseteado completamente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ════ HELPERS ════ */
async function recalcMatchPredictions(match) {
  const preds = await Prediction.find({ match: match._id });
  for (const pred of preds) {
    if (match.phase === 'groups') {
      const pts = calcGroupMatchPoints(pred, match);
      const rr = match.homeScore > match.awayScore ? 'home' : match.homeScore < match.awayScore ? 'away' : 'draw';
      const pr = (pred.predictedHomeScore??-1) > (pred.predictedAwayScore??-2) ? 'home'
        : (pred.predictedHomeScore??-1) < (pred.predictedAwayScore??-2) ? 'away' : 'draw';
      pred.pointsEarned = pts;
      pred.resultExactScore = pred.predictedHomeScore===match.homeScore && pred.predictedAwayScore===match.awayScore;
      pred.resultCorrectWinner = pr === rr;
    } else {
      pred.pointsEarned = calcKnockoutPoints(pred, match).pts;
      pred.resultCorrectWinner = pred.predictedWinner === match.winner;
      pred.resultExactScore = pred.predictedHomeScore===match.homeScore && pred.predictedAwayScore===match.awayScore;
    }
    await pred.save();
  }
}

async function recalcGroupPredictions(group, first, second, bestThirds = []) {
  const preds = await GroupPrediction.find({ group });
  for (const p of preds) {
    p.pointsEarned = calcGroupPoints(p, first, second, bestThirds).pts;
    await p.save();
  }
}

async function recalcAllSpecials() {
  const finalMatch = await Match.findOne({ phase:'final', status:'finished' });
  if (!finalMatch) return;
  const champion  = finalMatch.winner==='home' ? finalMatch.homeTeam.name : finalMatch.awayTeam.name;
  const runnerUp  = finalMatch.winner==='home' ? finalMatch.awayTeam.name : finalMatch.homeTeam.name;
  const thirdM    = await Match.findOne({ phase:'third_place', status:'finished' });
  const thirdPlace  = thirdM ? (thirdM.winner==='home' ? thirdM.homeTeam.name : thirdM.awayTeam.name) : null;
  const fourthPlace = thirdM ? (thirdM.winner==='home' ? thirdM.awayTeam.name : thirdM.homeTeam.name) : null;
  const specials = await SpecialPrediction.find();
  for (const sp of specials) { sp.pointsEarned = calcSpecialPoints(sp, {champion,runnerUp,thirdPlace,fourthPlace}).pts; await sp.save(); }
}

async function recalcAllUserTotals() {
  const users = await User.find({ role:'user' });
  for (const user of users) {
    const [matchPreds, groupPreds, thirdPicks, special] = await Promise.all([
      Prediction.find({ user: user._id }),
      GroupPrediction.find({ user: user._id }),
      ThirdPlacePicks.findOne({ user: user._id }),
      SpecialPrediction.findOne({ user: user._id }),
    ]);
    const groupMatchPts = matchPreds.filter(p=>p.phase==='groups').reduce((s,p)=>s+(p.pointsEarned||0),0);
    const koMatchPts    = matchPreds.filter(p=>p.phase!=='groups').reduce((s,p)=>s+(p.pointsEarned||0),0);
    const groupPosPts   = groupPreds.reduce((s,p)=>s+(p.pointsEarned||0),0);
    const thirdPts      = thirdPicks?.pointsEarned || 0;
    const specialPts    = special?.pointsEarned || 0;
    user.totalPoints      = groupMatchPts + koMatchPts + groupPosPts + thirdPts + specialPts;
    user.groupPoints      = groupPosPts + thirdPts + groupMatchPts;
    user.knockoutPoints   = koMatchPts;
    user.exactScorePoints = matchPreds.filter(p=>p.resultExactScore).reduce((s,p)=>s+(p.pointsEarned||0),0);
    user.specialPoints    = specialPts;
    user.totalCorrect     = matchPreds.filter(p=>p.resultCorrectWinner).length;
    user.totalPredictions = matchPreds.length;
    user.correctPredictions = user.totalCorrect;
    user.accuracy = matchPreds.length ? Math.round((user.totalCorrect/matchPreds.length)*100) : 0;
    await user.save();
  }
  const ranked = await User.find({ role:'user' }).sort({ totalPoints:-1, totalCorrect:-1 });
  for (let i=0;i<ranked.length;i++) { ranked[i].rank=i+1; await ranked[i].save(); }
}

export default router;
