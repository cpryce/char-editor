/**
 * D&D 3.5 SRD feat catalog.
 * Source: https://www.d20srd.org/srd/feats.htm
 *
 * featTypes describes the feat's descriptor(s):
 *   'General'          – no special acquisition rules; available to any character
 *   'Fighter Bonus Feat' – eligible for a fighter's or fighter-level bonus feat slot
 *   'Metamagic'        – [Metamagic]; eligible as a wizard bonus feat
 *   'Item Creation'    – [Item Creation]; eligible as a wizard bonus feat
 *   'Special'          – unique acquisition rules (e.g. Spell Mastery)
 *
 * A feat can appear in multiple categories (e.g. Power Attack is both
 * 'General' and 'Fighter Bonus Feat').
 */

export type FeatCategory =
  | 'General'
  | 'Fighter Bonus Feat'
  | 'Item Creation'
  | 'Metamagic'
  | 'Special';

export interface FeatCatalogEntry {
  name: string;
  featTypes: ReadonlyArray<FeatCategory>;
  prerequisites: string;
  shortDescription: string;
  /**
   * True when the SRD explicitly allows this feat to be taken more than once
   * (each time applying to a different weapon, school, skill, etc.).
   */
  repeatable?: true;
}

// ── Catalog ───────────────────────────────────────────────────────────────────
// Sorted alphabetically. Keep entries grouped by category for readability.

