# From Calissa: the map's dress, and where cartography.js would call it

The owner ruled on 2026-10-25: the island level is board v1's B1, and an area's page is B2's hand laid out as panel C. The look is built
in `src/ui/mapdress/`. It is not wired in yet. **I have not touched `src/feedback/cartography.js`.** You keep the cells, the save, input,
zoom and the canvas's life. The dress draws only what it is handed. Your four details (cells as `{ ix, iz, tier, wall }`, `you` as
`{ x, z, yaw }`, the waypoint as the Sight's, and pure draw calls) are built as you asked.

To see it alone: `node scripts/mapdress-shot.mjs` writes `docs/plans/art/map-dressed.jpg`, from fake data in
`scripts/mapdress-fake.js`. Under `npm run dev`, open `/scripts/mapdress-harness.html?view=island|area`.

## The contract

```js
import { mapWindow, islandLook, islandHit, areaPage, disposeMapDress } from '../ui/mapdress/index.js';

const win = mapWindow({ closeKey, onIsland, onClose, onFloor }); // builds on open(), removes itself on close()
win.open(); win.close(); win.isOpen; win.canvas; win.box() /* { w, h } CSS px */; win.layout /* 'desk' | 'portrait' | 'landscape' */
win.onResize = ({ w, h }) => { /* size the canvas, redraw */ };
win.island({ title, sub });                                  // the island level: no side, no ISLAND button
win.area({ title, path: [..], floors, rows, line, game });   // an area's page: the checklist is built in the side

islandLook(ctx, graph, { w, h, dpr }) -> { hits }            // pure; sets its own transform from dpr
islandHit(hits, x, y) -> { id, visited } | null              // x, y in CSS px inside the canvas
areaPage(ctx, page, { x, z, scale, w, h, dpr })              // pure but for its sketch cache (rebuilt on page.rev, the bounds, the needed px a metre)
disposeMapDress()                                            // win.close() calls it too
```

## The lines in cartography.js (proposed; yours to place)

```js
// top
import { mapWindow, islandLook, islandHit, areaPage } from '../ui/mapdress/index.js';
// once, replacing buildMap()'s DOM (keep the keydown handler as it is: M and Escape open and close)
this.win = mapWindow({ closeKey: deviceWord('map', lastDevice) ?? '', /* progress/devicewords.js; the input action's id is yours: I have not checked it */ onIsland: () => this.goIsland(), onClose: () => this.hide(), onFloor: (id) => this.goArea(id) });
this.win.onResize = () => this.drawMap(true);
// show():
this.win.open(); this.level = 'area'; this.areaId = this.areaOf(P.pos); this.win.area(this.pageWords(this.areaId)); this.bindCanvas(this.win.canvas); this.drawMap(true);
// hide():
this.win.close(); // (the canvas, the sketch's cache and the paper are let go; the window leaves the DOM)
// drawMap(force): keep your change key, then
const { w, h } = this.win.box(), dpr = Math.min(2, devicePixelRatio || 1), c = this.win.canvas;
if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
if (this.level === 'island') this.hits = islandLook(c.getContext('2d'), this.islandGraph(), { w, h, dpr }).hits;
else areaPage(c.getContext('2d'), this.areaData(this.areaId), { x: V.x, z: V.z, scale: V.scale, w, h, dpr });
// a tap on the island (your pointerup, moved < 5): const hit = islandHit(this.hits, x - rect.left, y - rect.top); if (hit?.visited) this.goArea(hit.id);
// a zoom out past the area's bounds: this.goIsland();  goIsland(): this.level = 'island'; this.win.island({ title: 'Anagami Island', sub }); this.drawMap(true);
// mark(): a click or long press on charted ground calls this.game.sight.calibrate({ point }) (Dovina's) in place of this.waypoint
```

## The data you assemble

**`islandGraph()`**: one node per area:
`{ id, name, parent?, neighbours, visited, here, n, m, silhouette?, arc?, note? }`.
- **The Dunes.** One node `{ id: 'dunes', name: 'The Dunes' }`, and its five children with `parent: 'dunes'`, from Dovina's
  `DUNES_AREAS` (`progress/areas.js`, on claude/dovina-design until it reaches main):
  - `name` and `meets` become `neighbours`;
  - `bearing` becomes `arc`, in the canvas's frame (0 east, 90 down: the Dunes' own frame, as `areaAt` takes it);
  - the Weir has no `arc` and meets all four, so it is drawn as the hub.
- **Every other layer** is one node until it is split.
- **`neighbours`.** A string is a way you walk (a solid line). `{ id, via: 'index' }` is the Index's spoke (dotted). `label` names it
  ("the hole", "the mouth", "the gate", "the jetty").
