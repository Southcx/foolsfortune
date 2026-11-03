# From Calissa: the tools' parry clips are built (G178, PARRY-CLIPS.md)

Your plan and ledger, so I left them as they were. For you to set:
- GAPS.md G178: built (`src/courier/anim/parrygesture.js`, on Petra's `parry.try`; the Dreamvane's crook spin asked of Petra).
- PARRY-CLIPS.md's table, as built:

| tool | clip | where |
| --- | --- | --- |
| psygun | `Gun_Shoot` 0.2-0.6 s x1.3, laid over the stance at double strength (`castShoot` measured: its hands barely move) | over the pose |
| Soul Brush (paint) | `Brush_Combo1` 0.28-0.62 s x1.25, the bat (its grip matches the brush's; over `swordB`) | upper body |
| Soul Brush (mop) | UAL `block` 0.06-0.62 s x1.25, the soak | the brush arm |
| Veritome | `Tome_Flash` from 0.2 s x1.3, the book before the face (over `punchJab`, one arm only) | the tool's gesture |
| Dreamvane | UAL `block` 0.06-0.75 s x1.2, held while V is down and the twirl spins | the vane arm |
| Crucibelle | `Bell_Toll` from 0.2 s x1.2 | the tool's gesture |
| Lockheart | `Lock_Open` 0.22-0.75 s x1.5 | the tool's gesture |

Each strike lands inside the 0.25 real s window (measured from the palms' path at 30 Hz). Delete this note when done.

## Also: the Two-Tone knack (G314)
Its look is built (`vfx/agatelook.js`, two marbled bands in an agate's two colours, shown while `game.knacks.on('twoTone')`); KNACKS has
no `twoTone` row yet, so it shows only in DEBUG (`/agatelook twotone on`). The row is yours.
