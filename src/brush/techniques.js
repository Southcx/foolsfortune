// ---------------------------------------------------------------------------------------
// BRUSH TECHNIQUES: what a drawing on the Celestial Brush's canvas does to the world. The canvas is the screen, so a drawing is read
// against the view it was drawn over: a line through a thing on the screen cuts that thing, a circle round a thing on the screen holds
// that thing, a mark over a thing acts on that thing (a ray from the eye through the mark), and a mark over nothing acts on the
// Courier. Each is planned the moment it is recognised (what it will touch, what it costs) and RUN when the brush is put down and time
// comes back, as in Okami, where the painting takes when the brush lifts. Every drawing that is also a Magic Cat Academy mark
// (a stroke across or down, a V, a caret, a bolt) takes that mark off the clapperjars' sigil queues too (sigils.js).
//
//   line    REND       Okami's Power Slash: a cut along the line, through everything it crosses on the screen (a plane through the eye
//                      and the line: the same mesh slicer as the Cleave shell and blade mode). Sliceable things come apart; jars break.
//   circle  MEND       Okami's Rejuvenation and Bloom: what is inside the circle is made whole: cracked pots are mended with gold,
//                      wrecks rebuilt where they fell, and a clapperjar held in it is befriended (the Caster's hatch, casters.js).
//   bomb    EMBER      Okami's Cherry Bomb (a circle and a fuse from inside it out): a bomb of ink where it was drawn, a second's fuse.
//   spiral  GALE       Okami's Galestorm: a gust the way the spiral ended up going. It throws what is loose, carries the Courier
//                      a little in the air, and in the dunes the wind itself turns to blow that way for a while (the skiff sails on it).
//   bolt    BOLT       Magic Cat Academy's lightning, Okami's Thunderstorm: a strike where it is drawn. Jars are stunned, pots burst.
//   caret   RISE       up: what is under it is thrown up; drawn over nothing, the Courier is.
//   vee     PLUNGE     down: what is under it is driven down; over nothing, the Courier dives (or, on the ground, bursts slip about her).
//   heart   SOLACE     Magic Cat Academy's heart: every clapperjar in view forgets itself and dances; the god-hand's vessel is soothed.
//   (other) WASH       a drawing that is none of these is laid on the world as slip, where the strokes pass over surfaces (Splatoon's
//                      ink on anything, Okami's brush on the world itself). It costs by the length laid.
// ---------------------------------------------------------------------------------------
import * as THREE from 'three';
import { sfx } from '../audio.js';
import { planeFrom } from '../slicing.js';
import { registered, hasTag } from '../tags.js';
import { inside } from './gesture.js';
import { SIGIL_OF } from './sigils.js';

export const TECHNIQUES = {
  line: { id: 'rend', name: 'REND', cost: 3 },
  circle: { id: 'mend', name: 'MEND', cost: 5 },
  bomb: { id: 'ember', name: 'EMBER', cost: 6 },
  spiral: { id: 'gale', name: 'GALE', cost: 5 },
  bolt: { id: 'bolt', name: 'BOLT', cost: 7 },
  caret: { id: 'rise', name: 'RISE', cost: 3 },
  vee: { id: 'plunge', name: 'PLUNGE', cost: 3 },
  heart: { id: 'solace', name: 'SOLACE', cost: 6 },
};
/** The ink's tint when a drawing takes (the canvas's flash), by technique. */
export const TINT = { rend: '#fff1dc', mend: '#f2c35a', ember: '#ff7a3a', gale: '#bfe6e0', bolt: '#d8c6ff', rise: '#f6e6c8', plunge: '#e8ab86', solace: '#ff9ab0', wash: '#e8ab86' };

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
  return { x: (_w.x + 1) / 2 * v.W, y: (1 - _w.y) / 2 * v.H, z };
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
  for (const ent of [...B.slices, ...(g.level?.dynamic || []).filter((e) => hasTag(e, 'sliceable')), ...registered('sliceable')]) {
    const sp = sphereOf(ent);
    if (sp) out.push({ kind: 'piece', ent, pos: sp.center.clone(), r: sp.radius });
  }
  for (const c of g.clappers?.list || []) if (c.alive) out.push({ kind: 'clapper', ent: c, pos: c.pos.clone().setY(c.pos.y + 0.35), r: 0.45 });
  return out;
}
/** The things whose picture lies within `pad` px (and their own size) of a screen point, nearest the point first. */
function under(g, v, x, y, pad = 50, max = 40) {
  const out = [];
  for (const t of things(g)) {
    const s = toScreen(v, t.pos);
    if (!s || s.z > max) continue;
    const d = Math.hypot(s.x - x, s.y - y);
    if (d <= pad + pxOf(v, t.r, s.z)) out.push({ ...t, d, z: s.z });
  }
  return out.sort((a, b) => a.d - b.d);
}
/** The first solid surface under a screen point. */
function cast(g, v, x, y, max = 40, staticOnly = false) {
  const r = ray(v, x, y);
  const hit = g.physics.raycast(r.o, r.d, max, g.player.collider, undefined, (c) => !c.isSensor() && (!staticOnly || !c.parent()?.isDynamic()));
  return { ...r, hit };
}
const segDist = (p, a, b) => { const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy; const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0; return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy); };

