import { PDFDocument, PDFName } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const doc = await PDFDocument.load(fs.readFileSync(path.join(__dirname, 'assets/blank.pdf')));
  const ctx = doc.context;

  // Find all font objects
  for (const [ref, obj] of (ctx as any).indirectObjects) {
    if (!(obj as any).dict) continue;
    const d = (obj as any).dict;
    const type    = d.get?.(PDFName.of('Type'))?.toString?.()     ?? '';
    const subtype = d.get?.(PDFName.of('Subtype'))?.toString?.()  ?? '';
    const base    = d.get?.(PDFName.of('BaseFont'))?.toString?.()  ?? '';
    const name    = d.get?.(PDFName.of('Name'))?.toString?.()      ?? '';
    const bytes: number = (obj as any).sizeInBytes?.() ?? 0;
    if (type === '/Font' || subtype === '/OpenType' || subtype === '/Type1C' || base || (bytes > 10000)) {
      console.log(`${ref.toString().padEnd(14)} ${String(bytes).padStart(8)}B  type=${type} sub=${subtype} base=${base} name=${name}`);
    }
  }
}
run().catch(console.error);
