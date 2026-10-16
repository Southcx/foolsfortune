# Raku's casino: the tarot and dice games (the owner, 2026-10-15)

> "I actually have a bunch of design documents for tarot card games and dice games involving a standard D&D set of dice ... build me out
> a robust environment within Fool's Fortune to test them ... split off the Treasury section of The Weir and give Raku his own bizarre
> bazaar casino area." "For the visual design of this casino module, we're going Gold Saucer all the way."

Kept by Dovina. The owner's design documents (years old, "blow the dust off and shoot for the moon") are the source; this plan turns them
into rules a program can play, says where a rule was open and what was decided, and measures every game before anyone tunes it by feel.

## 1. The shape

- **One engine, every game a rules module** (section 2). The rules are pure and seeded: the same module is played at a table, by bots
  headless, and by the simulator (`node scripts/casino.mjs`) ten thousand times.
- **The bazaar** (section 9): Raku's own place, split off the Weir's Treasury, dressed as the Gold Saucer (the owner's call): a
  carnival under a dome, neon on clay, tables you walk up to.
- **The money** (section 10): chips bought with cubes and cashed back, so a game you have learned to beat is not an endless faucet.
- **The opponents** (section 7): bots with a style each; the folk and the siblings take the seats, guests later.

| game | what it is | phase | state |
| --- | --- | --- | --- |
| Querent, the tarot game (the owner's pick, 2026-10-15; section 3) | Riichi Mahjong's bones, the owner's scoring, 22 Major Arcana | 1 | rules, bot, simulator built |
| Astroll: Zodiac (section 4) | Shut the Box as a duel for a pot | 1 | rules, bot, simulator built |
| Astroll: Event Horizon (section 5) | blackjack against a hidden house total | 1 | rules, bot, simulator built |
| Astroll: Supernova Run | push-your-luck dice fission and fusion | 2 | the doc's rules; one pass needed on the reaction loop |
| Astroll: Nebula Bluff | Liar's Dice on a set's totals | 2 | the doc's rules; needs bots that bluff and tell |
| Astroll: Gravity Well | crokinole with dice, real physics | 2 | the doc's rules; the house's physics fits it |
| Astroll: Charity Gamble | hidden deposits, over / under | 3 | the doc's rules; needs four to six seats |
| Astroll: Celestial Skirmish | chess with dice | 3 | the doc's rules; needs a chess-grade bot |
| Entropy Tactics (merges Fatelink: the owner, 2026-10-15) | a tactics game on a 7 x 7 board | 3 | a design pass first: one of 22 characters is written |
| Astroll: Asteroid Belt | a grab for duplicate faces | later | one sentence so far |

## 2. The table engine (`src/progress/casino/table.js`)

A game is `{ id, seats, setup({ seats, r, opts }), pending(state), apply(state, move, r), result(state), view(state, seat) }`. A
decision is always someone's: `pending` returns `{ seat, kind, moves }`, so a choice that is not the turn holder's (the robbed player
choosing what their arcana does) waits its turn like any other; a choice whose options depend on the moment is built as it is asked.
`view` is all a seat may know (hidden hands stay hidden; the Sun shows one). `play(game, { seats, bots, seed })` plays a game out.
Shared: a seeded stream (`rngOf`), the dice (`die`, `DND_SET`: d4, d6, d8, two d10, d12, d20; `DIE_STEPS` for upgrades), and every
subset of tiles or dice adding to a total (`subsetsSumming`).

Prior art: boardgame.io (a game as pure reducers), OpenSpiel's legal-actions interface, the house's economy simulator.

## 3. Querent, the tarot game (`src/progress/casino/querent/`)

The owner's original card game, older than the game it shares a name with (Fool's Fortune was once called Project Everwell). Its name
is **Querent** (Espada's pick, the owner's yes, 2026-10-15): from Latin quaerere, to ask; in a reading, the one who asks the cards.

**3.1 The table.** Two to four players, each with a Tarot deck of their own split into the Minor Arcana (the draw pile, 56: four suits of
Ace to 10, Page, Knight, Queen, King) and the Major Arcana (22, a pile of its own). Four rounds; the highest score wins. The first seat
turns each round.

**3.2 A round.** Deal eight. On your turn take a ninth: a **draw** from your own pile, or a **steal** of the top of an opponent's discard
pile (twice a round at most, once a turn; the stolen card can never be discarded; the robbed player flips a Major Arcana). Then win, or
throw one card face up onto your own discard pile. A round with no winner within 40 turns a player is void.

**3.3 A winning hand.** Three melds of three: a **set** (three of a rank, any suits) or a **run** (three ranks in a row, any suits: the
owner, 2026-10-15, "they can be mixed"). Ace is 1 and never royal; Page 11, Knight 12, Queen 13, King 14. Nine cards of one suit win in any
order. A drawn **four of a kind** is set aside at once as one set: flip an arcana and draw a replacement (Mahjong's kong). Four of a kind in
the deal is **Heaven's blessing**: two flips. A stolen card's twin drawn later is thrown away, and the robbed player flips again.

**3.4 The Fate Clause.** At your turn's start, one card from winning, you may declare it: name whether you will win by draw or by steal
(the other is barred to you), flip an arcana (two on your first turn), and your turn ends. *Decided:* the declared hand is locked as in
Riichi: what you take you throw back, unless it wins.

**3.5 The Major Arcana** (`arcana.js`). A flip turns the top of your own pile; the card is yours and in play for the round. Flips are
boons (the owner: "flipping is meant to be a boon most of the time, which is why stealing gives your opponent a flipped Major Arcana"),
except where a card says otherwise. An arcana resolves before whatever set it off. Fewer than four at the table: everyone opens a round
with one flipped. Death resets the round (not counted), the next opens with two each, and Death cannot reset twice running. The 22
effects are the owner's, each a line in `ARCANA`. *Decided:* the Fool can become any card but Death; Justice sends each stolen card back
to the player it was stolen from, who throws one back as if it had been drawn, while the thief draws to make up their hand; Judgment's
"+2 per stolen card" is read as +2 additive.

**3.6 The score** (`score.js`). The owner's formula: **value = tier x (the multipliers) x (1 + the additive bonuses)**.
Tier 1 (1,000): any three melds. Tier 2 (2,000; it was 4,000, the owner took the change, 2026-10-15): all runs, all sets, or nine of a suit in any order. Tier 3 (8,000): three sets of three
ranks in a row, or nine of a suit in three runs. The bonuses are the doc's: a half flush (+1; +2 pure), nine in a row (+1), all royals or
no royals (+1), no steals (+1), +1 an arcana in play, +1 a seat-suit run, the perfect straight flush (x5, in place of the seat-suit
bonus), a first-turn Fate Clause (+1), fortune favours (won on the turn after declaring: +2 by steal, x4 by draw), the fated one (won on
the first draw of the round: +20), and the arcana that score (the Magician's aces, the Empress's queens, the Emperor's kings, the
Chariot's knights, the Hierophant's rank, Strength's x2, Temperance, the Devil, the Tower's +4, Judgement, the World). The Lovers pool
two players' arcana; duplicates never stack.

**3.7 Measured** (`node scripts/casino.mjs --game querent`, 300 bot games a table size):

| table | seat wins | rounds reset by Death | tier 1 / 2 / 3 | hand value: median, 90th, top | turns a won round |
| --- | --- | --- | --- | --- | --- |
| 2 players | 48.7 / 51.3% | 257 (0.86 a game) | 51.5 / 47.2 / 1.3% | 24,000; 88,000; 480,000 | 25.9 |
| 4 players | 22.7 / 23.3 / 25.0 / 29.0% | 324 (1.08 a game) | 50.3 / 49.2 / 0.5% | 24,000; 96,000; 1,024,000 | 35.5 |

**3.8 Open, for the owner.** (1) **Death resets about one round a game**: flips come from steals, Fate Clauses, fours and the deal, 24 to
42 a game, and Death is one card in 22. Keep it (chaos is the point), make it rarer (Death only from your own flips), or soften it (it
resets only the flipper's hand)? (2) **Tier 2 is nearly as common as tier 1** (49% against 50%), because mixed-suit runs make "all
runs" easy; tier 2 at 4,000 may want to be 2,000, or "all runs" may want one suit. (3) The doc's future **shop between rounds** (an
extra steal, a negation, a burn) fits the economy well; it waits for the owner. (4) Payments: today the winner adds their value to their
score. Whether the others pay it (Mahjong's way, a zero-sum table) changes how a gambling table feels.

## 4. Astroll: Zodiac (`zodiac.js`)

Two to four players, twelve tiles each (1 to 12), an ante each into the pot. A turn rolls two six-sided **sealing dice** and the
**attack die** (a d4 to begin). The sealing dice shut your own open tiles adding to exactly their **sum or their product**. The attack die
reopens an opponent's shut tiles adding to exactly its value (a locked tile never reopens); with none, that opponent pays its value into
the pot. With neither a seal nor an attack, a **dead roll**: the attack die is rolled again and you pay it. **Doubles** (any two of the
three dice) choose one of **Lock** (an ability token on one of your shut tiles from the doubled face to twice it; no one else may lock that
number), **Upgrade** (your attack die a step: d4, d6, d8, d10, d12, d20) or **Pay** (the attack die again; an opponent pays it).
**Triples** take all three in order. A locked tile's **ability** fires when your sealing dice *add* to its number: reroll the sealing
dice, downgrade an opponent's attack die, take your attack die's value back from the pot, or scramble an opponent's shut tiles (as many
shut, which ones at random). The first to shut all twelve takes the pot.

*Decided:* the doc's example (a 4 and a 6 multiplied, 24, flips 1, 3, 9 and 10) adds to 23: the owner, 2026-10-15, "a typo/math error";
tiles add to exactly the value. A double made with the attack die locks from its face to twice it.

**Measured** (2,000 games a size): 2 players 53.6 / 46.4% (the first seat's edge: 3.6 points), 31 turns; 3 players 35.8 / 31.8 / 32.4%;
4 players 27.5 / 24.4 / 23.6 / 24.1%. Almost never stalls (8 of 2,000 at four, past 400 turns). The first seat's edge wants the
starting seat to turn each game, as Querent's does: done (`opts.first`; the bazaar's table passes the first turn round a seat a game, so
two games at a two-seat table are even).

## 5. Astroll: Event Horizon (`eventhorizon.js`)

Players against each other and the **house**. The dealer secretly rolls one to four dice of the standard set (weights 15, 35, 35, 15%)
and announces the **round total** and how many dice made it (**par**). Each player antes into the pot; in turn each rolls any of the dice
of their own set not yet rolled this round (at least one) and adds them to a running total: exactly the round total wins at once, over
busts, under passes the turn. The first player gets one free reroll of a roll a round. The first to hit the total takes the pot, and the
house pays a bonus on top by how well they read the dealer: the owner's **1x** for any exact hit, **3x** with par's number of dice,
**5x** with the dealer's very dice. Nobody hits: the house keeps the pot.

*Decided:* each die of your set rolls once a round (which dice you spend is the skill); the doc's interference (swap, steal, reroll
another's dice) waits for phase 2, as abilities.

**Measured** (20,000 rounds, the bot): alone, a player gets back -0.114 antes a round (an 11% house edge, a slot machine's; a sharper
reader than the bot does better). At two seats the first seat makes +0.150 and the second -0.463; at four, +0.572 for the first. Going
first and the free reroll together are worth a great deal: the seat order must turn every round (the table does it), and the free reroll
may belong to the last seat instead (the owner's call). *Decided* (the owner, 2026-10-15, "go with your recommendations"): the free
reroll is the **last seat's** (`S.rerollSeat`), and the first seat turns each game (`opts.first`). Measured at four seats: -0.083,
-0.161, -0.279, +0.165 antes a round (was +0.572 for the first seat).

## 6. Phase 2 and 3 games

### Supernova Run (`supernova.js`, built 2026-10-15)
Each player starts with four d6. A turn is one of three:
- **Run a reaction:** every die is rolled. A die on its maximum is duplicated (the copy stays in your hand) and both roll again. A natural
  1 decays the die two steps (a d6 or d8 to a d4) and it rolls again; a d4's 1 is lost. The reaction runs until no die shows a maximum or
  a 1, and the settled faces are your points.
- **Split** one die into two real dice whose sides add up to it.
- **Fuse** two or three dice into one.

A natural 20 on a d20 is a **Supernova**: the reaction stops, your points double, and the round ends, with every hand reset to four d6.
The first to **500 points** wins the pot.

*Decided* (the owner, "do that", 2026-10-15, on Dovina's pins):
- The threshold is the game's end; a Supernova ends a *round*, not the game.
- Duplicates stay in the hand, which holds 12 dice at most.
- A d6's 1 decays to a d4.
- Fusing takes 2 or 3 dice.
- A game past 240 turns goes to the most points.

**Measured** (3,000 games a size; bots that build toward a d20 at a set rate):
- **As first built** (one round, a Supernova an instant win): never building won 60% against a half-builder. Turns spent fusing weren't
  worth even a win.
- **With the threshold at 500 and the owner's x2,** no pure strategy dominates against a half-builder:

  | Strategy | Win rate |
  | --- | --- |
  | never build | 46.5% |
  | build a quarter of the time | 51.3% |
  | build half the time | 48.2% |
  | always build | 45.5% |

  Reading when to build is the skill. At 800 points, never building drops to 37%; at 300, it rises to 61%.
- **By table size:**
  - 2 players: 50.2 / 49.8%, about 20 turns each, 0.5 Supernovas a game.
  - 3 players: about 19 turns each.
  - 4 players: about 18 turns each. The heaviest builder wins least here (20.5%), because others' Supernovas wipe its half-built
    engines.

### Nebula Bluff (`nebula.js`, built 2026-10-15)
Liar's dice on a hand's worth. Six dice each (d4 to d20). A hand is worth its faces plus 10 for each die on its maximum.
- **Claim:** "my hand is worth at least N"; pay a tenth of N (rounded up).
- **Counter:** a higher claim, paid the same way.
- **Call out:** pay the standing claim and say it's a bluff. If the claimant was under, the caller takes the pot and the bluffer loses two
  dice; if not, the claimant takes the pot and the caller loses two.
- **Fold:** lose a die; what you paid stays in the pot.

When the raises reach the cap, every hand still in is shown. The claimant gets +10 for each other player still in, the best hand takes the
pot, and every other shown hand loses a die. Lost dice are drawn at random and never shown. The last player holding dice wins. A bot leaks
a **tell** on a bluff at its own rate, and sometimes on an honest claim; the tell is a world mark for the cloth's look (Calissa's).

*Decided:*
- A claim's price is a tenth of it (the doc's "value equal to the bid" would cost 40 chips a raise).
- Dice lost are drawn at random.
- The reveal bonus counts the other players.
- **The raise cap is a third of the dice in play** (12 at most). This one is a change from the doc and the owner's to overrule. At the
  doc's full count, a reveal came in 0.1% of rounds, so the bluff reversal never showed; at a third it comes in 11%.

**Measured** (2,000 games):
- **2 players:** about 5.5 rounds a game. 55% of bluffs are caught.
- **The liar** (bluffs 40% of the time) wins least at every table size; **the reader** wins most at 3 and 4 seats.
- **A tell reader** (a Bayesian read of a tell's odds) against an average one:

  | Reader | Win rate |
  | --- | --- |
  | blind | 45.1% |
  | average | 49.5% |
  | sharp eye | 50.2% |

  So tells are a real skill, and the cloth's tells must read on the folk's bodies.

### Still to build
- **Gravity Well**: real flicked dice on the house's physics (Rapier), zones as data; a dexterity game, so the owner's play is its test.
  It waits until the owner has played the tables.
- **Charity Gamble**: four to six seats; the hidden deposit's denominations (1, 5, 10) as the bluff. Small.
- **Celestial Skirmish**: a chess move generator and a search bot; the dice as pieces and their natural-maximum specials. The heaviest.
- **Entropy Tactics** (Fatelink merged in): **the design pass is `docs/plans/ENTROPY-TACTICS.md`**, six questions for the owner before
  any code.
- **Event Horizon's interference** (swap, steal, reroll another's dice): the owner's doc puts the game there; it comes back as abilities.

## 7. The opponents

Every game ships a bot (`zodiacBot`, `horizonBot`, `querentBot`) good enough to measure with, and a `style` to lean it: a thief that
steals for less, a bold roller, a greedy payer. At Raku's tables the seats are the folk and the siblings, each with a style that suits
them (Petra folds tight, Calissa bluffs pretty, Espada counts cards), so a table reads as people. Guests (co-op players) take seats later
through the same interface.

## 8. Measuring (`node scripts/casino.mjs`)

Every game, every table size: seat win rates (fairness), game length, the house's keep, how often each hand, read and arcana turns up. A
number in a game's table changes only after a run says what it does.

## 9. The bazaar (Raku's, the Gold Saucer's look)

Split off the Weir's Treasury (its five plinths and the Tithe move with it) into a place of Raku's own, a room and a zone. The owner's
look: the Gold Saucer (Final Fantasy VII's casino and carnival under a dome): neon and lanterns on clay, a ring of tables, a dice pit, a
long Gravity Well lane, stalls, and Raku as croupier and banker. Each game is begun at its own table (CLAUDE.md: a minigame begins from
something in its room); a table is a camera's frame on the cloth (the house's camera shot), the cards and dice real objects clicked,
everything said in the log. The room and its placeholders: Dovina, as the Raceway was; the look: Calissa; the music: Wanda; Raku's lines
and every name: Espada; the Treasury's move off the Weir and the room's place: Petra.

**Built (round 2)** (`src/world/bazaar/`): the hall, a zone of its own (`bazaar`, render/zonemap.js; its map layer RAKU'S BAZAAR) at
Petra's place, out of every sky (x 0, y 200, z -3000): a round floor 58 m across with a gold ring, sixteen wall panels, a dome, four
neon bands cycling, six lamps of the light budget, its own violet air (`AIR`: fog 0.009, so the far wall is still seen). Ways in: the
Index's row (G, THE OPEN) and a gate on the Weir's north beach beside the Treasury; out: the gate in the south wall. On the floor:
Raku's cage (chips for cubes, and back), three tables (session.js `TABLES`: Querent at four seats with Raku, Clink and Celadon, a 25-chip
buy-in, the winner takes the table less Raku's tenth; Zodiac against Raku with a 40-chip purse; Event Horizon at three seats with Crock
and Celadon, a 10-chip ante a round), Supernova Run (added 2026-10-15, south-west, with Clink and Crock, a 20-chip buy-in, the winner takes the table less Raku's tenth) and Nebula Bluff (south-east, with Raku and Celadon, a 60-chip purse played out of), and the Treasury's slot on the north side (`BAZAAR.treasury`: flat floor, 34 m by 8 m, for
Petra's move). F at a table sits you down (`TableSession`): the stake comes out of your chips, the bots take their turns 0.6 real s
apart, your choices are clicked on a page set aside (`views.js`, a placeholder until the cloth, cards and dice are real objects),
and the table's moments and the result go to the log (`feedback/tracking/casino.js`). Rising mid-game forfeits the stake.

**Made clear (2026-10-15):** the owner could not tell how to play any table. The clarity pass, with the coach, the how-tos, practice and
speed, the seat and suit colours, and the count-up, is `docs/plans/CASINO-CLARITY.md`.

## 10. The money

**Chips, not cubes** at the tables: bought from Raku with cubes and cashed back at the same rate, the cash-out capped a game day (a
first draft: 10 minutes of play, 80 cubes, until measured). A skill game against bots you have learned to beat is otherwise an endless
faucet; the house games' edge is a slow drain; the cap keeps the bazaar a place to play, not a living. Medals and firsts (a first win at
each game, a perfect straight flush) pay once, ever, as the Raceway's tests do. The numbers go into docs/ECONOMY.md once measured.

**Built (round 2)** (`src/progress/casino/chips.js`, save section `casinoChips`): `CHIPS = { rate: 1, stacks: [50, 100, 250], cap: 10 }`.
A chip is a cube at the cage both ways; what is cashed beyond what you bought counts as winnings, and winnings cash at most `cap`
minutes of play (80 cubes) a game day; the rest stays as chips for tomorrow. Events `casino.chips { buy | cash: true, n, balance | held, win }`.

## 11. Names (Espada's to rule)

The tarot game is **Querent** (Espada's pick, the owner's yes, 2026-10-15; Everwell, the owner's original title, read as a Well).
Espada's ruling, 2026-10-15: **Raku's Bazaar** and **Raku chips** (raku firing pulls a pot red-hot from the kiln, its outcome unknown:
the name is already a gamble); the Fate Clause, the seat suit, Heaven's blessing, the ladder of sets, fortune favours and the fated one
stay as they are; the folk at the tables are Clink, Crock and **Celadon** (not "Glaze", the Courier's word). Raku's croupier lines go
in `npc/talks.js` (Espada's, once Raku's npc id stands in the bazaar).
