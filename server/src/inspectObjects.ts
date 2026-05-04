import { PDFDocument, PDFName, PDFStream } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const doc = await PDFDocument.load(fs.readFileSync(path.join(__dirname, 'assets/blank.pdf')));
  const ctx = doc.context;

  const sizes: Array<{ ref: string; bytes: number; info: string }> = [];

  for (const [ref, obj] of (ctx as any).indirectObjects) {
    const bytes: number = (obj as any).sizeInBytes?.() ?? (obj?.toString?.().length ?? 0);
    let info = obj?.constructor?.name ?? 'unknown';
    if ((obj as any).dict) {
      const d = (obj as any).dict;
      const type    = d.get?.(PDFName.of('Type'))?.toString?.()    ?? '';
      const subtype = d.get?.(PDFName.of('Subtype'))?.toString?.() ?? '';
      const filter  = d.get?.(PDFName.of('Filter'))?.toString?.()  ?? '';
      const base    = d.get?.(PDFName.of('BaseFont'))?.toString?.() ?? '';
      info = [type, subtype, filter, base].filter(Boolean).join(' ');
    }
    sizes.push({ ref: ref.toString(), bytes, info });
  }

  sizes.sort((a, b) => b.bytes - a.bytes);
  console.log('Top 20 objects by size:');
  console.log('    BYTES  REF           INFO');
  sizes.slice(0, 20).forEach(s =>
    console.log(`${String(s.bytes).padStart(9)}  ${s.ref.padEnd(14)} ${s.info}`),
  );
  const total = sizes.reduce((s, x) => s + x.bytes, 0);
  console.log(`\nTotal objects: ${sizes.length}, logical size: ${(total / 1024).toFixed(0)} KB`);
}
run().catch(console.error);
