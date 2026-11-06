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
