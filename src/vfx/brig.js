// ---------------------------------------------------------------------------------------
// THE FALSE LIGHT: the Wreckers' brig (the crossing's set piece; the owner, 2026-10-07; docs/plans/RAIL.md section 7 and RAIL-OVERHAUL.md
// section 6, "the Wreckers"; docs/GLOSSARY.md: the Wreckers, the False Light, boarders, a boss part). Wreckers hung a lamp on the rocks to
// lure a ship in: so she is a dark brig that carries her lure with her, a lighthouse lamp held out from her bow by her figurehead, warm as
// a harbour, the one friendly light on the Emocean that is a lie. Contractors under no letter; in the crude sea's palette: a tarred black
// hull, a rust-red gun deck, old canvas, and the false lamp's gold. She is Phantom Storm's Pirate Ship, a boss of parts that pay apart,
// each a separate object the runtime hits and breaks (vfx/bossparts.js: intact, damaged, broken; line and glow; a telegraph anchor):
//
//   THE RIGGING   (above) her masts, yards, sails and colours. Four slings the yards hang from (fore course, fore topsail, main course,
//                 main topsail: 'rigging.0'..'rigging.3'): damaged, the sail is shot through and slack and the sling's wrap burnt away;
//                 broken, the yard drops askew and the canvas hangs in rags. The whole rig ('rigging'): damaged as soon as one sling is
//                 gone, broken when all four are, and then her topmasts go by the board and her colours come down
//   THE GUNPORTS  (alongside) six on the flank she shows the ship ('gunport.0'..'gunport.5'). A bar before a volley the lid swings up
//                 (red inside, as a man-of-war's were) and the gun runs out, its slow match glowing (the windup); damaged, the lid
//                 hangs by one hinge and the port is scorched; broken, a black hole with its planks sprung
//   THE KEEL      (below: seen from the Umbral) her backbone, the stem and the sternpost and the rudder; along it her garboard seams leak
//                 the gold of the stolen Lachryma in her hold ('keel'). Damaged, planks spring and the seams open; broken, the keel
//                 snaps amidships and the hold's gold pours out of her
//   THE LAMP      (the core) a false lighthouse lamp (vfx/lighthouselamp.js) held out by her figurehead, a hooded Wrecker carved and tarred
//                 and gilt ('lamp'). SEALED behind iron shutters until her rigging is cut (the look opens it when 'rigging' breaks; the
//                 runtime may seal or open it itself), then burning gold and sweeping; damaged it gutters, broken it is dark
//   THE COLOURS   a black flag with the false light on it, at the stern; `strike` hauls it down the staff
//   THE BOARDERS  Contractors under no letter, swinging over on ropes from her main yard (`BoarderLook`): a tarred coat, a hood, a mask
//                 with one amber eye, the lure's colour again
//   HER HURT      the hull scorches and her deck smokes as her hull is shot through; `sink` puts her bow under; her debris is the
//                 wreck field (vfx/wreckfield.js)
//
// Prior art: the brig itself (two square-rigged masts; the gunport lids painted red inside; the keel, stem and sternpost, garboard
// strakes), KH2's Phantom Storm (the Pirate Ship: one ship, parts that pay apart), Assassin's Creed IV's and Skies of Arcadia's broadsides
// (the ports opening a beat before the volley as the read), Wind Waker's pirate ships (dark hulls, few big shapes), R-Type's ship
// bosses (the parts you can see you can shoot), the Cornish wreckers' lamps, and the figurehead carvers of the age of sail.
//
//   const B = new BrigLook({ env, fx, flank })   B.group (its own frame: +Z the bow, Y up, origin at the waterline amidships; 18 m long)
//   B.part(name) -> BossPart { object, state, hit(power), damage(), break(), set(state), seal(on), windup(k), world(out), telegraphAnchor }
//     names: 'rigging', 'rigging.0'..'rigging.3', 'gunport.0'..'gunport.5' (on `flank`, -1 by default: her -X side), 'keel', 'lamp'
//   B.parts (the BossParts)   B.reset()   B.lamp (the LighthouseLamp: B.lamp.set({ yaw, warn, hot }) for its beam)
//   (the crossing's runtime as it stands: world/emocean/pirates.js)
//   B.set({ heel, pitch, t })   B.port(i 0..5, { side 1|-1, open 0..1, gone })   B.fire(i, side)   B.rigging(i 0..3, cut)
//   B.strike(k 0..1)   B.hurt(k 0..1)   B.sink(k 0..1)   B.update(rawDt)   B.portWorld(i, side, out)   B.riggingWorld(i, out)
//   const b = new BoarderLook()   b.group   b.set({ pos, face (yaw), rope (world anchor or null), t })
//   brigHullGeometry() (her hull, for a wreck or a ghost of one: vfx/drownedlighthouse.js)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeStatic } from '../render/merge.js';
import { addOutline } from '../render/outline.js';
import { BossPart, BossParts } from './bossparts.js';
import { LighthouseLamp, haloTexture } from './lighthouselamp.js';

