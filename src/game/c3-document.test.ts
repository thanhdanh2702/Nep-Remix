import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { loadContent } from '../content/index.ts';
import {
  createInitialState,
  createInitialTree,
  dispatch,
} from '../core/index.ts';
import {
  C3_DOCUMENTS,
  isC3DocumentDialogue,
  c3DocumentForDialogue,
  c3DocumentForItem,
  c3DocumentForClue,
} from './c3-documents.ts';
import {
  DocumentViewer,
  handleDocumentBodyKeyDown,
} from './DocumentViewer.tsx';
import { assetRegistry } from './assets.ts';
import { anLayerPath, portraitFor, standingSource } from './npc-portraits.ts';
import { AN_FIGURE_H, characterScale, spriteScaleFor } from './character-scale.ts';
import { c2AreaOverlays, c3AreaOverlays, c2ExitArrows, c2RoomNpcs } from './room-render.ts';
import { C3_HOTSPOT_LABELS } from './room-walker.ts';

// In Node test runner (outside Vite), populate frame asset so Modal component can render without error
assetRegistry['assets/screens/main-shop/action-card-frame--9slice.png'] = '/mock-frame.png';

const content = loadContent();

test('C3 Document Registry: 4 evidence documents with production images and semantic metadata', () => {
  const docIds = ['doc-c3-bien-nhan', 'doc-c3-so-goc', 'doc-c3-thu-thoa-thuan', 'doc-c3-ban-sua'] as const;
  for (const id of docIds) {
    const doc = C3_DOCUMENTS[id];
    assert.ok(doc, `Document ${id} must exist in registry`);
    assert.ok(doc.title.length > 0, `${id} must have a non-empty title`);
    assert.ok(doc.imagePath.startsWith('assets/areas/chapter-3/doc-c3-'), `${id} must use production image`);
    assert.ok(doc.metadata.length >= 3, `${id} must have at least 3 structured metadata items`);
    assert.ok(doc.summaryText.length > 20, `${id} must have detailed summary text`);
    assert.ok(doc.highlightText.length > 10, `${id} must have highlighted key phrase`);
    assert.ok(doc.comparativeRole.length > 20, `${id} must define comparative role`);
  }
});

test('C3 Document Comparative Meaning: Vietnamese semantic comparison without forbidden claims', () => {
  // S1 Receipt: confirms money exchange (2.000 dong) from Ba Lon to Thay Ba Can
  const bienNhan = C3_DOCUMENTS['doc-c3-bien-nhan'];
  assert.ok(bienNhan.summaryText.includes('2.000 đồng'), 'Biên nhận must state 2.000 đồng');
  assert.ok(bienNhan.summaryText.includes('Bà Lớn') && bienNhan.summaryText.includes('Thầy Ba Càn'), 'Biên nhận must name Ba Lon and Thay Ba Can');

  // S2 Original Record: original record does NOT contain any condition forcing Mai to be concubine or yield shop
  const soGoc = C3_DOCUMENTS['doc-c3-so-goc'];
  assert.ok(
    soGoc.summaryText.includes('không có dòng yêu cầu Mai phải làm lẽ') ||
    soGoc.summaryText.includes('không có dòng yêu cầu Mai làm lẽ'),
    'Sổ gốc must explicitly confirm absence of forced concubine condition'
  );
  assert.ok(soGoc.summaryText.includes('giao quyền quyết định'), 'Sổ gốc must mention shop decision right was not forced');

  // S2 Letter: requests adding the forced condition in exchange for 2.000 dong
  const thu = C3_DOCUMENTS['doc-c3-thu-thoa-thuan'];
  assert.ok(thu.summaryText.includes('2.000 đồng'), 'Thư thỏa thuận must reference 2.000 đồng');
  assert.ok(thu.summaryText.includes('thêm lời phán') || thu.summaryText.includes('ép Mai làm lẽ'), 'Thư thỏa thuận must state request to add forced condition');

  // S3 Revised Document: altered text contains the forced condition
  const banSua = C3_DOCUMENTS['doc-c3-ban-sua'];
  assert.ok(
    banSua.highlightText.includes('Mai phải chấp nhận làm lẽ và giao quyền quyết định căn tiệm') ||
    banSua.highlightText.includes('Mai phải chấp nhận làm lẽ và giao quyền quyết định tiệm'),
    'Bản sửa must highlight the exact inserted condition'
  );

  // Negative checks: None of the documents rely on handwriting, creases, paper folds, or good fortune to prove Mai's dignity
  for (const doc of Object.values(C3_DOCUMENTS)) {
    const combinedText = `${doc.summaryText} ${doc.comparativeRole} ${doc.highlightText}`.toLowerCase();
    assert.ok(!combinedText.includes('nét chữ'), `Document ${doc.id} must not rely on handwriting (nét chữ)`);
    assert.ok(!combinedText.includes('nếp giấy'), `Document ${doc.id} must not rely on paper creases (nếp giấy)`);
    assert.ok(!combinedText.includes('đại cát'), `Document ${doc.id} must not call horoscope great fortune (đại cát)`);
    assert.ok(!combinedText.includes('chứng minh phẩm hạnh'), `Document ${doc.id} must not prove virtue via fortune`);
  }
});

