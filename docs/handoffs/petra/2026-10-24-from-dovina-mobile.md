# From Dovina: mobile play, to discuss (docs/plans/MOBILE.md)

The owner, 2026-10-24: "plan for eventual full mobile play that integrates with the mouse+keyboard build ... get with petra and discuss it
thoroughly". The plan is MOBILE.md; the three audits behind it are in `docs/plans/research/MOBILE-AUDIT-*.md` (input, UI, perf: the perf one
is your territory, read it first; nothing in it was measured on a phone). Most of the build is yours. My questions, MOBILE.md section 10:

1. **Input actions and axes.** `input.action(id)` (held, pressed, released) and `input.axis(id)` (-1..1) beside the key sets, written by
   the keyboard, mouse, a touch driver and a pad driver; the key codes stay readable so systems move over one at a time. Where does it
   live (core/input.js or a module beside it)? I write the bindings table's contents (`ACTIONS`: id, keys, mouse, pad, touch control,
   context); you own the layer. The skiff's steer and the Courier's walk-run-sprint want analog axes: the core movement unchanged on keys
   (full push = the key). Your call on how the movement reads an axis without touching its feel.
2. **Touch mode for the shell.** No pointer lock on touch and its loss not the pause; a pause button and a top bar of window icons;
   `cursorFree` contexts take the finger as the cursor; the last device wins (`input.device`).
3. **Measure first.** A `?perf` readout (the F3 numbers in a corner) so the owner can screenshot four places on their phone: the workshop,
   the Dunes, the Raceway, the god hand. Then the phone tier's contents come from those numbers. Also: does the published page's host allow
   fullscreen, an orientation request, a wake lock and a manifest (home-screen install lifts iOS's 7-day storage eviction)?
4. **The phone tier's candidates** (from the audit, for you to judge): MSAA off; the shadow pass at a lower rate and size (a third of GL
   calls); outline hulls near the camera only (a third of the main pass's draws; Calissa's look, so with her); a 30 fps cap with steady
   pacing; the detector reading touch and the screen (an iPhone lands on High today: "Apple GPU" matches nothing); a direct-to-canvas path
   where half-float targets are missing.
5. **Boot**: rooms loaded on first entry (as the Raceway's ground, the garden, a Well floor already are); the shader warm-up shown and
   spread; the workbench out of the published bundle (game.js is 13.3 MB, 79% of the host's per-file limit).
6. **Save**: flush on `pagehide` and `visibilitychange`; a failed write said in the log; context loss handled with a message.
7. **Headless touch**: Playwright's `hasTouch`/`isMobile` at a phone viewport (I drove one at 844 x 390 for the mockup: it boots and
   races) so the sweeps and the stress test drive the touch driver as each phase lands.
8. **M0's size**: what of the above fits your next round, and in what order? My proposal: actions and axes, the touch and pad drivers, the
   shell's touch mode, `?perf`, the plumbing; then M1 is the Solar Skiff on touch (MOBILE.md 8), which I map once the layer exists.

Reply in one message when you have read it; anything that lasts goes in MOBILE.md section 10 (I will record your answers).
