// ---------------------------------------------------------------------------------------
// THE PLANE MARK: the plane reticle's look (Petra's courier/planereticle.js, lent by Strawman's Well's frame), a world mark on the stage's
// plane where the tool in hand will act, one a tool (the psygun's own reticle already stands there: vfx/psygunreticle.js, so it draws none):
//   the thread    a running stitch of dashes from the chest to the mark (Pip's tacking thread, the toy theatre's), in the tool's suit colour;
//                 the Lockheart's is a chain of links instead, its flail's reach
//   the mark      the Sondelass the hook's bite (a crescent and its point), the Soul Brush an ensō (an open brush ring, thick to thin), the
//                 Veritome the lens's four corners, the Dreamvane a dowsing diamond with its vane, the Crucibelle the bell's ring and its
//                 ripple going out on the beat, the Lockheart a padlock's shackle over its body; anything else a plain ring and dot
// Looks only, drawn over everything (depth off) as the placeholder was; no words. Colours are the suits' (vfx/readingview.js SUIT_LOOK,
// progress/spreads.js TOOL_SUIT), so a tool's mark reads as its tool everywhere else it is seen. One program (MeshBasicMaterial, four
// colours); two instanced meshes for the thread; nothing allocated a frame.
//
// Prior art: the side-on shooters' mouse reticles (Terraria's cursor, Noita's wand reticle, Metroid Dread's aim laser), Okami's
// brush ensō, a camera's framing corners, the house's own tool UIs (the Sondelass's guard, the Soul Brush's desk, the Lockheart's
// reliquary) for each tool's sign.
//
//   const M = new PlaneMarks(game)   M.show(on, tool)   M.update(dt, chest, point)   M.dispose()   PLANE_MARK
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SUIT_LOOK } from '../readingview.js';
import { TOOL_SUIT } from '../../progress/spreads.js';

export const PLANE_MARK = {
  size: 0.46, // (the mark's radius, m: it reads at the side camera's distance, about a head's height)
  dash: [0.2, 0.06], gap: 0.13, link: 0.1, from: 0.45, // (the thread's dash and gap, a link's radius; it starts this far off the chest)
  opacity: 1, thread: 0.85, ink: 0x1a1008, inkGrow: 0.16, inkThread: 2.2, // (a dark keyline behind every mark and dash so it reads on the painted backdrop's light gold as on the dark wings: the gems' keyline rule)
   breathe: [0.08, 3.2], // (the mark's and the thread's opacity; its breath, scale and rate)
  bell: 1.1, // (the Crucibelle's ripple, real s a ring)
  plain: 0xf2e6c8, max: 48,
};
const K = PLANE_MARK, _d = new THREE.Vector3(), _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _z = new THREE.Vector3(0, 0, 1);

