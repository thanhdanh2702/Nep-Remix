"""User-authorized mechanical C3 export helpers."""
from PIL import Image
import math
from c2_asset_tools import gray_keys


def clean(source):
    source=source.convert('RGBA')
    source.putdata([(r,g,b,255) if a>=128 else (0,0,0,0) for r,g,b,a in source.getdata()])
    return source


def pose_group(sources):
    if not sources:
        raise ValueError('Empty pose group')
    cuts=[]
    for source in sources:
        source=clean(source)
        bounds=source.getbbox()
        if bounds is None:
            raise ValueError('Empty pose')
        cuts.append(source.crop(bounds))
    # Shared normalized height avoids changing height when a hand/paper widens a pose.
    height=min(384, int(min(160*im.height/im.width for im in cuts)))
    frames=[]
    for cut in cuts:
        resized=cut.resize((max(1,round(cut.width*height/cut.height)),height),Image.Resampling.NEAREST)
        frame=Image.new('RGBA',(176,416))
        frame.paste(resized,((176-resized.width)//2,401-height))
        frames.append(frame)
    return frames


def roi_overlay(source, box):
    source=source.convert('RGBA')
    left,top,right,bottom=box
    if not (0<=left<right<=source.width and 0<=top<bottom<=source.height):
        raise ValueError('ROI outside source')
    result=Image.new('RGBA',source.size)
    result.paste(source.crop(box),(left,top))
    return result


def fit_layer(source, box, gray=False):
    source=clean(source)
    bounds=source.getbbox()
    if bounds is None:
        raise ValueError('Empty layer')
    left,top,right,bottom=box
    fitted=source.crop(bounds).resize((right-left,bottom-top),Image.Resampling.NEAREST)
    if gray:
        fitted=gray_keys(fitted)
    result=Image.new('RGBA',(176,416))
    result.paste(fitted,(left,top))
    return result


def crop_boxes(source, boxes):
    source=clean(source)
    result=[]
    for box in boxes:
        crop=source.crop(box)
        if crop.getbbox() is None:
            raise ValueError('Empty crop')
        result.append(crop.crop(crop.getbbox()))
    return result


def portrait(frame):
    bounds=frame.getbbox()
    top=bounds[1]
    return frame.crop((8,top,168,top+160)).resize((128,128),Image.Resampling.NEAREST)


def scene_actor(frame, center_x, foot_y, scale):
    """Scale uniformly for scene display; retain the visible bottom foot anchor."""
    if not math.isfinite(scale) or scale<=0:
        raise ValueError('Scale must be positive and finite')
    resized=frame.resize((max(1,round(frame.width*scale)),max(1,round(frame.height*scale))),Image.Resampling.NEAREST)
    bounds=resized.getbbox()
    if bounds is None:
        raise ValueError('Empty scene actor')
    layer=Image.new('RGBA',(1672,941))
    layer.alpha_composite(resized,(round(center_x-resized.width/2),round(foot_y+1-bounds[3])))
    return layer
