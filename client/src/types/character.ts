// ── Enumerations (mirror server coreMechanics constants) ────────────────────

export const RACES = ['Human', 'Elf', 'Dwarf', 'Gnome', 'Halfling', 'Half-Elf', 'Half-Orc'] as const;
export type Race = (typeof RACES)[number];

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
] as const;
export type Alignment = (typeof ALIGNMENTS)[number];

export const GENDERS = ['male', 'female', 'other'] as const;
export type Gender = (typeof GENDERS)[number];

export const SIZES = ['Fine','Diminutive','Tiny','Small','Medium','Large','Huge','Gargantuan','Colossal'] as const;
export type Size = (typeof SIZES)[number];

export const CLASSES = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Wizard',
] as const;
export type ClassName = (typeof CLASSES)[number];

export const HIT_DIE_BY_CLASS: Record<string, number> = {
  Barbarian: 12, Fighter: 10, Paladin: 10, Ranger: 8, Bard: 6,
  Cleric: 8, Druid: 8, Monk: 8, Rogue: 6, Sorcerer: 4, Wizard: 4,
};

// ── Sub-types ────────────────────────────────────────────────────────────────

export interface AbilityScore {
  base: number;
  racial: number;
  enhancement: number;
  misc: number;
  /** Temporary bonus added into the total score (e.g. from a spell). Null until set. */
  tempMod: number | null;
  levelUp: number;
  /** Temporary score override for "what-if" display and combat calculations. Null until set. */
  temp: number | null;
}

export interface Skill {
  name: string;
  keyAbility: string | null;
  trainedOnly: boolean;
  armorCheckPenalty: boolean;
  ranks: number;
  classSkill: boolean;
  miscBonus: number;
  bonus: number;
}

export interface ClassEntry {
  name: string;
  level: number;
  hitDieType: number;
  hpRolled: number[];
}

// ── Selectable feat slot (stored in CharacterDraft.feats) ──────────────────────

export interface FeatSlot {
  name: string;        // blank while not yet selected
  type: 'General' | 'Fighter Bonus Feat';
  source: 'Character Feat' | 'Bonus Feat' | 'Fighter Bonus Feat' | 'Special';
  sourceLabel: string; // display label, e.g. "Character Level 1", "Fighter Level 1"
  shortDescription?: string; // from SRD catalog; undefined for custom/free-text feats
}

// ── Full character form state ─────────────────────────────────────────────────

export interface CharacterDraft {
  name: string;
  gender: Gender;
  race: Race;
  alignment: Alignment;
  size: Size;
  deity: string;
  age: string;
  height: string;
  weight: string;
  eyes: string;
  hair: string;
  skin: string;
  languages: string;
  description: string;
  backstory: string;

  classes: ClassEntry[];

  abilityScores: {
    strength:     AbilityScore;
    dexterity:    AbilityScore;
    constitution: AbilityScore;
    intelligence: AbilityScore;
    wisdom:       AbilityScore;
    charisma:     AbilityScore;
  };

  hitPoints: { max: number; current: number; nonlethal: number };

  combat: {
    initiative: { miscBonus: number };
    speed: { base: number; armorAdjust: number; fly: number; swim: number };
    armorClass: { armor: number; shield: number; dodge: number; natural: number; deflection: number; misc: number };
    saves: {
      fortitude: { base: number; magic: number; misc: number; temp: number };
      reflex: { base: number; magic: number; misc: number; temp: number };
      will: { base: number; magic: number; misc: number; temp: number };
    };
    baseAttackBonus: number;
    grappleBonus: number;
  };

  skills: Skill[];
  feats: FeatSlot[];
}
