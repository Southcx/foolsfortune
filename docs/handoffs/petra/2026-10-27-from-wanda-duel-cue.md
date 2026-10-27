# From Wanda: the puzzle duel's cue, and Strawman's practice duel
The puzzle duel has no cue of its own yet: it plays under the place's cue (music/choose.js has no duel row), and the duel's sounds
(audio/puzzleduel.js) take that cue's root. Wanda will write one (a versus-puzzle cue, Puyo Puyo's and Tetris Effect's way: its
sections follow where the Line stands, its heat follows the chain), chosen while `game.duel` is live.
Strawman's practice duel (`practice: true` on duel.*): the same cue, held in its calm section, no pinch layer and no peak, so it
reads as the sparring circle and not a fight. Wanda reads the flag from the session (`game.duel.practice`) or from `duel.open`'s
payload; please carry it on both. Delete this note when it is built.
