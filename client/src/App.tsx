import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterEditor } from './pages/CharacterEditor';

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

type Section = 'characters';
type View = 'list' | 'new' | 'edit';

// ── User dropdown ────────────────────────────────────────────────────────────

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded"
        style={{
          background: 'transparent',
          border: '1px solid transparent',
          cursor: 'pointer',
          borderColor: open ? 'var(--color-border-default)' : 'transparent',
        }}
      >
        {user.avatar && (
          <img
            src={user.avatar}
            className="w-7 h-7 rounded-full"
            alt=""
            referrerPolicy="no-referrer"
          />
        )}
        <span className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
          {user.name ?? user.email}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 4px)',
            minWidth: 180,
            background: 'var(--color-canvas-overlay)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <div
            className="px-3 py-2 text-xs"
            style={{
              color: 'var(--color-fg-subtle)',
              borderBottom: '1px solid var(--color-border-muted)',
            }}
          >
            {user.email}
          </div>
          <button
            type="button"
            disabled
            className="w-full text-left text-sm px-3 py-2"
            style={{
              color: 'var(--color-fg-subtle)',
              cursor: 'not-allowed',
              fontStyle: 'italic',
              background: 'transparent',
              border: 'none',
            }}
          >
            Settings
          </button>
          <div style={{ borderTop: '1px solid var(--color-border-muted)' }}>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full text-left text-sm px-3 py-2"
              style={{
                color: 'var(--color-danger-fg)',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-subtle)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('characters');
  const [view, setView] = useState<View>('list');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/auth/me', { credentials: 'include' })
      .then(r => (r.ok ? r.json() : null))
      .then((data: User | null) => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }

  if (loading) return null;

  if (!user) {
    return (
      <main
        className="flex items-center justify-center h-screen"
        style={{ background: 'var(--color-canvas-default)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-fg-default)' }}>
            char-editor
          </h1>
          <a
            href="/auth/google"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium"
            style={{
              background: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Sign in with Google
          </a>
        </div>
      </main>
    );
  }

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: 'var(--color-canvas-default)' }}
    >
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{
          borderBottom: '1px solid var(--color-border-default)',
          background: 'var(--color-canvas-subtle)',
        }}
      >
        <span className="font-semibold text-base" style={{ color: 'var(--color-fg-default)' }}>
          char-editor
        </span>
        <UserMenu user={user} onLogout={logout} />
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={section} onNavigate={(id) => { setSection(id as Section); setView('list'); }} />
        <main className="flex-1 overflow-y-auto">
          {section === 'characters' && view === 'list' && (
            <CharactersPage
              onNewCharacter={() => {
                setSelectedCharacterId(null);
                setView('new');
              }}
              onEditCharacter={(id) => {
                setSelectedCharacterId(id);
                setView('edit');
              }}
            />
          )}
          {section === 'characters' && view === 'new' && (
            <CharacterEditor
              onCancel={() => setView('list')}
            />
          )}
          {section === 'characters' && view === 'edit' && selectedCharacterId && (
            <CharacterEditor
              characterId={selectedCharacterId}
              onCancel={() => {
                setSelectedCharacterId(null);
                setView('list');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

