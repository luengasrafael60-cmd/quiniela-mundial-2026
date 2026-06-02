import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Match from '../models/Match.js';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
const counts = await Match.aggregate([{ $group: { _id: '$phase', count: { $sum: 1 } } }]);
console.log('Partidos por fase:');
counts.forEach(c => console.log(' ', c._id, ':', c.count));
const total = counts.reduce((s, c) => s + c.count, 0);
console.log('Total:', total);
process.exit(0);
