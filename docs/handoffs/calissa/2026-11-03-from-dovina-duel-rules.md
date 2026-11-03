# The duel's new rule modules: what each new piece is, and what the kernel says (from Dovina, 2026-11-03)

PUZZLE-DUELS.md 27. Every new piece is a **base kind** (`gem` or `junk`) with an `extra` tag and a `look` field naming the existing piece to
draw it as, so the view draws all of them today with no change. Nothing here is required for the board to play; each line below is what
you would dress. A piece's `colour` is its gem colour as always; `p.look` and `hasTag(p, tag)` (`progress/duel/board.js`) are the reads.

## Pieces (state: `board.at(x, y)`)
| piece | what it is | tag / props | draws now as |
|---|---|---|---|
| crash gem | a gem of a colour that breaks the touching group of its colour and itself | kind `gem`, extra `crash`, `look: 'gem'` | a gem of its colour |
| rainbow | breaks every gem of the colour it touches most on its side | kind `gem`, extra `rainbow`, `look: 'bomb'`, `colour: 'wonder'` (only so an unaware view draws a gem) | a Wonder gem; draw it as a bomb-sized prism |
| magnetic gem | an ordinary gem that draws its colour closer each turn | kind `gem`, extra `magnet`, `look: 'gem'` | a gem |
| virus | a fixed gem (no `falls`), cleared only in a match | kind `gem`, extra `virus`, `look: 'gem'` | a gem |
| hard junk | junk that takes `hits` (2) breaks | kind `junk`, extra `hard`, `hits` 2 then 1, `look: 'junk'` | junk (show `hits`: a crack at 1) |
| sticky junk | hard junk that does not fall | as hard junk, no `falls` or `pushable` | junk |

Floors (`board.floor[board.idx(x, y)]`, drawn under the pieces): `'ice'`, `'belt:E'`, `'belt:W'` (also the existing `'plain'`, `'wall'`).
The rule is "a piece dragged onto ice slides on", "a piece on a belt moves a cell each turn end"; the floor should say it.

Also on the board for a moment: `board.sweepSpan = { side, x0, x1 }` while the sweep's settle runs (the columns the bar passed).

## Events (the settle's list, in order; each with `side`)
- `clear` / `break` gain `special: 'crash' | 'rainbow' | 'virus'` when the piece was one (the tell: a crash gem's burst, a rainbow's sweep
  through its colour, a virus cured).
- `junk.crack { id, at, hits }`: hard junk hit once, not broken (a crack on its face).
- `slide { id, from, to }`: a piece slid on ice. `belt { id, from, to }`: carried a cell. `pull { id, magnet, from, to }`: a magnet drew a gem.
- `sweep { x0, x1 }`: the bar crossed those columns at a side's turn end (the squares break as ordinary `clear` events after it).
- `launch { n, from: [cells], to: [cells] }`: pieces thrown across the Line (they become junk at `to`, landed at once, the Line unmoved).
- `grabthrow { from, to, ids, n }`: the classic duel's lane throw (not in the one-gesture or PvE duel).
- `corrode { id, from, at }`: junk turned a gem beside it to junk (`from` the junk, `at` the gem).
- `virus.cured { side, bonus }`: a half cleared of its viruses (bonus junk sent once).
- `whistle { side, left }`, then `duel.fled { how: 'whistle' }`: the Wake Whistle; the duel ends whole. A look for it is yours if you want
  one (a clay whistle cracking, the board folded, as the flee's).

## The feelings' boards now (so the domains' clash can lean on them)
Wonder: diagonal runs, rainbows, a sweeping bar. Mirth: ice, launches. Desire: magnets. Fury: crash gems. Gall: hard junk, rot, viruses.
Grief and Dread as before. `RULESETS[feeling]` is the board a blotling of that grade brings.

## Not built
**Rules as tiles** (G185) needs rulings first (PUZZLE-DUELS.md 27.4); no tile piece exists yet.
