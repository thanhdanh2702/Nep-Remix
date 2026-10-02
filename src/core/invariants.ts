import type { GameState } from './state.ts';
import type { GameContent } from '../content/index.ts';
import type { ChapterId } from '../content/schema.ts';

// ==========================================
// 1. Invariant Check Functions (INV-01 to INV-12)
// ==========================================

/**
 * INV-01: Bất biến Khu vực & Chương
 * state.journey[currentChapter].currentArea bắt buộc phải là một phân cảnh trực thuộc currentChapter
 * đã khai báo trong Content Catalog.
 */
export function validateAreaAndChapter(state: GameState, content: GameContent): string[] {
  const errors: string[] = [];
  const currentCh = state.currentChapter;
  const currentChContent = content.chapters[currentCh];

  if (!currentChContent) {
    errors.push(`[INV-01] Current chapter '${currentCh}' does not exist in content catalog.`);
    return errors;
  }

  for (const [chKey, progress] of Object.entries(state.journey)) {
    const chContent = content.chapters[chKey];
    if (!chContent) {
      errors.push(`[INV-01] Journey references unknown chapter '${chKey}'.`);
      continue;
    }

    const areaExists = chContent.areas.some((a) => a.id === progress.currentArea);
    if (!areaExists) {
      errors.push(
        `[INV-01] Chapter '${chKey}' currentArea '${progress.currentArea}' is not a declared area of this chapter.`
      );
    }
  }

  return errors;
}

/**
 * INV-02: Bất biến Cờ Lật Vải
 * state.journey[ch].side chỉ được phép nhận giá trị 'mat_trai' KHI VÀ CHỈ KHI
 * state.features.latVai === true VÀ currentArea hiện tại có cấu hình tài nguyên mặt trái.
 */
export function validateFabricFlipFlag(state: GameState, content: GameContent): string[] {
  const errors: string[] = [];

  for (const [chKey, progress] of Object.entries(state.journey)) {
    if (progress.side === 'mat_trai') {
      if (!state.features.latVai) {
        errors.push(
          `[INV-02] Chapter '${chKey}' has side 'mat_trai' but features.latVai is false.`
        );
      }

      const chContent = content.chapters[chKey];
      const area = chContent?.areas.find((a) => a.id === progress.currentArea);
      if (area && !area.sides.trai) {
        errors.push(
          `[INV-02] Chapter '${chKey}' is on side 'mat_trai' but area '${progress.currentArea}' has sides.trai = false.`
        );
      }
    }
  }

  return errors;
}

/**
 * INV-03: Bất biến Nguồn Gốc Manh Mối
 * Mọi clueId nằm trong state.notebook.unlockedClueIds bắt buộc phải thuộc danh sách thoại đã đọc
 * (completedDialogueIds) hoặc câu đố đã giải (solvedPuzzleIds).
 */
export function validateClueOrigin(state: GameState, content: GameContent): string[] {
  const errors: string[] = [];

  // Aggregate all completed dialogues and solved puzzles across all chapters
  const allCompletedDialogues = new Set<string>();
  const allSolvedPuzzles = new Set<string>();

  for (const progress of Object.values(state.journey)) {
    for (const dId of progress.completedDialogueIds) {
      allCompletedDialogues.add(dId);
    }
    for (const pId of progress.solvedPuzzleIds) {
      allSolvedPuzzles.add(pId);
    }
  }

  for (const clueId of state.notebook.unlockedClueIds) {
    const clueDef = content.cluesById.get(clueId);
    if (!clueDef) {
      errors.push(`[INV-03] Notebook contains unknown clue '${clueId}' not in catalog.`);
      continue;
    }

    const dialogueCompleted = allCompletedDialogues.has(clueDef.discoveredInDialogueId) || Object.values(state.journey).some(progress => {
      const active = progress.activeDialogue;
      if (active?.dialogueId !== clueDef.discoveredInDialogueId) return false;
      const dialogue = Object.values(content.chapters).flatMap(ch => ch.dialogues).find(d => d.id === active.dialogueId);
      return dialogue?.nodes.some(node => node.clueId === clueId && active.history.includes(node.id));
    });

    // Also check if clue might be rewarded by an already solved puzzle
    let puzzleSolvedForClue = false;
    for (const ch of Object.values(content.chapters)) {
      for (const p of ch.puzzles) {
        if (allSolvedPuzzles.has(p.id)) {
          // If puzzle triggers the dialogue that contains the clue
          if ('dialogueTriggerId' in p.solution && p.solution.dialogueTriggerId === clueDef.discoveredInDialogueId) {
            puzzleSolvedForClue = true;
            break;
          }
        }
      }
      if (puzzleSolvedForClue) break;
    }

    if (!dialogueCompleted && !puzzleSolvedForClue) {
      errors.push(
        `[INV-03] Clue '${clueId}' unlocked without completing prerequisite dialogue '${clueDef.discoveredInDialogueId}' or solving associated puzzle.`
      );
    }
  }

  return errors;
}

