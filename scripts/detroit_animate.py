#!/usr/bin/env python3
"""
Render the black-ground 8x10 remix as a frame sequence and encode it at 5fps.

Mirrors detroit_remix_6.html step for step: the half-scale colour pass, the
per-seed border flood that repaints the ground, and the 8x10 grid with feathered
seams. Every frame is a fresh draw of the cells, so the animation is the ring's
re-roll — just stepped rather than cross-dissolved.

  python3 scripts/detroit_animate.py [frames] [outdir] [seed] [ground_hex]
"""
import json, os, random, sys, colorsys, subprocess
from PIL import Image
from collections import deque

FRAMES = int(sys.argv[1]) if len(sys.argv) > 1 else 120
OUT    = sys.argv[2] if len(sys.argv) > 2 else os.path.expanduser('~/Desktop/detroit_animation')
SEED   = int(sys.argv[3]) if len(sys.argv) > 3 else 1
GROUND = sys.argv[4] if len(sys.argv) > 4 else '000000'

POOL = os.path.expanduser('~/Desktop/detroit_pool')
if not os.path.isdir(POOL):
    POOL = os.path.join(os.path.dirname(__file__), '..', 'public', 'detroit')

RW, RH = 300, 388
COLS, ROWS = 8, 10
CELLS = COLS * ROWS
SEAM = max(2, round(0.14 * min(RW / COLS, RH / ROWS)))
TOL = 62
FPS = 5

G = (int(GROUND[0:2], 16), int(GROUND[2:4], 16), int(GROUND[4:6], 16))

def enhance(im):
    """The page's colour pass: crush deep shadows, lift the yellows/reds/blues."""
    im = im.convert('RGB').resize((RW, RH), Image.LANCZOS)
    px = bytearray(im.tobytes())
    for i in range(0, len(px), 3):
        r, g, b = px[i]/255, px[i+1]/255, px[i+2]/255
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        hd = h * 360
        if l < 0.25: l *= 0.7
        if 38 <= hd <= 72:        s = min(1.0, s * 1.70)
        if hd <= 22 or hd >= 338: s = min(1.0, s * 1.60)
        if 195 <= hd <= 265:      s = min(1.0, s * 1.55)
        r, g, b = colorsys.hls_to_rgb(h, l, s)
        px[i], px[i+1], px[i+2] = int(r*255), int(g*255), int(b*255)
    return Image.frombytes('RGB', (RW, RH), bytes(px))

def paint_ground(im):
    """Flood in from every border pixel, each carrying its OWN colour as the
    reference for that region — one average across the whole border matches
    neither half of a portrait that is dark at the top and figure at the bottom."""
    px = im.load()
    w, h = im.size
    seen = bytearray(w * h)
    tol2 = TOL * TOL * 3
    hits = []
    def flood(sx, sy):
        sr, sg, sb = px[sx, sy]
        q = deque([(sx, sy)])
        while q:
            x, y = q.popleft()
            k = y * w + x
            if seen[k]: continue
            seen[k] = 1
            r, g, b = px[x, y]
            if (r-sr)**2 + (g-sg)**2 + (b-sb)**2 > tol2: continue
            hits.append((x, y))
            if x > 0:     q.append((x-1, y))
            if x < w - 1: q.append((x+1, y))
            if y > 0:     q.append((x, y-1))
            if y < h - 1: q.append((x, y+1))
    for x in range(w):
        if not seen[x]: flood(x, 0)
        if not seen[(h-1)*w + x]: flood(x, h-1)
    for y in range(h):
        if not seen[y*w]: flood(0, y)
        if not seen[y*w + w-1]: flood(w-1, y)
    # Guard: if it took nearly everything the ground was never distinct.
    if len(hits) / (w*h) > 0.82: return im
    for x, y in hits: px[x, y] = G
    return im

def ramp(idx, count, length):
    lo, hi = idx*(length/count), (idx+1)*(length/count)
    f = SEAM
    out = []
    for v in range(length):
        a = 1.0
        if idx > 0:
            a = min(a, 0.0 if v <= lo-f/2 else 1.0 if v >= lo+f/2 else (v-(lo-f/2))/f)
        if idx < count-1:
            a = min(a, 1.0 if v <= hi-f/2 else 0.0 if v >= hi+f/2 else 1-((v-(hi-f/2))/f))
        out.append(a)
    return out

def stencil(q):
    fx = ramp(q % COLS, COLS, RW)
    fy = ramp(q // COLS, ROWS, RH)
    m = Image.new('L', (RW, RH))
    m.putdata([int(255 * fx[x] * fy[y]) for y in range(RH) for x in range(RW)])
    return m

def main():
    rng = random.Random(SEED)
    os.makedirs(OUT, exist_ok=True)
    names = sorted(f[:-5] for f in os.listdir(POOL) if f.endswith('.webp'))
    print(f'{len(names)} sources; enhancing + painting ground ...', flush=True)
    pool = [paint_ground(enhance(Image.open(os.path.join(POOL, n + '.webp')))) for n in names]
    print('sources ready; building stencils ...', flush=True)
    masks = [stencil(q) for q in range(1, CELLS)]   # cell 0 is the unmasked base

    manifest = []
    for n in range(FRAMES):
        pick = [rng.randrange(len(pool)) for _ in range(CELLS)]
        comp = pool[pick[0]].copy()                 # base: never leaves a hole
        for q in range(1, CELLS):
            comp.paste(pool[pick[q]], (0, 0), masks[q-1])
        comp.save(os.path.join(OUT, f'frame_{n:04d}.png'))
        manifest.append({'frame': n, 'cells': [names[i] for i in pick]})
        if (n+1) % 20 == 0: print(f'{n+1}/{FRAMES}', flush=True)

    json.dump({'frames': FRAMES, 'fps': FPS, 'grid': [COLS, ROWS], 'seam': SEAM,
               'ground': '#' + GROUND, 'seed': SEED, 'sources': len(names),
               'manifest': manifest}, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)

    mp4 = os.path.join(OUT, 'detroit_black_5fps.mp4')
    subprocess.run(['ffmpeg','-y','-v','error','-framerate',str(FPS),
                    '-i', os.path.join(OUT,'frame_%04d.png'),
                    '-vf','scale=600:-2:flags=lanczos','-c:v','libx264',
                    '-pix_fmt','yuv420p','-crf','18', mp4], check=True)
    gif = os.path.join(OUT, 'detroit_black_5fps.gif')
    subprocess.run(['ffmpeg','-y','-v','error','-framerate',str(FPS),
                    '-i', os.path.join(OUT,'frame_%04d.png'),
                    '-vf','scale=400:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse',
                    gif], check=True)
    print('done ->', mp4, flush=True)

main()
