import { useMemo, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { WeaponCatalogEntry } from '../data/weapons';

type WeaponAutocompleteProps = {
  value: string;
  entries: ReadonlyArray<WeaponCatalogEntry>;
  onSelect: (name: string, entry?: WeaponCatalogEntry) => void;
  placeholder?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
};

export function WeaponAutocomplete({
  value,
  entries,
  onSelect,
  placeholder,
  ariaLabel,
  style,
}: WeaponAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const matches = useMemo<WeaponCatalogEntry[]>(() => {
    const q = value.trim().toLowerCase();
    if (!q) return entries.slice(0, 16);
    const startsWith: WeaponCatalogEntry[] = [];
    const contains: WeaponCatalogEntry[] = [];
    for (const entry of entries) {
      const name = entry.name.toLowerCase();
      if (name.startsWith(q)) startsWith.push(entry);
      else if (name.includes(q)) contains.push(entry);
    }
    return [...startsWith, ...contains].slice(0, 16);
  }, [entries, value]);

  function openDropdown() {
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) {
      setDropRect({ top: rect.bottom, left: rect.left, width: rect.width });
    }
    setOpen(true);
    setActiveIdx(-1);
  }

  function closeDropdown() {
    setOpen(false);
    setActiveIdx(-1);
  }

  function selectEntry(entry: WeaponCatalogEntry) {
    onSelect(entry.name, entry);
    closeDropdown();
  }

  function handleChange(nextValue: string) {
    onSelect(nextValue, undefined);
    if (!open) openDropdown();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { openDropdown(); e.preventDefault(); }
      return;
    }
    if (e.key === 'ArrowDown') {
      setActiveIdx((i) => Math.min(i + 1, matches.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setActiveIdx((i) => Math.max(i - 1, -1));
      e.preventDefault();
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      const entry = matches[activeIdx];
      if (entry) selectEntry(entry);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      closeDropdown();
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        value={value}
        placeholder={placeholder}
        style={style}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={openDropdown}
        onBlur={() => setTimeout(closeDropdown, 150)}
        onKeyDown={handleKeyDown}
      />
      {open && matches.length > 0 && dropRect &&
        createPortal(
          <ul
            id={listboxId}
            role="listbox"
            style={{
              position: 'fixed',
              top: dropRect.top,
              left: dropRect.left,
              width: Math.max(dropRect.width, 260),
              zIndex: 9999,
              background: 'var(--color-canvas-overlay)',
              border: '1px solid var(--color-border-default)',
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
              listStyle: 'none',
              margin: 0,
              padding: '4px 0',
              maxHeight: 320,
              overflowY: 'auto',
            }}
          >
            {matches.map((entry, idx) => (
              <li
                key={entry.name}
                role="option"
                aria-selected={idx === activeIdx}
                onMouseDown={() => selectEntry(entry)}
                style={{
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                  background: idx === activeIdx ? 'var(--color-accent-subtle)' : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <span style={{ color: 'var(--color-fg-default)' }}>{entry.name}</span>
                <span style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                  {entry.proficiency} · {entry.handedness} · {entry.damageMedium}
                </span>
              </li>
            ))}
          </ul>,
          document.body,
        )
      }
    </>
  );
}
