import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventIdSchema } from '../content/schema.ts';
import { loadContent } from '../content/index.ts';
import { createInitialState, createInitialTree, dispatch, toJSON, fromJSON,
  createChallengeStudioDraft, challengeDraftFromAnswer, validateChallengeStudioDraft,
  runCommand } from './index.ts';

const content = loadContent();
const puzzleId = 'p-c2-styling-loan';
const brief = {silhouette:'tan_thoi',garmentId:'ao-dai-lemur',headwearId:'khan-van-den',footwearId:'guoc-moc'};
function ready() {
  const state = createInitialState(content); state.currentChapter='c2';state.wallet.senNgoc=0;
  Object.assign(state.journey.c2,{status:'in_progress',currentArea:'c2-s3-phong-trien-lam-doi-dau',
    solvedPuzzleIds:['p-c2-sketch-assemble','p-c2-safe-open','p-c2-present-receipt','p-c2-present-sketch'],
    completedDialogueIds:['d-c2-ca-nghi','d-c2-mat-ma','d-c2-bien-lai','d-c2-giao-keo']});
  state.closet.unlockedAccessoryIds=[];
  return state;
}

for(const eventContextId of EventIdSchema.options) test(`context ${eventContextId} survives persistent draft close/reopen/reload`,()=>{
  const initial=ready();let tree=createInitialTree(initial);
  const send=(type:string,payload:unknown)=>{const result=dispatch(tree,{type,payload},content);assert.ok(result.ok,!result.ok?result.reason:'');if(result.ok)tree=result.tree;};
  send('puzzle/open',{puzzleId});
  send('puzzle/updateDraft',{puzzleId,draft:{type:'styling',answer:{...brief,eventContextId}}});
  send('puzzle/close',{});
  const saved=toJSON(tree);const restored=fromJSON(saved,content);assert.ok(restored.ok);if(!restored.ok)return;
  tree=restored.tree;send('puzzle/open',{puzzleId});
  const state=tree.nodes[tree.headId].snapshot;
  const resumed=createChallengeStudioDraft(state,puzzleId,content);assert.ok(resumed.ok);if(!resumed.ok)return;
  assert.equal(resumed.draft.eventContextId,eventContextId);
  assert.equal(resumed.draft.challengePuzzleId,puzzleId);
  assert.equal(validateChallengeStudioDraft(state,puzzleId,resumed.draft,content).ok,true);
  assert.deepEqual(state.closet,initial.closet);assert.deepEqual(state.wallet,initial.wallet);
});

for(const eventContextId of ['unknown','ao-dai-lemur','']) test(`unknown event context ${JSON.stringify(eventContextId)} is an explicit error`,()=>{
  const state=ready();const answer={...brief,eventContextId};
  const decoded=challengeDraftFromAnswer(state,puzzleId,answer,content);
  assert.equal(decoded.ok,false);if(!decoded.ok)assert.match(decoded.reason,/event context/i);
  state.journey.c2.puzzleDrafts={[puzzleId]:{type:'styling',answer}};
  const resumed=createChallengeStudioDraft(state,puzzleId,content);assert.equal(resumed.ok,false);
  if(!resumed.ok)assert.match(resumed.reason,/event context/i);
  for(const command of [
    {type:'puzzle/updateDraft',payload:{puzzleId,draft:{type:'styling',answer}}},
    {type:'puzzle/submit',payload:{puzzleId,answer}},
  ]) {
    const result=runCommand(state,command,content);assert.equal(result.ok,false);assert.equal(result.state,state);
    if(!result.ok)assert.match(result.reason,/event context/i);
  }
});

test('missing context preserves old drafts; non-string context is rejected without throwing',()=>{
  const state=ready();const old=challengeDraftFromAnswer(state,puzzleId,brief,content);assert.ok(old.ok);
  if(old.ok)assert.equal(old.draft.eventContextId,undefined);
  for(const eventContextId of [null,3,{},['tet']]) {
    const result=challengeDraftFromAnswer(state,puzzleId,{...brief,eventContextId},content);
    assert.equal(result.ok,false);
  }
});

test('valid event context and client allowlist never authorize a foreign garment or wrong-room loan',()=>{
  const state=ready();
  assert.equal(challengeDraftFromAnswer(state,puzzleId,{...brief,eventContextId:'tet',
    garmentId:'ao-dai-tan-thoi-vang-mo-ga',allowedGarmentIds:'ao-dai-tan-thoi-vang-mo-ga'},content).ok,false);
  state.journey.c2.currentArea='c2-s1-gac-lung-ve-tranh';
  assert.equal(challengeDraftFromAnswer(state,puzzleId,{...brief,eventContextId:'tet',challengePuzzleId:puzzleId},content).ok,false);
});

test('local context and selectEvent commands reject unknown IDs and preserve valid event changes',()=>{
  const state=ready();const made=createChallengeStudioDraft(state,puzzleId,content);assert.ok(made.ok);if(!made.ok)return;
  assert.equal(validateChallengeStudioDraft(state,puzzleId,{...made.draft,eventContextId:'unknown'},content).ok,false);
  state.activeSession=made.draft;
  const invalid=runCommand(state,{type:'studio/selectEvent',payload:{eventId:'unknown'}},content);
  assert.equal(invalid.ok,false);assert.equal(invalid.state,state);
  const valid=runCommand(state,{type:'studio/selectEvent',payload:{eventId:'tet'}},content);assert.ok(valid.ok);
  if(valid.ok&&valid.state.activeSession?.type==='studio') {
    assert.equal(valid.state.activeSession.eventContextId,'tet');
    assert.equal(valid.state.activeSession.challengePuzzleId,puzzleId);
    assert.equal(validateChallengeStudioDraft(valid.state,puzzleId,valid.state.activeSession,content).ok,true);
  }
});
