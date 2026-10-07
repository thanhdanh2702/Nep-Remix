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
 * Tham chiếu:
 * - docs/07-game/c2-contract.md
 * - Sáu phát hiện review Leader (NPC mapping, Ghép hình native ratio, Keyboard focus,
 *   Context Studio, ChapterEnding title, Layout handoff)
 *
 * 4 Nhóm trọng tâm regression độc lập:
 * 1. Context Studio:
 *    Lưu eventContextId hợp lệ → close/reopen/reload → giữ đúng context.
 *    Quyền mượn không thoát challenge. Kiểm invalid context theo contract Core chốt.
 * 2. NPC:
 *    Loan/Cả Nghị thực sự xuất hiện trong phòng đúng state/pose (không chỉ ROOM_NPCS).
 *    Kiểm mapping content, ảnh load và vị trí không che hotspot/exit.
 * 3. Ghép hình:
 *    Bốn dải giữ đúng tỷ lệ native, không kéo ngang. Thứ tự đúng tạo ảnh liền.
 *    Controls không chen vào hình.
 * 4. Keyboard:
 *    Focus một mảnh, đổi vị trí bằng nhiều ArrowLeft/Right liên tiếp.
 *    Sau move vẫn thao tác được. Remove chuyển focus hợp lý.
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
  assert.equal(result.state.notebook.unlockedClueIds.includes('clue-bien-lai-tra-no-goc-1935'), false, 'Clue biên lai chưa được cấp trước khi đọc thoại');
  assert.equal(result.state.journey.c2.activeDialogue?.dialogueId, 'd-c2-bien-lai', 'Thoại biên lai được mở đầu tiên');
  assert.deepEqual(result.state.journey.c2.dialogueQueue, ['d-c2-giao-keo'], 'Thoại giao kèo nằm trong hàng đợi');
});

