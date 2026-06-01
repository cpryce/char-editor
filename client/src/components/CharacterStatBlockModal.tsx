import { useState, useEffect } from 'react';
import type { CharacterDraft } from '../types/character';
import type { CustomClass } from '../types/customClass';
import type { CustomClassLookup } from '../utils/characterHelpers';
import { abilityModifier } from '../utils/characterHelpers';
import { generateStatBlock, statBlockToPlainText, statBlockToRtf } from '../utils/statBlock';
import { deriveAbilityTotals, deriveCombatStats } from '../pages/CharacterEditor';
import type { AbilityKey } from '../pages/character-editor/AbilityScoresSection';
import '../pages/CharacterEditor.css';

interface FullCharData extends CharacterDraft {
  characterCustomClasses: CustomClass[];
}

export function CharacterStatBlockModal({
  charId,
  campaignId,
  onClose,
}: {
  charId: string;
  campaignId: string;
  onClose: () => void;
}) {
  const [statBlockData, setStatBlockData] = useState<ReturnType<typeof generateStatBlock> | null>(null);
  const [charName, setCharName] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    setStatBlockData(null);
    fetch(`/api/campaigns/${campaignId}/characters/${charId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((raw: FullCharData) => {
        const toEntry = (cc: CustomClass): CustomClassLookup => ({
          babProgression: cc.babProgression,
          fortitudeSave: cc.fortitudeSave,
          reflexSave: cc.reflexSave,
          willSave: cc.willSave,
          classSkills: cc.classSkills,
          features: cc.features,
          skillsAtFirst: cc.skillsAtFirst,
          skillsPerLevel: cc.skillsPerLevel,
        });
        const customClassMap = new Map<string, CustomClassLookup>(
          (raw.characterCustomClasses ?? []).map((cc) => [cc.name, toEntry(cc)]),
        );
        const abilityTotals = deriveAbilityTotals(raw.abilityScores);
        const abilityMods = Object.fromEntries(
          (Object.keys(abilityTotals) as AbilityKey[]).map((k) => [k, abilityModifier(abilityTotals[k])]),
        ) as Record<AbilityKey, number>;
        const combatStats = deriveCombatStats({
          combat: raw.combat,
          inventory: raw.inventory,
          feats: raw.feats,
          classes: raw.classes,
          size: raw.size,
          abilityMods,
          baseSpeed: raw.baseSpeed ?? '30',
          customClassMap,
          customFeats: [],
        });
        setCharName(raw.name);
        setStatBlockData(generateStatBlock(raw, combatStats));
      })
      .finally(() => setLoading(false));
  }, [charId, campaignId]);

  function handleCopy() {
    if (!statBlockData) return;
    void navigator.clipboard.writeText(statBlockToPlainText(statBlockData)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (!statBlockData) return;
    const rtf = statBlockToRtf(statBlockData);
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${charName.replace(/[^a-z0-9_\- ]/gi, '_')}_stat_block.rtf`;
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
            {statBlockData && (
              <>
                <button type="button" onClick={handleDownload} className="stat-block-btn">
                  Download RTF
                </button>
                <button type="button" onClick={handleCopy} className="stat-block-btn">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="stat-block-btn stat-block-btn--close">
              ✕
            </button>
          </div>
        </div>
        <div className="stat-block-body">
          {loading && (
            <p style={{ color: 'var(--color-fg-muted)', fontSize: 14 }}>Loading…</p>
          )}
          {statBlockData && statBlockData.map((para, pi) => (
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
