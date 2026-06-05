import { useEffect, useRef, useState, useCallback } from 'react';
import './CampaignEditor.css';
import { NewCharacterForm } from '../components/NewCharacterForm';
import { DelegatePopover } from '../components/DelegatePopover';
import { type PointBuySystem } from '../utils/characterHelpers';

const DEFAULT_ABILITY_SCORE = { base: 10, racial: 0, enhancement: 0, misc: 0, temp: null, tempMod: null, levelUp: 0 };

interface CharSummary {
  _id: string;
  name: string;
  race?: string;
  classes?: Array<{ name: string; level: number }>;
  owner?: string | null;
  ownerName?: string | null;
  delegatedTo?: string | null;
  delegateName?: string | null;
  pendingInviteEmail?: string | null;
  initiativeModifier?: number;
}

interface UserSummary {
  _id: string;
  name?: string;
  email: string;
  avatar?: string;
}

interface CampaignDetail {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  owner: UserSummary | null;
  characters: CharSummary[];
  players: UserSummary[];
  pointBuySystem?: string;
}

const POINT_BUY_LABELS: Record<PointBuySystem, string> = {
  adnd28: '28-point',
  adnd32: '32-point',
  pathfinder10: 'Low Fantasy (10-point)',
  pathfinder15: 'Standard Fantasy (15-point)',
  pathfinder20: 'High Fantasy (20-point)',
  pathfinder25: 'Epic Fantasy (25-point)',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function CampaignEditor({
  campaignId,
  userId,
  onBack,
  onStartEncounter,
  onEditCharacter,
  onPointBuySystemChange,
}: {
  campaignId: string;
  userId: string;
  onBack: () => void;
  onStartEncounter: (sessionId: string) => void;
  onEditCharacter: (id: string) => void;
  onPointBuySystemChange?: (system: PointBuySystem | null) => void;
}) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [name, setName] = useState('');
  const [allChars, setAllChars] = useState<CharSummary[]>([]);
  const [showCharDropdown, setShowCharDropdown] = useState(false);
  const [charDropdownTab, setCharDropdownTab] = useState<'import' | 'new'>('import');
  const [charPickerSelection, setCharPickerSelection] = useState<Set<string>>(new Set());
  const [showEncounterDropdown, setShowEncounterDropdown] = useState(false);
  const [encounterNewName, setEncounterNewName] = useState('');
  const [showPointBuyDropdown, setShowPointBuyDropdown] = useState(false);
  const [delegatePopoverCharId, setDelegatePopoverCharId] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);
  const delegateBtnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const selectAllRef = useRef<HTMLInputElement>(null);
  const charDropdownRef = useRef<HTMLDivElement>(null);
  const encounterDropdownRef = useRef<HTMLDivElement>(null);
  const pointBuyDropdownRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Failed to load campaign (${res.status})`);
      }

      const data = await res.json() as CampaignDetail;
      setCampaign(data);
      setName(data.name);
      onPointBuySystemChange?.(data.pointBuySystem as PointBuySystem ?? null);
    } catch (error) {
      console.error('Failed to load campaign editor data:', error);
    }
  }, [campaignId, onPointBuySystemChange]);

  useEffect(() => { load(); }, [load]);

  function saveName() {
    if (!name.trim() || name.trim() === campaign?.name) return;
    fetch(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    }).then((r) => r.json()).then((updated) => {
      setCampaign((prev) => prev ? { ...prev, name: updated.name } : prev);
    });
  }

  function savePointBuySystem(system: PointBuySystem | null) {
    fetch(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointBuySystem: system ?? null }),
    }).then((r) => r.json()).then((updated) => {
      setCampaign((prev) => prev ? { ...prev, pointBuySystem: updated.pointBuySystem } : prev);
      onPointBuySystemChange?.(system);
    });
  }

  useEffect(() => {
    if (!showCharDropdown) return;
    function handleMouseDown(e: MouseEvent) {
      if (charDropdownRef.current && !charDropdownRef.current.contains(e.target as Node)) {
        setShowCharDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showCharDropdown]);

  useEffect(() => {
    if (!showEncounterDropdown) return;
    function handleMouseDown(e: MouseEvent) {
      if (encounterDropdownRef.current && !encounterDropdownRef.current.contains(e.target as Node)) {
        setShowEncounterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showEncounterDropdown]);

  useEffect(() => {
    if (!showPointBuyDropdown) return;
    function handleMouseDown(e: MouseEvent) {
      if (pointBuyDropdownRef.current && !pointBuyDropdownRef.current.contains(e.target as Node)) {
        setShowPointBuyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showPointBuyDropdown]);

  async function openCharDropdown() {
    if (showCharDropdown) { setShowCharDropdown(false); return; }
    const res = await fetch('/api/characters', { credentials: 'include' });
    setAllChars(await res.json());
    setCharPickerSelection(new Set());
    setCharDropdownTab('import');
    setShowCharDropdown(true);
  }

  function openEncounterDropdown() {
    if (showEncounterDropdown) { setShowEncounterDropdown(false); return; }
    setEncounterNewName('');
    setShowEncounterDropdown(true);
  }

  async function createEncounter() {
    if (!campaign || !encounterNewName.trim()) return;
    const createRes = await fetch('/api/encounters', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: encounterNewName.trim() }),
    });
    const session = await createRes.json();
    if (!createRes.ok) return;

    const players = campaign.characters.map((char, i) => ({
      id: `c-${Date.now()}-${i}`,
      name: char.name,
      type: 'player',
      modifier: char.initiativeModifier ?? 0,
    }));
    await fetch(`/api/encounters/${session.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ players }),
    });

    setShowEncounterDropdown(false);
    setEncounterNewName('');
    onStartEncounter(session.id);
  }

  function togglePickerChar(id: string) {
    setCharPickerSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function addSelectedCharacters() {
    if (charPickerSelection.size === 0) return;
    let latest = campaign!;
    for (const charId of charPickerSelection) {
      const res = await fetch(`/api/campaigns/${campaignId}/characters`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: charId }),
      });
      if (res.ok) latest = await res.json();
    }
    setCampaign(latest);
    setShowCharDropdown(false);
    setCharPickerSelection(new Set());
  }

  async function removeCharacter(charId: string) {
    const res = await fetch(`/api/campaigns/${campaignId}/characters/${charId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setCampaign(await res.json());
  }

  async function createNewCharacter(charName: string, className: string, hitDie: number) {
    const charRes = await fetch('/api/characters', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: charName || `New ${className}`,
        gender: 'Male',
        race: 'Human',
        alignment: 'True Neutral',
        classes: [{ name: className, level: 1, hitDieType: hitDie, hpRolled: [hitDie] }],
        abilityScores: {
          strength:     { ...DEFAULT_ABILITY_SCORE },
          dexterity:    { ...DEFAULT_ABILITY_SCORE },
          constitution: { ...DEFAULT_ABILITY_SCORE },
          intelligence: { ...DEFAULT_ABILITY_SCORE },
          wisdom:       { ...DEFAULT_ABILITY_SCORE },
          charisma:     { ...DEFAULT_ABILITY_SCORE },
        },
        hitPoints: { max: hitDie, current: hitDie, nonlethal: 0 },
      }),
    });
    if (!charRes.ok) return;
    const newChar = await charRes.json();
    const addRes = await fetch(`/api/campaigns/${campaignId}/characters`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId: newChar._id }),
    });
    if (!addRes.ok) return;
    setCampaign(await addRes.json());
    setShowCharDropdown(false);
  }

  if (!campaign) {
    return <p className="p-6 text-sm" style={{ color: 'var(--color-fg-muted)' }}>Loading…</p>;
  }

  const assignedCharIds = new Set(campaign.characters.map((c) => c._id));
  const availableChars  = allChars.filter((c) => !assignedCharIds.has(c._id));

  // Keep select-all checkbox indeterminate state in sync
  if (selectAllRef.current) {
    selectAllRef.current.indeterminate =
      charPickerSelection.size > 0 && charPickerSelection.size < availableChars.length;
  }

  function charMeta(c: CharSummary) {
    const parts: string[] = [];
    if (c.race) parts.push(c.race);
    if (c.classes?.length) parts.push(c.classes.map((cl) => `${cl.name} ${cl.level}`).join(', '));
    return parts.join(' · ');
  }

  function classLabel(classes?: CharSummary['classes']) {
    return classes?.map((cl) => cl.name).join(', ') ?? '—';
  }

  function totalLevel(classes?: CharSummary['classes']) {
    return classes?.reduce((sum, cl) => sum + cl.level, 0) ?? 0;
  }

  return (
    <div className="campaign-editor p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBack} className="campaign-editor-back-btn" aria-label="Back to campaigns">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M20 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 7L6 12L11 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          className="campaign-editor-name-input"
          aria-label="Campaign name"
        />
      </div>

      {/* Two-column body */}
      <div className="campaign-editor-body">

        {/* ── Main column ── */}
        <main className="campaign-editor-main">

          {/* Characters */}
          <section className="campaign-editor-section">
        <div className="campaign-editor-section-header">
          <h3 className="campaign-editor-section-title">Characters</h3>
          <div className="flex items-center gap-2">
            {/* Select-style dropdown with tabbed picker */}
            <div style={{ position: 'relative' }} ref={charDropdownRef}>
              <button
                type="button"
                className="btn btn-default"
                onClick={openCharDropdown}
                aria-haspopup="true"
                aria-expanded={showCharDropdown}
              >
                Characters
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ marginLeft: '4px' }}>
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showCharDropdown && (
                <div className="char-dropdown">
                  <div className="char-dropdown-tabs">
                    <button
                      type="button"
                      className={`char-dropdown-tab${charDropdownTab === 'import' ? ' char-dropdown-tab--active' : ''}`}
                      onClick={() => setCharDropdownTab('import')}
                    >
                      Import
                    </button>
                    <button
                      type="button"
                      className={`char-dropdown-tab${charDropdownTab === 'new' ? ' char-dropdown-tab--active' : ''}`}
                      onClick={() => setCharDropdownTab('new')}
                    >
                      New
                    </button>
                  </div>
                  {charDropdownTab === 'import' && (
                    <div className="char-dropdown-body">
                      {availableChars.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--color-fg-muted)', textAlign: 'center', padding: '24px 0' }}>
                          All characters are already in this campaign.
                        </p>
                      ) : (
                        <>
                          <label className="campaign-picker-row campaign-picker-row--select-all">
                            <input
                              type="checkbox"
                              ref={selectAllRef}
                              checked={charPickerSelection.size === availableChars.length && availableChars.length > 0}
                              onChange={() => {
                                if (charPickerSelection.size === availableChars.length) {
                                  setCharPickerSelection(new Set());
                                } else {
                                  setCharPickerSelection(new Set(availableChars.map((c) => c._id)));
                                }
                              }}
                              className="campaign-picker-checkbox"
                            />
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-fg-default)' }}>Select all</span>
                          </label>
                          {availableChars.map((c) => {
                            const checked = charPickerSelection.has(c._id);
                            return (
                              <label
                                key={c._id}
                                className={['campaign-picker-row', checked ? 'campaign-picker-row--checked' : ''].join(' ')}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => togglePickerChar(c._id)}
                                  className="campaign-picker-checkbox"
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-fg-default)' }}>{c.name}</div>
                                  {charMeta(c) && (
                                    <div style={{ fontSize: '11px', color: 'var(--color-fg-muted)' }}>{charMeta(c)}</div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                  {charDropdownTab === 'import' && availableChars.length > 0 && (
                    <div className="campaign-picker-footer">
                      <button
                        type="button"
                        onClick={addSelectedCharacters}
                        disabled={charPickerSelection.size === 0}
                        className="campaign-picker-add-btn"
                      >
                        {charPickerSelection.size === 0 ? 'Add selected' : `Add ${charPickerSelection.size} selected`}
                      </button>
                    </div>
                  )}
                  {charDropdownTab === 'new' && (
                    <NewCharacterForm onCreate={createNewCharacter} />
                  )}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }} ref={encounterDropdownRef}>
              <button
                type="button"
                className="btn btn-default"
                onClick={openEncounterDropdown}
                aria-haspopup="true"
                aria-expanded={showEncounterDropdown}
                disabled={campaign.characters.length === 0}
                title={campaign.characters.length === 0 ? 'Add characters first' : undefined}
              >
                + Encounter
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ marginLeft: '4px' }}>
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showEncounterDropdown && (
                <div className="char-dropdown">
                  <div style={{ padding: '10px 12px 6px' }}>
                    <input
                      type="text"
                      value={encounterNewName}
                      onChange={(e) => setEncounterNewName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') createEncounter(); }}
                      placeholder="Encounter name"
                      className="char-new-name-input"
                      autoFocus
                    />
                  </div>
                  <div className="campaign-picker-footer">
                    <button
                      type="button"
                      className="campaign-picker-add-btn"
                      disabled={!encounterNewName.trim()}
                      onClick={createEncounter}
                    >
                      Create encounter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {campaign.characters.length === 0 ? (
          <p className="campaign-editor-empty">No characters assigned yet.</p>
        ) : (
          <div className="rounded overflow-hidden border border-[var(--color-border-default)]">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--color-canvas-subtle)]">
                  <th className="px-4 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)] hidden sm:table-cell">Owner</th>
                  <th className="px-4 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)] hidden sm:table-cell">Race</th>
                  <th className="px-4 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">Class</th>
                  <th className="px-4 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)] hidden min-[480px]:table-cell">Level</th>
                  <th className="border-b border-[var(--color-border-default)] hidden md:table-cell" />
                </tr>
              </thead>
              <tbody>
                {campaign.characters.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-[var(--color-border-muted)] last:border-b-0 cursor-pointer hover:bg-[var(--color-canvas-subtle)] bg-[var(--color-canvas-default)]"
                    onClick={() => onEditCharacter(c._id)}
                  >
                    <td className="px-4 py-2 font-medium text-[color:var(--color-fg-default)]">
                      <span className="inline-flex items-center gap-2">
                        {c.name}
                        {c.delegatedTo && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-accent-subtle)] text-[color:var(--color-accent-fg)]">
                            Delegated
                          </span>
                        )}
                        {c.pendingInviteEmail && !c.delegatedTo && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-attention-subtle)] text-[color:var(--color-attention-fg)]">
                            Invite pending
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-default)] hidden sm:table-cell">{c.delegatedTo && c.delegateName ? c.delegateName : (c.ownerName ?? c.owner ?? '—')}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-default)] hidden sm:table-cell">{c.race ?? '—'}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-default)]">{classLabel(c.classes)}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-default)] hidden min-[480px]:table-cell">{totalLevel(c.classes)}</td>
                    <td className="px-4 py-2 text-right hidden md:table-cell">
                      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {c.owner === userId && !c.delegatedTo && (
                          <>
                            <button
                              ref={(el) => { if (el) delegateBtnRefs.current.set(c._id, el); else delegateBtnRefs.current.delete(c._id); }}
                              type="button"
                              className="campaign-editor-remove-btn inline-flex items-center justify-center w-6 h-6"
                              onClick={(e) => { e.stopPropagation(); setDelegatePopoverCharId(delegatePopoverCharId === c._id ? null : c._id); }}
                              aria-label={`Delegate ${c.name}`}
                              title="Delegate character"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm5 5a5 5 0 0 0-10 0h10z"/>
                                <path d="M13 7l2 2-2 2M11 9h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                              </svg>
                            </button>
                            {delegatePopoverCharId === c._id && (
                              <DelegatePopover
                                characterId={c._id}
                                pendingInviteEmail={c.pendingInviteEmail}
                                anchorRef={{ current: delegateBtnRefs.current.get(c._id) ?? null }}
                                onClose={() => setDelegatePopoverCharId(null)}
                                onInviteSent={(email) => {
                                  setCampaign((prev) => prev ? {
                                    ...prev,
                                    characters: prev.characters.map((ch) =>
                                      ch._id === c._id ? { ...ch, pendingInviteEmail: email } : ch,
                                    ),
                                  } : prev);
                                }}
                                onInviteCancelled={() => {
                                  setCampaign((prev) => prev ? {
                                    ...prev,
                                    characters: prev.characters.map((ch) =>
                                      ch._id === c._id ? { ...ch, pendingInviteEmail: null } : ch,
                                    ),
                                  } : prev);
                                }}
                              />
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          className="campaign-editor-remove-btn inline-flex items-center justify-center w-6 h-6"
                          onClick={(e) => { e.stopPropagation(); removeCharacter(c._id); }}
                          aria-label={`Remove ${c.name}`}
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M4 2H1V4H15V2H12V0H4V2Z"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M3 6H13V16H3V6ZM7 9H9V13H7V9Z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

        </main>{/* ── Right rail ── */}
        <aside className={`campaign-editor-rail${railOpen ? ' campaign-editor-rail--open' : ''}`}>
          {/* Sticky toggle tab – anchored to left edge of the sliding rail */}
          <button
            type="button"
            onClick={() => setRailOpen((o) => !o)}
            aria-label={railOpen ? 'Close campaign info panel' : 'Open campaign info panel'}
            className="campaign-editor-sticky-toggle"
          >
            {railOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                <path d="M10 5l5 7-5 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
                <path d="M14 5l-5 7 5 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <div className="campaign-editor-rail-inner">
          <button
            type="button"
            onClick={() => setRailOpen(false)}
            aria-label="Close campaign info panel"
            className="campaign-editor-rail-close self-end mb-3 w-7 h-7 rounded-md items-center justify-center border border-[var(--color-border-default)] hover:bg-[var(--color-canvas-subtle)] text-[color:var(--color-fg-muted)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          {/* About */}
          <section className="campaign-rail-section">
            <div className="campaign-rail-meta">
              <div>Created {formatDate(campaign.createdAt)}</div>
              {campaign.owner && (
                <div>by {campaign.owner.name || campaign.owner.email}</div>
              )}
            </div>
          </section>

          {/* Players */}
          <section className="campaign-rail-section">
            <h3 className="subsection-header">Players</h3>
            {campaign.players.length === 0 ? (
              <p className="campaign-editor-empty">No players yet.</p>
            ) : (
              <div className="campaign-rail-players">
                {campaign.players.map((player) => (
                  <div key={player._id} className="campaign-rail-player">
                    {player.avatar ? (
                      <img
                        src={player.avatar}
                        alt={player.name || player.email}
                        className="campaign-rail-avatar"
                      />
                    ) : (
                      <div className="campaign-rail-avatar campaign-rail-avatar--initials">
                        {(player.name || player.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="campaign-rail-player-name">{player.name || player.email}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Rules */}
          <section className="campaign-rail-section">
            <h3 className="subsection-header">Rules</h3>
            <p className="campaign-rail-field-label">Point Buy System</p>
            <div className="point-buy-dropdown-wrap" ref={pointBuyDropdownRef}>
              <button
                type="button"
                className="point-buy-trigger"
                onClick={() => setShowPointBuyDropdown((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={showPointBuyDropdown}
              >
                <span>{campaign.pointBuySystem ? POINT_BUY_LABELS[campaign.pointBuySystem as PointBuySystem] : '— Use global setting —'}</span>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showPointBuyDropdown && (
                <ul className="point-buy-menu" role="listbox">
                  <li role="option" aria-selected={!campaign.pointBuySystem}>
                    <a href="#" onClick={(e) => { e.preventDefault(); savePointBuySystem(null); setShowPointBuyDropdown(false); }}
                      className={!campaign.pointBuySystem ? 'point-buy-menu__item--active' : ''}>
                      — Use global setting —
                    </a>
                  </li>
                  <li className="point-buy-menu__group" aria-disabled="true">AD&amp;D Standard</li>
                  {(['adnd28', 'adnd32'] as PointBuySystem[]).map((sys) => (
                    <li key={sys} role="option" aria-selected={campaign.pointBuySystem === sys}>
                      <a href="#" onClick={(e) => { e.preventDefault(); savePointBuySystem(sys); setShowPointBuyDropdown(false); }}
                        className={campaign.pointBuySystem === sys ? 'point-buy-menu__item--active' : ''}>
                        {POINT_BUY_LABELS[sys]}
                      </a>
                    </li>
                  ))}
                  <li className="point-buy-menu__group" aria-disabled="true">Pathfinder</li>
                  {(['pathfinder10', 'pathfinder15', 'pathfinder20', 'pathfinder25'] as PointBuySystem[]).map((sys) => (
                    <li key={sys} role="option" aria-selected={campaign.pointBuySystem === sys}>
                      <a href="#" onClick={(e) => { e.preventDefault(); savePointBuySystem(sys); setShowPointBuyDropdown(false); }}
                        className={campaign.pointBuySystem === sys ? 'point-buy-menu__item--active' : ''}>
                        {POINT_BUY_LABELS[sys]}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="campaign-rail-help-text">Overrides the global setting for characters created in this campaign.</p>
          </section>

          </div>{/* campaign-editor-rail-inner */}
        </aside>
        {railOpen && (
          <div
            className="campaign-editor-rail-backdrop"
            onClick={() => setRailOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
