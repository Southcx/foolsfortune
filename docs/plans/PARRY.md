# The parry: V, one button, a different answer per tool (the owner, 2026-10-06)

Kept by Dovina. **Built:** the one rule `src/courier/parry.js` (`answer`, `deflect`, `guard`, the hows), each tool's V
`src/courier/parries.js`, the telegraphed blow `creatures.windup` / `windups` / `unwind` / `parried` (`src/creatures/creatures.js`), the
outline mark (`game.parryMark`), the ledger rule in `src/feedback/tracking.js`. Units: real seconds, metres.

> "Let's have 'v' be our designated 'Parry' button that functions differently based on the Tool equipped. The kick can stay as the
> unarmed parry." (the owner, 2026-10-06)

## The rule

**V is the parry, and the tool in hand decides what the parry is.** One shape for all: a **window** at the press (about 0.25 real
seconds, the kick's and the cutlass's) in which a blow or projectile is answered the tool's way; holding V after does what the tool
does when held. One window, one press, learned once (Sekiro). Prior art: Bloodborne, Sekiro, Hi-Fi Rush, Zelda, Kirby, Luigi's
Mansion 3, Fatal Frame, Ninja Gaiden, Cuphead.

## Each tool's parry (the owner approved the whole table, 2026-10-06)

| in hand | V in the window (`how`) | V held after | why |
|---|---|---|---|
| nothing | **the kick**: back where you look (`return`) | — | settled |
| Sondelass: cutlass | **the deflect** (`return`) | the guard (3 Lachryma a block) | settled |
| Sondelass: rod, hook | the cutlass's, the blade snapping out | the guard | one tool, one parry |
| psygun | **the gun parry**: a point-blank shot that staggers the thrower through `stun.js` (`stagger`) | — | Bloodborne's |
| Soul Brush, paint | **the bat**: returned, carrying your paint (`return`) | — | the club as a bat |
| Soul Brush, mop | **the soak**: a Lachryma shot drunk into the Lachrymato Bottle (`soak`) | — | the brush is environmental Lachryma |
| Veritome | **the shutter**: a free Flash on a creature striking at you, a full flash of stun and more (`shutter`) | — | the Fatal Frame shot |
| Dreamvane | **the twirl**: shots turned aside (`turn`) | spinning, 2 Lachryma a real second | a staff spin |
| Crucibelle | **the toll**: shatters shots within 3 m; on the song's beat, a wider ring (`shatter`) | — | Hi-Fi Rush's beat parry |
| Lockheart | **the gulp**: swallows what hits it as Lachryma for the pool (`gulp`) | — | the Lockheart drains |

- **Parry with a tool out never kicks** (the owner).
- **No tool's parry changes movement**: a pose on the upper body over the core movement (the gold standard).
- **Only one window, never bigger per tool**, except where a Movement Art's variant widens it (the kick's Counter, `progress/skills.js`).
- **Melee blows too (Petra, 2026-10-06):** `creatures.windup(c, { at, radius, eta, kind, parry, part })` marks a telegraphed blow,
  and the window asks both projectiles and windups. The Great Slip Jelly called it first.

## What can be parried is shown (the owner, 2026-10-06: Cuphead's pink)

> "Use a lachryma-colored outline shader to indicate which projectiles can be parried. Very similar to the pink projectiles in Cuphead."

- **A parryable thing wears a Lachryma outline**; nothing else does, and the colour means nothing else. Lachryma, not labradorite,
  because a parried shot becomes yours (OVERLAY.md: matter counts what you have).
- **The outline is a promise kept:** a projectile carries `parry` (default true); false for what is too heavy to turn (a boulder, the
  Great Slip Jelly's ram, a ship's round shot), the Courier's own shots, and any designed "must dodge". An answerable windup wears the
  outline on its striking part for its `eta`; a grab or a ram is telegraphed by the body, never outlined.
- **Every parry tool answers every outlined thing**: a soak or gulp on a non-Lachryma shot turns it aside instead.

## Event contract

`move.parry { tool, how, what, speed?, by: 'courier' }`: `tool` is `'kick' | 'cutlass' | 'psygun' | 'brush' | 'veritome' |
'dreamvane' | 'crucibelle' | 'lockheart'` (and `'sloop'` at sea); `how` as the table; `what` `'shot' | 'blow'`. Counted: `move.parry`
(achievements pa1, pa2, cu15) and `parry.<tool>`.

## Open

- Achievements by tool: a sub-category **The Parry** under THE ARTS (one with each tool; a hundred in total). Not yet added.
- The log keeps "You parry the shot." and adds one line a kind (Espada's words).
- Each parry needs a clip, found before authored (Calissa).
