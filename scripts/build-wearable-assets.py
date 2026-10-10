"""Pack generated garment views on An's frames and derive matching hanging previews/icons.

This performs registration/resampling and sprite packing, not garment drawing. Source art
and the exact ImageGen prompts are preserved under assets/references/wearables/.
"""
from pathlib import Path
import argparse
import json
import math
from PIL import Image, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'assets/references/wearables'
FRAME = (176, 416)
DIRECTIONS = [0, 22, 66, 44]
NECK_X = [94, 71, 94, 105]


def split_views(image, count):
    """Find isolated objects; use cell boundaries only when guides are perfectly registered."""
    alpha = image.getchannel('A')
    occupied = [sum(alpha.getpixel((x, y)) >= 96 for y in range(image.height)) > 5
                for x in range(image.width)]
    runs = []
    for x, yes in enumerate(occupied):
        if yes and (not runs or x > runs[-1][1] + 8):
            runs.append([x, x])
        elif yes:
            runs[-1][1] = x
    runs = [run for run in runs if run[1] - run[0] > image.width / count * .15]
    if len(runs) != count:
        raise ValueError(f'Expected {count} isolated views, found {len(runs)}: {runs}')
    cells = []
    for start, end in runs:
        view = image.crop((max(0, start - 3), 0, min(image.width, end + 4), image.height))
        bounds = view.getchannel('A').point(lambda a: 255 if a >= 24 else 0).getbbox()
        if not bounds:
            raise ValueError('Empty source view')
        cells.append(view.crop(bounds))
    return cells


def cloth_colors(view, accent):
    """Normalize neutral cloth; explicitly requested coloured materials retain their source hue."""
    out = view.copy()
    pixels = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = pixels[x, y]
            if not a:
                continue
            preserve = False
            if accent == 'peach':
                preserve = (r - g > 20 and r - b > 8 and r > 90) or (g - r > 8 and g - b > 15)
            elif accent == 'blue':
                preserve = b - r > 15 or g - r > 18
            elif accent == 'ivory':
                preserve = r - b > 15 and r > 130 and g > 110
            elif accent == 'flowers':
                preserve = r - b > 25 and g - b > 12 and r > 100
            if not preserve:
                v = round(.2126 * r + .7152 * g + .0722 * b)
                pixels[x, y] = (v, v, v, a)
    return out


def fit_wearable(view, direction, entry, bottom=False):
    """Register collar/cuffs/hem to native sprite landmarks; final canvases are never trimmed."""
    frame = Image.new('RGBA', FRAME)
    if bottom:
        height = 160
        artwork = view.resize((max(1, round(view.width * height / view.height)), height), Image.Resampling.LANCZOS)
        frame.alpha_composite(artwork, (round(NECK_X[direction] - artwork.width / 2), 222))
        return frame
    top = entry.get('neckY', 127)
    hem = entry.get('hemY', 370 if direction != 2 else 361)
    height = hem - top
    split = entry.get('cuffFraction', .5)
    cuff = entry.get('cuffY', 223 if direction in [0, 1, 3] else 239)
    source_split = max(1, min(view.height - 1, round(view.height * split)))
    scale = height / view.height
    width = max(1, round(view.width * scale))
    # Collar centre is measured at the top of the source, independent of relaxed sleeves/tails.
    alpha = view.getchannel('A')
    head_rows = max(2, round(view.height * .04))
    xs = [x for y in range(head_rows) for x in range(view.width) if alpha.getpixel((x, y)) >= 96]
    neck = (min(xs) + max(xs)) / 2 if xs else view.width / 2
    x = round(NECK_X[direction] - neck * scale)
    if x < 0 or x + width > FRAME[0]:
        scale = min(scale, (FRAME[0] - 4) / view.width)
        width = max(1, round(view.width * scale))
        x = max(2, min(FRAME[0] - 2 - width, round(NECK_X[direction] - neck * scale)))
    upper = view.crop((0, 0, view.width, source_split)).resize((width, cuff - top), Image.Resampling.LANCZOS)
    lower = view.crop((0, source_split, view.width, view.height)).resize((width, hem - cuff), Image.Resampling.LANCZOS)
    frame.alpha_composite(upper, (x, top))
    frame.alpha_composite(lower, (x, cuff))
    return frame


