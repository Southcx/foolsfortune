# The VFX library, refreshed (Calissa's plan, 2026-10-29)

South: "refresh and revitalize your suite of vfx ... primary and secondary and then tertiary action, naturally layered effects. Gradient
transparency. UV scrolling ... Update the old stock and create a new library of vfx that correspond to the seven domains and seven
emotions ... the class arts ... really flex." Prior art: `docs/ref/VFX-PRIOR-ART.md` (the obscure Square Enix catalogue first).

The kit everything is built on: a **shape layer** (`type: 'shape'`, `src/vfx/shapes/`): one program, procedural forms with UVs made for
scrolling, two tiling patterns (main and mask) scrolled apart, a flow pattern warping them, a gradient ramp over value and life, alpha
erosion over life, edge gradients, a fresnel rim, a hot core, additive or alpha-over in one blend. `ramp: 'feeling' | 'domain' | 'suit'`
and `main: 'motif'` read the caller's context, so one effect is skinned by whoever plays it. An additive layer also covers a share of
what is behind it (`back`, 0.5 by default): on the Dunes' noon sand pure light clips to white and loses its hue; the share dims the
ground under it a little so the colour reads, and on a dark ground it changes nothing.

## 1. The layering law (every effect, no exceptions)

| layer | job | reads at | values | typical kit |
|---|---|---|---|---|
| **primary** | the hero shape: what happened, its silhouette | the first 0.1 s, from across the room | the brightest, the hot core | one `shape` (wave, pillar, dome, spikes, crescent) |
| **secondary** | how it moved and where it went | the next 0.3 s | mid | rings, a trail, streaks, chips, a second shape counter-scrolling |
| **tertiary** | what it leaves in the air | the last second | low, soft | motes, dust, embers, mist, a faint decal, a light's tail |

