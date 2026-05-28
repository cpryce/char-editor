export interface SpellProgression {
  _id: string;
  owner: string;
  className: string;
  casterAbility: 'Intelligence' | 'Wisdom' | 'Charisma';
  isDefault: boolean;
  /** Highest spell level available (0-9, default 9). Limits grid columns. */
  maxSpellLevel?: number;
  /** Whether this class has a limited spells-known list (e.g. Bard, Sorcerer). */
  hasLimitedSpellsKnown?: boolean;
  /** 20 rows (char levels 1-20) × 10 cols (spell levels 0-9). -1 = N/A. */
  levels: number[][];
  /** Optional spells-known table (same shape as levels). Present for spontaneous casters like Bard/Sorcerer. */
  spellsKnown?: number[][];
  updatedAt: string;
  createdAt: string;
}
