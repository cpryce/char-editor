export interface SpellProgression {
  _id: string;
  owner: string;
  className: string;
  casterAbility: 'Intelligence' | 'Wisdom' | 'Charisma';
  isDefault: boolean;
  /** 20 rows (char levels 1-20) × 10 cols (spell levels 0-9). -1 = N/A. */
  levels: number[][];
  updatedAt: string;
  createdAt: string;
}
