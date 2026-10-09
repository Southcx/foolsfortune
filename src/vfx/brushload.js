// ---------------------------------------------------------------------------------------
// THE SOUL BRUSH'S LOAD, seen (the owner, 2026-10-06; docs/plans/SUNSHINE-SYSTEMS.md section 4; LACHRYMA-LOOP.md sections 3 and 5a): how
// the brush reads in its two modes, the Brush Slide on wet or painted ground, and the ground it cleans. Petra's mechanics drive it each
// frame (tools/soulbrush/load.js); nothing here decides anything.
//
//   SATURATE   while LMB is held the bristles fill over the psygun's full charge (0.85 real s): the ink creeps up the tuft from the
//              point (the model's own setInk), and drops of Lachryma are drawn up into it from below, faster as it fills
//   PAINT      then it sprays OUT: a cone of drops from the point along the aim, 7 m of throw, ink with the film of the feeling it
//              lays (the bottle's grade); the tuft stays dark and glossy. CLEAN (the radial's Fair) sprays clear water, glinting
//   MOP        then it drinks IN: a stream of drops spiralling from what it drinks (a stain, a puddle, a coated folk, within 2.4 m)
//              into the point. THE HEAD SHOWS ITS LOAD (rule 8): the whole tuft darkens in eight steps, pale slip to Lachryma ink, as
//              the bottle fills, glossier as it does; from the sixth step it drips, faster to the eighth; full, a held mop flings what it
//              cannot drink (the smear on the ground is the mechanics', handed to Petra)
//   THE SHINE  where the mop or Clean takes the last of a blot or of paint, the ground shines a moment (vfx/brushmarks.js CleanShine):
//              a blot washed (`stain.wash`, its `at`), Clean's splat that took something, the mop's last paint under it
//   THE SLIDE  the Brush Slide on wet or painted ground: twin rooster tails of spray from the feet, and the water's rings where it
//              is water (game.water.disturb)
//
// Prior art: Super Mario Sunshine's FLUDD (the spray's cone and its rooster-tail slide on wet ground; the sparkle on washed goop),
// Splatoon's charger (a weapon that fills before it fires, its ink creeping up the barrel), Luigi's Mansion's Poltergust (a stream
// drawn spiralling into the nozzle), and Viscera Cleanup Detail's mop (eight stages of load on the head, drips from the fifth, a full
// one smears instead of drinking).
//
//   const L = new BrushLoad(game)   L.update(rawDt, { model, mode: 'paint' | 'mop', saturate: 0..1, working: bool, aim, from, feeling, fill, grade })
//                                   (every frame: `model` null while the brush is put away)
//   L.slide(rawDt, { pos, vel, surface: 'water' | 'paint' | null, feeling })   L.shine(pos, size)  (ground just cleaned)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from './weather.js';
import { CleanShine } from './brushmarks.js';

const INK = new THREE.Color(0x15101c), WATER = new THREE.Color(0xd8eeee), GLINT = new THREE.Color(0xf4ffff), WHITE = new THREE.Color(0xffffff);
const LOADED = new THREE.Color(0x1d1626); // (the head at its eighth step: Lachryma ink with a violet cast, multiplied over the slip's pale)
const STEPS = 8, DRIP_FROM = 6; // (the head's load in eight steps; it drips from the sixth: Viscera Cleanup Detail's mop, from its fifth of eight)
const _tip = new THREE.Vector3(), _v = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color(), _s = new THREE.Vector3();

export class BrushLoad {
  constructor(game) {
    this.game = game; this.acc = 0; this.sacc = 0; this.ink = 0; this.t = 0; this.dripAcc = 0;
    this.load = 0; this.tinted = null; this.mopAt = new THREE.Vector3(); this.mopping = false;
    this.shines = new CleanShine(game); // (the ground just cleaned: vfx/brushmarks.js)
    game.events?.on?.('stain.wash', (e) => { if (e.at) this.shine(_p.set(e.at[0], e.at[1], e.at[2]), e.size || 2.2); }); // (a blot washed whole)
  }

  /** The ground just cleaned shines a moment (a blot washed, Clean's splat, the mop's last paint), `size` metres across. */
  shine(pos, size = 1) { this.shines.at(pos, size); }

