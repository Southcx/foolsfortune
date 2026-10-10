**2026-10-09, from Calissa (Art): the Figment attack telegraphs' marks are built; the wiring is yours (FIGMENT-TELEGRAPHS.md section 8
item 3; branch art-v135-telegraphs)** (delete in your branch when done)

`game.figmentTelegraphs` (`vfx/figmenttelegraph.js`, `FigmentTelegraphs`; its parts in `vfx/figmenttelegraph/`) is made in `main.js`,
updated every frame on the sim step (`game.figmentTelegraphs.update(dt, camera)`, the step `creatures.update` runs on) and warmed at boot
(one program: the warm-up's old stain left to make room, casebook rule 166). It draws exactly what `figmentMarkOf` / `castMark` hand it,
so a mark never says more than the Divination level has earned. Nothing in `creatures/` or `world/` calls it yet. What to call:

1. **`creatures.windup`** (`creatures/creatures.js` 144): when the windup carries an `area`, show its Figment attack telegraph:
   ```js
   const mark = figmentMarkOf({ area, eta, type, status, answer }, this.game.psyche?.level?.('divination') ?? 1, !!this.game.lend?.has('figmentTelegraphs'));
   c.windup.figmentTelegraph = this.game.figmentTelegraphs?.show(`windup:${c.id ?? c.uuid}`, mark, { origin: c.pos,
     facing: <c's facing as a bearing or { x, z }>, eta: this.shownEta(eta), points: area.at === 'courier' ? [this.game.player.pos.clone()] : null,
     body: <c's radius, m>, alive: () => c.alive && !!c.windup });
   ```
   every frame beside `w.mark?.eta(...)` (line 187): `w.figmentTelegraph?.eta(this.shownEta(Math.max(0, w.t - 0.3)))`; in `unwind`:
   `w.figmentTelegraph?.hide()`. (`origin` is read every frame: pass the live `c.pos` or the creature's root, and the mark follows it.)
2. **The timeline runner** (`world/well/raid.js` `onCast` / `onBlow`, or `creatures/ai/timeline.js`): on a cast,
   ```js
   const B = this.B, P = this.P, at = this.F.c.pos;
   this.figmentTelegraph = this.g.figmentTelegraphs?.show(id, castMark(id, level, lent), { origin: at, facing: { x: P.pos.x - at.x, z: P.pos.z - at.z },
     eta: shownEta(d.windup), points: [P.pos.clone()], target: P.pos.clone(), body: <the FOE's radius>, on: this.F.c.root, height: <its height>,
     rim: { centre: B.world(0, 0, 0), radius: ARENA.rim.from, band: 3 }, centre: B.world(0, 0, 0), radius: ARENA.rim.from,
     pockets: <the islands: fallen pillars and rubble as [{ x, z, r }] world>, bait: <the pillar(s) a ram would meet, [{ x, y, z }]>,
     adds: <the brood or the sherds: their roots>, left: <seconds until they must be down>, alive: () => !this.down() && this.T.casting?.id === id });
   ```
   each frame `this.figmentTelegraph?.eta(<the cast's remaining windup>)`; on the blow `this.figmentTelegraph?.hide()`, except Throwing
   Rings (`out-in`): on its first blow call `this.figmentTelegraph.next(<the second half's windup>)` and it turns into the band with the
   "in" chevrons, hidden on the second. Baited drops that follow the Courier: `.set({ points: [...] })` as they move; a tracked shape:
   `.set({ locked: true })` when it locks (dashed until then: the caution edge). Puddles left behind (`left`): `show(..., { points, hold:
   true })` and `hide` when they dry.
3. **The ground a mark lies on**: `game.figmentTelegraphs.ground = (x, z, y) => raid.ground(x, z)` while the bowl stands (null when it
   goes); in the Dunes `(x, z) => game.dunes.heightAt(x, z)`. Unset, it casts a physics ray down once a world cell (static colliders only).
4. **Friendly areas** (a sibling's, a spirit's): `show(id, mark, { ..., friendly: true })`: the outline alone, in `game.draughtHex`.
5. The lend panel's row is `game.lend?.has('figmentTelegraphs')` (the third argument of `figmentMarkOf` / `castMark`).

Six at most at once (a seventh takes the oldest's place); never culled by a zone, by distance or by the effect budget. The workbench's
**Figment attack telegraphs** group shows every shape at every step: `combat:figmentTelegraphs`, `.more`, `.variants` (the area's numbers
in magenta under each mark), `.glyphs`, `.bowl` (the Great Slip Jelly's casts at their size on a 140 m dish).

The rail's telegraph mark (`vfx/telegraph.js`, `TelegraphMarks`, `shots.telegraphs`) is untouched: this branch's first commit renamed it
and the merge of the owner's naming ruling put it back.
