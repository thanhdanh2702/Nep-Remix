import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content/index.ts';
import { createInitialState, createChallengeStudioDraft, getChallengeWardrobe,
  validateChallengeStudioDraft, runCommand, studioApplyPresetCommand, closetSaveOutfitCommand,
  createScopedSession, undoSession, redoSession, dispatchSession } from './index.ts';

const content = loadContent();
const P5 = 'p-c2-styling-loan';
function ready() {
  const state = createInitialState(content);
  state.currentChapter = 'c2'; state.wallet.senNgoc = 0;
  Object.assign(state.journey.c2, { status: 'in_progress', currentArea: 'c2-s3-phong-trien-lam-doi-dau',
    solvedPuzzleIds: ['p-c2-sketch-assemble','p-c2-safe-open','p-c2-present-receipt','p-c2-present-sketch'],
    completedDialogueIds: ['d-c2-ca-nghi','d-c2-mat-ma','d-c2-bien-lai','d-c2-giao-keo'] });
  state.closet.unlockedAccessoryIds = [];
  return state;
}
const answer = {silhouette:'tan_thoi',garmentId:'ao-dai-lemur',headwearId:'khan-van-den',footwearId:'guoc-moc'};
test('loan helper lends exact brief without changing ownership or money; creates context draft', () => {
  const state = ready(); const before = structuredClone(state);
  const wardrobe = getChallengeWardrobe(state,P5,content); assert.ok(wardrobe.ok);
  if (!wardrobe.ok) return;
  assert.deepEqual(wardrobe.borrowedGarmentIds,['ao-dai-lemur']);
  assert.deepEqual(wardrobe.borrowedAccessoryIds,['khan-van-den','guoc-moc']);
  const result = createChallengeStudioDraft(state,P5,content); assert.ok(result.ok);
  if (result.ok) { assert.equal(result.draft.challengePuzzleId,P5); assert.equal(result.draft.garmentId,'ao-dai-lemur'); }
  assert.deepEqual(state,before);
});
for (const invalid of ['chapter','room','side','gate','solved','nonstyling','unknown']) test(`loan context rejects ${invalid}`, () => {
  const state = ready(); let id = P5;
  if (invalid === 'chapter') state.currentChapter = 'prologue';
  if (invalid === 'room') state.journey.c2.currentArea = 'c2-s1-gac-lung-ve-tranh';
  if (invalid === 'side') state.journey.c2.side = 'mat_trai';
  if (invalid === 'gate') state.journey.c2.completedDialogueIds = [];
  if (invalid === 'solved') state.journey.c2.solvedPuzzleIds.push(P5);
  if (invalid === 'nonstyling') id = 'p-c2-present-sketch';
  if (invalid === 'unknown') id = 'unknown';
  assert.equal(getChallengeWardrobe(state,id,content).ok,false);
  assert.equal(createChallengeStudioDraft(state,id,content).ok,false);
});
test('borrowed designation excludes already owned catalog items', () => {
  const state = ready(); state.closet.unlockedGarmentIds.push('ao-dai-lemur');
  state.closet.unlockedAccessoryIds.push('khan-van-den');
  const result = getChallengeWardrobe(state,P5,content); assert.ok(result.ok);
  if (result.ok) {assert.deepEqual(result.borrowedGarmentIds,[]); assert.deepEqual(result.borrowedAccessoryIds,['guoc-moc']);}
});
test('challenge resume preserves strings/color/motif and rejects unauthorized saved choice', () => {
  const state = ready();
  state.journey.c2.puzzleDrafts = {[P5]:{type:'styling',answer:{...answer,color0:'#123456',color1:'#234567',color2:'#345678',color3:'#456789'}}};
  const result = createChallengeStudioDraft(state,P5,content); assert.ok(result.ok);
  if (result.ok) assert.deepEqual(result.draft.colorPalette,['#123456','#234567','#345678','#456789']);
  state.journey.c2.puzzleDrafts[P5] = {type:'styling',answer:{...answer,jewelryId:'unknown'}};
  assert.equal(createChallengeStudioDraft(state,P5,content).ok,false);
});
test('local undo/redo candidates revalidate when challenge gate is revoked', () => {
  const state = ready(); const made = createChallengeStudioDraft(state,P5,content); assert.ok(made.ok); if (!made.ok) return;
  const session = dispatchSession(createScopedSession(made.draft,'studio'), d => ({...d,colorPalette:['#1','#2','#3','#4']}));
  const undone = undoSession(session); assert.ok(undone.ok);
  assert.equal(validateChallengeStudioDraft(state,P5,undone.session.current,content).ok,true);
  state.journey.c2.solvedPuzzleIds.push(P5);
  assert.equal(validateChallengeStudioDraft(state,P5,redoSession(undone.session).session.current,content).ok,false);
});
test('challenge equip and preset accept loans, reject unknown or unowned extras, retain context', () => {
  const state = ready(); const made = createChallengeStudioDraft(state,P5,content); assert.ok(made.ok); if (!made.ok) return;
  state.activeSession = made.draft;
  const equip = runCommand(state,{type:'studio/equip',payload:{accessoryId:'khan-van-den'}},content); assert.ok(equip.ok);
  const preset = {...made.draft,equippedAccessories:{headwear:'khan-van-den',footwear:'guoc-moc'}};
  assert.equal(runCommand(state,{type:'studio/applyPreset',payload:{preset}},content).ok,true);
  assert.notEqual(studioApplyPresetCommand.guard(state,{preset:{...preset,equippedAccessories:{jewelry:'unknown'}}},content),true);
  state.journey.c2.completedDialogueIds = [];
  assert.equal(runCommand(state,{type:'studio/equip',payload:{accessoryId:'khan-van-den'}},content).ok,false);
});
test('direct styling validates every accessory independently of brief scoring', () => {
  const state = ready();
  for (const extra of [{jewelryId:'unknown'},{handheldId:'non-la'}]) {
    const result = runCommand(state,{type:'puzzle/submit',payload:{puzzleId:P5,answer:{...answer,...extra}}},content);
    assert.equal(result.ok,false); assert.equal(result.state,state);
  }
  const solved = runCommand(state,{type:'puzzle/submit',payload:{puzzleId:P5,answer}},content); assert.ok(solved.ok);
  assert.deepEqual(solved.state.closet,state.closet); assert.deepEqual(solved.state.wallet,state.wallet);
  assert.equal(solved.state.journey.c2.activeDialogue?.dialogueId,'d-c2-ending');
});
test('Closet guards reject borrowed garment/accessories in direct and session saves', () => {
  const state = ready(); const made = createChallengeStudioDraft(state,P5,content); assert.ok(made.ok); if (!made.ok) return;
  state.activeSession = made.draft;
  for (const payload of [{}, {garmentId:'ao-dai-lemur'}, {garmentId:'ao-tu-than',equippedAccessories:{headwear:'khan-van-den'}}]) {
    assert.notEqual(closetSaveOutfitCommand.guard(state,payload,content),true);
    assert.equal(runCommand(state,{type:'closet/saveOutfit',payload},content).ok,false);
  }
});
test('ordinary Studio rejects loan initial garment and unowned preset accessories at guard', () => {
  const state = ready();
  assert.equal(runCommand(state,{type:'studio/open',payload:{initialGarmentId:'ao-dai-lemur'}},content).ok,false);
  const opened = runCommand(state,{type:'studio/open',payload:{initialGarmentId:'ao-tu-than'}},content); assert.ok(opened.ok);
  if (!opened.ok || opened.state.activeSession?.type !== 'studio') return;
  assert.notEqual(studioApplyPresetCommand.guard(opened.state,{preset:{...opened.state.activeSession,equippedAccessories:{headwear:'khan-van-den'}}},content),true);
});
