import type { CharacterDraft, Spellcasting, AbilityScore } from '../../types/character';
import { abilityModifier, totalScore } from '../../utils/characterHelpers';
import type { CustomClass } from '../../types/customClass';
import type { SpellProgression } from '../../types/spellProgression';
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { CLASSES, HIT_DIE_BY_CLASS } from '../../types/character';
import { totalCharacterLevel } from '../../utils/characterHelpers';
import { formatSpellsPerDay } from './spellSlots';

function NumberInput({
  value, onChange, min = 0, placeholder, 'aria-label': ariaLabel,
}: { value: number; onChange: (v: number) => void; min?: number; placeholder?: string; 'aria-label'?: string }) {
  return (
    <input
      type="number"
      value={value || ''}
      min={min}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        background: 'var(--color-canvas-default)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 6,
        color: 'var(--color-fg-default)',
        padding: '4px 8px',
        fontSize: 14,
        width: 72,
      }}
    />
  );
}

function LockedBaseClassDisplay({
  label,
  inputStyle,
  width,
}: {
  label: string;
  inputStyle: React.CSSProperties;
  width: string;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <div
        aria-label="Base class"
        onMouseEnter={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setPos(null)}
        className="inline-flex items-center gap-2"
        style={{
          ...inputStyle,
          width,
          color: 'var(--color-fg-muted)',
          background: 'var(--color-canvas-subtle)',
          cursor: 'help',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {label}
      </div>
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
            lineHeight: 1.5,
            color: 'var(--color-fg-default)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          Base class is not editable
        </div>,
        document.body,
      )}
    </>
  );
}

