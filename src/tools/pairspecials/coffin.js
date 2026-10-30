// ---------------------------------------------------------------------------------------
// THE PAIR SPECIALS FED THROUGH THE LOCKHEART (tools/pairspecials.js is the gate; TOOLS-TOGETHER.md 8; the rules and numbers Dovina's,
// progress/toolpairs.js SPECIAL_PLAY), with the Lockheart in hand:
//   10 Turn of Weather  Dreamvane sub: the wheel of odds turns the weather where the lure lies (the fork, else where you stand), `radius`,
//                       for `hours` game hours, by the wheel's outcome rank / 4: a jackpot a full spell turned fair, a dud nothing (the
//                       World shells' patch, tools/psygun/worlddraw.js thinAt)
//   20 Last Call        Crucibelle sub: the lent toll with the coffin full bursts its fill as a wave, `radius`, its power the fill x `per`;
//                       the coffin is empty after (no key and no wheel)
//
// Prior art: Final Fantasy's Weather Change and Ōkami's Sunrise (the sky turned by a hand), Pandora's box; the shockwave release of every
// charge mechanic (Kirby's Inhale spat back out).
//
//   coffinSpecials(PS) -> part { lend(tool), open(e), outcome(e) }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { GAME_HOUR } from '../psygun/worlddraw.js';

const _a = new THREE.Vector3();

export function coffinSpecials(PS) {
  const g = PS.game, P = () => PS.play;
  const LH = () => g.techs?.get?.('lockheart');
  let turnable = false; // (an open's first outcome turns the weather; its echoes and twin spins do not again)
  return {
    open() { turnable = PS.live(P().turnOfWeather.n); },
    /** The wheel landed (lockheart.outcome { rank }): the weather where the lure lies turned by rank / 4. */
    outcome(e) {
      if (!turnable || !PS.live(P().turnOfWeather.n)) return;
      turnable = false;
      const W = P().turnOfWeather, take = Math.max(0, Math.min(4, e.rank ?? 0)) / 4; if (!(take > 0)) return;
      const F = g.techs?.get?.('dreamvane')?.fork, at = (F && F.state !== 'heel' ? F.pos : g.player.pos).clone();
      g.worldDraw?.thinAt?.(at, W.radius, take, GAME_HOUR * W.hours); g.worldLooks?.fair?.(at, W.radius); // (weather.here asks worldDraw.weatherK)
      PS.said(W.n, { take });
    },
    lend(tool) {
      const L = LH(), C = P().lastCall;
      if (tool !== 'crucibelle' || !PS.live(C.n) || !L?.full) return;
      const power = L.charge * C.per, at = g.player.pos;
      L.charge = 0; L.save?.(); // (the coffin emptied, as an opening empties it)
      let n = 0;
      for (const c of g.creatures?.near?.(at, C.radius) || []) {
        if (!c.alive || c.ally) continue;
        const d = _a.set(c.pos.x - at.x, 0, c.pos.z - at.z); if (d.lengthSq() < 1e-4) d.set(0, 0, 1);
        g.creatures.strike(c, c.pos.clone(), d.normalize().clone(), power, 'lockheart', 'courier'); n++;
      }
      g.ai?.stimuli?.emit('noise', at, { radius: 30, strength: 1, by: 'courier' });
      PS.said(C.n, { n, power: +power.toFixed(1) });
    },
  };
}
