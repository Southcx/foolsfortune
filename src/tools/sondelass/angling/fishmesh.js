// ---------------------------------------------------------------------------------------
// The shapes of the entities, built from primitives: a chain of soft ellipsoids for the body (each swung sideways a little behind
// the one before it: the wave that swims it), flat triangles for fins and tails, and a faint halo. Translucent and a little bright
// (the water shows them as shadows with a colour at their centre), never outlined: they are not part of the workshop.
// Gall's and Fury's fish wear their feeling's paint motif on the skin (vfx/paintmotifs.js), so neither is told by colour alone:
//   sculpin  Gall's: a bottom-sulker, all flat head and fan fins, its skin CURDLED: dark curds of every size, each with a pale skin
//   pike     Fury's: long and lean, the fin far back, its skin CHARRED, split by CRACKS of light that glow (fainter with distance, to
//            their mean before they are thinner than a pixel: no crawl, CLAUDE.md's Feel)
// Skin marks ride the same sweep as the body's vertices (skinAt), so they swim with it. Prior art: a sculpin's and a pike's shapes, the
// paint motifs' curds and craquelure (Calissa's), Okami's ink lines that sit on a body and move with it.
//   const m = buildFish(species, sizeCm)      m.group (nose toward +X, up +Y)
//   m.swim(dt, speed, turn)                   the swimming motion
//   m.glow(0..1)                              the halo and the core (aware, sounded, hooked)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { stream } from '../../../core/rng.js';
const simRand = stream('tools/sondelass/angling/fishmesh'); // (the simulation's chance: core/rng.js, the same twice)

const SEG = new THREE.SphereGeometry(0.5, 8, 6);
let HALO = null;
/** The soft round sprite texture the halos use (fx.haloTexture); set once by the Weir. */
export const setHaloTexture = (t) => { HALO = t; };
const TRI = (a, b, c) => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...a, ...b, ...c]), 3));
  g.computeVertexNormals();
  return g;
};

// each body: segment profile (fractions of length), wave amplitude and wavelength, and the extras that make it that animal
const BODIES = {
  carp: { h: [0.15, 0.2, 0.21, 0.17, 0.1, 0.05], w: [0.08, 0.11, 0.12, 0.09, 0.05, 0.03], amp: 0.05, wl: 0.9, freq: 5, tail: [0.17, 0.3], dorsal: 0.14, pect: 0.14 },
  minnow: { h: [0.13, 0.15, 0.1, 0.04], w: [0.08, 0.1, 0.06, 0.03], amp: 0.07, wl: 1.0, freq: 11, tail: [0.22, 0.3], dorsal: 0.1, pect: 0.1 },
  puff: { h: [0.3, 0.36, 0.3, 0.1], w: [0.28, 0.34, 0.28, 0.08], amp: 0.03, wl: 0.8, freq: 3.5, tail: [0.15, 0.22], dorsal: 0.1, pect: 0.18, mouth: true },
  ribbon: { h: [0.05, 0.05, 0.048, 0.045, 0.04, 0.036, 0.03, 0.024, 0.016, 0.01], w: [0.02, 0.028, 0.03, 0.03, 0.028, 0.026, 0.022, 0.018, 0.012, 0.008], amp: 0.1, wl: 1.6, freq: 4.5, tail: [0.1, 0.1], long: true },
  comet: { h: [0.18, 0.15, 0.1, 0.06, 0.03], w: [0.16, 0.13, 0.09, 0.05, 0.03], amp: 0.02, wl: 1.0, freq: 14, tail: [0.35, 0.03], streak: true },
  ray: { h: [0.05, 0.06, 0.05, 0.03], w: [0.32, 0.5, 0.4, 0.06], amp: 0.02, wl: 1.0, freq: 2.2, tail: [0.04, 0.04], wings: true, len: 0.55 },
  eel: { h: [0.05, 0.055, 0.055, 0.052, 0.05, 0.048, 0.045, 0.04, 0.035, 0.03, 0.02, 0.012], w: [0.045, 0.05, 0.05, 0.048, 0.046, 0.044, 0.04, 0.036, 0.03, 0.024, 0.016, 0.01], amp: 0.09, wl: 1.3, freq: 5, tail: [0.06, 0.06], long: true, maw: true },
  angler: { h: [0.32, 0.4, 0.3, 0.14, 0.06], w: [0.28, 0.36, 0.26, 0.12, 0.05], amp: 0.03, wl: 0.9, freq: 3, tail: [0.13, 0.26], lantern: true, teeth: true },
  catfish: { h: [0.1, 0.15, 0.15, 0.11, 0.07, 0.04], w: [0.24, 0.26, 0.2, 0.12, 0.07, 0.04], amp: 0.04, wl: 1.0, freq: 2.6, tail: [0.14, 0.26], whiskers: true },
  leviathan: { h: [0.12, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02], w: [0.1, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.015], amp: 0.06, wl: 1.5, freq: 1.4, tail: [0.12, 0.18], long: true, maw: true, plates: true, seams: true },
  sculpin: { h: [0.15, 0.17, 0.14, 0.1, 0.06, 0.035], w: [0.24, 0.21, 0.15, 0.09, 0.05, 0.025], amp: 0.035, wl: 0.9, freq: 3, tail: [0.14, 0.24], dorsal: 0.07, pect: 0.26, mouth: true, curds: true },
  pike: { h: [0.05, 0.08, 0.105, 0.11, 0.1, 0.085, 0.06, 0.035], w: [0.045, 0.065, 0.08, 0.08, 0.07, 0.055, 0.04, 0.02], amp: 0.06, wl: 1.1, freq: 7, tail: [0.16, 0.3], dorsal: 0.1, dorsalAt: 0.72, pect: 0.08, cracks: true, char: 0.55 },
};
/** A small hash for where a skin mark goes: a look, not the simulation's chance, so the same body is marked the same every time. */
const markHash = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };

