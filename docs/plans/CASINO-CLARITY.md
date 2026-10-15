# Raku's tables, made clear

The owner's brief, 2026-10-15: *"I can't reliably tell how I'm supposed to play ANY of the games in Raku's casino."*

- **The bar:** if a nine-year-old couldn't work a game out within two minutes, it is too complex an explanation and too obtuse a UI.
- **The look:** the Lachryma labradorite, all-out.
- **Size and colour:** every element readily identifiable, colour-coded, and sized by its importance.
- **Seat colours:** the board-game convention, Red, Yellow, Green, Blue, Purple, Pink, Black, White.
- **Suit colours:** Wands red, Cups blue, Swords green, Pentacles yellow.
- **Text:** an exception to "no text on screen" at the tables, for rules, tutorials and moving numbers. Rolling numbers and slot reels:
  *"imagine what scoring a top-tier hand in Querent should really feel like."*
- **Textures:** the texture budget for cards and dice may grow.
- **Teaching:** a how-to for each game on first play, skippable and replayable.
- **Models:** Slay the Spire, Balatro, Monster Train, the online poker clients.

This page is the brief for the round:
- Dovina: the rules side, the coach, the how-tos, this page.
- Calissa: everything drawn, and she reviews what her subagents bring.
- Wanda: the sounds.
- Espada: the words.
- Petra: the gate.

## 1. Why it failed

