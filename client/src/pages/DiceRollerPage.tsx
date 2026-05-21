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
  critMultiplier?: number;
  confirmRoll?: { rolls: number[]; total: number };
}

let nextId = 1;

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

function computeAbilityMod(score: { base: number; racial: number; enhancement: number; misc: number; tempMod: number | null; levelUp: number; temp: number | null }): number {
  const total = score.temp ?? (score.base + score.racial + score.enhancement + score.misc + (score.tempMod ?? 0) + score.levelUp);
  return Math.floor((total - 10) / 2);
}

export function DiceRollerPage() {
  const [history, setHistory] = useState<RollResult[]>([]);
  const [activeRoll, setActiveRoll] = useState<{ sides: number; results: number[] }[] | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollTrigger, setRollTrigger] = useState(0);
  const [diceSelections, setDiceSelections] = useState<Partial<Record<DieType, number>>>({});
  const [selectedModifier, setSelectedModifier] = useState<number | null>(null);
  const [attackSequence, setAttackSequence] = useState<{ label: string; bonus: number; critical?: { minRoll: number; multiplier: number } }[] | null>(null);
  const [currentAttackIdx, setCurrentAttackIdx] = useState(0);
  const [panelHeight, setPanelHeight] = useState(() => window.innerWidth <= 639 ? 250 : 350);
  const [saves, setSaves] = useState<{ fort: number; ref: number; will: number } | null>(null);
  const [mainHandAttackText, setMainHandAttackText] = useState('');
  const [offHandAttackText, setOffHandAttackText] = useState('');

  useEffect(() => {
    function onResize() { setPanelHeight(window.innerWidth <= 639 ? 250 : 350); }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    setAttackSequence(null);
    setCurrentAttackIdx(0);
    fetch(`/api/characters/${char._id}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() as Promise<Record<string, unknown>> : Promise.resolve(null))
      .then((data) => {
        if (!data) return;
        const inv = data.inventory as { mainHand?: WeaponLoadout | null; offHandWeapon?: WeaponLoadout | null } | undefined;
        setWeapons({
          mainHand: inv?.mainHand ?? null,
          offHandWeapon: inv?.offHandWeapon ?? null,
        });
        setMainHandAttackText(inv?.mainHand?.computedAttack ?? '');
        setOffHandAttackText(inv?.offHandWeapon?.computedAttack ?? '');
        const combat = data.combat as { saves?: { fortitude: { base: number; magic: number; misc: number; temp: number }; reflex: { base: number; magic: number; misc: number; temp: number }; will: { base: number; magic: number; misc: number; temp: number } } } | undefined;
        const abilityScores = data.abilityScores as { constitution: { base: number; racial: number; enhancement: number; misc: number; tempMod: number | null; levelUp: number; temp: number | null }; dexterity: { base: number; racial: number; enhancement: number; misc: number; tempMod: number | null; levelUp: number; temp: number | null }; wisdom: { base: number; racial: number; enhancement: number; misc: number; tempMod: number | null; levelUp: number; temp: number | null } } | undefined;
        if (combat?.saves && abilityScores) {
          const s = combat.saves;
          setSaves({
            fort: s.fortitude.base + s.fortitude.magic + s.fortitude.misc + s.fortitude.temp + computeAbilityMod(abilityScores.constitution),
            ref: s.reflex.base + s.reflex.magic + s.reflex.misc + s.reflex.temp + computeAbilityMod(abilityScores.dexterity),
            will: s.will.base + s.will.magic + s.will.misc + s.will.temp + computeAbilityMod(abilityScores.wisdom),
          });
        }
      })
      .catch(() => {});
  }

  function clearCharacter() {
    setSelectedChar(null);
    setCharInput('');
    setWeapons(null);
    setSaves(null);
    setMainHandAttackText('');
    setOffHandAttackText('');
    setAttackSequence(null);
    setCurrentAttackIdx(0);
  }

  const filteredChars = charInput.trim().length > 0
    ? characters.filter((c) => c.name.toLowerCase().includes(charInput.toLowerCase()))
    : characters;

  function selectDie(dieType: DieType) {
    setDiceSelections((prev) => ({ ...prev, [dieType]: (prev[dieType] ?? 0) + 1 }));
  }

  function deselectDie(e: React.MouseEvent, dieType: DieType) {
    e.preventDefault();
    setDiceSelections((prev) => {
      const current = prev[dieType] ?? 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[dieType];
        return next;
      }
      return { ...prev, [dieType]: current - 1 };
    });
  }

  const rollSelected = useCallback(() => {
    const entries = (Object.entries(diceSelections) as [DieType, number][]).filter(([, n]) => n > 0);
    if (entries.length === 0) return;

    const groups = entries.map(([die, n]) => {
      const sides = DICE.find((d) => d.type === die)!.sides;
      const results = Array.from({ length: n }, () => rollDie(sides));
      return { sides, results };
    });

    const allRolls = groups.flatMap((g) => g.results);
    const mod = selectedModifier ?? 0;
    const total = allRolls.reduce((a, b) => a + b, 0) + mod;
    const modSuffix = mod !== 0 ? (mod > 0 ? `+${mod}` : `${mod}`) : '';
    const label = entries.map(([die, n]) => `${n}${die}`).join('+') + modSuffix;

    setActiveRoll(groups);
    setIsRolling(true);
    setRollTrigger((t) => t + 1);
    setTimeout(() => setIsRolling(false), 800);

    setHistory((prev) => [
      { id: nextId++, label, rolls: allRolls, modifier: mod, total, timestamp: new Date() },
      ...prev,
    ].slice(0, 50));
  }, [diceSelections, selectedModifier]);

  function parseCritical(critical: string): { minRoll: number; multiplier: number } | null {
    const m = critical.trim().match(/^(\d+)(?:-\d+)?\s*\/\s*[\u00D7xX](\d+)/);
    if (!m) return null;
    return { minRoll: parseInt(m[1]), multiplier: parseInt(m[2]) };
  }

  function parseAttacks(computedAttack: string, critical?: { minRoll: number; multiplier: number }): { label: string; bonus: number; critical?: { minRoll: number; multiplier: number } }[] {
    return computedAttack.split('/').map((s, i) => {
      const trimmed = s.trim();
      const bonus = parseInt(trimmed, 10);
      return { label: `Attack ${i + 1} (${trimmed})`, bonus: isNaN(bonus) ? 0 : bonus, critical };
    });
  }

  function startAttackFromText(attackText: string, critical?: { minRoll: number; multiplier: number }) {
    if (!attackText.trim()) return;
    const attacks = parseAttacks(attackText, critical);
    if (attacks.length === 0) return;
    const first = attacks[0];
    const rolls = [rollDie(20)];
    const total = rolls[0] + first.bonus;
    const critMultiplier = first.critical && rolls[0] >= first.critical.minRoll ? first.critical.multiplier : undefined;
    setAttackSequence(attacks);
    setCurrentAttackIdx(0);
    setActiveRoll([{ sides: 20, results: rolls }]);
    setIsRolling(true);
    setRollTrigger((t) => t + 1);
    setTimeout(() => setIsRolling(false), 800);
    setHistory([{ id: nextId++, label: first.label, rolls, modifier: first.bonus, total, critMultiplier, timestamp: new Date() }]);
  }

  function rollSave(label: string, bonus: number) {
    const rolls = [rollDie(20)];
    const total = rolls[0] + bonus;
    const sign = bonus >= 0 ? `+${bonus}` : `${bonus}`;
    setActiveRoll([{ sides: 20, results: rolls }]);
    setIsRolling(true);
    setRollTrigger((t) => t + 1);
    setTimeout(() => setIsRolling(false), 800);
    setHistory((prev) => [
      { id: nextId++, label: `${label} save (${sign})`, rolls, modifier: bonus, total, timestamp: new Date() },
      ...prev,
    ].slice(0, 50));
  }

  function advanceAttack() {
    if (!attackSequence) return;
    const nextIdx = currentAttackIdx + 1;
    if (nextIdx >= attackSequence.length) return;
    const attack = attackSequence[nextIdx];
    const rolls = [rollDie(20)];
    const total = rolls[0] + attack.bonus;
    const critMultiplier = attack.critical && rolls[0] >= attack.critical.minRoll ? attack.critical.multiplier : undefined;
    setCurrentAttackIdx(nextIdx);
    setActiveRoll([{ sides: 20, results: rolls }]);
    setIsRolling(true);
    setRollTrigger((t) => t + 1);
    setTimeout(() => setIsRolling(false), 800);
    setHistory((prev) => [...prev, { id: nextId++, label: attack.label, rolls, modifier: attack.bonus, total, critMultiplier, timestamp: new Date() }]);
  }

  function confirmCritical(rollId: number) {
    setHistory((prev) => {
      const idx = prev.findIndex((r) => r.id === rollId);
      if (idx === -1) return prev;
      const original = prev[idx];
      const confirmD20 = rollDie(20);
      const confirmTotal = confirmD20 + original.modifier;
      const next = [...prev];
      next[idx] = { ...original, confirmRoll: { rolls: [confirmD20], total: confirmTotal } };
      return next;
    });
  }

  const clearHistory = useCallback(() => {
    setHistory([]);
    setActiveRoll(null);
    setAttackSequence(null);
    setCurrentAttackIdx(0);
    setSelectedModifier(null);
  }, []);

  const [railOpen, setRailOpen] = useState(false);

  return (
    <div className="dice-roller-page p-6">
      {/* Sticky flyout toggle – small view only */}
      <button
        type="button"
        onClick={() => setRailOpen((o) => !o)}
        aria-label={railOpen ? 'Close character panel' : 'Open character panel'}
        className="dice-roller-sticky-toggle"
      >
        {railOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" aria-hidden="true">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="dice-roller-page-header mb-6">
        <h2 className="dice-roller-page-title">Dice Roller</h2>
      </div>

      <div className="dice-roller-body">
      <div className="dice-roller-main">
        {/* Controls */}
        <div className="rounded-md border p-4 mb-6 bg-[var(--color-canvas-subtle)] border-[var(--color-border-default)]">
            {selectedChar ? (
            <div className="flex flex-col gap-4">
              {weapons?.mainHand && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
                    Main Hand · {weapons.mainHand.name} ({weapons.mainHand.damage})
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={mainHandAttackText}
                      onChange={(e) => setMainHandAttackText(e.target.value)}
                      placeholder="e.g. +8/+3"
                      className="flex-1 h-8 px-2 text-sm font-mono rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)]"
                    />
                    <button
                      type="button"
                      disabled={isRolling || !mainHandAttackText.trim()}
                      onClick={() => startAttackFromText(mainHandAttackText, parseCritical(weapons!.mainHand!.critical ?? '') ?? undefined)}
                      className="dice-roller-weapon-btn"
                    >
                      Attack
                    </button>
                  </div>
                </div>
              )}
              {weapons?.offHandWeapon && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">
                    Off Hand · {weapons.offHandWeapon.name} ({weapons.offHandWeapon.damage})
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={offHandAttackText}
                      onChange={(e) => setOffHandAttackText(e.target.value)}
                      placeholder="e.g. +3"
                      className="flex-1 h-8 px-2 text-sm font-mono rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)]"
                    />
                    <button
                      type="button"
                      disabled={isRolling || !offHandAttackText.trim()}
                      onClick={() => startAttackFromText(offHandAttackText, parseCritical(weapons!.offHandWeapon!.critical ?? '') ?? undefined)}
                      className="dice-roller-weapon-btn"
                    >
                      Attack
                    </button>
                  </div>
                </div>
              )}
              {saves && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-muted)]">Saving Throws</span>
                  <div className="flex gap-2">
                    {([['Fortitude', 'Fort', saves.fort], ['Reflex', 'Ref', saves.ref], ['Will', 'Will', saves.will]] as [string, string, number][]).map(([name, abbr, bonus]) => (
                      <button
                        key={name}
                        type="button"
                        disabled={isRolling}
                        onClick={() => rollSave(name, bonus)}
                        className="dice-roller-weapon-btn"
                      >
                        <span className="font-medium">{abbr}: {bonus >= 0 ? `+${bonus}` : `${bonus}`}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!weapons && <p className="text-xs text-[color:var(--color-fg-muted)]">Loading character data…</p>}
            </div>
          ) : (
            /* Manual dice controls */
            <div className="flex flex-wrap gap-4 items-end">
            </div>
          )}

        </div>

        {/* Shared container: spanning header + animation + history */}
        <div className="rounded-md border border-[var(--color-border-default)] overflow-hidden">
          {/* Header spanning both panels */}
          <div className="flex items-center gap-1 sm:gap-2 px-3 py-2 border-b border-[var(--color-border-default)] bg-[var(--color-canvas-subtle)]">
            {DICE.map((d) => (
              <button
                key={d.type}
                type="button"
                disabled={isRolling}
                onClick={() => selectDie(d.type)}
                onContextMenu={(e) => deselectDie(e, d.type)}
                title="Left-click to add · Right-click to remove"
                className="relative h-7 px-1.5 sm:px-3 text-xs font-medium rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)] hover:bg-[var(--color-canvas-subtle)] disabled:opacity-50"
              >
                {d.type}
                {(diceSelections[d.type] ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 text-[10px] font-bold rounded-full bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] flex items-center justify-center leading-none pointer-events-none">
                    {diceSelections[d.type]}
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              disabled={isRolling || !Object.values(diceSelections).some((n) => (n ?? 0) > 0)}
              onClick={() => { rollSelected(); }}
              aria-label="Roll selected dice"
              title="Roll selected dice"
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] hover:bg-[var(--color-btn-primary-hover-bg)] border border-[var(--color-btn-primary-border)] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                <path d="M5 3v18l15-9L5 3z" />
              </svg>
            </button>
            {(history.length > 0 || Object.values(diceSelections).some((n) => (n ?? 0) > 0)) && (
              <button
                type="button"
                onClick={() => { clearHistory(); setDiceSelections({}); }}
                className="ml-auto text-xs text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg-default)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* Animation + history, no gap */}
          <div className="dice-roller-body-panels relative">
            {/* 3D dice display */}
            <div className="dice-roller-anim-panel" style={{ background: '#2d5a27' }}>
              {activeRoll ? (
                activeRoll.map((group, i) => {
                  const groupH = Math.max(120, Math.floor(panelHeight / activeRoll.length));
                  return (
                    <div key={i} style={{ height: groupH, flexShrink: 0 }}>
                      <Dice3D
                        sides={group.sides}
                        results={group.results}
                        isRolling={isRolling}
                        rollTrigger={rollTrigger}
                        animationMode="full"
                        height={groupH}
                        color={0x111111}
                        d6Style="dots"
                        style={{ background: 'transparent' }}
                      />
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="px-4 text-sm text-center" style={{ color: '#a8d5a2' }}>
                    Select a die type and click Roll to see the animation.
                  </p>
                </div>
              )}
              {/* Next attack arrow */}
              {attackSequence && currentAttackIdx < attackSequence.length - 1 && (
                <button
                  type="button"
                  onClick={advanceAttack}
                  disabled={isRolling}
                  aria-label="Next attack"
                  title={`Next: ${attackSequence[currentAttackIdx + 1].label}`}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center bg-white/25 hover:bg-white/40 text-white disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
                    <path d="M8 5l8 7-8 7V5z" />
                  </svg>
                </button>
              )}
            </div>

            {/* Floating modifier input — top-left of animation panel */}
            <div
              className="absolute top-0 left-0 z-10 flex items-center gap-1 px-2 py-1 rounded-br-md"
              style={{ background: 'var(--color-canvas-subtle)' }}
            >
              <label htmlFor="sel-modifier" className="text-xs text-[color:var(--color-fg-muted)] shrink-0">+/−</label>
              <input
                id="sel-modifier"
                type="number"
                min={-100}
                max={100}
                value={selectedModifier ?? ''}
                onChange={(e) => setSelectedModifier(e.target.value === '' ? null : parseInt(e.target.value) || 0)}
                className="w-14 h-6 px-1.5 text-xs rounded-md border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)]"
              />
            </div>

            {/* Roll history */}
            <div className="dice-roller-history-panel sm:flex-1 min-w-0 bg-[var(--color-canvas-default)] overflow-hidden flex flex-col">
              {history.length === 0 ? (
                <p className="px-4 py-6 text-sm text-center text-[color:var(--color-fg-muted)]">
                  No rolls yet.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--color-border-default)] overflow-y-auto flex-1">
                  {history.map((result, index) => (
                    <li
                      key={result.id}
                      className={`flex flex-col gap-0.5 px-4 py-1.5 ${index === 0 ? 'bg-[var(--color-canvas-subtle)]' : ''}`}
                    >
                      <div className="flex items-baseline gap-3">
                        <span className="text-xl font-bold tabular-nums text-[color:var(--color-fg-default)] w-10 shrink-0 text-right">
                          {result.total}
                        </span>
                        {result.critMultiplier && (
                          <span
                            className="self-center w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ color: 'var(--color-attention-fg)', borderColor: 'var(--color-attention-fg)' }}
                            title="Critical threat!"
                          >
                            ×{result.critMultiplier}
                          </span>
                        )}
                        {!result.critMultiplier && result.rolls.length === 1 && result.rolls[0] === 1 && (
                          <span
                            className="self-center w-7 h-7 flex items-center justify-center shrink-0"
                            style={{ color: 'var(--color-attention-fg)' }}
                            title="Fumble!"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
                              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                            </svg>
                          </span>
                        )}
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
                        <div className="ml-auto flex items-center gap-2 shrink-0">
                          {result.critMultiplier && !result.confirmRoll && (
                            <button
                              type="button"
                              onClick={() => confirmCritical(result.id)}
                              aria-label="Roll to confirm critical"
                              title="Roll to confirm critical"
                              className="w-6 h-6 rounded-full flex items-center justify-center border"
                              style={{ color: 'var(--color-fg-accent)', borderColor: 'var(--color-fg-accent)' }}
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10" aria-hidden="true">
                                <path d="M5 3v18l15-9L5 3z" />
                              </svg>
                            </button>
                          )}
                          <span className="text-xs text-[color:var(--color-fg-muted)]">
                            {result.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      {result.confirmRoll && (
                        <div className="flex items-baseline gap-3 pl-2 border-l-2" style={{ borderColor: 'var(--color-fg-accent)' }}>
                          <span className="text-lg font-bold tabular-nums w-10 shrink-0 text-right" style={{ color: 'var(--color-fg-accent)' }}>
                            {result.confirmRoll.total}
                          </span>
                          {result.confirmRoll.rolls[0] === 1 && (
                            <span
                              className="self-center w-7 h-7 flex items-center justify-center shrink-0"
                              style={{ color: 'var(--color-attention-fg)' }}
                              title="Fumble!"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
                                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                              </svg>
                            </span>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-medium" style={{ color: 'var(--color-fg-accent)' }}>Confirm critical</span>
                            <span className="text-xs" style={{ color: 'var(--color-fg-accent)', opacity: 0.8 }}>
                              [{result.confirmRoll.rolls.join(', ')}]
                              {result.modifier !== 0 && (
                                <> {result.modifier > 0 ? '+' : ''}{result.modifier} mod</>
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>{/* end dice-roller-main */}

      {/* Right rail */}
      <aside className={`dice-roller-rail${railOpen ? ' dice-roller-rail--open' : ''}`}>
        <button
          type="button"
          onClick={() => setRailOpen(false)}
          aria-label="Close character panel"
          className="dice-roller-rail-close self-end mb-3 w-7 h-7 rounded-md items-center justify-center border border-[var(--color-border-default)] hover:bg-[var(--color-canvas-subtle)] text-[color:var(--color-fg-muted)]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
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
              className="dice-roller-char-input w-full h-8 px-3 text-sm rounded-md border border-[var(--color-border-default)] bg-white text-slate-900"
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
                  {weapons.mainHand.computedAttack && (
                    <span className="text-xs font-mono text-[color:var(--color-fg-default)] mt-1">{weapons.mainHand.computedAttack}</span>
                  )}
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
    {railOpen && (
      <div
        className="dice-roller-rail-backdrop"
        onClick={() => setRailOpen(false)}
        aria-hidden="true"
      />
    )}
    </div>
  );
}

