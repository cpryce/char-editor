#!/usr/bin/env -S ts-node --transpile-only
/**
 * Inspect AcroForm field names in blank.pdf.
 * Usage:  npm run inspect-pdf           (from server/)
 *         npx ts-node --transpile-only src/inspectPdf.ts
 *         ./src/inspectPdf.ts           (after chmod +x)
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFField, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } from 'pdf-lib';

async function inspect() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  if (fields.length === 0) {
    console.log('No AcroForm fields found in the PDF.');
    return;
  }

  console.log(`\nFound ${fields.length} fields:\n`);
  console.log(
    'INDEX'.padEnd(6) +
    'TYPE'.padEnd(18) +
    'NAME',
  );
  console.log('-'.repeat(80));

  fields.forEach((field: PDFField, i: number) => {
    let type = 'Unknown';
    if (field instanceof PDFTextField)  type = 'TextField';
    else if (field instanceof PDFCheckBox)   type = 'CheckBox';
    else if (field instanceof PDFRadioGroup) type = 'RadioGroup';
    else if (field instanceof PDFDropdown)   type = 'Dropdown';
    else if (field instanceof PDFOptionList) type = 'OptionList';

    console.log(
      String(i).padEnd(6) +
      type.padEnd(18) +
      field.getName(),
    );
  });

  console.log('');
}

inspect().catch((err: unknown) => {
  console.error('Error inspecting PDF:', err);
  process.exit(1);
});
