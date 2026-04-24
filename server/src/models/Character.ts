import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { ALIGNMENTS, FEAT_TYPES, FEAT_SOURCES, RACES, SIZE_CATEGORIES } from '../rules/coreMechanics';

// ── Sub-schemas ──────────────────────────────────────────────────────────────

/** Stores raw score components; modifier is always derived at runtime via abilityModifier() */
const abilityScoreSchema = new Schema(
  {
    base:        { type: Number, required: true, min: 1 },
    racial:      { type: Number, default: 0 },
    enhancement: { type: Number, default: 0 },
    misc:        { type: Number, default: 0 },
    temp:        { type: Number, default: 0 },
    levelUp:     { type: Number, default: 0 },
    tempScore:   { type: Number, default: null },
  },
  { _id: false },
);

const savingThrowSchema = new Schema(
  {
    base:  { type: Number, default: 0 },
    magic: { type: Number, default: 0 },
    misc:  { type: Number, default: 0 },
    temp:  { type: Number, default: 0 },
  },
  { _id: false },
);

const classLevelSchema = new Schema(
  {
    name:       { type: String, required: true },
    level:      { type: Number, required: true, min: 1 },
    hitDieType: { type: Number, required: true }, // e.g. 10 for d10
    /** HP rolled per level (index 0 = level 1). Max die value taken at level 1 by convention. */
    hpRolled:   [{ type: Number }],
  },
  { _id: false },
);

const skillSchema = new Schema(
  {
    name:              { type: String, required: true },
    /** Governing ability score key; omitted for Speak Language (no ability mod). */
    keyAbility:        { type: String },
    /** True if the skill requires at least 1 rank to use untrained. */
    trainedOnly:       { type: Boolean, default: false },
    /** True if armor check penalty applies to this skill. */
    armorCheckPenalty: { type: Boolean, default: false },
    ranks:             { type: Number, default: 0, min: 0 },
    classSkill:        { type: Boolean, default: false },
    miscBonus:         { type: Number, default: 0 },
    /**
     * Pre-computed total modifier for the skill check:
     *   ranks + abilityModifier(keyAbility score) + miscBonus
     * Recompute whenever ranks, ability scores, or miscBonus change.
     */
    bonus:             { type: Number, default: 0 },
  },
  { _id: false },
);

const featSchema = new Schema(
  {
    name:   { type: String, required: true },
    /**
     * type — the SRD feat type bracket (Types of Feats, d20srd.org/srd/feats.htm):
     *   General          : most feats; no special group rules
     *   Fighter Bonus Feat : can be selected as a fighter's bonus feat
     *   Item Creation    : lets spellcasters create magic items
     *   Metamagic        : lets spellcasters modify spells
     *   Special          : unique acquisition rules (e.g. Spell Mastery)
     */
    type:   { type: String, enum: FEAT_TYPES, required: true, default: 'General' },
    /**
     * source — how this feat was obtained by the character:
     *   Class Feat     : granted automatically by class (proficiencies, bonus feats)
     *   Character Feat : freely chosen (level feats, racial bonus feats)
     *   Special        : DM prerogative or exceptional circumstance
     */
    source: { type: String, enum: FEAT_SOURCES, required: true, default: 'Character Feat' },
    notes:  { type: String },
  },
  { _id: false },
);

const equipmentSchema = new Schema(
  {
    name:     { type: String, required: true },
    type:     { type: String },  // e.g. "armor", "weapon", "gear"
    weight:   { type: Number, default: 0 },
    equipped: { type: Boolean, default: false },
    notes:    { type: String },
  },
  { _id: false },
);

// ── Main Character Interface ─────────────────────────────────────────────────

export interface ICharacter extends Document {
  // Identity
  name: string;
  owner?: Types.ObjectId;
  gender: 'male' | 'female' | 'other';
  race: string;
  alignment: string;
  deity?: string;
  age?: number;
  height?: string;
  weight?: string;
  eyes?: string;
  hair?: string;
  skin?: string;
  languages: string[];
  size: string;
  description?: string;
  backstory?: string;

  // Progression
  classes: {
    name: string;
    level: number;
    hitDieType: number;
    hpRolled: number[];
  }[];
  experience: {
    current: number;
    nextLevel: number;
  };

