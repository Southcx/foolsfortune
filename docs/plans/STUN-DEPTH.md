# Stun depth: dazed, stunned, out cold

Kept by Dovina (the rules and the numbers). `creatures/stun.js` and the knobs in `core/config.js` are Petra's. The stars
(`vfx/dizzy.js`) are Calissa's, the stings are Wanda's, and the three names are Espada's to rule (working names here).

> "The follow-ups I'm missing are all of them because switching tools takes time on top of having to notice when the creature is
> stunned AND deciding what might be the best option given the combat circumstances. I agree with chaining depth of the daze, because
> hitting that first stun is then a great signal for a burst window to try to get to the max daze, which can then be combo'd into a
> real finisher like the Lockheart activation, Zandatsu, or Reprogramming. The base length of time for the stun still needs to be
> extended." (the owner, 2026-10-18)

## 1. Why the window is too short (measured)

A stun lasts 4.5 s today (`stunFor`), then the creature is immune for 6 s (its meter fills at a quarter of the rate). Before a
finisher can begin, the Courier has to do five things:

| step | time | source |
|---|---|---|
| notice the stun | 0.4 s | a simple reaction to an expected cue is about 0.25 to 0.3 s; in a fight, more |
| decide among the finishers | 1.0 s | Hick-Hyman: about 0.6 s for five choices with no load; budgeted higher under load |
| switch tools | 0.6 s | measured: `weapon.holsterTime` 0.34 + `weapon.drawTime` 0.26 (`core/config.js`) |
| close the distance | 1.0 s | an estimate: about six metres at a sprint |
| start the finisher | 0.3 s | an estimate |
| **total** | **3.3 s** | out of 4.5. Notice late and the margin is gone. |

Reprogramming already holds the creature down once it has begun (`stun.hold`). What runs out is the time to get there.

## 2. The rule: three depths

The names stand (Espada, 2026-10-18, proposed). For the Codex: a Figment is a thought an island is thinking. Dazed, it slips;
stunned, it loses its thread; out cold, no one is thinking it, so there is no one in it to refuse a rewriting (section 3).

A first stun is **dazed**. Stunning a creature that is already down pushes it **deeper**: its poise meter keeps filling from your
blows while it is down, it does not drain, and a full meter takes it one depth further, to **out cold** at most.

| depth | stars | its length (from reaching it) | blows land | immune after |
|---|---|---|---|---|
| 1 dazed | 1 | 7 s | ×1.5 | 6 s |
| 2 stunned | 2 | 8 s | ×1.5 | 8 s |
| 3 out cold | 3 | 10 s | ×2 | 10 s |

- **Reaching a depth resets the clock** to that depth's length (never shorter than what was left).
- **While it is down, its meter fills at ×1.5** (the same bonus the blows get) and does not drain. A burst is how you get deeper.
- **The first stun is the signal for the burst** (the owner's reading). The deepest is the finisher's moment.
- Every number here is a knob (`core/config.js`, the tuning panel), for the owner's play to settle. This mechanic is in flux: no check
  is written for it.

## 3. The finishers: open from dazed, at their best out cold

The design law: every source of growth pays more for doing it well, and still pays for doing it at all. So no finisher is locked
behind out cold. Each one works from dazed and is at its best out cold:

| finisher | dazed | stunned | out cold |
|---|---|---|---|
| zandatsu (the Sondelass) | half its yield | three quarters | its full yield |
| reprogramming (the Veritome) | can be refused, as today | a third less likely to be refused | cannot be refused |
| the Warden's Lockheart's catch | `clean` up to 0.67 | up to 0.83 | up to 1 |
| the god hand's catch | the struggle as today | a third shorter | half as long |

The Lockheart's `clean` today is the stun's time left over its length (`lockheart.js`). With depths it becomes that share
× (0.5 + depth / 6), so 0.67, 0.83 and 1 at the start of each depth.

### Built (2026-10-18), and two rulings
- **Built:**
  - Petra: `T.stun` in `core/config.js`, `stun.depth(t)` and `stun.share(t)`, `depth` on `creature.stun`, `stun.build` and
    `creature.zandatsu`, the four finishers, and the clapperjars.
  - Dovina: the log line by depth (out cold once a fight), `stun.depth.<n>` and `creature.<kind>.outcold` in the ledger
    (`feedback/tracking/stun.js`), and the Out Cold achievements (Battle).
- **A kind's `stunFor` scales the depths up, never down.** The time budget in section 1 is the Courier's, not the creature's. A
  slippery kind (the Lantern Wisp, `stunFor` 2) is made hard by its poise, so it is harder to stun, and never by a window shorter than
  the table's. The slip jelly (5) keeps its longer lengths.
- **Asleep, held or melted with no stun reads as stunned (depth 2)** for the finishers. Each took work to bring about, though not a
  burst: better than dazed, short of out cold.

## 4. Two avenues for the depth (CLAUDE.md: every number that matters)

- **The body and the world:** the stars wheeling over its head, one per depth: 3D star meshes (the owner, 2026-10-18; Calissa's,
  in `vfx/dizzy.js`). The build ring of pale stars still shows the meter filling toward the next depth.
- **A sound:** a sting at each depth, rising (Wanda's). The first stun gets a beat of hit-stop: the moment to notice.
- **The log**, when it changes: "The slip jelly is out cold." once a fight (a `throttle`).
- **The overlay:** the tag's statuses line names the depth from STUDIED (OVERLAY.md 17).

## 5. Asked of each division

- **Petra:**
  - the depths in `creatures/stun.js`: a depth on the stun's state, deepening while it is down, the lengths and immunity by depth;
  - the numbers as knobs in `core/config.js`;
  - `creature.stun` gains `depth`;
  - the finishers read `stun.depth(t)`: zandatsu in `sondelass/blade.js`, reprogramming in `veritome/reprogram.js`, the catch in
    `lockheart.js` and `godhand/catch.js`.
  - The clapperjars' own stun (`clappers.js`) takes the same depths.
- **Calissa:** the star mesh, with the count as the depth.
- **Wanda:** the three stings.
- **Espada:** the three names (dazed, stunned and out cold are working names).
- **Dovina:** the tracking rule (the log line, `creature.<kind>.outcold` in the ledger), and an achievement for taking a kind out cold.

## Prior art

- **Monster Hunter's knockout** (blows to the head fill a hidden meter; a knocked-out monster is open to a mount or a big attack).
- **Final Fantasy XIII's chain gauge** (keep feeding a staggered enemy and the stagger deepens, and the damage with it).
- **Sekiro's posture** (pressure fills it, rest drains it, a break opens the deathblow).
- **Devil May Cry's Devil Trigger burst windows**.
- **The cartoon's stars over a dazed head**, counted (Super Smash Bros.' shield break, Kirby's dizzy).
