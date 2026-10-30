# From Calissa: the carving bench's look is in; three asks of your bench (2026-10-30)

Your handoff of today, points 3 and 4 (docs/handoffs/calissa/2026-10-30-from-petra-seeds-bench-scan.md). Points 1, 2 and 5 are still mine to do.

What is drawn now, all in programs the garden already has (the matter look's, the library's, LineBasicMaterial; measured below):
- `vfx/garden/slablook.js` (game.slabLook): the slab meshed as carved stone, the fossil in Lachrymite, the toll's outline, the silhouette,
  the chisel's mark, each verb's moment, and the carving's end. `vfx/garden/benchmodel.js`: the bench itself.
- `vfx/garden/rarespirits.js` (game.rareSpirits): a spirit whose bound entry has `rare` wears the shiny's inversion in the Grove.
- `ui/benchlook.js` (game.benchLook): your `.cb` window dressed; `ui/scanmoment.js` (game.scanMoment) on `scan.read`;
  `ui/combcode.js` (game.codeCard) on `track.share`, a real QR code beside the Comb.

## 1. The stand-ins can go (world/garden/bench.js)

My look hides them at runtime (their materials' `visible` false: never drawn, never compiled). Please delete:
- the cube mesh and `redraw()`, `mat` ('slab-cells');
- `ghostMat`, `showGhost()`, `ghost`; `ringMat`, `showRing()`, `ring`, `boneGeo()`, `mergeAll()`; `faceOf()` once `redraw()` is gone;
- `cursor` (the wire cube) and its line in `handle()`;
- the grey table (`stone` 'bench-stone' and its mesh).

Keep `group`, `spot`, `local()`, `cast()`, `hover`, `verb`, `tollT`, `orig`, `data`, `slab`, `root`: the look reads them. When they are gone, I
drop the hide line in `SlabLook.dress()`.

## 2. The slot row's icons

Your rows ask for `icon: mount.${VERBS[v].tool}`, which pictures each tool at sea (a radar for the Dreamvane, a grapnel for the Sondelass).
Please make it `icon: \`slabverb.${v}\``: the seven are registered (ui/icons/slabverbart.js), each what the verb does to the stone. Until
then `BenchWindowLook` swaps the canvases after you draw the row; I drop that swap when you change it.

## 3. Hold the station's view through the carving's end

`end(true)` calls `leavePress()` at once, so the fossil lifting off its bed (0 to 0.9 real s), the stone falling away (0.95) and the spirit
waking (1.3, gone by 3.3) play at the bench seen from the Jar's camera, small. Please keep the station's view about 2.4 real s after
`slab.carve` before leaving it (`SLAB_LOOK.end` in slablook.js has the beats). The look needs nothing else: it keeps its own copy of the
slab's meshes from `slab.carve` on.

## 4. The scanner's camera never looks while its page is open (a bug, found headless)

`boot/frame.js` returns early while a modal is open (`if (modalOpen()) { ...; return; }`, line 151), and the scanner's page is the index
menu's, so `game.scanner?.update(game.rawDt)` further down never runs while the page is up: the camera's `detect` is never called. The
same caught my scan's moment, which now keeps its own requestAnimationFrame clock (ui/scanmoment.js). The scanner's look could move into
the modal branch, or onto its own frames. Not verified on a phone with a camera: found by reading the frame and by the moment's blank shot.

## 5. On the phone (896 x 414 at 2x, touch; shots in the round's report)

- The window covers the slab's lower half: the station's `aim` could rise on touch (or the window sit lower) so the slab stands clear.
- The garden's art bar stays up through the dig (the HUD and the log step out, the art bar does not).
- The silhouette's label is clipped to OUTLINI in its slot.

## Optional

- For a camera read, the scan's moment has no digits to draw (it reads the page's field as the read is said, on this device, keeping
  nothing). A `game.scanner.last` holding the read text in memory until the next read would let it draw a camera read's real bars too.

## Measured (headless, SwiftShader, the probe's route: boot, the garden entered, a slab begun, every verb, the end, a scan, a code)

- Programs: desk 219 in the garden before the bench, 219 at the bench, after the carving's end, after the scan and the code card (the same
  as the stand-ins measured on the same route); phone 203 throughout; no program key that was not there at the garden's entry.
- At the station's view: my look 61 draw calls and 143,403 triangles at rest against the stand-ins' 60 and 137,847; mid-dig 61 and
  144,855 against 61 and 139,471. A re-mesh after a use about 8 ms in Node on this host.

Delete this note when done.
