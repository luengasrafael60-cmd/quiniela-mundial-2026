import mongoose from 'mongoose';
import crypto from 'crypto';

const memberSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:      { type: String, enum: ['admin', 'member'], default: 'member' },
  joinedAt:  { type: Date, default: Date.now },
  points:    { type: Number, default: 0 },   // puntos dentro del grupo (= totalPoints del user)
  rank:      { type: Number, default: 0 },
}, { _id: false });

const quinielaGroupSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, default: '', maxlength: 300 },
  image:       { type: String, default: '' },          // URL avatar del grupo
  code:        { type: String, unique: true, uppercase: true }, // código de 6 chars para unirse
  isPrivate:   { type: Boolean, default: true },
  maxMembers:  { type: Number, default: 50, min: 2, max: 200 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:     [memberSchema],
  // stats rápidas del grupo
  stats: {
    totalPredictions: { type: Number, default: 0 },
    avgPoints:        { type: Number, default: 0 },
    topScorer:        { type: String, default: '' },
  },
}, { timestamps: true });

// Generar código único antes de guardar
quinielaGroupSchema.pre('save', function (next) {
  if (!this.code) {
    this.code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars hex
  }
  next();
});

// Recalcular ranking de miembros
quinielaGroupSchema.methods.recalcRanking = async function () {
  const User = (await import('./User.js')).default;
  const ids = this.members.map(m => m.user);
  const users = await User.find({ _id: { $in: ids } }).select('_id totalPoints');
  const ptMap = {};
  users.forEach(u => { ptMap[u._id.toString()] = u.totalPoints; });

  this.members.forEach(m => { m.points = ptMap[m.user.toString()] || 0; });
  this.members.sort((a, b) => b.points - a.points);
  this.members.forEach((m, i) => { m.rank = i + 1; });

  const total = this.members.reduce((s, m) => s + m.points, 0);
  this.stats.avgPoints = this.members.length ? Math.round(total / this.members.length) : 0;
  if (this.members[0]) {
    const top = users.find(u => u._id.toString() === this.members[0].user.toString());
    this.stats.topScorer = top?._id.toString() || '';
  }
};

quinielaGroupSchema.index({ code: 1 });
quinielaGroupSchema.index({ 'members.user': 1 });

export default mongoose.model('QuinielaGroup', quinielaGroupSchema);
