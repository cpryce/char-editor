import mongoose, { Schema, type Document, type Types } from 'mongoose';
import { FEAT_TYPES } from '../rules/coreMechanics';

const MODIFIER_TARGETS = ['weapon-attack', 'weapon-damage', 'ac', 'save-fort', 'save-ref', 'save-will'] as const;
const WEAPON_SCOPES = ['melee', 'ranged'] as const;

interface IFeatModifier {
  target: typeof MODIFIER_TARGETS[number];
  value: number;
  weaponScope?: typeof WEAPON_SCOPES[number];
}

const featModifierSchema = new Schema<IFeatModifier>(
  {
    target:      { type: String, enum: MODIFIER_TARGETS, required: true },
    value:       { type: Number, required: true },
    weaponScope: { type: String, enum: WEAPON_SCOPES },
  },
  { _id: false },
);

export interface ICustomFeat extends Document {
  owner: Types.ObjectId;
  name: string;
  shortDescription: string;
  fullDescription?: string;
  featTypes: string[];
  prerequisites?: string;
  prerequisiteFeats: string[];
  modifiers: IFeatModifier[];
  repeatable: boolean;
  /** Empty = available to all classes. Non-empty = only shown for characters with at least one of these classes. */
  classRestrictions: string[];
  updatedAt: Date;
  createdAt: Date;
}

const customFeatSchema = new Schema<ICustomFeat>(
  {
    owner:             { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:              { type: String, required: true, trim: true, maxlength: 120 },
    shortDescription:  { type: String, default: '', maxlength: 300 },
    fullDescription:   { type: String, maxlength: 4000 },
    featTypes:         {
      type: [{ type: String, enum: FEAT_TYPES }],
      default: ['General'],
      validate: { validator: (v: string[]) => v.length > 0, message: 'At least one feat type is required.' },
    },
    prerequisites:     { type: String, maxlength: 300 },
    prerequisiteFeats: [{ type: String, trim: true }],
    modifiers:         { type: [featModifierSchema], default: [] },
    repeatable:        { type: Boolean, default: false },
    classRestrictions: [{ type: String, trim: true }],
  },
  { timestamps: true },
);

// Unique name per user
customFeatSchema.index({ owner: 1, name: 1 }, { unique: true });

export const CustomFeat = mongoose.model<ICustomFeat>('CustomFeat', customFeatSchema);
