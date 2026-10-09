**2026-10-09, from Calissa (Art): the Great Slip Jelly's look at FOE.size 14, and what is left for the fight (branch art-v133-jelly, on
your ea1b481)** (delete in your branch when done)

Your BIG change came in while I was scaling the model; it is the scale now. I took my own look scale out (`FOE.size` is the one number),
and nothing of yours is touched: the branch changes only `src/vfx/` and docs.

**The height, measured** (headless, the great cavern laid, the FOE standing at W0; the slip jelly mesh is 1.496 m tall in its own units)
| | v130 (x1.6) | FOE.size 14 |
| --- | --- | --- |
| body tall / wide (x) / deep (z) | 2.39 / 1.50 / 1.59 m | 20.95 / 13.11 / 13.95 m |
| crown top, standing / asleep (squash 0.62) | 3.17 / 2.26 m | **27.8** / 19.8 m |
| urn across (widest) / its lowest teeth | 2.10 m / 2.2 m up | 18.4 m / 19.3 m up |
| the core: radius, centre | 0.55 m, 2.5 m up | 4.8 m (3.3 m tall half), 21.9 m up |

The Courier (skinned, idle): 1.78 m to the top of the head, 1.91 m to the hair, the capsule 1.7 m. **FOE.size 14 makes the body 11.8
Couriers and the jelly with its crown 15.6.** The owner's "about 12 Couriers tall" does not say whether the crown counts; if it does,
FOE.size **10.6** gives 21 m crown on (the urn 13.9 m across). Your number and Dovina's to settle with the owner; the look follows
either (nothing in `src/vfx/` assumes a size).

**What the look does at this size** (mine, this branch)
- The urn crown (`vfx/urncrown.js`): the urn's flesh closes its underside (from the floor it was a lampshade over a pin, the roof seen
  through its mouth); the cracks' glow turns once across the urn at any size; a 120-sided smooth lathe (the 40-sided lip kept for the
  JELLY-CROWN glaze); the burst's sherds fall at real gravity by Froude scaling, stay in the world where it burst and lie at its feet
  (`U.top` is new: the urn's top over its group).
- The windups (`vfx/foelook.js`): the body's size no longer counts the crown (its shell and beads sit on the body), and every particle
  grows by Froude scaling (`froude()`, `vfx/cavekit.js`); Centring's spiral of sand is held inside the dish.
- The bowl's kit: pillars and stalactites take sides by their girth, their dust and chips and the pool ring's slip grow the same way,
  and the far wall's terraces average out under three pixels.

**Left for the fight** (yours unless marked; each with the number that shows it)
1. Lidfall's windup (`bash` squash 1.4 x FoeLook's crownBash stretch 1.28) lifts the crown's top to 46 m: under your 50 m roof (54 m over
   W0's floor). Rearing (`rear` 1.35): 35 m. The stalactites clear it: standing, the crown's top (27.8 m) is under every tip (32 and
   40 m over the rim); rearing at a ring pool the urn's lip is about 5 m short of the spike on that bearing, and `dropOver` (3.5 x k, 30.6 m)
   drops it at a surfacing anyway. Clear.
2. The pillars at 90 and 270 degrees stand 5 m from W2 and W4 (r 45 and r 40): surfacing there puts a pillar inside its 7 m body.
3. The ring pools are 5 m in radius against its 7 m body: it sinks into sand round a smaller pool (W0, 7.5 m, holds it).
4. The lock-on's point is `c.height * 0.55`, 11.6 m (mid-body): the crown (19 to 28 m) is out of a locked frame from the floor. Your
   cinema frame tilts up while it stands; a locked point on the crown while crowned, the core when bare, would match the fight's targets.
5. raid.js: the Slip Trail drops are 0.32 m spheres lobbed from 1.6 m up its foot on a 5 m arc (suggest about 2.2 m, from 20 m up);
   the Sherds are cls 1 jellies, 1.95 m tall, beside a 21 m body (four quarters of its volume would stand 13 m: Dovina's call;
   FoeLook's sherds and threads follow whatever roots you give them).
6. The free camera frames it: from the ledge (68.6 m off) at pitch -4 degrees the whole jelly is in frame; from the floor at 24 m,
   pitch 16, the body and the urn's rim; at 19 m it takes pitch 32 to see under the crown. With the Courier 32.5 m out (the camera
   6 m behind, pitched 14, over a ring pool's edge) the top half of the frame went to a flat rainbow, on your ea1b481 and on mine
   alike; I moved the shot and did not find its cause: worth a look from where the camera's floor is decided.
7. The melt (`creatures/jelly/deform.js`) is drawn in the body's own space, so at x14 its streaks and grain are fourteen times as
   coarse: close to, the body reads smooth. Optional: a `detail` uniform multiplying the ring and run frequencies (`ring * 2.6`,
   `ring * 6.0`, `run * 0.35`, `run * 0.9`, the grain's `ring * 14.0, vJP.y * 16.0`), set to about 3 for the FOE (grain about 25 cm,
   three pixels at 40 m: no crawl). One program either way (`jelly-melt2`).

Verified: the look from the ledge and the floor, front and side, before (your ea1b481) and after; the dunemaw sweep's cavern and fight
parts (see my report). Not verified: anything of the fight in play.
