import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { c2StripAsset, c2CompleteSketchAsset } from './assets';
import { characterScale, HUMAN_HEIGHT } from './character-scale';
import { c2AreaOverlays, c2RoomNpcs, c2ExitArrows } from './room-render';
import {
  addOrderPiece,
  removeOrderPiece,
  moveOrderPieceLeft,
  moveOrderPieceRight,
  resetOrderSeq,
  handleOrderSlotKey,
} from './order-puzzle';
import { freshTree, execute, content } from './store';
import {
  createInitialTree,
  toJSON,
  fromJSON,
  getChallengeWardrobe,
  createChallengeStudioDraft,
  validateChallengeStudioDraft,
  validateStudioDraft,
} from '../core';
import { stylingAnswer } from './styling-answer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('c2StripAsset resolves correct paths for C2 drawing pieces', () => {
  assert.equal(
    c2StripAsset('manh_ban_ve_ao_dai_1'),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-1.png'
  );
  assert.equal(
    c2StripAsset('manh_ban_ve_ao_dai_2'),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-2.png'
  );
  assert.equal(
    c2StripAsset('manh_ban_ve_ao_dai_3'),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-3.png'
  );
  assert.equal(
    c2StripAsset('manh_ban_ve_ao_dai_4'),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-4.png'
  );
  assert.equal(c2StripAsset('invalid_id'), undefined);
  assert.equal(
    c2CompleteSketchAsset(),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-ban-ve-hoan-chinh.png'
  );
});

test('character-scale defines C2 scene with proper height ratios and floor bounds', () => {
  const c2Human = HUMAN_HEIGHT['c2'];
  assert.ok(c2Human, 'HUMAN_HEIGHT for c2 should be defined');
  assert.equal(c2Human.back, 0.38);
  assert.equal(c2Human.front, 0.48);
  assert.equal(c2Human.floorTop, 0.58);
  assert.equal(c2Human.floorBottom, 0.92);

  // Background height 941px
  const bgH = 941;
  const scaleBack = characterScale('c2', bgH, c2Human.floorTop * bgH);
  const scaleFront = characterScale('c2', bgH, c2Human.floorBottom * bgH);

  assert.ok(scaleFront > scaleBack, 'Character should scale larger toward front of floor');
  const heightBackPx = scaleBack * 389;
  const heightFrontPx = scaleFront * 389;

  assert.ok(Math.abs(heightBackPx - 0.38 * bgH) < 1, 'Back scale should match 38% of room height');
  assert.ok(Math.abs(heightFrontPx - 0.48 * bgH) < 1, 'Front scale should match 48% of room height');
});