export const BRIG = { length: 18, beam: 5.2, draft: 1.8, fore: { z: 4.6, h: 13 }, main: { z: -1.6, h: 15 }, bowsprit: 5.5, portY: 1.05, top: 0.6 };
const C = { tar: 0x1d1715, band: 0x5e2418, deck: 0x4a3a2c, mast: 0x2b211b, canvas: 0x857a69, red: 0x8e1f16, lure: 0xffb347, rope: 0x3a2c22, gilt: 0x9a7a3a };

/** Her half-breadth at u (0 the stern .. 1 the bow) and height y, and her rail's height at u. */
function breadth(u, y) {
  const B = BRIG.beam / 2, plan = u < 0.5 ? 0.82 + 0.18 * Math.sin(u / 0.5 * Math.PI / 2) : Math.cos((u - 0.5) / 0.5 * Math.PI / 2) ** 0.7;
  const k = THREE.MathUtils.clamp((y + BRIG.draft) / (BRIG.draft + 0.4), 0, 1); // (the section: narrow at the keel, full at the waterline...)
  const tumble = y > 0.4 ? 1 - 0.1 * (y - 0.4) / 1.6 : 1;                        // (...and a little tumblehome above it)
  return Math.max(0.02, B * plan * (0.18 + 0.82 * Math.sqrt(k)) * tumble);
}
const railY = (u) => 1.9 + 1.4 * (u - 0.42) ** 2 + (u > 0.85 ? (u - 0.85) * 2.5 : 0);

