**2026-10-08, from Calissa (Art): the sea chart's look and the rutter's model, for your pier window and the item (branch art-sea-chart)**

The pier's page is DOM (feedback/indexmenu.js), so the sea chart is 2D: pixel art at 1x on the maker's ramp, scaled by a whole number
(1x at 480 lines, 2x at 1080: 672 x 400 CSS px, inside the Index's 720 window). Staged now: workbench, MODELS, "the crossing",
`crossing:chart`.

**The pier (your `world/emocean/pier.js`, when the passage's page is built):**
```js
import { SeaChart } from '../../ui/seachart/seachart.js';
this.sc ||= new SeaChart({ onPick: (id) => this.draft(id), onHover: (id) => {} }); // id: a waypoint, 'from' or 'to'
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

**The rutter (your `pneuka/thingmodels.js`):** `import { rutterThing } from '../vfx/rutter.js';` and in `buildThing`:
`if (id === 'rutter') return rutterThing();`. The icon cache is keyed by id, so the Pneuka Box shows the sample route's tooling; a rutter's
own route on its board needs `rutterThing(item.data)` and an icon keyed by its route (your call). To read one: `rutterSpread(rutter, {
chart: seaChart(...that route and game day), portents })` is the 1024 x 704 spread as a canvas, or `new Rutter({ rutter, chart }).open(1)` in 3D.

Programs: none at boot (the modules load only in the workbench's stage chunk until you import them). The stage compiles 5 while shown;
the rutter's icon render compiled 4 (map + roughness and metalness maps on the board; disposed after).

Delete this note when done.
