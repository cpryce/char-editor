/**
 * Restore script — re-inserts the "Savage Tide" campaign (6a06b31ac86944a9dac1628b)
 * if it has been deleted. Safe to run: no-ops if the document already exists.
 *
 * Run with:
 *   npx ts-node --transpile-only src/restoreCampaign6a06b31a.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI ?? '';

const SNAPSHOT = {
  _id: new mongoose.Types.ObjectId('6a06b31ac86944a9dac1628b'),
  owner: new mongoose.Types.ObjectId('69e83010d3be1267e460598a'),
  name: 'Savage Tide',
  description: '',
  characterIds: [
    '69ebd3a79a2252e8d7bb20f9',
    '6a07ddb65998efff5552734c',
    '6a07e4d35998efff5552734d',
    '6a0926159e7712aa947ff6de',
    '6a0b547cd49bc83ecef83622',
    '6a09eef7ba067160fad01f9e',
    '6a0b68597594f33d9bec0220',
    '6a0b71467594f33d9bec0223',
    '6a07fd2d05bc154237705023',
    '6a0bd9703f211594d7de32a0',
    '6a23905b1c92a6460ec3c289',
  ].map((id) => new mongoose.Types.ObjectId(id)),
  encounterIds: [] as mongoose.Types.ObjectId[],
  pointBuySystem: 'adnd32',
  invites: [
    {
      _id: new mongoose.Types.ObjectId('6a23334205b23a84a24a23c7'),
      email: 'christopher.j.pryce@gmail.com',
      token: '87b62be9907e1956eae2f004815ec5e3ccfc1257afdd9a25f5d4bd9e0c19b1ad',
      userId: null,
      access: 'view',
    },
    {
      _id: new mongoose.Types.ObjectId('6a238c5f1c92a6460ec3c26a'),
      email: 'timstellburg@gmail.com',
      token: null,
      userId: new mongoose.Types.ObjectId('6a238c3a1c92a6460ec3c268'),
      access: 'delegate',
    },
  ],
  createdAt: new Date('2026-05-15T05:46:02.393Z'),
  updatedAt: new Date('2026-06-06T03:49:02.276Z'),
  __v: 4,
};

async function restore() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const col = mongoose.connection.db!.collection('campaigns');
  const existing = await col.findOne({ _id: SNAPSHOT._id });

  if (existing) {
    console.log(`Campaign "${SNAPSHOT.name}" (${SNAPSHOT._id}) already exists — nothing to do.`);
  } else {
    await col.insertOne(SNAPSHOT as Parameters<typeof col.insertOne>[0]);
    console.log(`Campaign "${SNAPSHOT.name}" (${SNAPSHOT._id}) restored successfully.`);
  }

  await mongoose.disconnect();
}

restore().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
