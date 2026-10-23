# The Pneuka stones: the stones are dice (a plan)

The owner, 2026-10-23: "I think the player should have their own set of dice, in the standard D&D distribution, the same as what I
designed all those games that are in Raku's bazaar ... that little hole in the palm of the god hand was going to hold an evolving die
from d4 to d20 ... we can refer to them as Pneuka stones, and they just happen to come in the standard D&D denominations. Specialized
solid Lachryma." Then, ruled: **"Conceptually merge the Pneuka stones with the stones that are determining how Lachryma is
processed."**

Dovina's plan. Status: **the merge is ruled**; nothing new is built. The stones' rules (`progress/stones.js`) stand as they are; this
page says what they now are, and what the dice add. The questions (section 8) are the owner's.

## 1. One thing, two names that agree

**The stones** (GLOSSARY section 1; LORE.md 4; `progress/stones.js`) are where Lachryma enters the vessel and where a release leaves it:
the pool's size, regen and costs, the magnet's reach, how heady a drink is, which feeling comes in, where overflow goes, the aperture a
release passes through. **The Pneuka stones are those stones, and they are dice.** A Courier's stones were always a set of seven
pieces of solid Lachryma set in the vessel; their shapes are the standard set's. "The stones" and "the Pneuka stones" name the same
thing, so there is no homonym to qualify: player text says "your stones" or "your Pneuka stones", code keeps `stones.js`, `STONES`,
`stoneOf`.

- **A stone set is a dice set.** One set worn at a time, as now. Its **mineral** is its trade: the Maker's (the Prince's balanced
  choice), amethyst, citrine, moonstone, onyx, emerald, sapphire, ruby, diamond, opal, each row of `STONES` unchanged. A ruby set is
  seven ruby dice, and it drinks as rubies do.
- **Where they sit:** in the vessel's STONES region (the kiln's), as the owner set it on 2026-10-06 ("the Courier has a Courier_Stones
  material that can be recoloured in the kiln"). Glazing your stones at the kiln is glazing your dice.
- **They already roll.** Opal's row is "each drink is a little game of chance, paid out by Luck": the stones were dice before they had
  faces.

## 2. The shapes: the solids are the suits

Seven dice, the standard set, as Raku's tables use. Five are the Platonic solids, which Plato's *Timaeus* gave to the elements, and the
elements are our suits:

| die | solid | Plato's element | suit | |
| --- | --- | --- | --- | --- |
| d4 | tetrahedron | fire | Wands | the sharpest; the smallest die |
| d6 | cube | earth | Pentacles | a cube of Lachrymite is the currency: a coin was always a die |
| d8 | octahedron | air | Swords | |
| d20 | icosahedron | water | Cups | the roundest; rolls furthest |
| d12 | dodecahedron | the aether, "the whole" | the Majors, the trumps | the fifth over the four |
| d10, d% | pentagonal trapezohedron | none | the Tree of Life | the ten Sephiroth; the Golden Dawn laid the 22 Majors as the paths between them |

Seven stones, as there are seven feelings, seven domains and seven sockets on the bracelet.

## 3. What they do: what they did, and they roll

1. **They process Lachryma, as now.** Nothing in the stones' rows changes: the trade is the mineral's.
2. **The chance rolled on your behalf is rolled on your stones**, never an unseen number: a die is thrown where a roll decides.
   - **A puzzle duel's Flee** (a d20 against 15, `progress/duel/flee.js`): thrown with **your d20**, not the house's (the flee's look
     throws Raku's d20 today).
   - **Raku's tables**: the games of the standard set roll **your set** (your glaze on them; the house rolls its own).
   - **Opal's game** (a drink doubled or lost): your stones turning in the vessel.
   - **Entropy Tactics**: your palm die is your Hungry Die (section 4).
3. **Luck reads them.** Luck (`progress/luck.js`) is measured in bits and nothing reads it yet; a roll's surprise is log2 of its sides
   (a d20's face is 4.3 bits). Proposal: **once a game day, per so many bits of Luck, re-roll one of your stones' throws** (shown on
   the set). Chance only, never skill (DESIGN.md 9).

## 4. The palm die: the stones in the god hand's form

Courier, Pneuka Jar and god hand are one being (GLOSSARY section 1). The Courier wears its stones in the vessel; **the god hand holds
them in its palm, as one die**: the owner's die in the hole of the palm. It is the set gathered into one and growing: **d4, d6, d8,
d12, d20** (fire, earth, air, the aether, water; the d10 stays the Tree's).

- **It grows on what the stones drink past full.** Overflow already goes somewhere by the set's row (`overflow`: the Lockheart's share,
  or bled away). Proposal: **a third outlet, the palm die**: what overflows feeds the hand's die, as junk feeds Entropy Tactics' Hungry
  Die. Brimming becomes growth. (Alternatives: the god hand's releases through the stones, SPINE.md 4; or cubes, Lachrymite fed to
  Lachrymite, a sink.)
- **It is the Hungry Die.** At Entropy Tactics' table it starts at the size you grew it to, within the table's cap so the table stays
  fair.
- **It answers the island.** When a Dissonance Level rises, the island's rejection rolls against your palm die: a grown die holds more
  of it off. Chance against chance, so Luck may sway it.
- **Its mineral is your set's.** Wear rubies, and the hand holds a ruby die.

## 5. The hands

The god hand holds "hands" four ways: the hand itself, a hand of cards (Entropy Tactics deals five Minor Arcana), the hand you are
dealt, and the hand that throws. Espada's to write into the world.

## 6. Prior art, and what was taken

- **The old lapidaries**: the stones' virtues (stones.js's header), kept.
- **Plato's *Timaeus***: the five solids as the elements (section 2).
- **The Golden Dawn's Tree of Life**: the ten Sephiroth and the 22 Majors as the paths (the d10).
- **Astragali and astragalomancy**: the first dice were knucklebones, thrown in the hand to read fate (the palm die; Divination).
- **Dungeons & Dragons' standard set**: the seven dice, and a roll as the visible face of chance.
- **Entropy Tactics** (the owner's): the Hungry Die that grows on what you feed it.

## 7. Who builds what

- **Dovina:** the dice's rules beside the stones' (`progress/stones.js`: a set's dice, the palm die's growth on overflow), Luck's re-roll,
  the Flee thrown on your d20, the achievements; Entropy Tactics' engine when its questions are answered.
- **Calissa:** the stones as seven dice in the vessel's STONES region, by mineral; the palm die in the god hand's palm and its growth;
  the flee's look throwing your d20 (Raku's dice set bodies, `vfx/bazaarpieces.js`, in your mineral and glaze).
- **Petra:** the overflow's third outlet in the pool, the palm die in the god hand, your set at Raku's tables.
- **Espada:** LORE.md 4 ("How a Courier drinks"): the stones as solid Lachryma shaped as dice; the hands.
- **Wanda:** a stone's roll, the palm die's growth.

## 8. Questions for the owner

1. **The solids as suits** (section 2): d4 Wands, d6 Pentacles, d8 Swords, d20 Cups, d12 the Majors, d10 the Tree?
2. **What feeds the palm die** (section 4): overflow (proposed), the god hand's releases, or cubes?
3. **What the palm die does** (section 4): your Hungry Die at the table, an answer to the island's rejection, or both?
4. **Luck's re-roll** (section 3): yes?
