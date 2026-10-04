// Code-drawn pixel sprites (arrows, cursors, brackets, sparkles). Grids are string[] where each
// char is a palette key and '.' is transparent. Pure: no React, no DOM reads.

export type PixelGrid = string[];
export type Dir = 'up' | 'right' | 'down' | 'left';

/** UI_PALETTE subset (scripts/process-ai-asset.py): k plum, c cream, l light cream, g gold, m muted plum, p pink. */
export const palette: Record<string, string> = {
  k: '#2B2035', c: '#FFF8EE', l: '#FFF1DF', g: '#E9B66B', m: '#74506E', p: '#A72D60',
};

/** Throws unless every row has the same length. Returns [width, height]. */
function gridSize(grid: PixelGrid): [number, number] {
  const w = grid[0]?.length ?? 0;
  grid.forEach((row, y) => { if (row.length !== w) throw new Error(`pixel grid row ${y} is ${row.length} wide, expected ${w}`); });
  return [w, grid.length];
}

export function gridToCanvas(grid: PixelGrid, pal: Record<string, string> = palette, scale = 1): HTMLCanvasElement {
  const [w, h] = gridSize(grid);
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  grid.forEach((row, y) => [...row].forEach((key, x) => {
    if (key === '.') return;
    const color = pal[key];
    if (!color) throw new Error(`pixel grid uses unknown palette key "${key}"`);
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }));
  return canvas;
}

export const gridToDataUrl = (grid: PixelGrid, pal: Record<string, string> = palette, scale = 1): string =>
  gridToCanvas(grid, pal, scale).toDataURL('image/png');

/** CSS `cursor` value. `hotspot` is in grid pixels. Keep grid × scale <= 32px (browsers drop larger cursors). */
export function cursorCss(grid: PixelGrid, hotspot: [number, number], scale = 2): string {
  return `url(${gridToDataUrl(grid, palette, scale)}) ${hotspot[0] * scale} ${hotspot[1] * scale}, auto`;
}

/** Rotate a grid from its 'up' orientation: right = 90° cw, down = 180°, left = 90° ccw. */
export function rotateGrid(grid: PixelGrid, dir: Dir): PixelGrid {
  const [w, h] = gridSize(grid);
  if (dir === 'up') return grid.slice();
  if (dir === 'down') return grid.map(row => [...row].reverse().join('')).reverse();
  const out: string[] = [];
  for (let x = 0; x < w; x++) {
    let row = '';
    for (let y = 0; y < h; y++) row += dir === 'right' ? grid[h - 1 - y][x] : grid[y][w - 1 - x];
    out.push(row);
  }
  return out;
}

/** 16x16 up arrow: plum outline, gold fill, cream highlight. Rotate for other directions. */
export const ARROW_UP: PixelGrid = [
  '................',
  '.......kk.......',
  '......kcgk......',
  '.....kcgggk.....',
  '....kcgggggk....',
  '...kcgggggggk...',
  '..kcgggggggggk..',
  '..kkkkcgggkkkk..',
  '.....kcgggk.....',
  '.....kcgggk.....',
  '.....kcgggk.....',
  '.....kcgggk.....',
  '.....kcgggk.....',
  '.....kcgggk.....',
  '.....kkkkkk.....',
  '................',
];

/** 16x16 pointer. Hotspot (0,0). */
export const CURSOR_DEFAULT: PixelGrid = [
  'k...............',
  'kk..............',
  'kck.............',
  'kcck............',
  'kccck...........',
  'kcccck..........',
  'kccccck.........',
  'kcccccck........',
  'kccccccck.......',
  'kccccckkkk......',
  'kcckcck.........',
  'kck.kcck........',
  'kk..kcck........',
  'k....kcck.......',
  '.....kcck.......',
  '......kk........',
];

/** 16x16 pointing hand. Hotspot (6,0). */
export const CURSOR_HAND: PixelGrid = [
  '......kk........',
  '.....kcck.......',
  '.....kcck.......',
  '.....kcck.......',
  '.....kcckkk.....',
  '.....kcckcckk...',
  '..kk.kcckcckcck.',
  '.kcckkcccccccck.',
  '.kcccccccccccck.',
  '..kcccccccccck..',
  '..kcccccccccck..',
  '...kccccccccck..',
  '....kcccccccck..',
  '....kcccccccck..',
  '.....kkkkkkkk...',
  '................',
];

/** 16x16 magnifier. Hotspot (5,5) = lens centre. */
export const CURSOR_LOOK: PixelGrid = [
  '................',
  '...kkkkkk.......',
  '..kllllllk......',
  '.kllccllllk.....',
  '.kllclllllk.....',
  '.kllllllllk.....',
  '.kllllllllk.....',
  '.kllllllllk.....',
  '.kllllllllk.....',
  '..kllllllk......',
  '...kkkkkkkk.....',
  '..........kmk...',
  '...........kmk..',
  '............kmk.',
  '.............kmk',
  '................',
];

/** 16x16 door + arrow out. Hotspot (8,8). */
export const CURSOR_EXIT: PixelGrid = [
  '................',
  '.kkkkkkk........',
  '.kcccccck.......',
  '.kcccccck.......',
  '.kcccccck...k...',
  '.kcccccck...kk..',
  '.kcckkkkkkkkgk..',
  '.kccggggggggggk.',
  '.kccggggggggggk.',
  '.kcckkkkkkkkgk..',
  '.kcccccck...kk..',
  '.kcccccck...k...',
  '.kcccccck.......',
  '.kcccccck.......',
  '.kkkkkkkk.......',
  '................',
];

/** 6x6 top-left bracket corner; flip in the drawer for the other three. */
export const CORNER: PixelGrid = [
  'kkkkkk',
  'kggggk',
  'kgkkkk',
  'kgk...',
  'kgk...',
  'kkk...',
];

/** 3 frames, 7x7: small plus, big plus, diagonal twinkle. */
export const SPARKLE: PixelGrid[] = [
  ['.......', '.......', '...g...', '..gcg..', '...g...', '.......', '.......'],
  ['...g...', '...c...', '...c...', 'gcccccg', '...c...', '...c...', '...g...'],
  ['.......', '.g...g.', '..g.g..', '...c...', '..g.g..', '.g...g.', '.......'],
];