| What was wrong | What fixes it |
| --- | --- |
| The state lived on a page of text buttons; the cloth showed pieces with no meaning attached. | The coach (4) gives every piece a meaning; the views draw it. |
| Nothing said what to do now. | One line, always, in the turn banner (4). |
| The goal was nowhere on screen. | The goal bar (4), with how near you are and the leader. |
| No choice said what it would do. | Every choice carries a preview (Monster Train). |
| The other seats were faceless. | Seats in colour and shape with their key numbers (Slay the Spire's intents). |
| Everything was the same size. | A size ladder per game (5). |
| No way to learn without losing chips. | Practice tables, free (7). |

## 2. What was taken, and from where

- **Monster Train**: the result of a turn is worked out and shown before it is committed. Laura Michet calls it the game's "major clarity
  feature" ([blog](https://blog.lauramichet.com/monster-train-2/)). Every move here carries a `preview`.
- **Balatro**: the hand's name shows as soon as the cards are chosen, and the score is counted up piece by piece, chips times mult, each
  scoring piece lit in turn as it adds, under a rolling counter, sound and shake that grow with the number
  ([GMTK](https://gmtk.substack.com/p/balatros-cursed-design-problem); [a design guide](https://blakecrosley.com/pt-BR/guides/design/balatro)).
  Querent's score is the owner's own formula (designed years before Balatro), and it splits the same way: tier × (1 + bonuses) ×
  multipliers. That is the count-up (8).
  *Not taken:* Balatro hides the final number before a play (GMTK: it keeps the game "about vibing"). For a nine-year-old we show it.
- **Slay the Spire**: each opponent's next act is shown over its head, and every keyword is explained on hover. Here, each seat's key
  numbers are on its plate, and every Major Arcana, tile power and die is explained on hover.
- **Online poker clients**: the seats ring the table, each with its stack under it. The action buttons sit big at the bottom with the
  price printed on them. The pot is central. Clients offer a four-colour deck so suits never blur. Here: the choices are buttons with
  their price and stake on them, and the suits have four colours.
- **Hearthstone and Mahjong Soul**: playable pieces are lit, and a call button appears only when the call is possible. Calissa's table
  view already lights legal pieces in the labradorite's schiller; keep that.
- **Board-game quick-start cards**: the rules on one side. Each game has a rules card (`HOWTO[game].card`).

## 3. Colour: seats and suits must never collide

The owner's suit colours (red, blue, green, yellow) are four of the seat colours. The rule that keeps them apart:

- **A suit's colour is only ever on a card's face**, always beside the suit's symbol and pip (`SUIT_COLOURS`: Cups blue ♥, Swords green
  ♠, Pentacles yellow ♦, Wands red ♣). A colour is never the only cue.
- **A seat's colour is only ever on a seat's things**: its rim on the cloth, its tokens and chips, its name plate, its dice's tray. Each
  seat also has a shape (`SEAT_COLOURS`: Red ●, Yellow ▲, Green ■, Blue ◆, Purple ★, Pink ♥, Black ⬢, White ○), for the colour-blind and
  for the overlap.
- **Seat 0 is you, Red.** "You" is the warm colour and the labradorite's glow: what is yours is red-rimmed and schiller-lit.

## 4. The coach (Dovina's, `src/progress/casino/coach/`)

For any moment at any table, `session.coach()` returns everything a view needs, in plain words. It reads the rules; it never changes
them.

| Field | What it holds | How a view shows it |
| --- | --- | --- |
| `goal` | `{ text, you: { value, of, label }, best: { seat, value }, round? }` | The goal bar: one line of aim, your progress big, the leader's beside it. |
| `turn` | `{ seat, yours, say, kind }` | The turn banner: "YOUR TURN" in your colour and `say`, one sentence; or whose turn it is. |
| `moves` | `[{ move, label, what, preview, tone, best, size }]`, every legal choice | `label` is the button; `what` says what it does; `preview` what it would bring (a steal that wins the round, a throw that keeps you one card from winning, the odds of a handful of dice, the points a reaction tends to bring, the chance a claim is true). `tone` is good, risk or bad (✔ ⚠ ✖). `best` is the house bot's suggestion, never forced. `size` is big or small. |
| `seats` | `[{ seat, name, colour, shape, you, turn, stats: [{ label, value, big }], badge, ... }]` | Each seat's plate. |
| `centre` | The shared numbers: pot, target, claim, round. | Big, centre of the cloth. |
| `extra` | Each game's own: Querent's `shape` (the hand's groups found: groups, pairs, loose), the arcana in play with their `does`; Event Horizon's dice `select`; Supernova's `last` reaction; Nebula's secret faces. | |

Also on the session:
- `where` ('lobby' | 'howto' | 'table')
- `howto` ({ step, steps })
- `practice`
- `setSpeed(id)`
- `showHowto()`

The fallback page (`world/bazaar/views.js`) is drawn from the coach now; Calissa's cloth reads the same.

**Added for the table view** (Calissa's art brief, section 7, answered 2026-10-15):
- **More fields on the coach:**
  - `phase`: yours, waiting, over or idle
  - `progress`: the goal's `perSeat`
  - `suggested`: the marked move, or null
  - `steps`: the latest outcome as count-up steps, with `at` (its log index), so each outcome is counted up once
- **One goal shape for every game:** `{ label, line, target, unit, perSeat: [{ seat, value }] }`.
- **More fields on each move:** `id`, `line`, `amount` (chips, where a price applies), and `pieceIds` in the table view's own ids:
  - `tile:<seat>:<n>`
  - `h:<rank>.<suit>#<nth>` (the nth of that face in hand order)
  - `ed:<seat>:<sides>:<nth>` (the nth die of those sides among the dice left)
  - `top:<seat>`, `deck`, `fool:<id>`, `rank:<r>`
- **`selectable(moves, chosen)`** answers a pick made piece by piece (the moves still possible, the pieces still choosable, the move it
  completes).
- **A `kind` on every seat stat:** score, money, lives or count.
- **Each Querent seat's `flipped` arcana**, with their `does`.
- **Event Horizon's real `faces`** per seat, now in its view (the same draws as before).
- **A colour per person**, the same at every table (`coach/seats.js` `PERSON_COLOURS`): you Red, Raku Black (the house), Clink Yellow,
  Celadon Green, Crock Blue.
- **The how-to steps** also carry `{ line, target, wait, demo }`. `target` is a role (goal, hand, moves, seats, centre, dice, tiles,
  claim, tell), and the table view resolves it to its own pieces.
- **The count-up's steps and scale:** `coach/ceremony.js`. Querent's two biggest bonuses come first and the rest are rolled into one.
  `SCALE` holds each game's median and 90th percentile.
- **The suggestion is a knack**, Raku's Whisper (a working name). The design laws say an assist is earned and switchable: it opens after
  three practice games finished or one game won, and practice tables always show the suggestion, since practice is for learning.

## 5. Each game: the two-minute version, and the size ladder

The ladder lists each game's elements largest first: the goal and what is yours, then the shared numbers, then the opponents, then
decoration.

### 5.1 Querent
- **In two minutes:** make 3 groups of 3 (3 of a number, or 3 in a row; colours don't matter). Take 1 card, throw 1 back. Stealing gives
  the robbed player a Major Arcana. Win the round with 3 groups; 4 rounds; most points wins.
- **The ladder:**
  1. your hand, with its groups shown as groups (gold brackets), pairs (a thin rim) and loose cards
  2. the turn banner and the choices
  3. your score and the round
  4. each discard pile's top card, at stealing size, the one you could steal lifted
  5. the opponents' plates: points, arcana, steals left, Fate Clause badge
  6. the draw pile and the Major Arcana piles
- **What a nine-year-old needs to see:** which cards already make groups. The coach finds them (`shapeOf`). For each throw, how many
  different cards would then win (`waitsAfter`), shown as a small number on the card. A Major Arcana card shows its one line (`does`)
  under its name, always.
- **The count-up** when a hand wins: see 8.

### 5.2 Zodiac
- **In two minutes:** shut your 12 tiles first. Your two dice shut tiles that add up to their sum OR their product. Your gold attack die
  reopens others' tiles. Doubles give a prize.
- **The ladder:**
  1. your 12 tiles, big
  2. the three dice: two white, one gold
  3. the choices, each lighting the tiles it would shut
  4. the opponents' tiles, smaller
  5. the pot
- **The moment:** hovering a choice lifts and lights the very tiles it names. The sum and product show as an equation over the dice:
  "3 + 4 = 7 · 3 × 4 = 12".

### 5.3 Event Horizon
- **In two minutes:** the house shows a target. Throw some of your dice to land on it exactly. Over, and you're out. Each die once a round.
- **The ladder:**
  1. the target, very big
  2. your total and what you need
  3. your dice to pick from, each lit when chosen
  4. the odds of your chosen handful: "Hit exactly 18% · Go over 40%"
  5. the others' totals
  6. the house's dice count (par)
- **The moment:** the chosen handful's odds update as each die is picked. A hit stamps the bonus (×1, ×3, ×5) over the pot.

### 5.4 Supernova Run
- **In two minutes:** start with four d6. Roll all for points (a top number copies the die, a 1 shrinks it), or fuse two dice into a
  bigger one, or split one. A d20 that rolls 20 is a SUPERNOVA: points ×2, everyone's dice reset. 500 wins.
- **The ladder:**
  1. your dice
  2. your points against 500
  3. the choices: the reaction's expected points and Supernova chance, a fuse's result
  4. the others' points and dice
- **The moment:** the reaction plays out die by die. Copies split off like cells; shrinking dice crack; the points roll up as each die
  settles. A Supernova is the room's biggest moment: the table flares in the labradorite, everyone's dice blow back to d6, and the
  points double on a reel.

### 5.5 Nebula Bluff
- **In two minutes:** you hold 6 secret dice; add them up (a top number +10). Claim what your hand is worth, honest or a bluff. Next:
  claim higher, call the bluff, or fold. A caught bluff loses 2 dice; a wrong call loses the caller 2. Last with dice wins. Watch for
  tells.
- **The ladder:**
  1. your secret hand and its worth
  2. the claim on the table and who made it
  3. the choices: each claim's price and whether it is a bluff, the call's odds
  4. the others' dice counts
  5. the pot
  6. the tell: the claimant's top chip wiggles. Calissa's riffle; later, on the folk's bodies, if they come to sit.
- **The moment:** a call flips the claimant's dice face up one by one, totting up against the claim like a slot reel, and stops on
  CAUGHT or TRUE.

## 6. The how-tos (`src/progress/casino/howto.js`)

Four to six steps per game, a nine-year-old's words (drafts for Espada), each step pointing at the part of the table it is about (`show`:
goal, hand, moves, seats, centre, dice, tiles, claim, tell). Calissa's view spotlights that part and dims the rest, with a short line
under it.

- **When it plays:** the first time you sit at a game, before any chips change hands. After that it is a click away: "How to play" in
  the lobby and at the table, and `/howto` on the chat line.
- **Skip:** on every step.
- **Seen:** counted on the ledger (`casino.<game>.howto`), never a flag. Progress resets with the build, so a new build teaches again.
- **At the end:** play for chips, or practise first.

## 7. Practice, speed and the lobby

- **The lobby:** F at a table opens it, not the game. It holds the game's one-line pitch, the rules card, Play for N chips, Practise
  (free), How to play, and the table speed.
- **Practice:** no chips in, none out, nothing counted toward wins (`casino.<game>.practised` instead). The purse games are played with
  the table's play money.
- **Speed:** the folk's pace between moves is Normal 0.6 s, Fast 0.25 s, or Fastest 0.08 s. It is a setting (save section
  `casinoPrefs`, scope settings).
- **The suggestion:** marked on the move the house bot would make, in gold. It is never forced, and skill still pays: the bots are
  middling.

## 8. Moving numbers: the count-up

The owner's exception allows rolling numbers and reels. The rule is that **a number that changes is seen to change**. A total rolls from
old to new, never jumps. A big score is counted in its parts.

- **Querent's winning hand.** `casino.play { what: 'hand', steps }`, from score.js `best().steps`, gives the score in counting order:
  `{ op: 'base', n: 1000 | 2000 | 8000, why }` first, then every `{ op: '+', n, why }`, then every `{ op: 'x', n, why }`. The count-up:
  1. **Two boxes** (Balatro's chips and mult): BASE, the tier's value, set with the hand's name; and MULT, starting at 1.
  2. **Each `+` step** lights its reason under the hand ("no steals", "the Magician: 2 aces") and ticks MULT up by n. Each tick is a
     note higher (Wanda).
  3. **Each `x` step** slams MULT times n, bigger: "Strength ×2", "fortune favours ×4".
  4. **The boxes multiply into the total** on a slot reel, digit by digit from the right.
  5. **The flourish follows the tier:**
     - tier 1: a chime
     - tier 2: the cloth's sigil flares
     - tier 3 (8,000 base, 0.5% of hands): the whole hall's neon goes labradorite, the screen shakes in proportion, and the number
       holds big before it banks into your score
- **Supernova.** Each die's face flies to the pool as it settles; the pool rolls. A Supernova's doubling is its own reel.
- **Event Horizon.** The thrown dice's sum rolls into the total; a hit stamps ×1, ×3 or ×5 over the pot, and the bonus counts into it.
- **Nebula.** A call or reveal tots up the shown dice against the claim, reel-style, and stops on CAUGHT or TRUE.
- **Chips.** Every change of your chips rolls (the cage and every result).

## 9. Who does what

**Dovina (built this round):**
- the coach, its five games
- seat and suit colours as data
- Querent's score steps on the event
- Supernova's `reactHand` for odds
- the how-tos and their ledger
- the lobby, practice, speed and `/howto`
- the fallback page rewritten on the coach
- this page

**Calissa:**
- everything drawn on the cloth and around it, read from the coach: the size ladders (5), seat colours and shapes (3), the goal bar, the
  turn banner, the choices on or by their pieces, hover tooltips, the how-to's spotlight, the count-up and reels (8)
- the labradorite all-out
- bigger and more legible cards (big corner rank and pip, suit colour and symbol) and dice (big faces)
- reviewing what her subagents bring

**Wanda:**
- the count-up's rising ticks
- the reel's spin and stop
- the tier flourishes
- a Supernova's boom
- a bluff caught or a claim true
- the how-to's soft step

**Espada:** the how-tos' words, the rules cards, the coach's lines (strings only: `coach/*.js`, `howto.js`), at a nine-year-old's reading
level.

**Petra:**
- the texture budget raised for the house deck and dice (the owner's word)
- the text exception recorded in CLAUDE.md
- the gate
