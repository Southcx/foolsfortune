// ---------------------------------------------------------------------------------------
// THE DUNE COLOSSUS'S BODY (plain name; dressColossus; docs/plans/MECHS.md 5.3, 11.2; Dovina's GIANTS.colossus, 22 m, body 'sand'): the
// Dunes' sand risen into a body in Fury's weather, drawn as a haniwa grown to a giant's size: a hollow column of fired clay for a body
// banded with the potter's raised ridges, a tall cylinder head whose face is three hollows cut through (two almond eyes and a round
// mouth) with a calm light deep in each, cheeks marked in red ochre; tube arms with mitten hands, legs as the haniwa's base column
// flaring to the ground; a ruff of sand at every joint shedding sand without end; and on its back a cluster of Lachrymite crystals
// grown out through the clay, lit in the film.
//   HOW      dressed over the giant's placeholder as the straw giant's body is (its own meshes hidden, the dress hung on its joints:
//            the body, the legs, the head, the arms and forearms), so its pose and its joints' visibility carry the dress; picked by
//            the dresser (vfx/mechs/giants/index.js) when the giant's row says body 'sand'. Dovina's runtime for it had not landed when
//            this was written (giant.js builds the straw giant's skeleton for any row): the dress sizes itself to the skeleton it finds.
//   STATES   sand shed from its joints always (more as it walks, a pour when staggered), its eyes' light guttering when staggered and
//            out while down, a slump of sand where it falls.
// Prior art: haniwa (Kofun-period terracotta figures: the hollow cylinder body, the cut-through eyes and mouth, the ridged bands, the
// warrior's tube arms), Shadow of the Colossus (a giant whose body is the land's own stone and moss, its weak points lit), the
// Daimajin films (a stone guardian woken), Dune's and Tremors' sand that hides it, the island's sentinel (vfx/sentinelbody.js: a
// shield-bearer haniwa of fired clay risen from a mound of sand) at a giant's scale.
//
//   dressColossus(giant, game) -> { update(dt, t), dispose(), kind: 'sand' }   COLOSSUS_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Soup, giantCanvas, hidePlaceholder, uvs } from './kit.js';

/** Its colours and timings: the fired clay's base, the ridges darker, the sand, the crystals' film tint, the eyes' calm light, how
 *  often a joint sheds (real s; quicker walking, a pour staggered). */
export const COLOSSUS_LOOK = { clay: 0xb06a44, ridge: 0x7a4026, sand: 0xd9b98a, sandDark: 0xb8956a, crystal: 0xb9a8ff, eye: 0xffe2a8, shed: 0.35 };
const K = COLOSSUS_LOOK, PI = Math.PI;
const _v = new THREE.Vector3();

function materials() {
  const m = (o) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, ...o });
  return {
    clay: m({ map: giantCanvas('clay') }), face: m({ map: giantCanvas('clayFace') }), ridge: m({ color: K.ridge }),
    sand: m({ color: K.sand, roughness: 1 }), sandDark: m({ color: K.sandDark, roughness: 1 }),
    crystal: new THREE.MeshPhysicalMaterial({ color: K.crystal, roughness: 0.15, metalness: 0, transmission: 0, clearcoat: 1, iridescence: 0.7, iridescenceIOR: 1.5,
      emissive: new THREE.Color(K.crystal), emissiveIntensity: 0.6, flatShading: true }),
    eye: new THREE.MeshBasicMaterial({ color: K.eye, toneMapped: false }),
  };
}
/** A ruff of sand: a lumpy torus, the sand heaped round a joint. */
function ruff(r, tube) {
  const g = new THREE.TorusGeometry(r, tube, 6, 18), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const k = 1 + 0.18 * Math.sin(i * 2.3) * Math.cos(i * 0.7); P.setXYZ(i, P.getX(i) * (0.95 + 0.05 * k), P.getY(i) * k, P.getZ(i) * (0.95 + 0.05 * k)); }
  g.computeVertexNormals(); return g;
}

