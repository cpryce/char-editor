import { useEffect, useRef, useState } from 'react';

interface CampaignSummary {
  _id: string;
  name: string;
  description: string;
  characterIds: string[];
  encounterIds: string[];
  playerCount: number;
  updatedAt: string;
  accessLevel?: 'owner' | 'view' | 'delegate';
  dmName?: string | null;
}

export function CampaignsPage({ onEditCampaign }: { onEditCampaign: (id: string) => void }) {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
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

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE', credentials: 'include' });
    setCampaigns((prev) => prev.filter((c) => c._id !== id));
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
          {campaigns.map((c) => {
            const isOwner = !c.accessLevel || c.accessLevel === 'owner';
            return (
            <li
              key={c._id}
              className="flex items-center rounded-lg"
              style={{ border: '1px solid var(--color-border-default)', background: 'var(--color-canvas-default)' }}
            >
              <button
                type="button"
                className="flex-1 text-left px-4 py-3"
                onClick={() => onEditCampaign(c._id)}
              >
                <span className="inline-flex items-center gap-2 font-medium text-sm" style={{ color: 'var(--color-fg-default)' }}>
                  {c.name}
                  {!isOwner && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-normal"
                      style={{
                        background: c.accessLevel === 'delegate'
                          ? 'var(--color-accent-subtle)'
                          : 'var(--color-neutral-subtle)',
                        color: c.accessLevel === 'delegate'
                          ? 'var(--color-accent-fg)'
                          : 'var(--color-fg-muted)',
                      }}
                    >
                      {c.accessLevel === 'delegate' ? 'Shared · Edit' : 'Shared · View'}
                    </span>
                  )}
                </span>
                {c.dmName && (
                  <span className="text-xs block mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>
                    DM: {c.dmName}
                  </span>
                )}
                {c.description && (
                  <span
                    className="text-xs block mt-0.5"
                    style={{
                      color: 'var(--color-fg-default)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.description}
                  </span>
                )}
                <span className="text-xs block mt-1" style={{ color: 'var(--color-fg-muted)' }}>
                  {c.playerCount} player{c.playerCount !== 1 ? 's' : ''}
                  {' · '}
                  {c.characterIds.length} character{c.characterIds.length !== 1 ? 's' : ''}
                  {' · '}
                  {c.encounterIds.length} encounter{c.encounterIds.length !== 1 ? 's' : ''}
                </span>
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleDelete(c._id, c.name)}
                  aria-label={`Delete ${c.name}`}
                  className="px-3 py-3 text-lg leading-none"
                  style={{ color: 'var(--color-fg-subtle)', background: 'none', border: 'none', cursor: 'pointer' }}
                  title="Delete campaign"
                >
                  ×
                </button>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
