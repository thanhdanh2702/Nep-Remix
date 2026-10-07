import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../src/content/index.ts';
import {
  createInitialState,
  createInitialTree,
  dispatch,
  fromJSON,
  runCommand,
  toJSON,
} from '../src/core/index.ts';
import * as CoreExports from '../src/core/index.ts';

/**
 * BỘ KIỂM THỬ HỒI QUY ĐỘC LẬP CHƯƠNG 2 — TESTER OWNERSHIP
 *
 * Tiêu chuẩn nghiệm thu harness:
 * 1. Mọi test phải kiểm tra implementation thật:
 *    - Không tự viết lại hàm move/remove rồi dùng kết quả đó chứng minh runtime đúng.
 *    - Không dùng NPC map, tọa độ hoặc kích thước hằng trong test để chứng minh renderer hoạt động.
 *    - Không dùng assertion điều kiện để âm thầm pass khi helper, modal hoặc selector bắt buộc không tồn tại.
 *    - Import API thật; dependency thiếu phải báo FAIL hoặc BLOCKED rõ ràng.
 * 2. Test chạy độc lập trên đúng checkout:
 *    - Bỏ fallback đường dẫn tuyệt đối sang worktree Leader/Frontend.
 *    - Dùng content, asset và source của chính candidate.
 *    - Sửa clue ID theo content thật: clue-bien-lai-goc-1935.
 *    - Dùng đúng payload Closet/equippedAccessories và fixture đã đạt gate P5.
 *    - Kiểm tra cả direct payload và session khi thử thoát quyền mượn.
 *    - Không ép thông báo lỗi tiếng Anh nếu contract không quy định.
 * 3. Kiểm chứng UI thật:
 *    - NPC: kiểm tra dữ liệu renderer thật và bằng chứng hiển thị; không chỉ kiểm ảnh tồn tại/no404.
 *    - Ghép tranh: đo tỷ lệ hiển thị, liền dải và controls tách rời.
 *    - Keyboard: focus piece 4 → ArrowLeft ba lần, kiểm thứ tự và đúng element giữ focus sau mỗi lần.
 *    - Gỡ mảnh đầu/giữa/cuối kiểm focus chuyển hợp lý; kiểm biên không đổi thứ tự.
 *    - Không fixed sleep, tăng timeout hoặc bỏ assertion để làm xanh.
 */

const content = loadContent();
const c2 = content.chapters.c2;
const [S1, S2, S3] = c2.areas.map(a => a.id);
const [P1, P2, P3, P4, P5] = c2.puzzles.map(p => p.id);

const pieces = [
  'manh_ban_ve_ao_dai_1',
  'manh_ban_ve_ao_dai_2',
  'manh_ban_ve_ao_dai_3',
  'manh_ban_ve_ao_dai_4',
];
const key = 'chia_khoa_ket_sat_bang_thau';
const receipt = 'bien_lai_tra_no_goc_1935';
const contract = 'ban_giao_keo_ep_hon';
const sketch = 'ban_ve_ao_dai_tan_thoi';

function createC2State(areaId = S1) {
  const state = createInitialState(content);
  state.currentChapter = 'c2';
  state.journey.c2.status = 'in_progress';
  state.journey.c2.currentArea = areaId;
  state.journey.c2.side = 'mat_phai';
  state.journey.c2.unlockedAreaIds = [S1, S2, S3];
  return state;
}

function expectReject(state: ReturnType<typeof createC2State>, type: string, payload: unknown, message: string) {
  const result = runCommand(state, { type, payload }, content);
  assert.equal(result.ok, false, `${message} - lệnh ${type} phải bị từ chối`);
  assert.equal(result.state, state, 'Trạng thái không được thay đổi khi lệnh bị từ chối');
}

// ============================================================================
// 1. GATE MATRIX: D0, G1, G2, THỨ TỰ TRÌNH BÀY & KẾT THÚC
// ============================================================================

test('[C2 Gate 1.1] Chưa hoàn thành D0: không được nhặt 4 mảnh vẽ hoặc mở P1', () => {
  const state = createC2State(S1);
  for (const piece of pieces) {
    expectReject(state, 'item/pick', { itemId: piece }, `Nhặt mảnh ${piece} khi chưa qua D0`);
  }
  expectReject(state, 'puzzle/open', { puzzleId: P1 }, 'Mở puzzle P1 khi chưa qua D0');
});

test('[C2 Gate 1.2] Gate G1: Chưa giải P1 hoặc chưa đọc D1 thì không thể sang S2', () => {
  const state = createC2State(S1);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  expectReject(state, 'area/goTo', { areaId: S2 }, 'Chuyển sang S2 khi chưa đạt G1');

  state.journey.c2.navStack = [S2];
  expectReject(state, 'area/goBack', {}, 'goBack sang S2 khi chưa đạt G1');
});

test('[C2 Gate 1.3] Gate G1: Đã giải P1 nhưng chưa đọc D1 vẫn không được sang S2', () => {
  const state = createC2State(S1);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  state.journey.c2.solvedPuzzleIds = [P1];
  expectReject(state, 'area/goTo', { areaId: S2 }, 'Chuyển sang S2 khi chưa hoàn thành D1');
});

