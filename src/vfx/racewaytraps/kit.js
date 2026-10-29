// ---------------------------------------------------------------------------------------
// THE TRAPS' KIT (vfx/racewaytraps.js): what every trap's body and tell are made of. The Raceway's ruin stone (vertex-coloured, flat:
// the park's program), the tell's glow (additive basic), ground marks draped over the ground as shaped (a made track's banks and kickers:
// the mark follows the sand, never floats or sinks), four small canvas patterns made once for the game (a soft ring, a sinking spiral,
// wind streaks, a hole's dark), and the one law of a tell's colour and beat:
//   IDLE    the trap's reach faint in gold: where it bites, seen from the editor's camera and from the board, never a warning
//   TELL    the reach in ember, its beat quickening with k (0..1 through the tell), brighter as it nears: at least the trap's tell long
//   ACTIVE  the reach lit hot (fury's red-orange), held while it acts
//   STUNNED the reach and the body's light gone grey (the turret parried home)
// A portal's lit eye is Lachryma's blue, possessed red (Dovina's rule: Read shows which).
//
// Prior art: the house's Figment attack telegraph's grammar (where, when, what kind: vfx/figmenttelegraph.js), Fall Guys' hazards (the
// lit floor before a beat), Mario Kart's Thwomp shadow growing on the road; decals draped over terrain by vertex (vfx/slicks.js).
//
//   PALETTE, STATE   paint(geo, colour)   solid(parts, mat?) -> Mesh   glowMat(colour, opacity, map?)   pattern(name) -> CanvasTexture
//   own(name, repeat?) -> a clone of a pattern (its own offset)   drape(geo, root, R, lift)   markShow(mat, Tp, t, o)   isTell(Tp)
//   stoneMat()   releaseOutlines(root)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { addOutline, OUTLINES } from '../../render/outline.js';

/** The Raceway's stone and glazes (the park's: vfx/racewaypark.js), and the tell's colours. */
export const PALETTE = { strata: [0xd9906a, 0xc07a48, 0xa8643a], gold: 0xffd696, cap: 0x8a4a3a, ame: 0xb8692e, drip: 0x4a2414, coping: 0xf0d6b0,
  lapis: 0x2c3f8f, iron: 0x3a2214, celadon: 0x9fd6c4, bisque: 0xf0d6b0, sand: 0x6a4428, crude: 0x08060c };
export const STATE = { idle: 0xffd36a, tell: 0xffb04a, active: 0xff5a2a, red: 0xc0102a, lit: 0x7fdcff, eye: 0xb49be6, stun: 0x6a5a78,
  idleO: 0.16, beat: [7, 16] }; // (beat: the tell's rate, rad a real second, at its start and its end)

/** A geometry painted one colour (non-indexed; position, normal and colour only, so any of them merge). */
export function paint(geo, colour) {
  const g = geo.index ? geo.toNonIndexed() : geo, c = new THREE.Color(colour), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.toArray(a, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
  if (g !== geo) geo.dispose();
  return g;
}
/** The park's stone: its own copy a trap (the traps' clear disposes what it finds; the program stays the park's). */
export const stoneMat = () => new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.6, flatShading: true });
/** Painted pieces [[geo, colour], ...] merged into one stone mesh, outlined. */
export function solid(parts, mat = stoneMat()) {
  const geo = mergeGeometries(parts.map(([g, c]) => paint(g, c))); geo.computeBoundingSphere();
  const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; addOutline(m); return m;
}
/** The tell's glow, never written to depth: laid over (a mark on the pale sand: added light there reads as nothing, the look's one
 *  headless check, 2026-10-29), or added (`add`: a halo in the air). */
export const glowMat = (colour, opacity = 0.6, map = null, add = false) => new THREE.MeshBasicMaterial({ color: colour, map, transparent: true, opacity, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });

