import type { CharacterDraft, AbilityScore, Skill, Race, Size, ClassName, FeatSlot } from '../types/character';
import { getClassFeatures } from '../data/classFeatures';
export type { DerivedClassFeature } from '../data/classFeatures';

// ── Racial ability adjustments (mirrors server coreMechanics) ────────────────

type AbilityAdj = Record<string, number>;
const ZERO: AbilityAdj = { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 };

export const RACIAL_ABILITY_ADJUSTMENTS: Readonly<Record<string, AbilityAdj>> = {
  Human:      { ...ZERO },
  Elf:        { ...ZERO, dexterity: +2, constitution: -2 },
  Dwarf:      { ...ZERO, constitution: +2, charisma: -2 },
  Gnome:      { ...ZERO, constitution: +2, strength: -2 },
  Halfling:   { ...ZERO, dexterity: +2, strength: -2 },
  'Half-Elf': { ...ZERO },
  'Half-Orc': { ...ZERO, strength: +2, intelligence: -2, charisma: -2 },
};

export const RACIAL_SIZES: Readonly<Record<Race, Size>> = {
  Human: 'Medium',
  Elf: 'Medium',
  Dwarf: 'Medium',
  Gnome: 'Small',
  Halfling: 'Small',
  'Half-Elf': 'Medium',
  'Half-Orc': 'Medium',
};

export const CLASS_SKILL_POINTS_PER_LEVEL: Readonly<Record<ClassName, number>> = {
  Barbarian: 4,
  Bard: 6,
  Cleric: 2,
  Druid: 4,
  Fighter: 2,
  Monk: 4,
  Paladin: 2,
  Ranger: 6,
  Rogue: 8,
  Sorcerer: 2,
  Wizard: 2,
};

type ProgressionRate = 'good' | 'average' | 'poor';
type SaveType = 'fortitude' | 'reflex' | 'will';

const CLASS_BAB_PROGRESSION: Readonly<Record<ClassName, ProgressionRate>> = {
  Barbarian: 'good',
  Bard: 'average',
  Cleric: 'average',
  Druid: 'average',
  Fighter: 'good',
  Monk: 'average',
  Paladin: 'good',
  Ranger: 'good',
  Rogue: 'average',
  Sorcerer: 'poor',
  Wizard: 'poor',
};

const CLASS_SAVE_PROGRESSION: Readonly<Record<ClassName, Readonly<Record<SaveType, 'good' | 'poor'>>>> = {
  Barbarian: { fortitude: 'good', reflex: 'poor', will: 'poor' },
  Bard: { fortitude: 'poor', reflex: 'good', will: 'good' },
  Cleric: { fortitude: 'good', reflex: 'poor', will: 'good' },
  Druid: { fortitude: 'good', reflex: 'poor', will: 'good' },
  Fighter: { fortitude: 'good', reflex: 'poor', will: 'poor' },
  Monk: { fortitude: 'good', reflex: 'good', will: 'good' },
  Paladin: { fortitude: 'good', reflex: 'poor', will: 'poor' },
  Ranger: { fortitude: 'good', reflex: 'good', will: 'poor' },
  Rogue: { fortitude: 'poor', reflex: 'good', will: 'poor' },
  Sorcerer: { fortitude: 'poor', reflex: 'poor', will: 'good' },
  Wizard: { fortitude: 'poor', reflex: 'poor', will: 'good' },
};

function babByProgression(level: number, progression: ProgressionRate) {
  if (progression === 'good') return level;
  if (progression === 'average') return Math.floor((3 * level) / 4);
  return Math.floor(level / 2);
}

function saveByProgression(level: number, progression: 'good' | 'poor') {
  if (progression === 'good') return 2 + Math.floor(level / 2);
  return Math.floor(level / 3);
}

export function baseAttackBonusFromClasses(classes: CharacterDraft['classes']) {
  return classes.reduce((sum, entry) => {
    const className = entry.name as ClassName;
    const progression = CLASS_BAB_PROGRESSION[className];
    if (!progression) return sum;
    const level = Math.max(0, Math.trunc(entry.level || 0));
    return sum + babByProgression(level, progression);
  }, 0);
}

export function baseSaveBonusFromClasses(classes: CharacterDraft['classes'], saveType: SaveType) {
  return classes.reduce((sum, entry) => {
    const className = entry.name as ClassName;
    const progression = CLASS_SAVE_PROGRESSION[className]?.[saveType];
    if (!progression) return sum;
    const level = Math.max(0, Math.trunc(entry.level || 0));
    return sum + saveByProgression(level, progression);
  }, 0);
}

