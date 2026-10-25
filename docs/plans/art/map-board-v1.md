# The map board, v1: what is kept, cut and added

Calissa's note on `map-board-v1.jpg` (its source `map-board-v1.html`). It covers the map overhaul round (the owner, 2026-10-25).
**It is a proposal.** Every line needs two rulings: **Dovina's**, on what the map must say (docs/plans/MAP.md, on claude/dovina-design),
and **Petra's**, on the code (`feedback/cartography.js`). The board is drawn to Dovina's MAP.md. Where my brief differed, her ruling
won. The names are plain until Espada names them (CLAUDE.md, "Plain names until settled").

How the board was made: headless shots of the map as it is, taken in this worktree after a walk and a Dreamvane survey in the Dunes and
the basement (desk 1280 x 800, phones 390 x 844 and 844 x 390), then one HTML page rendered with Playwright. Every count in panels B to D
is illustrative.

## Cut

| what | why |
| --- | --- |
| the title "MAP" | The window shows what it is, and the area's name is the title. |
| the nine layer buttons | Nine words before any map, and they name places not yet found, which is a spoiler. On a phone five of the nine run off the glass in portrait, CLOSE among them, and in landscape no CLOSE is on screen at all (measured). The island level and the floor stack replace them. |
| the map's own waypoint (the diamond: a click sets it, a right click clears it) | One needle, never two. A click or a long press on charted ground calibrates the Sight instead (Dovina's `calibrate({ point })`). |
| "you are here" | The arrow says it. |
| "N cells charted · M understood" | A cell is the code's unit, not the player's. After a survey the two numbers are always equal (159 and 159 in the shot). |
| "nothing charted here yet" | The blank slots say it. |
| the waypoint's key in the legend | One waypoint needs no key. |

## Moved

| what | to | why |
| --- | --- | --- |
| up to nine rooms with % bars | the checklist's ROOMS CHARTED row, N of M; the room list opens on tapping the row | A percentage per room is noise, and one count an area answers it. |
| the controls line | the pause menu's help, with the device's words shown once on the first opening | It is the longest line on the screen, and the legend that holds it overlaps the side panel at every size measured. |

## Kept, redrawn in the house's look

| what | how | why |
| --- | --- | --- |
| the three tiers (sensed, charted, understood), the walls | Ink washes on washi: sensed is a dry hatch, charted a sepia wash, understood a full wash flecked with gold. Walls are a dark stroke with a lit lip. | The god hand's arts need a tier of ground. The tiers are the second avenue for the hand's refusals. |
| the tiers' key | Shown only in the god hand and on the first opening. | The tiers matter to the hand. |
| a place's dot | Its name only once its room is charted, the dot alone before. | Hollow Knight: you chart it, the map doesn't tell you. |
| TRACK (the Sight's calibrate button) | In the room list, 44 px, lit gold while it is the waypoint. | It is the one way a found room becomes where you are going. |
| CLOSE (M) | The house's close mark, in the device's words, 44 px. | One way out. |
| Ariadne's Thread, the arrow, the Raceway's tracks, the Pneuka Jar's tether in the god hand | As now, in the sketch's colours. | Each is yours or the ground's. |
| the plates' brass frames | Smaller, on the area's page only. | Your own record. |
| drag, wheel and pinch | As now. Zooming out past the area's edge goes up to the island. | One gesture for both levels. |

## Added

| what | how | why |
| --- | --- | --- |
| **the area's page** (what the map opens on; panel C) | The Clay dress System window: the sketch at the left, the checklist beside it, the path strip on top (THE ISLAND ▸ THE DUNES ▸ THE GNOMON FLATS), and ISLAND and the close mark. | The next thirty seconds and the session on one page. |
| **the checklist** | One row a kind, `LABEL ······ N of M` in the counts face, a slot a thing (blank until found), gold when whole. The area's total is the page's one hero number. A kind the area holds none of is left off (the flats have no chest). Before you first enter, the page is the area's name and "???". | AREAS.md 6 and MAP.md 4. Spyro's totals, Xenoblade's blanks. |
| **the edges as marks** | A glazed chevron on the area's outline with the neighbour's name, "???" if unvisited, and DOWN at the Great Dunemaw's mouth. | FFXII's exits. |
| **the area's outline** | Its sector of the ring, dotted faintly on the paper. | The unknown has a shape and no contents. |
| **one line to come back for** | Under the checklist (the flats: "a new Great Dunemaw below" each game day). | AREAS.md 5's reason to come back. Dovina rules whether the page says it. |
| **the island level** (panel B) | A graph: the Dunes' five areas as annular tiles cut by bearing round the Weir, and the other places as chamfered tiles. Each visited tile is glazed in the window colour with its ground's silhouette pressed in and one summed N of M. The area you are in is lit, its keyline walking the schiller. A whole area gets a gold kintsugi rim. An unvisited neighbour is cracked bisque with "???". Anything further off isn't drawn. Walked ways are solid lines, and the Index's spokes are dotted. | MAP.md 2: the week at a glance. FFXII's region map, Outer Wilds' graph, Metroid's per-area number. |
| **B2, the scroll** (the alternative) | The same graph brushed in sumi on washi between two clay rollers, the area you are in stamped with your seal. | Okami's map. **The owner chooses B1 or B2.** I pick B1 for Anagami and would keep the scroll for when the islands' dresses diverge. |
| **the floor stack** | F2, F1 and B1 at the side of the page, inside a building only, your floor lit, each 44 px. | The one job the layer buttons did well. |
| **the phone layout** (panel D) | Portrait: on the island, the Dunes' ring fills the width. On an area's page, the sketch is above and the checklist is a sheet below with 44 px rows. Landscape: the sketch is at the left and the checklist at the right, with ISLAND and the close mark top right. | Every press is 44 CSS px or more, and type is 14 px or more (the settings window's rule). |

## What it costs (panel E; Petra measures it)

- **Today** (read from the code; computed, not profiled):
  - **Canvas:** one 2D canvas the size of the screen times the pixel ratio. At a 1280 x 800 desk with the ratio at 2 that is 16.4 MB; on the iPhone XR it is 5.9 MB.
  - **Drawing:** it is redrawn every frame while the map is open. At the Dunes' 1.2 px a metre that is up to about 12,000 cell lookups a frame.
  - **Memory:** after the first opening the canvas is kept at that size for the whole session.
- **Proposed:**
  - **Canvas:** one 2D canvas, only the sketch's box (about 4.7 MB at 2x). The island is DOM and inline SVG.
  - **Drawing:** it redraws only when something changes. The cells become three Path2D washes once an opening, so a redraw is about 30 canvas calls.
  - **GPU:** 0 draw calls, 0 textures and 0 shader programs added.
  - **DOM:** the window is built on opening and removed on closing. Closed, the canvas is sized to 0.
  - **Unchanged:** the cell store per layer and its save key (nothing charted is lost), the explored area's veil in the god hand, and the survey pulse.

## Seen along the way, for Petra

- The side panel and the legend overlap at every size measured.
- The Dunes open at 1.2 px a metre, so a few hundred metres charted on a 1,040 m layer reads as an empty screen. The area's page fixes
  this by framing the area.
- The Gnomon's anchor is named "THE SPIRE" (`boot/course.js`), but the glossary's word is the Gnomon.
