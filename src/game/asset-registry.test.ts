import test from 'node:test';
import assert from 'node:assert/strict';
import { registeredAssetUrls } from './assets';
import { readFileSync, existsSync } from 'node:fs';
import assetMetadata from '../../data/runtime-assets.json';

test('runtime URLs exclude unregistered drafts while preserving registered C2 assets', () => {
  const known = 'assets/garments/ao-dai-lemur/ao-dai-lemur.png';
  const draft = 'assets/garments/ao-dai-raglan/ao-dai-raglan.png';
  assert.deepEqual(registeredAssetUrls({ [`../../${known}`]: '/lemur.png', [`../../${draft}`]: '/draft.png' }, [known]), { [known]: '/lemur.png' });
});

test('selectable hats have registered three-view wearable layers as well as shop icons', () => {
  for (const id of ['non-la', 'non-quai-thao']) {
    for (const suffix of ['', '--icon']) {
      const path = `assets/accessories/${id}/${id}${suffix}.png`;
      const meta = assetMetadata.find(entry => entry.path === path);
      assert.ok(meta, `Missing registered hat: ${path}`);
      assert.ok(existsSync(path));
      const png = readFileSync(path);
      assert.equal(png.readUInt32BE(16), suffix ? 48 : 528);
      assert.equal(png.readUInt32BE(20), suffix ? 48 : 416);
    }
  }
});
