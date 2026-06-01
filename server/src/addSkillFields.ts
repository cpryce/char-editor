#!/usr/bin/env -S ts-node --transpile-only
/**
 * Add AcroForm fields for skills rows 1–41 in blank.pdf.
 *
 * Anchor rows skills.0 and skills.42 are left untouched.
 * 40 new rows (skills.1 … skills.41) are spaced equally between them.
 *
 * Visual properties read from each skills.0 anchor field and applied to
 * every new field in that column:
 *   • DA            — font name, size, colour
 *   • Q             — 0=left  1=centre  2=right
 *   • Border width  — from BS/W or Border[2]
 *   • Border colour — from widget MK/BC
 *   • Background    — from widget MK/BG
 *
 * Usage:  npx ts-node --transpile-only src/addSkillFields.ts
 */

import * as fs   from 'fs';
import * as path from 'path';
import {
  PDFDocument, PDFCheckBox, PDFRef,
  PDFName, PDFString, PDFNumber, PDFArray, PDFDict,
  StandardFonts,
} from 'pdf-lib';
import { gcPdfDoc } from './gcPdf';

// ── Field column order ────────────────────────────────────────────────────────

const SUFFIXES = [
  'classSkill', 'name', 'keyAbility',
  'bonus', 'ranks', 'miscBonus', 'score',
] as const;
type Suffix = (typeof SUFFIXES)[number];

// ── Property readers ──────────────────────────────────────────────────────────

function getDA(field: { acroField: { dict: PDFDict } }): string {
  const v = field.acroField.dict.get(PDFName.of('DA'));
  return v instanceof PDFString ? v.decodeText() : '';
}
function getQ(field: { acroField: { dict: PDFDict } }): number {
  const v = field.acroField.dict.get(PDFName.of('Q'));
  return v instanceof PDFNumber ? v.asNumber() : 0;
}
function getBorderWidth(widget: { dict: PDFDict }): number {
  const bs = widget.dict.get(PDFName.of('BS'));
  if (bs instanceof PDFDict) {
    const w = bs.get(PDFName.of('W'));
    if (w instanceof PDFNumber) return w.asNumber();
  }
  const border = widget.dict.get(PDFName.of('Border'));
  if (border instanceof PDFArray && border.size() >= 3) {
    const w = border.get(2);
    if (w instanceof PDFNumber) return w.asNumber();
  }
  return 0;
}
function getMKColor(widget: { dict: PDFDict }, key: 'BC' | 'BG'): number[] | null {
  const mk = widget.dict.get(PDFName.of('MK'));
  if (!(mk instanceof PDFDict)) return null;
  const arr = mk.get(PDFName.of(key));
  if (!(arr instanceof PDFArray)) return null;
  const out: number[] = [];
  for (let i = 0; i < arr.size(); i++) {
    const el = arr.get(i);
    out.push(el instanceof PDFNumber ? el.asNumber() : 0);
  }
  return out;
}
function colorLabel(c: number[] | null): string {
  if (c === null)     return 'absent';
  if (c.length === 0) return 'transparent';
  if (c.length === 1) return `grey(${c[0]!.toFixed(2)})`;
  if (c.length === 3) return `rgb(${c.map((v) => v.toFixed(2)).join(', ')})`;
  if (c.length === 4) return `cmyk(${c.map((v) => v.toFixed(2)).join(', ')})`;
  return JSON.stringify(c);
}
function qLabel(q: number) { return q === 1 ? 'centre' : q === 2 ? 'right' : 'left'; }

// ── Field info ────────────────────────────────────────────────────────────────

interface FieldInfo {
  rect:        { x: number; y: number; width: number; height: number };
  pageIndex:   number;
  isCheckBox:  boolean;
  da:          string;
  q:           number;
  borderWidth: number;
  borderColor: number[] | null;
  bgColor:     number[] | null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');

  // 1. Backup
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = `${pdfPath}.bak.${ts}`;
  fs.copyFileSync(pdfPath, backupPath);
  console.log(`Backup written: ${backupPath}\n`);

  // 2. Load
  const bytes = fs.readFileSync(pdfPath);
  const doc   = await PDFDocument.load(bytes);
  const form  = doc.getForm();
  const pages = doc.getPages();

  // 3. Collect anchor field info
  const infoMap = new Map<string, FieldInfo>();
  for (const field of form.getFields()) {
    const name = field.getName();
    if (!name.startsWith('skills.0.') && !name.startsWith('skills.42.')) continue;
    const widgets = field.acroField.getWidgets();
    if (!widgets.length) continue;
    const widget = widgets[0]!;
    const rect   = widget.getRectangle();
    let pageIndex = -1;
    // Use the widget's /P entry (direct page reference) for reliable lookup
    const pageRef = widget.dict.get(PDFName.of('P'));
    if (pageRef instanceof PDFRef) {
      for (let pi = 0; pi < pages.length; pi++) {
        if ((pages[pi] as any).ref?.objectNumber === pageRef.objectNumber) {
          pageIndex = pi;
          break;
        }
      }
    }
    infoMap.set(name, {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      pageIndex,
      isCheckBox:  field instanceof PDFCheckBox,
      da:          getDA(field),
      q:           getQ(field),
      borderWidth: getBorderWidth(widget),
      borderColor: getMKColor(widget, 'BC'),
      bgColor:     getMKColor(widget, 'BG'),
    });
  }

