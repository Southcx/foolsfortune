// ---------------------------------------------------------------------------------------
// THE FALSE LIGHT: the Wreckers' brig (the crossing's set piece, R3; the owner, 2026-10-07; docs/plans/RAIL.md section 7; docs/GLOSSARY.md:
// the Wreckers, the False Light, boarders). Wreckers hung a lamp on the rocks to lure a ship in: so she is a dark brig that carries her
// lure with her, a lantern swinging off the end of her bowsprit, warm as a lighthouse, the one friendly light on the Emocean that is a lie.
// Petra sails her and counts her parts; this is how each part looks and answers.
//
//   THE HULL      tarred near-black, a band of rust-red along her gun deck, her sheer rising to bow and stern (a loft, one mesh)
//   THE PORTS     six a side. A bar before a volley the lids swing up (red inside, as a man-of-war's were) and the guns run out, the slow
//                 match glowing in each; `fire` is the flash and the smoke. A port shot away (`gone`) is a scorched black hole, its lid off
//   THE RIGGING   her four rigging points are the slings her four yards hang from (fore course, fore topsail, main course, main topsail),
//                 each a tarred knot on the mast with a pale wrap: cut one and its yard drops and its sail goes slack. All four: she has
//                 lost her way
//   THE COLOURS   a black flag with the false light on it, at the stern; `strike` hauls it down the staff
//   THE BOARDERS  Contractors under no letter, swinging over on ropes from her main yard (`BoarderLook`): a tarred coat, a hood, a mask
//                 with one amber eye, the lure's colour again
//   HER HURT      the hull scorches and her deck smokes as her hull is shot through; `sink` puts her bow under
//
// Prior art: the brig itself (two square-rigged masts; the gunport lids painted red inside), Assassin's Creed IV's and Skies of Arcadia's
// broadsides (the ports opening a beat before the volley as the read), Wind Waker's pirate ships (dark hulls, few big shapes), R-Type's
// ship bosses (the parts you can see you can shoot), and the Cornish wreckers' lamps.
//
//   const B = new BrigLook({ env, fx })   B.group (its own frame: +Z the bow, Y up, origin at the waterline amidships; 18 m long)
//   B.set({ heel, pitch, t })   B.port(i 0..5, { side 1|-1, open 0..1, gone })   B.fire(i, side)   B.rigging(i 0..3, cut)
//   B.strike(k 0..1)   B.hurt(k 0..1)   B.sink(k 0..1)   B.update(rawDt)   B.portWorld(i, side, out)   B.riggingWorld(i, out)
//   const b = new BoarderLook()   b.group   b.set({ pos, face (yaw), rope (world anchor or null), t })
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeStatic } from '../render/merge.js';
import { addOutline } from '../render/outline.js';

export const BRIG = { length: 18, beam: 5.2, draft: 1.8, fore: { z: 4.6, h: 13 }, main: { z: -1.6, h: 15 }, bowsprit: 5.5, portY: 1.05 };
const C = { tar: 0x1d1715, band: 0x5e2418, deck: 0x4a3a2c, mast: 0x2b211b, canvas: 0x857a69, red: 0x8e1f16, lure: 0xffb347, rope: 0x3a2c22 };

/** Her half-breadth at u (0 the stern .. 1 the bow) and height y, and her rail's height at u. */
function breadth(u, y) {
  const B = BRIG.beam / 2, plan = u < 0.5 ? 0.82 + 0.18 * Math.sin(u / 0.5 * Math.PI / 2) : Math.cos((u - 0.5) / 0.5 * Math.PI / 2) ** 0.7;
  const k = THREE.MathUtils.clamp((y + BRIG.draft) / (BRIG.draft + 0.4), 0, 1); // (the section: narrow at the keel, full at the waterline...)
  const tumble = y > 0.4 ? 1 - 0.1 * (y - 0.4) / 1.6 : 1;                        // (...and a little tumblehome above it)
  return Math.max(0.02, B * plan * (0.18 + 0.82 * Math.sqrt(k)) * tumble);
}
const railY = (u) => 1.9 + 1.4 * (u - 0.42) ** 2 + (u > 0.85 ? (u - 0.85) * 2.5 : 0);

