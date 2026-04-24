import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { CharacterDraft, AbilityScore, FeatSlot } from '../types/character';
import { RACES, ALIGNMENTS, GENDERS, CLASSES, HIT_DIE_BY_CLASS } from '../types/character';
import {
  newCharacterDraft,
  abilityModifier,
  totalScore,
  computeSkillBonus,
  RACIAL_ABILITY_ADJUSTMENTS,
  RACIAL_SIZES,
  ABILITY_POINT_BUY_BUDGET,
  abilityPointBuyTotal,
  affordableAbilityBaseScore,
  applyClassAndRacialSkillRules,
  totalCharacterLevel,
  maxClassSkillRanks,
  maxCrossClassSkillRanks,
  spentSkillPoints,
  totalSkillPointsAvailable,
  baseAttackBonusFromClasses,
  baseSaveBonusFromClasses,
  deriveAutoFeats,
  deriveClassFeatures,
  deriveSelectableFeats,
  mergeSelectableFeats,
} from '../utils/characterHelpers';
import type { DerivedClassFeature } from '../utils/characterHelpers';
import { FeatAutocomplete } from '../components/FeatAutocomplete';
import type { FeatCategory, FeatCatalogEntry } from '../components/FeatAutocomplete';
import { FEAT_BY_NAME } from '../data/feats';
import type { CustomFeat } from '../types/customFeat';

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>
        {label}
        {required && <span style={{ color: 'var(--color-danger-fg)', marginLeft: 2 }}>*</span>}
      </span>
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--color-canvas-default)',
  border: '1px solid var(--color-border-default)',
  borderRadius: 6,
  color: 'var(--color-fg-default)',
  padding: '4px 8px',
  fontSize: 14,
  width: '100%',
};

function TextInput({
  value, onChange, placeholder, onBlur, error,
}: { value: string; onChange: (v: string) => void; placeholder?: string; onBlur?: () => void; error?: string }) {
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          ...(error ? { borderColor: 'var(--color-danger-fg)' } : {}),
        }}
      />
      {error && (
        <span className="text-xs mt-0.5" style={{ color: 'var(--color-danger-fg)' }}>{error}</span>
      )}
    </>
  );
}

function NumberInput({
  value, onChange, min = 0, 'aria-label': ariaLabel,
}: { value: number; onChange: (v: number) => void; min?: number; 'aria-label'?: string }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ ...inputStyle, width: 72 }}
    />
  );
}

