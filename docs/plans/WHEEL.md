# The Wheel: a complete map of feeling (the owner, 2026-10-05)

Kept by Dovina. The owner's ask: a complete emotional wheel after **Plutchik's wheel of emotions** (as presented by 6 Seconds, 2025:
<https://www.6seconds.org/2025/02/06/plutchik-wheel-emotions/>), applied to the existing systems. Determined by all four divisions and
Dovina on 2026-10-05; partly built (`src/progress/weather.js`: `VALENCE`, `DISPLAY_ORDER`, `COLOR`, `AGATES`, `agateOf`, `OPPOSITE`).

## Plutchik, in brief

Eight primary emotions in four opposed pairs (joy/sadness, trust/disgust, fear/anger, surprise/anticipation); intensity in three rings
per petal, strongest at the centre; dyads where two adjacent petals blend; several feelings at once, and a feeling left unchecked
intensifies.

## Our five on the wheel

| Ours (shown order) | Plutchik's petal | Its rings (mild, basic, intense) | Its opposite |
|---|---|---|---|
| **Wonder** | surprise | distraction, surprise, amazement | anticipation = **Desire** |
| **Mirth** | joy | serenity, joy, ecstasy | sadness = **Grief** |
| **Desire** | anticipation | interest, anticipation, vigilance | surprise = **Wonder** |
| **Grief** | sadness | pensiveness, sadness, grief | joy = **Mirth** |
| **Dread** | fear | apprehension, fear, terror | anger: **Fury** (staged) |

Missing: Trust, Disgust, Anger. With them the wheel closes.

**The backbone:** **feelings** (states: the aspects of Lachryma, the weather, the crude, the fish, the creatures' moods, the songs)
expand to the wheel. **Forces and characters** stay as they are: the five damage types and their statuses, the grain (the five traits
of temperament), the seven domains, the seven attributes. Each is a closed, balanced set, and none is a feeling.

## The owner's principle: expansion, then contraction (2026-10-05)

"Emotional mixes help simplify things: we don't want mental overload juggling too many emotions." The wheel grows the world, never the
load on the player:
- **A place carries few feelings.** Anagami the five, Margarite its faith and mirth, Entropolis's underground its fury and gall; new
  feelings arrive with new places, a few at a time.
- **A mind shows one feeling, or one agate.** Never three.
- **Rings are adjectives**, not new names: intensity changes how a feeling looks, sounds and pays, never how many there are.
- **Each expansion is followed by a contraction pass:** prune what does not earn its place, merge what reads alike, keep the shown
  order short.

## The determination

**Agreed, now:**
1. **Rings are adjectives on strengths we already have** (the weather's strength, a creature's mood, a cask's grade). Kid-safe words
   (Espada): mirth's top ring is "elation", not "ecstasy". The centre of the wheel is our Prismatic. One tier per channel (Calissa): sky,
   mild a tint, basic what falls, intense the weather's mark and Wanda's layer; body, mild a cast in the temper's glow, basic the
   expression clip, intense the particle aura and a glyph at onset. Intensity as character (Wanda): mild the bed alone, sparse; basic
   adds the mood layer; intense leans on the mode's signature note and takes the world's own sounds; Prismatic goes whole-tone and
   floats; voices show their traits at about half strength mild, one and a half intense. **Not yet built.**
2. **Opposites cancel**, heard and seen. Built in the weather (`OPPOSITE`: an opposed second mood weakens the first). Still to build:
   pressing a material of the opposite aspect pulls the soul colour back; a lure of the opposite aspect repels a fish; musical opposites
   (Wanda): mirth/grief major against minor pentatonic; wonder/desire Lydian against Dorian pentatonic; dread/fury In against a tritone
   minor [0, 3, 6, 7, 10]; faith/gall Yo [0, 2, 5, 7, 9] against a Hijaz pentatonic [0, 1, 4, 7, 8].
3. **AGATE: two feelings wedged, never blended** (Espada's word, after agateware). Built in the weather (`AGATES`, `agateOf`;
   `weatherAt` reports `second`, `secondStrength`, `agate`). On a body (Calissa): the clip shows the strongest feeling, the flame's
   height how strong, the flame's colour the second. In sound (Wanda): the stronger mood's scale with one note borrowed from the other,
   both beds by their shares; opposites at once play the beds only, the bell on root and fifth. **The mind's part is not yet built**
   (Petra): `creatures/ai/mood.js`, an intensity per feeling, each with its own decay, `shown() -> { a, b?, k }`; the old Stoic-to-Prismatic
   axis becomes a projection of it, so every caller keeps working.
4. **The five take Plutchik's hues.** Built (`COLOR`): mirth gold `0xf2c84a`, wonder cyan-lapis `0x5ec8e0`, desire orange `0xff7a4a`,
   grief blue `0x8fb0ff`, dread ink-green `0x3f6a4a` (violet only in its status), each matching its damage type. Soul Alchemy's wheel
   is one hue circle under both; the petals are a backdrop ring on the press's screen and in the lights, never a rule; the attributes
   keep their own targets.
5. **Make room for eight before there are eight** (Petra). Built: fish `aff` keyed by aspect; the shown order generated from
   `VALENCE`. Still at five: the angling keys (4 to 8 is five keys: a radial or scroll picker) and any `[0,0,0,0,0]` literals. The
   Crucibelle's five notes are a scale, not the aspects: unchanged.

**Staged, for the owner's ruling: Faith, Gall and Fury join as geography** (Espada): Lachryma is every feeling; the five are what
Anagami's waters carry. The three are rare under Anagami's sky, pool in its deep Wells, and fall freely elsewhere (faith over Margarite,
Letty its zealot; fury and gall in Entropolis's underground).

| | Faith (trust) | Gall (disgust) | Fury (anger) |
|---|---|---|---|
| hue (in `COLOR`) | light green `0x9be36a` | violet `0x8a5ac8` | red `0xd8403a` |
| weather | the halo | the miasma | the hail |
| bed (Wanda) | a warm breeze, far chimes | flies, a sour wet hum | hail on clay and glaze, a hot low pressure (never thunder: dread's) |
| clip (the Wisp's suite) | Idle softened; Wave at onset | none: **the one gap** | Angry (already in the suite) |

Each also needs a crude grade and fish (Petra: data, from `ASPECTS`) and the damage type nearest its place (five types fed by eight
feelings). Agates with them: love (mirth and faith), contempt (gall and fury), remorse (grief and gall).

## The baseline creature suite (the Lantern Wisp: `src/assets/lantern_wisp.glb`, 1,692 triangles, one 256 atlas)

Every enemy comes with 18 clips on one rig (the owner: "a good baseline suite", to expand later): Idle; five floats (forward,
backward, left, right, dash); Attack_Cast, Hit, Death; five looping moods (Happy, Sad, Scared, Angry, Curious); three one-shot emotes
(Laugh, Surprised, Wave); Dance_FlameWaltz (12 real seconds). Moods are loops for the basic ring; emotes are one-shots for the intense
ring's onset.

| Feeling | Mood (basic, looping) | Emote (intense, onset) |
|---|---|---|
| Wonder | Curious, or Idle with lean | Surprised |
| Mirth | Happy | Laugh |
| Desire | Curious | Attack_Cast's wind-up, or none yet |
| Grief | Sad | none yet |
| Dread | Scared | Hit's flinch |
| Prismatic (the centre) | Dance_FlameWaltz, slowed and smeared, or Scared and Happy blended | |

The grain rides all of it (speed, size, regularity, how often an emote fires, which idle variant). Every mood loop reads at thumbnail
size and the flame carries most of it (`LW_Flame` is emissive, one uniform). **Not yet built:** `creatures/anim/suite.js` (floats
blended by velocity, the mood loop from `shown().a`, an emote at an onset, the grain's dials on playback), the rig specced in `rom.js`.
("Wisp" means only the creature; the spirit press's ring is "lights".)