- **`visited`.** True once you have been in that area (`area.enter`, or your `time.area.<layer>` ledger keys until then).
- **`here`.** The area you stand in.
- **`n` and `m`.** The area's checklist rows, summed.
- **`note`.** Replaces the count on a node with no checklist, such as the Great Dunemaw's `'FLOOR 2'`.
- **`silhouette`.** A key of `SILHOUETTES` (`ui/mapdress/ink.js`: weir, shore, ridges, gnomon, ruins, well, workshop, basement, raceway,
  bazaar, dock, sea, garden), or an SVG path of its own in a 24 x 24 box.
- **Anything else needs no art change.** A sixth area or a new island takes its place in the ring or among the tiles by itself.

**`areaData(id)`**, an area's page:
- `area`: the area's id.
- `bounds: { x0, z0, x1, z1 }`: the area's world box, in metres.
- `cell`: the layer's cell size (2 indoors, 8 on the Dunes).
- `cells: [{ ix, iz, tier, wall }]`: the layer's cells inside `bounds` with tier > 0 or a wall. Use `Cartography.tierOfK(c.k)` and `!!c.w`.
- `rev`: your `this.rev`. The sketch is rebuilt only when it changes.
- `outline: [[x, z], ..]`: the area's shape, dotted. For a Dunes sector, its inner and outer arcs from `DUNES_AREAS`; leave it out
  elsewhere.
- `places: [{ x, z, name, charted }]`: your anchors in the area, with `charted: a.done`. A name is drawn only when charted.
- `plates: [{ x, z, yaw, stars }]`: the Veritome's `book.pins` in the area.
- `thread: { pts: [{ x, z }], dashed }`: from the Shrine rested at through `this.thread` to you. Set `dashed` when the thread is empty
  (after a reload). Leave it out when the knack is off.
- `you: { x, z, yaw }`: give `yaw` as your `headYaw ?? P.yaw`. It is drawn as `rotate(PI - yaw)`, as now.
- `waypoint: { x, z } | null`: the Sight's, `game.sight.waypoint?.pos`, when it is in this area.
- `edges: [{ x, z, dir, name, visited, down? }]`: a point on the outline, and `dir` the angle out of the area in radians. The name is
  shown only when `visited`, else "???". `down: true` is the Great Dunemaw's mouth.
- `tracks: [{ name, pts: [{ x, z, w }] }]`: your `trackPts`, on the Raceway only.
- `godhand: { x, z, r } | null`: the Pneuka Jar and `T.explored.baseRadius` while the god hand is on. It also shows the tiers' key.
- `key: true`: on the map's first opening, for the tiers' key.

**`pageWords(id)`**, which is `win.area`'s argument: `{ title, path, floors, rows, line, game }`.
- `path`: `['THE ISLAND', 'THE DUNES', 'THE GNOMON FLATS']`.
- `floors: [{ id, label, here }]`: inside a building only (F2, F1, B1). Leave it out elsewhere.
- `rows`: Dovina's `AREA_PAGE[id].rows`, in order, mapped to `{ kind, label: CHECKLIST_ROWS[kind].label, n, m }`.
  - Leave out a kind the area holds none of (m = 0).
  - A 0 of M row stays, drawn as blank slots.
  - `rows: null` before you first enter the area, which draws "???".
  - The rooms row also takes `rooms: [{ id, name, charted, place }]`, your anchors. `place` is set when `game.places.get(tag)` exists,
    so TRACK appears beside it.
- `line`: `AREA_PAGE[id].line`.
- `game`: for TRACK.

## What it costs

- **2D canvas and DOM only.** 0 shader programs, 0 textures, 0 draw calls in the world.
- **Resident only while open.** One canvas the size of the sketch's box, plus the sketch's cache (its long side at most 1024 px, about
  4 MB at most) and a 192 px paper tile.
- **Closed, nothing is kept.** `close()` sizes the canvas to 0, lets the cache go and removes the window.
- **A redraw**, once the cache is built, is one `drawImage` and about 60 canvas calls.
- **Not profiled.** I have not run `npm run perf` on this. It is not wired in.

## What I could not verify

- **Real cells.** The Gnomon flats' page in the sheet is drawn from made-up cells. I did not play a save to get real ones.
- **Touch.** No touch input was tested. The canvas's input is yours.
- **iOS.** Nothing was checked on iOS Safari. On older WebKit, `CanvasPattern.setTransform` and `Path2D` are what to watch. The paper's
  pan falls back to a still paper if `setTransform` is missing.
