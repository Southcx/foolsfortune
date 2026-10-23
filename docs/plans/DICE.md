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
`stoneOf`. On screen the label is **dice** (CLARITY.md: the genre's word); "Pneuka stones" is the world's and the Codex's. Espada's
triple: a stone is the gemstone (the set's mineral), the die (stones were cast before bones), and stoneware (Pip's tier). Knucklebones
stay in the lore only: the first dice, in the god hand's knuckles, and astragalomancy's root for Divination.

- **A stone set is a dice set.** One set worn at a time, as now. Its **mineral** is its trade: the Maker's (the Prince's balanced
  choice), amethyst, citrine, moonstone, onyx, emerald, sapphire, ruby, diamond, opal, each row of `STONES` unchanged. A ruby set is
  seven ruby dice, and it drinks as rubies do.
- **Where they sit:** in the vessel's STONES region (the kiln's), as the owner set it on 2026-10-06 ("the Courier has a Courier_Stones
  material that can be recoloured in the kiln"). Glazing your stones at the kiln is glazing your dice.
- **They already roll.** Opal's row is "each drink is a little game of chance, paid out by Luck": the stones were dice before they had
  faces.

## 2. The shapes: the solids are the suits

Seven dice, the standard set, as Raku's tables use. Five are the Platonic solids, which Plato's *Timaeus* gave to the elements, and the
owner ruled the suits (2026-10-23, through Espada):

| die | solid | Plato's element | suit (ruled) | |
| --- | --- | --- | --- | --- |
| d4 | tetrahedron | fire | Wands | the sharpest; the smallest die |
| d6 | cube | earth | Pentacles | a cube of Lachrymite is the currency: a coin was always a die |
| d8 | octahedron | air | Swords | |
| d10 | pentagonal trapezohedron | (none) | **Cups** (water) | the owner, 2026-10-23 |
| d20 | icosahedron | water | **the Major Arcana, I to XX** | the owner: twenty faces, the Magician to Judgement; "I truncate The Fool and The World, like putting the alpha and omega in separate categories": the Fool is you, who throws; the World is the whole, never one face |
| d12 | dodecahedron | the aether, "the whole heaven" | **open** | the lore keeps Plato's whole heaven, the zodiac's twelve signs, until a mechanic needs it |
| d% | pentagonal trapezohedron | (none) | open | the tens die beside the d10 |

Seven stones, as there are seven feelings, seven domains and seven sockets on the bracelet. The palm die's growth (d4 to d20) ends
on the Majors' die: the hand grows toward the trumps (Espada).

## 3. What they do: what they did, and they roll

1. **They process Lachryma, as now.** Nothing in the stones' rows changes: the trade is the mineral's.
2. **The chance rolled on your behalf is rolled on your stones**, never an unseen number: a die is thrown where a roll decides.
   - **A puzzle duel's Flee** (a d20 against 15, `progress/duel/flee.js`): thrown with **your d20**, not the house's (the flee's look
     throws Raku's d20 today).
   - **Raku's tables**: the games of the standard set roll **your set** (your glaze on them; the house rolls its own).
   - **Opal's game** (a drink doubled or lost): your stones turning in the vessel.
   - **Entropy Tactics**: your palm die is your Hungry Die (section 4).
3. **Luck reads them.** Luck (`progress/luck.js`) is measured in bits and nothing reads it yet; a roll's surprise is log2 of its sides
   (a d20's face is 4.3 bits). Ruled (the owner: "sure"): **one re-roll a game day, one more per 100 bits of Luck, at most 3** (`REROLL`, `rerollsOf`,
   `progress/dice.js`), shown on the set. Waits on the first throw of your own dice to be wired. Chance only, never skill (DESIGN.md 9).

## 4. The palm die: the stones in the god hand's form

Courier, Pneuka Jar and god hand are one being (GLOSSARY section 1). The Courier wears its stones in the vessel; **the god hand holds
them in its palm, as one die**: the owner's die in the hole of the palm. It is the set gathered into one and growing: **d4, d6, d8,
d12, d20** (fire, earth, air, the aether, and the Majors' own).

- **It condenses overflow into cubes** (the owner, ruled 2026-10-23: overflow "goes into the Lockheart first if applicable, then
  converted into solid Lachryma cubes via the palm die"). Built: `progress/dice.js`, `game.palmDie`. The pool's overflow, in order:
  the Lockheart drinks its share if it is worn and has room (the worn stone's `overflow.lockheart`); a stone's `bleed` share is lost
  (amethyst's trade); **the palm die condenses the rest into cubes** at its size's rate, up to its size's cap a game day, and **grows
  on what it has condensed**:

  | die | cubes a unit of Lachryma | cap a game day | grows into the next at, condensed in all |
  | --- | --- | --- | --- |
  | d4 | 0.03 | 8 | 40 |
  | d6 | 0.04 | 12 | 120 |
  | d8 | 0.05 | 16 | 300 |
  | d12 | 0.065 | 24 | 700 |
  | d20 | 0.08 | 40 | |

  **The Lockheart converts better** (the owner, 2026-10-23: "the Lockheart as a bespoke tool would be more effective at conversion,
  but even players who don't want to use a Lockheart can still convert"). It drinks first; its brass key turns a full coffin into 12
  cubes a 100 Lachryma (0.12), a brimming one 0.24, with no cap a game day; the palm die's best is 0.08, two thirds of the plain rate,
  a third of the brimming, and capped. Everyone converts; the one who carries the tool for it converts more.
  **Why a cap:** a fighter overflows thousands of Lachryma a real hour; the rate alone would pay twice the aim. At the cap, the d20
  adds 40 cubes a real hour at most (0.08 of the aim), and every profile stays under the 1.5x cap with it (`scripts/economy.mjs`: the
  fighter 1.35x, the miner 1.36x, the treasury 1.35x, counting Pentacles on what each really sells). The d20 is some forty game days
  of steady overflow away: the long arc. Headless: 20,000 Lachryma of overflow at a d4 condensed 8 cubes, its cap, into the ledger.
- **The log** says a growth ("Your palm die grows into a d8."), never a condensing: the cube plate's rolling count is that avenue.
- **Achievements:** pd1 a d8, pd2 a d20 (a title), pd3 300 cubes condensed (`progress/spreadachievements.js`).
- **It is the Hungry Die** (ruled: both uses). At Entropy Tactics' table it starts at the size you grew it to, within the table's cap so the table stays
  fair.
- **It answers the island** (ruled: both uses). When a Dissonance Level rises, the island's rejection rolls against your palm die: a grown die holds more
  of it off. Chance against chance, so Luck may sway it.
- **Its mineral is your set's.** Wear rubies, and the hand holds a ruby die.

### 4.1 The fingers (the owner, 2026-10-23, through Espada)

Each knucklebone has its place on the god hand: **d4 the little finger, d6 the ring finger, d8 the middle finger, d10 the index
finger, d12 the thumb, d20 the palm.** The d% has no finger yet. So the palm die's last size, the d20 (the Majors I to XX), is the
palm's own die: the hand grows its one stone into the place that was waiting for it. Where the other six sit on the hand (a stone in
each finger's knuckle, its suit's) is Calissa's to show.

## 5. The hands

The god hand holds "hands" four ways: the hand itself, a hand of cards (Entropy Tactics deals five Minor Arcana), the hand you are
dealt, and the hand that throws. Espada's to write into the world.

## 6. Prior art, and what was taken

- **The old lapidaries**: the stones' virtues (stones.js's header), kept.
- **Plato's *Timaeus***: the five solids as the elements (section 2).
- **The owner's own d20 mapping**: the Majors I to XX on its faces, the Fool and the World outside (alpha and omega).
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

## 8. Ruled (the owner, 2026-10-23)

1. The stones are the Pneuka stones (section 1).
2. Overflow: the Lockheart first, then the palm die condenses the rest into cubes (section 4; built).
3. The palm die is both the Hungry Die at Entropy Tactics' table and the answer to the island's rejection (section 4).
4. Luck's re-roll: yes (section 3; the rule built, the throw to wire).
5. The dice's suits (section 2): d4 Wands, d6 Pentacles, d8 Swords, d10 Cups, d20 the Majors I to XX.
6. The fingers (4.1): d4 little, d6 ring, d8 middle, d10 index, d12 thumb, d20 palm; the d% has none yet.
7. "Releases", asked: the way out of SPINE.md 4 (a tier IV caster shell, an Overload, an epic miracle), not every god power.

## 9. Open

1. The d12 and the d% have no suit yet (section 2); the d12 waits on a mechanic that needs it.