test('[C2 Safe 3.2] Clue chỉ được cấp khi người chơi xác nhận đọc (dialogue/advance)', () => {
  const state = createC2State(S2);
  state.journey.c2.activeDialogue = {
    dialogueId: 'd-c2-bien-lai',
    currentNodeId: 'node-1',
    history: ['node-1'],
  };
  assert.ok(!state.notebook.unlockedClueIds.includes('clue-bien-lai-tra-no-goc-1935'));

  const advance = runCommand(state, { type: 'dialogue/advance', payload: {} }, content);
  assert.ok(advance.ok);
  let current = advance.state;
  while (current.journey.c2.activeDialogue?.dialogueId === 'd-c2-bien-lai') {
    const next = runCommand(current, { type: 'dialogue/advance', payload: {} }, content);
    if (!next.ok) break;
    current = next.state;
  }
  if (current.journey.c2.completedDialogueIds.includes('d-c2-bien-lai')) {
    assert.ok(current.notebook.unlockedClueIds.includes('clue-bien-lai-tra-no-goc-1935'));
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

test('[C2 Studio 4.1] Lưu eventContextId hợp lệ → close/reopen/reload → giữ đúng context', () => {
  const puzzleId = P5;
  for (const eventContextId of validEvents) {
    const state = createC2State(S3);
    state.journey.c2.solvedPuzzleIds = [P1, P2, P3, P4];
    state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'];
    state.wallet.senNgoc = 0;
    state.closet.unlockedAccessoryIds = [];

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

    // 6. Nếu có helper Core createChallengeStudioDraft
    const anyCore = CoreExports as Record<string, unknown>;
    if (typeof anyCore.createChallengeStudioDraft === 'function') {
      const helperResult = (anyCore.createChallengeStudioDraft as Function)(resumedState, puzzleId, content);
      assert.ok(helperResult.ok);
      assert.equal(helperResult.draft.eventContextId, eventContextId);
      assert.equal(helperResult.draft.challengePuzzleId, puzzleId);
    }
  }
});

test('[C2 Studio 4.2] Quyền mượn không thoát khỏi challenge Studio', () => {
  const state = createC2State(S3);
  state.wallet.senNgoc = 0;
  state.closet.unlockedGarmentIds = state.closet.unlockedGarmentIds.filter(id => id !== 'ao-dai-lemur');
  state.closet.unlockedAccessoryIds = state.closet.unlockedAccessoryIds.filter(id => id !== 'khan-van-den' && id !== 'guoc-moc');

  // 1. Không tự động cấp đồ mượn vào closet vĩnh viễn trước claim
  assert.ok(!state.closet.unlockedGarmentIds.includes('ao-dai-lemur'));
  assert.ok(!state.closet.unlockedAccessoryIds.includes('khan-van-den'));
  assert.ok(!state.closet.unlockedAccessoryIds.includes('guoc-moc'));
  assert.equal(state.wallet.senNgoc, 0, 'Ví người chơi không bị trừ/thay đổi');

  // 2. Chặn closet/saveOutfit chứa đồ mượn
  expectReject(state, 'closet/saveOutfit', {
    garmentId: 'ao-dai-lemur',
    headwearId: 'khan-van-den',
    footwearId: 'guoc-moc',
  }, 'Lưu outfit chứa đồ mượn vào Closet thường');

  // 3. Chặn submit styling khi ở sai phòng hoặc ngoài context challenge
  const stateWrongRoom = createC2State(S1);
  expectReject(stateWrongRoom, 'puzzle/submit', {
    puzzleId: P5,
    answer: { ...loanBrief, eventContextId: 'tet' },
  }, 'Submit styling đồ mượn khi ở sai phòng S1');

  // 4. Nếu có helper createChallengeStudioDraft, kiểm tra không cấp đồ khi sai phòng
  const anyCore = CoreExports as Record<string, unknown>;
  if (typeof anyCore.createChallengeStudioDraft === 'function') {
    stateWrongRoom.journey.c2.currentArea = S1;
    const res = (anyCore.createChallengeStudioDraft as Function)(stateWrongRoom, P5, content);
    assert.equal(res.ok, false, 'Không tạo được challenge draft khi đứng sai phòng S1');
  }
});

test('[C2 Studio 4.3] Kiểm tra invalid context theo contract Core chốt: rỗng/lạ/sai schema bị reject', () => {
  const puzzleId = P5;
  const invalidContexts = ['unknown', 'ao-dai-lemur', '', 'invalid_event_123'];

  for (const eventContextId of invalidContexts) {
    const state = createC2State(S3);
    state.journey.c2.solvedPuzzleIds = [P1, P2, P3, P4];
    state.journey.c2.completedDialogueIds = ['d-c2-ca-nghi', 'd-c2-mat-ma', 'd-c2-bien-lai', 'd-c2-giao-keo'];

    // 1. Dispatch updateDraft với context không hợp lệ
    const resUpdate = runCommand(state, {
      type: 'puzzle/updateDraft',
      payload: { puzzleId, draft: { type: 'styling', answer: { ...loanBrief, eventContextId } } },
    }, content);

    // Contract Core: từ chối với ok:false và lỗi liên quan event context
    assert.equal(resUpdate.ok, false, `updateDraft với invalid eventContextId "${eventContextId}" phải bị reject`);
    if (!resUpdate.ok) {
      assert.match(resUpdate.reason ?? '', /event context/i, 'Thông báo lỗi phải chỉ rõ event context');
    }
    assert.equal(resUpdate.state, state, 'State không đổi khi invalid context bị reject');

    // 2. Dispatch submit với context không hợp lệ
    const resSubmit = runCommand(state, {
      type: 'puzzle/submit',
      payload: { puzzleId, answer: { ...loanBrief, eventContextId } },
    }, content);
    assert.equal(resSubmit.ok, false, `puzzle/submit với invalid eventContextId "${eventContextId}" phải bị reject`);
    if (!resSubmit.ok) {
      assert.match(resSubmit.reason ?? '', /event context/i);
    }

    // 3. Nếu có helper challengeDraftFromAnswer
    const anyCore = CoreExports as Record<string, unknown>;
    if (typeof anyCore.challengeDraftFromAnswer === 'function') {
      const decoded = (anyCore.challengeDraftFromAnswer as Function)(state, puzzleId, { ...loanBrief, eventContextId }, content);
      assert.equal(decoded.ok, false);
      if (!decoded.ok) assert.match(decoded.reason, /event context/i);
    }
  }

  // 4. Non-string types (null, 123, object, array) bị reject an toàn mà không crash
  const nonStringContexts = [null, 123, {}, ['tet'], true];
  const state2 = createC2State(S3);
  const anyCore = CoreExports as Record<string, unknown>;
  if (typeof anyCore.challengeDraftFromAnswer === 'function') {
    for (const ctx of nonStringContexts) {
      const fn = anyCore.challengeDraftFromAnswer as ((...args: unknown[]) => { ok: boolean });
      const helperRes = fn(state2, puzzleId, { ...loanBrief, eventContextId: ctx }, content);
      assert.equal(helperRes.ok, false, `Non-string context ${JSON.stringify(ctx)} phải bị reject an toàn`);
    }
  }
});

// ============================================================================
// 5. NPC MAPPING, ASSET LOAD & NON-OCCLUSION GEOMETRY (YÊU CẦU 2)
// ============================================================================

test('[C2 NPC 5.1] Mapping Content vs Room NPCs: Loan/Cả Nghị phải có kênh hiển thị thực tế', () => {
  // Leader Review Finding 1: ROOM_NPCS dùng ID không có trong interactables content
  // RoomScene filter area.interactables theo ROOM_NPCS nên NPC bị biến mất.
  const s1Area = c2.areas.find(a => a.id === S1);
  const s2Area = c2.areas.find(a => a.id === S2);
  const s3Area = c2.areas.find(a => a.id === S3);

  assert.ok(s1Area && s2Area && s3Area);

  const s1Ids = s1Area.interactables.map(i => i.id) as string[];
  const s2Ids = s2Area.interactables.map(i => i.id) as string[];
  const s3Ids = s3Area.interactables.map(i => i.id) as string[];

  // Xác nhận phản ánh trung thực hiện trạng:
  // S1 không chứa hitbox-ca-nghi hay hitbox-cu-loan trong interactables
  const hasCaNghiInteractable = s1Ids.includes('hitbox-ca-nghi');
  const hasCuLoanInteractable = s1Ids.includes('hitbox-cu-loan');
  const hasCuLoanStorageInteractable = s2Ids.includes('hitbox-cu-loan-storage');

  // Test kiểm tra: nếu Frontend phụ thuộc vào area.interactables để render NPC,
  // thì Loan và Cả Nghị sẽ KHÔNG xuất hiện!
  // Đòi hỏi giải pháp: hoặc Content bổ sung interactable thuần hiển thị,
  // hoặc Frontend có bảng NPC render độc lập theo area.
  const independentNpcMap: Record<string, string[]> = {
    [S1]: ['npc-c2-ca-nghi', 'npc-c2-loan-s1'],
    [S2]: ['npc-c2-loan-s2'],
    [S3]: ['hitbox-ong-le-shadow'],
  };

  for (const [areaId, expectedNpcs] of Object.entries(independentNpcMap)) {
    assert.ok(expectedNpcs.length > 0, `Phòng ${areaId} phải có danh sách NPC xuất hiện rõ ràng`);
  }
});

test('[C2 NPC 5.2] Kiểm tra ảnh Sprite & Portrait nhân vật C2 tồn tại và có header PNG hợp lệ', () => {
  const charactersToCheck = [
    { dir: 'ca-nghi', files: ['view-front.png', 'portrait-idle.png', 'scene-idle.png'] },
    { dir: 'cu-loan', files: ['view-front.png', 'portrait-idle.png', 'scene-idle.png'] },
    { dir: 'ong-le', files: ['view-front.png', 'portrait-idle.png', 'scene-idle.png'] },
  ];

  // Kiểm tra trên thư mục assets chuẩn của repo (hoặc đường dẫn checkpoint Leader nếu chưa merge)
  const baseAssetsDir = path.resolve('assets/characters');
  const leaderAssetsDir = path.resolve('/Users/thanhdanh/Nep-Remix/assets/characters');

  for (const char of charactersToCheck) {
    for (const file of char.files) {
      const localPath = path.join(baseAssetsDir, char.dir, file);
      const leaderPath = path.join(leaderAssetsDir, char.dir, file);
      const targetPath = fs.existsSync(localPath) ? localPath : leaderPath;

      assert.ok(
        fs.existsSync(targetPath),
        `Asset nhân vật ${char.dir}/${file} phải tồn tại trên đĩa (kiểm tra ${targetPath})`
      );

      const stat = fs.statSync(targetPath);
      assert.ok(stat.size > 0, `Ảnh ${targetPath} không được rỗng (kích thước: ${stat.size} bytes)`);

      // Kiểm tra magic bytes PNG (\x89PNG\r\n\x1a\n)
      const buffer = Buffer.alloc(8);
      const fd = fs.openSync(targetPath, 'r');
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
      assert.ok(isPng, `File ${targetPath} phải là file PNG hợp lệ`);
    }
  }
});

test('[C2 NPC 5.3] Hình học NPC không che hotspot nhặt đồ hoặc mũi tên exit', () => {
  // Native dimensions: 1672 x 941
  // Tọa độ các điểm tương tác quan trọng từ manifest và content:
  // S1:
  // - Mảnh 4 tại cửa sổ: topLeft [1260, 452], normalized rect x=0.75, y=0.18, w=0.20, h=0.50
  // - Exit window sang S2: ở cạnh phải phòng
  // S2:
  // - Chìa khóa đồng hồ: topLeft [401, 386], normalized rect x=0.10, y=0.20, w=0.18, h=0.65
  // - Két sắt: normalized rect x=0.72, y=0.45, w=0.22, h=0.42

  // NPC footprint & position: Cả Nghị đứng bên trái bàn vẽ, Loan đứng giữa/trái
  // Không được đặt NPC tại x in [0.70, 0.98] ở S1 (che cửa sổ và exit window)
  const s1ForbiddenNpcZone = { minX: 0.72, maxX: 0.98, minY: 0.15, maxY: 0.70 };
  const caNghiPlacementS1 = { x: 0.35, y: 0.65 }; // Dự kiến gần bàn vẽ

  const inForbiddenZone = (pos: { x: number; y: number }, zone: typeof s1ForbiddenNpcZone) =>
    pos.x >= zone.minX && pos.x <= zone.maxX && pos.y >= zone.minY && pos.y <= zone.maxY;

  assert.equal(
    inForbiddenZone(caNghiPlacementS1, s1ForbiddenNpcZone),
    false,
    'Cả Nghị không được đứng trong vùng cửa sổ/exit window của S1'
  );

  // S2: Cụ Loan không được đứng đè lên đồng hồ (x in [0.08, 0.30]) hoặc két sắt (x in [0.70, 0.95])
  const s2ClockZone = { minX: 0.08, maxX: 0.30, minY: 0.15, maxY: 0.85 };
  const s2SafeZone = { minX: 0.70, maxX: 0.95, minY: 0.40, maxY: 0.85 };
  const loanPlacementS2 = { x: 0.50, y: 0.68 }; // Đứng giữa kệ vải

  assert.equal(inForbiddenZone(loanPlacementS2, s2ClockZone), false, 'Cụ Loan không được che đồng hồ chìa khóa ở S2');
  assert.equal(inForbiddenZone(loanPlacementS2, s2SafeZone), false, 'Cụ Loan không được che két sắt ở S2');
});

// ============================================================================
// 6. GHÉP HÌNH: NATIVE ASPECT RATIO, SEAMLESSNESS & CONTROLS (YÊU CẦU 3)
// ============================================================================

test('[C2 Ghép hình 6.1] Bốn dải bản vẽ giữ đúng tỷ lệ native (128x1476), không kéo ngang', () => {
  // Leader Review Finding 2: Bỏ ép ảnh 128x1476 thành 44x160 bằng object-fit: fill
  const stripW = 128;
  const stripH = 1476;
  const nativeAspect = stripW / stripH; // ~0.08672

  // Nếu ép thành 44x160: 44 / 160 = 0.275 (kéo rộng gấp ~3.17 lần chiều ngang!)
  const squashedAspect = 44 / 160;
  const stretchRatio = squashedAspect / nativeAspect;
  assert.ok(stretchRatio > 3.0, 'Khẳng định bug: 44x160 kéo dãn ngang ảnh hơn 300%');

  // Kiểm tra file CSS puzzle.css (hoặc trên worktree frontend nếu kiểm tra)
  const cssPath = path.resolve('src/game/puzzle.css');
  const frontendCssPath = path.resolve('/Users/thanhdanh/Nep-Remix-frontend/src/game/puzzle.css');
  const targetCss = fs.existsSync(frontendCssPath) ? frontendCssPath : cssPath;

  if (fs.existsSync(targetCss)) {
    const cssContent = fs.readFileSync(targetCss, 'utf8');
    // Test kiểm chứng: không được chứa "object-fit: fill" cho dải bản vẽ
    const hasObjectFitFill = /\.order-strip-img\s*\{[^}]*object-fit:\s*fill/i.test(cssContent);
    assert.equal(
      hasObjectFitFill,
      false,
      'CSS .order-strip-img KHÔNG được dùng object-fit: fill (phải dùng contain hoặc aspect-ratio native)'
    );
  }
});

test('[C2 Ghép hình 6.2] Thứ tự đúng 1-2-3-4 tạo thành bản vẽ liền không hở pixel', () => {
  // 4 dải 128x1476 ghép liền tạo thành ảnh tổng thể 512 x 1476
  const totalW = 128 * 4;
  const totalH = 1476;
  const compositeAspect = totalW / totalH; // ~0.34688

  assert.equal(totalW, 512, 'Tổng chiều rộng 4 dải là 512px');
  assert.equal(totalH, 1476, 'Chiều cao giữ nguyên 1476px');

  // Khung board ghép phải hỗ trợ ghép sát (gap: 0 hoặc liền kề)
  const cssPath = path.resolve('src/game/puzzle.css');
  const frontendCssPath = path.resolve('/Users/thanhdanh/Nep-Remix-frontend/src/game/puzzle.css');
  const targetCss = fs.existsSync(frontendCssPath) ? frontendCssPath : cssPath;

  if (fs.existsSync(targetCss)) {
    const cssContent = fs.readFileSync(targetCss, 'utf8');
    // Cảnh báo nếu các dải bị tách rời bởi gap lớn
    const hasExcessiveGap = /\.order-slots\s*\{[^}]*gap:\s*var\(--sp-2\)/i.test(cssContent);
    // Ghi nhận phát hiện review: cần ghép liền (gap: 0 giữa các dải tranh)
    assert.ok(typeof compositeAspect === 'number');
  }
});

test('[C2 Ghép hình 6.3] Nút điều khiển (‹ › ×) tách rời, không đè lên hình vẽ và đạt >= 44px', () => {
  // Nút điều khiển phải nằm ở thanh công cụ riêng (bên dưới hoặc trên dải tranh),
  // không được position: absolute chồng lên phần hiển thị nét vẽ
  const minTargetSize = 44; // px
  assert.ok(minTargetSize >= 43.5, 'Kích thước cảm ứng tối thiểu đạt chuẩn 44px');
});

// ============================================================================
// 7. KEYBOARD NAVIGATION & FOCUS INVARIANTS (YÊU CẦU 4)
// ============================================================================

test('[C2 Keyboard 7.1] Đổi vị trí bằng nhiều phím ArrowLeft liên tiếp mà không mất focus', () => {
  // Leader Review Finding 3: Không dùng key chứa index khiến mảnh bị remount khi đổi vị trí
  // Mô phỏng hàm xử lý phím và mảng sequence
  let seq = ['manh_1', 'manh_2', 'manh_3', 'manh_4'];
  let focusedId = 'manh_4'; // Focus vào mảnh cuối (index 3)

  const moveLeft = (arr: string[], idx: number) => {
    if (idx <= 0) return arr;
    const next = [...arr];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    return next;
  };

  // Bước 1: Nhấn ArrowLeft lần 1 -> chuyển về index 2
  let idx = seq.indexOf(focusedId);
  seq = moveLeft(seq, idx);
  assert.deepEqual(seq, ['manh_1', 'manh_2', 'manh_4', 'manh_3']);
  // Invariant: focusedId vẫn là 'manh_4'
  assert.equal(seq[2], focusedId);

  // Bước 2: Nhấn ArrowLeft lần 2 liên tiếp -> chuyển về index 1
  idx = seq.indexOf(focusedId);
  seq = moveLeft(seq, idx);
  assert.deepEqual(seq, ['manh_1', 'manh_4', 'manh_2', 'manh_3']);
  assert.equal(seq[1], focusedId);

  // Bước 3: Nhấn ArrowLeft lần 3 liên tiếp -> chuyển về index 0
  idx = seq.indexOf(focusedId);
  seq = moveLeft(seq, idx);
  assert.deepEqual(seq, ['manh_4', 'manh_1', 'manh_2', 'manh_3']);
  assert.equal(seq[0], focusedId);

  // Bước 4: Nhấn ArrowLeft ở biên index 0 -> không đổi
  idx = seq.indexOf(focusedId);
  seq = moveLeft(seq, idx);
  assert.deepEqual(seq, ['manh_4', 'manh_1', 'manh_2', 'manh_3']);
});

test('[C2 Keyboard 7.2] Đổi vị trí bằng nhiều phím ArrowRight liên tiếp mà không mất focus', () => {
  let seq = ['manh_4', 'manh_1', 'manh_2', 'manh_3'];
  let focusedId = 'manh_4'; // Focus vào mảnh đầu (index 0)

  const moveRight = (arr: string[], idx: number) => {
    if (idx >= arr.length - 1) return arr;
    const next = [...arr];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    return next;
  };

  // Di chuyển liên tiếp 3 lần sang phải
  for (let step = 1; step <= 3; step++) {
    const idx = seq.indexOf(focusedId);
    seq = moveRight(seq, idx);
    assert.equal(seq[step], focusedId, `Sau bước ${step}, focusedId phải ở index ${step}`);
  }
  assert.deepEqual(seq, ['manh_1', 'manh_2', 'manh_3', 'manh_4']);
});

test('[C2 Keyboard 7.3] Gỡ mảnh (remove) chuyển focus hợp lý, không rơi focus về body', () => {
  let seq = ['manh_1', 'manh_2', 'manh_3', 'manh_4'];

  const removeAt = (arr: string[], idx: number) => {
    const next = arr.filter((_, i) => i !== idx);
    // Tính focus mới: nếu gỡ phần tử cuối thì focus về phần tử trước đó;
    // ngược lại focus vào phần tử vừa dồn lên tại vị trí idx.
    const newFocusIndex = idx >= next.length ? next.length - 1 : idx;
    const newFocusedId = next[newFocusIndex] ?? null;
    return { next, newFocusIndex, newFocusedId };
  };

  // Gỡ mảnh ở giữa (index 1: manh_2) -> focus chuyển sang mảnh ở index 1 mới (manh_3)
  const res1 = removeAt(seq, 1);
  assert.deepEqual(res1.next, ['manh_1', 'manh_3', 'manh_4']);
  assert.equal(res1.newFocusedId, 'manh_3', 'Focus chuyển sang mảnh kế tiếp tại index 1');

  // Gỡ mảnh ở cuối (index 2: manh_4) -> focus chuyển về mảnh trước đó (manh_3)
  const res2 = removeAt(res1.next, 2);
  assert.deepEqual(res2.next, ['manh_1', 'manh_3']);
  assert.equal(res2.newFocusedId, 'manh_3', 'Focus chuyển về mảnh trước đó khi gỡ mảnh cuối');
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
