# Words: the mech fire, the skate, and my GAPS rows, first pass (from Espada, 2026-11-03)

These are string changes, listed old -> new. Each one goes to the file's owner, and the owner is named on every line. A line marked
**keep** is ruled as it stands. The mechs are not final, so every word here is plain. No sweep greps these words (I checked
`scripts/sweeps/`).

## The mech fire (`feedback/tracking/mechfire.js`, Dovina's branch, 01ba783)
- city.ignite: `The ${b} catches fire.` -> `The ${b} is on fire.` (this matches the giant's line)
- city.felled, cause fire: **keep** (`The ${b} burns down.`)
- city.douse, water: `Water puts out the fire in the ${b}.` -> `Fire in the ${b} put out with water.`
- city.douse, blast: `The blast smothers the fire in the ${b}.` -> `Fire in the ${b} blown out.`
- city.out: `The fire in the ${b} burns out.` -> `Fire in the ${b} burned out.`
- mech.heat: **keep** ('Mech overheating. Get out of the fire.')
- giant.burn, alight: **keep**. Out: `The ${g} is no longer burning.` -> `The ${g} stops burning.`
- giant.vitrify, on: `The ${g}'s sand fires to glass.` -> `The ${g}'s sand turns to glass.` Off: **keep**.

## The skate (`world/hangar/mechskate.js`, Calissa's branch; the rules go in `tracking/mechs.js`)
- `mech.skate { k }` fires every 0.5 real s. It gets **no log line**. The body, the boosters and Wanda's sound already show it,
  and a line every half second would bury the log. Count it only: `L.hi('mech.skate.best', k)` if a record is wanted.
- `mech.turn { k, pivot }`: **no log line**. These are moves in play, not outcomes.
- `mech.land { k }`: a line only for a landing of full weight, `k >= 1`: 'Hard landing.' with `{ key: 'mech.land', throttle: 4 }`.
  Below 1, no line.

## GAPS.md rows closed or ruled here
- **G13, Bite Sense:** the name is **kept**. It is a plain genre word for what the knack does. Drop "Espada's to rule" from `knacks.js`.
- **G177, PARRY_SAY** (`tracking/movementarts.js`, yours): all lines are **kept** except one.
  - stagger: 'Shot down. Its thrower staggers.' -> 'Shot knocked down. The shooter staggers.'
  - Change the comment to "Espada's, 2026-11-03".
- **G213, achievement names** (`progress/achievements.js`, `seaachievements.js`, Dovina's). "Cartographer's Cut" is gone from the code.
  What remains is a clash: "Cartographer" is used four times, as two achievement names and two titles. One word, one meaning:
  - ex3 'Cartographer' (250 survey pulses) -> 'Seasoned Surveyor'. It is the step after ex2, Surveyor.
  - sea19 'Cartographer' (20 squares completed) -> 'Square by Square'.
  - sea2's title 'Cartographer' -> 'Navigator'. ex5 keeps the title Cartographer, for the land map.
  - em5 'Dead Reckoning' (scout a route in full) -> 'Every Waypoint'. Dead reckoning means sailing without landmarks, which is the
    opposite of a full scout. It is also the open sea's word for doubt, and the Dead Reckoners' name.
- **G156, the tree's diary** (Dovina's rule, not built). These are the lines for the first visit of a game day, one line:
  - fed: `Myggdrasil ate ${n} ${n === 1 ? 'thing' : 'things'} since your last visit. Its tincture moved from ${from} to ${to}.`
  - not fed: 'Myggdrasil ate nothing since your last visit. Its tincture is still ${hue}.'
  - `from`, `to` and `hue` are the colour wheel's plain hue words (red, amber ...). They are never a feeling's name, because the
    tincture is a colour, not a feeling.
- **G289, the bestiary's grain line** (`creaturetag.js`, yours, when built):
  - `Grain: ${t1}, ${t2}, ${t3}.`, with one trait word for each star of familiarity read, in the order of the five traits.
  - A trait not yet read shows as the scrambled read.
  - "Weak to:" stays on its own line, as it is today.

## Still open with my name (in the ledger's order) and why
- **Wait on South** (lore names until final, or his word): G11, G55, G144, G165, G192, G200, G204, G209, G216, G261, G313.
- **Wait on a build first** (the words have nowhere to go yet): G31, G43, G53, G64, G96, G114, G115, G161, G185, G222, G227, G229,
  G245, G296, G314, G320.
- **Mine to write next round:** G12 (the six new species' names), G39 (the System's lines), G50 (the siblings' lines), G60 (LORE.md
  section 11), G106 (the gloss sentences are written; the hook is Petra's and the rule Dovina's), G120 (the rename, with you),
  G138 (map labels), G190 and G193 (quests), G221, G234, G258, G275, G276.

Delete this note when done.