  /** A drop's colour: ink, now and then the feeling's film in it (what the paint lays is graded); Clean's is clear water. */
  tone(feeling) { if (feeling === 'clean') return WATER.clone(); return Math.random() < 0.45 ? _c.setHex(COLOR[feeling] ?? COLOR.grief).multiplyScalar(0.7).clone() : INK.clone(); }
  /** One drop in four a spark of the film (additive), so a stream of ink reads against a dark floor; Clean's a glint. */
  drop(o, feeling) {
    const fx = this.game.fx;
    if (Math.random() < 0.25 && fx.add) fx.add.emit({ ...o, size: o.size * 0.7, color: feeling === 'clean' ? GLINT.clone() : _c.setHex(COLOR[feeling] ?? COLOR.grief).clone(), alpha: 0.9 });
    else fx.alpha.emit(o);
  }

  /** The mop's head shows its load: the whole tuft from the slip's pale to ink in eight steps (the bottle's fill), glossier as it
   *  fills; in paint mode, or put away, it is the slip's own again (so the brush at rest is baked pale). */
  headLoad(model, mode, fill, raw) {
    const M = model?.M?.hair;
    if (!M || mode !== 'mop') { if (this.tinted) { this.tinted.color.copy(WHITE); this.tinted = null; } this.load = 0; return; }
    const step = Math.min(STEPS, Math.floor(fill * STEPS + 0.02));
    this.load += (step / STEPS - this.load) * (1 - Math.exp(-raw * 14)); // (a step reads as a step, eased over a few frames)
    M.color.copy(WHITE).lerp(LOADED, Math.pow(this.load, 0.75) * 0.94); this.tinted = M; // (eased so each step darkens about as much to the eye)
    model.setWet?.(0.25 + 0.75 * this.load);
    return step;
  }

  update(raw = 1 / 60, { model = null, mode = 'paint', saturate = 0, working = false, aim = null, from = null, feeling = 'grief', fill = 0 } = {}) {
    const fx = this.game.fx; this.t = (this.t + raw) % 600;
    this.shines.update(raw);
    this.watchMop(mode, working, from);
    const step = this.headLoad(model, mode, fill, raw);
    if (!model) return;
    // the tuft: inked by the saturation (mop: pale between drinks), glossy while loaded (and, held still, the ink is the tool's own: soulbrush.js)
    if (saturate > 0 || working) {
      const want = mode === 'mop' ? (working ? 0.4 + 0.4 * Math.sin(this.t * 3) ** 2 : saturate * 0.35) : saturate;
      this.ink += (want - this.ink) * (1 - Math.exp(-raw * 10));
      model.setInk?.(this.ink); if (mode !== 'mop') model.setWet?.(Math.min(1, saturate + (working ? 0.5 : 0)));
    } else this.ink = model.ink ?? 0;
    if (!fx) return;
    model.tipWorld?.(_tip);
    // the loaded mop drips from its sixth step, faster to the eighth; full and held, it flings what it cannot drink
    if (mode === 'mop' && step >= DRIP_FROM) {
      const full = fill >= 0.985, rate = full ? (saturate > 0 ? 26 : 7) : step >= 7 ? 3 : 1.2;
      this.dripAcc += raw * rate;
      while (this.dripAcc >= 1) {
        this.dripAcc -= 1;
        const fling = full && saturate > 0 && aim;
        _p.set(_tip.x + (Math.random() - 0.5) * 0.06, _tip.y - 0.02, _tip.z + (Math.random() - 0.5) * 0.06);
        if (fling) _v.copy(aim).setY(0).normalize().multiplyScalar(1.5 + Math.random() * 2.5).add(_s.set((Math.random() - 0.5) * 1.5, 0.6 + Math.random(), (Math.random() - 0.5) * 1.5));
        else _v.set((Math.random() - 0.5) * 0.15, -0.3, (Math.random() - 0.5) * 0.15);
        this.drop({ pos: _p.clone(), vel: _v.clone(), life: fling ? 0.6 : 0.8, size: fling ? 0.07 : 0.05, sizeEnd: 0.03, color: INK.clone(), alpha: 0.95, drag: 0.3, gravity: 9.8 }, 'grief');
      }
    } else this.dripAcc = 0;
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

  /** The mop drinking paint: when it stops drinking where no paint is left under it, the ground there shines (a blot's last is its
   *  `stain.wash`; a near one is not shone twice: CleanShine). */
  watchMop(mode, working, from) {
    if (mode === 'mop' && working && from) { this.mopAt.set(from.x, from.y, from.z); this.mopping = true; return; }
    if (!this.mopping) return;
    this.mopping = false;
    const pm = this.game.paintmap, a = this.mopAt;
    if (pm && !pm.count(a.x, a.y, a.z, 1, false) && !pm.count(a.x, a.y, a.z, 1, 'slick') && !pm.count(a.x, a.y, a.z, 1, true)) this.shine(a, 1.6);
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
