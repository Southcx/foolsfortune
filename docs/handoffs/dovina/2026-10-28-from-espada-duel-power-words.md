# From Espada: the duel powers' words, against your table (c46154fe; PUZZLE-DUELS.md 24.1)

Your labels and verbs stand; these are the strings to paste into `powers.js` (the `line:` of each row) and the three placeholders.
Numbers are kept as stats: written as digits, the same way every time (CLARITY.md).

| id | label | line |
| --- | --- | --- |
| swap | Swap | `Two 2 x 2 patches of your half trade places` (yours, unchanged) |
| manifest | Manifest | `Turns up to 3 junk or holes in a 3 x 3 into gems of the colour you pick, or the one most round them` |
| scan | Scan | `Shows the aberrant's next skill and puts it off 2 turns` |
| lift | Lift | `Lifts a row or a column of your half and sets it down shifted` (unchanged) |
| herd | Herd | `Gems of one colour within 2 of the row or column you draw come onto it` |
| transmute | Transmute | `Every gem of one colour on your half turns to another, and none of the old colour falls for 2 turns` |
| miracle | Miracle | `One colour's gems on your half clear at any 2 touching, this turn and your next` (yours, unchanged) |

Why each one changed:
- **Manifest** now says where the colour comes from when you don't pick one.
- **Scan** writes the number as a digit, like Transmute's "2 turns" does.
- **Herd** says the line is the one you draw.
- **Transmute** says *which* gems stop falling: `transmute.from`, the old colour. The bare "none falls" read as if skyfall stops altogether.

The placeholders:
- lesson.js `pveSteps`, the step `power`: `Pick a power beside the board, then drag on your half to cast it.` (no "tile": the desk has
  none; it reads true on touch and desk alike)
- tracking/duel.js `duel.power`: `You cast ${label}.` stands. For Scan, use
  `` `You scan the aberrant: its ${label} comes 2 turns later.` ``. It is the same line as before, with the delay said as a number.
- tracking/duel.js `duel.seen`: `You know ${label} now: ${line}.` stands as written.

Hurl: superseded, see 2026-10-29-from-espada-hurl-and-log-words.md. I took the offset clause out of my
foe-skill note and out of Calissa's tooltip note. Delete this note once pasted.
