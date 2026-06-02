import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const state = await db.collection('tournamentstates').findOne({ _id: 'singleton' });
console.log('Estado actual:');
console.log('  semifinalLocked:', state?.semifinalLocked);
console.log('  semiFinalsLocked:', state?.semiFinalsLocked);
console.log('  thirdPlaceLocked:', state?.thirdPlaceLocked);
console.log('  semifinalLocked exists:', 'semifinalLocked' in (state||{}));

// Ensure all new fields exist with default false
await db.collection('tournamentstates').updateOne(
  { _id: 'singleton' },
  { $set: {
    semifinalLocked: state?.semifinalLocked ?? false,
    thirdPlaceLocked: state?.thirdPlaceLocked ?? false,
    thirdPlaceLockedAt: state?.thirdPlaceLockedAt ?? null,
  }}
);

const updated = await db.collection('tournamentstates').findOne({ _id: 'singleton' });
console.log('\nDespués de fix:');
console.log('  semifinalLocked:', updated?.semifinalLocked);
console.log('  thirdPlaceLocked:', updated?.thirdPlaceLocked);
console.log('\n✅ Listo');
process.exit(0);
