# From Petra: the action mode's phone screen, triaged (South, 2026-10-29)

For **Calissa** (the build: `src/ui/touch/`, `src/ui/hudlayout.js`) and **Dovina** (the rule: `docs/plans/MOBILE.md`).
South's two screenshots of v343 on the phone: `refs/2026-10-29-south-foot-phone.jpg` and `refs/2026-10-29-south-duel-phone.jpg`.

## South's words
- "the blink tile should be folded into the current dash tile, since dash doesn't work in a grounded state as it's controlled by the
  control stick"
- "the other buttons like skiff, swap, and draw/unsheathe need to be moved to the top of the screen, as they're currently causing much
  visual clutter"
- "the menu tiles for the pneuka box/chat log should be moved to be flush with the top left corner, with only a few pixels of padding"
- "keep the center 60% of the screen clear when in the third person action mode"
- "Coordinate with Calissa and Dovina on how we can better triage the UI in the future using prior art of other mobile game ports for
  reference. Use meticulous visual referencing."

## Done in my files (v344, main af1003e)
- **The DASH tile's press on the ground is BLINK.** The tile stays `dash`. A new ctx `foot.ground` is live on foot when the Courier is
  grounded and standing and Blink is learned (`core/actions.js live()`). Its row is `blink.ground` (KeyE, `core/bindings.js`), which shadows
  `dash` there. In the air or crouched, the tile is DASH as before. Tested headless: the tile on the ground fired `blink` and moved the Courier 6.05 m.
- To show which press the tile will make: `game.actions.resolve('touch', 'dash')?.id === 'blink.ground'`.

## Measured on v344 (896 x 414, touch, the Weir, on foot, nothing drawn)
The center 60% is **x 179..717, y 83..331**. These stand inside it today:

| tile | x, y, w, h (CSS px) |
| --- | --- |
| SKIFF | 506, 189, 50, 47 |
| SWAP | 566, 189, 44, 47 |
| LEND (GRAPPLE) | 620, 189, 64, 47 |
| DRAW | 694, 189, 44, 47 |
| BLINK (the strip's) | 682, 128, 50, 47 |
| the log's ticker | 8..428, 60..128 (into the box from x 179, y 83) |

The top bar (MENU, LOG, PAUSE) stands at x 139..307, y 3..58: not flush to the corner.
The strip's room is `areas.strip` { x 456, y 76, w 282, h 180 }. It is the strip's whole reservation, and it lies inside the box.

## Asks
**Calissa** (the build):
1. **The DASH tile's face follows its press.** On the ground, standing, with Blink learned, it shows BLINK (glyph and word); otherwise it shows DASH.
   - The separate BLINK tile goes (the cluster's fourth, `footCluster`; the strip's end, `stripOf` on foot), so there is one blink tile on screen at a time.
   - With a tool out there is no DASH tile. Keep BLINK in the top row there, or give the tool cluster a DASH. Your call, as long as there is one.
2. **The strip and the belt's pair go to the top edge.** SKIFF, SWAP, LEND, DRAW / STOW, and a tool's own row stand in one row, at the top
   bar's height, between the top bar and the Sight.
3. **The top bar sits flush in the top-left corner,** inside the safe area with the gutter (8 px) or less.
4. **Nothing of ours stands in the center 60%** in the third person action mode. That includes the log's ticker: shorten it or drop it
   under the top bar's row.
   - World marks and a tag on a thing (the lock-on's) are the overlay's and may stand there.
   - Look at it at 896 x 414 at 2x, touch, before pushing. Do it with nothing drawn, with the psygun drawn, and at the Raceway.

**Dovina** (the rule, in MOBILE.md, before the next touch round):
1. **The phone screen's zones as a rule:** the center 60% clear; each corner's job; a count for each zone; and what gives way first when a
   zone is full (progressive disclosure: a "more" fold, a radial, a held tile).
2. **Prior art, with pictures:**
   - Take three to five ports or mobile-first action games: Genshin Impact, Honkai: Star Rail or Zenless Zone Zero, Call of Duty Mobile,
     Fortnite mobile (its HUD layout editor), Diablo Immortal, Wuthering Waves.
   - Take one reference shot of each at a phone's landscape, with the zones drawn over it.
   - Say what each does with the third, fourth and fifth verbs, and where its menus live.
3. **Every tile we draw, placed by the rule:** name its zone and when it shows. Calissa then judges the look of each against the shots.

Verified: my two changes, headless. Not verified: anything above that is not built yet.
