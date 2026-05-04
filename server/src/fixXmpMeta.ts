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

  // Fix title
  xmp = xmp.replace(
    /(<rdf:li xml:lang="x-default">)[^<]*/,
    '$1AD&D 3.5 Character Sheet',
  );

  // Fix creator tool (any LiveCycle variant)
  xmp = xmp.replace(
    /<xmp:CreatorTool>[^<]*<\/xmp:CreatorTool>/,
    '<xmp:CreatorTool>Adobe Acrobat</xmp:CreatorTool>',
  );

  (metaStream as any).contents = Buffer.from(xmp, 'utf8');
  metaStream.dict.delete(PDFName.of('Length'));

  const saved = await doc.save();
  fs.writeFileSync(pdfPath, saved);
  console.log(`Saved: ${(saved.length / 1024).toFixed(1)} KB`);

  // Verify
  const check = Buffer.from(saved).toString('utf8');
  console.log('Title fixed:', check.includes('AD&D 3.5 Character Sheet'));
  console.log('LiveCycle removed:', !check.includes('LiveCycle Designer'));
}
run().catch(console.error);
