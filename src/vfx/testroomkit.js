// ---------------------------------------------------------------------------------------
// THE TESTING ROOM'S LOOK: what the room's bodies wear (Petra's room, src/world/testroom/; her stand-ins dressed here, as the Well's are
// in welldress.js, so the room's code stays hers). The room is the Workshop's own wing, so its things are the potters' too:
//
//   THE DRILL PLATE  a target is a thrown and fired plate: a terracotta body with a foot ring, its face glazed cream with two oxblood
//                    rings brushed on the wheel, and the bull a raised boss of oxblood glaze (the one to shoot glows in it, as the
//                    room's own lit() asks: the glaze lit from inside like the kiln's mouth). One painted face for every plate.
//
// Prior art: the potter's banding wheel (rings brushed on a turning plate are never quite round, never quite even), Japanese archery's
// mato (a plain paper target of concentric rings on a wooden hoop), and the clay pigeon (a fired thing made to be shot).
//
//   drillPlate(radius) -> { group, bull }        new TestRoomDress(game)   .update()   (dresses game.testroom once it stands)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

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

export class TestRoomDress {
  constructor(game) { this.game = game; this.done = false; }
  /** Once the room stands: each drill target's stand-in discs give way to a plate (its `bull` swapped, so its lit() still lights it). */
  update() {
    if (this.done) return;
    const D = this.game.testroom?.drills; if (!D?.targets) return;
    for (const t of D.targets) {
      for (const o of [...t.mesh.children]) { t.mesh.remove(o); o.geometry?.dispose(); o.material?.dispose(); }
      const P = drillPlate(); P.group.rotation.y = Math.PI; t.mesh.add(P.group); t.bull = P.bull; // (the stand-in's group faces the mark down its -x)
    }
    this.done = true;
  }
}