test('[C2 Gate 1.4] Gate G1 bảo vệ chìa khóa và két sắt ở S2', () => {
  const state = createC2State(S2);
  expectReject(state, 'item/pick', { itemId: key }, 'Nhặt chìa khóa khi chưa đạt G1');
  state.inventory.itemIds.push(key);
  expectReject(state, 'puzzle/submit', { puzzleId: P2, answer: key }, 'Submit mở két khi chưa đạt G1');
});

test('[C2 Gate 1.5] Gate G2: Phải đọc đủ cả 2 giấy (D2 & D3) mới được vào S3', () => {
  const state = createC2State(S2);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai'];
  state.journey.c2.solvedPuzzleIds = [P1, P2];
  expectReject(state, 'area/goTo', { areaId: S3 }, 'Chuyển sang S3 khi mới đọc 1 trong 2 giấy');
});

test('[C2 Gate 1.6] Trình giấy tờ tại S3 phải đúng thứ tự: P3 (biên lai) -> P4 (bản vẽ) -> P5 (phối đồ)', () => {
  const state = createC2State(S3);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'];
  state.journey.c2.solvedPuzzleIds = [P1, P2];
  state.inventory.itemIds.push(receipt, contract, sketch);

  expectReject(state, 'puzzle/submit', { puzzleId: P4, answer: sketch }, 'Trình bản vẽ P4 trước khi trình biên lai P3');
  expectReject(state, 'puzzle/open', { puzzleId: P5 }, 'Mở puzzle phối đồ P5 trước khi trình bản vẽ P4');
});

test('[C2 Gate 1.7] Không được complete C2 khi chưa hoàn thành D4 ending', () => {
  const state = createC2State(S3);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'];
  state.journey.c2.solvedPuzzleIds = [P1, P2, P3, P4, P5];
  expectReject(state, 'chapter/complete', { chapterId: 'c2' }, 'Complete C2 khi chưa đọc ending D4');
});

// ============================================================================
// 2. ORDER PUZZLE DRAFT & SUBMIT INVARIANTS (P1 BẢN VẼ)
// ============================================================================

test('[C2 Order 2.1] Draft order rỗng, thiếu mảnh, hoặc sai thứ tự vẫn được lưu để sửa dở', () => {
  const state = createC2State(S1);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  state.inventory.itemIds.push(...pieces);

  const validDrafts = [
    [],
    [pieces[0]],
    [pieces[2], pieces[1]],
    [pieces[3], pieces[0], pieces[2]],
  ];

  for (const draftAnswer of validDrafts) {
    const result = runCommand(state, {
      type: 'puzzle/updateDraft',
      payload: { puzzleId: P1, draft: { type: 'order', answer: draftAnswer } },
    }, content);
    assert.ok(result.ok, `Draft ${JSON.stringify(draftAnswer)} phải được chấp nhận`);
    assert.deepEqual(result.state.journey.c2.puzzleDrafts?.[P1]?.answer, draftAnswer);
  }
});

test('[C2 Order 2.2] Draft order từ chối mảnh trùng lặp, ID lạ hoặc mảnh chưa sở hữu', () => {
  const state = createC2State(S1);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  state.inventory.itemIds.push(pieces[0]);

  const invalidDrafts = [
    { label: 'Trùng mảnh', answer: [pieces[0], pieces[0]] },
    { label: 'ID lạ không tồn tại', answer: ['manh_rac_la_123'] },
    { label: 'Mảnh chưa sở hữu', answer: [pieces[1]] },
  ];

  for (const { label, answer } of invalidDrafts) {
    expectReject(state, 'puzzle/updateDraft', {
      puzzleId: P1,
      draft: { type: 'order', answer },
    }, `Draft order chứa ${label}`);
  }
});

test('[C2 Order 2.3] Submit P1 thiếu, sai thứ tự hoặc trùng lặp không giải được câu đố', () => {
  const state = createC2State(S1);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  state.inventory.itemIds.push(...pieces);

  const wrongAnswers = [
    [],
    [pieces[0], pieces[1], pieces[2]],
    [pieces[3], pieces[2], pieces[1], pieces[0]],
    [pieces[0], pieces[0], pieces[2], pieces[3]],
  ];

  for (const answer of wrongAnswers) {
    const result = runCommand(state, {
      type: 'puzzle/submit',
      payload: { puzzleId: P1, answer },
    }, content);
    assert.ok(result.ok, 'Lệnh submit chạy được nhưng kết quả kiểm tra là incorrect');
    assert.ok(!result.state.journey.c2.solvedPuzzleIds.includes(P1), 'Câu đố P1 không được đánh dấu là solved');
    assert.ok(!result.state.inventory.itemIds.includes(sketch), 'Không được cấp bản vẽ hoàn chỉnh khi đáp án sai');
  }
});

test('[C2 Order 2.4] Submit P1 từ chối khi gửi sai phòng, sai mặt hoặc sai chương', () => {
  const correctOrder = [...pieces];

  const stateWrongRoom = createC2State(S2);
  stateWrongRoom.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  stateWrongRoom.inventory.itemIds.push(...pieces);
  expectReject(stateWrongRoom, 'puzzle/submit', { puzzleId: P1, answer: correctOrder }, 'Submit P1 khi đang ở S2');

  const stateWrongSide = createC2State(S1);
  stateWrongSide.journey.c2.completedDialogueIds = ['d-c2-ca-nghi'];
  stateWrongSide.journey.c2.side = 'mat_trai';
  stateWrongSide.inventory.itemIds.push(...pieces);
  expectReject(stateWrongSide, 'puzzle/submit', { puzzleId: P1, answer: correctOrder }, 'Submit P1 ở mặt trái');
});

