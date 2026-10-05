// ---------------------------------------------------------------------------------------
// BRUSH TECHNIQUES: what a drawing on the Celestial Brush's canvas does to the world. The Soul Brush ALTERS things rather than hurting
// them: most drawings write a property onto what they were drawn over (inscribe.js), and what happens next is the world's doing.
// The canvas is the screen, so a drawing is read against the view it was drawn over: a line acts on everything it crosses on the
// screen, a circle on everything inside it, a mark on everything under it; a mark over nothing acts on the Courier. Each is planned
// the moment it is recognised (what it will touch, what it costs) and RUN when the brush is put down and time comes back, as in Okami,
// where the painting takes when the brush lifts. Every drawing that is also a Magic Cat Academy mark (a stroke across or down, a V,
// a caret, a bolt) takes that mark off the clapperjars' sigil queues too (sigils.js).
//
//   —  across   STILL     what it crosses is held where it is (a pot in mid-air is a step); a clapperjar is rooted
//   |  down     BOUNCE    what it crosses springs back from whatever it meets
//   circle      MEND      Okami's Rejuvenation and Bloom: cracked pots mended with gold, wrecks rebuilt, a clapperjar in it befriended
//   bomb        EMBER     Okami's Cherry Bomb, as a property: the pots in it become ember pots (they burst when broken)
//   spiral      GALE      Okami's Galestorm: a gust the way the spiral ended; in the dunes the wind itself turns that way for a while
//   bolt        BOLT      Magic Cat Academy's lightning: a strike that stuns the clapperjars near it (and only cracks what it hits)
//   ^  caret    LIGHT     what is under it floats (a tenth of its gravity); over nothing, the Courier is lifted
//   V  vee      HEAVY     what is under it is five times as heavy; over nothing, the Courier dives (on the ground: a burst of slip)
//   heart       SOLACE    Magic Cat Academy's heart: every clapperjar in view forgets itself and dances; the god hand's jar is soothed
//   (other)     WASH      laid on the world as slip, where the strokes pass over surfaces (Splatoon's ink on anything)
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../../audio/sfx.js';
import { registered, hasTag } from '../../core/tags.js';
import { inside } from './gesture.js';
import { SIGIL_OF } from './sigils.js';
import { inscribe } from './inscribe.js';
import { stream } from '../../core/rng.js';
const simRand = stream('tools/soulbrush/techniques'); // (the simulation's chance: core/rng.js, the same twice)

export const TECHNIQUES = {
  still: { id: 'still', name: 'STILL', cost: 4 },
  bounce: { id: 'bounce', name: 'BOUNCE', cost: 3 },
  circle: { id: 'mend', name: 'MEND', cost: 5 },
  bomb: { id: 'ember', name: 'EMBER', cost: 4 },
  spiral: { id: 'gale', name: 'GALE', cost: 5 },
  bolt: { id: 'bolt', name: 'BOLT', cost: 6 },
  caret: { id: 'light', name: 'LIGHT', cost: 3 },
  vee: { id: 'heavy', name: 'HEAVY', cost: 3 },
  heart: { id: 'solace', name: 'SOLACE', cost: 6 },
};
/** The ink's tint when a drawing takes (the canvas's flash), by technique. */
export const TINT = { still: '#bfe6ff', bounce: '#9fe8a0', mend: '#f2c35a', ember: '#ff7a3a', gale: '#bfe6e0', bolt: '#d8c6ff', light: '#fff1c0', heavy: '#a07ad8', solace: '#ff9ab0', wash: '#e8ab86' };

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _s = new THREE.Sphere();
const UP = new THREE.Vector3(0, 1, 0);

