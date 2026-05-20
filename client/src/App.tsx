import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { Race } from './types/character';
import type { PointBuySystem } from './utils/characterHelpers';
import './App.css';

const CharactersPage = lazy(() => import('./pages/CharactersPage').then((module) => ({ default: module.CharactersPage })));
const CharacterEditor = lazy(() => import('./pages/CharacterEditor').then((module) => ({ default: module.CharacterEditor })));
const CustomFeatsPage = lazy(() => import('./pages/CustomFeatsPage').then((module) => ({ default: module.CustomFeatsPage })));
const InitiativeTrackerPage = lazy(() => import('./pages/InitiativeTrackerPage').then((module) => ({ default: module.InitiativeTrackerPage })));
const NameGeneratorPage = lazy(() => import('./pages/NameGeneratorPage').then((module) => ({ default: module.NameGeneratorPage })));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage').then((module) => ({ default: module.CampaignsPage })));
const CampaignEditor = lazy(() => import('./pages/CampaignEditor').then((module) => ({ default: module.CampaignEditor })));
const CustomClassesPage = lazy(() => import('./pages/CustomClassesPage').then((module) => ({ default: module.CustomClassesPage })));
const InvitePage = lazy(() => import('./pages/InvitePage').then((module) => ({ default: module.InvitePage })));
const DiceRollerPage = lazy(() => import('./pages/DiceRollerPage').then((module) => ({ default: module.DiceRollerPage })));

interface User {
  id: string;
  name?: string;
  email: string;
  avatar?: string;
}

type Section = 'characters' | 'custom-feats' | 'custom-classes' | 'initiative-tracker' | 'dice-roller' | 'name-generator' | 'campaigns';
type View = 'list' | 'new' | 'edit';
type Theme = 'light' | 'dark';

// ── User dropdown ────────────────────────────────────────────────────────────

function UserMenu({ user, onLogout, onOpenSettings }: { user: User; onLogout: () => void; onOpenSettings: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fallbackInitial = (user.name ?? user.email).trim().charAt(0).toUpperCase() || 'U';

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
          'flex items-center gap-1.5 px-2 py-1 rounded app-user-menu-trigger',
          open ? 'app-user-menu-trigger--open' : '',
        ].join(' ')}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            className="w-7 h-7 rounded-full"
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="app-user-menu-fallback-avatar" aria-hidden="true">
            {fallbackInitial}
          </span>
        )}
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

// ── Mobile nav menu ──────────────────────────────────────────────────────────

interface NavGroup {
  label: string;
  items: NavDropdownItem[];
}

