import mongoose from 'mongoose';

const teamSchema = {
  name:      { type: String, required: true },
  flag:      { type: String, default: '' },
  code:      { type: String, default: '' },
  primary:   { type: String, default: '#475569' }, // color primario de la selección
  secondary: { type: String, default: '#94a3b8' }, // color secundario
};

const matchSchema = new mongoose.Schema({
  matchNumber: { type: Number, required: true, unique: true },
  phase: {
    type: String,
    enum: ['groups', 'round16', 'quarterfinals', 'semifinals', 'semifinal', 'third_place', 'final'],
    required: true,
  },
  group:    { type: String, default: null }, // A-L para fase de grupos
  homeTeam: teamSchema,
  awayTeam: teamSchema,
  homeScore: { type: Number, default: null },
  awayScore: { type: Number, default: null },
  winner:   { type: String, default: null }, // 'home' | 'away' | 'draw'
  status:   { type: String, enum: ['scheduled', 'live', 'finished'], default: 'scheduled' },
  matchDate: { type: Date, default: null },
  slotHome: { type: String, default: null }, // e.g. '1A' = 1ro grupo A
  slotAway: { type: String, default: null },
  venue: { type: String, default: null },
  minute: { type: Number, default: null }, // minuto del partido en vivo
  winnerFromMatch: [{ type: Number }],
}, { timestamps: true });

export default mongoose.model('Match', matchSchema);