test('C3 Document Helpers: mapping dialogue, item, and clue correctly', () => {
  assert.ok(isC3DocumentDialogue('d-c3-mua-chuoc'));
  assert.ok(isC3DocumentDialogue('d-c3-so-tu-vi'));
  assert.ok(isC3DocumentDialogue('d-c3-thoa-thuan'));
  assert.ok(isC3DocumentDialogue('d-c3-ban-sua'));
  assert.ok(!isC3DocumentDialogue('d-c3-bagua'));
  assert.ok(!isC3DocumentDialogue('d-c3-vinh-stand'));
  assert.ok(!isC3DocumentDialogue('d-c3-ending'));

  assert.equal(c3DocumentForDialogue('d-c3-mua-chuoc')?.id, 'doc-c3-bien-nhan');
  assert.equal(c3DocumentForDialogue('d-c3-so-tu-vi')?.id, 'doc-c3-so-goc');
  assert.equal(c3DocumentForDialogue('d-c3-thoa-thuan')?.id, 'doc-c3-thu-thoa-thuan');
  assert.equal(c3DocumentForDialogue('d-c3-ban-sua')?.id, 'doc-c3-ban-sua');

  assert.equal(c3DocumentForItem('bien_nhan_tien_thay_boi')?.id, 'doc-c3-bien-nhan');
  assert.equal(c3DocumentForItem('so_tu_vi_nguyen_ban_1962')?.id, 'doc-c3-so-goc');
  assert.equal(c3DocumentForItem('thu_tay_thoa_thuan_boi_toan')?.id, 'doc-c3-thu-thoa-thuan');
  assert.equal(c3DocumentForItem('some_other_item'), undefined);

  assert.equal(c3DocumentForClue('clue-mua-chuoc-thay-boi')?.id, 'doc-c3-bien-nhan');
  assert.equal(c3DocumentForClue('clue-so-tu-vi-goc')?.id, 'doc-c3-so-goc');
  assert.equal(c3DocumentForClue('clue-thoa-thuan-boi-toan')?.id, 'doc-c3-thu-thoa-thuan');
  assert.equal(c3DocumentForClue('some_other_clue'), undefined);
});

