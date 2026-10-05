"""Re-slice a 4-frame VFX strip whose art overflows its 64px cells into a clean sheet.

The supplied strips (e.g. vfx-c0-s2-anh-sang-thuoc-go.png, 256x96) draw each frame wider than
its cell, so a fixed 64px cut clips the swirl into straight edges. Here every 8-connected blob of
opaque pixels is assigned to the frame whose cell holds the blob's centroid, then each frame is
re-packed bottom-centred into a cell wide enough for the largest frame.

Usage: python scripts/build-vfx-frames.py <src.png> [--frames 4]
Writes <src>--frames.png next to the source (the original is never modified) and prints the cell size.
Run `npm run audit:assets` afterwards.
"""
import argparse
from pathlib import Path
from PIL import Image


def blobs(alpha, w, h):
    seen = bytearray(w * h)
    for start in range(w * h):
        if seen[start] or not alpha[start]:
            continue
        seen[start] = 1
        stack, pixels = [start], []
        while stack:
            i = stack.pop()
            pixels.append(i)
            x, y = i % w, i // w
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not seen[j] and alpha[j]:
                            seen[j] = 1
                            stack.append(j)
        yield pixels


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('src')
    parser.add_argument('--frames', type=int, default=4)
    args = parser.parse_args()
    src = Path(args.src)
    image = Image.open(src).convert('RGBA')
    w, h = image.size
    cell = w // args.frames
    alpha = [a for *_, a in image.getdata()]
    groups = [[] for _ in range(args.frames)]
    for pixels in blobs(alpha, w, h):
        cx = sum(i % w for i in pixels) / len(pixels)
        groups[min(args.frames - 1, int(cx // cell))].extend(pixels)
    boxes = []
    for pixels in groups:
        xs, ys = [i % w for i in pixels], [i // w for i in pixels]
        boxes.append((min(xs), min(ys), max(xs) + 1, max(ys) + 1))
    out_w = max(b[2] - b[0] for b in boxes)
    out_h = max(b[3] - b[1] for b in boxes)
    sheet = Image.new('RGBA', (out_w * args.frames, out_h), (0, 0, 0, 0))
    source = image.load()
    target = sheet.load()
    for f, (pixels, (x0, y0, x1, y1)) in enumerate(zip(groups, boxes)):
        ox = f * out_w + (out_w - (x1 - x0)) // 2 - x0  # bottom-centred in its cell
        oy = out_h - y1
        for i in pixels:
            x, y = i % w, i // w
            target[x + ox, y + oy] = source[x, y]
    dest = src.with_name(f'{src.stem}--frames.png')
    sheet.save(dest)
    print(f'{dest} cell={out_w}x{out_h} frames={args.frames}')


if __name__ == '__main__':
    main()
