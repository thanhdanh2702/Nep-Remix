import { useState } from 'react';
import type { StudioDraft } from '../core';
import { ClothingPreview } from './ClothingPreview';
import { content } from './store';
import { COPY } from './lookbook-copy';
import { isHistoricalGarment } from '../content/garment-catalog';

export interface LookbookGarmentOption { id: string; name: string }

/** Garment step inside the Lookbook dialog: picking one changes the Studio outfit itself, so pixel panel and photos stay in sync. */
export function LookbookGarmentPicker({ garments, selectedId, colorPalette, disabled, onSelect }: {
  garments: LookbookGarmentOption[];
  selectedId: string;
  colorPalette: StudioDraft['colorPalette'];
  disabled: boolean;
  onSelect: (id: string) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  const garment = content.garmentsById.get(selectedId)!;
  return <section className="lookbook-section" aria-labelledby="lookbook-garment-h">
    <h3 id="lookbook-garment-h">❀ Trang phục</h3>
    <div className="lookbook-selected-outfit">
      <div className="lookbook-outfit-preview"><ClothingPreview garment={garment} colors={colorPalette} showHanger={false} /></div>
      <div><strong>{garment.name}</strong><button disabled={disabled} aria-expanded={choosing} onClick={() => setChoosing(v => !v)}>Đổi áo ›</button></div>
    </div>
    {choosing && <div className="lookbook-garment-grid" role="group" aria-label={COPY.garmentGroupLabel}>
      {garments.filter(g => isHistoricalGarment(g.id)).map(g => <button key={g.id} type="button" aria-pressed={selectedId === g.id} disabled={disabled} onClick={() => { onSelect(g.id); setChoosing(false); }}>{g.name}</button>)}
    </div>}
  </section>;
}

