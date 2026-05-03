/**
 * Adds a hidden (render mode 3 = invisible) English text block to page 1 of
 * blank.pdf so that Adobe AI's language detector has enough content to
 * identify the document as English.
 *
 * Render mode 3 = fill and stroke clipped to nothing → truly invisible in
 * all PDF viewers but fully extractable as text.
 */
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const HIDDEN_TEXT = [
  'This is a Pathfinder / AD&D 3.5 Edition character sheet.',
  'Character name, player name, race, class, alignment, deity, size,',
  'age, gender, height, weight, eyes, hair, skin.',
  'Ability scores: Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma.',
  'Combat statistics: armor class, hit points, base attack bonus, initiative, speed.',
  'Saving throws: Fortitude, Reflex, Will.',
  'Skills, feats, special abilities, spells, equipment, inventory, worn items.',
  'Weapons: main hand, off hand, backup weapons, damage, critical, range.',
  'Armor class breakdown: armor bonus, shield bonus, deflection, dodge, natural, insight.',
].join(' ');

async function run() {
  const pdfPath = path.join(__dirname, 'assets/blank.pdf');
  const doc = await PDFDocument.load(fs.readFileSync(pdfPath));
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.getPages()[0];

  // Use drawText with opacity 0 — fully transparent but text stream is present
  // and extractable by Adobe AI's language detector.
  page.drawText(HIDDEN_TEXT, {
    font,
    size: 1,
    x: 1,
    y: 1,
    color: rgb(1, 1, 1),   // white on white — invisible in all viewers
    opacity: 0,
    maxWidth: 600,
    lineHeight: 1,
  });

  const saved = await doc.save();
  fs.writeFileSync(pdfPath, saved);
  console.log(`Done: ${(saved.length / 1024).toFixed(1)} KB`);
}
run().catch(console.error);
