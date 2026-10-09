# Attack telegraphs: research for the Divination telegraph vocabulary

Research note (Dovina's desk, 2026-10-09). Sources are web searches and fetches done this round; each claim carries its URL. Where a claim is my inference, it says so. Gaps are listed in section 6.

## 1. FFXIV

- Ground AoE shapes (static: circle, donut with a safe centre, line, cone usually 90 degrees; cleave = unmarked frontal cone at the highest-enmity target; puddle; landmine; homing; moving "exaflares"; radial lines; radial squares; line-of-sight; spread circle / "protean" spread line or cone). https://ffxiv.consolegameswiki.com/wiki/AoE_marker
- Colour: standard AoEs are "bright orange highlights on the ground"; some duties use red AoEs that register substantially later after vanishing; homing AoEs use yellow chevrons and a pulsating circle; moving AoEs carry arrows for direction. Same page.
- Omen vs hidden: the orange marker is the usual warning, but in high-end and higher-level normal content telegraphs often appear only right before the attack resolves, so you read the animation or cast name; spread line/cone attacks are often untelegraphed in high-end; older line-of-sight attacks have only a ~10 s cast. Standard AoEs usually snapshot when the telegraph disappears. Hidden telegraphs are most common from Shadowbringers on. Same page.
- Head markers (community wiki; fan-maintained): spread = circle around the player (overlap edges fine, two inside one circle not); stack = arrows pointing at a player (standard five: one above, four in a cross; multi-hit stacks show more arrows) with a rhythmic pulse; tankbuster = red ring and downward chevron, variants AoE (solid red area), "caution" (yellow-and-black striped ring, size not shown), shared (red circle stack over the tank); flare = three white outward arrows; limit cut = numbered 1-8 red or blue circles giving hit order, variants of blue squares / purple triangles for two attack types; proximity AoE = purple waves, move as far as possible; analysis = yellow ring with empty sectors to face; light/dark rings pair opposites; red triangle = stack with at least one other. https://ffxiv.consolegameswiki.com/wiki/Common_mechanics_and_markers (also https://consolegameswiki.com/wiki/Stack_marker, https://ffxiv.consolegameswiki.com/wiki/Tankbuster, https://ffxiv.consolegameswiki.com/wiki/Proximity_AoE)
- The castbar: the cast name is itself a cue to location/kind; some spread circles are indicated only by cast bar or debuff. https://ffxiv.consolegameswiki.com/wiki/AoE_marker
- Not found: a dedicated source for knockback arrows or the gaze icon (the AoE page lists gaze only as an entry). Raidwide and enrage were not sourced this round (general knowledge: raidwide = unavoidable party-wide hit; enrage = a timer after which the boss kills the party). Mark both as unsourced.
- Reading: the tiers strip the "where" (ground) first and leave the "who/what" (head markers, cast names), so the vocabulary is learned once at low tier and then must be recalled. Inference.

## 2. Guild Wars 2

- A 2012 Game Informer guide: hostile AoEs usually put a red circle on the ground, but you still need to watch animations and attack patterns; many attacks are cones or lines. https://gameinformer.com/b/features/archive/2012/09/05/guild-wars-2-dungeon-tips
- Pre-launch framing: dodging "evades attacks, a more effective and understandable way to avoid big creature attacks or to get out of AoE spells"; a minority of auto-tracking projectiles cannot be dodged. https://www.gamebanshee.com/9ah (Q&A page) and https://gamebanshee.com/xy8 (preview)
- Breakbar / Defiance bar: sits under the health bar, three states (locked: immune to crowd control; unlocked: control skills drain it; broken: recharging); each control skill has a Defiance Break value, shown in teal in its tooltip. https://wiki.guildwars2.com/wiki/Defiance , https://wiki.guildwars2.com/wiki/Defiance_Break
- Unblockable: a stacking effect; "unblockable" shows in skill tooltips. No dedicated on-screen unblockable marker found. https://wiki.guildwars2.com/wiki/Unblockable_(effect)
- Clutter: only player complaints found (many overlapping red circles; ally circles confused with boss circles). https://en-forum.guildwars2.com/topic/147485-what-is-meant-by-this-guy-spamming-reds . Third-party guides recommend lowering Character Model Limit / Effect LOD for performance, and note low model limits can cull enemy skill effects such as walls on Soulless Horror; that is a warning that effect culling hides telegraphs. https://hardstuck.gg/gw2/guides/general/performance-improving-settings . No official ArenaNet statement on telegraph readability found.

## 3. World of Warcraft

- Ground "swirlies" were reworked in 11.1 (clear outline, distinct inside colour); frontal cones were not, and community says they lack a distinct edge (Belo'ren's tank frontal drawn shorter than it hits). Secondhand repost of Wowhead; Blizzard's position not confirmed. https://seramate.com/news/2026/06/04/frontal-visibility-dungeons-raids-feedback-1f16023a , headline at https://www.wowhead.com/news=381733/frontal-visibility-in-dungeons-and-raids-should-be-improved
- Addon policy: Blizzard says it wants less addon reliance; encounter designers had to balance against "WeakAura solvers"; fights are tested without addons and readability gets stronger visual, sound and colour cues. https://www.icy-veins.com/wow/news/boss-fights-in-midnight-wont-need-weakauras-anymore/ , https://www.icy-veins.com/wow/news/blizzard-plans-to-reduce-add-on-reliance-in-future-raids/
- From 12.1 addons cannot read aura data directly; hidden-information mechanics are back as design space. https://www.icy-veins.com/wow/news/blizzard-interview-add-ons-raid-design-and-mythic-in-patch-12-1/ (summary via search; the page itself returned 403 to my fetch)
- Private auras: a flag that keeps a mechanic away from most UI addons, trialled in Dragonflight "to varying degrees of success". https://tech.yahoo.com/gaming/articles/wows-devs-continue-private-auras-163038280.html (not read in full)
- Not found: a Blizzard statement on animation-first vs UI telegraphs. DBM/BigWigs history and "2019+ standardisation" were not sourced.

## 4. Others, briefly

- WildStar: telegraphs are coloured ground shapes; blue = your own abilities, green = friendly beneficial, red = enemy damage/debuff; the red zone fills at varying speeds to show the moment of execution; players aim their own telegraphs; options for telegraph opacity and colour-blind modes; PvP got chaotic. https://wildstar.fandom.com/wiki/Combat , https://www.tentonhammer.com/wildstar/opinions/wild-about-wildstar-combat-telegraphs , https://gamecritics.com/kristin-renee-taylor/wildstar-review/ , https://www.engadget.com/2012-09-01-pax-prime-2012-wildstar-presentation-and-qanda.html
- Monster Hunter: the director says animation is hand-keyed and subtle movement is a clue to how to approach a monster; designed behaviour-first; long wind-ups before engulfing attacks, and the wind-up is also an opening. https://nintendolife.com/news/2015/02/monster_hunter_4_ultimate_director_discusses_monster_design_and_animation
- Elden Ring / Souls: community debate is whether a tell is "now" or "soon" (delayed wind-ups make a dodge on the tell too early). Forum opinion, no FromSoftware statement. https://steamcommunity.com/app/1245620/discussions/0/3719440044270966891 , https://choostgames.com/blog/what-makes-a-good-boss-fight/
- Hades: one analysis credits pose, timing and silhouette over micro-detail; Hades II is criticised for legibility (very fast, or telegraphed but tracking). Fan analyses, not developer words. https://geekchamp.com/the-art-of-hades-showcases-the-talent-that-went-into-this-beautifully-vibrant-game/ , https://nex-3.com/blog/hades-ii-has-a-legibility-problem/
- Lost Ark: telegraph colour carries a rule in some raids (Argos: match the safe-spot colour to your buff; Moake: blue triangles then beams). Forum note that blue+white indicators are hard for colour-vision deficiency. https://mobalytics.gg/blog/lost-ark/lostark-argos-phase-1-abyss-raid-guide/ , https://steamcommunity.com/app/1599340/discussions/0/3378284761893467931 . Black Desert: nothing found.
- Accessibility: Game Accessibility Guidelines say never convey essential information by fixed colour alone; use colour as backup to symbol, pattern or shape; allow customisation where fast play leaves no room. https://gameaccessibilityguidelines.com/?p=91 ; Xbox: https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/103 . The grayscale-screenshot audit and blue/orange robustness come from a vendor guide: https://bugnet.io/blog/colorblind-friendly-game-design
- Into the Breach: every enemy intent shown before you act, tiles marked, deterministic; reviewers call it the heart of the design. https://www.giantbomb.com/into-the-breach/3030-58234/user-reviews/2200-31048/ , https://blog.prototypr.io/into-the-breachs-ux-makes-you-feel-smart-a9cb03210757

## 5. Synthesis

### (a) Shapes

Point or circle (burst, spread); ring/donut (safe centre); cone/frontal; line/rectangle (beam, charge); cross/radial lines; sweep (moving shape, exaflare, rotating beam); field (whole-arena with safe pockets or cover); zone left behind (puddle, mine); tracked (homing, follows one target); attached-to-target (head marker); gaze/facing (turn toward or away). Sources: FFXIV AoE page above.

### (b) Fidelity ladder (what a telegraph can say)

1. Something is coming (a cue only).
2. Where (shape on the ground or the target).
3. When (fill to edge; WildStar fill speed; FFXIV vanishing = snapshot).
4. How much (size, severity, a strong versus weak mark; FFXIV "caution" ring says the size is NOT shown).
5. What kind (damage type, status: colour or motif).
6. How to answer (dodge, stack, spread, parry, look away, interrupt: shape of the marker, e.g. FFXIV stack arrows, GW2 breakbar for interrupt, our parry outline).
Each rung costs more skill to read and more clutter to draw. Inference, built on the sources above.

### (c) Conventions

- Colour: warm (orange/red) = harm to avoid; blue/green = yours and friendly (WildStar); a distinct colour for the "special" case (FFXIV yellow-black caution).
- Timing: fill-to-edge or a closing ring; disappearance as the hit moment (FFXIV).
- Outline: a clear outline and a distinct interior colour is what players asked for in WoW; edgeless cones are the named complaint.
- Icons on markers: arrows (stack, flare, moving), numbers (limit cut), chevrons (tankbuster, homing). Our rule forbids numbers and words on world marks, so use glyph count, arrow count or pip position.
- Head markers sit on a person and say who; ground markers say where. Head markers carry the answer (stack/spread); ground markers carry the place and time.

### (d) Sensibilities and critiques

- Overload: GW2 red-circle saturation, WildStar PvP chaos, ally effects confused with enemy ones.
- "Dance on red circles": telegraph-only readability turns combat into a floor puzzle; GW2 guides themselves say to read animation as well.
- Animation first: Monster Hunter's tells double as an opening; Souls debate is "now" vs "soon".
- Hiding telegraphs as difficulty (FFXIV, WoW private auras) turns the vocabulary into recall; fair only if the vocabulary was taught earlier.
- Telegraph as a reward: seeing the telegraph is a learned skill in raiding; I found no mainstream game that gates seeing telegraphs behind a stat. WildStar made them central, not gated; Into the Breach shows all intent as the premise. So gating by a stat is open design space (the claim "no game does this" is unverified; I searched little).

## 6. Gaps

No official ArenaNet statements; no Blizzard animation-vs-UI statement; Hades/Black Desert/Lost Ark thin; FFXIV gaze, knockback, raidwide, enrage unsourced; tactics threat displays (XCOM, Divinity) not searched.

## 7. Recommendations for our vocabulary

1. Animation is the base: every windup readable with Divination at nothing. Telegraphs only add.
2. Make the fidelity ladder the Divination ladder: level 1 shows where (a plain outline), then when (fill), then what kind (feeling colour), then the answer (shape).
3. Keep one colour per damage type from the Lachryma HUD palette, never harm-orange for everything; use shape as the second channel (colour-blind safe; GAG).
4. Always a clear edge: outline plus distinct inside tint, and the drawn cone must equal the real cone (the WoW frontal complaint).
5. Timing fill goes edge-ward and finishes on the strike frame; no snapshot surprise.
6. Reuse the existing parry outline as the "answer: parry" rung, so one shape word means one answer; the resist mark stays the "answer: refused" word.
7. Reserve a distinct "size unknown" caution style at low levels (FFXIV caution ring), so partial information is honest.
8. Head-marker equivalents for creatures: a glyph on the target for who, a mark on the ground for where; no numbers, only glyph counts.
9. Cap simultaneous telegraphs; collapse overlaps into one drawn union with the strongest colour (GW2 clutter).
10. Do not cull telegraphs by distance or effect LOD before other effects.
11. Hidden telegraphs only where a prior room taught them (FFXIV tiers pattern); never as a surprise.
12. Do not reuse Divination's level to improve accuracy of aim; it widens what is shown, matching the design law "skill skips grind".
13. Offer a knack for an assist version (earned, switchable), not a setting that bypasses learning.
14. Test every telegraph in grayscale and with a deficiency filter before it ships.
15. Make reading a telegraph pay: a correct answer inside its window is the opening (Monster Hunter), so the Divination mark and the reward are one thing.
