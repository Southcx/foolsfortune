// ---------------------------------------------------------------------------------------
// THE GOD POWERS' MARKS (docs/plans/GODHAND.md section 8; Dovina's handoff, 2026-10-13): what a god power leaves on the ground and over it,
// in its domain's colour (DOMAIN_COLOUR, the mark colour of DOMAIN_LOOK: ui/domainlook.js) and the overlay's register (crisp, lit from
// within, no words). One white texture a style, painted once on a canvas and tinted by the material's colour, so seven domains and the
// seven feelings share four textures and one program (MeshBasicMaterial with a map: CASEBOOK rule 5); a circle of 3 m or more is DRAPED
// over the island's matter (its vertices laid on `game.matter.field`'s surface when it is made), so a dune does not swallow half of it.
//
//   STYLES   'mark'     the System's ring: a double rim, 72 ticks (every sixth long), a faint fill; a power's flash, a set's, a fold's
//            'ward'     Spellscription's written circle: a double rim with a band of brushed strokes between, a heptagram {7/3} inside
//                       (the domain's seven) and a small inner ring: the magic circle the plan names; with its WALL (below)
//            'miracle'  a feeling's circle: a soft bright rim, a second ring inward, a fill fading to the middle; the weather falls on it
//            'hatch'    the muster's spot: a ring broken by radial cracks, as clay splits where a clapperjar comes up
//   the ward's wall   a low curtain standing on the circle: bright at the foot, fading up, combed in vertical strokes (a fence of script)
//   the totem's band  two glowing bands round the totem's pillar in the held miracle's feeling, and a mark at its foot
//   the held slab     the slab lifted as its own layers (firm, loose, Lachryma in its feeling), its edges in Psychokinesis's oxblood,
//                     and a mark on the ground under it where it would be set down
//   the strata frame  the Strata section's outline and its leaders down to the stroke, in the labradorite's line (vfx/labradorite.js)
//   the course look   Course's line in the labradorite's line, and a pool mark where it would come to rest
//   readArrow         the arrowhead at the end of each of Read's lines
//
// Prior art: the magic circle of the grimoires (the Lesser Key's double ring with its band of names, the heptagram of the seven), the
// isekai status window's ground rings (a skill's area drawn as a glowing circle: Log Horizon, Overlord), From Dust's and Populous's
// marks that sit on the land rather than float over it (draped, not a flat disc), and the house's own labradorite line for what is seen.
//
//   circleMark(game, at, r, colour, { style, drape, opacity }) -> Mesh   (laid flat in its geometry: spin it by rotation.y; its material's opacity is the caller's, its children follow it)
//   wardWall(game, at, r, colour) -> Mesh (a child of the ward's circle)   totemLook(game, at, feeling) -> Group (userData.dispose)
//   slabLook(got, side, h, colour) -> Group (userData.dispose)   strataFrame(section, cols, lift)   courseLook(game) -> { set(pts), hide(), dispose() }
//   readArrow(pos, col, from, to, rgb)   disposeTree(obj)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { COLOR } from '../../progress/weather.js';
import { groundOf } from '../../godhand/matter.js';
import { mindLineMaterial } from '../labradorite.js';

const SIZE = 512;
const TEX = {};
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; // (the textures' own chance: the same every boot)

