#!/usr/bin/env -S ts-node --transpile-only
/**
 * Inspect the race field dictionary in blank.pdf
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFDropdown, PDFName } from 'pdf-lib';

async function inspect() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  const field = form.getField('race');
  console.log('Field type:', field.constructor.name);

  if (field instanceof PDFDropdown) {
    console.log('Options:', field.getOptions());
    console.log('Selected:', field.getSelected());

    // Get the internal acro field dict
    const acroField = (field as any).acroField;
    const dict = acroField.dict;

    console.log('\n--- PDF Dictionary ---');
    console.log('FT:', dict.get(PDFName.of('FT'))?.toString());
    console.log('Ff (decimal):', dict.get(PDFName.of('Ff'))?.toString());
    console.log('V:', dict.get(PDFName.of('V'))?.toString());
    const opt = dict.get(PDFName.of('Opt'));
    console.log('Opt:', opt?.toString());
    console.log('Opt type:', opt?.constructor.name);

    if (opt && typeof (opt as any).asArray === 'function') {
      const optArray = (opt as any).asArray();
      console.log('Options array length:', optArray.length);
      console.log('First few options:');
      optArray.slice(0, 3).forEach((o: any, i: number) => {
        console.log(`  [${i}]:`, o.toString(), '(' + o.constructor.name + ')');
      });
    }
  }
}

inspect().catch(console.error);
