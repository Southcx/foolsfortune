// ---------------------------------------------------------------------------------------
// THE DUNE COLOSSUS'S BODY (plain name; dressColossus; docs/plans/MECHS.md 5.3, 11.2; Dovina's GIANTS.colossus, 22 m, body 'sand'; her
// placeholder world/hangar/giantbodies.js buildColossus): the Dunes' sand risen into a body in Fury's weather, drawn as a haniwa grown to
// a giant's size, fitted to her own skeleton part by part (`colossus.*`, found by name):
//   body / pelvis / torso / chest   one hollow column of fired clay from her pelvis's foot to the chest's top (7 to 17.4 m): the
//                 haniwa's skirt flaring at the hips, a waist, a broad chest, pressed front to back as her boxes are; the potter's
//                 raised ridges round it, a collar at its top; sand heaped at the waist and the neck
//   ridge0..3    each of her back's crests a cluster of Lachrymite grown out through the clay (four to six points, lit in the film)
//   head / skull / eyeL / eyeR   a tall cylinder head on her head's joint, its face three hollows (two almond eyes where her eyes are
//                 and a round mouth) with a calm light deep in each eye, raised almond rims round them, red ochre on the cheeks, the
//                 haniwa warrior's looped hair (mizura) at the sides and a topknot
//   armL/R, shoulderL/R, upperArmL/R   a shoulder guard of layered clay plates (the keikō's) over her shoulder, a tube arm, bands
//   forearmL/R, fistL/R   a tube forearm and a mitten fist where her fist is; sand ruffs at the shoulder, the elbow and the wrist
//   legL/R       the haniwa's base column on her 7 m leg, flaring to the ground, banded, a ruff at its foot and its hip
//   barrier      left to the AT field's look (giants/atfield.js)
// Every piece hangs on the joint her part hangs on, so her pose, her joints' visibility (a snapped arm hidden) and her slump carry it.
//   STATES   sand shed from its joints always (more as it walks, a pour when staggered), its eyes' calm light guttering when staggered,
//            warming to an ember through a windup (the tell every move shares) and out while down, a slump of sand where it falls; the
//            crystals breathing with the eyes. The windups' own tells and the moves' marks are giants/colossusmarks.js's.
// Prior art: haniwa (Kofun-period terracotta figures: the hollow cylinder body, the cut-through eyes and mouth, the ridged bands, the
// warrior's keikō armour, tube arms and mizura hair), Shadow of the Colossus (a giant whose body is the land's own stone, its weak
// points lit), the Daimajin films (a stone guardian woken), Dune's and Tremors' sand that hides it, the island's sentinel
// (vfx/sentinelbody.js: a shield-bearer haniwa of fired clay risen from a mound of sand) at a giant's scale.
//
//   dressColossus(giant, game) -> { update(dt, t), dispose(), kind: 'sand', head (its head dress, turned by the tells), eyeK }   COLOSSUS_LOOK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Soup, giantCanvas, hidePlaceholder, uvs } from './kit.js';

/** Its colours and timings: the fired clay's base, the ridges darker, the sand, the crystals' film tint, the eyes' calm light and the
 *  windup's ember, how often a joint sheds (real s; quicker walking, a pour staggered). */
export const COLOSSUS_LOOK = { clay: 0xb06a44, ridge: 0x7a4026, sand: 0xd9b98a, sandDark: 0xb8956a, crystal: 0xb9a8ff, eye: 0xffe2a8, ember: 0xff8a3a, shed: 0.35 };
const K = COLOSSUS_LOOK, PI = Math.PI;
const _v = new THREE.Vector3(), _c = new THREE.Color();

function materials() {
  const m = (o) => new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0, ...o });
  return {
    clay: m({ map: giantCanvas('clay') }), ridge: m({ color: K.ridge }),
    sand: m({ color: K.sand, roughness: 1 }), sandDark: m({ color: K.sandDark, roughness: 1 }), dark: m({ color: 0x140806, roughness: 1 }), ochre: m({ color: 0xc04030, transparent: true, opacity: 0.5, depthWrite: false }),
    crystal: new THREE.MeshPhysicalMaterial({ color: K.crystal, roughness: 0.15, metalness: 0, clearcoat: 1, iridescence: 0.7, iridescenceIOR: 1.5,
      emissive: new THREE.Color(K.crystal), emissiveIntensity: 0.6, flatShading: true }),
    eye: new THREE.MeshBasicMaterial({ color: K.eye, toneMapped: false }),
  };
}
/** A ruff of sand: a lumpy torus, the sand heaped round a joint (laid flat: its hole along y). */
function ruff(r, tube, seed = 1) {
  const g = new THREE.TorusGeometry(r, tube, 6, 18), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { const k = 1 + 0.2 * Math.sin(i * 2.3 * seed) * Math.cos(i * 0.7); P.setXYZ(i, P.getX(i) * (0.95 + 0.05 * k), P.getY(i) * k, P.getZ(i) * (0.95 + 0.05 * k)); }
  g.computeVertexNormals(); return g.rotateX(PI / 2);
}
/** A Lachrymite point: a hexagonal prism capped by its pyramid, its foot at the origin, along +y. */
function point(len, r) {
  const g = [new THREE.CylinderGeometry(r * 0.85, r, len, 6).translate(0, len / 2, 0), new THREE.ConeGeometry(r * 0.85, len * 0.38, 6).translate(0, len + len * 0.19, 0)];
  return g;
}

