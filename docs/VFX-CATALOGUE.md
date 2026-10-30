# The VFX catalogue (generated: do not edit)

Every effect the game can play, read from the code by `node scripts/vfxcatalogue.mjs` (2026-10-30). 607 effects in 39 families. How effects are made and named: docs/VFX.md; the library's plan: docs/plans/art/VFX-LIBRARY.md.

**Play one:** `game.vfx.play(name, { pos, dir, normal, tint, power, scale, feeling, domain, suit, follow })`; a held one returns a handle (`h.pos`, `h.k`, `h.stop()`). A name falls back from the most particular (`hit.slash.crystal` -> `hit.slash` -> `hit`), so a new name always plays something.

## The building blocks

| block | what there is |
|---|---|
| sprite shapes (`vfx/sprites.js`) | soft, core, star4, sparkle, streak, ring, ringthin, puff, shard, diamond, glint, swirl, petal, crescent, chip, bubble, hex, facet, drip, ripple, disc, talisman, moth, leaf, die, comb |
| decal textures | circle_lotus, circle_swirl, shockring (drawn), scorch (drawn), pentacle (drawn) |
| baked effect meshes (`src/assets/vfx/*.glb`, Mesh Create) | chest_circle, chest_helix, chest_shock, ult_crown, ult_dome, ult_helix, ult_pillar, ult_vortex |
| caster shaders (`vfx/caster/`) | bubble, corrupted, frostbisque, heathaze, hologram, lensing, lightning, molten, portal, timegrade |
| shape layer forms (`vfx/shapes/forms.js`) | ring, hoop, band, dome, sphere, cone, disc, quad, beam, spiral, crescent, pillar, wave, spikes |
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
| `shell.desire.land` | held | shape:sphere, shape:dome×2, shape:ring×4, sprites:streak, shape:spiral, sprites:soft×2, shape:disc | extends `feeling.desire.burst`. 83 Desire, the lure (vfx/shelllooks.js: at the point, held for its dur, `r` its pull): Desire's burst where it lands, then rings drawn in along the ground to a heartbeat, a dome of ripples breathing at the... |  |
| `shell.detonator.fly` | held | sprites:soft | 25 Detonator: a putty lump with a glaze bead (its body: shelllooks.js); a red spark trailing it |  |
| `shell.double.fire` | one-shot | sprites:streak, sprites:hex, sprites:ringthin |  |  |
| `shell.dread.land` | one-shot | shape:sphere, shape:dome×2, sprites:swirl×2, shape:ring, sprites:soft, shape:disc×2, sprites:puff | extends `feeling.dread.burst`. 87 Dread, the dark (vfx/shelllooks.js: at the point, once, `r` its reach): Dread's burst where it lands, then the dark thrown wide over the ground and closing again, shadows creeping in from its edge, marbl... |  |
| `shell.droneHalo.fire` | held | sprites:soft | 73 Drone Halo: the kilns' glowing mouths leave embers in their orbit over you |  |
| `shell.echo.fire` | held | sprites:sparkle | 55 Echo: the haste of a second you about you (the ghosts themselves are vfx/afterimage.js's) |  |
| `shell.faradayCage.land` | held | sprites:glint | 36 Faraday Cage: its edges humming, sparks running up the corners (the arcs are S3's) |  |
| `shell.flamer.fire` | held | caster:heathaze, sprites:puff, sprites:soft, sprites:streak | extends `caster.heatHaze.flame`. 21 Flamer: heat haze over an orange-to-white flame along the aim, ash drifting up (held for its dur at the muzzle) |  |
| `shell.forgetMe.courier` | held | sprites:puff |  |  |
| `shell.forgetMe.land` | one-shot | sprites:puff | 70 Forget Me: a grey fog over the Courier (how it sees you now), a breath of it where it struck |  |
| `shell.fury.land` | held | shape:sphere, shape:spikes, shape:dome, shape:ring×2, shape:disc, sprites:streak×2, shake, sprites:soft, sprites:puff, shape:band, sprites:shard | extends `feeling.fury.burst`. 84 Fury, the berserk (vfx/shelllooks.js: held on the creature it struck for its dur): Fury's burst on it, then a band of cracks racing up round its body, a hard ring pulsing out of it, shards of red thrown off |  |
| `shell.gall.land` | held | shape:sphere, shape:dome×2, sprites:drip, sprites:puff×3, sprites:bubble×2, sprites:ringthin×2, shape:disc×2 | extends `feeling.gall.burst`. 85 Gall, nausea (vfx/shelllooks.js: at the point, held for its dur, `r` its cloud): Gall's burst where it lands, then a curdled cloud turning over the place, its film lying under it, bubbles rising through it | vfx/shapes/ramps.js |
| `shell.ghost` | held | sprites:soft | (what keeps the shells' afterimages ticking while any shows: shelllooks/kit.js leaveGhost; it draws nothing of its own) | vfx/shelllooks/kit.js |
| `shell.glassmaker.fly` | held | sprites:soft | 26 Glassmaker: a lump of sand streaming grains; where it lands the sand flashes white-hot and cools green, glinting |  |
| `shell.glassmaker.land` | one-shot | sprites:core, sprites:facet, sprites:puff |  |  |
| `shell.godHand.land` | one-shot | sprites:ring, sprites:puff, sprites:streak | 98 God Hand: a dark hole torn in the sky over where it lands, the hand's reach falling out of it (the slam is the hand's own) |  |
| `shell.golem.land` | one-shot | mesh:chest_shock, sprites:puff, sprites:chip, sprites:core, shake | 78 Golem: the ground heaves up into a body: a great ring of dust, clods thrown, the ground shaking |  |
| `shell.grief.land` | held | shape:sphere×2, shape:dome, sprites:streak×2, shape:ring, sprites:drip, shape:disc, sprites:soft×2, sprites:puff | extends `feeling.grief.burst`. 86 Grief, the weeping (vfx/shelllooks.js: held over the head of the creature it struck for its dur): Grief's burst there, then one cloud over its head, alpha-over and dark, raining on it | vfx/vfx.js |
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
| `shell.mirth.land` | one-shot | shape:sphere, shape:dome, shape:ring×5, sprites:disc×4, sprites:ringthin | extends `feeling.mirth.burst`. 82 Mirth, the pratfall (vfx/shelllooks.js: at the point, once): Mirth's burst where it lands, its rings stepping out wider, and confetti of its dots thrown up over everything it stuns |  |
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
| `shell.wonder.land` | held | shape:sphere, shape:dome, shape:spikes, shape:ring, sprites:sparkle×2, sprites:glint×2, shape:disc×2, shape:band | extends `feeling.wonder.burst`. 81 Wonder, the vantage (vfx/shelllooks.js: at the point, held for its dur): Wonder's burst where it lands, then an aurora hung overhead, the ground frosted under it, glints on the ground and dust falling s... |  |
| `shell.zodiac.fire` | held | sprites:puff, sprites:sparkle, sprites:star4 | 91 Zodiac: night over the whole fight, stars pricking out across it, the twelve signs wheeling overhead |  |
| `shell.zodiac.strike` | one-shot | sprites:star4, sprites:core, decal:shockring×2, decal:scorch, sprites:sparkle×2, light |  |  |

### art (103)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `art.abundance.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:spikes, sprites:leaf | extends `art.react`. Abundance (the Empress' reaction): Overgrowth quietened: small spikes grown in at the feet, a few leaves |  |
| `art.arrowOfTime.use` | one-shot | shape:ring×5, shape:disc, shape:band, sprites:streak, sprites:sparkle, sprites:puff, light | Blink Mark (Temperance, Wands; Ouranurgy): a thrown eye, a small portal, where you will blink (played at the mark; held its 1.5 s window) |  |
| `art.beginnersLuck.armed` | held | shape:ring, sprites:star4, sprites:sparkle | Beginner's Luck armed (while it waits for a roll, up to 30 s): a faint halo of stars turning over the head, a glint now and then |  |
| `art.beginnersLuck.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, sprites:die, sprites:star4 | extends `art.react`. Beginner's Luck spent (a roll thrown twice): a die popped over the head and its glint: the better throw kept |  |
| `art.beginnersLuck.use` | one-shot | shape:ring×2, sprites:die, sprites:star4, shape:band, sprites:sparkle | Beginner's Luck (the Fool; Divination): an iris opened at the hand, two dice flicked up off it, tumbling: the next roll is thrown twice |  |
| `art.bind.hold` | held | shape:band×3, shape:ring, sprites:soft | Shackle held: the three links tight round it, turning, faint; a written ring at its feet |  |
| `art.bind.use` | one-shot | shape:band×3, shape:crescent, shape:sphere, shape:disc, sprites:soft, shape:ring, light, shake, hitstop | Shackle (the Devil, Pentacles; Spellscription, held 5 s): chain links of script round the creature (played at it) |  |
| `art.bloom.hold` | held | shape:spikes×2, sprites:leaf, sprites:soft | Overgrowth held: the thicket's light standing faint, leaves drifting down through it |  |
| `art.bloom.use` | one-shot | shape:spikes×2, shape:sphere, sprites:leaf, shape:ring×2, sprites:puff, sprites:soft, light, shake, hitstop | Overgrowth (the Empress; Manifestation, held 10 s): a thicket rising 6 m round, leaves thrown up and falling |  |
| `art.bulwark.hold` | held | shape:band, shape:ring×4, shape:dome, sprites:glint, shape:disc | Bulwark held (braced): the shell of hard light, its cells crawling, the gold rims, a cap over the crown, glints running up it |  |
| `art.bulwark.use` | one-shot | shape:band, shape:ring×4, shape:sphere, shape:spikes, sprites:shard, sprites:puff, sprites:soft | Bulwark (the Knight of Pentacles; Manifestation, held 3 s): a braced shell of hard light with gold rims, spikes driven in at the feet |  |
| `art.charge.use` | one-shot | shape:wave, shape:sphere, shape:crescent, sprites:streak, sprites:chip, sprites:puff, sprites:soft | Onrush (the Knight of Wands; Psychokinesis): a wave thrown along the dash's line, 8 m, chips thrown off its sides |  |
| `art.choice.fire` | one-shot | shape:ring×2, shape:band×2, sprites:streak, sprites:sparkle, shape:crescent | extends `art.react`. Choice (the Lovers' reaction): Encore quietened: a small written ghost ring at the hand |  |
| `art.clearSight.hold` | held | shape:dome, shape:ring, sprites:sparkle | Clear Sight held: the lens dome round them, faint; the iris held small at the eyes; specks drifting |  |
| `art.clearSight.use` | one-shot | shape:ring, shape:dome, shape:band, sprites:sparkle | Clear Sight (the Queen of Swords; Divination, held 8 s): an iris opened at the eyes, a faint lens dome; soft |  |
| `art.collapse.use` | one-shot | shape:ring×4, shape:disc, sprites:chip×2, shape:sphere, sprites:puff, light, flash, shake, hitstop | Collapse (the Tower; Psychokinesis): the ground falling in within 4 m, stones from above |  |
| `art.command.use` | one-shot | shape:ring×5, shape:band, shape:sphere, sprites:chip, sprites:star4, sprites:puff, sprites:soft, light, flash, shake, hitstop | Roar (the King of Wands; Psychokinesis): a shockwave ring out to 8 m, its front stood up, a dust curtain, every windup in it snapped |  |
| `art.completion.hold` | held | shape:band×8, sprites:sparkle | Completion held: the seven's armillary turning round the body, softer; motes of the film rising |  |
| `art.completion.use` | one-shot | shape:band×10, shape:sphere, shape:spikes, shape:ring×5, shape:spiral, sprites:sparkle, sprites:soft, light, flash, shake, hitstop | Completion (the World; all seven, the ultimate, held 10 s): an armillary of the seven domains' glazes turning, each domain's grammar in one beat |  |
| `art.courage.fire` | one-shot | shape:ring×2, shape:band×2, sprites:streak, sprites:sparkle, shape:spiral | extends `art.react`. Courage (Strength's reaction): Tame quietened: a spiral drawn in at the chest, a collar flashed |  |
| `art.cutThrough.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle×2 | extends `art.react`. Cut Through (the Queen of Swords' reaction): Clear Sight quietened: the iris blinking open at the eyes |  |
| `art.daybreak.use` | one-shot | shape:disc, shape:ring×3, shape:sphere, shape:band, sprites:sparkle, light, flash, shake | Daybreak (the Sun; Ouranurgy): a sun disc over the head, a ring of rays, a flash that blinds within 10 m |  |
| `art.dividend.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:spikes, sprites:glint | extends `art.react`. Dividend (the King of Pentacles' reaction): Earth Wall quietened: small spikes grown in at the feet, a glint of gold |  |
| `art.dominion.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, shape:wave | extends `art.react`. Unshaken (the Emperor's reaction): Ram quietened: a short wave wall pushed out a step ahead, a pale rim at the feet |  |
| `art.due.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, shape:disc | extends `art.react`. Grudge (Justice's reaction): Payback quietened: a small written ring at the chest, a seal |  |
| `art.eager.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:dome, sprites:soft | extends `art.react`. First Strike (the Page of Wands' reaction): Spark quietened: an ember's bloom at the hand on the fight's first blow |  |
| `art.echo.use` | one-shot | shape:band, shape:crescent×2, shape:ring, shape:disc, sprites:soft, smear, light | Encore (the Lovers, Swords; Spellscription): a written ghost of you replaying the last move where you stood |  |
| `art.edge.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:wave, sprites:star4 | extends `art.react`. Edge (the Knight of Swords' reaction): Riposte Rush quietened: a gold glint on the weak point |  |
| `art.empath.fire` | one-shot | shape:ring×2, shape:band×2, sprites:streak, sprites:sparkle, sprites:drip | extends `art.react`. Empath (the Queen of Cups' reaction): Catch the Rain quietened: a thin stream of the sky falling to the chest |  |
| `art.fortune.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle×2, shape:disc | extends `art.react`. Fortune (the Wheel's reaction): Spin quietened: a small wheel turning over the head and gone |  |
| `art.gallant.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, sprites:drip | extends `art.react`. Gallant (the Knight of Cups' reaction): a ring of gold on the parry: Water Walk's footfall ring stood up at the chest |  |
| `art.harvest.use` | one-shot | shape:band×2, shape:crescent×2, sprites:leaf, sprites:sparkle | Harvest (the Queen of Pentacles; Alteration): a ripening burst: a band of gold up the body, leaves turning, gold motes rising; soft |  |
| `art.hearth.fire` | one-shot | shape:ring×2, shape:band×2, sprites:streak, sprites:sparkle×2 | extends `art.react`. Hearth (the Queen of Pentacles' reaction): Harvest quietened: a faint band of gold and a few motes rising |  |
| `art.hope.fire` | one-shot | shape:ring×2, shape:band×2, sprites:streak, sprites:sparkle×2, shape:disc | extends `art.react`. Hope (the Star's reaction): made whole with a pool's glow: Starlight quietened, a soft column and a pool of light at the feet |  |
| `art.intuition.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, sprites:puff | extends `art.react`. Intuition (the Priestess' reaction): Veil quietened: an eye blinking at the eyes |  |
| `art.judge.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, shape:disc | extends `art.react`. Judge (the King of Swords' reaction): Mark for Death quietened: a small ring written over the head |  |
| `art.kindleHeart.hold` | held | shape:sphere, shape:band, sprites:soft | Stoke held: the heart beating at the chest, a shimmer round the body, sparks rising |  |
| `art.kindleHeart.use` | one-shot | shape:band, shape:sphere, shape:crescent×2, sprites:soft | Stoke (the Queen of Wands; Alteration, held 6 s): a heartbeat of embers at the chest, rising sparks; soft enough to stand beside play |  |
| `art.lantern.hold` | held | shape:sphere, shape:ring×2, sprites:soft | Lamp held: the lamp over the shoulder breathing slowly, its reach a faint ring at 8 m, grains drifting off it |  |
| `art.lantern.use` | one-shot | shape:sphere×2, sprites:shard, shape:ring×2, sprites:soft, light, flash | Lamp (the Hermit, Pentacles; Manifestation, held 20 s): a lamp made over the shoulder, its soft light out to 8 m |  |
| `art.mirageStep.hold` | held | shape:band, sprites:puff, sprites:sparkle | Vanish held (unseen): a faint shimmer where the body is, a wisp of mist now and then |  |
| `art.mirageStep.use` | one-shot | shape:band×2, sprites:puff, shape:crescent×2, sprites:hex, light | Vanish (the Moon, Cups; Alteration, held 3 s): the body eroding into mist, a decoy left (the decoy is the runtime's) |  |
| `art.moderation.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, shape:disc, sprites:drip | extends `art.react`. Spillover (Temperance's reaction): Blink Mark quietened: a small eye at the Lachrymato Bottle on the back as it tops up |  |
| `art.momentum.armed` | held | shape:band, sprites:soft, shape:disc | Momentum (the Knight of Wands' reaction), armed: an ember band turning at the hips while the next blow waits (Onrush in a whisper) |  |
| `art.momentum.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:wave, sprites:soft | extends `art.react`. Momentum's blow: the band let go as a small Onrush wave thrown forward off the blow |  |
| `art.offering.hold` | held | shape:band, shape:disc, shape:ring×2, sprites:soft | Offering held (the calm's 4 s): the cup standing, its liquid stirring as creatures drink, a faint calm ring at its reach |  |
| `art.offering.use` | one-shot | shape:band, shape:disc×2, shape:ring×2, sprites:drip | Offering (the Page of Cups; Manifestation): a cup of light set down at the feet, a calm ring spreading out to 6 m |  |
| `art.prospect.mark` | one-shot | shape:pillar, shape:ring×2, sprites:star4, sprites:soft | Prospect's mark: where the strongest Lachryma lies (played at the event's `at`): a thin pillar of gold, a ring, a glint |  |
| `art.prospect.use` | one-shot | shape:wave, shape:ring, sprites:streak, sprites:star4, sprites:sparkle | Prospect (the Page of Pentacles; Divination): a ping thrown 30 m ahead, as the dowse does, low and narrow |  |
| `art.quickStudy.fire` | one-shot | shape:ring×4, shape:band×2, sprites:streak, sprites:sparkle | extends `art.react`. Quick Study (the Page of Swords' reaction): Scout quietened: an iris at the eyes and a sweep 3 m |  |
| `art.radiance.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, shape:disc | extends `art.react`. Radiance (the Sun's reaction): Daybreak quietened: a small sun glint over the head, its rays |  |
| `art.rally.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, sprites:soft | extends `art.react`. Rally (the King of Wands' reaction): Roar quietened and run backwards: a ring drawn in to the Courier, motes from the downed into them |  |
| `art.ram.use` | one-shot | shape:wave, shape:sphere, shape:crescent, sprites:chip, sprites:puff, shape:ring, light, flash, shake, hitstop | Ram (the Emperor, Wands; Psychokinesis): a wave wall of force thrown 10 m ahead, cracks riding it |  |
| `art.react` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle | a reaction firing: a quick ring stood up at the chest, the suit's colour rising up the body, a flat ring snapped out at the feet (0.4 s) | vfx/classartlooks.js, vfx/library/classarts/arcana.js, vfx/library/classarts/cups.js +5 |
| `art.reap.use` | one-shot | shape:wave×2, shape:sphere, sprites:petal, shape:disc, shape:ring, light, flash, shake, hitstop | Reap (Death, Cups; Alteration): a scythe's crescent swept 3 m round; what it downs dims |  |
| `art.rebirth.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:sphere, sprites:shard, shape:wave | extends `art.react`. Rebirth (Death's reaction): a kintsugi burst: the shatter turned aside, gold cracks flung open round the body and drawn shut |  |
| `art.reckoning.use` | one-shot | shape:beam×6, shape:ring×3, shape:sphere, shape:crescent, shape:disc, sprites:soft, light, flash, shake, hitstop | Settle the Score (Judgement, Wands; Spellscription): beams drawn in from all round to the body, then the verdict's burst out to 12 m |  |
| `art.reins.fire` | one-shot | shape:ring×2, shape:band×2, sprites:streak, sprites:sparkle, sprites:soft | extends `art.react`. Reins (the Chariot's reaction): Ride quietened: a collar ring flashed at the hips, motes drawn in |  |
| `art.ride.hold` | held | shape:beam×2, shape:band, shape:disc | Ride held: the reins held, their light running to the creature; the collar; a haze at its feet |  |
| `art.ride.use` | one-shot | shape:beam×2, shape:band, shape:sphere×2, shape:spiral, sprites:streak, shape:disc, sprites:soft, light, shake, hitstop | Ride (the Chariot, Cups; Possession, held 8 s): reins of light to the creature (played at it) |  |
| `art.ripostRush.use` | one-shot | shape:wave×2, shape:sphere, shape:ring×3, sprites:chip, sprites:sparkle | Riposte Rush (the Knight of Swords; Psychokinesis): a crescent cut behind the one parried (played at it, facing away from the Courier) |  |
| `art.sanctum.hold` | held | shape:ring, shape:dome, sprites:sparkle | Sanctum held: the circle turning slow on the ground, the faint dome over it, motes drifting |  |
| `art.sanctum.use` | one-shot | shape:ring×2, shape:dome, shape:band, shape:disc, sprites:soft, light, flash, hitstop | Sanctum (the Hierophant, Pentacles; Spellscription, held 8 s): a circle 5 m across drawn on the ground, a faint dome over it |  |
| `art.scout.hold` | held | shape:band, shape:ring, sprites:sparkle | Scout held: a slow sonar pulse every 1.6 s from the feet, faint, while the tags hold |  |
| `art.scout.use` | one-shot | shape:band×2, shape:ring×3, sprites:star4, sprites:sparkle | Scout (the Page of Swords; Divination): a sonar ring racing out to 40 m, steel-pale, every source in it tagged for 6 s |  |
| `art.secondChance.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, shape:disc | extends `art.react`. Second Chance (Judgement's reaction): Settle the Score quietened: a small verdict ring at the chest, a seal |  |
| `art.sleight.use` | one-shot | shape:quad, shape:sphere, shape:crescent×2, sprites:diamond, shape:band, light | Quick Swap (the Magician; Alteration): a card flipped at the hand |  |
| `art.solitude.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:sphere, sprites:soft | extends `art.react`. Solitude (the Hermit's reaction): Lamp quietened: a small lamp's glint over the shoulder |  |
| `art.spark.use` | one-shot | shape:dome, shape:sphere, sprites:streak, shape:spikes, shape:disc, sprites:soft, sprites:puff | Spark (the Page of Wands; Manifestation): an ember flicked from the hand along the line, landing in a small bloom that burns away a blot (played where it lands) |  |
| `art.spin.use` | one-shot | shape:ring×2, shape:disc, sprites:die, shape:sphere, sprites:star4, shape:band, sprites:sparkle, light | Spin (the Wheel; Divination): a wheel of fortune turning over the head, its pip landing in the hand |  |
| `art.steadfast.armed` | held | shape:ring, shape:band, sprites:glint | Steadfast (the Knight of Pentacles' reaction), armed: Bulwark's shell in a whisper: a gold ring at the feet, a low band of hard light |  |
| `art.steadfast.fire` | one-shot | shape:ring×6, shape:band×2, sprites:streak, sprites:sparkle | extends `art.react`. Steadfast fired (the blow turned aside: vessel.ward): Bulwark's shell flashed in a whisper, in the ward's pale | vfx/classartlooks.js |
| `art.steady.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:disc, sprites:soft | extends `art.react`. Steady (the King of Cups' reaction): Still Waters quietened: a small disc of still water at the feet |  |
| `art.stillWaters.use` | one-shot | shape:disc×2, shape:ring×3, shape:sphere, shape:beam×5, shape:spiral, sprites:soft, light, flash, hitstop | Still Waters (the King of Cups; Possession): a disc of still water spreading 6 m, tethers reaching into what it settles, ripples laid flat |  |
| `art.stronghold.hold` | held | shape:wave×2, sprites:puff | Earth Wall held: the wall's light standing ahead, faint, dust drifting at its foot |  |
| `art.stronghold.use` | one-shot | shape:wave, shape:spikes, shape:disc, sprites:chip, sprites:puff, sprites:soft, light, flash, shake, hitstop | Earth Wall (the King of Pentacles; Manifestation, held 6 s): the wall's light rising ahead (4 m wide, 2.5 m high), spikes and dust, cracks |  |
| `art.surrender.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle×2 | extends `art.react`. Surrender (the Hanged Man's reaction): Hang Time quietened: the clock's tick, a small ring at the waist |  |
| `art.suspend.hold` | held | shape:ring×2, sprites:sparkle | Hang Time held: the clock ring turning slow round the waist, a ring stood up turning against it, motes falling slow |  |
| `art.suspend.use` | one-shot | shape:ring×3, shape:band, shape:sphere, sprites:sparkle, sprites:puff, light, hitstop | Hang Time (the Hanged Man, Cups; Ouranurgy, held 3 s): a slow clock ring round the body as time round it slows |  |
| `art.tame.hold` | held | shape:band, shape:sphere, sprites:soft | Tame held: the collar on the tamed creature, turning; a faint shell; motes drawn in |  |
| `art.tame.use` | one-shot | shape:beam×3, shape:spiral, shape:sphere×2, shape:band, sprites:streak, shape:disc, sprites:soft, light, shake, hitstop | Tame (Strength, Wands; Possession, held 15 s): tethers into the creature, a collar ring (played at it) |  |
| `art.teaching.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, sprites:soft | extends `art.react`. Teaching (the Hierophant's reaction): Sanctum quietened: a small circle written at the feet |  |
| `art.temptation.fire` | one-shot | shape:ring×2, shape:band×2, sprites:streak, sprites:sparkle, sprites:soft | extends `art.react`. Excess (the Devil's reaction): Shackle quietened: a ring of script tightening at the waist |  |
| `art.tender.fire` | one-shot | shape:ring×4, shape:band, sprites:streak, sprites:sparkle, sprites:drip | extends `art.react`. Kindness (the Page of Cups' reaction): Offering quietened: a little calm ring at the feet, a drop lifting |  |
| `art.thrift.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, shape:wave | extends `art.react`. Thrift (the Page of Pentacles' reaction): Prospect quietened: a small ping ahead and the iris at the hand |  |
| `art.tides.fire` | one-shot | shape:ring×2, shape:band×2, sprites:streak, sprites:sparkle, sprites:puff | extends `art.react`. Tides (the Moon's reaction): Vanish quietened: a shimmer flashed round the body, a wisp of mist |  |
| `art.upheaval.fire` | one-shot | shape:ring×3, shape:band, sprites:streak, sprites:sparkle, sprites:chip | extends `art.react`. Upheaval (the Tower's reaction): Collapse quietened: a small ring falling in at the feet, a few chips |  |
| `art.veil.mark` | one-shot | shape:ring, shape:disc, shape:band, sprites:puff | Veil's mark (played at the creature): an eye over its head closing, a collar of mist round it |  |
| `art.veil.use` | one-shot | shape:dome, sprites:puff, shape:spiral, sprites:streak, shape:disc, light | Veil (the Priestess; Possession): a veil of mist drawn down over you (and `.mark`, an eye closing on the creature it blinds) |  |
| `art.verdict.hold` | held | shape:ring, shape:band, sprites:soft | Mark for Death held: the written ring turning tight over its head, a thin band at its chest, ink falling slowly |  |
| `art.verdict.use` | one-shot | shape:ring×2, shape:crescent×2, shape:sphere, shape:band, shape:disc, sprites:soft, light, shake, hitstop | Mark for Death (the King of Swords; Spellscription, held 8 s): a written ring over the marked one's head, tightening (played at it) |  |
| `art.wade.hold` | held | shape:ring, shape:crescent, sprites:drip | Water Walk held: a ring at each footfall on the surface, a skim wake behind, spray off the heels |  |
| `art.wade.use` | one-shot | shape:band×2, shape:ring×2, sprites:drip | Water Walk (the Knight of Cups; Alteration, held 5 s): the surface turned to a floor: a band up from the feet, a splash ring |  |
| `art.warmth.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:sphere, sprites:soft | extends `art.react`. Afterglow (the Queen of Wands' reaction): Stoke quietened: one heartbeat at the chest and a few sparks |  |
| `art.weigh.fire` | one-shot | shape:beam, shape:sphere, shape:disc, sprites:streak, sprites:soft, shake, hitstop | Payback's return (played at the striker): the beam of script back into it, a seal stamped on it |  |
| `art.weigh.hold` | held | shape:ring×2, shape:band, sprites:soft | Payback held: the two rings of the balance turning, faint, a thin band at the chest |  |
| `art.weigh.use` | one-shot | shape:ring×3, shape:crescent, shape:sphere, shape:band, shape:disc, sprites:soft, light, shake, hitstop | Payback (Justice, Swords; Spellscription, held 4 s): a balanced ring of script at the feet and over the head, the blow's return waiting |  |
| `art.wellUp.use` | one-shot | shape:band, sprites:drip, shape:ring, sprites:puff, sprites:sparkle | Catch the Rain (the Queen of Cups; Ouranurgy): the sky poured down a thin column into the Lachrymato Bottle on the back; soft |  |
| `art.wholeness.fire` | one-shot | shape:ring×2, shape:band×8, sprites:streak, sprites:sparkle×2 | extends `art.react`. Wholeness (the World's reaction): Completion quietened: the seven rings flashed small at the feet |  |
| `art.will.fire` | one-shot | shape:ring×2, shape:band, sprites:streak, sprites:sparkle, shape:quad, sprites:diamond | extends `art.react`. Will (the Magician's reaction): Quick Swap quietened: a small card glint at the hand |  |
| `art.wish.use` | one-shot | shape:band×2, sprites:streak, shape:sphere, shape:ring×4, sprites:sparkle, sprites:puff, light, flash | Starlight (the Star, Swords; Ouranurgy): a column of the night sky poured down where you stand, star motes falling |  |
| `art.zero.armed` | held | shape:ring×2, sprites:sparkle | Running on Empty (the Fool's reaction), armed while costs are off: Beginner's Luck's lens in a whisper, a slow ring of the film at the feet |  |
| `art.zero.fire` | one-shot | shape:ring×3, shape:band×2, sprites:streak, sprites:sparkle×2 | extends `art.react`. Running on Empty fired (the pool ran dry): the slow ring of the film thrown out from the feet |  |

### pair (51)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `pair.1.hit` | one-shot | sprites:star4, sprites:ringthin, shape:crescent×2, shape:sphere, shape:beam×2, sprites:chip, sprites:sparkle, shape:ring, light, shake, hitstop | (on the creature it struck) the round's star, the claws biting, the line laid back to you |  |
| `pair.1.hold` | held | shape:band, shape:beam, sprites:streak, sprites:puff | (held on the creature while it is hauled in) the line's collar on it and its wake |  |
| `pair.1.use` | one-shot | shape:cone, shape:sphere, sprites:streak×3, sprites:puff, light | ---- I Hooked Shot: a shot that drags what it hits to you ------------------------------------------------------------------- (at the Courier, its line to what it hit) the shot leaves carrying the hook's line |  |
| `pair.10.hit` | one-shot | shape:band, shape:ring×4, shape:sphere, sprites:sparkle, sprites:puff, light, flash, shake | (where you stand; the caller's feeling the weather turned to) the weather falling in its feeling |  |
| `pair.10.use` | one-shot | shape:ring×2, shape:sphere, sprites:star4, sprites:ringthin, sprites:sparkle, light | ---- X Turn of Weather: spin the wheel of odds to turn the weather where you stand for a game hour ------------------------------ (at the Courier) the wheel of odds spun overhead, the vane turning against it |  |
| `pair.11.hit` | one-shot | shape:ring, shape:wave, shape:sphere, shape:disc, sprites:shard, sprites:sparkle, light, flash, shake, hitstop | (on the creature, at its weak point) the gold brackets snapped shut, the cut across it |  |
| `pair.11.use` | one-shot | shape:wave×2, shape:sphere, shape:ring, sprites:sparkle | ---- XI Appraised Cut: a blow on a weak point you have photographed is always the right kind ------------------------------------ (at the Courier) the blade reading what it was shown: a white glint running its edge |  |
| `pair.12.hold` | held | shape:sphere, shape:ring, shape:band×3, sprites:sparkle | (held on the creature while it is held) still in time |  |
| `pair.12.use` | one-shot | shape:disc, shape:ring, shape:sphere, sprites:ringthin, sprites:sparkle, light, flash, hitstop | ---- XII Held Plate: a photograph holds a creature still in time for a moment ---------------------------------------------------- (at the Courier, its line to the creature) the photograph, the coffin's chain thrown along it |  |
| `pair.13.hit` | one-shot | shape:wave, shape:sphere, shape:spiral, sprites:shard, sprites:ringthin, shape:disc, light, shake, hitstop | (on the downed creature) the blade's last stroke and its Lachryma torn out of it |  |
| `pair.13.use` | one-shot | shape:sphere×3, sprites:soft×2, light | ---- XIII Reaper's Draw: a blow that downs a creature drinks its Lachryma straight into the coffin -------------------------------- (at the coffin's mouth, its line from the downed one) its Lachryma drunk in |  |
| `pair.14.hit` | one-shot | shape:band, shape:sphere×2, sprites:soft×2, shape:ring, light | (on the Courier) the cracks mended |  |
| `pair.14.use` | one-shot | shape:disc×2, shape:ring×3, shape:sphere, sprites:drip, sprites:ringthin, sprites:soft, light | ---- XIV Healing Song: paint laid on the beat mends your cracks ------------------------------------------------------------------- (where the paint is laid on the beat) the bell's hoop across the paint |  |
| `pair.15.hit` | one-shot | sprites:star4, sprites:ringthin×2, shape:band, shape:sphere×2, shape:ring, light, shake, hitstop | (on the first creature struck) the chain's collar snapped on |  |
| `pair.15.hold` | held | sprites:ringthin, shape:band, sprites:glint | (held on the first creature, its line to the second, laid each frame) the chain between them |  |
| `pair.15.use` | one-shot | shape:cone, shape:sphere, sprites:streak, sprites:ringthin×2, sprites:puff, light | ---- XV Chain Shot: a shot that chains two creatures together where they stand -------------------------------------------------- (at the Courier, its line to what it hit) the shot uncoiling the coffin's chain |  |
| `pair.16.hit` | one-shot | caster:lightning, shape:band, shape:sphere, shape:ring×2, sprites:chip, sprites:puff×2, light, flash, shake, hitstop | (at the fork, its line from the sky down to it) the bolt |  |
| `pair.16.mark` | one-shot | shape:hoop, sprites:soft, shape:ring, sprites:glint | (at the fork where it sticks) the bolt gathering, 0.6 real s |  |
| `pair.16.use` | one-shot | shape:wave, shape:cone, shape:sphere, sprites:sparkle, sprites:puff, light | ---- XVI Lightning Rod: where the fork sticks, a bolt comes down ------------------------------------------------------------------ (at the Courier) the fork thrown with the gun's spark on it |  |
| `pair.17.hold` | held | sprites:drip, shape:ring, sprites:sparkle, sprites:puff | (riding the fork while it flies and paints; the looks keep its floor under it) the stream of paint falling from it | vfx/pairspeciallooks.js |
| `pair.17.mark` | one-shot | shape:disc×2, sprites:drip, shape:ring | (on the ground where a stamp of paint lands) its splash | vfx/pairspeciallooks.js |
| `pair.17.use` | one-shot | shape:ring, shape:sphere, sprites:drip, shape:crescent, sprites:soft, light | ---- XVII Painted Lure: the lure thrown leaves a stream of paint behind it -------------------------------------------------------- (at the fork in flight, its first stamp) the paint let go | vfx/pairspeciallooks.js |
| `pair.18.hit` | one-shot | shape:band, shape:ring, shape:sphere, shape:hoop×2, sprites:sparkle, sprites:puff, light | (where the fork lands) the mirage rising |  |
| `pair.18.hold` | held | shape:band×2, shape:ring, shape:hoop×2, sprites:sparkle | (held where the decoy stands, its life) the singing decoy |  |
| `pair.18.use` | one-shot | shape:wave, shape:ring, shape:sphere, sprites:sparkle, sprites:ringthin, light | ---- XVIII Singing Mirage: a decoy rises where the fork lands, singing so creatures go to it -------------------------------------- (at the Courier) the fork thrown ringing with the bell's song |  |
| `pair.19.hit` | one-shot | sprites:star4, sprites:ringthin, shape:ring, shape:sphere, sprites:streak×2, sprites:sparkle, light, hitstop | (on the marked creature, its line from the muzzle to where the round struck) a homing round landing on the mark | vfx/pairspeciallooks.js |
| `pair.19.mark` | held | shape:ring×4, sprites:glint | (held on the marked creature while the mark holds; the looks set its strength by the rounds left) the mark | vfx/pairspeciallooks.js |
| `pair.19.use` | one-shot | shape:disc, shape:ring×3, shape:sphere, sprites:streak, sprites:sparkle, light, flash, hitstop | ---- XIX The Mark: the Flash marks a creature, and every chamber homes on the mark --------------------------------------------- (on what the lent Flash marked) the Flash's rays, the gun's reticle closing on it | vfx/pairspeciallooks.js |
| `pair.2.mark` | held | shape:pillar, shape:ring×3, sprites:sparkle | (held on a hidden signature while it is shown; the looks draw it through walls) a column of the vane's gold, tagged |  |
| `pair.2.use` | one-shot | shape:disc, shape:band×2, shape:ring×3, shape:sphere, sprites:sparkle, sprites:star4, light, flash | ---- II Revelation: the Flash and the dowse at once: every hidden signature near you shown and tagged --------------------------- (at the Courier) the Flash and the dowse's sweep together |  |
| `pair.20.hit` | one-shot | shape:sphere×2, shape:ring, sprites:shard, sprites:chip, hitstop | (on each creature the wave strikes) its blow |  |
| `pair.20.use` | one-shot | shape:ring×3, shape:band, shape:sphere, shape:dome, shape:hoop×2, sprites:shard, sprites:puff, sprites:ringthin, light, flash, shake, hitstop | ---- XX Last Call: the toll opens the coffin: all it drank bursts out as a wave ---------------------------------------------------- (at the Courier; ctx.power its fill) the coffin opened by the toll, the wave |  |
| `pair.21.hit` | one-shot | shape:disc×2, shape:ring×2, sprites:star4, sprites:ringthin, shape:sphere, sprites:drip, sprites:glint, sprites:soft, light, shake, hitstop | (where it lands) the paint's splash and the enso written round it: the circle closed |  |
| `pair.21.use` | one-shot | shape:cone, shape:sphere, sprites:streak, sprites:soft, sprites:glint, sprites:puff, light | ---- XXI Full Circle: a shot that paints where it lands and mends what it passes ---------------------------------------------- (at the Courier, its line to where it lands) the shot trailing paint and gold |  |
| `pair.3.hold` | held | sprites:streak, shape:spiral, sprites:drip | (held at the receiver while the hoover drinks paint; its line from the ground being drunk, laid each frame) the paint drawn up | vfx/pairspeciallooks.js |
| `pair.3.mark` | held | shape:disc, shape:hoop×2, sprites:drip | (held on the ground where the hoover drinks) the paint swirled in to its middle | vfx/pairspeciallooks.js |
| `pair.3.use` | one-shot | shape:sphere×3, shape:spiral, sprites:soft, light | ---- III Coffin's Mop: the coffin drinks spilled paint and crude as it passes, and the brush pours it back as paint --------------- (at the receiver, the first sip of a hold) the gulp | vfx/pairspeciallooks.js |
| `pair.4.hit` | one-shot | sprites:star4, sprites:ringthin×2, shape:ring×3, shape:sphere, sprites:streak, hitstop | (on the creature a beat's shot staggers) the round's star in the toll's gold ring |  |
| `pair.4.hold` | held | shape:ring×2, sprites:soft | (held at the Courier while the six go) the beat kept on the ground |  |
| `pair.4.use` | one-shot | shape:ring, shape:cone, shape:sphere, shape:hoop×2, sprites:diamond, sprites:ringthin, light, shake | ---- IV On the Beat: six shots fired on the bell's beat, each one staggering ------------------------------------------------------- (at the Courier) the bell's ring at the gun hand, the six chambers on it |  |
| `pair.5.mark` | one-shot | shape:band, shape:ring×2, shape:crescent, sprites:sparkle | (on each creature the toll read) it is known better |  |
| `pair.5.use` | one-shot | shape:ring×2, shape:hoop×2, shape:sphere, shape:disc, shape:band, sprites:ringthin, sprites:sparkle, light, flash, shake | ---- V Rite: a toll that reads every creature it reaches, knowing it better ------------------------------------------------------- (at the Courier) the toll that reads |  |
| `pair.6.hit` | one-shot | shape:ring×3, shape:crescent×2, shape:sphere, sprites:sparkle×2, sprites:ringthin, light, shake, hitstop | (on the creature at the line's end) the toll's blow, stunning it | vfx/pairspeciallooks.js |
| `pair.6.use` | one-shot | shape:ring×2, shape:sphere, sprites:sparkle, sprites:streak | ---- VI Rung Line: hook a creature and the toll runs down the line, stunning it ----------------------------------------------- (on the line, moved from the hand to the bite; its dir along the line) the toll's ring running down it | vfx/pairspeciallooks.js |
| `pair.7.hit` | one-shot | shape:crescent×2, shape:ring×3, shape:sphere, sprites:chip, sprites:puff, light, shake | (at the fork where the hook bites it) the claws on the fork, the fork ringing |  |
| `pair.7.hold` | held | shape:band, sprites:streak, sprites:soft | (riding the Courier while flung; its dir the way they fly) the air torn past |  |
| `pair.7.use` | one-shot | shape:wave, shape:sphere, sprites:streak, shape:crescent×2, sprites:sparkle, sprites:puff, light | ---- VII Slingshot: throw the fork far and hook to it, flung through the air ---------------------------------------------------- (at the Courier, its line to the fork) the fork thrown, the hook's line paid out after it |  |
| `pair.8.hit` | one-shot | shape:disc×2, shape:sphere×2, shape:crescent, sprites:petal, shape:hoop, light | (on the creature a blow calms) still water and petals: no star, no sparks |  |
| `pair.8.use` | one-shot | shape:wave×2, shape:crescent, shape:sphere, sprites:petal, sprites:soft, light | ---- VIII Gentle Edge: a cutlass string whose blows calm instead of hurt -------------------------------------------------------- (at the Courier, once a string) the blade's arc lined with the brush's ink |  |
| `pair.9.hit` | one-shot | shape:ring, shape:crescent, shape:disc, shape:sphere, shape:band, sprites:soft, light, hitstop | (on what was photographed) the sigil written on it |  |
| `pair.9.use` | one-shot | shape:disc, shape:ring, shape:sphere, shape:crescent, sprites:sparkle, light, flash | ---- IX Illumined Page: photograph a sigil and it is written on what you photographed ------------------------------------------- (at the Courier) the photograph of the sigil |  |

### feeling (42)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `feeling.desire.aura` | held | shape:band, shape:ring, sprites:streak, sprites:soft, shape:disc | Desire held round a body: a band of ripples breathing to a heartbeat (every 1.1 real s), a ring drawn in to the feet on the beat, ribbons pulled in along the ground (calm: a slow pulse, never a flicker) |  |
| `feeling.desire.burst` | one-shot | shape:sphere, shape:dome, shape:ring×2, sprites:streak, shape:spiral, sprites:soft, shape:disc | a burst of Desire: a dome of ripples that contracts, then swells on two beats, a ring out on each, ribbons pulled in to its heart |  |
| `feeling.desire.drink` | one-shot | sprites:streak, sprites:soft×2, shape:ring, shape:sphere×2 | Desire drunk (at the Courier's chest: vfx/feelinglooks.js): ribbons and motes pulled in, a ring of ripples closing round them, taken in on two beats |  |
| `feeling.desire.rise` | one-shot | sprites:streak, shape:spiral, shape:sphere, shape:band, shape:dome, shape:ring×4, light, flash, sprites:soft, shape:disc | Desire awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): ribbons and a spiral pulled in from far off, then a column of ripples that contracts and swells on two beats round the Courier, a ring out on each, and the heart... |  |
| `feeling.desire.splash` | one-shot | shape:sphere, shape:disc, shape:ring×2, sprites:soft×2 | Desire spilt: a pool that contracts and swells twice, a ripple out on each beat, droplets, motes drawn back into it |  |
| `feeling.desire.trail` | held | shape:sphere, sprites:soft×2, sprites:ringthin | Desire held on a moving thing: a heart of ripples beating at its head, its wake drawn in after it, ripples left on the beat | vfx/shelllooks.js |
| `feeling.dread.aura` | held | shape:band×2, shape:ring, sprites:swirl, sprites:puff, shape:disc | Dread held round a body: ink round it, marbled, alpha-over; the dark closing in on the feet over and over; wisps creeping in; one dim light inside it; smoke rising (it creeps, never strobes: every loop is slow) |  |
| `feeling.dread.burst` | one-shot | shape:sphere, shape:dome×2, sprites:swirl, shape:ring, sprites:soft, shape:disc | a burst of Dread: one pale light at its heart going out, ink closing in over it from all round, tendrils creeping in, a ring of ink closing on the ground, the dark left lying there |  |
| `feeling.dread.drink` | one-shot | sprites:swirl, shape:ring, shape:sphere, sprites:glint, sprites:puff | Dread drunk (at the Courier's chest: vfx/feelinglooks.js): wisps of ink drawn in, a ring of ink closing round them, the pale light going into them and out, a breath of smoke off them after |  |
| `feeling.dread.rise` | one-shot | sprites:swirl, shape:ring, shape:sphere, light, shape:dome×2, shape:spiral, sprites:puff, sprites:soft, shape:disc | Dread awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): tendrils creeping in along the ground round the Courier and a ring of ink closing, then the one bright source at their heart going out as a dome of ink closes dow... |  |
| `feeling.dread.splash` | one-shot | shape:sphere, shape:disc×2, shape:ring, sprites:drip, sprites:puff | Dread spilt: an ink pool creeping wider, its one pale light dying at its heart, tendrils closing at its edge, drops of ink, smoke |  |
| `feeling.dread.trail` | held | shape:sphere×2, sprites:puff, sprites:swirl, sprites:soft | Dread held on a moving thing: a head of ink with a dim green light in it, ink smoke left behind it swelling, wisps drawn back in | vfx/shelllooks.js |
| `feeling.fury.aura` | held | shape:band×2, shape:ring, sprites:soft, sprites:streak, shape:disc | Fury held round a body: a band of cracks racing up it, rays turning fast inside, a ring of cracks spinning at the feet, embers thrown off hard (fast, never a flicker: its speed is the scroll's, its light steady) |  |
| `feeling.fury.burst` | one-shot | shape:sphere, shape:spikes, shape:dome, shape:ring, shape:disc, sprites:streak, shake, sprites:soft, sprites:puff | a burst of Fury: a hard white core, jagged spikes and a dome of cracks thrown out fast, a shock ring, cracks racing over the ground, sparks and embers thrown hard, a short sharp shake |  |
| `feeling.fury.drink` | one-shot | sprites:streak, shape:ring, shape:sphere×2, sprites:soft | Fury drunk (at the Courier's chest: vfx/feelinglooks.js): sparks snapped in fast, a ring of cracks snapping shut round them, a hard pulse as it is taken in, embers popping off them |  |
| `feeling.fury.rise` | one-shot | sprites:streak×2, shape:ring×3, shape:sphere, shape:spikes, shape:band, shape:disc, light, flash, shake, sprites:soft, sprites:puff | Fury awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): sparks snapped in, then at once spikes erupting, a pillar of cracking fire shot up round the Courier, shock rings out twice, cracks racing over the ground, embers ... |  |
| `feeling.fury.splash` | one-shot | shape:sphere, shape:disc, shape:spikes, sprites:soft×2, sprites:puff | Fury spilt: a molten spill slammed out flat, its cracks glowing and cooling, a jagged crown, droplets flung far, embers rising |  |
| `feeling.fury.trail` | held | shape:sphere, sprites:streak, sprites:soft, sprites:puff | Fury held on a moving thing: a hard hot head of cracks, sparks thrown sideways hard, embers falling from its wake | vfx/shelllooks.js |
| `feeling.gall.aura` | held | shape:band×2, sprites:drip, sprites:puff, sprites:bubble, shape:disc | Gall held round a body: a film of bile round it sagging slowly down (alpha-over), its violet sheen inside, drips falling off it and splatting at the feet, bubbles rising and popping |  |
| `feeling.gall.burst` | one-shot | shape:sphere, shape:dome×2, sprites:drip, sprites:puff×2, sprites:bubble, sprites:ringthin, shape:disc | a burst of Gall: a blob of curds swelling slowly and sagging under a film of bile, drips thrown up that fall and splat, bubbles rising and bursting, the film left on the ground eating away |  |
| `feeling.gall.drink` | one-shot | sprites:soft, sprites:bubble, shape:ring, shape:sphere×2, sprites:drip | Gall drunk (at the Courier's chest: vfx/feelinglooks.js): blobs and bubbles drawn in, slowing as they come, a ring closing sluggishly, taken in with a wobble, a few drips falling off them after |  |
| `feeling.gall.rise` | one-shot | shape:disc×2, sprites:soft, sprites:bubble×2, shape:sphere, shape:band×2, shape:dome, sprites:drip, sprites:puff×2, sprites:ringthin, light, flash | Gall awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): its film welling up round the Courier's feet and its blobs drawn in, slowing, then a column of curds welling up slow and sagging under its film, drips raining off ... |  |
| `feeling.gall.splash` | one-shot | shape:sphere, shape:disc×2, sprites:drip, sprites:bubble, sprites:ringthin, sprites:puff | Gall spilt: a thick pool spreading slowly under its film, strings thrown that fall, bubbles welling out of it and popping, mist over it |  |
| `feeling.gall.trail` | held | shape:sphere, sprites:drip, sprites:bubble, sprites:puff | Gall held on a moving thing: a wobbling blob of curds, drips falling from it, bubbles left rising, a breath of bile in its wake | vfx/shelllooks.js |
| `feeling.grief.aura` | held | shape:band, sprites:drip, shape:ring, shape:disc, sprites:soft | Grief held round a body: a curtain of streaks running down round it, drips falling off it slowly, a ring spreading at its feet again and again, mist pooled low (it settles; its out is slow: a long dissipation) |  |
| `feeling.grief.burst` | one-shot | shape:sphere, shape:dome, sprites:streak, shape:ring, sprites:drip, shape:disc, sprites:soft | a burst of Grief: a dome of streaks that runs down and settles flat, rain falling round it, tears, a ring spreading slowly, and mist and motes left longest of all |  |
| `feeling.grief.drink` | one-shot | sprites:streak, shape:ring, shape:sphere×2, sprites:drip | Grief drunk (at the Courier's chest: vfx/feelinglooks.js): streaks drawn in, sinking as they come, a ring closing slowly round them, taken in and settling, drops falling off them after |  |
| `feeling.grief.rise` | one-shot | sprites:streak×2, shape:ring×3, shape:sphere, shape:band, shape:dome, light, flash, shape:disc, sprites:soft | Grief awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): the sky falling in round the Courier, then a curtain of streaks running down round them, a dome settling flat, rain for two seconds, rings spreading slowly, and m... |  |
| `feeling.grief.splash` | one-shot | shape:sphere, shape:disc×2, shape:band, sprites:soft, shape:ring | Grief spilt: a pool running out slowly, a crown of it sinking back, drops falling back into it, rings slow on it, mist hanging over it |  |
| `feeling.grief.trail` | held | shape:sphere, sprites:drip, sprites:streak, sprites:soft | Grief held on a moving thing: a head of streaks running down, drips falling straight from it, streaks shed, motes left sinking longest | vfx/shelllooks.js |
| `feeling.mirth.aura` | held | shape:band, shape:ring, sprites:disc×2, shape:disc | Mirth held round a body: a band of dots bobbing on a spring, a ring popping at the feet, dots hopping off and landing (calm enough) |  |
| `feeling.mirth.burst` | one-shot | shape:sphere, shape:dome, shape:ring×3, sprites:disc×3, sprites:ringthin | a burst of Mirth: a dome of dots that lands with a squash and a stretch, rings popping out in steps, dots hopping out and hopping again |  |
| `feeling.mirth.drink` | one-shot | sprites:disc×4, shape:ring, shape:sphere×2, sprites:ringthin | Mirth drunk (at the Courier's chest: vfx/feelinglooks.js): dots hopping in toward them in three steps, a ring closing in steps, taken in with a pop and a bounce, a couple of dots hopping off after |  |
| `feeling.mirth.rise` | one-shot | shape:ring×7, sprites:disc×5, shape:sphere, shape:band, shape:dome, light, flash, shape:disc | Mirth awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): rings closing in three steps, then a column of dots springing up in four steps round the Courier, a dome bouncing, rings popping out one after another, dots hoppi... |  |
| `feeling.mirth.splash` | one-shot | shape:sphere, shape:disc, shape:ring, sprites:disc×2, sprites:ringthin | Mirth spilt: a pool that wobbles as it lands, droplets hopping out and again, pops on its surface one after another |  |
| `feeling.mirth.trail` | held | shape:sphere, sprites:disc×2, sprites:ringthin | Mirth held on a moving thing: a head of dots bobbing as it goes, dots hopping off its path, pops left behind | vfx/shelllooks.js |
| `feeling.wonder.aura` | held | shape:band×2, shape:spikes, sprites:glint, shape:disc | Wonder held round a body: a slow wall of frost lifting, a crown of needles at the feet, diamond dust rising (calm: it stands beside play) |  |
| `feeling.wonder.burst` | one-shot | shape:sphere, shape:dome, shape:spikes, shape:ring, sprites:sparkle, sprites:glint, shape:disc | a burst of Wonder: a dome of frost blooming slowly up, needles growing at its edge, a hushed ring, and diamond dust that stays |  |
| `feeling.wonder.drink` | one-shot | sprites:sparkle, shape:ring, shape:sphere×2, sprites:glint | Wonder drunk (played at the Courier's chest: vfx/feelinglooks.js): motes drawn in slowly, a ring of frost closing round them, taken in and glowing a breath, a few glints left (Takai's Cure: gathered, made visible, absorbed, then glowing) |  |
| `feeling.wonder.rise` | one-shot | sprites:sparkle×2, shape:ring×3, shape:sphere, shape:band, shape:spikes, shape:spiral, light, flash, sprites:glint, shape:disc | Wonder awakened (the flood's secondary and tertiary: vfx/awakeninglook.js): motes gathered in, then a column of frost lifting out of the ground round the Courier, slow, needles growing round their feet, rings drifting out, and the dust h... |  |
| `feeling.wonder.splash` | one-shot | shape:sphere, shape:disc, shape:band, sprites:soft, shape:spikes, sprites:sparkle | Wonder spilt: a pool that spreads and freezes over, a crown of it, frost needles round its rim, and glints rising off it |  |
| `feeling.wonder.trail` | held | shape:sphere, sprites:sparkle, sprites:glint, sprites:soft | Wonder held on a moving thing: a cold star at its head, frost motes left hanging and lifting, diamond dust in its wake | vfx/shelllooks.js |

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
| `hit` | one-shot | sprites:core, shape:disc, sprites:streak, sprites:soft | what every blow shows, whatever struck what: the 0.1 s white core, a star of rays, sparks thrown along the blow, motes left hanging | audio/cues.js, audio/godpowers.js, audio/seaserpent.js +32 |
| `hit.blunt` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft, sprites:puff | a blunt blow: a ring of rays knocked out flat, and dust lifting off | vfx/blowfeeleffects.js |
| `hit.blunt.clay` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft, sprites:puff, sprites:chip | extends `hit.blunt`. what clay gives up: chips of it, falling, and a puff of its dust | vfx/vfx.js |
| `hit.blunt.clay.kill` | one-shot | sprites:core, shape:ring×2, sprites:streak, sprites:soft, sprites:puff, sprites:chip, sprites:star4 | extends `hit.blunt.clay`. a kill: what it was made of bursts in a pop of its colour (a second shape), and a few stars of it go up (a finishing beat on top of its own death) |  |
| `hit.blunt.crystal` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft, sprites:puff, sprites:shard, sprites:sparkle | extends `hit.blunt`. crystal rings and splinters: shards and glints in the stone's colours |  |
| `hit.blunt.jelly` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft×2, sprites:puff, sprites:bubble | extends `hit.blunt`. jelly: bubbles that float off, drops of its goo that fall |  |
| `hit.blunt.jelly.kill` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft×2, sprites:puff, sprites:bubble×2, shape:sphere | extends `hit.blunt.jelly`.  |  |
| `hit.blunt.metal` | one-shot | sprites:core, shape:ring, sprites:streak×2, sprites:soft, sprites:puff, sprites:ringthin | extends `hit.blunt`.  |  |
| `hit.blunt.stone` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft, sprites:puff×2, sprites:chip | extends `hit.blunt`.  |  |
| `hit.blunt.straw` | one-shot | sprites:core, shape:ring, sprites:streak×2, sprites:soft, sprites:puff | extends `hit.blunt`. straw: Strawman's sack (its kind's look, vfx.js materialOf): stalks of straw thrown and drifting down, a breath of burlap dust; never clay chips off a dummy of straw (its own puffs of straw at the seams are its body'... |  |
| `hit.blunt.wood` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft, sprites:puff×2, sprites:shard | extends `hit.blunt`. wood: splinters and sawdust; stone: grey chips and a dust cloud; metal: a shower of hot sparks and a clang ring |  |
| `hit.shot` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft | a shot: smaller, a ring stood along the shot, sparks back off the surface | vfx/blowfeeleffects.js |
| `hit.shot.clay` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft, sprites:chip, sprites:puff | extends `hit.shot`.  |  |
| `hit.shot.clay.kill` | one-shot | sprites:core, shape:ring×2, sprites:streak, sprites:soft, sprites:chip, sprites:puff, sprites:star4 | extends `hit.shot.clay`.  |  |
| `hit.shot.crystal` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft, sprites:shard | extends `hit.shot`.  |  |
| `hit.shot.jelly` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft×2, sprites:puff, sprites:bubble | extends `hit.blunt.jelly`.  |  |
| `hit.shot.metal` | one-shot | sprites:core, shape:ring, sprites:streak×2, sprites:soft | extends `hit.shot`.  |  |
| `hit.shot.stone` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft, sprites:chip, sprites:puff | extends `hit.shot`.  |  |
| `hit.shot.straw` | one-shot | sprites:core, shape:ring, sprites:streak×2, sprites:soft | extends `hit.shot`.  |  |
| `hit.shot.wood` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft, sprites:shard | extends `hit.shot`.  |  |
| `hit.slash` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:glint | a cutting blow: a crescent swept round the cut, and glints thrown wide either side of it, twinkling out | vfx/blowfeeleffects.js, vfx/vfx.js |
| `hit.slash.clay` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:glint, sprites:chip | extends `hit.slash`.  |  |
| `hit.slash.clay.kill` | one-shot | sprites:core, shape:ring×2, sprites:streak, sprites:glint, sprites:chip, sprites:star4 | extends `hit.slash.clay`.  |  |
| `hit.slash.crystal` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:glint, sprites:shard | extends `hit.slash`.  | vfx/vfx.js |
| `hit.slash.jelly` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:soft×2, sprites:puff, sprites:bubble | extends `hit.blunt.jelly`.  |  |
| `hit.slash.metal` | one-shot | sprites:core, shape:ring, sprites:streak×2, sprites:glint | extends `hit.slash`.  |  |
| `hit.slash.stone` | one-shot | sprites:core, shape:ring, sprites:streak×2, sprites:glint, sprites:chip | extends `hit.slash`.  |  |
| `hit.slash.straw` | one-shot | sprites:core, shape:ring, sprites:streak×2, sprites:glint, sprites:puff | extends `hit.slash`.  |  |
| `hit.slash.wood` | one-shot | sprites:core, shape:ring, sprites:streak, sprites:glint, sprites:shard | extends `hit.slash`.  |  |

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

### domain (28)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `domain.alteration.cast` | one-shot | shape:crescent×4, shape:band, shape:sphere, sprites:petal, shape:disc, sprites:soft | turned: a band swept up the body through the flambe, crescents turning, flakes changing colour as they fall |  |
| `domain.alteration.hit` | one-shot | shape:band, shape:sphere, shape:crescent, sprites:petal | a short band wiped up across the point, a crescent flicked round it |  |
| `domain.alteration.hold` | held | shape:band, shape:crescent×2, sprites:petal, shape:disc | held: the band swept up every 2.4 real s, two crescents turning against each other |  |
| `domain.alteration.level` | one-shot | shape:crescent×5, shape:band×2, shape:sphere, shape:ring, flash, light, shake, sprites:petal, shape:disc, sprites:soft | the level-up: the band swept past the head, crescents at three heights, a ring of the ramp run out |  |
| `domain.divination.cast` | one-shot | shape:hoop×3, shape:sphere, shape:ring, shape:disc×2, shape:band, sprites:star4, sprites:sparkle | seeing: thin sonar rings swept out flat, an iris narrowing then opening, a scan line climbing |  |
| `domain.divination.hit` | one-shot | shape:hoop, shape:sphere, shape:ring, shape:disc, sprites:star4, sprites:sparkle | a thin ring pinged out flat round the point, an iris snapping open over it |  |
| `domain.divination.hold` | held | shape:hoop×2, shape:band, shape:ring, shape:disc, sprites:sparkle | held: a sonar sweep every 2.4 real s, a scan line, a small iris, specks hanging |  |
| `domain.divination.level` | one-shot | shape:hoop×4, shape:sphere, shape:ring, shape:disc×2, shape:band×2, flash, light, sprites:star4, sprites:sparkle | the level-up: four sonar rings to seven metres, the iris opened over the head, two scan lines |  |
| `domain.manifestation.cast` | one-shot | sprites:shard, shape:disc, shape:spikes, shape:cone, shape:sphere, shape:ring, sprites:glint, sprites:facet, sprites:puff, sprites:soft | made: shards drawn in, spikes and a cone crystallising up out of the ground, the kiln's orange flash, dust settling |  |
| `domain.manifestation.hit` | one-shot | sprites:shard, shape:spikes, shape:sphere, shape:ring, sprites:soft | a cluster of crystal punched out of the struck point along the blow |  |
| `domain.manifestation.hold` | held | shape:spikes, sprites:facet, shape:disc, sprites:soft, sprites:puff | held: a low stand of crystal breathing, shards orbiting it, grains rising and settling |  |
| `domain.manifestation.level` | one-shot | sprites:shard, shape:disc, shape:spikes×2, shape:sphere, shape:ring×2, flash, light, shake, sprites:glint, sprites:facet, sprites:puff, sprites:soft | the level-up: two rings of crystal crystallising up round the Courier and fired in the kiln's orange |  |
| `domain.ouranurgy.cast` | one-shot | shape:ring×4, shape:pillar×2, shape:sphere, sprites:star4 | the sky's act: a ring closes, a pillar falls on the spot under two turning hoops, stars fall after it |  |
| `domain.ouranurgy.hit` | one-shot | shape:pillar, shape:sphere, shape:ring×2, sprites:star4 | a thin shaft dropped on the point, a graduated ring knocked out and one hoop turning |  |
| `domain.ouranurgy.hold` | held | shape:ring×3, sprites:star4, shape:pillar | held: the armillary turning over a graduated ground ring, stars falling through a cool column |  |
| `domain.ouranurgy.level` | one-shot | shape:ring×5, shape:pillar×2, shape:sphere, flash, light, shake, shape:disc, sprites:star4 | the level-up: a pillar from twelve metres, three hoops opening out round the Courier, the sky laid at the feet |  |
| `domain.possession.cast` | one-shot | sprites:streak, shape:spiral, shape:dome, shape:sphere×2, shape:band, sprites:soft | reaching in: tethers reeled in, a spiral wound tight, a shell closing, a collar tightening |  |
| `domain.possession.hit` | one-shot | sprites:streak, shape:dome, shape:sphere, shape:spiral, sprites:soft | a small shell snapping shut on the point, tethers and a spiral drawn in |  |
| `domain.possession.hold` | held | shape:spiral, shape:band, shape:dome, sprites:soft, shape:sphere | held: a spiral drawn in over and over, a collar breathing, a faint shell, motes drawn in |  |
| `domain.possession.level` | one-shot | sprites:streak, shape:spiral×2, shape:dome, shape:sphere×2, shape:band, flash, light, shake, sprites:soft | the level-up: two spirals wound against each other, a shell closing over the Courier |  |
| `domain.psychokinesis.cast` | one-shot | shape:ring×3, shape:band×2, shape:sphere, sprites:chip, sprites:streak, sprites:puff | the push: a shockwave wall thrown out all round, debris lifted and swirled, a dust curtain |  |
| `domain.psychokinesis.hit` | one-shot | shape:wave, shape:sphere, shape:ring, sprites:chip, sprites:puff | a wave of force thrown along the blow, chips knocked off |  |
| `domain.psychokinesis.hold` | held | shape:band, shape:ring×2, sprites:chip, sprites:puff | held: the lift: warped air round the body, a push breathing out, debris orbiting |  |
| `domain.psychokinesis.level` | one-shot | shape:ring×3, shape:band×3, shape:sphere, flash, light, shake, sprites:chip, sprites:streak, sprites:puff | the level-up: two shockwave walls, debris lifted high, a dust curtain, a shake |  |
| `domain.spellscription.cast` | one-shot | shape:crescent×4, shape:ring×3, shape:quad, shape:sphere, shape:band, sprites:talisman, sprites:soft | written: strokes in the air, a circle drawn by a racing brush, a seal stamped at its heart, ink left |  |
| `domain.spellscription.hit` | one-shot | shape:ring, shape:quad, shape:sphere, sprites:crescent, sprites:soft | a seal stamped on the point in the camera's plane, a circle written round it |  |
| `domain.spellscription.hold` | held | shape:ring×2, shape:crescent, shape:band, sprites:soft, sprites:sparkle | held: the written circle turning, a brush tracing it, a band of script at the chest |  |
| `domain.spellscription.level` | one-shot | shape:crescent×6, shape:ring×3, shape:quad, shape:sphere, shape:band×2, flash, light, shake, sprites:talisman, sprites:soft | the level-up: five strokes, a circle drawn round the Courier, the seal stamped at the feet, two bands of script |  |

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
| `aura.blind` | held | shape:band, sprites:glint |  |  |
| `aura.calm` | held | shape:ring, sprites:petal | calmed: still water at its feet, petals drifting round |  |
| `aura.charm` | held | shape:ring, sprites:petal |  |  |
| `aura.confusion` | held | shape:ring, sprites:bubble, sprites:drip |  |  |
| `aura.doubt` | held | shape:ring, sprites:hex | the four a damage type builds (progress/combat/types.js `builds`), each in its type's colour and motif (docs/ART.md: the damage types) |  |
| `aura.empower` | held | shape:band, sprites:sparkle | empowered: a column of gold rays rising round it, sparkles going up |  |
| `aura.forget` | held | shape:ring, sprites:swirl | forgetting: the Mind's words turning over its head, dissolving and forming again |  |
| `aura.halt` | held | shape:band, sprites:diamond | halted: a band of frost standing round the body, all but still, frost diamonds glinting on it |  |
| `aura.haste` | held | shape:band, sprites:streak | hasted: speed lines racing up the body, ember to gold |  |
| `aura.melt` | held | shape:band, sprites:soft, sprites:puff | melting: the body's lower half running, drips falling off it, a breath of steam |  |
| `aura.sleep` | held | shape:sphere, sprites:bubble | a status, shown round whatever has it, as long as it has it: asleep, a drowsy haze breathing at the head, bubbles rising off it |  |
| `aura.slow` | held | shape:ring, sprites:soft | slowed: time dragging at its feet, motes sinking |  |
| `aura.soaked` | held | shape:band, sprites:drip, sprites:glint |  |  |
| `aura.soft` | held | shape:sphere, sprites:puff | softened (the next blow doubled): a cushion round it, its pink puffs drifting |  |

### slab (13)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `slab.blast` | one-shot | sprites:core, shape:hoop, sprites:chip, sprites:puff, sprites:streak | the psygun: a wide burst of the crust, a ring blown flat across the face, chips and dust everywhere |  |
| `slab.brush` | one-shot | sprites:puff, sprites:chip, sprites:glint | the Soul Brush: dust swept off the face in a slow fan, a few grains, nothing sharp |  |
| `slab.crack` | one-shot | sprites:star4, sprites:ringthin, sprites:shard, sprites:sparkle | added when the blow reached the fossil: a crack star in the film over it, dark shards of Lachrymite | vfx/garden/slablook.js |
| `slab.crumble` | one-shot | sprites:chip, sprites:puff | the stone left falling away from it in its strata's colours, dust hanging | vfx/garden/slablook.js |
| `slab.hoover` | one-shot | sprites:chip, sprites:puff, sprites:swirl | the Lockheart: the rubble round the cell drawn in and gone, a swirl, a breath of dust following it |  |
| `slab.lift` | one-shot | sprites:sparkle, sprites:puff | the carving's end: the fossil lifting off its bed, the film's motes rising off it | vfx/garden/slablook.js |
| `slab.pick` | one-shot | sprites:core, sprites:chip, sprites:shard, sprites:puff, sprites:glint | the Dreamvane's pick: a chunk knocked out, chips thrown hard off the face, a puff, the pick's gold glint |  |
| `slab.rare` | one-shot | sprites:star4, sprites:glint | a rare spirit's glint in the garden, now and then: two white and gold stars | vfx/garden/rarespirits.js |
| `slab.silhouette` | one-shot | shape:disc, sprites:glint, sprites:core | the Veritome: the plate pressed to the slab's face, a flash of the film the size of the slab, its corners glinting | vfx/garden/slablook.js |
| `slab.slice` | one-shot | sprites:streak, sprites:chip, sprites:puff, sprites:glint | the Sondelass: a layer shaved off flat, a bright line drawn along the cut (from, to), flakes peeling off it |  |
| `slab.toll` | one-shot | shape:hoop×3, sprites:ringthin×3 | the Crucibelle: three rings of the bell's gold run out through the stone, flat in the slab's plane, a beat apart | vfx/garden/slablook.js |
| `slab.wake` | one-shot | sprites:core, shape:sphere, shape:hoop, sprites:sparkle, sprites:soft, light | the spirit waking out of the fossil: a burst of its feeling, the film's sparks, a ring, a light | vfx/garden/slablook.js |
| `slab.wake.rare` | one-shot | sprites:core, shape:sphere, shape:hoop, sprites:sparkle, sprites:soft, light, sprites:star4, sprites:glint | extends `slab.wake`. a flawless dig's: the same, and a ring of white and gold stars round it (the shiny's) | vfx/garden/slablook.js |

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
| `sea.dig` | one-shot | sprites:chip, sprites:puff |  | audio/cues.js, feedback/tracking/opensea.js, progress/cosmetics.js +4 |
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

### jellymount (7)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `jellymount.burst` | one-shot | sprites:soft×4, sprites:puff, sprites:sparkle, shake | its life at none: gobs of its body and a fine spray flung out in its colour, a low ring of drops, sand dust, a small shake | vfx/jellymount/look.js |
| `jellymount.call` | one-shot | sprites:chip, sprites:puff, sprites:soft, sprites:sparkle | the slip jelly mount welling up out of the ground: sand pushed up and out in a ring, wet drops thrown up off it, a glint of its Lachryma | vfx/jellymount/look.js |
| `jellymount.drink` | one-shot | sprites:soft, sprites:glint | crude drunk off a blot: its ink drawn in across the ground to the foot, the oil film glinting on it | vfx/jellymount/look.js |
| `jellymount.hop` | one-shot | sprites:soft, sprites:puff | its hop's take-off: drops flicked out low round its foot, a skirt of sand dust (power: the bounce chain) | vfx/jellymount/look.js |
| `jellymount.hurt` | one-shot | sprites:soft, sprites:puff | a blow taken for the rider: drops of its body knocked off and falling | vfx/jellymount/look.js |
| `jellymount.land` | one-shot | sprites:soft, sprites:puff | its landing: the drops flatter, more dust (power: the fall) | vfx/jellymount/look.js |
| `jellymount.slump` | one-shot | sprites:soft, sprites:puff | it melts back into the ground: a few drops sliding off, a wet sigh of dust | vfx/jellymount/look.js |

### ult (6)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `ult.ascend` | one-shot | sprites:core, shape:pillar, shape:ring, mesh:chest_shock×2, sprites:streak, flash, light, shake | the coffin's ascent: the column launched up out of it, rings stacked up the pillar's foot, a burst at the coffin's mouth | cine/sequences.js, tools/lockheart/ultimate.js |
| `ult.crown` | held | mesh:ult_crown×2, shape:spikes, shape:ring, sprites:ringthin, sprites:glint | round the coffin while it hangs open in the air: a crown of flame and a halo | cine/sequences.js, tools/lockheart/ultimate.js |
| `ult.invoke` | held | decal:circle_lotus×2, decal:circle_swirl, mesh:ult_vortex, shape:ring, shape:band, sprites:soft, sprites:sparkle, sprites:diamond | (tools/lockheart/ultimate.js plays these; the owner's gold standard for a cinematic event: too much, on purpose) the invocation, held while it lasts: the whirl on the ground, the invocation written round it, motes drawn in from all round... | cine/sequences.js, tools/lockheart/ultimate.js |
| `ult.key` | one-shot | sprites:core, shape:ring, shape:sphere, sprites:star4, sprites:ringthin, sprites:streak, sprites:sparkle, sprites:petal, light, shake | a key plunged into the coffin: its colour (tint), loud | cine/sequences.js, tools/lockheart/ultimate.js, vfx/vfx.js |
| `ult.land` | one-shot | decal:circle_lotus, decal:circle_swirl, flash, hitstop, shake, smear, light×2, sprites:core, sprites:star4×2, shape:ring, shape:dome, mesh:ult_dome, mesh:chest_shock×3, sprites:streak, sprites:petal, sprites:puff, sprites:sparkle | the wheel lands: everything at once | cine/sequences.js, tools/lockheart/ultimate.js |
| `ult.pillar` | held | mesh:ult_pillar×2, mesh:ult_helix, shape:pillar, shape:spiral, sprites:streak, sprites:sparkle, sprites:petal | the pillar, held from the ascent to the end: a column of Lachryma to the sky, its core of rays scrolling up, the great helix and a gold ribbon round it, streaks and sparkles flowing up it, and motes orbiting | cine/sequences.js, tools/lockheart/ultimate.js, vfx/vfx.js |

### damage (5)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `damage.delirium` | one-shot | shape:disc, sprites:drip, sprites:puff, sprites:bubble | DELIRIUM chaotic, entropic: ink and a sick violet-green; smoke that curls up, drips that fall, bubbles that burst. Things coming apart. |  |
| `damage.ego` | one-shot | shape:ring, sprites:hex, sprites:diamond | EGO lawful, mental: lapis; a hex lattice that opens and holds still, diamonds in an exact ring. A mind made rigid. |  |
| `damage.illusion` | one-shot | shape:disc, sprites:glint, sprites:sparkle | ILLUSION chaotic, perceptual: the labradorite's flash; curls that turn, glints that will not hold still, a doubled sparkle. |  |
| `damage.impact` | one-shot | shape:quad, sprites:ringthin, sprites:facet | IMPACT lawful, physical: bone and gold; a square flash on its corner crazed like fired clay struck, facets thrown straight out |  |
| `damage.influence` | one-shot | shape:ring, sprites:ripple, sprites:petal | INFLUENCE neutral, social: rose and warm gold; ripples spread slow and even, petals drift out. What spreads from one to many. |  |

### dunes (5)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `dunes.devil.scuff` | held | sprites:puff, sprites:chip |  | vfx/dunes/dustdevils.js |
| `dunes.fulgurite.dig` | one-shot | sprites:chip, sprites:puff, sprites:star4, sprites:core |  | vfx/dunes/hotfulgurite.js |
| `dunes.fulgurite.glint` | one-shot | sprites:star4 |  | vfx/dunes/fulgurites.js, vfx/dunes/hotfulgurite.js |
| `dunes.fulgurite.hot` | held | sprites:core, sprites:puff |  | vfx/dunes/hotfulgurite.js |
| `dunes.fulgurite.strike` | one-shot | sprites:core, light, sprites:chip, sprites:puff×2 |  | vfx/dunes/fulgurites.js |

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
| `temper.agitated` | held | shape:band, sprites:puff, sprites:soft |  | vfx/temper.js |
| `temper.enraged` | held | shape:ring, sprites:streak |  | vfx/temper.js |
| `temper.prismatic` | held | shape:band, sprites:glint, sprites:drip |  | vfx/temper.js |
| `temper.stoic` | held | shape:band, sprites:facet, sprites:puff | a creature's mental state and agitation shown with its body; quiet at the middle, only the ends and the heat have a look of their own | vfx/temper.js |

### garden (3)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `garden.lotus.land` | one-shot | sprites:sparkle, sprites:petal, sprites:ringthin | the lotus across catching the Jar: a puff of pollen and a few petals | vfx/garden/launchlotus.js |
| `garden.lotus.launch` | one-shot | sprites:petal, sprites:sparkle, sprites:soft, sprites:ring, sprites:core, light | a launch lotus flinging the Pneuka Jar: petals thrown up and out, pollen in gold and the film shot along the up, motes of where it throws to, a ring | vfx/garden/launchlotus.js |
| `garden.smoke` | held | sprites:puff | held: a chimney's smoke rising along `dir`, slow, spreading, lavender grey (the Athanor's cap, the kiln's stack) | vfx/garden/facilitylooks.js |

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

### panic (2)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `panic` | one-shot | sprites:drip, sprites:ringthin |  | progress/sandbox.js, vfx/library/panic.js, vfx/panic.js |
| `panic.heavy` | one-shot | sprites:drip, sprites:star4, sprites:ring | a flooring hit: more sweat thrown harder, a wider ring, and the squeans spun off round the head | vfx/panic.js |

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
| `absorb` | one-shot | shape:ring, sprites:glint | a thing taken into the Courier: a ring closing in on where it went, its sparkle drawn in after it | audio/duelsecrets.js, audio/puzzleduel.js, courier/jellymount/jellymount.js +10 |

### angle (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `angle.lift.splash` | one-shot | sprites:soft×3, sprites:puff, sprites:glint | extends `skiff.water.enter`.  | tools/sondelass/angling/catchlift.js |

### crystal (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `crystal.strike` | one-shot | shape:disc, sprites:facet, sprites:glint | a crystal formation struck with the pick: a hard glint, faceted shards of solid Lachryma knocked off, oxide-bright, glints after | feedback/tracking/dreamvane.js, progress/aptitude.js, progress/classarts.js +4 |

### cut (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `cut` | one-shot | shape:disc, sprites:streak, sprites:glint | a cut through the air (the cutlass meeting something, the blade mode's planes, the god hand's slash): a seam of light along the stroke, a hot star at its middle, glints thrown off it ('from' -> 'to' in the context: spawn 'line') | cine/overture.board.js, cine/sequence.js, music/lockheart.js +12 |

### dunemaw (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `dunemaw.motes` | held | sprites:soft, sprites:swirl |  | vfx/dunemaw.js, world/well/dunemaw.js |

### embers (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `embers` | one-shot | shape:sphere, sprites:soft | what a lantern or a fire leaves in the air: a breath of heat, embers rising out of it, twinkling, falling back | progress/skiffpaint.js, vfx/flourishes.js, vfx/particles.js +2 |

### impact (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `impact` | one-shot | shape:cone, sprites:streak, sprites:puff |  | audio/cues.js, audio/damage.js, audio/shellparts.js +48 |

### implode (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `implode` | one-shot | shape:sphere, sprites:streak, light | something collapsing inward and bursting: a sphere drawn in then thrown open, hot streaks out of it, a flash of light | vfx/particles.js |

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
| `poof` | one-shot | shape:sphere, sprites:ringthin, sprites:star4, sprites:puff | a thing gone in a puff: smoke that swells and lifts, a ring, a few stars (cartoon's disappearance) |  |

### shock (1)

| effect | kind | layers | what | asked by |
|---|---|---|---|---|
| `shock` | one-shot | shape:ring, sprites:ring, sprites:ringthin, sprites:sparkle | a shockwave out of a feat of the Courier's power (the parry, a dive's landing, a charge's end, a bomb's pop, the Opening: fx.shockwave): Lachryma's ring, not a white one. The oil film's hues banded across a ring running out, a band of cr... | vfx/particles.js, workbench/lachrymastage.js |

