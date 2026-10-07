import type { CommandDef } from '../../command.ts';
import type { GameState } from '../../state.ts';
import type { GameContent } from '../../../content/index.ts';
import type { ChapterId } from '../../../content/schema.ts';
import { chapterCompleteCommand } from './chapter-commands.ts';

// ==========================================
// reward/claim (one-way)
// ==========================================

export interface RewardClaimPayload {
  chapterId: ChapterId;
}

export const rewardClaimCommand: CommandDef<RewardClaimPayload> = {
  type: 'reward/claim',
  kind: 'one-way',

  guard: (state: GameState, payload: RewardClaimPayload, content: GameContent) => {
    const { chapterId } = payload;
    if (!chapterId || !content.chapters[chapterId]) {
      return { ok: false, reason: `Chapter '${chapterId}' does not exist.` };
    }

    const chProgress = state.journey[chapterId];
    if (!chProgress) {
      return { ok: false, reason: `No progress record for chapter '${chapterId}'.` };
    }

    if (chProgress.claimed || state.claimedRewardIds?.includes(content.chapters[chapterId].chapter.reward.id)) {
      return {
        ok: false,
        reason: `Reward for chapter '${chapterId}' has already been claimed.`
      };
    }

    if (chProgress.status !== 'completed') {
      return {
        ok: false,
        reason: `Cannot claim reward: chapter '${chapterId}' is not yet completed.`
      };
    }

    // Completed legacy snapshots keep their history, but pending claims must
    // pass today's C2 reading gates. Claimed rewards were rejected above.
    if (chapterId === 'c2') return chapterCompleteCommand.guard(state, { chapterId }, content);

    return true;
  },

  apply: (state: GameState, payload: RewardClaimPayload, content: GameContent) => {
    const { chapterId } = payload;
    const chProgress = state.journey[chapterId];
    const rewardMeta = content.chapters[chapterId]?.chapter?.reward;
    const amount = rewardMeta?.senNgoc ?? 100;

    const nextState: GameState = {
      ...state,
      ...grantRewardGifts(state, content.chapters[chapterId].chapter.reward),
      claimedRewardIds: [...new Set([...(state.claimedRewardIds ?? []), content.chapters[chapterId].chapter.reward.id])],
      wallet: {
        senNgoc: state.wallet.senNgoc + amount
      },
      journey: {
        ...state.journey,
        [chapterId]: {
          ...chProgress,
          claimed: true
        }
      }
    };

    return {
      state: nextState,
      events: [
        {
          type: 'rewardGranted',
          payload: {
            rewardId: rewardMeta.id,
            amount
          }
        }
      ]
    };
  },

  invert: () => null
};

/** Shared by atomic claim and legacy repair. Currency is deliberately excluded. */
export function grantRewardGifts(state: GameState, reward: import('../../../content/schema.ts').Reward): GameState {
  const union = (old: string[], added: readonly string[] = []) => [...new Set([...old, ...added])];
  return {
    ...state,
    inventory: { ...state.inventory, itemIds: union(state.inventory.itemIds, reward.itemIds) },
    closet: { ...state.closet,
      unlockedGarmentIds: union(state.closet.unlockedGarmentIds, reward.garmentIds),
      unlockedAccessoryIds: union(state.closet.unlockedAccessoryIds, reward.accessoryIds) },
    museum: { ...state.museum, unlockedCardIds: union(state.museum.unlockedCardIds ?? [], reward.cardIds) }
  };
}
