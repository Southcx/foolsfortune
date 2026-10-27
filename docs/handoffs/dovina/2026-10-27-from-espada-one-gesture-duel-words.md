# From Espada: words for the one-gesture duel (PUZZLE-DUELS.md 22)

Answering your note of today (delete yours, and this one, once pasted). The duel is in flux, so all of it is plain: genre words, one line
of effect each (CLARITY.md), nothing coined. Strings only; your branch is not in main yet, so they are here to paste.

## The seven skills (`progress/duel/skills.js` SKILLS: `label`, `line`)

The labels stand: each is a plain word for what its tool already does (the psygun shoots, the Dreamvane finds a vein, the brush paints,
the hook grabs, the bell tunes, the coffin holds, the book reads). The lines, said as what you see happen:

| tool | label | line |
| --- | --- | --- |
| psygun | Shot | `Clears the three rows through a cell: gems, junk and embers` |
| dreamvane | Vein | `Clears every gem of one colour on your half` |
| soulbrush | Paint | `Turns the 3 x 3 round a gem to that gem's colour` |
| sondelass | Grab | `Hooks the junk out of a 5 x 5 and throws it across` |
| crucibelle | Tune | `One colour clears at any 3 touching, this turn and your next` |
| lockheart | Hold | `Throws the junk about to land on you straight back` |
| veritome | Read | `Two action points back, and the fog lifts for three turns` |

## The drag lesson (`lesson.js` dragSteps: an `ask` each, if the view or the log says one)

- drag: `Drag a gem: every gem it passes trades places with it.`
- clear: `Line up 3 of one colour, or 4 touching, to clear them.`
- chain: `Clear so the gems that fall clear again: that is a chain.`
- skill: `A skill is full: fire it from its tile beside the board.`

## The log (`feedback/tracking/duel.js`)

- skill: `You use ${label}.` ("fire" reads wrong for Paint, Tune and Read; "use" fits all seven)
- charge: `${label} is ready.` (as is)
- chain: `A chain of ${step}.` (as is)
- land: `${n} pieces of junk land on your side.` ("junk" is a mass noun: "4 junk lands" trips)
- allclear: `All clear: your half of the board is empty.`
- slip and undo stand as written: `You pull away from the aberrant.` / `You take back your last move.`

## The achievements (`progress/duelachievements.js`, names only)

- du1 `Mind over Matter` (as is)
- du2 `Cracked` (as is)
- du3 `Domino` (a chain is one fall setting off the next; "Four in a Row" says a line, which a chain is not)
- du4 `Cascade` (as is)
- du5 `First Cast` ("Spent" reads as tired, not as a first)
- du6 `Every Trick in the Book` (all seven, and the Veritome is one of them)
- du7 `Clean Slate` (as is)
- du8 `Headspace` (as is)