export class BrushTechniques {
  constructor(tool) {
    this.tool = tool;
    this.live = []; // things with a life of their own (a lit bomb, a bolt's afterglow)
    this.plungeWatch = false;
  }
  get game() { return this.tool.game; }

  /** A recognised drawing (or null: a wash) -> a plan { id, cost, empty, run() } for it, read against the view it was drawn over. */
  plan(rec, v) {
    if (!rec) return this.wash(v);
    const def = TECHNIQUES[rec.name];
    const p = this[def.id](rec, v);
    if (!p) return null;
    const sigil = rec.sigil ? SIGIL_OF[rec.sigil] : null;
    const run = p.run;
    p.run = () => {
      const n = run() ?? 0;
      let s = null;
      if (sigil) { s = this.tool.sigils.pop(sigil); if (s.popped) this.game.events?.emit('sigil.pop', { sigil, popped: s.popped, cleared: s.cleared }); }
      this.game.events?.emit('brush.glyph', { technique: def.id, n, sigils: s?.popped || 0 });
    };
    return { id: def.id, name: def.name, cost: p.empty ? 0 : def.cost, ...p };
  }

  // ---------------------------------------------------------------- the techniques
  rend(rec, v) {
    const g = this.game, s0 = rec.strokes[0], a = s0[0], b = s0[s0.length - 1];
    const A = ray(v, a.x, a.y), Bq = ray(v, b.x, b.y);
    const n = new THREE.Vector3().crossVectors(A.d, Bq.d).normalize();
    const plane = planeFrom(n, v.eye);
    const cutDir = Bq.d.clone().sub(A.d).normalize();
    const hits = [];
    for (const t of things(g)) {
      const s = toScreen(v, t.pos);
      if (!s || s.z > 30) continue;
      if (segDist(s, a, b) <= 18 + pxOf(v, t.r, s.z) * 0.8) hits.push({ ...t, z: s.z });
    }
    const depth = hits.length ? Math.min(...hits.map((h) => h.z)) : 6;
    return {
      run: () => {
        let n2 = 0;
        for (const h of hits) {
          if (h.kind === 'clapper') { if (h.ent.alive) { g.clappers.hit(h.ent, h.ent.pos.clone().setY(h.ent.pos.y + 0.35), cutDir, 1.6, 'rend'); n2++; } continue; }
          if (g.breakables.slice(h.ent, plane, cutDir)) n2++;
        }
        const pa = v.eye.clone().addScaledVector(A.d, depth), pb = v.eye.clone().addScaledVector(Bq.d, depth);
        g.fx.slash(pa, pb, n);
        sfx.brushRend?.();
        this.tool.P.shake = Math.max(this.tool.P.shake, 0.15);
        return n2;
      },
    };
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
    const g = this.game, c = cast(g, v, rec.center.x, rec.center.y, 30);
    const at = c.hit ? c.hit.point.clone().addScaledVector(c.hit.normal, 0.25) : c.o.clone().addScaledVector(c.d, 9);
    return {
      run: () => {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), new THREE.MeshStandardMaterial({ color: 0x17111a, roughness: 0.2, metalness: 0.3, emissive: 0x6a3aa8, emissiveIntensity: 0.4, flatShading: true }));
        m.position.copy(at);
        g.scene.add(m);
        sfx.fuse?.();
        this.live.push({ kind: 'bomb', m, t: 0, fuse: 1.1 });
        return 1;
      },
    };
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
        g.physics.world.forEachRigidBody((b) => {
          if (!b.isDynamic() || g.physics.links.has(b.handle)) return;
          const t = b.translation(); _v.set(t.x - from.x, t.y - from.y, t.z - from.z);
          const d = _v.length(); if (d > reach || d < 0.1 || _v.normalize().dot(dir) < cone) return;
          const ent = b.numColliders() ? g.physics.entityOf(b.collider(0)) : null;
          if (ent?.type === 'player') return;
          g.breakables.instigate(ent, 'courier'); // (what it throws and breaks is hers)
          const k = 11 * strength * (1 - d / reach * 0.6) * b.mass();
          g.physics.kick(b, { x: dir.x * k, y: (dir.y + 0.35) * k, z: dir.z * k });
          n++;
        });
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
    const normal = c.hit ? c.hit.normal.clone() : UP.clone();
    return {
      run: () => {
        let n = 0;
        this.lightning(at);
        for (const cl of g.clappers?.list || []) if (cl.alive && cl.pos.distanceTo(at) < 3.5) { g.clappers.stun(cl, 3.5, g.shells.glowOutline, g.shells.xray); n++; }
        for (const e of [...g.breakables.items]) {
          if (!e.alive || e.def?.trial) continue;
          const t = e.body.translation(), p = new THREE.Vector3(t.x, t.y + 0.3, t.z), d = p.distanceTo(at);
          if (d < 1.8) { g.breakables.shatter(e, p, p.clone().sub(at).setY(0.5).normalize(), 1.3, 'bolt', 'courier'); n++; }
          else if (d < 3.6) g.breakables.damage(e, 40, p, p.clone().sub(at).normalize(), 0.8, false, 'courier');
        }
        if (c.hit && !c.hit.collider.parent()?.isDynamic()) g.shells?.addSplat(at, normal, 1.1, false);
        this.tool.P.shake = Math.max(this.tool.P.shake, 0.35);
        sfx.thunder?.(g.listenerDistance?.(at) ?? 0);
        return n;
      },
    };
  }

  /** A strike from the sky to a point: a jagged line, bright for a moment, and one flash (not a strobe). */
  lightning(at) {
    const g = this.game, pts = [], top = at.clone().add(new THREE.Vector3((Math.random() - 0.5) * 6, 28, (Math.random() - 0.5) * 6));
    const N = 12;
    for (let i = 0; i <= N; i++) {
      const u = i / N, p = top.clone().lerp(at, u);
      if (i > 0 && i < N) p.add(new THREE.Vector3((Math.random() - 0.5) * 1.6, 0, (Math.random() - 0.5) * 1.6).multiplyScalar(1 - u * 0.6));
      pts.push(p);
    }
    const mk = (color, opacity) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); l.frustumCulled = false; l.renderOrder = 8; g.scene.add(l); return l; };
    this.live.push({ kind: 'bolt', parts: [mk(0xffffff, 1), mk(0xb892ff, 0.6)], t: 0 });
    if (g.fx.boomLight) { g.fx.boomLight.position.copy(at).y += 1.5; g.fx.boomLight.intensity = 110; g.fx.boomT = 0.22; }
    const c = new THREE.Color(0xd8c6ff);
    for (let i = 0; i < 30; i++) g.fx.add.emit({ pos: at, vel: new THREE.Vector3().randomDirection().multiplyScalar(2 + Math.random() * 5).setY(Math.random() * 5), life: 0.3 + Math.random() * 0.3, size: 0.05, sizeEnd: 0.01, color: c, drag: 2, twinkle: 30 });
  }

  rise(rec, v) {
    const g = this.game, t = under(g, v, rec.center.x, rec.center.y, 45)[0];
    return {
      run: () => {
        const P = this.tool.P;
        if (t) {
          if (t.kind === 'clapper') { if (t.ent.alive) g.clappers.knock(t.ent, new THREE.Vector3(0, 12, 0)); }
          else if (t.ent.body?.isValid?.() && t.ent.body.isDynamic()) { g.breakables.instigate(t.ent, 'courier'); g.physics.kick(t.ent.body, { x: 0, y: 9 * t.ent.body.mass(), z: 0 }); }
          this.puff(t.pos);
        } else {
          P.vel.y = Math.max(P.vel.y, 0);
          P.impulse(new THREE.Vector3(0, 11, 0), 'rise');
          this.puff(P.pos);
        }
        sfx.rise?.();
        return t ? 1 : 0;
      },
    };
  }

  plunge(rec, v) {
    const g = this.game, t = under(g, v, rec.center.x, rec.center.y, 45)[0];
    return {
      run: () => {
        const P = this.tool.P;
        if (t) {
          if (t.kind === 'clapper') { if (t.ent.alive) { if (!t.ent.grounded) g.clappers.knock(t.ent, new THREE.Vector3(0, -20, 0)); else g.clappers.hit(t.ent, t.pos, new THREE.Vector3(0, -1, 0), 1.2, 'plunged'); } }
          else if (t.kind === 'pot' && t.ent.alive) g.breakables.shatter(t.ent, t.pos, new THREE.Vector3(0, -1, 0), 1.2, 'plunged', 'courier');
          else if (t.ent.body?.isValid?.() && t.ent.body.isDynamic()) { g.breakables.instigate(t.ent, 'courier'); g.physics.kick(t.ent.body, { x: 0, y: -12 * t.ent.body.mass(), z: 0 }); }
          sfx.brushSlam?.(0.6);
          return 1;
        }
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
    const vessel = g.god?.active && g.god.vessel?.alive ? g.god.vessel : null;
    if (!jars.length && !vessel) return { empty: true, run: () => 0 };
    return {
      run: () => {
        for (const c of jars) {
          if (!c.alive) continue;
          c.state = 'dance'; c.twirl = 0; c.timer = 6; c.clapT = 0.3; c.clapRate = 10;
          g.glyphs?.pop('note', c.pos.clone().setY(c.pos.y + 1.1), { color: 0xff9ab0, size: 0.45, life: 1.4 });
        }
        if (vessel) vessel.hp = Math.min(vessel.max, vessel.hp + 25);
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
      for (let i = 1; i < s.length; i++) {
        acc += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
        if (acc < 14 && i < s.length - 1) continue;
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
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; g.fx.alpha.emit({ pos: at.clone().setY(at.y + 0.1), vel: new THREE.Vector3(Math.cos(a) * 3, 2.5 + Math.random() * 2, Math.sin(a) * 3), life: 0.5, size: 0.12, sizeEnd: 0.5, color: c, alpha: 0.35, drag: 4 }); }
  }
  /** Slip bursts out round a point on the ground. */
  splash(at, k = 1) {
    const g = this.game, P = this.tool.P;
    const down = g.physics.raycast(at.clone().setY(at.y + 0.4), new THREE.Vector3(0, -1, 0), 2, P.collider, undefined, (c) => !c.isSensor() && !c.parent()?.isDynamic());
    if (down) g.shells?.addPool(down.point, down.normal, true);
    for (let i = 0; i < 16 * k; i++) { const a = Math.random() * Math.PI * 2; g.shells?.addDroplet(at.clone().setY(at.y + 0.2), new THREE.Vector3(Math.cos(a) * (3 + Math.random() * 3), 3 + Math.random() * 3, Math.sin(a) * (3 + Math.random() * 3)), 0.035, true); }
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
      if (q.kind === 'bomb') {
        q.m.rotation.y += dt * 3;
        const k = q.t / q.fuse;
        q.m.scale.setScalar(1 + 0.25 * k + 0.08 * Math.sin(q.t * 30) * k);
        if (Math.random() < 0.6) g.fx.add.emit({ pos: q.m.position.clone().add(new THREE.Vector3(0, 0.28, 0)), vel: new THREE.Vector3((Math.random() - 0.5) * 2, 2, (Math.random() - 0.5) * 2), life: 0.25, size: 0.04, sizeEnd: 0.01, color: new THREE.Color(0xffb27a), drag: 2 });
        if (k >= 1) {
          g.scene.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); this.live.splice(i, 1);
          g.breakables.explode(q.m.position.clone(), { radius: 3.4, cause: 'bomb', who: 'courier' });
        }
      } else if (q.kind === 'bolt') {
        const k = q.t / 0.28;
        if (k >= 1) { for (const l of q.parts) { g.scene.remove(l); l.geometry.dispose(); l.material.dispose(); } this.live.splice(i, 1); continue; }
        q.parts[0].material.opacity = 1 - k; q.parts[1].material.opacity = 0.6 * (1 - k);
      }
    }
  }

  clear() {
    for (const q of this.live) { for (const o of q.parts || [q.m]) { this.game.scene.remove(o); o.geometry?.dispose(); o.material?.dispose(); } }
    this.live.length = 0; this.plungeWatch = false;
  }
}
