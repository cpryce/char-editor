import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import type { CharacterDraft, ArmorLoadout, WeaponLoadout, Inventory, AcBonusType, WornSlot, WornSlotKey, FeatSlot, ClassEntry } from '../../types/character';
import { ArmorAutocomplete } from '../../components/ArmorAutocomplete';
import { WeaponSelector } from '../../components/WeaponSelector';
import type { ArmorCatalogEntry } from '../../data/armor';
import { ARMOR_ENTRIES, SHIELD_ENTRIES } from '../../data/armor';
import type { WeaponCatalogEntry } from '../../data/weapons';
import { WEAPON_CATALOG, getWeaponAttackClass } from '../../data/weapons';
import { buildIterativeAttackString } from '../../utils/characterHelpers';

/** Weapons usable in the off-hand: Light and One-Handed only. */
const OFF_HAND_WEAPON_CATALOG = WEAPON_CATALOG.filter((w) => w.handedness !== 'Two-Handed');
import type { MaterialKey } from '../../data/materials';
import { MATERIALS, ARMOR_MATERIAL_KEYS, applyWeightMultiplier, applyAcpDelta, applyAsfDelta, applyMaxDexDelta, applyArmorCategoryShift } from '../../data/materials';
import './InventorySection.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Feat eligibility ─────────────────────────────────────────────────────────

export interface FeatOption {
  name: string;
  available: boolean;
  disabledReason?: string;
}

function hasFeat(characterFeats: FeatSlot[], name: string): boolean {
  return characterFeats.some((f) => f.name === name);
}

/**
 * Doubles the threat range of a critical string (Improved Critical effect).
 * e.g. "×2" → "19-20/×2", "19-20/×2" → "17-20/×2", "×3" → "19-20/×3"
 */
function doubleThreatRange(critical: string): string {
  const match = critical.match(/^(?:(\d+)-20\/)?([×x×]\d+)$/);
  if (!match) return critical;
  const lowerBound = match[1] ? parseInt(match[1], 10) : 20;
  const multiplier = match[2];
  const currentSize = 21 - lowerBound;
  const newLower = 21 - currentSize * 2;
  return newLower >= 20 ? multiplier : `${newLower}-20/${multiplier}`;
}

/**
 * Halves the threat range of a critical string (removing Improved Critical).
 * e.g. "19-20/×2" → "×2", "17-20/×2" → "19-20/×2"
 */
function halveThreatRange(critical: string): string {
  const match = critical.match(/^(?:(\d+)-20\/)?([×x×]\d+)$/);
  if (!match) return critical;
  const lowerBound = match[1] ? parseInt(match[1], 10) : 20;
  const multiplier = match[2];
  const currentSize = 21 - lowerBound;
  const newSize = Math.max(1, Math.ceil(currentSize / 2));
  const newLower = 21 - newSize;
  return newLower >= 20 ? multiplier : `${newLower}-20/${multiplier}`;
}

function getFighterLevel(classes: ClassEntry[]): number {
  return classes.filter((c) => c.name === 'Fighter').reduce((s, c) => s + c.level, 0);
}

function getRangerLevel(classes: ClassEntry[]): number {
  return classes.filter((c) => c.name === 'Ranger').reduce((s, c) => s + c.level, 0);
}

/** Returns the list of feats that can be applied to a specific weapon slot. */
function getWeaponFeatOptions(
  weapon: WeaponLoadout | null,
  characterFeats: FeatSlot[],
  fighterLevel: number,
  bab: number,
): FeatOption[] {
  if (!weapon) return [];
  const isRanged = getWeaponAttackClass(weapon.name, weapon.rangeIncrement) === 'Ranged';
  const isLight  = weapon.handedness === 'Light';
  const options: FeatOption[] = [];

  // Weapon Focus (+1 attack) — melee or ranged
  const hasWF = hasFeat(characterFeats, 'Weapon Focus');
  options.push({
    name: 'Weapon Focus',
    available: hasWF,
    disabledReason: hasWF ? undefined : 'Character does not have Weapon Focus',
  });

  // Greater Weapon Focus (+1 more) — fighter 8+
  const hasGWF = hasFeat(characterFeats, 'Greater Weapon Focus');
  const gwfLevelOk = fighterLevel >= 8;
  options.push({
    name: 'Greater Weapon Focus',
    available: hasGWF && gwfLevelOk,
    disabledReason: !hasGWF
      ? 'Character does not have Greater Weapon Focus'
      : !gwfLevelOk
        ? `Fighter level 8 required (current: ${fighterLevel})`
        : undefined,
  });

  // Weapon Finesse — light melee weapons, or weapons explicitly marked eligible (e.g. Rapier)
  const isFinesseEligible = !isRanged && (isLight || weapon.special?.includes('Weapon Finesse eligible'));
  if (isFinesseEligible) {
    const hasWFin = hasFeat(characterFeats, 'Weapon Finesse');
    options.push({
      name: 'Weapon Finesse',
      available: hasWFin,
      disabledReason: hasWFin ? undefined : 'Character does not have Weapon Finesse',
    });
  }

  // Improved Critical — doubles the threat range (melee or ranged); BAB +8, proficiency assumed
  const hasIC = hasFeat(characterFeats, 'Improved Critical');
  const icBabOk = bab >= 8;
  options.push({
    name: 'Improved Critical',
    available: hasIC && icBabOk,
    disabledReason: !hasIC
      ? 'Character does not have Improved Critical'
      : !icBabOk
        ? `BAB +8 required (current: +${bab})`
        : undefined,
  });

  // Rapid Shot handled separately via getRapidShotOption (needs rangerLevel).

  return options;
}

/** Returns Rapid Shot option separately so caller can inject rangerLevel. */
function getRapidShotOption(
  weapon: WeaponLoadout | null,
  characterFeats: FeatSlot[],
  rangerLevel: number,
  dexterity: number,
): FeatOption | null {
  if (!weapon) return null;
  const isRanged = getWeaponAttackClass(weapon.name, weapon.rangeIncrement) === 'Ranged';
  if (!isRanged) return null;
  const hasRS = hasFeat(characterFeats, 'Rapid Shot');
  const rangerQualifies = rangerLevel > 2;
  const dexOk = dexterity >= 13;
  const available = (hasRS || rangerQualifies) && dexOk;
  const disabledReason = !available
    ? (!dexOk
        ? `Dex 13 required (current: ${dexterity})`
        : 'Requires Rapid Shot feat (or Ranger level 3+)')
    : undefined;
  return { name: 'Rapid Shot', available, disabledReason };
}

/** Full weapon feat options including Rapid Shot. */
function getAllWeaponFeatOptions(
  weapon: WeaponLoadout | null,
  characterFeats: FeatSlot[],
  fighterLevel: number,
  rangerLevel: number,
  dexterity: number,
  bab: number,
): FeatOption[] {
  const base = getWeaponFeatOptions(weapon, characterFeats, fighterLevel, bab);
  const rs   = getRapidShotOption(weapon, characterFeats, rangerLevel, dexterity);
  return rs ? [...base, rs] : base;
}

