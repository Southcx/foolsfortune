# Entropy Tactics: a design pass (Fatelink merged in)

Dovina's pass over the owner's two drafts, 2026-10-15: *Project Entropy Tactics* (the outline) and *Astroll: Fatelink* (the older draft
the owner called its predecessor: "Entropy Tactics is a newer, more refined version. Please merge them."). Nothing is built yet. This
page says what the game is, what each draft gives the merge, where I push back, and the questions only the owner can answer. The
answers go into section 6; then a rules engine is built on the casino's table engine (`src/progress/casino/table.js`), as the other
games were.

## 1. The game in one breath

Two Major Arcana duel across a 7 x 7 board. In the middle sits the **Grand Bomb**, a d20 counting down. Each turn you draw five Minor
Arcana and turn the hand into power. A **straight or flush summons** a token onto your ranks. A **pair or more of a kind casts** a spell.
A **court card enchants** a token. Anything else you **feed** to your **Hungry Die**, the bank that grows from a d4 to a d20. Then you roll
the Hungry Die to **push** the bomb toward the enemy, or to **count it down** where it stands. When the bomb goes off, whoever's zone it
sits in loses. So does whoever's Arcana runs out of health.

The spine is the owner's own and the best idea in the drafts: **poker hands are a spell grammar**. Runs make bodies, sets make blasts,
royalty makes upgrades, and junk is fuel. Nothing in a hand is dead.

## 2. What each draft gives the merge

| From | Kept | Why |
| --- | --- | --- |
| Entropy Tactics | the 7 x 7 board, zones (three ranks each, the fourth neutral), tokens by suit (Rogue, Healer, Mage, Warrior), direct spells, court enchantments, the Hungry Die, the Grand Bomb's counter, the advantage colour, the showdown opener, deck cycling at half your health, the 2^(n-1) cost for one token's extra actions, what is hidden and shown | it is the refined version, the owner's word |
| Fatelink | the **Major Arcana as your character**: health, a passive, three actives and an ultimate; **actives unlocked by how deep the bomb is in your zone** (zone 1, 2, 3); the archetype axes (speed, synergy, complexity, interaction); **the Fool's kit** as the template for every class; the clockwise push for three or more players | the class kit gives each player an identity, and the zone unlocks are a comeback: the closer you are to losing, the more of your kit is awake (Inscryption's scale, as the owner cited) |
| Fatelink | **its hand-to-power table** (high card 1, small straight 1, pair 2, small flush 2, small straight flush 3) becomes **what feeding pays** | merged with the Hungry Die (section 3, a): one bank, and the ramp the table was written for |
| Fatelink | *dropped:* the one-lane board, the separate attack and resource dice, the simultaneous hidden Push/Countdown | the board replaces the lane; one die replaces two (3, a); a clash is resolved openly (3, f) |

## 3. Where I push back

