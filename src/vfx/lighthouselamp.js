// ---------------------------------------------------------------------------------------
// THE LIGHTHOUSE LAMP: a lighthouse's lamp, glazed and caged, with its beam (docs/GLOSSARY.md: a lighthouse lamp; docs/plans/RAIL-OVERHAUL.md
// section 6). Two lights on the Emocean are lies told with one: the False Light's figurehead holds a small one up (vfx/brig.js: the
// Wreckers' lure, sealed behind iron shutters until her rigging is cut), and the Drowned Light is a great one standing out of the crude
// on a lighthouse sunk to its gallery (vfx/drownedlighthouse.js). Both wake, sweep, crack and go dark the same way.
//
//   THE CAGE      an iron floor ring, eight glazed panes between astragals, a domed roof and its vent ball (a real lighthouse's lantern, the
//                 glazed housing at its top; never called a room here, which is the log's word)
//   THE LENS      a Fresnel lens: stacked prism rings round a bullseye, gold (the false lamp's gold), turning with its beam; its glow is a
//                 halo on the lens, never a flash on the screen
//   THE SHUTTERS  (if it has them) six iron petals hinged at the floor ring that close over the glass: sealed, the lamp is dark and no
//                 shot can reach it; opened, they fold down and out like a flower and the light comes up
//   THE BEAM      the sweeping laser's look (the leg's beams share it): first a WARNING LINE, thin and pale (where it will be, still
//                 harmless), then HOT, a white-gold core over a dark rim (the astral shot's language: a bright core and a dark rim, so it
//                 reads against the storm's light as well as the crude); two crossed planes, so it reads from the side and from above
//   ITS HURT      damaged: two panes crazed, the lens guttering slowly and dimmer; broken: the glass gone, the lens shattered on the floor
//                 ring, the roof knocked askew, dark
//
// Prior art: the lighthouse lantern and Fresnel's lens (Augustin Fresnel, 1822: prism rings round a bullseye panel that throws the
// beam; a clockwork turns it), the Cornish wreckers' false lights, Metal Gear Solid's searchlights (a sweep you read and stay out of),
// and the bullet-hell laser's grammar (a thin warning line, then the beam: Touhou, DoDonPachi).
//
//   const L = new LighthouseLamp({ radius, height, shutters, beam: { length, width } })   L.group (origin on the floor ring, Y up)
//   L.set({ lit 0..1, open 0..1 (the shutters), yaw (rad, the beam's turn about Y), pitch (rad, down +), warn 0..1, hot 0..1 })
//   L.state('intact' | 'damaged' | 'broken')   L.update(rawDt)   L.lensWorld(out)   L.beamPoint(d, out) (a point d m along the beam)
//   L.beamDir(out)   L.cageEdges (in L.group's frame), L.roofEdges (in L.roof's): the line and glow a boss part wears   L.dispose()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { mergeStatic } from '../render/merge.js';

const GOLD = 0xffb347, IRON = 0x1a1512;
const WARN = new THREE.Color(0xb8b0ff), HOT = new THREE.Color(0xfff2cf), RIM = new THREE.Color(0x0a0710);

