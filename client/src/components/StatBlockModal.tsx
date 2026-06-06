import { useState } from 'react';
import './StatBlockModal.css';
import type { StatBlockData } from '../utils/statBlock';
import { statBlockToPlainText, statBlockToRtf } from '../utils/statBlock';

export function StatBlockModal({ data, name, onClose }: { data: StatBlockData; name: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(statBlockToPlainText(data)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const rtf = statBlockToRtf(data);
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^a-z0-9_\- ]/gi, '_')}_stat_block.rtf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Stat Block"
      className="stat-block-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="stat-block-dialog">
        <div className="stat-block-dialog-header">
          <span className="stat-block-dialog-title">Stat Block</span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleDownload} className="stat-block-btn">
              Download RTF
            </button>
            <button type="button" onClick={handleCopy} className="stat-block-btn">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="stat-block-btn stat-block-btn--close">
              ✕
            </button>
          </div>
        </div>
        <div className="stat-block-body">
          {data.map((para, pi) => (
            <p key={pi} className="stat-block-para">
              {para.map((seg, si) => (
                <span key={si}>
                  {seg.bold && <strong>{seg.bold}</strong>}
                  {seg.normal}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
