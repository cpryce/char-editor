#!/usr/bin/env -S ts-node --transpile-only
/**
 * Fix the DA (Default Appearance) and Q (alignment) of the backupWeapons fields
 * to exactly match the offHandWeapon fields used as the design reference.
 *
 * Mapping (mirrors offHandWeapon field behaviour):
 *   suffix                  DA string          Q (quadding)
 *   ──────────────────────────────────────────────────────
 *   weapon.name             /Helv 8 Tf 0 g     — (left)
 *   weapon.attackMod        /Helv 8 Tf 0 g     1 (center)
 *   weapon.computedAttack   /Helv 7 Tf 0 g     1 (center)
 *   weapon.damage           /Helv 6 Tf 0 g     1 (center)
 *   weapon.critical         /Helv 6 Tf 0 g     1 (center)
 *   label                   /Helv 8 Tf 0 g     — (left)
 *   weapon.notes            /Helv 8 Tf 0 g     — (left)
 *   weapon.damageType       /Helv 6 Tf 0 g     1 (center)
 *   weapon.rangeIncrement   /Helv 6 Tf 0 g     1 (center)
 *   weapon.weight           /Helv 6 Tf 0 g     1 (center)
 *
 * Usage:  npx ts-node --transpile-only src/fixBackupWeaponFieldAppearance.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFNumber, PDFString } from 'pdf-lib';

/** Appearance config keyed by the suffix after backupWeapons.<n>. */
const FIELD_STYLE: Record<string, { da: string; q: number | null }> = {
  'weapon.name':           { da: '/Helv 8 Tf 0 g', q: null },
  'weapon.attackMod':      { da: '/Helv 8 Tf 0 g', q: 1   },
  'weapon.computedAttack': { da: '/Helv 7 Tf 0 g', q: 1   },
  'weapon.damage':         { da: '/Helv 6 Tf 0 g', q: 1   },
  'weapon.critical':       { da: '/Helv 6 Tf 0 g', q: 1   },
  'label':                 { da: '/Helv 8 Tf 0 g', q: null },
  'weapon.notes':          { da: '/Helv 8 Tf 0 g', q: null },
  'weapon.damageType':     { da: '/Helv 6 Tf 0 g', q: 1   },
  'weapon.rangeIncrement': { da: '/Helv 6 Tf 0 g', q: 1   },
  'weapon.weight':         { da: '/Helv 6 Tf 0 g', q: 1   },
};

function clearWidgetChrome(field: { acroField: { getWidgets(): Array<{ dict: PDFDict }> } }, doc: PDFDocument) {
  for (const widget of field.acroField.getWidgets()) {
    const widgetDict = widget.dict;
    const mk = widgetDict.lookup(PDFName.of('MK'), PDFDict);

    if (mk) {
      mk.delete(PDFName.of('BG'));
      mk.delete(PDFName.of('BC'));
    }

    widgetDict.delete(PDFName.of('BS'));
    widgetDict.delete(PDFName.of('C'));

    const border = PDFArray.withContext(doc.context);
    border.push(PDFNumber.of(0));
    border.push(PDFNumber.of(0));
    border.push(PDFNumber.of(0));
    widgetDict.set(PDFName.of('Border'), border);
  }
}

async function run() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');
  const bytes   = fs.readFileSync(pdfPath);
  const doc     = await PDFDocument.load(bytes);
  const form    = doc.getForm();

  let patched = 0;

  for (const field of form.getFields()) {
    const name = field.getName();
    // Match backupWeapons.<index>.<suffix>
    const m = name.match(/^backupWeapons\.\d+\.(.+)$/);
    if (!m || !m[1]) continue;

    const suffix = m[1];
    const style  = FIELD_STYLE[suffix];
    if (!style) {
      console.warn(`  ? no style config for suffix "${suffix}" (field: ${name})`);
      continue;
    }

    const dict = field.acroField.dict;

    // Set DA (Default Appearance) as a PDFString
    dict.set(PDFName.of('DA'), PDFString.of(style.da));

    // Set or remove Q (Quadding / alignment)
    if (style.q !== null) {
      dict.set(PDFName.of('Q'), PDFNumber.of(style.q));
    } else {
      dict.delete(PDFName.of('Q'));
    }

    clearWidgetChrome(field, doc);

    console.log(`  ✓ ${name}  DA="${style.da}"  Q=${style.q ?? '(left/unset)'}  chrome=none`);
    patched++;
  }

  const saved = await doc.save({ updateFieldAppearances: false });
  fs.writeFileSync(pdfPath, saved);

  console.log(`\nDone. ${patched} fields patched.`);
  console.log(`Saved → ${pdfPath}`);
}

run().catch((err: unknown) => {
  console.error('Error:', err);
  process.exit(1);
});
