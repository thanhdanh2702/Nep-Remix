import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AN_FIGURE_H, characterScale, HUMAN_HEIGHT } from './character-scale';
import { c3AreaOverlays, c3RoomNpcs, c3ExitArrows } from './room-render';
import { findPath, standClear, targetFor, clampToFloor } from './room-walker';

const W = 1672;
const H = 941;

test('C3 character scale matches NPC 518.4px visible height on native 941 canvas', () => {
  const h = HUMAN_HEIGHT.c3;
  assert.ok(h, 'HUMAN_HEIGHT must contain c3 entry');
  assert.equal(h.floorTop, 0.68, 'floorTop should be 0.68');
  assert.equal(h.floorBottom, 0.92, 'floorBottom should be 0.92');

  const scale = characterScale('c3', H, 790);
  const expectedScale = 518.4 / AN_FIGURE_H;
  assert.ok(Math.abs(scale - expectedScale) < 1e-6, `scale ${scale} should equal ${expectedScale}`);

  const visibleH = AN_FIGURE_H * scale;
  assert.ok(Math.abs(visibleH - 518.4) < 1e-4, `visible height ${visibleH} should equal 518.4px`);
});

test('c3RoomNpcs places actors with exact manifest coordinates and handles progression poses', () => {
  // S1: Ba Mai
  const s1Npcs = c3RoomNpcs('c3', 'c3-s1-tiem-may-da-kao', [], { w: W, h: H });
  assert.equal(s1Npcs.length, 1);
  assert.equal(s1Npcs[0].id, 'c3-s1-mai');
  assert.equal(s1Npcs[0].name, 'Bà Mai');
  assert.equal(s1Npcs[0].path, 'assets/characters/ba-mai/scene-tailor.png');
  // foot position: x=350, y=790
  assert.equal(s1Npcs[0].rect.x + Math.round(s1Npcs[0].rect.w / 2), 350);
  assert.equal(s1Npcs[0].rect.y + s1Npcs[0].rect.h, 790);

  // S2: Thay Ba Can - idle before P1, anxious after P1
  const s2Before = c3RoomNpcs('c3', 'c3-s2-phong-phong-thuy', [], { w: W, h: H });
  assert.equal(s2Before.length, 1);
  assert.equal(s2Before[0].path, 'assets/characters/thay-ba-can/scene-idle.png');
  assert.equal(s2Before[0].rect.x + Math.round(s2Before[0].rect.w / 2), 580);
  assert.equal(s2Before[0].rect.y + s2Before[0].rect.h, 795);

  const s2After = c3RoomNpcs('c3', 'c3-s2-phong-phong-thuy', ['p-c3-bagua-lock'], { w: W, h: H });
  assert.equal(s2After[0].path, 'assets/characters/thay-ba-can/scene-anxious.png');

  // S3: Vinh, Ba Mai, Ba Lon
  const s3Initial = c3RoomNpcs('c3', 'c3-s3-dinh-thu-doi-dau', [], { w: W, h: H });
  assert.equal(s3Initial.length, 3);
  const vinh = s3Initial.find(n => n.id === 'c3-s3-vinh')!;
  const mai = s3Initial.find(n => n.id === 'c3-s3-mai')!;
  const baLon = s3Initial.find(n => n.id === 'c3-s3-ba-lon')!;

  assert.equal(vinh.path, 'assets/characters/vinh/scene-idle.png');
  assert.equal(mai.path, 'assets/characters/ba-mai/scene-speak.png');
  assert.equal(baLon.path, 'assets/characters/ba-lon/scene-stern.png');

  // S3 after evidence present: Vinh witness, Ba Lon reflective
  const s3Witness = c3RoomNpcs('c3', 'c3-s3-dinh-thu-doi-dau', ['p-c3-present-evidence'], { w: W, h: H });
  assert.equal(s3Witness.find(n => n.id === 'c3-s3-vinh')!.path, 'assets/characters/vinh/scene-witness.png');
  assert.equal(s3Witness.find(n => n.id === 'c3-s3-ba-lon')!.path, 'assets/characters/ba-lon/scene-reflective.png');

  // S3 after styling: Ba Mai relieved
  const s3Relieved = c3RoomNpcs('c3', 'c3-s3-dinh-thu-doi-dau', ['p-c3-styling-mai'], { w: W, h: H });
  assert.equal(s3Relieved.find(n => n.id === 'c3-s3-mai')!.path, 'assets/characters/ba-mai/scene-relieved.png');
});