function MobileNavMenu({
  groups,
  active,
  onNavigate,
}: {
  groups: NavGroup[];
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

  return (
    <div ref={ref} className="mobile-nav-root">
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mobile-nav-trigger"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="mobile-nav-menu">
          {groups.map((group) => (
            <div key={group.label} className="mobile-nav-group">
              <div className="mobile-nav-group-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  tabIndex={item.placeholder ? -1 : 0}
                  aria-disabled={item.placeholder}
                  onClick={() => {
                    if (!item.placeholder) {
                      onNavigate(item.id);
                      setOpen(false);
                    }
                  }}
                  className={[
                    'mobile-nav-item',
                    item.id === active ? 'mobile-nav-item--active' : '',
                    item.placeholder ? 'mobile-nav-item--disabled' : '',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
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
      </button>

      {open && (
        <div role="menu" className="nav-dropdown-menu">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              tabIndex={item.placeholder ? -1 : 0}
              aria-disabled={item.placeholder}
              onClick={() => { if (!item.placeholder) { onNavigate(item.id); setOpen(false); } }}
              className={[
                'nav-dropdown-item',
                item.id === active ? 'nav-dropdown-item--active' : '',
                item.placeholder ? 'nav-dropdown-item--disabled' : '',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Settings flyout ───────────────────────────────────────────────────────────
const POINT_BUY_LABELS: Record<PointBuySystem, string> = {
  adnd28: '28-point',
  adnd32: '32-point',
  pathfinder10: 'Low Fantasy (10-point)',
  pathfinder15: 'Standard Fantasy (15-point)',
  pathfinder20: 'High Fantasy (20-point)',
  pathfinder25: 'Epic Fantasy (25-point)',
};

function loadGlobalPointBuySystem(): PointBuySystem {
  const raw = window.localStorage.getItem('char-editor-point-buy');
  if (
    raw === 'adnd28' || raw === 'adnd32' ||
    raw === 'pathfinder10' || raw === 'pathfinder15' ||
    raw === 'pathfinder20' || raw === 'pathfinder25'
  ) return raw;
  // Migrate old 'pathfinder' value
  if (raw === 'pathfinder') return 'pathfinder15';
  return 'adnd28';
}

function SettingsFlyout({
  open,
  onClose,
  theme,
  onThemeChange,
  pointBuySystem,
  onPointBuySystemChange,
}: {
  open: boolean;
  onClose: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  pointBuySystem: PointBuySystem;
  onPointBuySystemChange: (system: PointBuySystem) => void;
}) {
  const [showPointBuyDropdown, setShowPointBuyDropdown] = useState(false);
  const pointBuyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPointBuyDropdown) return;
    function handleMouseDown(e: MouseEvent) {
      if (pointBuyDropdownRef.current && !pointBuyDropdownRef.current.contains(e.target as Node)) {
        setShowPointBuyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showPointBuyDropdown]);

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
                aria-checked={true}
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
                aria-checked={false}
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

        <div className="px-4 pb-4">
          <div className="px-3 py-2">
            <h3 className="settings-rules-header">Rules</h3>
            <p className="settings-field-label">Point Buy System</p>
            <div className="point-buy-dropdown-wrap" ref={pointBuyDropdownRef}>
              <button
                type="button"
                className="point-buy-trigger"
                onClick={() => setShowPointBuyDropdown((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={showPointBuyDropdown}
              >
                <span>{POINT_BUY_LABELS[pointBuySystem]}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showPointBuyDropdown && (
                <ul className="point-buy-menu" role="listbox">
                  <li className="point-buy-menu__group" aria-disabled="true">AD&amp;D Standard</li>
                  {(['adnd28', 'adnd32'] as PointBuySystem[]).map((sys) => (
                    <li key={sys} role="option" aria-selected={pointBuySystem === sys}>
                      <a href="#" onClick={(e) => { e.preventDefault(); onPointBuySystemChange(sys); setShowPointBuyDropdown(false); }}
                        className={pointBuySystem === sys ? 'point-buy-menu__item--active' : ''}>
                        {POINT_BUY_LABELS[sys]}
                      </a>
                    </li>
                  ))}
                  <li className="point-buy-menu__group" aria-disabled="true">Pathfinder</li>
                  {(['pathfinder10', 'pathfinder15', 'pathfinder20', 'pathfinder25'] as PointBuySystem[]).map((sys) => (
                    <li key={sys} role="option" aria-selected={pointBuySystem === sys}>
                      <a href="#" onClick={(e) => { e.preventDefault(); onPointBuySystemChange(sys); setShowPointBuyDropdown(false); }}
                        className={pointBuySystem === sys ? 'point-buy-menu__item--active' : ''}>
                        {POINT_BUY_LABELS[sys]}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
  // Tracks whether the current URL is an /invite/:token path. Stored as state so
  // setting it to false in onAccepted guarantees a re-render (setSection/setView
  // are no-ops when already at their defaults, which skips the render and leaves
  // InvitePage on screen even after the URL has been changed to '/').
  const [showingInvite, setShowingInvite] = useState(
    () => /^\/invite\/[a-f0-9]+$/.test(window.location.pathname),
  );
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [initiativeSessionId, setInitiativeSessionId] = useState<string | null>(null);
  const [characterReturnCampaignId, setCharacterReturnCampaignId] = useState<string | null>(null);
  const [newCharacterClass, setNewCharacterClass] = useState<string | undefined>(undefined);
  const [newCharacterName, setNewCharacterName] = useState<string | undefined>(undefined);
  const [newCharacterRace, setNewCharacterRace] = useState<Race | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [globalPointBuySystem, setGlobalPointBuySystem] = useState<PointBuySystem>(() => loadGlobalPointBuySystem());
  const [campaignPointBuySystem, setCampaignPointBuySystem] = useState<PointBuySystem | null>(null);
  const effectivePointBuySystem = campaignPointBuySystem ?? globalPointBuySystem;

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

  // Handle /invite/:token before auth check — InvitePage handles its own 401 redirect
  const inviteMatch = showingInvite
    ? window.location.pathname.match(/^\/invite\/([a-f0-9]+)$/)
    : null;
  if (inviteMatch) {
    const token = inviteMatch[1];
    return (
      <Suspense fallback={null}>
        <InvitePage
          token={token}
          onAccepted={() => {
            window.history.replaceState(null, '', '/');
            setShowingInvite(false); // guaranteed state change → triggers re-render
          }}
        />
      </Suspense>
    );
  }

  if (!user) {
    return (
      <main className="flex items-center justify-center h-screen app-loading-main">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-3xl font-semibold app-loading-title">
            AD&D (3.5e) Tools
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
    if (id !== 'initiative-tracker') setInitiativeSessionId(null);
    setSection(id as Section);
    setSelectedCharacterId(null);
    setView('list');
  }

  const activeNav = section;
  const navGroups: NavGroup[] = [
    {
      label: 'Character Editor',
      items: [
        { id: 'characters', label: 'Characters' },
        { id: 'custom-classes', label: 'Custom Classes' },
        { id: 'custom-feats', label: 'Custom Feats' },
        { id: 'custom-skills', label: 'Custom Skills', placeholder: true },
      ],
    },
    {
      label: 'Tools',
      items: [
        { id: 'initiative-tracker', label: 'Initiative Tracker' },
        { id: 'name-generator', label: 'Name Generator' },
        { id: 'dice-roller', label: 'Dice Roller' },
      ],
    },
    {
      label: 'Campaigns',
      items: [{ id: 'campaigns', label: 'Campaigns' }],
    },
  ];

  return (
    <div className="flex flex-col h-screen app-root">
      {/* Top bar */}
      <header className="shrink-0 app-topbar">
        <div className="container-xl flex items-center gap-2 h-full px-3 sm:px-4">
          <MobileNavMenu groups={navGroups} active={activeNav} onNavigate={navigate} />

          <span className="app-topbar-brand" aria-label="Application home">
            <svg fill="currentColor" width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="pb-1.5">
              <path d="M22.933 24.607h3.972v-1.818c1.232-0.436 2.465-1.219 3.697-2.291-1.236-1.094-2.448-1.703-3.697-1.995v-1.856h-14.575v1.269h-5.549c0.998 2.422 3.198 4.083 5.549 4.636v2.056h3.655c-0.869 2.19-2.502 3.935-4.36 5.44h15.985c-2.216-1.505-3.847-3.248-4.677-5.44zM14.855 15.567l3.076-1.385-1.332-4.39-3.483-3.422-1.996 0.899 1.053 3.473-11.095 4.994 0.783 1.739 11.095-4.995zM22.547 15.462l7.927-3.179-4.418-0.123 2.981-4.286-4.584 2.45 1.34-5.963-4.768 7.585-0.516-2.040-1.886 5.552 3.911-1.833z" />
            </svg>
            <span className="app-topbar-title hidden md:inline">AD&amp;D (3.5e) Tools</span>
          </span>

          {/* Primary nav */}
          <nav className="app-topbar-primary-nav flex items-stretch self-stretch gap-1 flex-1">
            <NavDropdown
              label="Character Editor"
              active={activeNav}
              onNavigate={navigate}
              items={navGroups[0].items}
            />
            <NavDropdown
              label="Tools"
              active={activeNav}
              onNavigate={navigate}
              items={navGroups[1].items}
            />
            <NavDropdown
              label="Campaigns"
              active={activeNav}
              onNavigate={navigate}
              items={navGroups[2].items}
            />
          </nav>

          <UserMenu user={user} onLogout={logout} onOpenSettings={() => setSettingsOpen(true)} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        <Suspense
          fallback={(
            <div className="container-xl">
              <p className="text-sm text-[color:var(--color-fg-muted)]">
                Loading…
              </p>
            </div>
          )}
        >
          <div className="container-xl">
            {section === 'custom-feats' && (
              <CustomFeatsPage />
            )}
            {section === 'custom-classes' && (
              <CustomClassesPage />
            )}
            {section === 'initiative-tracker' && (
              <InitiativeTrackerPage initialSessionId={initiativeSessionId ?? undefined} />
            )}
            {section === 'dice-roller' && (
              <DiceRollerPage />
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
            {section === 'campaigns' && view === 'list' && (
              <CampaignsPage
                onEditCampaign={(id) => {
                  setSelectedCampaignId(id);
                  setView('edit');
                }}
              />
            )}
            {section === 'campaigns' && view === 'edit' && selectedCampaignId && (
              <CampaignEditor
                campaignId={selectedCampaignId}
                userId={user.id}
                onBack={() => {
                  setSelectedCampaignId(null);
                  setCampaignPointBuySystem(null);
                  setView('list');
                }}
                onStartEncounter={(sessionId) => {
                  setInitiativeSessionId(sessionId);
                  setSection('initiative-tracker');
                  setView('list');
                }}
                onEditCharacter={(id) => {
                  setSelectedCharacterId(id);
                  setCharacterReturnCampaignId(selectedCampaignId);
                  setSection('characters');
                  setView('edit');
                }}
                onPointBuySystemChange={setCampaignPointBuySystem}
              />
            )}
            {section === 'characters' && view === 'list' && (
              <CharactersPage
                userId={user.id}
                onNewCharacter={(initialClass, initialName) => {
                  setNewCharacterClass(initialClass);
                  setNewCharacterName(initialName);
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
                pointBuySystem={effectivePointBuySystem}
              />
            )}
            {section === 'characters' && view === 'edit' && selectedCharacterId && (
              <CharacterEditor
                characterId={selectedCharacterId}
                onCancel={() => {
                  setSelectedCharacterId(null);
                  if (characterReturnCampaignId) {
                    setSelectedCampaignId(characterReturnCampaignId);
                    setCharacterReturnCampaignId(null);
                    setSection('campaigns');
                    setView('edit');
                  } else {
                    setView('list');
                  }
                }}
                pointBuySystem={effectivePointBuySystem}
              />
            )}
          </div>
        </Suspense>
      </main>

      <SettingsFlyout
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        pointBuySystem={globalPointBuySystem}
        onPointBuySystemChange={(s) => {
          setGlobalPointBuySystem(s);
          window.localStorage.setItem('char-editor-point-buy', s);
        }}
      />
    </div>
  );
}

export default App;

