import type { CharacterDraft, FeatSlot } from '../../types/character';
import type { DerivedClassFeature } from '../../utils/characterHelpers';
import { FeatAutocomplete } from '../../components/FeatAutocomplete';
import type { FeatCategory, FeatCatalogEntry } from '../../components/FeatAutocomplete';

function ClassFeaturesSection({ features }: { features: DerivedClassFeature[] }) {
  if (features.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
        Select a class to see class features.
      </p>
    );
  }

  return (
    <div className="rounded overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
      <table aria-label="Class features" className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ background: 'var(--color-canvas-subtle)' }}>
            {['Feature', 'Class (Level)', 'Description'].map((header) => (
              <th key={header} className="px-3 py-2 text-left font-medium"
                style={{ color: 'var(--color-fg-muted)', borderBottom: '1px solid var(--color-border-default)' }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr
              key={`${feature.className}-${feature.id}`}
              style={{
                background: index % 2 === 0 ? 'var(--color-canvas-default)' : 'var(--color-canvas-subtle)',
                borderBottom: '1px solid var(--color-border-muted)',
              }}
            >
              <td className="px-3 py-2 font-medium" style={{ color: 'var(--color-fg-default)', whiteSpace: 'nowrap' }}>
                {feature.name}
              </td>
              <td className="px-3 py-2" style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                {feature.className} {feature.minLevel}
              </td>
              <td className="px-3 py-2" style={{ color: 'var(--color-fg-muted)' }}>
                {feature.shortDescription}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getAllowedCategories(feat: FeatSlot): ReadonlyArray<FeatCategory> | undefined {
  if (feat.type === 'Fighter Bonus Feat') return ['Fighter Bonus Feat'];
  if (/^Wizard Level/.test(feat.sourceLabel)) return ['Item Creation', 'Metamagic', 'Special'];
  return undefined;
}

function SelectableFeatsSection({
  feats,
  onChange,
  extraFeats,
  inputStyle,
}: {
  feats: FeatSlot[];
  onChange: (feats: FeatSlot[]) => void;
  extraFeats?: ReadonlyArray<FeatCatalogEntry>;
  inputStyle: React.CSSProperties;
}) {
  const takenNames = new Set(feats.map((f) => f.name).filter(Boolean));

  function updateName(i: number, name: string, shortDescription?: string) {
    onChange(feats.map((f, idx) =>
      idx === i ? { ...f, name, shortDescription: shortDescription ?? '' } : f,
    ));
  }

  function removeFeat(i: number) {
    onChange(feats.filter((_, idx) => idx !== i));
  }

  function addFeat() {
    onChange([...feats, { name: '', type: 'General', source: 'Special', sourceLabel: 'Additional' }]);
  }

  const TABLE_HEADERS = ['Feat', 'Description', 'Type', 'Source', ''];

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded overflow-hidden" style={{ border: '1px solid var(--color-border-default)' }}>
        <table aria-label="Selectable feats" className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: 'var(--color-canvas-subtle)' }}>
              {TABLE_HEADERS.map((header) => (
                <th key={header} className="px-3 py-2 text-left font-medium"
                  style={{ color: 'var(--color-fg-muted)', borderBottom: '1px solid var(--color-border-default)' }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {feats.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-center"
                  style={{ color: 'var(--color-fg-subtle)' }}>
                  No feat slots yet — select a class to populate.
                </td>
              </tr>
            )}
            {feats.map((feat, i) => (
              <tr key={i}
                style={{
                  background: i % 2 === 0 ? 'var(--color-canvas-default)' : 'var(--color-canvas-subtle)',
                  borderBottom: '1px solid var(--color-border-muted)',
                }}
              >
                <td className="px-3 py-1">
                  <FeatAutocomplete
                    ariaLabel={`${feat.sourceLabel} feat name`}
                    value={feat.name}
                    onChange={(name, sd) => updateName(i, name, sd)}
                    allowedCategories={getAllowedCategories(feat)}
                    takenNames={takenNames}
                    extraFeats={extraFeats}
                    placeholder={
                      feat.type === 'Fighter Bonus Feat'
                        ? 'Choose fighter bonus feat…'
                        : /^Wizard Level/.test(feat.sourceLabel)
                          ? 'Choose metamagic / item creation feat…'
                          : 'Search feats…'
                    }
                  />
                </td>
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-muted)', fontSize: 11 }}>
                  {feat.shortDescription ?? ''}
                </td>
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-default)', whiteSpace: 'nowrap' }}>
                  {feat.type}
                </td>
                <td className="px-3 py-1" style={{ color: 'var(--color-fg-muted)', whiteSpace: 'nowrap' }}>
                  {feat.sourceLabel}
                </td>
                <td className="px-3 py-1 text-center">
                  {feat.source === 'Special' && (
                    <button
                      type="button"
                      aria-label={`Remove additional feat ${i + 1}`}
                      onClick={() => removeFeat(i)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-fg-muted)',
                        cursor: 'pointer',
                        fontSize: 14,
                        lineHeight: 1,
                        padding: '0 4px',
                      }}
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addFeat}
        className="text-xs px-3 py-1 rounded self-start"
        style={{
          border: '1px solid var(--color-border-default)',
          color: 'var(--color-fg-default)',
          cursor: 'pointer',
          background: 'transparent',
        }}
      >
        + Add Feat
      </button>
    </div>
  );
}

export function FeatsSection({
  classFeatures,
  feats,
  onFeatsChange,
  extraFeats,
  inputStyle,
}: {
  classFeatures: DerivedClassFeature[];
  feats: CharacterDraft['feats'];
  onFeatsChange: (feats: CharacterDraft['feats']) => void;
  extraFeats?: ReadonlyArray<FeatCatalogEntry>;
  inputStyle: React.CSSProperties;
}) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-fg-muted)' }}>
        Class Features
      </p>
      <p className="text-sm mb-2" style={{ color: 'var(--color-fg-subtle)' }}>
        Features granted automatically by class. Hover a feature name to see the full description.
      </p>
      <ClassFeaturesSection features={classFeatures} />

      <p className="text-xs font-semibold uppercase tracking-wider mt-4 mb-1" style={{ color: 'var(--color-fg-muted)' }}>
        Feat Slots
      </p>
      <p className="text-sm mb-2" style={{ color: 'var(--color-fg-subtle)' }}>
        Slots granted by character level, race, and class bonus feats. Enter the chosen feat name.
      </p>
      <SelectableFeatsSection
        feats={feats}
        onChange={onFeatsChange}
        extraFeats={extraFeats}
        inputStyle={inputStyle}
      />
    </>
  );
}
