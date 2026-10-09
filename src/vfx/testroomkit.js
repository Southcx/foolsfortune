// ---------------------------------------------------------------------------------------
// THE TESTING ROOM'S LOOK: what the room's bodies wear (Petra's room, src/world/testroom/; her stand-ins dressed here, as the Well's are
// in welldress.js, so the room's code stays hers). The room is the Workshop's own wing, so its things are the potters' too:
//
//   THE DRILL PLATE  a target is a thrown and fired plate: a terracotta body with a foot ring, its face glazed cream with two oxblood
//                    rings brushed on the wheel, and the bull a raised boss of oxblood glaze (the one to shoot glows in it, as the
//                    room's own lit() asks: the glaze lit from inside like the kiln's mouth). One painted face for every plate.
//
// Prior art: the potter's banding wheel (the plates); a church's lectern and a scriptorium's reading desk, and Metroid Prime's
// scan points and the Sheikah towers' terminals (a physical stand with its interface hovering over it); for the projection, the
// hologram over its emitter (Star Wars' projector cone, Halo's Cortana on her pedestal) and the grimoire whose circle rises off the page
// (Fullmetal Alchemist's arrays, Fire Emblem's tomes): the image parallel to its source, the light between them. Also for the plates: the banding wheel (rings brushed on a turning plate are never quite round, never quite even), Japanese archery's
// mato (a plain paper target of concentric rings on a wooden hoop), and the clay pigeon (a fired thing made to be shot).
//
//   THE INDEX'S LECTERN  the console where the Index opens on its Testing page: a reading desk of the Workshop's dark wood on a turned
//                    post, an open book on it whose pages are lit faintly from inside (the Index awake), and the Index's dial
//                    PROJECTED from the pages (the owner's "lectern's sigil", R15): its print inked faint on the paper, the dial
//                    itself floating over the book parallel to the pages and a few centimetres above them, turning slowly, and the
//                    light rising off the page into it (a glass cone of the Mind and rings of light climbing it, widening from the
//                    print to the dial), all in the Mind's lines (the System's reading laid over a physical thing: docs/plans/OVERLAY.md)
//
//   drillPlate(radius) -> { group, bull }   indexLectern() -> { group, update(t) }   new TestRoomDress(game)   .update(raw)   (dresses game.testroom)
//   LECTERN.projection   the dial's height over the pages, its print and its light (knobs)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindLineMaterial, mindFillMaterial, mindTick } from './labradorite.js';
import { mergeStatic } from '../render/merge.js';
import { triplanar, surfaceTexture } from '../render/triplanar.js';
import { PALETTE } from '../core/config.js';

// the projection's measures (m, over the book's board; per real second): the page's top at the spine, the dial's height over it and its
// size, its strokes, its print and its light
export const LECTERN = { projection: { page: 0.042, lift: 0.06, size: 0.85, stroke: 0.01, strokeOpacity: 1, strokeInk: 1, bright: 2, printScale: 0.7, printOpacity: 0.5, printInk: 0.4, coneOpacity: 0.14, rings: 3, climb: 0.45, ringOpacity: 0.8 } };

/** Line segments (pairs of points in the xz plane) as flat strokes `w` wide, facing +y: a line that reads at 480 lines over a bright page. */
function strokes(pts, w) {
  const pos = [], idx = [], n = new THREE.Vector3(), d = new THREE.Vector3();
  for (let i = 0; i < pts.length; i += 2) {
    const a = pts[i], b = pts[i + 1]; d.subVectors(b, a).setY(0).normalize(); n.set(-d.z, 0, d.x).multiplyScalar(w / 2);
    const k = pos.length / 3;
    pos.push(a.x - n.x, a.y, a.z - n.z, a.x + n.x, a.y, a.z + n.z, b.x + n.x, b.y, b.z + n.z, b.x - n.x, b.y, b.z - n.z);
    idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return g;
}

let FACE = null;
/** The plate's glazed face, painted once (a canvas: cream, two oxblood bands, a little crazing and the brush's unevenness). */
function face() {
  if (FACE) return FACE;
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d'), m = N / 2;
  x.fillStyle = '#e8d8b8'; x.fillRect(0, 0, N, N);
  const band = (r0, r1, col, wob) => { // (a ring brushed on the turning plate: its edges wander a little)
    x.fillStyle = col; x.beginPath();
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2, r = r1 + Math.sin(a * 3 + wob) * 0.6; x.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r); }
    for (let i = 64; i >= 0; i--) { const a = (i / 64) * Math.PI * 2, r = r0 + Math.sin(a * 2 + wob * 1.7) * 0.6; x.lineTo(m + Math.cos(a) * r, m + Math.sin(a) * r); }
    x.fill();
  };
  band(50, 58, '#7a2a1e', 0.3); band(30, 37, '#8a3222', 1.9);
  x.strokeStyle = 'rgba(90,60,40,0.18)'; x.lineWidth = 0.6; // (crazing: the glaze's fine net)
  for (let i = 0; i < 26; i++) { x.beginPath(); let px = Math.random() * N, py = Math.random() * N; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (Math.random() - 0.5) * 22; py += (Math.random() - 0.5) * 22; x.lineTo(px, py); } x.stroke(); }
  FACE = new THREE.CanvasTexture(c); FACE.colorSpace = THREE.SRGBColorSpace; FACE.anisotropy = 4;
  return FACE;
}

