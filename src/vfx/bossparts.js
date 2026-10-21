// ---------------------------------------------------------------------------------------
// BOSS PARTS: the pieces of a leg's big object that the runtime hits and breaks, each its own object (docs/plans/RAIL-OVERHAUL.md
// section 6: "the big object (parts that pay)"; docs/GLOSSARY.md: a boss part). The False Light's rigging, gunports, keel and lamp
// (vfx/brig.js), Old Nobody's gills, teeth and eye (vfx/leviathan.js), the Drowned Light's lamp and windows (vfx/drownedlighthouse.js)
// are all one kind of thing, so they answer the runtime the same way:
//
//   STATE      intact, damaged, broken: each look says how its part shows each one (a callback); the runtime says which, the look
//              never decides (Petra counts the hits, Dovina sizes them)
//   SEALED     a part that cannot be hit yet (the figurehead's lamp until the rigging is cut: Ikaruga's covers that open for the
//              matching answer); its line and glow is dark while it is
//   THE GOLD LINE  while a part can be hit (`open`: alive, not sealed) its edges are lined in GOLD (0xffd36a, the rail's world marks'
//              one gold: docs/plans/RAIL-FLOW.md section 4, Dovina's, from Calissa's mock), additive over the part so it reads on the dark
//              midtones of a tarred hull or a crude hide at 480 lines. Bright intact, dimmer damaged; sealed it is dark (no line: a
//              covered part shows nothing to aim at); broken it is gone. A hit lifts it for a fifth of a real second and flashes it
//              toward the Mind's labradorite blue (vfx/labradorite.js: the targeting flash), then it settles back to gold
//   THE CRAZING `hurt(k)`, k 0..1 (1 - hp / hpMax): the part's surface crazes (vfx/partcraze.js: a crackle net opening over a second
//              skin of each of its meshes, its cracks lit gold from within near the end). The runtime says k; the look never guesses
//   THE BREAK  `break()`: the gold line and the crazing go, and the part comes off: `game.voxels.burst({ object, at, dir, power })`
//              throws its object off in voxels where that exists (the voxel builder's), else the gold line pops outward and fades
//              (a third of a real second, on the lines it already has). What is left (a stub, a scar, a shut lid) is the look's
//   THE TELEGRAPH  `telegraphAnchor`: an Object3D on the part where the shrinking mark sits (the mark is another module's: Elemental
//              Gearbolt's boxes, in the outline language), its `userData.radius` (m) the mark's size and `userData.facing` the way
//              the part faces (local); `windup(k)` is the part's own body telegraph (a port's lid, a gill's flare, the lamp's warning
//              line) and `windupK` what the mark reads
//
// Prior art: KH2's Phantom Storm (one ship, parts that pay apart), Einhander's and Radiant Silvergun's segmented bosses, Star Fox 64's
// bosses (a part's hurt shown before it comes off, each part an attack), Ikaruga's Buppousou (covers that open), Shadow of the Colossus
// (weak points that glow on a body that is a place), Rez (the wireframe target), kintsugi and guan crazing (vfx/partcraze.js).
//
//   const P = new BossPart({ name, object, radius, at (local Vector3 on object), facing, look(part, what) })
//   P.wire(geometry | mesh, { threshold, bright, parent, lines, skin })   (its gold line: LineSegments added to the object, or to `parent`;
//     `lines`: the geometry is already line pairs; a mesh given also wears the crazing's skin unless `skin: false`)
//   P.skin(mesh)   (one more mesh that crazes: a part whose line is drawn on a separate geometry)
//   P.hit(power)   P.damage()   P.break()   P.set('intact' | 'damaged' | 'broken')   P.seal(on)   P.windup(k 0..1)   P.hurt(k 0..1)
//   P.world(out)   P.state   P.sealed   P.alive (not broken)   P.open (alive and not sealed)   P.pulse   P.windupK   P.hurtK
//   P.telegraphAnchor   P.object   P.skins
//   const R = new BossParts()   R.add(P)   R.part(name)   R.list(prefix)   R.update(rawDt)   R.reset()   R.states()   R.hurt(name, k)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { voxelsNow } from './voxels/now.js';
import { mindTick } from './labradorite.js';
import { PartCraze, CRAZE_GOLD } from './partcraze.js';

