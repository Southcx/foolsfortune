# The seven Domains: design and build audit (read-only)

Audited at main c8ecb660 (2026-11-01). No repo file edited. Sources read: CLAUDE.md, docs/GLOSSARY.md (+DETAIL), DESIGN.md s10/15/22,
LORE.md (domain table, palmistry, mudras), plans DOMAIN-SOURCES, GODHAND (s8, s11), SPINE, TRAINING, TOOLS-TOGETHER, CLASSES, BRACELET, ENDGAME,
and code: progress/domains.js, psyche.js, godpowers.js, bracelet.js, classarts.js, spreads.js, mudras.js, lend.js, skills.js, achievements.js,
duel/powers.js, ui/domainlook.js, vfx/library/domains.js, vfx/domainlooks.js. Numbers below were computed by importing domains.js/godpowers.js in node (stdout only).

## 0. How the machine works (shared by all seven)

- Level 1..99 from `exp.<domain>` in the ledger. Curve toNext(l) = floor(l^1.5*50+100); 15 = 17,395 exp, 30 = 97,404, 35 = 143,189,
  60 = 552,013, 80 = 1,134,898, 99 = 1,935,567.
- EXP = base x scaleOf(domain) x skillWeight(q); skillWeight is 0.4 (rote) / ~1 (q .5) / 5 (q 1). scaleOf is set per domain so that the
  AVERAGE ordinary (`base`) source of that domain at q .5 and 6 acts/min reaches 99 in 300 h. Result: every domain pays exactly 17.9 exp
  for an average act at q .5 (7.4 rote, 91.9 masterful). Equal time-to-99 is therefore a promise about the average act at 6 acts/min,
  not a measured outcome; a domain whose acts are rare or slow (see Spellscription, Manifestation) will in practice level slower.
- Class affinity: reading as a Major of that domain's planet gives x1.25 exp (CLASS.affinity). Majors per domain (CLASS_DOMAIN, spreads.js):
  Ouranurgy 3 (Wheel, Temperance, Moon), Manifestation 3 (Empress, Justice, Hierophant), Psychokinesis 3 (Tower, Emperor, Death),
  Alteration 3 (World, Star, Devil), Spellscription 3 (Magician, Lovers, Hermit), Divination 2 (Sun, Strength), Possession 2 (Priestess, Chariot).
  Fool, Hanged Man, Judgement have none. Class arts: 2 per Major, so Ouranurgy/Manifestation/Psychokinesis/Alteration/Spellscription 6 each,
  Divination 4, Possession 4, no-domain 6. Art looks wear the domain's grammar (vfx/library/classarts/arcana.js; the World's Completion shows all seven).
- Every domain, identically (no per-domain difference): bracelet socket opens at level 30 (SOCKET_AT) for its own powers; dissonance of its
  acts falls x1 -> x0.1 by its level; its PvE duel power costs down to 0.6x at 99; the Summit lend reads all at 99; achievements
  dm1-dm5 (any domain 5/20/99, all seven 10, all seven 99 "The World") and gp1/gp2 (use a power of every domain / every power); a
  domain level-up plays `domain.<id>.level` VFX + a pentatonic bell + a log line "Your X reaches level N".
- God powers open by "domain level OR a feat" (skills.js powerArt). Levels: 1 (basic), 15, 35, 60, epics 80.
- Domain-neutral exp sources that every card shares: god.epic (all seven, 10 acts), duel.power (all seven, base 6), creature.struck
  (five domains; NOT Ouranurgy, NOT Spellscription), mimic.solve (six; NOT Possession; Spellscription gets a "copy" trickle of every solve).
- The bracelet's 7 charms (TWIN, WIDE, ECHO, QUIET, THRIFT, LINGER, GENTLE) are not domain-specific: any owned charm in any socket. Which
  charm helps depends on the domain's RAMP families: Divination has only size rows (LINGER and THRIFT do nothing there); Psychokinesis and
  Alteration have no time rows (LINGER dead) ; only Manifestation, Spellscription, Psychokinesis, Alteration have `made` rows (THRIFT).

## 1. Definition: description, colour/sign, lore (all seven are fully dressed; identity is a presentation strength)

