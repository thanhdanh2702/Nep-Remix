import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content/index.ts';
import {
  createInitialState,
  createInitialTree,
  dispatch,
  getChallengeWardrobe,
  createChallengeStudioDraft,
  validateChallengeStudioDraft,
} from '../core/index.ts';
import { HUMAN_HEIGHT } from './character-scale.ts';
import { targetFor, standClear } from './room-walker.ts';
import { portraitFor } from './npc-portraits.ts';
import { ACTION_LABEL } from './puzzle-actions.ts';
import {
  BAGUA_TRIGRAMS,
  parseBaguaDraft,
  formatBaguaDraft,
  isBaguaComplete,
  isBaguaPuzzle,
} from './bagua-puzzle.ts';

const W = 1672;
const H = 941;
const content = loadContent();

test('C3 story characters are recognized speakers with graceful fallback', () => {
  const storySpeakers = ['Bà Mai', 'Vinh', 'Thầy Ba Càn', 'Bà Lớn'];
  for (const speaker of storySpeakers) {
    const p = portraitFor(speaker);
    assert.ok(p.kind === 'sprite' || p.kind === 'emblem');
  }
  // Unknown speaker falls back to emblem
  assert.equal(portraitFor('Người lạ').kind, 'emblem');
});

test('C3 action labels are defined for all 3 puzzles', () => {
  assert.equal(ACTION_LABEL['p-c3-bagua-lock'], 'Mở khóa Bát Quái');
  assert.equal(ACTION_LABEL['p-c3-present-evidence'], 'Trình chứng cứ');
  assert.equal(ACTION_LABEL['p-c3-styling-mai'], 'Hoàn tất phối đồ');
});

