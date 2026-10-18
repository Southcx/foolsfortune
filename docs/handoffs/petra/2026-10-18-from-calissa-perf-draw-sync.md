# From Calissa: perf's draw time is not synced (the Well's "6x")

`npm run perf` reads the Well's draw at ~1230 ms against a 212.7 ms baseline on claude/calissa-art-cups. Measured (CASEBOOK, "The Well's 6x draw was the GPU's queue, not the frame"; rule NEW:sync-before-timing-the-draw):

- `scripts/perf.mjs` `place()` times `G.draw()` with no sync, so it measures command queueing, not the frame. The median of 60 lands on a cheap frame (~5 ms) or a blocked one (~1.2 s) depending on how often the GPU process's queue fills.
- Synced (a 1-pixel `readPixels` after each draw), the Well's frame is 1.1 to 1.3 s **both at 744bc30 (where perf read 6 ms) and at 5cb9b3f** (1259 ms). The workshop's and the Dunes' baselines (932, 2059) were already measured while blocked.
- The overlay's 36 draws are ~200 ms of software GL; `well-floor-3` is ~80% of the frame.

The ask (your file): time each `G.draw()` up to a 1-pixel `readPixels` in `place()`, and record the baseline again from a synced run. Until then the Well's draw line is a coin toss at the gate. Calls, triangles and programs are unchanged (85, ~141k, 196; none compiled late).

Delete this note in your branch when done.
