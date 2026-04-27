import { useMemo, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ArmorCatalogEntry } from '../data/armor';

type ArmorAutocompleteProps = {
  value: string;
  entries: ReadonlyArray<ArmorCatalogEntry>;
  onSelect: (name: string, entry?: ArmorCatalogEntry) => void;
  placeholder?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
};

export function ArmorAutocomplete({
  value,
  entries,
  onSelect,
  placeholder,
  ariaLabel,
  style,
}: ArmorAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const matches = useMemo<ArmorCatalogEntry[]>(() => {
    const q = value.trim().toLowerCase();
    if (!q) return entries.slice(0, 14);
    const startsWith: ArmorCatalogEntry[] = [];
    const contains: ArmorCatalogEntry[] = [];
    for (const entry of entries) {
      const name = entry.name.toLowerCase();
      if (name.startsWith(q)) startsWith.push(entry);
      else if (name.includes(q)) contains.push(entry);
    }
    return [...startsWith, ...contains].slice(0, 14);
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

  function selectEntry(entry: ArmorCatalogEntry) {
    onSelect(entry.name, entry);
    closeDropdown();
  }

  function handleChange(nextValue: string) {
    const matched = entries.find((entry) => entry.name.toLowerCase() === nextValue.trim().toLowerCase());
    onSelect(nextValue, matched);
    setActiveIdx(-1);
    if (!open) openDropdown();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIdx((idx) => Math.min(idx + 1, matches.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((idx) => Math.max(idx - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0 && matches[activeIdx]) {
          selectEntry(matches[activeIdx]);
        } else {
          closeDropdown();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        break;
      case 'Tab':
        closeDropdown();
        break;
    }
  }

  const showDropdown = open && matches.length > 0 && dropRect !== null;

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls={showDropdown ? listboxId : undefined}
        aria-activedescendant={showDropdown && activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={openDropdown}
        onBlur={() => setTimeout(closeDropdown, 120)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={style}
      />
      {showDropdown && createPortal(
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: 'fixed',
            top: dropRect.top + 2,
            left: dropRect.left,
            width: Math.max(dropRect.width, 300),
            maxHeight: 280,
            overflowY: 'auto',
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
            zIndex: 9999,
            background: 'var(--color-canvas-overlay, #fff)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            fontSize: 12,
          }}
        >
          {matches.map((entry, idx) => {
            const active = idx === activeIdx;
            return (
              <li
                id={`${listboxId}-opt-${idx}`}
                key={entry.name}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectEntry(entry);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  padding: '8px 10px',
                  cursor: 'pointer',
                  background: active ? 'var(--color-canvas-subtle)' : 'transparent',
                  borderBottom: '1px solid var(--color-border-muted)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8,
                }}
              >
                <span style={{ color: 'var(--color-fg-default)', fontWeight: 500 }}>{entry.name}</span>
                <span style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                  +{entry.armorBonus} {entry.category}
                </span>
              </li>
            );
          })}
        </ul>,
        document.body,
      )}
    </>
  );
}
