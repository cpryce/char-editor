import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFTextField, PDFName, PDFBool, PDFDict, PDFRef, PDFString, StandardFonts } from 'pdf-lib';
import type { ICharacter } from '../models/Character';
import { SIZE_CATEGORIES } from '../rules/coreMechanics';

// ── Helpers ───────────────────────────────────────────────────────────────────

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function totalAbilityScore(score: ICharacter['abilityScores']['strength']): number {
  return score.base + score.racial + score.enhancement + score.misc + (score.levelUp ?? 0);
}

/**
 * Effective temporary modifier for an ability score.
 * Uses the stored tempMod when set; otherwise derives it from the temp score.
 * Returns null when neither is set (no temporary effect active).
 */
function effectiveTempMod(score: ICharacter['abilityScores']['strength']): number | null {
  if (score.tempMod != null) return score.tempMod;
  if (score.temp   != null) return abilityMod(score.temp);
  return null;
}

/** Silently skip a field if it doesn't exist or isn't a text field. */
function safeSet(
  form: ReturnType<PDFDocument['getForm']>,
  name: string,
  value: string | number | null | undefined,
) {
  try {
    const field = form.getField(name);
    if (field instanceof PDFTextField) {
      field.setText(value == null ? '' : String(value));
    }
  } catch {
    // Field not found or wrong type — skip gracefully.
  }
}

// ── Main export function ──────────────────────────────────────────────────────