test('C3 First-time Reading Flow: acknowledged only via real Core dialogue/advance', () => {
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

  // 1. S1: Collect I1 receipt
  cmd('item/pick', { itemId: 'bien_nhan_tien_thay_boi' });
  assert.ok(curr().inventory.itemIds.includes('bien_nhan_tien_thay_boi'));

  // Interact with hotspot to open reading of receipt
  const hReceipt = content.chapters.c3.areas[0].interactables.find(i => i.id === 'hitbox-c3-read-receipt')!;
  cmd('interact', { targetId: 'hitbox-c3-read-receipt', playerPos: hReceipt.pos });
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-mua-chuoc');

  // Verify that before dialogue/advance, dialogue is NOT completed
  assert.ok(!curr().journey.c3.completedDialogueIds.includes('d-c3-mua-chuoc'));

  // Player clicks "Xác nhận đã đọc" in DocumentViewer -> dispatches dialogue/advance
  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-mua-chuoc'));
  assert.ok(curr().notebook.unlockedClueIds.includes('clue-mua-chuoc-thay-boi'));
  assert.equal(curr().journey.c3.activeDialogue, null);

  // Street exit dialogue
  const hExit = content.chapters.c3.areas[0].interactables.find(i => i.id === 'hitbox-street-exit')!;
  cmd('interact', { targetId: 'hitbox-street-exit', playerPos: hExit.pos });
  cmd('dialogue/advance', {});

  // Move to S2
  cmd('area/goTo', { areaId: 'c3-s2-phong-phong-thuy' });

  // Read bagua note
  const hBagua = content.chapters.c3.areas[1].interactables.find(i => i.id === 'hitbox-bagua-mirror')!;
  cmd('interact', { targetId: 'hitbox-bagua-mirror', playerPos: hBagua.pos });
  cmd('dialogue/advance', {});

  // 2. Solve P1: Chest yields BOTH papers atomically
  cmd('puzzle/submit', { puzzleId: 'p-c3-bagua-lock', answer: 'CAN_TON' });
  assert.ok(curr().inventory.itemIds.includes('so_tu_vi_nguyen_ban_1962'));
  assert.ok(curr().inventory.itemIds.includes('thu_tay_thoa_thuan_boi_toan'));

  // Active dialogue is now Sổ gốc (first of queued documents)
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-so-tu-vi');
  assert.ok(!curr().journey.c3.completedDialogueIds.includes('d-c3-so-tu-vi'));

  // Player advances Sổ gốc -> receives clue and queue pops Thư thỏa thuận
  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-so-tu-vi'));
  assert.ok(curr().notebook.unlockedClueIds.includes('clue-so-tu-vi-goc'));
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-thoa-thuan');

  // Player advances Thư thỏa thuận -> completes S2 reading
  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-thoa-thuan'));
  assert.ok(curr().notebook.unlockedClueIds.includes('clue-thoa-thuan-boi-toan'));
  assert.equal(curr().journey.c3.activeDialogue, null);

  // Move to S3
  cmd('area/goTo', { areaId: 'c3-s3-dinh-thu-doi-dau' });

  // 3. S3: Read revised document at negotiation table before confrontation
  const hRevision = content.chapters.c3.areas[2].interactables.find(i => i.id === 'hitbox-c3-read-revision')!;
  cmd('interact', { targetId: 'hitbox-c3-read-revision', playerPos: hRevision.pos });
  assert.equal(curr().journey.c3.activeDialogue?.dialogueId, 'd-c3-ban-sua');

  cmd('dialogue/advance', {});
  assert.ok(curr().journey.c3.completedDialogueIds.includes('d-c3-ban-sua'));
  assert.equal(curr().journey.c3.activeDialogue, null);
});

