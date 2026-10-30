# From Petra: every class art in play (2026-10-30)

All 76 of Dovina's CLASS_ARTS (38 actions, 38 reactions) now run: the actions in `courier/classarts/acts.js`, what outlasts a press in
`courier/classarts/lasting.js`, the reactions and hooks in `courier/classarts/body.js`. Waves 3 to 5 landed today (d5f5167, d16b28f,
7a86405), each measured headless, one check an art. Every action says `art.use { art, kind, accented, at?, target?, by }`; a reaction
`art.fire { art, by }` (some with `cubes`, `pool`, `kind` or `hint`); a timed art `art.end { art, by }`.

## Dovina

- Your files I touched, one line each, for the arts that bend them (yours to keep or move): `progress/skills.js` `ledOf` adds
  `teach.<key>` (Teaching's practice, counted apart from the real count, so the ledger stays honest); `progress/weather.js` `here()`
  asks `classArtsRun.skyAt(pos)` (Starlight's patch); `progress/luck.js` `luckOf` adds `luck.fortune` (Fortune's bits, apart again);
  `progress/garden.js` `harvest` adds `bedYield()` (Abundance). `progress/firsttoday.js` is untouched: Dividend pays its share beside the
  first-today pay, on `firsttoday.paid`.
- A ruling wanted: **Hope** ("made whole, you come back with half your pool") gives nothing today, because the reform fills the pool
  (`courier/vessel/death.js` `lachryma.reset()`). It is built literally, and says nothing when it gives nothing. It needs another effect.
- My numbers where your rows are silent (the constants are named in each file): a stagger is 0.3 of a light stun; an aimed art takes the
  lock-on, else the nearest in front within 20 m; a vessel blow of k is dealt back as 4 x k (Payback, Settle the Score); Starlight's patch
  is 40 m, Wonder at 0.7; Reap's blow is 4 x its target's health; Veil's forgetting 6 s; Daybreak's blinding 4 s, the night's weight
  x0.3 while it lasts; Hang Time's lift 6 m/s; Earth Wall's slab 0.8 m thick; Ram's 6 m carried over 0.4 s; a ridden jelly 5 m/s.

## Calissa

Every art's look is yours, on the events above. Placeholders of mine to replace: Earth Wall's slab (a plain standard material,
`body.js` `wall`), Lamp's light (a PointLight lent by the light budget, `lasting.js` `lamp`), Vanish's smoke Courier (the Crucibelle's
mirage, reused). No look at all yet: the sanctum's and the thicket's circles (`lasting.js`; each carries `at` and `r`), a ridden creature,
Hang Time, Starlight's patch of sky, Encore's echo (it fires `art.fire { art: 'echo', at }` where it strikes).

## Espada

Placeholder words of mine in `acts.js` (marked "placeholder: Espada's"): "Tame needs a creature stunned or out cold within 8 m.", "Ride
needs a staggered creature within 8 m.", "Starlight needs the night sky.", "Encore needs a tool move to play again.", "Quick Swap has no
other shell you hold to swap in.", "Your re-roll is already yours: Spin has nothing to give back.", "Settle the Score finds no one near
who hurt you." The log's lines are your `tracking/classartsplay.js`; I added only the amounts after "triggers" (cubes, pool, Intuition's
hint, which is the first clause of the secret's own line).

## Wanda

No new sound events: everything is `art.use`, `art.fire` and `art.end` with the art's id, as your `ClassArtSounds` already hears them.

Not verified: a real move's record for Encore (the probe set its record by hand), a ride steered by a person's keys, a real phone. Delete
this note in your branch when done.
