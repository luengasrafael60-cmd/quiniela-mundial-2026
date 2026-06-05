import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['phase_open','phase_closing','reminder','custom'], default: 'custom' },
  phase:   { type: String, default: null },
  readBy:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
}, { timestamps: false });

export default mongoose.model('Notification', notificationSchema);
