#!/usr/bin/env -S ts-node --transpile-only
/**
 * Remove unused AdobeDevanagari font resources from blank.pdf.
 *
 * These two fonts (~195 KB each) are embedded but not referenced by any
 * page or form field — they were included by the original design tool.
 * Removing them from the AcroForm default resources (DR) causes pdf-lib
 * to omit all unreachable font objects on save, reducing file size by ~40%.
 *
 * Usage:  npx ts-node --transpile-only src/optimizePdf.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

const FONTS_TO_REMOVE = ['AdobeDevanagari-Regular', 'AdobeDevanagari-Bold'];

async function run() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');
  const bytes   = fs.readFileSync(pdfPath);
  const sizeBefore = bytes.length;
  console.log(`Before: ${(sizeBefore / 1024).toFixed(1)} KB`);

  const doc     = await PDFDocument.load(bytes);
  const context = doc.context;

  // Collect all font refs that resolve to AdobeDevanagari variants,
  // including their FontDescriptor and FontFile streams.
  const deadRefs = new Set<any>(); // PDFRef objects to delete from context

  function markDeadFontTree(dictRef: any) {
    if (!dictRef) return;
    const dict = context.lookup(dictRef);
    if (!dict || dict.constructor?.name !== 'PDFDict') return;

    // Recurse into DescendantFonts array (Type0 → CIDFont)
    const descendants = (dict as PDFDict).get(PDFName.of('DescendantFonts'));
    if (descendants) {
      const arr = context.lookup(descendants);
      if (arr && arr.constructor?.name === 'PDFArray') {
        for (const item of (arr as any).elements ?? []) {
          markDeadFontTree(item);
        }
      }
    }

    // FontDescriptor → FontFile3
    const descRef = (dict as PDFDict).get(PDFName.of('FontDescriptor'));
    if (descRef) {
      const desc = context.lookup(descRef);
      if (desc && desc.constructor?.name === 'PDFDict') {
        for (const key of ['FontFile', 'FontFile2', 'FontFile3']) {
          const fileRef = (desc as PDFDict).get(PDFName.of(key));
          if (fileRef) {
            console.log(`  marking FontFile ${fileRef} as dead`);
            deadRefs.add(fileRef);
          }
        }
        console.log(`  marking FontDescriptor ${descRef} as dead`);
        deadRefs.add(descRef);
      }
    }

    // Mark the font dict itself
    deadRefs.add(dictRef);
  }

  // Walk every indirect object looking for font dicts matching our targets.
  // Also collect ALL font-dict refs we want to remove from the DR table.
  const drRemoveKeys: string[] = [];

  // 1. Find AcroForm DR font dict
  const acroForm = doc.catalog.get(PDFName.of('AcroForm'));
  const acroFormDict = acroForm ? context.lookup(acroForm) as PDFDict | null : null;
  const drRef = acroFormDict?.get(PDFName.of('DR'));
  const dr = drRef ? context.lookup(drRef) as PDFDict | null : null;
  const fontsDictRef = dr?.get(PDFName.of('Font'));
  const fontsDict = fontsDictRef ? context.lookup(fontsDictRef) as PDFDict | null : null;

  if (!fontsDict) {
    console.error('Could not locate AcroForm DR Font dict — nothing to do.');
    process.exit(0);
  }

  // 2. Find entries pointing to AdobeDevanagari
  for (const [key, valRef] of (fontsDict as any).entries?.() ?? []) {
    const fontObj = context.lookup(valRef);
    if (!fontObj || fontObj.constructor?.name !== 'PDFDict') continue;
    const baseName = (fontObj as PDFDict).get(PDFName.of('BaseFont'))?.toString() ?? '';
    const isTarget = FONTS_TO_REMOVE.some((f) => baseName.includes(f));
    if (!isTarget) continue;

    console.log(`Found unused font: ${baseName} (key=${key}) — removing from DR`);
    drRemoveKeys.push(key.toString());
    markDeadFontTree(valRef);
  }

  if (drRemoveKeys.length === 0) {
    console.log('No AdobeDevanagari fonts found in AcroForm DR. Nothing removed.');
    process.exit(0);
  }

  // 3. Remove from DR Font dict
  for (const key of drRemoveKeys) {
    (fontsDict as any).delete?.(PDFName.of(key));
  }

  console.log(`Removed ${drRemoveKeys.length} font entries. Dead objects: ${deadRefs.size}`);

  // 4. Delete dead objects from the context's internal map so pdf-lib doesn't write them.
  const indirectObjects: Map<any, any> = (context as any).indirectObjects;
  let deletedCount = 0;
  for (const ref of deadRefs) {
    if (indirectObjects.delete(ref)) deletedCount++;
  }
  console.log(`Deleted ${deletedCount} objects from context.`);

  // 5. Save
  const saved = await doc.save({ updateFieldAppearances: false });
  fs.writeFileSync(pdfPath, saved);

  const sizeAfter = saved.length;
  const saved_kb  = ((sizeBefore - sizeAfter) / 1024).toFixed(1);
  console.log(`After:  ${(sizeAfter  / 1024).toFixed(1)} KB`);
  console.log(`Saved:  ${saved_kb} KB (${((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1)}% reduction)`);
}

run().catch((err: unknown) => {
  console.error('Error:', err);
  process.exit(1);
});
