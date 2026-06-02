import express from 'express';
import User from '../models/User.js';
import Prediction from '../models/Prediction.js';
import { GroupPrediction } from '../models/GroupPrediction.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

/* ── GET /api/leaderboard — ranking global ── */
router.get('/', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('name username avatar totalPoints groupPoints knockoutPoints exactScorePoints specialPoints totalCorrect totalPredictions accuracy rank createdAt')
      .sort({ totalPoints: -1, totalCorrect: -1 });

    // Asignar rank en tiempo real (por si no está actualizado)
    const withRank = users.map((u, i) => ({ ...u.toObject(), rank: i + 1 }));
    res.json({ leaderboard: withRank, total: users.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── GET /api/leaderboard/history — historial de puntos por fase ── */
router.get('/history', async (req, res) => {
  try {
    const phases = ['groups', 'round16', 'quarterfinals', 'semifinals', 'third_place', 'final'];
    const users  = await User.find({ role: 'user' }).select('name username avatar');

    const history = await Promise.all(
      users.map(async (user) => {
        const preds = await Prediction.find({ user: user._id }).populate('match', 'phase');
        const byPhase = {};
        for (const phase of phases) {
          byPhase[phase] = preds
            .filter(p => p.match?.phase === phase)
            .reduce((s, p) => s + (p.pointsEarned || 0), 0);
        }
        return { user: { _id: user._id, name: user.name, username: user.username, avatar: user.avatar }, byPhase };
      })
    );

    res.json({ history, phases });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── GET /api/leaderboard/compare/:userId — comparar con otro jugador ── */
router.get('/compare/:userId', async (req, res) => {
  try {
    const [me, other] = await Promise.all([
      User.findById(req.user._id).select('-password'),
      User.findById(req.params.userId).select('-password'),
    ]);
    if (!other) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [myPreds, otherPreds] = await Promise.all([
      Prediction.find({ user: req.user._id }).populate('match', 'phase homeTeam awayTeam homeScore awayScore winner status'),
      Prediction.find({ user: req.params.userId }).populate('match', 'phase homeTeam awayTeam homeScore awayScore winner status'),
    ]);

    // Partidos que ambos pronosticaron y ya terminaron
    const myMap    = {};
    const otherMap = {};
    myPreds.forEach(p    => { if (p.match) myMap[p.match._id.toString()]    = p; });
    otherPreds.forEach(p => { if (p.match) otherMap[p.match._id.toString()] = p; });

    const shared = Object.keys(myMap).filter(id => otherMap[id] && myMap[id].match?.status === 'finished');

    const comparison = shared.map(id => ({
      match:       myMap[id].match,
      me:          { predictedHomeScore: myMap[id].predictedHomeScore, predictedAwayScore: myMap[id].predictedAwayScore, predictedWinner: myMap[id].predictedWinner, pointsEarned: myMap[id].pointsEarned, correct: myMap[id].resultCorrectWinner },
      other:       { predictedHomeScore: otherMap[id].predictedHomeScore, predictedAwayScore: otherMap[id].predictedAwayScore, predictedWinner: otherMap[id].predictedWinner, pointsEarned: otherMap[id].pointsEarned, correct: otherMap[id].resultCorrectWinner },
    }));

    res.json({ me, other, comparison, myTotal: me.totalPoints, otherTotal: other.totalPoints });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
