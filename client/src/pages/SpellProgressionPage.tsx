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
  onChange,
}: {
  levels: number[][];
  readOnly: boolean;
  onChange: (next: number[][]) => void;
}) {
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
            {SPELL_LEVELS.map((sl) => (
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
                {SPELL_LEVELS.map((sl) => {
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
        Enter base slots per day. Leave blank (—) for N/A. "0" = bonus spells only.
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
            levels: draft.levels,
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
    <div className="cf-form-root">
      {confirmDelete && (
        <DeleteConfirmModal
          name={draft.className || 'this progression'}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <div className="cf-form-topbar">
        <button type="button" onClick={onBack} className="btn cf-back-btn">← Back</button>
        <div className="cf-form-status">
          {saving && <span className="cf-saving-indicator">Saving…</span>}
          {!saving && error && <span className="cf-error-indicator">{error}</span>}
          {!saving && !error && autoId && <span className="cf-saved-indicator">Saved</span>}
        </div>
        {autoId && !isDefault && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn btn-danger cf-delete-btn"
          >
            Delete
          </button>
        )}
      </div>

      <div className="cf-form-body">
        {isDefault && (
          <p className="text-xs text-[color:var(--color-fg-muted)] mb-3 italic">
            SRD default — editable but cannot be deleted.
          </p>
        )}

        <div className="cf-field-row">
          <label className="cf-label" htmlFor="sp-className">Class name</label>
          <input
            id="sp-className"
            type="text"
            className="cf-input"
            value={draft.className}
            readOnly={isDefault}
            onChange={(e) => setDraft((d) => ({ ...d, className: e.target.value }))}
          />
        </div>

        <div className="cf-field-row">
          <label className="cf-label" htmlFor="sp-ability">Casting ability</label>
          <select
            id="sp-ability"
            className="cf-select"
            value={draft.casterAbility}
            onChange={(e) => setDraft((d) => ({ ...d, casterAbility: e.target.value as Draft['casterAbility'] }))}
          >
            {CASTER_ABILITIES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <h3 className="text-sm font-semibold mt-4 mb-1 text-[color:var(--color-fg-default)]">
          Spells per Day Table
        </h3>
        <ProgressionGrid
          levels={draft.levels}
          readOnly={false}
          onChange={(levels) => setDraft((d) => ({ ...d, levels }))}
        />
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
    <div className="cf-list-root">
      <div className="cf-list-topbar">
        <h2 className="cf-list-title">Spell Progressions</h2>
        <button type="button" onClick={onNew} className="btn btn-primary">New</button>
      </div>
      {progressions.length === 0 ? (
        <p className="cf-empty-state">No progressions yet. Click "New" to create one.</p>
      ) : (
        <ul className="cf-list">
          {progressions.map((p) => (
            <li key={p._id}>
              <button type="button" className="cf-list-item" onClick={() => onSelect(p)}>
                <span className="cf-list-item-name">{p.className}</span>
                <span className="cf-list-item-meta">
                  {p.casterAbility}
                  {p.isDefault ? ' · SRD default' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
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
      levels: selected.levels,
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
