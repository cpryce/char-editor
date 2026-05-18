import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DelegatePopoverProps {
  characterId: string;
  pendingInviteEmail?: string | null;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onInviteSent: (email: string) => void;
  onInviteCancelled: () => void;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function DelegatePopover({
  characterId,
  pendingInviteEmail,
  anchorRef,
  onClose,
  onInviteSent,
  onInviteCancelled,
}: DelegatePopoverProps) {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [reCopied, setReCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popoverWidth = 288; // w-72
    setPosition({
      top: rect.bottom + 4,
      left: Math.min(rect.right - popoverWidth, window.innerWidth - popoverWidth - 8),
    });
  }, [anchorRef]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [anchorRef, onClose]);

  async function handleCopyUrl() {
    setError(null);
    try {
      const res = await fetch(`/api/characters/${characterId}/invite`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to create invite');
      }
      const { token } = await res.json() as { token: string };
      const url = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      onInviteSent(email);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invite');
    }
  }

  async function handleRecopyUrl() {
    setError(null);
    try {
      const res = await fetch(`/api/characters/${characterId}/invite`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to retrieve invite link');
      const { token } = await res.json() as { token: string };
      const url = `${window.location.origin}/invite/${token}`;
      await navigator.clipboard.writeText(url);
      setReCopied(true);
      setTimeout(() => setReCopied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy link');
    }
  }

  async function handleCancelInvite() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/characters/${characterId}/invite`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to cancel invite');
      onInviteCancelled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel invite');
    } finally {
      setCancelling(false);
    }
  }

  return createPortal(
    <div
      ref={popoverRef}
      style={position ? { position: 'fixed', top: position.top, left: position.left } : { visibility: 'hidden', position: 'fixed' }}
      className="z-[9999] w-72 rounded border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] shadow-lg p-3 flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[color:var(--color-fg-default)]">
          Delegate Character
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg-default)] text-xs px-1"
        >
          ✕
        </button>
      </div>

      {pendingInviteEmail ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[color:var(--color-fg-muted)]">
            Pending invite sent to <strong>{pendingInviteEmail}</strong>.
          </p>
          <button
            type="button"
            onClick={handleRecopyUrl}
            className="btn btn-secondary text-xs h-7"
          >
            {reCopied ? '✓ Copied!' : 'Copy Link'}
          </button>
          <button
            type="button"
            disabled={cancelling}
            onClick={handleCancelInvite}
            className="btn btn-danger text-xs h-7"
          >
            {cancelling ? 'Cancelling…' : 'Cancel Invite'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-[color:var(--color-fg-muted)]">
            Enter the player's email address, then copy the invite URL to send manually.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="player@example.com"
            className="px-2 py-1 text-sm rounded border border-[var(--color-border-default)] bg-[var(--color-canvas-default)] text-[color:var(--color-fg-default)] focus:outline-none focus:border-[var(--color-accent-fg)]"
          />
          <button
            type="button"
            disabled={!isValidEmail(email)}
            onClick={handleCopyUrl}
            className="btn btn-primary text-xs h-7 disabled:opacity-40"
          >
            {copied ? '✓ Copied!' : 'Copy Invite URL'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-[color:var(--color-danger-fg)]">{error}</p>
      )}
    </div>,
    document.body,
  );
}
