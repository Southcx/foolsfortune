# Your dice: the standard set, the palm die (a plan)

The owner, 2026-10-23: "I think the player should have their own set of dice, in the standard D&D distribution, the same as what I
designed all those games that are in Raku's bazaar ... I've always associated the god hand mode with 'hands' of cards and throwing dice;
in fact that little hole in the palm of the god hand was going to hold an evolving die from d4 to d20. What I was going to use it for I
don't know yet, but the vision was there. ... We can refer to them as Pneuka stones, and they just happen to come in the standard D&D
denominations. Specialized solid Lachryma. ... It all ties heavily into that Entropy Tactics module."

Dovina's plan. Status: a plan, nothing built. The questions (section 7) are the owner's.

## 1. The name: a clash to settle first

**"The stones" is taken** (GLOSSARY section 1): the Courier's stone set (`progress/stones.js`, the `Courier_Stones` material), where
Lachryma enters the vessel. "Pneuka stones" beside "the stones" would be one word with two meanings in the same breath ("swap your
stones" would mean either). Three ways out:

1. **Keep "Pneuka stones", always in full**, and qualify the other as "the vessel's stones" (a homonym kept on purpose, GLOSSARY rule 3).
2. **"Knucklebones"** for the dice (Espada's to weigh): the first dice were sheep's knucklebones (astragali), thrown by hand; the god
   hand has knuckles; and *astragalomancy*, divination by thrown bones, is the oldest dice game and our Divination domain. A triple
   entendre that is already true.
3. **Plain "dice"** until the owner calls the dice finalized (CLAUDE.md, "Plain names until settled"), the lore name chosen then.

Until the owner rules, this plan and any code say **dice**, **your dice set** and **the palm die**.

## 2. What they are made of: Lachrymite, and the solids are the suits

A die is Lachrymite: Lachryma set solid (GLOSSARY section 2). A cube is already a coin of it, **and a cube is a d6**: the currency has
been a die all along.

The standard set is seven dice, and five of them are the Platonic solids, which Plato's *Timaeus* gave to the elements. The
elements are our suits:

| die | solid | Plato's element | our suit | why it fits |
| --- | --- | --- | --- | --- |
| d4 | tetrahedron | fire | Wands | the sharpest, hottest shape; the smallest die |
| d6 | cube | earth | Pentacles | the cube, the coin, the currency |
| d8 | octahedron | air | Swords | |
| d20 | icosahedron | water | Cups | the roundest, the one that rolls furthest |
| d12 | dodecahedron | the aether, the cosmos | the Majors, the trumps | Plato's fifth, "used for the whole"; the trumps over the four suits |
| d10 and d% | the pentagonal trapezohedron | (not a Platonic solid) | the Tree of Life | the ten Sephiroth; the Golden Dawn laid the 22 Majors as the paths between them; two d10 make a hundred |

Seven dice, as there are seven feelings, seven domains and seven sockets on the bracelet. This is the owner's layered meaning: every
die is a suit, the cube is the money, and the d12 is the Majors' own.

## 3. Your dice set

- **Yours, carried:** seven dice, worn as one thing in the Pneuka Box (a fitting of the Courier, like the bracelet's charms). As an item,
  **each die takes its solid's suit** (section 2) and lights on the spread like any other item: a d12 is wild.
- **Rolled at Raku's tables:** the bazaar's games already use the standard set (the attack die gold). You roll yours, not the house's.
- **Glazed at the kiln:** a die glazed one at a time, a firing's price each: a cosmetic sink (ECONOMY.md's glazes, a new row).
- **Luck reads it** (Luck, `progress/luck.js`, is measured in bits and nothing reads it yet): a roll's surprise is its information,
  log2 of its sides (a d20's face is 4.3 bits). Proposal: Luck lets you **re-roll one of your own dice a game day per so many bits**,
  shown on the set. It sways chance only, never skill (DESIGN.md 9).

## 4. The palm die (the god hand's)

The owner's: a die in the hole of the god hand's palm, growing from a d4 to a d20.

- **It grows along the solids:** d4, d6, d8, d12, d20 (fire, earth, air, aether, water). The d10 is the Tree's, not the hand's.
- **It is fed, as Entropy Tactics' Hungry Die is** (ENTROPY-TACTICS.md 1: "anything else you feed to your Hungry Die, the bank that
  grows from a d4 to a d20"). **The palm die is the Hungry Die**: one die, grown in the world and carried to the table. What feeds it is
  the owner's call (7.3); proposals:
  - **cubes** (a sink with a body you can see: Lachrymite fed to Lachrymite);
  - **what the god hand releases** from the vessel (the epic miracles' price, SPINE.md 4);
  - **the junk of play** (a second photograph of a bound card, which condenses into cubes today).
- **What it does:** the owner's vision was the die before its use. Three candidates, and one could take all three in turn:
  1. **At Entropy Tactics' table, it is your Hungry Die**, starting at the size you grew it to (the table caps it, so the table stays
     fair).
  2. **The hand throws it to answer the island**: when a Dissonance Level rises, the island's rejection rolls against your palm die; a
     bigger die holds more of it off. Chance against chance, so Luck may sway it.
  3. **A miracle's spread**: thrown with a miracle, its face widens the circle by a step. (Weakest of the three: it puts a roll on a
     drawn sign, which is a skill.)

## 5. The hands

The god hand already holds "hands" in three senses: the hand itself, a hand of cards (Entropy Tactics draws five Minor Arcana), and the
hand you are dealt. With the palm die, a fourth: the hand that throws. Espada's to write into the world.

## 6. Who builds what (once the owner rules)

- **Dovina:** the dice's rules (`progress/dice.js`: the set, the suits, the palm die's growth and feed), Luck's re-roll, the kiln's
  prices, the achievements, Entropy Tactics' engine when its questions are answered.
- **Calissa:** the set's bodies (Raku's dice set exists: `vfx/bazaarpieces.js`), the palm die in the god hand's palm and its growth.
- **Petra:** the palm die's throw in the god hand, the Box's fitting.
- **Espada:** the name (section 1), the lines, the lore of solid Lachryma shaped by hand.
- **Wanda:** a die's roll, the palm die's growth.

## 7. Questions for the owner

1. **The name** (section 1): "Pneuka stones" (and the vessel's stones qualified), "knucklebones", or plain "dice" for now?
2. **The solids as suits** (section 2): d4 Wands, d6 Pentacles, d8 Swords, d20 Cups, d12 the Majors, d10 the Tree?
3. **What feeds the palm die** (section 4): cubes, the god hand's releases, or the junk of play?
4. **What the palm die does** (section 4): your Hungry Die at the table, an answer to the island's rejection, a miracle's spread, or
   all three?
5. **Luck's re-roll** (section 3): yes?