export function buildFish(sp, cm) {
  const B = BODIES[sp.body] || BODIES.carp;
  const L = (cm / 100) * (B.len || 1); // metres
  const group = new THREE.Group();
  const col = new THREE.Color(sp.color);
  const mat = new THREE.MeshBasicMaterial({ color: col.clone().multiplyScalar(1 - (B.char || 0)), transparent: true, opacity: 0.74, depthWrite: false }); // (Fury's is charred: cracks.)
  const core = new THREE.MeshBasicMaterial({ color: col.clone().lerp(new THREE.Color(0xffffff), 0.6), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  const dark = new THREE.MeshBasicMaterial({ color: new THREE.Color(sp.color).multiplyScalar(0.35), transparent: true, opacity: 0.82, depthWrite: false });
  const n = B.h.length;
  // the profile along the body, head (u = 0) to tail (u = 1)
  const at = (arr, u) => { const f = THREE.MathUtils.clamp(u, 0, 1) * (n - 1), i = Math.min(n - 2, Math.floor(f)); return arr[i] + (arr[i + 1] - arr[i]) * (f - i); };
  // one smooth body: a sphere swept along the profile, its middle swung sideways by the swimming wave
  const geo = new THREE.SphereGeometry(1, 20, 12);
  const P = geo.attributes.position, base = Float32Array.from(P.array), count = P.count;
  const ang = new Float32Array(count), cc = new Float32Array(count);
  for (let i = 0; i < count; i++) { const sy = base[i * 3 + 1], sz = base[i * 3 + 2]; ang[i] = Math.atan2(sz, sy); cc[i] = Math.sqrt(Math.max(0, 1 - base[i * 3] * base[i * 3])); }
  const body = new THREE.Mesh(geo, mat);
  body.frustumCulled = false;
  group.add(body);
  const waveZ = (u, phase, amp) => amp * Math.sin(phase - u * B.wl * 2.2) * (0.15 + u * 1.0);
  const shape = (phase, amp, turn) => {
    for (let i = 0; i < count; i++) {
      const sx = base[i * 3], u = (1 - sx) / 2, c = Math.pow(cc[i], 0.55);
      P.array[i * 3] = sx * L / 2;
      P.array[i * 3 + 1] = at(B.h, u) * L * Math.cos(ang[i]) * c;
      P.array[i * 3 + 2] = at(B.w, u) * L * Math.sin(ang[i]) * c + waveZ(u, phase, amp) + turn * L * 0.05 * u * u;
    }
    P.needsUpdate = true;
  };
  // a point on the skin at (u, a): the body's own sweep (shape() above), `lift` times its radius there
  const skinAt = (u, a, lift, phase, amp, turn, out) => {
    const sx = 1 - 2 * u, c = Math.pow(Math.sqrt(Math.max(0, 1 - sx * sx)), 0.55) * lift;
    out.set(sx * L / 2, at(B.h, u) * L * Math.cos(a) * c, at(B.w, u) * L * Math.sin(a) * c + waveZ(u, phase, amp) + turn * L * 0.05 * u * u);
    return out;
  };
  const head = { position: new THREE.Vector3() };
  const heart = new THREE.Mesh(SEG, core);
  heart.scale.setScalar(Math.max(0.02, L * 0.06));
  heart.position.x = L * 0.18;
  group.add(heart);
  const eye = (side) => { const e = new THREE.Mesh(SEG, core); e.scale.setScalar(Math.max(0.012, L * 0.022)); e.position.set(L * 0.36, B.h[0] * L * 0.45, side * B.w[0] * L * 0.8); group.add(e); return e; };
  if (!B.streak && !B.wings) { eye(1); eye(-1); }
  // fins and the tail: flat and translucent
  const fin = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false, forceSinglePass: true }); // (one pass: a flat fin shows one face at a time, and three drew a transparent double side twice, re-resolving its program twice, 55 calls a frame at the Weir: the deep clean's profile)
  const tail = new THREE.Group();
  const [tl, tw] = B.tail;
  if (tl > 0.03) {
    tail.add(new THREE.Mesh(TRI([0, 0, 0], [-tl * L, tw * L * 0.55, 0], [-tl * L, -tw * L * 0.55, 0]), fin));
    if (!B.long && !B.streak) tail.add(new THREE.Mesh(TRI([0, 0, 0], [-tl * L * 0.8, 0, tw * L * 0.4], [-tl * L * 0.8, 0, -tw * L * 0.4]), fin));
  }
  group.add(tail);
  const fins = [];
  let dorsal = null;
  if (B.dorsal) {
    const du = (B.dorsalAt ?? 0.35) - 0.35, hh = at(B.h, 0.35 + du) * L; // (dorsalAt: where along the back it stands; the pike's is far back)
    dorsal = new THREE.Group(); dorsal.userData.u = 0.55 + du; // (it rides the wave at its middle)
    dorsal.add(new THREE.Mesh(TRI([L * (0.14 - du), hh * 0.9, 0], [-L * (0.2 + du), hh * 0.7, 0], [-L * (0.06 + du), hh + B.dorsal * L * 0.65, 0]), fin));
    group.add(dorsal);
  }
  if (B.pect) for (const s of [1, -1]) {
    const p = new THREE.Group();
    p.add(new THREE.Mesh(TRI([0, 0, 0], [-L * 0.12, -at(B.h, 0.3) * L * 0.2, s * B.pect * L * 0.75], [-L * 0.18, 0, s * B.pect * L * 0.25]), fin));
    p.position.set(L * 0.14, -at(B.h, 0.3) * L * 0.55, s * at(B.w, 0.3) * L * 0.8);
    group.add(p); fins.push({ g: p, s });
  }
  const wings = [];
  if (B.wings) for (const s of [1, -1]) {
    const p = new THREE.Group();
    p.add(new THREE.Mesh(TRI([L * 0.1, 0, 0], [-L * 0.25, 0, s * L * 0.5], [-L * 0.32, 0, s * L * 0.05]), fin));
    p.add(new THREE.Mesh(TRI([L * 0.1, 0, 0], [L * 0.02, 0, s * L * 0.45], [-L * 0.25, 0, s * L * 0.5]), fin));
    group.add(p); wings.push({ g: p, s });
  }
  if (B.whiskers) for (const s of [1, -1]) for (let k = 0; k < 2; k++) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.004, L * 0.002, L * 0.22, 4), dark);
    w.rotation.z = Math.PI / 2; w.rotation.y = s * (0.5 + k * 0.4);
    w.position.set(L * 0.5, -B.h[0] * L * 0.1, s * (0.03 + k * 0.03) * L);
    group.add(w);
  }
  let lantern = null;
  if (B.lantern) {
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(L * 0.006, L * 0.008, L * 0.34, 4), dark);
    stalk.position.set(L * 0.5, L * 0.34, 0); stalk.rotation.z = -0.8;
    group.add(stalk);
    lantern = new THREE.Mesh(SEG, new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    lantern.scale.setScalar(L * 0.08);
    lantern.position.set(L * 0.68, L * 0.44, 0);
    group.add(lantern);
  }
  if (B.teeth) for (let k = -2; k <= 2; k++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(L * 0.012, L * 0.07, 4), core);
    t.rotation.z = Math.PI; t.position.set(L * 0.5, -B.h[0] * L * 0.3, k * L * 0.05);
    group.add(t);
  }
  if (B.mouth || B.maw) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(B.h[0] * L * 0.3, L * 0.012, 4, 10), dark);
    ring.position.set(L * 0.5, 0, 0); ring.rotation.y = Math.PI / 2;
    group.add(ring);
  }
  const plates = [];
  if (B.plates) for (let i = 1; i < 12; i++) {
    const u = i / 13, hh = at(B.h, u) * L;
    const p = new THREE.Mesh(TRI([L * 0.03, 0, 0], [-L * 0.03, 0, 0], [0, hh * 0.55, 0]), dark);
    p.userData.u = u; p.userData.x = (0.5 - u) * L; p.userData.y = hh * 0.85;
    group.add(p); plates.push(p);
  }
  // Gall's curds: a dark bump of every size with a pale skin on it (the paint's curd and its skin), on the back and flanks
  const curds = [];
  let skinMat = null;
  if (B.curds) {
    skinMat = new THREE.MeshBasicMaterial({ color: col.clone().lerp(new THREE.Color(0xf4ecff), 0.72), transparent: true, opacity: 0.85, depthWrite: false });
    const n = 16;
    for (let i = 0; i < n; i++) {
      const u = 0.1 + 0.68 * markHash(i, 1), a = (markHash(i, 2) - 0.5) * Math.PI * 1.7, r = L * (0.014 + 0.026 * markHash(i, 3) ** 1.6);
      const d = new THREE.Mesh(SEG, dark); d.scale.setScalar(r * 2);
      const sk = new THREE.Mesh(SEG, skinMat); sk.scale.setScalar(r * 1.1); // (its skin: a pale cap on the curd's crown)
      group.add(d, sk); curds.push({ d, sk, u, a, r });
    }
  }
  // Fury's cracks: ribbons of light laid on the charred skin, a few zigzags each branching once, drawn as one mesh
  let cracks = null;
  if (B.cracks) {
    const W = Math.max(0.012, L * 0.022); // (metres across: kept to a pixel or more where it is drawn, faded past that)
    const pts = []; // [u, a, du, da]: a point on the ribbon's middle and its half-width across, in the skin's (u, a); vertices 2i and 2i + 1
    const idx = [];
    const rAt = (u) => Math.max(1e-3, (at(B.h, u) + at(B.w, u)) * 0.5 * L * Math.pow(Math.sqrt(Math.max(0, 1 - (1 - 2 * u) ** 2)), 0.55));
    const walk = (u, a, hd, steps, seg, k) => {
      for (let s = 0; s <= steps; s++) {
        const r = rAt(u), du = (-Math.sin(hd) * W * 0.5) / L, da = (Math.cos(hd) * W * 0.5) / r;
        const v = pts.length;
        pts.push([u, a, du, da]);
        if (s > 0) idx.push(2 * v - 2, 2 * v, 2 * v + 1, 2 * v - 2, 2 * v + 1, 2 * v - 1); // (a quad from the point before to this one)
        hd += (markHash(k, s + 7) - 0.5) * 1.6; // (a zigzag)
        u = THREE.MathUtils.clamp(u + (Math.cos(hd) * seg) / L, 0.08, 0.86); a += (Math.sin(hd) * seg) / r;
      }
    };
    for (let k = 0; k < 7; k++) {
      const u0 = 0.14 + 0.62 * markHash(k, 11), a0 = (markHash(k, 12) - 0.5) * Math.PI * 2, hd = markHash(k, 13) * Math.PI * 2;
      walk(u0, a0, hd, 4, L * 0.05, k);
      walk(u0, a0, hd + 1.9, 2, L * 0.04, k + 31); // (a branch from where it began)
    }
    const nV = pts.length * 2;
    const geo2 = new THREE.BufferGeometry();
    geo2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
    geo2.setIndex(idx);
    const hot = col.clone().lerp(new THREE.Color(0xffd2a0), 0.6);
    const cm = new THREE.MeshBasicMaterial({ color: hot, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const mesh = new THREE.Mesh(geo2, cm);
    mesh.frustumCulled = false; mesh.renderOrder = 1;
    const _p = new THREE.Vector3(), _c = new THREE.Vector3();
    // (a crack fades to the charred skin's mean as it gets thinner than a pixel where it is drawn: the main view's 480 lines, a portrait's own)
    mesh.onBeforeRender = (ren, sc, cam) => {
      mesh.getWorldPosition(_p); _c.setFromMatrixPosition(cam.matrixWorld);
      const H = ren.getRenderTarget()?.height || ren.domElement.height || 480;
      const px = (W * mesh.matrixWorld.getMaxScaleOnAxis() * H) / (2 * Math.max(0.05, _p.distanceTo(_c)) * Math.tan(THREE.MathUtils.degToRad((cam.fov || 50) / 2)));
      cm.opacity = cracks.base * THREE.MathUtils.clamp((px - 0.6) / 1.2, 0, 1);
    };
    group.add(mesh);
    cracks = { mesh, geo: geo2, mat: cm, pts, base: 0.9, v: new THREE.Vector3() };
  }
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: HALO, color: col, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(Math.max(0.5, L * 1.6));
  group.add(halo);
  let phase = simRand() * 6.28;
  const api = {
    group, length: L, halo, lantern, head,
    swim(dt, speed = 0.5, turn = 0) {
      phase += dt * B.freq * (0.35 + Math.min(2.2, speed * 0.7));
      const amp = B.amp * L * (0.55 + Math.min(1, speed * 0.3));
      shape(phase, amp, turn);
      const zTail = waveZ(1, phase, amp) + turn * L * 0.05, zPrev = waveZ(0.88, phase, amp) + turn * L * 0.04;
      tail.position.set(-L / 2 + L * 0.02, 0, zTail);
      tail.rotation.y = Math.atan2(-(zTail - zPrev), L * 0.12) * 1.3;
      for (const f of fins) f.g.rotation.x = f.s * (0.15 + 0.2 * Math.sin(phase * 0.8 + f.s));
      for (const w of wings) w.g.rotation.x = w.s * 0.35 * Math.sin(phase * 0.9);
      for (const p of plates) p.position.set(p.userData.x, p.userData.y, waveZ(p.userData.u, phase, amp));
      if (dorsal) dorsal.position.z = waveZ(dorsal.userData.u, phase, amp);
      for (const c of curds) { skinAt(c.u, c.a, 0.97, phase, amp, turn, c.d.position); skinAt(c.u, c.a, 0.97, phase, amp, turn, c.sk.position); c.sk.position.y += c.r * 0.55 * Math.cos(c.a); c.sk.position.z += c.r * 0.55 * Math.sin(c.a); }
      if (cracks) {
        const P2 = cracks.geo.attributes.position, v = cracks.v;
        cracks.pts.forEach(([u, a, du, da], i) => {
          skinAt(u - du, a - da, 1.04, phase, amp, turn, v); P2.setXYZ(i * 2, v.x, v.y, v.z);
          skinAt(u + du, a + da, 1.04, phase, amp, turn, v); P2.setXYZ(i * 2 + 1, v.x, v.y, v.z);
        });
        P2.needsUpdate = true;
      }
      if (lantern) lantern.material.opacity = 0.7 + 0.3 * Math.sin(phase * 0.5);
    },
    glow(k) {
      halo.material.opacity = 0.05 + 0.5 * k;
      mat.opacity = 0.55 + 0.35 * k;
      if (cracks) cracks.base = 0.7 + 0.3 * k; // (the cracks flare as it is roused)
    },
    dispose() { mat.dispose(); core.dispose(); dark.dispose(); fin.dispose(); halo.material.dispose(); geo.dispose(); skinMat?.dispose(); if (cracks) { cracks.geo.dispose(); cracks.mat.dispose(); } },
  };
  api.swim(0, 0.3, 0);
  return api;
}
