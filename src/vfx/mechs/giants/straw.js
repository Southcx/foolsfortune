// ---------------------------------------------------------------------------------------
// THE STRAW GIANT'S BODY (plain name; dressStrawGiant; docs/plans/MECHS.md 8.2 item 3, Dovina's note of 2026-11-02): Dovina's straw giant
// (world/hangar/giant.js StrawGiant, 16 m, its placeholder of boxes) drawn as Pip's biggest try at Strawman: a burlap sack stuffed and
// stitched onto a timber scaffold that shows through above the shoulders and below the hem, a yoke the arms hang from, rope lashings
// at every joint of the timber and round the sack, straw bursting at the seams, the neck, the cuffs and the fists; Strawman's red and
// cream target painted on its chest; a sack head with stitched X eyes, a running-stitch mouth and a painted target for a nose, a stake
// of the scaffold poking out of its crown; buttons at giant scale on the straps and the elbows, a red patch on its side.
//   HOW      dressed over the placeholder: its own meshes hidden (its materials' `visible`), the dress hung on its own joints (the
//            body, the legs, the head, the arms and forearms), so its pose carries the dress, and its joints' visibility (a limb snapped
//            off, joints.js) hides the limb's dress with it. Its rules, its colliders and its barrier are never touched.
//   STATES   read off the runtime each frame: staggered (its stagger's staggerT), the dress sags (the sack squashed, the head lolling,
//            the scaffold creaking: a sway), straw spilling from its seams; felled (`down`), a burst of straw and dust at the fall,
//            the straw still trickling while it lies; awake, a little straw shaken loose as it walks.
// Prior art: Strawman's family (vfx/strawman.js: the burlap, the target, the X eyes; Pip's tries, vfx/strawmanwell/dummies.js), the
// marionette's sack (vfx/strawmanwell/marionette.js), Royal de Luxe's giant puppets (a body of cloth on a visible timber frame), the
// Wicker Man's lashed frame, Ratchet & Clank's Giant Clank kaiju (a giant read at a glance from far off).
//
//   dressStrawGiant(giant, game) -> { update(dt, t), dispose(), kind: 'straw' }
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Soup, tuft, giantCanvas, hidePlaceholder, uvs, sack } from './kit.js';

/** The straw giant's colours (sRGB): burlap, two straws, the timber light and dark, the rope, the thread, the buttons and the patch. */
export const STRAW_GIANT_LOOK = { burlap: 0xb8945e, straw: 0xe3c66a, strawDark: 0xb08a3a, wood: 0x7a5432, woodDark: 0x4e3420, rope: 0xcdb27a,
  thread: 0x3a2614, button: 0x2f6f8a, red: 0xb8322a, cream: 0xefe2c4, spillEvery: 0.22 };
const K = STRAW_GIANT_LOOK, PI = Math.PI;
const _v = new THREE.Vector3();

function materials() {
  const m = (o) => new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...o });
  return {
    burlap: m({ map: giantCanvas('burlap') }), target: m({ map: giantCanvas('target') }), face: m({ map: giantCanvas('face') }),
    straw: m({ color: K.straw, roughness: 0.8 }), strawDark: m({ color: K.strawDark, roughness: 0.85 }),
    wood: m({ color: K.wood, roughness: 0.75 }), woodDark: m({ color: K.woodDark, roughness: 0.8 }), rope: m({ color: K.rope }),
    thread: m({ color: K.thread }), button: m({ color: K.button, roughness: 0.35, metalness: 0.1 }), red: m({ color: K.red }), cream: m({ color: K.cream }),
  };
}

