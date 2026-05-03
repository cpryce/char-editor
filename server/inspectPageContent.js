const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { PDFDocument, PDFName } = require('pdf-lib');

function decompress(rawBytes) {
  try { return zlib.inflateSync(Buffer.from(rawBytes)); }
  catch { try { return zlib.inflateRawSync(Buffer.from(rawBytes)); } catch { return null; } }
}

(async () => {
  const b = fs.readFileSync(path.join(__dirname, 'src/assets/blank.pdf'));
  const doc = await PDFDocument.load(b);
  const pages = doc.getPages();
  const ctx = doc.context;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const contentsRef = page.node.get(PDFName.of('Contents'));
    if (!contentsRef) { console.log(`Page ${i+1}: no contents`); continue; }

    // Gather raw streams
    const streams = [];
    const resolved = ctx.lookup(contentsRef);
    if (!resolved) continue;

    if (resolved.constructor.name === 'PDFArray') {
      for (let j = 0; j < resolved.size(); j++) {
        const s = ctx.lookup(resolved.get(j));
        if (s && s.contents) streams.push(s.contents);
      }
    } else if (resolved.contents) {
      streams.push(resolved.contents);
    }

    let text = '';
    for (const raw of streams) {
      const dec = decompress(raw);
      if (dec) text += dec.toString('latin1');
    }

    if (!text) { console.log(`Page ${i+1}: (could not decompress)`); continue; }

    console.log(`\n=== Page ${i+1} (${text.length} chars) ===`);

    // Look for readable text strings near Worn/Equipment keywords
    // Extract all (string) Tj and [(string)] TJ occurrences
    const strings = [];
    for (const m of text.matchAll(/\(([^)\\]{1,60})\)\s*(?:Tj|TJ)/g)) strings.push(m[1].trim());
    // Also handle array TJ: [(text) ...] TJ  
    for (const m of text.matchAll(/\[([^\]]{1,200})\]\s*TJ/g)) {
      const inner = m[1].replace(/\)\s*[-\d.]+\s*\(/g, '').replace(/^\(|\)$/g, '').replace(/[()]/g, '');
      if (inner.trim()) strings.push(inner.trim());
    }

    // Print strings that look like section headers or slot names
    const keywords = ['worn', 'equip', 'slot', 'head', 'neck', 'ring', 'body', 'foot', 'feet', 'hand', 'wrist', 'waist', 'should', 'chest', 'face'];
    const relevant = strings.filter(s => keywords.some(k => s.toLowerCase().includes(k)));
    if (relevant.length) {
      console.log('Relevant strings:', relevant.slice(0, 30).join(' | '));
    }

    // Find y-coordinates of text blocks — look for Tm operators
    const tmOps = [...text.matchAll(/([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+Tm/g)];
    const yCoords = [...new Set(tmOps.map(m => Math.round(parseFloat(m[6]))))].sort((a,b) => b-a);
    console.log(`Y coords (Tm): ${yCoords.slice(0, 30).join(', ')}`);
  }
})();