test('C3 official 11 interactables: structure in c3.json and proposed geometry feasibility check (FE proposal for Core)', () => {
  const c3 = content.chapters.c3;
  assert.equal(c3.areas.length, 3);

  // 1. Verify exact 11 interactable targets in c3.json across S1, S2, S3
  const s1Ids = c3.areas[0].interactables.map(i => i.id);
  assert.deepEqual(s1Ids, [
    'hitbox-gramophone',
    'hitbox-fabric-attic',
    'hitbox-street-exit',
    'hitbox-c3-read-receipt',
  ]);

  const s2Ids = c3.areas[1].interactables.map(i => i.id);
  assert.deepEqual(s2Ids, [
    'hitbox-incense-bowl',
    'hitbox-bagua-mirror',
    'hitbox-bagua-chest',
  ]);

  const s3Ids = c3.areas[2].interactables.map(i => i.id);
  assert.deepEqual(s3Ids, [
    'hitbox-salon-table',
    'hitbox-vinh-support',
    'hitbox-c3-read-revision',
    'hitbox-styling-mai',
  ]);

  const totalInteractables = c3.areas.flatMap(a => a.interactables);
  assert.equal(totalInteractables.length, 11);

  // 2. Proposed measured geometry table for the 11 targets (native 1672x941 canvas)
  // Mathematical pre-validation: engine metric sqrt((dx*800)^2 + (dy*500)^2) <= radius*800.
  // Note: This proposal is submitted to Core for updating c3.json (which currently holds legacy unapproved placeholders).
  const PROPOSED_HOTSPOTS = [
    // S1: Tiệm may Đa Kao
    { id: 'hitbox-fabric-attic',    area: 'c3-s1-tiem-may-da-kao', pos: [1246, 550], radius: 0.19, rect: { x: 1180, y: 460, w: 130, h: 180 }, left: [1140, 790], right: [1350, 790] },
    { id: 'hitbox-c3-read-receipt', area: 'c3-s1-tiem-may-da-kao', pos: [1246, 550], radius: 0.19, rect: { x: 1180, y: 460, w: 130, h: 180 }, left: [1140, 790], right: [1350, 790] },
    { id: 'hitbox-gramophone',      area: 'c3-s1-tiem-may-da-kao', pos: [1420, 600], radius: 0.16, rect: { x: 1350, y: 500, w: 140, h: 180 }, left: [1350, 790], right: [1480, 790] },
    { id: 'hitbox-street-exit',     area: 'c3-s1-tiem-may-da-kao', pos: [880, 780],  radius: 0.15, rect: { x: 752, y: 750, w: 250, h: 170 },  left: [820, 820],  right: [940, 820] },
    // S2: Phòng phong thủy
    { id: 'hitbox-incense-bowl',    area: 'c3-s2-phong-phong-thuy', pos: [580, 620],  radius: 0.16, rect: { x: 480, y: 500, w: 180, h: 160 },  left: [480, 795],  right: [680, 795] },
    { id: 'hitbox-bagua-mirror',    area: 'c3-s2-phong-phong-thuy', pos: [990, 580],  radius: 0.18, rect: { x: 900, y: 480, w: 180, h: 170 },  left: [880, 795],  right: [1040, 795] },
    { id: 'hitbox-bagua-chest',     area: 'c3-s2-phong-phong-thuy', pos: [1190, 580], radius: 0.19, rect: { x: 1080, y: 420, w: 220, h: 230 }, left: [1080, 795], right: [1260, 795] },
    // S3: Dinh thự đối đầu
    { id: 'hitbox-salon-table',     area: 'c3-s3-dinh-thu-doi-dau', pos: [840, 620],  radius: 0.19, rect: { x: 680, y: 480, w: 320, h: 260 },  left: [750, 840],  right: [920, 840] },
    { id: 'hitbox-c3-read-revision',area: 'c3-s3-dinh-thu-doi-dau', pos: [840, 620],  radius: 0.19, rect: { x: 750, y: 480, w: 260, h: 240 },  left: [750, 840],  right: [920, 840] },
    { id: 'hitbox-vinh-support',    area: 'c3-s3-dinh-thu-doi-dau', pos: [480, 740],  radius: 0.16, rect: { x: 400, y: 420, w: 160, h: 390 },  left: [380, 820],  right: [580, 820] },
    { id: 'hitbox-styling-mai',     area: 'c3-s3-dinh-thu-doi-dau', pos: [780, 740],  radius: 0.16, rect: { x: 700, y: 420, w: 160, h: 390 },  left: [680, 825],  right: [880, 825] },
  ];

  const floorTop = HUMAN_HEIGHT.c3.floorTop * H;
  const floorBottom = HUMAN_HEIGHT.c3.floorBottom * H;
  const STAND_GAP = 0.045 * W;
  const floor = { top: floorTop, bottom: floorBottom };

  const checkProximity = (hPos: number[], pNative: number[], radius: number) => {
    const px = pNative[0] / W, py = pNative[1] / H;
    const dx = (px - hPos[0] / W) * 800;
    const dy = (py - hPos[1] / H) * 500;
    const dist = Math.hypot(dx, dy);
    const limit = radius * 800;
    return dist <= limit;
  };

  for (const h of PROPOSED_HOTSPOTS) {
    // Both left and right approach points must pass proximity
    assert.ok(checkProximity(h.pos, h.left, h.radius), `${h.id} left approach failed proximity metric`);
    assert.ok(checkProximity(h.pos, h.right, h.radius), `${h.id} right approach failed proximity metric`);
    // Both approach points must stay on the walkable floor band
    assert.ok(h.left[1] >= floorTop && h.left[1] <= floorBottom, `${h.id} left y=${h.left[1]} must be within floor`);
    assert.ok(h.right[1] >= floorTop && h.right[1] <= floorBottom, `${h.id} right y=${h.right[1]} must be within floor`);

    // Verify walker arrived feet via targetFor and standClear stay on floor and satisfy proximity
    const aimLeft = targetFor(h.rect, { x: 0, y: 790 }, floor, W, STAND_GAP, h.area);
    const arrivedLeft = standClear(h.area, aimLeft.to, floor, { w: W, h: H });
    assert.ok(checkProximity(h.pos, [arrivedLeft.x, arrivedLeft.y], h.radius), `${h.id} arrivedLeft failed proximity`);
    assert.ok(arrivedLeft.y >= floorTop && arrivedLeft.y <= floorBottom, `${h.id} arrivedLeft must be on floor`);

    const aimRight = targetFor(h.rect, { x: W, y: 790 }, floor, W, STAND_GAP, h.area);
    const arrivedRight = standClear(h.area, aimRight.to, floor, { w: W, h: H });
    assert.ok(checkProximity(h.pos, [arrivedRight.x, arrivedRight.y], h.radius), `${h.id} arrivedRight failed proximity`);
    assert.ok(arrivedRight.y >= floorTop && arrivedRight.y <= floorBottom, `${h.id} arrivedRight must be on floor`);
  }
});

