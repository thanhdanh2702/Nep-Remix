import type { CommandRegistry } from '../../registry.ts';
import { defaultRegistry } from '../../registry.ts';

import { chapterEnterCommand, chapterReplayCommand, chapterCompleteCommand } from './chapter-commands.ts';
import { areaGoToCommand, areaGoBackCommand, sideFlipCommand } from './area-commands.ts';
import { interactCommand, nearestInteractable } from './interact-command.ts';
import { dialogueAdvanceCommand, dialogueChooseCommand, clueCollectCommand } from './dialogue-commands.ts';
import { itemPickCommand, itemUseCommand, itemCombineCommand } from './item-commands.ts';
import {
  puzzleSubmitCommand,
  puzzleOpenCommand,
  puzzleSolveCommand,
  puzzleHintCommand,
  puzzleSkipCommand
} from './puzzle-commands.ts';
import { rewardClaimCommand } from './reward-commands.ts';

import type { CommandDef } from '../../command.ts';

export * from './chapter-commands.ts';
export * from './area-commands.ts';
export * from './interact-command.ts';
export * from './dialogue-commands.ts';
export * from './item-commands.ts';
export * from './puzzle-commands.ts';
export * from './reward-commands.ts';

export * from './draft-commands.ts';
import { puzzleUpdateDraftCommand, puzzleResetDraftCommand } from './draft-commands.ts';

export const allJourneyCommands: CommandDef<any>[] = [
  chapterEnterCommand,
  chapterReplayCommand,
  chapterCompleteCommand,
  areaGoToCommand,
  areaGoBackCommand,
  sideFlipCommand,
  interactCommand,
  dialogueAdvanceCommand,
  dialogueChooseCommand,
  clueCollectCommand,
  itemPickCommand,
  itemUseCommand,
  itemCombineCommand,
  puzzleSubmitCommand,
  puzzleOpenCommand,
  puzzleSolveCommand,
  puzzleHintCommand,
  puzzleSkipCommand,
  puzzleUpdateDraftCommand,
  puzzleResetDraftCommand,
  rewardClaimCommand
];

export function registerJourneyCommands(registry: CommandRegistry = defaultRegistry): void {
  for (const cmd of allJourneyCommands) {
    if (!registry.has(cmd.type)) {
      registry.register(cmd);
    }
  }
}

// Auto-register journey commands to defaultRegistry
registerJourneyCommands(defaultRegistry);

export * from './gate.ts';
