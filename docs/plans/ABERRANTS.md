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
  at 48 the lantern goes out and the Wisp goes out with it.
  - **The fuel.** 48 since 2026-10-29 (24 before: with several powers a turn it fell in 2.7 turns and was found by chance 9 duels in
    16; PUZZLE-DUELS.md 26.9).
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

(One power a turn, the table above.) With powers paid by the pool and a regen of 8 (PUZZLE-DUELS.md 26.9) the fuel went to **48**:
played for, 13 of 16 in 3.6 turns, the Line 4.2; found by chance 2 of 16. So the secret is now the faster way, as South wants it.

At 24 (one power a turn) the secret was a choice, not a shortcut. Playing for it is as long as playing for the Line, and it is found by chance about one
duel in ten, often enough to be stumbled on and wondered about. Kindle fired about once a duel against a player going for it.

Before this round the Wisp's 5 colours were the first 5 of COLOURS (no Dread on its board at all). A ruleset's `palette` now names
its colours (`paletteOf`, board.js).

## 4. Knowledge, not a gauge

A secret is never said before it is found: no meter, no hint text, no tooltip. Its progress is drawn only on the thing it is about.
Once found (`game.foeSeen.found(id)`, kept like a foe skill seen), the view may draw its progress plainly in the next duel: a lit
count on the lantern, the System's type. The Codex's bestiary entry may then name it. Practice counts (knowledge is not the ledger's):
the lectern's Wisp board is where it can be rehearsed. The achievement (`du9`, "Lights Out", a placeholder) names what you did
without naming how.

## 5. The second: the aberrant slip jelly (South, 2026-10-29)

South: "I'd agree the slip jellyfish should be next, and it should throw a LOT of junk, but its easy to clear. The weakness could be being
highly susceptible to a well timed Transmute that converts the piled up junk for an OHKO." Every blotling is an aberrant slip jelly
(world/ground/stains.js), so this is the board they bring (`KIND_RULESETS.slipjelly`), and the lectern can rehearse it (`PRACTICE.jelly`).

- **Board.** 12 x 10 (the Wisp's 12, a row taller: at 9 a half-skilled player drowned). Gall's colours: Wonder, Mirth, Desire, Gall and
  Grief. No colour it is weak to (`weak: false`): its weakness is the Transmute.
- **Its junk is slime** (`slime: true` on a junk piece): itself, thrown at you. It breaks beside a clear as any junk does, so it is easy
  to keep down. Manifest takes it as junk.
- **Foe skills.** Hurl 3 every turn; **Spew** (its own) 7 every 3rd; Reclaim every 5th; **Harden** (its own) wakes once the pile is past
  0.6 of the secret's need and sets 4 slime into plain junk every 2nd turn. Its desperate flare: Spew 9.
- **Secret: dissolve it** (`secrets.js` `dissolve`). Let the slime pile, Transmute it (a slime cell picked: every slime on your half
  turns to gems of the colour you pick), and clear 9 of those gems in one turn. With nothing left to hold it together, the jelly falls
  apart.
  - **The tell.** The jelly shrinks as its slime piles on your half (`k`: the pile against the need). "The slip jelly sags" once it is
    past 0.6.
  - **The cost.** A half full of slime is a half near full (a side that cannot take what lands has lost) and pushes nothing.
  - **The answer.** Harden: wait too long and the pile sets into junk a Transmute cannot turn.
  - **The timing.** Transmute the turn after a Spew.
  - Prior art: Puyo Puyo's garbage sent back, Tetris 99's counter, Kirby swallowing what is thrown, Pokemon's Counter.
- **Its two deaths** (Calissa's to look, Petra's to time). The Line's: the jelly bursts into its slime. The secret's: its slime runs off
  your half back into it and it slumps flat.

### 5.1 Measured (`scratchpad duel/powers.mjs` and `jelly.mjs`, 32 duels a row, powers paid by the pool, regen 8)

| board | strong (P 1), at the Line | half-skilled (P 0.5) | the secret, Transmuted the turn after a Spew |
| --- | --- | --- | --- |
| 12 x 9, Hurl 3, Spew 7 | 31 of 32, 4.2 turns | 12 of 32 | 13 of 16, 3.4 turns |
| 12 x 9, Hurl 2, Spew 6 | 32 of 32, 4.3 | 14 of 32 | 6 of 16, 5.6 |
| **12 x 10, Hurl 3, Spew 7 (built)** | 32 of 32, 4.2 (secret by chance: 0) | 20 of 32, 6.5 (11 by the secret, by chance) | 16 of 16, 3.4 |
| 12 x 11, Hurl 3, Spew 7 | 32 of 32, 4.0 | 27 of 32 | 13 of 16, 4.1 (no faster than the Line) |

The secret's need: 9 (played for: 13 of 16 at 12 x 9; at 8, 15 of 16 but found by chance 3 of 16 by strong players; at 10, 9 of 16).
The pile tops out near 10: slime breaks beside every clear, which is what "easy to clear" means here. A random player loses every duel:
the flood is the jelly's threat.

### 5.2 The next (parked until South picks)
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

## 8. A secret's reward: a learned skill (South, 2026-10-29)

"The secret is a faster way to win, maybe we can evaluate drop tables of Soul Alchemy materials, cosmetic drop? Learning special
abilities? ... I'm all for learning abilities from enemies." Each aberrant teaches one skill (`duel/learned.js`), cast as a power: the
feat way is its secret found once, the count way 5 beaten at the Line. Kindle is the Wisp's (PUZZLE-DUELS.md 26.10).

**The slip jelly teaches Absorb** (Dovina's call, South left it to her, 2026-10-29): every junk (slime too) in a 3 x 3 drunk off your
half, 3 to the pool each; 5 to cast, rests 3, Possession. A jelly takes in whatever is thrown at it, and so do you. It answers a Hurl and
pays for the next power. Against the jelly itself it eats the pile its secret wants, so there it is a choice. Its Spew turned around
would throw junk at the aberrant's half, which the PvE duel keeps frozen; Absorb works on your half, where play is.

A cosmetic opened by the secret: the Wisp's lantern pendant for the Pneuka Jar (`pendant.lantern`, cosmetics.js; Calissa draws it).

## 9. What an aberrant leaves, and the shiny ones (South, 2026-10-29)

"Material drops for aberrant fights is a go. Also tell calissa to apply the inverted palette modifier shader on aberrants at a 10%
chance. They'll be like our shiny versions." (`progress/duel/drops.js`.)

- **Drops.** A won duel leaves Soul Alchemy materials of the aberrant's own kinds on top of what draining it gives: the Wisp arcane relics
  and eldritch artefacts (a lamp's glass, an idol's dark), the slip jelly provisions and finery (what it swallowed, its slime's pigment).
  - The Line: 2 rolls on the plain table (tier 0 55%, 1 30%, 2 12%, 3 3%).
  - The secret: 2 rolls on the richer table (20%, 42%, 26%, 10%, 2% for tier 4).
  - A shiny: 1 more roll at tier 3 or better.
  - Practice and a flight pay nothing.
- **Sized** (a material is worth 1 + its tier minutes of play): the Line about 3.3 minutes' worth for a duel of about 4 real minutes, the
  aim; the secret about 4.7 in a shorter duel, about 1.4 times the aim a minute (playing well pays 1.5x); a shiny's about 7.3.
- **The shiny.** One aberrant in ten goes wrong shiny (`SHINY.chance`, `rollShiny`, rolled where it goes wrong: Petra's), drawn in its
  colours inverted (Calissa's AberrantInversion, kept until now as a placeholder look). A look and a richer drop only, never a harder
  fight. Counted (`duel.won.shiny`), a slot in the collection log, an achievement (du11).
- Prior art: Old School RuneScape's drop and rare tables, Monster Hunter's capture and break rewards, Pokemon's shiny, Diablo's champions.

## 10. Asked of the divisions (handoffs in `docs/handoffs/<name>/`)

- **Petra:** roll `rollShiny` where an aberrant goes wrong (a Wisp's `goWrong`, a blotling at its blot) and set `c.shiny`; carry `shiny` on
  `duel.end`; Absorb armed as a cell (as Manifest is); the lectern row's words (Espada's: "An aberrant slip jelly's board: slime, and a lot
  of it."); the jelly's two deaths timed.
- **Calissa:** a shiny aberrant drawn inverted in the world and on the duel's idol (`c.shiny`); the drops' moment (`duel.drop`); Absorb's
  tile and cast; still standing: the jelly's looks, Kindle, each side of the tsuitate its own, the regen's readout on the tube.
- **Wanda:** a shiny's sting (Pokemon's sparkle, in the house's voice) at the duel's open; the drop's chime; Absorb's gulp.
- **Espada:** Absorb's words, du10 to du13, the drop line, the shiny's name.
