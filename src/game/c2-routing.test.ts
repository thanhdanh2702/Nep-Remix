import test from 'node:test';
import assert from 'node:assert/strict';
import { loadContent } from '../content';
import { findPath, newWalker, standClear, targetFor, tick, type Pt } from './room-walker';

const world = { w: 1672, h: 941 };
const floor = { top: .58 * world.h, bottom: .92 * world.h };
// Independent audited art footprints: do not shrink these to match runtime.
const footprints = [
  [{ x: .30, y: .40, w: .19, h: .285 }],
  [{ x: .36, y: .21, w: .32, h: .497 }, { x: .71, y: .35, w: .24, h: .410 }],
  [{ x: 0, y: .25, w: .48, h: .505 }],
];
const areas = loadContent().chapters.c2.areas;
function check(p: Pt, index: number) {
  assert.ok(p.y >= floor.top && p.y <= floor.bottom, 'feet outside floor band');
  for (const r of footprints[index]) assert.ok(!(p.x >= r.x * world.w && p.x <= (r.x + r.w) * world.w
    && p.y >= r.y * world.h && p.y <= (r.y + r.h) * world.h), `feet in audited furniture: ${JSON.stringify(p)}`);
}

for (const [index, area] of areas.entries()) {
  test(`C2 ${area.id}: every approach, route segment and retarget remains on clear floor`, () => {
    const anchors: Pt[] = [standClear(area.id, { x: area.spawn.x * world.w, y: area.spawn.y * world.h }, floor, world)];
    for (const spot of area.interactables) for (const from of [{ x: 84, y: 800 }, { x: 1588, y: 800 }]) {
      const r = spot.rect!;
      const aim = targetFor({ x: r.x * world.w, y: r.y * world.h, w: r.w * world.w, h: r.h * world.h }, from, floor, world.w, .045 * world.w);
      anchors.push(standClear(area.id, aim.to, floor, world));
    }
    anchors.forEach(p => check(p, index));
    for (const from of anchors) for (const to of anchors) {
      const waypoints = findPath(area.id, from, to, floor, world);
      assert.notEqual(waypoints, null, 'reachable floor route must exist');
      const points = [from, ...waypoints!, to];
      // Check whole segments densely, not only the timer's animation samples.
      for (let i = 1; i < points.length; i++) for (let s = 0; s <= 200; s++) {
        check({ x: points[i - 1].x + (points[i].x - points[i - 1].x) * s / 200,
          y: points[i - 1].y + (points[i].y - points[i - 1].y) * s / 200 }, index);
      }
      let walker = { ...newWalker(from), goal: { to, face: 'down' as const, waypoints: waypoints! } };
      let arrived = false;
      for (let n = 0; n < 2000 && !arrived; n++) {
        const next = tick(walker, .03, world.w * .35);
        walker = next.walker as typeof walker; arrived = next.arrived;
        check(walker, index);
        if (n === 2) {
          const route = findPath(area.id, walker, to, floor, world);
          assert.notEqual(route, null);
          walker.goal = { to, face: 'down', waypoints: route! };
        }
      }
      assert.ok(arrived, 'walker must arrive');
    }
  });
}

test('C2 routing never falls back to a direct line for a blocked destination', () => {
  assert.equal(findPath(areas[0].id, { x: 280, y: 600 }, { x: 650, y: 600 }, floor, world), null);
});
