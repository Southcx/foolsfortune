# Aberrants: every puzzle duel an Elite fight

South, 2026-10-28: "each Aberrant should be structured like its own fully unique puzzle with a secret win condition, and really the
fight should have an identity representative of the Aberrant itself. The lantern wisp is a step in the right direction, but I feel like
we can resonate across many more layers, from the style of the Zone of Influence to the special attacks and cut-ins used, to a bespoke
death cinematic to conclude the fight. Puzzle duels are like Elite fights."

The rules are Dovina's (`src/progress/duel/`). Each layer below names the division that builds it. Every design space opened here also
gets a row in `DUEL-DESIGN-SPACE.md`.

## 1. What "Elite" means here (prior art)

- **Slay the Spire's elites.** Rarer and harder than an ordinary fight. Each has one rule that changes how you play it: Gremlin Nob
  punishes skills, Lagavulin sleeps until woken, the Sentries alternate.
- **Monster Hunter's monsters.** Each fight is its own animal: its parts to break, its tells, its turf, and a second way to end the
  hunt (the capture).
- **Shadow of the Colossus, Zelda's bosses, Metroid Prime's scan.** You beat the thing by reading its body.
- **Hollow Knight's and Dark Souls' boss deaths.** Each ending is its own.

So an aberrant is a puzzle with an author. The shared rules (the board, the drag, the powers, the Line) are the grammar, and each
aberrant is a sentence in it.

## 2. The Elite format: the layers every aberrant fills

| layer | what it is | whose | where |
| --- | --- | --- | --- |
| 1. The board | size, gravity, palette (`palette`: its own colours, its feeling and its weakness among them), fog, embers, skyfall | Dovina | `rulesets.js` |
| 2. The Zone of Influence's style | its half of the board drawn as its mind: the domains' clash on its side, its ground, its pieces' look, its own fog or light | Calissa | `vfx/duelview/domains.js` and the aberrant's own file |
| 3. Its foe skills | the shared five where they fit, plus one or two of its own; their countdowns; its desperate flare | Dovina (rules), Espada (words) | `foeskills.js`, `rulesets.js` `foe` |
| 4. Its cut-ins | its portrait and band for each skill; its limit break in its own look | Calissa | `vfx/duelview/cutin.js` |
| 5. Its sounds | its duel cue's own colour, a sting for each of its skills, its secret's tell | Wanda | `audio/`, `music/duel.js` |
| 6. Its secret win | a second way to end the duel, never said: a tell on its body, a cost, and its answer (a skill that wakes once the secret is half done) | Dovina | `secrets.js` |
| 7. Its two deaths | a bespoke cinematic when the Line reaches its wall, and another when its secret is done | Calissa (look), Petra (timeline), Wanda (sound), Espada (the log line) | its own cinematic file |
| 8. Its words | its skills' labels and lines, its secret's lines (the tell, the end), its two deaths' log lines | Espada | `tracking/duel.js`, `foeskills.js` |

## 3. The first: the aberrant Lantern Wisp

- **Board.** 12 x 9. Your half falls; its half burns upward (frozen in the PvE duel). Its palette is Wonder, Mirth, Fury, Grief and
  Dread: its own Dread, which it resists (half to the Line), and Fury, its weakness (1.5). Dread's fog covers its half except within
  its lantern's light. Its junk lands as embers.