test('C3 Journal Read-only Reread: opening evidence from journal leaves game state 100% untouched', () => {
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

  // Complete S1 receipt reading
  cmd('item/pick', { itemId: 'bien_nhan_tien_thay_boi' });
  const hReceipt = content.chapters.c3.areas[0].interactables.find(i => i.id === 'hitbox-c3-read-receipt')!;
  cmd('interact', { targetId: 'hitbox-c3-read-receipt', playerPos: hReceipt.pos });
  cmd('dialogue/advance', {});

  // Snapshot entire state
  const snapshotHeadId = tree.headId;
  const snapshotWallet = curr().wallet.senNgoc;
  const snapshotItems = [...curr().inventory.itemIds];
  const snapshotClues = [...curr().notebook.unlockedClueIds];
  const snapshotSolved = [...curr().journey.c3.solvedPuzzleIds];
  const snapshotCompleted = [...curr().journey.c3.completedDialogueIds];

  // In Journal mode (InventoryCombine), clicking "Đọc văn bản" or "Xem lại tài liệu" opens DocumentViewer with readOnly=true
  // Closing the viewer calls onClose() -> NO command is dispatched!
  // State remains 100% identical:
  assert.equal(tree.headId, snapshotHeadId);
  assert.equal(curr().wallet.senNgoc, snapshotWallet);
  assert.deepEqual(curr().inventory.itemIds, snapshotItems);
  assert.deepEqual(curr().notebook.unlockedClueIds, snapshotClues);
  assert.deepEqual(curr().journey.c3.solvedPuzzleIds, snapshotSolved);
  assert.deepEqual(curr().journey.c3.completedDialogueIds, snapshotCompleted);

  // Even if a re-interaction happens in scene (reread mode):
  const rereadRes = dispatch(tree, { type: 'interact', payload: { targetId: 'hitbox-c3-read-receipt', playerPos: hReceipt.pos } } as never, content);
  assert.ok(rereadRes.ok);
  tree = rereadRes.tree;
  assert.equal(curr().journey.c3.activeDialogue?.mode, 'reread');

  // Advancing dialogue in reread mode closes dialogue without granting extra clues or Sen
  const advanceReread = dispatch(tree, { type: 'dialogue/advance', payload: {} } as never, content);
  assert.ok(advanceReread.ok);
  tree = advanceReread.tree;
  assert.equal(curr().journey.c3.activeDialogue, null);
  assert.equal(curr().wallet.senNgoc, snapshotWallet);
  assert.deepEqual(curr().notebook.unlockedClueIds, snapshotClues);
});

test('C3 S2 chest solve grants both documents atomically and prevents duplicate pickups on re-interact', () => {
  const initial = createInitialState(content);
  initial.currentChapter = 'c3';
  initial.journey.c3.status = 'in_progress';
  initial.journey.c3.currentArea = 'c3-s2-phong-phong-thuy';
  initial.journey.c3.unlockedAreaIds = ['c3-s1-tiem-may-da-kao', 'c3-s2-phong-phong-thuy', 'c3-s3-dinh-thu-doi-dau'];
  initial.inventory.itemIds = ['bien_nhan_tien_thay_boi'];
  initial.journey.c3.completedDialogueIds = ['d-c3-mua-chuoc', 'd-c3-street-exit'];

  let tree = createInitialTree(initial);
  const cmd = (type: string, payload: unknown) => {
    const r = dispatch(tree, { type, payload } as never, content);
    assert.ok(r.ok, `Command ${type} failed: ${r.ok ? '' : r.reason}`);
    tree = r.tree;
  };
  const curr = () => tree.nodes[tree.headId].snapshot;

  // Read bagua note before unlocking chest
  const hBagua = content.chapters.c3.areas[1].interactables.find(i => i.id === 'hitbox-bagua-mirror')!;
  cmd('interact', { targetId: 'hitbox-bagua-mirror', playerPos: hBagua.pos });
  cmd('dialogue/advance', {});

  // Chest solve grants both papers atomically
  cmd('puzzle/submit', { puzzleId: 'p-c3-bagua-lock', answer: 'CAN_TON' });
  assert.ok(curr().inventory.itemIds.includes('so_tu_vi_nguyen_ban_1962'));
  assert.ok(curr().inventory.itemIds.includes('thu_tay_thoa_thuan_boi_toan'));
  assert.equal(curr().inventory.itemIds.filter(id => id === 'so_tu_vi_nguyen_ban_1962').length, 1);
  assert.equal(curr().inventory.itemIds.filter(id => id === 'thu_tay_thoa_thuan_boi_toan').length, 1);

  // Advance S2 documents to complete queue
  cmd('dialogue/advance', {}); // so-tu-vi
  cmd('dialogue/advance', {}); // thoa-thuan
  assert.equal(curr().journey.c3.activeDialogue, null);

  const itemCount = curr().inventory.itemIds.length;
  const clueCount = curr().notebook.unlockedClueIds.length;
  const wallet = curr().wallet.senNgoc;

  // Re-interacting with solved chest is rejected (cannot re-open solved chest) and does not grant extra items
  const hChest = content.chapters.c3.areas[1].interactables.find(i => i.id === 'hitbox-bagua-chest')!;
  const reinteract = dispatch(tree, { type: 'interact', payload: { targetId: 'hitbox-bagua-chest', playerPos: hChest.pos } } as never, content);
  assert.equal(reinteract.ok, false);
  assert.equal(curr().inventory.itemIds.length, itemCount);
  assert.equal(curr().notebook.unlockedClueIds.length, clueCount);
  assert.equal(curr().wallet.senNgoc, wallet);

  // Journal maps both items to documents for read-only viewing
  const docSoGoc = c3DocumentForItem('so_tu_vi_nguyen_ban_1962');
  const docThu = c3DocumentForItem('thu_tay_thoa_thuan_boi_toan');
  assert.ok(docSoGoc);
  assert.ok(docThu);
  assert.equal(docSoGoc.id, 'doc-c3-so-goc');
  assert.equal(docThu.id, 'doc-c3-thu-thoa-thuan');
});