const ring = (r0, r1, a0 = 0, len = Math.PI * 2, seg = 40) => new THREE.RingGeometry(r0, r1, seg, 1, a0, len);
const bar = (w, h, x, y, rot = 0) => { const b = new THREE.PlaneGeometry(w, h); if (rot) b.rotateZ(rot); b.translate(x, y, 0); return b; };
/** An ensō: an open ring whose stroke swells then thins, its tail lifting off (a brush's ring, drawn as a strip). */
function enso(r, w, seg = 48) {
  const pos = [], idx = [], a0 = 1.9, len = Math.PI * 1.82;
  for (let i = 0; i <= seg; i++) {
    const u = i / seg, a = a0 - u * len, t = w * (0.35 + 0.95 * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.7) * (1 - 0.7 * u ** 3);
    const rr = r * (1 + 0.04 * Math.sin(u * 9)), c = Math.cos(a), s = Math.sin(a);
    pos.push(c * (rr - t / 2), s * (rr - t / 2), 0, c * (rr + t / 2), s * (rr + t / 2), 0);
    if (i) { const k = i * 2; idx.push(k - 2, k - 1, k, k - 1, k + 1, k); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
}
const merge = (list) => { // (position only, unindexed: mergeGeometries refuses parts whose attributes differ, and the ensō's strip has no uv)
  const parts = list.map((x) => { const n = x.index ? x.toNonIndexed() : x, o = new THREE.BufferGeometry(); o.setAttribute('position', n.attributes.position); return o; });
  const g = mergeGeometries(parts); list.forEach((x) => x.dispose()); return g;
};

/** Each tool's mark, built once at r = 1 and scaled. */
function markGeometry(tool) {
  const w = 0.09;
  switch (tool) {
    case 'sondelass': return merge([ring(0.82, 0.82 + w * 1.3, 0.5, Math.PI * 1.45), ring(0, 0.16, 0, Math.PI * 2, 14), bar(w, 0.42, 0.88, 0.62, -0.5)]); // (the hook's crescent, its barb and the bite)
    case 'soulbrush': return merge([enso(0.9, 0.24), ring(0, 0.1, 0, Math.PI * 2, 12)]);
    case 'veritome': { const L = 0.5, o = 1; return merge([[-1, 1], [1, 1], [1, -1], [-1, -1]].flatMap(([sx, sy]) => [bar(L, w, sx * (o - L / 2), sy * o), bar(w, L, sx * o, sy * (o - L / 2))]).concat([ring(0, 0.08, 0, Math.PI * 2, 10)])); }
    case 'dreamvane': { const d = 0.95, s = Math.SQRT1_2 * d * 2; const sides = [0, 1, 2, 3].map((i) => bar(s, w, Math.cos(Math.PI / 4 + i * Math.PI / 2) * d * Math.SQRT1_2, Math.sin(Math.PI / 4 + i * Math.PI / 2) * d * Math.SQRT1_2, Math.PI / 4 + i * Math.PI / 2 + Math.PI / 2)); return merge([...sides, bar(w * 0.8, 0.7, 0, 0.35), ring(0, 0.12, 0, Math.PI * 2, 4)]); }
    case 'crucibelle': return merge([ring(0.62, 0.62 + w * 1.2), ring(0.3, 0.3 + w), bar(w * 0.9, 0.34, 0, -0.95)]); // (the bell's lip, its sound ring, the clapper)
    case 'lockheart': return merge([ring(0.5, 0.5 + w * 1.2, 0, Math.PI, 24).translate(0, 0.25, 0), bar(w * 1.2, 0.3, -0.56, 0.12), bar(w * 1.2, 0.3, 0.56, 0.12), bar(1.3, w * 1.3, 0, -0.03), bar(1.3, w * 1.3, 0, -0.87), bar(w * 1.3, 0.84, -0.65, -0.45), bar(w * 1.3, 0.84, 0.65, -0.45), ring(0, 0.11, 0, Math.PI * 2, 10).translate(0, -0.4, 0), bar(w, 0.2, 0, -0.56)]); // (the padlock: its shackle over its body's outline, the keyhole inside)
    default: return merge([ring(0.8, 0.8 + w * 1.1), ring(0, 0.18, 0, Math.PI * 2, 14)]);
  }
}

export class PlaneMarks {
  constructor(game) {
    this.game = game; this.t = 0; this.tool = undefined; this.on = false;
    this.group = new THREE.Group(); this.group.name = 'plane.mark'; this.group.visible = false; this.group.renderOrder = 999;
    const mat = (c, o) => new THREE.MeshBasicMaterial({ color: c, depthTest: false, depthWrite: false, transparent: true, opacity: o });
    this.mat = mat(K.plain, K.opacity); this.threadMat = mat(K.plain, K.thread); this.inkMat = mat(K.ink, 0.85);
    this.mark = new THREE.Mesh(new THREE.BufferGeometry(), this.mat); this.mark.renderOrder = 1000; this.mark.frustumCulled = false;
    this.inkMark = new THREE.Mesh(this.mark.geometry, this.inkMat); this.inkMark.renderOrder = 997; this.inkMark.frustumCulled = false; // (the keyline: the mark drawn larger in ink, behind it)
    this.ripple = new THREE.Mesh(ring(0.92, 1), this.mat.clone()); this.ripple.renderOrder = 999; this.ripple.visible = false; this.ripple.frustumCulled = false;
    this.dashes = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), this.threadMat, K.max);
    this.links = new THREE.InstancedMesh(ring(0.62, 1, 0, Math.PI * 2, 14).scale(1, 0.62, 1), this.threadMat, K.max);
    this.inkDashes = new THREE.InstancedMesh(this.dashes.geometry, this.inkMat, K.max); this.inkLinks = new THREE.InstancedMesh(this.links.geometry, this.inkMat, K.max);
    for (const m of [this.dashes, this.links]) { m.count = 0; m.renderOrder = 998; m.frustumCulled = false; }
    for (const m of [this.inkDashes, this.inkLinks]) { m.count = 0; m.renderOrder = 996; m.frustumCulled = false; }
    this.group.add(this.inkDashes, this.inkLinks, this.dashes, this.links, this.inkMark, this.ripple, this.mark);
    this.geos = new Map();
    game.scene?.add(this.group);
  }

  /** Shown or hidden; `tool` the id in hand (the mark and colour change with it). */
  show(on, tool = null) {
    this.on = !!on; this.group.visible = this.on;
    if (!this.on || tool === this.tool) return;
    this.tool = tool;
    let g = this.geos.get(tool); if (!g) this.geos.set(tool, (g = markGeometry(tool)));
    this.mark.geometry = g; this.inkMark.geometry = g;
    const c = SUIT_LOOK[TOOL_SUIT[tool]] ?? K.plain;
    this.mat.color.setHex(c); this.threadMat.color.setHex(c); this.ripple.material.color.setHex(c);
    this.ripple.visible = tool === 'crucibelle';
  }

  /** Each frame while shown: the mark at `point`, the thread from `chest` (world, on the plane). */
  update(dt, chest, point) {
    if (!this.on || !point) return;
    this.t += dt;
    const breathe = 1 + K.breathe[0] * Math.sin(this.t * K.breathe[1]);
    this.mark.position.copy(point); this.mark.scale.setScalar(K.size * breathe);
    if (this.tool === 'veritome') this.mark.scale.setScalar(K.size * (1.1 - 0.06 * breathe)); // (the corners close in a touch, a lens focusing)
    this.inkMark.position.copy(point); this.inkMark.position.z -= 0.001; this.inkMark.scale.copy(this.mark.scale).multiplyScalar(1 + K.inkGrow);
    if (this.ripple.visible) { const u = (this.t / K.bell) % 1; this.ripple.position.copy(point); this.ripple.scale.setScalar(K.size * (0.7 + 1.1 * u)); this.ripple.material.opacity = 0.6 * (1 - u); }
    // the thread: dashes (or links) along chest -> point, stopping short of the mark
    const chain = this.tool === 'lockheart', M = chain ? this.links : this.dashes, other = chain ? this.dashes : this.links, I = chain ? this.inkLinks : this.inkDashes;
    other.count = 0; (chain ? this.inkDashes : this.inkLinks).count = 0; I.count = 0;
    _d.copy(point).sub(chest); const L = _d.length() - K.from - K.size * 1.1; if (L <= 0) { M.count = 0; I.count = 0; return; }
    _d.normalize(); _q.setFromAxisAngle(_z, Math.atan2(_d.y, _d.x));
    const step = chain ? K.link * 1.7 : K.dash[0] + K.gap, n = Math.min(K.max, Math.floor(L / step)), slide = chain ? 0 : (this.t * 0.35) % step;
    for (let i = 0; i < n; i++) {
      const s = K.from + slide + i * step + (chain ? K.link : K.dash[0] / 2); if (s > K.from + L) { M.count = i; break; }
      _p.copy(chest).addScaledVector(_d, s);
      if (chain) _s.set(K.link * 1.25, i % 2 ? K.link * 0.3 : K.link, 1); // (every other link turned edge-on, a chain's read)
      else _s.set(K.dash[0], K.dash[1], 1);
      M.setMatrixAt(i, _m.compose(_p, _q, _s));
      _s.x += K.dash[1] * (K.inkThread - 1); _s.y = chain ? _s.y + K.dash[1] * 0.8 : K.dash[1] * K.inkThread; _p.z -= 0.001; I.setMatrixAt(i, _m.compose(_p, _q, _s));
      M.count = I.count = i + 1;
    }
    M.instanceMatrix.needsUpdate = true; I.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    this.group.removeFromParent();
    for (const g of this.geos.values()) g.dispose();
    for (const m of [this.dashes, this.links, this.ripple]) m.geometry.dispose();
    for (const m of [this.mat, this.threadMat, this.inkMat, this.ripple.material]) m.dispose();
  }
}