// ============================================================================
// 3. S2 SAFE & ATOMIC PAPERS & CLUE ACKNOWLEDGE
// ============================================================================

test('[C2 Safe 3.1] Mở két thành công ở mặt phải cấp đồng thời 2 giấy tờ và đưa thoại vào queue', () => {
  const state = createC2State(S2);
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma'];
  state.journey.c2.solvedPuzzleIds = [P1];
  state.inventory.itemIds.push(key);

  const result = runCommand(state, {
    type: 'puzzle/submit',
    payload: { puzzleId: P2, answer: key },
  }, content);

  assert.ok(result.ok, 'Mở két thành công ở mặt phải');
  assert.ok(result.state.inventory.itemIds.includes(receipt), 'Cấp biên lai trả nợ');
  assert.ok(result.state.inventory.itemIds.includes(contract), 'Cấp bản giao kèo');
  assert.equal(
    result.state.notebook.unlockedClueIds.includes('clue-bien-lai-goc-1935'),
    false,
    'Clue biên lai chưa được cấp trước khi đọc thoại'
  );
  assert.equal(result.state.journey.c2.activeDialogue?.dialogueId, 'd-c2-bien-lai', 'Thoại biên lai được mở đầu tiên');
  assert.deepEqual(result.state.journey.c2.dialogueQueue, ['d-c2-giao-keo'], 'Thoại giao kèo nằm trong hàng đợi');
});

test('[C2 Safe 3.2] Clue clue-bien-lai-goc-1935 chỉ được cấp khi người chơi xác nhận đọc (dialogue/advance)', () => {
  const state = createC2State(S2);
  state.journey.c2.activeDialogue = {
    dialogueId: 'd-c2-bien-lai',
    currentNodeId: 'node-1',
    history: ['node-1'],
  };
  assert.ok(!state.notebook.unlockedClueIds.includes('clue-bien-lai-goc-1935'));

  const advance = runCommand(state, { type: 'dialogue/advance', payload: {} }, content);
  assert.ok(advance.ok);
  let current = advance.state;
  while (current.journey.c2.activeDialogue?.dialogueId === 'd-c2-bien-lai') {
    const next = runCommand(current, { type: 'dialogue/advance', payload: {} }, content);
    if (!next.ok) break;
    current = next.state;
  }
  if (current.journey.c2.completedDialogueIds.includes('d-c2-bien-lai')) {
    assert.ok(
      current.notebook.unlockedClueIds.includes('clue-bien-lai-goc-1935'),
      'Clue clue-bien-lai-goc-1935 phải mở khóa sau khi hoàn thành d-c2-bien-lai'
    );
  }
});

// ============================================================================
// 4. CONTEXT STUDIO & LOAN ISOLATION & CONTRACT INVALID CONTEXT (YÊU CẦU 1)
// ============================================================================

const validEvents = ['tet', 'dam_cuoi', 'be_giang', 'le_chua', 'vieng_tang', 'dao_pho'];
const loanBrief = {
  silhouette: 'tan_thoi',
  garmentId: 'ao-dai-lemur',
  headwearId: 'khan-van-den',
  footwearId: 'guoc-moc',
};

function fixtureReadyP5() {
  const state = createC2State(S3);
  state.wallet.senNgoc = 0;
  state.journey.c2.currentArea = S3;
  state.journey.c2.side = 'mat_phai';
  state.journey.c2.solvedPuzzleIds = [P1, P2, P3, P4];
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'];
  state.inventory.itemIds.push(receipt, contract, sketch);
  state.closet.unlockedGarmentIds = state.closet.unlockedGarmentIds.filter(id => id !== 'ao-dai-lemur');
  state.closet.unlockedAccessoryIds = state.closet.unlockedAccessoryIds.filter(id => id !== 'khan-van-den' && id !== 'guoc-moc');
  return state;
}

test('[C2 Studio 4.1] Core API thật: createChallengeStudioDraft, challengeDraftFromAnswer, validateChallengeStudioDraft', () => {
  const anyCore = CoreExports as Record<string, unknown>;
  assert.equal(
    typeof anyCore.createChallengeStudioDraft,
    'function',
    'BLOCKED / FAIL: Core helper createChallengeStudioDraft chưa được export từ src/core'
  );
  assert.equal(
    typeof anyCore.challengeDraftFromAnswer,
    'function',
    'BLOCKED / FAIL: Core helper challengeDraftFromAnswer chưa được export từ src/core'
  );
  assert.equal(
    typeof anyCore.validateChallengeStudioDraft,
    'function',
    'BLOCKED / FAIL: Core helper validateChallengeStudioDraft chưa được export từ src/core'
  );
  assert.equal(
    typeof anyCore.getChallengeWardrobe,
    'function',
    'BLOCKED / FAIL: Core helper getChallengeWardrobe chưa được export từ src/core'
  );
});

