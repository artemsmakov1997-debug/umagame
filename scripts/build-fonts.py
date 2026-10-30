"""Rebuild local UI fonts. Requires fonttools; not needed to run the game."""
from pathlib import Path
import re, json
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
# A condensed derivative preserves the readable lowercase pixel alphabet.
font = TTFont(root / 'assets/fonts/PressStart2P-Regular.ttf')
recordings = {}
for name, glyph in font.getGlyphSet().items():
    recording = DecomposingRecordingPen(font.getGlyphSet())
    glyph.draw(recording); recordings[name] = recording
for name in font.getGlyphOrder():
    pen = TTGlyphPen(None)
    recordings[name].replay(TransformPen(pen, (.53, 0, 0, 1, 0, 0)))
    font['glyf'][name] = pen.glyph()
    advance, bearing = font['hmtx'][name]
    font['hmtx'][name] = (round(advance * .53), round(bearing * .53))
for record in font['name'].names:
    if record.nameID in (1, 3, 4, 6):
        record.string = ('Uma Text' if record.nameID != 6 else 'UmaText').encode(record.getEncoding())
font.save(root / 'assets/fonts/UmaText.ttf')

# Original heavy bitmap capitals, shared with the canvas lettering.
source = (root / 'pixel.js').read_text()
part = re.search(r'const displayGlyphs=(\{.*?\n\});', source, re.S).group(1)
glyphs = json.loads(part.replace("'", '"'))
extra = {
 'А': ['01111100','11111110','11000110','11000110','11111110','11111110','11000110','11000110'],
 'Б': ['11111110','11111110','11000000','11111100','11111110','11000110','11111110','11111100'],
 'Г': ['11111110','11111110','11000000','11000000','11000000','11000000','11000000','11000000'],
 'З': ['11111100','11111110','00000110','00111100','00111110','00000110','11111110','11111100'],
 'Й': ['01101100','00111000','11000110','11001110','11011110','11110110','11100110','11000110'],
 'К': ['11000110','11001100','11011000','11110000','11111000','11011100','11001110','11000110'],
 'Л': ['00111110','01111110','01100110','01100110','01100110','01100110','11100110','11000110'],
 'М': ['11000110','11101110','11111110','11010110','11000110','11000110','11000110','11000110'],
 'Н': ['11000110','11000110','11000110','11111110','11111110','11000110','11000110','11000110'],
 'П': ['11111110','11111110','11000110','11000110','11000110','11000110','11000110','11000110'],
 'Ф': ['00110000','01111100','11111110','11010110','11111110','01111100','00110000','00110000'],
 'Ц': ['11000110','11000110','11000110','11000110','11000110','11111110','11111111','00000011'],
 'Ч': ['11000110','11000110','11000110','11111110','01111110','00000110','00000110','00000110'],
 'Ш': ['11010110','11010110','11010110','11010110','11010110','11010110','11111110','11111110'],
 'Щ': ['11010110','11010110','11010110','11010110','11010110','11111110','11111111','00000011'],
 'Ъ': ['11110000','11110000','00110000','00111100','00111110','00110110','00111110','00111100'],
 'Ы': ['11000011','11000011','11000011','11111011','11111111','11001111','11111111','11111011'],
 'Ь': ['11000000','11000000','11000000','11111100','11111110','11000110','11111110','11111100'],
 'Э': ['01111100','11111110','00000110','00111110','00111110','00000110','11111110','01111100'],
 'Ю': ['11011100','11111110','11100110','11100110','11100110','11100110','11111110','11011100'],
 'Я': ['01111110','11111110','11000110','11111110','01111110','00110110','01100110','11000110'],
 'Ё': ['01101100','00000000','11111110','11000000','11111100','11000000','11111110','11111110'],
}
glyphs.update(extra)
fb = FontBuilder(1000, isTTF=True)
order = ['.notdef', 'space'] + [f'uni{ord(c):04X}' for c in glyphs]
fb.setupGlyphOrder(order)
outlines, metrics = {}, {}
for name in order[:2]:
    outlines[name] = TTGlyphPen(None).glyph()
    metrics[name] = (360, 0)
cmap = {32:'space'}
for char, rows in glyphs.items():
    name = f'uni{ord(char):04X}'
    pen = TTGlyphPen(None)
    edges = set()
    for y, row in enumerate(rows):
        for x, pixel in enumerate(row):
            if pixel == '1':
                left, bottom = x * 80, (7-y) * 100
                points = [(left,bottom),(left,bottom+100),(left+80,bottom+100),(left+80,bottom)]
                for a,b in zip(points, points[1:]+points[:1]):
                    if (b,a) in edges: edges.remove((b,a))
                    else: edges.add((a,b))
    # Join the bitmap's outer boundaries so rasterization has no seams between pixels.
    while edges:
        a,b = min(edges); start=a; pen.moveTo(a)
        while True:
            edges.remove((a,b)); pen.lineTo(b)
            if b==start: break
            candidates=[end for begin,end in edges if begin==b]
            dx,dy=b[0]-a[0],b[1]-a[1]
            end=min(candidates,key=lambda end:dx*(end[1]-b[1])-dy*(end[0]-b[0]))
            a,b=b,end
        pen.closePath()
    outlines[name], metrics[name] = pen.glyph(), (720,0)
    cmap[ord(char)] = name
    if char.lower() != char: cmap[ord(char.lower())] = name
fb.setupCharacterMap(cmap); fb.setupGlyf(outlines); fb.setupHorizontalMetrics(metrics)
fb.setupHorizontalHeader(ascent=880, descent=-120)
fb.setupNameTable({'familyName':'Uma Display','styleName':'Regular','uniqueFontIdentifier':'UmaDisplay-1','fullName':'Uma Display','psName':'UmaDisplay','version':'Version 1.0'})
fb.setupOS2(sTypoAscender=880,sTypoDescender=-120,usWinAscent=880,usWinDescent=120)
fb.setupPost(); fb.setupMaxp()
fb.save(root / 'assets/fonts/UmaDisplay.ttf')
