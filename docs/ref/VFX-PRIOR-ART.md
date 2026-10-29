# VFX prior art: the obscure Square catalogue, the craft of layers, and our fourteen (Calissa's reference brief, 2026-10-29)

South asked for the VFX library refreshed and a new one built for the seven domains, the seven feelings and the 76 class arts, "paying close
attention to the obscure Square Enix catalogue", in layers (primary, secondary, tertiary; gradient transparency; UV scrolling). This is the
prior art behind `docs/plans/art/VFX-LIBRARY.md`. A reference, not code. Credit is a museum label: game, studio, year; what was read, where.

How to read: a bullet is one observation, its source URL, and **Take:** the one thing to steal. "Second-hand" means the page itself would not open and
the line comes from a search excerpt of it. Nothing here is from memory: a detail I could not verify is left out.

## 0. Limits, said first, and the ten strongest takes

- **Not reached:** footage (no video was watched), GDC Vault (login wall), Riot's original PDF (redirects; read through a slide-by-slide summary), the Guilty Gear
  Xrd handout (host reset), Hardcore Gaming 101 (maintenance), Fandom, StrategyWiki, The Cutting Room Floor (403). So for most PlayStation titles what is
  verifiable in text is how a system *shows itself* (gauges, colours, domes, timing cues); the particle-level look is not. Where a game gave only mechanics
  the bullet says so and the Take is about structure. Section 5 lists what to watch.
- **Left out for lack of anything checkable:** Ehrgeiz, Tobal, The Bouncer, Bushido Blade, Code Age Commanders, Romancing SaGa: Minstrel Song, Live A Live,
  Radiata Stories' effects, Drakengard 1 and 2, Lord of Vermilion's looks, Front Mission's effects.
- **The ten:** (1) Chrono Cross: a character's colour is the colour of their weapon trail; a three-slot strip of recent colours is the weather of a fight.
  (2) Vagrant Story: a wire dome on the target, sized by reach; the timing cue an optional mark over the body; at most three spells riding you at once.
  (3) Treasure of the Rudras: a spell's look follows its root word and modifiers add marks. (4) FFXII: target lines coloured by kind of action; cost, level and
  spectacle rise together. (5) Takai (FFVII Remake VFX director): a heal is energy gathered, made visible, absorbed, then glowing. (6) Ishii (FFXIV): one base colour a
  job, and a text spec before any art. (7) Diablo III's bubbles: textures multiplied, one texture instanced with different offset, speed and scale. (8) Battlefront II and
  Divinity 2: a fire layer on a smoke layer; alpha erosion plus noise-warped UVs plus a little Fresnel. (9) Riot: importance by size, saturation and opacity; an outro is a
  secondary; readability beats theme. (10) Hit stop: 8 frames at 15 % in Smash Melee, capped at 20; a 0.1 s hit frame; Sakurai's ceiling on it.

## 1. The Square Enix catalogue, game by game

