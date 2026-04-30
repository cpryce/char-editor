import type { CharacterDraft } from '../types/character';
import { getWeaponAttackClass } from '../data/weapons';
import {
  totalScore,
  abilityModifier,
  baseAttackBonusFromClasses,
  baseSaveBonusFromClasses,
  totalCharacterLevel,
  deriveAutoFeats,
  deriveClassFeatures,
  buildIterativeAttackString,
} from './characterHelpers';

// ── Types ─────────────────────────────────────────────────────────────────────

/** A single inline run: bold label + normal value. */
export interface StatBlockSegment {
  bold: string;
  normal: string;
}

/**
 * The stat block split into three paragraphs mirroring the DMG format:
 *   0 – main stats paragraph (name through SV)
 *   1 – Abilities paragraph
 *   2 – Skills & Feats paragraph
 */
export type StatBlockData = StatBlockSegment[][];

// ── Helpers ──────────────────────────────────────────────────────────────────

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

function safe(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

// ── Lookup tables ─────────────────────────────────────────────────────────────

const SIZE_AC_MOD: Record<CharacterDraft['size'], number> = {
  Fine: 8, Diminutive: 4, Tiny: 2, Small: 1, Medium: 0,
  Large: -1, Huge: -2, Gargantuan: -4, Colossal: -8,
};

const SIZE_GRAPPLE_MOD: Record<CharacterDraft['size'], number> = {
  Fine: -16, Diminutive: -12, Tiny: -8, Small: -4, Medium: 0,
  Large: 4, Huge: 8, Gargantuan: 12, Colossal: 16,
};

const ALIGNMENT_ABBR: Record<CharacterDraft['alignment'], string> = {
  'Lawful Good': 'LG', 'Neutral Good': 'NG', 'Chaotic Good': 'CG',
  'Lawful Neutral': 'LN', 'True Neutral': 'N', 'Chaotic Neutral': 'CN',
  'Lawful Evil': 'LE', 'Neutral Evil': 'NE', 'Chaotic Evil': 'CE',
};

const RACE_TYPE: Record<CharacterDraft['race'], string> = {
  'Human': 'Humanoid (Human)',
  'Elf': 'Humanoid (Elf)',
  'Dwarf': 'Humanoid (Dwarf)',
  'Gnome': 'Humanoid (Gnome)',
  'Halfling': 'Humanoid (Halfling)',
  'Half-Elf': 'Humanoid (Elf, Human)',
  'Half-Orc': 'Humanoid (Human, Orc)',
};

// ── Attack helpers ────────────────────────────────────────────────────────────

/**
 * Computes the full iterative attack string for a weapon using the same logic
 * as WeaponRow in InventorySection — uses the shared buildIterativeAttackString.
 * If the user has set an attackOverride, that takes priority.
 */
function weaponAttackString(
  weapon: NonNullable<CharacterDraft['inventory']['mainHand']>,
  meleeBonus: number,
  rangedBonus: number,
  bab: number,
  twoWeaponPenalty = 0,
  maxAttacks?: number,
  firstOnly = false,
): string {
  // User's manual override takes priority; persisted computed value is next.
  const stored = (weapon.attackOverride?.trim() || weapon.computedAttack?.trim()) ?? '';
  if (stored) {
    if (!firstOnly) return stored;
    const [first] = stored.split('/');
    return first?.trim() || stored;
  }
  // Fallback: recompute (handles characters saved before computedAttack was added)
  const attackClass = getWeaponAttackClass(weapon.name, weapon.rangeIncrement);
  const isRanged = attackClass === 'Ranged';
  const appliedFeats = weapon.appliedFeats ?? [];
  const isFinesseWeapon = !isRanged && (weapon.handedness === 'Light' || weapon.special?.includes('Weapon Finesse eligible'));
  const usesFinesse = isFinesseWeapon && appliedFeats.includes('Weapon Finesse');
  const hasRapidShot = isRanged && appliedFeats.includes('Rapid Shot');
  const primaryBonus = isRanged ? rangedBonus : (usesFinesse ? rangedBonus : meleeBonus);
  const featBonus =
    (appliedFeats.includes('Weapon Focus') ? 1 : 0) +
    (appliedFeats.includes('Greater Weapon Focus') ? 1 : 0);
  const full = buildIterativeAttackString(
    primaryBonus, bab,
    safe(weapon.enhancementBonus), safe(weapon.combatMod),
    maxAttacks, twoWeaponPenalty, featBonus, hasRapidShot,
  );
  if (!firstOnly) return full;
  const [first] = full.split('/');
  return first?.trim() || full;
}

function formatWeaponAttack(
  weapon: NonNullable<CharacterDraft['inventory']['mainHand']>,
  bonusText: string,
): string {
  const damage = weapon.damage?.trim() || '—';
  return `${weapon.name} ${bonusText} (${damage})`;
}

// ── HD expression ─────────────────────────────────────────────────────────────

function buildHDExpression(classes: CharacterDraft['classes'], conMod: number, charLevel: number): string {
  if (classes.length === 0) return '—';
  const classTerms = classes
    .filter((c) => c.name && c.level > 0)
    .map((c) => `${c.level}d${c.hitDieType}`);
  if (classTerms.length === 0) return '—';
  const conBonus = conMod * charLevel;
  const suffix = conBonus > 0 ? `+${conBonus}` : conBonus < 0 ? `${conBonus}` : '';
  return classTerms.join('+') + suffix;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates a structured 3.5e DMG-format stat block.
 *
 * Returns three paragraphs, each an array of { bold, normal } segments that
 * render inline — matching the layout of the DMG NPC/PC stat block:
 *   Para 0 — main stats (name through SV)
 *   Para 1 — Abilities
 *   Para 2 — Skills & Feats
 */
export function generateStatBlock(draft: CharacterDraft): StatBlockData {
  const charLevel = totalCharacterLevel(draft.classes);

  // Ability score totals
  const str  = totalScore(draft.abilityScores.strength);
  const dex  = totalScore(draft.abilityScores.dexterity);
  const con  = totalScore(draft.abilityScores.constitution);
  const int_ = totalScore(draft.abilityScores.intelligence);
  const wis  = totalScore(draft.abilityScores.wisdom);
  const cha  = totalScore(draft.abilityScores.charisma);

  const strMod = abilityModifier(str);
  const dexMod = abilityModifier(dex);
  const conMod = abilityModifier(con);
  const wisMod = abilityModifier(wis);

  const sizeACMod     = SIZE_AC_MOD[draft.size] ?? 0;
  const sizeGrappleMod = SIZE_GRAPPLE_MOD[draft.size] ?? 0;

  // AC
  const acArmor      = safe(draft.combat.armorClass.armor);
  const acShield     = safe(draft.combat.armorClass.shield);
  const acDodge      = safe(draft.combat.armorClass.dodge);
  const acNatural    = safe(draft.combat.armorClass.natural);
  const acDeflection = safe(draft.combat.armorClass.deflection);
  const acMisc       = safe(draft.combat.armorClass.misc);

  const totalAC      = 10 + acArmor + acShield + dexMod + sizeACMod + acDodge + acNatural + acDeflection + acMisc;
  const touchAC      = 10 + dexMod + sizeACMod + acDodge + acDeflection + acMisc;
  const flatFootedAC = 10 + acArmor + acShield + sizeACMod + acNatural + acDeflection + acMisc;

  // Attack
  const bab         = baseAttackBonusFromClasses(draft.classes);
  const grapple     = bab + strMod + sizeGrappleMod;
  const meleeBonus  = bab + strMod + sizeACMod;
  const rangedBonus = bab + dexMod + sizeACMod;
  const mainHandWeapon = draft.inventory.mainHand?.name?.trim() ? draft.inventory.mainHand : null;
  const offHandWeapon = draft.inventory.offHandWeapon?.name?.trim() ? draft.inventory.offHandWeapon : null;

  // TWF penalties — mirror InventorySection logic
  const isTwoHanded = mainHandWeapon?.handedness === 'Two-Handed';
  const isTwoWeaponFighting = !isTwoHanded && Boolean(mainHandWeapon) && Boolean(offHandWeapon);
  const offHandIsLight = offHandWeapon?.handedness === 'Light';
  const twfAppliedFeats = draft.inventory.twfAppliedFeats ?? [];
  const twfFeatApplied  = twfAppliedFeats.includes('Two-Weapon Fighting');
  const itwfApplied     = twfAppliedFeats.includes('Improved Two-Weapon Fighting');
  const gtwfApplied     = twfAppliedFeats.includes('Greater Two-Weapon Fighting');
  const twfMainPenalty  = isTwoWeaponFighting ? (offHandIsLight ? -4 : -6) + (twfFeatApplied ? 2 : 0) : 0;
  const twfOffPenalty   = isTwoWeaponFighting ? (offHandIsLight ? -8 : -10) + (twfFeatApplied ? 6 : 0) : 0;
  const offHandMaxAttacks = mainHandWeapon ? (gtwfApplied ? 3 : itwfApplied ? 2 : 1) : undefined;

  const atkText = mainHandWeapon
    ? formatWeaponAttack(mainHandWeapon, weaponAttackString(mainHandWeapon, meleeBonus, rangedBonus, bab, twfMainPenalty, undefined, true))
    : `${buildIterativeAttackString(meleeBonus, bab, 0, 0)} melee or ${buildIterativeAttackString(rangedBonus, bab, 0, 0)} ranged (by weapon)`;

  let fullAtkText = atkText;
  if (mainHandWeapon) {
    fullAtkText = formatWeaponAttack(mainHandWeapon, weaponAttackString(mainHandWeapon, meleeBonus, rangedBonus, bab, twfMainPenalty));
    if (offHandWeapon) {
      fullAtkText = `${fullAtkText}; ${formatWeaponAttack(
        offHandWeapon,
        weaponAttackString(offHandWeapon, meleeBonus, rangedBonus, bab, twfOffPenalty, offHandMaxAttacks),
      )}`;
    }
  } else if (offHandWeapon) {
    fullAtkText = formatWeaponAttack(offHandWeapon, weaponAttackString(offHandWeapon, meleeBonus, rangedBonus, bab));
  }

  // Speed
  const speedFeet = Math.max(0, safe(draft.combat.speed.base) + safe(draft.combat.speed.armorAdjust));
  const speedFly  = safe(draft.combat.speed.fly);
  const speedSwim = safe(draft.combat.speed.swim);
  const speedParts: string[] = [`${speedFeet} ft.`];
  if (speedFly > 0)  speedParts.push(`fly ${speedFly} ft.`);
  if (speedSwim > 0) speedParts.push(`swim ${speedSwim} ft.`);

  // Initiative & saves
  const initTotal = dexMod + safe(draft.combat.initiative.miscBonus);
  const fort = baseSaveBonusFromClasses(draft.classes, 'fortitude') + conMod
    + safe(draft.combat.saves.fortitude.magic) + safe(draft.combat.saves.fortitude.misc) + safe(draft.combat.saves.fortitude.temp);
  const ref = baseSaveBonusFromClasses(draft.classes, 'reflex') + dexMod
    + safe(draft.combat.saves.reflex.magic) + safe(draft.combat.saves.reflex.misc) + safe(draft.combat.saves.reflex.temp);
  const will = baseSaveBonusFromClasses(draft.classes, 'will') + wisMod
    + safe(draft.combat.saves.will.magic) + safe(draft.combat.saves.will.misc) + safe(draft.combat.saves.will.temp);

  // Descriptor strings
  const classStr  = draft.classes.filter((c) => c.name && c.level > 0).map((c) => `${c.name} ${c.level}`).join('/');
  const hdExpr    = buildHDExpression(draft.classes, conMod, charLevel);
  const cr        = charLevel || 1;
  const alAbbr    = ALIGNMENT_ABBR[draft.alignment] ?? draft.alignment;
  const raceType  = RACE_TYPE[draft.race] ?? 'Humanoid';
  const titleLine = `${draft.name || 'Unknown Character'}${classStr ? ` ${classStr}` : ''} (CR ${cr})`;

  // Skills (trained only)
  const trainedSkills = draft.skills.filter((s) => s.ranks > 0).map((s) => `${s.name} ${signed(s.bonus)}`);

  // Feats
  const autoFeatNames     = deriveAutoFeats(draft.classes).map((f) => f.name);
  const selectedFeatNames = draft.feats.filter((f) => f.name.trim()).map((f) => f.name);
  const allFeats          = [...autoFeatNames, ...selectedFeatNames];

  // Special qualities & attacks from class features
  const classFeatures = deriveClassFeatures(draft.classes);
  const specialQualities = classFeatures.map((f) => f.name);

  // ── Paragraph 0: main stats ───────────────────────────────────────────────
  const para0: StatBlockSegment[] = [
    { bold: titleLine,     normal: ` ${draft.size} ${raceType};` },
    { bold: ' HD',         normal: ` ${hdExpr};` },
    { bold: ' hp',         normal: ` ${draft.hitPoints.max};` },
    { bold: ' Init',       normal: ` ${signed(initTotal)};` },
    { bold: ' Spd',        normal: ` ${speedParts.join(', ')}` },
    { bold: ' AC',         normal: ` ${totalAC}, touch ${touchAC}, flat-footed ${flatFootedAC};` },
    { bold: ' Base Atk',   normal: ` ${signed(bab)};` },
    { bold: ' Grp',        normal: ` ${signed(grapple)}` },
    { bold: ' Atk',        normal: ` ${atkText}` },
    { bold: ' Full Atk',   normal: ` ${fullAtkText}` },
    { bold: ' SA',         normal: ' —' },
    { bold: ' SQ',         normal: specialQualities.length > 0 ? ` ${specialQualities.join(', ')}` : ' —' },
    { bold: ' AL',         normal: ` ${alAbbr};` },
    { bold: ' SV',         normal: ` Fort ${signed(fort)}, Ref ${signed(ref)}, Will ${signed(will)}` },
  ];

  // ── Paragraph 1: abilities ────────────────────────────────────────────────
  const para1: StatBlockSegment[] = [
    {
      bold: 'Abilities',
      normal: ` Str ${str}, Dex ${dex}, Con ${con}, Int ${int_}, Wis ${wis}, Cha ${cha}`,
    },
  ];

  // ── Paragraph 2: skills & feats ───────────────────────────────────────────
  const skillsText  = trainedSkills.length > 0 ? trainedSkills.join(', ') : '—';
  const featsText   = allFeats.length > 0 ? allFeats.join(', ') : '—';
  const para2: StatBlockSegment[] = [
    { bold: 'Skills & Feats', normal: ` ${skillsText}; ${featsText}` },
  ];

  return [para0, para1, para2];
}

// ── Plain-text helper (for clipboard) ────────────────────────────────────────

export function statBlockToPlainText(data: StatBlockData): string {
  return data
    .map((para) => para.map((seg) => seg.bold + seg.normal).join(''))
    .join('\n\n');
}

// ── RTF export ────────────────────────────────────────────────────────────────

/** Escape a string for inclusion in an RTF document (ansi/cp1252). */
function rtfEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    // en-dash and em-dash
    .replace(/\u2013/g, '\\endash ')
    .replace(/\u2014/g, '\\emdash ')
    // any remaining non-ASCII: encode as \'XX
    .replace(/[^\x00-\x7F]/g, (ch) => `\\'${ch.charCodeAt(0).toString(16).padStart(2, '0')}`);
}

/**
 * Generates a minimal RTF document from stat block data.
 * Uses Times New Roman 11pt, matching the DMG example RTF format.
 * Suitable for opening/editing in MS Word.
 */
export function statBlockToRtf(data: StatBlockData): string {
  const header = [
    '{\\rtf1\\ansi\\ansicpg1252\\deff0',
    '{\\fonttbl{\\f0\\froman\\fcharset0 Times New Roman;}}',
    '{\\colortbl ;\\red0\\green0\\blue0;}',
    '\\f0\\fs22\\cf1',
  ].join('\n');

  const paragraphs = data.map((para) => {
    const runs = para.map((seg) => {
      const boldRun   = seg.bold   ? `{\\b ${rtfEscape(seg.bold)}}`  : '';
      const normalRun = seg.normal ? rtfEscape(seg.normal)            : '';
      return boldRun + normalRun;
    }).join('');
    return `\\pard\\plain\\ql\\widctlpar\\f0\\fs22 ${runs}\\par`;
  });

  return `${header}\n${paragraphs.join('\n')}\n}`;
}
