import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/Match.js';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
const r = await Match.deleteMany({ phase: { $ne: 'groups' } });
console.log('🗑️  Borrados:', r.deletedCount, 'partidos eliminatorios');
const remaining = await Match.countDocuments();
console.log('✅ Quedan:', remaining, 'partidos (solo grupos)');
process.exit(0);
