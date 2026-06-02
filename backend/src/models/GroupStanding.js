import mongoose from 'mongoose';

// Tabla de posiciones de cada grupo — se recalcula automáticamente
const teamStandingSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  flag:     { type: String, default: '' },
  code:     { type: String, default: '' },
  primary:  { type: String, default: '#475569' },
  PJ: { type: Number, default: 0 }, // partidos jugados
  PG: { type: Number, default: 0 }, // ganados
  PE: { type: Number, default: 0 }, // empatados
  PP: { type: Number, default: 0 }, // perdidos
  GF: { type: Number, default: 0 }, // goles a favor
  GC: { type: Number, default: 0 }, // goles en contra
  DG: { type: Number, default: 0 }, // diferencia de goles
  PTS:{ type: Number, default: 0 }, // puntos
}, { _id: false });

const groupStandingSchema = new mongoose.Schema({
  group:  { type: String, required: true, unique: true }, // 'A'-'L'
  teams:  [teamStandingSchema],
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('GroupStanding', groupStandingSchema);
