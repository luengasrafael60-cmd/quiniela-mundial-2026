import express from 'express';
import Match from '../models/Match.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/matches
router.get('/', async (req, res) => {
  try {
    const { phase, status, limit } = req.query;
    const filter = {};
    if (phase)  filter.phase  = phase;
    if (status) filter.status = status;
    let q = Match.find(filter).sort({ matchDate: 1, matchNumber: 1 });
    if (limit)  q = q.limit(parseInt(limit));
    const matches = await q;
    res.json({ matches });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/matches/live — partidos en vivo ahora
router.get('/live', protect, async (req, res) => {
  try {
    const matches = await Match.find({ status: 'live' }).sort({ matchDate: 1 });
    res.json({ matches });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/matches/recent — últimos finalizados + en vivo
router.get('/recent', protect, async (req, res) => {
  try {
    const [live, finished] = await Promise.all([
      Match.find({ status: 'live' }).sort({ matchDate: -1 }).limit(4),
      Match.find({ status: 'finished' }).sort({ matchDate: -1 }).limit(6),
    ]);
    res.json({ live, finished });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/matches/:id
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
    res.json({ match });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
