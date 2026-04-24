import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayer {
  id: string;
  name: string;
  type: 'player' | 'npc';
  modifier: number;
}

export interface IEncounterSession extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  players: IPlayer[];
  lastAccessed: Date;
}

const PlayerSchema = new Schema<IPlayer>(
  {
    id:       { type: String, required: true },
    name:     { type: String, required: true },
    type:     { type: String, enum: ['player', 'npc'], required: true },
    modifier: { type: Number, default: 0 },
  },
  { _id: false }
);

const EncounterSessionSchema = new Schema<IEncounterSession>(
  {
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name:         { type: String, required: true, trim: true },
    players:      { type: [PlayerSchema], default: [] },
    lastAccessed: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const EncounterSession = mongoose.model<IEncounterSession>('EncounterSession', EncounterSessionSchema);
