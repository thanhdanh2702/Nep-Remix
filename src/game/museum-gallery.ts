import type { CultureCard, Garment } from '../content/schema';
import type { GameState } from '../core';
import { content } from './store';
import { itemAsset } from './assets';
import { metSpeakers, foundItems } from './museum-codex-data';
import type { Portrait } from './npc-portraits';
import { isHistoricalGarment } from '../content/garment-catalog';

export type MuseumTab = 'culture' | 'characters' | 'items';
export interface MuseumEntry {
  id: string; title: string; label: string; subtitle: string; description: string;
  unlocked: boolean; completed: boolean; card?: CultureCard; garment?: Garment;
  portrait?: Portrait; image?: string; pixel?: boolean; artworkPending?: boolean;
}
const pendingGarmentArt = new Set(['trang-phuc-hon-le-truyen-thong', 'trang-phuc-tang-le-truyen-thong', 'ao-nhat-binh', 'ao-giao-linh', 'ao-yem', 'ao-ba-ba', 'trang-phuc-hau-dong-tho-mau']);
const featured = ['ao-ngu-than-tay-chen', 'ao-tu-than', 'ao-ngu-than-tay-thung', 'ao-dai-tan-thoi-lemur', 'card-tiem-may-nep-origins', 'card-tong-ket-nam-the-he-phu-nu'];
const labels: Record<string, string> = {
  'ao-ngu-than-tay-chen': 'Áo ngũ thân', 'ao-ngu-than-tay-thung': 'Áo tấc',
  'ao-dai-tan-thoi-lemur': 'Áo dài Lemur', 'card-tiem-may-nep-origins': 'Tư liệu nếp nhà',
  'card-tong-ket-nam-the-he-phu-nu': 'Ký ức nghề may',
};
export function museumEntries(tab: MuseumTab, state: GameState): MuseumEntry[] {
  if (tab === 'characters') return metSpeakers(state, content).map(c => ({
    id: c.name, title: c.met ? c.name : 'Nhân vật chưa gặp', label: c.met ? c.name : '???',
    subtitle: c.met ? c.chapterTitle : 'Một ký ức chưa mở',
    description: c.met ? `Đã gặp ${c.name} trong ${c.chapterTitle}.` : 'Tiếp tục câu chuyện để khám phá nhân vật này.',
    unlocked: c.met, completed: c.met, portrait: c.portrait,
  }));
  if (tab === 'items') return foundItems(state, content).map(i => ({
    id: i.id, title: i.found ? i.name : 'Kỷ vật chưa tìm thấy', label: i.found ? i.name : '???',
    subtitle: i.found ? 'Kỷ vật của nếp nhà' : 'Một ký ức chưa mở',
    description: i.found ? i.description : 'Khám phá các căn phòng và câu chuyện để tìm kỷ vật này.',
    unlocked: i.found, completed: i.found, image: itemAsset(i.id), pixel: true,
  }));
  const cards = content.cultureCards.filter(card => !card.garmentId || isHistoricalGarment(card.garmentId)).sort((a, b) => {
    const rank = (id: string) => { const at = featured.indexOf(id); return at < 0 ? featured.length + content.cultureCards.findIndex(c => c.id === id) : at; };
    return rank(a.id) - rank(b.id);
  });
  return cards.map(card => ({
    id: card.id, title: card.title, label: labels[card.id] ?? card.title,
    subtitle: card.timePeriod, description: card.historicalFact, unlocked: true,
    completed: state.museum.readCardIds.includes(card.id), card,
    artworkPending: pendingGarmentArt.has(card.id),
    garment: card.garmentId ? content.garmentsById.get(card.garmentId) : undefined,
    image: `assets/screens/museum/${card.id === 'card-tong-ket-nam-the-he-phu-nu' ? 'sewing-memory' : 'archive-folio'}.png`,
  }));
}