/** The view a drawing was made over: the camera as it was, and the screen's size. */
export function viewOf(game, W, H) {
  const cam = game.camera.clone();
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return { cam, W, H, eye: cam.getWorldPosition(new THREE.Vector3()), fwd: cam.getWorldDirection(new THREE.Vector3()), rc: new THREE.Raycaster() };
}
const ray = (v, x, y) => { v.rc.setFromCamera(new THREE.Vector2((x / v.W) * 2 - 1, -(y / v.H) * 2 + 1), v.cam); return { o: v.rc.ray.origin.clone(), d: v.rc.ray.direction.clone() }; };
/** A point on the screen (px), and how far it is; null when behind the eye. */
function toScreen(v, p) {
  _v.copy(p).sub(v.eye);
  const z = _v.dot(v.fwd);
  if (z < 0.2) return null;
  _w.copy(p).project(v.cam);
  return { x: ((_w.x + 1) / 2) * v.W, y: ((1 - _w.y) / 2) * v.H, z };
}
/** A world radius as screen pixels at depth z. */
const pxOf = (v, r, z) => (r * v.H) / (2 * z * Math.tan((v.cam.fov * Math.PI) / 360));

/** Everything a drawing might touch, with where it is and how big. */
function things(g) {
  const out = [], B = g.breakables;
  const sphereOf = (ent) => {
    const m = ent.mesh;
    if (!m?.geometry) return null;
    if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere();
    m.updateMatrixWorld();
    return _s.copy(m.geometry.boundingSphere).applyMatrix4(m.matrixWorld);
  };
  for (const ent of B.items) {
    if (!ent.alive || ent.def?.trial || ent.def?.hang) continue;
    const t = ent.body.translation();
    out.push({ kind: 'pot', ent, pos: new THREE.Vector3(t.x, t.y + ent.P.height * 0.45, t.z), r: ent.P.rMax });
  }
  const seen = new Set();
  for (const ent of [...B.slices, ...(g.level?.dynamic || []).filter((e) => hasTag(e, 'pushable') || hasTag(e, 'liftable')), ...registered('liftable')]) {
    if (seen.has(ent) || !ent.body?.isValid?.()) continue;
    seen.add(ent);
    const sp = sphereOf(ent);
    if (sp) out.push({ kind: 'piece', ent, pos: sp.center.clone(), r: sp.radius });
  }
  for (const c of g.clappers?.list || []) if (c.alive) out.push({ kind: 'clapper', ent: c, pos: c.pos.clone().setY(c.pos.y + 0.35), r: 0.45 });
  return out;
}
/** The things a test on the screen picks out (within 30 m), nearest first. */
function picked(g, v, test, max = 30) {
  const out = [];
  for (const t of things(g)) {
    const s = toScreen(v, t.pos);
    if (!s || s.z > max) continue;
    if (test(s, pxOf(v, t.r, s.z))) out.push({ ...t, z: s.z });
  }
  return out.sort((a, b) => a.z - b.z);
}
/** The first solid surface under a screen point. */
function cast(g, v, x, y, max = 40, staticOnly = false) {
  const r = ray(v, x, y);
  const hit = g.physics.raycast(r.o, r.d, max, g.player.collider, undefined, (c) => !c.isSensor() && (!staticOnly || !c.parent()?.isDynamic()));
  return { ...r, hit };
}
const segDist = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy; const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0; return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); };
const inBox = (box, pad) => (s, r) => s.x > box.x0 - pad - r && s.x < box.x1 + pad + r && s.y > box.y0 - pad - r && s.y < box.y1 + pad + r;

export class BrushTechniques {
  constructor(tool) {
    this.tool = tool;
    this.live = []; // things with a life of their own (a bolt's afterglow)
    this.plungeWatch = false;
  }
  get game() { return this.tool.game; }