  // 4. Print anchor properties
  for (const prefix of ['skills.0', 'skills.42'] as const) {
    console.log(`── ${prefix} anchor fields ────────────────────────────────────────`);
    for (const suffix of SUFFIXES) {
      const key  = `${prefix}.${suffix}`;
      const info = infoMap.get(key);
      if (!info) { console.log(`  ${key.padEnd(34)}  *** NOT FOUND ***`); continue; }
      const { x, y, width, height } = info.rect;
      if (info.isCheckBox) {
        console.log(
          `  ${key.padEnd(34)} page=${info.pageIndex}` +
          `  left=${String(Math.round(x)).padStart(4)}  top=${String(Math.round(y)).padStart(4)}` +
          `  w=${String(Math.round(width)).padStart(3)}  h=${String(Math.round(height)).padStart(2)}` +
          `  [CheckBox]  border-w=${info.borderWidth}  border-color=${colorLabel(info.borderColor)}  bg=${colorLabel(info.bgColor)}`,
        );
      } else {
        console.log(
          `  ${key.padEnd(34)} page=${info.pageIndex}` +
          `  left=${String(Math.round(x)).padStart(4)}  top=${String(Math.round(y)).padStart(4)}` +
          `  w=${String(Math.round(width)).padStart(3)}  h=${String(Math.round(height)).padStart(2)}` +
          `  [TextField]  DA="${info.da}"  align=${qLabel(info.q)}` +
          `  border-w=${info.borderWidth}  border-color=${colorLabel(info.borderColor)}  bg=${colorLabel(info.bgColor)}`,
        );
      }
    }
    console.log('');
  }

  // 5. Validate
  const missing = SUFFIXES.flatMap((s) => [
    ...(!infoMap.has(`skills.0.${s}`)  ? [`skills.0.${s}`]  : []),
    ...(!infoMap.has(`skills.42.${s}`) ? [`skills.42.${s}`] : []),
  ]);
  if (missing.length) {
    console.error('ERROR — missing anchor fields (no changes written):');
    missing.forEach((m) => console.error(`  ${m}`));
    process.exit(1);
  }

  // 6. Resolve target page
  const pageIndex = infoMap.get('skills.0.classSkill')!.pageIndex;
  const page = pages[pageIndex];
  if (!page) throw new Error(`Page index ${pageIndex} not found`);

  const font     = await doc.embedFont(StandardFonts.Helvetica);
  const existing = new Set(form.getFields().map((f) => f.getName()));
  let added = 0, skipped = 0;

  // 7. Create rows 1–41, inheriting all visual properties from skills.0
  console.log('── Creating fields ──────────────────────────────────────────────');
  for (const suffix of SUFFIXES as readonly Suffix[]) {
    const f0  = infoMap.get(`skills.0.${suffix}`)!;
    const f42 = infoMap.get(`skills.42.${suffix}`)!;
    const yStep = (f42.rect.y - f0.rect.y) / 42;
    const { x, width, height } = f0.rect;

    for (let row = 1; row <= 41; row++) {
      const fieldName = `skills.${row}.${suffix}`;
      if (existing.has(fieldName)) {
        console.log(`  skip (exists)  ${fieldName}`);
        skipped++;
        continue;
      }

      const y = f0.rect.y + yStep * row;

      if (f0.isCheckBox) {
        form.createCheckBox(fieldName).addToPage(page, { x, y, width, height, borderWidth: f0.borderWidth });
      } else {
        const tf = form.createTextField(fieldName);
        tf.acroField.dict.set(PDFName.of('DA'), PDFString.of(f0.da || '/Helv 8 Tf 0 g'));
        tf.acroField.dict.set(PDFName.of('Q'),  PDFNumber.of(f0.q));

        const opts: Parameters<typeof tf.addToPage>[1] = {
          x, y, width, height, font,
          borderWidth: f0.borderWidth,
        };

        if (f0.borderColor?.length === 3) {
          const [r, g, b] = f0.borderColor as [number, number, number];
          opts.borderColor = { type: 'RGB', red: r, green: g, blue: b } as any;
        }
        if (f0.bgColor?.length === 3) {
          const [r, g, b] = f0.bgColor as [number, number, number];
          opts.backgroundColor = { type: 'RGB', red: r, green: g, blue: b } as any;
        } else if (f0.bgColor?.length === 1) {
          opts.backgroundColor = { type: 'Grayscale', gray: f0.bgColor[0]! } as any;
        }

        tf.addToPage(page, opts);
      }

      console.log(`  + ${fieldName.padEnd(34)}  y=${Math.round(y)}`);
      added++;
    }
  }

  console.log(`\n  ${added} added, ${skipped} skipped`);

  // 8. GC + save
  await gcPdfDoc(doc);
  fs.writeFileSync(pdfPath, await doc.save());
  console.log(`\nSaved: ${pdfPath}`);
}

run().catch((err) => { console.error(err); process.exit(1); });
