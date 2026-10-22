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
import { gardenState } from './garden.js';
import { feelingOfKind } from './mycelium.js';

const CYL = { autoAt: 0 }; // (when the cylinder last turned itself)
const REPORT = { n: 0 }; // (reports paid at this dock: a coin a step up)
const RING = { n: -1, at: 0 }; // (rings threaded in this turn: a chime a degree up each)
const nearK = (n) => (n === true || n == null ? 0.8 : n > 1 ? Math.max(0.2, 1 - n / 8) : n); // (`near`: a flag, 0..1, or metres)
const CEREMONY = { heard: false }; // (a score ceremony seen this session: the table view now paces the count)
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
  'chat.line': (s, e) => s.chatMotif?.(String(e.from || e.sibling || 'guest').toLowerCase()), // (the chat's contract is Dovina's: a line from a session or the owner)
  'guest.say': (s) => s.chatMotif?.('guest'),
  'guest.join': (s, e, g) => s.guestArrive?.(!!g.realm?.active),
  'guest.leave': (s, e, g) => s.guestArrive?.(!!g.realm?.active, true),
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
}
