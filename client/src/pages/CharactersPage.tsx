import { useEffect, useRef, useState } from 'react';
import { CLASSES } from '../types/character';
import type { ClassName } from '../types/character';

interface CharacterSummary {
  _id: string;
  name: string;
  race: string;
  classes: ClassEntry[];
  updatedAt: string;
}

interface ClassEntry {
  name: string;
  level: number;
}

interface CharactersPageProps {
  userId: string;
  onNewCharacter: (initialClass?: ClassName) => void;
  onEditCharacter: (id: string) => void;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';

  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' });

  if (elapsedSeconds < 60) return '1 minute ago';
  if (elapsedSeconds < 60 * 60) return rtf.format(-Math.floor(elapsedSeconds / 60), 'minute');
  if (elapsedSeconds < 60 * 60 * 24) return rtf.format(-Math.floor(elapsedSeconds / (60 * 60)), 'hour');
  if (elapsedSeconds < 60 * 60 * 24 * 7) return rtf.format(-Math.floor(elapsedSeconds / (60 * 60 * 24)), 'day');
  if (elapsedSeconds < 60 * 60 * 24 * 30) return rtf.format(-Math.floor(elapsedSeconds / (60 * 60 * 24 * 7)), 'week');
  if (elapsedSeconds < 60 * 60 * 24 * 365) return rtf.format(-Math.floor(elapsedSeconds / (60 * 60 * 24 * 30)), 'month');
  return rtf.format(-Math.floor(elapsedSeconds / (60 * 60 * 24 * 365)), 'year');
}

function totalLevel(classes: ClassEntry[]) {
  return classes.reduce((sum, c) => sum + c.level, 0);
}

function classLabel(classes: ClassEntry[]) {
  return classes.map((c) => c.name).join(' / ');
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, null] as const;
type PageSize = 5 | 10 | 25 | null; // null = All

function loadPageSize(userId: string): PageSize {
  try {
    const raw = localStorage.getItem(`char-editor-prefs:${userId}`);
    if (!raw) return 5;
    const val = JSON.parse(raw)?.pageSize;
    if (val === null) return null;
    if (val === 5 || val === 10 || val === 25) return val;
  } catch { /* ignore */ }
  return 5;
}

function savePageSize(userId: string, size: PageSize) {
  try {
    const existing = JSON.parse(localStorage.getItem(`char-editor-prefs:${userId}`) ?? '{}');
    localStorage.setItem(`char-editor-prefs:${userId}`, JSON.stringify({ ...existing, pageSize: size }));
  } catch { /* ignore */ }
}

type SortKey = 'name' | 'race' | 'class' | 'level' | 'updatedAt';
type SortDir = 'asc' | 'desc';

function loadSort(userId: string): { key: SortKey; dir: SortDir } {
  try {
    const prefs = JSON.parse(localStorage.getItem(`char-editor-prefs:${userId}`) ?? '{}');
    const key = prefs?.sortKey;
    const dir = prefs?.sortDir;
    if ((['name', 'race', 'class', 'level', 'updatedAt'] as const).includes(key) &&
        (dir === 'asc' || dir === 'desc')) {
      return { key, dir };
    }
  } catch { /* ignore */ }
  return { key: 'updatedAt', dir: 'desc' };
}

function saveSort(userId: string, key: SortKey, dir: SortDir) {
  try {
    const existing = JSON.parse(localStorage.getItem(`char-editor-prefs:${userId}`) ?? '{}');
    localStorage.setItem(`char-editor-prefs:${userId}`, JSON.stringify({ ...existing, sortKey: key, sortDir: dir }));
  } catch { /* ignore */ }
}

