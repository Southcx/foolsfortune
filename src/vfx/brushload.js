// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S LOAD, seen (the owner, 2026-10-06; docs/plans/SUNSHINE-SYSTEMS.md section 4): how the brush reads in its two modes,
// and the Brush Slide on wet or painted ground. Petra's mechanics drive it each frame; nothing here decides anything.
//
//   SATURATE   while LMB is held the bristles fill over the psygun's full charge (0.85 real s): the ink creeps up the tuft from the
//              point (the model's own setInk), and drops of Lachryma are drawn up into it from below, faster as it fills
//   PAINT      then it sprays OUT: a cone of drops from the point along the aim, 7 m of throw, ink with the film of the feeling it
//              lays (the bottle's grade); the tuft stays dark and glossy
//   MOP        then it drinks IN: a stream of drops spiralling from what it drinks (a stain, a puddle, a coated folk, within 2.4 m)
//              into the point; the tuft is pale and wrung between drinks, darkening as it drinks
//   THE SLIDE  the Brush Slide on wet or painted ground: twin rooster tails of spray from the feet, and the water's rings where it
//              is water (game.water.disturb)
//
// Prior art: Super Mario Sunshine's FLUDD (the spray's cone and its rooster-tail slide on wet ground), Splatoon's charger (a weapon
// that fills before it fires, its ink creeping up the barrel), and Luigi's Mansion's Poltergust (a stream drawn spiralling into the
// nozzle: what a vacuum looks like when the air is visible).
//
//   const L = new BrushLoad(game)   L.update(rawDt, { model, mode: 'paint' | 'mop', saturate: 0..1, working: bool, aim, from, feeling })
//   L.slide(rawDt, { pos, vel, surface: 'water' | 'paint' | null, feeling })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from './weather.js';

const INK = new THREE.Color(0x15101c), WATER = new THREE.Color(0xd8eeee);
const _tip = new THREE.Vector3(), _v = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color(), _s = new THREE.Vector3();

export class BrushLoad {
  constructor(game) { this.game = game; this.acc = 0; this.sacc = 0; this.ink = 0; this.t = 0; }

  /** A drop's colour: ink, now and then the feeling's film in it (what the paint lays is graded). */
  tone(feeling) { return Math.random() < 0.45 ? _c.setHex(COLOR[feeling] ?? COLOR.grief).multiplyScalar(0.7).clone() : INK.clone(); }
  /** One drop in four a spark of the film (additive), so a stream of ink reads against a dark floor. */
  drop(o, feeling) {
    const fx = this.game.fx;
    if (Math.random() < 0.25 && fx.add) fx.add.emit({ ...o, size: o.size * 0.7, color: _c.setHex(COLOR[feeling] ?? COLOR.grief).clone(), alpha: 0.9 });
    else fx.alpha.emit(o);
  }

  update(raw = 1 / 60, { model = null, mode = 'paint', saturate = 0, working = false, aim = null, from = null, feeling = 'grief' } = {}) {
    const fx = this.game.fx; this.t += raw;
    if (!model) return;
    // the tuft: inked by the saturation (mop: pale between drinks), glossy while loaded
    const want = mode === 'mop' ? (working ? 0.4 + 0.4 * Math.sin(this.t * 3) ** 2 : saturate * 0.35) : saturate;
    this.ink += (want - this.ink) * (1 - Math.exp(-raw * 10));
    model.setInk?.(this.ink); model.setWet?.(Math.min(1, saturate + (working ? 0.5 : 0)));
    if (!fx) return;
    model.tipWorld?.(_tip);
    // saturating: drops drawn up into the point from below
    if (saturate > 0 && saturate < 1) {
      this.sacc += raw * (10 + 30 * saturate);
      while (this.sacc >= 1) {
        this.sacc -= 1;
        const a = Math.random() * Math.PI * 2, r = 0.25 + Math.random() * 0.2;
        _p.set(_tip.x + Math.cos(a) * r, _tip.y - 0.25 - Math.random() * 0.3, _tip.z + Math.sin(a) * r);
        _v.copy(_tip).sub(_p).multiplyScalar(3.2);
        fx.alpha.emit({ pos: _p.clone(), vel: _v.clone(), life: 0.3, size: 0.04, sizeEnd: 0.015, color: INK.clone(), alpha: 0.9, drag: 0 });
      }
    }
    if (!working || saturate < 1) return;
    this.acc += raw * (mode === 'paint' ? 70 : 45);
    while (this.acc >= 1) {
      this.acc -= 1;
      if (mode === 'paint' && aim) { // (the spray: a cone of drops, 7 m of throw)
        _s.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.28);
        _v.copy(aim).normalize().add(_s).normalize().multiplyScalar(9 + Math.random() * 3);
        this.drop({ pos: _tip.clone(), vel: _v.clone(), life: 0.75, size: 0.1, sizeEnd: 0.16, color: this.tone(feeling), alpha: 0.9, drag: 0.6, gravity: 6 }, feeling);
      } else if (mode === 'mop' && from) { // (the drink: a stream spiralling into the point)
        const a = Math.random() * Math.PI * 2, r = Math.random() * 0.4;
        _p.set(from.x + Math.cos(a) * r, from.y + 0.05, from.z + Math.sin(a) * r);
        _v.copy(_tip).sub(_p); const d = _v.length(); _v.normalize();
        const sw = _s.set(-_v.z, 0, _v.x).multiplyScalar(1.2); // (a swirl across the way it is drawn)
        this.drop({ pos: _p.clone(), vel: _v.multiplyScalar(d / 0.45).add(sw).clone(), life: 0.45, size: 0.08, sizeEnd: 0.03, color: this.tone(feeling), alpha: 0.9, drag: 0 }, feeling);
      }
    }
  }

  /** The Brush Slide on wet or painted ground: twin rooster tails from the feet, the rings where it is water. */
  slide(raw = 1 / 60, { pos = null, vel = null, surface = null, feeling = 'grief' } = {}) {
    const fx = this.game.fx; if (!fx || !pos || !vel || !surface) return;
    const sp = Math.hypot(vel.x, vel.z); if (sp < 1.5) return;
    this.slideAcc = (this.slideAcc || 0) + raw * Math.min(90, sp * 12);
    const bx = -vel.x / sp, bz = -vel.z / sp, sx = -bz, sz = bx; // (back along the slide, and across it)
    while (this.slideAcc >= 1) {
      this.slideAcc -= 1;
      const side = Math.random() < 0.5 ? -1 : 1, spread = 0.35 + Math.random() * 0.4;
      _v.set((bx + sx * side * spread) * sp * 0.6, 1.8 + Math.random() * 1.6, (bz + sz * side * spread) * sp * 0.6);
      _p.set(pos.x + sx * side * 0.15, pos.y + 0.05, pos.z + sz * side * 0.15);
      fx.alpha.emit({ pos: _p.clone(), vel: _v.clone(), life: 0.55, size: 0.1, sizeEnd: 0.04, color: surface === 'water' ? WATER.clone() : this.tone(feeling), alpha: 0.75, drag: 1.2, gravity: 9.8 });
    }
    if (surface === 'water') { this.ringT = (this.ringT || 0) - raw; if (this.ringT <= 0) { this.ringT = 0.12; this.game.water?.disturb?.(pos.x, pos.z, Math.min(1, sp / 8), 'wake'); } }
  }
}
