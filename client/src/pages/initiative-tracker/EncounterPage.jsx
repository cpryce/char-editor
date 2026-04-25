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
              <svg
                width="24"
                height="24"
                viewBox="0 0 33.866668 33.866668"
                aria-label="NPC Dragon"
                style={{ display: 'block' }}
                fill="var(--color-fg-default)"
              >
                <path d="m16.643 1.4178s-0.0885 0.57481 0.08842 2.3439c-5.8821-2.4324-8.3586-1.6363-14.02 0.79611 16.717-1.9902 20.565 8.1376 20.565 8.1376s-0.53075-0.221-1.0172-0.5748c-0.13268 0.26536-1.7248 0.90652-2.6536 0.42003-0.82659-0.49622-0.96205-0.97432-0.92865-1.769 0.0339-0.80645 0.79611-1.6584 0.79611-1.6584s-3.0074-3.1843-8.4914-3.4497c-5.484-0.26536-7.8136 4.9023-7.8136 4.9023s0.81485-0.11481 2.0642 0.09526c-2.3882 3.3612-1.8133 8.2703-1.8133 8.2703s0.43128-0.66336 1.3711-1.4152c0.26536 3.1401 2.2997 5.7051 4.6879 8.3587-0.35381-1.1056-0.088489-2.2113 0.30955-3.4497-4.9975-4.688-4.2015-8.0049-3.0958-10.216-1.1499 5.086 1.2384 7.3414 3.8035 9.1989 2.5651 1.8575 3.3547 3.9993 3.4386 4.8428 0.15798 1.5885-0.32796 2.3366-0.88453 2.8195-0.71008 0.61604-1.4041 0.82912-2.8968 1.3046 1.1789 0.98546 3.2486 0.64821 4.1774 0.33862-0.06635 0.71868-0.57291 1.3642-1.17 1.6738 2.6536 0.61916 13.566-0.27647 12.24-6.7335-1.3268-6.457-8.6683-9.1107-9.4643-9.3318-0.53071 1.0172-0.92879 1.5037-2.1229 2.8747-1.4595-0.92875-2.167-4.5995-2.167-4.5995s-2.0788-0.26529-3.4056-0.39797c-0.247-0.92182 2.4324-3.0958 2.4324-3.0958l-1.2382-1.4152h3.0958v0.46432l-1.5259 0.02207s0.19904 0.5086 0.50862 0.88452c-1.1057 0.75184-1.9018 2.3883-1.9018 2.3883s1.3269 0.22106 2.919 0.39796c-0.44226 1.5037 0.48639 2.5208 1.3709 3.7149 0.66339-0.79607 2.3469-3.0422 5.7494-2.742 3.0074 0.26536 3.538 2.919 4.5995 4.5553 1.2826-0.57494 2.6979-0.5749 3.0517-0.53068 0.35381 0.04423 0.48649 0.13262 1.5479 2.3881 3.9803-3.1401 1.6805-7.8722 0.70752-9.3316-0.39804 1.6806-2.6977 1.592-2.6977 1.592l-4.6438-7.2973-0.088423 1.3711zm11.269 12.97h1.6262s0.07027 1.7199-0.12519 2.1265c-0.32836-0.7349-0.79742-1.3994-1.5011-2.1265z" />
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
