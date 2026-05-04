/**
 * Remove duplicate embedded Helvetica OpenType font streams from blank.pdf.
 *
 * Each time a dev script ran doc.embedFont(StandardFonts.Helvetica) and saved,
 * pdf-lib embedded a full ~90KB OpenType Helvetica font set (font program +
 * CMap + ToUnicode streams). This accumulated across multiple script runs.
 *
 * The wornSlot / backup-weapon fields use /Helv in their DA string, which
 * resolves to the original lightweight Type1 Helvetica reference already in
 * the AcroForm DR — the large OpenType embeds are never actually needed.
 *
 * Strategy:
 *  1. Walk AcroForm DR /Font dict, find entries whose font program stream
 *     (FontFile3 / FontFile2 / FontFile) is >10KB.
 *  2. If BaseFont contains "Helvetica", mark the whole font tree as dead.
 *  3. Delete dead objects and their DR entry.
 *  4. Also scan page /Resources for the same refs and clean them up.
 */
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef } from 'pdf-lib';

async function run() {
  const pdfPath = path.join(__dirname, 'assets/blank.pdf');
  const doc  = await PDFDocument.load(fs.readFileSync(pdfPath));
  const ctx  = doc.context;
  const indirectObjects: Map<PDFRef, any> = (ctx as any).indirectObjects;

  // Helper: get an indirect object (resolve ref)
  function lookup(refOrObj: any): any {
    if (!refOrObj) return null;
    try { return ctx.lookup(refOrObj); } catch { return null; }
  }

  // Collect all object sizes upfront so we can identify large font programs
  function byteSize(obj: any): number {
    return (obj as any).sizeInBytes?.() ?? (obj?.toString?.().length ?? 0);
  }

  // Find AcroForm DR Fonts dict
  const acroFormRef  = doc.catalog.get(PDFName.of('AcroForm'));
  const acroForm     = lookup(acroFormRef) as PDFDict | null;
  const drRef        = acroForm?.get(PDFName.of('DR'));
  const dr           = lookup(drRef) as PDFDict | null;
  const fontsDictRef = dr?.get(PDFName.of('Font'));
  const fontsDict    = lookup(fontsDictRef) as PDFDict | null;

  if (!fontsDict) {
    console.error('No AcroForm DR Font dict found');
    process.exit(1);
  }

  const deadRefs = new Set<string>(); // ref.toString() keys to delete

  function markTree(ref: any) {
    if (!ref) return;
    const key = ref.toString?.() ?? String(ref);
    if (deadRefs.has(key)) return;
    deadRefs.add(key);
    const obj = lookup(ref) as PDFDict | null;
    if (!obj) return;
    // DescendantFonts
    const descFontsRaw = obj.get?.(PDFName.of('DescendantFonts'));
    if (descFontsRaw) {
      const arr = lookup(descFontsRaw);
      if (arr?.constructor?.name === 'PDFArray') {
        for (const item of (arr as any).array ?? (arr as any).elements ?? []) {
          markTree(item);
        }
      }
    }
    // FontDescriptor → font files
    const descRef = obj.get?.(PDFName.of('FontDescriptor'));
    if (descRef) {
      markTree(descRef);
      const desc = lookup(descRef) as PDFDict | null;
      for (const fileKey of ['FontFile', 'FontFile2', 'FontFile3']) {
        const fileRef = desc?.get?.(PDFName.of(fileKey));
        if (fileRef) markTree(fileRef);
      }
    }
    // ToUnicode
    const toUni = obj.get?.(PDFName.of('ToUnicode'));
    if (toUni) markTree(toUni);
  }

  const drKeysToRemove: string[] = [];

  // Scan DR font entries
  const entries: Array<[any, any]> = [];
  if ((fontsDict as any).entries) {
    for (const pair of (fontsDict as any).entries()) entries.push(pair);
  } else if ((fontsDict as any).dict) {
    for (const [k, v] of (fontsDict as any).dict) entries.push([k, v]);
  }

  for (const [keyObj, valRef] of entries) {
    const fontDict = lookup(valRef) as PDFDict | null;
    if (!fontDict) continue;
    const baseName = fontDict.get?.(PDFName.of('BaseFont'))?.toString() ?? '';
    // Only target embedded Helvetica (not the small /Helv Type1 references)
    if (!baseName.toLowerCase().includes('helvetica')) continue;

    // Check if the font has a large embedded font program
    const descRef = fontDict.get?.(PDFName.of('FontDescriptor'));
    const desc    = lookup(descRef) as PDFDict | null;
    let fontFileRef: any = null;
    for (const fk of ['FontFile', 'FontFile2', 'FontFile3']) {
      fontFileRef = desc?.get?.(PDFName.of(fk));
      if (fontFileRef) break;
    }

    // Also check DescendantFonts for the font program
    let hasBigFontProgram = false;
    if (fontFileRef) {
      const ff = lookup(fontFileRef);
      if (ff && byteSize(ff) > 10_000) hasBigFontProgram = true;
    }
    // For Type0 fonts check descendant font descriptors
    const descFontsRaw = fontDict.get?.(PDFName.of('DescendantFonts'));
    if (descFontsRaw && !hasBigFontProgram) {
      const arr = lookup(descFontsRaw);
      for (const childRef of (arr as any)?.array ?? (arr as any)?.elements ?? []) {
        const child = lookup(childRef) as PDFDict | null;
        const childDescRef = child?.get?.(PDFName.of('FontDescriptor'));
        const childDesc = lookup(childDescRef) as PDFDict | null;
        for (const fk of ['FontFile', 'FontFile2', 'FontFile3']) {
          const cfRef = childDesc?.get?.(PDFName.of(fk));
          if (cfRef) {
            const cf = lookup(cfRef);
            if (cf && byteSize(cf) > 10_000) { hasBigFontProgram = true; break; }
          }
        }
        if (hasBigFontProgram) break;
      }
    }

    if (!hasBigFontProgram) continue;

    const key = keyObj?.toString?.() ?? String(keyObj);
    console.log(`Marking for removal: DR key=${key}  BaseFont=${baseName}`);
    drKeysToRemove.push(key);
    markTree(valRef);
  }

  if (drKeysToRemove.length === 0) {
    console.log('No large embedded Helvetica fonts found — nothing to remove.');
    process.exit(0);
  }

  // Remove from DR Font dict
  for (const key of drKeysToRemove) {
    (fontsDict as any).delete?.(PDFName.of(key.replace(/^\//,'')));
  }

  // Delete dead indirect objects
  let deleted = 0;
  for (const [ref] of indirectObjects) {
    if (deadRefs.has(ref.toString())) {
      indirectObjects.delete(ref);
      deleted++;
    }
  }

  console.log(`Deleted ${deleted} objects (${drKeysToRemove.length} font trees)`);

  const saved = await doc.save();
  fs.writeFileSync(pdfPath, saved);
  console.log(`Saved: ${(saved.length / 1024).toFixed(1)} KB  (was ${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB before overwrite)`);
}
run().catch(console.error);
