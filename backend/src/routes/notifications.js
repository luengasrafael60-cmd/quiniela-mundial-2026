import express from 'express';
import Notification from '../models/Notification.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

const PHASE_MESSAGES = {
  groups:        { title: '🏆 Fase de Grupos Disponible',      message: 'Ya puedes realizar tus picks de la fase de grupos. Selecciona los equipos que terminarán en 1°, 2° y los mejores terceros. Los picks se cerrarán antes del inicio del Mundial.' },
  round16:       { title: '⚽ Dieciseisavos Disponibles',       message: 'Ya puedes realizar tus picks para los dieciseisavos de final. Completa tus selecciones antes del cierre de la ronda.' },
  quarterfinals: { title: '⚽ Octavos de Final Disponibles',    message: 'Los picks para octavos ya están habilitados. Selecciona qué equipos avanzarán a la siguiente ronda antes de que se cierre el periodo.' },
  semifinals:    { title: '⚽ Cuartos de Final Disponibles',    message: 'Ya puedes registrar tus picks para cuartos de final. No olvides guardar tus selecciones antes del cierre.' },
  semifinal:     { title: '⚽ Semifinales Disponibles',         message: 'Las semifinales ya están listas para recibir picks. Selecciona a los equipos que crees que avanzarán a la final.' },
  third_place:   { title: '⚽ Tercer Lugar Disponible',         message: 'Ya puedes registrar tu pick para el partido por el tercer lugar.' },
  final:         { title: '🏆 Final Disponible',               message: 'Ya puedes realizar tu predicción para la gran final. Selecciona al campeón del torneo antes de que se cierre la fase.' },
};

const CLOSING_MESSAGES = {
  groups:        '⏰ Últimas horas para completar tus picks de Fase de Grupos.',
  round16:       '⏰ La fase de Dieciseisavos se cerrará pronto. Realiza tus selecciones antes del cierre.',
  quarterfinals: '⏰ Quedan pocas horas para enviar tus picks de Octavos.',
  semifinals:    '⏰ Quedan pocas horas para enviar tus picks de Cuartos.',
  semifinal:     '⏰ Las Semifinales están por cerrarse. Completa tus picks.',
  third_place:   '⏰ El Tercer Lugar está por cerrarse.',
  final:         '⏰ La Final está por cerrarse. ¡Es tu última oportunidad!',
};

/* ── GET /api/notifications — jugador ve sus notificaciones ── */
router.get('/', protect, async (req, res) => {
  try {
    const now = new Date();
    const notifs = await Notification.find({
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    }).sort({ createdAt: -1 }).limit(20);

    const withRead = notifs.map(n => ({
      ...n.toObject(),
      read: n.readBy.some(id => id.toString() === req.user._id.toString()),
    }));

    res.json({ notifications: withRead, unread: withRead.filter(n => !n.read).length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/notifications/:id/read — marcar como leída ── */
router.post('/:id/read', protect, async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ error: 'No encontrada' });
    if (!n.readBy.some(id => id.toString() === req.user._id.toString())) {
      n.readBy.push(req.user._id);
      await n.save();
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── POST /api/notifications/read-all ── */
router.post('/read-all', protect, async (req, res) => {
  try {
    const notifs = await Notification.find({});
    for (const n of notifs) {
      if (!n.readBy.some(id => id.toString() === req.user._id.toString())) {
        n.readBy.push(req.user._id);
        await n.save();
      }
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── ADMIN: GET /api/notifications/admin ── */
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 });
    res.json({ notifications: notifs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── ADMIN: POST /api/notifications/admin — crear manual ── */
router.post('/admin', protect, adminOnly, async (req, res) => {
  try {
    const { title, message, type, phase } = req.body;
    const n = await Notification.create({ title, message, type: type||'custom', phase: phase||null });
    res.status(201).json({ notification: n });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── ADMIN: POST /api/notifications/admin/phase-open ── */
router.post('/admin/phase-open', protect, adminOnly, async (req, res) => {
  try {
    const { phase } = req.body;
    const msg = PHASE_MESSAGES[phase];
    if (!msg) return res.status(400).json({ error: 'Fase no válida' });
    const n = await Notification.create({ ...msg, type: 'phase_open', phase });
    res.status(201).json({ notification: n });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── ADMIN: POST /api/notifications/admin/phase-closing ── */
router.post('/admin/phase-closing', protect, adminOnly, async (req, res) => {
  try {
    const { phase } = req.body;
    const message = CLOSING_MESSAGES[phase];
    if (!message) return res.status(400).json({ error: 'Fase no válida' });
    const phaseLabels = { groups:'Fase de Grupos', round16:'Dieciseisavos', quarterfinals:'Octavos', semifinals:'Cuartos', semifinal:'Semifinales', third_place:'Tercer Lugar', final:'Final' };
    const n = await Notification.create({ title: `⏰ Cierre próximo: ${phaseLabels[phase]||phase}`, message, type: 'phase_closing', phase });
    res.status(201).json({ notification: n });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/* ── ADMIN: DELETE /api/notifications/admin/:id ── */
router.delete('/admin/:id', protect, adminOnly, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export { PHASE_MESSAGES };
export default router;
