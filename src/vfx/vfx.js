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
//   decal     a picture laid on the ground (or stood to the camera), turning: the spell circles (src/assets/vfx/tex/)
//   flash     the screen washes to a colour and back (capped: a flash, never a flicker)
//   light     a lamp that blooms and fades (one of a few, the light budget lends them as it lends any lamp)
//   shake     the camera's shake      hitstop  the world held a moment      smear  the PS2 frame feedback (render/glow.js)
//   glyph     a mark (vfx/glyphs.js)   sound  an sfx method by name (audio: Wanda's)   fx  another effect, by name
// A layer's numbers can be a number, a range [min, max] picked per particle, or a key into the context (`'tint'`); colours can be
// hex, 'tint' (the caller's), 'labradorite' (a colour of the labradorite's flash) or 'gold' / 'lach' / 'white'. `power` (the context's)
// scales counts and sizes, so one effect serves a tap and a full-strength blow. `throughWalls` (the context's) draws its particles,
// decals and glyphs over the world instead of behind its walls (a mark revealed: vfx/glyphs.js; off, an effect is hidden by walls).
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
import { hasTag } from '../core/tags.js';
import { Trail } from './trail.js';
import { meshFx } from './meshfx.js';
import { LIBRARY } from './library.js';
import { sfx } from '../audio/sfx.js';
import { LAB_GLSL, mindTime, mindTick } from './labradorite.js';

// the textures a decal can wear (src/assets/vfx/tex/*.png, by file name: the spell circles the owner's wife drew among them)
const TEX_SRC = Object.fromEntries(Object.entries(import.meta.glob('../assets/vfx/tex/*.png', { query: '?b64', import: 'default', eager: true }))
  .map(([f, b64]) => [f.split('/').pop().replace(/\.png$/, ''), b64]));
const TEX = {};
export function vfxTexture(name) {
  if (TEX[name]) return TEX[name];
  if (!TEX_SRC[name]) return null;
  const t = new THREE.TextureLoader().load(`data:image/png;base64,${TEX_SRC[name]}`);
  t.colorSpace = THREE.NoColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return (TEX[name] = t);
}
export const vfxTextureNames = () => Object.keys(TEX_SRC);
const DECAL_V = 'varying vec2 vUv; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }';
const DECAL_F = `uniform sampler2D uMap; uniform vec3 uTint; uniform float uK, uLabradorite, uGlow;
varying vec2 vUv; varying vec3 vW;
${LAB_GLSL}
void main() {
  float a = texture2D(uMap, vUv).a * uK;
  if (a < 0.003) discard;
  vec3 c = mix(uTint, labSoft(labPhase(vW, normalize(cameraPosition - vW)) + length(vUv - 0.5) * 1.5) * 1.3, uLabradorite) * uGlow;
  gl_FragColor = vec4(c * a, a);
}`;
let _quad = null;

const NAMED = { gold: 0xffd76a, lach: 0xb49be6, white: 0xffffff, ember: 0xff9a5c, blue: 0x7fb2ff, ink: 0x140c1e };
// (the labradorite's flash, as hex: the stone's palette in vfx/labradorite.js, for particles that take one colour each)
const LAB = [0x6638d1, 0x384cf2, 0x2480fa, 0x1ab2db, 0x38c78c, 0xebc252, 0xe07542];
const rnd = (v, ctx) => (Array.isArray(v) ? v[0] + Math.random() * (v[1] - v[0]) : typeof v === 'string' ? ctx[v] ?? 0 : v ?? 0);
const _v = new THREE.Vector3(), _d = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);
// (how a cause is struck, and what a kind is made of: the hit's name is built from them)
const SLASH = /cut|slice|slash|cleave|rend|sunder|blade|zandatsu|stinger/;
const SHOT = /shot|charged|ricochet|homing|bolt|spark|slicer/;
export const MATERIALS = ['clay', 'crystal', 'jelly', 'wood', 'stone', 'metal']; // (the material tags a hit reads: tags.js)
const MATERIAL = { pot: 'clay', jar: 'clay', urn: 'clay', vase: 'clay', lantern: 'clay', pitcher: 'clay', bowl: 'clay', clapper: 'clay', crate: 'wood', slipjelly: 'jelly', jelly: 'jelly', crystal: 'crystal' };
const TOOL_TINT = { blunt: 0xffd76a, slash: 0xfff1dc, shot: 0xffb27a };