/** Returns the three TWF-mode feats with availability checks. */
function getTwfFeatOptions(params: {
  characterFeats: FeatSlot[];
  bab: number;
  rangerLevel: number;
  twfApplied: boolean;
  itwfApplied: boolean;
  dexterity: number;
}): FeatOption[] {
  const { characterFeats, bab, rangerLevel, twfApplied, itwfApplied } = params;
  const hasTWF  = hasFeat(characterFeats, 'Two-Weapon Fighting');
  const hasITWF = hasFeat(characterFeats, 'Improved Two-Weapon Fighting');
  const hasGTWF = hasFeat(characterFeats, 'Greater Two-Weapon Fighting');

  // TWF: has feat (Dex was met when taking it) OR ranger 2+ (class grants without prerequisites)
  const twfAvail = hasTWF || rangerLevel >= 2;
  const twfReason = !twfAvail
    ? 'Requires Two-Weapon Fighting feat (or Ranger level 2+)'
    : undefined;

  // ITWF: has feat + twf-applied + bab6 (Dex met when taking) OR ranger 6+ with twf-applied (class grants without prerequisites)
  const rangerItwf = rangerLevel >= 6 && twfApplied;
  const itwfByFeat = hasITWF && (twfApplied || rangerLevel >= 2) && bab >= 6;
  const itwfAvail  = itwfByFeat || rangerItwf;
  const itwfReason = !itwfAvail
    ? (!hasITWF && rangerLevel < 6
        ? 'Requires Improved Two-Weapon Fighting feat (or Ranger level 6+)'
        : !twfApplied
          ? 'Two-Weapon Fighting must be applied first'
          : `BAB +6 required (current: +${bab})`)
    : undefined;

  // GTWF: has feat + itwf-applied + bab11 (Dex was met when taking feat)
  const gtwfAvail = hasGTWF && itwfApplied && bab >= 11;
  const gtwfReason = !gtwfAvail
    ? (!hasGTWF
        ? 'Requires Greater Two-Weapon Fighting feat'
        : !itwfApplied
          ? 'Improved Two-Weapon Fighting must be applied first'
          : `BAB +11 required (current: +${bab})`)
    : undefined;

  return [
    { name: 'Two-Weapon Fighting',          available: twfAvail,  disabledReason: twfReason },
    { name: 'Improved Two-Weapon Fighting',  available: itwfAvail, disabledReason: itwfReason },
    { name: 'Greater Two-Weapon Fighting',   available: gtwfAvail, disabledReason: gtwfReason },
  ];
}

function totalArmorBonus(loadout: ArmorLoadout | null): number {
  if (!loadout) return 0;
  return (loadout.armorBonus ?? 0) + (loadout.enhancementBonus ?? 0);
}



function newWeaponFromEntry(entry: WeaponCatalogEntry): WeaponLoadout {
  return {
    name:             entry.name,
    proficiency:      entry.proficiency,
    handedness:       entry.handedness,
    damage:           entry.damageMedium,
    critical:         entry.critical,
    rangeIncrement:   entry.rangeIncrement,
    weight:           entry.weight,
    damageType:       entry.damageType,
    enhancementBonus: 0,
    combatMod:        0,
    special:          entry.special ?? '',
    material:         '',
  };
}

function defaultWeapon(name = ''): WeaponLoadout {
  return {
    name,
    proficiency: 'Simple',
    handedness: 'One-Handed',
    damage: '—',
    critical: '×2',
    rangeIncrement: '—',
    weight: '',
    damageType: '',
    enhancementBonus: 0,
    combatMod: 0,
    special: '',
    material: '',
  };
}

function getArmorSpeedForSize(
  category: ArmorCatalogEntry['category'] | ArmorLoadout['category'],
  size: CharacterDraft['size'],
  race?: CharacterDraft['race'],
): string {
  if (category === 'Shield') return '-';
  // Dwarves move at 20 ft. in all armor — their speed is never reduced by armor.
  if (race === 'Dwarf') return '20 ft.';
  const isSmallMovement = size === 'Small' || size === 'Fine' || size === 'Diminutive' || size === 'Tiny';
  if (category === 'Light Armor') {
    return isSmallMovement ? '20 ft.' : '30 ft.';
  }
  return isSmallMovement ? '15 ft.' : '20 ft.';
}

function newShieldFromEntry(entry: ArmorCatalogEntry, size: CharacterDraft['size'], race?: CharacterDraft['race']): ArmorLoadout {
  return {
    name:              entry.name,
    category:          entry.category,
    armorBonus:        entry.armorBonus,
    enhancementBonus:  0,
    maxDexBonus:       entry.maxDexBonus,
    armorCheckPenalty: entry.armorCheckPenalty,
    arcaneSpellFailure: entry.arcaneSpellFailure,
    speed:             getArmorSpeedForSize(entry.category, size, race),
    weight:            entry.weight,
    armorAdjust:       entry.armorAdjust,
    material:          '',
  };
}

function defaultShield(name = ''): ArmorLoadout {
  return {
    name,
    category: 'Shield',
    armorBonus: 0,
    enhancementBonus: 0,
    maxDexBonus: null,
    armorCheckPenalty: 0,
    arcaneSpellFailure: '',
    speed: '',
    weight: '',
    armorAdjust: 0,
    material: '',
  };
}

