// ---------------------------------------------------------------------------------------
// THE SUNKEN CITY'S LOOK (plain name; Petra's first pass, Calissa's to take further): the plan of world/bluehole/city.js drawn in the
// blue hole's own glowing standard material (vfx/bluehole/look.js glowMaterial, so the depth's absorption and the drifting glow bands
// are the walls' too): the plaza a disc of laid flagstones; each wall a block of ashlar courses (a ruined one lower and ragged, an
// arched one two jambs and a lintel over a doorway); a column at every crossing with its base and capital, a few broken; the temple's
// three steps; and on its top the idol, a Lachrymite octahedron turning in its own light. One merged mesh for the stone, one for the
// crystals, one lamp lent by the light budget.
//
// Prior art: Thonis-Heracleion's drowned granite (Franck Goddio's photographs), Abzu's ruins lit from within, Deep Dive Dubai.
//
//   new CityLook(group, uTime, keep)   .update(t)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { cityPlan, CITY } from '../../world/bluehole/city.js';
import { glowMaterial, paint } from './look.js';
import { fbm } from '../../world/bluehole/shaft.js';

const STONE = [0.74, 0.68, 0.58];

export class CityLook {
  constructor(group, uTime, keep) {
    const P = cityPlan(), geos = [], crystal = [];
    const stone = (g, glow = 0) => paint(g, (x, y, z) => { const n = fbm(x * 0.6, y * 0.6, z * 0.6, 2), course = 0.9 + 0.1 * Math.sign(Math.sin(y * 5.5)); return [STONE[0] * course + n * 0.08, STONE[1] * course + n * 0.08, STONE[2] * course + n * 0.06, glow * Math.max(0, n), 0.55 + n * 0.3]; });
    const box = (w, h, d, x, y, z, glow = 0) => { const g = new THREE.BoxGeometry(w, h, d, Math.max(1, Math.round(w)), Math.max(1, Math.round(h * 1.5)), Math.max(1, Math.round(d))); g.translate(x, y, z); geos.push(stone(g, glow).toNonIndexed()); g.dispose(); };
    // the plaza: a disc, its top just at CITY.y
    const plaza = new THREE.CylinderGeometry(CITY.plaza, CITY.plaza - 1, 1, 48, 1); plaza.translate(0, CITY.y - 0.5, 0); geos.push(stone(plaza, 0.15).toNonIndexed()); plaza.dispose();
    for (const w of P.walls) {
      if (w.arch) { const along = w.w > w.d, L = along ? w.w : w.d, j = (L - 1.6) / 2; for (const s of [-1, 1]) { const o = s * (0.8 + j / 2); box(along ? j : w.w, w.h, along ? w.d : j, w.x + (along ? o : 0), w.y + w.h / 2, w.z + (along ? 0 : o)); } box(w.w, 0.6, w.d, w.x, w.y + w.h - 0.3, w.z, 0.3); }
      else box(w.w, w.h, w.d, w.x, w.y + w.h / 2, w.z);
    }
    for (const c of P.columns) {
      const shaft = new THREE.CylinderGeometry(0.32, 0.36, c.h, 10, 3); shaft.translate(c.x, CITY.y + c.h / 2, c.z); geos.push(stone(shaft).toNonIndexed()); shaft.dispose();
      box(0.95, 0.25, 0.95, c.x, CITY.y + 0.12, c.z); if (c.h > CITY.wall * 0.9) box(0.9, 0.3, 0.9, c.x, CITY.y + c.h + 0.15, c.z, 0.4);
      else crystal.push([c.x, CITY.y + c.h + 0.25, c.z, 0.22]); // (a broken column's stump: a crystal grown on it)
    }
    for (const t of P.temple) box(t.w, t.h, t.d, t.x, t.y + t.h / 2, t.z, 0.25);
    const g = mergeGeometries(geos); for (const x of geos) x.dispose(); g.computeVertexNormals();
    const mesh = new THREE.Mesh(keep(g), keep(glowMaterial(uTime, { rough: 0.95, glow: 1 }))); mesh.receiveShadow = true; group.add(mesh);
    // the crystals: on broken stumps and the idol
    const cg = [];
    for (const [x, y, z, r] of crystal) { const o = new THREE.OctahedronGeometry(r, 0); o.scale(1, 1.8, 1); o.translate(x, y + r, z); cg.push(o); }
    const cm = new THREE.MeshBasicMaterial({ color: 0x9ff0ff, fog: true });
    if (cg.length) { const mg = mergeGeometries(cg); for (const x of cg) x.dispose(); group.add(new THREE.Mesh(keep(mg), keep(cm))); }
    const idol = new THREE.Mesh(keep(new THREE.OctahedronGeometry(0.7, 0)), keep(new THREE.MeshBasicMaterial({ color: 0xffd36a, fog: true })));
    idol.scale.set(1, 1.6, 1); idol.position.set(P.idol.x, P.idol.y, P.idol.z); group.add(idol); this.idol = idol;
    const L = new THREE.PointLight(0xffd36a, 22, 26, 1.4); L.position.set(P.idol.x, P.idol.y + 0.5, P.idol.z); group.add(L); this.lamp = L;
  }
  update(t) { if (this.idol) { this.idol.rotation.y = t * 0.6; this.idol.position.y = cityPlan().idol.y + Math.sin(t * 1.3) * 0.15; this.lamp.intensity = 20 + 4 * Math.sin(t * 2.1); } }
}
