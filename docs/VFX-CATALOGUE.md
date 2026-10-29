# The VFX catalogue (generated: do not edit)

Every effect the game can play, read from the code by `node scripts/vfxcatalogue.mjs` (2026-10-29). 356 effects in 31 families. How effects are made and named: docs/VFX.md; the library's plan: docs/plans/art/VFX-LIBRARY.md.

**Play one:** `game.vfx.play(name, { pos, dir, normal, tint, power, scale, feeling, domain, suit, follow })`; a held one returns a handle (`h.pos`, `h.k`, `h.stop()`). A name falls back from the most particular (`hit.slash.crystal` -> `hit.slash` -> `hit`), so a new name always plays something.

## The building blocks

| block | what there is |
|---|---|
| sprite shapes (`vfx/sprites.js`) | soft, core, star4, sparkle, streak, ring, ringthin, puff, shard, diamond, glint, swirl, petal, crescent, chip, bubble, hex, facet, drip, ripple, disc, talisman, moth, leaf, die, comb |
| decal textures | circle_lotus, circle_swirl, shockring (drawn), scorch (drawn), pentacle (drawn) |
| baked effect meshes (`src/assets/vfx/*.glb`, Mesh Create) | chest_circle, chest_helix, chest_shock, ult_crown, ult_dome, ult_helix, ult_pillar, ult_vortex |
| caster shaders (`vfx/caster/`) | bubble, corrupted, frostbisque, heathaze, hologram, lensing, lightning, molten, portal, timegrade |
| shape layer forms (`vfx/shapes/forms.js`) | ring, band, dome, sphere, cone, disc, quad, beam, spiral, crescent, pillar, wave, spikes |
| shape layer patterns (`vfx/shapes/textures.js`) | noise, cells, streaks, ripple, cracks, dots, marble, frost, curds, rays, stars, script |
| shape layer ramps (`vfx/shapes/ramps.js`) | wonder, mirth, desire, fury, gall, grief, dread, ouranurgy, manifestation, divination, psychokinesis, possession, alteration, spellscription, wands, cups, swords, pentacles, wild, film, gold, ember, white, ink, tint; and 'feeling', 'domain', 'suit', 'tint' from the caller |

Layer types: sprites, mesh, decal, shape, caster, flash, light, shake, hitstop, smear, glyph, sound, fx (vfx/vfx.js header).

### The caster shaders

