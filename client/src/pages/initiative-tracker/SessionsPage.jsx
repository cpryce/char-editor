import { useState, useEffect } from 'react';

const MAX_SESSIONS = 5;

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

export function SessionsPage({ onOpenSession }) {
  const [sessions, setSessions] = useState([]);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/sessions', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const createSession = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to create session');
      setCreating(false);
      return;
    }
    setSessions((prev) => [data, ...prev]);
    setNewName('');
    setCreating(false);
    onOpenSession(data.id);
  };

  const deleteSession = async (id) => {
    if (!confirm('Delete this encounter session?')) return;
    await fetch(`/api/sessions/${id}`, { method: 'DELETE', credentials: 'include' });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const renameSession = async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: trimmed }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessions((prev) => prev.map((s) => s.id === id ? { ...s, name: data.name } : s));
    }
  };

  const atLimit = sessions.length >= MAX_SESSIONS;

  return (
    <div className="px-6 py-8">
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--color-fg-default)' }}>
        Encounter Sessions
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--color-fg-muted)' }}>
        {sessions.length} / {MAX_SESSIONS} sessions used.
      </p>

      <form onSubmit={createSession} className="flex gap-2 mb-2">
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
          Create Session
        </button>
      </form>

      {atLimit && (
        <p className="text-xs mb-4" style={{ color: 'var(--color-danger-fg)' }}>
          Maximum of {MAX_SESSIONS} sessions reached. Delete a session to create a new one.
        </p>
      )}
      {error && <p className="text-xs mb-4" style={{ color: 'var(--color-danger-fg)' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--color-fg-muted)' }}>Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <div
          className="text-center py-16 rounded-xl"
          style={{ backgroundColor: 'var(--color-canvas-default)', border: '1px solid var(--color-border-default)' }}
        >
          <p style={{ color: 'var(--color-fg-muted)' }}>No encounter sessions yet.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-subtle)' }}>Create your first encounter above.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessions.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center justify-between px-4 py-3 rounded-lg"
              style={{
                backgroundColor: 'var(--color-canvas-default)',
                border: `1px solid ${i === 0 ? 'var(--color-accent-fg)' : 'var(--color-border-default)'}`,
                boxShadow: 'var(--color-shadow-medium, 0 3px 6px rgba(140,149,159,0.15))',
              }}
            >
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpenSession(s.id)}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={s.name}
                    onFocus={(e) => { e.target.select(); e.target.style.borderColor = 'var(--color-accent-fg)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'transparent'; renameSession(s.id, e.target.value); }}
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
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                className="text-xs px-2 py-1 rounded"
                style={{ color: 'var(--color-danger-fg)', border: '1px solid var(--color-border-muted)', backgroundColor: 'transparent', cursor: 'pointer' }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
