/**
 * Seed script — inserts a male human Fighter (level 1) named Aldric Ironforge.
 * Deletes any existing document with that name first, then inserts fresh.
 *
 * Run with:  npm run seed  (from the server workspace)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { Character } from './models/Character';
import {
  abilityModifier,
  XP_THRESHOLDS,
  FIGHTER_CLASS_PROFICIENCIES,
  SKILL_LIST,
} from './rules/coreMechanics';

const MONGO_URI = process.env.MONGO_URI ?? '';

async function seed() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // ── Ability scores ────────────────────────────────────────────────────────
  const strBase = 16;
  const conBase = 14;
  const dexBase = 13;
  const conMod  = abilityModifier(conBase);   // +2
  const strMod  = abilityModifier(strBase);   // +3
  const dexMod  = abilityModifier(dexBase);   // +1

  // ── HP calculation ─────────────────────────────────────────────────────────
  // Fighter d10 max at level 1 = 10
  // + CON mod (+2) = 12
  // + Toughness feat (+3) = 15
  const fighterHitDie   = 10;
  const toughnessBonus  = 3;
  const level1MaxHp     = fighterHitDie + conMod + toughnessBonus; // 15

  // ── Feats ─────────────────────────────────────────────────────────────────
  // Human Fighter 1 receives four distinct categories of feats at level 1:
  //
  //  1. PROFICIENCY feats — granted automatically as class features (not chosen)
  //     SRD: "A fighter is proficient with all simple and martial weapons and
  //     with all armor (heavy, medium, and light) and shields (including tower shields)."
  //
  //  2. STANDARD feat — one feat every character gains at 1st level
  //
  //  3. RACIAL bonus feat — humans gain one bonus feat at 1st level
  //
  //  4. FIGHTER bonus feat — fighter gains one bonus feat at 1st level;
  //     must be drawn from the Fighter Bonus Feats list

  const proficiencyFeats = FIGHTER_CLASS_PROFICIENCIES.map((name) => ({
    name,
    type:   'General' as const,
    source: 'Class Feat' as const,
    notes:  'Granted automatically as a fighter class feature; no selection required.',
  }));

  const feats = [
    ...proficiencyFeats,

    // Standard level-1 feat (every character)
    {
      name:   'Toughness',
      type:   'General' as const,
      source: 'Character Feat' as const,
      notes:  '+3 hit points. Stackable. Taken as the standard level-1 character feat.',
    },

    // Human 1st-level racial bonus feat — chosen from any [General] feat meeting prereqs
    {
      name:   'Power Attack',
      type:   'General' as const,
      source: 'Bonus Feat' as const,
      notes:  'Trade melee attack bonus for equal damage bonus. Prereq: Str 13. Selected as the human racial bonus feat at level 1.',
    },

    // Fighter 1st-level class bonus feat — must be from the Fighter Bonus Feats list
    {
      name:   'Weapon Focus (Longsword)',
      type:   'Fighter Bonus Feat' as const,
      source: 'Fighter Bonus Feat' as const,
      notes:  '+1 on all attack rolls with longswords. Prereq: proficiency, BAB +1. Selected as the fighter 1st-level class bonus feat.',
    },
  ];

  // ── Skills ─────────────────────────────────────────────────────────────────
  // Fighter class skills (SRD): Climb, Craft, Handle Animal, Intimidate,
  // Jump, Ride, Swim.  Knowing a skill is a class skill affects max-rank cap
  // and skill-point cost, but not the bonus formula itself.
  const FIGHTER_CLASS_SKILLS = new Set([
    'Climb', 'Craft', 'Handle Animal', 'Intimidate', 'Jump', 'Ride', 'Swim',
  ]);

  // Ranks Aldric has invested (Fighter 1, INT 10 → 2+1 bonus = 9 skill points)
  const investedRanks: Record<string, number> = {
    'Climb':      4,
    'Intimidate': 4,
    'Jump':       1,
  };

  // Ability score totals for bonus calculation
  const abilityTotals: Record<string, number> = {
    strength: strBase, dexterity: dexBase, constitution: conBase,
    intelligence: 10,  wisdom: 12,         charisma: 8,
  };

  const skills = SKILL_LIST.map((skill) => {
    const ranks     = investedRanks[skill.name] ?? 0;
    const abilityMod = skill.keyAbility
      ? abilityModifier(abilityTotals[skill.keyAbility] ?? 10)
      : 0;
    return {
      name:              skill.name,
      keyAbility:        skill.keyAbility ?? undefined,
      trainedOnly:       skill.trainedOnly,
      armorCheckPenalty: skill.armorCheckPenalty,
      ranks,
      classSkill:        FIGHTER_CLASS_SKILLS.has(skill.name),
      miscBonus:         0,
      bonus:             ranks + abilityMod,
    };
  });

  // ── Full character ────────────────────────────────────────────────────────
  const aldric = {
    name:      'Aldric Ironforge',
    gender:    'male' as const,
    race:      'Human' as const,
    alignment: 'Lawful Neutral' as const,
    deity:     'Heironeous',
    age:       24,
    height:    "5'11\"",
    weight:    '185 lbs',
    eyes:      'Steel grey',
    hair:      'Dark brown',
    skin:      'Tanned',
    languages: ['Common', 'Elven'],
    size:      'Medium',
    description: 'A broad-shouldered soldier with a steady gaze and a well-worn longsword at his hip.',
    backstory:   'A veteran of two border skirmishes, Aldric left the standing army to seek greater purpose and gold.',

    classes: [
      {
        name:       'Fighter',
        level:      1,
        hitDieType: fighterHitDie,
        hpRolled:   [fighterHitDie], // max at level 1
      },
    ],

    experience: {
      current:   0,
      nextLevel: XP_THRESHOLDS[1] ?? 1000,
    },

    abilityScores: {
      strength:     { base: strBase, racial: 0, enhancement: 0, misc: 0, temp: 0 },
      dexterity:    { base: dexBase, racial: 0, enhancement: 0, misc: 0, temp: 0 },
      constitution: { base: conBase, racial: 0, enhancement: 0, misc: 0, temp: 0 },
      intelligence: { base: 10,      racial: 0, enhancement: 0, misc: 0, temp: 0 },
      wisdom:       { base: 12,      racial: 0, enhancement: 0, misc: 0, temp: 0 },
      charisma:     { base: 8,       racial: 0, enhancement: 0, misc: 0, temp: 0 },
    },

    hitPoints: {
      max:       level1MaxHp,
      current:   level1MaxHp,
      nonlethal: 0,
    },

    combat: {
      initiative:  { miscBonus: 0 },
      speed:       { base: 30, armorAdjust: 0 },
      armorClass: {
        armor:      4,  // chain shirt
        shield:     1,  // light wooden shield
        natural:    0,
        deflection: 0,
        misc:       0,
      },
      saves: {
        // Fighter level 1: Fort +2 (good), Ref +0 (poor), Will +0 (poor)
        fortitude: { base: 2, magic: 0, misc: 0, temp: 0 },
        reflex:    { base: 0, magic: 0, misc: 0, temp: 0 },
        will:      { base: 0, magic: 0, misc: 0, temp: 0 },
      },
      baseAttackBonus: 1,
      grappleBonus:    1 + strMod, // BAB + STR mod + size(0) = +4
    },

    skills,

    feats,

    equipment: [
      { name: 'Chain Shirt',         type: 'armor',  weight: 25, equipped: true,  notes: 'AC +4, Max Dex +4, Check Penalty -2, Speed 30ft' },
      { name: 'Light Wooden Shield', type: 'armor',  weight: 5,  equipped: true,  notes: 'AC +1, Check Penalty -1' },
      { name: 'Longsword',           type: 'weapon', weight: 4,  equipped: true,  notes: '1d8, 19-20/×2, Slashing' },
      { name: 'Shortbow',            type: 'weapon', weight: 2,  equipped: false, notes: '1d6, ×3, Piercing, Range 60ft' },
      { name: 'Arrows (20)',         type: 'ammo',   weight: 3,  equipped: false, notes: '' },
      { name: 'Backpack',            type: 'gear',   weight: 2,  equipped: false, notes: '' },
      { name: 'Bedroll',             type: 'gear',   weight: 5,  equipped: false, notes: '' },
      { name: 'Rations (3 days)',    type: 'gear',   weight: 3,  equipped: false, notes: '' },
      { name: 'Waterskin',           type: 'gear',   weight: 4,  equipped: false, notes: '' },
      { name: 'Torch (3)',           type: 'gear',   weight: 3,  equipped: false, notes: '' },
    ],

    currency: { pp: 0, gp: 14, sp: 7, cp: 0 },
  };

  // Delete any existing document with this name, then insert fresh
  const deleted = await Character.deleteOne({ name: aldric.name });
  if (deleted.deletedCount > 0) {
    console.log(`Deleted existing "${aldric.name}" document`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = await Character.create(aldric as any);
  const result = doc.toObject();

  const ac = 10 + dexMod + result.combat.armorClass.armor + result.combat.armorClass.shield;

  console.log(`\nSeeded "${result.name}" (${result._id})`);
  console.log(`  Fighter 1 | HP ${result.hitPoints.max} | STR ${strBase}(${strMod >= 0 ? '+' : ''}${strMod}) | AC ${ac} | BAB +${result.combat.baseAttackBonus}`);

  const byType: Record<string, string[]> = {};
  for (const f of (result.feats as unknown) as Array<{ type: string; name: string }>) {
    (byType[f.type] ??= []).push(f.name);
  }
  console.log('\n  Feats by type:');
  for (const [t, names] of Object.entries(byType)) {
    console.log(`    [${t}] ${names.join(', ')}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
