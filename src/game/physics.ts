export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type World = { bounds: Rect; obstacles: Rect[]; spawn: Point; walkable?: Point[]; blockedAreas?: Point[][] };
// Map traced pixels in the selected 1586×992 background to the scene's camera coordinates.
const courtyardPolygon = (points: [number, number][]): Point[] => points.map(([x, y]) => ({
  x: x / 1586 * 1000 - 100, y: y / 992 * 625 - 62.5,
}));
// Foot-plane collisions measured from the actual backgrounds, not interaction rectangles.
export const worlds: Record<string, World> = {
  hub: {
    bounds: { x: -100, y: -62.5, w: 1000, h: 625 },
    obstacles: [],
    // Only the dry courtyard: follow the terraces, pond edge and foreground wall.
    walkable: courtyardPolygon([
      [180,440], [315,420], [680,425], [808,347], [944,350],
      [1018,480], [1253,565], [1260,650], [1200,725], [1060,770],
      [725,819], [460,900], [305,805], [470,757], [447,668],
      [241,558], [184,538],
    ]),
    blockedAreas: [
      courtyardPolygon([[100,575],[245,565],[450,675],[480,745],[300,815],[130,720]]),
      courtyardPolygon([[355,475],[405,467],[453,510],[424,541],[365,526]]),
    ],
    spawn: { x: 440, y: 340 },
  },
  'c0-s1-tiem-may-chieu': { bounds: { x: 82, y: 314, w: 686, h: 166 }, obstacles: [{ x: 496, y: 314, w: 304, h: 130 }], spawn: { x: 140, y: 380 } },
  'c0-s2-gac-xep-chiec-ruong': { bounds: { x: 80, y: 326, w: 656, h: 154 }, obstacles: [{ x: 272, y: 326, w: 246, h: 25 }, { x: 638, y: 326, w: 92, h: 54 }], spawn: { x: 112, y: 388 } },
};
function insidePolygon(pos: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > pos.y) !== (b.y > pos.y)
      && pos.x < (b.x - a.x) * (pos.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function canStand(pos: Point, world: World) {
  const b = world.bounds;
  const feet = [
    { x: pos.x - 8, y: pos.y - 4 }, { x: pos.x + 8, y: pos.y - 4 },
    { x: pos.x - 8, y: pos.y + 4 }, { x: pos.x + 8, y: pos.y + 4 },
  ];
  return pos.x >= b.x + 8 && pos.x <= b.x + b.w - 8 && pos.y >= b.y + 4 && pos.y <= b.y + b.h - 4
    && !world.obstacles.some(r => pos.x > r.x - 8 && pos.x < r.x + r.w + 8 && pos.y > r.y - 4 && pos.y < r.y + r.h + 4)
    && (!world.walkable || feet.every(foot => insidePolygon(foot, world.walkable!)))
    && !world.blockedAreas?.some(polygon => feet.some(foot => insidePolygon(foot, polygon)));
}
export function move(pos: Point, input: Point, dt: number, world: World): Point {
  const length = Math.hypot(input.x, input.y);
  if (!length) return pos;
  const distance = 130 * Math.min(dt, 0.05);
  let next = { ...pos };
  const x = { ...next, x: next.x + input.x / length * distance };
  if (canStand(x, world)) next = x;
  const y = { ...next, y: next.y + input.y / length * distance };
  if (canStand(y, world)) next = y;
  return next;
}
