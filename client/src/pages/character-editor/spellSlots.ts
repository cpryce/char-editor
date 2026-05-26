export function formatSpellsPerDay(baseSlots: number, spellLevel: number, domainSlots: boolean): string {
  if (baseSlots === -1) return '—';
  if (domainSlots && spellLevel > 0) return `${baseSlots} +1`;
  return String(baseSlots);
}
