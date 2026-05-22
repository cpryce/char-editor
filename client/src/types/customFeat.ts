import type { FeatCategory } from '../components/FeatAutocomplete';

export type FeatModifierTarget =
  | 'weapon-attack'
  | 'weapon-damage'
  | 'ac'
  | 'save-fort'
  | 'save-ref'
  | 'save-will';

export type WeaponScope = 'melee' | 'ranged';

export interface FeatModifier {
  target: FeatModifierTarget;
  value: number;
  /** Required when target is 'weapon-attack' or 'weapon-damage'. */
  weaponScope?: WeaponScope;
}

export interface CustomFeat {
  _id: string;
  name: string;
  shortDescription: string;
  fullDescription?: string;
  featTypes: FeatCategory[];
  prerequisites?: string;
  /** Feat names (SRD or custom) that must be selected before this feat can be chosen. */
  prerequisiteFeats?: string[];
  modifiers?: FeatModifier[];
  repeatable: boolean;
  /** Empty array = available to all classes. Non-empty = only available to characters with at least one matching class. */
  classRestrictions: string[];
  updatedAt: string;
  createdAt: string;
  /** True when the current user owns this feat (server-computed). */
  isOwner?: boolean;
}