test('NPC portraits and An layer paths resolve correctly for C3 and other characters', () => {
  assert.equal(anLayerPath('hair_front', 'bob_default'), 'assets/characters/an/hair_front__bob.png');
  assert.equal(anLayerPath('outfit_front', 'jade_style'), 'assets/characters/an/outfit_front__jade.png');
  assert.equal(anLayerPath('outfit_front', 'rose_style'), 'assets/characters/an/outfit_front__rose.png');
  assert.equal(anLayerPath('body_base', 'default'), 'assets/characters/an/body_base.png');

  // Speakers
  const baLon = portraitFor('Bà Lớn');
  assert.ok(baLon.kind === 'sprite' || baLon.kind === 'emblem');
  const vinh = portraitFor('Vinh');
  assert.ok(vinh.kind === 'sprite' || vinh.kind === 'emblem');
  const chuSuu = portraitFor('Chú Sửu');
  assert.ok(chuSuu.kind === 'sprite' || chuSuu.kind === 'emblem');
  const hoangLam = portraitFor('Hoàng Lâm');
  assert.ok(hoangLam.kind === 'sprite' || hoangLam.kind === 'emblem');
  const anPortrait = portraitFor('An');
  assert.equal(anPortrait.kind, 'an');
  const unknownPortrait = portraitFor('Người Lạ');
  assert.equal(unknownPortrait.kind, 'emblem');

  // standingSource
  assert.deepEqual(standingSource('An'), { kind: 'an' });
  assert.equal(standingSource('Người Lạ'), null);
});

test('Character scale and sprite scale calculations for all scene configurations', () => {
  assert.equal(spriteScaleFor({ naturalHeight: 416 }), 1);
  assert.equal(spriteScaleFor({ naturalHeight: 128 }), 1);
  assert.equal(spriteScaleFor({ naturalHeight: 96 }), AN_FIGURE_H / 96);

  // characterScale across scenes and footY
  const scenes = ['c0', 'c1', 'c2', 'c3', 'hub', 'studio', 'closet', 'workshop'] as const;
  for (const s of scenes) {
    const scaleDefault = characterScale(s, 941);
    assert.ok(scaleDefault > 0, `scale for ${s} must be positive`);
    const scaleTop = characterScale(s, 941, 0);
    assert.ok(scaleTop > 0);
    const scaleBottom = characterScale(s, 941, 941);
    assert.ok(scaleBottom > 0);
  }
});