/** One style's texture, painted once (white on clear; the material's colour tints it). */
function texture(style) {
  if (TEX[style]) return TEX[style];
  const c = document.createElement('canvas'); c.width = c.height = SIZE;
  const g = c.getContext('2d'), R = SIZE / 2, C = R;
  const ring = (r, w, a = 1) => { g.globalAlpha = a; g.lineWidth = w; g.beginPath(); g.arc(C, C, r * R, 0, Math.PI * 2); g.stroke(); };
  const fill = (r0, a0, r1, a1) => { const gr = g.createRadialGradient(C, C, r0 * R, C, C, r1 * R); gr.addColorStop(0, `rgba(255,255,255,${a0})`); gr.addColorStop(1, `rgba(255,255,255,${a1})`); g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(C, C, r1 * R, 0, Math.PI * 2); g.fill(); };
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineCap = 'round';
  if (style === 'mark' || style === 'hatch') {
    fill(0, 0, 0.9, 0.16);
    ring(0.965, 9); ring(0.9, 3, 0.85);
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2, long = i % 6 === 0, r0 = 0.9, r1 = long ? 0.78 : 0.85;
      g.globalAlpha = long ? 0.95 : 0.6; g.lineWidth = long ? 4 : 2.5;
      g.beginPath(); g.moveTo(C + Math.cos(a) * r0 * R, C + Math.sin(a) * r0 * R); g.lineTo(C + Math.cos(a) * r1 * R, C + Math.sin(a) * r1 * R); g.stroke();
    }
    if (style === 'hatch') { // (the clay split where a worker came up: cracks run in from the rim, forking)
      g.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 9; i++) {
        let a = (i / 9) * Math.PI * 2 + rnd() * 0.4, r = 0.95; g.globalAlpha = 0.9; g.lineWidth = 5;
        g.beginPath(); g.moveTo(C + Math.cos(a) * r * R, C + Math.sin(a) * r * R);
        while (r > 0.25) { r -= 0.1 + rnd() * 0.1; a += (rnd() - 0.5) * 0.35; g.lineTo(C + Math.cos(a) * r * R, C + Math.sin(a) * r * R); g.lineWidth *= 0.85; }
        g.stroke();
      }
    }
  } else if (style === 'ward') {
    fill(0.4, 0, 0.88, 0.12);
    ring(0.975, 8); ring(0.885, 6);
    // the band of strokes between the rims: short brushed marks, each a stem and a bar, as a script runs round a circle (no letters)
    for (let i = 0; i < 84; i++) {
      const a = (i / 84) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), tx = -sa, ty = ca;
      const r0 = 0.9 + rnd() * 0.012, r1 = 0.96 - rnd() * 0.02, w = 3 + rnd() * 2.5;
      g.globalAlpha = 0.9; g.lineWidth = w;
      g.beginPath(); g.moveTo(C + ca * r0 * R, C + sa * r0 * R); g.lineTo(C + ca * r1 * R, C + sa * r1 * R); g.stroke();
      if (rnd() < 0.6) { const rm = r0 + (r1 - r0) * (0.3 + rnd() * 0.4), l = 0.012 + rnd() * 0.012; g.lineWidth = w * 0.7; g.beginPath(); g.moveTo(C + (ca * rm) * R, C + (sa * rm) * R); g.lineTo(C + (ca * rm + tx * l) * R, C + (sa * rm + ty * l) * R); g.stroke(); }
    }
    // the heptagram {7/3}: the domain's seven
    g.globalAlpha = 0.85; g.lineWidth = 5; g.beginPath();
    for (let i = 0; i <= 7; i++) { const a = -Math.PI / 2 + ((i * 3) % 7) / 7 * Math.PI * 2, x = C + Math.cos(a) * 0.86 * R, y = C + Math.sin(a) * 0.86 * R; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
    ring(0.36, 5, 0.9); ring(0.3, 2.5, 0.7);
  } else if (style === 'miracle') {
    fill(0, 0.04, 0.97, 0.3);
    const gr = g.createRadialGradient(C, C, 0.86 * R, C, C, R); // (the rim: soft both sides, brightest just inside the edge)
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.55, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.globalAlpha = 1; g.fillStyle = gr; g.beginPath(); g.arc(C, C, R, 0, Math.PI * 2); g.fill();
    ring(0.8, 3, 0.7);
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i / 7) * Math.PI * 2; g.globalAlpha = 0.9; g.beginPath(); g.arc(C + Math.cos(a) * 0.8 * R, C + Math.sin(a) * 0.8 * R, 9, 0, Math.PI * 2); g.fill(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (TEX[style] = t);
}

/** The surface under a point: the island's matter's (its Lachryma's top), or NaN off the field. */
function surface(game, x, z) { const F = game.matter?.field; if (!F) return NaN; const y = F.groundAt(x, z); return Number.isFinite(y) ? y + F.depthAt(x, z) : NaN; }

