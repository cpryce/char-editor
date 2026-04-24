import { useState, useRef, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { ALL_FEATS, FEAT_BY_NAME } from '../data/feats';
import type { FeatCategory, FeatCatalogEntry } from '../data/feats';

export type { FeatCategory, FeatCatalogEntry };

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeatAutocompleteProps {
  value: string;
  onChange: (name: string, shortDescription?: string) => void;
  /**
   * When provided, only feats whose `featTypes` array contains at least one of
   * these categories will be shown. Omit to show all feats.
   */
  allowedCategories?: ReadonlyArray<FeatCategory>;
  /**
   * Names of feats already selected elsewhere on the character sheet.
   * Non-repeatable feats in this set (excluding the current `value`) will be
   * filtered out of the dropdown.
   */
  takenNames?: ReadonlySet<string>;
  /** Additional user-defined feats to include alongside the SRD catalog. */
  extraFeats?: ReadonlyArray<FeatCatalogEntry>;
  placeholder?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

// ── Category badge colours ────────────────────────────────────────────────────

const CATEGORY_BADGE: Partial<Record<FeatCategory | 'Custom', { label: string; color: string }>> = {
  'Fighter Bonus Feat': { label: 'Fighter', color: '#b45309' },
  'Metamagic':          { label: 'Metamagic', color: '#7c3aed' },
  'Item Creation':      { label: 'Item Creation', color: '#0369a1' },
  'Special':            { label: 'Special', color: '#065f46' },
  'Custom':             { label: 'Custom', color: '#be185d' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

// A FeatCatalogEntry extended with an optional custom marker used only for display
interface DisplayFeatEntry extends FeatCatalogEntry {
  _custom?: true;
}

function getBadge(feat: DisplayFeatEntry) {
  if (feat._custom) return CATEGORY_BADGE['Custom']!;
  for (const cat of feat.featTypes) {
    const badge = CATEGORY_BADGE[cat];
    if (badge) return badge;
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

const MAX_RESULTS = 14;

export function FeatAutocomplete({
  value,
  onChange,
  allowedCategories,
  takenNames,
  extraFeats,
  placeholder,
  ariaLabel,
  style,
}: FeatAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [dropRect, setDropRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  // A feat is blocked when it has already been taken by another slot and the
  // SRD does not allow repeated selection.
  function isBlocked(feat: DisplayFeatEntry): boolean {
    if (!takenNames || !takenNames.has(feat.name)) return false;
    if (feat.name === value) return false; // current slot's own value — never blocked
    const entry = FEAT_BY_NAME.get(feat.name);
    return !entry?.repeatable;
  }

  // Filtered result set — re-derived whenever the input value or allowed types change
  const matches = useMemo<DisplayFeatEntry[]>(() => {
    // Build the pool: SRD feats + custom feats (tagged with _custom marker)
    const customPool: DisplayFeatEntry[] = (extraFeats ?? []).map((f) => ({ ...f, _custom: true as const }));
    const allPool: DisplayFeatEntry[] = [...customPool, ...ALL_FEATS];

    const pool = allowedCategories
      ? allPool.filter((f) => allowedCategories.some((c) => f.featTypes.includes(c)))
      : allPool;

    const q = value.trim().toLowerCase();
    let candidates: DisplayFeatEntry[];
    if (!q) {
      candidates = pool;
    } else {
      // Rank: name starts-with > name contains
      const startsWith: DisplayFeatEntry[] = [];
      const contains: DisplayFeatEntry[] = [];
      for (const f of pool) {
        const n = f.name.toLowerCase();
        if (n.startsWith(q)) startsWith.push(f);
        else if (n.includes(q)) contains.push(f);
      }
      candidates = [...startsWith, ...contains];
    }

    // Filter out non-repeatable feats already taken by other slots
    return candidates.filter((f) => !isBlocked(f)).slice(0, MAX_RESULTS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, allowedCategories, takenNames, extraFeats]);

  function openDropdown() {
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) setDropRect({ top: rect.bottom, left: rect.left, width: rect.width });
    setOpen(true);
    setActiveIdx(-1);
  }

  function closeDropdown() {
    setOpen(false);
    setActiveIdx(-1);
  }

  function selectFeat(feat: DisplayFeatEntry) {
    onChange(feat.name, feat.shortDescription);
    closeDropdown();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Free-text edit: pass undefined to clear any previously auto-filled description
    onChange(e.target.value, undefined);
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
        setActiveIdx((i) => Math.min(i + 1, matches.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIdx >= 0 && matches[activeIdx]) {
          selectFeat(matches[activeIdx]);
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
        aria-activedescendant={
          showDropdown && activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined
        }
        value={value}
        placeholder={placeholder ?? 'Search feats…'}
        style={style}
        onChange={handleChange}
        onFocus={openDropdown}
        onBlur={() => setTimeout(closeDropdown, 120)}
        onKeyDown={handleKeyDown}
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
          {matches.map((feat, idx) => {
            const badge = getBadge(feat);
            const isActive = idx === activeIdx;
            return (
              <li
                key={feat.name}
                id={`${listboxId}-opt-${idx}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => { e.preventDefault(); selectFeat(feat); }}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  background: isActive
                    ? 'var(--color-accent-emphasis)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--color-fg-on-emphasis, #fff)'
                    : 'var(--color-fg-default)',
                }}
              >
                {/* Row 1: name + badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600 }}>{feat.name}</span>
                  {badge && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 500,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: isActive ? 'rgba(255,255,255,0.25)' : badge.color + '22',
                      color: isActive ? 'inherit' : badge.color,
                      border: `1px solid ${isActive ? 'rgba(255,255,255,0.4)' : badge.color + '55'}`,
                      whiteSpace: 'nowrap',
                    }}>
                      {badge.label}
                    </span>
                  )}
                </div>
                {/* Row 2: short description */}
                <span style={{
                  opacity: 0.75,
                  fontSize: 11,
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {feat.prerequisites !== '—' && (
                    <span style={{ opacity: 0.85 }}>Req: {feat.prerequisites} · </span>
                  )}
                  {feat.shortDescription}
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
