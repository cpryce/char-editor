import { useState, useCallback } from 'react';
import type { CharacterDraft, AbilityScore } from '../types/character';
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
} from '../utils/characterHelpers';

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
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
    />
  );
}

function NumberInput({
  value, onChange, min = 0,
}: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-sm font-semibold uppercase tracking-wider mt-6 mb-3 pb-1"
      style={{ color: 'var(--color-fg-muted)', borderBottom: '1px solid var(--color-border-muted)' }}
    >
      {children}
    </h3>
  );
}

// ── Ability Scores section ────────────────────────────────────────────────────

const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
type AbilityKey = (typeof ABILITY_KEYS)[number];
const ABILITY_LABELS: Record<AbilityKey, string> = {
  strength: 'STR', dexterity: 'DEX', constitution: 'CON',
  intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA',
};

function AbilityScoreRow({
  label, score, onBaseChange,
}: { label: string; score: AbilityScore; onBaseChange: (base: number) => void }) {
  const total = totalScore(score);
  const mod = abilityModifier(total);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;

  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-xs font-semibold" style={{ color: 'var(--color-fg-default)' }}>
        {label}
      </span>

      {/* Base — editable */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>base</span>
        <input
          type="number"
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
    </div>
  );
}

// ── Classes section ───────────────────────────────────────────────────────────

