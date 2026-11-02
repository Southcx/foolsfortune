// ---------------------------------------------------------------------------------------
// THE MECH'S READOUT, A PLACEHOLDER (docs/plans/MECHS.md 4.4, 8: Calissa's to build as an Eva-style plug-suit HUD in the Clay dress):
// a small plain panel while the Pneuka Jar is sealed in a piloted mech, saying what is: sync as a percent, the battery and its seconds
// left at the draw now, CABLE or OFF CABLE, each region's crack, and the straw giant's barrier and stagger when it is near, and the lane's smash challenge under way (challenges.js). It never
// narrates (the log does: Dovina's rules on the mech's events). Its classes are `mk-readout` and `mk-ro-*` for Calissa's dress.
//
// Prior art: Evangelion's entry-plug displays (sync ratio, the internal battery's countdown, the umbilical's state), Armored Core's
// AP and energy gauges, the house's own DOM readouts (ui/railreadout.js). It stands bottom right, left of the Lachrimeter's tube.
//
//   const R = new MechReadout(hangar)   R.update(dt, shown)   R.hide()   READOUT
// ---------------------------------------------------------------------------------------
import { regionsOf } from '../../progress/combat/vessel.js';
import { STAGGER, ENERGY } from '../../progress/mechs/rules.js';

/** How often it is redrawn (real s), and how near (m) the giant must be for its line. */
export const READOUT = { every: 0.1, giantNear: 200 };
const CSS = `
.mk-readout{position:fixed;right:130px;bottom:12px;z-index:3;min-width:190px;padding:8px 10px;background:rgba(20,12,8,.72);border:1px solid #c8925e;border-radius:6px;
  color:#f2e2c8;font:12px/1.45 ui-monospace,monospace;pointer-events:none;white-space:pre}
.mk-readout .mk-ro-low{color:#ff8a6a}.mk-readout .mk-ro-ok{color:#9fe4ff}
`;
const pct = (v) => `${Math.round(v * 100)}%`;
const clock = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '--:--');

export class MechReadout {
  constructor(hangar) { this.hangar = hangar; this.el = null; this.t = 0; }
  ensure() {
    if (this.el) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.className = 'mk-readout'; this.el.style.display = 'none'; document.body.appendChild(this.el);
  }
  hide() { if (this.el) this.el.style.display = 'none'; }

  update(dt, shown) {
    if (!shown) { this.hide(); return; }
    this.ensure(); this.el.style.display = '';
    if ((this.t -= dt) > 0) return; this.t = READOUT.every;
    const M = this.hangar.pilot, S = M.stats, V = this.hangar.state.vessel, Gi = this.hangar.giant;
    const net = M.netKW ?? S.draw, left = net > 0 ? M.battery / net : Infinity, low = M.battery < S.capacity * ENERGY.low;
    const lines = [
      `SYNC     ${pct(M.sync)}${M.berserk > 0 ? '  BERSERK' : ''}`,
      `BATTERY  ${(M.battery / 1000).toFixed(1)} MJ  <span class="${low ? 'mk-ro-low' : 'mk-ro-ok'}">${net > 0 ? clock(left) : 'FILLING'}</span>`,
      `DRAW     ${Math.round(net)} kW`,
      `${M.cable !== null ? '<span class="mk-ro-ok">CABLE</span>' : '<span class="mk-ro-low">OFF CABLE</span>'}`,
    ];
    const R = regionsOf('mech').map((r) => `${r.toUpperCase().padEnd(5)}${this.hangar.state.broken(r) ? 'BROKE' : pct(V.crack[r] || 0).padStart(5)}`);
    for (let i = 0; i < R.length; i += 2) lines.push(`${R[i]}   ${R[i + 1] ?? ''}`); // (the regions two to a line: the panel kept clear of the log and the goals)
    if (Gi?.c && Math.hypot(Gi.pos.x - M.pos.x, Gi.pos.z - M.pos.z) < READOUT.giantNear) {
      const B = Gi.barrier, s = Gi.stagger;
      lines.push('', `GIANT    ${Gi.down > 0 ? `DOWN ${Math.ceil(Gi.down)}s` : Gi.awake ? 'AWAKE' : 'WAITING'}`,
        `BARRIER  ${B.downT > 0 ? `DOWN ${Math.ceil(B.downT)}s` : pct(B.up)}`,
        `STAGGER  ${s.staggerT > 0 ? 'STAGGERED' : pct(s.v / STAGGER.full)}`);
    }
    const Ch = this.hangar.challenges?.lines(); // (the smash challenge running, or the lectern's offer when the frame stands at it: challenges.js)
    if (Ch) lines.push('', ...Ch);
    this.el.innerHTML = lines.join('\n');
  }
}