export function dressColossus(giant, game) {
  const Gi = giant, root = Gi.group, part = (n) => root.getObjectByName(`colossus.${n}`) || null, mats = materials(), S = new Soup();
  const body = Gi.body, place = (n) => part(n)?.position ?? new THREE.Vector3();
  // ------------------------------------------------------------------ the body: a ridged hollow column from the pelvis to the chest
  const pel = place('pelvis'), tor = place('torso'), D = 0.66; // (pressed front to back as her boxes are: 6.2 deep of 9.6 wide)
  const y0 = pel.y - 1.3, y1 = tor.y + 4 - 0.1; // (her pelvis's foot to her torso's top)
  const prof = [[3.4, 0], [4.9, 0.3], [5.0, 0.9], [4.3, 2.3], [3.9, 3.4], [4.4, 5.6], [4.95, 8.2], [4.8, 9.8], [3.4, y1 - y0]].map(([r, y]) => new THREE.Vector2(r, y));
  S.add(body, uvs(new THREE.LatheGeometry(prof, 28), 4, 2), 'clay', { at: [0, y0, 0], scale: [1, 1, D] });
  for (const [y, r] of [[2.15, 4.5], [3.5, 4.02], [7.6, 4.95], [9.6, 4.92]]) S.add(body, new THREE.TorusGeometry(r + 0.12, 0.3, 6, 32).rotateX(PI / 2), 'ridge', { at: [0, y0 + y, 0], scale: [1, 1, D] });
  S.add(body, new THREE.CylinderGeometry(3.5, 4.1, 0.7, 28), 'ridge', { at: [0, y1 - 0.2, 0], scale: [1, 1, D] }); // (the collar)
  S.add(body, ruff(4.6, 0.9, 1.3), 'sand', { at: [0, y0 + 2.9, 0], scale: [1, 1, D] }); // (sand heaped at the waist)
  S.add(body, ruff(2.2, 0.8), 'sandDark', { at: [0, y1 + 0.2, 0] }); // (at the neck)
  S.add(body, ruff(4.2, 1.1, 0.7), 'sand', { at: [0, y0 + 0.2, 0], scale: [1, 1, D] }); // (and at the skirt's hem)
  // ------------------------------------------------------------------ the back's crests: Lachrymite grown out through the clay
  for (let i = 0; i < 4; i++) {
    const R = part(`ridge${i}`); if (!R) continue;
    const n = 4 + (i % 3), s = 1 + 0.25 * (i % 2);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * PI * 2 + i, len = (2.2 + 1.6 * ((k * 7 + i * 3) % 5) / 4) * s, r = 0.38 * s + 0.08 * (k % 2);
      const rx = -0.9 + 0.35 * Math.cos(a), rz = 0.45 * Math.sin(a);
      for (const g of point(len, r)) S.add(R, g, 'crystal', { at: [Math.sin(a) * 0.5, 0.2 + Math.cos(a) * 0.4, 0], rot: [rx, 0, rz] });
    }
    S.add(R, new THREE.IcosahedronGeometry(1.1, 0), 'clay', { scale: [1, 0.7, 0.8] }); // (the clay it broke through, heaped)
  }
  // ------------------------------------------------------------------ the legs: the haniwa's base column, flaring to the ground
  for (const k of ['L', 'R']) {
    const leg = part(`leg${k}`); if (!leg) continue; // (her leg: a 3.4 x 7 x 3.4 box centred 3.5 up)
    S.add(leg, uvs(new THREE.CylinderGeometry(1.7, 2.25, 7, 18, 2), 2, 1), 'clay', { at: [0, 0, 0] });
    for (const y of [-1.6, 1.7]) S.add(leg, new THREE.TorusGeometry(1.85 - y * 0.05, 0.22, 5, 18).rotateX(PI / 2), 'ridge', { at: [0, y, 0] });
    S.add(leg, ruff(2.3, 0.75, 1.1), 'sand', { at: [0, -3.3, 0] });
    S.add(leg, ruff(1.75, 0.6, 0.9), 'sandDark', { at: [0, 3.3, 0] });
  }
  // ------------------------------------------------------------------ the head: a tall cylinder, its face three hollows with a calm light
  const H = Gi.head || part('head'), sk = part('skull'), head = new THREE.Group(); head.name = 'giant.dress.colossusHead'; (H || body).add(head);
  const eyeP = part('eyeL')?.position ?? new THREE.Vector3(1.1, 2.6, 2.25), hh = 4.5, hr = 2.3, hy = sk ? sk.position.y - 2.25 : 0;
  S.add(head, uvs(new THREE.CylinderGeometry(hr * 0.92, hr, hh, 24, 2), 3, 1), 'clay', { at: [0, hy + hh / 2, 0] });
  S.add(head, new THREE.CylinderGeometry(hr * 0.92, hr * 0.92, 0.2, 22), 'clay', { at: [0, hy + hh, 0] });
  S.add(head, new THREE.CylinderGeometry(hr * 1.06, hr * 1.06, 0.45, 22), 'ridge', { at: [0, hy + hh - 0.3, 0] });
  S.add(head, new THREE.CylinderGeometry(0.8, 1.1, 1.3, 12), 'clay', { at: [0, hy + hh + 0.6, 0] }); // (the topknot)
  S.add(head, new THREE.TorusGeometry(0.75, 0.3, 6, 14), 'ridge', { at: [0, hy + hh + 1.25, 0], rot: [0, 0, 0] });
  for (const s of [-1, 1]) { // (the mizura: the warrior's hair looped at each side, a tie round it)
    S.add(head, new THREE.TorusGeometry(0.8, 0.36, 8, 16), 'clay', { at: [s * (hr + 0.2), hy + 1.6, 0], rot: [0, PI / 2, 0], scale: [1, 1.5, 1] });
    S.add(head, new THREE.CylinderGeometry(0.42, 0.42, 0.4, 10), 'ridge', { at: [s * (hr + 0.2), hy + 2.9, 0] });
  }
  const onFace = (x, y, d) => { const a = Math.asin(Math.max(-0.9, Math.min(0.9, x / hr))), r = hr * (1 - 0.08 * (y - hy) / hh) + d; return { at: [Math.sin(a) * r, y, Math.cos(a) * r], rot: [0, a, 0] }; };
  for (const s of [1, -1]) { // (her eyes: +x its left; each a raised almond rim, its dark, the calm light deep in it)
    const x = s * Math.abs(eyeP.x), y = eyeP.y;
    S.add(head, new THREE.TorusGeometry(1, 0.13, 5, 20), 'ridge', { ...onFace(x, y, 0.02), scale: [0.74, 0.36, 1] });
    S.add(head, new THREE.CircleGeometry(1, 20), 'dark', { ...onFace(x, y, 0.03), scale: [0.62, 0.27, 1] });
    S.add(head, new THREE.CircleGeometry(1, 16), 'eye', { ...onFace(x, y, 0.06), scale: [0.34, 0.12, 1] });
    S.add(head, new THREE.CircleGeometry(1, 16), 'ochre', { ...onFace(s * 1.5, y - 1.05, 0.03), scale: [0.42, 0.34, 1] }); // (red ochre on the cheeks)
  }
  S.add(head, new THREE.TorusGeometry(1, 0.12, 5, 18), 'ridge', { ...onFace(0, hy + 1.15, 0.02), scale: [0.42, 0.36, 1] }); // (the mouth: its rim and its dark)
  S.add(head, new THREE.CircleGeometry(1, 18), 'dark', { ...onFace(0, hy + 1.15, 0.03), scale: [0.34, 0.28, 1] });
  // ------------------------------------------------------------------ the arms: a shoulder guard, tubes, a mitten, sand at each joint
  for (const k of ['L', 'R']) {
    const i = k === 'R' ? 0 : 1, A = Gi.arms?.[i], fa = Gi.fore?.[i], s = k === 'L' ? 1 : -1; // (her arms[0] its right, arms[1] its left; fore[i] the forearm's group at the elbow)
    if (A) {
      S.add(A, ruff(1.7, 0.7, 1.2), 'sandDark', { at: [0, -0.6, 0], rot: [0, 0, s * 0.3] });
      for (let j = 0; j < 3; j++) { // (the keikō's shoulder guard: three curved plates stepping down the arm)
        const r = 2.4 - j * 0.2, y = 1.3 - j * 1.0;
        S.add(A, new THREE.SphereGeometry(r, 16, 8, 0, PI * 2, 0, PI * 0.45), j === 1 ? 'ridge' : 'clay', { at: [s * 0.3, y, 0], rot: [0, 0, -s * (0.35 + j * 0.12)], scale: [1, 0.75, 1] });
      }
      S.add(A, uvs(new THREE.CylinderGeometry(1.35, 1.45, 5.8, 14), 2, 1), 'clay', { at: [0, -3.4, 0] });
      for (const y of [-2.4, -5.4]) S.add(A, new THREE.TorusGeometry(1.48, 0.17, 5, 16).rotateX(PI / 2), 'ridge', { at: [0, y, 0] });
    }
    if (fa) {
      S.add(fa, ruff(1.55, 0.6, 0.8), 'sand', { at: [0, 0, 0] });
      S.add(fa, uvs(new THREE.CylinderGeometry(1.4, 1.25, 5.8, 14), 2, 1), 'clay', { at: [0, -3, 0] });
      S.add(fa, new THREE.CylinderGeometry(1.5, 1.5, 1.1, 14), 'ridge', { at: [0, -5.2, 0] }); // (the bracer)
      S.add(fa, ruff(1.45, 0.55, 1.4), 'sandDark', { at: [0, -5.9, 0] });
      const fy = part(`fist${k}`)?.position.y ?? -7.4;
      S.add(fa, new THREE.SphereGeometry(1.9, 16, 12), 'clay', { at: [0, fy + 0.1, 0.1], scale: [0.95, 1.05, 0.82] }); // (the mitten)
      S.add(fa, new THREE.SphereGeometry(0.75, 10, 8), 'clay', { at: [-s * 1.3, fy + 0.7, 0.8], scale: [0.8, 1.2, 0.8] }); // (the thumb, inward)
      S.add(fa, new THREE.TorusGeometry(1.5, 0.14, 5, 16).rotateX(PI / 2), 'ridge', { at: [0, fy + 1.2, 0.05] });
    }
  }
  const meshes = S.done(mats);
  hidePlaceholder(Gi.mats, true, ['barrier']);

  let shedT = 0, eyeK = 1, wasDown = false;
  const joints = () => [Gi.head, ...(Gi.arms || []), ...(Gi.fore || []), Gi.legs?.L, Gi.legs?.R].filter((o) => o && o.visible !== false);
  const play = (n, ctx) => { try { game.vfx?.play(n, ctx); } catch { /* (headless) */ } };
  const dress = {
    kind: 'sand', meshes, head, eyeK: 1,
    update(dt, t) {
      const st = Gi.stagger?.staggerT > 0, down = Gi.down > 0, W = Gi.windup, wk = W ? Math.max(0, 1 - W.t / W.of) : 0;
      const want = down ? 0 : st ? 0.35 + 0.3 * Math.abs(Math.sin(t * 11)) : 0.85 + 0.15 * Math.sin(t * 0.9) + 0.5 * wk;
      eyeK += (want - eyeK) * Math.min(1, dt * 4); dress.eyeK = eyeK;
      mats.eye.color.setHex(K.eye).lerp(_c.setHex(K.ember), Math.min(1, wk * 1.4)).multiplyScalar(0.25 + 1.6 * eyeK);
      mats.crystal.emissiveIntensity = 0.35 + 0.4 * eyeK + 0.15 * Math.sin(t * 1.7);
      if (down && !wasDown) { root.updateMatrixWorld(true); play('giant.sand.slump', { pos: _v.copy(Gi.pos).setY(Gi.pos.y + 0.3), scale: 1.6 }); }
      wasDown = down;
      shedT -= dt;
      if (shedT <= 0 && !Gi.air && !Gi.under) {
        const J = joints(); shedT = K.shed * (st ? 0.3 : Gi.awake ? 0.6 : 1) * (0.6 + Math.random() * 0.8);
        if (J.length) { const o = J[(Math.random() * J.length) | 0]; play('giant.sand.shed', { pos: o.getWorldPosition(_v), scale: st ? 1.4 : 1 }); }
      }
    },
    dispose() {
      for (const m of meshes) { m.removeFromParent(); m.geometry.dispose(); }
      head.removeFromParent();
      for (const m of Object.values(mats)) m.dispose();
      hidePlaceholder(Gi.mats, false);
    },
  };
  return dress;
}