/** A circle on the ground, draped over the island's matter when it is 3 m or more (and `drape` is not false). */
export function circleMark(game, at, r, colour, { style = 'mark', drape = r >= 3, opacity = 0.6, lift = 0.1 } = {}) {
  const seg = drape ? Math.min(40, Math.max(8, Math.round(r * 1.2))) : 1;
  const geo = new THREE.PlaneGeometry(2 * r, 2 * r, seg, seg); geo.rotateX(-Math.PI / 2);
  if (drape) {
    const P = geo.attributes.position;
    for (let i = 0; i < P.count; i++) { const y = surface(game, at.x + P.getX(i), at.z + P.getZ(i)); P.setY(i, (Number.isFinite(y) ? Math.max(y - at.y, -1.5) : 0) + lift); }
    geo.computeBoundingSphere();
  }
  const mat = new THREE.MeshBasicMaterial({ map: texture(style), color: colour, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, toneMapped: false });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(at.x, at.y + (drape ? 0 : lift), at.z); m.renderOrder = 7; m.name = `godmark-${style}`;
  return m;
}

let WALL = null;
function wallTexture() { // (a curtain of strokes: each column its own height, bright at the foot)
  if (WALL) return WALL;
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  for (let x = 0; x < 256; x += 2) {
    const h = 20 + rnd() * 44, a = 0.25 + rnd() * 0.55, gr = g.createLinearGradient(0, 64, 0, 64 - h);
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x, 64 - h, 1.4, h);
  }
  const base = g.createLinearGradient(0, 64, 0, 0); base.addColorStop(0, 'rgba(255,255,255,0.55)'); base.addColorStop(0.5, 'rgba(255,255,255,0.08)'); base.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = base; g.fillRect(0, 0, 256, 64);
  WALL = new THREE.CanvasTexture(c); WALL.colorSpace = THREE.SRGBColorSpace; WALL.wrapS = THREE.RepeatWrapping;
  return WALL;
}

/** The ward's wall: a low curtain on its circle, its foot on the ground all the way round. A child of the circle (local space). */
export function wardWall(game, at, r, colour, h = 1.4) {
  const seg = Math.max(24, Math.round(r * 6)), geo = new THREE.CylinderGeometry(r, r, h, seg, 1, true);
  const P = geo.attributes.position, U = geo.attributes.uv, rep = Math.max(2, Math.round(r * 2));
  for (let i = 0; i < P.count; i++) {
    const y = surface(game, at.x + P.getX(i), at.z + P.getZ(i)), foot = Number.isFinite(y) ? Math.max(y - at.y, -1.5) : 0;
    P.setY(i, foot + (P.getY(i) > 0 ? h : 0)); U.setX(i, U.getX(i) * rep);
  }
  geo.computeBoundingSphere();
  const mat = new THREE.MeshBasicMaterial({ map: wallTexture(), color: colour, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, toneMapped: false });
  const m = new THREE.Mesh(geo, mat); m.renderOrder = 7; m.name = 'godmark-wardwall';
  return m;
}

/** Everything under an object taken down: its geometries and materials (the textures are the styles', kept). */
export function disposeTree(obj) {
  obj.parent?.remove(obj);
  obj.traverse((o) => { o.geometry?.dispose(); if (o.material && !o.material.userData?.shared) o.material.dispose(); });
}

/** The totem's band: two bands of the held feeling's colour round its pillar (r 0.35, 1.8 m: make.js), and a mark at its foot. */
export function totemLook(game, at, feeling, colour) {
  const G = new THREE.Group(); G.name = 'godhand-totem'; G.position.copy(at);
  const glow = new THREE.MeshBasicMaterial({ color: COLOR[feeling] ?? 0xffffff, toneMapped: false });
  for (const [y, h] of [[1.25, 0.16], [1.5, 0.06]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, h, 20, 1, true), glow); b.position.y = y; G.add(b); }
  const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), glow); cap.position.y = 2.15; cap.name = 'cap'; G.add(cap);
  G.add(circleMark(game, at, 1.4, colour, { drape: false, opacity: 0.7 })).children.at(-1).position.set(0, 0.1, 0);
  G.userData.tick = (t) => { cap.rotation.y = t * 0.8; cap.position.y = 2.15 + 0.06 * Math.sin(t * 1.3); };
  G.userData.dispose = () => disposeTree(G);
  game.scene.add(G);
  return G;
}

