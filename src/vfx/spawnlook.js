// ---------------------------------------------------------------------------------------
// THE SPAWN LOOK: how a creature comes into the world (the owner, 2026-10-13). Two looks, chosen by where it comes from:
//
//   RISE   the Island of Ego's own Figments (slip jellies, Lantern Wisps, blotlings, the island's rejection answers) rise from the ground.
//          0.00  the ground darkens in a wide circle, a darker ring at its edge (the scorch and the shockring decals, darkening: warm)
//          0.00  the sand swells: a ring of wet-clay crust plates (dark umber, a lighter broken edge) lifts as a dome
//          0.20  the body breaks the surface and the crust cracks: the plates flung outward and up, tumbling, landing and lying; clods
//                thrown, a ring of dust kicked out along the ground, and a burst of bright Lachryma motes in its feeling's colour
//                (lightened) from the cracks, then a seep of them
//          0.18  the body pushes up out of it (sunk its own height, eased up with a little overshoot), clods falling off it as it comes
//          0.90  up; the plates sink back into the sand and the stain fades over a real second or so
//          A slip jelly is held still while it comes (the flag the bodies already honour for a thing moved by a script, `c.taking`: its
//          mind and its blows stood aside), and let go as it is fully out; a Lantern Wisp is not (its own update places its hover).
//   TEAR   Egregores and stray Figments invade from outside and tear in from midair.
//          0.00  a seam opens a metre or two up: a hairline grows to its height, crude-black edged in hot magenta and white, and the
//                glitch's tear held to that box on the screen only (vfx/glitch.js's region), never the whole picture
//          0.12  it widens like an eye; pixel blocks shed off its edges (the data drain's cubes, vfx/datadrain.js: the same program)
//          0.38  the body drops out of it, squeezed thin through the slit and filling out as it falls; it lands with a squash
//          0.74  the slit snaps shut: a white line, a crack of sparks, a jolt of the region's tear, a short sound (a placeholder: Wanda's)
//          0.95  done. The data-bug look (vfx/databug.js) finds a stray by its flag and dresses it: nothing here marks it.
//
// The body's part is a vertical offset this module writes over the body's own placing each frame (it runs after the minds and before
// the frame is drawn: main.js), so no body module needs a hook; a body that did not place itself this frame is not pushed twice.
// `visual.glitch` off: no region tear; everything else plays.
//
// No program of its own: the stain is the decal's darken mode, the clods, dust, motes and sparks the effect pools, the plates one lit
// material of the ordinary kind, the slit and the blocks the drain's unlit page and cube materials' parameters. All warm at boot.
//
// Prior art: .hack//Infection's magic portals (a monster written in where the portal was, its data unspooling into a body) and its
// glitched data-bugs; Digimon World's data-ification (a body assembled out of and broken back into blocks of data); Vagrant Story's
// summoning circles (the ground marked and darkened before anything stands on it); the sandworm and the Chuchu that rise from under
// you in every desert since Dune; and the horror rift (Stranger Things' gate, Event Horizon): a wound in the air, not a door.
//
//   game.spawnLook = new SpawnLook(game)   .play(creature, 'rise' | 'tear')   .update(rawDt, camera)   .prewarm() -> park
//   spawnLookOf(c) -> 'rise' | 'tear'   (by its own fields: `stray` or `egregore` tears in; everything else is island-born and rises)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { LIBRARY } from './library.js';
import { figmentColour } from './figmentscatter.js';
import { sfx } from '../audio/sfx.js';
import { T } from '../core/config.js';

/** Where a creature comes from, read from its own fields: an Egregore or a stray tears in; the island's own rise. */
export const spawnLookOf = (c) => (c?.stray || c?.egregore ? 'tear' : 'rise');

