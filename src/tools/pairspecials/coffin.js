// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE LOCKHEART (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8), with the Lockheart in hand:
//   10 Turn of Weather  Dreamvane sub: the wheel of odds spun turns the weather where you stand fair for a game hour, wider the fuller
//                       the coffin was (the World shells' Calm's own fair patch: tools/psygun/worlddraw.js)
//   20 Last Call        Crucibelle sub: the lent toll with the coffin full opens it with no key and no wheel: all it drank bursts out
//                       as a wave round you, as hard as the coffin was full
// The numbers are placeholders with their reasons (Petra's), until Dovina's rows (progress/toolpairs.js SPECIAL_PLAY) take their place.
//
// Prior art: Final Fantasy's Weather Change and Ōkami's Sunrise (the sky turned by a hand), Pandora's box, a censer swung out; the
// shockwave release of every charge mechanic (Mega Man's charge shot, Kirby's Inhale spat back out).
//
//   coffinSpecials(PS) -> part { lend(tool), open(e) }   COFFIN_PLAY
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GAME_HOUR } from '../psygun/worlddraw.js';

/** The placeholders, each against a number the game already has. */
export const COFFIN_PLAY = {
  // Turn of Weather: 12 m (the World shells' draw reach, Calm's patch) at a coffin just full, x 0.8 .. 1.6 by its fill as the
  // outcomes' own reach is; for a game hour (Calm's)
  weather: { n: 10, r: 12 },
  // Last Call: a wave of 7 m at a coffin just full (the outcomes' 6 m reach and a step), x 0.8 .. 1.6 by its fill; power 2 (the flail's
  // last blow is 1.8) times the fill, a daze of 0.8 real s (the toll's own 0.22 x its fever's most)
  last: { n: 20, r: 7, power: 2, stun: 0.8 },
};
const _a = new THREE.Vector3();

export function coffinSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  const LH = () => g.techs?.get?.('lockheart');
  return {
    /** The wheel spun (lockheart.open): the weather where you stand turned fair, for a game hour. */
    open(e) {
      if (!PS.live(P().weather.n)) return;
      const r = P().weather.r * (0.8 + 0.4 * Math.min(2, e.power ?? 1)), at = g.player.pos.clone();
      g.worldDraw?.fair?.(at, r, GAME_HOUR); g.worldLooks?.fair?.(at, r, GAME_HOUR); // (the weather's strength taken there: weather.here asks worldDraw.weatherK)
      PS.said(P().weather.n, { r: Math.round(r) });
    },
    lend(tool) {
      const L = LH();
      if (tool !== 'crucibelle' || !PS.live(P().last.n) || !L?.full) return;
      const C = P().last, power = Math.min(2, L.charge / L.fill), r = C.r * (0.8 + 0.4 * power), at = g.player.pos;
      L.charge = 0; L.pushed = false; L.save?.(); // (the coffin emptied, as an opening empties it)
      let n = 0;
      for (const c of g.creatures?.near?.(at, r) || []) {
        if (!c.alive || c.ally) continue;
        const d = _a.set(c.pos.x - at.x, 0, c.pos.z - at.z); if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
        g.creatures.strike(c, c.pos.clone(), d.normalize().clone(), C.power * power, 'lockheart', 'courier');
        g.stun?.add(c, C.stun, { by: 'courier', cause: 'lockheart' }); n++;
      }
      g.ai?.stimuli?.emit('noise', at, { radius: 30, strength: 1, by: 'courier' });
      PS.said(C.n, { n, power: +power.toFixed(2) });
    },
  };
}
