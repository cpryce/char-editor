import type { ClassName } from '../types/character';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClassFeatureInfo {
  /** Unique within the class, e.g. 'rage', 'uncanny-dodge' */
  id: string;
  name: string;
  /** Minimum class level at which this feature is gained */
  minLevel: number;
  /** 1–2 sentence display summary */
  shortDescription: string;
  /** Full mechanical description shown in hover tooltip */
  fullDescription: string;
}

export interface DerivedClassFeature extends ClassFeatureInfo {
  className: ClassName;
}

// ── Catalog ───────────────────────────────────────────────────────────────────

const CATALOG: Partial<Record<ClassName, ReadonlyArray<ClassFeatureInfo>>> = {

  // ── Barbarian ──────────────────────────────────────────────────────────────
  Barbarian: [
    {
      id: 'weapon-armor-proficiency',
      name: 'Weapon & Armor Proficiency',
      minLevel: 1,
      shortDescription: 'All simple and martial weapons; light and medium armor; shields (not tower shields).',
      fullDescription:
        'A barbarian is proficient with all simple and martial weapons, light armor, medium armor, and shields (except tower shields).',
    },
    {
      id: 'fast-movement',
      name: 'Fast Movement (Ex)',
      minLevel: 1,
      shortDescription: '+10 ft. land speed when wearing no, light, or medium armor without a heavy load.',
      fullDescription:
        "A barbarian's land speed is faster than the norm for his race by +10 feet. This benefit applies only when he is wearing no armor, light armor, or medium armor and not carrying a heavy load. Apply this bonus before modifying the barbarian's speed because of any load carried or armor worn.",
    },
    {
      id: 'illiteracy',
      name: 'Illiteracy',
      minLevel: 1,
      shortDescription: 'Cannot read or write without spending 2 skill points. Automatically gained if any other class level is taken.',
      fullDescription:
        'Barbarians are the only characters who do not automatically know how to read and write. A barbarian may spend 2 skill points to gain the ability to read and write all languages he is able to speak. A barbarian who gains a level in any other class automatically gains literacy.',
    },
    {
      id: 'rage',
      name: 'Rage (Ex)',
      minLevel: 1,
      shortDescription: '1/day at 1st level (+1 per 4 levels). +4 Str, +4 Con, +2 morale on Will saves, –2 AC for 3+Con modifier rounds. Fatigued afterward until 17th level.',
      fullDescription:
        'A barbarian can fly into a rage once per encounter. At 1st level he can use rage once per day; at 4th level and every four levels thereafter he can use it one additional time per day (max 6 at 20th). While raging he gains +4 Str, +4 Con, and a +2 morale bonus on Will saves, but –2 AC. The Constitution increase gives +2 hp per level; these disappear when rage ends. A rage lasts 3 + (improved) Con modifier rounds. At the end he is fatigued for the encounter (no longer applies at 17th level).',
    },
    {
      id: 'uncanny-dodge',
      name: 'Uncanny Dodge (Ex)',
      minLevel: 2,
      shortDescription: 'Retains Dex bonus to AC even when flat-footed or struck by an invisible attacker.',
      fullDescription:
        'At 2nd level, a barbarian retains his Dexterity bonus to AC (if any) even if caught flat-footed or struck by an invisible attacker. He still loses the bonus if immobilized. If a barbarian already has uncanny dodge from another class, he automatically gains improved uncanny dodge instead.',
    },
    {
      id: 'trap-sense',
      name: 'Trap Sense (Ex)',
      minLevel: 3,
      shortDescription: '+1 on Reflex saves and dodge bonus to AC vs. traps at 3rd level, increasing by +1 every 3 levels.',
      fullDescription:
        'Starting at 3rd level, a barbarian gains a +1 bonus on Reflex saves made to avoid traps and a +1 dodge bonus to AC against attacks made by traps. These bonuses rise by +1 every three barbarian levels (6th, 9th, 12th, 15th, 18th). Trap sense bonuses from multiple classes stack.',
    },
    {
      id: 'improved-uncanny-dodge',
      name: 'Improved Uncanny Dodge (Ex)',
      minLevel: 5,
      shortDescription: 'Cannot be flanked except by a rogue with 4+ more levels than the barbarian.',
      fullDescription:
        'At 5th level, a barbarian can no longer be flanked. A rogue must have at least four more rogue levels than the barbarian has barbarian levels to use flanking to sneak attack. If the character already has uncanny dodge from a second class, levels from those classes stack to determine the minimum rogue level needed.',
    },
    {
      id: 'damage-reduction',
      name: 'Damage Reduction (Ex)',
      minLevel: 7,
      shortDescription: 'DR 1/— at 7th level, increasing by 1 every 3 levels (max DR 5/— at 19th).',
      fullDescription:
        'At 7th level, a barbarian gains Damage Reduction. Subtract 1 from the damage he takes each time he is dealt damage from a weapon or natural attack. At 10th level and every three barbarian levels thereafter (13th, 16th, 19th) this DR rises by 1 point. Damage reduction can reduce damage to 0 but not below 0.',
    },
    {
      id: 'greater-rage',
      name: 'Greater Rage (Ex)',
      minLevel: 11,
      shortDescription: 'Rage bonuses increase to +6 Str/Con and +3 morale on Will saves.',
      fullDescription:
        "At 11th level, a barbarian's bonuses to Strength and Constitution during rage each increase to +6, and the morale bonus on Will saves increases to +3. The penalty to AC remains at –2.",
    },
    {
      id: 'indomitable-will',
      name: 'Indomitable Will (Ex)',
      minLevel: 14,
      shortDescription: 'While raging, +4 bonus on Will saves against enchantment spells.',
      fullDescription:
        'While in a rage, a barbarian of 14th level or higher gains a +4 bonus on Will saves to resist enchantment spells. This bonus stacks with all other modifiers, including the morale bonus on Will saves also received during rage.',
    },
    {
      id: 'tireless-rage',
      name: 'Tireless Rage (Ex)',
      minLevel: 17,
      shortDescription: 'No longer becomes fatigued at the end of a rage.',
      fullDescription:
        'At 17th level and higher, a barbarian no longer becomes fatigued at the end of his rage.',
    },
    {
      id: 'mighty-rage',
      name: 'Mighty Rage (Ex)',
      minLevel: 20,
      shortDescription: 'Rage bonuses increase to +8 Str/Con and +4 morale on Will saves.',
      fullDescription:
        "At 20th level, a barbarian's bonuses to Strength and Constitution during rage each increase to +8, and the morale bonus on Will saves increases to +4. The penalty to AC remains at –2.",
    },
  ],

  // ── Bard ───────────────────────────────────────────────────────────────────
  Bard: [
    {
      id: 'weapon-armor-proficiency',
      name: 'Weapon & Armor Proficiency',
      minLevel: 1,
      shortDescription: 'Simple weapons plus longsword, rapier, sap, short sword, shortbow, and whip; light armor and shields with no arcane spell failure.',
      fullDescription:
        'A bard is proficient with all simple weapons, plus the longsword, rapier, sap, short sword, shortbow, and whip. Bards are proficient with light armor and shields (except tower shields). A bard can cast bard spells while wearing light armor without incurring arcane spell failure.',
    },
    {
      id: 'spells',
      name: 'Spells',
      minLevel: 1,
      shortDescription: 'Casts arcane spells spontaneously from the bard spell list. Charisma-based. Limited spells known.',
      fullDescription:
        'A bard casts arcane spells drawn from the bard spell list without preparing them in advance. To cast a spell, the bard must have a Charisma score of at least 10 + spell level. Saving throw DC is 10 + spell level + Cha modifier. The bard begins knowing 4 0-level spells; he gains new spells at each level according to the bard spells known table. Starting at 5th level and every 3rd level, he may swap one known spell of the same level for another.',
    },
    {
      id: 'bardic-knowledge',
      name: 'Bardic Knowledge',
      minLevel: 1,
      shortDescription: 'Make a special knowledge check (bard level + Int modifier) to recall information about notable people, items, or places.',
      fullDescription:
        'A bard may make a bardic knowledge check with a bonus equal to his bard level + Intelligence modifier to see whether he knows some relevant information about local notable people, legendary items, or noteworthy places. DC 10 for common knowledge, up to DC 30 for extremely obscure facts. A bard may not take 10 or take 20 on this check. Knowledge (history) 5+ ranks grants a +2 bonus.',
    },
    {
      id: 'bardic-music',
      name: 'Bardic Music',
      minLevel: 1,
      shortDescription: 'Once per day per bard level, produce magical effects through song, music, or poetry. Standard action to activate.',
      fullDescription:
        'Once per day per bard level, a bard can use his song or poetics to produce magical effects. Abilities can be activated by reciting poetry, chanting, singing, whistling, or playing an instrument. Starting a bardic music effect is a standard action. Some abilities require concentration (standard action each round to maintain). A deaf bard has a 20% chance to fail when attempting to use bardic music.',
    },
    {
      id: 'countersong',
      name: 'Countersong (Su)',
      minLevel: 1,
      shortDescription: 'Use Perform check to counter sonic or language-dependent magical effects within 30 ft. for up to 10 rounds.',
      fullDescription:
        'Requires 3+ ranks in a Perform skill. Each round the bard makes a Perform check. Any creature within 30 feet affected by a sonic or language-dependent magical attack may use the bard\'s Perform check result in place of its saving throw if the Perform result is higher. The bard may keep up the countersong for 10 rounds.',
    },
    {
      id: 'fascinate',
      name: 'Fascinate (Sp)',
      minLevel: 1,
      shortDescription: 'Cause up to 1 creature per 3 bard levels within 90 ft. to become fascinated. Will DC = Perform check result.',
      fullDescription:
        'Requires 3+ ranks in a Perform skill. Each creature to be fascinated must be within 90 feet, able to see and hear the bard, and able to pay attention to him. The bard makes a Perform check; that result is the DC for each creature\'s Will save. A fascinated target takes a –4 penalty on Spot and Listen checks as reactions, lasts for up to 1 round per bard level while the bard concentrates.',
    },
    {
      id: 'inspire-courage',
      name: 'Inspire Courage (Su)',
      minLevel: 1,
      shortDescription: '+1 morale bonus on saves vs. fear/charm and attack/damage rolls for allies who can hear the bard. Increases every 6 levels.',
      fullDescription:
        'Requires 3+ ranks in a Perform skill. An affected ally receives a +1 morale bonus on saving throws against charm and fear effects and a +1 morale bonus on attack and weapon damage rolls. At 8th level the bonus increases to +2, +3 at 14th, +4 at 20th. The effect lasts as long as the ally hears the bard sing and for 5 rounds thereafter.',
    },
    {
      id: 'inspire-competence',
      name: 'Inspire Competence (Su)',
      minLevel: 3,
      shortDescription: 'Grant an ally within 30 ft. a +2 competence bonus on one skill while the bard concentrates (up to 2 minutes).',
      fullDescription:
        'A bard of 3rd level or higher with 6+ ranks in a Perform skill can help an ally succeed at a task. The ally must be within 30 feet and able to see and hear the bard. The ally gains a +2 competence bonus on skill checks with a particular skill as long as they continue to hear the bard\'s music, up to 2 minutes. A bard can\'t inspire competence in himself. Inspire competence is mind-affecting.',
    },
    {
      id: 'suggestion',
      name: 'Suggestion (Sp)',
      minLevel: 6,
      shortDescription: 'Make a Suggestion (as the spell) to a creature already fascinated by the bard. Will save DC 10 + ½ level + Cha.',
      fullDescription:
        'A bard of 6th level or higher with 9+ ranks in a Perform skill can make a suggestion (as the spell) to a creature he has already fascinated, without breaking concentration on fascinate. Will saving throw DC 10 + ½ bard level + Cha modifier negates the effect. Suggestion is an enchantment (compulsion), mind-affecting, language-dependent ability affecting a single creature.',
    },
    {
      id: 'inspire-greatness',
      name: 'Inspire Greatness (Su)',
      minLevel: 9,
      shortDescription: 'Grant an ally 2 bonus d10 Hit Dice, +2 competence on attack rolls, and +1 Fort saves. +1 ally per 3 levels beyond 9th.',
      fullDescription:
        'A bard of 9th level or higher with 12+ ranks in a Perform skill can inspire greatness in himself or a single willing ally within 30 feet. A creature so inspired gains 2 bonus Hit Dice (d10s), the commensurate temporary hit points (with Con modifier), a +2 competence bonus on attack rolls, and a +1 competence bonus on Fortitude saves. The effect lasts as long as the ally hears the bard and for 5 rounds thereafter. For every 3 levels beyond 9th, one additional creature can be targeted.',
    },
    {
      id: 'song-of-freedom',
      name: 'Song of Freedom (Sp)',
      minLevel: 12,
      shortDescription: 'Break Enchantment effect (caster level = bard level) on a single target within 30 ft. Requires 1 minute of concentration.',
      fullDescription:
        "A bard of 12th level or higher with 15+ ranks in a Perform skill can use music or poetics to create an effect equivalent to the Break Enchantment spell (caster level = bard level). Using this ability requires 1 minute of uninterrupted concentration and music, and it functions on a single target within 30 feet. A bard can't use song of freedom on himself.",
    },
    {
      id: 'inspire-heroics',
      name: 'Inspire Heroics (Su)',
      minLevel: 15,
      shortDescription: 'Grant an ally +4 morale on saves and +4 dodge bonus to AC. +1 ally per 3 levels beyond 15th.',
      fullDescription:
        'A bard of 15th level or higher with 18+ ranks in a Perform skill can inspire tremendous heroism in himself or a single willing ally within 30 feet. The creature gains a +4 morale bonus on saving throws and a +4 dodge bonus to AC. An ally must hear the bard sing for a full round. The effect lasts as long as the ally hears the bard and for up to 5 rounds thereafter.',
    },
    {
      id: 'mass-suggestion',
      name: 'Mass Suggestion (Sp)',
      minLevel: 18,
      shortDescription: 'As Suggestion, but affects any number of creatures the bard has already fascinated simultaneously.',
      fullDescription:
        'A bard of 18th level or higher with 21+ ranks in a Perform skill can make a suggestion simultaneously to any number of creatures he has already fascinated. Mass suggestion is an enchantment (compulsion), mind-affecting, language-dependent ability.',
    },
  ],

  // ── Cleric ─────────────────────────────────────────────────────────────────
  Cleric: [
    {
      id: 'weapon-armor-proficiency',
      name: 'Weapon & Armor Proficiency',
      minLevel: 1,
      shortDescription: 'All simple weapons; all armor (light, medium, heavy); shields (not tower shields). War domain adds martial weapon and Weapon Focus.',
      fullDescription:
        "Clerics are proficient with all simple weapons, with all types of armor (light, medium, and heavy), and with shields (except tower shields). A cleric who chooses the War domain receives the Weapon Focus feat related to his deity's weapon as a bonus feat, plus the appropriate Martial Weapon Proficiency if applicable.",
    },
    {
      id: 'aura',
      name: 'Aura (Ex)',
      minLevel: 1,
      shortDescription: 'Emits a powerful alignment aura corresponding to the deity\'s alignment, detectable by alignment-detection spells.',
      fullDescription:
        "A cleric of a chaotic, evil, good, or lawful deity has a particularly powerful aura corresponding to the deity's alignment (see detect evil for details). Clerics who don't worship a specific deity but choose the Chaos, Evil, Good, or Law domain have a similarly powerful aura of the corresponding alignment.",
    },
    {
      id: 'spells',
      name: 'Spells',
      minLevel: 1,
      shortDescription: 'Prepares divine spells daily from the cleric list. Wisdom-based. Gains one domain spell per level from chosen domains.',
      fullDescription:
        "A cleric casts divine spells drawn from the cleric spell list and must prepare them in advance. To prepare or cast a spell, the cleric must have a Wisdom score of at least 10 + spell level. DC is 10 + spell level + Wis modifier. The cleric also gets one domain spell of each spell level he can cast. He must spend 1 hour each day in quiet contemplation to regain spells.",
    },
    {
      id: 'deity-domains',
      name: 'Deity, Domains, and Domain Spells',
      minLevel: 1,
      shortDescription: 'Choose 2 domains from deity\'s list, each granting access to domain spells and a granted power.',
      fullDescription:
        "A cleric chooses two domains from among those belonging to his deity. Each domain gives the cleric access to a domain spell at each spell level he can cast and a granted power. The cleric gets the granted powers of both domains. With access to two domain spells at a given spell level, a cleric prepares one or the other each day in his domain spell slot.",
    },
    {
      id: 'spontaneous-casting',
      name: 'Spontaneous Casting',
      minLevel: 1,
      shortDescription: 'Good clerics can lose a prepared spell to cast any cure spell of equal or lower level. Evil clerics can cast inflict spells instead.',
      fullDescription:
        "A good cleric (or neutral cleric of a good deity) can 'lose' any prepared non-domain spell to cast any cure spell of the same level or lower. An evil cleric (or neutral cleric of an evil deity) can convert to inflict spells instead. A neutral cleric of a neutral deity chooses one option permanently. This choice also determines turn/rebuke undead.",
    },
    {
      id: 'turn-rebuke-undead',
      name: 'Turn or Rebuke Undead (Su)',
      minLevel: 1,
      shortDescription: '3 + Cha modifier times per day. Good clerics turn/destroy undead; evil clerics rebuke/command them.',
      fullDescription:
        "Any cleric can affect undead creatures by channeling faith through a holy (or unholy) symbol. A good cleric (or neutral cleric of a good deity) can turn or destroy undead. An evil cleric (or neutral cleric of an evil deity) rebukes or commands undead. A neutral cleric of a neutral deity chooses once, irreversibly. The cleric may attempt this a number of times per day equal to 3 + Cha modifier. Knowledge (religion) 5+ ranks grants a +2 bonus on turning checks.",
    },
  ],

  // ── Druid ──────────────────────────────────────────────────────────────────
  Druid: [
    {
      id: 'weapon-armor-proficiency',
      name: 'Weapon & Armor Proficiency',
      minLevel: 1,
      shortDescription: 'Club, dagger, dart, quarterstaff, scimitar, sickle, sling, spear; light/medium nonmetal armor; nonmetal shields. Loses abilities while wearing prohibited armor.',
      fullDescription:
        "Druids are proficient with club, dagger, dart, quarterstaff, scimitar, sickle, shortspear, sling, and spear, and with all natural attacks of any wild shape form. Druids are proficient with light and medium armor but cannot wear metal armor; they may wear padded, leather, or hide armor. They may use wooden shields (not tower shields). A druid who wears prohibited armor or shield cannot cast druid spells or use supernatural/spell-like class abilities for 24 hours.",
    },
    {
      id: 'spells',
      name: 'Spells',
      minLevel: 1,
      shortDescription: 'Prepares divine spells daily from the druid list. Wisdom-based.',
      fullDescription:
        "A druid casts divine spells drawn from the druid spell list, prepared daily by meditating. To prepare or cast a spell the druid must have a Wisdom score of at least 10 + spell level. DC is 10 + spell level + Wis modifier. A druid may prepare and cast any spell on the druid spell list, provided she can cast spells of that level.",
    },
    {
      id: 'spontaneous-casting',
      name: 'Spontaneous Casting',
      minLevel: 1,
      shortDescription: 'Can lose a prepared spell to cast any Summon Nature\'s Ally spell of the same level or lower.',
      fullDescription:
        "A druid can channel stored spell energy into summoning spells she hasn't prepared. She can 'lose' a prepared spell to cast any summon nature's ally spell of the same level or lower.",
    },
    {
      id: 'bonus-languages',
      name: 'Bonus Languages',
      minLevel: 1,
      shortDescription: 'Automatically knows Druidic (secret language). May choose Sylvan as bonus language.',
      fullDescription:
        "A druid knows Druidic, a secret language known only to druids, learned upon becoming 1st level. It is free (doesn't use a language slot) and druids are forbidden to teach it to nondruids. The druid's bonus language options also include Sylvan.",
    },
    {
      id: 'animal-companion',
      name: 'Animal Companion (Ex)',
      minLevel: 1,
      shortDescription: 'Begins play with an animal companion that grows in power with druid level, gaining bonus HD, natural armor, ability adjustments, and special abilities.',
      fullDescription:
        "A druid begins play with an animal companion selected from a standard list (badger, camel, dire rat, dog, etc.). As the druid advances in level, the animal's power increases (bonus HD, natural armor, Str/Dex adjustments, bonus tricks, and special abilities like link, share spells, evasion, devotion, multiattack, improved evasion). A druid of 4th level or higher can select from alternative lists at a level penalty. If released, a new companion can be obtained via a 24-hour ceremony.",
    },
    {
      id: 'nature-sense',
      name: 'Nature Sense (Ex)',
      minLevel: 1,
      shortDescription: '+2 bonus on Knowledge (nature) and Survival checks.',
      fullDescription:
        'A druid gains a +2 bonus on Knowledge (nature) and Survival checks.',
    },
    {
      id: 'wild-empathy',
      name: 'Wild Empathy (Ex)',
      minLevel: 1,
      shortDescription: 'Improve an animal\'s attitude with a 1d20 + druid level + Cha modifier check, like a Diplomacy check for a person.',
      fullDescription:
        "A druid can improve the attitude of an animal (functions like a Diplomacy check). She rolls 1d20 + druid level + Cha modifier. The druid and the animal must be within 30 feet and able to study each other; this generally takes 1 minute. She can also influence a magical beast with Intelligence 1 or 2 at a –4 penalty.",
    },
    {
      id: 'woodland-stride',
      name: 'Woodland Stride (Ex)',
      minLevel: 2,
      shortDescription: 'Move through natural undergrowth at normal speed without damage or impairment.',
      fullDescription:
        'Starting at 2nd level, a druid may move through any sort of undergrowth (natural thorns, briars, overgrown areas) at her normal speed without taking damage or suffering any other impairment. Magically manipulated terrain still affects her.',
    },
    {
      id: 'trackless-step',
      name: 'Trackless Step (Ex)',
      minLevel: 3,
      shortDescription: 'Leaves no trail in natural terrain and cannot be tracked (unless she chooses to).',
      fullDescription:
        'Starting at 3rd level, a druid leaves no trail in natural surroundings and cannot be tracked. She may choose to leave a trail if so desired.',
    },
    {
      id: 'resist-natures-lure',
      name: "Resist Nature's Lure (Ex)",
      minLevel: 4,
      shortDescription: '+4 bonus on saving throws against spell-like abilities of fey.',
      fullDescription:
        "Starting at 4th level, a druid gains a +4 bonus on saving throws against the spell-like abilities of fey.",
    },
    {
      id: 'wild-shape',
      name: 'Wild Shape (Su)',
      minLevel: 5,
      shortDescription: 'Transform into animal forms. 1/day at 5th, increasing to 6/day at 18th. Unlocks larger sizes and plant/elemental forms at higher levels.',
      fullDescription:
        "At 5th level a druid gains Wild Shape: transform into any Small or Medium animal and back once per day. The effect lasts 1 hour per druid level. Changing form is a standard action and doesn't provoke AoO. The druid regains lost hit points as if resting overnight each time she uses wild shape. Additional uses per day: 2/day (6th), 3/day (7th), 4/day (10th), 5/day (14th), 6/day (18th). Larger forms: Large (8th), Tiny (11th), Huge (15th). Plant forms (12th). Elemental forms: once/day (16th), twice/day (18th), three times/day as Huge elemental (20th).",
    },
    {
      id: 'venom-immunity',
      name: 'Venom Immunity (Ex)',
      minLevel: 9,
      shortDescription: 'Immune to all poisons.',
      fullDescription:
        'At 9th level, a druid gains immunity to all poisons.',
    },
    {
      id: 'thousand-faces',
      name: 'A Thousand Faces (Su)',
      minLevel: 13,
      shortDescription: 'Change appearance at will (as Disguise Self) while in normal form. A minor physical alteration, not an illusion.',
      fullDescription:
        "At 13th level, a druid gains the ability to change her appearance at will as if using the Disguise Self spell, but only while in her normal form. This affects the druid's body but not her possessions. It is not an illusory effect but a minor physical alteration within the limits of that spell.",
    },
    {
      id: 'timeless-body',
      name: 'Timeless Body (Ex)',
      minLevel: 15,
      shortDescription: 'No longer takes ability score penalties for aging and cannot be magically aged.',
      fullDescription:
        'After attaining 15th level, a druid no longer takes ability score penalties for aging and cannot be magically aged. Any penalties already incurred remain in place. Bonuses still accrue, and the druid still dies of old age when her time is up.',
    },
  ],

  // ── Fighter ────────────────────────────────────────────────────────────────
  Fighter: [
    {
      id: 'weapon-armor-proficiency',
      name: 'Weapon & Armor Proficiency',
      minLevel: 1,
      shortDescription: 'All simple and martial weapons; all armor (including heavy); all shields (including tower shields).',
      fullDescription:
        'A fighter is proficient with all simple and martial weapons and with all armor (heavy, medium, and light) and shields (including tower shields).',
    },
    {
      id: 'bonus-feats',
      name: 'Bonus Feats',
      minLevel: 1,
      shortDescription: 'Bonus combat feat at 1st level and every two levels thereafter (2nd, 4th, 6th…). Must be from the fighter bonus feats list, but prerequisites still apply.',
      fullDescription:
        'At 1st level, a fighter gets a bonus combat-oriented feat in addition to the normal 1st-level feat (and any human bonus feat). He gains an additional bonus feat at 2nd level and every two fighter levels thereafter (4th, 6th, 8th…, 20th). These bonus feats must be drawn from the list of fighter bonus feats. The fighter must still meet all prerequisites. These bonus feats are in addition to the feat any character gains from advancing levels.',
    },
  ],

  // ── Monk ───────────────────────────────────────────────────────────────────
  Monk: [
    {
      id: 'weapon-proficiency',
      name: 'Weapon Proficiency',
      minLevel: 1,
      shortDescription: 'Club, crossbow (light/heavy), dagger, handaxe, javelin, kama, nunchaku, quarterstaff, sai, shuriken, siangham, sling. No armor or shields.',
      fullDescription:
        "Monks are proficient with club, crossbow (light or heavy), dagger, handaxe, javelin, kama, nunchaku, quarterstaff, sai, shuriken, siangham, and sling. Monks are not proficient with any armor or shields. When wearing armor, using a shield, or carrying a medium or heavy load, a monk loses her AC bonus, fast movement, and flurry of blows abilities.",
    },
    {
      id: 'ac-bonus',
      name: 'AC Bonus (Ex)',
      minLevel: 1,
      shortDescription: 'Add Wis bonus to AC when unarmored. +1 bonus to AC at 5th level, +1 every 5 levels. Applies vs. touch attacks and when flat-footed.',
      fullDescription:
        "When unarmored and unencumbered, the monk adds her Wisdom bonus (if any) to her AC. She also gains a +1 bonus to AC at 5th level, increasing by 1 every five monk levels (+2 at 10th, +3 at 15th, +4 at 20th). These bonuses apply even against touch attacks and when flat-footed. She loses them when immobilized, helpless, wearing armor, carrying a shield, or carrying a medium or heavy load.",
    },
    {
      id: 'flurry-of-blows',
      name: 'Flurry of Blows (Ex)',
      minLevel: 1,
      shortDescription: 'When unarmored, make one extra attack at highest BAB but all attacks take –2 penalty (–1 at 5th, 0 at 9th). Requires full attack action.',
      fullDescription:
        "When unarmored, a monk may strike with a flurry of blows. She may make one extra attack in a round at her highest base attack bonus, but this attack and all others take a –2 penalty. This penalty lessens to –1 at 5th level and disappears at 9th level. A monk must use a full attack action. A monk may attack only with unarmed strikes or special monk weapons (kama, nunchaku, quarterstaff, sai, shuriken, siangham). At 11th level (Greater Flurry) she gains a second extra attack at her full BAB.",
    },
    {
      id: 'unarmed-strike',
      name: 'Unarmed Strike',
      minLevel: 1,
      shortDescription: 'Unarmed attacks deal increasing damage (1d6 at 1st up to 2d10 at 20th). Treated as both a manufactured and natural weapon.',
      fullDescription:
        "At 1st level, a monk gains Improved Unarmed Strike as a bonus feat. Attacks may be with either fist, elbows, knees, or feet—even with hands full. There is no off-hand attack penalty. The monk applies her full Strength bonus to all unarmed damage rolls. Unarmed damage scales: 1d6 (1st–3rd), 1d8 (4th–7th), 1d10 (8th–11th), 2d6 (12th–15th), 2d8 (16th–19th), 2d10 (20th). Unarmed strikes are treated as both manufactured and natural weapons for relevant spells and effects.",
    },
    {
      id: 'bonus-feat',
      name: 'Bonus Feats',
      minLevel: 1,
      shortDescription: 'Improved Grapple or Stunning Fist (1st); Combat Reflexes or Deflect Arrows (2nd); Improved Disarm or Improved Trip (6th). No prerequisites required.',
      fullDescription:
        'At 1st level, a monk may select either Improved Grapple or Stunning Fist as a bonus feat. At 2nd level, she may select either Combat Reflexes or Deflect Arrows. At 6th level, she may select either Improved Disarm or Improved Trip. A monk need not have any of the prerequisites normally required for these feats to select them.',
    },
    {
      id: 'evasion',
      name: 'Evasion (Ex)',
      minLevel: 2,
      shortDescription: 'Take no damage on a successful Reflex save against effects that would normally deal half damage on success.',
      fullDescription:
        'At 2nd level or higher, if a monk makes a successful Reflex saving throw against an attack that normally deals half damage on a successful save, she instead takes no damage. Evasion can be used only if wearing light armor or no armor. A helpless monk does not gain the benefit.',
    },
    {
      id: 'fast-movement',
      name: 'Fast Movement (Ex)',
      minLevel: 3,
      shortDescription: 'Enhancement bonus to speed (+10 ft. at 3rd level, increasing at higher levels). Lost when wearing armor or carrying medium/heavy load.',
      fullDescription:
        'At 3rd level, a monk gains an enhancement bonus to her speed as shown on the monk table. A monk in armor or carrying a medium or heavy load loses this extra speed.',
    },
    {
      id: 'still-mind',
      name: 'Still Mind (Ex)',
      minLevel: 3,
      shortDescription: '+2 bonus on saving throws against spells and effects from the enchantment school.',
      fullDescription:
        'A monk of 3rd level or higher gains a +2 bonus on saving throws against spells and effects from the school of enchantment.',
    },
    {
      id: 'ki-strike',
      name: 'Ki Strike (Su)',
      minLevel: 4,
      shortDescription: 'Unarmed attacks treated as magic weapons (4th), lawful (10th), then adamantine (16th) for bypassing damage reduction.',
      fullDescription:
        "At 4th level, a monk's unarmed attacks are treated as magic weapons for overcoming damage reduction. At 10th level, they are also treated as lawful weapons for DR. At 16th level, they are treated as adamantine weapons for DR and bypassing hardness.",
    },
    {
      id: 'slow-fall',
      name: 'Slow Fall (Ex)',
      minLevel: 4,
      shortDescription: 'Reduce effective fall distance when within arm\'s reach of a wall. Reduces by 20 ft. at 4th, up to any distance at 20th.',
      fullDescription:
        "At 4th level or higher, a monk within arm's reach of a wall can use it to slow her descent. The effective fall distance is reduced by 20 feet at 4th level. This improves at higher levels: 30 ft. (6th), 40 ft. (8th), 50 ft. (10th), 60 ft. (12th), 70 ft. (14th), 80 ft. (16th), 90 ft. (18th), any distance (20th).",
    },
    {
      id: 'purity-of-body',
      name: 'Purity of Body (Ex)',
      minLevel: 5,
      shortDescription: 'Immune to all diseases except supernatural and magical diseases.',
      fullDescription:
        'At 5th level, a monk gains immunity to all diseases except for supernatural and magical diseases.',
    },
    {
      id: 'wholeness-of-body',
      name: 'Wholeness of Body (Su)',
      minLevel: 7,
      shortDescription: 'Heal hit points equal to twice her current monk level per day, spread across multiple uses.',
      fullDescription:
        'At 7th level or higher, a monk can heal her own wounds. She can heal a total number of hit points of damage equal to twice her current monk level each day, and she can spread this healing out among several uses.',
    },
    {
      id: 'improved-evasion',
      name: 'Improved Evasion (Ex)',
      minLevel: 9,
      shortDescription: 'As Evasion, but also takes only half damage on a failed Reflex save.',
      fullDescription:
        "At 9th level, a monk's evasion ability improves. She still takes no damage on a successful Reflex save against attacks, and henceforth takes only half damage on a failed save. A helpless monk does not gain the benefit of improved evasion.",
    },
    {
      id: 'diamond-body',
      name: 'Diamond Body (Su)',
      minLevel: 11,
      shortDescription: 'Immune to all poisons.',
      fullDescription:
        'At 11th level, a monk gains immunity to poisons of all kinds.',
    },
    {
      id: 'abundant-step',
      name: 'Abundant Step (Su)',
      minLevel: 12,
      shortDescription: 'Teleport once per day as the Dimension Door spell (caster level = ½ monk level, rounded down).',
      fullDescription:
        "At 12th level or higher, a monk can slip magically between spaces as if using the Dimension Door spell, once per day. Her caster level for this effect is one-half her monk level (rounded down).",
    },
    {
      id: 'diamond-soul',
      name: 'Diamond Soul (Ex)',
      minLevel: 13,
      shortDescription: 'Spell resistance equal to monk level + 10.',
      fullDescription:
        "At 13th level, a monk gains spell resistance equal to her current monk level + 10. To affect the monk with a spell, a spellcaster must get a result on a caster level check (1d20 + caster level) that equals or exceeds the monk's spell resistance.",
    },
    {
      id: 'quivering-palm',
      name: 'Quivering Palm (Su)',
      minLevel: 15,
      shortDescription: 'Once per week: on a successful hit, set up lethal vibrations. Can slay the target at any time within monk-level days (Fort DC 10 + ½ level + Wis).',
      fullDescription:
        'Starting at 15th level, a monk can set up lethal vibrations in a target by hitting it. She can use this once a week and must announce her intent before making the attack roll. Constructs, oozes, plants, undead, incorporeal creatures, and those immune to critical hits cannot be affected. If the attack succeeds and deals damage, the monk can try to slay the victim at any later time within a number of days equal to her monk level. The target must make a Fortitude save (DC 10 + ½ monk level + Wis modifier) or die.',
    },
    {
      id: 'timeless-body',
      name: 'Timeless Body (Ex)',
      minLevel: 17,
      shortDescription: 'No longer takes ability score penalties for aging and cannot be magically aged.',
      fullDescription:
        "Upon attaining 17th level, a monk no longer takes penalties to ability scores for aging and cannot be magically aged. Any such penalties already taken remain in place. Bonuses still accrue, and the monk still dies of old age when her time is up.",
    },
    {
      id: 'tongue-of-sun-and-moon',
      name: 'Tongue of the Sun and Moon (Ex)',
      minLevel: 17,
      shortDescription: 'Can speak with any living creature.',
      fullDescription:
        'A monk of 17th level or higher can speak with any living creature.',
    },
    {
      id: 'empty-body',
      name: 'Empty Body (Su)',
      minLevel: 19,
      shortDescription: 'Assume an ethereal state for 1 round per monk level per day (as Etherealness).',
      fullDescription:
        "At 19th level, a monk gains the ability to assume an ethereal state for 1 round per monk level per day, as though using the spell Etherealness. She may go ethereal on a number of different occasions during any single day, as long as the total number of rounds spent ethereal does not exceed her monk level.",
    },
    {
      id: 'perfect-self',
      name: 'Perfect Self',
      minLevel: 20,
      shortDescription: 'Becomes an outsider. Gains DR 10/magic. Can still be raised from dead as a member of her previous creature type.',
      fullDescription:
        "At 20th level, a monk becomes a magical creature treated as an outsider for the purpose of spells and magical effects. Additionally, the monk gains damage reduction 10/magic, which allows her to ignore the first 10 points of damage from any nonmagical weapon or natural attack by a creature without similar DR. Unlike other outsiders, the monk can still be brought back from the dead as if she were a member of her previous creature type.",
    },
  ],

  // ── Ranger ─────────────────────────────────────────────────────────────────
  Ranger: [
    {
      id: 'weapon-armor-proficiency',
      name: 'Weapon & Armor Proficiency',
      minLevel: 1,
      shortDescription: 'All simple and martial weapons; light armor; shields (not tower shields).',
      fullDescription:
        'A ranger is proficient with all simple and martial weapons, and with light armor and shields (except tower shields).',
    },
    {
      id: 'favored-enemy',
      name: 'Favored Enemy (Ex)',
      minLevel: 1,
      shortDescription: '+2 on Bluff, Listen, Sense Motive, Spot, Survival, and weapon damage vs. chosen enemy type. +1 enemy and +2 bonus to an enemy type at 5th and every 5 levels.',
      fullDescription:
        "At 1st level, a ranger selects a creature type as a favored enemy. He gains a +2 bonus on Bluff, Listen, Sense Motive, Spot, and Survival checks, and on weapon damage rolls against creatures of this type. At 5th level and every five levels thereafter (10th, 15th, 20th), the ranger may select an additional favored enemy and increase the bonus against any one existing favored enemy by +2. If the ranger chooses humanoids or outsiders, he must also choose an associated subtype.",
    },
    {
      id: 'track',
      name: 'Track',
      minLevel: 1,
      shortDescription: 'Gains Track as a bonus feat.',
      fullDescription:
        'A ranger gains Track as a bonus feat.',
    },
    {
      id: 'wild-empathy',
      name: 'Wild Empathy (Ex)',
      minLevel: 1,
      shortDescription: 'Improve an animal\'s attitude with 1d20 + ranger level + Cha modifier, like a Diplomacy check.',
      fullDescription:
        "A ranger can improve the attitude of an animal (functions like a Diplomacy check). He rolls 1d20 + ranger level + Cha modifier. The ranger and the animal must be within 30 feet and able to study each other. Influencing an animal generally takes 1 minute. He can also influence a magical beast with Intelligence 1 or 2 at a –4 penalty.",
    },
    {
      id: 'combat-style',
      name: 'Combat Style (Ex)',
      minLevel: 2,
      shortDescription: 'Choose archery or two-weapon combat. Gain Rapid Shot or Two-Weapon Fighting without meeting prerequisites. Only while in light or no armor.',
      fullDescription:
        "At 2nd level, a ranger selects archery or two-weapon combat as his combat style. If archery: treated as having Rapid Shot even without the prerequisites. If two-weapon: treated as having Two-Weapon Fighting even without prerequisites. Benefits apply only in light or no armor and are lost in medium or heavy armor.",
    },
    {
      id: 'endurance',
      name: 'Endurance',
      minLevel: 3,
      shortDescription: 'Gains Endurance as a bonus feat.',
      fullDescription:
        'A ranger gains Endurance as a bonus feat at 3rd level.',
    },
    {
      id: 'animal-companion',
      name: 'Animal Companion (Ex)',
      minLevel: 4,
      shortDescription: 'Gain an animal companion. Effective druid level = ½ ranger level for determining companion abilities.',
      fullDescription:
        "At 4th level, a ranger gains an animal companion. This ability functions like the druid ability of the same name, except that the ranger's effective druid level is one-half his ranger level. A ranger may select from the alternative lists of animal companions just as a druid can, again at half his ranger level.",
    },
    {
      id: 'spells',
      name: 'Spells',
      minLevel: 4,
      shortDescription: 'Prepares a small number of divine spells from the ranger list starting at 4th level. Wisdom-based; caster level = ½ ranger level.',
      fullDescription:
        "Beginning at 4th level, a ranger gains the ability to cast a small number of divine spells from the ranger spell list. Spells require a Wisdom score of at least 10 + spell level. Saving throw DC is 10 + spell level + Wis modifier. Caster level is one-half his ranger level. The ranger prepares and casts spells like a cleric, but cannot convert prepared spells to cure spells.",
    },
    {
      id: 'improved-combat-style',
      name: 'Improved Combat Style (Ex)',
      minLevel: 6,
      shortDescription: 'Chosen combat style improves: Manyshot (archery) or Improved Two-Weapon Fighting (two-weapon). Only in light or no armor.',
      fullDescription:
        "At 6th level, a ranger's combat style improves. If archery was selected: treated as having Manyshot without prerequisites. If two-weapon: treated as having Improved Two-Weapon Fighting without prerequisites. Benefits apply only in light or no armor.",
    },
    {
      id: 'woodland-stride',
      name: 'Woodland Stride (Ex)',
      minLevel: 7,
      shortDescription: 'Move through natural undergrowth at normal speed without taking damage or suffering impairment.',
      fullDescription:
        'Starting at 7th level, a ranger may move through any sort of undergrowth (natural thorns, briars, overgrown areas) at his normal speed without taking damage or suffering impairment. Enchanted or magically manipulated terrain still affects him.',
    },
    {
      id: 'swift-tracker',
      name: 'Swift Tracker (Ex)',
      minLevel: 8,
      shortDescription: 'Track at normal speed without the normal –5 penalty. Only –10 penalty (instead of –20) when moving at up to twice normal speed.',
      fullDescription:
        "Beginning at 8th level, a ranger can move at his normal speed while following tracks without taking the normal –5 penalty. He takes only a –10 penalty (instead of the normal –20) when moving at up to twice normal speed while tracking.",
    },
    {
      id: 'evasion',
      name: 'Evasion (Ex)',
      minLevel: 9,
      shortDescription: 'Take no damage on a successful Reflex save against effects that would normally deal half damage on success.',
      fullDescription:
        "At 9th level, a ranger can avoid magical and unusual attacks with great agility. If he makes a successful Reflex saving throw against an attack that normally deals half damage on success, he instead takes no damage. Only usable in light or no armor. A helpless ranger does not gain the benefit.",
    },
    {
      id: 'combat-style-mastery',
      name: 'Combat Style Mastery (Ex)',
      minLevel: 11,
      shortDescription: 'Chosen combat style improves further: Improved Precise Shot (archery) or Greater Two-Weapon Fighting (two-weapon). Only in light or no armor.',
      fullDescription:
        "At 11th level, a ranger's combat style improves again. If archery was selected: treated as having Improved Precise Shot without prerequisites. If two-weapon: treated as having Greater Two-Weapon Fighting without prerequisites. Benefits apply only in light or no armor.",
    },
    {
      id: 'camouflage',
      name: 'Camouflage (Ex)',
      minLevel: 13,
      shortDescription: 'Use the Hide skill in any sort of natural terrain, even without cover or concealment.',
      fullDescription:
        "A ranger of 13th level or higher can use the Hide skill in any sort of natural terrain, even if the terrain doesn't grant cover or concealment.",
    },
    {
      id: 'hide-in-plain-sight',
      name: 'Hide in Plain Sight (Ex)',
      minLevel: 17,
      shortDescription: 'Use the Hide skill in natural terrain even while being observed.',
      fullDescription:
        'While in any sort of natural terrain, a ranger of 17th level or higher can use the Hide skill even while being observed.',
    },
  ],

  // ── Rogue ──────────────────────────────────────────────────────────────────
  Rogue: [
    {
      id: 'weapon-armor-proficiency',
      name: 'Weapon & Armor Proficiency',
      minLevel: 1,
      shortDescription: 'Simple weapons plus hand crossbow, rapier, sap, shortbow, and short sword; light armor only; no shields.',
      fullDescription:
        'Rogues are proficient with all simple weapons, plus the hand crossbow, rapier, sap, shortbow, and short sword. Rogues are proficient with light armor, but not with shields.',
    },
    {
      id: 'sneak-attack',
      name: 'Sneak Attack',
      minLevel: 1,
      shortDescription: '+1d6 extra damage at 1st level (+1d6 every 2 levels) when target is denied Dex to AC or flanked. Only living creatures with discernible anatomy.',
      fullDescription:
        "The rogue's attack deals extra damage any time her target would be denied a Dexterity bonus to AC or when the rogue flanks her target. This extra damage is 1d6 at 1st level, increasing by 1d6 every two rogue levels thereafter. A critical hit with a sneak attack does not multiply this extra damage. Ranged attacks count only within 30 feet. The rogue cannot sneak attack undead, constructs, oozes, plants, incorporeal creatures, or any creature immune to critical hits.",
    },
    {
      id: 'trapfinding',
      name: 'Trapfinding',
      minLevel: 1,
      shortDescription: 'Only rogues can use Search (DC > 20) to find traps and Disable Device to disarm magic traps.',
      fullDescription:
        "Rogues (and only rogues) can use the Search skill to locate traps when the DC is higher than 20. Finding a nonmagical trap has a DC of at least 20; finding a magic trap has a DC of 25 + the spell's level. Rogues can also use Disable Device to disarm magic traps (DC 25 + spell level). A rogue who beats a trap's DC by 10 or more with Disable Device can study the trap and bypass it without disarming it.",
    },
    {
      id: 'evasion',
      name: 'Evasion (Ex)',
      minLevel: 2,
      shortDescription: 'Take no damage on a successful Reflex save against effects that would normally deal half damage on success.',
      fullDescription:
        'At 2nd level and higher, a rogue can avoid magical and unusual attacks with great agility. If she makes a successful Reflex saving throw against an attack that normally deals half damage on success, she instead takes no damage. Only usable in light or no armor. A helpless rogue does not gain the benefit.',
    },
    {
      id: 'trap-sense',
      name: 'Trap Sense (Ex)',
      minLevel: 3,
      shortDescription: '+1 on Reflex saves and dodge bonus to AC vs. traps at 3rd, +1 every 3 levels.',
      fullDescription:
        'At 3rd level, a rogue gains an intuitive sense that alerts her to danger from traps, giving a +1 bonus on Reflex saves made to avoid traps and a +1 dodge bonus to AC against attacks by traps. These bonuses rise to +2 (6th), +3 (9th), +4 (12th), +5 (15th), +6 (18th). Trap sense bonuses from multiple classes stack.',
    },
    {
      id: 'uncanny-dodge',
      name: 'Uncanny Dodge (Ex)',
      minLevel: 4,
      shortDescription: 'Retains Dex bonus to AC even when flat-footed or struck by an invisible attacker.',
      fullDescription:
        "Starting at 4th level, a rogue can react to danger before her senses would normally allow her to. She retains her Dexterity bonus to AC (if any) even if caught flat-footed or struck by an invisible attacker. She still loses the bonus if immobilized. If a rogue already has uncanny dodge from a different class she automatically gains improved uncanny dodge instead.",
    },
    {
      id: 'improved-uncanny-dodge',
      name: 'Improved Uncanny Dodge (Ex)',
      minLevel: 8,
      shortDescription: 'Cannot be flanked except by a rogue with 4+ more rogue levels.',
      fullDescription:
        "A rogue of 8th level or higher can no longer be flanked. This denies another rogue the ability to sneak attack by flanking her, unless the attacker has at least four more rogue levels than the target. If a character already has uncanny dodge from a second class, levels from those classes stack to determine the minimum rogue level required to flank.",
    },
    {
      id: 'special-ability',
      name: 'Special Ability',
      minLevel: 10,
      shortDescription: 'At 10th level and every 3 levels, choose one: Crippling Strike, Defensive Roll, Improved Evasion, Opportunist, Skill Mastery, Slippery Mind, or Feat.',
      fullDescription:
        "On attaining 10th level, and every three levels thereafter (13th, 16th, 19th), a rogue gains a special ability of her choice: Crippling Strike (sneak attacks also deal 2 Str damage), Defensive Roll (once/day, Reflex save to halve lethal damage), Improved Evasion (half damage on failed Reflex save), Opportunist (once/round AoO when ally hits in melee), Skill Mastery (take 10 on selected skills even under stress), Slippery Mind (second chance to save vs. enchantments), or a bonus Feat.",
    },
  ],

  // ── Sorcerer ───────────────────────────────────────────────────────────────
  Sorcerer: [
    {
      id: 'weapon-proficiency',
      name: 'Weapon Proficiency',
      minLevel: 1,
      shortDescription: 'All simple weapons only. Not proficient with armor or shields (arcane spell failure).',
      fullDescription:
        "Sorcerers are proficient with all simple weapons. They are not proficient with any type of armor or shield. Armor of any type interferes with a sorcerer's gestures, which can cause spells with somatic components to fail.",
    },
    {
      id: 'spells',
      name: 'Spells',
      minLevel: 1,
      shortDescription: 'Casts arcane spells spontaneously from the sorcerer/wizard list. Charisma-based. Limited spells known; can swap one known spell starting at 4th level and every even level.',
      fullDescription:
        "A sorcerer casts arcane spells drawn from the sorcerer/wizard spell list without preparing them. To cast a spell he must have a Charisma score of at least 10 + spell level. DC is 10 + spell level + Cha modifier. Spells known are very limited (4 cantrips and 2 1st-level spells at 1st level). Starting at 4th level and every even-numbered level thereafter, a sorcerer can swap one known spell for another of the same level.",
    },
    {
      id: 'familiar',
      name: 'Familiar',
      minLevel: 1,
      shortDescription: 'Obtain a familiar (100 gp, 24 hours). The familiar gains special abilities as the master advances in level.',
      fullDescription:
        "A sorcerer can obtain a familiar. Doing so takes 24 hours and uses up magical materials costing 100 gp. The familiar is a magical beast that serves as companion and servant. As the sorcerer advances, the familiar gains improved evasion, share spells, alertness (for the master), empathic link, deliver touch spells, speak with master, speak with animals of its kind, spell resistance, and scry on familiar. If the familiar dies, the sorcerer must make a DC 15 Fort save or lose 200 XP per sorcerer level (success = half). A slain familiar cannot be replaced for a year and a day.",
    },
  ],

  // ── Wizard ─────────────────────────────────────────────────────────────────
  Wizard: [
    {
      id: 'weapon-proficiency',
      name: 'Weapon Proficiency',
      minLevel: 1,
      shortDescription: 'Club, dagger, heavy crossbow, light crossbow, and quarterstaff only. Not proficient with armor or shields.',
      fullDescription:
        "Wizards are proficient with the club, dagger, heavy crossbow, light crossbow, and quarterstaff, but not with any type of armor or shield. Armor of any type interferes with a wizard's movements, which can cause spells with somatic components to fail.",
    },
    {
      id: 'spells',
      name: 'Spells',
      minLevel: 1,
      shortDescription: 'Prepares arcane spells daily from spellbook. Intelligence-based. May specialize in one school of magic.',
      fullDescription:
        "A wizard casts arcane spells from the sorcerer/wizard spell list, choosing and preparing them ahead of time from her spellbook. To learn, prepare, or cast a spell, the wizard must have an Intelligence score of at least 10 + spell level. DC is 10 + spell level + Int modifier. A specialist wizard can prepare one additional spell per spell level per day in her specialty school and gains +2 on Spellcraft checks to learn those spells.",
    },
    {
      id: 'familiar',
      name: 'Familiar',
      minLevel: 1,
      shortDescription: 'Obtain a familiar identical to the sorcerer\'s familiar ability.',
      fullDescription:
        'A wizard can obtain a familiar in exactly the same manner as a sorcerer can. See the sorcerer familiar description for full details on familiar abilities and the consequences of losing one.',
    },
    {
      id: 'scribe-scroll',
      name: 'Scribe Scroll',
      minLevel: 1,
      shortDescription: 'Gains Scribe Scroll as a bonus feat at 1st level.',
      fullDescription:
        'At 1st level, a wizard gains Scribe Scroll as a bonus feat. This allows the wizard to create spell scrolls of any spell she knows.',
    },
    {
      id: 'spellbooks',
      name: 'Spellbooks',
      minLevel: 1,
      shortDescription: 'Must study her spellbook each day to prepare spells. Begins with all cantrips plus 3 + Int modifier 1st-level spells.',
      fullDescription:
        "A wizard must study her spellbook each day to prepare her spells. She cannot prepare any spell not recorded in her spellbook except for Read Magic. A wizard begins play with a spellbook containing all 0-level wizard spells (except from prohibited schools) plus three 1st-level spells of your choice, plus one additional 1st-level spell per point of Intelligence bonus. At each new wizard level, she gains two new spells of any level she can cast for her spellbook. She can also add spells found in other wizards' spellbooks.",
    },
    {
      id: 'bonus-feats',
      name: 'Bonus Feats',
      minLevel: 5,
      shortDescription: 'At 5th, 10th, 15th, and 20th level: one bonus metamagic feat, item creation feat, or Spell Mastery.',
      fullDescription:
        'At 5th, 10th, 15th, and 20th level, a wizard gains a bonus feat. At each opportunity she can choose a metamagic feat, an item creation feat, or Spell Mastery. The wizard must still meet all prerequisites, including caster level minimums. These bonus feats are in addition to the feat any character gains from advancing levels.',
    },
  ],

  // ── Paladin ────────────────────────────────────────────────────────────────
  // (Not included in user-provided SRD pages — add later if needed)
};

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns all class features available to a class at the given level. */
export function getClassFeatures(className: ClassName, level: number): DerivedClassFeature[] {
  const entries = CATALOG[className] ?? [];
  return entries
    .filter((f) => f.minLevel <= level)
    .map((f) => ({ ...f, className }));
}