- **bubble**: THE BUBBLE (S2 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): a fresnel dome of glass, glaze or hard light. Stasis's and the Slow Field's sphere edge (51...
- **corrupted**: THE CORRUPTED BODY (caster shader S10): the glitch (vfx/glitch.js) brought off the screen and onto one mesh, for shell 97 Corrupt (.hack's data drain: docs/plans/CASTE...
- **frostbisque**: FROST AND BISQUE (S4 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): a skin that GROWS over a body from where it was hit, a dissolve's mask run the other ...
- **heathaze**: HEAT HAZE (S1 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): the world seen through hot air, bent inside a volume. A flame's cone (the Flamer, 21), the a...
- **hologram**: THE HOLOGRAM (caster shader S8): a body of hard light, for shell 63 Double (a hologram of you the creatures chase), 76 Holowall (a hex wall of hard light) and 93 Visib...
- **lensing**: LENSING (caster shader S6): a black hole's bend of the frame and its accretion ring, for the Caster's own black holes (shells 94 Inside Out and 95 Leyline: docs/plans/...
- **lightning**: LIGHTNING (S3 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): a procedural bolt, branching, alive. The whole Storm family (31 to 40): the Tesla Node's whi...
- **molten**: MOLTEN (caster shader S9): a lava-lamp metaball with a crust, for the Firebox's shells (22 Meteor, 23 Lava Lamp, 29 Volcano, 30 Slag Rain: docs/plans/CASTER-SHELLS.md)...
- **portal**: THE PORTAL (S5 of the caster shells' shaders, docs/plans/CASTER-SHELLS.md): a hole in the world rimmed in crude. The Portal shell's linked pair (44: two ovals, each sh...
- **timegrade**: THE TIME GRADE (caster shader S7): inside a sphere, the colour drained and the grain frozen, for the Clock's shells (51 Stasis, 52 Slow Field, 54 Rewind, 58 Stop-Motio...

## The effects, by family

Columns: the name; held (plays until stopped) or a one-shot; its layers (type:what ×count, its `extends` included); what it is (its comment in the source); who asks for it by that exact name (many are asked by a built name, e.g. `hit.${kind}.${material}`, and show none).

### shell (142)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `shell.agate.fly` | held | sprites:soft | 88 Agate: a banded stone, its two colours swirling off it |  |
| `shell.agents.fly` | held | sprites:soft, sprites:glint | 72 Agents: tiny clappers with fuse tails, sputtering |  |
| `shell.ballLightning.fly` | held | sprites:streak, sprites:core | 33 Ball Lightning: a violet orb, its tendrils feeling about it |  |
| `shell.balloon.land` | held | sprites:puff, sprites:bubble | 46 Balloon: the body bobbing on the air, light bubbles rising from under it |  |
| `shell.barrier.fire` | held | sprites:streak | 77 Barrier: arcs crawling over the dome (the glass is S2's) |  |
| `shell.bisque.land` | held | sprites:puff, sprites:glint | 27 Bisque: terracotta dust off the body as the bisque spreads (the skin is S4's, the runner's) |  |
| `shell.bloom.land` | one-shot | sprites:streak, sprites:petal, sprites:sparkle | 57 Bloom: gold lines knitting in to the point, green rising out of the ground round it |  |
| `shell.bookmark.back` | one-shot | sprites:ring, sprites:streak |  |  |
| `shell.bookmark.fire` | held | sprites:ringthin, sprites:glint | 59 Bookmark: a gold ring held where you stood, a glint over it; and where you come back to, a gold fold |  |
| `shell.brainwash.land` | held | sprites:star4, sprites:ring, sprites:glint |  |  |
| `shell.calm.fire` | held | sprites:ringthin, sprites:core, sprites:soft | 89 Calm: where the red beam falls, the air goes clear and still: a red ring laid out, dust settling straight down |  |
| `shell.capacitor.fire` | one-shot | sprites:core, sprites:ring, sprites:streak, flash | 37 Capacitor: where the pillar falls, a white scorch ring and the charge thrown up (bigger, the longer it charged: `power`) |  |
| `shell.cartwheel.fly` | held | sprites:puff | 17 Cartwheel: a clay wheel rolling, a skirt of dust behind it; the creature it runs over flattened in a burst of dust |  |
| `shell.cartwheel.touch` | one-shot | sprites:puff, sprites:ring |  |  |
| `shell.chainBolt.fly` | held | sprites:streak, sprites:soft | 32 Chain Bolt: a white-blue spark crackling in flight, a star where it first bites (the jumps are S3's) |  |
| `shell.chainBolt.land` | one-shot | sprites:star4, light |  |  |
| `shell.cinder.fly` | held | sprites:puff, sprites:soft | 28 Cinder: one ember and its ribbon of smoke | vfx/shelllooks/ember.js |
| `shell.clock.fly` | held | sprites:soft, sprites:ringthin | the Clock's rounds: pale gold motes and a ring ticking off them |  |
| `shell.clod.fly` | held | sprites:puff |  |  |
| `shell.corrupt` | one-shot | caster:corrupted | 97: the body hit drawn as broken data, then drained into the point it was shot from; ctx.target the body | tools/psygun/shellcastersown.js |
| `shell.corrupt.fly` | held | sprites:hex | 97 Corrupt: a round of broken cells, magenta and cyan |  |
| `shell.desire.land` | held | mesh:chest_shock×2, sprites:soft | rings drawing in along the ground, a warm pull of light |  |
| `shell.detonator.fly` | held | sprites:soft | 25 Detonator: a putty lump with a glaze bead (its body: shelllooks.js); a red spark trailing it |  |
| `shell.double.fire` | one-shot | sprites:streak, sprites:hex, sprites:ringthin |  |  |
| `shell.dread.land` | one-shot | sprites:puff, sprites:swirl | shadows spreading along the ground, Dread's marbling in them |  |
| `shell.droneHalo.fire` | held | sprites:soft | 73 Drone Halo: the kilns' glowing mouths leave embers in their orbit over you |  |
| `shell.echo.fire` | held | sprites:sparkle | 55 Echo: the haste of a second you about you (the ghosts themselves are vfx/afterimage.js's) |  |
| `shell.faradayCage.land` | held | sprites:glint | 36 Faraday Cage: its edges humming, sparks running up the corners (the arcs are S3's) |  |
| `shell.flamer.fire` | held | caster:heathaze, sprites:puff, sprites:soft, sprites:streak | extends `caster.heatHaze.flame`. 21 Flamer: heat haze over an orange-to-white flame along the aim, ash drifting up (held for its dur at the muzzle) |  |
| `shell.forgetMe.courier` | held | sprites:puff |  |  |
| `shell.forgetMe.land` | one-shot | sprites:puff | 70 Forget Me: a grey fog over the Courier (how it sees you now), a breath of it where it struck |  |
| `shell.fury.land` | held | sprites:star4, sprites:shard, sprites:ring | cracks of red thrown off the body, a hard ring pulsing out of it |  |
| `shell.gall.land` | held | sprites:puff, sprites:bubble | a curdled cloud | vfx/shapes/ramps.js |
| `shell.ghost` | held | sprites:soft | (what keeps the shells' afterimages ticking while any shows: shelllooks/kit.js leaveGhost; it draws nothing of its own) | vfx/shelllooks/kit.js |
| `shell.glassmaker.fly` | held | sprites:soft | 26 Glassmaker: a lump of sand streaming grains; where it lands the sand flashes white-hot and cools green, glinting |  |
| `shell.glassmaker.land` | one-shot | sprites:core, sprites:facet, sprites:puff |  |  |
| `shell.godHand.land` | one-shot | sprites:ring, sprites:puff, sprites:streak | 98 God Hand: a dark hole torn in the sky over where it lands, the hand's reach falling out of it (the slam is the hand's own) |  |
| `shell.golem.land` | one-shot | mesh:chest_shock, sprites:puff, sprites:chip, sprites:core, shake | 78 Golem: the ground heaves up into a body: a great ring of dust, clods thrown, the ground shaking |  |
| `shell.grief.land` | held | sprites:puff, sprites:streak | one cloud over its head, raining on it | vfx/vfx.js |
| `shell.hailstorm.fire` | one-shot | sprites:core, sprites:ring, sprites:shard, sprites:glint, sprites:puff | 14 Hailstorm (refired at twice the size): thirty-two shards in the glazes' colours out of the muzzle at once in a ring of white and a spray of frost; where the cone lands, a white star, a ring out along the ground, the ground frost-bitte... | vfx/shelllooks.js |
| `shell.hailstorm.land` | one-shot | sprites:star4×2, decal:shockring×2, decal:scorch, sprites:shard, sprites:puff, sprites:glint |  | vfx/shelllooks.js |
| `shell.holowall` | one-shot | caster:hologram | 76: a hex wall of hard light; the caller's tint is your glaze's | tools/psygun/shelldeployables.js |
| `shell.holowall.fire` | one-shot | sprites:hex | 76 Holowall: hard light thrown up from your feet as the wall stands (the wall is S8's and S2's) |  |
| `shell.hydra.fire` | one-shot | sprites:crescent, sprites:core | 75 Hydra: six heads uncoiling out of the muzzle, each lance a gold tail |  |
| `shell.hydra.fly` | held | sprites:soft |  |  |
| `shell.infector.land` | held | sprites:soft, sprites:bubble, sprites:drip | 61 Infector: a green glow, a sickly bubbling round the body (held while it is infected) |  |
| `shell.inhaler.fire` | held | sprites:soft, sprites:swirl | 41 Inhaler: a vortex at the muzzle drawing in (held while it draws; the clods it spits fly as clods) |  |
| `shell.insideOut` | one-shot | caster:lensing, sprites:glint, sprites:puff, sprites:streak, sprites:ring | (each a `caster` layer: its module's look, placed, scaled and faded as a mesh is; the runner's other layers go beside them) | tools/psygun/shellcastersown.js |
| `shell.insideOut.land` | one-shot | decal:shockring×3, sprites:chip, decal:scorch, sprites:shard | 94 Inside Out, on the ground: a ring closing in on the hole, the ground's chips drawn up into it; then spat out, a ring running out past the screen, the turned-out shards lying where they fell |  |
| `shell.land` | one-shot | sprites:ringthin, sprites:sparkle | where any of them lands without a look of its own: a ring and a glint of its colour | tools/psygun/shellspacetime.js, vfx/shelllooks/tiers.js, vfx/shelllooks.js |
| `shell.lastWord.land` | held | sprites:ring, sprites:star4 | 60 Last Word: a ring over the head closing on the beat until the words come due |  |
| `shell.lavaLamp` | one-shot | caster:molten | 23: a glob of molten clay, crusting over as it goes | tools/psygun/shellsplitchain.js |
| `shell.lavaLamp.fly` | held | sprites:drip | 23 Lava Lamp: drops of its wax falling as it drifts (the glob itself is S9's, the runner's) |  |
| `shell.leadweight.land` | held | mesh:chest_shock, sprites:puff×2 | 47 Leadweight: the ground dimples under it; dust settling |  |
| `shell.leyline.land` | held | sprites:sparkle, sprites:ring | 95 Leyline: a pillar of stars from where it struck to the sky while the creature is up there |  |
| `shell.lightningRod.land` | held | sprites:star4, sprites:ringthin, sprites:sparkle | 35 Lightning Rod: a copper glint on the body that holds it |  |
| `shell.lodestone.fire` | held | sprites:ringthin, sprites:glint | 39 Lodestone: the floating iron star rung by slow rings, iron glints drawn in to it |  |
| `shell.lullaby.land` | held | glyph×4, sprites:sparkle, sprites:puff | 68 Lullaby: a cloud of drifting notes (the notes themselves are Wanda's, in the music's scale) |  |
| `shell.mallet.fly` | held | sprites:puff | 16 Mallet: the clay head that bloomed in flight slams down: a ring along the floor, a cake of dust, chips |  |
| `shell.mallet.land` | one-shot | sprites:core, mesh:chest_shock, decal:shockring×2, decal:scorch, sprites:puff, sprites:chip, sprites:facet, shake, hitstop |  | tools/psygun/shellcastersown.js |
| `shell.marionette.land` | one-shot | sprites:streak, sprites:ringthin | 80 Marionette: threads of light let down from the sky to where it struck |  |
| `shell.meteor.end` | one-shot | sprites:core, mesh:chest_shock, decal:shockring×2, decal:scorch, sprites:drip, sprites:streak, sprites:chip, sprites:puff, sprites:glint, light | where each lands (size 3): a white-hot core, a ring of fire out along the ground, a scorch, molten drips and char that lie a while |  |
| `shell.meteor.fire` | held | decal:shockring×2, sprites:glint | 22 Meteor: the spot marked by ember rings closing on it on the ground until the sky answers, a wider red one for the mega meteor |  |
| `shell.meteor.fly` | held | sprites:soft, sprites:streak, sprites:puff | each of the three, written at size 3: a molten trail as wide as a person, smoke behind it |  |
| `shell.meteor.mega.end` | one-shot | sprites:core×2, sprites:star4, flash, light, mesh:chest_shock×2, decal:shockring×4, decal:scorch, caster:heathaze, sprites:soft×2, sprites:puff×4, sprites:streak, sprites:drip, sprites:chip, sprites:facet, sprites:glint | where it lands (size 5, its reach 7 m; drawn twice that): the sky white for a breath, a ring of fire out past the screen's edge, a column of fire twice a house's height opening into a mushroom of fire and smoke, a crater burnt black and ... |  |
| `shell.meteor.mega.fly` | held | caster:heathaze, sprites:soft, sprites:core, sprites:streak, sprites:puff | the mega meteor (written at size 5; refired at twice that, the owner's "still too weak"): a falling hill of molten rock, a fire trail you could drive a cart down, the air swimming round it |  |
| `shell.mindSwap.land` | held | sprites:swirl, sprites:sparkle | 69 Mind Swap: a thread of light marked over the head it struck (the trade between two heads is S3's bolt) |  |
| `shell.minefield.land` | one-shot | sprites:puff, sprites:glint | 79 Minefield: the mines thrown out in a scatter of dust and glints |  |
| `shell.mirth.land` | one-shot | sprites:star4, sprites:disc | confetti in Mirth's dots |  |
| `shell.moonlet.fire` | held | sprites:soft | 48 Moonlet: what it catches circling you like rings round a moon |  |
| `shell.napalm.land` | held | sprites:drip, sprites:soft, sprites:glint, sprites:puff, light | 24 Napalm: the slick (the paint map's oil film, its labradorite flash) catches a second later and burns |  |
| `shell.overdrive.fire` | held | sprites:ringthin, sprites:streak | 53 Overdrive: a gold tick going out from the hands on the beat, the tools' haste in the air round them |  |
| `shell.paranoia.land` | one-shot | glyph×4 | 67 Paranoia: question marks popping over it as its eyes dart |  |
| `shell.petalRain.bloom` | one-shot | sprites:star4, sprites:ringthin, sprites:petal | 19 Petal Rain: it hangs, then blooms: a ring of glazed petals out of it, each falling in a slow spiral and ringing where it lands |  |
| `shell.petalRain.fly` | held | sprites:sparkle |  |  |
| `shell.petalRain.touch` | one-shot | sprites:ringthin |  |  |
| `shell.piercer.fire` | one-shot | sprites:core, sprites:streak | 15 Piercer: a white core at the muzzle and a spray along the line (the glass tube is the runner's heat haze) |  |
| `shell.pinball.fly` | held | sprites:soft | 18 Pinball: chrome, its tail reddening with its speed (shelllooks.js turns the tint); each wall rings like a bumper |  |
| `shell.pinball.touch` | one-shot | sprites:ring, sprites:star4, sprites:glint |  |  |
| `shell.portal.fire` | one-shot | sprites:drip, sprites:ripple | 44 Portal: crude splashed where each end opens (the ovals and their views are S5's) |  |
| `shell.pottify.land` | one-shot | sprites:puff, sprites:drip, glyph | 64 Pottify: a puff of slip (the pot's body is M7's, later) |  |
| `shell.prismatic.fire` | one-shot | sprites:streak, sprites:swirl, sprites:sparkle | 90 Prismatic: all seven out of the muzzle in a spiralling band |  |
| `shell.rewind.land` | held | sprites:swirl, sprites:sparkle | 54 Rewind: a ring running backward into the body, its motes falling up |  |
| `shell.ricochetSaw.fly` | held | sprites:crescent, sprites:glint | 11 Ricochet Saw: a fired-clay throwing wheel, its gold rim, a smear of motion; sparks at each bounce |  |
| `shell.ricochetSaw.touch` | one-shot | sprites:star4, sprites:streak |  |  |
| `shell.ryno.end` | one-shot | sprites:core, sprites:soft, decal:shockring×2, decal:scorch, sprites:puff, sprites:chip | written at size 1, played at 2.5: shelllooks/caster.js's row |  |
| `shell.ryno.fire` | one-shot | sprites:puff, sprites:core, shake | 92 RYNO: the volley out of the muzzle in a wall of smoke; each rocket a spiralling smoke tail and an ember; a blast ring and scorch each |  |
| `shell.ryno.fly` | held | sprites:puff, sprites:soft |  |  |
| `shell.shabti.land` | one-shot | sprites:puff, sprites:glint | 71 Shabti: blue faience dust where the little servants climb out |  |
| `shell.shrinker.land` | held | sprites:ringthin, sprites:sparkle | 50 Shrinker: rings closing in on the body as it goes small |  |
| `shell.skipstone.fly` | held | sprites:sparkle | 12 Skipstone: a flat Lachrymite stone glinting, a ring laid on the ground at each skip (on crude, its oil film) |  |
| `shell.skipstone.touch` | one-shot | mesh:chest_shock, sprites:puff, sprites:soft |  |  |
| `shell.skipstone.touch.crude` | one-shot | mesh:chest_shock, sprites:puff, sprites:soft, sprites:ripple | extends `shell.skipstone.touch`.  |  |
| `shell.slagRain.fly` | held | sprites:streak |  |  |
| `shell.slagRain.hiss` | one-shot | sprites:puff, sprites:soft |  |  |
| `shell.slagRain.land` | held | sprites:ringthin, sprites:puff | 30 Slag Rain: thrown up in a hiss; the drops fall as glowing streaks, steam where each lands |  |
| `shell.slingshot.fly` | held | sprites:soft | 42 Slingshot: a well drawing dust and light round and in; at its end, everything flung out of it | vfx/shelllooks/caster.js |
| `shell.slingshot.land` | held | decal:shockring×3, sprites:swirl, sprites:puff×2, sprites:glint, sprites:streak, sprites:ring, mesh:chest_shock, decal:scorch, sprites:chip | played at scale 2: shelllooks/pull.js's row; the fling at 1.5 real s, its `dur` |  |
| `shell.splitter.fly` | held | sprites:streak | 13 Splitter: a white needle split into its colours, seven threads at the wall |  |
| `shell.splitter.thread` | held | sprites:streak |  |  |
| `shell.splitter.touch` | one-shot | sprites:star4, sprites:streak |  |  |
| `shell.stageFright.land` | held | mesh:ult_pillar, sprites:soft, light | 66 Stage Fright: a spotlight from nowhere on each one frozen, motes hanging in its beam |  |
| `shell.stake.fly` | held | sprites:glint | 20 Stake: a ceramic stake, gold kintsugi seams on it; where it bites, gold cracks spider out |  |
| `shell.stake.land` | held | sprites:star4, sprites:streak, sprites:chip, sprites:glint |  |  |
| `shell.stasis` | one-shot | caster:timegrade | 51: a sphere of stopped time, its colour drained and its grain frozen | tools/psygun/shellspacetime.js |
| `shell.staticCling.land` | held | sprites:star4, sprites:streak, sprites:glint | 38 Static Cling: sparks where the props meet the body, crackling in to it |  |
| `shell.stopMotion` | one-shot | caster:timegrade | 58: the zone drawn at twelve frames a real second, half drained | tools/psygun/shellspacetime.js |
| `shell.swap.land` | one-shot | sprites:core, sprites:ringthin, sprites:sparkle | 49 Swap: a pale fold shutting where you were and where it struck | vfx/shelllooks/clock.js |
| `shell.tauntDoll.fly` | held | sprites:sparkle | 62 Taunt Doll: the painted doll spinning where it was set down; its bell's ring seen as a ring going out from it |  |
| `shell.tauntDoll.set` | held | sprites:ringthin, sprites:glint |  | vfx/shelllooks.js |
| `shell.teslaNode.land` | held | sprites:ring, sprites:core, sprites:streak | 31 Tesla Node: a glazed insulator; its tip lit and fizzing while it lives |  |
| `shell.theFool.fire` | one-shot | sprites:swirl, sprites:ring, sprites:diamond | 99 The Fool: the wheel of odds spun at the muzzle, all seven colours round it |  |
| `shell.thirteen.beam` | one-shot | sprites:soft, sprites:streak, sprites:sparkle | ctx from, to: the muzzle and where it ends |  |
| `shell.thirteen.fire` | one-shot | flash, sprites:core, sprites:star4, sprites:streak, shake, hitstop | 96 Thirteen: the screen goes white with it, green and gold at the muzzle; a bolt as wide as a house the whole way out; where it ends, the ground torn up, burnt and glinting |  |
| `shell.thirteen.land` | one-shot | sprites:core, decal:shockring×4, decal:scorch, sprites:streak, sprites:chip, sprites:puff, sprites:glint |  |  |
| `shell.thunderhead.fire` | held | sprites:puff×3, sprites:streak, sprites:core, sprites:glint | 34 Thunderhead (refired at twice the size): a low black anvil twenty metres across, banked high, its own rain a curtain under it and its belly lit from inside |  |
| `shell.thunderhead.strike` | one-shot | sprites:core, sprites:star4, mesh:ult_pillar, flash, light, decal:shockring×2, decal:scorch, sprites:streak, sprites:chip, sprites:puff, sprites:glint | where a bolt falls: a white star, a pillar of light from the cloud down, a blue ring out along the ground, the sand fused black and fizzing a while |  |
| `shell.tier.2.fly` | held | sprites:sparkle | ---- II: a pale sparkle riding the round |  |
| `shell.tier.3.crown` | one-shot | decal:scorch | the strongest rare: a gold sunburst burnt in, lying eight real seconds |  |
| `shell.tier.3.fire` | one-shot | sprites:ring, sprites:glint, light |  |  |
| `shell.tier.3.fly` | held | sprites:soft, sprites:glint | ---- III: gold |  |
| `shell.tier.3.land` | one-shot | sprites:ringthin, sprites:glint, light | the afterburst: a beat after the shell's own landing, a gold ring and glints |  |
| `shell.tier.3.mark` | one-shot | decal:shockring×2 |  |  |
| `shell.tier.4.fire` | one-shot | sprites:star4, sprites:ring, sprites:ringthin, sprites:streak, light, shake |  |  |
| `shell.tier.4.fly` | held | sprites:soft, sprites:sparkle, sprites:diamond | ---- IV: the Caster's own, the film |  |
| `shell.tier.4.land` | one-shot | hitstop, sprites:streak, sprites:ring, sprites:star4, sprites:core, sprites:sparkle, sprites:diamond, light, shake | the held beat, then the afterburst at 0.2 |  |
| `shell.tier.4.mark` | one-shot | decal:shockring×4, decal:scorch×2, sprites:glint | the film ring running out past the screen, a gold one after it, and the kintsugi sunburst burnt in |  |
| `shell.tier.4.screen` | one-shot | flash, smear, caster:timegrade | the big-moment screen passes: off with `visual.glitch` |  |
| `shell.tier.4.toll` | one-shot | sprites:chip, sprites:glint, sprites:ringthin | the toll seen: the vessel's clay spalling off the Courier, the gold of its mending in the cracks |  |
| `shell.trail` | held | sprites:soft | (docs/plans/CASTER-SHELLS.md section 3's look column; vfx/shelllooks.js plays them by shell id: `fly` while its round is in the air, `touch` at each bounce, `land` where it lands, `fire` at the muzzle, `set` on a thing set down. A held o... | vfx/shelllooks/tiers.js, vfx/shelllooks.js |
| `shell.turret.land` | one-shot | sprites:puff, sprites:chip | 74 Turret: set down in a ring of dust and clay chips |  |
| `shell.twelve.fly` | held | sprites:soft | 40 Twelve: a gold shell with a blue band; a blue wave out to its reach where it bursts (the sleep's pulse is the runner's) |  |
| `shell.twelve.land` | one-shot | mesh:chest_shock, sprites:sparkle |  |  |
| `shell.upfall.land` | held | sprites:ringthin, sprites:streak, sprites:puff, sprites:drip | 45 Upfall: dust and drops falling up a faint pillar of inverted rain |  |
| `shell.visibomb.fly` | held | sprites:hex, sprites:soft | 93 Visibomb: a chrome-cyan eye in flight, a trail of hard-light cells |  |
| `shell.volcano.fly` | held | sprites:soft, sprites:puff |  |  |
| `shell.volcano.land` | held | sprites:core×2, decal:shockring×2, decal:scorch, sprites:puff×2, sprites:chip, sprites:soft, sprites:streak, sprites:glint, light | 29 Volcano (refired at twice the size): the cone heaves up out of a ring of dust thrown out along the ground; its mouth throws a fountain of fire fifteen metres high and a column of smoke three storeys for as long as it lives, a glow ove... |  |
| `shell.volcano.splat` | one-shot | sprites:core, decal:shockring×2, decal:scorch, sprites:drip×2, sprites:puff, sprites:chip |  |  |
| `shell.weatherAway.land` | one-shot | caster:frostbisque, sprites:puff, sprites:chip | extends `caster.craze`. 56 Weather Away: crazing spreads over the clay hit (S4's craze) and dry flakes fall off it |  |
| `shell.wonder.land` | held | sprites:ring, sprites:streak, sprites:sparkle | 81 to 87, the Feelings: each its feeling's colour (the context's tint) and its paint motif |  |
| `shell.zodiac.fire` | held | sprites:puff, sprites:sparkle, sprites:star4 | 91 Zodiac: night over the whole fight, stars pricking out across it, the twelve signs wheeling overhead |  |
| `shell.zodiac.strike` | one-shot | sprites:star4, sprites:core, decal:shockring×2, decal:scorch, sprites:sparkle×2, light |  |  |

### raceway (34)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `raceway.antlion.snap` | one-shot | sprites:chip, sprites:puff |  | vfx/racewayprops.js |
| `raceway.antlion.spray` | held | sprites:chip, sprites:puff |  | vfx/racewayprops.js |
| `raceway.buoy.miss` | one-shot | sprites:puff, sprites:ringthin |  | vfx/racewaybuoys.js |
| `raceway.buoy.pass` | one-shot | sprites:core, sprites:ringthin, sprites:glint, light |  | vfx/racewaybuoys.js |
| `raceway.firework.burst` | one-shot | sprites:core, light, sprites:star4, sprites:streak, sprites:sparkle |  | vfx/raceway/fireworks.js |
| `raceway.firework.rise` | one-shot | sprites:core, sprites:sparkle |  | vfx/raceway/fireworks.js |
| `raceway.gate` | held | sprites:core |  | vfx/racewaylooks.js |
| `raceway.gate.pass` | one-shot | sprites:core, sprites:glint |  | vfx/racewaylooks.js |
| `raceway.grind.hum` | held | sprites:core, sprites:sparkle |  |  |
| `raceway.grind.off` | one-shot | sprites:ring, sprites:streak, sprites:chip |  | vfx/racewaylooks.js |
| `raceway.grind.on` | one-shot | sprites:core, sprites:streak | ---- the grind: the keel locked on a rail (skiff.grind .. skiff.grind.end), at the board's contact, `dir` back along the rail | vfx/racewaylooks.js |
| `raceway.grind.sparks` | held | sprites:streak, sprites:star4, sprites:chip, sprites:puff |  |  |
| `raceway.grind.streak` | held | sprites:core, sprites:glint | still where they are born: a run of them left behind at speed reads as one streak along the rail's top |  |
| `raceway.lamp` | held | sprites:core | ---- the start arch's lamps and the gates' marks: a glow held on each lit one (`k` its brightness), GO's flare, a gate passed | vfx/racewaylooks.js |
| `raceway.lamp.go` | one-shot | sprites:core, sprites:ring, sprites:sparkle |  | vfx/racewaylooks.js |
| `raceway.lane.drink` | held | sprites:sparkle, sprites:facet, sprites:core |  | vfx/racewayprops.js |
| `raceway.lane.enter` | one-shot | decal:shockring, sprites:core, sprites:glint |  | vfx/racewayprops.js |
| `raceway.lantern.light` | one-shot | sprites:soft, sprites:glint |  | vfx/raceway/lanterns.js |
| `raceway.patch.take` | one-shot | sprites:core, sprites:ringthin, sprites:facet |  | vfx/racewayprops.js |
| `raceway.pit.slide` | one-shot | sprites:chip, sprites:puff |  | vfx/racewaypark.js |
| `raceway.pit.snap` | one-shot | sprites:puff, sprites:chip, sprites:shard |  | vfx/racewaypark.js, vfx/racewaytraps/bodies.js |
| `raceway.plate` | one-shot | decal:shockring, sprites:core, sprites:glint, sprites:streak×2, light | ---- a sun plate ridden over: F-Zero's dash plate, a ring of light run out over the sand (`tint` and `power` the sun's: dimmer and cooler toward dusk) and the push in Lachryma's colour thrown on up the track (`dir` the track's way); a da... | vfx/racewaylooks.js |
| `raceway.plate.dark` | one-shot | decal:shockring, sprites:puff, sprites:ringthin |  | vfx/racewaylooks.js |
| `raceway.pot.plume` | one-shot | sprites:shard, sprites:chip, sprites:puff×2, sprites:ringthin |  | vfx/racewayprops.js |
| `raceway.pot.smash` | one-shot | sprites:shard, sprites:chip, sprites:puff |  | vfx/racewayprops.js |
| `raceway.ring.draw` | one-shot | sprites:glint, sprites:streak | played round the rim, upstream: `dir` the way in, through the heart | vfx/racewaylooks.js |
| `raceway.ring.pass` | one-shot | sprites:core, sprites:ringthin, sprites:sparkle, light | ---- a sun ring flown through: the flash at its heart, and the air's motes drawn in round its rim and out through it | vfx/racewaylooks.js |
| `raceway.rival.bump` | one-shot | sprites:core, sprites:ringthin, sprites:shard, sprites:chip, sprites:puff |  | vfx/racewayrivals.js |
| `raceway.rival.takedown` | one-shot | hitstop, shake, sprites:core, sprites:star4, sprites:streak, sprites:shard, sprites:chip×2, sprites:puff, decal:shockring, light |  | vfx/racewayrivals.js |
| `raceway.siphon.draw` | held | sprites:streak, sprites:glint, sprites:puff |  | vfx/racewaysiphons.js |
| `raceway.siphon.drink` | one-shot | sprites:streak, sprites:glint, sprites:core |  | vfx/racewaysiphons.js |
| `raceway.siphon.gulp` | one-shot | sprites:ringthin, sprites:glint, sprites:core, sprites:puff |  | vfx/racewaysiphons.js |
| `raceway.siphon.ring` | one-shot | decal:shockring |  | vfx/racewaysiphons.js |
| `raceway.vein` | one-shot | decal:shockring, sprites:core, sprites:facet, sprites:sparkle, light |  | vfx/racewaycavern.js |

### hit (29)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `hit` | one-shot | sprites:core, sprites:star4, sprites:streak | what every blow shows, whatever struck what: a hot core, a star, sparks thrown along the blow | audio/cues.js, audio/godpowers.js, audio/seaserpent.js +31 |
| `hit.blunt` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ring, sprites:puff | extends `hit`. a blunt blow: a ring knocked out flat, and dust | vfx/blowfeeleffects.js |
| `hit.blunt.clay` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ring, sprites:puff, sprites:chip | extends `hit.blunt`. what clay gives up: chips of it, falling, and a puff of its dust | vfx/vfx.js |
| `hit.blunt.clay.kill` | one-shot | sprites:core, sprites:star4×2, sprites:streak, sprites:ring×2, sprites:puff, sprites:chip | extends `hit.blunt.clay`. a kill: what it was made of bursts, and a few stars of its colour go up (a finishing beat on top of its own death) |  |
| `hit.blunt.crystal` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ring, sprites:puff, sprites:shard, sprites:sparkle | extends `hit.blunt`. crystal rings and splinters: shards and glints in the stone's colours |  |
| `hit.blunt.jelly` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ring, sprites:puff, sprites:bubble, sprites:soft | extends `hit.blunt`. jelly: bubbles that float off, drops of its goo that fall |  |
| `hit.blunt.jelly.kill` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ring×2, sprites:puff, sprites:bubble×2, sprites:soft | extends `hit.blunt.jelly`.  |  |
| `hit.blunt.metal` | one-shot | sprites:core, sprites:star4, sprites:streak×2, sprites:ring, sprites:puff, sprites:ringthin | extends `hit.blunt`.  |  |
| `hit.blunt.stone` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ring, sprites:puff×2, sprites:chip | extends `hit.blunt`.  |  |
| `hit.blunt.straw` | one-shot | sprites:core, sprites:star4, sprites:streak×2, sprites:ring, sprites:puff | extends `hit.blunt`. straw: Strawman's sack (its kind's look, vfx.js materialOf): stalks of straw thrown and drifting down, a breath of burlap dust; never clay chips off a dummy of straw (its own puffs of straw at the seams are its body'... |  |
| `hit.blunt.wood` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ring, sprites:puff×2, sprites:shard | extends `hit.blunt`. wood: splinters and sawdust; stone: grey chips and a dust cloud; metal: a shower of hot sparks and a clang ring |  |
| `hit.shot` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ringthin | extends `hit`. a shot: smaller, a ring stood along the shot, sparks back off the surface | vfx/blowfeeleffects.js |
| `hit.shot.clay` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ringthin, sprites:chip, sprites:puff | extends `hit.shot`.  |  |
| `hit.shot.clay.kill` | one-shot | sprites:core, sprites:star4×2, sprites:streak, sprites:ringthin, sprites:chip, sprites:puff | extends `hit.shot.clay`.  |  |
| `hit.shot.crystal` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ringthin, sprites:shard | extends `hit.shot`.  |  |
| `hit.shot.jelly` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ring, sprites:puff, sprites:bubble, sprites:soft | extends `hit.blunt.jelly`.  |  |
| `hit.shot.metal` | one-shot | sprites:core, sprites:star4, sprites:streak×2, sprites:ringthin | extends `hit.shot`.  |  |
| `hit.shot.stone` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ringthin, sprites:chip, sprites:puff | extends `hit.shot`.  |  |
| `hit.shot.straw` | one-shot | sprites:core, sprites:star4, sprites:streak×2, sprites:ringthin | extends `hit.shot`.  |  |
| `hit.shot.wood` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ringthin, sprites:shard | extends `hit.shot`.  |  |
| `hit.slash` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:crescent, sprites:glint | extends `hit`. a cutting blow: a crescent along the cut, and sparks thrown wide either side of it | vfx/blowfeeleffects.js, vfx/vfx.js |
| `hit.slash.clay` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:crescent, sprites:glint, sprites:chip | extends `hit.slash`.  |  |
| `hit.slash.clay.kill` | one-shot | sprites:core, sprites:star4×2, sprites:streak, sprites:crescent, sprites:glint, sprites:chip | extends `hit.slash.clay`.  |  |
| `hit.slash.crystal` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:crescent, sprites:glint, sprites:shard | extends `hit.slash`.  | vfx/vfx.js |
| `hit.slash.jelly` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:ring, sprites:puff, sprites:bubble, sprites:soft | extends `hit.blunt.jelly`.  |  |
| `hit.slash.metal` | one-shot | sprites:core, sprites:star4, sprites:streak×2, sprites:crescent, sprites:glint | extends `hit.slash`.  |  |
| `hit.slash.stone` | one-shot | sprites:core, sprites:star4, sprites:streak×2, sprites:crescent, sprites:glint, sprites:chip | extends `hit.slash`.  |  |
| `hit.slash.straw` | one-shot | sprites:core, sprites:star4, sprites:streak×2, sprites:crescent, sprites:glint, sprites:puff | extends `hit.slash`.  |  |
| `hit.slash.wood` | one-shot | sprites:core, sprites:star4, sprites:streak, sprites:crescent, sprites:glint, sprites:shard | extends `hit.slash`.  |  |

### skiff (29)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `skiff.boost` | held | sprites:streak×2, sprites:sparkle, sprites:core | ---- every boost (Shift's flare, a carve's, a plate's, a ring's, the solar start's push: skiff.boosting), held at the stern with `k` its strength: Lachryma thrown back off the hull, the oil film walking through it (`phase`), a soft glow ... | vfx/racewaylooks.js |
| `skiff.carve.charge.1` | held | sprites:chip, sprites:puff | ---- the carve as it loads (round 3, the owner after his first race: much bigger, clearly up a tier): tier 1 a rooster tail of sand off the edge; tier 2 gold sparks over it and the tail taller; tier 3 a real spray: white-gold sparks, sta... |  |
| `skiff.carve.charge.2` | held | sprites:chip×2, sprites:puff, sprites:streak | extends `skiff.carve.charge.1`.  |  |
| `skiff.carve.charge.3` | held | sprites:chip×2, sprites:puff×2, sprites:streak×2, sprites:star4, sprites:glint | extends `skiff.carve.charge.2`.  |  |
| `skiff.carve.release` | one-shot | sprites:core, sprites:ring, sprites:ringthin, sprites:puff, sprites:chip, sprites:streak×3, light | ---- the carve let go: a burst off the stern, the sand thrown back, and the push in Lachryma's colour (`power`: the tier, 1..3) | vfx/racewaylooks.js |
| `skiff.carve.sail` | held | sprites:core, sprites:sparkle | the sail's glow at tier 3: soft cores over each other, motes rising off it, the load's Lachryma in it | vfx/racewaylooks.js |
| `skiff.carve.tier` | one-shot | sprites:ring, sprites:core, sprites:streak | `power` the tier: a bigger ring and more sparks each step up | vfx/racewaylooks.js |
| `skiff.carve.wake` | held | sprites:puff, sprites:chip, sprites:glint | held while `follow` says: longer for a higher tier | vfx/racewaylooks.js |
| `skiff.combo.bank` | one-shot | sprites:glint, sprites:diamond, sprites:ring, sprites:core, light | the chain banked into flares: its light drawn in off the ring to the stern's suns | audio/cues.js, audio/haptics.js, courier/skiff/combo.js +6 |
| `skiff.combo.drop` | one-shot | sprites:chip, sprites:puff | the chain lost: the ring breaks into dull flakes that fall away, no light | audio/cues.js, courier/skiff/combo.js, feedback/tracking/race.js +2 |
| `skiff.combo.link` | one-shot | sprites:ringthin×2, sprites:sparkle | ---- the trick combo's moments (vfx/skiffcombomarks.js is its gauge): a link, a step of the multiplier, a bank, a drop | vfx/racewaylooks.js |
| `skiff.combo.step` | one-shot | sprites:star4, sprites:glint | at the step pips' chevron just lit: a multiplier's step taken | vfx/racewaylooks.js |
| `skiff.flare.spend` | one-shot | sprites:core, sprites:ringthin, sprites:glint, sprites:diamond | a banked flare spent whole by C, at its sun: the sun pops, a ring out, film glints, ink flakes | vfx/racewaylooks.js |
| `skiff.hull.hit` | one-shot | sprites:core, sprites:shard, sprites:chip, sprites:streak, sprites:puff |  | vfx/skiffboardlooks.js |
| `skiff.hull.worn` | held | sprites:shard, sprites:puff |  | vfx/skiffboardlooks.js |
| `skiff.luff.smoke` | held | sprites:puff, sprites:sparkle |  | vfx/skiffboardlooks.js |
| `skiff.manual.drag` | held | sprites:chip, sprites:puff, sprites:streak |  | vfx/skiffboardlooks.js |
| `skiff.pop.late` | one-shot | sprites:ringthin, sprites:glint |  | vfx/racewaylooks.js |
| `skiff.pop.miss` | one-shot | sprites:puff, sprites:chip |  | audio/cues.js, courier/skiff/skiff.js, feedback/tracking/race.js +2 |
| `skiff.pop.perfect` | one-shot | sprites:core, sprites:star4, sprites:ring×2, sprites:streak×2, sprites:sparkle, decal:shockring, light | ---- the late pop (skiff.pop): a perfect one nailed is the sun's glyph struck in Lachryma on the board, rays out flat round it, a ring on the sand, a star at its heart; a plain late pop a small ring; one let go too late (skiff.pop.miss) ... | feedback/tracking/race.js, progress/raceachievements.js, progress/skiffpaint.js +2 |
| `skiff.scorch` | one-shot | sprites:core, sprites:puff, sprites:sparkle, light |  | audio/cues.js, courier/skiff/boardrules.js, feedback/tracking/racemodes.js +2 |
| `skiff.scorch.heat` | held | sprites:sparkle, sprites:core |  | vfx/skiffboardlooks.js |
| `skiff.water.enter` | one-shot | sprites:soft, sprites:puff | ---- the board on water (the owner's notes on v198: no wake, no trail, no splash): drops blended over, never added, so they never glare | vfx/anglingeffects.js, vfx/skiffwaterlook.js |
| `skiff.water.enter.lachryma` | one-shot | sprites:soft×2, sprites:glint, light |  | vfx/skiffwaterlook.js |
| `skiff.water.exit` | one-shot | sprites:soft |  | vfx/skiffwaterlook.js |
| `skiff.water.spray` | held | sprites:soft, sprites:puff | h.k the speed: the rate follows it | vfx/skiffwaterlook.js |
| `skiff.water.spray.lachryma` | held | sprites:soft, sprites:glint | Lachryma is heavier: fewer, fatter drops, lower, and the film's glints in them | vfx/skiffwaterlook.js |
| `skiff.wreck` | one-shot | sprites:core, sprites:ring×2, sprites:puff, sprites:chip, sprites:glint, light |  | audio/cues.js, courier/skiff/boardrules.js, feedback/tracking/racemodes.js +3 |
| `skiff.wreck.mend` | one-shot | sprites:core, sprites:ringthin, sprites:sparkle, light |  | vfx/skiffboardlooks.js |

### flourish (27)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `flourish.arrive.column` | one-shot | sprites:streak, sprites:core, sprites:ring, light |  | vfx/flourishes.js |
| `flourish.arrive.petals` | one-shot | sprites:petal |  | vfx/flourishes.js |
| `flourish.arrive.smoke` | one-shot | sprites:puff, sprites:soft, light | the kiln's door opened on them | vfx/flourishes.js |
| `flourish.arrive.talismans` | one-shot | sprites:talisman, sprites:ringthin |  | vfx/flourishes.js |
| `flourish.aura.comb` | held | sprites:soft |  | vfx/flourishes.js |
| `flourish.aura.die` | held | sprites:die, sprites:glint | h.pos walked round the Courier by vfx/flourishes.js: the die is its head, the stream its tail | vfx/flourishes.js |
| `flourish.aura.embers` | held | sprites:soft×2 |  | vfx/flourishes.js |
| `flourish.aura.motes` | held | sprites:soft |  | vfx/flourishes.js |
| `flourish.dash.dice` | one-shot | sprites:die |  | vfx/flourishes.js |
| `flourish.dash.feelings` | one-shot | sprites:star4 |  | vfx/flourishes.js |
| `flourish.dash.ribbon` | one-shot | sprites:soft | the ribbon itself is a weapon trail's: vfx/trail.js, fed by vfx/flourishes.js; these are its motes | vfx/flourishes.js |
| `flourish.dash.shards` | one-shot | sprites:shard, sprites:glint |  | vfx/flourishes.js |
| `flourish.dash.talismans` | one-shot | sprites:talisman |  | vfx/flourishes.js |
| `flourish.shatter.ink` | one-shot | sprites:drip, sprites:puff, sprites:disc, sprites:soft |  |  |
| `flourish.shatter.kintsugi` | one-shot | sprites:shard, sprites:streak, sprites:sparkle, sprites:ring, light |  |  |
| `flourish.shatter.leaves` | one-shot | sprites:leaf, sprites:puff |  |  |
| `flourish.shatter.moths` | one-shot | sprites:moth, sprites:soft, light |  |  |
| `flourish.shatter.porcelain` | one-shot | sprites:shard, sprites:swirl, sprites:glint, sprites:ringthin, light |  |  |
| `flourish.step.blossom` | one-shot | sprites:petal |  | vfx/flourishes.js |
| `flourish.step.comb` | one-shot | sprites:glint |  | vfx/flourishes.js |
| `flourish.step.puddle` | one-shot | sprites:soft |  | vfx/flourishes.js |
| `flourish.step.scorch` | one-shot | sprites:soft, sprites:puff |  | vfx/flourishes.js |
| `flourish.whole.ink` | one-shot | sprites:drip, sprites:puff |  |  |
| `flourish.whole.kintsugi` | one-shot | sprites:shard, sprites:streak, sprites:sparkle, light |  |  |
| `flourish.whole.leaves` | one-shot | sprites:leaf |  |  |
| `flourish.whole.moths` | one-shot | sprites:moth, sprites:soft |  |  |
| `flourish.whole.porcelain` | one-shot | sprites:shard, sprites:swirl, sprites:glint |  |  |

### aura (14)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `aura.blind` | held | sprites:glint, sprites:swirl |  |  |
| `aura.calm` | held | sprites:petal |  |  |
| `aura.charm` | held | sprites:ripple, sprites:petal |  |  |
| `aura.confusion` | held | sprites:bubble, sprites:drip |  |  |
| `aura.doubt` | held | sprites:hex, sprites:ringthin | the four a damage type builds (progress/combat/types.js `builds`), each in its type's colour and motif (docs/ART.md: the damage types) |  |
| `aura.empower` | held | sprites:sparkle, sprites:soft |  |  |
| `aura.forget` | held | sprites:swirl |  |  |
| `aura.halt` | held | sprites:diamond, sprites:ringthin |  |  |
| `aura.haste` | held | sprites:streak |  |  |
| `aura.melt` | held | sprites:soft, sprites:puff |  |  |
| `aura.sleep` | held | sprites:bubble, sprites:soft | a status, shown round whatever has it, as long as it has it (`aura.<status>`, or `aura.<status>.<kind>` for one creature's own). Centred on the creature, offsets and sizes in its height (feet: [0, -0.5, 0], head: [0, 0.5, 0]); quiet: an ... |  |
| `aura.slow` | held | sprites:ringthin, sprites:soft |  |  |
| `aura.soaked` | held | sprites:drip, sprites:glint |  |  |
| `aura.soft` | held | sprites:puff |  |  |

### caster (12)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `caster.bisque` | one-shot | caster:frostbisque | frost and bisque, over the context's `target` from the hit: fired to bisque, frosted, crazed dry | tools/psygun/shellbodies.js |
| `caster.bubble.barrier` | held | caster:bubble |  | tools/psygun/shelldeployables.js |
| `caster.bubble.stasis` | held | caster:bubble | the bubble: Stasis's sphere (glass, the Mind's schiller), the Barrier's glass dome, the Holowall's hex wall in your glaze colour | tools/psygun/shellspacetime.js |
| `caster.bubble.wall` | held | caster:bubble |  | tools/psygun/shelldeployables.js |
| `caster.craze` | one-shot | caster:frostbisque |  |  |
| `caster.frost` | one-shot | caster:frostbisque |  |  |
| `caster.heatHaze` | held | caster:heathaze | (docs/plans/CASTER-SHELLS.md section 1: the looks the shells are built from, each a `caster` layer of its module in vfx/caster/; a shell's own effect `extends` one and adds its sparks, sound and weight) heat haze: hot air over a place (t... | tools/psygun/shelldeployables.js, tools/psygun/shellworld.js |
| `caster.heatHaze.flame` | held | caster:heathaze, sprites:puff |  |  |
| `caster.heatHaze.tube` | one-shot | caster:heathaze |  | tools/psygun/shellspacetime.js |
| `caster.lightning` | one-shot | caster:lightning, light | lightning: one strike from `from` to `to` (a return stroke that flickers twice), and an arc held between them | tools/psygun/shellbodies.js, tools/psygun/shellsplitchain.js, vfx/shelllooks/storm.js |
| `caster.lightning.arc` | held | caster:lightning |  | tools/psygun/shellbodies.js, tools/psygun/shellsplitchain.js |
| `caster.rift` | one-shot | caster:portal | the portal: a rift on the ground, opening as an eye and closing over its life | tools/psygun/shellspacetime.js |

### sea (12)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `sea.bottle.cork` | one-shot | sprites:drip, sprites:star4 |  | vfx/opensea/bottlelooks.js |
| `sea.bottle.glint` | one-shot | sprites:star4, sprites:soft |  | vfx/opensea/bottlelooks.js |
| `sea.dig` | one-shot | sprites:chip, sprites:puff |  | audio/cues.js, feedback/tracking/opensea.js, progress/cosmetics.js +3 |
| `sea.dig.find` | one-shot | sprites:star4, sprites:glint, light |  | vfx/opensea/puzzlelooks.js |
| `sea.salvage.drip` | one-shot | sprites:drip |  | vfx/opensea/salvagelooks.js |
| `sea.salvage.land` | one-shot | sprites:chip, sprites:drip |  | vfx/opensea/salvagelooks.js |
| `sea.salvage.open.common` | one-shot | sprites:star4, sprites:ringthin, sprites:glint, light |  |  |
| `sea.salvage.open.legend` | one-shot | sprites:star4, sprites:ringthin, sprites:glint, light, sprites:sparkle, sprites:ring |  |  |
| `sea.salvage.open.rare` | one-shot | sprites:star4, sprites:ringthin, sprites:glint, light |  |  |
| `sea.salvage.open.uncommon` | one-shot | sprites:star4, sprites:ringthin, sprites:glint, light |  |  |
| `sea.salvage.part` | one-shot | sprites:shard, sprites:star4 |  | vfx/opensea/salvagelooks.js |
| `sea.salvage.rise` | one-shot | sprites:ringthin, sprites:drip, sprites:puff |  | vfx/opensea/salvagelooks.js |

### blow (9)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `blow.finisher` | one-shot | sprites:streak×2, sprites:ringthin×2, sprites:ring, sprites:core, sprites:star4, sprites:glint, light | extends `blow.heavy`. FINISHER the string's last blow (and a plunge, a charge let go, a heat-1 blow): the heavy's look and a star, a second ring after the first, a wash of the vfx's own lamp, and more of what it is made of |  |
| `blow.finisher.clay` | one-shot | sprites:streak×2, sprites:ringthin×2, sprites:ring, sprites:core, sprites:star4, sprites:glint, light, sprites:chip, sprites:puff | extends `blow.finisher`.  |  |
| `blow.finisher.straw` | one-shot | sprites:streak×3, sprites:ringthin×2, sprites:ring, sprites:core, sprites:star4, sprites:glint, light, sprites:puff | extends `blow.finisher`.  |  |
| `blow.guardbreak` | one-shot | sprites:diamond, sprites:ring, sprites:shard | A GUARD BREAK (hit.guardBreak): the guard's own pieces, diamonds of white light burst out in a ring, a gold ring thrown wide | vfx/blowfeel.js |
| `blow.guardbreak.clay` | one-shot | sprites:diamond, sprites:ring, sprites:shard, sprites:chip | extends `blow.guardbreak`.  |  |
| `blow.guardbreak.straw` | one-shot | sprites:diamond, sprites:ring, sprites:shard, sprites:streak | extends `blow.guardbreak`.  |  |
| `blow.heavy` | one-shot | sprites:streak×2, sprites:ringthin, sprites:ring, sprites:core | extends `blow.light`. HEAVY the arc doubled and longer, a thick ring of the type's colour opening behind it, a hot core |  |
| `blow.launcher` | one-shot | sprites:streak×2, sprites:ringthin, sprites:ring, sprites:glint | extends `blow.light`. LAUNCHER the arc thrown up with what it lifts, a ring, glints rising after |  |
| `blow.light` | one-shot | sprites:streak, sprites:ringthin | laid over the hit (hit.slash.<material>, damage.<type>, which creatures.strike already plays) when a melee blow lands, by its weight class: light, heavy, launcher, finisher (blowWeight), then `.<material>` where a weight has more to give... |  |

### ult (6)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `ult.ascend` | one-shot | sprites:core, mesh:chest_shock×2, sprites:streak, flash, light, shake | the coffin's ascent: rings stacked up the pillar's foot, a burst at the coffin's mouth | cine/sequences.js, tools/lockheart/ultimate.js |
| `ult.crown` | held | mesh:ult_crown×2, sprites:ringthin, sprites:glint | round the coffin while it hangs open in the air: a crown of flame and a halo | cine/sequences.js, tools/lockheart/ultimate.js |
| `ult.invoke` | held | decal:circle_lotus×2, decal:circle_swirl, mesh:ult_vortex, sprites:soft, sprites:sparkle, sprites:diamond | (tools/lockheart/ultimate.js plays these; the owner's gold standard for a cinematic event: too much, on purpose) the invocation, held while it lasts: the whirl on the ground, motes drawn in from all round, glints rising off the circle | cine/sequences.js, tools/lockheart/ultimate.js |
| `ult.key` | one-shot | sprites:core, sprites:star4, sprites:ring, sprites:ringthin, sprites:streak, sprites:sparkle, sprites:petal, light, shake | a key plunged into the coffin: its colour (tint), loud | cine/sequences.js, tools/lockheart/ultimate.js, vfx/vfx.js |
| `ult.land` | one-shot | decal:circle_lotus, decal:circle_swirl, flash, hitstop, shake, smear, light×2, sprites:core, sprites:star4×2, mesh:ult_dome, mesh:chest_shock×3, sprites:streak, sprites:petal, sprites:puff, sprites:sparkle | the wheel lands: everything at once | cine/sequences.js, tools/lockheart/ultimate.js |
| `ult.pillar` | held | mesh:ult_pillar×2, mesh:ult_helix, sprites:streak, sprites:sparkle, sprites:petal | the pillar, held from the ascent to the end: a column of Lachryma to the sky, the great helix round it, streaks and sparkles flowing up it, and motes orbiting | cine/sequences.js, tools/lockheart/ultimate.js, vfx/vfx.js |

### damage (5)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `damage.delirium` | one-shot | sprites:puff, sprites:drip, sprites:bubble | DELIRIUM chaotic, entropic: ink and a sick violet-green; smoke that curls up, drips that fall, bubbles that burst. Things coming apart. |  |
| `damage.ego` | one-shot | sprites:hex×2, sprites:diamond | EGO lawful, mental: lapis; a hex lattice that opens and holds still, diamonds in an exact ring. A mind made rigid. |  |
| `damage.illusion` | one-shot | sprites:swirl, sprites:glint, sprites:sparkle | ILLUSION chaotic, perceptual: the labradorite's flash; curls that turn, glints that will not hold still, a doubled sparkle. |  |
| `damage.impact` | one-shot | sprites:star4, sprites:ringthin, sprites:facet | what a blow is made of, laid over its hit (which says the tool and the material): one colour and one motif per damage type along the Law-Chaos line, so the type reads with the HUD hidden and without colour vision (each has its own shape ... |  |
| `damage.influence` | one-shot | sprites:ripple×2, sprites:petal | INFLUENCE neutral, social: rose and warm gold; ripples spread slow and even, petals drift out. What spreads from one to many. |  |

### swing (5)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `swing` | one-shot | trail×2, sprites:glint | what a thing leaves in the air as it sweeps: ribbons between its two ends (a wide one, a hot core near the tip), and motes shed along the way, so many per metre the tip travels (vfx.js `swing`). 'tint' is the swing's colour, 'tip' its ho... | audio/dunemaw.js, coop/personas.js, feedback/tracking/dunemaw.js +12 |
| `swing.brush` | one-shot | trail×2, sprites:soft | the Soul Brush's club: a warm wet arc of slip, a pale edge, droplets flung off the bristles | tools/soulbrush/club.js, vfx/vfx.js |
| `swing.cutlass` | one-shot | trail×3, sprites:glint, sprites:streak, sprites:sparkle | the Sondelass's cutlass: ember to warm white, an afterglow of Lachryma behind, embers off the edge, glints off the point | tools/sondelass/cutlass.js, vfx/vfx.js |
| `swing.dreamvane` | one-shot | trail×2, sprites:glint, sprites:chip | the Dreamvane's pick brought down overhead: a heavy arc of Lachryma, gold at the head, stone chips and glints thrown off it | tools/dreamvane/dreamvane.js |
| `swing.kick` | one-shot | trail, sprites:puff | a kick: a short pale arc and a puff of dust off the toe (a kick is quick: the ribbon is too) | courier/moves/kick.js |

### temper (4)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `temper.agitated` | held | sprites:puff, sprites:soft |  | vfx/temper.js |
| `temper.enraged` | held | sprites:streak, sprites:ring |  | vfx/temper.js |
| `temper.prismatic` | held | sprites:glint, sprites:drip |  | vfx/temper.js |
| `temper.stoic` | held | sprites:facet, sprites:puff | a creature's mental state and agitation shown with its body; quiet at the middle, only the ends and the heat have a look of their own | vfx/temper.js |

### dunes (3)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `dunes.devil.scuff` | held | sprites:puff, sprites:chip |  | vfx/dunes/dustdevils.js |
| `dunes.fulgurite.glint` | one-shot | sprites:star4 |  | vfx/dunes/fulgurites.js |
| `dunes.fulgurite.strike` | one-shot | sprites:core, light, sprites:chip, sprites:puff×2 |  | vfx/dunes/fulgurites.js |

### kit (3)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `kit.demo.aura` | held | shape:band×2, shape:ring, shape:spiral, sprites:sparkle, shape:disc | an aura held round a body: a column of rays, a thinner one turning against it, the chant round the feet, a spiral rising, motes |  |
| `kit.demo.burst` | one-shot | shape:dome, shape:sphere, shape:ring, sprites:streak, sprites:sparkle, shape:disc | a burst out of the ground: a dome blooms, a ring races out, sparks fly, motes drift up after |  |
| `kit.demo.wave` | one-shot | shape:wave, shape:crescent, sprites:puff, shape:quad, sprites:soft | a wave pushed out along the blow (ctx.dir): a wall of the motif, a crescent sweep under it, dust, smoke and motes left behind |  |

### overture (3)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `overture.crack` | one-shot | sprites:streak, sprites:sparkle | the FUSE: the mend's gold breaking across the dark, a crack of light | cine/overture.board.js |
| `overture.draw` | one-shot | sprites:ringthin, sprites:glint, flash | a tool drawn on the half bar: a flash of the Mind at the hand, a ring out | cine/overture.board.js |
| `overture.ring` | held | mesh:ult_vortex, sprites:streak, sprites:sparkle | the CLIMB's ring: the Mind's labradorite wound round the Courier as the tools are drawn, faster and brighter to the snare roll | cine/overture.board.js |

### wisp (3)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `wisp.cast` | one-shot | sprites:core, sprites:soft | its cast leaving the lantern: a puff of the flame and a spark; its ember in flight (held, following the ember): a short hot tail, a halo, sparks shed and falling; put out (when the Death clip ends): the wick's smoke, its last embers and ... | audio/cues.js, creatures/wisp/lanternwisp.js, feedback/tracking/wisps.js +2 |
| `wisp.cast.flight` | held | sprites:core, sprites:soft×2 |  | vfx/lanternwisplook.js, vfx/racewaytraps/bodies2.js |
| `wisp.snuff` | one-shot | sprites:core, sprites:puff, sprites:soft, sprites:sparkle |  | vfx/duelview/aberrants/wisp.js, vfx/lanternwisplook.js, vfx/racewaytraps/bodies2.js |

### plaster (2)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `plaster.break` | one-shot | sprites:chip, sprites:puff | a plaster patch knocked off the workshop's wall (vfx/plasterpatch.js: its own flakes fall with it): grit of the skim, and its dust falling slowly and spreading, the colour of the wall's lime (`floor`: the caller's floor, where the grit s... | audio/cues.js, feedback/tracking/dreamvane.js, vfx/plasterpatch.js +1 |
| `plaster.land` | one-shot | sprites:puff | one of its flakes landing on the floor: a breath of the same dust | vfx/plasterpatch.js |

### psygun (2)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `psygun.flare` | one-shot | sprites:core×2, sprites:star4×2, sprites:streak, sprites:glint, sprites:puff, light, decal:shockring, decal:scorch |  | audio/cues.js, feedback/tracking/gunshots.js, tools/psygun/variantplay.js |
| `psygun.pentacle` | one-shot | decal:pentacle×2, decal:shockring, fx:damage.impact, sprites:streak×5, sprites:star4×5, fx:damage.influence, fx:damage.delirium, fx:damage.ego, fx:damage.illusion, sprites:core, sprites:sparkle, light, shake |  | audio/cues.js, feedback/tracking/gunshots.js, progress/cosmetics.js +3 |

### absorb (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `absorb` | one-shot | sprites:glint |  | audio/duelsecrets.js, audio/puzzleduel.js, courier/lachryma.js +9 |

### angle (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `angle.lift.splash` | one-shot | sprites:soft×3, sprites:puff, sprites:glint | extends `skiff.water.enter`.  | tools/sondelass/angling/catchlift.js |

### crystal (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `crystal.strike` | one-shot | sprites:star4, sprites:facet, sprites:glint | a crystal formation struck with the pick: faceted shards of solid Lachryma knocked off, oxide-bright, and a hard glint | feedback/tracking/dreamvane.js, progress/aptitude.js, progress/classarts.js +4 |

### cut (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `cut` | one-shot | sprites:streak, sprites:core, sprites:glint | a cut through the air (the cutlass meeting something, the blade mode's planes, the god hand's slash): a seam of light along the stroke, a hot core at its middle, glints thrown off it ('from' -> 'to' in the context: spawn 'line') | cine/overture.board.js, cine/sequence.js, music/lockheart.js +12 |

### dunemaw (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `dunemaw.motes` | held | sprites:soft, sprites:swirl |  | vfx/dunemaw.js, world/well/dunemaw.js |

### embers (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `embers` | one-shot | sprites:soft |  | progress/skiffpaint.js, vfx/flourishes.js, vfx/particles.js +2 |

### impact (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `impact` | one-shot | sprites:streak, sprites:puff |  | audio/cues.js, audio/damage.js, audio/shellparts.js +44 |

### implode (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `implode` | one-shot | sprites:streak, light |  | vfx/particles.js |

### jar (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `jar.breath` | one-shot | sprites:soft | the Great Dunemaw's mouth (vfx/dunemaw.js draws the pool): motes of the dunes' Lachryma drawn in toward it, and a breath of dark over it the Pneuka Jar's mouth breathing the soul colour after a true firing, as the press view is left (doc... | vfx/alchemy/presslook.js |

### lane (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `lane.mark` | held | decal:circle_swirl, mesh:ult_pillar, sprites:streak, sprites:ringthin | Divination's lane mark: where a wave will come, up to 3 s before it does (held; the caller raises its strength `k` from 0 to 1 as the wave nears). It must read at speed over the black crude: a column of the Mind's labradorite standing up... |  |

### poof (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `poof` | one-shot | sprites:puff, sprites:ringthin, sprites:star4 | a thing gone in a puff: smoke that swells and lifts, a ring, a few stars (cartoon's disappearance) |  |

### shock (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `shock` | one-shot | sprites:ring, sprites:ringthin×3, sprites:sparkle | a shockwave out of a feat of the Courier's power (the parry, a dive's landing, a charge's end, a bomb's pop, the Opening: fx.shockwave): Lachryma's ring, not a white one. A band of crude's ink, the oil film's three thin bands just inside... | vfx/particles.js, workbench/lachrymastage.js |