### 1.1 Chrono Cross (Square, 1999; art direction Yasuyuki Honne, characters Nobuteru Yuuki)
- Six colours in three opposed pairs, each colour *two* things: Red fire/magma against Blue water/ice, Green wind/flora against Yellow earth/lightning, White light/cosmos
  against Black darkness/gravity; Elements sit on a per-character grid in eight rank tiers. https://www.cbr.com/stamina-element-battle-system-guide-chrono-cross/ and https://en.wikipedia.org/wiki/Chrono_Cross
  **Take:** one ramp may carry two sibling forms (a feeling's burst and its aura); opposites sit across the wheel.
- A character's or enemy's innate colour is read two ways: the info pane, or "the colored trail left by an enemy's weapon during a standard attack". https://www.cbr.com/stamina-element-battle-system-guide-chrono-cross/
  **Take:** identity rides the swing trail, the cheapest and most seen layer; a class's suit colour goes on the trail of every art it owns, with no label.
- The Field Effect: three slots top-left; each element used enters the right slot and pushes the left out; each matching slot +12.5 % power, each opposing slot -12.5 % (cap -33.5 %); three of one colour opens summons.
  https://www.gamerguides.com/chrono-cross-the-radical-dreamers-edition/guide/how-to-play/battle-system/how-the-field-effect-works
  **Take:** a three-bead history strip is how a mixture reads at a glance (our agate and draught); a strip full of one feeling unlocks the heavy look.
- Elements were designed from the final battle backwards (a specific sequence ends the game); Tanaka likened them to card games; every battle motion was keyed by hand and jokes were put in the techniques to
  distance it from Final Fantasy. https://en.wikipedia.org/wiki/Chrono_Cross  **Take:** one comic beat in a Mirth art (a wink glyph) costs little and makes a family distinct.

### 1.2 Vagrant Story (Square, 2000; director Yasumi Matsuno, art director Hiroshi Minagawa, Akihiko Yoshida)
- Drawing the weapon pauses the action; "a grid-like sphere appears around the character"; body parts are targeted; magic that hits many uses a small sphere placed inside that wire frame.
  https://www.oldgamehermit.com/2024/04/review-vagrant-story/ and https://en.wikipedia.org/wiki/Vagrant_Story  A fan guide adds that the dome's size varies with weapon range and the readout is Damage/Success on the
  bottom line, e.g. 23/98 % at the head, 2/41 % at an armoured body. https://chode.org/misc/vs/  **Take:** Divination's lens is a wire dome whose radius is the reach; pin the numbers at the part, not at the screen's foot.
- Chain Abilities are button presses "in timely succession" ("resembles a rhythm game"); an optional Timing Display puts an exclamation mark over Ashley's head when the next press is due (press on it, not before).
  https://en.wikipedia.org/wiki/Vagrant_Story and https://chode.org/misc/vs/  **Take:** the cue is a mark on the body, optional (a knack), and it opens on the impact frame, not the wind-up.
- Break Arts trade HP for damage and add no Risk; Risk rises with each attack (less accuracy and defence, more crits); magic cannot be chained. https://en.wikipedia.org/wiki/Vagrant_Story
  **Take:** Fury is a heat that builds and costs: a visible count (cracks on the arm or blade) that a Break-Art-like art pays down in one go.
- Fusions and Guards: one spell on the weapon and two on yourself, three at most, a new cast overriding earlier ones. https://chode.org/misc/vs/  **Take:** a modifier you can see: the spell's ramp ringing the blade; cap the rings at three.
- Combining weapon and armour merges their affinities and can lose one to gain another. https://en.wikipedia.org/wiki/Vagrant_Story  **Take:** Alteration shows a trade, not a gain: one ramp thins as another rises.
- Plot: Kildean letterings carved across the city's walls; the city *is* the Gran Grimoire. https://en.wikipedia.org/wiki/Vagrant_Story  **Take:** Spellscription as architecture: script cut into the ground a ward stands on.
- Texture designer Tsutomu Mouri: areas kept "quite dark and dim" for the ruin quality, against brighter scenery for contrast; programmer Taku Murata: more spell and skill effects were planned and cut for memory.
  https://shmuplations.com/vagrantstory/  **Take:** Dread needs one bright source to be read at all; fewer, bigger spell reads beat many small ones.
- Matsuno earlier, on Tactics Ogre (Quest, 1995): early RPGs described spells and attacks "with text only", "I think it's better to show things"; he wanted a game where someone watching over your shoulder says "wow, that
  looks cool"; per-weapon battle sprites delayed it almost a year. https://shmuplations.com/tacticsogre/  **Take:** the readout is the effect; count the animation a family needs before promising the family.

### 1.3 Treasure of the Rudras (Square Osaka, 1996; director Kouji Ide)
- Spells are typed words of up to six katakana: a prefix, an elemental core, a suffix; each element has root patterns (tou makes lightning, aqu water); prefixes and suffixes change power, cost, status or range; a spell an enemy
  casts can be written down and learned. Eight elements, six in opposed pairs; earth and void "have no strengths or weaknesses". Built from the Japanese pleasure in word-play (kotodama). https://en.wikipedia.org/wiki/Treasure_of_the_Rudras
  **Take:** our neuralese roots can pick the motif and its modifiers add small marks round the core glyph, so a sign is readable by its root; void, the element with no opposite, is the natural look for the domain LORE.md calls "neutral".
- Development: battle planner Masahiro Kataoka proposed that players trade discovered words with friends; monster designer Yuichirou Kojima animated the enemy sprites (still pictures in most Square RPGs) to answer the rise of 3D.
  https://en.wikipedia.org/wiki/Treasure_of_the_Rudras  **Take:** a sign is shareable as plain text (as our made tracks are, by share code); an idle that moves makes a flat thing alive without polygons.

### 1.4 Parasite Eve (Square, 1998) and Parasite Eve II (Square, 1999)
- PE1: pausable real-time ATB; choosing to attack pauses and "a dome/sphere symbolizing the range of the weapon appears" for targeting; Parasite Energy refills during battle but "the more players use it, the slower it refills".
  https://en.wikipedia.org/wiki/Parasite_Eve_(video_game)  **Take:** show range as a dome before the cost is paid; draw a power's regen ring thinning with use.
- PE1 out of battle: "tune-up" picks a weapon to alter and a weapon to take attributes or effects from (an effect such as "acid" moves across). https://en.wikipedia.org/wiki/Parasite_Eve_(video_game)  **Take:** Alteration as a visible transfer from a source to a target.
- PE2: abilities in four elements (fire offence, water health, wind status, earth damage stats), three abilities each, three levels each, "level 3 being the most powerful and costing the least MP". https://en.wikipedia.org/wiki/Parasite_Eve_II
  **Take:** a family of 3 x 3 with the top rung cheapest is our accent (x1.25 size, x0.8 cost) told in pips.
- PE2 is survival horror: tank controls, one fixed view a room, no range dome. https://en.wikipedia.org/wiki/Parasite_Eve_II  **Take:** for Dread, take control away a little (a slower turn rate) rather than only adding fog.

### 1.5 Xenogears (Square, 1998)
- Deathblows are learned by repeating specific proportions of strong, moderate and weak hits; AP costs 1, 2 or 3 by intensity; all magic is "Ether", but Fei's is called Chi and Citan's Arcane. https://en.wikipedia.org/wiki/Xenogears
  **Take:** weak, medium and strong are three sizes of one shape; one substrate with per-person names is the class arts under one base.
- In gears a deathblow needs an "Attack Level", a number at the bottom left raised by strong, moderate and weak attacks, one deathblow per point; past level 3 an "infinite" level has deathblows of its own. In the early plan gears were "traditional summoned monsters".
  https://en.wikipedia.org/wiki/Xenogears  **Take:** a level you can read and spend, with a last rung that looks different in kind (our King and World arts).

### 1.6 Valkyrie Profile (tri-Ace / Enix, 1999)
- Each party member is a button; combos fill a Hit Gauge; at 100 % a member of the combo may use Purify Weird Soul; Charge Time replaces MP; Great Magic (all enemies) needs certain scepters, which can break; Lenneth's Purify Weird Soul
  changes with the weapon she holds. https://en.wikipedia.org/wiki/Valkyrie_Profile_(video_game)  **Take:** a gauge filled by the quality of a chain, spent on one large art whose shape depends on the tool in hand (our pair specials).
- In the English release Lezard's teleportation circle was changed "from a pink pentagram to a purple circle" (the PSP port's English version keeps it). https://en.wikipedia.org/wiki/Valkyrie_Profile_(video_game)
  **Take:** the figure inside a circle carries its register (an occult pentagram or a plain ring): Ouranurgy's portal ring and Spellscription's seal should differ by figure before they differ by colour.

