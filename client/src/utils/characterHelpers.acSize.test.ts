import { describe, expect, it } from 'vitest';
import { defaultAcSizeModifier, newCharacterDraft } from './characterHelpers';

describe('armor class size modifiers', () => {
  it('returns SRD size modifier defaults', () => {
    expect(defaultAcSizeModifier('Small')).toBe(1);
    expect(defaultAcSizeModifier('Medium')).toBe(0);
    expect(defaultAcSizeModifier('Large')).toBe(-1);
  });

  it('seeds new drafts with a size AC modifier', () => {
    const draft = newCharacterDraft();
    expect(draft.combat.armorClass.size).toBe(defaultAcSizeModifier(draft.size));
  });
});
