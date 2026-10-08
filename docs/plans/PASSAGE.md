# The passage: drafting a trip on the sea chart, with Divination's portents (the owner, 2026-10-08)

Kept by Dovina. The ride it drafts is `docs/plans/RAIL-OVERHAUL.md`; the research `docs/plans/research/ROUTE-MAP.md`.

> "Draft up a plan for the Divination integration into the 'Course Charting' module... it should function similarly to drafting a path in
> Slay The Spire. A starting point, a destination, and a constellation of nodes that you have to pick and build a path out of, with
> Divination giving you information as to what might happen at that node like a forecast, with confidence dwindling as the depth of the
> search through the nodes gets deeper. Successful completion of a trip gives you that trip's map, which can also then be sold."

**Words (the glossary first):** "course" is the basement's loop and "chart" alone is the map's, so this is **the sea chart** (the
constellation at the pier: a chart in the map's sense), **the passage** (the path you draft through it), **a waypoint** (a node of
it: one leg), **a portent** (what Divination tells of a waypoint: not "forecast", which is the weather's) and **a rutter** (the trip's map, kept and sold: a sailor's book of
routes, from the French *routier*). Player words are Espada's to change.

## 1. What exists, and what this adds (read in the code, 2026-10-08)

Exists: three islands on a line (`NODES`), a hop's fuel, distance and danger (`hop()`), one to three legs (`legsOf`), the crossing as a
pure function of route, game day, cargo, the Leviathan's deck and weather (`crossing.js` `script()`), the reckoning (`RECKON`,
`voyage.reckon()`: the day's best divined share of a route) and its lane marks, the forecast of weather (`weather.forecast`), the
Cogitomap's worth and island demand. **Missing:** a constellation between islands, a choice before boarding, a portent per waypoint,
any caller of `reckon()` (the survey verb is unwired), and a trip's map.

## 2. The sea chart

