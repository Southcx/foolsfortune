# Creatures: the AI parts

How the things that live in Fool's Fortune think, and how to make the next one. Everything here is built once and shared: a new
creature is a body (how it moves and is hurt) and a mind made of these parts with its own wants and actions, not new machinery.

The slip jelly (`src/creatures/jelly/`) is the first creature built this way and the worked example throughout.

---

## 1. The picture

```
            the world                                    the creature
  ┌──────────────────────────┐        ┌─────────────────────────────────────────────┐
  │ STIMULI  (creatures/ai/stimuli.js) │──hear──▶ SENSES (creatures/ai/senses.js) ──write──▶ MEMORY      │
  │  shots, blasts, calls,   │        │   sight cone + LOS, feel,      (creatures/ai/memory.js)│
  │  cries, deaths, food     │──see───▶   hearing                     facts, places│
  │                          │        │                                      │       │
  │ ECOLOGY  (creatures/ai/ecology.js) │◀─find──│ DRIVES (creatures/ai/drives.js)            ┌───▼──────┐│
  │  affordances: water,     │        │   thirst, hunger, rest, social,  │ REASONER ││
  │  food, shade, den, prey, │        │   fear, curiosity  ──────────────▶ (utility)││
  │  shiny; relations table  │        │                                  └───┬──────┘│
  └──────────────────────────┘        │  ACTIONS (the creature's mind.js)◀───┘ picks  │
                                      │   each tick: STEERING (creatures/ai/steer.js) → c.want   │
                                      │   and the BODY's moves (slipjelly.js)          │
                                      └─────────────────────────────────────────────┘
       STATUSES (creatures.js) and STUN (stun.js) act on the body and are actions' gates; REPROGRAM (veritome/) writes into all of it
```

One `Brain` (creatures/ai/brain.js) owns a creature's senses, memory, drives and reasoner, and runs the loop:

1. **Sense** a few times a second: look at the Courier and the creatures near it, listen to new stimuli; write into memory.
2. **Want**: drives rise on their own clocks, faster or slower as the moment asks (`mods`).
3. **Decide**: the reasoner scores every action from what the creature knows and wants; the best one runs (with a little momentum
   for the one already running, so it finishes what it starts).
4. **Act** every frame: the running action steers (`c.want`, a velocity) and asks the body for moves (wind up, lunge, call, eat).

## 2. The parts

### Stimuli (`src/creatures/ai/stimuli.js`): the world's noises
Anything that could be noticed without being seen puts a stimulus on the bus: a kind, a place, how far it carries, how strong, who
made it, and (optionally) who it is ABOUT and where they were.

| kind | made by | what minds make of it |
| --- | --- | --- |
| `noise` | a shot (22 m), a charged shot (32 m), a blast (18 + 6r m), a pot breaking, a heavy landing | an interest to look into; a startle for the timid |
| `light` | the Veritome's flash, a blast's glare | (the flash dazzles directly) |
| `alarm` | a creature's call to its kin, *about* what it saw | its kin learn of that thing, and where |
| `pain` | a creature hurt, *about* whoever did it | kin get a grudge against the culprit; a little fear |
| `death` | a creature burst, *about* whoever did it | kin: fear, a grudge, a place to mourn and then avoid |
| `food` | baubles spilled | an interest |
| `shiny`, `scent` | (reserved: cubes lying about, trails) | |

Add one where it happens: `game.ai?.stimuli.emit('noise', pos, { radius: 20, strength: 1, by: 'courier', source: entity })`.
Listeners keep the bus's sequence number, so each stimulus is heard once.

### Senses (`src/creatures/ai/senses.js`): finding out
`new Senses(game, { sight, fov, feel, hear, eye, onHear })`. Sight is a cone with line-of-sight rays (cast at most every `every`
seconds per thing); awareness builds over time, faster the nearer, the more central, and the more CONSPICUOUS the thing (the brain
rates the Courier: running and fighting are loud, crouching is quiet, a body melted into slip is invisible). Within `feel` it knows a
thing is there whichever way it faces. `onHear(stim, reach)` is the kind's own reaction to what it heard (the jelly's: kin's pain and
death). `dazzle(t)` blinds it for a while.

