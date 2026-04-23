import type { CharacterDraft, AbilityScore, Skill, Race, Size, ClassName } from '../types/character';

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

const BLANK_SCORE: AbilityScore = { base: 8, racial: 0, enhancement: 0, misc: 0, temp: 0 };

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
  return s.base + s.racial + s.enhancement + s.misc + s.temp;
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
  };
}