Opened at **the pier** (F at a jetty's end, as now) after choosing the destination. Drawn left to right from the island you stand on to
the one you sail for; between them **columns** of waypoints, the passage one waypoint a column.

**Its size, from the hop:** columns = `clamp(2 + round(distance / 3) + (danger >= 1 ? 1 : 0), 3, 6)` (measured: the Margarite run 3
columns of 4 rows; Anagami to Entropolis 4 by 4; Margarite to Entropolis, King to Queen, 6 by 5).

**Its lanes (Slay the Spire's method):** four passes from random waypoints of the first column, each step to one of the three nearest
in the next, merging allowed, **crossing never**; waypoints off every lane removed; the last column links to the destination.
**Its contents, a budgeted pool** (never a roll per waypoint), by the route's danger d (-1 calm .. +2 wild):

| waypoint | share | rules |
|---|---|---|
| the shoal | 30% - 5% d | |
| the Wreckers | 10% + 5% d + 3% a cask aboard (at most 30%) | never in the first column; their strength rises with the casks you carry |
| the storm wall | 12% + 4% d | never two in a row |
| the graveyard | 12% | |
| the maelstrom | at most one a sea chart, from the third column | |
| a calm (haven) | 18% - 4% d | never two in a row; never in the last column |
| a bounty | one, if Letty has posted one on this route | |
| Old Nobody | from its deck (`LEVIATHAN.deck`), drawn when the sea chart is laid: if drawn, one waypoint of the last two columns | the deck's guarantee is kept, and a portent can now see it coming |

Local rules (Slay the Spire's): a haven, the Wreckers and the storm wall never follow themselves (child unlike parent); a waypoint
with two or more ways on leads to unlike waypoints (siblings unlike); the first column is never a boss leg; **one column in the middle
always has a calm on some lane** (an anchor: the rest before the climb).

**Determined by the day:** the sea chart of a route is a pure function of (route, game day, the Leviathan draw) through the existing
day's hash (`hash01`), so the same game day lays the same sea (learnable, as an arcade stage is), and the next game day another.

## 3. The passage, and what it costs

You draft the passage before you cast off: click a waypoint in each column along the lanes (a path that only follows the lines).
**Fuel** is the hop's (as now). **The pressure is the hold:** every cask aboard raises the Wreckers' share of the sea and their
strength (a step for every four casks), so a rich cargo makes every lane wilder. You may **redraft at a calm** (the waypoints ahead
only; a calm's buoy sells fuel).

## 4. The portents (Divination)

Each waypoint shows what Divination tells of it, at a **confidence** that falls with its **depth** (waypoints ahead of you on any lane):

```
confidence(depth) = clamp01(sight x falloff ^ (depth - 1))   (depth 1, the next waypoint: always exact)
sight   = (0.35 + 0.65 x reading) x widen('divination.reckon') x weatherLead
falloff = 0.62 + 0.08 x (Divination level / 99)
```
- **reading** (0 .. 1) is the day's best **reading of the sea** for this route (the existing `reckoning`, finally wired: §5).
- **widen** is Divination's widening (x1 at level 1 .. x1.5 at 99, existing `divination.reckon`).
- **weatherLead** is the weather of the island you leave (existing `stageWx(...).lead`: the pall of dread x0.6, wonder x1.25): a dread
  sky shortens how far you see.
- Recomputed as you sail: **depth counts from where you are**, so the fog lifts as you go (a waypoint dim at the pier is sharp by the
  waypoint before it).

**What a confidence shows** (counted candidates, never a percentage: the research's "counts beat percentages"; Hades' doors):

| confidence | the waypoint shows |
|---|---|
| depth 1, or 0.85 and up | its leg exactly, with its strength (a pip a class) |
| 0.6 to 0.85 | **two** candidates, the true one among them |
| 0.35 to 0.6 | **three** candidates, the true one among them |
| 0.15 to 0.35 | its **silhouette class** only: a threat, a haven or a boss |
| under 0.15 | a dim star: something is there |

A **known-empty** state is never shown (there is no empty waypoint). Candidates are drawn by the day's hash from the pool's other
types, weighted as the pool, so the decoys are plausible. **No crisp edge** where sight ends (the hurricane cone's lesson): the tiers
fade one into the next (Calissa: blur and transparency by confidence, the silhouette class kept crisp). **The portents are calibrated
and true:** the true leg is always in the shortlist shown; a test (`scripts/passage.mjs`) lays 10,000 sea charts and asserts it.

## 5. The reading of the sea (the survey verb, finally wired)

At the pier, with the Dreamvane worn, **F, then hold the dowse over the sea chart**: the needle swings toward the strongest of the
route's waypoints' signatures (each leg gives off a signature of its feeling and strength: CLAUDE.md, `core/signatures.js`). Holding
the needle steady on it for four beats while the sea's pull wanders is the skill; the **quality** (0 .. 1) is how long it was held true
(a steadiness the vane already measures for the weather). The reading is `voyage.reckon(from, to, share, q)` (existing: the day's best
kept), and it pays Divination EXP (existing source `emocean.reckon`). **Skill skips grind:** one good reading opens most of the sea
chart; **grind closes the gap:** the level's falloff and widening let a patient player see as far with plain readings. A reading again
at a calm sharpens what is ahead.

## 6. The rutter (the trip's map)

**Made home:** a passage sailed to its end (not broken up, not continued twice) gives **a rutter** (item `rutter`, kind `'rutter'`,
its own demand key: not the Cogitomap's), with `{ from, to, day, passage: [waypoint ids], legs: [their types], rank, read }`. It reads
as the sea chart of that game day with every waypoint you sailed exact, and the rest as you last saw them.

**What it is for:**
- **Sold** to the Purser (Margarite pays dearest: "Law wants its minds charted", `maps: 0.95`; Entropolis shrugs) and to Raku (half).
- **Used the same game day:** at the pier it shows that route's sea chart fully (a ticket to a known sea, as a Cogitomap is to a Well).
- **Copied** by Spellscription (`spellscription.copy`, extended from Cogitomaps).

**Its worth** (`rutterWorth`, `ECON.passage`): `round(perMinute x minutes x 0.25 x rankFactor x (0.5 + 0.5 x read))`, minutes the passage's sailed real
minutes, rankFactor S 1.5, A 1.2, B 1, C 0.8, D 0.6; **stale** by game days: x0.5 a game day after (the sea chart reseeds daily, so
yesterday's rutter is a curiosity), and the existing glut (`demand`'s `sold`). Its cap keeps a trip's pay under 1.5 x the aim with the
rest of the trip's earnings (ECONOMY.md), measured in `scripts/economy.mjs` (a new **hauler** profile). At six real minutes, read
whole: S 18, A 14, B 12, C 10, D 7 cubes (a side income; the cargo is the trip's living).

## 7. Events, ledger, achievements (Dovina's)

Events (each with `by`): `passage.chart { from, to, columns, day }` (the sea chart laid), `passage.draft { waypoints }`, `passage.read
{ q, read }` (the reading), `passage.waypoint { type, depth, confidence, guessed }` (arriving: was the portent's shortlist right, and
which was shown), `passage.redraft`, `passage.done { rank, legs }`, `rutter.get`, `rutter.sell`. Ledger: trips, waypoints by type,
readings, the best reading, the deepest exact portent, rutters made and sold. Achievements (a count way and a feat way): **a trip of
six waypoints**; **a passage read whole** (every waypoint exact at the pier); **the long dark** (a trip under the pall, dread's
weather); **a rutter sold for its full worth**; **Old Nobody foreseen** (seen in a portent before it was met).

## 8. What it teaches (the commandment)

**Expected value and risk** (a richer, deadlier lane against a short safe one, with the cargo aboard raising the Wreckers' odds),
**reading a portent's confidence** (counted candidates, the fog lifting as you go: the meteorologist's habit), and **graph reading**
(lanes that merge but never cross). Never said; only played.

## 9. Who builds what

| division | builds |
|---|---|
| **Dovina** | `src/progress/econ/passage.js` (the sea chart's generator: lanes, pool, rules; the portents and their tiers; the rutter's worth), `scripts/passage.mjs` (the calibration test and the generator's checks), the events' rules, ledger, achievements, the hauler profile, the glossary entries |
| **Petra** | the pier's sea chart window and the drafting input, the reading of the sea (the vane over the chart; the call to `voyage.reckon`), the crossing run from the passage (a leg per waypoint), the rutter's item and sale |
| **Calissa** | the sea chart's look (the constellation over the crude, the lanes as threads of light, the waypoint icons, the candidates' blur and fade, the silhouette classes), the rutter's model and its page |
| **Wanda** | the reading's sound (the needle's tone steadying), the sea chart's ambience |
| **Espada** | the player words (the passage, waypoint, sea chart, rutter, the reading of the sea), the waypoints' names in the log |

## 10. Acceptance (the Emocean sweep, and `scripts/passage.mjs`)

1. **Built:** `src/progress/econ/passage.js`; `node scripts/passage.mjs` lays 6,000 sea charts (three routes, 2,000 game days) and passes: no crossing lanes; every rule held; every waypoint reachable; the pool's shares within 3 points of the table.
2. A portent's shortlist always holds the truth; depth 1 always exact.
3. A reading of quality 1 at level 1 shows the second column at two candidates or better (sight 1 x 0.62 = 0.62).
4. A passage sailed to its end gives one rutter, with its legs and rank; sold at Margarite above Entropolis.
5. A debug chest at the jetty: the Dreamvane and cubes for fuel.
