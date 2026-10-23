# Classes: what your spread reads as (a plan)

The owner, 2026-10-23: "Wouldn't the classes be better suited for both court cards (mono colour) and Major Arcana (specific colour
combo)? We can have Major Arcana pulling triple, quadruple, even quintuple duty and beyond. It's a game about tarot all over the place.
We're going to have to design RPG classes around them too, in tandem with fleshing out the skill domains and ability unlocks."

Dovina's plan. Status: **the read is built** (`classOf`, `progress/spreads.js`; wired by Petra as the laid spread's class, told as
`spread.court`); **what a class gives is a plan** (sections 4 to 6), waiting on the owner's answers (section 8).

## 1. Golden Sun's idea, our cards

Golden Sun's Adepts change class by the Djinn they set: four elements, and how many of each you hold names your calling (a Venus-heavy
set with a little Mars is a different class from a pure Venus one). Our four suits are the four elements, and the Pneuka Box's tallies
are the Djinn: what you carry, and where it sits on the spread's light, says who you are this hour. Rearrange the Box, become someone
else. No menu picks a class; the board reads it.

## 2. How a class is read (built)

From the four tallies (after the season and the day's card), held meaning at least 1 point:

| what you hold | you read as | how many | example |
| --- | --- | --- | --- |
| nothing | **the Fool** | 1 | a new save: everyone starts here (the Fool is you) |
| one suit | **a court card** of that suit, its rank by depth: Page (under 3 points), Knight (3), Queen (6), King (9) | 16 | 4 Wands alone: the Knight of Wands |
| two suits (or three: the top two count) | **a zodiac Major**: the strongest suit is the sign's element, the second sets its modality | 12 | 6 Wands, 2 Swords: the Emperor (Aries) |
| all four, balanced (each at 4 or more, the weakest at least half the strongest) | **the World** (its four corners are the four elements) | 1 | a careful Celtic Cross |
| (other ways, not built: 3) | the six planets, the Hanged Man, Judgement | 8 | |

**The modality** (the Golden Dawn's Book T gives each element three signs, one of each modality): the second suit against the first.
**Kindred** (fire with air, water with earth: the same kind of element) is **cardinal**; **contrary** (the dignities' foe) is
**fixed**; the remaining one is **mutable**.

| strongest | + kindred: cardinal | + contrary: fixed | + the third: mutable |
| --- | --- | --- | --- |
| Wands (fire) | Swords: **the Emperor** (Aries) | Cups: **Strength** (Leo) | Pentacles: **Temperance** (Sagittarius) |
| Cups (water) | Pentacles: **the Chariot** (Cancer) | Wands: **Death** (Scorpio) | Swords: **the Moon** (Pisces) |
| Swords (air) | Wands: **Justice** (Libra) | Pentacles: **the Star** (Aquarius) | Cups: **the Lovers** (Gemini) |
| Pentacles (earth) | Cups: **the Devil** (Capricorn) | Swords: **the Hierophant** (Taurus) | Wands: **the Hermit** (Virgo) |

A class lifts one suit's cap from 10 to 12 points: a court its own suit, a zodiac Major its second, the World its weakest. Its lift
is the only effect built: what else a class does waits on section 4.

**Measured** (`node scripts/spreads.mjs`, 2000 random lays a spread, placed with care, a season and the day's card): the one-card
spread reads a court 87% of the time (mostly Knights), the three-card a zodiac Major 96%, and the Horseshoe and the Celtic Cross a
zodiac Major or the World (13% in the Cross, never in the Horseshoe). So a new player is a court card, grows into the zodiac with the
bigger spreads, and finds the World only in the Cross. A court in a big spread wants a spread laid for one suit on purpose: that is
the sixteen courts' collection (achievement sc3).

## 3. The other eight Majors (proposals, not built)

- **The six planets** (the Magician Mercury, the High Priestess the Moon, the Empress Venus, the Wheel Jupiter, the Tower Mars, the Sun)
  are the wild cards. Proposal: **you read as a planet when the wild light carries your count**: the planet laid whose wild cells hold
  the most of your counted points, when that is 40% or more of the total. Building around a planet makes you that planet. (Needs
  `light()` to keep which card lit each wild cell: small.)
- **The Hanged Man** (water, suspension, the world seen upside down): proposal, a spread **laid all reversed** that still counts a
  set number of points. You read as the Hanged Man by hanging every card.
- **Judgement** (fire, the call, rebirth): proposal, the **Celtic Cross complete**, its Outcome lit (`spread.complete`). The capstone.

With these, every one of the 22 is a class: 1 + 16 + 12 + 1 + 6 + 2 = 38 classes.

## 4. A Major's duties (the owner's "quintuple duty and beyond")

One card, one identity, everywhere it turns up:

1. **A pair's card**: a main and a sub worn together make it (TOOLS-TOGETHER.md 8); its special opens with an achievement.
2. **A spread card**: laid, its footprint lights the Box (SPREADS.md 5).
3. **A class**: what your tallies read as (section 2).
4. **The day's card**: one game day in 21 it doubles where it lies (SPREADS.md 11.2).
5. **A domain's planet**: the seven planets are the seven domains, and each zodiac Major serves its sign's ruling planet (section 5).
6. **An Entropy Tactics character**: health, a passive, three actives and an ultimate (ENTROPY-TACTICS.md 2). Proposal: **one kit,
   two games**: the class's arts in play are its actives at Raku's table, drawn from one table of data, so a player who knows the
   Emperor in the world knows the Emperor at the board.
7. **A collected card**: bound in the Codex's THE ARCANA (by its photograph or another achievement).
8. **A house card**: on Raku's tables, in Querent (the Fate Clause's boons).

## 5. The domains and their planets (proposal, checked by Espada 2026-10-23: the rulerships right, the Sun and Moon swapped; the owner's to rule)

The seven classical planets for the seven domains, and each zodiac class under its sign's ruling planet (the classical rulers, as the
Golden Dawn used):

| domain | planet, its Major | why | the zodiac classes it rules |
| --- | --- | --- | --- |
| Spellscription | Mercury, the Magician | Hermes: writing, the word that works | the Lovers (Gemini), the Hermit (Virgo) |
| Divination | the Sun, the Sun | Helios the all-seeing, Apollo's oracle | Strength (Leo) |
| Manifestation | Venus, the Empress | bringing forth, the fertile hand | Justice (Libra), the Hierophant (Taurus) |
| Ouranurgy | Jupiter, the Wheel of Fortune | the sky-father, the heavens' wheel | Temperance (Sagittarius), the Moon (Pisces) |
| Psychokinesis | Mars, the Tower | force that topples | the Emperor (Aries), Death (Scorpio) |
| Possession | the Moon, the High Priestess | lunatic and moonstruck, the veil; the Chariot a driver holding reins not his own | the Chariot (Cancer) |
| Alteration | Saturn, the World | time, limits and change; the World's own planet | the Star (Aquarius), the Devil (Capricorn) |

Courts serve no domain: they serve their suit (their lift), as a court serves its house.

### 5.1 The domains on the god hand (palmistry, taken in by the owner, 2026-10-23, through Espada)

Palmistry seats the seven planets on the hand (its mounts), so through the table above every domain has a place on the god hand,
beside the knucklebone on that finger (DICE.md 4.1):

| mount | planet | domain | the die there |
| --- | --- | --- | --- |
| the index finger | Jupiter | Ouranurgy | d10 (Cups) |
| the middle finger | Saturn | Alteration | d8 (Swords) |
| the ring finger | the Sun | Divination | d6 (Pentacles) |
| the little finger | Mercury | Spellscription | d4 (Wands) |
| the thumb's root | Venus | Manifestation | d12 (the zodiac) |
| the palm's heart | Mars | Psychokinesis | d20, the palm die (the Majors) |
| the palm's outer edge | the Moon | Possession | (none) |

The Sun and Moon rows follow Espada's swap (section 5), which waits on the owner. A domain's level could show on its mount (Calissa's).

### 5.2 Two more readings of the hand (Espada's proposals; plans, not rules)

- **The four great lines as four readings of the ledger:** the life line (time played and shatters lived through), the head line (arts
  and domains learned), the heart line (bonds: spirits, the folk, siblings), the fate line (Luck's bits and achievements). Read on the
  god hand's palm as the overlay does (a readout, never a gate), and in the Codex's STATUS shelf.
- **The god hand's shape by the suit you lean on:** palmistry's four elemental hands (earth: a square palm, short fingers; air: square,
  long; fire: long palm, short fingers; water: long, long). The hand takes the shape of your class's suit (a court's own, a zodiac
  Major's element), so changing the Box changes the hand. A look only, Calissa's; no rule changes with it.


## 6. What a class gives (proposal)

Every rule here keeps the design laws (DESIGN.md 22): arts only by achievement; a modifier with a source you can see; the core movement
untouched.

1. **Its lift** (built): one suit's cap to 12.
2. **Its domain's affinity**: experience in its ruling domain x1.25 while you read as it. The board says why your Divination is
   climbing faster.
3. **Its arts, learned in it and kept** (Final Fantasy Tactics' jobs: abilities bought with that job's points, then usable from any
   job as a secondary). A class has two arts. Each is opened by **an achievement done while you read as that class** (the Chariot's
   art for a race won as the Chariot). Once open, it is yours in any class. So a class is where you learn, never what you must wear to
   use what you learned: skill skips grind (you can earn an art in one session as the right class), grind closes the gap (any class
   reaches every art in the end).
4. **Its Entropy Tactics kit** (4.6): the same two arts are two of its three actives at the table.

The cost is content: 38 classes at two arts each is 76 arts, plus the 22 Majors' table kits. Ship in waves of four (as
ENTROPY-TACTICS.md 3.b proposed for the table), each measured before the next.

## 7. Prior art, and what was taken

- **Golden Sun**: the class read from the Djinn you hold (section 1). Taken: the read; not taken, the class granting spells outright.
- **Final Fantasy Tactics**: abilities learned in a job and kept as a secondary (6.3).
- **Persona**: each Persona belongs to an Arcana; a card is a calling. Taken: the Major as identity.
- **The Golden Dawn's Book T**: the courts' elements, the zodiac's elements and modalities, the planets' rulers (sections 2, 5).
- **Octopath Traveler's secondary jobs**: two identities at once, a primary and a borrowed one (the arts kept across classes).

## 8. Questions for the owner

1. **The read** (section 2): one suit a court, two a zodiac Major, all four the World. Right?
2. **The other eight** (section 3): planets by the wild light, the Hanged Man by an all-reversed spread, Judgement by the Celtic Cross
   complete. Or your own?
3. **The domains' planets** (section 5): this mapping, or another?
4. **What a class gives** (section 6): the lift, the domain's affinity, two arts learned in it and kept. Is "learned in a class, kept
   for every class" right, or should an art stay with its class?
5. **One kit, two games** (4.6): a class's arts are its Entropy Tactics actives?
6. **The first wave of four**: the Fool and three of your choosing?
7. **Palmistry's two readings** (5.2): the four lines as ledger readings, and the hand's shape by your suit?
8. **The Sun and Moon swap** (section 5): the Sun to Divination, the Moon to Possession?
