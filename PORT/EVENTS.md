# Event catalogue (generated: node scripts/port/filemap.mjs)

Every event name on the bus (`game.events.emit(name, payload)`; the bus adds `name` and `t`). `E:` the files that emit it, `H:` the files that listen. 1190 names. Grep this.

## aberrant
- `aberrant.look` E: vfx/databug.js

## achievement
- `achievement.unlock` E: progress/achievements.js

## alarm
- `alarm` E: creatures/jelly/slipjelly.js, world/well/nursery.js

## alchemy
- `alchemy.close` E: world/garden/press.js
- `alchemy.enter` E: world/garden/press.js
- `alchemy.fire` E: progress/alchemy.js
- `alchemy.load` E: world/garden/press.js
- `alchemy.open` E: world/garden/press.js
- `alchemy.press` E: progress/alchemy.js
- `alchemy.refuse` E: world/garden/press.js
- `alchemy.season` E: progress/alchemy.js
- `alchemy.seasoned` E: progress/alchemy.js
- `alchemy.step` E: world/garden/press.js
- `alchemy.unload` E: world/garden/press.js

## angle
- `angle.bite` E: tools/sondelass/angling/angler.js
- `angle.bolt` E: tools/sondelass/angling/angler.js
- `angle.brace` E: tools/sondelass/angling/rodhands.js
- `angle.breach` E: tools/sondelass/angling/angler.js
- `angle.cast` E: tools/sondelass/angling/angler.js
- `angle.catch` E: tools/sondelass/angling/angler.js, tools/sondelass/harpoon.js H: world/treasure/chests.js
- `angle.charge` E: tools/sondelass/angling/angler.js
- `angle.crank` E: tools/sondelass/angling/rodhands.js
- `angle.escape` E: tools/sondelass/angling/angler.js
- `angle.hookset` E: tools/sondelass/angling/angler.js
- `angle.keep` E: tools/sondelass/angling/catchlift.js, tools/sondelass/harpoon.js
- `angle.landed` E: tools/sondelass/angling/catchlift.js H: world/treasure/chests.js
- `angle.legend` E: tools/sondelass/angling/weir.js
- `angle.lift` E: tools/sondelass/angling/catchlift.js
- `angle.lure` E: tools/sondelass/angling/angler.js
- `angle.mindgone` E: tools/sondelass/angling/angler.js
- `angle.miss` E: tools/sondelass/angling/angler.js
- `angle.mooch` E: tools/sondelass/angling/angler.js
- `angle.nibble` E: tools/sondelass/angling/angler.js
- `angle.notice` E: tools/sondelass/angling/angler.js
- `angle.pump` E: tools/sondelass/angling/angler.js
- `angle.release` E: tools/sondelass/angling/catchlift.js
- `angle.retrieve` E: tools/sondelass/angling/angler.js
- `angle.retrieve.fast` E: tools/sondelass/angling/rodhands.js
- `angle.reveal` E: tools/sondelass/angling/angler.js
- `angle.sound` E: tools/sondelass/angling/angler.js H: vfx/sondelassguard.js
- `angle.spent` E: tools/sondelass/angling/angler.js
- `angle.thrash` E: tools/sondelass/angling/angler.js
- `angle.tide` E: tools/sondelass/angling/weir.js
- `angle.twitch` E: tools/sondelass/angling/angler.js
- `angle.warn` E: tools/sondelass/angling/angler.js

## aptitude
- `aptitude.ask` E: progress/aptitude.js H: ui/assaywindow.js
- `aptitude.read` E: progress/aptitude.js H: ui/assaywindow.js
- `aptitude.trial` E: progress/aptitude.js H: ui/assaywindow.js, vfx/touchstonelook.js

## area
- `area.build` E: render/areas.js H: vfx/touchstonelook.js
- `area.done` E: progress/areachecklist.js
- `area.enter` E: world/dunes/areacut.js
- `area.leave` E: world/dunes/areacut.js
- `area.rare` E: world/dunes/rarefinds.js
- `area.teardown` E: render/areas.js H: vfx/touchstonelook.js

## ariadnesThread
- `ariadnesThread` E: - H: feedback/mapscreen.js

## art
- `art.ask` E: progress/classarts.js
- `art.end` E: courier/classarts/body.js
- `art.fire` E: courier/classarts/body.js
- `art.learn` E: progress/classarts.js
- `art.list` E: boot/chatcommands.js
- `art.refuse` E: progress/classarts.js
- `art.toggle` E: boot/chatcommands.js
- `art.unlearned` E: courier/moves/kick.js, courier/moves/techs.js
- `art.use` E: courier/classarts/body.js
- `art.wear` E: progress/classarts.js

## assay
- `assay.trial.end` E: world/touchstone/trialrun.js
- `assay.trial.start` E: world/touchstone/trialrun.js H: vfx/touchstonelook.js
- `assay.trial.stop` E: world/touchstone/trialrun.js

## autoCook
- `autoCook` E: - H: progress/knacks.js

## away
- `away` E: coop/letters.js

## balance
- `balance.start` E: courier/moves/balance.js

## bazaar
- `bazaar.enter` E: world/bazaar/bazaar.js
- `bazaar.leave` E: world/bazaar/bazaar.js H: music/casino.js

## bestiary
- `bestiary.fact` E: tools/veritome/darkroom.js

## biteSense
- `biteSense` E: - H: progress/knacks.js

## blade
- `blade.cut` E: tools/sondelass/blade.js
- `blade.enter` E: tools/sondelass/blade.js
- `blade.exit` E: tools/sondelass/blade.js
- `blade.resist` E: tools/sondelass/blade.js
- `blade.zandatsu` E: tools/sondelass/blade.js

## bluehole
- `bluehole.depth` E: world/bluehole/bluehole.js
- `bluehole.enter` E: world/bluehole/bluehole.js
- `bluehole.leave` E: world/bluehole/bluehole.js

## board
- `board.open` E: world/well/board/boardsession.js
- `board.out` E: world/well/board/boardsession.js

## borrow
- `borrow.use` E: tools/belt.js

## borrowVerb
- `borrowVerb` E: - H: courier/domainarts/depth.js

## bottle
- `bottle.crack` E: tools/soulbrush/load.js

## bout
- `bout.enter` E: world/hangar/ringbout.js
- `bout.over` E: world/hangar/ringbout.js

## bowl
- `bowl.fall` E: world/well/bowl.js
- `bowl.pool` E: world/well/bowl.js
- `bowl.shake` E: world/well/bowl.js
- `bowl.spend` E: world/well/bowl.js

## bracelet
- `bracelet.charm` E: godhand/powers.js
- `bracelet.set` E: progress/bracelet.js

## brush
- `brush.canvas` E: tools/soulbrush/celestial.js
- `brush.draw` E: tools/soulbrush/soulbrush.js
- `brush.flick` E: tools/soulbrush/soulbrush.js
- `brush.glyph` E: tools/soulbrush/techniques.js
- `brush.hit` E: tools/soulbrush/club.js
- `brush.inscribe` E: tools/soulbrush/inscribe.js
- `brush.mark` E: tools/soulbrush/techniques.js
- `brush.miss` E: tools/soulbrush/celestial.js
- `brush.mode` E: tools/soulbrush/load.js
- `brush.mop` E: tools/soulbrush/load.js
- `brush.paint` E: tools/soulbrush/load.js H: world/throwingroom/paintrange.js
- `brush.pick` E: tools/soulbrush/load.js
- `brush.read` E: tools/soulbrush/celestial.js
- `brush.slam` E: tools/soulbrush/club.js
- `brush.slide` E: tools/soulbrush/soulbrush.js
- `brush.stow` E: tools/soulbrush/soulbrush.js
- `brush.swing` E: tools/soulbrush/club.js

## busk
- `busk.start` E: world/busk.js
- `busk.suits` E: progress/econ/economy.js

## cap
- `cap` E: coop/letters.js

## card
- `card.condense` E: progress/collection.js
- `card.get` E: progress/collection.js

## cardback
- `cardback.set` E: ui/cardbackchoice.js

## carry
- `carry.lift` E: courier/moves/carry.js
- `carry.put` E: courier/moves/carry.js

## casino
- `casino.chips` E: progress/casino/chips.js
- `casino.howto` E: world/bazaar/session.js
- `casino.play` E: world/bazaar/session.js
- `casino.result` E: world/bazaar/session.js H: music/casino.js
- `casino.sit` E: world/bazaar/session.js H: music/casino.js

## catch
- `catch` E: - H: courier/domainarts/run.js
- `catch.free` E: godhand/catch.js
- `catch.grab` E: godhand/catch.js
- `catch.miss` E: tools/lockheart/lockheart.js

## catchWeather
- `catchWeather` E: - H: courier/domainarts/depth.js

## cavern
- `cavern.force` E: boot/chatcommands.js

## challenge
- `challenge.end` E: world/hangar/challenges.js
- `challenge.quit` E: world/hangar/challenges.js
- `challenge.score` E: world/hangar/challenges.js
- `challenge.start` E: world/hangar/challenges.js

## change
- `change` E: courier/lachryma.js H: boot/pneuka.js, ui/hudlayout.js, ui/touch/areas.js, ui/touchlayouteditor.js, ui/touchlog.js, ui/turncard.js

## charybdis
- `charybdis.dive` E: world/emocean/charybdis.js
- `charybdis.driven` E: world/emocean/charybdis.js
- `charybdis.felled` E: world/emocean/charybdis.js
- `charybdis.rise` E: world/emocean/charybdis.js

## chat
- `chat` E: coop/guests.js H: coop/guests.js
- `chat.dropped` E: coop/chatroom.js
- `chat.emote` E: feedback/chat.js
- `chat.line` E: coop/chatroom.js H: coop/letters.js
- `chat.say` E: agent/agent.js, feedback/chat.js H: coop/answer.js, coop/guests.js
- `chat.unsent` E: coop/chatroom.js

