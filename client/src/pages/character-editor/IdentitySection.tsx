import type { CharacterDraft } from '../../types/character';
import { RACES, ALIGNMENTS, GENDERS } from '../../types/character';

type IdentityTextField = 'deity' | 'age' | 'height' | 'weight' | 'eyes' | 'hair' | 'skin' | 'languages';

export function IdentitySection({
  draft,
  isEdit,
  nameError,
  inputStyle,
  onNameChange,
  onNameBlur,
  onGenderChange,
  onRaceChange,
  onAlignmentChange,
  onTextFieldChange,
}: {
  draft: CharacterDraft;
  isEdit: boolean;
  nameError?: string;
  inputStyle: React.CSSProperties;
  onNameChange: (value: string) => void;
  onNameBlur: () => void;
  onGenderChange: (value: CharacterDraft['gender']) => void;
  onRaceChange: (value: CharacterDraft['race']) => void;
  onAlignmentChange: (value: CharacterDraft['alignment']) => void;
  onTextFieldChange: (field: IdentityTextField, value: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>
            Name
            <span style={{ color: 'var(--color-danger-fg)', marginLeft: 2 }}>*</span>
          </span>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            placeholder="Character name"
            style={{
              ...inputStyle,
              ...(nameError ? { borderColor: 'var(--color-danger-fg)' } : {}),
            }}
          />
          {nameError && (
            <span className="text-xs mt-0.5" style={{ color: 'var(--color-danger-fg)' }}>{nameError}</span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Gender</span>
          <select value={draft.gender} onChange={(e) => onGenderChange(e.target.value as CharacterDraft['gender'])} style={inputStyle}>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Race</span>
          <select
            value={draft.race}
            onChange={(e) => onRaceChange(e.target.value as CharacterDraft['race'])}
            style={inputStyle}
            disabled={isEdit}
          >
            {RACES.map((race) => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Alignment</span>
          <select value={draft.alignment} onChange={(e) => onAlignmentChange(e.target.value as CharacterDraft['alignment'])} style={inputStyle}>
            {ALIGNMENTS.map((alignment) => (
              <option key={alignment} value={alignment}>{alignment}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Size</span>
          <input
            type="text"
            value={draft.size}
            readOnly
            style={{
              ...inputStyle,
              color: 'var(--color-fg-muted)',
              cursor: 'default',
            }}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Deity</span>
          <input type="text" value={draft.deity} onChange={(e) => onTextFieldChange('deity', e.target.value)} style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Age</span>
          <input type="text" value={draft.age} onChange={(e) => onTextFieldChange('age', e.target.value)} placeholder="e.g. 25" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Height</span>
          <input type="text" value={draft.height} onChange={(e) => onTextFieldChange('height', e.target.value)} placeholder="e.g. 5'10&quot;" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Weight</span>
          <input type="text" value={draft.weight} onChange={(e) => onTextFieldChange('weight', e.target.value)} placeholder="e.g. 180 lbs" style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Eyes</span>
          <input type="text" value={draft.eyes} onChange={(e) => onTextFieldChange('eyes', e.target.value)} style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Hair</span>
          <input type="text" value={draft.hair} onChange={(e) => onTextFieldChange('hair', e.target.value)} style={inputStyle} />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Skin</span>
          <input type="text" value={draft.skin} onChange={(e) => onTextFieldChange('skin', e.target.value)} style={inputStyle} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>Languages (comma-separated)</span>
        <input
          type="text"
          value={draft.languages}
          onChange={(e) => onTextFieldChange('languages', e.target.value)}
          placeholder="Common, Elvish..."
          style={inputStyle}
        />
      </label>
    </>
  );
}