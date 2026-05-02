import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFTextField, PDFName, PDFBool, PDFDict, PDFRef, PDFString, StandardFonts } from 'pdf-lib';
import type { ICharacter } from '../models/Character';
import { SIZE_CATEGORIES, applyMaxDexCap, computeAcTotals } from '../rules/coreMechanics';

// ── Material helpers (inline — materials.ts lives in client only) ─────────────
const MAT_EFFECTS: Record<string, { acpDelta: number; asfDelta: number; weightMultiplier: number; maxDexDelta: number }> = {
  masterwork:       { acpDelta: 1, asfDelta:   0, weightMultiplier: 1,   maxDexDelta: 0 },
  adamantine:       { acpDelta: 1, asfDelta:   0, weightMultiplier: 1,   maxDexDelta: 0 },
  mithral:          { acpDelta: 3, asfDelta: -10, weightMultiplier: 0.5, maxDexDelta: 2 },
  darkwood:         { acpDelta: 2, asfDelta:   0, weightMultiplier: 0.5, maxDexDelta: 0 },
  dragonhide:       { acpDelta: 0, asfDelta:   0, weightMultiplier: 1,   maxDexDelta: 0 },
  'cold-iron':      { acpDelta: 0, asfDelta:   0, weightMultiplier: 1,   maxDexDelta: 0 },
  'alchemical-silver': { acpDelta: 0, asfDelta: 0, weightMultiplier: 1,  maxDexDelta: 0 },
};

function matAcp(acp: number, mat?: string): number {
  return Math.min(0, acp + (MAT_EFFECTS[mat ?? '']?.acpDelta ?? 0));
}

function matAsf(asf: string, mat?: string): string {
  const delta = MAT_EFFECTS[mat ?? '']?.asfDelta ?? 0;
  if (delta === 0 || !asf) return asf;
  const m = asf.match(/^(\d+)%$/);
  if (!m || !m[1]) return asf;
  return `${Math.max(0, parseInt(m[1]) + delta)}%`;
}

function matWeight(weight: string, mat?: string): string {
  const mult = MAT_EFFECTS[mat ?? '']?.weightMultiplier ?? 1;
  if (mult === 1 || !weight || weight === '—') return weight;
  const m = weight.match(/^([\d.]+)\s*lb\./);
  if (!m || !m[1]) return weight;
  return `${Math.round(parseFloat(m[1]) * mult * 2) / 2} lb.`;
}

