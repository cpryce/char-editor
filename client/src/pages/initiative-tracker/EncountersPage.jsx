import { useState, useEffect } from 'react';

const MAX_ENCOUNTERS = 5;

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Never opened';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function EncountersPage({ onOpenEncounter }) {
  const [encounters, setEncounters] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const renameEncounter = async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/encounters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      const data = await res.json();
      setEncounters((prev) => prev.map((s) => s.id === id ? { ...s, name: data.name } : s));
    }
  };

  const atLimit = encounters.length >= MAX_ENCOUNTERS;

  return (
    <div className="px-6 py-8">
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-fg-default)' }}>
        Encounters
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--color-fg-muted)' }}>
        {encounters.length} / {MAX_ENCOUNTERS} encounters used.
      </p>

      <form onSubmit={createEncounter} className="flex gap-2 mb-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New encounter name..."
          disabled={atLimit}
          className="flex-1 px-3 py-2 rounded-md text-sm"
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
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-accent-emphasis)',
            color: '#ffffff',
            border: 'none',
            cursor: creating || atLimit ? 'not-allowed' : 'pointer',
            opacity: creating || atLimit ? 0.5 : 1,
          }}
        >
          Create Encounter
        </button>
      </form>

      {atLimit && (
        <p className="text-xs mb-4" style={{ color: 'var(--color-danger-fg)' }}>
          Maximum of {MAX_ENCOUNTERS} encounters reached. Delete an encounter to create a new one.
        </p>
      )}
      {error && <p className="text-xs mb-4" style={{ color: 'var(--color-danger-fg)' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--color-fg-muted)' }}>Loading encounters…</p>
      ) : encounters.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ backgroundColor: 'var(--color-canvas-default)', border: '1px solid var(--color-border-default)' }}
        >
          <p style={{ color: 'var(--color-fg-muted)' }}>No encounters yet.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-subtle)' }}>Create your first encounter above.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {encounters.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{
                backgroundColor: 'var(--color-canvas-default)',
                border: `1px solid ${i === 0 ? 'var(--color-accent-fg)' : 'var(--color-border-default)'}`,
                boxShadow: 'var(--color-shadow-medium, 0 3px 6px rgba(140,149,159,0.15))',
              }}
            >
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenEncounter(s.id)}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={s.name}
                    onFocus={(e) => { e.target.select(); e.target.style.borderColor = 'var(--color-accent-fg)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'transparent'; renameEncounter(s.id, e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { e.target.value = s.name; e.target.blur(); } e.stopPropagation(); }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontWeight: 500,
                      fontSize: '14px',
                      color: 'var(--color-fg-default)',
                      background: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: '4px',
                      padding: '1px 4px',
                      outline: 'none',
                      width: '240px',
                      transition: 'border-color 0.15s',
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                    {s.players?.length ?? 0} players saved
                  </p>
                  <span style={{ color: 'var(--color-fg-subtle)', fontSize: '11px' }}>·</span>
                  <p className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>
                    {formatRelativeTime(s.lastAccessed)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteEncounter(s.id); }}
                className="text-xs px-2 py-1 rounded"
                style={{ color: 'var(--color-danger-fg)', border: '1px solid var(--color-border-muted)', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs mt-8" style={{ color: 'var(--color-fg-subtle)' }}>
        Dragon icon by{' '}
        <a
          href="https://www.svgrepo.com/svg/355412/mode-standard-dragon"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-accent-fg)' }}
        >
          SVG Repo
        </a>
      </p>
    </div>
  );
}
