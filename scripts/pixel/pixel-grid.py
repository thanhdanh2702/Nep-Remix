"""Validate and render a char-grid sprite (assets/src/pixel/**/*.grid.json).

Grid file: {"id", "w", "h", "palette": "ui" | "garment" | "ui+garment", "mirror": "none"|"x",
            "legend": {".": null, "K": "291021", ...}, "rows": ["....", ...]}
With mirror "x" each row only holds the left ceil(w/2) columns; the right half is mirrored in.

Usage: python scripts/pixel/pixel-grid.py FILE [--out PNG] [--preview N [--preview-out PNG]] [--svg SVG] [--max-colors N]
Output is at most 5 lines; exit code 1 on any structural error (row count/length, unknown char, hex outside palette).
Other scripts import it with importlib and call load_grid() / render().
"""
import argparse
import json
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
PALETTES = ROOT / 'assets/palettes'


class GridError(Exception):
    pass


def load_palette(spec):
    colors = set()
    for name in spec.split('+'):
        path = PALETTES / f'{name}.json'
        if not path.is_file():
            raise GridError(f'palette "{name}" not found at assets/palettes/{name}.json')
        colors |= {c.upper().lstrip('#') for c in json.loads(path.read_text(encoding='utf-8'))['colors']}
    return colors


def check(grid):
    """Return a list of hard-error strings (empty when the grid is valid)."""
    errors = []
    w, h, rows, legend = grid.get('w'), grid.get('h'), grid.get('rows'), grid.get('legend')
    if not (isinstance(w, int) and isinstance(h, int) and isinstance(rows, list) and isinstance(legend, dict)):
        return ['need int w, int h, list rows, dict legend']
    mirror = grid.get('mirror', 'none')
    if mirror not in ('none', 'x'):
        errors.append(f'mirror "{mirror}" must be none|x')
    want = (w + 1) // 2 if mirror == 'x' else w
    if len(rows) != h:
        errors.append(f'rows={len(rows)} (want h={h})')
    try:
        palette = load_palette(grid.get('palette', 'ui+garment'))
    except GridError as exc:
        return errors + [str(exc)]
    for key, hex_value in legend.items():
        if len(key) != 1:
            errors.append(f'legend key "{key}" must be 1 char')
        if hex_value is not None and hex_value.upper().lstrip('#') not in palette:
            errors.append(f'legend "{key}"={hex_value} not in palette {grid.get("palette", "ui+garment")}')
    for y, row in enumerate(rows):
        if len(row) != want:
            errors.append(f'row {y} len={len(row)} (want {want})')
        for x, ch in enumerate(row):
            if ch not in legend:
                errors.append(f'row {y} col {x} char "{ch}" not in legend')
                break
    return errors


def expand(grid):
    """Full-width rows (applies mirror)."""
    if grid.get('mirror', 'none') != 'x':
        return list(grid['rows'])
    out = []
    for row in grid['rows']:
        tail = row[::-1] if grid['w'] % 2 == 0 else row[-2::-1]
        out.append(row + tail)
    return out


def render(grid):
    """RGBA image at 1x."""
    rows = expand(grid)
    img = Image.new('RGBA', (grid['w'], grid['h']), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            hex_value = grid['legend'][ch]
            if hex_value:
                h = hex_value.lstrip('#')
                px[x, y] = (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)
    return img


def load_grid(path):
    """Read, validate and render a grid file; raises GridError listing the problems."""
    grid = json.loads(Path(path).read_text(encoding='utf-8'))
    errors = check(grid)
    if errors:
        raise GridError('; '.join(errors))
    return render(grid)


def write_svg(img, path):
    rects = [f'<rect x="{x}" y="{y}" width="1" height="1" fill="#{r:02X}{g:02X}{b:02X}"/>'
             for y in range(img.height) for x in range(img.width) for r, g, b, a in [img.getpixel((x, y))] if a]
    Path(path).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{img.width}" height="{img.height}" '
                          f'viewBox="0 0 {img.width} {img.height}" shape-rendering="crispEdges">{"".join(rects)}</svg>', encoding='utf-8')


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('file')
    ap.add_argument('--out', help='write 1x PNG')
    ap.add_argument('--preview', type=int, help='write nearest-neighbour preview at this scale')
    ap.add_argument('--preview-out')
    ap.add_argument('--svg')
    ap.add_argument('--max-colors', type=int, default=8)
    args = ap.parse_args()
    try:
        grid = json.loads(Path(args.file).read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        print(f'FAIL cannot read {args.file}: {exc}')
        return 1
    errors = check(grid)
    if errors:
        shown = errors[:4] + ([f'+{len(errors) - 4} more'] if len(errors) > 4 else [])
        print(f'FAIL {grid.get("id", args.file)}: ' + '; '.join(shown))
        return 1
    img = render(grid)
    colors = len([c for _, c in (img.getcolors(65536) or []) if c[3]])
    print(f'OK {grid.get("id", Path(args.file).stem)} {img.width}x{img.height} colors={colors}/{args.max_colors}'
          + ('' if colors <= args.max_colors else ' WARN over color budget'))
    if args.out:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        img.save(args.out)
    if args.preview:
        dest = Path(args.preview_out) if args.preview_out else ROOT / 'artifacts/pixel-preview' / f'{Path(args.file).stem}.x{args.preview}.png'
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.resize((img.width * args.preview, img.height * args.preview), Image.Resampling.NEAREST).save(dest)
        print(f'preview {dest}')
    if args.svg:
        write_svg(img, args.svg)
    return 0


if __name__ == '__main__':
    sys.exit(main())
