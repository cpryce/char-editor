import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface EndDelegationPopoverProps {
  characterId: string;
  /** True when the current user is the delegate (not the owner) */
  isDelegate: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onEnded: () => void;
}

export function EndDelegationPopover({
  characterId,
  isDelegate,
  anchorRef,
  onClose,
  onEnded,
}: EndDelegationPopoverProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popoverWidth = 240;
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

  async function handleEnd() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/characters/${characterId}/delegate`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'Failed to end delegation');
      }
      onEnded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end delegation');
    } finally {
      setLoading(false);
    }
  }

  if (!position) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 9999, width: 240 }}
      className="rounded border shadow-lg p-3 flex flex-col gap-2 bg-[var(--color-canvas-overlay)] border-[var(--color-border-default)]"
    >
      <p className="text-xs text-[color:var(--color-fg-muted)]">
        {isDelegate
          ? 'You are currently editing this character as a delegate.'
          : 'This character has an active delegate.'}
      </p>
      {error && <p className="text-xs text-[color:var(--color-danger-fg)]">{error}</p>}
      <button
        type="button"
        disabled={loading}
        onClick={handleEnd}
        className="px-3 py-1.5 rounded text-xs font-medium text-[color:var(--color-danger-fg)] border border-[var(--color-danger-fg)] hover:bg-[var(--color-danger-subtle)] disabled:opacity-50"
      >
        {loading ? 'Ending…' : isDelegate ? 'End delegation' : 'Revoke access'}
      </button>
    </div>,
    document.body,
  );
}