function ClassesSection({
  classes, onChange, calculatedHitPoints, isCreate = false,
}: {
  classes: CharacterDraft['classes'];
  onChange: (c: CharacterDraft['classes']) => void;
  calculatedHitPoints: number | null;
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
        <Field label="Hit Points">
          <input
            type="text"
            value={calculatedHitPoints ?? ''}
            readOnly
            style={{
              ...inputStyle,
              width: 96,
              color: 'var(--color-fg-default)',
              cursor: 'default',
            }}
          />
        </Field>
      </div>
    );
  }

  // ── Edit mode: multi-class with add / remove / level ──
  function add() {
    const name = 'Fighter';
    onChange([...classes, { name, level: 1, hitDieType: HIT_DIE_BY_CLASS[name], hpRolled: [] }]);
  }
  function remove(i: number) {
    onChange(classes.filter((_, idx) => idx !== i));
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
      {classes.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={c.name} onChange={(v) => update(i, 'name', v)} options={CLASSES} />
          <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Lv</span>
          <NumberInput value={c.level} min={1} onChange={(v) => update(i, 'level', v)} />
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>d{c.hitDieType}</span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-xs px-2 py-1 rounded"
            style={{ color: 'var(--color-danger-fg)', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Skills section ────────────────────────────────────────────────────────────

function SkillsSection({
  skills, abilityScores, onChange,
}: {
  skills: CharacterDraft['skills'];
  abilityScores: CharacterDraft['abilityScores'];
  onChange: (s: CharacterDraft['skills']) => void;
}) {
  function updateRanks(i: number, ranks: number) {
    const updated = skills.map((sk, idx) => {
      if (idx !== i) return sk;
      const updated = { ...sk, ranks };
      return { ...updated, bonus: computeSkillBonus(updated, abilityScores) };
    });
    onChange(updated);
  }

  return (
    <div
      className="rounded overflow-hidden"
      style={{ border: '1px solid var(--color-border-default)' }}
    >
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: 'var(--color-canvas-subtle)' }}>
            {['Skill', 'Key Ability', 'Trained Only', 'ACP', 'Ranks', 'Bonus'].map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2 font-medium"
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
            const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
            return (
              <tr
                key={sk.name}
                style={{
                  background: i % 2 === 0 ? 'var(--color-canvas-default)' : 'var(--color-canvas-subtle)',
                  borderBottom: '1px solid var(--color-border-muted)',
                }}
              >
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-default)' }}>{sk.name}</td>
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-muted)' }}>
                  {sk.keyAbility ? sk.keyAbility.slice(0, 3).toUpperCase() : '0'}
                </td>
                <td className="px-3 py-1 text-center" style={{ color: 'var(--color-fg-muted)' }}>
                  {sk.trainedOnly ? '✓' : ''}
                </td>
                <td className="px-3 py-1 text-center" style={{ color: 'var(--color-fg-muted)' }}>
                  {sk.armorCheckPenalty ? '✓' : ''}
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    value={sk.ranks}
                    min={0}
                    onChange={(e) => updateRanks(i, Number(e.target.value))}
                    style={{ ...inputStyle, width: 52, padding: '2px 4px', textAlign: 'center' }}
                  />
                </td>
                <td
                  className="px-3 py-1 font-semibold"
                  style={{ color: bonus >= 0 ? 'var(--color-success-fg)' : 'var(--color-danger-fg)' }}
                >
                  {bonusStr}
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

interface CharacterEditorProps {
  onSaved: () => void;
  onCancel: () => void;
}

export function CharacterEditor({ onSaved, onCancel }: CharacterEditorProps) {
  const [draft, setDraft] = useState<CharacterDraft>(newCharacterDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spentAbilityPoints = abilityPointBuyTotal(draft.abilityScores);
  const remainingAbilityPoints = ABILITY_POINT_BUY_BUDGET - spentAbilityPoints;
  const selectedClass = draft.classes[0];
  const calculatedHitPoints = selectedClass
    ? Math.max(1, selectedClass.hitDieType + abilityModifier(totalScore(draft.abilityScores.constitution)))
    : null;

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
      const skills = d.skills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      return { ...d, abilityScores: newScores, skills };
    });
  }, []);

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
      const skills = d.skills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, newScores),
      }));
      return { ...d, race, size: RACIAL_SIZES[race], abilityScores: newScores, skills };
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...draft,
        age: draft.age ? Number(draft.age) : undefined,
        languages: draft.languages ? draft.languages.split(',').map((s) => s.trim()).filter(Boolean) : [],
        hitPoints: {
          max: calculatedHitPoints ?? 1,
          current: calculatedHitPoints ?? 1,
          nonlethal: 0,
        },
        combat: {
          initiative:  { miscBonus: 0 },
          speed:       { base: 30, armorAdjust: 0 },
          armorClass:  { armor: 0, shield: 0, natural: 0, deflection: 0, misc: 0 },
          saves:       {
            fortitude: { base: 0, magic: 0, misc: 0, temp: 0 },
            reflex:    { base: 0, magic: 0, misc: 0, temp: 0 },
            will:      { base: 0, magic: 0, misc: 0, temp: 0 },
          },
          baseAttackBonus: 0,
          grappleBonus: 0,
        },
        feats: [],
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
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-fg-default)' }}>
          New Character
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm px-3 py-1 rounded"
          style={{
            border: '1px solid var(--color-border-default)',
            color: 'var(--color-fg-muted)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* ── Identity ── */}
        <SectionHeader>Identity</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Name" required>
            <TextInput value={draft.name} onChange={(v) => setField('name', v)} placeholder="Character name" />
          </Field>
          <Field label="Gender">
            <Select value={draft.gender} onChange={(v) => setField('gender', v)} options={GENDERS} />
          </Field>
          <Field label="Race">
            <Select value={draft.race} onChange={(v) => setRace(v)} options={RACES} />
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

        {/* ── Classes ── */}
        <SectionHeader>Class &amp; Level <span style={{ color: 'var(--color-danger-fg)', fontSize: '0.75rem' }}>*</span></SectionHeader>
        <ClassesSection
          classes={draft.classes}
          onChange={(c) => setField('classes', c)}
          calculatedHitPoints={calculatedHitPoints}
          isCreate
        />

        {/* ── Ability Scores ── */}
        <SectionHeader>Ability Scores</SectionHeader>
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
          {spentAbilityPoints} / {ABILITY_POINT_BUY_BUDGET} points spent · {remainingAbilityPoints} remaining
        </p>
        <div className="flex flex-col gap-2">
          {ABILITY_KEYS.map((key) => (
            <AbilityScoreRow
              key={key}
              label={ABILITY_LABELS[key]}
              score={draft.abilityScores[key]}
              onBaseChange={(base) => setAbilityBase(key, base)}
            />
          ))}
        </div>

        {/* ── Skills ── */}
        <SectionHeader>Skills</SectionHeader>
        <SkillsSection
          skills={draft.skills}
          abilityScores={draft.abilityScores}
          onChange={(s) => setField('skills', s)}
        />

        {/* ── Description / Backstory ── */}
        <SectionHeader>Background</SectionHeader>
        <Field label="Description">
          <Textarea value={draft.description} onChange={(v) => setField('description', v)} />
        </Field>
        <Field label="Backstory">
          <Textarea value={draft.backstory} onChange={(v) => setField('backstory', v)} rows={5} />
        </Field>

        {/* ── Actions ── */}
        {error && (
          <p className="text-sm" style={{ color: 'var(--color-danger-fg)' }}>{error}</p>
        )}
        <div className="flex gap-3 pt-2">
          {(() => {
            const isDisabled = saving || !draft.name.trim() || draft.classes.length === 0;
            return (
              <button
                type="submit"
                disabled={isDisabled}
                className={`btn ${isDisabled ? 'btn-default' : 'btn-primary'}`}
              >
                {saving ? 'Saving…' : 'Save Character'}
              </button>
            );
          })()}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm"
            style={{
              border: '1px solid var(--color-border-default)',
              color: 'var(--color-fg-default)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
