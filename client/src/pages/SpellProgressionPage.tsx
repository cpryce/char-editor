import { useEffect, useRef, useState } from 'react';
import type { SpellProgression } from '../types/spellProgression';
import '../pages/CustomFeatsPage.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const CHAR_LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);
const CASTER_ABILITIES = ['Intelligence', 'Wisdom', 'Charisma'] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function blankLevels(): number[][] {
  return Array.from({ length: 20 }, () => Array(10).fill(-1) as number[]);
}

function blankProgression(): Omit<SpellProgression, '_id' | 'owner' | 'updatedAt' | 'createdAt'> {
  return {
    className: '',
    casterAbility: 'Intelligence',
    isDefault: false,
    maxSpellLevel: 9,
    hasLimitedSpellsKnown: false,
    levels: blankLevels(),
  };
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <button type="button" aria-label="Cancel delete" onClick={onCancel} className="cf-delete-overlay" />
      <div role="dialog" aria-modal="true" aria-label="Confirm delete" className="cf-delete-dialog">
        <p className="text-sm font-semibold mb-2 text-[color:var(--color-fg-default)]">Delete "{name}"?</p>
        <p className="text-sm mb-5 text-[color:var(--color-fg-muted)]">This cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn">Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn bg-[var(--color-danger-fg)] text-white border-[var(--color-danger-fg)]"
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

// ── Grid Editor ───────────────────────────────────────────────────────────────

function ProgressionGrid({
  levels,
  readOnly,
  hint,
  maxSpellLevel = 9,
  onChange,
}: {
  levels: number[][];
  readOnly: boolean;
  hint?: string;
  maxSpellLevel?: number;
  onChange: (next: number[][]) => void;
}) {
  const visibleSpellLevels = SPELL_LEVELS.filter((sl) => sl <= maxSpellLevel);
  function handleCell(charLvl: number, spellLvl: number, raw: string) {
    const trimmed = raw.trim();
    let val: number;
    if (trimmed === '' || trimmed === '—' || trimmed === '-') {
      val = -1;
    } else {
      const n = parseInt(trimmed, 10);
      val = Number.isNaN(n) ? -1 : Math.max(-1, Math.min(9, n));
    }
    const next = levels.map((row, ri) =>
      ri === charLvl ? row.map((cell, ci) => (ci === spellLvl ? val : cell)) : row,
    );
    onChange(next);
  }

  return (
    <div className="overflow-x-auto mt-3">
      <table className="text-xs border-collapse min-w-max">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left text-[color:var(--color-fg-muted)] font-medium border-b border-[var(--color-border-default)]">
              Lvl
            </th>
            {visibleSpellLevels.map((sl) => (
              <th
                key={sl}
                className="w-10 px-1 py-1 text-center text-[color:var(--color-fg-muted)] font-medium border-b border-[var(--color-border-default)]"
              >
                {sl}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CHAR_LEVELS.map((cl) => {
            const rowIdx = cl - 1;
            const row = levels[rowIdx] ?? Array(10).fill(-1);
            return (
              <tr key={cl} className="even:bg-[color:var(--color-canvas-subtle)]">
                <td className="px-2 py-0.5 text-[color:var(--color-fg-muted)] font-medium">{cl}</td>
                {visibleSpellLevels.map((sl) => {
                  const val = row[sl] ?? -1;
                  const display = val === -1 ? '' : String(val);
                  return (
                    <td key={sl} className="px-0.5 py-0.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        aria-label={`Level ${cl} spell slot ${sl}`}
                        value={display}
                        readOnly={readOnly}
                        placeholder="—"
                        className={[
                          'w-9 h-6 text-center text-xs rounded border',
                          'border-[var(--color-border-default)]',
                          'bg-[color:var(--color-canvas-default)]',
                          'text-[color:var(--color-fg-default)]',
                          'focus:outline-none focus:ring-1 focus:ring-[var(--color-accent-emphasis)]',
                          readOnly ? 'opacity-60 cursor-default' : '',
                        ].join(' ')}
                        onChange={(e) => !readOnly && handleCell(rowIdx, sl, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-[color:var(--color-fg-muted)] mt-1">
        {hint ?? 'Enter base slots per day. Leave blank (—) for N/A. “0” = bonus spells only.'}
      </p>
    </div>
  );
}

// ── Editor panel ──────────────────────────────────────────────────────────────

type Draft = Omit<SpellProgression, '_id' | 'owner' | 'updatedAt' | 'createdAt'>;

function ProgressionEditor({
  initial,
  progId,
  isDefault,
  onSaved,
  onDeleted,
  onBack,
}: {
  initial: Draft;
  progId: string | null;
  isDefault: boolean;
  onSaved: (p: SpellProgression) => void;
  onDeleted?: (id: string) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [autoId, setAutoId] = useState<string | null>(progId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [initialFingerprint, setInitialFingerprint] = useState(JSON.stringify(initial));
  const saveSeq = useRef(0);

  const hasRequired = draft.className.trim().length > 0;

  useEffect(() => {
    if (!hasRequired) return;
    const fp = JSON.stringify(draft);
    if (fp === initialFingerprint) return;

    const timer = setTimeout(() => {
      const run = async () => {
        const seq = ++saveSeq.current;
        setSaving(true);
        setError(null);
        try {
          const body = {
            className: draft.className.trim(),
            casterAbility: draft.casterAbility,
            maxSpellLevel: draft.maxSpellLevel ?? 9,
            hasLimitedSpellsKnown: draft.hasLimitedSpellsKnown ?? false,
            levels: draft.levels,
            ...(draft.spellsKnown !== undefined ? { spellsKnown: draft.spellsKnown } : {}),
          };
          const id = autoId;
          const url = id ? `/api/spell-progressions/${id}` : '/api/spell-progressions';
          const method = id ? 'PUT' : 'POST';
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const data = await res.json() as { error?: string };
            throw new Error(data.error ?? 'Failed to save');
          }
          const saved = await res.json() as SpellProgression;
          if (!id) setAutoId(saved._id);
          if (seq === saveSeq.current) {
            setInitialFingerprint(JSON.stringify(draft));
            onSaved(saved);
          }
        } catch (err: unknown) {
          if (seq === saveSeq.current) {
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        } finally {
          if (seq === saveSeq.current) setSaving(false);
        }
      };
      void run();
    }, 500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, hasRequired, initialFingerprint, autoId]);

  async function handleDelete() {
    if (!autoId) return;
    const res = await fetch(`/api/spell-progressions/${autoId}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      onDeleted?.(autoId);
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? 'Failed to delete');
    }
    setConfirmDelete(false);
  }

  return (
    <div className="p-6 max-w-5xl">
      {confirmDelete && (
        <DeleteConfirmModal
          name={draft.className || 'this progression'}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <div className="flex items-center mb-6 gap-1.5">
        <button
          type="button"
          onClick={onBack}
          title="Back to spell progressions"
          aria-label="Back to spell progressions"
          className="inline-flex items-center justify-center cf-back-btn"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M20 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 7L6 12L11 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span aria-hidden="true" className="inline-flex items-center justify-center cf-header-sep">
          <svg width="8" height="18" viewBox="0 0 8 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="4" cy="2" r="1.5" fill="currentColor" />
            <circle cx="4" cy="9" r="1.5" fill="currentColor" />
            <circle cx="4" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </span>
        <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)] flex-1">
          {draft.className || (progId ? 'Edit Spell Progression' : 'New Spell Progression')}
        </h2>
        <div className="flex items-center gap-2 ml-auto">
          {isDefault && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-canvas-subtle)] text-[color:var(--color-fg-muted)] border border-[var(--color-border-default)]">
              SRD default
            </span>
          )}
          {saving && <span className="text-xs text-[color:var(--color-fg-muted)]">Saving…</span>}
          {!saving && error && <span className="text-xs text-[color:var(--color-danger-fg)]">{error}</span>}
          {!saving && !error && autoId && <span className="text-xs text-[color:var(--color-fg-muted)]">Saved</span>}
          {autoId && !isDefault && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="btn btn-danger"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {isDefault && (
          <p className="text-xs text-[color:var(--color-fg-muted)] italic">
            SRD default — editable but cannot be deleted.
          </p>
        )}

        <div>
          <label className="cf-field-label" htmlFor="sp-className">Class Name</label>
          <input
            id="sp-className"
            type="text"
            className="cf-input"
            value={draft.className}
            readOnly={isDefault}
            onChange={(e) => setDraft((d) => ({ ...d, className: e.target.value }))}
          />
        </div>

        <div>
          <label className="cf-field-label" htmlFor="sp-ability">Casting Ability</label>
          <select
            id="sp-ability"
            className="cf-input"
            value={draft.casterAbility}
            onChange={(e) => setDraft((d) => ({ ...d, casterAbility: e.target.value as Draft['casterAbility'] }))}
          >
            {CASTER_ABILITIES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-5 items-end">
          <div>
            <label className="cf-field-label" htmlFor="sp-maxSpellLevel">Max Spell Level</label>
            <select
              id="sp-maxSpellLevel"
              className="cf-input"
              value={draft.maxSpellLevel ?? 9}
              onChange={(e) => setDraft((d) => ({ ...d, maxSpellLevel: parseInt(e.target.value, 10) }))}
            >
              {SPELL_LEVELS.map((sl) => (
                <option key={sl} value={sl}>{sl}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pb-1">
            <input
              type="checkbox"
              className="w-4 h-4 accent-[var(--color-accent-emphasis)]"
              checked={draft.hasLimitedSpellsKnown ?? false}
              onChange={(e) => setDraft((d) => ({ ...d, hasLimitedSpellsKnown: e.target.checked }))}
            />
            <span className="text-sm text-[color:var(--color-fg-default)]">Limited Spells Known</span>
          </label>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-start gap-6">
          <div className="min-w-0">
            <span className="cf-field-label">Spells per Day</span>
            <ProgressionGrid
              levels={draft.levels}
              readOnly={false}
              maxSpellLevel={draft.maxSpellLevel ?? 9}
              onChange={(levels) => setDraft((d) => ({ ...d, levels }))}
            />
          </div>

          {draft.hasLimitedSpellsKnown && (
            <div className="min-w-0">
              <span className="cf-field-label">Spells Known</span>
              <ProgressionGrid
                levels={draft.spellsKnown ?? blankLevels()}
                readOnly={false}
                maxSpellLevel={draft.maxSpellLevel ?? 9}
                hint="Enter total spells known per spell level. Leave blank (—) if not applicable."
                onChange={(spellsKnown) => setDraft((d) => ({ ...d, spellsKnown }))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── List panel ────────────────────────────────────────────────────────────────

function ProgressionList({
  progressions,
  onSelect,
  onNew,
}: {
  progressions: SpellProgression[];
  onSelect: (p: SpellProgression) => void;
  onNew: () => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
          Spell Progressions
        </h2>
        <button type="button" onClick={onNew} className="btn btn-primary">
          + Spell Progression
        </button>
      </div>

      <div className="rounded overflow-hidden border border-[var(--color-border-default)]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[var(--color-canvas-subtle)]">
              <th className="text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                Class
              </th>
              <th className="text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                Casting Ability
              </th>
              <th className="hidden sm:table-cell text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                Source
              </th>
              <th className="hidden sm:table-cell text-left px-4 py-2 border-b border-[var(--color-border-default)]" />
            </tr>
          </thead>
          <tbody>
            {progressions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-[color:var(--color-fg-muted)]">
                  No progressions yet.{' '}
                  <button
                    type="button"
                    onClick={onNew}
                    className="bg-transparent border-0 p-0 cursor-pointer underline [font:inherit] text-[color:var(--color-accent-fg)]"
                  >
                    Create one
                  </button>{' '}
                  to get started.
                </td>
              </tr>
            ) : (
              progressions.map((p, i) => (
                <tr
                  key={p._id}
                  className={`cursor-pointer border-b border-[var(--color-border-muted)] hover:bg-[var(--color-accent-subtle)] ${i % 2 === 0 ? 'bg-[var(--color-canvas-default)]' : 'bg-[var(--color-canvas-subtle)]'}`}
                  onClick={() => onSelect(p)}
                >
                  <td className="px-4 py-2 font-medium text-[color:var(--color-fg-default)]">{p.className}</td>
                  <td className="px-4 py-2 text-[color:var(--color-fg-muted)]">{p.casterAbility}</td>
                  <td className="hidden sm:table-cell px-4 py-2 text-[color:var(--color-fg-muted)]">
                    {p.isDefault ? 'SRD default' : 'Custom'}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onSelect(p); }}
                      title="Edit progression"
                      aria-label={`Edit ${p.className}`}
                      className="text-xs px-2 py-1 rounded cf-row-edit-btn"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SpellProgressionPage() {
  const [progressions, setProgressions] = useState<SpellProgression[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SpellProgression | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const res = await fetch('/api/spell-progressions', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as SpellProgression[];
        setProgressions(data);
      }
      setLoading(false);
    };
    void run();
  }, []);

  function handleSaved(saved: SpellProgression) {
    setProgressions((prev) => {
      const idx = prev.findIndex((p) => p._id === saved._id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved].sort((a, b) => a.className.localeCompare(b.className));
    });
  }

  function handleDeleted(id: string) {
    setProgressions((prev) => prev.filter((p) => p._id !== id));
    setSelected(null);
    setCreating(false);
  }

  if (loading) {
    return (
      <div className="py-8 text-sm text-[color:var(--color-fg-muted)]">Loading…</div>
    );
  }

  if (creating) {
    const blank = blankProgression();
    return (
      <ProgressionEditor
        initial={blank}
        progId={null}
        isDefault={false}
        onSaved={(saved) => { handleSaved(saved); setCreating(false); setSelected(saved); }}
        onDeleted={handleDeleted}
        onBack={() => setCreating(false)}
      />
    );
  }

  if (selected) {
    const draft: Draft = {
      className: selected.className,
      casterAbility: selected.casterAbility,
      isDefault: selected.isDefault,
      maxSpellLevel: selected.maxSpellLevel,
      hasLimitedSpellsKnown: selected.hasLimitedSpellsKnown,
      levels: selected.levels,
      spellsKnown: selected.spellsKnown,
    };
    return (
      <ProgressionEditor
        initial={draft}
        progId={selected._id}
        isDefault={selected.isDefault}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <ProgressionList
      progressions={progressions}
      onSelect={setSelected}
      onNew={() => setCreating(true)}
    />
  );
}
