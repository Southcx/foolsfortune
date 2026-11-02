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

- **The weather's readers, back** (South, 2026-10-29: "bring back the weather effects"; numbers `ECON.weather.mood`, `bite`, `sense`; rules
  in `progress/weather.js`, each to be read by its owner's module):
  - `moodRest(pos)`: the weather moves where a creature's mind rests (states at full strength: mirth -0.5, wonder -0.2, desire 0, grief
    +0.25, dread +0.5, gall +0.4, fury +0.6; + toward Prismatic). The mind drifts there at its own settle (0.05 states a real second),
    so a creature caught in the hail grows wild and calms again under the fox's wedding. Read in `creatures.js`'s settle (Petra's).
  - `biteMult(aspect, pos)`: a fish of the weather's feeling bites 1 + strength times as keenly (its interest in a lure, `fish.js`).
  - `senseMult(pos)`: every signature heard 1.5 times as far at night and in a Well's dark (`signatures.js` range: the Dreamvane's
    dowse, the Lockheart's drink, the Reveal song).
  - `buildMult` in the creatures (a damage type's build-up in its weather), as before.
- A rare weather (a dread fog over Margarite, hidden achievement sk4) counting toward Luck.
- Later, not now: the player's acts sway an island's mood. Wanda: each weather's sound; Espada: whose mood it is, the names.


## Rulings carried from DESIGN.md (sections 18 and 19)

Moved verbatim from `docs/DESIGN.md` by G56 (2026-11-02); the numbered heading stays there as a pointer.

The other bullets of section 19 are in `docs/plans/ENDGAME.md`, `docs/plans/DUNES.md` and `docs/plans/WHEEL.md`.

### Section 18: emotional weather (the owner, 2026-10-05)

An island's mood falling as Lachryma: mirth, wonder, desire, grief, dread, and calm. Each feeds its damage type, sways mental states,
draws its fish, makes its crude cheap where it falls, changes the Emocean's danger and the reckoning's reach, and feeds a ruminating
Well. A pure function of the island and the game hour (same for everyone, replayable, forecastable by Divination). Margarite leans to
mirth, Entropolis to dread; a dread fog over the King's island (under 1% of game hours) is a hidden achievement. It changes what pays,
never a skill.

*(Extended: the five aspects are seven since Gall and Fury were built, `docs/plans/GALL-AND-FURY.md`; the seven feelings are in the glossary.)*

### Section 19: rulings of 2026-10-05, the weather round

- **Shown order: Wonder, Mirth, Desire, Grief, Dread** (`DISPLAY_ORDER`); the Law-Chaos order (mirth to dread) is the systems' only.
  *(Superseded by the seven feelings' shown order, most positive to most negative: Wonder, Mirth, Desire, Fury, Gall, Grief, Dread; `docs/plans/GALL-AND-FURY.md` and the glossary.)*
- **Weather is asked by place** with an exposure (open, roofed, deep); the open Emocean has no mood.
- **Hunger is renamed Desire**: neutral, Influence's. *Hunger* is a folk word now. Its crude: crude desire.
- **The Crucibelle's notes follow the weather** (Wanda's five scales): approved.
