import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { CharacterDraft, AbilityScore, FeatSlot, WornSlot, WornSlotKey } from '../types/character';
import { HIT_DIE_BY_CLASS } from '../types/character';
import {
  newCharacterDraft,
  abilityModifier,
  totalScore,
  buildIterativeAttackString,
  computeSkillBonus,
  RACIAL_ABILITY_ADJUSTMENTS,
  RACIAL_SIZES,
  ABILITY_POINT_BUY_BUDGET,
  abilityPointBuyTotal,
  affordableAbilityBaseScore,
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
} from '../utils/characterHelpers';
import { FEAT_BY_NAME } from '../data/feats';
import { getWeaponAttackClass } from '../data/weapons';
import type { FeatCatalogEntry } from '../components/FeatAutocomplete';
import type { CustomFeat } from '../types/customFeat';
import { IdentitySection } from './character-editor/IdentitySection';
import { BackgroundSection } from './character-editor/BackgroundSection';
import { ClassLevelSection } from './character-editor/ClassLevelSection';
import { AbilityScoresSection, ABILITY_KEYS } from './character-editor/AbilityScoresSection';
import { FeatsSection } from './character-editor/FeatsSection';
import { CombatSection } from './character-editor/CombatSection';
import type { CombatDerivedStats } from './character-editor/CombatSection';
import { InventorySection } from './character-editor/InventorySection';
import { SkillsSection } from './character-editor/SkillsSection';
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

