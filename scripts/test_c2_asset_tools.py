"""Mechanical art-export guarantees, independent of gameplay."""
import unittest
from pathlib import Path
import json
import hashlib
from html.parser import HTMLParser
from PIL import Image
from c2_asset_tools import actor_frame, split_four, gray_keys


class ExportTests(unittest.TestCase):
    def test_actor_preserves_proportion_and_bottom_anchor(self):
        source = Image.new('RGBA', (100, 300))
        source.paste((120, 60, 30, 255), (20, 10, 80, 290))
        result = actor_frame(source)
        self.assertEqual(result.size, (176, 416))
        bounds = result.getbbox()
        self.assertEqual(bounds[3], 401)
        self.assertAlmostEqual((bounds[2]-bounds[0])/(bounds[3]-bounds[1]), 60/280, delta=.005)
        self.assertEqual(result.getpixel((0, 0)), (0, 0, 0, 0))

    def test_empty_actor_rejected(self):
        with self.assertRaises(ValueError):
            actor_frame(Image.new('RGBA', (20, 20)))

    def test_four_strips_reconstruct_without_losing_remainder(self):
        source = Image.new('RGBA', (13, 7))
        source.putdata([(x*17, y*31, 80, 255) for y in range(7) for x in range(13)])
        strips = split_four(source)
        rebuilt = Image.new('RGBA', source.size)
        offset = 0
        for strip in strips:
            rebuilt.paste(strip, (offset, 0))
            offset += strip.width
        self.assertEqual(offset, source.width)
        self.assertEqual(rebuilt.tobytes(), source.tobytes())

    def test_grayscale_keys_and_original_alpha(self):
        source = Image.new('RGBA', (2, 1))
        source.putdata([(250, 210, 130, 180), (45, 20, 60, 0)])
        result = gray_keys(source)
        self.assertEqual(result.getpixel((0, 0)), (224, 224, 224, 180))
        self.assertEqual(result.getpixel((1, 0)), (0, 0, 0, 0))


class ProductionTests(unittest.TestCase):
    root = Path(__file__).resolve().parent.parent

    def test_export_manifest_dimensions_and_files(self):
        manifest = json.loads((self.root/'assets/areas/chapter-2/_raw/production-v4/manifest.json').read_text())
        for record in manifest['assets']:
            with Image.open(self.root/record['path']) as image:
                self.assertEqual(image.size, (record['width'], record['height']), record['path'])
            self.assertEqual(hashlib.sha256((self.root/record['path']).read_bytes()).hexdigest(),record['sha256'])

    def test_gallery_image_references_resolve(self):
        folder = self.root/'assets/areas/chapter-2/_raw/production-v4'
        class Images(HTMLParser):
            sources = []
            def handle_starttag(self, tag, attrs):
                if tag == 'img':
                    self.sources.append(dict(attrs)['src'])
        parser = Images()
        parser.feed((folder/'gallery.html').read_text())
        self.assertGreater(len(parser.sources),40)
        self.assertTrue(all((folder/source).is_file() for source in parser.sources))

    def test_safe_overlays_do_not_change_other_room_pixels(self):
        folder = self.root/'assets/areas/chapter-2/c2-s2-kho-vai-hang-dao'
        for state in ['ket-mo','ket-rong']:
            image = Image.open(folder/f'c2-s2-kho-vai-hang-dao--{state}.png').convert('RGBA')
            self.assertEqual(image.size,(1672,941))
            self.assertEqual(image.getchannel('A').getbbox(),(1236,353,1563,609))

    def test_production_puzzle_exact_reconstruction(self):
        folder = self.root/'assets/areas/chapter-2/c2-s1-gac-lung-ve-tranh'
        whole = Image.open(folder/'doc-c2-ban-ve-hoan-chinh.png').convert('RGBA')
        joined = Image.new('RGBA', whole.size)
        offset = 0
        for i in range(1,5):
            strip = Image.open(folder/f'doc-c2-manh-ban-ve-{i}.png').convert('RGBA')
            joined.paste(strip, (offset,0))
            offset += strip.width
        self.assertEqual(joined.tobytes(), whole.tobytes())

    def test_lemur_four_keys_and_covers_native_torso(self):
        garment = Image.open(self.root/'assets/garments/ao-dai-lemur/ao-dai-lemur.png').convert('RGBA')
        self.assertEqual(garment.size, (528,416))
        visible = {p[:3] for p in garment.getdata() if p[3]}
        self.assertLessEqual(visible, {(v,v,v) for v in [33,97,158,224]})
        body = Image.open(self.root/'assets/characters/an/body.png').convert('RGBA')
        for col,index in enumerate((0,22,66)):
            frame = body.crop((index%8*176,index//8*416,index%8*176+176,index//8*416+416))
            covered = total = 0
            for y in range(148,210):
                for x in range(176):
                    if frame.getpixel((x,y))[3] > 128:
                        total += 1
                        covered += garment.getpixel((col*176+x,y))[3] > 128
            self.assertGreater(covered/total, .95, f'Bare torso in view {col}: {covered}/{total}')


if __name__ == '__main__':
    import sys
    if '--coverage' not in sys.argv:
        unittest.main()
    else:
        import trace
        import dis
        import types
        import c2_asset_tools
        tracer = trace.Trace(count=True, trace=False)
        suite = unittest.defaultTestLoader.loadTestsFromModule(sys.modules[__name__])
        result = tracer.runfunc(unittest.TextTestRunner().run, suite)
        executable = set()
        def code_lines(code):
            executable.update(line for _,line in dis.findlinestarts(code) if line != code.co_firstlineno)
            for constant in code.co_consts:
                if isinstance(constant, types.CodeType):
                    code_lines(constant)
        for value in vars(c2_asset_tools).values():
            if isinstance(value, types.FunctionType):
                code_lines(value.__code__)
        hit = {line for (filename,line),count in tracer.results().counts.items()
               if Path(filename).resolve() == Path(c2_asset_tools.__file__).resolve() and count}
        percent = 100*len(executable & hit)/len(executable)
        print(f'Mechanical helper executable-line coverage: {percent:.1f}% ({len(executable & hit)}/{len(executable)})')
        raise SystemExit(0 if result.wasSuccessful() and percent >= 80 else 1)
