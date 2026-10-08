import { loadContent } from '../content/index.ts';
import { createInitialState } from './state.ts';
import { validateState } from './invariants.ts';
import { defaultRegistry } from './registry.ts';
import './commands/index.ts';
import {
  createInitialTree,
  dispatch,
  undo,
  redo,
  checkout,
  branches,
  prune,
  type HistoryTree
} from './history/history-tree.ts';
import {
  createScopedSession,
  dispatchSession,
  undoSession,
  redoSession,
  commitSession
} from './history/scoped-session.ts';
import { toJSON, fromJSON } from './history/serialize.ts';
import { replayPath } from './history/replay.ts';
import { nearestInteractable } from './commands/journey/interact-command.ts';
import type { StudioDraft, PuzzleDraft } from './state.ts';

export interface CheckResult {
  id: number;
  name: string;
  passed: boolean;
  message?: string;
  durationMs?: number;
}

export interface SelfCheckReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  allPassed: boolean;
  results: CheckResult[];
}

export function runSelfCheck(): SelfCheckReport {
  const content = loadContent();
  const results: CheckResult[] = [];
  const ctx = { now: () => 1700000000000, seed: 'self-check-seed' };

  function executeCheck(id: number, name: string, fn: () => void) {
    const t0 = performance.now();
    try {
      fn();
      const durationMs = Math.round(performance.now() - t0);
      results.push({ id, name, passed: true, durationMs });
    } catch (err) {
      const durationMs = Math.round(performance.now() - t0);
      const message = err instanceof Error ? err.message : String(err);
      results.push({ id, name, passed: false, message, durationMs });
    }
  }

  // ----------------------------------------------------
  // Check 1: Mọi lệnh trong registry có kind; mọi lệnh không phải one-way có invert khác null
  // ----------------------------------------------------
  executeCheck(1, 'Mọi lệnh có kind; không phải one-way có invert khác null', () => {
    const allCommands = defaultRegistry.getAll();
    if (allCommands.length === 0) throw new Error('Registry is empty!');

    const sampleState = createInitialState(content, ctx);

    for (const cmd of allCommands) {
      if (!cmd.kind) {
        throw new Error(`Command '${cmd.type}' is missing 'kind'.`);
      }
      if (cmd.kind !== 'one-way') {
        if (!cmd.invert || typeof cmd.invert !== 'function') {
          throw new Error(`Command '${cmd.type}' (kind: ${cmd.kind}) must have an invert function.`);
        }
        const samplePayload: any = {
          chapterId: 'c1',
          areaId: 'c1-s1-buong-det-khoa-kin',
          targetId: 'hitbox-back-window',
          clueId: 'clue-c1-tiet-hanh',
          itemId: 'con_thoi_go_mun',
          itemIds: ['con_thoi_go_mun', 'that_lung_lua_cham'],
          puzzleId: 'p-c1-escape',
          accessoryId: 'khan-van-den',
          outfitId: 'outfit-1',
          outfit: {
            id: 'outfit-1',
            name: 'Trang phục mẫu',
            garmentId: 'ao-tu-than',
            equippedAccessories: {},
            colorPalette: ['#1', '#2', '#3', '#4'],
            createdAt: '1970-01-01T00:00:00.000Z'
          },
          newName: 'Tên mới',
          amount: 10,
          colorPalette: ['#1', '#2', '#3', '#4'],
          slot: 'headwear',
          silhouette: 'tu_than'
        };
        const inv = cmd.invert(sampleState, samplePayload, content);
        if (inv === null || typeof inv !== 'object' || !inv.type) {
          throw new Error(`Command '${cmd.type}' (kind: ${cmd.kind}) invert returned null or invalid command.`);
        }
      }
    }
  });

  // ----------------------------------------------------
  // Check 2: Với mỗi lệnh reversible/compensable: apply rồi apply(invert) -> state bằng ban đầu
  // ----------------------------------------------------
  executeCheck(2, 'Áp dụng rồi nghịch đảo (apply -> invert) khôi phục state ban đầu', () => {
    const s0 = createInitialState(content, ctx);

    // Test a sample of reversible commands
    // 1. area/goTo on unlocked area
    const chProgress = s0.journey.prologue;
    const secondArea = chProgress.unlockedAreaIds[1];
    const goToDef = defaultRegistry.get('area/goTo')!;
    const appliedGoTo = goToDef.apply(s0, { areaId: secondArea }, content);
    const invGoTo = goToDef.invert!(s0, { areaId: secondArea }, content)!;
    const invGoToDef = defaultRegistry.get(invGoTo.type)!;
    const restoredGoTo = invGoToDef.apply(appliedGoTo.state, invGoTo.payload, content);
    if (restoredGoTo.state.journey.prologue.currentArea !== s0.journey.prologue.currentArea) {
      throw new Error('area/goTo invert did not restore original currentArea');
    }

    // 2. item/pick
    const pickDef = defaultRegistry.get('item/pick')!;
    const appliedPick = pickDef.apply(s0, { itemId: 'kim_gut_bang_bac' }, content);
    const invPick = pickDef.invert!(s0, { itemId: 'kim_gut_bang_bac' }, content)!;
    const invPickDef = defaultRegistry.get(invPick.type)!;
    const restoredPick = invPickDef.apply(appliedPick.state, invPick.payload, content);
    if (restoredPick.state.inventory.itemIds.includes('kim_gut_bang_bac')) {
      throw new Error('item/pick invert did not remove item');
    }

    // 3. wallet/grant
    const grantDef = defaultRegistry.get('wallet/grant')!;
    const appliedGrant = grantDef.apply(s0, { amount: 50 }, content);
    const invGrant = grantDef.invert!(s0, { amount: 50 }, content)!;
    const invGrantDef = defaultRegistry.get(invGrant.type)!;
    const restoredGrant = invGrantDef.apply(appliedGrant.state, invGrant.payload, content);
    if (restoredGrant.state.wallet.senNgoc !== s0.wallet.senNgoc) {
      throw new Error('wallet/grant invert did not restore balance');
    }
  });

  // ----------------------------------------------------
  // Check 3: involution (side/flip) áp hai lần -> bằng ban đầu
  // ----------------------------------------------------
  executeCheck(3, 'Lệnh involution (side/flip) áp dụng hai lần hoàn trả trạng thái ban đầu', () => {
    // Enable latVai for test on c1 (c1-s1 supports side trai)
    const s0: any = {
      ...createInitialState(content, ctx, { latVai: true }),
      currentChapter: 'c1'
    };
    s0.journey.c1.status = 'in_progress';
    s0.journey.c1.currentArea = 'c1-s1-buong-det-khoa-kin';

    const flipDef = defaultRegistry.get('side/flip')!;
    const res1 = flipDef.apply(s0, {}, content);
    if (res1.state.journey.c1.side !== 'mat_trai') {
      throw new Error('First side/flip did not flip to mat_trai');
    }

    const res2 = flipDef.apply(res1.state, {}, content);
    if (res2.state.journey.c1.side !== 'mat_phai') {
      throw new Error('Second side/flip did not flip back to mat_phai');
    }

    if (JSON.stringify(s0.journey.c1) !== JSON.stringify(res2.state.journey.c1)) {
      throw new Error('Involution failed: journey state after 2 flips differs from initial');
    }
  });

  // ----------------------------------------------------
  // Check 4: Guard từ chối đúng lý do
  // ----------------------------------------------------
  executeCheck(4, 'Guard của các lệnh từ chối đúng lý do khi gặp điều kiện không hợp lệ', () => {
    const s0 = createInitialState(content, ctx);

    // chapter/enter locked chapter
    const enterDef = defaultRegistry.get('chapter/enter')!;
    const g1 = enterDef.guard(s0, { chapterId: 'c2' }, content);
    if (g1 === true || (typeof g1 === 'object' && g1.ok)) {
      throw new Error('chapter/enter should reject locked chapter c2');
    }

    // area/goTo locked area
    const goToDef = defaultRegistry.get('area/goTo')!;
    const g2 = goToDef.guard(s0, { areaId: 'c1-s3-cong-dinh-doi-dau' }, content);
    if (g2 === true || (typeof g2 === 'object' && g2.ok)) {
      throw new Error('area/goTo should reject locked area');
    }

    // shop/buy without enough funds
    const buyDef = defaultRegistry.get('shop/buy')!;
    const poorState = { ...s0, wallet: { senNgoc: 0 } };
    const g3 = buyDef.guard(poorState, { accessoryId: 'kieng-bac' }, content);
    if (g3 === true || (typeof g3 === 'object' && g3.ok)) {
      throw new Error('shop/buy should reject when insufficient funds');
    }
  });

  // ----------------------------------------------------
  // Check 5: Kịch bản Chương 1 forward -> mọi bước qua validateState; claimed = true đúng 1 lần
  // ----------------------------------------------------
  let c1Tree: HistoryTree;
  let c1NodeBeforeAltar: string;
  let c1NodeAtAltar: string;
  let c1BeforeRewardTree: HistoryTree;

  executeCheck(5, 'Kịch bản Chương 1 đi hết forward qua validateState; claimed = true đúng một lần', () => {
    let tree = createInitialTree(createInitialState(content, ctx), ctx);

    // Unlock C1
    tree.nodes[tree.headId].snapshot.journey.c1.status = 'in_progress';

    // 1. Enter C1
    let d = dispatch(tree, { type: 'chapter/enter', payload: { chapterId: 'c1' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 1 failed: ${d.reason}`);
    tree = d.tree;

    // 2. Pick loom shuttle
    d = dispatch(tree, { type: 'item/pick', payload: { itemId: 'con_thoi_go_mun' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 2 failed: ${d.reason}`);
    tree = d.tree;

    // 3. Pick belt rack
    d = dispatch(tree, { type: 'item/pick', payload: { itemId: 'that_lung_lua_cham' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 3 failed: ${d.reason}`);
    tree = d.tree;

    // 4. Combine
    d = dispatch(tree, { type: 'item/combine', payload: { itemIds: ['con_thoi_go_mun', 'that_lung_lua_cham'] } }, content, ctx);
    if (!d.ok) throw new Error(`Step 4 failed: ${d.reason}`);
    tree = d.tree;

    // 5. Use tool on window
    d = dispatch(tree, { type: 'item/use', payload: { itemId: 'dung_cu_moc_then_cua', targetPuzzleId: 'p-c1-escape' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 5 failed: ${d.reason}`);
    tree = d.tree;

    // 6. Go to s2
    d = dispatch(tree, { type: 'area/goTo', payload: { areaId: 'c1-s2-ban-tho-nha-tho-ho' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 6 failed: ${d.reason}`);
    tree = d.tree;
    c1NodeBeforeAltar = tree.headId;

    // 7. Use scissors on altar
    d = dispatch(tree, { type: 'item/use', payload: { itemId: 'keo_may_bang_dong', targetPuzzleId: 'p-c1-altar-cut-threads' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 7 failed: ${d.reason}`);
    tree = d.tree;
    c1NodeAtAltar = tree.headId;

    // 8. Go to s3
    d = dispatch(tree, { type: 'area/goTo', payload: { areaId: 'c1-s3-cong-dinh-doi-dau' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 8 failed: ${d.reason}`);
    tree = d.tree;

    // 9. Present contract
    d = dispatch(tree, { type: 'puzzle/submit', payload: { puzzleId: 'p-c1-present-contract', answer: 'to_van_tu_cam_co_dat' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 9 failed: ${d.reason}`);
    tree = d.tree;

    // 10. Present letter
    d = dispatch(tree, { type: 'puzzle/submit', payload: { puzzleId: 'p-c1-present-letter', answer: 'buc_thu_tay_chong_cu_Cam' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 10 failed: ${d.reason}`);
    tree = d.tree;

    // 11. Submit styling
    d = dispatch(tree, {
      type: 'puzzle/submit',
      payload: {
        puzzleId: 'p-c1-styling-cam',
        answer: {
          silhouette: 'ngu_than_tay_chen',
          garmentId: 'ao-ngu-than-tay-chen',
          headwearId: 'khan-van-den',
          footwearId: 'guoc-moc'
        }
      }
    }, content, ctx);
    if (!d.ok) throw new Error(`Step 11 failed: ${d.reason}`);
    tree = d.tree;

    // Acknowledge the queued evidence and ending; no UI effect may bypass this.
    while (tree.nodes[tree.headId].snapshot.journey.c1.activeDialogue) {
      const read = dispatch(tree, { type: 'dialogue/advance', payload: {} }, content, ctx);
      if (!read.ok) throw new Error(read.reason);
      tree = read.tree;
    }
    const gate = content.chapters.c1.areas[2].interactables.find(i => i.id === 'hitbox-village-gate-exit')!;
    const openEnding = dispatch(tree, { type: 'interact', payload: { targetId: gate.id, playerPos: gate.pos } }, content, ctx);
    if (!openEnding.ok) throw new Error(openEnding.reason);
    tree = openEnding.tree;
    while (tree.nodes[tree.headId].snapshot.journey.c1.activeDialogue) {
      const read = dispatch(tree, { type: 'dialogue/advance', payload: {} }, content, ctx);
      if (!read.ok) throw new Error(read.reason);
      tree = read.tree;
    }
    c1BeforeRewardTree = tree;
    // 12. Complete chapter
    d = dispatch(tree, { type: 'chapter/complete', payload: { chapterId: 'c1' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 12 failed: ${d.reason}`);
    tree = d.tree;

    // 13. Claim reward
    d = dispatch(tree, { type: 'reward/claim', payload: { chapterId: 'c1' } }, content, ctx);
    if (!d.ok) throw new Error(`Step 13 failed: ${d.reason}`);
    tree = d.tree;

    // Check claimed === true
    const finalState = tree.nodes[tree.headId].snapshot;
    if (!finalState.journey.c1.claimed) {
      throw new Error('Chapter 1 claimed flag is not true.');
    }

    // Try claiming reward a second time -> MUST be rejected
    const dFail = dispatch(tree, { type: 'reward/claim', payload: { chapterId: 'c1' } }, content, ctx);
    if (dFail.ok) {
      throw new Error('reward/claim succeeded a second time; expected rejection.');
    }

    c1Tree = tree;
  });

  // ----------------------------------------------------
  // Check 6: Kịch bản rẽ nhánh: checkout về trước -> đi nhánh mới -> checkout lại nhánh cũ
  // ----------------------------------------------------
  executeCheck(6, 'Rẽ nhánh lịch sử: checkout về quá khứ, đi nhánh mới và khôi phục nhánh cũ nguyên vẹn', () => {
    let tree = structuredClone(c1BeforeRewardTree);

    // 1. Checkout to node before altar
    const chk1 = checkout(tree, c1NodeBeforeAltar, content);
    if (!chk1.ok) throw new Error(`Checkout to node before altar failed: ${chk1.reason}`);
    tree = chk1.tree;

    // 2. Dispatch a new branch action from before altar (e.g. area/goBack)
    const dNew = dispatch(tree, { type: 'area/goBack', payload: {} }, content, ctx, 'nhanh-moi-quay-ve');
    if (!dNew.ok) throw new Error(`Branch action failed: ${dNew.reason}`);
    tree = dNew.tree;

    // 3. Checkout back to original altar node
    const chk2 = checkout(tree, c1NodeAtAltar, content);
    if (!chk2.ok) throw new Error(`Checkout back to altar node failed: ${chk2.reason}`);
    tree = chk2.tree;

    // Verify snapshot at c1NodeAtAltar is identical to original
    const origSnapshot = c1Tree.nodes[c1NodeAtAltar].snapshot;
    const currentSnapshot = tree.nodes[c1NodeAtAltar].snapshot;
    if (JSON.stringify(origSnapshot) !== JSON.stringify(currentSnapshot)) {
      throw new Error('Branching corrupted original branch snapshot!');
    }
  });

  // ----------------------------------------------------
  // Check 7: undo rồi redo trả đúng head cũ; undo ở gốc không lỗi
  // ----------------------------------------------------
  executeCheck(7, 'undo và redo di chuyển head chính xác; undo ở gốc trả về an toàn', () => {
    const rootTree = createInitialTree(createInitialState(content, ctx), ctx);
    const uRoot = undo(rootTree);
    if (uRoot.ok) throw new Error('undo at root should return ok: false');

    // Add a child node
    const d = dispatch(rootTree, { type: 'wallet/grant', payload: { amount: 10 } }, content, ctx);
    if (!d.ok) throw new Error('Dispatch failed');
    const childTree = d.tree;
    const childHeadId = childTree.headId;

    const u = undo(childTree);
    if (!u.ok || u.tree.headId !== rootTree.rootId) {
      throw new Error('undo did not move headId to root');
    }

    const r = redo(u.tree);
    if (!r.ok || r.tree.headId !== childHeadId) {
      throw new Error('redo did not restore headId to child');
    }
  });

  // ----------------------------------------------------
  // Check 8: area/goBack sau khi giải câu đố -> câu đố vẫn là đã giải
  // ----------------------------------------------------
  executeCheck(8, 'area/goBack sau khi giải câu đố: tiến trình câu đố vẫn được bảo toàn', () => {
    // Starting from node at altar in c1-s2, where p-c1-altar-cut-threads is solved
    const altarSnapshot = c1Tree.nodes[c1NodeAtAltar].snapshot;
    if (!altarSnapshot.journey.c1.solvedPuzzleIds.includes('p-c1-altar-cut-threads')) {
      throw new Error('Puzzle not solved at altar node');
    }

    const goBackDef = defaultRegistry.get('area/goBack')!;
    const res = goBackDef.apply(altarSnapshot, {}, content);

    if (res.state.journey.c1.currentArea !== 'c1-s1-buong-det-khoa-kin') {
      throw new Error('area/goBack did not return to c1-s1');
    }
    if (!res.state.journey.c1.solvedPuzzleIds.includes('p-c1-altar-cut-threads')) {
      throw new Error('Solved puzzle was lost after area/goBack');
    }
  });

  // ----------------------------------------------------
  // Check 9: chapter/replay sau khi đã nhận thưởng -> không cộng Sen Ngọc lần 2
  // ----------------------------------------------------
  executeCheck(9, 'chapter/replay sau khi nhận thưởng: chơi xong lần 2 không cộng Sen Ngọc', () => {
    const headState = c1Tree.nodes[c1Tree.headId].snapshot;
    const balanceAfterC1 = headState.wallet.senNgoc;

    const replayDef = defaultRegistry.get('chapter/replay')!;
    const replayed = replayDef.apply(headState, { chapterId: 'c1' }, content);

    // Claimed must remain true
    if (!replayed.state.journey.c1.claimed) {
      throw new Error('claimed flag was reset by chapter/replay');
    }

    // Try claiming reward after replay
    const claimDef = defaultRegistry.get('reward/claim')!;
    const guardResult = claimDef.guard(replayed.state, { chapterId: 'c1' }, content);
    if (guardResult === true || (typeof guardResult === 'object' && guardResult.ok)) {
      throw new Error('reward/claim allowed second claim after chapter/replay');
    }

    if (replayed.state.wallet.senNgoc !== balanceAfterC1) {
      throw new Error('Wallet balance altered during chapter/replay');
    }
  });

  // ----------------------------------------------------
  // Check 10: Studio: 5 thay đổi -> undo 3 -> redo 1 -> lưu: cây game chỉ tăng đúng 1 nút
  // ----------------------------------------------------
  executeCheck(10, 'Studio: 5 thao tác, undo 3, redo 1, lưu -> cây game tăng đúng 1 nút', () => {
    let tree = createInitialTree(createInitialState(content, ctx), ctx);
    const initialNodesCount = Object.keys(tree.nodes).length;

    const initialDraft: StudioDraft = {
      type: 'studio',
      eventContextId: 'dao_pho',
      silhouette: 'tu_than',
      garmentId: 'ao-tu-than',
      colorPalette: ['#111111', '#222222', '#333333', '#444444'],
      equippedAccessories: {}
    };

    let session = createScopedSession(initialDraft, 'studio');

    // 5 changes
    session = dispatchSession(session, (d) => ({ ...d, eventContextId: 'tet' }));
    session = dispatchSession(session, (d) => ({ ...d, silhouette: 'ngu_than_tay_chen' }));
    session = dispatchSession(session, (d) => ({ ...d, colorPalette: ['#AA', '#BB', '#CC', '#DD'] }));
    session = dispatchSession(session, (d) => ({ ...d, equippedAccessories: { headwear: 'khan-van-den' } }));
    session = dispatchSession(session, (d) => ({ ...d, equippedAccessories: { ...d.equippedAccessories, footwear: 'guoc-moc' } }));

    // undo 3
    session = undoSession(session).session;
    session = undoSession(session).session;
    session = undoSession(session).session;

    // redo 1
    session = redoSession(session).session;

    // commit
    const commitRes = commitSession(session);
    if (!commitRes.ok) throw new Error(`Commit studio session failed: ${commitRes.reason}`);

    // dispatch to game tree
    const d = dispatch(tree, commitRes.command, content, ctx, 'Lưu trang phục Studio');
    if (!d.ok) throw new Error(`Dispatch closet/saveOutfit failed: ${d.reason}`);

    const finalNodesCount = Object.keys(d.tree.nodes).length;
    if (finalNodesCount !== initialNodesCount + 1) {
      throw new Error(`Game tree increased by ${finalNodesCount - initialNodesCount} nodes, expected 1.`);
    }
  });

  // ----------------------------------------------------
  // Check 11: Phiên câu đố ghép khuy
  // ----------------------------------------------------
  executeCheck(11, 'Phiên câu đố: đặt 3, undo 2, redo 1, kiểm tra sai -> cây không đổi; hoàn thành -> tăng đúng 1 nút', () => {
    let tree = createInitialTree(createInitialState(content, ctx), ctx);
    const initialNodesCount = Object.keys(tree.nodes).length;

    const initialPuzzleDraft: PuzzleDraft = {
      type: 'puzzle',
      puzzleId: 'p-c0-cloth',
      chapterId: 'prologue',
      valid: false,
      data: { placedButtons: [] }
    };

    let session = createScopedSession(initialPuzzleDraft, 'puzzle');

    // Place 3 buttons
    session = dispatchSession(session, (d) => ({ ...d, data: { placedButtons: [1] } }));
    session = dispatchSession(session, (d) => ({ ...d, data: { placedButtons: [1, 2] } }));
    session = dispatchSession(session, (d) => ({ ...d, data: { placedButtons: [1, 2, 3] } }));

    // Undo 2
    session = undoSession(session).session;
    session = undoSession(session).session;

    // Redo 1
    session = redoSession(session).session;

    // Check when incomplete -> valid === false
    const commitFail = commitSession(session);
    if (commitFail.ok) {
      throw new Error('Incomplete puzzle session should not be committable');
    }

    if (Object.keys(tree.nodes).length !== initialNodesCount) {
      throw new Error('Failed check modified game tree');
    }

    // Place remaining to reach 5 and mark valid
    session = dispatchSession(session, (d) => ({
      ...d,
      valid: true,
      data: { placedButtons: [1, 2, 3, 4, 5], answer: 'interact' }
    }));

    const commitSuccess = commitSession(session);
    if (!commitSuccess.ok) {
      throw new Error(`Valid puzzle session commit failed: ${commitSuccess.reason}`);
    }

    // Submit the actual answer; the session valid flag alone cannot solve.
    tree.nodes[tree.headId].snapshot.journey.prologue.currentArea = 'c0-s2-gac-xep-chiec-ruong';
    // Dispatch puzzle/submit into game tree
    const d = dispatch(tree, commitSuccess.command, content, ctx, 'Giải ma trận chỉ vàng');
    if (!d.ok) throw new Error(`Dispatch puzzle/solve failed: ${d.reason}`);

    const finalNodesCount = Object.keys(d.tree.nodes).length;
    if (finalNodesCount !== initialNodesCount + 1) {
      throw new Error(`Expected tree to increase by 1, got ${finalNodesCount - initialNodesCount}`);
    }
  });

  // ----------------------------------------------------
  // Check 12: interact bán kính, dialogue, clue, playerPos không xuất hiện trong state
  // ----------------------------------------------------
  executeCheck(12, 'interact: ngoài bán kính bị từ chối; trong bán kính mở dialogue; playerPos không nằm trong state', () => {
    const s0 = createInitialState(content, ctx);
    const interactDef = defaultRegistry.get('interact')!;
    const catPosition = content.chapters.prologue.areas[0].interactables.find(i => i.id === 'hitbox-cat')!.pos;

    // 1. Outside radius
    const outRes = interactDef.guard(
      s0,
      { targetId: 'hitbox-cat', playerPos: { x: 0.1, y: 0.1 } },
      content
    );
    if (outRes === true || (typeof outRes === 'object' && outRes.ok)) {
      throw new Error('interact guard should reject player outside radius');
    }

    // 2. Inside radius
    const inRes = interactDef.guard(
      s0,
      { targetId: 'hitbox-cat', playerPos: catPosition },
      content
    );
    if (inRes !== true && (typeof inRes === 'object' && !inRes.ok)) {
      throw new Error('interact guard should accept player within radius');
    }

    const applied = interactDef.apply(
      s0,
      { targetId: 'hitbox-cat', playerPos: catPosition },
      content
    );

    // Verify playerPos is NOT saved in state
    const stateStr = JSON.stringify(applied.state);
    if (stateStr.includes('playerPos')) {
      throw new Error('playerPos was found saved in GameState!');
    }

    // Verify dialogue opened
    if (applied.state.journey.prologue.activeDialogue?.dialogueId !== 'd-c0-cat') {
      throw new Error('interact did not open dialogue d-c0-cat');
    }

    // Verify nearestInteractable
    const near = nearestInteractable(s0, content, catPosition);
    if (near !== 'hitbox-cat') {
      throw new Error(`nearestInteractable returned '${near}', expected 'hitbox-cat'`);
    }
  });

  // ----------------------------------------------------
  // Check 13: features.latVai = false: side/flip bị từ chối và side không bao giờ khác phai
  // ----------------------------------------------------
  executeCheck(13, 'features.latVai = false: side/flip bị từ chối và side không bao giờ khác phai', () => {
    const s0 = createInitialState(content, ctx, { latVai: false });
    const flipDef = defaultRegistry.get('side/flip')!;

    const guardRes = flipDef.guard(s0, {}, content);
    if (guardRes === true || (typeof guardRes === 'object' && guardRes.ok)) {
      throw new Error('side/flip guard must reject when latVai is false');
    }

    for (const [chId, progress] of Object.entries(s0.journey)) {
      if (progress.side !== 'mat_phai') {
        throw new Error(`Chapter ${chId} side is '${progress.side}', expected 'mat_phai'`);
      }
    }
  });

  // ----------------------------------------------------
  // Check 14: replayPath(head) bằng snapshot head ở mọi nút
  // ----------------------------------------------------
  executeCheck(14, 'replayPath(head) tái hiện trạng thái khớp 100% snapshot ở mọi nút', () => {
    for (const node of Object.values(c1Tree.nodes)) {
      const rep = replayPath(c1Tree, node.id, content);
      if (!rep.ok) {
        throw new Error(`replayPath failed on node '${node.id}': ${rep.reason}`);
      }
      if (!rep.matchesSnapshot) {
        throw new Error(`replayPath snapshot mismatch at node '${node.id}'`);
      }
    }
  });

  // ----------------------------------------------------
  // Check 15: serialize -> deserialize -> head bằng nhau; JSON hỏng báo lỗi không crash
  // ----------------------------------------------------
  executeCheck(15, 'serialize và deserialize bảo toàn trạng thái; JSON lỗi báo lỗi mà không crash', () => {
    const json = toJSON(c1Tree);
    const parsed = fromJSON(json, content);
    if (!parsed.ok) {
      throw new Error(`fromJSON failed on valid tree: ${parsed.reason}`);
    }

    const headOrig = c1Tree.nodes[c1Tree.headId].snapshot;
    const headRestored = parsed.tree.nodes[parsed.tree.headId].snapshot;

    if (JSON.stringify(headOrig) !== JSON.stringify(headRestored)) {
      throw new Error('Deserialized head snapshot differs from original');
    }

    // Malformed JSON check (must not crash)
    const badRes1 = fromJSON('{ bad json...', content);
    if (badRes1.ok) throw new Error('fromJSON should fail on bad JSON string');

    const badRes2 = fromJSON(JSON.stringify({ saveFormatVersion: 'tiem-may-nep-save-v1', tree: null }), content);
    if (badRes2.ok) throw new Error('fromJSON should fail on null tree');
  });

  const passedChecks = results.filter((r) => r.passed).length;
  const failedChecks = results.filter((r) => !r.passed).length;

  return {
    timestamp: new Date().toISOString(),
    totalChecks: results.length,
    passedChecks,
    failedChecks,
    allPassed: failedChecks === 0,
    results
  };
}
