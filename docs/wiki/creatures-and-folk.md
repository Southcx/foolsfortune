# Creatures and folk

> First pass: moved whole from the old README (2026-10-08). Each page is being rewritten to `docs/plans/CLARITY.md`'s rules: plain
> words, what it does first, numbers as stats. The full definitions of terms are in `docs/GLOSSARY.md`.

**Clapperjars** are living pots: they wander, taunt (lid clapping), nap, eat baubles, hide behind big pots, bolt from near misses and
shatter from shots, cuts, blasts and long falls. Left alone they do small slow things, each at its own temper.

**The slip jelly** (`src/creatures/jelly/`) is the first creature that fights back: an egg of wet sand on four paddling toes, moved by
springs in its vertex shader rather than bones. It glides on its own slip (real slip: you can dive into its trail), **lunges** after a
whole-body wind-up and **spits** globs. Eight shots' worth and it bursts into slip and cubes, and forms again later. The jellies **live
there**: they drink at the pond, rest in shade, forage, fish, play, call each other when one notices you, avenge the hurt and mourn the
burst. Their minds are built from shared parts (`docs/AI.md`).

**Stun** (`src/creatures/stun.js`): the flash, blows and being caught mid-leap fill a creature's poise; full, it is stunned (gold stars).
A stunned creature takes more from every blow and is open to what a thinking opponent would refuse: **reprogramming** and the **zandatsu**,
which cuts it into pieces that come undone into Lachryma.

**The clay folk** (`src/npc/`): clapperjars grown up and glazed. **Mistress Saggar** keeps the kiln, **Pip** her apprentice hides in the
basement hub, **Old Grog** fishes the Weir, **Raku** keeps its treasury. F talks: a dialogue box whose letters move with the feeling, a
voice of bells and clay (Clayese), a body that shows the mood. Every line is also written to the log, and they know what you have done.
