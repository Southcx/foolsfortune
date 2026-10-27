// ---------------------------------------------------------------------------------------
// THE SOUNDS THE EVENTS MAKE: a table over the event bus, as tracking.js's is for the log. A feature that wants a sound for something
// it already reports (an event) needs no call of its own: a line here says what it sounds like. (Sounds that are part of an action,
// a swing, a step, stay where the action is.)
//
// Prior art: Wwise's and FMOD's events (the game says what happened, the sound designer decides what it sounds like), and this
// game's own tracking.js.
//
//   hearEvents(game, sfx)   (once, at boot)
// ---------------------------------------------------------------------------------------
import { installHaptics } from './haptics.js';
import { installAudioHealth } from './health.js';
import { gardenState } from './garden.js';
import { today } from '../core/calendar.js';
import { feelingOfKind } from './mycelium.js';

const CYL = { autoAt: 0 }; // (when the cylinder last turned itself)
const FLIP = { day: -1 }; // (the game day the Box was last turned over in: the day's card once a game day)
const REPORT = { n: 0 }; // (reports paid at this dock: a coin a step up)
const RING = { n: -1, at: 0 }; // (rings threaded in this turn: a chime a degree up each)
const nearK = (n) => (n === true || n == null ? 0.8 : n > 1 ? Math.max(0.2, 1 - n / 8) : n); // (`near`: a flag, 0..1, or metres)
const CEREMONY = { heard: false }; // (a score ceremony seen this session: the table view now paces the count)
/** How far a Raceway trap's look is from the camera (m), for its tell's level; undefined if either is missing. */
const trapDistance = (g, i) => { const at = g.raceway?.traps?.list?.[i]?.look?.root?.position; return at && g.camera ? at.distanceTo(g.camera.position) : undefined; };

