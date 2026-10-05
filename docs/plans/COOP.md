# Co-op and AI players: the plan

Petra's, R58 (the owner, 2026-10-05: "make the game as navigable as possible for AI entities ... there's no way I can playtest
everything on my own"; and co-op with the five divisions). One plan, because the two want the same foundations: a simulation that does
the same thing twice, a record of what was pressed, a way to see the world as data, and more than one player in it.

## What is true today

- The simulation steps at a fixed 1/60 s (`tick(dt)`), and in manual mode (the stress test, the probes) it steps only when told: an
  agent can look, think and act between steps, at its own pace. This is the seam everything below uses.
- 363 `Math.random` calls in 88 modules and 59 reads of the wall clock. A stress seed run twice does not run the same, so a failure
  found once cannot be found again (the ladder and kiln runs, R57). Nothing below works until this does.
- One Courier: `game.player`, assumed in perhaps a hundred places. Events carry `by` (`courier`, `creature`...), never which player.
- The save (v69) already splits `player` from `world`: what follows a player, and what the host owns.

## The phases

Each phase pays for itself before the next one starts.

### C1. The same twice (determinism)

- `game.rand`: the simulation's own seeded stream (`core/rng.js`), seeded per session (and by the stress test per run). Streams split by
  domain (`rand.stream('creatures')`) so one system drawing more does not shift every other.
- Cosmetic randomness (particles, sound variation, the title) stays free: it changes nothing that is kept or decided. The check gets a
  rule, `rand.sim`: `Math.random` in a simulation domain (creatures, courier, world, tools, progress, npc) is debt; the cosmetic domains
  (vfx, audio, music, ui, title, render) are exempt. Today's uses are baselined and paid down module by module.
- The simulation's time is the game clock (`game.time`), never `performance.now()` or `Date.now()` (the calendar's day is the one
  exception, and it is an input: a run records the day it played).
- **Done when:** a stress seed run twice gives the same violations and the same event counts.

### C2. What was pressed (replay)

- The input recorder: each tick's input frame (keys down and pressed, the look, the mouse buttons), as a compact delta.
- A replay is the save's export, the seed, the build and the input frames. `F4` (the diagnostics report) writes one; `/replay` plays one.
- **Done when:** a recorded session replays to the same final state (the Courier's position, the ledger), and the owner can send a
  replay file instead of describing a bug.

### C3. The world as data (the agent interface)

- **Places** (`world/places.js`): every room and landmark by name and position (the trailer's places, the course's rooms, the folk, the
  Well's mouth, the pier), one registry the trailer, the room index, the map and the agents all read.
- **`game.agent`**: `observe()` gives the state as data: the Courier (where, how fast, what tech, health, Lachryma, cubes), what is near
  (each thing with its id, kind, tags, position, state), what can be interacted with, the log's lines and the events since the last look.
  `act(cmd)` takes intents: `goto(place | position)` (steered, using the creatures' steering), `face`, `press`, `hold`, `use(tool)`,
  `interact`, `wait(ticks)`. Intents, not key presses, so an agent does not need hands; key presses still work for the precise ones.
- **The bridge** (`scripts/agent.mjs`): the game headless, driven over JSON lines (observe, act, step N). A division's session plays by
  calling it, a turn at a time: the world waits for it.
- **Playtests** (`scripts/playtest/*.mjs`): scenarios with goals and checks ("down the Well, clear a floor, come up: pay > 0, the haul in
  the box"), run like the stress test. The stress test fuzzes; a playtest plays.
- **Status (v70):** places, `game.agent` and the first playtest (`npm run playtest -- well`: down the Well, every floor cleared, back up,
  paid, the haul home; 8/8 on seeds 1 to 3) are in. Its first finds: jellies flew through walls in the air and climbed onto the roof.
  The bridge is next.
- **Done when:** an agent with no knowledge of the code can be told "go down the Well and come back with something" and do it, and a
  playtest for each slice step (E1 to E5) runs in the gate.

### C4. More than one Courier

- `game.players` (the local one first); `game.player` becomes "the local player" and the places that mean "any player" (a creature's
  foe, a lure's caster, a chest's opener) ask the list. Events carry `who` beside `by`.
- Every shared thing gets a stable id (creatures have one; ground items, chests, Wells' runs, crystals get them).
- The save's `player` sections are per player.

### C5. The wire (co-op)

- Host-authoritative, peer to peer (WebRTC data channels; a tiny signalling step, a shared code). The host runs the world; the others
  send their input frames (C2) and receive snapshots and events (the bus is already the event stream), with interest by zone.
- Prior art: Quake 3's snapshot model, Valve's lag compensation for the hits, Overwatch's input buffering, Monster Hunter's
  host-owns-the-quest model for a small party.

### C6. The siblings in the world

- A sibling is a Courier with an AI mind (the creature AI parts: `docs/AI.md`) and a temperament from its division's voice line
  (Dovina's gambler's nerve, Calissa's eye for a view, Wanda's ear, Espada's curiosity, Petra's caution), an ally.
- Its session can steer it through the bridge (C3) between its own beats: "follow", "hold here", "take the left room".

## Order

C1 and C2 first (they pay at once: every bug reproducible), C3 next (the playtests), then E4 (the Emocean hop), then C4 to C6.
