import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ICampaign extends Document {
  owner: Types.ObjectId;
  name: string;
  description: string;
  characterIds: Types.ObjectId[];
  encounterIds: Types.ObjectId[];
}

const CampaignSchema = new Schema<ICampaign>(
  {
    owner:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:         { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    characterIds: [{ type: Schema.Types.ObjectId, ref: 'Character' }],
    encounterIds: [{ type: Schema.Types.ObjectId, ref: 'EncounterSession' }],
  },
  { timestamps: true },
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
