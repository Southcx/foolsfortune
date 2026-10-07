# Grain: the five traits of a mind (temperament; the owner, 2026-10-05)

Kept by Dovina. **Built:** the data, `src/progress/combat/temperament.js` (traits, poles, susceptibility, species means, seeded draw,
the weather's sway, `traitsOf`). **Not built:** the minds reading it, the Veritome's read and write, the body and voice tells, the
garden's fit, the ledger and achievements.

**The owner's frame (2026-10-05):** monsters showcase their feelings, visually and audibly (on the body and in the voice, never in
text); we are simulating a mental ecology (minds swayed by the weather, each other and the Courier); the Veritome earns its keep (what
it reveals changes what the player does next). Prior art: OCEAN, Dwarf Fortress, Rimworld, Pokemon natures, Monster Hunter, Palworld.

## The idea

Five traits after OCEAN (used as dials, not as psychology: the game never diagnoses anyone), each -1 to +1. A trait weights what the
mind wants and opens it to one status, so a mind's grain decides **which damage type cracks it**: the type chart, per mind, read, not
memorised. A status builds x up to 1.5 on a mind high in its trait, x down to 0.6 on one low; Neuroticism also scales the mental
state's swing.

| Trait (poles) | Weights (`creatures/ai/`) | Opens it to |
|---|---|---|
| Openness (curious / wary) | curiosity drive; the shiny stimulus's gain | Illusion → blind |
| Conscientiousness (orderly / erratic) | territory, routine, a FOE's patrol | Delirium → confusion |
| Extraversion (bold / shy) | social drive, pack, aggression, noise | Impact → stun |
| Agreeableness (gentle / hostile) | the yield band (EmO); grudge memory | Influence → charm |
| Neuroticism (skittish / steady) | fear's rise and fall; enrage threshold | Ego → doubt |

## Rulings and words (R58)

- **The word is GRAIN** (Espada; LORE.md). "Temper" is the body showing its mental state (`vfx/temper.js`); "crack" stays the vessel's
  word. OCEAN stays as ids in code and docs; the player sees the plain poles.
- **Grain is climate; mood is weather**: an island's ego sets its species' mean grain; each creature is drawn about it (seeded); an
  Egregore has the widest spread. The slip jellies are bold and erratic.
- The bestiary, in the System's register: "Grain: curious, bold, steady. Weak to: Illusion, Impact." (an unread trait shows "unread");
  reprogramming: "You turn its grain: skittish to steady."
- **The weather sways minds** by a rate, never a jump: dread raises Neuroticism, mirth Agreeableness, wonder Openness, desire
  Extraversion; grief lowers Extraversion.
- **Readable at a glance**: a species shows one or two strong traits, an individual differs visibly on one more, the Veritome reads
  the rest. Where the Veritome shows a trait, it shows it in the colour of the damage type it opens (ART.md section 2).

## Still to build

- **The minds (Petra): weights, not machinery.** The Brain and reasoner read `traitsOf(grain)` unchanged. Susceptibility is one multiply
  in `creatures.build` beside the weather's (amount x take x buildMult x susc[type]). Fear through a pack: an 'alarm' stimulus on a
  fear onset (radius about 12, at most once a real second), a listener adding fear by its N and E, halved per hop so it cannot stampede.
- **The Veritome**: reads `c.grain` (one trait at 1 star, all five at 4); writes through a status `nudge { trait, by, dur }`.
- **The body (Calissa): each layer its own channel.** The temper owns the surface (gloss, steam, sparks, glow, tremble); statuses and
  damage types own colour; **grain owns movement and posture only**, never a colour or a permanent mark. The owner's clips say which
  feeling plays; the grain says how: six body dials every body applies (as `temper.look`): **lean, amplitude, regularity, tempo,
  softness, startle** (Neuroticism's flinch answers an event, never a standing tremble).

| Trait | High | Low |
|---|---|---|
| Openness | the head leads; investigates in curves with pauses | meets trouble square, the same path every time |
| Conscientiousness | even cadence, straight segments, the same patrol exactly | uneven cadence, wobbling paths, overshoots |
| Extraversion | big, upright, takes the middle, leads, shows off at idle | low, keeps to cover, still at idle, ambushes |
| Agreeableness | open posture, eases in and out, gives way | squared front, holds ground, tracks the Courier |
| Neuroticism | startles, scans, backs off early, recovers slowly | does not flinch; a slow gaze |

- **The voice (Wanda): one trait, one independent dimension.** Openness the contour; Conscientiousness the rhythm; Extraversion the
  reach (loud, often, first); Agreeableness timbre and interval (consonant thirds and fifths against tritones: Morton's rules);
  Neuroticism the stability (jitter, cracks under stress). The mental state loosens the hold; a pack is heard; the weather sets the
  mode (the Crucibelle's five). Built once: `src/audio/creaturevoice.js` (traits, mental state, mode, the call's kind).
- **Event contract:** the minds emit `creature.call { kind, by }` with its stimulus and decide who answers.
- **Elsewhere:** a caught Figment keeps its grain (a conscientious one works a garden slot better, an extravert worse); the ledger and
  achievements (every trait read; a mind cracked by its weakness); a board-game Well could be all reading grains.