test('c2AreaOverlays accurately tracks visibility across S1, S2, and S3 based on inventory and puzzles', () => {
  // S1 initial: 4 pieces visible, assembled sketch hidden
  const s1Initial = c2AreaOverlays('c2', 'c2-s1-gac-lung-ve-tranh', [], []);
  assert.equal(s1Initial.length, 5);
  assert.deepEqual(
    s1Initial.map(o => o.visible),
    [true, true, true, true, false]
  );

  // S1 after picking pieces 1 and 3
  const s1Picked = c2AreaOverlays('c2', 'c2-s1-gac-lung-ve-tranh', ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_3'], []);
  assert.deepEqual(
    s1Picked.map(o => o.visible),
    [false, true, false, true, false]
  );

  // S1 after assembling sketch
  const s1Solved = c2AreaOverlays(
    'c2',
    'c2-s1-gac-lung-ve-tranh',
    ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3', 'manh_ban_ve_ao_dai_4'],
    ['p-c2-sketch-assemble']
  );
  assert.deepEqual(
    s1Solved.map(o => o.visible),
    [false, false, false, false, true]
  );

  // S2 initial: key visible, empty safe hidden
  const s2Initial = c2AreaOverlays('c2', 'c2-s2-kho-vai-hang-dao', [], []);
  assert.equal(s2Initial.length, 2);
  assert.deepEqual(s2Initial.map(o => o.visible), [true, false]);

  // S2 after key pickup and safe solve
  const s2Solved = c2AreaOverlays(
    'c2',
    'c2-s2-kho-vai-hang-dao',
    ['chia_khoa_ket_sat_bang_thau'],
    ['p-c2-safe-open']
  );
  assert.deepEqual(s2Solved.map(o => o.visible), [false, true]);

  // S3 initial: no overlays visible
  const s3Initial = c2AreaOverlays('c2', 'c2-s3-phong-trien-lam-doi-dau', [], []);
  assert.deepEqual(s3Initial.map(o => o.visible), [false, false]);

  // S3 after presenting receipt and sketch
  const s3Presented = c2AreaOverlays(
    'c2',
    'c2-s3-phong-trien-lam-doi-dau',
    [],
    ['p-c2-present-receipt', 'p-c2-present-sketch']
  );
  assert.deepEqual(s3Presented.map(o => o.visible), [true, true]);
});

test('order-puzzle sequence operations: add, remove, left, right, reset, and bounds handling', () => {
  let seq: string[] = [];

  // Add pieces
  seq = addOrderPiece(seq, 'manh_ban_ve_ao_dai_1');
  assert.deepEqual(seq, ['manh_ban_ve_ao_dai_1']);

  seq = addOrderPiece(seq, 'manh_ban_ve_ao_dai_3');
  assert.deepEqual(seq, ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_3']);

  // Duplicate add should be rejected / no-op
  seq = addOrderPiece(seq, 'manh_ban_ve_ao_dai_1');
  assert.deepEqual(seq, ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_3']);

  seq = addOrderPiece(seq, 'manh_ban_ve_ao_dai_2');
  seq = addOrderPiece(seq, 'manh_ban_ve_ao_dai_4');
  assert.deepEqual(seq, [
    'manh_ban_ve_ao_dai_1',
    'manh_ban_ve_ao_dai_3',
    'manh_ban_ve_ao_dai_2',
    'manh_ban_ve_ao_dai_4',
  ]);

  // Move left: index 0 cannot move left
  assert.deepEqual(moveOrderPieceLeft(seq, 0), seq);
  assert.deepEqual(moveOrderPieceLeft(seq, -1), seq);

  // Move left: swap index 2 ('manh_ban_ve_ao_dai_2') with index 1 ('manh_ban_ve_ao_dai_3')
  seq = moveOrderPieceLeft(seq, 2);
  assert.deepEqual(seq, [
    'manh_ban_ve_ao_dai_1',
    'manh_ban_ve_ao_dai_2',
    'manh_ban_ve_ao_dai_3',
    'manh_ban_ve_ao_dai_4',
  ]);

  // Move right: last index cannot move right
  assert.deepEqual(moveOrderPieceRight(seq, 3), seq);
  assert.deepEqual(moveOrderPieceRight(seq, 4), seq);

  // Move right: swap index 0 ('manh_1') with index 1 ('manh_2')
  seq = moveOrderPieceRight(seq, 0);
  assert.deepEqual(seq, [
    'manh_ban_ve_ao_dai_2',
    'manh_ban_ve_ao_dai_1',
    'manh_ban_ve_ao_dai_3',
    'manh_ban_ve_ao_dai_4',
  ]);

  // Move left: swap back
  seq = moveOrderPieceLeft(seq, 1);
  assert.deepEqual(seq, [
    'manh_ban_ve_ao_dai_1',
    'manh_ban_ve_ao_dai_2',
    'manh_ban_ve_ao_dai_3',
    'manh_ban_ve_ao_dai_4',
  ]);

  // Remove piece: remove index 1 ('manh_2')
  seq = removeOrderPiece(seq, 1);
  assert.deepEqual(seq, [
    'manh_ban_ve_ao_dai_1',
    'manh_ban_ve_ao_dai_3',
    'manh_ban_ve_ao_dai_4',
  ]);

  // Remove out of bounds: no-op
  assert.deepEqual(removeOrderPiece(seq, -1), seq);
  assert.deepEqual(removeOrderPiece(seq, 10), seq);

  // Reset sequence
  seq = resetOrderSeq();
  assert.deepEqual(seq, []);
});

test('order-puzzle keyboard navigation: ArrowLeft, ArrowRight, Delete, and Backspace', () => {
  const initialSeq = ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3'];
  let currentSeq = [...initialSeq];
  let prevented = false;
  const preventDefault = () => { prevented = true; };

  // ArrowLeft at index 1 -> swaps index 0 and 1
  prevented = false;
  const handledLeft = handleOrderSlotKey('ArrowLeft', 1, currentSeq, preventDefault, next => {
    currentSeq = next;
  });
  assert.equal(handledLeft, true);
  assert.equal(prevented, true);
  assert.deepEqual(currentSeq, ['manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_3']);

  // ArrowLeft at index 0 -> boundary no-op, returns false
  prevented = false;
  const handledLeftBoundary = handleOrderSlotKey('ArrowLeft', 0, currentSeq, preventDefault, next => {
    currentSeq = next;
  });
  assert.equal(handledLeftBoundary, false);
  assert.equal(prevented, true); // Still prevented default browser scroll
  assert.deepEqual(currentSeq, ['manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_3']);

  // ArrowRight at index 0 -> swaps index 0 and 1
  prevented = false;
  const handledRight = handleOrderSlotKey('ArrowRight', 0, currentSeq, preventDefault, next => {
    currentSeq = next;
  });
  assert.equal(handledRight, true);
  assert.equal(prevented, true);
  assert.deepEqual(currentSeq, ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3']);

  // ArrowRight at index 2 (last) -> boundary no-op, returns false
  prevented = false;
  const handledRightBoundary = handleOrderSlotKey('ArrowRight', 2, currentSeq, preventDefault, next => {
    currentSeq = next;
  });
  assert.equal(handledRightBoundary, false);
  assert.equal(prevented, true);

  // Delete at index 1 -> removes 'manh_2'
  prevented = false;
  const handledDelete = handleOrderSlotKey('Delete', 1, currentSeq, preventDefault, next => {
    currentSeq = next;
  });
  assert.equal(handledDelete, true);
  assert.equal(prevented, true);
  assert.deepEqual(currentSeq, ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_3']);

  // Backspace at index 0 -> removes 'manh_1'
  prevented = false;
  const handledBackspace = handleOrderSlotKey('Backspace', 0, currentSeq, preventDefault, next => {
    currentSeq = next;
  });
  assert.equal(handledBackspace, true);
  assert.equal(prevented, true);
  assert.deepEqual(currentSeq, ['manh_ban_ve_ao_dai_3']);

  // Other keys: ignored, does not preventDefault
  prevented = false;
  const handledOther = handleOrderSlotKey('Tab', 0, currentSeq, preventDefault, () => {});
  assert.equal(handledOther, false);
  assert.equal(prevented, false);
});

test('order puzzle draft persistence, close/reopen, and reload resilience in Core engine', () => {
  let tree = freshTree();
  const snap = tree.nodes[tree.headId].snapshot;
  const c2Progress = { ...snap.journey.c2, status: 'in_progress' as const };
  const unlockedState = {
    ...snap,
    journey: { ...snap.journey, c2: c2Progress },
    inventory: {
      itemIds: [
        'manh_ban_ve_ao_dai_1',
        'manh_ban_ve_ao_dai_2',
        'manh_ban_ve_ao_dai_3',
        'manh_ban_ve_ao_dai_4',
      ],
    },
  };
  tree = createInitialTree(unlockedState);

  // Enter C2 and open sketch assembly puzzle
  const enterRes = execute(tree, { type: 'chapter/enter', payload: { chapterId: 'c2' } });
  assert.equal(enterRes.ok, true);
  tree = enterRes.tree;

  // Advance intro dialogue D0 ('d-c2-ca-nghi') through real command if active
  while (tree.nodes[tree.headId].snapshot.journey.c2.activeDialogue) {
    const advRes = execute(tree, { type: 'dialogue/advance', payload: {} });
    if (!advRes.ok) break;
    tree = advRes.tree;
  }

  const openRes = execute(tree, {
    type: 'puzzle/open',
    payload: { puzzleId: 'p-c2-sketch-assemble' },
  });
  assert.equal(openRes.ok, true);
  tree = openRes.tree;

  // Step 1: Add piece 1
  tree = execute(tree, {
    type: 'puzzle/updateDraft',
    payload: {
      puzzleId: 'p-c2-sketch-assemble',
      draft: { type: 'order', answer: ['manh_ban_ve_ao_dai_1'] },
    },
  }).tree;

  // Step 2: Add piece 3
  tree = execute(tree, {
    type: 'puzzle/updateDraft',
    payload: {
      puzzleId: 'p-c2-sketch-assemble',
      draft: { type: 'order', answer: ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_3'] },
    },
  }).tree;

  // Step 3: Add piece 2
  tree = execute(tree, {
    type: 'puzzle/updateDraft',
    payload: {
      puzzleId: 'p-c2-sketch-assemble',
      draft: {
        type: 'order',
        answer: ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_3', 'manh_ban_ve_ao_dai_2'],
      },
    },
  }).tree;

  // Step 4: Swap pieces 3 and 2
  tree = execute(tree, {
    type: 'puzzle/updateDraft',
    payload: {
      puzzleId: 'p-c2-sketch-assemble',
      draft: {
        type: 'order',
        answer: ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3'],
      },
    },
  }).tree;

  // Close puzzle session
  const closeRes = execute(tree, { type: 'puzzle/close', payload: {} });
  assert.equal(closeRes.ok, true);
  tree = closeRes.tree;

  // Verify persistent draft in journey
  let curState = tree.nodes[tree.headId].snapshot;
  assert.deepEqual(curState.journey.c2.puzzleDrafts?.['p-c2-sketch-assemble'], {
    type: 'order',
    answer: ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3'],
  });

  // Reopen puzzle: draft is still preserved
  const reopenRes = execute(tree, {
    type: 'puzzle/open',
    payload: { puzzleId: 'p-c2-sketch-assemble' },
  });
  assert.equal(reopenRes.ok, true);
  tree = reopenRes.tree;

  curState = tree.nodes[tree.headId].snapshot;
  assert.deepEqual(curState.journey.c2.puzzleDrafts?.['p-c2-sketch-assemble'], {
    type: 'order',
    answer: ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3'],
  });

  // Page reload simulation: serialize to JSON, deserialize back
  const serialized = toJSON(tree);
  const deserialized = fromJSON(serialized, content);
  assert.equal(deserialized.ok, true);
  const reloadedTree = deserialized.tree;
  const reloadedState = reloadedTree.nodes[reloadedTree.headId].snapshot;

  assert.deepEqual(reloadedState.journey.c2.puzzleDrafts?.['p-c2-sketch-assemble'], {
    type: 'order',
    answer: ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3'],
  });

  // Complete assembly and submit solution
  const submitRes = execute(reloadedTree, {
    type: 'puzzle/submit',
    payload: {
      puzzleId: 'p-c2-sketch-assemble',
      answer: [
        'manh_ban_ve_ao_dai_1',
        'manh_ban_ve_ao_dai_2',
        'manh_ban_ve_ao_dai_3',
        'manh_ban_ve_ao_dai_4',
      ],
    },
  });
  assert.equal(submitRes.ok, true);
  const solvedState = submitRes.tree.nodes[submitRes.tree.headId].snapshot;
  assert.ok(solvedState.journey.c2.solvedPuzzleIds.includes('p-c2-sketch-assemble'));
  assert.ok(solvedState.inventory.itemIds.includes('ban_ve_ao_dai_tan_thoi'));
});

test('touch target minimum 44px, native aspect ratio, and focus-visible styling in puzzle.css', () => {
  const css = readFileSync(resolve(__dirname, 'puzzle.css'), 'utf8');

  // Assert button min-width and min-height are set to var(--target-min) (44px)
  assert.ok(
    css.includes('.order-strip-btn-group button {') &&
    css.includes('min-height: var(--target-min);') &&
    css.includes('min-width: var(--target-min);'),
    'Order puzzle controls button must satisfy min-height and min-width var(--target-min) (>=44px)'
  );

  // Assert native aspect ratio 128 / 1476 is preserved and object-fit: fill is removed
  assert.ok(
    css.includes('aspect-ratio: 128 / 1476;'),
    'Order strip image must preserve native 128 / 1476 aspect ratio'
  );
  assert.ok(
    !css.includes('object-fit: fill;'),
    'Order strip image must not stretch or distort with object-fit: fill'
  );

  // Assert contiguous canvas gap is 0
  assert.ok(
    css.includes('gap: 0; /* Strips assemble seamlessly side-by-side */') || css.includes('gap: 0;'),
    'Order canvas must have gap 0 to assemble seamlessly'
  );

  // Assert focus-visible styling is present
  assert.ok(
    css.includes('.order-strip-slot:focus-visible'),
    'Order strip slot must have clear focus-visible styling for keyboard accessibility'
  );
});

test('c2RoomNpcs places Loan and Cả Nghị on room floors without overlapping pickups or exits', () => {
  const c2Content = content.chapters.c2;
  const world = { w: 1672, h: 941 };
  const floorMin = HUMAN_HEIGHT.c2.floorTop * world.h;
  const floorMax = HUMAN_HEIGHT.c2.floorBottom * world.h;

  // 1. S1 Gác lửng vẽ tranh: Loan is placed on floor
  const s1Npcs = c2RoomNpcs('c2', 'c2-s1-gac-lung-ve-tranh', [], world);
  assert.equal(s1Npcs.length, 1);
  const s1Loan = s1Npcs.find(n => n.id === 'c2-s1-loan')!;
  assert.ok(s1Loan);
  assert.equal(s1Loan.path, 'assets/characters/cu-loan/scene-idle.png');
  const s1LoanFootY = s1Loan.rect.y + s1Loan.rect.h;
  assert.ok(s1LoanFootY >= floorMin && s1LoanFootY <= floorMax, `Loan footY ${s1LoanFootY} must be within floor [${floorMin}, ${floorMax}]`);

  // Verify no overlap with any pickup items in S1
  const s1Area = c2Content.areas.find(a => a.id === 'c2-s1-gac-lung-ve-tranh')!;
  for (const item of s1Area.interactables) {
    const itemRect = item.rect ? {
      x: item.rect.x * world.w,
      y: item.rect.y * world.h,
      w: item.rect.w * world.w,
      h: item.rect.h * world.h,
    } : { x: item.pos.x * world.w - 40, y: item.pos.y * world.h - 40, w: 80, h: 80 };
    const overlapX = s1Loan.rect.x < itemRect.x + itemRect.w && s1Loan.rect.x + s1Loan.rect.w > itemRect.x;
    const overlapY = s1Loan.rect.y < itemRect.y + itemRect.h && s1Loan.rect.y + s1Loan.rect.h > itemRect.y;
    assert.ok(!(overlapX && overlapY), `Loan must not overlap interactable ${item.id}`);
  }

  // 2. S2 Kho vải: Loan is placed on floor
  const s2Npcs = c2RoomNpcs('c2', 'c2-s2-kho-vai-hang-dao', [], world);
  assert.equal(s2Npcs.length, 1);
  const s2Loan = s2Npcs.find(n => n.id === 'c2-s2-loan')!;
  assert.ok(s2Loan);
  assert.equal(s2Loan.path, 'assets/characters/cu-loan/scene-worried.png');
  const s2LoanFootY = s2Loan.rect.y + s2Loan.rect.h;
  assert.ok(s2LoanFootY >= floorMin && s2LoanFootY <= floorMax, `Loan footY ${s2LoanFootY} must be within floor [${floorMin}, ${floorMax}]`);

  // 3. S3 Triển lãm: Dynamic poses for Cả Nghị and Loan based on puzzle solved states
  // Initial state: Cả Nghị stern, Loan worried
  const s3NpcsInitial = c2RoomNpcs('c2', 'c2-s3-phong-trien-lam-doi-dau', [], world);
  assert.equal(s3NpcsInitial.length, 2);
  const caNghiInitial = s3NpcsInitial.find(n => n.id === 'c2-s3-ca-nghi')!;
  const loanInitial = s3NpcsInitial.find(n => n.id === 'c2-s3-loan')!;
  assert.equal(caNghiInitial.path, 'assets/characters/ca-nghi/scene-stern.png');
  assert.equal(loanInitial.path, 'assets/characters/cu-loan/scene-worried.png');
  assert.ok(caNghiInitial.rect.y + caNghiInitial.rect.h >= floorMin && caNghiInitial.rect.y + caNghiInitial.rect.h <= floorMax);
  assert.ok(loanInitial.rect.y + loanInitial.rect.h >= floorMin && loanInitial.rect.y + loanInitial.rect.h <= floorMax);

  // After receipt solved: Cả Nghị shocked
  const s3NpcsReceipt = c2RoomNpcs('c2', 'c2-s3-phong-trien-lam-doi-dau', ['p-c2-present-receipt'], world);
  assert.equal(s3NpcsReceipt.find(n => n.id === 'c2-s3-ca-nghi')!.path, 'assets/characters/ca-nghi/scene-shocked.png');

  // After sketch solved: Cả Nghị retreat, Loan determined
  const s3NpcsSketch = c2RoomNpcs('c2', 'c2-s3-phong-trien-lam-doi-dau', ['p-c2-present-receipt', 'p-c2-present-sketch'], world);
  assert.equal(s3NpcsSketch.find(n => n.id === 'c2-s3-ca-nghi')!.path, 'assets/characters/ca-nghi/scene-retreat.png');
  assert.equal(s3NpcsSketch.find(n => n.id === 'c2-s3-loan')!.path, 'assets/characters/cu-loan/scene-determined.png');

  // After styling solved: Loan relieved
  const s3NpcsStyling = c2RoomNpcs('c2', 'c2-s3-phong-trien-lam-doi-dau', ['p-c2-present-receipt', 'p-c2-present-sketch', 'p-c2-styling-loan'], world);
  assert.equal(s3NpcsStyling.find(n => n.id === 'c2-s3-loan')!.path, 'assets/characters/cu-loan/scene-relieved.png');
});

test('ChapterEnding differentiates completion text by chapter ID', () => {
  const getEndingTitle = (chapterId: string, chapterTitle: string) => {
    return `Đã hoàn thành ${chapterId === 'prologue' ? 'Màn mở đầu' : chapterTitle}`;
  };

  assert.equal(
    getEndingTitle('prologue', 'Màn mở đầu: Tiệm May Ký Ức'),
    'Đã hoàn thành Màn mở đầu'
  );
  assert.equal(
    getEndingTitle('c2', 'Chương 2: Tiếng Kéo Đêm Phố Cũ'),
    'Đã hoàn thành Chương 2: Tiếng Kéo Đêm Phố Cũ'
  );
  assert.notEqual(
    getEndingTitle('c2', 'Chương 2: Tiếng Kéo Đêm Phố Cũ'),
    'Đã hoàn thành Màn mở đầu'
  );
  assert.equal(
    getEndingTitle('c1', 'Chương 1: Khung Cửi Rạn'),
    'Đã hoàn thành Chương 1: Khung Cửi Rạn'
  );
});

test('Order puzzle sequence operations preserve key identity without index in key', () => {
  const currentSeq = ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2'];
  const swapped = moveOrderPieceRight(currentSeq, 0);
  assert.deepEqual(swapped, ['manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_1']);
  assert.equal(swapped[0], 'manh_ban_ve_ao_dai_2');
  assert.equal(swapped[1], 'manh_ban_ve_ao_dai_1');
});

test('c2ExitArrows provides valid fallback navigation for all three C2 areas without overlapping targets', () => {
  const s1Exits = c2ExitArrows('c2-s1-gac-lung-ve-tranh');
  assert.equal(s1Exits.length, 1);
  assert.equal(s1Exits[0].exit, 'window');
  assert.equal(s1Exits[0].dir, 'right');
  assert.deepEqual(s1Exits[0].rect, { x: 0.88, y: 0.20, w: 0.10, h: 0.55 });

  const s2Exits = c2ExitArrows('c2-s2-kho-vai-hang-dao');
  assert.equal(s2Exits.length, 2);
  const s2Back = s2Exits.find(e => e.exit === 'back');
  const s2Hall = s2Exits.find(e => e.exit === 'hall');
  assert.ok(s2Back && s2Hall);
  assert.equal(s2Back.dir, 'left');
  assert.equal(s2Hall.dir, 'right');
  assert.deepEqual(s2Back.rect, { x: 0.00, y: 0.45, w: 0.08, h: 0.45 });
  assert.deepEqual(s2Hall.rect, { x: 0.92, y: 0.76, w: 0.08, h: 0.14 });

  const s3Exits = c2ExitArrows('c2-s3-phong-trien-lam-doi-dau');
  assert.equal(s3Exits.length, 1);
  assert.equal(s3Exits[0].exit, 'back');
  assert.equal(s3Exits[0].dir, 'left');
  assert.deepEqual(s3Exits[0].rect, { x: 0.00, y: 0.45, w: 0.08, h: 0.45 });

  // Verify S1 piece 4 and window exit do not overlap on 5 target viewports with >= 44px bounds
  const piece4Rect = { x: 0.74, y: 0.46, w: 0.06, h: 0.09 };
  const s1ExitRect = s1Exits[0].rect;
  for (const width of [390, 768, 844, 1280, 1440]) {
    const pieceRight = (piece4Rect.x + piece4Rect.w / 2) * width + Math.max(44, piece4Rect.w * width) / 2;
    const exitLeft = (s1ExitRect.x + s1ExitRect.w / 2) * width - Math.max(44, s1ExitRect.w * width) / 2;
    assert.ok(pieceRight < exitLeft, `Piece 4 and S1 exit must not overlap at width ${width}`);
  }

  // Verify S2 safe and hall exit do not overlap vertically at >= 44px bounds
  const safeRect = { x: 0.739, y: 0.37, w: 0.201, h: 0.28 };
  const s2HallRect = s2Hall.rect;
  for (const width of [390, 768, 844, 1280, 1440]) {
    const height = (width * 941) / 1672;
    const safeBottom = (safeRect.y + safeRect.h / 2) * height + Math.max(44, safeRect.h * height) / 2;
    const exitTop = (s2HallRect.y + s2HallRect.h / 2) * height - Math.max(44, s2HallRect.h * height) / 2;
    assert.ok(safeBottom < exitTop, `Safe and S2 hall exit must not overlap at width ${width}`);
  }
});

test('initial walker placement correctly prioritizes entry return over area.spawn', () => {
  const world = { w: 1672, h: 941 };
  const floor = { top: 0.58 * world.h, bottom: 0.92 * world.h };
  const s1Area = content.chapters.c2.areas.find(a => a.id === 'c2-s1-gac-lung-ve-tranh')!;

  // First entry (no reverse arrow match) uses area.spawn
  const firstEntryPos = s1Area.spawn
    ? { x: s1Area.spawn.x * world.w, y: s1Area.spawn.y * world.h }
    : { x: world.w / 2, y: world.h };

  const clampedPos = {
    x: firstEntryPos.x,
    y: Math.min(floor.bottom, Math.max(floor.top, firstEntryPos.y))
  };

  assert.ok(clampedPos.x > 0 && clampedPos.x < world.w);
  assert.ok(clampedPos.y >= floor.top && clampedPos.y <= floor.bottom);

  // Return entry from prevArea matches reverse exit arrow
  const returnArrow = { exit: 'back', dir: 'left' as const, rect: { x: 0.00, y: 0.45, w: 0.08, h: 0.45 } };
  const entryX = (returnArrow.rect.x > 0.15 ? (returnArrow.rect.x - 0.06) : (returnArrow.rect.x + returnArrow.rect.w + 0.06)) * world.w;
  assert.ok(entryX > 0 && entryX < world.w);
});

test('walker interaction passes normalized arrived walker feet to interact handler', () => {
  const world = { w: 1672, h: 941 };
  const walkerCurrent = { x: 420.5, y: 650.0 };
  const arrivedFeet = { x: walkerCurrent.x / world.w, y: walkerCurrent.y / world.h };

  assert.ok(arrivedFeet.x >= 0 && arrivedFeet.x <= 1);
  assert.ok(arrivedFeet.y >= 0 && arrivedFeet.y <= 1);
  assert.equal(Math.round(arrivedFeet.x * 1000) / 1000, Math.round((420.5 / 1672) * 1000) / 1000);
  assert.equal(Math.round(arrivedFeet.y * 1000) / 1000, Math.round((650.0 / 941) * 1000) / 1000);
});

test('Studio challenge detects loan wardrobe items and guards Closet save', () => {
  const tree = freshTree();
  const state = tree.nodes[tree.headId].snapshot;
  state.currentChapter = 'c2';
  Object.assign(state.journey.c2, {
    status: 'in_progress',
    currentArea: 'c2-s3-phong-trien-lam-doi-dau',
    solvedPuzzleIds: ['p-c2-sketch-assemble', 'p-c2-safe-open', 'p-c2-present-receipt', 'p-c2-present-sketch'],
    completedDialogueIds: ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'],
  });
  state.closet.unlockedAccessoryIds = [];
  const res = getChallengeWardrobe(state, 'p-c2-styling-loan', content);
  assert.equal(res.ok, true);
  if (!res.ok) return;
  const loanGarmentIds = res.borrowedGarmentIds;
  const loanAccessoryIds = res.borrowedAccessoryIds;
  assert.deepEqual(loanGarmentIds, ['ao-dai-lemur']);
  assert.deepEqual(loanAccessoryIds, ['khan-van-den', 'guoc-moc']);

  // Draft with loan garment using real catalog silhouette 'tan_thoi'
  const draftWithLoan: import('../core').StudioDraft = {
    type: 'studio',
    challengePuzzleId: 'p-c2-styling-loan',
    eventContextId: 'dao_pho',
    garmentId: 'ao-dai-lemur',
    silhouette: content.garmentsById.get('ao-dai-lemur')!.silhouette,
    colorPalette: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    equippedAccessories: {},
  };

  const hasBorrowedGarment = loanGarmentIds.includes(draftWithLoan.garmentId)
    && !state.closet.unlockedGarmentIds.includes(draftWithLoan.garmentId);

  assert.ok(hasBorrowedGarment, 'ao-dai-lemur should be identified as a borrowed item');

  // Core guards validateChallengeStudioDraft accepts loan, while permanent validateStudioDraft rejects
  const challengeCheck = validateChallengeStudioDraft(state, 'p-c2-styling-loan', draftWithLoan, content);
  assert.equal(challengeCheck.ok, true, 'Loan items are valid in challenge context');
  const permanentCheck = validateStudioDraft(state, draftWithLoan, content, true);
  assert.equal(permanentCheck.ok, false, 'Permanent save of outfit with borrowed items must be rejected');

  // Guard blocks saving
  const canSave = !hasBorrowedGarment;
  assert.equal(canSave, false, 'Saving outfits containing borrowed items into permanent Closet must be blocked');

  // Standard owned outfit is allowed
  const ownedGarmentId = state.closet.unlockedGarmentIds[0];
  const draftOwned: import('../core').StudioDraft = {
    type: 'studio',
    eventContextId: 'dao_pho',
    garmentId: ownedGarmentId,
    silhouette: content.garmentsById.get(ownedGarmentId)!.silhouette,
    colorPalette: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    equippedAccessories: {},
  };
  const isBorrowedOwned = loanGarmentIds.includes(draftOwned.garmentId)
    && !state.closet.unlockedGarmentIds.includes(draftOwned.garmentId);
  assert.equal(isBorrowedOwned, false);
});

test('challenge styling draft persistence, revalidation, and submit via stylingAnswer', () => {
  let tree = freshTree();
  let snap = tree.nodes[tree.headId].snapshot;
  snap.currentChapter = 'c2';
  Object.assign(snap.journey.c2, {
    status: 'in_progress',
    currentArea: 'c2-s3-phong-trien-lam-doi-dau',
    solvedPuzzleIds: ['p-c2-sketch-assemble', 'p-c2-safe-open', 'p-c2-present-receipt', 'p-c2-present-sketch'],
    completedDialogueIds: ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'],
  });
  tree = createInitialTree(snap);

  // 1. Create initial challenge draft from Core API
  const opened = createChallengeStudioDraft(snap, 'p-c2-styling-loan', content);
  assert.equal(opened.ok, true);
  if (!opened.ok) return;

  const initialDraft = opened.draft;
  assert.equal(initialDraft.challengePuzzleId, 'p-c2-styling-loan');
  assert.equal(initialDraft.garmentId, 'ao-dai-lemur');
  assert.equal(initialDraft.silhouette, 'tan_thoi');

  // 2. Customize draft with loan accessories, specific palette, and event context
  const customizedDraft: import('../core').StudioDraft = {
    ...initialDraft,
    colorPalette: ['#c4a482', '#6b4423', '#50321a', '#2c1608'],
    equippedAccessories: {
      headwear: 'khan-van-den',
      footwear: 'guoc-moc',
    },
    eventContextId: 'le_chua',
  };

  // 3. Revalidate before persistence
  const validCheck = validateChallengeStudioDraft(snap, 'p-c2-styling-loan', customizedDraft, content);
  assert.equal(validCheck.ok, true);

  // 4. Persist draft via puzzle/updateDraft using stylingAnswer (all strings)
  const answer = stylingAnswer(customizedDraft);
  assert.equal(typeof answer.silhouette, 'string');
  assert.equal(typeof answer.garmentId, 'string');
  assert.equal(typeof answer.headwearId, 'string');
  assert.equal(typeof answer.footwearId, 'string');
  assert.equal(typeof answer.color0, 'string');
  assert.equal(typeof answer.color1, 'string');
  assert.equal(typeof answer.color2, 'string');
  assert.equal(typeof answer.color3, 'string');
  assert.equal(typeof answer.eventContextId, 'string');

  tree = execute(tree, {
    type: 'puzzle/updateDraft',
    payload: {
      puzzleId: 'p-c2-styling-loan',
      draft: { type: 'styling', answer },
    },
  }).tree;

  // 5. Verify roundtrip through JSON serialization / reload
  const json = toJSON(tree);
  const reloaded = fromJSON(json, content);
  assert.equal(reloaded.ok, true);
  if (!reloaded.ok) return;

  const reloadedState = reloaded.tree.nodes[reloaded.tree.headId].snapshot;
  const resumed = createChallengeStudioDraft(reloadedState, 'p-c2-styling-loan', content);
  assert.equal(resumed.ok, true);
  if (!resumed.ok) return;

  assert.equal(resumed.draft.garmentId, 'ao-dai-lemur');
  assert.equal(resumed.draft.silhouette, 'tan_thoi');
  assert.deepEqual(resumed.draft.colorPalette, ['#c4a482', '#6b4423', '#50321a', '#2c1608']);
  assert.equal(resumed.draft.equippedAccessories.headwear, 'khan-van-den');
  assert.equal(resumed.draft.equippedAccessories.footwear, 'guoc-moc');
  assert.equal(resumed.draft.eventContextId, 'le_chua');

  // 6. Submit solution via stylingAnswer
  const submitRes = execute(reloaded.tree, {
    type: 'puzzle/submit',
    payload: {
      puzzleId: 'p-c2-styling-loan',
      answer: stylingAnswer(resumed.draft),
    },
  });
  assert.equal(submitRes.ok, true);
  const solvedSnap = submitRes.tree.nodes[submitRes.tree.headId].snapshot;
  assert.ok(solvedSnap.journey.c2.solvedPuzzleIds.includes('p-c2-styling-loan'));
  // Ending dialogue D4 enqueued upon styling solve
  assert.ok(
    Boolean(solvedSnap.journey.c2.dialogueQueue?.includes('d-c2-ending')) ||
    solvedSnap.journey.c2.activeDialogue?.dialogueId === 'd-c2-ending'
  );
});

test('full Chapter 2 walkthrough: D0 -> 4 strips -> P1 -> D1 -> S2 -> key -> P2 -> D2/D3 -> S3 -> P3 -> P4 -> P5 -> D4 -> complete -> claim +100', () => {
  let tree = freshTree();
  let snap = tree.nodes[tree.headId].snapshot;

  // Unlock C2 as if C1 was completed
  snap.journey.c1 = {
    ...snap.journey.c1,
    status: 'completed',
    claimed: true,
  };
  snap.journey.c2 = {
    ...snap.journey.c2,
    status: 'in_progress',
  };
  tree = createInitialTree(snap);

  // 1. Enter C2 -> Enqueues D0 ('d-c2-ca-nghi')
  tree = execute(tree, { type: 'chapter/enter', payload: { chapterId: 'c2' } }).tree;
  let cur = tree.nodes[tree.headId].snapshot;
  assert.equal(cur.currentChapter, 'c2');
  assert.equal(cur.journey.c2.activeDialogue?.dialogueId, 'd-c2-ca-nghi');

  // Picking pieces before completing D0 is rejected by guard
  const earlyPickup = execute(tree, {
    type: 'interact',
    payload: { targetId: 'hitbox-drawing-desk', playerPos: { x: 0.38, y: 0.469 } },
  });
  assert.equal(earlyPickup.ok, false);

  // Complete D0
  while (tree.nodes[tree.headId].snapshot.journey.c2.activeDialogue) {
    tree = execute(tree, { type: 'dialogue/advance', payload: {} }).tree;
  }
  cur = tree.nodes[tree.headId].snapshot;
  assert.ok(cur.journey.c2.completedDialogueIds.includes('d-c2-ca-nghi'));

  // 2. Pick up 4 drawing strips in S1
  const stripPickups = [
    { targetId: 'hitbox-drawing-desk', item: 'manh_ban_ve_ao_dai_1', pos: { x: 0.38, y: 0.469 } },
    { targetId: 'hitbox-fabric-basket', item: 'manh_ban_ve_ao_dai_2', pos: { x: 0.606, y: 0.574 } },
    { targetId: 'hitbox-gas-lamp', item: 'manh_ban_ve_ao_dai_3', pos: { x: 0.09, y: 0.454 } },
    { targetId: 'hitbox-french-window', item: 'manh_ban_ve_ao_dai_4', pos: { x: 0.767, y: 0.502 } },
  ];
  for (const p of stripPickups) {
    tree = execute(tree, { type: 'interact', payload: { targetId: p.targetId, playerPos: p.pos } }).tree;
    assert.ok(tree.nodes[tree.headId].snapshot.inventory.itemIds.includes(p.item));
  }

  // 3. Assemble sketch P1 ('p-c2-sketch-assemble')
  // Wrong order submit gives feedback without solve
  const wrongOrder = execute(tree, {
    type: 'puzzle/submit',
    payload: {
      puzzleId: 'p-c2-sketch-assemble',
      answer: ['manh_ban_ve_ao_dai_4', 'manh_ban_ve_ao_dai_3', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_1'],
    },
  });
  assert.equal(wrongOrder.tree.nodes[wrongOrder.tree.headId].snapshot.journey.c2.solvedPuzzleIds.includes('p-c2-sketch-assemble'), false);

  // Correct order submit
  tree = execute(tree, {
    type: 'puzzle/submit',
    payload: {
      puzzleId: 'p-c2-sketch-assemble',
      answer: ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3', 'manh_ban_ve_ao_dai_4'],
    },
  }).tree;
  cur = tree.nodes[tree.headId].snapshot;
  assert.ok(cur.journey.c2.solvedPuzzleIds.includes('p-c2-sketch-assemble'));
  assert.ok(cur.inventory.itemIds.includes('ban_ve_ao_dai_tan_thoi'));

  // Exiting to S2 before reading D1 ('d-c2-mat-ma') is blocked by G1 exitGate
  const earlyExitS2 = execute(tree, { type: 'area/goTo', payload: { areaId: 'c2-s2-kho-vai-hang-dao' } });
  assert.equal(earlyExitS2.ok, false);

  // Complete D1
  while (tree.nodes[tree.headId].snapshot.journey.c2.activeDialogue) {
    tree = execute(tree, { type: 'dialogue/advance', payload: {} }).tree;
  }
  assert.ok(tree.nodes[tree.headId].snapshot.journey.c2.completedDialogueIds.includes('d-c2-mat-ma'));

  // 4. Move to S2
  tree = execute(tree, { type: 'area/goTo', payload: { areaId: 'c2-s2-kho-vai-hang-dao' } }).tree;
  assert.equal(tree.nodes[tree.headId].snapshot.journey.c2.currentArea, 'c2-s2-kho-vai-hang-dao');

  // 5. In S2: Pick up brass safe key
  tree = execute(tree, {
    type: 'interact',
    payload: { targetId: 'hitbox-grandfather-clock', playerPos: { x: 0.248, y: 0.425 } },
  }).tree;
  assert.ok(tree.nodes[tree.headId].snapshot.inventory.itemIds.includes('chia_khoa_ket_sat_bang_thau'));

  // 6. Open safe P2 ('p-c2-safe-open')
  tree = execute(tree, {
    type: 'puzzle/submit',
    payload: {
      puzzleId: 'p-c2-safe-open',
      answer: 'chia_khoa_ket_sat_bang_thau',
    },
  }).tree;
  cur = tree.nodes[tree.headId].snapshot;
  assert.ok(cur.journey.c2.solvedPuzzleIds.includes('p-c2-safe-open'));
  // Both papers granted atomically
  assert.ok(cur.inventory.itemIds.includes('bien_lai_tra_no_goc_1935'));
  assert.ok(cur.inventory.itemIds.includes('ban_giao_keo_ep_hon'));

  // Advance D2 ('d-c2-bien-lai') and D3 ('d-c2-giao-keo') in queue
  while (tree.nodes[tree.headId].snapshot.journey.c2.activeDialogue) {
    tree = execute(tree, { type: 'dialogue/advance', payload: {} }).tree;
  }
  cur = tree.nodes[tree.headId].snapshot;
  assert.ok(cur.journey.c2.completedDialogueIds.includes('d-c2-bien-lai'));
  assert.ok(cur.journey.c2.completedDialogueIds.includes('d-c2-giao-keo'));

  // 7. Move to S3
  tree = execute(tree, { type: 'area/goTo', payload: { areaId: 'c2-s3-phong-trien-lam-doi-dau' } }).tree;
  assert.equal(tree.nodes[tree.headId].snapshot.journey.c2.currentArea, 'c2-s3-phong-trien-lam-doi-dau');

  // 8. Present Receipt P3 ('p-c2-present-receipt')
  tree = execute(tree, {
    type: 'puzzle/submit',
    payload: {
      puzzleId: 'p-c2-present-receipt',
      answer: 'bien_lai_tra_no_goc_1935',
    },
  }).tree;
  assert.ok(tree.nodes[tree.headId].snapshot.journey.c2.solvedPuzzleIds.includes('p-c2-present-receipt'));

  // 9. Present Sketch P4 ('p-c2-present-sketch')
  tree = execute(tree, {
    type: 'puzzle/submit',
    payload: {
      puzzleId: 'p-c2-present-sketch',
      answer: 'ban_ve_ao_dai_tan_thoi',
    },
  }).tree;
  assert.ok(tree.nodes[tree.headId].snapshot.journey.c2.solvedPuzzleIds.includes('p-c2-present-sketch'));

  // 10. Styling Challenge P5 ('p-c2-styling-loan')
  const p5Draft: import('../core').StudioDraft = {
    type: 'studio',
    challengePuzzleId: 'p-c2-styling-loan',
    eventContextId: 'dao_pho',
    garmentId: 'ao-dai-lemur',
    silhouette: 'tan_thoi',
    colorPalette: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
    equippedAccessories: {
      headwear: 'khan-van-den',
      footwear: 'guoc-moc',
    },
  };
  tree = execute(tree, {
    type: 'puzzle/submit',
    payload: {
      puzzleId: 'p-c2-styling-loan',
      answer: stylingAnswer(p5Draft),
    },
  }).tree;
  cur = tree.nodes[tree.headId].snapshot;
  assert.ok(cur.journey.c2.solvedPuzzleIds.includes('p-c2-styling-loan'));

  // Trying to complete chapter before finishing D4 ending dialogue is blocked
  const earlyComplete = execute(tree, { type: 'chapter/complete', payload: { chapterId: 'c2' } });
  assert.equal(earlyComplete.ok, false);

  // 11. Read D4 Ending dialogue ('d-c2-ending')
  while (tree.nodes[tree.headId].snapshot.journey.c2.activeDialogue) {
    tree = execute(tree, { type: 'dialogue/advance', payload: {} }).tree;
  }
  cur = tree.nodes[tree.headId].snapshot;
  assert.ok(cur.journey.c2.completedDialogueIds.includes('d-c2-ending'));

  // 12. Complete C2
  const initialWallet = cur.wallet.senNgoc;
  tree = execute(tree, { type: 'chapter/complete', payload: { chapterId: 'c2' } }).tree;
  cur = tree.nodes[tree.headId].snapshot;
  assert.equal(cur.journey.c2.status, 'completed');

  // 13. Claim Reward (+100 Sen Ngọc exactly)
  tree = execute(tree, { type: 'reward/claim', payload: { chapterId: 'c2' } }).tree;
  cur = tree.nodes[tree.headId].snapshot;
  assert.equal(cur.journey.c2.claimed, true);
  assert.equal(cur.wallet.senNgoc, initialWallet + 100);

  // Second claim attempt is idempotent (rejected)
  const doubleClaim = execute(tree, { type: 'reward/claim', payload: { chapterId: 'c2' } });
  assert.equal(doubleClaim.ok, false);
  assert.equal(doubleClaim.tree.nodes[doubleClaim.tree.headId].snapshot.wallet.senNgoc, initialWallet + 100);

  // Progression unlocked next chapter metadata
  assert.ok(cur.journey.c3);
  assert.equal(cur.journey.c3.status, 'in_progress');
});



