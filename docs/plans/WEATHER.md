# Emotional weather and the day (the owner, 2026-10-05)

Kept by Dovina. **Built:** `src/progress/weather.js` (`game.weather`: climate, spells, forecast, the day's phase, the effects; its
header holds the design), `feedback/tracking/weather.js`, THE SKY achievements, the market's supply, the Wells' refill, the Emocean
stage, the sky and light, the Dreamvane's meter. `node scripts/combat.mjs` prints each island's weather over ten real hours.

The owner's ask (2026-10-05): a day and night, and **emotional weather**, five categories, highly resonant with the existing systems.
**Weather is an island's mood, falling as Lachryma**: the five aspects are the five weathers, plus **calm**.

| Weather | Law-Chaos | Feeds (status) | Placeholder look (Calissa's) |
|---|---|---|---|
| **Mirth** | -2 (Law) | Impact (stun) | a sunshower |
| **Wonder** | -1 | Ego (doubt) | an aurora, a held-breath stillness |
| **Desire** | 0 | Influence (charm) | a sirocco, sand lifting off the dunes |
| **Grief** | +1 | Illusion (blind) | rain: steady, grey, long |
| **Dread** | +2 (Chaos) | Delirium (confusion) | fog, thunder far off (no lightning flashes: nothing flickers) |

## The rule and the numbers

- **Weather changes what pays and what is easy; it never does a skill for the player.**
- Its damage type builds its status up to **x1.5** at full strength; it sways creatures' mental state (mirth toward Stoic, dread
  toward Prismatic). Where an aspect falls, its crude is plentiful and cheap.
- A spell lasts **2 to 8 game hours** (5 to 20 real minutes); moods move to neighbours more often than they leap, with calm between.
  Seeded by place and game hour: the same for every player and replay, so knowable ahead (how far: `divination.forecast`).
- One game day is one real hour (DESIGN.md section 17). Weather is asked by **place**, never by where the Courier stands.

**Events:** `weather.now` / `weather.change { island, exposure, aspect, strength, second, agate, by: 'environment' }`;
`day.phase { phase, by: 'environment' }`; `sky.read { island, now, blocks, by }` (the Dreamvane's forecast).

## Open

- Readers not yet wired (Petra's): `buildMult` and `mindDrift` in the creatures, `fishPull` in the bite (and the Fish Guide's weather
  column), `signatureMult` at night.
- A rare weather (a dread fog over Margarite, hidden achievement sk4) counting toward Luck.
- Later, not now: the player's acts sway an island's mood. Wanda: each weather's sound; Espada: whose mood it is, the names.
