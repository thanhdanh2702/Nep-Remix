import test from 'node:test';
import assert from 'node:assert/strict';
import { registeredAssetUrls } from './assets';

test('runtime URLs exclude unregistered drafts while preserving registered C2 assets', () => {
  const known = 'assets/garments/ao-dai-lemur/ao-dai-lemur.png';
  const draft = 'assets/garments/ao-dai-raglan/ao-dai-raglan.png';
  assert.deepEqual(registeredAssetUrls({ [`../../${known}`]: '/lemur.png', [`../../${draft}`]: '/draft.png' }, [known]), { [known]: '/lemur.png' });
});
