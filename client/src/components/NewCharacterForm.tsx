import { useEffect, useState } from 'react';
import { CLASSES, HIT_DIE_BY_CLASS } from '../types/character';
import '../pages/CampaignEditor.css';

interface CustomClassSummary {
  _id: string;
  name: string;
  hitDice: number;
}

interface ClassItem {
  name: string;
  hitDie: number;
}

export interface NewCharacterFormProps {
  onCreate: (name: string, className: string, hitDie: number) => Promise<void> | void;
  creating?: boolean;
}

export function NewCharacterForm({ onCreate, creating = false }: NewCharacterFormProps) {
  const [name, setName] = useState('');
  const [classQuery, setClassQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [allClasses, setAllClasses] = useState<ClassItem[]>(() =>
    [...CLASSES]
      .sort()
      .map((c) => ({ name: c, hitDie: HIT_DIE_BY_CLASS[c] ?? 8 })),
  );

  useEffect(() => {
    fetch('/api/custom-classes', { credentials: 'include' })
      .then((r) => r.json())
      .then((customs: CustomClassSummary[]) => {
        const builtInNames = new Set<string>(CLASSES);
        const customItems: ClassItem[] = customs
          .filter((c) => !builtInNames.has(c.name))
          .map((c) => ({ name: c.name, hitDie: c.hitDice }));
        setAllClasses(
          [...CLASSES.map((c) => ({ name: c, hitDie: HIT_DIE_BY_CLASS[c] ?? 8 })), ...customItems].sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        );
      })
      .catch(() => {});
  }, []);

  const filteredClasses = classQuery.trim()
    ? allClasses.filter((c) => c.name.toLowerCase().includes(classQuery.trim().toLowerCase()))
    : allClasses;

  function selectClass(cls: ClassItem) {
    setSelectedClass(cls.name);
    setClassQuery(cls.name);
  }

  function handleQueryChange(value: string) {
    setClassQuery(value);
    setSelectedClass(null);
  }

  async function handleCreate() {
    if (!effectiveSelected || submitting || creating) return;
    const hitDie = allClasses.find((c) => c.name === effectiveSelected)?.hitDie ?? 8;
    setSubmitting(true);
    try {
      await Promise.resolve(onCreate(name.trim(), effectiveSelected, hitDie));
    } finally {
      setSubmitting(false);
    }
  }

  const effectiveSelected =
    selectedClass ??
    (classQuery.trim() && filteredClasses.length === 1 ? filteredClasses[0].name : null);

  const isDisabled = submitting || creating || !effectiveSelected;

  return (
    <>
      {/* Optional name */}
      <div style={{ padding: '10px 12px 6px' }}>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !isDisabled) void handleCreate(); }}
          placeholder="Character name (optional)"
          className="char-new-name-input"
        />
      </div>

      {/* Class typeahead */}
      <div style={{ padding: '4px 12px 6px', borderTop: '1px solid var(--color-border-muted)' }}>
        <input
          type="text"
          value={classQuery}
          onChange={(e) => handleQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (!isDisabled) void handleCreate();
              else if (filteredClasses.length === 1) selectClass(filteredClasses[0]);
            }
          }}
          placeholder="Search class…"
          className="char-new-name-input"
          style={{ marginBottom: 4 }}
        />
        <div style={{ maxHeight: 180, overflowY: 'auto', margin: '0 -4px' }}>
          {filteredClasses.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-fg-muted)', padding: '6px 10px' }}>No matches</p>
          ) : (
            filteredClasses.map((cls) => (
              <label
                key={cls.name}
                className={`char-new-class-row${effectiveSelected === cls.name ? ' char-new-class-row--selected' : ''}`}
                onClick={() => selectClass(cls)}
              >
                <span>{cls.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="campaign-picker-footer">
        <button
          type="button"
          className="campaign-picker-add-btn"
          disabled={isDisabled}
          onClick={() => void handleCreate()}
        >
          Create character
        </button>
      </div>
    </>
  );
}
