# Emotional weather and the day (the owner, 2026-10-05)

Kept by Dovina. **Built:** the rules and state `src/progress/weather.js` (`game.weather`: climate, spells, forecast, the day's phase,
the effects), the log's rules `feedback/tracking/weather.js`, THE SKY achievements, the market's supply, the Wells' refill
(`fillHours`), the Emocean stage (`stageWx`), the sky and light (`vfx/weather.js`, `render/daylight.js`), the Dreamvane's meter.
`node scripts/combat.mjs` prints each island's weather over ten real hours.

The owner's ask (2026-10-05): a day and night, and **emotional weather**, five categories, highly resonant with the existing systems.
**Weather is an island's mood, falling as Lachryma**: the five aspects (mirth, wonder, desire, grief, dread) are the five weathers,
plus **calm**. Prior art: Pokemon, FFXI, Breath of the Wild, Stardew Valley, FFXIV, Persona 4, Majora's Mask, Wind Waker.

| Weather | Law-Chaos | Feeds (status) | Placeholder look (Calissa's) |
|---|---|---|---|
| **Mirth** | -2 (Law) | Impact (stun) | a sunshower |
| **Wonder** | -1 | Ego (doubt) | an aurora, a held-breath stillness |
| **Desire** | 0 | Influence (charm) | a sirocco, sand lifting off the dunes |
| **Grief** | +1 | Illusion (blind) | rain: steady, grey, long |
| **Dread** | +2 (Chaos) | Delirium (confusion) | fog, thunder far off (no lightning flashes: nothing flickers) |

Each sits where its crude grade sits on the islands' Law-Chaos line (Margarite mirth and wonder, Anagami the middle three, Entropolis
grief and dread) and feeds the damage type at that place.

## The rule and the numbers

- **Weather changes what pays and what is easy; it never does a skill for the player.**
- Its damage type builds its status up to **x1.5** at full strength; it sways every creature's mental state (mirth toward Stoic, dread
  toward Prismatic).
- Where an aspect falls, its crude is plentiful and cheap (the market's strongest link: a trader who knows the weather hauls it).
- A spell lasts **2 to 8 game hours** (5 to 20 real minutes) with a strength; moods move to their neighbours more often than they leap,
  with calm between. Seeded by place and game hour: the same for every player and every replay, so knowable ahead; how far ahead is
  a Divination widening (`divination.forecast`).
- One game day is one real hour (DESIGN.md section 17): night, dawn, day, dusk. At night Lachryma glows (signatures read further) and
  the slip jellies are about.
- Weather is asked by **place**, never by where the Courier stands; exposure: open, roofed (the mood without the rain), deep (a Well's
  own mood).

## Events

- `weather.now` / `weather.change { island, exposure, aspect, strength, second, agate, by: 'environment' }`
- `day.phase { phase, by: 'environment' }`
- `sky.read { island, now, blocks, by }` (the Dreamvane's forecast)

## Open

- Readers not yet wired (Petra's): `buildMult` and `mindDrift` in the creatures, `fishPull` in the bite (and the Fish Guide's weather
  column), `signatureMult` at night.
- A rare weather (a dread fog over Margarite, the hidden achievement sk4) counting toward Luck.
- Later, not now: the player's acts sway an island's mood (a busker's mirth, a massacre's dread).
- Wanda: how each weather sounds and whether the music follows the mood. Espada: whose mood it is, and the names.