## chest
- `chest.drop` E: world/treasure/chests.js
- `chest.land` E: world/treasure/chests.js
- `chest.open` E: world/treasure/ceremony.js
- `chest.start` E: world/treasure/ceremony.js

## circuit
- `circuit.enter` E: world/basement/circuits.js
- `circuit.fall` E: world/basement/circuits.js
- `circuit.finish` E: world/basement/circuits.js
- `circuit.gate` E: world/basement/circuits.js

## city
- `city.break` E: world/hangar/city.js
- `city.felled` E: world/hangar/city.js
- `city.land` E: world/hangar/city.js

## citytrial
- `citytrial.clock` E: world/raceway/citytrial.js
- `citytrial.end` E: world/raceway/citytrial.js
- `citytrial.patch` E: world/raceway/citytrial.js
- `citytrial.stadium` E: world/raceway/citytrial.js
- `citytrial.start` E: world/raceway/citytrial.js

## clapper
- `clapper.down` E: boot/services.js
- `clapper.wrong` E: world/duel/duelfoes.js

## cleave
- `cleave.cut` E: tools/psygun/shells.js

## clock
- `clock.read` E: boot/chatcommands.js

## clutch
- `clutch.break` E: world/well/nursery.js
- `clutch.hatch` E: world/well/nursery.js

## cogitomap
- `cogitomap.get` E: world/well/dunemaw.js
- `cogitomap.sell` E: progress/voyage.js

## combat
- `combat.annihilate` E: creatures/creatures.js
- `combat.start` E: - H: vfx/hudring.js

## cook
- `cook.dubious` E: progress/cooking/cooking.js
- `cook.eat` E: progress/cooking/cooking.js
- `cook.learn` E: progress/cooking/cooking.js
- `cook.long` E: progress/cooking/cooking.js
- `cook.move` E: progress/cooking/cooking.js
- `cook.proof` E: progress/cooking/cooking.js
- `cook.serve` E: progress/cooking/cooking.js
- `cook.slab` E: progress/cooking/cooking.js
- `cook.taste` E: progress/cooking/cooking.js

## courier
- `courier.goto` E: boot/debug.js
- `courier.idle` E: courier/vessel/kilnui.js
- `courier.impulse` E: - H: boot/pneuka.js, courier/vessel/damage.js, vfx/filigree.js, vfx/hudring.js
- `courier.reform` E: courier/vessel/death.js H: vfx/flourishes.js
- `courier.rescue` E: - H: tools/moveset.js
- `courier.respawn` E: - H: tools/moveset.js
- `courier.shatter` E: courier/vessel/death.js

## course
- `course` E: godhand/powers/sight.js
- `course.gate` E: world/basement/course.js
- `course.lap` E: world/basement/course.js
- `course.reset` E: world/basement/course.js
- `course.split` E: world/basement/course.js
- `course.station` E: world/basement/course.js

## creature
- `creature.credit` E: coop/fight.js
- `creature.hitlag` E: creatures/creatures.js
- `creature.look` E: creatures/creatures.js
- `creature.mind` E: creatures/creatures.js
- `creature.resist` E: creatures/creatures.js
- `creature.status` E: courier/domainarts/depth.js, creatures/creatures.js
- `creature.struck` E: boot/services.js, creatures/creatures.js
- `creature.stun` E: creatures/stun.js
- `creature.zandatsu` E: tools/sondelass/blade.js

## crib
- `crib` E: - H: world/ostraca.js

## crucibelle
- `crucibelle.feedback` E: tools/crucibelle/recitalplay.js
- `crucibelle.fever` E: tools/crucibelle/crucibelle.js
- `crucibelle.harmony` E: tools/crucibelle/crucibelle.js
- `crucibelle.lick` E: tools/crucibelle/recitalplay.js
- `crucibelle.note` E: tools/crucibelle/crucibelle.js, world/opensea/seamounts.js H: vfx/filigree.js
- `crucibelle.recital` E: tools/crucibelle/recital.js
- `crucibelle.recital.note` E: tools/crucibelle/recital.js
- `crucibelle.rockstar` E: tools/crucibelle/recitalplay.js
- `crucibelle.strum` E: tools/crucibelle/recital.js
- `crucibelle.toll` E: tools/crucibelle/crucibelle.js
- `crucibelle.whammy` E: tools/crucibelle/recitalplay.js

## crude
- `crude.buy` E: progress/voyage.js
- `crude.sell` E: progress/voyage.js

## crystal
- `crystal.harvest` E: world/dunes/crystals.js
- `crystal.ref` E: world/dunes/crystals.js
- `crystal.reveal` E: world/dunes/crystals.js
- `crystal.strike` E: world/dunes/crystals.js

## cube
- `cube.earn` E: world/treasure/cubes.js
- `cube.spend` E: world/treasure/cubes.js
- `cube.spill` E: world/treasure/cubes.js

## cultivation
- `cultivation.kiln` E: world/garden/tribulation.js
- `cultivation.tribulation` E: world/garden/tribulation.js

## cup
- `cup.end` E: world/raceway/cups.js
- `cup.finish` E: world/raceway/cups.js
- `cup.race` E: world/raceway/cups.js
- `cup.start` E: world/raceway/cups.js

## curio
- `curio.get` E: world/dunes/rarefinds.js, world/treasure/ceremony.js

## cut
- `cut.hit` E: tools/sondelass/cutlass.js
- `cut.spin` E: tools/sondelass/spinattack.js
- `cut.stinger` E: tools/sondelass/cutlass.js
- `cut.wave` E: tools/sondelass/slashwave.js

## cutlass
- `cutlass.settle` E: tools/sondelass/settle.js

## darkroom
- `darkroom.develop` E: tools/veritome/darkroom.js

## day
- `day.phase` E: progress/weather.js H: audio/ambience.js

## death
- `death` E: creatures/jelly/slipjelly.js, creatures/seaserpent/seaserpent.js, creatures/wisp/lanternwisp.js, tools/lockheart/outcomes.js

## debug
- `debug.chest` E: debug/debugchest.js
- `debug.preset` E: debug/presetloader.js

## decor
- `decor.buy` E: progress/decor.js
- `decor.get` E: progress/decor.js
- `decor.layout` E: progress/decor.js
- `decor.move` E: progress/decor.js
- `decor.place` E: progress/decor.js H: progress/spiritlife.js
- `decor.refuse` E: progress/decor.js
- `decor.remove` E: progress/decor.js

## denied
- `denied` E: courier/lachryma.js H: feedback/tracking/pool.js, vfx/crucibellesongbook.js, vfx/soulbrushdesk.js

## domain
- `domain.art.ask` E: progress/domainarts.js
- `domain.art.end` E: courier/domainarts/depth.js, courier/domainarts/run.js
- `domain.art.fire` E: courier/domainarts/run.js
- `domain.art.learn` E: progress/domainarts.js
- `domain.art.refuse` E: courier/domainarts/run.js, progress/domainarts.js
- `domain.art.use` E: progress/domainarts.js
- `domain.art.wear` E: progress/domainarts.js
- `domain.down` E: progress/domainarts.js
- `domain.level` E: godhand/powers.js, progress/psyche.js
- `domain.makeup` E: courier/domainarts/run.js
- `domain.milestone` E: progress/psyche.js
- `domain.react` E: courier/domainarts/run.js
- `domain.rule.ask` E: progress/domainarts.js
- `domain.rule.refuse` E: progress/domainarts.js
- `domain.rule.set` E: progress/domainarts.js
- `domain.trait.learn` E: courier/domainarts/run.js
- `domain.vow.ask` E: progress/domainarts.js
- `domain.vow.refuse` E: progress/domainarts.js
- `domain.vow.set` E: progress/domainarts.js

## dowse
- `dowse.attune` E: tools/dreamvane/dreamvane.js
- `dowse.find` E: tools/dreamvane/dreamvane.js, tools/pairspecials/fork.js

## dreamvane
- `dreamvane.capture` E: tools/dreamvane/net.js
- `dreamvane.dodge` E: tools/dreamvane/net.js
- `dreamvane.net` E: tools/dreamvane/net.js
- `dreamvane.netswing` E: tools/dreamvane/net.js
- `dreamvane.strike` E: tools/dreamvane/dreamvane.js
- `dreamvane.survey` E: tools/dreamvane/dreamvane.js
- `dreamvane.swing` E: - H: world/dunes/crystals.js
- `dreamvane.twirl` E: courier/parries.js
- `dreamvane.unearth` E: tools/dreamvane/dreamvane.js

## drill
- `drill.end` E: world/throwingroom/drills.js
- `drill.left` E: world/throwingroom/drills.js
- `drill.start` E: world/throwingroom/drills.js

## drop
- `drop` E: ui/readingtable.js H: pneuka/loadout.js, ui/readingtable.js
- `drop.fall` E: world/drops/creaturedrops.js
- `drop.take` E: world/drops/creaturedrops.js

## duel
- `duel.allclear` E: world/duel/duelsession.js
- `duel.break` E: world/duel/duelsession.js
- `duel.chain` E: world/duel/duelsession.js H: music/duel.js
- `duel.charge` E: world/duel/duelsession.js
- `duel.desperate` E: world/duel/duelsession.js
- `duel.drop` E: progress/duel/drops.js H: vfx/duelview/spoils.js
- `duel.end` E: world/duel/duelsession.js
- `duel.flee` E: world/duel/duelsession.js H: progress/dice.js
- `duel.foe` E: world/duel/duelsession.js
- `duel.land` E: world/duel/duelsession.js
- `duel.learn` E: progress/foeseen.js
- `duel.lesson` E: world/duel/duelsession.js
- `duel.open` E: world/duel/duelsession.js
- `duel.power` E: world/duel/duelsession.js
- `duel.pull` E: world/duel/duelfoes.js
- `duel.secret` E: world/duel/duelsession.js
- `duel.seen` E: progress/foeseen.js
- `duel.skill` E: world/duel/duelsession.js
- `duel.slip` E: world/duel/duelfoes.js
- `duel.stagger` E: world/duel/duelsession.js
- `duel.undo` E: world/duel/duelsession.js
- `duel.whistle` E: world/duel/duelsession.js

