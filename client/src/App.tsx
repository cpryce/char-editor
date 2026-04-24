import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterEditor } from './pages/CharacterEditor';
import { CustomFeatsPage } from './pages/CustomFeatsPage';
import { InitiativeTrackerPage } from './pages/InitiativeTrackerPage';

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

type Section = 'characters' | 'custom-feats' | 'initiative-tracker';
type View = 'list' | 'new' | 'edit';
type Theme = 'light' | 'dark';

// ── User dropdown ────────────────────────────────────────────────────────────

function UserMenu({ user, onLogout, onOpenSettings }: { user: User; onLogout: () => void; onOpenSettings: () => void }) {
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
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
            className="w-full text-left text-sm px-3 py-2"
            style={{
              color: 'var(--color-fg-default)',
              cursor: 'pointer',
              background: 'transparent',
              border: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-canvas-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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

function SettingsFlyout({
  open,
  onClose,
  theme,
  onThemeChange,
}: {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close settings"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.38)',
            border: 'none',
            zIndex: 120,
            cursor: 'pointer',
          }}
        />
      )}
      <aside
        aria-hidden={!open}
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 320,
          maxWidth: '88vw',
          transform: open ? 'translateX(0)' : 'translateX(102%)',
          transition: 'transform 160ms ease',
          background: 'var(--color-canvas-overlay)',
          borderLeft: '1px solid var(--color-border-default)',
          boxShadow: open ? '0 8px 24px rgba(0,0,0,0.2)' : 'none',
          zIndex: 121,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--color-border-muted)' }}
        >
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-fg-default)' }}>
            Settings
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-fg-muted)',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center justify-between rounded px-3 py-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-fg-default)' }}>Theme</span>
            <button
              type="button"
              role="switch"
              aria-label="Theme toggle"
              aria-checked={theme === 'dark'}
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className="relative inline-flex items-center"
              style={{
                width: 108,
                height: 30,
                borderRadius: 999,
                border: '1px solid var(--color-border-default)',
                background: 'transparent',
                cursor: 'pointer',
                padding: 2,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 2,
                  left: theme === 'dark' ? 54 : 2,
                  width: 52,
                  height: 24,
                  borderRadius: 999,
                  background: '#000000',
                  transition: 'left 140ms ease',
                }}
              />
              <span
                aria-hidden="true"
                className="relative z-10 inline-flex w-full text-xs font-medium"
                style={{ color: 'var(--color-fg-default)' }}
              >
                <span
                  className="inline-flex justify-center items-center"
                  style={{ width: 52, color: theme === 'light' ? 'var(--color-fg-on-emphasis)' : 'var(--color-fg-muted)' }}
                >
                  Light
                </span>
                <span
                  className="inline-flex justify-center items-center"
                  style={{ width: 52, color: theme === 'dark' ? 'var(--color-fg-on-emphasis)' : 'var(--color-fg-muted)' }}
                >
                  Dark
                </span>
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = window.localStorage.getItem('char-editor-theme');
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<Section>('characters');
  const [view, setView] = useState<View>('list');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('char-editor-theme', theme);
  }, [theme]);

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
          Character Editor
        </span>
        <UserMenu user={user} onLogout={logout} onOpenSettings={() => setSettingsOpen(true)} />
      </header>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar active={section === 'characters' && view === 'new' ? 'characters-new' : section} onNavigate={(id) => {
            if (id === 'characters-new') {
              setSection('characters');
              setSelectedCharacterId(null);
              setView('new');
            } else {
              setSection(id as Section);
              setView('list');
            }
          }} />
        <main className="flex-1 overflow-y-auto pb-6">
          {section === 'custom-feats' && (
            <CustomFeatsPage />
          )}
          {section === 'initiative-tracker' && (
            <InitiativeTrackerPage />
          )}
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

      <SettingsFlyout
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}

export default App;

