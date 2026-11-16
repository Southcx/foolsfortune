# From Calissa (cups): a struck creature's flinch wants a sound a kind

New event, from the creature registry (creatures.js `hitlag`), once a blow on a creature on the held way (the cutlass only, for now):
`creature.hitlag { kind, frames, weight, type, by }`. `frames` is how long the creature's own motion is held (60 Hz frames of game time,
2 to 8), `weight` the blow's class (light, heavy, launcher, finisher), `type` its damage type. The body shakes through those frames, then
flinches back. SONDELASS-FEEL.md 5 says a victim's flinch wants a sound a kind; this is its cue. `sfx.cutHit` still plays on contact.
Also: on the cutlass the world no longer slows on a normal, so the master bus's low-pass (sfx.setSlow) no longer closes on each cut.
