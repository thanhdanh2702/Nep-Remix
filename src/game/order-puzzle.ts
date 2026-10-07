/**
 * Logic and helpers for the Order puzzle (Chương 2 dải bản vẽ).
 * Manages piece sequence, keyboard navigation, and draft payload formatting.
 */

export const ALL_C2_STRIPS = [
  'manh_ban_ve_ao_dai_1',
  'manh_ban_ve_ao_dai_2',
  'manh_ban_ve_ao_dai_3',
  'manh_ban_ve_ao_dai_4',
] as const;

export function addOrderPiece(currentSeq: string[], id: string): string[] {
  if (currentSeq.includes(id)) return currentSeq;
  return [...currentSeq, id];
}

export function removeOrderPiece(currentSeq: string[], index: number): string[] {
  if (index < 0 || index >= currentSeq.length) return currentSeq;
  return currentSeq.filter((_, i) => i !== index);
}

export function moveOrderPieceLeft(currentSeq: string[], index: number): string[] {
  if (index <= 0 || index >= currentSeq.length) return currentSeq;
  const next = [...currentSeq];
  [next[index - 1], next[index]] = [next[index], next[index - 1]];
  return next;
}

export function moveOrderPieceRight(currentSeq: string[], index: number): string[] {
  if (index < 0 || index >= currentSeq.length - 1) return currentSeq;
  const next = [...currentSeq];
  [next[index + 1], next[index]] = [next[index], next[index + 1]];
  return next;
}

export function resetOrderSeq(): string[] {
  return [];
}

export function handleOrderSlotKey(
  key: string,
  index: number,
  currentSeq: string[],
  preventDefault: () => void,
  onUpdate: (next: string[]) => void
): boolean {
  if (key === 'ArrowLeft') {
    preventDefault();
    if (index > 0) {
      onUpdate(moveOrderPieceLeft(currentSeq, index));
      return true;
    }
    return false;
  }
  if (key === 'ArrowRight') {
    preventDefault();
    if (index < currentSeq.length - 1) {
      onUpdate(moveOrderPieceRight(currentSeq, index));
      return true;
    }
    return false;
  }
  if (key === 'Delete' || key === 'Backspace') {
    preventDefault();
    onUpdate(removeOrderPiece(currentSeq, index));
    return true;
  }
  return false;
}