## dunes
- `dunes.barrier` E: world/dunes/barrier.js

## econ
- `econ.grant` E: progress/econ/economy.js

## editor
- `editor.open` E: world/raceway/editor.js
- `editor.save` E: world/raceway/editor.js

## emocean
- `emocean.continue` E: progress/voyage.js
- `emocean.found` E: progress/voyage.js
- `emocean.hop` E: progress/voyage.js
- `emocean.reckon` E: progress/voyage.js
- `emocean.setpiece` E: progress/voyage.js
- `emocean.stage` E: progress/voyage.js

## emote
- `emote.end` E: courier/moves/emote.js
- `emote.start` E: courier/moves/emote.js H: npc/folk.js

## empty
- `empty` E: courier/lachryma.js H: courier/classarts/body.js, feedback/tracking/pool.js

## endless
- `endless.end` E: world/raceway/endless.js
- `endless.fail` E: world/raceway/endless.js
- `endless.skip` E: world/raceway/endless.js
- `endless.start` E: world/raceway/endless.js
- `endless.track` E: world/raceway/endless.js

## entropy
- `entropy.board` E: world/entropy/entropyroom.js H: vfx/entropy/index.js
- `entropy.class` E: world/entropy/entropyroom.js
- `entropy.enter` E: world/entropy/entropyroom.js
- `entropy.leave` E: world/entropy/entropyroom.js

## failed
- `failed` E: coop/letters.js, core/cloudsave.js

## feeling
- `feeling.drink` E: courier/mind.js
- `feeling.embody` E: feedback/awakening.js
- `feeling.wake` E: progress/feelings.js

## find
- `find.take` E: world/well/finds.js

## firsttoday
- `firsttoday.paid` E: progress/firsttoday.js

## flash
- `flash.fire` E: tools/veritome/flash.js H: tools/veritome/veritome.js

## floor
- `floor.shift` E: world/well/finds.js

## flourish
- `flourish.set` E: vfx/flourishes.js

## foe
- `foe.break` E: creatures/jelly/greatjelly.js
- `foe.call` E: creatures/jelly/greatjelly.js
- `foe.cast` E: world/well/raid.js
- `foe.crack` E: creatures/jelly/greatjelly.js
- `foe.dodge` E: creatures/creatures.js
- `foe.end` E: creatures/jelly/greatjelly.js
- `foe.moment` E: world/well/raid.js
- `foe.rise` E: creatures/jelly/greatjelly.js
- `foe.scrape` E: creatures/jelly/greatjelly.js
- `foe.sink` E: creatures/jelly/greatjelly.js
- `foe.slam` E: creatures/jelly/greatjelly.js
- `foe.strike` E: creatures/jelly/greatjelly.js, world/well/raid.js
- `foe.surface` E: creatures/jelly/greatjelly.js
- `foe.wake` E: creatures/jelly/greatjelly.js
- `foe.wall` E: creatures/jelly/greatjelly.js
- `foe.wipe` E: world/well/dunemaw.js

## fold
- `fold` E: godhand/powers/space.js

## folk
- `folk.clean` E: npc/folk.js
- `folk.coat` E: npc/folk.js

## food
- `food` E: courier/lachryma.js

## fork
- `fork.catch` E: tools/dreamvane/dreamvane.js
- `fork.drain` E: tools/dreamvane/dreamvane.js
- `fork.stick` E: tools/dreamvane/dreamvane.js
- `fork.throw` E: tools/dreamvane/dreamvane.js

## full
- `full` E: courier/lachryma.js H: feedback/tracking/pool.js

## gain
- `gain` E: courier/lachryma.js H: courier/mind.js, feedback/tracking/pool.js, vfx/filigree.js

## garden
- `garden.art` E: world/garden/decorlayer.js, world/garden/hand.js
- `garden.briar.held` E: progress/harmony.js
- `garden.cascade` E: world/garden/cascades.js
- `garden.collect` E: progress/garden.js
- `garden.digest` E: progress/spiritlife.js
- `garden.enter` E: world/garden/realm.js, world/shrines.js H: feedback/touchshell.js, progress/harmony.js, progress/spiritlife.js, vfx/garden/facilitylooks.js, vfx/garden/launchlotus.js, vfx/garden/slablook.js
- `garden.folk` E: progress/gardenfolk.js
- `garden.grant` E: progress/garden.js
- `garden.harmony` E: progress/harmony.js
- `garden.harmony.ask` E: progress/harmony.js
- `garden.harvest` E: progress/garden.js H: progress/harmony.js
- `garden.howto` E: world/garden/howto.js
- `garden.jar.back` E: world/garden/realm.js
- `garden.launch` E: world/garden/realm.js H: vfx/garden/launchlotus.js
- `garden.leave` E: world/garden/realm.js H: vfx/garden/facilitylooks.js, vfx/garden/rarespirits.js, vfx/garden/slablook.js, world/places.js
- `garden.move` E: world/garden/plots.js
- `garden.myggdrasil` E: world/garden/mycelium.js
- `garden.paint` E: world/garden/hand.js
- `garden.place` E: world/garden/plots.js H: progress/spiritlife.js
- `garden.plant` E: progress/garden.js H: progress/harmony.js
- `garden.prune` E: progress/harmony.js
- `garden.rating` E: world/garden/decorlayer.js H: world/garden/realm.js
- `garden.refuse` E: world/garden/realm.js
- `garden.reset` E: world/garden/realm.js
- `garden.reset.ask` E: world/garden/hand.js
- `garden.scorch` E: world/garden/plants.js
- `garden.sculpt` E: world/garden/hand.js
- `garden.season.gift` E: progress/gardenseason.js
- `garden.slot` E: progress/garden.js
- `garden.tend` E: progress/harmony.js
- `garden.thorn` E: progress/harmony.js
- `garden.track` E: world/garden/races.js
- `garden.undo` E: world/garden/hand.js
- `garden.upgrade` E: progress/garden.js
- `garden.view` E: world/garden/gardencam.js
- `garden.water` E: world/garden/waterworks.js H: progress/harmony.js

## geyser
- `geyser.launch` E: world/dunes/geysers.js, world/raceway/raceway.js H: courier/skiff/skiff.js

## giant
- `giant.burn` E: world/hangar/giant.js
- `giant.call` E: world/hangar/hangar.js
- `giant.down` E: world/hangar/giant.js
- `giant.stagger` E: world/hangar/giant.js
- `giant.vitrify` E: world/hangar/giant.js
- `giant.wake` E: world/hangar/giant.js
- `giant.windup` E: world/hangar/giant.js

## glaze
- `glaze.earn` E: courier/vessel/vessel.js
- `glaze.learn` E: courier/vessel/vessel.js

## goal
- `goal.done` E: progress/goals.js H: ui/goalswindow.js
- `goal.next` E: progress/goals.js H: ui/goalswindow.js

## goals
- `goals.ask` E: progress/goals.js H: ui/goalswindow.js
- `goals.set` E: progress/goals.js H: ui/goalswindow.js

## god
- `god.dissonance` E: godhand/rejection.js
- `god.enter` E: godhand/godhand.js
- `god.epic` E: godhand/miracles.js
- `god.exit` E: godhand/godhand.js
- `god.field` E: godhand/islandmatter.js
- `god.grab` E: godhand/godhand.js
- `god.manifest` E: godhand/arts.js
- `god.miracle` E: godhand/miracles.js
- `god.muster.done` E: godhand/powers/will.js
- `god.portal.pass` E: godhand/powers/space.js
- `god.raid` E: world/basement/raids.js
- `god.rejection.answer` E: godhand/rejection.js
- `god.rejection.beaten` E: godhand/rejection.js
- `god.sculpt` E: godhand/matterarts.js
- `god.select` E: godhand/arts.js
- `god.sunder` E: godhand/arts.js
- `god.throw` E: godhand/godhand.js
- `god.wave` E: world/basement/raids.js

## graphics
- `graphics.lines` E: render/graphics.js
- `graphics.restart` E: boot/debug.js
- `graphics.tier` E: render/graphics.js

## grapple
- `grapple.attach` E: tools/sondelass/hookshot.js
- `grapple.fling` E: tools/sondelass/grapple.js
- `grapple.release` E: tools/sondelass/hookshot.js
- `grapple.swing` E: tools/sondelass/grapple.js H: world/strawmanwell/stages/swing.js

## grate
- `grate.start` E: courier/moves/grate.js

## groove
- `groove.open` E: tools/psygun/casters.js

## guard
- `guard.block` E: courier/parry.js
- `guard.up` E: tools/sondelass/cutlass.js

## guest
- `guest.garden` E: coop/guests.js
- `guest.join` E: coop/guests.js
- `guest.leave` E: coop/guests.js
- `guest.say` E: coop/guests.js

## guideTone
- `guideTone` E: - H: music/rhythm/rhythm.js

## gun
- `gun.flourish` E: tools/psygun/gunmoves.js

## gust
- `gust` E: godhand/powers/force.js

## gyro
- `gyro.refused` E: core/gyrosteer.js
- `gyro.unheard` E: core/gyrosteer.js

## halfTime
- `halfTime` E: - H: progress/knacks.js

## hand
- `hand.pose` E: progress/mudras.js

## hang
- `hang.pullup` E: courier/moves/hang.js
- `hang.start` E: courier/moves/hang.js

## hangar
- `hangar.enter` E: world/hangar/hangar.js
- `hangar.leave` E: world/hangar/hangar.js

## harpoon
- `harpoon.fire` E: tools/sondelass/harpoon.js
- `harpoon.hit` E: tools/sondelass/harpoon.js

