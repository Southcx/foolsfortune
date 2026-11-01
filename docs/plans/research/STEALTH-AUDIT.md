# Stealth + "Pokemon Snap" Veritome audit (read-only; for Dovina). Paths relative to /home/user/foolsfortune/src unless noted.

## 0. One-paragraph truth
Creatures already run a Thief/MGS-style awareness model (cone + LOS ray + distance + a "loudness" scalar on the Courier, awareness 0..1 that
builds and ebbs, ? and ! glyphs). What is MISSING: no footstep noise, no light/dark term, no cover/shadow, no per-surface noise, no
"unseen" state, no suspicion UI, and the posture/gait data (stand/crouch/prone, Alt-walk) is read in exactly ONE line (brain.js:58) at
three coarse levels. The Veritome is already a Pokemon Snap scorer (size/pose/technique + same-kind bonus, darkroom report, bestiary of
behaviours, per-species habit research at sea) but the pieces that would make it "Snap" for stealth (candid/unaware shots, behaviours
by game state) are half-wired or stale (see 3.9 gaps).

## 1. How creatures sense the Courier today

### 1.1 The parts (src/creatures/ai/, ~965 lines; docs/AI.md is the spec)
- Brain (creatures/ai/brain.js:299): sense -> want -> decide -> act. Thinks every 0.2 s within `near` (45; jelly/wisp pass 50), x2.5 slower
  within `far` (130/140), nothing beyond (drives still tick) (brain.js:339-351). Jitter 0.85-1.15. Utility reasoner momentum 1.25 (utility.js:56).
- Senses (creatures/ai/senses.js:25): `{ sight, fov, feel, hear, eye, every=0.25, rate=1.8, onHear }`.
  - SIGHT gate (senses.js:59-62): horizontal dist <= sight, |dy| <= sight*0.5, bearing within fov/2, and a LOS ray from eye (owner.pos.y+eye)
    to the target's 0.6-height point, cached 0.25 s per thing (every=0.5 serpent). Ray hits only STATIC non-sensor non-dynamic colliders
    (senses.js:42): props/pots/creatures do NOT block sight.
  - Gain per think (senses.js:63-64): `dt * rate * near * centre * loud` where near=(1-d/sight)^1.4, centre=1-0.6*(angle/half), loud=Courier scalar.
    Awareness never decays while perceived; only after `hold` s unseen (memory.js:260).
  - FEEL (senses.js:58): within `feel` m (and |dy|<2.5) it knows you whichever way it faces, no LOS, no loud: gain dt*rate*2 (jelly: 3.6/s => ~0.3 s to "!").
  - HEARING (senses.js:67-70): every live stimulus whose radius*`hear` reaches the eye: mem.heard(s, strength*reach*0.6) + the kind's onHear.
  - BLIND/DAZZLE: senses.blind (seconds) skips sight entirely (senses.js:51,59); Flash dazzles 1.4 s (flash.js:94); status `blind` (Illusion) sets it (slipjelly.js:276).