export type ClassFeatEntry = {
  name: string;
  type: 'General' | 'Fighter Bonus Feat';
  source: 'Class Feat' | 'Fighter Bonus Feat';
  sourceLabel: string;
  shortDescription: string;
};

const CLASS_PROFICIENCY_FEATS: Readonly<Record<ClassName, ReadonlyArray<ClassFeatEntry>>> = {
  Barbarian: [
    { name: 'Simple Weapon Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with all simple weapons.' },
    { name: 'Martial Weapon Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with all martial weapons.' },
    { name: 'Armor Proficiency (Light)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with light armor.' },
    { name: 'Armor Proficiency (Medium)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with medium armor.' },
    { name: 'Shield Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with shields (except tower shields).' },
  ],
  Bard: [
    { name: 'Weapon Proficiency (Bard)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with simple weapons plus hand crossbow, longsword, rapier, sap, short sword, shortbow, and whip.' },
    { name: 'Armor Proficiency (Light)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with light armor.' },
    { name: 'Shield Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with shields (except tower shields).' },
  ],
  Cleric: [
    { name: 'Simple Weapon Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with all simple weapons.' },
    { name: 'Armor Proficiency (Light)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with light armor.' },
    { name: 'Armor Proficiency (Medium)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with medium armor.' },
    { name: 'Armor Proficiency (Heavy)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with heavy armor.' },
    { name: 'Shield Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with shields (except tower shields).' },
  ],
  Druid: [
    { name: 'Weapon Proficiency (Druid)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with club, dagger, dart, quarterstaff, scimitar, sickle, sling, and spear.' },
    { name: 'Armor Proficiency (Light)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with light armor (nonmetal only).' },
    { name: 'Armor Proficiency (Medium)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with medium armor (nonmetal only).' },
    { name: 'Shield Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with shields (except tower shields, nonmetal only).' },
  ],
  Fighter: [
    { name: 'Simple Weapon Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with all simple weapons.' },
    { name: 'Martial Weapon Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with all martial weapons.' },
    { name: 'Armor Proficiency (Light)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with light armor.' },
    { name: 'Armor Proficiency (Medium)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with medium armor.' },
    { name: 'Armor Proficiency (Heavy)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with heavy armor.' },
    { name: 'Shield Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with shields.' },
    { name: 'Tower Shield Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with tower shields.' },
  ],
  Monk: [
    { name: 'Weapon Proficiency (Monk)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with club, crossbow (light/heavy), dagger, handaxe, javelin, kama, nunchaku, quarterstaff, sai, shuriken, siangham, and sling.' },
  ],
  Paladin: [
    { name: 'Simple Weapon Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with all simple weapons.' },
    { name: 'Martial Weapon Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with all martial weapons.' },
    { name: 'Armor Proficiency (Light)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with light armor.' },
    { name: 'Armor Proficiency (Medium)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with medium armor.' },
    { name: 'Armor Proficiency (Heavy)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with heavy armor.' },
    { name: 'Shield Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with shields (except tower shields).' },
  ],
  Ranger: [
    { name: 'Simple Weapon Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with all simple weapons.' },
    { name: 'Martial Weapon Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with all martial weapons.' },
    { name: 'Armor Proficiency (Light)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with light armor.' },
    { name: 'Shield Proficiency', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with shields (except tower shields).' },
  ],
  Rogue: [
    { name: 'Weapon Proficiency (Rogue)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with simple weapons plus hand crossbow, rapier, sap, shortbow, and short sword.' },
    { name: 'Armor Proficiency (Light)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with light armor.' },
  ],
  Sorcerer: [
    { name: 'Weapon Proficiency (Sorcerer)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with club, dagger, heavy crossbow, light crossbow, and quarterstaff.' },
  ],
  Wizard: [
    { name: 'Weapon Proficiency (Wizard)', type: 'General', source: 'Class Feat', sourceLabel: 'Class Feature', shortDescription: 'Proficient with club, dagger, heavy crossbow, light crossbow, and quarterstaff.' },
  ],
};

const FIGHTER_BONUS_FEAT_LEVELS_LIST = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20] as const;
const WIZARD_BONUS_FEAT_LEVELS_LIST = [5, 10, 15, 20] as const;

const STANDARD_FEAT_LEVELS: readonly number[] = [1, 3, 6, 9, 12, 15, 18];

