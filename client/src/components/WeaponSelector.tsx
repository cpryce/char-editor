import type { CSSProperties, ReactNode } from 'react';
import { WeaponAutocomplete } from './WeaponAutocomplete';
import type { WeaponCatalogEntry } from '../data/weapons';
import { WEAPON_CATALOG, getWeaponAttackClass } from '../data/weapons';
import type { WeaponLoadout } from '../types/character';
import { buildIterativeAttackString } from '../utils/characterHelpers';
import type { MaterialKey } from '../data/materials';
import { MATERIALS, WEAPON_MATERIAL_KEYS, applyWeightMultiplier } from '../data/materials';

type WeaponSelectorProps = {
  title?: string;
  editableTitle?: boolean;
  onTitleChange?: (title: string) => void;
  weapon: WeaponLoadout | null;
  baseAttackBonus: number;
  meleeAttackBonus: number;
  rangedAttackBonus: number;
  rowClass: string;
  inputStyle: CSSProperties;
  onSelect: (name: string, entry?: WeaponCatalogEntry) => void;
  onFieldChange: (field: keyof WeaponLoadout, value: string | number) => void;
  onClear: () => void;
  onRemove?: () => void;
  allowTwoHanded?: boolean;
  entries?: ReadonlyArray<WeaponCatalogEntry>;
  maxAttacks?: number;
  twoWeaponPenalty?: number;
  featControl?: ReactNode;
};

