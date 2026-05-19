import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { CharacterDraft, AbilityScore, FeatSlot, WornSlot, WornSlotKey } from '../types/character';
import { HIT_DIE_BY_CLASS } from '../types/character';
import {
  newCharacterDraft,
  abilityModifier,
  totalScore,
  buildIterativeAttackString,
  computeSkillBonus,
  RACIAL_SIZES,
  type PointBuySystem,
  POINT_BUY_CONFIGS,
  abilityPointBuyTotalFor,
  affordableAbilityBaseScoreFor,
  applyClassAndRacialSkillRules,
  totalCharacterLevel,
  spentSkillPoints,
  totalSkillPointsAvailable,
  baseAttackBonusFromClasses,
  baseSaveBonusFromClasses,
  deriveAutoFeats,
  deriveClassFeatures,
  deriveSelectableFeats,
  mergeSelectableFeats,
  applyMaxDexCap,
  computeAcTotals,
  BASE_SPEED_BY_SIZE,
  BASE_SPEED_BY_RACE,
  PATHFINDER_FLEXIBLE_RACES,
  isPathfinderSystem,
  getRacialAdjFor,
} from '../utils/characterHelpers';
import { FEAT_BY_NAME } from '../data/feats';
import { MATERIALS, applyMaxDexDelta } from '../data/materials';
import type { MaterialKey } from '../data/materials';
import { getWeaponAttackClass } from '../data/weapons';
import type { FeatCatalogEntry } from '../components/FeatAutocomplete';
import type { CustomFeat } from '../types/customFeat';
import type { CustomClass } from '../types/customClass';
import type { CustomClassLookup } from '../utils/characterHelpers';
import { IdentitySection } from './character-editor/IdentitySection';
import { BackgroundSection } from './character-editor/BackgroundSection';
import { ClassLevelSection } from './character-editor/ClassLevelSection';
import { AbilityScoresSection } from './character-editor/AbilityScoresSection';
import { ABILITY_KEYS } from './character-editor/abilityKeys';
import { FeatsSection } from './character-editor/FeatsSection';
import { CombatSection } from './character-editor/CombatSection';
import type { CombatDerivedStats } from './character-editor/CombatSection';
import { InventorySection } from './character-editor/InventorySection';
import { SkillsSection } from './character-editor/SkillsSection';
import { DelegatePopover } from '../components/DelegatePopover';
import { EndDelegationPopover } from '../components/EndDelegationPopover';
import type { AbilityKey } from './character-editor/AbilityScoresSection';
import { generateStatBlock, statBlockToPlainText, statBlockToRtf } from '../utils/statBlock';
import type { StatBlockData } from '../utils/statBlock';
import './CharacterEditor.css';

// ── Stat Block Modal ─────────────────────────────────────────────────────────