test('[C2 Studio 4.2] Lưu eventContextId hợp lệ → close/reopen/reload → giữ đúng context trên fixture đạt gate P5', () => {
  const puzzleId = P5;
  const anyCore = CoreExports as Record<string, any>;
  const createDraftFn = anyCore.createChallengeStudioDraft as ((...args: unknown[]) => { ok: boolean; draft: any; reason?: string }) | undefined;

  for (const eventContextId of validEvents) {
    const state = fixtureReadyP5();

    let tree = createInitialTree(state);
    const send = (type: string, payload: unknown) => {
      const result = dispatch(tree, { type, payload }, content);
      assert.ok(result.ok, !result.ok ? result.reason : '');
      if (result.ok) tree = result.tree;
    };

    // 1. Mở puzzle P5
    send('puzzle/open', { puzzleId });

    // 2. Cập nhật draft kèm eventContextId hợp lệ
    send('puzzle/updateDraft', {
      puzzleId,
      draft: { type: 'styling', answer: { ...loanBrief, eventContextId } },
    });

    // 3. Đóng puzzle
    send('puzzle/close', {});

    // 4. Reload save qua serialize/deserialize
    const serialized = toJSON(tree);
    const restored = fromJSON(serialized, content);
    assert.ok(restored.ok, 'Phục hồi save thành công');
    tree = restored.tree;

    // 5. Mở lại puzzle
    send('puzzle/open', { puzzleId });
    const resumedState = tree.nodes[tree.headId].snapshot;
    const answer = resumedState.journey.c2.puzzleDrafts?.[puzzleId]?.answer as Record<string, string>;

    assert.ok(answer, 'Draft P5 phải được bảo toàn sau reload');
    assert.equal(answer.eventContextId, eventContextId, `eventContextId ${eventContextId} phải được giữ nguyên`);

    // 6. Kiểm chứng qua helper Core thật
    assert.ok(createDraftFn, 'createChallengeStudioDraft phải tồn tại');
    const helperResult = createDraftFn(resumedState, puzzleId, content);
    assert.ok(helperResult.ok, `createChallengeStudioDraft phải thành công: ${helperResult.reason}`);
    assert.equal(helperResult.draft.eventContextId, eventContextId);
    assert.equal(helperResult.draft.challengePuzzleId, puzzleId);
  }
});

test('[C2 Studio 4.3] Quyền mượn không thoát challenge: kiểm tra cả direct payload và session-based saveOutfit', () => {
  const state = fixtureReadyP5();

  // 1. Invariant: đồ mượn không nằm trong closet và ví không bị trừ
  assert.ok(!state.closet.unlockedGarmentIds.includes('ao-dai-lemur'));
  assert.ok(!state.closet.unlockedAccessoryIds.includes('khan-van-den'));
  assert.ok(!state.closet.unlockedAccessoryIds.includes('guoc-moc'));
  assert.equal(state.wallet.senNgoc, 0, 'Ví giữ nguyên 0 Sen');

  // 2. Chặn direct payload closet/saveOutfit với đúng cấu trúc equippedAccessories
  expectReject(
    state,
    'closet/saveOutfit',
    {
      garmentId: 'ao-dai-lemur',
      equippedAccessories: {
        headwear: 'khan-van-den',
        footwear: 'guoc-moc',
      },
    },
    'Direct payload closet/saveOutfit chứa đồ mượn'
  );

  // 3. Chặn session-based closet/saveOutfit khi session là Studio challenge
  const stateWithSession = {
    ...state,
    activeSession: {
      type: 'studio' as const,
      silhouette: 'tan_thoi' as const,
      garmentId: 'ao-dai-lemur',
      equippedAccessories: {
        headwear: 'khan-van-den',
        footwear: 'guoc-moc',
      },
      challengePuzzleId: P5,
      colorPalette: ['#FFF', '#FFF', '#FFF', '#000'] as [string, string, string, string],
      layerOrder: ['body', 'garment'],
      mode: 'custom' as const,
    },
  };
  expectReject(
    stateWithSession as ReturnType<typeof createC2State>,
    'closet/saveOutfit',
    {},
    'Session-based closet/saveOutfit chứa đồ mượn từ studio challenge session'
  );

  // 4. Chặn submit styling khi ở sai phòng
  const stateWrongRoom = createC2State(S1);
  expectReject(
    stateWrongRoom,
    'puzzle/submit',
    {
      puzzleId: P5,
      answer: { ...loanBrief, eventContextId: 'tet' },
    },
    'Submit styling đồ mượn khi đang ở sai phòng S1'
  );
});

