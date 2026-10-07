# Track a round object (ball, plate, wheel, gym ring) on RENDERED frames (so it includes your camera moves) with Hough circles,
# then smooth. Render the frames without the overlay first:
#   NOEARTH=1 FRAMES=$(seq -s, 1798 1856) node render/drive.js 0 0 trk stills
#   venv/bin/python ball_track.py trk balltrack.json [minR=90] [maxR=260]
# If the scene is later re-framed (pushFrame), DON'T re-track: transform analytically x' = px + (x - px) * z.
import sys, glob, json, cv2, numpy as np
d, out = sys.argv[1], sys.argv[2]; rmin = int(sys.argv[3]) if len(sys.argv) > 3 else 90; rmax = int(sys.argv[4]) if len(sys.argv) > 4 else 260
raw = {}
for f in sorted(glob.glob(f'{d}/*.jpg')):
    g = cv2.GaussianBlur(cv2.cvtColor(cv2.resize(cv2.imread(f), (270, 480)), cv2.COLOR_BGR2GRAY), (5, 5), 1.5)
    c = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, dp=1.2, minDist=300, param1=80, param2=26, minRadius=rmin // 4, maxRadius=rmax // 4)
    fr = int(f[-9:-4])
    if c is not None: x, y, r = c[0][0] * 4; raw[fr] = [float(x), float(y), float(r)]
    print(fr, raw.get(fr), end=' | ', flush=True)
fr = sorted(raw)
if not fr: sys.exit('no circles found — adjust radii / check frames')
# reject jumps, interpolate gaps, smooth (5-frame moving average)
arr = np.array([raw[k] for k in fr]); med = np.median(np.abs(np.diff(arr[:, :2], axis=0)), axis=0) + 1
good = [fr[0]] + [fr[i] for i in range(1, len(fr)) if np.all(np.abs(np.array(raw[fr[i]][:2]) - np.array(raw[fr[i - 1]][:2])) < 8 * med)]
full = np.arange(fr[0], fr[-1] + 1)
cols = [np.interp(full, good, [raw[k][j] for k in good]) for j in range(3)]
cols = [np.convolve(np.pad(c, 2, mode='edge'), np.ones(5) / 5, 'valid') for c in cols]
json.dump({int(f): [round(cols[0][i]), round(cols[1][i]), round(cols[2][i])] for i, f in enumerate(full)}, open(out, 'w'))
print('\nsaved', out, len(full), 'frames')
