import { useEffect, useRef, useState, useCallback } from 'react';
import './CampaignEditor.css';
import { NewCharacterForm } from '../components/NewCharacterForm';
import { type PointBuySystem } from '../utils/characterHelpers';

const DEFAULT_ABILITY_SCORE = { base: 10, racial: 0, enhancement: 0, misc: 0, temp: null, tempMod: null, levelUp: 0 };

interface CharSummary {
  _id: string;
  name: string;
  race?: string;
  classes?: Array<{ name: string; level: number }>;
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function CampaignEditor({
  campaignId,
  onBack,
  onStartEncounter,
  onEditCharacter,
  onPointBuySystemChange,
}: {
  campaignId: string;
  onBack: () => void;
  onStartEncounter: (sessionId: string) => void;
  onEditCharacter: (id: string) => void;
  onPointBuySystemChange?: (system: PointBuySystem | null) => void;
}) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allChars, setAllChars] = useState<CharSummary[]>([]);
  const [showCharDropdown, setShowCharDropdown] = useState(false);
  const [charDropdownTab, setCharDropdownTab] = useState<'import' | 'new'>('import');
  const [charPickerSelection, setCharPickerSelection] = useState<Set<string>>(new Set());
  const [showEncounterDropdown, setShowEncounterDropdown] = useState(false);
  const [encounterNewName, setEncounterNewName] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const charDropdownRef = useRef<HTMLDivElement>(null);
  const encounterDropdownRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {    fetch(`/api/campaigns/${campaignId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: CampaignDetail) => {
        setCampaign(data);
        setName(data.name);
        setDescription(data.description ?? '');
        onPointBuySystemChange?.(data.pointBuySystem as PointBuySystem ?? null);
      });
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

  function saveDescription() {
    setEditingDescription(false);
    if (description === (campaign?.description ?? '')) return;
    fetch(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    }).then((r) => r.json()).then((updated) => {
      setCampaign((prev) => prev ? { ...prev, description: updated.description ?? '' } : prev);
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
      modifier: 0,
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
      latest = await res.json();
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
                  {['Name', 'Race', 'Class', 'Level'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                      {h}
                    </th>
                  ))}
                  <th className="border-b border-[var(--color-border-default)]" />
                </tr>
              </thead>
              <tbody>
                {campaign.characters.map((c) => (
                  <tr
                    key={c._id}
                    className="border-b border-[var(--color-border-muted)] last:border-b-0 cursor-pointer hover:bg-[var(--color-canvas-subtle)] bg-[var(--color-canvas-default)]"
                    onClick={() => onEditCharacter(c._id)}
                  >
                    <td className="px-4 py-2 font-medium text-[color:var(--color-fg-default)]">{c.name}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-default)]">{c.race ?? '—'}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-default)]">{classLabel(c.classes)}</td>
                    <td className="px-4 py-2 text-[color:var(--color-fg-default)]">{totalLevel(c.classes)}</td>
                    <td className="px-4 py-2 text-right">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

        </main>{/* ── Right rail ── */}
        <aside className="campaign-editor-rail">

          {/* About */}
          <section className="campaign-rail-section">
            <div className="campaign-rail-section-header">
              <h3 className="subsection-header">About</h3>
              {campaign.description && !editingDescription && (
                <button
                  type="button"
                  className="campaign-rail-edit-btn"
                  onClick={() => setEditingDescription(true)}
                  aria-label="Edit description"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354l-1.086-1.086ZM11.189 6.25 9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.25.25 0 0 0 .108-.064L11.19 6.25Z"/>
                  </svg>
                </button>
              )}
            </div>
            {!campaign.description || editingDescription ? (
              <>
                <p className="campaign-rail-field-label">Description</p>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={saveDescription}
                  placeholder="Add a description…"
                  className="campaign-editor-description"
                  rows={4}
                  autoFocus={editingDescription}
                />
              </>
            ) : (
              <>
                <p className="campaign-rail-field-label">Description</p>
                <p className="campaign-rail-description" onClick={() => setEditingDescription(true)}>
                  {campaign.description}
                </p>
              </>
            )}
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
            <select
              value={campaign.pointBuySystem ?? ''}
              onChange={(e) => {
                const val = e.target.value as PointBuySystem | '';
                savePointBuySystem(val === '' ? null : val);
              }}
              className="campaign-editor-description"
              style={{ height: 'auto', padding: '4px 8px', fontSize: '13px' }}
            >
              <option value="">— Use global setting —</option>
              <optgroup label="AD&amp;D Standard">
                <option value="adnd28">28-point</option>
                <option value="adnd32">32-point</option>
              </optgroup>
              <optgroup label="Pathfinder">
                <option value="pathfinder10">Low Fantasy (10-point)</option>
                <option value="pathfinder15">Standard Fantasy (15-point)</option>
                <option value="pathfinder20">High Fantasy (20-point)</option>
                <option value="pathfinder25">Epic Fantasy (25-point)</option>
              </optgroup>
            </select>
          </section>

        </aside>
      </div>
    </div>
  );
}
