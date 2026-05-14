import { describe, expect, it } from 'vitest';
import { getClassFeatures } from './classFeatures';

function featureNamesAt(level: number): string[] {
  return getClassFeatures('Paladin', level).map((f) => f.name);
}

describe('Paladin class features', () => {
  it('grants core 1st-level features and excludes 2nd-level features', () => {
    const names = featureNamesAt(1);

    expect(names).toContain('Aura of Good (Ex)');
    expect(names).toContain('Detect Evil (Sp)');
    expect(names).toContain('Smite Evil (Su)');
    expect(names).toContain('Code of Conduct');
    expect(names).not.toContain('Divine Grace (Su)');
    expect(names).not.toContain('Lay on Hands (Su)');
  });

  it('adds Divine Grace and Lay on Hands at 2nd level', () => {
    const names = featureNamesAt(2);

    expect(names).toContain('Divine Grace (Su)');
    expect(names).toContain('Lay on Hands (Su)');
    expect(names).not.toContain('Turn Undead (Su)');
  });

  it('adds Turn Undead and Spells at 4th level', () => {
    const names = featureNamesAt(4);

    expect(names).toContain('Turn Undead (Su)');
    expect(names).toContain('Spells');
    expect(names).not.toContain('Special Mount (Sp)');
  });

  it('adds Special Mount at 5th level and Remove Disease at 6th', () => {
    const levelFive = featureNamesAt(5);
    const levelSix = featureNamesAt(6);

    expect(levelFive).toContain('Special Mount (Sp)');
    expect(levelFive).not.toContain('Remove Disease (Sp)');

    expect(levelSix).toContain('Remove Disease (Sp)');
  });
});
