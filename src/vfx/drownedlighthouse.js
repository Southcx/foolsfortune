// ---------------------------------------------------------------------------------------
// THE DROWNED LIGHT: the graveyard leg's peak (docs/plans/RAIL-OVERHAUL.md section 6, "the graveyard": "sunken hulls (Umbral) and ghost
// ships riding above them (Astral); mines; the Drowned Light that wakes as the peak"; docs/GLOSSARY.md: the Drowned Light, a boss part;
// the name is the plan's, a placeholder until Espada's). A lighthouse sunk to its gallery in the crude: what it once warned ships off,
// it now calls them onto, and the ships it took lie round it on the reef, their ghosts still sailing above their wrecks.
//
//   THE TOWER     a striped lighthouse tower (weathered bone and rust, the daymark's stripes) going down into the black crude for forty
//                 metres, its little windows spiralling down out of sight, crusted below the line with labradorite barnacles (the
//                 Mind's black iridescence, as Old Nobody's are); seen whole only from the Umbral
//   THE GALLERY   its balcony at the waterline, the crude lapping its deck and railing; under it the service storey's six tall windows
//                 ('window.0'..'window.5'), the waterline cutting their feet, lit gold from inside where a keeper's lamp still burns:
//                 a window's windup is its light coming up; damaged, its glass crazed and its light guttering; broken, a black hole
//   THE LAMP      a great lighthouse lamp on the gallery (vfx/lighthouselamp.js; 'lamp'): it WAKES (the lens's gold coming up), then sweeps
//                 a beam that is the leg's sweeping laser: a warning line first, thin and pale, then hot, white-gold over a dark rim.
//                 Damaged, it gutters; broken, dark, its glass gone
//   THE REEF      the rocks it stands on, black basalt breaking the surface round its foot
//   THE HULLS     the ships it wrecked, lying on the reef below the surface (the Umbral), on their sides and broken-backed, crusted;
//                 one mast still standing up out of the crude
//   THE GHOSTS    over each wreck, its ghost riding above the crude (the Astral): pale and translucent, a hull of glassy light and
//                 lines of the Mind, rags of sail, drifting round the light that took them
//
// Prior art: the lighthouse (tower, service storey, gallery, lantern; Smeaton's and Stevenson's rock lighthouses, the daymark's
// stripes), Sunless Sea's drowned lighthouses and its zee of wrecks, KH2's Phantom Storm (the ghouls), the Flying Dutchman and every ghost
// ship after it, Metal Gear Solid's searchlights (a sweep you read and stay out of), and the bullet-hell laser (a warning line, then
// the beam: Touhou, DoDonPachi).
//
//   const D = new DrownedLight({ env, fx })   D.group (its own frame: origin on the tower's axis at the waterline, Y up)
//   D.part(name) -> BossPart { object, state, hit(power), damage(), break(), set(state), windup(k), world(out), closingRingAnchor }
//     names: 'lamp', 'window.0'..'window.5'
//   D.set({ wake 0..1 (the lamp waking), yaw (rad: the beam's turn), pitch, warn 0..1, hot 0..1, ghosts 0..1 })   D.update(rawDt, sea)
//   D.parts   D.reset()   D.lamp (the LighthouseLamp)   D.beamPoint(d, out)   D.beamDir(out)   D.hulls, D.ghosts (Object3Ds: the wrecks
//   and their ghosts, for the runtime to place foes on)   D.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { BossPart, BossParts } from './bossparts.js';
import { LighthouseLamp, haloTexture } from './lighthouselamp.js';
import { brigHullGeometry, BRIG } from './brig.js';
import { mindLineMaterial } from './labradorite.js';
import { mergeStatic } from '../render/merge.js';

export const DROWNED = { depth: 40, r0: 4.2, r1: 6.2, deck: 3.1, gallery: 5.4 }; // (the gallery's deck clear of the swell's crests, the windows' feet in it)
const C = { bone: 0x8f877a, rust: 0x4a201a, iron: 0x1a1512, rock: 0x17141a, gold: 0xffb347, ghost: 0xc9c4ff };
const LAB = [0x6638d1, 0x384cf2, 0x2480fa, 0x1ab3db, 0x38c78c, 0xebc252, 0xe07542];

