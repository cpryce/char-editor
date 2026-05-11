import { useState, useCallback } from 'react';
import { RACES, GENDERS } from '../types/character';
import type { Race, Gender } from '../types/character';
import { getCorpus } from '../data/nameCorpora';
import { generateNames } from '../utils/nameGenerator';

const GENERATE_COUNT = 12;

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

export function NameGeneratorPage() {
  const [race, setRace] = useState<Race>('Human');
  const [gender, setGender] = useState<Gender>('Male');
  const [names, setNames] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generate = useCallback(() => {
    const corpus = getCorpus(race, gender);
    setNames(generateNames(corpus, GENERATE_COUNT));
    setHasGenerated(true);
    setCopiedIndex(null);
  }, [race, gender]);

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
    <div className="px-4 py-6 max-w-2xl mx-auto">
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
              className="btn btn-default h-8 appearance-none px-3 text-sm min-w-[140px]"
            >
              {RACES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
              Gender
            </span>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <label
                  key={g}
                  className={[
                    'inline-flex items-center gap-1.5 px-3 h-8 rounded border text-sm cursor-pointer select-none',
                    gender === g
                      ? 'font-medium bg-[var(--color-accent-emphasis)] border-[var(--color-accent-emphasis)] text-[color:var(--color-fg-on-emphasis)]'
                      : 'bg-[var(--color-canvas-default)] border-[var(--color-border-default)] text-[color:var(--color-fg-default)]',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="ng-gender"
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="sr-only"
                  />
                  {g}
                </label>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            type="button"
            onClick={generate}
            className="btn btn-primary h-8 px-4 font-semibold flex items-center gap-2 ml-auto"
          >
            <RefreshIcon />
            Generate
          </button>
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
          <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-[color:var(--color-fg-muted)]">
            {gender} {race} names
          </p>
          <ul className="rounded-md border overflow-hidden border-[var(--color-border-default)]">
            {names.map((name, i) => (
              <li
                key={name}
                className={[
                  'flex items-center justify-between px-4 py-2.5 border-b text-sm border-[var(--color-border-muted)]',
                  i % 2 === 0 ? 'bg-[var(--color-canvas-default)]' : 'bg-[var(--color-canvas-subtle)]',
                ].join(' ')}
              >
                <span className="font-medium text-[color:var(--color-fg-default)]">
                  {name}
                </span>
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
              </li>
            ))}
          </ul>
          <p className="text-xs mt-3 text-[color:var(--color-fg-muted)]">
            Click Generate again for a fresh batch.
          </p>
        </div>
      )}
    </div>
  );
}