  // Ability Scores
  abilityScores: {
    strength:     { base: number; racial: number; enhancement: number; misc: number; temp: number; levelUp: number };
    dexterity:    { base: number; racial: number; enhancement: number; misc: number; temp: number; levelUp: number };
    constitution: { base: number; racial: number; enhancement: number; misc: number; temp: number; levelUp: number };
    intelligence: { base: number; racial: number; enhancement: number; misc: number; temp: number; levelUp: number };
    wisdom:       { base: number; racial: number; enhancement: number; misc: number; temp: number; levelUp: number };
    charisma:     { base: number; racial: number; enhancement: number; misc: number; temp: number; levelUp: number };
  };

  // Hit Points
  hitPoints: {
    max: number;
    current: number;
    nonlethal: number;
  };

  // Combat
  combat: {
    initiative:  { miscBonus: number };
    speed:       { base: number; armorAdjust: number; fly: number; swim: number };
    armorClass:  { armor: number; shield: number; dodge: number; natural: number; deflection: number; misc: number };
    saves: {
      fortitude: { base: number; magic: number; misc: number; temp: number };
      reflex:    { base: number; magic: number; misc: number; temp: number };
      will:      { base: number; magic: number; misc: number; temp: number };
    };
    baseAttackBonus: number;
    grappleBonus:    number;
  };

  // Skills, Feats, Equipment, Currency
  skills: { name: string; keyAbility: string; ranks: number; classSkill: boolean; miscBonus: number }[];
  feats:  { name: string; category: string; source?: string; notes?: string }[];
  equipment: { name: string; type?: string; weight: number; equipped: boolean; notes?: string }[];
  currency: { pp: number; gp: number; sp: number; cp: number };
}

// ── Schema ───────────────────────────────────────────────────────────────────

const characterSchema = new Schema<ICharacter>(
  {
    // Identity
    name:        { type: String, required: true },
    owner:       { type: Schema.Types.ObjectId, ref: 'User', default: null },
    gender:      { type: String, enum: ['male', 'female', 'other'], required: true },
    race:        { type: String, enum: RACES, required: true },
    alignment:   { type: String, enum: ALIGNMENTS, required: true },
    deity:       { type: String },
    age:         { type: Number },
    height:      { type: String },
    weight:      { type: String },
    eyes:        { type: String },
    hair:        { type: String },
    skin:        { type: String },
    languages:   [{ type: String }],
    size:        { type: String, enum: Object.keys(SIZE_CATEGORIES), default: 'Medium' },
    description: { type: String },
    backstory:   { type: String },

    // Progression
    classes: [classLevelSchema],
    experience: {
      current:   { type: Number, default: 0 },
      nextLevel: { type: Number, default: 1000 },
    },

    // Ability Scores
    abilityScores: {
      strength:     { type: abilityScoreSchema, required: true },
      dexterity:    { type: abilityScoreSchema, required: true },
      constitution: { type: abilityScoreSchema, required: true },
      intelligence: { type: abilityScoreSchema, required: true },
      wisdom:       { type: abilityScoreSchema, required: true },
      charisma:     { type: abilityScoreSchema, required: true },
    },

    // Hit Points
    hitPoints: {
      max:       { type: Number, required: true },
      current:   { type: Number, required: true },
      nonlethal: { type: Number, default: 0 },
    },

    // Combat
    combat: {
      initiative:      { miscBonus: { type: Number, default: 0 } },
      speed:           {
        base: { type: Number, default: 30 },
        armorAdjust: { type: Number, default: 0 },
        fly: { type: Number, default: 0 },
        swim: { type: Number, default: 0 },
      },
      armorClass: {
        armor:       { type: Number, default: 0 },
        shield:      { type: Number, default: 0 },
        dodge:       { type: Number, default: 0 },
        natural:     { type: Number, default: 0 },
        deflection:  { type: Number, default: 0 },
        misc:        { type: Number, default: 0 },
      },
      saves: {
        fortitude: { type: savingThrowSchema, default: {} },
        reflex:    { type: savingThrowSchema, default: {} },
        will:      { type: savingThrowSchema, default: {} },
      },
      baseAttackBonus: { type: Number, default: 0 },
      grappleBonus:    { type: Number, default: 0 },
    },

    // Skills, Feats, Equipment, Currency
    skills:    [skillSchema],
    feats:     [featSchema],
    equipment: [equipmentSchema],
    currency: {
      pp: { type: Number, default: 0 },
      gp: { type: Number, default: 0 },
      sp: { type: Number, default: 0 },
      cp: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const Character = mongoose.model<ICharacter>('Character', characterSchema);
