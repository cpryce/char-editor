import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterEditor } from './pages/CharacterEditor';
import { CustomFeatsPage } from './pages/CustomFeatsPage';
import { InitiativeTrackerPage } from './pages/InitiativeTrackerPage';
import './App.css';

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
    <div ref={ref} className="app-user-menu-root">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex items-center gap-2 px-2 py-1 rounded app-user-menu-trigger',
          open ? 'app-user-menu-trigger--open' : '',
        ].join(' ')}
      >
        {user.avatar && (
          <img
            src={user.avatar}
            className="w-7 h-7 rounded-full"
            alt=""
            referrerPolicy="no-referrer"
          />
        )}
        <span className="text-sm app-user-menu-user-text">
          {user.name ?? user.email}
        </span>
        <span className="text-xs app-user-menu-caret">▾</span>
      </button>

      {open && (
        <div className="app-user-menu-dropdown">
          <div className="px-3 py-2 text-xs app-user-menu-email">
            {user.email}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
            className="w-full text-left text-sm px-3 py-2 app-user-menu-action"
          >
            Settings
          </button>
          <div className="app-user-menu-divider">
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full text-left text-sm px-3 py-2 app-user-menu-action app-user-menu-action--danger"
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
          className="app-settings-overlay"
        />
      )}
      <aside
        className={[
          'settings-flyout',
          open ? 'app-settings-flyout--open' : 'app-settings-flyout--closed',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-4 py-3 app-settings-header">
          <h3 className="text-sm font-semibold app-settings-title">
            Settings
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="settings-close-btn text-sm"
          >
            Close
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center justify-between rounded px-3 py-2">
            <span className="settings-theme-label text-sm font-medium">Theme</span>
            {theme === 'dark' ? (
              <button
                type="button"
                role="switch"
                aria-label="Theme toggle"
                aria-checked="true"
                onClick={() => onThemeChange('light')}
                className="relative inline-flex items-center theme-toggle-btn"
              >
                <span
                  aria-hidden="true"
                  className={[
                    'app-theme-toggle-knob',
                    'app-theme-toggle-knob--dark',
                  ].join(' ')}
                />
                <span
                  aria-hidden="true"
                  className="relative z-10 inline-flex w-full text-xs font-medium app-theme-toggle-labels"
                >
                  <span
                    className={[
                      'inline-flex justify-center items-center app-theme-toggle-option',
                      'app-theme-toggle-option--inactive',
                    ].join(' ')}
                  >
                    Light
                  </span>
                  <span
                    className={[
                      'inline-flex justify-center items-center app-theme-toggle-option',
                      'app-theme-toggle-option--active',
                    ].join(' ')}
                  >
                    Dark
                  </span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                role="switch"
                aria-label="Theme toggle"
                aria-checked="false"
                onClick={() => onThemeChange('dark')}
                className="relative inline-flex items-center theme-toggle-btn"
              >
                <span
                  aria-hidden="true"
                  className={[
                    'app-theme-toggle-knob',
                    'app-theme-toggle-knob--light',
                  ].join(' ')}
                />
                <span
                  aria-hidden="true"
                  className="relative z-10 inline-flex w-full text-xs font-medium app-theme-toggle-labels"
                >
                  <span
                    className={[
                      'inline-flex justify-center items-center app-theme-toggle-option',
                      'app-theme-toggle-option--active',
                    ].join(' ')}
                  >
                    Light
                  </span>
                  <span
                    className={[
                      'inline-flex justify-center items-center app-theme-toggle-option',
                      'app-theme-toggle-option--inactive',
                    ].join(' ')}
                  >
                    Dark
                  </span>
                </span>
              </button>
            )}
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
      <main className="flex items-center justify-center h-screen app-loading-main">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-semibold app-loading-title">
            char-editor
          </h1>
          <a
            href="/auth/google"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium app-google-signin"
          >
            Sign in with Google
          </a>
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-col h-screen app-root">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 shrink-0 app-topbar">
        <span className="font-semibold text-base app-topbar-title">
          AD&D (3.5e) Tools
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

