# The parry: V, one button, a different answer per tool (the owner, 2026-10-06)

Kept by Dovina. **Built:** `src/courier/parry.js` (the one rule), `src/courier/parries.js` (each tool's V), `creatures.windup` and
its kin (`src/creatures/creatures.js`), the outline mark (`game.parryMark`), the ledger rule in `src/feedback/tracking.js`.

> "Let's have 'v' be our designated 'Parry' button that functions differently based on the Tool equipped. The kick can stay as the
> unarmed parry." (the owner, 2026-10-06)

**V is the parry, and the tool in hand decides what the parry is.** One shape for all: a **window** at the press (about 0.25 real
seconds, the kick's and the cutlass's) answers a blow or projectile the tool's way; holding V after does what the tool does when
held. One window, learned once (Sekiro). Prior art: Bloodborne, Sekiro, Hi-Fi Rush, Zelda, Kirby, Fatal Frame, Cuphead.

| in hand (the owner approved the table, 2026-10-06) | V in the window (`how`) | V held after |
|---|---|---|
| nothing | **the kick**: back where you look (`return`) | — |
| Sondelass: cutlass (rod, hook: the blade snaps out) | **the deflect** (`return`) | the guard (3 Lachryma a block) |
| psygun | **the gun parry**: a point-blank shot that staggers the thrower through `stun.js` (`stagger`) | — |
| Soul Brush, paint / mop | **the bat**: returned carrying your paint (`return`) / **the soak**: a Lachryma shot drunk into the Lachrymato Bottle (`soak`) | — |
| Veritome | **the shutter**: a free Flash on a creature striking at you, a full flash of stun and more (`shutter`) | — |
| Dreamvane | **the twirl**: shots turned aside (`turn`) | spinning, 2 Lachryma a real second |
| Crucibelle | **the toll**: shatters shots within 3 m; on the song's beat, a wider ring (`shatter`) | — |
| Lockheart | **the gulp**: swallows what hits it as Lachryma for the pool (`gulp`) | — |

- **Parry with a tool out never kicks** (the owner). **No tool's parry changes movement**: an upper-body pose over the core movement.
- **One window, never bigger per tool**, except where a Movement Art's variant widens it (the kick's Counter, `progress/skills.js`).
- **Melee blows too (Petra, 2026-10-06):** the window asks projectiles and `creatures.windup(c, { at, radius, eta, kind, parry, part })`.

## What can be parried is shown (the owner, 2026-10-06: "a lachryma-colored outline ... Very similar to the pink projectiles in Cuphead")

- **A parryable thing wears a Lachryma outline**, nothing else does: a parried shot becomes yours (OVERLAY.md: matter is had).
- **The outline is a promise kept:** a projectile carries `parry` (default true); false for what is too heavy to turn (a boulder, the
  Great Slip Jelly's ram, a ship's round shot), the Courier's own shots, and any designed "must dodge". An answerable windup wears the
  outline on its striking part for its `eta`; a grab or a ram is telegraphed by the body, never outlined.
- **Every parry tool answers every outlined thing**: a soak or gulp on a non-Lachryma shot turns it aside instead.

**Event:** `move.parry { tool, how, what, speed?, by: 'courier' }`; `tool` `'kick' | 'cutlass' | 'psygun' | 'brush' | 'veritome' |
'dreamvane' | 'crucibelle' | 'lockheart'` (and `'sloop'` at sea); `what` `'shot' | 'blow'`. Counted: `move.parry` (pa1, pa2, cu15)
and `parry.<tool>`.

**Open:** achievements by tool (a sub-category **The Parry** under THE ARTS: one with each tool; a hundred in total); one log line a
kind beside "You parry the shot." (Espada's words); a clip for each parry, found before authored (Calissa).
