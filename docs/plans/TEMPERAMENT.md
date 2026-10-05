# Grain: the five traits of a mind (temperament; the owner, 2026-10-05)

Kept by Dovina. A spec for the divisions' input (Petra: the minds; Calissa: how a trait shows; Wanda: how it sounds; Espada: what it
is called and means). Not built yet.

## The owner's frame

- **Monsters showcase their feelings, visually and audibly.** The assets coming down the owner's pipeline were made for that: a
  creature's feeling is on its body and in its voice, never in text.
- **We are simulating a mental ecology.** The creatures are minds in a place, each with a temperament, swayed by the place's mood (the
  weather), by each other, and by the Courier.
- **The Veritome earns its keep.** Reading a mind is a skill that pays: what the Veritome reveals changes what the player does next.

## The idea in one line

Every creature has a **temperament**: five traits, after the five-factor model of personality (OCEAN: Openness, Conscientiousness,
Extraversion, Agreeableness, Neuroticism). Each trait is a dial from -1 to +1 that weights what the mind wants (the AI parts in
`docs/AI.md`) and opens it to one of the five statuses, so a mind's temperament decides **which damage type cracks it**. The type chart,
but per mind, and read, not memorised.

We use OCEAN as five dials with a long pedigree, not as psychology: the game never diagnoses anyone.

## The five, and what each touches

| Trait | High (+1) | Low (-1) | The mind's parts it weights (`creatures/ai/`) | Opens it to |
|---|---|---|---|---|
| **Openness** | curious, roams to the new | wary, keeps to the known | curiosity drive; approach to stimuli | **Illusion → blind** (an open mind falls for what it sees) |
| **Conscientiousness** | orderly: territory, routine, patrol | erratic, wanders | territory and routine; a FOE's patrol | **Delirium → confusion** (order is what comes apart) |
| **Extraversion** | bold, social, loud; charges in | solitary, quiet, ambushes | social drive; pack; aggression; the noise it makes | **Impact → stun** (it charges onto the blow) |
| **Agreeableness** | yields, can be befriended | hostile, holds a grudge | the yield band (EmO); grudge memory | **Influence → charm** |
| **Neuroticism** | volatile, fearful, enrages fast | steady, slow to anger | fear drive; enrage threshold; how far its mental state swings | **Ego → doubt** |

A trait's **susceptibility**: a status builds faster on a mind high in its trait (x up to 1.5) and slower on one low in it (x down
to 0.6). Neuroticism also scales the mental state's swing (a neurotic mind runs Prismatic fast; a steady one holds Stoic).

## How it resonates with what exists

- **The Veritome (Divination and Possession).** The lens **reads** a temperament: a photograph's appraisal reveals the traits, more
  of them the better the photograph (one trait at 1 star, all five at 4). The bestiary keeps what was read. **Reprogramming writes**
  a trait: a macro can push one dial for a while (calm a neurotic jelly; make a loner call its pack to you). The Veritome is how a
  player sees and changes a mind, which is the owner's "earn its keep".
- **The weather.** An island's mood sways its minds: dread raises Neuroticism, mirth raises Agreeableness, wonder Openness, desire
  Extraversion, grief lowers it (the long rain keeps creatures in). A rate, never a jump (`game.weather.mindDrift` is the pattern).
- **Species, with individuals.** A species has a mean temperament (a slip jelly: high Extraversion, low Conscientiousness) and each
  creature is drawn about it (seeded), so two jellies differ and a read pays.
- **The Lockheart's summoning and the Shrine Garden.** A caught Figment keeps its temperament: a conscientious one works a garden slot
  or bed better, an extravert worse. Palworld's work traits, as personalities.
- **The mental ecology.** Minds sway each other: a neurotic one's fear spreads through a pack (a stimulus, `game.ai.stimuli`), an
  extravert leads, an agreeable one calms its kin. Temperament plus place plus pack is the ecology the owner means.
- **The Wells' genres.** A board-game Well could be all reading and exploiting temperaments.

## The rule that makes it work: every trait has a tell

