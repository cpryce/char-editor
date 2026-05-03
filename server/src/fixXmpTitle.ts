import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFStream } from 'pdf-lib';

async function run() {
  const pdfPath = path.join(__dirname, 'assets/blank.pdf');
  const doc = await PDFDocument.load(fs.readFileSync(pdfPath));
  const metaRef = doc.catalog.get(PDFName.of('Metadata'));
  if (!metaRef) { console.error('No XMP stream'); process.exit(1); }
  const metaStream = doc.context.lookup(metaRef) as PDFStream;
  const raw: Uint8Array = (metaStream as any).contents ?? new Uint8Array();
  let xmp = Buffer.from(raw).toString('utf8');
  const before = xmp;
  xmp = xmp.replace(/MalgarosWar17\.pdf/g, 'AD&D 3.5 Character Sheet');
  if (xmp === before) {
    console.log('Title string not found — check XMP manually');
  } else {
    (metaStream as any).contents = Buffer.from(xmp, 'utf8');
    metaStream.dict.delete(PDFName.of('Length'));
    const saved = await doc.save();
    fs.writeFileSync(pdfPath, saved);
    console.log('Done:', (saved.length / 1024).toFixed(1), 'KB');
  }
}
run().catch(console.error);
