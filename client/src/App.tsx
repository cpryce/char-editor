import { useEffect, useRef, useState } from 'react';
import { CharactersPage } from './pages/CharactersPage';
import { CharacterEditor } from './pages/CharacterEditor';
import { CustomFeatsPage } from './pages/CustomFeatsPage';
import { InitiativeTrackerPage } from './pages/InitiativeTrackerPage';
import { NameGeneratorPage } from './pages/NameGeneratorPage';
import type { ClassName, Race } from './types/character';
import './App.css';

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

type Section = 'characters' | 'custom-feats' | 'initiative-tracker' | 'name-generator';
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

// ── Nav dropdown ─────────────────────────────────────────────────────────────

interface NavDropdownItem {
  id: string;
  label: string;
  placeholder?: boolean;
}

function NavDropdown({
  label, items, active, onNavigate,
}: {
  label: string;
  items: NavDropdownItem[];
  active: string;
  onNavigate: (id: string) => void;
}) {
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

  const hasActiveItem = items.some((i) => !i.placeholder && i.id === active);

  return (
    <div ref={ref} className="nav-dropdown-root">
      <a
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen((o) => !o)}
        className={[
          'nav-dropdown-trigger',
          hasActiveItem ? 'nav-dropdown-trigger--active' : '',
        ].join(' ')}
      >
        {label}
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"
          className={['nav-dropdown-chevron', open ? 'nav-dropdown-chevron--open' : ''].join(' ')}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      {open && (
        <div role="menu" className="nav-dropdown-menu">
          {items.map((item) => (
            <a
              key={item.id}
              role="menuitem"
              tabIndex={item.placeholder ? -1 : 0}
              aria-disabled={item.placeholder ? 'true' : undefined}
              onClick={() => { if (!item.placeholder) { onNavigate(item.id); setOpen(false); } }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !item.placeholder) { onNavigate(item.id); setOpen(false); } }}
              className={[
                'nav-dropdown-item',
                item.id === active ? 'nav-dropdown-item--active' : '',
                item.placeholder ? 'nav-dropdown-item--disabled' : '',
              ].join(' ')}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings flyout ───────────────────────────────────────────────────────────
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
  const [newCharacterClass, setNewCharacterClass] = useState<ClassName | undefined>(undefined);
  const [newCharacterName, setNewCharacterName] = useState<string | undefined>(undefined);
  const [newCharacterRace, setNewCharacterRace] = useState<Race | undefined>(undefined);
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

  function navigate(id: string) {
    if (id === 'characters-new') {
      setSection('characters');
      setSelectedCharacterId(null);
      setView('new');
    } else {
      setSection(id as Section);
      setSelectedCharacterId(null);
      setView('list');
    }
  }

  const activeNav = section === 'characters' && view === 'new' ? 'characters-new' : section;

  return (
    <div className="flex flex-col h-screen app-root">
      {/* Top bar */}
      <header className="shrink-0 app-topbar">
        <div className="container-xl flex items-center gap-4 h-full px-4">
          <span className="font-semibold text-base app-topbar-title mr-4 flex items-center gap-2">
            <svg fill="currentColor" width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ paddingBottom: '6px' }}>
              <path d="M22.933 24.607h3.972v-1.818c1.232-0.436 2.465-1.219 3.697-2.291-1.236-1.094-2.448-1.703-3.697-1.995v-1.856h-14.575v1.269h-5.549c0.998 2.422 3.198 4.083 5.549 4.636v2.056h3.655c-0.869 2.19-2.502 3.935-4.36 5.44h15.985c-2.216-1.505-3.847-3.248-4.677-5.44zM14.855 15.567l3.076-1.385-1.332-4.39-3.483-3.422-1.996 0.899 1.053 3.473-11.095 4.994 0.783 1.739 11.095-4.995zM22.547 15.462l7.927-3.179-4.418-0.123 2.981-4.286-4.584 2.45 1.34-5.963-4.768 7.585-0.516-2.040-1.886 5.552 3.911-1.833z" />
            </svg>
            AD&amp;D (3.5e) Tools
          </span>

          {/* Primary nav */}
          <nav className="flex items-stretch self-stretch gap-1 flex-1">
            <NavDropdown
              label="Character Editor"
              active={activeNav}
              onNavigate={navigate}
              items={[
                { id: 'characters',     label: 'Characters' },
                { id: 'characters-new', label: '+ New Character' },
                { id: 'custom-feats',   label: 'Custom Feats' },
                { id: 'custom-skills',  label: 'Custom Skills', placeholder: true },
              ]}
            />
            <NavDropdown
              label="Tools"
              active={activeNav}
              onNavigate={navigate}
              items={[
                { id: 'initiative-tracker', label: 'Initiative Tracker' },
                { id: 'name-generator',     label: 'Name Generator' },
              ]}
            />
            <button type="button" disabled className="nav-placeholder-btn">
              Campaigns
            </button>
          </nav>

          <UserMenu user={user} onLogout={logout} onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <div className={section === 'name-generator' || section === 'initiative-tracker' ? 'container-lg' : 'container-xl'}>
          {section === 'custom-feats' && (
            <CustomFeatsPage />
          )}
          {section === 'initiative-tracker' && (
            <InitiativeTrackerPage />
          )}
          {section === 'name-generator' && (
            <NameGeneratorPage
              onCreateCharacter={(name, initialClass, initialRace) => {
                setNewCharacterName(name);
                setNewCharacterClass(initialClass);
                setNewCharacterRace(initialRace);
                setSelectedCharacterId(null);
                setView('new');
                setSection('characters');
              }}
            />
          )}
          {section === 'characters' && view === 'list' && (
            <CharactersPage
              userId={user.id}
              onNewCharacter={(initialClass) => {
                setNewCharacterClass(initialClass);
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
              initialClass={newCharacterClass}
              initialName={newCharacterName}
              initialRace={newCharacterRace}
              onCancel={() => {
                setNewCharacterClass(undefined);
                setNewCharacterName(undefined);
                setNewCharacterRace(undefined);
                setView('list');
              }}
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
        </div>
      </main>

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

