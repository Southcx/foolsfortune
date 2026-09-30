// ---------------------------------------------------------------------------------------
// CURIO MODELS: the twenty small things a chest can hold, each built from primitives at a unit size (about a metre across, so that the
// cel outline stays thin) and scaled down to a hand's width when it is shown. Each is a little object with a story: a shell that
// whistles, a compass that points where the water wants to go, a jar with a storm in it. The higher the tier the more of the thing
// there is: more parts, some glow, something turning.
//
//   const c = buildCurio('pearl', { sky });   scene.add(c.group);   c.update(time, dt);   c.dispose();
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { addOutline } from './outline.js';
import { oilMaterial } from './cubes.js';

const SIZE = 0.42; // (metres across, as shown)

export function buildCurio(id, { sky = null } = {}) {
  const group = new THREE.Group(), inner = new THREE.Group(); group.add(inner);
  const geos = [], mats = [], anims = [];
  const trackG = (g) => { geos.push(g); return g; };
  const std = (color, o = {}) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, flatShading: false, ...(o.metalness > 0.3 ? { envMap: sky, envMapIntensity: 1.0 } : {}), ...o }); mats.push(m); return m; };
  const glow = (color, o = {}) => { const m = new THREE.MeshBasicMaterial({ color, ...o }); mats.push(m); return m; };
  const glass = (color, o = {}) => std(color, { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.62, emissive: color, emissiveIntensity: 0.35, side: THREE.DoubleSide, ...o });
  const brass = () => std(0xe2a640, { roughness: 0.32, metalness: 0.85 });
  const silver = () => std(0xd6e0ee, { roughness: 0.3, metalness: 0.85 });
  const gold = () => std(0xffd060, { roughness: 0.28, metalness: 0.9, emissive: 0x6a4000, emissiveIntensity: 0.25 });
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = inner, outline = true) => {
    const m = new THREE.Mesh(trackG(geo), mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m);
    if (outline && !mat.transparent) addOutline(m);
    return m;
  };
  const sph = (r, ws = 14, hs = 10) => new THREE.SphereGeometry(r, ws, hs);
  const cyl = (rt, rb, h, seg = 14, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
  const cone = (r, h, seg = 12) => new THREE.ConeGeometry(r, h, seg);
  const tor = (r, t, rs = 8, ts = 24, arc = Math.PI * 2) => new THREE.TorusGeometry(r, t, rs, ts, arc);
  const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

  switch (id) {
    case 'whelk': { // a spiral shell that sings
      const pts = []; for (let i = 0; i <= 24; i++) { const u = i / 24, r = Math.sin(Math.PI * Math.pow(u, 0.75)) * (0.36 - 0.2 * u) * (1 + 0.16 * Math.sin(u * 40)); pts.push([Math.max(0.005, r), -0.5 + u * 1.15]); }
      const s = add(lathe(pts, 18), std(0xf1cdb6, { roughness: 0.4 })); s.rotation.z = 0.55;
      add(tor(0.12, 0.035), std(0xff9f88, { roughness: 0.4 }), 0, -0.5, 0, s).rotation.x = Math.PI / 2;
      break;
    }
    case 'shaker': {
      add(cyl(0.27, 0.3, 0.7, 18), std(0xf3ead6, { roughness: 0.25 }));
      add(sph(0.27, 16, 8), silver(), 0, 0.35, 0).scale.set(1, 0.7, 1);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(sph(0.025, 6, 4), std(0x111111), Math.cos(a) * 0.11, 0.53, Math.sin(a) * 0.11, inner, false); }
      const b = add(tor(0.285, 0.03, 6, 20), std(0x2b5fa8), 0, -0.05, 0); b.rotation.x = Math.PI / 2;
      break;
    }
    case 'keepsake': {
      add(new THREE.TorusKnotGeometry(0.3, 0.09, 80, 10, 2, 3), std(0xc9a071, { roughness: 0.9 }));
      for (const s of [-1, 1]) { const t = add(cyl(0.06, 0.05, 0.4, 8), std(0xc9a071, { roughness: 0.9 }), s * 0.34, -0.36, 0); t.rotation.z = s * 0.5; }
      break;
    }
    case 'barnacle': {
      add(cyl(0.45, 0.45, 0.14, 20), std(0x6d6a60, { roughness: 0.85 }));
      for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.05 + (i % 3) * 0.1; add(cone(0.08 + (i % 2) * 0.03, 0.2, 7), std(0xd4d0c4, { roughness: 0.8 }), Math.cos(a) * r, 0.16, Math.sin(a) * r, inner, false); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.7; add(cyl(0.035, 0.035, 0.16, 6), std(0x1a1a1a), Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3, inner, false); }
      break;
    }
    case 'gull': {
      const m = glass(0x9fe8ff, { emissive: 0x2fa8c0 });
      add(sph(0.5, 16, 10), m, 0, 0, 0).scale.set(0.9, 0.5, 0.5);
      add(sph(0.2, 12, 8), m, 0.42, 0.22, 0);
      const beak = add(cone(0.07, 0.34, 8), std(0xffa040), 0.72, 0.2, 0, inner, false); beak.rotation.z = -Math.PI / 2;
      for (const s of [-1, 1]) { const w = add(cone(0.14, 0.9, 6), m, -0.05, 0.16, s * 0.42); w.rotation.set(s * 1.25, 0, 0.35); w.scale.z = 0.4; }
      const tail = add(cone(0.15, 0.4, 5), m, -0.6, 0.02, 0); tail.rotation.z = Math.PI / 2 + 0.2;
      add(sph(0.03, 6, 4), std(0x101010), 0.52, 0.3, 0.13, inner, false); add(sph(0.03, 6, 4), std(0x101010), 0.52, 0.3, -0.13, inner, false);
      break;
    }
    case 'compass': {
      add(cyl(0.5, 0.5, 0.14, 24), brass());
      const bez = add(tor(0.49, 0.05, 8, 28), brass(), 0, 0.07, 0); bez.rotation.x = Math.PI / 2;
      const face = add(new THREE.CircleGeometry(0.44, 28), std(0x0c3a44, { emissive: 0x104a55, emissiveIntensity: 0.6 }), 0, 0.075, 0, inner, false); face.rotation.x = -Math.PI / 2;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const tk = add(new THREE.BoxGeometry(0.03, 0.005, i % 3 ? 0.06 : 0.11), glow(0x9ff2ff), Math.cos(a) * 0.36, 0.08, Math.sin(a) * 0.36, inner, false); tk.rotation.y = -a + Math.PI / 2; }
      const needle = new THREE.Group(); needle.position.y = 0.11; inner.add(needle);
      const nr = add(cone(0.06, 0.4, 5), std(0xff5a4a), 0.2, 0, 0, needle, false); nr.rotation.z = -Math.PI / 2;
      const nw = add(cone(0.06, 0.4, 5), std(0xf4f4f4), -0.2, 0, 0, needle, false); nw.rotation.z = Math.PI / 2;
      anims.push((t) => { needle.rotation.y = t * 0.5 + Math.sin(t * 1.3) * 0.5; });
      inner.rotation.x = 0.7;
      break;
    }
    case 'bell': {
      const pts = [[0.5, -0.4], [0.47, -0.3], [0.38, -0.05], [0.3, 0.2], [0.2, 0.4], [0.1, 0.5], [0.0, 0.52]];
      const b = add(lathe(pts, 20), std(0xe2a640, { roughness: 0.3, metalness: 0.88, side: THREE.DoubleSide }));
      add(sph(0.11, 10, 8), std(0x7a5a20, { metalness: 0.7, roughness: 0.4 }), 0, -0.4, 0, b, false);
      const loop = add(tor(0.09, 0.03, 6, 14), brass(), 0, 0.6, 0, b); loop.rotation.y = Math.PI / 2;
      anims.push((t) => { b.rotation.z = Math.sin(t * 2.2) * 0.12; });
      break;
    }
    case 'sconce': {
      add(cyl(0.3, 0.3, 0.8, 6), glass(0x8ef0d8, { emissive: 0x4fd0b0 }));
      add(sph(0.14, 10, 8), glow(0xffe0a0), 0, 0, 0, inner, false);
      add(cone(0.36, 0.28, 6), brass(), 0, 0.54, 0); add(cyl(0.34, 0.34, 0.08, 6), brass(), 0, -0.44, 0);
      const r = add(tor(0.12, 0.03, 6, 14), brass(), 0, 0.78, 0); r.rotation.y = Math.PI / 2;
      break;
    }
    case 'pearl': {
      add(sph(0.34, 28, 20), new THREE.MeshPhysicalMaterial({ color: 0xf4f0f4, roughness: 0.12, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600], envMap: sky, envMapIntensity: 0.8 }), 0, 0.15, 0);
      mats.push(inner.children[0].material);
      const ring = add(tor(0.3, 0.05, 6, 20), brass(), 0, -0.2, 0); ring.rotation.x = Math.PI / 2;
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; const c = add(cone(0.04, 0.42, 5), brass(), Math.cos(a) * 0.3, 0.0, Math.sin(a) * 0.3); c.rotation.set(Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35); }
      break;
    }
    case 'astrolabe': {
      const rings = [[0.5, 0], [0.42, 1.05], [0.34, 2.1]].map(([r, tilt], i) => { const t = add(tor(r, 0.035, 6, 36), brass(), 0, 0, 0); t.rotation.set(tilt, i * 0.6, 0); return t; });
      add(sph(0.11, 12, 8), std(0x5aa8ff, { emissive: 0x2a68c8, emissiveIntensity: 0.9 }));
      add(sph(0.05, 8, 6), glow(0xffffff), 0.5, 0, 0, inner, false);
      anims.push((t) => { rings.forEach((r, i) => { r.rotation.y += 0.004 * (i + 1); r.rotation.z += 0.003 * (2 - i); }); });
      break;
    }
    case 'ammonite': {
      const stone = std(0x8f8068, { roughness: 0.9 });
      for (let i = 0; i < 18; i++) { const a = i * 0.55, r = 0.06 + i * 0.022, x = Math.cos(a) * (0.05 + i * 0.022), y = Math.sin(a) * (0.05 + i * 0.022); add(sph(0.07 + i * 0.008, 8, 6), stone, x, y, 0, inner, false).scale.z = 0.65; }
      inner.children.forEach((c, i) => { if (i % 3 === 0) { const rib = add(tor(0.09 + i * 0.008, 0.012, 4, 8), std(0x6e6250), c.position.x, c.position.y, 0, inner, false); rib.rotation.y = Math.PI / 2; } });
      const clock = add(cyl(0.12, 0.12, 0.05, 16), std(0xf6f2e6), 0, 0, 0.1, inner, false); clock.rotation.x = Math.PI / 2;
      const hand = add(new THREE.BoxGeometry(0.02, 0.1, 0.02), std(0x222222), 0, 0.05, 0.14, inner, false);
      anims.push((t) => { hand.rotation.z = -t * 1.2; hand.position.set(Math.sin(t * 1.2) * 0.05, Math.cos(t * 1.2) * 0.05, 0.14); });
      inner.rotation.y = 0.5;
      break;
    }
    case 'amulet': {
      const s = silver();
      add(cyl(0.05, 0.05, 1, 8), s, 0, 0, 0); add(cyl(0.045, 0.045, 0.5, 8), s, 0, 0.32, 0).rotation.z = Math.PI / 2;
      const ring = add(tor(0.11, 0.035, 6, 14), s, 0, 0.6, 0);
      const arms = add(tor(0.32, 0.05, 6, 20, Math.PI), s, 0, -0.24, 0); arms.rotation.z = Math.PI;
      for (const x of [-0.32, 0.32]) { const f = add(cone(0.1, 0.24, 4), s, x, -0.22, 0); f.rotation.z = x > 0 ? -0.5 : 0.5; }
      add(sph(0.06, 8, 6), std(0x5aa8ff, { emissive: 0x2a68c8, emissiveIntensity: 0.9 }), 0, 0.6, 0.02, inner, false);
      ring.rotation.y = 0;
      break;
    }
    case 'skull': {
      const g = gold();
      add(sph(0.36, 18, 14), g, -0.02, 0.06, 0).scale.set(1.08, 0.86, 0.98);           // the cranium
      add(sph(0.2, 12, 10), g, 0.3, -0.06, 0).scale.set(1.2, 0.7, 0.8);                 // the upper jaw
      const beak = add(cone(0.11, 0.62, 7), g, 0.62, -0.1, 0); beak.rotation.z = -Math.PI / 2 - 0.12; // (the beak, hooked a little at the tip)
      const tip = add(cone(0.05, 0.16, 6), g, 0.9, -0.2, 0); tip.rotation.z = -Math.PI / 2 - 0.9;
      for (const s of [-1, 1]) {
        add(sph(0.12, 10, 8), std(0x07040c), 0.2, 0.13, s * 0.2, inner, false);           // the sockets
        add(sph(0.045, 8, 6), glow(0xd6a4ff), 0.25, 0.13, s * 0.2, inner, false);         //   and a light in each
        const b = add(new THREE.BoxGeometry(0.26, 0.05, 0.1), g, 0.22, 0.27, s * 0.19, inner, false); b.rotation.set(s * 0.35, 0, 0.25);
        add(cyl(0.02, 0.02, 0.06, 5), std(0x07040c), 0.56, -0.02, s * 0.05, inner, false).rotation.x = Math.PI / 2; // (nostrils)
      }
      add(sph(0.36, 12, 8), glow(0xb26bff, { transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }), 0.1, 0.05, 0, inner, false).scale.setScalar(1.9);
      break;
    }
    case 'regalia': {
      const g = gold();
      const band = add(tor(0.42, 0.06, 8, 30), g, 0, -0.2, 0); band.rotation.x = Math.PI / 2;
      for (let i = 0; i < 11; i++) {
        const a = i / 11 * Math.PI * 2, h = 0.55 + (i % 3) * 0.2;
        const r = add(cone(0.035, h, 5), std(0x5fa050, { roughness: 0.8 }), Math.cos(a) * 0.42, -0.2 + h / 2, Math.sin(a) * 0.42, inner, false);
        r.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22);
        if (i % 3 === 1) add(cyl(0.06, 0.06, 0.2, 8), std(0x5a3a20), Math.cos(a) * (0.42 + Math.cos(a) * 0.1), -0.2 + h + 0.05, Math.sin(a) * (0.42 + Math.sin(a) * 0.1), inner, false);
      }
      break;
    }
    case 'hourglass': {
      const gl = glass(0xd8f0ff, { emissive: 0x88c0e0, emissiveIntensity: 0.2 });
      const top = add(cone(0.34, 0.45, 14), gl, 0, 0.23, 0); top.rotation.x = Math.PI;
      add(cone(0.34, 0.45, 14), gl, 0, -0.23, 0);
      const sand = std(0xffc860, { emissive: 0xc88a20, emissiveIntensity: 0.7 });
      add(cone(0.24, 0.3, 12), sand, 0, -0.38, 0, inner, false);
      const up = add(cone(0.14, 0.2, 10), sand, 0, 0.33, 0, inner, false); up.rotation.x = Math.PI;
      const g = gold();
      add(cyl(0.42, 0.42, 0.07, 18), g, 0, 0.5, 0); add(cyl(0.42, 0.42, 0.07, 18), g, 0, -0.5, 0);
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; add(cyl(0.03, 0.03, 1, 6), g, Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4, inner, false); }
      anims.push((t) => { inner.rotation.z = Math.sin(t * 0.7) * 0.08; });
      break;
    }
    case 'storm': {
      add(cyl(0.3, 0.3, 0.8, 16, true), glass(0xcfe4ff), 0, 0, 0); add(cyl(0.3, 0.3, 0.02, 16), glass(0xcfe4ff), 0, -0.4, 0);
      add(cyl(0.17, 0.2, 0.2, 10), std(0x8a5a38), 0, 0.5, 0);
      const cloud = new THREE.Group(); inner.add(cloud);
      for (let i = 0; i < 6; i++) { const a = i * 1.1; add(sph(0.14 + (i % 2) * 0.03, 10, 8), std(0xd8dae4, { roughness: 1, emissive: 0x4a4a68, emissiveIntensity: 0.3 }), Math.cos(a) * 0.11, 0.12 + (i % 3) * 0.05, Math.sin(a) * 0.11, cloud, false); }
      const bolt = new THREE.Group(); inner.add(bolt);
      let y = 0.05, x = 0; for (let i = 0; i < 4; i++) { const seg = add(new THREE.BoxGeometry(0.035, 0.13, 0.035), glow(0xfff2a0), x, y, 0, bolt, false); seg.rotation.z = i % 2 ? 0.5 : -0.5; y -= 0.11; x += i % 2 ? -0.05 : 0.05; }
      anims.push((t) => { cloud.rotation.y = t * 0.9; bolt.visible = Math.sin(t * 2.1) > -0.2; });
      break;
    }
    case 'lodestone': {
      const o = oilMaterial({ env: sky, envIntensity: 0.4 }); mats.push(o.mat);
      add(new RoundedBoxGeometry(0.62, 0.62, 0.62, 3, 0.07), o.mat).rotation.set(0.5, 0.6, 0.2);
      const orb = new THREE.Group(); inner.add(orb);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; add(new RoundedBoxGeometry(0.16, 0.16, 0.16, 2, 0.03), o.mat, Math.cos(a) * 0.62, Math.sin(i * 1.7) * 0.2, Math.sin(a) * 0.62, orb, false).rotation.set(a, a * 2, 0); }
      anims.push((t) => { orb.rotation.y = t * 0.8; o.uni.uHue.value = (t * 0.08) % 1; });
      break;
    }
    case 'orb': {
      const o = oilMaterial({ env: sky, envIntensity: 0.5, uni: { uOil: { value: 1.1 }, uOilPow: { value: 1.6 }, uHue: { value: 0 } } }); mats.push(o.mat);
      add(sph(0.42, 36, 24), o.mat);
      const r = add(tor(0.5, 0.03, 6, 40), gold(), 0, -0.05, 0); r.rotation.x = Math.PI / 2 - 0.35;
      anims.push((t) => { o.uni.uHue.value = (t * 0.1) % 1; });
      break;
    }
    case 'bloom': {
      add(cyl(0.035, 0.05, 0.9, 6), glow(0x3fe0a0), 0, -0.05, 0, inner, false);
      for (const s of [-1, 1]) { const l = add(new THREE.SphereGeometry(0.16, 8, 6), glow(0x3fe0a0), s * 0.16, -0.3, 0, inner, false); l.scale.set(1.5, 0.3, 0.7); l.rotation.z = s * 0.5; }
      const head = new THREE.Group(); head.position.y = 0.42; inner.add(head);
      const cols = [0xff3fa8, 0xa64fff, 0xff6ad8];
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, p = add(new THREE.SphereGeometry(0.18, 8, 6), glow(cols[i % 3]), Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2, head, false); p.scale.set(1.5, 0.35, 0.7); p.rotation.set(0, -a, 0.25); }
      add(sph(0.11, 10, 8), glow(0x6ff0ff), 0, 0.03, 0, head, false);
      anims.push((t) => { head.rotation.y = t * 0.4; head.scale.setScalar(1 + Math.sin(t * 1.4) * 0.06); });
      break;
    }
    case 'koi': {
      const geo = trackG(new THREE.SphereGeometry(0.5, 20, 14)); geo.scale(1.1, 0.5, 0.5);
      const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
      for (let i = 0; i < pos.count; i++) { c.setHSL((pos.getX(i) * 0.6 + 0.55) % 1, 0.85, 0.58); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mat = std(0xffffff, { vertexColors: true, roughness: 0.35, emissive: 0x220844, emissiveIntensity: 0.4 });
      const body = new THREE.Mesh(geo, mat); body.castShadow = true; inner.add(body); addOutline(body);
      const tail = new THREE.Group(); tail.position.x = -0.5; inner.add(tail);
      for (const s of [-1, 1]) { const f = add(cone(0.16, 0.5, 5), std(0xff7ad0, { transparent: true, opacity: 0.85, emissive: 0xff40a0, emissiveIntensity: 0.4 }), -0.22, s * 0.1, 0, tail, false); f.rotation.z = Math.PI / 2 + s * 0.4; }
      add(cone(0.12, 0.4, 5), std(0x6ad8ff, { transparent: true, opacity: 0.85 }), -0.05, 0.28, 0, inner, false).rotation.z = 0.5;
      for (const s of [-1, 1]) { const f = add(cone(0.09, 0.32, 5), std(0xffd86a, { transparent: true, opacity: 0.85 }), 0.2, -0.1, s * 0.22, inner, false); f.rotation.set(s * 1.2, 0, 1.3); }
      for (const s of [-1, 1]) add(sph(0.045, 6, 4), std(0x08040c), 0.5, 0.1, s * 0.16, inner, false);
      anims.push((t) => { tail.rotation.y = Math.sin(t * 5) * 0.4; inner.rotation.y = Math.sin(t * 1.5) * 0.15; });
      break;
    }
    default: add(new RoundedBoxGeometry(0.6, 0.6, 0.6, 2, 0.06), std(0xdddddd)); break;
  }
  // (fit it to the size it is shown at, and centre it)
  const box = new THREE.Box3().setFromObject(inner), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const k = SIZE / Math.max(size.x, size.y, size.z, 0.001);
  inner.position.sub(c);
  group.scale.setScalar(k);
  return {
    group, id,
    update(t, dt) { for (const a of anims) a(t, dt); },
    dispose() { group.parent?.remove(group); for (const g of geos) g.dispose(); for (const m of mats) m.dispose(); },
  };
}