An invisible dial is noise. Each trait must show on the body and in the voice (the owner's assets are made for this):

| Trait | A tell on the body (Calissa) | A tell in the voice (Wanda) |
|---|---|---|
| Openness | turns toward new things; a head that tilts | inquisitive rising calls |
| Conscientiousness | moves in clean lines, keeps a beat | regular, rhythmic sounds |
| Extraversion | big, fast, takes space; leads | loud, often |
| Agreeableness | soft posture; holds back | warm tones |
| Neuroticism | twitches, flinches, startles | wavering, breaking |

The Veritome then confirms and names what an attentive player could already guess: reading by eye is the skill, the Veritome the proof.

**The voice (Wanda's input, adopted): one trait, one dimension of the voice, each independent**, so an ear (and the Veritome) can
pull them apart. Openness is the **contour** (a rising, varied, questioning call against the same flat one); Conscientiousness the
**rhythm** (metronomic against erratic, cut short); Extraversion the **reach** (loud, often, wide, first against soft, rare, only
answering); Agreeableness the **timbre and interval** (warm, tonal, consonant thirds and fifths against harsh, low, tritones: Morton's
motivation-structural rules); Neuroticism the **stability** (a held pitch against jitter, cracks and register flips that grow under
stress). On top, the **mental state**: from Stoic to Prismatic the same voice loses its hold (vibrato widens, the call smears toward the
prismatic sweep). The **pack** is heard: a call is a stimulus, so fear travels as a rising chain; an extravert leads a call and response,
and when it falls silent the chorus breaks into ragged single calls (you hear that you broke the pack); a calm pack entrains to one slow
rhythm. The **weather** is heard on minds: tonal calls fall into the weather's mode (the Crucibelle's five), and grief slows and lowers
them, desire makes them pushier, wonder long and breathy, mirth short and bouncy, dread jittery. Built once: `src/audio/creaturevoice.js`
(Wanda's) takes the traits, the mental state, the weather's mode and the call's kind (idle, alarm, pain, answer); the minds emit
`creature.call { kind, by }` with its stimulus, and decide when to call and who answers (Petra's). Prior art: Morton (1977), Spore's and
Creatures' procedural voices, Animal Crossing's animalese, Trico (The Last Guardian).

## Who does what

- **Dovina:** the temperament as data (`src/progress/combat/temperament.js`: the traits, the susceptibilities, the weather's sway,
  species means, the seeded draw), the garden's fit, the ledger and achievements (every trait read; a mind cracked by its weakness).
- **Petra:** the minds read it (the drives' and the reasoner's weights in `creatures/ai/`; the build-up multiply in creatures.build; the
  stimulus spread), and the Veritome's read and write (appraisal reveals, a macro pushes a dial).
- **Calissa and Wanda:** the tells.
- **Espada:** names in the world (do the folk say "temper", "humour", "grain of the clay"?), and the bestiary's words.

## Folded in: Espada's words and Calissa's body (R58)

**The word is GRAIN** (Espada; LORE.md, "Temperament: the grain of a mind"). A clay body's grain is set before firing, and you work
with it or against it. ("Temper" is taken: the glossary gives it to the body showing its mental state, `vfx/temper.js`.) OCEAN stays as
ids in code and docs; the player sees both poles in plain words: **curious / wary** (Openness), **orderly / erratic**
(Conscientiousness), **bold / shy** (Extraversion), **gentle / hostile** (Agreeableness), **skittish / steady** (Neuroticism).
**Grain is climate; mood is weather**: a Figment is hewn from its island's psyche, so the island's ego sets its species' mean grain and
each creature is drawn about it; an Egregore (authored by no one) has the widest spread. The slip jellies, the boomtown's folk, are
bold and erratic. The bestiary reads, in the System's register: "Grain: curious, bold, steady. Weak to: Illusion, Impact." (an unread
trait shows "unread"); reprogramming: "You turn its grain: skittish to steady." ("Crack" stays the vessel's word.)

**Each layer its own channel** (Calissa), so the body never turns to mush: the **temper** (`vfx/temper.js`: the mental state, how
agitated) owns the surface (gloss, steam, sparks, glow, tremble); the **statuses and damage types** own colour; the **grain owns movement
and posture**: who a mind is, as against how it feels now or what is done to it. No trait gets a colour or a permanent mark. **The
owner's assets** carry the feelings as clips (fear, joy, anger: which clip plays); the grain says how it is played (speed, size,
regularity, how often, which idle variant), so every trait rides on every clip and needs no art of its own. **Built once: six body
dials** the minds produce and every body applies (as `temper.look`): **lean** (toward or away from what it attends), **amplitude**,
**regularity**, **tempo**, **softness** (ease and squash), **startle** (how often and how hard it flinches; Neuroticism's flinch is a
response to an event, never a standing tremble, so it does not read as the temper). Calissa's tells, high against low:

| Trait | High | Low |
|---|---|---|
| Openness (curious / wary) | the head leads; looks before it turns; investigates in curves with pauses (a jelly leans and skews toward it) | meets trouble square, back to walls, the same path every time |
| Conscientiousness (orderly / erratic) | even cadence, straight segments, square stops, the same patrol exactly (a jelly bounces on a beat) | uneven cadence, wobbling paths, overshoots, a new fidget each time |
| Extraversion (bold / shy) | big, upright, takes the middle, moves first, leads, shows off at idle (a jelly bounces high and wide) | low, keeps to edges and cover, still at idle, ambushes |
| Agreeableness (gentle / hostile) | open posture, eases in and out, gives way, head lowered (a jelly squashes soft and round) | a squared front, holds its ground, sharp starts and stops, tracks the Courier |
| Neuroticism (skittish / steady) | startles at stimuli, scans, backs off early, recovers slowly (a jelly jolts and shrinks) | does not flinch; a slow gaze |

**Readable at a glance**: a species shows one or two strong traits, an individual differs visibly on one more, and the Veritome reads
the rest; where the Veritome shows a trait (its plate, the bestiary), it shows it in the colour of the damage type it opens (ART.md
section 2), so reading the mind is learning its weakness.

**Petra (the minds): weights, not machinery.** The Drives already carry per-creature traits (`rollTraits`); `combat/temperament.js`
exports `traitsOf(grain)` returning that same object, so the Brain and the reasoner read it unchanged (O: curiosity and the shiny
stimulus's gain; C: territory and patrol; E: social and pack; A: the yield band and grudge; N: fear's rise and fall, the enrage
threshold). Susceptibility is one multiply in `creatures.build` beside the weather's (amount x take x buildMult x susc[type]). Fear
through a pack: the 'alarm' stimulus on a fear onset (about radius 12, at most once a second), a listener adding fear by its N and E,
halved per hop so it cannot stampede. The Veritome reads `c.grain` (the appraisal's stars gate which traits show) and writes through a
status, `nudge { trait, by, dur }`, via `creatures.applyStatus` (expiry, resistance and the resist mark for free). Behind the slice.