## hasten
- `hasten` E: godhand/powers/space.js

## haunt
- `haunt.end` E: world/raceway/haunt.js
- `haunt.start` E: world/raceway/haunt.js

## heldBreath
- `heldBreath` E: - H: courier/parry.js

## herd
- `herd` E: godhand/powers/will.js

## hook
- `hook.creature` E: tools/sondelass/hookshot.js
- `hook.fire` E: tools/sondelass/hookshot.js H: vfx/sondelassguard.js
- `hook.fling` E: tools/sondelass/hookshot.js
- `hook.pull` E: tools/sondelass/hookshot.js

## hover
- `hover` E: ui/readingtable.js H: pneuka/loadout.js, ui/readingtable.js

## impact
- `impact.hit` E: world/impacts.js
- `impact.strike` E: world/impacts.js

## input
- `input.device` E: boot/courier.js

## instruments
- `instruments.skin` E: vfx/instrumentskins.js

## item
- `item.drop` E: pneuka/box.js
- `item.examine` E: pneuka/box.js
- `item.fit` E: pneuka/box.js
- `item.full` E: pneuka/box.js
- `item.get` E: pneuka/box.js
- `item.store` E: pneuka/box.js
- `item.unfit` E: pneuka/box.js
- `item.withdraw` E: pneuka/box.js

## jar
- `jar.hit` E: godhand/jar.js
- `jar.reforge` E: godhand/jar.js
- `jar.shatter` E: godhand/jar.js
- `jar.shield` E: godhand/jar.js

## jelly
- `jelly.attack` E: creatures/jelly/slipjelly.js
- `jelly.brawl` E: creatures/jelly/slipjelly.js
- `jelly.cancel` E: creatures/jelly/slipjelly.js
- `jelly.eat` E: creatures/jelly/mind.js
- `jelly.fetch` E: creatures/jelly/mind.js
- `jelly.fish` E: creatures/jelly/mind.js
- `jelly.hit` E: creatures/jelly/slipjelly.js
- `jelly.notice` E: creatures/jelly/mind.js
- `jelly.reform` E: creatures/jelly/slipjelly.js
- `jelly.strike` E: creatures/jelly/slipjelly.js H: courier/vessel/damage.js, vfx/filigree.js, vfx/hudring.js
- `jelly.wind` E: creatures/jelly/slipjelly.js

## keepsake
- `keepsake.pot` E: progress/keepsakes.js

## kept
- `kept` E: core/cloudsave.js

## kick
- `kick.hit` E: courier/moves/kick.js H: world/strawmanwell/verbs.js

## kiln
- `kiln.close` E: courier/moves/kiln.js
- `kiln.open` E: courier/moves/kiln.js

## knack
- `knack.open` E: progress/knacks.js
- `knack.set` E: progress/knacks.js

## latch
- `latch.start` E: courier/moves/latch.js

## lend
- `lend.set` E: progress/lend.js

## licence
- `licence.fail` E: world/raceway/licences.js

## light
- `light` E: boot/services.js, tools/lockheart/outcomes.js, tools/veritome/flash.js

## link
- `link` E: - H: courier/domainarts/run.js

## loadout
- `loadout.set` E: tools/sondelass/loadoutchosen.js

## lob
- `lob.dodged` E: creatures/lobber.js
- `lob.fire` E: creatures/lobber.js H: vfx/strawpitcher.js
- `lob.hit` E: creatures/lobber.js

## local
- `local` E: core/cloudsave.js

## lock
- `lock.off` E: courier/lockon.js
- `lock.on` E: courier/lockon.js

## lockheart
- `lockheart.drain` E: tools/lockheart/lockheart.js
- `lockheart.echo` E: tools/lockheart/lockheart.js
- `lockheart.feed` E: tools/lockheart/lockheart.js
- `lockheart.full` E: tools/lockheart/lockheart.js
- `lockheart.keyring` E: tools/lockheart/lockheart.js
- `lockheart.open` E: tools/lockheart/lockheart.js
- `lockheart.outcome` E: tools/lockheart/lockheart.js
- `lockheart.preview` E: tools/lockheart/lockheart.js
- `lockheart.recoil` E: tools/lockheart/outcomes.js
- `lockheart.ultimate` E: tools/lockheart/ultimate.js
- `lockheart.ultimate.end` E: tools/lockheart/ultimate.js

## log
- `log.hero` E: feedback/gamelog.js

## lure
- `lure.land` E: tools/sondelass/angling/lure.js
- `lure.tie` E: pneuka/box.js
- `lure.untie` E: pneuka/box.js

## makeup
- `makeup` E: - H: courier/domainarts/run.js

## map
- `map.pulse` E: feedback/cartography.js H: tools/veritome/veritome.js
- `map.room` E: feedback/cartography.js
- `map.surveyed` E: feedback/cartography.js

## mech
- `mech.assemble` E: world/hangar/assembly.js
- `mech.barrier` E: world/hangar/giant.js
- `mech.berserk` E: world/hangar/mechpilot.js
- `mech.boost` E: world/hangar/mechpilot.js
- `mech.cable` E: world/hangar/mechpilot.js
- `mech.fail` E: world/hangar/mechpilot.js
- `mech.feedback` E: world/hangar/mechpilot.js
- `mech.feel` E: world/hangar/mechskate.js
- `mech.flame` E: world/hangar/mechweapons.js
- `mech.grab` E: world/hangar/props.js
- `mech.helm` E: vfx/mechs/helms.js
- `mech.hit` E: world/hangar/mechtech.js, world/hangar/mechweapons.js, world/hangar/props.js
- `mech.hurt` E: world/hangar/mechpilot.js
- `mech.joint` E: world/hangar/giant.js, world/hangar/mechpilot.js, world/hangar/ringbout.js
- `mech.jump` E: world/hangar/mechtech.js
- `mech.land` E: world/hangar/mechskate.js
- `mech.launch` E: world/hangar/mechpilot.js
- `mech.mend` E: world/hangar/assembly.js
- `mech.mount` E: vfx/mechs/mount.js
- `mech.prop.break` E: world/hangar/challenges.js, world/hangar/props.js
- `mech.prop.hit` E: world/hangar/props.js
- `mech.prop.throw` E: world/hangar/props.js
- `mech.roof` E: world/hangar/mechpilot.js
- `mech.seal` E: world/hangar/mechpilot.js
- `mech.skate` E: world/hangar/mechskate.js
- `mech.special` E: world/hangar/mechspecials.js
- `mech.step` E: world/hangar/mechpilot.js
- `mech.style` E: vfx/mechs/mechstyle.js
- `mech.sync` E: world/hangar/mechpilot.js
- `mech.technique` E: world/hangar/giantgrapple.js, world/hangar/mechtech.js
- `mech.turn` E: world/hangar/mechskate.js
- `mech.unseal` E: world/hangar/mechpilot.js

## mimic
- `mimic.leave` E: world/mimicry/mimicry.js
- `mimic.open` E: world/mimicry/mimicry.js
- `mimic.read` E: world/mimicry/mimicry.js
- `mimic.solve` E: world/mimicry/mimicry.js
- `mimic.step` E: world/mimicry/mimicry.js
- `mimic.turn` E: world/mimicry/mimicry.js

## mind
- `mind.brim` E: courier/mind.js
- `mind.learn` E: tools/veritome/mind/macros.js
- `mind.place` E: tools/veritome/mind/composer.js
- `mind.settle` E: courier/mind.js H: progress/harmony.js
- `mind.state` E: courier/mind.js

## mirage
- `mirage.fade` E: tools/crucibelle/mirage.js
- `mirage.raise` E: tools/crucibelle/mirage.js

## mount
- `mount.burst` E: courier/jellymount/jellymount.js H: vfx/jellymount/look.js
- `mount.call` E: courier/jellymount/jellymount.js H: vfx/jellymount/look.js
- `mount.drink` E: courier/jellymount/jellymount.js H: vfx/jellymount/look.js
- `mount.end` E: courier/jellymount/jellymount.js H: vfx/jellymount/look.js
- `mount.hop` E: courier/jellymount/jellymount.js H: vfx/jellymount/look.js
- `mount.hurt` E: courier/jellymount/jellymount.js H: vfx/jellymount/look.js
- `mount.ride` E: courier/jellymount/jellymount.js

## move
- `move.air` E: tools/moveset.js
- `move.blink` E: courier/moves/blink.js H: tools/moveset.js, vfx/flourishes.js
- `move.blow` E: tools/stringrun.js H: world/strawmanwell/verbs.js
- `move.cut` E: tools/moveset.js H: vfx/sondelassguard.js
- `move.dash` E: - H: vfx/flourishes.js
- `move.hover` E: courier/moves/jets.js
- `move.launch` E: tools/moveset.js
- `move.learn` E: feedback/tracking/moves.js
- `move.parry` E: courier/parry.js, world/emocean/stage.js, world/opensea/seafight.js H: tools/dreamvane/dreamvane.js
- `move.rocket` E: courier/moves/jets.js
- `move.roll` E: courier/moves/roll.js
- `move.skim` E: courier/moves/jets.js
- `move.special` E: tools/moveset.js
- `move.step` E: boot/courier.js
- `move.stomp` E: courier/moves/stomp.js
- `move.string.end` E: tools/stringrun.js
- `move.throw` E: courier/moves/carry.js
- `move.waterwalk` E: courier/classarts/waterwalk.js

## mover
- `mover.push` E: world/props/movers.js

## music
- `music.pick` E: music/soundtest.js

## muster
- `muster` E: godhand/powers/will.js

## myggdrasil
- `myggdrasil.diary` E: progress/treediary.js
- `myggdrasil.feed` E: progress/myggdrasil.js
- `myggdrasil.fruit` E: progress/myggdrasil.js
- `myggdrasil.girth` E: progress/myggdrasil.js
- `myggdrasil.hang` E: progress/myggdrasil.js
- `myggdrasil.pick` E: progress/myggdrasil.js

