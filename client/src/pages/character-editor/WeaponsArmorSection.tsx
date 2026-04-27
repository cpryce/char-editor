import type { CharacterDraft, ArmorLoadout } from '../../types/character';
import { ArmorAutocomplete } from '../../components/ArmorAutocomplete';
import type { ArmorCatalogEntry } from '../../data/armor';
import { ARMOR_ENTRIES, SHIELD_ENTRIES } from '../../data/armor';
import './WeaponsArmorSection.css';

type SlotKey = 'armor' | 'shield';

type RowConfig = {
  key: SlotKey;
  label: string;
  entries: ReadonlyArray<ArmorCatalogEntry>;
};

const ROWS: ReadonlyArray<RowConfig> = [
  { key: 'armor', label: 'Armor', entries: ARMOR_ENTRIES },
  { key: 'shield', label: 'Shield', entries: SHIELD_ENTRIES },
];

function newLoadoutFromEntry(entry: ArmorCatalogEntry): ArmorLoadout {
  return {
    name: entry.name,
    category: entry.category,
    armorBonus: entry.armorBonus,
    enhancementBonus: 0,
    maxDexBonus: entry.maxDexBonus,
    armorCheckPenalty: entry.armorCheckPenalty,
    arcaneSpellFailure: entry.arcaneSpellFailure,
    speed: entry.speed,
    weight: entry.weight,
    armorAdjust: entry.armorAdjust,
  };
}

function defaultLoadoutFor(kind: SlotKey, name = ''): ArmorLoadout {
  return {
    name,
    category: kind === 'armor' ? 'Light Armor' : 'Shield',
    armorBonus: 0,
    enhancementBonus: 0,
    maxDexBonus: null,
    armorCheckPenalty: 0,
    arcaneSpellFailure: '',
    speed: '',
    weight: '',
    armorAdjust: 0,
  };
}

