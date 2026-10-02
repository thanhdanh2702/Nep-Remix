"""Isolate the supplied logo/coin from their baked checkerboard; preserve the source sheet."""
from collections import deque
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
source = Image.open(root / 'assets/branding/viet-phuc-ui-sheet.png').convert('RGBA')
regions = {'logo-viet-phuc.png': (25, 34, 1190, 511), 'sen-ngoc.png': (1798, 510, 2004, 686)}
for name, box in regions.items():
    image = source.crop(box)
    pixels = image.load()
    width, height = image.size
    seen = set()
    queue = deque([(x, y) for x in range(width) for y in (0, height-1)] + [(x, y) for y in range(height) for x in (0, width-1)])
    while queue:
        x, y = queue.popleft()
        if (x, y) in seen or not (0 <= x < width and 0 <= y < height):
            continue
        seen.add((x, y))
        r, g, b, a = pixels[x, y]
        if min(r, g, b) < 150 or max(r, g, b)-min(r, g, b) > 22:
            continue
        pixels[x, y] = (r, g, b, 0)
        queue.extend(((x-1, y), (x+1, y), (x, y-1), (x, y+1)))
    image = image.crop(image.getbbox())
    image.save(root / 'assets/branding' / name)
    print(name, image.size)