## noise
- `noise` E: boot/services.js, creatures/ai/stimuli.js, tools/crucibelle/crucibelle.js, tools/crucibelle/mirage.js, tools/dreamvane/dreamvane.js, tools/pairspecials/coffin.js, tools/pairspecials/fork.js, tools/psygun/weapon.js, world/dunes/crystals.js, world/opensea/seafight.js, world/props/potshards.js

## npc
- `npc.bye` E: npc/dialogue.js H: progress/shop/shops.js
- `npc.choose` E: npc/dialogue.js H: courier/moves/talk.js
- `npc.say` E: npc/dialogue.js
- `npc.talk` E: npc/dialogue.js

## offer
- `offer` E: core/cloudsave.js

## on
- `on` E: core/cloudsave.js

## opensea
- `opensea.board` E: world/opensea/opensea.js
- `opensea.enter` E: world/opensea/opensea.js
- `opensea.moor` E: world/opensea/opensea.js

## ostracon
- `ostracon.find` E: world/ostraca.js

## overflow
- `overflow` E: courier/lachryma.js H: courier/classarts/body.js, courier/mind.js, feedback/tracking/pool.js, progress/dice.js, tools/lockheart/lockheart.js, vfx/lockheartreliquary.js

## overture
- `overture.end` E: cine/overture.js
- `overture.start` E: cine/overture.js

## owner
- `owner` E: coop/letters.js

## pain
- `pain` E: creatures/jelly/slipjelly.js, creatures/stun.js, creatures/wisp/lanternwisp.js

## paintrange
- `paintrange.read` E: world/throwingroom/paintrange.js

## pair
- `pair.end` E: tools/pairspecials.js
- `pair.hit` E: tools/pairspecials.js
- `pair.mark` E: tools/pairspecials/fork.js, tools/pairspecials/shot.js, tools/pairspecials.js
- `pair.open` E: feedback/tracking/pairworn.js
- `pair.read` E: tools/pairspecials/bell.js
- `pair.special` E: tools/pairspecials.js

## pairs
- `pairs.ask` E: feedback/tracking/pairs.js

## palm
- `palm.condense` E: progress/dice.js
- `palm.grow` E: progress/dice.js
- `palm.roll` E: progress/dice.js

## parry
- `parry.missed` E: creatures/creatures.js
- `parry.return` E: courier/domainarts/run.js
- `parry.try` E: courier/parries.js H: courier/anim/parrygesture.js
- `parry.window` E: vfx/parrymark.js

## parryrange
- `parryrange.set` E: world/throwingroom/parryrange.js

## party
- `party.ask` E: coop/answer.js
- `party.call` E: coop/party.js
- `party.dismiss` E: coop/party.js
- `party.down` E: coop/sharedfoe.js
- `party.letter` E: coop/letters.js
- `party.letter.late` E: coop/letters.js
- `party.list` E: coop/party.js
- `party.meet` E: coop/party.js
- `party.order` E: coop/channel.js, coop/party.js
- `party.refuse` E: coop/party.js
- `party.say` E: coop/answer.js, coop/channel.js H: coop/chatroom.js, coop/guests.js, coop/letters.js
- `party.unheard` E: coop/answer.js
- `party.unsent` E: coop/letters.js
- `party.wipe` E: coop/sharedfoe.js

## passage
- `passage.adrift` E: world/emocean/triprun.js
- `passage.best` E: progress/voyage.js
- `passage.bounty` E: world/emocean/triprun.js
- `passage.chart` E: world/emocean/seachart.js
- `passage.draft` E: world/emocean/seachart.js
- `passage.film` E: vfx/encounters/film.js
- `passage.race` E: world/emocean/triprun.js
- `passage.read` E: world/emocean/seachart.js
- `passage.waypoint` E: world/emocean/triprun.js

## perf
- `perf.ab` E: debug/perfab.js
- `perf.readout` E: debug/perfreadout.js

## perfectPitch
- `perfectPitch` E: - H: world/dunes/crystals.js

## photo
- `photo.appraise` E: tools/veritome/darkroom.js
- `photo.discard` E: tools/veritome/ui.js
- `photo.take` E: tools/veritome/veritome.js H: progress/spiritlife.js, ui/safarilens.js

## pick
- `pick` E: ui/readingtable.js H: pneuka/loadout.js, ui/readingtable.js

## place
- `place.enter` E: vfx/wirecompass.js

## plaster
- `plaster.break` E: world/ostraca.js

## pneuka
- `pneuka.open` E: pneuka/ui.js

## pole
- `pole.start` E: courier/moves/pole.js

## pool
- `pool.cap` E: progress/poolcaps.js
- `pool.low` E: boot/pneuka.js

## portal
- `portal` E: godhand/powers/space.js

## postpone
- `postpone` E: - H: courier/domainarts/run.js

## presets
- `presets.ask` E: progress/lend.js

## profile
- `profile.ask` E: progress/movementprofiles.js
- `profile.wear` E: progress/movementprofiles.js

## prop
- `prop.break` E: boot/services.js

## psygun
- `psygun.barrels` E: tools/psygun/variantplay.js
- `psygun.chamber` E: tools/psygun/shells.js
- `psygun.change` E: tools/psygun/shells.js H: vfx/psygunmodels.js
- `psygun.cylinder` E: vfx/psyguncylinder.js
- `psygun.flare` E: tools/psygun/variantplay.js
- `psygun.pentacle` E: tools/psygun/variantplay.js
- `psygun.turn` E: tools/psygun/shells.js

## push
- `push.move` E: courier/moves/push.js
- `push.start` E: courier/moves/push.js

## qais
- `qais.report.filed` E: debug/qais/report.js
- `qais.round.sent` E: debug/qais/qais.js

## quest
- `quest.done` E: progress/quests.js H: ui/questsplash.js
- `quest.splash` E: ui/questsplash.js
- `quest.start` E: progress/quests.js H: ui/questsplash.js
- `quest.step` E: progress/quests.js

## quests
- `quests.ask` E: progress/quests.js H: ui/questjournal.js

## race
- `race.back` E: world/raceway/race.js
- `race.bump` E: world/raceway/rivals.js H: vfx/racewayrivals.js
- `race.count` E: workbench/racewaylooksstage.js, world/raceway/race.js H: vfx/racewaylooks.js
- `race.end` E: workbench/racewaylooksstage.js, world/raceway/race.js H: world/raceway/citytrial.js, world/raceway/cups.js, world/raceway/endless.js
- `race.escape.caught` E: world/raceway/escape.js
- `race.escape.near` E: world/raceway/escape.js
- `race.escape.wake` E: world/raceway/escape.js
- `race.finish` E: world/raceway/race.js H: progress/econ/wager.js, vfx/raceway/fireworks.js, vfx/raceway/spectators.js, world/raceway/citytrial.js, world/raceway/cups.js, world/raceway/editor.js, world/raceway/endless.js
- `race.flyover` E: world/raceway/flyover.js
- `race.gate` E: workbench/racewaylooksstage.js, world/raceway/race.js H: vfx/racewaylooks.js
- `race.go` E: workbench/racewaylooksstage.js, world/raceway/race.js H: vfx/raceway/spectators.js, vfx/racewaylooks.js
- `race.lap` E: world/raceway/race.js
- `race.nemesis` E: world/raceway/rivals.js
- `race.photo` E: world/raceway/race.js
- `race.place` E: world/raceway/rivals.js
- `race.pot` E: world/raceway/pottrial.js H: vfx/racewayprops.js
- `race.respawn` E: world/raceway/raceway.js
- `race.restart` E: world/raceway/race.js
- `race.rewind` E: world/raceway/rewind.js
- `race.rival.finish` E: world/raceway/rivals.js H: vfx/racewayrivals.js, world/raceway/haunt.js
- `race.solarstart` E: world/raceway/race.js
- `race.start` E: workbench/racewaylooksstage.js, world/raceway/race.js H: vfx/racewaylooks.js
- `race.takedown` E: world/raceway/rivals.js H: vfx/racewayrivals.js
- `race.taunt` E: world/raceway/rivals.js

## raceway
- `raceway.branch` E: world/raceway/raceway.js
- `raceway.enter` E: world/raceway/raceway.js H: vfx/racewaypark.js, vfx/waves/index.js
- `raceway.pit` E: world/raceway/features.js H: vfx/racewaypark.js

## rail
- `rail.beat` E: world/emocean/stage.js
- `rail.bite` E: world/emocean/shoal.js
- `rail.boss.fall` E: world/emocean/stage.js
- `rail.broadside` E: world/emocean/pirates.js
- `rail.cancel` E: world/emocean/triprun.js
- `rail.core` E: - H: music/choose.js
- `rail.dodge` E: world/emocean/stage.js
- `rail.down` E: world/emocean/stage.js H: music/choose.js
- `rail.end` E: world/emocean/leviathan.js, world/emocean/pirates.js, world/emocean/shoal.js
- `rail.figure` E: world/emocean/stage.js
- `rail.force` E: world/emocean/stage.js
- `rail.form` E: courier/ship/ship.js
- `rail.gather` E: world/emocean/pirates.js
- `rail.glance` E: world/emocean/waves.js
- `rail.hazard` E: world/emocean/hazards.js
- `rail.hit` E: world/emocean/stage.js
- `rail.hold` E: world/emocean/bosshold.js
- `rail.latch` E: world/emocean/foemechanics.js
- `rail.leg.end` E: world/emocean/triprun.js H: feedback/tracking/rules.js
- `rail.lock` E: world/emocean/stage.js H: music/choose.js
- `rail.lock.drop` E: courier/ship/ship.js
- `rail.mend` E: world/emocean/stage.js, world/emocean/triprun.js
- `rail.mine` E: world/emocean/foemechanics.js
- `rail.mount` E: courier/ship/mounts.js
- `rail.part` E: world/emocean/charybdis.js, world/emocean/foemechanics.js, world/emocean/leviathan.js, world/emocean/pirates.js H: music/choose.js
- `rail.phase` E: world/emocean/leviathan.js, world/emocean/pirates.js
- `rail.plate` E: courier/ship/mounts.js
- `rail.ram` E: world/emocean/pirates.js
- `rail.refuse` E: courier/ship/ship.js
- `rail.ring` E: world/emocean/hazards.js
- `rail.scatter` E: world/emocean/shoal.js
- `rail.shoal.eye` E: world/emocean/shoal.js
- `rail.shoal.form` E: world/emocean/shoal.js
- `rail.shoal.lock` E: world/emocean/shoal.js
- `rail.shoal.shatter` E: world/emocean/shoal.js
- `rail.start` E: world/emocean/stage.js
- `rail.steal` E: world/emocean/pirates.js
- `rail.surge` E: courier/ship/ship.js
- `rail.tell` E: world/emocean/legrunner.js
- `rail.toll` E: courier/ship/mounts.js
- `rail.unlatch` E: world/emocean/foemechanics.js
- `rail.volley` E: world/emocean/stage.js H: music/choose.js
- `rail.warn` E: world/emocean/leviathan.js