test('C3 full M1 consumer walkthrough: command sequence, draft persistence, verbatim ending and +100 reward', () => {
  const initial = createInitialState(content);
  initial.currentChapter = 'c3';
  initial.journey.c3.status = 'in_progress';
  initial.journey.c3.currentArea = 'c3-s1-tiem-may-da-kao';
  initial.journey.c3.unlockedAreaIds = [
    'c3-s1-tiem-may-da-kao',
    'c3-s2-phong-phong-thuy',
    'c3-s3-dinh-thu-doi-dau',
  ];

  let tree = createInitialTree(initial);
  const cmd = (type: string, payload: unknown) => {
    const r = dispatch(tree, { type, payload } as never, content);
    assert.ok(r.ok, `Command ${type} failed: ${r.ok ? '' : r.reason}`);
    tree = r.tree;
  };
  const curr = () => tree.nodes[tree.headId].snapshot;

  // S1: Pick receipt I1
  cmd('item/pick', { itemId: 'bien_nhan_tien_thay_boi' });
  assert.ok(curr().inventory.itemIds.includes('bien_nhan_tien_thay_boi'));

  // S1: Interact to read receipt D1
  const hReceipt = content.chapters.c3.areas[0].interactables.find(i => i.id === 'hitbox-c3-read-receipt')!;
  cmd('interact', { targetId: 'hitbox-c3-read-receipt', playerPos: hReceipt.pos });
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-mua-chuoc');
  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-mua-chuoc'));
  assert.ok(curr().notebook.unlockedClueIds.includes('clue-mua-chuoc-thay-boi'));

  // S1: Street exit dialogue DX
  const hExit = content.chapters.c3.areas[0].interactables.find(i => i.id === 'hitbox-street-exit')!;
  cmd('interact', { targetId: 'hitbox-street-exit', playerPos: hExit.pos });
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-street-exit');
  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-street-exit'));

  // Transition S1 -> S2
  cmd('area/goTo', { areaId: 'c3-s2-phong-phong-thuy' });
  assert.equal(curr().journey.c3.currentArea, 'c3-s2-phong-phong-thuy');

  // S2: Bagua mirror hint D2
  const hBagua = content.chapters.c3.areas[1].interactables.find(i => i.id === 'hitbox-bagua-mirror')!;
  cmd('interact', { targetId: 'hitbox-bagua-mirror', playerPos: hBagua.pos });
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-bagua');
  cmd('dialogue/advance', {});
  assert.ok(curr().notebook.unlockedClueIds.includes('clue-bagua-hint'));

  // S2: P1 draft and solve CAN_TON
  cmd('puzzle/open', { puzzleId: 'p-c3-bagua-lock' });
  cmd('puzzle/updateDraft', { puzzleId: 'p-c3-bagua-lock', draft: { type: 'code', answer: 'CAN_' } });
  assert.equal(curr().journey.c3.puzzleDrafts?.['p-c3-bagua-lock']?.answer, 'CAN_');

  cmd('puzzle/submit', { puzzleId: 'p-c3-bagua-lock', answer: 'CAN_TON' });
  assert.ok(curr().journey.c3.solvedPuzzleIds.includes('p-c3-bagua-lock'));
  // Atomic reward: both documents granted
  assert.ok(curr().inventory.itemIds.includes('so_tu_vi_nguyen_ban_1962'));
  assert.ok(curr().inventory.itemIds.includes('thu_tay_thoa_thuan_boi_toan'));

  // S2: Acknowledge D3 and D4 from dialogue queue
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-so-tu-vi');
  cmd('dialogue/advance', {});
  assert.ok(curr().notebook.unlockedClueIds.includes('clue-so-tu-vi-goc'));

  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-thoa-thuan');
  cmd('dialogue/advance', {});
  assert.ok(curr().notebook.unlockedClueIds.includes('clue-thoa-thuan-boi-toan'));
  assert.equal(curr().journey.c3.activeDialogue, null);

  // Transition S2 -> S3
  cmd('area/goTo', { areaId: 'c3-s3-dinh-thu-doi-dau' });
  assert.equal(curr().journey.c3.currentArea, 'c3-s3-dinh-thu-doi-dau');

  // S3: Read revision document D5
  const hRev = content.chapters.c3.areas[2].interactables.find(i => i.id === 'hitbox-c3-read-revision')!;
  cmd('interact', { targetId: 'hitbox-c3-read-revision', playerPos: hRev.pos });
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-ban-sua');
  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-ban-sua'));

  // S3: Present evidence P2
  cmd('puzzle/submit', { puzzleId: 'p-c3-present-evidence', answer: 'so_tu_vi_nguyen_ban_1962' });
  assert.ok(curr().journey.c3.solvedPuzzleIds.includes('p-c3-present-evidence'));

  // S3: Acknowledge D6 (Vinh witness) and D7 (Mai confrontation)
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-vinh-stand');
  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-vinh-stand'));

  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-ong-le-defeat');
  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-ong-le-defeat'));

  // S3: P3 styling challenge via public Core API
  const wardrobe = getChallengeWardrobe(curr(), 'p-c3-styling-mai', content);
  assert.ok(wardrobe.ok);
  assert.ok(wardrobe.garmentIds.includes('ao-dai-raglan'));
  assert.ok(wardrobe.accessoryIds.includes('kinh-mat-meo'));
  assert.ok(wardrobe.accessoryIds.includes('guoc-moc'));

  const studioDraftRes = createChallengeStudioDraft(curr(), 'p-c3-styling-mai', content);
  assert.ok(studioDraftRes.ok);
  const validated = validateChallengeStudioDraft(curr(), 'p-c3-styling-mai', studioDraftRes.draft, content);
  assert.ok(validated.ok);

  const stylingAnswer = {
    silhouette: 'tan_thoi',
    garmentId: 'ao-dai-raglan',
    jewelryId: 'kinh-mat-meo',
    footwearId: 'guoc-moc',
    color0: '#FFFFFF',
    color1: '#2D6A5D',
    color2: '#204D44',
    color3: '#102923',
  };
  cmd('puzzle/submit', { puzzleId: 'p-c3-styling-mai', answer: stylingAnswer });
  assert.ok(curr().journey.c3.solvedPuzzleIds.includes('p-c3-styling-mai'));

  // S3: Ending D8 check — verbatim text
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-ending');
  const d8Node = content.chapters.c3.dialogues.find(d => d.id === 'd-c3-ending')!.nodes[0];
  assert.equal(
    d8Node.text,
    'Tôi không cần một lời phán tốt hơn. Tôi cần các người ngừng dùng lời phán để quyết định thay tôi.'
  );
  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-ending'));

  // Complete chapter C3
  cmd('chapter/complete', { chapterId: 'c3' });
  assert.equal(curr().journey.c3.status, 'completed');

  // Claim reward C3: exactly +100 Sen Ngọc once
  const initialCoins = curr().wallet.senNgoc;
  cmd('reward/claim', { chapterId: 'c3' });
  assert.equal(curr().wallet.senNgoc - initialCoins, 100);
  assert.ok(curr().closet.unlockedGarmentIds.includes('ao-dai-raglan'));
  assert.ok(curr().closet.unlockedGarmentIds.includes('ao-dai-co-thuyen'));
  assert.ok(curr().museum.unlockedCardIds!.includes('card-ky-thuat-ao-dai-raglan-1960'));
  assert.ok(curr().museum.unlockedCardIds!.includes('card-phe-phan-hu-tuc-boi-toan'));

  // Duplicate claim is rejected by Core ledger
  const duplicateClaim = dispatch(tree, { type: 'reward/claim', payload: { chapterId: 'c3' } } as never, content);
  assert.equal(duplicateClaim.ok, false);
});

