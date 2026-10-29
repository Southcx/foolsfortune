// ---------------------------------------------------------------------------------------
// THE FIGHTERS' AURAS (plain names; South, 2026-10-29: "power up auras ... scrolling neuralese for spell chanting ... layers of primary,
// secondary, and even tertiary action"): a fighter's body wrapped as it casts, the retro way, from the effect kit's cylinders and discs
// (fxkit.js), over the board's own beats.
//   PRIMARY     a column of rays rising round the body, its side's colour (your power its domain's glaze, the aberrant's skill its
//               cinnabar), shooting up from the feet as it starts (Budokai's power-up)
//   SECONDARY   a thinner column inside it turning the other way in the side's light, a rune circle (a heptagram, the seven domains)
//               turning flat on the ground under it, embers lifting off it
//   TERTIARY    the chant: two bands of neuralese in the running hand circling the body at chest and knee, counter-scrolling (the
//               Courier's are the feelings' names; an aberrant's its own feeling's word over and over)
//   THE END     the columns snapped tall and thin, a flash, gone
// The limit break's and the finisher's are bigger and longer, the turn's a short flare without the chant.
// Programs: the house's basic with a map (fxkit's scrollMat): nothing new.
// Prior art: Pokemon Stadium's power-up and stat-raise effects (scrolled textures on cylinders, N64), Dragon Ball Budokai's aura,
// Final Fantasy VII's summon circles, the Fire Emblem phase colours (blue yours, red theirs).
//
//   const A = new DuelAuras(view)   A.warm()   A.charge(side, { hex, dur, big, chant })   A.update(dt)   A.clear()   AURA (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { SIDE, tex, chantTexture, scrollMat, scroll, worldIn } from './fxkit.js';
import { FEELINGS } from '../../npc/neuraleseroots.js';
import { clamp01, sm } from './layout.js';

/** in, out: real s; r: the column's radius (m), its height a body's (h); rise: the rays' speed (repeats/s); chant: the bands' speed. */
export const AURA = { in: 0.18, out: 0.32, r: 0.55, big: 1.5, rise: 1.8, chant: 0.12, ring: 0.9, embers: 0.06 };
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3();

export class DuelAuras {
  constructor(view) { this.view = view; this.game = view.game; this.list = []; this.group = new THREE.Group(); this.group.name = 'duel-auras'; }

  /** One aura's meshes (made per cast: a handful of meshes, the textures shared). */
  build(side, hex, big, chant) {
    const S = SIDE[side ? 1 : 0], g = new THREE.Group(), parts = [];
    const add = (geo, mat, su, sv, spin = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 3; g.add(m); parts.push({ m, su, sv, spin }); return m; };
    add(new THREE.CylinderGeometry(0.8, 1, 1, 24, 1, true), scrollMat(tex('streaks'), hex, { repeat: [3, 1] }), 0, -AURA.rise); // (primary: the rays rising)
    add(new THREE.CylinderGeometry(0.55, 0.7, 1, 18, 1, true), scrollMat(tex('streaks'), S.hi, { repeat: [2, 1], opacity: 0.6 }), 0.25, -AURA.rise * 1.4); // (secondary: inside, turning the other way)
    const ring = add(new THREE.PlaneGeometry(1, 1), scrollMat(tex('ring'), hex, { opacity: 0.9 }), 0, 0, AURA.ring); ring.rotation.x = -Math.PI / 2; ring.userData.flat = true;
    if (chant) { const words = side ? Array(4).fill(FEELINGS[this.view.aspect] || 'PAVA') : Object.values(FEELINGS);
      for (const [k, dir] of [[0.62, 1], [0.22, -1]]) { const c = add(new THREE.CylinderGeometry(1.25, 1.25, 0.16, 32, 1, true), scrollMat(chantTexture(words), S.hi, { repeat: [3, 1] }), AURA.chant * dir, 0); c.userData.at = k; } }
    this.group.add(g); return { g, parts, side, big };
  }

  /** Where a side's body stands (the world) and how tall it is. */
  stand(side, out) {
    const V = this.view;
    if (!side) { V.dive?.spot?.(out); return 1.25 * (V.show?.jar?.group.scale.y || 1); }
    const f = V.foe; if (!f?.pos) return 0; out.copy(f.pos); const h = V.foeCast?.headWorld?.(_a); return h ? Math.max(1, h.y - f.pos.y + 0.4) : 1.8;
  }

  /** A fighter's aura, `dur` real s, its colour `hex` (by default its side's); `big` the limit break's, `chant` the neuralese bands. */
  charge(side, { hex = null, dur = 1.4, big = false, chant = true } = {}) {
    if (!this.view.isOpen) return; const S = SIDE[side ? 1 : 0]; worldIn(this.group, this.view.root);
    const old = this.list.find((a) => a.side === side); if (old) this.drop(old);
    const a = this.build(side, hex ?? S.base, big, chant); a.t = 0; a.dur = dur; a.k = big ? AURA.big : 1; a.ember = 0; a.hex = hex ?? S.base;
    this.list.push(a); return a;
  }

  drop(a) { this.group.remove(a.g); for (const p of a.parts) { p.m.geometry.dispose(); p.m.material.map?.dispose(); p.m.material.dispose(); } const i = this.list.indexOf(a); if (i >= 0) this.list.splice(i, 1); }

  update(dt) {
    for (const a of [...this.list]) {
      a.t += dt; const h = this.stand(a.side, _a); if (!h) { this.drop(a); continue; }
      const kin = sm(clamp01(a.t / AURA.in)), kout = clamp01((a.t - a.dur + AURA.out) / AURA.out), fade = kin * (1 - kout), r = AURA.r * a.k * (1 - 0.6 * kout);
      a.g.position.copy(_a);
      for (const p of a.parts) { scroll(p.m.material, dt, p.su, p.sv); p.m.material.opacity = (p.m.material.userData.o ??= p.m.material.opacity) * fade;
        if (p.m.userData.flat) { p.m.scale.setScalar(r * 3.4 * (0.6 + 0.4 * kin)); p.m.position.y = 0.03; p.m.rotation.z += p.spin * dt * (a.side ? -1 : 1); continue; }
        if (p.m.userData.at != null) { p.m.scale.set(r, 1, r); p.m.position.y = h * p.m.userData.at; continue; }
        const tall = h * 1.5 * a.k * (0.25 + 0.75 * kin) * (1 + 0.6 * kout); p.m.scale.set(r, tall, r); p.m.position.y = tall / 2; }
      if ((a.ember -= dt) <= 0 && fade > 0.3 && this.view.frame) { a.ember = AURA.embers / a.k; const V = this.view, at = V.frame.worldToLocal(_a.clone().add(UP.clone().multiplyScalar(0.1)).add(new THREE.Vector3((Math.random() - 0.5) * r * 2, 0, (Math.random() - 0.5) * r * 2))); // (embers lifting off it)
        V.bursts?.burst?.(at, a.hex, 1, { speed: 0.3, life: 0.7, fall: -2.5, size: 0.03 }); }
      if (a.t >= a.dur) this.drop(a);
    }
  }

  /** At the duel's open: one of each made and compiled hidden, so the first cast compiles nothing. */
  warm() {
    const r = this.game.overlayScene?.r, cam = this.game.camera; if (!r || !cam) return; worldIn(this.group, this.view.root);
    const a = this.build(0, SIDE[0].base, false, true); try { r.compile(this.group, cam); } catch { /* (headless) */ } this.drop(a);
  }

  clear() { for (const a of [...this.list]) this.drop(a); }
}
