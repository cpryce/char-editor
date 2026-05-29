import { useState } from 'react';
import './TurnUndeadPage.css';

// Table: Turning Check Result → offset from cleric level
const TURNING_TABLE: { minRoll: number; maxRoll: number | null; offset: number }[] = [
  { minRoll: -Infinity, maxRoll: 0,  offset: -4 },
  { minRoll: 1,         maxRoll: 3,  offset: -3 },
  { minRoll: 4,         maxRoll: 6,  offset: -2 },
  { minRoll: 7,         maxRoll: 9,  offset: -1 },
  { minRoll: 10,        maxRoll: 12, offset:  0 },
  { minRoll: 13,        maxRoll: 15, offset:  1 },
  { minRoll: 16,        maxRoll: 18, offset:  2 },
  { minRoll: 19,        maxRoll: 21, offset:  3 },
  { minRoll: 22,        maxRoll: null, offset: 4 },
];

function getTurningOffset(turningCheckResult: number): number {
  for (const row of TURNING_TABLE) {
    const aboveMin = turningCheckResult >= row.minRoll;
    const belowMax = row.maxRoll === null || turningCheckResult <= row.maxRoll;
    if (aboveMin && belowMax) return row.offset;
  }
  return -4;
}

interface TurnResult {
  turningCheckResult: number;
  maxHD: number;
  totalHDAffected: number;
  destroys: boolean;
}

function calcTurnUndead(
  clericLevel: number,
  chaBonus: number,
  d20Roll: number,
  twod6Roll: number,
): TurnResult {
  const turningCheckResult = d20Roll + chaBonus;
  const offset = getTurningOffset(turningCheckResult);
  const maxHD = clericLevel + offset;
  const totalHDAffected = twod6Roll + clericLevel + chaBonus;
  // Destroy if cleric level is at least twice the max HD (undead with HD ≤ maxHD)
  const destroys = clericLevel >= maxHD * 2;
  return { turningCheckResult, maxHD, totalHDAffected, destroys };
}

