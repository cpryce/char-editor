import { useState, useCallback } from 'react';
import { RACES, GENDERS, CLASSES } from '../types/character';
import type { Race, Gender, ClassName } from '../types/character';
import { getCorpus, getSurnameCorpus } from '../data/nameCorpora';
import { generateNames } from '../utils/nameGenerator';

const GENERATE_COUNT = 6;

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M7.75 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 7.75 2Z" />
    </svg>
  );
}

export function NameGeneratorPage({ onCreateCharacter }: { onCreateCharacter?: (name: string, initialClass?: ClassName, initialRace?: Race) => void } = {}) {
  const [race, setRace] = useState<Race>('Human');
  const [gender, setGender] = useState<Gender>('Male');
  const [includeSurnames, setIncludeSurnames] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassName | undefined>(undefined);
  const [names, setNames] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generate = useCallback(() => {
    const givenCorpus = getCorpus(race, gender);
    if (includeSurnames) {
      const surnameCorpus = getSurnameCorpus(race);
      const givenNames = generateNames(givenCorpus, GENERATE_COUNT);
      const surnames = generateNames(surnameCorpus, GENERATE_COUNT);
      setNames(givenNames.map((given, i) => `${given} ${surnames[i % surnames.length]}`));
    } else {
      setNames(generateNames(givenCorpus, GENERATE_COUNT));
    }
    setHasGenerated(true);
    setCopiedIndex(null);
  }, [race, gender, includeSurnames]);

  async function copyName(name: string, index: number) {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((prev) => (prev === index ? null : prev)), 2000);
    } catch {
      // clipboard unavailable — silent fail
    }
  }

  return (
    <div className="px-4 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[color:var(--color-fg-default)]">
          Fantasy Name Generator
        </h2>
        <p className="text-sm mt-1 text-[color:var(--color-fg-muted)]">
          Procedurally generated names drawn from race-appropriate phoneme patterns.
        </p>
      </div>

      {/* Controls card */}
      <div className="rounded-md border p-4 mb-6 bg-[var(--color-canvas-subtle)] border-[var(--color-border-default)]">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Race */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label
              htmlFor="ng-race"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]"
            >
              Race
            </label>
            <select
              id="ng-race"
              value={race}
              onChange={(e) => setRace(e.target.value as Race)}
              className="h-8 px-3 text-sm min-w-[140px] rounded-md border border-[var(--color-border-default)] bg-white text-slate-900"
            >
              {RACES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label
              htmlFor="ng-gender"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]"
            >
              Gender
            </label>
            <select
              id="ng-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="h-8 px-3 text-sm min-w-[140px] rounded-md border border-[var(--color-border-default)] bg-white text-slate-900"
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Surnames toggle */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
              Surnames
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={includeSurnames}
              aria-label="Toggle surnames"
              onClick={() => setIncludeSurnames((prev) => !prev)}
              className={[
                'relative inline-flex h-8 w-14 items-center rounded-full border px-1 transition-colors duration-200 ease-out',
                includeSurnames
                  ? 'border-[var(--color-btn-primary-bg)] bg-[var(--color-btn-primary-bg)]'
                  : 'border-black bg-[var(--color-fg-subtle)]',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className={[
                  'absolute top-1 h-6 w-6 rounded-full transition-transform duration-200 ease-out',
                  includeSurnames
                    ? 'bg-[var(--color-fg-on-emphasis)]'
                    : 'bg-white',
                  includeSurnames ? 'translate-x-6' : 'translate-x-0',
                ].join(' ')}
              />
            </button>
          </div>

          {/* Class (optional) */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label
              htmlFor="ng-class"
              className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]"
            >
              Class (Optional)
            </label>
            <select
              id="ng-class"
              value={selectedClass ?? ''}
              onChange={(e) => setSelectedClass((e.target.value as ClassName) || undefined)}
              className="h-8 px-3 text-sm min-w-[140px] rounded-md border border-[var(--color-border-default)] bg-white text-slate-900"
            >
              <option value="">None</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end pt-5">
            <button
              type="button"
              onClick={generate}
              className="btn btn-primary h-8 px-4 font-semibold flex items-center gap-2"
            >
              <RefreshIcon />
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {!hasGenerated && (
        <div className="text-sm text-center py-12 rounded-md border border-dashed text-[color:var(--color-fg-muted)] border-[var(--color-border-default)]">
          Choose a race and gender, then click Generate.
        </div>
      )}

      {hasGenerated && names.length > 0 && (
        <div>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
              {gender} {race} {includeSurnames ? 'full names' : 'names'}
            </p>
          </div>
          <ul className="rounded-md border overflow-hidden border-[var(--color-border-default)]">
            {names.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className={[
                  'flex items-center justify-between px-4 py-2.5 border-b text-sm border-[var(--color-border-muted)]',
                  i % 2 === 0 ? 'bg-[var(--color-canvas-default)]' : 'bg-[var(--color-canvas-subtle)]',
                ].join(' ')}
              >
                <span className="font-medium text-[color:var(--color-fg-default)]">
                  {name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyName(name, i)}
                    title="Copy to clipboard"
                    className={[
                      'flex items-center gap-1.5 text-xs px-2 py-1 rounded',
                      copiedIndex === i
                        ? 'text-[color:var(--color-success-fg)]'
                        : 'text-[color:var(--color-fg-muted)]',
                    ].join(' ')}
                  >
                    <CopyIcon />
                    {copiedIndex === i ? 'Copied!' : 'Copy'}
                  </button>
                  {onCreateCharacter && (
                    <button
                      type="button"
                      disabled={!selectedClass}
                      onClick={() => onCreateCharacter(name, selectedClass || undefined, race)}
                      className={[
                        'flex items-center gap-1.5 text-xs px-2 py-1 rounded',
                        selectedClass
                          ? 'text-[color:var(--color-fg-muted)] cursor-pointer'
                          : 'text-[color:var(--color-fg-subtle)] cursor-not-allowed opacity-50',
                      ].join(' ')}
                    >
                      <PlusIcon />
                      Create
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={generate}
              aria-label="Re-generate names"
              title="Re-generate names"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[var(--color-border-default)] text-[color:var(--color-fg-muted)] hover:bg-[var(--color-canvas-subtle)]"
            >
              <RefreshIcon />
            </button>
          </div>
          <p className="text-xs mt-3 text-[color:var(--color-fg-muted)]">
            Click Generate again for a fresh batch.
          </p>
        </div>
      )}
    </div>
  );
}