- **Zone of Influence.** The fens at night: its half dark water under fog, the lantern the only warm light. As the secret goes, the
  dark closes in on the lantern (Calissa's).
- **Foe skills.** Hurl (embers), Petrify, Seal and Reclaim. Its own: **Kindle** (`kindle`), which burns up to 3 of your Dread gems
  into embers every 2 turns. Kindle wakes only once the lantern is half spent. Its desperate flare: Hurl 5 and Petrify 4 at its last
  2 columns.
- **Secret: snuff the lantern** (`secrets.js` `snuff`). Its lantern burns on Dread. Every Dread gem you clear is fuel taken from it;
  at 24 the lantern goes out and the Wisp goes out with it.
  - **The tell.** Its light shrinks from 3 cells to 2, 1 and 0. The fog on its half closes in on its body (the board's own fog,
    `dread.js` `lightOf`), and the log says "The lantern gutters." once it is half spent.
  - **The cost.** Dread clears push the Line half as far (it resists its own feeling).
  - **The answer.** Kindle, as above.
  - **The powers it rewards.** Transmute a colour into Dread; Miracle on Dread; Herd Dread onto a line.
  - The will-o'-the-wisp of the fens is a light that leads you astray. You don't beat one by chasing it; you put it out.
- **Its two deaths.**
  - **The Line's:** its lantern cracks and its flame scatters as a Figment's scatter.
  - **The secret's:** the lantern gutters, the Wisp's flame is drawn down into it, the fog swallows the light, and the frame holds in
    the dark a beat.
  - Both are Calissa's to look and Petra's to time. The kernel ends the second with `duel.secret`.

### 3.1 Measured (`scratchpad duel/powers.mjs`, `SECRET` weighs the fuel; 16 duels a row; K is the drags a stand-in weighs a turn)

| fuel | stand-in | secret wins | turns |
| --- | --- | --- | --- |
| 8 | for the Line (K 2) | 0 (the fuel ran 7.3 a duel by chance, the Line first) | 3.4 |
| 8 | for the secret | 16, in 1.8 to 2.1 turns (Transmute to Dread, then Miracle on it): far too fast | 2.1 |
| 18 | for the Line (K 2 / 12) | 5 / 3 by chance | 4.5 / 5.8 |
| 18 | for the secret (K 2 / 12) | 11 / 13 | 5.6 / 4.4 |
| **24 (built)** | for the Line (K 2 / 12) | 1 / 2 by chance | 5.6 / 6.4 |
| **24 (built)** | for the secret (K 2 / 12) | 10 / 13 | 5.3 / 5.2 |

At 24 the secret is a choice, not a shortcut. Playing for it is as long as playing for the Line, and it is found by chance about one
duel in ten, often enough to be stumbled on and wondered about. Kindle fired about once a duel against a player going for it.

Before this round the Wisp's 5 colours were the first 5 of COLOURS (no Dread on its board at all). A ruleset's `palette` now names
its colours (`paletteOf`, board.js).

## 4. Knowledge, not a gauge

A secret is never said before it is found: no meter, no hint text, no tooltip. Its progress is drawn only on the thing it is about.
Once found (`game.foeSeen.found(id)`, kept like a foe skill seen), the view may draw its progress plainly in the next duel: a lit
count on the lantern, the System's type. The Codex's bestiary entry may then name it. Practice counts (knowledge is not the ledger's):
the lectern's Wisp board is where it can be rehearsed. The achievement (`du9`, "Lights Out", a placeholder) names what you did
without naming how.

## 5. The next aberrants (parked until South picks)

Each needs a creature in the world first. The slip jelly and the clapperjar are the candidates. Sketches only:

- **Slip jelly (Gall?).** Its half is one mass that grows back into holes. Secret: split it, by clearing the column under its core in
  one turn.
- **Clapperjar (Mirth).** It claps on the beat. Secret: clear on its rhythm, three turns in a row, keeping the Crucibelle's time.
- **Strawman (practice).** A plain secret that teaches the idea, "clear every colour once", shown plainly from the start.

## 7. Your half: the Spirit Garden (South, 2026-10-28)

South: "the Courier/pneuka jar's Zone of Influence should be a representation of their Spirit Garden". The Spirit Garden is the world
inside your Pneuka Jar, and in a duel you stand as the Jar. So when two minds clash, the domain you bring is the one you grew. The
aberrant's half is its feeling's weather; yours is your garden, read at the duel's open by `game.gardenBackdrop()`
(`progress/gardenbackdrop.js`):

- **Season and hour:** the season's palette and the time of day.
- **Harmony:** a calm garden (bloom) or an overgrown one (briar, its thorns at your side's edge).
- **Decor:** the three sets and six pieces you placed most.
- **Spirits:** up to four bound spirits standing at your side, in their feelings.

A new save's garden is bare (`bare`), so its half is the deep and the film as before; it fills as the garden does.

**A look only.** Nothing in the garden changes a duel's rules ("base change bad"; the Spirit Garden is in flux), and it adds no reason
to tend the garden for a fight (South: no new reasons yet). Parked for later: a bound spirit lending a hand in a duel.

## 6. Asked of the divisions (handoffs in `docs/handoffs/<name>/`)

- **Petra:**
  - the session counts `duel.secret` as an end (`how: 'secret'`);
  - puts the kernel's `secret.step`, `secret.half` and `duel.secret` on the bus as `duel.secret { id, k, half?, done?, by: 'courier' }`;
  - times both deaths as cinematics before the board folds.
- **Calissa:**
  - your half of the clash as your Spirit Garden (section 7, `game.gardenBackdrop()`);
  - the Wisp's Zone of Influence (the fens), its lantern dimming with `lightOf`;
  - Kindle's cast and cut-in;
  - its two deaths;
  - after `found`, the lantern's plain count.
- **Wanda:** the lantern's guttering under the cue as it dims (k), Kindle's sting, the snuff's silence, and the Wisp's cue's own colour.
- **Espada:** Kindle's label and line, the secret's two log lines (the half's tell, the end), `du9`'s name and words, and the two
  deaths' log lines.
