import test from 'node:test';
import assert from 'node:assert/strict';
import * as assets from './assets';

test('runtime URLs exclude unregistered drafts while preserving registered C2 assets', () => {
  const filter = (assets as unknown as { registeredAssetUrls: (files: Record<string, string>, paths: string[]) => Record<string, string> }).registeredAssetUrls;
  assert.equal(typeof filter, 'function');
  const known = 'assets/garments/ao-dai-lemur/ao-dai-lemur.png';
  const draft = 'assets/garments/ao-dai-raglan/ao-dai-raglan.png';
  assert.deepEqual(filter({ [`../../${known}`]: '/lemur.png', [`../../${draft}`]: '/draft.png' }, [known]), { [known]: '/lemur.png' });
});