export function brigHullGeometry() {
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

/** A sail bellied full of wind (span, drop), and the same sail shot through: holes taken out of its cloth and its foot in rags. */
function sailGeometries(span, drop, seed) {
  const sg = new THREE.PlaneGeometry(span * 0.94, drop, 8, 6); sg.translate(0, -drop / 2, 0);
  const sp = sg.attributes.position; for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / (span * 0.47), v = -sp.getY(i) / drop; sp.setZ(i, Math.cos(u * Math.PI / 2) * Math.sin(v * Math.PI) * drop * 0.16); }
  sg.computeVertexNormals();
  const torn = sg.clone(), rnd = mulberry(seed), idx = torn.index.array, keep = [];
  for (let f = 0; f < idx.length; f += 3) { const row = Math.floor(f / 3 / 16), hole = rnd() < (row >= 4 ? 0.34 : 0.12); if (!hole) keep.push(idx[f], idx[f + 1], idx[f + 2]); } // (shot through, the foot most)
  torn.setIndex(keep);
  const tp = torn.attributes.position; for (let i = 0; i < tp.count; i++) if (tp.getY(i) < -drop * 0.8) tp.setY(i, tp.getY(i) + rnd() * drop * 0.22); // (the foot in rags)
  torn.computeVertexNormals();
  return { whole: sg, torn };
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
  constructor({ env = null, fx = null, flank = -1 } = {}) {
    const S = BRIG; this.fx = fx; this.flank = flank;
    this.group = new THREE.Group(); this.group.name = 'brig';
    this.body = new THREE.Group(); this.group.add(this.body);
    this.mats = []; this.geos = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    const std = (color, o = {}) => track(new THREE.MeshStandardMaterial({ color, roughness: 0.8, flatShading: true, ...o }));
    const add = (parent, geo, mat, x = 0, y = 0, z = 0, outline = true) => { track(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); if (outline) addOutline(m); return m; };
    this._std = std; this._add = add; this._track = track;
    this.parts = new BossParts();
    const look = (p, what) => this.look(p, what);
    // the hull and her deck
    this.hullMat = std(0xffffff, { vertexColors: true, roughness: 0.7, side: THREE.DoubleSide, envMap: env, envMapIntensity: 0.15 });
    add(this.body, brigHullGeometry(), this.hullMat);
    add(this.body, deckGeometry(), std(C.deck, { roughness: 0.95, side: THREE.DoubleSide }), 0, 0, 0, false);
    const mast = (this.mastMat = std(C.mast));
    // the masts, each a lower mast and a topmast that can go by the board; the bowsprit; the stern's flagstaff
    this.tops = [];
    for (const m of [S.fore, S.main]) {
      add(this.body, new THREE.CylinderGeometry(0.16, 0.22, m.h * 0.64, 7), mast, 0, 1 + m.h * 0.32, m.z);
      const top = new THREE.Group(); top.position.set(0, 1 + m.h * S.top, m.z); this.body.add(top);
      add(top, new THREE.CylinderGeometry(0.1, 0.15, m.h * (1 - S.top), 7), mast, 0, m.h * (1 - S.top) / 2, 0);
      this.tops.push({ top, m, k: 0 });
    }
    add(this.body, new THREE.CylinderGeometry(0.08, 0.18, S.bowsprit, 6), mast, 0, 2.7, S.length / 2 + S.bowsprit * 0.35).rotation.x = Math.PI / 2 - 0.3;
    add(this.body, new THREE.CylinderGeometry(0.05, 0.07, 4.2, 6), mast, 0, railY(0) + 2.0, -S.length / 2 + 0.4);
    this.buildYards(look);
    // the standing rigging: shrouds from her rails to the mastheads, stays fore and aft (one set of lines)
    const L = [], rail = (z) => { const u = z / S.length + 0.5; return [breadth(u, railY(u)), railY(u)]; }, tipZ = S.length / 2 + S.bowsprit * 0.82;
    for (const m of [S.fore, S.main]) for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) { const [b, y] = rail(m.z + k * 0.7); L.push(sx * b, y, m.z + k * 0.7 - 0.6, 0, 1 + m.h * S.top * 0.98, m.z); }
    L.push(0, 1 + S.fore.h * S.top, S.fore.z, 0, 2.7 + S.bowsprit * 0.4, tipZ - 0.3, 0, 1 + S.main.h * S.top, S.main.z, 0, 1 + S.fore.h * S.top * 0.9, S.fore.z, 0, 1 + S.main.h * S.top, S.main.z, 0, railY(0), -S.length / 2 + 0.3);
    const lg = track(new THREE.BufferGeometry()); lg.setAttribute('position', new THREE.Float32BufferAttribute(L, 3));
    this.body.add(new THREE.LineSegments(lg, track(new THREE.LineBasicMaterial({ color: C.rope }))));
    this.buildPorts(look);
    this.buildKeel(look);
    this.buildFigurehead(look);
    // the colours at the stern, on a halyard
    this.flag = new THREE.Group(); this.body.add(this.flag);
    const fg = new THREE.PlaneGeometry(1.8, 1.1, 8, 1); fg.translate(0.9, -0.55, 0);
    this.flagMesh = add(this.flag, fg, std(0xffffff, { map: flagTex(), side: THREE.DoubleSide, flatShading: false }), 0, 0, 0, false); this.flagMesh.name = 'brig-flag';
    this.flagMesh.rotation.y = Math.PI / 2; this.flagTop = railY(0) + 4.0; this.flag.position.set(0, this.flagTop, -S.length / 2 + 0.4);
    // the whole rig, as one part: its anchor up the mainmast
    this.parts.add(new BossPart({ name: 'rigging', object: this.body, radius: 5, at: new THREE.Vector3(0, 1 + S.main.h * 0.55, S.main.z), facing: new THREE.Vector3(flank, 0, 0), look }));
    mergeStatic(this.body);
    this.t = 0; this.k = { hurt: 0, sink: 0, strike: 0 }; this.smokeAcc = 0;
    this.set({});
    this.reset();
  }

  /** The yards and their sails (the rigging points: the slings the yards hang from), the topsails on the topmasts. */
  buildYards(look) {
    const S = BRIG, std = this._std, add = this._add;
    this.sailMat = std(0x6f6862, { map: sailTex(), side: THREE.DoubleSide, flatShading: false, roughness: 0.95 });
    const knotMat = std(0x15100d), wrapMat = std(0xc9b48a, { emissive: 0x2a1e0c, emissiveIntensity: 0.4 });
    this.yards = [];
    const YARDS = [[0, 0.42, 9.5, 5.4], [0, 0.78, 7.0, 3.6], [1, 0.42, 10.5, 6.0], [1, 0.78, 7.8, 4.0]]; // (mast, height up it, yard's span, sail's drop)
    for (const [i, [mi, f, span, drop]] of YARDS.entries()) {
      const T = this.tops[mi], m = T.m, onTop = f > S.top, parent = onTop ? T.top : this.body, base = onTop ? 1 + m.h * S.top : 0, zOff = onTop ? 0 : m.z;
      const y0 = 1 + m.h * f - base, yard = new THREE.Group(); yard.position.set(0, y0, zOff + 0.25); parent.add(yard);
      const spar = add(yard, new THREE.CylinderGeometry(0.07, 0.07, span, 6), this.mastMat, 0, 0, 0); spar.rotation.z = Math.PI / 2; spar.name = 'brig-yard';
      const G = sailGeometries(span, drop, 11 + i * 7); this._track(G.whole); this._track(G.torn);
      const sail = add(yard, G.whole, this.sailMat, 0, -0.05, 0.05, false); sail.name = 'brig-sail';
      const knot = add(parent, new THREE.CylinderGeometry(0.2, 0.2, 0.45, 7), knotMat, 0, y0 + 0.15, zOff + 0.12, false); knot.name = 'brig-sling';
      const wrap = add(parent, new THREE.TorusGeometry(0.2, 0.035, 4, 10), wrapMat, 0, y0 + 0.15, zOff + 0.12, false); wrap.name = 'brig-wrap'; wrap.rotation.x = Math.PI / 2;
      const Y = { yard, sail, knot, wrap, y0, k: 0, cut: false, geo: G, torn: 0 };
      const part = this.parts.add(new BossPart({ name: `rigging.${i}`, object: yard, radius: span * 0.4, at: new THREE.Vector3(0, -drop * 0.5, 0.4), facing: new THREE.Vector3(0, 0, 1), look }));
      part.wire(G.whole, { threshold: 40, parent: sail }); Y.edges = { whole: part.wires[0].geometry, torn: this._track(new THREE.EdgesGeometry(G.torn, 40)) }; // (on the sail itself: it slackens and shudders with it)
      part.wire(spar, { threshold: 40, bright: 0.7 });
      Y.part = part; this.yards.push(Y);
    }
  }

  /** The ports: six a side, each a lid on a hinge, a gun that runs out, the match glowing inside, and its scorch for when it is hit. */
  buildPorts(look) {
    const S = BRIG, std = this._std, add = this._add, track = this._track;
    this.ports = { 1: [], [-1]: [] };
    const lidOut = std(C.band), lidIn = std(C.red), hole = (this.holeMat = track(new THREE.MeshBasicMaterial({ color: 0x050303 }))), gun = std(0x161414, { metalness: 0.6, roughness: 0.45 });
    const scorchG = track(new THREE.RingGeometry(0.34, 0.62, 10, 1)), splinterG = track(new THREE.BoxGeometry(0.08, 0.5, 0.05));
    for (const sx of [1, -1]) for (let i = 0; i < 6; i++) {
      const z = -5.4 + i * 2.05, u = z / S.length + 0.5, y = S.portY, b = breadth(u, y);
      const P = new THREE.Group(); P.position.set(sx * (b + 0.07), y, z); P.rotation.y = sx * Math.PI / 2; this.body.add(P);
      add(P, new THREE.PlaneGeometry(0.62, 0.55), hole, 0, 0, 0.005, false);
      const scorch = add(P, scorchG, hole, 0, 0, 0.02, false); scorch.visible = false; scorch.name = 'brig-scorch';
      const splinters = new THREE.Group(); splinters.visible = false; P.add(splinters);
      for (const [px, py, rz] of [[-0.36, 0.1, 0.5], [0.3, -0.22, -0.7], [0.12, 0.33, 1.3]]) add(splinters, splinterG, lidOut, px, py, 0.08, false).rotation.set(0.6, 0, rz);
      const match = track(new THREE.MeshBasicMaterial({ color: 0x000000 })); const m = add(P, new THREE.PlaneGeometry(0.2, 0.2), match, 0.18, -0.12, 0.01, false); m.name = 'brig-match';
      const hinge = new THREE.Group(); hinge.position.set(0, 0.29, 0.03); P.add(hinge);
      const lid = add(hinge, new THREE.BoxGeometry(0.66, 0.58, 0.05), lidOut, 0, -0.29, 0.025, false); add(hinge, new THREE.BoxGeometry(0.6, 0.52, 0.01), lidIn, 0, -0.29, -0.004, false);
      const barrel = new THREE.Group(); P.add(barrel);
      add(barrel, new THREE.CylinderGeometry(0.09, 0.13, 1.1, 8), gun, 0, -0.02, -0.4, false).rotation.x = Math.PI / 2;
      const flashMat = track(new THREE.SpriteMaterial({ color: 0xffc070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, map: haloTexture() }));
      const flash = new THREE.Sprite(flashMat); flash.position.set(0, 0, 0.9); flash.scale.setScalar(1.8); P.add(flash);
      const port = { P, hinge, lid, barrel, match, flash, flashMat, scorch, splinters, open: 0, gone: false, fired: 0, hurt: 0 };
      if (sx === this.flank) {
        port.part = this.parts.add(new BossPart({ name: `gunport.${i}`, object: P, radius: 0.6, at: new THREE.Vector3(0, 0, 0.3), facing: new THREE.Vector3(0, 0, 1), look }));
        port.part.wire(lid, { parent: hinge, threshold: 40 }); port.part.index = i;
      }
      this.ports[sx].push(port);
    }
  }

  /** Her backbone, seen from below: the keel, the stem and the sternpost, the rudder, the garboard seams leaking the hold's gold. */
  buildKeel(look) {
    const S = BRIG, std = this._std, add = this._add, track = this._track, L = S.length;
    this.keel = new THREE.Group(); this.keel.name = 'brig-keel'; this.body.add(this.keel);
    const timber = std(0x221a15);
    this.keelHalves = [-1, 1].map((s) => { // (two halves, each pivoting at its outer end: broken, it snaps amidships)
      const g = new THREE.Group(); g.position.set(0, -S.draft - 0.12, s * L * 0.47); this.keel.add(g);
      const m = add(g, new THREE.BoxGeometry(0.3, 0.42, L * 0.47), timber, 0, 0, -s * L * 0.235, false); m.name = 'brig-keelbeam'; // (no outline below: its line and glow is the read)
      return { g, m, s };
    });
    const stem = add(this.keel, new THREE.BoxGeometry(0.26, 4.6, 0.34), timber, 0, 0.35, L / 2 + 0.05, false); stem.rotation.x = 0.1; stem.name = 'brig-stem';
    const post = add(this.keel, new THREE.BoxGeometry(0.26, 3.2, 0.3), timber, 0, -0.4, -L / 2 - 0.12, false); post.name = 'brig-post';
    this.rudder = add(this.keel, new THREE.BoxGeometry(0.14, 2.6, 0.8), timber, 0, -0.6, -L / 2 - 0.62, false); this.rudder.name = 'brig-rudder';
    // the seams either side of it, glowing with the gold in her hold, and the hole the gold pours from when she is broken
    this.seamMat = track(new THREE.MeshBasicMaterial({ color: C.lure }));
    const seamG = track(new THREE.BoxGeometry(0.07, 0.04, 11.5));
    for (const sx of [-1, 1]) { const s = add(this.keel, seamG, this.seamMat, sx * 0.3, -S.draft - 0.035, -1.25, false); s.name = 'brig-seam'; } // (on her flat bottom, a hand either side of the keel, standing off it)
    this.holdMat = track(new THREE.MeshBasicMaterial({ color: C.lure, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.hold = add(this.keel, track(new THREE.CircleGeometry(1.4, 14)), this.holdMat, 0, -S.draft - 0.03, -0.4, false); this.hold.rotation.x = Math.PI / 2; this.hold.scale.set(0.6, 1.8, 1); this.hold.name = 'brig-hold';
    this.sprung = new THREE.Group(); this.keel.add(this.sprung);
    const plank = track(new THREE.BoxGeometry(0.32, 0.06, 2.6)), plankMat = std(C.tar);
    for (const [x, z, rz, rx] of [[0.55, 2.4, 0.55, 0.12], [-0.6, -1.2, -0.6, -0.1], [0.5, -3.8, 0.7, 0.08], [-0.45, 3.9, -0.45, -0.15], [0.7, 0.4, 0.8, 0.05], [-0.7, -5.2, -0.75, 0.1]]) { // (sprung from her bottom, hanging off it)
      const p = add(this.sprung, plank, plankMat, x, -S.draft - 0.32, z, false); p.rotation.set(rx, 0, rz); p.name = 'brig-plank'; p.visible = false;
    }
    const part = this.parts.add(new BossPart({ name: 'keel', object: this.keel, radius: 2.2, at: new THREE.Vector3(0, -S.draft - 0.4, 0), facing: new THREE.Vector3(0, -1, 0), look }));
    for (const h of this.keelHalves) part.wire(h.m, { threshold: 40 });
    part.wire(stem, { threshold: 40, bright: 0.7 }); part.wire(this.rudder.geometry, { threshold: 40, bright: 0.7, parent: this.rudder });
  }

  /** The figurehead: a hooded Wrecker carved and tarred and gilt, riding the stem under the bowsprit, holding the false lamp out. */
  buildFigurehead(look) {
    const S = BRIG, std = this._std, add = this._add, bowZ = S.length / 2;
    const fig = (this.figurehead = new THREE.Group()); fig.name = 'brig-figurehead'; fig.position.set(0, 1.25, bowZ - 0.1); this.body.add(fig);
    const carved = std(0x7d7365, { roughness: 0.75 }), gilt = std(C.gilt, { metalness: 0.7, roughness: 0.35 }); // (old paint gone to bone, and the gilt worn)
    const cv = new THREE.Group(); cv.scale.setScalar(1.3); fig.add(cv);
    const robe = add(cv, new THREE.CylinderGeometry(0.34, 0.2, 1.7, 7), carved, 0, 0.45, 0.45); robe.rotation.x = 0.95; robe.name = 'brig-robe';
    const hood = add(cv, new THREE.SphereGeometry(0.34, 8, 6), carved, 0, 1.0, 1.05); hood.scale.set(0.95, 1.05, 1.15); hood.name = 'brig-hood';
    const mask = add(cv, new THREE.SphereGeometry(0.22, 8, 6, 0, Math.PI), gilt, 0, 0.98, 1.3, false); mask.rotation.x = -0.35; mask.name = 'brig-fig-mask';
    const eye = add(cv, new THREE.CircleGeometry(0.05, 8), this._track(new THREE.MeshBasicMaterial({ color: C.lure })), 0.07, 1.02, 1.5, false); eye.rotation.x = -0.35; eye.name = 'brig-fig-eye'; // (one amber eye, as the boarders' masks have)
    const hem = add(cv, new THREE.TorusGeometry(0.26, 0.04, 4, 10), gilt, 0, 0.0, 0.0, false); hem.rotation.x = Math.PI / 2 - 0.95; hem.position.set(0, -0.3, -0.05); hem.name = 'brig-fig-hem';
    for (const sx of [-1, 1]) { const arm = add(cv, new THREE.CylinderGeometry(0.07, 0.09, 0.9, 5), carved, sx * 0.3, 0.5, 1.05); arm.rotation.x = 1.3; arm.name = 'brig-fig-arm'; } // (its hands at the lamp's floor ring, either side)
    // the lamp in its hands: a lighthouse lamp with shutters (sealed until the rigging is cut)
    this.lamp = new LighthouseLamp({ radius: 0.36, height: 0.9, shutters: true, beam: { length: 70, width: 1.1 } });
    this.lamp.group.position.set(0, 0.18, 2.05); fig.add(this.lamp.group);
    const part = this.parts.add(new BossPart({ name: 'lamp', object: this.lamp.group, radius: 0.8, at: new THREE.Vector3(0, 0.5, 0), facing: new THREE.Vector3(0, 0, 1), look }));
    part.wire(this.lamp.cageEdges, { lines: true, parent: this.lamp.group }); part.wire(this.lamp.roofEdges, { lines: true, parent: this.lamp.roof });
    this.lampPart = part;
  }

  /** A part's look as its state, its seal, its windup or a hit say (vfx/bossparts.js calls this). */
  look(p, what) {
    const n = p.name;
    if (n.startsWith('rigging.')) {
      const Y = this.yards[+n.slice(8)];
      if (what === 'state') { Y.cut = p.state === 'broken'; Y.torn = p.state === 'intact' ? 0 : 1; Y.sail.geometry = Y.torn ? Y.geo.torn : Y.geo.whole; p.wires[0].geometry = Y.torn ? Y.edges.torn : Y.edges.whole; Y.wrap.visible = p.state === 'intact'; this.syncRig(); }
      if (what === 'pulse' || what === 'hit') Y.sail.rotation.y = Math.sin(this.t * 40) * 0.06 * Math.min(1, p.pulse);
    } else if (n.startsWith('gunport.')) {
      const P = this.ports[this.flank][p.index];
      if (what === 'state') { P.gone = p.state === 'broken'; P.hurt = p.state === 'damaged' ? 1 : 0; P.scorch.visible = p.state !== 'intact'; P.scorch.scale.setScalar(P.gone ? 1.3 : 1); P.splinters.visible = P.gone; if (P.gone) P.open = 0; }
      if (what === 'windup') P.open = p.windupK;
      if (what === 'hit') this.splinter(P.P, 6);
    } else if (n === 'keel') {
      if (what === 'state') { const d = p.state !== 'intact', b = p.state === 'broken'; for (const pl of this.sprung.children) pl.visible = d && (b || pl.position.z > 0); this.keelBroken = b; }
      if (what === 'hit') this.splinter(this.keel, 5, new THREE.Vector3(0, -BRIG.draft, 0));
    } else if (n === 'lamp') {
      if (what === 'state') this.lamp.state(p.state);
      if (what === 'seal') this.lamp.set({ open: p.sealed ? 0 : 1, lit: p.sealed ? 0.15 : 1 });
      if (what === 'windup') this.lamp.set({ warn: p.windupK });
    } else if (n === 'rigging') {
      if (what === 'state') { this.rigBroken = p.state === 'broken'; this.rigDamaged = p.state !== 'intact'; if (this.rigBroken) { this.strike(1); this.lampPart.seal(false); } else if (p.state === 'intact') this.lampPart?.seal(true); }
    }
  }
  /** The whole rig follows its four slings: damaged when one is gone, broken when all are (then the topmasts fall and the lamp opens). */
  syncRig() {
    const rig = this.parts.part('rigging'); if (!rig || this._syncing) return;
    const n = this.yards.filter((y) => y.part.state === 'broken').length, want = n === 4 ? 'broken' : n > 0 || this.yards.some((y) => y.part.state === 'damaged') ? 'damaged' : 'intact';
    this._syncing = true; if (rig.state !== want) rig.set(want); this._syncing = false;
  }
  splinter(obj, n, at = null) {
    const fx = this.fx; if (!fx) return;
    const p = obj.localToWorld(at ? _v.copy(at) : _v.set(0, 0, 0.3));
    for (let k = 0; k < n; k++) fx.alpha.emit({ pos: p.clone(), vel: _r.set(Math.random() - 0.5, Math.random() * 1.5, Math.random() - 0.5).multiplyScalar(5).clone(), life: 0.9, size: 0.12, sizeEnd: 0.06, color: new THREE.Color(0x3a2a1e), alpha: 0.9, drag: 1, gravity: 9.8 });
  }

  part(name) { return this.parts.part(name); }
  /** Every part whole again, the lamp sealed, the colours flying (a new set piece). */
  reset() { this.parts.reset(); this.lampPart.seal(true); this.lamp.set({ yaw: 0, warn: 0, hot: 0 }); this.strike(0); this.hurt(0); this.sink(0); this.rigBroken = this.rigDamaged = this.keelBroken = false; }

  /** Per frame: her heel and pitch (rad) and time. */
  set({ heel = 0, pitch = 0, t = this.t } = {}) { this.body.rotation.set(pitch + this.k.sink * 0.32, 0, heel + this.k.sink * 0.12); this.t = t; }

  /** Port i on a side: how far open (0 shut .. 1 the lid up and the gun run out), or shot away (`gone` true; false makes it whole). */
  port(i, { side = 1, open = 0, gone } = {}) {
    const p = this.ports[side]?.[i]; if (!p) return;
    if (gone === true) { if (p.part) p.part.break(); else p.gone = true; } else if (gone === false) { if (p.part) p.part.set('intact'); else p.gone = false; }
    p.open = p.gone ? 0 : open; if (p.part) p.part.windupK = p.open;
  }
  /** The volley's flash from port i (Petra counts the shot; this is its look). */
  fire(i, side = 1) {
    const p = this.ports[side]?.[i]; if (!p || p.gone) return; p.fired = 1;
    const fx = this.fx; if (!fx) return;
    const at = p.P.localToWorld(_v.set(0, 0, 1.1)), out = _d.set(0, 0, 1).transformDirection(p.P.matrixWorld);
    for (let k = 0; k < 8; k++) fx.alpha.emit({ pos: at.clone(), vel: out.clone().multiplyScalar(2 + Math.random() * 3).add(_r.set(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5)), life: 1.6 + Math.random(), size: 0.5, sizeEnd: 2.2, color: new THREE.Color(0x3a3436), alpha: 0.55, drag: 2.5, gravity: -0.4 });
  }
  /** Rigging point i (0 fore course, 1 fore topsail, 2 main course, 3 main topsail): cut, its yard drops and its sail goes slack. */
  rigging(i, cut = true) { const y = this.yards[i]; if (y) y.part.set(cut ? 'broken' : 'intact'); }
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
    this.parts.update(raw);
    // the lamp: its shutters, its glow, its beam turning slowly as a lighthouse's does while it burns
    const L = this.lamp; if (!this.lampPart.sealed && this.lampPart.alive && L.k.hot === 0) L.k.yaw += raw * 0.6;
    L.group.rotation.set(Math.sin(t * 1.1) * 0.04, 0, Math.sin(t * 0.9 + 1) * 0.05); L.k.lit = this.lampPart.sealed ? 0.15 : L.k.lit; L.update(raw);
    // the ports: the lid swings up, then the gun runs out; the match glows with it; the flash dies fast; a damaged lid hangs by one hinge
    for (const sx of [1, -1]) for (const p of this.ports[sx]) {
      p.k = ease(p.k ?? 0, p.open, 6);
      const lid = THREE.MathUtils.clamp(p.k * 1.6, 0, 1), run = THREE.MathUtils.clamp(p.k * 1.6 - 0.6, 0, 1);
      p.hinge.visible = !p.gone; p.hinge.rotation.set(-lid * 1.75 - p.hurt * 0.5 * (1 - lid), 0, p.hurt * 0.55);
      p.barrel.visible = !p.gone; p.barrel.position.z = run * 0.75 - p.fired * 0.35; p.barrel.rotation.set(p.hurt * 0.22, p.hurt * 0.18, 0); // (it recoils when it fires)
      p.match.color.setRGB(1, 0.45, 0.15).multiplyScalar(p.gone ? 0 : lid * (0.55 + 0.45 * Math.sin(t * 7 + sx * 3 + p.P.position.z)));
      p.fired = Math.max(0, p.fired - raw * 3); p.flashMat.opacity = p.fired ** 2 * 0.9; p.flash.scale.setScalar(1.2 + (1 - p.fired) * 1.4);
    }
    // the yards: a cut sling drops its yard and slackens the sail; a damaged one sags
    for (const [i, y] of this.yards.entries()) {
      y.k = ease(y.k, y.cut ? 1 : y.torn ? 0.25 : 0, y.cut ? 4 : 2);
      y.yard.position.y = y.y0 - y.k * 1.6; y.yard.rotation.z = y.k * (i % 2 ? -0.35 : 0.3); y.yard.rotation.x = y.k * 0.2;
      y.sail.scale.set(1 - 0.1 * y.k, 1 - 0.45 * y.k, 1 - 0.8 * y.k + 0.25 * y.k * Math.sin(t * 3 + i)); // (the wind spilled from it, flapping)
    }
    // the topmasts: they lean when the rig is hurt, and go by the board when it is broken
    for (const [i, T] of this.tops.entries()) { T.k = ease(T.k, this.rigBroken ? 1 : this.rigDamaged ? 0.06 : 0, this.rigBroken ? 1.5 : 2); T.top.rotation.set(T.k * 0.3, 0, T.k * (i ? 1.15 : -1.0) * this.flank); }
    // the keel: broken, it snaps amidships, the halves sagging from their ends, and the gold pours from her hold
    const kb = (this.kb = ease(this.kb ?? 0, this.keelBroken ? 1 : 0, 2)), kd = this.parts.part('keel').state !== 'intact' ? 1 : 0;
    for (const h of this.keelHalves) h.g.rotation.x = -h.s * kb * 0.16;
    this.rudder.rotation.set(0, kb * 0.6 + Math.sin(t * 0.8) * 0.05, kb * 0.3);
    const seam = 0.45 + 0.4 * kd + 0.6 * kb + 0.9 * this.parts.part('keel').windupK; // (its windup: the seams flare) this.seamMat.color.setHex(C.lure).multiplyScalar(seam * (0.9 + 0.1 * Math.sin(t * 1.7)) * (1 - this.k.sink * 0.5));
    this.holdMat.opacity = kb * (0.75 + 0.15 * Math.sin(t * 1.3));
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

  dispose() { this.group.parent?.remove(this.group); this.parts.dispose(); this.lamp.dispose(); for (const g of this.geos) g.dispose?.(); for (const m of this.mats) { m.map?.dispose?.(); m.dispose?.(); } }
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

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3();
