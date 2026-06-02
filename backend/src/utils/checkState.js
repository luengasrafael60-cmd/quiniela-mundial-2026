import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const state = await db.collection('tournamentstates').findOne({ _id: 'singleton' });
console.log('TournamentState:', JSON.stringify(state, null, 2));

const r16 = await db.collection('matches').countDocuments({ phase: 'round16' });
console.log('\nround16 matches in DB:', r16);
process.exit(0);
