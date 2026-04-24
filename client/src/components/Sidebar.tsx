interface NavItem {
  id: string;
  label: string;
  placeholder?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'characters', label: 'Characters' },
  { id: 'custom-skills', label: 'Custom Skills', placeholder: true },
  { id: 'custom-feats', label: 'Custom Feats' },
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
      <div
        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]"
      >
        Menu
      </div>
      <ul className="flex flex-col gap-0.5 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.placeholder && item.id === active;
          return (
            <li key={item.id}>
              <button
                onClick={() => !item.placeholder && onNavigate(item.id)}
                disabled={item.placeholder}
                className={[
                  'w-full text-left px-3 py-2 rounded text-sm',
                  isActive ? 'bg-[var(--color-accent-subtle)] font-semibold text-[color:var(--color-accent-fg)]' : 'bg-transparent font-normal',
                  item.placeholder ? 'text-[color:var(--color-fg-subtle)] cursor-not-allowed italic' : 'text-[color:var(--color-fg-default)] cursor-pointer not-italic',
                  isActive && !item.placeholder ? 'text-[color:var(--color-accent-fg)]' : '',
                ].join(' ')}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
