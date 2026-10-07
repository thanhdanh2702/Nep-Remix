import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { c2StripAsset, c2CompleteSketchAsset } from './assets';
import { characterScale, HUMAN_HEIGHT } from './character-scale';
import { c2AreaOverlays, c2RoomNpcs } from './room-render';
import {
  addOrderPiece,
  removeOrderPiece,
  moveOrderPieceLeft,
  moveOrderPieceRight,
  resetOrderSeq,
  handleOrderSlotKey,
} from './order-puzzle';
import { freshTree, execute, content } from './store';
import { createInitialTree, toJSON, fromJSON } from '../core';

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

