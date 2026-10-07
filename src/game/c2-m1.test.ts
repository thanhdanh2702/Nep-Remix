import { test } from 'node:test';
import assert from 'node:assert/strict';
import { c2StripAsset, c2CompleteSketchAsset } from './assets';
import { characterScale, HUMAN_HEIGHT } from './character-scale';
import { c2AreaOverlays } from './room-render';

test('c2StripAsset resolves correct paths for C2 drawing pieces', () => {
  assert.equal(
    c2StripAsset('manh_ban_ve_ao_dai_1'),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-1.png'
  );
  assert.equal(
    c2StripAsset('manh_ban_ve_ao_dai_2'),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-2.png'
  );
  assert.equal(
    c2StripAsset('manh_ban_ve_ao_dai_3'),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-3.png'
  );
  assert.equal(
    c2StripAsset('manh_ban_ve_ao_dai_4'),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-manh-ban-ve-4.png'
  );
  assert.equal(c2StripAsset('invalid_id'), undefined);
  assert.equal(
    c2CompleteSketchAsset(),
    'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh/doc-c2-ban-ve-hoan-chinh.png'
  );
});

test('character-scale defines C2 scene with proper height ratios and floor bounds', () => {
  const c2Human = HUMAN_HEIGHT['c2'];
  assert.ok(c2Human, 'HUMAN_HEIGHT for c2 should be defined');
  assert.equal(c2Human.back, 0.38);
  assert.equal(c2Human.front, 0.48);
  assert.equal(c2Human.floorTop, 0.58);
  assert.equal(c2Human.floorBottom, 0.92);

  // Background height 941px
  const bgH = 941;
  const scaleBack = characterScale('c2', bgH, c2Human.floorTop * bgH);
  const scaleFront = characterScale('c2', bgH, c2Human.floorBottom * bgH);

  assert.ok(scaleFront > scaleBack, 'Character should scale larger toward front of floor');
  const heightBackPx = scaleBack * 389;
  const heightFrontPx = scaleFront * 389;

  assert.ok(Math.abs(heightBackPx - 0.38 * bgH) < 1, 'Back scale should match 38% of room height');
  assert.ok(Math.abs(heightFrontPx - 0.48 * bgH) < 1, 'Front scale should match 48% of room height');
});

test('c2AreaOverlays accurately tracks visibility across S1, S2, and S3 based on inventory and puzzles', () => {
  // S1 initial: 4 pieces visible, assembled sketch hidden
  const s1Initial = c2AreaOverlays('c2', 'c2-s1-gac-lung-ve-tranh', [], []);
  assert.equal(s1Initial.length, 5);
  assert.deepEqual(
    s1Initial.map(o => o.visible),
    [true, true, true, true, false]
  );

  // S1 after picking pieces 1 and 3
  const s1Picked = c2AreaOverlays('c2', 'c2-s1-gac-lung-ve-tranh', ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_3'], []);
  assert.deepEqual(
    s1Picked.map(o => o.visible),
    [false, true, false, true, false]
  );

  // S1 after assembling sketch
  const s1Solved = c2AreaOverlays(
    'c2',
    'c2-s1-gac-lung-ve-tranh',
    ['manh_ban_ve_ao_dai_1', 'manh_ban_ve_ao_dai_2', 'manh_ban_ve_ao_dai_3', 'manh_ban_ve_ao_dai_4'],
    ['p-c2-sketch-assemble']
  );
  assert.deepEqual(
    s1Solved.map(o => o.visible),
    [false, false, false, false, true]
  );

  // S2 initial: key visible, empty safe hidden
  const s2Initial = c2AreaOverlays('c2', 'c2-s2-kho-vai-hang-dao', [], []);
  assert.equal(s2Initial.length, 2);
  assert.deepEqual(s2Initial.map(o => o.visible), [true, false]);

  // S2 after key pickup and safe solve
  const s2Solved = c2AreaOverlays(
    'c2',
    'c2-s2-kho-vai-hang-dao',
    ['chia_khoa_ket_sat_bang_thau'],
    ['p-c2-safe-open']
  );
  assert.deepEqual(s2Solved.map(o => o.visible), [false, true]);

  // S3 initial: no overlays visible
  const s3Initial = c2AreaOverlays('c2', 'c2-s3-phong-trien-lam-doi-dau', [], []);
  assert.deepEqual(s3Initial.map(o => o.visible), [false, false]);

  // S3 after presenting receipt and sketch
  const s3Presented = c2AreaOverlays(
    'c2',
    'c2-s3-phong-trien-lam-doi-dau',
    [],
    ['p-c2-present-receipt', 'p-c2-present-sketch']
  );
  assert.deepEqual(s3Presented.map(o => o.visible), [true, true]);
});
