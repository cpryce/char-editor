import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import type { CharacterDraft, ArmorLoadout, WeaponLoadout, Inventory, AcBonusType, WornSlot, WornSlotKey, FeatSlot, ClassEntry } from '../../types/character';
import { ArmorAutocomplete } from '../../components/ArmorAutocomplete';
import { WeaponAutocomplete } from '../../components/WeaponAutocomplete';
import type { ArmorCatalogEntry } from '../../data/armor';
import { ARMOR_ENTRIES, SHIELD_ENTRIES } from '../../data/armor';
import type { WeaponCatalogEntry } from '../../data/weapons';
import { WEAPON_CATALOG, getWeaponAttackClass } from '../../data/weapons';
import { buildIterativeAttackString } from '../../utils/characterHelpers';

/** Weapons usable in the off-hand: Light and One-Handed only. */
const OFF_HAND_WEAPON_CATALOG = WEAPON_CATALOG.filter((w) => w.handedness !== 'Two-Handed');
import type { MaterialKey } from '../../data/materials';
import { MATERIALS, ARMOR_MATERIAL_KEYS, WEAPON_MATERIAL_KEYS, applyWeightMultiplier, applyAcpDelta, applyAsfDelta, applyMaxDexDelta } from '../../data/materials';
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
): FeatOption[] {
  const base = getWeaponFeatOptions(weapon, characterFeats, fighterLevel);
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
  const { characterFeats, bab, rangerLevel, twfApplied, itwfApplied, dexterity } = params;
  const hasTWF  = hasFeat(characterFeats, 'Two-Weapon Fighting');
  const hasITWF = hasFeat(characterFeats, 'Improved Two-Weapon Fighting');
  const hasGTWF = hasFeat(characterFeats, 'Greater Two-Weapon Fighting');

  // TWF: (feat OR ranger 3+) AND Dex 15
  const twfDexOk = dexterity >= 15;
  const twfAvail = (hasTWF || rangerLevel > 2) && twfDexOk;
  const twfReason = !twfAvail
    ? (!twfDexOk
        ? `Dex 15 required (current: ${dexterity})`
        : 'Requires Two-Weapon Fighting feat (or Ranger level 3+)')
    : undefined;

  // ITWF: ((feat + twf-applied + bab6) OR ranger 7+) AND Dex 17
  const itwfDexOk  = dexterity >= 17;
  const rangerItwf = rangerLevel > 6;
  const itwfByFeat = hasITWF && (twfApplied || rangerLevel > 2) && bab >= 6;
  const itwfAvail  = (rangerItwf || itwfByFeat) && itwfDexOk;
  const itwfReason = !itwfAvail
    ? (!itwfDexOk
        ? `Dex 17 required (current: ${dexterity})`
        : !hasITWF
          ? 'Requires Improved Two-Weapon Fighting feat (or Ranger level 7+)'
          : !twfApplied && rangerLevel <= 2
            ? 'Two-Weapon Fighting must be applied first'
            : `BAB +6 required (current: +${bab})`)
    : undefined;

  // GTWF: feat + itwf-applied + bab11 + Dex 19 (no ranger exception)
  const gtwfDexOk = dexterity >= 19;
  const gtwfAvail = hasGTWF && itwfApplied && bab >= 11 && gtwfDexOk;
  const gtwfReason = !gtwfAvail
    ? (!gtwfDexOk
        ? `Dex 19 required (current: ${dexterity})`
        : !hasGTWF
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
  };
}

function getArmorSpeedForSize(
  category: ArmorCatalogEntry['category'] | ArmorLoadout['category'],
  size: CharacterDraft['size'],
): string {
  if (category === 'Shield') return '-';
  const isSmallMovement = size === 'Small' || size === 'Fine' || size === 'Diminutive' || size === 'Tiny';
  if (category === 'Light Armor') {
    return isSmallMovement ? '20 ft.' : '30 ft.';
  }
  return isSmallMovement ? '15 ft.' : '20 ft.';
}

