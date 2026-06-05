import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import groupRoutes from './routes/groups.js';
import matchRoutes from './routes/matches.js';
import predictionRoutes from './routes/predictions.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';
import quinielaGroupRoutes from './routes/quinielaGroups.js';
import TournamentState from './models/TournamentState.js';
import UserPhaseLock from './models/UserPhaseLock.js';
import standingsRoutes from './routes/standings.js';
import notificationsRoutes from './routes/notifications.js';

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth',            authRoutes);
app.use('/api/users',           userRoutes);
app.use('/api/groups',          groupRoutes);
app.use('/api/matches',         matchRoutes);
app.use('/api/predictions',     predictionRoutes);
app.use('/api/leaderboard',     leaderboardRoutes);
app.use('/api/admin',           adminRoutes);
app.use('/api/quiniela-groups', quinielaGroupRoutes);
app.use('/api/standings', standingsRoutes);
app.use('/api/notifications', notificationsRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

// Initialize tournament state singleton
mongoose.connection.once('open', async () => {
  const existing = await TournamentState.findById('singleton');
  if (!existing) { await TournamentState.create({ _id: 'singleton' }); console.log('✅ TournamentState inicializado'); }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(process.env.PORT || 4000, () =>
      console.log(`🚀 API corriendo en http://localhost:${process.env.PORT || 4000}`)
    );
  })
  .catch(err => { console.error('❌ Error MongoDB:', err); process.exit(1); });
