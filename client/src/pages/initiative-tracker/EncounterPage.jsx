import { useState, useEffect, useCallback, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CombatantCard } from './CombatantCard';

let _idCounter = 1;
function newId() { return `c-${Date.now()}-${_idCounter++}`; }

function initiativeModifierFromCharacter(char) {
  const dex = char.abilityScores?.dexterity;
  const dexTotal = dex
    ? (dex.temp ?? (dex.base + dex.racial + dex.enhancement + dex.misc + (dex.tempMod ?? 0) + dex.levelUp))
    : 10;
  const dexMod = Math.floor((dexTotal - 10) / 2);
  const initiativeMisc = Number(char.combat?.initiative?.miscBonus ?? 0);
  return dexMod + initiativeMisc;
}

export function EncounterPage({ sessionId, onBack }) {
  const id = sessionId;

  const [session, setSession] = useState(null);
  const [editName, setEditName] = useState('');
  const [combatants, setCombatants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [started, setStarted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [characters, setCharacters] = useState(null);
  const selectedIdRef = useRef(null);
  selectedIdRef.current = selectedId;
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetch(`/api/encounters/${id}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setSession(data);
        setEditName(data.name);
        const initialCombatants = (data.players || []).map((p) => ({
          ...p,
          initiative: 0,
          modifier: p.modifier ?? 0,
          flatFooted: false,
          statuses: [],
        }));
        setCombatants(initialCombatants);
        setRound(1);
        setActiveIndex(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const savePlayers = useCallback(async (allCombatants) => {
    const players = allCombatants
      .filter((c) => c.type === 'player')
      .map(({ id: cid, name, type, modifier }) => ({ id: cid, name, type, modifier: modifier ?? 0 }));
    setSaving(true);
    try {
      await fetch(`/api/encounters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ players }),
      });
    } finally {
      setSaving(false);
    }
  }, [id]);

  const handleDragEnd = ({ active, over, delta }) => {
    const DEFER_THRESHOLD = 60;
    const reordered = over && active.id !== over.id;
    if (reordered) {
      setCombatants((prev) => {
        const oldIndex = prev.findIndex((c) => c.id === active.id);
        const newIndex = prev.findIndex((c) => c.id === over.id);
        return arrayMove(prev, oldIndex, newIndex).map((c) =>
          c.id === active.id ? { ...c, deferred: false } : c
        );
      });
    } else {
      const defer = (delta?.x ?? 0) >= DEFER_THRESHOLD;
      setCombatants((prev) =>
        prev.map((c) => c.id === active.id ? { ...c, deferred: defer } : c)
      );
    }
  };

  const moveSelected = useCallback((direction) => {
    const sid = selectedIdRef.current;
    if (!sid) return;
    setCombatants((prev) => {
      const idx = prev.findIndex((c) => c.id === sid);
      if (idx === -1) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.length) return prev;
      return arrayMove(prev, idx, next);
    });
  }, []);

  const nextTurn = useCallback(() => {
    if (!started || combatants.length === 0) return;
    const next = activeIndex + 1;
    if (next >= combatants.length) {
      setRound((r) => r + 1);
      setCombatants((prev) => prev.map((c) => ({ ...c, flatFooted: false })));
      setActiveIndex(0);
    } else {
      setActiveIndex(next);
    }
  }, [started, combatants.length, activeIndex]);

  const prevTurn = useCallback(() => {
    if (!started) return;
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, [started]);

  const deselectTimerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selectedIdRef.current) {
          moveSelected(-1);
          clearTimeout(deselectTimerRef.current);
          const sid = selectedIdRef.current;
          deselectTimerRef.current = setTimeout(() => {
            if (selectedIdRef.current === sid) setSelectedId(null);
          }, 1000);
        } else {
          prevTurn();
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selectedIdRef.current) {
          moveSelected(1);
          clearTimeout(deselectTimerRef.current);
          const sid = selectedIdRef.current;
          deselectTimerRef.current = setTimeout(() => {
            if (selectedIdRef.current === sid) setSelectedId(null);
          }, 1000);
        } else {
          nextTurn();
        }
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (selectedIdRef.current) {
          clearTimeout(deselectTimerRef.current);
          setCombatants((prev) =>
            prev.map((c) => c.id === selectedIdRef.current ? { ...c, deferred: true } : c)
          );
          setSelectedId(null);
        } else {
          setCombatants((prev) =>
            prev.map((c, i) => i === activeIndexRef.current ? { ...c, deferred: true } : c)
          );
        }
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (selectedIdRef.current) {
          clearTimeout(deselectTimerRef.current);
          setCombatants((prev) =>
            prev.map((c) => c.id === selectedIdRef.current ? { ...c, deferred: false } : c)
          );
          setSelectedId(null);
        } else {
          setCombatants((prev) =>
            prev.map((c, i) => i === activeIndexRef.current ? { ...c, deferred: false } : c)
          );
        }
      }
      if (e.key === 'Escape') {
        clearTimeout(deselectTimerRef.current);
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [moveSelected, prevTurn, nextTurn]);

  const sortByInitiative = () => {
    setCombatants((prev) =>
      [...prev].sort((a, b) => {
        const totalA = Math.max(1, a.initiative + a.modifier);
        const totalB = Math.max(1, b.initiative + b.modifier);
        const diff = totalB - totalA;
        return diff !== 0 ? diff : b.modifier - a.modifier;
      })
    );
    setActiveIndex(0);
  };

  const [focusId, setFocusId] = useState(null);
  const [pickerSelection, setPickerSelection] = useState(new Set());

  const openCharPicker = () => {
    setPickerSelection(new Set());
    setShowCharPicker(true);
    if (characters === null) {
      fetch('/api/characters', { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => setCharacters(data))
        .catch(() => setCharacters([]));
    }
  };

  const togglePickerChar = (id) => {
    setPickerSelection((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const importSelected = () => {
    if (!characters || pickerSelection.size === 0) return;
    let lastId = null;
    setCombatants((prev) => {
      let next = [...prev];
      characters.filter((ch) => pickerSelection.has(ch._id)).forEach((char) => {
        const modifier = initiativeModifierFromCharacter(char);
        const c = { id: newId(), name: char.name, type: 'player', initiative: 0, modifier, flatFooted: false, statuses: [] };
        next = [...next, c];
        lastId = c.id;
      });
      savePlayers(next);
      return next;
    });
    if (lastId) setFocusId(lastId);
    setShowCharPicker(false);
  };

  const saveEncounterName = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === session?.name) {
      setEditName(session?.name ?? '');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/encounters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      setSession(data);
      setEditName(data.name);
    } finally {
      setSaving(false);
    }
  };

  const addCombatant = (type) => {
    const c = { id: newId(), name: type === 'npc' ? 'NPC' : 'Player', type, initiative: 0, modifier: 0, flatFooted: false, statuses: [] };
    setCombatants((prev) => {
      const next = [...prev, c];
      if (type === 'player') savePlayers(next);
      return next;
    });
    setFocusId(c.id);
  };

  const updateCombatant = (updated) => {
    setCombatants((prev) => {
      const old = prev.find((c) => c.id === updated.id);
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      if (old?.type === 'player' && (old?.name !== updated.name || old?.modifier !== updated.modifier)) savePlayers(next);
      return next;
    });
  };

  const deleteCombatant = (cid) => {
    setCombatants((prev) => {
      const deleted = prev.find((c) => c.id === cid);
      const next = prev.filter((c) => c.id !== cid);
      if (deleted?.type === 'player') savePlayers(next);
      return next;
    });
  };

  const resetRound = () => {
    setStarted(false);
    setActiveIndex(0);
    setRound(1);
    setCombatants((prev) => prev.map((c) => ({ ...c, deferred: false })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p style={{ color: 'var(--color-fg-muted)' }}>Loading encounter…</p>
      </div>
    );
  }

  return (
    <div onClick={() => setSelectedId(null)}>
      {/* Sub-header: back + session name */}
      <div
        className="flex items-center gap-3 px-6 py-3"
        style={{
          borderBottom: '1px solid var(--color-border-muted)',
          backgroundColor: 'var(--color-canvas-default)',
        }}
      >
        <button
          onClick={onBack}
          style={{
            color: 'var(--color-fg-muted)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            lineHeight: 1,
            padding: '2px 4px',
          }}
          title="All encounters"
        >←</button>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => saveEncounterName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur();
            if (e.key === 'Escape') { setEditName(session?.name ?? ''); e.target.blur(); }
          }}
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: '4px',
            color: 'var(--color-fg-default)',
            fontWeight: 600,
            fontSize: '14px',
            padding: '2px 6px',
            outline: 'none',
            width: '240px',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--color-border-default)'; }}
          onMouseLeave={(e) => { if (document.activeElement !== e.target) e.target.style.borderColor = 'transparent'; }}
          onFocusCapture={(e) => { e.target.style.borderColor = 'var(--color-accent-fg)'; }}
          onBlurCapture={(e) => { e.target.style.borderColor = 'transparent'; }}
        />
        {saving && <span style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>Saving…</span>}
      </div>

      <div className="px-6 py-6">
        {/* Turn controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          {/* Left: add buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => addCombatant('player')}
              title="Add Player"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border-default)', backgroundColor: 'var(--color-canvas-default)', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-fg-muted)', lineHeight: 1 }}>+</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--color-fg-default)" aria-label="Player" style={{ display: 'block' }}>
                <circle cx="12" cy="7" r="4" />
                <path d="M4 21 C4 16 8 13 12 13 C16 13 20 16 20 21" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={openCharPicker}
              title="Import from Character List"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border-default)', backgroundColor: 'var(--color-canvas-default)', cursor: 'pointer' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-fg-default)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-label="Import from characters" style={{ display: 'block' }}>
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <path d="M8 7h8M8 11h8M8 15h5" />
              </svg>
            </button>
            <button
              onClick={() => addCombatant('npc')}
              title="Add NPC"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border-default)', backgroundColor: 'var(--color-canvas-default)', cursor: 'pointer' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-fg-muted)', lineHeight: 1 }}>+</span>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" aria-label="NPC Monster" style={{ display: 'block' }}>
                <path d="M9 10 Q7 6 10 5 Q11 9 13 10 Z M23 10 Q25 6 22 5 Q21 9 19 10 Z" fill="#b06d00" />
                <ellipse cx="16" cy="18" rx="9" ry="9" fill="#b06d00" />
                <circle cx="12.5" cy="16" r="2" fill="#ffffff" />
                <circle cx="19.5" cy="16" r="2" fill="#ffffff" />
                <circle cx="13" cy="16.5" r="0.9" fill="#1f2328" />
                <circle cx="20" cy="16.5" r="0.9" fill="#1f2328" />
                <path d="M11 22 L13 20 L15 22 L17 20 L19 22 L21 20 L21 23 Q16 26 11 23 Z" fill="#ffffff" />
              </svg>
            </button>
          </div>

          {/* Center: round + turn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-fg-subtle)' }}>Round</span>
              <span style={{ fontSize: '20px', fontWeight: 700, lineHeight: 1, color: 'var(--color-accent-fg)' }}>{started ? round : 0}</span>
            </div>
            <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: 'var(--color-border-muted)' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', minWidth: 0 }}>
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-fg-subtle)', flexShrink: 0 }}>Turn</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-fg-default)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                {started ? (combatants[activeIndex]?.name ?? '—') : ''}
              </span>
            </div>
          </div>

          {/* Right: start/prev/next/sort/reset */}
          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            {!started && (
              <button
                onClick={() => setStarted(true)}
                style={{
                  ...iconBtnStyle('primary'),
                  padding: '4px 12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  gap: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Start combat"
              >
                ▶
              </button>
            )}
            <button onClick={prevTurn} style={{ ...iconBtnStyle('secondary'), opacity: started ? 1 : 0.35, cursor: started ? 'pointer' : 'default' }} title="Previous turn">←</button>
            <button onClick={nextTurn} style={{ ...iconBtnStyle('primary'), opacity: started ? 1 : 0.35, cursor: started ? 'pointer' : 'default' }} title="Next turn">→</button>
            <button onClick={sortByInitiative} style={iconBtnStyle('secondary')} title="Sort by initiative">⇅</button>
            <button onClick={resetRound} style={iconBtnStyle('danger')} title="Reset round">↺</button>
          </div>
        </div>

        {/* Combatant list */}
        {combatants.length === 0 ? (
          <div
            className="text-center py-16 rounded-xl"
            style={{ backgroundColor: 'var(--color-canvas-default)', border: '2px dashed var(--color-border-muted)' }}
          >
            <p style={{ color: 'var(--color-fg-muted)' }}>No combatants yet.</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-fg-subtle)' }}>
              Add players and NPCs using the buttons above.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={combatants.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {combatants.map((c, i) => (
                  <CombatantCard
                    key={c.id}
                    combatant={c}
                    index={i}
                    isActiveRound={started && i === activeIndex}
                    isSelected={c.id === selectedId}
                    isDeferred={!!c.deferred}
                    onSelect={(cid) => setSelectedId((prev) => prev === cid ? null : cid)}
                    onDeselect={() => setSelectedId(null)}
                    onUpdate={updateCombatant}
                    onDelete={deleteCombatant}
                    autoFocus={c.id === focusId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

      </div>

      {/* Character picker modal */}
      {showCharPicker && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowCharPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--color-canvas-default)',
              border: '1px solid var(--color-border-default)',
              borderRadius: '12px',
              padding: '20px',
              width: '360px',
              maxHeight: '480px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-fg-default)' }}>
                Import from Characters
              </h3>
              <button
                onClick={() => setShowCharPicker(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--color-fg-muted)', lineHeight: 1, padding: '2px 4px' }}
              >✕</button>
            </div>

            {/* Character list */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {characters === null ? (
                <p style={{ fontSize: '13px', color: 'var(--color-fg-muted)', textAlign: 'center', padding: '24px 0' }}>Loading…</p>
              ) : characters.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-fg-muted)', textAlign: 'center', padding: '24px 0' }}>No characters found.</p>
              ) : (
                <>
                  {/* Select all row */}
                  <label
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
                      marginBottom: '4px',
                      borderBottom: '1px solid var(--color-border-muted)',
                      paddingBottom: '10px', marginBottom: '6px',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={pickerSelection.size === characters.length}
                      ref={(el) => { if (el) el.indeterminate = pickerSelection.size > 0 && pickerSelection.size < characters.length; }}
                      onChange={() => {
                        if (pickerSelection.size === characters.length) {
                          setPickerSelection(new Set());
                        } else {
                          setPickerSelection(new Set(characters.map((c) => c._id)));
                        }
                      }}
                      style={{ width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-fg-default)' }}>Select all</span>
                  </label>

                  {characters.map((char) => {
                    const mod = initiativeModifierFromCharacter(char);
                    const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
                    const checked = pickerSelection.has(char._id);
                    return (
                      <label
                        key={char._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                          marginBottom: '2px',
                          backgroundColor: checked ? 'var(--color-accent-subtle)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (!checked) e.currentTarget.style.backgroundColor = 'var(--color-canvas-subtle)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = checked ? 'var(--color-accent-subtle)' : 'transparent'; }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePickerChar(char._id)}
                          style={{ width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-fg-default)' }}>{char.name}</div>
                          {char.classes?.length > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--color-fg-muted)' }}>
                              {char.classes.map((c) => `${c.name} ${c.level}`).join(' / ')}
                            </div>
                          )}
                        </div>
                        <span style={{
                          fontSize: '13px', fontWeight: 700,
                          color: 'var(--color-accent-fg)',
                          backgroundColor: 'var(--color-accent-subtle)',
                          border: '1px solid var(--color-accent-fg)33',
                          borderRadius: '6px', padding: '2px 8px', flexShrink: 0,
                        }}>
                          Init {modStr}
                        </span>
                      </label>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            {characters && characters.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={importSelected}
                  disabled={pickerSelection.size === 0}
                  style={{
                    padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                    border: 'none', cursor: pickerSelection.size === 0 ? 'not-allowed' : 'pointer',
                    backgroundColor: pickerSelection.size === 0 ? 'var(--color-canvas-subtle)' : 'var(--color-accent-emphasis)',
                    color: pickerSelection.size === 0 ? 'var(--color-fg-subtle)' : '#ffffff',
                  }}
                >
                  {pickerSelection.size === 0 ? 'Add selected' : `Add ${pickerSelection.size} selected`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function iconBtnStyle(variant) {
  const base = {
    fontSize: '16px',
    lineHeight: 1,
    width: '32px',
    height: '32px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid var(--color-border-muted)',
    padding: 0,
    backgroundColor: 'transparent',
  };
  if (variant === 'danger') return { ...base, color: 'var(--color-danger-fg)' };
  return { ...base, color: 'var(--color-fg-muted)' };
}