test('c3AreaOverlays tracks visibility of items and empty chest', () => {
  // S1: bien-nhan toggles off when owned
  const s1Before = c3AreaOverlays('c3', 'c3-s1-tiem-may-da-kao', [], []);
  assert.equal(s1Before.find(o => o.id === 'bien-nhan')?.visible, true);
  assert.equal(s1Before.find(o => o.id === 'giay-doi-chieu')?.visible, true);

  const s1After = c3AreaOverlays('c3', 'c3-s1-tiem-may-da-kao', ['bien_nhan_tien_thay_boi'], []);
  assert.equal(s1After.find(o => o.id === 'bien-nhan')?.visible, false);

  // S2: ruong-rong visible only after P1 solve
  const s2Before = c3AreaOverlays('c3', 'c3-s2-phong-phong-thuy', [], []);
  assert.equal(s2Before.find(o => o.id === 'ruong-rong')?.visible, false);
  assert.equal(s2Before.find(o => o.id === 'ghi-chu-khoa')?.visible, true);

  const s2After = c3AreaOverlays('c3', 'c3-s2-phong-phong-thuy', [], ['p-c3-bagua-lock']);
  assert.equal(s2After.find(o => o.id === 'ruong-rong')?.visible, true);

  // S3: document overlays always visible
  const s3Overlays = c3AreaOverlays('c3', 'c3-s3-dinh-thu-doi-dau', [], []);
  assert.equal(s3Overlays.length, 3);
  assert.ok(s3Overlays.every(o => o.visible));
});

test('c3ExitArrows provides valid navigation between S1, S2, and S3', () => {
  const s1Arrows = c3ExitArrows('c3-s1-tiem-may-da-kao');
  assert.equal(s1Arrows.length, 1);
  assert.equal(s1Arrows[0].exit, 'street');
  assert.equal(s1Arrows[0].dir, 'right');

  const s2Arrows = c3ExitArrows('c3-s2-phong-phong-thuy');
  assert.equal(s2Arrows.length, 2);
  assert.ok(s2Arrows.some(a => a.exit === 'back' && a.dir === 'left'));
  assert.ok(s2Arrows.some(a => a.exit === 'mansion' && a.dir === 'right'));

  const s3Arrows = c3ExitArrows('c3-s3-dinh-thu-doi-dau');
  assert.equal(s3Arrows.length, 1);
  assert.equal(s3Arrows[0].exit, 'back');
  assert.equal(s3Arrows[0].dir, 'left');
});

