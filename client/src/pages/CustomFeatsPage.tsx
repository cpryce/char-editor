import { useEffect, useRef, useState } from 'react';
import type { CustomFeat, FeatModifier, FeatModifierTarget, WeaponScope } from '../types/customFeat';
import type { FeatCategory } from '../components/FeatAutocomplete';
import { CLASSES } from '../types/character';
import { ALL_FEATS } from '../data/feats';
import './CustomFeatsPage.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const FEAT_CATEGORIES: FeatCategory[] = [
  'General',
  'Fighter Bonus Feat',
  'Item Creation',
  'Metamagic',
  'Special',
];

const MODIFIER_TARGET_LABELS: Record<FeatModifierTarget, string> = {
  'weapon-attack': 'Weapon Attack',
  'weapon-damage': 'Weapon Damage',
  'ac': 'Armor Class',
  'save-fort': 'Save: Fortitude',
  'save-ref': 'Save: Reflex',
  'save-will': 'Save: Will',
};

const MODIFIER_TARGETS: FeatModifierTarget[] = [
  'weapon-attack', 'weapon-damage', 'ac', 'save-fort', 'save-ref', 'save-will',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' });
  if (elapsedSeconds < 60) return '1 minute ago';
  if (elapsedSeconds < 60 * 60) return rtf.format(-Math.floor(elapsedSeconds / 60), 'minute');
  if (elapsedSeconds < 60 * 60 * 24) return rtf.format(-Math.floor(elapsedSeconds / (60 * 60)), 'hour');
  if (elapsedSeconds < 60 * 60 * 24 * 7) return rtf.format(-Math.floor(elapsedSeconds / (60 * 60 * 24)), 'day');
  if (elapsedSeconds < 60 * 60 * 24 * 30) return rtf.format(-Math.floor(elapsedSeconds / (60 * 60 * 24 * 7)), 'week');
  if (elapsedSeconds < 60 * 60 * 24 * 365) return rtf.format(-Math.floor(elapsedSeconds / (60 * 60 * 24 * 30)), 'month');
  return rtf.format(-Math.floor(elapsedSeconds / (60 * 60 * 24 * 365)), 'year');
}

// ── Blank draft ───────────────────────────────────────────────────────────────

function blankDraft(): FeatDraft {
  return {
    name: '',
    shortDescription: '',
    fullDescription: '',
    featTypes: ['General'],
    prerequisites: '',
    prerequisiteFeats: [],
    modifiers: [],
    repeatable: false,
    classRestrictions: [],
  };
}

interface FeatDraft {
  name: string;
  shortDescription: string;
  fullDescription: string;
  featTypes: FeatCategory[];
  prerequisites: string;
  prerequisiteFeats: string[];
  modifiers: FeatModifier[];
  repeatable: boolean;
  classRestrictions: string[];
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteConfirmModal({
  featName,
  onConfirm,
  onCancel,
}: {
  featName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Cancel delete"
        onClick={onCancel}
        className="cf-delete-overlay"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm delete"
        className="cf-delete-dialog"
      >
        <p className="text-sm font-semibold mb-2 text-[color:var(--color-fg-default)]">
          Delete "{featName}"?
        </p>
        <p className="text-sm mb-5 text-[color:var(--color-fg-muted)]">
          This cannot be undone. Characters using this feat by name will retain the name but lose the
          description.
        </p>
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

// ── PrerequisiteFeatsField ────────────────────────────────────────────────────

const ALL_FEAT_NAMES = Array.from(
  new Set(ALL_FEATS.map((f) => f.name)),
).sort((a, b) => a.localeCompare(b));

function PrerequisiteFeatsField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateSuggestions(text: string) {
    const q = text.trim().toLowerCase();
    if (!q) { setSuggestions([]); return; }
    setSuggestions(
      ALL_FEAT_NAMES.filter((n) => n.toLowerCase().includes(q) && !value.includes(n)).slice(0, 8),
    );
  }

  function addFeat(name: string) {
    const trimmed = name.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInputValue('');
    setSuggestions([]);
  }

  function removeFeat(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addFeat(inputValue); }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeFeat(value[value.length - 1]);
    }
  }

