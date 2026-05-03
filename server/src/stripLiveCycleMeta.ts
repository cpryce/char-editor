/**
 * Strips LiveCycle Designer / XFA-workflow XMP entries that cause Adobe AI
 * to reject blank.pdf as "unsupported language".
 * Removes: adhocwf namespace + entries, desc namespace + entries, LiveCycle CreatorTool.
 */
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

  // Remove xmlns declarations for adhocwf and desc namespaces
  xmp = xmp.replace(/\s*xmlns:adhocwf="[^"]*"/g, '');
  xmp = xmp.replace(/\s*xmlns:desc="[^"]*"/g, '');

  // Remove adhocwf elements
  xmp = xmp.replace(/\s*<adhocwf:[^>]*>.*?<\/adhocwf:[^>]*>/gs, '');

  // Remove desc elements (multi-line)
  xmp = xmp.replace(/\s*<desc:[^>]*>[\s\S]*?<\/desc:[^>]*>/g, '');

  // Replace LiveCycle creator tool with a neutral value
  xmp = xmp.replace(
    /<xmp:CreatorTool>Adobe LiveCycle Designer ES 9\.0<\/xmp:CreatorTool>/,
    '<xmp:CreatorTool>Adobe Acrobat</xmp:CreatorTool>',
  );

  (metaStream as any).contents = Buffer.from(xmp, 'utf8');
  metaStream.dict.delete(PDFName.of('Length'));

  const saved = await doc.save();
  fs.writeFileSync(pdfPath, saved);
  console.log(`Done: ${(saved.length / 1024).toFixed(1)} KB`);
  console.log('\nVerify — remaining LiveCycle markers:');
  const check = Buffer.from(saved).toString('latin1');
  const markers = ['adhocwf', 'LiveCycle', 'xfa/promoted-desc'];
  for (const m of markers) {
    console.log(`  ${m}: ${check.includes(m) ? 'STILL PRESENT' : 'removed'}`);
  }
}
run().catch(console.error);