function color(v, ctx) {
  if (v === undefined || v === null) return 0xffffff;
  if (v.isColor) return v.getHex();
  if (Array.isArray(v)) return color(v[Math.floor(Math.random() * v.length)], ctx);
  if (v === 'tint') return ctx.tint === undefined ? 0xffffff : color(ctx.tint, ctx);
  if (v === 'tip') return ctx.tip === undefined ? color('tint', ctx) : color(ctx.tip, ctx); // (a swing's hot end)
  if (v === 'labradorite') return LAB[Math.floor(Math.random() * LAB.length)];
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

/** A BUDGET: a bucket that fills at `rate` a second up to `cap`; asking for some gives back the part there is (0..1). Prior art: the
 *  token bucket of network traffic shaping, and the particle and screen-effect budgets of every console engine (a fight full of hits
 *  stays legible: the tenth flash in a second is a whisper, not a tenth wash). */
class Budget {
  constructor(rate, cap) { this.rate = rate; this.cap = cap; this.v = cap; }
  fill(raw) { this.v = Math.min(this.cap, this.v + raw * this.rate); }
  take(want) { if (want <= 0) return 1; const got = Math.min(want, Math.max(0, this.v)); this.v -= got; return got / want; }
}
// (what a second of combat may spend: particles, flash strength, shake strength, seconds of hitstop. A cinematic, which owns the screen,
// is not counted: `ctx.cine`, set by the sequences.)
export const BUDGETS = { sprites: [5000, 3500], flash: [0.9, 1.2], shake: [1.2, 1.0], hitstop: [0.22, 0.2] };

export class Vfx {
  constructor(game) {
    this.game = game;
    this.add = new Sprites(game.scene, { additive: true, max: 16384 });
    this.alpha = new Sprites(game.scene, { additive: false, max: 16384 }); // (the old particles' alpha and foam emit here too: Phase 2)
    this.live = [];
    this.lib = LIBRARY;
    this.lights = Array.from({ length: 3 }, () => { const l = new THREE.PointLight(0xffffff, 0, 10, 1.6); l.userData.moodExempt = true; game.scene.add(l); return { l, t: 0, dur: 0, k: 0 }; });
    this.flashEl = Object.assign(document.createElement('div'), { id: 'vfxflash' });
    this.flashEl.style.cssText = 'position:fixed;inset:0;opacity:0;pointer-events:none;z-index:9;mix-blend-mode:screen';
    document.body.appendChild(this.flashEl);
    this.flashK = 0; this.flashDecay = 2;
    this.budget = Object.fromEntries(Object.entries(BUDGETS).map(([k, [r, c]]) => [k, new Budget(r, c)]));
    if (game.fx) game.fx.vfx = this; // (the old particles hand their named bursts to the library as they are folded in: Phase 2)
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

  /** A SWING: a held look for something that sweeps through the air (a blade, a fist, a thrown thing), built from the library like any
   *  effect: its `trail` layers are ribbons between the two ends pushed each frame (`span` [from, to] along base->tip: a hot core near the
   *  tip, a wide afterglow behind), and its `sprites` layers with `perM` are shed along the way, so many per metre the tip travels
   *  (`along: 'tip'` at the tip, `'blade'` anywhere on it), carrying some of its speed (`inherit`).
   *    const sw = game.vfx.swing('swing.cutlass', { tint, tip })   sw.push(base, tip)   sw.gap()   sw.power = 2   sw.setColors(a, b)
   *    game.vfx.swing('swing.brush').follow((a, b) => striking && (model.headSegment(a, b), true))   (or it asks, every frame)
   *  `update` is the player's (a tool need not call it). Prior art: Soul Calibur's and DMC's ribbons, Monster Hunter's weapon trails
   *  with their sparks, Kingdom Hearts' keyblade trail shedding motes. */
  swing(name, ctx = {}) {
    const R = this.resolve(name), g = this.game;
    const sw = { name, ctx: { power: 1, scale: 1, tint: 0xffffff, ...ctx }, trails: [], shed: [], last: null, lastB: null, power: 1, alive: true };
    for (const L of R ? this.layersOf(R.def) : [{ type: 'trail' }]) {
      if (L.type === 'trail') {
        const t = new Trail(g.scene, { life: L.life ?? 0.3, max: L.max ?? 48, color: color(L.color ?? 'tint', sw.ctx), tip: color(L.tip ?? 'tip', sw.ctx) || 0xffffff, core: L.core ?? 1, fade: L.fade ?? 1.6, k: L.k ?? 1 });
        sw.trails.push({ L, t });
      } else if (L.type === 'sprites' && L.perM) sw.shed.push({ L, acc: 0 });
    }
    const A = new THREE.Vector3(), B = new THREE.Vector3(), V = new THREE.Vector3();
    sw.push = (base, tip) => {
      for (const { L, t } of sw.trails) { const sp = L.span || [0, 1]; t.push(A.lerpVectors(base, tip, sp[0]), B.lerpVectors(base, tip, sp[1])); }
      if (sw.last && sw.shed.length) {
        const d = sw.last.distanceTo(tip), raw = Math.max(1 / 240, g.rawDt || 1 / 60);
        V.subVectors(tip, sw.last).divideScalar(raw);
        for (const s of sw.shed) {
          s.acc += d * s.L.perM * sw.power * (sw.ctx.power ?? 1);
          while (s.acc >= 1) {
            s.acc -= 1;
            const u = Math.random(), w = s.L.along === 'blade' ? Math.random() : 1;
            const p = A.lerpVectors(sw.lastB, sw.last, w).lerp(B.lerpVectors(base, tip, w), u);
            this.emit({ pos: p, dir: V.lengthSq() > 1e-6 ? _b.copy(V).normalize() : UP, normal: UP, ctx: { ...sw.ctx, vel: V } }, s.L, 1);
          }
        }
      }
      (sw.last ||= new THREE.Vector3()).copy(tip); (sw.lastB ||= new THREE.Vector3()).copy(base);
    };
    sw.gap = () => { for (const { t } of sw.trails) t.gap(); sw.last = null; };
    sw.setColors = (a, b) => { sw.ctx.tint = a; sw.ctx.tip = b; for (const { L, t } of sw.trails) t.setColors(color(L.color ?? 'tint', sw.ctx), color(L.tip ?? 'tip', sw.ctx) || 0xffffff); };
    sw.update = () => {}; // (the player's: see update)
    // (or it follows on its own: `fn(a, b)` sets the two ends and returns true while the thing is striking, false between: a tool says
    // once, where it is built, where its striking part is, and the player asks every frame, after the pose)
    const FA = new THREE.Vector3(), FB = new THREE.Vector3();
    sw.follow = (fn) => { sw.fn = fn; return sw; };
    sw.tick = () => { if (!sw.fn) return; if (sw.fn(FA, FB)) sw.push(FA, FB); else if (sw.last) sw.gap(); };
    sw.clear = () => { for (const { t } of sw.trails) t.clear(); sw.last = null; };
    sw.stop = () => { sw.alive = false; for (const { t } of sw.trails) { t.mesh.parent?.remove(t.mesh); t.geo.dispose(); t.mat.dispose(); } this.swings = this.swings.filter((x) => x !== sw); };
    (this.swings ||= []).push(sw);
    return sw;
  }

  /** A blow landed: its effect from what struck (the cause) and what was struck (its kind), most particular first:
   *  hit.<blunt|slash|shot>.<clay|crystal|jelly|...>.kill -> ... -> hit. Called by creatures.strike, breakables.damage, clappers.hit.
   *  What it is made of is a TAG on the thing (tags.js: one of MATERIALS, BotW's "what it is made of, not what it is"); without one, a
   *  guess from its kind. `type` (a damage type: impact, ego, influence, illusion, delirium) lays its damage look over the hit. */
  hit({ ent, kind = '', cause = 'shot', point, dir, power = 1, kill = false, tint, type }) {
    if (!point) return null;
    const tool = SLASH.test(cause) ? 'slash' : SHOT.test(cause) ? 'shot' : 'blunt';
    const mat = (ent && MATERIALS.find((m) => hasTag(ent, m))) || MATERIAL[kind] || (/jelly/.test(kind) ? 'jelly' : /crystal|shard/.test(kind) ? 'crystal' : 'clay');
    const name = `hit.${tool}.${mat}${kill ? '.kill' : ''}`;
    const ctx = { pos: point, dir: dir ? _d.copy(dir).negate() : UP, power: THREE.MathUtils.clamp(power, 0.4, 2.5), tint: tint ?? TOOL_TINT[tool], floor: point.y - 1.5 };
    if (type) this.play(`damage.${type}`, ctx); // (what the blow is made of, over what struck what: the damage looks)
    return this.play(name, ctx);
  }

  update(raw) {
    for (const B of Object.values(this.budget)) B.fill(raw);
    for (let i = this.live.length - 1; i >= 0; i--) {
      const h = this.live[i];
      h.t += raw;
      let busy = false;
      for (const s of h.layers) busy = this.step(h, s, raw) || busy;
      if (!busy) { for (const s of h.layers) s.mesh?.dispose(); this.live.splice(i, 1); h.alive = false; }
    }
    for (const sw of this.swings || []) { sw.tick(); for (const { t } of sw.trails) t.update(raw); }
    this.add.update(raw); this.alpha.update(raw); this.xray?.add.update(raw); this.xray?.alpha.update(raw);
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
    if ((L.type === 'mesh' || L.type === 'decal') && s.mesh) {
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

  /** The pools an effect seen through walls draws in (`ctx.throughWalls`), made the first time one asks: the same program as the
   *  others, their depth test off (a state), drawn after the world's own transparent things. */
  xrayPool(alpha) {
    if (!this.xray) {
      const mk = (additive) => { const P = new Sprites(this.game.scene, { additive, max: 2048, renderOrder: additive ? 27 : 26 }); P.mat.depthTest = false; return P; };
      this.xray = { add: mk(true), alpha: mk(false) };
    }
    return alpha ? this.xray.alpha : this.xray.add;
  }

  /** How much of `want` the budget allows (all of it in a cinematic). */
  spend(kind, want, ctx) { return ctx?.cine ? 1 : this.budget[kind].take(want); }

  start(h, s) {
    const L = s.L, ctx = h.ctx, g = this.game, P = ctx.power ?? 1;
    switch (L.type) {
      case 'sprites': if (!L.rate) this.emit(h, L, Math.round(rnd(L.count, ctx) * (L.powerCount === false ? 1 : P))); break;
      case 'mesh': if (this.meshReady) s.mesh = meshFx.make(L.mesh, { scene: g.scene, tint: color(L.tint ?? 'tint', ctx), labradorite: L.labradorite ?? 0, opacity: L.opacity ?? 1, renderOrder: L.order ?? 7 }); break;
      case 'decal': {
        const map = vfxTexture(L.tex); if (!map) break;
        const u = { uMap: { value: map }, uTint: { value: new THREE.Color(color(L.tint ?? 'tint', ctx)) }, uK: { value: 0 }, uLabradorite: { value: L.labradorite ?? 0 }, uGlow: { value: L.glow ?? 1.4 }, uMindT: mindTime };
        const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: DECAL_V, fragmentShader: DECAL_F, transparent: true, depthWrite: false, depthTest: !ctx.throughWalls, side: THREE.DoubleSide, fog: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation });
        const m = new THREE.Mesh(_quad ||= new THREE.PlaneGeometry(1, 1), mat);
        m.renderOrder = L.order ?? 4; m.frustumCulled = false; m.userData.moodExempt = true; m.visible = false;
        g.scene.add(m);
        s.mesh = { group: m, u, set: (k) => { u.uK.value = Math.max(0, k); m.visible = k > 0.002; }, update: () => mindTick(), dispose: () => { m.parent?.remove(m); mat.dispose(); } };
        break;
      }
      case 'flash': { const k = (L.k ?? 0.5) * Math.min(1.4, P), f = this.spend('flash', k, ctx); if (f < 0.1) break; _c.set(color(L.color ?? 'white', ctx)); this.flashEl.style.background = `#${_c.getHexString()}`; this.flashK = Math.max(this.flashK, k * f); this.flashDecay = 1 / Math.max(0.05, L.dur ?? 0.4); break; }
      case 'light': {
        const S = this.lights.reduce((m, x) => ((x.dur - x.t) < (m.dur - m.t) ? x : m));
        S.l.color.set(color(L.color ?? 'tint', ctx)); S.l.distance = L.range ?? 10; S.k = (L.k ?? 30) * P; S.t = 0; S.dur = L.dur ?? 0.5;
        S.l.position.copy(h.pos).addScaledVector(UP, L.up ?? 0.5);
        break;
      }
      case 'shake': { const k = (L.k ?? 0.3) * Math.min(1.5, P); g.player && (g.player.shake = Math.max(g.player.shake || 0, k * this.spend('shake', k, ctx))); break; }
      case 'hitstop': { const d = (L.dur ?? 0.06) * Math.min(1.5, P) * this.spend('hitstop', (L.dur ?? 0.06) * Math.min(1.5, P), ctx); if (d > 0.012) g.time?.pulse?.(`vfx${Math.random()}`, L.scale ?? 0.05, d, { release: L.release ?? 0.08 }); break; }
      case 'smear': if (g.post?.accum && !g.death?.active) { Object.assign(g.post.accum, { amt: L.amt ?? 0.6, zoom: L.zoom ?? 0.006, spin: L.spin ?? 0 }); this.smearAmt = L.amt ?? 0.6; this.smearT = this.smearDur = L.dur ?? 0.6; } break;
      case 'glyph': g.glyphs?.pop(L.kind || 'bang1', _v.copy(h.pos).addScaledVector(UP, L.up ?? 0.8), { color: color(L.color ?? 'tint', ctx), size: L.size ?? 0.5, burst: L.burst ?? true, ring: L.ring ?? false, throughWalls: ctx.throughWalls ?? null }); break;
      case 'sound': sfx[L.sfx]?.(...(L.args || [])); break;
      case 'fx': this.play(L.fx, { ...ctx, pos: _v.copy(h.pos).add(_a.fromArray(L.offset || [0, 0, 0])) }); break;
    }
  }

  placeMesh(h, s, t, k) {
    const L = s.L, m = s.mesh, P = h.ctx.power ?? 1;
    const sc = curve(L.scale, t) * (h.ctx.scale ?? 1) * (L.powerScale ? Math.sqrt(P) : 1);
    m.group.position.copy(h.pos).add(_a.fromArray(L.offset || [0, 0, 0]));
    if (Array.isArray(L.stretch)) m.group.scale.set(sc * L.stretch[0], sc * curve(L.stretch[1], t), sc * L.stretch[2]); else m.group.scale.setScalar(sc);
    if ((L.tint ?? 'tint') === 'tint' && h.ctx.tint !== undefined) m.u.uTint.value.set(color('tint', h.ctx)); // (a held effect follows its caller's colour)
    if (L.type === 'decal') { // (flat on the ground by default, turning about its centre; or stood facing the camera)
      if (L.face === 'camera') { m.group.quaternion.copy(this.game.camera.quaternion); m.group.rotateZ((L.rot ?? 0) + (L.spin ?? 0) * h.t); }
      else m.group.rotation.set(-Math.PI / 2, 0, (L.rot ?? 0) + (L.spin ?? 0) * h.t);
      m.group.scale.set(sc, sc, sc);
    } else {
      m.group.rotation.y = (L.rot ?? 0) + (L.spin ?? 0) * h.t;
      if (L.face === 'dir') m.group.quaternion.setFromUnitVectors(UP, h.dir); // (a ring stood up along the blow)
    }
    m.set(curve(L.k ?? [[0, 1], [1, 0]], t) * k * (L.kmul ?? 1));
  }

  emit(h, L, n) {
    if (!h.ctx?.cine && n > 0) { const f = this.budget.sprites.take(n); n = f >= 1 ? n : Math.floor(n * f + Math.random()); } // (the particle budget: a busy second thins out)
    const ctx = h.ctx, P = ctx.power ?? 1, pool = ctx.throughWalls ? this.xrayPool(L.pool === 'alpha') : L.pool === 'alpha' ? this.alpha : this.add, sz = (L.powerSize === false ? 1 : Math.sqrt(P)) * (ctx.scale ?? 1);
    for (let i = 0; i < n; i++) {
      // where it is born
      const sp = L.spawn || 'point', r = rnd(L.r ?? 0, ctx) * (ctx.scale ?? 1);
      _v.copy(h.pos);
      if (L.offset) _v.addScaledVector(_a.fromArray(L.offset), ctx.scale ?? 1); // (in the effect's scale: an aura's 'feet' are its creature's)
      if (sp === 'sphere') _v.add(_a.randomDirection().multiplyScalar(r * Math.cbrt(Math.random())));
      else if (sp === 'shell') _v.add(_a.randomDirection().multiplyScalar(r));
      else if (sp === 'ring' || sp === 'disc') { const a = Math.random() * Math.PI * 2, rr = sp === 'ring' ? r : r * Math.sqrt(Math.random()); _v.x += Math.cos(a) * rr; _v.z += Math.sin(a) * rr; }
      else if (sp === 'line' && ctx.from && ctx.to) { _v.lerpVectors(ctx.from, ctx.to, Math.random()); if (r) _v.add(_a.randomDirection().multiplyScalar(r * Math.random())); } // (along a cut: from -> to)
      else if (sp === 'column') { const a = Math.random() * Math.PI * 2; _v.x += Math.cos(a) * r; _v.z += Math.sin(a) * r; _v.y += Math.random() * rnd(L.height ?? 2, ctx) * (ctx.scale ?? 1); }
      // which way it goes
      const dm = L.dir || 'sphere', speed = rnd(L.speed ?? 0, ctx) * (L.powerSpeed ? Math.sqrt(P) : 1);
      if (dm === 'sphere') _d.randomDirection();
      else if (dm === 'up') _d.set(0, 1, 0);
      else if (dm === 'line' && ctx.from && ctx.to) _d.subVectors(ctx.to, ctx.from).normalize().multiplyScalar(Math.random() < 0.5 ? 1 : -1);
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