let BODY = null, GLAZE = null;
/** A drill target as a fired plate, its face toward local +x (the stand-in's axis); `bull` is the boss, its material its own (lit). */
export function drillPlate(radius = 0.32) {
  BODY ||= new THREE.MeshStandardMaterial({ name: 'drill-terracotta', color: 0xb0603a, roughness: 0.85 });
  GLAZE ||= new THREE.MeshStandardMaterial({ name: 'drill-glaze', map: face(), roughness: 0.35 });
  const R = radius, group = new THREE.Group(); group.name = 'drill-plate';
  // the body: a shallow dish turned on the wheel, its foot ring behind (a lathe round local x)
  const prof = [[0.001, -0.03], [R * 0.45, -0.035], [R * 0.47, -0.05], [R * 0.55, -0.05], [R * 0.57, -0.03], [R * 0.95, -0.01], [R, 0.015], [R * 0.97, 0.03], [R * 0.9, 0.02]];
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 28), BODY);
  body.rotation.z = -Math.PI / 2; group.add(body); // (the lathe's +y to +x: the face toward +x)
  const glaze = new THREE.Mesh(new THREE.CircleGeometry(R * 0.9, 28), GLAZE);
  glaze.rotation.y = Math.PI / 2; glaze.position.x = 0.021; group.add(glaze);
  // the bull: a raised boss of oxblood glaze
  const bull = new THREE.Mesh(new THREE.SphereGeometry(R * 0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ name: 'drill-bull', color: 0x8e2a1c, roughness: 0.25, emissive: 0x000000 }));
  bull.rotation.z = -Math.PI / 2; bull.scale.set(1, 0.45, 1); bull.position.x = 0.022; group.add(bull);
  return { group, bull };
}