**a. One bank, not two.** The drafts carry resource points (Fatelink) and action points (the Hungry Die), plus an attack die, a resource
die, token dice, the bomb's counter and the Arcana's health. That is seven numbers a turn before the board. Proposal: **the Hungry Die is
the only bank and the only roll.** Feeding fills it (Fatelink's table: a made hand feeds more than loose cards). Its fill pays for
abilities and token actions. Its denomination is your push and countdown die. The class's "attack die" and "resource die" become how a
class feeds or rolls (the Fool's passive re-rolls the Hungry Die).

**b. Ship four classes, not twenty-two.** At a passive, three actives and an ultimate each, 22 classes are 110 abilities, and every one of
them has to be balanced against the rest. Proposal for v1, one class per corner of the owner's axes:
- **the Fool**: tempo, cycling; the template, already drafted
- **the Chariot**: aggro, straights, hit and run
- **the Empress**: ramp, token investment
- **the Hermit**: control, scrying, deck search

The rest come in waves of four, each measured against the field.

**c. The Royal Straight Flush token.** "A token of godlike strength. This token cannot be destroyed." An unkillable token does not win a
game; it makes the rest of the game a formality, which is worse. Proposal: **a Royal Straight Flush detonates the Grand Bomb in the
opponent's zone: an instant win**, the jackpot of a game that lives in a casino. It is rare enough to be a story, not a strategy.

**d. Push needs a formula on the page.** The outline's "integer multiples of the defending die's denomination, minimum one tile" reads as
`tiles = max(1, floor((attack - defence) / defender's denomination))` on a won clash, with ties going to the bomb's advantage colour. I'd
pin that, and say what an adjacent token adds to a push or a defence: its own denomination rolled? (Q4)

**e. The win conditions, in one place.** The bomb goes off in your zone: you lose. Your Arcana's health hits 0: you lose. The bomb goes
off in the neutral rank: the higher health wins (Fatelink's rule 10). A Royal Straight Flush: you win (c).

**f. A clash is open.** Fatelink hid Push and Countdown and revealed them together (a guessing game). Entropy Tactics resolves a Push and
lets the defender answer with a Defend. I'd keep the open clash: the board already holds hidden information (hands, the Hungry Die's
history), and a guess stacked on top makes the bomb feel random.

**g. Things that are good and stay as written.** The 2^(n-1) cost for a token's extra actions (no one-token blitz). The Rogue's double
damage both ways in enemy ground. The Mage that cannot move. The court enchantments matched to suit (sixteen small rules a player meets
one at a time). Deck cycling at half your health (the clock behind the clock). The Hungry Die's munch history hidden while its count is
shown.

**h. The expensive part is the opponent.** A bot that plays a hidden-hand tactics game well is a search problem: information-set Monte
Carlo tree search, guessing the hand you might hold. The rules engine is days of work; the bot is the real job. It is worth it because
Raku's table needs an opponent with a style, and the simulator needs one to measure the classes against each other.

## 4. What is taken, and from where (prior art)

The owner's two drafts. Then:
- **Duelyst:** a general with health on a small board, units summoned near it. That's our Major Arcana and tokens.
- **Inscryption:** the scale as the clock (the owner's own reference).
- **Into the Breach:** a small board where every threat is shown before it lands.
- **Magic's commanders and Hearthstone's hero powers:** a character's kit.
- **Video poker:** the hand and its one exchange.

The poker-hand grammar is the owner's own.

## 5. Questions for the owner

1. **One bank?** Fold resource points into the Hungry Die (3, a)?
2. **The Royal Straight Flush:** an instant win (3, c), or cut?
3. **The first four classes:** the Fool, the Chariot, the Empress, the Hermit, or your pick?
4. **What does a token beside the bomb add to a push or a defence?** Its denomination rolled, a flat +1, or its health?
5. **The bomb's counter:** does it start at 20 and count down only by Countdown actions, or also a tick every round (a clock that forces
   the game to end)?
6. **Two players first,** and three or four (the clockwise push, the four 3 x 3 zones) after the duel is measured?

## 6. Decided

**Nothing answered yet. Built 2026-11-03 on the design pass's own proposals as defaults** (each is data in
`src/progress/casino/entropy/rules.js`, `classes.js`; change the line and the simulator says what it did):
1. One bank: yes. The Hungry Die's bank pays extra token actions (2^(n-1)) and class actives; fed cards grow the die over the whole game.
2. Royal Straight Flush (10 to king, one suit): an instant win, the bomb goes off on their ground.
3. The four classes: the Fool, the Chariot, the Empress, the Hermit, a passive and one active each. Not built: the two actives opened by
   zone depth and the ultimates.
4. A token beside the bomb: a flat +1 to its side's roll in a push.
5. The counter: starts at 20, falls one a round and by every countdown.
6. Two players only.
Other defaults the pass left open: the hand is five cards (the Hermit six), one group is played a turn (a run or flush of 3 to 5 cards
summons, a pair casts 2 to a token, three of a kind 4 and four of a kind 7 to the Arcana, a court card enchants), up to two cards may be
kept hidden across turns (this is the hidden hand the bot searches), the second seat starts with a bank of 1, the first Arcana's health is 20,
the bomb pushed off the board goes off in the zone it left. Rogues strike and take double in enemy ground, mages strike two tiles in a
line and cannot move, healers mend 2.

**The bot** (`entropy/bot.js`): single-observer information-set MCTS: each iteration deals the unseen cards at random into the other
hand and the deck, walks one tree, UCB1 on availability counts, a 24-move random rollout read by a position score. The simulator
(`node scripts/casino.mjs --game entropy`): the search at 40 iterations beats a random bot 88 to 93%. **Measured balance, first pass**
(40 games a pairing, search both sides): the Hermit wins about 65% against the field, the Fool 53 to 59, the Empress and Chariot about
40; the first seat wins about 60% even with the second seat's bank of 1; a game runs about 7 rounds and ends 80% by the bomb on a
zone, 15% in the neutral rank. **Open for Dovina:** the Hermit's sixth card is the likely cause of its edge, the first seat's push
advantage is not yet answered, and a game this short may want the counter at 30. Thinking longer (20 to 90 iterations) moved a win rate
by under 8 points in 100 games: the bomb is more luck than search at this length.

## Rulings and what is open (Dovina, 2026-11-03)
- **The six open questions run on the design pass's own proposals** (one bank, the royal straight flush an instant win, four classes, +1 a
  token beside the bomb, the counter at 20 falling one a round, two players) until South plays it.
