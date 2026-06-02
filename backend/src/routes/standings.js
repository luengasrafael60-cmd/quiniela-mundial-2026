import express from 'express';
import GroupStanding from '../models/GroupStanding.js';
import Match from '../models/Match.js';
import { protect } from '../middleware/auth.js';
import { recalcGroupStanding, recalcAllStandings } from '../utils/standings.js';

const router = express.Router();
router.use(protect);

// GET /api/standings — todas las tablas
router.get('/', async (req, res) => {
  try {
    const standings = await GroupStanding.find().sort({ group: 1 });
    res.json({ standings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/standings/:group — tabla de un grupo
router.get('/:group', async (req, res) => {
  try {
    const g = req.params.group.toUpperCase();
    let standing = await GroupStanding.findOne({ group: g });
    if (!standing) {
      // Si no existe, calcularla al vuelo
      await recalcGroupStanding(g);
      standing = await GroupStanding.findOne({ group: g });
    }
    // Traer también los partidos del grupo
    const matches = await Match.find({ phase: 'groups', group: g }).sort({ matchDate: 1 });
    res.json({ standing, matches });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
