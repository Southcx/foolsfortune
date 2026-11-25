# Brief 02: the Solar Skiff

South's other favourite. A sand boat after the King of Red Lions (The Wind Waker), with racing and board-game tricks on top. The rider
and the board are **one rigid unit** turned by one quaternion.

Source: `src/courier/skiff/skiff.js` (797 lines: the `Skiffing` tech, the whole ride), `boat.js` (the model, sail, boom, pennant,
glide wings), `rider.js` + `clips.js` + `boatpose.js` (the Courier's skiff clips and the board's partner clips), `grind.js` (rails),
`combo.js` (the trick combo), `boardrules.js` (the Raceway's stakes: hull, scorch, manual, shoulder, near miss), `grabreach.js`
(hands on the gunwale), `surf.js` + `barrelcam.js` + `handdrag.js` (the wave pool), `sloperide.js` (snowboarding down a dune face).
The ground it rides: `world/dunes/dunes.js` (`heightAt`, `normalAt`, `rideHeight` (water over sand), `wind`), the Raceway's track
pieces: `world/raceway/*`. Parts and tuning sheet: `progress/skiffparts.js`, `progress/skifftune.js`, `progress/skiffruler.js`.
Tuning `PORT/data/core/config.json` → `DEFAULTS.tech.skiff`; the constants below live at the top of `skiff.js` (copy them).

## 1. Lifecycle

It is a **Tech** of the Courier (brief 01 section 4): while it rides, it owns the fixed step. Phases with a clip each:
`summon` 2.2 s (Y on foot: the board rises out of the sand, the mast telescopes, the rider hops on), `mount` 0.96 (F at a parked board),
`ride`, `dismount` 0.83 (F under 6 m/s: the board left parked, hovering), `recall` 0.96 (Y riding: it shrinks into the hand),
`bail` 1.3 then `getup` 1.5. Only active in the Dunes (and places that offer a sand field). The psygun is stowed while riding.

## 2. Controls

| key | on the sand | in the air |
| --- | --- | --- |
| W held | hoist the sail (to 1 over `hoistTime` 1.0 s; it stays) | glide: dive |
| S held | furl it (over `furlTime` 0.6 s) and brake 16 m/s² | glide: flare |
| A / D | steer (turns on the spot, carves at speed) | spin the whole skiff (a trick) |
| Q / E held | **the carve** (left / right) at speed | glide: bank; else steer the flight a little |
| Space | hold to crouch the springs, release to **hop** | let go just after a crest: **late pop**; held: **glide** |
| LMB / RMB | | **grab** nose / tail (both: double), let go before landing |
| Shift | **solar flare**: speed and accel up, costs Lachryma | a push along your facing |
| C | spend one **banked flare** whole (a Mario Kart mushroom) | |
| F, Y | dismount, recall | |

## 3. The sailing model (one fixed step, the ride phase)

Frame: `f` = forward (sin heading, 0, cos heading), `r` = right. Speed split into `vf` (along f) and `vl` (sideways).

1. **The sail** `L` in 0..1. **Pump**: run it back up to full from under 0.4 (and it had been under 0.5 since the last pump) and it kicks
   `pump` 3.2 m/s at once (Wind Waker's sail pumping). Event `skiff.pump`.
2. **The wind**: the Dunes' `wind = { dir, speed 8, gust }`, fixed direction 0.55 rad (shown by an arrow beside the stern). The sail's
   share by the cosine between the heading and where the wind goes, **the polar** (piecewise linear):
   `[[-1, 0.28], [-0.6, 0.42], [-0.2, 0.7], [0.2, 0.92], [0.7, 1.0], [1, 1.0]]`; × `gust`; × √(the Raceway weather's wind).
3. **Target speed** = `cruise 24 × L × polar × parts' top × (0.? if the sail is scorched)`. Accel = `accel 7 × (0.45 + 0.55 L) × parts / mass^exp`.
   - **Flare** (Shift, while the pool can pay `boostCost 20`/s): target `max(target, 0.55 cruise) × boostMult 1.45`, accel `boostAccel 26`.
     It decays (`boosting` −2.2/s) and still lifts target after release.
   - **Turbo** (a push from a carve, sun plate, pop or banked flare, free of Lachryma): target `max(target, 0.6 cruise) + add`, for its
     duration; another while one runs **stacks its length** to 4 s (Crash Team Racing's reserves).
   - Below target: `vf += accel·dt`. Above: coast down `(coast 1.6 + 0.012·vf²) × weather × parts / mass` per s.
   - S on the ground brakes 16 m/s². Plus this step's pump and kick. In the air `vf *= exp(-0.015 dt)`.
4. **Grip**: `vl *= exp(-grip 5 × dt × k)` where k is 0.1 in the air, 0.3 in a carve, × wet sand and surface grip. Low grip is the drift.
5. **Slopes**: on the ground, gravity projected onto the ground plane, `× slopeGain 1.6` along f and half that along r.
6. **Sun plates** (Raceway glyphs on the sand): on entering one, a push `add 10 × power, 1.2 s, kick 4` (its power is the sun's: dead at night).
7. **Steering**: `rate = turn 2.0 × parts × (0.35 + 0.65 × clamp(speed/7)) × (1 − 0.4 × speed/maxSpeed) × (0.3 in the air)`;
   `heading -= steer × rate × dt` (`steer` eased toward the input at 10/s). In the air the velocity turns with the heading (no speed lost
   on landing); A/D also spin the board (`spin += -steer × 8 × dt`).
8. **The carve** (MK8's mini-turbo): Q or E held on the sand above 10 m/s. The board slides (grip 0.3) and turns at `1.25 + 0.45 × steer`.
   It loads tiers at 0.48, 1.04, 1.76 s held (half rate if steered against it). Let go: a push by tier `add [5, 8, 12]` m/s for
   `[0.7, 1.0, 1.3]` s plus an instant `[1.5, 2.5, 4]`. Lost if airborne or slowed under 6 m/s. Events `skiff.carve.charge {tier}`, `skiff.carve {tier}`.
9. **The hop**: Space held charges over `hopTime` 0.3 s; release: `vel.y = hop 7.6 + hopCharge 6 × charge`, forward `+1.2 + 2 × charge`.
   **Late pop**: released within 0.22 s of leaving a crest: up `hop × 0.7` (× 0.95 if within 0.08 s: a **perfect pop**). Too late (to 0.5 s):
   `skiff.pop.miss`, so the timing can be learned.
10. **The glide** (a hang glider; BotW's paraglider): Space held in the air after 0.12 s (an art you unlock), or opened by a glide lip.
    Pitch eased to `trim 0.2 + dive 0.45 (W) − flare 0.22 (S)` at 4/s. Airspeed `V += (gravity 24 × sin pitch + thrust − 0.008 V² −
    0.04 |bank| V) dt`; heading turns by `bank × 1.2 × clamp(V/10, 0.3, 1)` (×1.7 boosting); under 9 m/s it sinks 0.9 m/s per m/s short.
11. **Height**: the deck hovers `hover 0.5 + 0.1` m over `rideHeight` (sand, or water over it), following it with a lag:
    `vel.y = damp(vel.y, vyT, follow 12) − gap × 60 × dt`, where `vyT` is the vertical speed the slope asks. **That lag is what makes a crest
    a launch**: a gap over 0.85 m (or 0.25 m rising fast) is airborne. In the air: gravity 24.
12. **Speed cap** `maxSpeed 42`. Move with the Courier's controller (`P.move`), then measure what walls took: lost over 4 m/s drains the hull
    (Raceway rules); lost over 25% of speed: over **15 m/s head-on is a bail**, otherwise slide along keeping 95%.
13. **Rails**: airborne near a rail, the keel locks on with no button (`grind.tryLock`, reach 1.4 m). Landed along it: a 50-50; turned
    between 1.05 rad and π−1.05 across it: a **boardslide** (a trick). See section 5.
14. **The camera** swings behind the heading (3/s) once the mouse has been idle 0.5 s above 4 m/s. Lean into turns (roll ≤ 0.15 rad; in a
    glide ≤ 0.35 by the bank).

## 4. Landing (`land`)

- Impact = (vyT − vel.y) × max(0.2, normal.y). The board's spin is compared to whole turns:
  - within 0.9 rad of a whole turn (≥ 1 turn): **a trick**, `+3 + 2 × turns` m/s forward, `skiff.trick {turns}`, combo points 100 a turn.
  - 0.52 to 1.22 rad off: **wobble** (×0.7 speed, the combo banked).
  - more than 1.22 rad (broadside): **bail**.
- Still grabbing as it lands: the grab is lost, ×0.8 speed.
- **Slope landing**: down a slope, `min(8, fall × downhill × 0.8)` of the fall kept as forward speed (a trick from 2 m/s: `skiff.land.slope`).
- Impact over 40: bail. Over 16: the hull takes it (Raceway) or ×`max(0.55, 1 − 0.02 (impact − 16))`.
- **Bail rules** (`BAIL`): head-on wall loss 15 m/s, wobble 0.52 rad, broadside 1.22 rad, hard 16, land 40; never under 8 m/s, never in the
  first 0.5 s. A bail throws the body as a **ragdoll** (`courier/anim/ragdoll.js`; keeps 0.7 of speed, 3 m/s up) and fades it into the
  get-up clip over 0.35 s; the board slides to a stop and parks. `skiff.bail {why, speed}`; each thump `skiff.tumble`.

## 5. Rails, the combo, the board's rules

- **Grind** (`grind.js`, Tony Hawk's balance): speed kept from entry; downhill gains, uphill loses, drag 0.03, the sail's wind along the
  rail pushes (4). A lean drifts and grows with time; A and D answer it; past the edge the board drops off that side (never a bail). A curve
  throws the lean outward by speed². Space pops off. LMB or RMB double-clicked (0.3 s) is a grind trick (nose grind, tail slide).
  **Coaster rails** carry `ups` and `push`: gravity along the 3D tangent, the board standing on the rail's up, through loops.
- **The trick combo** (`combo.js`, SSX's boost meter): points spin 100, grab 80 (+50 tweak if held 0.6 s, × time held, double ×1.5),
  grind 6 a metre, pop 50 (perfect 100), carve 40/90/160, ring 60, slope landing 50. Each new kind raises the multiplier by 0.5, to 4.
  The chain lives in the air, on a rail, in a carve and for `link` 2 s on the sand after a trick; then it **banks**: points × mult fill
  banked flares (1000 a stock, 3 at most), spent by C. A wobble banks at once; a bail loses it.
- **The board's rules** (`boardrules.js`, the Raceway only): the pool is the hull (a hard knock with it empty **wrecks** the board); a
  flare held too long **scorches** the sail (it luffs); the **manual** (W and S together keeps a combo alive on the ground); the
  **shoulder** (Q / E twice: bump a rival); **snaking**; aftertouch (steer a bail); **near miss**. Parts' multipliers (`mult('top')`,
  `'accel'`, `'grip'`, `'turn'`, `'mass'` ...) come from the garage (sail, keel, hull) and the tune sheet (five sliders).

## 6. The wave pool and the slope (Calissa's, Raceway only)

- `surf.js`: on the wave pool's water the board sits in it (`SURF.seat`); its speed is relative to the water the wave carries; pumping
  W on a steep face, S held under the lip stalls into the barrel (tube time), the spit pushes out, wipeouts by the lip or the foam ball.
  The pool's surface is `world/raceway/surf/wavepool.js` (`lipCurve`, `WAVEPOOL_GLSL`). Spec: `docs/ref/WAVE-RIDING.md`.
- `sloperide.js`: sail furled on a downslope = a snowboard: A/D tilt onto an edge (turn by sidecut, skid past grip), butters, pre-wound spins,
  landings graded clean / sketchy / bail.

## 7. The look and the rider

- The model `src/assets/solarskiff.glb` (source `source_assets/Courier/courier_solarskiff.blend`, hull painting
  `courier_solarskiff_hull.png`): built in its own frame (+Z bow, +X left, Y up, origin at the deck). `boat.js set({ sail, side, fill,
  boom, glow, speed, wings })` each frame: the sail hoisted to L, its belly and luff, the boom swung to leeward (wider with the wind
  behind), the pennant streaming downwind, the oars spread as wings in a glide.
- The rider plays the Courier's skiff clips (`courier_anims_skiff.glb`: `Skiff_Ride*`, `Skiff_Summon`, `Skiff_Bail`, grabs ...) blended by
  what the board does (`rider.js`); the board has partner clips of the same names (`boatpose.js`). Grab hands reach the gunwale (`grabreach.js`).
- The wake on the sand: `world/ground/wake.js` (a trail texture); on water `vfx/skiffwaterlook.js`. Sounds: a loop set from
  `(speed/max, boosting, air, gliding)` and the events.

## 8. Events

`skiff.hop`, `skiff.ollie`, `skiff.pop {late, perfect}`, `skiff.pop.miss`, `skiff.pump`, `skiff.carve.charge {tier}`, `skiff.carve {tier}`,
`skiff.glide`, `skiff.grab {grab, seconds}`, `skiff.grab.late`, `skiff.trick {turns}`, `skiff.wobble`, `skiff.land.slope`, `skiff.landhard`,
`skiff.bail {why, speed}`, `skiff.tumble`, `skiff.plate {plate, power}`, `skiff.water {on, speed}`, `skiff.grind`, `skiff.grind.end`,
`skiff.grind.trick`, `skiff.combo`, `skiff.combo.bank`, `skiff.combo.drop`, and the surf and slope ones (EVENTS.md, group `skiff`).

## 9. How to check the port

Sail a straight line with the wind behind at full sail (settles near 24 m/s), across it (about 22), into it (about 7). Pump from furled: +3.2.
A tier-3 carve out of a bend: +12 m/s for 1.3 s. A 360 off a dune crest lands +5 m/s. A charged hop: 13.6 m/s up. The JS build's Raceway
(Index → the Raceway) and its Sun Circuit are the reference course.