function Select<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T) => void; options: readonly T[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} style={inputStyle}>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Textarea({
  value, onChange, rows = 3,
}: { value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, resize: 'vertical' }}
    />
  );
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
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 pb-1 mb-3"
        style={{
          background: 'none',
          border: 'none',
          borderBottom: '1px solid var(--color-border-muted)',
          cursor: 'pointer',
          padding: '0 0 4px 0',
          textAlign: 'left',
        }}
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            flexShrink: 0,
            color: 'var(--color-fg-muted)',
          }}
          aria-hidden="true"
        >
          <path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-fg-default)' }}>
          {title}
        </span>
        {!open && summary && (
          <span className="text-xs font-normal normal-case tracking-normal ml-2" style={{ color: 'var(--color-fg-muted)' }}>
            {summary}
          </span>
        )}
      </button>
      {open && (
        <div
          className="flex flex-col gap-4"
          style={{ padding: '6px', paddingBottom: '24px' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Ability Scores section ────────────────────────────────────────────────────

const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
type AbilityKey = (typeof ABILITY_KEYS)[number];
const ABILITY_LABELS: Record<AbilityKey, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};

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

type CombatDerivedStats = {
  dexMod: number;
  conMod: number;
  wisMod: number;
  strMod: number;
  sizeMod: number;
  acArmor: number;
  acShield: number;
  acDodge: number;
  acNatural: number;
  acDeflection: number;
  acMisc: number;
  initMisc: number;
  speedBase: number;
  speedArmorAdjust: number;
  speedFly: number;
  speedSwim: number;
  bab: number;
  fortitudeBase: number;
  reflexBase: number;
  willBase: number;
  totalAC: number;
  touchAC: number;
  flatFootedAC: number;
  initiativeTotal: number;
  fortitudeTotal: number;
  reflexTotal: number;
  willTotal: number;
  meleeAttack: number;
  rangedAttack: number;
  speedFeet: number;
};

function deriveCombatStats({
  combat,
  classes,
  size,
  tempScores,
}: {
  combat: CharacterDraft['combat'];
  classes: CharacterDraft['classes'];
  size: CharacterDraft['size'];
  tempScores: Record<AbilityKey, number>;
}): CombatDerivedStats {
  const dexMod = abilityModifier(tempScores.dexterity);
  const conMod = abilityModifier(tempScores.constitution);
  const wisMod = abilityModifier(tempScores.wisdom);
  const strMod = abilityModifier(tempScores.strength);
  const sizeMod = SIZE_MODIFIERS[size] ?? 0;
  const acArmor = safeCombatNumber(combat.armorClass.armor);
  const acShield = safeCombatNumber(combat.armorClass.shield);
  const acDodge = safeCombatNumber(combat.armorClass.dodge);
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

  const totalAC = 10 + acArmor + acShield + dexMod + sizeMod + acDodge + acNatural + acDeflection + acMisc;
  const touchAC = 10 + dexMod + sizeMod + acDodge + acDeflection + acMisc;
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

function AbilityScoreRow({
  label, score, onBaseChange, isEdit = false,
  levelUp = 0, onLevelUpChange, earnedPoints = 0, spentPoints = 0,
  onEnhancementChange, tempScore, onTempScoreChange,
}: {
  label: string;
  score: AbilityScore;
  onBaseChange: (base: number) => void;
  isEdit?: boolean;
  levelUp?: number;
  onLevelUpChange?: (value: number) => void;
  earnedPoints?: number;
  spentPoints?: number;
  onEnhancementChange?: (value: number) => void;
  tempScore: number | null;
  onTempScoreChange: (v: number | null) => void;
}) {
  const total = totalScore(score);
  const mod = abilityModifier(total);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  const showLevelUp = isEdit && earnedPoints > 0;
  const availableToAdd = earnedPoints - spentPoints;

  const tempMod = abilityModifier(tempScore !== null ? tempScore : total);
  const tempModStr = tempMod >= 0 ? `+${tempMod}` : `${tempMod}`;

  return (
    <div
      className="flex items-center gap-3 py-1"
      style={{ borderBottom: '1px solid var(--color-border-muted)' }}
    >
      <span className="w-8 text-xs font-semibold" style={{ color: 'var(--color-fg-default)' }}>
        {label}
      </span>

      {/* Base — editable in both create and edit mode */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>base</span>
        <input
          type="number"
          aria-label={`${label} base score`}
          value={score.base}
          min={8}
          max={18}
          onChange={(e) => onBaseChange(e.target.valueAsNumber)}
          style={{ ...inputStyle, width: 56, textAlign: 'center', padding: '2px 4px' }}
        />
      </div>

      {/* Racial — read-only */}
      <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 44 }}>
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>racial</span>
        <span
          className="text-sm font-medium"
          style={{
            color: score.racial === 0 ? 'var(--color-fg-subtle)' : score.racial > 0 ? 'var(--color-success-fg)' : 'var(--color-danger-fg)',
            minWidth: 28,
            textAlign: 'center',
            lineHeight: '1.6rem',
          }}
        >
          {score.racial === 0 ? '0' : score.racial > 0 ? `+${score.racial}` : `${score.racial}`}
        </span>
      </div>

      {/* Enhancement bonus — magic items, shown in edit mode */}
      {isEdit && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>enh</span>
          <input
            type="number"
            aria-label={`${label} enhancement bonus`}
            value={score.enhancement}
            onChange={(e) => onEnhancementChange?.(e.target.valueAsNumber || 0)}
            style={{ ...inputStyle, width: 56, textAlign: 'center', padding: '2px 4px' }}
          />
        </div>
      )}

      {/* Level-up bonus — shown in edit mode when points have been earned */}
      {showLevelUp && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>lvl up</span>
          <input
            type="number"
            aria-label={`${label} level-up bonus`}
            value={levelUp}
            min={0}
            max={levelUp + availableToAdd}
            onChange={(e) => {
              const next = Math.max(0, Math.min(levelUp + availableToAdd, e.target.valueAsNumber || 0));
              onLevelUpChange?.(next);
            }}
            style={{ ...inputStyle, width: 56, textAlign: 'center', padding: '2px 4px' }}
          />
        </div>
      )}

      {/* Total */}
      <div className="flex flex-col items-center ml-1">
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>total</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-fg-default)', minWidth: 28, textAlign: 'center' }}>
          {total}
        </span>
      </div>

      {/* Modifier */}
      <div className="flex flex-col items-center ml-1">
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>mod</span>
        <span
          className="text-sm font-semibold"
          style={{ color: mod >= 0 ? 'var(--color-success-fg)' : 'var(--color-danger-fg)', minWidth: 28, textAlign: 'center' }}
        >
          {modStr}
        </span>
      </div>

      {/* Temp — local "what if" calculator */}
      <div className="flex items-center gap-3 ml-4 pl-4" style={{ borderLeft: '1px solid var(--color-border-muted)' }}>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>temp</span>
          <input
            type="number"
            aria-label={`${label} temporary score`}
            value={tempScore ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              onTempScoreChange(raw === '' ? null : e.target.valueAsNumber);
            }}
            style={{ ...inputStyle, width: 56, textAlign: 'center', padding: '2px 4px' }}
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>temp mod</span>
          <span
            className="text-sm font-semibold"
            style={{
              color: tempMod >= 0 ? 'var(--color-success-fg)' : 'var(--color-danger-fg)',
              minWidth: 28,
              textAlign: 'center',
              lineHeight: '1.6rem',
            }}
          >
            {tempModStr}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Classes section ───────────────────────────────────────────────────────────

function ClassesSection({
  classes, onChange, isCreate = false,
}: {
  classes: CharacterDraft['classes'];
  onChange: (c: CharacterDraft['classes']) => void;
  isCreate?: boolean;
}) {
  const classSelectWidth = `${Math.max('— Select class —'.length, ...CLASSES.map((className) => className.length)) + 2}ch`;

  // ── Create mode: single class dropdown, level always 1 ──
  if (isCreate) {
    const selectedName = classes[0]?.name ?? '';
    function handleClassChange(name: string) {
      if (!name) { onChange([]); return; }
      onChange([{ name, level: 1, hitDieType: HIT_DIE_BY_CLASS[name] ?? 8, hpRolled: [] }]);
    }
    return (
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-3">
          <select
            aria-label="Class"
            value={selectedName}
            onChange={(e) => handleClassChange(e.target.value)}
            style={{ ...inputStyle, width: classSelectWidth }}
          >
            <option value="">— Select class —</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {selectedName && (
            <span className="text-sm" style={{ color: 'var(--color-fg-default)' }}>
              Level 1 &nbsp;·&nbsp; d{HIT_DIE_BY_CLASS[selectedName]} hit die
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Edit mode: multi-class with add and level edits ──
  function add() {
    onChange([...classes, { name: '', level: 1, hitDieType: 8, hpRolled: [] }]);
  }
  function update(i: number, field: 'name' | 'level', value: string | number) {
    const updated = classes.map((c, idx) => {
      if (idx !== i) return c;
      if (field === 'name') {
        const name = value as string;
        return { ...c, name, hitDieType: HIT_DIE_BY_CLASS[name] ?? 8 };
      }
      return { ...c, level: value as number };
    });
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-2">
      {classes.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            aria-label={i === 0 ? 'Class' : `Multiclass ${i + 1}`}
            value={c.name}
            onChange={(e) => update(i, 'name', e.target.value)}
            style={{ ...inputStyle, width: classSelectWidth }}
            disabled={i === 0}
            required={i > 0}
          >
            <option value="">— Select class —</option>
            {CLASSES.map((className) => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
          <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Lv</span>
          <NumberInput value={c.level} min={1} aria-label={`${c.name || 'Class'} level`} onChange={(v) => update(i, 'level', v)} />
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>{c.name ? `d${c.hitDieType}` : ''}</span>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs px-3 py-1 rounded self-start"
        style={{
          border: '1px solid var(--color-border-default)',
          color: 'var(--color-fg-default)',
          cursor: 'pointer',
        }}
      >
        + Add Class
      </button>
      <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
        Character Level: {totalCharacterLevel(classes)}
      </p>
    </div>
  );
}

// ── Skills section ────────────────────────────────────────────────────────────

function SkillsSection({
  skills, abilityScores, onChange, totalSkillPoints, spentPoints, totalLevel,
}: {
  skills: CharacterDraft['skills'];
  abilityScores: CharacterDraft['abilityScores'];
  onChange: (s: CharacterDraft['skills']) => void;
  totalSkillPoints: number;
  spentPoints: number;
  totalLevel: number;
}) {
  const maxClassRanks = maxClassSkillRanks(totalLevel);
  const maxCrossRanks = maxCrossClassSkillRanks(totalLevel);
  const isOverspent = spentPoints > totalSkillPoints;

  function updateRanks(i: number, ranks: number) {
    const target = skills[i];
    if (!target) return;

    const rankCap = target.classSkill ? maxClassRanks : maxCrossRanks;
    const normalizedRequested = Number.isFinite(ranks)
      ? Math.max(0, target.classSkill ? Math.floor(ranks) : Math.floor(ranks * 2) / 2)
      : 0;
    const finalRanks = Math.min(rankCap, normalizedRequested);

    const updated = skills.map((sk, idx) => {
      if (idx !== i) return sk;
      const updated = {
        ...sk,
        ranks: sk.classSkill ? Math.floor(finalRanks) : Math.floor(finalRanks * 2) / 2,
      };
      return { ...updated, bonus: computeSkillBonus(updated, abilityScores) };
    });
    onChange(updated);
  }

  function updateMiscBonus(i: number, miscBonus: number) {
    const updated = skills.map((sk, idx) => {
      if (idx !== i) return sk;
      const next = { ...sk, miscBonus: Number.isFinite(miscBonus) ? Math.trunc(miscBonus) : 0 };
      return { ...next, bonus: computeSkillBonus(next, abilityScores) };
    });
    onChange(updated);
  }

  function resetRanks() {
    const updated = skills.map((sk) => {
      const next = { ...sk, ranks: 0 };
      return { ...next, bonus: computeSkillBonus(next, abilityScores) };
    });
    onChange(updated);
  }

  return (
    <div
      className="rounded overflow-hidden"
      style={{ border: '1px solid var(--color-border-default)' }}
    >
      <div
        className="px-3 py-2 text-xs flex items-center justify-end gap-2"
        style={{
          color: isOverspent ? 'var(--color-danger-fg)' : 'var(--color-fg-muted)',
          borderBottom: '1px solid var(--color-border-default)',
          background: 'var(--color-canvas-subtle)',
        }}
      >
        <span>
          {spentPoints} / {totalSkillPoints} points spent · {Math.max(0, totalSkillPoints - spentPoints)} remaining · max ranks: class {maxClassRanks}, cross-class {maxCrossRanks}
        </span>
        <button
          type="button"
          onClick={resetRanks}
          title="Reset all ranks to 0"
          aria-label="Reset all ranks to 0"
          className="inline-flex items-center justify-center"
          style={{
            border: '1px solid var(--color-border-default)',
            borderRadius: 4,
            color: 'var(--color-fg-muted)',
            background: 'var(--color-canvas-default)',
            width: 22,
            height: 22,
            cursor: 'pointer',
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20 11a8 8 0 1 0-2.34 5.66"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 4v7h-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <table aria-label="Skills" className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: 'var(--color-canvas-subtle)' }}>
            {['', 'Skill', 'Key Ability', 'Class', 'Score', 'Bonus', 'Ranks', 'Misc Bonus'].map((h) => (
              <th
                key={h}
                aria-label={h === '' ? 'Trained only' : undefined}
                className={`px-3 py-2 font-medium ${h === 'Score' || h === 'Bonus' ? 'text-right' : 'text-left'}`}
                style={{ color: 'var(--color-fg-muted)', borderBottom: '1px solid var(--color-border-default)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((sk, i) => {
            const bonus = computeSkillBonus(sk, abilityScores);
            const abilityBonus = sk.keyAbility
              ? abilityModifier(totalScore(abilityScores[sk.keyAbility as keyof CharacterDraft['abilityScores']]))
              : 0;
            const bonusStr = `${bonus}`;
            const abilityBonusStr = abilityBonus >= 0 ? `+${abilityBonus}` : `${abilityBonus}`;
            const rankCap = sk.classSkill ? maxClassRanks : maxCrossRanks;
            const isRankOverMax = sk.ranks > rankCap;
            return (
              <tr
                key={sk.name}
                style={{
                  background: i % 2 === 0 ? 'var(--color-canvas-default)' : 'var(--color-canvas-subtle)',
                  borderBottom: '1px solid var(--color-border-muted)',
                }}
              >
                <td className="px-3 py-1 text-center" style={{ color: 'var(--color-fg-muted)' }}>
                  {sk.trainedOnly ? 'T' : ''}
                </td>
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-default)' }}>{sk.name}</td>
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-muted)' }}>
                  {sk.keyAbility ? sk.keyAbility.slice(0, 3).toUpperCase() : '0'}
                </td>
                <td className="px-3 py-1 text-center" style={{ color: 'var(--color-fg-muted)' }}>
                  <input
                    type="checkbox"
                    aria-label={`${sk.name} is class skill`}
                    checked={sk.classSkill}
                    readOnly
                    style={{ accentColor: 'black', width: 14, height: 14 }}
                  />
                </td>
                <td className="px-3 py-1 text-right font-semibold" style={{ color: 'var(--color-fg-default)' }}>
                  {bonusStr}
                </td>
                <td className="px-3 py-1 text-right" style={{ color: 'var(--color-fg-default)' }}>
                  {abilityBonusStr}
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    aria-label={`${sk.name} ranks`}
                    value={sk.ranks}
                    min={0}
                    step={sk.classSkill ? 1 : 0.5}
                    onChange={(e) => updateRanks(i, Number(e.target.value))}
                    style={{
                      ...inputStyle,
                      width: 52,
                      padding: '2px 4px',
                      textAlign: 'center',
                      color: isRankOverMax ? 'var(--color-danger-fg)' : inputStyle.color,
                      border: isRankOverMax ? '1px solid var(--color-danger-fg)' : inputStyle.border,
                    }}
                  />
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    aria-label={`${sk.name} misc bonus`}
                    value={sk.miscBonus}
                    onChange={(e) => updateMiscBonus(i, Number(e.target.value))}
                    style={{ ...inputStyle, width: 62, padding: '2px 4px', textAlign: 'center' }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main editor ───────────────────────────────────────────────────────────────

function CombatSection({
  combat,
  onCombatChange,
  derivedCombat,
}: {
  combat: CharacterDraft['combat'];
  onCombatChange: (value: CharacterDraft['combat']) => void;
  derivedCombat: CombatDerivedStats;
}) {
  const {
    dexMod,
    conMod,
    wisMod,
    strMod,
    sizeMod,
    acArmor,
    acShield,
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
  } = derivedCombat;

  function updateNumeric(path: string, value: number) {
    const safe = Number.isFinite(value) ? Math.trunc(value) : 0;
    const parts = path.split('.');
    onCombatChange((() => {
      if (parts.length === 1) {
        const [k1] = parts as [keyof CharacterDraft['combat']];
        return {
          ...combat,
          [k1]: safe,
        } as CharacterDraft['combat'];
      }
      if (parts.length === 2) {
        const [k1, k2] = parts as [keyof CharacterDraft['combat'], string];
        return {
          ...combat,
          [k1]: {
            ...(combat[k1] as Record<string, unknown>),
            [k2]: safe,
          },
        } as CharacterDraft['combat'];
      }
      const [k1, k2, k3] = parts as [keyof CharacterDraft['combat'], string, string];
      return {
        ...combat,
        [k1]: {
          ...(combat[k1] as Record<string, unknown>),
          [k2]: {
            ...((combat[k1] as Record<string, Record<string, number>>)[k2]),
            [k3]: safe,
          },
        },
      } as CharacterDraft['combat'];
    })());
  }

  function statRow(label: string, total: string | number, parts: React.ReactNode) {
    return (
      <div className="flex items-stretch gap-3">
        <div
          className="shrink-0 rounded px-2 py-1 min-w-[92px]"
          style={{ border: '1px solid var(--color-border-default)', background: 'var(--color-canvas-subtle)' }}
        >
          <div className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{label}</div>
          <div className="text-lg font-semibold leading-none mt-0.5" style={{ color: 'var(--color-fg-default)' }}>{total}</div>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          {parts}
        </div>
      </div>
    );
  }

  function modInput(label: string, value: number, onChange?: (v: number) => void, min = -20) {
    return (
      <label className="flex items-center gap-1">
        <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{label}</span>
        <input
          type="number"
          value={value}
          min={min}
          readOnly={!onChange}
          onChange={onChange ? (e) => onChange(Number(e.target.value)) : undefined}
          style={{
            ...inputStyle,
            width: 56,
            textAlign: 'center',
            color: onChange ? 'var(--color-fg-default)' : 'var(--color-fg-muted)',
            background: onChange ? 'var(--color-canvas-default)' : 'var(--color-canvas-subtle)',
            cursor: onChange ? 'text' : 'default',
          }}
        />
      </label>
    );
  }

  function subsection(title: string, content: React.ReactNode, withBorder = true) {
    return (
      <section
        className="flex flex-col gap-3"
        style={{
          paddingBottom: 8,
          marginBottom: 2,
          borderBottom: withBorder ? '1px solid var(--color-border-muted)' : 'none',
        }}
      >
        <h4
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--color-fg-muted)' }}
        >
          {title}
        </h4>
        {content}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {subsection(
        'Armor Class',
        statRow(
          'AC',
          totalAC,
          <>
            {modInput('Armor', acArmor, (v) => updateNumeric('armorClass.armor', v))}
            {modInput('Shield', acShield, (v) => updateNumeric('armorClass.shield', v))}
            {modInput('Dex', dexMod)}
            {modInput('Dodge', acDodge, (v) => updateNumeric('armorClass.dodge', v))}
            {modInput('Deflection', acDeflection, (v) => updateNumeric('armorClass.deflection', v))}
            {modInput('Natural', acNatural, (v) => updateNumeric('armorClass.natural', v))}
            {modInput('Misc', acMisc, (v) => updateNumeric('armorClass.misc', v))}
            <div className="basis-full text-xs" style={{ color: 'var(--color-fg-muted)' }}>
              Touch {touchAC} / Flat {flatFootedAC}
            </div>
          </>,
        ),
      )}

      {subsection(
        'Saving Throws',
        <>
          {statRow(
            'Fortitude',
            signed(fortitudeTotal),
            <>
              {modInput('Base', fortitudeBase)}
              {modInput('Con', conMod)}
              {modInput('Magic', combat.saves.fortitude.magic, (v) => updateNumeric('saves.fortitude.magic', v))}
              {modInput('Misc', combat.saves.fortitude.misc, (v) => updateNumeric('saves.fortitude.misc', v))}
            </>,
          )}

          {statRow(
            'Reflex',
            signed(reflexTotal),
            <>
              {modInput('Base', reflexBase)}
              {modInput('Dex', dexMod)}
              {modInput('Magic', combat.saves.reflex.magic, (v) => updateNumeric('saves.reflex.magic', v))}
              {modInput('Misc', combat.saves.reflex.misc, (v) => updateNumeric('saves.reflex.misc', v))}
            </>,
          )}

          {statRow(
            'Will',
            signed(willTotal),
            <>
              {modInput('Base', willBase)}
              {modInput('Wis', wisMod)}
              {modInput('Magic', combat.saves.will.magic, (v) => updateNumeric('saves.will.magic', v))}
              {modInput('Misc', combat.saves.will.misc, (v) => updateNumeric('saves.will.misc', v))}
            </>,
          )}
        </>,
      )}

      {subsection(
        'Attacks',
        <>
          {statRow(
            'Melee Atk',
            signed(meleeAttack),
            <>
              {modInput('BAB', bab)}
              {modInput('Str', strMod)}
              {modInput('Size', sizeMod)}
            </>,
          )}

          {statRow(
            'Ranged Atk',
            signed(rangedAttack),
            <>
              {modInput('BAB', bab)}
              {modInput('Dex', dexMod)}
              {modInput('Size', sizeMod)}
            </>,
          )}
        </>,
      )}

      {subsection(
        'Movement',
        <>
          {statRow(
            'Speed',
            `${speedFeet} ft`,
            <>
              {modInput('Base', speedBase, (v) => updateNumeric('speed.base', v), 0)}
              {modInput('Armor Adj', speedArmorAdjust, (v) => updateNumeric('speed.armorAdjust', v), -60)}
              {modInput('Fly', speedFly, (v) => updateNumeric('speed.fly', v), 0)}
              {modInput('Swim', speedSwim, (v) => updateNumeric('speed.swim', v), 0)}
            </>,
          )}

          {statRow(
            'Initiative',
            signed(initiativeTotal),
            <>
              {modInput('Dex', dexMod)}
              {modInput('Misc', initMisc, (v) => updateNumeric('initiative.miscBonus', v))}
            </>,
          )}
        </>,
        false,
      )}

      <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
        Save inputs are ordered: base, magic, misc, temp. AC follows SRD: 10 + armor + shield + Dex + size + dodge + natural + deflection + misc.
      </p>
    </div>
  );
}

function InfoButton({ text }: { text: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <span
        role="img"
        aria-label="More information"
        onMouseEnter={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setPos(null)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: '1px solid currentColor',
          color: 'var(--color-fg-muted)',
          fontSize: 9,
          fontWeight: 'bold',
          lineHeight: 1,
          cursor: 'help',
          marginLeft: 5,
          flexShrink: 0,
          verticalAlign: 'middle',
          userSelect: 'none',
        }}
      >
        ?
      </span>
      {pos !== null && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            top: pos.y + 14,
            left: pos.x + 14,
            zIndex: 9999,
            background: 'var(--color-canvas-overlay, #fff)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 12,
            lineHeight: 1.6,
            maxWidth: 380,
            whiteSpace: 'normal',
            color: 'var(--color-fg-default)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          {text}
        </div>,
        document.body,
      )}
    </>
  );
}

function ClassFeaturesSection({ features }: { features: DerivedClassFeature[] }) {
  if (features.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
        Select a class to see class features.
      </p>
    );
  }

  return (
    <div className="rounded overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
      <table aria-label="Class features" className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: 'var(--color-canvas-subtle)' }}>
            {['Feature', 'Class (Level)', 'Description'].map((header) => (
              <th key={header} className="px-3 py-2 text-left font-medium"
                style={{ color: 'var(--color-fg-muted)', borderBottom: '1px solid var(--color-border-default)' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr
              key={`${feature.className}-${feature.id}`}
              style={{
                background: index % 2 === 0 ? 'var(--color-canvas-default)' : 'var(--color-canvas-subtle)',
                borderBottom: '1px solid var(--color-border-muted)',
              }}
            >
              <td className="px-3 py-2 font-medium" style={{ color: 'var(--color-fg-default)', whiteSpace: 'nowrap' }}>
                {feature.name}
              </td>
              <td className="px-3 py-2" style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                {feature.className} {feature.minLevel}
              </td>
              <td className="px-3 py-2" style={{ color: 'var(--color-fg-muted)' }}>
                {feature.shortDescription}
                <InfoButton text={feature.fullDescription} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getAllowedCategories(feat: FeatSlot): ReadonlyArray<FeatCategory> | undefined {
  if (feat.type === 'Fighter Bonus Feat') return ['Fighter Bonus Feat'];
  if (/^Wizard Level/.test(feat.sourceLabel)) return ['Item Creation', 'Metamagic', 'Special'];
  return undefined;
}

function SelectableFeatsSection({
  feats,
  onChange,
  extraFeats,
}: {
  feats: FeatSlot[];
  onChange: (feats: FeatSlot[]) => void;
  extraFeats?: ReadonlyArray<FeatCatalogEntry>;
}) {
  // Names selected in other slots — used to block duplicate non-repeatable feats.
  const takenNames = useMemo(
    () => new Set(feats.map((f) => f.name).filter(Boolean)),
    [feats],
  );
  function updateName(i: number, name: string, shortDescription?: string) {
    onChange(feats.map((f, idx) =>
      idx === i ? { ...f, name, shortDescription: shortDescription ?? '' } : f,
    ));
  }

  function removeFeat(i: number) {
    onChange(feats.filter((_, idx) => idx !== i));
  }

  function addFeat() {
    onChange([...feats, { name: '', type: 'General', source: 'Special', sourceLabel: 'Additional' }]);
  }

  const TABLE_HEADERS = ['Feat', 'Description', 'Type', 'Source', ''];

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
        <table aria-label="Selectable feats" className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: 'var(--color-canvas-subtle)' }}>
              {TABLE_HEADERS.map((header) => (
                <th key={header} className="px-3 py-2 text-left font-medium"
                  style={{ color: 'var(--color-fg-muted)', borderBottom: '1px solid var(--color-border-default)' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {feats.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-center"
                  style={{ color: 'var(--color-fg-subtle)' }}>
                  No feat slots yet — select a class to populate.
                </td>
              </tr>
            )}
            {feats.map((feat, i) => (
              <tr key={i}
                style={{
                  background: i % 2 === 0 ? 'var(--color-canvas-default)' : 'var(--color-canvas-subtle)',
                  borderBottom: '1px solid var(--color-border-muted)',
                }}
              >
                <td className="px-3 py-1">
                  <FeatAutocomplete
                    ariaLabel={`${feat.sourceLabel} feat name`}
                    value={feat.name}
                    onChange={(name, sd) => updateName(i, name, sd)}
                    allowedCategories={getAllowedCategories(feat)}
                    takenNames={takenNames}
                    extraFeats={extraFeats}
                    placeholder={
                      feat.type === 'Fighter Bonus Feat'
                        ? 'Choose fighter bonus feat…'
                        : /^Wizard Level/.test(feat.sourceLabel)
                          ? 'Choose metamagic / item creation feat…'
                          : 'Search feats…'
                    }
                    style={{ ...inputStyle, width: '100%', minWidth: 180 }}
                  />
                </td>
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-muted)', fontSize: 11 }}>
                  {feat.shortDescription ?? ''}
                </td>
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-default)', whiteSpace: 'nowrap' }}>
                  {feat.type}
                </td>
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                  {feat.sourceLabel}
                </td>
                <td className="px-3 py-1 text-center">
                  {feat.source === 'Special' && (
                    <button
                      type="button"
                      aria-label={`Remove additional feat ${i + 1}`}
                      onClick={() => removeFeat(i)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-fg-muted)',
                        cursor: 'pointer',
                        fontSize: 14,
                        lineHeight: 1,
                        padding: '0 4px',
                      }}
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addFeat}
        className="text-xs px-3 py-1 rounded self-start"
        style={{
          border: '1px solid var(--color-border-default)',
          color: 'var(--color-fg-default)',
          cursor: 'pointer',
          background: 'transparent',
        }}
      >
        + Add Feat
      </button>
    </div>
  );
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

  const [tempScores, setTempScores] = useState<Record<AbilityKey, number>>(() => ({
    strength:     draft.abilityScores.strength.temp     ?? abilityTotals.strength,
    dexterity:    draft.abilityScores.dexterity.temp    ?? abilityTotals.dexterity,
    constitution: draft.abilityScores.constitution.temp ?? abilityTotals.constitution,
    intelligence: draft.abilityScores.intelligence.temp ?? abilityTotals.intelligence,
    wisdom:       draft.abilityScores.wisdom.temp       ?? abilityTotals.wisdom,
    charisma:     draft.abilityScores.charisma.temp     ?? abilityTotals.charisma,
  }));
  useEffect(() => {
    setTempScores((prev) => ({
      strength:     draft.abilityScores.strength.temp     ?? (prev.strength     === abilityTotals.strength ? abilityTotals.strength : prev.strength),
      dexterity:    draft.abilityScores.dexterity.temp    ?? (prev.dexterity    === abilityTotals.dexterity ? abilityTotals.dexterity : prev.dexterity),
      constitution: draft.abilityScores.constitution.temp ?? (prev.constitution === abilityTotals.constitution ? abilityTotals.constitution : prev.constitution),
      intelligence: draft.abilityScores.intelligence.temp ?? (prev.intelligence === abilityTotals.intelligence ? abilityTotals.intelligence : prev.intelligence),
      wisdom:       draft.abilityScores.wisdom.temp       ?? (prev.wisdom       === abilityTotals.wisdom ? abilityTotals.wisdom : prev.wisdom),
      charisma:     draft.abilityScores.charisma.temp     ?? (prev.charisma     === abilityTotals.charisma ? abilityTotals.charisma : prev.charisma),
    }));
  }, [abilityTotals]);

  const intelligenceMod = abilityModifier(abilityTotals.intelligence);
  const availableSkillPoints = totalSkillPointsAvailable(draft.classes, intelligenceMod, draft.race);
  const spentPoints = spentSkillPoints(draft.skills);
  const selectedClass = draft.classes[0];
  const calculatedCreateHitPoints = selectedClass
    ? Math.max(1, selectedClass.hitDieType + abilityModifier(abilityTotals.constitution))
    : 0;
  const combatStats = deriveCombatStats({
    combat: draft.combat,
    classes: draft.classes,
    size: draft.size,
    tempScores,
  });
  const combatSummary = `AC ${combatStats.totalAC} · Init ${signed(combatStats.initiativeTotal)} · F/R/W ${signed(combatStats.fortitudeTotal)}/${signed(combatStats.reflexTotal)}/${signed(combatStats.willTotal)}`;
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
          const body = {
            ...draft,
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
          className="inline-flex items-center justify-center"
          style={{
            width: 30,
            height: 30,
            border: 'none',
            color: 'var(--color-fg-muted)',
            background: 'transparent',
            cursor: 'pointer',
            padding: 0,
          }}
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
          className="inline-flex items-center justify-center"
          style={{ width: 10, color: 'var(--color-fg-muted)' }}
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
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-fg-default)' }}>
          {headerTitle}
        </h2>
      </div>

      {loadingCharacter && (
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
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
          <div className="grid grid-cols-3 gap-4">
            <Field label="Name" required>
              <TextInput
                value={draft.name}
                onChange={(v) => setField('name', v)}
                onBlur={() => setNameTouched(true)}
                error={nameError}
                placeholder="Character name"
              />
            </Field>
            <Field label="Gender">
              <Select value={draft.gender} onChange={(v) => setField('gender', v)} options={GENDERS} />
            </Field>
            <Field label="Race">
              <select
                value={draft.race}
                onChange={(e) => setRace(e.target.value as CharacterDraft['race'])}
                style={inputStyle}
                disabled={isEdit}
              >
                {RACES.map((race) => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>
            </Field>
            <Field label="Alignment">
              <Select value={draft.alignment} onChange={(v) => setField('alignment', v)} options={ALIGNMENTS} />
            </Field>
            <Field label="Size">
              <input
                type="text"
                value={draft.size}
                readOnly
                style={{
                  ...inputStyle,
                  color: 'var(--color-fg-muted)',
                  cursor: 'default',
                }}
              />
            </Field>
            <Field label="Deity">
              <TextInput value={draft.deity} onChange={(v) => setField('deity', v)} />
            </Field>
            <Field label="Age">
              <TextInput value={draft.age} onChange={(v) => setField('age', v)} placeholder="e.g. 25" />
            </Field>
            <Field label="Height">
              <TextInput value={draft.height} onChange={(v) => setField('height', v)} placeholder="e.g. 5'10&quot;" />
            </Field>
            <Field label="Weight">
              <TextInput value={draft.weight} onChange={(v) => setField('weight', v)} placeholder="e.g. 180 lbs" />
            </Field>
            <Field label="Eyes">
              <TextInput value={draft.eyes} onChange={(v) => setField('eyes', v)} />
            </Field>
            <Field label="Hair">
              <TextInput value={draft.hair} onChange={(v) => setField('hair', v)} />
            </Field>
            <Field label="Skin">
              <TextInput value={draft.skin} onChange={(v) => setField('skin', v)} />
            </Field>
          </div>
          <Field label="Languages (comma-separated)">
            <TextInput value={draft.languages} onChange={(v) => setField('languages', v)} placeholder="Common, Elvish…" />
          </Field>
        </Accordion>

        {/* ── Classes ── */}
        {/* ── Classes ── */}
        <Accordion
          title={<>Class &amp; Level <span style={{ color: 'var(--color-danger-fg)', fontSize: '0.75rem' }}>*</span></>}
          summary={draft.classes.filter((c) => c.name).map((c) => `${c.name} ${c.level}`).join(' / ') || undefined}
        >
          <ClassesSection
            classes={draft.classes}
            onChange={setClasses}
            isCreate={!isEdit}
          />
          {isEdit ? (
            <div className="grid grid-cols-3 gap-4 max-w-xl">
              <Field label="Hit Points">
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(draft.hitPoints.max)}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D+/g, '');
                    const max = digitsOnly === '' ? 0 : Number(digitsOnly);
                    setField('hitPoints', {
                      ...draft.hitPoints,
                      max,
                      current: max,
                    });
                  }}
                  style={{ ...inputStyle, width: 96 }}
                />
              </Field>
              <Field label="Nonlethal">
                <NumberInput
                  value={draft.hitPoints.nonlethal}
                  min={0}
                  onChange={(v) => setField('hitPoints', { ...draft.hitPoints, nonlethal: Math.max(0, Math.trunc(v)) })}
                />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 max-w-xl">
              <Field label="Hit Points">
                <input
                  type="text"
                  value={calculatedCreateHitPoints}
                  readOnly
                  style={{ ...inputStyle, width: 96, color: 'var(--color-fg-muted)', cursor: 'default' }}
                />
              </Field>
            </div>
          )}
        </Accordion>

        {/* ── Ability Scores ── */}
        {/* ── Ability Scores ── */}
        <Accordion
          title="Ability Scores"
          summary={(
            <>
              <span style={{ marginRight: 10 }}><strong>Str</strong> {abilityTotals.strength}</span>
              <span style={{ marginRight: 10 }}><strong>Dex</strong> {abilityTotals.dexterity}</span>
              <span style={{ marginRight: 10 }}><strong>Con</strong> {abilityTotals.constitution}</span>
              <span style={{ marginRight: 10 }}><strong>Int</strong> {abilityTotals.intelligence}</span>
              <span style={{ marginRight: 10 }}><strong>Wis</strong> {abilityTotals.wisdom}</span>
              <span><strong>Cha</strong> {abilityTotals.charisma}</span>
            </>
          )}
        >
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
            {spentAbilityPoints} / {ABILITY_POINT_BUY_BUDGET} points spent · {remainingAbilityPoints} remaining
            {isEdit && earnedLevelUpPoints > 0 && (
              <> · Level-up: {spentLevelUpPoints} / {earnedLevelUpPoints} assigned</>
            )}
          </p>
          <div className="flex flex-col gap-2">
            {ABILITY_KEYS.map((key) => (
              <AbilityScoreRow
                key={key}
                label={ABILITY_LABELS[key]}
                score={draft.abilityScores[key]}
                onBaseChange={(base) => setAbilityBase(key, base)}
                isEdit={isEdit}
                levelUp={draft.abilityScores[key].levelUp ?? 0}
                onLevelUpChange={(val) => setLevelUp(key, val)}
                earnedPoints={earnedLevelUpPoints}
                spentPoints={spentLevelUpPoints}
                onEnhancementChange={(val) => setEnhancement(key, val)}
                tempScore={draft.abilityScores[key].temp}
                onTempScoreChange={(val) => {
                  setTempScores((prev) => ({ ...prev, [key]: val ?? abilityTotals[key] }));
                  setAbilityTempScore(key, val);
                }}
              />
            ))}
          </div>
          {isEdit && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-fg-subtle)' }}>
              enh = permanent stat enhancement
            </p>
          )}
        </Accordion>

        {/* ── Feats ── */}
        <Accordion
          title="Feats"
          summary={`${classFeatures.length} features · ${draft.feats.length} slots`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-fg-muted)' }}>
            Class Features
          </p>
          <p className="text-sm mb-2" style={{ color: 'var(--color-fg-subtle)' }}>
            Features granted automatically by class. Hover a feature name to see the full description.
          </p>
          <ClassFeaturesSection features={classFeatures} />

          <p className="text-xs font-semibold uppercase tracking-wider mt-4 mb-1" style={{ color: 'var(--color-fg-muted)' }}>
            Feat Slots
          </p>
          <p className="text-sm mb-2" style={{ color: 'var(--color-fg-subtle)' }}>
            Slots granted by character level, race, and class bonus feats. Enter the chosen feat name.
          </p>
          <SelectableFeatsSection
            feats={draft.feats}
            onChange={(feats) => setField('feats', feats)}
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
          <Field label="Description">
            <Textarea value={draft.description} onChange={(v) => setField('description', v)} />
          </Field>
          <Field label="Backstory">
            <Textarea value={draft.backstory} onChange={(v) => setField('backstory', v)} rows={5} />
          </Field>
        </Accordion>

        {/* ── Actions ── */}
        {(saving || error) && (
          <p className="text-sm" style={{ color: error ? 'var(--color-danger-fg)' : 'var(--color-fg-muted)' }}>
            {error ?? 'Saving...'}
          </p>
        )}
      </form>
      )}
    </div>
  );
}