## rare
- `rare.hot` E: world/dunes/rarefinds.js

## rave
- `rave.end` E: vfx/rave.js
- `rave.start` E: vfx/rave.js

## reactions
- `reactions` E: - H: courier/domainarts/run.js

## read
- `read` E: godhand/powers/sight.js

## realm
- `realm.name` E: world/garden/realm.js

## recap
- `recap.show` E: progress/recap.js H: ui/questjournal.js

## receptivity
- `receptivity` E: - H: courier/domainarts/run.js

## recoil
- `recoil.jump` E: courier/moves/recoil.js

## relay
- `relay` E: - H: courier/domainarts/depth.js

## render
- `render.lost` E: render/contextloss.js
- `render.restored` E: render/contextloss.js

## replay
- `replay.end` E: debug/replay.js
- `replay.play` E: debug/replay.js
- `replay.record` E: debug/replay.js
- `replay.save` E: debug/replay.js

## reprogram
- `reprogram.close` E: tools/veritome/reprogram.js
- `reprogram.miss` E: tools/veritome/reprogram.js
- `reprogram.open` E: tools/veritome/reprogram.js
- `reprogram.reject` E: tools/veritome/reprogram.js
- `reprogram.run` E: tools/veritome/reprogram.js H: creatures/jelly/greatjelly.js
- `reprogram.wear` E: creatures/ai/brain.js, tools/veritome/reprogram.js

## rhythm
- `rhythm.list` E: boot/chatcommands.js
- `rhythm.offset` E: boot/chatcommands.js
- `rhythm.quit` E: music/rhythm/rhythm.js
- `rhythm.score` E: music/rhythm/rhythm.js H: progress/econ/economy.js, world/busk.js
- `rhythm.start` E: music/rhythm/rhythm.js

## room
- `room.cleared` E: boot/services.js
- `room.help` E: godhand/godhand.js, world/basement/course.js
- `room.reset` E: boot/debug.js

## rutter
- `rutter.get` E: progress/voyage.js

## safari
- `safari.habit` E: progress/safarirun.js
- `safari.judged` E: progress/safarirun.js
- `safari.lure` E: progress/safarirun.js
- `safari.plate` E: progress/safarirun.js
- `safari.research` E: progress/safarirun.js

## same
- `same` E: coop/letters.js

## sandbox
- `sandbox.enter` E: world/sandbox/sandbox.js
- `sandbox.goal` E: world/sandbox/pitch.js
- `sandbox.juggle` E: world/sandbox/pitch.js
- `sandbox.kick` E: world/sandbox/pitch.js
- `sandbox.leave` E: world/sandbox/sandbox.js

## save
- `save.cloud` E: core/cloudsave.js
- `save.fail` E: boot/save.js

## scan
- `scan.read` E: world/scanner.js H: ui/scanmoment.js

## screen
- `screen.turn` E: core/platform.js

## sea
- `sea.boom` E: audio/cues.js
- `sea.bottle` E: world/opensea/puzzlepieces.js
- `sea.broadside` E: world/opensea/seafight.js
- `sea.broadside.dry` E: world/opensea/seafight.js
- `sea.dig` E: world/opensea/puzzlepieces.js
- `sea.echo` E: world/opensea/puzzlepieces.js
- `sea.echo.hear` E: world/opensea/puzzlepieces.js
- `sea.echo.miss` E: world/opensea/puzzlepieces.js
- `sea.fuel.low` E: world/opensea/opensea.js
- `sea.gust` E: world/opensea/opensea.js
- `sea.habit` E: world/opensea/herds.js
- `sea.herd` E: world/opensea/herds.js
- `sea.herd.paid` E: world/opensea/herds.js
- `sea.herds` E: world/opensea/herds.js
- `sea.hull` E: world/opensea/seafight.js
- `sea.hull.broken` E: world/opensea/seafight.js
- `sea.lineup` E: world/opensea/puzzlepieces.js
- `sea.luff` E: world/opensea/opensea.js
- `sea.mend` E: world/opensea/seafight.js
- `sea.mount` E: world/opensea/seamounts.js
- `sea.pair` E: world/opensea/puzzlepieces.js
- `sea.pair.half` E: world/opensea/puzzlepieces.js
- `sea.plate` E: world/opensea/herds.js
- `sea.puzzle.seen` E: world/opensea/puzzlepieces.js
- `sea.rip` E: world/opensea/opensea.js
- `sea.rumour` E: world/opensea/herds.js
- `sea.rumour.paid` E: world/opensea/opensea.js
- `sea.sail.fair` E: world/opensea/seafolds.js
- `sea.salvage` E: world/opensea/opensea.js
- `sea.secret` E: world/opensea/opensea.js
- `sea.slick` E: world/opensea/seamounts.js
- `sea.sonar` E: world/opensea/seamounts.js
- `sea.square.done` E: world/opensea/opensea.js
- `sea.stele` E: world/opensea/opensea.js
- `sea.windsong` E: world/opensea/seafolds.js
- `sea.windsong.refuse` E: world/opensea/seafolds.js

## seabeast
- `seabeast.captured` E: world/opensea/seafolds.js
- `seabeast.deliver.refuse` E: world/opensea/seafolds.js
- `seabeast.down` E: creatures/seaserpent/seaserpent.js
- `seabeast.lost` E: world/opensea/seafolds.js
- `seabeast.tow` E: world/opensea/seamounts.js
- `seabeast.tow.arrive` E: world/opensea/seafolds.js
- `seabeast.tow.refuse` E: world/opensea/seafolds.js
- `seabeast.towing` E: world/opensea/seafolds.js

## seal
- `seal.carve` E: world/cradles.js H: vfx/jellymount/look.js
- `seal.set` E: world/cradles.js
- `seal.unset` E: world/cradles.js

## sealed
- `sealed.open` E: world/ostraca.js

## seam
- `seam.lift` E: render/seam.js

## seaserpent
- `seaserpent.break` E: creatures/seaserpent/shapes.js
- `seaserpent.coil` E: creatures/seaserpent/seaserpent.js
- `seaserpent.down` E: creatures/seaserpent/seaserpent.js
- `seaserpent.free` E: creatures/seaserpent/seaserpent.js, creatures/seaserpent/shapes.js, creatures/seaserpent/signatures.js
- `seaserpent.hit` E: creatures/seaserpent/seaserpent.js
- `seaserpent.hold` E: creatures/seaserpent/shapes.js
- `seaserpent.move` E: creatures/seaserpent/seaserpent.js
- `seaserpent.rise` E: creatures/seaserpent/mind.js
- `seaserpent.wind` E: creatures/seaserpent/seaserpent.js

## seed
- `seed.feed` E: world/garden/orbit.js
- `seed.grow` E: world/garden/orbit.js H: vfx/garden/launchlotus.js, vfx/garden/seedlooks.js
- `seed.plant` E: world/garden/orbit.js

## sentinel
- `sentinel.mend` E: creatures/sentinel/mind.js
- `sentinel.seek` E: creatures/sentinel/mind.js
- `sentinel.wake` E: creatures/sentinel/sentinels.js

## session
- `session.open` E: boot/chatcommands.js

## setfast
- `setfast` E: godhand/powers/make.js

## setting
- `setting.change` E: core/settings.js H: core/gyrosteer.js

## shatter
- `shatter` E: - H: courier/domainarts/run.js

## shelf
- `shelf.add` E: world/raceway/trackshelf.js
- `shelf.drop` E: world/raceway/trackshelf.js

## shell
- `shell.anchor` E: tools/psygun/casters.js
- `shell.bank` E: tools/psygun/specials.js
- `shell.befriend` E: tools/psygun/casters.js
- `shell.draw` E: tools/psygun/worlddraw.js
- `shell.dry` E: tools/psygun/shells.js, tools/psygun/shellworld.js
- `shell.erode` E: tools/psygun/shellworld.js
- `shell.fire` E: tools/psygun/shells.js
- `shell.found` E: progress/combat/worldshells.js
- `shell.hatch` E: tools/psygun/casters.js
- `shell.mark` E: tools/psygun/shells.js
- `shell.mend` E: tools/psygun/shellworld.js
- `shell.refill` E: world/level.js
- `shell.slice` E: tools/psygun/shells.js
- `shell.spring` E: tools/psygun/worlddraw.js

## ship
- `ship.fragment` E: progress/opensea/salvage.js
- `ship.part` E: progress/opensea/salvage.js

## shop
- `shop.buy` E: progress/shop/shops.js H: progress/voyage.js
- `shop.close` E: progress/shop/shops.js
- `shop.haggle` E: progress/shop/shops.js H: npc/clayese.js
- `shop.open` E: progress/shop/shops.js
- `shop.sell` E: progress/shop/shops.js H: progress/voyage.js

