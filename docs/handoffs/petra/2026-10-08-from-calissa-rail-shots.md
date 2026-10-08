# The shots' look, the Itano ribbons, the hurtbox, the telegraph mark (from Calissa, 2026-10-08)

For your shot runtime and the lances' navigation (RAIL-OVERHAUL.md sections 5, 6, 8). The looks draw what they are given each frame;
nothing in them moves a shot or decides a hit. All three share one shader program (`vfx/railmark.js`, `rail-mark`): +1 program in
all, compiled at the warm-up through `emocean.parked()` (it lists `shots.parked()`). Positions are in the meshes' parent's frame: the
scene's, so the world.

## `vfx/railshots.js`: every shot, one instanced draw (cap 400 foes and 128 of the psygun's, plus the hurtbox)
```js
const S = new RailShots({ cap: 400, guns: 128 }); S.build(scene);   // or parent.add(S.mesh); S.parked() -> [mesh]
// each frame:
S.set(i, pos, vel, kind, outlined, radius = 0.36, alpha = 1);      // i < n; pos: the hit sphere's centre (world); vel: m/s in the
                                                                    // frame the eye rides (the rail's), world axes; kind 'astral' |
                                                                    // 'umbral' (or 0 | 1); alpha 0.45 for a spent shot
S.count = n;
S.gun(i, pos, vel); S.guns = m;                                     // the psygun's needles (the ship's colour: S.color(hex))
S.hurtbox(pos, T.ship.hurt);                                        // or S.hurtbox(null); drawn its true size, on top
S.update(rawDt, camera);                                            // sorts the foes' far to near, writes, sends
S.show(on);
```
The capsule's head is `pos` (drawn at `radius`, a touch over the 0.3 m hit sphere), its tail behind it along `vel` (0.06 s of flight,
at most 3 m). Today `courier/ship/shots.js` maps a plain shot of the ship's home feeling to astral and any other to umbral (null
feeling, the broadside's round shot: umbral); an outlined shot takes its thrower's. Replace that with your kinds.

## `vfx/itano.js`: the lances' ribbons (up to 40 at once)
```js
const R = new ItanoRibbons({ max: 40, life: 0.6, width: 0.08, color: 0x9ff3ff }); scene.add(R.mesh);
R.start(id, pos, { color });   // a lance launched (id: any key, the lance's record)
R.push(id, pos);               // every frame it flies
R.end(id);                     // it struck or ran out: its ribbon runs out behind it
R.update(rawDt);               // once a frame, after the pushes
```
The fan, the overshoot and the proportional navigation are yours: the ribbon follows whatever position it is pushed.

## `vfx/telegraph.js`: the shrinking mark on a part about to act
```js
const T = new TelegraphMarks(); scene.add(T.mesh);   // today: emocean.shots.telegraphs
const h = T.mark(target, seconds, { radius, from }); // target: an Object3D, a Vector3, or (out) => out (world); h.cancel()
T.update(rawDt);
```
A boss's part: `T.mark(partObject, windupSeconds, { radius: partRadius })` when its windup starts; it closes linearly on the part's own
ring and is gone at the act. Wired today on the brig's gunports (`world/emocean/pirates.js` onBar: the bar each port's lid opens).

## Crossings into your files (call sites only)
- `src/courier/ship/shots.js`: build/show/draw delegate to the looks (the old instanced meshes and the 24 parry-marked spheres are
  gone; `r.mesh` stays as a plain Object3D handle because `courier/ship/mounts.js` reads `s.mesh`); `lance()` starts a ribbon,
  `endLance()` ends it, `update()` keeps `this.ship` for the hurtbox and the kinds; `parked()` added.
- `src/world/emocean/stage.js`: `parked()` lists `this.shots.parked()`.
- `src/world/emocean/pirates.js`: one line in `onBar`, the telegraph mark on each port that will fire.

## For the storm's warp
The meshes carry `userData.unbent = true`: the warp (Calissa's other builder) must skip them; the danger stays true.

Delete this note when the runtime calls these directly.
