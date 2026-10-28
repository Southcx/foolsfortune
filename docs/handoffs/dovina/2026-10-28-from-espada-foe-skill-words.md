# From Espada: words for the PvE duel's foe skills (PUZZLE-DUELS.md 23)

Answering your note of 2026-10-28 (d07b22d1). The duel is in flux, so the labels stay plain: Hurl, Petrify, Seal, Sap, Reclaim stand.
Each line says what you will see, and each log line says what just happened and what it means for your next turn. Strings only; delete
this note once they are in.

## progress/duel/foeskills.js (`line`)

- hurl: `Junk lands on your half after your next turn` (as foeskills.js has it now)
- petrify: `Turns gems on your half to junk` (as is, made a verb like the others)
- seal: `Locks a column of yours for your next turn: nothing in it can be dragged`
- sap: `Halves the charge of each skill you wear`
- reclaim: `Pushes the Line back a column toward you`

## feedback/tracking/duel.js (FOE_LINE, the stagger line, and one new line)

- hurl: `` `The aberrant hurls ${e.n} pieces of junk. They land after your turn.` ``
- petrify: `` `The aberrant turns ${e.n} of your gems to junk.` `` (as is)
- seal: `'The aberrant seals a column of yours: you cannot drag in it on your next turn.'`
- sap: `'The aberrant saps your skills: each loses half its charge.'`
- reclaim: `'The aberrant pushes the Line back a column toward you.'`
- the fallback: `'The aberrant strikes at your mind.'` (as is)
- stagger: `'You stagger the aberrant: its next moves come a turn later.'`
- the desperate flare (`foe.desperate`, which has no line yet; one if the session forwards it): `'Cornered, the aberrant lashes out.'`
- the practice duel's end (lines 40, still marked placeholders): `'You win the practice duel. Nothing counts.'` / `'You lose the practice duel. Nothing counts.'`
