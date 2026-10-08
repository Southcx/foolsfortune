# Research: bullet patterns, homing swarms, boids, the storm's warp (2026-10-08)

Gathered for the crossing's overhaul (`docs/plans/RAIL-OVERHAUL.md`) by a research agent for Dovina. Cited where read; **[own]** is
standard maths or the researcher's derivation; **[unverified]** where only a search snippet was seen. Pattern names are proposals.

## 1. What makes a good pattern

**Aimed, static, random** (Boghog's *Bullet hell shmup design 101*, https://shmups.wiki/library/Boghog's_bullet_hell_shmup_101):
aimed patterns press and can be manipulated; static ones shape and restrict; random ones refresh but can be unfair. The best mix: static
elongated bullets that restrict plus aimed thick chunks that force movement. Dense streams make the ship feel powerful; dense patterns
read as lanes, each a micro-challenge. No patterns that block large chunks of the screen; no lone stray bullets; no enemies parked at
the borders (traps). Vary intensity: constant intensity blurs and tires; set pieces are landmarks. Bullet sealing (weak foes stop
firing point blank). After a death, cancel the bullets and grant a few seconds' mercy. Every foe shoots at least once; keep HP low.

**Readability** (same): value contrast (bright core, dark rim); midtone low-contrast backgrounds so bullets own the extremes; reds,
pinks, purples read against explosions and gold; odd trajectories get trails or elongation; animate bullets (wobble, ripple); sprite
length matches speed; smaller faster bullets drawn over larger slower ones; a tiny, centred, consistent hitbox.

**Sparen's Danmaku Design Studio** (https://sparen.github.io/ph3tutorials/ddsga1.html .. ddsga4.html):
- Density is spawn rate and speed together; spacing about speed / rate.
- Directional (heading-rotated) bullets make trajectories legible; round ones hide heading.
- A fixed seed repeated leaves blind spots; a random or drifting seed covers the field. Bullet count is not difficulty: players filter
  bullets moving away.
- Rings: step 360/n, at least 3; seed fixed, random, drifting (delta that does not divide 360/n) or aimed.
- N-way: odd n puts a bullet on the aim line (threatens), even n leaves it free (constrains). Narrow arcs make walls (macro- vs
  micro-dodging). Stacks: speed_i = vmin + i (vmax - vmin)/(n - 1), opening gaps far out.
- Speed: fast bullets make the player watch wide; slow ones allow micro-dodging. Streaming (tap one way to dodge thousands) trades
  spatial density for an easy technique.
- Compose from independent subpatterns.

