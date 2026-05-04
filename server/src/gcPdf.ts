/**
 * Garbage-collect blank.pdf: traverse the object graph from the PDF catalog,
 * mark all reachable objects, then delete every unreachable indirect object.
 *
 * This removes duplicate/orphaned font embeds, stale appearance streams, and
 * any other debris left by repeated script runs on the template.
 *
 * Also exported as `gcPdfDoc(doc)` for use inside other dev scripts so they
 * can self-clean after embedding fonts.
 */
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFArray, PDFDict, PDFRef, PDFStream } from 'pdf-lib';

/** Remove all unreachable indirect objects from a loaded PDFDocument in-place. */
export function gcPdfDoc(doc: PDFDocument): { deleted: number; deletedBytes: number } {
  const ctx = doc.context;
  const indirectObjects: Map<PDFRef, any> = (ctx as any).indirectObjects;

  const reachable = new Set<string>();

  function visitObj(obj: any): void {
    if (!obj || typeof obj !== 'object') return;
    const name = obj.constructor?.name ?? '';
    if (name === 'PDFArray') {
      for (const item of (obj as any).array ?? (obj as any).elements ?? []) visitRef(item);
    } else if (name === 'PDFDict' || name === 'PDFCatalog' || name === 'PDFPageTree' || name === 'PDFPage' || name === 'PDFPageLeaf') {
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
  const before  = fs.statSync(pdfPath).size;
  const doc     = await PDFDocument.load(fs.readFileSync(pdfPath));

  const { deleted, deletedBytes } = gcPdfDoc(doc);
  console.log(`Reachable objects kept, deleted: ${deleted}  (~${(deletedBytes / 1024).toFixed(0)} KB logical)`);

  const saved = await doc.save();
  fs.writeFileSync(pdfPath, saved);
  console.log(`Before: ${(before / 1024).toFixed(1)} KB`);
  console.log(`After : ${(saved.length / 1024).toFixed(1)} KB`);
  console.log(`Saved : ${((before - saved.length) / 1024).toFixed(1)} KB`);
}
run().catch(console.error);