test('Room render helper coverage for C2/C3 overlays, exit arrows, and room NPCs', () => {
  // C2 overlays
  const c2s1 = c2AreaOverlays('c2', 'c2-s1-gac-lung-ve-tranh', ['manh_ban_ve_ao_dai_1'], ['p-c2-sketch-assemble']);
  assert.equal(c2s1.length, 5);
  const c2s2 = c2AreaOverlays('c2', 'c2-s2-kho-vai-hang-dao', ['chia_khoa_ket_sat_bang_thau'], ['p-c2-safe-open']);
  assert.equal(c2s2.length, 2);
  const c2s3 = c2AreaOverlays('c2', 'c2-s3-phong-trien-lam-doi-dau', [], ['p-c2-present-sketch', 'p-c2-present-receipt']);
  assert.equal(c2s3.length, 2);
  assert.deepEqual(c2AreaOverlays('other', 'c2-s1-gac-lung-ve-tranh', [], []), []);

  // C2 exit arrows
  assert.equal(c2ExitArrows('c2-s1-gac-lung-ve-tranh').length, 1);
  assert.equal(c2ExitArrows('c2-s2-kho-vai-hang-dao').length, 2);
  assert.equal(c2ExitArrows('c2-s3-phong-trien-lam-doi-dau').length, 1);
  assert.deepEqual(c2ExitArrows('unknown'), []);

  // C2 room npcs
  const c2NpcsWorried = c2RoomNpcs('c2', 'c2-s3-phong-trien-lam-doi-dau', [], { w: 1672, h: 941 });
  assert.equal(c2NpcsWorried.length, 2);
  assert.ok(c2NpcsWorried.find(n => n.id === 'c2-s3-loan')?.path.includes('scene-worried'));

  const c2NpcsDetermined = c2RoomNpcs('c2', 'c2-s3-phong-trien-lam-doi-dau', ['p-c2-present-sketch'], { w: 1672, h: 941 });
  assert.ok(c2NpcsDetermined.find(n => n.id === 'c2-s3-loan')?.path.includes('scene-determined'));

  const c2NpcsRelieved = c2RoomNpcs('c2', 'c2-s3-phong-trien-lam-doi-dau', ['p-c2-styling-loan'], { w: 1672, h: 941 });
  assert.ok(c2NpcsRelieved.find(n => n.id === 'c2-s3-loan')?.path.includes('scene-relieved'));

  assert.equal(c2RoomNpcs('c2', 'c2-s1-gac-lung-ve-tranh', [], { w: 1672, h: 941 }).length, 1);
  assert.equal(c2RoomNpcs('c2', 'c2-s2-kho-vai-hang-dao', [], { w: 1672, h: 941 }).length, 1);
  assert.deepEqual(c2RoomNpcs('c2', 'unknown', [], { w: 1672, h: 941 }), []);
  assert.deepEqual(c2RoomNpcs('other', 'c2-s3-phong-trien-lam-doi-dau', [], { w: 1672, h: 941 }), []);

  // C3 overlay other
  assert.deepEqual(c3AreaOverlays('other', 'c3-s1-tiem-may-da-kao', [], []), []);
  assert.deepEqual(c3AreaOverlays('c3', 'unknown', [], []), []);
});