  /** A recognised drawing (or null: a wash) -> a plan { id, cost, empty, run() } for it, read against the view it was drawn over. */
  plan(rec, v) {
    if (!rec) return this.wash(v);
    const key = rec.name === 'line' ? (rec.sigil === '|' ? 'bounce' : 'still') : rec.name;
    const def = TECHNIQUES[key];
    if (!def) return null;
    const p = this[def.id](rec, v);
    if (!p) return null;
    const sigil = rec.sigil ? SIGIL_OF[rec.sigil] : null;
    // (a sigil mark is never empty: it is still a mark, even over nothing the brush can alter)
    if (p.empty && sigil && this.tool.sigils.heads(sigil)) { p.empty = false; p.run = () => 0; }
    const run = p.run;
    p.run = () => {
      const n = run() ?? 0;
      let s = null;
      if (sigil) { s = this.tool.sigils.pop(sigil); if (s.popped) this.game.events?.emit('sigil.pop', { sigil, popped: s.popped, cleared: s.cleared }); }
      this.game.events?.emit('brush.glyph', { technique: def.id, n, sigils: s?.popped || 0 });
    };
    return { id: def.id, name: def.name, cost: p.empty ? 0 : def.cost, ...p };
  }

  /** Write a property onto everything in a list (clapperjars answer in their own way: `jar`). */
  writeAll(list, prop, jar) {
    const g = this.game;
    let n = 0;
    for (const t of list) {
      if (t.kind === 'clapper') { if (t.ent.alive && jar) { jar(t.ent); n++; } continue; }
      if (inscribe(g, t.ent, prop)) { n++; g.breakables.instigate?.(t.ent, 'courier'); }
    }
    return n;
  }

  // ---------------------------------------------------------------- the techniques
  /** A line: everything it crosses on the screen. */
  crossed(rec, v) {
    const s0 = rec.strokes[0], a = s0[0], b = s0[s0.length - 1];
    return picked(this.game, v, (s, r) => segDist(s, a, b) <= 16 + r * 0.8);
  }

  still(rec, v) {
    const g = this.game, hits = this.crossed(rec, v);
    if (!hits.length) return { empty: true, run: () => 0 };
    return { run: () => { sfx.inkDab?.(1); return this.writeAll(hits, 'still', (c) => g.clappers.stun(c, 4, g.shells.glowOutline, g.shells.xray)); } };
  }

  bounce(rec, v) {
    const hits = this.crossed(rec, v).filter((t) => t.kind !== 'clapper');
    if (!hits.length) return { empty: true, run: () => 0 };
    return { run: () => { sfx.rise?.(); return this.writeAll(hits, 'bounce'); } };
  }

  mend(rec, v) {
    const g = this.game, poly = rec.poly || rec.points;
    const inCircle = (p) => { const s = toScreen(v, p); return s && s.z < 35 && inside(s, poly); };
    const pots = [...g.breakables.items].filter((e) => e.alive && (e.crackStage > 0 || e.cracks?.dark?.length) && inCircle(e.body.translation()));
    const wrecks = (g.breakables.wrecks || []).filter((w) => !w.claimed && inCircle(w.pos));
    const jars = (g.clappers?.list || []).filter((c) => c.alive && !c.ally && inCircle(c.pos.clone().setY(c.pos.y + 0.35)));
    const n = pots.length + wrecks.length + jars.length;
    if (!n) return { empty: true, run: () => 0 };
    return {
      run: () => {
        for (const e of pots) if (e.alive) { g.breakables.mend(e); const t = e.body.translation(); g.fx.glitter([new THREE.Vector3(t.x, t.y + 0.3, t.z)], new THREE.Vector3(t.x, t.y + 0.3, t.z), UP, new THREE.Color(0xf2b24a)); }
        for (const w of wrecks) if (g.breakables.wrecks.includes(w)) g.breakables.rebuild(w);
        for (const c of jars) if (c.alive && !c.ally) g.shells?.casters?.befriend(c);
        sfx.brushMend?.();
        return n;
      },
    };
  }

  ember(rec, v) {
    const g = this.game, R = rec.radius || rec.size / 2;
    const hits = picked(g, v, (s, r) => Math.hypot(s.x - rec.center.x, s.y - rec.center.y) <= R + r * 0.6).filter((t) => t.kind === 'pot' || t.kind === 'clapper');
    if (!hits.length) return { empty: true, run: () => 0 };
    return { run: () => { sfx.fuse?.(); return this.writeAll(hits, 'ember', (c) => g.clappers.scald(c, 0.45)); } };
  }