### 1.7 Secret of Mana (Square, 1993) and Legend of Mana (Square, 1999; director Koichi Ishii, battle chief Hiroshi Takai)
- Secret of Mana: Ishii organised magic as four elements "but what gave them all shape in our world was mana"; Tanaka on the ring menu: you "don't have to switch screens to access everything", visually easy to follow. https://shmuplations.com/secretofmana/
  **Take:** one substrate under every element (our Lachryma) and a menu drawn round the body (our cylinder and desk).
- Legend of Mana: Takai had "the battle system and the effects for special moves"; Matsumoto wanted a "more colorful and cheerful touch" and monster animation "on par with Capcom's fighting games"; hand-drawn sprites were chosen because
  polygons would not make the characters feel alive. https://shmuplations.com/legendofmana/  **Take:** Mirth is colour plus squash and stretch on the small parts (chips, dots), not more particles.
- Special Techs per weapon fill from a meter as the player damages enemies; Land Make: each Land is ranked 0 to 3 in each Spirit of Mana by the artifact, its position and the neighbouring Lands. https://en.wikipedia.org/wiki/Legend_of_Mana
  **Take:** a made thing wears 0 to 3 pips of its sources; a special meter is a ring that fills round the weapon.

### 1.8 Brave Fencer Musashi (Square, 1998) and Threads of Fate (Square, 1999)
- Musashi: the sword Fusion chains combos and absorbs "Bincho energy" (a magical-point system) or an enemy's skill; five Scrolls enhance Lumina. https://en.wikipedia.org/wiki/Brave_Fencer_Musashi
  **Take:** absorbing is the anticipation (a pull-in), and the sword then wears the borrowed ramp until spent.
- Threads of Fate: Rue collects up to five monster coins and transforms into them; Mint's rings are melee and projectile and she combines spells with complementary elements; HP and MP rise by use, not experience. https://en.wikipedia.org/wiki/Threads_of_Fate
  **Take:** Possession as a silhouette swap with a visible token (a coin) per host; complementary elements pair into one effect.

### 1.9 Final Fantasy Crystal Chronicles (Square Enix, 2003)
- A poisonous Miasma clouds the world; a village's crystal protects it. https://en.wikipedia.org/wiki/Final_Fantasy_Crystal_Chronicles  **Take:** Gall is a hazard held off by something carried (our held stretch).
- Fusion: two of one spell are the second rung, three the third (Fire x2 Fira, x3 Firaga); an element then Life is Holy; Life then an element is Slow; Life plus two Cure is Haste. https://samurai-gamers.com/final-fantasy-crystal-chronicles-remastered-edition/spell-combinations-list/
  **Take:** repeat = a bigger rung of the same family; mixed = an off-family result; a Transmute can blend its two inputs' ramps along the band.

### 1.10 Final Fantasy XII (Square Enix, 2006)
- When an actor begins an action "target lines connect characters to other party members or enemies; different colors represent the different types of action". https://en.wikipedia.org/wiki/Final_Fantasy_XII
  **Take:** Read and the Figment attack telegraph: a line from the actor to its mark, its colour the kind of act.
- Quickenings chain by timed presses ("you only have four seconds", clock paused while commands run); levels cost 1, 2 or 3 Mist Charges; usable ones in white, unusable grey, cost as orange blocks; a long enough chain ends in a Concurrence.
  https://www.rpgsite.net/feature/5794-final-fantasy-xii-the-zodiac-age-quickenings-mist-charges-concurrences-explained  **Take:** cost, level and spectacle rise together, one layer more a rung; the last link of a chain is the biggest.
- Gambits: a target, an action and a priority per character, player orders always on top. https://en.wikipedia.org/wiki/Final_Fantasy_XII  **Take:** riding a mind (West) drawn as a short line of conditions on the host.
- GDC postmortem (Murata, Minagawa, Tsuchida): Effect-Chan, a particle editor for time-based effects (hits, magic, dust) that also set camera, sound and vibration; ZEEK3, a 2D animation-pattern editor; Model-San; all previewed on the target hardware.
  https://www.gamedeveloper.com/game-platforms/gdc-square-enix-gives-rare-technical-glimpse-at-i-final-fantasy-xii-i-  **Take:** our names-in-code, looks-in-data library is the same shape; keep a preview on the phone.

