#!/usr/bin/env python3
"""
Generate remixed Detroit portraits offline — the same quadrant recombination
detroit_remix.html does in the browser, run headlessly so the results can be kept.

The full space is 39^4 = 2,313,441 combinations (~35GB), so this takes a COUNT
and samples it without repeating a combination.

  python3 scripts/detroit_variations.py [count] [outdir] [seed]

Every step below mirrors the page so the files match what the ring shows:
the half-scale colour pass, the 300x388 composite, and the feathered seams.
"""
import json, os, random, sys, colorsys
from PIL import Image

# Pool: whichever folder holds the sources you kept. Defaults to the culled set
# on the Desktop if it is there, otherwise the full set in the repo.
_culled = os.path.expanduser('~/Desktop/detroit_pool')
SRC   = os.environ.get('POOL') or (_culled if os.path.isdir(_culled)
        else os.path.join(os.path.dirname(__file__), '..', 'public', 'detroit'))
COUNT = int(sys.argv[1]) if len(sys.argv) > 1 else 500
OUT   = sys.argv[2] if len(sys.argv) > 2 else os.path.expanduser('~/Desktop/detroit_variations')
SEED  = int(sys.argv[3]) if len(sys.argv) > 3 else 1

RW, RH = 300, 388          # the composite size the card face has always been
SEAM   = int(os.environ.get('SEAM', 30))   # px of softening across the cut

# Read the pool off disk rather than hard-coding it, so culling the folder IS
# the edit — no list to keep in sync with what actually survived.
NAMES = sorted(f[:-5] for f in os.listdir(SRC) if f.endswith('.webp'))

def enhance(im):
    """The page's makeEnhancedCanvas: crush the deepest shadows, and lift
    saturation in the yellows, reds and blues that carry these portraits."""
    im = im.convert('RGB').resize((RW, RH), Image.LANCZOS)
    px = bytearray(im.tobytes())
    for i in range(0, len(px), 3):
        r, g, b = px[i] / 255, px[i+1] / 255, px[i+2] / 255
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        hd = h * 360
        if l < 0.25: l *= 0.7
        if 38 <= hd <= 72:    s = min(1.0, s * 1.70)
        if hd <= 22 or hd >= 338: s = min(1.0, s * 1.60)
        if 195 <= hd <= 265:  s = min(1.0, s * 1.55)
        r, g, b = colorsys.hls_to_rgb(h, l, s)
        px[i], px[i+1], px[i+2] = int(r * 255), int(g * 255), int(b * 255)
    return Image.frombytes('RGB', (RW, RH), bytes(px))

def ramp(rising, length, feather, centre):
    """One axis of the seam: flat, then a linear ramp across the cut, then flat."""
    lo, hi = centre - feather / 2, centre + feather / 2
    out = []
    for v in range(length):
        if v <= lo:   t = 0.0
        elif v >= hi: t = 1.0
        else:         t = (v - lo) / (hi - lo)
        out.append(t if rising else 1.0 - t)
    return out

def stencil(q):
    """Opaque over its own quarter, ramping to nothing across the seam — so
    neighbouring quarters crossfade instead of meeting at a line."""
    fx = ramp(q % 2 == 1, RW, SEAM, RW / 2)
    fy = ramp(q >= 2,     RH, SEAM, RH / 2)
    m = Image.new('L', (RW, RH))
    m.putdata([int(255 * fx[x] * fy[y]) for y in range(RH) for x in range(RW)])
    return m

def main():
    rng = random.Random(SEED)
    os.makedirs(OUT, exist_ok=True)

    print(f'enhancing {len(NAMES)} sources ...', flush=True)
    pool = [enhance(Image.open(os.path.join(SRC, n + '.webp'))) for n in NAMES]
    print('sources ready', flush=True)

    masks = [stencil(q) for q in range(1, 4)]   # q0 is the base, unmasked

    seen, manifest = set(), []
    n = 0
    while n < COUNT:
        combo = tuple(rng.randrange(len(pool)) for _ in range(4))
        if combo in seen:            # never emit the same combination twice
            continue
        seen.add(combo)

        comp = pool[combo[0]].copy()             # base: never leaves a hole
        for q in (1, 2, 3):
            comp.paste(pool[combo[q]], (0, 0), masks[q - 1])

        name = f'remix_{n:05d}.webp'
        comp.save(os.path.join(OUT, name), 'WEBP', quality=88, method=4)
        manifest.append({'file': name,
                         'quadrants': {'tl': NAMES[combo[0]], 'tr': NAMES[combo[1]],
                                       'bl': NAMES[combo[2]], 'br': NAMES[combo[3]]}})
        n += 1
        if n % 50 == 0: print(f'{n}/{COUNT}', flush=True)

    with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
        json.dump({'count': n, 'seed': SEED, 'seam': SEAM, 'size': [RW, RH],
                   'space': len(pool) ** 4, 'variations': manifest}, f, indent=1)
    print(f'done — {n} files in {OUT}', flush=True)

main()