export const PART_STATES = ['intact', 'damaged', 'broken'];
const GLOW = { intact: 1, damaged: 0.62, broken: 0 };
const GOLD = new THREE.Color(CRAZE_GOLD), FLASH = new THREE.Color(0x2480fa), POP_S = 0.33; // (the gold; the labradorite's blue a hit flashes toward)
/** The gold line: additive, unlit (three's line program: one the game already builds). */
const goldLine = (opacity) => new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, fog: false, toneMapped: false });
const _bp = new THREE.Vector3(), _bd = new THREE.Vector3();

export class BossPart {
  constructor({ name, object, radius = 1, at = null, facing = null, look = null } = {}) {
    this.name = name; this.object = object; this.look = look;
    this.state = 'intact'; this.sealed = false; this.pulse = 0; this.windupK = 0; this.wires = []; this.skins = []; this.hurtK = 0; this.popT = -1; this._armed = false;
    const A = (this.telegraphAnchor = new THREE.Object3D()); A.name = `telegraph:${name}`;
    if (at) A.position.copy(at);
    A.userData = { radius, part: name, facing: (facing || new THREE.Vector3(0, 0, 1)).clone().normalize() };
    object.add(A);
  }

  get alive() { return this.state !== 'broken'; }
  get open() { return this.alive && !this.sealed; }

  /** Its gold line: the edges of a geometry (or of a mesh, placed as the mesh is), hidden behind the body; a mesh also crazes. */
  wire(src, { threshold = 30, bright = 1, parent = null, opacity = 0.95, lines = false, skin = true } = {}) {
    const geo = src.isBufferGeometry ? src : src.geometry, edges = lines ? geo : new THREE.EdgesGeometry(geo, threshold);
    const line = new THREE.LineSegments(edges, goldLine(opacity));
    line.name = `wire:${this.name}`; line.userData.bright = bright; line.userData.lent = lines; line.renderOrder = 2;
    if (!src.isBufferGeometry) { line.position.copy(src.position); line.quaternion.copy(src.quaternion); line.scale.copy(src.scale); (parent || src.parent || this.object).add(line); if (skin) this.skin(src); }
    else (parent || this.object).add(line);
    line.userData.scale = line.scale.clone();
    this.wires.push(line); this.glow(); return line;
  }
  /** One more of its meshes wears the crazing (a part whose gold line is drawn on a geometry of its own). */
  skin(mesh) { if (mesh?.isMesh && !this.skins.some((s) => s.target === mesh)) this.skins.push(new PartCraze(mesh)); return this; }
  /** How hurt it is, 0..1 (1 - hp / hpMax): its crazing. */
  hurt(k) { this._armed = true; this.hurtK = THREE.MathUtils.clamp(+k || 0, 0, 1); this.craze(); return this; }
  craze() { if (!this._armed) return; const k = this.alive ? this.hurtK : 0, f = Math.min(1, this.pulse); for (const s of this.skins) s.set(k, f); }