### 1.11 Final Fantasy X (Square, 2001) and IX (Square, 2000)
- X: a timeline along the upper right lists who acts next and how an action reorders it; Aeons replace the party while they last. https://en.wikipedia.org/wiki/Final_Fantasy_X  **Take:** slowed or stopped time shown as that strip sliding.
- IX: Trance starts when a character has taken a set amount of damage; commands change ("Black Magic" becomes "Double Black"); the Mist "stimulates the fighting instinct". https://en.wikipedia.org/wiki/Final_Fantasy_IX
  **Take:** Fury changes the verb, not just the number; a weather that makes people angry is the same idea as Fury's weather.

### 1.12 Kingdom Hearts: Chain of Memories (Jupiter / Square Enix, 2004)
- Cards 0 to 9; three cards combine into a combo whose rank is their sum; certain sets make a "sleight" (a strong blow, a spell or a summon); the first card used becomes unusable until the fight ends. https://en.wikipedia.org/wiki/Kingdom_Hearts:_Chain_of_Memories
  **Take:** a combination as three small marks that resolve into one larger shape (Encore, the pair specials).
- Map cards are coloured by what they change: red the number and type of enemies, green the power of the deck, blue the room's properties (treasure, save points). https://en.wikipedia.org/wiki/Kingdom_Hearts:_Chain_of_Memories
  **Take:** colour by *what a thing changes* is a third coding beside element and suit; use it only where a mark must say what it will touch.

### 1.13 The World Ends with You (Jupiter / Square Enix, 2007)
- Pins are worn; each district has trends, and clothes or pins of the popular brand improve effects, the least fashionable weaken them; pins evolve; background director Takayuki Ohdachi designed the psych pins "mixing pop art and tribal designs"; the
  partners pass a light puck between them (a holder cannot be attacked). https://en.wikipedia.org/wiki/The_World_Ends_with_You
  **Take:** the puck is the Possession token handed between host and rider; a brand is a family told by one motif.
- Second-hand (fan wiki, via search excerpt): each brand shows part of its logo in every pin, "often as something resembling a watermark". https://twewy.fandom.com/wiki/Jupiter_of_the_Monkey and https://twewy.fandom.com/wiki/Mus_Rattus
  **Take:** a suit's mark as a watermark on every art's shape.

### 1.14 NieR (Cavia / Square Enix, 2010) and Final Fantasy Type-0 (Square Enix, 2011)
- NieR: magic uses a regenerating energy; spells include projectiles and "large shadowy fists"; Dark Lance is "a large magical beam that shoots forward like spear", "up to 8 spears", and the only power aimed with crosshairs.
  https://en.wikipedia.org/wiki/Nier_(video_game) and https://nierreplicant.wiki.fextralife.com/Dark+Lance  **Take:** Psychokinesis scales by count *or* by reach; one verb gets its own aim mark.
- Type-0: Phantoma drops are coloured by what they refill; magic skills sort into five groups named for guns ("Rifle" fires in a line, "Missile" homes). https://en.wikipedia.org/wiki/Final_Fantasy_Type-0
  **Take:** name a shape by a trajectory word in plain genre language (CLARITY) and colour a drop by what it refills.

### 1.15 Three games that put greed on a gauge
- Einhänder (Square, 1997): a manipulator arm takes gunpods from wrecks and holds them overhead or below the belly; the score multiplier bar *flashes* past a threshold for big bonuses; IGN says FFVII's effects were reused. https://en.wikipedia.org/wiki/Einh%C3%A4nder
  **Take:** a held thing has two stances with two marks; a bar that begins to flash is Desire at its brightest.
- Unlimited Saga (Square, 2002): a Reel's chosen icon decides a move's type and power; "Hold" chains actions, which an enemy's phase can break. https://en.wikipedia.org/wiki/Unlimited_Saga  **Take:** a reel as the face of a want (Raku's slot reels, the wheel of odds).
- Star Ocean: Till the End of Time (tri-Ace / Enix, 2003): the Bonus Battle Gauge fills as you strike and pays out until a critical hit taken, a flee or a death empties it; symbology is runes and crests *tattooed onto flesh*.
  https://en.wikipedia.org/wiki/Star_Ocean:_Till_the_End_of_Time  The team: an "excitement" gauge, reset on reload so the tension holds; the elements are earth, water, fire, wind and void (light and darkness only in the lore);
  "if there's too many special effects onscreen, the game will still slow down". https://shmuplations.com/starocean3/  **Take:** a streak lost all at once; script written on the body (our band of script at chest height); void as the neutral fifth.

