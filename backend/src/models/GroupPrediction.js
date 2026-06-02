import mongoose from 'mongoose';

// Pronóstico de posiciones dentro de un grupo (1ro y 2do lugar)
const groupPredictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: String, required: true }, // 'A' - 'L'
  first: { type: String, default: null },   // equipo en 1er lugar
  second: { type: String, default: null },  // equipo en 2do lugar
  third: { type: String, default: null },   // equipo en 3er lugar (solo para referencia)
  isLocked: { type: Boolean, default: false },
  pointsEarned: { type: Number, default: 0 },
}, { timestamps: true });

groupPredictionSchema.index({ user: 1, group: 1 }, { unique: true });

// Los 8 mejores terceros lugares elegidos por el usuario
const thirdPlacePicksSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  picks: [{ type: String }], // array de hasta 8 nombres de equipos
  isLocked: { type: Boolean, default: false },
  pointsEarned: { type: Number, default: 0 },
}, { timestamps: true });

const specialPredictionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  champion: { type: String, default: null },
  runnerUp: { type: String, default: null },
  thirdPlace: { type: String, default: null },
  fourthPlace: { type: String, default: null },
  pointsEarned: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true });

export const GroupPrediction = mongoose.model('GroupPrediction', groupPredictionSchema);
export const ThirdPlacePicks = mongoose.model('ThirdPlacePicks', thirdPlacePicksSchema);
export const SpecialPrediction = mongoose.model('SpecialPrediction', specialPredictionSchema);