| domain | `does` (domains.js) | LORE blurb | glaze / colour / sign | planet, finger, mudra | VFX grammar (vfx/library/domains.js) | sound family |
|---|---|---|---|---|---|---|
| Ouranurgy | rules of the space around you: displacement, time slowed or stopped | the craft of where and when: moving a thing without crossing the space between | Ru celadon #9cc3b8, cloud with spiral | Jupiter, index, Gyan | falls from above: pillar, turning hoops | portal swirl, clock ticks |
| Manifestation | solidifying thought into structures | making a thing out of Lachryma, so it can be touched | fire-flashed shino #e8d6c0 / #d9814a, small cube + spark | Venus, thumb root, Bhumisparsha | grows up out of the ground, crystallises | kiln roar, ringing ware |
| Divination | perceiving the hidden: signatures, habits, the true pitch | knowing before: what is hidden, what is next | yohen tenmoku #1a1418 with violet-silver stars, eye in a ring | the Sun, ring, Surya | thin rings swept out flat, iris | sonar ping, scan |
| Psychokinesis | moving things by will | moving a thing with the mind instead of the hand | oxblood #8e1f1f, boulder lifted | Mars, palm heart, Karana | thrown out: shockwave, lifted debris | air, stone torn up |
| Possession | exerting will over other minds | a mind in another's seat: host a spirit (East) or ride a mind (West) | Jun ware #7d93c4 with purple splash, mask | the Moon, palm edge, Prana | drawn in: tethers, spiral, shell | whistle, soft feet, mind set aside |
| Alteration | reshaping what already is | making a thing other than it was | flambe #a8324a to #4a5fa8, looped arrow | Saturn, middle, Shuni | band swept through its ramp | sand hiss to clay squelch |
| Spellscription | transcribing a thing down: glyphs, macros, maps | writing a thing down so that it holds. Neutral, and so the most dangerous | cobalt on white porcelain #2a4fa0, brush stroke | Mercury, little finger, Buddhi | written: strokes, circle, a square seal | brush stroke, seal clack |

