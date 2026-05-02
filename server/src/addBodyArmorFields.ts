#!/usr/bin/env -S ts-node --transpile-only
/**
 * Add AcroForm text fields to blank.pdf for the body-armor slot.
 *
 * Layout mirrors the offHandShield row (same y, to the left).
 * offHandShield occupies x=314–546; body armor uses x=20–311.
 *
 * Field names follow the MongoDB inventory.body structure:
 *   body.name
 *   body.armorBonus        (base + enhancement total, like offHandShield.shieldBonus)
 *   body.maxDexBonus
 *   body.armorCheckPenalty
 *   body.arcaneSpellFailure
 *   body.speed
 *   body.weight
 *
 * Appearance matches offHandShield exactly:
 *   DA = /Helv 8 Tf 0 g   (8pt Helvetica, black)
 *   Q  = not set           (left-aligned)
 *
 * Usage:  npx ts-node --transpile-only src/addBodyArmorFields.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFString, rgb, StandardFonts } from 'pdf-lib';

const PAGE_INDEX = 0;

/** y values matching the offHandShield row (name sits 1pt higher than numerics). */
const Y_NAME    = 33;
const Y_NUMERIC = 32;
const H         = 15;

/**
 * Field layout — mirrors offHandShield proportions, scaled into 292pt
 * (x=20 to x=312, leaving a 2pt gap before shield starts at x=314).
 *
 *  body.name              x=20  w=120   → ends at 140
 *  body.armorBonus        x=142 w=23    → ends at 165
 *  body.maxDexBonus       x=167 w=23    → ends at 190
 *  body.armorCheckPenalty x=192 w=23    → ends at 215
 *  body.arcaneSpellFailure x=216 w=20   → ends at 236
 *  body.speed             x=238 w=40   → ends at 278  (wider: "20 ft.")
 *  body.weight            x=280 w=23   → ends at 303  (gap of 11 before shield)
 */
const FIELDS: Array<{ name: string; x: number; y: number; w: number; h: number }> = [
  { name: 'body.name',             x:  20, y: Y_NAME,    w: 120, h: H },
  { name: 'body.armorBonus',       x: 142, y: Y_NUMERIC, w:  23, h: H },
  { name: 'body.maxDexBonus',      x: 167, y: Y_NUMERIC, w:  23, h: H },
  { name: 'body.armorCheckPenalty',x: 192, y: Y_NUMERIC, w:  23, h: H },
  { name: 'body.arcaneSpellFailure', x: 216, y: Y_NUMERIC, w: 20, h: H },
  { name: 'body.speed',            x: 238, y: Y_NUMERIC, w:  40, h: H },
  { name: 'body.weight',           x: 280, y: Y_NUMERIC, w:  23, h: H },
];

const DA = '/Helv 8 Tf 0 g';

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

  const existing = new Set(form.getFields().map((f) => f.getName()));

  let added = 0;
  let skipped = 0;

  for (const def of FIELDS) {
    if (existing.has(def.name)) {
      console.log(`  skip (exists)  ${def.name}`);
      skipped++;
      continue;
    }

    const tf = form.createTextField(def.name);

    // Set DA to match offHandShield exactly.
    tf.acroField.dict.set(PDFName.of('DA'), PDFString.of(DA));
    // No Q key set → left-aligned (same as offHandShield fields).

    tf.addToPage(page, {
      x: def.x, y: def.y, width: def.w, height: def.h,
      font,
      borderWidth: 0,
      borderColor: rgb(0.8, 0.8, 0.8),
      backgroundColor: rgb(1, 1, 1),
    });

    console.log(`  +  ${def.name}  (x=${def.x} y=${def.y} w=${def.w} h=${def.h})`);
    added++;
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
