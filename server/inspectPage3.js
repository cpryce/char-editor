const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { PDFDocument, PDFName } = require('pdf-lib');

function decompress(rawBytes) {
  try { return zlib.inflateSync(Buffer.from(rawBytes)); }
  catch { try { return zlib.inflateRawSync(Buffer.from(rawBytes)); } catch { return null; } }
}

// Parse content stream into tokens for analysis
function parseTokens(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '%') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (text[i] === '(') {
      let j = i+1, depth = 1, s = '';
      while (j < text.length && depth > 0) {
        if (text[j] === '\\') { s += text[j] + text[j+1]; j += 2; continue; }
        if (text[j] === '(') depth++;
        if (text[j] === ')') { depth--; if (depth === 0) { j++; break; } }
        s += text[j++];
      }
      tokens.push({ type: 'string', value: s });
      i = j; continue;
    }
    if (text[i] === '[') {
      let j = i+1, arr = [];
      while (j < text.length && text[j] !== ']') {
        if (text[j] === '(') {
          let k = j+1, depth = 1, s = '';
          while (k < text.length && depth > 0) {
            if (text[k] === '\\') { s += text[k+1]; k += 2; continue; }
            if (text[k] === '(') depth++;
            if (text[k] === ')') { depth--; if (depth === 0) { k++; break; } }
            s += text[k++];
          }
          arr.push(s); j = k; continue;
        }
        j++;
      }
      tokens.push({ type: 'array', value: arr.join('') });
      i = j+1; continue;
    }
    if (/\s/.test(text[i])) { i++; continue; }
    // operator/number
    let j = i;
    while (j < text.length && !/[\s\[\]()\/%]/.test(text[j])) j++;
    if (j > i) { tokens.push({ type: 'token', value: text.substring(i, j) }); }
    i = j;
  }
  return tokens;
}

(async () => {
  const b = fs.readFileSync(path.join(__dirname, 'src/assets/blank.pdf'));
  const doc = await PDFDocument.load(b);
  const pages = doc.getPages();
  const ctx = doc.context;

  // Only page 3
  const pageIdx = 2;
  const page = pages[pageIdx];
  const contentsRef = page.node.get(PDFName.of('Contents'));
  const streams = [];
  const resolved = ctx.lookup(contentsRef);
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

  const tokens = parseTokens(text);

  // Walk tokens, tracking current text position via Tm/Td operators
  let curX = 0, curY = 0;
  const textItems = []; // { x, y, text }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'token') {
      if (t.value === 'Tm' && i >= 6) {
        // a b c d e f Tm
        curX = parseFloat(tokens[i-2].value);
        curY = parseFloat(tokens[i-1].value);
      } else if (t.value === 'Td' && i >= 2) {
        curX += parseFloat(tokens[i-2].value);
        curY += parseFloat(tokens[i-1].value);
      } else if ((t.value === 'Tj' || t.value === 'TJ') && i >= 1) {
        const prev = tokens[i-1];
        const str = prev.type === 'string' || prev.type === 'array' ? prev.value : '';
        if (str.trim()) textItems.push({ x: Math.round(curX), y: Math.round(curY), text: str });
      }
    }
  }

  // Print all text items with coords, looking for section headers
  console.log('=== Page 3 text items ===');
  for (const item of textItems) {
    const lo = item.text.toLowerCase();
    const isHeader = lo.includes('worn') || lo.includes('equip') || lo.includes('slot') ||
      lo.includes('head') || lo.includes('neck') || lo.includes('ring') || lo.includes('body') ||
      lo.includes('hand') || lo.includes('wrist') || lo.includes('waist') || lo.includes('chest') ||
      lo.includes('shoulder') || lo.includes('feet') || lo.includes('foot') || lo.includes('face') ||
      lo.includes('item') || lo.includes('weight') || lo.includes('bonus') || lo.includes('ac ') ||
      item.text.length < 30;
    if (isHeader) console.log(`  y=${item.y} x=${item.x} "${item.text}"`);
  }
})();