const RULES = {
  'dreamvane.survey': (s) => s.surveySwing?.(), // (the heel going up; the blow's own sound is cartography's survey)
  'psygun.change': (s) => s.gunSwap?.(), // (shells.js)
  'psygun.chamber': (s) => s.chamberClick?.(),
  // (the cylinder, Calissa's look: audio/psyguncylinder.js. A last shell turns it on by itself before shell.fire, so that shot's mechanism is the auto-turn's)
  'psygun.turn': (s, e) => (e.auto ? ((CYL.autoAt = Date.now()), s.cylinderAutoTurn?.({ bead: e.chamber ?? 0 })) : e.loaded ? s.cylinderTurn?.() : s.cylinderHollow?.()),
  'shell.fire': (s) => (Date.now() - CYL.autoAt < 100 ? null : s.cylinderShot?.()),
  'psygun.cylinder': (s, e) => (e.kind === 'open' ? s.cylinderOpen?.() : e.kind === 'home' ? s.cylinderHome?.() : null),
  // the vessel's moments (courier/vessel/: audio/vessel.js), over the cracks and the burst already played where they happen
  'vessel.shield': (s, e) => s.vesselShield?.(e.left),
  'vessel.shieldbreak': (s) => s.vesselShieldBreak?.(),
  'courier.shatter': (s) => s.courierShatter?.(),
  'courier.reform': (s) => s.courierReform?.(),
  'vessel.refire': (s) => s.vesselRefire?.(),
  'creature.mind': (s, e) => { const k = { fluid: 0.45, prismatic: 1 }[e.state]; if (k) s.prismatic?.(k); }, // (a mind entering Fluid or Prismatic: a half sweep, a full one; the event says only the state entered, so Prismatic falling back to Fluid sounds the half)
  // a Well's pools (world/well/dunemaw.js): down a floor, or back up to the mouth (not when shattered: the reform has its own)
  'well.floor': (s, e) => s.poolDown?.(e.floor),
  'well.leave': (s, e) => { if (!e.shattered) s.poolUp?.(); },
  'combat.annihilate': (s) => { s.damage?.('impact', 1); s.damage?.('delirium', 1); s.prismatic?.(1); }, // (the two ends of the line at once: audio/damage.js)
  'lockheart.ultimate.end': (s) => s.ultimateEnd?.(), // (its cue and its landing are music: music/lockheart.js, music/choose.js)
  // the crossing's rail shooter (audio/rail.js): a lock's tone and a down, each on the music's next sixteenth (Rez)
  'skiff.glide': (s) => s.skiffGlide?.(), // (the wings' wind: audio/moves.js skiffLoop)
  'skiff.tumble': (s, e) => s.tumbleThump?.(e.speed), // (the bail's ragdoll on the sand, a thump a contact)
  'sibling.hit': (s, e) => s.siblingHit?.(e.down), // (a sibling's clay struck: audio/vessel.js)
  'race.count': (s, e) => s.raceCount?.(e.n), // (the Raceway: audio/raceway.js; its cue is music/raceway.js)
  'race.go': (s) => s.raceGo?.(),
  'race.solarstart': (s) => s.raceSolarStart?.(),
  'race.gate': (s, e) => s.raceGate?.(e.split),
  'race.lap': (s, e) => s.raceLap?.(e.best === true), // (best: true when this lap is the new best)
  'race.finish': (s, e) => { s.raceFinish?.(e.medal); s.raceWet?.(false); },
  'skiff.carve.charge': (s, e) => s.carveCharge?.(e.tier),
  'skiff.carve': (s, e) => s.carveRelease?.(e.tier),
  'skiff.plate': (s, e) => s.skiffPlate?.(e.power ?? 1),
  'skiff.pop': (s, e) => s.skiffPop?.(e.perfect),
  'skiff.pop.miss': (s) => s.skiffPopMiss?.(),
  'skiff.grab': (s, e) => s.skiffGrab?.(e.grab, e.seconds),
  'skiff.grab.late': (s) => s.skiffGrabLate?.(),
  'skiff.land.slope': (s, e) => s.skiffLandSlope?.(e.gain),
  'skiff.combo': (s, e) => s.skiffCombo?.(e.n),
  'skiff.combo.bank': (s, e) => s.skiffComboBank?.(e.mult),
  'skiff.combo.drop': (s) => s.skiffComboDrop?.(),
  'raceway.branch': (s) => s.racewayBranch?.(),
  'skiff.water': (s, e) => s.skiffWater?.(e.on !== false, e.speed),
  'skiff.grind.trick': (s) => s.skiffGrindTrick?.(),
  'race.bump': (s, e) => s.raceBump?.(e.impact),
  'race.takedown': (s) => s.raceTakedown?.(),
  'race.place': (s, e) => s.racePlace?.(e.place),
  'skiff.hull': (s, e) => s.skiffHull?.(e.damage, e.left), // (the Raceway's round six: audio/racewaystunts.js, audio/racewaymodes.js)
  'skiff.wreck': (s) => s.skiffWreck?.(),
  'skiff.refill': (s) => s.skiffRefill?.(),
  'skiff.scorch': (s) => s.skiffScorch?.(),
  'skiff.manual': (s, e) => s.skiffManual?.(e.seconds, e.fell),
  'skiff.shoulder': (s) => s.skiffShoulder?.(),
  'skiff.nearmiss': (s) => s.skiffNearMiss?.(),
  'skiff.gap': (s, e) => s.skiffGap?.(e.points),
  'skiff.buoy': (s, e) => s.skiffBuoy?.(e.hit !== false, e.power),
  'race.pot': (s) => s.racePot?.(),
  'race.taunt': (s) => s.raceTaunt?.(),
  'race.flyover': (s) => s.raceFlyover?.(),
  'race.restart': (s) => s.raceRestart?.(),
  'race.rewind': (s, e) => s.raceRewind?.(e.seconds),
  'licence.fail': (s) => s.licenceFail?.(),
  'cup.race': (s) => s.cupRace?.(),
  'cup.finish': (s, e) => s.cupFinish?.(e.place),
  'citytrial.start': (s) => s.cityTrialStart?.(),
  'citytrial.clock': (s, e) => s.cityTrialClock?.(e.left),
  'citytrial.patch': (s) => s.cityTrialPatch?.(),
  'citytrial.stadium': (s) => s.cityTrialStadium?.(),
  'wager.place': (s) => s.wagerPlace?.(),
  'wager.settle': (s, e) => s.wagerSettle?.(!!e.won),
  'bazaar.enter': (s) => s.bazaarEnter?.(), // (Raku's bazaar: audio/casino.js; its cue music/casino.js)
  'casino.chips': (s, e) => s.casinoChips?.(!!e.cash),
  'casino.sit': (s) => s.casinoSit?.(),
  // (Querent's count: Calissa's score ceremony, ui/scoreceremony.js, drives it beat by beat; until one has begun, the hand plays it whole, a beat
  // late so a ceremony starting on the same move is heard first)
  'table.ceremony.begin': () => { CEREMONY.heard = true; },
  'table.ceremony.beat': (s, e, g) => (e.kind === 'tick' ? s.casinoTick?.(e.k ?? 0, e.rail || g.emocean?.stage?.active ? s.onSixteenth?.(g.music?.grid?.()) : 0) : e.kind === 'mult' ? s.casinoMult?.(e.n ?? 2) : e.kind === 'reel' ? s.casinoReel?.(e.dur)
    : e.kind === 'flourish' ? s.casinoFlourish?.(e.tier ?? 1) : null),
  'casino.play': (s, e) => (e.what === 'hand' && e.steps?.length ? void setTimeout(() => CEREMONY.heard || s.casinoCount?.(e.steps, e.tier ?? 1), 150) : e.what === 'nova' ? s.casinoNova?.()
    : e.what === 'callout' ? s.casinoCall?.(!!e.bluff) : s.casinoPlay?.(e.what)),
  'creature.stun': (s, e) => s.stunSting?.(e.depth ?? 1, { near: e.by === 'courier' }), // (a stun's depth, rising: audio/damage.js; STUN-DEPTH.md)
  'duel.pull': (s, e, g) => s.duelPullStart?.(() => g.duelFoes?.pull ?? 0), // (nearness opening a puzzle duel: audio/puzzleduel.js)
  'duel.slip': (s) => s.duelPullEnd?.(false),
  'duel.open': (s) => { s.duelPullEnd?.(true); s.duelOpen?.(); },
  'sea.echo': (s, e, g) => s.stoneAnswered?.(g.crucibelle?.grid?.().root ?? 63), // (the open sea's echo puzzle answered: audio/crystal.js)
  // the chatroom (co-op as our chatroom): a division's motif as its line arrives, a guest's arrival and leaving (audio/ui.js)
  'party.say': (s, e) => s.chatMotif?.(e.sibling || 'guest'),
  'chat.line': (s, e) => e.mine || s.chatMotif?.(String(e.from || 'guest').toLowerCase()), // (coop/chatroom.js: a session's line, or a guest's (`guest:<id>`); your own echoed back is silent)
  'guest.say': (s) => s.chatMotif?.('guest'),
  'guest.join': (s) => s.guestArrive?.(false),
  'guest.leave': (s) => s.guestArrive?.(false, true),
  'guest.garden': (s, e) => s.guestArrive?.(true, !!e.leave), // (a guest's Pneuka Jar come into your Spirit Garden, or gone: coop/guests.js)
  // the spreads (SPREADS.md; draft events until Petra's gate; audio/spreads.js): the board turned over, a Major laid, a cell lit in its
  // suit (the tally's climb its step up the run) or gone out, a crack where contrary suits meet, a spread complete
  'spread.flip': (s, e) => { s.spreadFlip?.(e.under !== false); if (e.under !== false && today() !== FLIP.day) { FLIP.day = today(); s.spreadDayCard?.(); } }, // (the game day's card on its first flip)
  'spread.class': (s, e) => e.to && e.to !== 'arcana.fool' && s.spreadCourt?.(e.to), // (the class your suits read as, changed: its flourish)
  'spread.lay': (s, e) => s.spreadLay?.(!!e.reversed),
  'spread.tally': (s, e) => ((e.to ?? 0) > (e.from ?? 0) ? s.spreadLight?.(e.suit, Math.max(0, Math.round(e.to) - 1)) : s.spreadDim?.(e.suit)),
  'spread.crack': (s, e) => s.spreadCrack?.(e.suit || e.a || 'wands'),
  'spread.complete': (s) => s.spreadDone?.(),
  // the open sea's hunter (Petra's events; audio/seaserpent.js): its rise, each move's tell and the move, struck, freed, down; the hull
  'seaserpent.rise': (s) => s.seaSerpentRise?.(),
  'seaserpent.wind': (s, e) => s.seaSerpentWind?.(e.move),
  'seaserpent.move': (s, e) => s.seaSerpentMove?.(e.move, !!e.hit),
  'seaserpent.hit': (s, e) => s.seaSerpentHit?.(e.part),
  'seaserpent.free': (s, e) => s.seaSerpentFree?.(e.how),
  'seaserpent.hold': (s, e) => s.seaSerpentHold?.(e.move),
  'seaserpent.break': (s, e) => s.seaSerpentBreak?.(e.left ?? 4),
  'seaserpent.down': (s) => s.seaSerpentDown?.(),
  'palm.condense': (s, e) => s.palmCondense?.(e.n, e.sides),
  'palm.grow': (s, e) => s.palmGrow?.(e.from, e.to),
  'angle.hookset': (s, e, g) => s.lineSongStart?.(() => { const a = g.angler, F = a?.state === 'fight' ? a.fight : null; return F ? { tension: F.tension, dist: F.dist, root: g.music?.grid?.()?.root ?? 64, scale: g.music?.scale?.() } : null; }), // (the line's song: audio/anglingsong.js)
  'angle.lift': (s, e, g) => s.angleLift?.(e, g.music?.grid?.()),
  // the trade and the thresholds: casting off, routes, arrivals, the belt, the Throwing Room, the garden's ins and outs (audio/trade.js)
  'emocean.hop': (s, e) => s.tradeCastOff?.(e.ship),
  'emocean.continue': (s) => s.tradeContinue?.(),
  'emocean.found': (s) => s.tradeRouteFound?.(),
  'rutter.get': (s, e) => s.tradeRouteMap?.(e.rank),
  'opensea.enter': (s) => s.arriveOpenSea?.(),
  'raceway.enter': (s) => s.arriveRaceway?.(),
  'bazaar.leave': (s) => s.bazaarLeave?.(),
  'tool.equip': (s, e) => s.beltToolSet?.(e.as, e.pair),
  'loadout.set': (s, e) => s.meleeLoadoutSlot?.(!!e.move),
  'photo.discard': (s, e) => s.veritomePlateDiscard?.(e.n),
  'drill.start': (s) => s.rangeDrillStart?.(),
  'drill.end': (s, e) => s.rangeDrillEnd?.(e.run?.shots ? (e.run.hits || 0) / e.run.shots : undefined),
  'drill.left': (s) => s.rangeDrillLeft?.(),
  'statusbench.light': (s, e) => s.rangeBenchLamp?.(e.light),
  'statusbench.status': (s, e) => s.rangeStatusChirp?.(e.status, e.dur),
  'paintrange.read': (s, e) => s.rangePaintRead?.(e.three, e.six, e.nine),
  'garden.slot': (s, e, g) => s.gardenSlotSet?.(gardenState(g), !!e.encounter),
  'garden.grant': (s, e, g) => s.gardenGrant?.(gardenState(g), e.kind),
  'garden.move': (s, e, g) => s.gardenFeatureMove?.(gardenState(g), e.mult, !!e.vein),
  'garden.track': (s, e, g) => s.gardenTrackCarve?.(gardenState(g), e.metres),
  'garden.view': (s, e) => s.gardenViewTurn?.(e.view),
  'alchemy.enter': (s, e, g) => s.alchemyEnter?.(gardenState(g), e.attribute, !!e.heart),
  // the world's small moments: the rod's extras, the jelly's fetch, the Wisp's drink, the mirage, the flourish, a stun building, the kiln door, the domains' levels, the sky read, the Sight (audio/worldmoments.js)
  'angle.brace': (s) => s.rodBrace?.(),
  'angle.crank': (s) => s.rodCrank?.(),
  'angle.retrieve.fast': (s) => s.fastRetrieve?.(),
  'angle.landed': (s, e) => s.fishStowed?.(e.baubles),
  'jelly.fetch': (s) => s.jellyFetch?.(),
  'wisp.drink': (s, e, g) => s.wispDrink?.(e.at && g.player ? Math.hypot(e.at[0] - g.player.pos.x, e.at[2] - g.player.pos.z) : 10),
  'mirage.raise': (s, e) => s.mirageRaise?.(e.secs),
  'mirage.fade': (s) => s.mirageFade?.(),
  'gun.flourish': (s, e) => (e.by === 'courier' ? s.gunFlourish?.() : null),
  'stun.build': (s, e) => (e.by === 'courier' ? s.stunBuildTick?.(e.meter, e.depth) : null),
  'reprogram.wear': (s, e) => s.reprogramWear?.(e.macro),
  'kiln.open': (s) => s.kilnDoorOpen?.(),
  'kiln.close': (s) => s.kilnDoorClose?.(),
  'balance.start': (s) => s.balanceBreath?.(),
  'pool.cap': (s, e) => s.poolCapClink?.(e.share, e.regions),
  'domain.level': (s, e, g) => (e.by === 'courier' ? s.domainLevelUp?.(e.domain, e.level, g.music?.grid?.()) : null),
  'sky.read': (s, e, g) => (e.by === 'courier' ? s.skyReadNotes?.(e.blocks, g.music?.grid?.()) : null),
  'sight.calibrate': (s, e) => s.sightCalibrate?.(e.from),
  // the Great Dunemaw, Strawman's strings and the Dunes (audio/dunemaw.js)
  'well.enter': (s) => s.wellEnter?.(),
  'well.sandfall': (s, e, g) => { const S = g.well?.cur?.sandfalls?.[e.i]; s.wellSandfall?.(e.state, S?.pos && g.player ? Math.hypot(S.pos.x - g.player.pos.x, S.pos.z - g.player.pos.z) : 10); },
  'floor.shift': (s) => s.wellFloorShift?.(),
  'well.find': (s, e, g) => s.wellFind?.(e.tier ?? 0, g.music?.grid?.()),
  'find.take': (s, e, g) => s.wellFindTake?.(e.kind, !!e.warped, g.music?.grid?.()),
  'well.cavern': (s) => s.wellCavern?.(),
  'well.charted': (s, e) => s.wellCharted?.(e.charted ?? 0),
  'cogitomap.get': (s, e, g) => s.wellCogitomap?.(e.charted ?? 0.5, g.music?.grid?.()),
  'well.escape.start': (s, e, g) => s.wellEscapeStart?.(() => !!g.well?.escaping),
  'well.astray': (s) => s.wellAstray?.(),
  'well.foe': (s, e) => s.wellFoeDown?.(e.how ?? null, e.floor ?? 1),
  'foe.cast': (s, e) => s.wellFoeCast?.(e.cast, e.windup),
  'foe.moment': (s, e) => s.wellFoeMoment?.(e.what),
  'foe.wipe': (s) => s.wellFoeWipe?.(),
  'strawman.string': (s, e) => s.strawString?.(e.string),
  'strawman.windup': (s, e, g) => s.strawWindup?.(e.move, e.blow ?? 0, e.eta, g.time?.scale ?? 1),
  'strawman.strike': (s, e) => s.strawStrike?.(!!e.landed, !!e.cleared),
  'strawman.parried': (s) => s.strawParried?.(),
  'strawman.tempo': (s, e) => s.strawTempo?.(e.tempo),
  'geyser.launch': (s) => s.dunesGeyserLaunch?.(),
  'stain.spawn': (s) => s.blotSpawn?.(),
  'stain.spill': (s, e) => s.blotSpill?.(e.lachryma, !!e.joined),
  'stain.wash': (s, e) => s.blotWash?.(e.stage ?? 0, e.by ?? 'courier'),
  'vantage.reach': (s, e, g) => s.vantageReach?.(g.music?.grid?.()),
  'ostracon.find': (s, e, g) => s.ostraconFind?.(e.word, g.music?.grid?.()),
  'stele.read': (s, e, g) => s.steleRead?.(e.words, g.music?.grid?.()),
  'plaster.break': (s) => s.plasterBreak?.(),
  'sealed.open': (s) => s.sealedOpen?.(),
  // the Raceway's built things: the traps, the haunt, the track editor, the garage and paint, the cups (audio/racewaybuild.js)
  'trap.tell': (s, e, g) => s.trapTell?.(e.kind, trapDistance(g, e.i)), // (each kind its own tell, then its act)
  'trap.fire': (s, e, g) => s.trapFire?.(e.kind, e.by, trapDistance(g, e.i)),
  'trap.hit': (s, e, g) => s.trapHit?.(e.kind, e.target, e.by, trapDistance(g, e.i)),
  'trap.parry': (s) => s.trapParry?.(),
  'trap.stun': (s, e, g) => s.trapStun?.(trapDistance(g, e.i)),
  'trap.warp': (s, e) => s.trapWarp?.(e.back, e.target),
  'haunt.start': (s, e, g) => s.hauntStart?.(g.music?.grid?.()),
  'haunt.end': (s, e, g) => s.hauntEnd?.(e.held, g.music?.grid?.()),
  'editor.open': (s) => s.editorOpen?.(),
  'editor.save': (s) => s.editorSave?.(),
  'track.validate': (s, e, g) => s.trackValidate?.(g.music?.grid?.()),
  'track.share': (s) => s.trackShare?.(),
  'track.load': (s) => s.trackLoad?.(),
  'skiff.part': (s, e) => s.skiffPartFit?.(e.slot),
  'skiff.tune': (s, e) => s.skiffTuneNotch?.(e.value),
  'skiff.setup': (s, e) => s.skiffSetupKeep?.(e.how),
  'skiff.paint': (s, e) => s.skiffPaintDye?.(e.kind, e.price),
  'race.nemesis': (s, e, g) => s.raceNemesis?.(e.beaten, g.music?.grid?.()),
  'race.escape.near': (s) => s.escapeNear?.(),
  'race.rival.finish': (s) => s.raceRivalFinish?.(),
  'race.respawn': (s) => s.raceRespawnSet?.(),
  'raceway.pit': (s) => s.racewayPitSnap?.(),
  'skiff.siphon': (s, e) => s.skiffSiphonDrink?.(e.took),
  'cup.start': (s, e, g) => s.cupStart?.(e.cup, g.music?.grid?.()),
  'cup.end': (s) => s.cupEnd?.(),
  'citytrial.end': (s, e) => s.cityTrialEnd?.(e.why),
  // the Spirit Garden's small moments: wishes, letters, the farewell, decor, thorns, the press, the spores (audio/gardenlife.js)
  'spirit.wish': (s, e, g) => s.spiritWish?.(gardenState(g), feelingOfKind(e.kind)),
  'spirit.wish.done': (s, e, g) => s.spiritWishDone?.(gardenState(g), feelingOfKind(e.kind)),
  'spirit.gift': (s, e, g) => s.spiritGift?.(gardenState(g)),
  'spirit.letter': (s, e, g) => s.spiritLetter?.(gardenState(g), e.about),
  'spirit.letters': (s, e) => s.spiritLetters?.(e.letters?.length ?? 1),
  'spirit.farewell.ask': (s, e, g) => s.spiritFarewellAsk?.(gardenState(g), e.feeling),
  'spirit.farewell': (s, e, g) => s.spiritFarewell?.(gardenState(g), e.feeling),
  'spirit.summon': (s, e) => s.spiritSummon?.(e.from),
  'spirit.out': (s, e, g) => s.spiritOut?.(gardenState(g), feelingOfKind(e.kind)),
  'spirit.spar.start': (s) => s.spiritSparStart?.(),
  'spirit.spar': (s, e, g) => s.spiritSpar?.(gardenState(g)),
  'decor.place': (s, e, g) => s.decorPlace?.(gardenState(g)),
  'decor.move': (s) => s.decorMove?.(),
  'decor.remove': (s) => s.decorRemove?.(),
  'decor.buy': (s, e, g) => s.decorBuy?.(gardenState(g)),
  'decor.get': (s, e, g) => (['shop', 'gift', 'farewell'].includes(e.from) ? null : s.decorGet?.(gardenState(g), !!e.first)), // (a buy, a gift and a farewell sound their own)
  'decor.refuse': (s) => s.decorRefuse?.(),
  'garden.prune': (s, e) => s.gardenPrune?.(e.n ?? 0),
  'garden.thorn': (s) => s.gardenThornGrow?.(),
  'garden.tend': (s, e, g) => s.gardenTend?.(gardenState(g)),
  'garden.harmony': (s, e, g) => s.gardenHarmony?.(gardenState(g), e.band, e.was),
  'alchemy.open': (s, e, g) => s.pressOpen?.(gardenState(g)),
  'alchemy.close': (s) => s.pressClose?.(),
  'alchemy.load': (s, e, g) => s.pressLoad?.(gardenState(g), e.count ?? 1),
  'alchemy.unload': (s, e) => s.pressUnload?.(e.count ?? 1),
  'alchemy.step': (s, e, g) => s.pressStep?.(gardenState(g), e.hue ?? 0),
  'alchemy.refuse': (s) => s.pressRefuse?.(),
  'alchemy.seasoned': (s, e, g) => s.alchemySeasoned?.(gardenState(g)),
  'spore.bed': (s) => s.sporeBedNew?.(),
  'spore.inoculate': (s, e, g) => s.sporeInoculate?.(gardenState(g), e.strain),
  'spore.set': (s, e, g) => s.sporeSet?.(gardenState(g), e.strain),
  'spore.back': (s) => s.sporeBack?.(),
  'spore.learn': (s, e, g) => s.sporeLearn?.(gardenState(g), e.strain),
  'myggdrasil.pick': (s, e, g) => s.myggPick?.(gardenState(g), e.n ?? 1),
  'garden.cascade': (s) => s.gardenCascade?.(),
  'garden.planetoid': (s, e, g) => s.gardenPlanetoidSet?.(gardenState(g)),
  'garden.digest': (s, e, g) => s.gardenDigest?.(gardenState(g)),
  // the god hand's powers, its mudras, the palm die thrown, the Dissonance Level, the catch and the bracelet (audio/godpowers.js)
  'god.gust': (s, e) => s.godGust?.(e.len, e.hit, e.moved, e.repeat),
  'god.slab': (s, e) => s.godSlab?.(e.moved, e.set),
  'god.portal': (s, e) => s.godPortal?.(e.len, e.repeat),
  'god.portal.pass': (s, e) => s.godPortalPass?.(e.what),
  'god.hasten': (s, e) => s.godHasten?.(e.stay, e.r, e.repeat),
  'god.fold': (s, e) => s.godFold?.(e.moved, e.side, e.repeat),
  'god.muster': (s, e) => s.godMuster?.(e.n, e.repeat),
  'god.muster.done': (s, e) => s.godMusterDone?.(e.moved),
  'god.herd': (s, e) => s.godHerd?.(e.n, e.repeat),
  'god.take': (s, e) => s.godTake?.(e.kind),
  'god.ward': (s, e, g) => s.godWard?.(e.r, e.repeat, g.music?.grid?.()),
  'god.stamp': (s, e) => s.godStamp?.(e.made, e.side, e.repeat),
  'god.totem': (s, e, g) => s.godTotem?.(e.feeling, e.repeat, g.music?.grid?.()),
  'god.setfast': (s, e) => s.godSetFast?.(e.chunks, e.forever, e.repeat),
  'god.transmute': (s, e) => s.godTransmute?.(e.feeling, e.r, e.repeat),
  'god.read': (s, e) => s.godRead?.(e.n),
  'god.strata': (s, e) => s.godStrata?.(e.len),
  'god.course': (s, e) => s.godCourse?.(e.steps),
  'hand.pose': (s, e, g) => s.handPoseShift?.(e.pose, e.why, g.music?.grid?.()),
  'palm.roll': (s, e) => s.palmRoll?.(e.face, e.sides, e.held),
  'god.dissonance': (s, e) => s.godDissonance?.(e.level),
  'god.rejection.answer': (s, e) => s.godRejectionAnswer?.(e.level, e.n),
  'god.rejection.beaten': (s, e, g) => s.godRejectionBeaten?.(g.music?.grid?.()),
  'catch.grab': (s, e) => s.handCatchGrab?.(e.cls, e.need),
  'catch.free': (s, e) => s.handCatchFree?.(e.why),
  'bracelet.set': (s, e) => s.braceletSet?.(e.charm),
  'bracelet.charm': (s, e) => s.braceletCharm?.(e.charm),
  // your seal, the parry's window, the World shells, the variant plays, Charybdis, the crossing's small moments (audio/seals.js)
  'seal.set': (s, e) => s.sealStamp?.(e.kind, !!e.first, e.seal?.outline, e.seal?.carving),
  'seal.carve': (s, e) => s.sealCarve?.(e.name, e.outline, e.carving),
  'seal.unset': (s, e) => s.sealLift?.(e.why),
  'parry.window': (s, e) => s.parryWindowTick?.(e.kind),
  'shell.draw': (s, e) => s.worldShellDraw?.(e.k, e.feeling),
  'shell.spring': (s) => s.worldSpring?.(),
  'shell.found': (s) => s.worldShellFound?.(),
  'psygun.flare': (s, e, g) => s.flareBurn?.(e.n, e.at ? g.listenerDistance?.(e.at) : undefined),
  'psygun.barrels': (s, e) => s.barrelsVolley?.(e.n),
  'psygun.pentacle': (s, e, g) => s.pentacleStar?.(e.n, e.at ? g.listenerDistance?.(e.at) : undefined),
  'charybdis.rise': (s, e, g) => s.charybdisRise?.(e.feel, g.music?.grid?.()),
  'charybdis.dive': (s, e, g) => s.charybdisDive?.(e.feel, g.music?.grid?.()),
  'charybdis.driven': (s, e, g) => s.charybdisDriven?.(e.feel, g.music?.grid?.()),
  'charybdis.felled': (s, e, g) => s.charybdisFelled?.(e.feel, g.music?.grid?.()),
  'rail.mine': (s, e, g) => s.railMineBurst?.(g.music?.grid?.()),
  'rail.hold': (s, e, g) => e.bars > 0 && s.railBossHold?.(e.bars, !!e.enraged, g.music?.grid?.()),
  'rail.bite': (s, e, g) => s.shoalBite?.(e.bites, g.music?.grid?.()),
  'rail.scatter': (s, e, g) => s.shoalScatter?.(g.music?.grid?.()),
  'sea.hull': (s, e) => s.seaHullHit?.(e.hull ?? 3), // (`hull`: the hits it can still bear)
  // the ship answering back (audio/seabattle.js): a broadside on the cue's next sixteenth, its heard moment told for the muzzles' flash
  'sea.broadside': (s, e, g) => { const at = s.seaBroadside?.(e.side ?? 1, e.guns ?? 4, g.music?.grid?.()); if (at != null) g.events.emit('sea.boom', { at: +at.toFixed(3), side: e.side ?? 1, by: 'courier' }); },
  'sea.broadside.dry': (s) => s.seaBroadsideDry?.(),
  'sea.mount': (s, e, g) => s.seaMount?.(e.tool, e.ok !== false, g.music?.grid?.()),
  'sea.mend': (s, e) => s.seaMend?.(e.hull ?? 3, e.of ?? 6),
  'sea.hull.broken': (s) => s.seaHullBroken?.(),
  'goal.done': (s, e) => s.goalDone?.(e.slot ?? 0, !!e.all), // (a goal of the game day's three done; all three, the Answer whole: audio/ui.js)
  'goals.set': (s) => s.goalsSet?.(),
  // the open sea (audio/opensea.js): the helm's wash and wind from boarding to mooring, and the voyage's moments
  'opensea.board': (s, e, g) => { s.openSeaBoard?.(); s.openSeaHelmStart?.(() => (g.opensea?.sailing ? { k: Math.abs(g.opensea.helm?.speed || 0) / 15 } : null)); },
  'opensea.moor': (s) => { s.openSeaHelmEnd?.(); s.openSeaMoor?.(); },
  'sea.chart': (s) => s.openSeaCharted?.(),
  'sea.find': (s, e) => s.openSeaFind?.(e.tier ?? 1),
  'sea.fix': (s, e) => s.openSeaFix?.(e.ok !== false),
  'sea.drift': (s) => s.openSeaDrift?.(),
  'sea.dock': (s) => { REPORT.n = 0; s.openSeaDock?.(); },
  'sea.report': (s, e) => s.openSeaReport?.(REPORT.n++, e.tier ?? 1), // (a coin a find, each a step up: the dock's count)
  'sea.tow': (s) => s.openSeaTow?.(),
  'sea.fuel.low': (s) => s.openSeaFuelLow?.(),
  'sea.secret': (s) => s.openSeaSecret?.(),
  'sea.pair.half': (s) => s.openSeaPairHalf?.(),
  'sea.pair': (s) => s.openSeaPair?.(),
  'sea.lineup': (s) => s.openSeaLineup?.(),
  'sea.stele': (s) => s.openSeaStele?.(),
  'sea.dig': (s, e) => s.seaDig?.(e.tier, e.cubes), // (a cache dug up on an islet: audio/treasure.js)
  'casino.howto': (s) => s.casinoPage?.(),
  'casino.result': (s, e) => s.casinoResult?.(!!e.won),
  'race.escape.wake': (s) => s.escapeWake?.(),
  'race.escape.caught': (s) => s.escapeCaught?.(),
  'race.start': (s, e) => { s._place = null; s.raceWet?.(e.aspect === 'grief' || e.aspect === 'mirth'); }, // (rain: wet sand under the board)
  'race.end': (s) => s.raceWet?.(false),
  'skiff.landhard': (s) => s.skiffLandHard?.(),
  'skiff.grind': (s) => s.skiffGrind?.(),
  'skiff.grind.end': (s, e) => s.skiffGrindEnd?.(e.why || 'end', e.metres),
  'skiff.ring': (s, e) => s.skiffRing?.(e.ring),
  'race.back': (s) => { s.skiffGrindEnd?.(null); s.raceBack?.(); },
  'skiff.bail': (s) => s.skiffGrindEnd?.(null), // (a bail mid-grind: the scrape stops; the bail's own sounds are the skiff's)
  'wisp.notice': (s) => s.wispNotice?.(), // (the Lantern Wisp: audio/wisp.js)
  'wisp.cast': (s) => s.wispCast?.(),
  'wisp.hit': (s) => s.wispHit?.(),
  'wisp.burst': (s) => s.wispOut?.(),
  'feeling.wake': (s, e, g) => { if (e.by === 'courier') g.music?.awaken?.(e.feeling); }, // (the awakening's phrase: music/awaken.js)
  'feeling.drink': (s, e) => { if (e.by === 'courier') s.feelingDrink?.(e.aspect); }, // (the drunk feeling changed: audio/vessel.js)
  'rail.lock': (s, e, g) => s.railLock?.(e.n, g.music?.grid?.()),
  'rail.tell': (s, e, g) => s.railTell?.(g.music?.clock?.(), e.bar, e.beat, !!e.outlined, e.kind, e.form), // (a foe's tell, landing on its shot's beat as heard: audio/rail.js)
  'rail.form': (s) => s.mastFold?.(0.6), // (the mast folding and standing again on a form flip: audio/rail.js)
  'rail.glance': (s) => s.railGlance?.(), // (a blow turned aside; a grappler taking hold and shaken off: audio/rail.js)
  'rail.latch': (s) => s.railLatch?.(),
  'rail.unlatch': (s) => s.railUnlatch?.(),
  'rail.down': (s, e, g) => s.railDown?.(e.cls, g.music?.grid?.()),
  // the crossing to the genre's standards (RAIL-STANDARDS.md 1, 4, 6; Petra emits): a lock dropped, a part's crack, a hazard's whoosh on its
  // side, a ring's chime up the scale (the five of a turn a chord), a medal, and the sting under a boss's fall
  'rail.lock.drop': (s, e, g) => s.railLockDrop?.(e.n ?? 0, g.music?.grid?.()),
  'rail.part': (s, e, g) => s.railPartCrack?.(g.music?.grid?.()),
  'rail.hazard': (s, e, g) => e.passed !== 'hit' && e.near !== false && s.railHazard?.(e.kind, e.passed === 'through' ? 0 : Math.sign(e.side ?? e.lane ?? 0), nearK(e.near), g.music?.grid?.()),
  'rail.ring': (s, e, g) => { const now = performance.now(); RING.n = now - RING.at < 6000 ? RING.n + 1 : 0; RING.at = now; s.railRing?.(e.all ? 4 : Math.min(4, RING.n), !!e.all, g.music?.grid?.()); if (e.all) RING.n = -1; },
  'rail.leg.end': (s, e, g) => e.medal && s.railMedal?.(g.music?.grid?.()),
  'rail.boss.fall': (s) => s.railBossFall?.(),
  'rail.end': (s, e) => e.by === 'courier' && s.railBossFall?.(), // (a set piece's boss beaten; throttled, so rail.boss.fall and this sound once)
  'spirit.bind': (s, e, g) => s.catchSting?.(e.from, g.music?.grid?.()), // (a Figment caught, by the coffin or the hand: audio/catch.js)
  // the garden's spirits and the hand's clay (audio/spirits.js): their voices say the moment; their feeling bends the leap
  'spirit.feed': (s, e) => { s.spiritVoice?.('eat', e); setTimeout(() => s.spiritVoice?.('happy', e), 420); },
  'spirit.drill': (s, e) => s.spiritVoice?.('effort', e),
  'spirit.mature': (s, e) => s.spiritVoice?.('cheer', e),
  'spirit.merge': (s, e) => { s.spiritVoice?.('call', e); setTimeout(() => s.spiritVoice?.('cheer', e), 350); },
  'spirit.release': (s, e) => s.spiritVoice?.('sad', e),
  'spirit.visit': (s, e) => s.spiritVoice?.('call', e),
  'spirit.pet': (s, e) => s.spiritVoice?.('happy', e),
  'spirit.flick': (s, e) => s.spiritVoice?.('hurt', e),
  'garden.sculpt': (s, e) => s.sculpt?.(e.how || 'press'),
  // the Spirit Garden's own sound (GARDEN-COZY.md B; audio/garden.js): its bed from coming in to going out, and tending on the cue's beat
  'garden.enter': (s, e, g) => { s.gardenEnter?.(); s.gardenStart?.(() => gardenState(g)); },
  'garden.leave': (s) => { s.gardenEnd?.(); s.gardenLeave?.(); },
  'garden.water': (s, e, g) => s.gardenWater?.(gardenState(g)),
  'garden.plant': (s, e, g) => s.gardenPlant?.(gardenState(g)),
  'garden.harvest': (s, e, g) => s.gardenHarvest?.(gardenState(g), e.count ?? 1),
  'garden.collect': (s, e, g) => s.gardenCollect?.(gardenState(g)),
  'garden.place': (s, e, g) => s.gardenPlace?.(gardenState(g)),
  'garden.paint': (s, e, g) => s.gardenPaint?.(gardenState(g)),
  'garden.planetoid.buy': (s, e, g) => s.gardenBuy?.(gardenState(g)),
  'garden.upgrade': (s, e, g) => s.gardenUpgrade?.(gardenState(g)),
  'spirit.race.start': (s) => s.gardenRaceStart?.(),
  'spirit.race': (s, e, g) => s.gardenRace?.(gardenState(g)),
  'spirit.spar.bump': (s) => s.gardenBump?.(),
  'spirit.name': (s, e) => s.spiritVoice?.('cheer', e),
  'alchemy.press': (s) => s.gardenPress?.(),
  'alchemy.fire': (s, e, g) => s.gardenFire?.(gardenState(g), !!e.true),
  // the Mycelium (docs/plans/MYCELIUM.md: audio/mycelium.js)
  'spore.harvest': (s, e) => s.sporeHarvest?.(e.strain, e.up),
  'myggdrasil.feed': (s) => s.myggFeed?.(),
  'myggdrasil.fruit': (s, e) => s.myggFruit?.(e.n),
  'myggdrasil.girth': (s, e) => s.myggCap?.(e.caps),
  'myggdrasil.hang': (s, e) => s.myggHang?.(e.arcana),
  'keepsake.pot': (s, e) => s.keepsakeSong?.({ feeling: e.feeling || feelingOfKind(e.kind) }, 1),
};

export function hearEvents(game, sfx) {
  for (const [name, fn] of Object.entries(RULES)) game.events.on(name, (e) => fn(sfx, e, game));
  installHaptics(game);
  installAudioHealth(game, sfx); // (the mixer watched for falling behind, into the field report: audio/health.js)
}
