// ---------------------------------------------------------------------------------------
// THE BOARD'S STAKES LOOK (docs/plans/SKIFF-RACING.md section 12; Dovina's handoff of 2026-10-14, items 2, 3, 4 and 10): the Solar
// Skiff's round-six rules (courier/skiff/boardrules.js) worn on the board itself, with no words and no numbers.
//   - THE SCORCH (rules.scorch 0..1, rules.luffing): the cloth heats toward an ember as the scorch builds (its own glow warmed and the
//     cloth browned: boat.js SKIFF_STAKES), embers rising off it when high; scorched (skiff.scorch) a cough of smoke and flakes, and
//     while it luffs the sail flutters empty (the sail bones shaken, boat.js) with smoke trailing off it.
//   - THE HULL (skiff.hull { damage }): a hit flashes the hull white-hot and throws chips of its glaze and clay, more for a harder knock.
//     A low pool (the board's health at the Raceway, game.lachryma) wears it: from half down the glaze dulls and roughens and its glow
//     sinks; past a third worn it is cracked, past two thirds cracked again (the hull's own painting copied with cracks drawn into it, a
//     texture swap: the same program), and shedding flakes of glaze as it rides.
//   - A WRECK (skiff.wreck): the board breaks as a sibling does (vfx/siblingshatter.js, in miniature, its shard geometry and its chips'
//     material): a flash and Lachryma's ring, the body hidden and its shards flung out in the hull's glaze, the cloth's cream and the
//     parts' gold, clay at every break; they lie while the Courier is down, then rise and fly home to the board, which is made whole with
//     gold through every join (kintsugi) as the Courier gets up.
//   - THE MANUAL (rules.manualOn, skiff.manualLean): the board stood up on its tail (a tilt of its body about the rider's feet, never the
//     physics), rolled a little by the lean, sand dragged off the tail; the grind's balance mark is shown for its lean
//     (vfx/racewaylooks.js asks it of vfx/grindbalancemark.js).
// Draw calls: none of its own in play (uniforms and the shared particle pools); a wreck adds four instanced meshes for about two real
// seconds (three glazes and the clay), the chips' program.
//
// Prior art: Excitebike's overheat (the engine smoking, the bike slowed), F-Zero's energy (the machine sparking and flashing as it takes
// a knock, its health its boost), Burnout's crash (the car in pieces, then reset whole), the Courier's own shatter and kintsugi (courier/
// vessel/death.js) and a sibling's (vfx/siblingshatter.js), Okami's Rejuvenation (pieces flying home), Tony Hawk's manual (nose up,
// tail scraping, the balance arrow).
//
//   const L = new SkiffBoardLooks(game, { events, vfx, tech })   L.update(dt)   BOARD_LOOK (the numbers)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { T, PALETTE } from '../core/config.js';
import { shardGeometry } from './siblingshatter.js';
import { LACHRYMA_TINT } from './racewayeffects.js';

/** The numbers: how fast the heat follows the scorch, the heat held while luffing, from what heat the embers rise; the manual's tilt (rad,
 *  nose up), its roll at full lean (rad), how fast it follows; the wear's span (of the pool lost), how fast it follows, the cracks' two
 *  steps, from what wear it sheds; the flashes (a hit's by damage, its real seconds; the mend's); the wreck (real seconds until the shards
 *  rise, their flight; each glaze's count and size range in m; the box they come from in the board's frame); the colours. */
