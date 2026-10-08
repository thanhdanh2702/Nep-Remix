"""Deterministic C2 image exports. No generation or gameplay changes.

User-approved mechanical operations only: crop, alpha cleanup, nearest resize,
canvas alignment and the repo's four grayscale palette keys.
"""
from PIL import Image


def actor_frame(source):
    source = source.convert('RGBA')
    bounds = source.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()
    if bounds is None:
        raise ValueError('Empty actor')
    cut = source.crop(bounds)
    scale = min(160 / cut.width, 384 / cut.height)
    cut = cut.resize((round(cut.width * scale), round(cut.height * scale)), Image.Resampling.NEAREST)
    result = Image.new('RGBA', (176, 416))
    result.paste(cut, ((176-cut.width)//2, 401-cut.height))
    return result


def split_four(source):
    return [source.crop((source.width*i//4, 0, source.width*(i+1)//4, source.height)) for i in range(4)]


def gray_keys(source):
    source = source.convert('RGBA')
    keys = (33, 97, 158, 224)
    output = Image.new('RGBA', source.size)
    output.putdata([(0, 0, 0, 0) if not a else
                    (v, v, v, a)
                    for r, g, b, a in source.getdata()
                    for v in [min(keys, key=lambda k: abs(k-(.2126*r+.7152*g+.0722*b)))]])
    return output