**Touhou and Cave:** alternate light phases (make you move, give a break) and heavy, claustrophobic ones; random-looking patterns are
scripted (Danmaku Unlimited 3's maker, https://www.forgottenworlds.net/bullet-hell-danmaku). Cave: "the joy of dodging bullets",
bullets slower than you expect, a rhythmic high-speed dodge [snippets of shmuplations]. Bullet hitboxes smaller than sprites; hitbox
dissonance is a readability fault. Ikaruga: polarity makes patterns colour puzzles (https://en.wikipedia.org/wiki/Ikaruga).

**Lock-on shooters:** Panzer Dragoon's lock-on laser was added because manual hits were too hard; hold, sweep, release; the lock count
by form (https://www.gamedeveloper.com/game-platforms/the-history-of-panzer-dragoon). Rez: lock 1 to 8, every lock a musical note.

## 2. Emitters

**BulletML** (Kenta Cho, https://allstar.jhuapl.edu/repo/p2/amd64/libbulletml-dev/doc/doc/bulletml_ref.html): bullet, action, fire,
repeat, wait (frames), changeDirection, changeSpeed, accel, vanish, refs with $1/$rand. Direction types aim, absolute, relative,
**sequence** (a running accumulator: the whole spiral and n-way mechanism). **Danmokou** (https://github.com/Bagoum/danmokou/blob/master/docs/articles/t06.md):
movement as functions (polar(2t, 80t), sine(period, amp, t)), composed as data. For us: each emitter is data plus a few verbs, driven
by a timeline (CLAUDE.md: a scripted fight is a timeline).

```
ring(n, r, seed):     a_i = seed + 360 i/n ; spawn at pos + r(cos a, sin a), dir a
nway(n, arc, aim, v): a_i = aim - arc/2 + arc i/(n-1)
stack(n, vmin, vmax): v_i = vmin + i (vmax - vmin)/(n-1)
spiral arm k of m:    a(t) = a0 + w t + 360 k/m, fire every dt         [own]
reversing spiral:     w(t) = w0 sign(sin 2 pi t/T)                      [own]
accelerating spiral:  w(t) = min(wmax, w0 + alpha t)                    [own]
rose (flower):        r = a cos(k th); k odd: k petals, k even: 2k; k = n/d: n if both odd, else 2n (https://en.wikipedia.org/wiki/Rose_(mathematics))
accelerate:           v(t) = min(vmax, v0 + a t)
decelerate, burst:    v -> 0 over T, then ring(m), vanish (BulletML's example)
change direction:     dir(t) = lerp(dir0, dir1, t/term)
wave:                 pos = base(t) + perp(dir) A sin(2 pi f t + phase)  [own]
split:                at T: m children at parentDir + spread_i, parent vanishes
```
A spiral reads as arms while the step w dt stays under ~15 degrees, as a sprinkle above ~40 [own, tune by eye]. Pick seed deltas whose
gcd with 360/n is small (7 or 11 degrees, not 15, for n = 24).

**Lasers:** straight (a warning line, then hot: a capsule hitbox); sweeping (a(t) = a0 + w t; keep the tangential speed w R at the
ship's range under the ship's speed, or leave an escape side); curved "snake" lasers are a ribbon over a ring buffer of a head bullet's
positions (Sparen A1); Hermite splines for lock-on lasers [snippet].

**Composition:** repetition with variation (seed delta, speed step, count +1); escalate by adding a subpattern, not by raising every
number; alternate light and heavy.

## 3. Homing and the Itano circus

**Proportional navigation** (https://en.wikipedia.org/wiki/Proportional_navigation): a = N Vc (LOS rate), N 3 to 5; needs no range.
```
R = t - m ; V = vt - vm ; Omega = (R x V)/(R.R) ; Vc = -(R.V)/|R|
a_cmd = N Vc (Omega x unit(vm))
turn by min(|a_cmd|/|vm| dt, maxTurn dt) about axis(a_cmd); keep |vm|
if |R| < rMin: pure pursuit (LOS rate blows up near the target)
```
Cheaper: `dir = rotateToward(dir, unit(t - m), maxTurn dt)`, after a launch phase with a big offset so it arcs out first.

**The Itano circus** (Ichiro Itano; Macross 1982, Ideon 1980): a barrage of erratic missiles, each with its own smoke tail. Recipe
[own]: launch fanned, an initial overshoot, then PN with a per-missile random N (2.5 to 5) and a 0 to 0.4 s stagger; a decaying
lateral sine wobble early; trails as camera-facing ribbons over 16 to 32 points, alpha by age. A procedural one in Blender:
https://www.blendernation.com/2021/10/29/itano-circus-with-geometry-nodes-missile-show/. **Fair foes' missiles:** slow, a visible
launch tell and trail, a turn-rate cap, a lifetime (dumb after ~2.5 s) so a sidestep makes them overshoot.

## 4. Boids by the hundred

Reynolds (https://www.red3d.com/cwr/boids/): separation, alignment, cohesion over local flockmates; predictive avoidance; predator and
prey (Tu and Terzopoulos, *Artificial Fishes*, 1994). A three.js WebGPU compute example runs 100,000 with a GPU grid (count, prefix
sum, scatter; 27 neighbour cells; weights separation 1.6, alignment 0.8, cohesion 0.6) (https://webgpu.dudoxx.com/en/physics/boids).
Abzu animated its thousands of fish by formula instead of skeletons (https://www.killscreen.com/abzu-2/).
**A PS2-budget plan [own, unmeasured]:** 300 to 800 glints on the CPU: a uniform grid with cell = the neighbour radius (counting sort
into a typed array), 6 to 8 sampled neighbours, a third of the flock updated a frame (round robin, interpolated), one InstancedMesh.
**Bait ball and piranha [own]:** the ship is the predator (flee within R_f; cohesion and alignment rise when it is near); the ball is a
sphere-shell spring to centre + unit(p - centre) R_ball, slowly rotating; the frenzy: the Conductor peels attackers off in turn, each a
windup (a glint), a straight dash at a fixed aim point (a dumb aimed shot), then a rejoin.

## 5. The storm's warp, cheaply

Screen-space haze: sample the rendered frame at UVs displaced by scrolling low-frequency noise, masked
(https://tympanus.net/codrops/2016/05/03/animated-heat-distortion-effects-webgl/). Chromatic aberration [own]: R, G, B at
uv + dir k {-1, 0, 1}, k growing to the edges. Curved world: bend vertices in view space by distance (three.js `onBeforeCompile` with
a `customProgramCacheKey`); keep depth and shadow materials consistent:
```glsl
mvPosition.y -= uBend * mvPosition.z * mvPosition.z;
mvPosition.xy += uWarp * vec2(sin(mvPosition.z*0.15 + uTime*2.0), cos(mvPosition.z*0.11 + uTime*1.7)) * smoothstep(5.0, 60.0, -mvPosition.z);
```
Low-frequency only (CLAUDE.md, no aliasing crawl); measured with `npm run perf`.

## 6. Difficulty and fairness

No published formula found; designers tune by playtest. Proxies [own]: temporal density (bullets entering a second), spatial density
(bullets within reach), gap width over ship width, reaction time = distance / speed - telegraph (keep it over ~0.5 s). Our lane marks
(Divination) double as telegraphs.

## The pattern library (proposed names)

1 Ring, 2 Rotating ring, 3 Even fan, 4 Odd fan, 5 Aimed burst (stream), 6 Offset-aimed twins, 7 Stack fan, 8 Single spiral,
9 Multi-arm spiral, 10 Double helix, 11 Accelerating spiral, 12 Rose, 13 Wall with a gap (a snake wall; gap at least 3 ship widths),
14 Sine curtain, 15 Decelerate-then-burst, 16 Accelerating rain, 17 Curving shot, 18 Split shell, 19 Fragmenting ring, 20 Crossing
gate (two aimed streams crossing at the ship), 21 Stratified rain (jittered grid, not uniform random), 22 Sweeping beam, 23 Snake
laser, 24 Homing salvo, 25 Itano swarm, 26 Cage ring-in (a closing ring round the ship with one open sector), 27 Glint frenzy dash,
28 Plain/outlined mix (any pattern with a share of outlined shots).

## Rules of fair danmaku

1. A tiny, centred, consistent hitbox, never larger than shown. 2. Every bullet readable (directional, contrast, drawn on top).
3. Telegraph before danger. 4. No blind spots (seed deltas, stratified random). 5. Always a gap and a path to it; reaction time above
~0.5 s. 6. Count is not difficulty. 7. Slow for micro-dodging, fast or streaming when the player cannot track many. 8. Alternate light
and heavy. 9. Even fans constrain, odd fans threaten. 10. No stray bullets, no edge traps. 11. Homers turn at a capped rate, live a
while, leave a trail. 12. After a failure, clear the bullets and grant mercy. 13. Scripted, seeded randomness (`stream(name)`).
14. Tune by playing it; measure with `scripts/rail.mjs`.

**Not read:** Sparen A5 (spirals, BoWaP), Danmakufu's lasers, the Cave and Ketsui interviews' text, Abzu's GDC talk; no source for Ace
Combat's missiles, a PS2-era storm shader, sardine steering equations, or a published difficulty formula.
