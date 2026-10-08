// ---------------------------------------------------------------------------------------
// THE ENCOUNTERS' TABLEAUX: what is out on the crude when an encounter at sea is filmed (docs/plans/PASSAGE.md section 13; Espada's cast,
// docs/LORE.md "The encounters at sea"; the director is vfx/encounters/film.js, the cameras vfx/encounters/sequences.js). At the rail's
// scale (the sloop a 1.7 m ship flying 3 m over the swell), each tableau in its own frame (+Z along the rail, x across as the rail's,
// y up from the surface), with the thing the camera closes on as its `subject`:
//
//   ghostConvoy   THE DEAD RECKONERS: three ships of the Vessoul's own classes (a galleon, a frigate, a galleon) gone to ghosts, their
//                 hulls a breath of pale glass and every edge drawn in the Mind's labradorite line, a lamp astern each, in banks of
//                 fog (Wind Waker's ghost ship; the Flying Dutchman; the line as the reckoning's own pencil)
//   lettysCutter  THE LAST WORD: Letty Marque's revenue cutter in nacre and the King's green (vfx/margarite.js: the King's palette), a
//                 gaff main and a jib on one tall mast, a long bowsprit, the King's colours; Letty at the bow, Poll on her shoulder
//   lightWhale    THE CANTOR: a whale of light under the crude (a Figment, a stray), its glow through the surface and the rings of
//                 its song on it; its back breaks the surface once, a breath of light from its blowhole (Ecco, Abzû, Fantasia 2000)
//   castaway      HAP LAGAN, AND BOB: a lashed raft, a stub mast with a rag, a lamp; Hap in an oilskin and a sou'wester, waving; Bob,
//                 the Tulpa, a cork float bobbing on its line (lagan: what sinks with a buoy tied to it, so somebody comes back)
//   pursersBarge  THE BOURSE: the King's barge at anchor in white and sage under a canopy, lanterns lit with aqua regia's gold, casks
//                 stacked, the posted board, the Purser at the counter (vfx/margarite.js buildPurser), its chain down into the crude
//   mirrorSea     THE GLASS: your double, your own hull in silver with the Mind's line on every edge, sailing beside you (the film lays
//                 the sea down flat as glass while it plays)
//   driftBottle   A DRIFT BOTTLE: a green glass bottle with a scroll in it, corked, bobbing in a shaft of light from the clouds
//
// Every material is one the game already compiles (the flat standard, the nacre of Margarite's people, the additive glows, a soft
// sprite's basic map, the Mind's line, the sloop's sail), and the film compiles a passage's tableaux under the cast-off's cover.
// Prior art per tableau above; and FTL's and Sunless Sea's events (a picture, then the choice), Skies of Arcadia's discoveries.
//
//   buildTableau(id, { env, hull, feel }) -> { group, subject, tick(t, ctx), dispose(), motion: 'world'|'alongside', at: [x, z], vz }
//   (ctx: { bob (the crude's height under it), camera, k: 0..1 of the film })   A tableau's own frame is the rail's turned (+Z along it), but its
//   +x is the rail's -x (the rail's frame is mirrored across: stage.js toWorld), so a tableau on the rail's left meets the ship toward its -x
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { shipLook } from '../shipclasses.js';
import { jarHull, sailMaterial } from '../sloop.js';
import { mindLineMaterial } from '../labradorite.js';
import { buildLetty, buildPoll, buildPurser, nacre } from '../margarite.js';
import { COLOR } from '../../progress/weather.js';

const K = { white: 0xf2efe6, sage: 0x8fae9c, green: 0x24463a, gold: 0xe7b83f, red: 0xb8382a, wood: 0x6b4a32, cork: 0xc49a6c, oil: 0xc9a13b, regia: 0xffc670 };

let soft = null;
/** A soft round sprite (white, its alpha falling off): the fog's banks, the lamps' halos, the light under the crude. */
function softTexture() {
  if (soft) return soft;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  soft = new THREE.CanvasTexture(c); soft.colorSpace = THREE.SRGBColorSpace; soft.generateMipmaps = true; soft.minFilter = THREE.LinearMipmapLinearFilter;
  return soft;
}

