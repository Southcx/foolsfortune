// ---------------------------------------------------------------------------------------
// THE COCOON TREE: where spirits are cocooned and merged (the owner, 2026-10-07: the full build, Round 4; docs/plans/SPIRIT-GARDEN.md
// section 5: "set a spirit in the cocoon tree; set two together to merge", Jade Cocoon's way). It grows on the Mulberry Grove, the oldest
// thing in the garden, and its silk is the Lachryma's: what is wrapped in it is remade.
//
//   THE TREE     a great twisted trunk of plum-dark bark, roots gripping the planetoid, a broad low canopy of mulberry leaves in
//                labradorite and gold (vfx/garden/leafcanopy.js); silk hanging in its boughs
//   A COCOON     a pod of pale silk hanging from a bough on a thread. cocoon(i, { feeling, k }): the silk winds round (k 0..1) and the
//                pod glows from within with the spirit's feeling, breathing slowly
//   A MERGING    merge(i, j, k): two pods drawn toward each other along their threads, twining, the light passing between them in a
//                braid, until (at 1) they are one pod with both their colours
//   THE SPLIT    open(i): the pod splits and its silk falls away in threads (the spirit is out: Petra's body there)
//
// Prior art: Jade Cocoon (the cocoon master, the merged child), the silk moth and the mulberry (sericulture, the oldest of China's
// crafts), the world tree and the Bodhi tree (the old tree as the place of becoming), and Okami's guardian sapling.
//
//   const T = new CocoonTree({ slots: 3 })   T.group (stands on its origin, +Y up; ~9 m)   T.cocoon(i, { feeling, k })   T.merge(i, j, k)
//   T.open(i)   T.slotWorld(i, out)   T.update(rawDt)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../weather.js';
import { mergeStatic } from '../../render/merge.js';
import { LeafCanopy } from './leafcanopy.js';

