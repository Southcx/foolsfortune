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
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { zoneOf } from './zones.js';

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
    this.scanT = 0;
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
    this.proxies = this.proxies.filter((l) => { let p = l; while (p.parent) p = p.parent; return p === scene; });
  }

  /** Is the lamp itself, and everything it hangs from, meant to be shown? */
  shown(l) {
    if (!l.userData.wants()) return false;
    for (let p = l.parent; p; p = p.parent) if (!p.visible) return false;
    return true;
  }

  update(dt) {
    this.scanT -= dt;
    if (this.scanT <= 0) { this.scanT = 1; this.scan(); }
    const cam = this.game.camera.position, zones = this.game.zones;
    // score every lamp
    const cand = [];
    for (const l of this.proxies) {
      if (l.intensity <= 0.001 || !this.shown(l)) continue;
      l.getWorldPosition(_p);
      if (zones && !zones.visibleAt(_p)) continue;
      // a lamp lights only its own room: it casts no shadow, so a lamp in another room (the basement, seen through the hole in the
      // workshop's floor) would light this one through its floor. Only the lamps of the room the camera is in are lent a light.
      if (zones?.enabled && zones.current != null) { const z = zoneOf(_p); if (z !== null && z !== zones.current) continue; }
      const range = l.distance > 0 ? l.distance : 40, d = _p.distanceTo(cam);
      if (d > range + 30) continue;
      const f = Math.max(4, range * 0.45);
      cand.push({ l, s: l.intensity / (1 + (d / f) * (d / f)), pos: _p.clone() });
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
    const byLight = new Map(best.map((c) => [c.l, c.pos]));
    for (const s of this.slots) {
      const l = s.l, p = s.proxy;
      if (!p) { l.intensity = 0; continue; }
      s.k = Math.min(1, s.k + dt * 8); // (a lamp coming into the budget fades up: about an eighth of a second)
      l.position.copy(byLight.get(p));
      l.color.copy(p.color);
      l.intensity = p.intensity * s.k;
      l.distance = p.distance; l.decay = p.decay;
    }
  }

  /** For the profiler: how many lamps there are, and which are lit now. */
  stats() { return { lamps: this.proxies.length, lit: this.slots.filter((s) => s.proxy).length, slots: this.slots.length }; }
}
