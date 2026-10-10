/** Story-specific designs remain resolvable in saves, outside the historical catalog. */
const storyDesigns = new Set(['ao-dai-cuoi-phin', 'ao-dai-popolin', 'ao-ngu-than-remix-2026']);
export const isHistoricalGarment = (id: string) => !storyDesigns.has(id);
