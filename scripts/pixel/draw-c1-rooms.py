"""Draw the three Chapter 1 room backgrounds (640x360) with code only: Pillow + numpy, no image model.

Every pixel is a palette index. A room palette is a handful of colour ramps (dark -> light) anchored on
assets/palettes/*.json; "lighting" is a ramp shift (+1 lighter / -1 darker) applied through Bayer dither masks,
so the result can never leave the palette (<= 32 colours per room). Light comes from the upper right in every room.
Small props are char-grid sprites from assets/src/pixel/c1/*.grid.json (validated by pixel-grid.py).

Outputs, per area:  assets/areas/chapter-1/<area>/<area>--phai.png  and  layout.json
(normalised 0..1 bbox of every interactable id in src/content/chapters/c1.json + exit arrow positions).

Usage: python scripts/pixel/draw-c1-rooms.py [s1|s2|s3 ...] [--preview DIR] [--scale N]
"""
import argparse
import importlib.util
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent.parent
AREAS = ROOT / 'assets/areas/chapter-1'
GRIDS = ROOT / 'assets/src/pixel/c1'
W, H = 640, 360
MAX_COLORS = 32

# Colour ramps, dark -> light. Anchors from assets/palettes (ui.json / garment.json) are marked in ANCHORS;
# the other steps are interpolated between anchors so every ramp has a consistent hue shift.
RAMPS = {
    'ink':    ['291021'],
    'wood':   ['402036', '5A2F2A', '6B4423', '8F5E32', 'B8803F', 'D9A55A'],
    'wall':   ['6E4A3A', '8F6648', 'B88A58', 'E9B66B', 'F6D9A0'],
    'tile':   ['4F2530', '74352F', '9C4B34', 'C2693F', 'E08A4E'],
    'ind':    ['1E2A38', '2D3E50', '46607F', '7C98B8'],
    'red':    ['7A1F1F', 'B83A24', 'E2653A'],
    'gold':   ['8F6B2A', 'CFA449', 'F2D68A'],
    'cream':  ['C9B49C', 'F5EFEB', 'FFF1DF'],
    'sky':    ['402036', '74506E', 'B05A6E', 'E58E5E', 'FBDDA2'],
    'stone':  ['2B2035', '6A6678', '9A94A0', 'C8C0BC'],
    'leaf':   ['1D3A38', '2D6A5D', '5C9A7A'],
}
ANCHORS = {'291021', '402036', '6B4423', 'E9B66B', '1E2A38', '2D3E50', 'B83A24', 'CFA449', 'F5EFEB', 'FFF1DF', '2D6A5D', '74506E', '2B2035'}

