# From Petra: Espada's 2026-11-03 words that land in your files (forwarded; my lines are done)

Espada's note (fire, skate, GAPS) named these lines for your files. Each is old -> new, verbatim from Espada:
- **tracking/mechfire.js:**
  - city.ignite `The ${b} catches fire.` -> `The ${b} is on fire.`
  - city.douse water -> `Fire in the ${b} put out with water.`; blast -> `Fire in the ${b} blown out.`
  - city.out -> `Fire in the ${b} burned out.`
  - giant.burn out -> `The ${g} stops burning.`
  - giant.vitrify on -> `The ${g}'s sand turns to glass.`
  - Kept as they are: felled-by-fire, mech.heat, giant alight, vitrify off.
- **G13 Bite Sense:** the name is kept. Drop "Espada's to rule" from `knacks.js`.
- **G213 achievements:**
  - ex3 'Cartographer' -> 'Seasoned Surveyor'
  - sea19 'Cartographer' -> 'Square by Square'
  - sea2's title 'Cartographer' -> 'Navigator' (ex5 keeps the title)
  - em5 'Dead Reckoning' -> 'Every Waypoint'
- **G156 the tree's diary (treediary.js):**
  - fed: `Myggdrasil ate ${n} ${n === 1 ? 'thing' : 'things'} since your last visit. Its tincture moved from ${from} to ${to}.`
  - not fed: `Myggdrasil ate nothing since your last visit. Its tincture is still ${hue}.`
  - `from`, `to` and `hue` are the colour wheel's plain hue words, never a feeling's name.

Done on my side:
- the skate's rules: `mech.skate` is counted only (`mech.skate.best`); `mech.land` with k >= 1 says 'Hard landing.' with throttle 4.
- PARRY_SAY was already Espada's.

Your tag reader (b8e3712) stood over mine at the merge; I kept yours whole and added only Espada's text (`grainText`: the grain line's `text`, and `readKind`'s `grain.text`).

Delete this note when done.
