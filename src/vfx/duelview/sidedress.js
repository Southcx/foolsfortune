// ---------------------------------------------------------------------------------------
// EACH HALF ITS ACTOR'S (plain name; South, 2026-10-29: "each half's side of the puzzle duel is a representation of the actor ... the
// esoteric clay systems of the Courier/pneuka jar, and then whatever's emblematic of the Aberrant, like sandfalls for the slip jellies,
// or lanterns on wiry briars for the lantern wisps. Because the puzzle duel is ostensibly its own instance, we should have enough
// budget"): set pieces stood round each fighter in the duel's instance, behind and beyond its end of the tsuitate, beside the domains'
// clash's ground and the frame's dress.
//   YOURS        the clay's machinery: three clay rings hung in the air behind the Pneuka Jar, turning on their own axes like an
//                armillary, a band of neuralese running round inside each in your light; kiln-coil pillars standing out at your end with
//                kintsugi's gold crackle breathing over them; sherds orbiting slowly between
//   THE JELLY'S  sandfalls: streams of sand pouring down out of the dark at its end, each two sheets of falling grains (the near one fast,
//                the far one slow), a dust plume rising where it lands and a mound of sand under it
//   THE WISP'S   wiry briars: thin black canes climbing out of the ground at its end, thorned, bending, a lantern hung from each tip and
//                fork, every flame flickering on its own, guttering as the Wisp's own lantern dims (aberrants/wisp.js `dark`)
//   STRAWMAN'S   its sparring yard at harvest (aberrants/strawmanyard.js `strawmanYard`): bales, a target on its easel, its fellow
//                dummies on their posts, bunting over its head, Pip's sewing kit at giant scale, straw blowing across
//   ANY OTHER    nothing
// Programs: the clay's, the kit's basic with a map (fxkit.js) and the glow's (pieces.js `duel-glow`): nothing new.
// Prior art: Pokemon Stadium's arenas, each a type's stage set; Final Fantasy's battle backs; Guilty Gear's stages dressed as their
// fighter; the armillary sphere; Kingdom Hearts' Land of Dragons' paper lanterns; the Dunes' own sandfalls (vfx/racewaysandfall.js).
//
//   const D = new DuelSideDress(view)   D.open(state, foe)   D.update(dt)   D.close()   SIDE_DRESS (the knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { duelMaterials } from './pieces.js';
import { WispElite } from './aberrants/wisp.js';
import { JellyElite } from './aberrants/jelly.js';
import { StrawmanElite } from './aberrants/strawman.js';
import { strawmanYard } from './aberrants/strawmanyard.js';
import { SIDE, tex, chantTexture, scrollMat, scroll, worldIn } from './fxkit.js';
import { FEELINGS } from '../../npc/neuraleseroots.js';
import { feelColour } from './layout.js';

/** rings: the armillary's radii (m); falls: the sandfalls (out from the foe, back from the face, width, m); briars: canes; lanterns' flicker (real s). */
export const SIDE_DRESS = { rings: [1.0, 0.72, 0.48], falls: [[1.4, 1.2, 0.7], [2.6, 0.4, 0.5], [3.6, 2.2, 0.9], [2.0, 3.3, 0.6]], fallH: 7, briars: 6, flicker: 9 };
const CLAY = 0xb5653a, SAND = 0xb08850, IRON = 0x161214, LAMP = 0xffa850, GOLD = 0xffcf6a;
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Quaternion(), _c = new THREE.Color();
const hsh = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

export class DuelSideDress {
  constructor(view) { this.view = view; this.group = new THREE.Group(); this.group.name = 'duel-sidedress'; this.spin = []; this.scrolls = []; this.lamps = []; this.ticks = []; this.t = 0; }

  open(state, foe) {
    this.close(); const V = this.view; if (!V.isOpen) return; worldIn(this.group, V.root);
    const u = _a.copy(V.u).setY(0).normalize().clone(), back = V.face.clone().negate();
    const you = (V.game.player?.pos || V.centre.clone().addScaledVector(u, -2)).clone(), them = (foe?.pos || V.centre.clone().addScaledVector(u, 2)).clone();
    this.yours(you, u.clone().negate(), back);
    if (StrawmanElite.fits(state, foe)) strawmanYard(this, them, u, back); else if (WispElite.fits(state, foe)) this.briars(them, u, back); else if (JellyElite.fits(state, foe)) this.sandfalls(them, u, back);
  }

