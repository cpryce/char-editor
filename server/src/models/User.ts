import mongoose from 'mongoose';

export interface IUser {
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    avatar: { type: String },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', userSchema);
