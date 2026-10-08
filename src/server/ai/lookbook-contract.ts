// Lookbook API contract: request schemas, stream events and error codes. Browser-safe (imports zod only).
import { z } from 'zod';
import { LOOKBOOK_LIMITS } from '../../config/lookbook-limits.ts';

export const LOOKBOOK_ANGLE_IDS = ['front', 'turn', 'back', 'detail'] as const;
export type LookbookAngleId = typeof LOOKBOOK_ANGLE_IDS[number];
export const LOOKBOOK_MOOD_IDS = ['pho-co', 'vuon-hoa', 'tuong-voi', 'san-nha', 'custom'] as const;
export type LookbookMoodId = typeof LOOKBOOK_MOOD_IDS[number];
// Same ids as studio.json events.
export const LOOKBOOK_EVENT_IDS = ['dao_pho', 'tet', 'dam_cuoi', 'be_giang', 'le_chua', 'vieng_tang'] as const;
export type LookbookEventId = typeof LOOKBOOK_EVENT_IDS[number];
export type LookbookMode = 'fictional' | 'personal';
export type LookbookReason = 'ai_unavailable' | 'timeout' | 'invalid_output' | 'rate_limited' | 'safety_blocked' | 'quota_exhausted';

const dataUrl = (maxChars: number) =>
  z.string().max(maxChars).regex(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/).transform(v => v.toLowerCase());

const requestShape = {
  mode: z.enum(['fictional', 'personal']),
  modelGender: z.enum(['female', 'male']).default('female'),
  personImage: dataUrl(LOOKBOOK_LIMITS.maxChars.person).optional(),
  backgroundImage: dataUrl(LOOKBOOK_LIMITS.maxChars.background).optional(),
  garmentId: z.string().min(1).max(60),
  colorPalette: z.tuple([hex, hex, hex, hex]),
  accessoryIds: z.array(z.string().min(1).max(60)).max(4).refine(ids => new Set(ids).size === ids.length, 'duplicate accessory'),
  eventId: z.enum(LOOKBOOK_EVENT_IDS).default('dao_pho'),
  moodId: z.enum(LOOKBOOK_MOOD_IDS),
  noCache: z.boolean().optional()
};

type RequestRules = { mode: LookbookMode; personImage?: string; backgroundImage?: string; moodId: LookbookMoodId };

// personImage: required in personal mode, forbidden in fictional. backgroundImage: required only for moodId 'custom'.
function checkRules(v: RequestRules, ctx: z.RefinementCtx): void {
  if ((v.mode === 'personal') !== (v.personImage !== undefined)) {
    ctx.addIssue({ code: 'custom', path: ['personImage'], message: 'personImage must be sent in personal mode only' });
  }
  if ((v.moodId === 'custom') !== (v.backgroundImage !== undefined)) {
    ctx.addIssue({ code: 'custom', path: ['backgroundImage'], message: 'backgroundImage must be sent with moodId custom only' });
  }
}

export const LookbookRequestSchema = z.object(requestShape).strict().superRefine(checkRules);
export const LookbookAngleRequestSchema = z.object({
  ...requestShape,
  angle: z.enum(LOOKBOOK_ANGLE_IDS),
  heroImage: dataUrl(LOOKBOOK_LIMITS.maxChars.hero).optional(),
  heroToken: z.string().max(128).optional()
}).strict().superRefine(checkRules);
export const LookbookCheckRequestSchema = z.object({ personImage: dataUrl(LOOKBOOK_LIMITS.maxChars.person) }).strict();

export type LookbookRequest = z.infer<typeof LookbookRequestSchema>;
export type LookbookAngleRequest = z.infer<typeof LookbookAngleRequestSchema>;

export interface LookbookCheckResult {
  onePerson: boolean;
  faceVisible: boolean;
  fullBody: boolean;
  looksAdult: boolean;
  verdict: 'ok' | 'warn' | 'block';
}

// SSE wire format: "event: <type>\ndata: <json>\n\n"; ": ping" comment lines are heartbeats.
export type LookbookStreamEvent =
  | { type: 'start'; data: { total: 4; cached: boolean } }
  | { type: 'angle'; data: { id: LookbookAngleId; status: 'done' | 'error'; image?: string; reason?: LookbookReason; heroToken?: string } }
  | { type: 'done'; data: { completed: number } };
