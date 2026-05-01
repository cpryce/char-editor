#!/usr/bin/env -S ts-node --transpile-only
/**
 * One-time script: rename AcroForm fields in blank.pdf to semantic names.
 * Reads server/src/assets/blank.pdf, applies renames, and overwrites the file.
 *
 * Usage:
 *   npm run rename-pdf-fields       (from server/)
 *   npx ts-node --transpile-only src/renamePdfFields.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';

// Map of current field name → desired field name.
// Only fields relevant to character export are listed.
const RENAMES: Record<string, string> = {
  // ── Identity ──────────────────────────────────────────────────────────────
  'DEITYIES':               'DEITY',

  // ── Class table (row 1) ───────────────────────────────────────────────────
  'CLASS':                  'CLASS1_NAME',
  'LEVEL0':                 'CLASS1_LEVEL',

  // ── Class table (rows 2–4) ────────────────────────────────────────────────
  'LEVEL0_2':               'CLASS2_LEVEL',
  'LEVEL0_3':               'CLASS3_LEVEL',
  'LEVEL0_4':               'CLASS4_LEVEL',

  // ── Hit Points ────────────────────────────────────────────────────────────
  'TOTAL HP TEMP HP':       'HP_TOTAL',

  // ── Speed ─────────────────────────────────────────────────────────────────
  'MOVE 30':                'SPEED_LAND',
  'BASE 30':                'SPEED_BASE',
  'SWIM 7':                 'SPEED_SWIM',
  'CLIMB 7':                'SPEED_CLIMB',
  'FLYOTHER':               'SPEED_FLY_MANEUVERABILITY',
  'SR SPELL RESIST':        'SPELL_RESISTANCE',
  'DR DAM REDUCTION':       'DR',

  // ── AC components ─────────────────────────────────────────────────────────
  'DODGE':                  'AC_DODGE',
  'MISC':                   'AC_MISC',
  '0_10':                   'AC_TOTAL',
  '0_11':                   'AC_TOUCH',
  '0_12':                   'AC_FLAT_FOOTED',
  '0_13':                   'AC_ARMOR_BONUS',
  '0_14':                   'AC_SHIELD_BONUS',
  '0_15':                   'AC_DEX_MOD',
  'undefined_22':           'AC_SIZE_MOD',
  '0_18':                   'AC_DEFLECTION',
  'ABILITY':                'AC_ABILITY_MOD',

  // ── Saving throw notes ────────────────────────────────────────────────────
  'AC and SAVING THROW NOTES  MODIFIERS 1': 'SAVE_NOTES_1',
  'AC and SAVING THROW NOTES  MODIFIERS 2': 'SAVE_NOTES_2',
  'AC and SAVING THROW NOTES  MODIFIERS 3': 'SAVE_NOTES_3',
  'AC and SAVING THROW NOTES  MODIFIERS 4': 'SAVE_NOTES_4',

  // ── Fortitude save ────────────────────────────────────────────────────────
  '0_23':                   'FORT_TOTAL',
  'CON 0':                  'FORT_CON_MOD',
  'ENHANCE':                'FORT_MAGIC',
  'MISC_2':                 'FORT_MISC',
  '0_24':                   'FORT_BASE',

  // ── Reflex save ───────────────────────────────────────────────────────────
  '0_25':                   'REF_TOTAL',
  'DEX 0':                  'REF_DEX_MOD',
  'undefined_26':           'REF_MAGIC',
  'undefined_27':           'REF_MISC',
  '0_26':                   'REF_BASE',

  // ── Will save ─────────────────────────────────────────────────────────────
  '0_27':                   'WILL_TOTAL',
  'WIS 0':                  'WILL_WIS_MOD',
  'undefined_28':           'WILL_MAGIC',

  // ── BAB / Grapple / Initiative ────────────────────────────────────────────
  '0_28':                   'BAB_TOTAL',
  '0_29':                   'GRAPPLE_SIZE_MOD',
  '0_30':                   'GRAPPLE_TOTAL',
  'MISC_3':                 'GRAPPLE_MISC',
  'DODGE_2':                'INIT_TOTAL',
  '0_31':                   'INIT_MISC',
  'DEX 0_2':                'INIT_DEX_MOD',
  'STR 0':                  'GRAPPLE_STR_MOD',
  '0_32':                   'MELEE_ATTACK',
  '0_33':                   'RANGED_ATTACK',

  // ── Weapons ───────────────────────────────────────────────────────────────
  'mainHand.combatMod':     'mainHand.attackMod',
  'ATTACK  WEAPON 1':       'WEAPON1_ATTACK',
  'ATTACK  WEAPON 2':       'WEAPON2_ATTACK',
  'ATTACK  WEAPON 3':       'WEAPON3_ATTACK',
  'ATTACK  WEAPON 4':       'WEAPON4_ATTACK',
  'ATTACK  WEAPON 5':       'WEAPON5_ATTACK',

  // ── Feats / features ─────────────────────────────────────────────────────
  'FEATS  FEATURES':                             'FEATS',
  'FEATS  CLASS RACIAL AND CHARACTER FEATURES':  'CLASS_RACIAL_FEATURES',

  // ── Familiar / companion ──────────────────────────────────────────────────
  'RACETEMPLATE':           'RACE_TEMPLATE',
  'CLASS_2':                'FAMILIAR_CLASS',

  // ── Typo fixes ────────────────────────────────────────────────────────────
  'abiliityScores.constitution.total':       'abilityScores.constitution.total',
  'abiliityScores.constitution.mod':         'abilityScores.constitution.mod',
  'abiliityScores.constitution.base':        'abilityScores.constitution.base',
  'abiliityScores.constitution.enhancement': 'abilityScores.constitution.enhancement',
  'abiliityScores.constitution.levelUp':     'abilityScores.constitution.levelUp',
  'abiliityScores.constitution.temp':        'abilityScores.constitution.temp',
  'abiliityScores.constitution.tempMod':     'abilityScores.constitution.tempMod',
};

async function run() {
  const pdfPath = path.join(__dirname, 'assets', 'blank.pdf');
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  let renamed = 0;
  let skipped = 0;

  for (const field of fields) {
    const currentName = field.getName();
    const newName = RENAMES[currentName];
    if (!newName) continue;

    try {
      // pdf-lib doesn't expose a renameField method, so we write the T key directly.
      field.acroField.dict.set(PDFName.of('T'), PDFString.of(newName));
      console.log(`  ✓ "${currentName}" → "${newName}"`);
      renamed++;
    } catch (err) {
      console.warn(`  ✗ Could not rename "${currentName}": ${String(err)}`);
      skipped++;
    }
  }

  const updatedBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, updatedBytes);

  console.log(`\nDone. ${renamed} renamed, ${skipped} skipped.`);
  console.log(`Saved → ${pdfPath}`);
}

run().catch((err: unknown) => {
  console.error('Error:', err);
  process.exit(1);
});
