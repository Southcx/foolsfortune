// ---------------------------------------------------------------------------------------
// A SPIRIT'S FORM: how a bound Figment looks once it matures (the owner, 2026-10-07: the full build, Round 3, "15 forms a kind,
// placeholders first"; docs/plans/SPIRIT-GARDEN.md section 5; the rule is Dovina's, progress/spirits.js formOf: its strongest feeling and
// its side of the Law-Chaos line, 5 x 3). Built once for every kind: the kind keeps its own body (a slip jelly stays a slip jelly), and the
// form is worn on it, as a Chao keeps its shape and grows its hero's halo or its dark one's horns.
//
//   THE FEELING  its element, from Wu Xing (SPIRIT-GARDEN.md section 2), worn where it reads from above, and its colour in the skin:
//                  mirth  (fire)   a crest of flame flickering on its crown
//                  wonder (wood)   leaves sprouting from its crown, a bud among them
//                  desire (earth)  plates of stone along its back
//                  grief  (metal)  a ring of polished metal round it, a bell's ring
//                  dread  (water)  drops of water orbiting it slowly
//   THE SIDE     Law: a halo over it, pale gold.  Neutral: nothing added, its colour pure.  Chaos: two small horns, its colour shaded.
//
// Prior art: Sonic Adventure's Chao (the hero's halo, the dark one's horns, a type worn on the same small body), the Wu Xing elements of
// cultivation fiction (a spirit beast's affinity shown in its body), and Monster Rancher's breeds (one body, many coats).
//
//   const undo = dressForm(root, { feeling, side: 'law' | 'neutral' | 'chaos', size })   root.userData.form.update(rawDt)   undo()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../weather.js';

export const SIDES = ['law', 'neutral', 'chaos'];

/** Dress a spirit's body in its form. `size`: its height in metres (measured from the body if not given). Returns an undo. */
export function dressForm(root, { feeling = 'wonder', side = 'neutral', size = null } = {}) {
  root.updateWorldMatrix(true, true);
  const ws = root.getWorldScale(new THREE.Vector3()), box = new THREE.Box3().setFromObject(root), wp = root.getWorldPosition(new THREE.Vector3());
  const H = size ?? Math.max(0.3, (box.max.y - wp.y) / ws.y), W = Math.max(0.2, (box.max.x - box.min.x) / 2 / ws.x);
  const g = new THREE.Group(); g.name = `form-${feeling}-${side}`; root.add(g);
  const col = new THREE.Color(COLOR[feeling] ?? COLOR.wonder); if (side === 'chaos') col.multiplyScalar(0.55);
  const mats = [], geos = [], std = (c, o = {}) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, ...o }); mats.push(m); return m; };
  const mesh = (geo, mat) => { geos.push(geo); return new THREE.Mesh(geo, mat); };
  const anim = [];

  if (feeling === 'mirth') { // a crest of flame
    const fire = new THREE.MeshBasicMaterial({ color: col.clone().lerp(new THREE.Color(0xff6a2a), 0.4), transparent: true, opacity: 0.9 }); mats.push(fire);
    for (let i = 0; i < 3; i++) { const f = mesh(new THREE.ConeGeometry(W * 0.28, H * (0.6 - i * 0.12), 6), fire); f.position.set((i - 1) * W * 0.3, H + H * 0.22, 0); g.add(f); anim.push((t) => { f.scale.set(1, 0.8 + 0.3 * Math.sin(t * 9 + i * 2), 1); }); }
  } else if (feeling === 'wonder') { // leaves sprouting, a bud among them
    const leaf = std(col.clone().lerp(new THREE.Color(0x6ac46a), 0.5)), bud = std(0xf2a8c8);
    for (let i = 0; i < 4; i++) { const l = mesh(new THREE.SphereGeometry(W * 0.4, 8, 4), leaf); l.scale.set(0.45, 0.14, 1); l.position.set(0, H + 0.02, 0); l.rotation.set(-1.05, (i / 4) * Math.PI * 2 + 0.4, 0); l.translateZ(W * 0.32); g.add(l); }
    const b = mesh(new THREE.SphereGeometry(W * 0.16, 8, 6), bud); b.position.y = H + W * 0.2; g.add(b);
  } else if (feeling === 'desire') { // plates of stone along its back
    const st = std(col.clone().lerp(new THREE.Color(0x8a7060), 0.5), { flatShading: true });
    for (let i = 0; i < 4; i++) { const p = mesh(new THREE.BoxGeometry(W * 0.36, H * (0.42 - Math.abs(i - 1.5) * 0.08), W * 0.1), st); const a = (i - 1.5) * 0.45; p.position.set(Math.sin(a) * W * 0.55, H * 0.8 + Math.cos(a) * H * 0.12, -W * 0.15); p.rotation.z = -a; g.add(p); } // (a fan of stone plates across its back, read from the front and from above)
  } else if (feeling === 'grief') { // a ring of polished metal, a bell's ring
    const metal = std(col.clone().lerp(new THREE.Color(0xd8dde6), 0.6), { metalness: 0.9, roughness: 0.15 });
    const r = mesh(new THREE.TorusGeometry(W * 1.25, W * 0.05, 6, 28), metal); r.rotation.x = Math.PI / 2 - 0.25; r.position.y = H * 0.55; g.add(r);
    anim.push((t) => { r.rotation.z = t * 0.6; });
  } else if (feeling === 'dread') { // drops of water orbiting it slowly
    const water = std(col.clone().lerp(new THREE.Color(0x5ec8e0), 0.3), { roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.8 });
    const drops = [0, 1, 2].map((i) => { const d = mesh(new THREE.SphereGeometry(W * 0.2, 10, 8), water); d.scale.y = 1.3; g.add(d); return d; });
    anim.push((t) => drops.forEach((d, i) => { const a = t * 0.8 + (i / 3) * Math.PI * 2; d.position.set(Math.cos(a) * W * 1.3, H * (0.6 + 0.1 * Math.sin(t * 1.3 + i)), Math.sin(a) * W * 1.3); }));
  }
  if (side === 'law') { // a halo over it
    const halo = mesh(new THREE.TorusGeometry(W * 0.32, W * 0.035, 6, 24), std(0xf2e2a0, { emissive: 0xf2d27a, emissiveIntensity: 0.6, metalness: 0.3 }));
    halo.rotation.x = Math.PI / 2; halo.position.y = H + H * 0.32; g.add(halo); anim.push((t) => { halo.position.y = H + H * (0.32 + 0.03 * Math.sin(t * 2)); });
  } else if (side === 'chaos') { // two small horns
    const horn = std(0x2a1e2a, { roughness: 0.4 });
    for (const s of [-1, 1]) { const h = mesh(new THREE.ConeGeometry(W * 0.1, H * 0.38, 6), horn); h.position.set(s * W * 0.32, H + H * 0.06, W * 0.05); h.rotation.z = -s * 0.45; g.add(h); }
  }
  // its skin takes a little of the feeling's colour (a tint laid over, not its own material changed: undone with the rest)
  const tint = mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: side === 'neutral' ? 0.16 : 0.1, depthWrite: false, blending: THREE.AdditiveBlending }));
  mats.push(tint.material); tint.scale.set(W * 1.12, H * 0.56, W * 1.12); tint.position.y = H * 0.48; g.add(tint); // (a soft glow just off the skin: laid on it, it fights it)
  let t = 0; root.userData.form = { feeling, side, update(raw = 1 / 60) { t += raw; for (const f of anim) f(t); } };
  return () => { root.remove(g); delete root.userData.form; for (const x of geos) x.dispose(); for (const m of mats) m.dispose(); };
}
