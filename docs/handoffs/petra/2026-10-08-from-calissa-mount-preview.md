**2026-10-08, from Calissa (Art): a mount's preview on the moored hull (branch art-mount-preview)** (delete in your branch when done)

**Built (mine):** `vfx/mountpreview.js` (`MountPreview`, `MOUNT_LOOK`), ridden by `vfx/mooring.js` (`game.mooring.preview(tool | null)`),
drawn in a new `wire` style of the rail mark (`vfx/railmark.js`: the same program, its depth written so the jetty, the hull and the
Courier hide it), and the workbench stage `ships:mounts` (a sloop and a frigate, every mount, from the jetty and above). CLARITY.md
section 6. Programs per scene unchanged (161 / 163 / 163 / 163); the preview's material is the rail mark's own program (same cache
key, measured); one instanced draw while shown, none otherwise; built at boot by the mooring.

**CROSSING (your files; each the smallest call-site edit, listed so you can keep, move or drop it):**
- `world/emocean/pier.js`, `open()`: each mount row `d.onmouseenter = () => g.mooring?.preview(t); d.onmouseleave = () =>
  g.mooring?.preview(this.chosen?.at(-1) ?? null);`; after the rows `g.mooring?.preview(chosen.at(-1) ?? null);`; and the page's options
  gain `aside: { left: 'right', right: 'left' }[g.mooring?.side()]` (the review's, below).
- `main.js`, the loop's modal branch: `game.mooring?.update(game.rawDt);` beside the seam's (the review's: without it the window that pauses the
  game stopped the preview at its fade's first frame, an alpha of 0.0001: casebook 131).
- `feedback/indexmenu.js`: `showPage(..., { aside })`, a page in a column (340 px, rooms one to a row) at one side with no veil
  (`#indexmenu[data-aside]`), so the hull and its preview stay in view while a mount is chosen (the review's; it answers ask 1 below until
  the card has its own layout). The index's own and a Shrine's pages are as they were.
- When the card (CLARITY section 4) replaces the rows, keep the two calls on the card (hover names it, leaving names the last aboard, the
  page's render names the last aboard). The mooring clears the preview itself when the Courier leaves the pier or casts off, and puts it
  back to the mount aboard when the page shuts (the pointer sends no leave: casebook 132).
- Checked as a person does it (hover, leave, click aboard, F, Esc, CLOSE, walk 250 m away): the Vacuum's cone, the Snapshot's frame and the
  Grapple's line seen on the Courier's camera with the page up, the hovered mount aboard after each way of shutting it, nothing after
  walking away.

**Asks (yours):**
1. **The card can lay out the choosing for itself.** The page is set aside (`aside`) as a stand-in so the preview is seen while a mount is
   chosen; Into the Breach shows it beside the card. If the card wants the hull framed (a camera shot from above and behind the jetty, the bow
   toward the panel's far side), the preview is already live under the window (the modal branch ticks the mooring).
2. **The Vacuum's cone is two widths.** `courier/ship/mounts.js` `gulp()` asks `inCone(..., 35, 8)`, and `inCone` takes a HALF-angle,
   so it swallows 70 degrees; `MOUNTS.lockheart.angle` is 35 (the brush's 50 is the whole width: `brush()` asks 25). The preview draws
   the table (35 wide). One of them changes; Dovina rules which (her handoff has the same question).
3. **The runtime could read the table.** `brush()` 25 and 9, `gulp()` 35 and 8, `hook()` 30 and 16, `toll()` 10 and 14 are literals
   beside `MOUNTS`' `range` and `angle`; read from the table, the preview and the sea can never disagree.
4. **`SCALE` in `courier/ship/ship.js` (0.24), exported,** would let the preview import it: it keeps a copy, `AT_SEA`, named for it.
   Every shape is drawn at its range divided by it (a 10 m ring at sea is 42 m round the moored hull, as it looks to the ship there).
