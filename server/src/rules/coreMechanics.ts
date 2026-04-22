/**
 * D&D 3.5 Core Mechanics — sourced from the d20 SRD
 * https://www.d20srd.org/srd/theBasics.htm
 *
 * This file is the single source of truth for all rules-derived constants.
 * Never hard-code values from the SRD elsewhere — import from here.
 */

// ── Ability Score Modifier ───────────────────────────────────────────────────
// Formula: Math.floor((score - 10) / 2)
// SRD: "Each ability … has a modifier ranging from -5 to +5"

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Pre-computed modifier table for scores 1–45 */
export const ABILITY_MODIFIER_TABLE: Readonly<Record<number, number>> = Object.freeze(
  Object.fromEntries(
    Array.from({ length: 45 }, (_, i) => [i + 1, abilityModifier(i + 1)]),
  ),
);

// ── Bonus Types ──────────────────────────────────────────────────────────────
// SRD lists 18 named bonus types; "untyped" bonuses always stack.

export const BONUS_TYPES = [
  'ability',
  'alchemical',
  'armor',
  'circumstance',
  'competence',
  'deflection',
  'dodge',
  'enhancement',
  'insight',
  'luck',
  'morale',
  'naturalArmor',
  'profane',
  'racial',
  'resistance',
  'sacred',
  'shield',
  'size',
  'untyped',
] as const;

export type BonusType = (typeof BONUS_TYPES)[number];

/**
 * Stacking rules per SRD:
 * - true  = multiple bonuses of this type STACK (cumulative)
 * - false = only the highest applies
 *
 * Special cases noted:
 * - dodge:       stacks with all other bonuses including other dodge bonuses
 * - circumstance: stacks unless from the "essentially the same source"
 * - untyped:     always stacks
 */
export const BONUS_TYPE_STACKS: Readonly<Record<BonusType, boolean>> = Object.freeze({
  ability:       false,
  alchemical:    false,
  armor:         false,
  circumstance:  true,   // stacks per SRD
  competence:    false,
  deflection:    false,
  dodge:         true,   // explicitly stacks per SRD
  enhancement:   false,
  insight:       false,
  luck:          false,
  morale:        false,
  naturalArmor:  false,
  profane:       false,
  racial:        false,
  resistance:    false,
  sacred:        false,
  shield:        false,
  size:          false,
  untyped:       true,
});

// ── Size Categories ──────────────────────────────────────────────────────────
// SRD combat statistics table

export const SIZE_CATEGORIES = {
  Fine:        { acAttackMod: +8, hideMod: +16, grappleMod: -16 },
  Diminutive:  { acAttackMod: +4, hideMod: +12, grappleMod: -12 },
  Tiny:        { acAttackMod: +2, hideMod:  +8, grappleMod:  -8 },
  Small:       { acAttackMod: +1, hideMod:  +4, grappleMod:  -4 },
  Medium:      { acAttackMod:  0, hideMod:   0, grappleMod:   0 },
  Large:       { acAttackMod: -1, hideMod:  -4, grappleMod:  +4 },
  Huge:        { acAttackMod: -2, hideMod:  -8, grappleMod:  +8 },
  Gargantuan:  { acAttackMod: -4, hideMod: -12, grappleMod: +12 },
  Colossal:    { acAttackMod: -8, hideMod: -16, grappleMod: +16 },
} as const;

export type SizeCategory = keyof typeof SIZE_CATEGORIES;

// ── Alignments ───────────────────────────────────────────────────────────────

export const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
] as const;

export type Alignment = (typeof ALIGNMENTS)[number];

// ── Hit Dice by Class ────────────────────────────────────────────────────────

export const HIT_DIE_BY_CLASS: Readonly<Record<string, number>> = Object.freeze({
  barbarian: 12,
  fighter:   10,
  paladin:   10,
  ranger:    8,
  bard:      6,
  cleric:    8,
  druid:     8,
  monk:      8,
  rogue:     6,
  sorcerer:  4,
  wizard:    4,
});

// ── Saving Throws → Governing Ability ────────────────────────────────────────

export const SAVING_THROW_ABILITIES = Object.freeze({
  fortitude: 'constitution',
  reflex:    'dexterity',
  will:      'wisdom',
} as const);

// ── Skills → Key Ability ─────────────────────────────────────────────────────

export const ABILITY_SKILL_MAP: Readonly<Record<string, string>> = Object.freeze({
  appraise:          'intelligence',
  balance:           'dexterity',
  bluff:             'charisma',
  climb:             'strength',
  concentration:     'constitution',
  craft:             'intelligence',
  decipherScript:    'intelligence',
  diplomacy:         'charisma',
  disableDevice:     'intelligence',
  disguise:          'charisma',
  escapeArtist:      'dexterity',
  forgery:           'intelligence',
  gatherInformation: 'charisma',
  handleAnimal:      'charisma',
  heal:              'wisdom',
  hide:              'dexterity',
  intimidate:        'charisma',
  jump:              'strength',
  knowledge:         'intelligence',
  listen:            'wisdom',
  moveSilently:      'dexterity',
  openLock:          'dexterity',
  perform:           'charisma',
  profession:        'wisdom',
  ride:              'dexterity',
  search:            'intelligence',
  senseMotive:       'wisdom',
  sleightOfHand:     'dexterity',
  spellcraft:        'intelligence',
  spot:              'wisdom',
  survival:          'wisdom',
  swim:              'strength',
  tumble:            'dexterity',
  useMagicDevice:    'charisma',
  useRope:           'dexterity',
});

// ── Base Land Speed by Race (feet) ───────────────────────────────────────────

export const BASE_LAND_SPEED_BY_RACE: Readonly<Record<string, number>> = Object.freeze({
  human:    30,
  elf:      30,
  halfElf:  30,
  halfOrc:  30,
  gnome:    20,
  halfling: 20,
  dwarf:    20,
});

// ── Playable Races ────────────────────────────────────────────────────────────

export const RACES = [
  'Human',
  'Elf',
  'Dwarf',
  'Gnome',
  'Halfling',
  'Half-Elf',
  'Half-Orc',
] as const;

export type Race = (typeof RACES)[number];

// ── Core Mechanic: d20 Roll Resolution ───────────────────────────────────────
// Roll d20 + modifiers >= target number = success

export const CORE_MECHANIC = Object.freeze({
  die: 20,
  description: 'Roll d20 + relevant modifiers. Meet or exceed target number to succeed.',
  roundingRule: 'Round fractions down. Minimum 1 for damage and hit point rolls.',
  multiplyRule: 'Double (×2) + Double (×2) = Triple (×3). Add each extra ×1 to the first multiple.',
});

// ── Armor Class Base ──────────────────────────────────────────────────────────

export const AC_BASE = 10;

// ── Experience Points Thresholds (levels 1–20) ───────────────────────────────

export const XP_THRESHOLDS: Readonly<number[]> = Object.freeze([
  0,       // level 1
  1000,    // level 2
  3000,    // level 3
  6000,    // level 4
  10000,   // level 5
  15000,   // level 6
  21000,   // level 7
  28000,   // level 8
  36000,   // level 9
  45000,   // level 10
  55000,   // level 11
  66000,   // level 12
  78000,   // level 13
  91000,   // level 14
  105000,  // level 15
  120000,  // level 16
  136000,  // level 17
  153000,  // level 18
  171000,  // level 19
  190000,  // level 20
]);
