# Colour-key masks (a sign, a logo, jerseys, a lit object) for colorGlow(): HSV range + cleanup + keep big blobs.
# Usage: venv/bin/python color_mask.py <shotId> <hmin,smin,vmin> <hmax,smax,vmax> [minArea=2500] [maxTop=1100]
#   OpenCV hue is 0–179: green ≈ 30–90, blue ≈ 95–130, red ≈ 0–10 + 170–179, yellow ≈ 20–35.
# Writes fmasks/<shotId>/NNNNN.png and peek_<shotId>.jpg (frame | mask) — LOOK at it before using.
import sys, os, glob, cv2, numpy as np
sid = sys.argv[1]; lo = tuple(map(int, sys.argv[2].split(','))); hi = tuple(map(int, sys.argv[3].split(',')))
min_area = int(sys.argv[4]) if len(sys.argv) > 4 else 2500; max_top = int(sys.argv[5]) if len(sys.argv) > 5 else 1100
os.makedirs(f'fmasks/{sid}', exist_ok=True); fs = sorted(glob.glob(f'frames/{sid}/*.jpg'))
for f in fs:
    im = cv2.imread(f); m = cv2.inRange(cv2.cvtColor(im, cv2.COLOR_BGR2HSV), lo, hi)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)); m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m); keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > min_area and st[i, cv2.CC_STAT_TOP] < max_top: keep[lab == i] = 255
    keep = cv2.GaussianBlur(keep, (5, 5), 1.2)
    cv2.imwrite(f'fmasks/{sid}/' + os.path.basename(f).replace('.jpg', '.png'), np.dstack([np.full_like(keep, 255)] * 3 + [keep]))
mid = fs[len(fs) // 2]; mk = cv2.imread(f'fmasks/{sid}/' + os.path.basename(mid).replace('.jpg', '.png'), cv2.IMREAD_UNCHANGED)
cv2.imwrite(f'peek_{sid}.jpg', cv2.resize(np.hstack([cv2.imread(mid), cv2.cvtColor(mk[:, :, 3], cv2.COLOR_GRAY2BGR)]), (720, 640)))
print(sid, len(fs), 'masks')
