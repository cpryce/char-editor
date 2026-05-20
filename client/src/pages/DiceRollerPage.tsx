import { useState, useCallback, useEffect, useRef } from 'react';
import Dice3D from 'react-3d-dice';
import type { WeaponLoadout } from '../types/character';
import './DiceRollerPage.css';

type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

const DICE: { type: DieType; sides: number }[] = [
  { type: 'd4', sides: 4 },
  { type: 'd6', sides: 6 },
  { type: 'd8', sides: 8 },
  { type: 'd10', sides: 10 },
  { type: 'd12', sides: 12 },
  { type: 'd20', sides: 20 },
];

interface CharacterSummary {
  _id: string;
  name: string;
  race: string;
  classes: { name: string; level: number }[];
}

interface CharacterWeapons {
  mainHand: WeaponLoadout | null;
  offHandWeapon: WeaponLoadout | null;
}

interface RollResult {
  id: number;
  label: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: Date;
}

let nextId = 1;

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/** Parse a damage string like "2d6+3" or "1d8" or "1d4-1" into parts. */
function parseDamage(damage: string): { count: number; sides: number; mod: number } | null {
  const m = damage.trim().match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;
  return {
    count: parseInt(m[1]),
    sides: parseInt(m[2]),
    mod: m[3] ? parseInt(m[3]) : 0,
  };
}

/** Return the DieType matching sides, or the nearest supported one. */
function nearestDieType(sides: number): DieType {
  const supported: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
  const nums = [4, 6, 8, 10, 12, 20];
  let closest = 0;
  for (let i = 1; i < nums.length; i++) {
    if (Math.abs(nums[i] - sides) < Math.abs(nums[closest] - sides)) closest = i;
  }
  return supported[closest];
}

