// ---------------------------------------------------------------------------------------
// WATER'S FEEDBACK: what a swim looks like on the water and on the Courier (the owner, R46: "there needs to be more visual feedback when
// swimming around"; docs/plans/SUNSHINE-SYSTEMS.md phase 1). It takes every disturbance of a water surface (`game.water.onDisturb`) and:
//
//   RINGS        knocks it into the ripple tank (vfx/ripples.js), which the water's shader reads; the wake's V is the rings' own
//   THE CROWN    a dive or a belly-flop throws a crown: a ring of drops flung up and out, a column in the middle, the heavy ones last
//                (bigger than the stroke's splash in courier/moves/swim.js, which it adds to)
//   DRIPS        for a few real seconds after leaving the water the Courier drips: drops from all over the body, fewer as they dry
//                (Sunshine's wet Mario); on Lachryma, ink drops
//
// Prior art: Super Mario Sunshine (the rings round Mario, the dive's crown, the wet Mario dripping as he climbs out), Wind Waker's
// splashes, and the Worthington crown of a drop's impact (the classic photographs: a thin rim flung up and breaking into droplets).
//
//   game.waterFx = new WaterFx(game, renderer)   .update(rawDt, camera)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RippleTank } from './ripples.js';

const WATER = new THREE.Color(0xe2f2f0), DRIP = new THREE.Color(0x9ccfdc), INK = new THREE.Color(0x1a1420); // (a drip a little cooler than a splash: it shows against the sand)
const DRY = 4; // (real seconds to dry)
const _v = new THREE.Vector3(), _p = new THREE.Vector3();

export class WaterFx {
  constructor(game, renderer) {
    this.game = game; this.tank = new RippleTank(renderer);
    this.wet = 0; this.wetInk = false; this.dripAcc = 0;
    const W = game.water;
    if (W) W.onDisturb = (d) => { this.tank.disturb(d); if (d.kind === 'dive' || d.kind === 'land') this.crown(d); };
  }

  /** A dive's crown: a rim of drops flung up and out, a column in the middle. */
  crown(d) {
    const fx = this.game.fx; if (!fx) return;
    const ink = this.game.water.at(d.x, d.y - 0.1, d.z)?.kind === 'lachryma', col = ink ? INK : WATER, k = 0.5 + d.s;
    const n = Math.round(28 * k);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.2, r = 0.35 + Math.random() * 0.25;
      _p.set(d.x + Math.cos(a) * r, d.y + 0.05, d.z + Math.sin(a) * r);
      _v.set(Math.cos(a) * (1.6 + Math.random()), 3 + Math.random() * 2.5 * k, Math.sin(a) * (1.6 + Math.random()));
      fx.alpha.emit({ pos: _p.clone(), vel: _v.clone(), life: 0.7 + Math.random() * 0.3, size: 0.11, sizeEnd: 0.04, color: col, alpha: 0.75, drag: 0.8, gravity: 9.8 });
    }
    for (let i = 0; i < Math.round(12 * k); i++) { // (the column: up the middle, slower to fall back)
      _p.set(d.x + (Math.random() - 0.5) * 0.2, d.y + 0.1, d.z + (Math.random() - 0.5) * 0.2);
      _v.set((Math.random() - 0.5) * 0.6, 4.5 + Math.random() * 2.5 * k, (Math.random() - 0.5) * 0.6);
      fx.alpha.emit({ pos: _p.clone(), vel: _v.clone(), life: 0.9 + Math.random() * 0.3, size: 0.14, sizeEnd: 0.05, color: col, alpha: 0.7, drag: 0.6, gravity: 9.8 });
    }
  }

  update(raw, camera) {
    const g = this.game, W = g.water, P = g.player; if (!W || !P) return;
    // the tank runs on the water nearest the eye (Lachryma's rings are slower)
    const eye = camera?.position || P.pos, near = W.volumes.find((w) => eye.x > w.x0 && eye.x < w.x1 && eye.z > w.z0 && eye.z < w.z1);
    this.tank.update(raw, eye, { lachryma: near?.kind === 'lachryma' });
    // wet: in the water (to the chest), then drying
    const v = W.at(P.pos.x, P.pos.y + 0.6, P.pos.z);
    if (v) { this.wet = 1; this.wetInk = v.kind === 'lachryma'; return; }
    if (this.wet <= 0) return;
    this.wet = Math.max(0, this.wet - raw / DRY);
    const fx = g.fx; if (!fx) return;
    this.dripAcc += raw * 26 * this.wet * this.wet; // (a drip every few hundredths at first, fewer as they dry)
    while (this.dripAcc >= 1) {
      this.dripAcc -= 1;
      const a = Math.random() * Math.PI * 2, h = 0.25 + Math.random() * 1.2, r = 0.18 + 0.12 * Math.random();
      _p.set(P.renderPos.x + Math.cos(a) * r, P.renderPos.y + h, P.renderPos.z + Math.sin(a) * r);
      fx.alpha.emit({ pos: _p.clone(), vel: new THREE.Vector3(P.vel.x * 0.3, -0.4, P.vel.z * 0.3), life: 0.45, size: 0.07, sizeEnd: 0.04, color: this.wetInk ? INK : DRIP, alpha: 0.85, gravity: 9.8 });
    }
  }
}