function hullGeometry() {
  const NS = 30, ys = [1, 0.8, 0.55, 0.3, 0.05, -0.4, -0.9, -1.4, -1.8], L = BRIG.length; // (stations bow to stern; heights rail to keel)
  const pos = [], col = [], idx = [], tar = new THREE.Color(C.tar), band = new THREE.Color(C.band);
  const ring = ys.length * 2;
  for (let s = 0; s <= NS; s++) {
    const u = s / NS, z = (u - 0.5) * L, top = railY(u);
    const ptsY = ys.map((f, j) => (j === 0 ? top : f >= 0.05 && f < 1 ? Math.min(top - 0.1, f * 2.2) : f));
    const side = (sx) => ptsY.map((y) => [sx * breadth(u, y), y, z]);
    const pts = [...side(1), ...side(-1).reverse()]; // (round the section: starboard rail to keel, keel to port rail)
    for (const [x, y] of pts) { pos.push(x, y, z); const c = y > 0.75 && y < 1.4 ? band : tar; col.push(c.r, c.g, c.b); }
    if (s < NS) for (let j = 0; j < ring - 1; j++) { const a = s * ring + j, b = a + ring; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  // the transom: the flat of her stern, closed
  const t0 = pos.length / 3; pos.push(0, railY(0) * 0.6, -L / 2); col.push(tar.r, tar.g, tar.b);
  for (let j = 0; j < ring - 1; j++) idx.push(t0, j + 1, j);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  g.computeVertexNormals(); return g;
}

function deckGeometry() { // (the deck: a strip between her bulwarks a little under the rail)
  const NS = 24, pos = [], idx = [], L = BRIG.length;
  for (let s = 0; s <= NS; s++) { const u = s / NS, y = railY(u) - 0.55, b = breadth(u, y) * 0.94; pos.push(b, y, (u - 0.5) * L, -b, y, (u - 0.5) * L); if (s < NS) { const a = s * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

function canvasTexture(draw, w = 64, h = 64) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; return t;
}
const sailTex = () => canvasTexture((g, w, h) => { // (old canvas: seams down its cloths, patches sewn over the holes of other fights)
  g.fillStyle = '#857a69'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(40,30,22,0.25)'; for (let x = 4; x < w; x += 8) g.fillRect(x, 0, 1, h);
  const R = [[9, 12, 10, 8, '#6f6455'], [38, 30, 12, 10, '#9a8e7a'], [20, 44, 8, 9, '#5f5649'], [46, 8, 9, 7, '#7a6e5c']];
  for (const [x, y, ww, hh, c] of R) { g.fillStyle = c; g.fillRect(x, y, ww, hh); g.strokeStyle = 'rgba(30,22,16,0.5)'; g.strokeRect(x + 0.5, y + 0.5, ww - 1, hh - 1); }
  g.fillStyle = 'rgba(30,20,15,0.3)'; g.fillRect(0, h - 5, w, 5);
});
const flagTex = () => canvasTexture((g, w, h) => { // (the Wreckers' colours: black, and the lure on it, its rays)
  g.fillStyle = '#0d0b0b'; g.fillRect(0, 0, w, h);
  const cx = w * 0.42, cy = h * 0.5; g.strokeStyle = '#d9962e'; g.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8); g.lineTo(cx + Math.cos(a) * 14, cy + Math.sin(a) * 14); g.stroke(); }
  g.fillStyle = '#d9962e'; g.fillRect(cx - 4, cy - 6, 8, 11); g.fillStyle = '#ffe2a0'; g.fillRect(cx - 2, cy - 3, 4, 5); g.fillRect(cx - 5, cy - 8, 10, 2);
}, 64, 40);

export class BrigLook {
  constructor({ env = null, fx = null } = {}) {
    const S = BRIG; this.fx = fx;
    this.group = new THREE.Group(); this.group.name = 'brig';
    this.body = new THREE.Group(); this.group.add(this.body);
    this.mats = []; this.geos = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    const std = (color, o = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true, ...o }));
    const add = (parent, geo, mat, x = 0, y = 0, z = 0, outline = true) => { track(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); if (outline) addOutline(m); return m; };
    // the hull and her deck
    this.hullMat = std(0xffffff, { vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, envMap: env, envMapIntensity: 0.15 });
    add(this.body, hullGeometry(), this.hullMat);
    add(this.body, deckGeometry(), std(C.deck, { roughness: 0.95, side: THREE.DoubleSide }), 0, 0, 0, false);
    // the masts, the bowsprit, the stern's flagstaff
    const mast = std(C.mast);
    for (const m of [S.fore, S.main]) add(this.body, new THREE.CylinderGeometry(0.13, 0.22, m.h, 7), mast, 0, m.h / 2 + 1, m.z);
    add(this.body, new THREE.CylinderGeometry(0.08, 0.18, S.bowsprit, 6), mast, 0, 2.7, S.length / 2 + S.bowsprit * 0.35).rotation.x = Math.PI / 2 - 0.3;
    add(this.body, new THREE.CylinderGeometry(0.05, 0.07, 4.2, 6), mast, 0, railY(0) + 2.0, -S.length / 2 + 0.4);
    // the lure: a lantern hung off the bowsprit's end, swinging (the False Light)
    const tipZ = S.length / 2 + S.bowsprit * 0.82, tipY = 2.7 + S.bowsprit * 0.47 * Math.sin(0.3) + 0.6;
    this.lure = new THREE.Group(); this.lure.position.set(0, tipY, tipZ); this.body.add(this.lure);
    const iron = std(0x1a1512, { metalness: 0.5, roughness: 0.5 });
    add(this.lure, new THREE.CylinderGeometry(0.008, 0.008, 0.9, 3), iron, 0, -0.45, 0, false);
    add(this.lure, new THREE.BoxGeometry(0.36, 0.06, 0.36), iron, 0, -0.9, 0, false); add(this.lure, new THREE.BoxGeometry(0.4, 0.06, 0.4), iron, 0, -1.4, 0, false);
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) add(this.lure, new THREE.BoxGeometry(0.04, 0.5, 0.04), iron, x * 0.16, -1.15, z * 0.16, false);
    this.lureMat = track(new THREE.MeshBasicMaterial({ color: C.lure }));
    const flame = add(this.lure, new THREE.OctahedronGeometry(0.12, 1), this.lureMat, 0, -1.15, 0, false); flame.name = 'brig-lure'; flame.scale.y = 1.6;
    this.haloMat = track(new THREE.SpriteMaterial({ color: C.lure, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, map: haloTexture() }));
    const halo = new THREE.Sprite(this.haloMat); halo.scale.setScalar(3.2); halo.position.y = -1.15; this.lure.add(halo);
    // the yards and their sails (the rigging points: the slings the yards hang from)
    this.sailMat = std(0x6f6862, { map: sailTex(), side: THREE.DoubleSide, flatShading: false, roughness: 0.95 });
    this.yards = [];
    const YARDS = [[S.fore, 0.42, 9.5, 5.4], [S.fore, 0.78, 7.0, 3.6], [S.main, 0.42, 10.5, 6.0], [S.main, 0.78, 7.8, 4.0]]; // (mast, height up it, yard's span, sail's drop)
    for (const [m, f, span, drop] of YARDS) {
      const y0 = 1 + m.h * f, yard = new THREE.Group(); yard.position.set(0, y0, m.z + 0.25); this.body.add(yard);
      add(yard, new THREE.CylinderGeometry(0.07, 0.07, span, 6), mast, 0, 0, 0).rotation.z = Math.PI / 2;
      const sg = new THREE.PlaneGeometry(span * 0.94, drop, 8, 6); sg.translate(0, -drop / 2, 0);
      const sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / (span * 0.47), v = -sp.getY(i) / drop; sp.setZ(i, Math.cos(u * Math.PI / 2) * Math.sin(v * Math.PI) * drop * 0.16); } // (bellied full of wind)
      sg.computeVertexNormals();
      const sail = add(yard, sg, this.sailMat, 0, -0.05, 0.05, false); sail.name = 'brig-sail';
      const knot = add(this.body, new THREE.CylinderGeometry(0.2, 0.2, 0.45, 7), std(0x15100d), 0, y0 + 0.15, m.z + 0.12, false); knot.name = 'brig-sling';
      const wrap = add(this.body, new THREE.TorusGeometry(0.2, 0.035, 4, 10), std(0xc9b48a, { emissive: 0x2a1e0c, emissiveIntensity: 0.4 }), 0, y0 + 0.15, m.z + 0.12, false); wrap.name = 'brig-wrap'; wrap.rotation.x = Math.PI / 2;
      this.yards.push({ yard, sail, knot, wrap, y0, k: 0, cut: false });
    }
    // the standing rigging: shrouds from her rails to the mastheads, stays fore and aft (one set of lines)
    const L = [], rail = (z) => { const u = z / S.length + 0.5; return [breadth(u, railY(u)), railY(u)]; };
    for (const m of [S.fore, S.main]) for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) { const [b, y] = rail(m.z + k * 0.7); L.push(sx * b, y, m.z + k * 0.7 - 0.6, 0, 1 + m.h * 0.9, m.z); }
    L.push(0, 1 + S.fore.h, S.fore.z, 0, 2.7 + S.bowsprit * 0.4, tipZ - 0.3, 0, 1 + S.main.h * 0.95, S.main.z, 0, 1 + S.fore.h * 0.8, S.fore.z, 0, 1 + S.main.h, S.main.z, 0, railY(0), -S.length / 2 + 0.3);
    const lg = track(new THREE.BufferGeometry()); lg.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    this.body.add(new THREE.LineSegments(lg, track(new THREE.LineBasicMaterial({ color: C.rope }))));
    // the ports: six a side, each a lid on a hinge, a gun that runs out, the match glowing inside
    this.ports = { 1: [], [-1]: [] };
    const lidOut = std(C.band), lidIn = std(C.red), hole = track(new THREE.MeshBasicMaterial({ color: 0x050303 })), gun = std(0x161414, { metalness: 0.6, roughness: 0.45 });
    for (const sx of [1, -1]) for (let i = 0; i < 6; i++) {
      const z = -5.4 + i * 2.05, u = z / S.length + 0.5, y = S.portY, b = breadth(u, y);
      const P = new THREE.Group(); P.position.set(sx * (b + 0.07), y, z); P.rotation.y = sx * Math.PI / 2; this.body.add(P);
      add(P, new THREE.PlaneGeometry(0.62, 0.55), hole, 0, 0, 0.005, false);
      const match = track(new THREE.MeshBasicMaterial({ color: 0x000000 })); const m = add(P, new THREE.PlaneGeometry(0.2, 0.2), match, 0.18, -0.12, 0.01, false); m.name = 'brig-match';
      const hinge = new THREE.Group(); hinge.position.set(0, 0.29, 0.03); P.add(hinge);
      add(hinge, new THREE.BoxGeometry(0.66, 0.58, 0.05), lidOut, 0, -0.29, 0.025, false); add(hinge, new THREE.BoxGeometry(0.6, 0.52, 0.01), lidIn, 0, -0.29, -0.004, false);
      const barrel = new THREE.Group(); P.add(barrel);
      add(barrel, new THREE.CylinderGeometry(0.09, 0.13, 1.1, 8), gun, 0, -0.02, -0.4, false).rotation.x = Math.PI / 2;
      const flashMat = track(new THREE.SpriteMaterial({ color: 0xffc070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, map: haloTexture() }));
      const flash = new THREE.Sprite(flashMat); flash.position.set(0, 0, 0.9); flash.scale.setScalar(1.8); P.add(flash);
      this.ports[sx].push({ P, hinge, barrel, match, flash, flashMat, open: 0, gone: false, fired: 0 });
    }
    // the colours at the stern, on a halyard
    this.flag = new THREE.Group(); this.body.add(this.flag);
    const fg = new THREE.PlaneGeometry(1.8, 1.1, 8, 1); fg.translate(0.9, -0.55, 0);
    this.flagMesh = add(this.flag, fg, std(0xffffff, { map: flagTex(), side: THREE.DoubleSide, flatShading: false }), 0, 0, 0, false); this.flagMesh.name = 'brig-flag';
    this.flagMesh.rotation.y = Math.PI / 2; this.flagTop = railY(0) + 4.0; this.flag.position.set(0, this.flagTop, -S.length / 2 + 0.4);
    mergeStatic(this.body);
    this.t = 0; this.k = { hurt: 0, sink: 0, strike: 0 }; this.smokeAcc = 0;
    this.set({});
  }

  /** Per frame: her heel and pitch (rad) and time. */
  set({ heel = 0, pitch = 0, t = this.t } = {}) { this.body.rotation.set(pitch + this.k.sink * 0.32, 0, heel + this.k.sink * 0.12); this.t = t; }

  /** Port i on a side: how far open (0 shut .. 1 the lid up and the gun run out), or shot away. */
  port(i, { side = 1, open = 0, gone = false } = {}) { const p = this.ports[side]?.[i]; if (p) { p.open = gone ? 0 : open; p.gone = gone; } }
  /** The volley's flash from port i (Petra counts the shot; this is its look). */
  fire(i, side = 1) {
    const p = this.ports[side]?.[i]; if (!p || p.gone) return; p.fired = 1;
    const fx = this.fx; if (!fx) return;
    const at = p.P.localToWorld(_v.set(0, 0, 1.1)), out = _d.set(0, 0, 1).transformDirection(p.P.matrixWorld);
    for (let k = 0; k < 8; k++) fx.alpha.emit({ pos: at.clone(), vel: out.clone().multiplyScalar(2 + Math.random() * 3).add(_r.set(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5)), life: 1.6 + Math.random(), size: 0.5, sizeEnd: 2.2, color: new THREE.Color(0x3a3436), alpha: 0.55, drag: 2.5, gravity: -0.4 });
  }
  /** Rigging point i (0 fore course, 1 fore topsail, 2 main course, 3 main topsail): cut, its yard drops and its sail goes slack. */
  rigging(i, cut = true) { const y = this.yards[i]; if (y) y.cut = cut; }
  /** The colours: 0 flying .. 1 struck (hauled down to the rail). */
  strike(k) { this.k.strike = THREE.MathUtils.clamp(k, 0, 1); }
  /** Her hull's hurt (0 .. 1): it scorches and her deck smokes. */
  hurt(k) { this.k.hurt = THREE.MathUtils.clamp(k, 0, 1); this.hullMat.color.setScalar(1 - 0.45 * this.k.hurt); }
  /** Sinking (0 .. 1): bow down and under. */
  sink(k) { this.k.sink = THREE.MathUtils.clamp(k, 0, 1); this.body.position.y = -this.k.sink * (BRIG.draft + 3.2); }

  portWorld(i, side = 1, out = new THREE.Vector3()) { return this.ports[side][i].P.localToWorld(out.set(0, 0, 0.3)); }
  riggingWorld(i, out = new THREE.Vector3()) { return this.yards[i].knot.getWorldPosition(out); }

  update(raw = 1 / 60) {
    this.t += raw; const t = this.t, ease = (a, b, r) => a + (b - a) * (1 - Math.exp(-raw * r));
    // the lure swings, and its flame breathes
    this.lure.rotation.set(Math.sin(t * 1.4) * 0.12, 0, Math.sin(t * 1.1 + 1) * 0.16);
    const fl = 0.85 + 0.15 * Math.sin(t * 9) * Math.sin(t * 5.3); this.lureMat.color.setHex(C.lure).multiplyScalar(fl * (1 - 0.6 * this.k.sink)); this.haloMat.opacity = 0.2 * fl * (1 - this.k.sink);
    // the ports: the lid swings up, then the gun runs out; the match glows with it; the flash dies fast
    for (const sx of [1, -1]) for (const p of this.ports[sx]) {
      p.k = ease(p.k ?? 0, p.open, 6);
      const lid = THREE.MathUtils.clamp(p.k * 1.6, 0, 1), run = THREE.MathUtils.clamp(p.k * 1.6 - 0.6, 0, 1);
      p.hinge.visible = !p.gone; p.hinge.rotation.x = -lid * 1.75;
      p.barrel.visible = !p.gone; p.barrel.position.z = run * 0.75 - p.fired * 0.35; // (it recoils when it fires)
      p.match.color.setRGB(1, 0.45, 0.15).multiplyScalar(lid * (0.55 + 0.45 * Math.sin(t * 7 + sx * 3 + p.P.position.z)));
      p.fired = Math.max(0, p.fired - raw * 3); p.flashMat.opacity = p.fired ** 2 * 0.9; p.flash.scale.setScalar(1.2 + (1 - p.fired) * 1.4);
    }
    // the yards: a cut sling drops its yard and slackens the sail
    for (const [i, y] of this.yards.entries()) {
      y.k = ease(y.k, y.cut ? 1 : 0, y.cut ? 4 : 2);
      y.yard.position.y = y.y0 - y.k * 1.6; y.yard.rotation.z = y.k * (i % 2 ? -0.35 : 0.3); y.yard.rotation.x = y.k * 0.2;
      y.sail.scale.set(1 - 0.1 * y.k, 1 - 0.45 * y.k, 1 - 0.8 * y.k + 0.25 * y.k * Math.sin(t * 3 + i)); // (the wind spilled from it, flapping)
      y.wrap.visible = !y.cut;
    }
    // the colours: hauled down, and drooping as they come
    const s = this.k.strike, sw = Math.sin(t * 5);
    this.flag.position.y = THREE.MathUtils.lerp(this.flagTop, railY(0) + 0.3, s);
    this.flagMesh.rotation.y = Math.PI / 2 + sw * 0.08 * (1 - s); this.flagMesh.rotation.x = s * 1.2;
    // her hurt: smoke from her deck
    const fx = this.fx; if (fx && this.k.hurt > 0.2 && this.k.sink < 0.9) {
      this.smokeAcc += raw * this.k.hurt * 8;
      while (this.smokeAcc >= 1) {
        this.smokeAcc -= 1; const u = Math.random(), at = this.body.localToWorld(_v.set((Math.random() - 0.5) * 2.5, railY(u) - 0.4, (u - 0.5) * BRIG.length * 0.8));
        fx.alpha.emit({ pos: at, vel: _r.set(0, 1.5 + Math.random(), 0).clone(), life: 2.5, size: 0.6, sizeEnd: 2.6, color: new THREE.Color(0x221d1f), alpha: 0.45, drag: 0.6, gravity: -0.3 });
        if (Math.random() < 0.3) fx.add.emit({ pos: at.clone(), vel: _r.set(Math.random() - 0.5, 2 + Math.random() * 2, Math.random() - 0.5).clone(), life: 0.9, size: 0.06, sizeEnd: 0.02, color: new THREE.Color(0xff7a2a), alpha: 0.9, drag: 1, gravity: -1 });
      }
    }
  }

  dispose() { this.group.parent?.remove(this.group); for (const g of this.geos) g.dispose?.(); for (const m of this.mats) { m.map?.dispose?.(); m.dispose?.(); } }
}

