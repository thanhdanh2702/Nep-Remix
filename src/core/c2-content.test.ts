import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content/index.ts';
import { ChapterContentSchema } from '../content/schema.ts';
const content = loadContent();
test('C2 strip labels reflect four fixed strips rather than invented anatomy or a code', () => {
  for (let i=1;i<=4;i++) assert.equal(content.itemsById.get(`manh_ban_ve_ao_dai_${i}`)?.name,`Mảnh bản vẽ ${i}`);
  for (const puzzle of content.chapters.c2.puzzles) {
    assert.doesNotMatch([puzzle.title,...puzzle.hints].join(' '),/xoay|lật vải|thanh khiết/i);
  }
});
test('C2 loan catalog and entry/ending references are validated without adding a sixth puzzle', () => {
  const chapter = structuredClone(content.chapters.c2);
  assert.equal(chapter.areas.length,3); assert.equal(chapter.puzzles.length,5);
  chapter.chapter.entryDialogueId = 'd-c1-gate-exit';
  assert.equal(ChapterContentSchema.safeParse(chapter).success,false);
  chapter.chapter.entryDialogueId = 'd-c2-ca-nghi';
  chapter.chapter.completionDialogueId = 'd-c1-gate-exit';
  assert.equal(ChapterContentSchema.safeParse(chapter).success,false);
  chapter.chapter.completionDialogueId = 'd-c2-ending';
  const puzzle = chapter.puzzles.find(p=>p.id==='p-c2-styling-loan')!;
  assert.equal(puzzle.type,'styling');
  if(puzzle.type!=='styling')return;
  assert.equal(ChapterContentSchema.safeParse({...chapter,puzzles:[...chapter.puzzles.filter(p=>p.id!==puzzle.id),{...puzzle,loanWardrobe:{garmentIds:['unknown'],accessoryIds:[]}}]}).success,false);
});
