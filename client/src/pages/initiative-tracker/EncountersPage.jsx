import { useState, useEffect } from 'react';

const MAX_ENCOUNTERS = 5;

function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' });
  if (elapsedSeconds < 60) return '1 minute ago';
  if (elapsedSeconds < 3600) return rtf.format(-Math.floor(elapsedSeconds / 60), 'minute');
  if (elapsedSeconds < 86400) return rtf.format(-Math.floor(elapsedSeconds / 3600), 'hour');
  if (elapsedSeconds < 604800) return rtf.format(-Math.floor(elapsedSeconds / 86400), 'day');
  if (elapsedSeconds < 2592000) return rtf.format(-Math.floor(elapsedSeconds / 604800), 'week');
  if (elapsedSeconds < 31536000) return rtf.format(-Math.floor(elapsedSeconds / 2592000), 'month');
  return rtf.format(-Math.floor(elapsedSeconds / 31536000), 'year');
}

export function EncountersPage({ onOpenEncounter }) {
  const [encounters, setEncounters] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingDesc, setEditingDesc] = useState(null);
  const [descDraft, setDescDraft] = useState('');

  useEffect(() => {
    fetch('/api/encounters', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { setEncounters(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const createEncounter = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    const res = await fetch('/api/encounters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create encounter');
      setCreating(false);
      return;
    }
    setEncounters((prev) => [data, ...prev]);
    setNewName('');
    setCreating(false);
    onOpenEncounter(data.id);
  };

  const deleteEncounter = async (id) => {
    if (!confirm('Delete this encounter?')) return;
    await fetch(`/api/encounters/${id}`, { method: 'DELETE', credentials: 'include' });
    setEncounters((prev) => prev.filter((s) => s.id !== id));
  };

  const saveDescription = async (id, description) => {
    setEditingDesc(null);
    const res = await fetch(`/api/encounters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ description }),
    });
    if (res.ok) {
      const data = await res.json();
      setEncounters((prev) => prev.map((s) => s.id === id ? { ...s, description: data.description } : s));
    }
  };

  const atLimit = encounters.length >= MAX_ENCOUNTERS;

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-fg-default)' }}>
          Encounters
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
          {encounters.length} / {MAX_ENCOUNTERS} encounters used.
        </p>
      </div>

      <form onSubmit={createEncounter} className="flex gap-2 mb-4">
        <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New encounter name…"
              disabled={atLimit}
              className="flex-1 px-3 py-1.5 rounded text-sm"
              style={{
                backgroundColor: 'var(--color-canvas-default)',
                border: '1px solid var(--color-border-default)',
                color: 'var(--color-fg-default)',
                outline: 'none',
                opacity: atLimit ? 0.5 : 1,
              }}
            />
            <button
              type="submit"
              disabled={creating || !newName.trim() || atLimit}
              className="btn btn-primary"
            >
              Create Encounter
            </button>
          </form>

          {atLimit && (
            <p className="text-xs mb-3" style={{ color: 'var(--color-danger-fg)' }}>
              Maximum of {MAX_ENCOUNTERS} encounters reached. Delete one to create a new one.
            </p>
          )}
          {error && (
            <p className="text-xs mb-3" style={{ color: 'var(--color-danger-fg)' }}>{error}</p>
          )}

          {loading ? (
            <p style={{ color: 'var(--color-fg-muted)' }}>Loading encounters…</p>
          ) : encounters.length === 0 ? (
            <div
              className="text-center py-16 rounded-xl"
              style={{ border: '2px dashed var(--color-border-muted)', color: 'var(--color-fg-muted)' }}
            >
              <p className="font-medium">No encounters yet.</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-fg-subtle)' }}>
                Create your first encounter above.
              </p>
            </div>
          ) : (
            <div className="rounded overflow-hidden border border-[var(--color-border-default)]">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--color-canvas-subtle)]">
                    {['Name', 'Description', 'Last Modified'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]"
                      >
                        {h}
                      </th>
                    ))}
                    <th className="border-b border-[var(--color-border-default)]" />
                  </tr>
                </thead>
                <tbody>
                  {encounters.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-[var(--color-border-muted)] last:border-b-0 bg-[var(--color-canvas-default)] hover:bg-[var(--color-canvas-subtle)]"
                    >
                      <td className="px-4 py-2 font-medium whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onOpenEncounter(s.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            color: 'var(--fgColor-accent)',
                            fontWeight: 500,
                            fontSize: 'inherit',
                          }}
                          className="hover:underline"
                        >
                          {s.name}
                        </button>
                      </td>
                      <td className="px-4 py-2" style={{ color: 'var(--color-fg-muted)', minWidth: 180 }}>
                        {editingDesc === s.id ? (
                          <input
                            type="text"
                            autoFocus
                            value={descDraft}
                            onChange={(e) => setDescDraft(e.target.value)}
                            onBlur={() => saveDescription(s.id, descDraft)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveDescription(s.id, descDraft);
                              if (e.key === 'Escape') setEditingDesc(null);
                            }}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: '1px solid var(--color-accent-emphasis)',
                              borderRadius: 4,
                              padding: '2px 6px',
                              fontSize: 'inherit',
                              color: 'var(--color-fg-default)',
                              outline: 'none',
                            }}
                          />
                        ) : (
                          <span
                            style={{ cursor: 'pointer', display: 'block', minHeight: '1.25em' }}
                            onClick={() => { setEditingDesc(s.id); setDescDraft(s.description ?? ''); }}
                            title="Click to edit"
                          >
                            {s.description || (
                              <span style={{ color: 'var(--color-fg-subtle)', fontStyle: 'italic' }}>
                                Add description…
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td
                        className="px-4 py-2 whitespace-nowrap"
                        style={{ color: 'var(--color-fg-muted)', fontSize: '0.75rem' }}
                      >
                        {formatDate(s.updatedAt)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          className="campaign-editor-remove-btn inline-flex items-center justify-center w-6 h-6"
                          onClick={() => deleteEncounter(s.id)}
                          aria-label={`Delete ${s.name}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M4 2H1V4H15V2H12V0H4V2Z"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M3 6H13V16H3V6ZM7 9H9V13H7V9Z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

    </div>
  );
}

