import type { CommandDef } from '../../command.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';

// ==========================================
// museum/readCard (one-way)
// ==========================================
// Marks card as read. Grants +15 Sen Ngọc on first read only.

export interface MuseumReadCardPayload {
  cardId: string;
}

export const museumReadCardCommand: CommandDef<MuseumReadCardPayload> = {
  type: 'museum/readCard',
  kind: 'one-way',

  guard: (_state: GameState, payload: MuseumReadCardPayload, content: GameContent) => {
    const { cardId } = payload;
    if (!cardId || !content.cultureCardsById.has(cardId)) {
      return { ok: false, reason: `Culture card '${cardId}' does not exist in catalog.` };
    }
    return true;
  },

  apply: (state: GameState, payload: MuseumReadCardPayload) => {
    const { cardId } = payload;
    const isAlreadyRead = state.museum.readCardIds.includes(cardId);
    const isAlreadyClaimed = state.museum.claimedCardIds.includes(cardId);

    const nextRead = isAlreadyRead
      ? state.museum.readCardIds
      : [...state.museum.readCardIds, cardId];

    let nextClaimed = state.museum.claimedCardIds;
    let nextSenNgoc = state.wallet.senNgoc;
    const events: any[] = [];

    // Grant 15 Sen Ngọc if reading and claiming for the very first time
    if (!isAlreadyClaimed) {
      nextClaimed = [...nextClaimed, cardId];
      nextSenNgoc += 15;
      events.push({
        type: 'rewardGranted',
        payload: {
          rewardId: `card-${cardId}`,
          amount: 15
        }
      });
    }

    const nextState: GameState = {
      ...state,
      wallet: {
        senNgoc: nextSenNgoc
      },
      museum: {
        ...state.museum,
        readCardIds: nextRead,
        claimedCardIds: nextClaimed
      }
    };

    return {
      state: nextState,
      events
    };
  },

  invert: () => null
};
