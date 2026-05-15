import { useEffect, useRef, useState, useCallback } from 'react';
import './CampaignEditor.css';

interface CharSummary {
  _id: string;
  name: string;
  race?: string;
  classes?: Array<{ name: string; level: number }>;
}

interface CampaignDetail {
  _id: string;
  name: string;
  description: string;
  characters: CharSummary[];
}

export function CampaignEditor({
  campaignId,
  onBack,
  onStartEncounter,
}: {
  campaignId: string;
  onBack: () => void;
  onStartEncounter: (sessionId: string) => void;
}) {
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [allChars, setAllChars] = useState<CharSummary[]>([]);
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [charPickerSelection, setCharPickerSelection] = useState<Set<string>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {    fetch(`/api/campaigns/${campaignId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: CampaignDetail) => {
        setCampaign(data);
        setName(data.name);
        setDescription(data.description ?? '');
      });
  }, [campaignId]);

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
    if (description === (campaign?.description ?? '')) return;
    fetch(`/api/campaigns/${campaignId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
  }

  async function openCharPicker() {
    const res = await fetch('/api/characters', { credentials: 'include' });
    setAllChars(await res.json());
    setCharPickerSelection(new Set());
    setShowCharPicker(true);
  }

  async function startEncounter() {
    if (!campaign) return;
    // Create a new encounter session
    const createRes = await fetch('/api/encounters', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: campaign.name }),
    });
    const session = await createRes.json();
    if (!createRes.ok) return;

    // Add campaign characters as players
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
    setShowCharPicker(false);
    setCharPickerSelection(new Set());
  }

  async function removeCharacter(charId: string) {
    const res = await fetch(`/api/campaigns/${campaignId}/characters/${charId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setCampaign(await res.json());
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

  return (
    <div className="campaign-editor p-6 max-w-3xl">
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

      {/* Description */}
      <section className="campaign-editor-section">
        <label className="campaign-editor-section-label" htmlFor="campaign-desc">
          Description
        </label>
        <textarea
          id="campaign-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          placeholder="Campaign notes, story overview…"
          className="campaign-editor-description"
          rows={4}
        />
      </section>

      {/* Characters */}
      <section className="campaign-editor-section">
        <div className="campaign-editor-section-header">
          <h3 className="campaign-editor-section-title">Characters</h3>
          <div className="flex items-center gap-2">
            <button type="button" className="stat-block-open-btn" onClick={openCharPicker}>
              + Add Character
            </button>
            <button
              type="button"
              className="stat-block-open-btn"
              onClick={startEncounter}
              disabled={campaign.characters.length === 0}
              title={campaign.characters.length === 0 ? 'Add characters first' : 'Start an encounter with these characters'}
            >
              + Encounter
            </button>
          </div>
        </div>
        {campaign.characters.length === 0 ? (
          <p className="campaign-editor-empty">No characters assigned yet.</p>
        ) : (
          <ul className="campaign-editor-list">
            {campaign.characters.map((c) => (
              <li key={c._id} className="campaign-editor-list-item">
                <span className="campaign-editor-list-name">{c.name}</span>
                <span className="campaign-editor-list-meta">{charMeta(c)}</span>
                <button
                  type="button"
                  className="campaign-editor-remove-btn"
                  onClick={() => removeCharacter(c._id)}
                  aria-label={`Remove ${c.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Character picker */}
      {showCharPicker && (
        <div className="campaign-picker-overlay" onClick={() => setShowCharPicker(false)}>
          <div className="campaign-picker-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="campaign-picker-header">
              <span>Add Characters</span>
              <button type="button" className="campaign-picker-close" aria-label="Close" onClick={() => setShowCharPicker(false)}>✕</button>
            </div>
            <div className="campaign-picker-body">
              {availableChars.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-fg-muted)', textAlign: 'center', padding: '24px 0' }}>
                  All your characters are already in this campaign.
                </p>
              ) : (
                <>
                  {/* Select all */}
                  <label className="campaign-picker-row campaign-picker-row--select-all">
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      checked={charPickerSelection.size === availableChars.length}
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
            {availableChars.length > 0 && (
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
          </div>
        </div>
      )}
    </div>
  );
}
