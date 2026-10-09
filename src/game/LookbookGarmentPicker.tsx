import { asset, garmentAsset } from './assets';
import { COPY } from './lookbook-copy';

export interface LookbookGarmentOption { id: string; name: string }

/** Garment step inside the Lookbook dialog: picking one changes the Studio outfit itself, so pixel panel and photos stay in sync. */
export function LookbookGarmentPicker({ garments, selectedId, disabled, onSelect }: {
  garments: LookbookGarmentOption[];
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  return <section className="lookbook-section" aria-labelledby="lookbook-garment-h">
    <h3 id="lookbook-garment-h">{COPY.garmentHeading}</h3>
    <div className="lookbook-garment-grid" role="group" aria-label={COPY.garmentGroupLabel}>
      {garments.map(g =>
        <button key={g.id} type="button" aria-pressed={selectedId === g.id} disabled={disabled} onClick={() => onSelect(g.id)}>
          <img className="pixel-native" src={asset(garmentAsset(g.id, true))} alt="" aria-hidden="true" />
          <span>{g.name}</span>
        </button>)}
    </div>
    <p className="lookbook-note is-small">{COPY.garmentNote}</p>
  </section>;
}
