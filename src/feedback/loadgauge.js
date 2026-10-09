// ---------------------------------------------------------------------------------------
// THE LOAD'S GAUGES: nothing spends in silence (docs/plans/LACHRYMA-LOOP.md section 4). What the Soul Brush's load spends is shown where
// you are looking when you spend it:
//   - THE ARC: a thin arc beside the crosshair, the Lachrymato Bottle's fill (else the pool's, bottle-less), while you paint, mop or a jet
//     runs; it lingers a moment after, and flashes when it runs dry (the log's "The bristles run dry." is the load's own).
//   - THE HOVER'S RING at the feet, draining over its 1.6 s; THE ROCKET'S RING filling over its 0.55 s gather (world marks: no words).
// The looks are stand-ins, Calissa's to make; the numbers are the load's own (tools/soulbrush/load.js, courier/moves/jets.js).
//
// Prior art: Super Mario Sunshine's water gauge (FLUDD's tank, always shown while it is in use) and its nozzles' timers; Splatoon's ink
// tank on the back and its reticle's ink ring; Zelda: Breath of the Wild's stamina wheel beside the player (shown only while it moves).
//
//   game.loadGauge = new LoadGauge(game)   .update(raw) (once a frame, after the tools)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BOTTLES } from '../progress/brushload.js';

const LINGER = 0.8, FLASH = 0.6, R = 30, SWEEP = 100; // (real seconds shown after; flash length; the arc's radius in px and its degrees)
const arcPath = (frac) => {
  const a0 = (-SWEEP / 2) * Math.PI / 180, a1 = a0 + SWEEP * Math.max(0.001, Math.min(1, frac)) * Math.PI / 180, p = (a) => `${50 + Math.sin(a) * R} ${50 - Math.cos(a) * R}`;
  return `M ${p(a0)} A ${R} ${R} 0 0 1 ${p(a1)}`;
};

export class LoadGauge {
  constructor(game) {
    this.game = game; this.show = 0; this.flash = 0; this.lastHeld = null;
    const el = (this.el = document.createElement('div'));
    el.id = 'loadgauge';
    el.style.cssText = 'position:fixed;left:50%;top:50%;width:100px;height:100px;margin:-50px 0 0 -50px;pointer-events:none;z-index:5;opacity:0;transform:rotate(90deg)';
    el.innerHTML = `<svg viewBox="0 0 100 100" style="width:100%;height:100%"><path class="bg" d="${arcPath(1)}" style="fill:none;stroke:rgba(28,13,8,.55);stroke-width:5;stroke-linecap:round"/><path class="fg" d="" style="fill:none;stroke:#7fd8ff;stroke-width:3;stroke-linecap:round"/></svg>`;
    document.body.appendChild(el);
    this.fg = el.querySelector('.fg');
    // the jets' rings at the feet: one ring, drawn as much of a turn as is left (hover) or gathered (rocket)
    const geo = new THREE.RingGeometry(0.55, 0.68, 64, 1);
    this.ring = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; this.ring.renderOrder = 30; this.ring.name = 'jet-ring';
    game.scene?.add(this.ring);
  }

  /** What is being spent now, and from what: { frac (0..1 of the bottle, else the pool), active, empty }. */
  read() {
    const g = this.game, L = g.player?.techs?.get?.('soulbrush')?.load, a = g.player?.techs?.active;
    const jet = a && (a.id === 'hover' || a.id === 'rocket' || a.id === 'skim') ? a : null;
    const b = L?.bottle, frac = b ? L.held / BOTTLES[b].capacity : g.lachryma ? g.lachryma.fraction : 0;
    return { frac, active: !!(L?.busy || jet), jet, empty: frac < 0.02 };
  }

  update(raw) {
    const r = this.read(), P = this.game.player;
    if (r.active) this.show = LINGER; else this.show = Math.max(0, this.show - raw);
    if (r.active && r.empty && this.flash <= 0) this.flash = FLASH; else this.flash = Math.max(0, this.flash - raw);
    const on = this.show > 0 && !this.game.god?.active;
    this.el.style.opacity = on ? Math.min(1, this.show / 0.25) : 0;
    if (on) {
      this.fg.setAttribute('d', arcPath(r.frac));
      this.fg.style.stroke = this.flash > 0 && Math.floor(this.flash * 10) % 2 ? '#ff6a4a' : '#7fd8ff';
    }
    // the hover's and the rocket's rings
    const j = r.jet; let k = -1;
    if (j?.id === 'hover') k = 1 - Math.min(1, j.t / (j.cfg?.time || 1.6));
    else if (j?.id === 'rocket') k = Math.min(1, (j.gather || 0) / (j.cfg?.charge || 0.55));
    this.ring.visible = k >= 0 && !!P;
    if (this.ring.visible) {
      this.ring.position.set(P.renderPos.x, P.renderPos.y + 0.05, P.renderPos.z);
      this.ring.geometry.setDrawRange(0, 6 * Math.max(1, Math.round(64 * k)));
    }
  }
}