/**
 * INV-04: Bất biến Vật Phẩm Hợp Lệ
 * Toàn bộ itemId trong state.inventory.itemIds bắt buộc phải tồn tại trong từ điển vật phẩm
 * của game (ITEMS_CATALOG), không chứa phần tử rác hoặc undefined.
 */
export function validateInventoryItems(state: GameState, content: GameContent): string[] {
  const errors: string[] = [];

  for (const itemId of state.inventory.itemIds) {
    if (!itemId || typeof itemId !== 'string') {
      errors.push(`[INV-04] Inventory contains null, undefined, or empty item entry.`);
      continue;
    }
    if (!content.itemsById.has(itemId)) {
      errors.push(`[INV-04] Item '${itemId}' in inventory does not exist in items catalog.`);
    }
  }

  return errors;
}

/**
 * INV-05: Bất biến Tài Chính Không Âm
 * Số dư ví tiền state.wallet.senNgoc phải là số nguyên và luôn thỏa mãn: state.wallet.senNgoc >= 0.
 */
export function validateWalletNonNegative(state: GameState): string[] {
  const errors: string[] = [];
  const senNgoc = state.wallet?.senNgoc;

  if (typeof senNgoc !== 'number' || !Number.isInteger(senNgoc)) {
    errors.push(`[INV-05] Sen Ngoc balance must be an integer, got ${senNgoc}.`);
  } else if (senNgoc < 0) {
    errors.push(`[INV-05] Sen Ngoc balance cannot be negative, got ${senNgoc}.`);
  }

  return errors;
}

/**
 * INV-06: Bất biến Sở Hữu Trang Phục
 * Mọi bộ đồ đang lưu trong state.closet.savedOutfits chỉ được phép sử dụng các garmentId và accessoryId
 * đã nằm trong state.closet.unlockedGarmentIds và state.closet.unlockedAccessoryIds.
 */
export function validateClosetOwnership(state: GameState): string[] {
  const errors: string[] = [];
  const unlockedGarments = new Set(state.closet.unlockedGarmentIds);
  const unlockedAccessories = new Set(state.closet.unlockedAccessoryIds);

  for (const outfit of state.closet.savedOutfits) {
    if (!outfit.garmentId || !unlockedGarments.has(outfit.garmentId)) {
      errors.push(
        `[INV-06] Saved outfit '${outfit.id}' uses locked or undeclared garment '${outfit.garmentId}'.`
      );
    }

    if (outfit.equippedAccessories) {
      for (const [slot, accId] of Object.entries(outfit.equippedAccessories)) {
        if (accId && !unlockedAccessories.has(accId)) {
          errors.push(
            `[INV-06] Saved outfit '${outfit.id}' slot '${slot}' uses locked accessory '${accId}'.`
          );
        }
      }
    }
  }

  return errors;
}

/**
 * INV-07: Bất biến Điều Kiện Mở Khóa Câu Đố
 * Nếu một câu đố nằm trong solvedPuzzleIds, thì câu đố phải tồn tại trong content catalog.
 */
export function validatePuzzlePrerequisites(state: GameState, content: GameContent): string[] {
  const errors: string[] = [];

  for (const [chKey, progress] of Object.entries(state.journey)) {
    const chContent = content.chapters[chKey];
    if (!chContent) continue;

    const chPuzzleIds = new Set(chContent.puzzles.map((p) => p.id));

    for (const solvedId of progress.solvedPuzzleIds) {
      if (!chPuzzleIds.has(solvedId as any)) {
        errors.push(
          `[INV-07] Chapter '${chKey}' has solvedPuzzleId '${solvedId}' which is not a declared puzzle in this chapter.`
        );
      }
    }
  }

  return errors;
}

/**
 * INV-08: Bất biến Toàn Vẹn Ngăn Xếp Điều Hướng
 * Mọi phần tử trong navStack bắt buộc phải là các khu vực thuộc cùng currentChapter hiện tại;
 * không bao giờ chứa khu vực của chương khác.
 */
