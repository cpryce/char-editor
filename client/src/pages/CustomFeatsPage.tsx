import { useEffect, useState } from 'react';
import type { CustomFeat } from '../types/customFeat';
import type { FeatCategory } from '../components/FeatAutocomplete';
import { CLASSES } from '../types/character';

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
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          border: 'none',
          zIndex: 200,
          cursor: 'pointer',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Confirm delete"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 201,
          background: 'var(--color-canvas-overlay)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 10,
          padding: '24px 28px',
          width: 360,
          maxWidth: '92vw',
          boxShadow: '0 12px 32px rgba(0,0,0,0.28)',
        }}
      >
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--color-fg-default)' }}>
          Delete "{featName}"?
        </p>
        <p className="text-sm mb-5" style={{ color: 'var(--color-fg-muted)' }}>
          This cannot be undone. Characters using this feat by name will retain the name but lose the
          description.
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn">Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn"
            style={{
              background: 'var(--color-danger-fg)',
              color: '#fff',
              border: '1px solid var(--color-danger-fg)',
            }}
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
}: {
  initial: FeatDraft;
  featId: string | null; // null = new feat
  onSaved: (feat: CustomFeat) => void;
  onDeleted?: (id: string) => void;
  onBack: () => void;
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
      setConfirmDelete(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-fg-muted)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    border: '1px solid var(--color-border-default)',
    borderRadius: 6,
    background: 'var(--color-canvas-default)',
    color: 'var(--color-fg-default)',
    fontSize: 13,
    boxSizing: 'border-box',
  };

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
        className="flex items-center justify-between px-6 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border-muted)' }}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBack}
            title="Back to custom feats"
            aria-label="Back to custom feats"
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
            {featId ? draft.name || 'Edit Custom Feat' : 'New Custom Feat'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {featId && onDeleted && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              className="btn"
              style={{ color: 'var(--color-danger-fg)', borderColor: 'var(--color-danger-fg)' }}
            >
              Delete
            </button>
          )}
          <button
            type="submit"
            form="custom-feat-form"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving…' : 'Save Feat'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <div
            className="mb-4 px-3 py-2 rounded text-sm"
            style={{ background: 'var(--color-danger-subtle)', color: 'var(--color-danger-fg)', border: '1px solid var(--color-danger-muted)' }}
          >
            {error}
          </div>
        )}

        <form id="custom-feat-form" onSubmit={handleSave} noValidate>
          <div className="flex flex-col gap-5">

            {/* Name */}
            <div>
              <label style={labelStyle} htmlFor="cf-name">Name</label>
              <input
                id="cf-name"
                type="text"
                style={inputStyle}
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                maxLength={120}
                placeholder="e.g. Arcane Empowerment"
              />
            </div>

            {/* Short Description */}
            <div>
              <label style={labelStyle} htmlFor="cf-short">Short Description</label>
              <input
                id="cf-short"
                type="text"
                style={inputStyle}
                value={draft.shortDescription}
                onChange={(e) => set('shortDescription', e.target.value)}
                maxLength={300}
                placeholder="One-line summary shown in the feat slot table"
              />
            </div>

            {/* Prerequisites */}
            <div>
              <label style={labelStyle} htmlFor="cf-prereq">Prerequisites</label>
              <input
                id="cf-prereq"
                type="text"
                style={inputStyle}
                value={draft.prerequisites}
                onChange={(e) => set('prerequisites', e.target.value)}
                maxLength={300}
                placeholder="e.g. Int 13, Spellcraft 5 ranks"
              />
            </div>

            {/* Full Description */}
            <div>
              <label style={labelStyle} htmlFor="cf-full">Full Description</label>
              <textarea
                id="cf-full"
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                value={draft.fullDescription}
                onChange={(e) => set('fullDescription', e.target.value)}
                maxLength={4000}
                placeholder="Detailed rules text (optional)"
              />
            </div>

            {/* Feat Types */}
            <div>
              <span style={labelStyle}>Feat Type(s)</span>
              <div className="flex flex-wrap gap-3">
                {FEAT_CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-1.5 text-sm cursor-pointer"
                    style={{ color: 'var(--color-fg-default)' }}
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
                className="flex items-center gap-2 text-sm cursor-pointer"
                style={{ color: 'var(--color-fg-default)' }}
              >
                <input
                  type="checkbox"
                  checked={draft.repeatable}
                  onChange={(e) => set('repeatable', e.target.checked)}
                />
                <span>
                  <span className="font-semibold">Repeatable</span>
                  <span style={{ color: 'var(--color-fg-muted)', marginLeft: 6 }}>
                    — can be selected more than once (for different weapon types, spell schools, etc.)
                  </span>
                </span>
              </label>
            </div>

            {/* Class Restrictions */}
            <div>
              <span style={labelStyle}>Class Restrictions</span>
              <p className="text-xs mb-2" style={{ color: 'var(--color-fg-muted)' }}>
                Leave all unchecked to make this feat available to every character.
                Check specific classes to restrict it to characters with at least one of those classes.
              </p>
              <div className="flex flex-wrap gap-3">
                {CLASSES.map((cls) => (
                  <label
                    key={cls}
                    className="flex items-center gap-1.5 text-sm cursor-pointer"
                    style={{ color: 'var(--color-fg-default)' }}
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
        </form>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type PageView = 'list' | { mode: 'new' } | { mode: 'edit'; feat: CustomFeat };

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
    const feat = isEdit ? view.feat : null;
    const initial: FeatDraft = feat
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
          onDeleted={isEdit ? handleDeleted : undefined}
          onBack={() => setView('list')}
        />
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-xl font-semibold"
          style={{ color: 'var(--color-fg-default)' }}
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
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Loading…</p>
      )}

      {error && (
        <p className="text-sm" style={{ color: 'var(--color-danger-fg)' }}>{error}</p>
      )}

      {!loading && !error && (
        <div
          className="rounded overflow-hidden border"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--color-canvas-subtle)' }}>
                {['Name', 'Type(s)', 'Short Description', 'Restrictions', 'Last Modified', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 font-medium"
                    style={{
                      color: 'var(--color-fg-muted)',
                      borderBottom: '1px solid var(--color-border-default)',
                    }}
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
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: 'var(--color-fg-muted)' }}
                  >
                    No custom feats yet.{' '}
                    <button
                      type="button"
                      onClick={() => setView({ mode: 'new' })}
                      className="bg-transparent border-0 p-0 cursor-pointer underline [font:inherit]"
                      style={{ color: 'var(--color-accent-fg)' }}
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
                    className="cursor-pointer"
                    style={{
                      borderBottom: '1px solid var(--color-border-muted)',
                      background: i % 2 === 0
                        ? 'var(--color-canvas-default)'
                        : 'var(--color-canvas-subtle)',
                    }}
                    onClick={() => setView({ mode: 'edit', feat })}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-subtle)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0
                      ? 'var(--color-canvas-default)'
                      : 'var(--color-canvas-subtle)')}
                  >
                    <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-fg-default)' }}>
                      {feat.name}
                      {feat.repeatable && (
                        <span
                          className="ml-2 text-xs"
                          style={{ color: 'var(--color-fg-muted)' }}
                          title="Repeatable"
                        >
                          ×n
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                      {feat.featTypes.join(', ')}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-fg-default)', maxWidth: 280 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {feat.shortDescription || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs" style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                      {feat.classRestrictions.length === 0 ? 'All classes' : feat.classRestrictions.join(', ')}
                    </td>
                    <td className="px-4 py-2" style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(feat.updatedAt)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setView({ mode: 'edit', feat });
                        }}
                        title="Edit feat"
                        aria-label={`Edit ${feat.name}`}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          border: '1px solid var(--color-border-default)',
                          background: 'transparent',
                          color: 'var(--color-accent-fg)',
                          cursor: 'pointer',
                        }}
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
      )}
    </div>
  );
}
