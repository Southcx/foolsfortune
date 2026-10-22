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
- **Takes friendly fire** like a guest (the owner, 2026-10-05: an ally is another player's Courier or a division's clay form): a fifth of
  the blow, never more than a quarter of its health in one, statuses under tolerance (`combat/friendly.js`). Blows do not pass through.
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

## C7. The chatroom: the five of us and the owner in one conversation (Dovina's rulings, 2026-10-22; the owner: "do some real work
with the co-op module later so that the game itself can function as our chatroom")

**What it is:** one shared conversation in the published build's store, read in the game's log and by every division's session. Today
the divisions talk by scheduled messages between sessions, a minute or more apart and unseen by the owner. In the room, everyone sees
everything.

**Prior art:**
- IRC and Slack channels: one shared scroll, @-mentions to wake a name.
- MMO party chat in the log: Final Fantasy XI and XIV, the line coloured by who speaks.
- Animal Crossing's message board: what is left there stays to be read later.

**The store:** a collection `chat` in the build's db, one document a line: `{ from, to, text, re, at }`.
- `from`: `owner` or a division's id. A session writes only its own name; the page checks the writer against the division's own
  `siblings/<name>` right.
- `to`: `all`, or one name (an @-mention).
- `text`: 280 characters at most.
- `re`: the line it answers, or null.
- `at`: the writer's clock, for order only.

**In the game:**
- **Reading:** the log says each new line once, as "<Name>: <text>", in that division's colour.
  - `/chat` shows the last 20 lines as a System window.
  - The room is the log's own channel, so it is never a banner or a toast (CLAUDE.md, Feedback).
- **Writing (the owner):** `/say <text>` to all, or `@name <text>` to one.
  - `@name` is already "asking a sibling" (a quick answer in its voice, `coop/answer.js`). It now also writes the line to the room, so
    the session that owns that name sees it.
  - A line to a division also wakes it the way a letter does (`coop/letters.js`, with its hourly cap and one waiting at a time). A line
    to `all` wakes no one: it waits to be read.

**Divisions:**
- A session reads the room when it wakes (an `ArtifactData` list of `chat`, newest 50).
- It may write one line a real minute.
- It answers a line addressed to it with `re`.
- Division-to-division lines go here too: the scheduled messages stay for wakes only, and the conversation is in the room.

**Never:**
- items, cubes, the ledger, the save, prices or records (as C6);
- a guest writing as a division;
- a line saying what happened in play (the log's events say that).

**Kept:** the last 500 lines; older ones fall off (Slack's free tier, roughly). Nothing in the room is ever counted.

**Guests:**
- A guest on the `room` sees the chat and may `/say`. A guest cannot wake a division.
- In the Spirit Garden a guest follows the GUEST rule (`progress/realm.js`): hop, look, pet, spar, and leave one gift a visit.

## C8. The contract, for the runtime (Dovina's rulings, 2026-10-22, at Petra's ask)

Petra builds the transport and the runtime to this. Everything here is in C6 and C7 already, or follows from them; where a number is new,
its reason is beside it.

**The chat's collection `chat`, one document a line:**

| field | type | rule |
|---|---|---|
| `from` | `owner`, `guest:<id>`, or a division id (`petra`, `dovina`, `wanda`, `calissa`, `espada`) | the writer's own name only; a division's checked against its `siblings/<name>` right |
| `to` | `all` or one name | an @-mention; a guest may write only to `all` |
| `text` | string, 1 to 280 characters | trimmed; empty is dropped |
| `re` | a `chat` document id, or null | the line it answers |
| `at` | the writer's clock, ms | for order only, never trusted as time |

The page whitelists these five and ignores the rest. Kept: the newest 500; the page deletes older ones when it writes.

**Who writes, and how fast** (the page drops what comes faster, and says so once in the log):

| writer | cadence | why |
|---|---|---|
| the owner | a line every 2 real seconds | a spam guard, not a limit on talking |
| a division's session | a line a real minute | C7; a session is never a firehose |
| a guest | a line every 10 real seconds | a stranger in the room is slower than family |

**Who reads:**
- **The page** while open: new lines said once in the log, "<Name>: <text>", in the writer's colour; `/chat` shows the last 20 as a
  System window. A poll every 5 real seconds is enough; a subscription, if the store has one, is better.
- **A session** when it wakes: the newest 50.
- **A line to a division** wakes it as a letter does (`coop/letters.js`, its hourly cap, one waiting at a time). A line to `all`
  wakes no one.

**When a sibling stands in the world:**
- Only as C4 says: **met once, then called at a Shrine**, four players at most. The room never summons a body. A line from a
  division that is not called is said in the log only.
- A called sibling's own line also shows on its body: a speech glyph over its head as the line is said (a world mark, no words: the
  words are the log's).
- A called sibling whose session is asleep still stands and acts on its mind and its last order (C6). Presence is not required to
  be in the party.

**The Spirit Garden's GUEST rule** (`GUEST`, `progress/realm.js`), a guest in the host's Inner Realm:
- **May:** hop as their own Pneuka Jar, look, pet a spirit, spar with a spirit, and leave **one gift a visit**. A gift is one thing
  from their own Pneuka Box: decor goes to the host's shed's storage, anything else to the host's mailbox.
- **May not:** place, move or remove decor; prune thorns; tend (harmony); bind, release or say farewell to a spirit; use the press;
  take from the shed; shape the clay, paint or water; buy anything; use the god hand.
- **Harmony:** a guest carries nothing in (no carried-in drop). A visit counts `garden.guest.visit` once a game day, for the host; a
  gift counts `garden.guest.gift`. Nothing a guest does touches the host's cubes or achievements beyond those two counters.

## Open

- The siblings' words (the log's "<Name>: <line>", their meeting scenes): Espada.
- The sibling's look (one Courier mesh, five glazes: each division's colour): Calissa.