  return (
    <div>
      <span className="cf-field-label">Prerequisite Feats</span>
      <p className="text-xs mb-2 text-[color:var(--color-fg-muted)]">
        Feats that must be selected before this feat can be chosen. Type a name and press Enter.
      </p>
      <div className="cf-prereq-tag-field" onClick={() => inputRef.current?.focus()}>
        {value.map((name) => (
          <span key={name} className="cf-prereq-tag">
            {name}
            <button type="button" onClick={() => removeFeat(name)} aria-label={`Remove ${name}`} className="cf-prereq-tag-remove">×</button>
          </span>
        ))}
        <div className="relative flex-1 min-w-[140px]">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); updateSuggestions(e.target.value); }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            placeholder={value.length === 0 ? 'e.g. Weapon Focus' : ''}
            className="cf-prereq-input"
          />
          {suggestions.length > 0 && (
            <ul className="cf-prereq-suggestions">
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" onMouseDown={() => addFeat(s)} className="cf-prereq-suggestion-item">{s}</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ModifiersField ────────────────────────────────────────────────────────────

function ModifiersField({
  value,
  onChange,
}: {
  value: FeatModifier[];
  onChange: (v: FeatModifier[]) => void;
}) {
  function addModifier() {
    onChange([...value, { target: 'weapon-attack', value: 1, weaponScope: 'melee' }]);
  }

  function removeModifier(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function updateModifier(i: number, patch: Partial<FeatModifier>) {
    onChange(value.map((m, idx) => {
      if (idx !== i) return m;
      const updated = { ...m, ...patch };
      // Clear weaponScope when switching to a non-weapon target
      if (patch.target && patch.target !== 'weapon-attack' && patch.target !== 'weapon-damage') {
        delete updated.weaponScope;
      }
      // Default weaponScope when switching to a weapon target
      if (patch.target && (patch.target === 'weapon-attack' || patch.target === 'weapon-damage') && !updated.weaponScope) {
        updated.weaponScope = 'melee';
      }
      return updated;
    }));
  }

  const needsScope = (target: FeatModifierTarget) =>
    target === 'weapon-attack' || target === 'weapon-damage';

  return (
    <div>
      <span className="cf-field-label">Stat Modifiers</span>
      <p className="text-xs mb-2 text-[color:var(--color-fg-muted)]">
        Numeric bonuses applied to character stats whenever this feat is selected.
      </p>
      {value.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {value.map((mod, i) => (
            <div key={i} className="cf-modifier-row">
              <select
                value={mod.target}
                onChange={(e) => updateModifier(i, { target: e.target.value as FeatModifierTarget })}
                className="cf-modifier-select"
              >
                {MODIFIER_TARGETS.map((t) => (
                  <option key={t} value={t}>{MODIFIER_TARGET_LABELS[t]}</option>
                ))}
              </select>
              {needsScope(mod.target) && (
                <select
                  value={mod.weaponScope ?? 'melee'}
                  onChange={(e) => updateModifier(i, { weaponScope: e.target.value as WeaponScope })}
                  className="cf-modifier-scope"
                >
                  <option value="melee">Melee</option>
                  <option value="ranged">Ranged</option>
                </select>
              )}
              <input
                type="number"
                value={mod.value}
                onChange={(e) => updateModifier(i, { value: parseInt(e.target.value) || 0 })}
                className="cf-modifier-value"
                min={-100}
                max={100}
              />
              <button type="button" onClick={() => removeModifier(i)} className="cf-modifier-remove" aria-label="Remove modifier">×</button>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={addModifier} className="cf-modifier-add-btn">
        + Add Modifier
      </button>
    </div>
  );
}

// ── Editor Form ───────────────────────────────────────────────────────────────

function FeatEditorForm({
  initial,
  featId,
  onSaved,
  onDeleted,
  onBack,
  readOnly = false,
}: {
  initial: FeatDraft;
  featId: string | null; // null = new feat
  onSaved: (feat: CustomFeat) => void;
  onDeleted?: (id: string) => void;
  onBack: () => void;
  readOnly?: boolean;
}) {
  const [draft, setDraft] = useState<FeatDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function set<K extends keyof FeatDraft>(key: K, value: FeatDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleFeatType(cat: FeatCategory) {
    setDraft((d) => {
      const has = d.featTypes.includes(cat);
      const next = has ? d.featTypes.filter((t) => t !== cat) : [...d.featTypes, cat];
      return { ...d, featTypes: next.length === 0 ? ['General'] : next };
    });
  }

  function toggleClass(cls: string) {
    setDraft((d) => {
      const has = d.classRestrictions.includes(cls);
      return {
        ...d,
        classRestrictions: has
          ? d.classRestrictions.filter((c) => c !== cls)
          : [...d.classRestrictions, cls],
      };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (draft.featTypes.length === 0) { setError('Select at least one feat type.'); return; }

    setError(null);
    setSaving(true);
    try {
      const body = {
        name: draft.name.trim(),
        shortDescription: draft.shortDescription.trim(),
        fullDescription: draft.fullDescription.trim() || undefined,
        featTypes: draft.featTypes,
        prerequisites: draft.prerequisites.trim() || undefined,
        prerequisiteFeats: draft.prerequisiteFeats,
        modifiers: draft.modifiers,
        repeatable: draft.repeatable,
        classRestrictions: draft.classRestrictions,
      };

      const url = featId ? `/api/custom-feats/${featId}` : '/api/custom-feats';
      const method = featId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json() as CustomFeat | { error: string };
      if (!res.ok) {
        setError((data as { error: string }).error ?? 'Failed to save.');
        return;
      }
      onSaved(data as CustomFeat);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!featId || !onDeleted) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/custom-feats/${featId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? 'Failed to delete.');
        return;
      }
      onDeleted(featId);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {confirmDelete && (
        <DeleteConfirmModal
          featName={draft.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-3 shrink-0 border-b border-[var(--color-border-muted)]"
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBack}
            title="Back to custom feats"
            aria-label="Back to custom feats"
            className="inline-flex items-center justify-center cf-back-btn"
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
            className="inline-flex items-center justify-center cf-header-sep"
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
          <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
            {featId ? draft.name || 'Edit Custom Feat' : 'New Custom Feat'}
          </h2>
          {readOnly && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full border border-[var(--color-border-default)] text-[color:var(--color-fg-muted)]">
              Read only
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && featId && onDeleted && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="btn btn-danger"
            >
              Delete
            </button>
          )}
          {!readOnly && (
            <button
              type="submit"
              form="custom-feat-form"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving…' : 'Save Feat'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 pb-[72px]">
        {error && (
          <div
            className="mb-4 px-3 py-2 rounded text-sm cf-error-alert"
          >
            {error}
          </div>
        )}

        <form id="custom-feat-form" onSubmit={handleSave} noValidate>
          <fieldset disabled={readOnly} style={{ all: 'unset', display: 'contents' }}>
          <div className="flex flex-col gap-5">

            {/* Name */}
            <div>
              <label className="cf-field-label" htmlFor="cf-name">Name</label>
              <input
                id="cf-name"
                type="text"
                className="cf-input"
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                maxLength={120}
                placeholder="e.g. Arcane Empowerment"
              />
            </div>

            {/* Short Description */}
            <div>
              <label className="cf-field-label" htmlFor="cf-short">Short Description</label>
              <input
                id="cf-short"
                type="text"
                className="cf-input"
                value={draft.shortDescription}
                onChange={(e) => set('shortDescription', e.target.value)}
                maxLength={300}
                placeholder="One-line summary shown in the feat slot table"
              />
            </div>

            {/* Prerequisites */}
            <div>
              <label className="cf-field-label" htmlFor="cf-prereq">Prerequisites</label>
              <input
                id="cf-prereq"
                type="text"
                className="cf-input"
                value={draft.prerequisites}
                onChange={(e) => set('prerequisites', e.target.value)}
                maxLength={300}
                placeholder="e.g. Int 13, Spellcraft 5 ranks"
              />
            </div>

            {/* Full Description */}
            <div>
              <label className="cf-field-label" htmlFor="cf-full">Full Description</label>
              <textarea
                id="cf-full"
                className="cf-input min-h-[100px] resize-y font-[inherit]"
                value={draft.fullDescription}
                onChange={(e) => set('fullDescription', e.target.value)}
                maxLength={4000}
                placeholder="Detailed rules text (optional)"
              />
            </div>

            {/* Feat Types */}
            <div>
              <span className="cf-field-label">Feat Type(s)</span>
              <div className="flex flex-wrap gap-3">
                {FEAT_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-1.5 text-sm cursor-pointer text-[color:var(--color-fg-default)]"
                  >
                    <input
                      type="checkbox"
                      checked={draft.featTypes.includes(cat)}
                      onChange={() => toggleFeatType(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            {/* Repeatable */}
            <div>
              <label
                className="flex items-center gap-2 text-sm cursor-pointer text-[color:var(--color-fg-default)]"
              >
                <input
                  type="checkbox"
                  checked={draft.repeatable}
                  onChange={(e) => set('repeatable', e.target.checked)}
                />
                <span>
                  <span className="font-semibold">Repeatable</span>
                  <span className="text-[color:var(--color-fg-muted)] ml-[6px]">
                    — can be selected more than once (for different weapon types, spell schools, etc.)
                  </span>
                </span>
              </label>
            </div>

            {/* Class Restrictions */}
            <div>
              <span className="cf-field-label">Class Restrictions</span>
              <p className="text-xs mb-2 text-[color:var(--color-fg-muted)]">
                Leave all unchecked to make this feat available to every character.
                Check specific classes to restrict it to characters with at least one of those classes.
              </p>
              <div className="flex flex-wrap gap-3">
                {CLASSES.map((cls) => (
                  <label
                    key={cls}
                    className="flex items-center gap-1.5 text-sm cursor-pointer text-[color:var(--color-fg-default)]"
                  >
                    <input
                      type="checkbox"
                      checked={draft.classRestrictions.includes(cls)}
                      onChange={() => toggleClass(cls)}
                    />
                    {cls}
                  </label>
                ))}
              </div>
            </div>

            {/* Prerequisite Feats */}
            <PrerequisiteFeatsField
              value={draft.prerequisiteFeats}
              onChange={(v) => set('prerequisiteFeats', v)}
            />

            {/* Modifiers */}
            <ModifiersField
              value={draft.modifiers}
              onChange={(v) => set('modifiers', v)}
            />

          </div>
          </fieldset>
        </form>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type PageView = 'list' | { mode: 'new' } | { mode: 'edit'; feat: CustomFeat; readOnly: boolean };

export function CustomFeatsPage() {
  const [feats, setFeats] = useState<CustomFeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<PageView>('list');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/custom-feats', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load custom feats');
        return r.json() as Promise<CustomFeat[]>;
      })
      .then((data) => { if (!cancelled) setFeats(data); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load custom feats'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function handleSaved(feat: CustomFeat) {
    setFeats((prev) => {
      const idx = prev.findIndex((f) => f._id === feat._id);
      return idx >= 0 ? prev.map((f, i) => (i === idx ? feat : f)) : [...prev, feat].sort((a, b) => a.name.localeCompare(b.name));
    });
    setView('list');
  }

  function handleDeleted(id: string) {
    setFeats((prev) => prev.filter((f) => f._id !== id));
    setView('list');
  }

  // ── Editor view ────────────────────────────────────────────────────────────
  if (view !== 'list') {
    const isEdit = view.mode === 'edit';
    const feat = isEdit ? view.feat : null;    const readOnly = isEdit && view.readOnly;    const initial: FeatDraft = feat
      ? {
          name: feat.name,
          shortDescription: feat.shortDescription,
          fullDescription: feat.fullDescription ?? '',
          featTypes: feat.featTypes,
          prerequisites: feat.prerequisites ?? '',
          prerequisiteFeats: feat.prerequisiteFeats ?? [],
          modifiers: feat.modifiers ?? [],
          repeatable: feat.repeatable,
          classRestrictions: feat.classRestrictions,
        }
      : blankDraft();

    return (
      <div className="flex flex-col h-full">
        <FeatEditorForm
          initial={initial}
          featId={feat?._id ?? null}
          onSaved={handleSaved}
          onDeleted={!readOnly && isEdit ? handleDeleted : undefined}
          onBack={() => setView('list')}
          readOnly={readOnly}
        />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-xl font-semibold text-[color:var(--color-fg-default)]"
        >
          Custom Feats
        </h2>
        <button
          type="button"
          onClick={() => setView({ mode: 'new' })}
          className="btn btn-primary"
        >
          + Custom Feat
        </button>
      </div>

      {loading && (
        <p className="text-sm text-[color:var(--color-fg-muted)]">Loading…</p>
      )}

      {error && (
        <p className="text-sm text-[color:var(--color-danger-fg)]">{error}</p>
      )}

      {!loading && !error && (
        <div
          className="rounded overflow-hidden border border-[var(--color-border-default)]"
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[var(--color-canvas-subtle)]">
                {['Name', 'Type(s)'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]"
                  >
                    {h}
                  </th>
                ))}
                <th className="hidden lg:table-cell text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                  Short Description
                </th>
                <th className="hidden md:table-cell text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                  Restrictions
                </th>
                <th className="hidden xl:table-cell text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                  Last Modified
                </th>
                <th className="hidden sm:table-cell text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]" />
              </tr>
            </thead>
            <tbody>
              {feats.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-[color:var(--color-fg-muted)]"
                  >
                    No custom feats yet.{' '}
                    <button
                      type="button"
                      onClick={() => setView({ mode: 'new' })}
                      className="bg-transparent border-0 p-0 cursor-pointer underline [font:inherit] text-[color:var(--color-accent-fg)]"
                    >
                      Create one
                    </button>{' '}
                    to get started.
                  </td>
                </tr>
              ) : (
                feats.map((feat, i) => (
                  <tr
                    key={feat._id}
                    className={`cursor-pointer border-b border-[var(--color-border-muted)] hover:bg-[var(--color-accent-subtle)] ${i % 2 === 0 ? 'bg-[var(--color-canvas-default)]' : 'bg-[var(--color-canvas-subtle)]'}`}
                    onClick={() => setView({ mode: 'edit', feat, readOnly: feat.isOwner === false })}>
                    <td className="px-4 py-2 font-medium text-[color:var(--color-fg-default)]">
                      {feat.name}
                      {feat.repeatable && (
                        <span
                          className="ml-2 text-xs text-[color:var(--color-fg-muted)]"
                          title="Repeatable"
                        >
                          ×n
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap">
                      {feat.featTypes.join(', ')}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-2 text-[color:var(--color-fg-default)] max-w-[280px]">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                        {feat.shortDescription || '—'}
                      </span>
                    </td>
                    <td className="hidden md:table-cell px-4 py-2 text-xs text-[color:var(--color-fg-muted)] whitespace-nowrap">
                      {feat.classRestrictions.length === 0 ? 'All classes' : feat.classRestrictions.join(', ')}
                    </td>
                    <td className="hidden xl:table-cell px-4 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap">
                      {formatDate(feat.updatedAt)}
                    </td>
                    <td className="hidden sm:table-cell px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setView({ mode: 'edit', feat, readOnly: feat.isOwner === false });
                        }}
                        title={feat.isOwner === false ? 'View feat' : 'Edit feat'}
                        aria-label={feat.isOwner === false ? `View ${feat.name}` : `Edit ${feat.name}`}
                        className="text-xs px-2 py-1 rounded cf-row-edit-btn"
                      >
                        {feat.isOwner === false ? 'View' : 'Edit'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
