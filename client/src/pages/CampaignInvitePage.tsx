import { useEffect, useState } from 'react';

interface CampaignInviteInfo {
  campaignId: string;
  campaignName: string;
  dmName: string;
  access: 'view' | 'delegate';
}

interface CampaignInvitePageProps {
  token: string;
  onAccepted: () => void;
}

const ACCESS_LABELS: Record<'view' | 'delegate', string> = {
  view: 'View Only',
  delegate: 'Edit (Delegate)',
};

const ACCESS_DESCRIPTIONS: Record<'view' | 'delegate', string> = {
  view: 'You will be able to view characters in this campaign but not edit them.',
  delegate: 'You will be able to edit characters assigned to you in this campaign.',
};

export function CampaignInvitePage({ token, onAccepted }: CampaignInvitePageProps) {
  const [info, setInfo] = useState<CampaignInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/campaign-invite/${token}`, { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error('Failed to load invite');
        setInfo(await res.json() as CampaignInviteInfo);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaign-invite/${token}/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.status === 401) {
        window.location.href = `/auth/google?returnTo=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to join campaign');
      }
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join campaign');
    } finally {
      setAccepting(false);
    }
  }

  return (
    <main className="flex items-center justify-center h-screen app-loading-main">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
        <h1 className="text-2xl font-semibold app-loading-title">Campaign Invite</h1>

        {loading && (
          <p className="text-sm text-[color:var(--color-fg-muted)]">Loading invite…</p>
        )}

        {!loading && notFound && (
          <>
            <p className="text-sm text-[color:var(--color-fg-muted)]">
              This invite link is no longer valid or has already been accepted.
            </p>
            <button
              type="button"
              onClick={() => { window.location.replace('/'); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium app-google-signin"
            >
              Continue to App
            </button>
          </>
        )}

        {!loading && !notFound && info && (
          <>
            <p className="text-sm text-[color:var(--color-fg-default)]">
              <strong>{info.dmName}</strong> has invited you to join:
            </p>
            <p className="text-lg font-semibold text-[color:var(--color-fg-default)]">
              {info.campaignName}
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded font-medium"
              style={{
                background: info.access === 'delegate'
                  ? 'var(--color-accent-subtle)'
                  : 'var(--color-neutral-subtle)',
                color: info.access === 'delegate'
                  ? 'var(--color-accent-fg)'
                  : 'var(--color-fg-muted)',
              }}
            >
              {ACCESS_LABELS[info.access]}
            </span>
            <p className="text-xs text-[color:var(--color-fg-muted)]">
              {ACCESS_DESCRIPTIONS[info.access]}
            </p>
            <button
              type="button"
              disabled={accepting}
              onClick={handleAccept}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium app-google-signin"
            >
              {accepting ? 'Joining…' : 'Join Campaign'}
            </button>
          </>
        )}

        {error && (
          <>
            <p className="text-sm text-[color:var(--color-danger-fg)]">{error}</p>
            <button
              type="button"
              onClick={() => { window.location.replace('/'); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium app-google-signin"
            >
              Continue to App
            </button>
          </>
        )}
      </div>
    </main>
  );
}
