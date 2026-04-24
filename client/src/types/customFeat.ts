import type { FeatCategory } from '../components/FeatAutocomplete';

export interface CustomFeat {
  _id: string;
  name: string;
  shortDescription: string;
  fullDescription?: string;
  featTypes: FeatCategory[];
  prerequisites?: string;
  repeatable: boolean;
  /** Empty array = available to all classes. Non-empty = only available to characters with at least one matching class. */
  classRestrictions: string[];
  updatedAt: string;
  createdAt: string;
}