export function TurnUndeadPage() {
  const [clericLevel, setClericLevel] = useState<string>('1');
  const [chaBonus, setChaBonus] = useState<string>('0');
  const [d20Roll, setD20Roll] = useState<string>('');
  const [twod6Roll, setTwod6Roll] = useState<string>('');
  const [result, setResult] = useState<TurnResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const level = parseInt(clericLevel, 10);
    const cha = parseInt(chaBonus, 10);
    const d20 = parseInt(d20Roll, 10);
    const dice2d6 = parseInt(twod6Roll, 10);

    if (isNaN(level) || level < 1 || level > 20) {
      setError('Effective cleric level must be between 1 and 20.');
      return;
    }
    if (isNaN(cha) || cha < -5 || cha > 10) {
      setError('Charisma bonus must be between -5 and +10.');
      return;
    }
    if (isNaN(d20) || d20 < 1 || d20 > 20) {
      setError('d20 roll must be between 1 and 20.');
      return;
    }
    if (isNaN(dice2d6) || dice2d6 < 2 || dice2d6 > 12) {
      setError('2d6 result must be between 2 and 12.');
      return;
    }

    setResult(calcTurnUndead(level, cha, d20, dice2d6));
  }

  const timesPerDay = result
    ? null
    : null;
  void timesPerDay;

  return (
    <div className="turn-undead-page p-6">
      <div className="turn-undead-page-header">
        <h1 className="turn-undead-page-title">Turn Undead Calculator</h1>
      </div>

      <div className="turn-undead-body">
        <div className="turn-undead-main">
          <form className="turn-undead-form" onSubmit={handleCalculate}>
            <div className="turn-undead-form-grid">
              <div className="turn-undead-field">
                <label htmlFor="cleric-level" className="turn-undead-label">
                  Effective Cleric Level
                </label>
                <input
                  id="cleric-level"
                  type="number"
                  min={1}
                  max={20}
                  className="turn-undead-input"
                  value={clericLevel}
                  onChange={(e) => setClericLevel(e.target.value)}
                />
              </div>

              <div className="turn-undead-field">
                <label htmlFor="cha-bonus" className="turn-undead-label">
                  Cha Bonus
                </label>
                <input
                  id="cha-bonus"
                  type="number"
                  min={-5}
                  max={10}
                  className="turn-undead-input"
                  value={chaBonus}
                  onChange={(e) => setChaBonus(e.target.value)}
                />
              </div>

              <div className="turn-undead-field">
                <label htmlFor="d20-roll" className="turn-undead-label">
                  Turn Check (d20)
                </label>
                <input
                  id="d20-roll"
                  type="number"
                  min={1}
                  max={20}
                  placeholder="1–20"
                  className="turn-undead-input"
                  value={d20Roll}
                  onChange={(e) => setD20Roll(e.target.value)}
                />
              </div>

              <div className="turn-undead-field">
                <label htmlFor="twod6-roll" className="turn-undead-label">
                  Turn Damage (2d6)
                </label>
                <input
                  id="twod6-roll"
                  type="number"
                  min={2}
                  max={12}
                  placeholder="2–12"
                  className="turn-undead-input"
                  value={twod6Roll}
                  onChange={(e) => setTwod6Roll(e.target.value)}
                />
              </div>

              <div className="turn-undead-field turn-undead-field--btn">
                <span className="turn-undead-label" aria-hidden="true">&nbsp;</span>
                <button type="submit" className="turn-undead-btn">
                  Calculate
                </button>
              </div>
            </div>

            {error && <p className="turn-undead-error">{error}</p>}
          </form>

          {result && (
            <div className="turn-undead-results">
              <div className="turn-undead-result-card">
                <div className="turn-undead-result-label">Turning check result</div>
                <div className="turn-undead-result-value">{result.turningCheckResult}</div>
              </div>

              <div className="turn-undead-result-card turn-undead-result-card--highlight">
                <div className="turn-undead-result-label">
                  Most powerful undead affected
                </div>
                <div className="turn-undead-result-value">
                  {result.maxHD <= 0
                    ? 'None (check too low)'
                    : `Up to ${result.maxHD} HD`}
                </div>
                {result.maxHD > 0 && result.destroys && (
                  <div className="turn-undead-result-note turn-undead-result-note--destroy">
                    Destroys undead (cleric level ≥ 2× undead HD)
                  </div>
                )}
                {result.maxHD > 0 && !result.destroys && (
                  <div className="turn-undead-result-note">
                    Turns undead
                  </div>
                )}
              </div>

              <div className="turn-undead-result-card turn-undead-result-card--highlight">
                <div className="turn-undead-result-label">Total HD affected</div>
                <div className="turn-undead-result-value">{result.totalHDAffected}</div>
                <div className="turn-undead-result-note">
                  2d6 ({twod6Roll}) + level ({clericLevel}) + Cha bonus ({chaBonus})
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="turn-undead-rail">
          <section className="turn-undead-rail-section">
            <h2 className="turn-undead-rail-heading">How It Works</h2>
            <p className="turn-undead-rail-text">
              Roll a <strong>turning check</strong> (d20 + Charisma bonus) to find the
              maximum Hit Dice of undead you can affect. Then roll{' '}
              <strong>2d6 + cleric level + Charisma bonus</strong> to find how many
              total Hit Dice you affect.
            </p>
          </section>

          <section className="turn-undead-rail-section">
            <h2 className="turn-undead-rail-heading">Turning Check Table</h2>
            <table className="turn-undead-table">
              <thead>
                <tr>
                  <th>Check result</th>
                  <th>Max undead HD</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>0 or lower</td><td>Level − 4</td></tr>
                <tr><td>1–3</td><td>Level − 3</td></tr>
                <tr><td>4–6</td><td>Level − 2</td></tr>
                <tr><td>7–9</td><td>Level − 1</td></tr>
                <tr><td>10–12</td><td>Level</td></tr>
                <tr><td>13–15</td><td>Level + 1</td></tr>
                <tr><td>16–18</td><td>Level + 2</td></tr>
                <tr><td>19–21</td><td>Level + 3</td></tr>
                <tr><td>22+</td><td>Level + 4</td></tr>
              </tbody>
            </table>
          </section>

          <section className="turn-undead-rail-section">
            <h2 className="turn-undead-rail-heading">Destroying vs. Turning</h2>
            <p className="turn-undead-rail-text">
              If your cleric level is at least twice the undead's Hit Dice, you{' '}
              <strong>destroy</strong> them outright instead of merely turning them.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
