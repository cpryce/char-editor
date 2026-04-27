// Special materials per d20 SRD: https://www.d20srd.org/srd/specialMaterials.htm

export const MATERIAL_KEYS = [
  'adamantine',
  'cold-iron',
  'darkwood',
  'dragonhide',
  'mithral',
  'alchemical-silver',
] as const;

export type MaterialKey = (typeof MATERIAL_KEYS)[number];

export interface MaterialEffect {
  label: string;
  /** Added to the base ACP value (ACP is ≤ 0; positive delta reduces the penalty, min 0). */
  acpDelta: number;
  /** Added to the base ASF percentage (negative = lower failure chance). */
  asfDelta: number;
  /** Multiplied against base weight (1 = no change, 0.5 = half). */
  weightMultiplier: number;
  /** Added to the numeric maxDexBonus (only meaningful for armor; 0 = no change). */
  maxDexDelta: number;
  /** Short note shown next to the selector. */
  note: string;
}

/**
 * Effects keyed by material. These are deltas/multipliers applied on top of the
 * base catalog stats when a material is chosen.  All values represent adjustments
 * to armor/shield stats; for weapons only weightMultiplier is relevant.
 */
export const MATERIALS: Record<MaterialKey, MaterialEffect> = {
  adamantine: {
    label: 'Adamantine',
    acpDelta: 1,
    asfDelta: 0,
    weightMultiplier: 1,
    maxDexDelta: 0,
    note: 'Armor: ACP −1, DR 1–3/−. Weapons: bypasses hardness < 20. Always masterwork.',
  },
  mithral: {
    label: 'Mithral',
    acpDelta: 3,
    asfDelta: -10,
    weightMultiplier: 0.5,
    maxDexDelta: 2,
    note: 'Armor: ACP −3 (min 0), ASF −10%, Max Dex +2, weight ×½. Weapons: weight ×½. Always masterwork.',
  },
  darkwood: {
    label: 'Darkwood',
    acpDelta: 2,
    asfDelta: 0,
    weightMultiplier: 0.5,
    maxDexDelta: 0,
    note: 'Wooden/shield items only. ACP −2, weight ×½. Always masterwork.',
  },
  dragonhide: {
    label: 'Dragonhide',
    acpDelta: 0,
    asfDelta: 0,
    weightMultiplier: 1,
    maxDexDelta: 0,
    note: 'Armor/shields only. Druids may wear without penalty. Always masterwork.',
  },
  'cold-iron': {
    label: 'Cold Iron',
    acpDelta: 0,
    asfDelta: 0,
    weightMultiplier: 1,
    maxDexDelta: 0,
    note: 'Weapons only. Effective against fey creatures.',
  },
  'alchemical-silver': {
    label: 'Alch. Silver',
    acpDelta: 0,
    asfDelta: 0,
    weightMultiplier: 1,
    maxDexDelta: 0,
    note: 'Weapons only. −1 damage on hit. Effective against lycanthropes.',
  },
};

/** Materials valid for armor and shields. */
export const ARMOR_MATERIAL_KEYS: ReadonlyArray<MaterialKey> = [
  'adamantine', 'mithral', 'darkwood', 'dragonhide',
];

/** Materials valid for weapons. */
export const WEAPON_MATERIAL_KEYS: ReadonlyArray<MaterialKey> = [
  'adamantine', 'mithral', 'darkwood', 'cold-iron', 'alchemical-silver',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse "15 lb." → 15; returns null if unparseable. */
function parseWeight(weight: string): number | null {
  const m = weight.match(/^([\d.]+)\s*lb\./);
  return m && m[1] ? parseFloat(m[1]) : null;
}

/** Apply a weight multiplier to a weight string like "15 lb." → "7.5 lb." */
export function applyWeightMultiplier(weight: string, mult: number): string {
  if (mult === 1 || !weight || weight === '—') return weight;
  const lbs = parseWeight(weight);
  if (lbs === null) return weight;
  const result = Math.round(lbs * mult * 2) / 2; // round to nearest 0.5
  return `${result} lb.`;
}

/** Apply an ACP delta: ACP is ≤ 0; delta is positive to reduce the penalty; result capped at 0. */
export function applyAcpDelta(acp: number, delta: number): number {
  return Math.min(0, acp + delta);
}

/** Apply an ASF delta to a "25%" string → "15%" (clamped to 0%). */
export function applyAsfDelta(asf: string, delta: number): string {
  if (delta === 0 || !asf) return asf;
  const m = asf.match(/^(\d+)%$/);
  if (!m || !m[1]) return asf;
  const result = Math.max(0, parseInt(m[1]) + delta);
  return `${result}%`;
}

/** Apply a maxDexBonus delta to a string like "6" or null. */
export function applyMaxDexDelta(maxDex: string | null, delta: number): string | null {
  if (maxDex === null || delta === 0) return maxDex;
  return String(parseInt(maxDex) + delta);
}