test('C3 walker routing avoids furniture and stays on open floor with clear route segments', () => {
  const floor = { top: 0.68 * H, bottom: 0.92 * H };

  // Helper to test if a line segment between a and b intersects any axis-aligned bounding box
  const segmentIntersectsBox = (a: { x: number; y: number }, b: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) => {
    let lo = 0, hi = 1;
    for (const [start, delta, min, max] of [
      [a.x, b.x - a.x, r.x, r.x + r.w],
      [a.y, b.y - a.y, r.y, r.y + r.h],
    ]) {
      if (Math.abs(delta) < 1e-9) {
        if (start < min || start > max) return false;
      } else {
        const t0 = (min - start) / delta, t1 = (max - start) / delta;
        lo = Math.max(lo, Math.min(t0, t1));
        hi = Math.min(hi, Math.max(t0, t1));
        if (lo > hi) return false;
      }
    }
    return lo <= hi && lo <= 1 && hi >= 0;
  };

  const assertRouteClearOfObstacles = (
    areaId: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
    obstacleBoxes: { x: number; y: number; w: number; h: number }[]
  ) => {
    const waypoints = findPath(areaId, from, to, floor, { w: W, h: H });
    assert.ok(waypoints !== null, `findPath in ${areaId} must find a path between (${from.x}, ${from.y}) and (${to.x}, ${to.y})`);
    const fullRoute = [from, ...waypoints, to];
    for (let i = 0; i < fullRoute.length - 1; i++) {
      const segStart = fullRoute[i];
      const segEnd = fullRoute[i + 1];
      // Segment endpoints must be within floor band
      assert.ok(segStart.y >= floor.top && segStart.y <= floor.bottom, `Waypoint y=${segStart.y} must stay on floor`);
      assert.ok(segEnd.y >= floor.top && segEnd.y <= floor.bottom, `Waypoint y=${segEnd.y} must stay on floor`);
      // Segment must not intersect any obstacle
      for (const box of obstacleBoxes) {
        const hits = segmentIntersectsBox(segStart, segEnd, box);
        assert.ok(!hits, `Route segment (${segStart.x}, ${segStart.y}) -> (${segEnd.x}, ${segEnd.y}) clips obstacle in ${areaId}`);
      }
    }
  };

  // S1 obstacles: sewing machine + cutting desk
  const s1Obstacles = [
    { x: 0.12 * W, y: 0.50 * H, w: 0.17 * W, h: 0.32 * H },
    { x: 0.68 * W, y: 0.48 * H, w: 0.21 * W, h: 0.34 * H },
  ];
  assertRouteClearOfObstacles('c3-s1-tiem-may-da-kao', { x: 500, y: 790 }, { x: 1100, y: 790 }, s1Obstacles);
  assertRouteClearOfObstacles('c3-s1-tiem-may-da-kao', { x: 480, y: 790 }, { x: 880, y: 820 }, s1Obstacles);

  // S2 obstacles: altars, book table, and Bagua chest
  const s2Obstacles = [
    { x: 0.275 * W, y: 0.48 * H, w: 0.145 * W, h: 0.34 * H },
    { x: 0.44 * W, y: 0.45 * H, w: 0.19 * W, h: 0.36 * H },
    { x: 0.63 * W, y: 0.45 * H, w: 0.18 * W, h: 0.36 * H },
  ];
  assertRouteClearOfObstacles('c3-s2-phong-phong-thuy', { x: 460, y: 795 }, { x: 1080, y: 795 }, s2Obstacles);

  // S3 obstacles: negotiation table
  const s3Obstacles = [
    { x: 0.36 * W, y: 0.48 * H, w: 0.28 * W, h: 0.35 * H },
  ];
  assertRouteClearOfObstacles('c3-s3-dinh-thu-doi-dau', { x: 380, y: 820 }, { x: 1050, y: 820 }, s3Obstacles);

  // Destination foot positioning: standClear pushes any coordinate inside obstacles down to open floor
  const insideDesk = standClear('c3-s1-tiem-may-da-kao', { x: 1250, y: 550 }, floor, { w: W, h: H });
  assert.ok(insideDesk.y > 750, `standClear should place feet in front of desk, got y=${insideDesk.y}`);
  assert.ok(insideDesk.y <= floor.bottom, 'standClear must not exceed floorBottom');

  const insideS3Table = standClear('c3-s3-dinh-thu-doi-dau', { x: 800, y: 600 }, floor, { w: W, h: H });
  assert.ok(insideS3Table.y > 780, `standClear should place feet in front of negotiation table, got y=${insideS3Table.y}`);
  assert.ok(insideS3Table.y <= floor.bottom, 'standClear must not exceed floorBottom');

  // targetFor clamps to floor band and provides valid arrival foot position
  const aimReceipt = targetFor({ x: 1210, y: 473, w: 72, h: 16 }, { x: 800, y: 800 }, floor, W, 0.045 * W, 'c3-s1-tiem-may-da-kao');
  assert.ok(aimReceipt.to.y >= floor.top && aimReceipt.to.y <= floor.bottom, 'aimReceipt.to.y must be within floor band');
  assert.ok(aimReceipt.to.x >= 0.04 * W && aimReceipt.to.x <= 0.96 * W, 'aimReceipt.to.x must stay within horizontal bounds');
});