  hit(power = 1) { if (!this.open) return this; this.pulse = Math.min(1.5, this.pulse + power); this.look?.(this, 'hit'); return this; }
  damage() { if (this.state === 'intact') this.set('damaged'); return this; }
  break() { if (this.state !== 'broken') this.set('broken'); return this; }
  set(state) {
    if (!PART_STATES.includes(state)) return this;
    const was = this.state;
    if (state === 'broken' && was !== 'broken') this.comeOff(); // (before the look swaps in its stub: what flies off is the whole part)
    this.state = state;
    if (state === 'intact') { this.pulse = 0; this.hurtK = 0; this.popT = -1; for (const w of this.wires) w.scale.copy(w.userData.scale); }
    if (was !== state || state === 'intact') this.look?.(this, 'state');
    this.glow(); this.craze(); return this;
  }
  /** It comes off: in voxels where the voxel builder is there (game.voxels.burst), else its gold line pops. */
  comeOff() {
    const V = voxelsNow(), meshes = this.skins.map((k) => k.target).filter((m) => m?.isMesh && m.visible !== false);
    if (typeof V?.burst === 'function' && meshes.length) { // (its own meshes only, never the body it hangs on: the brig's rigging is a part of her body)
      for (const s of this.skins) s.object.visible = false;
      this.object.updateWorldMatrix(true, true);
      const at = this.world(_bp), dir = _bd.copy(this.telegraphAnchor.userData.facing).transformDirection(this.object.matrixWorld);
      try { for (const m of meshes) V.burst({ object: m, at: at.clone(), dir: dir.clone(), power: Math.min(2, Math.max(1, this.telegraphAnchor.userData.radius)) }); this.popT = -1; return; } catch (e) { console.warn('bossparts: voxels.burst', e); }
    }
    this.popT = 0;
  }
  seal(on = true) { if (this.sealed !== on) { this.sealed = on; this.look?.(this, 'seal'); this.glow(); } return this; }
  windup(k) { this.windupK = THREE.MathUtils.clamp(k, 0, 1); this.look?.(this, 'windup'); this.glow(); return this; } // (its line and glow rises with it: glow() reads windupK)
  world(out = new THREE.Vector3()) { return this.telegraphAnchor.getWorldPosition(out); }

  /** The gold line as the state, the seal, the windup and the pulse say (a broken part's line only while it pops). */
  glow() {
    const f = Math.min(1, this.pulse), pop = this.popT >= 0 && this.popT < POP_S ? 1 - this.popT / POP_S : 0;
    const k = this.sealed ? 0 : this.alive ? GLOW[this.state] * (1 + 1.2 * f) + 0.6 * this.windupK : 1.8 * pop * pop;
    for (const w of this.wires) {
      w.visible = k > 0.01; if (!w.visible) continue;
      w.material.color.copy(GOLD).lerp(FLASH, 0.55 * f).multiplyScalar(k * w.userData.bright);
    }
  }

  update(raw) {
    if (!this._armed) { this._armed = true; this.craze(); } // (the skins stood shown for the warm-up's one draw; now they hide until hurt)
    if (this.pulse > 0) { this.pulse = Math.max(0, this.pulse - raw * 6); this.look?.(this, 'pulse'); this.glow(); if (this.hurtK > 0) this.craze(); } // (a fifth of a real second)
    if (this.popT >= 0) {
      this.popT += raw; const s = 1 + 0.6 * Math.min(1, this.popT / POP_S);
      for (const w of this.wires) w.scale.copy(w.userData.scale).multiplyScalar(s);
      if (this.popT >= POP_S) { this.popT = -1; for (const w of this.wires) w.scale.copy(w.userData.scale); }
      this.glow();
    }
  }

  dispose() { for (const w of this.wires) { w.parent?.remove(w); if (!w.userData.lent) w.geometry.dispose(); w.material.dispose(); } for (const s of this.skins) s.dispose(); this.skins = []; this.telegraphAnchor.parent?.remove(this.telegraphAnchor); }
}

export class BossParts {
  constructor() { this.map = new Map(); }
  add(p) { this.map.set(p.name, p); return p; }
  part(name) { return this.map.get(name) || null; }
  list(prefix = '') { return [...this.map.values()].filter((p) => p.name.startsWith(prefix)); }
  update(raw) { mindTick(); for (const p of this.map.values()) p.update(raw); }
  reset() { for (const p of this.map.values()) { p.windupK = 0; p.set('intact'); } }
  hurt(name, k) { this.part(name)?.hurt(k); return this; }
  states() { const o = {}; for (const [n, p] of this.map) o[n] = p.sealed ? 'sealed' : p.state; return o; }
  dispose() { for (const p of this.map.values()) p.dispose(); this.map.clear(); }
}