export async function fillCharacterPdf(character: ICharacter): Promise<Uint8Array> {
  const templatePath = path.join(__dirname, '../assets/blank.pdf');
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const { abilityScores: s } = character;

  const str  = totalAbilityScore(s.strength);
  const dex  = totalAbilityScore(s.dexterity);
  const con    = totalAbilityScore(s.constitution);
  const int_   = totalAbilityScore(s.intelligence);
  const wis    = totalAbilityScore(s.wisdom);
  const cha    = totalAbilityScore(s.charisma);

  // Normal mods (from total score); used for AC, saves, and as fallback for .mod field.
  const strMod = abilityMod(str);
  const dexMod = abilityMod(dex);
  const conMod = abilityMod(con);
  const intMod = abilityMod(int_);
  const wisMod = abilityMod(wis);
  const chaMod = abilityMod(cha);

  // Effective mods: use tempMod override (or derive from temp score) when active.
  const strEffMod = effectiveTempMod(s.strength)      ?? strMod;
  const dexEffMod = effectiveTempMod(s.dexterity)     ?? dexMod;
  const conEffMod = effectiveTempMod(s.constitution)  ?? conMod;
  const intEffMod = effectiveTempMod(s.intelligence)  ?? intMod;
  const wisEffMod = effectiveTempMod(s.wisdom)         ?? wisMod;
  const chaEffMod = effectiveTempMod(s.charisma)      ?? chaMod;

  const sizeMod = SIZE_CATEGORIES[character.size as keyof typeof SIZE_CATEGORIES]?.acAttackMod ?? 0;

  const classes = character.classes;
  const ac = character.combat.armorClass;
  const saves = character.combat.saves;

  // ── Fill fields ───────────────────────────────────────────────────────────
  // Field names follow the JSON-path convention used in blank.pdf.
  // safeSet silently skips any field not yet present in the template.

  // Identity
  safeSet(form, 'name',   character.name);
  safeSet(form, 'player', '');                   // not stored on character model

  // Classes (indices 0–3)
  for (let i = 0; i < 4; i++) {
    safeSet(form, `classes.${i}.name`,  classes[i]?.name  ?? '');
    safeSet(form, `classes.${i}.level`, classes[i]?.level ?? '');
  }

  // Hit points
  safeSet(form, 'hitPoints.max', character.hitPoints.max);

  // Ability scores — strength
  safeSet(form, 'abilityScores.strength.total',       str);
  safeSet(form, 'abilityScores.strength.mod',         signed(strEffMod));
  safeSet(form, 'abilityScores.strength.base',        s.strength.base);
  safeSet(form, 'abilityScores.strength.racial',      s.strength.racial      || '');
  safeSet(form, 'abilityScores.strength.misc',        s.strength.misc        || '');
  safeSet(form, 'abilityScores.strength.enhancement', s.strength.enhancement || '');
  safeSet(form, 'abilityScores.strength.levelUp',     s.strength.levelUp     || '');
  safeSet(form, 'abilityScores.strength.temp',    s.strength.temp  != null ? s.strength.temp  : '');
  safeSet(form, 'abilityScores.strength.tempMod',  effectiveTempMod(s.strength) != null ? signed(effectiveTempMod(s.strength)!) : '');

  // Ability scores — dexterity
  safeSet(form, 'abilityScores.dexterity.total',       dex);
  safeSet(form, 'abilityScores.dexterity.mod',         signed(dexEffMod));
  safeSet(form, 'abilityScores.dexterity.base',        s.dexterity.base);
  safeSet(form, 'abilityScores.dexterity.racial',      s.dexterity.racial      || '');
  safeSet(form, 'abilityScores.dexterity.misc',        s.dexterity.misc        || '');
  safeSet(form, 'abilityScores.dexterity.enhancement', s.dexterity.enhancement || '');
  safeSet(form, 'abilityScores.dexterity.levelUp',     s.dexterity.levelUp     || '');
  safeSet(form, 'abilityScores.dexterity.temp',    s.dexterity.temp  != null ? s.dexterity.temp  : '');
  safeSet(form, 'abilityScores.dexterity.tempMod',  effectiveTempMod(s.dexterity) != null ? signed(effectiveTempMod(s.dexterity)!) : '');

  // Ability scores — constitution
  safeSet(form, 'abilityScores.constitution.total',       con);
  safeSet(form, 'abilityScores.constitution.mod',         signed(conEffMod));
  safeSet(form, 'abilityScores.constitution.base',        s.constitution.base);
  safeSet(form, 'abilityScores.constitution.racial',      s.constitution.racial      || '');
  safeSet(form, 'abilityScores.constitution.misc',        s.constitution.misc        || '');
  safeSet(form, 'abilityScores.constitution.enhancement', s.constitution.enhancement || '');
  safeSet(form, 'abilityScores.constitution.levelUp',     s.constitution.levelUp     || '');
  safeSet(form, 'abilityScores.constitution.temp',    s.constitution.temp    != null ? s.constitution.temp    : '');
  safeSet(form, 'abilityScores.constitution.tempMod',  effectiveTempMod(s.constitution) != null ? signed(effectiveTempMod(s.constitution)!) : '');

  for (const [key, total, effMod, score] of [
    ['intelligence', int_, intEffMod, s.intelligence],
    ['wisdom',       wis,  wisEffMod, s.wisdom],
    ['charisma',     cha,  chaEffMod, s.charisma],
  ] as const) {
    safeSet(form, `abilityScores.${key}.total`,       total);
    safeSet(form, `abilityScores.${key}.mod`,         signed(effMod));
    safeSet(form, `abilityScores.${key}.base`,        score.base);
    safeSet(form, `abilityScores.${key}.racial`,      score.racial      || '');
    safeSet(form, `abilityScores.${key}.misc`,        score.misc        || '');
    safeSet(form, `abilityScores.${key}.enhancement`, score.enhancement || '');
    safeSet(form, `abilityScores.${key}.levelUp`,     score.levelUp     || '');
    safeSet(form, `abilityScores.${key}.temp`,    score.temp    != null ? score.temp    : '');
    safeSet(form, `abilityScores.${key}.tempMod`,  effectiveTempMod(score) != null ? signed(effectiveTempMod(score)!) : '');
  }

  // Armor class — stored components
  safeSet(form, 'combat.armorClass.armor',       ac.armor);
  safeSet(form, 'combat.armorClass.shield',      ac.shield);
  safeSet(form, 'combat.armorClass.dexterityMod', signed(dexEffMod));
  safeSet(form, 'combat.armorClass.size',        sizeMod || '');
  safeSet(form, 'combat.armorClass.dodge',       ac.dodge       || '');
  safeSet(form, 'combat.armorClass.natural',     ac.natural     || '');
  safeSet(form, 'combat.armorClass.deflection',  ac.deflection  || '');
  safeSet(form, 'combat.armorClass.misc',        ac.misc        || '');

  // Armor class — derived totals
  const acTotal      = 10 + ac.armor + ac.shield + dexEffMod + sizeMod + ac.dodge + ac.natural + ac.deflection + ac.misc;
  const acTouch      = 10 + dexEffMod + sizeMod + ac.dodge + ac.deflection + ac.misc;
  const acFlatFooted = 10 + ac.armor + ac.shield + sizeMod + ac.natural + ac.deflection + ac.misc;
  safeSet(form, 'combat.armorClass.total',      acTotal);
  safeSet(form, 'combat.armorClass.touch',      acTouch);
  safeSet(form, 'combat.armorClass.flatFooted', acFlatFooted);

  // Saving throws — stored components + derived mod and total.
  // Mod = ability's effectiveTempMod if set, otherwise derived from total score.
  const fortMod   = conEffMod;
  const reflexMod = dexEffMod;
  const willMod   = wisEffMod;

  const saveDefs = [
    { save: 'fortitude', sv: saves.fortitude, mod: fortMod  },
    { save: 'reflex',    sv: saves.reflex,    mod: reflexMod },
    { save: 'will',      sv: saves.will,      mod: willMod  },
  ] as const;

  for (const { save, sv, mod } of saveDefs) {
    const total = sv.base + mod + (sv.magic ?? 0) + (sv.misc ?? 0) + (sv.temp ?? 0);
    safeSet(form, `combat.saves.${save}.base`,  sv.base);
    safeSet(form, `combat.saves.${save}.mod`,   signed(mod));
    safeSet(form, `combat.saves.${save}.magic`, sv.magic || '');
    safeSet(form, `combat.saves.${save}.misc`,  sv.misc  || '');
    safeSet(form, `combat.saves.${save}.total`, signed(total));
  }

  // ── Acrobat JavaScript calculations (Adobe Acrobat/Reader only) ──────────
  // Attaches a Calculate (AA.C) JS action to each derived field and sets the
  // AcroForm CO (Calculation Order) so Acrobat evaluates dependencies in order.
  // Fields not yet in the template are silently skipped.

  // Compact JS helpers — inlined per script (no shared scope between fields)
  const N0 = 'var n=function(f){var x=this.getField(f);return(x&&""!==x.value&&!isNaN(+x.value))?+x.value:0;};';
  const NN = 'var n=function(f){var x=this.getField(f);return(x&&""!==x.value&&!isNaN(+x.value))?+x.value:null;};';
  const SN = 'var s=function(v){return(v>=0?"+":"")+v;};';

  const calcOrder: PDFRef[] = [];

  const addCalc = (fieldName: string, jsCode: string): void => {
    try {
      const f = form.getField(fieldName);
      const fDict = (f as any).acroField.dict as PDFDict;
      const fRef  = (f as any).acroField.ref  as PDFRef;
      const act = PDFDict.withContext(pdfDoc.context);
      act.set(PDFName.of('S'), PDFName.of('JavaScript'));
      act.set(PDFName.of('JS'), PDFString.of(jsCode));
      const aa = PDFDict.withContext(pdfDoc.context);
      aa.set(PDFName.of('C'), act);
      fDict.set(PDFName.of('AA'), aa);
      calcOrder.push(fRef);
    } catch { /* field not yet in template — skip */ }
  };

  // 1. Ability totals: base + racial + enhancement + misc + levelUp
  for (const key of ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']) {
    const p = `abilityScores.${key}`;
    addCalc(`${p}.total`,
      `${N0}event.value=n("${p}.base")+n("${p}.racial")+n("${p}.enhancement")+n("${p}.misc")+n("${p}.levelUp");`);
  }

  // 2. Ability tempMods: floor((temp − 10) / 2) when temp is set, else empty
  for (const key of ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']) {
    const p = `abilityScores.${key}`;
    addCalc(`${p}.tempMod`,
      `${NN}${SN}var temp=n("${p}.temp");event.value=temp!==null?s(Math.floor((temp-10)/2)):"";`);
  }

  // 3. Ability mods: tempMod if set, else floor((total − 10) / 2), signed
  for (const key of ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']) {
    const p = `abilityScores.${key}`;
    addCalc(`${p}.mod`,
      `${NN}${SN}var tm=n("${p}.tempMod"),tot=n("${p}.total");event.value=tm!==null?s(tm):s(Math.floor(((tot!==null?tot:10)-10)/2));`);
  }

  // 3. AC dexterity mod — mirrors dexterity.mod (temp score already handled there)
  addCalc('combat.armorClass.dexterityMod',
    'var x=this.getField("abilityScores.dexterity.mod");event.value=x&&x.value?x.value:"+0";');

  // 4. Save mods: tempMod override if set, otherwise derive from ability total
  const saveAbilityMap = [
    { save: 'fortitude', ability: 'constitution' },
    { save: 'reflex',    ability: 'dexterity'    },
    { save: 'will',      ability: 'wisdom'       },
  ] as const;

  for (const { save, ability } of saveAbilityMap) {
    const p = `abilityScores.${ability}`;
    addCalc(`combat.saves.${save}.mod`,
      `${NN}${SN}var tm=n("${p}.tempMod"),tot=n("${p}.total");event.value=tm!==null?s(tm):s(Math.floor(((tot!==null?tot:10)-10)/2));`);
  }

  // 5. AC totals (depend on dexterityMod calculated above)
  addCalc('combat.armorClass.total',
    `${N0}event.value=10+n("combat.armorClass.armor")+n("combat.armorClass.shield")+n("combat.armorClass.dexterityMod")+n("combat.armorClass.size")+n("combat.armorClass.dodge")+n("combat.armorClass.natural")+n("combat.armorClass.deflection")+n("combat.armorClass.misc");`);
  addCalc('combat.armorClass.touch',
    `${N0}event.value=10+n("combat.armorClass.dexterityMod")+n("combat.armorClass.size")+n("combat.armorClass.dodge")+n("combat.armorClass.deflection")+n("combat.armorClass.misc");`);
  addCalc('combat.armorClass.flatFooted',
    `${N0}event.value=10+n("combat.armorClass.armor")+n("combat.armorClass.shield")+n("combat.armorClass.size")+n("combat.armorClass.natural")+n("combat.armorClass.deflection")+n("combat.armorClass.misc");`);

  // 6. Save totals (depend on save mods calculated above)
  for (const { save } of saveAbilityMap) {
    const p = `combat.saves.${save}`;
    addCalc(`${p}.total`,
      `${N0}${SN}event.value=s(n("${p}.base")+n("${p}.mod")+n("${p}.magic")+n("${p}.misc"));`);
  }

  // Write CO (Calculation Order) onto AcroForm
  if (calcOrder.length > 0) {
    pdfDoc.catalog.lookup(PDFName.of('AcroForm'), PDFDict)
      .set(PDFName.of('CO'), pdfDoc.context.obj(calcOrder as any));
  }

  form.updateFieldAppearances(font);
  return pdfDoc.save();
}
