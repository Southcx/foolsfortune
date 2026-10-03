// ---------------------------------------------------------------------------------------
// VFX: one way to make every effect in the game. A game system never builds particles, meshes, flashes or shakes of its own; it asks
// for an effect BY NAME and says where and why, and the look lives in one place as data (vfx/library.js):
//
//   game.vfx.play('hit.blunt.clay', { pos, dir, normal, tint, power })      a one-shot (a hit, a poof, a pickup)
//   const h = game.vfx.play('ult.pillar', { pos }); ... h.pos.copy(p); h.k = 0.5; ... h.stop()      a held one (a channel, an aura)
//
// THE NAME is what happened, not what it looks like (`hit.slash.crystal`, `chest.burst.epic`, `ult.key`), so the look can be
// redirected without touching the code that asked. A name is looked up from the most particular to the least: `hit.slash.crystal`,
// then `hit.slash`, then `hit`, so a new material or tool has a look the day it exists and gets its own when someone writes one.
//
// AN EFFECT is a list of LAYERS, each one small piece of the picture, played together and each on its own clock (`at`: when it
// starts). Layer types:
//   sprites   shaped particles (vfx/sprites.js): a burst (`count`) or a stream (`rate` a second, for `dur`)
//   mesh      an effect mesh from Mesh Create (vfx/meshfx.js), with its scale, fade and turn over its life
//   flash     the screen washes to a colour and back (capped: a flash, never a flicker)
//   light     a lamp that blooms and fades (one of a few, the light budget lends them as it lends any lamp)
//   shake     the camera's shake      hitstop  the world held a moment      smear  the PS2 frame feedback (render/glow.js)
//   glyph     a mark (vfx/glyphs.js)   sound  an sfx method by name (audio: Wanda's)   fx  another effect, by name
// A layer's numbers can be a number, a range [min, max] picked per particle, or a key into the context (`'tint'`); colours can be
// hex, 'tint' (the caller's), 'lab' (a colour of the labradorite's flash) or 'gold' / 'lach' / 'white'. `power` (the context's)
// scales counts and sizes, so one effect serves a tap and a full-strength blow.
//
// An effect can `extends` another (its layers first, then these), so a family shares a base and each member adds its own: change
// the base and the family follows.
//
// Prior art: Unreal's Niagara and Unity's VFX Graph (an effect is emitters, each a module stack, played as one system), Final Fantasy
// XIV's .avfx (an effect is named by its use and layered: particles, models, lights, screen effects), and the data-driven hit tables
// of fighting games (a move names its hit effect; the effect is tuned apart from the move).
//
//   game.vfx = new Vfx(game)   .play(name, ctx) -> handle   .update(rawDt)   .has(name)   .names()
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { Sprites } from './sprites.js';
import { meshFx } from './meshfx.js';
import { LIBRARY } from './library.js';
import { sfx } from '../audio.js';

const NAMED = { gold: 0xffd76a, lach: 0xb49be6, white: 0xffffff, ember: 0xff9a5c, blue: 0x7fb2ff, ink: 0x140c1e };
// (the labradorite's flash, as hex: the stone's palette in vfx/labradorite.js, for particles that take one colour each)
const LAB = [0x6638d1, 0x384cf2, 0x2480fa, 0x1ab2db, 0x38c78c, 0xebc252, 0xe07542];
const rnd = (v, ctx) => (Array.isArray(v) ? v[0] + Math.random() * (v[1] - v[0]) : typeof v === 'string' ? ctx[v] ?? 0 : v ?? 0);
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);

function color(v, ctx) {
  if (v === undefined || v === null) return 0xffffff;
  if (v.isColor) return v.getHex();
  if (Array.isArray(v)) return color(v[Math.floor(Math.random() * v.length)], ctx);
  if (v === 'tint') return ctx.tint === undefined ? 0xffffff : color(ctx.tint, ctx);
  if (v === 'lab') return LAB[Math.floor(Math.random() * LAB.length)];
  if (typeof v === 'string') return NAMED[v] ?? 0xffffff;
  return v;
}
/** A curve: [[t, v], ...] (t 0..1), or a number. */
function curve(c, t) {
  if (!Array.isArray(c)) return c ?? 1;
  if (t <= c[0][0]) return c[0][1];
  for (let i = 1; i < c.length; i++) if (t <= c[i][0]) { const [t0, v0] = c[i - 1], [t1, v1] = c[i]; const u = (t - t0) / Math.max(1e-6, t1 - t0); return v0 + (v1 - v0) * u * u * (3 - 2 * u); }
  return c[c.length - 1][1];
}

