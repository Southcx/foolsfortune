// ---------------------------------------------------------------------------------------
// THE PLASTER PATCH: how a patch of newer plaster on the workshop's old wall looks, and how it breaks away (the dig and the blow are
// Petra's, world/ostraca.js; an ostracon was set into the wall behind it). Only a careful eye spots one: a skim a shade off the old
// wall, its tone cleaner, the trowel's overlapping arcs still in it, its rim feathered thin so the old wall's colour comes through at
// the edge, and a hairline crack running round just inside the rim where the new plaster shrank from the old. Struck, it comes away in
// a few flakes of itself (each a piece of the patch, its raw edge paler, falling to the floor and lying there a while) and a puff of
// its dust (the library's `plaster.break`); behind it the SCAR: the rough old wall bared, the broken plaster's pale cut round it, and
// the hollow the ostracon was set in.
//
// Prior art, as a museum label: Zelda's bombable walls (a cracked patch that a blow opens: its hairline crack is the tell), the conservator's
// "lacuna" (a repair a shade off the original so a careful eye can tell old from new: Cesare Brandi's tratteggio), a plasterer's
// trowel arcs on a lime skim, and the PS2's breakables that come apart in a few pieces of their own texture (Ico's castle pots).
//
//   const P = new PlasterPatch({ w, h, seed, wall, back })   P.group (on its origin: the patch's middle; +z out of the wall)
//   P.break({ vfx, floorY })   (the flakes fall to the world height floorY; vfx: game.vfx for the chips and dust)   P.update(dt)
//   P.dispose()   P.broken   P.done (the flakes gone: only the scar left)
//   (w, h: metres; wall: the old wall's colour; back: how far behind the origin the wall's face is; seed: a string, the same break each time)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';

const PXM = 320, FACE = 0.004, FLAKE_D = 0.018, LIE = 6, SHRINK = 1; // (texels a metre; the skim's face proud of the wall; a flake's thickness; real seconds a flake lies, then shrinks away)
const G = 9.8;
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _w = new THREE.Vector3();

