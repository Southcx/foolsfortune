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
import { feelingOfKind } from './mycelium.js';

const CEREMONY = { heard: false }; // (a score ceremony seen this session: the table view now paces the count)
const RULES = {
  'dreamvane.survey': (s) => s.surveySwing?.(), // (the heel going up; the blow's own sound is cartography's survey)
  'psygun.change': (s) => s.gunSwap?.(), // (shells.js)
  'psygun.chamber': (s) => s.chamberClick?.(),
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
  'table.ceremony.beat': (s, e) => (e.kind === 'tick' ? s.casinoTick?.(e.k ?? 0) : e.kind === 'mult' ? s.casinoMult?.(e.n ?? 2) : e.kind === 'reel' ? s.casinoReel?.(e.dur)
    : e.kind === 'flourish' ? s.casinoFlourish?.(e.tier ?? 1) : null),
  'casino.play': (s, e) => (e.what === 'hand' && e.steps?.length ? void setTimeout(() => CEREMONY.heard || s.casinoCount?.(e.steps, e.tier ?? 1), 150) : e.what === 'nova' ? s.casinoNova?.()
    : e.what === 'callout' ? s.casinoCall?.(!!e.bluff) : s.casinoPlay?.(e.what)),
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
  'rail.down': (s, e, g) => s.railDown?.(e.cls, g.music?.grid?.()),
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