### 1.16 Bahamut Lagoon (Square, 1996), Terranigma (Quintet / Enix, 1995), Sigma Harmonics (Think Garage / Square Enix, 2008)
- Bahamut Lagoon: the setting came from Sasaki's memory of flying over the Izu Peninsula, to make floating lagoons. https://en.wikipedia.org/wiki/Bahamut_Lagoon  **Take:** Wonder is a vantage: height and distance first, particles after.
- Terranigma: no MP; Magirocks become magic rings and summon medals and after a cast turn back into Magirocks. https://en.wikipedia.org/wiki/Terranigma  The interview page's caption on the revival scenes: CG-rendered graphics joined with "palette cycling and
  mode-7 background scaling"; director Miyazaki: they used "technology that is actually used in creating TV weather broadcasts". https://shmuplations.com/terranigma/  **Take:** a creation crumbles into the grains it rose from; a ramp walked through time (palette cycling) is the oldest gradient scroll.
- Sigma Harmonics: Superdeduction is clue medals set on a grid of black nodes; Sigma sways reality by song; Neon fights by divine possession using three cards, each with a cardinal direction. https://en.wikipedia.org/wiki/Sigma_Harmonics
  **Take:** a lattice that lights node by node as a sight (Strata, survey).

### 1.17 Dragon Quest (Enix / Square Enix, 1986 on)
- A family is a name with rungs: Frizz, Frizzle, Kafrizz, Kafrizzle (four rungs in later games); Sizz is the group version, with a 30 % bonus on a single target, while Frizz hits one for more. https://dragon-quest.org/wiki/Kafrizz  **Take:** a family = a shape x a scope x a rung; name and mark both say so.
- Second-hand (search excerpts of the wiki): the Zoom family teleports (Zoom to a place, Bazoom removes enemies from battle, Zip to allies). https://dragon-quest.org/wiki/Bazoom and https://dragon-quest.org/wiki/Zip
  **Take:** one verb, three destinations: the far end's ramp, not a new effect, says which.

### 1.18 Square Enix's VFX artists, in their words
- Takayasu Ishii (FFXIV VFX artist): designers give a text spec (attack or heal, single target or area) and artists have "free rein over the imagery" inside that purpose; Reaper has its own base colour (black and cyan), Sage white and blue, bright greens are
  "common for healer jobs"; Reaper stresses the *trail* over the hit; weapon effects are always on screen so they "have stricter limitations". https://na.finalfantasyxiv.com/blog/003308.html
  **Take:** a class art = a one-line spec + the suit's base colour + one signature element; hold always-on marks to a stricter budget than one-shots.
- Shintaro Takai (VFX director, FFVII Remake; made summons for the 1997 FFVII), CGWorld 2018 (Japanese, machine-translated): an effect needs a reason; Cure is not sparkles but "invisible energy floats around the character, is gathered and made visible,
  then absorbed into the body and emits light"; FFVII's Knights of the Round ran long ("reflection points"). https://cgworld.jp/interview/201804-sqex-ffvii.html  **Take:** anticipation is a pull-in; keep summons short.
