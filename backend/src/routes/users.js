import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { GroupPrediction, SpecialPrediction } from '../models/GroupPrediction.js';
import Prediction from '../models/Prediction.js';
import QuinielaGroup from '../models/QuinielaGroup.js';

const router = express.Router();
router.use(protect);

// GET /api/users/profile — mi perfil
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const myGroups = await QuinielaGroup.find({ 'members.user': req.user._id }).select('name code members').lean();
    const groupCount = myGroups.length;
    res.json({ user, groupCount, groups: myGroups.map(g => ({ _id: g._id, name: g.name, code: g.code, memberCount: g.members.length })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/users/profile — actualizar perfil
router.put('/profile', async (req, res) => {
  try {
    const { name, username, avatar, bio } = req.body;
    if (username) {
      const exists = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user._id } });
      if (exists) return res.status(400).json({ error: 'Ese nombre de usuario ya está tomado' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, username: username?.toLowerCase(), avatar, bio },
      { new: true }
    ).select('-password');
    res.json({ user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/:id/stats — stats públicas de un usuario
router.get('/:id/stats', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [groupPreds, special, matchPreds] = await Promise.all([
      GroupPrediction.find({ user: req.params.id }),
      SpecialPrediction.findOne({ user: req.params.id }),
      Prediction.find({ user: req.params.id }).select('pointsEarned resultCorrectWinner resultExactScore'),
    ]);

    const completedGroups = groupPreds.filter(p => p.first && p.second).length;
    const earnedPredictions = matchPreds.filter(p => p.pointsEarned > 0).length;

    res.json({
      user,
      stats: {
        groupsCompleted: completedGroups,
        hasSpecials: !!(special?.champion),
        matchPredictions: matchPreds.length,
        earnedPredictions,
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
