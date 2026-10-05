# Emotional weather and the day (the owner, 2026-10-05)

Kept by Dovina. **Status (R58): the rules are in** (`src/progress/weather.js`, `game.weather`; tracking/weather.js; THE SKY achievements;
the market's supply wired; `node scripts/combat.mjs` prints each island's weather over ten real hours). The places, the look and the
sound wait on the divisions' input and their rounds.

The owner's ask: a day and night, and a weather system of **emotional weather**, five categories, **highly resonant with
the existing systems**, with its mechanical implications thought through. Draft for the divisions' input (Calissa: the sky and the
weathers' look; Wanda: their sound and the music; Espada: their names and what they mean; Petra: the places that read them).

## The idea in one line

Lachryma is everything, and the islands are minds. **Weather is an island's mood, falling as Lachryma**: the five aspects of feeling
the game already has (mirth, wonder, hunger, grief, dread: the fish answer to them, the crude is graded by them) are the five weathers.

## Why it resonates: the game already has five of everything

| Weather (aspect) | Law-Chaos | Damage type it feeds | Its status | Crude grade | Placeholder look (Calissa's) |
|---|---|---|---|---|---|
| **Mirth** | -2 (Law) | Impact | stun | mirth | a sunshower: bright rain through warm light |
| **Wonder** | -1 | Ego | doubt | wonder | an aurora: slow prismatic curtains, a held-breath stillness |
| **Hunger** | 0 | Influence | charm | hunger | a sirocco: a hot dry wind, sand lifting off the dunes |
| **Grief** | +1 | Illusion | blind | grief | rain: steady, grey, long |
| **Dread** | +2 (Chaos) | Delirium | confusion | dread | fog, with thunder far off (no lightning flashes: CLAUDE.md, nothing flickers) |

Each aspect sits where its crude grade sits on the islands' Law-Chaos line (Margarite yields mirth and wonder; Entropolis grief and
dread), and each feeds the damage type at that place on the line. Plus **calm** (no weather): the mind at rest.

## What weather does (the mechanical implications)

The rule, as for every number in the game: **weather changes what pays and what is easy; it never does a skill for the player.**

1. **Combat.** The weather's damage type builds its status faster (x1.5 at full strength): grief rain makes Illusion blind sooner.
   And it sways every creature's **mental state**: mirth calms minds toward Stoic, dread unsettles them toward Prismatic. A fight in a
   dread fog is a different fight.
2. **Angling.** The fish answer to aspects (`species.js`, `aff`); in a weather, the species drawn to its aspect bite more (Stardew's
   rain fish, FFXIV's weather-and-time windows). The Fish Guide gains a weather column.
3. **The market (the strongest link).** Weather is Lachryma falling: **where an aspect rains, its crude is plentiful and cheap**, and
   it is dear where it does not. A grief rain on Anagami makes grief casks cheap at Grog's pier; a trader who knows the weather hauls
   them where it is dry. The Emocean trade reads the sky.
4. **Divination: the forecast.** The weather is seeded (the same for everyone, and for a replay), so it can be known in advance. How
   far ahead the Courier knows it is a Divination widening (`divination.forecast`): skill buys knowledge, as the reckoning does.
5. **The Emocean.** A stage sailed in weather: dread and grief shorten how far ahead the reckoning marks the lanes (fog and rain hide
   the sea); dread raises the route's danger, mirth lowers it.
6. **The Wells.** A Well is a mind ruminating: in grief and dread it refills faster (the mood feeds it), in mirth slower.
7. **The day and night.** One game day is one real hour (DESIGN.md section 17): dawn, day, dusk and night. At night, Lachryma glows:
   signatures read further (the Dreamvane's dowsing), and the slip jellies are about. The weather and the hour combine (a grief rain at
   night is the darkest hour).
8. **Luck.** A rare weather (a dread fog over Margarite, the King's island) is surprise lived through: it counts toward Luck.
9. **The ledger.** Every weather seen, fish caught in each, a status built in its own weather: achievements, retroactive as ever.

## How weather moves

- Each island has a **climate**: how often each aspect falls there, from its place on the line (Margarite mostly mirth and wonder,
  Anagami the middle three, Entropolis grief and dread).
- A **spell** of weather lasts 2 to 8 game hours (5 to 20 real minutes), with a strength (a drizzle, a downpour). Moods move to their
  neighbours more often than they leap (mirth to wonder more than mirth to dread), and calm comes between.
- Seeded by the island and the game hour: deterministic, so the same for every player, the same in a replay, and knowable ahead.
- Later (not now): the player's acts sway an island's mood (a busker's mirth, a massacre's dread).

## Who does what

- **Dovina (now):** the rules and the state (`src/progress/weather.js`, `game.weather`): the climate, the spells, the forecast, the
  day's phase, the effects table, and the effects on my own systems (the market's prices, the Wells' fill rule, the forecast
  widening); the ledger and achievements; the events (`weather.change`, `day.phase`).
- **Petra:** reading it where the places and creatures are (the mental-state sway and the build-up in `creatures.strike`, the fish
  bite, the Dunemaw's fill, the stage's danger and lane marks, the night's signatures), and the day's light on the scene.
- **Calissa:** how each weather and each hour looks (the sky by the hour, rain, aurora, sirocco, fog), within the rule: nothing
  flickers across the screen.
- **Wanda:** how each sounds (rain on clay, the sirocco's hiss, thunder far off) and whether the music follows the mood.
- **Espada:** the weathers' names and what they mean in the lore (whose mood is it?), and the log's lines.