function seeded(str) { let h = 2166136261; for (const ch of String(str)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const _rgb = { r: 0, g: 0, b: 0 }, _hsl = { h: 0, s: 0, l: 0 };
const css = (c, a = 1) => { c.getRGB(_rgb, THREE.SRGBColorSpace); return `rgba(${Math.round(_rgb.r * 255)}, ${Math.round(_rgb.g * 255)}, ${Math.round(_rgb.b * 255)}, ${a})`; };
/** A colour shifted in hue, saturation and lightness as the eye sees them (sRGB), not in the renderer's linear working space. */
const shade = (c, dh, ds, dl) => { c.getHSL(_hsl, THREE.SRGBColorSpace); return new THREE.Color().setHSL(_hsl.h + dh, THREE.MathUtils.clamp(_hsl.s + ds, 0, 1), THREE.MathUtils.clamp(_hsl.l + dl, 0, 1), THREE.SRGBColorSpace); };
function texture(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

/** The patch's rim: a rounded rectangle (a superellipse) a plasterer would skim, its edge wandering a little. */
function outline(w, h, rnd) {
  const pts = [], N = 36, e = 0.32, ph = rnd() * 6.28;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), r = 1 + 0.035 * Math.sin(a * 3 + ph) + 0.025 * Math.sin(a * 7 + ph * 2) + (rnd() - 0.5) * 0.02;
    pts.push([Math.sign(c) * Math.abs(c) ** e * (w / 2) * r, Math.sign(s) * Math.abs(s) ** e * (h / 2) * r]);
  }
  return pts;
}
/** The convex hull of a ring of points (Andrew's monotone chain), counter-clockwise. */
function hull(pts) {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
/** A convex polygon cut by a convex one (Sutherland-Hodgman). */
function clip(poly, by) {
  let out = poly;
  for (let i = 0; i < by.length && out.length; i++) {
    const a = by[i], b = by[(i + 1) % by.length], inside = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0, src = out; out = [];
    for (let j = 0; j < src.length; j++) {
      const p = src[j], q = src[(j + 1) % src.length], pi = inside(p), qi = inside(q);
      if (pi) out.push(p);
      if (pi !== qi) { const dx = q[0] - p[0], dy = q[1] - p[1], ex = b[0] - a[0], ey = b[1] - a[1], t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / (dx * ey - dy * ex); out.push([p[0] + dx * t, p[1] + dy * t]); }
    }
  }
  return out;
}
const toPx = (w, h) => ([x, y]) => [(x / w + 0.5) * w * PXM, (0.5 - y / h) * h * PXM];
function ring(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }

/** The skim: a shade off the old wall, mottled, the trowel's arcs in it, the rim feathered to the wall's own colour, the hairline crack round it. */
function paintSkim(w, h, rim, wall, rnd) {
  const W = Math.round(w * PXM), H = Math.round(h * PXM), c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), P = rim.map(toPx(w, h)), skim = shade(wall, 0.004, -0.02, 0.012); // (a shade off: the renderer's grade pulls the two further apart than this reads in sRGB)
  g.fillStyle = css(skim); g.fillRect(0, 0, W, H);
  // mottled as lime dries unevenly
  for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H, r = 10 + rnd() * 36, gr = g.createRadialGradient(x, y, 0, x, y, r), k = rnd() < 0.5 ? shade(skim, 0, 0, 0.03) : shade(skim, 0, 0.02, -0.03); gr.addColorStop(0, css(k, 0.35)); gr.addColorStop(1, css(k, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  // the trowel: fans of overlapping arcs, each a faint ridge (lit above, shaded below) where the blade's edge lifted
  for (let f = 0; f < 5; f++) {
    const cx = rnd() * W, cy = H * (0.6 + rnd() * 0.9), R0 = 70 + rnd() * 90;
    for (let k = 0; k < 6; k++) {
      const R = R0 + k * (9 + rnd() * 8), a0 = -Math.PI / 2 - 0.5 - rnd() * 0.5, a1 = a0 + 0.5 + rnd() * 0.7;
      g.lineWidth = 1.6; g.strokeStyle = css(shade(skim, 0, -0.02, 0.06), 0.28); g.beginPath(); g.arc(cx, cy, R, a0, a1); g.stroke();
      g.lineWidth = 1.2; g.strokeStyle = css(shade(skim, 0, 0.02, -0.07), 0.22); g.beginPath(); g.arc(cx, cy, R + 1.6, a0, a1); g.stroke();
    }
  }
  // the rim feathered thin: the old wall's colour coming through toward the edge (drawn as the outline stroked wide, softly, inside it)
  g.save(); ring(g, P); g.clip();
  for (let k = 7; k >= 1; k--) { g.lineWidth = k * 3.2; g.strokeStyle = css(wall, 0.11); ring(g, P); g.stroke(); }
  g.restore();
  // the hairline crack, a few texels inside the rim: broken into runs, wandering, a branch or two off it
  const cen = [W / 2, H / 2], inset = (p, d) => { const dx = cen[0] - p[0], dy = cen[1] - p[1], l = Math.hypot(dx, dy) || 1; return [p[0] + (dx / l) * d, p[1] + (dy / l) * d]; };
  g.lineCap = 'round'; g.lineJoin = 'round';
  let run = false;
  for (let i = 0; i <= P.length; i++) {
    const p = inset(P[i % P.length], 5 + rnd() * 3);
    if (!run && rnd() < 0.7) { run = true; g.beginPath(); g.moveTo(...p); continue; }
    if (run) { const q = P[(i + 1) % P.length], m = inset([(P[i % P.length][0] + q[0]) / 2 + (rnd() - 0.5) * 4, (P[i % P.length][1] + q[1]) / 2 + (rnd() - 0.5) * 4], 5 + rnd() * 3); g.lineTo(...p); g.lineTo(...m); }
    if (run && rnd() < 0.18) { g.lineWidth = 1.7; g.strokeStyle = css(shade(wall, 0, 0, -0.22), 0.8); g.stroke(); run = false; }
  }
  if (run) { g.lineWidth = 1.7; g.strokeStyle = css(shade(wall, 0, 0, -0.22), 0.8); g.stroke(); }
  for (let b = 0; b < 3; b++) { let [x, y] = inset(P[Math.floor(rnd() * P.length)], 6), dx = cen[0] - x, dy = cen[1] - y; const l = Math.hypot(dx, dy); dx /= l; dy /= l; g.beginPath(); g.moveTo(x, y); for (let s = 0; s < 4 + rnd() * 4; s++) { x += dx * 6 + (rnd() - 0.5) * 7; y += dy * 6 + (rnd() - 0.5) * 7; g.lineTo(x, y); } g.lineWidth = 0.9; g.strokeStyle = css(shade(wall, 0, 0, -0.18), 0.55); g.stroke(); }
  return c;
}

/** The scar: the old wall bared where the patch was (rough, darker), the broken skim's pale cut round it, the hollow the ostracon was set in. */
function paintScar(w, h, rim, wall, rnd) {
  const W = Math.round(w * PXM), H = Math.round(h * PXM), c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), P = rim.map(toPx(w, h)), old = shade(wall, 0, -0.06, -0.12);
  g.fillStyle = css(old); g.fillRect(0, 0, W, H);
  // the coarse render under the skim: lumps of grit and the keying scratches it was given
  for (let i = 0; i < 900; i++) { const k = rnd(), x = rnd() * W, y = rnd() * H, r = 0.8 + rnd() * 2.6; g.fillStyle = k < 0.45 ? css(shade(old, 0, 0, 0.06), 0.6) : css(shade(old, 0, 0, -0.08), 0.6); g.beginPath(); g.ellipse(x, y, r, r * 0.8, rnd() * 3, 0, 6.2832); g.fill(); }
  g.strokeStyle = css(shade(old, 0, 0, -0.1), 0.5); g.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) { const x = rnd() * W, y = rnd() * H, a = 0.6 + rnd() * 0.3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 40, y + Math.sin(a) * 40); g.stroke(); }
  // the hollow: an oval cut in the wall where the ostracon sat, shadowed under its top lip, its lower lip lit
  const hx = W * (0.5 + (rnd() - 0.5) * 0.1), hy = H * 0.55, hw = W * 0.15, hh = H * 0.17;
  let gr = g.createRadialGradient(hx, hy - hh * 0.25, 0, hx, hy, hw); gr.addColorStop(0, css(shade(old, 0, 0, -0.15))); gr.addColorStop(0.75, css(shade(old, 0, 0, -0.1))); gr.addColorStop(1, css(old, 0));
  g.fillStyle = gr; g.beginPath(); g.ellipse(hx, hy, hw, hh, 0, 0, 6.2832); g.fill();
  g.strokeStyle = css(shade(old, 0, 0, 0.08), 0.6); g.lineWidth = 2; g.beginPath(); g.ellipse(hx, hy, hw * 0.92, hh * 0.86, 0, 0.25, Math.PI - 0.25); g.stroke();
  // the broken skim's cut: a pale ragged band inside the rim (the plaster's body, paler than its face), and its shadow on the bared wall
  const cen = [W / 2, H / 2], band = P.map((p) => { const dx = cen[0] - p[0], dy = cen[1] - p[1], l = Math.hypot(dx, dy) || 1, d = 3 + rnd() * 6; return [p[0] + (dx / l) * d, p[1] + (dy / l) * d]; });
  g.save(); ring(g, band); g.lineWidth = 4; g.strokeStyle = css(shade(old, 0, 0, -0.12), 0.55); g.translate(0, 1.5); g.stroke(); g.restore(); // (the cut's shadow on the bared wall, the light from above)
  g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  band.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath();
  g.fillStyle = css(shade(wall, 0.01, -0.12, 0.16)); g.fill('evenodd');
  return c;
}

