#!/usr/bin/env -S ts-node --transpile-only
/**
 * Inspect AcroForm field positions for weapon-related fields.
 * Usage:  npx ts-node --transpile-only src/inspectFieldPositions.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';

async function inspect() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');
  const bytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  const pages = doc.getPages();

  for (const field of form.getFields()) {
    const name = field.getName();
    const widgets = field.acroField.getWidgets();
    for (const w of widgets) {
      const rect = w.getRectangle();
      // Find which page owns this widget
      let pageIndex = -1;
      for (let i = 0; i < pages.length; i++) {
        const annots = pages[i]?.node.Annots();
        if (!annots) continue;
        for (let j = 0; j < annots.size(); j++) {
          if (annots.get(j) === (w as any).ref) { pageIndex = i; break; }
        }
        if (pageIndex >= 0) break;
      }
      console.log(
        `${name} | page=${pageIndex} | x=${Math.round(rect.x)} y=${Math.round(rect.y)} w=${Math.round(rect.width)} h=${Math.round(rect.height)}`
      );
    }
  }
}

inspect().catch((err) => { console.error(err); process.exit(1); });