export class Vfx {
  constructor(game) {
    this.game = game;
    this.add = new Sprites(game.scene, { additive: true, max: 16384 });
    this.alpha = new Sprites(game.scene, { additive: false, max: 8192 });
    this.live = [];
    this.lib = LIBRARY;
    this.lights = Array.from({ length: 3 }, () => { const l = new THREE.PointLight(0xffffff, 0, 10, 1.6); l.userData.moodExempt = true; game.scene.add(l); return { l, t: 0, dur: 0, k: 0 }; });
    this.flashEl = Object.assign(document.createElement('div'), { id: 'vfxflash' });
    this.flashEl.style.cssText = 'position:fixed;inset:0;opacity:0;pointer-events:none;z-index:9;mix-blend-mode:screen';
    document.body.appendChild(this.flashEl);
    this.flashK = 0; this.flashDecay = 2;
    this.meshReady = false;
    meshFx.load().then(() => { this.meshReady = true; });
  }

  has(name) { return !!this.resolve(name); }
  names() { return Object.keys(this.lib); }

  /** The most particular effect there is for a name (`a.b.c`, then `a.b`, then `a`). */
  resolve(name) {
    let n = name;
    while (n) { if (this.lib[n]) return { name: n, def: this.lib[n] }; const i = n.lastIndexOf('.'); n = i > 0 ? n.slice(0, i) : ''; }
    return null;
  }
  layersOf(def, seen = 0) {
    const base = def.extends && seen < 8 ? this.layersOf(this.lib[def.extends] || {}, seen + 1) : [];
    return [...base, ...(def.layers || [])];
  }

  play(name, ctx = {}) {
    const R = this.resolve(name);
    const h = { name, pos: (ctx.pos || new THREE.Vector3()).clone(), dir: (ctx.dir || UP).clone().normalize(), normal: (ctx.normal || UP).clone(), t: 0, k: 1, alive: !!R, stopped: false, layers: [] };
    if (!R) return h;
    h.ctx = { power: 1, scale: 1, ...ctx };
    h.stop = () => { h.stopped = true; };
    for (const L of this.layersOf(R.def)) h.layers.push({ L, started: false, acc: 0, mesh: null });
    this.live.push(h);
    return h;
  }

