// ---------------------------------------------------------------------------------------
// THE MECH'S READOUT, ITS READING (docs/plans/MECHS.md 4.4, 8.2): while the Pneuka Jar is sealed in a piloted mech, what is read off the
// pilot, the frame and the straw giant into one plain state, handed to its look (Calissa's entry-plug HUD in the Clay dress,
// ui/mechs/pilotreadout.js): sync and its ceiling, berserk, the battery and its seconds left at the draw now, CABLE or OFF CABLE, each
// region's crack, and the giant's state, barrier and stagger when it is near. It never narrates (the log does: Dovina's rules on the
// mech's events). The hangar's other page, the assembly, is dressed from here too (ui/mechs/assemblylook.js), once.
//
// Prior art: Evangelion's entry-plug displays (sync ratio, the internal battery's countdown, the umbilical's state), Armored Core's
// AP and energy gauges, the house's own DOM readouts (ui/railreadout.js).
//
//   const R = new MechReadout(hangar)   R.update(dt, shown)   R.hide()   R.read() -> state   READOUT
// ---------------------------------------------------------------------------------------
import { regionsOf } from '../../progress/combat/vessel.js';
import { STAGGER, ENERGY, BERSERK } from '../../progress/mechs/rules.js';
import { PilotReadout } from '../../ui/mechs/pilotreadout.js';
import { installAssemblyLook } from '../../ui/mechs/assemblylook.js';

/** How often it is redrawn (real s), and how near (m) the giant must be for its line. */
export const READOUT = { every: 0.1, giantNear: 200 };

export class MechReadout {
  constructor(hangar) { this.hangar = hangar; this.view = new PilotReadout(hangar.game); this.t = 0; installAssemblyLook(hangar.game); }
  hide() { this.view.hide(); this.t = 0; }

  update(dt, shown) {
    if (!shown) { this.hide(); return; }
    if ((this.t -= dt) > 0) return; this.t = READOUT.every;
    this.view.draw(this.read());
  }

  /** The state the look draws (pilotreadout.js's header). */
  read() {
    const H = this.hangar, M = H.pilot, S = M.stats, V = H.state.vessel, Gi = H.giant;
    const net = M.netKW ?? S.draw, left = net > 0 ? M.battery / net : Infinity;
    const st = {
      sync: M.sync, ceiling: M.ceiling?.() ?? 1, berserkAt: BERSERK.sync, berserk: M.berserk || 0,
      battery: M.battery, capacity: S.capacity, low: M.battery < S.capacity * ENERGY.low, net, left, cable: M.cable !== null,
      regions: regionsOf('mech').map((r) => ({ id: r, k: V.crack[r] || 0, broke: !!H.state.broken(r) })), giant: null,
    };
    if (Gi?.c && Math.hypot(Gi.pos.x - M.pos.x, Gi.pos.z - M.pos.z) < READOUT.giantNear) {
      const B = Gi.barrier, s = Gi.stagger;
      st.giant = { word: Gi.down > 0 ? `DOWN ${Math.ceil(Gi.down)}` : Gi.awake ? 'AWAKE' : 'WAITING', barrier: B.downT > 0 ? 0 : B.up,
        barrierDown: Number.isFinite(B.downT) ? B.downT : 0, stagger: Math.min(1, s.v / STAGGER.full), staggered: s.staggerT > 0 };
    }
    return st;
  }
}
