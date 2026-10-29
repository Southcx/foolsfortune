# DOMAIN SOURCES: every mode trains a domain (Dovina, 2026-10-29)

**Asked:** South, 2026-10-29: "let's evaluate the progression systems for the seven domains, and which ones are still unwired for
experience gain, and what we can do to address all of our open design gaps." The sources are in `src/progress/domains.js` (`SOURCES`).
The rules they keep are in DESIGN.md section 22 and the header of `domains.js`.

## 1. What was unwired (measured on v344 + this branch)

Every source in `SOURCES` was checked against the code for an emitter. Every god power, tool, rail and duel source fires. **One source
had no emitter on main:** `angle.release` (the lift's let-go; Calissa emits it on her branch, 2026-10-29). Since 2026-10-29 the landing itself pays
Possession (`angle.catch`), so fishing trains Possession today whichever way the lift ends.

The gaps were whole **modes**, not single sources:

| mode | paid before | the gap |
| --- | --- | --- |
| a fight on foot | the parry and a windup read (Divination), Blade Mode (Ouranurgy), reprogramming, the Lockheart's drain | **a creature downed paid nothing.** The psygun, the cutlass's string, the kick, the Crucibelle's toll, the Flash: none trained a domain |
| the Raceway | nothing | races, the trick combo, the track editor and the haunt paid no domain |
| the open sea | photographs (as `photo.take`), the ship's crossing on the rail | salvage, the beasts, habits, caches, line-ups, squares done, echoes: nothing |
| the Spirit Garden | the hand's sculpting (Alteration) | tending, the spores, the spirits (bound, wishes, farewells): nothing |
| the world's Lachryma | the brush's glyphs, inscriptions and wash | paint laid, blots mopped, the Dreamvane's finds and fork: nothing |
| a puzzle duel | the powers cast (their domains) | the aberrant's secret found: nothing |

The three thin domains were **Psychokinesis** (outside the god hand, only the Throwing Room's drills), **Manifestation** (only the
brush's wash) and **Alteration** (only the brush's inscriptions and the garden's sculpting).

## 2. The sources added (all on events that already exist; their quality on fields they already carry)

- **A creature downed on foot trains the domain of the blow that downed it** (`DOWN_DOMAIN`, by the killing blow's damage type,
  `combat/types.js CAUSE_TYPE`):

  | type | domain | dealt by |
  | --- | --- | --- |
  | Impact | Psychokinesis | the psygun, the Sondelass, the kick |
  | Ego | Divination | the Flash, reprogramming |
  | Influence | Possession | the Crucibelle's song and toll |
  | Illusion | Manifestation | the Soul Brush, the Dreamvane's fork |
  | Delirium | Alteration | the Lockheart |

  The kill is paid in acts by the creature's size (`1 + maxHp / 8`, at most 8: a clapperjar 1, a slip jelly 2, the Great Slip Jelly 7).
  Its quality is masterful (1) for an annihilation, 0.85 for a trump, and middling (0.5) otherwise. Choosing the right tool for the foe
  is the skill this rewards (Pokemon's type chart, made to pay). The tool you fight with decides which domain grows, so a build is
  chosen by playing, not by a menu.
- **The Raceway:**
  - A race finished is Ouranurgy, in acts by its time; its quality by medal (gold 1, silver 0.7, bronze 0.45; with no medal, by place
    among the rivals). Practice, the test lap and a validate run pay nothing here.
  - A trick combo banked is Psychokinesis, by its multiplier.
  - A made track validated is Manifestation. It pays only a new geometry (`fresh` on `track.validate`, Petra's, main 5bb173cd).
  - A haunt is Possession, in acts by its time; held is its masterful end.
- **The open sea:**
  - Salvage hauled up is Psychokinesis, by tier.
  - A serpent or a beast sunk is Psychokinesis (12 and 16 acts).
  - A habit caught (a first one 0.9), a cache dowsed out, a line-up closed and a square completed are Divination.
  - An echo sung back is Spellscription.
- **The Spirit Garden:**
  - A planetoid tended is Alteration, its quality the harmony it reached.
  - A spore bed inoculated is Alteration.
  - A spirit bound, a wish granted (its quality the bond) and a farewell given (10 acts, masterful) are Possession.
- **The world's Lachryma:**
  - Paint laid is Manifestation, by its area.
  - A blot mopped up is Alteration, by how far it had grown.
  - The Dreamvane's dowse turning something up is Divination.
  - The fork caught back is Psychokinesis.
- **A puzzle duel:** an aberrant's secret found (its end, not its steps) is Divination, 6 acts, masterful.

What still pays nothing, on purpose:
- the core movement (the gold standard: Blink and the hook's swing are the only moves that train, as arts);
- buying, the kiln's firings, and anything cosmetic;
- Raku's tables (chance is Luck's, never a domain's);
- Soul Alchemy's pressing (it has its own seven attributes);
- practice of any kind;
- Strawman.

## 3. The coverage now (sources a domain has in each mode)

| domain | on foot | god hand | garden | Raceway | sea and rail | duel | total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ouranurgy | Blink, the swing, Blade Mode, zandatsu, reprogramming, the canvas | portal, fold, hasten, epic | - | race | the crossing | power | 13 |
| Manifestation | wash, paint, Illusion downs | manifest, sculpt, set fast, totem, epic | - | validate | - | power | 10 |
| Divination | survey, crystal, photo, parry, windup, dig, Ego downs, the Great Dunemaw charted | strata, course, read, epic | - | - | reckoning, habit, cache, line-up, square | power, secret | 19 |
| Psychokinesis | drills, fork, Impact downs | grab, throw, scoop, pour, gust, slab, epic | - | combo | salvage, serpent, beast | power | 15 |
| Possession | reprogramming, drain, fish, Influence downs | herd, take, muster, epic | bind, wish, farewell | haunt | - | power | 14 |
| Alteration | inscribe, mop, Delirium downs | sunder, swell, wring, shape, carve, transmute, epic | sculpt, tend, spores | - | - | power | 14 |
| Spellscription | reprogramming, glyph, song, rhythm | miracle, ward, stamp, epic | - | - | echo | power | 10 |

Every domain now has a source on foot. Every mode now feeds at least one domain. Two cells are still empty and are worth filling when
their mode grows:
- **the Raceway's Divination and Spellscription:** reading a race's condition, or riding a line to the music;
- **the sea's Manifestation and Alteration:** forging a part (`FORGE`), and the Spirit Garden's look from the sea.

**Scale.** `PACE` is unchanged: 99 is still 300 hours of middling play in every domain. A domain's scale is set from its sources' mean
base, so adding sources moved each scale a little. Divination's ordinary sources pay about 7% less than before; Manifestation's about
10% more. The new big acts pay by time, so they keep the rate of a minute of play.

## 4. Asks

- **Espada:** none. These are rules; the log says nothing new (a level is said by `psyche`'s own rule).
