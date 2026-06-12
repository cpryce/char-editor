import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFName, PDFBool, PDFDict, PDFRef, PDFString, StandardFonts } from 'pdf-lib';
import type { ICharacter } from '../models/Character';
import type { ICustomClassFeature } from '../models/CustomClass';
import { BUILTIN_CLASS_FEATURES } from '../data/builtinClassFeatures';
import { SIZE_CATEGORIES, applyMaxDexCap, computeAcTotals, RACES, SKILL_LIST } from '../rules/coreMechanics';

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

/**
 * Decode common HTML entities that may have been copy-pasted into stored data.
 * Must run before winAnsiSafe so entity-decoded characters are also normalized.
 */
function decodeHtmlEntities(text: string): string {
  const decode = (s: string): string => s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#160;/g, ' ')          // numeric non-breaking space
    .replace(/&#(\d+);/g, (_, n: string) => {
      const cp = parseInt(n, 10);
      return cp <= 0xFF ? String.fromCharCode(cp) : '?';
    });
  // Two passes handle double-encoded entities (e.g. &amp;nbsp; → &nbsp; → ' ')
  return decode(decode(text));
}

/**
 * Replace characters outside the printable ASCII range (0x20–0x7E) with safe
 * equivalents so pdf-lib encodes every string as a simple byte literal rather
 * than UTF-16BE.  UTF-16BE strings can render incorrectly in Acrobat's browser
 * viewer (spaces and other low-code-point chars appear as the wrong glyph).
 */