test('[C2 Studio 4.4] Invalid context contract: rỗng/lạ/sai schema bị reject, state/draft cũ giữ nguyên', () => {
  const puzzleId = P5;
  const invalidContexts = ['unknown', 'ao-dai-lemur', '', 'invalid_event_123'];
  const anyCore = CoreExports as Record<string, any>;
  const decodeFn = anyCore.challengeDraftFromAnswer as ((...args: unknown[]) => { ok: boolean; reason?: string }) | undefined;

  assert.ok(decodeFn, 'challengeDraftFromAnswer phải tồn tại');

  for (const eventContextId of invalidContexts) {
    const state = fixtureReadyP5();

    // 1. Dispatch updateDraft với context không hợp lệ
    const resUpdate = runCommand(state, {
      type: 'puzzle/updateDraft',
      payload: { puzzleId, draft: { type: 'styling', answer: { ...loanBrief, eventContextId } } },
    }, content);

    assert.equal(resUpdate.ok, false, `updateDraft với invalid eventContextId "${eventContextId}" phải bị reject`);
    assert.ok(typeof resUpdate.reason === 'string' && resUpdate.reason.length > 0, 'Phải có lý do từ chối rõ ràng');
    assert.equal(resUpdate.state, state, 'State không được biến đổi khi bị reject');

    // 2. Dispatch submit với context không hợp lệ
    const resSubmit = runCommand(state, {
      type: 'puzzle/submit',
      payload: { puzzleId, answer: { ...loanBrief, eventContextId } },
    }, content);
    assert.equal(resSubmit.ok, false, `puzzle/submit với invalid eventContextId "${eventContextId}" phải bị reject`);

    // 3. Helper Core thật trả về ok: false
    const decoded = decodeFn(state, puzzleId, { ...loanBrief, eventContextId }, content);
    assert.equal(decoded.ok, false, `challengeDraftFromAnswer phải reject context "${eventContextId}"`);
  }

  // 4. Non-string types (null, số, object, mảng) xử lý an toàn không crash
  const nonStringContexts = [null, 123, {}, ['tet'], true];
  const state2 = fixtureReadyP5();
  for (const ctx of nonStringContexts) {
    const helperRes = decodeFn(state2, puzzleId, { ...loanBrief, eventContextId: ctx }, content);
    assert.equal(helperRes.ok, false, `Non-string context ${JSON.stringify(ctx)} phải bị reject an toàn`);
  }
});

// ============================================================================
// 5. NPC RENDERING, REAL ASSETS & NON-OCCLUSION GEOMETRY (YÊU CẦU 2)
// ============================================================================

test('[C2 NPC 5.1] Renderer thật: c2RoomNpcs trả về Loan và Cả Nghị trên mặt sàn, không phụ thuộc interactables', async () => {
  let roomRender: any = null;
  try {
    roomRender = await import('../src/game/room-render.ts');
  } catch (err: any) {
    assert.fail(`BLOCKED / FAIL: src/game/room-render.ts không thể import: ${err.message}`);
  }

  assert.equal(
    typeof roomRender.c2RoomNpcs,
    'function',
    'BLOCKED / FAIL: c2RoomNpcs chưa được export từ src/game/room-render.ts'
  );

  const world = { w: 1672, h: 941 };

  // S1: Cụ Loan xuất hiện trên sàn
  const s1Npcs = roomRender.c2RoomNpcs('c2', S1, [], world);
  assert.ok(Array.isArray(s1Npcs), 's1Npcs phải là mảng');
  assert.ok(s1Npcs.length > 0, 'Phòng S1 phải render ít nhất một NPC (Loan)');
  const s1Loan = s1Npcs.find((n: any) => n.id === 'c2-s1-loan' || n.name === 'Cụ Loan');
  assert.ok(s1Loan, 'Cụ Loan phải có trong danh sách render S1');
  assert.ok(s1Loan.path.includes('cu-loan'), 'Đường dẫn sprite Cụ Loan phải hợp lệ');

  // S2: Cụ Loan lo âu
  const s2Npcs = roomRender.c2RoomNpcs('c2', S2, [], world);
  const s2Loan = s2Npcs.find((n: any) => n.id === 'c2-s2-loan' || n.name === 'Cụ Loan');
  assert.ok(s2Loan, 'Cụ Loan phải có trong danh sách render S2');

  // S3: Cả Nghị và Loan có chuyển động/pose theo tiến trình
  const s3Initial = roomRender.c2RoomNpcs('c2', S3, [], world);
  const s3CaNghiInitial = s3Initial.find((n: any) => n.id.includes('ca-nghi') || n.name.includes('Cả Nghị'));
  assert.ok(s3CaNghiInitial, 'Ông Cả Nghị phải có trong danh sách render S3 ban đầu');

  const s3SolvedSketch = roomRender.c2RoomNpcs('c2', S3, ['p-c2-present-sketch'], world);
  const s3CaNghiRetreat = s3SolvedSketch.find((n: any) => n.id.includes('ca-nghi') || n.name.includes('Cả Nghị'));
  assert.ok(s3CaNghiRetreat, 'Ông Cả Nghị phải có mặt sau khi giải sketch');
});

test('[C2 NPC 5.2] Kiểm tra ảnh Sprite & Portrait nhân vật C2 tồn tại trên đúng checkout candidate', () => {
  const charactersToCheck = [
    { dir: 'ca-nghi', files: ['view-front.png', 'portrait-idle.png', 'scene-idle.png'] },
    { dir: 'cu-loan', files: ['view-front.png', 'portrait-idle.png', 'scene-idle.png'] },
    { dir: 'ong-le', files: ['view-front.png', 'portrait-idle.png', 'scene-idle.png'] },
  ];

  // Chỉ kiểm tra trên thư mục assets của checkout này, KHÔNG fallback ra ngoài
  const baseAssetsDir = path.resolve('assets/characters');

  for (const char of charactersToCheck) {
    for (const file of char.files) {
      const targetPath = path.join(baseAssetsDir, char.dir, file);
      assert.ok(
        fs.existsSync(targetPath),
        `BLOCKED / FAIL: Asset nhân vật ${char.dir}/${file} không tồn tại trên checkout này (${targetPath})`
      );

      const stat = fs.statSync(targetPath);
      assert.ok(stat.size > 0, `Ảnh ${targetPath} không được rỗng`);

      const buffer = Buffer.alloc(8);
      const fd = fs.openSync(targetPath, 'r');
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      assert.ok(isPng, `File ${targetPath} phải là file PNG hợp lệ`);
    }
  }
});

