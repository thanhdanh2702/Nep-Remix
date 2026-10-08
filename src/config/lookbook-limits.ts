// Lookbook limits shared by the server (limiter, cache, stream budget) and the browser (timeouts, payload caps).
// Pure constants, no imports: safe for both sides.
export const LOOKBOOK_LIMITS = {
  // Per-IP limiter: units spent in a sliding window. A full lookbook costs 4 units, one angle retry costs 1.
  windowMs: 600_000,
  unitsPerWindow: 12,
  lookbookUnits: 4,
  angleUnits: 1,
  // Global daily cap (UTC day), counted in lookbooks. Override with env LOOKBOOK_DAILY_LIMIT.
  dailyLimitDefault: 10,
  // Cloud Run request timeout is 120s: stop generating at 100s so the stream still closes cleanly.
  streamBudgetMs: 100_000,
  clientStreamTimeoutMs: 110_000,
  heartbeatMs: 15_000,
  cacheMaxEntries: 6,
  cacheTtlMs: 1_800_000,
  // Max characters of a base64 data URL per image field.
  maxChars: { person: 1_200_000, background: 1_200_000, hero: 3_400_000 }
} as const;
