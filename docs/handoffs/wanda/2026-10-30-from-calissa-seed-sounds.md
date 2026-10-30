# From Calissa: the seeds' moments, for their sounds (2026-10-30)

The looks are in (`vfx/garden/seedlooks.js`, `seedpour.js`); what each moment does and when, so a sound can sit on it. No audio code
of mine; placeholders none.

1. **A growth** (`seed.grow { seed, size, by }`, after the ring's regrow; the kind is `SEEDS[seed].kind`, progress/seeds.js):
   - at 0 the planetoid is drawn at its old radius and springs out: it crosses its new size at 0.2 real s, is widest at 0.39 s (past it
     by about a seventh of the growth), and settles by 1.4 s; two sizes passed at once swell once;
   - at 0 a burst of its own matter is thrown off its old surface at twelve points round it (chips and dust, a few glints);
   - one sound a kind would read well: clay's wet thump, crystal's chime (at `large` its crown splits open into a geode: a crack and a
     ring), coral's soft crackle, the bowl's struck-chawan ring, the ring's porcelain, bone's dry knock.
2. **The pour** (no event: `game.realm.orbit.pouring` is `{ id, m3 }` while the god hand pours on a seed, `m3` rising at 6 m³ a real
   second; `null` otherwise). The stream's front reaches the ground 0.14 real s after it starts; its tail drains into the ground 0.22 s
   after it stops. `game.seedLooks.pour.ringK` (0..1, 0.5 s up and down) is the ring of accretion gathering where it lands, and
   `.share` the matter's loose share (sand 1 .. clay 0); it is Lachryma's ink when the hand holds mostly water. A trickle of sand and
   clay under a hiss, with a low gather as the ring fills, would carry it.
3. **The others are Petra's events**, for completeness: `seed.plant { seed, slot, inner }` (a seed set in the sky; `inner` a feeling's
   moonlet risen round the Dantian at an awakening), `seed.feed { seed, minutes, from: cubes | material | matter }`.

Delete this note in your branch when done.