/** The Index's lectern, built facing local +z (the reader stands there); about 0.6 by 0.5 m and 1.15 m high, as the stand-in's collider. */
export function indexLectern() {
  const group = new THREE.Group(); group.name = 'index-lectern';
  const wood = new THREE.MeshStandardMaterial({ name: 'lectern-wood', color: PALETTE.dark, roughness: 0.8 });
  triplanar(wood, { side: surfaceTexture('clay_floor'), strength: 0, foot: { tex: surfaceTexture('clay_floor'), height: 0.16 } }); // (its foot's skirt: the floor's clay creeping up the plinth, the owner's rule, R46)
  const add = (geo, pos, rx = 0) => { const m = new THREE.Mesh(geo, wood); m.position.set(...pos); m.rotation.x = rx; group.add(m); return m; };
  add(new THREE.BoxGeometry(0.56, 0.06, 0.46), [0, 0.03, 0]);                          // (the foot)
  add(new THREE.BoxGeometry(0.44, 0.05, 0.36), [0, 0.085, 0]);
  add(new THREE.LatheGeometry([[0.11, 0], [0.08, 0.06], [0.06, 0.12], [0.07, 0.5], [0.055, 0.82], [0.09, 0.9], [0.11, 0.95]].map(([r, y]) => new THREE.Vector2(r, y)), 10), [0, 0.11, 0]); // (the turned post)
  const tilt = 0.42; // (high at the back, low to the reader at +z)
  add(new THREE.BoxGeometry(0.66, 0.05, 0.48), [0, 1.1, 0], tilt);                      // (the desk, sloped to the reader)
  add(new THREE.BoxGeometry(0.66, 0.06, 0.03), [0, 1.0, 0.235], tilt);                  // (its ledge, that holds the book)
  mergeStatic(group); // (one draw for the wood)
  // the book: covers and pages lying on the desk, the pages lit faintly from inside
  const book = new THREE.Group(); book.position.set(0, 1.135, 0); book.rotation.x = tilt; group.add(book);
  const cover = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.015, 0.38), new THREE.MeshStandardMaterial({ name: 'lectern-cover', color: 0x4a1c14, roughness: 0.7 }));
  book.add(cover);
  const pageM = new THREE.MeshStandardMaterial({ name: 'lectern-pages', color: 0xeadcbc, roughness: 0.9, emissive: 0xf4e2b8, emissiveIntensity: 0.35 });
  for (const sx of [-1, 1]) { const pg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.025, 0.35), pageM); pg.position.set(sx * 0.135, 0.018, 0); pg.rotation.z = sx * -0.06; book.add(pg); }
  mergeStatic(book);
  // the Index's dial: two rings and their ticks in the Mind's lines, and a triangle inside (the Index's eye), drawn flat
  const pts = [], ring = (r, n) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0), new THREE.Vector3(Math.cos(b) * r, Math.sin(b) * r, 0)); } };
  ring(0.15, 40); ring(0.105, 32);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r1 = i % 3 ? 0.165 : 0.19; pts.push(new THREE.Vector3(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0), new THREE.Vector3(Math.cos(a) * r1, Math.sin(a) * r1, 0)); }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; pts.push(new THREE.Vector3(Math.cos(a) * 0.105, Math.sin(a) * 0.105, 0), new THREE.Vector3(Math.cos(a + 2.0944) * 0.105, Math.sin(a + 2.0944) * 0.105, 0)); }
  const dialGeo = new THREE.BufferGeometry().setFromPoints(pts).rotateX(-Math.PI / 2); // (lying in the page's plane, its face up off the paper)
  for (const p of pts) p.set(p.x, 0, -p.y); // (the same, flat, for its strokes)
  // projected from the book: in the book's own frame (its tilt), the print on the paper, the dial raised over it, the light between
  const P = LECTERN.projection, proj = new THREE.Group(); proj.name = 'index-projection';
  proj.position.copy(book.position); proj.rotation.x = tilt; group.add(proj);
  const spin = new THREE.Group(); proj.add(spin); // (the print and the dial turn together about the page's normal: one image and its source)
  const print = new THREE.LineSegments(dialGeo, mindLineMaterial({ opacity: P.printOpacity, depthTest: true, bright: 1 }));
  print.name = 'index-dial-print'; print.position.y = P.page; print.scale.setScalar(P.size * P.printScale);
  const dial = new THREE.LineSegments(dialGeo, mindLineMaterial({ opacity: 1, depthTest: true, bright: P.bright }));
  dial.name = 'index-dial'; dial.position.y = P.page + P.lift; dial.scale.setScalar(P.size); spin.add(print, dial);
  // (its lines keylined: strokes of the Mind's ink under them (the icons' hand, a light line keylined dark), that read over the bright page where a light line alone washes out)
  const strokeGeo = strokes(pts, P.stroke);
  const body = new THREE.Mesh(strokeGeo, mindFillMaterial({ opacity: P.strokeOpacity, depthTest: true, ink: P.strokeInk }));
  body.name = 'index-dial-strokes'; body.position.y = -0.0005; dial.add(body); dial.renderOrder = 1; // (the lines drawn over their strokes)
  const printed = new THREE.Mesh(strokeGeo, mindFillMaterial({ opacity: P.printInk, depthTest: true, ink: 1 })); // (and the print, inked on the paper)
  printed.name = 'index-dial-printed'; printed.position.y = -0.0005; print.add(printed); print.renderOrder = 1;
  const r1 = 0.15 * P.size, r0 = r1 * P.printScale; // (the main ring of the print, and of the dial: the light widens from one to the other)
  const cone = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, P.lift, 32, 1, true), mindFillMaterial({ opacity: P.coneOpacity, depthTest: true, ink: 0 }));
  cone.name = 'index-light'; cone.position.y = P.page + P.lift / 2; proj.add(cone);
  const circle = []; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, b = ((i + 1) / 48) * Math.PI * 2; circle.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), new THREE.Vector3(Math.cos(b), 0, Math.sin(b))); }
  const circleGeo = new THREE.BufferGeometry().setFromPoints(circle);
  const climbing = Array.from({ length: P.rings }, (_, i) => { const m = new THREE.LineSegments(circleGeo, mindLineMaterial({ opacity: 0, depthTest: true, bright: 1.1 })); m.name = `index-light-ring-${i}`; proj.add(m); return m; });
  return { group, update(t) {
    mindTick();
    spin.rotation.y = t * 0.25; dial.position.y = P.page + P.lift + Math.sin(t * 0.8) * 0.005; // (turning at a constant rate, a breath of a bob)
    climbing.forEach((m, i) => { // (rings of light leave the print and climb, widening, into the dial: faint at the page, gone at the top)
      const u = (t * P.climb + i / P.rings) % 1;
      m.position.y = P.page + u * P.lift; m.scale.setScalar(r0 + (r1 - r0) * u);
      m.material.uniforms.uOpacity.value = P.ringOpacity * Math.min(1, u / 0.12) * (1 - u);
    });
  } };
}

export class TestRoomDress {
  constructor(game) { this.game = game; this.done = false; this.t = 0; this.lectern = null; }
  /** Once the room stands: each drill target's stand-in discs give way to a plate (its `bull` swapped, so its lit() still lights it). */
  update(raw = 1 / 60) {
    this.t += raw; this.lectern?.update(this.t);
    if (this.done) return;
    const D = this.game.testroom?.drills; if (!D?.targets) return;
    for (const t of D.targets) {
      for (const o of [...t.mesh.children]) { t.mesh.remove(o); o.geometry?.dispose(); o.material?.dispose(); }
      const P = drillPlate(); P.group.rotation.y = Math.PI; t.mesh.add(P.group); t.bull = P.bull; // (the stand-in's group faces the mark down its -x)
    }
    const C = this.game.testroom.console; // (the lectern's stand-in group: its parts give way to the dressed lectern, the group and its place kept)
    if (C) {
      for (const o of [...C.children]) { C.remove(o); o.geometry?.dispose(); o.material?.dispose(); }
      this.lectern = indexLectern(); C.add(this.lectern.group);
    }
    this.done = true;
  }
}