export const RISE = { dur: 1.8, crack: 0.2, up: [0.18, 0.9], plates: 7 };
export const TEAR = { dur: 0.95, grow: 0.12, wide: 0.38, drop: [0.38, 0.62], shut: [0.74, 0.8], above: 1.1 };
const CLAY = 0x5a3a28, CLAY_EDGE = 0x9c7458, MAGENTA = 0xff2fb4, WHITE = 0xffffff, CRUDE = 0x0b0710;
const BLOCKS = 192;
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ease = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const outBack = (x) => { x = clamp01(x); const s = 1.4, y = x - 1; return 1 + (s + 1) * y * y * y + s * y * y; };
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _c = new THREE.Color(), _box = new THREE.Box3();

// the looks' particles and the stain, as data (vfx/vfx.js), written into the library when the module is built
const EFFECTS = {
  'spawn.rise.ground': { layers: [
    { type: 'decal', tex: 'scorch', blend: 'darken', dur: 2.6, scale: 4.8, k: [[0, 0], [0.05, 1], [0.6, 1], [1, 0]], tint: 0xd8d2c8, glow: 0.95, offset: [0, 0.03, 0], spin: 0.04 },
    { type: 'decal', tex: 'shockring', blend: 'darken', dur: 2.6, scale: 3.3, k: [[0, 0], [0.05, 1], [0.6, 1], [1, 0]], tint: 0xffffff, glow: 1, offset: [0, 0.035, 0] }, // (the darker ring at its edge)
  ] },
  'spawn.rise.crack': { layers: [ // (the crust breaking: clods out and down, a low dust, and the motes from the cracks)
    { type: 'sprites', pool: 'alpha', count: 26, shape: 'chip', spawn: 'ring', r: 0.5, dir: 'out', lift: 1.3, speed: [1.6, 3.4], gravity: 9, drag: 0.4, floor: 'ground', size: [0.08, 0.17], life: [0.8, 1.2], color: [CLAY, 0x6e4a33, CLAY_EDGE], alpha: 1, alphaEnd: 1, spin: [-8, 8] },
    { type: 'sprites', pool: 'alpha', count: 20, shape: 'puff', spawn: 'ring', r: 0.55, dir: 'out', lift: 0.04, speed: [2.4, 4.0], drag: 2.6, size: [0.4, 0.7], sizeEnd: 1.5, life: [0.9, 1.4], color: [0xd8c4a0, 0xc8b08a], alpha: 0.6, alphaEnd: 0, offset: [0, 0.12, 0] }, // (the ring of dust kicked out along the ground)
    { type: 'sprites', count: 44, shape: 'soft', spawn: 'ring', r: 0.55, dir: 'cone', axis: 'up', cone: 28, speed: [1.6, 3.6], drag: 1.6, gravity: -0.3, size: [0.09, 0.17], sizeEnd: 0.03, life: [0.8, 1.4], color: 'tip', alpha: 1, alphaEnd: 0, twinkle: 0.4 }, // (the burst from the cracks as it breaks the surface: bright, additive)
    { type: 'sprites', rate: 34, dur: 1.1, shape: 'soft', spawn: 'ring', r: 0.5, dir: 'up', speed: [0.25, 0.7], size: [0.05, 0.1], sizeEnd: 0.02, life: [1.0, 1.7], drag: 0.3, gravity: -0.15, color: 'tint', alpha: 0.95, alphaEnd: 0, twinkle: 0.5 },
  ] },
  'spawn.rise.clods': { layers: [ // (clods falling off the body as it comes up: `ctx.h` the height of it above the sand)
    { type: 'sprites', pool: 'alpha', count: 7, shape: 'chip', spawn: 'column', r: 'r', height: 'h', dir: 'out', lift: 0.2, speed: [0.3, 0.9], gravity: 9, floor: 'ground', size: [0.05, 0.1], life: [0.5, 0.9], color: [CLAY, 0x6e4a33], alpha: 1, alphaEnd: 1, spin: [-6, 6] },
  ] },
  'spawn.tear.seal': { layers: [ // (the snap shut: a crack of sparks off the seam, a jolt)
    { type: 'sprites', count: 16, shape: 'streak', spawn: 'line', r: 0.02, dir: 'sphere', speed: [1.5, 3.5], stretch: 2.5, drag: 3, size: [0.08, 0.16], life: [0.15, 0.3], color: [MAGENTA, WHITE], alpha: 1, alphaEnd: 0 },
    { type: 'shake', k: 0.08 },
  ] },
};

