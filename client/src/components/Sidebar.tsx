interface NavItem {
  id: string;
  label: string;
  placeholder?: boolean;
  sub?: boolean;
}

interface NavSection {
  /** If set, the section heading itself is a nav item with this id. */
  id?: string;
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Characters',
    items: [
      { id: 'characters', label: 'List', sub: true },
      { id: 'characters-new', label: '+ New', sub: true },
      { id: 'custom-feats', label: 'Custom Feats', sub: true },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'initiative-tracker', label: 'Initiative Tracker', sub: true },
    ],
  },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <nav
      className="flex flex-col w-56 shrink-0 h-full bg-[var(--color-canvas-subtle)] border-r border-[var(--color-border-default)]"
    >
      {NAV_SECTIONS.map((section) => {
        const headingIsActive = section.id !== undefined && section.id === active;
        return (
          <div key={section.label} className="border-b border-[var(--color-border-default)]">
            {section.id ? (
              <button
                onClick={() => onNavigate(section.id!)}
                className={[
                  'w-full text-left px-3 py-2 text-xs font-semibold uppercase tracking-wider',
                  headingIsActive
                    ? 'bg-gray-400/40 text-[color:var(--color-fg-default)]'
                    : 'text-[color:var(--color-fg-muted)] cursor-pointer',
                ].join(' ')}
              >
                {section.label}
              </button>
            ) : (
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-fg-muted)]">
                {section.label}
              </div>
            )}
            <ul className="flex flex-col">
              {section.items.map((item) => {
                const isActive = !item.placeholder && item.id === active;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => !item.placeholder && onNavigate(item.id)}
                      disabled={item.placeholder}
                      className={[
                        'w-full text-left py-1.5 text-xs font-semibold uppercase tracking-wider',
                        item.sub ? 'pl-6 pr-3' : 'px-3',
                        isActive
                          ? 'bg-gray-400/40 text-[color:var(--color-fg-default)]'
                          : 'bg-transparent',
                        item.placeholder
                          ? 'text-[color:var(--color-fg-subtle)] cursor-not-allowed italic'
                          : 'text-[color:var(--color-fg-muted)] cursor-pointer not-italic',
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
