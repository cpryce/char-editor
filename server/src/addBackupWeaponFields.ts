#!/usr/bin/env -S ts-node --transpile-only
/**
 * Add AcroForm text fields to blank.pdf for the three backup-weapon slots.
 *
 * Field naming mirrors the MongoDB inventory structure:
 *   backupWeapons.<index>.label              — editable slot title
 *   backupWeapons.<index>.weapon.name
 *   backupWeapons.<index>.weapon.attackMod
 *   backupWeapons.<index>.weapon.computedAttack
 *   backupWeapons.<index>.weapon.damage
 *   backupWeapons.<index>.weapon.critical
 *   backupWeapons.<index>.weapon.notes
 *   backupWeapons.<index>.weapon.damageType
 *   backupWeapons.<index>.weapon.rangeIncrement
 *   backupWeapons.<index>.weapon.weight
 *
 * Layout is based on the offHandWeapon row layout, stepping down by 62 pts per slot:
 *   offHandWeapon.name row y = 276  → slot 0 y = 214, slot 1 y = 152, slot 2 y = 90
 *   offHandWeapon.notes row y = 252 → slot 0 y = 190, slot 1 y = 128, slot 2 y = 66
 *
 * Usage:  npx ts-node --transpile-only src/addBackupWeaponFields.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ── Layout constants (match offHandWeapon row geometry) ───────────────────────

/** Y of offHandWeapon name row — each backup slot steps down by SLOT_STEP. */
const BASE_NAME_Y  = 276;
/** Y of offHandWeapon notes row. */
const BASE_NOTES_Y = 252;
/** Vertical distance between weapon slots. */
const SLOT_STEP    = 62;
/** Page index (0-based) where weapon fields live. */
const PAGE_INDEX   = 0;

// ── Name-row field definitions (same x/w/h as offHandWeapon) ─────────────────
interface FieldDef { suffix: string; x: number; w: number; h: number; isNoteRow: boolean; }

const NAME_ROW_FIELDS: Omit<FieldDef, 'isNoteRow'>[] = [
  { suffix: 'weapon.name',           x:  20, w: 140, h: 15 },
  { suffix: 'weapon.attackMod',      x: 163, w:  19, h: 15 },
  { suffix: 'weapon.computedAttack', x: 183, w:  81, h: 15 },
  { suffix: 'weapon.damage',         x: 269, w:  41, h: 15 },
  { suffix: 'weapon.critical',       x: 312, w:  40, h: 15 },
];

// Notes row: label takes the left-most slot (slot title), then special notes.
const NOTES_ROW_FIELDS: Omit<FieldDef, 'isNoteRow'>[] = [
  { suffix: 'label',                 x:  21, w:  60, h: 18 },
  { suffix: 'weapon.notes',          x:  83, w: 155, h: 18 },
  { suffix: 'weapon.damageType',     x: 288, w:  22, h: 15 },
  { suffix: 'weapon.rangeIncrement', x: 309, w:  22, h: 15 },
  { suffix: 'weapon.weight',         x: 330, w:  22, h: 15 },
];

async function run() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');
  const bytes   = fs.readFileSync(pdfPath);
  const doc     = await PDFDocument.load(bytes);
  const form    = doc.getForm();
  const font    = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  if (pages.length <= PAGE_INDEX) {
    throw new Error(`PDF has only ${pages.length} page(s); PAGE_INDEX=${PAGE_INDEX} is out of range.`);
  }
  const page = pages[PAGE_INDEX]!;

  // Collect names already in the form so we can skip duplicates on re-runs.
  const existing = new Set(form.getFields().map((f) => f.getName()));

  let added = 0;
  let skipped = 0;

  for (let i = 0; i < 3; i++) {
    const nameY  = BASE_NAME_Y  - SLOT_STEP * (i + 1);
    const notesY = BASE_NOTES_Y - SLOT_STEP * (i + 1);

    for (const { suffix, x, w, h } of NAME_ROW_FIELDS) {
      const fullName = `backupWeapons.${i}.${suffix}`;
      if (existing.has(fullName)) { console.log(`  skip (exists) ${fullName}`); skipped++; continue; }
      const tf = form.createTextField(fullName);
      tf.acroField.dict.set(doc.context.obj('DA') as any,
        doc.context.obj(`/Helv 8 Tf 0 g`) as any);
      tf.addToPage(page, { x, y: nameY,  width: w, height: h, font, borderWidth: 0, borderColor: rgb(0.8,0.8,0.8), backgroundColor: rgb(1,1,1) });
      console.log(`  + ${fullName}`);
      added++;
    }

    for (const { suffix, x, w, h } of NOTES_ROW_FIELDS) {
      const fullName = `backupWeapons.${i}.${suffix}`;
      if (existing.has(fullName)) { console.log(`  skip (exists) ${fullName}`); skipped++; continue; }
      const tf = form.createTextField(fullName);
      tf.acroField.dict.set(doc.context.obj('DA') as any,
        doc.context.obj(`/Helv 8 Tf 0 g`) as any);
      tf.addToPage(page, { x, y: notesY, width: w, height: h, font, borderWidth: 0, borderColor: rgb(0.8,0.8,0.8), backgroundColor: rgb(1,1,1) });
      console.log(`  + ${fullName}`);
      added++;
    }
  }

  const saved = await doc.save({ updateFieldAppearances: false });
  fs.writeFileSync(pdfPath, saved);

  console.log(`\nDone. ${added} fields added, ${skipped} skipped.`);
  console.log(`Saved → ${pdfPath}`);
}

run().catch((err: unknown) => {
  console.error('Error:', err);
  process.exit(1);
});
