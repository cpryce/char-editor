import type { CharacterDraft, AbilityScore, Skill } from '../types/character';

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

const BLANK_SCORE: AbilityScore = { base: 10, racial: 0, enhancement: 0, misc: 0, temp: 0 };

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
  if (!skill.keyAbility) return skill.ranks + skill.miscBonus;
  const score = totalScore(scores[skill.keyAbility as keyof CharacterDraft['abilityScores']]);
  return skill.ranks + abilityModifier(score) + skill.miscBonus;
}

export function newCharacterDraft(): CharacterDraft {
  return {
    name: '',
    gender: 'male',
    race: 'Human',
    alignment: 'True Neutral',
    size: 'Medium',
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
