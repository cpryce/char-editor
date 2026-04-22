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

// ── Skills ───────────────────────────────────────────────────────────────────
// Full SRD skill list with governing ability, trained-only flag, and armor
// check penalty flag.  Cross-referenced against d20srd.org/indexes/skills.htm
// and dndtools.org/skills.
//
// keyAbility: null → no ability modifier applies (Speak Language)

export type AbilityKey =
  | 'strength' | 'dexterity' | 'constitution'
  | 'intelligence' | 'wisdom' | 'charisma';

export type SkillDef = {
  readonly name:               string;
  readonly keyAbility:         AbilityKey | null;
  readonly trainedOnly:        boolean;
  readonly armorCheckPenalty:  boolean;
};

export const SKILL_LIST: ReadonlyArray<SkillDef> = Object.freeze([
  { name: 'Appraise',                              keyAbility: 'intelligence', trainedOnly: false, armorCheckPenalty: false },
  { name: 'Balance',                               keyAbility: 'dexterity',   trainedOnly: false, armorCheckPenalty: true  },
  { name: 'Bluff',                                 keyAbility: 'charisma',    trainedOnly: false, armorCheckPenalty: false },
  { name: 'Climb',                                 keyAbility: 'strength',    trainedOnly: false, armorCheckPenalty: true  },
  { name: 'Concentration',                         keyAbility: 'constitution',trainedOnly: false, armorCheckPenalty: false },
  { name: 'Craft',                                 keyAbility: 'intelligence',trainedOnly: false, armorCheckPenalty: false },
  { name: 'Decipher Script',                       keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Diplomacy',                             keyAbility: 'charisma',    trainedOnly: false, armorCheckPenalty: false },
  { name: 'Disable Device',                        keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Disguise',                              keyAbility: 'charisma',    trainedOnly: false, armorCheckPenalty: false },
  { name: 'Escape Artist',                         keyAbility: 'dexterity',   trainedOnly: false, armorCheckPenalty: true  },
  { name: 'Forgery',                               keyAbility: 'intelligence',trainedOnly: false, armorCheckPenalty: false },
  { name: 'Gather Information',                    keyAbility: 'charisma',    trainedOnly: false, armorCheckPenalty: false },
  { name: 'Handle Animal',                         keyAbility: 'charisma',    trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Heal',                                  keyAbility: 'wisdom',      trainedOnly: false, armorCheckPenalty: false },
  { name: 'Hide',                                  keyAbility: 'dexterity',   trainedOnly: false, armorCheckPenalty: true  },
  { name: 'Intimidate',                            keyAbility: 'charisma',    trainedOnly: false, armorCheckPenalty: false },
  { name: 'Jump',                                  keyAbility: 'strength',    trainedOnly: false, armorCheckPenalty: true  },
  { name: 'Knowledge (arcana)',                    keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Knowledge (architecture & engineering)',keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Knowledge (dungeoneering)',             keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Knowledge (geography)',                 keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Knowledge (history)',                   keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Knowledge (local)',                     keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Knowledge (nature)',                    keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Knowledge (nobility & royalty)',        keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Knowledge (religion)',                  keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Knowledge (the planes)',                keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Listen',                                keyAbility: 'wisdom',      trainedOnly: false, armorCheckPenalty: false },
  { name: 'Move Silently',                         keyAbility: 'dexterity',   trainedOnly: false, armorCheckPenalty: true  },
  { name: 'Open Lock',                             keyAbility: 'dexterity',   trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Perform',                               keyAbility: 'charisma',    trainedOnly: false, armorCheckPenalty: false },
  { name: 'Profession',                            keyAbility: 'wisdom',      trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Ride',                                  keyAbility: 'dexterity',   trainedOnly: false, armorCheckPenalty: false },
  { name: 'Search',                                keyAbility: 'intelligence',trainedOnly: false, armorCheckPenalty: false },
  { name: 'Sense Motive',                          keyAbility: 'wisdom',      trainedOnly: false, armorCheckPenalty: false },
  { name: 'Sleight of Hand',                       keyAbility: 'dexterity',   trainedOnly: true,  armorCheckPenalty: true  },
  { name: 'Speak Language',                        keyAbility: null,          trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Spellcraft',                            keyAbility: 'intelligence',trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Spot',                                  keyAbility: 'wisdom',      trainedOnly: false, armorCheckPenalty: false },
  { name: 'Survival',                              keyAbility: 'wisdom',      trainedOnly: false, armorCheckPenalty: false },
  { name: 'Swim',                                  keyAbility: 'strength',    trainedOnly: false, armorCheckPenalty: true  },
  { name: 'Tumble',                                keyAbility: 'dexterity',   trainedOnly: true,  armorCheckPenalty: true  },
  { name: 'Use Magic Device',                      keyAbility: 'charisma',    trainedOnly: true,  armorCheckPenalty: false },
  { name: 'Use Rope',                              keyAbility: 'dexterity',   trainedOnly: false, armorCheckPenalty: false },
]);

/** Convenience map: skill name → keyAbility (retained for backward compat) */
export const ABILITY_SKILL_MAP: Readonly<Record<string, string | null>> = Object.freeze(
  Object.fromEntries(SKILL_LIST.map((s) => [s.name, s.keyAbility])),
);

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

// ── Feat Types (per SRD "Types of Feats") ────────────────────────────────────
// Matches the bracket tags used in SRD feat descriptions.
// Reference: https://www.d20srd.org/srd/feats.htm#typesOfFeats

export const FEAT_TYPES = [
  'General',            // [General] — default; no special group rules
  'Fighter Bonus Feat', // eligible for a fighter's bonus feat selection
  'Item Creation',      // [Item Creation] — lets spellcasters create magic items
  'Metamagic',          // [Metamagic] — lets spellcasters modify spells
  'Special',            // [Special] — unique acquisition rules (e.g. Spell Mastery)
] as const;

export type FeatType = (typeof FEAT_TYPES)[number];

// ── Feat Sources (how a feat was obtained by this character) ─────────────────
// Used to group feats on the character sheet by their acquisition source.

export const FEAT_SOURCES = [
  'Class Feat',         // auto-granted by class with no selection (proficiencies)
  'Character Feat',     // chosen as a standard level feat (1st, 3rd, 6th…)
  'Bonus Feat',         // chosen as a racial bonus feat (e.g. human 1st-level bonus)
  'Fighter Bonus Feat', // chosen as a fighter class bonus feat (must be from Fighter Bonus Feats list)
  'Special',            // DM prerogative or exceptional circumstance
] as const;

export type FeatSource = (typeof FEAT_SOURCES)[number];

// ── Standard Feat Levels ─────────────────────────────────────────────────────
// Every character gains a bonus feat at these character levels.

export const STANDARD_FEAT_LEVELS: Readonly<number[]> = Object.freeze([1, 3, 6, 9, 12, 15, 18]);

// ── Fighter Bonus Feat Levels ────────────────────────────────────────────────
// Fighter gains a bonus feat at 1st level and every even level thereafter.
// SRD: "1st level and every two fighter levels thereafter (4th, 6th, 8th …)"
// Note: 2nd level is also a bonus feat level per the class table.

export const FIGHTER_BONUS_FEAT_LEVELS: Readonly<number[]> = Object.freeze(
  [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20],
);

// ── Fighter Bonus Feats (complete SRD list) ───────────────────────────────────
// Any feat on this list may be selected as a fighter's bonus feat.
// Characters of other classes may also select these feats if they meet prerequisites.

export const FIGHTER_BONUS_FEATS: Readonly<string[]> = Object.freeze([
  'Blind-Fight',
  'Combat Expertise',
  'Improved Disarm',
  'Improved Feint',
  'Improved Trip',
  'Whirlwind Attack',
  'Combat Reflexes',
  'Dodge',
  'Mobility',
  'Spring Attack',
  'Exotic Weapon Proficiency',
  'Improved Critical',
  'Improved Initiative',
  'Improved Shield Bash',
  'Improved Unarmed Strike',
  'Deflect Arrows',
  'Improved Grapple',
  'Snatch Arrows',
  'Stunning Fist',
  'Mounted Combat',
  'Mounted Archery',
  'Ride-By Attack',
  'Spirited Charge',
  'Trample',
  'Point Blank Shot',
  'Far Shot',
  'Precise Shot',
  'Rapid Shot',
  'Manyshot',
  'Shot on the Run',
  'Improved Precise Shot',
  'Power Attack',
  'Cleave',
  'Great Cleave',
  'Improved Bull Rush',
  'Improved Overrun',
  'Improved Sunder',
  'Quick Draw',
  'Rapid Reload',
  'Two-Weapon Fighting',
  'Two-Weapon Defense',
  'Improved Two-Weapon Fighting',
  'Greater Two-Weapon Fighting',
  'Weapon Finesse',
  'Weapon Focus',
  'Weapon Specialization',
  'Greater Weapon Focus',
  'Greater Weapon Specialization',
]);

// ── Fighter Class Proficiencies ───────────────────────────────────────────────
// Granted automatically as class features — not chosen, listed as 'proficiency' feats.
// SRD: "A fighter is proficient with all simple and martial weapons and with all
// armor (heavy, medium, and light) and shields (including tower shields)."

export const FIGHTER_CLASS_PROFICIENCIES: Readonly<string[]> = Object.freeze([
  'Simple Weapon Proficiency',
  'Martial Weapon Proficiency',
  'Armor Proficiency (Light)',
  'Armor Proficiency (Medium)',
  'Armor Proficiency (Heavy)',
  'Shield Proficiency',
  'Tower Shield Proficiency',
]);

// ── Human Racial Traits ───────────────────────────────────────────────────────
// SRD: Humans receive a bonus feat at 1st level and bonus skill points each level.

export const HUMAN_RACIAL_TRAITS = Object.freeze({
  bonusFeatAtFirstLevel: 1,
  bonusSkillPointsPerLevel: 1,
  favoredClass: 'Any',
  description: 'Humans gain 1 bonus feat at 1st level and 1 extra skill point per level (×4 at 1st).',
});

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
