import express from 'express';
import QuinielaGroup from '../models/QuinielaGroup.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { GroupPrediction, SpecialPrediction } from '../models/GroupPrediction.js';
import Prediction from '../models/Prediction.js';

const router = express.Router();
router.use(protect);

/* ─── helpers ─── */
function isGroupAdmin(group, userId) {
  return group.members.some(m => m.user.toString() === userId.toString() && m.role === 'admin');
}

async function populateMembers(group) {
  await group.populate({ path: 'members.user', select: 'name avatar totalPoints totalCorrect exactScorePoints' });
  return group;
}

/* ─── GET /api/quiniela-groups  — mis grupos ─── */
router.get('/', async (req, res) => {
  try {
    const groups = await QuinielaGroup.find({ 'members.user': req.user._id })
      .populate('createdBy', 'name')
      .lean();
    // Añadir datos del usuario dentro de cada grupo
    const result = groups.map(g => {
      const me = g.members.find(m => m.user.toString() === req.user._id.toString());
      return { ...g, myRank: me?.rank || 0, myPoints: me?.points || 0, memberCount: g.members.length };
    });
    res.json({ groups: result });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── GET /api/quiniela-groups/public  — grupos públicos ─── */
router.get('/public', async (req, res) => {
  try {
    const groups = await QuinielaGroup.find({ isPrivate: false })
      .select('name description image code memberCount stats maxMembers')
      .limit(50).lean();
    res.json({ groups });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── POST /api/quiniela-groups  — crear grupo ─── */
router.post('/', async (req, res) => {
  try {
    const { name, description, image, isPrivate, maxMembers } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' });

    const group = await QuinielaGroup.create({
      name: name.trim(),
      description: description?.trim() || '',
      image: image || '',
      isPrivate: isPrivate !== false,
      maxMembers: Math.min(maxMembers || 50, 200),
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin', points: req.user.totalPoints || 0, rank: 1 }],
    });
    res.status(201).json({ group });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── POST /api/quiniela-groups/join  — unirse por código ─── */
router.post('/join', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Código requerido' });

    const group = await QuinielaGroup.findOne({ code: code.trim().toUpperCase() });
    if (!group) return res.status(404).json({ error: 'Código inválido — grupo no encontrado' });
    if (group.members.length >= group.maxMembers) return res.status(400).json({ error: 'El grupo está lleno' });

    const alreadyIn = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (alreadyIn) return res.status(400).json({ error: 'Ya eres miembro de este grupo' });

    group.members.push({ user: req.user._id, role: 'member', points: req.user.totalPoints || 0 });
    await group.recalcRanking();
    await group.save();

    res.json({ group, message: `¡Te uniste a "${group.name}"!` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── GET /api/quiniela-groups/:id  — detalle del grupo ─── */
router.get('/:id', async (req, res) => {
  try {
    const group = await QuinielaGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember && group.isPrivate) return res.status(403).json({ error: 'Grupo privado' });

    await populateMembers(group);
    res.json({ group });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── GET /api/quiniela-groups/:id/standings  — tabla del grupo ─── */
router.get('/:id/standings', async (req, res) => {
  try {
    const group = await QuinielaGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember && group.isPrivate) return res.status(403).json({ error: 'Grupo privado' });

    // Sync points from User model in real time
    await group.populate({ path: 'members.user', select: 'name avatar totalPoints totalCorrect exactScorePoints groupPoints knockoutPoints specialPoints accuracy rank' });

    // Update member points from live user data then sort
    group.members.forEach(m => {
      if (m.user?.totalPoints != null) m.points = m.user.totalPoints;
    });
    group.members.sort((a, b) => b.points - a.points);
    group.members.forEach((m, i) => { m.rank = i + 1; });

    const total = group.members.reduce((s, m) => s + m.points, 0);
    group.stats.avgPoints = group.members.length ? Math.round(total / group.members.length) : 0;
    await group.save();

    const standings = group.members.map(m => ({
      rank:     m.rank,
      user:     m.user,
      points:   m.points,
      joinedAt: m.joinedAt,
      role:     m.role,
      isMe:     m.user._id.toString() === req.user._id.toString(),
    }));

    res.json({ standings, groupName: group.name, memberCount: group.members.length, stats: group.stats });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── GET /api/quiniela-groups/:id/member/:userId/predictions ─── */
router.get('/:id/member/:userId/predictions', async (req, res) => {
  try {
    const group = await QuinielaGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });

    const isMember = group.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ error: 'No eres miembro' });

    const targetId = req.params.userId;
    const isMemberTarget = group.members.some(m => m.user.toString() === targetId);
    if (!isMemberTarget) return res.status(404).json({ error: 'Usuario no está en el grupo' });

    const [groupPredictions, special, matchPredictions] = await Promise.all([
      GroupPrediction.find({ user: targetId }),
      SpecialPrediction.findOne({ user: targetId }),
      Prediction.find({ user: targetId }).populate('match', 'homeTeam awayTeam group phase matchDate status homeScore awayScore').sort({ 'match.matchDate': 1 }),
    ]);

    res.json({ groupPredictions, special, matchPredictions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── PUT /api/quiniela-groups/:id  — editar grupo (solo admin) ─── */
router.put('/:id', async (req, res) => {
  try {
    const group = await QuinielaGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });
    if (!isGroupAdmin(group, req.user._id)) return res.status(403).json({ error: 'Solo el administrador puede editar' });

    const { name, description, image, isPrivate, maxMembers } = req.body;
    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (image !== undefined) group.image = image;
    if (isPrivate !== undefined) group.isPrivate = isPrivate;
    if (maxMembers) group.maxMembers = Math.max(group.members.length, Math.min(maxMembers, 200));
    await group.save();
    res.json({ group });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── DELETE /api/quiniela-groups/:id/leave  — salir del grupo ─── */
router.delete('/:id/leave', async (req, res) => {
  try {
    const group = await QuinielaGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });

    const memberIdx = group.members.findIndex(m => m.user.toString() === req.user._id.toString());
    if (memberIdx < 0) return res.status(400).json({ error: 'No eres miembro' });

    const isAdmin = group.members[memberIdx].role === 'admin';
    if (isAdmin && group.members.length > 1) {
      // Transferir admin al siguiente miembro
      const next = group.members.find((m, i) => i !== memberIdx);
      if (next) next.role = 'admin';
    }

    group.members.splice(memberIdx, 1);
    if (group.members.length === 0) {
      await QuinielaGroup.deleteOne({ _id: group._id });
      return res.json({ message: 'Grupo eliminado por no tener más miembros' });
    }
    await group.recalcRanking();
    await group.save();
    res.json({ message: 'Saliste del grupo' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ─── DELETE /api/quiniela-groups/:id/kick/:userId (solo admin) ─── */
router.delete('/:id/kick/:userId', async (req, res) => {
  try {
    const group = await QuinielaGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: 'Grupo no encontrado' });
    if (!isGroupAdmin(group, req.user._id)) return res.status(403).json({ error: 'Solo el administrador' });

    group.members = group.members.filter(m => m.user.toString() !== req.params.userId);
    await group.recalcRanking();
    await group.save();
    res.json({ message: 'Usuario eliminado del grupo' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
