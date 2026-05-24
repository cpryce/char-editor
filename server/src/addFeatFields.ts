#!/usr/bin/env -S ts-node --transpile-only
/**
 * Add AcroForm text fields for the Feats & Features section on page 2 of blank.pdf.
 *
 * Layout:
 *   Page 2 (index 1), top-left quadrant.
 *   Two columns of 23 rows each = 46 feat fields total.
 *   Fields are named:  feat.0 … feat.45
 *     Indices 0–22  → left column (top to bottom)
 *     Indices 23–45 → right column (top to bottom)
 *
 * Appearance:
 *   DA = /Helv 8 Tf 0 g   (8 pt Helvetica, black)
 *   No border, no background (transparent)
 *
 * Fill order (handled in fillCharacterPdf.ts, capped at 46 entries):
 *   1. Class feats  (source === 'Class Feat')
 *   2. Racial bonus feats  (source === 'Bonus Feat')
 *   3. All remaining feats  ('Character Feat', 'Fighter Bonus Feat', 'Special')
 *
 * Usage:  npx ts-node --transpile-only src/addFeatFields.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFString, StandardFonts } from 'pdf-lib';
import { gcPdfDoc } from './gcPdf';

// ── Configuration ─────────────────────────────────────────────────────────────

const PAGE_INDEX = 1;          // page 2 (0-based)
const DA         = '/Helv 8 Tf 0 g';

/** Field height in pts */
const H = 10;

/**
 * Vertical layout of the feat section.
 * Y values are the bottom edge of each field rectangle (PDF bottom-left origin).
 *
 * The Feats & Features section on page 2 has 23 ruled lines per column.
 * Fields are centered on each line (step = 15 pt, matching the ruled-line pitch).
 */
const ROWS        = 23;
const Y_FIRST     = 757;   // bottom edge of the first (top) field
const Y_STEP      = -15;   // negative: each subsequent row is lower on the page

/**
 * Two sub-columns within the feats section.
 * The section spans roughly x=17 to x=397; the divider sits at ~x=208.
 */
const COLUMNS = [
  { x: 17,  w: 186 },   // left column
  { x: 208, w: 185 },   // right column
] as const;

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

  const existing = new Set(form.getFields().map((f) => f.getName()));

  let added   = 0;
  let skipped = 0;

  console.log('\nAdding feat fields:');

  let fieldIndex = 0;

  for (const col of COLUMNS) {
    for (let row = 0; row < ROWS; row++) {
      const fieldName = `feat.${fieldIndex}`;
      const y = Y_FIRST + row * Y_STEP;

      if (existing.has(fieldName)) {
        console.log(`  skip (exists)  ${fieldName}`);
        skipped++;
      } else {
        const tf = form.createTextField(fieldName);
        tf.acroField.dict.set(PDFName.of('DA'), PDFString.of(DA));
        // Q=0 (left-align) is the default — no need to set explicitly
        tf.addToPage(page, {
          x: col.x,
          y,
          width:  col.w,
          height: H,
          font,
          borderWidth: 0,
        });
        // Remove the automatically added /MK background so the field has no fill
        try {
          const widget = tf.acroField.getWidgets()[0];
          if (widget) {
            (widget as any).dict.delete(PDFName.of('MK'));
          }
        } catch { /* best-effort */ }
        console.log(`  + ${fieldName}  x=${col.x} y=${y} w=${col.w} h=${H}`);
        added++;
      }

      fieldIndex++;
    }
  }

  gcPdfDoc(doc);
  const saved = await doc.save({ updateFieldAppearances: false });
  fs.writeFileSync(pdfPath, saved);

  console.log(`\nDone. ${added} fields added, ${skipped} skipped.`);
  console.log(`Saved → ${pdfPath}  (${(saved.length / 1024).toFixed(1)} KB)`);
}

run().catch((err: unknown) => {
  console.error('Error:', err);
  process.exit(1);
});
