import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ── Status condition icons (monochrome SVG, scale with font-size via 1em) ── */
const ShakenIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
    <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.712c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
  </svg>
);

const DazedIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
    <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
    <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
  </svg>
);

const StunnedIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
    <path d="M11.251.068a.5.5 0 0 1 .227.58L9.677 6.5H13a.5.5 0 0 1 .364.843l-8 8.5a.5.5 0 0 1-.842-.49L6.323 9.5H3a.5.5 0 0 1-.364-.843l8-8.5a.5.5 0 0 1 .615-.09z"/>
  </svg>
);

const UnconsciousIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
    <path d="M2 10.5h5L2 14.5h5"/>
    <path d="M8.5 6.5h4L8.5 11h4"/>
    <path d="M13.5 3h2L13.5 6h2"/>
  </svg>
);

const InvisibleIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
    <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"/>
    <circle cx="8" cy="8" r="2"/>
    <path d="M3 3l10 10"/>
  </svg>
);

const DeadIcon = () => (
  <svg width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
    <path fillRule="evenodd" d="M8 2C5.2 2 3 4.2 3 7c0 2 1.1 3.7 2.8 4.6V14h4.4v-2.4C12 10.7 13 8.9 13 7c0-2.8-2.2-5-5-5z M5.5 6.5 a1 1 0 1 0 2 0 a1 1 0 1 0-2 0 M9.5 6.5 a1 1 0 1 0 2 0 a1 1 0 1 0-2 0"/>
  </svg>
);

function BadgeTooltip({ children, label, desc }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 5px)',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'var(--color-neutral-emphasisPlus, #24292f)',
          color: '#fff',
          borderRadius: '6px',
          padding: '5px 8px',
          fontSize: '11px',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          zIndex: 400,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
        }}>
          <strong style={{ display: 'block', marginBottom: '2px' }}>{label}</strong>
          {desc}
        </span>
      )}
    </span>
  );
}

const STATUSES = [
  { key: 'shaken',      label: 'Shaken',      icon: <ShakenIcon />,      desc: '−2 to attack rolls, saving throws & skill checks', url: 'https://www.d20srd.org/srd/conditionSummary.htm#shaken' },
  { key: 'dazed',       label: 'Dazed',       icon: <DazedIcon />,       desc: 'Can take no actions this round',                    url: 'https://www.d20srd.org/srd/conditionSummary.htm#dazed' },
  { key: 'stunned',     label: 'Stunned',     icon: <StunnedIcon />,     desc: 'Drops held items, loses Dex bonus, flat-footed',    url: 'https://www.d20srd.org/srd/conditionSummary.htm#stunned' },
  { key: 'unconscious', label: 'Unconscious', icon: <UnconsciousIcon />, desc: 'Helpless; −4 effective Dex bonus to AC',             url: 'https://www.d20srd.org/srd/conditionSummary.htm#unconscious' },
  { key: 'invisible',   label: 'Invisible',   icon: <InvisibleIcon />,   desc: '+2 to attack rolls; opponents lose Dex bonus to AC', url: 'https://www.d20srd.org/srd/conditionSummary.htm#invisible' },
  { key: 'dead',        label: 'Dead',        icon: <DeadIcon />,        desc: 'HP ≤ −10 or killed outright by an effect',          url: 'https://www.d20srd.org/srd/conditionSummary.htm#dead' },
];

