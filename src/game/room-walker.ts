import { AN, type Direction } from './assets';

// Pure logic for An walking inside a point-and-click room: where she stands next to an object, how she
// steps toward it and which sheet cell shows. World px = the room background's own pixels. No DOM here.

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }
export interface Floor { top: number; bottom: number }
export type NpcView = 'front' | 'left' | 'right' | 'back';
export interface Walker {
  x: number; y: number; dir: Direction; moving: boolean;
  /** Seconds spent walking; drives the walk cycle. */
  clock: number;
  goal: { to: Pt; face: Direction; waypoints?: Pt[] } | null;
}

/** World widths per second. */
export const WALK_SPEED = 0.35;
const WALK_FPS = 9, IDLE_MS = 250;
/** Keep feet this far (share of world width) from the side edges. */
const EDGE = 0.05;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const clampToFloor = (p: Pt, floor: Floor, worldW: number): Pt =>
  ({ x: clamp(p.x, EDGE * worldW, (1 - EDGE) * worldW), y: clamp(p.y, floor.top, floor.bottom) });

/** Direction from one point to another. `bias` > 1 favours left/right (a target must be that many times
 *  further vertically than horizontally before she turns up or down). */
export function facing(from: Pt, to: Pt, bias = 1): Direction {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (Math.abs(dy) > bias * Math.abs(dx)) return dy < 0 ? 'up' : 'down';
  return dx < 0 ? 'left' : 'right';
}

/** Where An stands for an object: on the floor strip beside its bottom-centre, on the side she comes from
 *  (flipped if that side runs off the room), turned toward the object. `gap` is world px clear of the rect. */
export function targetFor(rect: Rect, from: Pt, floor: Floor, worldW: number, gap: number): { to: Pt; face: Direction } {
  const cx = rect.x + rect.w / 2, off = rect.w / 2 + gap, foot = rect.y + rect.h;
  let x = cx + (from.x <= cx ? -off : off);
  if (x < EDGE * worldW || x > (1 - EDGE) * worldW) x = cx + (x < cx ? off : -off);
  // Avoid standing directly on NPC Loan in C2:
  // S1: French window left approach (cx ~ 1287, rect.w ~ 100px) should not stand behind Loan [1080, 1194]
  // Note: rect.w < 200 distinguishes French window from S2 iron safe (rect.w ~ 336px).
  if (rect.x > 1200 && rect.x < 1300 && rect.w < 200 && x >= 1080 && x <= 1194) {
    x = 1282.4;
  }
  // S2: Silk shelves left approach (cx ~ 920, w ~ 435) should not overlap Loan [545, 659]
  if (rect.x >= 700 && rect.x <= 710 && x >= 545 && x <= 659) {
    x = 760;
  }
  // S3: Ong Le shadow (cx ~ 502, w ~ 134) left and right approach should stand on open floor [425, 635]
  // avoiding Loan silhouette [311, 425] on the left and exhibition podium [635, 903] on the right.
  if (rect.x >= 430 && rect.x <= 440) {
    if (x >= 311 && x <= 425) {
      x = 525; // clear of Loan [311, 425] with horizontal delta >= 80px and 0 visible box overlap
    } else if (x >= 635 && x <= 903) {
      x = 525; // clear of podium [635, 903], standing on open floor
    }
  }
  const to = clampToFloor({ x, y: foot }, floor, worldW);
  return { to, face: facing(to, { x: cx, y: rect.y + rect.h / 2 }, 2) };
}

/** Furniture footprints on the floor (shares of the room), per area. Feet inside one would stand An on the table,
 *  so standClear moves her to the floor just in front of it. Only rooms whose art needs it are listed. */
const OBSTACLES: Record<string, Rect[]> = {
  'c0-s1-tiem-may-chieu': [{ x: 0.57, y: 0.5, w: 0.43, h: 0.42 }, { x: 0, y: 0.5, w: 0.19, h: 0.3 }],
  'c0-s2-gac-xep-chiec-ruong': [{ x: 0.36, y: 0.5, w: 0.29, h: 0.21 }, { x: 0, y: 0.5, w: 0.21, h: 0.22 }, { x: 0.77, y: 0.5, w: 0.23, h: 0.33 }],
  'c2-s1-gac-lung-ve-tranh': [{ x: 0.30, y: 0.40, w: 0.15, h: 0.173 }],
  'c2-s2-kho-vai-hang-dao': [{ x: 0.36, y: 0.25, w: 0.33, h: 0.335 }],
  'c2-s3-phong-trien-lam-doi-dau': [{ x: 0.20, y: 0.28, w: 0.15, h: 0.30 }],
};
const FRONT_GAP = 0.02; // share of the room height between a footprint's front edge and her feet

export function standClear(areaId: string, p: Pt, floor: Floor, world: { w: number; h: number }): Pt {
  const hit = (OBSTACLES[areaId] ?? []).find(r => p.x >= r.x * world.w && p.x <= (r.x + r.w) * world.w && p.y >= r.y * world.h && p.y <= (r.y + r.h) * world.h);
  return hit ? { x: p.x, y: Math.min(floor.bottom, (hit.y + hit.h + FRONT_GAP) * world.h) } : p;
}