/** The slit: a lens of unit height and half-width 1 at its middle, its edges torn (a hash a row, fixed: a seam, not a wobble). */
function slitGeometry(rows = 22) {
  const pos = [], idx = [];
  for (let i = 0; i <= rows; i++) {
    const u = i / rows, y = u - 0.5, w = Math.pow(Math.sin(Math.PI * u), 0.85);
    const jl = 1 + (hash(i * 3.1) - 0.5) * 0.5 * (i % 2 ? 1 : 0.4), jr = 1 + (hash(i * 7.7 + 2) - 0.5) * 0.5 * (i % 2 ? 0.4 : 1);
    pos.push(-w * jl, y, 0, w * jr, y, 0);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
/** The slit's half-width at a height up it (-0.5..0.5), as the lens above draws it (without its tears). */
const slitHalf = (y) => Math.pow(Math.sin(Math.PI * clamp01(y + 0.5)), 0.85);

export class SpawnLook {
  constructor(game) {
    this.game = game; this.runs = []; this.made = false;
    this.blocks = []; this.slits = []; this.plates = [];
    for (const [k, v] of Object.entries(EFFECTS)) if (!LIBRARY[k]) LIBRARY[k] = v;
  }

  make() {
    if (this.made) return; this.made = true;
    const g = new THREE.Group(); g.name = 'spawnlook'; g.userData.zoneFree = true;
    // the drain's cubes' parameters (vfx/datadrain.js): one instanced, unlit, coloured program, warm at boot
    this.cubes = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ name: 'spawnlook-blocks', fog: false, toneMapped: false }), BLOCKS);
    this.cubes.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(BLOCKS * 3), 3);
    this.cubes.frustumCulled = false;
    for (let i = 0; i < BLOCKS; i++) this.cubes.setMatrixAt(i, _m.makeScale(0, 0, 0));
    g.add(this.cubes);
    this.slitGeo = slitGeometry();
    this.plateGeo = new THREE.BoxGeometry(1, 1, 1);
    this.plateMat = new THREE.MeshStandardMaterial({ name: 'spawnlook-crust', color: CLAY, roughness: 0.55, metalness: 0 }); // (wet clay: a little gloss)
    this.edgeMat = new THREE.MeshStandardMaterial({ name: 'spawnlook-crust-edge', color: CLAY_EDGE, roughness: 0.9, metalness: 0 }); // (its broken edge, drier; the same program)
    this.group = g;
    this.game.scene?.add(g);
  }

  /** The slit's three layers (glow, hot edge, crude core), from a pool. The drain's page material's parameters, its blending a state. */
  takeSlit() {
    let S = this.slits.find((x) => !x.busy);
    if (!S) {
      const plain = (color, blending) => new THREE.MeshBasicMaterial({ name: 'spawnlook-slit', color, transparent: true, opacity: 1, depthWrite: false, fog: false, toneMapped: false, side: THREE.DoubleSide, blending });
      const o = new THREE.Group(), glow = new THREE.Mesh(this.slitGeo, plain(MAGENTA, THREE.AdditiveBlending)), edge = new THREE.Mesh(this.slitGeo, plain(WHITE, THREE.AdditiveBlending)), core = new THREE.Mesh(this.slitGeo, plain(CRUDE, THREE.NormalBlending));
      glow.renderOrder = 6; edge.renderOrder = 7; core.renderOrder = 8;
      for (const m of [glow, edge, core]) m.frustumCulled = false;
      o.add(glow, edge, core); o.visible = false; this.group.add(o);
      S = { o, glow, edge, core, busy: false }; this.slits.push(S);
    }
    S.busy = true; S.o.visible = true; return S;
  }
  /** A ring of crust plates, from a pool: each a pivot at its place round the ring, the plate inside it. */
  takePlates() {
    let P = this.plates.find((x) => !x.busy);
    if (!P) {
      const o = new THREE.Group(), list = [];
      for (let i = 0; i < RISE.plates; i++) { const pv = new THREE.Object3D(), m = new THREE.Mesh(this.plateGeo, this.plateMat), e = new THREE.Mesh(this.plateGeo, this.edgeMat); m.receiveShadow = e.receiveShadow = true; pv.add(m, e); o.add(pv); list.push({ pv, m, e }); }
      o.visible = false; this.group.add(o);
      P = { o, list, busy: false }; this.plates.push(P);
    }
    P.busy = true; P.o.visible = true; return P;
  }

  /** Bring a creature in: 'rise' (the island's own) or 'tear' (an Egregore, a stray); by its own fields when not said. */
  play(c, mode = spawnLookOf(c)) {
    if (!c?.root || !c.pos) return null;
    this.make();
    this.finish(this.runs.find((R) => R.c === c)); // (spawned again before the last look ended: the last let go first)
    const root = c.root;
    root.updateMatrixWorld(true); _box.setFromObject(root);
    const top = Number.isFinite(_box.max.y) ? Math.max(0.3, _box.max.y - c.pos.y) : (c.height || 1.2);
    const R = { c, mode, t: 0, top, ground: c.pos.y, base: root.position.y, wrote: NaN, was: root.visible, s0: root.scale.clone(), flags: {}, r: Math.max(0.35, c.radius || 0.5) };
    if (mode === 'tear') this.startTear(R); else this.startRise(R);
    this.runs.push(R);
    this.place(R, mode === 'tear' ? 0 : -(top + 0.05));
    return R;
  }

  startRise(R) {
    const g = this.game, c = R.c, k = R.r / 0.5;
    R.tint = figmentColour(c); R.bright = _c.set(R.tint).lerp(new THREE.Color(WHITE), 0.45).multiplyScalar(1.6).getHex();
    if (!c.taking && c.kind !== 'wisp') R.took = c.taking = true; // (held still till it is out: the bodies' flag for a thing a script moves; not a Lantern Wisp, whose hover its own update places)
    g.vfx?.play?.('spawn.rise.ground', { pos: _v.copy(c.pos).setY(R.ground), scale: k });
    R.plates = this.takePlates(); R.plates.o.position.set(c.pos.x, R.ground, c.pos.z); R.plates.o.rotation.y = hash(c.id ?? 1) * 6.28; R.plates.o.scale.setScalar(k);
    R.plates.list.forEach((p, i) => { p.a = (i / RISE.plates) * Math.PI * 2 + (hash(i + (c.id ?? 0)) - 0.5) * 0.4; p.w = 0.36 + 0.14 * hash(i * 5.3); p.tilt = 0.8 + 0.5 * hash(i * 2.9); p.m.scale.set(0.84, 0.16, p.w * 2); p.e.scale.set(0.14, 0.2, p.w * 1.9); p.e.position.set(0.4, 0.02, 0); p.out = 1.4 + 1.2 * hash(i * 4.1); p.up = 2.2 + 1.2 * hash(i * 6.7); p.spin = (hash(i * 8.3) - 0.3) * 9; });
  }

  startTear(R) {
    const g = this.game, c = R.c;
    R.H = THREE.MathUtils.clamp(R.top * 1.05, 1.0, 2.4); R.W = THREE.MathUtils.clamp(R.r * 1.15, 0.32, 1.1);
    R.at = new THREE.Vector3(c.pos.x, R.ground + TEAR.above + R.top * 0.5, c.pos.z); // (its middle: a metre or two up)
    R.slit = this.takeSlit(); R.slit.o.position.copy(R.at);
    R.region = { u0: 0.5, v0: 0.5, u1: 0.5, v1: 0.5 }; this.aimRegion(R);
    R.shed = 0; R.root0 = R.was;
    if (T.visual.glitch !== false) g.glitch?.pulse?.({ tear: 0.75, split: 0.55, crush: 0.7, mosh: 0.25, dur: TEAR.shut[1] + 0.05, region: R.region });
    c.root.visible = false;
  }

  /** The body at its offset (up from where the body put itself): over the body's own placing, never on top of the last frame's. */
  place(R, off) {
    const root = R.c.root, y = root.position.y;
    if (!(Math.abs(y - R.wrote) < 1e-6)) R.base = y; // (the body placed itself this frame: that is where it is)
    root.position.y = R.wrote = R.base + off;
  }

  /** The body let go: its mind and its blows back (only if the look took it). */
  letGo(R) { if (R.took && R.c.taking === true) R.c.taking = false; R.took = false; }

  finish(R) {
    if (!R) return;
    this.letGo(R);
    const root = R.c.root;
    if (Math.abs(root.position.y - R.wrote) < 1e-6) root.position.y = R.base;
    root.scale.copy(R.s0);
    if (R.mode === 'tear') root.visible = R.was ?? true;
    if (R.slit) { R.slit.busy = false; R.slit.o.visible = false; }
    if (R.plates) { R.plates.busy = false; R.plates.o.visible = false; }
    this.runs = this.runs.filter((x) => x !== R);
  }

  get active() { return this.runs.length > 0; }

  update(raw, camera = this.game.camera) {
    if (!this.made) return;
    for (const R of [...this.runs]) {
      R.t += raw;
      const gone = !R.c.root?.parent || (this.game.creatures?.list && !this.game.creatures.list.includes(R.c) && !R.c.spirit);
      if (gone || R.t >= (R.mode === 'tear' ? TEAR.dur : RISE.dur)) { this.finish(R); continue; }
      if (R.mode === 'tear') this.tear(R, raw, camera); else this.rise(R);
    }
    this.blocksUpdate(raw);
  }

  // ---------------------------------------------------------------- rise
  rise(R) {
    const g = this.game, c = R.c, t = R.t, once = (k, fn) => { if (!R.flags[k]) { R.flags[k] = true; fn(); } };
    // the body: sunk its own height, pushed up with a little overshoot
    const [u0, u1] = RISE.up, u = (t - u0) / (u1 - u0);
    this.place(R, u >= 1 ? 0 : -(R.top + 0.05) * (1 - outBack(u)));
    if (t >= RISE.crack) once('crack', () => g.vfx?.play?.('spawn.rise.crack', { pos: _v.copy(c.pos).setY(R.ground + 0.04), scale: R.r / 0.5, tint: R.tint, tip: R.bright, floor: R.ground }));
    for (const [i, at] of [0.36, 0.55, 0.74].entries()) if (t >= at) once(`clods${i}`, () => {
      const h = Math.max(0.2, R.top * clamp01(outBack(u)));
      g.vfx?.play?.('spawn.rise.clods', { pos: _v.copy(c.pos).setY(R.ground), r: R.r * 0.8, h, floor: R.ground });
    });
    if (t >= u1) once('land', () => { c.deform?.kick?.(-1.2, null, 0.08); this.letGo(R); });
    // the plates: swelled as a dome, then flung outward and up as it cracks, tumbling, landing and lying; then sunk back into the sand
    const swell = ease(t / RISE.crack), tc = Math.max(0, t - RISE.crack), settle = ease((t - 1.15) / 0.6);
    for (const p of R.plates.list) {
      const fly = Math.min(tc, (2 * p.up) / 9.8); // (in the air until it comes down again)
      const d = 0.5 + 0.12 * swell + p.out * fly, y = -0.08 + 0.14 * swell + p.up * fly - 4.9 * fly * fly;
      p.pv.position.set(Math.cos(p.a) * d, Math.max(-0.08, y) - 0.25 * settle, Math.sin(p.a) * d);
      p.pv.rotation.set(0, -p.a, 0.12 * swell - p.spin * fly - (tc > 0 ? 0.25 * p.tilt : 0));
    }
  }

  // ---------------------------------------------------------------- tear
  aimRegion(R) {
    const cam = this.game.camera; if (!cam) return;
    const b = R.region; b.u0 = b.v0 = 1; b.u1 = b.v1 = 0;
    const right = _w.set(1, 0, 0).applyQuaternion(cam.quaternion).setY(0).normalize(), hw = R.W * 1.9 + 0.3, hh = R.H * 0.65 + 0.3;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      _v.copy(R.at).addScaledVector(right, sx * hw); _v.y += sy * hh; _v.project(cam);
      if (_v.z > 1) continue; // (behind the camera)
      const x = _v.x * 0.5 + 0.5, y = _v.y * 0.5 + 0.5;
      b.u0 = Math.min(b.u0, x); b.u1 = Math.max(b.u1, x); b.v0 = Math.min(b.v0, y); b.v1 = Math.max(b.v1, y);
    }
    if (b.u1 < b.u0) { b.u0 = b.v0 = 0.5; b.u1 = b.v1 = 0.5; }
  }

  tear(R, raw, camera) {
    const g = this.game, c = R.c, t = R.t, S = R.slit, once = (k, fn) => { if (!R.flags[k]) { R.flags[k] = true; fn(); } };
    this.aimRegion(R);
    // the slit: a hairline grows to its height, widens like an eye, quivers in steps, snaps shut
    const step = Math.floor(t * 9), jit = 1 + (hash(step + (c.id ?? 0)) - 0.5) * 0.14;
    const grow = ease(t / TEAR.grow), open = outBack((t - TEAR.grow) / (TEAR.wide - TEAR.grow)), [s0, s1] = TEAR.shut, shut = clamp01((t - s0) / (s1 - s0));
    const w = Math.max(0.006, (0.012 + R.W * open * jit) * (1 - shut * shut * shut)), h = R.H * grow * (1 - 0.25 * shut);
    if (camera) S.o.rotation.set(0, Math.atan2(camera.position.x - R.at.x, camera.position.z - R.at.z), 0);
    S.core.scale.set(w, h, 1);
    S.edge.scale.set(w + 0.035, h + 0.06, 1);
    S.glow.scale.set(w * 1.6 + 0.09, h * 1.08 + 0.14, 1);
    const after = clamp01((t - s1) / (TEAR.dur - s1)); // (sealed: a white line left a beat, fading)
    S.core.visible = t < s1; S.glow.material.opacity = (0.75 + 0.25 * (step % 2)) * (1 - after);
    S.edge.material.opacity = 1 - after;
    if (t >= s1) { S.edge.scale.set(0.012, R.H * (0.75 + 0.2 * after), 1); S.glow.scale.set(0.05, R.H * 0.8, 1); }
    // the blocks: shed off its edges while it is open
    if (t > TEAR.grow * 0.5 && t < s1) {
      R.shed += raw * 80 * (0.4 + open);
      while (R.shed >= 1) { R.shed -= 1; this.shed(R, w, h, camera); }
    }
    // the body: hidden till the eye is open, then squeezed thin through it and dropped, filling out as it falls; a squash on landing
    const [d0, d1] = TEAR.drop, f = clamp01((t - d0) / (d1 - d0));
    if (t >= d0) {
      once('out', () => { c.root.visible = R.root0 ?? true; });
      const from = R.at.y - R.H * 0.32 - R.ground;
      this.place(R, from * (1 - f * f));
      const thin = 0.25 + 0.75 * ease(f * 1.4);
      c.root.scale.set(R.s0.x * thin, R.s0.y * (1 + 0.15 * (1 - thin)), R.s0.z * thin);
      if (f >= 1) once('land', () => { c.root.scale.copy(R.s0); c.deform?.kick?.(-2.2, null, 0.1); });
    } else { c.root.visible = false; this.place(R, 0); }
    if (t >= s1) once('seal', () => {
      const top = _v.copy(R.at).setY(R.at.y + R.H * 0.4), bot = _w.copy(R.at).setY(R.at.y - R.H * 0.4);
      g.vfx?.play?.('spawn.tear.seal', { pos: R.at, from: top.clone(), to: bot.clone() });
      if (T.visual.glitch !== false) g.glitch?.pulse?.({ tear: 1, split: 0.9, crush: 0.9, dur: 0.18, region: R.region });
      const dist = g.listenerDistance?.(R.at) ?? 5;
      (sfx.spawnTear || sfx.ropeSnap)?.call(sfx, dist); // (a placeholder, Wanda's to write: sfx.spawnTear; the rope's snap stands in)
      for (let i = 0; i < 14; i++) this.shed(R, 0.03, R.H * 0.8, camera, 1.6);
    });
  }

  // ---------------------------------------------------------------- the blocks (the drain's pieces)
  shed(R, w, h, camera, kick = 1) {
    if (this.blocks.length >= BLOCKS) return;
    const y = (Math.random() - 0.5) * 0.9, side = Math.random() < 0.5 ? -1 : 1;
    const ang = camera ? Math.atan2(camera.position.x - R.at.x, camera.position.z - R.at.z) : 0, rx = Math.cos(ang), rz = -Math.sin(ang); // (the slit's right, as it faces the camera)
    const half = w * slitHalf(y) * side;
    const p = new THREE.Vector3(R.at.x + rx * half, R.at.y + y * h, R.at.z + rz * half);
    const out = (0.25 + Math.random() * 0.7) * side * kick;
    const v = new THREE.Vector3(rx * out + (Math.random() - 0.5) * 0.2, (Math.random() - 0.6) * 0.5 * kick, rz * out + (Math.random() - 0.5) * 0.2);
    const s = Math.round((0.03 + Math.random() * 0.07) / 0.015) * 0.015; // (snapped sizes: pixels, not confetti)
    const r = Math.random(), col = r < 0.45 ? MAGENTA : r < 0.75 ? CRUDE : WHITE;
    this.blocks.push({ p, v, s, col, t: 0, life: 0.35 + Math.random() * 0.45, seed: Math.random() * 100 });
  }

  blocksUpdate(raw) {
    if (!this.cubes) return;
    const B = this.blocks;
    if (!B.length && this.clean) return; // (nothing spawning and every instance already scaled to nothing: no rewrite, no upload)
    for (let i = B.length - 1; i >= 0; i--) { const b = B[i]; b.t += raw; if (b.t >= b.life) B.splice(i, 1); }
    for (let i = 0; i < BLOCKS; i++) {
      const b = B[i];
      if (!b) { this.cubes.setMatrixAt(i, _m.makeScale(0, 0, 0)); continue; }
      b.v.y -= 1.2 * raw; b.v.multiplyScalar(Math.exp(-1.5 * raw)); b.p.addScaledVector(b.v, raw);
      const e = b.t / b.life, flick = hash(Math.floor(b.t * 8) + b.seed) < 0.15 + 0.5 * e ? 0 : 1; // (blinking out in steps, 8 a real second)
      const s = b.s * (1 - e * 0.6) * flick;
      this.cubes.setMatrixAt(i, _m.compose(b.p, _q.identity(), _s.set(s, s, s)));
      this.cubes.setColorAt(i, _c.set(b.col).multiplyScalar(b.col === CRUDE ? 1 : 1.3));
    }
    this.cubes.count = BLOCKS;
    this.cubes.instanceMatrix.needsUpdate = true; this.cubes.instanceColor.needsUpdate = true;
    this.clean = !B.length; // (this pass wrote every instance as nothing)
  }

  /** For the boot's warm-up (main.js): a slit, a ring of plates and the blocks shown 50 m down, so their programs compile with the rest. */
  prewarm() {
    this.make();
    const S = this.takeSlit(), P = this.takePlates();
    S.o.position.set(0, -50, 0); P.o.position.set(0, -50, 0);
    this.cubes.setMatrixAt(0, _m.compose(_v.set(0, -50, 0), _q.identity(), _s.set(0.1, 0.1, 0.1))); this.cubes.instanceMatrix.needsUpdate = true;
    return () => { S.busy = false; S.o.visible = false; P.busy = false; P.o.visible = false; this.cubes.setMatrixAt(0, _m.makeScale(0, 0, 0)); this.cubes.instanceMatrix.needsUpdate = true; };
  }
}