  gale(rec, v) {
    const g = this.game;
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(v.cam.quaternion), up = new THREE.Vector3(0, 1, 0).applyQuaternion(v.cam.quaternion);
    const len = Math.hypot(rec.dir.x, rec.dir.y) || 1;
    const dir = right.multiplyScalar(rec.dir.x / len).addScaledVector(up, -rec.dir.y / len).addScaledVector(v.fwd, 0.35);
    dir.y *= 0.5; dir.normalize();
    const strength = THREE.MathUtils.clamp(rec.size / 260, 0.6, 1.4);
    return {
      run: () => {
        const P = this.tool.P, from = P.pos.clone().setY(P.pos.y + 1.1);
        let n = 0;
        const reach = 16, cone = Math.cos(0.75);
        const kicks = [];
        g.physics.world.forEachRigidBody((b) => {
          if (!b.isDynamic() || g.physics.links.has(b.handle)) return;
          const t = b.translation(); _v.set(t.x - from.x, t.y - from.y, t.z - from.z);
          const d = _v.length(); if (d > reach || d < 0.1 || _v.normalize().dot(dir) < cone) return;
          kicks.push([b, d]);
        });
        // (the kicks after the walk, not inside it: nothing calls back into the world while the world is iterating)
        for (const [b, d] of kicks) {
          if (!b.isValid()) continue;
          const ent = b.numColliders() ? g.physics.entityOf(b.collider(0)) : null;
          if (ent?.type === 'player') continue;
          g.breakables.instigate(ent, 'courier');
          const k = 11 * strength * (1 - (d / reach) * 0.6) * b.mass();
          g.physics.kick(b, { x: dir.x * k, y: (dir.y + 0.35) * k, z: dir.z * k });
          n++;
        }
        for (const c of g.clappers?.list || []) {
          _v.subVectors(c.pos, from); const d = _v.length();
          if (!c.alive || d > reach || _v.normalize().dot(dir) < cone) continue;
          g.clappers.knock(c, dir.clone().multiplyScalar(10 * strength).setY(3.5)); n++;
        }
        if (!P.grounded) P.impulse(dir.clone().multiplyScalar(6 * strength).setY(Math.max(2, dir.y * 6)), 'gale');
        if (g.dunes?.active) g.dunes.gust(new THREE.Vector2(dir.x, dir.z).normalize(), 12);
        g.fx.pushWave(from, dir, reach, 38);
        sfx.gale?.();
        return n;
      },
    };
  }

  bolt(rec, v) {
    const g = this.game, c = cast(g, v, rec.center.x, rec.center.y, 45);
    const at = c.hit ? c.hit.point.clone() : c.o.clone().addScaledVector(c.d, 14);
    return {
      run: () => {
        let n = 0;
        this.lightning(at);
        for (const cl of g.clappers?.list || []) if (cl.alive && cl.pos.distanceTo(at) < 3.5) { g.clappers.stun(cl, 3.5, g.shells.glowOutline, g.shells.xray); n++; }
        // (the brush is no hammer of the gods: what the bolt strikes is cracked, not broken)
        for (const e of [...g.breakables.items]) {
          if (!e.alive || e.def?.trial) continue;
          const t = e.body.translation(), p = new THREE.Vector3(t.x, t.y + 0.3, t.z);
          if (p.distanceTo(at) < 1.6 && e.hp > 25) g.breakables.damage(e, 20, p, p.clone().sub(at).normalize(), 0.5, false, 'courier');
        }
        this.tool.P.shake = Math.max(this.tool.P.shake, 0.3);
        sfx.thunder?.(g.listenerDistance?.(at) ?? 0);
        return n;
      },
    };
  }