export function dressStrawGiant(giant, game) {
  const mats = materials(), S = new Soup(), Gi = giant, body = Gi.body, B = new THREE.Vector3();
  const straws = ['straw', 'strawDark'];
  // ------------------------------------------------------------------ the body: the sack on its scaffold
  const scaf = new THREE.Group(); scaf.name = 'giant.dress.scaffold'; body.add(scaf);
  const sag = new THREE.Group(); sag.name = 'giant.dress.sack'; sag.position.y = 9; body.add(sag); // (the sack, squashed about its middle when staggered)
  for (const [x, z] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) {
    S.add(scaf, new THREE.BoxGeometry(0.6, 15, 0.6), 'wood', { at: [x, 7.4, z], rot: [0, 0.1 * x, 0] }); // (posts, poking out above the shoulders)
    for (const y of [4.8, 13.4]) S.add(scaf, new THREE.TorusGeometry(0.5, 0.12, 5, 10), 'rope', { at: [x, y, z], rot: [PI / 2, 0, 0] });
  }
  for (const z of [-2, 2]) { S.add(scaf, new THREE.BoxGeometry(7.6, 0.45, 0.45), 'woodDark', { at: [0, 4.8, z] }); S.add(scaf, new THREE.BoxGeometry(0.4, 9.6, 0.4), 'woodDark', { at: [0, 9, z * 1.06], rot: [0, 0, 0.62 * Math.sign(z)] }); }
  S.add(scaf, new THREE.BoxGeometry(11.4, 0.7, 0.7), 'wood', { at: [0, 13.5, 0] }); // (the yoke the arms hang from)
  for (const x of [-5.2, 5.2]) S.add(scaf, new THREE.TorusGeometry(0.55, 0.15, 5, 10), 'rope', { at: [x, 13.5, 0], rot: [0, PI / 2, 0] });
  S.add(scaf, new THREE.BoxGeometry(0.5, 4.5, 0.5), 'woodDark', { at: [0, 15.2, -0.3] }); // (the spine stake into the head)
  S.add(sag, uvs(sack(3.3, 3.6, 8.6, { belly: 0.14, d: 0.72, lump: 0.05 }), 5, 3), 'burlap');
  S.add(sag, new THREE.CircleGeometry(2.4, 28), 'target', { at: [0, 0.5, 2.92], rot: [-0.06, 0, 0] });
  for (const y of [-2.6, 2.7]) S.add(sag, new THREE.TorusGeometry(3.55, 0.2, 6, 28), 'rope', { at: [0, y, 0], rot: [PI / 2, 0, 0], scale: [1, 0.74, 1] }); // (the lashings round the sack)
  for (const s of [-1, 1]) { // (the side seams, cross-stitched)
    for (let y = -3.8; y <= 3.8; y += 0.62) S.add(sag, new THREE.BoxGeometry(0.12, 0.85, 0.14), 'thread', { at: [s * 3.72, y, 0], rot: [0, 0, 0.7 * (Math.round(y / 0.62) % 2 ? 1 : -1)] });
    S.add(sag, new THREE.CylinderGeometry(0.7, 0.7, 0.18, 18), 'button', { at: [s * 2.3, 3.3, 2.35], rot: [PI / 2 - 0.25, 0, 0] }); // (a strap's button)
    for (const [dx, dy] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) S.add(sag, new THREE.CylinderGeometry(0.08, 0.08, 0.22, 6), 'thread', { at: [s * 2.3 + dx, 3.3 + dy, 2.42], rot: [PI / 2 - 0.25, 0, 0] });
    S.add(sag, new THREE.BoxGeometry(0.55, 3.6, 0.12), 'rope', { at: [s * 2.3, 3.6, 2.2], rot: [-0.25, 0, -s * 0.15] }); // (a strap over the shoulder)
  }
  S.add(sag, new THREE.BoxGeometry(1.6, 1.4, 0.12), 'red', { at: [-3.3, -1.6, 1.3], rot: [0, -0.95, 0.15] }); // (a patch)
  tuft(S, sag, straws, 2.2, 22, 1.8, { at: [0, 4.2, 0], seed: 1.3 }); // (the neck's straw)
  tuft(S, sag, straws, 2.9, 26, 1.6, { at: [0, -4.3, 0], up: -1, seed: 2.1 }); // (the hem's)
  tuft(S, sag, straws, 0.5, 12, 1.6, { at: [3.75, -0.8, 0.4], rot: [0, 0, -PI / 2], seed: 3.7, splay: 0.6 }); // (the side seam burst)
  tuft(S, sag, straws, 0.45, 10, 1.3, { at: [-3.4, 1.6, -1.2], rot: [0, 0, PI / 2], seed: 4.2, splay: 0.6 });
  // ------------------------------------------------------------------ the legs: sacks on stilts, a board for a foot
  for (const k of ['L', 'R']) {
    const leg = Gi.legs?.[k]; if (!leg) continue;
    S.add(leg, uvs(sack(1.15, 1.3, 5.0, { belly: 0.08, d: 0.9 }), 2, 2), 'burlap', { at: [0, 0.1, 0] });
    for (const y of [1.6, -1.3]) S.add(leg, new THREE.TorusGeometry(1.25, 0.14, 5, 18), 'rope', { at: [0, y, 0], rot: [PI / 2, 0, 0] });
    S.add(leg, new THREE.BoxGeometry(2.2, 0.45, 3.0), 'wood', { at: [0, -2.45, 0.35] });
    tuft(S, leg, straws, 1.15, 14, 0.9, { at: [0, -2.2, 0], up: -1, seed: k === 'L' ? 5.1 : 5.9 });
  }
  // ------------------------------------------------------------------ the head: a sack, its face sewn on
  const head = new THREE.Group(); head.name = 'giant.dress.head'; Gi.head.add(head);
  S.add(head, uvs(new THREE.SphereGeometry(2.2, 20, 14), 3, 2), 'burlap', { at: [0, 1.95, 0], scale: [1, 0.95, 0.86] });
  S.add(head, new THREE.CircleGeometry(1.75, 28), 'face', { at: [0, 1.9, 1.86] });
  S.add(head, new THREE.TorusGeometry(1.3, 0.18, 6, 20), 'rope', { at: [0, 0.25, 0], rot: [PI / 2, 0, 0] });
  tuft(S, head, straws, 0.9, 18, 1.5, { at: [0, 3.7, -0.2], seed: 6.3 });
  tuft(S, head, straws, 1.1, 14, 0.8, { at: [0, 0.05, 0], up: -1, seed: 6.9, splay: 1.2 });
  S.add(head, new THREE.BoxGeometry(0.75, 0.75, 0.2), 'red', { at: [1.5, 2.9, 1.05], rot: [0, 0.6, 0.3] }); // (a patch over the brow)
  // ------------------------------------------------------------------ the arms: sleeves on the yoke, straw fists bound with rope
  (Gi.arms || []).forEach((A, i) => {
    const F = Gi.fore?.[i]; if (!A) return;
    S.add(A, uvs(sack(0.95, 1.05, 4.4, { belly: 0.08, d: 0.95, seg: 14, rows: 4 }), 2, 2), 'burlap', { at: [0, -2.1, 0] });
    S.add(A, new THREE.TorusGeometry(1.05, 0.14, 5, 14), 'rope', { at: [0, -0.3, 0], rot: [PI / 2, 0, 0] });
    tuft(S, A, straws, 0.95, 12, 1.0, { at: [0, 0.1, 0], seed: 7.1 + i, splay: 1.1 });
    if (!F) return;
    S.add(F, uvs(sack(0.9, 0.85, 4.0, { belly: 0.06, d: 0.95, seg: 14, rows: 4 }), 2, 2), 'burlap', { at: [0, -1.9, 0] });
    S.add(F, new THREE.CylinderGeometry(0.62, 0.62, 0.2, 16), 'button', { at: [0, 0.1, 0.95], rot: [PI / 2, 0, 0] }); // (the elbow's button)
    S.add(F, uvs(new THREE.SphereGeometry(1.35, 14, 10), 2, 1), 'burlap', { at: [0, -4.6, 0], scale: [1, 1.1, 0.95] }); // (the fist: a stuffed mitten)
    for (const y of [-3.7, -4.1]) S.add(F, new THREE.TorusGeometry(0.95, 0.15, 5, 14), 'rope', { at: [0, y, 0], rot: [PI / 2, 0, 0] });
    tuft(S, F, straws, 0.7, 16, 1.4, { at: [0, -5.7, 0], up: -1, seed: 8.3 + i });
    tuft(S, F, straws, 0.5, 8, 1.0, { at: [0.9, -4.8, 0.6], rot: [0, 0, -1.2], seed: 9.1 + i, splay: 0.5 });
  });
  const meshes = S.done(mats);
  hidePlaceholder(Gi.mats, true, ['barrier']);

  // ------------------------------------------------------------------ the states
  let spillT = 0, wasDown = false, wasStag = false, sagK = 0;
  const seams = [[3.75, 8.2, 0.4], [-3.4, 10.6, -1.2], [0, 13.3, 0.5], [2.6, 5, 1.6], [-2.4, 5, 1.8]];
  const at = (p) => body.localToWorld(_v.set(...p));
  const play = (n, ctx) => { try { game.vfx?.play(n, ctx); } catch { /* (headless: no effects) */ } };
  return {
    kind: 'straw', meshes,
    update(dt, t) {
      const st = Gi.stagger?.staggerT > 0, down = Gi.down > 0;
      sagK += ((st ? 1 : 0) - sagK) * Math.min(1, dt * 5);
      sag.scale.set(1 + 0.05 * sagK, 1 - 0.07 * sagK, 1 + 0.04 * sagK); sag.position.y = 9 - 0.35 * sagK;
      head.rotation.set(0.35 * sagK, 0, 0.18 * sagK * Math.sin(t * 1.3));
      scaf.rotation.z = sagK * 0.025 * Math.sin(t * 6.3); scaf.rotation.x = sagK * 0.015 * Math.sin(t * 4.1);
      body.updateMatrixWorld(true);
      if (down && !wasDown) { play('giant.straw.burst', { pos: at([0, 9, 1]), scale: 1.4 }); play('giant.straw.dust', { pos: B.copy(Gi.pos).setY(Gi.pos.y + 0.2), scale: 1.3 }); }
      if (st && !wasStag) play('giant.straw.burst', { pos: at([0, 10, 2]), scale: 0.8 });
      wasDown = down; wasStag = st;
      spillT -= dt;
      const rate = st ? K.spillEvery : down ? K.spillEvery * 3 : Gi.awake ? K.spillEvery * 6 : Infinity;
      if (spillT <= 0 && rate < Infinity && Gi.group?.visible !== false) { spillT = rate * (0.6 + Math.random() * 0.8); play('giant.straw.spill', { pos: at(seams[(Math.random() * seams.length) | 0]) }); }
    },
    dispose() {
      for (const m of meshes) { m.removeFromParent(); m.geometry.dispose(); }
      scaf.removeFromParent(); sag.removeFromParent(); head.removeFromParent();
      for (const m of Object.values(mats)) m.dispose(); // (the canvases are the kit's, shared)
      hidePlaceholder(Gi.mats, false);
    },
  };
}