let _beamTex = null, _halo = null;
/** The beam's cross-section (u: across, a bright core and a soft edge) and its fall along its length (v: 1 at the lens .. 0 far). */
export function beamTexture() {
  if (_beamTex) return _beamTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d'), img = g.createImageData(64, 64);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const u = Math.abs(x / 63 - 0.5) * 2, v = 1 - y / 63, core = Math.exp(-((u / 0.16) ** 2)), soft = Math.exp(-((u / 0.55) ** 2)) * 0.45;
    const a = Math.min(1, core + soft) * (0.25 + 0.75 * v) * (v > 0.97 ? (1 - v) / 0.03 : 1), i = (y * 64 + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255; img.data[i + 3] = Math.round(a * 255);
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; // (no crawl along a thin beam: casebook, mipmaps)
  return (_beamTex = t);
}
export function haloTexture() { // (a soft round glow, shared by every halo of the lamps)
  if (_halo) return _halo;
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return (_halo = new THREE.CanvasTexture(c));
}

export class LighthouseLamp {
  constructor({ radius = 0.5, height = 1.2, shutters = false, beam = {} } = {}) {
    const r = radius, h = height, glassH = h * 0.62; this.r = r; this.h = h;
    this.group = new THREE.Group(); this.group.name = 'lighthouse-lamp';
    this.mats = []; this.geos = [];
    const track = (o) => { (o.isMaterial ? this.mats : this.geos).push(o); return o; };
    const iron = track(new THREE.MeshStandardMaterial({ color: IRON, metalness: 0.5, roughness: 0.5, flatShading: true }));
    const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = this.group) => { const m = new THREE.Mesh(track(geo), mat); m.position.set(x, y, z); parent.add(m); return m; };
    this.cage = [];
    // the cage: floor ring, astragals, the roof and its ball
    this.cage.push(mesh(new THREE.CylinderGeometry(r * 1.12, r * 1.05, h * 0.12, 16), iron, 0, h * 0.06, 0));
    const top = h * 0.12 + glassH;
    this.cage.push(mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.06, h * 0.05, 16), iron, 0, top, 0));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, b = mesh(new THREE.BoxGeometry(r * 0.06, glassH, r * 0.06), iron, Math.cos(a) * r, h * 0.12 + glassH / 2, Math.sin(a) * r); b.rotation.y = -a; }
    this.roof = new THREE.Group(); this.roof.position.y = top + h * 0.025; this.group.add(this.roof);
    this.cage.push(mesh(new THREE.ConeGeometry(r * 1.18, h * 0.32, 16, 1), iron, 0, h * 0.16, 0, this.roof));
    mesh(new THREE.SphereGeometry(r * 0.14, 8, 6), iron, 0, h * 0.36, 0, this.roof);
    // the glazing: eight panes, faintly gold with the lamp behind them (the beam's program: a basic map, both sides, added)
    this.glassMat = track(new THREE.MeshBasicMaterial({ map: beamTexture(), color: GOLD, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.glass = mesh(new THREE.CylinderGeometry(r * 0.99, r * 0.99, glassH * 0.98, 8, 1, true), this.glassMat, 0, h * 0.12 + glassH / 2, 0); this.glass.name = 'lantern-glass';
    // the crazing of a damaged pane (dark lines over two panes)
    const cr = [], rnd = mulberry(Math.round(r * 100));
    for (const pane of [1, 5]) { const a0 = (pane / 8) * Math.PI * 2 + 0.2, y0 = h * 0.12 + glassH * 0.55; let a = a0, y = y0; for (let k = 0; k < 7; k++) { const a1 = a0 + (rnd() - 0.5) * 0.55, y1 = y0 + (rnd() - 0.5) * glassH * 0.8; cr.push(Math.cos(a) * r * 1.01, y, Math.sin(a) * r * 1.01, Math.cos(a1) * r * 1.01, y1, Math.sin(a1) * r * 1.01); a = k % 2 ? a0 : a1; y = k % 2 ? y0 : y1; } }
    const crg = track(new THREE.BufferGeometry()); crg.setAttribute('position', new THREE.Float32BufferAttribute(cr, 3));
    this.craze = new THREE.LineSegments(crg, track(new THREE.LineBasicMaterial({ color: 0x050303 }))); this.craze.visible = false; this.group.add(this.craze);
    // the lens: prism rings round a bullseye, turning with the beam
    this.lens = new THREE.Group(); this.lens.position.y = h * 0.12 + glassH / 2; this.group.add(this.lens);
    this.lensMat = track(new THREE.MeshBasicMaterial({ color: GOLD }));
    for (let i = -3; i <= 3; i++) { const k = 1 - Math.abs(i) / 4, ring = mesh(new THREE.TorusGeometry(r * 0.55 * (0.55 + 0.45 * k), r * 0.05, 4, 16), this.lensMat, 0, i * glassH * 0.11, 0, this.lens); ring.rotation.x = Math.PI / 2; }
    this.eye = mesh(new THREE.OctahedronGeometry(r * 0.22, 1), this.lensMat, 0, 0, r * 0.18, this.lens); // (the bullseye panel: where the beam is thrown from)
    this.haloMat = track(new THREE.SpriteMaterial({ color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, map: haloTexture() }));
    this.halo = new THREE.Sprite(this.haloMat); this.halo.scale.setScalar(r * 7); this.lens.add(this.halo);
    // the shattered lens, lying on the floor ring (shown broken)
    this.shards = new THREE.Group(); this.shards.visible = false; this.group.add(this.shards);
    const shardMat = track(new THREE.MeshBasicMaterial({ color: 0x3a2a14 }));
    for (let i = 0; i < 9; i++) { const a = rnd() * Math.PI * 2, d = rnd() * r * 0.8, s = mesh(new THREE.TetrahedronGeometry(r * (0.08 + rnd() * 0.12)), shardMat, Math.cos(a) * d, h * 0.14, Math.sin(a) * d, this.shards); s.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); }
    // the shutters: six petals hinged at the floor ring
    this.petals = [];
    if (shutters) for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, hinge = new THREE.Group(); hinge.position.set(Math.cos(a) * r * 1.04, h * 0.12, Math.sin(a) * r * 1.04); hinge.rotation.y = -a + Math.PI / 2; this.group.add(hinge);
      const pg = new THREE.CylinderGeometry(r * 1.07, r * 1.07, glassH * 1.04, 3, 1, true, -Math.PI / 6, Math.PI / 3); pg.translate(0, glassH * 0.52, -r * 1.04); // (the arc centred on the lantern's axis, its hinge at the origin)
      const p = mesh(pg, iron, 0, 0, 0, hinge); p.material = track(new THREE.MeshStandardMaterial({ color: 0x2a1f19, metalness: 0.5, roughness: 0.5, flatShading: true, side: THREE.DoubleSide }));
      this.cage.push(p); this.petals.push(hinge);
    }
    // its line and glow, taken from the cage before its static parts are merged (render/merge.js: one draw a material)
    const edges = (list) => { const parts = list.map((m) => { m.updateMatrix(); return new THREE.EdgesGeometry(m.geometry, 40).applyMatrix4(m.matrix); }); const pos = []; for (const g of parts) { pos.push(...g.attributes.position.array); g.dispose(); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return track(g); };
    this.cageEdges = edges(this.cage.filter((m) => m.parent === this.group)); this.roofEdges = edges(this.cage.filter((m) => m.parent === this.roof));
    for (const g of [this.group, this.lens, this.roof, this.shards]) mergeStatic(g);
    // the beam: two crossed planes from the lens along +Z, and a dark rim behind the core
    const L = beam.length ?? 60, W = beam.width ?? r * 2.4;
    this.beam = new THREE.Group(); this.beam.position.copy(this.lens.position); this.group.add(this.beam);
    const bg = track(new THREE.PlaneGeometry(1, 1)); bg.rotateX(-Math.PI / 2); bg.translate(0, 0, 0.5); // (u across, v along: the plane lies along +Z from the lens)
        this.coreMat = track(new THREE.MeshBasicMaterial({ map: beamTexture(), color: HOT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.rimMat = track(new THREE.MeshBasicMaterial({ map: beamTexture(), color: RIM, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.beamParts = [];
    for (const [mat, wk, order] of [[this.rimMat, 1.7, 4], [this.coreMat, 1, 5]]) for (const roll of [0, Math.PI / 2]) {
      const m = new THREE.Mesh(bg, mat); m.rotation.z = roll; m.renderOrder = order; m.frustumCulled = false; m.userData.wk = wk; this.beam.add(m); this.beamParts.push(m);
    }
    this.L = L; this.W = W; this.t = 0; this.k = { lit: 0, open: shutters ? 0 : 1, warn: 0, hot: 0, yaw: 0, pitch: 0, state: 'intact', openE: shutters ? 0 : 1, litE: 0 };
    this.update(0);
  }

  set({ lit, open, yaw, pitch, warn, hot } = {}) {
    const k = this.k;
    if (lit != null) k.lit = THREE.MathUtils.clamp(lit, 0, 1);
    if (open != null) k.open = THREE.MathUtils.clamp(open, 0, 1);
    if (yaw != null) k.yaw = yaw; if (pitch != null) k.pitch = pitch;
    if (warn != null) k.warn = THREE.MathUtils.clamp(warn, 0, 1);
    if (hot != null) k.hot = THREE.MathUtils.clamp(hot, 0, 1);
    return this;
  }
  state(s) {
    this.k.state = s; const broken = s === 'broken';
    this.craze.visible = s === 'damaged'; this.glass.visible = !broken; this.shards.visible = broken;
    for (const c of this.lens.children) if (c !== this.halo) c.visible = !broken;
    this.roof.rotation.set(broken ? 0.32 : 0, 0, broken ? -0.22 : 0); this.roof.position.x = broken ? this.r * 0.25 : 0;
    return this;
  }

  lensWorld(out = new THREE.Vector3()) { return this.lens.getWorldPosition(out); }
  beamDir(out = new THREE.Vector3()) { return out.set(0, 0, 1).transformDirection(this.beam.matrixWorld); }
  beamPoint(d, out = new THREE.Vector3()) { return this.beam.localToWorld(out.set(0, 0, d)); }

  update(raw = 1 / 60) {
    this.t += raw; const k = this.k, t = this.t, ease = (a, b, r) => a + (b - a) * (1 - Math.exp(-raw * r));
    const broken = k.state === 'broken', damaged = k.state === 'damaged';
    k.openE = ease(k.openE, k.open, 3); k.litE = ease(k.litE, broken ? 0 : k.lit, 4);
    this.petals.forEach((p, i) => { p.children[0].rotation.x = k.openE * (1.75 + 0.08 * Math.sin(i * 2.1)); }); // (each petal folds down and out about its hinge)
    const gutter = damaged ? 0.6 + 0.12 * Math.sin(t * 1.3) * Math.sin(t * 0.7 + 1) : 1; // (a slow gutter, a breath of the flame: never a flicker)
    const glow = k.litE * gutter * (0.35 + 0.65 * k.openE);
    this.lensMat.color.setHex(GOLD).multiplyScalar(0.08 + 1.1 * glow); this.haloMat.opacity = 0.32 * glow;
    this.glassMat.opacity = 0.04 + 0.12 * glow;
    this.lens.rotation.y = k.yaw;
    // the beam: thin and pale as a warning, wide and gold-white when hot; only from an open lamp that is lit
    const on = broken ? 0 : k.openE * Math.max(k.litE, k.hot);
    const hot = k.hot * on, warn = Math.max(0, k.warn * on * (1 - hot));
    this.beam.rotation.set(k.pitch, k.yaw, 0, 'YXZ');
    const w = this.W * (0.18 + 0.82 * hot), len = this.L * (0.85 + 0.15 * Math.max(hot, warn));
    for (const m of this.beamParts) { m.scale.set(w * m.userData.wk, 1, len); m.visible = hot + warn > 0.01; }
    this.coreMat.color.copy(WARN).lerp(HOT, hot); this.coreMat.opacity = Math.max(warn * 0.55, hot * gutter);
    this.rimMat.opacity = hot * 0.55;
  }

  dispose() { this.group.parent?.remove(this.group); for (const g of this.geos) g.dispose(); for (const m of this.mats) m.dispose(); }
}

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
