import mongoose, { Schema, type Document, type Types } from 'mongoose';

/**
 * A 20-row × 10-column table of base spells per day.
 * Index 0 = character level 1, index 19 = level 20.
 * Inner index 0 = spell level 0 (cantrips), index 9 = spell level 9.
 * Value -1 means the class does not have spells of that level at that character level.
 * Value 0 means 0 base spells (only bonus spells from high ability score).
 */
export interface ISpellProgression extends Document {
  owner: Types.ObjectId;
  className: string;
  casterAbility: 'Intelligence' | 'Wisdom' | 'Charisma';
  /** true = auto-seeded SRD default; user can edit but not delete SRD rows */
  isDefault: boolean;
  levels: number[][];
  updatedAt: Date;
  createdAt: Date;
}

const spellProgressionSchema = new Schema<ISpellProgression>(
  {
    owner:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    className:     { type: String, required: true, trim: true, maxlength: 120 },
    casterAbility: { type: String, required: true, enum: ['Intelligence', 'Wisdom', 'Charisma'] },
    isDefault:     { type: Boolean, default: false },
    levels:        { type: [[Number]], required: true },
  },
  { timestamps: true },
);

// One progression per class name per user
spellProgressionSchema.index({ owner: 1, className: 1 }, { unique: true });

export const SpellProgression = mongoose.model<ISpellProgression>('SpellProgression', spellProgressionSchema);