export function DiceRollerPage() {
  const [count, setCount] = useState(1);
  const [selectedDie, setSelectedDie] = useState<DieType>('d20');
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState<RollResult[]>([]);
  const [activeRoll, setActiveRoll] = useState<{ sides: number; results: number[] } | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollTrigger, setRollTrigger] = useState(0);

  // Character picker
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [charInput, setCharInput] = useState('');
  const [charDropdownOpen, setCharDropdownOpen] = useState(false);
  const [selectedChar, setSelectedChar] = useState<CharacterSummary | null>(null);
  const [weapons, setWeapons] = useState<CharacterWeapons | null>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/characters', { credentials: 'include' })
      .then((r) => r.ok ? r.json() as Promise<CharacterSummary[]> : Promise.resolve([]))
      .then(setCharacters)
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setCharDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function selectCharacter(char: CharacterSummary) {
    setSelectedChar(char);
    setCharInput(char.name);
    setCharDropdownOpen(false);
    setWeapons(null);
    fetch(`/api/characters/${char._id}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() as Promise<Record<string, unknown>> : Promise.resolve(null))
      .then((data) => {
        if (!data) return;
        const inv = data.inventory as { mainHand?: WeaponLoadout | null; offHandWeapon?: WeaponLoadout | null } | undefined;
        setWeapons({
          mainHand: inv?.mainHand ?? null,
          offHandWeapon: inv?.offHandWeapon ?? null,
        });
      })
      .catch(() => {});
  }

  function clearCharacter() {
    setSelectedChar(null);
    setCharInput('');
    setWeapons(null);
  }

  const filteredChars = charInput.trim().length > 0
    ? characters.filter((c) => c.name.toLowerCase().includes(charInput.toLowerCase()))
    : characters;

  const executeRoll = useCallback((sides: number, dieType: DieType, numDice: number, mod: number) => {
    const rolls = Array.from({ length: numDice }, () => rollDie(sides));
    const total = rolls.reduce((a, b) => a + b, 0) + mod;
    const label = `${numDice}${dieType}${mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : ''}`;

    setActiveRoll({ sides, results: rolls });
    setIsRolling(true);
    setRollTrigger((t) => t + 1);
    setTimeout(() => setIsRolling(false), 800);

    setHistory((prev) => [
      { id: nextId++, label, rolls, modifier: mod, total, timestamp: new Date() },
      ...prev,
    ].slice(0, 50));
  }, []);

  const roll = useCallback(() => {
    const die = DICE.find((d) => d.type === selectedDie)!;
    executeRoll(die.sides, selectedDie, count, modifier);
  }, [count, selectedDie, modifier, executeRoll]);

  function rollWeapon(weapon: WeaponLoadout, label: string) {
    const parsed = parseDamage(weapon.damage);
    if (!parsed) return;
    const dieType = nearestDieType(parsed.sides);
    const totalMod = parsed.mod + (weapon.enhancementBonus ?? 0) + (weapon.combatMod ?? 0);
    executeRoll(parsed.sides, dieType, parsed.count, totalMod);
  }

  const clearHistory = useCallback(() => {
    setHistory([]);
    setActiveRoll(null);
  }, []);

  const hasWeapons = weapons && (weapons.mainHand || weapons.offHandWeapon);

  return (
    <div className="dice-roller-page p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="dice-roller-page-title">Dice Roller</h2>
      </div>

      <div className="dice-roller-body">
      <div className="dice-roller-main">
        {/* Controls */}
        <div className="rounded-md border p-4 mb-6 bg-[var(--color-canvas-subtle)] border-[var(--color-border-default)]">
          {hasWeapons ? (
            /* Weapon roll buttons */
            <div className="flex flex-wrap gap-3">
              {weapons!.mainHand && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
                    Main Hand
                  </span>
                  <button
                    type="button"
                    disabled={isRolling}
                    onClick={() => rollWeapon(weapons!.mainHand!, 'Main Hand')}
                    className="dice-roller-weapon-btn"
                  >
                    <span className="font-medium">{weapons!.mainHand.name}</span>
                    <span className="text-xs opacity-70 ml-1">({weapons!.mainHand.damage})</span>
                  </button>
                </div>
              )}
              {weapons!.offHandWeapon && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
                    Off Hand
                  </span>
                  <button
                    type="button"
                    disabled={isRolling}
                    onClick={() => rollWeapon(weapons!.offHandWeapon!, 'Off Hand')}
                    className="dice-roller-weapon-btn"
                  >
                    <span className="font-medium">{weapons!.offHandWeapon.name}</span>
                    <span className="text-xs opacity-70 ml-1">({weapons!.offHandWeapon.damage})</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Manual dice controls */
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label htmlFor="dr-count" className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
                  Number of Dice
                </label>
                <input
                  id="dr-count"
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                  className="h-8 px-3 text-sm w-24 rounded-md border border-[var(--color-border-default)] bg-white text-slate-900"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="dr-die" className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
                  Die Type
                </label>
                <select
                  id="dr-die"
                  value={selectedDie}
                  onChange={(e) => setSelectedDie(e.target.value as DieType)}
                  className="h-8 px-3 text-sm rounded-md border border-[var(--color-border-default)] bg-white text-slate-900"
                >
                  {DICE.map((d) => (
                    <option key={d.type} value={d.type}>{d.type}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="dr-modifier" className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
                  Modifier
                </label>
                <input
                  id="dr-modifier"
                  type="number"
                  min={-100}
                  max={100}
                  value={modifier}
                  onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                  className="h-8 px-3 text-sm w-24 rounded-md border border-[var(--color-border-default)] bg-white text-slate-900"
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={roll}
                  disabled={isRolling}
                  className="h-8 px-4 text-sm font-medium rounded-md bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:bg-[var(--color-btn-primary-hover-bg)] border border-[var(--color-btn-primary-border)] disabled:opacity-50"
                >
                  Roll
                </button>
              </div>
            </div>
          )}

          {/* Quick-roll buttons (always shown) */}
          <div className="mt-4 flex flex-wrap gap-2">
            {DICE.map((d) => (
              <button
                key={d.type}
                type="button"
                disabled={isRolling}
                onClick={() => {
                  setSelectedDie(d.type);
                  setCount(1);
                  setModifier(0);
                  executeRoll(d.sides, d.type, 1, 0);
                }}
                className="h-7 px-3 text-xs font-medium rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)] hover:bg-[var(--color-canvas-subtle)] disabled:opacity-50"
              >
                {d.type}
              </button>
            ))}
          </div>
        </div>

        {/* Animation + history side by side */}
        <div className="flex gap-4 items-start">
          {/* 3D dice display */}
          <div
            className="rounded-md border border-[var(--color-border-default)] overflow-hidden shrink-0"
            style={{ background: '#2d5a27', width: 500, height: 350 }}
          >
            {activeRoll ? (
              <Dice3D
                sides={activeRoll.sides}
                results={activeRoll.results}
                isRolling={isRolling}
                rollTrigger={rollTrigger}
                animationMode="full"
                height={350}
                color={0x111111}
                d6Style="dots"
                style={{ background: 'transparent' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="px-4 text-sm text-center" style={{ color: '#a8d5a2' }}>
                  Select a die type and click Roll to see the animation.
                </p>
              </div>
            )}
          </div>

          {/* Roll history */}
          <div className="flex-1 min-w-0 rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] overflow-hidden" style={{ height: 350 }}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)]">
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
                Roll History
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg-default)]"
                >
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center text-[color:var(--color-fg-muted)]">
                No rolls yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-border-default)] overflow-y-auto" style={{ maxHeight: 'calc(350px - 37px)' }}>
                {history.map((result, index) => (
                  <li
                    key={result.id}
                    className={`flex items-baseline gap-3 px-4 py-3 ${index === 0 ? 'bg-[var(--color-canvas-subtle)]' : ''}`}
                  >
                    <span className="text-2xl font-bold tabular-nums text-[color:var(--color-fg-default)] w-12 shrink-0 text-right">
                      {result.total}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-[color:var(--color-fg-default)]">
                        {result.label}
                      </span>
                      <span className="text-xs text-[color:var(--color-fg-muted)] truncate">
                        [{result.rolls.join(', ')}]
                        {result.modifier !== 0 && (
                          <> {result.modifier > 0 ? '+' : ''}{result.modifier} mod</>
                        )}
                      </span>
                    </div>
                    <span className="ml-auto text-xs text-[color:var(--color-fg-muted)] shrink-0">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>{/* end dice-roller-main */}

      {/* Right rail */}
      <aside className="dice-roller-rail">
        <div className="dice-roller-rail-section">
          <div className="dice-roller-rail-section-header">
            <h3 className="subsection-header">Character</h3>
            {selectedChar && (
              <button type="button" className="dice-roller-rail-clear-btn" onClick={clearCharacter}>
                Clear
              </button>
            )}
          </div>

          {/* Typeahead combobox */}
          <div ref={comboRef} className="relative">
            <input
              type="text"
              placeholder="Search characters…"
              value={charInput}
              onChange={(e) => {
                setCharInput(e.target.value);
                setCharDropdownOpen(true);
                if (!e.target.value) clearCharacter();
              }}
              onFocus={() => setCharDropdownOpen(true)}
              className="w-full h-8 px-3 text-sm rounded-md border border-[var(--color-border-default)] bg-white text-slate-900"
            />
            {charDropdownOpen && filteredChars.length > 0 && (
              <ul className="dice-roller-char-dropdown">
                {filteredChars.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      className="dice-roller-char-option"
                      onMouseDown={(e) => { e.preventDefault(); selectCharacter(c); }}
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-[color:var(--color-fg-muted)] ml-1">
                        {c.race} {c.classes.map((cl) => `${cl.name} ${cl.level}`).join(' / ')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Selected character weapons summary */}
          {selectedChar && weapons && (
            <div className="mt-2 flex flex-col gap-2">
              {weapons.mainHand ? (
                <div className="dice-roller-rail-weapon">
                  <span className="dice-roller-rail-field-label">Main Hand</span>
                  <span className="text-sm text-[color:var(--color-fg-default)]">{weapons.mainHand.name}</span>
                  <span className="text-xs text-[color:var(--color-fg-muted)]">{weapons.mainHand.damage} · {weapons.mainHand.damageType}</span>
                </div>
              ) : (
                <p className="text-xs text-[color:var(--color-fg-muted)]">No main-hand weapon equipped.</p>
              )}
              {weapons.offHandWeapon && (
                <div className="dice-roller-rail-weapon">
                  <span className="dice-roller-rail-field-label">Off Hand</span>
                  <span className="text-sm text-[color:var(--color-fg-default)]">{weapons.offHandWeapon.name}</span>
                  <span className="text-xs text-[color:var(--color-fg-muted)]">{weapons.offHandWeapon.damage} · {weapons.offHandWeapon.damageType}</span>
                </div>
              )}
            </div>
          )}
          {selectedChar && !weapons && (
            <p className="text-xs text-[color:var(--color-fg-muted)] mt-1">Loading weapons…</p>
          )}
        </div>
      </aside>
    </div>
    </div>
  );
}

