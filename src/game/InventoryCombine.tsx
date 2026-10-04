import { useState } from 'react';
import type { Command, GameState } from '../core';
import { content } from './store';
import { asset, itemAsset } from './assets';
import { Modal } from './Modal';
import './puzzle.css';

// Bag + clue notebook. Picking two items and pressing "Ghép" sends item/combine.
export function InventoryCombine({ state, initialItem, send, notify, onClose }: {
  state: GameState; initialItem: string; send: (command: Command) => GameState | null; notify: (message: string) => void; onClose: () => void;
}) {
  const [picked, setPicked] = useState<string[]>(initialItem ? [initialItem] : []);
  const toggle = (id: string) => setPicked(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id].slice(-2));
  const combine = () => {
    if (send({ type: 'item/combine', payload: { itemIds: [picked[0], picked[1]] } })) setPicked([]);
    else notify('Hai món này chưa ghép được với nhau.'); // replaces the engine's English reason
  };
  return <Modal title="Túi đồ & Sổ manh mối" wide onClose={onClose}><div className="journal-columns">
    <section><h3>Vật phẩm của An</h3>
      {!state.inventory.itemIds.length && <p>Túi đồ còn trống.</p>}
      {state.inventory.itemIds.map(id => <button key={id} className={`journal-item${picked.includes(id) ? ' selected' : ''}`} aria-pressed={picked.includes(id)} onClick={() => toggle(id)}>
        {itemAsset(id) && <img src={asset(itemAsset(id)!)} alt="" />}
        <span><strong>{content.itemsById.get(id)?.name}</strong><span className="journal-item-text">{content.itemsById.get(id)?.description}</span></span>
      </button>)}
      <p className="fine-print">Chọn 2 vật phẩm rồi bấm Ghép để chế tạo dụng cụ mới.</p>
      <button className="primary" disabled={picked.length !== 2} onClick={combine}>Ghép</button>
    </section>
    <section><h3>Những lời đã ghi nhớ</h3>
      {!state.notebook.unlockedClueIds.length && <p>Trò chuyện và khám phá để ghi lại manh mối.</p>}
      {state.notebook.unlockedClueIds.map(id => <article key={id}><h4>{content.cluesById.get(id)?.title}</h4><p>{content.cluesById.get(id)?.description}</p></article>)}
    </section>
  </div></Modal>;
}
