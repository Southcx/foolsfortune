# The parry: V, one button, a different answer per tool (the owner, 2026-10-06)

Kept by Dovina; Petra builds (the tools and `courier/parry.js`), Calissa animates, Espada words the log. Units: real seconds, metres.

> "Let's have 'v' be our designated 'Parry' button that functions differently based on the Tool equipped. The kick can stay as the
> unarmed parry."

## Where it stands (measured in the code, 2026-10-06)

- **V unarmed: the kick** (`courier/moves/kick.js`, a Movement Art): the first 0.09–0.26 s of the kick turn a projectile back.
- **V with the Sondelass's cutlass: the guard** (`tools/sondelass/cutlass.js`): the first 0.28 s of raising it is a parry, then a
  held guard that only turns a shot aside and costs 3 Lachryma a block.
- **V with any other tool: nothing.** The kick refuses with a tool out (`mgr.toolOut`), and no other tool reads V.
- Both parries already go through one rule, `deflect` and `guard` in `courier/parry.js`, and emit `move.parry`. So the part is
  already built once; what is missing is every other tool's answer.

## The rule

**V is the parry, and the tool in hand decides what the parry is.** Every tool's parry has the same shape so one lesson teaches all:
a **window** at the press (about 0.25 real s, the kick's and cutlass's), in which a blow or a projectile is answered in the tool's
way; after it, holding V does what that tool does when held (the cutlass guards; most do nothing). One window and one press, so
it is learned once (Sekiro: one deflect for everything, and what changes is what happens next).

Prior art: Bloodborne's gun parry (a shot in the window staggers), Sekiro's deflect, Hi-Fi Rush's parry on the beat, Zelda's
shield parry and Ocarina's Mirror Shield, Kirby's inhale, Luigi's Mansion 3's Poltergust, Fatal Frame's Fatal Frame shot (the shutter
in the last instant before a ghost strikes), staff spins (Ninja Gaiden, the Monkey King).

## Each tool's parry (a proposal for the owner to cut; a dash is "settled already")

| in hand | V in the window | V held after | why it fits the tool |
|---|---|---|---|
| nothing | **the kick** (kept): a projectile goes back where you look | — | settled |
| Sondelass: cutlass | **the deflect** (kept) | the guard (kept) | settled |
| Sondelass: rod, hook | the cutlass's, the blade snapping out for it | the guard | one tool, one parry; the form changes back |
| psygun | **the gun parry**: a point-blank shot that, against a blow winding up or a projectile, staggers the thrower (a stun through `stun.js`) | — | Bloodborne's; the gun's answer is to shoot first |
| Soul Brush, paint | **the bat**: the projectile goes back as the kick's does, now carrying your paint (lands as a splash of your feeling) | — | the club, as a bat |
| Soul Brush, mop | **the soak**: a Lachryma projectile is drunk into the Lachrymato Bottle instead of returned | — | the mop drinks; the brush is environmental Lachryma |
| Veritome | **the shutter**: a free Flash in the window, only on a creature striking at you, that fills its stun meter by a full flash and more (the Fatal Frame shot) | — | the camera's answer is the last-instant photograph |
| Dreamvane | **the twirl**: projectiles that reach the spinning crook are turned aside | spinning while held, 2 Lachryma a real second | a staff spin |
| Crucibelle | **the toll**: a ring that shatters projectiles within 3 m; in the window on the song's beat, a wider ring | — | Hi-Fi Rush's beat parry; the bell answers with sound |
| Lockheart | **the gulp**: the coffin opens and swallows what hits it, as Lachryma for the pool | — | the Lockheart drains; it drinks the blow |

Notes for the cut:
- **Parry with a tool out never kicks.** The kick stays the unarmed parry (the owner).
- **No tool's parry changes movement**: each is a pose on the upper body over the core movement (CLAUDE.md, the gold standard).
- **Only a window, never a bigger window per tool**, except where a Movement Art's variant widens it (the kick's Counter already
  does, `progress/skills.js`): the one timing is the skill the player learns.
- Whether the psygun, Veritome and Crucibelle answers need a projectile, or also answer a melee blow: they need `creatures` to say
  "a blow is winding up" (a stimulus or a creature state); the ram's telegraph (`progress/combat/dunemaw.js`, 1.0 s) is the first
  case. Petra's call on where that lives.

## The ledger and the log

- `move.parry` gains `tool` (`'kick' | 'cutlass' | 'psygun' | 'brush' | 'veritome' | 'dreamvane' | 'crucibelle' | 'lockheart'`) and
  `how` (`'return' | 'stagger' | 'soak' | 'shutter' | 'turn' | 'shatter' | 'gulp'`), and its `by` becomes `'courier'` (today it carries
  `'blade'` or the foot, which is not the house's `by`; the tool goes in `tool`).
- Counted: `move.parry` (all, as now: the achievements pa1, pa2 and cu15 stay true) and `parry.<tool>`. Achievements by tool come
  when the parries are built (a sub-category **The Parry** under THE ARTS: one with each tool; a hundred in total).
- The log keeps "You parry the shot." and adds one line a kind, Espada's words.

## The animations (Calissa)

Each parry needs a clip, found before authored (CLAUDE.md, animation). The owner also saw the kick's clips (`kick_a`, `kick_b`)
**loop badly and play with no blending**. That is a bug, so it goes in the casebook when fixed.