  update(raw) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const h = this.live[i];
      h.t += raw;
      let busy = false;
      for (const s of h.layers) busy = this.step(h, s, raw) || busy;
      if (!busy) { for (const s of h.layers) s.mesh?.dispose(); this.live.splice(i, 1); h.alive = false; }
    }
    this.add.update(raw); this.alpha.update(raw);
    for (const L of this.lights) {
      if (L.t >= L.dur) { L.l.intensity = 0; continue; }
      L.t += raw; const u = Math.min(1, L.t / L.dur);
      L.l.intensity = L.k * (u < 0.1 ? u / 0.1 : (1 - u) * (1 - u) / 0.81);
    }
    if (this.smearT > 0) { this.smearT -= raw; const A = this.game.post?.accum; if (A && !this.game.death?.active) A.amt = Math.max(0, this.smearAmt * this.smearT / this.smearDur); }
    this.flashK = Math.max(0, this.flashK - raw * this.flashDecay);
    this.flashEl.style.opacity = String(Math.min(0.85, this.flashK));
  }

  /** One layer, this frame. Returns whether it still has something to do. */
  step(h, s, raw) {
    const L = s.L, ctx = h.ctx, at = L.at || 0, lt = h.t - at;
    if (lt < 0) return !h.stopped;
    const held = L.dur === Infinity;
    const dur = held ? Infinity : L.dur ?? 0;
    if (!s.started) { s.started = true; this.start(h, s); }
    if (L.type === 'sprites' && L.rate) {
      if (!h.stopped && lt <= dur) {
        s.acc += raw * L.rate * (ctx.power ?? 1) * h.k;
        while (s.acc >= 1) { s.acc -= 1; this.emit(h, L, 1); }
        return true;
      }
      return false;
    }
    if (L.type === 'mesh' && s.mesh) {
      const m = s.mesh;
      if (held) {
        s.fade = h.stopped ? Math.max(0, (s.fade ?? 0) - raw * (L.out ?? 2)) : THREE.MathUtils.damp(s.fade ?? 0, 1, L.in ?? 6, raw); // (in: eased; out: a steady fade, gone in 1/out s)
        const t = (lt % (L.loop || 1e9)) / (L.loop || 1e9);
        this.placeMesh(h, s, t, s.fade * h.k);
        m.update(raw);
        return !(h.stopped && s.fade < 0.01);
      }
      const t = Math.min(1, lt / Math.max(1e-3, dur));
      this.placeMesh(h, s, t, h.k);
      m.update(raw);
      return t < 1;
    }
    return false;
  }

  start(h, s) {
    const L = s.L, ctx = h.ctx, g = this.game, P = ctx.power ?? 1;
    switch (L.type) {
      case 'sprites': if (!L.rate) this.emit(h, L, Math.round(rnd(L.count, ctx) * (L.powerCount === false ? 1 : P))); break;
      case 'mesh': if (this.meshReady) s.mesh = meshFx.make(L.mesh, { scene: g.scene, tint: color(L.tint ?? 'tint', ctx), lab: L.lab ?? 0, opacity: L.opacity ?? 1, renderOrder: L.order ?? 7 }); break;
      case 'flash': { _c.set(color(L.color ?? 'white', ctx)); this.flashEl.style.background = `#${_c.getHexString()}`; this.flashK = Math.max(this.flashK, (L.k ?? 0.5) * Math.min(1.4, P)); this.flashDecay = 1 / Math.max(0.05, L.dur ?? 0.4); break; }
      case 'light': {
        const S = this.lights.reduce((m, x) => ((x.dur - x.t) < (m.dur - m.t) ? x : m));
        S.l.color.set(color(L.color ?? 'tint', ctx)); S.l.distance = L.range ?? 10; S.k = (L.k ?? 30) * P; S.t = 0; S.dur = L.dur ?? 0.5;
        S.l.position.copy(h.pos).addScaledVector(UP, L.up ?? 0.5);
        break;
      }
      case 'shake': g.player && (g.player.shake = Math.max(g.player.shake || 0, (L.k ?? 0.3) * Math.min(1.5, P))); break;
      case 'hitstop': g.time?.pulse?.(`vfx${Math.random()}`, L.scale ?? 0.05, (L.dur ?? 0.06) * Math.min(1.5, P), { release: L.release ?? 0.08 }); break;
      case 'smear': if (g.post?.accum && !g.death?.active) { Object.assign(g.post.accum, { amt: L.amt ?? 0.6, zoom: L.zoom ?? 0.006, spin: L.spin ?? 0 }); this.smearAmt = L.amt ?? 0.6; this.smearT = this.smearDur = L.dur ?? 0.6; } break;
      case 'glyph': g.glyphs?.pop(L.kind || 'bang1', _v.copy(h.pos).addScaledVector(UP, L.up ?? 0.8), { color: color(L.color ?? 'tint', ctx), size: L.size ?? 0.5, burst: L.burst ?? true, ring: L.ring ?? false }); break;
      case 'sound': sfx[L.sfx]?.(...(L.args || [])); break;
      case 'fx': this.play(L.fx, { ...ctx, pos: _v.copy(h.pos).add(_a.fromArray(L.offset || [0, 0, 0])) }); break;
    }
  }

  placeMesh(h, s, t, k) {
    const L = s.L, m = s.mesh, P = h.ctx.power ?? 1;
    const sc = curve(L.scale, t) * (h.ctx.scale ?? 1) * (L.powerScale ? Math.sqrt(P) : 1);
    m.group.position.copy(h.pos).add(_a.fromArray(L.offset || [0, 0, 0]));
    if (Array.isArray(L.stretch)) m.group.scale.set(sc * L.stretch[0], sc * curve(L.stretch[1], t), sc * L.stretch[2]); else m.group.scale.setScalar(sc);
    m.group.rotation.y = (L.rot ?? 0) + (L.spin ?? 0) * h.t;
    if (L.face === 'dir') m.group.quaternion.setFromUnitVectors(UP, h.dir); // (a ring stood up along the blow)
    m.set(curve(L.k ?? [[0, 1], [1, 0]], t) * k * (L.kmul ?? 1));
  }

  emit(h, L, n) {
    const ctx = h.ctx, P = ctx.power ?? 1, pool = L.pool === 'alpha' ? this.alpha : this.add, sz = (L.powerSize === false ? 1 : Math.sqrt(P)) * (ctx.scale ?? 1);
    for (let i = 0; i < n; i++) {
      // where it is born
      const sp = L.spawn || 'point', r = rnd(L.r ?? 0, ctx) * (ctx.scale ?? 1);
      _v.copy(h.pos);
      if (L.offset) _v.add(_a.fromArray(L.offset));
      if (sp === 'sphere') _v.add(_a.randomDirection().multiplyScalar(r * Math.cbrt(Math.random())));
      else if (sp === 'shell') _v.add(_a.randomDirection().multiplyScalar(r));
      else if (sp === 'ring' || sp === 'disc') { const a = Math.random() * Math.PI * 2, rr = sp === 'ring' ? r : r * Math.sqrt(Math.random()); _v.x += Math.cos(a) * rr; _v.z += Math.sin(a) * rr; }
      else if (sp === 'column') { const a = Math.random() * Math.PI * 2; _v.x += Math.cos(a) * r; _v.z += Math.sin(a) * r; _v.y += Math.random() * rnd(L.height ?? 2, ctx); }
      // which way it goes
      const dm = L.dir || 'sphere', speed = rnd(L.speed ?? 0, ctx) * (L.powerSpeed ? Math.sqrt(P) : 1);
      if (dm === 'sphere') _d.randomDirection();
      else if (dm === 'up') _d.set(0, 1, 0);
      else if (dm === 'out') _d.subVectors(_v, h.pos).setY(L.lift ?? 0).normalize();
      else if (dm === 'in') _d.subVectors(h.pos, _v).normalize();
      else if (dm === 'swirl') { _b.subVectors(_v, h.pos).setY(0); _d.set(-_b.z, 0, _b.x).normalize().addScaledVector(UP, L.lift ?? 0.5).normalize(); }
      else { // 'cone' round the blow's direction ('dir'), or the surface's ('normal'), or up
        const axis = L.axis === 'normal' ? h.normal : L.axis === 'up' ? UP : h.dir;
        const c = THREE.MathUtils.degToRad(L.cone ?? 35), u = Math.cos(c) + Math.random() * (1 - Math.cos(c)), ph = Math.random() * Math.PI * 2, sq = Math.sqrt(1 - u * u);
        _a.set(Math.abs(axis.y) < 0.95 ? 0 : 1, Math.abs(axis.y) < 0.95 ? 1 : 0, 0).cross(axis).normalize(); _b.crossVectors(axis, _a);
        _d.copy(axis).multiplyScalar(u).addScaledVector(_a, Math.cos(ph) * sq).addScaledVector(_b, Math.sin(ph) * sq);
      }
      const vel = _a.copy(_d).multiplyScalar(speed);
      if (L.inherit && ctx.vel) vel.addScaledVector(ctx.vel, L.inherit);
      const size = rnd(L.size ?? 0.2, ctx) * sz;
      pool.emit({
        pos: _v, vel, life: rnd(L.life ?? 0.6, ctx), delay: rnd(L.delay ?? 0, ctx),
        size, sizeEnd: L.sizeEnd !== undefined ? rnd(L.sizeEnd, ctx) * sz : size,
        color: color(L.color, ctx), colorEnd: L.colorEnd !== undefined ? color(L.colorEnd, ctx) : undefined,
        alpha: rnd(L.alpha ?? 1, ctx), alphaEnd: rnd(L.alphaEnd ?? 0, ctx),
        shape: L.shape || 'soft', rot: L.rot !== undefined ? rnd(L.rot, ctx) : undefined, spin: rnd(L.spin ?? 0, ctx),
        stretch: rnd(L.stretch ?? 0, ctx), drag: rnd(L.drag ?? 0, ctx), gravity: rnd(L.gravity ?? 0, ctx),
        floor: L.floor === 'ground' ? (ctx.floor ?? h.pos.y - 0.02) : undefined, twinkle: rnd(L.twinkle ?? 0, ctx), grow: rnd(L.grow ?? 0, ctx),
      });
    }
  }
}
