export interface Trigram {
  id: string;
  name: string;
  symbol: string;
}

export const BAGUA_TRIGRAMS: Trigram[] = [
  { id: 'CAN', name: 'Càn', symbol: '☰' },
  { id: 'KHAM', name: 'Khảm', symbol: '☵' },
  { id: 'CAN_MT', name: 'Cấn', symbol: '☶' },
  { id: 'CHAN', name: 'Chấn', symbol: '☳' },
  { id: 'TON', name: 'Tốn', symbol: '☴' },
  { id: 'LY', name: 'Ly', symbol: '☲' },
  { id: 'KHON', name: 'Khôn', symbol: '☷' },
  { id: 'DOAI', name: 'Đoài', symbol: '☱' },
];

export const VALID_BAGUA_IDS: ReadonlySet<string> = new Set(BAGUA_TRIGRAMS.map(t => t.id));

export function isBaguaPuzzle(puzzle: { id: string; type?: string }): boolean {
  return puzzle.id === 'p-c3-bagua-lock';
}

export function parseBaguaDraft(raw: unknown): { ring1: string; ring2: string } {
  if (typeof raw !== 'string') return { ring1: '', ring2: '' };
  const str = raw.trim();
  if (!str) return { ring1: '', ring2: '' };

  // Case 1: Partial draft with only ring 2 selected: `_TON` or `_CAN_MT`
  if (str.startsWith('_')) {
    const candidate2 = str.slice(1);
    return {
      ring1: '',
      ring2: VALID_BAGUA_IDS.has(candidate2) ? candidate2 : '',
    };
  }

  // Case 2: Partial draft with only ring 1 selected and trailing underscore: `CAN_` or `CAN_MT_`
  if (str.endsWith('_')) {
    const candidate1 = str.slice(0, -1);
    return {
      ring1: VALID_BAGUA_IDS.has(candidate1) ? candidate1 : '',
      ring2: '',
    };
  }

  // Case 3: Both rings or joined tokens
  // Check CAN_MT as ring 1 first (longest prefix containing an underscore)
  if (str.startsWith('CAN_MT_')) {
    const candidate2 = str.slice('CAN_MT_'.length);
    return {
      ring1: 'CAN_MT',
      ring2: VALID_BAGUA_IDS.has(candidate2) ? candidate2 : '',
    };
  }

  // Check all other valid trigrams as ring 1
  for (const trigram of BAGUA_TRIGRAMS) {
    if (trigram.id === 'CAN_MT') continue;
    const prefix = `${trigram.id}_`;
    if (str.startsWith(prefix)) {
      const candidate2 = str.slice(prefix.length);
      return {
        ring1: trigram.id,
        ring2: VALID_BAGUA_IDS.has(candidate2) ? candidate2 : '',
      };
    }
  }

  // Single valid token without trailing underscore
  if (VALID_BAGUA_IDS.has(str)) {
    return { ring1: str, ring2: '' };
  }

  return { ring1: '', ring2: '' };
}

export function formatBaguaDraft(ring1: string, ring2: string): string {
  const r1 = VALID_BAGUA_IDS.has(ring1) ? ring1 : '';
  const r2 = VALID_BAGUA_IDS.has(ring2) ? ring2 : '';
  if (!r1 && !r2) return '';
  return `${r1}_${r2}`;
}

export function isBaguaComplete(ring1: string, ring2: string): boolean {
  return VALID_BAGUA_IDS.has(ring1) && VALID_BAGUA_IDS.has(ring2);
}