  /** A strike from the sky to a point: a jagged line, bright for a moment, and one flash (not a strobe). */
  lightning(at) {
    const g = this.game, pts = [], top = at.clone().add(new THREE.Vector3((simRand() - 0.5) * 6, 28, (simRand() - 0.5) * 6));
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = top.clone().lerp(at, u);
      if (i > 0 && i < N) p.add(new THREE.Vector3((simRand() - 0.5) * 1.6, 0, (simRand() - 0.5) * 1.6).multiplyScalar(1 - u * 0.6));
      pts.push(p);
    }
    const mk = (color, opacity) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); l.frustumCulled = false; l.renderOrder = 8; g.scene.add(l); return l; };
    this.live.push({ kind: 'bolt', parts: [mk(0xffffff, 1), mk(0xb892ff, 0.6)], t: 0 });
    if (g.fx.boomLight) { g.fx.boomLight.position.copy(at).y += 1.5; g.fx.boomLight.intensity = 110; g.fx.boomT = 0.22; }
    const c = new THREE.Color(0xd8c6ff);
    for (let i = 0; i < 30; i++) g.fx.add.emit({ pos: at, vel: new THREE.Vector3().randomDirection().multiplyScalar(2 + simRand() * 5).setY(simRand() * 5), life: 0.3 + simRand() * 0.3, size: 0.05, sizeEnd: 0.01, color: c, drag: 2, twinkle: 30 });
  }

  /** What a mark (^ or V) was drawn over: everything in its box, or nothing (then it is the Courier's). */
  under(rec, v) { return picked(this.game, v, inBox(rec.box, 12)); }

  light(rec, v) {
    const g = this.game, hits = this.under(rec, v);
    return {
      run: () => {
        const P = this.tool.P;
        if (hits.length) { const n = this.writeAll(hits, 'light', (c) => g.clappers.knock(c, new THREE.Vector3(0, 9, 0))); this.puff(hits[0].pos); sfx.rise?.(); return n; }
        P.vel.y = Math.max(P.vel.y, 0);
        P.impulse(new THREE.Vector3(0, 11, 0), 'rise');
        this.puff(P.pos); sfx.rise?.();
        return 0;
      },
    };
  }

  heavy(rec, v) {
    const g = this.game, hits = this.under(rec, v);
    return {
      run: () => {
        const P = this.tool.P;
        if (hits.length) { const n = this.writeAll(hits, 'heavy', (c) => { g.clappers.knock(c, new THREE.Vector3(0, -12, 0)); g.clappers.stun(c, 1.5, g.shells.glowOutline, g.shells.xray); }); sfx.brushSlam?.(0.5); return n; }
        if (!P.grounded) { P.vel.y = Math.min(P.vel.y, -24); this.plungeWatch = true; }
        else this.splash(P.pos, 1);
        sfx.brushSlam?.(0.8);
        return 0;
      },
    };
  }

  solace(rec, v) {
    const g = this.game;
    const jars = (g.clappers?.list || []).filter((c) => { if (!c.alive) return false; const s = toScreen(v, c.pos); return s && s.z < 18 && s.x > 0 && s.x < v.W && s.y > 0 && s.y < v.H; });
    const jar = g.god?.active && g.god.jar?.alive ? g.god.jar : null;
    if (!jars.length && !jar) return { empty: true, run: () => 0 };
    return {
      run: () => {
        for (const c of jars) {
          if (!c.alive) continue;
          c.state = 'dance'; c.twirl = 0; c.timer = 6; c.clapT = 0.3; c.clapRate = 10;
          g.glyphs?.pop('note', c.pos.clone().setY(c.pos.y + 1.1), { color: 0xff9ab0, size: 0.45, life: 1.4 });
        }
        if (jar) jar.hp = Math.min(jar.max, jar.hp + 25);
        sfx.solace?.();
        return jars.length;
      },
    };
  }

  /** Anything else: laid on the world as slip, where the strokes pass over surfaces. */
  wash(v) {
    const g = this.game, strokes = this.tool.canvas.pending(), dabs = [];
    for (const s of strokes) {
      let acc = 0, first = true;
      for (let i = 1; i < s.length && dabs.length < 160; i++) {
        acc += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
        if (acc < 16 && i < s.length - 1) continue;
        acc = 0;
        const c = cast(g, v, s[i].x, s[i].y, 35, true);
        if (!c.hit) { first = true; continue; }
        dabs.push({ p: c.hit.point, n: c.hit.normal, brk: first });
        first = false;
      }
    }
    if (!dabs.length) return null;
    const cost = Math.min(4, dabs.length * 0.12);
    return {
      id: 'wash', name: 'WASH', cost,
      run: () => {
        const paint = this.tool.paint;
        paint.gap();
        for (let i = 0; i < dabs.length; i++) {
          const d = dabs[i], nx = dabs[i + 1];
          if (d.brk) paint.gap();
          const dir = nx && !nx.brk ? nx.p.clone().sub(d.p).normalize() : (dabs[i - 1] ? d.p.clone().sub(dabs[i - 1].p).normalize() : new THREE.Vector3(1, 0, 0));
          const w = THREE.MathUtils.clamp(d.p.distanceTo(v.eye) * 0.045, 0.3, 1.2);
          paint.add(d.p, d.n, dir, w);
          g.slip?.addDisc(d.p, d.n, w * 0.6, 14);
        }
        paint.gap();
        sfx.inkDab?.(1);
        this.game.events?.emit('brush.glyph', { technique: 'wash', n: dabs.length, sigils: 0 });
        return dabs.length;
      },
    };
  }

  // ---------------------------------------------------------------- shared bits
  puff(at) {
    const g = this.game, c = new THREE.Color(0xf6e6c8);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; g.fx.alpha.emit({ pos: at.clone().setY(at.y + 0.1), vel: new THREE.Vector3(Math.cos(a) * 3, 2.5 + simRand() * 2, Math.sin(a) * 3), life: 0.5, size: 0.12, sizeEnd: 0.5, color: c, alpha: 0.35, drag: 4 }); }
  }
  /** Slip bursts out round a point on the ground (it shoves; it does not break). */
  splash(at, k = 1) {
    const g = this.game, P = this.tool.P;
    const down = g.physics.raycast(at.clone().setY(at.y + 0.4), new THREE.Vector3(0, -1, 0), 2, P.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (down) g.shells?.addPool(down.point, down.normal, true);
    for (let i = 0; i < 16 * k; i++) { const a = simRand() * Math.PI * 2; g.shells?.addDroplet(at.clone().setY(at.y + 0.2), new THREE.Vector3(Math.cos(a) * (3 + simRand() * 3), 3 + simRand() * 3, Math.sin(a) * (3 + simRand() * 3)), 0.035, true); }
    for (const c of g.clappers?.list || []) if (c.alive && c.pos.distanceTo(at) < 2.6 * k) g.clappers.knock(c, c.pos.clone().sub(at).setY(0).normalize().multiplyScalar(6).setY(4));
    P.shake = Math.max(P.shake, 0.25 * k);
  }

  // ---------------------------------------------------------------- per frame (world time)
  update(dt) {
    const g = this.game, P = this.tool.P;
    if (this.plungeWatch && P.grounded) { this.plungeWatch = false; this.splash(P.pos, 1.3); }
    for (let i = this.live.length - 1; i >= 0; i--) {
      const q = this.live[i];
      q.t += dt;
      const k = q.t / 0.28;
      if (k >= 1) { for (const l of q.parts) { g.scene.remove(l); l.geometry.dispose(); l.material.dispose(); } this.live.splice(i, 1); continue; }
      q.parts[0].material.opacity = 1 - k; q.parts[1].material.opacity = 0.6 * (1 - k);
    }
  }

  clear() {
    for (const q of this.live) for (const o of q.parts) { this.game.scene.remove(o); o.geometry?.dispose(); o.material?.dispose(); }
    this.live.length = 0; this.plungeWatch = false;
  }
}
