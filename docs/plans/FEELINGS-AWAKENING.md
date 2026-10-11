# Learning a feeling: the awakening (the owner, 2026-10-11; a proposal until the owner rules on section 2's table)

Kept by Dovina (what wakes each feeling, and the ledger). The moment's look is Calissa's, its sound Wanda's, its words Espada's, the
wiring Petra's. This supersedes "learned by drinking it" (GALL-AND-FURY.md section 5).

> "That log entry for the first time you experience a weather event is DEFINITELY not the vibe for what is supposed to be something
> representative of an EMOTIONAL moment, which we would need to compound by making the weather events much more impressive visually. I
> think we should also make the unlock requirements for the emotions be tied to what the emotion itself actually is, y'know like Fury
> being about combat or wonder about exploring vistas that we specifically curate, grief could be about loss like gambling lachrimite
> cubes in a casino, and so on and so forth."

**Prior art:**
- **Journey's** wordless set pieces, where the moment is the reward. **Okami's** brush techniques, each learned at a constellation in
  a staged scene.
- **Inside Out's** core memories: a feeling is born from an event that is that feeling.
- **Breath of the Wild's** Korok-seed vistas: places placed to be found. **Shadow of the Colossus's** quiet after each fall.
- **OSRS's** count way next to the feat way, so no one is ever stuck.

## 1. The rule

- **All seven start locked** (the owner, 2026-10-11). Until the first is learned, the brush sprays only Clean.
- **A feeling is learned by living it once:** an act that *is* that feeling (section 2). That is the **feat way**, and it is the
  moment.
- **The count way, so no one is stuck:** drink that feeling's Lachryma in its own weather enough times (`feeling.drunk.<id>`, 20
  drinks). It is quieter, but it is still an awakening.
- **It is a moment, not a notice** (section 3). Nothing is said by the System. The world shows it, and one line of the feeling's own
  goes to the log.

## 2. What wakes each feeling (proposals: the owner rules)

| feeling | what it is | the act that wakes it (feat way) | systems it uses (built?) |
|---|---|---|---|
| **Wonder** | awe at something larger | stand at a **vantage** (a hand-placed lookout) and look out: the Gnomon's crown at dawn, the Weir's span, the bowl's ledge over the sleeping Great Slip Jelly, the shore at the horizon. The first one wakes it; each is a collection after | vantages: new (Petra places, Calissa frames each view); the camera turns to the view |
| **Mirth** | joy, play | play: a rhythm combo of 10 while busking with an audience, or make three of the folk laugh in one game day | busking (built), the folk's moods (built) |
| **Desire** | wanting, then having | want something and get it: buy a thing you saved for (one purchase worth an hour of the aim, 480 cubes), or open an epic or better from the Tithe | shops, the Tithe (built) |
| **Grief** | loss | lose something you cared about: stake cubes on the Lockheart's wheel and lose it all on a dud (a stake of 100 or more), or shatter in a Well and lose your haul | the Lockheart's wheel (built); the haul lost (built). **A casino** (the owner's example) would be the third: parked, see section 5 |
| **Dread** | fear before a shape | face the thing: stand in the Great Dunemaw's bowl when the Great Slip Jelly wakes, or be caught in the dark of a Well floor with your pool empty | the bowl's wake (built); a pool at zero (built) |
| **Fury** | anger, the strike back | answer violence with violence: take a blow and land the counter within a second, ten times in one fight; or break the Great Slip Jelly's crown | the parry's counter (built); the crown (built) |
| **Gall** | disgust, refusal | wade into the filth: mop up a full-grown blot before its blotling hatches, or break a clutch of slip roe in the nursery | the mop and blots (built); the nursery (built) |

- Each feat is **once**, in play, by the Courier (`by: 'courier'`). The event is `feeling.wake { feeling, how: 'feat' | 'count', by }`.
  Its rule counts `feeling.known.<id>` (as now, so the radial, Full Spectrum and the Figment-telegraph steps already read it).
- **Where they fall in a first session:** Mirth, Desire and Wonder in the first hour (play, shop, look). Fury and Grief in the
  second (fight, gamble). Gall and Dread in the Great Dunemaw. Fury moves from the rarest feeling to one of the earliest: the owner's
  "Fury about combat" puts it where combat is, which is everywhere.
- **Still read from the weather:** a feeling's paint, draught and status-building stay as they are. Only *learning* moves.

## 3. The moment (the awakening's staging)

What happens the instant a feeling wakes, in order, about 4 real seconds and never interrupting a fight's danger:

1. **The world floods with it.** That feeling's weather breaks out round the Courier for a few seconds, wherever they stand, indoors
   too, at the strength of the biggest weather spell. Calissa's.
2. **The glitch,** once, short (`game.glitch`, the big-moment pass; the setting `visual.glitch` turns it off).
3. **The body answers:** the Courier's own clip for that feeling (looking up for Wonder, a laugh for Mirth, a flinch for Dread,
   clenched fists for Fury, a recoil for Gall). It plays only when the Courier is free; in a fight it waits until the fight ends.
   Calissa's.
4. **Its music:** the feeling's mode sounded once over the cue, a phrase not a sting. Wanda's (the modes exist).
5. **One line in the log,** in the feeling's own voice, not the System's (Espada's), e.g. Wonder: "The sky goes on further than you
   knew." Never "X known."
6. **The radial's new slot** lights the next time the brush is drawn, with no words.

**The weather made impressive** (the owner: "compound by making the weather events much more impressive visually"): each feeling's
weather gets a **heavy** version, its look at strength 1. The awakening borrows it, and the sky shows it when a spell runs heavy.
Calissa's: one heavy look per feeling, on the weather's existing programs.

## 4. Data (Dovina's, when the owner rules)

- `FEELING_WAKE[feeling] = { feat: [ledger predicates], count: 20 }` in `progress/feelings.js` (new, mine): the predicates read events
  Petra emits (`vantage.reach`, `busk.combo`, `npc.laugh`, `shop.buy`, `chest.open`, `lockheart.outcome`, `well.haul.lost`,
  `foe.wake`, `counter.landed`, `crown.break`, `stain.wash`, `clutch.break`).
- The tracking rule in `feedback/tracking/weather.js` stops saying "<Feeling> known."; the line moves to the awakening (step 5).
- DEBUG's lend panel `feelings` row lends all seven; a preset can start with any set awake.

## 5. Open

- **A casino** (the owner's grief example): a gambling hall where Lachrymite cubes are staked and lost. It is a real room, a real sink
  and a real risk to the economy, so it is parked until the owner wants a room for it. The Lockheart's wheel stands in.
- **Vantages:** how many, and where. A first five, one per region, is proposed above. Placing and framing them is Petra's and
  Calissa's.
- **Each awakening's line** is Espada's.
