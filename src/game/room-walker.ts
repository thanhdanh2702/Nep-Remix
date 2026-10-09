import { AN, type Direction } from './assets';
import type { ExitArrow } from '../content/schema';

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

export const C3_DOORWAY_Y: Record<string, number> = {
  'c3-s1-tiem-may-da-kao': 790.44,
  'c3-s2-phong-phong-thuy': 795.15,
  'c3-s3-dinh-thu-doi-dau': 819.61,
};

export const C3_HOTSPOT_LABELS: Record<string, string> = {
  // S1: Tiệm may Mai Sài Gòn tại Đa Kao
  'hitbox-gramophone': 'Xem máy hát đĩa',
  'hitbox-fabric-attic': 'Nhặt biên nhận tiền',
  'hitbox-c3-read-receipt': 'Đọc biên nhận tiền',
  'hitbox-street-exit': 'Ra ngoài đường',

  // S2: Gian phòng phong thủy Thầy Ba Càn
  'hitbox-incense-bowl': 'Xem bát hương',
  'hitbox-bagua-mirror': 'Xem gương Bát Quái',
  'hitbox-bagua-chest': 'Mở rương Bát Quái',

  // S3: Phòng đối chất tại dinh thự
  'hitbox-salon-table': 'Trình chứng cứ',
  'hitbox-c3-read-revision': 'Đọc bản sửa hồ sơ',
  'hitbox-vinh-support': 'Nói chuyện với Vinh',
  'hitbox-styling-mai': 'Phối đồ cho Mai',
};

/**
 * Entry point when walking into a room through an exit arrow.
 * For C3 side doorways (left/right arrows), places feet on the room's open floor threshold.
 * For other chapters/arrows, preserves legacy upper/side placement.
 */
export function entryPoint(
  arrow: { rect: Rect; dir?: ExitArrow['dir'] },
  floor: Floor,
  world: { w: number; h: number },
  chapterId?: string,
  areaId?: string
): Pt {
  const r = arrow.rect;
  if (chapterId === 'c3' && (arrow.dir === 'left' || arrow.dir === 'right')) {
    const x = (r.x + r.w / 2) * world.w;
    const doorwayY = areaId ? C3_DOORWAY_Y[areaId] : undefined;
    const y = doorwayY ?? Math.min(floor.bottom, Math.max(floor.top, (r.y + r.h) * world.h));
    return { x, y };
  }
  return (r.y + r.h) * world.h > floor.top
    ? { x: (r.x + r.w / 2) * world.w, y: r.y * world.h }
    : { x: r.x > 0.15 ? (r.x - 0.06) * world.w : (r.x + r.w + 0.06) * world.w, y: floor.top };
}

/** Direction from one point to another. `bias` > 1 favours left/right (a target must be that many times
 *  further vertically than horizontally before she turns up or down). */
export function facing(from: Pt, to: Pt, bias = 1): Direction {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (Math.abs(dy) > bias * Math.abs(dx)) return dy < 0 ? 'up' : 'down';
  return dx < 0 ? 'left' : 'right';
}

/** Where An stands for an object: on the floor strip beside its bottom-centre, on the side she comes from
 *  (flipped if that side runs off the room), turned toward the object. `gap` is world px clear of the rect. */
