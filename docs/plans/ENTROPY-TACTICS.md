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

(empty until the owner answers)