/** Abbreviate a damage type string to slash-separated initials: "Piercing or Slashing" → "P/S" */
function abbrevDamageType(dt: string | null | undefined): string {
  if (!dt) return '';
  return dt
    .split(/\s+(?:and|or)\s+/i)
    .map((t) => t.trim()[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .join('/');
}

/** Parse maxDexBonus string (e.g. "6") to a number, or return null. */
function parseMaxDex(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Apply material maxDexDelta to a maxDexBonus string, then parse. */
function matMaxDex(maxDexBonus: string | null | undefined, mat?: string): number | null {
  const delta = MAT_EFFECTS[mat ?? '']?.maxDexDelta ?? 0;
  if (!maxDexBonus) return null;
  const base = parseMaxDex(maxDexBonus);
  if (base === null) return null;
  return base + delta;
}

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
  safeSet(form, 'player', character.player ?? '');

  // Classes (indices 0–3)
  for (let i = 0; i < 4; i++) {
    safeSet(form, `classes.${i}.name`,  classes[i]?.name  ?? '');
    safeSet(form, `classes.${i}.level`, classes[i]?.level ?? '');
  }
  const characterLevel = classes.reduce((sum, c) => sum + (c?.level ?? 0), 0);
  safeSet(form, 'CHARACTER_LEVEL', characterLevel || '');

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
  // Compute the tightest max-dex cap from armor and shield (with material adjustment),
  // then derive the three AC totals using the shared helpers from coreMechanics.
  const armorMaxDex  = matMaxDex(character.inventory?.body?.maxDexBonus,         character.inventory?.body?.material);
  const shieldMaxDex = matMaxDex(character.inventory?.offHandShield?.maxDexBonus, character.inventory?.offHandShield?.material);
  const maxDexCap = [armorMaxDex, shieldMaxDex]
    .filter((c): c is number => c !== null)
    .reduce<number | null>((lowest, c) => (lowest === null ? c : Math.min(lowest, c)), null);
  const acDexEffMod = applyMaxDexCap(dexEffMod, maxDexCap);

  safeSet(form, 'combat.armorClass.armor',       ac.armor);
  safeSet(form, 'combat.armorClass.shield',      ac.shield);
  safeSet(form, 'combat.armorClass.dexterityMod', signed(acDexEffMod));
  safeSet(form, 'combat.armorClass.size',        sizeMod || '');
  safeSet(form, 'combat.armorClass.dodge',       ac.dodge       || '');
  safeSet(form, 'combat.armorClass.natural',     ac.natural     || '');
  safeSet(form, 'combat.armorClass.deflection',  ac.deflection  || '');
  safeSet(form, 'combat.armorClass.misc',        ac.misc        || '');

  // Armor class — derived totals
  const { total: acTotal, touch: acTouch, flatFooted: acFlatFooted } = computeAcTotals({
    armor: ac.armor, shield: ac.shield, acDexMod: acDexEffMod,
    sizeMod, dodge: ac.dodge, natural: ac.natural, deflection: ac.deflection, misc: ac.misc,
  });
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

  // Initiative & BAB
  const initMiscBonus = character.combat.initiative?.miscBonus ?? 0;
  const initTotal     = dexEffMod + initMiscBonus;
  safeSet(form, 'combat.initiative.mod',       signed(dexEffMod));
  safeSet(form, 'combat.initiative.miscBonus', initMiscBonus || '');
  safeSet(form, 'combat.initiative.total',     signed(initTotal));
  safeSet(form, 'combat.baseAttackBonus',      character.combat.baseAttackBonus || '');

  // ── Main-hand weapon ──────────────────────────────────────────────────────
  const mh = character.inventory?.mainHand ?? null;
  safeSet(form, 'mainHand.name',           mh?.name            ?? '');
  safeSet(form, 'mainHand.damage',         mh?.damage          ?? '');
  safeSet(form, 'mainHand.critical',       mh?.critical        ?? '');
  const mhAttackMod = (mh?.combatMod ?? 0) + (mh?.enhancementBonus ?? 0);
  safeSet(form, 'mainHand.attackMod',      mhAttackMod !== 0 ? signed(mhAttackMod) : '');
  safeSet(form, 'mainHand.computedAttack',  mh?.computedAttack  ?? '');
  safeSet(form, 'mainHand.notes',           mh?.special         ?? '');
  safeSet(form, 'mainHand.damageType',      abbrevDamageType(mh?.damageType));
  safeSet(form, 'mainHand.rangeIncrement',  mh?.rangeIncrement  ?? '');
  safeSet(form, 'mainHand.weight',          mh?.weight          ?? '');

  // ── Off-hand weapon ───────────────────────────────────────────────────────
  const oh = character.inventory?.offHandWeapon ?? null;
  safeSet(form, 'offHandWeapon.name',           oh?.name            ?? '');
  safeSet(form, 'offHandWeapon.damage',         oh?.damage          ?? '');
  safeSet(form, 'offHandWeapon.critical',       oh?.critical        ?? '');
  const ohAttackMod = (oh?.combatMod ?? 0) + (oh?.enhancementBonus ?? 0);
  safeSet(form, 'offHandWeapon.attackMod',      ohAttackMod !== 0 ? signed(ohAttackMod) : '');
  safeSet(form, 'offHandWeapon.computedAttack', oh?.computedAttack  ?? '');
  safeSet(form, 'offHandWeapon.notes',          oh?.special         ?? '');
  safeSet(form, 'offHandWeapon.damageType',     abbrevDamageType(oh?.damageType));
  safeSet(form, 'offHandWeapon.rangeIncrement', oh?.rangeIncrement  ?? '');
  safeSet(form, 'offHandWeapon.weight',         oh?.weight          ?? '');

  // ── Body armor ────────────────────────────────────────────────────────────
  const bd = character.inventory?.body ?? null;
  safeSet(form, 'body.name',              bd?.name ?? '');
  safeSet(form, 'body.armorBonus',        bd != null ? (bd.armorBonus ?? 0) + (bd.enhancementBonus ?? 0) : '');
  safeSet(form, 'body.maxDexBonus',       bd?.maxDexBonus ?? '');
  safeSet(form, 'body.armorCheckPenalty', bd != null ? matAcp(bd.armorCheckPenalty ?? 0, bd.material) : '');
  safeSet(form, 'body.arcaneSpellFailure', bd != null ? matAsf(bd.arcaneSpellFailure ?? '', bd.material) : '');
  safeSet(form, 'body.speed',             bd?.speed ?? '');
  safeSet(form, 'body.weight',            bd != null ? matWeight(bd.weight ?? '', bd.material) : '');

  // ── Off-hand shield ───────────────────────────────────────────────────────
  const os = character.inventory?.offHandShield ?? null;
  safeSet(form, 'offHandShield.name',             os?.name ?? '');
  safeSet(form, 'offHandShield.shieldBonus',      os != null ? (os.armorBonus ?? 0) + (os.enhancementBonus ?? 0) : '');
  safeSet(form, 'offHandShield.armorCheckPenalty', os != null ? matAcp(os.armorCheckPenalty ?? 0, os.material) : '');
  safeSet(form, 'offHandShield.arcaneSpellFailure', os != null ? matAsf(os.arcaneSpellFailure ?? '', os.material) : '');
  safeSet(form, 'offHandShield.weight',            os != null ? matWeight(os.weight ?? '', os.material) : '');

  // ── Backup weapons (up to 3 slots) ────────────────────────────────────────
  const backupWeapons = character.inventory?.backupWeapons ?? [];
  for (let i = 0; i < 3; i++) {
    const slot   = backupWeapons[i] ?? null;
    const bw     = slot?.weapon ?? null;
    const prefix = `backupWeapons.${i}`;
    const bwAttackMod = (bw?.combatMod ?? 0) + (bw?.enhancementBonus ?? 0);
    safeSet(form, `${prefix}.label`,                slot?.label            ?? '');
    safeSet(form, `${prefix}.weapon.name`,          bw?.name               ?? '');
    safeSet(form, `${prefix}.weapon.attackMod`,     bwAttackMod !== 0 ? signed(bwAttackMod) : '');
    safeSet(form, `${prefix}.weapon.computedAttack`, bw?.computedAttack    ?? '');
    safeSet(form, `${prefix}.weapon.damage`,        bw?.damage             ?? '');
    safeSet(form, `${prefix}.weapon.critical`,      bw?.critical           ?? '');
    safeSet(form, `${prefix}.weapon.notes`,         bw?.special            ?? '');
    safeSet(form, `${prefix}.weapon.damageType`,    abbrevDamageType(bw?.damageType));
    safeSet(form, `${prefix}.weapon.rangeIncrement`, bw?.rangeIncrement    ?? '');
    safeSet(form, `${prefix}.weapon.weight`,        bw?.weight             ?? '');
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