### Memory (`src/creatures/ai/memory.js`): what it believes
Facts about things (last place, awareness 0..1, threat, grudge), interests (heard but not seen), places (where it ate, where kin
burst). Awareness ebbs after `hold` seconds unseen; threat and grudge fade far more slowly. `AWARE.SUSPECT` (0.35) is the "?",
`AWARE.ALERT` (1) the "!". A mind acts on memory, never on the world: it can lose you behind a dune and go to where you were.

### Drives (`src/creatures/ai/drives.js`): what it wants
`new Drives({ thirst: { rise: 1/260, start: [0.05, 0.35] }, fear: { fall: 1/14 }, ... }, traits)`. Each 0..1, rising (or falling) on
its own clock; `tick(dt, mods)` scales the rates for the moment; `sat`, `add`, `set`. TRAITS (`rollTraits({ bold: [0.7, 1.35] })`)
make individuals: a drive spec can name the trait that scales its rate.

### Utility (`src/creatures/ai/utility.js`): choosing
An action is data:

```js
{ id: 'drink', weight: 1,                                   // its band: 1 living, ~2 survival, 3+ orders and statuses
  when: (x) => !!look(x, 'water', 80),                      // a hard gate
  consider: [(x) => curve.logistic(0.5, 8)(x.drives.get('thirst'))],   // each 0..1, multiplied (with IAUS compensation)
  cooldown: 4, lock: (x) => false, urgent: false,
  enter(x) {}, tick(x, dt) { return 'run' | 'done' | 'fail'; }, exit(x, why) {} }
```

Response curves: `curve.linear`, `power`, `logistic`, `fall`, `bell`, `step`, `floor(lo, f)`; inputs normalized with `norm(x, lo, hi)`.
The running action is compared with a 1.25x momentum; `lock` keeps an attack from being interrupted except by an `urgent` action.

### Steering (`src/creatures/ai/steer.js`): moving
Reynolds' behaviours as plain functions writing a desired velocity: `seek`, `arrive`, `flee`, `pursue`, `evade`, `wander`, `orbit`,
`separate`, `cohere`, `align`, `contain`, `avoid` (three whisker rays through a `probe` the body supplies), and `blend` (weighted,
capped). An action blends what it needs into `c.want`; the body eases its velocity toward it.

### Flocking (`src/creatures/ai/flock.js`): many as one
Reynolds' boids for a crowd: separation, alignment and cohesion over neighbours found through a spatial hash, in three dimensions, kept
in flat arrays (a hundred fish cost a hundred, not ten thousand). The owner gives it a mood from outside: `seek(i, out)` (a point each
member makes for, and how hard) and `speed(i)` (cruise or burst); every turn is limited, so a flock wheels and never snaps. The
crossing's shoal is its first (`src/world/emocean/shoal.js`: the bait ball, the frenzy, the scatter); a flight of birds or a swarm of
motes would be the next.