function newShieldFromEntry(entry: ArmorCatalogEntry, size: CharacterDraft['size']): ArmorLoadout {
  return {
    name:              entry.name,
    category:          entry.category,
    armorBonus:        entry.armorBonus,
    enhancementBonus:  0,
    maxDexBonus:       entry.maxDexBonus,
    armorCheckPenalty: entry.armorCheckPenalty,
    arcaneSpellFailure: entry.arcaneSpellFailure,
    speed:             getArmorSpeedForSize(entry.category, size),
    weight:            entry.weight,
    armorAdjust:       entry.armorAdjust,
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
  };
}

function newArmorFromEntry(entry: ArmorCatalogEntry, size: CharacterDraft['size']): ArmorLoadout {
  return {
    name:              entry.name,
    category:          entry.category,
    armorBonus:        entry.armorBonus,
    enhancementBonus:  0,
    maxDexBonus:       entry.maxDexBonus,
    armorCheckPenalty: entry.armorCheckPenalty,
    arcaneSpellFailure: entry.arcaneSpellFailure,
    speed:             getArmorSpeedForSize(entry.category, size),
    weight:            entry.weight,
    armorAdjust:       entry.armorAdjust,
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
  const mainHandFeatOptions = getAllWeaponFeatOptions(inventory.mainHand, feats, fighterLevel, rangerLevel, dexterity);
  const offHandFeatOptions  = getAllWeaponFeatOptions(inventory.offHandWeapon, feats, fighterLevel, rangerLevel, dexterity);
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
        misc:       bestSlot('insight') + bestSlot('luck') + bestSlot('sacred') + bestSlot('profane'),
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
    nextWornSlots.bodySlot = { item: '', acType: '', acBonus: 0 };
    const clearBodySlotFields: Pick<Inventory, 'wornSlots'> = {
      wornSlots: nextWornSlots,
    };
    if (entry) {
      updateInventory({ body: newArmorFromEntry(entry, size), ...clearBodySlotFields });
      return;
    }
    const existing = inventory.body ?? newArmorFromEntry({
      name: '', category: 'Light Armor', armorBonus: 0, maxDexBonus: null,
      armorCheckPenalty: 0, arcaneSpellFailure: '', speed: '', weight: '', armorAdjust: 0,
    }, size);
    updateInventory({ body: { ...existing, name }, ...clearBodySlotFields });
  }

  function updateBodyField(field: keyof ArmorLoadout, value: string | number | null) {
    const base = inventory.body ?? defaultShield();
    const next = { ...base, [field]: value } as ArmorLoadout;
    if (field === 'name' && typeof value === 'string' && !value.trim()) {
      updateInventory({ body: null }); return;
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
    if (field === 'name' && typeof value === 'string' && !value.trim()) { updateInventory({ offHandWeapon: null }); return; }
    updateInventory({ offHandWeapon: next });
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
  }, [derivedBaseAttackBonus, derivedMeleeAttackBonus, derivedRangedAttackBonus]);

  function handleOffHandShieldSelect(name: string, entry?: ArmorCatalogEntry) {
    if (!name.trim()) { updateInventory({ offHandShield: null }); return; }
    updateInventory({ offHandShield: entry ? newShieldFromEntry(entry, size) : { ...(inventory.offHandShield ?? defaultShield()), name } });
  }

  useEffect(() => {
    const nextPartial: Partial<Inventory> = {};
    let changed = false;

    if (inventory.body?.name) {
      const expectedSpeed = getArmorSpeedForSize(inventory.body.category, size);
      if (inventory.body.speed !== expectedSpeed) {
        nextPartial.body = { ...inventory.body, speed: expectedSpeed };
        changed = true;
      }
    }

    if (inventory.offHandShield?.name) {
      const expectedSpeed = getArmorSpeedForSize(inventory.offHandShield.category, size);
      if (inventory.offHandShield.speed !== expectedSpeed) {
        nextPartial.offHandShield = { ...inventory.offHandShield, speed: expectedSpeed };
        changed = true;
      }
    }

    if (changed) {
      updateInventory(nextPartial);
    }
  }, [size]);

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
    const next = cur.includes(featName) ? cur.filter((f) => f !== featName) : [...cur, featName];
    updateInventory({ mainHand: { ...inventory.mainHand, appliedFeats: next } });
  }

  function toggleOffHandFeat(featName: string) {
    if (!inventory.offHandWeapon) return;
    const cur = inventory.offHandWeapon.appliedFeats ?? [];
    const next = cur.includes(featName) ? cur.filter((f) => f !== featName) : [...cur, featName];
    updateInventory({ offHandWeapon: { ...inventory.offHandWeapon, appliedFeats: next } });
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
          style={inputStyle}
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
  const dmgLabel = `Dmg\u00a0(${showSmallDamage ? 'S' : 'M'})`;

  return (
    <div className="inventory-section">

      {/* ── 1. Weapons ── */}
      <div>
        <p className="inventory-section-title">Weapons</p>
        <div className="inventory-weapon-selector">
          <div className="inventory-hands-wrap">
            <table className="inventory-hands-table" aria-label="Main-hand weapon">
              <thead className="inventory-hands-thead">
                <tr>
                  {['Main Hand', 'Weapon Enancement', 'Combat Mod', 'Atk', dmgLabel, 'Critical', ''].map((h) => (
                    <th key={h} className="inventory-hands-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <WeaponRow
                  label=""
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
                  featOptions={mainHandFeatOptions}
                  onToggleFeat={toggleMainHandFeat}
                />
              </tbody>
            </table>
          </div>
        </div>

        <div className="inventory-weapon-selector">
          <div className="inventory-weapon-selector-header">
            {!isTwoHanded && (
              <div className="inventory-offhand-mode">
                {(['none', 'weapon', 'shield'] as const).map((mode) => (
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
                {offHandMode === 'weapon' && (
                  <>
                    <span className="inventory-offhand-mode-sep" aria-hidden>|</span>
                    <span className="inventory-offhand-mode-feat-label">Two-weapon feats</span>
                    <FeatPopupButton
                      options={twfFeatOptions}
                      applied={twfAppliedFeats}
                      onToggle={toggleTwfFeat}
                    />
                    {isTwoWeaponFighting && (
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
                  </>
                )}
              </div>
            )}
          </div>
          <div className="inventory-hands-wrap">
            <table className="inventory-hands-table" aria-label="Weapon slots">
              {isTwoHanded ? (
                <tbody>
                  <tr className="inventory-hands-row-odd">
                    <td className="inventory-hands-td" colSpan={7}>
                      <span className="inventory-two-handed-note">
                        Off-hand unavailable — two-handed weapon in main hand.
                      </span>
                    </td>
                  </tr>
                </tbody>
              ) : offHandMode === 'weapon' ? (
                <>
                  <thead className="inventory-hands-thead">
                    <tr>
                      {['Off-Hand', 'Weapon Enancement', 'Combat Mod', 'Atk', dmgLabel, 'Critical', ''].map((h) => (
                        <th key={h} className="inventory-hands-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <WeaponRow
                      label=""
                      weapon={offWeapon}
                      baseAttackBonus={derivedBaseAttackBonus}
                      meleeAttackBonus={derivedMeleeAttackBonus}
                      rangedAttackBonus={derivedRangedAttackBonus}
                      rowClass="inventory-hands-row-odd"
                      inputStyle={inputStyle}
                      onSelect={handleOffHandWeaponSelect}
                      onFieldChange={updateOffHandWeaponField}
                      onClear={() => updateInventory({ offHandWeapon: null })}
                      allowTwoHanded={false}
                      entries={OFF_HAND_WEAPON_CATALOG}
                      maxAttacks={offHandMaxAttacks}
                      twoWeaponPenalty={twfOffPenalty}
                      featOptions={offHandFeatOptions}
                      onToggleFeat={toggleOffHandFeat}
                    />
                  </tbody>
                </>
              ) : (
                <tbody>
                  <tr className="inventory-hands-row-odd">
                    <td className="inventory-hands-td" colSpan={7}>
                      {offHandMode === 'shield' ? (
                        <ShieldRow
                          shield={offShield}
                          inputStyle={inputStyle}
                          onSelect={handleOffHandShieldSelect}
                          onFieldChange={updateOffHandShieldField}
                          onClear={() => updateInventory({ offHandShield: null })}
                        />
                      ) : (
                        <span className="inventory-help">No off-hand item selected.</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
        <p className="inventory-help" style={{ marginTop: 8 }}>
          Light and one-handed weapons may be used in either hand.
          Off-hand is unavailable when wielding a two-handed weapon.
        </p>

      </div>

      {/* ── 2. Armor ── */}
      <div>
        <p className="inventory-section-title">Armor</p>
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
      </div>

      {/* ── 3. Worn Slots ── */}
      <div>
        <p className="inventory-section-title">Worn Slots</p>
        <p className="inventory-help">
          Items can grant bonuses to AC — select a type and value for each slot.
          {' '}* Dodge bonuses stack with each other; all other types apply only the highest.
        </p>
        <div className="inventory-slots-grid">
          <span className="inventory-slots-col-header" />
          <span className="inventory-slots-col-header">Item</span>
          <span className="inventory-slots-col-header">AC Bonus Type</span>
          <span className="inventory-slots-col-header">Value</span>

          {SLOTS_BEFORE_BODY.map(({ key, label }) => renderSlotRow(key, label))}

          {SLOTS_AFTER_BODY.map(({ key, label }) => renderSlotRow(key, label))}
        </div>
      </div>

    </div>
  );
}

// ── WeaponRow sub-component ────────────────────────────────────────────────────

function WeaponRow({
  label,
  weapon,
  baseAttackBonus,
  meleeAttackBonus,
  rangedAttackBonus,
  rowClass,
  inputStyle,
  onSelect,
  onFieldChange,
  onClear,
  allowTwoHanded = true,
  entries = WEAPON_CATALOG,
  maxAttacks,
  twoWeaponPenalty = 0,
  featOptions = [],
  onToggleFeat,
}: {
  label: string;
  weapon: WeaponLoadout | null;
  baseAttackBonus: number;
  meleeAttackBonus: number;
  rangedAttackBonus: number;
  rowClass: string;
  inputStyle: React.CSSProperties;
  onSelect: (name: string, entry?: WeaponCatalogEntry) => void;
  onFieldChange: (field: keyof WeaponLoadout, value: string | number) => void;
  onClear: () => void;
  allowTwoHanded?: boolean;
  entries?: ReadonlyArray<WeaponCatalogEntry>;
  maxAttacks?: number;
  twoWeaponPenalty?: number;
  featOptions?: FeatOption[];
  onToggleFeat?: (name: string) => void;
}) {
  const damageValue = weapon?.damage ?? '';
  const mat = weapon?.material ? MATERIALS[weapon.material as MaterialKey] : undefined;
  const effectiveWeight = weapon ? applyWeightMultiplier(weapon.weight, mat?.weightMultiplier ?? 1) : '—';
  const parsedBab = Number(baseAttackBonus);
  const parsedMeleeAtk = Number(meleeAttackBonus);
  const parsedRangedAtk = Number(rangedAttackBonus);
  const combatMod = Number(weapon?.combatMod ?? 0);
  const attackClass = weapon ? getWeaponAttackClass(weapon.name, weapon.rangeIncrement) : 'Melee';
  const isRangedWeapon = attackClass === 'Ranged';

  // Feat-based attack modifiers
  const appliedFeats = weapon?.appliedFeats ?? [];
  const featBonus =
    (appliedFeats.includes('Weapon Focus') ? 1 : 0) +
    (appliedFeats.includes('Greater Weapon Focus') ? 1 : 0);
  // Weapon Finesse: light melee or Finesse-eligible (e.g. Rapier) → use Dex-based attack bonus
  const isFinesseWeapon = !isRangedWeapon && (weapon?.handedness === 'Light' || weapon?.special?.includes('Weapon Finesse eligible'));
  const usesFinesse  = isFinesseWeapon && appliedFeats.includes('Weapon Finesse');
  const hasRapidShot = isRangedWeapon && appliedFeats.includes('Rapid Shot');

  const primaryAttackBonus = isRangedWeapon
    ? parsedRangedAtk
    : (usesFinesse ? parsedRangedAtk : parsedMeleeAtk);
  const iterativeAttack = weapon
    ? buildIterativeAttackString(primaryAttackBonus, parsedBab, Number(weapon.enhancementBonus ?? 0), combatMod, maxAttacks, twoWeaponPenalty, featBonus, hasRapidShot)
    : '—';
  return (
    <>
      <tr className={rowClass}>
        {label && <td className="inventory-hands-td inventory-hands-label">{label}</td>}
        <td className="inventory-hands-td">
          <WeaponAutocomplete
            value={weapon?.name ?? ''}
            entries={entries}
            onSelect={onSelect}
            placeholder="Select weapon..."
            ariaLabel={`${label || 'off-hand'} weapon selection`}
            style={{ ...inputStyle, minWidth: 160 }}
          />
        </td>
        <td className="inventory-hands-td">
          <input
            type="number"
            value={weapon?.enhancementBonus ?? 0}
            onChange={(e) => onFieldChange('enhancementBonus', Number(e.target.value))}
            className="inventory-hands-input inventory-hands-input--number"
            aria-label="Enhancement bonus"
            disabled={!weapon}
          />
        </td>
        <td className="inventory-hands-td">
          <input
            type="number"
            value={weapon?.combatMod ?? 0}
            onChange={(e) => onFieldChange('combatMod', Number(e.target.value))}
            className="inventory-hands-input inventory-hands-input--number"
            aria-label="Combat modifier"
            disabled={!weapon}
          />
        </td>
        <td className="inventory-hands-td inventory-hands-atk">
          <input
            type="text"
            value={weapon ? (weapon.computedAttack || iterativeAttack) : ''}
            onChange={(e) => onFieldChange('computedAttack', e.target.value)}
            className="inventory-hands-input inventory-hands-atk-input"
            aria-label="Iterative attack"
            disabled={!weapon}
          />
        </td>
        <td className="inventory-hands-td">
          <input
            type="text"
            value={damageValue}
            onChange={(e) => onFieldChange('damage', e.target.value)}
            className="inventory-hands-input"
            aria-label="Weapon damage"
            disabled={!weapon}
            style={{ ...inputStyle, minWidth: 90 }}
          />
        </td>
        <td className="inventory-hands-td">
          <input
            type="text"
            value={weapon?.critical ?? ''}
            onChange={(e) => onFieldChange('critical', e.target.value)}
            className="inventory-hands-input"
            aria-label="Critical range"
            disabled={!weapon}
            style={{ ...inputStyle, minWidth: 90 }}
          />
        </td>
        <td className="inventory-hands-td">
          <div className="inventory-hands-actions">
            {weapon && (
              <button
                type="button"
                onClick={onClear}
                className="inventory-hands-clear"
                aria-label="Clear weapon"
              >
                Clear
              </button>
            )}
          </div>
        </td>
      </tr>
      <tr className={`${rowClass} inventory-hands-subrow`}>
        <td className="inventory-hands-td inventory-hands-subrow-content" colSpan={7}>
          <div className="inventory-hands-detail-fields">
            <label className="inventory-hands-detail-field">
              <span className="inventory-hands-detail-label">Material</span>
              <select
                value={weapon?.material ?? ''}
                onChange={(e) => onFieldChange('material', e.target.value)}
                className="inventory-hands-input"
                aria-label="Weapon material"
                disabled={!weapon}
                title={mat?.note}
                style={{ ...inputStyle, minWidth: 120 }}
              >
                <option value="">Standard</option>
                {WEAPON_MATERIAL_KEYS.map((k) => (
                  <option key={k} value={k}>{MATERIALS[k].label}</option>
                ))}
              </select>
            </label>
            <label className="inventory-hands-detail-field">
              <span className="inventory-hands-detail-label">Handedness</span>
              <select
                value={weapon?.handedness ?? '—'}
                onChange={(e) => onFieldChange('handedness', e.target.value)}
                className="inventory-hands-input"
                aria-label="Handedness"
                disabled={!weapon}
                style={{ ...inputStyle, minWidth: 110 }}
              >
                {!weapon && <option value="—">—</option>}
                {(['Light', 'One-Handed', 'Two-Handed'] as const)
                  .filter((h) => allowTwoHanded || h !== 'Two-Handed')
                  .map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </label>
            <span className="inventory-hands-detail-field">
              <span className="inventory-hands-detail-label">Range</span>
              <span className="inventory-hands-detail-value">{weapon?.rangeIncrement ?? '—'}</span>
            </span>
            <span className="inventory-hands-detail-field">
              <span className="inventory-hands-detail-label">Type</span>
              <span className="inventory-hands-detail-value">{weapon?.damageType ?? '—'}</span>
            </span>
            <span className="inventory-hands-detail-field">
              <span className="inventory-hands-detail-label">Wt</span>
              <span className="inventory-hands-detail-value">{effectiveWeight}</span>
            </span>
            {weapon && featOptions.length > 0 && onToggleFeat && (
              <span className="inventory-hands-detail-field">
                <span className="inventory-hands-detail-label">Feats</span>
                <FeatPopupButton
                  options={featOptions}
                  applied={appliedFeats}
                  onToggle={onToggleFeat}
                />
              </span>
            )}
          </div>
        </td>
      </tr>
    </>
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
          className="inventory-hands-input"
          aria-label="Armor material"
          disabled={!armor || disabled}
          title={mat?.note}
          style={{ ...inputStyle, minWidth: 120 }}
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
      <td className="inventory-hands-td inventory-hands-stat">{armor?.speed || '—'}</td>
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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center', marginTop: 4 }}>
      <ArmorAutocomplete
        value={shield?.name ?? ''}
        entries={SHIELD_ENTRIES}
        onSelect={onSelect}
        placeholder="Select shield..."
        ariaLabel="Off-hand shield selection"
        style={{ ...inputStyle, minWidth: 160 }}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span className="inventory-hands-stat" style={{ fontWeight: 'normal' }}>Material</span>
        <select
          value={shield?.material ?? ''}
          onChange={(e) => onFieldChange('material', e.target.value)}
          className="inventory-hands-input"
          aria-label="Shield material"
          disabled={!shield}
          title={mat?.note}
          style={{ ...inputStyle, minWidth: 120 }}
        >
          <option value="">Standard</option>
          {ARMOR_MATERIAL_KEYS.map((k) => (
            <option key={k} value={k}>{MATERIALS[k].label}</option>
          ))}
        </select>
      </label>
      {shield && (
        <>
          <span className="inventory-hands-stat">AC <strong>+{shield.armorBonus}</strong></span>
          <span className="inventory-hands-stat">
            Enh&nbsp;
            <input
              type="number"
              value={shield.enhancementBonus}
              onChange={(e) => onFieldChange('enhancementBonus', Number(e.target.value))}
              className="inventory-hands-input inventory-hands-input--number"
              aria-label="Shield enhancement bonus"
              style={{ display: 'inline', verticalAlign: 'middle' }}
            />
          </span>
          {shield.maxDexBonus !== null && <span className="inventory-hands-stat">Max Dex {shield.maxDexBonus}</span>}
          {effectiveAcp !== null && effectiveAcp !== 0 && <span className="inventory-hands-stat">ACP {effectiveAcp}</span>}
          <span className="inventory-hands-stat">ASF {effectiveAsf ?? '—'}</span>
          {effectiveWeight && <span className="inventory-hands-stat">Wt {effectiveWeight}</span>}
          <span className="inventory-hands-stat">Total <strong>+{totalArmorBonus(shield)}</strong></span>
          <button
            type="button"
            onClick={onClear}
            className="inventory-hands-clear"
            aria-label="Clear shield"
          >
            Clear
          </button>
        </>
      )}
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
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
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
      style={{ position: 'fixed', top: pos.top, left: pos.left }}
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
  const triggerRef = useRef<HTMLSpanElement>(null);
  const activeNames = options.filter((o) => applied.includes(o.name)).map((o) => o.name);
  const summary = activeNames.length > 0 ? activeNames.join(', ') : 'none';

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        className="inventory-feat-trigger"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen((v) => !v)}
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
          anchorEl={triggerRef.current}
        />
      )}
    </>
  );
}

