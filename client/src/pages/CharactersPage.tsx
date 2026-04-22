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

export function CharactersPage({ onNewCharacter }: CharactersPageProps) {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          className="text-xl font-semibold"
          style={{ color: 'var(--color-fg-default)' }}
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
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
          Loading…
        </p>
      )}

      {error && (
        <p className="text-sm" style={{ color: 'var(--color-danger-fg)' }}>
          {error}
        </p>
      )}

      {!loading && !error && (
        <div
          className="rounded overflow-hidden"
          style={{ border: '1px solid var(--color-border-default)' }}
        >
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ background: 'var(--color-canvas-subtle)' }}>
                {['Name', 'Class', 'Level', 'Last Modified'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 font-medium"
                    style={{
                      color: 'var(--color-fg-muted)',
                      borderBottom: '1px solid var(--color-border-default)',
                    }}
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
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm"
                    style={{ color: 'var(--color-fg-muted)' }}
                  >
                    No characters yet.{' '}
                    <button
                      onClick={onNewCharacter}
                      style={{ color: 'var(--color-accent-fg)', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, font: 'inherit' }}
                    >
                      Create a new character
                    </button>{' '}
                    to get started.
                  </td>
                </tr>
              ) : characters.map((char, i) => (
                <tr
                  key={char._id}
                  style={{
                    background: i % 2 === 0 ? 'var(--color-canvas-default)' : 'var(--color-canvas-subtle)',
                    borderBottom: '1px solid var(--color-border-muted)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'var(--color-accent-subtle)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      i % 2 === 0 ? 'var(--color-canvas-default)' : 'var(--color-canvas-subtle)')
                  }
                >
                  <td
                    className="px-4 py-2 font-medium"
                    style={{ color: 'var(--color-accent-fg)' }}
                  >
                    {char.name}
                  </td>
                  <td className="px-4 py-2" style={{ color: 'var(--color-fg-default)' }}>
                    {classLabel(char.classes)}
                  </td>
                  <td className="px-4 py-2" style={{ color: 'var(--color-fg-default)' }}>
                    {totalLevel(char.classes)}
                  </td>
                  <td className="px-4 py-2" style={{ color: 'var(--color-fg-muted)' }}>
                    {formatDate(char.updatedAt)}
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