function Accordion({
  title, summary, defaultOpen = false, children,
}: {
  title: React.ReactNode;
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const buttonClasses = 'w-full flex items-center gap-2 pb-1 mb-3 character-editor-accordion-trigger';
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
      <span className="text-sm font-semibold uppercase tracking-wider character-editor-accordion-title">
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
      {open ? (
        <button
          type="button"
          aria-expanded="true"
          onClick={() => setOpen(false)}
          className={buttonClasses}
        >
          {accordionHeader}
        </button>
      ) : (
        <button
          type="button"
          aria-expanded="false"
          onClick={() => setOpen(true)}
          className={buttonClasses}
        >
          {accordionHeader}
        </button>
      )}
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
}: {
  combat: CharacterDraft['combat'];
  inventory: CharacterDraft['inventory'];
  feats: CharacterDraft['feats'];
  classes: CharacterDraft['classes'];
  size: CharacterDraft['size'];
  abilityMods: Record<AbilityKey, number>;
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
  const acMisc = safeCombatNumber(combat.armorClass.misc);
  const initMisc = safeCombatNumber(combat.initiative.miscBonus);
  const speedBase = safeCombatNumber(combat.speed.base);
  const speedArmorAdjust = safeCombatNumber(combat.speed.armorAdjust);
  const speedFly = safeCombatNumber(combat.speed.fly);
  const speedSwim = safeCombatNumber(combat.speed.swim);
  const bab = baseAttackBonusFromClasses(classes);
  const fortitudeBase = baseSaveBonusFromClasses(classes, 'fortitude');
  const reflexBase = baseSaveBonusFromClasses(classes, 'reflex');
  const willBase = baseSaveBonusFromClasses(classes, 'will');

  const armorMaxDex = parseMaxDexBonus(inventory.body?.maxDexBonus);
  const shieldMaxDex = parseMaxDexBonus(inventory.offHandShield?.maxDexBonus);
  const maxDexCap = [armorMaxDex, shieldMaxDex]
    .filter((cap): cap is number => cap !== null)
    .reduce<number | null>((lowest, cap) => (lowest === null ? cap : Math.min(lowest, cap)), null);
  const acDexMod = dexMod <= 0
    ? dexMod
    : (maxDexCap === null ? dexMod : Math.min(dexMod, maxDexCap));

  // Slot and feat dodge bonuses stack on top of the manually-entered dodge value.
  const slotDodge = Object.values(inventory.wornSlots).reduce(
    (acc, b) => (b.acType === 'dodge' ? acc + b.acBonus : acc), 0,
  );
  const dodgeFeatBonus = feats.some((f) => f.name.trim().toLowerCase() === 'dodge') ? 1 : 0;
  const acDodge = safeCombatNumber(combat.armorClass.dodge) + slotDodge + dodgeFeatBonus;

  const totalAC = 10 + acArmor + acShield + acDexMod + sizeMod + acDodge + acNatural + acDeflection + acMisc;
  const touchAC = 10 + acDexMod + sizeMod + acDodge + acDeflection + acMisc;
  const flatFootedAC = 10 + acArmor + acShield + sizeMod + acNatural + acDeflection + acMisc;
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
  onCancel: () => void;
}

export function CharacterEditor({ characterId, onCancel }: CharacterEditorProps) {
  const [draft, setDraft] = useState<CharacterDraft>(newCharacterDraft);
  const [autoSaveCharacterId, setAutoSaveCharacterId] = useState<string | null>(characterId ?? null);
  const [loadingCharacter, setLoadingCharacter] = useState(Boolean(characterId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialDraftFingerprint, setInitialDraftFingerprint] = useState<string | null>(
    characterId ? null : JSON.stringify(newCharacterDraft()),
  );
  const [customFeats, setCustomFeats] = useState<CustomFeat[]>([]);
  const [nameTouched, setNameTouched] = useState(false);
  const [showStatBlock, setShowStatBlock] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const saveSequenceRef = useRef(0);
  const nameError = nameTouched && !draft.name.trim() ? 'Name is required.' : undefined;
  const isEdit = Boolean(characterId);
  const spentAbilityPoints = abilityPointBuyTotal(draft.abilityScores);
  const classFeatures = deriveClassFeatures(draft.classes);
  const remainingAbilityPoints = ABILITY_POINT_BUY_BUDGET - spentAbilityPoints;
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
  const availableSkillPoints = totalSkillPointsAvailable(draft.classes, intelligenceMod, draft.race);
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
    : (draft.name.trim() && draft.classes[0]?.name?.trim() ? draft.name.trim() : 'Create Character');

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
        const defaultWornSlot: WornSlot = { item: '', acType: '', acBonus: 0 };
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
        };

        const loaded: CharacterDraft = {
          ...base,
          name: typeof data.name === 'string' ? data.name : '',
          gender: (data.gender as CharacterDraft['gender']) ?? base.gender,
          race: (data.race as CharacterDraft['race']) ?? base.race,
          alignment: (data.alignment as CharacterDraft['alignment']) ?? base.alignment,
          size: (data.size as CharacterDraft['size']) ?? base.size,
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

        const adjustedSkills = applyClassAndRacialSkillRules(loaded.skills, loaded.classes, loaded.race).map((skill) => ({
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
      const nextBase = affordableAbilityBaseScore(d.abilityScores, key, requestedBase);
      const newScores = {
        ...d.abilityScores,
        [key]: { ...d.abilityScores[key], base: nextBase },
      };
      const recalculatedSkills = applyClassAndRacialSkillRules(d.skills, d.classes, d.race);
      const skills = recalculatedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      return { ...d, abilityScores: newScores, skills };
    });
  }, []);

  const setLevelUp = useCallback((key: AbilityKey, value: number) => {
    setDraft((d) => {
      const newScores = {
        ...d.abilityScores,
        [key]: { ...d.abilityScores[key], levelUp: Math.max(0, value) },
      };
      const recalculatedSkills = applyClassAndRacialSkillRules(d.skills, d.classes, d.race);
      const skills = recalculatedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      return { ...d, abilityScores: newScores, skills };
    });
  }, [])

  const setEnhancement = useCallback((key: AbilityKey, value: number) => {
    setDraft((d) => {
      const newScores = {
        ...d.abilityScores,
        [key]: { ...d.abilityScores[key], enhancement: value },
      };
      const recalculatedSkills = applyClassAndRacialSkillRules(d.skills, d.classes, d.race);
      const skills = recalculatedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      return { ...d, abilityScores: newScores, skills };
    });
  }, [])

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
      const prevAdj = RACIAL_ABILITY_ADJUSTMENTS[d.race] ?? {};
      const nextAdj = RACIAL_ABILITY_ADJUSTMENTS[race] ?? {};
      // Remove old racial bonus, apply new one
      const newScores = { ...d.abilityScores };
      (Object.keys(newScores) as AbilityKey[]).forEach((key) => {
        newScores[key] = {
          ...newScores[key],
          racial: (newScores[key].racial - (prevAdj[key] ?? 0)) + (nextAdj[key] ?? 0),
        };
      });
      const adjustedSkills = applyClassAndRacialSkillRules(d.skills, d.classes, race);
      const skills = adjustedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      const derivedFeats = deriveSelectableFeats(d.classes, race);
      const feats = mergeSelectableFeats(d.feats, derivedFeats);
      return { ...d, race, size: RACIAL_SIZES[race], abilityScores: newScores, skills, feats };
    });
  }, []);

  const setClasses = useCallback((classes: CharacterDraft['classes']) => {
    setDraft((d) => {
      const adjustedSkills = applyClassAndRacialSkillRules(d.skills, classes, d.race);
      const skills = adjustedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, d.abilityScores),
      }));
      const derivedFeats = deriveSelectableFeats(classes, d.race);
      const feats = mergeSelectableFeats(d.feats, derivedFeats);
      return { ...d, classes, skills, feats };
    });
  }, []);

  // Fetch custom feats once on mount (shared across all characters)
  useEffect(() => {
    fetch('/api/custom-feats', { credentials: 'include' })
      .then((r) => r.ok ? r.json() as Promise<CustomFeat[]> : Promise.resolve([]))
      .then(setCustomFeats)
      .catch(() => { /* non-critical — custom feats simply won't appear in autocomplete */ });
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
        <div className="flex items-center gap-2 ml-auto">
          {hasRequiredFields && (
            <button
              type="button"
              onClick={() => setShowStatBlock(true)}
              className="stat-block-open-btn"
            >
              Stat Block
            </button>
          )}
          {autoSaveCharacterId && (
            <button
              type="button"
              disabled={exportingPdf}
              className="stat-block-open-btn"
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
              {exportingPdf ? 'Exporting…' : 'Export PDF'}
            </button>
          )}
        </div>
      </div>

      {loadingCharacter && (
        <p className="text-sm character-editor-muted">
          Loading character...
        </p>
      )}

      {!loadingCharacter && (
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">

        {/* ── Identity ── */}
        {/* ── Identity ── */}
        <Accordion
          title="Identity"
          summary={[draft.name.trim(), draft.race].filter(Boolean).join(' · ') || undefined}
          defaultOpen
        >
          <IdentitySection
            draft={draft}
            isEdit={isEdit}
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
        >
          <ClassLevelSection
            classes={draft.classes}
            isEdit={isEdit}
            hitPoints={draft.hitPoints}
            calculatedCreateHitPoints={calculatedCreateHitPoints}
            inputStyle={inputStyle}
            onClassesChange={setClasses}
            onHitPointsChange={(next) => setField('hitPoints', next)}
          />
        </Accordion>

        {/* ── Ability Scores ── */}
        {/* ── Ability Scores ── */}
        <Accordion
          title="Ability Scores"
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
      </form>
      )}

      {showStatBlock && (
        <StatBlockModal
          data={generateStatBlock(draft)}
          name={draft.name.trim() || 'character'}
          onClose={() => setShowStatBlock(false)}
        />
      )}
    </div>
  );
}
