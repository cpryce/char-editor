/**
 * Optimize blank.pdf using qpdf (must be installed: brew install qpdf).
 *
 * Uses: qpdf --object-streams=generate --compress-streams=y --recompress-flate --linearize
 *
 * Also exports gcPdfDoc(doc) — a lightweight pass that lets dev scripts save
 * a pdf-lib doc after modifications without leaving dangling embedded-font
 * objects. NOTE: gcPdfDoc only removes objects not reachable from the trailer;
 * for a full structural optimization, run this script (which uses qpdf).
 */
import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { PDFDocument, PDFDict, PDFRef } from 'pdf-lib';

/** Remove unreachable indirect objects from a pdf-lib PDFDocument in-place. */
export function gcPdfDoc(doc: PDFDocument): { deleted: number; deletedBytes: number } {
  const ctx = doc.context;
  const indirectObjects: Map<PDFRef, any> = (ctx as any).indirectObjects;

  const reachable = new Set<string>();

  function visitObj(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    const name = obj.constructor?.name ?? '';
    if (name === 'PDFArray') {
      for (const item of (obj as any).array ?? (obj as any).elements ?? []) visitRef(item);
    } else if (['PDFDict','PDFCatalog','PDFPageTree','PDFPage','PDFPageLeaf'].includes(name)) {
      const d: PDFDict = obj as PDFDict;
      if (d.entries) for (const [, val] of d.entries()) visitRef(val);
    } else if (name === 'PDFStream' || name === 'PDFRawStream') {
      const d: PDFDict = (obj as any).dict;
      if (d?.entries) for (const [, val] of d.entries()) visitRef(val);
    }
  }

  function visitRef(val: any): void {
    if (!val || typeof val !== 'object') return;
    if (val.constructor?.name === 'PDFRef') {
      const key = val.toString() as string;
      if (reachable.has(key)) return;
      reachable.add(key);
      let resolved: any;
      try { resolved = ctx.lookup(val); } catch { return; }
      visitObj(resolved);
    } else {
      visitObj(val);
    }
  }

  const trailerInfo: Record<string, any> = (ctx as any).trailerInfo ?? {};
  for (const val of Object.values(trailerInfo)) visitRef(val);

  let deleted = 0;
  let deletedBytes = 0;
  for (const [ref, obj] of indirectObjects) {
    if (!reachable.has(ref.toString())) {
      deletedBytes += (obj as any).sizeInBytes?.() ?? 0;
      indirectObjects.delete(ref);
      deleted++;
    }
  }

  return { deleted, deletedBytes };
}

async function run() {
  const pdfPath = path.join(__dirname, 'assets/blank.pdf');
  const bakPath = pdfPath + '.bak';
  const before  = fs.statSync(pdfPath).size;

  fs.copyFileSync(pdfPath, bakPath);
  console.log(`Backup → ${bakPath}`);

  cp.execFileSync('qpdf', [
    '--compress-streams=y',
    '--recompress-flate',
    '--object-streams=disable',
    bakPath,
    pdfPath,
  ]);

  const after = fs.statSync(pdfPath).size;
  console.log(`Before: ${(before / 1024).toFixed(1)} KB`);
  console.log(`After : ${(after  / 1024).toFixed(1)} KB`);
  console.log(`Saved : ${((before - after) / 1024).toFixed(1)} KB`);
}
run().catch(console.error);
