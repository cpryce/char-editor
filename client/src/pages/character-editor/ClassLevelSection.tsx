import type { CharacterDraft } from '../../types/character';
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { CLASSES, HIT_DIE_BY_CLASS } from '../../types/character';
import { totalCharacterLevel } from '../../utils/characterHelpers';

function NumberInput({
  value, onChange, min = 0, 'aria-label': ariaLabel,
}: { value: number; onChange: (v: number) => void; min?: number; 'aria-label'?: string }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        background: 'var(--color-canvas-default)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 6,
        color: 'var(--color-fg-default)',
        padding: '4px 8px',
        fontSize: 14,
        width: 72,
      }}
    />
  );
}

function LockedBaseClassDisplay({
  label,
  inputStyle,
  width,
}: {
  label: string;
  inputStyle: React.CSSProperties;
  width: string;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <>
      <div
        aria-label="Base class"
        onMouseEnter={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setPos(null)}
        className="inline-flex items-center gap-2"
        style={{
          ...inputStyle,
          width,
          color: 'var(--color-fg-muted)',
          background: 'var(--color-canvas-subtle)',
          cursor: 'help',
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="3" y="11" width="18" height="10" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {label}
      </div>
      {pos !== null && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            top: pos.y + 14,
            left: pos.x + 14,
            zIndex: 9999,
            background: 'var(--color-canvas-overlay, #fff)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--color-fg-default)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          Base class is not editable
        </div>,
        document.body,
      )}
    </>
  );
}

function ClassesSection({
  classes, onChange, isCreate = false, inputStyle,
}: {
  classes: CharacterDraft['classes'];
  onChange: (c: CharacterDraft['classes']) => void;
  isCreate?: boolean;
  inputStyle: React.CSSProperties;
}) {
  const classSelectWidth = `${Math.max('— Select class —'.length, ...CLASSES.map((className) => className.length)) + 2}ch`;

  if (isCreate) {
    const selectedName = classes[0]?.name ?? '';
    function handleClassChange(name: string) {
      if (!name) { onChange([]); return; }
      onChange([{ name, level: 1, hitDieType: HIT_DIE_BY_CLASS[name] ?? 8, hpRolled: [] }]);
    }
    return (
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-3">
          <select
            aria-label="Class"
            value={selectedName}
            onChange={(e) => handleClassChange(e.target.value)}
            style={{ ...inputStyle, width: classSelectWidth }}
          >
            <option value="">— Select class —</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {selectedName && (
            <span className="text-sm" style={{ color: 'var(--color-fg-default)' }}>
              Level 1 &nbsp;·&nbsp; d{HIT_DIE_BY_CLASS[selectedName]} hit die
            </span>
          )}
        </div>
      </div>
    );
  }

  function add() {
    onChange([...classes, { name: '', level: 1, hitDieType: 8, hpRolled: [] }]);
  }

  function remove(i: number) {
    onChange(classes.filter((_, idx) => idx !== i));
  }

  function update(i: number, field: 'name' | 'level', value: string | number) {
    const updated = classes.map((c, idx) => {
      if (idx !== i) return c;
      if (field === 'name') {
        const name = value as string;
        return { ...c, name, hitDieType: HIT_DIE_BY_CLASS[name] ?? 8 };
      }
      return { ...c, level: value as number };
    });
    onChange(updated);
  }

  const usedClassNames = new Set(classes.map((c) => c.name).filter(Boolean));
  const canAddAnotherClass = usedClassNames.size < CLASSES.length;

  return (
    <div className="flex flex-col gap-2">
      {classes.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          {i === 0 ? (
            <LockedBaseClassDisplay
              label={c.name || 'Base class'}
              inputStyle={inputStyle}
              width={classSelectWidth}
            />
          ) : (
            <select
              aria-label={`Multiclass ${i + 1}`}
              value={c.name}
              onChange={(e) => update(i, 'name', e.target.value)}
              style={{ ...inputStyle, width: classSelectWidth }}
              required
            >
              <option value="">— Select class —</option>
              {CLASSES.filter((className) => {
                const usedByAnotherRow = classes.some((existing, idx) => idx !== i && existing.name === className);
                return !usedByAnotherRow;
              }).map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          )}
          <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Lv</span>
          <NumberInput value={c.level} min={1} aria-label={`${c.name || 'Class'} level`} onChange={(v) => update(i, 'level', v)} />
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>{c.name ? `d${c.hitDieType}` : ''}</span>
          {i > 0 && (
            <button
              type="button"
              aria-label={`Remove class row ${i + 1}`}
              title="Remove class"
              onClick={() => remove(i)}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--color-fg-muted)',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                padding: '0 4px',
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={!canAddAnotherClass}
        className="text-xs px-3 py-1 rounded self-start"
        style={{
          border: '1px solid var(--color-border-default)',
          color: canAddAnotherClass ? 'var(--color-fg-default)' : 'var(--color-fg-muted)',
          cursor: canAddAnotherClass ? 'pointer' : 'not-allowed',
          opacity: canAddAnotherClass ? 1 : 0.7,
        }}
      >
        + Add Class
      </button>
      <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
        Character Level: {totalCharacterLevel(classes)}
      </p>
    </div>
  );
}

export function ClassLevelSection({
  classes,
  isEdit,
  hitPoints,
  calculatedCreateHitPoints,
  inputStyle,
  onClassesChange,
  onHitPointsChange,
}: {
  classes: CharacterDraft['classes'];
  isEdit: boolean;
  hitPoints: CharacterDraft['hitPoints'];
  calculatedCreateHitPoints: number;
  inputStyle: React.CSSProperties;
  onClassesChange: (classes: CharacterDraft['classes']) => void;
  onHitPointsChange: (next: CharacterDraft['hitPoints']) => void;
}) {
  return (
    <>
      <ClassesSection
        classes={classes}
        onChange={onClassesChange}
        isCreate={!isEdit}
        inputStyle={inputStyle}
      />
      {isEdit ? (
        <div className="grid grid-cols-3 gap-4 max-w-xl">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Hit Points</span>
            <input
              type="text"
              inputMode="numeric"
              value={String(hitPoints.max)}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D+/g, '');
                const max = digitsOnly === '' ? 0 : Number(digitsOnly);
                onHitPointsChange({
                  ...hitPoints,
                  max,
                  current: max,
                });
              }}
              style={{ ...inputStyle, width: 96 }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Nonlethal</span>
            <NumberInput
              value={hitPoints.nonlethal}
              min={0}
              onChange={(v) => onHitPointsChange({ ...hitPoints, nonlethal: Math.max(0, Math.trunc(v)) })}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 max-w-xl">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Hit Points</span>
            <input
              type="text"
              value={calculatedCreateHitPoints}
              readOnly
              style={{ ...inputStyle, width: 96, color: 'var(--color-fg-muted)', cursor: 'default' }}
            />
          </label>
        </div>
      )}
    </>
  );
}