import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFStream } from 'pdf-lib';

async function run() {
  const pdfPath = path.join(__dirname, 'assets/blank.pdf');
  const bytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(bytes);

  const metaRef = doc.catalog.get(PDFName.of('Metadata'));
  if (!metaRef) { console.error('No XMP Metadata stream found'); process.exit(1); }
  const metaStream = doc.context.lookup(metaRef) as PDFStream;

  const raw: Uint8Array = (metaStream as any).contents ?? (metaStream as any).getContents?.() ?? new Uint8Array();
  let xmp = Buffer.from(raw).toString('utf8');

  // Inject dc:language if not already present
  if (xmp.includes('dc:language')) {
    console.log('dc:language already present — no change needed');
  } else {
    // Insert after dc:format
    xmp = xmp.replace(
      '</dc:format>',
      `</dc:format>\n         <dc:language><rdf:Bag><rdf:li>en</rdf:li></rdf:Bag></dc:language>`,
    );
    console.log('Injected dc:language=en into XMP');
  }

  // Write updated XMP back into the stream
  const updated = Buffer.from(xmp, 'utf8');
  (metaStream as any).contents = updated;
  // Clear the Length so pdf-lib recalculates it
  metaStream.dict.delete(PDFName.of('Length'));

  const saved = await doc.save();
  fs.writeFileSync(pdfPath, saved);
  console.log(`Saved → ${pdfPath}  (${(saved.length / 1024).toFixed(1)} KB)`);
}
run().catch(console.error);