/** The held slab: its own layers, oxblood edges, and a mark on the ground under it (a child at the cursor's ground: the slab rides
 *  2 m + half its height over it, godhand/powers/force.js). */
export function slabLook(game, got, side, h, colour) {
  const G = new THREE.Group(); G.name = 'godhand-slab';
  const total = Math.max(1e-6, got.firm + got.loose + got.water), GR = groundOf();
  let y = -h / 2;
  for (const [kind, hex] of [['firm', GR.firm.colour], ['loose', GR.loose.colour], ['water', COLOR[got.feeling] ?? 0x7fd0e0]]) {
    const hh = h * (got[kind] / total); if (hh < 0.01) continue;
    const mat = kind === 'water' ? new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.8, toneMapped: false }) : new THREE.MeshStandardMaterial({ color: hex, roughness: 0.9 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(side, hh, side), mat); b.position.y = y + hh / 2; y += hh; G.add(b);
  }
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(side * 1.01, h * 1.01, side * 1.01)), new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0.95 }));
  G.add(edges);
  const under = circleMark(game, new THREE.Vector3(), side * 0.75, colour, { drape: false, opacity: 0.55 }); under.position.y = -(2 + h / 2) + 0.1; G.add(under);
  G.userData.dispose = () => disposeTree(G);
  game.scene.add(G);
  return G;
}

/** The Strata section's frame: its outline (the flat top, the ragged foot) and a leader down from each end to the ground it was
 *  drawn over, as a child of the section (it shows and hides with it). cols: [x, z, footY, topY, groundY] along the stroke. */
export function strataFrame(section, cols) {
  let F = section.userData.frame;
  if (!F) { F = new THREE.LineSegments(new THREE.BufferGeometry(), mindLineMaterial({ opacity: 0.9, depthTest: false, bright: 1.3 })); F.frustumCulled = false; F.renderOrder = 9; section.add(F); section.userData.frame = F; }
  const p = [];
  for (let i = 1; i < cols.length; i++) { const a = cols[i - 1], b = cols[i]; p.push(a[0], a[3], a[1], b[0], b[3], b[1], a[0], a[2], a[1], b[0], b[2], b[1]); }
  for (const c of [cols[0], cols[cols.length - 1]]) if (c) { p.push(c[0], c[2], c[1], c[0], c[3], c[1]); if (Number.isFinite(c[4])) p.push(c[0], c[2], c[1], c[0], c[4] + 0.05, c[1]); }
  F.geometry.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); F.geometry.computeBoundingSphere();
}

/** Course's look: the run in the labradorite's line, a pool mark where it comes to rest. */
export function courseLook(game, colour) {
  const line = new THREE.Line(new THREE.BufferGeometry(), mindLineMaterial({ opacity: 1, depthTest: false, bright: 1.4 }));
  line.frustumCulled = false; line.renderOrder = 9;
  const pool = circleMark(game, new THREE.Vector3(), 0.9, colour, { drape: false, opacity: 0.8 });
  game.scene.add(line, pool);
  let t = 0;
  return {
    set(pts, dt = 0) {
      t += dt;
      line.geometry.setFromPoints(pts); line.visible = pts.length > 1;
      const end = pts[pts.length - 1]; pool.visible = pts.length > 1;
      if (end) { pool.position.set(end.x, end.y - 0.05, end.z); pool.rotation.y = t * 0.6; pool.scale.setScalar(1 + 0.12 * Math.sin(t * 3)); }
    },
    hide() { line.visible = false; pool.visible = false; },
    dispose() { disposeTree(line); disposeTree(pool); },
  };
}

/** An arrowhead at the end of a Read line (two short strokes back from its point), into its segment arrays. */
export function readArrow(pos, col, from, to, rgb) {
  const dx = to.x - from.x, dz = to.z - from.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, L = Math.min(0.6, d * 0.3), W = L * 0.55, ty = to.y;
  for (const s of [-1, 1]) { pos.push(to.x, ty, to.z, to.x - ux * L - uz * W * s, ty, to.z - uz * L + ux * W * s); col.push(rgb.r, rgb.g, rgb.b, rgb.r, rgb.g, rgb.b); }
}
