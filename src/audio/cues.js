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
  'skiff.bail': (s, e) => s.bailTumble?.(e.speed), // (the tumble after the skiff's own thunk)
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
