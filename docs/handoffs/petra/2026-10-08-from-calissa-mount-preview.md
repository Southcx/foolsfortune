**2026-10-08, from Calissa (Art): a mount's preview on the moored hull (branch art-mount-preview)** (delete in your branch when done)

**Built (mine):** `vfx/mountpreview.js` (`MountPreview`, `MOUNT_LOOK`), ridden by `vfx/mooring.js` (`game.mooring.preview(tool | null)`),
drawn in a new `wire` style of the rail mark (`vfx/railmark.js`: the same program, its depth written so the jetty, the hull and the
Courier hide it), and the workbench stage `ships:mounts` (a sloop and a frigate, every mount, from the jetty and above). CLARITY.md
section 6. Programs per scene unchanged (161 / 163 / 163 / 163); the preview's material is the rail mark's own program (same cache
key, measured); one instanced draw while shown, none otherwise; built at boot by the mooring.

**CROSSING (your `world/emocean/pier.js`, `open()`, the mounts' rows: two lines):**
- each mount row: `d.onmouseenter = () => g.mooring?.preview(t); d.onmouseleave = () => g.mooring?.preview(this.chosen?.at(-1) ?? null);`
- after the rows: `g.mooring?.preview(chosen.at(-1) ?? null);` (the mount last taken aboard, so a click aboard shows it at once).
- When the card (CLARITY section 4) replaces these rows, keep the two calls on the card: hover names it, leaving names the last
  aboard, and the page's render names the last aboard. The mooring clears it itself when the Courier leaves the pier or casts off.
- Checked as a person does it (hover, leave, click aboard, F, walk 250 m away): soulbrush on opening, lockheart hovered, soulbrush on
  leaving, lockheart clicked aboard, lockheart kept with the page shut, nothing after walking away.

**Asks (yours):**
1. **The pier page hides the preview while you choose.** The index window's veil is `rgba(20,9,6,.78)` over the whole screen with the
   panel in the middle, so the moored hull and its preview are dark behind it; they read only once the page shuts. Into the Breach
   shows the preview beside the card. Either: the pier's page docked to one side with a lighter veil (a `showPage` option, say
   `{ side: true }`: `#indexmenu.side { justify-content: flex-end; background: rgba(20,9,6,.3) }`), or a camera shot framing the
   moored hull while the page is open (from above and behind the jetty, the bow toward the panel's far side). The preview draws at once
   on a hover even while the world is paused.
2. **The Vacuum's cone is two widths.** `courier/ship/mounts.js` `gulp()` asks `inCone(..., 35, 8)`, and `inCone` takes a HALF-angle,
   so it swallows 70 degrees; `MOUNTS.lockheart.angle` is 35 (the brush's 50 is the whole width: `brush()` asks 25). The preview draws
   the table (35 wide). One of them changes; Dovina rules which (her handoff has the same question).
3. **The runtime could read the table.** `brush()` 25 and 9, `gulp()` 35 and 8, `hook()` 30 and 16, `toll()` 10 and 14 are literals
   beside `MOUNTS`' `range` and `angle`; read from the table, the preview and the sea can never disagree.
4. **`SCALE` in `courier/ship/ship.js` (0.24), exported,** would let the preview import it: it keeps a copy, `AT_SEA`, named for it.
   Every shape is drawn at its range divided by it (a 10 m ring at sea is 42 m round the moored hull, as it looks to the ship there).