export function WeaponSelector({
  title = 'Weapon',
  editableTitle = false,
  onTitleChange,
  weapon,
  baseAttackBonus,
  meleeAttackBonus,
  rangedAttackBonus,
  rowClass,
  inputStyle,
  onSelect,
  onFieldChange,
  onClear,
  onRemove,
  allowTwoHanded = true,
  entries = WEAPON_CATALOG,
  maxAttacks,
  twoWeaponPenalty = 0,
  featControl,
}: WeaponSelectorProps) {
  const damageValue = weapon?.damage ?? '';
  const mat = weapon?.material ? MATERIALS[weapon.material as MaterialKey] : undefined;
  const effectiveWeight = weapon ? applyWeightMultiplier(weapon.weight, mat?.weightMultiplier ?? 1) : '—';
  const parsedBab = Number(baseAttackBonus);
  const parsedMeleeAtk = Number(meleeAttackBonus);
  const parsedRangedAtk = Number(rangedAttackBonus);
  const combatMod = Number(weapon?.combatMod ?? 0);
  const attackClass = weapon ? getWeaponAttackClass(weapon.name, weapon.rangeIncrement) : 'Melee';
  const isRangedWeapon = attackClass === 'Ranged';

  const appliedFeats = weapon?.appliedFeats ?? [];
  const featBonus =
    (appliedFeats.includes('Weapon Focus') ? 1 : 0) +
    (appliedFeats.includes('Greater Weapon Focus') ? 1 : 0);
  const isFinesseWeapon = !isRangedWeapon && (weapon?.handedness === 'Light' || weapon?.special?.includes('Weapon Finesse eligible'));
  const usesFinesse = isFinesseWeapon && appliedFeats.includes('Weapon Finesse');
  const hasRapidShot = isRangedWeapon && appliedFeats.includes('Rapid Shot');

  const primaryAttackBonus = isRangedWeapon
    ? parsedRangedAtk
    : (usesFinesse ? parsedRangedAtk : parsedMeleeAtk);
  const iterativeAttack = weapon
    ? buildIterativeAttackString(primaryAttackBonus, parsedBab, Number(weapon.enhancementBonus ?? 0), combatMod, maxAttacks, twoWeaponPenalty, featBonus, hasRapidShot)
    : '—';

  return (
    <div className="inventory-weapon-selector">
      <div className="inventory-hands-wrap">
        <table className="inventory-hands-table" aria-label={`${title || 'Weapon'} weapon`}>
          <thead className="inventory-hands-thead">
            <tr>
              <th className="inventory-hands-th">
                {editableTitle ? (
                  <input
                    type="text"
                    className="inventory-weapon-selector-title-input"
                    value={title}
                    onChange={(e) => onTitleChange?.(e.target.value)}
                    aria-label="Weapon selector name"
                    placeholder="Weapon"
                  />
                ) : (
                  title || 'Weapon'
                )}
              </th>
              {['Weapon Enhancement', 'Combat Mod', 'Atk', 'Dmg', 'Critical'].map((h) => (
                <th key={h} className="inventory-hands-th">{h}</th>
              ))}
              <th className="inventory-hands-th">
                {onRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="inventory-hands-clear"
                    aria-label="Remove weapon slot"
                  >
                    Remove
                  </button>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className={rowClass}>
              <td className="inventory-hands-td">
                <WeaponAutocomplete
                  value={weapon?.name ?? ''}
                  entries={entries}
                  onSelect={onSelect}
                  placeholder="Select weapon..."
                  ariaLabel={`${title || 'weapon'} selection`}
                  style={{ ...inputStyle, minWidth: 160 }}
                />
              </td>
              <td className="inventory-hands-td">
                <input
                  type="number"
                  value={weapon?.enhancementBonus ?? 0}
                  onChange={(e) => onFieldChange('enhancementBonus', Number(e.target.value))}
                  className="inventory-hands-input inventory-hands-input--number"
                  aria-label="Enhancement bonus"
                  disabled={!weapon}
                />
              </td>
              <td className="inventory-hands-td">
                <input
                  type="number"
                  value={weapon?.combatMod ?? 0}
                  onChange={(e) => onFieldChange('combatMod', Number(e.target.value))}
                  className="inventory-hands-input inventory-hands-input--number"
                  aria-label="Combat modifier"
                  disabled={!weapon}
                />
              </td>
              <td className="inventory-hands-td inventory-hands-atk">
                <input
                  type="text"
                  value={weapon ? (weapon.computedAttack || iterativeAttack) : ''}
                  onChange={(e) => onFieldChange('computedAttack', e.target.value)}
                  className="inventory-hands-input inventory-hands-atk-input"
                  aria-label="Iterative attack"
                  disabled={!weapon}
                />
              </td>
              <td className="inventory-hands-td">
                <input
                  type="text"
                  value={damageValue}
                  onChange={(e) => onFieldChange('damage', e.target.value)}
                  className="inventory-hands-input"
                  aria-label="Weapon damage"
                  disabled={!weapon}
                  style={{ ...inputStyle, minWidth: 90 }}
                />
              </td>
              <td className="inventory-hands-td">
                <input
                  type="text"
                  value={weapon?.critical ?? ''}
                  onChange={(e) => onFieldChange('critical', e.target.value)}
                  className="inventory-hands-input"
                  aria-label="Critical range"
                  disabled={!weapon}
                  style={{ ...inputStyle, minWidth: 90 }}
                />
              </td>
              <td className="inventory-hands-td">
                <div className="inventory-hands-actions">
                  {weapon && (
                    <button
                      type="button"
                      onClick={onClear}
                      className="inventory-hands-clear"
                      aria-label="Clear weapon"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </td>
            </tr>
            <tr className={`${rowClass} inventory-hands-subrow`}>
              <td className="inventory-hands-td inventory-hands-subrow-content" colSpan={7}>
                <div className="inventory-hands-detail-fields">
                  <label className="inventory-hands-detail-field">
                    <span className="inventory-hands-detail-label">Material</span>
                    <select
                      value={weapon?.material ?? ''}
                      onChange={(e) => onFieldChange('material', e.target.value)}
                      className="inventory-hands-input"
                      aria-label="Weapon material"
                      disabled={!weapon}
                      title={mat?.note}
                      style={{ ...inputStyle, minWidth: 120 }}
                    >
                      <option value="">Standard</option>
                      {WEAPON_MATERIAL_KEYS.map((k) => (
                        <option key={k} value={k}>{MATERIALS[k].label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="inventory-hands-detail-field">
                    <span className="inventory-hands-detail-label">Handedness</span>
                    <select
                      value={weapon?.handedness ?? '—'}
                      onChange={(e) => onFieldChange('handedness', e.target.value)}
                      className="inventory-hands-input"
                      aria-label="Handedness"
                      disabled={!weapon}
                      style={{ ...inputStyle, minWidth: 110 }}
                    >
                      {!weapon && <option value="—">—</option>}
                      {(['Light', 'One-Handed', 'Two-Handed'] as const)
                        .filter((h) => allowTwoHanded || h !== 'Two-Handed')
                        .map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </label>
                  <span className="inventory-hands-detail-field">
                    <span className="inventory-hands-detail-label">Range</span>
                    <span className="inventory-hands-detail-value">{weapon?.rangeIncrement ?? '—'}</span>
                  </span>
                  <span className="inventory-hands-detail-field">
                    <span className="inventory-hands-detail-label">Type</span>
                    <span className="inventory-hands-detail-value">{weapon?.damageType ?? '—'}</span>
                  </span>
                  <span className="inventory-hands-detail-field">
                    <span className="inventory-hands-detail-label">Wt</span>
                    <span className="inventory-hands-detail-value">{effectiveWeight}</span>
                  </span>
                  {weapon && featControl && (
                    <span className="inventory-hands-detail-field">
                      <span className="inventory-hands-detail-label">Feats</span>
                      {featControl}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
