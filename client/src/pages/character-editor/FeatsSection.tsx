import type { CharacterDraft, FeatSlot } from '../../types/character';
import type { DerivedClassFeature } from '../../utils/characterHelpers';
import { FeatAutocomplete } from '../../components/FeatAutocomplete';
import type { FeatCategory, FeatCatalogEntry } from '../../components/FeatAutocomplete';

function ClassFeaturesSection({ features }: { features: DerivedClassFeature[] }) {
  if (features.length === 0) {
    return (
      <p className="text-sm text-[color:var(--color-fg-muted)]">
        Select a class to see class features.
      </p>
    );
  }

  return (
    <div className="rounded overflow-hidden border border-[var(--color-border-default)]">
      <table aria-label="Class features" className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-[var(--color-canvas-subtle)]">
            {['Feature', 'Class (Level)'].map((header) => (
              <th key={header} className="px-3 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                {header}
              </th>
            ))}
            <th className="hidden sm:table-cell px-3 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr
              key={`${feature.className}-${feature.id}`}
              className={`border-b border-[var(--color-border-muted)] ${index % 2 === 0 ? 'bg-[var(--color-canvas-default)]' : 'bg-[var(--color-canvas-subtle)]'}`}
            >
              <td className="px-3 py-2 font-medium text-[color:var(--color-fg-default)] whitespace-nowrap">
                {feature.name}
              </td>
              <td className="px-3 py-2 text-[color:var(--color-fg-muted)] whitespace-nowrap">
                {feature.className} {feature.minLevel}
              </td>
              <td className="hidden sm:table-cell px-3 py-2 text-[color:var(--color-fg-muted)]">
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
}: {
  feats: FeatSlot[];
  onChange: (feats: FeatSlot[]) => void;
  extraFeats?: ReadonlyArray<FeatCatalogEntry>;
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

  const TABLE_HEADERS = ['Feat', 'Source'];

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded overflow-hidden border border-[var(--color-border-default)]">
        <table aria-label="Selectable feats" className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[var(--color-canvas-subtle)]">
              {TABLE_HEADERS.map((header) => (
                <th key={header} className="px-3 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                  {header}
                </th>
              ))}
              <th className="hidden sm:table-cell px-3 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                Type
              </th>
              <th className="hidden sm:table-cell px-3 py-2 text-left font-medium text-[color:var(--color-fg-muted)] border-b border-[var(--color-border-default)]">
                Description
              </th>
              <th className="px-3 py-2 border-b border-[var(--color-border-default)]" aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {feats.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-center text-[color:var(--color-fg-subtle)]">
                  No feat slots yet — select a class to populate.
                </td>
              </tr>
            )}
            {feats.map((feat, i) => (
              <tr
                key={i}
                className={`border-b border-[var(--color-border-muted)] ${i % 2 === 0 ? 'bg-[var(--color-canvas-default)]' : 'bg-[var(--color-canvas-subtle)]'}`}
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
                <td className="hidden sm:table-cell px-3 py-1 text-[color:var(--color-fg-default)] whitespace-nowrap">
                  {feat.type}
                </td>
                <td className="px-3 py-1 text-[color:var(--color-fg-muted)] whitespace-nowrap">
                  {feat.sourceLabel}
                </td>
                <td className="hidden sm:table-cell px-3 py-1 text-[color:var(--color-fg-muted)] text-[11px]">
                  {feat.shortDescription ?? ''}
                </td>
                <td className="px-3 py-1 text-center">
                  {feat.source === 'Special' && (
                    <button
                      type="button"
                      aria-label={`Remove additional feat ${i + 1}`}
                      onClick={() => removeFeat(i)}
                      className="bg-transparent border-0 text-[color:var(--color-fg-muted)] cursor-pointer text-sm leading-none py-0 px-1"
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
        className="text-xs px-3 py-1 rounded self-start border border-[var(--color-border-default)] text-[color:var(--color-fg-default)] cursor-pointer bg-transparent"
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
}: {
  classFeatures: DerivedClassFeature[];
  feats: CharacterDraft['feats'];
  onFeatsChange: (feats: CharacterDraft['feats']) => void;
  extraFeats?: ReadonlyArray<FeatCatalogEntry>;
}) {
  return (
    <>
      <section className='flex flex-col gap-1'>
        <p className="subsection-header">
          Class Features
        </p>
        <p className="text-sm mb-2 text-[color:var(--color-fg-subtle)]">
          Features granted automatically by class. Hover a row to see the description on small screens.
        </p>
        <ClassFeaturesSection features={classFeatures} />
      </section>
      
      <section className="flex flex-col gap-1">
        <p className="subsection-header">
          Feat Slots
        </p>
        <p className="text-sm mb-2 text-[color:var(--color-fg-subtle)]">
          Slots granted by character level, race, and class bonus feats. Enter the chosen feat name.
        </p>
        <SelectableFeatsSection
          feats={feats}
          onChange={onFeatsChange}
          extraFeats={extraFeats}
        />
      </section>
    </>
  );
}
