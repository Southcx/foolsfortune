// ---------------------------------------------------------------------------------------
// A HIT FLINCH (plain name; docs/plans/SONDELASS-FEEL.md 3E): every creature struck through a hitlag (creatures.hitlag, the registry's)
// answers on its drawn body, whatever its kind: shaken along the cut's line while its hitlag holds it (side to side every other frame,
// dying out with the frames left), squashed on the frame it is struck, knocked back a hand's breadth away from the cut once the hitlag
// lets it go and sprung home, and lit for a moment in the blow's damage type's colour (DAMAGE_TINT; the flash only through a Veritome's
// sight, vfx/veritomesight.js). Looks only: the creature's root
// object (`c.root`), never its collider, never its position (`c.pos`), never its rule. Strawman keeps its own flinch (`model.flinch`,
// vfx/strawman.js, asked by vfx/blowfeel.js) and is left alone here.
//
// Nothing is cloned: the flash is laid onto the emissive of the materials the body already has (its own, as the slip jelly's and the
// Lantern Wisp's are) and taken off again. A kind that writes its root's place, scale or emissive every frame (the jelly, the Wisp)
// is read after it has; one that does not is told apart by what is still there (what this wrote last frame), so nothing builds up and
// what was there is put back exactly when the flinch is done.
//
// Prior art: Melee's hitlag shake (the victim jittered along the hit's direction for the frames of its hitlag; SmashWiki "Hitlag",
// docs/ref/combat/MELEE.md 2), the fighting games' hurt flash, Hollow Knight's knock-back on its enemies, the animator's squash on
// contact (Disney's twelve principles: squash and stretch).
//
//   game.hitFlinch = new HitFlinch(game)   (boot/creatures.js; joins the `fx` phase, after the bodies have been drawn this frame)
//   FLINCH (its numbers, by the blow's weight class: blowfeel.js blowWeight)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { DAMAGE_TINT } from './library.js';
import { sightShows } from './veritomesight.js';

/** Its numbers. shake: m at the hitlag's first frame along the cut, dying out; squash: the body's height lost at the blow (its width
 *  gained by half), back over `squashT` real s; recoil: m pushed away from the cut once the hitlag ends, sprung home over `recoilT`;
 *  flash: the emissive laid on at the blow, gone over `flashT`. `by`: each weight class's share of them. */
export const FLINCH = {
  shake: 0.045, squash: 0.12, squashT: 0.16, recoil: 0.09, recoilT: 0.2, flash: 0.75, flashT: 0.14,
  by: { light: 0.7, heavy: 1, launcher: 1, finisher: 1.35 },
};

const _o = new THREE.Vector3(), _c = new THREE.Color();

export class HitFlinch {
  constructor(game) {
    this.game = game;
    this.live = new Map(); // creature -> its flinch
    this.seen = new WeakMap(); // creature -> the hitlag seq last started
    this.mats = new WeakMap(); // creature -> its materials with an emissive (found once)
    game.systems?.add('fx', this, { name: 'hitFlinch' });
  }

  update(dt) {
    for (const c of this.game.creatures?.list || []) {
      const L = c.hitlag; if (!L || this.seen.get(c) === L.seq) continue;
      this.seen.set(c, L.seq);
      if (c.root && !c.model?.flinch) this.start(c, L);
    }
    for (const [c, s] of this.live) if (!this.step(c, s, dt)) { this.end(c, s); this.live.delete(c); }
  }

  start(c, L) {
    const s = this.live.get(c) || { t: 0, k: 1, dir: new THREE.Vector3(), tint: new THREE.Color(), pos: null, scale: null, em: [] };
    s.t = 0; s.k = FLINCH.by[L.weight] ?? 1; s.dir.copy(L.dir); s.lag = L.n / 60; s.seq = L.seq;
    s.tint.set(DAMAGE_TINT[L.type] ?? DAMAGE_TINT.impact);
    if (!this.mats.has(c)) {
      const list = []; c.root.traverse((o) => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m?.emissive && !list.includes(m)) list.push(m); });
      this.mats.set(c, list);
    }
    if (!s.em.length) s.em = this.mats.get(c).map((m) => ({ m, base: new THREE.Color(), wrote: null }));
    this.live.set(c, s);
  }

  /** One frame of it; false once it is done. */
  step(c, s, dt) {
    s.t += dt;
    const R = c.root, F = FLINCH, L = c.hitlag?.seq === s.seq ? c.hitlag : null;
    // the shake along the cut while the hitlag holds, then the knock back away from it, sprung home
    _o.set(0, 0, 0);
    if (L && L.f > 0) _o.copy(s.dir).multiplyScalar(F.shake * s.k * (Math.floor(L.f) & 1 ? 1 : -1) * Math.min(1, L.f / Math.max(1, L.n)));
    const r = s.t - s.lag; // (real-ish s since the hitlag let go: game time)
    if (r > 0 && r < F.recoilT) { const u = r / F.recoilT, e = Math.sin(Math.min(1, u * 3) * Math.PI * 0.5) * (1 - u) * (1 - u); _o.x += s.dir.x * F.recoil * s.k * e; _o.z += s.dir.z * F.recoil * s.k * e; }
    s.pos = put(R.position, s.pos, _o, false);
    const q = s.t < F.squashT ? (1 - s.t / F.squashT) ** 2 * F.squash * s.k : 0;
    s.scale = put(R.scale, s.scale, _o.set(1 + q * 0.5, 1 - q, 1 + q * 0.5), true);
    const fl = s.t < F.flashT && sightShows(this.game, 'flinchTint') ? (1 - s.t / F.flashT) * F.flash * s.k : 0;
    for (const e of s.em) {
      if (!(e.wrote && e.m.emissive.equals(e.wrote))) e.base.copy(e.m.emissive); // (the kind wrote its own this frame, or never wrote ours over: that is the base)
      e.m.emissive.copy(e.base).add(_c.copy(s.tint).multiplyScalar(fl));
      (e.wrote ||= new THREE.Color()).copy(e.m.emissive);
    }
    return s.t < Math.max(F.flashT, F.squashT, s.lag + F.recoilT) || !!L;
  }

  /** Done: whatever is still ours put back exactly as it was. */
  end(c, s) {
    const R = c.root;
    if (s.pos?.wrote && R.position.equals(s.pos.wrote)) R.position.copy(s.pos.base);
    if (s.scale?.wrote && R.scale.equals(s.scale.wrote)) R.scale.copy(s.scale.base);
    for (const e of s.em) if (e.wrote && e.m.emissive.equals(e.wrote)) e.m.emissive.copy(e.base);
    s.pos = s.scale = null; for (const e of s.em) e.wrote = null;
  }
}

/** Lay `v` onto `vec` (added, or multiplied when `mul`) over its base: the base is what is there unless it is still what was written
 *  last frame (the kind did not write it again), in which case the old base stands. */
function put(vec, rec, v, mul) {
  const r = rec || { base: new THREE.Vector3(), wrote: null };
  if (!(r.wrote && vec.equals(r.wrote))) r.base.copy(vec);
  vec.copy(r.base); if (mul) vec.multiply(v); else vec.add(v);
  (r.wrote ||= new THREE.Vector3()).copy(vec);
  return r;
}
