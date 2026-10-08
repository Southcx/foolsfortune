// ---------------------------------------------------------------------------------------
// THE WORKBENCH'S STAGE 'crossing:shots' (the crossing's group): the shots' look, the Itano ribbons, the hurtbox and the telegraph mark
// (vfx/railshots.js, itano.js, telegraph.js) shown before the rail's runtime drives them, over the two grounds they must read on: the
// storm's gold sky and the black crude. In the rail's own frame (+Z ahead, the ship at the cruise height) and from its chase view:
//
//   a RING of astral shots opening from a point ahead, a three-armed SPIRAL of umbral shots, a WALL of mixed shots (astral, umbral,
//   outlined) with a gap in it coming down the rail; the ship firing full auto; eight LANCES fanned from its nose, overshooting and
//   homing on eight dummies with their ribbons; a TELEGRAPH closing on a dummy part every 2.2 real seconds; the hurtbox in the hull.
//   Every pattern is a formula of the stage's clock (Sparen's emitters: a ring, a multi-arm spiral, a wall with a gap), so it loops.
//
//   crossingShotsStage() -> Object3D (its loop on userData.tick(t); userData.bare: the workbench's floor and figure step out;
//   userData.view: where its camera starts, in its own frame)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RailShots } from '../vfx/railshots.js';
import { ItanoRibbons } from '../vfx/itano.js';
import { TelegraphMarks } from '../vfx/telegraph.js';
import { Sloop } from '../vfx/sloop.js';
import { COLOR } from '../progress/weather.js';

const CRUISE = 3, SHIP_SCALE = 0.24, HURT = 0.35; // (courier/ship/views.js CRUISE, ship.js SCALE, T.ship.hurt)
const small = (o) => { o.geometry.boundingBox = new THREE.Box3(new THREE.Vector3(-1, 0, -1), new THREE.Vector3(1, 0.1, 1)); o.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1); }; // (a backdrop the framing ignores)

/** The storm's sky as a backdrop: gold-white at the horizon, gold, pale violet at the top (Calissa's crossing look). */
function stormDome(r = 160) {
  const g = new THREE.SphereGeometry(r, 48, 24), p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  const stops = [[0, 0xf6e7c4], [0.18, 0xe9c06a], [0.45, 0xc99a5a], [0.75, 0xa996c4], [1, 0x8f86b8]];
  for (let i = 0; i < p.count; i++) {
    const h = Math.max(0, p.getY(i) / r); let k = 0; while (k < stops.length - 2 && h > stops[k + 1][0]) k++;
    const [h0, c0] = stops[k], [h1, c1] = stops[k + 1]; c.set(c0).lerp(new THREE.Color(c1), Math.min(1, (h - h0) / (h1 - h0)));
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10; small(m);
  return m;
}

/** The black crude as a backdrop: near-black, a breath of the Mind's violet toward the horizon (the rail's own sea, vfx/crudesea.js, is lit
 *  by the storm; the workbench's lamps would light it grey). */
function blackCrude(r = 160) {
  const g = new THREE.CircleGeometry(r, 48).rotateX(-Math.PI / 2), p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const k = Math.min(1, Math.hypot(p.getX(i), p.getZ(i)) / r); c.set(0x030206).lerp(new THREE.Color(0x1c1530), k * k); col.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })); small(m);
  return m;
}

