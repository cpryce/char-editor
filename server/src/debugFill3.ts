import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { PDFDocument, PDFTextField } from 'pdf-lib';
import { Character } from './models/Character';
import { SIZE_CATEGORIES } from './rules/coreMechanics';

function signed(n: number) { return n >= 0 ? `+${n}` : `${n}`; }
function abilityMod(s: number) { return Math.floor((s - 10) / 2); }
function totalAbilityScore(s: { base: number; racial: number; enhancement: number; misc: number; levelUp?: number }) {
  return s.base + s.racial + s.enhancement + s.misc + (s.levelUp ?? 0);
}
function verboseSet(form: ReturnType<PDFDocument['getForm']>, name: string, value: string | number | null | undefined) {
  try {
    const field = form.getField(name);
    if (field instanceof PDFTextField) {
      field.setText(value == null ? '' : String(value));
      if (name.includes('saves')) console.log(`  SET ${name.padEnd(40)} = "${field.getText()}"`);
    }
  } catch (e) {
    if (name.includes('saves')) console.log(`  ERR ${name.padEnd(40)} ${(e as Error).message}`);
  }
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI ?? '');
  const char = await Character.findById('69ee5397a77ab4bd76aacc61');
  if (!char) { process.exit(1); }

  const s = char.abilityScores;
  const con = totalAbilityScore(s.constitution);
  const dex = totalAbilityScore(s.dexterity);
  const wis = totalAbilityScore(s.wisdom);
  const conMod = abilityMod(con);
  const dexMod = abilityMod(dex);
  const wisMod = abilityMod(wis);
  const saves = char.combat.saves;
  const saveAbilityMod = { fortitude: conMod, reflex: dexMod, will: wisMod } as const;

  const pdfDoc = await PDFDocument.load(fs.readFileSync(path.join(__dirname, 'assets/blank.pdf')));
  const form = pdfDoc.getForm();

  for (const save of ['fortitude', 'reflex', 'will'] as const) {
    const sv  = saves[save];
    const mod = saveAbilityMod[save];
    const total = sv.base + mod + sv.magic + sv.misc + sv.temp;
    verboseSet(form, `combat.saves.${save}.base`,  sv.base);
    verboseSet(form, `combat.saves.${save}.mod`,   signed(mod));
    verboseSet(form, `combat.saves.${save}.magic`, sv.magic || '');
    verboseSet(form, `combat.saves.${save}.misc`,  sv.misc  || '');
    verboseSet(form, `combat.saves.${save}.total`, signed(total));
  }

  form.updateFieldAppearances();
  const bytes = await doc.save();  // intentional typo — will error to confirm point
  await mongoose.disconnect();
}
run().catch(e => { console.error(String(e)); process.exit(1); });
