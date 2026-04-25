import type { CharacterDraft, AbilityScore } from '../../types/character';
import {
  ABILITY_POINT_BUY_BUDGET,
  abilityModifier,
  totalScore,
} from '../../utils/characterHelpers';
import './AbilityScoresSection.css';

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
    <div className="flex items-center gap-3 py-1 ability-score-row">
      <span className="w-8 text-xs font-semibold ability-fg-default">
        {label}
      </span>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs ability-fg-subtle">base</span>
        <input
          type="number"
          aria-label={`${label} base score`}
          value={score.base}
          min={8}
          max={18}
          onChange={(e) => onBaseChange(e.target.valueAsNumber)}
          className="ability-number-input"
        />
      </div>

      <div className="flex flex-col items-center gap-0.5 ability-racial-wrap">
        <span className="text-xs ability-fg-subtle">racial</span>
        <span
          className={[
            'text-sm font-medium ability-value ability-value--line',
            score.racial === 0
              ? 'ability-value--neutral'
              : score.racial > 0
                ? 'ability-value--positive'
                : 'ability-value--negative',
          ].join(' ')}
        >
          {score.racial === 0 ? '0' : score.racial > 0 ? `+${score.racial}` : `${score.racial}`}
        </span>
      </div>

      {isEdit && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs ability-fg-subtle">enh</span>
          <input
            type="number"
            aria-label={`${label} enhancement bonus`}
            value={score.enhancement}
            onChange={(e) => onEnhancementChange?.(e.target.valueAsNumber || 0)}
            className="ability-number-input"
          />
        </div>
      )}

      {showLevelUp && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs ability-fg-subtle">lvl up</span>
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
            className="ability-number-input"
          />
        </div>
      )}

      <div className="flex flex-col items-center ml-1">
        <span className="text-xs ability-fg-subtle">total</span>
        <span className="text-sm font-semibold ability-fg-default ability-value">
          {total}
        </span>
      </div>

      <div className="flex flex-col items-center ml-1">
        <span className="text-xs ability-fg-subtle">mod</span>
        <span
          className={[
            'text-sm font-semibold ability-value',
            mod >= 0 ? 'ability-value--positive' : 'ability-value--negative',
          ].join(' ')}
        >
          {modStr}
        </span>
      </div>

      <div className="flex items-center gap-3 ml-4 pl-4 ability-temp-divider">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs ability-fg-subtle">temp</span>
          <input
            type="number"
            aria-label={`${label} temporary score`}
            value={tempScore ?? ''}
            onChange={(e) => {
              const raw = e.target.value;
              onTempScoreChange(raw === '' ? null : e.target.valueAsNumber);
            }}
            className="ability-number-input"
          />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs ability-fg-subtle">temp mod</span>
          <span
            className={[
              'text-sm font-semibold ability-value ability-value--line',
              tempMod >= 0 ? 'ability-value--positive' : 'ability-value--negative',
            ].join(' ')}
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
  onBaseChange: (key: AbilityKey, base: number) => void;
  onLevelUpChange: (key: AbilityKey, value: number) => void;
  onEnhancementChange: (key: AbilityKey, value: number) => void;
  onTempScoreChange: (key: AbilityKey, value: number | null) => void;
}) {
  return (
    <>
      <p className="text-sm ability-fg-muted">
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
          <p className="text-xs mt-2 ability-fg-subtle">
          enh = permanent stat enhancement
        </p>
      )}
    </>
  );
}