export class PlasterPatch {
  constructor({ w = 0.8, h = 0.55, seed = 'plaster', wall = 0x8c4a33, back = 0 } = {}) {
    const rnd = seeded(`plaster:${seed}`), wc = new THREE.Color(wall);
    this.w = w; this.h = h; this.back = back; this.rnd = rnd; this.wall = wc;
    this.group = new THREE.Group(); this.group.name = 'plaster-patch';
    this.rim = outline(w, h, rnd);
    const shape = new THREE.Shape(this.rim.map(([x, y]) => new THREE.Vector2(x, y)));
    this.geo = new THREE.ShapeGeometry(shape, 2); uvFromXY(this.geo, w, h);
    this.skimTex = texture(paintSkim(w, h, this.rim, wc, rnd));
    this.skimMat = new THREE.MeshStandardMaterial({ name: 'plaster-skim', map: this.skimTex, roughness: 0.96, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    this.patch = new THREE.Mesh(this.geo, this.skimMat); this.patch.position.z = FACE - back; this.patch.receiveShadow = true; this.patch.name = 'plaster-skim';
    this.group.add(this.patch);
    this.flakes = []; this.broken = false; this.done = false;
  }

  /** Struck: the patch comes away in a few flakes of itself and a puff of dust, and the scar is left behind it. */
  break({ vfx = null, floorY = 0 } = {}) {
    if (this.broken) return; this.broken = true; this.vfx = vfx;
    const rnd = this.rnd, { w, h } = this, g = this.group;
    g.updateMatrixWorld(true);
    this.floor = floorY - g.getWorldPosition(_v).y + 0.006;
    // the scar where the patch was (the same rim, drawn flush on the wall)
    this.scarTex = texture(paintScar(w, h, this.rim, this.wall, rnd));
    this.scarMat = new THREE.MeshStandardMaterial({ name: 'plaster-scar', map: this.scarTex, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    this.patch.material = this.scarMat; this.patch.position.z = 0.0015 - this.back;
    // the flakes: the skim cut on a jittered grid (4 x 3), each cell clipped to the rim, extruded a plaster's thickness; about half come
    // away whole, the rest crumble to the library's grit and dust (a few flakes, never a stack of tiles)
    this.edgeMat = new THREE.MeshStandardMaterial({ name: 'plaster-flake-edge', color: shade(this.wall, 0.01, -0.12, 0.16), roughness: 1 });
    this.flakeMat = new THREE.MeshStandardMaterial({ name: 'plaster-flake', map: this.skimTex, color: 0xd6ccc4, roughness: 0.96 }); // (a touch darker: a flake lying face up takes the light the wall never does)
    const cut = hull(this.rim), NX = 4, NY = 3, J = [], keep = Array.from({ length: NX * NY }, (_, k) => k).sort(() => rnd() - 0.5).slice(0, 5 + Math.floor(rnd() * 3));
    for (let j = 0; j <= NY; j++) { J.push([]); for (let i = 0; i <= NX; i++) { const edgeX = i === 0 || i === NX, edgeY = j === 0 || j === NY; J[j].push([(i / NX - 0.5) * w * 1.1 + (edgeX ? 0 : (rnd() - 0.5) * w * 0.18), (j / NY - 0.5) * h * 1.1 + (edgeY ? 0 : (rnd() - 0.5) * h * 0.25)]); } }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      if (!keep.includes(j * NX + i)) continue;
      const poly = clip([J[j][i], J[j][i + 1], J[j + 1][i + 1], J[j + 1][i]], cut); if (poly.length < 3) continue;
      const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      const geo = new THREE.ExtrudeGeometry(new THREE.Shape(poly.map(([x, y]) => new THREE.Vector2(x, y))), { depth: FLAKE_D, bevelEnabled: false });
      uvFromXY(geo, w, h); geo.translate(-cx, -cy, -FLAKE_D);
      const m = new THREE.Mesh(geo, [this.flakeMat, this.edgeMat]); m.position.set(cx, cy, FACE - this.back); m.castShadow = true; g.add(m);
      const out = 0.5 + rnd() * 1.1;
      this.flakes.push({ m, wait: rnd() * 0.14 * (1 - cy / h), v: new THREE.Vector3((rnd() - 0.5) * 0.6 + cx * 1.2, rnd() * 0.7, out), spin: new THREE.Vector3((rnd() - 0.5) * 12, (rnd() - 0.5) * 8, (rnd() - 0.5) * 10), hits: 0, rest: null, lie: 0 });
    }
    // the chips and the dust, from the library (vfx/library.js `plaster.break`)
    const at = g.localToWorld(_v.set(0, 0, 0.05)), n = _w.set(0, 0, 1).transformDirection(g.matrixWorld);
    vfx?.play?.('plaster.break', { pos: at.clone(), dir: n.clone(), normal: n.clone(), floor: floorY });
  }

  update(dt = 1 / 60) {
    if (!this.broken || this.done) return;
    let live = 0;
    for (const f of this.flakes) {
      if (f.gone) continue; live++;
      if ((f.wait -= dt) > 0) continue;
      const m = f.m;
      if (!f.rest) {
        f.v.y -= G * dt; m.position.addScaledVector(f.v, dt);
        _q.setFromEuler(_e.set(f.spin.x * dt, f.spin.y * dt, f.spin.z * dt)); m.quaternion.multiply(_q);
        if (m.position.y <= this.floor) {
          m.position.y = this.floor; f.hits++;
          if (f.hits === 1) this.vfx?.play?.('plaster.land', { pos: m.getWorldPosition(new THREE.Vector3()) });
          if (f.hits >= 2 || Math.abs(f.v.y) < 1) { f.rest = new THREE.Quaternion().setFromEuler(_e.set(this.rnd() < 0.7 ? -Math.PI / 2 : Math.PI / 2, 0, this.rnd() * 6.28)); f.from = m.quaternion.clone(); f.k = 0; }
          else { f.v.y *= -0.25; f.v.x *= 0.5; f.v.z *= 0.5; f.spin.multiplyScalar(0.4); }
        }
      } else {
        // lying on the floor: settled flat a moment after landing, then left there a while, then shrunk away
        if (f.k < 1) { f.k = Math.min(1, f.k + dt * 8); m.quaternion.slerpQuaternions(f.from, f.rest, f.k); m.position.y = this.floor + FLAKE_D * 0.5; }
        f.lie += dt;
        if (f.lie > LIE) { const s = Math.max(0, 1 - (f.lie - LIE) / SHRINK); m.scale.setScalar(s); if (s <= 0) { f.gone = true; m.removeFromParent(); m.geometry.dispose(); } }
      }
    }
    if (!live) { this.done = true; this.flakes.length = 0; this.edgeMat?.dispose(); this.flakeMat?.dispose(); this.skimMat.dispose(); this.skimTex.dispose(); }
  }

  dispose() {
    this.group.removeFromParent();
    for (const f of this.flakes) f.m.geometry.dispose();
    this.geo.dispose(); this.skimMat.dispose(); this.skimTex.dispose(); this.scarMat?.dispose(); this.scarTex?.dispose(); this.edgeMat?.dispose(); this.flakeMat?.dispose();
  }
}

/** UVs from the patch's own plane (metres across, up), so a flake shows its own piece of the skim. */
function uvFromXY(geo, w, h) {
  const P = geo.attributes.position, uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) { uv[i * 2] = P.getX(i) / w + 0.5; uv[i * 2 + 1] = P.getY(i) / h + 0.5; }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
