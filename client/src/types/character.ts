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

/** Bonus types that can apply to Armor Class, per the d20 SRD stacking rules. */
export type AcBonusType =
  | 'armor' | 'shield' | 'deflection' | 'dodge'
  | 'natural' | 'insight' | 'luck' | 'sacred' | 'profane';

/** Keys of the named worn-item slots. */
export type WornSlotKey =
  | 'head' | 'face' | 'neck' | 'shoulders' | 'bodySlot' | 'chest'
  | 'wrists' | 'hands' | 'ringLeft' | 'ringRight' | 'waist' | 'feet';

/** A single worn slot entry: the item name, AC bonus type, and AC bonus value. */
export interface WornSlot {
  item: string;
  acType: string;
  acBonus: number;
}

export interface ArmorLoadout {
  name: string;
  category: 'Light Armor' | 'Medium Armor' | 'Heavy Armor' | 'Shield';
  armorBonus: number;
  enhancementBonus: number;
  maxDexBonus: string | null;
  armorCheckPenalty: number;
  arcaneSpellFailure: string;
  speed: string;
  weight: string;
  armorAdjust: number;
  /** Special material from d20 SRD (e.g. 'mithral', 'adamantine'). */
  material?: string;
}

export interface WeaponLoadout {
  name: string;
  proficiency: 'Simple' | 'Martial' | 'Exotic';
  handedness: 'Light' | 'One-Handed' | 'Two-Handed';
  /** Editable damage value stored with the equipped weapon. */
  damage: string;
  /** e.g. "19-20/×2" */
  critical: string;
  /** "—" for melee-only, otherwise e.g. "30 ft." */
  rangeIncrement: string;
  weight: string;
  damageType: string;
  enhancementBonus: number;
  combatMod?: number;
  attackOverride?: string;
  /** Computed iterative attack string, stamped on every save. Read by the stat block. */
  computedAttack?: string;
  special: string;
  /** Feats actively applied to this weapon (e.g. 'Weapon Focus', 'Weapon Finesse'). */
  appliedFeats?: string[];
  /** Special material from d20 SRD (e.g. 'mithral', 'cold-iron'). */
  material?: string;
}

/** All equipment slots on a character. */
export interface Inventory {
  // Named worn slots — each entry stores the item name and optional AC bonus
  wornSlots: Record<WornSlotKey, WornSlot>;
  // Complex slots with structured loadouts
  /** Body slot — holds armor. Syncs to combat.armorClass.armor. */
  body:          ArmorLoadout | null;
  /** Main-hand weapon. When Two-Handed, offHandWeapon and offHandShield must both be null. */
  mainHand:      WeaponLoadout | null;
  /** Off-hand weapon. Mutually exclusive with offHandShield. Null when mainHand is Two-Handed. */
  offHandWeapon: WeaponLoadout | null;
  /** Off-hand shield. Mutually exclusive with offHandWeapon. Null when mainHand is Two-Handed. Syncs to combat.armorClass.shield. */
  offHandShield: ArmorLoadout | null;
  /** Two-weapon fighting feats applied globally (e.g. 'Two-Weapon Fighting', 'Improved Two-Weapon Fighting'). */
  twfAppliedFeats?: string[];
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

  inventory: Inventory;

  skills: Skill[];
  feats: FeatSlot[];
}
