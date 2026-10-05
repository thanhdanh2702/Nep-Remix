"""Cut hand-traced hotspot objects out of the opaque prologue backgrounds.

Reads scripts/hotspot-masks.json ({area: {interactableId: [[x,y],...]}}, coords in the
800x500 world), crops each polygon bbox from `<area>--phai.png`, applies the polygon as a
hard 0/255 alpha mask and writes `assets/areas/prologue/<area>/hotspot-<id>.png` plus
`hotspots.json` ({id: {x,y,w,h}} in world px = top-left placement offset and size).
Rect containment vs src/content/chapters/prologue.json (expanded 10%) is an info print only:
rects are tuned for the avatar's feet, masks follow the visible object.
Use --verify DIR to write per-area outline composites for visual alignment checks.
After writing, run `npm run audit:assets`.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
WORLD = (800, 500)
EXPAND = 0.10


def interactable_rects():
    data = json.loads((ROOT / 'src/content/chapters/prologue.json').read_text(encoding='utf-8'))
    return {a['id']: {i['id']: i['rect'] for i in a['interactables']} for a in data['areas']}


def inside_expanded(box, rect):
    """box in world px (x0,y0,x1,y1); rect normalized x,y,w,h. True if within rect grown by 10%."""
    rx0, ry0 = rect['x'] * WORLD[0], rect['y'] * WORLD[1]
    rx1, ry1 = rx0 + rect['w'] * WORLD[0], ry0 + rect['h'] * WORLD[1]
    mx, my = (rx1 - rx0) * EXPAND, (ry1 - ry0) * EXPAND
    return box[0] >= rx0 - mx and box[1] >= ry0 - my and box[2] <= rx1 + mx and box[3] <= ry1 + my


def cutout(bg, points):
    """Return (RGBA cutout, world bbox (x0,y0,x1,y1) ints) for a polygon in world coords."""
    sx, sy = bg.width / WORLD[0], bg.height / WORLD[1]
    px = [(x * sx, y * sy) for x, y in points]
    x0, y0 = max(0, int(min(p[0] for p in px))), max(0, int(min(p[1] for p in px)))
    x1, y1 = min(bg.width, int(max(p[0] for p in px)) + 1), min(bg.height, int(max(p[1] for p in px)) + 1)
    mask = Image.new('L', (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(mask).polygon([(x - x0, y - y0) for x, y in px], fill=255)  # no antialiasing -> hard alpha
    out = bg.convert('RGBA').crop((x0, y0, x1, y1))
    out.putalpha(mask)
    out = Image.composite(out, Image.new('RGBA', out.size, (0, 0, 0, 0)), mask)  # zero RGB under alpha 0
    return out, (round(x0 / sx), round(y0 / sy), round(x1 / sx), round(y1 / sy))


def main():
    p = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    p.add_argument('--verify', type=Path, help='directory for outline composites (not part of the game assets)')
    args = p.parse_args()
    masks = json.loads((ROOT / 'scripts/hotspot-masks.json').read_text(encoding='utf-8'))
    rects = interactable_rects()
    for area, items in masks.items():
        folder = ROOT / 'assets/areas/prologue' / area
        bg = Image.open(folder / f'{area}--phai.png').convert('RGBA')
        overlay = bg.copy()
        draw = ImageDraw.Draw(overlay)
        offsets = {}
        for hid, points in items.items():
            img, box = cutout(bg, points)
            img.save(folder / f'hotspot-{hid}.png')
            offsets[hid] = dict(x=box[0], y=box[1], w=box[2] - box[0], h=box[3] - box[1])
            alphas = sorted(set(img.getchannel('A').tobytes()))
            ok = hid in rects.get(area, {}) and inside_expanded(box, rects[area][hid])
            note = 'in rect' if ok else 'info: outside rect+10%'
            print(f'{area}/{hid}: {img.width}x{img.height} alpha={alphas} {note}')
            draw.polygon([tuple(pt) for pt in points], outline=(255, 0, 255, 255))
        (folder / 'hotspots.json').write_text(json.dumps(offsets, indent=2) + '\n', encoding='utf-8')
        if args.verify:
            args.verify.mkdir(parents=True, exist_ok=True)
            big = overlay.resize((bg.width * 2, bg.height * 2), Image.Resampling.NEAREST)
            big.convert('RGB').save(args.verify / f'{area}-verify.png')
    print('Next: npm run audit:assets')


if __name__ == '__main__':
    main()
