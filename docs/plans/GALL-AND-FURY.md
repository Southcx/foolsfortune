# Gall and Fury: the sixth and seventh feelings

The owner, 2026-10-09:
- On QAIS: "Cut faith, build Gall and Fury. My gut says to keep it to seven emotions for color coding purposes, and 'Faith' and
  'Wonder' are close enough for me."
- On the Lachryma loop: "Go full deep on Gall and Fury."

Kept by Dovina. This is the whole of it, so nothing is lost to a compaction:
- every system the feelings touch;
- what each one does with the two new ones;
- what is ruled and what is open;
- who builds what, in which order.

It extends `docs/plans/WHEEL.md` (Plutchik's wheel, the expansion and contraction principle, the rings and the agates), which stays the
background. Where the two disagree, this file wins (Faith is cut here).

## 1. Who they are

| | **Gall** | **Fury** |
|---|---|---|
| Plutchik's petal | disgust | anger |
| Its rings (mild, basic, intense) | boredom, disgust, loathing ("gall" at basic) | annoyance, anger, rage ("fury" at intense) |
| What it does in a mind | rejects, refuses, keeps away, sours what it touches | pushes, breaks, rushes in, burns hot and short |
| How it moves (the flame, the body) | recoils, holds back, turns aside | surges, lunges, shakes |
| Its opposite | **none: it does not cancel** (see 2) | **Dread** (fear and anger cancel, as WHEEL.md already rules) |
| Colour (`COLOR`, already in `weather.js`) | violet `0x8a5ac8` | blood red `0xc80018` (Calissa, measured: apart from Desire, and from Dread for protanopes) |
| Motif (never colour alone) | rot: drips, flies, a curdled film | heat: sparks, cracks of light, hail |

**The seven, in display order** (VALENCE, most positive first, the order every menu, legend and radial shows):
**Wonder, Mirth, Desire, Fury, Gall, Grief, Dread**. The order is already generated from `VALENCE` (fury −0.5, gall −1); remove `faith`
from every table.

## 2. The opposites: an odd number

Seven feelings can't all pair. With Faith cut, Gall's Plutchik opposite (trust) is gone.

**Ruled (Dovina): Gall has no opposite.** Disgust is the one feeling nothing cancels; it is only:
- **outlasted** (it fades on its own), or
- **washed out** (the Fair spray, the mop).

This makes Gall the sticky feeling: it lingers where it lands, and its weather sours what it touches. It stays one rule:
`OPPOSITE.gall = null`.
- In the weather: a Gall spell is never weakened by an opposed second mood.
- In the paint map: Gall paint is overwritten (the last writer wins) but never cancels to bare ground.

The other pairs are unchanged: Wonder and Desire, Mirth and Grief, Dread and Fury.

## 3. On the Law to Chaos line

`ASPECTS` is the Law-to-Chaos line the systems read (the weather's lean, the rail's danger, the astral share). The seven:

**Mirth · Wonder · Desire · Grief · Gall · Dread · Fury** (Law to Chaos).
- Fury is the far end, rage being order's last enemy.
- Gall sits beside Grief: both turn inward and sour.

**What breaks:** the weather maps a mood from −2 to +2 onto five slots (`ASPECTS[Math.round(mood) + 2]`). With seven it maps −3 to +3.
- **Anagami's sky must never reach the ends.** Its lean keeps the mood within ±2. Gall and Fury live past that, so they fall on Anagami
  only where a place reaches further, below.

## 4. Where they fall (geography, WHEEL.md's ruling kept)

Lachryma is every feeling; a place carries a few. Gall and Fury are rare under Anagami's sky:
- **The Great Dunemaw's weather** reaches them: a Well's own lean already runs deeper. On its third floor and in the bowl, the weather
  may be Gall or Fury. That makes the rebuilt fight the first place you meet them.
- **The Emocean, from Entropolis:** the Queen's island's plumes carry Fury and Gall out to sea. A waypoint near Entropolis can have
  either feeling, and a front between a Fury plume and a Dread plume cancels.
- **Margarite** never has them (Law's end).

The names of the weathers (WHEEL.md's placeholders, Espada's to settle):
- **Gall: the miasma.** A low sour fog, flies in it, a curdled film on water.
- **Fury: the hail.** Hard white pellets on clay and glaze, never thunder (thunder is Dread's).

## 5. Learning a feeling (how the Courier gets them)

The Courier refines crude into feelings, but only the ones they **know**.
- **A feeling is known once you have drunk it.** You don't have to remember: you learn one by drinking Lachryma of that feeling (a
  bauble in that weather, a paint of it mopped up).
- The five are known from the start (Anagami's waters). Gall and Fury are learned where they fall: the Great Dunemaw, or the Emocean
  near Entropolis.
- Until then, their slots on the radial show locked. A locked slot names where the feeling falls in one line ("Falls in the Great
  Dunemaw's deep weather").
- It is counted, and an achievement opens it (the design law: arts only by achievement). The ledger counts `feeling.known.<id>`. The
  achievement **"Bitter Taste"** (Gall) or **"Seeing Red"** (Fury) is the unlock (Espada's to name).

This makes the two new feelings content, not menu clutter: you earn your seventh colour.

## 6. Paint, and what it does to a mind (the Lachryma loop, phase 2)

With seven paints on the radial, each paints its feeling onto the ground. Sunshine's goop only slows, burns or shocks Mario. Ours also
acts on the creatures standing in it, through the minds we already have (a painted cell is a stimulus).

| Paint | On the Courier (the paint-movement knack) | On a creature standing in it |
|---|---|---|
| your own feeling (the draught's) | faster, refills the bottle | as its feeling below |
| Wonder | | drawn to it, curious: a lure |
| Mirth | | calmer, its EmO falls |
| Desire | | wants it, comes to it |
| **Fury** | slows you (others' feeling) | **enrages it**: EmO up past the band. It fights harder and yields more Lachryma if you survive (risk for reward). |
| **Gall** | slows you; it is a sour floor | **won't cross it**: Gall paint is a wall to minds. You can fence a creature in or out. |
| Grief | | slows it |
| Dread | | flees it |

**Fair** (the eighth slot) clears all of them. Crude is no feeling: it slips (`slick`) and is mopped.

Each row is one small rule in a mind (`creatures/ai/`), read through the stimulus a cell gives off. They are built in phase 2, after
the painting itself hits what you aim at.

## 7. Combat: damage types stay five (the backbone)

WHEEL.md's backbone holds: **forces don't expand; feelings do.** The five damage types and their statuses stay. Each new feeling
feeds the type nearest it, so `TYPE_OF` gains two rows:

| Feeling | Damage type | Its status | Why |
|---|---|---|---|
| **Fury** | **Impact** (with Mirth) | stun | anger is force: raw, blunt, breaking |
| **Gall** | **Ego** (with Wonder) | doubt | disgust is rejection: contempt makes a mind doubt itself |

- **Draught:** a Fury draught builds stun faster, a Gall draught doubt. This needs no new code: `TYPE_OF` drives it.
- **Weakness:** the grain's weakness (`temperament.js` `SWAY`) already has rows for gall and fury.
- **Annihilation is unchanged** (Impact on confusion, Delirium on stun).

**Deliberately not done:** a sixth or seventh damage type. Each one would need a status, a trump in the cycle, a damage look and a
weakness for every creature. Two feelings sharing a type doubles their weight, never their count.

## 8. The garden: five phases stay five

The garden is built on the five phases (wood, fire, earth, metal, water: `PHASE`, `GENERATES`, `OVERCOMES`, the grounds, the strains, the
waters). It's a closed cycle like the damage types, and it stays five.

Gall and Fury enter the garden only as **weather and water**, and they spoil what they touch:
- **Gall rain wilts the plants** it falls on (they lose a stage, like drought) and **sours water**, which stops a bed growing until it
  is washed with Fair or mopped.
- **Fury rain bakes clay**: terraforming in a Fury storm is stiff (strokes half as strong), and moss scorches to ash.
- **The water's mix** keeps one number a feeling per cell (`garden/water.js`), so it grows from five channels to seven. That's the one
  structural cost here. Two opposites in the mix still cancel. Gall cancels with nothing, so it **lingers in water** (it decays at a
  third of the others' rate).
- **No new strain or ground.** The mycelium's five strains and the five grounds stay.

## 9. Soul Alchemy and materials

- **Material kinds** (`econ/materials.js` `KINDS`, seven of them) already outnumber the feelings. Five are tied to a feeling (`realm.js`
  `KIND_OF`), and two are free. Gall and Fury take them:
  - **Gall: finery** (charms, pigments: vanity and contempt);
  - **Fury: art** (passion, a thing made in heat).

  `KIND_OF` gains two rows; `spirits.js` `stat` gains finery and art.
- **The colour wheel** (the press) is a hue circle under everything. Gall's violet (about 265°) and Fury's red (about 4°) sit on it
  already, and `FEELING_HUE` grows to seven. The attributes' targets are their own (unchanged).

## 10. Creatures (the Lantern Wisp's suite)

| | Mood loop (basic ring) | Emote (intense ring, at onset) |
|---|---|---|
| Fury | **Angry** (in the suite) | Attack_Cast's wind-up, held and shaking |
| Gall | **the one gap**: a recoil loop (turned aside, flame low and guttering). Calissa authors it, or borrows Scared turned away | a shudder (Hit, small and repeated) |

- **Spirits** keep five stats: a Fury-fed spirit trains **strength**, a Gall-fed one **will**.
- **The grain:** its sway rows for gall and fury are already in `temperament.js`.

## 11. Sound and music (Wanda's)

- **Modes** (WHEEL.md's pairs; Faith's Yo is now free):
  - Fury: a **tritone minor** pentatonic [0, 3, 6, 7, 10] (against Dread's In);
  - Gall: a **Hijaz** pentatonic [0, 1, 4, 7, 8], sour and unopposed: it borrows no note when mixed.
- **Beds:**
  - Fury's: hail on clay and glaze, a hot low pressure, never thunder;
  - Gall's: flies, a sour wet hum, a drip.
- **The rail:** an astral share for each (`TRIP.astral`): fury 0.2 (mostly Umbral: it dives), gall 0.3.

## 12. The rail and the sea

`ECON.rail` reads a feeling in four tables (`mind`, `danger`, `lead`, `fill`), and `TRIP.astral` in a fifth. The new rows:

| | mind | danger | lead | fill | astral |
|---|---|---|---|---|---|
| fury | 0.6 | 0.6 | 0.7 | 2 | 0.2 |
| gall | 0.4 | 0.35 | 0.6 | 2 | 0.3 |

- **Fury is the most dangerous water:** foes a class up at the far end, a short lead.
- **Gall shortens the lead:** a miasma hides what is coming.
- **A following sea** (the draught's trump) of Fury trumps Dread's foes, by the cancellation rule.

## 13. Agates (two at once), Plutchik's dyads in plain words (Espada's to settle)

| Pair | Plutchik | Working word |
|---|---|---|
| Fury + Mirth | pride | pride |
| Fury + Desire | aggressiveness | hunger to win ("drive") |
| Fury + Wonder | outrage | outrage |
| Fury + Grief | envy | envy |
| Fury + Gall | contempt | contempt |
| Gall + Grief | remorse | remorse |
| Gall + Dread | shame | shame |
| Gall + Wonder | unbelief | unbelief |
| Gall + Mirth | morbidness | gallows humour |
| Gall + Desire | cynicism | cynicism |
| Fury + Dread | opposites | cancel (no agate) |

The rule stands: a sky or a mind shows one feeling or one agate, never three.

## 14. What to remove (Faith is cut)
`faith` comes out of:
- `weather.js`: `VALENCE`, `COLOR`, `OPPOSITE`;
- `temperament.js`: `SWAY`;
- WHEEL.md's tables;
- the glossary.

Nothing in play used it.

## 15. Who builds what, in order

**Phase 1: the colours** (paintable, seen in the weather, the radial and the art):
1. **Dovina:**
   - `weather.js`: ASPECTS to seven, the mood mapped −3 to +3, Anagami's lean held within ±2, `OPPOSITE.gall = null`, `TYPE_OF`, `NAMES`;
     faith removed;
   - the rail tables (`ECON.rail`, `TRIP.astral`); `KIND_OF`, spirits' `stat`; `FEELING_HUE`;
   - `feeling.known.*` in the ledger, and the two unlock achievements;
   - the glossary's "five feelings" line becomes seven, with Gall and Fury named.
2. **Espada:** the weathers' names (the miasma, the hail), the rings' words, the agates' words, the achievements' names, the log lines.
3. **Calissa:** the two weather looks (the miasma's fog and flies; the hail's pellets), the radial's eight icons, the paint's motifs, the
   Gall recoil clip.
4. **Wanda:** the two modes and beds.
5. **Petra:**
   - the radial (keys and picker);
   - the paint map's seven feelings (a cell's feeling byte);
   - the garden water's seven channels;
   - every `[0,0,0,0,0]` literal (WHEEL.md's sweep list);
   - the Dunemaw's weather reaching ±3.

**Phase 2: the world:**
- the paint's effect on minds (section 6);
- the garden's wilting and scorching (section 8);
- Entropolis's plumes at sea;
- fish of Gall and Fury (parked with fishing).

**Phase 3, only if play asks:** a new damage type. Not planned.

## 16. What is open
1. **Espada:** every name in sections 4, 5 and 13.
2. **The owner:** confirm that Gall has no opposite (section 2), and that a feeling is learned by drinking it (section 5).
3. **Calissa:** whether Fury's red reads apart from Desire's orange at a glance. The motifs make them distinct; the hues may need to
   move.
