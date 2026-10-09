#!/usr/bin/env bash
# ---------------------------------------------------------------------------------------
# YOUTUBE FRAMES AND TRANSCRIPT, for research (Dovina's; the owner, 2026-10-08: "send out subagents to do research").
# The cloud container cannot download a video's stream (googlevideo answers 403), but YouTube's own scrubbing previews (the
# storyboards: sheets of 5 x 5 frames, 160 x 90 each, one every few seconds) and its captions come through. So a subagent can see what
# happens and when, at thumbnail size, and read what is said with timestamps. Not enough to read small UI text or count frames.
# Prior art: yt-dlp's storyboard formats (sb0) and auto-captions.
#
#   pip install -q yt-dlp      (once a session)
#   scripts/research/youtube_frames.sh <url> <out_dir>   -> <out_dir>/sheetNN.jpg, <out_dir>/captions.en.vtt
# ---------------------------------------------------------------------------------------
set -euo pipefail
url="$1"; out="$2"; mkdir -p "$out"
yt=(yt-dlp -q --no-warnings --js-runtimes "node:$(command -v node)" --remote-components ejs:npm)
"${yt[@]}" -f sb0 -o "$out/storyboard.%(ext)s" "$url"
"${yt[@]}" --skip-download --write-auto-subs --write-subs --sub-langs 'en,en-orig' --sub-format vtt -o "$out/captions" "$url" || true
python3 -I - "$out" <<'PY'
import email, sys, pathlib
out = pathlib.Path(sys.argv[1]); n = 0
for p in email.message_from_bytes((out / 'storyboard.mhtml').read_bytes()).walk():
    if p.get_content_type().startswith('image/'):
        n += 1; (out / f'sheet{n:02d}.jpg').write_bytes(p.get_payload(decode=True))
print(f'{n} sheets of 25 frames in {out}')
PY