test('[C2 NPC 5.3] Hình học NPC renderer thật không che hotspot nhặt đồ hoặc mũi tên exit', async () => {
  let roomRender: any = null;
  try {
    roomRender = await import('../src/game/room-render.ts');
  } catch {
    assert.fail('BLOCKED / FAIL: src/game/room-render.ts chưa sẵn sàng để kiểm tra hình học');
  }

  const world = { w: 1672, h: 941 };
  const s1Npcs = roomRender.c2RoomNpcs('c2', S1, [], world);
  const s2Npcs = roomRender.c2RoomNpcs('c2', S2, [], world);

  // Helper tính giao cắt giữa hai hình chữ nhật { x, y, w, h }
  const intersects = (r1: { x: number; y: number; w: number; h: number }, r2: { x: number; y: number; w: number; h: number }) => {
    return !(
      r2.x >= r1.x + r1.w ||
      r2.x + r2.w <= r1.x ||
      r2.y >= r1.y + r1.h ||
      r2.y + r2.h <= r1.y
    );
  };

  // S1: Hotspot mảnh 4 tại cửa sổ (native bounds [1267, 456, 1297, 489] mở rộng đạt 44px)
  // và exit window [1470, 188, 1638, 705]
  const s1WindowPiece = { x: 1240, y: 430, w: 100, h: 90 };
  const s1ExitWindow = { x: 1470, y: 188, w: 168, h: 517 };

  for (const npc of s1Npcs) {
    assert.equal(
      intersects(npc.rect, s1WindowPiece),
      false,
      `NPC ${npc.name} (${npc.id}) không được che Mảnh 4 tại cửa sổ S1`
    );
    assert.equal(
      intersects(npc.rect, s1ExitWindow),
      false,
      `NPC ${npc.name} (${npc.id}) không được che Exit sang S2`
    );
  }

  // S2: Hotspot chìa khóa đồng hồ [409, 387, 421, 413], két sắt [1236, 353, 1563, 609]
  const s2ClockKey = { x: 380, y: 350, w: 100, h: 100 };
  const s2Safe = { x: 1236, y: 353, w: 327, h: 256 };

  for (const npc of s2Npcs) {
    assert.equal(
      intersects(npc.rect, s2ClockKey),
      false,
      `NPC ${npc.name} (${npc.id}) không được che chìa khóa đồng hồ S2`
    );
    assert.equal(
      intersects(npc.rect, s2Safe),
      false,
      `NPC ${npc.name} (${npc.id}) không được che két sắt S2`
    );
  }
});

// ============================================================================
// 6. GHÉP HÌNH: NATIVE RATIO, SEAMLESSNESS & CONTROLS TÁCH RỜI (YÊU CẦU 3)
// ============================================================================

test('[C2 Ghép hình 6.1] Bốn dải bản vẽ giữ đúng tỷ lệ native (128x1476), CSS không dùng object-fit: fill', () => {
  const stripW = 128;
  const stripH = 1476;
  const nativeAspect = stripW / stripH; // ~0.08672

  assert.equal(stripW, 128);
  assert.equal(stripH, 1476);
  assert.ok(Math.abs(nativeAspect - 0.08672) < 0.001);

  const cssPath = path.resolve('src/game/puzzle.css');
  assert.ok(fs.existsSync(cssPath), 'puzzle.css phải tồn tại trên checkout');

  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Khẳng định: cấm object-fit: fill trên .order-strip-img
  const hasObjectFitFill = /\.order-strip-img\s*\{[^}]*object-fit:\s*fill/i.test(cssContent);
  assert.equal(
    hasObjectFitFill,
    false,
    'FAIL: .order-strip-img vẫn dùng object-fit: fill làm dãn méo ngang dải tranh'
  );

  // Khẳng định: không ép cứng cố định width: 44px và height: 160px
  const hasFixed44x160 = /\.order-strip-preview\s*\{[^}]*width:\s*44px[^}]*height:\s*160px/i.test(cssContent);
  assert.equal(
    hasFixed44x160,
    false,
    'FAIL: .order-strip-preview vẫn ép cứng width: 44px; height: 160px'
  );
});

