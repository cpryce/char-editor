import { useEffect, useRef, useState } from 'react';

interface CampaignPlayer {
  _id: string;
  name: string | null;
  avatar: string | null;
}

interface CampaignSummary {
  _id: string;
  name: string;
  description: string;
  characterIds: string[];
  encounterIds: string[];
  playerCount: number;
  players: CampaignPlayer[];
  inviteCount: number;
  ownerName: string | null;
  ownerAvatar: string | null;
  updatedAt: string;
}

export function CampaignsPage({ onEditCampaign }: { onEditCampaign: (id: string) => void }) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CampaignSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/campaigns', { credentials: 'include' })
      .then((r) => r.json())
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const campaign = await res.json();
        onEditCampaign(campaign._id);
      }
    } finally {
      setCreating(false);
      setNewName('');
    }
  }

  async function handleDelete(campaign: CampaignSummary) {
    if (campaign.players.length > 0) {
      setDeleteTarget(campaign);
      return;
    }
    await fetch(`/api/campaigns/${campaign._id}`, { method: 'DELETE', credentials: 'include' });
    setCampaigns((prev) => prev.filter((c) => c._id !== campaign._id));
  }

  async function confirmDelete(id: string) {
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE', credentials: 'include' });
    setCampaigns((prev) => prev.filter((c) => c._id !== id));
    setDeleteTarget(null);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-fg-default)' }}>
          Campaigns
        </h2>
      </div>

      <form className="flex items-center gap-2 mb-6" onSubmit={handleCreate}>
        <input
          ref={inputRef}
          type="text"
          placeholder="New campaign name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 text-sm px-3 py-1.5 rounded border"
          style={{
            border: '1px solid var(--color-border-default)',
            background: 'var(--color-canvas-default)',
            color: 'var(--color-fg-default)',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={!newName.trim() || creating}
          className="btn btn-primary"
        >
          Create Campaign
        </button>
      </form>

      {loading && (
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Loading…</p>
      )}

      {!loading && campaigns.length === 0 && (
        <div
          className="text-center py-16 rounded-xl"
          style={{ border: '2px dashed var(--color-border-muted)', color: 'var(--color-fg-muted)' }}
        >
          <p className="font-medium">No campaigns yet.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-subtle)' }}>
            Enter a name above and click Create Campaign to get started.
          </p>
        </div>
      )}

      {!loading && campaigns.length > 0 && (
        <ul className="flex flex-col gap-2">
          {campaigns.map((c) => (
            <li
              key={c._id}
              className="flex items-center rounded-lg"
              style={{ border: '1px solid var(--color-border-default)', background: 'var(--color-canvas-default)' }}
            >
              <button
                type="button"
                className="flex-1 text-left px-4 py-3 flex gap-3"
                onClick={() => onEditCampaign(c._id)}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm block" style={{ color: 'var(--color-fg-default)' }}>
                    {c.name}
                  </span>
                  {(c.ownerName || c.ownerAvatar) && (
                    <div className="flex items-center gap-1.5 mt-1">
                      {c.ownerAvatar ? (
                        <img
                          src={c.ownerAvatar}
                          alt={c.ownerName ?? ''}
                          style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <span
                          style={{
                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--color-accent-subtle)', color: 'var(--fgColor-accent)',
                            fontSize: '0.625rem', fontWeight: 600,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                          aria-hidden="true"
                        >
                          {(c.ownerName ?? '?')[0].toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                        {c.ownerName}
                      </span>
                    </div>
                  )}
                  <span className="text-xs block mt-1" style={{ color: 'var(--color-fg-muted)' }}>
                    {c.inviteCount > 0
                      ? `${c.inviteCount} player${c.inviteCount !== 1 ? 's' : ''} (${c.players.length} accepted)`
                      : 'No players invited'}
                    {' · '}
                    {c.characterIds.length} character{c.characterIds.length !== 1 ? 's' : ''}
                    {' · '}
                    {c.encounterIds.length} encounter{c.encounterIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {c.description && (
                  <span
                    className="text-xs self-start mt-0.5 ml-4 text-right"
                    style={{
                      color: 'var(--color-fg-muted)',
                      maxWidth: '40%',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.description}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c)}
                aria-label={`Delete ${c.name}`}
                className="px-3 py-3 text-lg leading-none"
                style={{ color: 'var(--color-fg-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
                title="Delete campaign"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {deleteTarget && (
        <div
          role="presentation"
          className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center"
          onClick={() => setDeleteTarget(null)}
          onKeyDown={(e) => e.key === 'Escape' && setDeleteTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-campaign-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--color-canvas-default)] border border-[var(--color-border-default)] rounded-xl p-6 w-[360px] shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
          >
            <h3 id="delete-campaign-title" className="mb-2 text-[15px] font-semibold text-[color:var(--color-fg-default)]">
              Remove campaign?
            </h3>
            <p className="mb-5 text-[13px] text-[color:var(--color-fg-muted)]">
              <strong className="text-[color:var(--color-fg-default)]">{deleteTarget.name}</strong> has {deleteTarget.players.length} invited player{deleteTarget.players.length !== 1 ? 's' : ''} and will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="py-[6px] px-4 rounded-[6px] text-[13px] font-semibold border border-[var(--color-border-default)] cursor-pointer bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDelete(deleteTarget._id)}
                className="py-[6px] px-4 rounded-[6px] text-[13px] font-semibold border-0 cursor-pointer bg-[var(--color-danger-emphasis)] text-white"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
