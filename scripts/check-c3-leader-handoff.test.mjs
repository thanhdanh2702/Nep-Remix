import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const baseline = '077c05a90a747e2cdb41c590082488ebeda79257';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const before = path => JSON.parse(execFileSync('git', ['show', `${baseline}:${path}`], { encoding: 'utf8' }));
const manifest = read('assets/areas/chapter-3/manifest.json');

test('every production C3 image resolves through runtime metadata with original bytes and dimensions', () => {
  const metadata = read('data/runtime-assets.json');
  const byPath = new Map(metadata.map(entry => [entry.path, entry]));
  assert.equal(byPath.size, metadata.length, 'Duplicate runtime paths');
  for (const expected of manifest.assets) {
    const actual = byPath.get(expected.path);
    assert.ok(actual, `Unregistered C3 production asset: ${expected.path}`);
    const bytes = readFileSync(expected.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, expected.path);
    assert.equal(actual.sha256, expected.sha256, expected.path);
    assert.equal(actual.width, bytes.readUInt32BE(16), expected.path);
    assert.equal(actual.height, bytes.readUInt32BE(20), expected.path);
    assert.equal(actual.width, expected.width, expected.path);
    assert.equal(actual.height, expected.height, expected.path);
    assert.deepEqual(actual.bounds, expected.bounds, expected.path);
  }
});

test('registry retains all previous entries and adds only manifest production assets, never raw previews', () => {
  const old = before('data/runtime-assets.json');
  const current = read('data/runtime-assets.json');
  const byPath = new Map(current.map(entry => [entry.path, entry]));
  for (const entry of old) assert.deepEqual(byPath.get(entry.path), entry, entry.path);
  const oldPaths = new Set(old.map(entry => entry.path));
  const expected = manifest.assets.filter(entry => !oldPaths.has(entry.path)).map(entry => entry.path).sort();
  const added = current.filter(entry => !oldPaths.has(entry.path)).map(entry => entry.path).sort();
  assert.equal(expected.length, 51);
  assert.deepEqual(added, expected);
  assert.equal(current.some(entry => entry.path.includes('/_raw/')), false);
});

test('C3 notebook and outfit catalog explain comparison without favourable horoscopes or unverified invention claims', () => {
  const items = new Map(read('src/content/items.json').map(entry => [entry.id, entry]));
  const clues = read('src/content/clues.json').filter(entry => entry.chapterId === 'c3');
  const cards = read('src/content/culture-cards.json').filter(entry => [
    'ao-dai-tay-raglan', 'card-ky-thuat-ao-dai-raglan-1960', 'card-phe-phan-hu-tuc-boi-toan',
  ].includes(entry.id));
  const studio = read('src/content/studio.json');
  const garments = studio.garments.filter(entry => ['ao-dai-raglan', 'ao-dai-co-thuyen'].includes(entry.id));
  const text = JSON.stringify([items.get('so_tu_vi_nguyen_ban_1962'), ...clues, ...cards, ...garments]);
  assert.doesNotMatch(text, /đại cát|45\s*độ|45°|Dung Đakao|sáng chế|sáng kiến|giải phóng triệt để/i);
  for (const id of ['bien_nhan_tien_thay_boi', 'so_tu_vi_nguyen_ban_1962', 'thu_tay_thoa_thuan_boi_toan']) {
    assert.match(items.get(id).description, /hư cấu/i, id);
  }
  assert.match(items.get('bien_nhan_tien_thay_boi').description, /Bà Lớn/);
  assert.match(items.get('thu_tay_thoa_thuan_boi_toan').description, /2\.000/);
  assert.match(clues.find(entry => entry.id === 'clue-bagua-hint').description, /Càn trước, Tốn sau/);
  assert.equal(garments.length, 2, 'Both reward garments must remain available');
  assert.equal(studio.accessories.find(entry => entry.id === 'kinh-mat-meo').category, 'jewelry');
});

test('shared catalog edits preserve every non-C3 entry and all C1/C2 chapter bytes', () => {
  const allow = {
    'src/content/items.json': ['bua_chu_tru_yeu_1', 'bua_chu_tru_yeu_2', 'bien_nhan_tien_thay_boi', 'so_tu_vi_nguyen_ban_1962', 'thu_tay_thoa_thuan_boi_toan'],
    'src/content/clues.json': ['clue-mua-chuoc-thay-boi', 'clue-bagua-hint', 'clue-so-tu-vi-goc', 'clue-thoa-thuan-boi-toan'],
    'src/content/culture-cards.json': ['ao-dai-tay-raglan', 'card-ky-thuat-ao-dai-raglan-1960', 'card-phe-phan-hu-tuc-boi-toan'],
  };
  for (const [path, ids] of Object.entries(allow)) {
    const old = before(path), current = read(path);
    assert.deepEqual(current.map(entry => entry.id), old.map(entry => entry.id), path);
    for (const entry of old.filter(entry => !ids.includes(entry.id))) {
      assert.deepEqual(current.find(candidate => candidate.id === entry.id), entry, entry.id);
    }
  }
  const oldStudio = before('src/content/studio.json'), studio = read('src/content/studio.json');
  const filter = catalog => ({ ...catalog,
    garments: catalog.garments.filter(entry => !['ao-dai-raglan', 'ao-dai-co-thuyen'].includes(entry.id)),
    accessories: catalog.accessories.filter(entry => entry.id !== 'kinh-mat-meo'),
  });
  assert.deepEqual(filter(studio), filter(oldStudio));
  for (const name of ['prologue', 'c1', 'c2']) {
    const path = `src/content/chapters/${name}.json`;
    assert.deepEqual(readFileSync(path), execFileSync('git', ['show', `${baseline}:${path}`]), path);
  }
});