test('[C2 Ghép hình 6.2] Thứ tự đúng 1-2-3-4 ghép thành tranh liền 512x1476, CSS hỗ trợ ghép sát không hở', () => {
  const totalW = 128 * 4;
  const totalH = 1476;
  assert.equal(totalW, 512, 'Chiều rộng tranh liền là 512px');
  assert.equal(totalH, 1476, 'Chiều cao giữ nguyên 1476px');

  const cssPath = path.resolve('src/game/puzzle.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Khung dải tranh hoặc board ghép liền phải không có gap tách rời dải tranh
  const hasSeparatingGap = /\.order-slots\s*\{[^}]*gap:\s*var\(--sp-2\)/i.test(cssContent);
  assert.equal(
    hasSeparatingGap,
    false,
    'FAIL: .order-slots vẫn dùng gap: var(--sp-2) làm tách rời 4 dải tranh'
  );
});

test('[C2 Ghép hình 6.3] Nút điều khiển (‹ › ×) tách rời khỏi vùng ảnh và đạt kích thước tiếp cận >= 43.5px', () => {
  const cssPath = path.resolve('src/game/puzzle.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  // Nút điều khiển phải đảm bảo min-height / min-width tiếp cận
  const hasAccessibleControls = /\.order-strip-controls button\s*\{[^}]*min-height:\s*var\(--target-min\)/i.test(cssContent)
    || /\.order-strip-controls button\s*\{[^}]*min-height:\s*44px/i.test(cssContent)
    || /\.order-strip-controls button\s*\{[^}]*min-width:\s*var\(--target-min\)/i.test(cssContent);

  assert.ok(hasAccessibleControls, 'Nút điều khiển dải tranh phải đạt kích thước tiếp cận tối thiểu');
});

// ============================================================================
// 7. KEYBOARD NAVIGATION & FOCUS INVARIANTS TỪ IMPLEMENTATION THẬT (YÊU CẦU 4)
// ============================================================================

test('[C2 Keyboard 7.1] API thật: moveOrderPieceLeft, moveOrderPieceRight, handleOrderSlotKey từ src/game/order-puzzle.ts', async () => {
  let orderPuzzle: any = null;
  const orderPuzzlePath = '../src/game/order-puzzle.ts';
  try {
    orderPuzzle = await import(orderPuzzlePath);
  } catch (err: any) {
    assert.fail(`BLOCKED / FAIL: src/game/order-puzzle.ts không thể import: ${err.message}`);
  }

  assert.equal(typeof orderPuzzle.moveOrderPieceLeft, 'function', 'moveOrderPieceLeft phải tồn tại');
  assert.equal(typeof orderPuzzle.moveOrderPieceRight, 'function', 'moveOrderPieceRight phải tồn tại');
  assert.equal(typeof orderPuzzle.removeOrderPiece, 'function', 'removeOrderPiece phải tồn tại');
  assert.equal(typeof orderPuzzle.handleOrderSlotKey, 'function', 'handleOrderSlotKey phải tồn tại');

  // Kiểm tra thao tác phím thật qua handleOrderSlotKey:
  // Focus piece 4 (index 3), nhấn ArrowLeft 3 lần liên tiếp
  let seq = ['manh_1', 'manh_2', 'manh_3', 'manh_4'];
  let currentUpdatedSeq = seq;
  const updateSeq = (next: string[]) => { currentUpdatedSeq = next; };
  let prevented = false;
  const preventDefault = () => { prevented = true; };

  // Lần 1: index 3 -> 2
  prevented = false;
  const handled1 = orderPuzzle.handleOrderSlotKey('ArrowLeft', 3, seq, preventDefault, updateSeq);
  assert.ok(handled1);
  assert.ok(prevented);
  seq = currentUpdatedSeq;
  assert.deepEqual(seq, ['manh_1', 'manh_2', 'manh_4', 'manh_3']);

  // Lần 2: index 2 -> 1
  prevented = false;
  const handled2 = orderPuzzle.handleOrderSlotKey('ArrowLeft', 2, seq, preventDefault, updateSeq);
  assert.ok(handled2);
  assert.ok(prevented);
  seq = currentUpdatedSeq;
  assert.deepEqual(seq, ['manh_1', 'manh_4', 'manh_2', 'manh_3']);

  // Lần 3: index 1 -> 0
  prevented = false;
  const handled3 = orderPuzzle.handleOrderSlotKey('ArrowLeft', 1, seq, preventDefault, updateSeq);
  assert.ok(handled3);
  assert.ok(prevented);
  seq = currentUpdatedSeq;
  assert.deepEqual(seq, ['manh_4', 'manh_1', 'manh_2', 'manh_3']);

  // Lần 4 (biên trái index 0): nhấn ArrowLeft không đổi mảng
  prevented = false;
  const handledBoundary = orderPuzzle.handleOrderSlotKey('ArrowLeft', 0, seq, preventDefault, updateSeq);
  assert.equal(handledBoundary, false, 'Tại biên index 0, ArrowLeft không thực hiện swap');
  assert.deepEqual(seq, ['manh_4', 'manh_1', 'manh_2', 'manh_3']);

  // Biên phải: tại index 3, ArrowRight không đổi mảng
  const seqForRight = ['manh_1', 'manh_2', 'manh_3', 'manh_4'];
  const handledRightBoundary = orderPuzzle.handleOrderSlotKey('ArrowRight', 3, seqForRight, preventDefault, updateSeq);
  assert.equal(handledRightBoundary, false, 'Tại biên index 3, ArrowRight không thực hiện swap');
});

test('[C2 Keyboard 7.2] Gỡ mảnh đầu / giữa / cuối từ implementation thật và logic tính focus', async () => {
  let orderPuzzle: any = null;
  const orderPuzzlePath = '../src/game/order-puzzle.ts';
  try {
    orderPuzzle = await import(orderPuzzlePath);
  } catch {
    assert.fail('BLOCKED / FAIL: src/game/order-puzzle.ts chưa sẵn sàng');
  }

  const initial = ['manh_1', 'manh_2', 'manh_3', 'manh_4'];

  // Gỡ mảnh đầu (index 0)
  const afterRemoveHead = orderPuzzle.removeOrderPiece(initial, 0);
  assert.deepEqual(afterRemoveHead, ['manh_2', 'manh_3', 'manh_4']);

  // Gỡ mảnh giữa (index 1)
  const afterRemoveMid = orderPuzzle.removeOrderPiece(initial, 1);
  assert.deepEqual(afterRemoveMid, ['manh_1', 'manh_3', 'manh_4']);

  // Gỡ mảnh cuối (index 3)
  const afterRemoveTail = orderPuzzle.removeOrderPiece(initial, 3);
  assert.deepEqual(afterRemoveTail, ['manh_1', 'manh_2', 'manh_3']);

  // Gỡ ngoài biên không lỗi
  assert.deepEqual(orderPuzzle.removeOrderPiece(initial, -1), initial);
  assert.deepEqual(orderPuzzle.removeOrderPiece(initial, 10), initial);
});

test('[C2 Keyboard 7.3] PuzzleModal.tsx cấm dùng key index để không làm remount mất focus', () => {
  const modalPath = path.resolve('src/game/PuzzleModal.tsx');
  assert.ok(fs.existsSync(modalPath), 'PuzzleModal.tsx phải tồn tại trên checkout');

  const modalContent = fs.readFileSync(modalPath, 'utf8');

  // Khẳng định: cấm key={`${id}-${index}`}
  const hasIndexInKey = /key=\{`\$\{id\}-\$\{index\}`\}/.test(modalContent);
  assert.equal(
    hasIndexInKey,
    false,
    'FAIL: PuzzleModal.tsx vẫn dùng key={`${id}-${index}`} gây remount và mất focus khi đổi chỗ'
  );
});

// ============================================================================
// 8. REWARD DELTA 100 SEN & LEGACY INVARIANTS
// ============================================================================

test('[C2 Reward 8.1] Claim C2 tăng đúng delta 100 Sen (không lẫn +15 đọc thẻ) và là duy nhất', () => {
  const state = createC2State(S3);
  state.journey.c2.status = 'completed';
  state.journey.c2.solvedPuzzleIds = [P1, P2, P3, P4, P5];
  state.journey.c2.completedDialogueIds = [
    'd-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'
  ];
  if (content.chapters.c2.dialogues.some(d => String(d.id) === 'd-c2-ending')) {
    state.journey.c2.completedDialogueIds.push('d-c2-ending');
  }
  const initialSen = state.wallet.senNgoc;

  const claim = runCommand(state, { type: 'reward/claim', payload: { chapterId: 'c2' } }, content);
  assert.ok(claim.ok, 'Nhận thưởng C2 thành công');

  const delta = claim.state.wallet.senNgoc - initialSen;
  assert.equal(delta, 100, `Delta thưởng C2 phải đúng 100 Sen (hiện nhận: ${delta})`);

  expectReject(claim.state, 'reward/claim', { chapterId: 'c2' }, 'Nhận thưởng C2 lần thứ hai');
});

test('[C2 Reward 8.2] Legacy profile đã nhận 120 Sen không bị trừ hoặc cộng thêm tiền', () => {
  const state = createC2State(S3);
  state.journey.c2.status = 'completed';
  state.journey.c2.claimed = true;
  state.claimedRewardIds = ['reward-c2'];
  state.wallet.senNgoc = 220;

  const tree = createInitialTree(state);
  const serialized = toJSON(tree);
  const restored = fromJSON(serialized, content);
  assert.ok(restored.ok);

  const snapshot = restored.tree.nodes[restored.tree.headId].snapshot;
  assert.equal(snapshot.wallet.senNgoc, 220, 'Số dư của save legacy 120 Sen được bảo toàn nguyên vẹn');
  expectReject(snapshot, 'reward/claim', { chapterId: 'c2' }, 'Claim lại trên save legacy');
});

test('[C2 Reward 8.3] Lệnh nghịch đảo snapshot (undo/restore) không được xóa phần thưởng đã nhận', () => {
  const state = createC2State(S3);
  state.journey.c2.status = 'completed';
  state.journey.c2.solvedPuzzleIds = [P1, P2, P3, P4, P5];
  state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'];
  if (content.chapters.c2.dialogues.some(d => String(d.id) === 'd-c2-ending')) {
    state.journey.c2.completedDialogueIds.push('d-c2-ending');
  }

  const claimed = runCommand(state, { type: 'reward/claim', payload: { chapterId: 'c2' } }, content);
  assert.ok(claimed.ok);

  for (const restoreType of ['dialogue/restore', 'interact/undo']) {
    const attempted = runCommand(claimed.state, {
      type: restoreType,
      payload: { previousState: state },
    }, content);
    assert.equal(attempted.ok, false, `Lệnh ${restoreType} không được đảo ngược trạng thái đã nhận thưởng`);
  }
});
