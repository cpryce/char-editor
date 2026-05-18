import { useEffect, useState } from 'react';

interface InviteInfo {
  characterId: string;
  characterName: string;
  ownerName: string;
}

interface InvitePageProps {
  token: string;
  onAccepted: () => void;
}

export function InvitePage({ token, onAccepted }: InvitePageProps) {
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/invite/${token}`, { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error('Failed to load invite');
        setInfo(await res.json() as InviteInfo);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${token}/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.status === 401) {
        // Not logged in — redirect to Google auth, come back after
        window.location.href = `/auth/google?returnTo=${encodeURIComponent(window.location.pathname)}`;
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to accept invite');
      }
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  }

  return (
    <main className="flex items-center justify-center h-screen app-loading-main">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center px-6">
        <h1 className="text-2xl font-semibold app-loading-title">Character Invite</h1>

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
              <strong>{info.ownerName}</strong> has invited you to take over editing of:
            </p>
            <p className="text-lg font-semibold text-[color:var(--color-fg-default)]">
              {info.characterName}
            </p>
            <p className="text-xs text-[color:var(--color-fg-muted)]">
              The original owner will retain ownership and can revoke access at any time.
            </p>
            <button
              type="button"
              disabled={accepting}
              onClick={handleAccept}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium app-google-signin"
            >
              {accepting ? 'Accepting…' : 'Accept & Edit Character'}
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