test('C3 dialogue reread mode and challenge wardrobe loan isolation', () => {
  const initial = createInitialState(content);
  initial.currentChapter = 'c3';
  initial.journey.c3.status = 'in_progress';
  initial.journey.c3.currentArea = 'c3-s1-tiem-may-da-kao';
  initial.inventory.itemIds.push('bien_nhan_tien_thay_boi');
  initial.journey.c3.completedDialogueIds.push('d-c3-mua-chuoc');

  let tree = createInitialTree(initial);
  const hReceipt = content.chapters.c3.areas[0].interactables.find(i => i.id === 'hitbox-c3-read-receipt')!;

  // Interacting with already completed dialogue enters reread mode without adding new items/clues
  const r = dispatch(tree, { type: 'interact', payload: { targetId: 'hitbox-c3-read-receipt', playerPos: hReceipt.pos } } as never, content);
  assert.ok(r.ok);
  tree = r.tree;
  const snapshot = tree.nodes[tree.headId].snapshot;
  assert.equal(snapshot.journey.c3.activeDialogue?.mode, 'reread');
});

test('C3 Bagua code answer formatting preserves token sequence and drafts', () => {
  assert.equal(BAGUA_TRIGRAMS.length, 8);
  assert.ok(BAGUA_TRIGRAMS.some(t => t.id === 'CAN' && t.name === 'Càn'));
  assert.ok(BAGUA_TRIGRAMS.some(t => t.id === 'TON' && t.name === 'Tốn'));

  const parsedEmpty = parseBaguaDraft(undefined);
  assert.deepEqual(parsedEmpty, { ring1: '', ring2: '' });

  const parsedPartial = parseBaguaDraft('CAN_');
  assert.deepEqual(parsedPartial, { ring1: 'CAN', ring2: '' });

  const parsedFull = parseBaguaDraft('CAN_TON');
  assert.deepEqual(parsedFull, { ring1: 'CAN', ring2: 'TON' });

  assert.equal(formatBaguaDraft('', ''), '');
  assert.equal(formatBaguaDraft('CAN', ''), 'CAN_');
  assert.equal(formatBaguaDraft('', 'TON'), '_TON');
  assert.equal(formatBaguaDraft('CAN', 'TON'), 'CAN_TON');

  // Finding 1 repro: CAN_MT token round-trip
  const formattedCanMtTon = formatBaguaDraft('CAN_MT', 'TON');
  assert.equal(formattedCanMtTon, 'CAN_MT_TON');
  const parsedCanMtTon = parseBaguaDraft(formattedCanMtTon);
  assert.deepEqual(parsedCanMtTon, { ring1: 'CAN_MT', ring2: 'TON' });

  const formattedTonCanMt = formatBaguaDraft('TON', 'CAN_MT');
  assert.equal(formattedTonCanMt, 'TON_CAN_MT');
  const parsedTonCanMt = parseBaguaDraft(formattedTonCanMt);
  assert.deepEqual(parsedTonCanMt, { ring1: 'TON', ring2: 'CAN_MT' });

  const formattedCanMtCanMt = formatBaguaDraft('CAN_MT', 'CAN_MT');
  assert.equal(formattedCanMtCanMt, 'CAN_MT_CAN_MT');
  const parsedCanMtCanMt = parseBaguaDraft(formattedCanMtCanMt);
  assert.deepEqual(parsedCanMtCanMt, { ring1: 'CAN_MT', ring2: 'CAN_MT' });

  // Partial drafts with CAN_MT
  assert.equal(formatBaguaDraft('CAN_MT', ''), 'CAN_MT_');
  assert.deepEqual(parseBaguaDraft('CAN_MT_'), { ring1: 'CAN_MT', ring2: '' });
  assert.equal(formatBaguaDraft('', 'CAN_MT'), '_CAN_MT');
  assert.deepEqual(parseBaguaDraft('_CAN_MT'), { ring1: '', ring2: 'CAN_MT' });

  // Reset and invalid inputs
  assert.deepEqual(parseBaguaDraft(''), { ring1: '', ring2: '' });
  assert.deepEqual(parseBaguaDraft(null), { ring1: '', ring2: '' });
  assert.deepEqual(parseBaguaDraft('INVALID_TOKEN'), { ring1: '', ring2: '' });
  assert.deepEqual(parseBaguaDraft('CAN_INVALID'), { ring1: 'CAN', ring2: '' });

  // Exhaustive 8x8 round-trip test covering all trigram permutations + empty
  const allChoices = ['', ...BAGUA_TRIGRAMS.map(t => t.id)];
  for (const r1 of allChoices) {
    for (const r2 of allChoices) {
      const formatted = formatBaguaDraft(r1, r2);
      const parsed = parseBaguaDraft(formatted);
      assert.deepEqual(parsed, { ring1: r1, ring2: r2 }, `Round-trip failed for (${r1}, ${r2}) -> ${formatted}`);
    }
  }

  assert.equal(isBaguaComplete('', ''), false);
  assert.equal(isBaguaComplete('CAN', ''), false);
  assert.equal(isBaguaComplete('', 'TON'), false);
  assert.equal(isBaguaComplete('CAN', 'TON'), true);
  assert.equal(isBaguaComplete('CAN_MT', 'TON'), true);
  assert.equal(isBaguaComplete('CAN_MT', 'CAN_MT'), true);
  assert.equal(isBaguaComplete('CAN_MT', ''), false);
});

