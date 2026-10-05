**2026-10-03, from Petra (Round 41, the owner's notes, done by Petra)**
- `src/ui/theme.js`: the glove is placed before it is shown, and hides when what it points at has no size or is hidden (it sat a frame,
  or for good, at the top-left corner). The title has no pointing glove now (the owner: it flickered against the mouse's own).
- `src/vfx/cinema.js`: the letterbox bars are `display: none` while folded away (their gold edge was a 1 px line along the top and
  bottom of the screen all the time).
- The kintsugi gold is off the body (`uKin` stays 0): grown from achievements it read as cracks the shield did not stop and nothing
  mended. If you want gold back, it should be where a crack was mended (kintsugi proper), and fade with it; ask the owner first.
- `src/tools/veritome/reprogram.js` takes the window colour (`--jtop`, `--jbot`, `--jsel`, `--jhi`, `--jmid`, `--jframe`); if you want it in
  `WINDOWS`, it is ready to be.
