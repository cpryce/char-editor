/**
 * Test script — fetches a character by ID and writes a filled PDF to disk.
 *
 * Run with:  npm run test-fill  (from the server workspace)
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { Character } from './models/Character';
import { fillCharacterPdf } from './utils/fillCharacterPdf';

const CHARACTER_ID = '69ebd3a79a2252e8d7bb20f9';
const MONGO_URI = process.env.MONGO_URI ?? '';

async function run() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const character = await Character.findById(CHARACTER_ID);
  if (!character) {
    console.error(`Character not found: ${CHARACTER_ID}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Filling PDF for: ${character.name}`);
  const pdfBytes = await fillCharacterPdf(character);

  const outPath = path.join(__dirname, 'assets/test-fill.pdf');
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`Written to: ${outPath}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