export class CocoonTree {
  constructor({ slots = 3 } = {}) {
    const g = (this.group = new THREE.Group()); g.name = 'cocoon-tree'; this.t = 0;
    const bark = new THREE.MeshStandardMaterial({ name: 'cocoon-bark', color: 0x4a3638, roughness: 0.95, flatShading: true }); // (the garden's plum-dark bark)
    // the trunk: a twisted column, flaring to its roots
    const tg = new THREE.CylinderGeometry(0.7, 1.4, 5, 10, 10); tg.translate(0, 2.5, 0); const P = tg.attributes.position;
    for (let i = 0; i < P.count; i++) { const y = P.getY(i), a = y * 0.5, x = P.getX(i), z = P.getZ(i), flare = 1 + 0.5 * Math.max(0, 1 - y) ** 2; P.setXYZ(i, (x * Math.cos(a) - z * Math.sin(a)) * flare * (1 + 0.08 * Math.sin(y * 3 + x)), y, (x * Math.sin(a) + z * Math.cos(a)) * flare); }
    tg.computeVertexNormals(); g.add(new THREE.Mesh(tg, bark));
    // roots gripping the ground, and the boughs
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, r = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.4, 5), bark); r.position.set(Math.cos(a) * 1.2, 0.2, Math.sin(a) * 1.2); r.rotation.set(0, -a, Math.PI / 2 - 0.25); r.rotateY(Math.PI / 2); g.add(r); }
    this.slots = [];
    for (let i = 0; i < slots; i++) {
      const a = (i / slots) * Math.PI * 2 + 0.4, len = 3.2, bough = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.3, len, 6).translate(0, len / 2, 0), bark);
      bough.position.set(0, 4.4, 0); bough.rotation.set(0, -a, -1.15); g.add(bough);
      const tip = new THREE.Vector3(Math.cos(a) * len * 0.92, 4.4 + len * 0.4, Math.sin(a) * len * 0.92);
      this.slots.push({ a, tip, pod: null, k: 0, feeling: null, mix: 0, open: -1 });
    }
    // the canopy: a broad low crown of mulberry leaves (the silk moth's tree) in labradorite and gold, the owner's billboarded leaves
    // (vfx/garden/leafcanopy.js): a sphere over the trunk and a ring of nine round it, low and wide as the old tree's crown is
    const crown = [{ c: [0, 7.1, 0], r: 2.1 }];
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, r = i % 3 === 0 ? 1.5 : 2.8; crown.push({ c: [Math.cos(a) * r, 6.3 + (i % 3) * 0.35, Math.sin(a) * r], r: 1.25 + (i % 2) * 0.35 }); }
    this.canopy = new LeafCanopy({ spheres: crown, leaf: 'mulberry', seed: 7, density: 1.1 }); g.add(this.canopy.mesh);
    mergeStatic(g);
    // the threads and pods
    this.threadMat = new THREE.LineBasicMaterial({ color: 0xe8e2d8 });
    for (const S of this.slots) {
      S.u = { uA: { value: new THREE.Color(0xffffff) }, uB: { value: new THREE.Color(0xffffff) }, uK: { value: 0 }, uT: { value: 0 }, uMix: { value: 0 } };
      S.mat = new THREE.MeshStandardMaterial({ name: 'cocoon-pod', color: 0xece6dc, roughness: 0.75, emissive: 0x000000 }); // (silk, lit from within: a plain material, its glow driven below)
      const pod = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), S.mat);
      pod.scale.set(0.8, 1.35, 0.8); pod.name = 'cocoon-pod'; pod.visible = false; g.add(pod); S.pod = pod;
      S.thread = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(6), 3)), this.threadMat); S.thread.visible = false; S.thread.frustumCulled = false; g.add(S.thread);
      S.rest = S.tip.clone().setY(S.tip.y - 1.6); S.pos = S.rest.clone(); // (rest: where its pod hangs; pos: where it hangs now, moved by a merge)
    }
  }

  /** A spirit in slot i: its feeling's light within, the silk wound round by k (0 none .. 1 sealed). */
  cocoon(i, { feeling = 'wonder', k = 1 } = {}) { const S = this.slots[i]; if (!S) return; if (S.k <= 0.01 && S.open < 0) S.pos.copy(S.rest); S.k = k; S.feeling = feeling; S.u.uA.value.setHex(COLOR[feeling] ?? COLOR.wonder); if (!S.mixing) S.u.uB.value.copy(S.u.uA.value); S.open = -1; }
  /** Two cocooned spirits merging (Jade Cocoon): drawn together and twined by k; at 1 they hang as one pod with both colours. */
  merge(i, j, k) { const A = this.slots[i], B = this.slots[j]; if (!A || !B) return; this.merging = { i, j, k: THREE.MathUtils.clamp(k, 0, 1) }; A.mixing = B.mixing = true; A.u.uB.value.copy(B.u.uA.value); B.u.uB.value.copy(A.u.uA.value); }
  /** The pod splits and its silk falls away (the spirit is out). */
  open(i) { const S = this.slots[i]; if (S) { S.open = 0; } }
  /** Where slot i's pod hangs (world). */
  slotWorld(i, out = new THREE.Vector3()) { return this.slots[i].pod.getWorldPosition(out); }

  update(raw = 1 / 60) {
    this.t += raw; const t = this.t, M = this.merging;
    for (const [n, S] of this.slots.entries()) {
      const sway = 0.08 * Math.sin(t * 0.9 + n * 2), home = _v.copy(S.pos).add(_w.set(sway, 0, sway * 0.5));
      if (M && (M.i === n || M.j === n)) { const other = this.slots[M.i === n ? M.j : M.i], mid = _w.copy(S.pos).lerp(other.pos, 0.5).setY(Math.min(S.pos.y, other.pos.y) - 0.3); home.lerp(mid, M.k * M.k); S.u.uMix.value = M.k; }
      const show = S.k > 0.01 || S.open >= 0; S.pod.visible = show; S.thread.visible = show;
      if (S.open >= 0) { S.open += raw / 0.8; const o = Math.min(1, S.open); S.pod.scale.set(0.8 * (1 + o * 0.6), 1.35 * (1 - o * 0.7), 0.8 * (1 + o * 0.6)); if (o >= 1) { S.k = 0; S.open = -1; S.pod.visible = S.thread.visible = false; S.pos.copy(S.rest); } }
      else S.pod.scale.set(0.8 * (0.6 + 0.4 * S.k), 1.35 * (0.5 + 0.5 * S.k) * (1 + 0.03 * Math.sin(t * 1.6 + n)), 0.8 * (0.6 + 0.4 * S.k));
      S.pod.position.copy(home); S.pod.rotation.y = t * 0.2 + n + (M && (M.i === n || M.j === n) ? M.k * t * 2 : 0);
      S.u.uK.value = S.k; S.u.uT.value = t; S.mat.emissive.copy(S.u.uA.value).lerp(S.u.uB.value, S.u.uMix.value * (0.5 + 0.5 * Math.sin(t * 2 + n))).multiplyScalar(S.k * (0.45 + 0.2 * Math.sin(t * 1.6 + n))); // (both colours braided when merged; the light breathing)
      const P = S.thread.geometry.attributes.position; P.setXYZ(0, S.tip.x, S.tip.y, S.tip.z); P.setXYZ(1, home.x, home.y + 0.7, home.z); P.needsUpdate = true;
    }
    if (M && M.k >= 1) { const A = this.slots[M.i], B = this.slots[M.j]; A.pos.lerp(B.pos, 0.5).setY(Math.min(A.pos.y, B.pos.y) - 0.3); B.k = 0; B.pos.copy(B.rest); B.pod.visible = B.thread.visible = false; this.slots[M.i].mixing = false; B.mixing = false; this.merging = null; } // (one pod now: the merged child hangs where they met)
  }

  dispose() { this.group.parent?.remove(this.group); this.canopy.dispose(); this.group.traverse((o) => { o.geometry?.dispose?.(); if (!o.material?.userData?.shared) o.material?.dispose?.(); }); } // (the canopy's material is everyone's: casebook rule 24)
}
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
