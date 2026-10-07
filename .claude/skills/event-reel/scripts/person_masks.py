# Person masks (rembg u2net_human_seg) for "text behind the person" and person-glow effects.
# Usage: venv/bin/python person_masks.py <shotId> [first] [last]   → fmasks/<shotId>/NNNNN.png (white, alpha = person)
# ~0.4 s/frame on CPU at 540×960 — only mask the frames you actually use. Check one mask visually before batching.
import sys, os
from rembg import remove, new_session
from PIL import Image, ImageFilter
sid = sys.argv[1]; d = f'frames/{sid}'; n = len(os.listdir(d))
a = int(sys.argv[2]) if len(sys.argv) > 2 else 1; b = int(sys.argv[3]) if len(sys.argv) > 3 else n
sess = new_session('u2net_human_seg'); os.makedirs(f'fmasks/{sid}', exist_ok=True)
for i in range(a, b + 1):
    out = f'fmasks/{sid}/{i:05d}.png'
    if os.path.exists(out): continue
    im = Image.open(f'{d}/{i:05d}.jpg').convert('RGB').resize((540, 960), Image.LANCZOS)
    m = remove(im, session=sess, only_mask=True).filter(ImageFilter.GaussianBlur(0.8))
    rgba = Image.new('RGBA', m.size, (255, 255, 255, 0)); rgba.putalpha(m); rgba.save(out)
print('done', sid, a, b)