  mesh(geo, mat, at) { const m = new THREE.Mesh(geo, mat); if (at) m.position.copy(at); m.frustumCulled = false; this.group.add(m); return m; }
  fx(geo, texture, hex, opts, su, sv, at) { const mat = scrollMat(texture, hex, opts), m = this.mesh(geo, mat, at); this.scrolls.push({ m, su, sv }); return m; }

  /** Yours: the armillary of clay rings with their chant, the kiln-coil pillars and their gold crackle, the orbiting sherds. */
  yours(at, out, back) {
    const M = duelMaterials(), clay = M.clay.clone(); clay.color.setHex(CLAY); this.clay = clay; const S = SIDE[0];
    const hub = at.clone().addScaledVector(out, -0.4).addScaledVector(back, 3.4).addScaledVector(UP, 2.2); // (behind and over the Jar, toward the board: clear of the phone's top bar)
    SIDE_DRESS.rings.forEach((r, i) => {
      const g = new THREE.Group(); g.position.copy(hub); this.group.add(g);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 8, 48), clay); g.add(ring);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.94, 0.07, 48, 1, true), scrollMat(chantTexture(Object.values(FEELINGS)), S.hi, { repeat: [Math.round(r * 3), 1] })); band.rotation.x = Math.PI / 2; g.add(band); this.scrolls.push({ m: band, su: (i % 2 ? -1 : 1) * 0.05, sv: 0 });
      g.rotation.set(hsh(i, 1) * Math.PI, hsh(i, 2) * Math.PI, 0); this.spin.push({ o: g, ax: new THREE.Vector3(hsh(i, 3) - 0.5, 1, hsh(i, 4) - 0.5).normalize(), w: 0.25 + 0.2 * i });
    });
    for (const [k, s] of [[2.4, -1], [2.9, 1]]) { // (the kiln-coil pillars: coils stacked, the gold crackle breathing over them)
      const p = at.clone().addScaledVector(out, k).addScaledVector(back, 0.6 + s * 0.9), pts = [];
      for (let j = 0; j <= 16; j++) { const y = (j / 16) * 2.6; pts.push(new THREE.Vector2(0.28 + 0.05 * Math.sin(j * 1.9) + (j === 16 ? 0.06 : 0), y)); }
      this.mesh(new THREE.LatheGeometry(pts, 14), clay, p);
      const gl = this.fx(new THREE.LatheGeometry(pts.map((v) => new THREE.Vector2(v.x * 1.04, v.y)), 14), tex('crackle'), GOLD, { repeat: [2, 2], opacity: 0.7 }, 0, 0.03, p); gl.userData.breathe = 1;
    }
    for (let i = 0; i < 9; i++) { const m = this.mesh(new THREE.TetrahedronGeometry(0.07 + 0.05 * hsh(i, 5), 0), clay); this.spin.push({ o: m, orbit: hub, r: 1.4 + 0.5 * hsh(i, 6), a: hsh(i, 7) * 6.28, y: (hsh(i, 8) - 0.5) * 1.2, w: 0.3 + 0.3 * hsh(i, 9) }); }
  }

  /** The slip jelly's: sandfalls pouring out of the dark, a dust plume and a mound where each lands. */
  sandfalls(at, out, back) {
    const M = duelMaterials(), sand = M.clay.clone(); sand.color.setHex(SAND); this.sand = sand; const gall = feelColour('gall', _c).clone().lerp(new THREE.Color(SAND), 0.75).multiplyScalar(0.8).getHex(); // (sand, a little of Gall in it: warm, never white)
    for (const [o, b, w] of SIDE_DRESS.falls) {
      const H = SIDE_DRESS.fallH, base = at.clone().addScaledVector(out, o).addScaledVector(back, b), q = _q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), back.clone().negate());
      for (const [k, sv, op, dz] of [[1, 1.6, 0.85, 0], [1.35, 0.9, 0.45, -0.12]]) { const m = this.fx(new THREE.PlaneGeometry(w * k, H), tex('sand'), gall, { add: false, opacity: op, repeat: [1, 2.5] }, 0, sv, base.clone().addScaledVector(UP, H / 2).addScaledVector(back, -dz)); m.quaternion.copy(q); }
      this.fx(new THREE.CylinderGeometry(w * 0.5, w * 0.9, 0.9, 16, 1, true), tex('streaks'), gall, { opacity: 0.35, repeat: [2, 1] }, 0.1, -0.7, base.clone().addScaledVector(UP, 0.45)); // (the dust plume where it lands)
      const mound = this.mesh(new THREE.SphereGeometry(w * 0.9, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), sand, base); mound.scale.y = 0.35;
    }
  }

  /** The Lantern Wisp's: wiry briars climbing out of the ground, a lantern hung at each tip and fork. */
  briars(at, out, back) {
    const iron = new THREE.MeshStandardMaterial({ name: 'duel-clay', color: IRON, roughness: 0.86, metalness: 0, flatShading: true }); this.iron = iron; // (the clay's program, blackened)
    for (let i = 0; i < SIDE_DRESS.briars; i++) {
      const root = at.clone().addScaledVector(out, 1 + 3 * hsh(i, 1)).addScaledVector(back, 0.3 + 3 * hsh(i, 2)), pts = [root.clone()], h = 1.6 + 2.2 * hsh(i, 3);
      for (let k = 1; k <= 6; k++) pts.push(root.clone().addScaledVector(UP, (h * k) / 6).addScaledVector(out, Math.sin(k * 1.3 + i) * 0.35).addScaledVector(back, Math.cos(k * 1.7 + i) * 0.3));
      const curve = new THREE.CatmullRomCurve3(pts); this.mesh(new THREE.TubeGeometry(curve, 40, 0.03 * (1 + hsh(i, 4)), 5, false), iron);
      for (let k = 0; k < 10; k++) { const t = 0.1 + 0.85 * (k / 10), p = curve.getPoint(t), d = curve.getTangent(t), side = _b.crossVectors(d, UP).normalize(); // (its thorns)
        const th = this.mesh(new THREE.ConeGeometry(0.018, 0.12, 4), iron, p.clone().addScaledVector(side, k % 2 ? 0.04 : -0.04)); th.quaternion.setFromUnitVectors(UP, side.clone().multiplyScalar(k % 2 ? 1 : -1).addScaledVector(UP, 0.4).normalize()); }
      for (const t of [1, 0.62]) { if (t < 1 && hsh(i, 5) < 0.4) continue; const p = curve.getPoint(t).addScaledVector(UP, -0.18); // (a lantern hung off the tip, sometimes a fork)
        this.mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.18, 3), iron, p.clone().addScaledVector(UP, 0.12));
        this.mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 6, 1, true), iron, p);
        const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ name: 'duel-glow', color: LAMP, toneMapped: false })); lamp.position.copy(p); this.group.add(lamp);
        const halo = this.fx(new THREE.PlaneGeometry(0.6, 0.6), tex('ember'), LAMP, { opacity: 0.55 }, 0, 0, p); halo.userData.face = true;
        this.lamps.push({ lamp, halo, seed: hsh(i, 6 + t * 10) * 9 }); }
    }
  }

  update(dt) {
    this.t += dt; const t = this.t, cam = this.view.game.camera, dark = this.view.elite?.on && this.view.elite.dark != null ? this.view.elite.dark : 0;
    for (const s of this.spin) { if (s.orbit) { s.a += s.w * dt; s.o.position.copy(s.orbit).add(_a.set(Math.cos(s.a) * s.r, s.y + Math.sin(s.a * 2) * 0.1, Math.sin(s.a) * s.r)); s.o.rotation.x += dt; s.o.rotation.y += dt * 0.7; }
      else s.o.rotateOnAxis(s.ax, s.w * dt); }
    for (const s of this.scrolls) { scroll(s.m.material, dt, s.su, s.sv); if (s.m.userData.breathe) s.m.material.opacity = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3)); if (s.m.userData.face && cam) s.m.quaternion.copy(cam.quaternion); }
    for (const f of this.ticks) f(dt, t); // (a set's own motion: Strawman's bunting)
    for (const L of this.lamps) { const k = (0.7 + 0.3 * Math.sin(t * SIDE_DRESS.flicker + L.seed) * Math.sin(t * 3.7 + L.seed * 2)) * (1 - 0.8 * dark); // (each flame its own flicker, guttering with the Wisp's own)
      L.lamp.material.color.setHex(LAMP).multiplyScalar(1.5 * k); L.halo.material.opacity = 0.55 * k; }
  }

  close() {
    for (const m of [...this.group.children]) { this.group.remove(m); m.traverse?.((o) => { o.geometry?.dispose(); if (o.material && !o.material.userData?.keep && o.material !== duelMaterials().clayVc && o.material !== this.clay && o.material !== this.sand && o.material !== this.iron) { o.material.map?.dispose(); o.material.dispose(); } }); } // (the shared clay and a kept material stay)
    for (const m of [this.clay, this.sand, this.iron]) m?.dispose(); this.clay = this.sand = this.iron = null; this.spin = []; this.scrolls = []; this.lamps = []; this.ticks = [];
  }
}