## shot
- `shot.fire` E: tools/psygun/weapon.js H: courier/moves/recoil.js, tools/psygun/shellrunner.js, world/strawmanwell/stages/arsenal.js, world/strawmanwell/stages/pit.js, world/throwingroom/drills.js

## showcase
- `showcase.end` E: world/emocean/stage.js
- `showcase.hull` E: world/emocean/stage.js, world/emocean/triprun.js
- `showcase.mend` E: world/emocean/stage.js
- `showcase.start` E: world/emocean/stage.js

## shrine
- `shrine.find` E: world/shrines.js
- `shrine.rest` E: world/shrines.js H: godhand/rejection.js, vfx/flourishes.js
- `shrine.storage` E: world/shrines.js
- `shrine.travel` E: world/shrines.js H: vfx/flourishes.js

## sibling
- `sibling.arrive` E: coop/chatroom.js
- `sibling.flash` E: coop/fight.js
- `sibling.hit` E: coop/sibling.js
- `sibling.idle` E: coop/chatroom.js
- `sibling.leave` E: coop/chatroom.js
- `sibling.parry` E: coop/fight.js
- `sibling.point` E: coop/point.js
- `sibling.reform` E: vfx/siblingshatter.js
- `sibling.stuck` E: coop/sibling.js
- `sibling.toll` E: coop/fight.js

## sight
- `sight.calibrate` E: progress/sight.js

## sigil
- `sigil.pop` E: tools/soulbrush/techniques.js

## sign
- `sign.help` E: world/basement/basement.js

## skiff
- `skiff.bail` E: courier/skiff/skiff.js H: world/raceway/race.js
- `skiff.buoy` E: world/raceway/buoys.js, world/raceway/surf/poolbuoys.js H: vfx/racewaylooks.js
- `skiff.butter` E: courier/skiff/sloperide.js
- `skiff.carve` E: courier/skiff/skiff.js, workbench/racewaylooksstage.js H: vfx/racewaylooks.js, world/raceway/licences.js
- `skiff.carve.charge` E: courier/skiff/skiff.js, workbench/racewaylooksstage.js H: vfx/racewaylooks.js
- `skiff.combo` E: courier/skiff/combo.js, workbench/racewaylooksstage.js H: vfx/racewaylooks.js
- `skiff.combo.bank` E: courier/skiff/combo.js, workbench/racewaylooksstage.js H: vfx/raceway/spectators.js, vfx/racewaylooks.js
- `skiff.combo.drop` E: courier/skiff/combo.js, workbench/racewaylooksstage.js H: vfx/racewaylooks.js
- `skiff.edge.skid` E: courier/skiff/sloperide.js H: vfx/waves/spray.js
- `skiff.flare.banked` E: courier/skiff/skiff.js H: vfx/racewaylooks.js
- `skiff.gap` E: world/raceway/gaps.js H: vfx/raceway/spectators.js
- `skiff.glaze` E: progress/skiffparts.js
- `skiff.glide` E: courier/skiff/skiff.js
- `skiff.grab` E: courier/skiff/skiff.js H: vfx/raceway/spectators.js
- `skiff.grab.late` E: courier/skiff/skiff.js
- `skiff.grind` E: courier/skiff/grind.js, workbench/racewaylooksstage.js H: vfx/racewaylooks.js
- `skiff.grind.end` E: courier/skiff/grind.js, workbench/racewaylooksstage.js H: vfx/racewaylooks.js, world/raceway/licences.js
- `skiff.grind.trick` E: courier/skiff/skiff.js H: vfx/raceway/spectators.js
- `skiff.hop` E: courier/skiff/skiff.js
- `skiff.hull` E: courier/skiff/boardrules.js H: vfx/skiffboardlooks.js
- `skiff.land.slope` E: courier/skiff/skiff.js H: vfx/raceway/spectators.js
- `skiff.landhard` E: courier/skiff/skiff.js
- `skiff.manual` E: courier/skiff/boardrules.js
- `skiff.nearmiss` E: courier/skiff/boardrules.js
- `skiff.ollie` E: courier/skiff/skiff.js
- `skiff.paint` E: progress/skiffpaint.js
- `skiff.park` E: courier/skiff/skiff.js
- `skiff.part` E: progress/skiffparts.js
- `skiff.plate` E: courier/skiff/skiff.js, workbench/racewaycavernstage.js, workbench/racewaylooksstage.js H: vfx/racewaycavern.js, vfx/racewaylooks.js
- `skiff.plate.beat` E: world/raceway/platebeat.js
- `skiff.pop` E: courier/skiff/skiff.js, workbench/racewaylooksstage.js H: vfx/raceway/spectators.js, vfx/racewaylooks.js
- `skiff.pop.miss` E: courier/skiff/skiff.js, workbench/racewaylooksstage.js H: vfx/racewaylooks.js
- `skiff.pump` E: courier/skiff/skiff.js H: world/raceway/race.js
- `skiff.recall` E: courier/skiff/skiff.js
- `skiff.refill` E: courier/skiff/boardrules.js H: vfx/racewayprops.js, world/raceway/licences.js
- `skiff.ring` E: workbench/racewaylooksstage.js, world/raceway/railsrings.js H: vfx/racewaylooks.js
- `skiff.scorch` E: courier/skiff/boardrules.js H: vfx/skiffboardlooks.js
- `skiff.set` E: ui/skiffsetcards.js, vfx/skiffsets.js
- `skiff.setting` E: courier/skiff/skiffsettings.js
- `skiff.setup` E: progress/skiffparts.js
- `skiff.shoulder` E: courier/skiff/boardrules.js
- `skiff.siphon` E: world/raceway/siphons.js H: vfx/racewaysiphons.js
- `skiff.slope` E: courier/skiff/sloperide.js
- `skiff.slope.land` E: courier/skiff/sloperide.js
- `skiff.start` E: courier/skiff/skiff.js
- `skiff.submarine` E: courier/skiff/surf.js
- `skiff.surf` E: courier/skiff/surf.js
- `skiff.surf.drag` E: courier/skiff/handdrag.js
- `skiff.surf.pump` E: courier/skiff/surf.js
- `skiff.surf.turn` E: courier/skiff/surf.js
- `skiff.tick` E: courier/skiff/skiff.js
- `skiff.trick` E: courier/skiff/skiff.js H: vfx/raceway/spectators.js, world/raceway/licences.js
- `skiff.tube.enter` E: courier/skiff/surf.js
- `skiff.tube.exit` E: courier/skiff/surf.js H: vfx/waves/spray.js
- `skiff.tumble` E: courier/skiff/skiff.js
- `skiff.tune` E: progress/skiffparts.js
- `skiff.water` E: courier/skiff/skiff.js H: vfx/skiffwaterlook.js
- `skiff.wobble` E: courier/skiff/skiff.js
- `skiff.wreck` E: courier/skiff/boardrules.js H: vfx/skiffboardlooks.js

## sky
- `sky.read` E: progress/weather.js

## slab
- `slab` E: godhand/powers/force.js
- `slab.carve` E: world/garden/bench.js H: vfx/garden/slablook.js
- `slab.make` E: world/garden/bench.js, world/garden/howto.js, world/scanner.js
- `slab.use` E: world/garden/bench.js H: vfx/garden/slablook.js

## slam
- `slam.impact` E: core/events.js, courier/moves/slam.js

## slip
- `slip.splat` E: tools/psygun/shells.js

## sondelass
- `sondelass.draw` E: tools/sondelass/sondelass.js
- `sondelass.form` E: tools/sondelass/sondelass.js
- `sondelass.stow` E: tools/sondelass/sondelass.js

## song
- `song.play` E: tools/crucibelle/crucibelle.js

## soon
- `soon` E: coop/letters.js

## spend
- `spend` E: courier/lachryma.js H: feedback/tracking/pool.js, vfx/crucibellesongbook.js, vfx/filigree.js, vfx/soulbrushdesk.js

## spirit
- `spirit.bind` E: creatures/bound.js
- `spirit.drill` E: - H: progress/harmony.js
- `spirit.drink` E: progress/spiritdiet.js
- `spirit.farewell` E: progress/spiritlife.js
- `spirit.farewell.ask` E: progress/spiritlife.js
- `spirit.feed` E: - H: progress/harmony.js, progress/spiritlife.js
- `spirit.gift` E: progress/spiritlife.js
- `spirit.letter` E: progress/spiritlife.js
- `spirit.letters` E: progress/spiritlife.js
- `spirit.merge` E: world/garden/awaken.js
- `spirit.name` E: world/garden/raising.js
- `spirit.notice` E: progress/spiritnotice.js
- `spirit.out` E: world/garden/raising.js
- `spirit.pet` E: - H: progress/harmony.js
- `spirit.race` E: world/garden/races.js
- `spirit.race.start` E: world/garden/races.js H: progress/harmony.js
- `spirit.release` E: creatures/bound.js H: progress/spiritlife.js
- `spirit.spar` E: world/garden/raising.js
- `spirit.spar.bump` E: world/garden/raising.js
- `spirit.spar.start` E: world/garden/raising.js H: progress/harmony.js
- `spirit.summon` E: creatures/spirits.js
- `spirit.taste` E: progress/spiritdiet.js
- `spirit.tint` E: progress/spiritdiet.js
- `spirit.visit` E: world/garden/awaken.js
- `spirit.wish` E: progress/spiritlife.js
- `spirit.wish.done` E: progress/spiritlife.js

## spore
- `spore.back` E: progress/sporebeds.js
- `spore.bed` E: progress/sporebeds.js
- `spore.harvest` E: progress/sporebeds.js
- `spore.inoculate` E: progress/sporebeds.js
- `spore.learn` E: progress/sporebeds.js
- `spore.print` E: progress/sporeprints.js
- `spore.seeded` E: progress/sporebeds.js
- `spore.set` E: progress/sporebeds.js
- `spore.tend` E: progress/sporebeds.js

