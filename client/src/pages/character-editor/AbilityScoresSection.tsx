import type { CharacterDraft, AbilityScore } from '../../types/character';
import {
  ABILITY_POINT_BUY_BUDGET,
  abilityModifier,
  totalScore,
} from '../../utils/characterHelpers';

export const ABILITY_KEYS = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const;
export type AbilityKey = (typeof ABILITY_KEYS)[number];

const ABILITY_LABELS: Record<AbilityKey, string> = {
  strength: 'STR',
  dexterity: 'DEX',
  constitution: 'CON',
  intelligence: 'INT',
  wisdom: 'WIS',
  charisma: 'CHA',
};

function AbilityScoreRow({
  label,
  score,
  inputStyle,
  onBaseChange,
  isEdit = false,
  levelUp = 0,
  onLevelUpChange,
  earnedPoints = 0,
  spentPoints = 0,
  onEnhancementChange,
  tempScore,
  onTempScoreChange,
}: {
  label: string;
  score: AbilityScore;
  inputStyle: React.CSSProperties;
  onBaseChange: (base: number) => void;
  isEdit?: boolean;
  levelUp?: number;
  onLevelUpChange?: (value: number) => void;
  earnedPoints?: number;
  spentPoints?: number;
  onEnhancementChange?: (value: number) => void;
  tempScore: number | null;
  onTempScoreChange: (v: number | null) => void;
}) {
  const total = totalScore(score);
  const mod = abilityModifier(total);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  const showLevelUp = isEdit && earnedPoints > 0;
  const availableToAdd = earnedPoints - spentPoints;

  const tempMod = abilityModifier(tempScore !== null ? tempScore : total);
  const tempModStr = tempMod >= 0 ? `+${tempMod}` : `${tempMod}`;

  return (
    <div
      className="flex items-center gap-3 py-1"
      style={{ borderBottom: '1px solid var(--color-border-muted)' }}
    >
      <span className="w-8 text-xs font-semibold" style={{ color: 'var(--color-fg-default)' }}>
        {label}
      </span>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>base</span>
        <input
          type="number"
          aria-label={`${label} base score`}
          value={score.base}
          min={8}
          max={18}
          onChange={(e) => onBaseChange(e.target.valueAsNumber)}
          style={{ ...inputStyle, width: 56, textAlign: 'center', padding: '2px 4px' }}
        />
      </div>

      <div className="flex flex-col items-center gap-0.5" style={{ minWidth: 44 }}>
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>racial</span>
        <span
          className="text-sm font-medium"
          style={{
            color: score.racial === 0 ? 'var(--color-fg-subtle)' : score.racial > 0 ? 'var(--color-success-fg)' : 'var(--color-danger-fg)',
            minWidth: 28,
            textAlign: 'center',
            lineHeight: '1.6rem',
          }}
        >
          {score.racial === 0 ? '0' : score.racial > 0 ? `+${score.racial}` : `${score.racial}`}
        </span>
      </div>

      {isEdit && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>enh</span>
          <input
            type="number"
            aria-label={`${label} enhancement bonus`}
            value={score.enhancement}
            onChange={(e) => onEnhancementChange?.(e.target.valueAsNumber || 0)}
            style={{ ...inputStyle, width: 56, textAlign: 'center', padding: '2px 4px' }}
          />
        </div>
      )}

      {showLevelUp && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>lvl up</span>
          <input
            type="number"
            aria-label={`${label} level-up bonus`}
            value={levelUp}
            min={0}
            max={levelUp + availableToAdd}
            onChange={(e) => {
              const next = Math.max(0, Math.min(levelUp + availableToAdd, e.target.valueAsNumber || 0));
              onLevelUpChange?.(next);
            }}
            style={{ ...inputStyle, width: 56, textAlign: 'center', padding: '2px 4px' }}
          />
        </div>
      )}

      <div className="flex flex-col items-center ml-1">
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>total</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-fg-default)', minWidth: 28, textAlign: 'center' }}>
          {total}
        </span>
      </div>

      <div className="flex flex-col items-center ml-1">
        <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>mod</span>
        <span
          className="text-sm font-semibold"
          style={{ color: mod >= 0 ? 'var(--color-success-fg)' : 'var(--color-danger-fg)', minWidth: 28, textAlign: 'center' }}
        >
          {modStr}
        </span>
      </div>

      <div className="flex items-center gap-3 ml-4 pl-4" style={{ borderLeft: '1px solid var(--color-border-muted)' }}>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>temp</span>
          <input
            type="number"
            aria-label={`${label} temporary score`}
            value={tempScore ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              onTempScoreChange(raw === '' ? null : e.target.valueAsNumber);
            }}
            style={{ ...inputStyle, width: 56, textAlign: 'center', padding: '2px 4px' }}
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs" style={{ color: 'var(--color-fg-subtle)' }}>temp mod</span>
          <span
            className="text-sm font-semibold"
            style={{
              color: tempMod >= 0 ? 'var(--color-success-fg)' : 'var(--color-danger-fg)',
              minWidth: 28,
              textAlign: 'center',
              lineHeight: '1.6rem',
            }}
          >
            {tempModStr}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AbilityScoresSection({
  abilityScores,
  isEdit,
  spentAbilityPoints,
  remainingAbilityPoints,
  earnedLevelUpPoints,
  spentLevelUpPoints,
  inputStyle,
  onBaseChange,
  onLevelUpChange,
  onEnhancementChange,
  onTempScoreChange,
}: {
  abilityScores: CharacterDraft['abilityScores'];
  isEdit: boolean;
  spentAbilityPoints: number;
  remainingAbilityPoints: number;
  earnedLevelUpPoints: number;
  spentLevelUpPoints: number;
  inputStyle: React.CSSProperties;
  onBaseChange: (key: AbilityKey, base: number) => void;
  onLevelUpChange: (key: AbilityKey, value: number) => void;
  onEnhancementChange: (key: AbilityKey, value: number) => void;
  onTempScoreChange: (key: AbilityKey, value: number | null) => void;
}) {
  return (
    <>
      <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
        {spentAbilityPoints} / {ABILITY_POINT_BUY_BUDGET} points spent · {remainingAbilityPoints} remaining
        {isEdit && earnedLevelUpPoints > 0 && (
          <> · Level-up: {spentLevelUpPoints} / {earnedLevelUpPoints} assigned</>
        )}
      </p>
      <div className="flex flex-col gap-2">
        {ABILITY_KEYS.map((key) => (
          <AbilityScoreRow
            key={key}
            label={ABILITY_LABELS[key]}
            score={abilityScores[key]}
            inputStyle={inputStyle}
            onBaseChange={(base) => onBaseChange(key, base)}
            isEdit={isEdit}
            levelUp={abilityScores[key].levelUp ?? 0}
            onLevelUpChange={(value) => onLevelUpChange(key, value)}
            earnedPoints={earnedLevelUpPoints}
            spentPoints={spentLevelUpPoints}
            onEnhancementChange={(value) => onEnhancementChange(key, value)}
            tempScore={abilityScores[key].temp}
            onTempScoreChange={(value) => onTempScoreChange(key, value)}
          />
        ))}
      </div>
      {isEdit && (
        <p className="text-xs mt-2" style={{ color: 'var(--color-fg-subtle)' }}>
          enh = permanent stat enhancement
        </p>
      )}
    </>
  );
}
