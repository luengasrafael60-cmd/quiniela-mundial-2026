import mongoose from 'mongoose';

/**
 * Registro de bloqueos de picks por fase, por usuario.
 * Cuando un jugador presiona "Bloquear picks", se guarda aquí.
 * Una vez bloqueado, el backend rechaza modificaciones en esa fase.
 */
const userPhaseLockSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phase: {
    type: String,
    enum: ['groups', 'round16', 'quarterfinals', 'semifinals', 'semifinal', 'third_place', 'final'],
    required: true,
  },
  lockedAt: { type: Date, default: Date.now },
}, { timestamps: true });

userPhaseLockSchema.index({ user: 1, phase: 1 }, { unique: true });

export default mongoose.model('UserPhaseLock', userPhaseLockSchema);