export function targetFor(rect: Rect, from: Pt, floor: Floor, worldW: number, gap: number, areaId = ''): { to: Pt; face: Direction } {
  const cx = rect.x + rect.w / 2, off = rect.w / 2 + gap, foot = rect.y + rect.h;
  let x = cx + (from.x <= cx ? -off : off);
  if (x < EDGE * worldW || x > (1 - EDGE) * worldW) x = cx + (x < cx ? off : -off);
  // Avoid standing directly on NPC Loan in C2:
  // S1: French window left approach (cx ~ 1287, rect.w ~ 100px) should not stand behind Loan [1080, 1194]
  // Note: rect.w < 200 distinguishes French window from S2 iron safe (rect.w ~ 336px).
  if (areaId === 'c2-s1-gac-lung-ve-tranh' && rect.x > 1200 && rect.x < 1300 && rect.w < 200 && x >= 1080 && x <= 1194) {
    x = 1282.4;
  }
  // S2: Silk shelves left approach (cx ~ 920, w ~ 435) should not overlap Loan [545, 659]
  if (areaId === 'c2-s2-kho-vai-hang-dao' && rect.x >= 700 && rect.x <= 710 && x >= 545 && x <= 659) {
    x = 760;
  }
  // S3: Ong Le shadow (cx ~ 502, w ~ 134) left and right approach should stand on open floor [425, 635]
  // avoiding Loan silhouette [311, 425] on the left and exhibition podium [635, 903] on the right.
  if (areaId === 'c2-s3-phong-trien-lam-doi-dau' && rect.x >= 430 && rect.x <= 440) {
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
  'c2-s1-gac-lung-ve-tranh': [{ x: 0.30, y: 0.40, w: 0.19, h: 0.285 }],
  'c2-s2-kho-vai-hang-dao': [
    { x: 0.36, y: 0.21, w: 0.32, h: 0.497 },
    { x: 0.71, y: 0.35, w: 0.24, h: 0.410 },
  ],
  'c2-s3-phong-trien-lam-doi-dau': [{ x: 0, y: 0.25, w: 0.48, h: 0.505 }],
  'c3-s1-tiem-may-da-kao': [
    { x: 0.12, y: 0.50, w: 0.17, h: 0.32 },
    { x: 0.68, y: 0.48, w: 0.21, h: 0.34 },
  ],
  'c3-s2-phong-phong-thuy': [
    { x: 0.05, y: 0.48, w: 0.17, h: 0.345 },
    { x: 0.275, y: 0.48, w: 0.145, h: 0.34 },
    { x: 0.44, y: 0.45, w: 0.19, h: 0.36 },
    { x: 0.63, y: 0.45, w: 0.18, h: 0.36 },
  ],
  'c3-s3-dinh-thu-doi-dau': [
    { x: 0.05, y: 0.48, w: 0.18, h: 0.371 },
    { x: 0.36, y: 0.48, w: 0.28, h: 0.35 },
  ],
};
const FRONT_GAP = 0.02; // share of the room height between a footprint's front edge and her feet
// Native ground-space below the render-only NPCs. Avoid feet, not the entire
// upright sprite: normal 2.5D layering remains meaningful while passing them.
const NPC_FEET: Record<string, Rect[]> = {
  'c2-s1-gac-lung-ve-tranh': [{ x: 1080, y: 675, w: 114, h: 50 }],
  'c2-s2-kho-vai-hang-dao': [{ x: 545, y: 635, w: 114, h: 50 }],
  'c2-s3-phong-trien-lam-doi-dau': [
    { x: 310.8, y: 647.5, w: 114, h: 50 }, { x: 1197, y: 647.5, w: 114, h: 50 },
  ],
  'c3-s1-tiem-may-da-kao': [{ x: 293, y: 750, w: 114, h: 45 }],
  'c3-s2-phong-phong-thuy': [{ x: 523, y: 755, w: 114, h: 45 }],
  'c3-s3-dinh-thu-doi-dau': [
    { x: 423, y: 780, w: 114, h: 45 },
    { x: 723, y: 785, w: 114, h: 45 },
    { x: 1113, y: 780, w: 114, h: 45 },
  ],
};

export function standClear(areaId: string, p: Pt, floor: Floor, world: { w: number; h: number }): Pt {
  const hit = (OBSTACLES[areaId] ?? []).find(r => p.x >= r.x * world.w && p.x <= (r.x + r.w) * world.w && p.y >= r.y * world.h && p.y <= (r.y + r.h) * world.h);
  return hit ? { x: p.x, y: Math.min(floor.bottom, (hit.y + hit.h + FRONT_GAP) * world.h) } : p;
}

/** Visibility-graph routing around measured furniture. null means unreachable,
 * never "walk through it". Empty waypoints means the direct segment is clear. */
export function findPath(
  areaId: string,
  from: Pt,
  to: Pt,
  floor: Floor,
  world: { w: number; h: number }
): Pt[] | null {
  // Do not change legacy chapter movement in the C2/C3 sprint.
  if (!areaId.startsWith('c2-') && !areaId.startsWith('c3-')) return [];
  const boxes = (OBSTACLES[areaId] ?? []).map(r => ({
    x: r.x * world.w, y: r.y * world.h, w: r.w * world.w, h: r.h * world.h,
  })).concat((NPC_FEET[areaId] ?? []).map(r => ({
    x: r.x * world.w / 1672, y: r.y * world.h / 941,
    w: r.w * world.w / 1672, h: r.h * world.h / 941,
  })));
  const inside = (p: Pt, r: Rect) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  const valid = (p: Pt) => p.x >= EDGE * world.w - 1e-4 && p.x <= (1 - EDGE) * world.w + 1e-4
    && p.y >= floor.top - 1e-4 && p.y <= floor.bottom + 1e-4 && !boxes.some(r => inside(p, r));
  if (!valid(from) || !valid(to)) return null;
  // Slab intersection checks the full closed segment, including its endpoints.
  const intersects = (a: Pt, b: Pt, r: Rect) => {
    let lo = 0, hi = 1;
    for (const [start, delta, min, max] of [
      [a.x, b.x - a.x, r.x, r.x + r.w], [a.y, b.y - a.y, r.y, r.y + r.h],
    ]) {
      if (Math.abs(delta) < 1e-9) { if (start < min || start > max) return false; }
      else {
        const t0 = (min - start) / delta, t1 = (max - start) / delta;
        lo = Math.max(lo, Math.min(t0, t1)); hi = Math.min(hi, Math.max(t0, t1));
        if (lo > hi) return false;
      }
    }
    return true;
  };
  const clear = (a: Pt, b: Pt) => !boxes.some(r => intersects(a, b, r));
  if (clear(from, to)) return [];
  const margin = .01 * world.h;
  const corners = boxes.flatMap(r => [
    { x: r.x - margin, y: r.y - margin }, { x: r.x + r.w + margin, y: r.y - margin },
    { x: r.x - margin, y: r.y + r.h + margin }, { x: r.x + r.w + margin, y: r.y + r.h + margin },
  ]).filter(valid);
  const nodes = [from, to, ...corners];
  const distances = nodes.map(() => Infinity), previous = nodes.map(() => -1);
  const visited = new Set<number>(); distances[0] = 0;
  for (;;) {
    let current = -1;
    for (let i = 0; i < nodes.length; i++) if (!visited.has(i)
      && Number.isFinite(distances[i]) && (current < 0 || distances[i] < distances[current])) current = i;
    if (current < 0) return null;
    if (current === 1) break;
    visited.add(current);
    for (let next = 0; next < nodes.length; next++) {
      if (visited.has(next) || !clear(nodes[current], nodes[next])) continue;
      const distance = distances[current] + Math.hypot(nodes[current].x - nodes[next].x, nodes[current].y - nodes[next].y);
      if (distance < distances[next]) { distances[next] = distance; previous[next] = current; }
    }
  }
  const path: Pt[] = [];
  for (let current = previous[1]; current > 0; current = previous[current]) path.unshift(nodes[current]);
  return path;
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