function newArmorFromEntry(entry: ArmorCatalogEntry, size: CharacterDraft['size'], race?: CharacterDraft['race']): ArmorLoadout {
  return {
    name:              entry.name,
    category:          entry.category,
    armorBonus:        entry.armorBonus,
    enhancementBonus:  0,
    maxDexBonus:       entry.maxDexBonus,
    armorCheckPenalty: entry.armorCheckPenalty,
    arcaneSpellFailure: entry.arcaneSpellFailure,
    speed:             getArmorSpeedForSize(entry.category, size, race),
    weight:            entry.weight,
    armorAdjust:       entry.armorAdjust,
    material:          '',
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const AC_BONUS_TYPES: AcBonusType[] = [
  'armor', 'shield', 'deflection', 'dodge', 'natural',
  'insight', 'luck', 'sacred', 'profane',
];

const AC_TYPE_LABEL: Record<AcBonusType, string> = {
  armor:      'Armor',
  shield:     'Shield',
  deflection: 'Deflection',
  dodge:      'Dodge *',
  natural:    'Natural',
  insight:    'Insight',
  luck:       'Luck',
  sacred:     'Sacred',
  profane:    'Profane',
};

const SLOTS_BEFORE_BODY: Array<{ key: WornSlotKey; label: string }> = [
  { key: 'head',      label: 'Head' },
  { key: 'face',      label: 'Face' },
  { key: 'neck',      label: 'Neck' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'bodySlot',  label: 'Body' },
];

const SLOTS_AFTER_BODY: Array<{ key: WornSlotKey; label: string }> = [
  { key: 'chest',     label: 'Chest' },
  { key: 'wrists',    label: 'Wrists' },
  { key: 'hands',     label: 'Hands' },
  { key: 'ringLeft',  label: 'Left Ring' },
  { key: 'ringRight', label: 'Right Ring' },
  { key: 'waist',     label: 'Waist' },
  { key: 'feet',      label: 'Feet' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function InventorySection({
  inventory,
  combat,
  derivedBaseAttackBonus,
  derivedMeleeAttackBonus,
  derivedRangedAttackBonus,
  onChange,
  inputStyle,
  size,
  race,
  feats,
  classes,
  dexterity,
}: {
  inventory: Inventory;
  combat: CharacterDraft['combat'];
  derivedBaseAttackBonus: number;
  derivedMeleeAttackBonus: number;
  derivedRangedAttackBonus: number;
  onChange: (inventory: Inventory, combat: CharacterDraft['combat']) => void;
  inputStyle: React.CSSProperties;
  size: CharacterDraft['size'];
  race: CharacterDraft['race'];
  feats: FeatSlot[];
  classes: ClassEntry[];
  /** Effective dexterity score (temp override if set, otherwise total). */
  dexterity: number;
}) {
  const [offHandMode, setOffHandModeState] = useState<'none' | 'weapon' | 'shield'>(
    inventory.offHandWeapon ? 'weapon' : inventory.offHandShield ? 'shield' : 'none',
  );

  const isTwoHanded = inventory.mainHand?.handedness === 'Two-Handed';
  const isTwoWeaponFighting = !isTwoHanded
    && Boolean(inventory.mainHand?.name?.trim())
    && offHandMode === 'weapon'
    && Boolean(inventory.offHandWeapon?.name?.trim());
  const offHandIsLight = inventory.offHandWeapon?.handedness === 'Light';

  // TWF penalties — reduced if Two-Weapon Fighting feat is applied
  const twfAppliedFeats = inventory.twfAppliedFeats ?? [];
  const twfFeatApplied  = twfAppliedFeats.includes('Two-Weapon Fighting');
  const itwfApplied     = twfAppliedFeats.includes('Improved Two-Weapon Fighting');
  const gtwfApplied     = twfAppliedFeats.includes('Greater Two-Weapon Fighting');
  const twfFeatRedMain  = twfFeatApplied ? 2 : 0;
  const twfFeatRedOff   = twfFeatApplied ? 6 : 0;
  const twfMainPenalty  = isTwoWeaponFighting ? (offHandIsLight ? -4 : -6) + twfFeatRedMain : 0;
  const twfOffPenalty   = isTwoWeaponFighting ? (offHandIsLight ? -8 : -10) + twfFeatRedOff : 0;
  // Off-hand max attacks scale with TWF feats
  const offHandMaxAttacks = inventory.mainHand
    ? (gtwfApplied ? 3 : itwfApplied ? 2 : 1)
    : undefined;

  const fighterLevel = getFighterLevel(classes);
  const rangerLevel  = getRangerLevel(classes);
  const mainHandFeatOptions = getAllWeaponFeatOptions(inventory.mainHand, feats, fighterLevel, rangerLevel, dexterity, derivedBaseAttackBonus);
  const offHandFeatOptions  = getAllWeaponFeatOptions(inventory.offHandWeapon, feats, fighterLevel, rangerLevel, dexterity, derivedBaseAttackBonus);
  const backupWeapons = inventory.backupWeapons ?? [];
  const backupWeaponFeatOptions = backupWeapons.map((slot) =>
    getAllWeaponFeatOptions(slot.weapon, feats, fighterLevel, rangerLevel, dexterity, derivedBaseAttackBonus),
  );
  const twfFeatOptions = getTwfFeatOptions({ characterFeats: feats, bab: derivedBaseAttackBonus, rangerLevel, twfApplied: twfFeatApplied, itwfApplied, dexterity });

  const isBodyArmorSelected = Boolean(inventory.body?.name?.trim());
  const isBodySlotEdited = inventory.wornSlots.bodySlot.item.trim().length > 0;
  const showSmallDamage = (
    size === 'Small' || size === 'Fine' || size === 'Diminutive' || size === 'Tiny'
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  function syncArmorClass(
    nextInv: Inventory,
    nextCombat: CharacterDraft['combat'],
  ): CharacterDraft['combat'] {
    const slotEntries = Object.values(nextInv.wornSlots);
    const bestSlot = (t: string) =>
      slotEntries.reduce((best, b) => (b.acType === t ? Math.max(best, b.acBonus) : best), 0);
    return {
      ...nextCombat,
      armorClass: {
        ...nextCombat.armorClass,
        armor:      Math.max(totalArmorBonus(nextInv.body),        bestSlot('armor')),
        shield:     Math.max(totalArmorBonus(nextInv.offHandShield), bestSlot('shield')),
        deflection: bestSlot('deflection'),
        natural:    bestSlot('natural'),
      },
      speed: {
        ...nextCombat.speed,
        armorAdjust: nextInv.body?.armorAdjust ?? 0,
      },
    };
  }

  function attackCalcContext(inv: Inventory) {
    const melee = Number(derivedMeleeAttackBonus);
    const ranged = Number(derivedRangedAttackBonus);
    const bab = Number(derivedBaseAttackBonus);
    const isTH = inv.mainHand?.handedness === 'Two-Handed';
    const hasMain = Boolean(inv.mainHand?.name?.trim());
    const hasOff = Boolean(inv.offHandWeapon?.name?.trim());
    const isTWF = !isTH && hasMain && hasOff;
    const offIsLight = inv.offHandWeapon?.handedness === 'Light';
    const twfFeats = inv.twfAppliedFeats ?? [];
    const twfFeat = twfFeats.includes('Two-Weapon Fighting');
    const itwf = twfFeats.includes('Improved Two-Weapon Fighting');
    const gtwf = twfFeats.includes('Greater Two-Weapon Fighting');
    return {
      melee,
      ranged,
      bab,
      mainPenalty: isTWF ? (offIsLight ? -4 : -6) + (twfFeat ? 2 : 0) : 0,
      offPenalty: isTWF ? (offIsLight ? -8 : -10) + (twfFeat ? 6 : 0) : 0,
      offMaxAttacks: hasMain ? (gtwf ? 3 : itwf ? 2 : 1) : undefined,
    };
  }

  function weaponAttackSignature(
    weapon: WeaponLoadout | null,
    ctx: ReturnType<typeof attackCalcContext>,
    twfPenalty: number,
    maxAtks?: number,
  ): string {
    if (!weapon?.name?.trim()) return '';
    return JSON.stringify({
      name: weapon.name,
      handedness: weapon.handedness,
      rangeIncrement: weapon.rangeIncrement,
      special: weapon.special,
      enhancementBonus: Number(weapon.enhancementBonus ?? 0),
      combatMod: Number(weapon.combatMod ?? 0),
      appliedFeats: [...(weapon.appliedFeats ?? [])].sort(),
      twfPenalty,
      maxAtks,
      bab: ctx.bab,
      melee: ctx.melee,
      ranged: ctx.ranged,
    });
  }

  function computeWeaponAttack(
    weapon: WeaponLoadout,
    ctx: ReturnType<typeof attackCalcContext>,
    twfPenalty: number,
    maxAtks?: number,
  ): string {
    const atk = getWeaponAttackClass(weapon.name, weapon.rangeIncrement);
    const isRanged = atk === 'Ranged';
    const applied = weapon.appliedFeats ?? [];
    const finesse = !isRanged && (weapon.handedness === 'Light' || weapon.special?.includes('Weapon Finesse eligible')) && applied.includes('Weapon Finesse');
    const rapidShot = isRanged && applied.includes('Rapid Shot');
    const primaryBonus = isRanged ? ctx.ranged : (finesse ? ctx.ranged : ctx.melee);
    const featBonus = (applied.includes('Weapon Focus') ? 1 : 0) + (applied.includes('Greater Weapon Focus') ? 1 : 0);
    return buildIterativeAttackString(
      primaryBonus,
      ctx.bab,
      Number(weapon.enhancementBonus ?? 0),
      Number(weapon.combatMod ?? 0),
      maxAtks,
      twfPenalty,
      featBonus,
      rapidShot,
    );
  }

  function stampComputedAttacks(previousInv: Inventory, nextInv: Inventory, forceRecompute = false): Inventory {
    const prevCtx = attackCalcContext(previousInv);
    const nextCtx = attackCalcContext(nextInv);

    function applyToWeapon(
      prevWeapon: WeaponLoadout | null,
      nextWeapon: WeaponLoadout | null,
      prevTwfPenalty: number,
      nextTwfPenalty: number,
      prevMaxAtks?: number,
      nextMaxAtks?: number,
    ): WeaponLoadout | null {
      if (!nextWeapon?.name?.trim()) return nextWeapon;
      const hasStored = Boolean(nextWeapon.computedAttack?.trim());
      const prevSig = weaponAttackSignature(prevWeapon, prevCtx, prevTwfPenalty, prevMaxAtks);
      const nextSig = weaponAttackSignature(nextWeapon, nextCtx, nextTwfPenalty, nextMaxAtks);
      const shouldRecompute = forceRecompute || !hasStored || prevSig !== nextSig;
      if (!shouldRecompute) return nextWeapon;
      return { ...nextWeapon, computedAttack: computeWeaponAttack(nextWeapon, nextCtx, nextTwfPenalty, nextMaxAtks) };
    }

    return {
      ...nextInv,
      mainHand: applyToWeapon(
        previousInv.mainHand,
        nextInv.mainHand,
        prevCtx.mainPenalty,
        nextCtx.mainPenalty,
        undefined,
        undefined,
      ),
      offHandWeapon: applyToWeapon(
        previousInv.offHandWeapon,
        nextInv.offHandWeapon,
        prevCtx.offPenalty,
        nextCtx.offPenalty,
        prevCtx.offMaxAttacks,
        nextCtx.offMaxAttacks,
      ),
      backupWeapons: (nextInv.backupWeapons ?? []).map((slot, idx) => ({
        ...slot,
        weapon: applyToWeapon(
          previousInv.backupWeapons?.[idx]?.weapon ?? null,
          slot.weapon,
          0,
          0,
          undefined,
          undefined,
        ),
      })),
    };
  }

  function updateInventory(partial: Partial<Inventory>, options?: { forceRecompute?: boolean }) {
    const merged = { ...inventory, ...partial };
    const nextInv = stampComputedAttacks(inventory, merged, options?.forceRecompute === true);
    onChange(nextInv, syncArmorClass(nextInv, combat));
  }

  // ── Body (armor) ───────────────────────────────────────────────────────────

  function handleBodySelect(name: string, entry?: ArmorCatalogEntry) {
    if (!name.trim()) { updateInventory({ body: null }); return; }
    const nextWornSlots = { ...inventory.wornSlots };
    nextWornSlots.bodySlot = { item: '', weight: '', acType: '', acBonus: 0 };
    const clearBodySlotFields: Pick<Inventory, 'wornSlots'> = {
      wornSlots: nextWornSlots,
    };
    if (entry) {
      updateInventory({ body: newArmorFromEntry(entry, size, race), ...clearBodySlotFields });
      return;
    }
    const existing = inventory.body ?? newArmorFromEntry({
      name: '', category: 'Light Armor', armorBonus: 0, maxDexBonus: null,
      armorCheckPenalty: 0, arcaneSpellFailure: '', speed: '', weight: '', armorAdjust: 0,
    }, size, race);
    updateInventory({ body: { ...existing, name }, ...clearBodySlotFields });
  }

  function updateBodyField(field: keyof ArmorLoadout, value: string | number | null) {
    const base = inventory.body ?? defaultShield();
    const next = { ...base, [field]: value } as ArmorLoadout;
    if (field === 'name' && typeof value === 'string' && !value.trim()) {
      updateInventory({ body: null }); return;
    }
    if (field === 'material') {
      const mat = typeof value === 'string' && value ? MATERIALS[value as MaterialKey] : undefined;
      const effectiveCategory = applyArmorCategoryShift(base.category, mat?.categoryShift ?? 0);
      next.speed = getArmorSpeedForSize(effectiveCategory, size, race);
    }
    updateInventory({ body: next });
  }

  // ── Main-hand ──────────────────────────────────────────────────────────────

  function handleMainHandSelect(name: string, entry?: WeaponCatalogEntry) {
    if (!name.trim()) { updateInventory({ mainHand: null }); return; }
    const weapon = entry
      ? { ...newWeaponFromEntry(entry), damage: showSmallDamage ? entry.damageSmall : entry.damageMedium }
      : { ...(inventory.mainHand ?? defaultWeapon()), name };
    const isTH = weapon.handedness === 'Two-Handed';
    if (isTH) setOffHandModeState('none');
    updateInventory({ mainHand: weapon, ...(isTH ? { offHandWeapon: null, offHandShield: null } : {}) });
  }

  function updateMainHandField(field: keyof WeaponLoadout, value: string | number) {
    const base = inventory.mainHand ?? defaultWeapon();
    const next = { ...base, [field]: value } as WeaponLoadout;
    if (field === 'material' && value === 'masterwork' && (base.enhancementBonus ?? 0) === 0) {
      next.enhancementBonus = 1;
    }
    if (field === 'name' && typeof value === 'string' && !value.trim()) {
      updateInventory({ mainHand: null }); return;
    }
    const isTH = (field === 'handedness' ? value : base.handedness) === 'Two-Handed';
    if (isTH) setOffHandModeState('none');
    updateInventory({ mainHand: next, ...(isTH ? { offHandWeapon: null, offHandShield: null } : {}) });
  }

  // ── Off-hand ───────────────────────────────────────────────────────────────

  function setOffHandMode(mode: 'none' | 'weapon' | 'shield') {
    setOffHandModeState(mode);
    if (mode === 'none')   { updateInventory({ offHandWeapon: null, offHandShield: null }); }
    if (mode === 'weapon') { updateInventory({ offHandShield: null }); }
    if (mode === 'shield') { updateInventory({ offHandWeapon: null }); }
  }

  function handleOffHandWeaponSelect(name: string, entry?: WeaponCatalogEntry) {
    if (!name.trim()) { updateInventory({ offHandWeapon: null }); return; }
    updateInventory({
      offHandWeapon: entry
        ? { ...newWeaponFromEntry(entry), damage: showSmallDamage ? entry.damageSmall : entry.damageMedium }
        : { ...(inventory.offHandWeapon ?? defaultWeapon()), name },
    });
  }

  function updateOffHandWeaponField(field: keyof WeaponLoadout, value: string | number) {
    const base = inventory.offHandWeapon ?? defaultWeapon();
    const next = { ...base, [field]: value } as WeaponLoadout;
    if (field === 'material' && value === 'masterwork' && (base.enhancementBonus ?? 0) === 0) {
      next.enhancementBonus = 1;
    }
    if (field === 'name' && typeof value === 'string' && !value.trim()) { updateInventory({ offHandWeapon: null }); return; }
    updateInventory({ offHandWeapon: next });
  }

  function addBackupWeapon() {
    if (backupWeapons.length >= 3) return;
    updateInventory({
      backupWeapons: [
        ...backupWeapons,
        { label: 'Weapon', weapon: null },
      ],
    });
  }

  function removeBackupWeapon(index: number) {
    updateInventory({
      backupWeapons: backupWeapons.filter((_, idx) => idx !== index),
    });
  }

  function updateBackupWeaponLabel(index: number, label: string) {
    updateInventory({
      backupWeapons: backupWeapons.map((slot, idx) => (
        idx === index ? { ...slot, label } : slot
      )),
    });
  }

  function handleBackupWeaponSelect(index: number, name: string, entry?: WeaponCatalogEntry) {
    const nextWeapon = !name.trim()
      ? null
      : entry
        ? { ...newWeaponFromEntry(entry), damage: showSmallDamage ? entry.damageSmall : entry.damageMedium }
        : { ...(backupWeapons[index]?.weapon ?? defaultWeapon()), name };

    updateInventory({
      backupWeapons: backupWeapons.map((slot, idx) => (
        idx === index ? { ...slot, weapon: nextWeapon } : slot
      )),
    });
  }

  function updateBackupWeaponField(index: number, field: keyof WeaponLoadout, value: string | number) {
    const base = backupWeapons[index]?.weapon ?? defaultWeapon();
    const next = { ...base, [field]: value } as WeaponLoadout;
    if (field === 'material' && value === 'masterwork' && (base.enhancementBonus ?? 0) === 0) {
      next.enhancementBonus = 1;
    }
    const nextWeapon = (field === 'name' && typeof value === 'string' && !value.trim()) ? null : next;
    updateInventory({
      backupWeapons: backupWeapons.map((slot, idx) => (
        idx === index ? { ...slot, weapon: nextWeapon } : slot
      )),
    });
  }

  function toggleBackupWeaponFeat(index: number, featName: string) {
    const weapon = backupWeapons[index]?.weapon;
    if (!weapon) return;
    const cur = weapon.appliedFeats ?? [];
    const isApplied = cur.includes(featName);
    const next = isApplied ? cur.filter((f) => f !== featName) : [...cur, featName];
    const updatedCritical = featName === 'Improved Critical'
      ? (isApplied ? halveThreatRange(weapon.critical ?? '') : doubleThreatRange(weapon.critical ?? ''))
      : weapon.critical;
    updateInventory({
      backupWeapons: backupWeapons.map((slot, idx) => (
        idx === index ? { ...slot, weapon: { ...weapon, appliedFeats: next, critical: updatedCritical } } : slot
      )),
    });
  }

  const previousDerivedRef = useRef<{ bab: number; melee: number; ranged: number } | null>(null);
  useEffect(() => {
    const next = {
      bab: Number(derivedBaseAttackBonus ?? 0),
      melee: Number(derivedMeleeAttackBonus ?? 0),
      ranged: Number(derivedRangedAttackBonus ?? 0),
    };
    if (previousDerivedRef.current == null) {
      previousDerivedRef.current = next;
      return;
    }
    if (
      previousDerivedRef.current.bab === next.bab
      && previousDerivedRef.current.melee === next.melee
      && previousDerivedRef.current.ranged === next.ranged
    ) {
      return;
    }
    previousDerivedRef.current = next;

    updateInventory({}, { forceRecompute: true });
    // updateInventory is stable but not wrapped in useCallback at the call site;
    // the intent is to only rerun when derived attack bonuses change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedBaseAttackBonus, derivedMeleeAttackBonus, derivedRangedAttackBonus]);

  function handleOffHandShieldSelect(name: string, entry?: ArmorCatalogEntry) {
    if (!name.trim()) { updateInventory({ offHandShield: null }); return; }
    updateInventory({ offHandShield: entry ? newShieldFromEntry(entry, size, race) : { ...(inventory.offHandShield ?? defaultShield()), name } });
  }

  useEffect(() => {
    const nextPartial: Partial<Inventory> = {};
    let changed = false;

    if (inventory.body?.name) {
      const bodyMat = inventory.body.material ? MATERIALS[inventory.body.material as MaterialKey] : undefined;
      const effectiveCategory = applyArmorCategoryShift(inventory.body.category, bodyMat?.categoryShift ?? 0);
      const expectedSpeed = getArmorSpeedForSize(effectiveCategory, size, race);
      if (inventory.body.speed !== expectedSpeed) {
        nextPartial.body = { ...inventory.body, speed: expectedSpeed };
        changed = true;
      }
    }

    if (inventory.offHandShield?.name) {
      const expectedSpeed = getArmorSpeedForSize(inventory.offHandShield.category, size, race);
      if (inventory.offHandShield.speed !== expectedSpeed) {
        nextPartial.offHandShield = { ...inventory.offHandShield, speed: expectedSpeed };
        changed = true;
      }
    }

    if (changed) {
      updateInventory(nextPartial);
    }
    // inventory.body / offHandShield / updateInventory intentionally omitted —
    // this effect only recalculates speed when size or race changes, not on
    // every inventory write (which would cause an infinite loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, race]);

  function updateOffHandShieldField(field: keyof ArmorLoadout, value: string | number | null) {
    const base = inventory.offHandShield ?? defaultShield();
    const next = { ...base, [field]: value } as ArmorLoadout;
    if (field === 'name' && typeof value === 'string' && !value.trim()) { updateInventory({ offHandShield: null }); return; }
    updateInventory({ offHandShield: next });
  }

  // ── Feat toggle handlers ───────────────────────────────────────────────────

  function toggleMainHandFeat(featName: string) {
    if (!inventory.mainHand) return;
    const cur = inventory.mainHand.appliedFeats ?? [];
    const isApplied = cur.includes(featName);
    const next = isApplied ? cur.filter((f) => f !== featName) : [...cur, featName];
    const updatedCritical = featName === 'Improved Critical'
      ? (isApplied ? halveThreatRange(inventory.mainHand.critical ?? '') : doubleThreatRange(inventory.mainHand.critical ?? ''))
      : inventory.mainHand.critical;
    updateInventory({ mainHand: { ...inventory.mainHand, appliedFeats: next, critical: updatedCritical } });
  }

  function toggleOffHandFeat(featName: string) {
    if (!inventory.offHandWeapon) return;
    const cur = inventory.offHandWeapon.appliedFeats ?? [];
    const isApplied = cur.includes(featName);
    const next = isApplied ? cur.filter((f) => f !== featName) : [...cur, featName];
    const updatedCritical = featName === 'Improved Critical'
      ? (isApplied ? halveThreatRange(inventory.offHandWeapon.critical ?? '') : doubleThreatRange(inventory.offHandWeapon.critical ?? ''))
      : inventory.offHandWeapon.critical;
    updateInventory({ offHandWeapon: { ...inventory.offHandWeapon, appliedFeats: next, critical: updatedCritical } });
  }

  function toggleTwfFeat(featName: string) {
    const cur = inventory.twfAppliedFeats ?? [];
    const next = cur.includes(featName) ? cur.filter((f) => f !== featName) : [...cur, featName];
    updateInventory({ twfAppliedFeats: next });
  }

  // ── Worn slot updates ──────────────────────────────────────────────────────

  function updateWornSlot(slot: WornSlotKey, partial: Partial<WornSlot>) {
    const next = { ...inventory.wornSlots };
    next[slot] = { ...next[slot], ...partial };
    updateInventory({ wornSlots: next });
  }

  // Inline renderer for a slot row (4 grid cells: label | item | type | value)
  function renderSlotRow(key: WornSlotKey, label: string) {
    const slot = inventory.wornSlots[key];
    const disableBodySlot = key === 'bodySlot' && isBodyArmorSelected;
    return (
      <Fragment key={key}>
        <label className="inventory-slot-label" htmlFor={`inv-${key}`}>{label}</label>
        <input
          id={`inv-${key}`}
          type="text"
          className="inventory-slot-input"
          value={slot.item}
          onChange={(e) => updateWornSlot(key, { item: e.target.value })}
          disabled={disableBodySlot}
        />
        <input
          type="text"
          className="inventory-slot-weight"
          value={slot.weight ?? ''}
          onChange={(e) => updateWornSlot(key, { weight: e.target.value })}
          aria-label={`${label} weight`}
          placeholder="—"
          disabled={disableBodySlot}
        />
        <select
          className="inventory-slot-bonus-type"
          value={slot.acType}
          onChange={(e) => {
            const t = e.target.value;
            if (!t) { updateWornSlot(key, { acType: '', acBonus: 0 }); }
            else { updateWornSlot(key, { acType: t as AcBonusType, acBonus: slot.acBonus || 1 }); }
          }}
          aria-label={`${label} AC bonus type`}
          disabled={disableBodySlot}
        >
          <option value="">—</option>
          {AC_BONUS_TYPES.map((t) => (
            <option key={t} value={t}>{AC_TYPE_LABEL[t]}</option>
          ))}
        </select>
        {slot.acType ? (
          <input
            type="number"
            min={0}
            className="inventory-slot-bonus-value"
            value={slot.acBonus}
            onChange={(e) => updateWornSlot(key, { acBonus: Number(e.target.value) })}
            aria-label={`${label} AC bonus value`}
            disabled={disableBodySlot}
          />
        ) : (
          <span />
        )}
      </Fragment>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const body     = inventory.body;
  const mainHand = inventory.mainHand;
  const offWeapon = inventory.offHandWeapon;
  const offShield = inventory.offHandShield;

  return (
    <div className="inventory-section">
      {/* ── 1. Weapons ── */}
      <section className="flex flex-col gap-2 pb-4 border-b border-[var(--color-fg-subtle)]">
        <p className="subsection-header">Weapons</p>
        <WeaponSelector
          title="Main Hand"
          weapon={mainHand}
          baseAttackBonus={derivedBaseAttackBonus}
          meleeAttackBonus={derivedMeleeAttackBonus}
          rangedAttackBonus={derivedRangedAttackBonus}
          rowClass="inventory-hands-row-even"
          inputStyle={inputStyle}
          onSelect={handleMainHandSelect}
          onFieldChange={updateMainHandField}
          onClear={() => updateInventory({ mainHand: null })}
          twoWeaponPenalty={twfMainPenalty}
          featControl={(
            <FeatPopupButton
              options={mainHandFeatOptions}
              applied={mainHand?.appliedFeats ?? []}
              onToggle={toggleMainHandFeat}
            />
          )}
        />

        <div className="inventory-weapon-selector">
          <div className="inventory-weapon-selector-header">
            {!isTwoHanded && (
              <div className="inventory-offhand-mode">
                {(['shield', 'weapon', 'none'] as const).map((mode) => (
                  <label key={mode}>
                    <input
                      type="radio"
                      name="offhand-mode"
                      value={mode}
                      checked={offHandMode === mode}
                      onChange={() => setOffHandMode(mode)}
                    />
                    {mode === 'none' ? 'Empty' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </label>
                ))}
                {offHandMode === 'weapon' && isTwoWeaponFighting && (
                  <>
                    <span className="inventory-offhand-mode-sep" aria-hidden>|</span>
                    <span className="inventory-offhand-mode-twf-summary">
                      Primary{' '}
                      <strong>{twfMainPenalty >= 0 ? `+${twfMainPenalty}` : twfMainPenalty}</strong>
                      {' / '}off-hand{' '}
                      <strong>{twfOffPenalty >= 0 ? `+${twfOffPenalty}` : twfOffPenalty}</strong>
                      {offHandIsLight ? '\u00a0(light)' : '\u00a0(one-handed)'}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          {isTwoHanded ? (
            <span className="inventory-two-handed-note">
              Off-hand unavailable — two-handed weapon in main hand.
            </span>
          ) : offHandMode === 'weapon' ? (
            <WeaponSelector
              title="Off-Hand"
              weapon={offWeapon}
              baseAttackBonus={derivedBaseAttackBonus}
              meleeAttackBonus={derivedMeleeAttackBonus}
              rangedAttackBonus={derivedRangedAttackBonus}
              rowClass="inventory-hands-row-even"
              inputStyle={inputStyle}
              onSelect={handleOffHandWeaponSelect}
              onFieldChange={updateOffHandWeaponField}
              onClear={() => updateInventory({ offHandWeapon: null })}
              allowTwoHanded={false}
              entries={OFF_HAND_WEAPON_CATALOG}
              maxAttacks={offHandMaxAttacks}
              twoWeaponPenalty={twfOffPenalty}
              featControl={(
                <FeatPopupButton
                  options={offHandFeatOptions}
                  applied={offWeapon?.appliedFeats ?? []}
                  onToggle={toggleOffHandFeat}
                />
              )}
              extraControl={(
                <FeatPopupButton
                  options={twfFeatOptions}
                  applied={twfAppliedFeats}
                  onToggle={toggleTwfFeat}
                />
              )}
            />
          ) : offHandMode === 'shield' ? (
            <ShieldRow
              shield={offShield}
              inputStyle={inputStyle}
              onSelect={handleOffHandShieldSelect}
              onFieldChange={updateOffHandShieldField}
              onClear={() => updateInventory({ offHandShield: null })}
            />
          ) : (
            <div className="inventory-hands-wrap">
              <table className="inventory-hands-table" aria-label="Off-hand weapon">
                <thead className='inventory-hands-thead'>
                  <tr>
                    <th className='inventory-hands-th'>Off-Hand</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="inventory-hands-row-even">
                    <td className="inventory-hands-td inventory-help">No off-hand weapon selected.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
   
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              className="inventory-add-weapon-btn"
              onClick={addBackupWeapon}
              disabled={backupWeapons.length >= 3}
            >
              <span aria-hidden>+</span>
              <svg fill="currentColor" viewBox="0 0 32 32" width="14" height="14" aria-hidden xmlns="http://www.w3.org/2000/svg">
                <path d="M0.857 28.712l0.949-0.949 2.525 2.525-0.949 0.949-2.525-2.525zM14.057 20.781c0-1.516-1.23-2.746-2.746-2.746s-2.746 1.23-2.746 2.746c0 1.516 1.229 2.746 2.746 2.746s2.747-1.229 2.746-2.746zM8.577 21.043l-0.025-0.025-5.198 5.198 2.525 2.525 5.198-5.198-0.029-0.029c-1.307-0.125-2.347-1.164-2.471-2.471zM8.564 20.781c0-1.422 1.082-2.592 2.467-2.732-1.46-1.66-2.757-3.465-3.87-5.394l-3.486 3.486 4.902 4.902c-0.008-0.086-0.013-0.174-0.013-0.262zM14.043 21.061c-0.14 1.385-1.31 2.467-2.732 2.466-0.089-0-0.176-0.005-0.263-0.013l4.908 4.908 3.486-3.486c-1.939-1.12-3.745-2.419-5.4-3.875zM25.484 2.332l-13.219 13.219c0.204 0.301 0.335 0.669 0.335 1.057 0 0.601-0.287 1.139-0.73 1.484 1.085 0.225 1.935 1.090 2.139 2.182 0.344-0.457 0.891-0.754 1.502-0.754 0.388 0 0.735 0.11 1.031 0.309l13.219-13.219 0.928-5.205-5.205 0.928zM1.311 27.268l3.517 3.517 1.547-1.547-3.517-3.517-1.547 1.547z" />
              </svg>
              Add Weapon
            </button>
            <span className="inventory-help">{backupWeapons.length}/3 backup weapons</span>
          </div>
        </div>
        {backupWeapons.map((slot, idx) => (
          <WeaponSelector
            key={`backup-weapon-${idx}`}
            title={slot.label}
            editableTitle
            onTitleChange={(nextTitle) => updateBackupWeaponLabel(idx, nextTitle)}
            weapon={slot.weapon}
            baseAttackBonus={derivedBaseAttackBonus}
            meleeAttackBonus={derivedMeleeAttackBonus}
            rangedAttackBonus={derivedRangedAttackBonus}
            rowClass={idx % 2 === 0 ? 'inventory-hands-row-even' : 'inventory-hands-row-odd'}
            inputStyle={inputStyle}
            onSelect={(name, entry) => handleBackupWeaponSelect(idx, name, entry)}
            onFieldChange={(field, value) => updateBackupWeaponField(idx, field, value)}
            onClear={() => handleBackupWeaponSelect(idx, '')}
            onRemove={() => removeBackupWeapon(idx)}
            featControl={(
              <FeatPopupButton
                options={backupWeaponFeatOptions[idx] ?? []}
                applied={slot.weapon?.appliedFeats ?? []}
                onToggle={(name) => toggleBackupWeaponFeat(idx, name)}
              />
            )}
          />
        ))}

      </section>

      {/* ── 2. Armor ── */}
      <section className="flex flex-col gap-2 pb-4 border-b border-[var(--color-fg-subtle)]">
        <p className="subsection-header">Armor</p>
        <div className="inventory-hands-wrap">
          <table className="inventory-hands-table" aria-label="Armor slots">
            <thead className="inventory-hands-thead">
              <tr>
                {['Armor', 'Material', 'Base\u00a0AC', 'Enh', 'Total', 'Max\u00a0Dex', 'ACP', 'ASF', 'Speed', 'Wt', ''].map((h) => (
                  <th key={h} className="inventory-hands-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <ArmorRow
                label="Body"
                armor={body}
                rowClass="inventory-hands-row-even"
                entries={ARMOR_ENTRIES}
                inputStyle={inputStyle}
                onSelect={handleBodySelect}
                onFieldChange={updateBodyField}
                onClear={() => updateInventory({ body: null })}
                disabled={isBodySlotEdited}
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 3. Worn Slots ── */}
      <div className='flex flex-col gap-2'>
        <p className="subsection-header">Worn Slots</p>
        <p className="inventory-help">
          Items can grant bonuses to AC — select a type and value for each slot.
          {' '}* Dodge bonuses stack with each other; all other types apply only the highest.
        </p>
        <div className="inventory-slots-grid">
          <span className="inventory-slots-col-header" />
          <span className="inventory-slots-col-header">Item</span>
          <span className="inventory-slots-col-header">Weight</span>
          <span className="inventory-slots-col-header">AC Bonus Type</span>
          <span className="inventory-slots-col-header">Value</span>

          {SLOTS_BEFORE_BODY.map(({ key, label }) => renderSlotRow(key, label))}

          {SLOTS_AFTER_BODY.map(({ key, label }) => renderSlotRow(key, label))}
        </div>
      </div>

    </div>
  );
}

// ── ArmorRow sub-component ────────────────────────────────────────────────────

function ArmorRow({
  label,
  armor,
  rowClass,
  entries,
  inputStyle,
  onSelect,
  onFieldChange,
  onClear,
  disabled = false,
}: {
  label: string;
  armor: ArmorLoadout | null;
  rowClass: string;
  entries: ReadonlyArray<ArmorCatalogEntry>;
  inputStyle: React.CSSProperties;
  onSelect: (name: string, entry?: ArmorCatalogEntry) => void;
  onFieldChange: (field: keyof ArmorLoadout, value: string | number | null) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const mat = armor?.material ? MATERIALS[armor.material as MaterialKey] : undefined;
  const effectiveCategory = armor != null ? applyArmorCategoryShift(armor.category, mat?.categoryShift ?? 0) : null;
  const effectiveAcp    = armor != null ? applyAcpDelta(armor.armorCheckPenalty, mat?.acpDelta ?? 0) : null;
  const effectiveAsf    = armor != null ? applyAsfDelta(armor.arcaneSpellFailure, mat?.asfDelta ?? 0) : null;
  const effectiveMaxDex = armor != null ? applyMaxDexDelta(armor.maxDexBonus, mat?.maxDexDelta ?? 0) : null;
  const effectiveWeight = armor != null ? applyWeightMultiplier(armor.weight, mat?.weightMultiplier ?? 1) : null;
  return (
    <tr className={rowClass}>
      <td className="inventory-hands-td">
        <ArmorAutocomplete
          value={armor?.name ?? ''}
          entries={entries}
          onSelect={(name, entry) => {
            if (disabled) return;
            onSelect(name, entry);
          }}
          placeholder="Select armor..."
          ariaLabel={`${label} armor selection`}
          style={{ ...inputStyle, minWidth: 160 }}
        />
      </td>
      <td className="inventory-hands-td">
        <select
          value={armor?.material ?? ''}
          onChange={(e) => onFieldChange('material', e.target.value)}
          className="inventory-hands-input inventory-hands-input--material"
          aria-label="Armor material"
          disabled={!armor || disabled}
          title={mat?.note}
        >
          <option value="">Standard</option>
          {ARMOR_MATERIAL_KEYS.map((k) => (
            <option key={k} value={k}>{MATERIALS[k].label}</option>
          ))}
        </select>
      </td>
      <td className="inventory-hands-td inventory-hands-stat">
        {armor != null ? armor.armorBonus : '—'}
      </td>
      <td className="inventory-hands-td">
        <input
          type="number"
          value={armor?.enhancementBonus ?? 0}
          onChange={(e) => onFieldChange('enhancementBonus', Number(e.target.value))}
          className="inventory-hands-input inventory-hands-input--number"
          aria-label="Enhancement bonus"
          disabled={!armor || disabled}
        />
      </td>
      <td className="inventory-hands-td inventory-hands-atk">
        {armor != null ? `+${totalArmorBonus(armor)}` : '—'}
      </td>
      <td className="inventory-hands-td inventory-hands-stat">
        {effectiveMaxDex ?? '—'}
      </td>
      <td className="inventory-hands-td inventory-hands-stat">
        {effectiveAcp ?? '—'}
      </td>
      <td className="inventory-hands-td inventory-hands-stat">{effectiveAsf ?? '—'}</td>
      <td className="inventory-hands-td inventory-hands-stat">{armor?.speed || '—'}{effectiveCategory && effectiveCategory !== armor?.category ? <span className="inventory-hands-category-note"> ({effectiveCategory})</span> : null}</td>
      <td className="inventory-hands-td inventory-hands-stat">{effectiveWeight ?? '—'}</td>
      <td className="inventory-hands-td">
        {armor != null && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="inventory-hands-clear"
            aria-label="Clear armor"
          >
            Clear
          </button>
        )}
      </td>
    </tr>
  );
}

// ── ShieldRow sub-component ───────────────────────────────────────────────────

function ShieldRow({
  shield,
  inputStyle,
  onSelect,
  onFieldChange,
  onClear,
}: {
  shield: ArmorLoadout | null;
  inputStyle: React.CSSProperties;
  onSelect: (name: string, entry?: ArmorCatalogEntry) => void;
  onFieldChange: (field: keyof ArmorLoadout, value: string | number | null) => void;
  onClear: () => void;
}) {
  const mat = shield?.material ? MATERIALS[shield.material as MaterialKey] : undefined;
  const effectiveAcp    = shield != null ? applyAcpDelta(shield.armorCheckPenalty, mat?.acpDelta ?? 0) : null;
  const effectiveAsf    = shield != null ? applyAsfDelta(shield.arcaneSpellFailure, mat?.asfDelta ?? 0) : null;
  const effectiveWeight = shield != null ? applyWeightMultiplier(shield.weight, mat?.weightMultiplier ?? 1) : null;
  return (
    <div className="inventory-hands-wrap">
      <table className="inventory-hands-table" aria-label="Shield slot">
        <thead className="inventory-hands-thead">
          <tr>
            {['Shield', 'Material', 'Base\u00a0AC', 'Enh', 'Total', 'Max\u00a0Dex', 'ACP', 'ASF', 'Speed', 'Wt', ''].map((h) => (
              <th key={h} className="inventory-hands-th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="inventory-hands-row-even">
            <td className="inventory-hands-td">
              <ArmorAutocomplete
                value={shield?.name ?? ''}
                entries={SHIELD_ENTRIES}
                onSelect={onSelect}
                placeholder="Select shield..."
                ariaLabel="Off-hand shield selection"
                style={{ ...inputStyle, minWidth: 160 }}
              />
            </td>
            <td className="inventory-hands-td">
              <select
                value={shield?.material ?? ''}
                onChange={(e) => onFieldChange('material', e.target.value)}
                className="inventory-hands-input inventory-hands-input--material"
                aria-label="Shield material"
                disabled={!shield}
                title={mat?.note}
              >
                <option value="">Standard</option>
                {ARMOR_MATERIAL_KEYS.map((k) => (
                  <option key={k} value={k}>{MATERIALS[k].label}</option>
                ))}
              </select>
            </td>
            <td className="inventory-hands-td inventory-hands-stat">
              {shield != null ? shield.armorBonus : '—'}
            </td>
            <td className="inventory-hands-td">
              <input
                type="number"
                value={shield?.enhancementBonus ?? 0}
                onChange={(e) => onFieldChange('enhancementBonus', Number(e.target.value))}
                className="inventory-hands-input inventory-hands-input--number"
                aria-label="Shield enhancement bonus"
                disabled={!shield}
              />
            </td>
            <td className="inventory-hands-td inventory-hands-atk">
              {shield != null ? `+${totalArmorBonus(shield)}` : '—'}
            </td>
            <td className="inventory-hands-td inventory-hands-stat">
              {shield?.maxDexBonus ?? '—'}
            </td>
            <td className="inventory-hands-td inventory-hands-stat">
              {effectiveAcp ?? '—'}
            </td>
            <td className="inventory-hands-td inventory-hands-stat">{effectiveAsf ?? '—'}</td>
            <td className="inventory-hands-td inventory-hands-stat">—</td>
            <td className="inventory-hands-td inventory-hands-stat">{effectiveWeight ?? '—'}</td>
            <td className="inventory-hands-td">
              {shield != null && (
                <button
                  type="button"
                  onClick={onClear}
                  className="inventory-hands-clear"
                  aria-label="Clear shield"
                >
                  Clear
                </button>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── FeatPopup ─────────────────────────────────────────────────────────────────

function FeatPopup({
  options,
  applied,
  onToggle,
  onClose,
  anchorEl,
}: {
  options: FeatOption[];
  applied: string[];
  onToggle: (name: string) => void;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (anchorEl && ref.current) {
      const rect = anchorEl.getBoundingClientRect();
      ref.current.style.top = `${rect.bottom + 4}px`;
      ref.current.style.left = `${rect.left}px`;
    }
  }, [anchorEl]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node) && e.target !== anchorEl) {
        onClose();
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [onClose, anchorEl]);

  return createPortal(
    <div
      ref={ref}
      className="weapon-feat-popup"
    >
      {options.map((opt) => (
        <label
          key={opt.name}
          className={`weapon-feat-popup-item${!opt.available ? ' weapon-feat-popup-item--disabled' : ''}`}
          title={opt.disabledReason}
        >
          <input
            type="checkbox"
            checked={applied.includes(opt.name)}
            disabled={!opt.available}
            onChange={() => onToggle(opt.name)}
          />
          <span>{opt.name}</span>
        </label>
      ))}
    </div>,
    document.body,
  );
}

// ── FeatPopupButton ───────────────────────────────────────────────────────────

function FeatPopupButton({
  options,
  applied,
  onToggle,
}: {
  options: FeatOption[];
  applied: string[];
  onToggle: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const activeNames = options.filter((o) => applied.includes(o.name)).map((o) => o.name);
  const summary = activeNames.length > 0 ? activeNames.join(', ') : 'none';

  function handleToggle() {
    if (!open) setAnchorEl(triggerRef.current);
    setOpen((v) => !v);
  }

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        className="inventory-feat-trigger"
        onClick={handleToggle}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleToggle()}
        aria-expanded={open}
      >
        <span className={`inventory-hands-detail-value inventory-feat-summary${activeNames.length > 0 ? ' inventory-feat-summary--active' : ''}`}>
          {summary}
        </span>
      </span>
      {open && (
        <FeatPopup
          options={options}
          applied={applied}
          onToggle={onToggle}
          onClose={() => setOpen(false)}
          anchorEl={anchorEl}
        />
      )}
    </>
  );
}

