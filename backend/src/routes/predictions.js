import express from 'express';
import { GroupPrediction, ThirdPlacePicks, SpecialPrediction } from '../models/GroupPrediction.js';
import Prediction from '../models/Prediction.js';
import Match from '../models/Match.js';
import { protect } from '../middleware/auth.js';
import { getState } from '../utils/tournamentEngine.js';

const router = express.Router();

const noAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return res.status(403).json({ error: 'El administrador no puede hacer pronósticos' });
  next();
};

/* helper — map phase key → TournamentState lock field */
function getPhaseLockField(phase) {
  return {
    groups:        'groupPredictionsLocked',
    round16:       'round16Locked',
    quarterfinals: 'quarterfinalsLocked',
    semifinals:    'semiFinalsLocked',
    semifinal:     'semifinalLocked',
    third_place:   'thirdPlaceLocked',
    final:         'finalLocked',
  }[phase];
}

// Third-place picks also lock when groups lock
async function isThirdPhaseLocked(state) {
  return state.groupPredictionsLocked || state.thirdPlaceLocked;
}

async function checkPhaseLocked(phase) {
  const state = await getState();
  const field = getPhaseLockField(phase);
  return field ? !!state[field] : false;
}

/* ── GET /api/predictions/state ── */
router.get('/state', protect, async (req, res) => {
  try { res.json({ state: await getState() }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── GET /api/predictions/my ── */
router.get('/my', protect, async (req, res) => {
  try {
    const [groupPredictions, thirdPicks, special, matchPredictions, state] = await Promise.all([
      GroupPrediction.find({ user: req.user._id }),
      ThirdPlacePicks.findOne({ user: req.user._id }),
      SpecialPrediction.findOne({ user: req.user._id }),
      Prediction.find({ user: req.user._id }).populate('match',
        'matchNumber phase group homeTeam awayTeam homeScore awayScore winner status minute matchDate venue'),
      getState(),
    ]);
    res.json({ groupPredictions, thirdPicks, special, matchPredictions, tournamentState: state });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/predictions/group ── */
router.post('/group', protect, noAdmin, async (req, res) => {
  try {
    if (await checkPhaseLocked('groups')) {
      return res.status(403).json({ error: '🔒 Picks de fase de grupos bloqueados por el administrador.' });
    }
    const { group, first, second } = req.body;
    if (!group) return res.status(400).json({ error: 'Grupo requerido' });
    if (first && second && first === second) return res.status(400).json({ error: 'No puedes elegir el mismo equipo dos veces' });

    const pred = await GroupPrediction.findOneAndUpdate(
      { user: req.user._id, group },
      { user: req.user._id, group, first: first || null, second: second || null },
      { upsert: true, new: true }
    );
    res.json({ prediction: pred });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/predictions/third-places ── */
router.post('/third-places', protect, noAdmin, async (req, res) => {
  try {
    if (await checkPhaseLocked('groups')) {
      return res.status(403).json({ error: '🔒 Picks de fase de grupos bloqueados.' });
    }
    const { picks } = req.body;
    if (!Array.isArray(picks)) return res.status(400).json({ error: 'Picks debe ser un array' });
    if (picks.length > 8) return res.status(400).json({ error: 'Máximo 8 terceros' });
    const unique = [...new Set(picks)];
    if (unique.length !== picks.length) return res.status(400).json({ error: 'No puedes repetir equipos' });

    const pred = await ThirdPlacePicks.findOneAndUpdate(
      { user: req.user._id },
      { user: req.user._id, picks },
      { upsert: true, new: true }
    );
    res.json({ prediction: pred });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/predictions/match ── */
router.post('/match', protect, noAdmin, async (req, res) => {
  try {
    const { matchId, predictedHomeScore, predictedAwayScore, predictedWinner } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    if (match.status !== 'scheduled') return res.status(403).json({ error: 'El partido ya inició' });

    if (await checkPhaseLocked(match.phase)) {
      return res.status(403).json({ error: '🔒 Picks de ' + match.phase + ' bloqueados por el administrador.' });
    }

    const pred = await Prediction.findOneAndUpdate(
      { user: req.user._id, match: matchId },
      { user: req.user._id, match: matchId, phase: match.phase,
        predictedHomeScore: predictedHomeScore ?? null,
        predictedAwayScore: predictedAwayScore ?? null,
        predictedWinner: predictedWinner ?? null },
      { upsert: true, new: true }
    );
    res.json({ prediction: pred });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/predictions/special ── */
router.post('/special', protect, noAdmin, async (req, res) => {
  try {
    const state = await getState();
    if (state.specialsLocked) return res.status(403).json({ error: '🔒 Pronósticos especiales bloqueados.' });
    const { champion, runnerUp, thirdPlace, fourthPlace } = req.body;
    const pred = await SpecialPrediction.findOneAndUpdate(
      { user: req.user._id },
      { user: req.user._id, champion, runnerUp, thirdPlace, fourthPlace },
      { upsert: true, new: true }
    );
    res.json({ prediction: pred });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── GET /api/predictions/breakdown/:userId ── */
router.get('/breakdown/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    const [groupPreds, thirdPicks, matchPreds, special, state] = await Promise.all([
      GroupPrediction.find({ user: userId }),
      ThirdPlacePicks.findOne({ user: userId }),
      Prediction.find({ user: userId }).populate('match',
        'matchNumber phase group homeTeam awayTeam homeScore awayScore winner status matchDate'),
      SpecialPrediction.findOne({ user: userId }),
      getState(),
    ]);

    const GroupResult = (await import('../models/GroupResult.js')).default;
    const groupResults = await GroupResult.find();
    const resultMap = {};
    groupResults.forEach(r => { resultMap[r.group] = r; });

    const groupBreakdown = groupPreds.map(gp => {
      const result = resultMap[gp.group];
      const allClassified = result ? [result.first, result.second, ...(state.bestThirds||[])].filter(Boolean) : [];
      const firstStatus  = !result?.first   ? 'pending' : gp.first  === result.first   ? 'exact' : allClassified.includes(gp.first)  ? 'classified' : 'wrong';
      const secondStatus = !result?.second  ? 'pending' : gp.second === result.second  ? 'exact' : allClassified.includes(gp.second) ? 'classified' : 'wrong';
      return { group: gp.group, first: gp.first, second: gp.second, firstStatus, secondStatus, pointsEarned: gp.pointsEarned || 0 };
    });

    const thirdsBreakdown = (thirdPicks?.picks||[]).map(name => ({
      name, status: !state.bestThirds?.length ? 'pending' : state.bestThirds.includes(name) ? 'correct' : 'wrong',
    }));

    const byPhase = {};
    for (const pred of matchPreds) {
      if (!pred.match) continue;
      const phase = pred.match.phase;
      if (!byPhase[phase]) byPhase[phase] = [];
      byPhase[phase].push({
        matchNumber: pred.match.matchNumber,
        homeTeam: pred.match.homeTeam.name, awayTeam: pred.match.awayTeam.name,
        realHome: pred.match.homeScore, realAway: pred.match.awayScore,
        realWinner: pred.match.winner, status: pred.match.status,
        predictedWinner: pred.predictedWinner,
        predictedHome: pred.predictedHomeScore, predictedAway: pred.predictedAwayScore,
        correct: pred.resultCorrectWinner, exact: pred.resultExactScore,
        pointsEarned: pred.pointsEarned || 0,
      });
    }

    res.json({ groupBreakdown, thirdsBreakdown, byPhase, special });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