function winAnsiSafe(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\u00A0/g, ' ')          // non-breaking space → regular space
    .replace(/\u2212/g, '-')          // MINUS SIGN → hyphen-minus
    .replace(/[\u2018\u2019]/g, "'")  // curly single quotes → apostrophe
    .replace(/[\u201C\u201D]/g, '"')  // curly double quotes → straight quote
    .replace(/\u2013/g, '-')          // en dash → hyphen
    .replace(/\u2014/g, '-')          // em dash → hyphen
    .replace(/\u2026/g, '...')        // ellipsis → three dots
    .replace(/[^\x20-\x7E]/g, '?');  // anything outside printable ASCII → ?
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function alignmentInitials(alignment: string | null | undefined): string {
  const value = (alignment ?? '').trim();
  const byName: Record<string, string> = {
    'Lawful Good': 'LG',
    'Neutral Good': 'NG',
    'Chaotic Good': 'CG',
    'Lawful Neutral': 'LN',
    'True Neutral': 'NN',
    'Chaotic Neutral': 'CN',
    'Lawful Evil': 'LE',
    'Neutral Evil': 'NE',
    'Chaotic Evil': 'CE',
  };

  if (byName[value]) return byName[value];

  // Fallback for unexpected values.
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0]![0] ?? ''}${words[1]![0] ?? ''}`.toUpperCase();
  return value.slice(0, 2).toUpperCase();
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

/** Silently set a dropdown if the field exists and the value is a valid option.
 * Pass `font` to regenerate the appearance stream so static viewers show the selection.
 */
function safeSetDropdown(
  form: ReturnType<PDFDocument['getForm']>,
  name: string,
  value: string | null | undefined,
) {
  try {
    const field = form.getDropdown(name);
    if (value) field.select(value);
    else field.clear();
  } catch {
    // Field not found, wrong type, or value not in options — skip gracefully.
  }
}

/** Prefer dropdown selection when available; fall back to text fields. */
function safeSetDropdownOrText(
  form: ReturnType<PDFDocument['getForm']>,
  name: string,
  value: string | null | undefined,
) {
  try {
    const field = form.getDropdown(name);
    if (value) field.select(value);
    else field.clear();
    return;
  } catch {
    // Not a dropdown (or field absent); try text fallback.
  }

  safeSet(form, name, value ?? '');
}

/** Silently skip a field if it doesn't exist or isn't a checkbox field. */
function safeSetCheckbox(
  form: ReturnType<PDFDocument['getForm']>,
  name: string,
  checked: boolean,
) {
  try {
    const field = form.getField(name);
    if (field instanceof PDFCheckBox) {
      if (checked) field.check();
      else field.uncheck();
    }
  } catch {
    // Field not found or wrong type — skip gracefully.
  }
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
      const str = value == null ? '' : winAnsiSafe(String(value));
      field.setText(str);
    }
  } catch {
    // Field not found or wrong type — skip gracefully.
  }
}

// ── Main export function ──────────────────────────────────────────────────────

export async function fillCharacterPdf(
  character: ICharacter,
  customClassFeatures: { className: string; features: ICustomClassFeature[] }[] = [],
): Promise<Uint8Array> {
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

  const defaultSizeMod = SIZE_CATEGORIES[character.size as keyof typeof SIZE_CATEGORIES]?.acAttackMod ?? 0;

  const classes = character.classes;
  const ac = character.combat.armorClass;
  const acSizeMod = Number.isFinite(ac.size) ? ac.size : defaultSizeMod;
  const saves = character.combat.saves;

  // ── Fill fields ───────────────────────────────────────────────────────────
  // Field names follow the JSON-path convention used in blank.pdf.
  // safeSet silently skips any field not yet present in the template.

  // Identity
  safeSet(form, 'name',   character.name);
  safeSet(form, 'player', character.player ?? '');
  safeSet(form, 'diety', character.deity ?? '');
  safeSet(form, 'alignment', alignmentInitials(character.alignment));
  safeSet(form, 'size', character.size ?? '');
  safeSet(form, 'baseSpeed', character.baseSpeed ?? '');
  safeSet(form, 'speed',     character.speed != null ? String(character.speed) : '');

  // Race — dropdown has no pre-set options in the template; populate then select.
  try {
    const raceField = form.getDropdown('race');
    raceField.setOptions([...RACES]);
    if (character.race) raceField.select(character.race);
  } catch {
    safeSet(form, 'race', character.race ?? '');
  }

  // Gender — map model enum to PDF dropdown option.
  safeSetDropdown(form, 'gender', character.gender ?? '');

  // Appearance
  safeSet(form, 'height', character.height ?? '');
  safeSet(form, 'weight', character.weight ?? '');
  safeSet(form, 'hair',   character.hair   ?? '');
  safeSet(form, 'skin',   character.skin   ?? '');

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
  safeSet(form, 'abilityScores.strength.mod',         signed(strMod));
  safeSet(form, 'abilityScores.strength.base',        s.strength.base);
  safeSet(form, 'abilityScores.strength.racial',      s.strength.racial      || '');
  safeSet(form, 'abilityScores.strength.misc',        s.strength.misc        || '');
  safeSet(form, 'abilityScores.strength.enhancement', s.strength.enhancement || '');
  safeSet(form, 'abilityScores.strength.levelUp',     s.strength.levelUp     || '');
  safeSet(form, 'abilityScores.strength.temp',    s.strength.temp  != null ? s.strength.temp  : '');
  safeSet(form, 'abilityScores.strength.tempMod',  effectiveTempMod(s.strength) != null ? signed(effectiveTempMod(s.strength)!) : '');

  // Ability scores — dexterity
  safeSet(form, 'abilityScores.dexterity.total',       dex);
  safeSet(form, 'abilityScores.dexterity.mod',         signed(dexMod));
  safeSet(form, 'abilityScores.dexterity.base',        s.dexterity.base);
  safeSet(form, 'abilityScores.dexterity.racial',      s.dexterity.racial      || '');
  safeSet(form, 'abilityScores.dexterity.misc',        s.dexterity.misc        || '');
  safeSet(form, 'abilityScores.dexterity.enhancement', s.dexterity.enhancement || '');
  safeSet(form, 'abilityScores.dexterity.levelUp',     s.dexterity.levelUp     || '');
  safeSet(form, 'abilityScores.dexterity.temp',    s.dexterity.temp  != null ? s.dexterity.temp  : '');
  safeSet(form, 'abilityScores.dexterity.tempMod',  effectiveTempMod(s.dexterity) != null ? signed(effectiveTempMod(s.dexterity)!) : '');

  // Ability scores — constitution
  safeSet(form, 'abilityScores.constitution.total',       con);
  safeSet(form, 'abilityScores.constitution.mod',         signed(conMod));
  safeSet(form, 'abilityScores.constitution.base',        s.constitution.base);
  safeSet(form, 'abilityScores.constitution.racial',      s.constitution.racial      || '');
  safeSet(form, 'abilityScores.constitution.misc',        s.constitution.misc        || '');
  safeSet(form, 'abilityScores.constitution.enhancement', s.constitution.enhancement || '');
  safeSet(form, 'abilityScores.constitution.levelUp',     s.constitution.levelUp     || '');
  safeSet(form, 'abilityScores.constitution.temp',    s.constitution.temp    != null ? s.constitution.temp    : '');
  safeSet(form, 'abilityScores.constitution.tempMod',  effectiveTempMod(s.constitution) != null ? signed(effectiveTempMod(s.constitution)!) : '');

  for (const [key, total, permMod, score] of [
    ['intelligence', int_, intMod, s.intelligence],
    ['wisdom',       wis,  wisMod, s.wisdom],
    ['charisma',     cha,  chaMod, s.charisma],
  ] as const) {
    safeSet(form, `abilityScores.${key}.total`,       total);
    safeSet(form, `abilityScores.${key}.mod`,         signed(permMod));
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

  // armor and shield AC are derived from equipment fields so user edits to
  // body.armorBonus / offHandShield.shieldBonus propagate automatically.
  // We still pre-fill the equipment source fields above; these calc scripts
  // read from them at render time in Acrobat.
  safeSet(form, 'combat.armorClass.dexterityMod', signed(acDexEffMod));
  safeSet(form, 'combat.armorClass.size',        acSizeMod || '');
  safeSet(form, 'combat.armorClass.dodge',       ac.dodge       || '');
  safeSet(form, 'combat.armorClass.natural',     ac.natural     || '');
  safeSet(form, 'combat.armorClass.deflection',  ac.deflection  || '');
  safeSet(form, 'combat.armorClass.misc',        ac.misc        || '');

  // Armor class — derived totals
  const { total: acTotal, touch: acTouch, flatFooted: acFlatFooted } = computeAcTotals({
    armor: ac.armor, shield: ac.shield, acDexMod: acDexEffMod,
    sizeMod: acSizeMod, dodge: ac.dodge, natural: ac.natural, deflection: ac.deflection, misc: ac.misc,
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
  safeSet(form, 'combat.baseAttackBonus',      character.combat.baseAttackBonus ?? 0);

  // CMB and CMD
  // The special size modifier for CMB/CMD is the inverse of the AC size modifier
  // (Small: AC=+1 but CMB/CMD=-1; Large: AC=-1 but CMB/CMD=+1; etc.).
  const cmbSizeMod = -acSizeMod;
  const bab = character.combat.baseAttackBonus;
  safeSet(form, 'cmb.ability', signed(strEffMod));
  safeSet(form, 'cmb.size',    cmbSizeMod || '');
  safeSet(form, 'cmb.total',   bab + strEffMod + cmbSizeMod);
  safeSet(form, 'cmd.BaB',     bab ?? 0);
  safeSet(form, 'cmd.str',     signed(strEffMod));
  safeSet(form, 'cmd.dex',     signed(dexEffMod));    // full DEX — CMD is not max-dex capped
  safeSet(form, 'cmd.size',    cmbSizeMod || '');
  safeSet(form, 'cmd.dodge',      ac.dodge      || '');
  safeSet(form, 'cmd.deflection', ac.deflection || '');
  safeSet(form, 'cmd.mic',        ac.misc       || '');
  safeSet(form, 'cmd.total',   10 + bab + strEffMod + dexEffMod + cmbSizeMod + ac.dodge + ac.deflection + ac.misc);

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

  // ── Combined ACP / ACF summary fields ────────────────────────────────────
  const totalAcp = (bd != null ? matAcp(bd.armorCheckPenalty ?? 0, bd.material) : 0)
                 + (os != null ? matAcp(os.armorCheckPenalty ?? 0, os.material) : 0);
  const bdAsf = bd != null ? parseInt(matAsf(bd.arcaneSpellFailure ?? '0%', bd.material), 10) || 0 : 0;
  const osAsf = os != null ? parseInt(matAsf(os.arcaneSpellFailure ?? '0%', os.material), 10) || 0 : 0;
  safeSet(form, 'ACP', totalAcp !== 0 ? String(totalAcp) : '');
  safeSet(form, 'ACF', (bdAsf + osAsf) !== 0 ? `${bdAsf + osAsf}%` : '');

  // ── Backup weapons (up to 3 slots) ────────────────────────────────────────
  const backupWeapons = character.inventory?.backupWeapons ?? [];
  for (let i = 0; i < 3; i++) {
    const slot   = backupWeapons[i] ?? null;
    const bw     = slot?.weapon ?? null;
    const prefix = `backupWeapons.${i}`;
    const bwAttackMod = (bw?.combatMod ?? 0) + (bw?.enhancementBonus ?? 0);
    safeSet(form, `${prefix}.label`,                (slot?.label ?? '').toUpperCase());
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

  // ── Worn equipment slots ───────────────────────────────────────────────────
  const WORN_SLOT_KEYS = [
    'head', 'face', 'neck', 'shoulders', 'bodySlot', 'chest',
    'wrists', 'hands', 'ringLeft', 'ringRight', 'waist', 'feet',
  ] as const;
  const ws = (character.inventory?.wornSlots ?? {}) as Record<string, { item?: string; weight?: string; acType?: string; acBonus?: number }>;
  for (const key of WORN_SLOT_KEYS) {
    const slot   = ws[key] ?? null;
    const prefix = `wornSlots.${key}`;
    safeSet(form, `${prefix}.weight`,  slot?.weight  ?? '');
    safeSet(form, `${prefix}.name`,    slot?.item    ?? '');
    safeSet(form, `${prefix}.acBonus`, slot?.acBonus != null ? String(slot.acBonus) : '');
    safeSetDropdown(form, `${prefix}.acType`, slot?.acType ?? '');
  }

  // ── Feats & Features ──────────────────────────────────────────────────────
  // Fields: feat.0 … feat.45  (46 slots, 23 per column, left then right)
  // Order: Class Feats → Racial Bonus Feats → all other feats
  // Format: "SRC: Name - Short description"  (short description omitted if blank)
  {
    /**
     * Derive a compact source abbreviation from the notes field (which stores
     * the sourceLabel saved by the client) and the source category.
     *
     * Conventions:
     *   "Character Level N"      → "C{N}"          (e.g. C3)
     *   "Fighter Level N"        → "Ftr{N}"         (e.g. Ftr2)
     *   "Wizard Level N"         → "Wiz{N}"         (e.g. Wiz5)
     *   "Racial Bonus Feat (…)"  → "Rac"
     *   "{Class} Level N"        → "{first3} {N}"   (e.g. Swa 1 for Swashbuckler)
     *   Class Feat (auto)        → "Cls"
     *   fallback by source       → "Rac" / "Ftr" / "Feat" / "Spc"
     */
    function abbrevSource(source: string, notes?: string): string {
      if (notes) {
        const charMatch = notes.match(/^Character Level (\d+)$/i);
        if (charMatch) return `C${charMatch[1]}`;

        const ftrMatch = notes.match(/^Fighter Level (\d+)$/i);
        if (ftrMatch) return `Ftr${ftrMatch[1]}`;

        const wizMatch = notes.match(/^Wizard Level (\d+)$/i);
        if (wizMatch) return `Wiz${wizMatch[1]}`;

        if (/Racial Bonus/i.test(notes)) return 'Rac';

        // Generic "{ClassName} Level N" — used for custom classes (e.g. "Swashbuckler Level 1" → "Swa 1")
        const classMatch = notes.match(/^(.+?) Level (\d+)$/);
        if (classMatch?.[1] && classMatch[2]) return `${classMatch[1].slice(0, 3)} ${classMatch[2]}`;
      }

      if (source === 'Class Feat')         return 'Cls';
      if (source === 'Bonus Feat')         return 'Rac';
      if (source === 'Fighter Bonus Feat') return 'Ftr';
      if (source === 'Character Feat')     return 'Feat';
      return 'Spc';
    }

    function formatFeat(f: { name: string; source: string; notes?: string; shortDescription?: string }): string {
      const abbrev = abbrevSource(f.source, f.notes);
      const desc   = f.shortDescription?.trim();
      const raw = desc ? `${abbrev}: ${f.name} - ${desc}` : `${abbrev}: ${f.name}`;
      return winAnsiSafe(raw);
    }

    const allFeats = (character.feats ?? []) as Array<{
      name: string; source: string; notes?: string; shortDescription?: string;
    }>;

    // ── Class Feats ──────────────────────────────────────────────────────────
    // Abbreviate class name to 3–4 letters for the prefix (e.g. Rang, Rogu).
    function classAbbrev(name: string): string {
      const ABBREVS: Record<string, string> = {
        Barbarian: 'Barb', Bard: 'Bard', Cleric: 'Clrc', Druid: 'Drud',
        Fighter: 'Ftr',  Monk: 'Monk', Paladin: 'Pldn', Ranger: 'Rang',
        Rogue: 'Rogu', Sorcerer: 'Sorc', Wizard: 'Wiz',
      };
      return ABBREVS[name] ?? name.slice(0, 4);
    }

    // Returns true for any weapon/armor/shield proficiency feature that should be omitted.
    function isProficiencyFeature(name: string): boolean {
      return /proficien/i.test(name);
    }

    type ClassFeatEntry = { name: string; source: string; notes?: string; shortDescription?: string; featLevel?: number; className?: string };

    // Synthesize class feats from custom class features (features at or below character's class level)
    const customClassFeatEntries: ClassFeatEntry[] = [];
    const customClassNames = new Set(customClassFeatures.map((cc) => cc.className));
    for (const { className, features } of customClassFeatures) {
      const classEntry = (character.classes as Array<{ name: string; level: number }> | undefined)
        ?.find((c) => c.name === className);
      const classLevel = classEntry?.level ?? 0;
      for (const f of features) {
        if (f.level <= classLevel && f.name.trim() && !isProficiencyFeature(f.name)) {
          const entry: ClassFeatEntry = { name: f.name, source: 'Class Feat', featLevel: f.level, className };
          if (f.description) entry.shortDescription = f.description;
          customClassFeatEntries.push(entry);
        }
      }
    }
    // Synthesize class feats from built-in classes (Ranger, Rogue, etc.)
    for (const classEntry of (character.classes as Array<{ name: string; level: number }> | undefined) ?? []) {
      if (customClassNames.has(classEntry.name)) continue; // handled above
      const builtinFeatures = BUILTIN_CLASS_FEATURES[classEntry.name];
      if (!builtinFeatures) continue;
      for (const f of builtinFeatures) {
        if (f.level <= classEntry.level && !isProficiencyFeature(f.name)) {
          const entry: ClassFeatEntry = { name: f.name, source: 'Class Feat', featLevel: f.level, className: classEntry.name };
          const sd = (f as { shortDescription?: string }).shortDescription;
          if (sd) entry.shortDescription = sd;
          customClassFeatEntries.push(entry);
        }
      }
    }

    // Also include any existing character.feats with source 'Class Feat' (legacy/manual entries)
    const legacyClassFeats = (allFeats.filter((f) => f.source === 'Class Feat') as ClassFeatEntry[])
      .filter((f) => !isProficiencyFeature(f.name));

    const classFeatList: ClassFeatEntry[] = [...legacyClassFeats, ...customClassFeatEntries];

    const consolidatedClassLines: string[] = classFeatList.map((f) => {
      const abbrev = f.className ? classAbbrev(f.className) : 'Cls';
      const prefix = f.featLevel != null ? `${abbrev}${f.featLevel}` : abbrev;
      const desc = f.shortDescription?.trim();
      return winAnsiSafe(desc ? `${prefix}: ${f.name} - ${desc}` : `${prefix}: ${f.name}`);
    });

    const selectableFeats = allFeats.filter((f) => f.source !== 'Class Feat');
    const racialFeats  = selectableFeats.filter((f) => f.source === 'Bonus Feat');
    const otherFeats   = selectableFeats.filter((f) => f.source !== 'Bonus Feat');

    // Order: consolidated class feats → racial bonus feats → everything else
    const orderedStrings: string[] = [
      ...consolidatedClassLines,
      ...racialFeats.map(formatFeat),
      ...otherFeats.map(formatFeat),
    ];

    for (let i = 0; i < 46; i++) {
      safeSet(form, `feat.${i}`, orderedStrings[i] ?? '');
    }
  }

  // ── Spellcasting ─────────────────────────────────────────────────────────
  {
    const sc = character.spellcasting;
    // Resolve CL and EL: fall back to the highest spellcasting class level when
    // the stored value is 0 (meaning "use default").
    const highestSpellcastingLevel = (character.classes as Array<{ name: string; level: number }> | undefined)
      ?.reduce((max, c) => Math.max(max, c.level ?? 0), 0) ?? 0;
    const cl = (sc?.casterLevel && sc.casterLevel > 0) ? sc.casterLevel : highestSpellcastingLevel;
    const el = (sc?.effectiveCasterLevel && sc.effectiveCasterLevel > 0) ? sc.effectiveCasterLevel : highestSpellcastingLevel;
    safeSet(form, 'spellcasting.casterLevel',         cl || '');
    safeSet(form, 'spellcasting.effectiveCasterLevel', el || '');
  }

  // ── Turn / Rebuke Undead ─────────────────────────────────────────────────
  {
    const tu = character.turnUndead;
    // Only fill turn/rebuke undead fields when the user has explicitly set a
    // clericLevel. When clericLevel is null the feature is considered unused
    // and all four fields are left blank.
    if (tu?.clericLevel != null) {
      const turnsPerDay = tu.turnsPerDay ?? (3 + chaEffMod);
      const turnCheck   = tu.turnCheck   ?? chaEffMod;
      const turnDamage  = tu.turnDamage  ?? (tu.clericLevel + chaEffMod);
      safeSet(form, 'turnUndead.clericLevel',  tu.clericLevel || '');
      safeSet(form, 'turnUndead.turnsPerDay',  turnsPerDay);
      safeSet(form, 'turnUndead.turnCheck',    signed(turnCheck));
      safeSet(form, 'turnUndead.turnDamage',   signed(turnDamage));
    } else {
      safeSet(form, 'turnUndead.clericLevel',  '');
      safeSet(form, 'turnUndead.turnsPerDay',  '');
      safeSet(form, 'turnUndead.turnCheck',    '');
      safeSet(form, 'turnUndead.turnDamage',   '');
    }
  }

  // ── Skills ────────────────────────────────────────────────────────────────

  // Abbreviated labels for PDF key ability column.
  const ABILITY_ABBREV: Record<string, string> = {
    strength: 'Str', dexterity: 'Dex', constitution: 'Con',
    intelligence: 'Int', wisdom: 'Wis', charisma: 'Cha',
  };

  // Skill point budget — mirrors client's totalSkillPointsAvailable.
  const BUILTIN_SKILL_POINTS: Partial<Record<string, number>> = {
    Barbarian: 4, Bard: 6, Cleric: 2, Druid: 4, Fighter: 2,
    Monk: 4, Paladin: 2, Ranger: 6, Rogue: 8, Sorcerer: 2, Wizard: 2,
  };
  const racialSkillBonus = character.race === 'Human' ? 1 : 0;
  const skillBudget = (character.classes as Array<{ name: string; level: number }>)
    .flatMap((ce) => Array.from({ length: Math.max(0, ce.level) }, (_, i) => ({ className: ce.name, levelIndex: i })))
    .reduce((total, { className, levelIndex }, charLevelIndex) => {
      const base = BUILTIN_SKILL_POINTS[className] ?? 2;
      const perLevel = Math.max(1, base + intMod + racialSkillBonus);
      return total + (charLevelIndex === 0 ? perLevel * 4 : perLevel);
    }, 0);

  // Skill points spent: class-skill ranks cost 1, cross-class cost 2.
  const skillPointsSpent = (character.skills as Array<{ ranks: number; classSkill: boolean }>)
    .reduce((sum, sk) => sum + (sk.classSkill ? sk.ranks : sk.ranks * 2), 0);

  safeSet(form, 'skills.budget',   skillBudget  || '');
  safeSet(form, 'skills.assigned', skillPointsSpent || '');

  {
    const skills = character.skills as Array<{
      name: string;
      keyAbility: string | null;
      trainedOnly: boolean;
      armorCheckPenalty: boolean;
      ranks: number;
      classSkill: boolean;
      miscBonus: number;
    }>;

    for (let i = 0; i < Math.min(skills.length, 44); i++) {
      const sk = skills[i]!;

      // Name with suffix markers: " *" for ACP, " T" for trained-only.
      let displayName = sk.name;
      if (sk.armorCheckPenalty) displayName += ' *';
      if (sk.trainedOnly)       displayName += ' T';
      safeSet(form, `skills.name.${i}`, displayName);

      // Key ability abbreviation.
      const abilityAbbrev = sk.keyAbility ? (ABILITY_ABBREV[sk.keyAbility] ?? sk.keyAbility) : '\u2014';
      safeSet(form, `skills.keyAbility.${i}`, abilityAbbrev);

      // Class skill checkbox.
      safeSetCheckbox(form, `skills.classSkill.${i}`, sk.classSkill);

      // Ability modifier for this skill's key ability.
      // Match character editor behavior: temp score override, else normal score.
      const abilityModValue = sk.keyAbility
        ? (() => {
            const ability = s[sk.keyAbility as keyof typeof s];
            const effectiveScore = ability.temp ?? totalAbilityScore(ability);
            return abilityMod(effectiveScore);
          })()
        : null;
      safeSet(form, `skills.bonus.${i}`, abilityModValue !== null ? signed(abilityModValue) : '');

      // Ranks: export 0 as blank, but calc scripts treat blank as 0.
      const ranksValue = sk.ranks || 0;
      safeSet(form, `skills.ranks.${i}`, ranksValue === 0 ? '' : ranksValue);

      // Misc bonus — blank when 0.
      safeSet(form, `skills.miscBonus.${i}`, sk.miscBonus || '');

      // Total score: trained-only skills show "--" when no rank points are assigned.
      const acpMultiplier = SKILL_LIST[i]?.doubleAcp ? 2 : 1;
      const acpContrib = sk.armorCheckPenalty ? totalAcp * acpMultiplier : 0;
      const scoreTotal = ranksValue + (abilityModValue ?? 0) + sk.miscBonus + acpContrib;
      safeSet(form, `skills.score.${i}`, (sk.trainedOnly && ranksValue === 0) ? '--' : signed(scoreTotal));
    }
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

  /** Attach a Validate (on-change) JS action to a field — fires when user commits a new value. */
  const addOnChange = (fieldName: string, jsCode: string): void => {
    try {
      const f = form.getField(fieldName);
      const fDict = (f as any).acroField.dict as PDFDict;
      const act = PDFDict.withContext(pdfDoc.context);
      act.set(PDFName.of('S'), PDFName.of('JavaScript'));
      act.set(PDFName.of('JS'), PDFString.of(jsCode));
      // Merge into existing AA dict if present, otherwise create one.
      let aa = fDict.lookupMaybe(PDFName.of('AA'), PDFDict);
      if (!aa) { aa = PDFDict.withContext(pdfDoc.context); fDict.set(PDFName.of('AA'), aa); }
      aa.set(PDFName.of('V'), act);
    } catch { /* field not yet in template — skip */ }
  };

  /** Add a field to the Calculation Order without changing its existing script. */
  const addToCalcOrder = (fieldName: string): void => {
    try {
      const fRef = (form.getField(fieldName) as any).acroField.ref as PDFRef;
      calcOrder.push(fRef);
    } catch { /* field not in template — skip */ }
  };

  // ── Race change handler ──────────────────────────────────────────────────
  // When user selects a different race in Acrobat, update: size label,
  // size bonus to AC, and base land speed.
  addOnChange('race', [
    'var rd={',
    '  "Human":    {z:"Medium",s:30,a:0},',
    '  "Elf":      {z:"Medium",s:30,a:0},',
    '  "Dwarf":    {z:"Medium",s:20,a:0},',
    '  "Gnome":    {z:"Small", s:20,a:1},',
    '  "Halfling": {z:"Small", s:20,a:1},',
    '  "Half-Elf": {z:"Medium",s:30,a:0},',
    '  "Half-Orc": {z:"Medium",s:30,a:0}',
    '};',
    'var d=rd[event.value];',
    'if(d){',
    '  var f;',
    '  f=this.getField("size");            if(f)f.value=d.z;',
    '  f=this.getField("combat.armorClass.size"); if(f)f.value=d.a||"";',
    '  f=this.getField("body.speed");      if(f&&f.value==="")f.value=d.s+" ft.";',
    '  f=this.getField("combat.speed.base");if(f)f.value=d.s+" ft.";',
    '}',
  ].join('\n'));

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

  // 3. Ability mods: always floor((total − 10) / 2) from the permanent total.
  //    Combat/skill fields that need temp-score awareness do their own tempMod || mod lookup.
  for (const key of ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma']) {
    const p = `abilityScores.${key}`;
    addCalc(`${p}.mod`,
      `${N0}${SN}var tot=n("${p}.total");event.value=s(Math.floor((tot-10)/2));`);
  }

  // 2b. AC armor and shield — mirror the character editor's syncArmorClass logic:
  //   armor  = Math.max(body.armorBonus, bestWornSlot('armor'))
  //   shield = Math.max(offHandShield.shieldBonus, bestWornSlot('shield'))
  // Armor and shield bonuses do not stack; only the highest value applies.
  {
    const wornSlotKeys = ['head','face','neck','shoulders','bodySlot','chest','wrists','hands','ringLeft','ringRight','waist','feet'];
    const bestSlotJs = (type: string) =>
      `(function(){var b=0,k=${JSON.stringify(wornSlotKeys)};`
      + `for(var i=0;i<k.length;i++){`
      + `var tf=this.getField("wornSlots."+k[i]+".acType");`
      + `var bf=this.getField("wornSlots."+k[i]+".acBonus");`
      + `if(tf&&bf&&(tf.value||"").toLowerCase()==="${type}"){var v=Number(bf.value)||0;if(v>b)b=v;}`
      + `}return b;})()`;

    addCalc('combat.armorClass.armor',
      `${N0}var eq=n("body.armorBonus"),ws=${bestSlotJs('armor')};event.value=Math.max(eq,ws);`);
    addCalc('combat.armorClass.shield',
      `${N0}var eq=n("offHandShield.shieldBonus"),ws=${bestSlotJs('shield')};event.value=Math.max(eq,ws);`);
  }

  // When user edits any source equipment field directly, trigger a full recalc.
  addOnChange('body.armorBonus',           'this.calculateNow();');
  addOnChange('offHandShield.shieldBonus', 'this.calculateNow();');
  for (const key of ['head','face','neck','shoulders','bodySlot','chest','wrists','hands','ringLeft','ringRight','waist','feet']) {
    addOnChange(`wornSlots.${key}.acBonus`, 'this.calculateNow();');
  }

  // 3. AC dexterity mod — DEX tempMod takes precedence over DEX mod
  addCalc('combat.armorClass.dexterityMod',
    'var tm=this.getField("abilityScores.dexterity.tempMod"),m=this.getField("abilityScores.dexterity.mod");event.value=(tm&&tm.value!=="")?tm.value:((m&&m.value)?m.value:"+0");');

  // 4. Save mods: tempMod takes precedence over mod
  const saveAbilityMap = [
    { save: 'fortitude', ability: 'constitution' },
    { save: 'reflex',    ability: 'dexterity'    },
    { save: 'will',      ability: 'wisdom'       },
  ] as const;

  for (const { save, ability } of saveAbilityMap) {
    const p = `abilityScores.${ability}`;
    addCalc(`combat.saves.${save}.mod`,
      `var tm=this.getField("${p}.tempMod"),m=this.getField("${p}.mod");event.value=(tm&&tm.value!=="")?tm.value:((m&&m.value)?m.value:"+0");`);
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

  // 6.5. CMB ability component and CMD sub-fields (depend on ability mods calculated above).
  //      These fields have scripts in blank.pdf but are not added to the generated CO by any
  //      other addCalc call — restore them here so Acrobat fires the recalculation cascade.
  //      cmb.ability and cmd.dex/cmd.str get tempMod-aware replacements; the rest retain their
  //      template scripts (pass-throughs from BAB, AC, and size fields).
  addCalc('cmb.ability',
    'var tm=this.getField("abilityScores.strength.tempMod"),m=this.getField("abilityScores.strength.mod");event.value=(tm&&tm.value!=="")?tm.value:((m&&m.value)?m.value:"+0");');
  addCalc('cmd.dex',
    'var tm=this.getField("abilityScores.dexterity.tempMod"),m=this.getField("abilityScores.dexterity.mod");event.value=(tm&&tm.value!=="")?tm.value:((m&&m.value)?m.value:"+0");');
  addCalc('cmd.str',
    'var tm=this.getField("abilityScores.strength.tempMod"),m=this.getField("abilityScores.strength.mod");event.value=(tm&&tm.value!=="")?tm.value:((m&&m.value)?m.value:"+0");');
  // BAB: computed from each class name + level slot (0–3).
  // Progressions: full (Barbarian/Fighter/Paladin/Ranger), 3/4 (Bard/Cleric/Druid/Monk/Rogue), 1/2 (Sorcerer/Wizard).
  const babScript = [
    'var full=["Barbarian","Fighter","Paladin","Ranger"];',
    'var tq=["Bard","Cleric","Druid","Monk","Rogue"];',
    'var bab=0;',
    'for(var i=0;i<4;i++){',
    'var nf=this.getField("classes."+i+".name");',
    'var lf=this.getField("classes."+i+".level");',
    'if(!nf||!lf)continue;',
    'var nm=(nf.value||"").trim(),lv=Math.floor(+lf.value||0);',
    'if(!nm||lv<=0)continue;',
    'if(full.indexOf(nm)>=0)bab+=lv;',
    'else if(tq.indexOf(nm)>=0)bab+=Math.floor(lv*3/4);',
    'else bab+=Math.floor(lv/2);',
    '}event.value=String(bab);',
  ].join('');
  addCalc('combat.baseAttackBonus', babScript);
  addToCalcOrder('cmd.BaB');
  // CMB/CMD special size modifier = negative of AC size modifier.
  const cmbSizeJs = 'var x=this.getField("combat.armorClass.size");event.value=x?-Number(x.value||0):0;';
  addCalc('cmb.size', cmbSizeJs);
  addCalc('cmd.size', cmbSizeJs);
  // CMB = BAB + STR modifier + special size modifier
  addCalc('cmb.total', `${N0}event.value=n("combat.baseAttackBonus")+n("cmb.ability")+n("cmb.size");`);
  // Remaining CMD components before the total.
  addToCalcOrder('cmd.dodge');
  addToCalcOrder('cmd.deflection');
  addToCalcOrder('cmd.mic');
  // CMD = 10 + BAB + STR modifier + DEX modifier + special size modifier + dodge + deflection + misc
  addCalc('cmd.total', `${N0}event.value=10+n("cmd.BaB")+n("cmd.str")+n("cmd.dex")+n("cmd.size")+n("cmd.dodge")+n("cmd.deflection")+n("cmd.mic");`);

  // 7. Skill bonuses (depend on ability mods calculated above)
  //    Each row uses tempMod when present, otherwise mod.
  {
    const ABILITY_MOD_FIELDS: Record<string, { tempMod: string; mod: string }> = {
      strength:     { tempMod: 'abilityScores.strength.tempMod',     mod: 'abilityScores.strength.mod' },
      dexterity:    { tempMod: 'abilityScores.dexterity.tempMod',    mod: 'abilityScores.dexterity.mod' },
      constitution: { tempMod: 'abilityScores.constitution.tempMod', mod: 'abilityScores.constitution.mod' },
      intelligence: { tempMod: 'abilityScores.intelligence.tempMod', mod: 'abilityScores.intelligence.mod' },
      wisdom:       { tempMod: 'abilityScores.wisdom.tempMod',       mod: 'abilityScores.wisdom.mod' },
      charisma:     { tempMod: 'abilityScores.charisma.tempMod',     mod: 'abilityScores.charisma.mod' },
    };
    const filledSkills = character.skills as Array<{ keyAbility: string | null }>;
    for (let i = 0; i < 46; i++) {
      const keyAbility = filledSkills[i]?.keyAbility ?? null;
      if (keyAbility && ABILITY_MOD_FIELDS[keyAbility]) {
        const modFields = ABILITY_MOD_FIELDS[keyAbility]!;
        addCalc(`skills.bonus.${i}`,
          `var tm=this.getField("${modFields.tempMod}"),m=this.getField("${modFields.mod}");event.value=(tm&&tm.value!=="")?tm.value:((m&&m.value)?m.value:"+0");`);
      }
      // Rows without a key ability (Speak Language, blank user rows): no calc — leave as-is.
    }
  }

  // 8. Skill scores (depend on skills.bonus.N, ranks, miscBonus, and ACP when applicable)
  {
    const filledSkills = character.skills as unknown as Array<{ armorCheckPenalty: boolean; trainedOnly?: boolean }>;
    for (let i = 0; i < 46; i++) {
      const hasAcp = filledSkills[i]?.armorCheckPenalty ?? false;
      const isTrainedOnly = filledSkills[i]?.trainedOnly ?? false;
      const acpTerm = hasAcp
        ? (SKILL_LIST[i]?.doubleAcp ? `+2*n("ACP")` : `+n("ACP")`)
        : '';
      addCalc(`skills.score.${i}`,
        `${N0}${SN}var r=n("skills.ranks.${i}");event.value=${isTrainedOnly ? 'r===0?"--":' : ''}s(r+n("skills.bonus.${i}")+n("skills.miscBonus.${i}")${acpTerm});`);
    }
  }

  // 9. Skill points assigned (sum of rank costs; class-skill = 1 pt/rank, cross-class = 2 pts/rank)
  {
    const classSkillChecks = Array.from({ length: 46 }, (_, i) => `(c("skills.classSkill.${i}")?n("skills.ranks.${i}"):n("skills.ranks.${i}")*2)`).join('+');
    addCalc('skills.assigned',
      `${N0}var c=function(f){var x=this.getField(f);return(x&&x.value==="Yes")?1:0;};event.value=${classSkillChecks};`);
  }

  // Write CO (Calculation Order) onto AcroForm
  if (calcOrder.length > 0) {
    pdfDoc.catalog.lookup(PDFName.of('AcroForm'), PDFDict)
      .set(PDFName.of('CO'), pdfDoc.context.obj(calcOrder as any));
  }

  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Regenerate appearance streams for all text fields so Chrome's built-in
  // PDF viewer can render filled values without relying on NeedAppearances.
  // skills.score.N fields use HelveticaBold (closest standard substitute for
  // the Myriad Pro Bold set in the template) to visually distinguish them.
  try {
    for (const field of form.getFields()) {
      if (!(field instanceof PDFTextField)) continue;
      // Delete stale RV (rich-text value) entries left in the template.
      // Windows PDF viewers prefer RV over V for rich-text fields; an old
      // RV containing &nbsp; XHTML entities renders as bare "&" on Windows
      // while the correct plain-text V entry is ignored.
      (field as any).acroField.dict.delete(PDFName.of('RV'));
      const isScore = /^skills\.score\.\d+$/.test(field.getName());
      try { field.updateAppearances(isScore ? boldFont : font); } catch { /* skip — not a supported field type */ }
    }
  } catch {
    // fallback: skip all appearance regeneration
  }

  // Tell conforming readers to regenerate field appearances on open.
  // This ensures dropdown selected values are visible without relying on
  // pdf-lib's appearance stream generation for combo boxes.
  pdfDoc.catalog.lookup(PDFName.of('AcroForm'), PDFDict)
    .set(PDFName.of('NeedAppearances'), PDFBool.True);

  // Set document language (catalog + XMP dc:language) so Adobe AI and
  // accessibility tools recognise this as an English document.
  // Also set the title to the character name in both XMP and Info dict.
  pdfDoc.catalog.set(PDFName.of('Lang'), PDFString.of('en'));
  const metaRef = pdfDoc.catalog.get(PDFName.of('Metadata'));
  if (metaRef) {
    const metaStream = pdfDoc.context.lookup(metaRef) as import('pdf-lib').PDFStream;
    const raw: Uint8Array = (metaStream as any).contents ?? new Uint8Array();
    let xmp = Buffer.from(raw).toString('utf8');
    if (!xmp.includes('dc:language')) {
      xmp = xmp.replace(
        '</dc:format>',
        '</dc:format>\n         <dc:language><rdf:Bag><rdf:li>en</rdf:li></rdf:Bag></dc:language>',
      );
    }
    // Replace dc:title value with character name
    xmp = xmp.replace(
      /(<rdf:li xml:lang="x-default">)[^<]*/,
      `$1${character.name}`,
    );
    (metaStream as any).contents = Buffer.from(xmp, 'utf8');
    metaStream.dict.delete(PDFName.of('Length'));
  }
  // Also set Info dict /Title for viewers that read it instead of XMP
  pdfDoc.setTitle(character.name);

  return pdfDoc.save({ updateFieldAppearances: false });
}
