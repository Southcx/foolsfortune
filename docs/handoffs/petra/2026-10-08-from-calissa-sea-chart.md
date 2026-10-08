**2026-10-08, from Calissa (Art): the sea chart's look and the rutter's model, for your pier window and the item (branch art-sea-chart)**

The pier's page is DOM (feedback/indexmenu.js), so the sea chart is 2D: pixel art at 1x on the maker's ramp, scaled by a whole number
(1x at 480 lines, 2x at 1080: 672 x 400 CSS px, inside the Index's 720 window). Staged now: workbench, MODELS, "the crossing",
`crossing:chart`.

**The pier (your `world/emocean/pier.js`, when the passage's page is built):**
```js
import { SeaChartCanvas } from '../../ui/seachart/seachart.js'; // (not `SeaChart`: that is your window's class, world/emocean/seachart.js, and one module cannot declare and import a name)
this.sc ||= new SeaChartCanvas({ onPick: (id) => this.draft(id), onHover: (id) => {} }); // id: a waypoint, 'from' or 'to'
box.appendChild(this.sc.canvas);                                                       // (the same element each render: it keeps its state)
this.sc.set(chart, {
  portents,   // { id: portent(chart, w, depth, sight(reckoning, widen, lead), level) }; depth = w.col - atCol (atCol -1 at the pier); sailed: leave out (drawn exact)
  drafted,    // the passage so far, waypoint ids in column order (each new lane brightens as it is added)
  at,         // the waypoint the ship is at, or null at the pier
  trumpOf: (a, b) => draughtTrump(chart.waypoints[a].feel, chart.waypoints[b].feel),
  ghost,      // the day's best passage (voyage.bestOf's run), or null
  drift,      // [[a, b], ...] lanes the ship was carried along adrift, or null
  classOf,    // passage.js classOf (else the icons' own table, kept in step)
});
```
It redraws itself at 30 a second while its canvas is in the page and stops when the page closes (0.8 ms a redraw, measured). Nothing in
it emits an event or writes text: the words on the page stay yours (and Espada's).

**The rutter (your `pneuka/thingmodels.js` and `pneuka/icons.js`):** `import { rutterThing } from '../vfx/rutter.js';` and in `buildThing`:
`if (id === 'rutter') return rutterThing();`. **And in `pneuka/icons.js` `modelOf`**: the line that sends an item to `buildThing` lists the kinds
`['instrument', 'heart', 'key', 'material', 'shell']` (and `ostracon.` ids); a rutter's kind is `'rutter'`, so add it there, or the slot never asks
`buildThing` and shows the glyph. The icon cache is keyed by id, so the Pneuka Box shows one tooling for every rutter; a rutter's own route on its
board needs `rutterThing(item.data)` and an icon keyed by its route (your call).
**What the model reads of the item's data** (`voyage.js` keeps `{ from, to, route, day, passage, legs, rank, read, minutes, worth }`): `from`, `to`,
`day`, `passage` (ids), `legs`, `rank`, `read`. It also reads three it does not have yet, `strengths` (each waypoint sailed's, in order), `feels` (the aspect or null of each)
and `stormsAt` (the ids of the squalls sailed): without them the page draws no strength pips (it draws none it was not told), the board no squall's star and the page no washes of feeling. You hold the chart when
the rutter is made (`P`), so add them there. To read one: `rutterSpread(rutter, { chart, portents })` is the 1024 x 704 spread as a canvas, or
`new Rutter({ rutter, chart }).open(1)` in 3D. **`chart` cannot be laid again from `route` and `day` alone**: `seaChart()` also takes the route's danger and
distance, the casks aboard (they change the Wreckers' share of the pool) and the Leviathan and bounty flags, and the item keeps none of them, so a re-laid sea
may not be the sea that was sailed. Either keep the sailed waypoints' types, strengths and feelings in the item (then leave `chart` out: the model pieces
the sea together from the passage, the sailed waypoints exact and nothing else on the page), or keep the chart's parameters.
The first rutter in the Box compiles its icon's programs at that moment (4, below); `itemIcon` renders on first need, as the curios' do.
`node scripts/seachartlooktest.mjs` (dev server up) checks the look over your real sea charts and portents: every tier, scale and look draws, a portent's hidden
type, strength and feeling move no pixel, the canvases kept stay flat, the picks, the rutter built and let go.

Programs: none at boot (the modules load only in the workbench's stage chunk until you import them). The stage compiles 6 while shown (the workbench only; measured on the
merged base: 170 to 176); the rutter's icon render compiles 4 (map + roughness and metalness maps on the board; disposed after).

Delete this note when done.
