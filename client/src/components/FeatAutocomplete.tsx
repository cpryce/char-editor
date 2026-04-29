import { useState, useRef, useMemo, useId, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ALL_FEATS, FEAT_BY_NAME } from '../data/feats';
import type { FeatCategory, FeatCatalogEntry } from '../data/feats';
import './FeatAutocomplete.css';

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
  className?: string;
}

// ── Category badge colours ────────────────────────────────────────────────────

const CATEGORY_BADGE: Partial<Record<FeatCategory | 'Custom', { label: string; cls: string }>> = {
  'Fighter Bonus Feat': { label: 'Fighter',      cls: 'feat-option-badge--fighter' },
  'Metamagic':          { label: 'Metamagic',    cls: 'feat-option-badge--metamagic' },
  'Item Creation':      { label: 'Item Creation',cls: 'feat-option-badge--item-creation' },
  'Special':            { label: 'Special',      cls: 'feat-option-badge--special' },
  'Custom':             { label: 'Custom',       cls: 'feat-option-badge--custom' },
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
  className,
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

  // Set aria-expanded imperatively so the linter never sees a JSX boolean expression
  useEffect(() => {
    inputRef.current?.setAttribute('aria-expanded', showDropdown ? 'true' : 'false');
  }, [showDropdown]);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded="false"
        aria-autocomplete="list"
        aria-controls={showDropdown ? listboxId : undefined}
        aria-activedescendant={
          showDropdown && activeIdx >= 0 ? `${listboxId}-opt-${activeIdx}` : undefined
        }
        value={value}
        placeholder={placeholder ?? 'Search feats…'}
        className={`feat-autocomplete-input${className ? ` ${className}` : ''}`}
        onChange={handleChange}
        onFocus={openDropdown}
        onBlur={() => setTimeout(closeDropdown, 120)}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && createPortal(
        <ul
          id={listboxId}
          role="listbox"
          className="feat-dropdown"
          ref={(el) => {
            if (el && dropRect) {
              el.style.setProperty('--dd-top', `${dropRect.top + 2}px`);
              el.style.setProperty('--dd-left', `${dropRect.left}px`);
              el.style.setProperty('--dd-width', `${Math.max(dropRect.width, 300)}px`);
            }
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
                ref={(el) => { el?.setAttribute('aria-selected', isActive ? 'true' : 'false'); }}
                onMouseDown={(e) => { e.preventDefault(); selectFeat(feat); }}
                onMouseEnter={() => setActiveIdx(idx)}
                className={`feat-option${isActive ? ' feat-option--active' : ''}`}
              >
                {/* Row 1: name + badge */}
                <div className="feat-option-header">
                  <span className="feat-option-name">{feat.name}</span>
                  {badge && (
                    <span className={`feat-option-badge ${badge.cls}${isActive ? ' feat-option-badge--active' : ''}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                {/* Row 2: short description */}
                <span className="feat-option-desc">
                  {feat.prerequisites !== '—' && (
                    <span className="feat-option-prereq">Req: {feat.prerequisites} · </span>
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
