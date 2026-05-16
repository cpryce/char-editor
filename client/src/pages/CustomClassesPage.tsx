import { useEffect, useRef, useState } from 'react';
import type { CustomClass, CustomClassFeature, BabProgression, SaveProgression } from '../types/customClass';
import '../pages/CustomFeatsPage.css';
import './CustomClassesPage.css';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const BAB_OPTIONS: { value: BabProgression; label: string }[] = [
  { value: 1.0,  label: 'Full (×1.0) — Fighter, Paladin, Ranger…' },
  { value: 0.75, label: 'Medium (×0.75) — Cleric, Druid, Rogue…' },
  { value: 0.5,  label: 'Poor (×0.5) — Wizard, Sorcerer…' },
];

const HIT_DICE_OPTIONS = [4, 6, 8, 10, 12];

const SAVE_OPTIONS: { value: SaveProgression; label: string }[] = [
  { value: 'good', label: 'Good' },
  { value: 'poor', label: 'Poor' },
];

function blankFeature(): CustomClassFeature {
  return { name: '', level: 1, description: '' };
}

// ── Draft type ────────────────────────────────────────────────────────────────

interface ClassDraft {
  name: string;
  description: string;
  babProgression: BabProgression;
  hitDice: number;
  fortitudeSave: SaveProgression;
  reflexSave: SaveProgression;
  willSave: SaveProgression;
  skillsAtFirst: number;
  skillsPerLevel: number;
  classSkills: string;
  features: CustomClassFeature[];
}

