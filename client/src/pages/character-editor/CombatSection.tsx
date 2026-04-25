import type { CharacterDraft } from '../../types/character';
import './CombatSection.css';

function signed(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

export type CombatDerivedStats = {
  dexMod: number;
  conMod: number;
  wisMod: number;
  strMod: number;
  sizeMod: number;
  acArmor: number;
  acShield: number;
  acDodge: number;
  acNatural: number;
  acDeflection: number;
  acMisc: number;
  initMisc: number;
  speedBase: number;
  speedArmorAdjust: number;
  speedFly: number;
  speedSwim: number;
  bab: number;
  fortitudeBase: number;
  reflexBase: number;
  willBase: number;
  totalAC: number;
  touchAC: number;
  flatFootedAC: number;
  initiativeTotal: number;
  fortitudeTotal: number;
  reflexTotal: number;
  willTotal: number;
  meleeAttack: number;
  rangedAttack: number;
  speedFeet: number;
};

export function CombatSection({
  combat,
  onCombatChange,
  derivedCombat,
}: {
  combat: CharacterDraft['combat'];
  onCombatChange: (value: CharacterDraft['combat']) => void;
  derivedCombat: CombatDerivedStats;
}) {
  const {
    dexMod,
    conMod,
    wisMod,
    strMod,
    sizeMod,
    acArmor,
    acShield,
    acDodge,
    acNatural,
    acDeflection,
    acMisc,
    initMisc,
    speedBase,
    speedArmorAdjust,
    speedFly,
    speedSwim,
    bab,
    fortitudeBase,
    reflexBase,
    willBase,
    totalAC,
    touchAC,
    flatFootedAC,
    initiativeTotal,
    fortitudeTotal,
    reflexTotal,
    willTotal,
    meleeAttack,
    rangedAttack,
    speedFeet,
  } = derivedCombat;

  function updateNumeric(path: string, value: number) {
    const safe = Number.isFinite(value) ? Math.trunc(value) : 0;
    const parts = path.split('.');
    onCombatChange((() => {
      if (parts.length === 1) {
        const [k1] = parts as [keyof CharacterDraft['combat']];
        return {
          ...combat,
          [k1]: safe,
        } as CharacterDraft['combat'];
      }
      if (parts.length === 2) {
        const [k1, k2] = parts as [keyof CharacterDraft['combat'], string];
        return {
          ...combat,
          [k1]: {
            ...(combat[k1] as Record<string, unknown>),
            [k2]: safe,
          },
        } as CharacterDraft['combat'];
      }
      const [k1, k2, k3] = parts as [keyof CharacterDraft['combat'], string, string];
      return {
        ...combat,
        [k1]: {
          ...(combat[k1] as Record<string, unknown>),
          [k2]: {
            ...((combat[k1] as Record<string, Record<string, number>>)[k2]),
            [k3]: safe,
          },
        },
      } as CharacterDraft['combat'];
    })());
  }

  function statRow(label: string, total: string | number, parts: React.ReactNode) {
    return (
      <div className="flex items-stretch gap-3">
        <div className="shrink-0 rounded px-2 py-1 min-w-[92px] combat-stat-card">
          <div className="text-xs combat-stat-label">{label}</div>
          <div className="text-lg font-semibold leading-none mt-0.5 combat-stat-total">{total}</div>
        </div>
        <div className="flex items-end gap-2 flex-wrap">
          {parts}
        </div>
      </div>
    );
  }

  function modInput(label: string, value: number, onChange?: (v: number) => void, min = -20) {
    return (
      <label className="flex items-center gap-1">
        <span className="text-xs combat-mod-label">{label}</span>
        <input
          type="number"
          value={value}
          min={min}
          readOnly={!onChange}
          onChange={onChange ? (e) => onChange(Number(e.target.value)) : undefined}
          className={[
            'combat-mod-input',
            onChange ? 'combat-mod-input--editable' : 'combat-mod-input--readonly',
          ].join(' ')}
        />
      </label>
    );
  }

  function subsection(title: string, content: React.ReactNode, withBorder = true) {
    return (
      <section
        className={[
          'flex flex-col gap-3 combat-subsection',
          withBorder ? '' : 'combat-subsection--no-border',
        ].join(' ')}
      >
        <h4 className="text-[11px] font-semibold uppercase tracking-wider combat-subsection-title">
          {title}
        </h4>
        {content}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {subsection(
        'Armor Class',
        statRow(
          'AC',
          totalAC,
          <>
            {modInput('Armor', acArmor, (v) => updateNumeric('armorClass.armor', v))}
            {modInput('Shield', acShield, (v) => updateNumeric('armorClass.shield', v))}
            {modInput('Dex', dexMod)}
            {modInput('Dodge', acDodge, (v) => updateNumeric('armorClass.dodge', v))}
            {modInput('Deflection', acDeflection, (v) => updateNumeric('armorClass.deflection', v))}
            {modInput('Natural', acNatural, (v) => updateNumeric('armorClass.natural', v))}
            {modInput('Misc', acMisc, (v) => updateNumeric('armorClass.misc', v))}
            <div className="basis-full text-xs combat-muted-text">
              Touch {touchAC} / Flat {flatFootedAC}
            </div>
          </>,
        ),
      )}

      {subsection(
        'Saving Throws',
        <>
          {statRow(
            'Fortitude',
            signed(fortitudeTotal),
            <>
              {modInput('Base', fortitudeBase)}
              {modInput('Con', conMod)}
              {modInput('Magic', combat.saves.fortitude.magic, (v) => updateNumeric('saves.fortitude.magic', v))}
              {modInput('Misc', combat.saves.fortitude.misc, (v) => updateNumeric('saves.fortitude.misc', v))}
            </>,
          )}

          {statRow(
            'Reflex',
            signed(reflexTotal),
            <>
              {modInput('Base', reflexBase)}
              {modInput('Dex', dexMod)}
              {modInput('Magic', combat.saves.reflex.magic, (v) => updateNumeric('saves.reflex.magic', v))}
              {modInput('Misc', combat.saves.reflex.misc, (v) => updateNumeric('saves.reflex.misc', v))}
            </>,
          )}

          {statRow(
            'Will',
            signed(willTotal),
            <>
              {modInput('Base', willBase)}
              {modInput('Wis', wisMod)}
              {modInput('Magic', combat.saves.will.magic, (v) => updateNumeric('saves.will.magic', v))}
              {modInput('Misc', combat.saves.will.misc, (v) => updateNumeric('saves.will.misc', v))}
            </>,
          )}
        </>,
      )}

      {subsection(
        'Attacks',
        <>
          {statRow(
            'Melee Atk',
            signed(meleeAttack),
            <>
              {modInput('BAB', bab)}
              {modInput('Str', strMod)}
              {modInput('Size', sizeMod)}
            </>,
          )}

          {statRow(
            'Ranged Atk',
            signed(rangedAttack),
            <>
              {modInput('BAB', bab)}
              {modInput('Dex', dexMod)}
              {modInput('Size', sizeMod)}
            </>,
          )}
        </>,
      )}

      {subsection(
        'Movement',
        <>
          {statRow(
            'Speed',
            `${speedFeet} ft`,
            <>
              {modInput('Base', speedBase, (v) => updateNumeric('speed.base', v), 0)}
              {modInput('Armor Adj', speedArmorAdjust, (v) => updateNumeric('speed.armorAdjust', v), -60)}
              {modInput('Fly', speedFly, (v) => updateNumeric('speed.fly', v), 0)}
              {modInput('Swim', speedSwim, (v) => updateNumeric('speed.swim', v), 0)}
            </>,
          )}

          {statRow(
            'Initiative',
            signed(initiativeTotal),
            <>
              {modInput('Dex', dexMod)}
              {modInput('Misc', initMisc, (v) => updateNumeric('initiative.miscBonus', v))}
            </>,
          )}
        </>,
        false,
      )}

      <p className="text-xs combat-muted-text">
        Save inputs are ordered: base, magic, misc, temp. AC follows SRD: 10 + armor + shield + Dex + size + dodge + natural + deflection + misc.
      </p>
    </div>
  );
}
