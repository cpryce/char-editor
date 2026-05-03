import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFArray, PDFStream } from 'pdf-lib';

async function run() {
  const doc = await PDFDocument.load(fs.readFileSync(path.join(__dirname, 'assets/blank.pdf')));
  const acroFormRef = doc.catalog.get(PDFName.of('AcroForm'));
  if (!acroFormRef) { console.log('No AcroForm'); return; }
  const acroForm = doc.context.lookup(acroFormRef) as any;

  const xfaRef = acroForm.get(PDFName.of('XFA'));
  if (!xfaRef) { console.log('No XFA entry in AcroForm'); return; }

  const xfa = doc.context.lookup(xfaRef);
  console.log('XFA type:', xfa?.constructor?.name);

  // XFA can be a stream or an array of [name, stream, name, stream, ...]
  if (xfa?.constructor?.name === 'PDFArray') {
    const arr = xfa as PDFArray;
    const items: any[] = (arr as any).array ?? (arr as any).elements ?? [];
    for (let i = 0; i < items.length; i += 2) {
      const nameObj = doc.context.lookup(items[i]);
      const streamObj = doc.context.lookup(items[i + 1]);
      const label = nameObj?.toString() ?? `item[${i}]`;
      if (streamObj?.constructor?.name === 'PDFRawStream' || streamObj?.constructor?.name === 'PDFStream') {
        const raw: Uint8Array = (streamObj as any).contents ?? new Uint8Array();
        const text = Buffer.from(raw).toString('utf8').slice(0, 2000);
        console.log(`\n── XFA chunk: ${label} ──`);
        console.log(text);
      }
    }
  } else if (xfa?.constructor?.name === 'PDFRawStream' || xfa?.constructor?.name === 'PDFStream') {
    const raw: Uint8Array = (xfa as any).contents ?? new Uint8Array();
    console.log('\n── XFA stream ──');
    console.log(Buffer.from(raw).toString('utf8').slice(0, 3000));
  }
}
run().catch(console.error);