/** Returns only auto-granted proficiency feats (read-only, not user-selectable). */
export function deriveAutoFeats(classes: CharacterDraft['classes']): ClassFeatEntry[] {
  const classFeatMap = new Map<string, ClassFeatEntry>();

  classes.forEach((entry) => {
    const className = entry.name as ClassName;
    const level = Math.max(0, Math.trunc(entry.level || 0));
    if (!className || level <= 0) return;

    const proficiencies = CLASS_PROFICIENCY_FEATS[className] ?? [];
    proficiencies.forEach((feat) => {
      if (!classFeatMap.has(feat.name)) classFeatMap.set(feat.name, feat);
    });
  });

  return Array.from(classFeatMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns all class features for the character's current classes and levels,
 * sorted by class name then minLevel.
 */
export function deriveClassFeatures(classes: CharacterDraft['classes']) {
  return classes
    .flatMap((entry) => {
      const className = entry.name as ClassName;
      const level = Math.max(0, Math.trunc(entry.level || 0));
      if (!className || level === 0) return [];
      return getClassFeatures(className, level);
    })
    .sort((a, b) => {
      const cmp = a.className.localeCompare(b.className);
      return cmp !== 0 ? cmp : a.minLevel - b.minLevel;
    });
}

/**
 * Returns user-selectable feat slots derived from class levels and race:
 *   1. Standard character level feats (every character at 1, 3, 6, 9 …)
 *   2. Racial bonus feat (Human only, at level 1)
 *   3. Fighter bonus feat slots (Fighter at 1, 2, 4, 6, 8 …)
 */
export function deriveSelectableFeats(
  classes: CharacterDraft['classes'],
  race: CharacterDraft['race'],
): FeatSlot[] {
  const charLevel = totalCharacterLevel(classes);
  if (charLevel === 0 && classes.length === 0) return [];

  const slots: FeatSlot[] = [];

  // 1. Standard character feats
  STANDARD_FEAT_LEVELS.filter((l) => l <= Math.max(1, charLevel)).forEach((l) => {
    slots.push({ name: '', type: 'General', source: 'Character Feat', sourceLabel: `Character Level ${l}` });
  });

  // 2. Human racial bonus feat (level 1)
  if (race === 'Human') {
    slots.push({ name: '', type: 'General', source: 'Bonus Feat', sourceLabel: 'Racial Bonus Feat (Human)' });
  }

  // 3. Fighter class bonus feats
  classes.forEach((entry) => {
    if (entry.name !== 'Fighter') return;
    const level = Math.max(0, Math.trunc(entry.level || 0));
    FIGHTER_BONUS_FEAT_LEVELS_LIST.filter((l) => l <= Math.max(1, level)).forEach((slotLevel) => {
      slots.push({
        name: '',
        type: 'Fighter Bonus Feat',
        source: 'Fighter Bonus Feat',
        sourceLabel: `Fighter Level ${slotLevel}`,
      });
    });
  });

  // 4. Wizard bonus feats (metamagic, item creation, or Spell Mastery at 5, 10, 15, 20)
  classes.forEach((entry) => {
    if (entry.name !== 'Wizard') return;
    const level = Math.max(0, Math.trunc(entry.level || 0));
    WIZARD_BONUS_FEAT_LEVELS_LIST.filter((l) => l <= level).forEach((slotLevel) => {
      slots.push({
        name: '',
        type: 'General',
        source: 'Bonus Feat',
        sourceLabel: `Wizard Level ${slotLevel}`,
      });
    });
  });

  return slots;
}

/**
 * When classes or race change, re-derive slots while preserving the user's
 * existing feat name selections where the sourceLabel still matches.
 * User-added extras (source === 'Special') are always kept at the end.
 */
export function mergeSelectableFeats(
  existing: FeatSlot[],
  derived: FeatSlot[],
): FeatSlot[] {
  const derivedLabels = new Set(derived.map((f) => f.sourceLabel));

  // Preserve existing slot selections for each sourceLabel.
  const existingByLabel = new Map<string, Pick<FeatSlot, 'name' | 'shortDescription'>>();
  existing.forEach((f) => {
    if (derivedLabels.has(f.sourceLabel) && !existingByLabel.has(f.sourceLabel)) {
      existingByLabel.set(f.sourceLabel, {
        name: f.name,
        shortDescription: f.shortDescription,
      });
    }
  });

  const merged = derived.map((slot) => {
    const existingSlot = existingByLabel.get(slot.sourceLabel);
    return {
      ...slot,
      name: existingSlot?.name ?? '',
      shortDescription: existingSlot?.shortDescription ?? slot.shortDescription,
    };
  });

  // Keep user-added extras
  const extras = existing.filter((f) => f.source === 'Special');
  return [...merged, ...extras];
}

export const CLASS_SKILLS: Readonly<Record<ClassName, ReadonlySet<string>>> = {
  Barbarian: new Set(['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Listen', 'Ride', 'Survival', 'Swim']),
  Bard: new Set([
    'Appraise', 'Balance', 'Bluff', 'Climb', 'Concentration', 'Craft', 'Decipher Script', 'Diplomacy',
    'Disguise', 'Escape Artist', 'Gather Information', 'Hide', 'Jump', 'Knowledge (arcana)',
    'Knowledge (architecture & engineering)', 'Knowledge (dungeoneering)', 'Knowledge (geography)',
    'Knowledge (history)', 'Knowledge (local)', 'Knowledge (nature)', 'Knowledge (nobility & royalty)',
    'Knowledge (religion)', 'Knowledge (the planes)',
    'Listen', 'Move Silently', 'Perform', 'Profession', 'Sense Motive', 'Sleight of Hand',
    'Speak Language', 'Spellcraft', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope',
  ]),
  Cleric: new Set(['Concentration', 'Craft', 'Diplomacy', 'Heal', 'Knowledge (arcana)', 'Knowledge (history)', 'Knowledge (religion)', 'Knowledge (the planes)', 'Profession', 'Spellcraft']),
  Druid: new Set(['Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Knowledge (nature)', 'Listen', 'Profession', 'Ride', 'Spellcraft', 'Spot', 'Survival', 'Swim']),
  Fighter: new Set(['Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Ride', 'Swim']),
  Monk: new Set(['Balance', 'Climb', 'Concentration', 'Craft', 'Diplomacy', 'Escape Artist', 'Hide', 'Jump', 'Knowledge (arcana)', 'Knowledge (religion)', 'Listen', 'Move Silently', 'Perform', 'Profession', 'Sense Motive', 'Spot', 'Swim', 'Tumble']),
  Paladin: new Set(['Concentration', 'Craft', 'Diplomacy', 'Handle Animal', 'Heal', 'Knowledge (nobility & royalty)', 'Knowledge (religion)', 'Profession', 'Ride', 'Sense Motive']),
  Ranger: new Set(['Climb', 'Concentration', 'Craft', 'Handle Animal', 'Heal', 'Hide', 'Jump', 'Knowledge (dungeoneering)', 'Knowledge (geography)', 'Knowledge (nature)', 'Listen', 'Move Silently', 'Profession', 'Ride', 'Search', 'Spot', 'Survival', 'Swim', 'Use Rope']),
  Rogue: new Set(['Appraise', 'Balance', 'Bluff', 'Climb', 'Craft', 'Decipher Script', 'Diplomacy', 'Disable Device', 'Disguise', 'Escape Artist', 'Forgery', 'Gather Information', 'Hide', 'Intimidate', 'Jump', 'Knowledge (local)', 'Listen', 'Move Silently', 'Open Lock', 'Perform', 'Profession', 'Search', 'Sense Motive', 'Sleight of Hand', 'Spot', 'Swim', 'Tumble', 'Use Magic Device', 'Use Rope']),
  Sorcerer: new Set(['Bluff', 'Concentration', 'Craft', 'Knowledge (arcana)', 'Profession', 'Spellcraft']),
  Wizard: new Set(['Concentration', 'Craft', 'Decipher Script', 'Knowledge (arcana)', 'Knowledge (architecture & engineering)', 'Knowledge (dungeoneering)', 'Knowledge (geography)', 'Knowledge (history)', 'Knowledge (local)', 'Knowledge (nature)', 'Knowledge (nobility & royalty)', 'Knowledge (religion)', 'Knowledge (the planes)', 'Profession', 'Spellcraft']),
};

export const RACIAL_SKILL_BONUSES: Readonly<Record<Race, Readonly<Record<string, number>>>> = {
  Human: {},
  Elf: { Listen: 2, Search: 2, Spot: 2 },
  Dwarf: {},
  Gnome: { Listen: 2 },
  Halfling: { Climb: 2, Jump: 2, Listen: 2, 'Move Silently': 2 },
  'Half-Elf': { Listen: 1, Search: 1, Spot: 1 },
  'Half-Orc': {},
};

export const ABILITY_POINT_BUY_BUDGET = 28;

export const ABILITY_POINT_BUY_COSTS: Readonly<Record<number, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 6,
  15: 8,
  16: 10,
  17: 13,
  18: 16,
};

// Mirrors server SKILL_LIST — keyAbility null = Speak Language
const SKILL_DEFS: { name: string; keyAbility: string | null; trainedOnly: boolean; armorCheckPenalty: boolean }[] = [
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
];

const BLANK_SCORE: AbilityScore = { base: 8, racial: 0, enhancement: 0, misc: 0, tempMod: null, levelUp: 0, temp: null };

export function clampAbilityBaseScore(score: number) {
  if (Number.isNaN(score)) return 8;
  return Math.min(18, Math.max(8, Math.trunc(score)));
}

export function abilityPointBuyCost(score: number) {
  return ABILITY_POINT_BUY_COSTS[clampAbilityBaseScore(score)] ?? 0;
}

export function abilityPointBuyTotal(scores: CharacterDraft['abilityScores']) {
  return Object.values(scores).reduce((sum, abilityScore) => sum + abilityPointBuyCost(abilityScore.base), 0);
}

export function affordableAbilityBaseScore(
  scores: CharacterDraft['abilityScores'],
  key: keyof CharacterDraft['abilityScores'],
  requestedScore: number,
) {
  const clampedRequestedScore = clampAbilityBaseScore(requestedScore);
  const availablePoints = ABILITY_POINT_BUY_BUDGET - abilityPointBuyTotal(scores) + abilityPointBuyCost(scores[key].base);

  for (let score = clampedRequestedScore; score >= 8; score -= 1) {
    if (abilityPointBuyCost(score) <= availablePoints) {
      return score;
    }
  }

  return 8;
}

export function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

export function totalScore(s: AbilityScore) {
  return s.base + s.racial + s.enhancement + s.misc + (s.tempMod ?? 0) + s.levelUp;
}

export function computeSkillBonus(
  skill: Skill,
  scores: CharacterDraft['abilityScores'],
): number {
  if (!skill.keyAbility) return Math.floor(skill.ranks + skill.miscBonus);
  const score = totalScore(scores[skill.keyAbility as keyof CharacterDraft['abilityScores']]);
  return Math.floor(skill.ranks + abilityModifier(score) + skill.miscBonus);
}

export function totalCharacterLevel(classes: CharacterDraft['classes']) {
  return classes.reduce((sum, entry) => sum + Math.max(0, Math.trunc(entry.level || 0)), 0);
}

export function maxClassSkillRanks(totalLevel: number) {
  return Math.max(0, totalLevel + 3);
}

export function maxCrossClassSkillRanks(totalLevel: number) {
  return Math.max(0, (totalLevel + 3) / 2);
}

export function skillRankCost(ranks: number, classSkill: boolean) {
  return classSkill ? ranks : ranks * 2;
}

export function spentSkillPoints(skills: CharacterDraft['skills']) {
  return skills.reduce((sum, skill) => sum + skillRankCost(skill.ranks, skill.classSkill), 0);
}

export function totalSkillPointsAvailable(
  classes: CharacterDraft['classes'],
  intelligenceModifier: number,
  race: Race,
) {
  const classSequence: ClassName[] = [];
  classes.forEach((entry) => {
    const className = entry.name as ClassName;
    const levels = Math.max(0, Math.trunc(entry.level || 0));
    for (let i = 0; i < levels; i += 1) {
      classSequence.push(className);
    }
  });

  if (classSequence.length === 0) return 0;

  const racialPerLevel = race === 'Human' ? 1 : 0;

  return classSequence.reduce((total, className, index) => {
    const classBase = CLASS_SKILL_POINTS_PER_LEVEL[className] ?? 0;
    const perLevel = Math.max(1, classBase + intelligenceModifier + racialPerLevel);
    return total + (index === 0 ? perLevel * 4 : perLevel);
  }, 0);
}

export function applyClassAndRacialSkillRules(
  skills: CharacterDraft['skills'],
  classes: CharacterDraft['classes'],
  race: Race,
) {
  const classSkillNames = new Set(
    classes.flatMap((entry) => Array.from(CLASS_SKILLS[entry.name as ClassName] ?? [])),
  );
  const racialBonuses = RACIAL_SKILL_BONUSES[race] ?? {};

  return skills.map((skill) => {
    const classSkill = classSkillNames.has(skill.name);
    return {
      ...skill,
      classSkill,
      miscBonus: racialBonuses[skill.name] ?? 0,
    };
  });
}

export function buildIterativeAttackString(
  primaryAttackBonus: number,
  baseAttackBonus: number,
  enhancementBonus: number,
  combatMod: number,
  maxAttacks?: number,
  twoWeaponPenalty: number = 0,
  featBonus: number = 0,
  rapidShot: boolean = false,
): string {
  const primary = Number.isFinite(primaryAttackBonus) ? primaryAttackBonus : 0;
  const bab = Number.isFinite(baseAttackBonus) ? baseAttackBonus : 0;
  const enh = Number.isFinite(enhancementBonus) ? enhancementBonus : 0;
  const mod = Number.isFinite(combatMod) ? combatMod : 0;
  const twf = Number.isFinite(twoWeaponPenalty) ? twoWeaponPenalty : 0;
  const fb  = Number.isFinite(featBonus) ? featBonus : 0;
  const naturalCount = bab >= 16 ? 4 : bab >= 11 ? 3 : bab >= 6 ? 2 : 1;
  const baseCount    = maxAttacks !== undefined ? Math.min(naturalCount, maxAttacks) : naturalCount;
  const attackCount  = rapidShot ? baseCount + 1 : baseCount;
  const rsOffset     = rapidShot ? -2 : 0;
  return Array.from({ length: attackCount }, (_, i) => {
    const iterPenalty = rapidShot ? (i > 0 ? (i - 1) * 5 : 0) : i * 5;
    const total = primary - iterPenalty + enh + mod + twf + fb + rsOffset;
    return total >= 0 ? `+${total}` : `${total}`;
  }).join('/');
}

export function newCharacterDraft(): CharacterDraft {
  return {
    name: '',
    gender: 'male',
    race: 'Human',
    alignment: 'True Neutral',
    size: RACIAL_SIZES.Human,
    deity: '',
    age: '',
    height: '',
    weight: '',
    eyes: '',
    hair: '',
    skin: '',
    languages: '',
    description: '',
    backstory: '',
    classes: [],
    abilityScores: {
      strength:     { ...BLANK_SCORE },
      dexterity:    { ...BLANK_SCORE },
      constitution: { ...BLANK_SCORE },
      intelligence: { ...BLANK_SCORE },
      wisdom:       { ...BLANK_SCORE },
      charisma:     { ...BLANK_SCORE },
    },
    hitPoints: { max: 0, current: 0, nonlethal: 0 },
    combat: {
      initiative: { miscBonus: 0 },
      speed: { base: 30, armorAdjust: 0, fly: 0, swim: 0 },
      armorClass: { armor: 0, shield: 0, dodge: 0, natural: 0, deflection: 0, misc: 0 },
      saves: {
        fortitude: { base: 0, magic: 0, misc: 0, temp: 0 },
        reflex: { base: 0, magic: 0, misc: 0, temp: 0 },
        will: { base: 0, magic: 0, misc: 0, temp: 0 },
      },
      baseAttackBonus: 0,
      grappleBonus: 0,
    },
    inventory: {
      wornSlots: {
        head:      { item: '', acType: '', acBonus: 0 },
        face:      { item: '', acType: '', acBonus: 0 },
        neck:      { item: '', acType: '', acBonus: 0 },
        shoulders: { item: '', acType: '', acBonus: 0 },
        bodySlot:  { item: '', acType: '', acBonus: 0 },
        chest:     { item: '', acType: '', acBonus: 0 },
        wrists:    { item: '', acType: '', acBonus: 0 },
        hands:     { item: '', acType: '', acBonus: 0 },
        ringLeft:  { item: '', acType: '', acBonus: 0 },
        ringRight: { item: '', acType: '', acBonus: 0 },
        waist:     { item: '', acType: '', acBonus: 0 },
        feet:      { item: '', acType: '', acBonus: 0 },
      },
      body: null,
      mainHand: null,
      offHandWeapon: null,
      offHandShield: null,
      backupWeapons: [],
    },
    skills: SKILL_DEFS.map((def) => ({
      name: def.name,
      keyAbility: def.keyAbility,
      trainedOnly: def.trainedOnly,
      armorCheckPenalty: def.armorCheckPenalty,
      ranks: 0,
      classSkill: false,
      miscBonus: 0,
      bonus: 0,
    })),
    feats: [],
  };
}
