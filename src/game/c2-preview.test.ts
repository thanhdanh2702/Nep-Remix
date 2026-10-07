import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('C2 playtest is available through normal chapter selection; C3–C5 stay unavailable', () => {
  const source = readFileSync(new URL('./Game.tsx', import.meta.url), 'utf8');
  const declaration = source.match(/const PLAYABLE:ChapterId\[\]=\[([^\]]+)\]/);
  assert.ok(declaration, 'chapter availability declaration must exist');
  const chapters = [...declaration[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(chapters, ['prologue', 'c1', 'c2']);
});
