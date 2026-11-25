# Brief 03: the god hand and the Pneuka Jar

A physics god game played over the same rooms (Black & White, From Dust, Populous). Press ~ (Backquote): the Courier folds into their
**Pneuka Jar** (immobile, hurtable) and the player becomes a disembodied **hand**; the camera pulls up into a turnable isometric view and
the cursor is the hand. ~ again (once the Jar is whole) puts the Courier back where the Jar stood. The same hand and Jar are reused in the
Spirit Garden (brief 04).

Source: `src/godhand/godhand.js` (671: modes, camera, cursor, grab, tether), `jar.js` (the Jar: hp, cracks, shatter, reforge),
`jarcracks.js` (the Jar's cracks through the vessel rule), `catch.js` (the hand catches a thrown body), `arts.js` (597: the God Arts and the
domain selector), `powers.js` + `powers/*.js` (the god powers, one file a theme: space, will ...), `matterarts.js` (scoop, pour, shape, carve on the matter),
`matter.js` (372: the island's matter, a height-field simulation, pure), `islandmatter.js` (its mesh and collider), `voxels.js` +
`creations.js` (sculpted creations as voxels), `miracles.js` (weather drawn as a sign), `rejection.js` (the island's immune response),
`mudras.js`, `godhandclips.js`, `pneukajarclips.js` (the hand's and Jar's clips). Boot: `src/boot/godhand.js`.
Rules and numbers: `progress/godpowers.js` → `PORT/data/progress/godpowers.json` (`GOD_POWERS`, `RAMP`, `MIRACLES`, `EPICS`),
`progress/rejection.js` → `rejection.json`. Tuning `DEFAULTS.god` in `core/config.json`. Plan: `docs/plans/GODHAND.md`.

## 1. Modes and the camera

- `god.state`: `out` → `in` (the transition) → `on` → back. `controlling` is `in` or `on`. While controlling, the frame runs the god hand's
  update **instead of** the Courier's (brief 01 is not stepped; the Jar stands where the Courier was).
- **Camera**: isometric-ish, `pitchDeg` 36, `fov` 24 (long lens), distance 17 (zoom by wheel 8..46). Q / E turn it a smooth eighth of a
  turn. WASD or the screen edges (16 px) pan. Everything above `clipAbove` 3.9 m over the hand's floor is cut away (ceilings) by a
  clip plane. The focus is held within `range` 36 m of the Jar (**the tether**, drawn as a string of glowing beads).
- **Cursor**: a ray from the mouse onto the world; the hand hovers `hoverH` 1.7 m above what it points at and is posed by its own clips
  (`godhandclips.js`: open, point, grab, pinch, slam ...) and by mudras (`mudras.js`: ten sacred hand poses, a look only).
- Godot: a `Camera3D` (orthographic or a 24° perspective) on a pivot; `PhysicsRayQueryParameters3D` for the cursor; the ceiling cut
  as a world-space clip in the shared shader include (or hiding nodes tagged above the cut).

## 2. The Pneuka Jar (`jar.js`)

- `jarHp` 100. Hurt by raiders (clapperjars in waves, kamikaze: `raidDamage` 20), lobbed balls (14), blasts (22), whatever the hand throws
  at it (4). Each blow cracks it from the side it came from (cracks raycast over its body, skinned to it so they ride its clips).
- At 0 it **shatters**; after `reforge` 7 s it reforges, its old cracks now gold seams (kintsugi: the scars are the record). Mended cracks
  turn gold. Its core glows with how whole it is.
- Its cracks are a vessel state of the `jar` form (lip, shoulder, belly, foot) through the shared vessel rule
  (`progress/combat/vessel.js`, `blowOn`); the Courier's pool is its shield (one soul, one pool): a blow the pool can hold drains it.
- Clapperjars you **hatch** (turn) guard the Jar and mend it (`regenEvery` 9 s, up to `regenMax` 6).
- Model `src/assets/pneuka.glb` (source `source_assets/Courier/courier_pneuka.blend`, painting `courier_pneukajar_base.png`); its own clips
  (`pneukajarclips.js`: idle, hop, squash, gulp ...) own its squash and scale. The look is the owner's painting (`vfx/vessoulpaint.js`).

## 3. The hand's verbs

Keys 1 to 7 choose a **domain**, again to cycle its arts; LMB uses the selected art; RMB held opens the art wheel; MMB held draws a
miracle's sign. Every art costs Lachryma from the pool and works only **inside the explored area** (the ground you have explored:
`feedback/cartography.js`). Each act emits `god.<id> { by, act }`.

| domain | powers (`GOD_POWERS`) |
| --- | --- |
| Psychokinesis | telekinesis (hold LMB: lift anything loose and throw; cost by weight while held), scoop, gust, slab, the catch |
| Alteration | sunder (drag a blade across the ground: everything above is cut along that plane), swell (grow/shrink a pot), wring (twist, scallop), shape, carve, transmute |
| Manifestation | manifest (raise a clay wall from the floor; crumbles later), sculpt (voxel creations), setfast (Set: a creation kept), totem |
| Ouranurgy | portal (two linked eyes), fold, hasten |
| Divination | strata, course, read (seeing: not acts on the island) |
| Possession | herd, take, muster (clapperjars hatched from the ground carry matter) |
| Spellscription | miracle, ward (a written circle that sets creatures back), stamp |

- **Grab and throw** (telekinesis, `beginGrab` / `releaseGrab`): a body held is spring-pulled to the hand at `grabSpeed` 14; the throw is
  the hand's velocity × `throwBoost` 1.15, capped at `throwMax` 30 m/s. A thrown thing striking a creature is an Impact blow by its
  energy (`world/impacts.js`: the thrown hit; three at once is a strike). Clapperjar raiders can be grabbed and thrown, cut, pinned
  (ANCHOR, 18 s), made to dance (GROOVE, 12 s) or turned (HATCH, 7 allies at most).
- **The ramp** (`RAMP`, `RAMP_CURVE`): each power's numbers by its domain's level, 1 to 99 (Creative mode at the top).
- The power runner (`powers.js`): `handler = { begin(P, L) -> bool, hold?(P, L, dt), end?(P, L), passive?(P, dt) }` with `L = { id, a, b,
  t, shift }` (press point, current point, time held) and helpers `P.ramp(id, key)`, `P.keep({ tick, dispose })` (what lasts: a portal,
  a ward, a totem), `P.ring`, `P.line`, `P.emit`, `P.near`, `P.creatureAt`, `P.place`, `P.walk`. Port this contract as an interface.

## 4. The island's matter (`matter.js`: pure arithmetic, port it straight)

A layered height field laid over the authored island round the Jar: `n` 144 × 144 cells of 0.5 m (72 m square), centred on where it
was laid. Each cell keeps:
- `base`: the authored ground (sampled once by raycasting the level, never moved); `void` where there is none.
- `firm` and `loose`: the two ground layers the hand has put there (on Anagami: clay and sand; `GROUND` per island).
- `w`: Lachryma standing on it, with `mix`: the shares of the seven feelings it carries.
- `ice`, `hot` (lava), `kept`, `bias`, `still`.

The step:
- **Water** by virtual pipes (Mei, Decaudin and Hu 2007): each cell's four outflow fluxes grow by `g` 9.8 × height difference, damped
  0.992, limited by the cell's own water; depth updated from net flux; feelings advected with it; a film and slow drying.
- **Slump** (thermal erosion) every 0.1 s past the angle of repose: loose 34° (talus 0.67), firm 50° (1.19), rate 0.35.
- **Erosion**: running water wears loose at `erodeK` 0.004 m/s per m/s of current and lays it down where it slows.
- **The mending**: everything relaxes back toward the authored shape with τ = 1200 real s (an island keeps its self-image), every 0.5 s.
- **Lava** cools to firm at 0.06 m/s.
- Ops: `pour(x, z, r, vol, { kind: water|firm|loose, feeling })`, `take(x, z, r, vol) -> { firm, loose, water, feeling }`,
  `raise(x, z, r, dh) -> { moved, made }`, `smooth`, `carve(ax, az, bx, bz, w, depth)`. **Matter is moved, never made**: every op
  reports what had to come from nothing (`made`), and the caller charges Lachryma for that.
- `islandmatter.js` meshes it (one grid mesh, its changed rows rewritten) and collides it (a Rapier heightfield, rebuilt where changed).
  Godot: a `HeightMapShape3D` and an `ArrayMesh` (or a vertex shader reading a height texture). Its look: `vfx/godhand/matterlook.js`
  (clay mottled and specked, sand grained, a lip where it thins onto authored ground, Lachryma as the house liquid).

## 5. Creations (`voxels.js`, `creations.js`)

Sculpt raises voxel matter of the firm layer: a sparse grid of 16³ chunks of 0.25 m voxels, each a density 0..1 (surface at 0.5),
stamped from a signed distance with a wide ramp so the mending takes it back from the outside in evenly (thin parts go first), meshed by
**surface nets** (one vertex a cell at the mean of its edge crossings: hand-pressed clay, never cubes). Each chunk is one mesh and one
trimesh collider, remeshed only when touched, a few a frame inside a time budget. Over about a game day the mending erodes it and pours
the lost volume back into the matter's firm layer: nothing made or lost. **Set** fires it (kept). Godot: same algorithm in C#; an
`ArrayMesh` and `ConcavePolygonShape3D` per chunk.

## 6. Miracles (`miracles.js`)

Hold MMB and draw a feeling's **sign** over the ground (read by the Soul Brush's gesture reader, `tools/soulbrush/gesture.js`); let go and
the feeling's weather falls there, as wide as the sign was drawn large (a fifth to three fifths of the view's height). Needs the feeling
awakened; paid in Lachryma. Each does something to the creatures under it **and** to the matter, so two make a third (Rain then Storm
strikes the whole flood; Rain then Aurora freezes a lake to walk on). Shift held: the domain's **epic** miracle (`EPICS`: Stopped Hour,
Volcano, Prophecy, Maelstrom, Stampede, Earthquake ...), paid as a release from the vessel, one a game hour. Events `god.miracle
{ feeling, size, score }`, `god.epic { epic, domain }`.