- **Measured and open:** the Hermit wins 65% (its sixth card), the first seat 60%; a game is about 7 rounds. Next pass: the counter at 30
  and the Hermit's hand at five, re-simulated with `scripts/casino.mjs`. Not changed before a sim says so.
- **You are the Fool at the table**, Dovina's seat the Chariot. A class choice comes with the second pass.

## Tuned, South 2026-11-06 ("go for it")

Measured with `node scripts/casino.mjs --game entropy --n 200` (search 40 on both sides, 200 games a pairing):

| pass | change | the Fool | the Chariot | the Empress | the Hermit | the first seat |
| --- | --- | --- | --- | --- | --- | --- |
| before | counter 20; the Hermit holds six | 54.1% | 36.3% | 37.4% | 61.8% | 61.1% |
| 1 | counter 30; every hand five; the Hermit keeps three between turns | 66.8% | 40.5% | 38.1% | 46.4% | 62.4% |
| 2 | the Fool's re-roll costs 1; the second seat opens with a bank of 2 | 63.1% | 43.8% | 43.1% | 47.3% | 60.8% |

The Hermit is fixed. The Fool still leads, because a re-roll every turn is worth more than 1 from the bank. The first seat's edge did not
answer to the bank or the game's length, so it is structural: the first seat moves the bomb first. Next levers, not yet tried: the
first seat's first turn plays no group (Catan's and Go's komi idea), and the Fool's re-roll once a game round rather than once a turn.

## 7. Its own zone and its board (South, 2026-11-06)

South: "Entropy Tactics is supposed to be much more cosmic-themed, abstract, eldritch and avant-garde. Like playing on an oasis in
high-entropy space. For the actual visual board layout, take the orientation of Hearthstone or MTG: arena as a base and give it tilt-shift
look away from the viewer. The 7x7 board itself should be composed of individual tile meshes floating in space, so we can do cool cascading
ripple effects for board setup and tile-flipping mechanics. And it doesn't belong in Raku's bazaar, it should be compartmentalized into its
own zone." Also: "I don't want you guys to anchor to the current artstyle", so no Clay dress, no Gold Saucer, nothing of Anagami's kiln.

### 7.1 Built (Dovina, 2026-11-06)

- **The Entropy room** (`EntropyRoom`, `game.entropyRoom`, `src/world/entropy/entropyroom.js`; zone and area `entropy`): an oasis of
  ground 9 m across hung in a void at x -1500, y 200, z -3000, with the seat stone at its north edge (F sits you down) and the door home
  on its south rim. You reach it from the Index's row ENTROPY TACTICS (X) and leave by the door. It is built on entry and torn down whole
  after you leave. A fall into the void puts you back on the oasis.