/** A boarder: a Contractor under no letter, in a tarred coat and hood, a mask with one amber eye; on a rope its arms are up the rope. */
export class BoarderLook {
  constructor() {
    const g = (this.group = new THREE.Group()); g.name = 'boarder';
    const coat = new THREE.MeshStandardMaterial({ color: 0x241d1a, roughness: 0.85, flatShading: true }), mask = new THREE.MeshStandardMaterial({ color: 0x6b5c4c, roughness: 0.6, flatShading: true });
    this.mats = [coat, mask];
    const add = (p, geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; p.add(o); addOutline(o); return o; };
    add(g, new THREE.CylinderGeometry(0.2, 0.32, 1.0, 7), coat, 0, 0.75, 0);                    // (the coat)
    add(g, new THREE.SphereGeometry(0.2, 8, 6), coat, 0, 1.42, -0.02);                         // (the hood)
    add(g, new THREE.SphereGeometry(0.15, 8, 6, 0, Math.PI), mask, 0, 1.4, 0.06);              // (the mask)
    this.eye = new THREE.Mesh(new THREE.CircleGeometry(0.04, 8), new THREE.MeshBasicMaterial({ color: C.lure })); this.eye.position.set(0.06, 1.43, 0.215); g.add(this.eye);
    for (const sx of [-1, 1]) add(g, new THREE.CylinderGeometry(0.06, 0.07, 0.6, 5), coat, sx * 0.12, 0.15, 0);   // (the legs)
    this.arms = [-1, 1].map((sx) => { const a = new THREE.Group(); a.position.set(sx * 0.27, 1.18, 0); g.add(a); add(a, new THREE.CylinderGeometry(0.05, 0.06, 0.6, 5), coat, 0, -0.3, 0); return a; });
    const blade = add(this.arms[1], new THREE.BoxGeometry(0.03, 0.06, 0.7), new THREE.MeshStandardMaterial({ color: 0x9a9690, metalness: 0.7, roughness: 0.35 }), 0, -0.6, 0.3); this.mats.push(blade.material); // (a cutlass)
    this.ropeG = new THREE.BufferGeometry(); this.ropeG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3));
    this.rope = new THREE.Line(this.ropeG, new THREE.LineBasicMaterial({ color: C.rope })); this.rope.frustumCulled = false; this.mats.push(this.rope.material);
    this._q = new THREE.Quaternion();
  }

  /** pos (its feet), face (yaw, rad), rope: the world point the rope hangs from (on the brig's main yard), or null once aboard. */
  set({ pos, face = 0, rope = null, t = 0 }) {
    const g = this.group; if (pos) g.position.copy(pos); g.rotation.set(0, face, 0);
    if (rope && !this.rope.parent && g.parent) g.parent.add(this.rope);
    this.rope.visible = !!rope;
    for (const [i, a] of this.arms.entries()) a.rotation.x = rope ? -Math.PI + (i ? 0.25 : 0.05) : -0.4 + Math.sin(t * 6 + i * Math.PI) * 0.25; // (on a rope: both arms up it; aboard: the cutlass up)
    if (rope) {
      g.updateMatrixWorld(true); const hand = this.arms[0].localToWorld(_v.set(0, -0.6, 0));
      const P = this.ropeG.attributes.position; P.setXYZ(0, rope.x, rope.y, rope.z); P.setXYZ(1, hand.x, hand.y, hand.z); P.needsUpdate = true;
      const lean = _d.subVectors(rope, g.position); g.rotation.x = Math.atan2(-lean.z, lean.y) * 0.3; // (hanging off the rope's line)
    }
  }

  dispose() { this.group.parent?.remove(this.group); this.rope.parent?.remove(this.rope); this.group.traverse((o) => o.geometry?.dispose()); this.ropeG.dispose(); for (const m of this.mats) m.dispose(); }
}

let _halo = null;
function haloTexture() { // (a soft round glow, shared)
  if (_halo) return _halo;
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return (_halo = new THREE.CanvasTexture(c));
}
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3();
