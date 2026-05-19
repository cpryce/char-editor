import { useRef, useState } from 'react';
import type { CharacterDraft, AbilityScore } from '../../types/character';
import {
  abilityModifier,
  totalScore,
  type PointBuySystem,
  POINT_BUY_CONFIGS,
} from '../../utils/characterHelpers';
import './AbilityScoresSection.css';
import { ABILITY_KEYS } from './abilityKeys';
import type { AbilityKey } from './abilityKeys';
export type { AbilityKey };

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
  minBase = 8,
  showFlexibleBonus = false,
  isFlexibleBonusSelected = false,
  onFlexibleBonusToggle,
  mobilePane = 0,
  onNumericFocus,
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
  minBase?: number;
  showFlexibleBonus?: boolean;
  isFlexibleBonusSelected?: boolean;
  onFlexibleBonusToggle?: () => void;
  mobilePane?: 0 | 1;
  onNumericFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) {
  const total = totalScore(score);
  const mod = abilityModifier(total);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  const showLevelUp = isEdit && earnedPoints > 0;
  const availableToAdd = earnedPoints - spentPoints;

  const tempMod = abilityModifier(tempScore !== null ? tempScore : total);
  const tempModStr = tempMod >= 0 ? `+${tempMod}` : `${tempMod}`;

  const mainFields = (
    <>
      <span className="w-8 text-xs font-semibold ability-fg-default">
        {label}
      </span>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs ability-fg-subtle">base</span>
        <input
          type="number"
          aria-label={`${label} base score`}
          value={score.base}
          min={minBase}
          max={18}
          onChange={(e) => onBaseChange(e.target.valueAsNumber)}
          onFocus={onNumericFocus}
          className="ability-number-input"
        />
      </div>

      <div className="flex flex-col items-center gap-0.5 ability-racial-wrap">
        <span className="text-xs ability-fg-subtle">racial</span>
        {showFlexibleBonus ? (
          <button
            type="button"
            className={[
              'ability-racial-flex-btn',
              isFlexibleBonusSelected ? 'ability-racial-flex-btn--selected' : '',
            ].join(' ')}
            onClick={onFlexibleBonusToggle}
            title={isFlexibleBonusSelected ? 'Click to remove +2 racial bonus' : 'Click to assign +2 racial bonus here'}
          >
            <span className="ability-racial-flex-dot" aria-hidden="true" />
            <span>{isFlexibleBonusSelected ? '+2' : '0'}</span>
          </button>
        ) : (
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
        )}
      </div>

      {isEdit && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs ability-fg-subtle">enh</span>
          <input
            type="number"
            aria-label={`${label} enhancement bonus`}
            value={score.enhancement}
            onChange={(e) => onEnhancementChange?.(e.target.valueAsNumber || 0)}
            onFocus={onNumericFocus}
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
            onFocus={onNumericFocus}
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
    </>
  );

  const tempFields = (
    <>
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
          onFocus={onNumericFocus}
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
    </>
  );

  return (
    <>
      <div className="flex items-center gap-3 py-1 ability-score-row ability-score-row--desktop">
        {mainFields}
        <div className="flex items-center gap-3 ml-4 pl-4 ability-temp-divider">
          {tempFields}
        </div>
      </div>

      <div className="ability-score-row ability-score-row--mobile">
        <div
          className={[
            'ability-row-carousel',
            mobilePane === 1 ? 'ability-row-carousel--temp' : 'ability-row-carousel--main',
          ].join(' ')}
        >
          <div className="ability-row-pane">
            <div className="flex items-center gap-3 py-1 ability-row-pane-content">
              {mainFields}
            </div>
          </div>
          <div className="ability-row-pane">
            <div className="flex items-center gap-3 py-1 ability-row-pane-content">
              <span className="w-8 text-xs font-semibold ability-fg-default">{label}</span>
              <div className="flex items-center gap-3 ml-1 pl-3 ability-temp-divider">
                {tempFields}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
  pointBuySystem = 'adnd28',
  isFlexibleRace = false,
  racialAbilityChoice = null,
  onRacialAbilityChoiceChange,
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
  pointBuySystem?: PointBuySystem;
  isFlexibleRace?: boolean;
  racialAbilityChoice?: string | null;
  onRacialAbilityChoiceChange?: (key: AbilityKey | null) => void;
}) {
  const [mobilePane, setMobilePane] = useState<0 | 1>(0);
  const touchStartXRef = useRef<number | null>(null);

  function handleNumericFocus(e: React.FocusEvent<HTMLInputElement>) {
    if (window.matchMedia('(max-width: 639px)').matches) {
      e.currentTarget.select();
    }
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const delta = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (Math.abs(delta) < 35) return;
    if (delta < 0) setMobilePane(1);
    if (delta > 0) setMobilePane(0);
  }

  return (
    <>
      <p className="text-sm ability-fg-muted">
        {spentAbilityPoints} / {POINT_BUY_CONFIGS[pointBuySystem].budget} points spent · {remainingAbilityPoints} remaining
        {isEdit && earnedLevelUpPoints > 0 && (
          <> · Level-up: {spentLevelUpPoints} / {earnedLevelUpPoints} assigned</>
        )}
      </p>
      <div className="ability-mobile-carousel-controls">
        <button
          type="button"
          onClick={() => setMobilePane(0)}
          className={mobilePane === 0 ? 'ability-mobile-carousel-tab ability-mobile-carousel-tab--active' : 'ability-mobile-carousel-tab'}
        >
          Scores
        </button>
        <button
          type="button"
          onClick={() => setMobilePane(1)}
          className={mobilePane === 1 ? 'ability-mobile-carousel-tab ability-mobile-carousel-tab--active' : 'ability-mobile-carousel-tab'}
        >
          Temp
        </button>
      </div>
      <div className="ability-mobile-swipe-wrap">
        <button
          type="button"
          onClick={() => setMobilePane((pane) => (pane === 0 ? 1 : 0))}
          aria-label={mobilePane === 0 ? 'Show temporary ability stats' : 'Show core ability stats'}
          className={[
            'ability-mobile-swipe-control',
            mobilePane === 0 ? 'ability-mobile-swipe-control--right' : 'ability-mobile-swipe-control--left',
          ].join(' ')}
        >
          {mobilePane === 0 ? '>' : '<'}
        </button>

        <div className="flex flex-col gap-2" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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
              minBase={POINT_BUY_CONFIGS[pointBuySystem].minBase}
              showFlexibleBonus={isFlexibleRace}
              isFlexibleBonusSelected={racialAbilityChoice === key}
              mobilePane={mobilePane}
              onNumericFocus={handleNumericFocus}
              onFlexibleBonusToggle={() =>
                onRacialAbilityChoiceChange?.(racialAbilityChoice === key ? null : key)
              }
            />
          ))}
        </div>
      </div>
      {isFlexibleRace && (
        <p className="text-xs mt-1 ability-fg-muted">
          Click the racial column to assign your +2 racial bonus to one ability score.
        </p>
      )}
      {isEdit && (
          <p className="text-xs mt-2 ability-fg-subtle">
          enh = permanent stat enhancement
        </p>
      )}
    </>
  );
}