- Numbers per species (constructor lines):
  - slip jelly: sight 15, fov 230, feel 2.6, hear 1, eye 1.1, rate 1.8; memory hold 2.5, ebb 1/9 (jelly/slipjelly.js:106-109)
  - Lantern Wisp: sight 18, fov 260, feel 3, hear 1.2, eye 1.6, rate 3.6 (twice the jelly's build speed); memory hold 3, ebb 1/8 (wisp/lanternwisp.js:71-72)
  - sea serpent: sight = row.sense (200 m; zone*leash for territorial), fov 360, feel 30, hear 1.6, rate 2.2, every 0.5; hold 6, ebb 1/20, threatEbb 1/60 (seaserpent/seaserpent.js:109-110)
  - clapperjar: NOT on the parts: canSeePlayer = 8 m, chest ray vs STATIC only, no cone (clappers.js:223-231); nap needs player far and wakes <2.6 m (clappers.js:308)
- The Courier's "loudness" (the only gait/posture hook) brain.js:55-59:
  `loud = (sliding 1.2 | crouching 0.45 | speed>5 1.35 | speed>0.5 0.9 | still 0.55) * (tool in hand 1.15)`; hidden (no sight at all) when
  character.hidden, dissolve>0.5 (melted into slip), god.active, or P.veiledT>0 (Vanish class art / Crucibelle mirage; lasting.js:148, crucibelle.js:199).
  Decoys: game.ai.decoys, loud 1.4 default (brain.js:63).
  - `P.crouching` is true for prone too (player.js:335, capsule.js:53 low = shape!='stand'): crouch and prone read the same 0.45.
  - Alt-walk (walkSlowSpeed 1.8, config.js:7) is > 0.5 m/s so reads 0.9 = same as a normal walk (4.2): the quiet walk buys nothing.
  - Speeds: walk 4.2, sprint 6.8, crouch 2.2, prone 0.6 (config.js:5-27). Loud 1.35 needs speed>5, i.e. sprint only.
- Memory (creatures/ai/memory.js): facts{pos,vel,seenAt,heardAt,aware 0..1,threat,grudge,peak}, interests (max 6, expire 20 s), places (max 24).
  AWARE.SUSPECT 0.35 ("?"), ALERT 1 ("!") (memory.js:156). Defaults hold 2.5 s, ebb 1/9 /s, threatEbb 1/120, grudgeEbb 1/200, facts dropped after 60 s at zero.
  A heard stimulus with `source` that it already has a fact for raises aware by gain*0.5 and drags last-known pos halfway to the noise (memory.js:194-197); a
  sourceless noise only becomes an "interest" (investigate). `about` stimuli (alarm/pain/death) teach kin the culprit (memory.js:187).
- Drives (drives.js): 0..1 rising on own clocks; fear has a `fall`. Traits rolled once (rollTraits): jelly bold/greedy/lazy/social.
- Decision (jelly/mind.js; wisp/mind.js is the same shape, smaller): `watch` (weight 1.15) when strongest alien fact aware >= 0.245 and no foe -> faces it,
  edges closer if curious, pops "?" glyph (jelly mind 144-157); `hunt` (1.7) when it knows a PREY/RIVAL (Courier is PREY in the table, ecology.js:70) at aware>=0.55 or grudge>=0.35,
  seen/heard within 8 s, inside leash (30 jelly, 26 wisp); score = logistic(aggression) with aggression=(0.22+0.55 hunger+0.7 grudge+0.35 territory+kin)*bold-0.8 fear (jelly mind 75-81);
  hunt enter: calls kin (alarm stimulus r26) and emits `jelly.notice`/`wisp.notice` + "!" glyph, at most once per 12 s (jelly mind 165-170; wisp mind 82). Loses you: keeps
  `f.pos` last-known 1 s after last sighting; leash exceeded sets aware to 0.3 and gives up. `flee` (2.1 urgent) on fear>~0.55 or hp<3 or a threat fact.
  Fear sources: kin pain/death in earshot, loud noise (strength>=0.8, reach>0.5; +0.12-0.15 / bold), a blow.
  Serpent: foe = ship fact aware>=0.55 or grudge>=0.3 within 10 s; `stalk` at aware>=0.21 (goes under, comes up to look); `investigate` shots; `loud` is the THROTTLE step
  [0.35, 0.7, 1, 1.4] (seaserpent/mind.js:34, 183-186) = the one fully "sneak by throttle" mechanic.
- Worked sensitivity (jelly, facing you, my arithmetic from the formulas): at 7.5 m walking "?" in ~0.6 s, "!" ~1.6 s; crouched ~1.1 s / ~3.3 s; at 12 m walking "!" ~6 s, crouched ~12 s;
  inside 2.6 m it is ~0.3 s whatever you do. Prone counts as crouch. Not a tested measurement.
- Statuses that gate sensing: calm/charm/forget stop `hunt`; sleep/stun/melt are top-weight actions (creatures.js:60, jelly/mind.js:100-107).

### 1.2 What emits a stimulus today (grep of `stimuli.emit`)
| kind | source | radius / strength |
| psygun shot | tools/psygun/weapon.js:434 | noise r22 s1 source=player |
| charged shot | weapon.js:500 | noise r32 s1.3 source=player |
| blast | boot/services.js:87-88 | noise r18+6R s1.5 and light r10+3R (no source) |
| pot breaking | world/props/potshards.js:102 | noise r10+8*size s0.8 |
| crystal strike | world/dunes/crystals.js:199 | noise r18 s0.6 |
| Dreamvane | tools/dreamvane/dreamvane.js:211,219,288 | noise r12/24/22, s0.4/0.8/0.55 |
| Crucibelle | crucibelle.js:223,252; mirage.js:45 | noise r18-20; mirage beats r16 every 0.9 s |
| Lockheart | lockheart/outcomes.js:53,107 | light r reach*1.5; death r40 |
| coffin / fork specials | pairspecials/coffin.js:47, fork.js:76 | noise r30 |
| Veritome Flash | tools/veritome/flash.js:80 | light r = range*1.4 (10 m cone -> 14; lens 15 -> 21), source=player |
| bauble spilled | courier/lachryma.js:148 | food r14 s0.6 |
| creature pain/death/alarm | jelly/slipjelly.js:172,188,223,513; wisp/lanternwisp.js:115,125; stun.js:67; seaserpent.js:275 (death r200); nursery.js:97 | r14-26 (alarm 26, pain 16, death 26) |
| sea gun | world/opensea/seafight.js:180,218 | noise r90 every 1 s (r135 on a burst) from the helm |
- NOT emitters: footsteps (move.step goes only to audio: boot/courier.js:59 -> audio/cues.js:424), landings, sprinting, slides, crouch changes, doors/lifts. docs/AI.md and stimuli.js:83
  claim "a heavy landing" noise and `shiny`/`scent` kinds; I found no emitter for any of the three (`shiny`, `scent` marked reserved in the docs).
- Listeners that react to specific kinds: jelly and wisp `heard()` only look at pain/death (kin) and noise strength>=0.8 (jelly mind 402-420; wisp mind 130-136); serpent: noise by courier -> +0.2
  curiosity, kin death -> fear (seaserpent/mind.js:178-182). `light` has no listener beyond memory.heard (it is an interest or +aware if source=player); the real light effect is `dazzle`.

### 1.3 Temperament (grain), mental state, EmO
- Grain (progress/combat/temperament.js): five -1..+1 traits (o c e a n), species means `slipjelly`, `lanternwisp` only (33-36); `traitsOf(grain)` (75) builds bold/social/greedy/lazy/curious/territorial/
  yielding/grudge/fearful/enrage. **Not wired**: no mind calls drawGrain/traitsOf (grep: only the bestiary tag reads `c.grain`, tools/veritome/creaturetag.js:114, which nothing sets). docs/plans/TEMPERAMENT.md "Still to build"
  already lists "Extraversion low: keeps to cover, ambushes" and "Neuroticism high: startles, scans" and says minds are Petra's. Natural stealth knobs: Openness -> shiny gain; Neuroticism -> fear rise; Conscientiousness -> patrol.
- Mental state (progress/combat/mind.js): -2 Stoic..+2 Prismatic, scales status duration (take 0.35..2); pushed by blows, settles to `mindRest + weather.moodRest` (creatures.js:252).
- EmO / Agitation (progress/combat/emo.js): 0..1, +0.08 per blow, +0.01/s while hunting, -0.03/s otherwise; band 0.35-0.75 maxes Lachryma yield; >=0.85 enraged (presses harder, hunt cooldown x1.7-1.8; jelly mind 186; wisp 95);
  catchFactor(emo) for the catch. A creature that has lost you calms at -0.03/s: the only "de-escalation" number.
- Events: jelly.notice (jelly/mind.js:169), wisp.notice (wisp/mind.js:82), seaserpent.rise (seaserpent/mind.js:96); ledger counts jelly.noticed / wisp.noticed / seaserpent.rise
  (feedback/tracking/jellies.js:13, wisps.js:9, seaserpent.js:10). **No achievement or knack reads any of them.** Audio: wisp.notice and seaserpent.rise have cues (audio/cues.js:400,132); jelly.notice has none.
- Diegetic marks: "?" glyph on watch, "!" on hunt/call (vfx/glyphs.js ask/bang1; Calissa's). No UI meter of awareness.

### 1.4 Stealth in docs / plans (grep: stealth|sneak|suspicion|detect)
- docs/plans/ENDGAME.md:95: a "stealth" genre floor candidate, avatar the Courier, "the prowl, the crawl, a creature's senses", prior art Metal Gear, Mark of the Ninja. Idea only.
- docs/plans/DUNEMAW-ARENA.md:29: "the rim's stealth circuit stays safe" (a line in the arena table; nothing in code; the arena rim is world/well/).
- docs/plans/APTITUDE.md:21,43: "stealth assessment" = the education-research term (read aptitude from play), NOT game stealth.
- creatures/ai/senses.js:16 and memory.js:19: prior art header cites Thief/MGS/Splinter Cell; world/well/nursery.js:16 cites "stealth games' guarded objectives".
- docs/GLOSSARY.md:236-238: the prowl / the crawl (`PROWL`, `CRAWL`, `player.posture` stand|crouch|prone). courier/anim/prowl.js and crawl.js are LOOKS ONLY (prowl.js:2: "What is shown only: player.js keeps the crouch's 2.2 m/s");
  the owner's brief for the prowl was "a hunting, predatory sort of movement, like a lion" (prowl.js:2) - predator, not sneak.
- Nothing in src matches stealth/sneak/suspicion/undetected.

## 2. Which creatures exist and their minds
| creature | body | mind | parts used | notes |
| slip jelly | creatures/jelly/slipjelly.js | creatures/jelly/mind.js (422) | Brain, Senses, Memory, Drives, Reasoner, steer, ecology | full ecology (thirst, hunger, rest, social, fear, curiosity); the worked example; kin cry; mourn; steals Lachryma |
| Lantern Wisp | creatures/wisp/lanternwisp.js | creatures/wisp/mind.js (138) | same | kites at keep 8 m, casts fire; fear/curiosity/rest only; "night" Figment (Dunes ruins) |
| smoke spirit (ally) | creatures/spirits.js | the jelly's mind | same | kind `spirit`: KIN to Courier, RIVAL to jellies/wisps (ecology.js:72) |
| Great Slip Jelly / FOE | creatures/jelly/greatjelly.js | no mind: timeline (creatures/ai/timeline.js; progress/combat/greatjelly.js) | Timeline only | `c.driven`; stands the mind aside; clutch guards use jelly `leash`/`homeR` (nursery.js, NURSERY.guard r12 leash10 alarm15) |
| clapperjar | creatures/clappers.js (789) | inline state machine (idle/taunt/nap/flee/hide/cower/mend), NOT on the parts | none (own LOS, own relations) | docs/AI.md section 5 lists "clapperjars moved onto the parts" as next; their sight is 8 m no cone |
| sea serpent + territorial beasts | creatures/seaserpent/seaserpent.js, shapes.js | seaserpent/mind.js (187) | same parts, `sees` override (the hull, loud by throttle) | progress/opensea/seaserpent.js (sense 200), seabeasts.js (akhlut, umibozu, kraken, Jormungandr: zone/leash); CASEBOOK 327 |
| Egregore herds (11 species) | vfx/opensea/egregoreherd.js (Calissa, looks only) | none: disposition state machine passive/wary/territorial/hostile by distance to the SHIP (egregoreherd.js:57-90) | none | wary -> scatters inside `shy` (25-150 m), regroups past 1.4x for 4 s; territorial -> DISPLAY inside `zone`; progress/opensea/safari.js EGREGORES table; world/opensea/herds.js lays them daily |
| Straw dummies | world/strawmanwell/dummy.js | dummymind.js | Brain + reasoner (hunt/idle) | rehearsal foes; no senses of note |
| training dummies / statusbench | world/throwingroom/* | n/a | n/a | targets only |
- The relations table is ecology.js:69-77 (jelly: courier PREY; wisp: courier PREY; clapperjar: courier CURIOUS; seaSerpent: courier PREY).
- Level of detail means off-screen creatures do not look at all (brain.js:344): a stealth design for roaming patrols needs a thought for LOD, `near`/`far`.

## 3. The Veritome today (src/tools/veritome/; docs/plans/VERITOMES.md, PHOTO-MODE.md)

### 3.1 Controls and the lens
- X draw/stow, RMB hold = lens (Tome_LensRaise 0.3 s in third person, then first person), wheel zoom between ZOOM.wide 64 and tight 16 deg (veritome.js:51), LMB shutter, `1` key Flash
  (R as sub), LMB with lens down = book bash (veritome.js:15-33, tick 146-160). Lens slows movement x0.55 (veritome.js:`slow`). Plate = 192x120 JPEG (PLATE, veritome.js:52), date-stamped.
- The lens's frame (vfx/veritomeframe.js, Calissa): four bright corners in the third person while drawn and lens down; autofocus-eased ray 1-30 m; parallax-corrected; no numbers.
  Viewfinder when raised (tools/veritome/viewfinder.js): compass tape, sextant arc, clock, zoom, memory squares, focus brackets per subject (vermilion = aware+engaged), capture circle with charge ring, stars the best subject would get;
  rule-of-thirds lines only with the knack ruleOfThirds (opens at 300 plates appraised or 4 four-star kinds: progress/knacks.js:41).
- Capture (veritome.js:59, 206-235): within 18 m, centre circle (off<0.32), charge 1.1 s. holdable(): a creature that is `programmable` and alive at ANY time (veritome.js:207) - so the "unaware cannot be held"
  line in the file header (veritome.js:12-14) and subjects.js:114-117 is stale for creatures (still true for clapperjars: aware+ENGAGED set). Held: +3 Lachryma, shutter chance (jelly mid-air or winding up) +5 (veritome.js:249-252).
  "A photograph never stuns"; the Flash stuns (FLASH = cost 6, cool 1.1, range 10 / lens 15, half 34 / 17 deg, stun 0.75, dazzle 1.4: flash.js:23).
- Shutter (veritome.js:239): memory full (24, memory.js:264) refuses; scorePhoto -> plate pending -> afterRender cuts the frame (268); pins on the map; undoes Soul Brush writing on pots in frame;
  emits photo.take { kind, stars, n, kinds, held, unwritten, left, score, fresh }. Pair special may "illuminate" the plate (pairspecials/plate.js).

### 3.2 Scoring a photo - scorePhoto (photo.js:44-86), Pokemon Snap's SIZE+POSE+TECHNIQUE
- Subject must be 0.4 < z <= 45 m in front, inside |ndc|<0.95, with a LOS ray (anything solid not the subject ref blocks; photo.js:61).
- score = ( 100*size + 50*centre + 50*facing + pose + min(60, 20*(same kind in frame - 1)) ) x classArtsRun.photoK (Radiance class art) (photo.js:76).
  size: frac = r/(z*tan(fov/2)); <0.33 -> frac/0.33; >0.85 falls to 0.3; 1 between (photo.js:64). centre = rule of thirds (1 on a crossing, 0.7 dead centre; +-0.1 lead room; photo.js:32-41).
  facing: dot(subject facing, direction to camera) clamped 0..1, 0.5 if it has no facing (66). pose: max over its states of the POSE table (photo.js:22): wind 60, air 60, infight 80, dance 50, bite 50, fight 50, mend 40,
  chase/stunned/greed 20, sleep/melt/nap/taunt/raider/celebrate/forage... 20-30; a tower from below -60.
  Stars: >=230 four, >=170 three, >=110 two, else one (photo.js:26). Sky photo or sun photo = 3 stars when no subject (photo.js:80-85).
- Subjects (subjects.js:135): slipjelly (states from brain action id + air + carry + statuses), clapper, fish, pot, lantern, hanging pot, shards, wreck, chest, gong, cog, carriage, skiff, kiln, palm, well, tally, oasis, water.
  **Lantern Wisp, sea serpent, Egregores, spirits are NOT subjects** - they cannot be scored, appraised or carded.
- STALE HOOKS (my findings): slip jelly's `aware: !!c.aggro, engaged: c.aggro && [...]` (subjects.js:34) - `aggro` is set nowhere (grep), so every jelly plate says aware=false/engaged=false (brackets never
  vermilion for jellies). A jelly's life states (drink, rest, huddle, play, mourn, investigate, watch, wander) have POSE 0 in photo.js:22 though the bestiary has a fact for each (bestiary.js:75-85).

### 3.3 Darkroom / appraise (darkroom.js:213-246) - the "report after the course"
- On the Codex VERITOME shelf, plates taken out in a batch. Per plate: Compendium keeps best score of each KIND (book.photos[kind]); bestiary learns every fact the subject's states satisfy, only for subjects with >=2 stars
  (darkroom.js:225-228); collection binds each Arcana whose `sitting` the plate satisfies (photo.js:100 `sits`; a sitting must be a main subject within 80% of the top score), plus `creature.<id>` card when the main subject is >=3 stars;
  one bound already condenses into cubes (WORTH by rank, ECON.condense). Best-coloured >=3 star plate teaches the vessel a glaze (vessel.learnFrom).
- Events: photo.appraise per plate { kind, stars, n, kinds, facts, cards, entry }, bestiary.fact { creature, fact, battle }, card.get/condense, darkroom.develop { n, entries, facts, cards, best }.

### 3.4 Memory, Book, bestiary
- Memory (memory.js): 24 plates, no film (room only). Book (book.js): memory + Compendium + pins (60) + bestiary facts, saved under its own adopted key foolsfortune.veritome.v2 (book.js:145), keeps no cards (owner ruling 2026-10-23).
- Bestiary (bestiary.js): creatures = clapper (14 facts), slipjelly (16 facts), one per angling fish species. Facts are learned from the creature's STATE at the shutter (`when: st('nap')`...); tiers by fraction known:
  GLIMPSED 1, OBSERVED >=3, STUDIED >=2/3, UNDERSTOOD all (tierOf, bestiary.js:96). `battle:true` facts are the useful ones. **No wisp, serpent, Egregore entry**, so no photo route to their familiarity.
- Reprogramming (reprogram.js, mind/*): stunned mind + macros typed on a 7x5 lattice; functions are learned from bestiary facts - "you can only ask a mind for what you have seen it do". Stealth design touching what creatures do (new actions) touches this learn table.

### 3.5 Familiarity (progress/familiarity.js)
- level = max(photo, fights): photo = ledger `bestiary.u.<kind>` (0..4), fights = downs thresholds [0,1,5,20,60] on `creature.<kind>.down` + `.read` (familiarity.js:30,48). READS table (36-41): tag, name L1, health quarters/eighths/bar/numbers,
  blow mark/rounded/exact, statuses L3, multiplier+grain+EmO value L4. Ledger counted by feedback/tracking/familiarity.js:12-16. A candid-photo-driven route to the same readout is already the design ("skill skips grind").

### 3.6 Collection / cards
- progress/collection.js: 22 Major Arcana + creature cards, each bound once (Fool bound at start); rank SS,S,A..H from Greed Island (cards.js, arcana.js ranks per card; WORTH = ECON.condense). Creature cards: portraits as main subject >=3 stars.

### 3.7 The photo finish (tools/veritome/finishplate.js)
- race.photo { gap, won, stars, rival, track, mode } (gap<=0.3 s) cuts a plate at the line into the memory, no lens, no photo.take, no cubes; emits veritome.plate { kind:'race', stars }. Ledger photo.plate.race (feedback/tracking/veritome.js:26).

### 3.8 The open sea = New Pokemon Snap's research already (docs/plans/OPEN-SEA.md 5, 13, 15.1)
- progress/opensea/habits.js: 11 species x 4 habits (44), each with a `when` of phase | weather | near (m) | full sail | flash; `habitNow(species, ctx)` picks the most particular (habits.js:44); `researchOf` = habits caught (0..4);
  first catch of a habit pays 0.15 of a hunt of the class (HABIT.share; habitFee 4-48 cubes), owed to the next dock; collection log shows the 44 slots (collectionlog.js:41). Ledger sea.habit, sea.habit.<species>.<habit>.
  Event sea.habit { id, habit, label, first, cubes }. Domain credit divination base 8, quality 0.9 first / 0.3 repeat (domains.js:135).
- world/opensea/herds.js: 4 herds a game day (MIGRATION.herds), same for everyone; dock posts the board (sea.herds); a plate (shutter ashore or E at the helm with Veritome worn, herds.js:91-96) meets a herd if one body is within
  HERD_LOOK.reach 180 m of the camera and inside cone 0.85 (cos, ~32 deg) (herds.js:28, 98-113); herdFee(cls) = half a hunt, once per herd per game day, paid at the next dock (sea.herd, sea.herd.paid). Ledger sea.herd, sea.herd.<id>.
  Achievements Herd Watcher (10 herds) and Migration Season (6 kinds) (seaachievements.js:21-22). **No achievement reads sea.habit** (only the collection log).
- The Snap-style SCORE exists as pure functions and is NOT called: plateScore({fill,centre,facing,habit}) (0..140, best near 1/3 frame, +40 habit; stars 1-4) and platePay(id,stars,bestBefore) pay-the-difference
  (progress/opensea/safari.js:62,70). grep shows no caller; herds.js pays herdFee/habitFee regardless of framing, fill, centre or facing. OPEN-SEA.md 5 and 160 still describe a score-paid plate and `plate.<egregore>` counters - not built.
- A habit is determined by the CONDITION (hour, weather, distance, sail, flash) at plate time (herds.js:117), not by what the body is actually animating; the herd bodies play their own random habits every 8-20 s (egregoreherd.js:90). The two systems do not talk.
- Sea mount: the Veritome's "Flash" mount at the bow holds a beast's weak point open 4 s and takes a plate; its flash lights a habit for 4 s (SEA_MOUNTS.veritome: progress/rail/mounts.js:55; seamounts.js:100; herds.js:35).

### 3.9 Planned vs built
- VERITOMES.md (Dovina's): variant books (Plain, Empath's = mood/EmO, Augur's = Brain's next action + Soul Brush writing, Skeptic's = decoys/mirages), "a sight is a convenience, never a key", viewfinder-only overlays (Batman detective-mode warning). **None built**:
  no variant id on the belt (grep "Empath|Augur" finds only class-art/music text). Asks Petra for a book id like the Lockheart's `HEARTS`.
- PHOTO-MODE.md: step 1 arrow-key orbit, step 2 a free-camera posing mode; ledger never sees photo mode; separate from the Veritome. Not Veritome-affecting.
- TEMPERAMENT.md: grain -> the Veritome reads `c.grain` (1 trait at L1, all 5 at L4) and writes through `nudge`: not built.
- OVERLAY.md 17 (creature tags, plain/latent/scrambled lines): built (creaturetag.js, vfx/creaturetags.js).
- Rule of Thirds knack gate TRAINING.md 6: built (photo.js:32, knacks.js:41). TRAINING.md also names "a light term (the hour, front-lit) joins it" for photo scoring (TRAINING.md ~98): **not built**; photo.js has no light term.

### 3.10 Events and ledger the Veritome produces (feedback/tracking/veritome.js:14-47)
- Events: veritome.draw/stow/lens, photo.take, photo.discard, photo.appraise, darkroom.develop, bestiary.fact, card.get, card.condense, veritome.plate (race), flash.fire { hits, downs, lens }, veritome.swing/hit (bash), reprogram.open/run/reject/miss/close/wear, sea.plate, sea.herd, sea.habit.
- Ledger keys: photo.take, photo.shot.<kind>, photo.held, photo.chance, photo.unwritten, photo.discard, photo.appraised, photo.kind.<kind>, photo.stars.<n>, photo.stars.best (hi), photo.kinds.best, photo.four.<kind>, darkroom.batches, darkroom.batch.best,
  bestiary.facts, bestiary.battle, bestiary.fact.<creature>[.<fact>], bestiary.u.<creature> (tier), card.get/pages/pages.<section>/got.<id>/condense, flash.fire/hits/lens, time.veritome, reprogram.*, creature.<kind>.struck/down, jelly.noticed, wisp.noticed.
- Achievements (progress/achievements.js:347-370): Say Cheese (25 photos), Shutterbug (500), Held to the Real (10 held), Shutter Chance (5), Developing, A Full Roll (24 at once), Four Stars, A Full Frame (5 kinds in a photo), Field Notes (8 kinds), The Whole Compendium (20),
  Naturalist (5 facts), Know Thy Enemy (10 battle facts), Infighting (hidden), Understood (clapperjar; title the Naturalist), Under the Surface (5 fish studied), Bound/Half the Arcana/The Major Arcana/Portraitist/Condensed; Lights Out (flash stun, achievements.js:494).
- Domain XP: photo.take -> Divination base 8, quality from the continuous score and halved for a kind already held (domains.js:50).

## 4. Where the Courier's noise/visibility could come from (what exists to read)
- Gait/posture: player.posture 'stand'|'crouch'|'prone' (player.js:84), player.crouching (true for prone too), sliding, walking (Alt), sprinting, dashT, wallrun, mantle; speed from player.vel. Emitted: move.posture {from,to} (capsule.js:90).
  Ledger already counts time.state.<idle|walk|run|sprint|crouch|prone|slide|air|...> via feedback/tracking.js:70-98 (time.state.*).
- Footsteps: `character.onFootstep` -> `move.step { surface, speed 0..1 (0 = crouch speed 2.2, 1 = sprint 6.8), by:'courier' }` (boot/courier.js:59; courier/stepsurface.js stepSpeed, surfaceUnder); mantle also emits it (courier/player/mantle.js:75).
  Surfaces: clay stone sand wood metal grate water paint crude grass lachrymite (STEP_SURFACES). Only audio/moves.js listens (limit 12 a real second). **Free hook**: a listener turning move.step into a `noise` stimulus with radius by surface x speed x posture.
- Day: progress/weather.js phaseAt(ms) night(20-5)|dawn(5-7)|day(7-18)|dusk(18-20) (weather.js:84), lightAt(ms) 0.08..1 sinusoid (94). Used by: raceway/conditions.js, vfx; world/dunes/solar.js; opensea habits. **No creature mind reads it** ("the hour as a drive modifier" is docs/AI.md section 5, Next).
- Weather: game.weather.here(pos) { aspect, strength, place, exposure }; moodRest(pos) already shifts creature mind (creatures.js:252); biteMult (fish); senseMult(pos) = ECON.weather.sense 1.5 at night or in a Well (weather.js:182, econ/table.js:261) but ONLY called by core/signatures.js:35 (the Courier's own Lachryma senses: Dreamvane, Lockheart, Reveal song).
- Signatures (core/signatures.js): a registry of Lachryma sources (baubles, cubes, chests, clappers, jellies with swallowed Lachryma, crystals, spirits) with loudness(s,d)=strength/(1+0.004d^2+0.04d). It is the OUT direction (what the Courier's tools sense). The Courier is not a signature; the lachryma pool glows at night (weather.js header).
- Light: render/lightbudget.js: 8 pooled PointLights lent per frame to the best lamps by score; lights are render-only proxies (no query "is the Courier lit"). render: one sun shadow (CLAUDE.md). No shadow/occlusion sampler exists; vfx lamps are Calissa's, world lamps Petra's. A game-side light query (lamp list + range, sun elevation via lightAt) would be new.
- Veil/hide: P.veiledT, character.hidden, melt/dissolve>0.5, god.active (brain.js:56); Vanish class art (progress/classarts.js:147, courier/classarts/lasting.js:148, 3 s decoy + unseen).
- Belt: g.belt.inHand x1.15 loud (brain.js:58).
- Zones: render/zonemap.js zoneOf/wholeOf; Wells ("deep", own mood); roofed/open exposure in weather.js.
- Eco hooks for hiding: 'shade' offers (palms in the Dunes) are for creatures resting; nothing offers cover to the Courier.

## 5. Ownership (per CLAUDE.md "Threads")
- Petra (everything not listed): src/creatures/** (ai/, jelly, wisp, seaserpent, clappers, creatures.js, stun.js), src/courier/ (player.js, capsule.js, stepsurface.js, mind.js), src/core/ (signatures.js, config.js feel tuning), src/boot/, src/render/ (lightbudget, daylight),
  src/tools/veritome/** CODE (VERITOMES.md header: tool's code Petra's), feedback/tracking/* rules, world/** (herds.js was taken by Dovina 2026-10-24 per OPEN-SEA.md), progress/weather.js machinery (docs/plans/WEATHER.md says "Kept by Dovina"; creatures.js reads are Petra's).
- Dovina: progress/econ/, ECON.openSea/weather/hunt numbers, ledger + achievements (progress/achievements.js, seaachievements.js, knacks.js), progress/familiarity.js, progress/combat/ DATA (temperament.js, emo.js, mind.js, figmenttelegraphs.js - "the data and the rules are Dovina's, in progress/combat/", creatures.js header),
  progress/opensea/** (safari.js, habits.js, migrations.js), progress/collection*.js and cards/arcana rank tables, docs/plans/* (VERITOMES.md, TEMPERAMENT.md, PHOTO-MODE.md, OPEN-SEA.md, WEATHER.md, TRAINING.md), docs/DESIGN.md, sweeps.
- Calissa: src/vfx/** (veritomeframe.js, creaturetags.js, glyphs.js, opensea/egregoreherd.js, egregorebodies.js, temper.js), src/ui/**, tools/veritome/viewfinder.js is UI (looks), model/anim (vfx/cardbacks, tools/veritome/model.js, hold.js), creature bodies' "tells" and the six body dials of grain; every sight overlay of a variant Veritome.
- Wanda: src/audio/** (footstep sounds audio/moves.js STEP, audio/wisp.js, seasafari.js, cues.js); any noise-meter sound or "notice" stinger.
- Espada: names/words (all plain-name until South calls a mechanic final; CLAUDE.md "Plain names until settled"), bestiary prose, glyph/log lines as strings, docs/LORE.md, npc/talks.js. New stealth words go in docs/GLOSSARY.md first.
- Rules touching this work: "Built once" (a mind is assembled from creatures/ai/; sounds/lights/smells a creature should notice emit a stimulus; what a place offers is an ecology offer) - so footsteps -> stimulus and cover -> eco offer is the sanctioned shape;
  "Base change bad, modifiers good" (stealth should be a modifier with a visible source, not a rule change); "Every number that matters has two avenues" (a noise/visibility value needs body/world, overlay, sound, log); "No new checks for a mechanic in flux"; "Test lean";
  "World marks carry no words" (glyphs only, no 'DETECTED' text; the overlay's tag may carry words); log is the only narration.

## 6. Gaps / tripwires for the stealth + Snap design (condensed)
1. Footsteps and landings make no stimulus; Alt-walk reads the same as walk; prone reads the same as crouch; there is no light/dark, cover or surface term in `loud`. (brain.js:58)
2. Static-only LOS: pots/props/creatures never block a creature's sight (senses.js:42), so hiding behind a pot (a clapperjar's trick) is not hiding from a jelly.
3. FEEL radius defeats stealth: jelly 2.6 m, wisp 3 m, serpent 30 m, ignoring facing/LOS/loud.
4. Awareness does not decay while seen; no "searching" state beyond hunting last-known pos 1 s after last sight (and `investigate` for noises). Losing a creature is only by leash (aware capped 0.3) or by `hold`/`ebb` out of sight.
5. The Veritome says "unaware is photographed candidly" but holdable() ignores awareness for creatures (veritome.js:207), jelly `aware/engaged` are dead (aggro unset), and only 3 creature kinds exist as bestiary/photo subjects (clapper, slipjelly, fish); wisp/serpent/Egregores can't be scored or learned.
6. plateScore/platePay (safari.js:62,70) are unused; herd and habit plates pay a flat fee regardless of composition.
7. Grain is unwired; AI.md "Next" lists the hour as a drive modifier and scent trails as unbuilt.
8. LOD: creatures beyond `near` 45 do not sense at all (brain.js:339-351).
