import mongoose, { Schema, type Document, type Types } from 'mongoose';

export type CampaignAccessLevel = 'view' | 'delegate';

export interface ICampaignInvite {
  _id: Types.ObjectId;
  email: string;
  token: string | null;
  userId: Types.ObjectId | null;
  access: CampaignAccessLevel;
}

export interface ICampaign extends Document {
  owner: Types.ObjectId;
  name: string;
  description: string;
  characterIds: Types.ObjectId[];
  encounterIds: Types.ObjectId[];
  pointBuySystem?: string;
  invites: Types.DocumentArray<ICampaignInvite & Document>;
}

const CampaignInviteSchema = new Schema<ICampaignInvite>(
  {
    email:  { type: String, required: true, trim: true },
    token:  { type: String, default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    access: { type: String, enum: ['view', 'delegate'], required: true },
  },
  { _id: true },
);

const CampaignSchema = new Schema<ICampaign>(
  {
    owner:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:         { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    characterIds: [{ type: Schema.Types.ObjectId, ref: 'Character' }],
    encounterIds: [{ type: Schema.Types.ObjectId, ref: 'EncounterSession' }],
    pointBuySystem: { type: String, enum: ['adnd28', 'adnd32', 'pathfinder10', 'pathfinder15', 'pathfinder20', 'pathfinder25', null], default: null },
    invites: { type: [CampaignInviteSchema], default: [] },
  },
  { timestamps: true },
);

// Fast lookups: find campaigns a user has been invited to
CampaignSchema.index({ 'invites.token': 1 }, { sparse: true });
CampaignSchema.index({ 'invites.userId': 1 }, { sparse: true });

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
