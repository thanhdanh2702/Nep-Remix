import type { CommandDef } from '../../command.ts';

export * from './studio-commands.ts';
export * from './evaluate-outfit.ts';
export * from './challenge-wardrobe.ts';

import {
  studioOpenCommand,
  studioSelectEventCommand,
  studioSetSilhouetteCommand,
  studioSetColorCommand,
  studioEquipCommand,
  studioUnequipCommand,
  studioApplyPresetCommand,
  studioCloseCommand
} from './studio-commands.ts';

export const allStudioCommands: CommandDef<any>[] = [
  studioOpenCommand,
  studioSelectEventCommand,
  studioSetSilhouetteCommand,
  studioSetColorCommand,
  studioEquipCommand,
  studioUnequipCommand,
  studioApplyPresetCommand,
  studioCloseCommand
];
