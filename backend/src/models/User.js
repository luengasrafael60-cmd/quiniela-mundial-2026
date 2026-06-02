import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar:   { type: String, default: '' },
  bio:      { type: String, default: '', maxlength: 200 },

  // Puntos totales (calculados por el sistema)
  totalPoints:        { type: Number, default: 0 },
  groupPoints:        { type: Number, default: 0 },
  knockoutPoints:     { type: Number, default: 0 },
  exactScorePoints:   { type: Number, default: 0 },
  specialPoints:      { type: Number, default: 0 },
  totalCorrect:       { type: Number, default: 0 },
  rank:               { type: Number, default: 0 },

  // Stats de predicciones
  totalPredictions:   { type: Number, default: 0 },
  correctPredictions: { type: Number, default: 0 },
  accuracy:           { type: Number, default: 0 }, // porcentaje
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