B8 = (np.array([[0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38],
                [60, 28, 52, 20, 62, 30, 54, 22], [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
                [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]]) + 0.5) / 64.0
BAY = np.tile(B8, (H // 8 + 1, W // 8 + 1))[:H, :W]
YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)


def load_pixel_grid():
    sys.dont_write_bytecode = True  # importing a hyphenated script must not leave __pycache__ behind
    spec = importlib.util.spec_from_file_location('pixel_grid', Path(__file__).with_name('pixel-grid.py'))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


PG = load_pixel_grid()


def hex_rgb(h):
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


class Cv:
    """Indexed canvas with palette ramps, dither shading, tagged objects and auto outlines."""

    def __init__(self, ramp_specs, seed):
        self.rng = np.random.default_rng(seed)
        self.pal, self.R, rid, lvl = [], {}, [], []
        for n, spec in enumerate(ramp_specs):
            name, lo, hi = spec if isinstance(spec, tuple) else (spec, 0, None)
            idxs = []
            for c in RAMPS[name][lo:hi]:
                self.pal.append(c)
                idxs.append(len(self.pal) - 1)
                rid.append(n)
                lvl.append(len(idxs) - 1)
            self.R[name] = idxs
        assert len(self.pal) <= MAX_COLORS, f'{len(self.pal)} colours > {MAX_COLORS}'
        self.rid, self.lvl = np.array(rid), np.array(lvl)
        self.rstart = {n: self.rid.tolist().index(n) for n in set(rid)}
        self.rlen = {n: rid.count(n) for n in set(rid)}
        self._lut = {}
        self.INK = self.R['ink'][0]
        self.im = Image.new('L', (W, H), self.INK)
        self.mim = Image.new('L', (W, H), 0)
        self.d, self.md = ImageDraw.Draw(self.im), ImageDraw.Draw(self.mim)
        self.tag = False
        self.boxes = {}
        self.cache = {}

    # ---- palette helpers
    def lut(self, n):
        if n not in self._lut:
            t = np.arange(len(self.pal))
            for i in t:
                r = self.rid[i]
                t[i] = self.rstart[r] + int(np.clip(self.lvl[i] + n, 0, self.rlen[r] - 1))
            self._lut[n] = t.astype(np.uint8)
        return self._lut[n]

    def nearest(self, rgb):
        if rgb not in self.cache:
            d = [sum((a - b) ** 2 for a, b in zip(rgb, hex_rgb(c))) for c in self.pal]
            self.cache[rgb] = int(np.argmin(d))
        return self.cache[rgb]

    # ---- raw drawing (mirrored into the tag mask while an object is open)
    def arr(self):
        return np.array(self.im)

    def put(self, a):
        self.im.paste(Image.fromarray(a, 'L'))

    def rect(self, x0, y0, x1, y1, c):
        if x1 <= x0 or y1 <= y0:
            return
        self.d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=c)
        if self.tag:
            self.md.rectangle([x0, y0, x1 - 1, y1 - 1], fill=255)

    def poly(self, pts, c):
        self.d.polygon([(float(x), float(y)) for x, y in pts], fill=c)
        if self.tag:
            self.md.polygon([(float(x), float(y)) for x, y in pts], fill=255)

    def line(self, pts, c, w=1):
        self.d.line(pts, fill=c, width=w)
        if self.tag:
            self.md.line(pts, fill=255, width=w)

    def ell(self, x0, y0, x1, y1, c):
        self.d.ellipse([x0, y0, x1 - 1, y1 - 1], fill=c)
        if self.tag:
            self.md.ellipse([x0, y0, x1 - 1, y1 - 1], fill=255)

    def ring(self, x0, y0, x1, y1, c, width=2):
        self.d.ellipse([x0, y0, x1 - 1, y1 - 1], outline=c, width=width)
        if self.tag:
            self.md.ellipse([x0, y0, x1 - 1, y1 - 1], outline=255, width=width)

    def px(self, x, y, c):
        if 0 <= x < W and 0 <= y < H:
            self.im.putpixel((int(x), int(y)), c)
            if self.tag:
                self.mim.putpixel((int(x), int(y)), 255)

    def stamp(self, name, x, y, flip=False):
        img = PG.load_grid(GRIDS / f'{name}.grid.json')
        if flip:
            img = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        for sy in range(img.height):
            for sx in range(img.width):
                r, g, b, a = img.getpixel((sx, sy))
                if a:
                    self.px(x + sx, y + sy, self.nearest((r, g, b)))
        return img.width, img.height

    # ---- regions and shading
    @staticmethod
    def _mask(fn):
        m = Image.new('L', (W, H), 0)
        fn(ImageDraw.Draw(m))
        return np.array(m) > 0

    def m_poly(self, pts):
        return self._mask(lambda d: d.polygon([(float(x), float(y)) for x, y in pts], fill=255))

    def m_rect(self, x0, y0, x1, y1):
        return self._mask(lambda d: d.rectangle([x0, y0, x1 - 1, y1 - 1], fill=255))

    def m_ell(self, x0, y0, x1, y1):
        return self._mask(lambda d: d.ellipse([x0, y0, x1 - 1, y1 - 1], fill=255))

    def shade(self, mask, n, field=None):
        """Shift ramp level by n inside mask; field (0..1 array or scalar) selects pixels through Bayer dither."""
        sel = mask if field is None else mask & (BAY < field)
        a = self.arr()
        a[sel] = self.lut(n)[a[sel]]
        self.put(a)

    def noise(self, scale):
        g = self.rng.random((H // scale + 3, W // scale + 3)).astype(np.float32)
        big = np.array(Image.fromarray(g, 'F').resize(((W // scale + 3) * scale, (H // scale + 3) * scale), Image.Resampling.BICUBIC))
        return big[:H, :W]

    def mottle(self, mask, scale=9, lo=0.36, hi=0.64, amount=0.3):
        """Soft two-sided tone variation (dithered between neighbouring ramp steps)."""
        q = self.noise(scale) + (BAY - 0.5) * amount
        self.shade(mask & (q > hi), 1)
        self.shade(mask & (q < lo), -1)

    def speckle(self, mask, p, n=1, seed_shift=0):
        r = np.random.default_rng(int(self.rng.integers(1 << 30)) + seed_shift).random((H, W))
        self.shade(mask & (r < p), n)

    def ao(self, cx, cy, rx, ry, strength=2):
        """Contact shadow: dark core, dithered halo."""
        self.shade(self.m_ell(cx - rx, cy - ry, cx + rx, cy + ry), -strength)
        self.shade(self.m_ell(cx - rx - 6, cy - ry - 3, cx + rx + 6, cy + ry + 3) & ~self.m_ell(cx - rx, cy - ry, cx + rx, cy + ry), -1, 0.5)

    def glow(self, cx, cy, r, n=1, gamma=1.3, aspect=1.0, mask=None):
        d = np.sqrt(((XX - cx) / aspect) ** 2 + (YY - cy) ** 2) / r
        self.shade((d < 1) if mask is None else (d < 1) & mask, n, np.clip(1 - d, 0, 1) ** gamma)

    def vignette(self, strength=1.0):
        dx = np.abs(XX - W / 2) / (W / 2)
        dy = np.abs(YY - H / 2) / (H / 2)
        v = np.clip(np.maximum(dx ** 2.2, dy ** 2.6) * 1.15 * strength - 0.35, 0, 1)
        self.shade(v > 0, -1, v)
        self.shade(v > 0.55, -1, (v - 0.55) * 1.6)

    # ---- tagged objects with outline
    def begin(self):
        self.tag = True
        self.mim.paste(0, [0, 0, W, H])

    def end(self, oid=None, outline=True, pad=1):
        m = np.array(self.mim) > 0
        self.tag = False
        ring = np.zeros_like(m)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ring |= np.roll(np.roll(m, dy, 0), dx, 1)
        ring &= ~m
        if outline:
            a = self.arr()
            a[ring] = self.INK
            self.put(a)
        full = m | ring
        ys, xs = np.where(full)
        if oid and len(xs):
            self.boxes[oid] = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
        return m

    # ---- materials
    def wood(self, x0, y0, x1, y1, base=3, vertical=False, bevel=True):
        """Wood with grain streaks (+-1 level), occasional knots and a lit top/right bevel."""
        w, h = x1 - x0, y1 - y0
        lines, length = (w, h) if vertical else (h, w)
        lv = np.full((lines, length), base, dtype=np.int32)
        for i in range(lines):
            p, off = 0, int(self.rng.choice([-1, 0, 0, 1]))
            while p < length:
                seg = int(self.rng.integers(5, 22))
                lv[i, p:p + seg] += off + int(self.rng.choice([-1, 0, 0, 0, 1])) * (1 if self.rng.random() < .4 else 0)
                p += seg
        if vertical:
            lv = lv.T
        lv = np.clip(lv, 0, len(self.R['wood']) - 1)
        if bevel and w > 3 and h > 3:
            lv[0, :] += 1
            lv[:, -1] += 1
            lv[-1, :] -= 1
            lv[:, 0] -= 1
            lv = np.clip(lv, 0, len(self.R['wood']) - 1)
        tbl = np.array(self.R['wood'], dtype=np.uint8)
        a = self.arr()
        a[y0:y1, x0:x1] = tbl[lv]
        self.put(a)
        if self.tag:
            self.md.rectangle([x0, y0, x1 - 1, y1 - 1], fill=255)
        for _ in range(max(0, w * h // 900)):
            kx, ky = int(self.rng.integers(x0 + 2, max(x0 + 3, x1 - 3))), int(self.rng.integers(y0 + 2, max(y0 + 3, y1 - 3)))
            self.px(kx, ky, self.R['wood'][max(0, base - 2)])
            self.px(kx + (0 if vertical else 1), ky + (1 if vertical else 0), self.R['wood'][max(0, base - 1)])


def finish(cv, name, area_id, interact_boxes, exits, out_dir, preview):
    """Quantisation guard, save PNG + layout.json, optional preview."""
    pal = np.array([hex_rgb(c) for c in cv.pal], dtype=np.uint8)
    rgb = pal[cv.arr()]
    img = Image.fromarray(rgb, 'RGB')
    used = len(set(map(tuple, rgb.reshape(-1, 3).tolist())))
    assert img.size == (W, H) and used <= MAX_COLORS, f'{name}: {img.size} colours={used}'
    folder = AREAS / area_id
    folder.mkdir(parents=True, exist_ok=True)
    img.save(folder / f'{area_id}--phai.png', optimize=True)
    norm = lambda b: {'x': round(b[0] / W, 4), 'y': round(b[1] / H, 4), 'w': round((b[2] - b[0]) / W, 4), 'h': round((b[3] - b[1]) / H, 4)}
    layout = {
        'areaId': area_id,
        'size': {'w': W, 'h': H},
        'generatedBy': 'scripts/pixel/draw-c1-rooms.py',
        'interactables': {k: norm(v) for k, v in interact_boxes.items()},
        'exits': {k: {'x': round(v[0] / W, 4), 'y': round(v[1] / H, 4), 'dir': v[2]} for k, v in exits.items()},
    }
    (folder / 'layout.json').write_text(json.dumps(layout, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if preview:
        preview.mkdir(parents=True, exist_ok=True)
        scale = 2
        img.resize((W * scale, H * scale), Image.Resampling.NEAREST).save(preview / f'{name}-x2.png')
    return used


# ---------------------------------------------------------------------------------------------------------------
# Shared interior shell: one-point perspective, vanishing point VP, back wall x 64..576 / y 30..212.
# ---------------------------------------------------------------------------------------------------------------
VP = (320, 150)
Z0 = 14.0
BX, BY0, BY1 = 64, 30, 212


def fl(j, k, bx0=BX, step=32, yb=BY1):
    """Floor tile corner (j across, k toward the viewer) -> pixel."""
    s = Z0 / (Z0 - k)
    return (VP[0] + (bx0 + step * j - VP[0]) * s, VP[1] + (yb - VP[1]) * s)


def lw(x, v, bx=BX, by0=BY0, by1=BY1):
    """Left wall point: x px from the left edge, v 0 (top) .. 1 (floor line)."""
    t = (VP[0] - x) / (VP[0] - bx)
    top, bot = VP[1] + (by0 - VP[1]) * t, VP[1] + (by1 - VP[1]) * t
    return (x, top + v * (bot - top))


def rw(x, v, bx=BX, by0=BY0, by1=BY1):
    px_, py_ = lw(W - x, v, bx, by0, by1)
    return (x, py_)


def floor_tiles(cv, base=2, motif=True, kmax=12):
    T = cv.R['tile']
    cv.d.rectangle([0, BY1 - 2, W, H], fill=T[0])
    lv = {}
    for k in range(0, kmax):
        for j in range(-14, 31):
            a, b, c, d = fl(j, k), fl(j + 1, k), fl(j + 1, k + 1), fl(j, k + 1)
            if max(a[0], b[0], c[0], d[0]) < -2 or min(a[0], b[0], c[0], d[0]) > W + 2:
                continue
            lv[(j, k)] = int(np.clip(base + cv.rng.choice([-1, 0, 0, 0, 1]), 0, 4))
            cv.poly([a, b, c, d], T[lv[(j, k)]])
    for (j, k), n in lv.items():
        a, b, c, d = fl(j, k), fl(j + 1, k), fl(j + 1, k + 1), fl(j, k + 1)
        hi = T[min(4, n + 1)]
        cv.line([(a[0] + 1, a[1] + 1), (b[0] - 1, b[1] + 1)], hi)
        cv.line([(b[0] - 1, b[1] + 2), (c[0] - 1, c[1] - 1)], hi)
        if motif and (j + k) % 2 == 0 and k >= 1:
            cx, cy = (a[0] + c[0]) / 2, (a[1] + c[1]) / 2
            w, h = (b[0] - a[0]) * 0.16, (d[1] - a[1]) * 0.24
            cv.poly([(cx, cy - h), (cx + w, cy), (cx, cy + h), (cx - w, cy)], T[max(0, n - 1)])
            cv.poly([(cx, cy - h * .5), (cx + w * .5, cy), (cx, cy + h * .5), (cx - w * .5, cy)], T[min(4, n + 1)])
    for j in range(-14, 31):
        cv.line([fl(j, 0), fl(j, kmax)], T[0])
    for k in range(0, kmax + 1):
        cv.line([fl(-14, k), fl(30, k)], T[0])
    floor = cv.m_poly([(BX, BY1), (W - BX, BY1), (W, 227), (W, H), (0, H), (0, 227)])
    cv.speckle(floor, .05, 1)
    cv.speckle(floor, .05, -1)
    cv.mottle(floor, 12, .24, .76, .25)
    return floor


def floor_light(cv, quad, mullions=(0.33, 0.66), bands=(0.34, 0.68), gain=2, core_gain=1):
    """Window light on the floor. quad = BL, BR, FR, FL in tile coords (j,k)."""
    bl, br, fr, fl_ = quad
    A = lambda u, v: fl(*[(1 - v) * ((1 - u) * bl[i] + u * br[i]) + v * ((1 - u) * fl_[i] + u * fr[i]) for i in (0, 1)])
    patch = cv.m_poly([A(0, 0), A(1, 0), A(1, 1), A(0, 1)])
    dark = np.zeros((H, W), bool)
    for u in mullions:
        dark |= cv._mask(lambda d: d.line([A(u, 0), A(u, 1)], fill=255, width=3))
    for v in bands:
        dark |= cv._mask(lambda d: d.line([A(0, v), A(1, v)], fill=255, width=3))
    lit = patch & ~dark
    core = cv.m_poly([A(.1, .08), A(.9, .08), A(.9, .75), A(.1, .75)]) & lit
    cv.shade(lit, gain)
    cv.shade(core, core_gain, np.clip(1.25 - (YY - BY1) / 150.0, .25, 1))
    halo = cv._mask(lambda d: d.polygon([A(-.03, -.03), A(1.03, -.03), A(1.03, 1.05), A(-.03, 1.05)], fill=255)) & ~lit & ~dark
    cv.shade(halo, 1, .45)
    return patch


def cast_shadow(cv, x0, x1, y, dx=-34, dy=12, n=-1, field=.85):
    cv.shade(cv.m_poly([(x0, y), (x1, y), (x1 + dx, y + dy), (x0 + dx, y + dy)]), n, field)


def beam_ceiling(cv, tint=2):
    """Rafters + transverse beams in the top 30 px, header beam and carved frieze across the back wall."""
    Wd = cv.R['wood']
    cv.poly([(0, 0), (W, 0), (W - BX, BY0), (BX, BY0)], Wd[0])
    for x in range(BX - 64, W - BX + 65, 32):
        t = (x - VP[0]) / (VP[0] - BX + 1e-9)
        top = (VP[0] + (x - VP[0]) * 1.25, 0)
        cv.line([(x, BY0), top], Wd[tint - 1], 2)
    cv.wood(0, 5, W, 12, base=tint - 1, bevel=True)
    cv.wood(BX, BY0 - 1, W - BX, BY0 + 15, base=tint, bevel=True)
    # carved frieze: repeating lozenge lattice
    cv.rect(BX, BY0 + 15, W - BX, BY0 + 29, Wd[1])
    for x in range(BX + 4, W - BX - 6, 12):
        cv.poly([(x + 6, BY0 + 17), (x + 11, BY0 + 22), (x + 6, BY0 + 27), (x + 1, BY0 + 22)], Wd[3])
        cv.poly([(x + 6, BY0 + 20), (x + 8, BY0 + 22), (x + 6, BY0 + 24), (x + 4, BY0 + 22)], Wd[1])
    cv.line([(BX, BY0 + 29), (W - BX, BY0 + 29)], Wd[0])


def back_wall(cv, base=2, dado=True, light_bias=0):
    Wl, Wd = cv.R['wall'], cv.R['wood']
    cv.rect(BX, BY0, W - BX, BY1, Wl[base])
    wall = cv.m_rect(BX, BY0, W - BX, BY1)
    cv.mottle(wall, 6, .17, .83, .14)
    cv.speckle(wall, .03, 1)
    cv.speckle(wall, .03, -1)
    # ceiling shadow falls over the top of the wall
    cv.shade(wall, -1, np.clip(1.15 - (YY - BY0) / 70.0, 0, 1))
    if dado:
        cv.wood(BX, 168, W - BX, BY1, base=2, bevel=True)
        for x in range(BX, W - BX, 26):
            cv.line([(x, 168), (x, BY1 - 1)], Wd[0])
        cv.line([(BX, 168), (W - BX, 168)], Wd[4])
        cv.line([(BX, 167), (W - BX, 167)], Wd[0])
        cv.shade(cv.m_rect(BX, 170, W - BX, BY1), -1, np.clip((YY - 190) / 22.0, 0, .9))
    return wall


def side_walls(cv, left_base=3, right_base=1):
    Wl, Wd = cv.R['wall'], cv.R['wood']
    for side, base in (('l', left_base), ('r', right_base)):
        f = (lambda x, v: lw(x, v)) if side == 'l' else (lambda x, v: rw(W - x, v))
        poly = [f(0, 0), f(BX, 0), f(BX, 1), f(0, 1)]
        cv.poly(poly, Wl[base])
        m = cv.m_poly(poly)
        cv.mottle(m, 6, .17, .83, .14)
        cv.speckle(m, .03, 1)
        # horizontal planks of the wainscot (perspective lines)
        for v in (0.64, 0.66):
            cv.line([f(0, v), f(BX, v)], Wd[0 if v < .65 else 4])
        cv.poly([f(0, 0.66), f(BX, 0.66), f(BX, 1), f(0, 1)], Wd[2])
        cv.shade(cv.m_poly([f(0, 0.66), f(BX, 0.66), f(BX, 1), f(0, 1)]), -1, .35)
        for x in range(8, BX, 14):
            cv.line([f(x, 0.66), f(x, 1)], Wd[1])
        # post at the far edge and top plate
        cv.poly([f(BX - 8, 0), f(BX, 0), f(BX, 1), f(BX - 8, 1)], Wd[2 if side == 'l' else 1])
        cv.line([f(BX - 8, 0), f(BX - 8, 1)], Wd[0])
        cv.poly([f(0, 0), f(BX, 0), f(BX, 0.06), f(0, 0.06)], Wd[1])
        cv.shade(m, -1, np.clip(1.0 - np.abs(XX - (BX if side == 'l' else W - BX)) / 90.0, 0, 1) * .0 + (.55 if side == 'r' else 0))
    # outer corner posts of the back wall
    for x0 in (BX - 2, W - BX - 10):
        cv.wood(x0, BY0 - 2, x0 + 12, BY1, base=2, vertical=True)


# ---------------------------------------------------------------------------------------------------------------
# Chapter 1 / s1: Gian buong det khoa kin (weaving room)
# ---------------------------------------------------------------------------------------------------------------
S1_RAMPS = ['ink', 'wood', 'wall', 'tile', 'ind', 'red', 'gold', 'cream']


def silk_skeins(cv, x0, x1, ytop, colors):
    R, Wd = cv.R, cv.R['wood']
    cv.rect(x0, ytop, x1, ytop + 4, Wd[1])
    cv.line([(x0, ytop), (x1 - 1, ytop)], Wd[4])
    cv.line([(x0 + 6, ytop), (x0 + 6, BY0 + 30)], Wd[0])
    cv.line([(x1 - 7, ytop), (x1 - 7, BY0 + 30)], Wd[0])
    x = x0 + 10
    for name in colors:
        c = R[name]
        ln = int(cv.rng.integers(46, 62))
        cv.ell(x, ytop + 4, x + 12, ytop + 4 + ln, c[1])
        cv.ell(x + 3, ytop + 8, x + 9, ytop + ln, c[0])
        cv.line([(x + 11, ytop + 12), (x + 11, ytop + ln - 8)], c[-1])
        cv.line([(x + 6, ytop + 4), (x + 6, ytop + 8)], c[0])
        cv.speckle(cv.m_ell(x, ytop + 4, x + 12, ytop + 4 + ln), .12, -1)
        x += 16


def spool_shelf(cv, x0, x1, y):
    R, Wd = cv.R, cv.R['wood']
    cv.wood(x0, y + 10, x1, y + 14, base=3)
    cv.wood(x0 + 2, y + 14, x0 + 6, y + 24, base=1, vertical=True)
    cv.wood(x1 - 6, y + 14, x1 - 2, y + 24, base=1, vertical=True)
    cv.shade(cv.m_rect(x0 - 4, y + 14, x1 + 4, y + 20), -1, .5)
    names = ['ind', 'red', 'gold', 'cream', 'ind', 'cream', 'gold', 'red']
    x = x0 + 5
    i = 0
    while x + 8 < x1 - 3:
        c = R[names[i % len(names)]]
        cv.rect(x, y, x + 7, y + 10, c[1])
        cv.rect(x, y, x + 1, y + 10, c[0])
        cv.rect(x + 6, y, x + 7, y + 10, c[-1] if len(c) > 2 else c[1])
        cv.rect(x - 1, y - 1, x + 8, y + 1, Wd[1])
        cv.rect(x - 1, y + 9, x + 8, y + 11, Wd[1])
        x += 10
        i += 1


def lamp(cv, x, y):
    R, Wd = cv.R, cv.R['wood']
    cv.line([(x, BY0 + 30), (x, y)], R['ind'][1])
    cv.begin()
    cv.rect(x - 8, y, x + 8, y + 3, R['gold'][0])
    cv.rect(x - 7, y + 3, x + 7, y + 17, R['cream'][2])
    cv.rect(x - 4, y + 5, x + 4, y + 14, R['gold'][2])
    cv.rect(x - 8, y + 17, x + 8, y + 20, R['gold'][0])
    cv.end(outline=True)
    cv.glow(x, y + 12, 52, 1, 1.4, 1.1, cv.m_rect(BX, BY0, W - BX, BY1))
    cv.glow(x, y + 12, 22, 1, 1.0)


def window_s1(cv):
    R, Wd = cv.R, cv.R['wood']
    ox0, oy0, ox1, oy1 = 330, 70, 452, 170
    cv.begin()
    cv.wood(322, 62, 460, 182, base=2)
    cv.rect(ox0, oy0, ox1, oy1, R['gold'][2])
    cv.end('hitbox-back-window')
    # bright outside: noon haze (cream core, gold toward the frame)
    cv.rect(ox0, oy0, ox1, oy1, R['cream'][2])
    cv.shade(cv.m_rect(ox0, oy0, ox1, oy1), -1, np.clip(np.abs(XX - 391) / 70.0 - .15, 0, 1) * .9)
    cv.shade(cv.m_rect(ox0, oy0, ox1, oy1), -1, np.clip((YY - 150) / 25.0, 0, 1) * .5)
    # closed shutters: horizontal slats, light leaks between them
    for x0, x1 in ((ox0, 389), (393, ox1)):
        for y in range(oy0 + 2, oy1 - 3, 7):
            cv.wood(x0 + 2, y, x1 - 2, y + 4, base=3)
            cv.line([(x0 + 2, y + 4), (x1 - 3, y + 4)], R['gold'][0])
        cv.wood(x0, oy0, x0 + 3, oy1, base=2, vertical=True)
        cv.wood(x1 - 3, oy0, x1, oy1, base=2, vertical=True)
    cv.wood(389, oy0, 393, oy1, base=1, vertical=True)
    # light bleeds past the shutters onto the frame
    cv.shade(cv.m_rect(322, 62, 460, 182), 1, np.clip(1 - np.abs(XX - 391) / 90.0, 0, 1) * .4)
    # outside latch bar (the thin 'then' the plot uses): iron bar + hook across the shutters
    cv.begin()
    cv.rect(366, 117, 417, 122, R['ind'][1])
    cv.rect(366, 117, 417, 118, R['ind'][2])
    cv.rect(412, 122, 417, 128, R['ind'][1])
    cv.end(outline=True)
    # sill and brackets
    cv.wood(316, 180, 466, 190, base=4)
    cv.line([(316, 190), (466, 190)], Wd[0])
    cv.wood(326, 190, 334, 202, base=1, vertical=True)
    cv.wood(448, 190, 456, 202, base=1, vertical=True)
    cv.shade(cv.m_rect(300, 190, 480, 206), -1, np.clip(.8, 0, 1))
    cv.glow(391, 122, 105, 1, 1.5, 1.35, cv.m_rect(BX, BY0 + 30, W - BX, 168) & ~cv.m_rect(322, 62, 460, 182))


def door_s1(cv, chain=True, oid='hitbox-front-door'):
    R, Wd = cv.R, cv.R['wood']
    xs = [11, 22, 33, 45, 58]
    v0 = 0.27
    cv.begin()
    cv.poly([lw(9, v0 - 0.03), lw(60, v0 - 0.03), lw(60, 1), lw(9, 1)], Wd[1])
    for i in range(len(xs) - 1):
        a, b = xs[i], xs[i + 1]
        cv.poly([lw(a + 1, v0), lw(b, v0), lw(b, 1), lw(a + 1, 1)], Wd[2 + i % 2])
        cv.line([lw(a, v0), lw(a, 1)], Wd[0])
        cv.line([lw(a + 2, v0 + .01), lw(a + 2, 0.98)], Wd[4 - i % 2] if i % 2 == 0 else Wd[3])
    for v in (0.40, 0.82):
        cv.poly([lw(11, v - 0.035), lw(58, v - 0.035), lw(58, v + 0.035), lw(11, v + 0.035)], Wd[1])
        cv.poly([lw(11, v - 0.01), lw(58, v - 0.01), lw(58, v + 0.012), lw(11, v + 0.012)], R['ind'][1])
        for x in (14, 30, 46, 55):
            cv.px(*lw(x, v), R['ind'][3])
    if not chain:  # unlocked door: iron ring pull instead of the chain
        hx, hy = lw(50, 0.6)
        cv.ring(int(hx) - 4, int(hy) - 4, int(hx) + 4, int(hy) + 4, R['gold'][1], 1)
        cv.end(oid)
        cv.line([lw(12, 0.995), lw(57, 0.995)], R['gold'][2])
        return
    # heavy chain across the door, hooped round a padlock
    pts = [lw(11, 0.52), lw(58, 0.66)]
    for t in np.linspace(0, 1, 15):
        x = pts[0][0] + (pts[1][0] - pts[0][0]) * t
        y = pts[0][1] + (pts[1][1] - pts[0][1]) * t
        cv.rect(int(x) - 2, int(y) - 1, int(x) + 3, int(y) + 2, R['ind'][2] if int(t * 15) % 2 else R['ind'][0])
        cv.px(int(x), int(y), R['ind'][3])
    lx, ly = lw(36, 0.62)
    cv.rect(int(lx) - 5, int(ly) - 2, int(lx) + 5, int(ly) + 9, R['gold'][1])
    cv.rect(int(lx) - 5, int(ly) - 2, int(lx) + 5, int(ly) - 1, R['gold'][2])
    cv.rect(int(lx) - 3, int(ly) - 7, int(lx) + 3, int(ly) - 2, R['ind'][1])
    cv.rect(int(lx) - 1, int(ly) + 2, int(lx) + 1, int(ly) + 6, R['ink'][0])
    cv.end(oid)
    # a thread of light under the door
    cv.line([lw(12, 0.995), lw(57, 0.995)], R['gold'][2])


def loom_s1(cv):
    R, Wd = cv.R, cv.R['wood']
    cv.ao(150, 261, 82, 7, 2)
    cast_shadow(cv, 84, 214, 262, -44, 10, -1, .9)
    cv.begin()
    # frame: two posts, top beam, breast beam, cloth roll
    cv.wood(82, 150, 93, 263, base=2, vertical=True)
    cv.wood(204, 150, 215, 263, base=3, vertical=True)
    cv.wood(78, 163, 220, 174, base=3)
    cv.wood(93, 150, 204, 156, base=3)
    cv.wood(86, 160, 94, 172, base=1)
    cv.wood(203, 160, 211, 172, base=2)
    cv.rect(100, 205, 198, 207, R['wood'][1])
    cv.rect(100, 213, 198, 215, R['wood'][1])
    cv.rect(100, 205, 102, 215, R['wood'][1])
    cv.rect(196, 205, 198, 215, R['wood'][1])
    cv.wood(78, 252, 220, 258, base=2)
    # warp threads (alternating pale / lighter) between beams
    for x in range(95, 203, 2):
        cv.line([(x, 175), (x, 223)], R['cream'][1] if (x // 2) % 2 else R['cream'][0])
    for x in range(96, 203, 4):
        cv.line([(x, 202), (x, 222)], R['cream'][2])
    # woven cloth: indigo twill with gold borders
    cv.rect(95, 222, 203, 250, R['ind'][1])
    for y in range(222, 250, 2):
        for x in range(95 + (y // 2) % 2, 203, 2):
            cv.px(x, y, R['ind'][2])
    for x in (98, 100, 198, 200):
        cv.line([(x, 222), (x, 249)], R['gold'][1])
    for i in range(7):
        cx = 112 + i * 13
        cv.poly([(cx, 229), (cx + 5, 236), (cx, 243), (cx - 5, 236)], R['gold'][1])
        cv.poly([(cx, 232), (cx + 2, 236), (cx, 240), (cx - 2, 236)], R['ind'][0])
    cv.rect(95, 222, 203, 224, R['cream'][2])
    # treadles
    cv.wood(108, 260, 178, 264, base=2)
    cv.wood(124, 264, 194, 267, base=3)
    cv.ell(76, 249, 88, 262, Wd[4])
    cv.ell(210, 249, 222, 262, Wd[3])
    # the shuttle resting on the top beam
    cv.stamp('con-thoi-go-mun', 138, 144)
    cv.end('hitbox-loom-shuttle')
    # warp-thread sheen and ambient light from the window side (right)
    cv.shade(cv.m_rect(204, 164, 222, 262), 1, .45)


def spinning_wheel(cv):
    """Silk reeling wheel (guong quay to) standing against the back wall, right of the window."""
    R, Wd = cv.R, cv.R['wood']
    cv.ao(488, 238, 30, 4, 2)
    cv.begin()
    cv.wood(462, 232, 514, 239, base=2)
    cv.wood(468, 200, 475, 234, base=1, vertical=True)
    cv.wood(500, 200, 507, 234, base=2, vertical=True)
    cv.ring(463, 178, 513, 228, Wd[3], 4)
    cv.ring(466, 181, 510, 225, Wd[2], 1)
    for a in range(0, 360, 45):
        t = np.radians(a)
        cv.line([(488, 203), (488 + 22 * np.cos(t), 203 + 22 * np.sin(t))], Wd[4], 1)
    cv.ell(483, 198, 494, 209, Wd[4])
    cv.ell(486, 201, 491, 206, Wd[1])
    cv.line([(494, 203), (520, 218)], Wd[3], 2)
    cv.ell(516, 215, 524, 223, Wd[4])
    for a in range(10, 360, 40):
        t = np.radians(a)
        cv.px(int(488 + 24 * np.cos(t)), int(203 + 24 * np.sin(t)), R['cream'][2])
    cv.end(outline=True)


def porridge_s1(cv):
    R, Wd = cv.R, cv.R['wood']
    # woven mat under the little tray
    cv.poly([(262, 286), (372, 286), (384, 268), (250, 268)][::-1], R['gold'][0])
    for i, x in enumerate(range(262, 374, 6)):
        t = i % 2
        cv.line([(x, 286), (x + 6 - 6 * (286 - 268) / 18 * 0, 268)], R['gold'][1] if t else R['gold'][0])
    cv.line([(262, 286), (372, 286)], R['ink'][0])
    cv.ao(314, 266, 32, 4, 2)
    cv.begin()
    for x in (294, 330):
        cv.wood(x, 256, x + 5, 268, base=1, vertical=True)
    cv.ell(284, 246, 346, 262, Wd[2])
    cv.ell(286, 246, 344, 258, Wd[4])
    cv.ell(290, 248, 340, 256, Wd[3])
    cv.stamp('chen-chao-nguoi', 305, 238)
    # spoon and a pair of chopsticks beside the bowl
    cv.line([(330, 253), (342, 249)], R['cream'][1])
    cv.line([(330, 255), (343, 251)], R['cream'][0])
    cv.end('hitbox-cold-porridge')


def cocoon_basket(cv):
    R = cv.R
    cv.ao(248, 247, 24, 4, 2)
    cv.begin()
    cv.ell(228, 232, 270, 250, R['wood'][2])
    cv.ell(230, 230, 268, 244, R['wood'][3])
    for i in range(46):
        x = int(cv.rng.integers(234, 264))
        y = int(cv.rng.integers(228, 241))
        cv.ell(x, y, x + 4, y + 3, R['cream'][1 + i % 2])
    cv.end(outline=True)
    for x in range(232, 268, 4):
        cv.px(x, 247, R['wood'][1])
        cv.px(x + 1, 249, R['wood'][1])


def belt_rack_s1(cv):
    R, Wd = cv.R, cv.R['wood']
    cv.ao(564, 311, 46, 6, 2)
    cast_shadow(cv, 524, 604, 311, -40, 11, -1, .9)
    cv.begin()
    cv.wood(528, 194, 537, 312, base=2, vertical=True)
    cv.wood(591, 194, 600, 312, base=3, vertical=True)
    cv.wood(520, 304, 548, 312, base=3)
    cv.wood(580, 304, 608, 312, base=3)
    cv.wood(524, 192, 604, 201, base=4)
    cv.ell(518, 188, 528, 200, Wd[4])
    cv.ell(600, 188, 610, 200, Wd[3])
    cv.wood(530, 262, 598, 267, base=2)
    # silk belts hanging from the bar
    spec = [('ind', 1, 94), ('red', 1, 70), ('gold', 1, 100), ('cream', 1, 78), ('ind', 2, 86), ('red', 0, 64)]
    x = 539
    for i, (nm, lv, ln) in enumerate(spec):
        c = R[nm]
        base = c[min(lv, len(c) - 1)]
        for y in range(201, 201 + ln):
            sway = int(round(1.3 * np.sin(y / 9.0 + i * 1.7)))
            cv.rect(x + sway, y, x + sway + 6, y + 1, base)
            cv.px(x + sway, y, c[max(0, lv - 1)])
            cv.px(x + sway + 5, y, c[min(len(c) - 1, lv + 1)])
            if y % 11 < 2 and nm != 'cream':
                cv.px(x + sway + 2, y, c[min(len(c) - 1, lv + 1)])
                cv.px(x + sway + 3, y, c[min(len(c) - 1, lv + 1)])
        y1 = 201 + ln
        sway = int(round(1.3 * np.sin(y1 / 9.0 + i * 1.7)))
        for t in range(3):
            cv.line([(x + sway + 1 + t * 2, y1), (x + sway + 1 + t * 2, y1 + 4)], c[max(0, lv - 1)])
        cv.rect(x - 1, 199, x + 8, 203, Wd[1])
        x += 9
    cv.end('hitbox-belt-rack')
    # light from the right edges of the posts
    cv.shade(cv.m_rect(596, 194, 601, 312), 1, .6)


def window_light_s1(cv, floor):
    cv.shade(floor, -1, .6)  # ambient dimming, so the sun patch reads as light
    floor_light(cv, [(8.2, 0.0), (11.7, 0.0), (8.4, 5.6), (3.4, 5.4)])
    # volumetric shaft in the air between the window and its patch (dithered, drawn before the furniture)
    cv.shade(cv.m_poly([(326, 184), (456, 184), (336, 250), (92, 250)]), 1, .22)
    cv.shade(cv.m_poly([(340, 184), (440, 184), (352, 236), (190, 236)]), 1, .18)


def draw_s1():
    cv = Cv(S1_RAMPS, 101)
    floor = floor_tiles(cv, base=2)
    wall = back_wall(cv, base=2)
    beam_ceiling(cv, 2)
    side_walls(cv, left_base=2, right_base=1)
    silk_skeins(cv, 96, 222, BY0 + 30, ['cream', 'gold', 'ind', 'cream', 'red', 'gold', 'ind'])
    spool_shelf(cv, 468, 566, 96)
    spool_shelf(cv, 468, 566, 134)
    lamp(cv, 264, 82)
    window_s1(cv)
    door_s1(cv)
    window_light_s1(cv, floor)
    spinning_wheel(cv)
    porridge_s1(cv)
    cocoon_basket(cv)
    loom_s1(cv)
    belt_rack_s1(cv)
    cv.vignette(0.9)
    ex = {'window': (391, 124, 'up')}
    return cv, 'c1-s1-buong-det-khoa-kin', ex


# ---------------------------------------------------------------------------------------------------------------
# Chapter 1 / s2: Gian nha tho ho Bui (ancestral hall)
# ---------------------------------------------------------------------------------------------------------------
S2_RAMPS = ['ink', 'wood', 'wall', 'tile', 'ind', 'red', 'gold', 'cream']


def glyph_column(cv, x, y, n, c, cell=9, w=7):
    """Abstract brush-stroke 'characters' (no legible text): n cells stacked down from y."""
    for i in range(n):
        cy = y + i * cell
        for _ in range(int(cv.rng.integers(2, 4))):
            if cv.rng.random() < .5:
                yy = cy + int(cv.rng.integers(1, cell - 2))
                cv.line([(x, yy), (x + int(cv.rng.integers(3, w)), yy)], c)
            else:
                xx = x + int(cv.rng.integers(1, w - 1))
                cv.line([(xx, cy + 1), (xx, cy + int(cv.rng.integers(3, cell - 1)))], c)
        cv.px(x + int(cv.rng.integers(0, w)), cy + int(cv.rng.integers(0, cell - 1)), c)


def pillar(cv, x0, x1, y0, y1):
    """Round hall column: cylinder shading dithered, light from the right, stone-like plinth."""
    Wd, Wl = cv.R['wood'], cv.R['wall']
    w = x1 - x0
    t = (np.arange(w) + .5) / w
    prof = 1.0 + 3.4 * np.exp(-((t - .68) / .33) ** 2)
    q = prof[None, :] + (BAY[y0:y1, x0:x1] - .5) * .9
    cols = np.clip(np.floor(q).astype(np.int32), 0, 5)
    grain = cv.rng.random((1, w)) < .12
    cols = np.clip(cols - grain.astype(np.int32), 0, 5)
    a = cv.arr()
    a[y0:y1, x0:x1] = np.array(Wd, np.uint8)[cols]
    cv.put(a)
    if cv.tag:
        cv.md.rectangle([x0, y0, x1 - 1, y1 - 1], fill=255)
    cv.rect(x0 - 3, y0 - 5, x1 + 3, y0 + 3, Wd[1])
    cv.rect(x0 - 3, y0 - 5, x1 + 3, y0 - 4, Wd[4])
    cv.rect(x0 - 5, y1 - 2, x1 + 5, y1 + 5, Wl[2])
    cv.rect(x0 - 5, y1 - 2, x1 + 5, y1 - 1, Wl[4])
    cv.rect(x0 - 5, y1 + 3, x1 + 5, y1 + 6, Wl[0])


def couplet(cv, x, y0, y1, w=13):
    """Red lacquer parallel sentence board with gold glyph marks."""
    R = cv.R
    cv.rect(x, y0, x + w, y1, R['red'][0])
    cv.rect(x + 1, y0 + 1, x + w - 1, y1 - 1, R['red'][1])
    cv.rect(x + 1, y0 + 1, x + 2, y1 - 1, R['gold'][1])
    cv.rect(x + w - 2, y0 + 1, x + w - 1, y1 - 1, R['gold'][1])
    cv.shade(cv.m_rect(x + 2, y0 + 1, x + w - 2, y1 - 1), 1, .25)
    glyph_column(cv, x + 3, y0 + 5, (y1 - y0 - 8) // 9, R['gold'][2], 9, w - 6)


def lantern(cv, x, y):
    R = cv.R
    cv.line([(x, BY0 + 29), (x, y)], R['gold'][0])
    cv.begin()
    cv.stamp('den-long-do', x - 6, y)
    cv.end(outline=True)
    cv.glow(x, y + 8, 22, 1, 1.2)


def hall_window(cv):
    """Latticed window high in the right wall: the source of the sun patch."""
    R, Wd = cv.R, cv.R['wood']
    x0, x1, v0, v1 = 582, 632, .10, .46
    quad = [rw(x0, v0), rw(x1, v0), rw(x1, v1), rw(x0, v1)]
    cv.begin()
    cv.poly([rw(x0 - 3, v0 - .03), rw(x1 + 3, v0 - .03), rw(x1 + 3, v1 + .03), rw(x0 - 3, v1 + .03)], Wd[1])
    cv.poly(quad, R['cream'][2])
    cv.end(outline=True)
    cv.poly(quad, R['cream'][2])
    cv.shade(cv.m_poly(quad), -1, np.clip((XX - 600) / 40.0, 0, 1) * .5)
    for x in range(x0 + 6, x1, 8):
        cv.line([rw(x, v0), rw(x, v1)], Wd[1], 2)
    for v in np.linspace(v0, v1, 5)[1:-1]:
        cv.line([rw(x0, v), rw(x1, v)], Wd[1], 2)
    for x in range(x0 + 7, x1, 8):
        cv.line([rw(x, v0 + .01), rw(x, v1 - .01)], Wd[3])


def shrine_s2(cv):
    """Ancestor altar: lacquered shrine cabinet (kham tho) over a carved altar table, tablets inside."""
    R, Wd = cv.R, cv.R['wood']
    cv.ao(320, 250, 118, 7, 2)
    cv.begin()
    # --- table (sap tho)
    cv.wood(210, 196, 430, 207, base=4)
    cv.rect(210, 207, 430, 209, R['gold'][0])
    cv.rect(214, 209, 426, 246, R['red'][0])
    cv.rect(216, 210, 424, 245, R['red'][1])
    for x in range(222, 414, 48):
        cv.rect(x, 214, x + 40, 241, R['gold'][1])
        cv.rect(x + 2, 216, x + 38, 239, R['red'][0])
        cv.poly([(x + 20, 219), (x + 32, 227.5), (x + 20, 236), (x + 8, 227.5)], R['gold'][1])
        cv.poly([(x + 20, 223), (x + 26, 227.5), (x + 20, 232), (x + 14, 227.5)], R['red'][1])
    cv.shade(cv.m_rect(216, 210, 424, 245), 1, np.clip((XX - 330) / 100.0, 0, 1) * .35)
    cv.wood(212, 209, 222, 252, base=1, vertical=True)
    cv.wood(418, 209, 428, 252, base=2, vertical=True)
    cv.wood(208, 246, 432, 252, base=2)
    # --- shrine body
    cv.rect(234, 106, 406, 196, Wd[0])
    cv.rect(246, 112, 394, 196, Wd[1])
    cv.wood(234, 106, 246, 196, base=2, vertical=True)
    cv.wood(394, 106, 406, 196, base=3, vertical=True)
    cv.rect(234, 106, 246, 110, R['red'][1])
    # open doors (red leaves with gold lozenge)
    for x0, x1 in ((246, 262), (378, 394)):
        cv.rect(x0, 112, x1, 190, R['red'][0])
        cv.rect(x0 + 2, 114, x1 - 2, 188, R['red'][1])
        cv.poly([((x0 + x1) / 2, 136), (x1 - 3, 151), ((x0 + x1) / 2, 166), (x0 + 3, 151)], R['gold'][1])
        cv.poly([((x0 + x1) / 2, 142), (x1 - 6, 151), ((x0 + x1) / 2, 160), (x0 + 6, 151)], R['red'][0])
    # inner altar steps and ancestor tablets
    cv.rect(262, 168, 378, 196, Wd[2])
    cv.rect(262, 168, 378, 170, Wd[4])
    cv.rect(262, 186, 378, 188, Wd[1])
    for i, x in enumerate(range(268, 366, 16)):
        cv.stamp('bai-vi', x, 150 if i != 3 else 146)
    # --- cornice: curved eave with gold edge, carved fascia
    cv.poly([(224, 98), (232, 84), (248, 80), (392, 80), (408, 84), (416, 98), (406, 106), (234, 106)], R['red'][1])
    cv.poly([(224, 98), (232, 84), (238, 82), (236, 96)], R['gold'][1])
    cv.poly([(416, 98), (408, 84), (402, 82), (404, 96)], R['gold'][1])
    cv.line([(234, 105), (406, 105)], R['gold'][1])
    cv.line([(238, 82), (402, 82)], R['gold'][2])
    for x in range(250, 392, 14):
        cv.poly([(x, 93), (x + 6, 88), (x + 12, 93), (x + 6, 99)], R['gold'][1])
        cv.poly([(x + 3, 93), (x + 6, 91), (x + 9, 93), (x + 6, 96)], R['red'][0])
    # offerings on the table: candles, fruit tray (left), lotus vase (right)
    for x in (284, 356):
        cv.rect(x - 3, 190, x + 3, 196, R['gold'][1])
        cv.rect(x - 2, 170, x + 2, 190, R['cream'][1])
        cv.rect(x - 2, 170, x - 1, 190, R['cream'][0])
        cv.rect(x, 166, x + 1, 170, R['red'][2])
        cv.px(x, 165, R['gold'][2])
    cv.ell(224, 184, 270, 198, R['gold'][1])
    cv.rect(240, 186, 254, 194, R['gold'][0])
    for fx, fy, nm in [(230, 176, 'red'), (240, 172, 'gold'), (251, 174, 'red'), (260, 177, 'gold'), (245, 165, 'red'), (236, 181, 'gold'), (254, 182, 'red')]:
        cv.ell(fx, fy, fx + 9, fy + 9, R[nm][1])
        cv.px(fx + 6, fy + 2, R[nm][2])
        cv.px(fx + 2, fy + 7, R[nm][0])
    cv.rect(390, 180, 402, 196, R['ind'][1])
    cv.rect(392, 180, 394, 196, R['ind'][2])
    cv.rect(388, 196, 404, 198, R['ind'][0])
    for i, (lx, ly) in enumerate([(396, 160), (388, 166), (404, 164)]):
        cv.line([(396, 180), (lx, ly + 6)], R['gold'][0])
        cv.ell(lx - 5, ly, lx + 6, ly + 8, R['cream'][1 + i % 2])
        cv.px(lx, ly + 3, R['gold'][1])
    cv.end('hitbox-ancestor-altar')
    cv.glow(284, 168, 26, 1, 1.0)
    cv.glow(356, 168, 26, 1, 1.0)


def burner_s2(cv):
    R = cv.R
    cv.begin()
    cv.rect(296, 197, 344, 203, R['wood'][4])
    cv.rect(296, 197, 344, 198, R['gold'][2])
    cv.rect(296, 202, 344, 204, R['wood'][1])
    cv.stamp('lu-huong', 310, 181)
    cv.end('hitbox-incense-burner')
    cv.shade(cv.m_rect(296, 180, 344, 204), 1, .15)
    # smoke: a thin dithered plume curling up in front of the shrine interior
    for y in range(176, 100, -1):
        x = int(320 + 7 * np.sin((176 - y) / 11.0) + 4 * np.sin((176 - y) / 5.0 + 1))
        if (x + y) % 2 == 0 or y > 150:
            cv.px(x, y, R['cream'][1 if y > 130 else 0])
        if y > 135 and y % 3 == 0:
            cv.px(x + 1, y, R['cream'][0])


def plaque_s2(cv):
    """The new honour board (bien 'tiet hanh kha phong') on its stand: bright lacquer in a dim old hall."""
    R, Wd = cv.R, cv.R['wood']
    cv.ao(501, 290, 44, 5, 2)
    cast_shadow(cv, 458, 544, 290, -38, 10, -1, .9)
    cv.begin()
    cv.wood(468, 238, 477, 292, base=2, vertical=True)
    cv.wood(525, 238, 534, 292, base=3, vertical=True)
    cv.wood(460, 285, 486, 292, base=3)
    cv.wood(516, 285, 542, 292, base=3)
    cv.wood(472, 262, 530, 267, base=2)
    cv.rect(456, 128, 546, 254, Wd[1])
    cv.rect(458, 130, 544, 252, Wd[3])
    cv.rect(460, 132, 542, 250, R['gold'][1])
    cv.rect(463, 135, 539, 247, R['red'][0])
    cv.rect(465, 137, 537, 245, R['red'][1])
    cv.shade(cv.m_rect(465, 137, 537, 245), 1, np.clip((XX - 498) / 40.0, 0, 1) * .5)
    # crest + abstract inscription (4 columns, right to left)
    cv.poly([(501, 140), (513, 150), (501, 160), (489, 150)], R['gold'][1])
    cv.poly([(501, 144), (507, 150), (501, 156), (495, 150)], R['red'][1])
    for x in (518, 502, 486, 470):
        glyph_column(cv, x, 166, 8, R['gold'][2], 9, 12)
    cv.rect(478, 128, 524, 131, R['gold'][1])
    # silk bow tying the board to its stand
    cv.poly([(501, 252), (485, 262), (485, 272), (501, 258)], R['red'][2])
    cv.poly([(501, 252), (517, 262), (517, 272), (501, 258)], R['red'][1])
    cv.rect(498, 252, 504, 260, R['red'][0])
    cv.end('hitbox-honor-plaque')


def prayer_mat(cv):
    R = cv.R
    pts = [fl(6.6, 5.2), fl(9.4, 5.2), fl(9.75, 6.9), fl(6.25, 6.9)]
    cv.poly(pts, R['red'][0])
    cv.poly([fl(6.8, 5.35), fl(9.2, 5.35), fl(9.55, 6.75), fl(6.45, 6.75)], R['red'][1])
    cv.line([fl(6.95, 5.5), fl(9.05, 5.5), fl(9.35, 6.6), fl(6.65, 6.6), fl(6.95, 5.5)], R['gold'][1])
    a, b = fl(7.9, 6.0), fl(8.1, 6.0)
    cv.poly([(a[0] - 10, a[1]), (320, a[1] - 7), (b[0] + 10, a[1]), (320, a[1] + 7)], R['gold'][1])
    cv.shade(cv.m_poly(pts), -1, .2)


def draw_s2():
    cv = Cv(S2_RAMPS, 202)
    floor = floor_tiles(cv, base=2, motif=False)
    back_wall(cv, base=1, dado=True)
    beam_ceiling(cv, 2)
    side_walls(cv, left_base=2, right_base=1)
    # carved wall panels behind the altar
    for x0 in (96, 466):
        cv.rect(x0, 70, x0 + 74, 160, cv.R['wood'][1])
        cv.rect(x0 + 3, 73, x0 + 71, 157, cv.R['wall'][1])
        for yy in range(78, 154, 6):
            cv.line([(x0 + 6, yy), (x0 + 68, yy)], cv.R['wall'][0])
        cv.rect(x0 + 24, 100, x0 + 50, 130, cv.R['wood'][1])
        cv.rect(x0 + 26, 102, x0 + 48, 128, cv.R['wall'][2])
        cv.poly([(x0 + 37, 106), (x0 + 45, 115), (x0 + 37, 124), (x0 + 29, 115)], cv.R['wall'][1])
    for x in (140, 505):
        lantern(cv, x, 66)
    door_s1(cv, chain=False, oid=None)
    hall_window(cv)
    cv.shade(floor, -1, .35)
    floor_light(cv, [(12.8, 0.0), (16.4, 0.0), (14.6, 5.2), (8.0, 5.4)], mullions=(0.25, 0.5, 0.75), bands=(0.5,))
    cv.shade(cv.m_poly([(588, 120), (640, 120), (640, 250), (470, 300)]), 1, .12)
    prayer_mat(cv)
    # hall columns with couplets
    for x0, x1 in ((66, 88), (552, 574)):
        cv.begin()
        pillar(cv, x0, x1, BY0 + 6, BY1 + 6)
        cv.end(outline=True)
        couplet(cv, x0 + 2 if x0 < 100 else x0 + 2, 92, 176, 18)
    shrine_s2(cv)
    burner_s2(cv)
    plaque_s2(cv)
    cv.glow(320, 150, 120, 1, 1.6, 1.3, cv.m_rect(BX, BY0 + 30, W - BX, BY1))
    cv.vignette(1.0)
    ex = {'back': (34, 190, 'left'), 'yard': (320, 340, 'down')}
    return cv, 'c1-s2-ban-tho-nha-tho-ho', ex


# ---------------------------------------------------------------------------------------------------------------
# Chapter 1 / s3: Cong dinh doi dau (communal-house gate and yard at dusk). Outdoor: no side walls.
# ---------------------------------------------------------------------------------------------------------------
S3_RAMPS = ['ink', ('wood', 1, 6), ('wall', 0, 4), ('tile', 1, 5), 'ind', 'sky', 'stone', 'leaf', ('red', 1, 3)]
HZ = 172          # horizon
SUN = (604, 132)


def sky_s3(cv):
    S = np.array(cv.R['sky'], np.uint8)
    lvl = np.clip(YY / HZ, 0, 1) ** 1.15 * 3.0
    d = np.sqrt(((XX - SUN[0]) / 1.7) ** 2 + (YY - SUN[1]) ** 2)
    lvl += np.clip(1 - d / 170, 0, 1) ** 1.3 * 2.4
    idx = np.clip(np.floor(lvl + (BAY - .5) * .95 + .5), 0, 4).astype(np.int32)
    a = cv.arr()
    a[:, :] = S[idx]
    cv.put(a)
    cv.ell(SUN[0] - 15, SUN[1] - 15, SUN[0] + 15, SUN[1] + 15, cv.R['sky'][4])
    # streaky clouds: horizontally stretched noise, dark body, sun-lit rim on the upper right
    g = cv.rng.random((H // 6 + 3, W // 46 + 3)).astype(np.float32)
    big = np.array(Image.fromarray(g, 'F').resize(((W // 46 + 3) * 46, (H // 6 + 3) * 6), Image.Resampling.BICUBIC))[:H, :W]
    cloud = (big > .58) & (YY < HZ - 24) & (YY > 8)
    cv.shade(cloud, -1, .9)
    cv.shade(cloud & ~np.roll(cloud, (2, -3), (0, 1)), 2)
    cv.shade(cloud & ~np.roll(cloud, (-2, 3), (0, 1)), -1)


def tree_line(cv, y_base, x0, x1, hmin, hmax, seed_shift=0):
    """Crowns as overlapping dark blobs with a sun-lit rim on the upper right."""
    L = cv.R['leaf']
    m = np.zeros((H, W), bool)
    x = x0
    while x < x1:
        r = int(cv.rng.integers(hmin // 2, hmax // 2 + 1))
        cy = y_base - int(cv.rng.integers(hmin // 2, hmax // 2 + 1))
        m |= cv.m_ell(x - r, cy - r, x + r, cy + r)
        x += int(cv.rng.integers(r // 2 + 3, r + 6))
    m |= cv.m_rect(x0, y_base - hmin // 2, x1, y_base + 4)
    cv.shade(m, 0)
    a = cv.arr()
    a[m] = L[0]
    cv.put(a)
    rim = m & ~np.roll(m, (3, -3), (0, 1))
    cv.shade(rim, 1)
    cv.shade(m & (BAY < .12) & ~rim, 1)
    return m


def tiled_roof(cv, poly, ridge_y, spacing=6, shine=True):
    I = cv.R['ind']
    cv.poly(poly, I[1])
    m = cv.m_poly(poly)
    rowi = np.floor((YY - ridge_y) / spacing)
    cv.shade(m & (((YY - ridge_y) % spacing) < 1), -2)
    cv.shade(m & (((YY - ridge_y) % spacing) == 1), 1, .7)
    colm = ((XX + (rowi % 2) * 3) % 7) < 1
    cv.shade(m & colm & (((YY - ridge_y) % spacing) >= 1), 1, .8)
    if shine:
        cv.shade(m, 1, np.clip((XX - 330) / 220.0, 0, 1) * .85)
        cv.shade(m, -1, np.clip((250 - XX) / 200.0, 0, 1) * .7)
    cv.speckle(m, .015, 1)
    cv.speckle(m, .015, -1)
    return m


def brick_block(cv, x0, y0, x1, y1, tone=1, bw=13, bh=6):
    T, S = cv.R['tile'], cv.R['stone']
    cv.rect(x0, y0, x1, y1, S[1])
    for row, y in enumerate(range(y0, y1, bh)):
        off = (row % 2) * (bw // 2)
        for x in range(x0 - off, x1, bw):
            c = T[int(np.clip(tone + cv.rng.choice([-1, 0, 0, 1]), 0, 3))]
            cv.rect(max(x0, x + 1), y + 1, min(x1, x + bw), min(y1, y + bh), c)
    cv.line([(x1 - 1, y0), (x1 - 1, y1 - 1)], T[3])


def village_gate_s3(cv):
    """Brick gate pillars with a tiled canopy; the opening shows the lane outside in the dusk glow."""
    R, S, T, I = cv.R, cv.R['stone'], cv.R['tile'], cv.R['ind']
    # the lane seen through the opening (drawn first; pillars overlap it)
    ox0, ox1, oy0, oy1 = 52, 108, 118, 274
    cv.rect(ox0, oy0, ox1, oy1, R['sky'][3])
    cv.shade(cv.m_rect(ox0, oy0, ox1, oy1), 1, np.clip(1 - (YY - oy0) / 90.0, 0, 1) * .8)
    cv.shade(cv.m_rect(ox0, oy0, ox1, 168), -1, np.clip((140 - YY) / 40.0 + .2, 0, 1) * .5)
    tree_line(cv, 190, ox0, ox1, 22, 40)
    cv.poly([(ox0, 204), (ox1, 204), (ox1, oy1), (ox0, oy1)], R['wall'][1])
    cv.poly([(66, 196), (94, 196), (ox1 + 4, oy1), (ox0 - 4, oy1)], R['wall'][2])
    cv.line([(66, 196), (ox0 - 4, oy1)], R['wall'][0])
    cv.line([(94, 196), (ox1 + 4, oy1)], R['wall'][0])
    cv.shade(cv.m_rect(ox0, 190, ox1, oy1), -1, np.clip((YY - 235) / 45.0, 0, 1) * .6)
    cv.begin()
    for x0, x1, tone in ((28, 54, 1), (106, 132, 2)):
        brick_block(cv, x0, 86, x1, 262, tone)
        cv.rect(x0 - 3, 258, x1 + 3, 274, S[1])
        cv.rect(x0 - 3, 258, x1 + 3, 260, S[3])
        cv.rect(x0 - 3, 272, x1 + 3, 274, S[0])
        cv.rect(x0 - 3, 78, x1 + 3, 90, S[2])
        cv.rect(x0 - 3, 78, x1 + 3, 80, S[3])
        cv.poly([((x0 + x1) / 2, 62), (x1 - 3, 72), (x1 - 4, 78), (x0 + 4, 78), (x0 + 3, 72)], S[2])
        cv.rect((x0 + x1) // 2 - 1, 56, (x0 + x1) // 2 + 2, 64, S[3])
    cv.end('hitbox-village-gate-exit', outline=True)
    # lintel and little tiled canopy
    cv.begin()
    cv.wood(46, 112, 114, 124, base=2)
    cv.wood(46, 112, 114, 114, base=4)
    cv.poly([(16, 98), (22, 92), (40, 84), (120, 84), (138, 92), (144, 98), (140, 108), (20, 108)], I[1])
    cv.end(outline=True)
    m = tiled_roof(cv, [(16, 98), (22, 92), (40, 84), (120, 84), (138, 92), (144, 98), (140, 108), (20, 108)], 84, 5)
    for x in range(18, 142, 6):
        cv.ell(x, 104, x + 6, 110, I[2])
        cv.line([(x, 107), (x + 5, 107)], I[0])
    cv.rect(46, 124, 114, 126, cv.R['wood'][0])
    cv.shade(cv.m_rect(46, 124, 114, 140), -1, .6)


def dinh_building_s3(cv):
    R, W_, S, I = cv.R, cv.R['wood'], cv.R['stone'], cv.R['ind']
    # --- platform (plinth) in dressed stone
    cv.rect(128, 206, 530, 232, S[1])
    for y in (214, 223):
        cv.line([(128, y), (529, y)], S[0])
    for row, y in enumerate((206, 215, 224)):
        for x in range(128 + (row % 2) * 18, 530, 36):
            cv.line([(x, y), (x, y + 8)], S[0])
    cv.rect(128, 206, 530, 208, S[3])
    cv.shade(cv.m_rect(128, 206, 530, 232), -1, np.clip((330 - XX) / 220.0, 0, 1) * .55)
    # --- facade: dark timber wall between columns, door, lit lattice panels
    cv.rect(140, 118, 520, 206, W_[0])
    for x in range(144, 520, 9):
        cv.line([(x, 118), (x, 205)], W_[1])
    cv.shade(cv.m_rect(140, 118, 520, 206), -1, .25)
    cv.shade(cv.m_rect(140, 118, 520, 206), 1, np.clip((XX - 380) / 140.0, 0, 1) * .5)
    for x0, x1 in ((164, 214), (444, 494)):
        cv.rect(x0, 130, x1, 196, W_[1])
        cv.rect(x0 + 3, 133, x1 - 3, 193, R['wall'][3])
        cv.shade(cv.m_rect(x0 + 3, 133, x1 - 3, 193), -1, np.clip((YY - 160) / 40.0, 0, 1) * .6)
        for x in range(x0 + 3, x1 - 3, 7):
            cv.line([(x, 133), (x, 193)], W_[1], 2)
        for y in range(140, 193, 11):
            cv.line([(x0 + 3, y), (x1 - 3, y)], W_[1], 2)
    cv.begin()
    cv.rect(300, 130, 360, 206, W_[1])
    for x0, x1 in ((303, 328), (332, 357)):
        cv.wood(x0, 133, x1, 204, base=2, vertical=True)
        for y in (150, 176):
            cv.rect(x0, y, x1, y + 3, W_[0])
        for yy in range(142, 200, 20):
            for xx in (x0 + 5, x1 - 6):
                cv.px(xx, yy, R['wall'][3])
                cv.px(xx + 1, yy, R['wall'][2])
    cv.end(outline=True)
    # columns: lacquered round pillars, lit from the right
    for x in (146, 226, 300, 358, 436, 508):
        w = 13
        t = (np.arange(w) + .5) / w
        q = (1 + 3.2 * np.exp(-((t - .72) / .3) ** 2))[None, :] + (BAY[118:206, x:x + w] - .5) * .9
        a = cv.arr()
        a[118:206, x:x + w] = np.array(W_, np.uint8)[np.clip(np.floor(q).astype(int), 0, 4)]
        cv.put(a)
        cv.rect(x - 2, 202, x + w + 2, 208, S[2])
        cv.rect(x - 2, 202, x + w + 2, 203, S[3])
    # --- eaves shadow and rafters
    cv.rect(110, 108, 548, 122, W_[0])
    for x in range(114, 548, 8):
        cv.line([(x, 108), (x, 122)], W_[1])
    cv.rect(110, 120, 548, 124, W_[2])
    cv.rect(110, 120, 548, 121, W_[4])
    for x in (150, 232, 304, 362, 440, 512):
        cv.poly([(x - 4, 124), (x + 18, 124), (x + 7, 134)], W_[1])
    cv.shade(cv.m_rect(110, 122, 548, 132), -1, .5)
    # --- the big curved tiled roof
    roof = [(88, 104), (96, 96), (126, 78), (168, 58), (490, 58), (532, 78), (562, 96), (570, 104), (560, 112), (98, 112)]
    tiled_roof(cv, roof, 58, 6)
    for x in range(100, 562, 7):
        cv.ell(x, 108, x + 7, 115, I[2])
        cv.line([(x, 112), (x + 6, 112)], I[0])
    cv.rect(166, 54, 492, 61, S[2])
    cv.rect(166, 54, 492, 56, S[3])
    for x in range(172, 490, 14):
        cv.line([(x, 56), (x, 61)], S[1])
    for ex, sgn in ((166, -1), (492, 1)):
        pts = [(ex, 54), (ex + sgn * 6, 46), (ex + sgn * 12, 40), (ex + sgn * 14, 46), (ex + sgn * 8, 54)]
        cv.poly(pts, S[2])
        cv.px(ex + sgn * 12, 40, S[3])
    cv.poly([(322, 54), (330, 38), (338, 54)], S[2])
    cv.px(330, 38, S[3])
    cv.ell(324, 34, 336, 40, S[2])
    # sun rim on the roof's right slope and dusk shade on the eaves
    cv.shade(cv.m_rect(430, 60, 568, 112), 1, np.clip((XX - 440) / 120.0, 0, 1) * .4)


def stairs_and_path_s3(cv):
    S, T = cv.R['stone'], cv.R['tile']
    steps = [(222, 234, 292, 384), (234, 247, 286, 392), (247, 262, 280, 398)]
    for y0, y1, x0, x1 in steps:
        cv.poly([(x0, y0), (x1, y0), (x1 + 3, y1), (x0 - 3, y1)], S[2])
        cv.line([(x0, y0), (x1, y0)], S[3], 1)
        cv.rect(x0 - 3, y1 - 4, x1 + 4, y1, S[1])
        cv.line([(x0 - 3, y1 - 1), (x1 + 3, y1 - 1)], S[0])
    sh = cv.m_poly([(292, 222), (384, 222), (401, 262), (277, 262)])
    cv.mottle(sh, 5, .2, .8, .3)
    cv.shade(sh, 1, np.clip((XX - 360) / 60.0, 0, 1) * .5)
    cv.shade(sh, -1, np.clip((320 - XX) / 80.0, 0, 1) * .5)
    # brick-paved lane leading down from the steps
    pts = [(280, 262), (398, 262), (470, 360), (212, 360)]
    cv.poly(pts, T[1])
    m = cv.m_poly(pts)
    depth = np.clip((YY - 262) / 98.0, 0, None) ** 1.35 * 9
    rowy = np.floor(depth)
    cv.shade(m & (np.abs(depth - np.round(depth)) < .09), -1)
    cx = 339 + (XX - 339) / (1 + (YY - 262) / 98.0 * .62)
    cv.shade(m & ((cx % 13) < 1) & (rowy % 2 == 0), -1)
    cv.shade(m & (((cx + 6) % 13) < 1) & (rowy % 2 == 1), -1)
    cv.mottle(m, 5, .25, .75, .35)
    cv.shade(m, 1, np.clip((XX - 340) / 160.0, 0, 1) * .45)
    cv.shade(m, -1, np.clip((330 - XX) / 150.0, 0, 1) * .45)


def stone_step_s3(cv):
    """Weathered stone dais in the yard: lit top, darker front, moss and cracks."""
    S, L = cv.R['stone'], cv.R['leaf']
    cv.ao(198, 292, 62, 6, 2)
    cast_shadow(cv, 142, 258, 292, -36, 10, -1, .85)
    cv.begin()
    cv.poly([(150, 262), (252, 262), (262, 276), (140, 276)], S[3])
    cv.rect(140, 276, 262, 296, S[1])
    cv.poly([(160, 242), (242, 242), (252, 262), (150, 262)], S[3])
    cv.rect(150, 262, 252, 266, S[2])
    cv.rect(140, 276, 262, 278, S[2])
    cv.end('hitbox-stone-step', outline=True)
    cv.shade(cv.m_poly([(160, 242), (242, 242), (252, 262), (150, 262)]), 1, np.clip((XX - 170) / 80.0, 0, 1) * .6)
    cv.shade(cv.m_poly([(150, 262), (252, 262), (262, 276), (140, 276)]), -1, np.clip((200 - XX) / 80.0, 0, 1) * .6)
    cv.shade(cv.m_rect(140, 278, 262, 296), -1, .5)
    cv.mottle(cv.m_rect(140, 242, 262, 296), 4, .22, .78, .4)
    for pts in ([(176, 246), (181, 252), (178, 258)], [(212, 266), (216, 272), (219, 276)], [(190, 280), (194, 288), (192, 294)], [(236, 280), (240, 290)]):
        cv.line(pts, S[0])
    for mx, my in ((142, 288), (150, 284), (246, 292), (252, 288), (160, 262), (166, 266)):
        cv.ell(mx, my, mx + 7, my + 3, L[1])
        cv.px(mx + 2, my, L[2])


def yard_ground_s3(cv):
    """Packed earth with pebbles; sun glow from the right, shade pooling at the left and the bottom."""
    Wl = cv.R['wall']
    ground = cv.m_rect(0, HZ, W, H)
    a = cv.arr()
    a[HZ:, :] = Wl[1]
    cv.put(a)
    cv.shade(ground, -1, .45)
    cv.shade(ground, 1, np.clip(1 - (YY - HZ) / 60.0, 0, 1) * .5)
    cv.mottle(ground, 16, .14, .86, .22)
    cv.speckle(ground, .03, 1)
    cv.speckle(ground, .035, -1)
    cv.shade(ground, 1, np.clip((XX - 380) / 260.0, 0, 1) * np.clip(1 - (YY - 230) / 160.0, 0, 1) * .6)
    cv.shade(ground, -1, np.clip((260 - XX) / 260.0, 0, 1) * .5)
    # grass tufts along the margins of the yard
    for _ in range(70):
        x = int(cv.rng.integers(0, W))
        y = int(cv.rng.integers(HZ + 40, H - 4))
        if 268 < x < 480 and y < 330:
            continue
        for dx in (-2, 0, 2):
            cv.line([(x + dx, y), (x + dx + int(cv.rng.integers(-1, 2)), y - int(cv.rng.integers(3, 7)))], cv.R['leaf'][1 + int(cv.rng.integers(0, 2))])
    # pebbles
    for _ in range(150):
        x, y = int(cv.rng.integers(0, W)), int(cv.rng.integers(HZ + 52, H))
        cv.ell(x, y, x + int(cv.rng.integers(2, 4)), y + 2, cv.R['stone'][1 + int(cv.rng.integers(0, 2))])
    return ground


def compound_wall_s3(cv):
    S, T = cv.R['stone'], cv.R['tile']
    cv.begin()
    brick_block(cv, 540, 188, 640, 230, 1, 11, 5)
    cv.rect(536, 182, 640, 190, S[2])
    cv.rect(536, 182, 640, 184, S[3])
    cv.end(outline=True)
    cv.shade(cv.m_rect(540, 188, 640, 230), 1, np.clip((XX - 560) / 80.0, 0, 1) * .5)
    cv.shade(cv.m_rect(536, 230, 640, 236), -1, .5)


def lanterns_s3(cv):
    for x in (252, 410):
        cv.line([(x, 124), (x, 132)], cv.R['wood'][0])
        cv.begin()
        cv.stamp('den-long-do', x - 6, 132)
        cv.end(outline=True)
        cv.glow(x, 140, 26, 1, 1.2)


def draw_s3():
    cv = Cv(S3_RAMPS, 303)
    sky_s3(cv)
    # distant hills and tree line along the horizon
    pts = [(0, HZ)] + [(x, HZ - 16 - 10 * np.sin(x / 63.0) - 7 * np.sin(x / 23.0 + 1)) for x in range(0, W + 8, 8)] + [(W, HZ)]
    cv.poly(pts, cv.R['sky'][0])
    cv.shade(cv.m_poly(pts), 0)
    tree_line(cv, HZ + 2, 0, 28, 24, 40)
    tree_line(cv, HZ + 2, 132, 150, 20, 36)
    tree_line(cv, HZ + 4, 556, 640, 40, 70)
    yard_ground_s3(cv)
    compound_wall_s3(cv)
    dinh_building_s3(cv)
    lanterns_s3(cv)
    stairs_and_path_s3(cv)
    village_gate_s3(cv)
    stone_step_s3(cv)
    # long shadows toward the lower left (low sun at the right)
    cast_shadow(cv, 28, 54, 272, -64, 22, -1, .8)
    cast_shadow(cv, 106, 132, 272, -64, 22, -1, .8)
    cv.glow(SUN[0], SUN[1], 200, 1, 1.8, 1.0, cv.m_rect(0, 0, W, 232) & ~cv.m_rect(0, 80, 140, 270))
    cv.vignette(1.0)
    # standing room (NPC sprites are drawn by the game): officials, Ong Le, Cu Cam
    for oid, box in {'hitbox-village-officials': (436, 96, 590, 232), 'hitbox-ong-le-entity': (333, 108, 410, 288),
                     'hitbox-styling-cam': (256, 150, 330, 290)}.items():
        cv.boxes[oid] = box
    ex = {'exit': (80, 190, 'left')}
    return cv, 'c1-s3-cong-dinh-doi-dau', ex


ROOMS = {'s1': draw_s1, 's2': draw_s2, 's3': draw_s3}


def verify_layout(area_id):
    """Every interactable id and exit key in c1.json must be present in the drawn layout."""
    chapter = json.loads((ROOT / 'src/content/chapters/c1.json').read_text(encoding='utf-8'))
    area = next(a for a in chapter['areas'] if a['id'] == area_id)
    return [i['id'] for i in area['interactables']], list(area['exits'].keys())


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('rooms', nargs='*', default=list(ROOMS))
    ap.add_argument('--preview', type=Path, help='directory for x2 previews')
    args = ap.parse_args()
    assert ANCHORS <= PG.load_palette('ui+garment'), 'anchor colour missing from assets/palettes'
    for key in args.rooms:
        cv, area_id, exits = ROOMS[key]()
        ids, exit_keys = verify_layout(area_id)
        missing = [i for i in ids if i not in cv.boxes] + [f'exit:{k}' for k in exit_keys if k not in exits]
        if missing:
            sys.exit(f'FAIL {area_id}: layout missing {missing}')
        used = finish(cv, key, area_id, cv.boxes, exits, AREAS, args.preview)
        print(f'OK {area_id} {W}x{H} colors={used}/{MAX_COLORS} boxes={len(cv.boxes)}')


if __name__ == '__main__':
    main()
