// SRD weapon catalog — d20srd.org/srd/equipment/weapons.htm

export type WeaponProficiency = 'Simple' | 'Martial' | 'Exotic';
export type WeaponHandedness = 'Light' | 'One-Handed' | 'Two-Handed';

export interface WeaponCatalogEntry {
  name: string;
  proficiency: WeaponProficiency;
  handedness: WeaponHandedness;
  /** Damage for a Medium weapon. Use this on Medium characters. */
  damageMedium: string;
  /** Damage for a Small weapon. */
  damageSmall: string;
  /** e.g. "×2", "19-20/×2", "18-20/×2", "×3", "×4" */
  critical: string;
  /** "—" for melee-only; otherwise e.g. "30 ft." */
  rangeIncrement: string;
  weight: string;
  damageType: string;
  /** Free-text special properties (reach, double, trip, disarm, monk, etc.) */
  special?: string;
}

export const WEAPON_CATALOG: ReadonlyArray<WeaponCatalogEntry> = [
  // ── Simple Weapons ─────────────────────────────────────────────────────────
  // Unarmed / Light
  {
    name: 'Gauntlet',
    proficiency: 'Simple', handedness: 'Light',
    damageMedium: '1d3', damageSmall: '1d2',
    critical: '×2', rangeIncrement: '—',
    weight: '1 lb.', damageType: 'Bludgeoning',
  },
  {
    name: 'Unarmed Strike',
    proficiency: 'Simple', handedness: 'Light',
    damageMedium: '1d3', damageSmall: '1d2',
    critical: '×2', rangeIncrement: '—',
    weight: '—', damageType: 'Bludgeoning',
    special: 'nonlethal',
  },
  // Simple Light Melee
  {
    name: 'Dagger',
    proficiency: 'Simple', handedness: 'Light',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '19-20/×2', rangeIncrement: '10 ft.',
    weight: '1 lb.', damageType: 'Piercing or slashing',
  },
  {
    name: 'Dagger, Punching',
    proficiency: 'Simple', handedness: 'Light',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '×3', rangeIncrement: '—',
    weight: '1 lb.', damageType: 'Piercing',
  },
  {
    name: 'Gauntlet, Spiked',
    proficiency: 'Simple', handedness: 'Light',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '×2', rangeIncrement: '—',
    weight: '1 lb.', damageType: 'Piercing',
  },
  {
    name: 'Mace, Light',
    proficiency: 'Simple', handedness: 'Light',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '—',
    weight: '4 lb.', damageType: 'Bludgeoning',
  },
  {
    name: 'Sickle',
    proficiency: 'Simple', handedness: 'Light',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '—',
    weight: '2 lb.', damageType: 'Slashing',
    special: 'trip',
  },
  // Simple One-Handed Melee
  {
    name: 'Club',
    proficiency: 'Simple', handedness: 'One-Handed',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '10 ft.',
    weight: '3 lb.', damageType: 'Bludgeoning',
  },
  {
    name: 'Mace, Heavy',
    proficiency: 'Simple', handedness: 'One-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×2', rangeIncrement: '—',
    weight: '8 lb.', damageType: 'Bludgeoning',
  },
  {
    name: 'Morningstar',
    proficiency: 'Simple', handedness: 'One-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×2', rangeIncrement: '—',
    weight: '6 lb.', damageType: 'Bludgeoning and piercing',
  },
  {
    name: 'Shortspear',
    proficiency: 'Simple', handedness: 'One-Handed',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '20 ft.',
    weight: '3 lb.', damageType: 'Piercing',
  },
  // Simple Two-Handed Melee
  {
    name: 'Longspear',
    proficiency: 'Simple', handedness: 'Two-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×3', rangeIncrement: '—',
    weight: '9 lb.', damageType: 'Piercing',
    special: 'reach',
  },
  {
    name: 'Quarterstaff',
    proficiency: 'Simple', handedness: 'Two-Handed',
    damageMedium: '1d6/1d6', damageSmall: '1d4/1d4',
    critical: '×2', rangeIncrement: '—',
    weight: '4 lb.', damageType: 'Bludgeoning',
    special: 'double, monk',
  },
  {
    name: 'Spear',
    proficiency: 'Simple', handedness: 'Two-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×3', rangeIncrement: '20 ft.',
    weight: '6 lb.', damageType: 'Piercing',
  },
  // Simple Ranged
  {
    name: 'Crossbow, Heavy',
    proficiency: 'Simple', handedness: 'Two-Handed',
    damageMedium: '1d10', damageSmall: '1d8',
    critical: '19-20/×2', rangeIncrement: '120 ft.',
    weight: '8 lb.', damageType: 'Piercing',
  },
  {
    name: 'Crossbow, Light',
    proficiency: 'Simple', handedness: 'Two-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '19-20/×2', rangeIncrement: '80 ft.',
    weight: '4 lb.', damageType: 'Piercing',
  },
  {
    name: 'Dart',
    proficiency: 'Simple', handedness: 'Light',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '×2', rangeIncrement: '20 ft.',
    weight: '½ lb.', damageType: 'Piercing',
  },
  {
    name: 'Javelin',
    proficiency: 'Simple', handedness: 'One-Handed',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '30 ft.',
    weight: '2 lb.', damageType: 'Piercing',
  },
  {
    name: 'Sling',
    proficiency: 'Simple', handedness: 'One-Handed',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '×2', rangeIncrement: '50 ft.',
    weight: '0 lb.', damageType: 'Bludgeoning',
  },

  // ── Martial Weapons ─────────────────────────────────────────────────────────
  // Martial Light Melee
  {
    name: 'Axe, Throwing',
    proficiency: 'Martial', handedness: 'Light',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '10 ft.',
    weight: '2 lb.', damageType: 'Slashing',
  },
  {
    name: 'Hammer, Light',
    proficiency: 'Martial', handedness: 'Light',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '×2', rangeIncrement: '20 ft.',
    weight: '2 lb.', damageType: 'Bludgeoning',
  },
  {
    name: 'Handaxe',
    proficiency: 'Martial', handedness: 'Light',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×3', rangeIncrement: '—',
    weight: '3 lb.', damageType: 'Slashing',
  },
  {
    name: 'Kukri',
    proficiency: 'Martial', handedness: 'Light',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '18-20/×2', rangeIncrement: '—',
    weight: '2 lb.', damageType: 'Slashing',
  },
  {
    name: 'Pick, Light',
    proficiency: 'Martial', handedness: 'Light',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '×4', rangeIncrement: '—',
    weight: '3 lb.', damageType: 'Piercing',
  },
  {
    name: 'Sap',
    proficiency: 'Martial', handedness: 'Light',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '—',
    weight: '2 lb.', damageType: 'Bludgeoning',
    special: 'nonlethal',
  },
  {
    name: 'Sword, Short',
    proficiency: 'Martial', handedness: 'Light',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '19-20/×2', rangeIncrement: '—',
    weight: '2 lb.', damageType: 'Piercing',
  },
  // Martial One-Handed Melee
  {
    name: 'Battleaxe',
    proficiency: 'Martial', handedness: 'One-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×3', rangeIncrement: '—',
    weight: '6 lb.', damageType: 'Slashing',
  },
  {
    name: 'Flail',
    proficiency: 'Martial', handedness: 'One-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×2', rangeIncrement: '—',
    weight: '5 lb.', damageType: 'Bludgeoning',
    special: 'disarm, trip',
  },
  {
    name: 'Longsword',
    proficiency: 'Martial', handedness: 'One-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '19-20/×2', rangeIncrement: '—',
    weight: '4 lb.', damageType: 'Slashing',
  },
  {
    name: 'Pick, Heavy',
    proficiency: 'Martial', handedness: 'One-Handed',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×4', rangeIncrement: '—',
    weight: '6 lb.', damageType: 'Piercing',
  },
  {
    name: 'Rapier',
    proficiency: 'Martial', handedness: 'One-Handed',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '18-20/×2', rangeIncrement: '—',
    weight: '2 lb.', damageType: 'Piercing',
    special: 'Weapon Finesse eligible',
  },
  {
    name: 'Scimitar',
    proficiency: 'Martial', handedness: 'One-Handed',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '18-20/×2', rangeIncrement: '—',
    weight: '4 lb.', damageType: 'Slashing',
  },
  {
    name: 'Trident',
    proficiency: 'Martial', handedness: 'One-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×2', rangeIncrement: '10 ft.',
    weight: '4 lb.', damageType: 'Piercing',
  },
  {
    name: 'Warhammer',
    proficiency: 'Martial', handedness: 'One-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×3', rangeIncrement: '—',
    weight: '5 lb.', damageType: 'Bludgeoning',
  },
  // Martial Two-Handed Melee
  {
    name: 'Falchion',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '2d4', damageSmall: '1d6',
    critical: '18-20/×2', rangeIncrement: '—',
    weight: '8 lb.', damageType: 'Slashing',
  },
  {
    name: 'Glaive',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d10', damageSmall: '1d8',
    critical: '×3', rangeIncrement: '—',
    weight: '10 lb.', damageType: 'Slashing',
    special: 'reach',
  },
  {
    name: 'Greataxe',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d12', damageSmall: '1d10',
    critical: '×3', rangeIncrement: '—',
    weight: '12 lb.', damageType: 'Slashing',
  },
  {
    name: 'Greatclub',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d10', damageSmall: '1d8',
    critical: '×2', rangeIncrement: '—',
    weight: '8 lb.', damageType: 'Bludgeoning',
  },
  {
    name: 'Flail, Heavy',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d10', damageSmall: '1d8',
    critical: '19-20/×2', rangeIncrement: '—',
    weight: '10 lb.', damageType: 'Bludgeoning',
    special: 'disarm, trip',
  },
  {
    name: 'Greatsword',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '2d6', damageSmall: '1d10',
    critical: '19-20/×2', rangeIncrement: '—',
    weight: '8 lb.', damageType: 'Slashing',
  },
  {
    name: 'Guisarme',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '2d4', damageSmall: '1d6',
    critical: '×3', rangeIncrement: '—',
    weight: '12 lb.', damageType: 'Slashing',
    special: 'reach, trip',
  },
  {
    name: 'Halberd',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d10', damageSmall: '1d8',
    critical: '×3', rangeIncrement: '—',
    weight: '12 lb.', damageType: 'Piercing or slashing',
    special: 'trip',
  },
  {
    name: 'Lance',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×3', rangeIncrement: '—',
    weight: '10 lb.', damageType: 'Piercing',
    special: 'reach; one-handed when mounted',
  },
  {
    name: 'Ranseur',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '2d4', damageSmall: '1d6',
    critical: '×3', rangeIncrement: '—',
    weight: '12 lb.', damageType: 'Piercing',
    special: 'reach, disarm',
  },
  {
    name: 'Scythe',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '2d4', damageSmall: '1d6',
    critical: '×4', rangeIncrement: '—',
    weight: '10 lb.', damageType: 'Piercing or slashing',
    special: 'trip',
  },
  // Martial Ranged
  {
    name: 'Longbow',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×3', rangeIncrement: '100 ft.',
    weight: '3 lb.', damageType: 'Piercing',
  },
  {
    name: 'Longbow, Composite',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '×3', rangeIncrement: '110 ft.',
    weight: '3 lb.', damageType: 'Piercing',
    special: 'Strength bonus applies',
  },
  {
    name: 'Shortbow',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×3', rangeIncrement: '60 ft.',
    weight: '2 lb.', damageType: 'Piercing',
  },
  {
    name: 'Shortbow, Composite',
    proficiency: 'Martial', handedness: 'Two-Handed',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×3', rangeIncrement: '70 ft.',
    weight: '2 lb.', damageType: 'Piercing',
    special: 'Strength bonus applies',
  },

  // ── Exotic Weapons ──────────────────────────────────────────────────────────
  // Exotic Light Melee
  {
    name: 'Kama',
    proficiency: 'Exotic', handedness: 'Light',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '—',
    weight: '2 lb.', damageType: 'Slashing',
    special: 'monk, trip',
  },
  {
    name: 'Nunchaku',
    proficiency: 'Exotic', handedness: 'Light',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '—',
    weight: '2 lb.', damageType: 'Bludgeoning',
    special: 'monk, disarm',
  },
  {
    name: 'Sai',
    proficiency: 'Exotic', handedness: 'Light',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '×2', rangeIncrement: '10 ft.',
    weight: '1 lb.', damageType: 'Bludgeoning',
    special: 'monk, disarm',
  },
  {
    name: 'Siangham',
    proficiency: 'Exotic', handedness: 'Light',
    damageMedium: '1d6', damageSmall: '1d4',
    critical: '×2', rangeIncrement: '—',
    weight: '1 lb.', damageType: 'Piercing',
    special: 'monk',
  },
  // Exotic One-Handed Melee
  {
    name: 'Sword, Bastard',
    proficiency: 'Exotic', handedness: 'One-Handed',
    damageMedium: '1d10', damageSmall: '1d8',
    critical: '19-20/×2', rangeIncrement: '—',
    weight: '6 lb.', damageType: 'Slashing',
    special: 'two-handed as martial weapon',
  },
  {
    name: 'Waraxe, Dwarven',
    proficiency: 'Exotic', handedness: 'One-Handed',
    damageMedium: '1d10', damageSmall: '1d8',
    critical: '×3', rangeIncrement: '—',
    weight: '8 lb.', damageType: 'Slashing',
    special: 'two-handed as martial; dwarves treat as martial',
  },
  {
    name: 'Whip',
    proficiency: 'Exotic', handedness: 'One-Handed',
    damageMedium: '1d3', damageSmall: '1d2',
    critical: '×2', rangeIncrement: '—',
    weight: '2 lb.', damageType: 'Slashing',
    special: 'nonlethal, reach 15 ft., disarm, trip; Weapon Finesse eligible',
  },
  // Exotic Two-Handed Melee
  {
    name: 'Axe, Orc Double',
    proficiency: 'Exotic', handedness: 'Two-Handed',
    damageMedium: '1d8/1d8', damageSmall: '1d6/1d6',
    critical: '×3', rangeIncrement: '—',
    weight: '15 lb.', damageType: 'Slashing',
    special: 'double',
  },
  {
    name: 'Chain, Spiked',
    proficiency: 'Exotic', handedness: 'Two-Handed',
    damageMedium: '2d4', damageSmall: '1d6',
    critical: '×2', rangeIncrement: '—',
    weight: '10 lb.', damageType: 'Piercing',
    special: 'reach, disarm, trip; Weapon Finesse eligible',
  },
  {
    name: 'Flail, Dire',
    proficiency: 'Exotic', handedness: 'Two-Handed',
    damageMedium: '1d8/1d8', damageSmall: '1d6/1d6',
    critical: '×2', rangeIncrement: '—',
    weight: '10 lb.', damageType: 'Bludgeoning',
    special: 'double, disarm, trip',
  },
  {
    name: 'Hammer, Gnome Hooked',
    proficiency: 'Exotic', handedness: 'Two-Handed',
    damageMedium: '1d8/1d6', damageSmall: '1d6/1d4',
    critical: '×3/×4', rangeIncrement: '—',
    weight: '6 lb.', damageType: 'Bludgeoning/Piercing',
    special: 'double, trip; gnomes treat as martial',
  },
  {
    name: 'Sword, Two-Bladed',
    proficiency: 'Exotic', handedness: 'Two-Handed',
    damageMedium: '1d8/1d8', damageSmall: '1d6/1d6',
    critical: '19-20/×2', rangeIncrement: '—',
    weight: '10 lb.', damageType: 'Slashing',
    special: 'double',
  },
  {
    name: 'Urgrosh, Dwarven',
    proficiency: 'Exotic', handedness: 'Two-Handed',
    damageMedium: '1d8/1d6', damageSmall: '1d6/1d4',
    critical: '×3', rangeIncrement: '—',
    weight: '12 lb.', damageType: 'Slashing or piercing',
    special: 'double; dwarves treat as martial',
  },
  // Exotic Ranged
  {
    name: 'Bolas',
    proficiency: 'Exotic', handedness: 'One-Handed',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '×2', rangeIncrement: '10 ft.',
    weight: '2 lb.', damageType: 'Bludgeoning',
    special: 'nonlethal, trip',
  },
  {
    name: 'Crossbow, Hand',
    proficiency: 'Exotic', handedness: 'One-Handed',
    damageMedium: '1d4', damageSmall: '1d3',
    critical: '19-20/×2', rangeIncrement: '30 ft.',
    weight: '2 lb.', damageType: 'Piercing',
  },
  {
    name: 'Crossbow, Repeating Heavy',
    proficiency: 'Exotic', handedness: 'Two-Handed',
    damageMedium: '1d10', damageSmall: '1d8',
    critical: '19-20/×2', rangeIncrement: '120 ft.',
    weight: '12 lb.', damageType: 'Piercing',
  },
  {
    name: 'Crossbow, Repeating Light',
    proficiency: 'Exotic', handedness: 'Two-Handed',
    damageMedium: '1d8', damageSmall: '1d6',
    critical: '19-20/×2', rangeIncrement: '80 ft.',
    weight: '6 lb.', damageType: 'Piercing',
  },
  {
    name: 'Net',
    proficiency: 'Exotic', handedness: 'Two-Handed',
    damageMedium: '—', damageSmall: '—',
    critical: '—', rangeIncrement: '10 ft.',
    weight: '6 lb.', damageType: '—',
    special: 'entangle',
  },
  {
    name: 'Shuriken',
    proficiency: 'Exotic', handedness: 'Light',
    damageMedium: '1d2', damageSmall: '1',
    critical: '×2', rangeIncrement: '10 ft.',
    weight: '½ lb. (5)', damageType: 'Piercing',
    special: 'monk; treated as ammunition',
  },
] as const;

export const WEAPON_BY_NAME = new Map<string, WeaponCatalogEntry>(
  WEAPON_CATALOG.map((w) => [w.name, w]),
);
