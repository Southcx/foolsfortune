// ---------------------------------------------------------------------------------------
// A MECH'S BACK PIECE: THE HALOS (the rigid back pieces of vfx/mechs/capes.js): rings that stand behind the shoulders in the chest's
// frame, floating clear of the back and bobbing slowly as the helm does, wide enough that the Pneuka Jar in its cradle between the
// shoulder blades is framed in the ring's opening, never covered. Built in the parts body's own programs (its porcelain, trim and gold,
// so the mount's glazing paints them) and one of their own for the film's light.
//   renko   the drums' ring (renkō, 連鼓): Raijin's hoop of eight taiko round the shoulders, each head a mitsudomoe in gold, the ring
//           turning slowly, a faint crackle of the film's lightning jumping from drum to drum
//   kohai   the flame halo (kaen kōhai, 迦楼羅炎): Fudō Myōō's mandorla of carved flames, chunky tongues in gold licking up round an open
//           ring, a smaller ring of the film's flames inside them breathing; open at its foot
// Prior art: the Wind God and Thunder God screens of Tawaraya Sōtatsu (Kennin-ji, early 17th c.: Raijin's ring of drums on a hoop,
// the mitsudomoe on their heads) and Ogata Kōrin's copy; Fudō Myōō's karura-flame mandorla (the Kamakura sculptors, Kōfuku-ji,
// Tō-ji's lecture hall); the floating helm's bob (vfx/mechs/helms.js); the caster shells' procedural lightning (vfx/caster/lightning.js).
//
//   HALOS[id](fr, mats, own) -> { group (chest frame), update(dt) }   (fr: the frame's metrics, capes.js frameOf)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { MECH_LOOK as L, seg, plate, shell, labTone } from '../parts/kit.js';
import { create as lightning } from '../../caster/lightning.js';

const PI = Math.PI;
/** The pieces of one segment merged into meshes in the body's programs, under `parent` (each pushed to `own`). */
function bakeInto(parent, S, mats, own, name) {
  for (const [k, m] of [['p', mats.p], ['core', mats.core], ['trim', mats.trim], ['g', mats.g], ['l', mats.l]]) {
    if (!S[k].pos.length) continue;
    const mesh = new THREE.Mesh(S[k].done(), m); mesh.name = `mech-cape.${name}.${k}`; mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); own.push(mesh);
  }
}
/** One tomoe's outline in a head of radius Rh: a round head swept into a tapering tail round the centre (a comma). */
function tomoe(Rh) {
  const rho = 0.46 * Rh, w0 = 0.3 * Rh, Th = 2.3, out = [], inn = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, a = t * Th, w = w0 * (1 - t) ** 0.85 + 0.004;
    out.push([Math.cos(a) * (rho + w), Math.sin(a) * (rho + w)]); inn.push([Math.cos(a) * (rho - w), Math.sin(a) * (rho - w)]);
  }
  const head = []; // (the round head, behind the tail's start)
  for (let i = 1; i < 12; i++) { const b = (i / 12) * PI; head.push([rho * 1 + Math.cos(b) * w0 * 1.0, -Math.sin(b) * w0 * 1.05]); }
  return [...out.reverse(), ...head, ...inn];
}
/** A flame tongue's outline pointing +Y, base w wide, h tall, its tip hooked (the carved karura flame). */
const flame = (w, h, hook = 1) => [[-w / 2, 0], [-w * 0.58, h * 0.28], [-w * 0.42, h * 0.58], [-w * 0.08, h * 0.8], [w * 0.2 * hook, h], [w * 0.12 * hook, h * 0.78],
  [w * 0.3, h * 0.62], [w * 0.5, h * 0.36], [w * 0.5, h * 0.12], [w / 2, 0]];

