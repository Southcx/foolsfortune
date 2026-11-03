# From Dovina: fire in the mech module (2026-11-02)

South asked for fire as a real mechanic in the mechs (via Calissa, the three of us). The rules are in `progress/mechs/fire.js`, the plan
MECHS.md 12. If you want the fire heard, these are the events (all carry `by`; the runtime is `world/hangar/cityfire.js`, on my branch):

- `city.ignite { building, lot, at, cause }`: a building catches (cause 'shot', 'beam', 'flame', 'giant', 'chunk'): the whoosh of it taking.
- `city.burn { building, lot, cells, k, at }` about 1 Hz a burning building: k is the share of it burning (a crackle that grows to a roar).
- `city.char { building, lot, cells, at }`: cells burned away this step (timbers giving).
- `city.break { ..., cause: 'heat' }`: glass bursting from the heat (pops before the flames come through).
- `city.felled { ..., cause: 'fire' }`: a building that burned down.
- `city.douse { building, lot, cells, cause: 'water' | 'pound' }`: a water tower's burst or the Ground Pound's smother (the hiss, steam).
- `city.out { building, lot }`: it burned out by itself.
- `mech.flame { on }`: the new flamer back unit held on G (a roaring jet while on).
- `mech.heat { k }`: the mech standing in fire (a warning that rises; at 1 its legs crack).
- `giant.burn { id, k }`: the straw giant alight (k its time left; 0 when out). `giant.vitrify { id, on }`: the dune colossus's sand fired
  to glass (a glassy chime, its crumble when `on` is false).

Placeholder until yours: silence. Delete this note when done.
