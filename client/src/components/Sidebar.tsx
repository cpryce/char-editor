interface NavItem {
  id: string;
  label: string;
  placeholder?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'characters', label: 'Characters' },
  { id: 'custom-skills', label: 'Custom Skills', placeholder: true },
  { id: 'custom-feats', label: 'Custom Feats', placeholder: true },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
}

export function Sidebar({ active, onNavigate }: SidebarProps) {
  return (
    <nav
      className="flex flex-col w-56 shrink-0 h-full"
      style={{
        background: 'var(--color-canvas-subtle)',
        borderRight: '1px solid var(--color-border-default)',
      }}
    >
      <div
        className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-fg-muted)', borderBottom: '1px solid var(--color-border-default)' }}
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
                className="w-full text-left px-3 py-2 rounded text-sm"
                style={{
                  background: isActive ? 'var(--color-accent-subtle)' : 'transparent',
                  color: item.placeholder
                    ? 'var(--color-fg-subtle)'
                    : isActive
                    ? 'var(--color-accent-fg)'
                    : 'var(--color-fg-default)',
                  cursor: item.placeholder ? 'not-allowed' : 'pointer',
                  fontStyle: item.placeholder ? 'italic' : 'normal',
                  fontWeight: isActive ? 600 : 400,
                }}
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
