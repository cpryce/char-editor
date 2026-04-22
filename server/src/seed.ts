/**
 * Seed script — inserts a male human Fighter (level 1) named Aldric Ironforge.
 * Safe to re-run: upserts by character name.
 *
 * Run with:  npm run seed  (from the server workspace)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { Character } from './models/Character';
import { abilityModifier, XP_THRESHOLDS } from './rules/coreMechanics';

const MONGO_URI = process.env.MONGO_URI ?? '';

async function seed() {
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // ── Aldric Ironforge ──────────────────────────────────────────────────────
  // Male Human Fighter 1, Lawful Neutral
  // STR 16  DEX 13  CON 14  INT 10  WIS 12  CHA 8
  // HP: 10 (fighter d10 max at level 1) + 2 (CON mod) = 12
  // BAB: +1  Grapple: BAB(+1) + STR mod(+3) + size(0) = +4

  const strBase = 16;
  const conBase = 14;
  const dexBase = 13;
  const conMod  = abilityModifier(conBase);   // +2
  const strMod  = abilityModifier(strBase);   // +3
  const dexMod  = abilityModifier(dexBase);   // +1

  const fighterHitDie = 10;
  const level1MaxHp   = fighterHitDie + conMod; // 12

  const aldric = {
    name:      'Aldric Ironforge',
    owner:     null,
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

    skills: [
      { name: 'Climb',      keyAbility: 'strength', ranks: 4, classSkill: true,  miscBonus: 0 },
      { name: 'Intimidate', keyAbility: 'charisma',  ranks: 4, classSkill: true,  miscBonus: 0 },
      { name: 'Jump',       keyAbility: 'strength', ranks: 0, classSkill: true,  miscBonus: 0 },
      { name: 'Swim',       keyAbility: 'strength', ranks: 0, classSkill: true,  miscBonus: 0 },
      { name: 'Ride',       keyAbility: 'dexterity', ranks: 0, classSkill: true, miscBonus: 0 },
    ],

    feats: [
      { name: 'Power Attack',              source: 'Level 1 (Human Bonus Feat)',  notes: 'Trade attack bonus for damage bonus, melee only.' },
      { name: 'Weapon Focus (Longsword)',   source: 'Level 1 (Fighter Bonus Feat)', notes: '+1 on attack rolls with longswords.' },
    ],

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

  // Upsert — safe to re-run
  const result = await Character.findOneAndUpdate(
    { name: aldric.name },
    { $set: aldric },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  console.log(`Seeded "${result.name}" (${result._id})`);
  console.log(
    `  Fighter 1 | HP ${result.hitPoints.max} | ` +
    `STR ${strBase}(${strMod >= 0 ? '+' : ''}${strMod}) | ` +
    `AC ${10 + dexMod + result.combat.armorClass.armor + result.combat.armorClass.shield} | ` +
    `BAB +${result.combat.baseAttackBonus}`
  );

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