## 7. Rejection: the island pushes back (`rejection.js`, data `REJECTION`)

GTA's wanted level with Left 4 Dead's director. The hand's acts raise **dissonance** (`rise`: per metre moved 0.5, made 1, miracle 8, epic
60, throw 2, any act 3); it ebbs 2/s after 12 s of quiet. **Dissonance Levels** at 25, 60, 110, 170, 240 (0..5). Every 20 s the level's
**answer** spawns past the edge of the hand's view, coming for the Jar: level 1 two slip jellies; 2 three and a Lantern Wisp; 3 two jellies
of class 1 and two Wisps; 4 adds a **sentinel** (the island's antibody: it walks to the warp marks, the 12 newest places the hand worked, and
wears creations back into the matter); 5 a big jelly boss and three Wisps. Beating level 5's answer, or a rest at a Shrine, clears it.
Event `god.dissonance { level }`.

## 8. Raids (`world/basement/raids.js`)

In the siege room only: clapperjars come in waves (`firstWave` 22 s, then every 34 s; `waveBase` 2 growing by 1) for the Jar.

## 9. Port notes

- Physics props (pots, crates, bricks) are Rapier dynamic bodies registered with tags (`liftable`, `sliceable`, `breakable`). In Godot:
  `RigidBody3D` with groups. Sunder cuts a mesh along a plane (`world/props/` slicer; port with a mesh-plane cut, e.g. a C# port of
  three-bvh-csg's plane split, or Godot's `CSGMesh3D` subtraction baked).
- The hand's model `src/assets/godhand.glb` (source `source_assets/Courier/courier_godhand.blend`, regions `courier_godhand_regions.png`).
- The art selector's look: `ui/godartselector.js` (seven glazed domain tiles on a kiln shelf); HUD readout of the Jar: `ui/jarplate.js`.
- Events: group `god` in EVENTS.md (`god.scoop`, `god.pour`, `god.shape`, `god.carve`, `god.sculpt`, `god.throw`, `god.miracle`,
  `god.epic`, `god.dissonance`, `god.<power>`), `jar.hit`, `jar.shatter`, `jar.reforge`.
- Check: enter the god hand in the siege room (Index → the siege), survive three waves; pour water on a slope and watch it run and pool;
  scoop sand and watch it slump to 34°; sculpt a pillar and leave it: it crumbles back over the mending.
