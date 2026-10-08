# Feelings and weather

Lachryma comes in five feelings: Wonder, Mirth, Desire, Grief and Dread. The sky over a place falls as one of them, and that weather
changes your fights, your fishing and the price of crude. The game also keeps a clock. Learn both and you can choose when and where to
work.

## The five feelings

The game always shows them from most positive to most negative.

| Feeling | Colour | Damage type it feeds | Status | Weather name |
| --- | --- | --- | --- | --- |
| **Wonder** | cyan | Ego | Doubt | the aurora |
| **Mirth** | gold | Impact | Stun | the fox's wedding |
| **Desire** | orange | Influence | Charm | the wanting wind |
| **Grief** | blue | Illusion | Blind | the long rain |
| **Dread** | dark green | Delirium | Confusion | the pall |

When there is no weather, the log says "fair" (a calm sky).

Colour is never the only sign. Each feeling also has its own name and look. Faith, Gall and Fury are planned, for other places. They
are not built yet.

## Two feelings at once: agates

A place can have an undercurrent, a second mood. When it runs strong and differs from the first, the sky shows an **agate**: the
stronger feeling is what happens, the weaker one is its colour. You never see three.

| Agate | Made of |
| --- | --- |
| delight | Mirth and Wonder |
| hope | Mirth and Desire |
| guilt | Mirth and Dread |
| disappointment | Wonder and Grief |
| awe | Wonder and Dread |
| longing | Desire and Grief |
| worry | Desire and Dread |
| despair | Grief and Dread |

Opposites do not make an agate. Mirth and Grief cancel, and so do Wonder and Desire. When one cancels, the main weather gets weaker
instead.

## The weather

Weather belongs to a **place**, not to where you stand. The place is an island or a Well. Anagami Island has weather. The open sea
has none. The Great Dunemaw has its own mood, leaning to grief.

| Where you are | What you get |
| --- | --- |
| Outdoors (the Dunes, the shore) | everything: the look and the effects |
| Indoors (workshop, basement, lap circuits) | the mood and its effects, but no rain |
| Inside a Well | the Well's own weather |

How it works:

- **Strength** runs from 0 to 1. Below about a third of the way up, the sky is fair.
- **A spell** holds for at least **3 game hours** (7.5 real minutes). Moods move to a neighbour, one step at a time, with fair weather
  between.
- It is the same for every player and every replay. Nothing is random, so it can be known ahead.
- An island leans to its own feeling (Margarite leans to Mirth, Entropolis to Dread).

### Forecast

Read the sky with the Dreamvane. The log gives the weather where you stand, one entry per 3 game hours. Without help it reaches
**3 game hours** ahead. Divination widens that.

### What weather changes

Effects scale with strength. These are the numbers at full strength.

| What | Change |
| --- | --- |
| The matching damage type | builds its status 50% faster |
| A creature's mental state | drifts at up to 0.05 of a state a real second: Mirth toward Stoic (-0.5), Wonder slightly Stoic (-0.2), Grief toward Prismatic (+0.25), Dread toward Prismatic (+0.5) |
| Grain | drifts slowly (see [Combat](combat.md)) |
| Fish drawn to that feeling | bite twice as often |
| That feeling's crude | 25% cheaper where it falls |
| A Well refilling | faster in Desire (1.5 times), Grief and Dread (2 times), slower in Mirth (0.5 times) |
| A sea crossing | Dread adds danger, Mirth removes it, and each feeling changes how far ahead the reckoning sees |

Weather changes what pays and what is easy. It never does a skill for you.

Some of these readers are not wired into play yet. The creatures' build-up multiplier, the mind drift, the fish bite and the Fish
Guide's weather column are listed as still to do in `docs/plans/WEATHER.md`.

### How it is drawn

Mirth is a sunshower, Wonder an aurora, Desire a sirocco, Grief steady rain, Dread fog with thunder far off (no lightning flashes).
Moods change the sky, the light, the sound and a creature's body, never with text.

## The day and the clock

One **game day** is **one real hour**. One **game hour** is **2.5 real minutes**. The clock follows the wall clock, so the world turns
while you are away, and it turns over at the same moment for every player.

| Phase | Game hours | Real time into the game day |
| --- | --- | --- |
| Night | 20:00 to 5:00 | 50 minutes, past midnight, to 12.5 minutes |
| Dawn | 5:00 to 7:00 | 12.5 to 17.5 minutes |
| Daytime | 7:00 to 18:00 | 17.5 to 45 minutes |
| Dusk | 18:00 to 20:00 | 45 to 50 minutes |

- **Night:** Lachryma glows, so its signatures reach 1.5 times further for tools that sense it. A Well is always dark, so it is always
  like night.
- Light runs from a starlit floor of 0.08 up to 1 at noon.
- `/time` on the chat line gives the game day, weekday (the week has seven days), hour and minute.
- The log says when the weather or the phase turns.

## Your draught

The **draught** is the feeling of the Lachryma you last drank. It is set by the weather where you drank it. Your blows of that
feeling's damage type build their status up to **50% faster** at a full draught. It fades over **one real minute** if you do not
drink. Your stones decide how strongly the place's feeling comes in.

Drinks that count: a bauble, the bottle, a shot absorbed, the Lockheart's gulp and a parry's soak. Refills from a jackpot or a
wave do not.

## Your mental state and brimming

You have a mental state like a creature's, from Stoic to Prismatic. It starts Balanced.

| Event | Effect |
| --- | --- |
| A drink | pushes you toward Prismatic by 0.01 of a state per Lachryma (a 36 Lachryma bauble is about a third of a state) |
| A drink past full | four times as far: 0.04 per Lachryma, and you are **brimming** for 2 real seconds |
| 5 real seconds with no drink | settles back toward Balanced at 0.05 of a state a real second |

The log says "You are brimming." and, a while after, that you settle. Your stones change how far a drink pushes you.

What your state does to your power and fragility is planned but not found in the code (the design says Prismatic gives x1.5 power
and x2 fragility). It is not built yet. Your mental state is kept with your pool in the save, and the Spirit Garden's rain reads it.

## For the divisions

- `src/progress/weather.js`: the weather, aspects, agates, phases, forecast, effects. Numbers in `ECON.weather`
  (`src/progress/econ/table.js`).
- `src/core/calendar.js`: the game day (`DAY_MS`).
- `src/courier/mind.js`, `src/progress/stones.js`: your mental state, draught, brimming.
- `docs/plans/WEATHER.md`, `docs/plans/WHEEL.md`, `docs/GLOSSARY-DETAIL.md`.