## spread
- `spread.class` E: progress/laidspread.js
- `spread.complete` E: progress/laidspread.js
- `spread.crack` E: progress/laidspread.js
- `spread.flip` E: progress/laidspread.js
- `spread.lay` E: progress/laidspread.js
- `spread.tally` E: progress/laidspread.js

## stain
- `stain.find` E: world/ground/stains.js
- `stain.spawn` E: world/ground/stains.js
- `stain.spill` E: world/ground/stains.js
- `stain.wash` E: world/ground/stains.js H: progress/combat/worldshells.js

## stamp
- `stamp` E: godhand/powers/script.js

## standing
- `standing.up` E: progress/achievements.js

## standingRule
- `standingRule` E: - H: courier/domainarts/run.js

## start
- `start.at` E: debug/startat.js

## statusbench
- `statusbench.light` E: world/throwingroom/statusbench.js
- `statusbench.status` E: world/throwingroom/statusbench.js

## steadyHand
- `steadyHand` E: - H: tools/psygun/weapon.js

## stealth
- `stealth.spook` E: progress/safarirun.js

## stele
- `stele.read` E: world/ostraca.js

## strata
- `strata` E: godhand/powers/sight.js

## strawman
- `strawman.ask` E: world/throwingroom/strawmanrig.js
- `strawman.bout` E: world/throwingroom/room.js
- `strawman.mode` E: world/throwingroom/room.js
- `strawman.parried` E: world/throwingroom/strawmanstrings.js
- `strawman.rig` E: world/throwingroom/strawmanrig.js
- `strawman.run` E: world/throwingroom/strawmanrig.js
- `strawman.strike` E: world/throwingroom/strawmanstrings.js
- `strawman.string` E: world/throwingroom/strawmanstrings.js
- `strawman.tempo` E: world/throwingroom/strawmanstrings.js
- `strawman.windup` E: world/throwingroom/strawmanstrings.js

## stun
- `stun.build` E: creatures/stun.js

## system
- `system.unlock` E: progress/system.js

## table
- `table.ceremony.beat` E: ui/scoreceremony.js
- `table.ceremony.begin` E: ui/scoreceremony.js
- `table.ceremony.end` E: ui/scoreceremony.js

## take
- `take` E: godhand/powers/will.js

## target
- `target.hit` E: world/props/movers.js

## tech
- `tech.end` E: courier/moves/techs.js
- `tech.start` E: courier/moves/techs.js

## telegraph
- `telegraph.cast` E: world/throwingroom/telegraphfloor.js H: vfx/practicecaster.js

## telegraphfloor
- `telegraphfloor.set` E: world/throwingroom/telegraphfloor.js

## thermometer
- `thermometer` E: - H: progress/knacks.js

## thickWalls
- `thickWalls` E: - H: progress/knacks.js

## throw
- `throw.hit` E: courier/moves/carry.js

## tithe
- `tithe.pull` E: world/treasure/chests.js

## title
- `title.enter` E: boot/title.js H: debug/startat.js

## took
- `took` E: core/cloudsave.js

## tool
- `tool.equip` E: tools/belt.js
- `tool.lend` E: courier/domainarts/run.js, tools/belt.js H: boot/pneuka.js

## toolskin
- `toolskin.set` E: vfx/toolskinwear.js

## totem
- `totem` E: godhand/powers/make.js

## touch
- `touch.art` E: - H: feedback/touchshell.js
- `touch.layout` E: core/layoutkeep.js
- `touch.log` E: ui/touchlog.js
- `touch.mod` E: - H: feedback/touchshell.js
- `touch.open` E: ui/touch/topbar.js
- `touch.size` E: - H: feedback/touchshell.js

## touchstone
- `touchstone.enter` E: world/touchstone/touchstone.js
- `touchstone.leave` E: world/touchstone/touchstone.js

## track
- `track.load` E: world/raceway/editor.js
- `track.share` E: world/raceway/editor.js H: ui/combcode.js
- `track.validate` E: world/raceway/editor.js

## transmute
- `transmute` E: godhand/powers/alter.js

## trap
- `trap.bolt` E: world/raceway/trapkinds.js
- `trap.break` E: world/raceway/trapkinds.js
- `trap.fire` E: world/raceway/traps.js
- `trap.hit` E: world/raceway/traps.js H: world/raceway/haunt.js
- `trap.land` E: world/raceway/trapkinds.js
- `trap.lob` E: world/raceway/trapkinds.js
- `trap.parry` E: world/raceway/traps.js
- `trap.read` E: world/raceway/traps.js
- `trap.smash` E: world/raceway/trapkinds.js
- `trap.stun` E: world/raceway/traps.js
- `trap.tell` E: world/raceway/traps.js
- `trap.warp` E: world/raceway/traps.js

## trial
- `trial.finish` E: world/trial.js
- `trial.jar` E: world/trial.js
- `trial.solar` E: world/dunes/solar.js
- `trial.solar.end` E: world/dunes/solar.js
- `trial.solar.start` E: world/dunes/solar.js
- `trial.start` E: world/trial.js

## trueOdds
- `trueOdds` E: - H: courier/domainarts/depth.js

## tuning
- `tuning.tuned` E: boot/title.js

## twoTone
- `twoTone` E: - H: progress/knacks.js, vfx/agatelook.js

## unknown
- `unknown` E: coop/letters.js

## unsure
- `unsure` E: coop/letters.js

## updraft
- `updraft.enter` E: world/props/movers.js

## usage
- `usage.cap` E: coop/usage.js
- `usage.report` E: coop/usage.js

## vantage
- `vantage.reach` E: world/vantages.js

## veritome
- `veritome.draw` E: tools/veritome/veritome.js
- `veritome.lens` E: tools/veritome/veritome.js
- `veritome.plate` E: tools/veritome/finishplate.js
- `veritome.shutter` E: tools/veritome/veritome.js
- `veritome.stow` E: tools/veritome/veritome.js

## vessel
- `vessel.crack` E: courier/vessel/damage.js H: vfx/hudring.js, vfx/releasecrack.js
- `vessel.fire` E: courier/vessel/vessel.js
- `vessel.mend` E: courier/vessel/damage.js
- `vessel.refire` E: courier/vessel/kilnui.js
- `vessel.release` E: courier/vessel/damage.js H: vfx/releasecrack.js
- `vessel.shield` E: courier/vessel/damage.js H: vfx/hudring.js
- `vessel.shieldbreak` E: courier/vessel/damage.js H: tools/soulbrush/load.js, vfx/hudring.js
- `vessel.ward` E: courier/vessel/damage.js

## vfx
- `vfx.list` E: boot/chatcommands.js
- `vfx.test` E: boot/chatcommands.js

## voice
- `voice.say` E: audio/voice/voice.js

## vow
- `vow` E: - H: courier/domainarts/run.js

## wager
- `wager.place` E: progress/econ/wager.js
- `wager.settle` E: progress/econ/wager.js

## waiting
- `waiting` E: coop/letters.js

## ward
- `ward` E: godhand/powers/script.js

## watch
- `watch` E: - H: courier/domainarts/run.js

## weapon
- `weapon.charged` E: tools/psygun/weapon.js

## well
- `well.astray` E: world/well/dunemaw.js
- `well.cavern` E: world/well/dunemaw.js
- `well.charted` E: world/well/dunemaw.js
- `well.dummy.ko` E: world/strawmanwell/dummy.js
- `well.dummy.trophy` E: world/strawmanwell/dummy.js
- `well.enter` E: world/well/dunemaw.js
- `well.escape.start` E: world/well/dunemaw.js
- `well.fighter.hit` E: world/strawmanwell/fighter/kit.js
- `well.fighter.ko` E: world/strawmanwell/fighter/kit.js
- `well.fighter.stock` E: world/strawmanwell/fighter/kit.js
- `well.find` E: world/well/dunemaw.js
- `well.flood.fill` E: world/strawmanwell/flood.js
- `well.floor` E: world/well/dunemaw.js
- `well.foe` E: world/well/dunemaw.js
- `well.grab` E: world/strawmanwell/dummygrab.js
- `well.guide` E: world/strawmanwell/guide.js
- `well.leave` E: world/well/dunemaw.js
- `well.pit.death` E: world/strawmanwell/stages/depthlanes.js, world/strawmanwell/stages/jar.js, world/strawmanwell/stages/pitkit.js, world/strawmanwell/strawmanwell.js H: world/strawmanwell/guide.js
- `well.pogo` E: world/strawmanwell/verbs.js
- `well.sandfall` E: world/well/wellshift.js
- `well.stage.clear` E: world/strawmanwell/strawmanwell.js H: world/strawmanwell/guide.js
- `well.stage.enter` E: world/strawmanwell/strawmanwell.js
- `well.target` E: world/strawmanwell/targets.js
- `well.throw` E: world/strawmanwell/dummygrab.js
- `well.tsuke` E: vfx/strawmanwell/arena/barrage.js
- `well.turret.parry` E: world/strawmanwell/turret.js
- `well.turret.stun` E: world/strawmanwell/turret.js
- `well.verb` E: world/strawmanwell/strawmanwell.js

## wetInk
- `wetInk` E: - H: tools/soulbrush/celestial.js

## wideBore
- `wideBore` E: - H: tools/psygun/weapon.js

## windup
- `windup.read` E: creatures/creatures.js

## wisp
- `wisp.drink` E: world/duel/duelfoes.js
- `wisp.notice` E: creatures/wisp/mind.js

## zip
- `zip.end` E: tools/sondelass/grapple.js
- `zip.start` E: tools/sondelass/grapple.js

## zone
- `zone.acoustic` E: render/zones.js H: world/strawmanwell/stages/arsenal.js, world/strawmanwell/stages/flip.js, world/strawmanwell/stages/jar.js, world/strawmanwell/stages/pit.js, world/strawmanwell/stages/swing.js
