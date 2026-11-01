# Prior art for a mental safari: sneaking up on Figments and photographing them

Prepared for South (Dovina's brief). Research only; the repo was not edited. Every number or mechanic carries a URL. Where a number could not be found, or only a secondary summary was reachable, it says so. A short "What I could not verify" list is at the end.

Fit with what the game already has (read from `docs/AI.md`): a `Senses` cone with line-of-sight rays whose awareness builds "faster the nearer, the more central, and the more CONSPICUOUS the thing"; memory facts with awareness 0..1 and `AWARE.SUSPECT` 0.35 ("?") and `AWARE.ALERT` 1 ("!"); a `noise` stimulus with a radius (shot 22 m); `scent` already reserved on the stimulus bus; drives and grain traits. So the safari is an extension of these parts, not a new system (CLAUDE.md "Built once").

---

## A. Photo safari games

### A1. Pokemon Snap (N64, 1999)

- Loop: a linear on-rails ride in first person; up to 60 pictures per visit; then you pick your best shot of each Pokemon for Professor Oak to rate. Seven levels (Beach, Tunnel, Volcano, River, Cave, Valley, Rainbow Cloud); 63 of the original 151 Pokemon. https://en.wikipedia.org/wiki/Pok%C3%A9mon_Snap
- Judging: size in frame, pose, keeping it in frame, a bonus for a "special" pose or Pokemon (a surfing Pikachu), and a bonus for several of one kind in the shot. https://en.wikipedia.org/wiki/Pok%C3%A9mon_Snap
- Fan FAQs add a "technique" factor: centring the subject can double the score, and the nearer the subject, the more size points. Sources disagree on the exact centring rule. https://archive.rpgamer.com/games/pokemon/snap/reviews/snapstrev2.html and https://tasvideos.org/Forum/Topics/26103 (surfaced by search; I could not open the pages themselves).
- One concrete data point: a single Ditto shot scored 1000 for size and 1000 for pose, doubled to 4000. https://retroachievements.org/achievement/70570 (via search summary). No official weight table exists in what I could reach.
- How behaviour is coaxed (the part that matters to us): items are tools of provocation. Apples are thrown to stun or attract; Pester Balls flush Pokemon out of hiding or knock them out; the Poke Flute wakes, irritates, hatches or makes them dance, and three songs give different dances; the Dash Engine speeds the ride. The player starts with only a camera, and accessories arrive gradually, so levels are replayed for hidden Pokemon, alternate routes and better shots. https://en.wikipedia.org/wiki/Pok%C3%A9mon_Snap
- Lesson: the camera is the whole verb, items turn a background creature into a performer, and the "good photo" is a mix of closeness, a rare action and framing.

### A2. New Pokemon Snap (2021)

- Six scoring factors: Pose, Size, Direction (looking at you scores higher), Placement (nearer the centre scores higher), Other Pokemon (same species in shot), Background. https://imore.com/new-pokemon-snap-tips-taking-best-pictures
- Fan-estimated caps: Pose 2,000, Size 2,000, Direction 1,000, Placement 1,000, Other Pokemon 1,000, Background 500. Photo ranks by total: Bronze up to 2,499; Silver 2,500 to 3,499; Gold 3,500 to 3,999; Platinum 4,000 or more. https://outsidergaming.com/new-pokemon-snap-how-to-get-maximum-points-and-each-star-grade-for-your-photos/ (fan testing, not official; another site lists Pose 0 to 1000, Size 0 to 2000, Direction 0 to 1000, so caps disagree: https://marriland.com/?p=2468).
- Stars (1 to 4) are a separate axis: they rate how rare the Pokemon's current activity is, and points do not change them. https://outsidergaming.com/new-pokemon-snap-how-to-get-maximum-points-and-each-star-grade-for-your-photos/ and https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap
- The design is that quality of photograph and rarity of behaviour are two readouts, kept apart. The developers say the star system was built on the original's evaluation, "kept simple so it would be easy to understand". https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap
- Tools:
  - Scan: reveals hidden Pokemon and points of interest, and can unlock alternate routes.
  - Fluffruit: lures Pokemon closer or gets their attention; thrown at one, it annoys it harmlessly (replacing the Pester Ball).
  - Illumina orbs: the Pokemon glows, which helps at night and can change behaviour (wake a sleeper, cheer one up); unlocked by photographing a crystabloom flower.
  - Music box: nearby Pokemon dance.
  - Illumina boss encounters at each island's end use Fluffruit and orbs to get a big Pokemon to pose.
  https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap
- Limits: 72 photos per expedition, double the original's film limit. https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap
- Progression: better photos earn Expedition Points that raise each area's Research Level; higher levels unlock more course variants with new species or behaviours. Some courses have night versions with different species and routes. https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap
  - A guide reports that Research Level also lets the Photodex detect more Pokemon from a distance and identify special poses. https://serebii.net/newpokemonsnap/locations/florioislandilluminaspot.shtml (via search summary; the per-area figure "Level 2: 1 XP, Level MAX: 60,000 XP" appears there and should be checked before use).
  - One guide says a four-star shot needs an Illumina orb; other pages list some four-star behaviours that need none, so treat that as a per-behaviour rule, not a general one. https://sportskeeda.com/pokemon/how-get-high-star-ranking-new-pokemon-snap (via search summary).
- Requests (LenTalk): research tasks that unlock titles and hint at how to get rarer three- and four-star shots. Some were poorly explained, leading to trial and error. https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap
- Dev intent: "build the world where wild Pokemon actually live"; courses modelled on theme-park rides to be replayed; Pokemon roam freely, with behaviours built from species traits and relations to other species and to the environment. https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap
- Re-Snap: zoom, brightness, blur, filters and frames after grading, kept in a separate album from the Photodex. https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap

### A3. Fatal Frame / Project Zero (Camera Obscura)

- The camera is the only defence; it damages, captures and pacifies ghosts. Aiming switches to first person. The camera locks on, and damage depends on how well the ghost stays in focus; ghosts flicker, which makes focus harder. How close and at what angle also matter. https://en.wikipedia.org/wiki/Fatal_Frame
- Fatal Frame: the most damaging shot is taken just before the ghost's attack lands, deals heavy damage and can start a combo if follow-ups are timed well. https://en.wikipedia.org/wiki/Fatal_Frame
- Capture circle: the ghost must be inside it at the shutter; the circle fills while the ghost stays in; the charge sets damage; film type and lenses add to it. In Maiden of Black Water it became focus points on each spirit. https://fatalframe.fandom.com/wiki/Camera_Obscura (via search summary).
- Shutter Chance: moments of a hostile ghost's weakness; the circle glows and the camera zooms. In the Crimson Butterfly remake a successful Fatal Frame opens a brief Fatal Time window for consecutive shots. https://www.koeitecmoamerica.com/manual/fatalframe-mobw/en/3300.html and the remake's system page https://www.koeitecmoeurope.com/zero/crimson-re/uk/system/index.html (via search summary).
- Film: a consumable with ratings for power and reload speed; higher power is slower to reload. https://games.gg/nl/fatal-frame-ii-crimson-butterfly-remake/guides/fatal-frame-ii-remake-camera-obscura-film-types-guide/ (fan guide, via search).
- Passive ghosts in the environment vanish if not photographed at once; captured ghosts are added to a list that reveals their past. https://en.wikipedia.org/wiki/Fatal_Frame
- Lesson: the best photo is taken at the moment of greatest danger, so the camera rewards courage. The held focus that builds with time on target is a cheap, readable "hold steady" mechanic.

### A4. Other photo and capture games

- Bugsnax (lure, trap, scan): the SnaxScope scan shows a snack's movement path and clues, and what it likes or hates; traces on rocks and ground can be scanned to learn the time of day and weather it is active in; sauces lure it; a trap's light changes from white to blue and pings when prey is near; a Bunger can be lured into another to tackle it. https://www.pcgamer.com/bugsnax-guide/ and https://www.pushsquare.com/guides/bugsnax-guide-tips-tricks-and-how-to-catch-every-bugsnak (via search summary).
- Pupperazzi: objectives ask for a set number of dogs, or for a particular lens or filter; finished photos are turned in for rewards (bonks, followers). https://intoindiegames.com/walkthroughs/pupperazzi-guide-photo-challenges/
- Umurangi Generation: missions plus bonus objectives such as recreating a "postcard shot", a group photo, and finishing a level in under 10 minutes. https://unwinnable.com/2021/10/29/urgency-and-mastery-in-umurangi-generation/
- TOEM: I found no documentation of its photo objectives; coverage only calls the camera's zoom its one function.
- Lesson from all three: a list of named shots (an objective card) gives a photo a purpose beyond a score, and scanning tells you when and where something is active without telling you how to catch it.

---

## B. Stealth readability and systems

### B1. Rules to copy: Mark of the Ninja (Nels Anderson's five "heresies")

- Transparent stealth: light and dark are strictly binary; a hidden character is drawn black with red highlights, a lit one in full colour. Noise rings show how far a sound carries, so a player can judge risk before acting. A guard at the very edge of vision gets only a glimpse and moves toward you "quickly but not on full alert" (forgiving detection).
- Transparent AI: three clear awareness levels, shown with what triggered each change; a ghost marks where you were last seen; "if a guard's behavior ever changes, the player will immediately understand what set it off."
- Limited consequences for failure: a checkpoint between nearly every meaningful encounter, instant reload.
- Encounter size: the screen plus about 0.5 to 0.75 of a screen in any direction.
  https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules (also noted in the same source set: sneaking made no noise, walking a little, running a lot: https://pcgamer.com/stealth-game-design-mark-of-the-ninja, via search summary).

### B2. Thief and its descendants (numbers)

- Thief's light gem exists because early builds gave "confused signals": guards sometimes missed players in plain view and well-hidden players were spotted at once. The fix was to feed the player's visibility state back. https://www.gamedeveloper.com/design/building-the-original-i-thief-s-i-revolutionary-stealth-system
- Footstep noise depends on the floor: carpet and grass quiet; metal and ceramic tile loud; moss arrows muffle. https://en.wikipedia.org/wiki/Thief:_The_Dark_Project (via search summary).
- The Dark Mod (a free Thief-like, openly documented) gives the best numbers I found:
  - AI field of view 150 degrees horizontal, 120 vertical (helmets and hoods narrow it to 110 or 80). https://wiki.thedarkmod.com/index.php/AI_stats
  - Alert stages by accumulated counter: thresholds 1.5, 6, 10, 18, 23; the AI settles back after about 5 ± 1.5 s, 8 ± 2 s, 25 ± 8 s and 65 ± 20 s from stages 1 to 4 respectively, with a grace time of 2 to 3 s before decay starts. https://wiki.thedarkmod.com/index.php/AI_stats
  - Hearing: sound volume falls off linearly with distance; the audibility threshold is 18.8 dB SPL (real hearing about 20); whatever remains above the threshold is added to the alert counter. https://wiki.thedarkmod.com/index.php/AI_stats
  - Sight: a per-frame random roll against a probability that depends on light level, distance and the AI's acuity. A base value of 0.1 is tuned to about "a 1-in-5-seconds chance of being spotted, measured over half a second"; the curve is a fifth-degree polynomial of the light gem value, reshaped because a linear one was not sensitive enough. Probability holds flat out to a clamp distance, then falls linearly to zero; at full brightness the range runs from 11 m (`tdm_ai_sightmin`) to 60 m (`tdm_ai_sightmax`), and both shrink in dim light. A glimpse alerts by 4 to 13 units. https://wiki.thedarkmod.com/index.php/Visual_scan
  - Sneak attack multiplier 2.0 on an AI at alert stage 2 or lower. https://wiki.thedarkmod.com/index.php/AI_stats
  - Lesson: awareness is an accumulator with stage thresholds that widen sharply (1.5, 6, 10, 18, 23) and decay times that lengthen with stage (5 s up to 65 s); a low stage forgets fast, a high stage holds a grudge.

### B3. Metal Gear Solid and the phase model

- Metal Gear 2 introduced a countdown timer that decides when the next mode begins; Alert drops to Evasion when it reaches 0; rediscovered in Evasion, the game returns to Alert; Sons of Liberty added Caution after Evasion and let you avoid Alert by preventing the enemy radioing HQ; Snake Eater removed that. https://giantbomb.com/wiki/Games/Metal_Gear_Solid_3_Snake_Eater and https://strategywiki.org/wiki/Metal_Gear_Solid_2:_Sons_of_Liberty/Gameplay (via search summary). I could not retrieve exact timer lengths.
- The "!" over a guard's head is the famous glyph. This is the same shape the game already uses (`AWARE.ALERT` as "!", `AWARE.SUSPECT` as "?").

### B4. Splinter Cell, Hitman, Assassin's Creed, Tenchu, Desperados

- Splinter Cell: Chaos Theory shows a light meter and a sound meter; the sound meter compares your noise with the room's ambient noise, and you are undetectable if you stay below the ambient mark. https://giantbomb.com/wiki/Concepts/Sound_Meter and https://en.wikipedia.org/wiki/Tom_Clancy%27s_Splinter_Cell:_Chaos_Theory
  - Lesson: noise is relative to ambient. Wind, rain or a waterfall hides footsteps.
- Hitman: Blood Money's suspicion bar sits beside health; in Absolution suspicion is a circular splodge near the hit notifier, and turning a corner can clear it. https://pcgamer.com/hitman-absolution-preview-2/2 and https://gameinformer.com/b/features/archive/2012/11/19/a-beginner-39-s-guide-to-hitman-absolution (via search summary).
- Assassin's Creed: Syndicate's threat ring colours each enemy white, yellow, red; the detection icon fills with time in sight and faster the closer they are. Black Flag: fill rate during suspicion depends on your actions and the guard's proximity. https://primagames.com/eguides/assassins-creed-syndicate-eguide/the-essentials/stealth (via search summary). Rogue: three states Incognito (blue), Investigation (yellow), Conflict (red); breaking eye contact makes them lose interest quickly. https://gamerguides.com/assassins-creed-rogue/guide/gameplay-basics/basics/detection-states
- Tenchu: the ki meter shows distance as a number and an icon for the nearest enemy's state; "?" means totally unaware; red means spotted. https://strategywiki.org/wiki/Tenchu%3A_Stealth_Assassins/Gameplay
- Shadow Tactics and Desperados III: the cone has two zones, a dashed area where a crouched character avoids detection and a solid area where detection is unavoidable; once seen, the cone fills with red toward the character, and if the red reaches them the alarm sounds; you can plant a vision probe, and a thrown perfume bottle shrinks a cone for a while. https://en.wikipedia.org/wiki/Desperados_III (via search summary). No sound radii found.
- Far Cry 3 style indicator vs Splinter Cell Blacklist's "investigate a disturbance": a modl.ai post cites Game AI Pro 2, chapter 28 ("Modeling Perception and Awareness in Splinter Cell: Blacklist"), which is the chapter to read for hard numbers. I could not open it.

### B5. Hunting and wildlife games

- Breath of the Wild: a sound meter shows how much noise Link makes here; too much noise wakes or turns an enemy and prevents a sneakstrike; Stealth Up gear reduces noise; hunt targets such as boar flee if they notice you. https://zeldadungeon.net/wiki/Sneakstrike (via search summary). No speeds or radii found.
- Red Dead Redemption 2: animals can be warned by scent, so stay downwind; wind direction can be checked in Eagle Eye; Cover Scent lotion hides your smell so you can get closer; the wind can carry your scent to other animals. https://www.rdr2.org/guides/red-dead-redemption-2-hunting-guide/ and https://www.shacknews.com/article/108167/complete-hunting-guide-red-dead-redemption-2 (via search summary). No numbers published.
- theHunter: Call of the Wild: a HUD cone shows where your scent travels; scent and noise carry farther downwind; animals hear, see and smell; a scent eliminator makes the hunter scentless for roughly 30 minutes, per a player report. https://steamcommunity.com/app/518790/discussions/0/4138313123970008035 and https://steamcommunity.com/app/518790/discussions/0/3940146862836640468 (player threads, not developer documentation; treat as unverified).
- Monster Hunter: the Ghillie Mantle (World/Iceborne) makes you undetectable for 120 s, then a 300 s cooldown; it ends if you attack or take damage; holding still extends it. https://samurai-gamers.com/monsterhunterworld/ghillie-mantle-stats-and-effects/ and https://www.gamerguides.com/monster-hunter-wilds/guide/getting-started/gameplay/mantles-monster-hunter-wilds. Sneak attacks work only if the monster has not noticed you. https://sportskeeda.com/esports/how-to-perform-sneak-attacks-monster-hunter-wilds (via search summary).
- Ghost of Tsushima: foxes lead to shrines; birds guide to places; a flock may take flight as you approach; no flee distances published. https://en.wikipedia.org/wiki/Ghost_of_Tsushima (via search summary).
- Alien: Isolation: the alien is driven by sensors, and "never allowed to cheat"; a director knows where you are and keeps a "menace gauge" at a medium level, sending the alien away when it peaks. https://www.gamedeveloper.com/design/the-perfect-organism-the-ai-of-alien-isolation (via search summary).

---

## C. Real-world fieldcraft, ethology and photography

### C1. Flight zones and flight initiation distance (FID)

- Hediger separated flight distance (escape boundary), critical distance (attack boundary), personal and social distance. Alert distance is longer than the escape distance: the animal changes behaviour (raises its head) without fleeing. https://en.wikipedia.org/wiki/Flight_zone
- Sample FIDs (mostly means, metres): mule deer 149 to 250; elk 85 to 201; pronghorn 235; bison 101; American robin 9; blackbird and blue tit about 10; mallard 236; grey heron 255; feedlot cattle 1.5 to 7.6 (up to 30 on mountain range). https://en.wikipedia.org/wiki/Flight_zone
- Larger species are more tolerant of humans (75 studies, 212 species); urban and habituated animals have much shorter FID; eye size increases FID across 107 bird species; gaze matters (horned lizards fled earlier when the approacher turned toward them); FID rises with distance from refuge in gray squirrels. https://en.wikipedia.org/wiki/Flight_zone
- Meta-analysis of 116 studies (61 in the meta-analysis): predator speed, size and directness of approach raise FID. Non-mammals' perceived risk rose about 60% when the predator sped up; perceived risk fell about 31% when the path bypassed the prey (r = 0.29); distance to refuge was the strongest effect (r = 0.43, about 43% higher risk when far from shelter); prior experience raised risk about 38%; repeated approaches r = 0.47; habituation to harmless humans (parks) lowered FID. https://pmc.ncbi.nlm.nih.gov/articles/PMC1559976
- Black-tailed deer approached by a human: they fled farther when approached faster and more directly; deer already alert at the start fled at longer distances with shorter assessment time; a "zone of awareness" lies beyond which detection of the approacher is delayed. Gaze was varied but the abstract does not report a gaze effect. https://ideas.repec.org/a/oup/beheco/v17y2006i2p246-254.html
- Counterpoint, so the design does not over-trust "direct is worse": the effect of directness is described as "equivocal" in birds (perpendicular offsets 0 to 30 m), and mechanism may be approach speed or acceleration. https://ideas.repec.org/a/oup/beheco/v25y2014i4p960-966..html (via search summary of Fernandez-Juricic et al. 2005 and Moller and Tryjanowski 2014).
- White-tailed deer vs vehicles: median FID 69.1 m (range 0 to 368 m), median 40% of start distance whatever the speed (20 to 90 km/h), median time-to-collision 4.6 s. The deer did not adjust to speed. https://pmc.ncbi.nlm.nih.gov/articles/PMC4198184/
  - Meaning for a game: a prey animal may use "time until contact" rather than distance, so a faster approach triggers earlier-in-distance flight only in some species. Let temperament pick whether a Figment cares about distance, speed or time-to-contact.

### C2. Gaze, head orientation and vigilance

- Wild starlings changed behaviour with a human "predator's" orientation, the presence of eyes and the direction of eye-gaze; when the predator looked away they returned to feeding sooner, fed faster, and ate more. https://pmc.ncbi.nlm.nih.gov/articles/PMC2587789 (Carter, Lyons, Cole, Goldsmith 2008, via search summary). An earlier house sparrow study found no such response, so it is species-dependent.
- Photographers' own behaviour matters, not just distance: a Deakin study measured FID in four treatments (walking; taking an image every five steps; walking with flash; crouching) and says guidelines should be species-specific. I could not retrieve the values, so "crouching or raising a camera lengthens FID", which appears in a secondary summary, is unverified. https://dro.deakin.edu.au/articles/journal_contribution/Camera_shy_Motivations_attitudes_and_beliefs_of_bird_photographers_and_species-specific_avian_responses_to_their_activities/20747116

### C3. Stalking technique (hunters')

- Principles hunters agree on: approach downwind or crosswind (working at an angle to the wind gives room to change course); keep off the skyline because movement and outline are what deer see; move a little, look a lot; use terrain and cover to break the outline. https://outdoorlife.com/articles/hunting/2015/09/art-stalk-10-tips-getting-closer-game and https://www.shootinguk.co.uk/shooting/rifle/steps-successful-stalk/ (via search summary; both pages failed to load directly).
- Timing with the head: stalkers advance while the animal's head is down or turned away or behind a tree and lie still when it is up. I found it described in stalking accounts but not stated as a rule in one place, so treat it as a field custom, with the starling result above as the supporting science. https://www.shootinguk.co.uk/news/stalking-on-the-corriemulzie-estate/ (via search summary).
- Morning thermals: approach a ridge from below so scent rises above the deer. (Same search summary.)

### C4. Ethics, hides and habituation

- Distance guidance varies by species and larger animals need more; "if the animal moves away, you are too close"; if it stops feeding or keeps looking at you, back off and return later with a slower approach. https://wildsafebc.com/resources/photography-ethics/ and https://www.pendaphototours.com/blog/ethics-in-photo-safaris-why-distance-matters/
- Do not bait or play recorded calls; baiting breeds habituation which can kill the animal. Mammals with young often freeze rather than flee. https://wildsafebc.com/resources/photography-ethics/ and https://spca.bc.ca/ways-to-help/take-action/wild-animals/ethical-wildlife-photography-how-photographers-can-keep-themselves-and-animals-safe/
- Hides: time in them should be limited and temporary hides avoided without good practice. https://www.teesmouthbc.com/?p=1465 and https://www.durhamwt.com/sites/default/files/2020-09/Ethical-Wildlife-Photography.pdf (via search summary).
- Birds' alert and flight response depends on tripod at eye level so the camera need not be raised to the face. https://www.birdwatchingdaily.com/?p=123205 (via search summary; practical advice, not a measured result).

### C5. Photography craft

- Golden hour: no fixed definition; sun roughly 0 to 6 or 10 degrees above the horizon; about 3,500 K against about 5,500 K at midday; longer, softer shadows; duration varies with latitude and season. https://en.wikipedia.org/wiki/Golden_hour_(photography)
- Shutter speed: slower speeds smear moving subjects; handheld rule of thumb is 1/focal length (a 200 mm lens no slower than about 1/200 s); 1/500 to 1/250 s for people in motion, 1/1000 to 1/2000 moderately fast subjects, 1/8000 for birds or planes with high ISO. https://en.wikipedia.org/wiki/Shutter_speed
- Rule of thirds: first written by John Thomas Smith in 1797; align eyes with a horizontal line; leave room in front of a moving subject. A 2014 study found high-quality images often do not conform to it more than others, so the rule "seems to play only a minor, if any, role". Use it as a bonus, not a law. https://en.wikipedia.org/wiki/Rule_of_thirds
- Decisive moment: Cartier-Bresson's term (from the title of the English edition of *Images a la sauvette*, 1952) for the instant inside a movement when the elements reach balance and the event's meaning and form coincide. https://fotoroom.co/decisive-moment-henri-cartier-bresson/ (via search summary).

---

## D. Synthesis: techniques the game could adopt

Constraints applied: plain names until finalized; no HUD meters or narration; world marks carry no words; a tag or the lens's readout may carry words, shown only at the lock-on or in the Veritome's raised lens (glossary: tag, familiarity); base rules unchanged, changes arrive as modifiers with a visible source (CLAUDE.md design laws); every number has two avenues or more.

Names used below are plain: "alert distance", "flight distance", "scent". None coins lore.

**1. Three awareness stages with decay that lengthens by stage (Mark of the Ninja; Dark Mod).**
Keep `AWARE.SUSPECT`/`ALERT` and add a third step so a creature can be Calm, Wary (the "?"), Alerted (the "!"). Use the Dark Mod's shape, not its numbers: thresholds that widen (1.5, 6, 10, 18, 23) and forget-times that lengthen (about 5, 8, 25, 65 s). https://wiki.thedarkmod.com/index.php/AI_stats. Temperament (grain) scales both: a timid Figment's thresholds are low and its memory long.
Show it with the body: wary = head up and still, calm = its ordinary idle, alerted = turns away. The existing "?" and "!" glyph pops (`vfx/glyphs.js`) stay as the world mark (no words).

**2. Fill rate is the product of distance, conspicuity, speed and light, with a glimpse rule (Dark Mod; Mark of the Ninja).**
The AI already builds awareness "faster the nearer, the more central, the more conspicuous". Add the Dark Mod's two ideas: a flat probability out to a clamp distance, then a linear fall to zero (https://wiki.thedarkmod.com/index.php/Visual_scan), and a forgiving edge-of-cone glimpse that makes it curious, not alarmed (https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules). Light is the weather and the hour: dusk and night shrink the sight radius, a feeling's weather changes what a given Figment sees.

**3. Three rings round every creature: alert distance, flight distance, critical distance (Hediger).**
https://en.wikipedia.org/wiki/Flight_zone. Alert distance is longer than flight distance (head up, behaviour pauses); flight distance is where it leaves; critical distance is where a cornered one turns on you. Scale them by species (larger = more tolerant, 75 studies, 212 species), by temperament, by distance to refuge (strongest factor, r = 0.43: https://pmc.ncbi.nlm.nih.gov/articles/PMC1559976), and by the approach: faster and more direct raises them, bypassing lowers them by about a third. Ring sizes can be shown to the lens-user only: in the raised Veritome lens a faint ring on the ground (a world mark, no words), the tag giving the species' alert distance in metres once familiarity allows. The teaching is real: the player learns "it stops feeding when I am at its alert distance, I back off".

**4. A visible vigilance cycle: head up and head down (starling gaze study; stalking custom).**
Every grazer-like Figment alternates feeding and scanning on a period set by grain. While its head is down (or its attention is on its behaviour), awareness builds at a fraction of the normal rate; while it scans, it is full. The player learns to move on head-down and freeze on head-up with no words. Sources: https://pmc.ncbi.nlm.nih.gov/articles/PMC2587789 (looking away let the birds feed sooner and faster) and the stalking accounts above. This is also the best natural source of "decisive moment" timing (see 9).

**5. Gaze and facing as a second cone inside the sight cone (Desperados' two-zone cone; Stankowich and Coss).**
Inside the sight cone, a narrower "facing" cone where a direct look at the creature counts for more. Desperados' dashed zone (a crouched character evades) is the same idea for posture: the cone's near and far thirds differ. https://en.wikipedia.org/wiki/Desperados_III. The ethology for gaze is weaker than the game hype, so make it a modest weight and let species vary (house sparrows did not respond: https://pmc.ncbi.nlm.nih.gov/articles/PMC2587789).

**6. Lachryma signature as the game's "scent", carried by the weather's wind (RDR2; theHunter; thermals).**
`scent` is already a reserved stimulus kind. The Courier's own signature (pool held, agitation, the draught on them) is what drifts downwind; a creature that senses Lachryma notices it before it sees them. Mask it with a source that is visible in the world: standing in the same feeling's weather, paint or crude, or a mantle-like knack. Lure it with the right feeling. Sources: https://www.rdr2.org/guides/red-dead-redemption-2-hunting-guide/ (downwind, cover scent), https://steamcommunity.com/app/518790/discussions/0/4138313123970008035 (a scent cone, player report). Show it diegetically: the drifting motes already in the weather's gusts (glossary: gusts) lean one way; the creature's own nose or crest tracks the plume. Wind direction becomes learnable by watching dust, not a compass. Keep the Courier's own plume invisible to the player except through the lens (a tag in the raised lens, then a faint streak on the ground).

**7. Noise relative to ambient, and drawn as ripples (Splinter Cell; Mark of the Ninja; Thief surfaces).**
The existing `noise` stimulus has a radius. Make the Courier's footstep radius depend on the surface (the game already has `STEP` surfaces: sand, clay, stone, grate, metal...) and on speed (crouch quiet, walk a little, sprint a lot), then subtract ambient (rain, wind, surf: weather). Show it on the ground as a ripple or dust ring at each step (world mark) that grows only when they are loud, which is exactly Mark of the Ninja's ring. https://giantbomb.com/wiki/Concepts/Sound_Meter and https://gamedeveloper.com/design/-i-mark-of-the-ninja-i-s-five-stealth-design-rules. Do not add a meter; the ring is the meter.

**8. Habituation and hides: wariness is learned, both ways (Hediger; meta-analysis; WildSafeBC).**
Harmless repeated presence shortens flight distance (habituation: parks and urban birds); being startled or approached repeatedly in one visit raises it (repeated approaches r = 0.47; prior experience about 38% more risk). https://pmc.ncbi.nlm.nih.gov/articles/PMC1559976. A "hide" is any spot where the Courier sits still and low for long enough (a bench, a dune lee, a hollow); time there lowers the local creatures' alert and brings out relaxed behaviours. Note that real ethics forbid baiting for this reason (it breeds dependence: https://wildsafebc.com/resources/photography-ethics/), so in the game a lure is a one-off draw with a visible cost (a spent bauble), while patience is free.

**9. Two readouts for a photo: how rare was the behaviour, how good was the picture (New Pokemon Snap).**
Keep stars (1 to 4) for behaviour rarity, independent of points; keep a composition score from pose, size, facing, placement, other creatures in shot, background. https://outsidergaming.com/new-pokemon-snap-how-to-get-maximum-points-and-each-star-grade-for-your-photos/. The Veritome's plate already holds a creature and a habit line; the stars attach to the habit (a creature doing its rarest behaviour). The composition score teaches real craft: facing the camera, filling the frame without cropping, centring weighed lightly (the thirds rule is weakly supported: https://en.wikipedia.org/wiki/Rule_of_thirds), leading room in front of a moving subject, golden-hour light (https://en.wikipedia.org/wiki/Golden_hour_(photography)), and a sharp plate: a moving Figment blurs unless the plate is quick or the Courier is steady (handheld reciprocal rule: https://en.wikipedia.org/wiki/Shutter_speed). The grade shown on the plate is the lens's tag, so words are allowed there.

**10. Coax rare behaviours with conditions, not only items (New Pokemon Snap; Bugsnax; Pokemon Snap).**
Rare behaviour is gated by a visible condition: hour (night variants: https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap), weather (the seven feelings), a lure (the right feeling of Lachryma dropped, Bugsnax-style sauces: https://www.pcgamer.com/bugsnax-guide/), a sound (a note on the Crucibelle is New Snap's melody and Snap's flute: https://en.wikipedia.org/wiki/Pok%C3%A9mon_Snap), another species nearby (Bunger lured into another: same PC Gamer page), or a state of the creature (asleep, glowing). The lens's scan should reveal that a trace exists and when it is active (Bugsnax' traces), never how to trigger it; the request card hints, as in Snap's requests, but is vague by design so players experiment. https://en.wikipedia.org/wiki/New_Pok%C3%A9mon_Snap notes that poorly explained requests became trial and error, so tie the hint to a visible clue.

**11. The decisive moment is the peak of a telegraph (Fatal Frame; Cartier-Bresson).**
Score the plate by how close the shutter fell to a behaviour's apex: the instant before it leaps, sings or startles, like Fatal Frame's shot "just before a ghost's attack lands". https://en.wikipedia.org/wiki/Fatal_Frame. Rarer apexes sit closer to the point where it would bolt, which gives the safari its risk and teaches Cartier-Bresson's lesson without naming it. Hold-to-focus (the capture circle filling while the subject stays inside it) rewards steadiness and puts a time cost on the shot that the alert cycle can spoil.

**12. A spooked creature moves through phases, not a binary (Metal Gear's Alert, Evasion, Caution; Dark Mod timers).**
After an alert: the creature flees (Alert), stays hidden watching the last-seen spot (Evasion), then drifts back wary (Caution), each with a countdown, and returns to calm after a game hour. https://giantbomb.com/wiki/Games/Metal_Gear_Solid_3_Snake_Eater. Mark of the Ninja's "ghost" of your last known place becomes the creature's memory of where you were (the AI already acts on memory, not on the world). Failure is cheap: no permanent loss, because the project's law is "skill skips grind, grind closes the gap".

**13. The ghillie rule: a stealth knack that has a bound and breaks on action (Monster Hunter).**
A knack, earned by achievement and optional, that lets you pass unnoticed for a bounded time (the Monster Hunter mantle is 120 s with a 300 s cooldown, and ends if you attack or are hit; holding still extends it: https://samurai-gamers.com/monsterhunterworld/ghillie-mantle-stats-and-effects/). The core movement is untouched; the knack is a modifier whose source you can see (a cloak of dust or the draught's colour) and ends when the lens is raised and the shutter pressed, or on a loud step. Keep it from becoming a skip: it should still not work in a creature's critical distance.

**14. The animal never cheats; a director only paces (Alien: Isolation).**
`docs/AI.md` already says "a mind acts on memory, never on the world"; keep it. For the safari, a light director (an ecology offer, not a creature's own list) can offer something rare when the Courier has been patient and quiet for a while: a drift of the right creature into view at the right hour. https://www.gamedeveloper.com/design/the-perfect-organism-the-ai-of-alien-isolation (via search summary).

**15. Ethics as a mechanic: harassed Figments give worse photographs (WildSafeBC; Pokemon Snap's Pester Ball in reverse).**
The Pester Ball and Fluffruit provoke to get a pose. In a game where agitation (EmO) already has an optimal band for yield, make a harassed Figment's behaviours the panicked, low-star ones, and a calm one's the natural, high-star ones. "If the animal moves away, you are too close" (https://wildsafebc.com/resources/photography-ethics/) is the whole lesson. That follows the project's rule that the mechanic is the lesson and is never a tutorial.

### How awareness shows without a HUD (project rules: world marks carry no words; tags only at the lock-on or raised lens)

| What it conveys | Diegetic carrier | Existing hook |
| --- | --- | --- |
| Calm / wary / alerted | Posture: head down and idle, head up and still, turned away or crouched; the "?" and "!" glyph pops | `AWARE.SUSPECT`, `AWARE.ALERT`, `vfx/glyphs.js` |
| Where it is looking | A visible gaze: head and eye orientation; a faint cone on the ground only in the lens | `Senses` fov, lens frame |
| How near its limit you are | It stops its behaviour at alert distance; flight distance ring on the ground in the lens | new ring, a world mark |
| How loud you are | Ripples or dust rings at each footfall, bigger when loud, shrinking in rain and wind | `noise` stimulus radius |
| Your scent / signature | Motes in the weather's gusts leaning toward it; its nose or crest turning into the plume | `scent` stimulus (reserved), `core/signatures.js` |
| Its agitation | Body tell (temper), aura, particles; the number only in the tag | EmO, temper |
| How rare its behaviour is | Stars on the tag in the raised lens after a first plate; a glint on the body for a four-star pose | Veritome plate, familiarity |
| That it remembers you | It looks toward where you were last, not where you are | memory facts |

---

## What I could not verify

- Exact Pokemon Snap (N64) point tables, and the New Pokemon Snap caps (fan estimates disagree); official numbers are not published in anything I reached.
- Exact Metal Gear Solid alert, evasion and caution timer lengths; Splinter Cell Blacklist and Alien: Isolation numbers (the Game AI Pro 2 chapter 28 and the GDC talks were not reachable).
- Breath of the Wild, RDR2, theHunter and Ghost of Tsushima do not publish detection numbers; theHunter's figures here are player reports.
- The measured FID effect of crouching, camera raising or flash on birds (the Deakin paper's results were not retrievable); the head-down, head-up stalking rule is described in accounts but not in a single authoritative source.
- Several pages (PC Gamer, Fandom, Bulbapedia, Metal Gear Wiki, Serebii pages beyond a snippet) refused a direct fetch; items marked "via search summary" were read from the search tool's summary of that page, not the page itself.