export const HALOS = {
  renko(fr, mats, own) {
    const R = fr.R, rd = R * 0.17, len = rd * 0.95, group = new THREE.Group(), ring = new THREE.Group(); group.add(ring);
    const S = seg();
    S.g.geo(new THREE.TorusGeometry(R, R * 0.035, 10, 72), { c: L.gold }); // (the hoop)
    S.g.geo(new THREE.TorusGeometry(R, R * 0.016, 6, 72), { at: [0, 0, len * 0.42], c: L.bronze });
    const tomoeGeo = plate(tomoe(rd * 0.86), 0.03, 0.01);
    const drums = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * PI * 2 + PI / 8, x = Math.cos(a) * R, y = Math.sin(a) * R; drums.push(new THREE.Vector3(x, y, 0));
      const barrel = [[rd * 0.92, -len / 2], [rd * 1.04, -len * 0.25], [rd * 1.08, 0], [rd * 1.04, len * 0.25], [rd * 0.92, len / 2]];
      S.trim.geo(shell(barrel, 24).rotateX(PI / 2), { at: [x, y, 0], c: L.trimD }); // (the barrel, its axis to the front)
      for (const z of [-1, 1]) {
        S.p.geo(new THREE.CircleGeometry(rd * 0.93, 28), { at: [x, y, z * len / 2], rot: [0, z > 0 ? 0 : PI, 0], c: L.pale }); // (the head)
        S.g.geo(new THREE.TorusGeometry(rd * 0.95, rd * 0.06, 6, 28), { at: [x, y, z * len / 2], c: L.gold }); // (its hoop)
        for (let t = 0; t < 12; t++) { const b = (t / 12) * PI * 2; S.g.ball(rd * 0.045, { at: [x + Math.cos(b) * rd * 1.0, y + Math.sin(b) * rd * 1.0, z * len * 0.4], c: L.gold }, 6, 4); } // (the tacks)
        for (let m = 0; m < 3; m++) S.g.geo(tomoeGeo, { at: [x, y, z * (len / 2 + 0.02)], rot: [0, z > 0 ? 0 : PI, (m / 3) * PI * 2 + a], c: L.gold }); // (the mitsudomoe)
      }
    }
    for (let k = 0; k < 8; k++) { const a = (k / 8) * PI * 2; S.l.ball(R * 0.045, { at: [Math.cos(a) * R, Math.sin(a) * R, 0], c: labTone(k / 8, 0.2) }, 12, 8); } // (a stone between each pair)
    bakeInto(ring, S, mats, own, 'renko');
    // the crackle: the film's lightning jumping drum to drum, faint, regrown a few times a real second
    const paths = drums.map((d, k) => { const e = drums[(k + 1) % 8], dir = e.clone().sub(d).normalize(); return [d.clone().addScaledVector(dir, rd * 1.05), e.clone().addScaledVector(dir, -rd * 1.05)]; });
    let Z = null; try { Z = lightning({ paths, levels: 4, jag: 0.22, branches: 1, width: 0.035 * fr.scl, minPx: 0.8, glow: 2.2, tint: L.film, core: 0xf4efff, rate: 7, k: 0.5 }); ring.add(Z.object); } catch { Z = null; /* (headless: no arcs) */ }
    group.position.set(0, fr.haloY, fr.haloZ);
    let t = 0;
    return { group, update(dt) {
      t += dt; ring.rotation.z = -t * 0.12; group.position.y = fr.haloY + Math.sin(t * 0.9) * 0.06 * fr.scl;
      if (Z) { Z.set({ k: 0.25 + 0.5 * Math.max(0, Math.sin(t * 2.3) * Math.sin(t * 0.71 + 0.4)) }); Z.update(dt); }
    }, dispose() { Z?.dispose(); } };
  },
  kohai(fr, mats, own) {
    const R = fr.R * 0.92, group = new THREE.Group(), inner = new THREE.Group(); group.add(inner);
    const S = seg(), I = seg(), open = 0.62, film = new THREE.MeshStandardMaterial({ name: 'mech-cape-film', color: L.film, emissive: L.film, emissiveIntensity: 0.45, roughness: 0.3, metalness: 0.1 });
    S.g.geo(new THREE.TorusGeometry(R * 0.74, R * 0.05, 8, 64, PI * 2 - open * 2), { rot: [0, 0, -PI / 2 + open], c: L.gold }); // (the ring, open at its foot)
    S.trim.geo(new THREE.TorusGeometry(R * 0.66, R * 0.03, 6, 64, PI * 2 - open * 2), { rot: [0, 0, -PI / 2 + open], c: L.trimM });
    const tongue = (P, n, rr, w, h, z, c) => {
      for (let i = 0; i < n; i++) {
        const th = -PI + open + ((i + 0.5) / n) * (PI * 2 - open * 2); // (round from one side of the foot to the other)
        const a = th + PI / 2, rx = Math.cos(a), ry = Math.sin(a);
        const up = Math.atan2(ry + 0.9, rx) - PI / 2; // (each tongue licks upward as well as out)
        const hk = rx >= 0 ? 1 : -1, sc = 0.8 + 0.25 * Math.max(0, ry);
        P.geo(plate(flame(w * sc, h * sc, hk), 0.16 * fr.scl, 0.05 * fr.scl), { at: [rx * rr, ry * rr, z], rot: [0, 0, up], c });
      }
    };
    tongue(S.g, 13, R * 0.74, R * 0.36, R * 0.52, 0, L.gold);
    tongue(S.trim, 12, R * 0.62, R * 0.2, R * 0.3, 0.1 * fr.scl, L.trimL);
    tongue(I.p, 12, R * 0.7, R * 0.24, R * 0.4, 0.2 * fr.scl, 0xffffff);
    S.g.ball(R * 0.09, { at: [0, R * 0.74, 0.12], c: L.gold }, 14, 10); S.l.ball(R * 0.06, { at: [0, R * 0.74, 0.2], sc: [1, 1, 0.6], c: labTone(0.2, 0.2) }, 12, 8); // (the jewel at its crown)
    bakeInto(group, S, mats, own, 'kohai');
    const m = new THREE.Mesh(I.p.done(), film); m.name = 'mech-cape.kohai.film'; m.castShadow = true; inner.add(m); own.push(m);
    group.position.set(0, fr.haloY, fr.haloZ);
    let t = 0;
    return { group, update(dt) {
      t += dt; group.position.y = fr.haloY + Math.sin(t * 0.9) * 0.06 * fr.scl;
      const b = 1 + 0.035 * Math.sin(t * 3.1) + 0.02 * Math.sin(t * 7.3); inner.scale.set(1, b, 1); film.emissiveIntensity = 0.35 + 0.15 * Math.sin(t * 4.1) ** 2;
    }, dispose() { film.dispose(); } };
  },
};