export function dressColossus(giant, game) {
  const Gi = giant, body = Gi.body, mats = materials(), S = new Soup();
  // the skeleton as found: the head's height, the shoulders' span, the legs' place (the straw giant's if the runtime reuses it)
  const headY = Gi.head?.position.y ?? 12.6, sh = Math.abs(Gi.arms?.[0]?.position.x ?? 4.4), shY = Gi.arms?.[0]?.position.y ?? 12.4;
  const torsoTop = shY + 0.8, torsoBot = 4.6, th = torsoTop - torsoBot, tr = sh * 0.78;
  // ------------------------------------------------------------------ the body: a ridged hollow column, crystals out of its back
  const trunk = new THREE.Group(); trunk.name = 'giant.dress.colossus'; body.add(trunk);
  S.add(trunk, uvs(new THREE.CylinderGeometry(tr * 0.92, tr, th, 22, 4), 4, 2), 'clay', { at: [0, torsoBot + th / 2, 0], scale: [1, 1, 0.82] });
  for (const f of [0.18, 0.5, 0.82]) S.add(trunk, new THREE.TorusGeometry(tr * (1 - 0.08 * f) + 0.1, 0.28, 6, 26), 'ridge', { at: [0, torsoBot + th * f, 0], rot: [PI / 2, 0, 0], scale: [1, 0.82, 1] });
  S.add(trunk, new THREE.CylinderGeometry(tr * 0.95, tr * 0.95, 0.6, 22), 'ridge', { at: [0, torsoTop, 0], scale: [1, 1, 0.82] }); // (the shoulders' rim)
  S.add(trunk, ruff(tr * 0.95, 0.9), 'sand', { at: [0, torsoBot, 0], rot: [PI / 2, 0, 0], scale: [1, 0.82, 1] }); // (sand heaped at the hips)
  S.add(trunk, ruff(1.9, 0.7), 'sandDark', { at: [0, torsoTop + 0.3, 0], rot: [PI / 2, 0, 0] }); // (at the neck)
  const crystals = [[0, 0.62, 3.6, 0, 0.1], [-1.6, 0.48, 2.6, -0.5, -0.2], [1.5, 0.54, 2.9, 0.45, -0.1], [-0.7, 0.32, 2.2, -0.2, -0.45], [0.9, 0.78, 2.2, 0.3, 0.35], [0.2, 0.42, 3.0, 0.1, -0.3]];
  for (const [x, yf, len, rz, rx] of crystals) { // (Lachrymite grown out through the clay of its back)
    const y = torsoBot + th * yf, z = -tr * 0.8;
    S.add(trunk, new THREE.CylinderGeometry(0.42 * len / 3, 0.55 * len / 3, len, 6).translate(0, len / 2, 0), 'crystal', { at: [x, y, z], rot: [-PI / 2 + 0.55 + rx, 0, rz] });
    S.add(trunk, new THREE.ConeGeometry(0.42 * len / 3, len * 0.35, 6).translate(0, len + len * 0.175, 0), 'crystal', { at: [x, y, z], rot: [-PI / 2 + 0.55 + rx, 0, rz] });
  }
  // ------------------------------------------------------------------ the legs: the haniwa's base column, flaring to the ground
  for (const k of ['L', 'R']) {
    const leg = Gi.legs?.[k]; if (!leg) continue;
    S.add(leg, uvs(new THREE.CylinderGeometry(1.15, 1.7, 5.4, 16, 2), 2, 1), 'clay', { at: [0, 0.05, 0] });
    S.add(leg, new THREE.TorusGeometry(1.35, 0.2, 5, 16), 'ridge', { at: [0, 0.8, 0], rot: [PI / 2, 0, 0] });
    S.add(leg, ruff(1.9, 0.75), 'sand', { at: [0, -2.4, 0], rot: [PI / 2, 0, 0] });
  }
  // ------------------------------------------------------------------ the head: a tall cylinder, its face three hollows with a calm light
  const head = new THREE.Group(); head.name = 'giant.dress.colossusHead'; Gi.head?.add(head);
  const hr = 1.9, hh = Math.max(3.4, (Gi.G?.height ?? 16) - headY - 0.2);
  S.add(head, uvs(new THREE.CylinderGeometry(hr * 0.9, hr, hh, 20, 2, false, PI * 0.35, PI * 1.3), 3, 1), 'clay', { at: [0, hh / 2, 0] });
  S.add(head, new THREE.CylinderGeometry(hr * 0.9, hr, hh, 14, 1, true, -PI * 0.35, PI * 0.7), 'face', { at: [0, hh / 2, 0] }); // (the face's slice, its hollows painted)
  S.add(head, new THREE.CylinderGeometry(hr * 1.05, hr * 1.05, 0.4, 20), 'ridge', { at: [0, hh, 0] });
  S.add(head, new THREE.ConeGeometry(hr * 0.5, 1.4, 12), 'clay', { at: [0, hh + 0.7, 0] }); // (the topknot's stub)
  for (const [th, v, w, h] of [[-0.115, 0.59, 0.26, 0.08], [0.115, 0.59, 0.26, 0.08], [0, 0.29, 0.16, 0.13]]) { // (the calm light in each hollow, a core smaller than its dark)
    const a = th * PI, r = hr * (1 - 0.1 * v) * 0.97 + 0.06;
    S.add(head, new THREE.CircleGeometry(1, 16), 'eye', { at: [Math.sin(a) * r, v * hh, Math.cos(a) * r], rot: [0, a, 0], scale: [w, h, 1] });
  }
  // ------------------------------------------------------------------ the arms: tubes, mitten hands, sand at each joint
  (Gi.arms || []).forEach((A, i) => {
    const F = Gi.fore?.[i]; if (!A) return;
    S.add(A, uvs(new THREE.CylinderGeometry(0.95, 1.05, 4.4, 14), 2, 1), 'clay', { at: [0, -2.1, 0] });
    S.add(A, ruff(1.05, 0.55), 'sandDark', { at: [0, 0, 0], rot: [PI / 2, 0, 0] });
    if (!F) return;
    S.add(F, uvs(new THREE.CylinderGeometry(0.88, 0.95, 4.0, 14), 2, 1), 'clay', { at: [0, -2, 0] });
    S.add(F, ruff(0.95, 0.5), 'sand', { at: [0, 0, 0], rot: [PI / 2, 0, 0] });
    S.add(F, new THREE.SphereGeometry(1.25, 14, 10), 'clay', { at: [0, -4.6, 0.1], scale: [0.85, 1.15, 0.7] }); // (the mitten)
    S.add(F, new THREE.SphereGeometry(0.45, 10, 8), 'clay', { at: [0.8, -4.2, 0.5] }); // (the thumb)
  });
  const meshes = S.done(mats);
  hidePlaceholder(Gi.mats, true, ['barrier']);

  let shedT = 0, eyeK = 1, wasDown = false;
  const joints = () => [Gi.head, ...(Gi.arms || []), ...(Gi.fore || []), Gi.legs?.L, Gi.legs?.R].filter((o) => o && o.visible !== false);
  const play = (n, ctx) => { try { game.vfx?.play(n, ctx); } catch { /* (headless) */ } };
  return {
    kind: 'sand', meshes,
    update(dt, t) {
      const st = Gi.stagger?.staggerT > 0, down = Gi.down > 0;
      const want = down ? 0 : st ? 0.35 + 0.3 * Math.abs(Math.sin(t * 11)) : 0.85 + 0.15 * Math.sin(t * 0.9);
      eyeK += (want - eyeK) * Math.min(1, dt * 4); mats.eye.color.setHex(K.eye).multiplyScalar(0.25 + 1.6 * eyeK);
      mats.crystal.emissiveIntensity = 0.35 + 0.4 * eyeK + 0.15 * Math.sin(t * 1.7);
      if (down && !wasDown) { body.updateMatrixWorld(true); play('giant.sand.slump', { pos: _v.copy(Gi.pos).setY(Gi.pos.y + 0.3), scale: 1.6 }); }
      wasDown = down;
      shedT -= dt;
      if (shedT <= 0) {
        const J = joints(); shedT = K.shed * (st ? 0.3 : Gi.awake ? 0.6 : 1) * (0.6 + Math.random() * 0.8);
        if (J.length) { const o = J[(Math.random() * J.length) | 0]; play('giant.sand.shed', { pos: o.getWorldPosition(_v), scale: st ? 1.4 : 1 }); }
      }
    },
    dispose() {
      for (const m of meshes) { m.removeFromParent(); m.geometry.dispose(); }
      trunk.removeFromParent(); head.removeFromParent();
      for (const m of Object.values(mats)) m.dispose();
      hidePlaceholder(Gi.mats, false);
    },
  };
}