function ClassesSection({
  classes, onChange, isCreate = false, inputStyle, customClasses = [],
}: {
  classes: CharacterDraft['classes'];
  onChange: (c: CharacterDraft['classes']) => void;
  isCreate?: boolean;
  inputStyle: React.CSSProperties;
  customClasses?: CustomClass[];
}) {
  const allClassNames: readonly string[] = [...CLASSES, ...customClasses.map((c) => c.name).filter((n) => !CLASSES.includes(n as typeof CLASSES[number]))].sort();
  const hitDieFor = (name: string): number => HIT_DIE_BY_CLASS[name] ?? customClasses.find((c) => c.name === name)?.hitDice ?? 8;
  const classSelectWidth = `${Math.max('— Select class —'.length, ...allClassNames.map((n) => n.length)) + 2}ch`;

  if (isCreate) {
    const selectedName = classes[0]?.name ?? '';
    function handleClassChange(name: string) {
      if (!name) { onChange([]); return; }
      onChange([{ name, level: 1, hitDieType: hitDieFor(name), hpRolled: [] }]);
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
            {allClassNames.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {selectedName && (
            <span className="text-sm" style={{ color: 'var(--color-fg-default)' }}>
              Level 1 &nbsp;·&nbsp; d{hitDieFor(selectedName)} hit die
            </span>
          )}
        </div>
      </div>
    );
  }

  function add() {
    onChange([...classes, { name: '', level: 1, hitDieType: 8, hpRolled: [] }]);
  }

  function remove(i: number) {
    onChange(classes.filter((_, idx) => idx !== i));
  }

  function update(i: number, field: 'name' | 'level', value: string | number) {
    const updated = classes.map((c, idx) => {
      if (idx !== i) return c;
      if (field === 'name') {
        const name = value as string;
        return { ...c, name, hitDieType: hitDieFor(name) };
      }
      return { ...c, level: value as number };
    });
    onChange(updated);
  }

  const usedClassNames = new Set(classes.map((c) => c.name).filter(Boolean));
  const canAddAnotherClass = usedClassNames.size < allClassNames.length;

  return (
    <div className="flex flex-col gap-2">
      {classes.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          {i === 0 ? (
            <LockedBaseClassDisplay
              label={c.name || 'Base class'}
              inputStyle={inputStyle}
              width={classSelectWidth}
            />
          ) : (
            <select
              aria-label={`Multiclass ${i + 1}`}
              value={c.name}
              onChange={(e) => update(i, 'name', e.target.value)}
              style={{ ...inputStyle, width: classSelectWidth }}
              required
            >
              <option value="">— Select class —</option>
              {allClassNames.filter((className) => {
                const usedByAnotherRow = classes.some((existing, idx) => idx !== i && existing.name === className);
                return !usedByAnotherRow;
              }).map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          )}
          <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Lv</span>
          <NumberInput value={c.level} min={1} aria-label={`${c.name || 'Class'} level`} onChange={(v) => update(i, 'level', v)} />
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>{c.name ? `d${c.hitDieType}` : ''}</span>
          {i > 0 && (
            <button
              type="button"
              aria-label={`Remove class row ${i + 1}`}
              title="Remove class"
              onClick={() => remove(i)}
              style={{
                border: 'none',
                background: 'transparent',
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
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={!canAddAnotherClass}
        className="text-xs px-3 py-1 rounded self-start"
        style={{
          border: '1px solid var(--color-border-default)',
          color: canAddAnotherClass ? 'var(--color-fg-default)' : 'var(--color-fg-muted)',
          cursor: canAddAnotherClass ? 'pointer' : 'not-allowed',
          opacity: canAddAnotherClass ? 1 : 0.7,
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

export function ClassLevelSection({
  classes,
  isEdit,
  hitPoints,
  calculatedCreateHitPoints,
  inputStyle,
  onClassesChange,
  onHitPointsChange,
  customClasses = [],
  spellcasting,
  onSpellcastingChange,
  abilityScores,
  spellProgressions = [],
}: {
  classes: CharacterDraft['classes'];
  isEdit: boolean;
  hitPoints: CharacterDraft['hitPoints'];
  calculatedCreateHitPoints: number;
  inputStyle: React.CSSProperties;
  onClassesChange: (classes: CharacterDraft['classes']) => void;
  onHitPointsChange: (next: CharacterDraft['hitPoints']) => void;
  customClasses?: CustomClass[];
  spellcasting: Spellcasting;
  onSpellcastingChange: (next: Spellcasting) => void;
  abilityScores: CharacterDraft['abilityScores'];
  spellProgressions?: SpellProgression[];
}) {
  function updateSpellcasting<K extends keyof Spellcasting>(key: K, value: Spellcasting[K]) {
    onSpellcastingChange({ ...spellcasting, [key]: value });
  }

  /** Ability modifier for spellcasting: use temp score override if set, otherwise fall back to total score. */
  function spellAbilityMod(): number {
    if (!spellcasting.casterAbility) return 0;
    const score: AbilityScore | undefined =
      abilityScores[spellcasting.casterAbility as keyof typeof abilityScores];
    if (!score) return 0;
    return abilityModifier(score.temp ?? totalScore(score));
  }

  /** Bonus spells per day at spell level L (3.5e formula). Level 0 gets no bonus spells. */
  function bonusSpells(spellLevel: number): number | null {
    if (spellLevel === 0) return null;
    const mod = spellAbilityMod();
    if (mod < spellLevel) return 0;
    return Math.floor((mod - spellLevel) / 4) + 1;
  }

  const abilityMod = spellAbilityMod();
  const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

  // ── Spell Progression lookup ──────────────────────────────────────────────
  // Among classes that have a matching spell progression, use the one with the
  // highest level. This handles multiclass characters correctly: e.g. a Fighter
  // 10 / Wizard 5 will use the Wizard progression at level 5, not Fighter.
  const { activeProgression, primaryClassLevel } = classes.reduce<{
    activeProgression: SpellProgression | null;
    primaryClassLevel: number;
  }>(
    (best, c) => {
      if (!c.name) return best;
      const lvl = c.level ?? 0;
      if (lvl <= best.primaryClassLevel) return best;
      const prog = spellProgressions.find(
        (p) => p.className.toLowerCase() === c.name.toLowerCase(),
      ) ?? null;
      if (!prog) return best;
      return { activeProgression: prog, primaryClassLevel: lvl };
    },
    { activeProgression: null, primaryClassLevel: 0 },
  );

  // CL defaults to highest spellcasting class level; EL also defaults the same.
  // CL drives the spells-per-day table; EL drives spell resistance checks.
  const resolvedCL = spellcasting.casterLevel > 0 ? spellcasting.casterLevel : primaryClassLevel;
  const resolvedEL = spellcasting.effectiveCasterLevel > 0 ? spellcasting.effectiveCasterLevel : primaryClassLevel;
  const progressionRow: number[] | null = activeProgression && resolvedCL > 0
    ? (activeProgression.levels[Math.min(resolvedCL, 20) - 1] ?? null)
    : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {/* ── Column 1: Class & Hit Points ── */}
      <div className="flex flex-col gap-4">
        <ClassesSection
          classes={classes}
          onChange={onClassesChange}
          isCreate={!isEdit}
          inputStyle={inputStyle}
          customClasses={customClasses}
        />
        {isEdit ? (
          <div className="grid grid-cols-3 gap-4 max-w-xl">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Hit Points</span>
              <input
                type="text"
                inputMode="numeric"
                value={String(hitPoints.max)}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D+/g, '');
                  const max = digitsOnly === '' ? 0 : Number(digitsOnly);
                  onHitPointsChange({
                    ...hitPoints,
                    max,
                    current: max,
                  });
                }}
                style={{ ...inputStyle, width: 96 }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Nonlethal</span>
              <NumberInput
                value={hitPoints.nonlethal}
                min={0}
                onChange={(v) => onHitPointsChange({ ...hitPoints, nonlethal: Math.max(0, Math.trunc(v)) })}
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 max-w-xl">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Hit Points</span>
              <input
                type="text"
                value={calculatedCreateHitPoints}
                readOnly
                style={{ ...inputStyle, width: 96, color: 'var(--color-fg-muted)', cursor: 'default' }}
              />
            </label>
          </div>
        )}
      </div>

      {/* ── Column 2: Spellcasting ── */}
      <div className="flex flex-col gap-4">
        <p className="subsection-header">Spellcasting</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Caster Ability</span>
            <select
              aria-label="Caster Ability"
              value={spellcasting.casterAbility}
              onChange={(e) => updateSpellcasting('casterAbility', e.target.value)}
              style={{ ...inputStyle, minWidth: 140 }}
            >
              <option value="">— None —</option>
              <option value="intelligence">Intelligence</option>
              <option value="wisdom">Wisdom</option>
              <option value="charisma">Charisma</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>CL</span>
            <NumberInput
              value={spellcasting.casterLevel}
              min={0}
              aria-label="Caster Level"
              placeholder={primaryClassLevel > 0 ? String(primaryClassLevel) : undefined}
              onChange={(v) => updateSpellcasting('casterLevel', v)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>EL</span>
            <NumberInput
              value={spellcasting.effectiveCasterLevel}
              min={0}
              aria-label="Effective Caster Level"
              placeholder={primaryClassLevel > 0 ? String(primaryClassLevel) : undefined}
              onChange={(v) => updateSpellcasting('effectiveCasterLevel', v)}
            />
          </label>
        </div>
        <div className="flex gap-6">
          {/* ── Checkboxes ── */}
          <div className="flex flex-col gap-1">
            {/* Spell Focus group */}
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--color-fg-default)', cursor: 'pointer' }}
            >
              <input
                type="checkbox"
                checked={spellcasting.spellFocus}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onSpellcastingChange({
                    ...spellcasting,
                    spellFocus: checked,
                    greaterSpellFocus: checked ? spellcasting.greaterSpellFocus : false,
                  });
                }}
              />
              Spell Focus
            </label>
            <label
              className="flex items-center gap-2 text-sm"
              style={{
                color: spellcasting.spellFocus ? 'var(--color-fg-default)' : 'var(--color-fg-subtle)',
                cursor: spellcasting.spellFocus ? 'pointer' : 'not-allowed',
                paddingLeft: 16,
              }}
            >
              <input
                type="checkbox"
                checked={spellcasting.greaterSpellFocus}
                disabled={!spellcasting.spellFocus}
                onChange={(e) => updateSpellcasting('greaterSpellFocus', e.target.checked)}
              />
              Greater Spell Focus
            </label>

            {/* Spell Penetration group */}
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--color-fg-default)', cursor: 'pointer', marginTop: 4 }}
            >
              <input
                type="checkbox"
                checked={spellcasting.spellPenetration}
                onChange={(e) => {
                  const checked = e.target.checked;
                  onSpellcastingChange({
                    ...spellcasting,
                    spellPenetration: checked,
                    greaterSpellPenetration: checked ? spellcasting.greaterSpellPenetration : false,
                  });
                }}
              />
              Spell Penetration
            </label>
            <label
              className="flex items-center gap-2 text-sm"
              style={{
                color: spellcasting.spellPenetration ? 'var(--color-fg-default)' : 'var(--color-fg-subtle)',
                cursor: spellcasting.spellPenetration ? 'pointer' : 'not-allowed',
                paddingLeft: 16,
              }}
            >
              <input
                type="checkbox"
                checked={spellcasting.greaterSpellPenetration}
                disabled={!spellcasting.spellPenetration}
                onChange={(e) => updateSpellcasting('greaterSpellPenetration', e.target.checked)}
              />
              Greater Spell Penetration
            </label>

            {/* Domain Spells */}
            <label
              className="flex items-center gap-2 text-sm"
              style={{ color: 'var(--color-fg-default)', cursor: 'pointer', marginTop: 4 }}
            >
              <input
                type="checkbox"
                checked={spellcasting.domainSlots}
                onChange={(e) => updateSpellcasting('domainSlots', e.target.checked)}
              />
              Domain Spells (+1/level)
            </label>
          </div>

          {/* ── Effects Summary ── */}
          <div
            className="flex flex-col gap-2 text-xs"
            style={{
              color: 'var(--color-fg-muted)',
              borderLeft: '2px solid var(--color-border-default)',
              paddingLeft: 12,
              alignSelf: 'flex-start',
            }}
          >
              {spellcasting.spellFocus && (
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--color-fg-default)' }}>Spell Focus</span>
                  <br />
                  +1 DC on spells of chosen school
                  {spellcasting.greaterSpellFocus && (
                    <><br /><span style={{ fontWeight: 600, color: 'var(--color-fg-default)' }}>Greater:</span> +1 DC (total +2)</>
                  )}
                </div>
              )}
              <div>
                <span style={{ fontWeight: 600, color: 'var(--color-fg-default)' }}>Spell Resistance</span>
                <br />
                Caster level check to overcome SR:
                <br />
                d20 + {resolvedEL + (spellcasting.spellPenetration ? 2 : 0) + (spellcasting.greaterSpellPenetration ? 2 : 0)} vs SR
              </div>
            </div>
        </div>

        {/* ── Spell Table ── */}
        {spellcasting.casterAbility && (
          <div>
            <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Lvl', 'Spell DC', 'Spells/Day', 'Bonus Spells'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '4px 10px',
                        textAlign: 'center',
                        borderBottom: '1px solid var(--color-border-default)',
                        color: 'var(--color-fg-muted)',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SPELL_LEVELS.map((lvl) => {
                  const dc = 10 + lvl + abilityMod;
                  const bonus = bonusSpells(lvl);
                  return (
                    <tr key={lvl}>
                      <td style={{ padding: '3px 10px', textAlign: 'center', color: 'var(--color-fg-default)' }}>{lvl}</td>
                      <td style={{ padding: '3px 10px', textAlign: 'center', color: 'var(--color-fg-default)' }}>{dc}</td>
                      <td style={{ padding: '3px 10px', textAlign: 'center', color: 'var(--color-fg-muted)' }}>
                        {progressionRow
                          ? progressionRow[lvl] === -1
                            ? '—'
                            : formatSpellsPerDay(progressionRow[lvl], lvl, spellcasting.domainSlots)
                          : '—'}
                      </td>
                      <td style={{ padding: '3px 10px', textAlign: 'center', color: 'var(--color-fg-default)' }}>
                        {bonus === null ? '—' : bonus}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}