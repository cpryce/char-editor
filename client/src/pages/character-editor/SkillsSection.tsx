import type { CharacterDraft } from '../../types/character';
import {
  abilityModifier,
  totalScore,
  computeSkillBonus,
  maxClassSkillRanks,
  maxCrossClassSkillRanks,
} from '../../utils/characterHelpers';
import './SkillsSection.css';

export function SkillsSection({
  skills, abilityScores, onChange, totalSkillPoints, spentPoints, totalLevel,
}: {
  skills: CharacterDraft['skills'];
  abilityScores: CharacterDraft['abilityScores'];
  onChange: (s: CharacterDraft['skills']) => void;
  totalSkillPoints: number;
  spentPoints: number;
  totalLevel: number;
}) {
  const maxClassRanks = maxClassSkillRanks(totalLevel);
  const maxCrossRanks = maxCrossClassSkillRanks(totalLevel);
  const isOverspent = spentPoints > totalSkillPoints;

  function updateRanks(i: number, ranks: number) {
    const target = skills[i];
    if (!target) return;

    const rankCap = target.classSkill ? maxClassRanks : maxCrossRanks;
    const normalizedRequested = Number.isFinite(ranks)
      ? Math.max(0, target.classSkill ? Math.floor(ranks) : Math.floor(ranks * 2) / 2)
      : 0;
    const finalRanks = Math.min(rankCap, normalizedRequested);

    const updated = skills.map((sk, idx) => {
      if (idx !== i) return sk;
      const updated = {
        ...sk,
        ranks: sk.classSkill ? Math.floor(finalRanks) : Math.floor(finalRanks * 2) / 2,
      };
      return { ...updated, bonus: computeSkillBonus(updated, abilityScores) };
    });
    onChange(updated);
  }

  function updateMiscBonus(i: number, miscBonus: number) {
    const updated = skills.map((sk, idx) => {
      if (idx !== i) return sk;
      const next = { ...sk, miscBonus: Number.isFinite(miscBonus) ? Math.trunc(miscBonus) : 0 };
      return { ...next, bonus: computeSkillBonus(next, abilityScores) };
    });
    onChange(updated);
  }

  function resetRanks() {
    const updated = skills.map((sk) => {
      const next = { ...sk, ranks: 0 };
      return { ...next, bonus: computeSkillBonus(next, abilityScores) };
    });
    onChange(updated);
  }

  return (
    <div className="skills-table-wrapper rounded overflow-hidden">
      <div
        className={[
          'px-3 py-2 text-xs flex items-center justify-end gap-2 skills-toolbar',
          isOverspent ? 'skills-toolbar--overspent' : '',
        ].join(' ')}
      >
        <span>
          {spentPoints} / {totalSkillPoints} points spent · {Math.max(0, totalSkillPoints - spentPoints)} remaining · max ranks: class {maxClassRanks}, cross-class {maxCrossRanks}
        </span>
        <button
          type="button"
          onClick={resetRanks}
          title="Reset all ranks to 0"
          aria-label="Reset all ranks to 0"
          className="inline-flex items-center justify-center skills-reset-btn"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20 11a8 8 0 1 0-2.34 5.66"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 4v7h-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <table aria-label="Skills" className="w-full text-xs border-collapse">
        <thead>
          <tr className="skills-thead-row">
            {['', 'Skill', 'Key Ability', 'Class', 'Score', 'Bonus', 'Ranks', 'Misc Bonus'].map((h) => (
              <th
                key={h}
                aria-label={h === '' ? 'Trained only' : undefined}
                className={`px-3 py-2 font-medium skills-th ${h === 'Score' || h === 'Bonus' ? 'text-right' : 'text-left'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((sk, i) => {
            const bonus = computeSkillBonus(sk, abilityScores);
            const abilityBonus = sk.keyAbility
              ? abilityModifier(totalScore(abilityScores[sk.keyAbility as keyof CharacterDraft['abilityScores']]))
              : 0;
            const bonusStr = `${bonus}`;
            const abilityBonusStr = abilityBonus >= 0 ? `+${abilityBonus}` : `${abilityBonus}`;
            const rankCap = sk.classSkill ? maxClassRanks : maxCrossRanks;
            const isRankOverMax = sk.ranks > rankCap;
            return (
              <tr
                key={sk.name}
                className={i % 2 === 0 ? 'skills-row-even' : 'skills-row-odd'}
              >
                <td className="px-3 py-1 text-center skills-td-muted">
                  {sk.trainedOnly ? 'T' : ''}
                </td>
                <td className="px-3 py-1 skills-td-default">{sk.name}</td>
                <td className="px-3 py-1 skills-td-muted">
                  {sk.keyAbility ? sk.keyAbility.slice(0, 3).toUpperCase() : '0'}
                </td>
                <td className="px-3 py-1 text-center skills-td-muted">
                  <input
                    type="checkbox"
                    aria-label={`${sk.name} is class skill`}
                    checked={sk.classSkill}
                    readOnly
                    className="skills-checkbox"
                  />
                </td>
                <td className="px-3 py-1 text-right font-semibold skills-td-default">
                  {bonusStr}
                </td>
                <td className="px-3 py-1 text-right skills-td-default">
                  {abilityBonusStr}
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    aria-label={`${sk.name} ranks`}
                    value={sk.ranks}
                    min={0}
                    step={sk.classSkill ? 1 : 0.5}
                    onChange={(e) => updateRanks(i, Number(e.target.value))}
                    className={[
                      'skills-number-input skills-number-input--ranks',
                      isRankOverMax ? 'skills-number-input--over-max' : '',
                    ].join(' ')}
                  />
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    aria-label={`${sk.name} misc bonus`}
                    value={sk.miscBonus}
                    onChange={(e) => updateMiscBonus(i, Number(e.target.value))}
                    className="skills-number-input skills-number-input--misc"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