// ---------------------------------------------------------------- the patterns (made once)
const PATTERNS = {};
const canvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
const DRAW = {
  // a soft band with a crisp edge each side (the reach ring)
  ring: (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.78, 'rgba(255,255,255,0.32)'); g.addColorStop(0.86, 'rgba(255,255,255,1)'); g.addColorStop(0.92, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); },
  // a spiral of sand running in (the sinkhole's tell)
  spiral: (x, w) => { x.translate(w / 2, w / 2); x.lineCap = 'round'; for (let arm = 0; arm < 3; arm++) { x.beginPath(); for (let i = 0; i <= 120; i++) { const t = i / 120, a = arm * 2.094 + t * 7.5, r = (w / 2) * (1 - t) * 0.98; if (i) x.lineTo(Math.cos(a) * r, Math.sin(a) * r); else x.moveTo(Math.cos(a) * r, Math.sin(a) * r); } x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = w * 0.045; x.stroke(); } },
  // wind: thin streaks of varied length along u (the gust's sheets)
  streak: (x, w, h) => { let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 26; i++) { const y = r() * h, len = w * (0.15 + 0.35 * r()), x0 = r() * w, g = x.createLinearGradient(x0, 0, x0 + len, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(x0, y, len, 1 + r() * 2); x.fillRect(x0 - w, y, len, 1 + r() * 2); } },
  // the hole: dark at its heart, eased to nothing at its lip
  hole: (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(10,6,4,0.96)'); g.addColorStop(0.85, 'rgba(60,36,20,0.6)'); g.addColorStop(1, 'rgba(90,60,30,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); },
  // a lane's hatch: broad diagonal bands (a pillar's footprint)
  hatch: (x, w) => { x.fillStyle = 'rgba(255,255,255,0.28)'; x.fillRect(0, 0, w, w); x.fillStyle = 'rgba(255,255,255,1)'; for (let i = -w; i < w * 2; i += w / 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + w / 8, 0); x.lineTo(i + w / 8 - w, w); x.lineTo(i - w, w); x.fill(); } },
};
/** A pattern, made the first time it is asked for (the game's: never disposed). */
export function pattern(name) {
  if (PATTERNS[name]) return PATTERNS[name];
  const size = name === 'streak' ? [256, 64] : [128, 128];
  const t = canvas(size[0], size[1], DRAW[name]); t.userData.shared = true;
  if (name === 'streak' || name === 'hatch') t.wrapS = t.wrapT = THREE.RepeatWrapping; // (the ring, spiral and hole clamp: their edge is clear, so a turn or a zoom never shows a neighbour)
  return (PATTERNS[name] = t);
}
/** A clone of a pattern with its own offset, repeat and turn (the image is shared); the trap disposes it. */
export function own(name, rx = 1, ry = 1) { const t = pattern(name).clone(); t.repeat.set(rx, ry); t.center.set(0.5, 0.5); t.needsUpdate = true; t.userData = {}; return t; }

/** A flat geometry in a trap's root (y up, at 0) draped over the ground under it, `lift` m over it (the root is moved, turned about y only). */
export function drape(geo, root, R, lift = 0.12) {
  root.updateMatrixWorld(true);
  const p = geo.attributes.position, v = new THREE.Vector3(), y0 = root.getWorldPosition(new THREE.Vector3()).y;
  for (let i = 0; i < p.count; i++) { v.set(p.getX(i), 0, p.getZ(i)).applyMatrix4(root.matrixWorld); p.setY(i, (R?.heightAt ? R.heightAt(v.x, v.z) : y0) - y0 + lift); }
  p.needsUpdate = true; geo.computeBoundingSphere(); return geo;
}
/** A flat disc, ring or rectangle in the root, laid flat (y up) at (x, z), with segments to drape. */
export const flatRing = (r0, r1, x = 0, z = 0, seg = 40) => new THREE.RingGeometry(r0, r1, seg, Math.max(2, Math.round((r1 - r0) / 0.8))).rotateX(-Math.PI / 2).translate(x, 0, z);
export const flatRect = (w, len, x = 0, z = 0) => new THREE.PlaneGeometry(w, len, Math.max(2, Math.round(w / 1.5)), Math.max(2, Math.round(len / 1.5))).rotateX(-Math.PI / 2).translate(x, 0, z);

/** Whether a trap is telling, and how far through (the pendulum's own: its bob nearing the line). */
export const isTell = (Tp) => Tp.phase === 'tell';
/** A reach mark's colour and strength by the trap's state (the law above); `o.k` overrides the tell's k, `o.idle` its idle strength. */
export function markShow(mat, Tp, t, o = {}) {
  const S = STATE, k = o.k ?? Tp.k ?? 0;
  if (Tp.stun > 0) { mat.color.setHex(S.stun); mat.opacity = 0.1; return; }
  if (Tp.phase === 'active' && !o.tellOnly) { mat.color.setHex(o.active ?? S.active); mat.opacity = o.activeO ?? 0.8; return; }
  if (Tp.phase === 'tell' || o.k != null) {
    const beat = S.beat[0] + (S.beat[1] - S.beat[0]) * k;
    mat.color.setHex(S.tell).lerp(_c.setHex(S.active), 0.35 * k * k); mat.opacity = Math.max(o.idle ?? S.idleO, 0.3 + 0.45 * k + 0.18 * Math.sin(t * beat)); return;
  }
  mat.color.setHex(o.idleColour ?? S.idle); mat.opacity = o.idle ?? S.idleO;
}
const _c = new THREE.Color();
/** The outline hulls under a trap's root taken out before the traps' clear disposes what it finds (their material is the house's). */
export function releaseOutlines(root) { const hulls = []; root.traverse((o) => { if (o.userData.isOutline) hulls.push(o); }); for (const o of hulls) { OUTLINES.delete(o); o.removeFromParent(); } }