- CGWorld 2020 (Takai, Mizuki Tsunoda, Mitsuharu Yoshida): effects built from real phenomena and tuned like physical light; Houdini flipbooks 8 x 8 (64 frames) with emissive, opacity, normal and occlusion channels, emissive driving glow; luminance split from
  colour as its own parameter; summons given emissive surface glow to read apart from monsters; Cloud's limit break raises a kanji in step with each of its three slashes. https://cgworld.jp/feature/202012-ffvll-03.html
  **Take:** a glyph on the beat for a three-hit art; make value its own knob apart from hue (our ramp's skin).
- Hasegawa, Nozoe, Ono, Koyama, Ishida, "Visual Effects of Final Fantasy XV" (SIGGRAPH 2016): "a Fantasy based on Reality ... fantasy as an extension of natural and/or physical phenomena"; procedural effects for lightning, flares and ripples because they need
  no textures, are independent of resolution, and "templates help users improve the quality"; effects respond to a changing environment (a lens flare follows the sun); a node-based editor whose groups can be used as one node.
  https://history.siggraph.org/wp-content/uploads/2022/09/2016-Talks-Hasegawa_Visual-Effects-of-Final-Fantasy-XV-Concept-Environment-and-Implementation.pdf  **Take:** our shape layer is this (procedural, no texture); a domain's grammar is a template; let effects read the weather and the hour.

## 2. The layering grammar

### 2.1 Roles
- Riot, League of Legends VFX Style Guide (2017, principal artist Jin Yang), slides 6 to 11: **primary** carries the gameplay signal (high value range, strong value or saturation contrast, clear silhouette, high opacity, strong shape, intense movement);
  **secondary** supports it (lower value range, small, blurry silhouette, low opacity, simple shape, subtle movement) and may use more hues; importance is set by size, shape, timing, value, saturation and opacity. Ladder: idle particle, defensive spell,
  basic attack, damage spell, game changer, ultimate. https://www.slideshare.net/slideshow/vfx_style_guide-aaaaaaaaaaaaaaaaaaaa-pdf/272115497 (original: https://realtimevfx.com/t/official-league-of-legends-vfx-style-guide/3392)
- Same source: avoid 100 % and 0 % in value or saturation; two complementary hues mean one must be secondary; paint textures by hand, concise, soft and sharp mixed, no photographic noise (slides 13, 19 to 30).
- **The same three words are also a ranking of reads.** Riot (senior VFX artist "Sirhaian", Skins team): primary is gameplay (does it read as the right spell, is the hitbox honest), secondary is readability and a spell's visual power level, tertiary is thematic
  resonance, and "gameplay readability will always prevail over thematic resonance". https://www.leagueoflegends.com/en-us/news/dev/dev-behind-the-scenes-of-vfx-updates/ Blizzard, Diablo IV (Daniel Briggs, lead VFX artist, Dec 2021): "balance the primary, secondary,
  and tertiary reads"; "we reserve visually loud FX for powerful skills, like ultimate abilities". https://news.blizzard.com/en-us/article/23746639/diablo-iv-quarterly-updatedecember-2021
  **Take:** a feeling's skin is the tertiary read: it may colour and move every layer but must never blur the domain's silhouette (the primary).
- **Tertiary as a layer** is the ambient one: the ordinary split is the core, the dome and ring, then sparks and smoke, each its own layer drawn first in black and white. Tutorial-level authority only.
  https://skillsupschool.com/tutorials/vzryvnoj-tutorial-poshagovo-risuem-vfx
- Kevin Leroy, a Riot VFX artist, on his own League-style fan work in Unity (80.lv, 27 Sept 2017): a projectile is a cast, the projectile and a hit; the hot point is "the most important" and should match the hitbox; the trail says where it came from; a shadow
  behind the glow gives it range; textures stay black and white and are tinted in the engine. https://80.lv/articles/constructing-vfx-worthy-of-league-of-legends
- Battlefront II (Simon Trumpler's reading of the files): an explosion is many particles, not one flipbook; smoke and fire are two particle layers on the same frames, the second flipbook's alpha being the emissive fire; one LUT colours both; all VFX textures share one
  12288 x 8192 atlas. https://simonschreibt.de/gat/battlefront-ii-layered-explosion/
- Divinity: Original Sin 2 burning (Trumpler, from the modding tools): the character mesh duplicated as an overlay material, stretched upward by a vertex mask, world-space mapped so the stretch does not smear the fire. https://simonschreibt.de/gat/divine-fire/

### 2.2 Timing (every number a source gave; none gives spell anticipation in seconds)
| what | number | source |
|---|---|---|
| hit frame (one artist's favourite) | 0.1 s | Leroy, 80.lv above |
| fade order after a hit | lens flare first, sparks next, bokeh dots last | Leroy |
| fade in, peak, fade out | alpha keys 0, 0.5, 0 over life | Leroy |
| hit stop, Smash Melee | floor(d/3 + 3) frames: 8 at 15 %; capped at 20 | https://www.ssbwiki.com/Hitlag |
| hit stop, Smash Ultimate | 15 frames at 15 %; capped at 30 | same |
| hit stop, how it is chosen | both sides freeze alike; more damage, longer; a ceiling because of "absurdly powerful" attacks; projectiles less | Sakurai, Famitsu vol. 490: https://sourcegaming.info/2015/11/11/thoughts-on-hitstop-sakurais-famitsu-column-vol-490-1/ |
| a chain's choice window | 4 s, clock paused while commands run | FFXII, 1.10 |
| anticipation and dissipation | "all effects" need both; an outro is a secondary (lower value, saturation, opacity); do not linger; dynamic timing over linear | Riot slides 32 to 36 |
- Ours for comparison: `hitstop` defaults to 0.06 s (about 4 frames at 60) from a bucket that refills 0.22 s a second of combat and holds 0.2 s (`BUDGETS`, `src/vfx/vfx.js`); the plan's anticipation of 0.05 to 0.25 s is Calissa's own, no source.
  Sakurai's ceiling is the lesson for the bucket.

### 2.3 Shader techniques, with one line of why
| technique | why | seen in |
|---|---|---|
| gradient ramp over value and life (a LUT) | one grey texture takes any palette (feeling, domain, suit) and a hot thing cools as it ages | Battlefront II above; https://realtimevfx.com/t/particle-gradient-mapping/1952 (lifetime on V; erosion in grey, colour last; keyframed colour "marginally cheaper"; LUTs of 256 x 1 fit the cache but cost on mobile) |
| the ramp walked through time | the oldest gradient scroll; a fixed picture comes alive | Terranigma's "palette cycling" (1.16) |
| ramp wrapped round an alpha edge | the burning rim of a dissolving thing is the ramp's hot end, no second effect | Sacred 2's map: a height map makes an alpha mask and "one small gradient texture" is wrapped round its border: https://simonschreibt.de/gat/sacred-2-burning-map/ |
| alpha erosion by threshold over life | the shape dies by its own noise, never a plain fade | `smoothstep(-s, s, noise - progress)` with progress remapped to [-s, 1]: https://heytibo.com/blog/dissolve-shader-vfx-s-bread-and-butter and https://torchinsky.me/stylized-vfx-unity-01/ |
| two UV-scrolled textures multiplied | complexity from cheap loops that never repeat | Diablo III's resource bubbles: "textures are all being multiplied together", rgb = ((t1 x t2 x 2) x t3 x 2), alpha = t1.a x t2.a x 4, the same texture each stage with its own UV offset, scroll speed and scale (Julian Love, quoted): https://simonschreibt.de/gat/diablo-3-resource-bubbles/ |
| noise-warped UVs | one flame texture lives | Divinity 2: a noise "to distort the UVs a bit to add some extra motions": https://simonschreibt.de/gat/divine-fire/ |
| Fresnel rim | the edge falls off and a flat shape reads as a volume | same page: "Add a little bit of Fresnel and it's perfect" |
| soft particles | a sprite meeting the floor gets no hard seam | NVIDIA, Tristan Lorach, Jan 2007: fade by scene depth minus sprite depth through a contrast curve: https://developer.download.nvidia.com/whitepapers/2007/SDK10/SoftParticles_hi.pdf (needs a depth read; `weather.js` already sits its cards on the ground instead) |
| procedural shape, no texture | memory-free, resolution-independent, a template lifts every user | FFXV (1.18) |
| timing packed in a texture's channels | a ring of lamps pulses out of step with one material | Sacred 2 pulse shader: R delay, G on-length, B off-length: https://simonschreibt.de/gat/sacred-2-pulse-shader/ |
| the sixth generation's blend vocabulary | light adds; dark subtracts; a faint glow is B + F/4 | PlayStation GPU: B/2 + F/2, B + F, B - F, B + F/4, chosen per polygon, and for a textured one only where the texel's own bit is set: https://psx-spx.consoledev.net/graphicsprocessingunitgpu/ |

## 3. Our fourteen
A domain is a grammar (form and motion); a feeling is a skin (palette, motif, motion character). Section numbers point back to section 1.

### 3.1 The seven domains
- **Ouranurgy** (where and when). Dragon Quest's Zoom family (1.17): one teleport word in three scopes, so one portal grammar whose far end's ramp says where. FFX's timeline (1.11): time as a strip that reorders; Hasten and Stay as a ring sliding on it.
  Bravely Default's Brave Points (4): borrow up to four actions in a turn, then wait until the debt is paid; a stopped hour's cost as a ring that refills afterward.
- **Manifestation** (thought made solid). Legend of Mana's Land Make (1.7): a made thing wears 0 to 3 pips of its sources. Terranigma's Magirocks (1.16): it crumbles into its own grains. FFVII Remake's summons (1.18): a made body glows from within, so it reads apart from the natural.
- **Divination** (seeing). Vagrant Story's combat dome (1.2) and Parasite Eve's range dome (1.4): a dome before the cost is paid, numbers at the part. FFXII's coloured target lines (1.10): Read. Sigma Harmonics' lattice (1.16): Strata lit node by node.
- **Psychokinesis** (the push and the lift). NieR (1.14): a family scales by count or by reach, with a crosshair for one verb. Einhänder's arm (1.15): the held thing has two stances. Chrono Cross Black and FFCC's Gravity (1.1, 1.9): gravity as a downward-dragging band.
- **Possession** (reaching in). Threads of Fate's coins (1.8): the host's silhouette with a token. TWEWY's puck (1.13): control handed between two bodies, drawn. FFXII's gambits (1.10): the West's way, a mind as a line of conditions.
- **Alteration** (what is, turned). Vagrant Story's merged affinities (1.2): a trade, one ramp thinning as another rises. Parasite Eve's tune-up (1.4): an effect moves from a source to a target. FFCC's fusion (1.9): inputs blend along the band.
- **Spellscription** (written; "neutral, and so the most dangerous", LORE.md). Rudras (1.3): the root picks the motif, modifiers add marks, and void is the element with no opposite. Vagrant Story's lettered walls (1.2): script cut into what it stands on. Star Ocean 3's tattooed runes (1.15): script on the body.

### 3.2 The seven feelings
- **Wonder** (frost; slow, rising, hushed). Bahamut Lagoon (1.16): a vantage first. Chrono Cross White, light/cosmos (1.1), set against Black. Leroy's fade order (2.2): glints go last, so the diamond dust outlives the burst.
- **Mirth** (dots; bouncy, popping). Chrono Cross's jokes in the techniques (1.1). Legend of Mana's cheerful colour and squash (1.7). TWEWY's pop art and tribal pins (1.13): dots with a graphic edge, not confetti.
- **Desire** (ripples; pulled inward, a heartbeat). Einhänder's flashing multiplier (1.15). Unlimited Saga's Reel (1.15). Star Ocean 3's Bonus Battle Gauge, "excitement" lost at once (1.15): the heartbeat is the bar about to flash.
- **Fury** (cracks; fast, outward, hard core). Vagrant Story's Risk (1.2): heat that builds and costs. FFIX's Trance (1.11): rage changes the verb. FFIX's Mist (1.11): a weather that stimulates fighting. Chrono Cross Red, fire/magma (1.1).
- **Gall** (curds; viscous, dripping, corroding). FFCC's Miasma (1.9): a hazard held off by something carried. Parasite Eve's orange mass of people grown into a wall round Eve (plot): body horror as a skin on matter. Xenogears' Gaetia Key turns people into mutants called
  Wels to collect flesh (plot): flesh as the curd's source. https://en.wikipedia.org/wiki/Parasite_Eve_(video_game) and https://en.wikipedia.org/wiki/Xenogears
- **Grief** (streaks; slow, falling, sinking, long dissipation). Final Fantasy X's unsent (the dead not sent on "come to envy the living" and turn to fiends): what is left lingers longest, so its tertiary is the longest in the library. https://en.wikipedia.org/wiki/Final_Fantasy_X
  Chrono Cross Blue, water/ice (1.1). Leroy's order (2.2): the last element to leave is the quietest.
- **Dread** (marbling; creeping, contracting, dark). Vagrant Story's dim dungeons with one bright source (1.2). Parasite Eve II's fixed view and tank controls (1.4). Chrono Cross Black, darkness/gravity (1.1): it closes in rather than out.

## 4. The class arts: how forty-plus abilities stayed readable
What the sources do, as shared base / class colour / class motif:
- **Final Fantasy Tactics (Square, 1997):** twenty jobs; a job always has its own innate set (Wizards always Black Magic) and shared Reaction, Support and Movement slots take anything learned; JP learn abilities, a job is "Mastered" when all are known. https://en.wikipedia.org/wiki/Final_Fantasy_Tactics
- **Final Fantasy Tactics Advance (Square, 2003):** abilities are learned by wearing the gear that teaches them; some jobs belong to one race; a neutral Judge's Laws forbid actions, shown with yellow and red cards: a modifier with a source you can see. https://en.wikipedia.org/wiki/Final_Fantasy_Tactics_Advance
- **Final Fantasy XI (Square, 2002):** weapon skills differ by job, weapon and TP; a party chains them into a skillchain and magic timed on it bursts; a Support Job brings another job's abilities at half level. https://en.wikipedia.org/wiki/Final_Fantasy_XI
- **Bravely Default (Silicon Studio / Square Enix, 2012):** 24 jobs, each opened by an asterisk from a defeated human boss; a second job's skills carry over; a Special Move is tied to a job and while its party buff lasts "a specific tune ... plays over normal battle music"; Brave Points let a character
  act up to four times in a turn by going negative, then wait until the debt is paid. https://en.wikipedia.org/wiki/Bravely_Default
- **Chrono Cross (1.1):** 45 characters, each with an innate colour and "three unique special abilities"; the colour is on the weapon trail. **FFXIV (1.18):** a base colour per job. **TWEWY (1.13, second-hand):** a brand motif on each pin. **Xenogears (1.5):** Chi and Arcane over one Ether.
  **Dragon Quest (1.17), Parasite Eve II (1.4), FFCC (1.9):** families with rungs, so a hundred spells are a dozen shapes.
- **Riot's ladder (2.1)** is the readability rule: importance by size, saturation and opacity. Our reading, not Riot's: a Page's art is a basic attack (small), a Knight's a damage spell, a Queen's (sustained, held) a defensive spell (low saturation and opacity, soft), a King's and a zodiac Major's a
  game changer, the World's an ultimate; a reaction is the idle or defensive end and rides one shared base (`art.react`) in the suit's ramp.
- **The recipe the sources agree on:** (1) one shared base for a kind (all reactions the same quick ring; all held actions the same eased fade); (2) the class colour on the ramp and on the trail (Chrono Cross, FFXIV); (3) one motif per class or domain that survives at small size (a watermark, TWEWY;
  a root, Rudras); (4) a rung told in pips and cost (Parasite Eve II, FFXII); (5) held marks on a stricter budget than one-shots (FFXIV); (6) our own corollary for the 38 reactions: a Knight's reaction should look like the Knight's action quietened, not a new effect.

## 5. Footage worth pulling (not verified here; to watch, not claims)
- Vagrant Story: Break Arts, the spell casts and the wire dome. Chrono Cross: the colour trails and the summons when the strip is one colour. FFVII's Knights of the Round (Takai's "reflection points") against FFIX and FFX summons and Overdrive. FFXII: a Quickening and a Concurrence.
- Legend of Mana's special moves (Takai's effects), Xenogears' Deathblows, Parasite Eve's Parasite Energy, Bahamut Lagoon's dragon attacks, Brave Fencer Musashi's absorb. These are where the particle-level answers are; the text above could only reach the systems around them.

## 6. Where the plan and the sources meet (a check of `docs/plans/art/VFX-LIBRARY.md` against section 2)
- **Agrees, with sources:** primary is the brightest with a hot core (Riot slides 6 to 7; Leroy's hot point); follow-through erodes through noise while the ramp cools (Divine Fire, Battlefront II, Sacred 2's burning map); a feeling's skin sits under the domain's
  silhouette (Riot's reads: readability beats theme); loud effects only where they are earned (Briggs; Sakurai's ceiling); held marks calmer than one-shots (Ishii).
- **A number to weigh:** the plan's impact is "one frame of white core". The only impact number found is a 0.1 s hit frame (Leroy, 6 frames at 60) and Smash's 8-frame freeze at 15 %; one frame alone may not read at 480 lines.
- **Not found:** what Final Fantasy Tactics' reaction flash looks like. The plan and `src/vfx/classartlooks.js` cite it as prior art; the sources reachable here (Wikipedia, interviews) give the job rules, not the flash. Credit it as the idea (a reaction announces itself), not as a seen look.
- **Worth adding to the plan:** a three-bead history strip for the draught or agate (Chrono Cross); the colour of a class on every swing trail (Chrono Cross, FFXIV); rank pips on made things (Legend of Mana); the optional timing mark over the body (Vagrant Story); cap three modifiers on a
  blade (Vagrant Story); a family's rungs told by repeat (FFCC, Dragon Quest).