export function WeaponsArmorSection({
  combat,
  onCombatChange,
  inputStyle,
}: {
  combat: CharacterDraft['combat'];
  onCombatChange: (value: CharacterDraft['combat']) => void;
  inputStyle: React.CSSProperties;
}) {
  function totalArmorBonus(loadout: ArmorLoadout | null) {
    if (!loadout) return 0;
    return (loadout.armorBonus ?? 0) + (loadout.enhancementBonus ?? 0);
  }

  function updateSlot(slot: SlotKey, next: ArmorLoadout | null) {
    const nextGear = {
      armor: combat.gear.armor,
      shield: combat.gear.shield,
      [slot]: next,
    };

    const armorBonus = slot === 'armor'
      ? totalArmorBonus(next)
      : totalArmorBonus(combat.gear.armor);
    const shieldBonus = slot === 'shield'
      ? totalArmorBonus(next)
      : totalArmorBonus(combat.gear.shield);

    const armorAdjust = slot === 'armor'
      ? (next?.armorAdjust ?? 0)
      : (combat.gear.armor?.armorAdjust ?? 0);

    onCombatChange({
      ...combat,
      gear: nextGear,
      armorClass: {
        ...combat.armorClass,
        armor: armorBonus,
        shield: shieldBonus,
      },
      speed: {
        ...combat.speed,
        armorAdjust,
      },
    });
  }

  function updateField(slot: SlotKey, field: keyof ArmorLoadout, value: string | number | null) {
    const current = combat.gear[slot] ?? defaultLoadoutFor(slot);
    const next = {
      ...current,
      [field]: value,
    } as ArmorLoadout;

    if (field === 'name' && typeof value === 'string' && value.trim() === '') {
      updateSlot(slot, null);
      return;
    }

    updateSlot(slot, next);
  }

  function setFromCatalog(slot: SlotKey, name: string, entry?: ArmorCatalogEntry) {
    if (!name.trim()) {
      updateSlot(slot, null);
      return;
    }
    if (!entry) {
      const existing = combat.gear[slot] ?? defaultLoadoutFor(slot, name);
      updateSlot(slot, { ...existing, name });
      return;
    }
    updateSlot(slot, newLoadoutFromEntry(entry));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm weapons-armor-help">
        Optional loadout editor for one armor and one shield. Armor Bonus is calculated as Base AC + Enhancement.
      </p>
      <div className="weapons-armor-wrap">
        <table aria-label="Weapons and armor" className="weapons-armor-table">
          <thead>
            <tr className="weapons-armor-table-head">
              {['Slot', 'Item', 'Base AC', 'Enhancement', 'Armor Bonus', 'Max Dex', 'ACP', 'ASF', 'Speed', 'Weight', ''].map((header) => (
                <th key={header} className="weapons-armor-th">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, rowIndex) => {
              const loadout = combat.gear[row.key];
              const rowClass = rowIndex % 2 === 0 ? 'weapons-armor-row-even' : 'weapons-armor-row-odd';

              return (
                <tr key={row.key} className={rowClass}>
                  <td className="weapons-armor-td weapons-armor-kind">{row.label}</td>
                  <td className="weapons-armor-td">
                    <ArmorAutocomplete
                      value={loadout?.name ?? ''}
                      entries={row.entries}
                      onSelect={(name, entry) => setFromCatalog(row.key, name, entry)}
                      placeholder={row.key === 'armor' ? 'Select armor...' : 'Select shield...'}
                      ariaLabel={`${row.label} selection`}
                      style={{ ...inputStyle, minWidth: 180 }}
                    />
                  </td>
                  <td className="weapons-armor-td">
                    <span
                      className="weapons-armor-static-number"
                      aria-label={`${row.label} base AC bonus`}
                    >
                      {loadout?.armorBonus ?? 0}
                    </span>
                  </td>
                  <td className="weapons-armor-td">
                    <input
                      type="number"
                      value={loadout?.enhancementBonus ?? 0}
                      onChange={(e) => updateField(row.key, 'enhancementBonus', Number(e.target.value))}
                      className="weapons-armor-input weapons-armor-input--number"
                      aria-label={`${row.label} enhancement bonus`}
                    />
                  </td>
                  <td className="weapons-armor-td">
                    <input
                      type="number"
                      value={totalArmorBonus(loadout)}
                      readOnly
                      className="weapons-armor-input weapons-armor-input--number weapons-armor-input--readonly"
                      aria-label={`${row.label} total armor bonus`}
                    />
                  </td>
                  <td className="weapons-armor-td">
                    <input
                      type="text"
                      value={loadout?.maxDexBonus ?? ''}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        const normalized = raw === '' || /^no\s*limit$/i.test(raw) ? null : raw;
                        updateField(row.key, 'maxDexBonus', normalized as ArmorLoadout['maxDexBonus']);
                      }}
                      className="weapons-armor-input"
                      aria-label={`${row.label} max dex bonus`}
                    />
                  </td>
                  <td className="weapons-armor-td">
                    <input
                      type="number"
                      value={loadout?.armorCheckPenalty ?? 0}
                      onChange={(e) => updateField(row.key, 'armorCheckPenalty', Number(e.target.value))}
                      className="weapons-armor-input weapons-armor-input--number"
                      aria-label={`${row.label} armor check penalty`}
                    />
                  </td>
                  <td className="weapons-armor-td">
                    <input
                      type="text"
                      value={loadout?.arcaneSpellFailure ?? ''}
                      onChange={(e) => updateField(row.key, 'arcaneSpellFailure', e.target.value)}
                      className="weapons-armor-input"
                      aria-label={`${row.label} arcane spell failure`}
                    />
                  </td>
                  <td className="weapons-armor-td">
                    <input
                      type="text"
                      value={loadout?.speed ?? ''}
                      onChange={(e) => updateField(row.key, 'speed', e.target.value)}
                      className="weapons-armor-input"
                      aria-label={`${row.label} speed`}
                    />
                  </td>
                  <td className="weapons-armor-td">
                    <input
                      type="text"
                      value={loadout?.weight ?? ''}
                      onChange={(e) => updateField(row.key, 'weight', e.target.value)}
                      className="weapons-armor-input"
                      aria-label={`${row.label} weight`}
                    />
                  </td>
                  <td className="weapons-armor-td">
                    <button
                      type="button"
                      onClick={() => updateSlot(row.key, null)}
                      className="weapons-armor-clear"
                      aria-label={`Clear ${row.label.toLowerCase()} selection`}
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