### Timelines (`src/creatures/ai/timeline.js`): a scripted fight
A raid boss is not a mind weighing drives; it is a script learned by wiping (FFXIV's timelines). Casts at set times from the pull, in
phases begun at a share of health and looping each a fifth faster; a phase marked `once` is a transition; `marks` fire at a share
(the second Blowout), `at` at a time (the enrage). The runner says `phase`, `cast` (the windup begins: the log names it) and `blow`;
casts never overlap. The script is data (`progress/combat/greatjelly.js`); what each cast does is the body's
(`creatures/jelly/jellycasts.js`), and the place's part is the raid (`world/well/raid.js`).

### Ecology (`src/creatures/ai/ecology.js`): the world as it is to a creature
**Affordances**: `eco.offer({ kind, pos, radius })` for standing ones (the Weir offers water round the pond and shade under every
palm), `eco.provide(kind, (pos, range) => [...])` for ones that come and go (baubles: `food`; loose cubes: `shiny`; wet slip:
`slip`; the shallows' fish: `prey`; each jelly's home: `den`). An item may carry `take(who)` (eat it: false if it is already gone) and
`alive()`. A mind asks `eco.find('water', pos, range)` and never knows what a pond is.

**Relations**: the table of what each kind is to each other kind (`kin`, `prey`, `threat`, `rival`, `curious`, `neutral`), with an
individual's own exceptions on top (`c.rel`, a Map by kind or by thing). Reprogramming writes exceptions: a jelly made to take the
Courier for kin, or to take its own kind for rivals.

### Brain (`src/creatures/ai/brain.js`): the parts put together
`new Brain(game, c, { senses, memory, drives, actions, think: 0.2, near: 50, far: 140, mods })`. Level of detail: within `near` it
thinks every `think` seconds; within `far` at 2.5x that; beyond, it does not look or think, only its drives tick (an off-screen
creature costs a few additions). `signal()` thinks again at once; `force(id)` starts an action; `describe()` is its line on F3.
`direct(id, secs)` gives it a DIRECTIVE: for that long (its own time, so a halted mind's directive waits), that action is what it
does, without asking its `when`, unless an urgent action of weight 5 or more (stunned, asleep, melted) takes it; false if its mind
has no such action. A relation written into `c.rel` with an expiry in `c.relUntil` (a Map, by the same key) is taken back by the Brain
in its time.

### Around the minds
- **Statuses** (`src/creatures/creatures.js`): halt, slow, sleep, forget, flee, soft, calm, melt, stun: timed, applied by anything, decided
  by the creature. In a mind they are the top-weighted actions (asleep, stunned, melted, sent home) and gates on the rest (calm: no
  attacks).
- **Stun** (`src/creatures/stun.js`): a poise meter on every stunnable thing (creatures and clapperjars); the Veritome's flash fills it; full,
  the thing is stunned and VULNERABLE (`game.stun.vulnerable(t)`): the zandatsu and reprogramming work on it, blows land harder.
  Dizzy stars show the meter and the stun (`vfx/dizzy.js`).
- **Reprogramming** (`src/tools/veritome/reprogram.js`, `src/tools/veritome/mind/`): a stunned mind opened with the middle button and told a MACRO the
  Courier composed in the Codex (VERITOME, THE MIND). A macro is FUNCTIONS (`tools/veritome/mind/functions.js`), the words of NEURALESE, each exactly
  one of these parts: an action (`brain.direct`), a status (`creatures.apply`), a relation (`c.rel` + `c.relUntil`), a drive pushed
  (`drives.set`), a memory wiped (`mem.wipe(kind)`), or a modifier of the one before (LON longer, DEO deeper). Functions are learned
  from the ledger (a bestiary fact photographed teaches the action: you can only ask a mind for what you have seen a mind do). The
  macro is composed on a 7x5 lattice (`tools/veritome/mind/lattice.js`: shaped pieces routed from the core to the mouth), and how well it is fitted
  is its quality, which scales how long, how deep and how surely it takes (`tools/veritome/mind/macros.js` `runMacro`). A new creature gets every
  Function its mind has the parts for; an action it does not have is refused, and the log says so. A new behaviour that a creature
  shows (and the bestiary can photograph) is a new Function: a row in `FUNCTIONS` with its `learn` test.
- **Allies and decoys**: a creature on their side is `ally` (`src/creatures/spirits.js`: a smoke spirit is a slip jelly's body and mind with the
  kind `spirit` in the relations table: kin to them, rival to the wild jellies, as they are to it); their blows pass through it
  (`creatures.strike`), and the statuses `haste` (its body and mind run faster) and `empower` (its blows land harder) are a rally's. A
  DECOY (`game.ai.decoys`: the Crucibelle's mirage) is anything put up to be seen as what it is not: every Brain's watch list includes
  it, with its `kind` (a Courier of smoke has the kind `courier`), so a mind takes it for that and acts on it with no code of its own;
  `P.veiledT` hides them for a moment.
- **The blade** (`src/tools/sondelass/blade.js`): a creature resists a cut while it is itself (the ward glyph), and comes apart into
  Lachryma under a zandatsu when it is not (`vfx/dissolve.js`).

## 3. The slip jelly, as an example

`src/creatures/jelly/mind.js` is the whole of its mind:

- **Drives**: thirst (it is sand held together by water: it dries as it moves and spends slip; dry, it is pale and matte and its melt
  runs slow), hunger (Lachryma: baubles, cubes, fish, and the Courier's own, drained by a lunge), rest, social, fear, curiosity.
  Traits: bold (also its poise), greedy, lazy, social.
- **Actions**: stunned / asleep / melted / sent home (statuses); fetch, follow (orders); watch, hunt (with its lunge and spit, and a
  call to its kin first); flee; drink, forage, fish, rest, huddle, play, mourn, investigate, go home, wander, idle.
- **Its reactions** (`heard`): a kin's cry or death frightens it and turns it against the culprit (unless the culprit is its own
  kind, or the victim is one it was written to protect), and marks the place; a loud noise close by startles the timid.
- **Its ecology**: the oasis's water, the palms' shade, baubles and cubes to eat (it carries your swallowed money until it bursts),
  fish in the shallows, its kin, its den.

What comes out of it: jellies that drift to the water when they dry, nap in the shade, huddle and play; that notice you, call their
kin, and hunt you when they are hungry or you have hurt one of them; that mourn where one burst and avoid the place after; that steal
your Lachryma; and that, reprogrammed, follow you, fetch for you, or turn on each other.

## 4. Making a new creature

1. **The body** (`src/<kind>/<kind>.js`): spawn its model and collider; the creature contract (`creatures.js`: `type: 'creature'`,
   `kind`, `pos`, `radius`, `height`, `alive`, `hurt`, `knock`, `center`, `head`, `vanish`, `macros`, `poise`, `stunFor`); tag it
   (`hurtable`, `programmable`, `sliceable` as it is); register it (`game.creatures.add`, `game.physics.register`); give it moves the
   mind can ask for, and let it move toward `c.want` each frame. Emit stimuli where it hurts, dies and calls.
2. **The mind** (`src/<kind>/mind.js`): its drive spec and traits, its actions (copy the jelly's living actions and change the
   numbers: most of them are generic), its `mods` and `heard`.
3. **Its place in the ecology**: add its row to the relations table (`creatures/ai/ecology.js`), and offer or provide what it offers others
   (a den, itself as prey).
4. **Wire it**: one `Brain` per individual (`game.ai.add(brain)`), an update in main.js; tracking rules for its events (`tracking.js`);
   its line in the stress test's invariants.

Two things an individual may carry without a new part: its own **leash** and **home radius** (`c.leash`, `c.homeR`, read by the jelly's
mind in place of its kind's: a clutch's guard is held 10 m to its nest, `world/well/nursery.js`), and a **driven** body (`c.driven(dt)`,
`c.squashTo`): a boss whose body is moved by its own pattern instead of a mind (the Great Slip Jelly, `creatures/jelly/greatjelly.js`)
keeps the jelly's body, its hurt, burst and statuses, and stands its mind aside.

## 5. Next

More kinds that meet (a predator of jellies, grazers, birds); the clapperjars moved onto the parts; the hour as a drive modifier; squads
sharing a blackboard; scent trails; dens with a population; memory that outlives a reform.

## 6. Prior art

Dave Mark's utility AI (the Infinite Axis Utility System), The Sims' motives and smart objects, Rain World's relationships, Monster
Hunter's ecology, Halo 2's knowledge model, Thief's and Metal Gear Solid's senses, Reynolds' steering, the blackboard; for the stun and
the reprogramming, Monster Hunter's KO, Sekiro's posture, Fatal Frame, The Typing of the Dead and NieR: Automata's hacking.