/** What a tableau is made of, tracked to be freed. */
function kit(env) {
  const mats = [], geos = [], own = (o) => { (o.isMaterial ? mats : geos).push(o); return o; };
  const std = (color, o = {}) => own(new THREE.MeshStandardMaterial({ color, roughness: 0.7, flatShading: true, ...o }));
  const glow = (color, opacity = 0.8, o = {}) => own(new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, ...o }));
  const sprite = (color, opacity = 0.5, additive = false) => own(new THREE.MeshBasicMaterial({ color, map: softTexture(), transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
  const mesh = (parent, geo, mat, x = 0, y = 0, z = 0) => { own(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  return { mats, geos, own, std, glow, sprite, mesh, env, dispose: () => { for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); } };
}

/** A soft quad that turns to face the camera (fog, a halo). */
function billboard(k, parent, mat, size, x, y, z) { const m = k.mesh(parent, new THREE.PlaneGeometry(size, size), mat, x, y, z); m.userData.face = true; return m; }
const faceAll = (group, camera) => { if (camera) group.traverse((o) => { if (o.userData.face) o.quaternion.copy(camera.quaternion).premultiply(_qi.copy(o.parent.getWorldQuaternion(_q)).invert()); }); };
const _q = new THREE.Quaternion(), _qi = new THREE.Quaternion(), _p = new THREE.Vector3();

/** A ship of the Vessoul's turned to a ghost or a double: every surface one material, every edge in the Mind's line, no outline. */
function haunt(k, look, fill, line) {
  const hosts = [];
  look.group.traverse((o) => { if (o.isMesh) hosts.push(o); });
  for (const o of hosts) {
    if (o.userData.isOutline || o.userData.caustics) { o.visible = false; continue; }
    if (o.material?.blending === THREE.AdditiveBlending) continue; // (its drive's glow and the keel's light stay its own)
    o.material = fill;
    if (o.geometry && !o.userData.noEdges) { const e = new THREE.LineSegments(k.own(new THREE.EdgesGeometry(o.geometry, 28)), line); o.add(e); }
  }
  if (look.line) look.line.material = line;
}

// ---------------------------------------------------------------------------------------- the seven
function ghostConvoy(k, { feel }) {
  const g = new THREE.Group(), fill = k.glow(0x9fe8d8, 0.12, { side: THREE.DoubleSide }), line = k.own(mindLineMaterial({ opacity: 0.85, depthTest: true, bright: 1.2 }));
  const ships = [['galleon', 0], ['frigate', -15], ['galleon', -30]].map(([id, z], i) => {
    const s = shipLook(id, { env: k.env }); s.group.scale.setScalar(0.38); s.group.position.set(i % 2 ? 1.5 : 0, 0, z); haunt(k, s, fill, line); s.set({ sail: 0.7, side: -1, glow: 0.3 });
    const lamp = k.mesh(s.group, new THREE.SphereGeometry(0.35, 8, 6), k.glow(0xbffff0, 0.9), 0, 3, -s.length * 0.52);
    billboard(k, s.group, k.sprite(0x9fffe8, 0.55, true), 4, 0, 3, -s.length * 0.55);
    g.add(s.group); return { s, lamp, z };
  });
  // the fog: sheets lying over the swell's crests (a quad standing in the crude would show its cut), and a few banks higher up
  const fogs = Array.from({ length: 6 }, (_, i) => { const m = k.mesh(g, new THREE.PlaneGeometry(26, 26), k.sprite(0xb8b0c8, 0.42), -4 + ((i * 7) % 11), 0.9 + (i % 3) * 0.35, 6 - i * 9); m.rotation.x = -Math.PI / 2; return m; });
  for (let i = 0; i < 5; i++) fogs.push(billboard(k, g, k.sprite(0xb8b0c8, 0.42), 7, -5 + ((i * 5) % 11), 4.2 + (i % 2) * 0.8, 4 - i * 9));
  return { group: g, subject: ships[2].s.group, motion: 'alongside', at: [10, 26], vz: -4,
    tick(t, ctx) {
      if (ctx.camera) for (const f of fogs) { const d = f.getWorldPosition(_p).distanceTo(ctx.camera.position); f.material.opacity = 0.42 * THREE.MathUtils.smoothstep(d, 5, 16); } // (a bank the camera is in is never drawn: a quad cut by the near plane is a hard edge)
      ships.forEach(({ s, lamp }, i) => { s.group.position.y = 0.25 * Math.sin(t * 0.7 + i); s.group.rotation.z = 0.05 * Math.sin(t * 0.5 + i * 2); lamp.scale.setScalar(0.85 + 0.15 * Math.sin(t * 5 + i)); }); },
    dispose: () => ships.forEach(({ s }) => s.dispose()) };
}

function lettysCutter(k) {
  const g = new THREE.Group(), hull = k.own(nacre(0xeae4da)), green = k.std(K.green, { roughness: 0.5 }), gold = k.std(K.gold, { metalness: 0.6, roughness: 0.35, envMap: k.env });
  const L = 3.2, prof = [[0, 0], [0.04, 0.3], [0.15, 0.62], [0.35, 0.92], [0.55, 1], [0.75, 0.95], [0.9, 0.82], [1, 0.7]];
  const h = k.mesh(g, jarHull(prof, { length: L, beam: 1.0, draft: 0.35, sheer: [0.32, 0.22, 0.12] }), hull); h.castShadow = true;
  k.mesh(g, new THREE.BoxGeometry(0.06, 0.08, L * 0.9), green, 0.46, 0.22, 0).rotation.y = 0.03; k.mesh(g, new THREE.BoxGeometry(0.06, 0.08, L * 0.9), green, -0.46, 0.22, 0).rotation.y = -0.03;
  k.mesh(g, new THREE.BoxGeometry(0.8, 0.04, L * 0.7), k.std(0xd8cfbe), 0, 0.3, -0.1);
  const mast = 4.0, mz = 0.35; k.mesh(g, new THREE.CylinderGeometry(0.03, 0.05, mast, 6), green, 0, mast / 2 + 0.3, mz);
  k.mesh(g, new THREE.CylinderGeometry(0.02, 0.02, 1.8, 5), gold, 0, 0.5, L * 0.5 + 0.6).rotation.x = Math.PI / 2 - 0.1;
  // the gaff main (luff up the mast, foot along the boom, the gaff peaked up) and the jib, in the sloop's own sail
  const main = new THREE.PlaneGeometry(1, 1, 6, 6); main.translate(0.5, 0.5, 0); const mp = main.attributes.position;
  for (let i = 0; i < mp.count; i++) { const u = mp.getX(i), v = mp.getY(i); mp.setXYZ(i, 0, 0.55 + v * (mast * 0.82 - 0.25) + u * v * 0.9, -u * (2.1 - 0.5 * v)); }
  main.computeVertexNormals(); const sm = k.own(sailMaterial(new THREE.DataTexture(new Uint8Array(4), 1, 1)));
  const ms = k.mesh(g, main, sm, 0, 0, mz); ms.userData.noEdges = true;
  const jib = new THREE.PlaneGeometry(1, 1, 4, 6); jib.translate(0.5, 0.5, 0); const jp = jib.attributes.position;
  for (let i = 0; i < jp.count; i++) { const u = jp.getX(i), v = jp.getY(i); jp.setXYZ(i, 0, 0.45 + v * (mast * 0.72), (L * 0.5 + 1.2 - mz) * (1 - v) - u * (1 - v) * 1.1); }
  jib.computeVertexNormals(); k.mesh(g, jib, sm, 0, 0, mz);
  const flag = k.mesh(g, new THREE.PlaneGeometry(0.7, 0.42), k.std(K.green, { side: THREE.DoubleSide, flatShading: false }), 0, mast + 0.35, mz - 0.4); flag.rotation.y = Math.PI / 2;
  k.mesh(flag, new THREE.CircleGeometry(0.12, 10), k.std(K.gold, { side: THREE.DoubleSide, flatShading: false }), 0, 0, 0.005);
  // Letty at the bow, Poll on her shoulder (life size 1.7 m, here a third of it)
  const Lt = buildLetty(), Po = buildPoll(); Lt.parts.shoulder?.add(Po.group); Lt.group.scale.setScalar(0.3); Lt.group.position.set(0.1, 0.32, L * 0.32); Lt.group.rotation.y = -Math.PI / 2 + 0.3; g.add(Lt.group);
  for (const o of [Lt.group]) o.traverse((c) => { if (c.material) for (const m of [].concat(c.material)) k.own(m); if (c.geometry) k.own(c.geometry); });
  return { group: g, subject: Lt.group, motion: 'alongside', at: [-4.2, -9], vz: 3.5,
    tick(t, ctx) {
      sm.userData.u.uFill.value = 0.8; sm.userData.u.uSide.value = 1; sm.userData.u.uT.value = t;
      g.rotation.z = 0.06 + 0.03 * Math.sin(t * 0.9); g.position.y = (ctx.bob ?? 0) * 0.8;
      if (Lt.parts.armR) Lt.parts.armR.rotation.x = -2.2 + 0.25 * Math.sin(t * 4); // (a hand up, hailing)
      Po.group.rotation.y = 0.4 * Math.sin(t * 2.3);
    } };
}

function lightWhale(k, { feel }) {
  const g = new THREE.Group(), col = new THREE.Color(feel ? COLOR[feel] : 0xcfe8ff).lerp(_w.set(0xffffff), 0.45);
  const body = new THREE.Group(); g.add(body);
  const prof = [[0, 0], [0.012, 0.36], [0.04, 0.62], [0.1, 0.86], [0.22, 1], [0.38, 0.96], [0.55, 0.78], [0.72, 0.48], [0.86, 0.22], [1, 0.1]]; // (head first: a humpback's long tapering body)
  const len = 16, lathe = new THREE.LatheGeometry(prof.map(([u, r]) => new THREE.Vector2(r * 1.7, (1 - u) * len - len / 2)), 16); lathe.rotateX(Math.PI / 2); lathe.scale(1, 0.62, 1);
  const bright = k.glow(col, 0.55, { side: THREE.DoubleSide }), through = k.glow(col, 0.07, { depthTest: false });
  k.mesh(body, lathe, bright); k.mesh(body, lathe, through).renderOrder = 2;
  const fluke = new THREE.Shape(); fluke.moveTo(0, 0); fluke.quadraticCurveTo(1.6, 0.5, 2.6, 1.4); fluke.quadraticCurveTo(1.8, 0.5, 1.6, -0.1); fluke.quadraticCurveTo(0.8, 0.1, 0, -0.4); fluke.quadraticCurveTo(-0.8, 0.1, -1.6, -0.1); fluke.quadraticCurveTo(-1.8, 0.5, -2.6, 1.4); fluke.quadraticCurveTo(-1.6, 0.5, 0, 0);
  const fg = new THREE.ShapeGeometry(fluke, 6); fg.rotateX(-Math.PI / 2); fg.scale(1.4, 1, 1.4); const tail = new THREE.Group(); tail.position.z = -len / 2 + 0.2; body.add(tail);
  k.mesh(tail, fg, bright, 0, 0, 0).rotation.y = Math.PI; k.mesh(tail, fg, through).rotation.y = Math.PI;
  for (const s of [-1, 1]) { const fin = k.mesh(body, new THREE.BoxGeometry(5.2, 0.08, 0.8), bright, s * 3.6, -0.5, len * 0.2); fin.rotation.z = s * -0.3; fin.rotation.y = s * 0.55; } // (a humpback's long pectorals, a third of its length)
  const line = k.own(mindLineMaterial({ opacity: 0.18, depthTest: false, bright: 1.2 })); body.add(new THREE.LineSegments(k.own(new THREE.EdgesGeometry(lathe, 12)), line));
  // its light on the surface, the rings of its song, its breath
  const patch = k.mesh(g, new THREE.PlaneGeometry(1, 1), k.sprite(col, 0.55, true)); patch.rotation.x = -Math.PI / 2; patch.scale.set(9, 20, 1);
  const ringM = k.glow(col, 0.6, { side: THREE.DoubleSide }), rings = Array.from({ length: 4 }, () => { const r = k.mesh(g, new THREE.RingGeometry(0.97, 1, 48), ringM.clone()); k.own(r.material); r.rotation.x = -Math.PI / 2; return r; });
  const breath = Array.from({ length: 10 }, (_, i) => billboard(k, g, k.sprite(col, 0.7, true), 1.2, 0, 0, len * 0.28 + (i % 3) * 0.1));
  return { group: g, subject: body, motion: 'alongside', at: [-2.6, 8], vz: 0.8,
    tick(t, ctx) {
      const k01 = ctx.k ?? (t % 6) / 6, rise = Math.max(0, Math.sin(Math.PI * THREE.MathUtils.clamp((k01 - 0.35) / 0.5, 0, 1))); // (the back breaks the surface in the film's second half)
      body.rotation.x = 0.12 * Math.cos(t * 0.6) - 0.25 * (rise - 0.5) * (k01 > 0.35 ? 1 : 0);
      body.position.set(0, -2.8 + 2.25 * rise, 0); // (at its height only the back clears the crude)
      tail.rotation.x = 0.35 * Math.sin(t * 1.4);
      patch.material.opacity = 0.35 + 0.25 * (1 - rise);
      patch.position.set(0, 0.7, 0); // (over the swell's crests, which would cut it)
      rings.forEach((r, i) => { const a = ((t * 0.55 + i / rings.length) % 1); r.position.set(0, 0.6, len * 0.2); r.scale.setScalar(1 + a * 14); r.material.opacity = 0.32 * (1 - a) ** 1.5; });
      breath.forEach((b, i) => { const a = (t * 0.9 + i / breath.length) % 1, on = rise > 0.6 ? 1 : 0; b.position.set(Math.sin(i * 2.4) * 0.4 * a, body.position.y + 1.1 + a * 3.2, len * 0.28); b.scale.setScalar(0.6 + a * 1.8); b.material.opacity = on * 0.6 * (1 - a); });
    } };
}

function castaway(k) {
  const g = new THREE.Group(), wood = k.std(K.wood), rope = k.std(0xb79a6a), oil = k.std(K.oil, { roughness: 0.5 }), skin = k.std(0xd9b08c), dark = k.std(0x2a2420);
  for (let i = 0; i < 5; i++) k.mesh(g, new THREE.BoxGeometry(0.24, 0.12, 1.5), wood, -0.52 + i * 0.26, 0.04, (i % 2) * 0.05).rotation.y = (i - 2) * 0.02;
  for (const z of [-0.5, 0.5]) k.mesh(g, new THREE.BoxGeometry(1.4, 0.14, 0.06), rope, 0, 0.08, z);
  k.mesh(g, new THREE.CylinderGeometry(0.03, 0.04, 1.3, 5), wood, 0.45, 0.7, -0.5);
  const rag = k.mesh(g, new THREE.PlaneGeometry(0.4, 0.3, 4, 1), k.std(0xd8cfbe, { side: THREE.DoubleSide, flatShading: false }), 0.45, 1.18, -0.3); rag.rotation.y = Math.PI / 2;
  k.mesh(g, new THREE.BoxGeometry(0.1, 0.14, 0.1), k.std(K.gold, { metalness: 0.5 }), -0.45, 0.17, -0.55); k.mesh(g, new THREE.SphereGeometry(0.05, 6, 4), k.glow(0xffc670, 0.95), -0.45, 0.18, -0.55);
  const halo = billboard(k, g, k.sprite(0xffb85c, 0.6, true), 0.8, -0.45, 0.2, -0.55);
  // Hap Lagan: sat on the raft in an oilskin and a sou'wester, waving
  const hap = new THREE.Group(); hap.position.set(-0.1, 0.1, 0.05); hap.rotation.y = -2.3; g.add(hap); // (turned to the ship coming up astern: a set's own +x is the rail's -x, so from this side the ship is toward its -x)
  k.mesh(hap, new THREE.CylinderGeometry(0.13, 0.18, 0.42, 8), oil, 0, 0.22, 0);
  k.mesh(hap, new THREE.SphereGeometry(0.1, 8, 6), skin, 0, 0.53, 0.02);
  k.mesh(hap, new THREE.CylinderGeometry(0.17, 0.2, 0.03, 10), oil, 0, 0.6, -0.02).rotation.x = -0.15; k.mesh(hap, new THREE.ConeGeometry(0.1, 0.12, 8), oil, 0, 0.66, 0);
  for (const s of [-1, 1]) k.mesh(hap, new THREE.BoxGeometry(0.09, 0.08, 0.36), dark, s * 0.07, 0.05, 0.2);
  const arm = new THREE.Group(); arm.position.set(0.15, 0.36, 0); hap.add(arm); k.mesh(arm, new THREE.CylinderGeometry(0.035, 0.035, 0.3, 5), oil, 0, 0.15, 0);
  k.mesh(hap, new THREE.CylinderGeometry(0.035, 0.035, 0.28, 5), oil, -0.15, 0.25, 0.06).rotation.x = 0.6;
  // Bob: a cork float on its line, red cap, white band, a little stick
  const bob = new THREE.Group(); g.add(bob);
  k.mesh(bob, new THREE.CylinderGeometry(0.11, 0.09, 0.2, 10), k.std(K.cork), 0, 0, 0); k.mesh(bob, new THREE.SphereGeometry(0.11, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), k.std(K.red, { roughness: 0.4 }), 0, 0.1, 0);
  k.mesh(bob, new THREE.CylinderGeometry(0.112, 0.112, 0.04, 10), k.std(0xf2efe6), 0, 0.04, 0); k.mesh(bob, new THREE.CylinderGeometry(0.01, 0.01, 0.22, 4), wood, 0, 0.3, 0);
  const tether = k.mesh(g, new THREE.CylinderGeometry(0.006, 0.006, 1, 4), rope); // (Bob's line: a thin rope, the raft's own material)
  const from = new THREE.Vector3(-0.6, 0.12, 0.6), up = new THREE.Vector3(0, 1, 0);
  return { group: g, subject: hap, motion: 'world', at: [-3.6, 92], vz: 0,
    tick(t, ctx) {
      const b = ctx.bob ?? 0; g.position.y = b; g.rotation.set(0.05 * Math.sin(t * 1.1), 0, 0.06 * Math.sin(t * 0.8));
      arm.rotation.z = -2.4 + 0.5 * Math.sin(t * 6); halo.material.opacity = 0.45 + 0.15 * Math.sin(t * 9);
      bob.position.set(-0.95, 0.04 + 0.09 * Math.sin(t * 3.1), 0.7); bob.rotation.z = 0.25 * Math.sin(t * 2.3); // (it bobs: the pun is the name)
      _p.subVectors(bob.position, from); tether.position.copy(from).addScaledVector(_p, 0.5); tether.scale.y = _p.length(); tether.quaternion.setFromUnitVectors(up, _p.normalize());
      rag.rotation.y = Math.PI / 2 + 0.3 * Math.sin(t * 3);
    } };
}

function pursersBarge(k) {
  const g = new THREE.Group(), white = k.std(K.white, { roughness: 0.5 }), sage = k.std(K.sage), gold = k.std(K.gold, { metalness: 0.6, roughness: 0.35, envMap: k.env }), wood = k.std(0x4b3524);
  k.mesh(g, new THREE.BoxGeometry(2.4, 0.5, 5.2), white, 0, 0.05, 0);
  for (const s of [-1, 1]) k.mesh(g, new THREE.BoxGeometry(2.0, 0.42, 0.6), white, 0, 0.05, s * 2.85).rotation.x = s * 0.5; // (the barge's raked ends)
  k.mesh(g, new THREE.BoxGeometry(2.46, 0.08, 5.26), sage, 0, 0.32, 0);
  for (const [x, z] of [[-1, -1.8], [1, -1.8], [-1, 1.6], [1, 1.6]]) k.mesh(g, new THREE.CylinderGeometry(0.04, 0.04, 1.6, 6), gold, x, 1.1, z);
  const canopy = k.mesh(g, new THREE.CylinderGeometry(1.25, 1.25, 3.6, 12, 1, true, 0, Math.PI), k.std(K.sage, { side: THREE.DoubleSide }), 0, 1.9, -0.1); canopy.rotation.x = Math.PI / 2; canopy.rotation.z = Math.PI / 2; canopy.scale.set(1, 1, 0.45);
  k.mesh(g, new THREE.BoxGeometry(0.3, 0.3, 1.3), white, 0.55, 0.5, 0.1); k.mesh(g, new THREE.BoxGeometry(0.36, 0.04, 1.36), gold, 0.55, 0.67, 0.1); // (the counter before the Purser, toward the rail)
  const board = k.mesh(g, new THREE.BoxGeometry(0.7, 0.5, 0.04), white, 0.7, 1.3, -1.7); k.mesh(board, new THREE.PlaneGeometry(0.56, 0.36), k.std(0xefe6d2), 0, 0, 0.025);
  for (let i = 0; i < 5; i++) { const c = k.mesh(g, new THREE.CylinderGeometry(0.17, 0.17, 0.4, 10), wood, -0.75 + (i % 3) * 0.36, 0.55 + Math.floor(i / 3) * 0.34, -1.3 - (i % 2) * 0.1); c.rotation.z = Math.PI / 2; }
  const lanterns = [];
  for (const [x, z] of [[-1, -1.8], [1, -1.8], [-1, 1.6], [1, 1.6]]) {
    k.mesh(g, new THREE.ConeGeometry(0.12, 0.1, 6), gold, x, 2.0, z); k.mesh(g, new THREE.CylinderGeometry(0.09, 0.09, 0.03, 6), gold, x, 1.72, z);
    const flame = k.mesh(g, new THREE.SphereGeometry(0.08, 8, 6), k.glow(K.regia, 1), x, 1.84, z);
    lanterns.push({ flame, halo: billboard(k, g, k.sprite(K.regia, 0.9, true), 2.4, x, 1.84, z) });
  }
  // the chain down into the crude
  for (let i = 0; i < 6; i++) { const l = k.mesh(g, new THREE.TorusGeometry(0.08, 0.025, 4, 8), k.std(0x3a3632, { metalness: 0.6 }), 0, 0.2 - i * 0.16, 2.9 + i * 0.06); l.rotation.y = (i % 2) * Math.PI / 2; }
  const P = buildPurser(); P.group.scale.setScalar(0.42); P.group.position.set(0, 0.36, 0.1); P.group.rotation.y = Math.PI / 2; g.add(P.group);
  P.group.traverse((c) => { if (c.material) for (const m of [].concat(c.material)) k.own(m); if (c.geometry) k.own(c.geometry); });
  return { group: g, subject: P.group, motion: 'world', at: [5.6, 92], vz: 0,
    tick(t, ctx) {
      g.position.y = (ctx.bob ?? 0) * 0.5; g.rotation.set(0.02 * Math.sin(t * 0.6), -0.15, 0.025 * Math.sin(t * 0.5));
      lanterns.forEach((L, i) => { const f = 0.85 + 0.15 * Math.sin(t * 7 + i * 1.7); L.flame.scale.setScalar(f); L.halo.material.opacity = 0.8 * f; });
    } };
}

function mirrorSea(k, { hull = 'sloop' }) {
  const s = shipLook(hull, { env: k.env }), silver = k.std(0xdfe5ee, { metalness: 1, roughness: 0.12, envMap: k.env }), line = k.own(mindLineMaterial({ opacity: 0.9, depthTest: true, bright: 1.3 }));
  haunt(k, s, silver, line); s.group.scale.setScalar(0.24);
  const g = new THREE.Group(); g.add(s.group);
  return { group: g, subject: s.group, motion: 'alongside', at: [3.2, -3], vz: 1.1, calm: 1,
    tick(t, ctx) {
      s.group.position.set(0, 3 + 0.25 * Math.sin(t * 1.3), 0); s.group.rotation.set(0.04 * Math.sin(t * 1.1), 0, -0.12 * Math.sin(t * 0.8));
      s.set({ sail: 1, side: 1, glow: 0.8, t });
    },
    dispose: () => s.dispose() };
}

function driftBottle(k) {
  const g = new THREE.Group(), prof = [[0, 0], [0.08, 0.95], [0.5, 1], [0.62, 0.95], [0.72, 0.5], [0.92, 0.36], [1, 0.4]];
  const bottle = new THREE.Group(); g.add(bottle);
  const glass = k.std(0x5fa070, { transparent: true, opacity: 0.55, roughness: 0.1, metalness: 0.1, envMap: k.env, depthWrite: false });
  const lg = new THREE.LatheGeometry(prof.map(([u, r]) => new THREE.Vector2(Math.max(0.001, r * 0.075), u * 0.34)), 14); lg.translate(0, -0.17, 0);
  k.mesh(bottle, lg, glass).renderOrder = 3;
  k.mesh(bottle, new THREE.CylinderGeometry(0.026, 0.022, 0.05, 8), k.std(K.cork), 0, 0.18, 0);
  k.mesh(bottle, new THREE.CylinderGeometry(0.035, 0.035, 0.14, 8), k.std(0xefe6d2), 0, -0.04, 0).rotation.z = 0.08;
  k.mesh(bottle, new THREE.CylinderGeometry(0.037, 0.037, 0.02, 8), k.std(K.red), 0, -0.04, 0);
  bottle.rotation.z = Math.PI / 2 - 0.35;
  const shaft = k.mesh(g, new THREE.CylinderGeometry(0.5, 2.2, 40, 16, 1, true), k.glow(0xfff0c8, 0.035), 0, 20, 0); shaft.renderOrder = 1;
  const pool = k.mesh(g, new THREE.PlaneGeometry(1, 1), k.sprite(0xfff0c8, 0.3, true), 0, 0.5, 0); pool.rotation.x = -Math.PI / 2; pool.scale.setScalar(3.2);
  const glints = Array.from({ length: 6 }, (_, i) => billboard(k, g, k.sprite(0xffffff, 0.8, true), 0.18, Math.cos(i) * 0.6, 0.05, Math.sin(i * 1.7) * 0.6));
  return { group: g, subject: bottle, motion: 'world', at: [-3, 88], vz: 0,
    tick(t, ctx) {
      const b = ctx.bob ?? 0; bottle.position.y = b + 0.03 + 0.03 * Math.sin(t * 2.2); bottle.rotation.x = 0.2 * Math.sin(t * 1.3); bottle.rotation.y = 0.3 * Math.sin(t * 0.4);
      glints.forEach((s, i) => { s.material.opacity = Math.max(0, Math.sin(t * 3 + i * 2.1)) * 0.8; s.position.y = b + 0.05; });
      shaft.material.opacity = 0.03 + 0.01 * Math.sin(t * 0.7); // (a breath of light, never a pillar)
    } };
}

const TABLEAUX = { ghostConvoy, lettysCutter, lightWhale, castaway, pursersBarge, mirrorSea, driftBottle };
export const TABLEAU_IDS = Object.keys(TABLEAUX);
const _w = new THREE.Color();

export function buildTableau(id, { env = null, hull = 'sloop', feel = null } = {}) {
  const make = TABLEAUX[id]; if (!make) return null;
  const k = kit(env), set = make(k, { hull, feel });
  set.group.traverse((o) => { o.userData.zoneFree = true; if (o.isMesh) o.frustumCulled = false; });
  const tick = set.tick, own = set.dispose;
  set.tick = (t, ctx = {}) => { tick(t, ctx); faceAll(set.group, ctx.camera); };
  set.dispose = () => { set.group.parent?.remove(set.group); own?.(); k.dispose(); };
  return set;
}
