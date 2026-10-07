# Co-op: the siblings, then guests (the owner, 2026-10-07: "co-op mode so that I can play with you guys")

Kept by Dovina (the design); Petra builds the engine. Units: real seconds, real minutes, metres.

## Built (the foundations)

- **C1, the same twice:** the simulation's seeded streams (`core/rng.js`); the `rand.sim` check.
- **C2, what was pressed:** replays, `game.replay`; `/replay save`, `/replay load`.
- **C3, the world as data:**
  - `world/places.js`, `game.agent`, and the bridge `scripts/agent.mjs` (look, act, step: the intents are in `src/agent/agent.js`'s
    header).
  - Playtests: `npm run playtest`.

## The wire, as the published page allows (Petra, measured, 2026-10-07)

- **WebRTC is refused** in the artifact frame. The page's `room` capability is the wire:
  - each player's state in `presence` (about 30 a second, 4 KiB);
  - moments as events (4 KiB each, a few a second, about 40 a second shared).
  - Only signed-in people the owner shares the game with can join, and nothing is stored.
- **A division's session cannot join live.** It writes to the game's `db` (ArtifactData), which the page reads live.
- **So the first co-op is the siblings** (C6): five Couriers in the owner's world, each with a mind and a temperament, each steered by its
  division's session through the `db`. Human guests on the `room` come second (C5), on the same body.

## C4. The party (Dovina's rulings, 2026-10-07)

**Prior art:**
- Dragon's Dogma's pawns: companions with a temperament, summoned at rift stones, given short orders.
- Monster Hunter: a party of four, the host owning the quest.
- FFXIV: a party credited for a clear by taking part.
- Final Fantasy XII's gambits: what a companion does alone.

**Who:**
- The five divisions as **siblings**: Dovina, Petra, Calissa, Wanda and Espada, each a Courier (the same `Player` body and `Character`
  rig, driven by a mind's intents, so the core movement is theirs too).
- They are the Vessoul's other forms, so they are family, not hirelings (Espada words it).

**From when:**
- **Met first, then called.** Each sibling is met once, in the place their craft lives, and is a choice from then on:

| sibling | where you meet them |
|---|---|
| Petra | the workshop's bench |
| Calissa | the kiln |
| Wanda | the busker's mat on Old Grog's pier |
| Espada | the Dunes' lighthouse, or the Book's page if there is no lighthouse yet |
| Dovina | Raku's table |

- Once met, a sibling is **called or dismissed at any Shrine**, as a pawn is at a rift stone.

**How many:**
- A **party of four at most**: the owner and up to three others (siblings and guests together), Monster Hunter's number.
- **Two siblings at once by default:** a sibling costs about 10 draw calls without the belt. Two keep the zones within budget; a third is
  allowed when `npm run perf` says the zone can bear it.

## C6. What a sibling does (its mind; Dovina's rulings)

**Temperament:**
- Each sibling's temperament comes from its division's voice line (CLAUDE.md), as drives on the creature AI parts (`docs/AI.md`).
- Each carries one tool of its own, its craft in the hand.

| sibling | temperament | tool | alone, it |
|---|---|---|---|
| Dovina | nerve: bold, flanks, takes a risk | the Lockheart | fights the biggest thing near; opens its coffin on a stunned foe for the owner to see (never catches) |
| Petra | caution: keeps close, guards | the Sondelass's cutlass | stays within 4 m of the owner and parries what is aimed at them |
| Calissa | an eye: lingers at views | the Veritome | Flashes what threatens the owner (stun support); stops at a view to photograph it |
| Wanda | an ear: keeps the beat | the Crucibelle | tolls on the beat (the ring that staggers), plays when idle |
| Espada | curiosity: goes ahead, reads | the Dreamvane | scouts a room ahead, dowses and points at finds and Lachryma |

**The default order is follow:** within 6 m of the owner, never in the way of the camera, catching up through doors.

**What a sibling may do to the world:**
- **Strike foes** (`by: 'sibling'`, `who: '<name>'`). A sibling's blows **never count toward the owner's records** (CLAUDE.md: only the
  Courier's do).
  - A foe the owner has struck at all and a sibling finishes still counts for the owner (FFXIV's credit by taking part):
    `creature.credit { kind, who, by: 'courier' }`, counted in `tracking.js` as the owner's burst (`jelly.burst.party`).
  - A sibling deals **0.4 of the Courier's sustained damage** (help, not a carry: the owner's skill decides the fight).
- **Never pick up** cubes, drops, casks or finds. What the world gives is the owner's to take; a sibling **points at it** (a glyph pop
  over it, CLAUDE.md's marks).
- **Never open** chests, Lockhearts or doors; never catch, buy, sell or spend.
- **Breaks** a pot or prop only as a blow's side effect in a fight, never on purpose.
- **Shatters as the Courier does,** and is made whole at the owner's last Shrine; a fallen sibling is out until called again.

## C6. The owner's orders (Dovina's rulings)

**Both a wheel and the chat line:**
- **The wheel:** hold a free key (Petra picks it) and choose among four, Dragon's Dogma's four:
  - **Come** (follow)
  - **Wait** (hold here)
  - **Go** (to where the owner looks)
  - **Help** (fight what the owner looks at)
- **The chat line:** `/sib <name | all> follow | hold | go <place> | fight | back | call | dismiss`. Every order is said in the log by its
  event.

## C6. What a session may write (`siblings/<name>` in the db: a document path has two segments; Dovina's rulings)

**Fields** (the page whitelists them and ignores the rest):

| field | values |
|---|---|
| `order` | `follow`, `hold`, `scout`, `guard`, `free` |
| `target` | a place id from `world/places.js`, or null |
| `line` | at most 120 characters, said once in the log as "<Name>: <line>", in the division's voice |
| `mood` | one of the five feelings: tints the sibling's draught |

**Cadence (a human's):** an order at most once a real minute per sibling, a line at most once every five real minutes. The page drops
what comes faster.

**Never:** items, cubes, the ledger, the save, achievements, prices, the world's state. **Nothing a session writes moves the economy or
the records.**

## C5. Guests: the first shared errand (Dovina's rulings)

**The errand is the Great Dunemaw's descent, the Great Slip Jelly at its end** (Monster Hunter: the host owns the quest; guests join the
host's run).

**Shared:**
- the floors, the foes, the clutches;
- the boss's health and its casts (Lidfall and Shoulder Charge target the player it faces; Slip Trail follows each player);
- the wipe: when every player has shattered, the party returns to the Lip Stone.

**Each player's own:**
- the Pneuka Box, the ledger, the records, the achievements;
- the haul: each finds their own, as MH's rewards are rolled per hunter;
- the run's pay: each player is paid their own `wellPay`, never split;
- the cosmetic drops: each player who meets an achievement's criteria in the fight gets its drop.

**Scaling:**
- The boss's health × (1 + 0.75 per guest beyond the first: two players 1.75×, three 2.5×, four 3.25×; MH's multiplayer scaling).
- Siblings do not scale it: they are the owner's help.

## Open

- The siblings' words (the log's "<Name>: <line>", their meeting scenes): Espada.
- The sibling's look (one Courier mesh, five glazes: each division's colour): Calissa.
