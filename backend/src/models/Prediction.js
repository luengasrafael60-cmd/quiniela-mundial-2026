import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  phase: { type: String, required: true },

  // Fase de grupos: marcador exacto
  predictedHomeScore: { type: Number, default: null },
  predictedAwayScore: { type: Number, default: null },

  // Eliminatorias: ganador del partido
  predictedWinner: { type: String, default: null }, // 'home' | 'away'

  // Clasificados de grupo (solo fase groups)
  predictedClassified: [{ type: String }], // nombres de equipos que pasan

  // Especiales
  predictedChampion: { type: String, default: null },
  predictedRunnerUp: { type: String, default: null },
  predictedThird: { type: String, default: null },

  // Puntos ganados por este pronóstico
  pointsEarned: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false }, // Se bloquea cuando inicia el partido

  // Resultado
  resultCorrectWinner: { type: Boolean, default: null },
  resultExactScore: { type: Boolean, default: null },
}, { timestamps: true });

predictionSchema.index({ user: 1, match: 1 }, { unique: true });

export default mongoose.model('Prediction', predictionSchema);