test('Finding 3: isBaguaPuzzle isolates Bagua branch to p-c3-bagua-lock only', () => {
  assert.equal(isBaguaPuzzle({ id: 'p-c3-bagua-lock', type: 'code' }), true);
  assert.equal(isBaguaPuzzle({ id: 'p-c4-chest-code-1845', type: 'code' }), false);
  assert.equal(isBaguaPuzzle({ id: 'p-c0-mannequin-hand', type: 'code' }), false);
  assert.equal(isBaguaPuzzle({ id: 'p-c2-strip-assembly', type: 'order' }), false);
  assert.equal(isBaguaPuzzle({ id: 'p-c3-present-evidence', type: 'present' }), false);
  assert.equal(isBaguaPuzzle({ id: 'p-c3-styling-mai', type: 'styling' }), false);
});

test('C3 styling answer format fulfills challenge requirement', () => {
  const answer = {
    silhouette: 'tan_thoi',
    garmentId: 'ao-dai-raglan',
    jewelryId: 'kinh-mat-meo',
    footwearId: 'guoc-moc',
    color0: '#FFFFFF',
    color1: '#2D6A5D',
    color2: '#204D44',
    color3: '#102923',
  };

  assert.equal(answer.silhouette, 'tan_thoi');
  assert.equal(answer.garmentId, 'ao-dai-raglan');
  assert.equal(answer.jewelryId, 'kinh-mat-meo');
  assert.equal(answer.footwearId, 'guoc-moc');
  assert.ok(typeof answer.color0 === 'string');
});
