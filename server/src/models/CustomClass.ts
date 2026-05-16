import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ICustomClassFeature {
  name: string;
  level: number;
  description: string;
}

export interface ICustomClass extends Document {
  owner: Types.ObjectId;
  name: string;
  description?: string;
  babProgression: number;
  hitDice: number;
  fortitudeSave: string;
  reflexSave: string;
  willSave: string;
  skillsAtFirst: number;
  skillsPerLevel: number;
  classSkills?: string;
  features: ICustomClassFeature[];
  updatedAt: Date;
  createdAt: Date;
}

const customClassFeatureSchema = new Schema<ICustomClassFeature>(
  {
    name:        { type: String, required: true, trim: true, maxlength: 120 },
    level:       { type: Number, required: true, min: 1, max: 20 },
    description: { type: String, default: '', maxlength: 1000 },
  },
  { _id: false },
);

const customClassSchema = new Schema<ICustomClass>(
  {
    owner:          { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name:           { type: String, required: true, trim: true, maxlength: 120 },
    description:    { type: String, maxlength: 200, trim: true },
    babProgression: { type: Number, required: true, enum: [1.0, 0.75, 0.5] },
    hitDice:        { type: Number, required: true, enum: [4, 6, 8, 10, 12], default: 8 },
    fortitudeSave:  { type: String, required: true, enum: ['good', 'poor'], default: 'poor' },
    reflexSave:     { type: String, required: true, enum: ['good', 'poor'], default: 'poor' },
    willSave:       { type: String, required: true, enum: ['good', 'poor'], default: 'poor' },
    skillsAtFirst:  { type: Number, required: true, min: 1, max: 40, default: 4 },
    skillsPerLevel: { type: Number, required: true, min: 1, max: 20, default: 2 },
    classSkills:    { type: String, trim: true },
    features:       { type: [customClassFeatureSchema], default: [] },
  },
  { timestamps: true },
);

// Unique name per user
customClassSchema.index({ owner: 1, name: 1 }, { unique: true });

export const CustomClass = mongoose.model<ICustomClass>('CustomClass', customClassSchema);
