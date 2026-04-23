import { useState, useCallback, useEffect, useRef } from 'react';
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
  applyClassAndRacialSkillRules,
  totalCharacterLevel,
  maxClassSkillRanks,
  maxCrossClassSkillRanks,
  spentSkillPoints,
  totalSkillPointsAvailable,
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
    <div
      className="flex items-center gap-3 py-1"
      style={{ borderBottom: '1px solid var(--color-border-muted)' }}
    >
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
          <NumberInput value={c.level} min={1} onChange={(v) => update(i, 'level', v)} />
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
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: 'var(--color-canvas-subtle)' }}>
            {['', 'Skill', 'Key Ability', 'Class', 'Score', 'Bonus', 'Ranks', 'Misc Bonus'].map((h) => (
              <th
                key={h}
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
  const [initialDraftFingerprint, setInitialDraftFingerprint] = useState<string | null>(null);
  const saveSequenceRef = useRef(0);
  const isEdit = Boolean(characterId);
  const spentAbilityPoints = abilityPointBuyTotal(draft.abilityScores);
  const remainingAbilityPoints = ABILITY_POINT_BUY_BUDGET - spentAbilityPoints;
  const intelligenceMod = abilityModifier(totalScore(draft.abilityScores.intelligence));
  const totalLevel = totalCharacterLevel(draft.classes);
  const availableSkillPoints = totalSkillPointsAvailable(draft.classes, intelligenceMod, draft.race);
  const spentPoints = spentSkillPoints(draft.skills);
  const selectedClass = draft.classes[0];
  const calculatedCreateHitPoints = selectedClass
    ? Math.max(1, selectedClass.hitDieType + abilityModifier(totalScore(draft.abilityScores.constitution)))
    : 0;
  const hasUnselectedClass = draft.classes.some((c) => !c.name.trim());
  const hasRequiredFields = draft.name.trim().length > 0
    && draft.classes.length > 0
    && Boolean(draft.classes[0]?.name?.trim())
    && !hasUnselectedClass;
  const headerTitle = isEdit
    ? (draft.name.trim() || 'Edit Character')
    : (draft.name.trim() && draft.classes[0]?.name?.trim() ? draft.name.trim() : 'Create Character');

  useEffect(() => {
    if (!characterId) {
      setLoadingCharacter(false);
      const blank = newCharacterDraft();
      setDraft(blank);
      setAutoSaveCharacterId(null);
      setInitialDraftFingerprint(JSON.stringify(blank));
      return;
    }

    let cancelled = false;
    setLoadingCharacter(true);
    setError(null);

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
          abilityScores: (data.abilityScores as CharacterDraft['abilityScores']) ?? base.abilityScores,
          hitPoints: (data.hitPoints as CharacterDraft['hitPoints']) ?? base.hitPoints,
          skills: mergedSkills,
        };

        const adjustedSkills = applyClassAndRacialSkillRules(loaded.skills, loaded.classes, loaded.race).map((skill) => ({
          ...skill,
          bonus: computeSkillBonus(skill, loaded.abilityScores),
        }));

        const loadedDraft = { ...loaded, skills: adjustedSkills };
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
      return { ...d, race, size: RACIAL_SIZES[race], abilityScores: newScores, skills };
    });
  }, []);

  const setClasses = useCallback((classes: CharacterDraft['classes']) => {
    setDraft((d) => {
      const adjustedSkills = applyClassAndRacialSkillRules(d.skills, classes, d.race);
      const skills = adjustedSkills.map((sk) => ({
        ...sk,
        bonus: computeSkillBonus(sk, d.abilityScores),
      }));
      return { ...d, classes, skills };
    });
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
        <SectionHeader>Identity</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Name" required>
            <TextInput value={draft.name} onChange={(v) => setField('name', v)} placeholder="Character name" />
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

        {/* ── Classes ── */}
        <SectionHeader>Class &amp; Level <span style={{ color: 'var(--color-danger-fg)', fontSize: '0.75rem' }}>*</span></SectionHeader>
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
          totalSkillPoints={availableSkillPoints}
          spentPoints={spentPoints}
          totalLevel={totalLevel}
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