export function CharactersPage({ userId, onNewCharacter, onEditCharacter }: CharactersPageProps) {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>(() => loadSort(userId).key);
  const [sortDir, setSortDir] = useState<SortDir>(() => loadSort(userId).dir);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(() => loadPageSize(userId));
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [raceFilter, setRaceFilter] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [newDropdownOpen, setNewDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newRef = useRef<HTMLDivElement>(null);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      const nextDir: SortDir = sortDir === 'asc' ? 'desc' : 'asc';
      setSortDir(nextDir);
      saveSort(userId, key, nextDir);
    } else {
      setSortKey(key);
      setSortDir('asc');
      saveSort(userId, key, 'asc');
    }
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value.length >= 3 ? value : '');
      setPage(1);
    }, 250);
  }

  const allClasses = [...new Set(characters.flatMap((c) => c.classes.map((cl) => cl.name)))].sort();
  const allRaces = [...new Set(characters.map((c) => c.race))].sort();

  const filtered = characters.filter((char) => {
    const matchesSearch = !searchQuery || char.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRace = !raceFilter || char.race === raceFilter;
    const matchesClass = !classFilter || char.classes.some((c) => c.name === classFilter);
    return matchesSearch && matchesRace && matchesClass;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name')      cmp = a.name.localeCompare(b.name);
    if (sortKey === 'race')      cmp = a.race.localeCompare(b.race);
    if (sortKey === 'class')     cmp = classLabel(a.classes).localeCompare(classLabel(b.classes));
    if (sortKey === 'level')     cmp = totalLevel(a.classes) - totalLevel(b.classes);
    if (sortKey === 'updatedAt') cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = pageSize !== null ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const paginated = pageSize !== null
    ? sorted.slice((safePage - 1) * pageSize, safePage * pageSize)
    : sorted;

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
    if (!newDropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (newRef.current && !newRef.current.contains(e.target as Node)) {
        setNewDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [newDropdownOpen]);

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
        <div className="flex items-center gap-2">
          {/* Search by name */}
          <div className="relative flex items-center">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name…"
              aria-label="Search characters by name"
              className="pl-3 pr-7 py-[0.375rem] text-sm rounded border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)] placeholder:text-[color:var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-accent-fg)] w-44"
            />
            <svg className="absolute right-2 text-[color:var(--color-fg-muted)] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Race filter select */}
          <div className="relative flex items-center">
            <svg className="absolute left-2 pointer-events-none text-[color:var(--color-fg-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 12.5c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M5 19c1.7-3 4.1-4.5 7-4.5s5.3 1.5 7 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <select
              aria-label="Filter by race"
              value={raceFilter ?? ''}
              onChange={(e) => { setRaceFilter(e.target.value || null); setPage(1); }}
              className={`appearance-none h-8 pl-7 pr-6 text-sm leading-none rounded border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] cursor-pointer ${raceFilter ? 'text-[color:var(--color-accent-fg)]' : 'text-[color:var(--color-fg-default)]'}`}
            >
              <option value="">All races</option>
              {allRaces.map((race) => (
                <option key={race} value={race}>{race}</option>
              ))}
            </select>
            <svg className="absolute right-1.5 pointer-events-none text-[color:var(--color-fg-muted)]" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Class filter select */}
          <div className="relative flex items-center">
            <svg className="absolute left-2 pointer-events-none text-[color:var(--color-fg-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 4h18l-7 9v6l-4-2v-4L3 4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill={classFilter ? 'currentColor' : 'none'} className={classFilter ? 'text-[color:var(--color-accent-fg)]' : ''}/>
            </svg>
            <select
              aria-label="Filter by class"
              value={classFilter ?? ''}
              onChange={(e) => { setClassFilter(e.target.value || null); setPage(1); }}
              className={`appearance-none h-8 pl-7 pr-6 text-sm leading-none rounded border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] cursor-pointer ${classFilter ? 'text-[color:var(--color-accent-fg)]' : 'text-[color:var(--color-fg-default)]'}`}
            >
              <option value="">All classes</option>
              {allClasses.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            <svg className="absolute right-1.5 pointer-events-none text-[color:var(--color-fg-muted)]" width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Clear filters button */}
          {(searchQuery || raceFilter || classFilter) && (
            <button
              type="button"
              title="Clear all filters"
              aria-label="Clear all filters"
              onClick={() => {
                setSearchInput('');
                setSearchQuery('');
                setRaceFilter(null);
                setClassFilter(null);
                setPage(1);
              }}
              className="flex items-center justify-center w-6 h-6 rounded-full border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-danger-fg)] hover:border-[var(--color-danger-fg)] cursor-pointer"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2.5 2.5l5 5M7.5 2.5l-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}

          {/* +New split button */}
          <div ref={newRef} className="btn-group btn-group-primary relative">
            <button
              type="button"
              onClick={() => { setNewDropdownOpen(false); onNewCharacter(); }}
              className="btn btn-primary h-8 font-semibold"
            >
              + New
            </button>
            <button
              type="button"
              onClick={() => setNewDropdownOpen((o) => !o)}
              className="btn btn-primary h-8 px-2"
              aria-label="New character with class"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {newDropdownOpen && (
              <ul
                role="listbox"
                aria-label="New character with class"
                className="absolute right-0 top-full mt-1 z-20 min-w-36 rounded border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] shadow-md py-1 text-sm text-[color:var(--color-fg-default)]"
              >
                {CLASSES.map((cls) => (
                  <li
                    key={cls}
                    role="option"
                    onClick={() => { setNewDropdownOpen(false); onNewCharacter(cls); }}
                    className="px-3 py-1.5 cursor-pointer hover:bg-[var(--color-accent-subtle)]"
                  >
                    {cls}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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
                {(
                  [
                    { label: 'Name',          key: 'name'      },
                    { label: 'Race',          key: 'race'      },
                    { label: 'Class',         key: 'class'     },
                    { label: 'Level',         key: 'level'     },
                    { label: 'Last Modified', key: 'updatedAt' },
                  ] as const
                ).map(({ label, key }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="text-left px-4 py-2 font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)] cursor-pointer select-none hover:text-[color:var(--color-fg-default)]"
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sortKey === key && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 10 10"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          style={{ color: 'var(--color-fg-muted)', opacity: 0.6 }}
                        >
                          {sortDir === 'asc' ? (
                            <path d="M2 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          ) : (
                            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          )}
                        </svg>
                      )}
                    </span>
                  </th>
                ))}
                <th className="border-b border-[var(--color-border-default)]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-sm text-[color:var(--color-fg-muted)]"
                  >
                    {characters.length === 0 ? (
                      <>
                        No characters yet.{' '}
                        <button
                          type="button"
                          onClick={() => onNewCharacter()}
                          className="text-[color:var(--color-accent-fg)] cursor-pointer underline bg-transparent border-0 p-0 [font:inherit]"
                        >
                          Create a new character
                        </button>{' '}
                        to get started.
                      </>
                    ) : (
                      'No characters match the current filter.'
                    )}
                  </td>
                </tr>
              ) : paginated.map((char) => (
                <tr
                  key={char._id}
                  className="border-b border-[var(--color-border-muted)] cursor-pointer hover:bg-[var(--color-canvas-subtle)] bg-[var(--color-canvas-default)]"
                  onClick={() => onEditCharacter(char._id)}
                >
                  <td
                    className="px-4 py-2 font-medium"
                  >
                    {char.name}
                  </td>
                  <td className="px-4 py-2 text-[color:var(--color-fg-default)]">
                    {char.race}
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
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteCharacter(char._id);
                      }}
                      title="Delete character"
                      aria-label={`Delete ${char.name}`}
                      className="inline-flex items-center justify-center w-6 h-6 text-black"
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path d="M4 2H1V4H15V2H12V0H4V2Z"/>
                        <path fillRule="evenodd" clipRule="evenodd" d="M3 6H13V16H3V6ZM7 9H9V13H7V9Z"/>
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="flex items-center justify-between mt-3 text-sm text-[color:var(--color-fg-muted)]">
          <div className="flex items-center gap-2">
            <label htmlFor="page-size-select">Per page:</label>
            <select
              id="page-size-select"
              value={pageSize ?? 'all'}
              onChange={(e) => {
                const val = e.target.value;
                const next = val === 'all' ? null : Number(val) as PageSize;
                setPageSize(next);
                savePageSize(userId, next);
                setPage(1);
              }}
              style={{ background: 'var(--color-canvas-default)', border: '1px solid var(--color-border-default)', borderRadius: 4, color: 'var(--color-fg-default)', padding: '2px 6px' }}
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s ?? 'all'} value={s ?? 'all'}>
                  {s ?? 'All'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {pageSize !== null ? (
              <span>
                {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of {sorted.length}
              </span>
            ) : (
              <span>{sorted.length} total</span>
            )}

            {pageSize !== null && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  aria-label="First page"
                  className="px-2 py-0.5 rounded border border-[var(--color-border-default)] disabled:opacity-40 hover:bg-[var(--color-canvas-subtle)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)] cursor-pointer disabled:cursor-default"
                >«</button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  className="px-2 py-0.5 rounded border border-[var(--color-border-default)] disabled:opacity-40 hover:bg-[var(--color-canvas-subtle)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)] cursor-pointer disabled:cursor-default"
                >‹</button>
                <span className="px-2">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                  className="px-2 py-0.5 rounded border border-[var(--color-border-default)] disabled:opacity-40 hover:bg-[var(--color-canvas-subtle)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)] cursor-pointer disabled:cursor-default"
                >›</button>
                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  aria-label="Last page"
                  className="px-2 py-0.5 rounded border border-[var(--color-border-default)] disabled:opacity-40 hover:bg-[var(--color-canvas-subtle)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)] cursor-pointer disabled:cursor-default"
                >»</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
