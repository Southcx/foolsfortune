// ---------------------------------------------------------------------------------------
// THE TESTING ROOM'S LOOK: what the room's bodies wear (Petra's room, src/world/testroom/; her stand-ins dressed here, as the Well's are
// in welldress.js, so the room's code stays hers). The room is the Workshop's own wing, so its things are the potters' too:
//
//   THE DRILL PLATE  a target is a thrown and fired plate: a terracotta body with a foot ring, its face glazed cream with two oxblood
//                    rings brushed on the wheel, and the bull a raised boss of oxblood glaze (the one to shoot glows in it, as the
//                    room's own lit() asks: the glaze lit from inside like the kiln's mouth). One painted face for every plate.
//
// Prior art: the potter's banding wheel (the plates); a church's lectern and a scriptorium's reading desk, and Metroid Prime's
// scan points and the Sheikah towers' terminals (a physical stand with its interface hovering over it). Also for the plates: the banding wheel (rings brushed on a turning plate are never quite round, never quite even), Japanese archery's
// mato (a plain paper target of concentric rings on a wooden hoop), and the clay pigeon (a fired thing made to be shot).
//
//   THE INDEX'S LECTERN  the console where the Index opens on its Testing page: a reading desk of the Workshop's dark wood on a turned
//                    post, an open book on it whose pages are lit faintly from inside (the Index awake), and over the book the Index's
//                    dial in the Mind's lines, turning slowly (the System's reading laid over a physical thing: docs/plans/OVERLAY.md)
//
//   drillPlate(radius) -> { group, bull }   indexLectern() -> { group, update(t) }   new TestRoomDress(game)   .update(raw)   (dresses game.testroom)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mindLineMaterial } from './labradorite.js';
import { mergeStatic } from '../render/merge.js';
import { triplanar, surfaceTexture } from '../render/triplanar.js';
import { PALETTE } from '../core/config.js';

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
  // the Index's dial standing over the open book: two rings and their ticks in the Mind's lines, turning slowly at a constant rate
  const pts = [], ring = (r, n) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0), new THREE.Vector3(Math.cos(b) * r, Math.sin(b) * r, 0)); } };
  ring(0.15, 40); ring(0.105, 32);
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r1 = i % 3 ? 0.165 : 0.19; pts.push(new THREE.Vector3(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0), new THREE.Vector3(Math.cos(a) * r1, Math.sin(a) * r1, 0)); }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; pts.push(new THREE.Vector3(Math.cos(a) * 0.105, Math.sin(a) * 0.105, 0), new THREE.Vector3(Math.cos(a + 2.0944) * 0.105, Math.sin(a + 2.0944) * 0.105, 0)); } // (a triangle inside: the Index's eye)
  const dial = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), mindLineMaterial({ opacity: 0.9, depthTest: true, bright: 1.2 }));
  dial.name = 'index-dial'; dial.scale.setScalar(1.15); dial.position.set(0, 1.42, -0.1); group.add(dial); // (standing over the book, facing the reader: against the dark, not the pages; its top under the interact chevron's 1.75 m)
  return { group, update(t) { dial.rotation.z = t * 0.25; dial.position.y = 1.42 + Math.sin(t * 0.8) * 0.012; } };
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