- **The board as 49 tiles** (`room.tiles`, one mesh a cell, never merged; `tileAt(x, z)`; `BOARD`): 1.6 m tiles with 0.35 m gaps,
  floating 0.6 m over the oasis's height north of the seat, row 6 (yours) nearest. Each tile carries `userData.cell { x, z, side, home }`.
  The placeholder look is grey-blue for your rows, grey-red for theirs, grey for the neutral rank, a slow bob, and the setup's ripple: each
  tile rises 6 m from below, 0.06 real s later per metre from the board's heart, over 0.7 real s, when you sit (`entropy.board { phase:
  'setup' }`).
- **The seat** (`ENTROPY_SEAT`): the house's seat (`TableSession`: lobby, how-to, practice, stakes in chips). You play the Fool and Dovina
  plays the Chariot. The table is gone from Raku's bazaar (`world/bazaar/session.js TABLES`).
- **The camera, as data** (`CAMERA`): the board from behind your seat, 6.5 m back and 9 m up, pitched down 0.95 rad, a 34-degree field of
  view, row 4.5 held sharp in a band of 0.32 of the screen's height. These are first guesses for Petra's rig.

### 7.2 Asked (handoffs, 2026-11-06)

- **Calissa:** the look, the board view and the tilt-shift pass. The void and the oasis, cosmic and eldritch, nothing anchored to the
  house's style. The tiles are hers to model and animate: the setup's cascade replaces the placeholder ripple, and a tile can turn over
  on its own (`flip`). The pieces on the board (tokens, the Grand Bomb and its counter, the Hungry Die), your hand and the action bar as
  the board's own, in place of the text page (`world/bazaar/views.js entropy`).
- **Petra:** the board's camera rig while seated (from `CAMERA`), the gate's read of the hub rows I added (the zone, the area, the
  Index row, the map's row, the frame's two hooks).
- **Wanda:** the room's cue and the board's sounds (the setup cascade, a tile turned, the bomb's counter).

### 7.3 Open

1. **Tile flipping as a rule.** Nothing in the rules turns a tile over yet, so today a flip is a look only. Proposal, for South to rule:
   a tile's face is whose ground it is, and a push of the bomb through a tile, or a token held on it for a round, turns it to the pusher's
   side, so the zones move. This would replace the fixed three ranks a side, so it is a rules change and needs a new balance pass.
2. **The class pick** in the seat's lobby (all four classes, and Dovina's at random).
3. **The look's name.** Plain names until settled. Espada proposes a lore name for the room once South calls it final.

## 8. Version 2: the deck-carving tactics game (South, 2026-11-06)

South: "a 'deck-carving' srpg where everyone starts with the same base material (a tarot deck) and its about outmaneuvering your
opponent to reaching an optimal deck state without accidentally overextending yourself and running out of cards or mismanaging the
position of the grand bomb." The rules below replace sections 1 and 6 (version 1: poker groups summon, cast and enchant). South's
rulings of 2026-11-06 are marked (S); the rest are Dovina's defaults, each a number in `ENTROPY_RULES` and each named in 8.9 for
South to strike.

### 8.1 The board and the decks

- The board is 7 x 7 tiles, and each tile has an **owner** (you, them, or nobody) and a **sum** (0 to 21). At the start, your back rank
  (row 6) is yours, theirs (row 0) is theirs, and the five rows between are nobody's. The Grand Bomb starts on the middle tile, (3, 3).
- **Each player has a deck of their own**, the same 56 Minor Arcana (four suits of ace to ten, page, knight, queen, king). Everyone
  starts from the same base material (S). What you carve away from it is what you become.

### 8.2 A turn

1. **Draw** up to five from your own deck (8.6 when it is empty).
2. **Play**, as many of these as your hand allows, in any order:
   - **A number card on a tile** (8.3), its value added to the tile's sum.
   - **A court card as a token** (8.4) on a tile of yours in your back rank.
3. **Carve the rest.** Of the cards left in your hand, keep up to two for next turn (the Hermit three), and send each of the others to
   one of two places, your choice card by card:
   - **Fed to the Hungry Die:** gone from the game for good. Your deck is thinner and the die grows (d4 at 0 fed, then d6 at 4, d8 at 9,
     d10 at 15, d12 at 22, d20 at 30), and its bank grows by one.
   - **Discarded:** onto your discard pile, where a reshuffle (8.6) can bring it back.
4. **Roll the Hungry Die** and either push the Grand Bomb (version 1's clash: your roll plus 1 for each of your tokens beside it,
   against their roll plus 1 for each of theirs) or count its counter down by the roll.
5. **Your tokens advance** (8.4). Then the turn passes.

### 8.3 Twenty-one: flipping a tile (S)

- A number card may go on any tile beside (orthogonally) a tile you own or a tile with one of your tokens on it, or on a tile you own.
  Its value is its rank: ace 1 or 11, your choice as you play it (blackjack's), 2 to 10 as printed.
- The sum is shared (S): both players add to the same running total on a tile, so a tile they built up to 19 is yours with a 2.
- **Exactly 21 flips the tile** to the colour of whoever played the card that made it, and its sum goes back to 0.
- **Over 21 busts** (S): the sum goes back to 0 and the tile keeps its owner.
- Played number cards go to your discard pile.

### 8.4 Court cards: tokens that advance (S)

- A court card is played as a token on a back-rank tile of yours with no token on it. Its **rank** is its speed and its strength: page 1,
  knight 2, queen 3, king 4 (S).
- At the end of each of your turns, every token of yours **advances** that many tiles straight toward the far edge, along its own
  column.
- Its **suit** is what it does (S: "different suits and ranks have different token actions", suit as class identity, MTG's mono-colour):
  - **Wands (the strike):** on reaching the far edge it deals its rank in damage to their Arcana, then is discarded.
  - **Pentacles (the claim):** every tile it crosses turns yours (its sum to 0). It stops on their back rank and stays there, holding it,
    until struck.
  - **Swords (the fight):** a sword token meeting an enemy token on its way fights it. The higher rank wins, swords winning a tie, and the
    loser is discarded. On reaching the far edge it pushes the Grand Bomb one tile toward them, then is discarded.
  - **Cups (the return):** on reaching the far edge it heals your Arcana by its rank and goes back into your deck, shuffled in. Cups is
    the one suit that refills a carved deck.
- Two tokens meeting where neither is a sword: the higher rank goes on and the lower is discarded; an equal pair both stop that turn.
- A token never enters the Grand Bomb's tile. It waits behind it.

### 8.5 The Grand Bomb

- It goes off when its counter reaches 0, which is 30 at the start, down one a round and down by every count. **Whoever owns the tile
  under it loses** (S: tile ownership replaces the fixed zones). On a tile nobody owns, the higher Arcana health wins, and an equal
  health is a draw.
- **Pushed off the board past a back rank:** that back rank's player loses.

### 8.6 Running out: fatigue and the reshuffle (S)

When you must draw and your deck is empty, choose:
- **Take fatigue** (Hearthstone's): your Arcana loses 1, then 2, then 3 and so on, the count kept for the whole game.
- **Reshuffle** (only with cards in your discard pile): your discard pile is shuffled into your deck, then you draw. The first reshuffle
  costs 2 health, the second 4, the third 6, and so on.

Cards fed to the Hungry Die never come back, so carving deep thins your deck toward the suit you want and toward fatigue at once.
That is the overextension South named.

### 8.7 The classes

The four Arcana stay (the Fool, the Chariot, the Empress, the Hermit) with their passives and actives, and each takes a suit:
- **the Chariot: Swords.**
- **the Empress: Pentacles.**
- **the Hermit: Cups.**
- **the Fool: none** (the re-roll for 1 is its gift).

A class's suit is its class identity: its court tokens of that suit advance one tile further a turn. Carving a deck toward its suit is
the mono-colour play. Wands are left for a fifth class.

### 8.8 Winning

1. The Grand Bomb goes off on their tile, or is pushed off past their back rank.
2. Their Arcana reaches 0, from wands, fatigue or reshuffles.
3. **Gone in version 2:** the royal straight flush and version 1's poker groups (summons by runs and flushes, casts by sets, court
   enchantments), since number cards now go on tiles and court cards now make tokens.

### 8.9 Defaults to strike (Dovina's, not South's)

1. Number cards play beside your ground or tokens.
2. Ace 1 or 11.
3. Tokens on your back rank only, advancing at your turn's end.
4. Cups go back into the deck.
5. Pentacles stay on the far edge.
6. The bust keeps the owner.
7. The class suits above.
8. Two-player only.

### 8.10 Built and measured (2026-11-06)

Built to section 8 (`rules.js`, `tokens.js`, the bot, the coach, the how-to, the text page). Measured with `node scripts/casino.mjs
--game entropy --n 100` (search 40 on both sides, 1,600 class games), once, untuned:
- **Class means:** the Fool 33.5%, the Chariot 45.8%, the Empress 50.8%, the Hermit 49.0%.
- **Seats:** the first seat wins 48.2% and the second 41.9%, with 9.9% draws (v1's first-seat edge was 61%).
- **Length:** 9.9 rounds a game.
- **How games end:**
  - 39% pushed off a back rank;
  - 29% the counter run out on nobody's tile;
  - 22% the counter run out on an owned tile;
  - 10% draws;
  - **none on health.**
- **Flips and busts:** 5.1 tiles turned by 21 a game, against 0.33 busts.
- **Running out:** fatigue in 13% of games, a reshuffle in 12%.
- **The bot:** search beats random 75%, down from 93%. v2's choice space is wider, so the bot is weaker.

Read plainly:
1. **Nothing kills on health.** Wands and fatigue never close a game.
2. **The bomb's off-board push decides two games in five.** Swords' arrival push may be too strong a lever.
3. **The Fool, with no suit, is weakest.**

Choices the builder made where section 8 was open:
- The fatigue-or-reshuffle choice comes once a turn's draw.
- A number card may sit on a token's tile and on the bomb's.
- Equal swords both break.
- A draw counts as a loss at a pot table.

### 8.11 Token health, hits and feeding any time (South, 2026-11-06, evening, through Calissa)

South: "giving the court tokens a health value, such that they can also be targeted by cards, with damage taken being 1x magnitude if of
the same or adjacent suit, and 2x magnitude if of the opposite suit", and "the hungry dice should be able to be fed at any point during the
turn". Built (`tokens.js` `hitOf`, `hitToken`; `rules.js` `previewPlay`, `feedCard`):
- **A token's health** (`t.hp` of `t.max`): three a rank, page 3 .. king 12 (the Empress's +1 rank, +3). Three a rank so a ten of the
  contrary suit (20) downs a queen or less and a same-suit ten downs a knight or less: a king costs two cards or a contrary ace (22).
- **A hit**: a number card played on an enemy token (the place move `{ on: tokenId, v }`, an ace 1 or 11) hurts it by its value in place
  of adding to a tile. x2 when the card's suit is the token's contrary (SPREADS.md 4: Wands against Cups, Swords against Pentacles), x1
  for the same suit or an adjacent one. At 0 it is downed to its owner's discard pile (a cup does not go home). The log: `{ hurt, owner,
  by, dmg, mult, hp, card }`, then `{ down, why: 'card' }`.
- **Feeding** (`{ feed: card }`) is offered in every step that holds the play: the play, a card's place (the hand's other cards), the carve
  (it replaces the carve's old `to: 'feed'`), and the bomb (after the roll: the roll stands, the bank and a re-roll's die grow). Fed in
  the play step, the die is bigger for this turn's roll.
- Choices South left open (strike any): **any enemy token anywhere** may be hit (a king of wands crosses in two turns, out of reach of the
  tiles beside your ground); a **meeting still goes by strength**, never the health left; feeding is not offered at an empty deck's
  fatigue-or-reshuffle choice (the draw is not done).

Measured once (`node scripts/casino.mjs --game entropy --n 60`, search 40 both sides, 960 class games), untuned:
- **The bot:** the search beats random 85% (75% before: hits and an early feed are moves it finds).
- **Class means:** the Fool 41.3% (33.5%), the Chariot 35.8% (45.8%), the Empress 45.8%, the Hermit 49.2%. The Chariot is the token
  class, and its tokens can now be shot down.
- **Seats:** the first seat 47.4%. **Length:** 10.1 rounds.
- **Ends:** 36% the counter on nobody's tile, 32% off a back rank, 17% on an owned tile, 15% draws; on health 2 of 960.
- **Per game:** 3.1 tiles turned (5.1 before: cards go to tokens now), 0.12 busts; fatigue in 19%, a reshuffle in 26%.
Read plainly: health still never ends a game; the swords' shove still decides a third; the Chariot wants something back.

## 8.12 Version 2.1: health is the token, five classes (South, 2026-11-06, night: "the arcana class abilities and balance are your playground")

8.11's numbers said: health never ended a game, draws were 20% (a bomb on nobody's tile, both Arcana still at 20), and a token could be shot
anywhere the turn it was laid. Version 2.1's rules, each in its module's header:
- **Health is the token** (`tokens.js`). Its power is its health left, plus a Charge's +3 on its owner's turn. A meeting's winner loses
  the loser's power (never under 1). Wands strike their Arcana for their power. A sword shoves the bomb only with half its health left.
  Cups mend half their power. Every hit now weakens everything the token will do.
- **Reach** (`reachTokens`, `rules.js`). A card hits only an enemy token on a tile your number cards may go on, so ground held forward is
  reach. A king of wands laid on their back rank is out of reach until it crosses into your half.
- **Ground breaks the tie.** A bomb on nobody's tile goes to the seat holding more tiles, then the higher health; a draw only if both are
  even. The 21s count to the end.
- **Attuned cards** (`cards.js`). A number card of your class's suit may be played one up or one down (1 to 11). A deck carved toward its
  suit finds 21 more easily, on tiles and on tokens.
- **The second seat** opens with a bank of 2 and draws a sixth card on its first turn (Hearthstone's coin and card).
- **Five classes** (`classes.js`), each answering another:
  - **the Fool** (no suit): no contrary, so its tokens never take double; its re-roll costs 2; Cycle.
  - **the Chariot** (swords): every token one tile further, plated (3 off every hit, never under 1), unscathed winning a meeting; Charge +3.
  - **the Empress** (pentacles): tokens one rank stronger; Bloom now turns every tile under one of her tokens hers, since ground decides
    half the games (its mend of 5 did little).
  - **the Hermit** (cups): three cards kept; Lantern +3 to the roll.
  - **the Tower** (wands, new): its tokens that fall are fed to its Hungry Die, not discarded; Lightning (2) hits every token for 3 but its
    own wands, once a turn.
- **Your class**: `/arcana <id>` before you sit; Dovina takes each of the others in turn (it was always the Fool against the Chariot).

Measured with `node scripts/casino.mjs --game entropy --n 30 --styles 0` (search 40 both sides; a cell is 30 games, so +-9% a cell and
+-4% a class's mean):

| pass | Fool | Chariot | Empress | Hermit | Tower | first seat | draws | ground | off the edge | owned tile | strike |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| health only (4 classes, n 40) | 46 | 31 | 35 | 38 | - | 43 | 20 | - | 26 | 18 | 2 |
| + reach (Fool anywhere), ground, Tower | 74 | 35 | 47 | 50 | 39 | 58.5 | 1.2 | 47 | 27 | 16 | 7.5 |
| Fool a tile further, Chariot plating 3, Lightning 2 | 60 | 50 | 39 | 47 | 53 | 58 | 1.2 | 47 | 26 | 19 | 7 |
| Fool re-roll 2, Bloom claims, second's sixth card | 70 | 49 | 47 | 50 | 43 | 56 | 1.6 | 44 | 25 | 19 | 10 |
| **Fool: no contrary in place of reach (n 40, as built)** | **51.5** | **46** | **48.5** | **46** | **43.5** | **56** | **0** | **44** | **24** | **20** | **10.6** |

Read plainly: draws are gone (20% to 1.5%); ground now decides almost half the games and strikes a tenth; the bomb pushed off an edge is
mostly the clash (133 of 187), not swords (54). The Fool kept winning while it held any reach of its own. Part of that may be the bot: the
Fool, with no attuned cards, has the fewest choices to search. Its reach went in the last pass: as built, every class's mean sits within
its noise of 50% (the Tower lowest at 43.5), the first seat still wins 56%, and draws are gone.
Open, for the next pass: the first seat's edge (56%: a sixth card and a bank of 2 were not enough; next to try, the second seat's first
roll +2 or the first seat's opening without a roll); the Tower a touch low; the clash pushing the bomb off an edge in a quarter of games
(whether that is a fault or the game's tug of war is South's call in play).
