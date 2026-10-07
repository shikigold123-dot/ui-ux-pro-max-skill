# Cut list → graded JPEG frame folders + shots.json for the renderer.
# Usage: python3 extract.py edl.json [--force]
# edl.json: {"grade": "G2" | "<ffmpeg filter chain>" | "none",
#            "shots": [{"id":"arr1","src":"mp4/0003.mp4","in":2.2,"a":3.2,"b":5.6,"sp":1.0,"fps":30,
#                       "crop":[x,y,(w,h)] (optional, native pixels → 1080×1920 window, e.g. a 4K clip's hands only),
#                       "proxy":true (optional: low-res proxy/LRF → denoise + lanczos upscale + unsharp),
#                       "clip":"0003" (optional; name the audio bed uses, default = src basename)}]}
# Rules: fps 60 only when the shot is slowed (sp < 1) — otherwise 30. Frames cover (b-a)*sp seconds + 0.2 s pad.
import json, os, subprocess, sys
G2 = ("curves=master='0/0 0.15/0.07 0.45/0.42 0.8/0.88 1/1',eq=saturation=1.38:contrast=1.12:gamma=0.97,"
      "colorbalance=rs=-0.06:gs=0.02:bs=0.06:rm=0.03:bm=-0.02:rh=0.05:gh=0.01:bh=-0.05")   # punchy, cool shadows / warm highlights
E = json.load(open(sys.argv[1])); force = '--force' in sys.argv
grade = {'G2': G2, 'none': ''}.get(E.get('grade', 'G2'), E.get('grade'))
man = json.load(open('shots.json')) if os.path.exists('shots.json') else {}
for s in E['shots']:
    sid, fps, sp = s['id'], s.get('fps', 30), s.get('sp', 1.0)
    L = (s['b'] - s['a']) * sp + 0.2
    d = f'frames/{sid}'; os.makedirs(d, exist_ok=True)
    if 'crop' in s:
        c = s['crop']; w, h = (c[2], c[3]) if len(c) > 2 else (1080, 1920)
        geo = f'crop={w}:{h}:{c[0]}:{c[1]},scale=1080:1920:flags=lanczos'
    else:
        geo = 'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920'
    if s.get('proxy'): geo = 'hqdn3d=1.5:1.5:4:4,' + geo + ',unsharp=5:5:0.6'
    vf = f'fps={fps},{geo},format=yuv420p' + (f',{grade}' if grade else '')
    have = len(os.listdir(d))
    if force or have < int(L * fps) - 2:
        for f in os.listdir(d): os.remove(os.path.join(d, f))
        subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', str(s['in']), '-i', s['src'], '-t', str(L), '-vf', vf, '-q:v', '2', f'{d}/%05d.jpg'], check=True)
    n = len(os.listdir(d))
    clip = s.get('clip', os.path.basename(s['src']).rsplit('.', 1)[0])
    man[sid] = dict(id=sid, clip=clip, src=s['src'], **{'in': s['in']}, a=s['a'], b=s['b'], sp=sp, n=n, dir=d, fps=fps)
    print(f"{sid:8s} {clip:10s} {s['a']:7.2f}–{s['b']:7.2f}  {n} frames", flush=True)
json.dump(man, open('shots.json', 'w'), indent=0)
