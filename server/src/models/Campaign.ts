import mongoose, { Schema, type Document, type Types } from 'mongoose';

export interface ICampaign extends Document {
  owner: Types.ObjectId;
  name: string;
  description: string;
  characterIds: Types.ObjectId[];
  encounterIds: Types.ObjectId[];
  pointBuySystem?: string;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    owner:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:         { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    characterIds: [{ type: Schema.Types.ObjectId, ref: 'Character' }],
    encounterIds: [{ type: Schema.Types.ObjectId, ref: 'EncounterSession' }],
    pointBuySystem: { type: String, enum: ['adnd28', 'adnd32', 'pathfinder10', 'pathfinder15', 'pathfinder20', 'pathfinder25', null], default: null },
  },
  { timestamps: true },
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