Timing: **anticipation** (gather, 0.05 to 0.25 s: things drawn in, a ring closing), **impact** (about 0.1 s of white core, six frames at 60: one frame alone does not read at
480 lines; Leroy's hit frame, VFX-PRIOR-ART.md 2.2; the largest shape at its largest), **follow-through** (the shape erodes through its noise, never a plain fade; its ramp cools: `rampShift` down),
**dissipation** (tertiary motes drift and go). A held effect loops its follow-through and stops with an eased fade.
Gradient transparency everywhere: no hard edge on a shape (edgeV / edgeU / ramp alpha), no flat-alpha disc. UV scrolling everywhere a
shape lives longer than 0.2 s: the main pattern flows along the motion, the mask flows against it or slower.
Readability (CLAUDE.md, Feel): no flicker, no strobe; a held thing is calm enough to stand beside play. Screen weight (flash, shake,
hitstop) only on the effects that earn it, and inside the budgets (vfx.js `BUDGETS`).

## 2. The seven domains: a domain is a GRAMMAR (form and motion: what the act does)

Colour: the domain's glaze (`ramp: 'domain'`, src/ui/domainlook.js). Never a feeling's hue.

| domain | its act | primary | secondary | tertiary | its runtime |
|---|---|---|---|---|---|
| Ouranurgy (Ru celadon) | the sky's: called down, opened, turned | a pillar falling from above onto a ground ring | an armillary of thin rings turning at two tilts; a portal's eye | star motes falling slow, a cool column of mist | godhand/powers/space.js |
| Manifestation (shino flashed orange) | what was not, made | spikes and a cone rising out of the ground, crystallising (erosion run backwards: it grows in) | shards drawn inward then set; a flash of orange where it "fires" | dust settling, a few glowing grains | powers/make.js |
| Divination (yohen tenmoku) | seeing | a lens: a thin ring expanding on the plane, a sonar sweep, an iris opening | scan lines climbing, star spots blinking out from the centre | violet-silver specks hanging, slowly fading | powers/sight.js |
| Psychokinesis (oxblood) | the push and the lift | a wave wall or shockwave ring thrown out, its front bright, its back dragging | lifted debris and chips orbiting, a flow-warped distortion band | dust curtain, a pale rim ring lingering | powers/force.js |
| Possession (Jun blue, purple splash) | reaching in | tethers (beams) reaching from the caster into the target, a spiral drawn inward | a shell closing over the target, a collar ring on it | a purple haze breathing, motes drawn in | powers/will.js |
| Alteration (flambé) | what is, turned | a band sweeping up a body or across the ground, the ramp running red to blue across it | crescents turning, petals or flakes changing colour as they fall | a shimmer (flow) left where it passed | powers/alter.js |
| Spellscription (cobalt on white) | written | strokes written in the air (crescent ribbons with the `script` pattern), a circle drawn on the ground | a band of script circling at chest height, a seal stamped | ink motes, a faint written ring left on the ground | powers/script.js |

Moments (names): `domain.<id>.cast` (the act, from anticipation to dissipation), `.hold` (held: a channel or a ward), `.hit` (where it
lands on a thing), `.level` (on `domain.level`: the domain's whole grammar in one celebratory beat at the Courier). Hook them where the
runtime already says the moment: `domain.level`; the god powers (`god.<id>` events with `act`: godhand/powers.js; their existing marks
are `game.godhandLooks`, vfx/godhand/, keep those and add the library's effect beside them, never two looks of one thing); the PvE
duel's seven powers (vfx/duelview/powercast.js: each power's beat may play its domain's cast on the tsuitate's scale).

## 3. The seven feelings: a feeling is a SKIN (palette, motif and motion character: how it feels)

Colour: `ramp: 'feeling'` (progress/weather.js COLOR). Pattern: `main: 'motif'` (the paint motifs). Motion character:

| feeling | motif | motion | what it does to a shape |
|---|---|---|---|
| Wonder | frost | slow, rising, hushed | crystalline needles grow at the edge, diamond dust glints, everything a little slower |
| Mirth | dots | bouncy, popping | rings pop in steps, dots bubble up, small things bounce (gravity and a hop) |
| Desire | ripples | pulled inward, a heartbeat | contracts then swells twice (a pulse), ribbons drawn toward the centre |
| Fury | cracks | fast, outward, jagged | cracks race across, embers thrown hard, a hard core, a short sharp shake |
| Gall | curds | viscous, dripping, corroding | drips fall and splat, bubbles rise and burst, an alpha-over bile film |
| Grief | streaks | slow, falling, sinking | streaks run down like rain on glass, everything settles low, long dissipation |
| Dread | marbling | creeping, contracting, dark | alpha-over ink smoke (`add: 0`), it closes in rather than out, the light goes |

Moments: `feeling.<id>.burst` (an impact), `.splash` (a liquid of it spilt), `.aura` (held round a body), `.trail` (held on a moving
thing), `.rise` (an awakening's surge round the Courier: the biggest), `.drink` (drawn into the Courier). Hook: `feeling.wake` (beside
`game.awakeningLook`, never a second flood: the library's rise is its secondary and tertiary), the caster shells' feeling landings
(`shell.<feeling>.land` extends `feeling.<feeling>.burst`), the draught (where the pool drinks a feeling: courier/mind.js reads
`g.draught`), a duel's clear where its gems are a feeling (vfx/duelview/: small, the board's scale).

## 4. The class arts (76): a class art is a DOMAIN's grammar in its SUIT's colour

`ramp: 'suit'` (src/vfx/readingview.js SUIT_LOOK; a Major's suit is progress/spreads.js MAJOR_SUIT; a wild Major wears the film).
Actions: `art.<id>.use`; held actions also `art.<id>.hold` (played for the art's `does.dur`, stopped on `art.end`); reactions:
`art.<id>.fire`, all on a shared base **`art.react`** (Final Fantasy Tactics' reaction flash: a quick vertical ring and the suit's
pip rising off the body, 0.4 s) with the art's own image added where it has one. The runtime is Petra's (courier/classarts/body.js,
events `art.use { art }`, `art.fire { art }`, `art.end { art }`, `vessel.ward`); the looks are played by `vfx/classartlooks.js`, which
moves from its hand-built marks to these library effects (the old marks go in the same change). An art that acts away from the body
(Spark's ember, Mark for Death, Tame, Ride, Shackle, Blink Mark) wants the event to say where (`at`, `target`): use it when present, the
Courier when not, and ask Petra for the field in a handoff note.

| art (class) | domain | image |
|---|---|---|
| Spark (Page of Wands) | manifestation | an ember flicked in an arc; lands in a small bloom that eats a blot |
| Onrush (Knight of Wands) | psychokinesis | a wave along the dash's line, chips thrown off its sides |
| Stoke (Queen of Wands, held) | alteration | a heartbeat of embers at the chest, rising sparks |
| Roar (King of Wands) | psychokinesis | a shockwave ring 8 m, a dust curtain, windups snapped |
| Offering (Page of Cups) | manifestation | a cup of light set down, a calm ring 6 m |
| Water Walk (Knight of Cups, held) | alteration | rings at each footfall on the surface, a skim wake |
| Catch the Rain (Queen of Cups) | ouranurgy | the sky poured down a column into the Bottle |
| Still Waters (King of Cups) | possession | a disc of still water spreading 6 m, ripples laid flat |
| Scout (Page of Swords) | divination | a sonar ring out to 40 m, steel-pale |
| Riposte Rush (Knight of Swords) | psychokinesis | a crescent cut behind the target, the blink's afterimage |
| Clear Sight (Queen of Swords, held) | divination | an iris opened at the eyes, a faint lens dome |
| Mark for Death (King of Swords, held) | spellscription | a written ring over the target's head, tightening |
| Prospect (Page of Pentacles) | divination | a ping cone ahead 30 m, a marker at the strongest source |
| Bulwark (Knight of Pentacles, held) | manifestation | a braced shell of hard light, gold rims |
| Harvest (Queen of Pentacles) | alteration | a ripening burst, gold motes rising |
| Earth Wall (King of Pentacles, held) | manifestation | spikes and dust ahead as the wall rises, cracks on the ground |
| Ram (Emperor) | psychokinesis | a wave wall thrown 10 m ahead |
| Tame (Strength) | possession | tethers into the creature, a collar ring |
| Blink Mark (Temperance) | ouranurgy | a thrown eye (a small portal) where you'll blink |
| Ride (Chariot, held) | possession | reins of light to the creature |
| Reap (Death) | alteration | a scythe's crescent, 3 m, what it downs dims |
| Vanish (Moon) | alteration | the body eroding into mist, a decoy left |
| Payback (Justice, held) | spellscription | a balanced ring of script, a beam back to the striker |
| Starlight (Star) | ouranurgy | a column of night sky, star motes falling |
| Encore (Lovers) | spellscription | a written ghost replaying the last move |
| Shackle (Devil, held) | spellscription | chain links of script round the creature |
| Sanctum (Hierophant, held) | spellscription | a circle 5 m drawn on the ground, a faint dome |
| Lamp (Hermit, held) | manifestation | a lamp made, a soft sphere of light 8 m |
| Completion (World, held) | all seven | an armillary of the seven domains' glazes turning |
| Quick Swap (Magician) | alteration | a card flipped at the hand |
| Veil (Priestess) | possession | a veil of mist over you, an eye closing on the creature |
| Overgrowth (Empress) | manifestation | a thicket rising 6 m, leaves |
| Spin (Wheel) | divination | a wheel of fortune turning overhead, its pip landing |
| Collapse (Tower) | psychokinesis | the ground falling in 4 m, stones from above |
| Daybreak (Sun) | ouranurgy | a sun disc, a ring of rays, a flash |
| Hang Time (Hanged, held) | ouranurgy | a slow clock ring round the body |
| Settle the Score (Judgement) | spellscription | beams from each creature that hurt you, a verdict burst |

**The rank ladder** (Riot's importance by size, saturation and opacity; VFX-PRIOR-ART.md 4): a Page's art is a basic attack (small,
quick), a Knight's a damage spell (a clear strike), a Queen's a held, defensive one (soft: lower saturation and opacity, calm enough to
stand beside play), a King's and a zodiac Major's a game changer (big, earned screen weight), the World's the ultimate. A reaction is
its class's action **quietened**, never a new effect (the Knight of Pentacles' Steadfast is Bulwark's shell in a whisper). The suit's
colour also rides every swing trail while a class is read, as Chrono Cross puts a character's colour on the weapon trail (a later pass).

Reactions (38) on `art.react`, each with its image where it has one (Gallant: a gold ring on the parry; Momentum: the ember band armed,
then a burst on the blow; Steadfast: a gold ring at the feet armed, the ward's pale on the blow; Rebirth: a kintsugi burst; Hope: made
whole with a pool's glow; Rally: motes from the downed into the Courier; Edge: a gold glint; Running on Empty: a slow ring of the film).

## 5. The old stock

Every effect in `src/vfx/library.js` gets the law of section 1. The most seen first: `hit.*` (25), `damage.*` (5), the generics
(`impact`, `shock`, `poof`, `absorb`, `implode`, `embers`, `cut`), `aura.*` (14), `temper.*` (4), `ult.*`. Keep each name and what it
says (DOCS: VFX.md "what the hit says": stars and a ring landed, streaks how hard, gold a weak point, labradorite the Mind, a grey puff
nothing). Give each a primary shape layer where a sprite stood in for one, a secondary that moves, and a tertiary that lingers; keep the
counts inside the budgets.

## 6. Checking (South: "with screenshots at full resolution")

After any change to the library, regenerate the catalogue: `node scripts/vfxcatalogue.mjs` writes `docs/VFX-CATALOGUE.md` (South: "a
note for yourself of exactly what vfx you have available").

`node scripts/vfxgallery.mjs --match <prefix>` at `--size 1920x1080` and `--phone`; a contact sheet a family. Then in the game at the
phone's 896 x 414 at 2x (CLAUDE.md, Scope): read each as a human would.
