export type BabProgression = 1.0 | 0.75 | 0.5;
export type SaveProgression = 'good' | 'poor';

export interface CustomClassFeature {
  name: string;
  level: number;
  description: string;
}

export interface CustomClass {
  _id: string;
  name: string;
  description?: string;
  babProgression: BabProgression;
  hitDice: number;
  fortitudeSave: SaveProgression;
  reflexSave: SaveProgression;
  willSave: SaveProgression;
  skillsAtFirst: number;
  skillsPerLevel: number;
  classSkills?: string;
  features: CustomClassFeature[];
  updatedAt: string;
  createdAt: string;
}