test('C3 walker placement: initial fallback spawn, transition entry from exit arrows, resume and reachability', () => {
  const floor = { top: 0.68 * H, bottom: 0.92 * H };
  const entryPoint = (r: { x: number; y: number; w: number; h: number }, fl: { top: number }, world: { w: number; h: number }) =>
    (r.y + r.h) * world.h > fl.top ? { x: (r.x + r.w / 2) * world.w, y: r.y * world.h }
      : { x: r.x > 0.15 ? (r.x - 0.06) * world.w : (r.x + r.w + 0.06) * world.w, y: fl.top };

  // 1. Initial fallback spawn from area.spawn (used on fresh entry or resume without transition history)
  // S1: spawn {0.15, 0.5} -> clamped y=639.88, standClear pushes past sewing table to y=790.44
  const s1Initial = standClear('c3-s1-tiem-may-da-kao', clampToFloor({ x: 0.15 * W, y: 0.5 * H }, floor, W), floor, { w: W, h: H });
  assert.ok(Math.abs(s1Initial.x - 250.8) < 1e-4, 'S1 initial spawn x should be 250.8');
  assert.ok(Math.abs(s1Initial.y - 790.44) < 1e-4, 'S1 initial spawn y should be 790.44');

  // S2: spawn {0.1, 0.6} -> clamped y=639.88, no obstacle at x=167.2, stands at y=639.88
  const s2Initial = standClear('c3-s2-phong-phong-thuy', clampToFloor({ x: 0.1 * W, y: 0.6 * H }, floor, W), floor, { w: W, h: H });
  assert.ok(Math.abs(s2Initial.x - 167.2) < 1e-4, 'S2 initial spawn x should be 167.2');
  assert.ok(Math.abs(s2Initial.y - 639.88) < 1e-4, 'S2 initial spawn y should be 639.88');

  // S3: spawn {0.1, 0.6} -> clamped y=639.88, no obstacle at x=167.2, stands at y=639.88
  const s3Initial = standClear('c3-s3-dinh-thu-doi-dau', clampToFloor({ x: 0.1 * W, y: 0.6 * H }, floor, W), floor, { w: W, h: H });
  assert.ok(Math.abs(s3Initial.x - 167.2) < 1e-4, 'S3 initial spawn x should be 167.2');
  assert.ok(Math.abs(s3Initial.y - 639.88) < 1e-4, 'S3 initial spawn y should be 639.88');

  // 2. Room-to-room transitions via exit arrows (entryPoint + clampToFloor + standClear)
  // S1 -> S2 forward transition: entering S2 from S1 (arrow back at left)
  const s2ArrowBack = c3ExitArrows('c3-s2-phong-phong-thuy').find(a => a.exit === 'back')!;
  const s2EntryFromS1 = standClear('c3-s2-phong-phong-thuy', clampToFloor(entryPoint(s2ArrowBack.rect, floor, { w: W, h: H }), floor, W), floor, { w: W, h: H });
  assert.ok(Math.abs(s2EntryFromS1.x - 83.6) < 1e-4, 'S2 entry from S1 x should be 83.6');
  assert.ok(Math.abs(s2EntryFromS1.y - 639.88) < 1e-4, 'S2 entry from S1 y should be 639.88');

  // S3 -> S2 return transition: returning to S2 from S3 (arrow mansion at right)
  const s2ArrowMansion = c3ExitArrows('c3-s2-phong-phong-thuy').find(a => a.exit === 'mansion')!;
  const s2EntryFromS3 = standClear('c3-s2-phong-phong-thuy', clampToFloor(entryPoint(s2ArrowMansion.rect, floor, { w: W, h: H }), floor, W), floor, { w: W, h: H });
  assert.ok(Math.abs(s2EntryFromS3.x - 1588.4) < 1e-4, 'S2 entry from S3 x should be 1588.4');
  assert.ok(Math.abs(s2EntryFromS3.y - 639.88) < 1e-4, 'S2 entry from S3 y should be 639.88');

  // S2 -> S3 forward transition: entering S3 from S2 (arrow back at left)
  const s3ArrowBack = c3ExitArrows('c3-s3-dinh-thu-doi-dau').find(a => a.exit === 'back')!;
  const s3EntryFromS2 = standClear('c3-s3-dinh-thu-doi-dau', clampToFloor(entryPoint(s3ArrowBack.rect, floor, { w: W, h: H }), floor, W), floor, { w: W, h: H });
  assert.ok(Math.abs(s3EntryFromS2.x - 83.6) < 1e-4, 'S3 entry from S2 x should be 83.6');
  assert.ok(Math.abs(s3EntryFromS2.y - 639.88) < 1e-4, 'S3 entry from S2 y should be 639.88');

  // S2 -> S1 return transition: returning to S1 from S2 (arrow street at right)
  const s1ArrowStreet = c3ExitArrows('c3-s1-tiem-may-da-kao').find(a => a.exit === 'street')!;
  const s1EntryFromS2 = standClear('c3-s1-tiem-may-da-kao', clampToFloor(entryPoint(s1ArrowStreet.rect, floor, { w: W, h: H }), floor, W), floor, { w: W, h: H });
  assert.ok(Math.abs(s1EntryFromS2.x - 1571.68) < 1e-4, 'S1 return entry x should be 1571.68');
  assert.ok(Math.abs(s1EntryFromS2.y - 639.88) < 1e-4, 'S1 return entry y should be 639.88');

  // 3. Candidate proposed mid-floor spawns (if Core updates c3.json to place An at mid-floor matching art)
  // S2 proposed spawn: {0.10, 0.845} -> native [167.2, 795.15]
  const s2Proposed = standClear('c3-s2-phong-phong-thuy', clampToFloor({ x: 0.10 * W, y: 0.845 * H }, floor, W), floor, { w: W, h: H });
  assert.ok(Math.abs(s2Proposed.x - 167.2) < 1e-4, 'S2 proposed spawn x should be 167.2');
  assert.ok(Math.abs(s2Proposed.y - 795.145) < 1e-3, 'S2 proposed spawn y should be ~795.15');
  const s2ProposedPath = findPath('c3-s2-phong-phong-thuy', s2Proposed, { x: 1004.76, y: 781.03 }, floor, { w: W, h: H });
  assert.ok(s2ProposedPath !== null, 'S2 path from proposed mid-floor spawn to Bagua chest must exist');

  // S3 proposed spawn: {0.10, 0.871} -> native [167.2, 819.61]
  const s3Proposed = standClear('c3-s3-dinh-thu-doi-dau', clampToFloor({ x: 0.10 * W, y: 0.871 * H }, floor, W), floor, { w: W, h: H });
  assert.ok(Math.abs(s3Proposed.x - 167.2) < 1e-4, 'S3 proposed spawn x should be 167.2');
  assert.ok(Math.abs(s3Proposed.y - 819.611) < 1e-3, 'S3 proposed spawn y should be ~819.61');
  const s3ProposedPath = findPath('c3-s3-dinh-thu-doi-dau', s3Proposed, { x: 604.76, y: 799.85 }, floor, { w: W, h: H });
  assert.ok(s3ProposedPath !== null, 'S3 path from proposed mid-floor spawn to salon table must exist');

  // 4. Resume behavior: without prior transition history (prevArea = null or reload), initialPos falls back to area.spawn
  const resolveSceneEntry = (
    currentAreaId: string,
    areaSpawn: { x: number; y: number } | undefined,
    prevAreaId: string | null,
    exits: Record<string, string>,
    exitArrows: { exit: string; rect: { x: number; y: number; w: number; h: number } }[]
  ) => {
    const entry = exitArrows.find(x => exits[x.exit] === prevAreaId);
    const initialPos = entry
      ? entryPoint(entry.rect, floor, { w: W, h: H })
      : (areaSpawn ? { x: areaSpawn.x * W, y: areaSpawn.y * H } : { x: W / 2, y: H });
    return standClear(currentAreaId, clampToFloor(initialPos, floor, W), floor, { w: W, h: H });
  };

  // Resume directly in S2 (no transition history):
  const s2Resumed = resolveSceneEntry('c3-s2-phong-phong-thuy', { x: 0.1, y: 0.6 }, null, { back: 'c3-s1-tiem-may-da-kao', mansion: 'c3-s3-dinh-thu-doi-dau' }, c3ExitArrows('c3-s2-phong-phong-thuy'));
  assert.deepEqual(s2Resumed, s2Initial, 'Resume in S2 must use area.spawn fallback');

  // Resume directly in S3 (no transition history):
  const s3Resumed = resolveSceneEntry('c3-s3-dinh-thu-doi-dau', { x: 0.1, y: 0.6 }, null, { back: 'c3-s2-phong-phong-thuy' }, c3ExitArrows('c3-s3-dinh-thu-doi-dau'));
  assert.deepEqual(s3Resumed, s3Initial, 'Resume in S3 must use area.spawn fallback');

  // 5. Path reachability: all spawns and entries can find paths to interior targets
  const s1Path = findPath('c3-s1-tiem-may-da-kao', s1Initial, { x: 1385.24, y: 790.44 }, floor, { w: W, h: H });
  assert.ok(s1Path !== null, 'S1 path from spawn to receipt desk must exist');

  const s2PathFromS1 = findPath('c3-s2-phong-phong-thuy', s2EntryFromS1, { x: 1004.76, y: 781.03 }, floor, { w: W, h: H });
  assert.ok(s2PathFromS1 !== null, 'S2 path from entry to Bagua chest must exist');

  const s3PathFromS2 = findPath('c3-s3-dinh-thu-doi-dau', s3EntryFromS2, { x: 604.76, y: 799.85 }, floor, { w: W, h: H });
  assert.ok(s3PathFromS2 !== null, 'S3 path from entry to salon table must exist');
});

