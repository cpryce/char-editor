import { useEffect, useState } from 'react';

interface CharacterSummary {
  _id: string;
  name: string;
  classes: ClassEntry[];
  updatedAt: string;
}

interface ClassEntry {
  name: string;
  level: number;
}

interface CharactersPageProps {
  onNewCharacter: () => void;
  onEditCharacter: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function totalLevel(classes: ClassEntry[]) {
  return classes.reduce((sum, c) => sum + c.level, 0);
}

function classLabel(classes: ClassEntry[]) {
  return classes.map((c) => c.name).join(' / ');
}

export function CharactersPage({ onNewCharacter, onEditCharacter }: CharactersPageProps) {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function deleteCharacter(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/characters/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to delete character');
      }
      setCharacters((prev) => prev.filter((char) => char._id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete character');
    }
  }

  useEffect(() => {
    fetch('/api/characters', { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load characters');
        return r.json() as Promise<CharacterSummary[]>;
      })
      .then(setCharacters)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-xl font-semibold text-[color:var(--color-fg-default)]"
        >
          Characters
        </h2>
        <button
          onClick={onNewCharacter}
          className="btn btn-primary"
        >
          + Character
        </button>
      </div>

      {loading && (
        <p className="text-sm text-[color:var(--color-fg-muted)]">
          Loading…
        </p>
      )}

      {error && (
        <p className="text-sm text-[color:var(--color-danger-fg)]">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div
          className="rounded overflow-hidden border border-[var(--color-border-default)]"
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[var(--color-canvas-subtle)]">
                {['Name', 'Class', 'Level', 'Last Modified', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {characters.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-[color:var(--color-fg-muted)]"
                  >
                    No characters yet.{' '}
                    <button
                      type="button"
                      onClick={onNewCharacter}
                      className="text-[color:var(--color-accent-fg)] cursor-pointer underline bg-transparent border-0 p-0 [font:inherit]"
                    >
                      Create a new character
                    </button>{' '}
                    to get started.
                  </td>
                </tr>
              ) : characters.map((char, i) => (
                <tr
                  key={char._id}
                  className={`border-b border-[var(--color-border-muted)] cursor-pointer hover:bg-[var(--color-accent-subtle)] ${i % 2 === 0 ? 'bg-[var(--color-canvas-default)]' : 'bg-[var(--color-canvas-subtle)]'}`}
                  onClick={() => onEditCharacter(char._id)}
                >
                  <td
                    className="px-4 py-2 font-medium"
                  >
                    {char.name}
                  </td>
                  <td className="px-4 py-2 text-[color:var(--color-fg-default)]">
                    {classLabel(char.classes)}
                  </td>
                  <td className="px-4 py-2 text-[color:var(--color-fg-default)]">
                    {totalLevel(char.classes)}
                  </td>
                  <td className="px-4 py-2 text-[color:var(--color-fg-muted)]">
                    {formatDate(char.updatedAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCharacter(char._id);
                      }}
                      title="Delete character"
                      aria-label={`Delete ${char.name}`}
                      className="inline-flex items-center justify-center w-6 h-6 border border-[var(--color-border-default)] rounded text-[color:var(--color-danger-fg)] bg-[var(--color-canvas-default)] cursor-pointer"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 6h18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M8 6V4h8v2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19 6l-1 14H6L5 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
