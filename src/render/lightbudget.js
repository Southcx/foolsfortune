// ---------------------------------------------------------------------------------------
// LIGHT BUDGET: a fixed number of point lights, lent each frame to the lamps that matter.
//
// three.js is a forward renderer: every point light in the scene is a loop iteration in the fragment shader of every lit material, and
// the number of lights is compiled into each shader. With the whole world in one scene that was 63 lamps (the Weir's, the basement's,
// the kilns'...) paid for by every pixel of every room, and a recompile of every material whenever one was added. Consoles of the sixth
// generation had the same problem in hardware (the PS2's VU1 lit a handful of lights per object; GameCube's GX eight per draw) and solved
// it the same way: a small budget of lights, given each frame to the ones nearest what is being drawn.
//
// Every PointLight in the scene stays a real object that its owner moves, dims and colours as before (the kiln's flicker, the Weir's
// lamp, the chest ceremony's flash), but it is a PROXY: it never lights anything itself. Each frame the proxies are scored (intensity,
// fallen off with distance to the camera, zero if their area is not being drawn) and the best N are copied onto N pooled lights, which
// are the only point lights three.js ever sees. N never changes, so no shader is ever rebuilt; a lamp that comes into the budget fades up
// over a few frames instead of popping.
//
//   game.lights = new LightBudget(game, { slots: 8 });   game.lights.update(rawDt)   (after everything has set its lights, before the draw)
//   Scored ten times a real second; the scene walked for new lamps a slice a frame, once a second.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { wholeOf } from './zones.js';

const SCORE_EVERY = 0.1; // (real s between scorings)
const WALK = 800; // (objects the scan looks at a frame)

const _p = new THREE.Vector3();

export class LightBudget {
  constructor(game, { slots = 8 } = {}) {
    this.game = game;
    this.slots = [];
    for (let i = 0; i < slots; i++) {
      const l = new THREE.PointLight(0xffffff, 0, 1, 2);
      l.userData.pooled = true; l.userData.moodExempt = true;
      game.scene.add(l);
      this.slots.push({ l, proxy: null, k: 0 });
    }
    this.proxies = [];
    this.scanT = 0.5; // (half a second out of step with the shading pass, present.js: the two whole-scene scans never share a frame)
    this.scan();
  }

  /** Make a lamp a proxy: it keeps every property its owner sets, but three.js no longer counts it as a light. */
  adopt(light) {
    const u = light.userData;
    if (u.pooled || u.proxy) return;
    u.proxy = true;
    let want = light.visible;
    Object.defineProperty(light, 'visible', { configurable: true, get: () => false, set: (v) => { want = v; } });
    u.wants = () => want;
    this.proxies.push(light);
  }

  /** Find lamps added since the last look (rooms, fx, a chest ceremony...), and forget the ones taken out of the scene. */
  scan() {
    const scene = this.game.scene;
    scene.traverse((o) => { if (o.isPointLight || o.isSpotLight) this.adopt(o); });
    this.forget();
  }
  forget() { const scene = this.game.scene; this.proxies = this.proxies.filter((l) => { let p = l; while (p.parent) p = p.parent; return p === scene; }); }
  /** The scan walked a slice a frame, once a real second (the whole scene in one frame was a 4 ms hitch: the deep clean's profile). */
  walkStep(dt) {
    if (!this.walk) { this.scanT -= dt; if (this.scanT > 0) return; this.scanT = 1; this.walk = [this.game.scene]; }
    for (let n = 0; n < WALK && this.walk.length; n++) { const o = this.walk.pop(); if (o.isPointLight || o.isSpotLight) this.adopt(o); for (const c of o.children) this.walk.push(c); }
    if (!this.walk.length) { this.walk = null; this.forget(); }
  }

  /** Is the lamp itself, and everything it hangs from, meant to be shown? */
  shown(l) {
    if (!l.userData.wants()) return false;
    for (let p = l.parent; p; p = p.parent) if (!p.visible) return false;
    return true;
  }

  update(dt) {
    this.walkStep(dt);
    // the lamps scored ten times a real second; the lit ones follow their owners every frame (a moving lamp, a flicker)
    if ((this.scoreT = (this.scoreT ?? 0) - dt) <= 0) { this.scoreT = SCORE_EVERY; this.score(); }
    for (const s of this.slots) {
      const l = s.l, p = s.proxy;
      if (!p || p.intensity <= 0.001 || !this.shown(p)) { l.intensity = 0; continue; }
      s.k = Math.min(1, s.k + dt * 8); // (a lamp coming into the budget fades up: about an eighth of a second)
      p.getWorldPosition(l.position);
      l.color.copy(p.color);
      l.intensity = p.intensity * s.k;
      l.distance = p.distance; l.decay = p.decay;
    }
  }

  /** Which lamps get the slots: every lamp scored by its strength fallen off with distance to the camera. */
  score() {
    const cam = this.game.camera.position, zones = this.game.zones;
    // score every lamp
    const cand = [];
    for (const l of this.proxies) {
      if (l.intensity <= 0.001 || !this.shown(l)) continue;
      l.getWorldPosition(_p);
      if (zones && !zones.visibleAt(_p)) continue;
      // a lamp lights only its own room: it casts no shadow, so a lamp in another room (the basement, seen through the hole in the
      // workshop's floor) would light this one through its floor. Only the lamps of the ground the camera is on are lent a light (the
      // beach is part of the dunes, one ground open to the sky: zones.js wholeOf).
      if (zones?.enabled && zones.current != null) { const z = wholeOf(_p); if (z !== null && z !== wholeOf(cam)) continue; }
      const range = l.distance > 0 ? l.distance : 40, d = _p.distanceTo(cam);
      if (d > range + 30) continue;
      const f = Math.max(4, range * 0.45);
      cand.push({ l, s: l.intensity / (1 + (d / f) * (d / f)) });
    }
    cand.sort((a, b) => b.s - a.s);
    const best = cand.slice(0, this.slots.length);
    const keep = new Set(best.map((c) => c.l));
    // slots keep their lamp while it stays in the budget; the rest are free for newcomers
    for (const s of this.slots) if (s.proxy && !keep.has(s.proxy)) { s.proxy = null; s.k = 0; }
    const held = new Set(this.slots.map((s) => s.proxy).filter(Boolean));
    for (const c of best) {
      if (held.has(c.l)) continue;
      const s = this.slots.find((x) => !x.proxy);
      if (!s) break;
      s.proxy = c.l; s.k = 0;
    }
  }

  /** For the profiler: how many lamps there are, and which are lit now. */
  stats() { return { lamps: this.proxies.length, lit: this.slots.filter((s) => s.proxy).length, slots: this.slots.length }; }
}