export function crossingShotsStage() {
  const obj = new THREE.Group();
  obj.userData.bare = true;
  obj.userData.view = { pos: new THREE.Vector3(0, CRUISE + 2.2, -7.5), look: new THREE.Vector3(0, CRUISE + 1, 20) }; // (the chase view's rig)
  obj.add(stormDome());
  const sea = blackCrude(); obj.add(sea);
  // the ship and its hurtbox
  const ship = new Sloop(); ship.group.scale.setScalar(SHIP_SCALE); ship.group.position.set(0, CRUISE, 0); obj.add(ship.group);
  ship.polarity?.(COLOR.mirth);
  // the looks
  const S = new RailShots({ cap: 400, guns: 64 }), R = new ItanoRibbons({ max: 16 }), T = new TelegraphMarks();
  obj.add(S.mesh, R.mesh, T.mesh); S.color(COLOR.mirth);
  // the dummies: eight for the lances, one part for the telegraph
  const dm = new THREE.MeshStandardMaterial({ color: 0x3a3048, roughness: 0.35, metalness: 0.3, emissive: 0x1a1030 });
  const dummies = Array.from({ length: 8 }, (_, i) => { const a = (i / 7 - 0.5) * 2.2, m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), dm); m.position.set(Math.sin(a) * 9, CRUISE + 3 + Math.cos(i * 1.7) * 2, 20 + Math.cos(a) * 6); obj.add(m); return m; });
  const part = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), dm); part.position.set(7, CRUISE + 5, 34); obj.add(part);
  // the lances: fanned from the nose, overshooting, then turning onto their dummies (a stand-in for the runtime's navigation)
  const lances = dummies.map((d, i) => ({ id: i, on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), to: d, age: 0 }));
  const nose = new THREE.Vector3(0, CRUISE + 0.3, 0.9), _p = new THREE.Vector3(), _v = new THREE.Vector3(), _d = new THREE.Vector3();
  let pt = 0, volley = -1, tele = -1, gunN = 0;
  const guns = Array.from({ length: 64 }, () => ({ on: false, p: new THREE.Vector3(), age: 0 }));
  obj.userData.tick = (t) => {
    const dt = Math.min(0.05, Math.max(0, t - pt)); pt = t;
    ship.set({ sail: 1, glow: 0.6, t }); ship.group.position.y = CRUISE + Math.sin(t * 1.3) * 0.08; ship.group.rotation.z = Math.sin(t * 0.7) * 0.12;
    // the foes' shots
    let n = 0;
    for (let e = 0; e < 4; e++) { // (the ring: 20 astral shots, a ring every 1.2 s, opening in the view's plane as it comes down the rail)
      const born = (Math.floor(t / 1.2) - e) * 1.2, age = t - born; if (age < 0 || age > 4.4) continue;
      for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2 + born * 0.37; _v.set(Math.cos(a) * 5, Math.sin(a) * 5, -9); _p.set(0, CRUISE + 6, 34).addScaledVector(_v, age); S.set(n++, _p, _v, 'astral'); }
    }
    for (let j = 0; j < 120; j++) { // (the spiral: three arms of umbral shots, one each 0.075 s)
      const born = (Math.floor(t / 0.075) - Math.floor(j / 3)) * 0.075, age = t - born; if (age < 0 || age > 3) continue;
      const a = born * 1.7 + (j % 3) * (Math.PI * 2 / 3); _v.set(Math.cos(a) * 6.5, Math.sin(a) * 6.5, -5); _p.set(-7, CRUISE + 3.5, 26).addScaledVector(_v, age);
      S.set(n++, _p, _v, 'umbral');
    }
    for (let e = 0; e < 3; e++) { // (the wall: a sheet of mixed shots coming down the rail, a gap three ship widths wide in it)
      const born = (Math.floor(t / 1.6) - e) * 1.6, age = t - born; if (age < 0 || age > 3.3) continue; // (gone as it passes the ship: the rail's own cull is further, astern)
      const gap = Math.sin(born * 0.9) * 4;
      for (let cx = -10; cx <= 10; cx++) for (let cy = 0; cy < 3; cy++) {
        const x = cx * 1.15; if (Math.abs(x - gap) < 1.7) continue;
        _v.set(0, 0, -14); _p.set(x, 1.4 + cy * 1.7, 44).addScaledVector(_v, age);
        S.set(n++, _p, _v, (cx + cy) % 2 ? 'umbral' : 'astral', (cx * 3 + cy) % 5 === 0);
      }
    }
    S.count = n;
    // the ship's full auto: a needle each sixteenth of a 1.5 s bar
    if (Math.floor(t / 0.094) !== gunN) { gunN = Math.floor(t / 0.094); const g = guns.find((x) => !x.on); if (g) { g.on = true; g.age = 0; g.p.copy(nose).add(_d.set(Math.sin(gunN) * 0.15, 0, 0)); } }
    let m = 0;
    for (const g of guns) { if (!g.on) continue; g.age += dt; g.p.z += 70 * dt; if (g.age > 0.9) { g.on = false; continue; } S.gun(m++, g.p, _v.set(0, 0, 70)); }
    S.guns = m;
    S.hurtbox(_p.copy(ship.group.position), HURT);
    S.update(dt);
    // the volley: every 3.2 s, the eight lances, a sixteenth apart
    if (Math.floor(t / 3.2) !== volley) { volley = Math.floor(t / 3.2); lances.forEach((L) => { L.on = false; L.wait = L.id * 0.094; R.end(L.id); }); }
    for (const L of lances) {
      if (L.wait > 0) { L.wait -= dt; if (L.wait <= 0) { L.on = true; L.age = 0; L.p.copy(nose); const s = L.id - 3.5; L.v.set(s * 4.5, 9 + Math.abs(s) * 1.2, -4 + Math.abs(s) * 0.8); R.start(L.id, L.p); } continue; } // (fanned out and back: the overshoot)
      if (!L.on) continue;
      L.age += dt;
      const turn = Math.min(1, L.age * 1.6) * 7; _d.copy(L.to.position).sub(L.p); const dist = _d.length();
      L.v.lerp(_d.multiplyScalar(34 / Math.max(dist, 1e-3)), Math.min(1, dt * turn)); L.p.addScaledVector(L.v, dt); R.push(L.id, L.p);
      if (dist < 0.7 || L.age > 2.5) { L.on = false; R.end(L.id); L.to.scale.setScalar(1.35); }
    }
    for (const d of dummies) d.scale.lerp(_d.set(1, 1, 1), Math.min(1, dt * 6)); // (struck: it swells and settles, no flash)
    R.update(dt);
    // the telegraph: a part about to act, every 2.2 s, over 1.5 s
    if (Math.floor(t / 2.2) !== tele) { tele = Math.floor(t / 2.2); T.mark(part, 1.5, { radius: 1.2 }); }
    part.rotation.y += dt * 0.6; T.update(dt);
  };
  return obj;
}