export const BOARD_LOOK = {
  scorch: { follow: 6, luffHeat: 0.9, embers: 0.6 },
  manual: { tilt: 0.3, roll: 0.2, follow: 10 },
  wear: { from: 0.5, to: 0.95, follow: 2, cracks: [0.35, 0.68], shed: 0.7 },
  flash: { per: 1 / 10, min: 0.45, dur: 0.3, mend: 0.9, mendDur: 0.8 },
  wreck: { home: 1.5, fly: 0.65, glow: 0.4, pieces: [['hull', 14, 0.2, 0.34], ['cloth', 7, 0.18, 0.3], ['parts', 5, 0.12, 0.2]] },
  colour: { hull: 0xb4603f, cloth: 0xf0e2c4, parts: 0xe2b04a, crack: 0x24140c, crackEdge: 0xf6e6c8, gold: 0xffd27a },
};
const UP = new THREE.Vector3(0, 1, 0);
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _s = new THREE.Vector3();
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
/** A small seeded stream, so the cracks fall the same way every time (a second step adds to the first's). */
function stream(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

export class SkiffBoardLooks {
  constructor(game, o = {}) {
    this.game = game;
    this.vfxOf = () => o.vfx?.() || game.vfx;
    this.techOf = o.tech || (() => game.player?.techs?.get?.('skiff') || null);
    this.heat = 0; this.luff = 0; this.tilt = 0; this.roll = 0; this.wear = 0; this.stage = 0; this.t = 0;
    this.held = {}; this.wreck = null; this.crack = null;
    const E = o.events || game.events;
    if (E) {
      E.on('skiff.hull', (e) => { if (e.by === 'courier') this.hit(e); });
      E.on('skiff.wreck', (e) => { if (e.by === 'courier') this.breakBoard(); });
      E.on('skiff.scorch', (e) => { if (e.by === 'courier') this.scorched(); });
      for (const n of ['skiff.end', 'skiff.recall']) E.on(n, () => { this.mendNow(); this.stopAll(); });
    }
  }

  /** The board's boat (courier/skiff/boat.js), when its model is in. */
  boatOf(S = this.techOf()) { const b = S?.skiff; return b?.ready ? b : null; }

  // ---------------------------------------------------------------- moments
  /** A hit on the hull: a flash through it and chips of its glaze, by the damage. */
  hit(e) {
    const S = this.techOf(), boat = this.boatOf(S); if (!boat || boat.broken) return;
    const F = BOARD_LOOK.flash, k = Math.max(F.min, Math.min(1.3, (e.damage || 0) * F.per));
    boat.flash(k, 0xfff4e0, F.dur);
    const at = boat.group.localToWorld(_v.set(0, -0.15, e.kind === 'wall' ? 0.9 : 0));
    const h = this.vfxOf()?.play('skiff.hull.hit', { pos: at.clone(), power: 0.6 + 0.8 * Math.min(1, k) });
    if (h && S.v) h.ctx.vel = S.v;
  }
  /** The sail scorched: a cough of smoke and ember flakes off it. */
  scorched() { const boat = this.boatOf(); if (!boat) return; this.vfxOf()?.play('skiff.scorch', { pos: this.sailAt(boat, new THREE.Vector3()) }); }
  /** The sail's middle in the world (its middle bone, wherever the boom has swung it). */
  sailAt(boat, out) { const b = boat.bone?.sail_2; if (b) return b.getWorldPosition(out); return boat.group.localToWorld(out.set(0, 3, -0.4)); }

  // ---------------------------------------------------------------- held effects
  /** Held while `want`: an effect followed to where `at(h)` puts it; stopped when not. */
  hold(name, want, at, k = 1) {
    const H = this.held[name];
    if (!want) { if (H) { H.stop(); this.held[name] = null; } return; }
    if (H?.alive) { H.k = k; return; }
    const V = this.vfxOf(); if (!V) return;
    const h = V.play(name, { follow: (x) => (this.held[name] === x ? (at(x), true) : false) });
    this.held[name] = h; at(h); h.k = k;
  }
  stopAll() { for (const n of Object.keys(this.held)) { this.held[n]?.stop(); this.held[n] = null; } }

  // ---------------------------------------------------------------- per frame
  update(dt) {
    this.t += dt;
    const S = this.techOf(), boat = this.boatOf(S), C = BOARD_LOOK;
    if (this.wreck) this.stepWreck(dt, S, boat);
    if (!boat) { this.stopAll(); return; }
    const R = S.rules, ride = !!S.active && S.phase === 'ride', on = !!S.active;
    // the scorch: the heat follows the rules' scorch, held high while the sail luffs
    const luffing = !!R?.luffing, sc = Math.max(0, Math.min(1, R?.scorch || 0));
    this.heat = damp(this.heat, on ? (luffing ? Math.max(C.scorch.luffHeat, sc) : sc) : 0, C.scorch.follow, dt);
    this.luff = damp(this.luff, on && luffing ? 1 : 0, 8, dt);
    // the manual: up on its tail, rolled by the lean
    const man = ride && !!R?.manualOn;
    this.tilt = damp(this.tilt, man ? C.manual.tilt : 0, C.manual.follow, dt);
    this.roll = damp(this.roll, man ? Math.max(-1.2, Math.min(1.2, S.manualLean || 0)) * C.manual.roll : 0, C.manual.follow, dt);
    // the wear: the pool is the hull at the Raceway (elsewhere the board is as it was)
    const L = this.game.lachryma, frac = L ? L.value / Math.max(1e-6, L.max) : 1, here = !!this.game.raceway?.active;
    this.wear = damp(this.wear, here ? smooth(C.wear.from, C.wear.to, 1 - frac) : 0, C.wear.follow, dt);
    const stage = this.wear > C.wear.cracks[1] ? 2 : this.wear > C.wear.cracks[0] ? 1 : 0;
    if (stage !== this.stage) { this.stage = stage; boat.setHullMap(stage ? this.crackMap(boat, stage) : null); }
    boat.stakes({ heat: this.heat, luff: this.luff, wear: this.wear, tilt: this.tilt, roll: this.roll });
    // the held effects: embers off a hot sail, smoke off a luffing one, flakes off a worn hull, sand off the manual's tail
    const vel = S.v, show = on && !boat.broken;
    this.hold('skiff.scorch.heat', show && this.heat > C.scorch.embers, (h) => { this.sailAt(boat, h.pos); if (vel) h.ctx.vel = vel; }, this.heat);
    this.hold('skiff.luff.smoke', show && this.luff > 0.3, (h) => { this.sailAt(boat, h.pos); if (vel) h.ctx.vel = vel; }, this.luff);
    this.hold('skiff.hull.worn', show && ride && this.wear > C.wear.shed, (h) => { boat.group.localToWorld(h.pos.set(0, -0.2, 0)); if (vel) h.ctx.vel = vel; }, this.wear);
    this.hold('skiff.manual.drag', show && man && this.tilt > 0.15, (h) => {
      boat.group.localToWorld(h.pos.set(0, -0.6, -1.5));
      h.dir.set(0, 0.5, -1).applyQuaternion(boat.group.getWorldQuaternion(_q)).normalize(); if (vel) h.ctx.vel = vel; });
  }

  // ---------------------------------------------------------------- the worn hull's cracks
  /** The hull's own painting with cracks drawn into it: step 1 a few, step 2 those and more (a canvas copy, uploaded on a step only). */
  crackMap(boat, stage) {
    const src = boat.hullTex?.image; if (!src?.width) return null;
    try {
      if (!this.crack) {
        const c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
        const tex = new THREE.CanvasTexture(c), o = boat.hullTex;
        Object.assign(tex, { flipY: false, colorSpace: o.colorSpace, magFilter: o.magFilter, minFilter: o.minFilter, generateMipmaps: o.generateMipmaps, anisotropy: o.anisotropy, wrapS: o.wrapS, wrapT: o.wrapT });
        this.crack = { c, g: c.getContext('2d'), tex, drawn: -1 };
      }
      const K = this.crack;
      if (K.drawn !== stage) {
        const { g, c } = K, W = c.width, H = c.height, s = Math.max(1, W / 512), C = BOARD_LOOK.colour;
        g.clearRect(0, 0, W, H); g.drawImage(src, 0, 0);
        const r = stream(7), n = stage === 2 ? 30 : 12; // (the same stream: step 2's first twelve are step 1's)
        g.lineCap = 'round'; g.lineJoin = 'round';
        for (let i = 0; i < n; i++) {
          let x = r() * W, y = r() * H, a = r() * Math.PI * 2;
          const pts = [[x, y]], len = (10 + r() * 30) * s;
          for (let k = 0, m = 3 + ((r() * 4) | 0); k < m; k++) { a += (r() - 0.5) * 1.4; x += Math.cos(a) * len / m * 2; y += Math.sin(a) * len / m * 2; pts.push([x, y]); }
          const path = (dx, dy) => { g.beginPath(); g.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (const p of pts.slice(1)) g.lineTo(p[0] + dx, p[1] + dy); g.stroke(); };
          g.strokeStyle = `#${new THREE.Color(C.crackEdge).getHexString()}`; g.globalAlpha = 0.55; g.lineWidth = s; path(s, s); // (the bisque at the break's lip)
          g.strokeStyle = `#${new THREE.Color(C.crack).getHexString()}`; g.globalAlpha = 0.95; g.lineWidth = s * 1.2; path(0, 0);
          if (r() < 0.5) { const p = pts[(pts.length / 2) | 0], b = a + (r() < 0.5 ? 1 : -1) * (0.7 + r() * 0.6); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + Math.cos(b) * len * 0.5, p[1] + Math.sin(b) * len * 0.5); g.stroke(); } // (a branch)
        }
        g.globalAlpha = 1; K.drawn = stage; K.tex.needsUpdate = true;
      }
      return K.tex;
    } catch (e) { console.warn('the hull\'s cracks', e); return null; }
  }
  /** The hull's colour as its painting averages (for its shards), found once. */
  hullColour(boat) {
    if (this.hullC != null) return this.hullC;
    let c = BOARD_LOOK.colour.hull;
    try {
      const src = boat.hullTex?.image, k = document.createElement('canvas'); k.width = k.height = 8;
      const g = k.getContext('2d'); g.drawImage(src, 0, 0, 8, 8); const d = g.getImageData(0, 0, 8, 8).data;
      let R = 0, G = 0, B = 0, n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 128) { R += d[i]; G += d[i + 1]; B += d[i + 2]; n++; }
      if (n) c = new THREE.Color().setRGB(R / n / 255, G / n / 255, B / n / 255, THREE.SRGBColorSpace).getHex();
    } catch { /* (the fallback colour) */ }
    return (this.hullC = c);
  }

  // ---------------------------------------------------------------- a wreck: a sibling's shatter in miniature
  breakBoard() {
    const S = this.techOf(), boat = this.boatOf(S), V = this.vfxOf(); if (!boat) return;
    this.mendNow();
    const G = boat.group; G.updateMatrixWorld(true);
    const centre = G.localToWorld(new THREE.Vector3(0, 0.2, 0));
    V?.play('skiff.wreck', { pos: centre.clone(), phase: this.t * 0.3 });
    const base = this.game.fx?.chips?.mesh?.material;
    boat.broken = true; boat.flash(0, 0xffffff, 0.1);
    const W = { t: 0, shards: [], meshes: [], home: false, whole: false, glow: 1 };
    this.wreck = W;
    if (!base) return; // (no chips' material to wear: the board simply comes back whole)
    const geo = shardGeometry(), C = BOARD_LOOK.colour, gQ = G.getWorldQuaternion(new THREE.Quaternion()), gQi = gQ.clone().invert();
    const mat = (colour, rough) => { const m = base.clone(); m.color.setHex(colour); m.roughness = rough; m.metalness = 0; m.emissive.set(LACHRYMA_TINT); m.emissiveIntensity = 0; return m; };
    const look = { hull: [this.hullColour(boat), 0.55], cloth: [C.cloth, 0.9], parts: [C.parts, 0.4] }, sail = boat.L > 0.3;
    const bv = S?.v ? _w.copy(S.v).multiplyScalar(0.45) : _w.set(0, 0, 0), bvel = bv.clone();
    for (const [kind, n, s0, s1] of BOARD_LOOK.wreck.pieces) {
      if (kind === 'cloth' && !sail) continue;
      const part = { mesh: new THREE.InstancedMesh(geo.glaze, mat(...look[kind]), n), from: W.shards.length };
      for (let i = 0; i < n; i++) {
        const L = kind === 'hull' ? _v.set(rnd(-0.42, 0.42), rnd(-0.3, 0.12), rnd(-1.6, 1.6)) : kind === 'cloth' ? _v.set(rnd(-0.25, 0.25), rnd(2.3, 4), rnd(-1.2, 0.4)) : _v.set(rnd(-0.5, 0.5), rnd(0, 0.9), rnd(-1.4, 1));
        const p = G.localToWorld(L.clone()), q = new THREE.Quaternion().random(), s = rnd(s0, s1);
        const out = _s.copy(L).setY(0).normalize().applyQuaternion(gQ);
        const vel = out.multiplyScalar(rnd(2, 4.5)).add(bvel).add(new THREE.Vector3(0, rnd(2.5, 5), 0));
        W.shards.push({ p, vel: vel.clone(), q, w: new THREE.Vector3().randomDirection().multiplyScalar(rnd(6, 14)), scale: new THREE.Vector3(s * rnd(0.8, 1.25), s, s * rnd(0.8, 1.25)),
          rest: false, up: Math.random() < 0.75, part: W.meshes.length, homeL: L.clone(), homeQL: gQi.clone().multiply(q), floor: null });
      }
      W.meshes.push(part);
    }
    W.clay = new THREE.InstancedMesh(geo.clay, mat(PALETTE.fracture ?? 0xc9a07a, 0.9), W.shards.length);
    for (const M of [...W.meshes.map((x) => x.mesh), W.clay]) { M.instanceMatrix.setUsage(THREE.DynamicDrawUsage); M.frustumCulled = false; M.castShadow = false; M.userData.zoneFree = true; this.game.scene.add(M); }
    this.poseWreck(W);
  }
  /** The sand under a point (the board's ground), else a little under where it broke. */
  floorAt(S, p, fallback) { const y = S?.dunes?.rideHeight?.(p.x, p.z); return Number.isFinite(y) ? y : fallback; }

  stepWreck(dt, S, boat) {
    const W = this.wreck, B = BOARD_LOOK.wreck; W.t += dt;
    if (!boat) { this.mendNow(); return; }
    const G = boat.group, grav = T.physics?.gravity ?? 21;
    if (!W.home && W.t >= B.home) { // (they rise and fly home to the board, wherever it slid to)
      W.home = true;
      for (const s of W.shards) { s.from = s.p.clone(); s.fromQ = s.q.clone(); s.delay = Math.random() * 0.18; s.bend = new THREE.Vector3(rnd(-0.6, 0.6), rnd(0.8, 1.8), rnd(-0.6, 0.6)); }
    }
    if (!W.home) {
      W.glow = Math.max(0, W.glow - dt * 2);
      const floor0 = G.position.y - 0.7;
      for (const s of W.shards) {
        if (s.rest) { s.q.slerp(s.restQ, Math.min(1, dt * 14)); continue; }
        s.vel.y -= grav * dt; s.p.addScaledVector(s.vel, dt);
        _q.setFromAxisAngle(_v.copy(s.w).normalize(), s.w.length() * dt); s.q.premultiply(_q);
        if (s.floor === null && s.vel.y < 0) s.floor = this.floorAt(S, s.p, floor0);
        const lie = (s.floor ?? floor0) + (s.up ? shardGeometry().lift * s.scale.y : 0.004);
        if (s.p.y < lie) {
          s.p.y = lie; s.vel.y *= -0.3; s.vel.x *= 0.5; s.vel.z *= 0.5; s.w.multiplyScalar(0.45); s.floor = this.floorAt(S, s.p, floor0);
          if (Math.abs(s.vel.y) < 0.8) { s.rest = true; const yaw = Math.atan2(_v.set(1, 0, 0).applyQuaternion(s.q).z, _v.x);
            s.restQ = new THREE.Quaternion().setFromAxisAngle(UP, -yaw).multiply(_q2.setFromAxisAngle(_w.set(1, 0, 0), s.up ? 0 : Math.PI)); }
        }
      }
    } else {
      W.glow = Math.min(0.7, W.glow + dt * 3);
      G.updateMatrixWorld(true);
      const gQ = G.getWorldQuaternion(_q2), u = (W.t - B.home) / B.fly; let all = true;
      for (const s of W.shards) {
        const k = Math.max(0, Math.min(1, (W.t - B.home - s.delay) / B.fly)), e = k * k * (3 - 2 * k);
        if (k < 1) all = false;
        const to = G.localToWorld(_v.copy(s.homeL)), b = 4 * e * (1 - e);
        s.p.lerpVectors(s.from, to, e).addScaledVector(s.bend, b);
        s.q.slerpQuaternions(s.fromQ, _q.copy(gQ).multiply(s.homeQL), e);
        s.done = k >= 1;
      }
      if ((all || u > 1.4) && !W.whole) { // (home: the board whole, gold through every join)
        W.whole = true; boat.broken = false;
        const F = BOARD_LOOK.flash; boat.flash(F.mend, BOARD_LOOK.colour.gold, F.mendDur);
        this.vfxOf()?.play('skiff.wreck.mend', { pos: G.localToWorld(new THREE.Vector3(0, 0.2, 0)) });
        this.clearWreck(); return;
      }
    }
    this.poseWreck(W);
  }
  poseWreck(W) {
    if (!W.clay) return;
    const tiny = 1e-4; // (an instance gone home is shrunk to nothing, never to zero: casebook rule 92)
    for (let i = 0; i < W.shards.length; i++) {
      const s = W.shards[i]; _m.compose(s.p, s.q, _s.copy(s.scale).multiplyScalar(s.done ? tiny : 1));
      const P = W.meshes[s.part]; P.mesh.setMatrixAt(i - P.from, _m); W.clay.setMatrixAt(i, _m);
    }
    for (const M of [...W.meshes.map((x) => x.mesh), W.clay]) { M.instanceMatrix.needsUpdate = true; M.material.emissiveIntensity = BOARD_LOOK.wreck.glow * W.glow; }
  }
  /** A wreck cut short (the board stowed, the tech ended): the shards gone and the board whole at once. */
  mendNow() { if (!this.wreck) return; const boat = this.boatOf(); if (boat) boat.broken = false; this.clearWreck(); }
  clearWreck() {
    const W = this.wreck; this.wreck = null; if (!W) return;
    for (const M of [...W.meshes.map((x) => x.mesh), ...(W.clay ? [W.clay] : [])]) { M.parent?.remove(M); M.material.dispose(); M.dispose(); }
  }
}