def fit_hanging(view):
    frame = Image.new('RGBA', FRAME)
    scale = min(164 / view.width, 365 / view.height)
    artwork = view.resize((max(1, round(view.width * scale)), max(1, round(view.height * scale))), Image.Resampling.LANCZOS)
    frame.alpha_composite(artwork, ((176 - artwork.width) // 2, 34))
    return frame


def registered_cells(image, entry):
    """Keep a pose-registered source's full canvases; never stretch its torso/tails."""
    count = 5
    scale = FRAME[1] / image.height
    width = round(image.width * scale)
    if abs(width - FRAME[0] * count) > 1:
        raise ValueError('Registered source must contain five full 176x416 frames')
    # One uniform resampling of the full sheet retains shoulders, elbows and cuffs.
    sheet = image.resize((width, FRAME[1]), Image.Resampling.LANCZOS)
    alpha = sheet.getchannel('A')
    sheet.putalpha(alpha.point(lambda a: 0 if a < 24 else a))
    offsets = entry.get('viewOffsets', [[0, 0]] * count)
    if len(offsets) != count:
        raise ValueError('Registered source needs five view offsets')
    cells = []
    for i, (x, y) in enumerate(offsets):
        frame = Image.new('RGBA', FRAME)
        cell = cloth_colors(sheet.crop((i * FRAME[0], 0, (i + 1) * FRAME[0], FRAME[1])), entry.get('accent'))
        frame.alpha_composite(cell, (x, y))
        cells.append(frame)
    return cells


def pack_studio_neck(source):
    """Pack the generated clean neck patch, clipped to An's original body silhouette."""
    image = Image.open(ROOT / source).convert('RGBA')
    scale = FRAME[1] / image.height
    width = round(image.width * scale)
    if abs(width - 4 * FRAME[0]) > 1:
        raise ValueError('Studio body source needs four full character frames')
    image = image.resize((width, FRAME[1]), Image.Resampling.LANCZOS)
    original = Image.open(ROOT / 'assets/characters/an/body.png').convert('RGBA')
    cells = []
    for col, index in enumerate(DIRECTIONS):
        native = original.crop((index % 8 * 176, index // 8 * 416, (index % 8 + 1) * 176, (index // 8 + 1) * 416))
        patch = Image.new('RGBA', FRAME)
        patch.alpha_composite(image.crop((col * 176, 126, (col + 1) * 176, 150)), (0, 126))
        alpha = patch.getchannel('A').point(lambda a: 0 if a < 24 else a)
        patch.putalpha(ImageChops.multiply(alpha, native.getchannel('A')))
        cells.append(patch)
    strip = Image.new('RGBA', (528, 416))
    for col, cell in enumerate(cells[:3]):
        strip.alpha_composite(cell, (col * 176, 0))
    strip.save(ROOT / 'assets/characters/an/studio-neck.png')
    cells[3].save(ROOT / 'assets/characters/an/studio-neck--right.png')


def pack_studio_trousers(source):
    """Register the four trouser poses with uniform scaling, preserving two hems."""
    image = Image.open(ROOT / source).convert('RGBA')
    cells = []
    for col, view in enumerate(split_views(image, 4)):
        view = cloth_colors(view, None)
        view.putalpha(view.getchannel('A').point(lambda a: 0 if a < 24 else a))
        view = view.crop(view.getchannel('A').getbbox())
        scale = 166 / view.height
        head_rows = max(2, round(view.height * .04))
        alpha = view.getchannel('A')
        xs = [x for y in range(head_rows) for x in range(view.width) if alpha.getpixel((x, y)) >= 128]
        waist = (min(xs) + max(xs)) / 2
        art = view.resize((round(view.width * scale), 166), Image.Resampling.LANCZOS)
        frame = Image.new('RGBA', FRAME)
        frame.alpha_composite(art, (round([92, 64, 92, 112][col] - waist * scale), 222))
        cells.append(frame)
    strip = Image.new('RGBA', (528, 416))
    for col, cell in enumerate(cells[:3]):
        strip.alpha_composite(cell, (col * 176, 0))
    strip.save(ROOT / 'assets/characters/an/studio-trousers.png')
    cells[3].save(ROOT / 'assets/characters/an/studio-trousers--right.png')
    print('Packed studio trousers: two-leg front/left/back strip and separate right view.')


def recolor(image, palette):
    stops = [tuple(int(c[i:i+2], 16) for i in (1, 3, 5)) for c in palette][::-1]
    out = image.copy()
    pixels = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = pixels[x, y]
            if not a or max(r, g, b) - min(r, g, b) > 18:
                continue
            v = (.2126 * r + .7152 * g + .0722 * b) / 255 * (len(stops) - 1)
            i = min(len(stops) - 2, math.floor(v))
            f = v - i
            pixels[x, y] = (*[round(stops[i][ch] * (1-f) + stops[i+1][ch] * f) for ch in range(3)], a)
    return out


def icon_from_hanging(hanging, palette):
    art = recolor(hanging, palette)
    art = art.crop(art.getchannel('A').getbbox())
    scale = min(88 / art.width, 88 / art.height)
    art = art.resize((max(1, round(art.width * scale)), max(1, round(art.height * scale))), Image.Resampling.LANCZOS)
    icon = Image.new('RGBA', (96, 96))
    icon.alpha_composite(art, ((96-art.width)//2, (96-art.height)//2))
    return icon


def an_cell(index, clothes, skirt=None, hide_hands=False):
    cell = Image.new('RGBA', FRAME)
    layers = ['shadow', 'hair_back', 'legs', 'shoes', 'body', 'bottom']
    trouser_path = ROOT / ('assets/characters/an/studio-trousers--right.png' if index == 44 else 'assets/characters/an/studio-trousers.png')
    trousers = None
    if skirt is None and trouser_path.is_file():
        col = {0: 0, 22: 1, 66: 2, 44: 0}[index]
        trousers = Image.open(trouser_path).convert('RGBA').crop((col * 176, 0, (col + 1) * 176, 416))
        layers.remove('legs')
    if index == 66:
        layers.remove('hair_back')
    if skirt is not None or trousers is not None:
        layers.remove('bottom')
    for name in layers:
        sheet = Image.open(ROOT / f'assets/characters/an/{name}.png').convert('RGBA')
        layer = sheet.crop((index%8*176,index//8*416,(index%8+1)*176,(index//8+1)*416))
        if name == 'shoes' and trousers is not None:
            bounds = {0: (66, 377, 130, 398), 66: (66, 377, 130, 398),
                      22: (37, 381, 112, 398), 44: (64, 381, 139, 398)}[index]
            feet = Image.new('RGBA', FRAME)
            feet.alpha_composite(layer.crop(bounds), bounds[:2])
            layer = feet
        cell.alpha_composite(layer)
        if name == 'body':
            neck = ROOT / ('assets/characters/an/studio-neck--right.png' if index == 44 else 'assets/characters/an/studio-neck.png')
            if neck.is_file():
                patch = Image.open(neck).convert('RGBA')
                col = {0: 0, 22: 1, 66: 2, 44: 0}[index]
                cell.alpha_composite(patch.crop((col * 176, 0, (col + 1) * 176, 416)))
    if skirt is not None:
        cell.alpha_composite(skirt)
    elif trousers is not None:
        cell.alpha_composite(recolor(trousers, ['#625A68', '#3A3342', '#241D2A', '#110D17']))
    cell.alpha_composite(clothes)
    for name in ['head', 'face', 'hair_front', 'hands']:
        if name == 'hands' and hide_hands:
            continue
        sheet = Image.open(ROOT / f'assets/characters/an/{name}.png').convert('RGBA')
        cell.alpha_composite(sheet.crop((index%8*176,index//8*416,(index%8+1)*176,(index//8+1)*416)))
        if index == 66 and name == 'face':
            sheet = Image.open(ROOT / 'assets/characters/an/hair_back.png').convert('RGBA')
            cell.alpha_composite(sheet.crop((index%8*176,index//8*416,(index%8+1)*176,(index//8+1)*416)))
    return cell


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', nargs='*')
    parser.add_argument('--trousers-only', action='store_true')
    args = parser.parse_args()
    data = json.loads((SOURCE / 'generation.json').read_text(encoding='utf-8'))
    if data.get('studioTrouserSource'):
        pack_studio_trousers(data['studioTrouserSource'])
    if args.trousers_only:
        return
    if data.get('studioBodySource'):
        pack_studio_neck(data['studioBodySource'])
    garments = {g['id']: g for g in json.loads((ROOT/'src/content/studio.json').read_text(encoding='utf-8'))['garments']}
    entries = [e for e in data['assets'] if e.get('source') and (not args.only or e['id'] in args.only)]
    qa = Image.new('RGBA', (6*176, len(entries)*450), '#fff1df')
    draw = ImageDraw.Draw(qa)
    skirt_cells = None
    skirt_source = data.get('skirtSource')
    if skirt_source and any(e['id'] == 'ao-tu-than' for e in entries):
        source = Image.open(ROOT / skirt_source).convert('RGBA')
        skirt_cells = [fit_wearable(cloth_colors(v, None), i, {}, bottom=True) for i,v in enumerate(split_views(source, 4))]
        folder = ROOT/'assets/garments/ao-tu-than'
        strip = Image.new('RGBA', (528,416))
        for i in range(3): strip.alpha_composite(skirt_cells[i], (176*i,0))
        strip.save(folder/'ao-tu-than--bottom.png')
        skirt_cells[3].save(folder/'ao-tu-than--bottom-right.png')
    for row, entry in enumerate(entries):
        slug = entry['id']
        source = Image.open(ROOT / entry['source']).convert('RGBA')
        if entry.get('registration') == 'full-frame':
            registered = registered_cells(source, entry)
            cells = registered[:4]
            hanging = fit_hanging(registered[4].crop(registered[4].getchannel('A').getbbox()))
        else:
            views = [cloth_colors(v, entry.get('accent')) for v in split_views(source, 5)]
            cells = [fit_wearable(views[i], i, entry) for i in range(4)]
            hanging = fit_hanging(views[4])
        palette = garments[slug]['defaultColorPalette']
        folder = ROOT/'assets/garments'/slug
        strip = Image.new('RGBA', (528,416))
        for i in range(3): strip.alpha_composite(cells[i], (176*i,0))
        strip.save(folder/f'{slug}.png')
        cells[3].save(folder/f'{slug}--right.png')
        hanging.save(folder/f'{slug}--hanging.png')
        icon_from_hanging(hanging, palette).save(folder/f'{slug}--icon.png')
        for col,index in enumerate(DIRECTIONS):
            skirt = recolor(skirt_cells[col], ['#85879a','#4a4b60','#292b40','#101121']) if slug=='ao-tu-than' and skirt_cells else None
            qa.alpha_composite(an_cell(index, recolor(cells[col],palette), skirt, slug=='ao-ngu-than-tay-thung'),(col*176,row*450+24))
        qa.alpha_composite(recolor(hanging,palette),(4*176,row*450+24))
        qa.alpha_composite(Image.open(folder/f'{slug}--icon.png').convert('RGBA'),(5*176+40,row*450+140))
        draw.text((8,row*450+4),slug,fill='#2b2035')
        print(f'Packed {slug}: registered 3-view strip, right, hanging and icon.')
    (ROOT/'artifacts/wearables').mkdir(parents=True,exist_ok=True)
    qa.convert('RGB').save(ROOT/'artifacts/wearables/garments-contact.png')


if __name__ == '__main__':
    main()