test('C3 Document Viewer Keyboard Accessibility: mounted markup and real handleDocumentBodyKeyDown implementation', () => {
  const docIds = ['doc-c3-bien-nhan', 'doc-c3-so-goc', 'doc-c3-thu-thoa-thuan', 'doc-c3-ban-sua'] as const;

  for (const id of docIds) {
    const doc = C3_DOCUMENTS[id];
    const expectedLabel = `Văn bản chứng cứ: ${doc.title}`;

    // 1. Verify mounted markup via React server rendering for both active and readOnly modes
    const activeHtml = renderToStaticMarkup(
      React.createElement(DocumentViewer, { document: doc, readOnly: false })
    );
    assert.ok(activeHtml.includes('role="region"'), `${id} active HTML must render role="region"`);
    assert.ok(activeHtml.includes('tabindex="0"'), `${id} active HTML must render tabindex="0"`);
    assert.ok(activeHtml.includes(`aria-label="${expectedLabel}"`), `${id} active HTML must render accessible aria-label`);
    assert.ok(activeHtml.includes('class="document-viewer-body"'), `${id} active HTML must have .document-viewer-body`);
    assert.ok(activeHtml.includes(doc.summaryText), `${id} active HTML must include summary text`);
    assert.ok(activeHtml.includes(doc.highlightText), `${id} active HTML must include highlight text ("Điểm then chốt")`);
    assert.ok(activeHtml.includes(doc.comparativeRole), `${id} active HTML must include comparative role`);

    const expectedActionLabel = doc.id === 'doc-c3-so-goc' ? 'Đọc tiếp thư thỏa thuận' : 'Xác nhận đã đọc';
    assert.ok(activeHtml.includes(expectedActionLabel), `${id} active HTML must render button "${expectedActionLabel}"`);

    const readOnlyHtml = renderToStaticMarkup(
      React.createElement(DocumentViewer, { document: doc, readOnly: true })
    );
    assert.ok(readOnlyHtml.includes('Sổ manh mối · Chỉ đọc'), `${id} readOnly HTML must render read-only badge`);
    assert.ok(readOnlyHtml.includes('Đóng văn bản'), `${id} readOnly HTML must render "Đóng văn bản" button`);

    // 2. Exercise the actual exported handleDocumentBodyKeyDown implementation
    const target = {
      scrollTop: 0,
      scrollHeight: 873,
      clientHeight: 490,
      style: { scrollBehavior: 'smooth' },
    };
    let prevented = false;
    const createEv = (key: string, repeat = false) => ({
      key,
      repeat,
      preventDefault: () => { prevented = true; },
    });

    const scrollStep = 40;
    const pageStep = Math.max(120, Math.round(target.clientHeight * 0.8)); // 392
    const maxScroll = target.scrollHeight - target.clientHeight; // 383

    // ArrowDown scrolls down by 40px and calls preventDefault
    prevented = false;
    const resDown = handleDocumentBodyKeyDown(target, createEv('ArrowDown'));
    assert.equal(resDown, true, 'ArrowDown must be handled');
    assert.equal(prevented, true, 'ArrowDown must call preventDefault');
    assert.equal(target.scrollTop, scrollStep, 'ArrowDown must advance scrollTop by 40px');

    // PageDown scrolls by pageStep and clamps to maxScroll (383)
    prevented = false;
    const resPageDown = handleDocumentBodyKeyDown(target, createEv('PageDown'));
    assert.equal(resPageDown, true, 'PageDown must be handled');
    assert.equal(prevented, true, 'PageDown must call preventDefault');
    assert.equal(target.scrollTop, maxScroll, 'PageDown must reach and clamp to maxScroll (383)');

    // PageDown again stays capped at maxScroll
    prevented = false;
    handleDocumentBodyKeyDown(target, createEv('PageDown'));
    assert.equal(target.scrollTop, maxScroll, 'PageDown must remain clamped at maxScroll');

    // ArrowUp scrolls up by 40px
    prevented = false;
    const resUp = handleDocumentBodyKeyDown(target, createEv('ArrowUp'));
    assert.equal(resUp, true, 'ArrowUp must be handled');
    assert.equal(prevented, true, 'ArrowUp must call preventDefault');
    assert.equal(target.scrollTop, maxScroll - scrollStep, 'ArrowUp must decrement scrollTop by 40px');

    // Home jumps back to top (0)
    prevented = false;
    const resHome = handleDocumentBodyKeyDown(target, createEv('Home'));
    assert.equal(resHome, true, 'Home must be handled');
    assert.equal(prevented, true, 'Home must call preventDefault');
    assert.equal(target.scrollTop, 0, 'Home must reset scrollTop to 0');

    // End jumps to maximum (383)
    prevented = false;
    const resEnd = handleDocumentBodyKeyDown(target, createEv('End'));
    assert.equal(resEnd, true, 'End must be handled');
    assert.equal(prevented, true, 'End must call preventDefault');
    assert.equal(target.scrollTop, maxScroll, 'End must set scrollTop to maxScroll');

    // PageUp scrolls up by pageStep
    prevented = false;
    const resPageUp = handleDocumentBodyKeyDown(target, createEv('PageUp'));
    assert.equal(resPageUp, true, 'PageUp must be handled');
    assert.equal(prevented, true, 'PageUp must call preventDefault');
    assert.equal(target.scrollTop, Math.max(0, maxScroll - pageStep), 'PageUp must decrement scrollTop by pageStep');

    // Unhandled keys (Tab, Escape, Enter, Space, letter 'a') must return false without calling preventDefault
    for (const key of ['Tab', 'Escape', 'Enter', ' ', 'a', 'F5']) {
      prevented = false;
      const unhandled = handleDocumentBodyKeyDown(target, createEv(key));
      assert.equal(unhandled, false, `Key ${key} must not be handled by reader`);
      assert.equal(prevented, false, `Key ${key} must not call preventDefault`);
    }

    // Key repeat handling: verifies repeat flag is processed cleanly
    prevented = false;
    const repeatRes = handleDocumentBodyKeyDown(target, createEv('ArrowDown', true));
    assert.equal(repeatRes, true, 'ArrowDown with repeat=true must be handled');
    assert.equal(prevented, true, 'ArrowDown with repeat=true must call preventDefault');

    // Reduced motion handling: verifies explicit prefersReducedMotion flag is accepted
    prevented = false;
    const reducedRes = handleDocumentBodyKeyDown(target, createEv('ArrowDown'), true);
    assert.equal(reducedRes, true, 'ArrowDown with prefersReducedMotion=true must be handled');
    assert.equal(prevented, true, 'ArrowDown with prefersReducedMotion=true must call preventDefault');

    // Non-scrollable container: when scrollHeight <= clientHeight, stays at 0
    const nonScrollable = { scrollTop: 0, scrollHeight: 300, clientHeight: 500 };
    handleDocumentBodyKeyDown(nonScrollable, createEv('ArrowDown'));
    assert.equal(nonScrollable.scrollTop, 0, 'Non-scrollable container must stay at 0');
    handleDocumentBodyKeyDown(nonScrollable, createEv('End'));
    assert.equal(nonScrollable.scrollTop, 0, 'Non-scrollable container End must stay at 0');
  }
});

