import type { CharacterDraft } from '../../types/character';
import { RACES, ALIGNMENTS, GENDERS } from '../../types/character';
import './IdentitySection.css';

type IdentityTextField = 'deity' | 'age' | 'height' | 'weight' | 'eyes' | 'hair' | 'skin' | 'languages';

export function IdentitySection({
  draft,
  isEdit,
  nameError,
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
          <span className="text-xs font-medium identity-label-text">
            Name
            <span className="identity-required-marker">*</span>
          </span>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            placeholder="Character name"
            className={[
              'identity-input',
              nameError ? 'identity-input--error' : '',
            ].join(' ')}
          />
          {nameError && (
            <span className="text-xs mt-0.5 identity-error">{nameError}</span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Gender</span>
          <select value={draft.gender} onChange={(e) => onGenderChange(e.target.value as CharacterDraft['gender'])} className="identity-input">
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Race</span>
          <select
            value={draft.race}
            onChange={(e) => onRaceChange(e.target.value as CharacterDraft['race'])}
            className="identity-input"
            disabled={isEdit}
          >
            {RACES.map((race) => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Alignment</span>
          <select value={draft.alignment} onChange={(e) => onAlignmentChange(e.target.value as CharacterDraft['alignment'])} className="identity-input">
            {ALIGNMENTS.map((alignment) => (
              <option key={alignment} value={alignment}>{alignment}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Size</span>
          <input
            type="text"
            value={draft.size}
            readOnly
            className="identity-input identity-input--readonly"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Deity</span>
          <input type="text" value={draft.deity} onChange={(e) => onTextFieldChange('deity', e.target.value)} className="identity-input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Age</span>
          <input type="text" value={draft.age} onChange={(e) => onTextFieldChange('age', e.target.value)} placeholder="e.g. 25" className="identity-input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Height</span>
          <input type="text" value={draft.height} onChange={(e) => onTextFieldChange('height', e.target.value)} placeholder="e.g. 5'10&quot;" className="identity-input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Weight</span>
          <input type="text" value={draft.weight} onChange={(e) => onTextFieldChange('weight', e.target.value)} placeholder="e.g. 180 lbs" className="identity-input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Eyes</span>
          <input type="text" value={draft.eyes} onChange={(e) => onTextFieldChange('eyes', e.target.value)} className="identity-input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Hair</span>
          <input type="text" value={draft.hair} onChange={(e) => onTextFieldChange('hair', e.target.value)} className="identity-input" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium identity-label-text">Skin</span>
          <input type="text" value={draft.skin} onChange={(e) => onTextFieldChange('skin', e.target.value)} className="identity-input" />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium identity-label-text">Languages (comma-separated)</span>
        <input
          type="text"
          value={draft.languages}
          onChange={(e) => onTextFieldChange('languages', e.target.value)}
          placeholder="Common, Elvish..."
          className="identity-input"
        />
      </label>
    </>
  );
}