export function CombatantCard({ combatant, isActiveRound, isSelected, isDeferred, index, onSelect, onDeselect, onUpdate, onDelete, autoFocus }) {
  const nameRef = useRef(null);
  const statusBtnRef = useRef(null);
  const popupRef = useRef(null);
  const cardEl = useRef(null);
  const [showStatus, setShowStatus] = useState(false);
  const [popAbove, setPopAbove] = useState(false);

  useEffect(() => {
    if (autoFocus) nameRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!showStatus || !cardEl.current) return;
    const rect = cardEl.current.getBoundingClientRect();
    setPopAbove(rect.bottom > window.innerHeight * (2 / 3));
  }, [showStatus]);

  useEffect(() => {
    if (!showStatus) return;
    const handler = (e) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target) &&
        statusBtnRef.current && !statusBtnRef.current.contains(e.target)
      ) setShowStatus(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showStatus]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: combatant.id });

  const combinedRef = (node) => { setNodeRef(node); cardEl.current = node; };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const isNPC = combatant.type === 'npc';
  const statuses = combatant.statuses ?? [];

  const accentColor = isNPC ? 'var(--color-attention-fg)' : 'var(--color-accent-fg)';
  const accentBg = isNPC ? 'var(--color-attention-subtle)' : 'var(--color-accent-subtle)';
  const nameColor = isNPC ? '#b06d00' : 'var(--color-fg-default)';

  const toggleStatus = (key) => {
    const next = statuses.includes(key)
      ? statuses.filter((k) => k !== key)
      : [...statuses, key];
    onUpdate({ ...combatant, statuses: next });
  };

  return (
    <div
      ref={combinedRef}
      onClick={(e) => { e.stopPropagation(); if (isSelected) onDeselect?.(); }}
      style={{
        ...style,
        position: 'relative',
        backgroundColor: isActiveRound ? 'var(--color-canvas-inset)' : 'var(--color-canvas-default)',
        border: `1px solid ${isActiveRound ? 'var(--color-border-default)' : 'var(--color-border-default)'}`,
        borderRadius: '8px',
        boxShadow: 'none',
        padding: '4px 6px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        userSelect: 'none',
        marginLeft: isDeferred ? '72px' : '0',
        transition: (style.transition ?? '') + ', margin-left 0.2s ease',
      }}
    >
      {isDeferred && (
        <span style={{
          position: 'absolute',
          right: 'calc(100% + 10px)',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-attention-fg)',
          whiteSpace: 'nowrap',
          opacity: 0.85,
        }}>Holding</span>
      )}

      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        onClick={(e) => { e.stopPropagation(); onSelect(combatant.id); }}
        style={{
          cursor: 'grab',
          color: isSelected ? 'var(--color-accent-fg)' : 'var(--color-fg-subtle)',
          fontSize: '14px', lineHeight: 1, padding: '3px', flexShrink: 0, touchAction: 'none',
          backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'transparent',
          borderRadius: '4px',
          outline: isSelected ? '2px solid var(--color-accent-fg)' : 'none',
          transition: 'color 0.1s, background-color 0.1s',
        }}
        title={isSelected ? 'Selected — use ↑/↓ to move, Esc to deselect' : 'Click to select, then use ↑/↓ to move'}
      >⠿</span>

      {/* Name + inline status badges */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0 }}>
        <input
          ref={nameRef}
          type="text"
          value={combatant.name}
          onChange={(e) => onUpdate({ ...combatant, name: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            border: '1px solid transparent',
            borderRadius: '4px',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: '16pt',
            fontWeight: 500,
            color: nameColor,
            padding: '1px 3px',
            cursor: 'text',
            transition: 'border-color 0.15s',
            minWidth: 0,
            flex: 1,
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent-fg)'; e.target.select(); }}
          onBlur={(e) => e.target.style.borderColor = 'transparent'}
          placeholder="Name"
        />
        {statuses.length > 0 && (
          <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
            {statuses.map((key) => {
              const s = STATUSES.find((s) => s.key === key);
              return s ? (
                <BadgeTooltip key={key} label={s.label} desc={s.desc}>
                  <span style={{ fontSize: '17px', lineHeight: 1, cursor: 'default' }}>{s.icon}</span>
                </BadgeTooltip>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Initiative roll */}
      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
        <span style={{ fontSize: '9px', color: 'var(--color-fg-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Roll</span>
        <input
          type="number"
          value={combatant.initiative}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            onUpdate({ ...combatant, initiative: isNaN(val) ? 1 : Math.min(20, Math.max(1, val)) });
          }}
          tabIndex={index + 1}
          style={{
            width: '36px',
            textAlign: 'center',
            border: '1px solid var(--color-border-default)',
            borderRadius: '6px',
            padding: '3px 2px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-fg-default)',
            backgroundColor: 'var(--color-canvas-subtle)',
          }}
          min="1"
          max="20"
          onFocus={(e) => e.target.select()}
        />
      </label>

      {/* Modifier */}
      <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
        <span style={{ fontSize: '9px', color: 'var(--color-fg-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mod</span>
        <input
          type="number"
          value={combatant.modifier}
          onChange={(e) => onUpdate({ ...combatant, modifier: parseInt(e.target.value, 10) || 0 })}
          style={{
            width: '36px',
            textAlign: 'center',
            border: '1px solid var(--color-border-default)',
            borderRadius: '6px',
            padding: '3px 2px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-fg-default)',
            backgroundColor: 'var(--color-canvas-subtle)',
          }}
          min="-10"
          max="20"
          onFocus={(e) => e.target.select()}
        />
      </label>

      {/* Total */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', color: 'var(--color-fg-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</span>
        <span style={{
          width: '36px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 700,
          color: accentColor,
          backgroundColor: accentBg,
          borderRadius: '6px',
          padding: '3px 2px',
          border: `1px solid ${accentColor}33`,
        }}>
          {Math.max(1, combatant.initiative + combatant.modifier)}
        </span>
      </div>

      {/* Status button */}
      <button
        ref={statusBtnRef}
        title="Set status conditions"
        onClick={() => setShowStatus((v) => !v)}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          fontSize: '13px',
          lineHeight: 1,
          padding: '3px 5px',
          borderRadius: '4px',
          border: '1px solid var(--color-border-muted)',
          cursor: 'pointer',
          backgroundColor: statuses.length > 0 ? 'var(--color-attention-subtle)' : 'transparent',
          color: statuses.length > 0 ? 'var(--color-attention-fg)' : 'var(--color-fg-subtle)',
          flexShrink: 0,
        }}
      >
        ⚑
      </button>

      {/* Status popup */}
      {showStatus && (
        <div
          ref={popupRef}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: popAbove ? 'auto' : 'calc(100% + 6px)',
            bottom: popAbove ? 'calc(100% + 6px)' : 'auto',
            right: '44px',
            zIndex: 200,
            backgroundColor: 'var(--color-canvas-default)',
            border: '1px solid var(--color-border-default)',
            borderRadius: '8px',
            padding: '8px',
            width: '256px',
            boxShadow: 'var(--color-shadow-large, 0 8px 24px rgba(140,149,159,0.2))',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-fg-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px 4px' }}>
            Status Conditions
          </p>
          {STATUSES.map((s) => {
            const active = statuses.includes(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggleStatus(s.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: active ? 'var(--color-attention-subtle)' : 'transparent',
                  marginBottom: '2px',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: active ? 600 : 400, color: active ? 'var(--color-attention-fg)' : 'var(--color-fg-default)' }}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'inherit', textDecoration: 'underline', textDecorationColor: 'var(--color-border-muted)' }}
                    >
                      {s.label}
                    </a>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-fg-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.desc}
                  </div>
                </div>
                {active && <span style={{ fontSize: '12px', color: 'var(--color-attention-fg)', flexShrink: 0 }}>✓</span>}
              </button>
            );
          })}
          {statuses.length > 0 && (
            <button
              onClick={() => onUpdate({ ...combatant, statuses: [] })}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                padding: '6px 8px',
                marginTop: '4px',
                borderTop: '1px solid var(--color-border-muted)',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                borderRadius: 0,
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '11px',
                color: 'var(--color-danger-fg)',
              }}
            >
              Clear all statuses
            </button>
          )}
        </div>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(combatant.id)}
        title="Remove combatant"
        style={{
          color: 'var(--color-danger-fg)',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '3px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >✕</button>
    </div>
  );
}
