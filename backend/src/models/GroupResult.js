import mongoose from 'mongoose';

// Resultados reales de los grupos (los pone el admin)
const groupResultSchema = new mongoose.Schema({
  group: { type: String, required: true, unique: true }, // 'A'-'L'
  first: { type: String, required: true },    // equipo real en 1er lugar
  second: { type: String, required: true },   // equipo real en 2do lugar
  third: { type: String, default: null },     // equipo real en 3er lugar
  fourth: { type: String, default: null },    // equipo real en 4to lugar
}, { timestamps: true });

export default mongoose.model('GroupResult', groupResultSchema);