export const ALL_FEATS: ReadonlyArray<FeatCatalogEntry> = [

  // ── General (no special descriptor) ──────────────────────────────────────

  {
    name: 'Acrobatic',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Jump and Tumble checks.',
  },
  {
    name: 'Agile',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Balance and Escape Artist checks.',
  },
  {
    name: 'Alertness',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Listen and Spot checks.',
  },
  {
    name: 'Animal Affinity',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Handle Animal and Ride checks.',
  },
  {
    name: 'Athletic',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Climb and Swim checks.',
  },
  {
    name: 'Augment Summoning',
    featTypes: ['General'],
    prerequisites: 'Spell Focus (conjuration)',
    shortDescription: 'Summoned creatures gain +4 Str and +4 Con.',
  },
  {
    name: 'Combat Casting',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+4 Concentration when casting defensively or while grappled.',
  },
  {
    name: 'Deceitful',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Disguise and Forgery checks.',
  },
  {
    name: 'Deft Hands',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Sleight of Hand and Use Rope checks.',
  },
  {
    name: 'Diehard',
    featTypes: ['General'],
    prerequisites: 'Endurance',
    shortDescription: 'Remain conscious and keep fighting between −1 and −9 hp.',
  },
  {
    name: 'Diligent',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Appraise and Decipher Script checks.',
  },
  {
    name: 'Endurance',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+4 on checks involving prolonged physical action.',
  },
  {
    name: 'Eschew Materials',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: 'Cast spells without material components costing up to 1 gp.',
  },
  {
    name: 'Extra Turning',
    featTypes: ['General'],
    prerequisites: 'Ability to turn or rebuke undead',
    shortDescription: '+4 turning attempts per day.',
  },
  {
    name: 'Great Fortitude',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Fortitude saving throws.',
  },
  {
    name: 'Greater Spell Focus',
    featTypes: ['General'],
    prerequisites: 'Spell Focus (chosen school)',
    shortDescription: '+1 more to spell DC for the chosen school (stacks with Spell Focus).',
    repeatable: true,
  },
  {
    name: 'Greater Spell Penetration',
    featTypes: ['General'],
    prerequisites: 'Spell Penetration',
    shortDescription: '+2 more on caster level checks to overcome spell resistance.',
  },
  {
    name: 'Improved Familiar',
    featTypes: ['General'],
    prerequisites: 'Able to acquire a familiar',
    shortDescription: 'Gain a more powerful familiar (imp, pseudodragon, etc.).',
  },
  {
    name: 'Investigator',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Gather Information and Search checks.',
  },
  {
    name: 'Iron Will',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Will saving throws.',
  },
  {
    name: 'Leadership',
    featTypes: ['General'],
    prerequisites: 'Character level 6',
    shortDescription: 'Attract followers and a cohort based on a Leadership score.',
  },
  {
    name: 'Lightning Reflexes',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Reflex saving throws.',
  },
  {
    name: 'Magical Aptitude',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Spellcraft and Use Magic Device checks.',
  },
  {
    name: 'Natural Spell',
    featTypes: ['General'],
    prerequisites: 'Wis 13, wild shape',
    shortDescription: 'Cast spells while in wild shape form.',
  },
  {
    name: 'Negotiator',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Diplomacy and Sense Motive checks.',
  },
  {
    name: 'Nimble Fingers',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Disable Device and Open Lock checks.',
  },
  {
    name: 'Persuasive',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Bluff and Intimidate checks.',
  },
  {
    name: 'Run',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: 'Run at ×5 speed; retain Dex bonus to AC while running.',
  },
  {
    name: 'Self-Sufficient',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Heal and Survival checks.',
  },
  {
    name: 'Skill Focus',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+3 on checks with the chosen skill.',
    repeatable: true,
  },
  {
    name: 'Spell Focus',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+1 to spell DC for all spells of the chosen school.',
    repeatable: true,
  },
  {
    name: 'Spell Penetration',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on caster level checks to overcome spell resistance.',
  },
  {
    name: 'Stealthy',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+2 on Hide and Move Silently checks.',
  },
  {
    name: 'Toughness',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: '+3 hit points.',
    repeatable: true,
  },
  {
    name: 'Track',
    featTypes: ['General'],
    prerequisites: '—',
    shortDescription: 'Use Survival to track creatures.',
  },

  // ── General + Fighter Bonus Feat ──────────────────────────────────────────

  {
    name: 'Armor Proficiency (Heavy)',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Armor Proficiency (Medium)',
    shortDescription: 'Wear heavy armor without the armor check penalty on attack rolls.',
  },
  {
    name: 'Armor Proficiency (Light)',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: '—',
    shortDescription: 'Wear light armor without the armor check penalty on attack rolls.',
  },
  {
    name: 'Armor Proficiency (Medium)',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Armor Proficiency (Light)',
    shortDescription: 'Wear medium armor without the armor check penalty on attack rolls.',
  },
  {
    name: 'Blind-Fight',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: '—',
    shortDescription: 'Reroll miss chance for concealment once; no penalty for fighting invisible foes.',
  },
  {
    name: 'Cleave',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Str 13, Power Attack',
    shortDescription: 'After dropping a foe, make one immediate extra melee attack.',
  },
  {
    name: 'Combat Expertise',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Int 13',
    shortDescription: 'Trade attack bonus for a dodge bonus to AC (up to −5/+5).',
  },
  {
    name: 'Combat Reflexes',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: '—',
    shortDescription: 'Make up to Dex modifier additional attacks of opportunity per round.',
  },
  {
    name: 'Deflect Arrows',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 13, Improved Unarmed Strike',
    shortDescription: 'Deflect one ranged attack per round as an immediate action.',
  },
  {
    name: 'Dodge',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 13',
    shortDescription: '+1 dodge bonus to AC against one designated opponent.',
  },
  {
    name: 'Exotic Weapon Proficiency',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'BAB +1',
    shortDescription: 'Proficiency with one exotic weapon of choice.',
    repeatable: true,
  },
  {
    name: 'Far Shot',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Point Blank Shot',
    shortDescription: 'Increase range increments by 50% (×2 for thrown weapons).',
  },
  {
    name: 'Great Cleave',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Str 13, Power Attack, Cleave, BAB +4',
    shortDescription: 'Unlimited Cleave attacks per round (no limit on extra attacks).',
  },
  {
    name: 'Greater Two-Weapon Fighting',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 19, Two-Weapon Fighting, Improved Two-Weapon Fighting, BAB +11',
    shortDescription: 'Gain a third attack with the off-hand weapon at −10.',
  },
  {
    name: 'Greater Weapon Focus',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Weapon Focus (chosen weapon), Fighter level 8',
    shortDescription: '+1 additional attack bonus with the chosen weapon (stacks with Weapon Focus).',
    repeatable: true,
  },
  {
    name: 'Greater Weapon Specialization',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Greater Weapon Focus, Weapon Specialization (chosen weapon), Fighter level 12',
    shortDescription: '+2 additional damage with the chosen weapon (stacks with Weapon Specialization).',
    repeatable: true,
  },
  {
    name: 'Improved Bull Rush',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Str 13, Power Attack',
    shortDescription: 'Bull rush without provoking AoO; +4 bonus on bull rush attempts.',
  },
  {
    name: 'Improved Critical',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Proficiency with weapon, BAB +8',
    shortDescription: 'Double the threat range of the chosen weapon.',
    repeatable: true,
  },
  {
    name: 'Improved Disarm',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Int 13, Combat Expertise',
    shortDescription: 'Disarm without provoking AoO; +4 bonus on disarm attempts.',
  },
  {
    name: 'Improved Feint',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Int 13, Combat Expertise',
    shortDescription: 'Feint as a move action instead of a standard action.',
  },
  {
    name: 'Improved Grapple',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 13, Improved Unarmed Strike',
    shortDescription: 'Initiate grapple without provoking AoO; +4 bonus on grapple checks.',
  },
  {
    name: 'Improved Initiative',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: '—',
    shortDescription: '+4 bonus on initiative checks.',
  },
  {
    name: 'Improved Overrun',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Str 13, Power Attack',
    shortDescription: 'Overrun without provoking AoO; target cannot choose to avoid.',
  },
  {
    name: 'Improved Precise Shot',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 19, Point Blank Shot, Precise Shot, BAB +11',
    shortDescription: 'Ignore anything less than total cover or total concealment on ranged attacks.',
  },
  {
    name: 'Improved Shield Bash',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Shield Proficiency',
    shortDescription: 'Shield bash without losing your shield bonus to AC.',
  },
  {
    name: 'Improved Sunder',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Str 13, Power Attack',
    shortDescription: 'Sunder without provoking AoO; +4 bonus on sunder attempts.',
  },
  {
    name: 'Improved Trip',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Int 13, Combat Expertise',
    shortDescription: 'Trip without provoking AoO; +4 bonus; get immediate attack on tripped foe.',
  },
  {
    name: 'Improved Two-Weapon Fighting',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 17, Two-Weapon Fighting, BAB +6',
    shortDescription: 'Gain a second off-hand attack at −5.',
  },
  {
    name: 'Improved Unarmed Strike',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: '—',
    shortDescription: 'Unarmed attacks don\'t provoke AoO; can deal lethal or nonlethal damage.',
  },
  {
    name: 'Manyshot',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 17, Point Blank Shot, Rapid Shot, BAB +6',
    shortDescription: 'Fire two or more arrows as a single attack action.',
  },
  {
    name: 'Martial Weapon Proficiency',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: '—',
    shortDescription: 'Proficiency with one martial weapon of choice.',
    repeatable: true,
  },
  {
    name: 'Mobility',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 13, Dodge',
    shortDescription: '+4 AC against attacks of opportunity from moving out of threatened squares.',
  },
  {
    name: 'Mounted Archery',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Mounted Combat',
    shortDescription: 'Halve the penalty for shooting from a moving mount.',
  },
  {
    name: 'Mounted Combat',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Ride 1 rank',
    shortDescription: 'Once per round, negate a hit on your mount with a Ride check.',
  },
  {
    name: 'Point Blank Shot',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: '—',
    shortDescription: '+1 attack and damage on ranged attacks against targets within 30 feet.',
  },
  {
    name: 'Power Attack',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Str 13',
    shortDescription: 'Trade attack bonus for damage bonus (1-for-1; 1-for-2 with two-handed weapons).',
  },
  {
    name: 'Precise Shot',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Point Blank Shot',
    shortDescription: 'Shoot or throw into melee without the standard −4 penalty.',
  },
  {
    name: 'Quick Draw',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'BAB +1',
    shortDescription: 'Draw a weapon as a free action.',
  },
  {
    name: 'Rapid Reload',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Proficiency with crossbow type',
    shortDescription: 'Reload a crossbow faster (light: free action; heavy: move action).',
    repeatable: true,
  },
  {
    name: 'Rapid Shot',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 13, Point Blank Shot',
    shortDescription: 'One extra ranged attack per round at a −2 penalty on all ranged attacks.',
  },
  {
    name: 'Ride-By Attack',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Mounted Combat',
    shortDescription: 'Move before and after a mounted charge attack.',
  },
  {
    name: 'Shield Proficiency',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: '—',
    shortDescription: 'Use a shield without the armor check penalty on attack rolls.',
  },
  {
    name: 'Shot on the Run',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 13, Dodge, Mobility, Point Blank Shot, BAB +4',
    shortDescription: 'Move, make a ranged attack, then continue moving (as Spring Attack).',
  },
  {
    name: 'Simple Weapon Proficiency',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: '—',
    shortDescription: 'Proficiency with all simple weapons.',
  },
  {
    name: 'Snatch Arrows',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 15, Deflect Arrows, Improved Unarmed Strike',
    shortDescription: 'Catch projectiles deflected by Deflect Arrows and use them as weapons.',
  },
  {
    name: 'Spirited Charge',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Mounted Combat, Ride-By Attack',
    shortDescription: 'Double damage on a mounted charge (triple with a lance).',
  },
  {
    name: 'Spring Attack',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 13, Dodge, Mobility, BAB +4',
    shortDescription: 'Move, make a melee attack, then continue moving — attack does not provoke AoO.',
  },
  {
    name: 'Stunning Fist',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 13, Wis 13, Improved Unarmed Strike, BAB +8',
    shortDescription: 'Force a foe to make a Fort save or be stunned for 1 round on a successful hit.',
  },
  {
    name: 'Tower Shield Proficiency',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Shield Proficiency',
    shortDescription: 'Use a tower shield without the −2 attack penalty.',
  },
  {
    name: 'Trample',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Mounted Combat',
    shortDescription: 'Mounted overrun attempt cannot be avoided; mount may make hoof attacks.',
  },
  {
    name: 'Two-Weapon Defense',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Two-Weapon Fighting',
    shortDescription: '+1 shield bonus to AC while wielding two weapons (+2 when fighting defensively).',
  },
  {
    name: 'Two-Weapon Fighting',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Dex 15',
    shortDescription: 'Reduce the penalties for fighting with two weapons by 2.',
  },
  {
    name: 'Weapon Finesse',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'BAB +1',
    shortDescription: 'Use Dex modifier instead of Str for attack rolls with light melee weapons.',
  },
  {
    name: 'Weapon Focus',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Proficiency with weapon, BAB +1',
    shortDescription: '+1 attack bonus with the chosen weapon.',
    repeatable: true,
  },
  {
    name: 'Weapon Specialization',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Weapon Focus (chosen weapon), Fighter level 4',
    shortDescription: '+2 damage with the chosen weapon.',
    repeatable: true,
  },
  {
    name: 'Whirlwind Attack',
    featTypes: ['General', 'Fighter Bonus Feat'],
    prerequisites: 'Int 13, Dex 13, Combat Expertise, Dodge, Mobility, Spring Attack, BAB +4',
    shortDescription: 'Full-attack action: make one melee attack against every adjacent foe.',
  },

  // ── Metamagic ─────────────────────────────────────────────────────────────

  {
    name: 'Empower Spell',
    featTypes: ['Metamagic'],
    prerequisites: '—',
    shortDescription: 'Increase all numeric variable effects of a spell by 50%. +2 spell levels.',
  },
  {
    name: 'Enlarge Spell',
    featTypes: ['Metamagic'],
    prerequisites: '—',
    shortDescription: 'Double the range of a spell. +1 spell level.',
  },
  {
    name: 'Extend Spell',
    featTypes: ['Metamagic'],
    prerequisites: '—',
    shortDescription: 'Double the duration of a spell. +1 spell level.',
  },
  {
    name: 'Heighten Spell',
    featTypes: ['Metamagic'],
    prerequisites: '—',
    shortDescription: 'Cast a spell as if it were a higher-level spell for all purposes.',
  },
  {
    name: 'Maximize Spell',
    featTypes: ['Metamagic'],
    prerequisites: '—',
    shortDescription: 'Maximize all numeric variable effects of a spell. +3 spell levels.',
  },
  {
    name: 'Quicken Spell',
    featTypes: ['Metamagic'],
    prerequisites: '—',
    shortDescription: 'Cast a spell as a swift action once per round. +4 spell levels.',
  },
  {
    name: 'Silent Spell',
    featTypes: ['Metamagic'],
    prerequisites: '—',
    shortDescription: 'Cast a spell without verbal components. +1 spell level.',
  },
  {
    name: 'Still Spell',
    featTypes: ['Metamagic'],
    prerequisites: '—',
    shortDescription: 'Cast a spell without somatic components. +1 spell level.',
  },
  {
    name: 'Widen Spell',
    featTypes: ['Metamagic'],
    prerequisites: '—',
    shortDescription: 'Double the radius of a burst, emanation, or spread. +3 spell levels.',
  },

  // ── Item Creation ─────────────────────────────────────────────────────────

  {
    name: 'Brew Potion',
    featTypes: ['Item Creation'],
    prerequisites: 'Caster level 3',
    shortDescription: 'Create potions of spells you know of up to 3rd level.',
  },
  {
    name: 'Craft Magic Arms and Armor',
    featTypes: ['Item Creation'],
    prerequisites: 'Caster level 5',
    shortDescription: 'Craft magic weapons, armor, and shields.',
  },
  {
    name: 'Craft Rod',
    featTypes: ['Item Creation'],
    prerequisites: 'Caster level 9',
    shortDescription: 'Craft magic rods.',
  },
  {
    name: 'Craft Staff',
    featTypes: ['Item Creation'],
    prerequisites: 'Caster level 12',
    shortDescription: 'Craft magic staves.',
  },
  {
    name: 'Craft Wand',
    featTypes: ['Item Creation'],
    prerequisites: 'Caster level 5',
    shortDescription: 'Craft wands containing spells of up to 4th level.',
  },
  {
    name: 'Craft Wondrous Item',
    featTypes: ['Item Creation'],
    prerequisites: 'Caster level 3',
    shortDescription: 'Craft miscellaneous magic items.',
  },
  {
    name: 'Forge Ring',
    featTypes: ['Item Creation'],
    prerequisites: 'Caster level 12',
    shortDescription: 'Craft magic rings.',
  },
  {
    name: 'Scribe Scroll',
    featTypes: ['Item Creation'],
    prerequisites: 'Caster level 1',
    shortDescription: 'Inscribe a spell you know onto a scroll.',
  },

  // ── Special ───────────────────────────────────────────────────────────────

  {
    name: 'Spell Mastery',
    featTypes: ['Special'],
    prerequisites: 'Wizard level 1',
    shortDescription: 'Prepare a number of spells equal to Int modifier without your spellbook.',
    repeatable: true,
  },
];

// ── Lookup helpers ────────────────────────────────────────────────────────────

/** O(1) lookup by exact feat name. */
export const FEAT_BY_NAME: ReadonlyMap<string, FeatCatalogEntry> = new Map(
  ALL_FEATS.map((f) => [f.name, f]),
);