export class DrownedLight {
  constructor({ env = null, fx = null } = {}) {
    this.fx = fx; this.t = 0;
    this.group = new THREE.Group(); this.group.name = 'drowned-light';
    this.mats = []; this.geos = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = this.group) => { const m = new THREE.Mesh(track(geo), mat); m.position.set(x, y, z); parent.add(m); return m; };
    const std = (color, o = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true, ...o }));
    this.parts = new BossParts(); const look = (p, what) => this.look(p, what);
    const D = DROWNED, rnd = mulberry(23);
    // the tower: striped in vertex colours (the brig's hull program: flat, vertex coloured, both sides), tapering up out of the crude
    const tg = new THREE.CylinderGeometry(D.r0, D.r1, D.depth + D.deck, 20, 24, true); tg.translate(0, (D.deck - D.depth) / 2, 0);
    const tp = tg.attributes.position, col = [], bone = new THREE.Color(C.bone), rust = new THREE.Color(C.rust);
    for (let i = 0; i < tp.count; i++) { const y = tp.getY(i), stripe = Math.floor((y + D.depth) / 4.5) % 2, wet = y < 0 ? 0.55 : 1; const c = (stripe ? rust : bone).clone().multiplyScalar(wet * (0.85 + 0.15 * Math.sin(i * 1.7))); col.push(c.r, c.g, c.b); }
    tg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    this.towerMat = std(0xffffff, { vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, envMap: env, envMapIntensity: 0.15 });
    mesh(tg, this.towerMat);
    // its little windows going down the tower, out of sight (one merged geometry), a few still lit from inside
    const dark = track(new THREE.MeshBasicMaterial({ color: 0x050306 })), lit = track(new THREE.MeshBasicMaterial({ color: C.gold }));
    for (let i = 0; i < 9; i++) {
      const y = -3.5 - i * 4.1, a = i * 2.3, r = THREE.MathUtils.lerp(D.r0, D.r1, (D.deck - y) / (D.deck + D.depth)) + 0.04;
      const w = mesh(new THREE.PlaneGeometry(0.7, 1.2), i % 3 === 1 ? lit : dark, Math.sin(a) * r, y, Math.cos(a) * r); w.rotation.y = a;
    }
    // the reef, black basalt breaking the surface round its foot
    const rock = std(C.rock, { roughness: 0.9 });
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rnd() * 0.5, d = D.r1 + 3 + rnd() * 9, s = 2.2 + rnd() * 3.5, g = new THREE.IcosahedronGeometry(s, 0), p = g.attributes.position;
      for (let v = 0; v < p.count; v++) p.setXYZ(v, p.getX(v) * (0.8 + rnd() * 0.5), p.getY(v) * (1.1 + rnd() * 0.9), p.getZ(v) * (0.8 + rnd() * 0.5));
      g.computeVertexNormals(); const m = mesh(g, rock, Math.cos(a) * d, -s * (0.6 + rnd() * 0.8), Math.sin(a) * d); m.rotation.set(rnd(), rnd() * 6, rnd() * 0.4);
    }
    // the gallery: its deck at the waterline, its railing, the service storey under the lantern
    const iron = std(C.iron, { metalness: 0.5, roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(D.gallery, D.r0 + 0.2, 0.45, 24), iron, 0, D.deck, 0);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; mesh(new THREE.BoxGeometry(0.09, 1.1, 0.09), iron, Math.cos(a) * (D.gallery - 0.12), D.deck + 0.75, Math.sin(a) * (D.gallery - 0.12)); }
    const rail = mesh(new THREE.TorusGeometry(D.gallery - 0.12, 0.06, 4, 32), iron, 0, D.deck + 1.3, 0); rail.rotation.x = Math.PI / 2;
    mergeStatic(this.group);
    // the service storey's windows, under the gallery, the waterline at their feet ('window.0'..5)
    this.windows = [];
    const frameMat = std(C.bone), shardG = track(new THREE.TetrahedronGeometry(0.14));
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.26, y = 0.8, r = THREE.MathUtils.lerp(D.r0, D.r1, (D.deck - y) / (D.deck + D.depth)) + 0.04, root = new THREE.Group(); root.position.set(Math.sin(a) * r, y, Math.cos(a) * r); root.rotation.y = a; this.group.add(root); // (outside the tower's facets wherever it faces)
      const frame = new THREE.Group(); root.add(frame);
      for (const [w, h, x, y] of [[1.36, 0.14, 0, 1.25], [1.36, 0.14, 0, -1.05], [0.14, 2.44, -0.62, 0.1], [0.14, 2.44, 0.62, 0.1], [0.07, 2.44, 0, 0.1]]) mesh(new THREE.BoxGeometry(w, h, 0.22), frameMat, x, y, 0.1, frame);
      const arch = mesh(new THREE.TorusGeometry(0.62, 0.07, 4, 10, Math.PI), frameMat, 0, 1.25, 0.1, frame); arch.name = 'window-arch'; // (its crown under the gallery's deck)
      mergeStatic(frame);
      const paneMat = track(new THREE.MeshBasicMaterial({ color: C.gold })), pane = mesh(new THREE.PlaneGeometry(1.12, 2.3), paneMat, 0, 0.1, 0.02, root); pane.name = 'window-pane';
      const craze = new THREE.LineSegments(track(this.crazeGeometry(rnd)), track(new THREE.LineBasicMaterial({ color: 0x050303 }))); craze.position.z = 0.04; craze.visible = false; root.add(craze);
      const hole = mesh(new THREE.PlaneGeometry(1.12, 2.3), dark, 0, 0.1, 0.03, root); hole.visible = false; hole.name = 'window-hole';
      const shards = new THREE.Group(); shards.visible = false; root.add(shards);
      for (let k = 0; k < 5; k++) mesh(shardG, paneMat, (rnd() - 0.5) * 1.0, -0.95 + rnd() * 0.3, 0.15 + rnd() * 0.3, shards).rotation.set(rnd() * 3, rnd() * 3, 0);
      const part = this.parts.add(new BossPart({ name: `window.${i}`, object: root, radius: 1.3, at: new THREE.Vector3(0, 0.2, 0.3), facing: new THREE.Vector3(0, 0, 1), look }));
      part.wire(track(new THREE.PlaneGeometry(1.46, 2.7).translate(0, 0.12, 0.26)), { threshold: 10 }); part.index = i; // (in front of the frame's face)
      this.windows.push({ root, pane, paneMat, craze, hole, shards, part, k: 0 });
    }
    // the lamp: a great lighthouse lamp on the gallery
    this.lamp = new LighthouseLamp({ radius: 2.5, height: 6.2, beam: { length: 170, width: 5.5 } });
    this.lamp.group.position.y = D.deck + 0.2; this.group.add(this.lamp.group);
    const lp = this.parts.add(new BossPart({ name: 'lamp', object: this.lamp.group, radius: 3.4, at: new THREE.Vector3(0, 3, 0), facing: new THREE.Vector3(0, 1, 0), look }));
    lp.wire(this.lamp.cageEdges, { lines: true, parent: this.lamp.group }); lp.wire(this.lamp.roofEdges, { lines: true, parent: this.lamp.roof });
    // the hulls it took, on the reef below the surface; and over each, its ghost riding above the crude
    const hullG = track(brigHullGeometry()), wreckMat = std(0x7d8c94, { vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, envMap: env, envMapIntensity: 0.15 });
    const mast = std(0x2b211b), barnSlots = [];
    this.hulls = []; this.ghosts = [];
    const ghostFill = (this.ghostFill = track(new THREE.MeshBasicMaterial({ color: C.ghost, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))), // (pale glass: a program the game already warms)
      ghostLine = (this.ghostLine = track(mindLineMaterial({ opacity: 0.85, depthTest: true, bright: 1.1 })));
    const ghostSail = (this.ghostSail = track(new THREE.MeshBasicMaterial({ map: haloTexture(), color: C.ghost, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }))); // (the beam's program: a soft glow in the shape of a rag of sail)
    const hullEdges = track(new THREE.EdgesGeometry(hullG, 32));
    const WRECKS = [[0.4, 24, -9, 1.3, 0.9], [2.1, 30, -14, -1.1, 1.15], [3.7, 22, -7, 0.4, 0.8], [5.0, 34, -16, 1.6, 1.3]]; // (bearing, distance, depth, heel, scale)
    for (const [k, [a, d, y, heel, s]] of WRECKS.entries()) {
      const w = new THREE.Group(); w.position.set(Math.cos(a) * d, y, Math.sin(a) * d); w.rotation.set(0.12 * (k % 2 ? 1 : -1), a + Math.PI / 2 + (rnd() - 0.5), heel); w.scale.setScalar(s); this.group.add(w);
      const hull = mesh(hullG, wreckMat, 0, 0, 0, w); hull.name = 'wreck-hull';
      const stub = mesh(new THREE.CylinderGeometry(0.16, 0.22, k === 1 ? 20 : 6 + rnd() * 4, 7), mast, 0, 0, BRIG.fore.z, w); stub.position.y = stub.geometry.parameters.height / 2 + 1; stub.rotation.z = k === 1 ? -heel * 0.92 : (rnd() - 0.5) * 0.6; stub.name = 'wreck-mast';
      for (let b = 0; b < 14; b++) barnSlots.push({ w, p: new THREE.Vector3((rnd() - 0.5) * 3, -0.5 - rnd() * 1.2, (rnd() - 0.5) * 14) });
      this.hulls.push(w);
      if (k === 3) continue; // (one wreck's ghost is out on the sea somewhere)
      const g = new THREE.Group(); g.name = 'ghost-ship'; this.group.add(g);
      const fill = new THREE.Mesh(hullG, ghostFill); fill.renderOrder = 3; g.add(fill);
      const line = new THREE.LineSegments(hullEdges, ghostLine); line.renderOrder = 3; g.add(line);
      const rig = [], sails = new THREE.Group(); g.add(sails);
      for (const m of [BRIG.fore, BRIG.main]) { rig.push(0, 1, m.z, 0, 1 + m.h * 0.9, m.z); for (const f of [0.42, 0.78]) { const span = (f < 0.5 ? 9.5 : 7) * (m === BRIG.main ? 1.1 : 1), y0 = 1 + m.h * f; rig.push(-span / 2, y0, m.z, span / 2, y0, m.z); const sg = new THREE.PlaneGeometry(span * 0.9, m.h * 0.3, 3, 2); const sp = sg.attributes.position; for (let v = 0; v < sp.count; v++) if (sp.getY(v) < -m.h * 0.1) sp.setY(v, sp.getY(v) + rnd() * m.h * 0.12); mesh(sg, ghostSail, 0, y0 - m.h * 0.15, m.z + 0.2, sails); } } // (rags of sail on the yards)
      const rg = track(new THREE.BufferGeometry()); rg.setAttribute('position', new THREE.Float32BufferAttribute(rig, 3)); g.add(new THREE.LineSegments(rg, ghostLine));
      mergeStatic(sails);
      g.userData = { wreck: w, a, d: d + 2, s, ph: rnd() * 6.28 }; this.ghosts.push(g); // (an Object3D, as `hulls` are: its wreck and where it drifts ride in userData)
    }
    // the barnacles, labradorite: on the tower below the line and on the wrecks (one instanced draw; Old Nobody's program)
    const NB = 90 + barnSlots.length;
    this.barn = new THREE.InstancedMesh(track(new THREE.OctahedronGeometry(0.3, 0)), std(0xffffff, { roughness: 0.25, metalness: 0.85, emissive: 0x120e16 }), NB);
    this.barn.frustumCulled = false; this.group.add(this.barn); this.group.updateMatrixWorld(true);
    for (let i = 0; i < NB; i++) {
      if (i < 90) { const y = -0.6 - rnd() * 22, a = rnd() * 6.28, r = THREE.MathUtils.lerp(D.r0, D.r1, (D.deck - y) / (D.deck + D.depth)); _v.set(Math.sin(a) * r, y, Math.cos(a) * r); }
      else { const b = barnSlots[i - 90]; _v.copy(b.p).applyMatrix4(b.w.matrix); }
      this.barn.setMatrixAt(i, _m.compose(_v, _q.setFromEuler(_e.set(rnd() * 3, rnd() * 3, rnd() * 3)), _s.setScalar(0.6 + rnd() * 1.2)));
      this.barn.setColorAt(i, _c.setHex(LAB[Math.floor(rnd() * LAB.length)]).multiplyScalar(0.55));
    }
    this.k = { wake: 0, ghosts: 1, ghostsE: 1 };
    this.reset();
    this.update(0);
  }

  /** The crazing of a window's glass: dark lines from a point of impact. */
  crazeGeometry(rnd) {
    const pos = [], cx = (rnd() - 0.5) * 0.5, cy = 0.3 + (rnd() - 0.5) * 0.8;
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + rnd() * 0.4, r = 0.4 + rnd() * 0.6; pos.push(cx, cy, 0, cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 1.2, 0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g;
  }

  /** A part's look as its state or its windup say (vfx/bossparts.js calls this). */
  look(p, what) {
    if (p.name === 'lamp') { if (what === 'state') this.lamp.state(p.state); if (what === 'windup') this.lamp.set({ warn: p.windupK }); return; }
    const W = this.windows[p.index]; if (!W || what !== 'state') return;
    const b = p.state === 'broken'; W.craze.visible = p.state === 'damaged'; W.pane.visible = !b; W.hole.visible = b; W.shards.visible = b;
  }

  part(name) { return this.parts.part(name); }
  reset() { this.parts.reset(); this.k.wake = 0; this.lamp.set({ lit: 0, warn: 0, hot: 0, yaw: 0 }); }

  set({ wake, yaw, pitch, warn, hot, ghosts } = {}) {
    if (wake != null) { this.k.wake = THREE.MathUtils.clamp(wake, 0, 1); this.lamp.set({ lit: this.k.wake }); }
    this.lamp.set({ yaw, pitch, warn, hot });
    if (ghosts != null) this.k.ghosts = THREE.MathUtils.clamp(ghosts, 0, 1);
    return this;
  }
  beamPoint(d, out = new THREE.Vector3()) { return this.lamp.beamPoint(d, out); }
  beamDir(out = new THREE.Vector3()) { return this.lamp.beamDir(out); }

  update(raw = 1 / 60, sea = null) {
    this.t += raw; const t = this.t, ease = (a, b, r) => a + (b - a) * (1 - Math.exp(-raw * r));
    this.parts.update(raw); this.lamp.update(raw);
    // the windows: a keeper's lamp behind each, coming up with the light's waking and a window's windup; guttering when damaged
    for (const W of this.windows) {
      const p = W.part; W.k = ease(W.k, p.alive ? 0.25 + 0.5 * this.k.wake + 0.9 * p.windupK : 0, 4);
      const gut = p.state === 'damaged' ? 0.55 + 0.15 * Math.sin(t * 1.1 + p.index) : 1;
      W.paneMat.color.setHex(C.gold).multiplyScalar(0.05 + W.k * gut * (1 + 0.6 * Math.min(1, p.pulse)));
    }
    // the ghosts: riding above their wrecks, drifting round the light, breathing in and out of sight
    const ge = (this.k.ghostsE = ease(this.k.ghostsE, this.k.ghosts, 1.5));
    for (const g of this.ghosts) {
      const G = g.userData, a = G.a + t * 0.012, y = 2.6 + Math.sin(t * 0.5 + G.ph) * 0.5; // (riding above the crude, its keel clear)
      g.position.set(Math.cos(a) * G.d, y, Math.sin(a) * G.d); g.rotation.set(Math.sin(t * 0.7 + G.ph) * 0.04, -a, Math.sin(t * 0.6 + G.ph) * 0.06); g.scale.setScalar(G.s);
      g.visible = ge > 0.02;
    }
    const breath = 0.8 + 0.2 * Math.sin(t * 0.35);
    this.ghostFill.opacity = 0.1 * ge * breath; this.ghostLine.uniforms.uOpacity.value = 0.85 * ge * breath; this.ghostSail.opacity = 0.3 * ge * breath;
  }

  dispose() { this.group.parent?.remove(this.group); this.parts.dispose(); this.lamp.dispose(); this.barn.dispose(); for (const g of this.geos) g.dispose(); for (const m of this.mats) m.dispose(); }
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const _v = new THREE.Vector3(), _s = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _m = new THREE.Matrix4(), _c = new THREE.Color();