function blankDraft(): ClassDraft {
  return { name: '', description: '', babProgression: 1.0, hitDice: 8, fortitudeSave: 'poor', reflexSave: 'poor', willSave: 'poor', skillsAtFirst: 4, skillsPerLevel: 2, classSkills: '', features: [] };
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteConfirmModal({
  className,
  onConfirm,
  onCancel,
}: {
  className: string;
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
          Delete "{className}"?
        </p>
        <p className="text-sm mb-5 text-[color:var(--color-fg-muted)]">
          This cannot be undone.
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

function ClassEditorForm({
  initial,
  classId,
  onSaved,
  onDeleted,
  onBack,
}: {
  initial: ClassDraft;
  classId: string | null;
  onSaved: (cls: CustomClass) => void;
  onDeleted?: (id: string) => void;
  onBack: () => void;
}) {
  const [draft, setDraft] = useState<ClassDraft>(initial);
  const [autoSaveClassId, setAutoSaveClassId] = useState<string | null>(classId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [initialDraftFingerprint, setInitialDraftFingerprint] = useState<string>(JSON.stringify(initial));
  const saveSequenceRef = useRef(0);

  const hasRequiredFields = draft.name.trim().length > 0;

  useEffect(() => {
    if (!hasRequiredFields) return;
    const currentFingerprint = JSON.stringify(draft);
    if (currentFingerprint === initialDraftFingerprint) return;

    const timer = setTimeout(() => {
      const run = async () => {
        const sequence = ++saveSequenceRef.current;
        setSaving(true);
        setError(null);
        try {
          const body = {
            name: draft.name.trim(),
            description: draft.description.trim() || undefined,
            babProgression: draft.babProgression,
            hitDice: draft.hitDice,
            fortitudeSave: draft.fortitudeSave,
            reflexSave: draft.reflexSave,
            willSave: draft.willSave,
            skillsAtFirst: draft.skillsAtFirst,
            skillsPerLevel: draft.skillsPerLevel,
            classSkills: draft.classSkills.trim() || undefined,
            features: draft.features
              .filter((f) => f.name.trim())
              .map((f) => ({ name: f.name.trim(), level: Number(f.level), description: f.description.trim() })),
          };
          const existingId = autoSaveClassId;
          const url = existingId ? `/api/custom-classes/${existingId}` : '/api/custom-classes';
          const method = existingId ? 'PUT' : 'POST';
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
          const saved = await res.json() as CustomClass;
          if (!existingId) {
            setAutoSaveClassId(saved._id);
          }
          if (sequence === saveSequenceRef.current) {
            setInitialDraftFingerprint(JSON.stringify(draft));
            onSaved(saved);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, hasRequiredFields, initialDraftFingerprint, autoSaveClassId]);

  function setTop<K extends keyof ClassDraft>(key: K, value: ClassDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setFeature(index: number, field: keyof CustomClassFeature, value: string | number) {
    setDraft((d) => {
      const features = d.features.map((f, i) =>
        i === index ? { ...f, [field]: value } : f,
      );
      return { ...d, features };
    });
  }

  function addFeature() {
    setDraft((d) => ({ ...d, features: [...d.features, blankFeature()] }));
  }

  function removeFeature(index: number) {
    setDraft((d) => ({ ...d, features: d.features.filter((_, i) => i !== index) }));
  }

  async function handleDelete() {
    const id = autoSaveClassId;
    if (!id || !onDeleted) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/custom-classes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? 'Failed to delete.');
        return;
      }
      onDeleted(id);
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
          className={draft.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 shrink-0 border-b border-[var(--color-border-muted)]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBack}
            title="Back to custom classes"
            aria-label="Back to custom classes"
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
          <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
            {classId ? (draft.name || 'Edit Custom Class') : 'New Custom Class'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-xs text-[color:var(--color-fg-muted)]">Saving…</span>
          )}
          {!saving && autoSaveClassId && (
            <span className="text-xs text-[color:var(--color-fg-muted)]">Saved</span>
          )}
          {(autoSaveClassId ?? classId) && onDeleted && (
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={saving} className="btn btn-danger">
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <div className="mb-4 px-3 py-2 rounded text-sm cf-error-alert">{error}</div>
        )}

        <form id="custom-class-form" noValidate>
          <div className="flex flex-col gap-5">

            {/* Name */}
            <div>
              <label className="cf-field-label" htmlFor="cc-name">Class Name</label>
              <input
                id="cc-name"
                type="text"
                className="cf-input"
                value={draft.name}
                onChange={(e) => setTop('name', e.target.value)}
                maxLength={120}
                placeholder="e.g. Arcane Warrior"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="cf-field-label" htmlFor="cc-desc">Description</label>
              <textarea
                id="cc-desc"
                className="cf-input"
                value={draft.description}
                onChange={(e) => setTop('description', e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Brief description of the class (optional)"
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
              <p className="text-xs mt-1 text-[color:var(--color-fg-muted)]">{draft.description.length} / 200</p>
            </div>

            {/* BAB + Hit Dice + Saves — single inline row */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label className="cf-field-label" htmlFor="cc-bab">Base Attack Bonus</label>
                <select
                  id="cc-bab"
                  className="cf-input"
                  value={draft.babProgression}
                  onChange={(e) => setTop('babProgression', Number(e.target.value) as BabProgression)}
                  style={{ width: 'auto' }}
                >
                  {BAB_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cf-field-label" htmlFor="cc-hd">Hit Dice</label>
                <select
                  id="cc-hd"
                  className="cf-input"
                  value={draft.hitDice}
                  onChange={(e) => setTop('hitDice', Number(e.target.value))}
                  style={{ width: 'auto' }}
                >
                  {HIT_DICE_OPTIONS.map((d) => (
                    <option key={d} value={d}>d{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cf-field-label" htmlFor="cc-fort">Fortitude Save</label>
                <select
                  id="cc-fort"
                  className="cf-input"
                  value={draft.fortitudeSave}
                  onChange={(e) => setTop('fortitudeSave', e.target.value as SaveProgression)}
                  style={{ width: 'auto' }}
                >
                  {SAVE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="cf-field-label" htmlFor="cc-ref">Reflex Save</label>
                <select
                  id="cc-ref"
                  className="cf-input"
                  value={draft.reflexSave}
                  onChange={(e) => setTop('reflexSave', e.target.value as SaveProgression)}
                  style={{ width: 'auto' }}
                >
                  {SAVE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="cf-field-label" htmlFor="cc-will">Will Save</label>
                <select
                  id="cc-will"
                  className="cf-input"
                  value={draft.willSave}
                  onChange={(e) => setTop('willSave', e.target.value as SaveProgression)}
                  style={{ width: 'auto' }}
                >
                  {SAVE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Skills */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label className="cf-field-label" htmlFor="cc-skills-first">Skills at 1st Level</label>
                <input
                  id="cc-skills-first"
                  type="number"
                  className="cf-input"
                  value={draft.skillsAtFirst}
                  min={1}
                  max={40}
                  onChange={(e) => setTop('skillsAtFirst', Math.min(40, Math.max(1, Number(e.target.value))))}
                  style={{ width: '80px' }}
                />
                <span className="text-sm ml-2 text-[color:var(--color-fg-muted)]">×4</span>
              </div>
              <div>
                <label className="cf-field-label" htmlFor="cc-skills-level">Skills per Level</label>
                <input
                  id="cc-skills-level"
                  type="number"
                  className="cf-input"
                  value={draft.skillsPerLevel}
                  min={1}
                  max={20}
                  onChange={(e) => setTop('skillsPerLevel', Math.min(20, Math.max(1, Number(e.target.value))))}
                  style={{ width: '80px' }}
                />
              </div>
            </div>

            {/* Class Skills */}
            <div>
              <label className="cf-field-label" htmlFor="cc-class-skills">Class Skills</label>
              <textarea
                id="cc-class-skills"
                className="cf-input"
                value={draft.classSkills}
                onChange={(e) => setTop('classSkills', e.target.value)}
                placeholder="e.g. Climb, Hide, Move Silently, Tumble"
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
              <p className="text-xs mt-1 text-[color:var(--color-fg-muted)]">Comma-separated list of class skills.</p>
            </div>

            {/* Class Features */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="cf-field-label" style={{ marginBottom: 0 }}>Class Features</span>
                <button type="button" onClick={addFeature} className="btn btn-default" style={{ fontSize: '12px', padding: '3px 10px' }}>
                  + Add Feature
                </button>
              </div>

              {draft.features.length === 0 ? (
                <p className="text-sm text-[color:var(--color-fg-muted)] mt-1">No features yet. Click "+ Add Feature" to add one.</p>
              ) : (
                <div className="rounded overflow-hidden border border-[var(--color-border-default)]">
                  <table className="cc-features-table">
                    <thead>
                      <tr>
                        <th style={{ width: '36px' }}>Lvl</th>
                        <th style={{ width: '200px' }}>Feature Name</th>
                        <th>Description</th>
                        <th style={{ width: '32px' }} />
                      </tr>
                    </thead>
                    <tbody>
                      {draft.features.map((f, i) => (
                        <tr key={i}>
                          <td>
                            <input
                              type="number"
                              className="cc-feature-input"
                              value={f.level}
                              min={1}
                              max={20}
                              onChange={(e) => setFeature(i, 'level', Math.min(20, Math.max(1, Number(e.target.value))))}
                              style={{ width: '52px' }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="cc-feature-input"
                              value={f.name}
                              maxLength={120}
                              placeholder="Feature name"
                              onChange={(e) => setFeature(i, 'name', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="cc-feature-input"
                              value={f.description}
                              maxLength={1000}
                              placeholder="Short description"
                              onChange={(e) => setFeature(i, 'description', e.target.value)}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="cc-remove-btn"
                              onClick={() => removeFeature(i)}
                              aria-label={`Remove feature ${f.name || i + 1}`}
                              title="Remove"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type PageView = 'list' | { mode: 'new' } | { mode: 'edit'; cls: CustomClass };

export function CustomClassesPage() {
  const [classes, setClasses] = useState<CustomClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<PageView>('list');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/custom-classes', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load custom classes');
        return r.json() as Promise<CustomClass[]>;
      })
      .then((data) => { if (!cancelled) setClasses(data); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load custom classes'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function handleSaved(cls: CustomClass) {
    setClasses((prev) => {
      const idx = prev.findIndex((c) => c._id === cls._id);
      return idx >= 0
        ? prev.map((c, i) => (i === idx ? cls : c))
        : [...prev, cls].sort((a, b) => a.name.localeCompare(b.name));
    });
  }

  function handleDeleted(id: string) {
    setClasses((prev) => prev.filter((c) => c._id !== id));
    setView('list');
  }

  // ── Editor view ────────────────────────────────────────────────────────────
  if (view !== 'list') {
    const isEdit = view.mode === 'edit';
    const cls = isEdit ? view.cls : null;
    const initial: ClassDraft = cls
      ? { name: cls.name, description: cls.description ?? '', babProgression: cls.babProgression, hitDice: cls.hitDice ?? 8, fortitudeSave: cls.fortitudeSave ?? 'poor', reflexSave: cls.reflexSave ?? 'poor', willSave: cls.willSave ?? 'poor', skillsAtFirst: cls.skillsAtFirst ?? 4, skillsPerLevel: cls.skillsPerLevel ?? 2, classSkills: cls.classSkills ?? '', features: cls.features.map((f) => ({ ...f })) }
      : blankDraft();

    return (
      <div className="flex flex-col h-full">
        <ClassEditorForm
          initial={initial}
          classId={cls?._id ?? null}
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
        <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
          Custom Classes
        </h2>
        <button type="button" onClick={() => setView({ mode: 'new' })} className="btn btn-primary">
          + Custom Class
        </button>
      </div>

      {loading && <p className="text-sm text-[color:var(--color-fg-muted)]">Loading…</p>}
      {error && <p className="text-sm text-[color:var(--color-danger-fg)]">{error}</p>}

      {!loading && !error && (
        <div className="rounded overflow-hidden border border-[var(--color-border-default)]">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[var(--color-canvas-subtle)]">
                {['Name', 'BAB', 'HD', 'Fort', 'Ref', 'Will', 'Features', 'Last Modified', ''].map((h) => (
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
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-sm text-[color:var(--color-fg-muted)]">
                    No custom classes yet.{' '}
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
                classes.map((cls, i) => (
                  <tr
                    key={cls._id}
                    className={`cursor-pointer border-b border-[var(--color-border-muted)] hover:bg-[var(--color-accent-subtle)] ${i % 2 === 0 ? 'bg-[var(--color-canvas-default)]' : 'bg-[var(--color-canvas-subtle)]'}`}
                    onClick={() => setView({ mode: 'edit', cls })}
                  >
                    <td className="px-4 py-2 font-medium text-[color:var(--color-fg-default)]">{cls.name}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap">
                      {cls.babProgression === 1.0 ? 'Full' : cls.babProgression === 0.75 ? 'Medium' : 'Poor'}
                    </td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap">d{cls.hitDice ?? 8}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap capitalize">{cls.fortitudeSave ?? '—'}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap capitalize">{cls.reflexSave ?? '—'}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap capitalize">{cls.willSave ?? '—'}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-muted)]">{cls.features.length}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap">{formatDate(cls.updatedAt)}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setView({ mode: 'edit', cls }); }}
                        title="Edit class"
                        aria-label={`Edit ${cls.name}`}
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
      )}
    </div>
  );
}