/** Find waypoints routing around large room obstacles (e.g. S1 drawing desk, S2 silk cabinet). */
export function findPath(
  areaId: string,
  from: Pt,
  to: Pt,
  floor: Floor,
  world: { w: number; h: number }
): Pt[] {
  const waypoints: Pt[] = [];

  if (areaId === 'c2-s1-gac-lung-ve-tranh') {
    // Desk obstacle is at x in [501.6, 819.3], y in [376.4, 644.6].
    // If moving across the desk between left (x < 510) and right (x > 800), route via lower corridor (y = 700).
    const crossesDesk = (from.x < 510 && to.x > 800) || (from.x > 800 && to.x < 550);
    if (crossesDesk) {
      const corridorY = 700;
      if (from.x <= to.x) {
        waypoints.push({ x: 460, y: corridorY });
        waypoints.push({ x: 850, y: corridorY });
      } else {
        waypoints.push({ x: 850, y: corridorY });
        waypoints.push({ x: 460, y: corridorY });
      }
    }
  } else if (areaId === 'c2-s2-kho-vai-hang-dao') {
    // Cabinet obstacle is at x in [601.9, 1137.0], y in [197.6, 665.3].
    // If moving between left (x < 550) and right (x > 1130), route via lower corridor (y = 725),
    // with left waypoint at 480 (clear of Loan at [545, 659]) and right waypoint at 1150.
    const crossesCabinet = (from.x < 550 && to.x > 1130) || (from.x > 1130 && to.x < 550);
    if (crossesCabinet) {
      const corridorY = 725;
      if (from.x <= to.x) {
        waypoints.push({ x: 480, y: corridorY });
        waypoints.push({ x: 1150, y: corridorY });
      } else {
        waypoints.push({ x: 1150, y: corridorY });
        waypoints.push({ x: 480, y: corridorY });
      }
    }
  } else if (areaId === 'c2-s3-phong-trien-lam-doi-dau') {
    // Podium obstacle is at x in [635.36, 902.88], y in [470.5, 771.62].
    // If moving between left (x < 620) and right (x > 920), route via lower corridor (y = 810).
    const crossesPodium = (from.x < 620 && to.x > 920) || (from.x > 920 && to.x < 620);
    if (crossesPodium) {
      const corridorY = 810;
      if (from.x <= to.x) {
        waypoints.push({ x: 600, y: corridorY });
        waypoints.push({ x: 950, y: corridorY });
      } else {
        waypoints.push({ x: 950, y: corridorY });
        waypoints.push({ x: 600, y: corridorY });
      }
    }
  }

  return waypoints;
}

export const newWalker = (at: Pt): Walker => ({ ...at, dir: 'down', moving: false, clock: 0, goal: null });

/** Jump straight to the goal (reduced motion). */
export const arriveNow = (w: Walker, to: Pt, face: Direction): Walker => ({ ...w, ...to, dir: face, moving: false, goal: null });

/** Advance `dt` seconds toward the goal at `speed` world px/s. `arrived` is true on the tick she gets there. */
export function tick(w: Walker, dt: number, speed: number): { walker: Walker; arrived: boolean } {
  const g = w.goal;
  if (!g) return { walker: w, arrived: false };
  const currentTarget = (g.waypoints && g.waypoints.length > 0) ? g.waypoints[0] : g.to;
  const isFinalTarget = !g.waypoints || g.waypoints.length === 0;

  const dx = currentTarget.x - w.x, dy = currentTarget.y - w.y;
  const dist = Math.hypot(dx, dy), step = speed * dt;

  if (dist <= step) {
    if (isFinalTarget) {
      return { walker: arriveNow(w, g.to, g.face), arrived: true };
    }
    const remainingWaypoints = g.waypoints!.slice(1);
    const nextTarget = remainingWaypoints.length > 0 ? remainingWaypoints[0] : g.to;
    return {
      walker: {
        ...w,
        x: currentTarget.x,
        y: currentTarget.y,
        dir: facing(currentTarget, nextTarget),
        moving: true,
        clock: w.clock + dt,
        goal: { ...g, waypoints: remainingWaypoints }
      },
      arrived: false
    };
  }

  return {
    walker: {
      ...w,
      x: w.x + dx / dist * step,
      y: w.y + dy / dist * step,
      dir: facing(w, currentTarget),
      moving: true,
      clock: w.clock + dt,
      goal: g
    },
    arrived: false
  };
}

/** Sheet cell (row-major in the 8x11 grid) for the walker now. Idle breathes unless motion is reduced. */
export function cellFor(w: Walker, t: number, reduced: boolean): number {
  const step = w.moving ? AN.walk[Math.floor(w.clock * WALK_FPS) % AN.walk.length]
    : AN.idle[reduced ? 0 : Math.floor(t / IDLE_MS) % AN.idle.length];
  return AN.directions[w.dir] + step;
}

/** Which NPC view faces An: sideways when she stands beside them, back when she is behind, else front. */
export function npcView(npc: Pt, an: Pt, world: { w: number; h: number }): NpcView {
  const dx = an.x - npc.x, dy = an.y - npc.y;
  if (Math.abs(dx) > 0.06 * world.w) return dx < 0 ? 'left' : 'right';
  return dy < -0.05 * world.h ? 'back' : 'front';
}