Notes on the defs:
- Colour rule (domainlook.js): kiln-glaze palette, never a feeling's hue. Two near-neighbours: Possession (blue/purple) and Spellscription
  (cobalt blue) and Ouranurgy (celadon blue-green) are three blues; Psychokinesis (oxblood) and Alteration (copper red) are two reds.
  Told apart by glaze texture, icon and VFX grammar, not hue (the VFX file says "in greyscale", Riot's silhouette test).
- The icons are 7 distinct silhouettes; the domain VFX are 7 x 4 effects (cast/hold/hit/level), each with a distinct motion verb
  (falls / grows / sweeps flat / thrown out / drawn in / band swept / written). This is the strongest single piece of identity in the game.
- Lore seam to note: LORE.md says the Moon = Possession, but the MOON CARD (Pisces, Jupiter-ruled) belongs to Ouranurgy
  (CLASS_DOMAIN moon: 'ouranurgy'; CLASSES.md s5). Consistent on purpose, but easy to misread.
- Time has two homes by ruling (owner, 2026-10-08): bending it = Ouranurgy; keeping it (beat, tempo) = Spellscription.
- "No new domains, ever" appears in GLOSSARY, GODHAND s8/s11, DESIGN s22.4, TRAINING s2.
- Prior art the docs cite: OSRS skills (1..99, level as proof, curve where the last levels change the most), the owner's design doc v0.1
  (seven skills, curve, "The World"), Rhythm Heaven/Gran Turismo (graded quality), Minecraft Creative (the 99 top), Monster Hunter and OSRS
  quest-or-level gates (feat way), FFXII Quickening (level-up VFX), Vagrant Story gem slots / FFVII materia / Hollow Knight charms (bracelet),
  FF Tactics jobs (class arts), Puzzle & Dragons / Puzzle Quest (duel powers), Black & White (miracles), Pokemon type chart (kills train the
  domain of the damage type), Kuji-in/mudras, Golden Dawn planetary rulers. FFXIV is cited for telegraphs (Figment ladder), not for domains.

## 2. EXP sources (SOURCES table, 103 rows over 79 events (the per-domain broadcast rows inflate the row count); every event has an emitter)

Counts are sources (rows) per domain. "own" excludes the four broadcast rows (god.epic, duel.power, creature.struck, mimic.solve). "off-hand" excludes
god.* powers.

| domain | rows | own | off-hand | god-hand rows |
|---|---|---|---|---|
| Divination | 20 | 16 | 13 | 3 (strata, course, read) |
| Psychokinesis | 18 | 14 | 8 | 6 (grab, throw, scoop, pour, gust, slab) |
| Alteration | 15 | 11 | 5 | 6 (sunder, swell, wring, shape, carve, transmute) |
| Ouranurgy | 14 | 11 | 8 | 3 (portal, fold, hasten) |
| Possession | 14 | 11 | 8 | 3 (herd, take, muster) |
| Manifestation | 11 | 7 | 3 | 4 (manifest, sculpt, setfast, totem) |
| Spellscription | 11 | 8 | 5 | 3 (miracle, ward, stamp) |

Per-domain lists (base, or acts x domain average base; q = quality):
- Ouranurgy (14): move.blink 6, grapple.swing 10, blade.exit 12, creature.zandatsu 10, reprogram.run 8, brush.canvas 6, emocean.stage 12 acts,
  god.portal 10, god.fold 12, god.hasten 6, race.finish acts by seconds (medal q), mimic.solve, god.epic, duel.power 6.
- Manifestation (11): god.manifest 18 (biggest single base in the game), god.sculpt 12, god.setfast 8, god.totem 12, brush.glyph 6 (wash only),
  brush.paint 4, track.validate 4 acts (flat q .6), creature.struck (Illusion kills), mimic.solve, god.epic, duel.power 6.
- Divination (20): map.surveyed 8, crystal.strike 6, photo.take 8, move.parry 6, windup.read 6, emocean.reckon 4 acts, well.charted 6 acts,
  god.strata 4, god.course 3, god.read 4, sea.habit 8, sea.dig 8, sea.lineup 4 acts, sea.square.done 6 acts, dreamvane.unearth 6,
  duel.secret 6 acts, creature.struck (Ego kills), mimic.solve (non-mimic modes), god.epic, duel.power 6.
- Psychokinesis (18): god.grab 4, god.throw 8, god.scoop 6, god.pour 6, god.gust 6, god.slab 8, drill.end 12, skiff.combo.bank 6, sea.salvage 8,
  seaserpent.down 12 acts, seabeast.down 16 acts, fork.catch 4, impact.hit 6, impact.strike 4 acts, creature.struck (Impact kills: psygun,
  Sondelass, kick), mimic.solve, god.epic, duel.power 6.
- Possession (14): reprogram.run 20 (biggest share), lockheart.drain 6, angle.catch / angle.release (acts per 10 s of fight), god.herd 8, god.take 8,
  god.muster 10, haunt.end (acts by time), spirit.bind 3 acts, spirit.wish.done 2 acts, spirit.farewell 10 acts, creature.struck (Influence
  kills), god.epic, duel.power 6. No mimic.solve.
- Alteration (15): god.sunder 10, god.swell 8, god.wring 8, god.shape 8, god.carve 8, god.transmute 6, garden.sculpt 4, brush.inscribe 6 (flat q .5),
  garden.tend 4, spore.inoculate 6, stain.wash 6, creature.struck (Delirium kills: Lockheart), mimic.solve, god.epic, duel.power 6.
- Spellscription (11): reprogram.run 14, brush.glyph 10, song.play 8, rhythm.score 12 acts, god.miracle 12, god.ward 8, god.stamp 10, sea.echo 8,
  mimic.solve (copy trickle), god.epic, duel.power 6. No creature.struck.

What this shows:
- Starved: Manifestation (3 off-hand own sources; god.manifest/sculpt are the real engine; its non-hand sources are a paint stroke worth 8 exp, a track
  validation, and Illusion kills). Spellscription (5 off-hand: reprogramming, glyph, song, rhythm, one sea echo; no kills). Alteration (5 off-hand,
  all small bases 4-6 and three of them flat q .5/.3, i.e. never masterful).
- Fat: Divination (13 off-hand, spread over survey, crystals, photo, parry, windup, sea, Well, duels) and Psychokinesis (drills, skiff, sea, throws).
- One act paying three domains: reprogram.run pays Ouranurgy 8 + Possession 20 + Spellscription 14. It is the single biggest share of Possession and
  the main non-hand source of Spellscription. The Veritome's reprogramming is therefore three-domain by design, which is the opposite of a clean identity.
- Flat-quality sources (never reward skill): move.blink .5, god.grab .5, lockheart.drain .5, god.swell/wring .5, brush.inscribe .5, spore.inoculate .5,
  fork.catch .5, god.take .5, god.totem .6, seaserpent .6, seabeast .7, sea.echo .7, track.validate .6. The "skill skips grind" law (DESIGN s22.1)
  is weakest in Alteration (swell, wring, inscribe, spores, tend ~ all flat or harmony-based) and Possession's drain/take.
- Unwired but promised (TRAINING.md s2 proposals with an emitter or none): vessel.mend ("a crack mended", Alteration; event exists, no source);
  cogitomap.get ("a Cogitomap copied", Spellscription; emitted, no source and it only feeds the Stamp feat); sky.read/forecast that came true
  (Divination; event exists, no source); appraise.mood (Divination; no emitter at all); a realm's name written (Spellscription; no emitter);
  lap-circuit medal (Ouranurgy), a spirit bond raised (Possession; partly via wish.done). DOMAIN-SOURCES s3 itself names two empty cells: Raceway
  Divination/Spellscription, and the sea's Manifestation/Alteration.
- Practice, Raku, Strawman, buying, kiln, Soul Alchemy pay nothing by rule (Alchemy has its own seven attributes).

## 3. What a level does (every read of a domain's level in code)

Common to all seven: RAMP numbers via rampOf (godhand/powers.js, matterarts.js, miracles.js, domainlooks.js scale), dissonanceScale (godhand/rejection.js),
powerOpen / powerArt count-way (skills.js), bracelet socket at 30 (bracelet.js:59), duel `levels` (world/duel/duelsession.js:103 -> duel/powers.js
powerCost), raceway editor power gate (world/raceway/editor.js:307), Codex STATUS radar, class affinity, achievements dm1-5, Summit lend.

Level-gated god powers (at > 1) + the epic at 80 + RAMP rows + RAMP.tools keys (20 total; 14 read in code, 6 dead):

| domain | gated powers | RAMP numbers (open -> 99) | tool widenings (live / dead) | other direct level reads |
|---|---|---|---|---|
| Ouranurgy | Portal 15, Hasten/Stay 15, Fold 35, Stopped Hour 80 (4) | portal pairs/dur/r, fold side, hasten r/scale/dur (7) | reach (blink, hookshot), still (blade, Celestial, reprogram window) live; lane (ship lane change) DEAD | none |
| Manifestation | Sculpt 15, Lock 35, Weather Anchor 60, Volcano 80 (4) | sculpt len/scale/made, setfast hold/r, totem n/dur/r (8) | span, count (arts.js) live | make.js:19 set creation "for good" at 99 |
| Divination | Layer View 15, Flow Preview 35, Scan Intent 60, Prophecy 80 (4) | strata len, course steps, read r (3) | survey, reveal, reckon, forecast live; angling DEAD | Figment telegraph ladder (creatures.js:177,195): Area 2, Timing 8, Type 20, Answer 35; seachart.js:58 level |
| Psychokinesis | Gust 15, Lift Ground 35, Maelstrom 80 (3) | scoop carry/made, gust len/power, slab side (5) | throw (godhand.js:482) live; weight DEAD | none |
| Possession | Herd 15, Possess 35, Rally 60, Stampede 80 (4) | herd r/n/dur, take dur, muster n/rate/dur (7) | macro (macros.js:66), song (Crucibelle sleep and forget) live; hold (Lockheart held Figments) DEAD | none |
| Alteration | Transmute 15, Earthquake 80 (2) | shape r/made, carve w/depth/len, transmute r (6) | swell (swell and wring ranges), paint (Soul Brush spray) live; cuts (sunder) DEAD | none |
| Spellscription | Barrier 15, Copy Terrain 35, Deluge 80 (3) | miracle cost/size, ward n/r/dur, stamp side/made (7) | slots (Veritome kept macros) live; copy DEAD | none |

Totals: 24 level-gated unlocks (17 powers + 7 epics); there is NO level-60 power for Psychokinesis, Alteration or Spellscription, and Alteration has only
one gated power (its five others are open at 1, and Sunder, Swell, Wring are not ramped except via the dead `cuts` and the live `swell`).
Alteration's "what levels change" is therefore the thinnest in unlock terms; Divination's is the richest (the Figment-telegraph ladder is the only
domain-level that changes what the player SEES in ordinary combat from level 2).
The Telekinesis (lift and throw) art, Psychokinesis's flagship, gets only a throw-distance multiplier (sqrt of 1.5 at 99); its documented
"weight lifted" widening is dead. Sunder's "cuts" (Alteration) and the Lockheart's "hold" (Possession) are dead.

Achievements by domain: none per-domain; only the five generic psyche ones, the two god-power-coverage ones (gp1, gp2) and the seven charms.
Titles: Adept (99 in any), The World (all seven), Demiurge (every power). There is no per-domain title, no per-domain mastery cape-equivalent
(OSRS has one per skill), and no domain-keyed shop, quest or dialogue gate found in progress/quests.js, goals.js, econ/.

Epics (all at 80, one per game hour, paid as a release): stoppedHour (halt + hold), volcano, earthquake, deluge, maelstrom are real world events;
prophecy only pushes the next raid back a game hour (R.t += EPIC_EVERY, miracles.js:116); stampede is only `ap('flee', 2)` each pulse (miracles.js:181),
the same status Eclipse (dread) already applies. These two are the thinnest capstones (Divination, Possession).

## 4. Tools: no 1:1 mapping

The seven tools vs seven domains (from emitters and DOWN_DOMAIN, not a table in code; no doc states a tool-to-domain table):

| tool | domains it earns | domain widening it carries | notes |
|---|---|---|---|
| Psygun | Psychokinesis only, and only via Impact kills (and Throwing Room drills) | none live | the only tool with no domain widening at all; no psygun-specific exp source |
| Sondelass | Ouranurgy (grapple swing, blade mode, zandatsu), Psychokinesis (Impact kills), Possession (angling) | ouranurgy.reach (hook), ouranurgy.still (blade); divination.angling DEAD | three domains |
| Soul Brush | Manifestation (paint, wash, Illusion kills), Alteration (inscribe, mop), Spellscription (glyph), Ouranurgy (Celestial canvas) | alteration.paint, ouranurgy.still (Celestial) | FOUR domains, the most diffuse tool |
| Veritome | Divination (photo, Ego kills), Ouranurgy + Possession + Spellscription (reprogram.run) | ouranurgy.still, possession.macro, spellscription.slots | three domains from one act |
| Dreamvane | Divination (survey, crystal, unearth, dig), Psychokinesis (fork catch), Manifestation (Illusion kills) | divination.survey, reveal | the cleanest: a Divination tool |
| Crucibelle | Spellscription (song.play), Possession (Influence kills), rhythm.score is the rhythm mode | possession.song; shares divination.reveal | split across the "beat" and "minds" |
| Lockheart | Possession (drain), Alteration (Delirium kills) | possession.hold DEAD | no live widening |
| God hand (off belt) | all seven, 16 + 5 + 3 + 7 epics | the whole RAMP | the real home of every domain |

Reading by domain: Ouranurgy = Sondelass (+ Soul Brush canvas + blink, the Courier's own movement); Manifestation = Soul Brush + god hand; Divination =
Dreamvane + Veritome (+ the Courier's parry, windup); Psychokinesis = psygun + god hand (+ Dreamvane fork); Possession = Lockheart + Crucibelle
(+ Veritome reprogram, Sondelass angling, garden spirits, haunt); Alteration = Lockheart kills + Soul Brush mop/inscribe + god hand; Spellscription =
Veritome macros + Soul Brush glyph + Crucibelle song. Nothing is a tool without a domain; every tool is counted in 2-4 domains. Two domains
(Manifestation, Alteration) have no tool of their own: they are the god hand's and the Soul Brush's by-products. Psychokinesis, the "psygun's domain", has the
psygun contributing only kill exp (and no widening). The damage-type route (Impact/Ego/Influence/Illusion/Delirium) is the only clean per-tool signal and it
skips Ouranurgy and Spellscription entirely.

## 5. Per-domain cards

### Ouranurgy
- Identity: where and when: displacement and time slowed or stopped (blink, hook, blade, Portal, Fold, Hasten, Stopped Hour).
- EXP sources (14): listed in s2. Strong spine in movement and slowed time; the Raceway and the rail (emocean.stage, race.finish) are big-act time-based.
- What levels change (7 RAMP numbers on 3 powers, 3 gated powers + epic; widen: reach and still live, lane dead).
- God powers: Portal 15, Hasten/Stay 15, Fold 35, Stopped Hour 80. All three non-epic are gated; none open at 1.
- Duel power: Swap (two 2x2 patches trade places). Class: Wheel, Temperance, Moon (6 arts).
- Tool(s): Sondelass (blade, hook) + the Courier's own blink; the core movement is "gold standard" so blink/hook widening is an Art's reach only.
- Identity strength: STRONG. A single verb family (move or stop space/time), the best-grounded mechanics (widening live, 3 powers, a stage and a race pay it),
  distinct VFX (falls from above). Mild leak: it absorbs "time" which includes reprogramming and Celestial mode, so the Veritome and Soul Brush also feed it.
- Gaps: `ouranurgy.lane` dead (the ship's lane change); no level-60 power (it has 15/15/35 then the epic); Swap (duel) and Fold (world) both overlap
  Psychokinesis's Lift/Slab (moving patches/lines of stuff); mimicry teaches only one Ouranurgy rung (swap).

### Manifestation
- Identity: thought made solid: the Manifest wall, Sculpt, Lock, Weather Anchor, Volcano.
- EXP sources (11; only 3 off the hand). 
- What levels change: 8 RAMP numbers on Sculpt/Lock/Totem; widen span + count of Manifest walls (both live); set creation for good at 99. 4 gated.
- God powers: Manifest (1), Sculpt 15, Lock 35, Weather Anchor 60, Volcano 80. Duel: Manifest (3 junk/holes to gems). Class: Empress, Justice, Hierophant.
- Tool(s): none of its own (Soul Brush paint/wash and Illusion kills are the nearest).
- Identity strength: MEDIUM. Clear on the god hand (the whole build verb set), but outside it the exp is a paint stroke, a track validation and
  Illusion kills, and "paint laid" (Soul Brush) overlaps Alteration's "mop" and "inscribe" for the same tool.
- Gaps: the thinnest exp base (3 off-hand own sources, 7 own in all); no domain tool; god.manifest base 18 dwarfs everything (so grinding walls is the optimal
  route); mimicry has no Manifestation rung; Sculpt has no POWER_LOOK domain cast (domainlooks.js POWER_LOOK lacks it).

### Divination
- Identity: perceiving the hidden: signatures, habits, pitch, the next intent.
- EXP sources (20, the richest): see s2; across foot, sea, rail, Well, duel.
- What levels change: 3 RAMP numbers (the fewest) but 4 live widening keys (survey, reveal, reckon, forecast), the Figment-telegraph ladder (levels 2, 8, 20, 35),
  the sea chart's level read; angling widening dead. 4 gated powers (all information).
- God powers: Layer View 15, Flow Preview 35, Scan Intent 60, Prophecy 80. Duel: Scan. Class: Sun, Strength (the fewest Majors with Possession).
- Tool(s): Dreamvane (survey, crystals) + Veritome (photo, Flash); the Courier's parry/windup read.
- Identity strength: STRONG. A pure knowledge domain with the only visible level ladder in combat, many ways to earn it, rewards knowledge not numbers.
- Gaps: its god powers only inform (no verb effect), so Creative-mode at 99 is "see more"; bracelet charms barely touch it (only size rows); Prophecy is
  a raid-timer push (not prophecy); `divination.angling` is dead (and is described as sondelass/angling but angling pays Possession); appraise.mood and
  sky-forecast-came-true proposals unbuilt; it overlaps Spellscription on maps (Divination charts a Well, Spellscription copies the Cogitomap).

### Psychokinesis
- Identity: moving things by will: lift, throw, scoop, gust, slab.
- EXP sources (18): god-hand verbs, drills, skiff combos, sea salvage and beasts, impact hits, kills by Impact.
- What levels change: 5 RAMP numbers (scoop carry/made, gust, slab), widen: throw (live), weight (dead). 3 gated (Gust, Slab, Maelstrom); none at 60.
- God powers: Telekinesis 1, Scoop/Pour 1, Gust 15, Slab 35, Maelstrom 80 (4 in GOD_POWERS). Duel: Lift. Class: Tower, Emperor, Death.
- Tool(s): the psygun, by Impact kills only (also the Sondelass and the kick: any Impact blow).
- Identity strength: MEDIUM-STRONG. The most intuitive verb, many sources; but "impact" is the whole combat default, so its kill exp is the cheapest to get,
  and its signature tool (psygun) has no widening and no exp source beyond kills.
- Gaps: Telekinesis's weight widening dead; Slab vs Fold (both move patches of ground);
  its exp has high-volume cheap sources (impact.hit, impact.strike, combos) with quality derived from energy/multiplier; psygun has no "own" progression.

### Possession
- Identity: will over other minds: Herd, Take, Rally, reprogramming, summoning, spirits, fish.
- EXP sources (14): reprogram.run (base 20), drain, angling x2, haunt, spirit bind/wish/farewell, Influence kills, 3 powers, epic, duel.
- What levels change: 7 RAMP numbers (herd, take, muster), widen: macro length and song hold (live), Lockheart hold (dead). 4 gated (Herd 15, Possess 35, Rally 60, Stampede 80).
- God powers: Herd 15, Possess 35, Rally 60, Stampede 80 (all gated). Duel: Herd. Class: Priestess, Chariot (only 2 Majors).
- Tool(s): Lockheart (drain), Crucibelle (Influence kills), Veritome (reprogramming), Sondelass (angling). Four tools, none dominant.
- Identity strength: MEDIUM. Rich lore (East hosting vs West riding) and varied sources, but the exp is spread over unrelated activities (fish, spirits, traps,
  reprogramming, drain), so no single verb defines it; the lore's "host a spirit / ride a mind" is only Take and bind.
- Gaps: overlap with Alteration on the Lockheart (drain = Possession, Delirium kills = Alteration); with Spellscription on reprogram.run (20 vs 14);
  Stampede = flee status; mimicry has no Possession rung (the only domain excluded from mimic.solve); possession.hold dead; Possession shares the Moon
  with Ouranurgy's Moon card; only 2 class Majors.

### Alteration
- Identity: reshaping what already is: sunder, swell, wring, shape, carve, transmute, tend, mop.
- EXP sources (15) but 5 off-hand with small bases and flat quality.
- What levels change: 6 RAMP numbers (shape, carve, transmute), widen: swell and paint (live), cuts (dead). Only 2 gated (Transmute 15, Earthquake 80).
- God powers: Sunder, Swell, Wring, Shape, Carve (all open at 1), Transmute 15, Earthquake 80. Six powers in GOD_POWERS, the most numerous. Duel: Transmute. Class: World, Star, Devil.
- Tool(s): Lockheart (Delirium kills) + Soul Brush (inscribe, mop); no tool of its own.
- Identity strength: MEDIUM-WEAK. Real verbs but the loosest description ("making a thing other than it was" can read as any other domain's act) and it
  overlaps Manifestation (both make matter), Psychokinesis (Slab/Scoop vs Shape/Carve: terrain), and Spellscription (Soul Brush inscribe vs glyph).
- Gaps: the fewest level gates; its five at-1 powers are not ramped via a gated unlock and a good part of its "level" is only a radius number; Sunder's `cuts` widening dead;
  nothing at 35 or 60; flat-quality sources (swell, wring, inscribe, spores); Earthquake is its only capstone; Delirium kills tie it to the Lockheart,
  whose own drain pays Possession.

### Spellscription
- Identity: transcribing a thing down: glyphs, macros, maps, the beat; the miracles (signs), Ward, Stamp.
- EXP sources (11; 5 off-hand): reprogramming (14), glyph, song, rhythm, miracle, ward, stamp, sea echo; no kills.
- What levels change: 7 RAMP numbers (miracle cost/size, ward, stamp), widen: macros kept (live), map copies (dead). 3 gated (Barrier 15, Copy Terrain 35, Deluge 80).
- God powers: Miracles 1 (seven signs), Barrier 15, Copy Terrain 35, Deluge 80. Duel: Miracle (one colour's weather). Class: Magician, Lovers, Hermit.
- Tool(s): Veritome (macros), Soul Brush (glyph/sigils), Crucibelle (song, the beat) + the rhythm mode.
- Identity strength: MEDIUM. Defined as "writing" and it is: the most distinctive claim (the shell-crafting plan) is unbuilt. Lore gives it the most
  weight ("the most dangerous"), the build gives it 3 powers and 5 off-hand sources across three unrelated tools (writing, glyphs, rhythm).
- Gaps: shells crafted by Spellscription (TOOLS-TOGETHER s7 ruling, "a plan of its own, Dovina's next") does not exist (no craft code, no CASTER-SHELLS section);
  `spellscription.copy` dead (Cogitomap duplication promised in DESIGN s15, PASSAGE s112, ROUTE-MAP); the track editor's rules are "Spellscription's" in
  trackdef.js but track.validate pays Manifestation; miracles are ALSO the seven feelings' weather (a Spellscription power that is the Feelings' system),
  so its biggest power set is owned by another system; time-keeping (beat) vs Ouranurgy's time-bending is explained only in docs.

## 6. Overall imbalance summary

1. Presentation is uniformly excellent; mechanics are not. Every domain has the same four VFX, icon, glaze, sound family, mudra, planet, duel power,
   epic, class set, bracelet socket. The differences are in what the level actually changes and what feeds it.
2. Levels change little outside the god hand. 20 widening keys declared, 6 dead: ouranurgy.lane, divination.angling, psychokinesis.weight, possession.hold,
   alteration.cuts, spellscription.copy. Live widenings per domain: Divination 4, Ouranurgy 2, Manifestation 2, Possession 2, Alteration 2, Psychokinesis 1,
   Spellscription 1. The psygun and the Lockheart carry no live widening.
3. Unlock cadence is uneven: gated powers Ouranurgy 3, Manifestation 3, Divination 3, Possession 3, Psychokinesis 2, Spellscription 2, Alteration 1; no
   Psychokinesis/Alteration/Spellscription power at 60; the epic at 80 for all.
4. Exp supply is uneven: Divination 20 rows / 13 off-hand vs Manifestation 11 / 3. Equal time-to-99 is nominal: it assumes 6 average acts a minute; the real
   rate depends on how often a domain's acts are available. Class and mode feed: Possession is the 3-domain reprogram.run's main beneficiary, Alteration is
   mostly flat-quality.
5. Identity overlaps: Alteration vs Manifestation (make/shape matter), Alteration vs Possession on the Lockheart, Possession vs Spellscription on
   reprogramming, Divination vs Spellscription on maps, Psychokinesis vs Ouranurgy on moving ground (Slab/Fold, Lift/Swap in the duel). The Soul Brush and
   Veritome are each 3-4 domains, so no tool is a single domain.
6. Best-defined: Divination, Ouranurgy (strong). Medium: Manifestation, Psychokinesis, Possession, Spellscription. Weakest: Alteration (most open
   powers, fewest gates, vaguest description, flat-quality sources).
7. Promised, not built: shell crafting by Spellscription, map copying, the dead widenings, the Prophecy/Stampede capstones, vessel-mend/forecast/appraisal exp, mimicry
   rungs for Manifestation/Possession/Divination, per-domain achievements/titles, a Raceway source for Divination/Spellscription and a sea one for Manifestation/Alteration.
8. Process note: the docs say "arts by achievement, count way and feat way"; the domains' own titles are the thinnest part of that (no per-domain feat set).

## Verification notes
- Counts of sources, scales and exp values were computed by node on the real modules (no repo files written).
- Every SOURCES event has at least one `emit(` site in src (checked by grep); I did not verify quality fields or timings in play.
- Read-site list from grep of `psyche.level|psyche.widen|rampOf|powerOpen`; it might miss reads that go through an aliased variable.
- Not read: art/UI files other than domainlook, the Codex page strings, the QAIS tests, and VFX gallery output.
