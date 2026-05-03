#!/usr/bin/env -S ts-node --transpile-only
/**
 * Add AcroForm fields for the Worn Equipment section on page 3 of blank.pdf.
 *
 * Each of the 12 worn slots gets 4 fields:
 *   wornSlots.<slot>.weight   — text, left-aligned
 *   wornSlots.<slot>.name     — text, left-aligned
 *   wornSlots.<slot>.acBonus  — text, center-aligned
 *   wornSlots.<slot>.acType   — dropdown
 *
 * Reference fields placed by user are removed:
 *   inventory.wornSlots.head.name
 *   inventory.wornSlots.feet.name
 *
 * Appearance for all fields:
 *   DA = /Helv 6 Tf 0 g   (6pt Helvetica, black)
 *   No border, no fill (transparent background)
 *
 * Usage:  npx ts-node --transpile-only src/addWornEquipmentFields.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PDFDocument, PDFName, PDFString,
  PDFNumber, StandardFonts,
} from 'pdf-lib';

const PAGE_INDEX = 1;  // page 2 (0-based)
const DA         = '/Helv 6 Tf 0 g';
const H          = 11;  // field height in pts

// 12 worn slots with their y positions (head=top, feet=bottom)
// head y=381, feet y=198 → step = (381-198)/11 ≈ 16.636
const SLOTS: Array<{ key: string; y: number }> = [
  { key: 'head',      y: 381 },
  { key: 'face',      y: 364 },
  { key: 'neck',      y: 348 },
  { key: 'shoulders', y: 331 },
  { key: 'bodySlot',  y: 315 },
  { key: 'chest',     y: 298 },
  { key: 'wrists',    y: 281 },
  { key: 'hands',     y: 265 },
  { key: 'ringLeft',  y: 248 },
  { key: 'ringRight', y: 231 },
  { key: 'waist',     y: 215 },
  { key: 'feet',      y: 198 },
];

// Column x positions and widths
const COL_WEIGHT   = { x: 232, w: 12 };  // tiny weight column
const COL_NAME     = { x: 246, w: 99  };  // main item name
const COL_AC_BONUS = { x: 347, w: 17  };  // numeric AC bonus (center)
const COL_AC_TYPE  = { x: 366, w: 27  };  // dropdown

// AC type options — empty string = no selection
const AC_TYPE_OPTIONS = [
  '', 'armor', 'shield', 'deflection', 'dodge',
  'natural', 'insight', 'luck', 'sacred', 'profane',
];

// Reference fields the user placed as anchors — left as-is (different names, won't conflict)
// inventory.wornSlots.head.name, inventory.wornSlots.feet.name

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');
  const bytes   = fs.readFileSync(pdfPath);
  const doc     = await PDFDocument.load(bytes);
  const form    = doc.getForm();
  const font    = await doc.embedFont(StandardFonts.Helvetica);

  const pages = doc.getPages();
  const page  = pages[PAGE_INDEX];
  if (!page) throw new Error(`No page at index ${PAGE_INDEX}`);

  const { height } = page.getSize();
  console.log(`Page ${PAGE_INDEX + 1}: height=${height}`);

  // Collect existing field names first (before any mutations)
  const existing = new Set(form.getFields().map((f) => f.getName()));

  let added = 0;
  let skipped = 0;

  console.log('\nAdding worn equipment fields:');

  for (const slot of SLOTS) {
    const prefix = `wornSlots.${slot.key}`;
    const y      = slot.y;

    // ── weight (text, left-aligned) ────────────────────────────────────────
    const weightName = `${prefix}.weight`;
    if (!existing.has(weightName)) {
      const tf = form.createTextField(weightName);
      tf.acroField.dict.set(PDFName.of('DA'), PDFString.of(DA));
      // Q=0 left (default)
      tf.addToPage(page, {
        x: COL_WEIGHT.x, y, width: COL_WEIGHT.w, height: H,
        font, borderWidth: 0,
      });
      console.log(`  + ${weightName}`);
      added++;
    } else { skipped++; }

    // ── name (text, left-aligned) ──────────────────────────────────────────
    const nameName = `${prefix}.name`;
    if (!existing.has(nameName)) {
      const tf = form.createTextField(nameName);
      tf.acroField.dict.set(PDFName.of('DA'), PDFString.of(DA));
      tf.addToPage(page, {
        x: COL_NAME.x, y, width: COL_NAME.w, height: H,
        font, borderWidth: 0,
      });
      console.log(`  + ${nameName}`);
      added++;
    } else { skipped++; }

    // ── acBonus (text, center-aligned Q=1) ────────────────────────────────
    const bonusName = `${prefix}.acBonus`;
    if (!existing.has(bonusName)) {
      const tf = form.createTextField(bonusName);
      tf.acroField.dict.set(PDFName.of('DA'), PDFString.of(DA));
      tf.acroField.dict.set(PDFName.of('Q'), PDFNumber.of(1));
      tf.addToPage(page, {
        x: COL_AC_BONUS.x, y, width: COL_AC_BONUS.w, height: H,
        font, borderWidth: 0,
      });
      console.log(`  + ${bonusName}`);
      added++;
    } else { skipped++; }

    // ── acType (dropdown) ─────────────────────────────────────────────────
    const typeName = `${prefix}.acType`;
    if (!existing.has(typeName)) {
      const dd = form.createDropdown(typeName);
      dd.addOptions(AC_TYPE_OPTIONS);
      dd.acroField.dict.set(PDFName.of('DA'), PDFString.of(DA));
      dd.addToPage(page, {
        x: COL_AC_TYPE.x, y, width: COL_AC_TYPE.w, height: H,
        font, borderWidth: 0,
      });
      console.log(`  + ${typeName}`);
      added++;
    } else { skipped++; }
  }

  const saved = await doc.save({ updateFieldAppearances: false });
  fs.writeFileSync(pdfPath, saved);

  console.log(`\nDone. ${added} fields added, ${skipped} skipped.`);
  console.log(`Saved → ${pdfPath}  (${(saved.length / 1024).toFixed(1)} KB)`);
}

run().catch((err: unknown) => {
  console.error('Error:', err);
  process.exit(1);
});