export function validateNavStackIntegrity(state: GameState, content: GameContent): string[] {
  const errors: string[] = [];

  for (const [chKey, progress] of Object.entries(state.journey)) {
    const chContent = content.chapters[chKey];
    if (!chContent) continue;

    const validAreaIds = new Set(chContent.areas.map((a) => a.id));

    for (const stackArea of progress.navStack) {
      if (!validAreaIds.has(stackArea as any)) {
        errors.push(
          `[INV-08] navStack of chapter '${chKey}' contains foreign or invalid area '${stackArea}'.`
        );
      }
    }
  }

  return errors;
}

/**
 * INV-09: Bất biến Đơn Phiên Duy Nhất
 * Trường state.activeSession chỉ được phép là null hoặc chứa DUY NHẤT một phiên làm việc
 * (StudioSession hoặc PuzzleSession), không thể lồng hai phiên cùng lúc.
 */
export function validateSingleActiveSession(state: GameState): string[] {
  const errors: string[] = [];
  const session = state.activeSession;

  if (session === null) {
    return errors;
  }

  if (typeof session !== 'object') {
    errors.push(`[INV-09] activeSession must be null or an object.`);
    return errors;
  }

  if (session.type !== 'studio' && session.type !== 'puzzle') {
    errors.push(
      `[INV-09] activeSession has invalid type '${(session as any).type}'. Must be 'studio' or 'puzzle'.`
    );
  }

  return errors;
}

/**
 * INV-10: Bất biến Một Chiều Của Phần Thưởng
 * Cờ claimed của mỗi chương một khi đã nhận giá trị true thì trạng thái chương phải là 'completed'.
 */
export function validateOneWayRewardClaim(state: GameState, _content: GameContent): string[] {
  const errors: string[] = [];

  for (const [chKey, progress] of Object.entries(state.journey)) {
    if (progress.claimed && progress.status !== 'completed') {
      errors.push(
        `[INV-10] Chapter '${chKey}' has claimed = true but status is '${progress.status}' (expected 'completed').`
      );
    }
  }

  return errors;
}

/**
 * INV-11: Bất biến Bậc Gợi Ý
 * Bậc gợi ý hintTiers[puzzleId] của mỗi câu đố chỉ nhận giá trị nguyên nằm trong khoảng đóng [0, 3].
 */
export function validateHintTierBounds(state: GameState): string[] {
  const errors: string[] = [];

  for (const [chKey, progress] of Object.entries(state.journey)) {
    for (const [puzzleId, tier] of Object.entries(progress.hintTiers)) {
      if (typeof tier !== 'number' || !Number.isInteger(tier) || tier < 0 || tier > 3) {
        errors.push(
          `[INV-11] Chapter '${chKey}' puzzle '${puzzleId}' has invalid hint tier ${tier}. Must be an integer in [0, 3].`
        );
      }
    }
  }

  return errors;
}

/**
 * INV-12: Bất biến Tiến Trình Bảo Tàng
 * Mọi cardId nằm trong claimedCardIds bắt buộc phải xuất hiện trong readCardIds
 * (chỉ được nhận 15 Sen Ngọc sau khi đã mở đọc thẻ).
 */
export function validateMuseumProgress(state: GameState, content: GameContent): string[] {
  const errors: string[] = [];
  const readCards = new Set(state.museum.readCardIds);

  for (const cardId of state.museum.readCardIds) {
    if (!content.cultureCardsById.has(cardId)) {
      errors.push(`[INV-12] Read culture card '${cardId}' does not exist in catalog.`);
    }
  }

  for (const cardId of state.museum.claimedCardIds) {
    if (!readCards.has(cardId)) {
      errors.push(`[INV-12] Culture card '${cardId}' was claimed before being read.`);
    }
    if (!content.cultureCardsById.has(cardId)) {
      errors.push(`[INV-12] Claimed culture card '${cardId}' does not exist in catalog.`);
    }
  }

  return errors;
}

// ==========================================
// 2. Composite Validation Function
// ==========================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateState(state: GameState, content: GameContent): ValidationResult {
  const errors: string[] = [
    ...validateAreaAndChapter(state, content),
    ...validateFabricFlipFlag(state, content),
    ...validateClueOrigin(state, content),
    ...validateInventoryItems(state, content),
    ...validateWalletNonNegative(state),
    ...validateClosetOwnership(state),
    ...validatePuzzlePrerequisites(state, content),
    ...validateNavStackIntegrity(state, content),
    ...validateSingleActiveSession(state),
    ...validateOneWayRewardClaim(state, content),
    ...validateHintTierBounds(state),
    ...validateMuseumProgress(state, content)
  ];

  return {
    valid: errors.length === 0,
    errors
  };
}
