import { useEffect, useState } from 'react';
import type { CustomFeat } from '../types/customFeat';
import type { FeatCategory } from '../components/FeatAutocomplete';
import { CLASSES } from '../types/character';
import './CustomFeatsPage.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const FEAT_CATEGORIES: FeatCategory[] = [
  'General',
  'Fighter Bonus Feat',
  'Item Creation',
  'Metamagic',
  'Special',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ── Blank draft ───────────────────────────────────────────────────────────────

function blankDraft(): FeatDraft {
  return {
    name: '',
    shortDescription: '',
    fullDescription: '',
    featTypes: ['General'],
    prerequisites: '',
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

      <div className="flex-1 overflow-y-auto px-6 py-5">
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
                {['Name', 'Type(s)', 'Short Description', 'Restrictions', 'Last Modified', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]"
                  >
                    {h}
                  </th>
                ))}
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
                    <td className="px-4 py-2 text-[color:var(--color-fg-default)] max-w-[280px]">
                      <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                        {feat.shortDescription || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-[color:var(--color-fg-muted)] whitespace-nowrap">
                      {feat.classRestrictions.length === 0 ? 'All classes' : feat.classRestrictions.join(', ')}
                    </td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap">
                      {formatDate(feat.updatedAt)}
                    </td>
                    <td className="px-4 py-2 text-right">
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