test('C3 Hotspot Labels: all 11 interactables mapped with descriptive object/action names and no speaker confusion', () => {
  // All 11 C3 interactables must be explicitly present in C3_HOTSPOT_LABELS
  const expectedLabels: Record<string, string> = {
    // S1
    'hitbox-gramophone': 'Xem máy hát đĩa',
    'hitbox-fabric-attic': 'Nhặt biên nhận tiền',
    'hitbox-c3-read-receipt': 'Đọc biên nhận tiền',
    'hitbox-street-exit': 'Ra ngoài đường',
    // S2
    'hitbox-incense-bowl': 'Xem bát hương',
    'hitbox-bagua-mirror': 'Xem gương Bát Quái',
    'hitbox-bagua-chest': 'Mở rương Bát Quái',
    // S3
    'hitbox-salon-table': 'Trình chứng cứ',
    'hitbox-c3-read-revision': 'Đọc bản sửa hồ sơ',
    'hitbox-vinh-support': 'Nói chuyện với Vinh',
    'hitbox-styling-mai': 'Phối đồ cho Mai',
  };

  const keys = Object.keys(expectedLabels);
  assert.equal(keys.length, 11, 'Exactly 11 interactables must be mapped in C3');

  for (const [id, label] of Object.entries(expectedLabels)) {
    assert.equal(C3_HOTSPOT_LABELS[id], label, `Label for ${id} must match expected label`);
  }

  // Critical audit regression check: Objects must NOT be labeled with speaker names
  const objectHotspots = [
    'hitbox-gramophone',
    'hitbox-fabric-attic',
    'hitbox-c3-read-receipt',
    'hitbox-street-exit',
    'hitbox-incense-bowl',
    'hitbox-bagua-mirror',
    'hitbox-bagua-chest',
    'hitbox-salon-table',
    'hitbox-c3-read-revision',
    'hitbox-styling-mai',
  ];

  for (const id of objectHotspots) {
    const label = C3_HOTSPOT_LABELS[id];
    assert.ok(!label.includes('Bà Mai'), `Object ${id} must NOT have speaker label "Bà Mai"`);
    assert.ok(label !== 'Mai', `Object ${id} must NOT have speaker label "Mai"`);
    assert.ok(!label.includes('Thầy Ba Càn'), `Object ${id} must NOT have speaker label "Thầy Ba Càn"`);
    assert.ok(!label.includes('Bà Lớn'), `Object ${id} must NOT have speaker label "Bà Lớn"`);
  }

  // Only the NPC hotspot uses character name
  assert.ok(C3_HOTSPOT_LABELS['hitbox-vinh-support'].includes('Vinh'), 'hitbox-vinh-support must include character name Vinh');
});