function StatBlockModal({ data, name, onClose }: { data: StatBlockData; name: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(statBlockToPlainText(data)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const rtf = statBlockToRtf(data);
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9_\- ]/gi, '_')}_stat_block.rtf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stat Block"
      className="stat-block-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="stat-block-dialog">
        <div className="stat-block-dialog-header">
          <span className="stat-block-dialog-title">Stat Block</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleDownload} className="stat-block-btn">
              Download RTF
            </button>
            <button type="button" onClick={handleCopy} className="stat-block-btn">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="stat-block-btn stat-block-btn--close">
              ✕
            </button>
          </div>
        </div>
        <div className="stat-block-body">
          {data.map((para, pi) => (
            <p key={pi} className="stat-block-para">
              {para.map((seg, si) => (
                <span key={si}>
                  {seg.bold && <strong>{seg.bold}</strong>}
                  {seg.normal}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--color-canvas-default)',
  border: '1px solid var(--color-border-default)',
  borderRadius: 6,
  color: 'var(--color-fg-default)',
  padding: '4px 8px',
  fontSize: 14,
  width: '100%',
};

function applyRaceToDraft(
  draft: CharacterDraft,
  race: CharacterDraft['race'],
  system: PointBuySystem = 'adnd28',
  choice?: string | null,
) {
  const prevAdj = getRacialAdjFor(draft.race, system, draft.racialAbilityChoice);
  const nextAdj = getRacialAdjFor(race, system, choice);
  const abilityScores = { ...draft.abilityScores };
  (Object.keys(abilityScores) as AbilityKey[]).forEach((key) => {
    abilityScores[key] = {
      ...abilityScores[key],
      racial: (abilityScores[key].racial - (prevAdj[key] ?? 0)) + (nextAdj[key] ?? 0),
    };
  });

  const skills = applyClassAndRacialSkillRules(draft.skills, draft.classes, race).map((skill) => ({
    ...skill,
    bonus: computeSkillBonus(skill, abilityScores),
  }));
  const feats = mergeSelectableFeats(draft.feats, deriveSelectableFeats(draft.classes, race));

  return {
    ...draft,
    race,
    racialAbilityChoice: choice ?? null,
    size: RACIAL_SIZES[race],
    baseSpeed: String(BASE_SPEED_BY_RACE[race] ?? BASE_SPEED_BY_SIZE[RACIAL_SIZES[race]] ?? 30),
    abilityScores,
    skills,
    feats,
  };
}

function Accordion({
  title, summary, defaultOpen = false, children,
}: {
  title: React.ReactNode;
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const buttonClasses = [
    'w-full flex items-center gap-2 pb-1 mb-3 character-editor-accordion-trigger',
    open ? 'character-editor-accordion-trigger--open' : '',
  ].join(' ');
  const chevronClasses = [
    'character-editor-accordion-chevron',
    open ? 'character-editor-accordion-chevron--open' : '',
  ].join(' ');

  const accordionHeader = (
    <>
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={chevronClasses}
        aria-hidden="true"
      >
        <path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-m font-semibold uppercase tracking-wider character-editor-accordion-title">
        {title}
      </span>
      {!open && summary && (
        <span className="text-xs font-normal normal-case tracking-normal ml-2 character-editor-accordion-summary">
          {summary}
        </span>
      )}
    </>
  );

  return (
    <div>
      <div role="heading" aria-level={3}>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={buttonClasses}
        >
          {accordionHeader}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 character-editor-accordion-body">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Ability Scores section ────────────────────────────────────────────────────

const SIZE_MODIFIERS: Record<CharacterDraft['size'], number> = {
  Fine: 8,
  Diminutive: 4,
  Tiny: 2,
  Small: 1,
  Medium: 0,
  Large: -1,
  Huge: -2,
  Gargantuan: -4,
  Colossal: -8,
};

function signed(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function safeCombatNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function parseMaxDexBonus(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/-?\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveAbilityTotals(scores: CharacterDraft['abilityScores']): Record<AbilityKey, number> {
  return {
    strength: totalScore(scores.strength),
    dexterity: totalScore(scores.dexterity),
    constitution: totalScore(scores.constitution),
    intelligence: totalScore(scores.intelligence),
    wisdom: totalScore(scores.wisdom),
    charisma: totalScore(scores.charisma),
  };
}

function deriveCombatStats({
  combat,
  inventory,
  feats,
  classes,
  size,
  abilityMods,
  baseSpeed,
  customClassMap = new Map(),
}: {
  combat: CharacterDraft['combat'];
  inventory: CharacterDraft['inventory'];
  feats: CharacterDraft['feats'];
  classes: CharacterDraft['classes'];
  size: CharacterDraft['size'];
  abilityMods: Record<AbilityKey, number>;
  baseSpeed: string;
  customClassMap?: Map<string, CustomClassLookup>;
}): CombatDerivedStats {
  const dexMod = abilityMods.dexterity;
  const conMod = abilityMods.constitution;
  const wisMod = abilityMods.wisdom;
  const strMod = abilityMods.strength;
  const sizeMod = SIZE_MODIFIERS[size] ?? 0;
  const acArmor = safeCombatNumber(combat.armorClass.armor);
  const acShield = safeCombatNumber(combat.armorClass.shield);
  const acNatural = safeCombatNumber(combat.armorClass.natural);
  const acDeflection = safeCombatNumber(combat.armorClass.deflection);
  const initMisc = safeCombatNumber(combat.initiative.miscBonus);
  const speedBase = parseInt(baseSpeed) || 30;
  const armoredSpeedFt = inventory.body?.speed ? parseInt(inventory.body.speed) : NaN;
  const speedArmorAdjust = inventory.body?.speed && !isNaN(armoredSpeedFt) ? armoredSpeedFt - speedBase : 0;
  const speedFly = safeCombatNumber(combat.speed.fly);
  const speedSwim = safeCombatNumber(combat.speed.swim);
  const bab = baseAttackBonusFromClasses(classes, customClassMap);
  const fortitudeBase = baseSaveBonusFromClasses(classes, 'fortitude', customClassMap);
  const reflexBase = baseSaveBonusFromClasses(classes, 'reflex', customClassMap);
  const willBase = baseSaveBonusFromClasses(classes, 'will', customClassMap);

  const armorMat = inventory.body?.material ? MATERIALS[inventory.body.material as MaterialKey] : undefined;
  const armorMaxDex = parseMaxDexBonus(applyMaxDexDelta(inventory.body?.maxDexBonus ?? null, armorMat?.maxDexDelta ?? 0));
  const shieldMat = inventory.offHandShield?.material ? MATERIALS[inventory.offHandShield.material as MaterialKey] : undefined;
  const shieldMaxDex = parseMaxDexBonus(applyMaxDexDelta(inventory.offHandShield?.maxDexBonus ?? null, shieldMat?.maxDexDelta ?? 0));
  const maxDexCap = [armorMaxDex, shieldMaxDex]
    .filter((cap): cap is number => cap !== null)
    .reduce<number | null>((lowest, cap) => (lowest === null ? cap : Math.min(lowest, cap)), null);
  const acDexMod = applyMaxDexCap(dexMod, maxDexCap);

  // Dodge bonus: manual entry + worn-slot dodge bonuses + Dodge feat.
  const slotDodge = Object.values(inventory.wornSlots).reduce(
    (acc, b) => (b.acType === 'dodge' ? acc + b.acBonus : acc), 0,
  );
  const dodgeFeatBonus = feats.some((f) => f.name.trim().toLowerCase() === 'dodge') ? 1 : 0;
  const acDodge = safeCombatNumber(combat.armorClass.dodge) + slotDodge + dodgeFeatBonus;

  // Misc bonus: manual entry + stacking slot bonuses (insight, luck, sacred, profane).
  const slotMisc = Object.values(inventory.wornSlots).reduce(
    (acc, b) => (['insight', 'luck', 'sacred', 'profane'].includes(b.acType) ? acc + b.acBonus : acc), 0,
  );
  const acMisc = safeCombatNumber(combat.armorClass.misc) + slotMisc;

  const { total: totalAC, touch: touchAC, flatFooted: flatFootedAC } = computeAcTotals({
    armor: acArmor, shield: acShield, acDexMod,
    sizeMod, dodge: acDodge, natural: acNatural, deflection: acDeflection, misc: acMisc,
  });
  const initiativeTotal = dexMod + initMisc;
  const fortitudeTotal = fortitudeBase + conMod + safeCombatNumber(combat.saves.fortitude.magic) + safeCombatNumber(combat.saves.fortitude.misc);
  const reflexTotal = reflexBase + dexMod + safeCombatNumber(combat.saves.reflex.magic) + safeCombatNumber(combat.saves.reflex.misc);
  const willTotal = willBase + wisMod + safeCombatNumber(combat.saves.will.magic) + safeCombatNumber(combat.saves.will.misc);
  const meleeAttack = bab + strMod + sizeMod;
  const rangedAttack = bab + dexMod + sizeMod;
  const speedFeet = Math.max(0, speedBase + speedArmorAdjust);

  return {
    dexMod,
    conMod,
    wisMod,
    strMod,
    sizeMod,
    acArmor,
    acShield,
    acDexMod,
    acDodge,
    acNatural,
    acDeflection,
    acMisc,
    initMisc,
    speedBase,
    speedArmorAdjust,
    speedFly,
    speedSwim,
    bab,
    fortitudeBase,
    reflexBase,
    willBase,
    totalAC,
    touchAC,
    flatFootedAC,
    initiativeTotal,
    fortitudeTotal,
    reflexTotal,
    willTotal,
    meleeAttack,
    rangedAttack,
    speedFeet,
  };
}

function stampComputedAttacksForSave(
  inventory: CharacterDraft['inventory'],
  baseAttackBonus: number,
  meleeAttackBonus: number,
  rangedAttackBonus: number,
): CharacterDraft['inventory'] {
  const mainHand = inventory.mainHand;
  const offHandWeapon = inventory.offHandWeapon;

  const isTwoHanded = mainHand?.handedness === 'Two-Handed';
  const isTwoWeaponFighting = !isTwoHanded
    && Boolean(mainHand?.name?.trim())
    && Boolean(offHandWeapon?.name?.trim());
  const offHandIsLight = offHandWeapon?.handedness === 'Light';
  const twfAppliedFeats = inventory.twfAppliedFeats ?? [];
  const twfFeatApplied = twfAppliedFeats.includes('Two-Weapon Fighting');
  const itwfApplied = twfAppliedFeats.includes('Improved Two-Weapon Fighting');
  const gtwfApplied = twfAppliedFeats.includes('Greater Two-Weapon Fighting');
  const twfMainPenalty = isTwoWeaponFighting ? (offHandIsLight ? -4 : -6) + (twfFeatApplied ? 2 : 0) : 0;
  const twfOffPenalty = isTwoWeaponFighting ? (offHandIsLight ? -8 : -10) + (twfFeatApplied ? 6 : 0) : 0;
  const offHandMaxAttacks = mainHand ? (gtwfApplied ? 3 : itwfApplied ? 2 : 1) : undefined;

  function withComputedAttack(
    weapon: CharacterDraft['inventory']['mainHand'],
    twoWeaponPenalty = 0,
    maxAttacks?: number,
  ): CharacterDraft['inventory']['mainHand'] {
    if (!weapon?.name?.trim()) return weapon;
    if (weapon.computedAttack?.trim()) return weapon;
    if (weapon.attackOverride?.trim()) return { ...weapon, computedAttack: weapon.attackOverride.trim() };
    const attackClass = getWeaponAttackClass(weapon.name, weapon.rangeIncrement);
    const isRangedWeapon = attackClass === 'Ranged';
    const appliedFeats = weapon.appliedFeats ?? [];
    const isFinesseWeapon = !isRangedWeapon
      && (weapon.handedness === 'Light' || weapon.special?.includes('Weapon Finesse eligible'));
    const usesFinesse = isFinesseWeapon && appliedFeats.includes('Weapon Finesse');
    const hasRapidShot = isRangedWeapon && appliedFeats.includes('Rapid Shot');
    const featBonus =
      (appliedFeats.includes('Weapon Focus') ? 1 : 0)
      + (appliedFeats.includes('Greater Weapon Focus') ? 1 : 0);
    const primaryAttackBonus = isRangedWeapon
      ? rangedAttackBonus
      : (usesFinesse ? rangedAttackBonus : meleeAttackBonus);

    const computedAttack = buildIterativeAttackString(
      primaryAttackBonus,
      baseAttackBonus,
      Number(weapon.enhancementBonus ?? 0),
      Number(weapon.combatMod ?? 0),
      maxAttacks,
      twoWeaponPenalty,
      featBonus,
      hasRapidShot,
    );

    return { ...weapon, computedAttack };
  }

  return {
    ...inventory,
    mainHand: withComputedAttack(mainHand, twfMainPenalty),
    offHandWeapon: withComputedAttack(offHandWeapon, twfOffPenalty, offHandMaxAttacks),
  };
}

// ── Main editor ───────────────────────────────────────────────────────────────

interface CharacterEditorProps {
  characterId?: string;
  initialClass?: string;
  initialName?: string;
  initialRace?: CharacterDraft['race'];
  onCancel: () => void;
  pointBuySystem?: PointBuySystem;
}

export function CharacterEditor({ characterId, initialClass, initialName, initialRace, onCancel, pointBuySystem = 'adnd28' }: CharacterEditorProps) {
  const [draft, setDraft] = useState<CharacterDraft>(() => {
    const d = newCharacterDraft();
    const defaultBase = POINT_BUY_CONFIGS[pointBuySystem].defaultBase;
    if (!characterId && defaultBase !== 8) {
      for (const key of Object.keys(d.abilityScores) as Array<keyof typeof d.abilityScores>) {
        d.abilityScores[key] = { ...d.abilityScores[key], base: defaultBase };
      }
    }
    if (!characterId && initialClass) {
      d.classes = [{ name: initialClass, level: 1, hitDieType: HIT_DIE_BY_CLASS[initialClass] ?? 8, hpRolled: [] }];
    }
    if (!characterId && initialRace) {
      const racedDraft = applyRaceToDraft(d, initialRace, pointBuySystem, null);
      if (initialName) racedDraft.name = initialName;
      return racedDraft;
    }
    if (!characterId && initialName) {
      d.name = initialName;
    }
    return d;
  });
  const [autoSaveCharacterId, setAutoSaveCharacterId] = useState<string | null>(characterId ?? null);
  const [loadingCharacter, setLoadingCharacter] = useState(Boolean(characterId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialDraftFingerprint, setInitialDraftFingerprint] = useState<string | null>(() => {
    if (characterId) return null;
    const d = newCharacterDraft();
    const defaultBase = POINT_BUY_CONFIGS[pointBuySystem].defaultBase;
    if (defaultBase !== 8) {
      for (const key of Object.keys(d.abilityScores) as Array<keyof typeof d.abilityScores>) {
        d.abilityScores[key] = { ...d.abilityScores[key], base: defaultBase };
      }
    }
    if (initialClass) d.classes = [{ name: initialClass, level: 1, hitDieType: HIT_DIE_BY_CLASS[initialClass] ?? 8, hpRolled: [] }];
    if (initialRace) {
      const racedDraft = applyRaceToDraft(d, initialRace);
      if (initialName) racedDraft.name = initialName;
      return JSON.stringify(racedDraft);
    }
    if (initialName) d.name = initialName;
    return JSON.stringify(d);
  });
  const [customFeats, setCustomFeats] = useState<CustomFeat[]>([]);
  const [customClasses, setCustomClasses] = useState<CustomClass[]>([]);
  // Custom classes embedded in the character response (may belong to a different user, e.g. the
  // owner's classes when the delegate is viewing, or classes the delegate added that the owner
  // doesn't have). Merged into customClassMap so BAB/saves are always computed correctly.
  const [characterCustomClasses, setCharacterCustomClasses] = useState<CustomClass[]>([]);

  const customClassMap = useMemo<Map<string, CustomClassLookup>>(() => {
    // Owned classes take priority over same-named classes from other users.
    // characterCustomClasses override everything so the class embedded in the character
    // (e.g. the owner's definition when a delegate is viewing) is always canonical.
    const map = new Map<string, CustomClassLookup>();
    const toEntry = (cc: CustomClass): CustomClassLookup => ({
      babProgression: cc.babProgression,
      fortitudeSave: cc.fortitudeSave,
      reflexSave: cc.reflexSave,
      willSave: cc.willSave,
      classSkills: cc.classSkills,
      features: cc.features,
      skillsAtFirst: cc.skillsAtFirst,
      skillsPerLevel: cc.skillsPerLevel,
    });
    for (const cc of customClasses) {
      if (!map.has(cc.name) || cc.isOwner) map.set(cc.name, toEntry(cc));
    }
    for (const cc of characterCustomClasses) {
      map.set(cc.name, toEntry(cc));
    }
    return map;
  }, [customClasses, characterCustomClasses]);

  const [nameTouched, setNameTouched] = useState(false);
  const [showStatBlock, setShowStatBlock] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [isDelegated, setIsDelegated] = useState(false);
  const [delegatedTo, setDelegatedTo] = useState<string | null>(null);
  const [pendingInviteEmail, setPendingInviteEmail] = useState<string | null>(null);
  const [delegatePopoverOpen, setDelegatePopoverOpen] = useState(false);
  const delegateBtnRef = useRef<HTMLButtonElement>(null);
  const [endDelegationOpen, setEndDelegationOpen] = useState(false);
  const endDelegationBtnRef = useRef<HTMLButtonElement>(null);
  const saveSequenceRef = useRef(0);
  const initialSaveRef = useRef(false);
  const nameError = nameTouched && !draft.name.trim() ? 'Name is required.' : undefined;
  const isEdit = Boolean(characterId);
  const spentAbilityPoints = abilityPointBuyTotalFor(draft.abilityScores, pointBuySystem);
  const classFeatures = deriveClassFeatures(draft.classes, customClassMap);
  const remainingAbilityPoints = POINT_BUY_CONFIGS[pointBuySystem].budget - spentAbilityPoints;
  const totalLevel = totalCharacterLevel(draft.classes);
  const earnedLevelUpPoints = Math.floor(totalLevel / 4);
  const spentLevelUpPoints = ABILITY_KEYS.reduce((sum, key) => sum + (draft.abilityScores[key].levelUp ?? 0), 0);
  const abilityTotals = useMemo(() => deriveAbilityTotals(draft.abilityScores), [draft.abilityScores]);

  // Effective modifier for each ability: uses temp score override if set, otherwise the computed total.
  const abilityMods = useMemo<Record<AbilityKey, number>>(() => {
    const effectiveScore = (key: AbilityKey) =>
      draft.abilityScores[key].temp ?? abilityTotals[key];
    return {
      strength:     abilityModifier(effectiveScore('strength')),
      dexterity:    abilityModifier(effectiveScore('dexterity')),
      constitution: abilityModifier(effectiveScore('constitution')),
      intelligence: abilityModifier(effectiveScore('intelligence')),
      wisdom:       abilityModifier(effectiveScore('wisdom')),
      charisma:     abilityModifier(effectiveScore('charisma')),
    };
  }, [draft.abilityScores, abilityTotals]);

  const intelligenceMod = abilityMods.intelligence;
  const availableSkillPoints = totalSkillPointsAvailable(draft.classes, intelligenceMod, draft.race, customClassMap);
  const spentPoints = spentSkillPoints(draft.skills);
  const selectedClass = draft.classes[0];
  const calculatedCreateHitPoints = selectedClass
    ? Math.max(1, selectedClass.hitDieType + abilityModifier(abilityTotals.constitution))
    : 0;
  const combatStats = deriveCombatStats({
    combat: draft.combat,
    inventory: draft.inventory,
    feats: draft.feats,
    classes: draft.classes,
    size: draft.size,
    abilityMods,
    baseSpeed: draft.baseSpeed,
    customClassMap,
  });
  const combatSummary = `AC ${combatStats.totalAC} · Init ${signed(combatStats.initiativeTotal)} · F/R/W ${signed(combatStats.fortitudeTotal)}/${signed(combatStats.reflexTotal)}/${signed(combatStats.willTotal)}`;
  const inventorySummary = [
    draft.inventory.body?.name,
    draft.inventory.mainHand?.name,
    draft.inventory.offHandWeapon?.name,
    draft.inventory.offHandShield?.name,
  ].filter(Boolean).join(' + ') || 'No items equipped';
  const hasUnselectedClass = draft.classes.some((c) => !c.name.trim());
  const hasRequiredFields = draft.name.trim().length > 0
    && draft.classes.length > 0
    && Boolean(draft.classes[0]?.name?.trim())
    && !hasUnselectedClass;
  const headerTitle = isEdit
    ? (draft.name.trim() || 'Edit Character')
    : (draft.name.trim() || 'New Character');

  // Custom feats filtered to those available for this character's classes
  const characterClassNames = useMemo(
    () => new Set(draft.classes.map((c) => c.name).filter(Boolean)),
    [draft.classes],
  );
  const filteredCustomFeats = useMemo<FeatCatalogEntry[]>(
    () => customFeats
      .filter((cf) =>
        cf.classRestrictions.length === 0 ||
        cf.classRestrictions.some((cls) => characterClassNames.has(cls)),
      )
      .map((cf) => ({
        name: cf.name,
        featTypes: cf.featTypes,
        prerequisites: cf.prerequisites ?? '—',
        shortDescription: cf.shortDescription,
        ...(cf.repeatable ? { repeatable: true as const } : {}),
      })),
    [customFeats, characterClassNames],
  );

  // Force-save immediately when creating a new character from name generator (has initialName)
  useEffect(() => {
    if (characterId || !initialName || autoSaveCharacterId || initialSaveRef.current) return;
    
    initialSaveRef.current = true;
    
    const saveNewCharacter = async () => {
      setSaving(true);
      setError(null);
      try {
        const body = {
          ...draft,
          speed: draft.combat.speed.base,
          inventory: [],
          age: draft.age ? Number(draft.age) : undefined,
          languages: draft.languages ? draft.languages.split(',').map((s) => s.trim()).filter(Boolean) : [],
          hitPoints: {
            max: calculatedCreateHitPoints,
            current: calculatedCreateHitPoints,
            nonlethal: 0,
          },
          combat: {
            ...draft.combat,
            baseAttackBonus: baseAttackBonusFromClasses(draft.classes, customClassMap),
            speed: {
              ...draft.combat.speed,
              base: BASE_SPEED_BY_RACE[draft.race],
            },
            saves: {
              ...draft.combat.saves,
              fortitude: { ...draft.combat.saves.fortitude, base: baseSaveBonusFromClasses(draft.classes, 'fortitude', customClassMap) },
            },
          },
          feats: deriveAutoFeats(draft.classes).map((feat) => ({
            name: feat.name,
            type: feat.type,
            source: feat.source,
            shortDescription: feat.shortDescription,
            notes: feat.shortDescription,
          })),
          equipment: [],
          currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
          experience: { current: 0, nextLevel: 1000 },
        };
        
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });
        
        if (!res.ok) {
          const data = await res.json() as { error?: string };
          throw new Error(data.error ?? 'Failed to save');
        }
        
        const created = await res.json() as { _id?: string };
        if (created._id) {
          setAutoSaveCharacterId(created._id);
          setInitialDraftFingerprint(JSON.stringify(draft));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setSaving(false);
      }
    };
    
    void saveNewCharacter();
  }, [initialName, autoSaveCharacterId, characterId, draft, calculatedCreateHitPoints]);

  useEffect(() => {
    if (!characterId) return;

    let cancelled = false;

    fetch(`/api/characters/${characterId}`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error ?? 'Failed to load character');
        }
        return res.json() as Promise<Record<string, unknown>>;
      })
      .then((data) => {
        if (cancelled) return;
        const base = newCharacterDraft();
        const rawSkills = Array.isArray(data.skills) ? data.skills as Array<Record<string, unknown>> : [];
        const mergedSkills = base.skills.map((skill) => {
          const found = rawSkills.find((raw) => raw.name === skill.name);
          if (!found) return skill;
          return {
            ...skill,
            keyAbility: (found.keyAbility as string | null | undefined) ?? skill.keyAbility,
            trainedOnly: typeof found.trainedOnly === 'boolean' ? found.trainedOnly : skill.trainedOnly,
            armorCheckPenalty: typeof found.armorCheckPenalty === 'boolean' ? found.armorCheckPenalty : skill.armorCheckPenalty,
            ranks: typeof found.ranks === 'number' ? found.ranks : skill.ranks,
            classSkill: typeof found.classSkill === 'boolean' ? found.classSkill : skill.classSkill,
            miscBonus: typeof found.miscBonus === 'number' ? found.miscBonus : skill.miscBonus,
          };
        });

        const rawCombat = (data.combat as CharacterDraft['combat'] | undefined) ?? base.combat;
        const normalizedCombat: CharacterDraft['combat'] = {
          ...base.combat,
          ...rawCombat,
          initiative: { ...base.combat.initiative, ...(rawCombat.initiative ?? {}) },
          speed: { ...base.combat.speed, ...(rawCombat.speed ?? {}) },
          armorClass: { ...base.combat.armorClass, ...(rawCombat.armorClass ?? {}) },
          saves: {
            fortitude: { ...base.combat.saves.fortitude, ...(rawCombat.saves?.fortitude ?? {}) },
            reflex: { ...base.combat.saves.reflex, ...(rawCombat.saves?.reflex ?? {}) },
            will: { ...base.combat.saves.will, ...(rawCombat.saves?.will ?? {}) },
          },
        };

        const rawInv = (data.inventory as Record<string, unknown> | undefined) ?? base.inventory;
        const rawInvRecord = rawInv as Record<string, unknown>;
        const WORN_SLOT_KEYS: WornSlotKey[] = ['head', 'face', 'neck', 'shoulders', 'bodySlot', 'chest', 'wrists', 'hands', 'ringLeft', 'ringRight', 'waist', 'feet'];
        const defaultWornSlot: WornSlot = { item: '', weight: '', acType: '', acBonus: 0 };
        let normalizedWornSlots: Record<WornSlotKey, WornSlot>;
        if (typeof rawInv.wornSlots === 'object' && rawInv.wornSlots !== null) {
          // New format
          const raw = rawInv.wornSlots as Record<string, unknown>;
          normalizedWornSlots = Object.fromEntries(
            WORN_SLOT_KEYS.map((key) => {
              const s = raw[key];
              if (typeof s === 'object' && s !== null) {
                const e = s as Record<string, unknown>;
                return [key, {
                  item:    typeof e.item    === 'string' ? e.item    : '',
                  weight:  typeof e.weight  === 'string' ? e.weight  : '',
                  acType:  typeof e.acType  === 'string' ? e.acType  : '',
                  acBonus: typeof e.acBonus === 'number' ? e.acBonus : 0,
                }];
              }
              return [key, defaultWornSlot];
            }),
          ) as Record<WornSlotKey, WornSlot>;
        } else {
          // Migrate old flat-field + slotBonuses format
          const oldBonuses = (typeof rawInvRecord.slotBonuses === 'object' && rawInvRecord.slotBonuses !== null)
            ? rawInvRecord.slotBonuses as Record<string, Record<string, unknown>>
            : {};
          normalizedWornSlots = Object.fromEntries(
            WORN_SLOT_KEYS.map((key) => {
              const item    = typeof rawInvRecord[key] === 'string' ? rawInvRecord[key] as string : '';
              const bonus   = oldBonuses[key];
              return [key, {
                item,
                weight:  '',
                acType:  typeof bonus?.type  === 'string' ? bonus.type  as string : '',
                acBonus: typeof bonus?.value === 'number' ? bonus.value as number : 0,
              }];
            }),
          ) as Record<WornSlotKey, WornSlot>;
        }
        const normalizeWeaponLoadout = (raw: unknown): CharacterDraft['inventory']['mainHand'] => {
          if (typeof raw !== 'object' || raw == null) return null;
          const entry = raw as Record<string, unknown>;
          return {
            name: typeof entry.name === 'string' ? entry.name : '',
            proficiency: entry.proficiency === 'Martial' || entry.proficiency === 'Exotic' ? entry.proficiency : 'Simple',
            handedness: entry.handedness === 'Light' || entry.handedness === 'Two-Handed' ? entry.handedness : 'One-Handed',
            damage: typeof entry.damage === 'string' ? entry.damage : '—',
            critical: typeof entry.critical === 'string' ? entry.critical : '×2',
            rangeIncrement: typeof entry.rangeIncrement === 'string' ? entry.rangeIncrement : '—',
            weight: typeof entry.weight === 'string' ? entry.weight : '',
            damageType: typeof entry.damageType === 'string' ? entry.damageType : '',
            enhancementBonus: typeof entry.enhancementBonus === 'number' ? entry.enhancementBonus : 0,
            combatMod: typeof entry.combatMod === 'number' ? entry.combatMod : 0,
            attackOverride: typeof entry.attackOverride === 'string' ? entry.attackOverride : '',
            computedAttack: typeof entry.computedAttack === 'string'
              ? entry.computedAttack
              : (typeof entry.attackOverride === 'string' ? entry.attackOverride : ''),
            special: typeof entry.special === 'string' ? entry.special : '',
            material: typeof entry.material === 'string' ? entry.material : undefined,
            appliedFeats: Array.isArray(entry.appliedFeats)
              ? entry.appliedFeats.filter((feat): feat is string => typeof feat === 'string')
              : undefined,
          };
        };
        const normalizedInventory: CharacterDraft['inventory'] = {
          ...base.inventory,
          wornSlots:     normalizedWornSlots,
          body:          rawInvRecord.body          ? { ...(rawInvRecord.body as NonNullable<CharacterDraft['inventory']['body']>) } : null,
          mainHand:      normalizeWeaponLoadout(rawInvRecord.mainHand),
          offHandWeapon: normalizeWeaponLoadout(rawInvRecord.offHandWeapon),
          offHandShield: rawInvRecord.offHandShield ? { ...(rawInvRecord.offHandShield as NonNullable<CharacterDraft['inventory']['offHandShield']>) } : null,
          twfAppliedFeats: Array.isArray(rawInvRecord.twfAppliedFeats) ? rawInvRecord.twfAppliedFeats as string[] : undefined,
          backupWeapons: Array.isArray(rawInvRecord.backupWeapons)
            ? (rawInvRecord.backupWeapons as Array<Record<string, unknown>>).map((slot) => ({
                label: typeof slot.label === 'string' ? slot.label : 'Weapon',
                weapon: normalizeWeaponLoadout(slot.weapon),
              }))
            : [],
        };

        const loaded: CharacterDraft = {
          ...base,
          name: typeof data.name === 'string' ? data.name : '',
          gender: (data.gender as CharacterDraft['gender']) ?? base.gender,
          race: (data.race as CharacterDraft['race']) ?? base.race,
          racialAbilityChoice: typeof data.racialAbilityChoice === 'string' ? data.racialAbilityChoice : null,
          alignment: (data.alignment as CharacterDraft['alignment']) ?? base.alignment,
          size: (data.size as CharacterDraft['size']) ?? base.size,
          baseSpeed: typeof data.baseSpeed === 'string' ? data.baseSpeed : typeof data.baseSpeed === 'number' ? String(data.baseSpeed) : String(BASE_SPEED_BY_SIZE[(data.size as CharacterDraft['size']) ?? base.size] ?? 30),
          deity: typeof data.deity === 'string' ? data.deity : '',
          age: typeof data.age === 'number' ? String(data.age) : '',
          height: typeof data.height === 'string' ? data.height : '',
          weight: typeof data.weight === 'string' ? data.weight : '',
          eyes: typeof data.eyes === 'string' ? data.eyes : '',
          hair: typeof data.hair === 'string' ? data.hair : '',
          skin: typeof data.skin === 'string' ? data.skin : '',
          languages: Array.isArray(data.languages) ? (data.languages as string[]).join(', ') : '',
          description: typeof data.description === 'string' ? data.description : '',
          backstory: typeof data.backstory === 'string' ? data.backstory : '',
          classes: Array.isArray(data.classes)
            ? (data.classes as Array<Record<string, unknown>>).map((c) => ({
              name: (c.name as string) ?? 'Fighter',
              level: typeof c.level === 'number' ? c.level : 1,
              hitDieType: typeof c.hitDieType === 'number' ? c.hitDieType : (HIT_DIE_BY_CLASS[(c.name as string) ?? 'Fighter'] ?? 8),
              hpRolled: Array.isArray(c.hpRolled) ? (c.hpRolled as number[]) : [],
            }))
            : [],
          abilityScores: (() => {
            const raw = (data.abilityScores ?? {}) as Record<string, Partial<AbilityScore>>;
            return {
              strength:     { ...base.abilityScores.strength,     ...raw.strength },
              dexterity:    { ...base.abilityScores.dexterity,    ...raw.dexterity },
              constitution: { ...base.abilityScores.constitution, ...raw.constitution },
              intelligence: { ...base.abilityScores.intelligence, ...raw.intelligence },
              wisdom:       { ...base.abilityScores.wisdom,       ...raw.wisdom },
              charisma:     { ...base.abilityScores.charisma,     ...raw.charisma },
            };
          })(),
          hitPoints: (data.hitPoints as CharacterDraft['hitPoints']) ?? base.hitPoints,
          combat: normalizedCombat,
          inventory: normalizedInventory,
          skills: mergedSkills,
        };

        const adjustedSkills = applyClassAndRacialSkillRules(loaded.skills, loaded.classes, loaded.race, customClassMap).map((skill) => ({
          ...skill,
          bonus: computeSkillBonus(skill, loaded.abilityScores),
        }));

        const rawFeats = Array.isArray(data.feats) ? data.feats as Array<Record<string, unknown>> : [];
        const selectableSources = new Set<FeatSlot['source']>([
          'Character Feat',
          'Bonus Feat',
          'Fighter Bonus Feat',
          'Special',
        ]);
        const loadedSelectableFeats: FeatSlot[] = rawFeats
          .filter((feat): feat is Record<string, unknown> & { source: FeatSlot['source'] } => selectableSources.has(feat.source as FeatSlot['source']))
          .map((feat) => {
            const source = feat.source as FeatSlot['source'];
            return {
              name: typeof feat.name === 'string' ? feat.name : '',
              type: feat.type === 'Fighter Bonus Feat' ? 'Fighter Bonus Feat' : 'General',
              source,
              sourceLabel: typeof feat.notes === 'string' && feat.notes.trim().length > 0
                ? feat.notes
                : (source === 'Fighter Bonus Feat' ? 'Fighter Bonus Feat' : 'Character Feat'),
              shortDescription: typeof feat.shortDescription === 'string'
                ? feat.shortDescription
                : (typeof feat.name === 'string' && feat.name
                  ? (FEAT_BY_NAME.get(feat.name as string)?.shortDescription ?? '')
                  : ''),
            };
          });

        const derivedFeats = deriveSelectableFeats(loaded.classes, loaded.race);
        const feats = mergeSelectableFeats(loadedSelectableFeats, derivedFeats);
        const loadedDraft = { ...loaded, skills: adjustedSkills, feats };
        setDraft(loadedDraft);
        setAutoSaveCharacterId(characterId);
        setInitialDraftFingerprint(JSON.stringify(loadedDraft));
        setIsDelegated(Boolean(data.isDelegated));
        setDelegatedTo(typeof data.delegatedTo === 'string' ? data.delegatedTo : null);
        setPendingInviteEmail(typeof data.pendingInviteEmail === 'string' ? data.pendingInviteEmail : null);
        if (Array.isArray(data.characterCustomClasses)) {
          setCharacterCustomClasses(data.characterCustomClasses as CustomClass[]);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load character');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCharacter(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterId]);

  function setField<K extends keyof CharacterDraft>(key: K, value: CharacterDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  const setAbilityBase = useCallback((key: AbilityKey, requestedBase: number) => {
    setDraft((d) => {
      const nextBase = affordableAbilityBaseScoreFor(d.abilityScores, key, requestedBase, pointBuySystem);
      const newScores = {
        ...d.abilityScores,
        [key]: { ...d.abilityScores[key], base: nextBase },
      };
      const recalculatedSkills = applyClassAndRacialSkillRules(d.skills, d.classes, d.race, customClassMap);
      const skills = recalculatedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      return { ...d, abilityScores: newScores, skills };
    });
  }, [customClassMap, pointBuySystem]);

  const setLevelUp = useCallback((key: AbilityKey, value: number) => {
    setDraft((d) => {
      const newScores = {
        ...d.abilityScores,
        [key]: { ...d.abilityScores[key], levelUp: Math.max(0, value) },
      };
      const recalculatedSkills = applyClassAndRacialSkillRules(d.skills, d.classes, d.race, customClassMap);
      const skills = recalculatedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      return { ...d, abilityScores: newScores, skills };
    });
  }, [customClassMap])

  const setEnhancement = useCallback((key: AbilityKey, value: number) => {
    setDraft((d) => {
      const newScores = {
        ...d.abilityScores,
        [key]: { ...d.abilityScores[key], enhancement: value },
      };
      const recalculatedSkills = applyClassAndRacialSkillRules(d.skills, d.classes, d.race, customClassMap);
      const skills = recalculatedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      return { ...d, abilityScores: newScores, skills };
    });
  }, [customClassMap])

  const setAbilityTempScore = useCallback((key: AbilityKey, value: number | null) => {
    setDraft((d) => ({
      ...d,
      abilityScores: {
        ...d.abilityScores,
        [key]: { ...d.abilityScores[key], temp: value },
      },
    }));
  }, [])

  const setRace = useCallback((race: CharacterDraft['race']) => {
    setDraft((d) => {
      // When switching to a non-flexible race or a different flexible race, reset the choice
      const isFlexible = isPathfinderSystem(pointBuySystem) && PATHFINDER_FLEXIBLE_RACES.has(race);
      const newChoice = isFlexible ? (d.racialAbilityChoice ?? null) : null;
      const prevAdj = getRacialAdjFor(d.race, pointBuySystem, d.racialAbilityChoice);
      const nextAdj = getRacialAdjFor(race, pointBuySystem, newChoice);
      // Remove old racial bonus, apply new one
      const newScores = { ...d.abilityScores };
      (Object.keys(newScores) as AbilityKey[]).forEach((key) => {
        newScores[key] = {
          ...newScores[key],
          racial: (newScores[key].racial - (prevAdj[key] ?? 0)) + (nextAdj[key] ?? 0),
        };
      });
      const adjustedSkills = applyClassAndRacialSkillRules(d.skills, d.classes, race, customClassMap);
      const skills = adjustedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      const derivedFeats = deriveSelectableFeats(d.classes, race);
      const feats = mergeSelectableFeats(d.feats, derivedFeats);
      return { ...d, race, racialAbilityChoice: newChoice, size: RACIAL_SIZES[race], baseSpeed: String(BASE_SPEED_BY_RACE[race] ?? BASE_SPEED_BY_SIZE[RACIAL_SIZES[race]] ?? 30), abilityScores: newScores, skills, feats };
    });
  }, [customClassMap, pointBuySystem]);

  const setRacialAbilityChoice = useCallback((choice: string | null) => {
    setDraft((d) => {
      const prevAdj = getRacialAdjFor(d.race, pointBuySystem, d.racialAbilityChoice);
      const nextAdj = getRacialAdjFor(d.race, pointBuySystem, choice);
      const newScores = { ...d.abilityScores };
      (Object.keys(newScores) as AbilityKey[]).forEach((key) => {
        newScores[key] = {
          ...newScores[key],
          racial: (newScores[key].racial - (prevAdj[key] ?? 0)) + (nextAdj[key] ?? 0),
        };
      });
      const skills = applyClassAndRacialSkillRules(d.skills, d.classes, d.race, customClassMap).map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      return { ...d, racialAbilityChoice: choice, abilityScores: newScores, skills };
    });
  }, [customClassMap, pointBuySystem]);

  const setClasses = useCallback((classes: CharacterDraft['classes']) => {
    setDraft((d) => {
      const adjustedSkills = applyClassAndRacialSkillRules(d.skills, classes, d.race, customClassMap);
      const skills = adjustedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, d.abilityScores),
      }));
      const derivedFeats = deriveSelectableFeats(classes, d.race);
      const feats = mergeSelectableFeats(d.feats, derivedFeats);
      return { ...d, classes, skills, feats };
    });
  }, [customClassMap]);

  // Re-apply class skill flags whenever the custom class map is populated/changed
  useEffect(() => {
    if (customClassMap.size === 0) return;
    setDraft((d) => {
      const recalculated = applyClassAndRacialSkillRules(d.skills, d.classes, d.race, customClassMap);
      const skills = recalculated.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, d.abilityScores),
      }));
      return { ...d, skills };
    });
  }, [customClassMap]);

  // Fetch custom feats and custom classes once on mount
  useEffect(() => {
    fetch('/api/custom-feats', { credentials: 'include' })
      .then((r) => r.ok ? r.json() as Promise<CustomFeat[]> : Promise.resolve([]))
      .then(setCustomFeats)
      .catch(() => { /* non-critical */ });
    fetch('/api/custom-classes', { credentials: 'include' })
      .then((r) => r.ok ? r.json() as Promise<CustomClass[]> : Promise.resolve([]))
      .then(setCustomClasses)
      .catch(() => { /* non-critical */ });
  }, []);

  useEffect(() => {
    if (loadingCharacter || !hasRequiredFields || initialDraftFingerprint === null) return;

    const currentFingerprint = JSON.stringify(draft);
    if (currentFingerprint === initialDraftFingerprint) return;

    const timer = setTimeout(() => {
      const run = async () => {
        const sequence = ++saveSequenceRef.current;
        setSaving(true);
        setError(null);
        try {
          const inventoryWithComputedAttacks = stampComputedAttacksForSave(
            draft.inventory,
            combatStats.bab,
            combatStats.meleeAttack,
            combatStats.rangedAttack,
          );
          const body = {
            ...draft,
            speed: combatStats.speedFeet,
            inventory: inventoryWithComputedAttacks,
            age: draft.age ? Number(draft.age) : undefined,
            languages: draft.languages ? draft.languages.split(',').map((s) => s.trim()).filter(Boolean) : [],
            hitPoints: isEdit
              ? draft.hitPoints
              : {
                max: calculatedCreateHitPoints,
                current: calculatedCreateHitPoints,
                nonlethal: 0,
              },
            combat: {
              ...draft.combat,
              baseAttackBonus: combatStats.bab,
              speed: {
                ...draft.combat.speed,
                base:        combatStats.speedBase,
                armorAdjust: combatStats.speedArmorAdjust,
              },
              saves: {
                ...draft.combat.saves,
                fortitude: {
                  ...draft.combat.saves.fortitude,
                  base: combatStats.fortitudeBase,
                },
                reflex: {
                  ...draft.combat.saves.reflex,
                  base: combatStats.reflexBase,
                },
                will: {
                  ...draft.combat.saves.will,
                  base: combatStats.willBase,
                },
              },
            },
            feats: [
              ...deriveAutoFeats(draft.classes).map((feat) => ({
                name: feat.name,
                type: feat.type,
                source: feat.source,
                shortDescription: feat.shortDescription,
                notes: feat.shortDescription,
              })),
              ...draft.feats.filter((feat) => feat.name.trim()).map((feat) => ({
                name: feat.name,
                type: feat.type,
                source: feat.source,
                shortDescription: feat.shortDescription,
                notes: feat.sourceLabel,
              })),
            ],
            equipment: [],
            currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
            experience: { current: 0, nextLevel: 1000 },
          };
          const existingId = isEdit ? characterId ?? autoSaveCharacterId : autoSaveCharacterId;
          const endpoint = existingId ? `/api/characters/${existingId}` : '/api/characters';
          const method = existingId ? 'PUT' : 'POST';
          const res = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const data = await res.json() as { error?: string };
            throw new Error(data.error ?? 'Failed to save');
          }

          if (!existingId) {
            const created = await res.json() as { _id?: string };
            if (created._id) setAutoSaveCharacterId(created._id);
          }

          if (sequence === saveSequenceRef.current) {
            setInitialDraftFingerprint(JSON.stringify(draft));
          }
        } catch (err: unknown) {
          if (sequence === saveSequenceRef.current) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        } finally {
          if (sequence === saveSequenceRef.current) {
            setSaving(false);
          }
        }
      };

      void run();
    }, 400);

    return () => clearTimeout(timer);
    // combatStats fields are derived from draft which is already listed;
    // adding them would be redundant and confusing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draft,
    loadingCharacter,
    hasRequiredFields,
    initialDraftFingerprint,
    isEdit,
    characterId,
    autoSaveCharacterId,
    calculatedCreateHitPoints,
  ]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center mb-6 gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          title="Back to characters"
          aria-label="Back to characters"
          className="inline-flex items-center justify-center character-editor-back-button"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20 12H6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11 7L6 12L11 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center character-editor-crumb-dots"
        >
          <svg
            width="8"
            height="18"
            viewBox="0 0 8 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="4" cy="2" r="1.5" fill="currentColor" />
            <circle cx="4" cy="9" r="1.5" fill="currentColor" />
            <circle cx="4" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </span>
        <h2 className="text-xl font-semibold character-editor-title flex-1">
          {headerTitle}
        </h2>
        <div className="flex items-center gap-2 ml-auto character-editor-actions">
          {hasRequiredFields && (
            <button
              type="button"
              onClick={() => setShowStatBlock(true)}
              aria-label="Open stat block"
              className="stat-block-open-btn character-editor-action-btn"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
                <path d="M0 11H3L3 0H5L5 11H8V12L4 16L0 12V11Z" fill="currentColor"/>
                <path d="M16 10H10V8H16V10Z" fill="currentColor"/>
                <path d="M10 6H14V4H10V6Z" fill="currentColor"/>
                <path d="M12 2H10V0H12V2Z" fill="currentColor"/>
              </svg>
              <span className="character-editor-action-label">Stat Block</span>
            </button>
          )}
          {autoSaveCharacterId && (
            <button
              type="button"
              disabled={exportingPdf}
              aria-label={exportingPdf ? 'Exporting PDF' : 'Export PDF'}
              className="stat-block-open-btn character-editor-action-btn"
              onClick={async () => {
                setExportingPdf(true);
                try {
                  const res = await fetch(`/api/characters/${autoSaveCharacterId}/export-pdf`, { credentials: 'include' });
                  if (!res.ok) throw new Error('Export failed');
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${draft.name.replace(/[^a-z0-9_\- ]/gi, '_')}_character_sheet.pdf`;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  // non-critical — silently fail
                } finally {
                  setExportingPdf(false);
                }
              }}
            >
              {exportingPdf ? 'Exporting…' : (
                <>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 16H1L1 9H3L3 14H13V9H15L15 16Z" fill="currentColor"/>
                    <path d="M12 6L9 6L9 1.74846e-07L7 0V6L4 6L4 7L8 11L12 7L12 6Z" fill="currentColor"/>
                  </svg>
                  <span className="character-editor-action-label">Export PDF</span>
                </>
              )}
            </button>
          )}
          {/* Delegate button — only for existing owned characters */}
          {autoSaveCharacterId && !isDelegated && !delegatedTo && (
            <>
              <button
                ref={delegateBtnRef}
                type="button"
                onClick={() => setDelegatePopoverOpen((o) => !o)}
                className="stat-block-open-btn character-editor-action-btn"
                title={pendingInviteEmail ? `Pending invite to ${pendingInviteEmail}` : 'Delegate character'}
                aria-label={pendingInviteEmail ? 'Invite pending' : 'Delegate character'}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  <path d="M2 13c0-2.76 2.24-5 6-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <path d="M12 10l2 2-2 2M10 12h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                </svg>
                <span className="character-editor-action-label">
                  {pendingInviteEmail ? 'Invite Pending' : 'Delegate'}
                </span>
              </button>
              {delegatePopoverOpen && (
                <DelegatePopover
                  characterId={autoSaveCharacterId}
                  pendingInviteEmail={pendingInviteEmail}
                  anchorRef={delegateBtnRef}
                  onClose={() => setDelegatePopoverOpen(false)}
                  onInviteSent={(email) => { setPendingInviteEmail(email); setDelegatePopoverOpen(false); }}
                  onInviteCancelled={() => setPendingInviteEmail(null)}
                />
              )}
            </>
          )}
          {/* Owner view when delegation is active — read-only, can revoke */}
          {autoSaveCharacterId && !isDelegated && delegatedTo && (
            <>
              <button
                ref={delegateBtnRef}
                type="button"
                onClick={() => setDelegatePopoverOpen((o) => !o)}
                className="stat-block-open-btn text-[color:var(--color-done-fg)]"
                title="Character is delegated to another player"
              >
                Delegated ▾
              </button>
              {delegatePopoverOpen && (
                <EndDelegationPopover
                  characterId={autoSaveCharacterId}
                  isDelegate={false}
                  anchorRef={delegateBtnRef}
                  onClose={() => setDelegatePopoverOpen(false)}
                  onEnded={() => { setDelegatedTo(null); setDelegatePopoverOpen(false); }}
                />
              )}
            </>
          )}
          {isDelegated && (
            <>
              <button
                ref={endDelegationBtnRef}
                type="button"
                onClick={() => setEndDelegationOpen((o) => !o)}
                className="stat-block-open-btn text-[color:var(--color-accent-fg)]"
                title="You are editing this character as a delegate"
              >
                Delegated ▾
              </button>
              {endDelegationOpen && autoSaveCharacterId && (
                <EndDelegationPopover
                  characterId={autoSaveCharacterId}
                  isDelegate={true}
                  anchorRef={endDelegationBtnRef}
                  onClose={() => setEndDelegationOpen(false)}
                  onEnded={() => { setIsDelegated(false); setEndDelegationOpen(false); }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {loadingCharacter && (
        <p className="text-sm character-editor-muted">
          Loading character...
        </p>
      )}

      {!loadingCharacter && !isDelegated && delegatedTo && (
        <p className="text-sm px-3 py-2 rounded bg-[var(--color-attention-subtle)] text-[color:var(--color-attention-fg)] border border-[var(--color-attention-muted)]">
          This character is currently delegated. Fields are read-only until access is revoked.
        </p>
      )}

      {!loadingCharacter && (
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
        <div
          className={!isDelegated && delegatedTo ? 'char-editor-readonly' : ''}
          style={!isDelegated && delegatedTo ? { opacity: 0.65 } : undefined}
        >

        {/* ── Identity ── */}
        {/* ── Identity ── */}
        <Accordion
          title="Identity"
          summary={[draft.name.trim(), draft.race].filter(Boolean).join(' · ') || undefined}
          defaultOpen
        >
          <IdentitySection
            draft={draft}
            nameError={nameError}
            onNameChange={(value) => setField('name', value)}
            onNameBlur={() => setNameTouched(true)}
            onGenderChange={(value) => setField('gender', value)}
            onRaceChange={setRace}
            onAlignmentChange={(value) => setField('alignment', value)}
            onTextFieldChange={(field, value) => setField(field, value)}
          />
        </Accordion>

        {/* ── Classes ── */}
        {/* ── Classes ── */}
        <Accordion
          title={<>Class &amp; Level <span className="character-editor-required-star">*</span></>}
          summary={draft.classes.filter((c) => c.name).map((c) => `${c.name} ${c.level}`).join(' / ') || undefined}
          defaultOpen={!isEdit}
        >
          <ClassLevelSection
            classes={draft.classes}
            isEdit={isEdit}
            hitPoints={draft.hitPoints}
            calculatedCreateHitPoints={calculatedCreateHitPoints}
            inputStyle={inputStyle}
            customClasses={customClasses}
            onClassesChange={setClasses}
            onHitPointsChange={(next) => setField('hitPoints', next)}
          />
        </Accordion>

        {/* ── Ability Scores ── */}
        {/* ── Ability Scores ── */}
        <Accordion
          title="Ability Scores"
          defaultOpen={!isEdit}
          summary={(
            <>
              <span className="character-editor-summary-item"><strong>Str</strong> {abilityTotals.strength}</span>
              <span className="character-editor-summary-item"><strong>Dex</strong> {abilityTotals.dexterity}</span>
              <span className="character-editor-summary-item"><strong>Con</strong> {abilityTotals.constitution}</span>
              <span className="character-editor-summary-item"><strong>Int</strong> {abilityTotals.intelligence}</span>
              <span className="character-editor-summary-item"><strong>Wis</strong> {abilityTotals.wisdom}</span>
              <span><strong>Cha</strong> {abilityTotals.charisma}</span>
            </>
          )}
        >
          <AbilityScoresSection
            abilityScores={draft.abilityScores}
            isEdit={isEdit}
            spentAbilityPoints={spentAbilityPoints}
            remainingAbilityPoints={remainingAbilityPoints}
            earnedLevelUpPoints={earnedLevelUpPoints}
            spentLevelUpPoints={spentLevelUpPoints}
            onBaseChange={setAbilityBase}
            onLevelUpChange={setLevelUp}
            onEnhancementChange={setEnhancement}
            onTempScoreChange={(key, val) => setAbilityTempScore(key, val)}
            pointBuySystem={pointBuySystem}
            isFlexibleRace={isPathfinderSystem(pointBuySystem) && PATHFINDER_FLEXIBLE_RACES.has(draft.race)}
            racialAbilityChoice={draft.racialAbilityChoice ?? null}
            onRacialAbilityChoiceChange={setRacialAbilityChoice}
          />
        </Accordion>

        {/* ── Feats ── */}
        <Accordion
          title="Feats"
          summary={`${classFeatures.length} features · ${draft.feats.length} slots`}
        >
          <FeatsSection
            classFeatures={classFeatures}
            feats={draft.feats}
            onFeatsChange={(feats) => setField('feats', feats)}
            extraFeats={filteredCustomFeats}
          />
        </Accordion>

        {/* ── Combat ── */}
        <Accordion
          title="Combat"
          summary={combatSummary}
        >
          <CombatSection
            combat={draft.combat}
            onCombatChange={(value) => setField('combat', value)}
            derivedCombat={combatStats}
          />
        </Accordion>

        <Accordion
          title="Inventory"
          summary={inventorySummary}
        >
          <InventorySection
            inventory={draft.inventory}
            combat={draft.combat}
            derivedBaseAttackBonus={combatStats.bab}
            derivedMeleeAttackBonus={combatStats.meleeAttack}
            derivedRangedAttackBonus={combatStats.rangedAttack}
            size={draft.size}
            race={draft.race}
            feats={draft.feats}
            classes={draft.classes}
            dexterity={draft.abilityScores.dexterity.temp ?? abilityTotals.dexterity}
            onChange={(inventory, combat) => {
              setField('inventory', inventory);
              setField('combat', combat);
            }}
            inputStyle={inputStyle}
          />
        </Accordion>

        {/* ── Skills ── */}
        {/* ── Skills ── */}
        <Accordion
          title="Skills"
          defaultOpen={!isEdit}
          summary={`${spentPoints} / ${availableSkillPoints} pts allocated`}
        >
          <SkillsSection
            skills={draft.skills}
            abilityScores={draft.abilityScores}
            onChange={(s) => setField('skills', s)}
            totalSkillPoints={availableSkillPoints}
            spentPoints={spentPoints}
            totalLevel={totalLevel}
          />
        </Accordion>

        {/* ── Description / Backstory ── */}
        <Accordion title="Background">
          <BackgroundSection
            description={draft.description}
            backstory={draft.backstory}
            inputStyle={inputStyle}
            onDescriptionChange={(value) => setField('description', value)}
            onBackstoryChange={(value) => setField('backstory', value)}
          />
        </Accordion>

        {/* ── Actions ── */}
        {(saving || error) && (
          <p className={[ 'text-sm', error ? 'character-editor-danger' : 'character-editor-muted' ].join(' ')}>
            {error ?? 'Saving...'}
          </p>
        )}
        </div>
      </form>
      )}

      {showStatBlock && (
        <StatBlockModal
          data={generateStatBlock(draft, combatStats)}
          name={draft.name.trim() || 'character'}
          onClose={() => setShowStatBlock(false)}
        />
      )}
    </div>
  );
}
