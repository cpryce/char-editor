const fs = require('fs'), path = require('path');
const { PDFDocument, PDFName } = require('pdf-lib');

(async () => {
  const b = fs.readFileSync(path.join(__dirname, 'src/assets/blank.pdf'));
  const doc = await PDFDocument.load(b);
  const pages = doc.getPages();

  console.log(`Total pages: ${pages.length}`);
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    console.log(`\nPage ${i+1}: ${width} x ${height} pts`);

    // Decode and search content stream for text
    const contentStream = page.node.get(PDFName.of('Contents'));
    if (!contentStream) { console.log('  (no content stream)'); continue; }

    try {
      const resolved = doc.context.lookup(contentStream);
      let bytes;
      // Could be array or single stream
      if (resolved && resolved.constructor.name === 'PDFArray') {
        const parts = [];
        for (let j = 0; j < resolved.size(); j++) {
          const s = doc.context.lookup(resolved.get(j));
          if (s && s.getContents) parts.push(s.getContents());
          else if (s && s.contents) parts.push(s.contents);
        }
        bytes = Buffer.concat(parts.map(p => Buffer.from(p)));
      } else if (resolved) {
        bytes = resolved.getContents ? resolved.getContents() : resolved.contents;
      }

      if (!bytes) { console.log('  (could not read contents)'); continue; }

      // Look for BT...ET blocks and extract text
      const text = Buffer.from(bytes).toString('binary');
      // Find text show operators around "Worn"
      const matches = [...text.matchAll(/\((Worn[^)]*|Equipment[^)]*|WORN[^)]*)\)/g)];
      if (matches.length) {
        for (const m of matches) {
          const pos = m.index;
          // Get surrounding context (last Td/TD/Tm before this)
          const ctx = text.substring(Math.max(0, pos - 200), pos + 50);
          console.log(`  Found text "${m[1]}" at offset ${pos}`);
          // Extract coordinates from preceding Tm or Td
          const tdMatch = [...ctx.matchAll(/([-\d.]+)\s+([-\d.]+)\s+Td/g)].pop();
          const tmMatch = [...ctx.matchAll(/([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+Tm/g)].pop();
          if (tmMatch) console.log(`    Tm: tx=${tmMatch[5]} ty=${tmMatch[6]}`);
          if (tdMatch) console.log(`    Td: dx=${tdMatch[1]} dy=${tdMatch[2]}`);
        }
      } else {
        // Just list all text strings on this page
        const allText = [...text.matchAll(/\(([^)]{2,40})\)\s*Tj/g)].slice(0, 20);
        for (const m of allText) console.log(`  Text: "${m[1]}"`);
      }
    } catch(e) {
      console.log('  Error reading content:', e.message);
    }
  }
})();
