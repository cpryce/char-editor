import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFStream } from 'pdf-lib';

async function run() {
  const bytes = fs.readFileSync(path.join(__dirname, 'assets/blank.pdf'));
  const doc = await PDFDocument.load(bytes);
  const metaRef = doc.catalog.get(PDFName.of('Metadata'));
  if (!metaRef) { console.log('No XMP Metadata stream'); return; }
  const metaStream = doc.context.lookup(metaRef) as PDFStream;
  const raw = (metaStream as any).contents ?? (metaStream as any).getContents?.() ?? new Uint8Array();
  console.log(Buffer.from(raw).toString('utf8'));
}
run().catch(console.error);
