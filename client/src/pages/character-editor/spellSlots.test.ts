import { describe, expect, it } from 'vitest';
import { formatSpellsPerDay } from './spellSlots';

describe('formatSpellsPerDay', () => {
  it('does not add domain slot to zero-level spells', () => {
    expect(formatSpellsPerDay(6, 0, true)).toBe('6');
  });

  it('adds domain slot for spell levels above zero', () => {
    expect(formatSpellsPerDay(6, 1, true)).toBe('6 +1');
  });

  it('returns unavailable marker for unavailable spell levels', () => {
    expect(formatSpellsPerDay(-1, 5, true)).toBe('—');
  });
});
