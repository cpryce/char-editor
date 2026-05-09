import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFDropdown, PDFName, PDFNumber, PDFString, PDFTextField, StandardFonts } from 'pdf-lib';
import { RACES } from './rules/coreMechanics';

const FIELD_NAME = 'race';
const COMBO_FLAG = 1 << 17; // AcroForm field flag for Combo box.

async function run() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');
  const bytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const field = form.getField(FIELD_NAME);

  if (field instanceof PDFDropdown) {
    const existing = new Set(field.getOptions());
    const missing = RACES.filter((race) => !existing.has(race));
    if (missing.length > 0) field.addOptions(missing);
    form.updateFieldAppearances(font);
    const saved = await pdfDoc.save({ updateFieldAppearances: false });
    fs.writeFileSync(pdfPath, saved);
    console.log(`Field \"${FIELD_NAME}\" is already a dropdown. Added ${missing.length} missing option(s).`);
    console.log(`Saved -> ${pdfPath}`);
    return;
  }

  if (!(field instanceof PDFTextField)) {
    throw new Error(`Field \"${FIELD_NAME}\" is not text or dropdown.`);
  }

  const currentValue = field.getText()?.trim() ?? '';
  const acroField = (field as any).acroField;
  const dict = acroField.dict;

  // Convert field type from text (/Tx) to choice (/Ch), and set combo flag.
  dict.set(PDFName.of('FT'), PDFName.of('Ch'));
  const ffObj = dict.get(PDFName.of('Ff')) as any;
  const currentFlags = typeof ffObj?.asNumber === 'function' ? ffObj.asNumber() : 0;
  dict.set(PDFName.of('Ff'), PDFNumber.of(currentFlags | COMBO_FLAG));

  // Install canonical race options used across the app.
  dict.set(PDFName.of('Opt'), pdfDoc.context.obj(RACES));

  if (currentValue && RACES.includes(currentValue as (typeof RACES)[number])) {
    dict.set(PDFName.of('V'), PDFString.of(currentValue));
  } else {
    dict.delete(PDFName.of('V'));
  }

  form.updateFieldAppearances(font);
  const saved = await pdfDoc.save({ updateFieldAppearances: false });
  fs.writeFileSync(pdfPath, saved);

  console.log(`Converted \"${FIELD_NAME}\" to dropdown with ${RACES.length} option(s).`);
  console.log(`Saved -> ${pdfPath}`);
}

run().catch((err: unknown) => {
  console.error('Error:', err);
  process.exit(1);
});
