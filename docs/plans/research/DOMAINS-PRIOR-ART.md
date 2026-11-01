# The seven Domains as seven questions: prior art and proposals

Read first: CLAUDE.md, docs/GLOSSARY.md, docs/plans/research/DOMAINS-AUDIT.md, docs/plans/SUBSTRATE.md, and (for the attributes) docs/plans/SOUL-ALCHEMY.md section 6. Repo untouched. Names below are plain (CLAUDE.md, "Plain names until settled"); no lore name is proposed. For South and Dovina.

## 0. Method, and what is and is not verified

Web search was used for every game cited; the URL after each claim is the page that carried it. Many pages are fan wikis, reviews or interviews, not developer postmortems. Where a source was thin or conflicting I say so. A claim with "(unverified)" came from my own knowledge, not from a page I pulled. Source quality, honestly: strongest are Wikipedia, SmashWiki, the Noita wiki, the MTG wiki, Bulbapedia/Smogon, Nintendo's own interview pages and Game Developer; weakest are the guide-farm pages (I used them only for facts every source agreed on).

## 1. What the prior art says about level-gated growth in general

Five patterns recur in the strongest examples and are the template for the proposals.

1. **One input, one rule, many consequences.** Superhot's whole game is "time moves only when you move" ([Wikipedia](https://en.wikipedia.org/wiki/Superhot), [Engadget](https://www.engadget.com/2014-05-14-time-moves-when-you-move-in-innovative-fps-superhot.html)). Portal's is "momentum is conserved between portals", which GLaDOS says in plain words and which generates the fling puzzles ([Portal wiki diff](https://theportalwiki.com/w/index.php?diff=67352)). Breath of the Wild's team framed it as a physics engine for movement and a chemistry engine for state, "a rule-based state calculator" ([GamesBeat](https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/), [Thumbsticks on the GDC talk](https://www.thumbsticks.com/gdc-17-breath-of-the-wild-science-lies)). A domain's question should be one such rule.
2. **A rule per tier, not a number per tier.** Braid gives each world its own time rule and moves on before you tire of it ([Critical Video Game Studies](https://criticalvideogamestudies.com/braid-as-contrasted-with-mario-a-deep-dive-into-mechanics/)). That is the best model for "30-60 a new relation": at 30 and 60 a domain changes what the rule applies to, not how big it is.
3. **A budget with visible pressure.** Hollow Knight's charms cost notches, and going over doubles the damage you take, with a flat penalty however far over ([Hollow Knight wiki](https://hollowknight.wiki/w/Charm_Notches); the "same penalty at any overage" detail is from a Steam commenter, so verify it). This is the game's own rule ("a capped pool shows what is held off, and by what") in another genre.
4. **A reserve that skill refills.** Prince of Persia: Sands of Time spends sand tanks to rewind about ten seconds, refills them from felled enemies and sand clouds, and keeps a separate set of power tanks for slow and freeze ([Wikipedia](https://en.wikipedia.org/wiki/Prince_of_Persia:_The_Sands_of_Time), [NWR review](https://www.nintendoworldreport.com/review/4164/prince-of-persia-the-sands-of-time-gamecube)). Hitman: Absolution does the same with Instinct: filled by clean kills and hidden bodies, spent on disguise and point shooting ([Hitman wiki](https://hitman.fandom.com/wiki/Instinct_Mode)). It fits the law "skill skips grind".
5. **Information as the reward.** Outer Wilds has no abilities, only knowledge, and the ship log is the one thing that carries across loops ([Scientific Gamer](https://scientificgamer.com/thoughts-outer-wilds)). It argues that a domain's 99 can be a thing you may now see or say, not a bigger number.

The audit found six widening keys declared and dead (ouranurgy.lane, divination.angling, psychokinesis.weight, possession.hold, alteration.cuts, spellscription.copy). Proposals that revive one are marked **[revives X]**.

## 2. Collisions to settle before building

**Attributes (docs/plans/SOUL-ALCHEMY.md section 6).** Seven attributes already own: Willpower (shield pool x1.5), Focus (statuses you build hold x1.3), Charisma (folk prices), Perception (a windup shows x1.5 sooner; dowse reach x1.2), Dexterity (draw and stow x1.3 faster), Visualization (the hand's making x2 faster; ink x1.4 further), Resilience (clay mends x1.5 faster; +2 ship hits). The clean split is: **an attribute scales the body; a domain changes what the body may do to the substrate.** Specific hazards:
- **Alteration vs Resilience.** "Pool into cracks and back" is mending by another door. Keep Resilience as slow, free mending; Alteration is instant, lossy and priced (A2). Alteration's best rate must never beat Resilience 10 over a game hour, or Resilience is dead.
- **Manifestation vs Willpower.** A made thing that "holds" pool must not enlarge the shield. M1 and M3 hold pool off (a held stretch), never add to the shield's size.
- **Possession vs Focus.** Focus lengthens statuses you build; Possession must change who a status is on or what it unlocks (W1, W2), not its duration.
- **Divination vs Perception.** Perception shows a windup sooner (tempo of information); Divination shows more kinds of information (area, timing, type, answer already ladder at 2/8/20/35). D1 and D5 add new kinds, never earlier.
- **Ouranurgy vs Dexterity.** Dexterity owns draw speed. Ouranurgy touches when other things resolve (a post, a latent status), never your own tempo.
- **Spellscription vs Visualization.** Ink reach is Visualization's; Spellscription owns how many rules and what they may say.

**Between domains.** The new questions draw the lines the audit found blurred (Slab vs Fold, Swap vs Lift): Ouranurgy chooses where and when an effect arrives, Psychokinesis how hard it hits, Manifestation what state it is in, Alteration which kind it is. O1+P2 is the model composition (Portal exit, then momentum). On reprogramming, Possession is the seat and Spellscription the script it follows, which would un-merge the three-domain reprogram.run.

**Laws that bound every proposal.** No flat damage multiplier; widening is reach, count, duration or share; the core movement is untouched; modifiers carry a visible source; no fifth substrate; and the type chart is asleep (SUBSTRATE F3), so proposals that need it assume F3 lands.

---

## 3. Ouranurgy: WHEN and WHERE

### Prior art
| mechanic | the one rule | gating fit | URL |
|---|---|---|---|
| Braid | each world a different time rule; some objects immune to your time | a rule per tier; "immune to your own effect" marks what you own | [CVGS](https://criticalvideogamestudies.com/braid-as-contrasted-with-mario-a-deep-dive-into-mechanics/) |
| Superhot | time advances only with your action | one input drives a whole domain | [Wikipedia](https://en.wikipedia.org/wiki/Superhot) |
| Titanfall 2, Effect and Cause | two perfectly aligned maps, one button swaps; enemies differ per period; used as combat gating | a relation (swap) that gates encounters | [Wikipedia](https://en.wikipedia.org/wiki/Effect_and_Cause), [Mapcore](https://www.mapcore.org/articles/development/effect-and-cause-titanfall-2-level-breakdown-r96/) |
| Portal | momentum conserved across the aperture | exit rule composes with force | [Portal wiki diff](https://theportalwiki.com/w/index.php?diff=67352) |
| Sands of Time | rewind ~10 s costs a tank refilled by kills; slow/freeze from separate tanks | reserve + depth tiers | [Wikipedia](https://en.wikipedia.org/wiki/Prince_of_Persia:_The_Sands_of_Time) |
| Fire Emblem: Three Houses | rewind turns, limited charges per battle, more earned by story | count widening | [Fire Emblem wiki](https://fireemblemwiki.org/wiki/Turn_rewind) |
| FFXIV Doom | a debuff that kills when its timer ends; cleansable or avoidable | a delayed effect is a visible debt | [FFXIV wiki](https://ffxiv.consolegameswiki.com/wiki/Doom_(Status_Effect)) |

Two things the table says. Superhot-style global time and Titanfall-style two-map swaps are unaffordable here (they change the core movement or double the level work). The affordable core is **time and place applied to effects, debts and statuses**, not to the Courier's body.

### Proposals

**O1. Aperture pair that keeps momentum.** A pair of mouths (reach and count widen with level) through which shots, thrown things, spit and carried loads pass, keeping speed and direction relative to the mouth, as in Portal. At 1-30: pair count, span, duration (revives nothing, extends the Portal power). At 30-60: foes' own projectiles go through; your psygun shot leaves the far mouth and its cost is paid at the near one. At 60-98: a mouth can be set on a creature or a made thing, so what it throws exits elsewhere. 99: one mouth may be a *mouth in time*, an exit that delivers the shot a set number of real seconds later (a parry window becomes a trap). Substrate: pool (cost at the near mouth), clock. Prior art: Portal ([wiki](https://theportalwiki.com/w/index.php?diff=67352)). Risk: moving the Courier through an aperture would change movement; restrict the pair to effects and objects, as the Portal power already is. Pairs well with P2.

**O2. Post a blow.** Once Divination shows a blow coming, Ouranurgy lets the intake be *posted* to a later moment: the shield drain or crack lands D real seconds on, drawn on the Lachrimeter as a stretch that is coming. Posted intake cannot be posted twice, and a shatter check counts it. At 1-30: D widens (2 to 6 real seconds). 30-60: you may post a *chosen* share, not the whole blow. 60-98: the debt can be paid early for a discount (the pool refilling in the gap pays it). 99: once a game hour, post a whole shatter into the far side of a fight. Substrate: pool/vessel and the clock. Prior art: FFXIV Doom as a visible debt ([wiki](https://ffxiv.consolegameswiki.com/wiki/Doom_(Status_Effect))) and Sands of Time's pay-to-undo reserve ([Wikipedia](https://en.wikipedia.org/wiki/Prince_of_Persia:_The_Sands_of_Time)). Risk: it can read as "extra health". Mitigation: the gap is only useful to someone who can *do* something in it (a mend, a mop, a parry soak); an empty-pool player with a posted debt is worse off. Needs SUBSTRATE F7 (one modifier stack with a game-clock source).

**O3. Latent statuses.** Statuses you build on a creature (the four type meters) can be *held*: meters fill but do not trip until you release them, up to a cap of real seconds. At 1-30: hold duration. 30-60: held statuses on several creatures trip on one beat of your choosing. 60-98: a held status can be moved to a different creature in sight. 99: all held statuses in sight trip at once and chain (Chrono Trigger's triple tech, "all must act together"). Substrate: statuses, the clock. Prior art: FFXIV Doom's delayed effect ([wiki](https://ffxiv.consolegameswiki.com/wiki/Doom_(Status_Effect))) and Chrono Trigger's simultaneity ([wiki](https://chronotrigger.wiki.gg/wiki/Techs)). Risk: overlaps Focus (status hold x1.3). Split: Focus lengthens a status after it trips; Ouranurgy only decides *when* it trips. Needs F3 so the types mean something.

**O4. Rewind the vessel's ledger, not the place.** Roll back the pool and cracks (not position, not enemies) by up to N real seconds, paid from a rewind reserve that fills only on clean play (a parry that answered something, a perfect pop), the Sands of Time tank model. 30-60: unlocked. 60-98: N from 3 to 10 real seconds (Sands' 10 s) and one extra charge per 20 levels (Fire Emblem's charges, [wiki](https://fireemblemwiki.org/wiki/Turn_rewind)). 99: a rewind that also undoes a shatter in place (no walk back to the plate), once a game day. Substrate: pool, vessel, clock. Prior art: Sands of Time, rollback netcode ([Gameye](https://gameye.com/glossary/rollback-netcode/)). Risk: the biggest of the five; it cheapens cracks. Mitigation: the reserve cannot be filled by grinding (skill-only sources), and Resilience's mending is the always-on alternative. Rollback netcode shows the technical cost is small only if the state is small: pool and cracks are, which is a reason to restrict to them.

---

## 4. Manifestation: IN WHAT FORM

### Prior art
| mechanic | the one rule | gating fit | URL |
|---|---|---|---|
| Noita | every pixel is a material with simple rules; water on lava makes rock; oil burns | a state is a property, reactions are free | [Wikipedia](https://en.wikipedia.org/wiki/Noita_(video_game)), [80.lv](https://80.lv/articles/noita-a-game-based-on-falling-sand-simulation/) |
| Breath of the Wild | physics engine moves, chemistry engine sets state; objects influence each other | "multiplicative, not additive" design | [GamesBeat](https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/) |
| Tears of the Kingdom, Ultrahand and Fuse | join simple real-world-like parts; fuse a thing to a weapon | composition as the level-up (more parts) | [Zelda Dungeon](https://www.zeldadungeon.net/informative-new-video-analyzes-how-nintendo-designed-ultrahand-for-tears-of-the-kingdom/), [Nintendo interview](https://www.nintendo.com/ph/interview/totk/04.html) |
| Divinity: Original Sin 2 surfaces | the ground has a state; fire + oil explodes, wet + electricity stuns | the surface *is* the state table | [Divinity wiki](https://divinity.fandom.com/wiki/Environmental_Effects_(Original_Sin_2)), [Fextralife](https://divinityoriginalsin2.wiki.fextralife.com/Environmental_Effects) |
| Latent heat (real practice) | a phase change absorbs or releases energy without changing temperature; each change has its own cost | a conversion with a fixed, visible price | [OpenStax](https://openstax.org/books/physics/pages/11-3-phase-change-and-latent-heat) |

The most useful lesson: the elegant systems (Noita, DOS2, BotW) do not add more *things*; they make *state* a property every system reads. For this game that property already exists on one side (liquid pool, solid Lachrymite cubes, crude as cargo, vapour as signature) and is unused on the made side.

### Proposals

**M1. A state ledger for the pool: liquid, solid, vapour.** The pool can be *set* (a share becomes a held solid Lachrymite lump you carry or place: immune to drain, siphons and the pool-cap, but not spendable as ammo), *melted* back (priced like a latent heat: a fixed loss), or *vented* (a share becomes vapour: a signature cloud, a decoy or a sensor bait). At 1-30: the share you may set, count of lumps. 30-60: melt loss shrinks; placed lumps are made things with hp (SUBSTRATE: "a made thing's hold and hp"). 60-98: vapour as a carrier for Illusion blows. 99: re-phase any made thing in place, no loss (a wall becomes a flood becomes a mist). Substrate: pool, signatures, overflow (the palm die already condenses overflow into cubes). Prior art: Noita, latent heat ([OpenStax](https://openstax.org/books/physics/pages/11-3-phase-change-and-latent-heat)). Risk: a second reserve beside the Bottles. Mitigation: the lump *is* the Bottle's solid cousin; the Bottles' valve already moves liquid to the pool. Distinguish from Alteration: Manifestation keeps the feeling and changes the state; Alteration changes the feeling.

**M2. State decides which blow a made thing takes.** One small chart: a solid made thing is hurt by Impact and ignores Illusion; a liquid one ignores Impact (it splashes) and carries Delirium onward; vapour ignores Impact and is thinned by wind. Each made thing wears its state in its look and its tag (`core/tags.js`). This is the DOS2 surface table, five types by three states, and it hangs entirely on the type chart waking (F3). At 30-60: you choose the state when you make a wall. 99: a made thing has two states at once (a gate that is solid to foes and vapour to you, Braid's "yours is immune" again). Prior art: DOS2 ([wiki](https://divinity.fandom.com/wiki/Environmental_Effects_(Original_Sin_2))), BotW ([GamesBeat](https://gamesbeat.com/the-legend-of-zelda-breath-of-the-wild-makes-chemistry-just-as-important-as-physics/)). Risk: 15 cells to tune; keep it to a 3 x 3 for the first build.

**M3. Summoned bodies are held stretches.** Every body you make or call (a mirage, an ally, a clapperjar spirit) holds off a share of the pool's maximum while it lives, shown as the held stretch on the Lachrimeter with the body named as the source. At 1-30: count. 30-60: bodies cost less held. 60-98: a body may be a *made thing in a form* (a liquid mount, a vapour scout). 99: one body over the budget, at a visible price (Hollow Knight's overcharm: more charms than notches, and everything hurts more; [wiki](https://hollowknight.wiki/w/Charm_Notches)). Substrate: pool max, vessel. Risk: Possession owns bound spirits; keep it clean: Manifestation *makes* them, Possession *owns* them. Collides with Willpower if the held stretch is read as shrinking the shield, so label it as a hold on the max, not on the shield.

**M4. Catch the weather as liquid.** A made basin collects the weather's falling feeling as liquid for the Lachrymato Bottles. The catchment widens with level. The weather is already a feeling falling as Lachryma; this gives it a use that is not a cost. 99: collected weather can be *poured back* as the same feeling over a place (rain you caught in Wonder frosts a path). Substrate: weather, clock, Bottles. Prior art: Noita's flasks ([Wikipedia](https://en.wikipedia.org/wiki/Noita_(video_game))). Risk: faucet. Check against the economy aim (480 cubes a real hour) before it ships.

---

## 5. Divination: WHAT IS KNOWN

### Prior art
| mechanic | the one rule | gating fit | URL |
|---|---|---|---|
| Return of the Obra Dinn | you deduce identity and fate from scenes; the game makes deduction beat guessing | knowledge as the verb | [Wikipedia](https://en.wikipedia.org/wiki/Return_of_the_Obra_Dinn), [Emily Short](https://emshort.blog/2019/06/06/return-of-the-obra-dinn-lucas-pope/) |
| Outer Wilds | no abilities; the ship log persists; what you know is the key | 99 as a thing you know | [Scientific Gamer](https://scientificgamer.com/thoughts-outer-wilds) |
| Slay the Spire | every enemy's intent is visible on your turn; "near-perfect information" | a ladder of what is shown | [PC Gamer](https://www.pcgamer.com/best-design-2019-slay-the-spire) |
| Into the Breach | every attack telegraphed, no random in your options; "every death your fault" | the full-information rule-break | [Game Developer](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-) |
| Darkest Dungeon | a light meter: more light, less stress and better scouting, less loot | information traded against reward | [wiki](https://darkestdungeon.wiki.gg/wiki/Light_meter) |
| Pokemon capture | catch rate depends on HP and status; the formula is public in guides | a hidden number made readable | [Smogon](https://www.smogon.com/ingame/guides/capture_mechanics) |

The game already has the best Divination mechanic in this table: the Figment telegraph ladder (area, timing, type, answer at levels 2, 8, 20, 35). The proposals extend the ladder to *new kinds* of information, not earlier information.

### Proposals

**D1. Read the vessel's side of a blow.** Show where a blow will crack and what it would hold off: the region (arms, torso, mask, legs) lit on the Courier's body, and a ghost of the held stretch on the Lachrimeter. Ladder: region at 30, cap at 45, "shatter if" at 60 (Into the Breach's "you can see the exact damage", [Game Developer](https://gamedeveloper.com/game-platforms/road-to-the-igf-subset-games-i-into-the-breach-i-)). 99: the next foe action after this one, not just the present windup (Slay the Spire shows one intent, Into the Breach all; this is one step more than the first and not all of the second). Substrate: vessel, pool. Risk: reading load; mitigated by showing it only when a blow is already telegraphed. Collides with Perception only if it comes sooner; it does not.

**D2. Odds on every chance you rolled.** Chests' pity counter, the wheel of odds, the stones' throw, the chance rolled for you: Divination shows the true odds (at 30), the counter state (at 60) and, at 99, the result of *your own* next throw before it is thrown (reroll still Luck's). Not Raku's tables (the house's). Substrate: Luck, the stones. Prior art: Smogon's capture formula made readable ([Smogon](https://www.smogon.com/ingame/guides/capture_mechanics)), value of perfect information ([Wikipedia](https://en.wikipedia.org/wiki/Expected_value_of_perfect_information)). Risk: gambling economy; scope to world chance only and test against ECONOMY.md.

**D3. Hunches from held facts (knowledge as the key).** The Veritome's Book already stores facts. A hidden thing that matches a fact you hold glimmers within a reach that widens with level (Outer Wilds: the way is what you know, [Scientific Gamer](https://scientificgamer.com/thoughts-outer-wilds)). Level 60-98: a *wrong* fact shows a scrambled line, as the tag's latent and scrambled reads already do. 99: a place's hidden things show at once to someone who has understood its habit lines. Substrate: the Book, the explored area, familiarity. Risk: needs enough hidden things to matter; ties to the unwired "sky read that came true" source.

**D4. Still reading.** The deepest reads (hidden tags, true intent) take a still posture to open, as Time Vision does ([Prima](https://primagames.com/tips/quantum-break-how-use-your-time-powers)); level widens the radius of what the still read shows, never the speed. This asks nothing of the core movement (you may still walk; you just read less). Substrate: posture (C's cycle), signatures. Risk: could read as a tax on mobility; offer it as the *free* way and the moving way costs pool (Hitman's meter, [wiki](https://hitman.fandom.com/wiki/Instinct_Mode)).

**D5. Call it.** You may *commit* to a prediction (a foe's next skill, tomorrow's weather feeling, a chest's tier, an islet's secret) before it resolves; a call that comes true grants familiarity and a first-today style payout, a miss costs only the tell. This pays the unwired "forecast that came true" source and rewards deduction over scanning, which is Obra Dinn's loop ([Emily Short](https://emshort.blog/2019/06/06/return-of-the-obra-dinn-lucas-pope/)). Substrate: the clock, familiarity. Risk: needs a verifiable prediction schema per module; pick three to start.

---

## 6. Psychokinesis: WITH HOW MUCH FORCE

### Prior art
| mechanic | the one rule | gating fit | URL |
|---|---|---|---|
| Smash knockback | launch grows with the target's percent (and weight); the same hit launches further as damage builds | force as displacement; ring-out | [SmashWiki Launch](https://www.ssbwiki.com/Launch), [KB](https://www.ssbwiki.com/KB) |
| Half-Life 2 gravity gun | one verb (pick, move, place) makes a physics puzzle language | one verb, an environment of masses | [GamesRadar](https://gamesradar.com/half-life-2-retrospective), [GDC report](https://games.slashdot.org/story/06/03/24/1926234/gdc---physics-in-half-life-2) |
| Control, Launch | any object is ammo; with nothing loose it tears up the building; upgrades allow larger things | ammo taken from the world, a limit of mass | [Wikipedia](https://en.wikipedia.org/wiki/Control_(video_game)), [Game Informer](https://www.gameinformer.com/review/control/control-review-a-heady-power-trip) |
| Katamari | the ball can take only what is smaller than it; growth unlocks larger things | a mass ratio is a level curve | [Wikipedia](https://en.wikipedia.org/wiki/Katamari) |
| Sekiro posture | blows fill a posture bar; at full it breaks; recovery slower at lower health | force as a second health | [Samurai Gamers](https://samurai-gamers.com/sekiro-shadows-die-twice/posture-system/) |
| Portal momentum | speed in, speed out | force survives transport | [Portal wiki diff](https://theportalwiki.com/w/index.php?diff=67352) |
| Crumple zones (real practice) | same momentum change over a longer time, so less peak force | force and time trade | [Wikipedia](https://en.wikipedia.org/wiki/Crumple_zone) |
| Half-Life 2 supercharged gun | catch an energy ball or grenade and fling it back | return to sender | [Combine Overwiki](https://combineoverwiki.net/wiki/Gravity_gun) |

### Proposals

**P1. Heft: a mass ratio, and what it holds off.** Revives the dead `weight` widening **[revives psychokinesis.weight]**. What you can lift is a ratio of the thing's mass to a reference that grows with level (Katamari's size rule, [Wikipedia](https://en.wikipedia.org/wiki/Katamari)), and while you hold it a share of the pool's maximum is held off in proportion to the load, drawn on the tube (Control's Launch upgrades "throw larger things and enemies", [Game Informer](https://www.gameinformer.com/review/control/control-review-a-heady-power-trip)). 1-30: mass limit and count. 30-60: stunned living things (stun depth sets how heavy they count). 99: the load is free to hold, and the limit has no top, but anything above the island's firm layer's weight tears a piece out of the ground, which stays missing. Substrate: pool max, thrown hits (energy in blows, joules / 40). Risk: Willpower collision (the hold must not read as shield size). Skill decides damage: the throw's speed comes from aim and release, not from the level.

**P2. Relay: momentum carried along a chain.** A thrown hit's energy is conserved along what it strikes: a crate knocks a stack, the stack knocks pins, each loses a share. Level widens the count of relays that still count (the strike of "three or more" already exists in the sandbox glossary entry). Prior art: Portal's conserved momentum ([wiki](https://theportalwiki.com/w/index.php?diff=67352)) and Smash's launch ([SmashWiki](https://www.ssbwiki.com/Launch)). Substrate: thrown hits. 99: one throw's energy is *not* spent when it strikes, it only changes direction (a thrown thing that bounces forever). Risk: physics cost; cap the chain at the instance pool.

**P3. Strain: a creature's cracks as push.** Following SUBSTRATE F5 (Smash percent as cracks): each Impact blow on a creature adds to its *strain*, a decaying total; launch distance grows with it. PK's level widens the *reach* of a launch and the count of things a launch can carry into a hazard (a ring-out into a pit, a sandfall, a Well's maw). Never damage: the win is displacement. Prior art: Smash ([SmashWiki](https://www.ssbwiki.com/KB)), Sekiro's posture ([Samurai Gamers](https://samurai-gamers.com/sekiro-shadows-die-twice/posture-system/)). Substrate: the creature's cracks (shared with the vessel's model), stun poise. Risk: Strawman's Well and the Arena are "in flux"; reuse their kernel, do not fork it. Note FIGHTER is not settled.

**P4. Catch and return.** A held, ready PK can *catch* a projectile at the parry's edge and keep its energy as a thrown hit in hand (HL2's supercharged gun catches energy balls and grenades and flings them back, [Combine Overwiki](https://combineoverwiki.net/wiki/Gravity_gun)). The energy is the blow's own, not a multiplier; the Courier's parry (V) is still the rule's first answer. 1-30: size. 60-98: the caught energy goes into the pool as an absorb instead. 99: a held catch can be set down as a made trap. Risk: overlaps the parry soak; define clearly as the parry's *PK form* (outlined shots only).

---

## 7. Possession: WHOSE

### Prior art
| mechanic | the one rule | gating fit | URL |
|---|---|---|---|
| Ghost Trick | possess objects by their trick; fresh corpse rewinds you four minutes | ownership of a thing's verb | [Wikipedia](https://en.wikipedia.org/wiki/Ghost_Trick:_Phantom_Detective) |
| Shin Megami Tensei negotiation | receptivity changes with the moon, the demon's temper and alignment | a readable social state | [Prima](https://primagames.com/gaming/how-to-talk-to-and-negotiate-with-demons-in-smtv-vengeance), [Press Turn](https://megatenwiki.com/wiki/Press_Turn_System) |
| Pokemon capture | HP, status and ball modify the catch | weaken-to-win | [Smogon](https://www.smogon.com/ingame/guides/capture_mechanics) |
| Kirby | swallow an enemy to copy its move; usually costs the inhale; damage strips it | trade a verb for a verb | [Wikipedia](https://en.wikipedia.org/wiki/Kirby_(character)), [Wikirby](https://wikirby.com/wiki/Ability) |
| Prey | Mimic Matter: assume the form of an object; scanning Typhon unlocks powers; more installed means more hunted | the self as a loadout with a hunter | [Wikipedia](https://en.wikipedia.org/wiki/Prey_(2017_video_game)), [Game Informer](https://www.gameinformer.com/b/features/archive/2016/12/16/the-powers-in-prey-are-out-of-this-world.aspx) |
| Dishonored Possession | merge into animals; humans need Human Possession and (per one source) to be unaware; costs mana | tiers by target type | [Wikipedia](https://en.wikipedia.org/wiki/Dishonored), [Fandom](https://www.fandom.com/articles/powers-dishonored-2) |
| Dishonored 2 Domino | link targets so they share one fate | shared harm | [Fandom](https://www.fandom.com/articles/powers-dishonored-2) |
| Psychonauts 2 | mental connections: tether to a thought or pull an enemy in | a link as a tool | [Wikipedia](https://en.wikipedia.org/wiki/Psychonauts_2), [GamingBolt](https://gamingbolt.com/psychonauts-2-video-showcases-new-mental-connection-psi-power) |
| Hollow Knight | charms and notches as the self | the self as budget | [wiki](https://hollowknight.wiki/w/Charm_Notches) |
| Risk pooling (real practice) | losses shared among members; it works when losses are independent | sharing has a failure case | [HMRC manual](https://gov.uk/hmrc-internal-manuals/general-insurance-manual/gim1120) |

### Proposals

**W1. Share a crack.** Link yourself to a bonded creature or ally: a region's crack is split across the link, by a share that widens with level, and mends on whichever body is the nearest to a mending source. Level 1-30: share and count of links. 30-60: a link carries one *region*, chosen. 99: link all bound spirits in sight so any crack is a pool (Domino generalised, [Fandom](https://www.fandom.com/articles/powers-dishonored-2)). The design hint from risk pooling is the failure case: pooling works when losses are independent, so an area blow that hits every linked body at once is *worse* for the pool ([HMRC](https://gov.uk/hmrc-internal-manuals/general-insurance-manual/gim1120)); it gives the mechanic a counter without a number. Substrate: vessel cracks. Collides with Resilience (mend speed) only if mending is faster in a link; it must not be.

**W2. Readable receptivity (negotiate, don't roll).** Taking a creature depends on states the player can see: its EmO band, a status (calm, sleep, dazed), the clock (game hour, weather feeling), its grain. Level removes conditions one by one (SMT's moon changing who will talk, [Prima](https://primagames.com/gaming/how-to-talk-to-and-negotiate-with-demons-in-smtv-vengeance); Pokemon's HP and status, [Smogon](https://www.smogon.com/ingame/guides/capture_mechanics)). 1-30: duration, count. 30-60: a creature stunned to a deeper depth takes less. 99: take what is not even receptive but give it a visible price. Substrate: statuses, mental state, the clock. Risk: grain and EmO must carry a lot; check against the existing temperament module.

**W3. Borrow a verb.** After a creature is calmed or stunned, you may take *one move* of its for a set time, in your own body, using its clip (Kirby's copy: the swallowed move, the lost inhale, damage that strips it; [Wikirby](https://wikirby.com/wiki/Ability)). The price is your tool's verb on that slot. 1-30: duration. 60-98: two verbs held. 99: keep it for good, but it takes a notch of the bracelet. Substrate: statuses, bracelet sockets. Risk: needs a clip per move; the existing learned-skill system (Absorb, Kindle) is the precedent in duels. **[revives possession.hold]** in spirit.

**W4. Ride a body, leave your own.** Take a creature's body to scout, press a plate, or pass through a grate; your own is left standing, regen paused, as Dishonored leaves Corvo's body behind ([Wikipedia](https://en.wikipedia.org/wiki/Dishonored)) and Ghost Trick pushes a verb through a thing ([Wikipedia](https://en.wikipedia.org/wiki/Ghost_Trick:_Phantom_Detective)). Animals and decoys at 30; unaware humanoids at 60 (Dishonored's Human Possession is a late tier); a Figment mid-fight at 99, for a few real seconds. Substrate: pool (regen paused is the cost), the Courier's exposure. Risk: the Courier's core movement is untouched but the camera moves; keep it to a reading mode with a hard time cap.

**W5. Overreach: the self past its notches.** Wear one more charm than the bracelet's sockets, at the price Hollow Knight puts on overcharm, a doubled intake ([wiki](https://hollowknight.wiki/w/Charm_Notches)). Possession permits it at 60; 99 makes the price a share rather than a double. Substrate: bracelet, vessel. Risk: the bracelet is domain-neutral; this is the one proposal that needs the bracelet plan changed, and the doubled intake is the kind of flat multiplier the law dislikes, so make the price a *held stretch* rather than a multiplier before shipping.

---

## 8. Alteration: OF WHICH KIND

### Prior art
| mechanic | the one rule | gating fit | URL |
|---|---|---|---|
| Fullmetal Alchemist | equivalent exchange: to obtain, lose something of equal value; the philosopher's stone is the exception | conservation with a famous 99 | [FMA wiki](https://fma.fandom.com/wiki/Alchemy) |
| Pokemon Soak | the target's type becomes pure Water until it leaves battle; fails on a few | re-typing a creature | [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Soak_(move)) |
| Pokemon Camouflage / Conversion | the user's type becomes the terrain's, or one of its moves' | re-typing the self | [Serebii](https://serebii.net/games/typechange.shtml) |
| Monster Hunter | elemental damage depends on the part's elemental hitzone; no weakness, no elemental damage | kind matters per part | [Kiranico](https://mhworld.kiranico.com/guide/damage) |
| Divinity: Original Sin 2 | surfaces react: oil + fire explodes, wet + electricity stuns | kinds react on the ground | [Divinity wiki](https://divinity.fandom.com/wiki/Environmental_Effects_(Original_Sin_2)) |
| Currency conversion (real practice) | a conversion has a spread; a round trip loses it twice | a lossy, priced exchange | [Canadian Couch Potato](https://canadiancouchpotato.com/2012/12/17/how-much-are-you-paying-for-us-dollars/) |

The game has the pieces for the best of these already: five types in a trump cycle, agate (two feelings felt at once), the draught, and the weather. Alteration should own *conversion between them*, with a rate.

### Proposals

**A1. Re-type: Soak and Camouflage.** Three levels of the same rule. 1-30: your next blow takes the weather's feeling type (Camouflage takes the terrain's type, [Serebii](https://serebii.net/games/typechange.shtml)). 30-60: your blows take the draught's. 60-98: a creature's affinity is set to a type for a duration (Soak: the target becomes pure, [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Soak_(move))) so the trump bites. 99: the effect outlasts the fight on a creature (Soak lasts only "while in battle"; this is the rule-break). Substrate: damage types, feelings, weather. Risk: depends entirely on F3 (creatures have an affinity); without it, nothing happens.

**A2. Exchange: cracks into pool, pool into cracks, with a visible rate.** Spend a crack to fill the pool, or pool to ease a crack, at a posted exchange rate with a spread (FMA: equivalent exchange, [wiki](https://fma.fandom.com/wiki/Alchemy); currency: the round trip loses the spread twice, [CCP](https://canadiancouchpotato.com/2012/12/17/how-much-are-you-paying-for-us-dollars/)). 1-30: share per use. 30-60: the spread narrows. 99: one lossless exchange a game day (the philosopher's stone exception). Substrate: pool, vessel. Risk: the one proposal most likely to be an exploit and the one that collides with Resilience. Mitigations: the sum of cracks converted per game day is capped; a crack converted is not mended (it stays on the vessel's region as a held stretch). Resilience mends for free over time; this is the instant, expensive door.

**A3. Reactions on the ground (the 7 feelings' paint).** Where two feelings' paints, blots or slicks meet, they react by the existing agate table: adjacent blend, opposites cancel (Magicka's opposites, [Wikipedia](https://en.wikipedia.org/wiki/Magicka); DOS2 surfaces, [wiki](https://divinity.fandom.com/wiki/Environmental_Effects_(Original_Sin_2))). The level widens the *reaction radius* and the count of cells that chain. Substrate: the paint map, feelings, the clock. 99: a reaction chain that spreads along every cell of the same feeling until it meets its opposite. Risk: 21 pairs to read; reuse the agate table (`AGATES`) and add no new pairs.

**A4. Walk a status around the cycle.** Convert a status you carry or a foe carries into the one its type trumps (doubt, charm, blind, confusion in the cycle Impact > Illusion > Ego > Influence > Delirium > Impact). One rule, and any status can be walked around the cycle. Prior art: Soak and Conversion on types ([Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Soak_(move)), [Serebii](https://serebii.net/games/typechange.shtml)). 99: convert a status into its absence for the cost of a feeling (a cure by kind). Risk: duplicates Focus' status hold; convert the kind, never extend the hold. **[revives alteration.cuts]** in a way: a *cut* of one kind into another.

---

## 9. Spellscription: UNDER WHICH RULE

### Prior art
| mechanic | the one rule | gating fit | URL |
|---|---|---|---|
| Baba Is You | rules are blocks you push; break a rule, change the game | rules as places | [Wikipedia](https://en.wikipedia.org/wiki/Baba_Is_You) |
| Noita wands | order decides: a trigger fires its payload on contact; cast delay is ignored inside a payload; if mana cannot cover the chain, the trigger is kept and the rest omitted | a chain with a cost rule | [Trigger](https://noita.wiki.gg/wiki/Trigger), [Wand Mechanics](https://noita.wiki.gg/wiki/Guide:_Wand_Mechanics), [Add Trigger](https://noita.wiki.gg/wiki/Add_Timer) |
| Magic: the Gathering | triggered abilities: "when, whenever, at"; they go on the stack; order is fixed; delayed triggers | event rules with order | [MTG wiki](https://mtg.wiki/page/Trigger) |
| Final Fantasy XII Gambits | condition + target + action, by priority, toggleable | programming a mind | [StrategyWiki](https://strategywiki.org/wiki/Final_Fantasy_XII/Gambits), [Game Developer](https://www.gamedeveloper.com/programming/intelligence-in-turn-based-rpg-combat) |
| Final Fantasy XIII paradigms | role sets swapped in one press | rule sets | [StrategyWiki](https://strategywiki.org/wiki/Final_Fantasy_XIII/Paradigms) |
| Opus Magnum | per-arm instruction tapes; scored on cost, area, cycles | a program is scored by what it spends | [Wikipedia](https://en.wikipedia.org/wiki/Opus_Magnum) |
| Hunter x Hunter vows | a self-imposed restriction raises power (fan sources, conflicting) | restriction for power | [MyAnimeList](https://myanimelist.net/featured/1053/6_Types_of_Nen_in_Hunter_x_Hunter) |
| Jujutsu Kaisen binding vows | a vow with a penalty on breaking raises output | the same | [Sportskeeda](https://sportskeeda.com/anime/binding-vows-minimal-usage-jujutsu-kaisen-makes-perfect-sense-sukuna-shows-why) |
| Event-condition-action rules (real practice) | "on event, if condition, then action"; rule cycles must be detected | the form of any "when X do Y" | [Wikipedia](https://en.wikipedia.org/wiki/Event_condition_action) |
| Smart contracts (real practice) | a vending machine as the ancestor: conditions execute themselves | enforceable promises | [Szabo](https://www.fon.hum.uva.nl/rob/Courses/InformationInSpeech/CDROM/Literature/LOTwinterschool2006/szabo.best.vwh.net/idea.html) |

The ECA form is also the game's own architecture: an event bus named `domain.verb`, and achievements as predicates over the ledger. The strongest Spellscription is the one the player programs on the same bus the game already runs on.

### Proposals

**S1. A vow: a restriction for a cheaper art.** Attach a condition to an art ("only while standing still", "only under this weather's feeling", "only on a clean pool") and the art's *cost* (not its damage) falls or its count rises. Break the condition and the cost comes due on the vessel (a held stretch, then a crack). 1-30: vow slots. 30-60: conditions may read the clock, the weather, a status. 99: a vow written into a *place* becomes that place's law (a visible circle on the ground) rather than yours, SUBSTRATE's "a change comes as a modifier with a source you can see in the world". Substrate: costs (the Spellscription dial), the clock. Prior art: Hunter x Hunter ([MyAnimeList](https://myanimelist.net/featured/1053/6_Types_of_Nen_in_Hunter_x_Hunter)) and Jujutsu Kaisen ([Sportskeeda](https://sportskeeda.com/anime/binding-vows-minimal-usage-jujutsu-kaisen-makes-perfect-sense-sukuna-shows-why)); both are fan sources with conflicting detail, and the only hard design lesson is that a vow needs a clear break penalty. Risk: a cheaper cost is a power increase; keep it to cost *share*, never damage.

**S2. Chain order (the wand rule).** An inscription or sigil is a chain of triggers, modifiers and payloads whose order matters, with Noita's cost rule: if the pool cannot pay the whole chain, the trigger fires and the rest is dropped ([Trigger](https://noita.wiki.gg/wiki/Trigger), [Wand Mechanics](https://noita.wiki.gg/wiki/Guide:_Wand_Mechanics)). Level: chain length (count), then modifier types, then multicast. 99: a chain that includes itself once (a loop of one turn). Substrate: pool, costs. Risk: interface (the reading table is the right place); and Opus Magnum's lesson that a program should be scored on what it spends ([Wikipedia](https://en.wikipedia.org/wiki/Opus_Magnum)).

**S3. Gambits for what you leave behind.** Standing "when X do Y" rules over the event bus, restricted to a menu: when a ward is struck, when the pool falls below N, when a status trips, when the hour changes. Order and priority as FFXII does ([StrategyWiki](https://strategywiki.org/wiki/Final_Fantasy_XII/Gambits)); resolution and cycle-safety as MTG and ECA do ([MTG wiki](https://mtg.wiki/page/Trigger), [ECA](https://en.wikipedia.org/wiki/Event_condition_action)). 1-30: slots. 30-60: two-term conditions. 99: a rule may listen to *someone else's* events (a sibling's, a foe's). Substrate: the event bus, the pool. Risk: infinite loops and an unfair automatic player. Mitigation: once per event, a stack depth, and a rule that cannot fire an art you could not afford; "arts only by achievement" still gates which arts may be the action.

**S4. Rewrite a tag (Baba).** The game already says what a tool may do to a thing by tags on the thing (`core/tags.js`). Let a written inscription add or remove a tag from *one thing or one marked area*, from a whitelist, for as long as the inscription lasts, and let the inscription be scuffed, mopped, or knocked to end it (Baba: separate the blocks and the rule ends, [Wikipedia](https://en.wikipedia.org/wiki/Baba_Is_You)). A crate gets `grapplable`, a door loses `solid` to you, a creature gets a tag that makes it hurtable by a type. 1-30: area and count. 60-98: copy a tag from one thing to another (the dead `copy` widening). 99: write a rule onto a whole place (S1's circle). **[revives spellscription.copy]**. Risk: the largest; a removed `hurtable` is invulnerability. The whitelist is the safety, and the rule stays visible in the world as the inscription itself (an overlay tag reads it).

---

## 10. Ranking and questions

**Lowest risk, best fit:** P2 (the sandbox already has the energy), D1 (a pure display), S2 (the reading table exists), A3 (the agate table exists), O3, W1, M3.
**Highest reward, highest risk:** O4 (rewind the ledger), A2 (exchange), S4 (rewrite a tag), S3 (standing rules), W5 (overreach).
**Needs another module first:** A1, A4, M2, O3 need the type chart (SUBSTRATE F3); O2, M3 need the modifier stack with sources (F7); O4, A2 need one vessel in every form (F1); P3 waits on FIGHTER.
**Dead keys woken:** weight (P1), hold (W3), cuts (A4), copy (S4); lane and angling have no proposal.
**A 99 for each:** Ouranurgy a mouth in time (O1) or a shatter undone in place (O4); Manifestation re-phase with no loss (M1); Divination one foe step further than a card game shows (D1); Psychokinesis a hold with no mass limit (P1); Possession all bound spirits linked (W1); Alteration one lossless exchange (A2); Spellscription a rule written into a place (S1, S4).

**Questions for South** (via Dovina): (1) May Alteration have an instant, lossy door between cracks and pool beside Resilience's slow free one? (2) Must every price be a held stretch, or may Possession's overreach double intake? (3) Is rewinding the ledger (not the place) inside "no change to the core movement"? (4) May a written rule remove a tag from a creature, or only add?

## 11. Gaps

- No developer postmortem was found for Obra Dinn, Superhot or Control; those rows rest on reviews and Wikipedia.
- Hunter x Hunter and Jujutsu Kaisen rows are fan sources: they support the pattern (restriction for power), not exact rules. The Hollow Knight "same penalty at any overage" detail is a forum comment; the SMT V moon-phase effect conflicts between two Prima articles.
- Not searched: Atelier, Scribblenauts, Pokemon forms, Hades' time slow (the search returned only Hades II).
- Every proposal is a sketch, unchecked against docs/ECONOMY.md, the sweeps or the performance budget.
