import type { HairLength } from '../server/ai/analyze-selfie';

type Outfit = 'default' | 'jade' | 'rose';

/** Outfit variant encoded in a client preset (`an-{bob|long}-{default|jade|rose}`). */
function outfitOf(preset: string): Outfit {
  return preset.includes('jade') ? 'jade' : preset.includes('rose') ? 'rose' : 'default';
}

/** Map the server's selfie hair length onto a client avatar preset, keeping the outfit of `current`. */
export function presetFromSelfie(hairLength: HairLength, current: string): string {
  return `an-${hairLength === 'ngan' ? 'bob' : 'long'}-${outfitOf(current)}`;
}
